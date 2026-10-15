import * as THREE from '../vendor/three.module.min.js';

/**
 * One instanced plane. The vertex shader bends each card onto the sphere,
 * so the draw stays a single call no matter how many photos are on it.
 * @param {ReturnType<import('./layout.js').layoutCards>} cards
 * @param {number[][]} rects Atlas uv rects, one per card: [u, v, width, height].
 * @param {{ x: number, y: number }} segments
 */
export function createGlobeGeometry(cards, rects, radius, segments) {
  const plane = new THREE.PlaneGeometry(1, 1, segments.x, segments.y);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = plane.index;
  geometry.setAttribute('position', plane.attributes.position);
  geometry.setAttribute('uv', plane.attributes.uv);
  geometry.instanceCount = cards.length;

  const normals = new Float32Array(cards.length * 3);
  const easts = new Float32Array(cards.length * 3);
  const norths = new Float32Array(cards.length * 3);
  const sizes = new Float32Array(cards.length * 2);
  const atlas = new Float32Array(cards.length * 4);

  cards.forEach((card, index) => {
    const frame = basis(card.lat, card.lon, card.roll);
    normals.set(frame.normal, index * 3);
    easts.set(frame.east, index * 3);
    norths.set(frame.north, index * 3);
    sizes.set([card.width, card.height], index * 2);
    const rect = rects[index] || [0, 0, 1, 1];
    atlas.set(rect, index * 4);
  });

  geometry.setAttribute('aNormal', new THREE.InstancedBufferAttribute(normals, 3));
  geometry.setAttribute('aEast', new THREE.InstancedBufferAttribute(easts, 3));
  geometry.setAttribute('aNorth', new THREE.InstancedBufferAttribute(norths, 3));
  geometry.setAttribute('aSize', new THREE.InstancedBufferAttribute(sizes, 2));
  geometry.setAttribute('aAtlas', new THREE.InstancedBufferAttribute(atlas, 4));

  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius * 1.02);
  return { geometry, plane };
}

function basis(lat, lon, roll) {
  const cosLat = Math.cos(lat);
  const sinLat = Math.sin(lat);
  const cosLon = Math.cos(lon);
  const sinLon = Math.sin(lon);
  const normal = [cosLat * sinLon, sinLat, cosLat * cosLon];
  let east = [cosLon, 0, -sinLon];
  let north = [-sinLat * sinLon, cosLat, -sinLat * cosLon];

  if (roll) {
    const c = Math.cos(roll);
    const s = Math.sin(roll);
    const eastR = [
      east[0] * c + north[0] * s,
      east[1] * c + north[1] * s,
      east[2] * c + north[2] * s,
    ];
    const northR = [
      north[0] * c - east[0] * s,
      north[1] * c - east[1] * s,
      north[2] * c - east[2] * s,
    ];
    east = eastR;
    north = northR;
  }

  return { normal, east, north };
}
