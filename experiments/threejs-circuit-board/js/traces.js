import * as THREE from '../vendor/three.module.min.js';

const TRACE_COLOR = '#1f7863';
const STEP = 0.07;

const material = new THREE.LineBasicMaterial({ color: 0x1f7863 });

function orientFromCenter(points) {
	const a = points[0];
	const b = points[points.length - 1];
	const da = a[0] * a[0] + a[1] * a[1];
	const db = b[0] * b[0] + b[1] * b[1];
	return da <= db ? points : points.slice().reverse();
}

function subdivide(points) {
	const source = orientFromCenter(points);
	const out = [[source[0][0], source[0][1]]];
	for (let i = 1; i < source.length; i++) {
		const a = source[i - 1];
		const b = source[i];
		const dx = b[0] - a[0];
		const dy = b[1] - a[1];
		const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / STEP));
		for (let k = 1; k <= n; k++) {
			const t = k / n;
			out.push([a[0] + dx * t, a[1] + dy * t]);
		}
	}
	return out;
}

/**
 * Circuit traces as line geometry. Only the copper color is kept;
 * courtyard outlines and captions stay out of the mesh.
 */
export function createTraceCollector() {
	const routes = [];
	return {
		add(points, color = '#23483f') {
			if (color !== TRACE_COLOR || points.length < 2) return;
			routes.push(points.map((point) => [point[0], point[1]]));
		},
		build() {
			const group = new THREE.Group();
			group.name = 'traces';
			const lines = [];
			for (const route of routes) {
				const dense = subdivide(route);
				const positions = new Float32Array(dense.length * 3);
				let sx = 0;
				let sy = 0;
				for (let i = 0; i < dense.length; i++) {
					positions[i * 3] = dense[i][0];
					positions[i * 3 + 1] = dense[i][1];
					positions[i * 3 + 2] = 0.02;
					sx += dense[i][0];
					sy += dense[i][1];
				}
				const geometry = new THREE.BufferGeometry();
				geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
				geometry.computeBoundingSphere();
				geometry.setDrawRange(0, dense.length);
				const line = new THREE.Line(geometry, material);
				line.userData.count = dense.length;
				line.userData.grow = { p: 1 };
				line.userData.shown = dense.length;
				line.userData.d = (sx * sx + sy * sy) / (dense.length * dense.length);
				line.renderOrder = 2;
				group.add(line);
				lines.push(line);
			}
			group.userData.lines = lines;
			return group;
		},
	};
}

const TRACE = '#1f7863';

/** Stable per-bus variation: where the jog sits, and which way a detour leans. */
function mixOf(a, b) {
	const n = Math.abs(
		(Math.floor(a[0] * 8) * 73856093)
		^ (Math.floor(a[1] * 8) * 19349663)
		^ (Math.floor(b[0] * 8) * 83492791)
		^ (Math.floor(b[1] * 8) * 50331653),
	);
	return {
		t: 0.16 + (n % 67) / 100,
		broken: n % 5 === 0,
		side: n % 2 === 0 ? 1 : -1,
	};
}

function dedupe(points) {
	const out = [];
	for (const p of points) {
		const q = out[out.length - 1];
		if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.012) out.push([p[0], p[1]]);
	}
	if (out.length < 3) return out;
	const slim = [out[0]];
	for (let i = 1; i < out.length - 1; i++) {
		const a = slim[slim.length - 1];
		const b = out[i];
		const c = out[i + 1];
		const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
		if (Math.abs(cross) > 0.0008) slim.push(b);
	}
	slim.push(out[out.length - 1]);
	return slim;
}

function move(p, axis, sign, dist) {
	if (dist <= 0.0001) return [p[0], p[1]];
	return axis === 'x' ? [p[0] + sign * dist, p[1]] : [p[0], p[1] + sign * dist];
}

/** Straight run, then an exact 45° of length `diag` on both axes. */
function runDiag(pts, S, axis, signAlong, signAcross, lead, diag) {
	const p1 = move(S, axis, signAlong, lead);
	pts.push(p1);
	if (diag <= 0.0001) return;
	if (axis === 'x') pts.push([p1[0] + signAlong * diag, p1[1] + signAcross * diag]);
	else pts.push([p1[0] + signAcross * diag, p1[1] + signAlong * diag]);
}

/** Two 45° corners and a long perpendicular run. The steep escape. */
function steep(pts, S, axis, signAlong, signAcross, lead, m, mid, tail) {
	let p = move(S, axis, signAlong, lead);
	pts.push(p);
	if (m > 0.012) {
		p = axis === 'x'
			? [p[0] + signAlong * m, p[1] + signAcross * m]
			: [p[0] + signAcross * m, p[1] + signAlong * m];
		pts.push(p);
	}
	if (mid > 0.012) {
		p = axis === 'x' ? [p[0], p[1] + signAcross * mid] : [p[0] + signAcross * mid, p[1]];
		pts.push(p);
	}
	if (m > 0.012) {
		p = axis === 'x'
			? [p[0] + signAlong * m, p[1] + signAcross * m]
			: [p[0] + signAcross * m, p[1] + signAlong * m];
		pts.push(p);
	}
	pts.push(move(p, axis, signAlong, tail));
}

/** Parallel channel offset by a pair of 45° jogs, for an otherwise straight bus. */
function jogOut(pts, S, axis, signAlong, side, amp, lead, run) {
	if (axis === 'x') {
		const x0 = S[0] + signAlong * lead;
		pts.push([x0, S[1]]);
		pts.push([x0 + signAlong * amp, S[1] + side * amp]);
		pts.push([x0 + signAlong * (amp + run), S[1] + side * amp]);
		pts.push([x0 + signAlong * (amp + run + amp), S[1]]);
	} else {
		const y0 = S[1] + signAlong * lead;
		pts.push([S[0], y0]);
		pts.push([S[0] + side * amp, y0 + signAlong * amp]);
		pts.push([S[0] + side * amp, y0 + signAlong * (amp + run)]);
		pts.push([S[0], y0 + signAlong * (amp + run + amp)]);
	}
}

/**
 * Middle of a same-axis route. Segments are only horizontal, vertical, or 45°.
 * `along` is the exit axis; `across` is the other one.
 */
function appendSame(pts, S, E, axis, mix) {
	const along = axis === 'x' ? E[0] - S[0] : E[1] - S[1];
	const across = axis === 'x' ? E[1] - S[1] : E[0] - S[0];
	const signAlong = Math.sign(along) || 1;
	const signAcross = Math.sign(across) || mix.side;
	const La = Math.abs(along);
	const Lc = Math.abs(across);

	if (Lc < 0.08 && La > 1.5) {
		const amp = Math.min(0.62, Math.max(0.28, La * 0.11));
		if (La > 2 * amp + 0.55) {
			const lead = (La - 2 * amp) * mix.t;
			jogOut(pts, S, axis, signAlong, mix.side, amp, lead, La - 2 * amp - lead);
			pts.push(E);
			return;
		}
	}

	if (La >= Lc) {
		const spare = La - Lc;
		const lead = spare * mix.t;
		if (mix.broken && Lc > 0.85 && spare > 0.3) {
			const step = Math.min(0.32, spare * 0.28);
			const d1 = Lc * 0.46;
			const d2 = Lc - d1;
			const lead2 = Math.max(0, lead - step * 0.5);
			runDiag(pts, S, axis, signAlong, signAcross, lead2, d1);
			const mid = pts[pts.length - 1];
			const after = move(mid, axis, signAlong, step);
			pts.push(after);
			runDiag(pts, after, axis, signAlong, signAcross, 0, d2);
			const last = pts[pts.length - 1];
			pts.push(move(last, axis, signAlong, Math.max(0, La - lead2 - d1 - step - d2)));
		} else {
			runDiag(pts, S, axis, signAlong, signAcross, lead, Lc);
			const last = pts[pts.length - 1];
			pts.push(move(last, axis, signAlong, spare - lead));
		}
	} else {
		const m = Math.min(La * 0.48, Lc * 0.46, mix.t > 0.45 ? 1.15 : 0.42);
		const spare = Math.max(0, La - 2 * m);
		steep(pts, S, axis, signAlong, signAcross, spare * mix.t, m, Math.max(0, Lc - 2 * m), spare * (1 - mix.t));
	}
	pts.push(E);
}

/** One 45° turn when the trace leaves on one axis and arrives on the other. */
function appendTurn(pts, S, E, axis, mix) {
	const dx = E[0] - S[0];
	const dy = E[1] - S[1];
	const sx = Math.sign(dx) || 1;
	const sy = Math.sign(dy) || 1;
	const full = Math.min(Math.abs(dx), Math.abs(dy));
	const m = Math.min(full, Math.max(0.16, full * (0.4 + mix.t * 0.6)));
	if (axis === 'x') {
		const x1 = S[0] + sx * (Math.abs(dx) - m);
		pts.push([x1, S[1]]);
		pts.push([x1 + sx * m, S[1] + sy * m]);
		pts.push([x1 + sx * m, S[1] + sy * Math.abs(dy)]);
	} else {
		const y1 = S[1] + sy * (Math.abs(dy) - m);
		pts.push([S[0], y1]);
		pts.push([S[0] + sx * m, y1 + sy * m]);
		pts.push([S[0] + sx * Math.abs(dx), y1 + sy * m]);
	}
	pts.push(E);
}

function centerline(from, to, mix) {
	const a = from.p;
	const b = to.p;
	const span = from.axis === 'x' ? Math.abs(b[0] - a[0]) : Math.abs(b[1] - a[1]);
	let neck = Math.min(0.2, Math.max(0.06, span * 0.14));
	const place = (n) => ({
		S: from.axis === 'x' ? [a[0] + from.dir * n, a[1]] : [a[0], a[1] + from.dir * n],
		E: to.axis === 'x' ? [b[0] - to.dir * n, b[1]] : [b[0], b[1] - to.dir * n],
	});
	let { S, E } = place(neck);
	const ox = from.axis === 'x' ? from.dir : 0;
	const oy = from.axis === 'y' ? from.dir : 0;
	if ((E[0] - S[0]) * ox + (E[1] - S[1]) * oy < 0.04) {
		neck = 0.045;
		({ S, E } = place(neck));
	}
	const pts = [[a[0], a[1]], S];
	if (from.axis === to.axis) appendSame(pts, S, E, from.axis, mix);
	else appendTurn(pts, S, E, from.axis, mix);
	pts.push([b[0], b[1]]);
	return dedupe(pts);
}

/** Point just inside the face that looks toward `other`, plus the outward direction. */
export function facePoint(c, hw, hh, other) {
	const dx = other[0] - c[0];
	const dy = other[1] - c[1];
	if (Math.abs(dx) >= Math.abs(dy)) {
		const dir = Math.sign(dx || 1);
		return { p: [c[0] + dir * Math.max(hw - 0.06, 0.02), c[1]], axis: 'x', dir };
	}
	const dir = Math.sign(dy || 1);
	return { p: [c[0], c[1] + dir * Math.max(hh - 0.06, 0.02)], axis: 'y', dir };
}

/**
 * A bus of parallel traces. Every segment is horizontal, vertical, or 45°.
 * Lanes are copies of one route, shifted along the pad row, so the ribbon
 * turns together the way etched copper does.
 */
export function routeBus(add, from, to, n = 4, gap = 0.042) {
	const count = Math.max(1, n | 0);
	const mix = mixOf(from.p, to.p);
	for (let i = 0; i < count; i++) {
		const o = (i - (count - 1) / 2) * gap;
		const shift = from.axis === 'x' ? [0, o] : [o, 0];
		const endShift = to.axis === from.axis ? shift : (to.axis === 'x' ? [0, o] : [o, 0]);
		const path = centerline(
			{ p: [from.p[0] + shift[0], from.p[1] + shift[1]], axis: from.axis, dir: from.dir },
			{ p: [to.p[0] + endShift[0], to.p[1] + endShift[1]], axis: to.axis, dir: to.dir },
			mix,
		);
		if (path.length >= 2) add(path, TRACE);
	}
}

/** Route `n` traces between two component centers, landing just inside each body. */
export function linkBus(add, a, ah, b, bh, n = 4, gap = 0.04) {
	const from = facePoint(a, ah[0], ah[1], b);
	const into = facePoint(b, bh[0], bh[1], a);
	routeBus(add, from, { p: into.p, axis: into.axis, dir: -into.dir }, n, gap);
}

const PITCH = 0.12;
const INSET = 0.15;
const STUB = 0.1;
const PAD = 0.04;

function pair(cross, along, axis) {
	return axis === 'y' ? [cross, along] : [along, cross];
}

function clamp(v, lo, hi) {
	return Math.min(hi, Math.max(lo, v));
}

/**
 * Escape from `source` to the parts facing each side.
 * A pin connects to whatever sits straight ahead of it. Pins with nothing
 * ahead may jog at 45° to a neighbor on that same side. North and south
 * traces stay beyond those faces, east and west stay beside the part, so
 * the four bundles cannot cross.
 */
export function fanOut(add, source, sides) {
	const plan = [
		['n', 'y', 1],
		['s', 'y', -1],
		['e', 'x', 1],
		['w', 'x', -1],
	];
	for (const [name, axis, dir] of plan) {
		const list = sides[name];
		if (!list || !list.length) continue;
		routeSide(add, source, list, axis, dir);
	}
}

function routeSide(add, source, targets, axis, dir) {
	const alongKey = axis === 'y' ? 'y' : 'x';
	const crossKey = axis === 'y' ? 'x' : 'y';
	const halfA = axis === 'y' ? source.hh : source.hw;
	const halfC = axis === 'y' ? source.hw : source.hh;
	const srcA = source[alongKey];
	const srcC = source[crossKey];
	const face = srcA + dir * halfA;
	const pinA = face - dir * PAD;
	const c0 = srcC - halfC + INSET;
	const c1 = srcC + halfC - INSET;
	if (c1 - c0 < PITCH * 0.5) return;

	const prepared = [];
	for (const t of targets) {
		const tHalfA = axis === 'y' ? t.hh : t.hw;
		const tHalfC = axis === 'y' ? t.hw : t.hh;
		const tA = t[alongKey];
		const tC = t[crossKey];
		const near = tA - dir * tHalfA;
		const dist = (near - face) * dir;
		const landA = near + dir * PAD;
		const room = (landA - (pinA + dir * STUB)) * dir;
		if (dist < 0.12 || room < 0.08) continue;
		if (tHalfC * 2 < 0.12) continue;
		prepared.push({
			tC,
			landA,
			room,
			cMin: tC - tHalfC + 0.05,
			cMax: tC + tHalfC - 0.05,
			shift: clamp((tC - srcC) * 0.8, -Math.min(0.55, room * 0.75), Math.min(0.55, room * 0.75)),
		});
	}
	prepared.sort((a, b) => a.landA * dir - b.landA * dir);

	const pins = [];
	for (let c = c0; c <= c1 + 1e-4; c += PITCH) pins.push(c);

	const assigned = new Array(pins.length).fill(null);
	for (let i = 0; i < pins.length; i++) {
		const pinC = pins[i];
		for (const t of prepared) {
			if (pinC < t.cMin || pinC > t.cMax) continue;
			assigned[i] = { pinC, pinA, landC: pinC, landA: t.landA };
			break;
		}
	}

	function keepsOrder(index, landC) {
		const pinC = pins[index];
		for (let j = 0; j < pins.length; j++) {
			const other = assigned[j];
			if (!other) continue;
			if (pins[j] < pinC && other.landC > landC - 0.02) return false;
			if (pins[j] > pinC && other.landC < landC + 0.02) return false;
			const lo = Math.min(pinC, landC);
			const hi = Math.max(pinC, landC);
			if (pins[j] > lo + 0.02 && pins[j] < hi - 0.02) return false;
		}
		return true;
	}

	for (const t of prepared) {
		if (Math.abs(t.shift) < 0.04) continue;
		for (let i = 0; i < pins.length; i++) {
			if (assigned[i]) continue;
			const pinC = pins[i];
			const landC = pinC + t.shift;
			if (landC < t.cMin + 0.01 || landC > t.cMax - 0.01) continue;
			if (Math.abs(t.shift) > t.room - 0.04) continue;
			if (axis === 'x' && (landC < c0 - 0.02 || landC > c1 + 0.02)) continue;
			if (!keepsOrder(i, landC)) continue;
			assigned[i] = { pinC, pinA, landC, landA: t.landA };
		}
	}

	// A pin just beside a pad row may take one 45° into the nearest free pad.
	// The jog has to stay clear of every lane already used on this side.
	const extras = [];
	function laneClear(pinC, landC) {
		const lo = Math.min(pinC, landC);
		const hi = Math.max(pinC, landC);
		const nets = assigned.filter(Boolean).concat(extras);
		for (const net of nets) {
			if (Math.abs(net.landC - landC) < 0.075) return false;
			if (Math.abs(net.pinC - pinC) < 0.04) return false;
			if (net.pinC > lo + 0.03 && net.pinC < hi - 0.03) return false;
			if (net.landC > lo + 0.03 && net.landC < hi - 0.03) return false;
		}
		return true;
	}
	for (const t of prepared) {
		const maxJog = Math.min(0.2, t.room - 0.05);
		if (maxJog < 0.06) continue;
		for (const edge of [t.cMin + 0.03, t.cMax - 0.03]) {
			let best = -1;
			let bestD = maxJog;
			for (let i = 0; i < pins.length; i++) {
				if (assigned[i] || extras.some((net) => net.pinIndex === i)) continue;
				const dist = Math.abs(pins[i] - edge);
				if (dist >= 0.035 && dist <= bestD) {
					bestD = dist;
					best = i;
				}
			}
			if (best < 0 || !laneClear(pins[best], edge)) continue;
			extras.push({
				pinIndex: best,
				pinC: pins[best],
				pinA,
				landC: edge,
				landA: t.landA,
			});
		}
	}

	for (const net of assigned.filter(Boolean).concat(extras)) {
		const path = escapePath(net.pinC, net.pinA, net.landC, net.landA, axis, dir);
		if (path) add(path, TRACE);
	}
}

function escapePath(pinC, pinA, landC, landA, axis, dir) {
	const p0 = pair(pinC, pinA, axis);
	const stubA = pinA + dir * STUB;
	const p1 = pair(pinC, stubA, axis);
	const travel = Math.abs(landC - pinC);
	const along = (landA - stubA) * dir;
	if (along < travel - 0.001) return null;
	if (travel < 0.025) return dedupe([p0, p1, pair(landC, landA, axis)]);
	const kneeA = stubA + dir * travel;
	return dedupe([p0, p1, pair(landC, kneeA, axis), pair(landC, landA, axis)]);
}

export function attachTraces(group, collector) {
	const traces = collector.build();
	group.add(traces);
	group.userData.traces = traces.userData.lines;
	return group;
}
