#!/usr/bin/env node
/**
 * Gera derivados otimizados (WebP + JPG de fallback, AVIF opcional) das imagens
 * usadas pelo site e atualiza o manifesto _data/images.json, que o include
 * _includes/img.html lê para montar <picture>/srcset/width/height.
 *
 * Os originais em images/ nunca são alterados nem apagados.
 *
 * Uso (a partir de _scripts/images):
 *   npm install                       # uma vez
 *   npm run images                    # processa tudo que _projects/, _pages/, _layouts/ e index.html referenciam
 *   npm run images -- images/novo     # processa todas as imagens de uma pasta (ou arquivos)
 *   npm run images -- --force         # reprocessa mesmo que o original não tenha mudado
 *   npm run images -- --avif          # gera também AVIF (mais lento, ~20% menor que WebP)
 *   npm run images -- --dry-run       # só lista o que seria feito
 */
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT_DIR = 'images/optimized';
const MANIFEST = path.join(REPO, '_data', 'images.json');

const WIDTHS = [400, 800, 1600];
const FALLBACK_WIDTH = 800;
const QUALITY = { webp: 78, avif: 55, jpg: 80 };
// O fundo do site é preto; transparência (quase sempre ~99% opaca nos PNGs atuais) é achatada sobre ele.
const FLATTEN_BG = '#000000';
const SCAN_TARGETS = ['_projects', '_pages', '_layouts', '_includes', 'index.html'];
const IMAGE_EXT = /\.(jpe?g|png)$/i;
const CONCURRENCY = 3;

sharp.cache(false);

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const targets = args.filter((a) => !a.startsWith('--'));
const FORMATS = flags.has('--avif') ? ['avif', 'webp'] : ['webp'];
const FORCE = flags.has('--force');
const DRY = flags.has('--dry-run');

const toPosix = (p) => p.split(path.sep).join('/');

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

async function referencedImages() {
  const files = [];
  for (const t of SCAN_TARGETS) {
    const full = path.join(REPO, t);
    const stat = await fs.stat(full).catch(() => null);
    if (!stat) continue;
    if (stat.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  const found = new Set();
  const re = /["'](\/images\/[^"']+?\.(?:jpe?g|png))["']/gi;
  for (const f of files) {
    if (!/\.(md|html)$/.test(f)) continue;
    const text = await fs.readFile(f, 'utf8');
    for (const m of text.matchAll(re)) found.add(m[1]);
  }
  return [...found].filter((p) => !p.startsWith(`/${OUT_DIR}/`));
}

async function explicitImages() {
  const found = [];
  for (const t of targets) {
    const full = path.resolve(process.cwd(), t);
    const stat = await fs.stat(full).catch(() => null);
    if (!stat) {
      console.warn(`! não encontrado: ${t}`);
      continue;
    }
    const list = stat.isDirectory() ? await walk(full) : [full];
    for (const f of list) {
      if (!IMAGE_EXT.test(f)) continue;
      const rel = toPosix(path.relative(REPO, f));
      if (!rel.startsWith('images/') || rel.startsWith(`${OUT_DIR}/`) || rel.startsWith('images/_')) continue;
      found.push(`/${rel}`);
    }
  }
  return found;
}

function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function baseFor(src, taken) {
  const rel = src.replace(/^\/images\//, '');
  const dir = path.posix.dirname(rel);
  const stem = path.posix.basename(rel).replace(/\.[^.]+$/, '');
  const short = createHash('sha1').update(src).digest('hex').slice(0, 6);
  let slug = slugify(stem) || short;
  if (slug.length > 60) slug = `${slug.slice(0, 48).replace(/-+$/, '')}-${short}`;
  const dirSlug = dir === '.' ? '' : dir.split('/').map((d) => slugify(d) || d).join('/');
  let base = `/${OUT_DIR}/${dirSlug ? `${dirSlug}/` : ''}${slug}`;
  if (taken.has(base) && taken.get(base) !== src) base = `${base}-${short}`;
  taken.set(base, src);
  return base;
}

function widthsFor(origW) {
  const largest = WIDTHS[WIDTHS.length - 1];
  const w = WIDTHS.filter((x) => x < origW && x <= largest);
  const top = Math.min(origW, largest);
  if (!w.includes(top)) w.push(top);
  return w;
}

async function exists(p) {
  return fs.access(p).then(() => true, () => false);
}

function derivativePaths(entry) {
  const list = [];
  for (const fmt of entry.formats) for (const w of entry.widths) list.push(`${entry.base}-${w}.${fmt}`);
  list.push(`${entry.base}-${entry.fallback}.jpg`);
  return list;
}

async function processOne(src, manifest, taken) {
  const file = path.join(REPO, src);
  if (!(await exists(file))) {
    console.warn(`! original ausente, ignorado: ${src}`);
    return { src, status: 'missing' };
  }
  const buf = await fs.readFile(file);
  const hash = createHash('sha1').update(buf).digest('hex').slice(0, 12);
  const prev = manifest[src];
  const base = prev?.base ?? baseFor(src, taken);
  if (prev) taken.set(prev.base, src);

  const meta = await sharp(buf, { limitInputPixels: false }).metadata();
  const swap = (meta.orientation ?? 1) >= 5;
  const origW = swap ? meta.height : meta.width;
  const origH = swap ? meta.width : meta.height;

  const entry = {
    w: origW,
    h: origH,
    base,
    widths: widthsFor(origW),
    fallback: Math.min(origW, FALLBACK_WIDTH),
    formats: FORMATS,
    hash,
  };

  const needed = derivativePaths(entry);
  const upToDate =
    !FORCE &&
    prev &&
    prev.hash === hash &&
    FORMATS.every((f) => prev.formats.includes(f)) &&
    (await Promise.all(needed.map((p) => exists(path.join(REPO, p))))).every(Boolean);
  if (upToDate) return { src, status: 'skip', entry };

  if (DRY) return { src, status: 'would', entry };

  await fs.mkdir(path.dirname(path.join(REPO, base)), { recursive: true });
  const pipeline = () => sharp(buf, { limitInputPixels: false }).rotate().flatten({ background: FLATTEN_BG });
  const jobs = [];
  for (const w of entry.widths) {
    for (const fmt of entry.formats) {
      const out = path.join(REPO, `${base}-${w}.${fmt}`);
      const p = pipeline().resize({ width: w, withoutEnlargement: true });
      jobs.push(
        fmt === 'avif'
          ? p.avif({ quality: QUALITY.avif, effort: 4 }).toFile(out)
          : p.webp({ quality: QUALITY.webp, effort: 5, smartSubsample: true }).toFile(out),
      );
    }
  }
  jobs.push(
    pipeline()
      .resize({ width: entry.fallback, withoutEnlargement: true })
      .jpeg({ quality: QUALITY.jpg, mozjpeg: true })
      .toFile(path.join(REPO, `${base}-${entry.fallback}.jpg`)),
  );
  await Promise.all(jobs);
  return { src, status: 'done', entry, alpha: Boolean(meta.hasAlpha) };
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(MANIFEST, 'utf8').catch(() => '{}'));
  const taken = new Map(Object.entries(manifest).map(([src, e]) => [e.base, src]));
  const sources = [...new Set(targets.length ? await explicitImages() : await referencedImages())].sort();
  if (!sources.length) {
    console.log('Nenhuma imagem encontrada.');
    return;
  }
  console.log(`${sources.length} imagem(ns) | formatos: ${FORMATS.join('+')}+jpg | larguras: ${WIDTHS.join('/')}`);

  const stats = { done: 0, skip: 0, would: 0, missing: 0 };
  let i = 0;
  async function worker() {
    while (i < sources.length) {
      const src = sources[i++];
      const res = await processOne(src, manifest, taken);
      stats[res.status]++;
      if (res.entry) manifest[src] = res.entry;
      if (res.status !== 'skip' && res.status !== 'missing') {
        console.log(`[${i}/${sources.length}] ${res.status === 'would' ? 'processaria' : 'ok'} ${src}${res.alpha ? ' (tem alpha: achatado sobre preto)' : ''}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  if (!DRY) {
    const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
    await fs.mkdir(path.dirname(MANIFEST), { recursive: true });
    await fs.writeFile(MANIFEST, `${JSON.stringify(sorted, null, 1)}\n`);
  }
  console.log(`Concluído: ${stats.done} gerada(s), ${stats.skip} já atualizada(s), ${stats.would} a gerar (dry-run), ${stats.missing} ausente(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
