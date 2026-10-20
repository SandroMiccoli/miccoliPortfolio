import * as THREE from 'three';
import { createLineBatch } from './batch.js';
import { LAYER_Z } from './constants.js';

export function createIntelligence() {
	const group = new THREE.Group();
	group.name = 'AI intelligence';
	const grid = createLineBatch();

	for (const sx of [-1, 1]) {
		for (const sy of [-1, 1]) {
			const x = sx * 3.3;
			const y = sy * 1.65;
			grid.add([
				new THREE.Vector3(x - sx * 0.6, y, LAYER_Z),
				new THREE.Vector3(x, y, LAYER_Z),
				new THREE.Vector3(x, y - sy * 0.45, LAYER_Z),
			], 0x49a9ed, 0.36);
		}
	}
	for (let x = -3; x <= 3; x += 0.5) {
		grid.add([
			new THREE.Vector3(x, -1.5, LAYER_Z),
			new THREE.Vector3(x, 1.5, LAYER_Z),
		], 0x49a9ed, 0.065);
	}
	for (let y = -1.5; y <= 1.5; y += 0.5) {
		grid.add([
			new THREE.Vector3(-3, y, LAYER_Z),
			new THREE.Vector3(3, y, LAYER_Z),
		], 0x49a9ed, 0.065);
	}

	group.add(grid.build());
	return { group };
}
