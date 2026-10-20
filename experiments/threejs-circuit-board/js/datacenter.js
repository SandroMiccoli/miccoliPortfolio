import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createLineBatch } from './batch.js';
import { markBloom } from './bloom.js';

/**
 * Six-rack compute cluster from the R2 study: chassis, trays, rails,
 * ports, the overhead network, and the drafting sheet.
 * The PCB is not part of this model.
 */
export function createDataCenter() {
	const technology = new THREE.Group();
	technology.name = 'Data center hologram';
	const lines = createLineBatch();
	const boxes = [];
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

	modelBox(0, 0, 6.1, 7, 4.4, 0.1);
	for (let row = 0; row < 2; row++) {
		for (let col = 0; col < 3; col++) {
			const x = (col - 1) * 2;
			const y = (row - 0.5) * 2.2;
			modelBox(x, y, 7.55, 1.4, 1.5, 2.8);
			for (let j = 0; j < 9; j++) {
				const z = 6.35 + j * 0.28;
				modelBox(x, y - 0.77, z, 1.2, 0.06, 0.2);
				for (let k = 0; k < 4; k++) {
					ml([
						[x - 0.44 + k * 0.15, y - 0.815, z],
						[x - 0.37 + k * 0.15, y - 0.815, z],
					], 0x1fc283, 0.8);
				}
			}
			ml([[x, y, 8.98], [x, y, 9.3], [0, y, 9.3], [0, 0, 9.3]], 0x1fc283, 0.6);
		}
	}

	for (let row = 0; row < 2; row++) {
		for (let col = 0; col < 3; col++) {
			const x = (col - 1) * 2;
			const y = (row - 0.5) * 2.2;
			for (const dx of [-0.65, 0.65]) {
				modelBox(x + dx, y - 0.82, 7.55, 0.045, 0.08, 2.7);
				for (let j = 0; j < 20; j++) {
					modelBox(x + dx, y - 0.87, 6.3 + j * 0.13, 0.022, 0.02, 0.022);
				}
			}
			for (let unit = 0; unit < 4; unit++) {
				const z = 6.55 + unit * 0.57;
				modelBox(x, y - 0.85, z, 1.2, 0.08, 0.48);
				for (const dx of [-0.55, 0.55]) {
					modelBox(x + dx, y - 0.94, z, 0.035, 0.07, 0.27, 0xe4cc74);
				}
				for (let j = 0; j < 12; j++) {
					ml([
						[x - 0.45 + j * 0.08, y - 0.9, z - 0.17],
						[x - 0.45 + j * 0.08, y - 0.9, z + 0.17],
					], 0x49a9ed, 0.4);
				}
				for (let k = 0; k < 4; k++) {
					modelBox(x - 0.35 + k * 0.22, y - 0.93, z + 0.13, 0.13, 0.025, 0.05, 0x1fc283);
				}
			}
			for (let k = 0; k < 12; k++) {
				modelBox(x - 0.53 + k * 0.095, y - 0.9, 8.75, 0.055, 0.04, 0.06, 0x1fc283);
			}
			ml([
				[x + 0.7, y + 0.6, 6.2],
				[x + 0.7, y + 0.6, 9.1],
				[x + 0.7, 0, 9.1],
				[0, 0, 9.1],
			], 0xb79ae6, 0.55);
		}
	}

	const sheetZ = 5.95;
	const width = 8;
	const depth = 5;
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

	const merged = mergeGeometries(boxes);
	for (const geometry of boxes) geometry.dispose();
	technology.add(
		new THREE.Mesh(merged, new THREE.MeshBasicMaterial({ color: 0x071522, transparent: true, opacity: 0.55 })),
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

	label('CM / COMPUTE CLUSTER', 0, depth / 2 + 0.25);
	label('DGX-INSPIRED / 06 RACKS / REV 5.2 / NTS', 0, -depth / 2 - 0.3);

	markBloom(technology);
	return technology;
}
