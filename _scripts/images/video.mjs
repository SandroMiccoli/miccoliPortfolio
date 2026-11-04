#!/usr/bin/env node
/**
 * Gera, a partir de um vídeo original, um MP4 leve para a web (H.264, sem áudio,
 * faststart) e um poster JPG. Requer ffmpeg instalado. O original não é alterado.
 *
 * Uso (a partir de _scripts/images):
 *   node video.mjs ../../images/contained/contained-pre-release.mp4
 *   node video.mjs <arquivo> --crf 26 --poster-at 2
 *
 * Saída, ao lado do original: <nome>-web.mp4 e <nome>-poster.jpg
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const args = process.argv.slice(2);
const input = args.find((a) => !a.startsWith('--') && !/^\d+(\.\d+)?$/.test(a));
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

if (!input) {
  console.error('Uso: node video.mjs <arquivo.mp4> [--crf 32] [--poster-at 1]');
  process.exit(1);
}

const crf = opt('crf', '32');
const posterAt = opt('poster-at', '1');
const { dir, name } = path.parse(path.resolve(input));
const mp4 = path.join(dir, `${name}-web.mp4`);
const poster = path.join(dir, `${name}-poster.jpg`);

function ffmpeg(argv) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...argv], { stdio: 'inherit' });
  if (r.error || r.status !== 0) {
    console.error('Falha ao executar o ffmpeg (instalado?).');
    process.exit(r.status ?? 1);
  }
}

ffmpeg([
  '-i', input,
  '-an',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', crf,
  '-profile:v', 'main', '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart',
  mp4,
]);
ffmpeg(['-ss', posterAt, '-i', input, '-frames:v', '1', '-q:v', '3', poster]);

console.log(`ok: ${mp4}\nok: ${poster}`);
