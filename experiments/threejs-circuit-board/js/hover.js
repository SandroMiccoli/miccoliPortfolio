import * as THREE from '../vendor/three.module.min.js';
import { LineSegments2 } from '../vendor/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from '../vendor/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from '../vendor/addons/lines/LineMaterial.js';
import { BLOOM_LAYER } from './bloom.js';

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
raycaster.params.Line.threshold = 0.06;

const LIFT_BIAS = 0.004;
const RAY_X = 0.2672612419;
const RAY_Y = 0.5345224838;
const RAY_Z = 0.8017837257;

function collectSolids(group) {
	const parts = [];
	group.userData.parts.traverse((obj) => {
		if (!obj.isMesh || !obj.geometry?.index || !obj.geometry.userData?.part) return;
		const pos = obj.geometry.attributes.position.array;
		const baseZ = obj.geometry.userData.baseZ;
		const part = obj.geometry.userData.part;
		const prim = obj.geometry.userData.prim;
		const index = obj.geometry.index.array;
		if (!prim) return;
		const open = new Map();
		for (let i = 0; i < index.length; i += 3) {
			const a = index[i];
			const b = index[i + 1];
			const c = index[i + 2];
			const id = part[a];
			const key = id + ':' + prim[a];
			let current = open.get(key);
			if (!current) {
				current = [];
				open.set(key, current);
				if (!parts[id]) parts[id] = [];
				parts[id].push(current);
			}
			current.push(
				pos[a * 3], pos[a * 3 + 1], baseZ[a],
				pos[b * 3], pos[b * 3 + 1], baseZ[b],
				pos[c * 3], pos[c * 3 + 1], baseZ[c],
			);
		}
	});
	return parts.map((prims) => {
		if (!prims) return null;
		return prims.map((tris) => {
			let minX = Infinity;
			let minY = Infinity;
			let minZ = Infinity;
			let maxX = -Infinity;
			let maxY = -Infinity;
			let maxZ = -Infinity;
			for (let i = 0; i < tris.length; i += 3) {
				const x = tris[i];
				const y = tris[i + 1];
				const z = tris[i + 2];
				if (x < minX) minX = x;
				if (x > maxX) maxX = x;
				if (y < minY) minY = y;
				if (y > maxY) maxY = y;
				if (z < minZ) minZ = z;
				if (z > maxZ) maxZ = z;
			}
			return { tris, minX, minY, minZ, maxX, maxY, maxZ };
		});
	});
}

function rayT(ox, oy, oz, dx, dy, dz, tris, i) {
	const ax = tris[i];
	const ay = tris[i + 1];
	const az = tris[i + 2];
	const e1x = tris[i + 3] - ax;
	const e1y = tris[i + 4] - ay;
	const e1z = tris[i + 5] - az;
	const e2x = tris[i + 6] - ax;
	const e2y = tris[i + 7] - ay;
	const e2z = tris[i + 8] - az;
	const px = dy * e2z - dz * e2y;
	const py = dz * e2x - dx * e2z;
	const pz = dx * e2y - dy * e2x;
	const det = e1x * px + e1y * py + e1z * pz;
	if (det > -1e-8 && det < 1e-8) return Infinity;
	const inv = 1 / det;
	const tx = ox - ax;
	const ty = oy - ay;
	const tz = oz - az;
	const u = (tx * px + ty * py + tz * pz) * inv;
	if (u < 0 || u > 1) return Infinity;
	const qx = ty * e1z - tz * e1y;
	const qy = tz * e1x - tx * e1z;
	const qz = tx * e1y - ty * e1x;
	const v = (dx * qx + dy * qy + dz * qz) * inv;
	if (v < 0 || u + v > 1) return Infinity;
	const t = (e2x * qx + e2y * qy + e2z * qz) * inv;
	return t > 0.012 ? t : Infinity;
}

function insidePrim(x, y, z, prim) {
	const inset = 0.02;
	if (x <= prim.minX + inset || x >= prim.maxX - inset) return false;
	if (y <= prim.minY + inset || y >= prim.maxY - inset) return false;
	if (z <= prim.minZ + inset || z >= prim.maxZ - inset) return false;
	const tris = prim.tris;
	let hits = 0;
	for (let i = 0; i < tris.length; i += 9) {
		if (rayT(x, y, z, RAY_X, RAY_Y, RAY_Z, tris, i) < Infinity) hits++;
	}
	return (hits & 1) === 1;
}

function buriedPoint(x, y, z, prims) {
	for (let i = 0; i < prims.length; i++) {
		if (insidePrim(x, y, z, prims[i])) return true;
	}
	return false;
}

function onShell(x, y, z, minX, maxX, minY, maxY, minZ, maxZ) {
	const margin = 0.02;
	return x <= minX + margin || x >= maxX - margin
		|| y <= minY + margin || y >= maxY - margin
		|| z <= minZ + margin || z >= maxZ - margin;
}

function pushSeg(out, ax, ay, az, bx, by, bz, cr, cg, cb) {
	const dx = bx - ax;
	const dy = by - ay;
	const dz = bz - az;
	if (dx * dx + dy * dy + dz * dz < 0.0004) return;
	out.push(ax, ay, az, bx, by, bz, cr, cg, cb, cr, cg, cb);
}

function clipSeg(out, ax, ay, az, bx, by, bz, cr, cg, cb, prims) {
	const len = Math.hypot(bx - ax, by - ay, bz - az);
	const steps = Math.max(2, Math.ceil(len / 0.03));
	let sx = 0;
	let sy = 0;
	let sz = 0;
	let ex = 0;
	let ey = 0;
	let ez = 0;
	let open = false;
	for (let s = 0; s <= steps; s++) {
		const t = s / steps;
		const x = ax + (bx - ax) * t;
		const y = ay + (by - ay) * t;
		const z = az + (bz - az) * t;
		if (!buriedPoint(x, y, z, prims)) {
			if (!open) {
				sx = x;
				sy = y;
				sz = z;
				open = true;
			}
			ex = x;
			ey = y;
			ez = z;
		} else if (open) {
			pushSeg(out, sx, sy, sz, ex, ey, ez, cr, cg, cb);
			open = false;
		}
	}
	if (open) pushSeg(out, sx, sy, sz, ex, ey, ez, cr, cg, cb);
}

function footprint(group) {
	const boxes = [];
	for (const geo of group.userData.geos) {
		const pos = geo.attributes.position.array;
		const part = geo.userData.part;
		const baseZ = geo.userData.baseZ;
		if (!part || !baseZ) continue;
		for (let i = 0; i < part.length; i++) {
			const id = part[i];
			let box = boxes[id];
			if (!box) {
				box = boxes[id] = {
					minX: Infinity,
					maxX: -Infinity,
					minY: Infinity,
					maxY: -Infinity,
					maxZ: 0,
				};
			}
			const x = pos[i * 3];
			const y = pos[i * 3 + 1];
			const z = baseZ[i];
			if (x < box.minX) box.minX = x;
			if (x > box.maxX) box.maxX = x;
			if (y < box.minY) box.minY = y;
			if (y > box.maxY) box.maxY = y;
			if (z > box.maxZ) box.maxZ = z;
		}
	}
	return boxes;
}

function collectEdges(group) {
	const solids = collectSolids(group);
	const lists = [];
	group.userData.parts.traverse((obj) => {
		if (!obj.isLineSegments || !obj.geometry?.userData?.part) return;
		const pos = obj.geometry.attributes.position.array;
		const baseZ = obj.geometry.userData.baseZ;
		const part = obj.geometry.userData.part;
		const color = obj.material.color;
		const r = color.r;
		const g = color.g;
		const b = color.b;
		for (let i = 0; i < part.length; i += 2) {
			const id = part[i];
			let bucket = lists[id];
			if (!bucket) bucket = lists[id] = [];
			const a = i * 3;
			const c = (i + 1) * 3;
			bucket.push(
				pos[a], pos[a + 1], baseZ[i],
				pos[c], pos[c + 1], baseZ[i + 1],
				r, g, b, r, g, b,
			);
		}
	});
	return lists.map((bucket, id) => {
		if (!bucket) return null;
		const prims = solids[id];
		const kept = [];
		let minX = Infinity;
		let maxX = -Infinity;
		let minY = Infinity;
		let maxY = -Infinity;
		let minZ = Infinity;
		let maxZ = -Infinity;
		const heavy = prims && prims.length > 1;
		if (heavy) {
			for (let i = 0; i < bucket.length; i += 12) {
				for (const offset of [0, 3]) {
					const x = bucket[i + offset];
					const y = bucket[i + offset + 1];
					const z = bucket[i + offset + 2];
					if (x < minX) minX = x;
					if (x > maxX) maxX = x;
					if (y < minY) minY = y;
					if (y > maxY) maxY = y;
					if (z < minZ) minZ = z;
					if (z > maxZ) maxZ = z;
				}
			}
		}
		for (let i = 0; i < bucket.length; i += 12) {
			const ax = bucket[i];
			const ay = bucket[i + 1];
			const az = bucket[i + 2];
			const bx = bucket[i + 3];
			const by = bucket[i + 4];
			const bz = bucket[i + 5];
			const cr = bucket[i + 6];
			const cg = bucket[i + 7];
			const cb = bucket[i + 8];
			if (heavy) {
				const shellA = onShell(ax, ay, az, minX, maxX, minY, maxY, minZ, maxZ);
				const shellB = onShell(bx, by, bz, minX, maxX, minY, maxY, minZ, maxZ);
				if (!(shellA && shellB)) {
					const hideA = buriedPoint(ax, ay, az, prims);
					const hideB = buriedPoint(bx, by, bz, prims);
					if (hideA || hideB) {
						clipSeg(kept, ax, ay, az, bx, by, bz, cr, cg, cb, prims);
						continue;
					}
				}
			}
			for (let k = 0; k < 12; k++) kept.push(bucket[i + k]);
		}
		if (!kept.length) return null;
		const count = kept.length / 12;
		const base = new Float32Array(count * 6);
		const colors = new Float32Array(count * 6);
		for (let s = 0; s < count; s++) {
			const from = s * 12;
			const to = s * 6;
			base[to] = kept[from];
			base[to + 1] = kept[from + 1];
			base[to + 2] = kept[from + 2];
			base[to + 3] = kept[from + 3];
			base[to + 4] = kept[from + 4];
			base[to + 5] = kept[from + 5];
			const tint = 0.48;
			colors[to] = kept[from + 6] * tint;
			colors[to + 1] = kept[from + 7] * tint;
			colors[to + 2] = kept[from + 8] * tint;
			colors[to + 3] = kept[from + 9] * tint;
			colors[to + 4] = kept[from + 10] * tint;
			colors[to + 5] = kept[from + 11] * tint;
		}
		return { base, colors, count, live: null, liveLift: -1 };
	});
}

function createWire(renderer) {
	const geometry = new LineSegmentsGeometry();
	const material = new LineMaterial({
		color: 0xffffff,
		linewidth: 1.5,
		vertexColors: true,
		transparent: true,
		opacity: 0.85,
		depthTest: true,
		depthWrite: false,
		toneMapped: false,
		polygonOffset: true,
		polygonOffsetFactor: 0,
		polygonOffsetUnits: -1,
	});
	const canvas = renderer.domElement;
	material.resolution.set(canvas.clientWidth || 1, canvas.clientHeight || 1);
	const line = new LineSegments2(geometry, material);
	line.name = 'part-hover';
	line.visible = false;
	line.frustumCulled = false;
	line.renderOrder = 4;
	line.layers.set(BLOOM_LAYER);
	line.raycast = () => {};
	return { line, geometry, material };
}

export function createPartHover(groups, renderer) {
	const boards = groups.map((group) => ({
		group,
		parts: group.userData.parts,
		lifts: group.userData.lifts,
		boxes: footprint(group),
		edges: collectEdges(group),
	}));
	const { line, geometry: scratch, material } = createWire(renderer);

	function hide() {
		line.visible = false;
	}

	function show(board, id, lift) {
		const edges = board.edges[id];
		if (!edges || !edges.count) {
			hide();
			return false;
		}
		if (!edges.live) edges.live = new Float32Array(edges.base);
		const liftChanged = edges.liveLift !== lift;
		if (liftChanged) {
			const live = edges.live;
			const base = edges.base;
			for (let i = 2; i < live.length; i += 3) live[i] = base[i] * lift + LIFT_BIAS;
			edges.liveLift = lift;
		}
		if (!edges.geometry) {
			const geometry = new LineSegmentsGeometry();
			geometry.setPositions(edges.live);
			geometry.setColors(edges.colors);
			geometry.instanceCount = edges.count;
			edges.geometry = geometry;
		} else if (liftChanged) {
			edges.geometry.getAttribute('instanceStart').data.needsUpdate = true;
		}
		if (line.geometry !== edges.geometry) line.geometry = edges.geometry;
		if (line.parent !== board.parts) board.parts.add(line);
		const canvas = renderer.domElement;
		material.resolution.set(canvas.clientWidth || 1, canvas.clientHeight || 1);
		line.visible = true;
		return true;
	}

	function partFromHit(hit) {
		const ids = hit.object.geometry?.userData?.part;
		if (!ids) return -1;
		const index = hit.face ? hit.face.a : hit.index;
		if (index == null || index < 0) return -1;
		return ids[index];
	}

	function update(x, y, camera) {
		pointer.set(x, y);
		raycaster.setFromCamera(pointer, camera);
		let best = null;
		for (const board of boards) {
			if (!board.group.visible || !board.parts.visible) continue;
			const hits = raycaster.intersectObject(board.parts, true);
			for (const hit of hits) {
				if (hit.object === line) continue;
				const id = partFromHit(hit);
				if (id < 0) continue;
				const lift = board.lifts[id]?.lift ?? 0;
				if (lift < 0.45) continue;
				const box = board.boxes[id];
				if (!box) continue;
				if (box.maxX - box.minX < 0.05 || box.maxY - box.minY < 0.05) continue;
				if (!best || hit.distance < best.distance) {
					best = { board, id, lift, distance: hit.distance };
				}
				break;
			}
		}
		if (!best) {
			hide();
			return false;
		}
		return show(best.board, best.id, best.lift);
	}

	function refresh() {
		hide();
		if (line.geometry !== scratch) line.geometry = scratch;
		for (const board of boards) {
			for (const edges of board.edges) {
				if (edges?.geometry && edges.geometry !== scratch) edges.geometry.dispose();
			}
			board.edges = collectEdges(board.group);
		}
	}

	function dispose() {
		hide();
		line.remove();
		const geometries = new Set();
		if (scratch) geometries.add(scratch);
		if (line.geometry) geometries.add(line.geometry);
		for (const board of boards) {
			for (const edges of board.edges) {
				if (edges?.geometry) geometries.add(edges.geometry);
			}
		}
		for (const geometry of geometries) geometry.dispose();
		material.dispose();
	}

	return { update, hide, refresh, dispose };
}
