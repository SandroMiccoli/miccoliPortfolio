import GUI from './vendor/lil-gui.esm.min.js';

const STORAGE_KEY = 'vanilla-js-circuit-mind-logo-v3';

const DEFAULT_STATE = {
  showRef: false,
  refOpacity: 0.5,
  refScale: 1,
  refX: 0,
  refY: 0,
  topWidth: 24,
  botWidth: 24,
  traceWidth: 24,
  baseExtra: 0,
  baseOpacity: 1,
  showBase: true,
  showBeams: true,
  showNodes: true,
  nodeFill: true,
  nodeRadius: 15,
  nodeStroke: 14,
  glow: 3,
  speed: 160,
  packet: 80,
  playing: true,
  showTop: true,
  showBot: true,
  showTrace: true,
  variant: 'v1',
  scene: 'logo',
  white: '#ffffff',
  gray: '#b5b5b5',
  cyan: '#1cb5df',
  blue: '#1e5a9d',
  background: '#202020',
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

// Outward tangents of the isometric end cuts on the bottom trace.
const BOT_CAP = {
  startOut: { x: 0.504, y: -0.863 },
  endOut: { x: 1, y: 0 },
};

const OUTLINE_WIDTH = 2;
const DIGIT_STROKE = 58;
const FOUR_VIEW = { w: 1120, h: 500 };
const ZERO_BOX = { x: 420, y: 70, w: 280, h: 360, r: 140 };
const DEFAULT_TOP_OUTLINE = 'M 86 95 L 155.9 54.8 L 221.8 94.3 L 234.2 73.7 L 156.9 27.4 L 65 81.3 Z';

const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

const state = structuredClone(DEFAULT_STATE);
const points = structuredClone(DEFAULT_POINTS);
let allowReducedMotion = false;

const logoRoot = document.querySelector('.logo');
const stage = document.getElementById('cm-stage-logo');
const stage404 = document.getElementById('cm-stage-404');
const sceneLogo = document.getElementById('cm-scene-logo');
const sceneFour = document.getElementById('cm-scene-404');
const fourBase = document.getElementById('cm-404-base');
const fourStreams = document.getElementById('cm-404-streams');
const glowFilter404 = document.getElementById('cm-glow-404');
const glowWide404 = document.getElementById('cm-glow-wide-404');
const glowAlpha404 = document.getElementById('cm-glow-alpha-404');
const glowPad404 = document.getElementById('cm-glow-pad-404');
const refEl = document.getElementById('cm-ref');
const versionV1 = document.getElementById('cm-version-v1');
const versionV2 = document.getElementById('cm-version-v2');
const base = document.getElementById('cm-base');
const streams = document.getElementById('cm-streams');
const nodes = document.getElementById('cm-nodes');
const baseTop = document.getElementById('cm-base-top');
const baseBot = document.getElementById('cm-base-bot');
const baseM = document.getElementById('cm-base-m');
const streamTop = document.getElementById('cm-stream-top');
const streamBot = document.getElementById('cm-stream-bot');
const streamM = document.getElementById('cm-stream-m');
const nodeCyan = document.getElementById('cm-node-cyan');
const nodeGray = document.getElementById('cm-node-gray');
const nodeBlue = document.getElementById('cm-node-blue');
const holeCyan = document.getElementById('cm-hole-cyan');
const holeGray = document.getElementById('cm-hole-gray');
const holeBlue = document.getElementById('cm-hole-blue');
const pulseGray = document.getElementById('cm-pulse-gray');
const pulseBlue = document.getElementById('cm-pulse-blue');
const glowFilter = document.getElementById('cm-glow');
const glowWide = document.getElementById('cm-glow-wide');
const glowAlpha = document.getElementById('cm-glow-alpha');
const glowPad = document.getElementById('cm-glow-pad');
const stopTopA = document.getElementById('cm-top-a');
const stopTopB = document.getElementById('cm-top-b');
const stopBotA = document.getElementById('cm-bot-a');
const stopBotB = document.getElementById('cm-bot-b');
const stopMA = document.getElementById('cm-m-a');
const stopMB = document.getElementById('cm-m-b');

let mm = null;
let gui = null;
let active = [];
const fourSegments = [];
let zeroBase = null;
let zeroStream = null;

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

const NUMBER_RANGE = {
  refOpacity: [0, 1],
  refScale: [0.2, 1.8],
  refX: [-40, 40],
  refY: [-40, 40],
  topWidth: [1, 48],
  botWidth: [1, 48],
  traceWidth: [1, 48],
  baseExtra: [0, 30],
  baseOpacity: [0, 1],
  nodeRadius: [4, 40],
  nodeStroke: [1, 16],
  glow: [0, 20],
  speed: [40, 800],
  packet: [8, 500],
};

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
      } else if (key === 'variant') {
        target[key] = value === 'v2' ? 'v2' : 'v1';
      } else if (key === 'scene') {
        target[key] = value === '404' ? '404' : 'logo';
      } else {
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
  const snapshot = {
    state: { ...state },
    points: structuredClone(points),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

function coord(value) {
  return Math.round(value * 10) / 10;
}

function line(parts) {
  return parts
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${coord(point.x)} ${coord(point.y)}`)
    .join(' ');
}

function unit(vector) {
  const length = Math.hypot(vector.x, vector.y) || 1;
  return { x: vector.x / length, y: vector.y / length };
}

function add(point, vector, scale) {
  return { x: point.x + vector.x * scale, y: point.y + vector.y * scale };
}

function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}

function leftNormal(direction) {
  return { x: direction.y, y: -direction.x };
}

function lineIntersect(originA, dirA, originB, dirB) {
  const det = dirA.x * dirB.y - dirA.y * dirB.x;
  if (Math.abs(det) < 1e-8) return { x: originA.x, y: originA.y };
  const t = ((originB.x - originA.x) * dirB.y - (originB.y - originA.y) * dirB.x) / det;
  return add(originA, dirA, t);
}

function outlineStroke(pts, width, startOut, endOut) {
  const half = width / 2;
  const dirs = [];
  for (let i = 0; i < pts.length - 1; i += 1) dirs.push(unit(sub(pts[i + 1], pts[i])));
  const outwardStart = startOut ? unit(startOut) : { x: -dirs[0].x, y: -dirs[0].y };
  const outwardEnd = endOut ? unit(endOut) : dirs[dirs.length - 1];

  function capCorner(point, outward, segment, side) {
    const capDir = leftNormal(unit(outward));
    const normal = leftNormal(segment);
    const sideNormal = side === 'left' ? normal : { x: -normal.x, y: -normal.y };
    return lineIntersect(point, capDir, add(point, sideNormal, half), segment);
  }

  function join(index, side) {
    const d0 = dirs[index - 1];
    const d1 = dirs[index];
    const sign = side === 'left' ? 1 : -1;
    const n0 = leftNormal(d0);
    const n1 = leftNormal(d1);
    const originA = add(pts[index], n0, sign * half);
    const originB = add(pts[index], n1, sign * half);
    const hit = lineIntersect(originA, d0, originB, d1);
    if (Math.hypot(hit.x - pts[index].x, hit.y - pts[index].y) > half * 3) return [originA, originB];
    return [hit];
  }

  const left = [capCorner(pts[0], outwardStart, dirs[0], 'left')];
  const right = [capCorner(pts[0], outwardStart, dirs[0], 'right')];
  for (let i = 1; i < pts.length - 1; i += 1) {
    left.push(...join(i, 'left'));
    right.push(...join(i, 'right'));
  }
  const last = pts.length - 1;
  left.push(capCorner(pts[last], outwardEnd, dirs[dirs.length - 1], 'left'));
  right.push(capCorner(pts[last], outwardEnd, dirs[dirs.length - 1], 'right'));
  return `${line([...right, ...left.reverse()])} Z`;
}

function insetEnd(end, toward, distance) {
  return add(end, unit(sub(toward, end)), distance);
}

function setSplit(stopA, stopB, splitX) {
  const value = String(Math.min(1, Math.max(0, splitX / 327)));
  stopA.setAttribute('offset', value);
  stopB.setAttribute('offset', value);
}

function setShown(el, on) {
  el.style.display = on ? '' : 'none';
}

function isOutline() {
  return state.variant === 'v2';
}

function nodeOuter() {
  return state.nodeRadius + state.nodeStroke / 2;
}

function nodeInner() {
  return Math.max(0.8, state.nodeRadius - state.nodeStroke / 2);
}

function placeCircle(el, point, radius) {
  el.setAttribute('cx', coord(point.x));
  el.setAttribute('cy', coord(point.y));
  el.setAttribute('r', coord(radius));
}

function samePoint(a, b) {
  return a.x === b.x && a.y === b.y;
}

function topUsesDrawnOutline() {
  return state.topWidth === DEFAULT_STATE.topWidth
    && state.baseExtra === DEFAULT_STATE.baseExtra
    && samePoint(points.topA, DEFAULT_POINTS.topA)
    && samePoint(points.topPeak, DEFAULT_POINTS.topPeak)
    && samePoint(points.topB, DEFAULT_POINTS.topB);
}

function applyShape() {
  const outline = isOutline();
  const topPts = [points.topA, points.topPeak, points.topB];
  const botPts = [points.botA, points.botB, points.botPeak, points.botC];
  const tracePts = [points.mA, points.mMid, points.mElbow, points.mB];
  const topOutline = topUsesDrawnOutline()
    ? DEFAULT_TOP_OUTLINE
    : outlineStroke(topPts, state.topWidth + state.baseExtra);
  const botOutline = outlineStroke(
    botPts,
    state.botWidth + state.baseExtra,
    BOT_CAP.startOut,
    BOT_CAP.endOut,
  );
  const traceOutline = outlineStroke(tracePts, state.traceWidth + state.baseExtra);

  baseTop.setAttribute('d', topOutline);
  baseBot.setAttribute('d', botOutline);
  baseM.setAttribute('d', traceOutline);

  if (outline) {
    streamTop.setAttribute('d', topOutline);
    streamBot.setAttribute('d', botOutline);
    streamM.setAttribute('d', traceOutline);
    for (const [path, gradient] of [
      [baseTop, 'url(#cm-grad-top)'],
      [baseBot, 'url(#cm-grad-bot)'],
      [baseM, 'url(#cm-grad-m)'],
    ]) {
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', gradient);
      path.setAttribute('stroke-width', OUTLINE_WIDTH);
    }
  } else {
    streamTop.setAttribute('d', line([
      insetEnd(points.topA, points.topPeak, state.topWidth * 0.45),
      points.topPeak,
      points.topB,
    ]));
    streamBot.setAttribute('d', line([
      insetEnd(points.botA, points.botB, state.botWidth * 0.55),
      points.botB,
      points.botPeak,
      insetEnd(points.botC, points.botPeak, state.botWidth * 0.55),
    ]));
    streamM.setAttribute('d', line(tracePts));
    for (const [path, gradient] of [
      [baseTop, 'url(#cm-grad-top)'],
      [baseBot, 'url(#cm-grad-bot)'],
      [baseM, 'url(#cm-grad-m)'],
    ]) {
      path.setAttribute('fill', gradient);
      path.setAttribute('stroke', 'none');
    }
  }

  setSplit(stopTopA, stopTopB, points.topPeak.x);
  setSplit(stopBotA, stopBotB, points.botPeak.x);
  setSplit(stopMA, stopMB, points.mMid.x);

  const ringRadius = outline ? nodeOuter() : state.nodeRadius;
  placeCircle(nodeCyan, points.mA, ringRadius);
  placeCircle(nodeGray, points.topB, ringRadius);
  placeCircle(nodeBlue, points.mB, ringRadius);
  placeCircle(holeCyan, points.mA, nodeInner());
  placeCircle(holeGray, points.topB, nodeInner());
  placeCircle(holeBlue, points.mB, nodeInner());
  placeCircle(pulseGray, points.topB, ringRadius);
  placeCircle(pulseBlue, points.mB, ringRadius);
}

function makePath(parent) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  parent.append(path);
  return path;
}

function fourParts(x, y, w, h) {
  const stemX = x + w * 0.68;
  const barY = y + h * 0.58;
  const apex = y + h * 0.08;
  const left = x + w * 0.02;
  return [
    [{ x: stemX, y }, { x: stemX, y: y + h }],
    [{ x: left, y: barY }, { x: stemX + w * 0.18, y: barY }],
    [{ x: left, y: barY }, { x: stemX, y: apex }],
  ];
}

function roundedLoop(x, y, w, h, r) {
  const right = x + w;
  const bottom = y + h;
  return [
    `M ${coord(x + r)} ${coord(y)}`,
    `H ${coord(right - r)}`,
    `Q ${coord(right)} ${coord(y)} ${coord(right)} ${coord(y + r)}`,
    `V ${coord(bottom - r)}`,
    `Q ${coord(right)} ${coord(bottom)} ${coord(right - r)} ${coord(bottom)}`,
    `H ${coord(x + r)}`,
    `Q ${coord(x)} ${coord(bottom)} ${coord(x)} ${coord(bottom - r)}`,
    `V ${coord(y + r)}`,
    `Q ${coord(x)} ${coord(y)} ${coord(x + r)} ${coord(y)}`,
    'Z',
  ].join(' ');
}

function insetLine(pts, distance) {
  if (pts.length < 2 || distance <= 0) return pts;
  const next = pts.map((point) => ({ x: point.x, y: point.y }));
  next[0] = insetEnd(next[0], next[1], distance);
  const last = next.length - 1;
  next[last] = insetEnd(next[last], next[last - 1], distance);
  return next;
}

function init404() {
  const specs = [
    { x: 80, y: 70, w: 250, h: 360, color: 'white', phase: 0 },
    { x: 790, y: 70, w: 250, h: 360, color: 'blue', phase: 0.5 },
  ];
  for (const spec of specs) {
    fourParts(spec.x, spec.y, spec.w, spec.h).forEach((pts, index) => {
      fourSegments.push({
        pts,
        color: spec.color,
        phase: (spec.phase + index * 0.28) % 1,
        base: makePath(fourBase),
        stream: makePath(fourStreams),
      });
    });
  }
  zeroBase = makePath(fourBase);
  zeroStream = makePath(fourStreams);
  zeroBase.setAttribute('stroke-linejoin', 'round');
  zeroStream.setAttribute('stroke-linejoin', 'round');
}

function digitStreams() {
  return [...fourSegments.map((segment) => segment.stream), zeroStream];
}

function paintGlow(filter, blur, alpha, padRect, viewWidth, viewHeight, wide, slope) {
  const pad = Math.ceil(wide * 4 + 48);
  const region = [-pad, -pad, viewWidth + pad * 2, viewHeight + pad * 2];
  filter.setAttribute('x', String(region[0]));
  filter.setAttribute('y', String(region[1]));
  filter.setAttribute('width', String(region[2]));
  filter.setAttribute('height', String(region[3]));
  blur.setAttribute('x', String(region[0]));
  blur.setAttribute('y', String(region[1]));
  blur.setAttribute('width', String(region[2]));
  blur.setAttribute('height', String(region[3]));
  blur.setAttribute('stdDeviation', wide);
  alpha.setAttribute('slope', slope);
  padRect.setAttribute('x', String(region[0]));
  padRect.setAttribute('y', String(region[1]));
  padRect.setAttribute('width', String(region[2]));
  padRect.setAttribute('height', String(region[3]));
}

function apply404() {
  const outline = isOutline();
  const beam = outline ? OUTLINE_WIDTH : Math.max(10, DIGIT_STROKE * 0.55);
  for (const segment of fourSegments) {
    const color = state[segment.color];
    segment.stream.setAttribute('fill', 'none');
    segment.stream.setAttribute('stroke', color);
    segment.stream.setAttribute('stroke-width', beam);
    if (outline) {
      const spine = line(segment.pts);
      segment.base.setAttribute('d', spine);
      segment.base.setAttribute('fill', 'none');
      segment.base.setAttribute('stroke', color);
      segment.base.setAttribute('stroke-width', OUTLINE_WIDTH);
      segment.stream.setAttribute('d', spine);
    } else {
      segment.base.setAttribute('d', outlineStroke(segment.pts, DIGIT_STROKE));
      segment.base.setAttribute('fill', color);
      segment.base.setAttribute('stroke', 'none');
      segment.stream.setAttribute('d', line(insetLine(segment.pts, beam / 2)));
    }
  }

  const loop = roundedLoop(ZERO_BOX.x, ZERO_BOX.y, ZERO_BOX.w, ZERO_BOX.h, ZERO_BOX.r);
  const zeroWidth = outline ? OUTLINE_WIDTH : DIGIT_STROKE;
  zeroBase.setAttribute('d', loop);
  zeroBase.setAttribute('fill', 'none');
  zeroBase.setAttribute('stroke', state.cyan);
  zeroBase.setAttribute('stroke-width', zeroWidth);
  zeroStream.setAttribute('d', loop);
  zeroStream.setAttribute('fill', 'none');
  zeroStream.setAttribute('stroke', state.cyan);
  zeroStream.setAttribute('stroke-width', beam);

  fourBase.setAttribute('opacity', state.baseOpacity);
  fourStreams.setAttribute('filter', state.glow > 0 ? 'url(#cm-glow-404)' : 'none');
  setShown(fourBase, state.showBase);
  setShown(fourStreams, state.showBeams);

  const wide = state.glow * (outline ? 3.4 : 13);
  paintGlow(
    glowFilter404,
    glowWide404,
    glowAlpha404,
    glowPad404,
    FOUR_VIEW.w,
    FOUR_VIEW.h,
    wide,
    outline ? '0.7' : '0.55',
  );
}

function applyLook() {
  stage.style.setProperty('--logo-bg', state.background);
  document.documentElement.style.background = state.background;
  document.body.style.background = state.background;
  logoRoot.style.background = state.background;
  logoRoot.style.setProperty('--accent', state.cyan);
  stage.style.setProperty('--accent', state.cyan);
  stage.style.setProperty('--ref-opacity', state.showRef ? String(state.refOpacity) : '0');
  stage.style.setProperty('--ref-x', `${state.refX}%`);
  stage.style.setProperty('--ref-y', `${state.refY}%`);
  stage.style.setProperty('--ref-scale', String(state.refScale));

  applyShape();
  const beamWidth = (width) => (isOutline() ? OUTLINE_WIDTH : Math.max(8, width * 0.55));
  streamTop.setAttribute('stroke-width', beamWidth(state.topWidth));
  streamBot.setAttribute('stroke-width', beamWidth(state.botWidth));
  streamM.setAttribute('stroke-width', beamWidth(state.traceWidth));
  base.setAttribute('opacity', state.baseOpacity);
  streams.setAttribute('filter', state.glow > 0 ? 'url(#cm-glow)' : 'none');

  stopTopA.setAttribute('stop-color', state.white);
  stopBotA.setAttribute('stop-color', state.white);
  stopTopB.setAttribute('stop-color', state.gray);
  stopBotB.setAttribute('stop-color', state.gray);
  stopMA.setAttribute('stop-color', state.cyan);
  stopMB.setAttribute('stop-color', state.blue);
  nodeCyan.setAttribute('stroke', state.cyan);
  nodeGray.setAttribute('stroke', state.gray);
  nodeBlue.setAttribute('stroke', state.blue);
  pulseGray.setAttribute('stroke', state.gray);
  pulseBlue.setAttribute('stroke', state.blue);
  nodes.setAttribute('fill', isOutline() || state.nodeFill ? state.background : 'none');
  nodes.setAttribute('stroke-width', isOutline() ? OUTLINE_WIDTH : state.nodeStroke);

  const wide = state.glow * (isOutline() ? 1.6 : 6);
  paintGlow(
    glowFilter,
    glowWide,
    glowAlpha,
    glowPad,
    327,
    310,
    wide,
    isOutline() ? '0.7' : '0.55',
  );
  apply404();

  setShown(base, state.showBase);
  setShown(streams, state.showBeams);
  setShown(nodes, state.showNodes);
  setShown(baseTop, state.showTop);
  setShown(streamTop, state.showTop);
  setShown(baseBot, state.showBot);
  setShown(streamBot, state.showBot);
  setShown(baseM, state.showTrace);
  setShown(streamM, state.showTrace);
  setShown(nodeGray, state.showTop && state.showNodes);
  setShown(holeGray, isOutline() && state.showTop && state.showNodes);
  setShown(pulseGray, state.showTop && state.showNodes && !isOutline());
  setShown(nodeCyan, state.showTrace && state.showNodes);
  setShown(holeCyan, isOutline() && state.showTrace && state.showNodes);
  setShown(nodeBlue, state.showTrace && state.showNodes);
  setShown(holeBlue, isOutline() && state.showTrace && state.showNodes);
  setShown(pulseBlue, state.showTrace && state.showNodes && !isOutline());
  holeCyan.setAttribute('stroke', state.cyan);
  holeGray.setAttribute('stroke', state.gray);
  holeBlue.setAttribute('stroke', state.blue);
  syncVersions();
  syncScenes();
}

function clearDashes() {
  gsap.set([streamTop, streamBot, streamM, ...digitStreams()], {
    clearProps: 'strokeDasharray,strokeDashoffset',
  });
}

function hidePulses() {
  const radius = isOutline() ? nodeOuter() : state.nodeRadius;
  gsap.set([pulseGray, pulseBlue], {
    opacity: 0,
    strokeWidth: isOutline() ? OUTLINE_WIDTH : state.nodeStroke,
  });
  pulseGray.setAttribute('r', radius);
  pulseBlue.setAttribute('r', radius);
}

function beam(path, pulse, phase = 0) {
  const length = path.getTotalLength();
  if (length < 1 || state.speed < 1) return null;
  const span = length + state.packet;
  const duration = span / state.speed;
  const hitTime = length / state.speed;
  const start = state.packet - phase * span;
  gsap.set(path, {
    strokeDasharray: `${state.packet} ${span + 100}`,
    strokeDashoffset: start,
  });
  const tl = gsap.timeline({ repeat: -1 });
  tl.to(path, {
    strokeDashoffset: start - span,
    duration,
    ease: 'none',
  }, 0);
  if (pulse && !isOutline()) {
    const radius = state.nodeRadius;
    tl.fromTo(pulse, {
      attr: { r: radius },
      opacity: 1,
      strokeWidth: state.nodeStroke + 2,
    }, {
      attr: { r: radius + 21 },
      opacity: 0,
      strokeWidth: 0,
      duration: 0.6,
      ease: 'power2.out',
    }, hitTime);
  }
  return tl;
}

function startBeams() {
  const jobs = [
    [streamTop, state.showTop && state.showNodes ? pulseGray : null, state.showTop],
    [streamBot, null, state.showBot],
    [streamM, state.showTrace && state.showNodes ? pulseBlue : null, state.showTrace],
  ];
  const timelines = [];
  for (const [path, pulse, on] of jobs) {
    if (!on) continue;
    const tl = beam(path, pulse);
    if (tl) timelines.push(tl);
  }
  return timelines;
}

function start404Beams() {
  if (!state.showBeams) return [];
  const timelines = [];
  for (const segment of fourSegments) {
    const tl = beam(segment.stream, null, segment.phase);
    if (tl) timelines.push(tl);
  }
  const zeroTl = beam(zeroStream, null, 0.18);
  if (zeroTl) timelines.push(zeroTl);
  return timelines;
}

function armMotion() {
  if (mm) mm.revert();
  active = [];
  mm = gsap.matchMedia();
  mm.add(
    {
      reduce: '(prefers-reduced-motion: reduce)',
      ok: '(prefers-reduced-motion: no-preference)',
    },
    (context) => {
      clearDashes();
      hidePulses();
      const reduced = Boolean(context.conditions && context.conditions.reduce);
      const allow = state.playing && state.showBeams && (!reduced || allowReducedMotion);
      if (!allow) return undefined;
      active = state.scene === '404' ? start404Beams() : startBeams();
      if (document.hidden) active.forEach((tl) => tl.pause());
      return () => {
        active.forEach((tl) => tl.kill());
        active = [];
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
  if (reduceQuery.matches) state.playing = false;
}

function onShapeEnd() {
  armMotion();
  save();
}

function onLookEnd() {
  armMotion();
  save();
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
  stroke.add(state, 'topWidth', 1, 48, 0.5).name('Top').onChange(applyLook).onFinishChange(onLookEnd);
  stroke.add(state, 'botWidth', 1, 48, 0.5).name('Bottom').onChange(applyLook).onFinishChange(onLookEnd);
  stroke.add(state, 'traceWidth', 1, 48, 0.5).name('Trace').onChange(applyLook).onFinishChange(onLookEnd);
  stroke.add(state, 'baseExtra', 0, 30, 0.5).name('Underlay +').onChange(applyLook).onFinishChange(onLookEnd);
  stroke.add(state, 'baseOpacity', 0, 1, 0.01).name('Underlay opacity').onChange(applyLook).onFinishChange(save);
  stroke.add(state, 'nodeRadius', 4, 40, 0.5).name('Node radius').onChange(applyLook).onFinishChange(onLookEnd);
  stroke.add(state, 'nodeStroke', 1, 16, 0.5).name('Node stroke').onChange(applyLook).onFinishChange(onLookEnd);
  stroke.add(state, 'glow', 0, 20, 0.5).name('Glow').onChange(applyLook).onFinishChange(save);

  const motion = gui.addFolder('Motion');
  motion.add(state, 'speed', 40, 800, 1).name('Speed').onFinishChange(onShapeEnd);
  motion.add(state, 'packet', 8, 500, 1).name('Packet').onFinishChange(onShapeEnd);
  motion.add(state, 'playing').name('Animate').onChange(() => {
    if (state.playing && reduceQuery.matches) allowReducedMotion = true;
    if (!state.playing) allowReducedMotion = false;
    armMotion();
    save();
  });
  motion.close();

  const layers = gui.addFolder('Layers');
  layers.add(state, 'showBase').name('Underlay').onChange(applyLook).onFinishChange(save);
  layers.add(state, 'showBeams').name('Beams').onChange(() => {
    applyLook();
    armMotion();
  }).onFinishChange(save);
  layers.add(state, 'showNodes').name('Nodes').onChange(() => {
    applyLook();
    armMotion();
  }).onFinishChange(save);
  layers.add(state, 'nodeFill').name('Solid nodes').onChange(applyLook).onFinishChange(save);
  layers.add(state, 'showTop').name('Top trace').onChange(() => {
    applyLook();
    armMotion();
  }).onFinishChange(save);
  layers.add(state, 'showBot').name('Bottom trace').onChange(() => {
    applyLook();
    armMotion();
  }).onFinishChange(save);
  layers.add(state, 'showTrace').name('Color trace').onChange(() => {
    applyLook();
    armMotion();
  }).onFinishChange(save);
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
  colors.addColor(state, 'white').name('White').onChange(applyLook).onFinishChange(save);
  colors.addColor(state, 'gray').name('Gray').onChange(applyLook).onFinishChange(save);
  colors.addColor(state, 'cyan').name('Cyan').onChange(applyLook).onFinishChange(save);
  colors.addColor(state, 'blue').name('Blue').onChange(applyLook).onFinishChange(save);
  colors.addColor(state, 'background').name('Background').onChange(applyLook).onFinishChange(save);
  colors.close();

  const actions = {
    reset() {
      applyDefaults();
      localStorage.removeItem(STORAGE_KEY);
      refreshGui();
      applyShape();
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

function syncVersions() {
  const outline = isOutline();
  versionV1.setAttribute('aria-pressed', outline ? 'false' : 'true');
  versionV2.setAttribute('aria-pressed', outline ? 'true' : 'false');
}

function setVariant(variant) {
  state.variant = variant === 'v2' ? 'v2' : 'v1';
  applyLook();
  armMotion();
  save();
}

function syncScenes() {
  const on404 = state.scene === '404';
  stage.hidden = on404;
  stage404.hidden = !on404;
  sceneLogo.setAttribute('aria-selected', on404 ? 'false' : 'true');
  sceneFour.setAttribute('aria-selected', on404 ? 'true' : 'false');
}

function setScene(scene) {
  state.scene = scene === '404' ? '404' : 'logo';
  applyLook();
  armMotion();
  save();
}

function bindPoint(folder, point, label) {
  folder.add(point, 'x', 0, 327, 0.5).name(`${label} X`).onChange(applyShape).onFinishChange(onShapeEnd);
  folder.add(point, 'y', 0, 310, 0.5).name(`${label} Y`).onChange(applyShape).onFinishChange(onShapeEnd);
}

if (!window.gsap) {
  const note = document.createElement('p');
  note.className = 'logo-error';
  note.textContent = 'GSAP did not load. Check the network and reload.';
  document.querySelector('.logo').append(note);
} else {
  init404();
  applyShape();
  applyLook();
  mountGui();
  armMotion();
  versionV1.addEventListener('click', () => setVariant('v1'));
  versionV2.addEventListener('click', () => setVariant('v2'));
  sceneLogo.addEventListener('click', () => setScene('logo'));
  sceneFour.addEventListener('click', () => setScene('404'));

  document.addEventListener('visibilitychange', () => {
    active.forEach((tl) => {
      if (document.hidden) tl.pause();
      else if (state.playing) tl.resume();
    });
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
}
