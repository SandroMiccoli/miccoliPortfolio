/**
 * Same hash and 404 mask as the original page.
 * Kept exact so the field lands on the same cells.
 */

/**
 * @param {number} x
 * @param {number} y
 * @param {number} seed
 */
export function noise(x, y, seed) {
  let value = Math.imul(Math.round(x * 19) ^ seed, 0x45d9f3b);
  value ^= Math.imul(Math.round(y * 23) + seed, 0x27d4eb2d);
  value = Math.imul(value ^ (value >>> 15), 1 | value);
  value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967295;
}

/**
 * @param {string} from
 * @param {string} to
 * @param {number} amount
 */
export function mixHex(from, to, amount) {
  const read = (hex, offset) => Number.parseInt(hex.slice(offset, offset + 2), 16);
  const channel = (a, b) => Math.round(a + (b - a) * amount)
    .toString(16)
    .padStart(2, '0');
  return `#${channel(read(from, 1), read(to, 1))}${channel(read(from, 3), read(to, 3))}${channel(read(from, 5), read(to, 5))}`;
}

/**
 * @param {number} x
 * @param {number} y
 * @param {[number, number]} start
 * @param {[number, number]} end
 */
function distanceToSegment(x, y, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const lengthSquared = dx * dx + dy * dy;
  const amount = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, ((x - start[0]) * dx + (y - start[1]) * dy) / lengthSquared));
  return Math.hypot(x - (start[0] + amount * dx), y - (start[1] + amount * dy));
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} cx
 * @param {number} cy
 * @param {number} size
 */
export function inside404Glyph(x, y, cx, cy, size) {
  const digitHeight = size * 0.84;
  const digitWidth = size * 0.34;
  const gap = size * 0.11;
  const stroke = size * 0.074;
  const totalWidth = digitWidth * 3 + gap * 2;
  const top = cy - digitHeight / 2;
  const bottom = cy + digitHeight / 2;
  const middle = cy + stroke * 0.08;
  const firstLeft = cx - totalWidth / 2;

  const insideDigit = (digit, left) => {
    const right = left + digitWidth;
    if (x < left || x > right || y < top || y > bottom) return false;
    if (digit === 0) {
      const inHole = x > left + stroke && x < right - stroke
        && y > top + stroke && y < bottom - stroke;
      return !inHole;
    }
    const rightStem = x >= right - stroke && x <= right;
    const crossbar = y >= middle - stroke / 2 && y <= middle + stroke / 2;
    const diagonalStart = /** @type {[number, number]} */ ([left + stroke * 0.48, middle]);
    const diagonalEnd = /** @type {[number, number]} */ ([right - stroke * 0.52, top + stroke * 0.48]);
    const diagonal = y <= middle + stroke / 2
      && distanceToSegment(x, y, diagonalStart, diagonalEnd) <= stroke / 2;
    return rightStem || crossbar || diagonal;
  };

  return insideDigit(4, firstLeft)
    || insideDigit(0, firstLeft + digitWidth + gap)
    || insideDigit(4, firstLeft + (digitWidth + gap) * 2);
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} cx
 * @param {number} cy
 * @param {number} size
 * @param {number} width
 */
export function on404Contour(x, y, cx, cy, size, width) {
  if (!inside404Glyph(x, y, cx, cy, size)) return false;
  // A thin rim, so the rest of the stroke can respond to inner fill.
  // `width` is the contour thickness from the slider.
  const sampleDistance = Math.max(1.25, width * 0.7);
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    if (!inside404Glyph(
      x + Math.cos(angle) * sampleDistance,
      y + Math.sin(angle) * sampleDistance,
      cx,
      cy,
      size,
    )) return true;
  }
  return false;
}
