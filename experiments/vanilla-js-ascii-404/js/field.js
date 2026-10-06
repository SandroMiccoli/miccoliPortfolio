import { inside404Glyph, noise, on404Contour } from './glyph.js';

/**
 * @typedef {Object} FieldMetrics
 * @property {number} cx
 * @property {number} cy
 * @property {number} logoSize
 * @property {number} step
 * @property {number} outlineWidth
 */

/**
 * @typedef {Object} FieldCell
 * @property {number} x
 * @property {number} y
 * @property {number} lx
 * @property {number} ly
 * @property {boolean} onContour
 * @property {number} alphaNoise
 */

/**
 * @typedef {Object} BackgroundPoint
 * @property {number} index
 * @property {number} x
 * @property {number} y
 * @property {number} shade
 */

/**
 * @typedef {Object} ConnectorMark
 * @property {number} x
 * @property {number} y
 * @property {number} slot Symbol index, or -1 for a dot.
 */

/**
 * @param {number} width
 * @param {number} height
 * @param {{ logoScale: number, elementSize: number, elementDensity: number, contourWidth: number }} settings
 * @returns {FieldMetrics}
 */
export function measure(width, height, settings) {
  const mobile = width < 760;
  const logoSize = Math.min(width * (mobile ? 0.54 : 0.31), height * 0.68) * settings.logoScale;
  const step = Math.max(5, (settings.elementSize * 1.32) / settings.elementDensity);
  return {
    cx: width * 0.5,
    cy: height * 0.51,
    logoSize,
    step,
    outlineWidth: logoSize * settings.contourWidth,
  };
}

/**
 * Cells that survive the contour and fill gates.
 * Rebuilt when the layout changes, not every frame.
 *
 * @param {FieldMetrics} metrics
 * @param {{ elementDensity: number, fillDensity: number }} settings
 * @returns {FieldCell[]}
 */
export function buildCells(metrics, settings) {
  const { cx, cy, logoSize, step, outlineWidth } = metrics;
  const left = cx - logoSize * 0.79;
  const right = cx + logoSize * 0.79;
  const top = cy - logoSize * 0.47;
  const bottom = cy + logoSize * 0.47;
  const contourGate = Math.min(1, settings.elementDensity * 1.08);
  const fillGate = settings.fillDensity;
  /** @type {FieldCell[]} */
  const cells = [];

  for (let y = top; y <= bottom; y += step) {
    for (let x = left; x <= right; x += step) {
      const jitterX = (noise(x, y, 193) - 0.5) * step * 0.17;
      const jitterY = (noise(x, y, 577) - 0.5) * step * 0.17;
      const px = x + jitterX;
      const py = y + jitterY;
      const onContour = on404Contour(px, py, cx, cy, logoSize, outlineWidth);
      if (!onContour && !inside404Glyph(px, py, cx, cy, logoSize)) continue;

      const random = noise(x, y, 2719);
      if (onContour ? random >= contourGate : random >= fillGate) continue;

      cells.push({
        x,
        y,
        lx: px - cx,
        ly: py - cy,
        onContour,
        alphaNoise: onContour ? noise(x, y, 83) : noise(x, y, 97),
      });
    }
  }

  return cells;
}

/**
 * @param {number} width
 * @param {number} height
 * @param {FieldMetrics} metrics
 * @param {number} density
 * @returns {BackgroundPoint[]}
 */
export function buildBackground(width, height, metrics, density) {
  const count = Math.round((width * height / 2700) * density);
  const limit = metrics.logoSize * 0.87;
  /** @type {BackgroundPoint[]} */
  const points = [];

  for (let index = 0; index < count; index += 1) {
    const x = noise(index, 17, 9127) * width;
    const y = noise(index, 31, 4111) * height;
    if (Math.hypot(x - metrics.cx, y - metrics.cy) < limit) continue;
    points.push({
      index,
      x,
      y,
      shade: 0.35 + noise(index, 4, 828) * 0.65,
    });
  }

  return points;
}

/**
 * @param {number} width
 * @param {FieldMetrics} metrics
 * @returns {ConnectorMark[]}
 */
export function buildConnectors(width, metrics) {
  const rows = [-0.34, -0.11, 0.12, 0.35];
  const edge = metrics.logoSize * 0.77;
  const leftEnd = metrics.cx - edge;
  const rightStart = metrics.cx + edge;
  const lineStep = metrics.step * 1.18;
  const leftLimit = width * 0.05;
  const rightLimit = width * 0.96;
  const leftTag = width * 0.07;
  const rightTag = width * 0.94;
  /** @type {ConnectorMark[]} */
  const marks = [];

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const y = metrics.cy + rows[rowIndex] * metrics.logoSize;
    const direction = rowIndex % 2 ? 1 : -1;
    const elbowLeft = leftEnd - metrics.logoSize * 0.12;

    for (let x = leftLimit; x < leftEnd; x += lineStep) {
      const yOffset = x > elbowLeft ? (x - elbowLeft) * 0.25 * direction : 0;
      marks.push({ x, y: y + yOffset, slot: x < leftTag ? rowIndex : -1 });
    }

    const elbowRight = rightStart + metrics.logoSize * 0.12;
    for (let x = rightStart; x < rightLimit; x += lineStep) {
      const yOffset = x < elbowRight ? (elbowRight - x) * 0.25 * -direction : 0;
      marks.push({ x, y: y + yOffset, slot: x > rightTag ? rowIndex + 1 : -1 });
    }
  }

  return marks;
}
