/**
 * Rounded-square plates, ported from ASCII Stack V4.
 * Point objects are created once. The per-frame helpers only write into `out`.
 */

/**
 * @typedef {Object} StackPoint
 * @property {number} x
 * @property {number} y
 * @property {number} z
 * @property {number} nx
 * @property {number} ny
 * @property {number} nz
 * @property {number} tone
 * @property {number} layer
 * @property {number} row
 * @property {number} cell
 * @property {0 | 1} flowKind 0 linear, 1 perimeter
 * @property {number} flowPosition
 * @property {number} flowLength
 * @property {number} flowHalf
 * @property {number} cornerRadius
 * @property {number} surfaceScale
 * @property {number} baseCenterY
 */

/**
 * @typedef {Object} Rotation
 * @property {number} cosY
 * @property {number} sinY
 * @property {number} cosP
 * @property {number} sinP
 */

const corner = { x: 0, z: 0, nx: 0, nz: 0 };

/**
 * @param {number} value
 * @param {number} length
 */
function wrapDistance(value, length) {
  return ((value % length) + length) % length;
}

/**
 * @param {number} distance
 * @param {number} half
 * @param {number} radius
 * @param {{ x: number, z: number, nx: number, nz: number }} out
 */
function roundedSquarePointAt(distance, half, radius, out) {
  const straight = 2 * (half - radius);
  const arc = (Math.PI * radius) / 2;
  const perimeter = 4 * (straight + arc);
  let offset = wrapDistance(distance, perimeter);

  if (offset < straight) {
    out.x = -half + radius + offset;
    out.z = -half;
    out.nx = 0;
    out.nz = -1;
    return;
  }
  offset -= straight;
  if (offset < arc) {
    const angle = -Math.PI / 2 + offset / radius;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    out.x = half - radius + cos * radius;
    out.z = -half + radius + sin * radius;
    out.nx = cos;
    out.nz = sin;
    return;
  }
  offset -= arc;
  if (offset < straight) {
    out.x = half;
    out.z = -half + radius + offset;
    out.nx = 1;
    out.nz = 0;
    return;
  }
  offset -= straight;
  if (offset < arc) {
    const angle = offset / radius;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    out.x = half - radius + cos * radius;
    out.z = half - radius + sin * radius;
    out.nx = cos;
    out.nz = sin;
    return;
  }
  offset -= arc;
  if (offset < straight) {
    out.x = half - radius - offset;
    out.z = half;
    out.nx = 0;
    out.nz = 1;
    return;
  }
  offset -= straight;
  if (offset < arc) {
    const angle = Math.PI / 2 + offset / radius;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    out.x = -half + radius + cos * radius;
    out.z = half - radius + sin * radius;
    out.nx = cos;
    out.nz = sin;
    return;
  }
  offset -= arc;
  if (offset < straight) {
    out.x = -half;
    out.z = half - radius - offset;
    out.nx = -1;
    out.nz = 0;
    return;
  }
  offset -= straight;
  const angle = Math.PI + offset / radius;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  out.x = -half + radius + cos * radius;
  out.z = -half + radius + sin * radius;
  out.nx = cos;
  out.nz = sin;
}

/**
 * @param {number} z
 * @param {number} half
 * @param {number} radius
 */
function roundedSquareHalfWidthAt(z, half, radius) {
  const cornerDepth = Math.max(Math.abs(z) - (half - radius), 0);
  if (cornerDepth === 0) return half;
  return half - radius + Math.sqrt(Math.max(0, radius * radius - cornerDepth * cornerDepth));
}

/**
 * @param {import('./config.js').AsciiStackConfig} config
 * @returns {StackPoint[][]}
 */
export function buildLayerPoints(config) {
  const layers = [[], [], []];
  const half = config.side / 2;
  const density = Math.max(0.5, config.density || 1);
  const columns = Math.max(8, Math.round(config.columns * density));
  const rowSpan = Math.max(4, Math.round(config.rowSpan * density));
  const edgeInset = (config.side / columns) * 1.05;
  const zReach = Math.max(half * 0.5, half - edgeInset);
  const straight = 2 * (half - config.cornerRadius);
  const perimeterLength = 4 * (straight + (Math.PI * config.cornerRadius) / 2);
  const perimeterCells = columns * 4;
  const rowStride = 400;
  const centers = [config.baseLayerSpacing, 0, -config.baseLayerSpacing];

  centers.forEach((centerY, layerIndex) => {
    const bucket = layers[layerIndex];
    for (let iz = -rowSpan; iz <= rowSpan; iz += 1) {
      const z = (iz / rowSpan) * zReach;
      const rowHalf = roundedSquareHalfWidthAt(z, half, config.cornerRadius) - edgeInset;
      if (rowHalf <= edgeInset * 0.35) continue;
      const rowLength = rowHalf * 2;
      const rowCells = Math.max(1, Math.round((columns * rowLength) / config.side));
      const topRow = layerIndex * rowStride + (iz + rowSpan);
      for (let ix = 0; ix < rowCells; ix += 1) {
        const x = -rowHalf + ((ix + 0.5) / rowCells) * rowLength;
        bucket.push(
          makePoint({
            x,
            y: centerY + config.thickness / 2,
            z,
            nx: 0,
            ny: 1,
            nz: 0,
            tone: config.surface.horizontal.tone,
            surfaceScale: config.surface.horizontal.scale,
            layer: layerIndex,
            row: topRow,
            cell: ix,
            flowKind: 0,
            flowPosition: x + rowHalf,
            flowLength: rowLength,
            flowHalf: rowHalf,
            cornerRadius: config.cornerRadius,
            baseCenterY: centerY,
          }),
        );
        bucket.push(
          makePoint({
            x,
            y: centerY - config.thickness / 2,
            z,
            nx: 0,
            ny: -1,
            nz: 0,
            tone: config.surface.horizontal.tone,
            surfaceScale: config.surface.horizontal.scale,
            layer: layerIndex,
            row: topRow + 200,
            cell: ix,
            flowKind: 0,
            flowPosition: x + rowHalf,
            flowLength: rowLength,
            flowHalf: rowHalf,
            cornerRadius: config.cornerRadius,
            baseCenterY: centerY,
          }),
        );
      }
    }

    for (let iy = -config.lateralSteps; iy <= config.lateralSteps; iy += 1) {
      const y = centerY + (iy / config.lateralSteps) * (config.thickness / 2);
      for (let cell = 0; cell < perimeterCells; cell += 1) {
        const flowPosition = ((cell + 0.5) / perimeterCells) * perimeterLength;
        roundedSquarePointAt(flowPosition, half, config.cornerRadius, corner);
        bucket.push(
          makePoint({
            x: corner.x,
            y,
            z: corner.z,
            nx: corner.nx,
            ny: 0,
            nz: corner.nz,
            tone: config.surface.lateral.tone,
            surfaceScale: config.surface.lateral.scale,
            layer: layerIndex,
            row: layerIndex * rowStride + 300 + iy,
            cell,
            flowKind: 1,
            flowPosition,
            flowLength: perimeterLength,
            flowHalf: half,
            cornerRadius: config.cornerRadius,
            baseCenterY: centerY,
          }),
        );
      }
    }
  });

  return layers;
}

/**
 * @param {StackPoint} point
 * @returns {StackPoint}
 */
function makePoint(point) {
  return point;
}

/**
 * @param {number} yaw
 * @param {number} pitch
 * @returns {Rotation}
 */
export function createRotation(yaw, pitch) {
  return {
    cosY: Math.cos(yaw),
    sinY: Math.sin(yaw),
    cosP: Math.cos(pitch),
    sinP: Math.sin(pitch),
  };
}

/**
 * Same yaw-then-pitch transform as the V4 prototype.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {Rotation} rot
 * @param {{ x: number, y: number, z: number }} out
 */
export function rotateInto(x, y, z, rot, out) {
  const x1 = x * rot.cosY - z * rot.sinY;
  const z1 = x * rot.sinY + z * rot.cosY;
  out.x = x1;
  out.y = y * rot.cosP - z1 * rot.sinP;
  out.z = y * rot.sinP + z1 * rot.cosP;
  return out;
}

/**
 * @param {StackPoint} point
 * @param {number} timeMs
 * @param {number} linearSpeed
 * @param {number} perimeterSpeed
 * @param {{ x: number, y: number, z: number, nx: number, ny: number, nz: number }} out
 */
export function flowPoint(point, timeMs, linearSpeed, perimeterSpeed, out) {
  const direction = point.row % 2 === 0 ? 1 : -1;
  const speed = point.flowKind === 1 ? perimeterSpeed : linearSpeed;
  const flowPosition = wrapDistance(point.flowPosition + direction * timeMs * speed, point.flowLength);
  if (point.flowKind === 1) {
    roundedSquarePointAt(flowPosition, point.flowHalf, point.cornerRadius, corner);
    out.x = corner.x;
    out.y = point.y;
    out.z = corner.z;
    out.nx = corner.nx;
    out.ny = 0;
    out.nz = corner.nz;
    return out;
  }
  out.x = -point.flowLength / 2 + flowPosition;
  out.y = point.y;
  out.z = point.z;
  out.nx = point.nx;
  out.ny = point.ny;
  out.nz = point.nz;
  return out;
}
