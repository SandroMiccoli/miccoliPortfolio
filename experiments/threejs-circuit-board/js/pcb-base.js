import * as THREE from 'three';

const HOLE = 0.15;
const EDGE = 10;
const CORNER = 8;
const OUTLINE = 4 * (EDGE + CORNER);
const THICKNESS = 0.28;
const RIBS = 16;

/**
 * One physical board shared by every PCB option. Width, height, corner
 * radius and mounting holes ease from one outline to the next.
 */
export const PROFILES = {
	reference: {
		w: 12,
		h: 10,
		r: 0,
		bow: 0,
		holes: [
			{ x: -5.65, y: 4.65, r: HOLE },
			{ x: 5.65, y: 4.65, r: HOLE },
			{ x: -5.65, y: -4.65, r: HOLE },
			{ x: 5.65, y: -4.65, r: HOLE },
			{ x: 2.25, y: -4.35, r: 0 },
			{ x: 0, y: 4.65, r: 0 },
		],
	},
	nxp: {
		w: 12,
		h: 9.42,
		r: 0.28,
		bow: 0,
		holes: [
			{ x: -5.484, y: 4.182, r: HOLE },
			{ x: 5.484, y: 4.182, r: HOLE },
			{ x: -5.484, y: -4.192, r: HOLE },
			{ x: 5.484, y: -4.192, r: HOLE },
			{ x: 0, y: -4.192, r: 0 },
			{ x: 0, y: 4.182, r: 0 },
		],
	},
	versal: {
		w: 12,
		h: 10,
		r: 0.26,
		bow: 0,
		holes: [
			{ x: -5.52, y: 4.5, r: HOLE },
			{ x: 5.52, y: 4.5, r: HOLE },
			{ x: -5.52, y: -4.5, r: HOLE },
			{ x: 5.52, y: -4.5, r: HOLE },
			{ x: 0, y: -4.5, r: 0 },
			{ x: 0, y: 4.5, r: 0 },
		],
	},
};

export function cloneProfile(profile) {
	return {
		w: profile.w,
		h: profile.h,
		r: profile.r,
		bow: profile.bow,
		holes: profile.holes.map((hole) => ({ x: hole.x, y: hole.y, r: hole.r })),
	};
}

export function mixProfile(a, b, u) {
	const holes = a.holes.map((hole, index) => ({
		x: hole.x + (b.holes[index].x - hole.x) * u,
		y: hole.y + (b.holes[index].y - hole.y) * u,
		r: hole.r + (b.holes[index].r - hole.r) * u,
	}));
	return {
		w: a.w + (b.w - a.w) * u,
		h: a.h + (b.h - a.h) * u,
		r: a.r + (b.r - a.r) * u,
		bow: 0,
		holes,
	};
}

function bowY(x, y, w, bow) {
	const half = w * 0.5 || 1;
	const nx = x / half;
	return y + Math.sin((nx * 0.5 + 0.5) * Math.PI) * bow;
}

function sampleOutline(w, h, radius, bow) {
	const hw = w * 0.5;
	const hh = h * 0.5;
	const r = Math.min(Math.max(radius, 0), hw - 0.001, hh - 0.001);
	const pts = new Float32Array(OUTLINE * 2);
	let n = 0;
	const push = (x, y) => {
		pts[n++] = x;
		pts[n++] = bowY(x, y, w, bow);
	};
	const edge = (x0, y0, x1, y1) => {
		for (let i = 0; i < EDGE; i++) {
			const t = i / EDGE;
			push(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
		}
	};
	const arc = (cx, cy, a0, a1) => {
		for (let i = 0; i < CORNER; i++) {
			const a = a0 + (a1 - a0) * (i / CORNER);
			push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
		}
	};
	edge(-hw + r, hh, hw - r, hh);
	arc(hw - r, hh - r, Math.PI / 2, 0);
	edge(hw, hh - r, hw, -hh + r);
	arc(hw - r, -hh + r, 0, -Math.PI / 2);
	edge(hw - r, -hh, -hw + r, -hh);
	arc(-hw + r, -hh + r, -Math.PI / 2, -Math.PI);
	edge(-hw, -hh + r, -hw, hh - r);
	arc(-hw + r, hh - r, Math.PI, Math.PI / 2);
	return pts;
}

function writeRings(positions, pts, z) {
	for (let i = 0; i < OUTLINE; i++) {
		positions[i * 3] = pts[i * 2];
		positions[i * 3 + 1] = pts[i * 2 + 1];
		positions[i * 3 + 2] = z;
	}
}

function pushOut(pts, amount) {
	const out = new Float32Array(pts.length);
	for (let i = 0; i < OUTLINE; i++) {
		const prev = (i + OUTLINE - 1) % OUTLINE;
		const next = (i + 1) % OUTLINE;
		const x = pts[i * 2];
		const y = pts[i * 2 + 1];
		let nx = pts[next * 2 + 1] - pts[prev * 2 + 1];
		let ny = pts[prev * 2] - pts[next * 2];
		const len = Math.hypot(nx, ny) || 1;
		nx /= len;
		ny /= len;
		if (nx * x + ny * y < 0) {
			nx = -nx;
			ny = -ny;
		}
		out[i * 2] = x + nx * amount;
		out[i * 2 + 1] = y + ny * amount;
	}
	return out;
}

function circleGeometry(radius, segments = 40) {
	const positions = new Float32Array(segments * 3);
	for (let i = 0; i < segments; i++) {
		const a = (i / segments) * Math.PI * 2;
		positions[i * 3] = Math.cos(a) * radius;
		positions[i * 3 + 1] = Math.sin(a) * radius;
	}
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	return geometry;
}

function fitBounds(geometry, w, h, bow) {
	const hw = w * 0.5;
	const hh = h * 0.5;
	const extra = Math.max(0, bow);
	if (!geometry.boundingBox) geometry.boundingBox = new THREE.Box3();
	geometry.boundingBox.min.set(-hw - 0.28, -hh - 0.28, -THICKNESS - 0.04);
	geometry.boundingBox.max.set(hw + 0.28, hh + extra + 0.2, 0.12);
	if (!geometry.boundingSphere) geometry.boundingSphere = new THREE.Sphere();
	geometry.boundingBox.getBoundingSphere(geometry.boundingSphere);
}

const faceVertex = /* glsl */ `
	uniform vec2 uSize;
	uniform float uBow;
	varying vec2 vBoard;
	void main() {
		vec3 p = position;
		p.x *= uSize.x / 12.0;
		p.y *= uSize.y / 10.0;
		vBoard = p.xy;
		float halfX = max(uSize.x * 0.5, 0.001);
		float nx = p.x / halfX;
		p.y += sin((nx * 0.5 + 0.5) * 3.14159265) * uBow;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
	}
`;

const faceFragment = /* glsl */ `
	uniform vec3 uColor;
	uniform vec2 uSize;
	uniform float uRadius;
	uniform vec3 uHoles[6];
	varying vec2 vBoard;
	float sdRoundBox(vec2 p, vec2 b, float r) {
		vec2 q = abs(p) - b + vec2(r);
		return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
	}
	void main() {
		vec2 halfSize = uSize * 0.5;
		float radius = min(uRadius, min(halfSize.x, halfSize.y));
		if (sdRoundBox(vBoard, halfSize, radius) > 0.014) discard;
		for (int i = 0; i < 6; i++) {
			if (uHoles[i].z > 0.01 && distance(vBoard, uHoles[i].xy) < uHoles[i].z) discard;
		}
		gl_FragColor = vec4(uColor, 1.0);
		#include <colorspace_fragment>
	}
`;

export function createPcbBase() {
	const group = new THREE.Group();
	group.name = 'pcb-base';

	const holeUniforms = Array.from({ length: 6 }, () => new THREE.Vector3());
	const uniforms = {
		uColor: { value: new THREE.Color(0x080f18) },
		uSize: { value: new THREE.Vector2(12, 10) },
		uRadius: { value: 0 },
		uBow: { value: 0 },
		uHoles: { value: holeUniforms },
	};
	const face = new THREE.Mesh(
		new THREE.PlaneGeometry(12, 10, 48, 1),
		new THREE.ShaderMaterial({
			uniforms,
			vertexShader: faceVertex,
			fragmentShader: faceFragment,
			polygonOffset: true,
			polygonOffsetFactor: -1,
			polygonOffsetUnits: -1,
		}),
	);
	face.position.z = 0.004;
	face.renderOrder = 0;
	face.frustumCulled = false;

	const wallPositions = new Float32Array(OUTLINE * 2 * 3);
	const wallGeometry = new THREE.BufferGeometry();
	wallGeometry.setAttribute('position', new THREE.BufferAttribute(wallPositions, 3));
	wallGeometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
	const wallIndex = [];
	for (let i = 0; i < OUTLINE; i++) {
		const next = (i + 1) % OUTLINE;
		const bottom = i + OUTLINE;
		const bottomNext = next + OUTLINE;
		wallIndex.push(i, bottom, next, next, bottom, bottomNext);
	}
	wallGeometry.setIndex(wallIndex);
	const wall = new THREE.Mesh(
		wallGeometry,
		new THREE.MeshBasicMaterial({ color: 0x12263a, side: THREE.DoubleSide }),
	);
	wall.frustumCulled = false;

	const edgePositions = new Float32Array(OUTLINE * 3);
	const edgeGeometry = new THREE.BufferGeometry();
	edgeGeometry.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3));
	edgeGeometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
	const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x1fc283 });
	const edge = new THREE.LineLoop(edgeGeometry, edgeMaterial);
	edge.frustumCulled = false;
	edge.renderOrder = 1;

	const bottomEdgePositions = new Float32Array(OUTLINE * 3);
	const bottomEdgeGeometry = new THREE.BufferGeometry();
	bottomEdgeGeometry.setAttribute('position', new THREE.BufferAttribute(bottomEdgePositions, 3));
	bottomEdgeGeometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
	const bottomEdge = new THREE.LineLoop(bottomEdgeGeometry, edgeMaterial);
	bottomEdge.frustumCulled = false;
	bottomEdge.renderOrder = 1;

	const ribPositions = new Float32Array(RIBS * 2 * 3);
	const ribGeometry = new THREE.BufferGeometry();
	ribGeometry.setAttribute('position', new THREE.BufferAttribute(ribPositions, 3));
	ribGeometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
	const ribs = new THREE.LineSegments(ribGeometry, edgeMaterial);
	ribs.frustumCulled = false;
	ribs.renderOrder = 1;

	const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x080f18 });
	const ringEdgeMaterial = new THREE.LineBasicMaterial({ color: 0xe4cc74 });
	const topRingGeo = new THREE.TorusGeometry(0.205, 0.048, 6, 24);
	const sleeveGeo = new THREE.CylinderGeometry(HOLE, HOLE, THICKNESS, 20, 1, true);
	sleeveGeo.rotateX(Math.PI / 2);
	sleeveGeo.translate(0, 0, -THICKNESS * 0.5);
	const sleeveMaterial = new THREE.MeshBasicMaterial({ color: 0x080f18, side: THREE.BackSide });
	const innerGeo = circleGeometry(0.157);
	const outerGeo = circleGeometry(0.253);
	const rings = [];
	for (let i = 0; i < 6; i++) {
		const rig = new THREE.Group();
		const top = new THREE.Mesh(topRingGeo, ringMaterial);
		top.position.z = 0.02;
		const inner = new THREE.LineLoop(innerGeo, ringEdgeMaterial);
		const outer = new THREE.LineLoop(outerGeo, ringEdgeMaterial);
		inner.position.z = 0.03;
		outer.position.z = 0.03;
		rig.add(top, new THREE.Mesh(sleeveGeo, sleeveMaterial), inner, outer);
		rig.frustumCulled = false;
		group.add(rig);
		rings.push(rig);
	}

	group.add(face, wall, edge, bottomEdge, ribs);

	function apply(profile) {
		uniforms.uSize.value.set(profile.w, profile.h);
		uniforms.uRadius.value = profile.r;
		uniforms.uBow.value = profile.bow;
		for (let i = 0; i < 6; i++) {
			const hole = profile.holes[i];
			holeUniforms[i].set(hole.x, hole.y, hole.r);
			const rig = rings[i];
			const scale = hole.r > 0.012 ? hole.r / HOLE : 0;
			rig.visible = scale > 0;
			rig.scale.setScalar(scale);
			rig.position.set(hole.x, bowY(hole.x, hole.y, profile.w, profile.bow), 0);
		}
		const pts = sampleOutline(profile.w, profile.h, profile.r, profile.bow);
		const top = wallGeometry.attributes.position.array;
		writeRings(top, pts, 0);
		for (let i = 0; i < OUTLINE; i++) {
			const o = (OUTLINE + i) * 3;
			top[o] = pts[i * 2];
			top[o + 1] = pts[i * 2 + 1];
			top[o + 2] = -THICKNESS;
		}
		wallGeometry.attributes.position.needsUpdate = true;
		const rim = pushOut(pts, 0.02);
		const edgeArray = edgeGeometry.attributes.position.array;
		writeRings(edgeArray, rim, 0.012);
		edgeGeometry.attributes.position.needsUpdate = true;
		const bottomArray = bottomEdgeGeometry.attributes.position.array;
		writeRings(bottomArray, rim, -THICKNESS);
		bottomEdgeGeometry.attributes.position.needsUpdate = true;
		const ribArray = ribGeometry.attributes.position.array;
		const ribStep = OUTLINE / RIBS;
		for (let i = 0; i < RIBS; i++) {
			const p = Math.floor(i * ribStep) * 2;
			const o = i * 6;
			ribArray[o] = rim[p];
			ribArray[o + 1] = rim[p + 1];
			ribArray[o + 2] = 0.012;
			ribArray[o + 3] = rim[p];
			ribArray[o + 4] = rim[p + 1];
			ribArray[o + 5] = -THICKNESS;
		}
		ribGeometry.attributes.position.needsUpdate = true;
		fitBounds(face.geometry, profile.w, profile.h, profile.bow);
		fitBounds(wallGeometry, profile.w, profile.h, profile.bow);
		fitBounds(edgeGeometry, profile.w, profile.h, profile.bow);
		fitBounds(bottomEdgeGeometry, profile.w, profile.h, profile.bow);
		fitBounds(ribGeometry, profile.w, profile.h, profile.bow);
	}

	return { group, apply };
}
