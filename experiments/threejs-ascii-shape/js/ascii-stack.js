import * as THREE from '../vendor/three.module.min.js';
import { createGlyphAtlas } from './atlas.js';
import { resolveConfig } from './config.js';
import { buildLayerPoints, createRotation, flowPoint, rotateInto } from './geometry.js';

const VERTEX = /* glsl */ `
attribute float aRow;
attribute float aCell;
attribute float aTone;

uniform float uTime;
uniform float uGlyphCount;
uniform float uCycle;
uniform float uFadeStart;
uniform float uFadeWidth;

varying vec2 vUv;
varying float vGlyphA;
varying float vGlyphB;
varying float vMix;
varying float vTone;
varying float vRz;

float hash11(float n) {
  return fract(sin(n * 12.9898) * 43758.5453);
}

void main() {
  vUv = uv;
  vTone = aTone;

  vec4 local = instanceMatrix * vec4(position, 1.0);
  vRz = -local.z;

  float phase = uTime / uCycle + hash11(aRow * 37.11 + aCell * 11.73) * 0.72;
  float mutation = floor(phase);
  float frac = phase - mutation;
  vMix = smoothstep(0.0, 1.0, clamp((frac - uFadeStart) / uFadeWidth, 0.0, 1.0));
  vGlyphA = floor(hash11(aRow * 109.3 + (aCell + mutation) * 17.7) * uGlyphCount);
  vGlyphB = floor(hash11(aRow * 109.3 + (aCell + mutation + 1.0) * 17.7) * uGlyphCount);

  gl_Position = projectionMatrix * modelViewMatrix * local;
  gl_Position.z -= 0.00035 * gl_Position.w;
}
`;

const FRAGMENT = /* glsl */ `
uniform sampler2D uAtlas;
uniform float uGlyphCount;
uniform vec3 uInk;
uniform vec3 uHover;
uniform float uGlow;

varying vec2 vUv;
varying float vGlyphA;
varying float vGlyphB;
varying float vMix;
varying float vTone;
varying float vRz;

void main() {
  float inset = 0.08;
  vec2 uv = vec2(vUv.x * (1.0 - inset * 2.0) + inset, vUv.y * (1.0 - inset * 2.0) + inset);
  float coverA = texture2D(uAtlas, vec2((vGlyphA + uv.x) / uGlyphCount, uv.y)).a;
  float coverB = texture2D(uAtlas, vec2((vGlyphB + uv.x) / uGlyphCount, uv.y)).a;
  float cover = mix(coverA, coverB, vMix);
  if (cover < 0.05) discard;

  float depthTone = clamp(0.7 - vRz * 0.045, 0.22, 1.0);
  float strength = min(0.95, vTone * depthTone);
  strength = strength + (0.98 - strength) * uGlow;
  gl_FragColor = vec4(mix(uInk, uHover, uGlow), cover * strength);
}
`;

const REST = [0, 0, 0];
// Experiment-folder URLs, not the document URL. The lab page lives at /:slug/
// while these files are served from /experiments/:slug/.
const assetRoot = new URL('../', import.meta.url);

function resolveAssetUrl(src) {
  if (!src) return '';
  if (/^(?:[a-z][a-z\d+\-.]*:|\/|#)/i.test(src)) return src;
  return new URL(src, assetRoot).href;
}

/**
 * Mount the ASCII stack into a positioned element.
 * The element is filled with a WebGL canvas and the hover cards.
 * @param {HTMLElement} element
 * @param {Partial<import('./config.js').AsciiStackConfig>} [overrides]
 * @returns {{ destroy: () => void }}
 */
export function mountAsciiStack(element, overrides) {
  if (!element) throw new Error('mountAsciiStack: element is required');

  const config = resolveConfig(overrides);
  let disposed = false;
  /** @type {Array<() => void>} */
  const cleanups = [];

  const api = {
    destroy() {
      disposed = true;
      while (cleanups.length) cleanups.pop()();
    },
  };

  boot();
  return api;

  async function boot() {
    try {
      await document.fonts.load(`500 64px "Geist Mono"`);
      await document.fonts.ready;
    } catch {
      /* Fall back to the next monospace face in the stack. */
    }
    if (disposed) return;
    try {
      cleanups.push(start(element, config));
    } catch (error) {
      if (!disposed) showFallback(element);
      console.error(error);
    }
    if (disposed) api.destroy();
  }
}

/**
 * @param {HTMLElement} element
 * @param {import('./config.js').AsciiStackConfig} config
 */
function start(element, config) {
  const layerPoints = buildLayerPoints(config);
  const rotation = createRotation(config.yaw, config.pitch);
  const texture = createGlyphAtlas(config.glyphs, config.font);
  const ink = srgbVector(config.colors.ink);
  const hoverColor = srgbVector(config.colors.hover);

  element.classList.add('ascii-stack');
  if (!element.hasAttribute('tabindex')) element.tabIndex = 0;
  element.setAttribute('role', 'group');
  element.setAttribute(
    'aria-label',
    'Three ASCII layers. Hover a layer, or focus this area and use the arrow keys.',
  );
  element.dataset.glyphCount = String(layerPoints.reduce((sum, layer) => sum + layer.length, 0));

  const canvas = document.createElement('canvas');
  canvas.className = 'ascii-stack-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const card = document.createElement('aside');
  card.className = 'ascii-card';
  card.setAttribute('aria-hidden', 'true');
  const header = document.createElement('div');
  header.className = 'ascii-card-header';
  const kicker = document.createElement('span');
  kicker.textContent = 'INSPECT';
  const labelEl = document.createElement('span');
  header.append(kicker, labelEl);
  const bodyEl = document.createElement('div');
  bodyEl.className = 'ascii-card-body';
  card.append(header, bodyEl);
  const live = document.createElement('div');
  live.className = 'ascii-stack-live';
  live.setAttribute('aria-live', 'polite');
  element.append(canvas, card, live);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    stencil: false,
    depth: true,
  });
  if (!renderer.getContext()) {
    canvas.remove();
    card.remove();
    live.remove();
    showFallback(element);
    return () => {};
  }

  renderer.setClearColor(new THREE.Color(config.colors.paper), 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 80);
  const spin = new THREE.Group();
  spin.matrixAutoUpdate = false;
  // Same yaw/pitch as the glyphs, with Z flipped so depth matches the camera.
  spin.matrix.set(
    rotation.cosY, 0, -rotation.sinY, 0,
    -rotation.sinP * rotation.sinY, rotation.cosP, -rotation.sinP * rotation.cosY, 0,
    -rotation.cosP * rotation.sinY, -rotation.sinP, -rotation.cosP * rotation.cosY, 0,
    0, 0, 0, 1,
  );
  scene.add(spin);

  const hitGeometry = new THREE.BoxGeometry(config.side * 1.06, config.thickness * 1.35, config.side * 1.06);
  const hitMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const plateGeometry = createPlateGeometry(config.side, config.thickness, config.cornerRadius);
  const plateMaterial = new THREE.MeshBasicMaterial({
    colorWrite: false,
    depthWrite: true,
    side: THREE.DoubleSide,
  });
  const pivots = [];
  const colliders = [];
  const meshes = [];

  layerPoints.forEach((points, layer) => {
    const geometry = new THREE.PlaneGeometry(1, 1);
    geometry.setAttribute('aRow', new THREE.InstancedBufferAttribute(Float32Array.from(points, (point) => point.row), 1));
    geometry.setAttribute('aCell', new THREE.InstancedBufferAttribute(Float32Array.from(points, (point) => point.cell), 1));
    geometry.setAttribute('aTone', new THREE.InstancedBufferAttribute(Float32Array.from(points, (point) => point.tone), 1));
    const material = createMaterial(texture, config, ink, hoverColor);
    const mesh = new THREE.InstancedMesh(geometry, material, points.length);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    scene.add(mesh);
    meshes.push(mesh);

    const pivot = new THREE.Group();
    const plate = new THREE.Mesh(plateGeometry, plateMaterial);
    plate.frustumCulled = false;
    plate.raycast = () => {};
    pivot.add(plate);
    const collider = new THREE.Mesh(hitGeometry, hitMaterial);
    collider.visible = false;
    collider.userData.layer = layer;
    pivot.add(collider);
    spin.add(pivot);
    pivots.push(pivot);
    colliders.push(collider);
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pointerLocal = { x: 0, y: 0, valid: false };
  const flowed = { x: 0, y: 0, z: 0, nx: 0, ny: 0, nz: 0 };
  const rotated = { x: 0, y: 0, z: 0 };
  const normal = { x: 0, y: 0, z: 0 };
  const offsets = [0, 0, 0];
  const glow = [0, 0, 0];

  let viewWidth = 0;
  let viewHeight = 0;
  let unit = 1;
  let verticalScale = 1;
  let compactSpacing = config.baseLayerSpacing;
  let cardWidth = 0;
  let cardHeight = 0;
  let hover = -1;
  let selected = -1;
  let shown = -1;
  let cycle = 0;
  let raf = 0;
  let lastFrame = 0;
  let timeOrigin = performance.now();
  let pausedAccum = 0;
  let pauseMark = 0;
  let onScreen = true;
  let disposed = false;

  const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let canHover = hoverQuery.matches;
  let reduced = reduceQuery.matches;

  const resizeObserver = new ResizeObserver(() => {
    updateFraming();
    measureCard();
    kick();
  });
  const intersectionObserver = new IntersectionObserver((entries) => {
    onScreen = entries.some((entry) => entry.isIntersecting);
    syncLoop();
  }, { threshold: 0.01 });

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('click', onClick);
  element.addEventListener('keydown', onKeyDown);
  document.addEventListener('visibilitychange', syncLoop);
  hoverQuery.addEventListener('change', onHoverMode);
  reduceQuery.addEventListener('change', onReduceMotion);
  resizeObserver.observe(element);
  intersectionObserver.observe(element);

  updateFraming();
  writeInstances(0);
  renderer.render(scene, camera);
  element.classList.add('is-ready');
  kick();

  return teardown;

  function teardown() {
    disposed = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerleave', onPointerLeave);
    canvas.removeEventListener('click', onClick);
    element.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('visibilitychange', syncLoop);
    hoverQuery.removeEventListener('change', onHoverMode);
    reduceQuery.removeEventListener('change', onReduceMotion);
    texture.dispose();
    hitGeometry.dispose();
    hitMaterial.dispose();
    plateGeometry.dispose();
    plateMaterial.dispose();
    meshes.forEach((mesh) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    card.remove();
    live.remove();
    element.classList.remove('is-ready', 'is-hovering');
  }

  function onHoverMode(event) {
    canHover = event.matches;
    if (!canHover) hover = -1;
    commit();
  }

  function onReduceMotion(event) {
    reduced = event.matches;
    kick();
  }

  function onPointerMove(event) {
    if (disposed) return;
    trackPointer(event);
    if (shown >= 0) placeCardNearPointer();
    if (!canHover) return;
    const layer = pick(event);
    if (layer === hover) return;
    hover = layer;
    commit();
  }

  function onPointerLeave() {
    if (!canHover || hover < 0) return;
    hover = -1;
    commit();
  }

  function onClick(event) {
    if (disposed) return;
    trackPointer(event);
    const layer = pick(event);
    selected = layer;
    hover = canHover ? layer : -1;
    commit();
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      selected = -1;
      hover = -1;
      commit();
      return;
    }
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    const current = shown;
    let next;
    if (current < 0) next = event.key === 'ArrowUp' ? 0 : 2;
    else next = Math.max(0, Math.min(2, current + (event.key === 'ArrowUp' ? -1 : 1)));
    selected = next;
    hover = canHover ? next : -1;
    commit();
  }

  function commit() {
    const next = hover >= 0 ? hover : selected;
    const changed = next !== shown;
    shown = next;
    showCard(shown, changed);
    element.classList.toggle('is-hovering', hover >= 0);
    card.style.pointerEvents = !canHover && shown >= 0 ? 'auto' : 'none';
    kick();
  }

  function showCard(layer, changed) {
    if (layer < 0) {
      card.classList.remove('is-visible', 'cycle-a', 'cycle-b');
      card.setAttribute('aria-hidden', 'true');
      live.textContent = '';
      return;
    }
    if (changed) {
      labelEl.textContent = config.layers[layer]?.label || `LAYER / 0${layer + 1}`;
      renderBody(config.layers[layer]);
      measureCard();
      placeCardNearPointer();
      card.classList.remove('is-visible', 'cycle-a', 'cycle-b');
      void card.offsetWidth;
      card.classList.add('is-visible', cycle % 2 === 0 ? 'cycle-a' : 'cycle-b');
      cycle += 1;
      live.textContent = labelEl.textContent;
    } else {
      card.classList.add('is-visible');
      placeCardNearPointer();
    }
    card.setAttribute('aria-hidden', 'false');
  }

  function renderBody(layer) {
    bodyEl.replaceChildren();
    if (!layer) return;
    if (layer.type === 'json') {
      formatJson(layer.json).forEach((line, index) => {
        const row = document.createElement('div');
        row.className = 'ascii-card-line';
        const number = document.createElement('span');
        number.className = 'ascii-card-num';
        number.textContent = String(index + 1).padStart(3, '0');
        const code = document.createElement('code');
        code.textContent = line;
        row.append(number, code);
        bodyEl.append(row);
      });
      return;
    }
    if (layer.type === 'image') {
      const image = document.createElement('img');
      image.className = 'ascii-card-image';
      image.src = resolveAssetUrl(layer.src);
      image.alt = layer.alt || layer.caption || layer.label || '';
      image.addEventListener('load', () => {
        measureCard();
        if (shown >= 0) placeCardNearPointer();
      });
      const caption = document.createElement('p');
      caption.className = 'ascii-card-caption';
      caption.textContent = layer.caption || '';
      bodyEl.append(image, caption);
      return;
    }
    const title = document.createElement('p');
    title.className = 'ascii-card-title';
    title.textContent = layer.title || '';
    const copy = document.createElement('p');
    copy.className = 'ascii-card-copy';
    copy.textContent = layer.body || '';
    bodyEl.append(title, copy);
  }

  function measureCard() {
    cardWidth = card.offsetWidth || 280;
    cardHeight = card.offsetHeight || 180;
  }

  function trackPointer(event) {
    pointerLocal.x = event.offsetX;
    pointerLocal.y = event.offsetY;
    pointerLocal.valid = true;
  }

  function placeCardNearPointer() {
    if (viewWidth < 2 || viewHeight < 2) return;
    if (cardWidth < 2) measureCard();
    const gap = 22;
    const edge = 12;
    const x = pointerLocal.valid ? pointerLocal.x : viewWidth * 0.62;
    const y = pointerLocal.valid ? pointerLocal.y : viewHeight * 0.42;
    let left = x + gap;
    if (left + cardWidth > viewWidth - edge) left = x - cardWidth - gap;
    left = Math.max(edge, Math.min(viewWidth - cardWidth - edge, left));
    let top = y + 16;
    if (top + cardHeight > viewHeight - edge) top = y - cardHeight - 12;
    top = Math.max(edge, Math.min(viewHeight - cardHeight - edge, top));
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  }

  function pick(event) {
    if (canvas.clientWidth < 2 || canvas.clientHeight < 2) return -1;
    pointer.x = (event.offsetX / canvas.clientWidth) * 2 - 1;
    pointer.y = -(event.offsetY / canvas.clientHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    spin.updateMatrixWorld(true);
    const hits = raycaster.intersectObjects(colliders, false);
    return hits.length ? hits[0].object.userData.layer : -1;
  }

  function updateFraming() {
    const width = element.clientWidth;
    const height = element.clientHeight;
    if (width < 2 || height < 2) return;
    viewWidth = width;
    viewHeight = height;
    unit = Math.min(width / config.frame.widthDiv, height / config.frame.heightDiv);
    const shift = Math.min(config.frame.centerShiftMax, height * config.frame.centerShift);
    verticalScale = Math.max(0.7, Math.cos(config.pitch)) * unit;
    compactSpacing = config.baseLayerSpacing - config.spacingPullPx / verticalScale;
    const cameraY = shift / unit;
    camera.left = -width / unit / 2;
    camera.right = width / unit / 2;
    camera.top = height / unit / 2;
    camera.bottom = -height / unit / 2;
    camera.position.set(0, cameraY, 20);
    camera.lookAt(0, cameraY, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, config.dprCap));
    renderer.setSize(width, height, false);
  }

  function layerCenterY(index) {
    return (1 - index) * compactSpacing + offsets[index] / verticalScale;
  }

  function glyphWorldScale(surfaceScale) {
    const pixels = Math.max(config.font.min, Math.min(config.font.max, unit * config.font.factor * surfaceScale));
    return pixels / unit;
  }

  function writeInstances(timeMs) {
    for (let layer = 0; layer < meshes.length; layer += 1) {
      const points = layerPoints[layer];
      const array = meshes[layer].instanceMatrix.array;
      const center = layerCenterY(layer);
      for (let i = 0; i < points.length; i += 1) {
        const point = points[i];
        flowPoint(point, timeMs, config.flow.linear, config.flow.perimeter, flowed);
        const y = flowed.y - point.baseCenterY + center;
        rotateInto(flowed.nx, flowed.ny, flowed.nz, rotation, normal);
        const hidden = normal.z >= -0.01;
        rotateInto(flowed.x, y, flowed.z, rotation, rotated);
        writeMatrix(array, i, rotated.x, rotated.y, -rotated.z, hidden ? 0 : glyphWorldScale(point.surfaceScale));
      }
      meshes[layer].instanceMatrix.needsUpdate = true;
      meshes[layer].material.uniforms.uTime.value = timeMs;
      meshes[layer].material.uniforms.uGlow.value = glow[layer];
      pivots[layer].position.y = center;
    }
  }

  function easeHover(ease) {
    const targets = config.hover.offsets[shown] || REST;
    let moving = false;
    for (let i = 0; i < 3; i += 1) {
      const target = targets[i] || 0;
      offsets[i] += (target - offsets[i]) * ease;
      const glowTarget = shown === i ? 1 : 0;
      glow[i] += (glowTarget - glow[i]) * ease;
      if (Math.abs(target - offsets[i]) > 0.08 || Math.abs(glowTarget - glow[i]) > 0.012) moving = true;
    }
    return moving;
  }

  function visibleTime(now) {
    return now - timeOrigin - pausedAccum;
  }

  function syncLoop() {
    if (shouldRun()) kick();
    else stop();
  }

  function shouldRun() {
    return !disposed && onScreen && document.visibilityState !== 'hidden' && viewWidth > 1;
  }

  function stop() {
    if (!pauseMark) pauseMark = performance.now();
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function kick() {
    if (!shouldRun()) return;
    if (pauseMark) {
      pausedAccum += performance.now() - pauseMark;
      pauseMark = 0;
      lastFrame = 0;
    }
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function frame(now) {
    raf = 0;
    if (!shouldRun()) {
      stop();
      return;
    }
    const raw = lastFrame ? (now - lastFrame) / 16.667 : 1;
    lastFrame = now;
    const dt = Math.min(Math.max(raw, 0.25), 3);
    const moving = easeHover(reduced ? 1 : 1 - Math.pow(config.hover.ease, dt));
    writeInstances(reduced ? 0 : visibleTime(now));
    renderer.render(scene, camera);
    if (!reduced || moving) raf = requestAnimationFrame(frame);
  }
}

/**
 * @param {THREE.Texture} texture
 * @param {import('./config.js').AsciiStackConfig} config
 * @param {THREE.Vector3} ink
 * @param {THREE.Vector3} hoverColor
 */
function createMaterial(texture, config, ink, hoverColor) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uAtlas: { value: texture },
      uTime: { value: 0 },
      uGlyphCount: { value: config.glyphs.length },
      uCycle: { value: config.glyphCycleMs },
      uFadeStart: { value: config.glyphFadeStart },
      uFadeWidth: { value: config.glyphFadeWidth },
      uInk: { value: ink },
      uHover: { value: hoverColor },
      uGlow: { value: 0 },
    },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthTest: true,
    depthWrite: true,
    toneMapped: false,
  });
}

/**
 * Column-major instance matrix: scale on X/Y, translation in view space.
 * @param {ArrayLike<number>} array
 * @param {number} index
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} scale
 */
function writeMatrix(array, index, x, y, z, scale) {
  const offset = index * 16;
  array[offset] = scale;
  array[offset + 1] = 0;
  array[offset + 2] = 0;
  array[offset + 3] = 0;
  array[offset + 4] = 0;
  array[offset + 5] = scale;
  array[offset + 6] = 0;
  array[offset + 7] = 0;
  array[offset + 8] = 0;
  array[offset + 9] = 0;
  array[offset + 10] = 1;
  array[offset + 11] = 0;
  array[offset + 12] = x;
  array[offset + 13] = y;
  array[offset + 14] = z;
  array[offset + 15] = 1;
}

/**
 * @param {string} hex
 */
function createPlateGeometry(side, thickness, radius) {
  const half = side / 2;
  const r = Math.min(radius, half - 0.001);
  const shape = new THREE.Shape();
  shape.moveTo(-half + r, -half);
  shape.lineTo(half - r, -half);
  shape.absarc(half - r, -half + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(half, half - r);
  shape.absarc(half - r, half - r, r, 0, Math.PI / 2, false);
  shape.lineTo(-half + r, half);
  shape.absarc(-half + r, half - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(-half, -half + r);
  shape.absarc(-half + r, -half + r, r, Math.PI, Math.PI * 1.5, false);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 6,
  });
  geometry.translate(0, 0, -thickness / 2);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

function srgbVector(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
}

/**
 * @param {Record<string, string | number | boolean>} data
 */
function formatJson(data) {
  const entries = Object.entries(data || {});
  const lines = ['{'];
  entries.forEach(([key, value], index) => {
    const comma = index < entries.length - 1 ? ',' : '';
    const printed = typeof value === 'string' ? `"${value}"` : String(value);
    lines.push(`  ${key}: ${printed}${comma}`);
  });
  lines.push('}');
  return lines;
}

/**
 * @param {HTMLElement} element
 */
function showFallback(element) {
  if (element.querySelector('.ascii-stack-fallback')) return;
  const note = document.createElement('p');
  note.className = 'ascii-stack-fallback';
  note.textContent = 'This visual needs WebGL.';
  element.append(note);
}
