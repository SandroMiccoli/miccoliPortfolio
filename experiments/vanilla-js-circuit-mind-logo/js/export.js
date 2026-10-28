/**
 * Demo-only loop export. The embed does not load this file.
 */

const NS = 'http://www.w3.org/2000/svg';
const EXPORT_W = 1920;
const EXPORT_H = 1080;
const EXPORT_FPS = 60;

/**
 * @param {number} value
 */
function round(value) {
  return Math.round(value * 100) / 100;
}

/**
 * @param {number[]} a
 * @param {number[]} b
 */
function sameMotion(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (Math.abs(a[i] - b[i]) > 0.02) return false;
  }
  return true;
}

/**
 * @param {number} boxW
 * @param {number} boxH
 */
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

/**
 * @param {SVGSVGElement} clone
 * @param {number} unit
 */
function bakeStrokes(clone, unit) {
  clone.querySelectorAll('[vector-effect], [stroke-width]').forEach((el) => {
    el.removeAttribute('vector-effect');
    const width = el.getAttribute('stroke-width');
    if (width == null || width === '') return;
    const value = Number(width);
    if (Number.isFinite(value)) el.setAttribute('stroke-width', String(round(value * unit)));
  });
}

/**
 * @param {Blob} blob
 */
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

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ svg: SVGSVGElement, view: { w: number, h: number }, unit: number, settings: Record<string, unknown> }} mark
 * @param {number} unit
 */
async function rasterFrame(canvas, mark, unit) {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas unavailable');
  const glow = Number(mark.settings.glow) || 0;
  const node = Number(mark.settings.node) || 0;
  const pad = (glow * 3.2 + node * 0.6 + 8) * unit;
  const { view } = mark;
  const boxW = view.w + pad * 2;
  const boxH = view.h + pad * 2;
  const art = fitArt(boxW, boxH);
  const clone = mark.svg.cloneNode(true);
  if (!(clone instanceof SVGSVGElement)) throw new Error('SVG clone failed');
  clone.setAttribute('xmlns', NS);
  clone.setAttribute('width', String(art.w));
  clone.setAttribute('height', String(art.h));
  clone.setAttribute('viewBox', `${round(-pad)} ${round(-pad)} ${round(boxW)} ${round(boxH)}`);
  bakeStrokes(clone, unit);
  const xml = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const source = await loadSvgSource(blob);
  ctx.fillStyle = mark.settings.background === 'transparent' ? '#020B16' : String(mark.settings.background);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, art.x, art.y, art.w, art.h);
  if (typeof source.close === 'function') source.close();
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {(index: number) => Promise<void>} renderFrame
 * @param {number} frameCount
 */
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

/**
 * @param {HTMLCanvasElement} canvas
 * @param {(index: number) => Promise<void>} renderFrame
 * @param {number} frameCount
 */
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
  }
  if (recorder.state !== 'inactive') recorder.stop();
  await stopped;
  stream.getTracks().forEach((item) => item.stop());
  if (!chunks.length) throw new Error('Recording produced no data');
  return new Blob(chunks, { type: mime || 'video/webm' });
}

/**
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Render a seamless loop of the mounted scene.
 * `onProgress` receives 0–100 while frames are drawn.
 *
 * @param {{
 *   svg: SVGSVGElement,
 *   view: { w: number, h: number },
 *   unit: number,
 *   settings: Record<string, unknown>,
 *   scene: string,
 *   suspend: () => void,
 *   resume: () => void,
 *   loopPlan: (fps?: number) => { frameCount: number },
 *   paintProgress: (progress: number) => void,
 *   motionValues: () => number[],
 * }} mark
 * @param {{ onProgress?: (percent: number) => void }} [hooks]
 */
export async function exportLoop(mark, hooks = {}) {
  mark.suspend();
  try {
    const plan = mark.loopPlan(EXPORT_FPS);
    const unit = mark.unit;
    mark.paintProgress(0);
    const opened = mark.motionValues();
    mark.paintProgress(1);
    if (!sameMotion(opened, mark.motionValues())) throw new Error('Painted loop does not close');
    const canvas = document.createElement('canvas');
    canvas.width = EXPORT_W;
    canvas.height = EXPORT_H;
    const renderFrame = async (index) => {
      mark.paintProgress(index / plan.frameCount);
      await rasterFrame(canvas, mark, unit);
      if (index % 12 === 0 || index === plan.frameCount - 1) {
        hooks.onProgress?.(Math.round(((index + 1) / plan.frameCount) * 100));
      }
    };
    try {
      return await encodeMp4(canvas, renderFrame, plan.frameCount);
    } catch (error) {
      console.warn(error);
      hooks.onProgress?.(0);
      return await encodeWebm(canvas, renderFrame, plan.frameCount);
    }
  } finally {
    mark.resume();
  }
}
