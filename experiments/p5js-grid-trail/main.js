/**
 * p5.js — Grid Trail
 * Mouse-driven grid trail with easing-based cell animations, geometric shapes,
 * palette modes, and lil.gui presets.
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const PILL_BORDER_RADIUS = 0.5;

const INCREDIBLE_BANK = ['#EA6F24', '#0E8E86', '#424856', '#EEEEEE'];
const ORANGE_B = ['#EA6F24', '#000000'];

const PALETTE_PRESETS = {
	IncredibleBank: INCREDIBLE_BANK,
	OrangeB: ORANGE_B,
	Monochrome: ['#111111', '#444444', '#888888', '#CCCCCC'],
	WarmMuted: ['#C45C26', '#D4A574', '#8B7355', '#F5EDE4'],
};

const PALETTE_NAMES = Object.keys(PALETTE_PRESETS);

const EASING_TYPES = [
	'linear',
	'easeInQuad',
	'easeOutQuad',
	'easeInOutQuad',
	'easeInCubic',
	'easeOutCubic',
	'easeInOutCubic',
	'easeInSine',
	'easeOutSine',
	'easeInOutSine',
	'easeInExpo',
	'easeOutExpo',
	'easeInOutExpo',
];

const COLOR_MODES = ['random', 'noise', 'distance'];
const SHAPE_TYPES = ['circle', 'verticalPill', 'mixed'];

/** Keys copied when using "Export preset to clipboard". */
const PRESET_EXPORT_KEYS = [
	'cellSize',
	'debugGrid',
	'trailLength',
	'trailFadeAway',
	'activationRadius',
	'trailDecaySpeed',
	'lingerDuration',
	'shapeType',
	'shapeSize',
	'shapeOpacity',
	'easingIn',
	'easingOut',
	'animInDuration',
	'animOutDuration',
	'scaleInAmount',
	'scaleOutAmount',
	'opacityFadeAmount',
	'palettePreset',
	'colorMode',
	'bgColor',
	'opacityMultiplier',
	'randomSeed',
];

const PRESETS = {
	'Dots and Pills': {
		cellSize: 42,
		debugGrid: false,
		trailLength: 14,
		trailFadeAway: false,
		activationRadius: 27,
		trailDecaySpeed: 1,
		lingerDuration: 420,
		shapeType: "mixed",
		shapeSize: 0.62,
		shapeOpacity: 1,
		easingIn: "easeOutCubic",
		easingOut: "easeInCubic",
		animInDuration: 800,
		animOutDuration: 520,
		scaleInAmount: 1,
		scaleOutAmount: 0.15,
		opacityFadeAmount: 1,
		palettePreset: "OrangeB",
		colorMode: "random",
		bgColor: "#ffffff",
		opacityMultiplier: 1,
		randomSeed: 49606,
	},
	'Soft Pills': {
		cellSize: 49,
		debugGrid: false,
		trailLength: 18,
		trailFadeAway: true,
		activationRadius: 16,
		trailDecaySpeed: 0.2,
		lingerDuration: 100,
		shapeType: "verticalPill",
		shapeSize: 0.5,
		shapeOpacity: 0.82,
		easingIn: "easeOutSine",
		easingOut: "easeInOutSine",
		animInDuration: 420,
		animOutDuration: 640,
		scaleInAmount: 1,
		scaleOutAmount: 0.2,
		opacityFadeAmount: 1,
		palettePreset: "IncredibleBank",
		colorMode: "random",
		bgColor: "#ffffff",
		opacityMultiplier: 0.95,
		randomSeed: 108,
	},
	'Long Elegant Trail': {
		cellSize: 24,
		debugGrid: false,
		trailLength: 36,
		trailFadeAway: true,
		activationRadius: 71,
		trailDecaySpeed: 0.55,
		lingerDuration: 900,
		shapeType: "mixed",
		shapeSize: 0.62,
		shapeOpacity: 0.72,
		easingIn: "easeOutExpo",
		easingOut: "easeInOutQuad",
		animInDuration: 380,
		animOutDuration: 880,
		scaleInAmount: 1,
		scaleOutAmount: 0.1,
		opacityFadeAmount: 1,
		palettePreset: "IncredibleBank",
		colorMode: "noise",
		bgColor: "#ffffff",
		opacityMultiplier: 0.88,
		randomSeed: 303,
	},
	'Dense Quick Trail': {
		cellSize: 20,
		debugGrid: false,
		trailLength: 28,
		trailFadeAway: true,
		activationRadius: 48,
		trailDecaySpeed: 1.35,
		lingerDuration: 320,
		shapeType: 'circle',
		shapeSize: 0.78,
		shapeOpacity: 0.92,
		easingIn: 'easeOutQuad',
		easingOut: 'easeInQuad',
		animInDuration: 180,
		animOutDuration: 360,
		scaleInAmount: 1.05,
		scaleOutAmount: 0.25,
		opacityFadeAmount: 1,
		palettePreset: 'OrangeB',
		colorMode: 'random',
		bgColor: '#ffffff',
		opacityMultiplier: 1,
		randomSeed: 777,
	},
	'Sparse Monochrome': {
		cellSize: 44,
		debugGrid: false,
		trailLength: 10,
		trailFadeAway: true,
		activationRadius: 55,
		trailDecaySpeed: 0.7,
		lingerDuration: 1100,
		shapeType: 'verticalPill',
		shapeSize: 0.58,
		shapeOpacity: 0.68,
		easingIn: 'easeOutCubic',
		easingOut: 'easeInOutCubic',
		animInDuration: 480,
		animOutDuration: 760,
		scaleInAmount: 0.95,
		scaleOutAmount: 0.12,
		opacityFadeAmount: 1,
		palettePreset: 'OrangeB',
		colorMode: 'distance',
		bgColor: '#ffffff',
		opacityMultiplier: 0.82,
		randomSeed: 19,
	},
	'Slow Fade': {
		cellSize: 30,
		debugGrid: false,
		trailLength: 22,
		trailFadeAway: true,
		activationRadius: 46,
		trailDecaySpeed: 0.45,
		lingerDuration: 1400,
		shapeType: "mixed",
		shapeSize: 0.61,
		shapeOpacity: 0.75,
		easingIn: "easeOutSine",
		easingOut: "easeInOutSine",
		animInDuration: 520,
		animOutDuration: 1200,
		scaleInAmount: 1,
		scaleOutAmount: 0.08,
		opacityFadeAmount: 1,
		palettePreset: "IncredibleBank",
		colorMode: "random",
		bgColor: "#ffffff",
		opacityMultiplier: 0.78,
		randomSeed: 512,
	},

	'Fast Cursor Trace': {
		cellSize: 22,
		debugGrid: false,
		trailLength: 16,
		trailFadeAway: true,
		activationRadius: 34,
		trailDecaySpeed: 1.7,
		lingerDuration: 100,
		shapeType: "mixed",
		shapeSize: 0.6,
		shapeOpacity: 0.95,
		easingIn: "easeOutExpo",
		easingOut: "easeInExpo",
		animInDuration: 120,
		animOutDuration: 220,
		scaleInAmount: 1.08,
		scaleOutAmount: 0.3,
		opacityFadeAmount: 1,
		palettePreset: "IncredibleBank",
		colorMode: "random",
		bgColor: "#ffffff",
		opacityMultiplier: 1,
		randomSeed: 909,
	},

};

const PRESET_NAMES = Object.keys(PRESETS);

const DEFAULT_PARAMS = {
	preset: PRESET_NAMES[0],
	cellSize: 28,
	debugGrid: false,
	trailLength: 16,
	trailFadeAway: true,
	activationRadius: 44,
	trailDecaySpeed: 1,
	lingerDuration: 500,
	shapeType: 'circle',
	shapeSize: 0.7,
	shapeOpacity: 0.85,
	easingIn: 'easeOutCubic',
	easingOut: 'easeInCubic',
	animInDuration: 300,
	animOutDuration: 500,
	scaleInAmount: 1,
	scaleOutAmount: 0.15,
	opacityFadeAmount: 1,
	palettePreset: 'OrangeB',
	colorMode: 'random',
	bgColor: '#ffffff',
	opacityMultiplier: 1,
	randomSeed: 2026,
	presetExportName: 'New preset',
};

// ─── Runtime state ───────────────────────────────────────────────────────────

const params = { ...DEFAULT_PARAMS, ...PRESETS[PRESET_NAMES[0]] };
params.preset = PRESET_NAMES[0];

let gui = null;
let grid = null;
let trail = null;
let prevMouse = { x: 0, y: 0 };
let mouseReady = false;
let timeMs = 0;
let toastTimer = null;
/** @type {import('lil-gui').Controller[]} */
let tailFadeControllers = [];

// ─── Easing utilities ────────────────────────────────────────────────────────

const Easing = {
	linear: (t) => t,
	easeInQuad: (t) => t * t,
	easeOutQuad: (t) => t * (2 - t),
	easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
	easeInCubic: (t) => t * t * t,
	easeOutCubic: (t) => {
		const u = 1 - t;
		return 1 - u * u * u;
	},
	easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
	easeInSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
	easeOutSine: (t) => Math.sin((t * Math.PI) / 2),
	easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
	easeInExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
	easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
	easeInOutExpo: (t) => {
		if (t === 0) return 0;
		if (t === 1) return 1;
		if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
		return (2 - Math.pow(2, -20 * t + 10)) / 2;
	},
};

function applyEasing(t, type) {
	const fn = Easing[type] || Easing.linear;
	return fn(constrain(t, 0, 1));
}

// ─── Notification ──────────────────────────────────────────────────────────────

function showToast(message, durationMs = 2400) {
	const el = document.getElementById('toast');
	if (!el) return;
	el.textContent = message;
	el.hidden = false;
	el.classList.add('is-visible');
	if (toastTimer) clearTimeout(toastTimer);
	toastTimer = setTimeout(() => {
		el.classList.remove('is-visible');
		setTimeout(() => {
			el.hidden = true;
		}, 280);
	}, durationMs);
}

// ─── Palette helpers ───────────────────────────────────────────────────────────

function getActivePalette() {
	return PALETTE_PRESETS[params.palettePreset] || INCREDIBLE_BANK;
}

function computeColorIndex(cell, mx, my) {
	const palette = getActivePalette();
	const n = palette.length;
	if (n === 0) return 0;

	switch (params.colorMode) {
		case 'noise':
			return Math.floor(noise(cell.col * 0.08, cell.row * 0.08, params.randomSeed * 0.01) * n) % n;
		case 'distance': {
			const maxD = max(width, height) * 0.5;
			return Math.floor(map(dist(cell.cx, cell.cy, mx, my), 0, maxD, 0, n - 0.001)) % n;
		}
		case 'random':
		default:
			return Math.floor(random() * n);
	}
}

function getCellColorHex(cell) {
	const palette = getActivePalette();
	if (palette.length === 0) return '#EA6F24';
	return palette[cell.colorIndex % palette.length];
}

function assignCellColor(cell, mx, my) {
	cell.colorIndex = computeColorIndex(cell, mx, my);
}

function recolorActiveCells(mx, my) {
	if (!grid) return;
	for (let i = 0; i < grid.cells.length; i++) {
		const cell = grid.cells[i];
		if (cell.isActiveOrAnimating()) {
			assignCellColor(cell, mx, my);
		}
	}
}

// ─── Cell ────────────────────────────────────────────────────────────────────

class Cell {
	constructor(col, row, cx, cy) {
		this.col = col;
		this.row = row;
		this.cx = cx;
		this.cy = cy;
		this.state = 'inactive';
		this.animProgress = 0;
		this.lingerStart = 0;
		this.trailIndex = -1;
		this.colorIndex = 0;
		this.shapeKind = 'circle';
		this.inTrail = false;
	}

	reset() {
		this.state = 'inactive';
		this.animProgress = 0;
		this.lingerStart = 0;
		this.trailIndex = -1;
		this.inTrail = false;
	}

	spawn(trailIndex, shapeKind, mx, my) {
		this.trailIndex = trailIndex;
		this.shapeKind = shapeKind;
		assignCellColor(this, mx, my);
		this.state = 'in';
		this.animProgress = 0;
		this.inTrail = true;
	}

	beginFadeOut() {
		if (this.state === 'inactive') return;
		this.inTrail = false;
		if (this.state === 'out') return;
		this.state = 'out';
		this.animProgress = 0;
	}

	promoteToActive(now) {
		this.inTrail = true;
		this.lingerStart = now;
		if (this.state === 'out') {
			this.state = 'active';
			this.animProgress = 1;
		}
	}

	getInEase() {
		return applyEasing(this.animProgress, params.easingIn);
	}

	getScale() {
		const inAmt = params.scaleInAmount;
		const outAmt = params.scaleOutAmount;
		if (this.state === 'in') {
			return lerp(0, inAmt, this.getInEase());
		}
		if (this.state === 'active') {
			return inAmt;
		}
		if (this.state === 'out') {
			const e = applyEasing(this.animProgress, params.easingOut);
			return lerp(inAmt, outAmt, e);
		}
		return 0;
	}

	getOpacity() {
		const base = params.shapeOpacity * params.opacityMultiplier;
		if (this.state === 'in') {
			return base * this.getInEase();
		}
		if (this.state === 'active') {
			return base;
		}
		if (this.state === 'out') {
			const e = applyEasing(this.animProgress, params.easingOut);
			return base * lerp(1, 0, e) * params.opacityFadeAmount;
		}
		return 0;
	}

	getBaseDiameter() {
		return params.shapeSize * params.cellSize;
	}

	getDrawDiameter() {
		return this.getBaseDiameter() * (this.getScale() / max(0.001, params.scaleInAmount));
	}

	update(now, dt, underCursor) {
		if (this.state === 'in') {
			const step = dt / max(1, params.animInDuration);
			this.animProgress = min(1, this.animProgress + step);
			if (this.animProgress >= 1) {
				this.state = 'active';
				this.lingerStart = now;
			}
			return;
		}
		if (this.state === 'active') {
			if (params.trailFadeAway && this.inTrail && !underCursor && now - this.lingerStart >= params.lingerDuration) {
				this.beginFadeOut();
			}
			return;
		}
		if (this.state === 'out') {
			const decay = params.trailFadeAway ? params.trailDecaySpeed : 1;
			const step = (dt * decay) / max(1, params.animOutDuration);
			this.animProgress = min(1, this.animProgress + step);
		}
	}

	isActiveOrAnimating() {
		return this.state === 'in' || this.state === 'active' || this.state === 'out';
	}

	usesPill() {
		if (params.shapeType === 'verticalPill') return true;
		if (params.shapeType === 'mixed') return this.shapeKind === 'pill';
		return false;
	}
}

// ─── Grid system ───────────────────────────────────────────────────────────────

class GridSystem {
	constructor() {
		this.cols = 0;
		this.rows = 0;
		this.cells = [];
		this.cellMap = new Map();
	}

	key(col, row) {
		return `${col},${row}`;
	}

	rebuild() {
		randomSeed(params.randomSeed);
		noiseSeed(params.randomSeed);

		const pitch = params.cellSize;
		this.cols = max(1, floor(width / pitch));
		this.rows = max(1, floor(height / pitch));

		const totalW = this.cols * pitch;
		const totalH = this.rows * pitch;
		const ox = (width - totalW) / 2;
		const oy = (height - totalH) / 2;

		const prevStates = new Map(this.cellMap);
		this.cells = [];
		this.cellMap = new Map();

		for (let row = 0; row < this.rows; row++) {
			for (let col = 0; col < this.cols; col++) {
				const cx = ox + col * pitch + pitch * 0.5;
				const cy = oy + row * pitch + pitch * 0.5;
				const k = this.key(col, row);
				let cell = prevStates.get(k);
				if (!cell) {
					cell = new Cell(col, row, cx, cy);
				} else {
					cell.cx = cx;
					cell.cy = cy;
				}
				this.cells.push(cell);
				this.cellMap.set(k, cell);
			}
		}
	}

	findClosestCell(wx, wy, radius) {
		const r2 = radius * radius;
		let best = null;
		let bestD2 = r2;
		for (let i = 0; i < this.cells.length; i++) {
			const c = this.cells[i];
			const dx = c.cx - wx;
			const dy = c.cy - wy;
			const d2 = dx * dx + dy * dy;
			if (d2 <= bestD2) {
				best = c;
				bestD2 = d2;
			}
		}
		return best;
	}

	collectCellsAlongPath(x0, y0, x1, y1, radius) {
		const found = new Map();
		const segLen = dist(x0, y0, x1, y1);
		const step = max(params.cellSize * 0.4, 1);
		const steps = max(1, ceil(segLen / step));
		const r2 = radius * radius;

		for (let s = 0; s <= steps; s++) {
			const t = s / steps;
			const px = lerp(x0, x1, t);
			const py = lerp(y0, y1, t);

			for (let i = 0; i < this.cells.length; i++) {
				const c = this.cells[i];
				const dx = c.cx - px;
				const dy = c.cy - py;
				const d2 = dx * dx + dy * dy;
				if (d2 <= r2 && !found.has(c)) {
					found.set(c, sqrt(d2));
				}
			}
		}

		const list = Array.from(found.entries());
		list.sort((a, b) => a[1] - b[1]);
		return list.map((entry) => entry[0]);
	}

	drawDebug() {
		const pitch = params.cellSize;
		const totalW = this.cols * pitch;
		const totalH = this.rows * pitch;
		const ox = (width - totalW) / 2;
		const oy = (height - totalH) / 2;

		push();
		strokeWeight(1);
		for (let col = 0; col <= this.cols; col++) {
			const x = ox + col * pitch;
			stroke(255, 60, 60, 120);
			line(x, oy, x, oy + totalH);
		}
		for (let row = 0; row <= this.rows; row++) {
			const y = oy + row * pitch;
			stroke(80, 200, 120, 120);
			line(ox, y, ox + totalW, y);
		}
		noStroke();
		fill(80, 140, 255, 160);
		for (let i = 0; i < this.cells.length; i++) {
			circle(this.cells[i].cx, this.cells[i].cy, 3);
		}
		pop();
	}
}

// ─── Trail manager ───────────────────────────────────────────────────────────

class TrailManager {
	constructor(gridSystem) {
		this.grid = gridSystem;
		/** @type {Cell[]} oldest → newest, max length = trailLength when fade off */
		this.queue = [];
		/** @type {Set<Cell>} */
		this.underCursor = new Set();
	}

	clear() {
		for (let i = 0; i < this.queue.length; i++) {
			this.queue[i].reset();
		}
		for (let i = 0; i < this.grid.cells.length; i++) {
			if (this.grid.cells[i].state !== 'inactive') {
				this.grid.cells[i].reset();
			}
		}
		this.queue = [];
		this.underCursor = new Set();
	}

	resolveShapeKind(col, row) {
		const t = params.shapeType;
		if (t === 'circle') return 'circle';
		if (t === 'verticalPill') return 'pill';
		const hash = Math.abs(col * 73856093 ^ row * 19349663 ^ params.randomSeed);
		return hash % 2 === 0 ? 'circle' : 'pill';
	}

	syncTrailIndices() {
		for (let i = 0; i < this.queue.length; i++) {
			this.queue[i].trailIndex = i;
			this.queue[i].inTrail = true;
		}
	}

	beginFadeOut(cell) {
		cell.beginFadeOut();
		const idx = this.queue.indexOf(cell);
		if (idx !== -1) {
			this.queue.splice(idx, 1);
			this.syncTrailIndices();
		}
	}

	enforceTrailLimit() {
		while (this.queue.length > params.trailLength) {
			const oldest = this.queue.shift();
			if (!oldest) break;
			oldest.beginFadeOut();
		}
		this.syncTrailIndices();
	}

	addToTrailFade(cell, mx, my, now) {
		if (cell.state === 'inactive') {
			const shapeKind = this.resolveShapeKind(cell.col, cell.row);
			cell.spawn(this.queue.length, shapeKind, mx, my);
			this.queue.push(cell);
			cell.lingerStart = now;
			this.enforceTrailLimit();
			return;
		}

		cell.promoteToActive(now);
		if (cell.inTrail) {
			cell.lingerStart = now;
			return;
		}

		const idx = this.queue.indexOf(cell);
		if (idx !== -1) {
			this.queue.splice(idx, 1);
		}
		this.queue.push(cell);
		this.enforceTrailLimit();
	}

	processMouseSnake(mx, my, now) {
		const cell = this.grid.findClosestCell(mx, my, params.activationRadius);
		if (!cell) {
			this.underCursor = new Set();
			return;
		}

		this.underCursor = new Set([cell]);

		const tail = this.queue.length > 0 ? this.queue[this.queue.length - 1] : null;
		if (cell === tail) return;

		if (cell.state === 'inactive') {
			const shapeKind = this.resolveShapeKind(cell.col, cell.row);
			cell.spawn(this.queue.length, shapeKind, mx, my);
			this.queue.push(cell);
			cell.lingerStart = now;
			this.enforceTrailLimit();
			return;
		}

		if (cell.state === 'out') return;

		const idx = this.queue.indexOf(cell);
		if (idx !== -1) {
			for (let i = idx + 1; i < this.queue.length; i++) {
				this.queue[i].beginFadeOut();
			}
			this.queue = this.queue.slice(0, idx + 1);
			cell.promoteToActive(now);
			this.syncTrailIndices();
			return;
		}

		cell.promoteToActive(now);
		this.queue.push(cell);
		this.enforceTrailLimit();
	}

	processMouseFade(x0, y0, x1, y1, now) {
		const candidates = this.grid.collectCellsAlongPath(x0, y0, x1, y1, params.activationRadius);
		this.underCursor = new Set(candidates);

		for (let i = 0; i < candidates.length; i++) {
			this.addToTrailFade(candidates[i], x1, y1, now);
		}
	}

	processMouse(x0, y0, x1, y1, now) {
		if (!params.trailFadeAway) {
			this.processMouseSnake(x1, y1, now);
			return;
		}
		this.processMouseFade(x0, y0, x1, y1, now);
	}

	update(now, dt) {
		for (let i = 0; i < this.grid.cells.length; i++) {
			const cell = this.grid.cells[i];
			cell.update(now, dt, this.underCursor.has(cell));
		}

		for (let i = this.grid.cells.length - 1; i >= 0; i--) {
			const cell = this.grid.cells[i];
			if (cell.state === 'out' && cell.animProgress >= 1) {
				cell.reset();
			}
		}
	}
}

// ─── Drawing ─────────────────────────────────────────────────────────────────

function drawCircleShape(ox, oy, diameter, fillCol) {
	noStroke();
	fill(fillCol);
	circle(ox, oy, max(0.001, diameter));
}

function drawPillShape(ox, oy, width, height, fillCol) {
	const br = min(width, height) * PILL_BORDER_RADIUS;
	noStroke();
	fill(fillCol);
	rect(ox, oy, max(0.001, width), max(0.001, height), br);
}

function drawPillEntrance(cell, ox, oy, fillCol) {
	const baseD = cell.getBaseDiameter();
	const ease = cell.getInEase();
	const d = baseD * ease;
	if (d <= 0.001) return;

	const splitAt = 0.55;
	const p = cell.animProgress;

	if (p < splitAt) {
		const phase = applyEasing(p / splitAt, params.easingIn);
		const sep = lerp(0, baseD * 0.38, phase);
		drawCircleShape(ox, oy - sep, d, fillCol);
		drawCircleShape(ox, oy + sep, d, fillCol);
		return;
	}

	const phase = applyEasing((p - splitAt) / (1 - splitAt), params.easingIn);
	const w = baseD * ease;
	const h = lerp(baseD, baseD * 2, phase) * ease;
	drawPillShape(ox, oy, w, h, fillCol);
}

function drawCellShape(cell) {
	const opacity = cell.getOpacity();
	if (opacity <= 0.001) return;

	const fillCol = color(getCellColorHex(cell));
	fillCol.setAlpha(constrain(opacity, 0, 1) * 255);

	const ox = cell.cx;
	const oy = cell.cy;
	const d = cell.getDrawDiameter();

	if (cell.usesPill()) {
		if (cell.state === 'in') {
			drawPillEntrance(cell, ox, oy, fillCol);
		} else {
			drawPillShape(ox, oy, d, d * 2, fillCol);
		}
		return;
	}

	drawCircleShape(ox, oy, d, fillCol);
}

function drawTrail() {
	for (let i = 0; i < grid.cells.length; i++) {
		const cell = grid.cells[i];
		if (cell.isActiveOrAnimating()) {
			drawCellShape(cell);
		}
	}
}

// ─── Preset manager ──────────────────────────────────────────────────────────

function getCurrentPresetPatch() {
	const o = {};
	for (let i = 0; i < PRESET_EXPORT_KEYS.length; i++) {
		const k = PRESET_EXPORT_KEYS[i];
		o[k] = params[k];
	}
	return o;
}

function escapePresetKeyName(name) {
	return String(name).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function formatPresetBlockForPaste(name, patch) {
	const lines = [];
	for (let i = 0; i < PRESET_EXPORT_KEYS.length; i++) {
		const k = PRESET_EXPORT_KEYS[i];
		const v = patch[k];
		const formatted = typeof v === 'string' ? JSON.stringify(v) : String(v);
		lines.push(`\t\t${k}: ${formatted},`);
	}
	return `\t'${escapePresetKeyName(name)}': {\n${lines.join('\n')}\n\t},`;
}

function savePresetToClipboard() {
	const name = (params.presetExportName || '').trim() || 'New preset';
	const text = `${formatPresetBlockForPaste(name, getCurrentPresetPatch())}\n`;
	const onFail = () => {
		window.prompt('Copy this block into PRESETS in main.js:', text);
		showToast('Copy preset from dialog');
	};
	if (navigator.clipboard && navigator.clipboard.writeText) {
		navigator.clipboard
			.writeText(text)
			.then(() => showToast(`Preset "${name}" copied to clipboard`))
			.catch(onFail);
	} else {
		onFail();
	}
}

function syncTrailFadeControls() {
	const enabled = params.trailFadeAway;
	for (let i = 0; i < tailFadeControllers.length; i++) {
		if (enabled) {
			tailFadeControllers[i].enable();
		} else {
			tailFadeControllers[i].disable();
		}
	}
}

function applyPreset(name) {
	const patch = PRESETS[name];
	if (!patch) return;
	Object.assign(params, patch);
	params.preset = name;
	grid.rebuild();
	trail.clear();
	syncTrailFadeControls();
	if (gui) {
		gui.controllersRecursive().forEach((c) => c.updateDisplay());
	}
}

function applyCurrentPreset() {
	applyPreset(params.preset);
}

// ─── GUI ─────────────────────────────────────────────────────────────────────

function setupGui() {
	const GUICtor = typeof lil !== 'undefined' ? lil.GUI : typeof GUI !== 'undefined' ? GUI : null;
	if (!GUICtor) return;

	gui = new GUICtor({ title: 'Grid Trail' });
	tailFadeControllers = [];

	const gGrid = gui.addFolder('Grid');
	gGrid.add(params, 'cellSize', 12, 64, 1).onFinishChange(() => grid.rebuild());
	gGrid.add(params, 'debugGrid').name('show debug grid');

	const gTrail = gui.addFolder('Trail');
	gTrail.add(params, 'trailLength', 4, 48, 1);
	gTrail.add(params, 'trailFadeAway').name('fade trail tail').onChange(syncTrailFadeControls);
	gTrail.add(params, 'activationRadius', 16, 120, 1);
	tailFadeControllers.push(gTrail.add(params, 'lingerDuration', 100, 2000, 10));
	tailFadeControllers.push(gTrail.add(params, 'trailDecaySpeed', 0.2, 2.5, 0.05));

	const gShapes = gui.addFolder('Shapes');
	gShapes.add(params, 'shapeType', SHAPE_TYPES).name('shape type');
	gShapes.add(params, 'shapeSize', 0.2, 1.2, 0.01);
	gShapes.add(params, 'shapeOpacity', 0.1, 1, 0.01);

	const gAnim = gui.addFolder('Animation');
	gAnim.add(params, 'easingIn', EASING_TYPES).name('easing in');
	gAnim.add(params, 'animInDuration', 60, 800, 10);
	gAnim.add(params, 'scaleInAmount', 0.5, 1.2, 0.01);
	gAnim.add(params, 'easingOut', EASING_TYPES).name('easing out');
	gAnim.add(params, 'animOutDuration', 100, 1400, 10);
	gAnim.add(params, 'scaleOutAmount', 0, 0.5, 0.01);
	gAnim.add(params, 'opacityFadeAmount', 0.2, 1, 0.01);

	const gColor = gui.addFolder('Color');
	gColor
		.add(params, 'palettePreset', PALETTE_NAMES)
		.name('palette preset')
		.onChange(() => recolorActiveCells(mouseX, mouseY));
	gColor
		.add(params, 'colorMode', COLOR_MODES)
		.name('color mode')
		.onChange(() => recolorActiveCells(mouseX, mouseY));
	gColor.addColor(params, 'bgColor').name('background');
	gColor.add(params, 'opacityMultiplier', 0.2, 1, 0.01);
	gColor.add(params, 'randomSeed', 0, 99999, 1).onFinishChange(() => {
		grid.rebuild();
		recolorActiveCells(mouseX, mouseY);
	});

	const gPresets = gui.addFolder('Presets');
	gPresets.add(params, 'preset', PRESET_NAMES).name('preset').onChange(applyPreset);
	gPresets.add({ applyCurrentPreset }, 'applyCurrentPreset').name('apply preset');
	gPresets.add(params, 'presetExportName').name('export name');
	gPresets.add({ savePresetToClipboard }, 'savePresetToClipboard').name('export preset as JSON');

	syncTrailFadeControls();
	gui.close();
}

// ─── p5 lifecycle ────────────────────────────────────────────────────────────

function setup() {
	const canvasEl = createCanvas(windowWidth, windowHeight);
	canvasEl.parent('app');
	pixelDensity(min(2, displayDensity()));
	rectMode(CENTER);
	colorMode(RGB, 255);
	grid = new GridSystem();
	trail = new TrailManager(grid);
	grid.rebuild();
	prevMouse.x = width * 0.5;
	prevMouse.y = height * 0.5;
	setupGui();
}

function draw() {
	timeMs = millis();
	const dt = min(deltaTime, 64);

	background(params.bgColor);

	const mx = mouseX;
	const my = mouseY;

	if (!mouseReady && (mx !== 0 || my !== 0)) {
		prevMouse.x = mx;
		prevMouse.y = my;
		mouseReady = true;
	}

	if (mouseReady) {
		trail.processMouse(prevMouse.x, prevMouse.y, mx, my, timeMs);
		prevMouse.x = mx;
		prevMouse.y = my;
	}

	trail.update(timeMs, dt);
	drawTrail();

	if (params.debugGrid) {
		grid.drawDebug();
	}
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	grid.rebuild();
}

function touchMoved() {
	if (touches.length > 0) {
		return false;
	}
}
