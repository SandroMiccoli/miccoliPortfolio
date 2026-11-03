import * as THREE from '../vendor/three.module.min.js';
import { createCardAtlas } from './atlas.js';
import { labelPoster, prefersPoster } from './capabilities.js';
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

// Captured while this file evaluates. An IIFE still has `document.currentScript`
// then; a later `initGlobe` call does not. Module imports leave it null and
// fall back to this file's URL.
const embeddedScript = typeof document !== 'undefined' ? document.currentScript : null;
const NEAR_VIEWPORT = '400px';
const SECTION_TURN_MS = 700;
const CONTEXT_RELEASE_MS = 800;
const TAU = Math.PI * 2;
const SPIN_LABEL = 'Globe of images. Drag to turn it. It coasts, then the poles ease back to a diagonal.';
const STILL_LABEL = 'Globe of images. Drag or use arrow keys to turn it.';
const KEYS = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/**
 * Show the poster and mount only once `root` is within 400px of the viewport.
 * Reduced motion, a coarse or non-hovering pointer, save-data, and missing
 * WebGL keep the poster and never create a context. The return is synchronous.
 * `ready` resolves when WebGL is up, or on the same turn when the poster stays.
 * `rotateTo` is safe to call before the scene exists, and while the context
 * is released offscreen. The latest id is kept and applied on the next mount.
 * Unknown ids do nothing.
 * `sections` is a list of `{ id, azimuth? }`. Ids without `azimuth` are spaced
 * evenly around the pole axis. `rotateTo(id)` holds the idle spin and eases
 * to that azimuth. `rotateTo(null)` releases it. Pointer drag stays available
 * unless `drag` is false.
 * `images` replaces the photo list for this embed. Another section of the
 * site passes its own list, or calls `setImages` on a globe that is already up.
 * Omit `images` to use the manifest in this folder.
 * Photo and poster URLs resolve from `assetBase` when it is set. Otherwise
 * they resolve from the folder of the script that loaded this file, or from
 * this module's own folder when the page imports it.
 * @param {HTMLElement} root
 * @param {GlobeOptions} [options]
 */
export function initGlobe(root, options = {}) {
  if (!(root instanceof HTMLElement)) {
    throw new Error('initGlobe needs an element');
  }

  let settings = options;
  const config = resolveConfig(settings);
  const sections = sectionAzimuths(settings.sections);
  root.classList.add('interactive-globe');
  if (config.background != null) root.style.setProperty('--ig-bg', config.background);
  ensurePoster(root, settings);

  let destroyed = false;
  let mounted = null;
  let observer = null;
  let queuedRotate = null;
  let rotateQueued = false;
  let settled = false;
  let resolveReady = () => {};
  const ready = new Promise((resolve) => {
    resolveReady = resolve;
  });

  function settle() {
    if (settled) return;
    settled = true;
    resolveReady();
  }

  function rotateTo(id) {
    if (destroyed) return;
    if (id != null && !sections.has(id)) return;
    rotateQueued = true;
    queuedRotate = id;
    mounted?.rotateTo?.(id);
  }

  function setImages(source) {
    if (destroyed) return;
    settings = { ...settings, images: source };
    mounted?.setImages?.(source);
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    observer?.disconnect();
    observer = null;
    mounted?.destroy();
    mounted = null;
    settle();
  }

  if (prefersPoster()) {
    labelPoster(root);
    settle();
    return { rotateTo, setImages, destroy, element: root, ready };
  }

  observer = new IntersectionObserver((entries) => {
    if (destroyed || mounted) return;
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer?.disconnect();
    observer = null;
    try {
      mounted = mountGlobe(root, settings);
      if (rotateQueued) mounted?.rotateTo?.(queuedRotate);
    } catch {
      mounted = null;
      labelPoster(root);
    }
    if (!root.querySelector('canvas')) labelPoster(root);
    settle();
  }, { rootMargin: NEAR_VIEWPORT });
  observer.observe(root);

  return { rotateTo, setImages, destroy, element: root, ready };
}

/**
 * Mount the globe into `root` immediately. The element needs a real width and height.
 * Call `destroy()` when the host page removes it. Pages should call `initGlobe`.
 * The handle's `rotateTo` matches `initGlobe`: an id eases `spinAngle` to that
 * section, `null` resumes the idle spin, and a call made while the context is
 * released is applied when the scene comes back.
 * @param {HTMLElement} root
 * @param {GlobeOptions} [options]
 */
export function mountGlobe(root, options = {}) {
  if (!(root instanceof HTMLElement)) {
    throw new Error('mountGlobe needs an element');
  }

  const config = resolveConfig(options);
  const allowDrag = options.drag !== false;
  const sections = sectionAzimuths(options.sections);
  const events = new AbortController();
  const { signal } = events;
  let loads = null;
  let sceneEvents = null;
  let alive = true;
  let disposed = true;
  let acquiring = false;
  let renderer = null;
  let geometry = null;
  let material = null;
  let texture = null;
  let atlas = null;
  let canvas = null;
  let scene = null;
  let camera = null;
  let mesh = null;
  let frameId = 0;
  let looping = false;
  let disposeTimer = 0;
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
  let userTurned = false;
  let atlasDirty = false;
  let ownsLabel = false;
  let spinAngle = 0;
  let lockId = null;
  let easing = false;
  let easeFrom = 0;
  let easeTo = 0;
  let easeStart = 0;
  let rotateQueued = false;
  let queuedRotate = null;
  const keys = new Set();

  root.classList.add('interactive-globe');
  if (config.background != null) root.style.setProperty('--ig-bg', config.background);
  ensurePoster(root, options);

  const assets = assetRootFor(options);
  let images = imageList(options.images, assets);
  const cards = layoutCards(config);
  cards.forEach((card, index) => {
    card.index = index;
    card.color = config.colors[index % config.colors.length];
    card.image = imageIndexFor(index, cards.length, images.length);
  });

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
    if (!mesh) return;
    twist.setFromAxisAngle(yAxis, spinAngle);
    mesh.quaternion.copy(swing).multiply(twist).normalize();
  }

  function decomposeFromMesh() {
    if (!mesh) return;
    pole.copy(yAxis).applyQuaternion(mesh.quaternion);
    if (pole.lengthSq() < 1e-8) return;
    pole.normalize();
    swing.setFromUnitVectors(yAxis, pole);
    twist.copy(swing).invert().multiply(mesh.quaternion).normalize();
    spinAngle = twistAngle(twist);
  }

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(root);
  const intersectionObserver = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible && !document.hidden) resume();
    else park();
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
  document.addEventListener('visibilitychange', onVisibility, { signal });
  motionQuery.addEventListener?.('change', onMotion, { signal });

  acquireScene();
  if (visible && !document.hidden) {
    if (shouldRun()) start();
  } else {
    park();
  }

  function acquireScene() {
    if (!alive || acquiring) return false;
    if (!disposed && renderer) return true;
    acquiring = true;
    let nextRenderer = null;
    let nextGeometry = null;
    let nextMaterial = null;
    let nextTexture = null;
    let nextAtlas = null;
    let nextCanvas = null;
    let sceneSignal = null;
    try {
      nextRenderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        depth: true,
        stencil: false,
        powerPreference: 'default',
        premultipliedAlpha: true,
      });
      if (!nextRenderer.getContext()) throw new Error('WebGL unavailable');

      if (!root.hasAttribute('tabindex')) root.tabIndex = 0;
      if (!root.hasAttribute('role')) root.setAttribute('role', 'application');
      applyLabel();

      nextRenderer.outputColorSpace = THREE.SRGBColorSpace;
      nextRenderer.setClearColor(0x000000, 0);
      nextRenderer.setPixelRatio(1);

      nextCanvas = nextRenderer.domElement;
      nextCanvas.draggable = false;
      nextCanvas.setAttribute('aria-hidden', 'true');
      nextCanvas.style.width = '100%';
      nextCanvas.style.height = '100%';
      nextCanvas.style.display = 'block';
      nextCanvas.style.touchAction = 'none';
      root.append(nextCanvas);
      sceneSignal = new AbortController();
      nextCanvas.addEventListener('lostpointercapture', onPointerUp, { signal: sceneSignal.signal });

      nextAtlas = createCardAtlas(cards, {
        aspect: config.aspect,
        cellHeight: config.atlasCellHeight,
        maxSize: config.atlasMaxSize,
        imageInset: config.imageInset,
        imageRadius: config.imageRadius,
        decodeWidth: config.decodeWidth,
      });

      nextTexture = new THREE.CanvasTexture(nextAtlas.canvas);
      nextTexture.colorSpace = THREE.NoColorSpace;
      nextTexture.wrapS = THREE.ClampToEdgeWrapping;
      nextTexture.wrapT = THREE.ClampToEdgeWrapping;
      nextTexture.generateMipmaps = true;
      nextTexture.minFilter = THREE.LinearMipmapLinearFilter;
      nextTexture.magFilter = THREE.LinearFilter;
      nextTexture.anisotropy = Math.min(8, nextRenderer.capabilities.getMaxAnisotropy());
      nextTexture.needsUpdate = true;

      const built = createGlobeGeometry(cards, nextAtlas.rects, config.radius, {
        x: config.segmentsX,
        y: config.segmentsY,
      });
      nextGeometry = built.geometry;

      const uniforms = {
        uMap: { value: nextTexture },
        uSphere: { value: config.radius },
        uRadius: { value: config.cornerRadius },
        uBackMix: { value: config.backMix },
        uRimMix: { value: config.rimMix },
        uWash: { value: srgb(config.backWash) },
        uLight: { value: new THREE.Vector3(0.32, 0.84, 0.62).normalize() },
      };

      nextMaterial = new THREE.ShaderMaterial({
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

      const nextScene = new THREE.Scene();
      const nextCamera = new THREE.PerspectiveCamera(config.cameraFov, 1, 0.08, 40);
      const nextMesh = new THREE.Mesh(nextGeometry, nextMaterial);
      nextMesh.frustumCulled = false;
      nextScene.add(nextMesh);

      renderer = nextRenderer;
      geometry = nextGeometry;
      material = nextMaterial;
      texture = nextTexture;
      atlas = nextAtlas;
      canvas = nextCanvas;
      scene = nextScene;
      camera = nextCamera;
      mesh = nextMesh;
      disposed = false;
      atlasDirty = true;
      width = 0;
      height = 0;
      velocity.set(0, 0, 0);
      loads?.abort();
      loads = new AbortController();
      sceneEvents?.abort();
      sceneEvents = sceneSignal;
      compose();
      resize();
      loadImages();
      flushRotate();
      return true;
    } catch {
      sceneSignal?.abort();
      nextGeometry?.dispose();
      nextMaterial?.dispose();
      nextTexture?.dispose();
      nextAtlas?.destroy();
      try { nextRenderer?.forceContextLoss(); } catch { /* context already gone */ }
      nextRenderer?.dispose();
      nextCanvas?.remove();
      if (renderer === nextRenderer) {
        renderer = null;
        geometry = null;
        material = null;
        texture = null;
        atlas = null;
        canvas = null;
        scene = null;
        camera = null;
        mesh = null;
      }
      disposed = true;
      return false;
    } finally {
      acquiring = false;
    }
  }

  function releaseScene() {
    if (disposed) return;
    disposed = true;
    stop();
    cancelDispose();
    loads?.abort();
    loads = null;
    sceneEvents?.abort();
    sceneEvents = null;
    pointerDown = false;
    if (activePointer != null) {
      try { canvas?.releasePointerCapture(activePointer); } catch { /* capture already ended */ }
    }
    activePointer = null;
    keys.clear();
    syncHolding();
    geometry?.dispose();
    material?.dispose();
    texture?.dispose();
    atlas?.destroy();
    try { renderer?.forceContextLoss(); } catch { /* context already gone */ }
    renderer?.dispose();
    canvas?.remove();
    renderer = null;
    geometry = null;
    material = null;
    texture = null;
    atlas = null;
    canvas = null;
    mesh = null;
    scene = null;
    camera = null;
    atlasDirty = false;
    width = 0;
    height = 0;
  }

  function loadImages() {
    if (!atlas || !loads) return;
    atlas.load(images, {
      signal: loads.signal,
      onPaint() {
        if (!alive || disposed) return;
        atlasDirty = true;
        start();
      },
    }).catch(() => {});
  }

  function onMotion() {
    reduced = motionQuery.matches;
    if (reduced) velocity.set(0, 0, 0);
    applyLabel();
    if (alive && !disposed && shouldRun()) start();
  }

  function onVisibility() {
    if (document.hidden) {
      park();
      return;
    }
    resume();
  }

  function park() {
    if (!alive) return;
    stop();
    pointerDown = false;
    activePointer = null;
    syncHolding();
    if (document.hidden || !visible) scheduleDispose();
  }

  function resume() {
    if (!alive || document.hidden || !visible) return;
    cancelDispose();
    if (disposed && !acquireScene()) return;
    if (shouldRun()) start();
  }

  function scheduleDispose() {
    if (!alive || disposed || disposeTimer) return;
    disposeTimer = window.setTimeout(() => {
      disposeTimer = 0;
      if (!alive || disposed) return;
      if (visible && !document.hidden) return;
      releaseScene();
    }, CONTEXT_RELEASE_MS);
  }

  function cancelDispose() {
    if (!disposeTimer) return;
    window.clearTimeout(disposeTimer);
    disposeTimer = 0;
  }

  function onPointerDown(event) {
    if (!allowDrag || !alive || disposed || !mesh || !event.isPrimary || event.button > 0) return;
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
    if (!pointerDown || event.pointerId !== activePointer || !mesh) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    if (dx === 0 && dy === 0) return;
    const now = performance.now();
    const pointerDt = Math.min(0.05, Math.max(0.001, (now - lastPointerT) / 1000));
    lastPointerT = now;
    const globePx = Math.max(1, Math.min(width, height) / config.cameraMargin);
    const scale = (Math.PI * (Number(config.drag) || 0)) / globePx;
    applyAngles(dx * scale, dy * scale, pointerDt);
    start();
  }

  function onPointerUp(event) {
    if (!pointerDown) return;
    if (event?.pointerId !== undefined && event.pointerId !== activePointer && event.type !== 'lostpointercapture') return;
    pointerDown = false;
    activePointer = null;
    syncHolding();
    if (userTurned) {
      userTurned = false;
      settleLock();
    }
    if (shouldRun()) start();
  }

  function onKeyDown(event) {
    const dir = KEYS[event.key];
    if (!dir || disposed || !mesh) return;
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
    if (!isHolding && userTurned) {
      userTurned = false;
      settleLock();
    }
    if (shouldRun()) start();
  }

  function onBlur() {
    keys.clear();
    syncHolding();
    if (userTurned) {
      userTurned = false;
      settleLock();
    }
  }

  function syncHolding() {
    const next = pointerDown || keys.size > 0;
    isHolding = next;
    root.classList.toggle('is-dragging', pointerDown);
  }

  function applyAngles(yaw, pitch, dt = 0) {
    if (!mesh || !camera) return;
    qDelta.setFromAxisAngle(yAxis, yaw);
    mesh.quaternion.premultiply(qDelta);
    right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    qDelta.setFromAxisAngle(right, pitch);
    mesh.quaternion.premultiply(qDelta);
    decomposeFromMesh();
    userTurned = true;
    easing = false;
    if (dt <= 0) return;
    instant.set(0, 0, 0);
    instant.addScaledVector(yAxis, yaw / dt);
    instant.addScaledVector(right, pitch / dt);
    if (instant.length() > config.inertiaMax) instant.setLength(config.inertiaMax);
    velocity.lerp(instant, Math.min(1, Math.max(0.45, dt / 0.04)));
  }

  function rotateTo(id) {
    if (!alive) return;
    if (id != null && !sections.has(id)) return;
    if (disposed || !mesh) {
      rotateQueued = true;
      queuedRotate = id;
      return;
    }
    applyRotate(id);
  }

  function setImages(source) {
    if (!alive) return;
    images = imageList(source, assets);
    cards.forEach((card, index) => {
      card.image = imageIndexFor(index, cards.length, images.length);
    });
    if (disposed || !atlas) return;
    loads?.abort();
    loads = new AbortController();
    atlas.clear();
    atlasDirty = true;
    loadImages();
    if (shouldRun()) start();
  }

  function flushRotate() {
    if (!rotateQueued || disposed || !mesh) return;
    rotateQueued = false;
    applyRotate(queuedRotate);
  }

  function applyRotate(id) {
    if (id == null) {
      lockId = null;
      easing = false;
      if (shouldRun()) start();
      return;
    }
    lockId = id;
    velocity.set(0, 0, 0);
    const azimuth = sections.get(id);
    if (reduced || !mesh) {
      spinAngle = azimuth;
      easing = false;
      swing.copy(restSwing);
      compose();
      return;
    }
    beginEase(azimuth);
    start();
  }

  function beginEase(azimuth) {
    if (!Number.isFinite(azimuth)) return;
    easeFrom = spinAngle;
    easeTo = spinAngle + shortestDelta(spinAngle, azimuth);
    easeStart = performance.now();
    easing = Math.abs(easeTo - easeFrom) > 1e-4;
    if (!easing) spinAngle = easeTo;
  }

  function settleLock() {
    if (lockId == null || disposed || !mesh) return;
    beginEase(sections.get(lockId));
    if (shouldRun()) start();
  }

  function easeSpin(now) {
    if (!easing) return;
    const t = Math.min(1, (now - easeStart) / SECTION_TURN_MS);
    const shaped = t * t * (3 - 2 * t);
    spinAngle = easeFrom + (easeTo - easeFrom) * shaped;
    if (t >= 1) {
      spinAngle = easeTo;
      easing = false;
    }
  }

  function resize() {
    if (!alive || disposed || !renderer || !camera) return;
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
    if (!alive || disposed || !renderer || !visible || document.hidden || width < 2 || height < 2) return false;
    if (atlasDirty || isHolding) return true;
    if (reduced) return false;
    if (lockId == null) return true;
    if (easing || velocity.lengthSq() > 1e-6) return true;
    return swing.angleTo(restSwing) > 0.0008;
  }

  function start() {
    if (looping || !alive || disposed) return;
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
    if (!alive || disposed || !renderer || !mesh) {
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
      if (lockId != null) {
        spinAngle = sections.get(lockId);
        easing = false;
      }
      compose();
    } else {
      const speed = velocity.length();
      if (lockId == null && speed > 0.02) {
        qDelta.setFromAxisAngle(instant.copy(velocity).multiplyScalar(1 / speed), speed * dt);
        mesh.quaternion.premultiply(qDelta);
        velocity.multiplyScalar(Math.exp(-dt / config.inertia));
        decomposeFromMesh();
      } else {
        velocity.set(0, 0, 0);
      }
      swing.slerp(restSwing, 1 - Math.exp(-dt / config.returnSeconds));
      if (lockId == null) {
        spinAngle += config.spinSpeed * dt;
        easing = false;
      } else {
        easeSpin(now);
      }
      compose();
    }

    if (atlasDirty && texture) {
      texture.needsUpdate = true;
      atlasDirty = false;
    }

    renderer.render(scene, camera);

    if (shouldRun()) frameId = requestAnimationFrame(frame);
    else {
      looping = false;
      if (!visible || document.hidden) scheduleDispose();
    }
  }

  function applyLabel() {
    if (root.hasAttribute('aria-label') && !ownsLabel) return;
    ownsLabel = true;
    root.setAttribute('aria-label', reduced ? STILL_LABEL : SPIN_LABEL);
  }

  function destroy() {
    if (!alive) return;
    alive = false;
    cancelDispose();
    releaseScene();
    events.abort();
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    root.classList.remove('is-dragging');
  }

  return { rotateTo, setImages, destroy, element: root };
}

/**
 * @typedef {Partial<import('./config.js').defaultConfig> & {
 *   images?: string[],
 *   sections?: { id: string, azimuth?: number }[],
 *   drag?: number | false,
 *   assetBase?: string,
 * }} GlobeOptions
 */

function sectionAzimuths(sections) {
  const map = new Map();
  if (!Array.isArray(sections) || sections.length === 0) return map;
  const step = TAU / sections.length;
  sections.forEach((section, index) => {
    if (!section || typeof section.id !== 'string' || section.id === '') return;
    const azimuth = Number.isFinite(section.azimuth) ? section.azimuth : step * index;
    map.set(section.id, azimuth);
  });
  return map;
}

function shortestDelta(from, to) {
  let delta = (to - from) % TAU;
  if (delta > Math.PI) delta -= TAU;
  if (delta < -Math.PI) delta += TAU;
  return delta;
}

function twistAngle(quaternion) {
  return 2 * Math.atan2(quaternion.y, quaternion.w);
}

function ensurePoster(root, options) {
  const existing = root.querySelector('.interactive-globe__poster');
  if (existing instanceof HTMLImageElement) return existing;
  const poster = document.createElement('img');
  poster.className = 'interactive-globe__poster';
  poster.alt = '';
  poster.decoding = 'async';
  poster.draggable = false;
  poster.src = new URL('assets/poster.webp', assetRootFor(options)).href;
  root.prepend(poster);
  return poster;
}

function imageList(source, root) {
  const list = Array.isArray(source) ? source : imageManifest;
  return list.map((src) => resolveAssetUrl(src, root)).filter(Boolean);
}

function imageIndexFor(index, cardCount, total) {
  if (total <= 0) return -1;
  if (total <= cardCount) return index % total;
  return Math.round((index * (total - 1)) / Math.max(1, cardCount - 1));
}

function assetRootFor(options) {
  const chosen = options.assetBase;
  if (typeof chosen === 'string' && chosen.trim() !== '') {
    const trimmed = chosen.trim();
    const withSlash = trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
    return new URL(withSlash, document.baseURI);
  }
  if (embeddedScript?.src) return new URL('./', embeddedScript.src);
  // The relative base is resolved when the module loads, not at bundle time.
  if (import.meta.url) return new URL(/* @vite-ignore */ '../', import.meta.url);
  return new URL('./', document.baseURI);
}

function resolveAssetUrl(src, root) {
  if (!src) return '';
  if (/^(?:[a-z][a-z\d+\-.]*:|\/|#)/i.test(src)) return src;
  return new URL(src, root).href;
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

