import GUI from './vendor/lil-gui.esm.min.js';

const NS = 'http://www.w3.org/2000/svg';
const STORAGE_KEY = 'vanilla-js-circuit-mind-logo-v5';
const DOTS = 28;

const LOGO_VIEW = { w: 327, h: 310 };
const FOUR_VIEW = { w: 2442, h: 1014 };

const DEFAULT_STATE = {
  showRef: false,
  refOpacity: 0.45,
  refScale: 1,
  refX: 0,
  refY: 0,
  trace: 1.25,
  node: 6.2,
  glow: 3.3,
  packet: 62,
  speed: 96,
  playing: true,
  showTraces: true,
  showNodes: true,
  showComets: true,
  showTop: true,
  showBot: true,
  showTrace: true,
  scene: 'logo',
  traceColor: '#A9BCCE',
  mint: '#3DFFC2',
  cyan: '#5CC8FF',
  background: '#041122',
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
  mMid: { x: 156, y: 177.2 },
  mElbow: { x: 262, y: 116 },
  mB: { x: 262, y: 229 },
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
  const d = item.points ? linePath(item.points()) : item.d;
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

function buildLogo() {
  addTrace(logoLayer, {
    gate: 'top',
    hue: 'mint',
    phase: 0.22,
    points: () => [points.topA, points.topPeak, points.topB],
    nodes: [{ point: points.topB }],
  });
  addTrace(logoLayer, {
    gate: 'bot',
    hue: 'mint',
    phase: 0.58,
    points: () => [points.botA, points.botB, points.botPeak, points.botC],
  });
  addTrace(logoLayer, {
    gate: 'trace',
    hue: 'cyan',
    phase: 0.08,
    points: () => [points.mA, points.mMid, points.mElbow, points.mB],
    nodes: [{ point: points.mA }, { point: points.mB }],
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
  if (view === FOUR_VIEW) return Math.min(vw - 32, 1080, vh * 0.68 * (FOUR_VIEW.w / FOUR_VIEW.h));
  if (vw >= 900) return Math.min(vh * 0.72, 560);
  return Math.min(vw * 0.86, vh * 0.72, 560);
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
}

function styleNodes(layer) {
  for (const node of layer.nodeList) {
    const hidden = node.el.style.display === 'none' || !state.showNodes;
    node.el.setAttribute('r', round(layer.radius));
    node.el.setAttribute('fill', state.background);
    node.el.setAttribute('stroke-width', String(node.hot ? state.trace * (1 + node.hot * 0.4) : state.trace));
    node.el.setAttribute('stroke', node.hot ? mix(state.traceColor, node.hotColor, 0.3 + node.hot * 0.7) : state.traceColor);
    node.halo.setAttribute('r', round(layer.radius * 2.15));
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

function paint(time) {
  const layer = activeLayer();
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
    const head = mod(time * speed + item.phase * item.length, span);
    const hue = state[item.hue];
    const spacing = tail / (DOTS - 1);
    let headPoint = null;
    for (let i = 0; i < DOTS; i += 1) {
      const point = sample(item, head - i * spacing);
      const dot = item.dots[i];
      if (!point) {
        dot.setAttribute('opacity', '0');
        continue;
      }
      const t = i / (DOTS - 1);
      const radiusPx = 2.35 - t * 1.15;
      dot.setAttribute('cx', round(point.x));
      dot.setAttribute('cy', round(point.y));
      dot.setAttribute('r', round(Math.max(0.8, radiusPx) * layer.unit));
      dot.setAttribute('fill', mix(hue, '#f7fffd', (1 - t) ** 2 * 0.7));
      dot.setAttribute('opacity', String(0.92 * (1 - t * 0.78)));
      if (i === 0) headPoint = point;
    }
    if (item.head) {
      if (headPoint) {
        item.head.setAttribute('cx', round(headPoint.x));
        item.head.setAttribute('cy', round(headPoint.y));
        item.head.setAttribute('r', round(1.15 * layer.unit));
        item.head.setAttribute('fill', mix(hue, '#f7fffd', 0.82));
        item.head.setAttribute('opacity', '0.95');
      } else {
        item.head.setAttribute('opacity', '0');
      }
    }
    if (headPoint && state.showNodes) {
      for (const node of layer.nodeList) {
        if (node.el.style.display === 'none') continue;
        const dist = Math.hypot(node.x - headPoint.x, node.y - headPoint.y);
        if (dist < reach && dist < node.hotDist) {
          node.hot = 1 - dist / reach;
          node.hotDist = dist;
          node.hotColor = hue;
        }
      }
    }
  }
  styleNodes(layer);
}

function applyLook() {
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

function tick() {
  const now = performance.now();
  if (lastStamp) {
    const dt = Math.min(0.05, (now - lastStamp) / 1000);
    if (!document.hidden) elapsed += dt;
  }
  lastStamp = now;
  paint(elapsed);
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
      paint(elapsed);
      if (reduced && !allowReducedMotion) return undefined;
      if (!state.playing || !state.showComets) return undefined;
      gsap.ticker.add(tick);
      return () => {
        gsap.ticker.remove(tick);
        lastStamp = 0;
      };
    },
  );
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
  state.scene = scene === '404' ? '404' : 'logo';
  syncScenes();
  applyLook();
  armMotion();
  save();
}

function focusScene(scene) {
  setScene(scene);
  (scene === '404' ? sceneFour : sceneLogo).focus();
}

function mountGui() {
  const narrow = window.matchMedia('(max-width: 720px)').matches;
  gui = new GUI({ title: 'Circuit Mind', width: narrow ? 250 : 300 });
  gui.domElement.classList.add('logo-gui');
  if (narrow) gui.close();

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
}
