const NS = 'http://www.w3.org/2000/svg';
const DARK = '#211E26';
const ORANGE = '#F46B1A';
const CORE_SIZE = 167.314;
const HOST_NEAR = 56;
const MERGE_BLEND = 40;
const HOST_OVERLAP = 18;
const CORE_RX = 50;
const CORE_Y = 288;
const CORE_CENTER_X = 267 + CORE_SIZE / 2;
const CORE_CENTER_Y = CORE_Y + CORE_SIZE / 2;
const CORE_LEFT_X = 150;
const PIN_X = 478;
const PIN_R = 42;
const PIN_GAP = 103.657;
const EXIT_GAP = 61.657;
const LINK_FROM_X = CORE_LEFT_X + CORE_SIZE;
const LINK_TO_X = 436;
const MARK_MID_X = (LINK_FROM_X + LINK_TO_X) / 2;

function lerpPt(a, b, t) {
	return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function pt(x, y) {
	return { x, y };
}

function circle(cx, cy, r) {
	return { cx, cy, r };
}

function coreBox(x) {
	return { x, y: CORE_Y, w: CORE_SIZE, h: CORE_SIZE, rx: CORE_RX };
}

function rectAttr({ x, y, w, h, rx }) {
	return { x, y, width: w, height: h, rx };
}

function circleAttr({ cx, cy, r }) {
	return { cx, cy, r };
}

function markAttr(mark, height) {
	return {
		x: mark.midX - mark.width / 2,
		y: mark.midY - height / 2,
		width: mark.width,
		height,
		rx: mark.width / 2
	};
}

function parseColor(value) {
	if (!value) return [244, 107, 26];
	const str = String(value).trim();
	const hex = str.match(/^#?([0-9a-f]{6})$/i);
	if (hex) {
		const h = hex[1];
		return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
	}
	const rgb = str.match(/rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)/i);
	if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
	return [244, 107, 26];
}

function toHex([r, g, b]) {
	return (
		'#' +
		[r, g, b]
			.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0'))
			.join('')
	);
}

function mixHex(a, b, t) {
	const ca = parseColor(a);
	const cb = parseColor(b);
	return toHex(ca.map((v, i) => v + (cb[i] - v) * t));
}

function isDarkColor(value) {
	const [r, g, b] = parseColor(value);
	return r + g + b < 160;
}

function readFillColor(el) {
	if (!el) return ORANGE;
	const v = gsap.getProperty(el, 'fill') || el.getAttribute('fill') || ORANGE;
	return isDarkColor(v) ? DARK : ORANGE;
}

function readCircleHost(el) {
	return {
		type: 'circle',
		cx: Number(el.getAttribute('cx')),
		cy: Number(el.getAttribute('cy')),
		r: Number(el.getAttribute('r'))
	};
}

function readRectHost(el) {
	return {
		type: 'rect',
		x: Number(el.getAttribute('x')),
		y: Number(el.getAttribute('y')),
		w: Number(el.getAttribute('width')),
		h: Number(el.getAttribute('height')),
		rx: Number(el.getAttribute('rx')) || 0
	};
}

function distToCircle(p, host) {
	return Math.abs(Math.hypot(p.x - host.cx, p.y - host.cy) - host.r);
}

function closestOnRoundedRect(rect, p) {
	const rad = Math.min(rect.rx || 0, rect.w / 2, rect.h / 2);
	const cx = rect.x + rect.w / 2;
	const cy = rect.y + rect.h / 2;
	const hx = rect.w / 2 - rad;
	const hy = rect.h / 2 - rad;
	const lx = p.x - cx;
	const ly = p.y - cy;
	if (Math.abs(lx) > hx && Math.abs(ly) > hy) {
		const ccx = cx + Math.sign(lx) * hx;
		const ccy = cy + Math.sign(ly) * hy;
		const vx = p.x - ccx;
		const vy = p.y - ccy;
		const d = Math.hypot(vx, vy) || 1;
		return { x: ccx + (vx / d) * rad, y: ccy + (vy / d) * rad };
	}
	if (Math.abs(lx) - hx > Math.abs(ly) - hy) {
		return {
			x: cx + Math.sign(lx || 1) * (rect.w / 2),
			y: Math.max(rect.y + rad, Math.min(rect.y + rect.h - rad, p.y))
		};
	}
	return {
		x: Math.max(rect.x + rad, Math.min(rect.x + rect.w - rad, p.x)),
		y: cy + Math.sign(ly || 1) * (rect.h / 2)
	};
}

function distToRect(p, host) {
	const c = closestOnRoundedRect(host, p);
	return Math.hypot(p.x - c.x, p.y - c.y);
}

function pointInRoundedRect(rect, p, pad = 0) {
	const rad = Math.min(rect.rx || 0, rect.w / 2, rect.h / 2);
	const cx = rect.x + rect.w / 2;
	const cy = rect.y + rect.h / 2;
	const qx = Math.abs(p.x - cx) - (rect.w / 2 - rad);
	const qy = Math.abs(p.y - cy) - (rect.h / 2 - rad);
	const dx = Math.max(qx, 0);
	const dy = Math.max(qy, 0);
	return Math.hypot(dx, dy) + Math.min(Math.max(qx, qy), 0) - rad <= pad;
}

function hostNearPoint(host, p) {
	if (!host) return false;
	if (host.type === 'circle') {
		return distToCircle(p, host) < HOST_NEAR || Math.hypot(p.x - host.cx, p.y - host.cy) < host.r + HOST_NEAR;
	}
	return distToRect(p, host) < HOST_NEAR || pointInRoundedRect(host, p, HOST_NEAR);
}

function liveHost(el, kind, p) {
	if (!el || !kind) return null;
	const host = kind === 'circle' ? readCircleHost(el) : readRectHost(el);
	return hostNearPoint(host, p) ? host : null;
}

function roundedRectFeature(rect, p, catchPad = 0) {
	const rad = Math.min(rect.rx || 0, rect.w / 2, rect.h / 2);
	const cx = rect.x + rect.w / 2;
	const cy = rect.y + rect.h / 2;
	const hx = rect.w / 2 - rad;
	const hy = rect.h / 2 - rad;
	const lx = p.x - cx;
	const ly = p.y - cy;
	if (Math.abs(lx) > hx - catchPad && Math.abs(ly) > hy - catchPad) {
		return {
			type: 'circle',
			cx: cx + Math.sign(lx || 1) * hx,
			cy: cy + Math.sign(ly || 1) * hy,
			r: rad
		};
	}
	if (Math.abs(lx) - hx >= Math.abs(ly) - hy) {
		return {
			type: 'line',
			origin: { x: cx + Math.sign(lx || 1) * (rect.w / 2), y: cy },
			normal: { x: Math.sign(lx) || 1, y: 0 }
		};
	}
	return {
		type: 'line',
		origin: { x: cx, y: cy + Math.sign(ly || 1) * (rect.h / 2) },
		normal: { x: 0, y: Math.sign(ly) || 1 }
	};
}

function hostFrame(host, p, catchPad = 0) {
	if (host.type === 'circle') {
		const dx = p.x - host.cx;
		const dy = p.y - host.cy;
		const d = Math.hypot(dx, dy) || 1;
		const N = { x: dx / d, y: dy / d };
		return {
			origin: { x: host.cx + N.x * host.r, y: host.cy + N.y * host.r },
			N,
			circle: host
		};
	}
	const origin = closestOnRoundedRect(host, p);
	const feature = roundedRectFeature(host, origin, catchPad);
	if (feature.type === 'circle') {
		const dx = origin.x - feature.cx;
		const dy = origin.y - feature.cy;
		const d = Math.hypot(dx, dy) || 1;
		return { origin, N: { x: dx / d, y: dy / d }, circle: feature };
	}
	return { origin, N: feature.normal, plane: { origin, normal: feature.normal } };
}

function pickRoot(t1, t2) {
	const ts = [t1, t2].filter((t) => Number.isFinite(t));
	const ahead = ts.filter((t) => t > -2);
	if (ahead.length) return ahead.reduce((a, b) => (a < b ? a : b));
	return ts.reduce((a, b) => (Math.abs(a) < Math.abs(b) ? a : b));
}

function filletVsCircle(host, origin, shaft, n, h, f, side, N) {
	const offsetX = origin.x + side * (h + f) * n.x - host.cx;
	const offsetY = origin.y + side * (h + f) * n.y - host.cy;
	const b = 2 * (offsetX * shaft.x + offsetY * shaft.y);
	const c = offsetX * offsetX + offsetY * offsetY - (host.r + f) * (host.r + f);
	const disc = b * b - 4 * c;
	if (disc < 0) return null;
	let t = pickRoot((-b - Math.sqrt(disc)) / 2, (-b + Math.sqrt(disc)) / 2);
	if (!Number.isFinite(t)) return null;
	t = Math.max(0, t);
	const F = {
		x: origin.x + side * (h + f) * n.x + t * shaft.x,
		y: origin.y + side * (h + f) * n.y + t * shaft.y
	};
	const fx = F.x - host.cx;
	const fy = F.y - host.cy;
	const fd = Math.hypot(fx, fy) || 1;
	const hostTangent = {
		x: host.cx + (fx / fd) * host.r,
		y: host.cy + (fy / fd) * host.r
	};
	return {
		F,
		r: f,
		N: { x: fx / fd, y: fy / fd },
		hostTangent,
		stripTangent: {
			x: F.x - side * f * n.x,
			y: F.y - side * f * n.y
		}
	};
}

function filletVsLine(plane, origin, shaft, n, h, f, side, N) {
	const denom = shaft.x * N.x + shaft.y * N.y;
	if (Math.abs(denom) < 1e-4) return null;
	const ox = origin.x + side * (h + f) * n.x;
	const oy = origin.y + side * (h + f) * n.y;
	let t = (f - ((ox - plane.origin.x) * N.x + (oy - plane.origin.y) * N.y)) / denom;
	if (!Number.isFinite(t) || t < -0.5) return null;
	t = Math.max(0, t);
	const F = { x: ox + t * shaft.x, y: oy + t * shaft.y };
	return {
		F,
		r: f,
		N,
		hostTangent: { x: F.x - N.x * f, y: F.y - N.y * f },
		stripTangent: { x: F.x - side * f * n.x, y: F.y - side * f * n.y }
	};
}

function filletForHost(width, host) {
	if (!host) return 0;
	if (host.type === 'circle') return Math.min(width * 1.8, host.r * 0.42, 16);
	return Math.min(width * 1.45, 12);
}

function rectCorners(rect) {
	const rad = Math.min(rect.rx || 0, rect.w / 2, rect.h / 2);
	const cx = rect.x + rect.w / 2;
	const cy = rect.y + rect.h / 2;
	const hx = rect.w / 2 - rad;
	const hy = rect.h / 2 - rad;
	return [
		{ type: 'circle', cx: cx + hx, cy: cy - hy, r: rad },
		{ type: 'circle', cx: cx + hx, cy: cy + hy, r: rad },
		{ type: 'circle', cx: cx - hx, cy: cy + hy, r: rad },
		{ type: 'circle', cx: cx - hx, cy: cy - hy, r: rad }
	];
}

function tangentOnCornerArc(p, corner, rect) {
	const dx = p.x - corner.cx;
	const dy = p.y - corner.cy;
	if (Math.abs(Math.hypot(dx, dy) - corner.r) > 2.5) return false;
	const sx = Math.sign(corner.cx - (rect.x + rect.w / 2)) || 1;
	const sy = Math.sign(corner.cy - (rect.y + rect.h / 2)) || 1;
	return Math.sign(dx) === sx && Math.sign(dy) === sy;
}

function tangentOnFiniteFlat(p, rect, plane) {
	if (!plane) return false;
	const closest = closestOnRoundedRect(rect, p);
	const feat = roundedRectFeature(rect, closest, 0.5);
	return feat.type === 'line' && feat.normal.x === plane.normal.x && feat.normal.y === plane.normal.y;
}

function tryFillet(frame, origin, shaft, n, h, f, side) {
	return frame.circle
		? filletVsCircle(frame.circle, origin, shaft, n, h, f, side, frame.N)
		: filletVsLine(frame.plane, origin, shaft, n, h, f, side, frame.N);
}

function endGeometry(origin, shaft, n, h, width, side, host) {
	const strip = {
		x: origin.x + side * h * n.x,
		y: origin.y + side * h * n.y
	};
	if (!host) return { kind: 'cap', strip, N: null };
	const f = Math.max(h * 1.2, filletForHost(width, host));
	const frame = hostFrame(host, origin, 0);
	let fil = tryFillet(frame, origin, shaft, n, h, f, side);
	let usedCircle = frame.circle || null;

	if (host.type === 'rect' && !usedCircle) {
		const lineOnFlat =
			fil &&
			tangentOnFiniteFlat(fil.hostTangent, host, frame.plane);
		let bestD = lineOnFlat
			? (fil.F.x - origin.x) ** 2 + (fil.F.y - origin.y) ** 2
			: Infinity;
		if (!lineOnFlat) fil = null;
		for (const corner of rectCorners(host)) {
			const alt = filletVsCircle(corner, origin, shaft, n, h, f, side, frame.N);
			if (!alt || !Number.isFinite(alt.F.x)) continue;
			if (!tangentOnCornerArc(alt.hostTangent, corner, host)) continue;
			const altD = (alt.F.x - origin.x) ** 2 + (alt.F.y - origin.y) ** 2;
			if (altD < bestD) {
				fil = alt;
				usedCircle = corner;
				bestD = altD;
			}
		}
	}

	if (!fil || !Number.isFinite(fil.F.x) || !Number.isFinite(fil.hostTangent.x) || !Number.isFinite(fil.stripTangent.x)) {
		return { kind: 'cap', strip, N: frame.N };
	}
	if (fil.r < 0.5) return { kind: 'cap', strip, N: frame.N };
	return { kind: 'fillet', ...fil, strip: fil.stripTangent, circle: usedCircle };
}

function svgArc(from, to, center, radius) {
	const v1x = from.x - center.x;
	const v1y = from.y - center.y;
	const v2x = to.x - center.x;
	const v2y = to.y - center.y;
	const sweep = v1x * v2y - v1y * v2x > 0 ? 1 : 0;
	const r = Math.max(radius, 0.001);
	return `A ${r} ${r} 0 0 ${sweep} ${to.x} ${to.y}`;
}

function capArc(origin, uOut, fromPt, toPt, h) {
	const mid = { x: origin.x + uOut.x * h, y: origin.y + uOut.y * h };
	const sweep =
		(fromPt.x - origin.x) * (mid.y - origin.y) - (fromPt.y - origin.y) * (mid.x - origin.x) > 0
			? 1
			: 0;
	const r = Math.max(h, 0.001);
	return `A ${r} ${r} 0 1 ${sweep} ${toPt.x} ${toPt.y}`;
}

function hostCenter(host) {
	if (!host) return null;
	if (host.type === 'circle') return { x: host.cx, y: host.cy };
	return { x: host.x + host.w / 2, y: host.y + host.h / 2 };
}

function toward(p, c, amount) {
	const dx = c.x - p.x;
	const dy = c.y - p.y;
	const d = Math.hypot(dx, dy) || 1;
	const t = Math.min(amount / d, 0.45);
	return { x: p.x + dx * t, y: p.y + dy * t };
}

function hostClose(fromT, toT, host) {
	const c = hostCenter(host);
	if (!c) return `L ${toT.x} ${toT.y}`;
	const a = toward(fromT, c, HOST_OVERLAP);
	const b = toward(toT, c, HOST_OVERLAP);
	const mid = toward({ x: (fromT.x + toT.x) / 2, y: (fromT.y + toT.y) / 2 }, c, HOST_OVERLAP * 1.35);
	return `L ${a.x} ${a.y} L ${mid.x} ${mid.y} L ${b.x} ${b.y} L ${toT.x} ${toT.y}`;
}

function buildConnectorPath(ax, ay, bx, by, width, hostA, hostB) {
	let A = { x: ax, y: ay };
	let B = { x: bx, y: by };
	if (hostA) A = hostFrame(hostA, A).origin;
	if (hostB) B = hostFrame(hostB, B).origin;

	const len = Math.hypot(B.x - A.x, B.y - A.y);
	if (width < 0.4 || len < 0.4) return '';

	const h = width / 2;
	const u = { x: (B.x - A.x) / len, y: (B.y - A.y) / len };
	const n = { x: -u.y, y: u.x };
	const uBack = { x: -u.x, y: -u.y };

	const aMinus = endGeometry(A, u, n, h, width, -1, hostA);
	const aPlus = endGeometry(A, u, n, h, width, 1, hostA);
	const bMinus = endGeometry(B, uBack, n, h, width, -1, hostB);
	const bPlus = endGeometry(B, uBack, n, h, width, 1, hostB);

	let d = '';
	const startInside =
		hostA && aMinus.kind === 'fillet'
			? toward(aMinus.hostTangent, hostCenter(hostA), HOST_OVERLAP)
			: null;
	if (aMinus.kind === 'fillet') {
		d += startInside
			? `M ${startInside.x} ${startInside.y} L ${aMinus.hostTangent.x} ${aMinus.hostTangent.y}`
			: `M ${aMinus.hostTangent.x} ${aMinus.hostTangent.y}`;
		d += svgArc(aMinus.hostTangent, aMinus.strip, aMinus.F, aMinus.r);
	} else {
		d += `M ${aMinus.strip.x} ${aMinus.strip.y}`;
	}

	d += `L ${bMinus.strip.x} ${bMinus.strip.y}`;
	if (bMinus.kind === 'fillet' && bPlus.kind === 'fillet') {
		d += svgArc(bMinus.strip, bMinus.hostTangent, bMinus.F, bMinus.r);
		d += hostClose(bMinus.hostTangent, bPlus.hostTangent, hostB);
		d += svgArc(bPlus.hostTangent, bPlus.strip, bPlus.F, bPlus.r);
	} else {
		d += capArc(B, u, bMinus.strip, bPlus.strip, h);
	}

	d += `L ${aPlus.strip.x} ${aPlus.strip.y}`;
	if (aPlus.kind === 'fillet' && aMinus.kind === 'fillet') {
		d += svgArc(aPlus.strip, aPlus.hostTangent, aPlus.F, aPlus.r);
		d += hostClose(aPlus.hostTangent, aMinus.hostTangent, hostA);
	} else {
		d += capArc(A, uBack, aPlus.strip, aMinus.strip, h);
	}
	return d + 'Z';
}

function makeGradient(id) {
	const defs = document.querySelector('#svg-stage defs');
	let g = document.getElementById(id);
	if (!g) {
		g = document.createElementNS(NS, 'linearGradient');
		g.id = id;
		g.setAttribute('gradientUnits', 'userSpaceOnUse');
		g.setAttribute('spreadMethod', 'pad');
		for (let i = 0; i < 5; i++) g.appendChild(document.createElementNS(NS, 'stop'));
		defs.appendChild(g);
	}
	return g;
}

function setStop(stop, offset, color) {
	stop.setAttribute('offset', `${Math.max(0, Math.min(1, offset)) * 100}%`);
	stop.setAttribute('stop-color', color);
}

function updateConnectorGradient(grad, from, to, fromColor, toColor) {
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	const len = Math.hypot(dx, dy) || 1;
	grad.setAttribute('x1', String(from.x));
	grad.setAttribute('y1', String(from.y));
	grad.setAttribute('x2', String(to.x));
	grad.setAttribute('y2', String(to.y));

	const fromDark = isDarkColor(fromColor);
	const toDark = isDarkColor(toColor);
	const stops = grad.children;
	const merge = Math.min(MERGE_BLEND, len * 0.28);

	if (fromDark && toDark) {
		const tip = Math.min(10, len * 0.1);
		const tA = tip / len;
		const tB = 1 - tip / len;
		setStop(stops[0], 0, fromColor);
		setStop(stops[1], tA * 0.4, mixHex(fromColor, ORANGE, 0.5));
		setStop(stops[2], tA, ORANGE);
		setStop(stops[3], tB, ORANGE);
		setStop(stops[4], 1, toColor);
		return;
	}

	if (fromDark) {
		const t1 = merge / len;
		setStop(stops[0], 0, fromColor);
		setStop(stops[1], t1 * 0.12, fromColor);
		setStop(stops[2], t1 * 0.52, mixHex(fromColor, ORANGE, 0.45));
		setStop(stops[3], t1, ORANGE);
		setStop(stops[4], 1, toColor);
		return;
	}

	if (toDark) {
		const t1 = 1 - merge / len;
		setStop(stops[0], 0, fromColor);
		setStop(stops[1], t1, ORANGE);
		setStop(stops[2], t1 + (1 - t1) * 0.48, mixHex(toColor, ORANGE, 0.55));
		setStop(stops[3], 1 - (1 - t1) * 0.12, toColor);
		setStop(stops[4], 1, toColor);
		return;
	}

	setStop(stops[0], 0, fromColor);
	setStop(stops[1], 0.25, fromColor);
	setStop(stops[2], 0.5, ORANGE);
	setStop(stops[3], 0.75, toColor);
	setStop(stops[4], 1, toColor);
}

const connectors = new Map();

function bindConnector(el, fromHostEl, fromKind, toHostEl, toKind) {
	if (!el) return;
	const grad = makeGradient(`grad-${el.id}`);
	el.setAttribute('fill', `url(#${grad.id})`);
	connectors.set(el, {
		el,
		grad,
		fromHostEl,
		fromKind,
		toHostEl,
		toKind,
		x1: 0,
		y1: 0,
		x2: 0,
		y2: 0,
		w: 0
	});
}

function renderConnector(el) {
	const c = connectors.get(el);
	if (!c) return;
	const from = { x: c.x1, y: c.y1 };
	const to = { x: c.x2, y: c.y2 };
	const hostA = liveHost(c.fromHostEl, c.fromKind, from);
	const hostB = liveHost(c.toHostEl, c.toKind, to);
	const d = buildConnectorPath(c.x1, c.y1, c.x2, c.y2, c.w, hostA, hostB);
	el.setAttribute('d', d);
	el.removeAttribute('stroke');
	el.removeAttribute('stroke-width');
	el.removeAttribute('stroke-linejoin');
	const fromColor = hostA ? readFillColor(c.fromHostEl) : ORANGE;
	const toColor = hostB ? readFillColor(c.toHostEl) : ORANGE;
	const gradFrom = hostA ? hostFrame(hostA, from).origin : from;
	const gradTo = hostB ? hostFrame(hostB, to).origin : to;
	updateConnectorGradient(c.grad, gradFrom, gradTo, fromColor, toColor);
}

function connectorProxy(el) {
	return connectors.get(el);
}

function connectorVars(el, from, to, width, extra = {}) {
	return {
		x1: from.x,
		y1: from.y,
		x2: to.x,
		y2: to.y,
		w: width,
		onUpdate: () => renderConnector(el),
		...extra
	};
}

/** Form cluster (index 0) */
const BLOBS = [
	{
		start: circle(400, 322, 34),
		attached: circle(455, 275, 50),
		stretch: circle(470, 210, 48),
		released: circle(443.2, 119.2, 59.5)
	},
	{
		start: circle(301, 322, 34),
		attached: circle(245, 275, 50),
		stretch: circle(175, 195, 44),
		released: circle(106.2, 109.2, 42.5)
	},
	{
		start: circle(301, 420, 34),
		attached: circle(245, 468, 50),
		stretch: circle(230, 560, 52),
		released: circle(247.2, 645.2, 59.5)
	},
	{
		start: circle(400, 420, 34),
		attached: circle(455, 468, 50),
		stretch: circle(485, 500, 44),
		released: circle(499.2, 512.2, 43)
	}
];

const CORE = {
	rest: coreBox(267),
	pinched: { x: 274, y: 295, w: 153.314, h: 153.314, rx: 48 }
};

/**
 * Exit on the rounded square (rx=50), not the AABB.
 * Near corners the AABB overshoots outside the visible squircle.
 */
function squareExit(ux, uy) {
	const half = CORE_SIZE / 2;
	const r = CORE_RX;
	const flat = half - r;

	let tBox = Infinity;
	if (ux > 0) tBox = Math.min(tBox, half / ux);
	else if (ux < 0) tBox = Math.min(tBox, -half / ux);
	if (uy > 0) tBox = Math.min(tBox, half / uy);
	else if (uy < 0) tBox = Math.min(tBox, -half / uy);

	const lx = ux * tBox;
	const ly = uy * tBox;
	const onVertical = Math.abs(Math.abs(lx) - half) < 0.01;
	const onHorizontal = Math.abs(Math.abs(ly) - half) < 0.01;
	const inCorner =
		(onVertical && Math.abs(ly) > flat) || (onHorizontal && Math.abs(lx) > flat);

	let t = tBox;
	if (inCorner) {
		const cornerOx = Math.sign(lx || ux) * flat;
		const cornerOy = Math.sign(ly || uy) * flat;
		const b = -2 * (ux * cornerOx + uy * cornerOy);
		const c = cornerOx * cornerOx + cornerOy * cornerOy - r * r;
		const disc = Math.max(0, b * b - 4 * c);
		const sqrt = Math.sqrt(disc);
		const t1 = (-b - sqrt) / 2;
		const t2 = (-b + sqrt) / 2;
		const candidates = [t1, t2].filter((v) => v > 0);
		t = candidates.length ? Math.min(...candidates) : tBox;
	}

	return pt(CORE_CENTER_X + ux * t, CORE_CENTER_Y + uy * t);
}

function buildColinearTendril(blob, orderExitY) {
	const dx = blob.home.cx - CORE_CENTER_X;
	const dy = blob.home.cy - CORE_CENTER_Y;
	const len = Math.hypot(dx, dy) || 1;
	const ux = dx / len;
	const uy = dy / len;

	const coreFrom = squareExit(ux, uy);
	const ballFrom = pt(blob.home.cx - ux * blob.home.r, blob.home.cy - uy * blob.home.r);
	const meet = lerpPt(coreFrom, ballFrom, 0.5);
	const orderFrom = pt(LINK_FROM_X, orderExitY ?? blob.order.cy);
	const orderTo = pt(blob.order.cx - blob.order.r, blob.order.cy);

	return { coreFrom, ballFrom, meet, orderFrom, orderTo };
}

const S2_BLOBS = [
	{ home: circle(443.2, 119.2, 59.5), order: circle(PIN_X, CORE_CENTER_Y - PIN_GAP, PIN_R) },
	{ home: circle(247.2, 645.2, 59.5), order: circle(PIN_X, CORE_CENTER_Y, PIN_R) },
	{ home: circle(499.2, 512.2, 43), order: circle(PIN_X, CORE_CENTER_Y + PIN_GAP, PIN_R) }
];

const S2 = {
	core: { center: coreBox(267), left: coreBox(CORE_LEFT_X) },
	blobs: S2_BLOBS,
	softOpacity: [0.3, 0.2, 0.2, 0.2, 0.2],
	tendrils: [
		buildColinearTendril(S2_BLOBS[0], CORE_CENTER_Y - EXIT_GAP),
		buildColinearTendril(S2_BLOBS[1], CORE_CENTER_Y),
		buildColinearTendril(S2_BLOBS[2], CORE_CENTER_Y + EXIT_GAP)
	],
	stroke: { connect: 8, order: 8 }
};

const S3 = {
	core: coreBox(CORE_LEFT_X),
	balls: [
		{ full: circle(PIN_X, CORE_CENTER_Y - PIN_GAP, PIN_R), pale: circle(PIN_X, CORE_CENTER_Y - PIN_GAP, 28) },
		{ full: circle(PIN_X, CORE_CENTER_Y, PIN_R), pale: circle(PIN_X, CORE_CENTER_Y, PIN_R) },
		{ full: circle(PIN_X, CORE_CENTER_Y + PIN_GAP, PIN_R), pale: circle(PIN_X, CORE_CENTER_Y + PIN_GAP, 28) }
	],
	links: [
		{ from: pt(LINK_FROM_X, CORE_CENTER_Y - EXIT_GAP), to: pt(LINK_TO_X, CORE_CENTER_Y - PIN_GAP), stub: pt(340, CORE_CENTER_Y - 55) },
		{ from: pt(LINK_FROM_X, CORE_CENTER_Y), to: pt(LINK_TO_X, CORE_CENTER_Y), stub: pt(340, CORE_CENTER_Y) },
		{ from: pt(LINK_FROM_X, CORE_CENTER_Y + EXIT_GAP), to: pt(LINK_TO_X, CORE_CENTER_Y + PIN_GAP), stub: pt(340, CORE_CENTER_Y + 55) }
	],
	mark: { midX: MARK_MID_X, midY: CORE_CENTER_Y, tickH: 104, width: 10 },
	stroke: { full: 8, thin: 6, stub: 7 }
};

const S4 = {
	core: coreBox(CORE_LEFT_X),
	ball: circle(PIN_X, CORE_CENTER_Y, PIN_R),
	link: { from: pt(LINK_FROM_X, CORE_CENTER_Y), to: pt(LINK_TO_X, CORE_CENTER_Y), stroke: 6 },
	mark: { midX: MARK_MID_X, midY: CORE_CENTER_Y, tickH: 104, width: 10 },
	orbit: {
		cx: 351,
		cy: CORE_CENTER_Y,
		rx: 301.7,
		ry: 189.15,
		stroke: 3.1,
		revealRx: 586,
		revealRy: 367
	},
	seed: {
		lozenge: { rx: 18, ry: 12 },
		circle: { r: 19 }
	}
};

function orbitPoint(angle) {
	return pt(S4.orbit.cx + S4.orbit.rx * Math.cos(angle), S4.orbit.cy + S4.orbit.ry * Math.sin(angle));
}

function orbitEllipse(rx = S4.orbit.rx, ry = S4.orbit.ry) {
	return { cx: S4.orbit.cx, cy: S4.orbit.cy, rx, ry, 'stroke-width': S4.orbit.stroke };
}

const FINAL_HOLD = 1.85;
const ACC_EASE = 'power3.out';
const ACC_DUR = 0.45;
const HANDOFF_DUR = 0.55;
const CROSSFADE_DUR = 0.4;
const SETTLE_DUR = 0.65;

const items = Array.from(document.querySelectorAll('.acc-item'));
const visualObject = document.querySelector('#visual-object');
const BOARD_ELS = [0, 1, 2, 3].map((_, i) =>
	document.querySelector(['#story-metaball', '#story-signal', '#story-converge', '#story-orbit'][i])
);

const gooGroup = document.querySelector('#goo-group');
const metaCore = document.querySelector('#meta-core');
const softDots = document.querySelector('#soft-dots');
const gooBlur = document.querySelector('#goo feGaussianBlur');
const blobEls = [0, 1, 2, 3].map((i) => document.querySelector(`#blob-${i}`));

const s2Core = document.querySelector('#s2-core');
const s2Soft = document.querySelector('#s2-soft');
const s2SoftCircles = s2Soft ? s2Soft.querySelectorAll('circle') : [];
const s2BlobEls = [0, 1, 2].map((i) => document.querySelector(`#s2-blob-${i}`));
const s2CoreTendrilEls = [0, 1, 2].map((i) => document.querySelector(`#s2-t${i}`));
const s2BallTendrilEls = [0, 1, 2].map((i) => document.querySelector(`#s2-b${i}`));
const s2FloatEls = Array.from(document.querySelectorAll('#story-signal .s2-float'));

const s3Core = document.querySelector('#s3-core');
const s3Mark = document.querySelector('#s3-mark');
const s3BallEls = [0, 1, 2].map((i) => document.querySelector(`#s3-ball-${i}`));
const s3LinkEls = [0, 1, 2].map((i) => document.querySelector(`#s3-l${i}`));

const s4Core = document.querySelector('#s4-core');
const s4Ball = document.querySelector('#s4-ball');
const s4Link = document.querySelector('#s4-link');
const s4Mark = document.querySelector('#s4-mark');
const s4Orbit = document.querySelector('#s4-orbit');
const s4Seed = document.querySelector('#s4-seed');

s2CoreTendrilEls.forEach((el, i) => bindConnector(el, s2Core, 'rect', s2BlobEls[i], 'circle'));
s2BallTendrilEls.forEach((el, i) => bindConnector(el, s2BlobEls[i], 'circle', null, null));
s3LinkEls.forEach((el, i) => bindConnector(el, s3Core, 'rect', s3BallEls[i], 'circle'));
bindConnector(s4Link, s4Core, 'rect', s4Ball, 'circle');

let activeIndex = -1;
let visualIndex = -1;
let morphTl = null;
let s2FloatTl = null;
let transitionTl = null;
let transitionGen = 0;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const gooState = { blur: 16 };

function killMorph() {
	if (morphTl) {
		morphTl.kill();
		morphTl = null;
	}
	killSignalFloat();
}

function killLayerTweens() {
	BOARD_ELS.forEach((el) => el && gsap.killTweensOf(el));
}

function killTransition() {
	if (transitionTl) {
		transitionTl.kill();
		transitionTl = null;
	}
	killLayerTweens();
}

function killSignalFloat() {
	if (s2FloatTl) {
		s2FloatTl.kill();
		s2FloatTl = null;
	}
	s2FloatEls.forEach((el) => gsap.set(el, { y: 0 }));
}

function setGooBlur(value) {
	gooState.blur = value;
	if (gooBlur) gooBlur.setAttribute('stdDeviation', String(Math.max(0, value)));
	if (gooGroup) {
		if (value < 0.5) gooGroup.removeAttribute('filter');
		else gooGroup.setAttribute('filter', 'url(#goo)');
	}
}

function tweenGoo(tl, blur, duration, ease, pos) {
	const vars = { blur, duration, onUpdate: () => setGooBlur(gooState.blur) };
	if (ease) vars.ease = ease;
	tl.to(gooState, vars, pos);
}

function loopTl(extra = {}) {
	morphTl = gsap.timeline({ repeat: -1, defaults: { ease: 'power2.inOut' }, ...extra });
	return morphTl;
}

function hold(tl, duration) {
	tl.to({}, { duration });
}

function boardEl(index) {
	return BOARD_ELS[index] || null;
}

function hideLayer(el) {
	if (!el) return;
	gsap.killTweensOf(el);
	el.classList.remove('is-active');
	gsap.set(el, { opacity: 0 });
	el.style.visibility = 'hidden';
	el.setAttribute('visibility', 'hidden');
	el.setAttribute('display', 'none');
}

function revealLayer(el, opacity = 1) {
	if (!el) return;
	el.classList.add('is-active');
	el.removeAttribute('display');
	el.style.visibility = 'visible';
	el.setAttribute('visibility', 'visible');
	gsap.set(el, { opacity });
}

function isolateLayer(el) {
	BOARD_ELS.forEach((layer) => {
		if (layer === el) revealLayer(layer, 1);
		else hideLayer(layer);
	});
}

function beginBoard(index, skipSetup, resetFn) {
	if (!skipSetup) {
		isolateLayer(boardEl(index));
		resetFn();
	}
}

function setCircle(el, state, color) {
	const props = { attr: circleAttr(state) };
	if (color) props.fill = color;
	gsap.set(el, props);
}

function setCoreEl(el, state) {
	gsap.set(el, { attr: rectAttr(state), fill: DARK });
}

function setTendril(el, from, to, width) {
	const c = connectorProxy(el);
	if (!c) return;
	c.x1 = from.x;
	c.y1 = from.y;
	c.x2 = to.x;
	c.y2 = to.y;
	c.w = width;
	renderConnector(el);
}

function setMarkEl(el, mark, height, opacity = 1) {
	gsap.set(el, { attr: markAttr(mark, height), opacity, fill: ORANGE });
}

function setMark(height, opacity = 1) {
	setMarkEl(s3Mark, S3.mark, height, opacity);
}

/** Instant pose for handoff / jump landing. pose: 'start' | 'end' */
function snapBoard(index, pose) {
	if (index === 0) {
		if (pose === 'start') {
			resetMetaballScene();
			return;
		}
		setGooBlur(0);
		setCoreEl(metaCore, CORE.rest);
		blobEls.forEach((el, i) => setCircle(el, BLOBS[i].released, ORANGE));
		gsap.set(softDots, { opacity: 1 });
		return;
	}

	if (index === 1) {
		if (pose === 'start') {
			resetSignalScene();
			return;
		}
		setCoreEl(s2Core, S2.core.left);
		s2BlobEls.forEach((el, i) => setCircle(el, S2.blobs[i].order, ORANGE));
		s2CoreTendrilEls.forEach((el, i) => {
			const t = S2.tendrils[i];
			setTendril(el, t.orderFrom, t.orderTo, S2.stroke.order);
		});
		s2BallTendrilEls.forEach((el, i) => {
			const t = S2.tendrils[i];
			setTendril(el, t.ballFrom, t.ballFrom, 0);
		});
		gsap.set(s2Soft, { opacity: 0 });
		setSoftOpacities([0, 0, 0, 0, 0]);
		s2FloatEls.forEach((el) => gsap.set(el, { y: 0 }));
		return;
	}

	if (index === 2) {
		if (pose === 'start') {
			resetConvergeScene();
			return;
		}
		setCoreEl(s3Core, S3.core);
		s3BallEls.forEach((el, i) => {
			if (i === 1) {
				setCircle(el, S3.balls[1].full, DARK);
				gsap.set(el, { opacity: 1 });
			} else {
				setCircle(el, S3.balls[i].pale, ORANGE);
				gsap.set(el, { opacity: 0 });
			}
		});
		s3LinkEls.forEach((el, i) => {
			const L = S3.links[i];
			if (i === 1) {
				setTendril(el, L.from, L.to, S3.stroke.thin);
				gsap.set(el, { opacity: 1 });
			} else {
				setTendril(el, L.from, L.from, 0);
				gsap.set(el, { opacity: 0 });
			}
		});
		setMark(S3.mark.tickH, 1);
		return;
	}

	if (index === 3) {
		// Orbit start ≡ converge end; orbit "end" = settled ellipse + seed at left
		if (pose === 'start') {
			resetOrbitScene();
			return;
		}
		setCoreEl(s4Core, S4.core);
		setCircle(s4Ball, S4.ball, DARK);
		setTendril(s4Link, S4.link.from, S4.link.to, S4.link.stroke);
		gsap.set(s4Mark, { opacity: 0, attr: { height: 0, y: S4.mark.midY } });
		gsap.set(s4Orbit, { opacity: 1, attr: orbitEllipse() });
		setOrbitSeed(-Math.PI, S4.seed.circle.r, S4.seed.circle.r, 1);
	}
}

/** Tween current board toward start/end. Returns a timeline. */
function tweenBoard(index, pose, duration = HANDOFF_DUR) {
	const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });

	if (index === 0) {
		if (pose === 'end') {
			tl.to(
				gooState,
				{
					blur: 0,
					duration: duration * 0.45,
					ease: 'power2.in',
					onUpdate: () => setGooBlur(gooState.blur)
				},
				0
			);
			tl.to(
				metaCore,
				{
					attr: {
						x: CORE.rest.x,
						y: CORE.rest.y,
						width: CORE.rest.w,
						height: CORE.rest.h,
						rx: CORE.rest.rx
					},
					duration,
					ease: 'power3.out'
				},
				0
			);
			blobEls.forEach((el, i) => {
				const r = BLOBS[i].released;
				tl.to(el, { attr: { cx: r.cx, cy: r.cy, r: r.r }, fill: ORANGE, duration, ease: 'power3.out' }, 0);
			});
			tl.to(softDots, { opacity: 1, duration: duration * 0.7, ease: 'power2.out' }, 0);
		} else {
			tl.to(
				gooState,
				{
					blur: 16,
					duration: duration * 0.5,
					onUpdate: () => setGooBlur(gooState.blur)
				},
				0
			);
			blobEls.forEach((el, i) => {
				const s = BLOBS[i].start;
				tl.to(el, { attr: { cx: s.cx, cy: s.cy, r: s.r }, fill: DARK, duration, ease: 'power3.inOut' }, 0);
			});
			tl.to(softDots, { opacity: 0, duration: duration * 0.4, ease: 'power2.in' }, 0);
		}
		return tl;
	}

	if (index === 1) {
		killSignalFloat();
		s2FloatEls.forEach((el) => gsap.set(el, { y: 0 }));
		if (pose === 'end') {
			tl.to(
				s2Core,
				{
					attr: {
						x: S2.core.left.x,
						y: S2.core.left.y,
						width: S2.core.left.w,
						height: S2.core.left.h,
						rx: S2.core.left.rx
					},
					duration
				},
				0
			);
			s2BlobEls.forEach((el, i) => {
				const b = S2.blobs[i].order;
				tl.to(el, { attr: { cx: b.cx, cy: b.cy, r: b.r }, duration }, 0);
			});
			s2CoreTendrilEls.forEach((el, i) => {
				const t = S2.tendrils[i];
				tl.to(connectorProxy(el), connectorVars(el, t.orderFrom, t.orderTo, S2.stroke.order, { duration }), 0);
			});
			s2BallTendrilEls.forEach((el, i) => {
				const t = S2.tendrils[i];
				tl.to(
					connectorProxy(el),
					connectorVars(el, t.ballFrom, t.ballFrom, 0, { duration: duration * 0.5 }),
					0
				);
			});
			tl.to(s2Soft, { opacity: 0, duration: duration * 0.6 }, 0);
			tl.to(s2Soft.querySelectorAll('circle'), { opacity: 0, duration: duration * 0.6 }, 0);
		} else {
			tl.to(
				s2Core,
				{
					attr: {
						x: S2.core.center.x,
						y: S2.core.center.y,
						width: S2.core.center.w,
						height: S2.core.center.h,
						rx: S2.core.center.rx
					},
					duration
				},
				0
			);
			s2BlobEls.forEach((el, i) => {
				const b = S2.blobs[i].home;
				tl.to(el, { attr: { cx: b.cx, cy: b.cy, r: b.r }, duration }, 0);
			});
			s2CoreTendrilEls.forEach((el, i) => {
				const t = S2.tendrils[i];
				tl.to(
					connectorProxy(el),
					connectorVars(el, t.coreFrom, t.coreFrom, 0, { duration: duration * 0.55 }),
					0
				);
			});
			s2BallTendrilEls.forEach((el, i) => {
				const t = S2.tendrils[i];
				tl.to(
					connectorProxy(el),
					connectorVars(el, t.ballFrom, t.ballFrom, 0, { duration: duration * 0.45 }),
					0
				);
			});
			tl.set(s2Soft, { opacity: 1 }, 0);
			tl.to(
				s2Soft.querySelectorAll('circle'),
				{ opacity: (i) => S2.softOpacity[i], duration: duration * 0.7, ease: 'power2.out' },
				0
			);
		}
		return tl;
	}

	if (index === 2) {
		if (pose === 'end') {
			[0, 2].forEach((i) => {
				const L = S3.links[i];
				tl.to(
					connectorProxy(s3LinkEls[i]),
					{
						x2: L.from.x,
						y2: L.from.y,
						w: 0,
						duration,
						onUpdate: () => renderConnector(s3LinkEls[i])
					},
					0
				);
				tl.to(s3LinkEls[i], { opacity: 0, duration }, 0);
				tl.to(s3BallEls[i], { opacity: 0, duration }, 0);
			});
			tl.to(
				s3BallEls[1],
				{ fill: DARK, duration, onUpdate: () => renderConnector(s3LinkEls[1]) },
				0
			);
			tl.to(
				connectorProxy(s3LinkEls[1]),
				{ w: S3.stroke.thin, duration, onUpdate: () => renderConnector(s3LinkEls[1]) },
				0
			);
			tl.to(s3LinkEls[1], { opacity: 1, duration }, 0);
			tl.to(
				s3Mark,
				{
					attr: {
						x: S3.mark.midX - S3.mark.width / 2,
						y: S3.mark.midY - S3.mark.tickH / 2,
						width: S3.mark.width,
						height: S3.mark.tickH,
						rx: S3.mark.width / 2
					},
					opacity: 1,
					duration,
					ease: 'power3.out'
				},
				0
			);
		} else {
			tl.to(s3Mark, { opacity: 0, attr: { height: 0, y: S3.mark.midY }, duration: duration * 0.45 }, 0);
			tl.to(
				s3BallEls[1],
				{ fill: ORANGE, duration, onUpdate: () => renderConnector(s3LinkEls[1]) },
				0
			);
			[0, 1, 2].forEach((i) => {
				const L = S3.links[i];
				const B = S3.balls[i].full;
				tl.to(
					connectorProxy(s3LinkEls[i]),
					connectorVars(s3LinkEls[i], L.from, L.to, S3.stroke.full, { duration }),
					0
				);
				tl.to(s3LinkEls[i], { opacity: 1, duration }, 0);
				tl.to(
					s3BallEls[i],
					{ attr: { cx: B.cx, cy: B.cy, r: B.r }, opacity: 1, fill: ORANGE, duration },
					0
				);
			});
		}
		return tl;
	}

	if (index === 3) {
		if (pose === 'start') {
			tl.to(s4Seed, { opacity: 0, attr: { rx: 0, ry: 0 }, duration: duration * 0.45 }, 0);
			tl.to(
				s4Orbit,
				{
					opacity: 0,
					attr: { rx: S4.orbit.revealRx, ry: S4.orbit.revealRy },
					duration
				},
				0
			);
			tl.to(
				s4Mark,
				{
					attr: {
						x: S4.mark.midX - S4.mark.width / 2,
						y: S4.mark.midY - S4.mark.tickH / 2,
						width: S4.mark.width,
						height: S4.mark.tickH,
						rx: S4.mark.width / 2
					},
					opacity: 1,
					duration,
					ease: 'power3.out'
				},
				0
			);
			tl.to(s4Ball, { fill: DARK, duration: duration * 0.5 }, 0);
		} else {
			tl.to(s4Mark, { opacity: 0, attr: { height: 0, y: S4.mark.midY }, duration: duration * 0.4 }, 0);
			tl.to(
				s4Orbit,
				{
					opacity: 1,
					attr: { rx: S4.orbit.rx, ry: S4.orbit.ry },
					duration
				},
				0
			);
			const left = orbitPoint(-Math.PI);
			tl.to(
				s4Seed,
				{
					opacity: 1,
					attr: { cx: left.x, cy: left.y, rx: S4.seed.circle.r, ry: S4.seed.circle.r },
					duration
				},
				0
			);
		}
		return tl;
	}

	return tl;
}

function crossfadeLayers(fromEl, toEl, duration = CROSSFADE_DUR) {
	const tl = gsap.timeline();
	if (toEl) {
		revealLayer(toEl, 0);
		tl.to(toEl, { opacity: 1, duration, ease: 'power2.inOut' }, 0);
	}
	if (fromEl && fromEl !== toEl) {
		revealLayer(fromEl, Number(gsap.getProperty(fromEl, 'opacity')) || 1);
		tl.to(fromEl, {
			opacity: 0,
			duration,
			ease: 'power2.inOut',
			onComplete: () => hideLayer(fromEl)
		}, 0);
	}
	return tl;
}

/**
 * Adjacent: handoff poses + crossfade.
 * Jump: dissolve into destination start.
 */
function transitionToBoard(fromIndex, toIndex) {
	killMorph();
	killTransition();
	const gen = ++transitionGen;
	const fromEl = boardEl(fromIndex);
	const toEl = boardEl(toIndex);

	const finishPlay = (prepared) => {
		if (gen !== transitionGen) return;
		transitionTl = null;
		isolateLayer(toEl);
		visualIndex = toIndex;
		playStoryboard(toIndex, { prepared, skipPunch: true });
	};

	if (reducedMotion || fromIndex < 0) {
		isolateLayer(toEl);
		finishPlay(false);
		return;
	}

	// Drop any leftover layers from an interrupted transition; keep only the source.
	isolateLayer(fromEl);

	const delta = toIndex - fromIndex;
	const adjacent = Math.abs(delta) === 1;

	transitionTl = gsap.timeline({
		onComplete: () => finishPlay(true)
	});

	if (adjacent && delta === 1) {
		// Forward handoff: from → end, to @ start
		transitionTl.add(tweenBoard(fromIndex, 'end', HANDOFF_DUR));
		transitionTl.call(() => {
			snapBoard(toIndex, 'start');
			revealLayer(toEl, 0);
		});
		transitionTl.add(crossfadeLayers(fromEl, toEl, CROSSFADE_DUR));
		return;
	}

	if (adjacent && delta === -1) {
		// Back handoff: from → start, land on to @ end, settle to start, then play
		transitionTl.add(tweenBoard(fromIndex, 'start', HANDOFF_DUR));
		transitionTl.call(() => {
			snapBoard(toIndex, 'end');
			revealLayer(toEl, 0);
		});
		transitionTl.add(crossfadeLayers(fromEl, toEl, CROSSFADE_DUR));
		transitionTl.add(tweenBoard(toIndex, 'start', SETTLE_DUR));
		return;
	}

	// Jump / skip: soft dissolve into destination start
	transitionTl.to(fromEl, { opacity: 0, duration: CROSSFADE_DUR, ease: 'power2.in' });
	transitionTl.call(() => {
		hideLayer(fromEl);
		snapBoard(toIndex, 'start');
		revealLayer(toEl, 0);
	});
	transitionTl.to(toEl, { opacity: 1, duration: CROSSFADE_DUR, ease: 'power2.out' });
}

function resetMetaballScene() {
	setGooBlur(16);
	setCoreEl(metaCore, CORE.rest);
	blobEls.forEach((el, i) => setCircle(el, BLOBS[i].start, DARK));
	gsap.set(softDots, { opacity: 0 });
	gsap.set(blobEls, { opacity: 1, scale: 1, transformOrigin: '50% 50%' });
}

function playMetaballStoryboard({ skipSetup = false } = {}) {
	beginBoard(0, skipSetup, resetMetaballScene);

	if (reducedMotion) {
		blobEls.forEach((el, i) => setCircle(el, BLOBS[i].released, ORANGE));
		setGooBlur(0);
		gsap.set(softDots, { opacity: 1 });
		return;
	}

	morphTl = loopTl();

	morphTl.to({}, { duration: 0.6 });

	morphTl.to(metaCore, { attr: rectAttr(CORE.pinched), duration: 1.25, ease: 'power3.inOut' }, 'bulge');

	blobEls.forEach((el, i) => {
		const a = BLOBS[i].attached;
		morphTl.to(el, { attr: circleAttr(a), duration: 1.25, ease: 'power3.inOut' }, 'bulge');
	});

	morphTl.to({}, { duration: 0.6 });

	const stretch = 'stretch';
	blobEls.forEach((el, i) => {
		const s = BLOBS[i].stretch;
		morphTl.to(el, { attr: circleAttr(s), duration: 0.65, ease: 'power2.in' }, stretch);
	});

	tweenGoo(morphTl, 8, 0.65, 'power2.in', stretch);

	const release = 'release';
	tweenGoo(morphTl, 0, 0.28, 'power4.in', release);

	morphTl.to(metaCore, { attr: rectAttr(CORE.rest), duration: 0.8, ease: 'power3.out' }, release);

	blobEls.forEach((el, i) => {
		const r = BLOBS[i].released;
		morphTl.to(el, { attr: circleAttr(r), duration: 0.95, ease: 'back.out(1.2)' }, release);
		morphTl.to(el, { fill: ORANGE, duration: 0.5, ease: 'power2.out' }, 'release+=0.3');
	});

	morphTl.to(softDots, { opacity: 1, duration: 0.55, ease: 'power2.out' }, 'release+=0.4');
	morphTl.to({}, { duration: FINAL_HOLD });
	morphTl.to(softDots, { opacity: 0, duration: 0.35, ease: 'power2.in' });

	tweenGoo(morphTl, 16, 0.22, undefined, 'reabsorb');

	blobEls.forEach((el, i) => {
		const s = BLOBS[i].start;
		morphTl.to(el, { attr: circleAttr(s), fill: DARK, duration: 0.95, ease: 'power3.inOut' }, 'reabsorb');
	});

	morphTl.to(metaCore, { attr: rectAttr(CORE.rest), duration: 0.95, ease: 'power3.inOut' }, 'reabsorb');
}

function setSoftOpacities(values) {
	if (!s2Soft) return;
	s2SoftCircles.forEach((el, i) => {
		gsap.set(el, { opacity: values[i] ?? 0.2 });
	});
}

function startSignalFloat() {
	killSignalFloat();
	if (reducedMotion) return;

	s2FloatTl = gsap.timeline();
	s2FloatEls.forEach((el) => {
		const amp = Number(el.dataset.amp || 4);
		const dur = Number(el.dataset.dur || 2.2);
		const delay = Number(el.dataset.delay || 0);
		s2FloatTl.to(
			el,
			{
				y: amp,
				duration: dur,
				ease: 'sine.inOut',
				yoyo: true,
				repeat: -1,
				delay
			},
			0
		);
	});
}

function pauseSignalFloat() {
	if (s2FloatTl) s2FloatTl.pause();
	s2FloatEls.forEach((el) => gsap.to(el, { y: 0, duration: 0.35, ease: 'power2.out' }));
}

function resetSignalScene() {
	setCoreEl(s2Core, S2.core.center);
	s2BlobEls.forEach((el, i) => setCircle(el, S2.blobs[i].home, ORANGE));
	s2CoreTendrilEls.forEach((el, i) => {
		const t = S2.tendrils[i];
		setTendril(el, t.coreFrom, t.coreFrom, 0);
	});
	s2BallTendrilEls.forEach((el, i) => {
		const t = S2.tendrils[i];
		setTendril(el, t.ballFrom, t.ballFrom, 0);
	});
	gsap.set(s2Soft, { opacity: 1 });
	setSoftOpacities(S2.softOpacity);
	s2FloatEls.forEach((el) => gsap.set(el, { y: 0 }));
}

/**
 * Disperse → staggered mutual reach (no mid-hold) → stacked exits
 */
function playSignalStoryboard({ skipSetup = false } = {}) {
	beginBoard(1, skipSetup, resetSignalScene);

	if (reducedMotion) {
		setCoreEl(s2Core, S2.core.left);
		s2BlobEls.forEach((el, i) => setCircle(el, S2.blobs[i].order, ORANGE));
		s2CoreTendrilEls.forEach((el, i) => {
			const t = S2.tendrils[i];
			setTendril(el, t.orderFrom, t.orderTo, S2.stroke.order);
		});
		s2BallTendrilEls.forEach((el, i) => {
			const t = S2.tendrils[i];
			setTendril(el, t.ballFrom, t.ballFrom, 0);
		});
		gsap.set(s2Soft, { opacity: 0 });
		return;
	}

	startSignalFloat();

	morphTl = loopTl({
		onRepeat: () => {
			startSignalFloat();
		}
	});

	const PAIR_ORDER = [0, 2, 1];
	const PAIR_STAGGER = 0.22;
	const REACH_DUR = 0.72;
	const UNIFY_AT = 0.5;

	// Brief scatter beat, then connections start immediately
	morphTl.to({}, { duration: 0.32 });

	const reach = 'reach';
	morphTl.call(pauseSignalFloat, null, reach);

	PAIR_ORDER.forEach((i, slot) => {
		const t = S2.tendrils[i];
		const at = `${reach}+=${slot * PAIR_STAGGER}`;
		const unifyAt = `${reach}+=${slot * PAIR_STAGGER + UNIFY_AT}`;

		morphTl.fromTo(
			connectorProxy(s2CoreTendrilEls[i]),
			{ x1: t.coreFrom.x, y1: t.coreFrom.y, x2: t.coreFrom.x, y2: t.coreFrom.y, w: 0 },
			connectorVars(s2CoreTendrilEls[i], t.coreFrom, t.meet, S2.stroke.connect, {
				duration: REACH_DUR,
				ease: 'power3.out',
				immediateRender: false
			}),
			at
		);
		morphTl.fromTo(
			connectorProxy(s2BallTendrilEls[i]),
			{ x1: t.ballFrom.x, y1: t.ballFrom.y, x2: t.ballFrom.x, y2: t.ballFrom.y, w: 0 },
			connectorVars(s2BallTendrilEls[i], t.ballFrom, t.meet, S2.stroke.connect, {
				duration: REACH_DUR,
				ease: 'power3.out',
				immediateRender: false
			}),
			at
		);

		morphTl.to(
			connectorProxy(s2CoreTendrilEls[i]),
			{
				x2: t.ballFrom.x,
				y2: t.ballFrom.y,
				w: S2.stroke.connect,
				duration: 0.28,
				ease: 'power2.out',
				onUpdate: () => renderConnector(s2CoreTendrilEls[i])
			},
			unifyAt
		);
		morphTl.to(
			connectorProxy(s2BallTendrilEls[i]),
			{
				x2: t.ballFrom.x,
				y2: t.ballFrom.y,
				w: 0,
				duration: 0.24,
				ease: 'power2.in',
				onUpdate: () => renderConnector(s2BallTendrilEls[i])
			},
			unifyAt
		);
	});

	morphTl.to(s2Soft.querySelectorAll('circle'), { opacity: 0, duration: 0.85, ease: 'power2.out' }, reach);
	morphTl.to(s2Soft, { opacity: 0, duration: 0.85, ease: 'power2.out' }, reach);

	// Stack while the last stem is still locking — no hold in between
	const order = 'order';
	morphTl.addLabel(order, `${reach}+=${PAIR_STAGGER * 2 + UNIFY_AT}`);

	morphTl.to(
		s2Core,
		{
			attr: {
				x: S2.core.left.x,
				y: S2.core.left.y,
				width: S2.core.left.w,
				height: S2.core.left.h,
				rx: S2.core.left.rx
			},
			duration: 1.05,
			ease: 'power3.inOut'
		},
		order
	);

	PAIR_ORDER.forEach((i, slot) => {
		const b = S2.blobs[i].order;
		const t = S2.tendrils[i];
		const at = `${order}+=${slot * 0.1}`;
		morphTl.to(s2BlobEls[i], { attr: { cx: b.cx, cy: b.cy, r: b.r }, duration: 1.05, ease: 'power3.inOut' }, at);
		morphTl.to(
			connectorProxy(s2CoreTendrilEls[i]),
			connectorVars(s2CoreTendrilEls[i], t.orderFrom, t.orderTo, S2.stroke.order, {
				duration: 1.05,
				ease: 'power3.inOut'
			}),
			at
		);
	});

	morphTl.to({}, { duration: FINAL_HOLD });
	const reset = 'reset';
	s2CoreTendrilEls.forEach((el, i) => {
		const t = S2.tendrils[i];
		morphTl.to(
			connectorProxy(el),
			connectorVars(el, t.coreFrom, t.coreFrom, 0, { duration: 0.55, ease: 'power2.in' }),
			reset
		);
	});
	s2BallTendrilEls.forEach((el, i) => {
		const t = S2.tendrils[i];
		morphTl.to(
			connectorProxy(el),
			connectorVars(el, t.ballFrom, t.ballFrom, 0, { duration: 0.4, ease: 'power2.in' }),
			reset
		);
	});

	morphTl.to(
		s2Core,
		{
			attr: {
				x: S2.core.center.x,
				y: S2.core.center.y,
				width: S2.core.center.w,
				height: S2.core.center.h,
				rx: S2.core.center.rx
			},
			duration: 0.95,
			ease: 'power3.inOut'
		},
		reset
	);

	s2BlobEls.forEach((el, i) => {
		const b = S2.blobs[i].home;
		morphTl.to(el, { attr: { cx: b.cx, cy: b.cy, r: b.r }, duration: 0.95, ease: 'power3.inOut' }, reset);
	});

	morphTl.set(s2Soft, { opacity: 1 }, 'reset+=0.35');
	morphTl.to(
		s2Soft.querySelectorAll('circle'),
		{
			opacity: (i) => S2.softOpacity[i],
			duration: 0.6,
			ease: 'power2.out'
		},
		'reset+=0.35'
	);
}

function resetConvergeScene() {
	setCoreEl(s3Core, S3.core);
	s3BallEls.forEach((el, i) => {
		setCircle(el, S3.balls[i].full, ORANGE);
		gsap.set(el, { opacity: 1 });
	});
	s3LinkEls.forEach((el, i) => {
		const L = S3.links[i];
		setTendril(el, L.from, L.to, S3.stroke.full);
		gsap.set(el, { opacity: 1 });
	});
	setMark(0, 0);
}

/**
 * Three branches → staggered retract/fade → mid settles + tick (no mid-holds)
 */
function playConvergeStoryboard({ skipSetup = false } = {}) {
	beginBoard(2, skipSetup, resetConvergeScene);

	if (reducedMotion) {
		s3BallEls.forEach((el, i) => {
			if (i === 1) {
				setCircle(el, S3.balls[1].full, DARK);
				gsap.set(el, { opacity: 1 });
			} else {
				gsap.set(el, { opacity: 0 });
			}
		});
		s3LinkEls.forEach((el, i) => {
			if (i === 1) setTendril(el, S3.links[1].from, S3.links[1].to, S3.stroke.thin);
			else setTendril(el, S3.links[i].from, S3.links[i].from, 0);
		});
		setMark(S3.mark.tickH, 1);
		return;
	}

	morphTl = loopTl();

	const OUTER = [0, 2];
	const STAGGER = 0.18;
	const RETRACT_DUR = 0.72;
	const FADE_AT = 0.48;

	morphTl.to({}, { duration: 0.3 });

	const retract = 'retract';
	OUTER.forEach((i, slot) => {
		const L = S3.links[i];
		const pale = S3.balls[i].pale;
		const at = `${retract}+=${slot * STAGGER}`;
		const fadeAt = `${retract}+=${slot * STAGGER + FADE_AT}`;

		morphTl.to(
			connectorProxy(s3LinkEls[i]),
			{
				x2: L.stub.x,
				y2: L.stub.y,
				w: S3.stroke.stub,
				duration: RETRACT_DUR,
				ease: 'power3.inOut',
				onUpdate: () => renderConnector(s3LinkEls[i])
			},
			at
		);
		morphTl.to(
			s3BallEls[i],
			{
				attr: { cx: pale.cx, cy: pale.cy, r: pale.r },
				fill: ORANGE,
				opacity: 0.2,
				duration: RETRACT_DUR,
				ease: 'power3.inOut'
			},
			at
		);
		morphTl.to(
			connectorProxy(s3LinkEls[i]),
			{
				x2: L.from.x,
				y2: L.from.y,
				w: 0,
				duration: 0.38,
				ease: 'power2.in',
				onUpdate: () => renderConnector(s3LinkEls[i])
			},
			fadeAt
		);
		morphTl.to(s3LinkEls[i], { opacity: 0, duration: 0.38, ease: 'power2.in' }, fadeAt);
		morphTl.to(s3BallEls[i], { opacity: 0, duration: 0.38, ease: 'power2.in' }, fadeAt);
	});

	morphTl.to(
		s3BallEls[1],
		{
			fill: DARK,
			duration: 0.7,
			ease: 'power2.inOut',
			onUpdate: () => renderConnector(s3LinkEls[1])
		},
		`${retract}+=0.12`
	);
	morphTl.to(
		connectorProxy(s3LinkEls[1]),
		{
			w: S3.stroke.thin,
			duration: 0.55,
			ease: 'power2.out',
			onUpdate: () => renderConnector(s3LinkEls[1])
		},
		`${retract}+=0.28`
	);

	// Tick grows in one beat as the outer branches finish collapsing
	morphTl.to(
		s3Mark,
		{
			attr: {
				x: S3.mark.midX - S3.mark.width / 2,
				y: S3.mark.midY - S3.mark.tickH / 2,
				width: S3.mark.width,
				height: S3.mark.tickH,
				rx: S3.mark.width / 2
			},
			opacity: 1,
			duration: 0.65,
			ease: 'back.out(1.45)'
		},
		`${retract}+=${STAGGER + FADE_AT - 0.08}`
	);

	morphTl.to({}, { duration: FINAL_HOLD });

	const reset = 'reset';
	morphTl.to(
		s3Mark,
		{ opacity: 0, attr: { height: 0, y: S3.mark.midY }, duration: 0.35, ease: 'power2.in' },
		reset
	);
	morphTl.to(
		s3BallEls[1],
		{ fill: ORANGE, duration: 0.55, ease: 'power2.out', onUpdate: () => renderConnector(s3LinkEls[1]) },
		reset
	);

	[0, 2, 1].forEach((i, slot) => {
		const L = S3.links[i];
		const B = S3.balls[i].full;
		const at = `${reset}+=${slot * 0.08}`;
		morphTl.to(
			connectorProxy(s3LinkEls[i]),
			connectorVars(s3LinkEls[i], L.from, L.to, S3.stroke.full, {
				duration: 0.7,
				ease: 'power3.out'
			}),
			at
		);
		morphTl.to(s3LinkEls[i], { opacity: 1, duration: 0.7, ease: 'power3.out' }, at);
		morphTl.to(
			s3BallEls[i],
			{
				attr: { cx: B.cx, cy: B.cy, r: B.r },
				opacity: 1,
				fill: ORANGE,
				duration: 0.7,
				ease: 'power3.out'
			},
			at
		);
	});
}

function setOrbitSeed(angle, rx, ry, opacity = 1) {
	const p = orbitPoint(angle);
	gsap.set(s4Seed, {
		attr: { cx: p.x, cy: p.y, rx, ry },
		opacity,
		fill: ORANGE
	});
}

function resetOrbitScene() {
	setCoreEl(s4Core, S4.core);
	setCircle(s4Ball, S4.ball, DARK);
	setTendril(s4Link, S4.link.from, S4.link.to, S4.link.stroke);
	gsap.set(s4Mark, {
		attr: {
			x: S4.mark.midX - S4.mark.width / 2,
			y: S4.mark.midY - S4.mark.tickH / 2,
			width: S4.mark.width,
			height: S4.mark.tickH,
			rx: S4.mark.width / 2
		},
		opacity: 1,
		fill: ORANGE
	});
	gsap.set(s4Orbit, {
		attr: {
			cx: S4.orbit.cx,
			cy: S4.orbit.cy,
			rx: S4.orbit.revealRx,
			ry: S4.orbit.revealRy,
			'stroke-width': S4.orbit.stroke
		},
		opacity: 0,
		scale: 1,
		clearProps: 'transform'
	});
	gsap.set(s4Seed, { attr: { rx: 0, ry: 0 }, opacity: 0 });
}

/**
 * Settled core → ellipse + seed in one flow → travel → orbit (final hold)
 */
function playOrbitStoryboard({ skipSetup = false } = {}) {
	beginBoard(3, skipSetup, resetOrbitScene);

	const topAngle = -Math.PI / 2;
	const leftAngle = -Math.PI;
	const seedState = { angle: topAngle };
	const ORBIT_LAPS = 4;
	const ORBIT_LAP_DUR = 2.6;

	if (reducedMotion) {
		gsap.set(s4Orbit, {
			opacity: 1,
			attr: { rx: S4.orbit.rx, ry: S4.orbit.ry }
		});
		gsap.set(s4Mark, { opacity: 0, attr: { height: 0, y: S4.mark.midY } });
		setOrbitSeed(leftAngle, S4.seed.circle.r, S4.seed.circle.r, 1);
		return;
	}

	morphTl = loopTl();

	morphTl.to({}, { duration: 0.28 });

	const reveal = 'reveal';
	morphTl.fromTo(
		s4Orbit,
		{
			opacity: 0,
			attr: {
				cx: S4.orbit.cx,
				cy: S4.orbit.cy,
				rx: S4.orbit.revealRx,
				ry: S4.orbit.revealRy
			}
		},
		{
			opacity: 1,
			attr: {
				cx: S4.orbit.cx,
				cy: S4.orbit.cy,
				rx: S4.orbit.rx,
				ry: S4.orbit.ry
			},
			duration: 1.15,
			ease: 'power3.out'
		},
		reveal
	);
	morphTl.to(
		s4Mark,
		{
			attr: { height: 0, y: S4.mark.midY },
			opacity: 0,
			duration: 0.7,
			ease: 'power2.in'
		},
		reveal
	);

	const top = orbitPoint(topAngle);
	morphTl.fromTo(
		s4Seed,
		{
			attr: { cx: top.x, cy: top.y, rx: 0, ry: 0 },
			opacity: 0
		},
		{
			attr: {
				cx: top.x,
				cy: top.y,
				rx: S4.seed.lozenge.rx,
				ry: S4.seed.lozenge.ry
			},
			opacity: 1,
			duration: 0.55,
			ease: 'back.out(1.5)'
		},
		`${reveal}+=0.42`
	);

	seedState.angle = topAngle;
	morphTl.to(
		seedState,
		{
			angle: leftAngle,
			duration: 1.25,
			ease: 'power2.inOut',
			onUpdate: () => {
				const p = orbitPoint(seedState.angle);
				const span = topAngle - leftAngle;
				const t = span === 0 ? 1 : (topAngle - seedState.angle) / span;
				const rx = S4.seed.lozenge.rx + (S4.seed.circle.r - S4.seed.lozenge.rx) * t;
				const ry = S4.seed.lozenge.ry + (S4.seed.circle.r - S4.seed.lozenge.ry) * t;
				gsap.set(s4Seed, { attr: { cx: p.x, cy: p.y, rx, ry } });
			}
		},
		`${reveal}+=0.78`
	);

	morphTl.to(
		seedState,
		{
			angle: leftAngle - Math.PI * 2 * ORBIT_LAPS,
			duration: ORBIT_LAP_DUR * ORBIT_LAPS,
			ease: 'none',
			onUpdate: () => {
				const p = orbitPoint(seedState.angle);
				gsap.set(s4Seed, {
					attr: { cx: p.x, cy: p.y, rx: S4.seed.circle.r, ry: S4.seed.circle.r }
				});
			}
		},
		`${reveal}+=${0.78 + 1.25}`
	);

	morphTl.to({}, { duration: FINAL_HOLD });

	const reset = 'reset';
	morphTl.to(s4Seed, { opacity: 0, attr: { rx: 0, ry: 0 }, duration: 0.4, ease: 'power2.in' }, reset);
	morphTl.to(
		s4Orbit,
		{
			opacity: 0,
			attr: { rx: S4.orbit.revealRx, ry: S4.orbit.revealRy },
			duration: 0.55,
			ease: 'power2.in'
		},
		reset
	);
	morphTl.to(
		s4Mark,
		{
			attr: {
				x: S4.mark.midX - S4.mark.width / 2,
				y: S4.mark.midY - S4.mark.tickH / 2,
				width: S4.mark.width,
				height: S4.mark.tickH,
				rx: S4.mark.width / 2
			},
			opacity: 1,
			duration: 0.65,
			ease: 'power3.out'
		},
		'reset+=0.25'
	);
}

function playStoryboard(index, { prepared = false, skipPunch = false } = {}) {
	if (index < 0 || index >= items.length) return;

	killMorph();
	visualIndex = index;
	isolateLayer(boardEl(index));

	if (!reducedMotion && visualObject && !skipPunch) {
		gsap.fromTo(
			visualObject,
			{ scale: 0.96, opacity: 0.75 },
			{ scale: 1, opacity: 1, duration: 0.5, ease: 'power2.out' }
		);
	}

	[playMetaballStoryboard, playSignalStoryboard, playConvergeStoryboard, playOrbitStoryboard][index]?.({
		skipSetup: prepared
	});
}

function setPanelOpen(item, open, animate) {
	const panel = item.querySelector('.acc-item__panel');
	const inner = item.querySelector('.acc-item__panel-inner');
	const trigger = item.querySelector('.acc-item__trigger');
	if (!panel || !inner || !trigger) return;

	trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
	item.classList.toggle('is-open', open);

	if (!animate || reducedMotion) {
		if (open) {
			gsap.set(panel, { height: 'auto', opacity: 1 });
			gsap.set(inner, { y: 0, opacity: 1 });
		} else {
			gsap.set(panel, { height: 0, opacity: 0 });
			gsap.set(inner, { y: 0, opacity: 0 });
		}
		return;
	}

	if (open) {
		gsap.set(panel, { height: 'auto', opacity: 1 });
		gsap.from(panel, { height: 0, opacity: 0, duration: ACC_DUR, ease: ACC_EASE });
		gsap.fromTo(
			inner,
			{ y: 12, opacity: 0 },
			{ y: 0, opacity: 1, duration: ACC_DUR, ease: ACC_EASE, delay: 0.05 }
		);
	} else {
		gsap.to(inner, { y: -6, opacity: 0, duration: ACC_DUR * 0.65, ease: ACC_EASE });
		gsap.to(panel, { height: 0, opacity: 0, duration: ACC_DUR, ease: ACC_EASE });
	}
}

function openAccordion(index) {
	if (index === activeIndex) return;
	if (index < 0 || index >= items.length) return;

	const prev = activeIndex;
	activeIndex = index;

	items.forEach((item, i) => {
		const shouldOpen = i === index;
		const wasOpen = i === prev;
		if (shouldOpen || wasOpen || prev === -1) {
			setPanelOpen(item, shouldOpen, prev !== -1);
		} else {
			setPanelOpen(item, false, false);
		}
	});

	if (prev < 0) {
		visualIndex = index;
		playStoryboard(index);
	} else {
		transitionToBoard(visualIndex, index);
	}
}

function initAccordion() {
	items.forEach((item) => {
		const trigger = item.querySelector('.acc-item__trigger');
		trigger?.addEventListener('click', () => {
			openAccordion(Number(item.dataset.index));
		});
	});

	items.forEach((item, i) => setPanelOpen(item, i === 0, false));
	activeIndex = 0;
	visualIndex = 0;
	playStoryboard(0);
}

function initIntroMotion() {
	if (reducedMotion) return;

	gsap.from('.eyebrow', { opacity: 0, y: 8, duration: 0.5, ease: 'power2.out' });
	gsap.from('.intro__heading', { opacity: 0, y: 14, duration: 0.65, ease: 'power2.out', delay: 0.05 });
	gsap.from('.intro__cta', { opacity: 0, y: 10, duration: 0.55, ease: 'power2.out', delay: 0.12 });
	gsap.from('.visual-panel', { opacity: 0, scale: 0.985, duration: 0.75, ease: 'power2.out', delay: 0.1 });
	gsap.from('.acc-item', {
		opacity: 0,
		y: 14,
		duration: 0.5,
		stagger: 0.07,
		ease: 'power2.out',
		delay: 0.18
	});
}

initAccordion();
initIntroMotion();
