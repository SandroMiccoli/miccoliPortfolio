import * as THREE from '../vendor/three.module.min.js';
import { mergeGeometries } from '../vendor/addons/utils/BufferGeometryUtils.js';
import { createLineBatch } from './batch.js';
import { markBloom } from './bloom.js';

/**
 * GEO communications satellite from the photo study: large cubic bus,
 * dish antenna on the front face, dual wings of four rectangles plus a
 * trapezoid yoke with a rounded-corner hole, and the drafting sheet.
 */
export function createSatellite() {
	const technology = new THREE.Group();
	technology.name = 'Satellite hologram';
	const lines = createLineBatch();
	const sheetLines = createLineBatch();
	const boxes = [];
	const facets = [];
	const spheres = [];
	const _a = new THREE.Vector3();
	const _b = new THREE.Vector3();

	const CYAN = 0x62c9ff;
	const BLUE = 0x49a9ed;
	const VIOLET = 0xb79ae6;
	const GREEN = 0x1fc283;

	const CUBE = 2.12;
	const HALF = CUBE / 2;
	const DISH_R = 1.08;
	const DISH_DEPTH = 0.55;
	const DISH_Z = HALF + 0.12;
	const SUB_R = 0.24;
	const SUB_Z = DISH_Z + 0.52;
	const PANEL_W = 0.86;
	const PANEL_D = 2.12;
	const PANEL_GAP = 0.04;
	const TRAP_W = 1.2;
	const TRAP_INNER_H = PANEL_D * 0.78;
	const TRAP_FRAME = 0.12;
	const TRAP_CORNER = 0.26;

	function addEdges(geometry, color, opacity) {
		const edges = new THREE.EdgesGeometry(geometry);
		const position = edges.attributes.position;
		for (let i = 0; i < position.count; i += 2) {
			_a.fromBufferAttribute(position, i);
			_b.fromBufferAttribute(position, i + 1);
			lines.add([_a.clone(), _b.clone()], color, opacity);
		}
		edges.dispose();
	}

	function modelBox(x, y, z, w, d, h, color = CYAN, opacity = 0.75) {
		const geometry = new THREE.BoxGeometry(w, d, h);
		geometry.translate(x, y, z);
		addEdges(geometry, color, opacity);
		boxes.push(geometry);
	}

	function keepFacet(geometry, color, opacity = 0.8, withEdges = true) {
		if (withEdges) addEdges(geometry, color, opacity);
		facets.push(geometry);
	}

	function ml(points, color = CYAN, opacity = 0.5) {
		lines.add(points.map((point) => new THREE.Vector3(point[0], point[1], point[2])), color, opacity);
	}

	function sl(points, color = CYAN, opacity = 0.5) {
		sheetLines.add(points.map((point) => new THREE.Vector3(point[0], point[1], point[2])), color, opacity);
	}

	function ring(cx, cy, cz, rx, ry, segs, color, opacity) {
		const pts = [];
		for (let i = 0; i <= segs; i++) {
			const a = (i / segs) * Math.PI * 2;
			pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, cz]);
		}
		ml(pts, color, opacity);
	}

	function dishPt(phi, t) {
		const r = t * DISH_R;
		return [Math.cos(phi) * r, Math.sin(phi) * r, DISH_Z - DISH_DEPTH * t * t];
	}

	function frame(x, y, z, w, d, t, h, color) {
		modelBox(x, y + (d - t) / 2, z, w, t, h, color, 0.85);
		modelBox(x, y - (d - t) / 2, z, w, t, h, color, 0.85);
		modelBox(x - (w - t) / 2, y, z, t, d - 2 * t, h, color, 0.85);
		modelBox(x + (w - t) / 2, y, z, t, d - 2 * t, h, color, 0.85);
	}

	function roundedRectPath(cx, cy, w, h, r) {
		const path = new THREE.Path();
		const hw = w / 2;
		const hh = h / 2;
		r = Math.min(r, hw - 0.01, hh - 0.01);
		path.moveTo(cx - hw + r, cy - hh);
		path.lineTo(cx + hw - r, cy - hh);
		path.absarc(cx + hw - r, cy - hh + r, r, -Math.PI / 2, 0, false);
		path.lineTo(cx + hw, cy + hh - r);
		path.absarc(cx + hw - r, cy + hh - r, r, 0, Math.PI / 2, false);
		path.lineTo(cx - hw + r, cy + hh);
		path.absarc(cx - hw + r, cy + hh - r, r, Math.PI / 2, Math.PI, false);
		path.lineTo(cx - hw, cy - hh + r);
		path.absarc(cx - hw + r, cy - hh + r, r, Math.PI, Math.PI * 1.5, false);
		return path;
	}

	function roundedRectPts(cx, cy, cz, w, h, r, segs = 5) {
		const hw = w / 2;
		const hh = h / 2;
		r = Math.min(r, hw - 0.01, hh - 0.01);
		const corners = [
			[cx + hw - r, cy - hh + r, -Math.PI / 2, 0],
			[cx + hw - r, cy + hh - r, 0, Math.PI / 2],
			[cx - hw + r, cy + hh - r, Math.PI / 2, Math.PI],
			[cx - hw + r, cy - hh + r, Math.PI, Math.PI * 1.5],
		];
		const pts = [];
		for (const [x, y, a0, a1] of corners) {
			for (let i = 0; i <= segs; i++) {
				const a = a0 + (a1 - a0) * (i / segs);
				pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r, cz]);
			}
		}
		pts.push(pts[0]);
		return pts;
	}

	function addYoke(side) {
		const shape = new THREE.Shape();
		shape.moveTo(0, -TRAP_INNER_H / 2);
		shape.lineTo(TRAP_W, -PANEL_D / 2);
		shape.lineTo(TRAP_W, PANEL_D / 2);
		shape.lineTo(0, TRAP_INNER_H / 2);
		shape.closePath();

		const holeW = TRAP_W - TRAP_FRAME * 2;
		const holeH = TRAP_INNER_H - TRAP_FRAME * 1.15;
		shape.holes.push(roundedRectPath(TRAP_W / 2, 0, holeW, holeH, TRAP_CORNER));

		const geo = new THREE.ExtrudeGeometry(shape, {
			depth: 0.045,
			bevelEnabled: false,
			steps: 1,
			curveSegments: 10,
		});
		geo.translate(0, 0, -0.022);
		if (side < 0) geo.scale(-1, 1, 1);
		geo.translate(side * HALF, 0, 0);
		keepFacet(geo, CYAN, 0.9, false);

		const x0 = side * HALF;
		const x1 = side * (HALF + TRAP_W);
		ml([
			[x0, -TRAP_INNER_H / 2, 0.03],
			[x1, -PANEL_D / 2, 0.03],
			[x1, PANEL_D / 2, 0.03],
			[x0, TRAP_INNER_H / 2, 0.03],
			[x0, -TRAP_INNER_H / 2, 0.03],
		], CYAN, 0.95);

		const holePts = roundedRectPts(
			side * (HALF + TRAP_W / 2),
			0,
			0.03,
			holeW,
			holeH,
			TRAP_CORNER,
			6,
		);
		ml(holePts, CYAN, 0.95);
	}

	// --- cubic bus ---
	modelBox(0, 0, 0, CUBE, CUBE, CUBE, CYAN);
	for (const axis of ['x', 'y', 'z']) {
		for (let i = 1; i < 4; i++) {
			const t = -HALF + (CUBE * i) / 4;
			if (axis === 'x') {
				ml([[t, -HALF, HALF + 0.01], [t, HALF, HALF + 0.01]], BLUE, 0.22);
				ml([[t, HALF + 0.01, -HALF], [t, HALF + 0.01, HALF]], BLUE, 0.18);
			} else if (axis === 'y') {
				ml([[-HALF, t, HALF + 0.01], [HALF, t, HALF + 0.01]], BLUE, 0.22);
			}
		}
	}

	const bits = [
		[0.32, HALF + 0.05, -0.22, 0.36, 0.1, 0.28],
		[-0.38, HALF + 0.05, 0.18, 0.26, 0.1, 0.22],
		[0.28, 0.32, -HALF - 0.06, 0.4, 0.32, 0.12],
		[-0.3, -0.28, -HALF - 0.06, 0.34, 0.28, 0.12],
		[-HALF - 0.05, 0.36, -0.22, 0.1, 0.28, 0.24],
		[HALF + 0.05, -0.34, -0.2, 0.1, 0.26, 0.22],
		[0.3, -HALF - 0.05, 0.12, 0.32, 0.1, 0.26],
		[-0.28, -HALF - 0.05, -0.18, 0.3, 0.1, 0.22],
	];
	for (const [x, y, z, w, d, h] of bits) {
		modelBox(x, y, z, w, d, h, CYAN, 0.7);
	}

	const mast = new THREE.CylinderGeometry(0.03, 0.03, 0.85, 8);
	mast.translate(0.2, HALF + 0.42, -0.15);
	keepFacet(mast, CYAN, 0.9);

	const mastCap = new THREE.CylinderGeometry(0.07, 0.04, 0.12, 8);
	mastCap.translate(0.2, HALF + 0.88, -0.15);
	keepFacet(mastCap, BLUE, 0.85);

	const topSensor = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 12);
	topSensor.translate(-0.35, HALF + 0.08, 0.2);
	keepFacet(topSensor, GREEN, 0.7);

	for (const side of [-1, 1]) {
		const nozzle = new THREE.ConeGeometry(0.1, 0.18, 10, 1);
		nozzle.rotateX(Math.PI);
		nozzle.translate(side * 0.45, -0.5, -HALF - 0.08);
		keepFacet(nozzle, BLUE, 1);
	}

	// --- dish antenna on the cube face ---
	const dishProfile = [];
	for (let i = 0; i <= 8; i++) {
		const t = i / 8;
		dishProfile.push(new THREE.Vector2(t * DISH_R, -DISH_DEPTH * t * t));
	}
	const dish = new THREE.LatheGeometry(dishProfile, 32);
	dish.rotateX(Math.PI / 2);
	dish.translate(0, 0, DISH_Z);
	keepFacet(dish, CYAN, 0.3, false);

	const rim = new THREE.TorusGeometry(DISH_R, 0.028, 8, 48);
	rim.translate(0, 0, DISH_Z);
	keepFacet(rim, CYAN, 0.95);

	ring(0, 0, DISH_Z, DISH_R, DISH_R, 64, CYAN, 0.95);
	for (const t of [0.22, 0.4, 0.58, 0.76, 0.92]) {
		const r = DISH_R * t;
		ring(0, 0, DISH_Z - DISH_DEPTH * t * t, r, r, 40, BLUE, t === 0.92 ? 0.55 : 0.32);
	}

	for (let i = 0; i < 12; i++) {
		const phi = (i / 12) * Math.PI * 2;
		const rib = [];
		for (let k = 0; k <= 12; k++) rib.push(dishPt(phi, k / 12));
		ml(rib, BLUE, i % 4 === 0 ? 0.5 : 0.18);
	}

	const goreOffset = -Math.PI / 2;
	for (let g = 0; g < 3; g++) {
		const phi = goreOffset + (g / 3) * Math.PI * 2;
		const rib = [];
		for (let i = 0; i <= 12; i++) rib.push(dishPt(phi, i / 12));
		ml(rib, VIOLET, 0.95);
	}

	function strut(ax, ay, az, bx, by, bz, radius, color) {
		const dx = bx - ax;
		const dy = by - ay;
		const dz = bz - az;
		const len = Math.hypot(dx, dy, dz);
		const geo = new THREE.CylinderGeometry(radius, radius, len, 6);
		geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(
			new THREE.Vector3(0, 1, 0),
			new THREE.Vector3(dx, dy, dz).normalize(),
		));
		geo.translate((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
		keepFacet(geo, color, 0.95);
		ml([[ax, ay, az], [bx, by, bz]], color, 0.95);
	}

	const disk = new THREE.CylinderGeometry(SUB_R, SUB_R, 0.045, 24);
	disk.rotateX(Math.PI / 2);
	disk.translate(0, 0, SUB_Z);
	keepFacet(disk, CYAN, 0.95);
	ring(0, 0, SUB_Z + 0.025, SUB_R, SUB_R, 28, GREEN, 0.95);
	ring(0, 0, SUB_Z + 0.025, SUB_R * 0.42, SUB_R * 0.42, 18, GREEN, 0.9);

	const horn = new THREE.CylinderGeometry(0.05, 0.08, 0.08, 10);
	horn.rotateX(Math.PI / 2);
	horn.translate(0, 0, SUB_Z - 0.05);
	keepFacet(horn, GREEN, 0.85);

	for (let g = 0; g < 3; g++) {
		const phi = goreOffset + (g / 3) * Math.PI * 2 + Math.PI / 3;
		const from = dishPt(phi, 0.97);
		strut(
			from[0], from[1], from[2],
			Math.cos(phi) * SUB_R * 0.88,
			Math.sin(phi) * SUB_R * 0.88,
			SUB_Z,
			0.02,
			CYAN,
		);
	}

	// --- wings: 4 rectangles, then the perforated trapezoid ---
	for (const side of [-1, 1]) {
		addYoke(side);
		const inner = HALF + TRAP_W + 0.02;
		for (let panel = 0; panel < 4; panel++) {
			const x = side * (inner + PANEL_W / 2 + panel * (PANEL_W + PANEL_GAP));
			modelBox(x, 0, 0, PANEL_W, PANEL_D, 0.035, CYAN);
			frame(x, 0, 0.012, PANEL_W, PANEL_D, 0.03, 0.016, BLUE);

			const cols = 3;
			const rows = 8;
			const insetX = PANEL_W * 0.08;
			const insetY = PANEL_D * 0.055;
			for (let c = 0; c <= cols; c++) {
				const px = x - PANEL_W / 2 + insetX + c * ((PANEL_W - insetX * 2) / cols);
				ml(
					[[px, -PANEL_D / 2 + insetY, 0.03], [px, PANEL_D / 2 - insetY, 0.03]],
					c === 0 || c === cols ? BLUE : GREEN,
					c === 0 || c === cols ? 0.55 : 0.45,
				);
			}
			for (let r = 1; r < rows; r++) {
				const py = -PANEL_D / 2 + insetY + r * ((PANEL_D - insetY * 2) / rows);
				ml(
					[[x - PANEL_W / 2 + insetX, py, 0.03], [x + PANEL_W / 2 - insetX, py, 0.03]],
					GREEN,
					0.4,
				);
			}

			if (panel < 3) {
				const hx = x + side * (PANEL_W / 2 + PANEL_GAP / 2);
				modelBox(hx, 0.55, 0, 0.035, 0.07, 0.05, BLUE, 0.7);
				modelBox(hx, -0.55, 0, 0.035, 0.07, 0.05, BLUE, 0.7);
			}
		}
	}

	function meshFrom(geometries, material) {
		if (!geometries.length) return null;
		const merged = mergeGeometries(geometries.filter(Boolean));
		for (const geometry of geometries) geometry.dispose();
		if (!merged) return null;
		return new THREE.Mesh(merged, material);
	}

	const craft = new THREE.Group();
	craft.name = 'satellite-craft';
	craft.position.set(0, 0.15, 7.55);
	craft.rotation.set(0.86, 0.28, 0.04);

	const bodyMesh = meshFrom(boxes, new THREE.MeshBasicMaterial({
		color: 0x071522,
		transparent: true,
		opacity: 0.55,
	}));
	const facetMesh = meshFrom(facets, new THREE.MeshBasicMaterial({
		color: 0x081421,
		transparent: true,
		opacity: 0.52,
		side: THREE.DoubleSide,
	}));
	const sphereMesh = meshFrom(spheres, new THREE.MeshBasicMaterial({
		color: 0x122636,
		transparent: true,
		opacity: 0.7,
	}));

	craft.add(...[bodyMesh, facetMesh, sphereMesh, lines.build()].filter(Boolean));
	technology.add(craft);

	const sheetZ = 5.95;
	const width = 11.2;
	const depth = 4.3;
	for (let x = -width / 2; x <= width / 2 + 0.01; x += 0.5) {
		sl([[x, -depth / 2, sheetZ], [x, depth / 2, sheetZ]], CYAN, 0.115);
	}
	for (let y = -depth / 2; y <= depth / 2 + 0.01; y += 0.5) {
		sl([[-width / 2, y, sheetZ], [width / 2, y, sheetZ]], CYAN, 0.115);
	}
	sl([
		[-width / 2, -depth / 2, sheetZ],
		[width / 2, -depth / 2, sheetZ],
		[width / 2, depth / 2, sheetZ],
		[-width / 2, depth / 2, sheetZ],
		[-width / 2, -depth / 2, sheetZ],
	], CYAN, 0.3);
	sl([
		[-width / 2, -depth / 2 - 0.05, sheetZ],
		[-width / 2, -depth / 2 - 0.6, sheetZ],
		[width / 2, -depth / 2 - 0.6, sheetZ],
		[width / 2, -depth / 2 - 0.05, sheetZ],
	], CYAN, 0.3);
	for (const x of [-width / 2, width / 2]) {
		sl([[x - 0.08, -depth / 2 - 0.52, sheetZ], [x + 0.08, -depth / 2 - 0.68, sheetZ]], CYAN, 0.6);
	}
	technology.add(sheetLines.build());

	markBloom(technology);
	return technology;
}
