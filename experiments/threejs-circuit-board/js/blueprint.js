import * as THREE from 'three';
import { createLineBatch } from './batch.js';
import { BLUEPRINT_SCALE_X, BLUEPRINT_SCALE_Y, BLUEPRINT_Z } from './constants.js';

/**
 * Aircraft plan drawing. Coordinates are the unscaled draft; the group
 * stretches them onto the intelligence plane.
 */
export function createBlueprint() {
	const technology = new THREE.Group();
	technology.name = 'Airplane blueprint hologram';
	const lines = createLineBatch();

	function ink(points, opacity = 0.72, color = 0x62c9ff, z = BLUEPRINT_Z) {
		lines.add(points.map(([x, y]) => new THREE.Vector3(x, y, z)), color, opacity);
	}

	function mirrored(points, opacity = 0.72) {
		ink(points, opacity);
		ink(points.map(([x, y]) => [-x, y]), opacity);
	}

	mirrored([
		[0, 3.65], [0.18, 3.48], [0.33, 3.12], [0.43, 2.55], [0.43, 0.95],
		[1.05, 0.55], [3.45, -0.62], [3.5, -1.04], [1, -0.35], [0.4, -0.35],
		[0.32, -2.15], [1.36, -2.7], [1.4, -2.97], [0.24, -2.64], [0.12, -3.2], [0, -3.34],
	], 0.9);
	ink([[0, -3.34], [0, 3.65]], 0.25);
	mirrored([[0.08, 3.2], [0.25, 3], [0.3, 2.7], [0.07, 2.82]], 0.6);
	mirrored([[0.46, 0.7], [3.15, -0.65], [1, -0.15], [0.43, 0.16]], 0.4);
	mirrored([[1, -0.35], [1.6, -0.5], [2.25, -0.69], [3.45, -1.04]], 0.6);

	for (let i = 0; i < 8; i++) {
		const x = 0.65 + i * 0.34;
		mirrored([[x, 0.68 - (x - 0.43) * 0.43], [x, -0.23 - (x - 0.43) * 0.26]], 0.25);
	}
	for (let i = 0; i < 16; i++) {
		const y = -2.3 + i * 0.31;
		const w = y < -1.7 ? 0.28 : 0.4;
		ink([[-w, y], [w, y]], 0.2);
	}
	for (let i = 0; i < 10; i++) {
		const y = 2.2 - i * 0.35;
		for (const x of [-0.35, 0.35]) {
			ink([
				[x - 0.025, y - 0.045],
				[x + 0.025, y - 0.045],
				[x + 0.025, y + 0.045],
				[x - 0.025, y + 0.045],
				[x - 0.025, y - 0.045],
			], 0.6);
		}
	}

	for (const sign of [-1, 1]) {
		const x = sign * 1.3;
		ink([
			[x - 0.18, 0.5], [x + 0.18, 0.5], [x + 0.2, -0.45],
			[x + 0.12, -0.7], [x - 0.12, -0.7], [x - 0.2, -0.45], [x - 0.18, 0.5],
		], 0.85);
		for (const y of [0.38, 0.23, -0.4, -0.55]) ink([[x - 0.16, y], [x + 0.16, y]], 0.42);
	}

	mirrored([[0.18, -2.35], [1.22, -2.78], [0.22, -2.64]], 0.4);
	ink([[0, -1.75], [0.09, -2.65], [0, -3.25], [-0.09, -2.65], [0, -1.75]], 0.7);

	for (let x = -4; x <= 4; x += 0.5) ink([[x, -3.9], [x, 4]], 0.065);
	for (let y = -3.5; y <= 4; y += 0.5) ink([[-4, y], [4, y]], 0.065);
	for (const sx of [-1, 1]) {
		for (const sy of [-1, 1]) ink([[sx * 3.5, sy * 4], [sx * 4, sy * 4], [sx * 4, sy * 3.5]], 0.36);
	}
	ink([[-3.5, -1.25], [-3.5, -3.65], [3.5, -3.65], [3.5, -1.25]], 0.28);
	for (const x of [-3.5, 3.5]) ink([[x - 0.1, -3.55], [x + 0.1, -3.75]], 0.6);
	ink([[0.7, 3.65], [3.85, 3.65], [3.85, -3.34], [0.4, -3.34]], 0.28);
	for (const y of [-3.34, 3.65]) ink([[3.75, y - 0.1], [3.95, y + 0.1]], 0.6);

	function blueprintText(text, x, y, w) {
		const canvas = document.createElement('canvas');
		canvas.width = 1024;
		canvas.height = 80;
		const ctx = canvas.getContext('2d');
		ctx.fillStyle = '#69b9df';
		ctx.font = '28px monospace';
		ctx.fillText(text, 8, 48);
		const texture = new THREE.CanvasTexture(canvas);
		texture.colorSpace = THREE.SRGBColorSpace;
		const mesh = new THREE.Mesh(
			new THREE.PlaneGeometry(w, w * 80 / 1024),
			new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.7, depthWrite: false }),
		);
		mesh.position.set(x, y, BLUEPRINT_Z + 0.01);
		technology.add(mesh);
	}

	technology.add(lines.build());
	blueprintText('AIRCRAFT / PLAN VIEW', -1.9, 4.22, 4.2);
	blueprintText('CM—03   /   CONCEPT SCHEMATIC', 1.25, -4.2, 4.5);
	blueprintText('WING SPAN / DATUM A', 0, -3.85, 2.8);
	technology.scale.set(BLUEPRINT_SCALE_X, BLUEPRINT_SCALE_Y, 1);
	return technology;
}
