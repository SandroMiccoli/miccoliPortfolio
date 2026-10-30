import * as THREE from '../vendor/three.module.min.js';
import { createHologramBatch, createLineBatch } from './batch.js';
import { markBloom } from './bloom.js';
import { ARM_PIVOT, ARM_SCALE } from './constants.js';

const _up = new THREE.Vector3(0, 1, 0);
const _zAxis = new THREE.Vector3(0, 0, 1);
const _dir = new THREE.Vector3();
const _quat = new THREE.Quaternion();

/**
 * Industrial arm, drawn as one hologram fill and one edge pass.
 * fade runs from the plinth (0) to the gripper (1). The group scale
 * matches the reference: geometry stays in local units, then grows
 * around the plinth.
 */
export function createArm() {
	const technology = new THREE.Group();
	technology.name = 'Industrial arm hologram';
	const hologram = createHologramBatch();
	const lines = createLineBatch({ fadeFloor: 0.12 });

	function hcyl(x, y, z, radius, height, axis, fade) {
		_quat.setFromUnitVectors(_up, axis === 'z' ? _zAxis : _up);
		hologram.cylinder(radius, height, x, y, z, _quat, 16, fade);
	}

	function link(a, b, width, depth, fade) {
		const dx = b[0] - a[0];
		const dy = b[1] - a[1];
		const dz = b[2] - a[2];
		const len = Math.hypot(dx, dy, dz);
		_dir.set(dx / len, dy / len, dz / len);
		_quat.setFromUnitVectors(_up, _dir);
		hologram.box(width, len, depth, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, _quat, fade);
	}

	hologram.box(1.7, 1.35, 0.18, -0.75, 0, 5.2, null, 0);
	hcyl(-0.75, 0, 5.52, 0.55, 0.5, 'z', 0.06);
	hcyl(-0.75, 0, 5.96, 0.42, 0.55, 'y', 0.12);

	const shoulder = [-0.75, 0, 5.98];
	const elbow = [-1.8, 0, 8.05];
	const wrist = [0.85, 0, 8.45];
	const tool = [1.55, 0, 7.8];

	link(shoulder, elbow, 0.62, 0.55, 0.28);
	hcyl(elbow[0], elbow[1], elbow[2], 0.4, 0.69, 'y', 0.4);
	link(elbow, wrist, 0.45, 0.43, 0.55);
	hcyl(wrist[0], wrist[1], wrist[2], 0.28, 0.55, 'y', 0.72);
	link(wrist, tool, 0.29, 0.29, 0.84);
	hcyl(tool[0], tool[1], tool[2], 0.22, 0.38, 'y', 0.92);
	hologram.box(0.55, 0.55, 0.2, 1.57, 0, 7.58, null, 1);
	link([1.35, -0.22, 7.52], [1.35, -0.22, 7.05], 0.09, 0.1, 1);
	link([1.8, -0.22, 7.52], [1.8, -0.22, 7.05], 0.09, 0.1, 1);
	link([1.35, -0.22, 7.05], [1.48, -0.22, 7.05], 0.09, 0.1, 1);
	link([1.8, -0.22, 7.05], [1.67, -0.22, 7.05], 0.09, 0.1, 1);

	for (const radius of [1.1, 1.35]) {
		const ring = [];
		for (let i = 0; i <= 64; i++) {
			const a = (i / 64) * Math.PI * 2;
			ring.push(new THREE.Vector3(-0.75 + Math.cos(a) * radius, Math.sin(a) * radius, 5.08));
		}
		lines.add(ring, 'models.wire', 0.4, 0.15);
	}

	for (const [x, y, z, radius, fade] of [
		[-0.75, 0, 5.96, 0.42, 0.14],
		[-1.8, 0, 8.05, 0.4, 0.42],
		[0.85, 0, 8.45, 0.28, 0.74],
		[1.55, 0, 7.8, 0.22, 0.94],
	]) {
		for (const face of [-1, 1]) {
			hcyl(x, y + face * 0.38, z, radius * 0.76, 0.07, 'y', fade);
			hcyl(x, y + face * 0.43, z, radius * 0.38, 0.06, 'y', fade);
			for (let j = 0; j < 6; j++) {
				const a = (j / 6) * Math.PI * 2;
				hcyl(
					x + Math.cos(a) * radius * 0.57,
					y + face * 0.43,
					z + Math.sin(a) * radius * 0.57,
					0.025,
					0.04,
					'y',
					fade,
				);
			}
		}
	}

	for (const [a, b, width, fade] of [[shoulder, elbow, 0.62, 0.3], [elbow, wrist, 0.45, 0.58]]) {
		for (const off of [-0.32, 0.32]) link([a[0], off, a[2]], [b[0], off, b[2]], 0.09, 0.09, fade);
		for (let j = 1; j < 5; j++) {
			const t = j / 5;
			hologram.box(
				width * 0.85,
				0.06,
				0.1,
				a[0] + (b[0] - a[0]) * t,
				-0.3,
				a[2] + (b[2] - a[2]) * t,
				null,
				fade,
			);
		}
	}

	for (const off of [-0.42, 0.42]) {
		const cable = new THREE.CatmullRomCurve3([
			new THREE.Vector3(-0.75, off, 5.6),
			new THREE.Vector3(-2.22, off, 7.7),
			new THREE.Vector3(-1.8, off, 8.5),
			new THREE.Vector3(0.85, off, 8.75),
			new THREE.Vector3(1.55, off, 7.8),
		]);
		const points = cable.getPoints(100);
		const fade = points.map((_, index) => index / (points.length - 1));
		lines.add(points, 'models.violet', 0.75, fade);
	}

	const body = hologram.build();
	const overlay = lines.build();
	markBloom(body);
	markBloom(overlay);
	technology.add(body, overlay);
	technology.scale.setScalar(ARM_SCALE);
	technology.position.set(
		ARM_PIVOT.x * (1 - ARM_SCALE),
		ARM_PIVOT.y * (1 - ARM_SCALE),
		ARM_PIVOT.z * (1 - ARM_SCALE),
	);
	return technology;
}
