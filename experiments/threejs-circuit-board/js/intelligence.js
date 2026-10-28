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
	return new THREE.Vector3((38.15 - y) * scale, x * scale, 6.65 + z * scale);
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

function createHexMaterial(baseSize) {
	const material = new THREE.PointsMaterial({
		color: 0x74e6b4,
		size: baseSize,
		sizeAttenuation: false,
		transparent: true,
		opacity: 1,
		depthWrite: false,
	});
	material.userData.baseSize = baseSize;
	material.userData.baseOpacity = 1;
	material.onBeforeCompile = (shader) => {
		shader.fragmentShader = shader.fragmentShader.replace(
			'#include <opaque_fragment>',
			`
			vec2 p = abs(gl_PointCoord * 2.0 - 1.0);
			float hex = max(p.y * 0.866025404 + p.x * 0.5, p.x);
			if (hex > 0.82) discard;
			#include <opaque_fragment>
			`,
		);
	};
	material.customProgramCacheKey = () => 'spark-hexagon-fill';
	return material;
}

function pushUnique(pts, x, y, z) {
	const point = new THREE.Vector3(x, y, z);
	const last = pts[pts.length - 1];
	if (!last || last.distanceToSquared(point) > 0.0004) pts.push(point);
	return point;
}

export function createRoutes(kind) {
	const study = STUDIES[kind];
	const group = new THREE.Group();
	group.name = 'intelligence-routes';
	group.userData.energy = true;

	const ends = study.destinations.map((destination) => (
		study.resolveEnd(destination[0], destination[1], destination[2])
	));
	const order = ends.map((end, i) => ({ i, x: end.x })).sort((a, b) => a.x - b.x);
	const lanes = new Array(ends.length);
	const minGap = 0.42;
	for (let k = 0; k < order.length; k++) {
		const { i, x } = order[k];
		const prev = k ? lanes[order[k - 1].i] : x - minGap;
		lanes[i] = k && x < prev + minGap ? prev + minGap : x;
	}

	const paths = [];
	const packets = [];
	const nodePositions = [];
	const hexScale = { s: 1 };

	ends.forEach((end, i) => {
		const laneX = lanes[i];
		const startY = THREE.MathUtils.clamp(end.y, -1.85, 1.85);
		const stubZ = Math.max(LAYER_Z + 0.25, end.z - 0.08) - i * 0.11;
		const start = new THREE.Vector3(laneX, startY, 0.12);
		const pts = [start];
		pushUnique(pts, laneX, startY, LAYER_Z);
		if (Math.abs(end.y - startY) > 0.04) pushUnique(pts, laneX, end.y, LAYER_Z);
		pushUnique(pts, laneX, end.y, stubZ);
		if (Math.abs(end.x - laneX) > 0.04) pushUnique(pts, end.x, end.y, stubZ);
		pushUnique(pts, end.x, end.y, end.z);

		const sampled = sampleCurve(pts);
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.BufferAttribute(sampled, 3));
		geometry.setDrawRange(0, SAMPLE_STEPS + 1);
		geometry.computeBoundingSphere();
		const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({
			color: 0x1fc283,
			transparent: true,
			opacity: 0.72,
			depthWrite: false,
		}));
		line.userData.energy = true;
		line.userData.count = SAMPLE_STEPS + 1;
		line.userData.grow = { p: 1 };
		line.userData.shown = SAMPLE_STEPS + 1;
		line.frustumCulled = false;
		markBloom(line);
		group.add(line);
		paths.push(line);

		nodePositions.push(start.x, start.y, start.z);
		nodePositions.push(laneX, end.y, LAYER_Z);
		nodePositions.push(end.x, end.y, end.z);

		for (let k = 0; k < 2; k++) {
			packets.push({
				data: sampled,
				offset: k / 2 + i * 0.13,
				speed: 0.055,
				line,
			});
		}
	});

	const sparkPositions = new Float32Array(packets.length * 3);
	const sparkGeometry = new THREE.BufferGeometry();
	const sparkAttribute = new THREE.BufferAttribute(sparkPositions, 3);
	sparkAttribute.usage = THREE.DynamicDrawUsage;
	sparkGeometry.setAttribute('position', sparkAttribute);
	const sparkMat = createHexMaterial(10);
	const sparks = new THREE.Points(sparkGeometry, sparkMat);
	sparks.userData.energy = true;
	sparks.frustumCulled = false;
	sparks.layers.set(1);
	group.add(sparks);

	const nodeGeometry = new THREE.BufferGeometry();
	nodeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nodePositions), 3));
	nodeGeometry.computeBoundingSphere();
	const nodeMat = createHexMaterial(6);
	const nodes = new THREE.Points(nodeGeometry, nodeMat);
	nodes.userData.energy = true;
	nodes.frustumCulled = false;
	nodes.layers.set(1);
	group.add(nodes);

	function apply() {
		for (let i = 0; i < paths.length; i++) {
			const line = paths[i];
			const count = line.userData.count;
			let shown = Math.round(line.userData.grow.p * count);
			if (shown < 0) shown = 0;
			if (shown > 0 && shown < 2) shown = 2;
			if (line.userData.shown === shown) continue;
			line.geometry.setDrawRange(0, shown);
			line.userData.shown = shown;
		}
		const s = hexScale.s;
		sparkMat.size = sparkMat.userData.baseSize * s;
		nodeMat.size = nodeMat.userData.baseSize * s;
		const showHex = s > 0.03;
		sparks.visible = showHex;
		nodes.visible = showHex;
	}

	let written = Number.NaN;
	function update(time) {
		if (time === written) return;
		written = time;
		for (let i = 0; i < packets.length; i++) {
			const packet = packets[i];
			const o = i * 3;
			let t = packet.offset + time * packet.speed;
			t -= Math.floor(t);
			if (hexScale.s < 0.03 || t > packet.line.userData.grow.p) {
				sparkPositions[o] = 0;
				sparkPositions[o + 1] = 0;
				sparkPositions[o + 2] = -1000;
				continue;
			}
			writeSample(packet.data, t, sparkPositions, o);
		}
		sparkAttribute.needsUpdate = true;
		apply();
	}

	update(0);
	return { group, update, sparks, paths, hexScale, apply };
}
