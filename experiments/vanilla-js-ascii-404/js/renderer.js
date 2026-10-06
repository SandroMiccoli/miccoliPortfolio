import { FONT_FAMILY, POINTER_SLIDERS, SLIDERS, symbolsFor } from './config.js';
import { buildBackground, buildCells, buildConnectors, measure } from './field.js';
import { mixHex, noise } from './glyph.js';

const FRAME_MS = 70;
const POINTER_FRAME_MS = 16;
const SYMBOL_MS = 1350;

/**
 * @param {CanvasRenderingContext2D} target
 * @param {string} family
 */
function createPainter(target, family) {
  let alpha = -1;
  let color = '';
  let font = '';

  return {
    /**
     * @param {string} symbol
     * @param {number} x
     * @param {number} y
     * @param {number} nextAlpha
     * @param {string} nextColor
     * @param {number} size
     * @param {number} weight
     */
    draw(symbol, x, y, nextAlpha, nextColor, size, weight) {
      const quantized = Math.round(nextAlpha * 255) / 255;
      if (quantized !== alpha) {
        target.globalAlpha = quantized;
        alpha = quantized;
      }
      if (nextColor !== color) {
        target.fillStyle = nextColor;
        color = nextColor;
      }
      const nextFont = `${weight} ${Math.max(5, size)}px ${family}`;
      if (nextFont !== font) {
        target.font = nextFont;
        font = nextFont;
      }
      target.fillText(symbol, x, y);
    },
  };
}

/**
 * @param {Record<string, number | string | boolean>} settings
 */
function snapshot(settings) {
  const parts = [];
  for (const control of SLIDERS) parts.push(settings[control.key]);
  for (const control of POINTER_SLIDERS) parts.push(settings[control.key]);
  parts.push(settings.glyphCycle, settings.ink, settings.accent);
  return parts.join('|');
}

/**
 * Frame-rate independent catch-up. `follow` is the fraction closed per 16.7ms.
 * 1 sticks to the cursor.
 *
 * @param {number} follow
 * @param {number} dt
 */
function followFactor(follow, dt) {
  if (follow >= 0.999) return 1;
  const steps = Math.min(Math.max(dt, 0), 48) / 16.67;
  return 1 - (1 - follow) ** steps;
}

/**
 * Mount the ASCII 404 into a canvas. `settings` is mutated live by the GUI.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, number | string | boolean>} settings
 */
export function mountArtwork(canvas, settings) {
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Canvas 2D is unavailable');

  const cache = document.createElement('canvas');
  const cacheContext = cache.getContext('2d', { alpha: false });
  if (!cacheContext) throw new Error('Canvas 2D is unavailable');

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = motionQuery.matches;
  let width = 1;
  let height = 1;
  let dpr = 1;
  let raf = 0;
  let lastDraw = 0;
  let onScreen = true;

  const pointer = {
    x: -1000,
    y: -1000,
    smoothX: -1000,
    smoothY: -1000,
    active: false,
  };

  const drawn = {
    snap: '\0',
    tick: -1,
    width: -1,
    height: -1,
    dpr: -1,
    pointer: false,
  };

  const built = { layoutSig: '', cacheSig: '', backgroundSig: '' };
  let metrics = measure(width, height, /** @type {any} */ (settings));
  /** @type {import('./field.js').FieldCell[]} */
  let cells = [];
  /** @type {import('./field.js').ConnectorMark[]} */
  let connectors = [];
  /** @type {import('./field.js').BackgroundPoint[]} */
  let background = [];

  function layoutSignature() {
    return [
      width,
      height,
      settings.elementDensity,
      settings.elementSize,
      settings.contourWidth,
      settings.fillDensity,
      settings.logoScale,
    ].join('|');
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bitmapWidth = Math.round(width * dpr);
    const bitmapHeight = Math.round(height * dpr);
    if (canvas.width !== bitmapWidth) canvas.width = bitmapWidth;
    if (canvas.height !== bitmapHeight) canvas.height = bitmapHeight;
  }

  function ensureField() {
    const layoutSig = layoutSignature();
    if (layoutSig === built.layoutSig) return;
    metrics = measure(width, height, /** @type {any} */ (settings));
    cells = buildCells(metrics, /** @type {any} */ (settings));
    connectors = buildConnectors(width, metrics);
    built.layoutSig = layoutSig;
    built.backgroundSig = '';
  }

  function ensureBackground() {
    const signature = `${built.layoutSig}|${settings.backgroundDensity}`;
    if (signature === built.backgroundSig) return;
    background = buildBackground(width, height, metrics, Number(settings.backgroundDensity));
    built.backgroundSig = signature;
  }

  /**
   * @param {number} tick
   */
  function drawCache(tick) {
    if (cache.width !== canvas.width || cache.height !== canvas.height) {
      cache.width = canvas.width;
      cache.height = canvas.height;
    }

    cacheContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    cacheContext.globalAlpha = 1;
    cacheContext.fillStyle = '#ffffff';
    cacheContext.fillRect(0, 0, width, height);
    cacheContext.textAlign = 'center';
    cacheContext.textBaseline = 'middle';

    const opacity = Number(settings.backgroundOpacity);
    if (opacity <= 0) return;

    const symbols = symbolsFor(Number(settings.symbolVariety));
    const count = symbols.length;
    const painter = createPainter(cacheContext, FONT_FAMILY);
    const ink = String(settings.ink);
    const glyphSize = Number(settings.elementSize);

    if (background.length > 0) {
      const size = glyphSize * 0.74;
      for (let index = 0; index < background.length; index += 1) {
        const point = background[index];
        const pick = Math.floor(noise(point.index, tick, 731) * count);
        painter.draw(symbols[pick], point.x, point.y, opacity * point.shade, ink, size, 400);
      }
    }

    const connectorSize = glyphSize * 0.72;
    const connectorAlpha = opacity * 0.82;
    for (let index = 0; index < connectors.length; index += 1) {
      const mark = connectors[index];
      const symbol = mark.slot < 0 ? '.' : symbols[mark.slot % count];
      painter.draw(symbol, mark.x, mark.y, connectorAlpha, ink, connectorSize, 400);
    }
  }

  /**
   * @param {number} time
   * @param {number} tick
   * @param {number} dt
   */
  function drawLogo(time, tick, dt) {
    const motion = reducedMotion ? 0 : Number(settings.motionAmount);
    const floatY = Math.sin(time * 0.00048) * 7 * motion;
    const angle = Math.sin(time * 0.00024) * 0.014 * motion;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);

    if (pointer.active) {
      const factor = followFactor(Number(settings.pointerFollow), dt);
      pointer.smoothX += (pointer.x - pointer.smoothX) * factor;
      pointer.smoothY += (pointer.y - pointer.smoothY) * factor;
    }

    const reach = Math.max(36, metrics.logoSize * Number(settings.pointerRadius));
    const symbols = symbolsFor(Number(settings.symbolVariety));
    const count = symbols.length;
    const ink = String(settings.ink);
    const accent = String(settings.accent);
    const contrast = Number(settings.contrast);
    const elementSize = Number(settings.elementSize);
    const hoverLift = Number(settings.hoverLift);
    const falloff = Number(settings.pointerFalloff);
    const swell = Number(settings.pointerSwell);
    const painter = createPainter(context, FONT_FAMILY);

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    for (let index = 0; index < cells.length; index += 1) {
      const cell = cells[index];
      let drawX = metrics.cx + cell.lx * cosine - cell.ly * sine;
      let drawY = metrics.cy + floatY + cell.lx * sine + cell.ly * cosine;
      let pointerAmount = 0;

      if (pointer.active) {
        const dx = drawX - pointer.smoothX;
        const dy = drawY - pointer.smoothY;
        const distance = Math.hypot(dx, dy);
        pointerAmount = Math.max(0, 1 - distance / reach);
        if (pointerAmount > 0 && distance > 0.001) {
          const shaped = pointerAmount ** falloff;
          const lift = shaped * hoverLift;
          drawX += (dx / distance) * lift;
          drawY += (dy / distance) * lift - shaped * hoverLift * 0.1;
          pointerAmount = shaped;
        }
      }

      const symbol = symbols[Math.floor(noise(cell.x, cell.y, 631 + tick) * count)];
      const mix = Math.min(1, pointerAmount * 0.92);
      const color = mix > 0.01 ? mixHex(ink, accent, mix) : ink;
      const fill = Number(settings.fillDensity);
      const interiorAlpha = fill ** 1.35 * (0.28 + cell.alphaNoise * 0.62);
      // Contrast pulls the contour away from the interior toward solid ink.
      const contourLift = 0.2 + contrast * 0.8;
      const alpha = cell.onContour
        ? Math.min(1, interiorAlpha + (1 - interiorAlpha) * contourLift)
        : interiorAlpha;
      const size = elementSize * (cell.onContour ? 1.05 : 1) * (1 + pointerAmount * swell);
      painter.draw(symbol, drawX, drawY, alpha, color, size, cell.onContour ? 700 : 400);
    }
  }

  /**
   * @param {number} time
   * @param {number} tick
   * @param {number} dt
   */
  function render(time, tick, dt) {
    const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
    if (nextDpr !== dpr) resize();

    const moving = !reducedMotion && Number(settings.motionAmount) > 0;
    if (!moving && !pointer.active && !drawn.pointer) {
      const snap = snapshot(settings);
      if (
        snap === drawn.snap
        && tick === drawn.tick
        && width === drawn.width
        && height === drawn.height
        && dpr === drawn.dpr
      ) return false;
    }

    ensureField();
    ensureBackground();

    const cacheSig = [
      built.layoutSig,
      built.backgroundSig,
      dpr,
      canvas.width,
      canvas.height,
      settings.backgroundOpacity,
      settings.symbolVariety,
      settings.ink,
      settings.elementSize,
      tick,
    ].join('|');

    if (cacheSig !== built.cacheSig) {
      drawCache(tick);
      built.cacheSig = cacheSig;
    }

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.drawImage(cache, 0, 0);
    drawLogo(time, tick, dt);

    drawn.snap = snapshot(settings);
    drawn.tick = tick;
    drawn.width = width;
    drawn.height = height;
    drawn.dpr = dpr;
    drawn.pointer = pointer.active;
    return true;
  }

  const perf = document.querySelector('#perf');
  let paintCount = 0;
  let paintMs = 0;
  let sampleStart = 0;

  /**
   * Painted frames, not rAF ticks. Idle draws are capped at ~14fps.
   *
   * @param {number} time
   * @param {number} cost
   * @param {boolean} painted
   */
  function notePaint(time, cost, painted) {
    if (!(perf instanceof HTMLElement)) return;
    if (sampleStart === 0) sampleStart = time;
    if (painted) {
      paintCount += 1;
      paintMs += cost;
    }
    const elapsed = time - sampleStart;
    if (elapsed < 500) return;
    const fps = Math.round((paintCount * 1000) / elapsed);
    const next = paintCount === 0
      ? '0 fps'
      : `${fps} fps · ${(paintMs / paintCount).toFixed(1)} ms`;
    if (perf.textContent !== next) perf.textContent = next;
    paintCount = 0;
    paintMs = 0;
    sampleStart = time;
  }

  function frame(time) {
    raf = 0;
    if (document.hidden || !onScreen) return;
    raf = requestAnimationFrame(frame);
    const interval = pointer.active ? POINTER_FRAME_MS : FRAME_MS;
    if (lastDraw !== 0 && time - lastDraw < interval) return;
    const dt = lastDraw === 0 ? 16.67 : time - lastDraw;
    lastDraw = time;
    const cycle = settings.glyphCycle !== false && !reducedMotion;
    const started = performance.now();
    const painted = render(time, cycle ? Math.floor(time / SYMBOL_MS) : 0, dt);
    notePaint(time, performance.now() - started, painted);
  }

  function start() {
    if (raf || document.hidden || !onScreen) return;
    lastDraw = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
  }

  /**
   * @param {PointerEvent} event
   */
  function onMove(event) {
    const bounds = canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    if (!pointer.active) {
      pointer.smoothX = x;
      pointer.smoothY = y;
    }
    pointer.x = x;
    pointer.y = y;
    pointer.active = true;
  }

  function onLeave() {
    pointer.active = false;
    lastDraw = 0;
  }

  function onMotionChange() {
    reducedMotion = motionQuery.matches;
    drawn.snap = '\0';
    start();
  }

  function onVisibility() {
    if (document.hidden || !onScreen) stop();
    else start();
  }

  const resizeObserver = new ResizeObserver(() => {
    resize();
    drawn.snap = '\0';
  });
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    onVisibility();
  });

  resizeObserver.observe(canvas);
  visibilityObserver.observe(canvas);
  canvas.addEventListener('pointermove', onMove, { passive: true });
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('pointercancel', onLeave);
  motionQuery.addEventListener('change', onMotionChange);
  document.addEventListener('visibilitychange', onVisibility);

  resize();
  start();

  return {
    destroy() {
      stop();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointercancel', onLeave);
      motionQuery.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
