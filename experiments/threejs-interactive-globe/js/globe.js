import * as THREE from '../vendor/three.module.min.js';
import { createCardAtlas } from './atlas.js';
import { resolveConfig } from './config.js';
import { layoutCards } from './layout.js';
import { imageManifest } from './manifest.js';
import { createGlobeGeometry } from './mesh.js';

const VERTEX = /* glsl */ `
attribute vec3 aNormal;
attribute vec3 aEast;
attribute vec3 aNorth;
attribute vec2 aSize;
attribute vec4 aAtlas;

uniform float uSphere;

varying vec2 vUv;
varying vec2 vAtlasUv;
varying vec3 vNormal;
varying vec3 vWorld;
varying float vAspect;

void main() {
  vUv = uv;
  vAtlasUv = aAtlas.xy + uv * aAtlas.zw;
  vAspect = aSize.x / max(aSize.y, 0.0001);

  vec2 local = position.xy * aSize;
  float ax = local.x / uSphere;
  float ay = local.y / uSphere;
  vec3 bent = normalize(
    aNormal * cos(ax) * cos(ay) +
    aEast * sin(ax) +
    aNorth * sin(ay) * cos(ax)
  ) * uSphere;

  vec4 world = modelMatrix * vec4(bent, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * aNormal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const FRAGMENT = /* glsl */ `
uniform sampler2D uMap;
uniform float uRadius;
uniform float uBackMix;
uniform float uRimMix;
uniform vec3 uWash;
uniform vec3 uLight;

varying vec2 vUv;
varying vec2 vAtlasUv;
varying vec3 vNormal;
varying vec3 vWorld;
varying float vAspect;

void main() {
  vec2 p = (vUv - 0.5) * vec2(vAspect, 1.0);
  vec2 box = vec2(vAspect, 1.0) * 0.5;
  float radius = uRadius * min(vAspect, 1.0);
  vec2 q = abs(p) - box + vec2(radius);
  float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  float aa = max(fwidth(dist), 0.0008);
  float alpha = 1.0 - smoothstep(-aa, aa, dist);
  if (alpha < 0.001) discard;

  vec3 col = texture2D(uMap, vAtlasUv).rgb;
  vec3 n = normalize(vNormal);
  vec3 viewDir = normalize(cameraPosition - vWorld);

  if (!gl_FrontFacing) {
    col = mix(col, uWash, uBackMix);
  } else {
    float shade = clamp(dot(n, uLight) * 0.5 + 0.5, 0.0, 1.0);
    col *= mix(0.9, 1.03, shade);
    float rim = pow(1.0 - clamp(dot(n, viewDir), 0.0, 1.0), 1.7);
    col = mix(col, uWash, rim * uRimMix);
  }

  // Coverage resolve already multiplies the sample by alpha. sqrt leaves
  // a premultiplied edge, (color * alpha, alpha), instead of a dark fringe.
  float coverage = sqrt(alpha);
  gl_FragColor = vec4(col * coverage, coverage);
}
`;

const assetRoot = new URL('../', import.meta.url);
const SPIN_LABEL = 'Globe of images. Drag to turn it. It coasts, then the poles ease back to a diagonal.';
const STILL_LABEL = 'Globe of images. Drag or use arrow keys to turn it.';
const KEYS = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/**
 * Mount the globe into `root`. The element needs a real width and height.
 * Call `destroy()` when the host page removes it.
 * @param {HTMLElement} root
 * @param {Partial<import('./config.js').defaultConfig> & { images?: string[] }} [options]
 */
export function mountGlobe(root, options = {}) {
  if (!(root instanceof HTMLElement)) {
    throw new Error('mountGlobe needs an element');
  }

  const config = resolveConfig(options);
  const events = new AbortController();
  const { signal } = events;
  let alive = true;
  let renderer = null;
  let geometry = null;
  let material = null;
  let texture = null;
  let atlas = null;
  let frameId = 0;
  let looping = false;
  let width = 0;
  let height = 0;
  let last = 0;
  let visible = true;
  let reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pointerDown = false;
  let activePointer = null;
  let lastX = 0;
  let lastY = 0;
  let lastPointerT = 0;
  let isHolding = false;
  let atlasDirty = true;
  let ownsLabel = false;
  const keys = new Set();

  root.classList.add('interactive-globe');
  if (config.background != null) root.style.setProperty('--ig-bg', config.background);
  if (!root.hasAttribute('tabindex')) root.tabIndex = 0;
  if (!root.hasAttribute('role')) root.setAttribute('role', 'application');
  applyLabel();

  const images = (Array.isArray(options.images) ? options.images : imageManifest)
    .map(resolveAssetUrl)
    .filter(Boolean);
  const cards = layoutCards(config);
  cards.forEach((card, index) => {
    card.index = index;
    card.color = config.colors[index % config.colors.length];
    card.image = imageIndexFor(index, cards.length, images.length);
  });

  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      depth: true,
      stencil: false,
      powerPreference: 'default',
      premultipliedAlpha: true,
    });
  } catch (error) {
    showFallback(root);
    return { destroy() {}, element: root };
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(1);

  const canvas = renderer.domElement;
  canvas.draggable = false;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  canvas.style.touchAction = 'none';
  root.append(canvas);

  atlas = createCardAtlas(cards, {
    aspect: config.aspect,
    cellHeight: config.atlasCellHeight,
    maxSize: config.atlasMaxSize,
    imageInset: config.imageInset,
    imageRadius: config.imageRadius,
    decodeWidth: config.decodeWidth,
  });

  texture = new THREE.CanvasTexture(atlas.canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  texture.needsUpdate = true;

  const built = createGlobeGeometry(cards, atlas.rects, config.radius, {
    x: config.segmentsX,
    y: config.segmentsY,
  });
  geometry = built.geometry;

  const uniforms = {
    uMap: { value: texture },
    uSphere: { value: config.radius },
    uRadius: { value: config.cornerRadius },
    uBackMix: { value: config.backMix },
    uRimMix: { value: config.rimMix },
    uWash: { value: srgb(config.backWash) },
    uLight: { value: new THREE.Vector3(0.32, 0.84, 0.62).normalize() },
  };

  material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    side: THREE.DoubleSide,
    transparent: false,
    depthTest: true,
    depthWrite: true,
    alphaToCoverage: true,
    toneMapped: false,
  });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(config.cameraFov, 1, 0.08, 40);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  scene.add(mesh);

  const yAxis = new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3();
  const qDelta = new THREE.Quaternion();
  const velocity = new THREE.Vector3();
  const instant = new THREE.Vector3();
  const pole = new THREE.Vector3();
  const restPole = new THREE.Vector3(config.poleAxis.x, config.poleAxis.y, config.poleAxis.z);
  guardPole(restPole);
  const restSwing = new THREE.Quaternion().setFromUnitVectors(yAxis, restPole);
  const swing = restSwing.clone();
  const twist = new THREE.Quaternion();

  function compose() {
    mesh.quaternion.copy(swing).multiply(twist).normalize();
  }

  function decomposeFromMesh() {
    pole.copy(yAxis).applyQuaternion(mesh.quaternion);
    if (pole.lengthSq() < 1e-8) return;
    pole.normalize();
    swing.setFromUnitVectors(yAxis, pole);
    twist.copy(swing).invert().multiply(mesh.quaternion).normalize();
  }

  compose();
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(root);
  const intersectionObserver = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (shouldRun()) start();
    else stop();
  });
  intersectionObserver.observe(root);

  root.addEventListener('pointerdown', onPointerDown, { signal, passive: false });
  root.addEventListener('keydown', onKeyDown, { signal });
  root.addEventListener('keyup', onKeyUp, { signal });
  root.addEventListener('blur', onBlur, { signal });
  root.addEventListener('contextmenu', (event) => event.preventDefault(), { signal });
  window.addEventListener('pointermove', onPointerMove, { signal });
  window.addEventListener('pointerup', onPointerUp, { signal });
  window.addEventListener('pointercancel', onPointerUp, { signal });
  canvas.addEventListener('lostpointercapture', onPointerUp, { signal });
  document.addEventListener('visibilitychange', onVisibility, { signal });
  motionQuery.addEventListener?.('change', onMotion, { signal });

  resize();
  start();
  loadImages();

  function loadImages() {
    atlas.load(images, {
      signal,
      onPaint() {
        atlasDirty = true;
        start();
      },
    }).catch(() => {});
  }

  function onMotion() {
    reduced = motionQuery.matches;
    if (reduced) velocity.set(0, 0, 0);
    applyLabel();
    start();
  }

  function onVisibility() {
    if (document.hidden) {
      pointerDown = false;
      activePointer = null;
      syncHolding();
      stop();
      return;
    }
    if (shouldRun()) start();
  }

  function onPointerDown(event) {
    if (!alive || !event.isPrimary || event.button > 0) return;
    event.preventDefault();
    pointerDown = true;
    activePointer = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    lastPointerT = performance.now();
    velocity.set(0, 0, 0);
    syncHolding();
    root.focus({ preventScroll: true });
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      /* Synthetic events and a few browsers reject capture. Window listeners still track the drag. */
    }
    start();
  }

  function onPointerMove(event) {
    if (!pointerDown || event.pointerId !== activePointer) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    if (dx === 0 && dy === 0) return;
    const now = performance.now();
    const pointerDt = Math.min(0.05, Math.max(0.001, (now - lastPointerT) / 1000));
    lastPointerT = now;
    const globePx = Math.max(1, Math.min(width, height) / config.cameraMargin);
    const scale = (Math.PI * config.drag) / globePx;
    applyAngles(dx * scale, dy * scale, pointerDt);
    start();
  }

  function onPointerUp(event) {
    if (!pointerDown) return;
    if (event?.pointerId !== undefined && event.pointerId !== activePointer && event.type !== 'lostpointercapture') return;
    pointerDown = false;
    activePointer = null;
    syncHolding();
    start();
  }

  function onKeyDown(event) {
    const dir = KEYS[event.key];
    if (!dir) return;
    event.preventDefault();
    keys.add(event.key);
    syncHolding();
    applyAngles(dir[0] * config.keyStep, dir[1] * config.keyStep);
    start();
  }

  function onKeyUp(event) {
    if (!KEYS[event.key]) return;
    keys.delete(event.key);
    syncHolding();
    start();
  }

  function onBlur() {
    keys.clear();
    syncHolding();
  }

  function syncHolding() {
    const next = pointerDown || keys.size > 0;
    isHolding = next;
    root.classList.toggle('is-dragging', pointerDown);
  }

  function applyAngles(yaw, pitch, dt = 0) {
    qDelta.setFromAxisAngle(yAxis, yaw);
    mesh.quaternion.premultiply(qDelta);
    right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    qDelta.setFromAxisAngle(right, pitch);
    mesh.quaternion.premultiply(qDelta);
    decomposeFromMesh();
    if (dt <= 0) return;
    instant.set(0, 0, 0);
    instant.addScaledVector(yAxis, yaw / dt);
    instant.addScaledVector(right, pitch / dt);
    if (instant.length() > config.inertiaMax) instant.setLength(config.inertiaMax);
    velocity.lerp(instant, Math.min(1, Math.max(0.45, dt / 0.04)));
  }

  function resize() {
    if (!alive) return;
    const nextW = Math.round(root.clientWidth);
    const nextH = Math.round(root.clientHeight);
    if (nextW < 2 || nextH < 2) return;
    const pr = choosePixelRatio(nextW, nextH, config);
    if (nextW === width && nextH === height && renderer.getPixelRatio() === pr) return;
    width = nextW;
    height = nextH;
    renderer.setPixelRatio(pr);
    renderer.setSize(width, height, false);
    fitCamera();
    start();
  }

  function fitCamera() {
    const aspect = width / Math.max(1, height);
    camera.aspect = aspect;
    camera.fov = config.cameraFov;
    const vFov = THREE.MathUtils.degToRad(config.cameraFov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const distV = config.radius / Math.sin(vFov / 2);
    const distH = config.radius / Math.sin(hFov / 2);
    camera.position.set(0, 0, Math.max(distV, distH) * config.cameraMargin);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }

  function shouldRun() {
    if (!alive || !visible || document.hidden || width < 2 || height < 2) return false;
    if (atlasDirty || isHolding) return true;
    if (reduced) return false;
    return true;
  }

  function start() {
    if (looping || !alive) return;
    looping = true;
    last = performance.now();
    frameId = requestAnimationFrame(frame);
  }

  function stop() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    looping = false;
  }

  function frame(now) {
    frameId = 0;
    if (!alive) {
      looping = false;
      return;
    }

    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (isHolding) {
      const idle = (now - lastPointerT) / 1000;
      if (idle > 0.03) velocity.multiplyScalar(Math.exp(-dt / 0.09));
    } else if (reduced) {
      velocity.set(0, 0, 0);
      swing.copy(restSwing);
      compose();
    } else {
      const speed = velocity.length();
      if (speed > 0.02) {
        qDelta.setFromAxisAngle(instant.copy(velocity).multiplyScalar(1 / speed), speed * dt);
        mesh.quaternion.premultiply(qDelta);
        velocity.multiplyScalar(Math.exp(-dt / config.inertia));
        decomposeFromMesh();
      } else {
        velocity.set(0, 0, 0);
      }
      swing.slerp(restSwing, 1 - Math.exp(-dt / config.returnSeconds));
      qDelta.setFromAxisAngle(yAxis, config.spinSpeed * dt);
      twist.multiply(qDelta);
      compose();
    }

    if (atlasDirty) {
      texture.needsUpdate = true;
      atlasDirty = false;
    }

    renderer.render(scene, camera);

    if (shouldRun()) frameId = requestAnimationFrame(frame);
    else looping = false;
  }

  function applyLabel() {
    if (root.hasAttribute('aria-label') && !ownsLabel) return;
    ownsLabel = true;
    root.setAttribute('aria-label', reduced ? STILL_LABEL : SPIN_LABEL);
  }

  function destroy() {
    if (!alive) return;
    alive = false;
    stop();
    events.abort();
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    root.classList.remove('is-dragging');
    geometry?.dispose();
    material?.dispose();
    texture?.dispose();
    atlas?.destroy();
    renderer?.dispose();
    canvas.remove();
  }

  return { destroy, element: root };
}

function imageIndexFor(index, cardCount, total) {
  if (total <= 0) return -1;
  if (total <= cardCount) return index % total;
  return Math.round((index * (total - 1)) / Math.max(1, cardCount - 1));
}

function resolveAssetUrl(src) {
  if (!src) return '';
  if (/^(?:[a-z][a-z\d+\-.]*:|\/|#)/i.test(src)) return src;
  return new URL(src, assetRoot).href;
}

function choosePixelRatio(w, h, config) {
  let cap = Math.min(window.devicePixelRatio || 1, config.pixelRatioMax);
  if (navigator.connection?.saveData) cap = Math.min(cap, 1.25);
  const fitted = Math.sqrt(config.pixelBudget / Math.max(1, w * h));
  return Math.max(1, Math.min(cap, fitted));
}

function srgb(hex) {
  const raw = hex.trim().replace('#', '');
  const value = raw.length === 3 ? raw.split('').map((channel) => channel + channel).join('') : raw;
  const int = Number.parseInt(value, 16);
  if (!Number.isFinite(int)) return new THREE.Vector3(1, 1, 1);
  return new THREE.Vector3(((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255);
}

function guardPole(vector) {
  if (vector.lengthSq() < 1e-8) vector.set(0.78, 0.62, 0.06);
  vector.normalize();
  if (Math.abs(vector.z) > 0.32) {
    vector.z = Math.sign(vector.z || 1) * 0.08;
    vector.normalize();
  }
}

function showFallback(root) {
  root.classList.add('interactive-globe', 'is-error');
  const message = document.createElement('p');
  message.className = 'interactive-globe__fallback';
  message.textContent = 'This globe needs WebGL.';
  root.append(message);
}
