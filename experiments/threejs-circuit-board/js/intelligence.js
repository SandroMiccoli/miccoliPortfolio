import * as THREE from 'three';
import { createLineBatch } from './batch.js';
import { markBloom } from './bloom.js';
import { ARM_PIVOT, ARM_SCALE, LAYER_Z } from './constants.js';

const SAMPLE_STEPS = 96;

const SAT_POS = new THREE.Vector3(0, 0.15, 7.55);
const SAT_EULER = new THREE.Euler(0.86, 0.28, 0.04);
const _sat = new THREE.Vector3();

function satEnd(x, y, z) {
	return _sat.set(x, y, z).applyEuler(SAT_EULER).add(SAT_POS).clone();
}

function planeEnd(x, y, z) {
	const scale = 0.135;
	return new THREE.Vector3(x * scale, (38.15 - y) * scale, 6.65 + z * scale);
}

const STUDIES = {
	arm: {
		destinations: [
			[-0.75, -0.3, 5.52],
			[-0.75, 0.3, 5.96],
			[-1.8, -0.35, 8.05],
			[-1.8, 0.35, 8.05],
			[0.85, 0.28, 8.45],
			[1.55, -0.22, 7.8],
		],
		resolveEnd(x, y, z) {
			return new THREE.Vector3(
				ARM_PIVOT.x + (x - ARM_PIVOT.x) * ARM_SCALE,
				ARM_PIVOT.y + (y - ARM_PIVOT.y) * ARM_SCALE,
				ARM_PIVOT.z + (z - ARM_PIVOT.z) * ARM_SCALE,
			);
		},
	},
	plane: {
		destinations: [
			[0, 2, 0.4],
			[0, 74, 0.6],
			[-28, 46, 1.8],
			[28, 46, 1.8],
			[-11.4, 29.8, -3.4],
			[11.4, 29.8, -3.4],
		],
		resolveEnd(x, y, z) {
			return planeEnd(x, y, z);
		},
	},
	satellite: {
		destinations: [
			[0, 0, 0],
			[-3.6, 0, 0],
			[3.6, 0, 0],
			[0, 0, 1.72],
			[0, 1.05, 0],
			[-1.1, 0, -1.05],
		],
		resolveEnd(x, y, z) {
			return satEnd(x, y, z);
		},
	},
	datacenter: {
		destinations: [
			[-2, -1.1, 8.95],
			[0, -1.1, 8.95],
			[2, -1.1, 8.95],
			[-2, 1.1, 8.95],
			[0, 1.1, 8.95],
			[2, 1.1, 8.95],
		],
		resolveEnd(x, y, z) {
			return new THREE.Vector3(x, y, z);
		},
	},
};

function sampleCurve(points) {
	const curve = new THREE.CurvePath();
	for (let i = 1; i < points.length; i++) {
		curve.add(new THREE.LineCurve3(points[i - 1], points[i]));
	}
	const data = new Float32Array((SAMPLE_STEPS + 1) * 3);
	const point = new THREE.Vector3();
	for (let i = 0; i <= SAMPLE_STEPS; i++) {
		curve.getPointAt(i / SAMPLE_STEPS, point);
		point.toArray(data, i * 3);
	}
	return data;
}

function writeSample(data, t, target, offset) {
	let wrapped = t % 1;
	if (wrapped < 0) wrapped += 1;
	let f = wrapped * SAMPLE_STEPS;
	if (f >= SAMPLE_STEPS) f = 0;
	const i0 = Math.floor(f);
	const frac = f - i0;
	const a = i0 * 3;
	const b = (i0 + 1) * 3;
	target[offset] = data[a] + (data[b] - data[a]) * frac;
	target[offset + 1] = data[a + 1] + (data[b + 1] - data[a + 1]) * frac;
	target[offset + 2] = data[a + 2] + (data[b + 2] - data[a + 2]) * frac;
}

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

export function createRoutes(kind) {
	const study = STUDIES[kind];
	const group = new THREE.Group();
	group.name = 'intelligence-routes';
	const routes = createLineBatch();

	function squareNode(x, y, z, radius = 0.1, color = 0x1fc283) {
		routes.add([
			new THREE.Vector3(x - radius, y - radius, z),
			new THREE.Vector3(x + radius, y - radius, z),
			new THREE.Vector3(x + radius, y + radius, z),
			new THREE.Vector3(x - radius, y + radius, z),
			new THREE.Vector3(x - radius, y - radius, z),
		], color, 0.9);
	}

	const packets = [];
	study.destinations.forEach((destination, i) => {
		const side = i % 2 === 0 ? -1 : 1;
		const x = -2.7 + i * 1.02;
		const lane = (i - 2.5) * 0.43;
		const start = new THREE.Vector3(x, side * 1.65, 0.12);
		const end = study.resolveEnd(destination[0], destination[1], destination[2]);
		const hubX = -1.75 + i * 0.66;
		const pts = [
			start,
			new THREE.Vector3(x, side * 1.65, LAYER_Z),
			new THREE.Vector3(x, lane, LAYER_Z),
			new THREE.Vector3(hubX, lane, LAYER_Z),
			new THREE.Vector3(hubX + 0.24, lane + 0.24, LAYER_Z),
			new THREE.Vector3(end.x, lane + 0.24, LAYER_Z),
			new THREE.Vector3(end.x, lane + 0.24, end.z - 0.35),
			new THREE.Vector3(end.x, end.y, end.z - 0.35),
			end,
		];
		const accent = i === 4;
		routes.add(pts, accent ? 0x49a9ed : 0x1fc283, 0.45);
		routes.add(pts.slice(1, 6), 0x1fc283, 0.78);
		squareNode(hubX, lane, LAYER_Z, 0.12, accent ? 0xb79ae6 : 0x1fc283);
		squareNode(start.x, start.y, start.z, 0.075);
		squareNode(end.x, end.y, end.z, 0.075, 0x49a9ed);

		const sampled = sampleCurve(pts);
		for (let k = 0; k < 2; k++) {
			packets.push({ data: sampled, offset: k / 2 + i * 0.13, speed: 0.055 });
		}
	});

	const routeLines = routes.build();
	markBloom(routeLines);
	group.add(routeLines);

	const sparkPositions = new Float32Array(packets.length * 3);
	const sparkGeometry = new THREE.BufferGeometry();
	const sparkAttribute = new THREE.BufferAttribute(sparkPositions, 3);
	sparkAttribute.usage = THREE.DynamicDrawUsage;
	sparkGeometry.setAttribute('position', sparkAttribute);
	const sparks = new THREE.Points(sparkGeometry, new THREE.PointsMaterial({
		color: 0x74e6b4,
		size: 6.5,
		sizeAttenuation: false,
		transparent: true,
		opacity: 1,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
	}));
	sparks.frustumCulled = false;
	sparks.layers.set(1);
	sparks.material.userData.baseOpacity = 1;
	group.add(sparks);

	let written = Number.NaN;
	function update(time) {
		if (time === written) return;
		written = time;
		for (let i = 0; i < packets.length; i++) {
			const packet = packets[i];
			writeSample(packet.data, packet.offset + time * packet.speed, sparkPositions, i * 3);
		}
		sparkAttribute.needsUpdate = true;
	}

	update(0);
	return { group, update, sparks };
}
