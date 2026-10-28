import * as THREE from '../vendor/three.module.min.js';
import { createLineBatch } from './batch.js';
import { markBloom } from './bloom.js';

/**
 * Volumetric 747-8I wireframe. Coordinates are metres, scaled onto the
 * same hologram height as the reference study.
 */
export function createPlane() {
	const technology = new THREE.Group();
	technology.name = 'Airplane hologram';
	const lines = createLineBatch();
	const scale = 0.135;
	const height = 6.65;

	function av(x, y, z) {
		return new THREE.Vector3((38.15 - y) * scale, x * scale, height + z * scale);
	}

	function al(points, opacity = 0.65, color = 0x62c9ff) {
		lines.add(points.map((point) => av(point[0], point[1], point[2])), color, opacity);
	}

	const sections = [
		[0, 0.03, 0, 0], [1, 0.8, 1, -0.3], [3, 2, 2, -0.1], [6, 2.9, 3.8, 0],
		[10, 3.25, 4.6, 0], [17, 3.25, 4.65, 0], [23, 3.25, 4.2, 0], [28, 3.25, 3.3, 0],
		[34, 3.25, 3.25, 0], [53, 3.25, 3.25, 0], [60, 3, 3, 0], [66, 2.4, 2.5, 0.2],
		[71, 1.5, 1.7, 0.6], [75, 0.4, 0.6, 1], [76.3, 0.02, 0.04, 1.15],
	];

	function section(y) {
		let i = 0;
		while (i < sections.length - 2 && sections[i + 1][0] < y) i++;
		const a = sections[i];
		const b = sections[i + 1];
		const t = (y - a[0]) / (b[0] - a[0]);
		const u = t * t * (3 - 2 * t);
		return a.map((value, k) => (k === 0 ? y : value + (b[k] - value) * u));
	}

	function body(y, angle) {
		const profile = section(y);
		const h = Math.sin(angle) > 0 ? profile[2] : Math.min(profile[1], 3.25);
		return [Math.cos(angle) * profile[1], y, profile[3] + Math.sin(angle) * h];
	}

	for (let y = 1; y < 76; y += 1.7) {
		const ring = [];
		for (let j = 0; j <= 48; j++) ring.push(body(y, (j / 48) * Math.PI * 2));
		al(ring, 0.22);
	}
	for (let j = 0; j < 20; j++) {
		const spine = [];
		for (let y = 0; y <= 76.3; y += 0.3) spine.push(body(y, (j / 20) * Math.PI * 2));
		al(spine, j % 5 === 0 ? 0.85 : 0.28);
	}

	const wingStations = [
		[2.7, 28, 18, -1], [7, 30.5, 14, -0.7], [13, 34, 10.5, -0.1],
		[21, 39.5, 7, 0.7], [29, 44.9, 3.7, 1.6], [34.2, 49, 1.1, 2.25],
	];

	function foil(sign, rows) {
		for (const [x, y, chord, z] of rows) {
			const pts = [];
			for (let j = 0; j <= 32; j++) {
				const u = (1 - Math.cos((j / 32) * Math.PI)) / 2;
				const h = chord * 0.1 * Math.sin(Math.PI * u) * Math.exp(-u);
				pts.push([sign * x, y + u * chord, z + h]);
			}
			for (let j = 32; j >= 0; j--) {
				const u = (1 - Math.cos((j / 32) * Math.PI)) / 2;
				pts.push([sign * x, y + u * chord, z - chord * 0.045 * Math.sin(Math.PI * u)]);
			}
			al(pts, 0.45);
		}
		for (const u of [0, 0.18, 0.4, 0.68, 0.82, 1]) {
			for (const side of [1, -1]) {
				al(rows.map(([x, y, chord, z]) => [
					sign * x,
					y + u * chord,
					z + (side === 1
						? chord * 0.1 * Math.sin(Math.PI * u) * Math.exp(-u)
						: -chord * 0.045 * Math.sin(Math.PI * u)),
				]), u === 0 || u === 1 ? 0.85 : 0.32);
			}
		}
	}

	for (const sign of [-1, 1]) {
		foil(sign, wingStations);
		foil(sign, [[1.8, 63, 8.5, 1.2], [6, 65.3, 6.3, 1.6], [11, 69, 3.8, 2], [15.2, 72, 1.3, 2.3]]);
		for (let x = 5; x < 29; x += 2) {
			let i = 0;
			while (i < wingStations.length - 2 && wingStations[i + 1][0] < x) i++;
			const a = wingStations[i];
			const b = wingStations[i + 1];
			const t = (x - a[0]) / (b[0] - a[0]);
			const y = a[1] + t * (b[1] - a[1]);
			const chord = a[2] + t * (b[2] - a[2]);
			const z = a[3] + t * (b[3] - a[3]);
			al([[sign * x, y + chord * 0.65, z + 0.2], [sign * x, y + chord, z]], 0.5);
		}
		for (const [x, y, z] of [[11.4, 29.8, -3.4], [21.3, 36.9, -2.5]]) {
			for (const [dy, r] of [[0, 1.45], [0.35, 1.6], [2, 1.65], [4.2, 1.25], [5.3, 0.85]]) {
				const ring = [];
				for (let j = 0; j <= 48; j++) {
					const angle = (j / 48) * Math.PI * 2;
					ring.push([sign * x + Math.cos(angle) * r, y + dy, z + Math.sin(angle) * r]);
				}
				al(ring, 0.6);
			}
			for (let j = 0; j < 18; j++) {
				const angle = (j / 18) * Math.PI * 2;
				al([
					[sign * x + Math.cos(angle) * 1.45, y, z + Math.sin(angle) * 1.45],
					[sign * x + Math.cos(angle) * 1.65, y + 2, z + Math.sin(angle) * 1.65],
					[sign * x + Math.cos(angle) * 1.25, y + 4.2, z + Math.sin(angle) * 1.25],
				], 0.25);
				al([
					[sign * x + Math.cos(angle) * 0.3, y + 0.15, z + Math.sin(angle) * 0.3],
					[sign * x + Math.cos(angle + 0.25) * 1.3, y + 0.25, z + Math.sin(angle + 0.25) * 1.3],
				], 0.6);
			}
			const rim = [];
			for (let j = 0; j <= 36; j++) {
				const angle = (j / 36) * Math.PI * 2;
				rim.push([sign * x + Math.cos(angle) * 1.15, y + 4.5 + (j % 2) * 0.35, z + Math.sin(angle) * 1.15]);
			}
			al(rim, 0.65);
			al([[sign * x, y + 2, z + 1.5], [sign * x, y + 3, -0.1], [sign * x, y + 7, 0], [sign * x, y + 5, z + 1]], 0.7);
		}
		for (const [begin, end, step, angle] of [[7, 64, 1.05, 0.3], [7.5, 23, 1.1, 0.94]]) {
			for (let y = begin; y < end; y += step) {
				const a = sign === 1 ? angle : Math.PI - angle;
				al([
					body(y, a - 0.035), body(y + 0.42, a - 0.035), body(y + 0.42, a + 0.035),
					body(y, a + 0.035), body(y, a - 0.035),
				], 0.6);
			}
		}
		for (const y of [7, 24, 38, 53, 63]) {
			const a = sign === 1 ? 0.15 : Math.PI - 0.15;
			al([
				body(y, a - 0.23), body(y + 1.15, a - 0.23), body(y + 1.15, a + 0.28),
				body(y, a + 0.28), body(y, a - 0.23),
			], 0.7);
		}
		al([
			[sign * 0.2, 4.5, 2.6], [sign * 1.25, 5.3, 3.05], [sign * 1.9, 6.5, 3.15],
			[sign * 1.8, 7.6, 3.65], [sign * 0.2, 6, 3.6], [sign * 0.2, 4.5, 2.6],
		], 0.95);
	}

	for (const x of [-0.22, 0.22]) al([[x, 57, 2.7], [x, 68, 12.4], [x, 72, 12.4], [x, 74, 1.4], [x, 57, 2.7]], 0.9);
	for (let z = 4; z < 12; z += 1.1) {
		al([
			[-0.22, 58 + (z - 3) * 1.05, z], [0.22, 58 + (z - 3) * 1.05, z],
			[0.22, 73 - (z - 3) * 0.13, z], [-0.22, 73 - (z - 3) * 0.13, z],
		], 0.25);
	}
	al([[0.23, 70, 12.4], [0.23, 72.3, 2]], 0.7);

	for (let x = -36; x <= 36; x += 4) al([[x, -3, -6], [x, 80, -6]], 0.115);
	for (let y = 0; y <= 80; y += 4) al([[-36, y, -6], [36, y, -6]], 0.115);
	al([[-34.2, 52, -6], [-34.2, 81, -6], [34.2, 81, -6], [34.2, 52, -6]], 0.3);
	for (const x of [-34.2, 34.2]) al([[x - 0.6, 80.4, -6], [x + 0.6, 81.6, -6]], 0.65);
	al([[-36, -3, -6], [36, -3, -6], [36, 84, -6], [-36, 84, -6], [-36, -3, -6]], 0.22);
	al([[4, 0, -6], [39, 0, -6], [39, 76.3, -6], [4, 76.3, -6]], 0.3);
	for (const y of [0, 76.3]) al([[38.4, y - 0.6, -6], [39.6, y + 0.6, -6]], 0.6);

	technology.add(lines.build());

	markBloom(technology);
	return technology;
}
