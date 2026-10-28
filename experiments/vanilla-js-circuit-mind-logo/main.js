import GUI from './vendor/lil-gui.esm.min.js';

const NS = 'http://www.w3.org/2000/svg';
const STORAGE_KEY = 'vanilla-js-circuit-mind-logo-v6';
const DOTS = 28;

const LOGO_VIEW = { w: 327, h: 310 };
const FOUR_VIEW = { w: 2442, h: 1014 };
const EXPORT_W = 1920;
const EXPORT_H = 1080;
const EXPORT_FPS = 60;

const DEFAULT_STATE = {
  showRef: false,
  refOpacity: 0.45,
  refScale: 1,
  refX: 0,
  refY: 0,
  trace: 1.25,
  node: 5.6,
  glow: 3.3,
  packet: 40,
  speed: 154,
  playing: true,
  showTraces: true,
  showNodes: true,
  showComets: true,
  showTop: true,
  showBot: true,
  showTrace: true,
  scene: 'logo',
  traceColor: '#F2F8FE',
  mint: '#1FC283',
  cyan: '#2D8AE8',
  background: '#020B16',
};

const DEFAULT_POINTS = {
  topA: { x: 75.5, y: 88.15 },
  topPeak: { x: 156.4, y: 41.1 },
  topB: { x: 228, y: 84 },
  botA: { x: 51, y: 157 },
  botB: { x: 51, y: 222.8 },
  botPeak: { x: 156.4, y: 284.3 },
  botC: { x: 228, y: 243 },
  mA: { x: 39, y: 107 },
  mMid: { x: 156.4, y: 177.2 },
  mElbow: { x: 262, y: 116 },
  mB: { x: 262, y: 229 },
  nodeLeft: { x: 47, y: 97 },
  nodeRight: { x: 250, y: 229 },
};

const COLOR_KEYS = new Set(['traceColor', 'mint', 'cyan', 'background']);

const NUMBER_RANGE = {
  refOpacity: [0, 1],
  refScale: [0.2, 1.8],
  refX: [-40, 40],
  refY: [-40, 40],
  trace: [0.6, 3.2],
  node: [3, 14],
  glow: [0, 10],
  packet: [16, 180],
  speed: [24, 280],
};

const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const state = structuredClone(DEFAULT_STATE);
const points = structuredClone(DEFAULT_POINTS);
let allowReducedMotion = false;
let elapsed = 0;
let lastStamp = 0;
let mm = null;
let gui = null;
let exportCtrl = null;
let exporting = false;
let pendingDownload = null;
let loopSample = null;
let loopProgress = 0;
let tickerOn = false;
let motionOn = false;
let burstHue = false;
let fadeSerial = 0;
const bursts = [];

const logoRoot = document.querySelector('.logo');
const board = document.getElementById('cm-board');
const stage = document.getElementById('cm-stage-logo');
const stage404 = document.getElementById('cm-stage-404');
const sceneLogo = document.getElementById('cm-scene-logo');
const sceneFour = document.getElementById('cm-scene-404');

const logoLayer = bindLayer('cm-traces', 'cm-nodes', 'cm-comets', 'cm-heads', 'cm-glow-wide', 'cm-glow');
const fourLayer = bindLayer('cm-404-traces', 'cm-404-nodes', 'cm-404-comets', 'cm-404-heads', 'cm-glow-wide-404', 'cm-glow-404');

function bindLayer(tracesId, nodesId, cometsId, headsId, blurId, filterId) {
  return {
    traces: document.getElementById(tracesId),
    nodes: document.getElementById(nodesId),
    comets: document.getElementById(cometsId),
    heads: document.getElementById(headsId),
    blur: document.getElementById(blurId),
    filterId,
    nodeList: [],
    items: [],
    unit: 1,
    stroke: 1.25,
    radius: 6,
  };
}

function num(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function hex(value, fallback) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

function bool(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function loadInto(target, targetPoints) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    const savedState = saved.state || {};
    const savedPoints = saved.points || {};
    for (const key of Object.keys(DEFAULT_STATE)) {
      const fallback = DEFAULT_STATE[key];
      const value = savedState[key];
      if (typeof fallback === 'number') {
        const range = NUMBER_RANGE[key] || [0, 600];
        target[key] = num(value, fallback, range[0], range[1]);
      } else if (typeof fallback === 'boolean') {
        target[key] = bool(value, fallback);
      } else if (key === 'scene') {
        target[key] = value === '404' ? '404' : 'logo';
      } else if (COLOR_KEYS.has(key)) {
        target[key] = hex(value, fallback);
      }
    }
    for (const key of Object.keys(DEFAULT_POINTS)) {
      const point = savedPoints[key] || {};
      targetPoints[key].x = num(point.x, DEFAULT_POINTS[key].x, 0, 360);
      targetPoints[key].y = num(point.y, DEFAULT_POINTS[key].y, 0, 360);
    }
    return true;
  } catch {
    return false;
  }
}

const hadSave = loadInto(state, points);
if (hadSave && state.node === 6.2) state.node = DEFAULT_STATE.node;
if (hadSave && state.speed === 96) state.speed = DEFAULT_STATE.speed;
if (hadSave && state.packet === 62) state.packet = DEFAULT_STATE.packet;
if (hadSave && Math.abs(points.topPeak.x - 151.75) < 0.02) points.topPeak.x = DEFAULT_POINTS.topPeak.x;
if (hadSave && Math.abs(points.topB.y - 88.15) < 0.02 && Math.abs(points.topB.x - 228) < 0.02) {
  points.topB.y = DEFAULT_POINTS.topB.y;
}
if (hadSave && Math.abs(points.mMid.x - 156) < 0.02) points.mMid.x = DEFAULT_POINTS.mMid.x;
if (reduceQuery.matches && state.playing) allowReducedMotion = hadSave;
if (!hadSave && reduceQuery.matches) state.playing = false;

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    state: { ...state },
    points: structuredClone(points),
  }));
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function mod(value, span) {
  if (span <= 0) return 0;
  return ((value % span) + span) % span;
}

function svgEl(name) {
  return document.createElementNS(NS, name);
}

function linePath(pts) {
  return pts
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${round(point.x)} ${round(point.y)}`)
    .join(' ');
}

function rgb(hexColor) {
  const n = Number.parseInt(hexColor.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(from, to, t) {
  const a = rgb(from);
  const b = rgb(to);
  const amount = Math.min(1, Math.max(0, t));
  const channels = a.map((channel, index) => Math.round(channel + (b[index] - channel) * amount));
  return `rgb(${channels[0]} ${channels[1]} ${channels[2]})`;
}

function addTrace(layer, spec) {
  const path = svgEl('path');
  path.setAttribute('fill', 'none');
  path.setAttribute('vector-effect', 'non-scaling-stroke');
  layer.traces.append(path);

  const nodes = [];
  for (const specNode of spec.nodes || []) {
    const el = svgEl('circle');
    el.setAttribute('vector-effect', 'non-scaling-stroke');
    const halo = svgEl('circle');
    halo.setAttribute('opacity', '0');
    layer.nodes.append(el);
    layer.comets.append(halo);
    const node = {
      el,
      halo,
      point: specNode.point || null,
      x: specNode.x || 0,
      y: specNode.y || 0,
      r: specNode.r || 0,
      join: specNode.join || 0,
      haloScale: specNode.haloScale || 0,
      glowReach: specNode.glowReach || 0,
      hot: 0,
      hotDist: Infinity,
      hotColor: state.traceColor,
    };
    layer.nodeList.push(node);
    nodes.push(node);
  }

  const dots = [];
  let head = null;
  if (spec.hue) {
    for (let i = 0; i < DOTS; i += 1) {
      const dot = svgEl('circle');
      dot.setAttribute('opacity', '0');
      layer.comets.append(dot);
      dots.push(dot);
    }
    head = svgEl('circle');
    head.setAttribute('opacity', '0');
    layer.heads.append(head);
  }

  const item = {
    path,
    nodes,
    dots,
    head,
    hue: spec.hue || null,
    phase: spec.phase || 0,
    closed: Boolean(spec.closed),
    gate: spec.gate || null,
    points: spec.points || null,
    d: spec.d || '',
    length: 0,
    pointerGap: Infinity,
  };
  layer.items.push(item);
  return item;
}

function itemOn(item) {
  if (item.gate === 'top') return state.showTop;
  if (item.gate === 'bot') return state.showBot;
  if (item.gate === 'trace') return state.showTrace;
  return true;
}

function writeItem(item) {
  const d = item.points ? linePath(item.points()) : (typeof item.d === 'function' ? item.d() : item.d);
  item.path.setAttribute('d', d);
  for (const node of item.nodes) {
    if (node.point) {
      node.x = node.point.x;
      node.y = node.point.y;
    }
    node.el.setAttribute('cx', round(node.x));
    node.el.setAttribute('cy', round(node.y));
    node.halo.setAttribute('cx', round(node.x));
    node.halo.setAttribute('cy', round(node.y));
  }
  item.length = item.path.getTotalLength();
}

function closestOnItem(item, x, y) {
  const { path, length } = item;
  if (length < 1) return null;
  const steps = Math.min(180, Math.max(8, Math.ceil(length / 14)));
  let bestGap = Infinity;
  let bestAt = 0;
  let prev = path.getPointAtLength(0);
  let prevAt = 0;
  for (let i = 1; i <= steps; i += 1) {
    const at = (i / steps) * length;
    const next = path.getPointAtLength(Math.min(length, at));
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len2 = dx * dx + dy * dy;
    const t = len2 < 1e-6 ? 0 : Math.min(1, Math.max(0, ((x - prev.x) * dx + (y - prev.y) * dy) / len2));
    const gap = Math.hypot(prev.x + dx * t - x, prev.y + dy * t - y);
    if (gap < bestGap) {
      bestGap = gap;
      bestAt = prevAt + (at - prevAt) * t;
    }
    prev = next;
    prevAt = at;
  }
  return { at: bestAt, gap: bestGap };
}

function pathVertices(path) {
  const nums = (path.getAttribute('d').match(/-?\d+\.?\d*/g) || []).map(Number);
  const pts = [];
  for (let i = 0; i < nums.length; i += 2) {
    const point = { x: nums[i], y: nums[i + 1] };
    const prev = pts[pts.length - 1];
    if (!prev || Math.hypot(point.x - prev.x, point.y - prev.y) > 0.01) pts.push(point);
  }
  return pts;
}

function pointAlong(pts, cum, dist) {
  let index = 1;
  while (index < cum.length - 1 && cum[index] < dist) index += 1;
  const span = cum[index] - cum[index - 1] || 1;
  const t = Math.min(1, Math.max(0, (dist - cum[index - 1]) / span));
  return {
    x: pts[index - 1].x + (pts[index].x - pts[index - 1].x) * t,
    y: pts[index - 1].y + (pts[index].y - pts[index - 1].y) * t,
  };
}

function slicePath(path, length, from, to) {
  const pts = pathVertices(path);
  if (pts.length < 2) return path.getAttribute('d');
  const cum = [0];
  for (let i = 1; i < pts.length; i += 1) {
    cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  const total = cum[cum.length - 1] || length;
  const start = Math.max(0, Math.min(total, from));
  const end = Math.max(start + 0.01, Math.min(total, to));
  const out = [pointAlong(pts, cum, start)];
  for (let i = 1; i < pts.length - 1; i += 1) {
    if (cum[i] > start + 0.05 && cum[i] < end - 0.05) out.push(pts[i]);
  }
  out.push(pointAlong(pts, cum, end));
  return linePath(out);
}

function makeFadeGradient(defs) {
  fadeSerial += 1;
  const grad = svgEl('linearGradient');
  grad.setAttribute('id', `cm-fade-${fadeSerial}`);
  grad.setAttribute('gradientUnits', 'userSpaceOnUse');
  const stops = [0, 0.42, 1].map((offset) => {
    const stop = svgEl('stop');
    stop.setAttribute('offset', String(offset));
    grad.append(stop);
    return stop;
  });
  defs.append(grad);
  return { grad, stops };
}

function ensureFade(item, layer) {
  if (item.fadeStart) return;
  const defs = layer.traces.ownerSVGElement.querySelector('defs');
  const makePath = (stroke) => {
    const path = svgEl('path');
    path.setAttribute('fill', 'none');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    path.setAttribute('stroke-linecap', 'butt');
    path.setAttribute('stroke', stroke);
    path.style.display = 'none';
    layer.traces.append(path);
    return path;
  };
  item.fadeIn = makeFadeGradient(defs);
  item.fadeOut = makeFadeGradient(defs);
  item.solid = makePath(state.traceColor);
  item.solid.setAttribute('stroke-linecap', 'round');
  item.fadeStart = makePath(`url(#${item.fadeIn.grad.id})`);
  item.fadeEnd = makePath(`url(#${item.fadeOut.grad.id})`);
}

function paintFade(entry, tip, inner) {
  entry.grad.setAttribute('x1', round(tip.x));
  entry.grad.setAttribute('y1', round(tip.y));
  entry.grad.setAttribute('x2', round(inner.x));
  entry.grad.setAttribute('y2', round(inner.y));
  const opacities = ['0', '0.2', '1'];
  entry.stops.forEach((stop, index) => {
    stop.setAttribute('stop-color', state.traceColor);
    stop.setAttribute('stop-opacity', opacities[index]);
  });
}

function endpointFree(item, at, layer) {
  const point = item.path.getPointAtLength(Math.min(item.length - 0.01, Math.max(0, at)));
  const limit = Math.max(layer.radius * 1.2, 7 * layer.unit);
  for (const other of layer.items) {
    if (other === item || other.length < 1 || !itemOn(other)) continue;
    const hit = closestOnItem(other, point.x, point.y);
    if (hit && hit.gap < limit) return false;
  }
  for (const node of layer.nodeList) {
    if (node.el.style.display === 'none') continue;
    const reach = Math.max(limit, (node.r || 0) + (node.join || 0));
    if (Math.hypot(node.x - point.x, node.y - point.y) < reach) return false;
  }
  return true;
}

function hideFade(item) {
  item.path.removeAttribute('stroke');
  if (!item.fadeStart) return;
  item.solid.style.display = 'none';
  item.fadeStart.style.display = 'none';
  item.fadeEnd.style.display = 'none';
}

function updateFade(item, layer, on) {
  if (!on || item.closed || item.length < 8) {
    hideFade(item);
    return;
  }
  ensureFade(item, layer);
  const fade = Math.min(50 * layer.unit, item.length * 0.35);
  const startFree = fade > 2 && endpointFree(item, 0, layer);
  const endFree = fade > 2 && endpointFree(item, item.length, layer);
  if (!startFree && !endFree) {
    hideFade(item);
    return;
  }
  const overlap = Math.min(1.2, fade * 0.08);
  const from = startFree ? Math.max(0, fade - overlap) : 0;
  const to = endFree ? Math.min(item.length, item.length - fade + overlap) : item.length;
  item.path.setAttribute('stroke', 'none');
  item.solid.style.display = '';
  item.solid.setAttribute('stroke', state.traceColor);
  item.solid.setAttribute('stroke-width', String(state.trace));
  item.solid.setAttribute('d', slicePath(item.path, item.length, from, to));
  item.fadeStart.style.display = startFree ? '' : 'none';
  item.fadeEnd.style.display = endFree ? '' : 'none';
  if (startFree) {
    item.fadeStart.setAttribute('d', slicePath(item.path, item.length, 0, fade));
    item.fadeStart.setAttribute('stroke-width', String(state.trace));
    paintFade(item.fadeIn, item.path.getPointAtLength(0), item.path.getPointAtLength(fade));
  }
  if (endFree) {
    item.fadeEnd.setAttribute('d', slicePath(item.path, item.length, item.length - fade, item.length));
    item.fadeEnd.setAttribute('stroke-width', String(state.trace));
    paintFade(
      item.fadeOut,
      item.path.getPointAtLength(Math.max(0, item.length - 0.05)),
      item.path.getPointAtLength(Math.max(0, item.length - fade)),
    );
  }
}

const LOGO_HALF = 12.6;

function vsub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}

function vadd(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}

function vmul(a, s) {
  return { x: a.x * s, y: a.y * s };
}

function vlen(a) {
  return Math.hypot(a.x, a.y);
}

function vnorm(a) {
  const len = vlen(a) || 1;
  return { x: a.x / len, y: a.y / len };
}

function vleft(a) {
  return vnorm({ x: a.y, y: -a.x });
}

function vintersect(p, r, q, s) {
  const den = r.x * s.y - r.y * s.x;
  if (Math.abs(den) < 1e-6) return null;
  const t = ((q.x - p.x) * s.y - (q.y - p.y) * s.x) / den;
  return vadd(p, vmul(r, t));
}

function offsetPoints(pts, dist) {
  const segs = [];
  for (let i = 0; i < pts.length - 1; i += 1) {
    const dir = vnorm(vsub(pts[i + 1], pts[i]));
    const n = vmul(vleft(dir), dist);
    segs.push({ a: vadd(pts[i], n), b: vadd(pts[i + 1], n), dir });
  }
  const out = [segs[0].a];
  for (let i = 0; i < segs.length - 1; i += 1) {
    const hit = vintersect(segs[i].a, segs[i].dir, segs[i + 1].a, segs[i + 1].dir);
    out.push(hit || segs[i].b);
  }
  out.push(segs[segs.length - 1].b);
  return out;
}

function trimRibbonEnd(sideL, sideR, pts, atEnd, cap) {
  if (!cap || cap.type !== 'bevel') return;
  const indexL = atEnd ? sideL.length - 1 : 0;
  const indexR = atEnd ? sideR.length - 1 : 0;
  const origin = atEnd ? pts[pts.length - 1] : pts[0];
  const dir = atEnd
    ? vnorm(vsub(pts[pts.length - 1], pts[pts.length - 2]))
    : vnorm(vsub(pts[1], pts[0]));
  const cut = vnorm(cap.dir);
  const leftHit = vintersect(sideL[indexL], dir, origin, cut);
  const rightHit = vintersect(sideR[indexR], dir, origin, cut);
  if (leftHit) sideL[indexL] = leftHit;
  if (rightHit) sideR[indexR] = rightHit;
}

function ribbonSides(pts, startCap, endCap) {
  const sideL = offsetPoints(pts, LOGO_HALF);
  const sideR = offsetPoints(pts, -LOGO_HALF);
  trimRibbonEnd(sideL, sideR, pts, false, startCap);
  trimRibbonEnd(sideL, sideR, pts, true, endCap);
  return [sideL, sideR];
}

function addRibbon(spec) {
  const sides = () => ribbonSides(spec.pts(), spec.start, spec.end);
  [0, 1].forEach((index) => {
    addTrace(logoLayer, {
      gate: spec.gate,
      hue: spec.hue,
      phase: spec.phase + index * 0.41,
      closed: false,
      d: () => linePath(sides()[index]),
      nodes: index === 0 ? spec.nodes : [],
    });
  });
}

function buildLogo() {
  const alongTrace = () => vsub(points.mMid, points.mA);
  const downTrace = () => vsub(points.mB, points.mElbow);
  addRibbon({
    gate: 'top',
    hue: 'mint',
    phase: 0.22,
    pts: () => [points.topA, points.topPeak, points.topB],
    start: { type: 'butt' },
    end: { type: 'butt' },
  });
  addRibbon({
    gate: 'bot',
    hue: 'mint',
    phase: 0.58,
    pts: () => [points.botA, points.botB, points.botPeak, points.botC],
    start: { type: 'bevel', get dir() { return alongTrace(); } },
    end: { type: 'bevel', get dir() { return downTrace(); } },
  });
  addRibbon({
    gate: 'trace',
    hue: 'cyan',
    phase: 0.08,
    pts: () => [points.mA, points.mMid, points.mElbow, points.mB],
    start: { type: 'butt' },
    end: { type: 'butt' },
    nodes: [
      { point: points.nodeLeft, r: 7, join: LOGO_HALF * 1.35, haloScale: 1.65, glowReach: 12 },
      { point: points.nodeRight, r: 7, join: LOGO_HALF * 1.35, haloScale: 1.65, glowReach: 12 },
    ],
  });
}

// Traces measured from the reference 404, so the digits keep its tall proportion.
const FOUR_GLYPHS = [
  { hue: 'cyan', phase: 0.08, d: 'M 104.1 601.3 L 430.5 195.9', nodes: [{ x: 104.1, y: 601.3 }] },
  { hue: 'mint', phase: 0.74, d: 'M 535 328.5 L 535 897.1', nodes: [{ x: 535, y: 897.1 }] },
  { d: 'M 285.1 647.2 L 499.3 647.2' },
  { d: 'M 201 813 L 535 813' },
  { hue: 'cyan', phase: 0.42, d: 'M 700.8 83.7 L 700.8 866.5', nodes: [{ x: 700.8, y: 83.7 }] },
  { d: 'M 731.4 647.2 L 833.4 647.2' },
  { d: 'M 700.8 813 L 813 813' },
  { hue: 'mint', phase: 0.18, d: 'M 904.8 86.2 L 1463.2 86.2', nodes: [{ x: 904.8, y: 86.2 }] },
  { hue: 'cyan', phase: 0.58, d: 'M 904.8 86.2 L 904.8 966 L 1588.2 966 L 1588.2 226.5' },
  { d: 'M 1070.5 249.4 L 1361.2 249.4' },
  { d: 'M 1070.5 249.4 L 1070.5 843.6' },
  { hue: 'cyan', phase: 0.36, d: 'M 1422.4 843.6 L 1422.4 249.4', nodes: [{ x: 1422.4, y: 843.6 }] },
  { d: 'M 1070.5 843.6 L 1422.4 843.6' },
  { hue: 'cyan', phase: 0.22, d: 'M 1672.3 601.3 L 1993.6 193.3' },
  { hue: 'mint', phase: 0.86, d: 'M 2095.6 310.6 L 2095.6 963.4', nodes: [{ x: 2095.6, y: 310.6 }, { x: 2095.6, y: 963.4 }] },
  { d: 'M 1845.7 647.2 L 2062.5 647.2' },
  { d: 'M 1702.9 813 L 2095.6 813' },
  { hue: 'cyan', phase: 0.5, d: 'M 2261.4 83.7 L 2261.4 886.9', nodes: [{ x: 2261.4, y: 83.7 }] },
  { d: 'M 2292 647.2 L 2394 647.2' },
  { d: 'M 2261.4 813 L 2381.2 813' },
];

function build404() {
  for (const glyph of FOUR_GLYPHS) {
    addTrace(fourLayer, {
      hue: glyph.hue,
      phase: glyph.phase,
      closed: false,
      d: glyph.d,
      nodes: glyph.nodes,
    });
  }
}

function activeLayer() {
  return state.scene === '404' ? fourLayer : logoLayer;
}

function stageWidth(el, view) {
  const measured = el.clientWidth;
  if (measured > 8) return measured;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxH = Math.max(160, vh - 180);
  if (view === FOUR_VIEW) return Math.min(vw * 0.88, 1200, maxH * (FOUR_VIEW.w / FOUR_VIEW.h));
  return Math.min(vw * 0.64, 700, maxH * (LOGO_VIEW.w / LOGO_VIEW.h));
}

function applyLayer(layer, el, view) {
  const unit = view.w / Math.max(1, stageWidth(el, view));
  layer.unit = unit;
  layer.stroke = state.trace;
  layer.radius = state.node * unit;
  layer.blur.setAttribute('stdDeviation', String(state.glow * unit));
  layer.traces.setAttribute('stroke', state.traceColor);
  layer.traces.setAttribute('stroke-width', String(state.trace));
  layer.traces.style.display = state.showTraces ? '' : 'none';
  layer.nodes.style.display = state.showNodes ? '' : 'none';
  layer.comets.setAttribute('filter', state.glow > 0 ? `url(#${layer.filterId})` : 'none');
  layer.comets.style.display = state.showComets ? '' : 'none';
  layer.heads.style.display = state.showComets ? '' : 'none';

  for (const item of layer.items) {
    writeItem(item);
    const on = itemOn(item);
    item.path.style.display = on ? '' : 'none';
    for (const node of item.nodes) {
      node.el.style.display = on ? '' : 'none';
    }
  }
  for (const item of layer.items) {
    updateFade(item, layer, itemOn(item));
  }
}

function styleNodes(layer) {
  for (const node of layer.nodeList) {
    const hidden = node.el.style.display === 'none' || !state.showNodes;
    const radius = node.r || layer.radius;
    node.el.setAttribute('r', round(radius));
    node.el.setAttribute('fill', state.background);
    node.el.setAttribute('stroke-width', String(node.hot ? state.trace * (1 + node.hot * 0.4) : state.trace));
    node.el.setAttribute('stroke', node.hot ? mix(state.traceColor, node.hotColor, 0.3 + node.hot * 0.7) : state.traceColor);
    node.halo.setAttribute('r', round(radius * (node.haloScale || 2.15)));
    node.halo.setAttribute('fill', node.hotColor || state.mint);
    node.halo.setAttribute('opacity', !hidden && node.hot && state.showComets ? String(0.28 + node.hot * 0.6) : '0');
  }
}

function sample(item, distance) {
  const { length } = item;
  if (length < 1) return null;
  let at = distance;
  if (item.closed) at = mod(distance, length);
  else if (distance < 0 || distance > length) return null;
  const point = item.path.getPointAtLength(Math.min(length - 0.01, Math.max(0, at)));
  return { x: point.x, y: point.y };
}

function placeDot(dot, point, t, hue, layer) {
  if (!point) {
    dot.setAttribute('opacity', '0');
    return null;
  }
  const radiusPx = 2.35 - t * 1.15;
  dot.setAttribute('cx', round(point.x));
  dot.setAttribute('cy', round(point.y));
  dot.setAttribute('r', round(Math.max(0.8, radiusPx) * layer.unit));
  dot.setAttribute('fill', mix(hue, '#f7fffd', (1 - t) ** 2 * 0.7));
  dot.setAttribute('opacity', String(0.92 * (1 - t * 0.78)));
  return point;
}

function heatNodes(layer, point, hue, reach) {
  if (!point || !state.showNodes) return;
  for (const node of layer.nodeList) {
    if (node.el.style.display === 'none') continue;
    const dist = Math.hypot(node.x - point.x, node.y - point.y);
    const nodeReach = node.glowReach || Math.max(reach, (node.r || 0) * 1.2, node.join || 0);
    if (dist < nodeReach && dist < node.hotDist) {
      node.hot = 1 - dist / nodeReach;
      node.hotDist = dist;
      node.hotColor = hue;
    }
  }
}

function placeHead(head, point, hue, layer) {
  if (!point) {
    head.setAttribute('opacity', '0');
    return;
  }
  head.setAttribute('cx', round(point.x));
  head.setAttribute('cy', round(point.y));
  head.setAttribute('r', round(1.15 * layer.unit));
  head.setAttribute('fill', mix(hue, '#f7fffd', 0.82));
  head.setAttribute('opacity', '0.95');
}

function burstPoint(burst, back) {
  const along = burst.travel - back;
  const { item } = burst;
  if (along > item.length) return null;
  if (!item.closed && along < 0) return null;
  return sample(item, burst.origin + burst.dir * along);
}

function paint(time) {
  const layer = activeLayer();
  if (!state.showComets && bursts.length) clearBursts();
  for (const node of layer.nodeList) {
    node.hot = 0;
    node.hotDist = Infinity;
    node.hotColor = state.traceColor;
  }

  const tail = state.packet * layer.unit;
  const speed = state.speed * layer.unit;
  const reach = layer.radius * 2.5;

  for (const item of layer.items) {
    const draw = state.showComets && item.hue && itemOn(item) && item.length > 1 && item.dots.length;
    if (!draw) {
      for (const dot of item.dots) dot.setAttribute('opacity', '0');
      if (item.head) item.head.setAttribute('opacity', '0');
      continue;
    }
    const span = item.closed ? item.length : item.length + tail;
    const head = loopSample
      ? loopSample(item, span)
      : mod(time * speed + item.phase * item.length, span);
    const hue = state[item.hue];
    const spacing = tail / (DOTS - 1);
    let headPoint = null;
    for (let i = 0; i < DOTS; i += 1) {
      const point = placeDot(item.dots[i], sample(item, head - i * spacing), i / (DOTS - 1), hue, layer);
      if (i === 0) headPoint = point;
    }
    if (item.head) placeHead(item.head, headPoint, hue, layer);
    heatNodes(layer, headPoint, hue, reach);
  }

  for (const burst of bursts) {
    if (burst.layer !== layer) {
      for (const dot of burst.dots) dot.setAttribute('opacity', '0');
      burst.head.setAttribute('opacity', '0');
      continue;
    }
    const hue = state[burst.hue];
    const spacing = tail / (DOTS - 1);
    let headPoint = null;
    for (let i = 0; i < DOTS; i += 1) {
      const point = placeDot(burst.dots[i], burstPoint(burst, i * spacing), i / (DOTS - 1), hue, layer);
      if (i === 0) headPoint = point;
    }
    placeHead(burst.head, headPoint, hue, layer);
    heatNodes(layer, headPoint, hue, reach);
  }
  styleNodes(layer);
}

function applyLook() {
  if (exporting) return;
  stage.style.setProperty('--ref-opacity', state.showRef ? String(state.refOpacity) : '0');
  stage.style.setProperty('--ref-x', `${state.refX}%`);
  stage.style.setProperty('--ref-y', `${state.refY}%`);
  stage.style.setProperty('--ref-scale', String(state.refScale));

  document.documentElement.style.background = state.background;
  document.body.style.background = state.background;
  logoRoot.style.background = state.background;

  applyLayer(logoLayer, stage, LOGO_VIEW);
  applyLayer(fourLayer, stage404, FOUR_VIEW);
  paint(elapsed);
  syncScenes();
}

function removeBurst(index) {
  const burst = bursts[index];
  for (const dot of burst.dots) dot.remove();
  burst.head.remove();
  bursts.splice(index, 1);
}

function clearBursts() {
  while (bursts.length) removeBurst(0);
}

function stepBursts(dt) {
  if (!dt || !state.showComets) return;
  for (let i = bursts.length - 1; i >= 0; i -= 1) {
    const burst = bursts[i];
    burst.travel += dt * state.speed * burst.layer.unit;
    const tail = state.packet * burst.layer.unit;
    if (burst.travel > burst.item.length + tail) removeBurst(i);
  }
}

function ensureTicker() {
  if (tickerOn || !window.gsap) return;
  tickerOn = true;
  lastStamp = 0;
  gsap.ticker.add(tick);
}

function tick() {
  if (exporting) return;
  const now = performance.now();
  const dt = lastStamp ? Math.min(0.05, (now - lastStamp) / 1000) : 0;
  lastStamp = now;
  if (!document.hidden) {
    if (motionOn) elapsed += dt;
    stepBursts(dt);
  }
  paint(elapsed);
  if (!motionOn && !bursts.length && tickerOn) {
    gsap.ticker.remove(tick);
    tickerOn = false;
    lastStamp = 0;
  }
}

function armMotion() {
  if (mm) mm.revert();
  lastStamp = 0;
  mm = gsap.matchMedia();
  mm.add(
    {
      reduce: '(prefers-reduced-motion: reduce)',
      ok: '(prefers-reduced-motion: no-preference)',
    },
    (context) => {
      const reduced = Boolean(context.conditions && context.conditions.reduce);
      motionOn = !(reduced && !allowReducedMotion) && state.playing && state.showComets;
      paint(elapsed);
      if (motionOn || bursts.length) ensureTicker();
      return () => {
        motionOn = false;
        gsap.ticker.remove(tick);
        tickerOn = false;
        lastStamp = 0;
      };
    },
  );
}

function spawnBurst(layer, item, at) {
  while (bursts.length >= 14) removeBurst(0);
  const dots = [];
  for (let i = 0; i < DOTS; i += 1) {
    const dot = svgEl('circle');
    dot.setAttribute('opacity', '0');
    layer.comets.append(dot);
    dots.push(dot);
  }
  const head = svgEl('circle');
  head.setAttribute('opacity', '0');
  layer.heads.append(head);
  let dir = 1;
  if (!item.closed && item.length - at < at * 0.35) dir = -1;
  let hue = item.hue;
  if (!hue) {
    burstHue = !burstHue;
    hue = burstHue ? 'mint' : 'cyan';
  }
  bursts.push({
    layer,
    item,
    origin: at,
    dir,
    travel: 0,
    hue,
    dots,
    head,
  });
  ensureTicker();
}

function resetCrossings() {
  for (const item of logoLayer.items) item.pointerGap = Infinity;
  for (const item of fourLayer.items) item.pointerGap = Infinity;
}

function activeSvg() {
  return (state.scene === '404' ? stage404 : stage).querySelector('svg');
}

function eventToSvg(event) {
  const svg = activeSvg();
  if (!svg) return null;
  const rect = svg.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return null;
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
    return null;
  }
  const view = svg.viewBox.baseVal;
  return {
    x: ((event.clientX - rect.left) / rect.width) * view.width,
    y: ((event.clientY - rect.top) / rect.height) * view.height,
  };
}

function onPointerMove(event) {
  if (exporting) return;
  if (event.target instanceof Element && event.target.closest('.logo-gui, .switchers')) {
    resetCrossings();
    return;
  }
  const point = eventToSvg(event);
  if (!point || !state.showTraces || !state.showComets) {
    resetCrossings();
    return;
  }
  const layer = activeLayer();
  const threshold = 8 * layer.unit;
  for (const item of layer.items) {
    if (!itemOn(item) || item.length < 8 || item.path.style.display === 'none') continue;
    const hit = closestOnItem(item, point.x, point.y);
    if (!hit) continue;
    const was = item.pointerGap;
    item.pointerGap = hit.gap;
    if (was > threshold && hit.gap <= threshold) spawnBurst(layer, item, hit.at);
  }
}

function refreshGui() {
  if (!gui) return;
  gui.controllersRecursive().forEach((controller) => controller.updateDisplay());
}

function applyDefaults() {
  const next = structuredClone(DEFAULT_STATE);
  for (const key of Object.keys(state)) state[key] = next[key];
  const nextPoints = structuredClone(DEFAULT_POINTS);
  for (const key of Object.keys(points)) {
    points[key].x = nextPoints[key].x;
    points[key].y = nextPoints[key].y;
  }
  allowReducedMotion = false;
  elapsed = 0;
  if (reduceQuery.matches) state.playing = false;
}

function syncScenes() {
  const on404 = state.scene === '404';
  stage.classList.toggle('is-off', on404);
  stage404.classList.toggle('is-off', !on404);
  stage.setAttribute('aria-hidden', on404 ? 'true' : 'false');
  stage404.setAttribute('aria-hidden', on404 ? 'false' : 'true');
  stage.inert = on404;
  stage404.inert = !on404;
  sceneLogo.setAttribute('aria-selected', on404 ? 'false' : 'true');
  sceneFour.setAttribute('aria-selected', on404 ? 'true' : 'false');
  sceneLogo.tabIndex = on404 ? -1 : 0;
  sceneFour.tabIndex = on404 ? 0 : -1;
}

function setScene(scene) {
  if (exporting) return;
  state.scene = scene === '404' ? '404' : 'logo';
  clearBursts();
  resetCrossings();
  syncScenes();
  applyLook();
  armMotion();
  save();
}

function focusScene(scene) {
  setScene(scene);
  (scene === '404' ? sceneFour : sceneLogo).focus();
}

function exportStatus(text, ready = false) {
  const status = document.getElementById('cm-export-status');
  if (!status) return;
  status.hidden = !text;
  status.textContent = text || '';
  status.disabled = !ready;
}

function showExportProgress(label, text, ready = false) {
  if (exportCtrl) exportCtrl.name(label);
  exportStatus(text, ready);
}

function setGuiLocked(locked) {
  if (!gui) return;
  gui.controllersRecursive().forEach((controller) => controller.disable(locked));
  sceneLogo.disabled = locked;
  sceneFour.disabled = locked;
}

function activeComets(layer) {
  if (!state.showComets) return [];
  return layer.items.filter((item) => item.hue && itemOn(item) && item.length > 1 && item.dots.length);
}

function cometSpan(item, layer) {
  const tail = state.packet * layer.unit;
  return item.closed ? item.length : item.length + tail;
}

// Shortest duration in which every comet can finish a whole number of trips,
// so the rendered file repeats without a jump.
function loopPlan(layer) {
  const comets = activeComets(layer);
  const speed = Math.max(1, state.speed * layer.unit);
  const periods = comets.map((item) => cometSpan(item, layer) / speed);
  const minFrames = EXPORT_FPS * 4;
  const maxFrames = EXPORT_FPS * 8;
  if (!periods.length) return { frameCount: EXPORT_FPS * 2, cycles: new Map() };

  let bestError = Infinity;
  const errors = [];
  for (let frames = minFrames; frames <= maxFrames; frames += 1) {
    const seconds = frames / EXPORT_FPS;
    let error = 0;
    for (const period of periods) {
      const cycles = seconds / period;
      error += Math.abs(cycles - Math.round(cycles));
    }
    errors.push(error);
    if (error < bestError) bestError = error;
  }

  let frameCount = minFrames;
  for (let frames = minFrames; frames <= maxFrames; frames += 1) {
    if (errors[frames - minFrames] <= bestError + 0.05) {
      frameCount = frames;
      break;
    }
  }

  const seconds = frameCount / EXPORT_FPS;
  const cycles = new Map();
  for (const item of comets) {
    const period = cometSpan(item, layer) / speed;
    cycles.set(item, Math.max(1, Math.round(seconds / period)));
  }
  return { frameCount, cycles };
}

function assertLoopCloses(layer, cycles) {
  for (const [item, turns] of cycles) {
    const span = cometSpan(item, layer);
    const start = mod(item.phase * item.length, span);
    const end = mod(start + turns * span, span);
    const gap = Math.min(Math.abs(start - end), Math.abs(span - Math.abs(start - end)));
    if (gap > 0.05) throw new Error('Loop does not close');
  }
}

function motionValues(layer) {
  const values = [];
  const take = (root) => {
    root.querySelectorAll('circle').forEach((el) => {
      ['cx', 'cy', 'r', 'opacity'].forEach((name) => {
        const number = Number(el.getAttribute(name));
        if (Number.isFinite(number)) values.push(number);
      });
    });
  };
  take(layer.comets);
  take(layer.heads);
  take(layer.nodes);
  return values;
}

function sameMotion(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (Math.abs(a[i] - b[i]) > 0.02) return false;
  }
  return true;
}

function fitArt(boxW, boxH) {
  const scale = Math.min((EXPORT_W * 0.92) / boxW, (EXPORT_H * 0.92) / boxH);
  const w = Math.max(2, Math.round(boxW * scale));
  const h = Math.max(2, Math.round(boxH * scale));
  return {
    w,
    h,
    x: Math.round((EXPORT_W - w) / 2),
    y: Math.round((EXPORT_H - h) / 2),
  };
}

function bakeStrokes(clone, unit) {
  clone.querySelectorAll('[vector-effect], [stroke-width]').forEach((el) => {
    el.removeAttribute('vector-effect');
    const width = el.getAttribute('stroke-width');
    if (width == null || width === '') return;
    const value = Number(width);
    if (Number.isFinite(value)) el.setAttribute('stroke-width', String(round(value * unit)));
  });
}

async function rasterFrame(canvas, svg, view, unit) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const pad = (state.glow * 3.2 + state.node * 0.6 + 8) * unit;
  const boxW = view.w + pad * 2;
  const boxH = view.h + pad * 2;
  const art = fitArt(boxW, boxH);
  const clone = svg.cloneNode(true);
  clone.setAttribute('xmlns', NS);
  clone.setAttribute('width', String(art.w));
  clone.setAttribute('height', String(art.h));
  clone.setAttribute('viewBox', `${round(-pad)} ${round(-pad)} ${round(boxW)} ${round(boxH)}`);
  bakeStrokes(clone, unit);
  const xml = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const source = await loadSvgSource(blob);
  ctx.fillStyle = state.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, art.x, art.y, art.w, art.h);
  if (typeof source.close === 'function') source.close();
}

async function loadSvgSource(blob) {
  try {
    return await createImageBitmap(blob);
  } catch {
    const url = URL.createObjectURL(blob);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      return image;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function encodeMp4(canvas, renderFrame, frameCount) {
  if (typeof VideoEncoder === 'undefined') throw new Error('WebCodecs unavailable');
  const { Muxer, ArrayBufferTarget } = await import('https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.1/+esm');
  let failed = null;
  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width: EXPORT_W, height: EXPORT_H, frameRate: EXPORT_FPS },
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  });
  const makeEncoder = () => new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (error) => { failed = error; },
  });
  let encoder = makeEncoder();
  const candidates = ['avc1.64002a', 'avc1.640032', 'avc1.640028', 'avc1.4d002a', 'avc1.42001f'];
  let configured = false;
  for (const codec of candidates) {
    const config = {
      codec,
      width: EXPORT_W,
      height: EXPORT_H,
      bitrate: 12_000_000,
      framerate: EXPORT_FPS,
      avc: { format: 'avc' },
      hardwareAcceleration: 'prefer-hardware',
      latencyMode: 'quality',
    };
    try {
      const support = await VideoEncoder.isConfigSupported(config);
      if (support.supported === false) continue;
      if (encoder.state === 'closed') encoder = makeEncoder();
      encoder.configure({ ...(support.config || config), avc: { format: 'avc' } });
      configured = true;
      break;
    } catch {
      try { encoder.close(); } catch { /* encoder already closed */ }
      encoder = makeEncoder();
    }
  }
  if (!configured) {
    if (encoder.state !== 'closed') encoder.close();
    throw new Error('H.264 encoder unavailable');
  }

  const frameDuration = Math.round(1e6 / EXPORT_FPS);
  try {
    for (let index = 0; index < frameCount; index += 1) {
      if (failed) throw failed;
      await renderFrame(index);
      if (encoder.encodeQueueSize > 6) {
        await new Promise((resolve) => encoder.addEventListener('dequeue', resolve, { once: true }));
      }
      const frame = new VideoFrame(canvas, {
        timestamp: index * frameDuration,
        duration: frameDuration,
      });
      try {
        encoder.encode(frame, { keyFrame: index % 30 === 0 });
      } finally {
        frame.close();
      }
    }
    await encoder.flush();
    if (failed) throw failed;
    muxer.finalize();
    return new Blob([muxer.target.buffer], { type: 'video/mp4' });
  } finally {
    if (encoder.state !== 'closed') encoder.close();
  }
}

async function encodeWebm(canvas, renderFrame, frameCount) {
  if (typeof MediaRecorder === 'undefined' || typeof canvas.captureStream !== 'function') {
    throw new Error('Recording unavailable');
  }
  const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
    .find((type) => MediaRecorder.isTypeSupported(type)) || '';
  const stream = canvas.captureStream(0);
  const track = stream.getVideoTracks()[0];
  const recorder = mime
    ? new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12_000_000 })
    : new MediaRecorder(stream, { videoBitsPerSecond: 12_000_000 });
  const chunks = [];
  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size) chunks.push(event.data);
  };
  const stopped = new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = () => reject(new Error('Recording failed'));
  });
  recorder.start();
  const frameMs = 1000 / EXPORT_FPS;
  for (let index = 0; index < frameCount; index += 1) {
    await renderFrame(index);
    if (typeof track.requestFrame === 'function') track.requestFrame();
    await new Promise((resolve) => window.setTimeout(resolve, frameMs));
  }
  if (recorder.state !== 'inactive') recorder.stop();
  await stopped;
  stream.getTracks().forEach((item) => item.stop());
  if (!chunks.length) throw new Error('Recording produced no data');
  return new Blob(chunks, { type: mime || 'video/webm' });
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
  const layer = activeLayer();
  const svg = activeSvg();
  if (!svg) return;
  const previous = elapsed;
  const { frameCount, cycles } = loopPlan(layer);
  exporting = true;
  logoRoot.classList.add('is-exporting');
  setGuiLocked(true);
  clearBursts();
  showExportProgress('Exporting…', 'Exporting loop');
  try {
    assertLoopCloses(layer, cycles);
    loopSample = (item, span) => {
      const turns = cycles.get(item) || 1;
      const start = mod(item.phase * item.length, span);
      return mod(start + loopProgress * turns * span, span);
    };
    loopProgress = 0;
    paint(0);
    const opened = motionValues(layer);
    loopProgress = 1;
    paint(0);
    if (!sameMotion(opened, motionValues(layer))) throw new Error('Painted loop does not close');
    loopProgress = 0;
    const canvas = document.createElement('canvas');
    canvas.width = EXPORT_W;
    canvas.height = EXPORT_H;
    const view = state.scene === '404' ? FOUR_VIEW : LOGO_VIEW;
    const unit = layer.unit;
    const renderFrame = async (index) => {
      loopProgress = index / frameCount;
      paint(0);
      await rasterFrame(canvas, svg, view, unit);
      if (index % 12 === 0 || index === frameCount - 1) {
        const pct = Math.round(((index + 1) / frameCount) * 100);
        showExportProgress(`Export ${pct}%`, `Exporting ${pct}%`);
      }
    };
    let blob;
    try {
      blob = await encodeMp4(canvas, renderFrame, frameCount);
    } catch (error) {
      console.warn(error);
      showExportProgress('Exporting…', 'Exporting loop');
      blob = await encodeWebm(canvas, renderFrame, frameCount);
    }
    const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
    pendingDownload = { blob, name: `circuit-mind-${state.scene}-loop.${ext}` };
    const mb = blob.size / (1024 * 1024);
    showExportProgress('Download', `Download · ${mb.toFixed(1)} MB`, true);
  } catch (error) {
    console.error(error);
    showExportProgress('Export failed', 'Export failed');
    window.setTimeout(() => {
      if (!exporting && !pendingDownload) showExportProgress('Export loop', '');
    }, 1800);
  } finally {
    loopSample = null;
    loopProgress = 0;
    elapsed = previous;
    exporting = false;
    logoRoot.classList.remove('is-exporting');
    applyLook();
    armMotion();
    setGuiLocked(false);
  }
}

function mountGui() {
  const narrow = window.matchMedia('(max-width: 720px)').matches;
  gui = new GUI({ title: 'Circuit Mind', width: narrow ? 250 : 300 });
  gui.domElement.classList.add('logo-gui');

  exportCtrl = gui.add({ exportLoop: () => onExportClick() }, 'exportLoop').name('Export loop');
  exportCtrl.domElement.title = 'Seamless MP4 of this scene, ready to loop.';
  document.getElementById('cm-export-status')?.addEventListener('click', () => onExportClick());

  const reference = gui.addFolder('Reference');
  reference.add(state, 'showRef').name('Show').onChange(applyLook).onFinishChange(save);
  reference.add(state, 'refOpacity', 0, 1, 0.01).name('Opacity').onChange(applyLook).onFinishChange(save);
  reference.add(state, 'refScale', 0.2, 1.8, 0.01).name('Scale').onChange(applyLook).onFinishChange(save);
  reference.add(state, 'refX', -40, 40, 0.1).name('Offset X %').onChange(applyLook).onFinishChange(save);
  reference.add(state, 'refY', -40, 40, 0.1).name('Offset Y %').onChange(applyLook).onFinishChange(save);

  const stroke = gui.addFolder('Stroke');
  stroke.add(state, 'trace', 0.6, 3.2, 0.05).name('Trace px').onChange(applyLook).onFinishChange(save);
  stroke.add(state, 'node', 3, 14, 0.1).name('Node px').onChange(applyLook).onFinishChange(save);
  stroke.add(state, 'glow', 0, 10, 0.1).name('Glow px').onChange(applyLook).onFinishChange(save);
  stroke.add(state, 'packet', 16, 180, 1).name('Comet px').onChange(applyLook).onFinishChange(save);

  const motion = gui.addFolder('Motion');
  motion.add(state, 'speed', 24, 280, 1).name('Speed').onChange(applyLook).onFinishChange(save);
  motion.add(state, 'playing').name('Animate').onChange(() => {
    if (state.playing && reduceQuery.matches) allowReducedMotion = true;
    if (!state.playing) allowReducedMotion = false;
    armMotion();
    save();
  });

  const layers = gui.addFolder('Layers');
  layers.add(state, 'showTraces').name('Traces').onChange(applyLook).onFinishChange(save);
  layers.add(state, 'showNodes').name('Nodes').onChange(applyLook).onFinishChange(save);
  layers.add(state, 'showComets').name('Comets').onChange(() => {
    applyLook();
    armMotion();
  }).onFinishChange(save);
  layers.add(state, 'showTop').name('Top trace').onChange(applyLook).onFinishChange(save);
  layers.add(state, 'showBot').name('Bottom trace').onChange(applyLook).onFinishChange(save);
  layers.add(state, 'showTrace').name('Color trace').onChange(applyLook).onFinishChange(save);
  layers.close();

  const geometry = gui.addFolder('Geometry');
  const circles = geometry.addFolder('Circles');
  bindPoint(circles, points.nodeLeft, 'Left');
  bindPoint(circles, points.nodeRight, 'Right');
  const top = geometry.addFolder('Top');
  bindPoint(top, points.topA, 'Left');
  bindPoint(top, points.topPeak, 'Peak');
  bindPoint(top, points.topB, 'Right');
  const bottom = geometry.addFolder('Bottom');
  bindPoint(bottom, points.botA, 'Top');
  bindPoint(bottom, points.botB, 'Corner');
  bindPoint(bottom, points.botPeak, 'Peak');
  bindPoint(bottom, points.botC, 'Right');
  const trace = geometry.addFolder('Trace');
  bindPoint(trace, points.mA, 'Start');
  bindPoint(trace, points.mMid, 'Center');
  bindPoint(trace, points.mElbow, 'Elbow');
  bindPoint(trace, points.mB, 'End');
  geometry.close();

  const colors = gui.addFolder('Colors');
  colors.addColor(state, 'traceColor').name('Trace').onChange(applyLook).onFinishChange(save);
  colors.addColor(state, 'mint').name('Mint').onChange(applyLook).onFinishChange(save);
  colors.addColor(state, 'cyan').name('Cyan').onChange(applyLook).onFinishChange(save);
  colors.addColor(state, 'background').name('Background').onChange(applyLook).onFinishChange(save);
  colors.close();

  const actions = {
    reset() {
      applyDefaults();
      localStorage.removeItem(STORAGE_KEY);
      refreshGui();
      applyLook();
      armMotion();
    },
    copyValues() {
      const text = JSON.stringify({ state: { ...state }, points: structuredClone(points) }, null, 2);
      navigator.clipboard.writeText(text).then(() => {
        copyCtrl.name('Copied');
        window.setTimeout(() => copyCtrl.name('Copy values'), 1200);
      }).catch(() => {
        copyCtrl.name('Copy failed');
        window.setTimeout(() => copyCtrl.name('Copy values'), 1400);
      });
    },
  };
  gui.add(actions, 'reset').name('Reset');
  const copyCtrl = gui.add(actions, 'copyValues').name('Copy values');
  gui.close();
}

function bindPoint(folder, point, label) {
  folder.add(point, 'x', 0, 327, 0.5).name(`${label} X`).onChange(applyLook).onFinishChange(save);
  folder.add(point, 'y', 0, 310, 0.5).name(`${label} Y`).onChange(applyLook).onFinishChange(save);
}

buildLogo();
build404();
applyLook();

if (!window.gsap) {
  const note = document.createElement('p');
  note.className = 'logo-error';
  note.textContent = 'GSAP did not load. Check the network and reload.';
  logoRoot.append(note);
} else {
  mountGui();
  armMotion();
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

  reduceQuery.addEventListener('change', () => {
    if (reduceQuery.matches) {
      state.playing = false;
      allowReducedMotion = false;
      refreshGui();
    }
    armMotion();
    save();
  });

  let resizeRaf = 0;
  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(applyLook);
  });
  observer.observe(board);
  window.addEventListener('pointermove', onPointerMove);
}
