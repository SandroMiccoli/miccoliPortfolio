import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createLineBatch } from './batch.js';
import { markBloom } from './bloom.js';

/**
 * Low-profile communications satellite from the R2 study: octagonal bus,
 * phased array, solar wings, optical terminals, and the drafting sheet.
 * The PCB is not part of this model.
 */
export function createSatellite() {
	const technology = new THREE.Group();
	technology.name = 'Satellite hologram';
	const lines = createLineBatch();
	const boxes = [];
	const facets = [];
	const spheres = [];
	const _a = new THREE.Vector3();
	const _b = new THREE.Vector3();

	function addEdges(geometry, color, opacity) {
		const edges = new THREE.EdgesGeometry(geometry);
		const position = edges.attributes.position;
		for (let i = 0; i < position.count; i += 2) {
			_a.fromBufferAttribute(position, i);
			_b.fromBufferAttribute(position, i + 1);
			lines.add([_a, _b], color, opacity);
		}
		edges.dispose();
	}

	function modelBox(x, y, z, w, d, h, color = 0x62c9ff) {
		const geometry = new THREE.BoxGeometry(w, d, h);
		geometry.translate(x, y, z);
		addEdges(geometry, color, 0.75);
		boxes.push(geometry);
	}

	function ml(points, color = 0x62c9ff, opacity = 0.5) {
		lines.add(points.map((point) => new THREE.Vector3(point[0], point[1], point[2])), color, opacity);
	}

	function facet(radius, height, z, color) {
		const geometry = new THREE.CylinderGeometry(radius, radius, height, 8);
		geometry.rotateX(Math.PI / 2);
		geometry.translate(0, 0, z);
		addEdges(geometry, color, 0.8);
		facets.push(geometry);
	}

	facet(1.12, 0.55, 7.65, 0xb79ae6);
	facet(0.91, 0.06, 7.96, 0x62c9ff);

	for (let x = -0.6; x <= 0.61; x += 0.2) {
		for (let y = -0.6; y <= 0.61; y += 0.2) {
			if (x * x + y * y < 0.56) modelBox(x, y, 8.01, 0.11, 0.11, 0.025, 0x1fc283);
		}
	}

	for (const side of [-1, 1]) {
		ml([[side * 0.98, 0, 7.6], [side * 1.65, 0, 7.6]], 0xe4cc74, 0.8);
		for (let panel = 0; panel < 3; panel++) {
			const x = side * (2.1 + panel * 1.25);
			modelBox(x, 0, 7.6, 1.18, 2.15, 0.025);
			for (let j = 1; j < 10; j++) {
				ml([[x - 0.57, -1.06 + j * 0.214, 7.62], [x + 0.57, -1.06 + j * 0.214, 7.62]], 0x49a9ed, 0.4);
			}
			for (let j = 1; j < 5; j++) {
				ml([[x - 0.59 + j * 0.236, -1.06, 7.62], [x - 0.59 + j * 0.236, 1.06, 7.62]], 0x49a9ed, 0.4);
			}
		}
		for (let j = 0; j < 8; j++) {
			ml([[side * 0.85, -0.52 + j * 0.15, 7.4], [side * 1.02, -0.52 + j * 0.15, 7.78]], 0xb79ae6, 0.5);
		}

		const ball = new THREE.SphereGeometry(0.18, 12, 8);
		ball.translate(side * 0.75, -0.65, 8.12);
		addEdges(ball, 0x62c9ff, 0.6);
		spheres.push(ball);

		const nozzle = new THREE.ConeGeometry(0.16, 0.26, 12, 1);
		nozzle.rotateX(Math.PI / 2);
		nozzle.translate(side * 0.55, 0.6, 7.24);
		addEdges(nozzle, 0xe4cc74, 1);
		nozzle.dispose();
	}

	ml([[0, 0.6, 7.98], [0, 0.9, 8.35], [0.25, 0.9, 8.35]], 0xe4cc74, 0.7);

	const sheetZ = 5.95;
	const width = 10;
	const depth = 4;
	for (let x = -width / 2; x <= width / 2 + 0.01; x += 0.5) {
		ml([[x, -depth / 2, sheetZ], [x, depth / 2, sheetZ]], 0x62c9ff, 0.115);
	}
	for (let y = -depth / 2; y <= depth / 2 + 0.01; y += 0.5) {
		ml([[-width / 2, y, sheetZ], [width / 2, y, sheetZ]], 0x62c9ff, 0.115);
	}
	ml([
		[-width / 2, -depth / 2, sheetZ],
		[width / 2, -depth / 2, sheetZ],
		[width / 2, depth / 2, sheetZ],
		[-width / 2, depth / 2, sheetZ],
		[-width / 2, -depth / 2, sheetZ],
	], 0x62c9ff, 0.3);
	ml([
		[-width / 2, -depth / 2 - 0.05, sheetZ],
		[-width / 2, -depth / 2 - 0.6, sheetZ],
		[width / 2, -depth / 2 - 0.6, sheetZ],
		[width / 2, -depth / 2 - 0.05, sheetZ],
	], 0x62c9ff, 0.3);
	for (const x of [-width / 2, width / 2]) {
		ml([[x - 0.08, -depth / 2 - 0.52, sheetZ], [x + 0.08, -depth / 2 - 0.68, sheetZ]], 0x62c9ff, 0.6);
	}

	function meshFrom(geometries, material) {
		const merged = mergeGeometries(geometries);
		for (const geometry of geometries) geometry.dispose();
		return new THREE.Mesh(merged, material);
	}

	technology.add(
		meshFrom(boxes, new THREE.MeshBasicMaterial({ color: 0x071522, transparent: true, opacity: 0.55 })),
		meshFrom(facets, new THREE.MeshBasicMaterial({ color: 0x081421, transparent: true, opacity: 0.6 })),
		meshFrom(spheres, new THREE.MeshBasicMaterial({ color: 0x122636 })),
		lines.build(),
	);

	function label(text, x, y) {
		const canvas = document.createElement('canvas');
		canvas.width = text.length * 22 + 16;
		canvas.height = 64;
		const context = canvas.getContext('2d');
		context.fillStyle = '#79b5d0';
		context.font = '36px monospace';
		context.fillText(text, 8, 46);
		const texture = new THREE.CanvasTexture(canvas);
		texture.colorSpace = THREE.SRGBColorSpace;
		const mesh = new THREE.Mesh(
			new THREE.PlaneGeometry(canvas.width * 0.0038, 0.2432),
			new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0.85 }),
		);
		mesh.position.set(x, y, sheetZ + 0.01);
		technology.add(mesh);
	}

	label('CM / LEO COMMUNICATIONS', 0, depth / 2 + 0.25);
	label('SOLAR + PHASED ARRAY / CONCEPT / NTS', 0, -depth / 2 - 0.3);

	markBloom(technology);
	return technology;
}
