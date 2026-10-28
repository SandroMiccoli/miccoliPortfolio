/**
 * Circuit Mind mark and 404, drawn as open traces with a light on each path.
 * Mount either one into an element. See README.md.
 *
 * The returned `settings` object is live. Assign a key and the next frame uses it.
 * Call `destroy()` when the page removes the element.
 */

const NS = 'http://www.w3.org/2000/svg';
const DOTS = 28;
const LOGO_HALF = 12.6;

const VIEWS = {
  logo: { w: 327, h: 310 },
  404: { w: 2442, h: 1014 },
};

const FILTER_REGION = {
  logo: { x: -80, y: -80, w: 500, h: 480 },
  404: { x: -120, y: -120, w: 2682, h: 1254 },
};

/** Screen-pixel sizes. `[min, max, step]`. */
export const RANGES = {
  trace: [0.6, 3.2, 0.05],
  node: [3, 14, 0.1],
  glow: [0, 10, 0.1],
  packet: [16, 180, 1],
  speed: [24, 280, 1],
};

/** @type {Readonly<Record<string, number | string | boolean>>} */
export const DEFAULTS = {
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
  forceMotion: false,
  traceColor: '#F2F8FE',
  mint: '#1FC283',
  cyan: '#2D8AE8',
  background: '#020B16',
};

/** Tuned logo vertices, in the 327×310 view. */
export const DEFAULT_POINTS = {
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

const SETTING_KEYS = Object.keys(DEFAULTS);
const POINT_KEYS = Object.keys(DEFAULT_POINTS);
const COLOR_KEYS = new Set(['traceColor', 'mint', 'cyan']);

const mounted = new WeakMap();
let nextId = 1;
let fadeSerial = 0;

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

/**
 * @param {number} value
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

/**
 * @param {unknown} value
 * @param {boolean} fallback
 */
function bool(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * @param {string} key
 * @param {unknown} value
 */
function sanitize(key, value) {
  const fallback = DEFAULTS[key];
  if (typeof fallback === 'number') {
    const range = RANGES[key] || [0, 600];
    return num(value, fallback, range[0], range[1]);
  }
  if (typeof fallback === 'boolean') return bool(value, fallback);
  if (key === 'background') {
    if (value === 'transparent') return 'transparent';
    return hex(value, String(fallback));
  }
  if (COLOR_KEYS.has(key)) return hex(value, String(fallback));
  return fallback;
}

/**
 * @param {Record<string, unknown>} options
 */
function ensureSettings(options) {
  const settings = options.settings && typeof options.settings === 'object'
    ? /** @type {Record<string, unknown>} */ (options.settings)
    : {};
  for (const key of SETTING_KEYS) {
    const hasOption = Object.prototype.hasOwnProperty.call(options, key);
    const incoming = hasOption ? options[key] : settings[key];
    settings[key] = incoming === undefined ? DEFAULTS[key] : sanitize(key, incoming);
  }
  return settings;
}

/**
 * @param {string} name
 */
function svgEl(name) {
  return document.createElementNS(NS, name);
}

/**
 * @param {number} value
 */
function round(value) {
  return Math.round(value * 100) / 100;
}

/**
 * @param {number} value
 * @param {number} span
 */
function mod(value, span) {
  if (span <= 0) return 0;
  return ((value % span) + span) % span;
}

/**
 * @param {{ x: number, y: number }[]} pts
 */
function linePath(pts) {
  return pts
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${round(point.x)} ${round(point.y)}`)
    .join(' ');
}

/**
 * @param {string} hexColor
 */
function rgb(hexColor) {
  const n = Number.parseInt(hexColor.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * @param {string} from
 * @param {string} to
 * @param {number} t
 */
function mix(from, to, t) {
  const a = rgb(from);
  const b = rgb(to);
  const amount = Math.min(1, Math.max(0, t));
  const channels = a.map((channel, index) => Math.round(channel + (b[index] - channel) * amount));
  return `rgb(${channels[0]} ${channels[1]} ${channels[2]})`;
}

/**
 * @param {{ x: number, y: number }} a
 * @param {{ x: number, y: number }} b
 */
function vsub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * @param {{ x: number, y: number }} a
 * @param {{ x: number, y: number }} b
 */
function vadd(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * @param {{ x: number, y: number }} a
 * @param {number} s
 */
function vmul(a, s) {
  return { x: a.x * s, y: a.y * s };
}

/**
 * @param {{ x: number, y: number }} a
 */
function vlen(a) {
  return Math.hypot(a.x, a.y);
}

/**
 * @param {{ x: number, y: number }} a
 */
function vnorm(a) {
  const len = vlen(a) || 1;
  return { x: a.x / len, y: a.y / len };
}

/**
 * @param {{ x: number, y: number }} a
 */
function vleft(a) {
  return vnorm({ x: a.y, y: -a.x });
}

/**
 * @param {{ x: number, y: number }} p
 * @param {{ x: number, y: number }} r
 * @param {{ x: number, y: number }} q
 * @param {{ x: number, y: number }} s
 */
function vintersect(p, r, q, s) {
  const den = r.x * s.y - r.y * s.x;
  if (Math.abs(den) < 1e-6) return null;
  const t = ((q.x - p.x) * s.y - (q.y - p.y) * s.x) / den;
  return vadd(p, vmul(r, t));
}

/**
 * @param {{ x: number, y: number }[]} pts
 * @param {number} dist
 */
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

/**
 * @param {{ x: number, y: number }[]} sideL
 * @param {{ x: number, y: number }[]} sideR
 * @param {{ x: number, y: number }[]} pts
 * @param {boolean} atEnd
 * @param {{ type?: string, dir?: { x: number, y: number } } | undefined} cap
 */
function trimRibbonEnd(sideL, sideR, pts, atEnd, cap) {
  if (!cap || cap.type !== 'bevel') return;
  const indexL = atEnd ? sideL.length - 1 : 0;
  const indexR = atEnd ? sideR.length - 1 : 0;
  const origin = atEnd ? pts[pts.length - 1] : pts[0];
  const dir = atEnd
    ? vnorm(vsub(pts[pts.length - 1], pts[pts.length - 2]))
    : vnorm(vsub(pts[1], pts[0]));
  const cut = vnorm(cap.dir || dir);
  const leftHit = vintersect(sideL[indexL], dir, origin, cut);
  const rightHit = vintersect(sideR[indexR], dir, origin, cut);
  if (leftHit) sideL[indexL] = leftHit;
  if (rightHit) sideR[indexR] = rightHit;
}

/**
 * @param {{ x: number, y: number }[]} pts
 * @param {{ type?: string, dir?: { x: number, y: number } } | undefined} startCap
 * @param {{ type?: string, dir?: { x: number, y: number } } | undefined} endCap
 */
function ribbonSides(pts, startCap, endCap) {
  const sideL = offsetPoints(pts, LOGO_HALF);
  const sideR = offsetPoints(pts, -LOGO_HALF);
  trimRibbonEnd(sideL, sideR, pts, false, startCap);
  trimRibbonEnd(sideL, sideR, pts, true, endCap);
  return [sideL, sideR];
}

/**
 * @param {SVGPathElement} path
 */
function pathVertices(path) {
  const nums = (path.getAttribute('d')?.match(/-?\d+\.?\d*/g) || []).map(Number);
  const pts = [];
  for (let i = 0; i < nums.length; i += 2) {
    const point = { x: nums[i], y: nums[i + 1] };
    const prev = pts[pts.length - 1];
    if (!prev || Math.hypot(point.x - prev.x, point.y - prev.y) > 0.01) pts.push(point);
  }
  return pts;
}

/**
 * @param {{ x: number, y: number }[]} pts
 * @param {number[]} cum
 * @param {number} dist
 */
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

/**
 * @param {SVGPathElement} path
 * @param {number} length
 * @param {number} from
 * @param {number} to
 */
function slicePath(path, length, from, to) {
  const pts = pathVertices(path);
  if (pts.length < 2) return path.getAttribute('d') || '';
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

/**
 * Mount the mark or the 404 into `element`.
 * The element needs a width. Its height follows the artwork, unless you set one.
 *
 * `scene` is `'logo'` or `'404'`. Prefer `mountCircuitMindLogo` and `mountCircuitMind404`.
 * Pass `settings` to share one live object between two mounts. Any key of `DEFAULTS`
 * can also be passed directly. `background: 'transparent'` leaves the page showing through.
 * `pointerRoot` is the element whose pointer lights a trace. It defaults to `element`.
 *
 * @param {HTMLElement} element
 * @param {Record<string, unknown>} [options]
 */
export function mountCircuitMind(element, options = {}) {
  if (!(element instanceof HTMLElement)) {
    throw new Error('mountCircuitMind needs an element');
  }
  const previous = mounted.get(element);
  if (previous) previous.destroy();

  const scene = options.scene === '404' ? '404' : 'logo';
  const settings = ensureSettings(options);
  const points = options.points && typeof options.points === 'object'
    ? /** @type {typeof DEFAULT_POINTS} */ (options.points)
    : structuredClone(DEFAULT_POINTS);
  const pointerRoot = options.pointerRoot instanceof Element ? options.pointerRoot : element;
  const interactive = options.interactive !== false;
  const view = VIEWS[scene];
  const region = FILTER_REGION[scene];
  const id = nextId;
  nextId += 1;

  const owns = { role: false, label: false };
  element.classList.add('circuit-mind', scene === '404' ? 'circuit-mind--404' : 'circuit-mind--logo');
  element.classList.toggle('circuit-mind--passthrough', !interactive);
  if (!element.hasAttribute('role')) {
    element.setAttribute('role', 'img');
    owns.role = true;
  }
  if (!element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby')) {
    const fallback = scene === '404' ? '404' : 'Circuit Mind';
    const label = typeof options.label === 'string' && options.label.trim() ? options.label.trim() : fallback;
    element.setAttribute('aria-label', label);
    owns.label = true;
  }

  const svg = svgEl('svg');
  svg.setAttribute('viewBox', `0 0 ${view.w} ${view.h}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('role', 'presentation');
  svg.setAttribute('focusable', 'false');

  const defs = svgEl('defs');
  const filter = svgEl('filter');
  const filterId = `cm-glow-${id}`;
  filter.setAttribute('id', filterId);
  filter.setAttribute('filterUnits', 'userSpaceOnUse');
  filter.setAttribute('x', String(region.x));
  filter.setAttribute('y', String(region.y));
  filter.setAttribute('width', String(region.w));
  filter.setAttribute('height', String(region.h));
  filter.setAttribute('color-interpolation-filters', 'sRGB');
  const blur = svgEl('feGaussianBlur');
  blur.setAttribute('in', 'SourceGraphic');
  blur.setAttribute('stdDeviation', '3');
  filter.append(blur);
  defs.append(filter);

  const traces = svgEl('g');
  traces.setAttribute('fill', 'none');
  traces.setAttribute('stroke-linecap', 'round');
  traces.setAttribute('stroke-linejoin', scene === '404' ? 'round' : 'miter');
  if (scene !== '404') traces.setAttribute('stroke-miterlimit', '8');
  const nodes = svgEl('g');
  const comets = svgEl('g');
  const heads = svgEl('g');
  svg.append(defs, traces, nodes, comets, heads);
  element.append(svg);

  const layer = {
    traces,
    nodes,
    comets,
    heads,
    blur,
    filterId,
    nodeList: [],
    items: [],
    unit: 1,
  };

  /** @type {Record<string, number | string | boolean>} */
  let current = {};
  for (const key of SETTING_KEYS) current[key] = settings[key];

  let alive = true;
  let active = options.active !== false;
  let onScreen = true;
  let hold = 0;
  let raf = 0;
  let elapsed = 0;
  let lastStamp = 0;
  let applied = '';
  let burstHue = false;
  let loopSample = null;
  /** @type {Map<object, number>} */
  let cycles = new Map();
  const bursts = [];
  const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = reduceQuery.matches;

  function readSettings() {
    const next = {};
    for (const key of SETTING_KEYS) next[key] = sanitize(key, settings[key]);
    return next;
  }

  function pointStamp() {
    if (scene !== 'logo') return '';
    let text = '';
    for (const key of POINT_KEYS) {
      const point = points[key] || DEFAULT_POINTS[key];
      text += `|${point?.x},${point?.y}`;
    }
    return text;
  }

  /**
   * @param {SVGDefsElement} scope
   */
  function makeFadeGradient(scope) {
    fadeSerial += 1;
    const grad = svgEl('linearGradient');
    grad.setAttribute('id', `cm-${id}-fade-${fadeSerial}`);
    grad.setAttribute('gradientUnits', 'userSpaceOnUse');
    const stops = [0, 0.42, 1].map((offset) => {
      const stop = svgEl('stop');
      stop.setAttribute('offset', String(offset));
      grad.append(stop);
      return stop;
    });
    scope.append(grad);
    return { grad, stops };
  }

  /**
   * @param {object} spec
   */
  function addTrace(spec) {
    const path = svgEl('path');
    path.setAttribute('fill', 'none');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    traces.append(path);

    const traceNodes = [];
    for (const specNode of spec.nodes || []) {
      const el = svgEl('circle');
      el.setAttribute('vector-effect', 'non-scaling-stroke');
      const halo = svgEl('circle');
      halo.setAttribute('opacity', '0');
      nodes.append(el);
      comets.append(halo);
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
        hotColor: String(current.traceColor),
      };
      layer.nodeList.push(node);
      traceNodes.push(node);
    }

    const dots = [];
    let head = null;
    if (spec.hue) {
      for (let i = 0; i < DOTS; i += 1) {
        const dot = svgEl('circle');
        dot.setAttribute('opacity', '0');
        comets.append(dot);
        dots.push(dot);
      }
      head = svgEl('circle');
      head.setAttribute('opacity', '0');
      heads.append(head);
    }

    const item = {
      path,
      nodes: traceNodes,
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

  /**
   * @param {object} spec
   */
  function addRibbon(spec) {
    const sides = () => ribbonSides(spec.pts(), spec.start, spec.end);
    [0, 1].forEach((index) => {
      addTrace({
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

  function build404() {
    for (const glyph of FOUR_GLYPHS) {
      addTrace({
        hue: glyph.hue,
        phase: glyph.phase,
        closed: false,
        d: glyph.d,
        nodes: glyph.nodes,
      });
    }
  }

  /**
   * @param {object} item
   */
  function itemOn(item) {
    if (item.gate === 'top') return current.showTop;
    if (item.gate === 'bot') return current.showBot;
    if (item.gate === 'trace') return current.showTrace;
    return true;
  }

  /**
   * @param {object} item
   */
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

  /**
   * @param {object} item
   * @param {number} x
   * @param {number} y
   */
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

  /**
   * @param {object} item
   * @param {SVGDefsElement} scope
   */
  function ensureFade(item, scope) {
    if (item.fadeStart) return;
    const makePath = (stroke) => {
      const path = svgEl('path');
      path.setAttribute('fill', 'none');
      path.setAttribute('vector-effect', 'non-scaling-stroke');
      path.setAttribute('stroke-linecap', 'butt');
      path.setAttribute('stroke', stroke);
      path.style.display = 'none';
      traces.append(path);
      return path;
    };
    item.fadeIn = makeFadeGradient(scope);
    item.fadeOut = makeFadeGradient(scope);
    item.solid = makePath(String(current.traceColor));
    item.solid.setAttribute('stroke-linecap', 'round');
    item.fadeStart = makePath(`url(#${item.fadeIn.grad.id})`);
    item.fadeEnd = makePath(`url(#${item.fadeOut.grad.id})`);
  }

  /**
   * @param {{ grad: SVGLinearGradientElement, stops: SVGStopElement[] }} entry
   * @param {{ x: number, y: number }} tip
   * @param {{ x: number, y: number }} inner
   */
  function paintFade(entry, tip, inner) {
    entry.grad.setAttribute('x1', String(round(tip.x)));
    entry.grad.setAttribute('y1', String(round(tip.y)));
    entry.grad.setAttribute('x2', String(round(inner.x)));
    entry.grad.setAttribute('y2', String(round(inner.y)));
    const opacities = ['0', '0.2', '1'];
    entry.stops.forEach((stop, index) => {
      stop.setAttribute('stop-color', String(current.traceColor));
      stop.setAttribute('stop-opacity', opacities[index]);
    });
  }

  /**
   * @param {object} item
   * @param {number} at
   */
  function endpointFree(item, at) {
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

  /**
   * @param {object} item
   */
  function hideFade(item) {
    item.path.removeAttribute('stroke');
    if (!item.fadeStart) return;
    item.solid.style.display = 'none';
    item.fadeStart.style.display = 'none';
    item.fadeEnd.style.display = 'none';
  }

  /**
   * @param {object} item
   * @param {boolean} on
   */
  function updateFade(item, on) {
    if (!on || item.closed || item.length < 8) {
      hideFade(item);
      return;
    }
    ensureFade(item, defs);
    const fade = Math.min(50 * layer.unit, item.length * 0.35);
    const startFree = fade > 2 && endpointFree(item, 0);
    const endFree = fade > 2 && endpointFree(item, item.length);
    if (!startFree && !endFree) {
      hideFade(item);
      return;
    }
    const overlap = Math.min(1.2, fade * 0.08);
    const from = startFree ? Math.max(0, fade - overlap) : 0;
    const to = endFree ? Math.min(item.length, item.length - fade + overlap) : item.length;
    item.path.setAttribute('stroke', 'none');
    item.solid.style.display = '';
    item.solid.setAttribute('stroke', String(current.traceColor));
    item.solid.setAttribute('stroke-width', String(current.trace));
    item.solid.setAttribute('d', slicePath(item.path, item.length, from, to));
    item.fadeStart.style.display = startFree ? '' : 'none';
    item.fadeEnd.style.display = endFree ? '' : 'none';
    if (startFree) {
      item.fadeStart.setAttribute('d', slicePath(item.path, item.length, 0, fade));
      item.fadeStart.setAttribute('stroke-width', String(current.trace));
      paintFade(item.fadeIn, item.path.getPointAtLength(0), item.path.getPointAtLength(fade));
    }
    if (endFree) {
      item.fadeEnd.setAttribute('d', slicePath(item.path, item.length, item.length - fade, item.length));
      item.fadeEnd.setAttribute('stroke-width', String(current.trace));
      paintFade(
        item.fadeOut,
        item.path.getPointAtLength(Math.max(0, item.length - 0.05)),
        item.path.getPointAtLength(Math.max(0, item.length - fade)),
      );
    }
  }

  function measure() {
    const rect = svg.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return null;
    const scale = Math.min(rect.width / view.w, rect.height / view.h);
    if (scale <= 0) return null;
    return { scale, unit: 1 / scale };
  }

  function apply() {
    const box = measure();
    if (!box) return false;
    layer.unit = box.unit;
    layer.radius = Number(current.node) * box.unit;
    blur.setAttribute('stdDeviation', String(Number(current.glow) * box.unit));
    traces.setAttribute('stroke', String(current.traceColor));
    traces.setAttribute('stroke-width', String(current.trace));
    traces.style.display = current.showTraces ? '' : 'none';
    nodes.style.display = current.showNodes ? '' : 'none';
    comets.setAttribute('filter', Number(current.glow) > 0 ? `url(#${filterId})` : 'none');
    comets.style.display = current.showComets ? '' : 'none';
    heads.style.display = current.showComets ? '' : 'none';
    element.style.setProperty('--cm-bg', String(current.background));

    for (const item of layer.items) {
      writeItem(item);
      const on = itemOn(item);
      item.path.style.display = on ? '' : 'none';
      for (const node of item.nodes) node.el.style.display = on ? '' : 'none';
    }
    for (const item of layer.items) updateFade(item, Boolean(itemOn(item)));
    return true;
  }

  function styleNodes() {
    for (const node of layer.nodeList) {
      const hidden = node.el.style.display === 'none' || !current.showNodes;
      const radius = node.r || layer.radius;
      node.el.setAttribute('r', String(round(radius)));
      node.el.setAttribute('fill', String(current.background));
      node.el.setAttribute('stroke-width', String(node.hot ? Number(current.trace) * (1 + node.hot * 0.4) : current.trace));
      node.el.setAttribute('stroke', node.hot ? mix(String(current.traceColor), node.hotColor, 0.3 + node.hot * 0.7) : String(current.traceColor));
      node.halo.setAttribute('r', String(round(radius * (node.haloScale || 2.15))));
      node.halo.setAttribute('fill', node.hotColor || String(current.mint));
      node.halo.setAttribute('opacity', !hidden && node.hot && current.showComets ? String(0.28 + node.hot * 0.6) : '0');
    }
  }

  /**
   * @param {object} item
   * @param {number} distance
   */
  function sample(item, distance) {
    const { length } = item;
    if (length < 1) return null;
    let at = distance;
    if (item.closed) at = mod(distance, length);
    else if (distance < 0 || distance > length) return null;
    const point = item.path.getPointAtLength(Math.min(length - 0.01, Math.max(0, at)));
    return { x: point.x, y: point.y };
  }

  /**
   * @param {SVGCircleElement} dot
   * @param {{ x: number, y: number } | null} point
   * @param {number} t
   * @param {string} hue
   */
  function placeDot(dot, point, t, hue) {
    if (!point) {
      dot.setAttribute('opacity', '0');
      return null;
    }
    const radiusPx = 2.35 - t * 1.15;
    dot.setAttribute('cx', String(round(point.x)));
    dot.setAttribute('cy', String(round(point.y)));
    dot.setAttribute('r', String(round(Math.max(0.8, radiusPx) * layer.unit)));
    dot.setAttribute('fill', mix(hue, '#f7fffd', (1 - t) ** 2 * 0.7));
    dot.setAttribute('opacity', String(0.92 * (1 - t * 0.78)));
    return point;
  }

  /**
   * @param {{ x: number, y: number } | null} point
   * @param {string} hue
   * @param {number} reach
   */
  function heatNodes(point, hue, reach) {
    if (!point || !current.showNodes) return;
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

  /**
   * @param {SVGCircleElement | null} head
   * @param {{ x: number, y: number } | null} point
   * @param {string} hue
   */
  function placeHead(head, point, hue) {
    if (!head) return;
    if (!point) {
      head.setAttribute('opacity', '0');
      return;
    }
    head.setAttribute('cx', String(round(point.x)));
    head.setAttribute('cy', String(round(point.y)));
    head.setAttribute('r', String(round(1.15 * layer.unit)));
    head.setAttribute('fill', mix(hue, '#f7fffd', 0.82));
    head.setAttribute('opacity', '0.95');
  }

  /**
   * @param {object} burst
   * @param {number} back
   */
  function burstPoint(burst, back) {
    const along = burst.travel - back;
    const { item } = burst;
    if (along > item.length) return null;
    if (!item.closed && along < 0) return null;
    return sample(item, burst.origin + burst.dir * along);
  }

  /**
   * @param {number} time
   */
  function paint(time) {
    if (!current.showComets && bursts.length) clearBursts();
    for (const node of layer.nodeList) {
      node.hot = 0;
      node.hotDist = Infinity;
      node.hotColor = String(current.traceColor);
    }

    const tail = Number(current.packet) * layer.unit;
    const speed = Number(current.speed) * layer.unit;
    const reach = layer.radius * 2.5;

    for (const item of layer.items) {
      const draw = current.showComets && item.hue && itemOn(item) && item.length > 1 && item.dots.length;
      if (!draw) {
        for (const dot of item.dots) dot.setAttribute('opacity', '0');
        if (item.head) item.head.setAttribute('opacity', '0');
        continue;
      }
      const span = item.closed ? item.length : item.length + tail;
      const headAt = loopSample
        ? loopSample(item, span)
        : mod(time * speed + item.phase * item.length, span);
      const hue = String(current[item.hue]);
      const spacing = tail / (DOTS - 1);
      let headPoint = null;
      for (let i = 0; i < DOTS; i += 1) {
        const point = placeDot(item.dots[i], sample(item, headAt - i * spacing), i / (DOTS - 1), hue);
        if (i === 0) headPoint = point;
      }
      placeHead(item.head, headPoint, hue);
      heatNodes(headPoint, hue, reach);
    }

    for (const burst of bursts) {
      const hue = String(current[burst.hue]);
      const spacing = tail / (DOTS - 1);
      let headPoint = null;
      for (let i = 0; i < DOTS; i += 1) {
        const point = placeDot(burst.dots[i], burstPoint(burst, i * spacing), i / (DOTS - 1), hue);
        if (i === 0) headPoint = point;
      }
      placeHead(burst.head, headPoint, hue);
      heatNodes(headPoint, hue, reach);
    }
    styleNodes();
  }

  /**
   * @param {number} index
   */
  function removeBurst(index) {
    const burst = bursts[index];
    for (const dot of burst.dots) dot.remove();
    burst.head.remove();
    bursts.splice(index, 1);
  }

  function clearBursts() {
    while (bursts.length) removeBurst(0);
  }

  /**
   * @param {number} dt
   */
  function stepBursts(dt) {
    if (!dt || !current.showComets) return;
    for (let i = bursts.length - 1; i >= 0; i -= 1) {
      const burst = bursts[i];
      burst.travel += dt * Number(current.speed) * layer.unit;
      const tail = Number(current.packet) * layer.unit;
      if (burst.travel > burst.item.length + tail) removeBurst(i);
    }
  }

  function lightsMove() {
    if (!current.playing || !current.showComets) return false;
    if (current.forceMotion) return true;
    return !reduced;
  }

  function shouldRun() {
    return alive && active && onScreen && hold === 0 && !document.hidden;
  }

  function stop() {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
    lastStamp = 0;
  }

  function settingsStamp() {
    return `${SETTING_KEYS.map((key) => current[key]).join('|')}${pointStamp()}`;
  }

  /**
   * @param {number} dt
   * @returns {boolean} false when the element has no box yet
   */
  function refresh(dt) {
    current = readSettings();
    const dirty = settingsStamp() !== applied;
    if (dirty) {
      if (!apply()) return false;
      applied = settingsStamp();
    }
    const moving = lightsMove();
    if (moving) elapsed += dt;
    if (bursts.length) stepBursts(dt);
    if (dirty || moving || bursts.length) paint(elapsed);
    return true;
  }

  /**
   * @param {number} now
   */
  function frame(now) {
    raf = 0;
    if (!shouldRun()) return;
    const dt = lastStamp ? Math.min(0.05, (now - lastStamp) / 1000) : 0;
    lastStamp = now;
    if (!refresh(dt)) return;
    raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (!shouldRun() || raf) return;
    lastStamp = 0;
    if (!refresh(0)) return;
    raf = requestAnimationFrame(frame);
  }

  /**
   * @param {object} item
   * @param {number} at
   */
  function spawnBurst(item, at) {
    while (bursts.length >= 14) removeBurst(0);
    const dots = [];
    for (let i = 0; i < DOTS; i += 1) {
      const dot = svgEl('circle');
      dot.setAttribute('opacity', '0');
      comets.append(dot);
      dots.push(dot);
    }
    const head = svgEl('circle');
    head.setAttribute('opacity', '0');
    heads.append(head);
    let dir = 1;
    if (!item.closed && item.length - at < at * 0.35) dir = -1;
    let hue = item.hue;
    if (!hue) {
      burstHue = !burstHue;
      hue = burstHue ? 'mint' : 'cyan';
    }
    bursts.push({
      item,
      origin: at,
      dir,
      travel: 0,
      hue,
      dots,
      head,
    });
    kick();
  }

  function resetCrossings() {
    for (const item of layer.items) item.pointerGap = Infinity;
  }

  /**
   * @param {PointerEvent} event
   */
  function eventToSvg(event) {
    const rect = svg.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return null;
    const scale = Math.min(rect.width / view.w, rect.height / view.h);
    const drawnW = view.w * scale;
    const drawnH = view.h * scale;
    const left = rect.left + (rect.width - drawnW) / 2;
    const top = rect.top + (rect.height - drawnH) / 2;
    if (event.clientX < left || event.clientX > left + drawnW || event.clientY < top || event.clientY > top + drawnH) {
      return null;
    }
    return {
      x: (event.clientX - left) / scale,
      y: (event.clientY - top) / scale,
    };
  }

  /**
   * @param {PointerEvent} event
   */
  function onPointerMove(event) {
    if (!alive || !active || hold > 0) return;
    if (event.target instanceof Element && event.target.closest('button, a, input, textarea, select, .lil-gui')) {
      resetCrossings();
      return;
    }
    const point = eventToSvg(event);
    if (!point || !current.showTraces || !current.showComets) {
      resetCrossings();
      return;
    }
    const threshold = 8 * layer.unit;
    for (const item of layer.items) {
      if (!itemOn(item) || item.length < 8 || item.path.style.display === 'none') continue;
      const hit = closestOnItem(item, point.x, point.y);
      if (!hit) continue;
      const was = item.pointerGap;
      item.pointerGap = hit.gap;
      if (was > threshold && hit.gap <= threshold) spawnBurst(item, hit.at);
    }
  }

  function onPointerLeave() {
    resetCrossings();
  }

  function onVisibility() {
    if (document.hidden) stop();
    else kick();
  }

  function onReduce() {
    reduced = reduceQuery.matches;
    applied = '';
    kick();
  }

  /**
   * @param {object} item
   */
  function cometSpan(item) {
    const tail = Number(current.packet) * layer.unit;
    return item.closed ? item.length : item.length + tail;
  }

  function activeComets() {
    if (!current.showComets) return [];
    return layer.items.filter((item) => item.hue && itemOn(item) && item.length > 1 && item.dots.length);
  }

  function assertLoopCloses() {
    for (const [item, turns] of cycles) {
      const span = cometSpan(item);
      const start = mod(item.phase * item.length, span);
      const end = mod(start + turns * span, span);
      const gap = Math.min(Math.abs(start - end), Math.abs(span - Math.abs(start - end)));
      if (gap > 0.05) throw new Error('Loop does not close');
    }
  }

  function motionValues() {
    const values = [];
    const take = (root) => {
      root.querySelectorAll('circle').forEach((el) => {
        ['cx', 'cy', 'r', 'opacity'].forEach((name) => {
          const number = Number(el.getAttribute(name));
          if (Number.isFinite(number)) values.push(number);
        });
      });
    };
    take(comets);
    take(heads);
    take(nodes);
    return values;
  }

  /**
   * Shortest duration in which every comet finishes a whole number of trips.
   * @param {number} [fps]
   */
  function loopPlan(fps = 60) {
    current = readSettings();
    apply();
    const rate = Math.max(1, fps);
    const cometsOn = activeComets();
    const speed = Math.max(1, Number(current.speed) * layer.unit);
    const periods = cometsOn.map((item) => cometSpan(item) / speed);
    const minFrames = rate * 4;
    const maxFrames = rate * 8;
    cycles = new Map();
    if (!periods.length) return { frameCount: rate * 2 };

    let bestError = Infinity;
    const errors = [];
    for (let frames = minFrames; frames <= maxFrames; frames += 1) {
      const seconds = frames / rate;
      let error = 0;
      for (const period of periods) error += Math.abs(seconds / period - Math.round(seconds / period));
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

    const seconds = frameCount / rate;
    for (const item of cometsOn) {
      const period = cometSpan(item) / speed;
      cycles.set(item, Math.max(1, Math.round(seconds / period)));
    }
    assertLoopCloses();
    return { frameCount };
  }

  /**
   * @param {number} progress
   */
  function paintProgress(progress) {
    const safe = Math.min(1, Math.max(0, Number(progress) || 0));
    loopSample = (item, span) => {
      const turns = cycles.get(item) || 1;
      const start = mod(item.phase * item.length, span);
      return mod(start + safe * turns * span, span);
    };
    current = readSettings();
    apply();
    paint(0);
  }

  const observer = new IntersectionObserver((entries) => {
    onScreen = entries.some((entry) => entry.isIntersecting);
    if (onScreen) kick();
    else stop();
  });
  observer.observe(element);

  const resizeObserver = new ResizeObserver(() => {
    applied = '';
    kick();
  });
  resizeObserver.observe(element);

  document.addEventListener('visibilitychange', onVisibility);
  reduceQuery.addEventListener('change', onReduce);
  if (interactive) {
    pointerRoot.addEventListener('pointermove', onPointerMove);
    pointerRoot.addEventListener('pointerleave', onPointerLeave);
  }

  if (scene === '404') build404();
  else buildLogo();

  const api = {
    settings,
    scene,
    get svg() { return svg; },
    get view() { return view; },
    get unit() { return layer.unit; },
    setActive(next) {
      if (!alive) return;
      active = Boolean(next);
      if (!active) {
        clearBursts();
        resetCrossings();
        stop();
        return;
      }
      applied = '';
      kick();
    },
    suspend() {
      hold += 1;
      stop();
    },
    resume() {
      if (!alive) return;
      hold = Math.max(0, hold - 1);
      loopSample = null;
      if (hold === 0) {
        applied = '';
        kick();
      }
    },
    loopPlan,
    paintProgress,
    motionValues,
    destroy() {
      if (!alive) return;
      alive = false;
      stop();
      clearBursts();
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      reduceQuery.removeEventListener('change', onReduce);
      pointerRoot.removeEventListener('pointermove', onPointerMove);
      pointerRoot.removeEventListener('pointerleave', onPointerLeave);
      svg.remove();
      element.classList.remove('circuit-mind', 'circuit-mind--logo', 'circuit-mind--404', 'circuit-mind--passthrough');
      element.style.removeProperty('--cm-bg');
      if (owns.role) element.removeAttribute('role');
      if (owns.label) element.removeAttribute('aria-label');
      mounted.delete(element);
    },
  };

  mounted.set(element, api);
  if (active) kick();
  return api;
}

/**
 * @param {HTMLElement} element
 * @param {Record<string, unknown>} [options]
 */
export function mountCircuitMindLogo(element, options = {}) {
  return mountCircuitMind(element, { ...options, scene: 'logo' });
}

/**
 * @param {HTMLElement} element
 * @param {Record<string, unknown>} [options]
 */
export function mountCircuitMind404(element, options = {}) {
  return mountCircuitMind(element, { ...options, scene: '404' });
}
