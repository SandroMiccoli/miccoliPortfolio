/** Demo page. The embed is `mountCircuitMindLogo` / `mountCircuitMind404`. See README.md. */

import {
  DEFAULTS,
  DEFAULT_POINTS,
  mountCircuitMind404,
  mountCircuitMindLogo,
} from './circuit-mind.js';
import { downloadBlob, exportLoop } from './export.js';
import { mountPanel } from './gui.js';

const STORAGE_KEY = 'vanilla-js-circuit-mind-logo-v6';

const REF_RANGES = {
  refOpacity: [0, 1],
  refScale: [0.2, 1.8],
  refX: [-40, 40],
  refY: [-40, 40],
};

const root = document.querySelector('.cm-demo');
const stageLogo = document.getElementById('cm-stage-logo');
const stage404 = document.getElementById('cm-stage-404');
const logoHost = document.getElementById('cm-logo');
const fourHost = document.getElementById('cm-404');
const sceneLogo = document.getElementById('cm-scene-logo');
const sceneFour = document.getElementById('cm-scene-404');
const exportStatus = document.getElementById('cm-export-status');

if (!(root instanceof HTMLElement)
  || !(stageLogo instanceof HTMLElement)
  || !(stage404 instanceof HTMLElement)
  || !(logoHost instanceof HTMLElement)
  || !(fourHost instanceof HTMLElement)
  || !(sceneLogo instanceof HTMLButtonElement)
  || !(sceneFour instanceof HTMLButtonElement)
  || !(exportStatus instanceof HTMLButtonElement)) {
  throw new Error('Demo markup is missing a stage');
}

const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const settings = structuredClone(DEFAULTS);
const points = structuredClone(DEFAULT_POINTS);
const ref = {
  showRef: false,
  refOpacity: 0.45,
  refScale: 1,
  refX: 0,
  refY: 0,
};
let scene = 'logo';

/**
 * @param {unknown} value
 * @param {number} fallback
 * @param {number} min
 * @param {number} max
 */
function num(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * @param {unknown} value
 * @param {string} fallback
 */
function hex(value, fallback) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    const savedState = saved.state || {};
    const savedPoints = saved.points || {};
    for (const key of Object.keys(DEFAULTS)) {
      const fallback = DEFAULTS[key];
      const value = savedState[key];
      if (typeof fallback === 'number') {
        settings[key] = num(value, fallback, 0, 600);
      } else if (typeof fallback === 'boolean') {
        settings[key] = typeof value === 'boolean' ? value : fallback;
      } else if (key === 'background') {
        settings[key] = value === 'transparent' ? 'transparent' : hex(value, String(fallback));
      } else {
        settings[key] = hex(value, String(fallback));
      }
    }
    for (const key of Object.keys(REF_RANGES)) {
      const range = REF_RANGES[key];
      ref[key] = num(savedState[key], ref[key], range[0], range[1]);
    }
    if (typeof savedState.showRef === 'boolean') ref.showRef = savedState.showRef;
    scene = savedState.scene === '404' ? '404' : 'logo';
    for (const key of Object.keys(DEFAULT_POINTS)) {
      const point = savedPoints[key] || {};
      points[key].x = num(point.x, DEFAULT_POINTS[key].x, 0, 360);
      points[key].y = num(point.y, DEFAULT_POINTS[key].y, 0, 360);
    }
    return true;
  } catch {
    return false;
  }
}

const hadSave = load();
if (hadSave && settings.node === 6.2) settings.node = DEFAULTS.node;
if (hadSave && settings.speed === 96) settings.speed = DEFAULTS.speed;
if (hadSave && settings.packet === 62) settings.packet = DEFAULTS.packet;
if (hadSave && Math.abs(points.topPeak.x - 151.75) < 0.02) points.topPeak.x = DEFAULT_POINTS.topPeak.x;
if (hadSave && Math.abs(points.topB.y - 88.15) < 0.02 && Math.abs(points.topB.x - 228) < 0.02) {
  points.topB.y = DEFAULT_POINTS.topB.y;
}
if (hadSave && Math.abs(points.mMid.x - 156) < 0.02) points.mMid.x = DEFAULT_POINTS.mMid.x;
if (reduceQuery.matches && !hadSave) settings.playing = false;
if (reduceQuery.matches && hadSave && settings.playing) settings.forceMotion = true;

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    state: { ...settings, ...ref, scene },
    points: structuredClone(points),
  }));
}

function syncPage() {
  const background = String(settings.background);
  document.documentElement.style.background = background;
  document.body.style.background = background;
  root.style.background = background;
}

function syncRef() {
  stageLogo.style.setProperty('--ref-opacity', ref.showRef ? String(ref.refOpacity) : '0');
  stageLogo.style.setProperty('--ref-x', `${ref.refX}%`);
  stageLogo.style.setProperty('--ref-y', `${ref.refY}%`);
  stageLogo.style.setProperty('--ref-scale', String(ref.refScale));
}

function syncScenes() {
  const on404 = scene === '404';
  stageLogo.classList.toggle('is-off', on404);
  stage404.classList.toggle('is-off', !on404);
  stageLogo.setAttribute('aria-hidden', on404 ? 'true' : 'false');
  stage404.setAttribute('aria-hidden', on404 ? 'false' : 'true');
  stageLogo.inert = on404;
  stage404.inert = !on404;
  sceneLogo.setAttribute('aria-selected', on404 ? 'false' : 'true');
  sceneFour.setAttribute('aria-selected', on404 ? 'true' : 'false');
  sceneLogo.tabIndex = on404 ? -1 : 0;
  sceneFour.tabIndex = on404 ? 0 : -1;
}

syncScenes();
syncPage();
syncRef();

const logo = mountCircuitMindLogo(logoHost, {
  settings,
  points,
  pointerRoot: stageLogo,
  active: scene === 'logo',
});
const four = mountCircuitMind404(fourHost, {
  settings,
  pointerRoot: stage404,
  active: scene === '404',
});

function activeMark() {
  return scene === '404' ? four : logo;
}

/**
 * @param {'logo' | '404'} next
 */
function setScene(next) {
  if (exporting) return;
  scene = next;
  syncScenes();
  logo.setActive(scene === 'logo');
  four.setActive(scene === '404');
  save();
}

/**
 * @param {'logo' | '404'} next
 */
function focusScene(next) {
  setScene(next);
  (next === '404' ? sceneFour : sceneLogo).focus();
}

let exporting = false;
/** @type {{ blob: Blob, name: string } | null} */
let pendingDownload = null;
let panel = null;

/**
 * @param {string} label
 * @param {string} text
 * @param {boolean} [ready]
 */
function showExportProgress(label, text, ready = false) {
  panel?.setExportLabel(label);
  exportStatus.hidden = !text;
  exportStatus.textContent = text || '';
  exportStatus.disabled = !ready;
}

function setLocked(locked) {
  panel?.lock(locked);
  sceneLogo.disabled = locked;
  sceneFour.disabled = locked;
}

function onExportClick() {
  if (pendingDownload) {
    downloadBlob(pendingDownload.blob, pendingDownload.name);
    pendingDownload = null;
    showExportProgress('Export loop', '');
    return;
  }
  startExport();
}

async function startExport() {
  if (exporting) return;
  pendingDownload = null;
  const mark = activeMark();
  exporting = true;
  root.classList.add('is-exporting');
  setLocked(true);
  showExportProgress('Exporting…', 'Exporting loop');
  try {
    const blob = await exportLoop(mark, {
      onProgress(percent) {
        if (!percent) {
          showExportProgress('Exporting…', 'Exporting loop');
          return;
        }
        showExportProgress(`Export ${percent}%`, `Exporting ${percent}%`);
      },
    });
    const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
    pendingDownload = { blob, name: `circuit-mind-${scene}-loop.${ext}` };
    const mb = blob.size / (1024 * 1024);
    showExportProgress('Download', `Download · ${mb.toFixed(1)} MB`, true);
  } catch (error) {
    console.error(error);
    showExportProgress('Export failed', 'Export failed');
    window.setTimeout(() => {
      if (!exporting && !pendingDownload) showExportProgress('Export loop', '');
    }, 1800);
  } finally {
    exporting = false;
    root.classList.remove('is-exporting');
    setLocked(false);
  }
}

function applyDefaults() {
  const next = structuredClone(DEFAULTS);
  for (const key of Object.keys(DEFAULTS)) settings[key] = next[key];
  const nextPoints = structuredClone(DEFAULT_POINTS);
  for (const key of Object.keys(DEFAULT_POINTS)) {
    points[key].x = nextPoints[key].x;
    points[key].y = nextPoints[key].y;
  }
  ref.showRef = false;
  ref.refOpacity = 0.45;
  ref.refScale = 1;
  ref.refX = 0;
  ref.refY = 0;
  if (reduceQuery.matches) settings.playing = false;
}

panel = mountPanel({
  settings,
  points,
  ref,
  onEdit() {
    syncPage();
    syncRef();
  },
  onCommit: save,
  onPlay() {
    if (settings.playing && reduceQuery.matches) settings.forceMotion = true;
    if (!settings.playing) settings.forceMotion = false;
  },
  onReset() {
    applyDefaults();
    localStorage.removeItem(STORAGE_KEY);
    scene = 'logo';
    syncScenes();
    syncPage();
    syncRef();
    logo.setActive(true);
    four.setActive(false);
    panel?.refresh();
  },
  onCopy(rename) {
    const text = JSON.stringify({ state: { ...settings, ...ref, scene }, points: structuredClone(points) }, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      rename('Copied');
      window.setTimeout(() => rename('Copy values'), 1200);
    }).catch(() => {
      rename('Copy failed');
      window.setTimeout(() => rename('Copy values'), 1400);
    });
  },
  onExport: onExportClick,
});

sceneLogo.addEventListener('click', () => setScene('logo'));
sceneFour.addEventListener('click', () => setScene('404'));
sceneLogo.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') {
    event.preventDefault();
    focusScene('404');
  }
});
sceneFour.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    focusScene('logo');
  }
});
exportStatus.addEventListener('click', () => onExportClick());

reduceQuery.addEventListener('change', () => {
  if (reduceQuery.matches) {
    settings.playing = false;
    settings.forceMotion = false;
    panel?.refresh();
  }
  save();
});

window.addEventListener('pagehide', () => {
  logo.destroy();
  four.destroy();
  panel?.destroy();
});
