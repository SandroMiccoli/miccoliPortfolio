import * as THREE from 'three';

/**
 * Build helpers. Parts are copied into a handful of buffers instead of one mesh each.
 * Boxes and cylinders use a unit template plus a scale matrix, which matches a
 * geometry built at final size and then rotated. Tori are cached at their real
 * radii so the tube profile stays exact.
 */

const PALETTE = {
	black: 0x49a9ed,
	chip: 0xb79ae6,
	gold: 0xe4cc74,
	silver: 0x49a9ed,
	ceramic: 0xb79ae6,
	substrate: 0x49a9ed,
	die: 0xb79ae6,
	grey: 0x1fc283,
	white: 0x49a9ed,
	led: 0x1fc283,
	amber: 0xe4cc74,
	green: 0x1fc283,
};

const _euler = new THREE.Euler();
const _quat = new THREE.Quaternion();
const _identity = new THREE.Quaternion();
const _pos = new THREE.Vector3();
const _scale = new THREE.Vector3();
const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();

const templateCache = new Map();

function growFloat() {
	let data = new Float32Array(4096);
	let n = 0;
	return {
		push1(value) {
			if (n + 1 > data.length) {
				const next = new Float32Array(data.length * 2);
				next.set(data);
				data = next;
			}
			data[n++] = value;
		},
		push3(x, y, z) {
			if (n + 3 > data.length) {
				const next = new Float32Array(data.length * 2);
				next.set(data);
				data = next;
			}
			data[n++] = x;
			data[n++] = y;
			data[n++] = z;
		},
		seal() {
			const out = new Float32Array(n);
			out.set(data.subarray(0, n));
			data = new Float32Array(0);
			n = 0;
			return out;
		},
	};
}

function growUint() {
	let data = new Uint32Array(4096);
	let n = 0;
	return {
		push1(value) {
			if (n + 1 > data.length) {
				const next = new Uint32Array(data.length * 2);
				next.set(data);
				data = next;
			}
			data[n++] = value;
		},
		seal() {
			const out = new Uint32Array(n);
			out.set(data.subarray(0, n));
			data = new Uint32Array(0);
			n = 0;
			return out;
		},
	};
}

function templateFrom(geometry, threshold) {
	const edgesGeo = new THREE.EdgesGeometry(geometry, threshold);
	const edges = new Float32Array(edgesGeo.attributes.position.array);
	edgesGeo.dispose();
	const position = new Float32Array(geometry.attributes.position.array);
	const index = geometry.index ? new Uint32Array(geometry.index.array) : null;
	geometry.dispose();
	return { position, index, edges };
}

function cachedTemplate(key, build) {
	let template = templateCache.get(key);
	if (!template) {
		template = build();
		templateCache.set(key, template);
	}
	return template;
}

function boxTemplate() {
	return cachedTemplate('box', () => templateFrom(new THREE.BoxGeometry(1, 1, 1), 20));
}

function cylinderTemplate(segments, threshold) {
	return cachedTemplate(`cyl|${segments}|${threshold}`, () => (
		templateFrom(new THREE.CylinderGeometry(1, 1, 1, segments), threshold)
	));
}

function torusTemplate(radius, tube, radial, tubular) {
	return cachedTemplate(`torus|${radius}|${tube}|${radial}|${tubular}`, () => (
		templateFrom(new THREE.TorusGeometry(radius, tube, radial, tubular), 20)
	));
}

function edgeColor(mat, x) {
	if (mat === 'black') return x < -2 ? 0xb79ae6 : 0x49a9ed;
	return PALETTE[mat] || 0x1fc283;
}

function compose(x, y, z, rx, ry, rz, sx, sy, sz, quaternion) {
	if (quaternion) {
		_quat.copy(quaternion);
	} else {
		_euler.set(rx, ry, rz, 'XYZ');
		_quat.setFromEuler(_euler);
	}
	_pos.set(x, y, z);
	_scale.set(sx, sy, sz);
	return _m.compose(_pos, _quat, _scale);
}

function createMeshBuilder() {
	const positions = growFloat();
	const indices = growUint();
	const fades = growFloat();
	let trackFade = false;
	let vertexBase = 0;

	function addSolid(template, matrix, fade = null) {
		const src = template.position;
		const base = vertexBase;
		for (let i = 0; i < src.length; i += 3) {
			_v.fromArray(src, i).applyMatrix4(matrix);
			positions.push3(_v.x, _v.y, _v.z);
		}
		const count = src.length / 3;
		if (fade !== null) {
			trackFade = true;
			for (let i = 0; i < count; i++) fades.push1(fade);
		}
		if (template.index) {
			const idx = template.index;
			for (let i = 0; i < idx.length; i++) indices.push1(idx[i] + base);
		} else {
			for (let i = 0; i < count; i++) indices.push1(base + i);
		}
		vertexBase += count;
	}

	function geometry() {
		const geo = new THREE.BufferGeometry();
		geo.setAttribute('position', new THREE.BufferAttribute(positions.seal(), 3));
		if (trackFade) geo.setAttribute('fade', new THREE.BufferAttribute(fades.seal(), 1));
		geo.setIndex(new THREE.BufferAttribute(indices.seal(), 1));
		geo.computeBoundingSphere();
		return geo;
	}

	return { addSolid, geometry };
}

function applyFade(material, floor) {
	material.onBeforeCompile = (shader) => {
		shader.uniforms.fadeFloor = { value: floor };
		shader.vertexShader = shader.vertexShader
			.replace('#include <common>', '#include <common>\nattribute float fade;\nvarying float vFade;')
			.replace('#include <begin_vertex>', '#include <begin_vertex>\nvFade = fade;');
		shader.fragmentShader = shader.fragmentShader
			.replace('#include <common>', '#include <common>\nvarying float vFade;\nuniform float fadeFloor;')
			.replace(
				'#include <opaque_fragment>',
				'diffuseColor.a *= mix(fadeFloor, 1.0, clamp(vFade, 0.0, 1.0));\n#include <opaque_fragment>',
			);
	};
	material.customProgramCacheKey = () => `hologram-fade-${floor}`;
}

function edgeLinesFrom(buckets, opacity, depthWrite) {
	const group = new THREE.Group();
	for (const [color, buffer] of buckets) {
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.BufferAttribute(buffer.seal(), 3));
		geometry.computeBoundingSphere();
		group.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
			color,
			transparent: opacity < 1,
			opacity,
			depthWrite,
		})));
	}
	return group;
}

export function createPcbBatch() {
	const mesh = createMeshBuilder();
	const edges = new Map();

	function edgeBuffer(color) {
		let buffer = edges.get(color);
		if (!buffer) {
			buffer = growFloat();
			edges.set(color, buffer);
		}
		return buffer;
	}

	function addEdges(template, matrix, color) {
		const buffer = edgeBuffer(color);
		const src = template.edges;
		for (let i = 0; i < src.length; i += 3) {
			_v.fromArray(src, i).applyMatrix4(matrix);
			buffer.push3(_v.x, _v.y, _v.z);
		}
	}

	function place(template, x, y, z, rx, ry, rz, color, sx, sy, sz) {
		const matrix = compose(x, y, z, rx, ry, rz, sx, sy, sz, null);
		mesh.addSolid(template, matrix);
		addEdges(template, matrix, color);
	}

	function addCircle(x, y, z, radius, color) {
		const buffer = edgeBuffer(color);
		for (let i = 0; i < 32; i++) {
			const a = (i / 32) * Math.PI * 2;
			const b = ((i + 1) / 32) * Math.PI * 2;
			buffer.push3(x + Math.cos(a) * radius, y + Math.sin(a) * radius, z);
			buffer.push3(x + Math.cos(b) * radius, y + Math.sin(b) * radius, z);
		}
	}

	return {
		box(x, y, z, w, h, d, mat = 'black', rz = 0) {
			place(boxTemplate(), x, y, z, 0, 0, rz, edgeColor(mat, x), w, h, d);
		},
		cylinder(x, y, z, radius, height, mat = 'silver', rx = 0, ry = 0, rz = 0, segments = 20) {
			place(
				cylinderTemplate(segments, 20),
				x, y, z, rx, ry, rz,
				edgeColor(mat, x),
				radius, height, radius,
			);
		},
		torus(x, y, z, radius, tube, mat = 'gold', rx = 0, ry = 0, rz = 0, radial = 6, tubular = 24) {
			place(
				torusTemplate(radius, tube, radial, tubular),
				x, y, z, rx, ry, rz,
				edgeColor(mat, x),
				1, 1, 1,
			);
		},
		ring(x, y, z, radius, tube, mat = 'gold') {
			const color = edgeColor(mat, x);
			place(torusTemplate(radius, tube, 6, 24), x, y, z, 0, 0, 0, color, 1, 1, 1);
			addCircle(x, y, z, radius - tube, color);
			addCircle(x, y, z, radius + tube, color);
		},
		slab(geometry) {
			const template = templateFrom(geometry, 20);
			_m.identity();
			mesh.addSolid(template, _m);
			_m.makeTranslation(0, 0, 0.012);
			addEdges(template, _m, 0x1fc283);
		},
		build() {
			const solid = new THREE.Mesh(mesh.geometry(), new THREE.MeshBasicMaterial({
				color: 0x080f18,
				polygonOffset: true,
				polygonOffsetFactor: 1,
				polygonOffsetUnits: 1,
			}));
			const lines = edgeLinesFrom(edges, 0.95, true);
			return { solid, lines };
		},
	};
}

export function createHologramBatch() {
	const mesh = createMeshBuilder();
	const edges = growFloat();
	const edgeFade = growFloat();
	const box = boxTemplate();

	function add(template, x, y, z, quaternion, sx, sy, sz, fade) {
		const matrix = compose(x, y, z, 0, 0, 0, sx, sy, sz, quaternion || _identity);
		mesh.addSolid(template, matrix, fade);
		const src = template.edges;
		for (let i = 0; i < src.length; i += 3) {
			_v.fromArray(src, i).applyMatrix4(matrix);
			edges.push3(_v.x, _v.y, _v.z);
			edgeFade.push1(fade);
		}
	}

	return {
		box(w, h, d, x, y, z, quaternion = null, fade = 1) {
			add(box, x, y, z, quaternion, w, h, d, fade);
		},
		cylinder(radius, height, x, y, z, quaternion, segments = 16, fade = 1) {
			add(cylinderTemplate(segments, 16), x, y, z, quaternion, radius, height, radius, fade);
		},
		build() {
			const fill = new THREE.MeshBasicMaterial({
				color: 0x237ca5,
				transparent: true,
				opacity: 0.2,
				depthWrite: false,
				side: THREE.DoubleSide,
			});
			const stroke = new THREE.LineBasicMaterial({
				color: 0x62c9ff,
				transparent: true,
				opacity: 0.95,
				depthWrite: false,
			});
			applyFade(fill, 0.08);
			applyFade(stroke, 0.16);
			const group = new THREE.Group();
			group.add(new THREE.Mesh(mesh.geometry(), fill));
			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute('position', new THREE.BufferAttribute(edges.seal(), 3));
			geometry.setAttribute('fade', new THREE.BufferAttribute(edgeFade.seal(), 1));
			geometry.computeBoundingSphere();
			group.add(new THREE.LineSegments(geometry, stroke));
			return group;
		},
	};
}

function fadeAt(fade, index) {
	return typeof fade === 'number' ? fade : fade[index];
}

export function createLineBatch(options = {}) {
	const fadeFloor = options.fadeFloor;
	const withFade = fadeFloor !== undefined;
	const buckets = new Map();

	function add(points, color, opacity, fade = 1) {
		const key = color * 1000 + Math.round(opacity * 1000);
		let bucket = buckets.get(key);
		if (!bucket) {
			bucket = { color, opacity, buffer: growFloat(), fades: withFade ? growFloat() : null };
			buckets.set(key, bucket);
		}
		const buffer = bucket.buffer;
		for (let i = 1; i < points.length; i++) {
			const a = points[i - 1];
			const b = points[i];
			buffer.push3(a.x, a.y, a.z);
			buffer.push3(b.x, b.y, b.z);
			if (bucket.fades) {
				bucket.fades.push1(fadeAt(fade, i - 1));
				bucket.fades.push1(fadeAt(fade, i));
			}
		}
	}

	function build() {
		const group = new THREE.Group();
		for (const bucket of buckets.values()) {
			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute('position', new THREE.BufferAttribute(bucket.buffer.seal(), 3));
			if (bucket.fades) geometry.setAttribute('fade', new THREE.BufferAttribute(bucket.fades.seal(), 1));
			geometry.computeBoundingSphere();
			const material = new THREE.LineBasicMaterial({
				color: bucket.color,
				transparent: true,
				opacity: bucket.opacity,
				depthWrite: false,
			});
			if (withFade) applyFade(material, fadeFloor);
			group.add(new THREE.LineSegments(geometry, material));
		}
		return group;
	}

	return { add, build };
}
