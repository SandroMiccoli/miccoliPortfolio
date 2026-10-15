/**
 * One canvas atlas. Each card is a cell: a flat color first, then the photo
 * painted into a rounded inset when it arrives. The globe uploads the canvas
 * once per frame, not once per image.
 *
 * Cells keep a gutter of the card color. Mipmaps would otherwise blend in the
 * neighbor and tint the card edge.
 */
const GUTTER = 16;
export function createCardAtlas(cards, options) {
  const fit = fitCells(cards.length, options.aspect, options.cellHeight, options.maxSize);
  const canvas = document.createElement('canvas');
  canvas.width = fit.columns * fit.cellW;
  canvas.height = fit.rows * fit.cellH;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Could not create the card atlas.');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  const rects = cards.map((_, index) => uvRect(index, fit, canvas));
  for (const card of cards) paintCell(context, fit, card, null, options);

  let destroyed = false;

  return {
    canvas,
    rects,
    destroy() {
      destroyed = true;
      canvas.width = 1;
      canvas.height = 1;
    },
    load(imageUrls, { signal, onPaint }) {
      const jobs = uniqueJobs(cards, imageUrls);
      let cursor = 0;

      async function worker() {
        while (cursor < jobs.length && !destroyed && !signal?.aborted) {
          const job = jobs[cursor];
          cursor += 1;
          try {
            const bitmap = await decodeImage(job.url, options.decodeWidth, signal);
            if (destroyed || signal?.aborted) {
              bitmap.close?.();
              return;
            }
            for (const imageIndex of job.indexes) {
              for (const card of cards) {
                if (card.image === imageIndex) paintCell(context, fit, card, bitmap, options);
              }
            }
            bitmap.close?.();
            onPaint?.();
          } catch (error) {
            if (error?.name === 'AbortError' || destroyed) return;
          }
        }
      }

      const workers = Math.min(4, jobs.length);
      if (workers === 0) return Promise.resolve();
      return Promise.all(Array.from({ length: workers }, worker)).then(() => undefined);
    },
  };
}

function fitCells(count, aspect, targetHeight, maxSize) {
  let contentH = targetHeight;
  let contentW = Math.max(1, Math.round(contentH * aspect));
  let slotW = contentW + GUTTER * 2;
  let slotH = contentH + GUTTER * 2;
  let columns = Math.max(1, Math.floor(maxSize / slotW));
  let rows = Math.ceil(Math.max(1, count) / columns);

  while ((rows * slotH > maxSize || columns * slotW > maxSize) && contentH > 64) {
    contentH -= 8;
    contentW = Math.max(1, Math.round(contentH * aspect));
    slotW = contentW + GUTTER * 2;
    slotH = contentH + GUTTER * 2;
    columns = Math.max(1, Math.floor(maxSize / slotW));
    rows = Math.ceil(Math.max(1, count) / columns);
  }

  return {
    contentW,
    contentH,
    gutter: GUTTER,
    cellW: slotW,
    cellH: slotH,
    columns,
    rows,
  };
}

function cellRect(index, fit) {
  const col = index % fit.columns;
  const row = Math.floor(index / fit.columns);
  return {
    x: col * fit.cellW,
    y: row * fit.cellH,
    w: fit.cellW,
    h: fit.cellH,
  };
}

function contentRect(index, fit) {
  const slot = cellRect(index, fit);
  return {
    x: slot.x + fit.gutter,
    y: slot.y + fit.gutter,
    w: fit.contentW,
    h: fit.contentH,
  };
}

function uvRect(index, fit, canvas) {
  const rect = contentRect(index, fit);
  const pad = 0.5;
  const u0 = (rect.x + pad) / canvas.width;
  const u1 = (rect.x + rect.w - pad) / canvas.width;
  const vTop = 1 - (rect.y + pad) / canvas.height;
  const vBottom = 1 - (rect.y + rect.h - pad) / canvas.height;
  return [u0, vBottom, u1 - u0, vTop - vBottom];
}

function paintCell(context, fit, card, bitmap, options) {
  const slot = cellRect(card.index, fit);
  const rect = contentRect(card.index, fit);
  context.fillStyle = card.color;
  context.fillRect(slot.x, slot.y, slot.w, slot.h);
  if (!bitmap) return;

  const inset = Math.round(Math.min(rect.w, rect.h) * options.imageInset);
  const dw = rect.w - inset * 2;
  const dh = rect.h - inset * 2;
  if (dw < 2 || dh < 2) return;

  const scale = Math.max(dw / bitmap.width, dh / bitmap.height);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (bitmap.width - sw) * 0.5;
  const sy = (bitmap.height - sh) * 0.5;
  const radius = Math.min(dw, dh) * options.imageRadius;

  context.save();
  traceRoundRect(context, rect.x + inset, rect.y + inset, dw, dh, radius);
  context.clip();
  context.drawImage(bitmap, sx, sy, sw, sh, rect.x + inset, rect.y + inset, dw, dh);
  context.restore();
}

function uniqueJobs(cards, imageUrls) {
  const byUrl = new Map();
  for (const card of cards) {
    const url = card.image >= 0 ? imageUrls[card.image] : '';
    if (!url) continue;
    let indexes = byUrl.get(url);
    if (!indexes) {
      indexes = [];
      byUrl.set(url, indexes);
    }
    if (!indexes.includes(card.image)) indexes.push(card.image);
  }
  return [...byUrl.entries()].map(([url, indexes]) => ({ url, indexes }));
}

async function decodeImage(url, decodeWidth, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Failed to load ${url}`);
  const blob = await response.blob();
  if (typeof createImageBitmap !== 'function') return loadImageElement(url);
  try {
    return await createImageBitmap(blob, { resizeWidth: decodeWidth, resizeQuality: 'medium' });
  } catch {
    return await createImageBitmap(blob);
  }
}

function loadImageElement(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load ${url}`));
    image.src = url;
  });
}

function traceRoundRect(context, x, y, w, h, radius) {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  context.beginPath();
  if (typeof context.roundRect === 'function') {
    context.roundRect(x, y, w, h, r);
    return;
  }
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.closePath();
}
