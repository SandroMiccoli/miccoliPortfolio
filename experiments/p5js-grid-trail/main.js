/**
 * p5.js — Grid Trail
 * Mouse-driven grid trail with easing-based cell animations, geometric shapes,
 * palette modes, and lil.gui presets.
 *
 * Demo mode (perfect-loop export):
 *   ?demo=1  simulated mouse gesture
 *   ?demo=2  noise-staggered full-grid appear / fade
 *   ?demo=3  vertical wave fill from bottom, then fade
 * Uses Accent Pill 04. Loops continuously; use Record in the GUI to export one loop.
 */

// ─── Demo export config (easy to tweak) ──────────────────────────────────────

const DEMO_CONFIG = {
	width: 1080,
	height: 1920,
	durationMs: 10000,
	fps: 30,
	preset: 'Accent Pill 04',
	/** Min Chebyshev distance (cells) between "i" letters in demos 2 & 3. */
	iMinSpacing: 3,
};

/** @returns {1|2|3|null} */
function parseDemoMode() {
	const raw = new URLSearchParams(window.location.search).get('demo');
	if (raw === '1' || raw === '2' || raw === '3') return Number(raw);
	return null;
}

const DEMO_MODE = parseDemoMode();

// ─── Constants ───────────────────────────────────────────────────────────────

const PILL_BORDER_RADIUS = 0.5;

/** Gap (ms) without movement that starts a fresh interaction (guarantees one "i"). */
const I_INTERACTION_IDLE_MS = 220;
/** Spacing between "i" shapes within a continuous stroke, in cell-size multiples. */
const I_SPACING_CELLS_MIN = 4;
const I_SPACING_CELLS_MAX = 7;

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
	'baseColor',
	'baseOpacity',
	'baseStrokeOnly',
	'baseStrokeWeight',
	'accentColor',
	'accentOpacity',
	'accentStrokeOnly',
	'accentStrokeWeight',
	'bgColor',
	'opacityMultiplier',
	'randomSeed',
];

/** Shared motion/grid settings for the Accent Pill preset family. */
const ACCENT_PILL_BASE = {
	cellSize: 42,
	debugGrid: false,
	trailLength: 14,
	trailFadeAway: false,
	activationRadius: 27,
	trailDecaySpeed: 1,
	lingerDuration: 420,
	shapeType: 'mixed',
	shapeSize: 0.62,
	shapeOpacity: 1,
	easingIn: 'easeOutCubic',
	easingOut: 'easeInCubic',
	animInDuration: 800,
	animOutDuration: 520,
	scaleInAmount: 1,
	scaleOutAmount: 0.15,
	opacityFadeAmount: 1,
	baseColor: '#EA6F24',
	baseOpacity: 1,
	baseStrokeOnly: false,
	baseStrokeWeight: 2,
	accentStrokeWeight: 2,
	bgColor: '#ffffff',
	opacityMultiplier: 1,
};

const PRESETS = {
	'Accent Pill 01': {
		...ACCENT_PILL_BASE,
		accentColor: '#000000',
		accentOpacity: 1,
		accentStrokeOnly: false,
		randomSeed: 49606,
	},
	'Accent Pill 02': {
		...ACCENT_PILL_BASE,
		accentColor: '#EA6F24',
		accentOpacity: 1,
		accentStrokeOnly: false,
		baseStrokeOnly: true,
		baseStrokeWeight: 1.25,
		randomSeed: 502,
	},
	'Accent Pill 03': {
		...ACCENT_PILL_BASE,
		baseOpacity: 0.25,
		accentColor: '#EA6F24',
		accentOpacity: 1,
		accentStrokeOnly: false,
		randomSeed: 503,
	},
	'Accent Pill 04': {
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
		baseColor: "#00645d",
		baseOpacity: 1,
		baseStrokeOnly: true,
		baseStrokeWeight: 1,
		accentColor: "#ea6f24",
		accentOpacity: 1,
		accentStrokeOnly: false,
		accentStrokeWeight: 1.25,
		bgColor: "#ffffff",
		opacityMultiplier: 1,
		randomSeed: 504,
	},

	'Accent Pill 05': {
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
		baseColor: "#00645d",
		baseOpacity: 0.15,
		baseStrokeOnly: false,
		baseStrokeWeight: 2,
		accentColor: "#ea6f24",
		accentOpacity: 1,
		accentStrokeOnly: false,
		accentStrokeWeight: 2,
		bgColor: "#ffffff",
		opacityMultiplier: 1,
		randomSeed: 505,
	},

	'Dots and Pills': {
		...ACCENT_PILL_BASE,
		accentColor: '#000000',
		accentOpacity: 1,
		accentStrokeOnly: false,
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
		shapeType: 'verticalPill',
		shapeSize: 0.5,
		shapeOpacity: 0.82,
		easingIn: 'easeOutSine',
		easingOut: 'easeInOutSine',
		animInDuration: 420,
		animOutDuration: 640,
		scaleInAmount: 1,
		scaleOutAmount: 0.2,
		opacityFadeAmount: 1,
		baseColor: '#EA6F24',
		baseOpacity: 1,
		baseStrokeOnly: false,
		baseStrokeWeight: 2,
		accentColor: '#0E8E86',
		accentOpacity: 1,
		accentStrokeOnly: false,
		accentStrokeWeight: 2,
		bgColor: '#ffffff',
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
		shapeType: 'mixed',
		shapeSize: 0.62,
		shapeOpacity: 0.72,
		easingIn: 'easeOutExpo',
		easingOut: 'easeInOutQuad',
		animInDuration: 380,
		animOutDuration: 880,
		scaleInAmount: 1,
		scaleOutAmount: 0.1,
		opacityFadeAmount: 1,
		baseColor: '#EA6F24',
		baseOpacity: 1,
		baseStrokeOnly: false,
		baseStrokeWeight: 2,
		accentColor: '#0E8E86',
		accentOpacity: 1,
		accentStrokeOnly: false,
		accentStrokeWeight: 2,
		bgColor: '#ffffff',
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
		baseColor: '#EA6F24',
		baseOpacity: 1,
		baseStrokeOnly: false,
		baseStrokeWeight: 2,
		accentColor: '#000000',
		accentOpacity: 1,
		accentStrokeOnly: false,
		accentStrokeWeight: 2,
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
		baseColor: '#424856',
		baseOpacity: 1,
		baseStrokeOnly: false,
		baseStrokeWeight: 2,
		accentColor: '#000000',
		accentOpacity: 1,
		accentStrokeOnly: false,
		accentStrokeWeight: 2,
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
		shapeType: 'mixed',
		shapeSize: 0.61,
		shapeOpacity: 0.75,
		easingIn: 'easeOutSine',
		easingOut: 'easeInOutSine',
		animInDuration: 520,
		animOutDuration: 1200,
		scaleInAmount: 1,
		scaleOutAmount: 0.08,
		opacityFadeAmount: 1,
		baseColor: '#EA6F24',
		baseOpacity: 1,
		baseStrokeOnly: false,
		baseStrokeWeight: 2,
		accentColor: '#424856',
		accentOpacity: 1,
		accentStrokeOnly: false,
		accentStrokeWeight: 2,
		bgColor: '#ffffff',
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
		shapeType: 'mixed',
		shapeSize: 0.6,
		shapeOpacity: 0.95,
		easingIn: 'easeOutExpo',
		easingOut: 'easeInExpo',
		animInDuration: 120,
		animOutDuration: 220,
		scaleInAmount: 1.08,
		scaleOutAmount: 0.3,
		opacityFadeAmount: 1,
		baseColor: '#EA6F24',
		baseOpacity: 1,
		baseStrokeOnly: false,
		baseStrokeWeight: 2,
		accentColor: '#000000',
		accentOpacity: 1,
		accentStrokeOnly: false,
		accentStrokeWeight: 2,
		bgColor: '#ffffff',
		opacityMultiplier: 1,
		randomSeed: 909,
	},
	'Stroke Trail': {
		cellSize: 40,
		debugGrid: false,
		trailLength: 20,
		trailFadeAway: true,
		activationRadius: 32,
		trailDecaySpeed: 0.85,
		lingerDuration: 680,
		shapeType: 'mixed',
		shapeSize: 0.58,
		shapeOpacity: 1,
		easingIn: 'easeOutCubic',
		easingOut: 'easeInOutCubic',
		animInDuration: 420,
		animOutDuration: 720,
		scaleInAmount: 1,
		scaleOutAmount: 0.12,
		opacityFadeAmount: 1,
		baseColor: '#EA6F24',
		baseOpacity: 1,
		baseStrokeOnly: true,
		baseStrokeWeight: 1.5,
		accentColor: '#EA6F24',
		accentOpacity: 1,
		accentStrokeOnly: false,
		accentStrokeWeight: 2,
		bgColor: '#ffffff',
		opacityMultiplier: 1,
		randomSeed: 314,
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
	baseColor: '#EA6F24',
	accentColor: '#000000',
	accentOpacity: 1,
	accentStrokeOnly: false,
	accentStrokeWeight: 2,
	baseOpacity: 1,
	baseStrokeOnly: false,
	baseStrokeWeight: 2,
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

/** @type {DemoDirector|null} */
let demoDirector = null;

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
		/** When true, the next spawned cell becomes an "i" shape. */
		this.pendingI = false;
		this.distSinceI = 0;
		this.nextIDist = this.pickNextIDist();
		this.lastMoveMs = 0;
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
		this.pendingI = false;
		this.distSinceI = 0;
		this.nextIDist = this.pickNextIDist();
		this.lastMoveMs = 0;
	}

	pickNextIDist() {
		return random(I_SPACING_CELLS_MIN, I_SPACING_CELLS_MAX) * params.cellSize;
	}

	/**
	 * Track cursor movement so an "i" is guaranteed at the start of each fresh
	 * interaction and then spaced out along long, continuous strokes — no pause
	 * required, but never on every cell.
	 */
	registerMovement(segLen, now) {
		const newInteraction = this.lastMoveMs === 0 || now - this.lastMoveMs > I_INTERACTION_IDLE_MS;
		this.lastMoveMs = now;

		if (newInteraction) {
			this.pendingI = true;
			this.distSinceI = 0;
			this.nextIDist = this.pickNextIDist();
			return;
		}

		this.distSinceI += segLen;
		if (this.distSinceI >= this.nextIDist) {
			this.pendingI = true;
			this.distSinceI = 0;
			this.nextIDist = this.pickNextIDist();
		}
	}

	nextShapeKind(col, row) {
		if (this.pendingI) {
			this.pendingI = false;
			return 'i';
		}
		return this.resolveShapeKind(col, row);
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
			const shapeKind = this.nextShapeKind(cell.col, cell.row);
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
			const shapeKind = this.nextShapeKind(cell.col, cell.row);
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
		const segLen = dist(x0, y0, x1, y1);
		if (segLen >= 0.5) {
			this.registerMovement(segLen, now);
		}
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

function getShapeStrokeWeight(weight) {
	return max(0.5, weight);
}

function drawCircleShape(ox, oy, diameter, col, outlineOnly = false, lineWeight = 2) {
	const d = max(0.001, diameter);
	if (outlineOnly) {
		noFill();
		stroke(col);
		strokeWeight(getShapeStrokeWeight(lineWeight));
		circle(ox, oy, d);
		return;
	}
	noStroke();
	fill(col);
	circle(ox, oy, d);
}

function drawPillShape(ox, oy, width, height, col, outlineOnly = false, lineWeight = 2) {
	const br = min(width, height) * PILL_BORDER_RADIUS;
	const w = max(0.001, width);
	const h = max(0.001, height);
	if (outlineOnly) {
		noFill();
		stroke(col);
		strokeWeight(getShapeStrokeWeight(lineWeight));
		rect(ox, oy, w, h, br);
		return;
	}
	noStroke();
	fill(col);
	rect(ox, oy, w, h, br);
}

/** Draws the letter "i": a vertical pill stem with a separate dot above it. */
function drawIShape(ox, oy, unit, col, outlineOnly = false, lineWeight = 2) {
	if (unit <= 0.001) return;

	const dotD = unit * 0.95;
	const gap = unit * 0.42;
	const stemW = unit;
	const stemH = unit * 1.7;

	const totalH = dotD + gap + stemH;
	const topY = oy - totalH / 2;
	const dotCy = topY + dotD / 2;
	const stemCy = topY + dotD + gap + stemH / 2;

	drawCircleShape(ox, dotCy, dotD, col, outlineOnly, lineWeight);
	drawPillShape(ox, stemCy, stemW, stemH, col, outlineOnly, lineWeight);
}

/**
 * True when a vertical neighbour is a currently-visible "i". The "i" is taller
 * than one cell, so its dot/stem reaches into the cells above and below; those
 * neighbours must yield so nothing overlaps the "i".
 */
function hasAdjacentActiveI(cell) {
	if (!grid) return false;
	const above = grid.cellMap.get(grid.key(cell.col, cell.row - 1));
	if (above && above.shapeKind === 'i' && above.isActiveOrAnimating()) return true;
	const below = grid.cellMap.get(grid.key(cell.col, cell.row + 1));
	if (below && below.shapeKind === 'i' && below.isActiveOrAnimating()) return true;
	return false;
}

function drawCellShape(cell) {
	const opacity = cell.getOpacity();
	if (opacity <= 0.001) return;

	const isI = cell.shapeKind === 'i';
	if (!isI && hasAdjacentActiveI(cell)) return;

	const hex = isI ? params.accentColor : params.baseColor;
	const col = color(hex);
	const colorOpacity = isI ? params.accentOpacity : params.baseOpacity;
	const alpha = constrain(opacity, 0, 1) * colorOpacity;
	col.setAlpha(alpha * 255);

	const ox = cell.cx;
	const oy = cell.cy;
	const d = cell.getDrawDiameter();
	const outlineOnly = isI ? params.accentStrokeOnly : params.baseStrokeOnly;
	const lineWeight = isI ? params.accentStrokeWeight : params.baseStrokeWeight;

	if (isI) {
		drawIShape(ox, oy, d, col, outlineOnly, lineWeight);
		return;
	}

	if (cell.usesPill()) {
		const pillH = min(d * 2, params.cellSize * 0.9);
		drawPillShape(ox, oy, d, pillH, col, outlineOnly, lineWeight);
		return;
	}

	drawCircleShape(ox, oy, d, col, outlineOnly, lineWeight);
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
	params.baseOpacity = patch.baseOpacity ?? DEFAULT_PARAMS.baseOpacity;
	params.baseStrokeOnly = patch.baseStrokeOnly ?? patch.strokeOnlyTrail ?? false;
	params.baseStrokeWeight = patch.baseStrokeWeight ?? patch.strokeWeight ?? DEFAULT_PARAMS.baseStrokeWeight;
	params.accentOpacity = patch.accentOpacity ?? DEFAULT_PARAMS.accentOpacity;
	params.accentStrokeOnly = patch.accentStrokeOnly ?? false;
	params.accentStrokeWeight =
		patch.accentStrokeWeight ?? patch.strokeWeight ?? DEFAULT_PARAMS.accentStrokeWeight;
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
	restartDemoLoop();
}

// ─── Demo mode (perfect loops + .webm export) ────────────────────────────────

/**
 * Catmull-Rom sample through normalized waypoints. Points may sit outside 0–1
 * so the cursor can enter / leave the frame cleanly.
 */
function sampleCatmullRom(points, u) {
	const n = points.length;
	if (n === 0) return { x: 0.5, y: 0.5 };
	if (n === 1) return { x: points[0][0], y: points[0][1] };

	const maxSeg = n - 1;
	const t = constrain(u, 0, 1) * maxSeg;
	const i = min(floor(t), maxSeg - 1);
	const local = t - i;

	const p0 = points[max(0, i - 1)];
	const p1 = points[i];
	const p2 = points[min(n - 1, i + 1)];
	const p3 = points[min(n - 1, i + 2)];

	const t2 = local * local;
	const t3 = t2 * local;

	const x =
		0.5 *
		(2 * p1[0] +
			(-p0[0] + p2[0]) * local +
			(2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
			(-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
	const y =
		0.5 *
		(2 * p1[1] +
			(-p0[1] + p2[1]) * local +
			(2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
			(-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);

	return { x, y };
}

class DemoDirector {
	constructor(mode) {
		this.mode = mode;
		this.startMs = 0;
		this.lastPhase = 0;
		this.prevCursor = { x: 0, y: 0 };
		this.cursorReady = false;
		this.fadeStarted = false;
		this.spawned = new Set();
		/** @type {Set<string>} planned "i" cell keys for the current cycle */
		this.iKeys = new Set();
		this.isRecording = false;
		this.mediaRecorder = null;
		this.recordedChunks = [];
		this.recordStopTimer = null;
		/** @type {number[][]} regenerated each Demo 1 cycle */
		this.mouseWaypoints = [];
	}

	begin() {
		this.startMs = -1;
		requestAnimationFrame(() => this.restartLoop());
	}

	/** Clear trail and restart the loop clock from phase 0. */
	restartLoop() {
		this.resetCycle();
		this.startMs = millis();
		this.lastPhase = 0;
		this.prevCursor = this.cursorAt(0);
		this.cursorReady = true;
	}

	resetCycle() {
		trail.clear();
		this.spawned = new Set();
		this.fadeStarted = false;
		this.cursorReady = false;
		if (this.mode === 1) this.generateMousePath();
		this.planIPositions();
	}

	/**
	 * Build a fresh enter → curve → exit path in normalized coords.
	 * Always starts off the left edge and exits off the right; interior bends vary.
	 */
	generateMousePath() {
		const start = [-0.12, random(0.18, 0.82)];
		const end = [1.12, random(0.18, 0.82)];
		const points = [start];

		// Inward first step so the stroke clearly enters from the left.
		points.push([random(0.1, 0.24), constrain(start[1] + random(-0.12, 0.12), 0.12, 0.88)]);

		const bends = 4 + Math.floor(random(0, 4));
		let prev = points[points.length - 1];
		for (let i = 0; i < bends; i++) {
			const t = (i + 1) / (bends + 1);
			// Progress left → right with lateral drift for curves.
			const baseX = lerp(0.18, 0.82, t) + random(-0.06, 0.06);
			const baseY = lerp(prev[1], end[1], 0.2 + t * 0.35);
			const drift = 0.16 + random(0, 0.2);
			const nx = constrain(baseX, 0.08, 0.92);
			const ny = constrain(baseY + random(-drift, drift), 0.08, 0.92);
			if (dist(prev[0], prev[1], nx, ny) < 0.1) continue;
			prev = [nx, ny];
			points.push(prev);
		}

		points.push([random(0.76, 0.9), constrain(end[1] + random(-0.12, 0.12), 0.12, 0.88)]);
		points.push(end);
		this.mouseWaypoints = points;
	}

	/**
	 * Place "i" letters with a minimum Chebyshev gap so none sit next to each
	 * other horizontally, vertically, or diagonally.
	 */
	planIPositions() {
		this.iKeys = new Set();
		if (this.mode === 1 || !grid) return;

		const minD = max(2, Math.round(DEMO_CONFIG.iMinSpacing));
		const scored = [];
		for (let i = 0; i < grid.cells.length; i++) {
			const cell = grid.cells[i];
			const hash = Math.abs(cell.col * 73856093 ^ cell.row * 19349663 ^ params.randomSeed);
			const prefer = hash % 17 === 0;
			const order = noise(cell.col * 0.21, cell.row * 0.21, params.randomSeed * 0.01);
			scored.push({ cell, prefer, order });
		}
		scored.sort((a, b) => {
			if (a.prefer !== b.prefer) return a.prefer ? -1 : 1;
			return a.order - b.order;
		});

		for (let i = 0; i < scored.length; i++) {
			if (!scored[i].prefer) break;
			const { col, row } = scored[i].cell;
			if (this.canPlaceI(col, row, minD)) {
				this.iKeys.add(grid.key(col, row));
			}
		}
	}

	canPlaceI(col, row, minD) {
		for (const key of this.iKeys) {
			const comma = key.indexOf(',');
			const c = Number(key.slice(0, comma));
			const r = Number(key.slice(comma + 1));
			const d = max(abs(c - col), abs(r - row));
			if (d < minD) return false;
		}
		return true;
	}

	phaseAt(now) {
		if (this.startMs < 0) return 0;
		const elapsed = max(0, now - this.startMs);
		return (elapsed % DEMO_CONFIG.durationMs) / DEMO_CONFIG.durationMs;
	}

	cursorAt(travelU) {
		const n = sampleCatmullRom(this.mouseWaypoints, travelU);
		return { x: n.x * width, y: n.y * height };
	}

	demoShapeKind(col, row) {
		if (this.iKeys.has(grid.key(col, row))) return 'i';
		return trail.resolveShapeKind(col, row);
	}

	spawnCell(cell) {
		if (this.spawned.has(cell) || cell.state !== 'inactive') return;
		const kind = this.demoShapeKind(cell.col, cell.row);
		cell.spawn(0, kind, cell.cx, cell.cy);
		this.spawned.add(cell);
	}

	fadeAllActive() {
		if (this.fadeStarted) return;
		this.fadeStarted = true;
		for (let i = 0; i < grid.cells.length; i++) {
			const cell = grid.cells[i];
			if (cell.isActiveOrAnimating()) {
				cell.beginFadeOut();
			}
		}
		trail.queue = [];
		trail.underCursor = new Set();
	}

	update(now, dt) {
		if (this.startMs < 0) {
			trail.update(now, dt);
			return;
		}

		const phase = this.phaseAt(now);
		if (phase < this.lastPhase) {
			this.resetCycle();
			this.prevCursor = this.cursorAt(0);
			this.cursorReady = true;
		}
		this.lastPhase = phase;

		if (this.mode === 1) this.updateMouseDemo(phase, now);
		else if (this.mode === 2) this.updateGridNoiseDemo(phase);
		else if (this.mode === 3) this.updateVerticalWaveDemo(phase);

		trail.update(now, dt);
	}

	/** Simulated cursor: enter → curve → exit → forced fade for a clean loop. */
	updateMouseDemo(phase, now) {
		const travelStart = 0.04;
		const travelEnd = 0.72;
		const fadeAt = 0.8;

		if (phase >= fadeAt) {
			this.fadeAllActive();
			return;
		}

		const u =
			phase <= travelStart
				? 0
				: phase >= travelEnd
					? 1
					: (phase - travelStart) / (travelEnd - travelStart);

		const cur = this.cursorAt(u);
		if (!this.cursorReady) {
			this.prevCursor = cur;
			this.cursorReady = true;
			return;
		}

		const seg = dist(this.prevCursor.x, this.prevCursor.y, cur.x, cur.y);
		const steps = max(1, ceil(seg / max(1, params.cellSize * 0.35)));
		for (let s = 1; s <= steps; s++) {
			const t0 = (s - 1) / steps;
			const t1 = s / steps;
			const x0 = lerp(this.prevCursor.x, cur.x, t0);
			const y0 = lerp(this.prevCursor.y, cur.y, t0);
			const x1 = lerp(this.prevCursor.x, cur.x, t1);
			const y1 = lerp(this.prevCursor.y, cur.y, t1);
			trail.processMouse(x0, y0, x1, y1, now);
		}
		this.prevCursor = cur;
	}

	/** Full grid: noise-staggered appear, short hold, noise-staggered fade. */
	updateGridNoiseDemo(phase) {
		const appearWindow = 0.42;
		const holdEnd = 0.55;
		const fadeWindow = 0.38;

		for (let i = 0; i < grid.cells.length; i++) {
			const cell = grid.cells[i];
			const n = noise(cell.col * 0.17, cell.row * 0.17, 0.4);
			const appearAt = n * appearWindow;
			const fadeAt = holdEnd + (1 - n) * fadeWindow * 0.35;

			if (phase >= appearAt && phase < holdEnd) {
				this.spawnCell(cell);
			}
			if (phase >= fadeAt && cell.isActiveOrAnimating() && cell.state !== 'out') {
				cell.beginFadeOut();
			}
		}

		if (phase >= holdEnd + fadeWindow * 0.85) {
			this.fadeAllActive();
		}
	}

	/** Bottom-up sine wave fill, then bottom-up fade so the wave drains upward. */
	updateVerticalWaveDemo(phase) {
		const fillEnd = 0.52;
		const holdEnd = 0.6;
		const fadeEnd = 0.95;

		if (phase < fillEnd) {
			const fillU = applyEasing(phase / fillEnd, 'easeInOutSine');
			const waveAmp = params.cellSize * 2.2;

			for (let i = 0; i < grid.cells.length; i++) {
				const cell = grid.cells[i];
				const wave = Math.sin(cell.col * 0.45 + fillU * Math.PI * 2.5) * waveAmp;
				// Lower rank = closer to bottom; wave advances upward as fillU grows.
				const cellRank = 1 - cell.cy / height + wave / height;
				const threshold = fillU * 1.15 - 0.05;
				if (cellRank <= threshold) {
					this.spawnCell(cell);
				}
			}
			return;
		}

		if (phase < holdEnd) return;

		const fadeU = applyEasing((phase - holdEnd) / max(0.001, fadeEnd - holdEnd), 'easeInOutSine');
		for (let i = 0; i < grid.cells.length; i++) {
			const cell = grid.cells[i];
			if (!cell.isActiveOrAnimating() || cell.state === 'out') continue;
			// Fade from bottom first → top last (same upward direction as the fill).
			const fromBottom = 1 - cell.cy / height;
			if (fromBottom <= fadeU * 1.1) {
				cell.beginFadeOut();
			}
		}

		if (phase >= fadeEnd) {
			this.fadeAllActive();
		}
	}

	requestRecord() {
		if (this.isRecording) {
			showToast('Already recording…');
			return;
		}
		this.startMs = -1;
		this.lastPhase = 0;
		this.resetCycle();
		requestAnimationFrame(() => {
			this.startMs = millis();
			this.prevCursor = this.cursorAt(0);
			this.cursorReady = true;
			this.startRecording();
		});
	}

	pickRecorderMime() {
		const candidates = [
			'video/webm;codecs=vp9',
			'video/webm;codecs=vp8',
			'video/webm',
		];
		for (let i = 0; i < candidates.length; i++) {
			if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(candidates[i])) {
				return candidates[i];
			}
		}
		return '';
	}

	startRecording() {
		if (this.isRecording || typeof MediaRecorder === 'undefined') {
			if (!this.isRecording) showToast('Recording unavailable');
			return;
		}

		const canvas = document.querySelector('#app canvas');
		if (!canvas || typeof canvas.captureStream !== 'function') {
			showToast('captureStream unavailable');
			return;
		}

		const mimeType = this.pickRecorderMime();
		const stream = canvas.captureStream(DEMO_CONFIG.fps);
		this.recordedChunks = [];

		try {
			this.mediaRecorder = mimeType
				? new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 12_000_000 })
				: new MediaRecorder(stream, { videoBitsPerSecond: 12_000_000 });
		} catch (err) {
			console.warn(err);
			showToast('MediaRecorder failed');
			return;
		}

		this.isRecording = true;

		this.mediaRecorder.ondataavailable = (e) => {
			if (e.data && e.data.size > 0) this.recordedChunks.push(e.data);
		};

		this.mediaRecorder.onstop = () => {
			this.isRecording = false;
			if (this.recordStopTimer) {
				clearTimeout(this.recordStopTimer);
				this.recordStopTimer = null;
			}
			stream.getTracks().forEach((t) => t.stop());
			this.downloadRecording();
		};

		this.mediaRecorder.start(250);
		showToast(`Recording demo ${this.mode}…`);

		this.recordStopTimer = setTimeout(() => {
			this.recordStopTimer = null;
			if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
				this.mediaRecorder.stop();
			}
		}, DEMO_CONFIG.durationMs);
	}

	downloadRecording() {
		if (!this.recordedChunks.length) {
			showToast('Recording produced no data');
			return;
		}
		const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `grid-trail-demo-${this.mode}.webm`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
		showToast(`Downloaded grid-trail-demo-${this.mode}.webm`);
	}
}

function restartDemoLoop() {
	if (DEMO_MODE && demoDirector) {
		demoDirector.restartLoop();
	}
}

// ─── GUI ─────────────────────────────────────────────────────────────────────

function setupGui() {
	const GUICtor = typeof lil !== 'undefined' ? lil.GUI : typeof GUI !== 'undefined' ? GUI : null;
	if (!GUICtor) return;

	gui = new GUICtor({ title: DEMO_MODE ? `Grid Trail · Demo ${DEMO_MODE}` : 'Grid Trail' });
	tailFadeControllers = [];

	if (DEMO_MODE) {
		const gDemo = gui.addFolder('Demo export');
		gDemo.add(DEMO_CONFIG, 'durationMs', 2000, 30000, 500).name('duration (ms)').onFinishChange(() => {
			restartDemoLoop();
		});
		gDemo.add(DEMO_CONFIG, 'iMinSpacing', 2, 8, 1).name('i min spacing').onFinishChange(() => {
			restartDemoLoop();
		});
		gDemo.add(DEMO_CONFIG, 'fps', 15, 60, 1).name('record fps');
		gDemo
			.add(
				{
					record: () => {
						if (demoDirector) demoDirector.requestRecord();
					},
				},
				'record'
			)
			.name('Record');
		gDemo.open();
	}

	const gGrid = gui.addFolder('Grid');
	gGrid.add(params, 'cellSize', 12, 64, 1).onFinishChange(() => {
		grid.rebuild();
		restartDemoLoop();
	});
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
	const gBase = gColor.addFolder('Base (trail)');
	gBase.addColor(params, 'baseColor').name('color');
	gBase.add(params, 'baseOpacity', 0.05, 1, 0.05).name('opacity');
	gBase.add(params, 'baseStrokeOnly').name('stroke only');
	gBase.add(params, 'baseStrokeWeight', 0.5, 6, 0.25).name('stroke weight');
	const gAccent = gColor.addFolder('Accent (i)');
	gAccent.addColor(params, 'accentColor').name('color');
	gAccent.add(params, 'accentOpacity', 0.05, 1, 0.05).name('opacity');
	gAccent.add(params, 'accentStrokeOnly').name('stroke only');
	gAccent.add(params, 'accentStrokeWeight', 0.5, 6, 0.25).name('stroke weight');
	gColor.addColor(params, 'bgColor').name('background');
	gColor.add(params, 'opacityMultiplier', 0.2, 1, 0.01);
	gColor.add(params, 'randomSeed', 0, 99999, 1).onFinishChange(() => {
		grid.rebuild();
		restartDemoLoop();
	});

	const gPresets = gui.addFolder('Presets');
	gPresets.add(params, 'preset', PRESET_NAMES).name('preset').onChange((name) => {
		applyPreset(name);
		restartDemoLoop();
	});
	gPresets.add({ applyCurrentPreset }, 'applyCurrentPreset').name('apply preset');
	gPresets.add(params, 'presetExportName').name('export name');
	gPresets.add({ savePresetToClipboard }, 'savePresetToClipboard').name('export preset as JSON');

	syncTrailFadeControls();
	if (!DEMO_MODE) {
		gui.close();
	}
}

// ─── p5 lifecycle ────────────────────────────────────────────────────────────

function setup() {
	const w = DEMO_MODE ? DEMO_CONFIG.width : windowWidth;
	const h = DEMO_MODE ? DEMO_CONFIG.height : windowHeight;
	const canvasEl = createCanvas(w, h);
	canvasEl.parent('app');
	pixelDensity(DEMO_MODE ? 1 : min(2, displayDensity()));
	rectMode(CENTER);
	colorMode(RGB, 255);
	grid = new GridSystem();
	trail = new TrailManager(grid);
	grid.rebuild();
	prevMouse.x = width * 0.5;
	prevMouse.y = height * 0.5;

	if (DEMO_MODE) {
		document.body.classList.add('demo-mode');
		document.title = `p5.js — Grid Trail · Demo ${DEMO_MODE}`;
		frameRate(DEMO_CONFIG.fps);
		applyPreset(DEMO_CONFIG.preset);
		demoDirector = new DemoDirector(DEMO_MODE);
		setupGui();
		demoDirector.begin();
		return;
	}

	setupGui();
}

function draw() {
	timeMs = millis();
	const dt = min(deltaTime, 64);

	background(params.bgColor);

	if (DEMO_MODE && demoDirector) {
		demoDirector.update(timeMs, dt);
		drawTrail();
		if (params.debugGrid) {
			grid.drawDebug();
		}
		return;
	}

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
	if (DEMO_MODE) return;
	resizeCanvas(windowWidth, windowHeight);
	grid.rebuild();
}

function touchMoved() {
	if (DEMO_MODE) return false;
	if (touches.length > 0) {
		return false;
	}
}
