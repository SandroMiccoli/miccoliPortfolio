/**
 * p5.js — Dots and Lines
 *
 * Chaotic grid of drifting dots (noise-displaced from their homes) with tracers
 * that magnetize dots into order as they pass. Hover organizes a local grid;
 * lines gather speed near dense clusters. Dots relax back to chaos over time.
 * A central rectangle is kept clear for overlay text.
 */

// ─── Palette ─────────────────────────────────────────────────────────────────

const COLORS = {
	background: '#FFC608',
	inactive: '#E0AC00',
	active: '#6E6BFF',
};

// ─── Tunable parameters ────────────────────────────────────────────────────────

const DEFAULT_PARAMS = {
	// Grid
	gridSpacing: 26,
	dotSize: 0.32,

	// Noise / blank areas
	blankNoiseScale: 0.09,
	blankThreshold: 0.42,
	randomSeed: 7,

	// Dot scale lifecycle (appear → max → shrink → gone)
	lifeDurationMin: 5200,
	lifeDurationMax: 11000,
	dotVisibleFrac: 0.82,

	// Activation (dot turning blue and back)
	activeLingerMs: 1400,
	activeFadeInMs: 420,
	activeFadeOutMs: 1600,

	// Tracers (the growing lines)
	maxTracers: 7,
	spawnIntervalMs: 480,
	spawnIntervalJitter: 0.45,
	tracerStepMs: 100,
	tracerStepJitter: 0.35,
	maxWallTurns: 3,
	lineWeight: 2.5,
	trailLingerMs: 900,
	trailFadeMs: 1400,

	// Energy — lines speed up near dense dot clusters (smoothed, clamped)
	energyEnabled: true,
	energyRadius: 85,
	energyStepMultMin: 0.8,
	energyStepMultMax: 1.18,
	energyInfluence: 0.6,
	energyEaseMs: 480,

	// Intro (dots first, then lines)
	tracerIntroDelayMs: 1800,
	introDotStaggerMs: 1400,
	introDotRiseMs: 380,

	// Spread to nearby dots
	spreadRadius: 1,
	spreadChance: 0.15,

	// Target-column flow (at least one tracer always seeks this column)
	targetFlowEnabled: true,
	targetColumnFrac: 0.12,
	targetRowFrac: 1,
	targetSeekStrength: 0.88,
	targetTurnChance: 0.04,
	targetExitAfterGoal: true,

	// Mouse interaction
	hoverRadius: 120,
	hoverSettleScale: 1,
	hoverEaseMs: 520,
	hoverParkMs: 380,

	// Chaos / order (dots drift off-grid; lines magnetize them home)
	chaosAmplitude: 0.55,
	chaosNoiseScale: 0.18,
	chaosTimeScale: 0.00012,
	chaosEaseMs: 600,
	magnetRadius: 70,
	magnetStrength: 1.0,
	magnetSettleScale: 1,
	magnetSettleEaseMs: 520,
	orderDecayMs: 2600,

	// Debug / overlays
	showFps: false,
	debugTargetFlow: false,

	// Central clear rectangle (for text overlay)
	clearRectWidthFrac: 0.46,
	clearRectHeightFrac: 0.34,
	showClearRect: false,

	// Background colours
	bgColor: COLORS.background,
	inactiveColor: COLORS.inactive,
	activeColor: COLORS.active,
};

const PRESETS = {
	'Hero (reference)': {
		gridSpacing: 36,
		dotSize: 0.32,
		blankNoiseScale: 0.09,
		blankThreshold: 0.42,
		dotVisibleFrac: 0.82,
		maxTracers: 3,
		spawnIntervalMs: 480,
		spawnIntervalJitter: 0.45,
		tracerStepMs: 100,
		tracerStepJitter: 0.35,
		maxWallTurns: 3,
		tracerIntroDelayMs: 2500,
		introDotStaggerMs: 2000,
		introDotRiseMs: 380,
		spreadRadius: 1,
		spreadChance: 0.15,
		targetFlowEnabled: true,
		targetColumnFrac: 0.12,
		targetSeekStrength: 0.88,
		trailLingerMs: 900,
		trailFadeMs: 1400,
		energyEnabled: true,
		energyRadius: 85,
		energyStepMultMin: 0.8,
		energyStepMultMax: 1.18,
		energyInfluence: 0.6,
		hoverRadius: 130,
		hoverSettleScale: 1,
		hoverEaseMs: 520,
		hoverParkMs: 380,
		chaosAmplitude: 1.2,
		chaosNoiseScale: 0.18,
		chaosTimeScale: 0.00012,
		chaosEaseMs: 80,
		magnetRadius: 100,
		magnetStrength: 3.0,
		magnetSettleScale: 1,
		magnetSettleEaseMs: 1200,
		orderDecayMs: 5000,
		randomSeed: 7,
	},
	'Dense Circuit': {
		gridSpacing: 20,
		dotSize: 0.3,
		blankNoiseScale: 0.12,
		blankThreshold: 0.38,
		dotVisibleFrac: 0.88,
		maxTracers: 11,
		spawnIntervalMs: 420,
		spawnIntervalJitter: 0.4,
		tracerStepMs: 110,
		tracerStepJitter: 0.3,
		maxWallTurns: 4,
		tracerIntroDelayMs: 1200,
		introDotStaggerMs: 900,
		spreadRadius: 1,
		spreadChance: 0.55,
		targetFlowEnabled: true,
		targetColumnFrac: 0.1,
		targetSeekStrength: 0.82,
		trailLingerMs: 700,
		trailFadeMs: 1100,
		energyEnabled: true,
		energyInfluence: 0.75,
		chaosAmplitude: 0.45,
		chaosNoiseScale: 0.22,
		magnetRadius: 60,
		magnetStrength: 1.2,
		orderDecayMs: 2000,
		randomSeed: 21,
	},
	'Calm & Sparse': {
		gridSpacing: 34,
		dotSize: 0.34,
		blankNoiseScale: 0.07,
		blankThreshold: 0.5,
		dotVisibleFrac: 0.72,
		maxTracers: 4,
		spawnIntervalMs: 1100,
		spawnIntervalJitter: 0.35,
		tracerStepMs: 220,
		tracerStepJitter: 0.25,
		maxWallTurns: 2,
		tracerIntroDelayMs: 2400,
		introDotStaggerMs: 2000,
		spreadRadius: 1,
		spreadChance: 0.3,
		targetFlowEnabled: true,
		targetColumnFrac: 0.14,
		targetSeekStrength: 0.92,
		trailLingerMs: 1200,
		trailFadeMs: 2000,
		energyEnabled: true,
		energyInfluence: 0.4,
		chaosAmplitude: 0.65,
		chaosTimeScale: 0.00008,
		magnetStrength: 0.85,
		orderDecayMs: 4000,
		hoverRadius: 100,
		randomSeed: 42,
	},
};

const PRESET_NAMES = Object.keys(PRESETS);

const params = { ...DEFAULT_PARAMS, ...PRESETS[PRESET_NAMES[0]], preset: PRESET_NAMES[0] };

// ─── Runtime state ─────────────────────────────────────────────────────────────

let gui = null;
let grid = null;
let tracers = null;
let timeMs = 0;
let prefersReducedMotion = false;

// Cached RGB channels for fast per-dot colour blending.
let bgRGB = { r: 255, g: 198, b: 8 };
let inactiveRGB = { r: 224, g: 172, b: 0 };
let activeRGB = { r: 110, g: 107, b: 255 };

// ─── Small helpers ───────────────────────────────────────────────────────────

const CARDINALS = [
	{ dx: 1, dy: 0 },
	{ dx: -1, dy: 0 },
	{ dx: 0, dy: 1 },
	{ dx: 0, dy: -1 },
];

function hexToRGB(hex) {
	const c = String(hex).replace('#', '');
	const full = c.length === 3 ? c.split('').map((ch) => ch + ch).join('') : c;
	return {
		r: parseInt(full.slice(0, 2), 16),
		g: parseInt(full.slice(2, 4), 16),
		b: parseInt(full.slice(4, 6), 16),
	};
}

function cacheColors() {
	bgRGB = hexToRGB(params.bgColor);
	inactiveRGB = hexToRGB(params.inactiveColor);
	activeRGB = hexToRGB(params.activeColor);
}

function moveToward(value, target, maxStep) {
	if (value < target) return Math.min(target, value + maxStep);
	if (value > target) return Math.max(target, value - maxStep);
	return value;
}

/** Smooth raised-cosine bell: 0 → 1 → 0 over u∈[0,1], flat at both ends. */
function bell(u) {
	return 0.5 - 0.5 * Math.cos(u * TWO_PI);
}

function isPerpendicular(a, b) {
	return a.dx * b.dx + a.dy * b.dy === 0;
}

function detectReducedMotion() {
	if (typeof window === 'undefined' || !window.matchMedia) return;
	const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
	const apply = () => {
		prefersReducedMotion = mq.matches;
	};
	apply();
	if (typeof mq.addEventListener === 'function') {
		mq.addEventListener('change', apply);
	} else if (typeof mq.addListener === 'function') {
		mq.addListener(apply);
	}
}

function effectiveChaosTimeScale() {
	return prefersReducedMotion ? 0 : params.chaosTimeScale;
}

// ─── Cell ────────────────────────────────────────────────────────────────────

class Cell {
	constructor(col, row, cx, cy, hasDot, inClearRect) {
		this.col = col;
		this.row = row;
		this.cx = cx;
		this.cy = cy;
		this.homeX = cx;
		this.homeY = cy;
		this.px = cx;
		this.py = cy;
		this.hasDot = hasDot;
		this.inClearRect = inClearRect;

		this.lifeOffset = random();
		this.lifeDuration = random(params.lifeDurationMin, params.lifeDurationMax);

		this.activation = 0;
		this.activeUntil = 0;
		this.hoverPull = 0;
		this.settleBlend = 0;
		this.magnetBlend = 0;
		this.order = 0;
		this.phase = random(1000);
		this.introStagger = noise(col * 0.31 + 17, row * 0.29 + 41);
	}

	activate(now, lingerMs) {
		if (this.inClearRect) return;
		this.activeUntil = Math.max(this.activeUntil, now + lingerMs);
	}

	/** Animated noise offset from the grid home position. */
	chaosTarget(now) {
		const pitch = params.gridSpacing;
		const amp = params.chaosAmplitude * pitch;
		const s = params.chaosNoiseScale;
		const t = now * effectiveChaosTimeScale();
		const n1 = noise(this.homeX * s + this.phase, this.homeY * s, t);
		const n2 = noise(this.homeX * s, this.homeY * s + this.phase + 100, t + 50);
		const dx = (n1 - 0.5) * 2 * amp;
		const dy = (n2 - 0.5) * 2 * amp;
		return { x: this.homeX + dx, y: this.homeY + dy };
	}

	bumpOrder(amount) {
		this.order = min(1, this.order + amount);
	}

	update(now, dt, hoverPullTarget = 0) {
		const actTarget = now < this.activeUntil ? 1 : 0;
		const actDurMs = actTarget > this.activation ? params.activeFadeInMs : params.activeFadeOutMs;
		const actStep = dt / Math.max(1, actDurMs);
		this.activation = moveToward(this.activation, actTarget, actStep);

		const hoverStep = dt / Math.max(1, params.hoverEaseMs);
		const magnetStep = dt / Math.max(1, params.magnetSettleEaseMs);
		this.hoverPull = moveToward(this.hoverPull, hoverPullTarget, hoverStep);
		this.settleBlend = moveToward(this.settleBlend, this.hoverPull, hoverStep);

		if (this.hoverPull > 0.001) {
			this.order = moveToward(this.order, 1, hoverStep);
			this.magnetBlend = moveToward(this.magnetBlend, this.order, magnetStep);
			const parkStep = params.gridSpacing * (dt / Math.max(1, params.hoverParkMs)) * this.hoverPull;
			this.px = moveToward(this.px, this.homeX, parkStep);
			this.py = moveToward(this.py, this.homeY, parkStep);
			if (abs(this.px - this.homeX) < 0.01 && abs(this.py - this.homeY) < 0.01) {
				this.px = this.homeX;
				this.py = this.homeY;
			}
			return;
		}

		const decayStep = dt / Math.max(1, params.orderDecayMs);
		this.order = moveToward(this.order, 0, decayStep);

		const chaos = this.chaosTarget(now);
		const targetX = lerp(chaos.x, this.homeX, this.order);
		const targetY = lerp(chaos.y, this.homeY, this.order);
		const posEase = min(1, dt / Math.max(1, params.chaosEaseMs));
		this.px = lerp(this.px, targetX, posEase);
		this.py = lerp(this.py, targetY, posEase);
		this.magnetBlend = moveToward(this.magnetBlend, this.order, magnetStep);
	}

	lifeScale(now) {
		if (!this.hasDot) return 0;
		const phase = ((now / Math.max(1, this.lifeDuration)) + this.lifeOffset) % 1;
		const vis = params.dotVisibleFrac;
		if (phase > vis) return 0;
		return bell(phase / vis) * this.introFactor(now);
	}

	/** Staggered fade-in at scene start so dots populate before lines arrive. */
	introFactor(now) {
		if (prefersReducedMotion || params.introDotStaggerMs <= 0) return 1;
		const delay = this.introStagger * params.introDotStaggerMs;
		const rise = Math.max(1, params.introDotRiseMs);
		if (now < delay) return 0;
		return min(1, (now - delay) / rise);
	}
}

// ─── Grid ──────────────────────────────────────────────────────────────────────

class GridSystem {
	constructor() {
		this.cols = 0;
		this.rows = 0;
		this.cells = [];
		this.ox = 0;
		this.oy = 0;
		this.clearRect = { x: 0, y: 0, w: 0, h: 0 };
	}

	idx(col, row) {
		return row * this.cols + col;
	}

	inBounds(col, row) {
		return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
	}

	getCell(col, row) {
		if (!this.inBounds(col, row)) return null;
		return this.cells[this.idx(col, row)];
	}

	pointInClearRect(x, y) {
		const r = this.clearRect;
		return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
	}

	cellInClearRect(col, row) {
		const c = this.getCell(col, row);
		return c ? c.inClearRect : this.pointInClearRect(this.ox + col * params.gridSpacing, this.oy + row * params.gridSpacing);
	}

	getTargetColumn() {
		return constrain(floor(this.cols * params.targetColumnFrac), 0, this.cols - 1);
	}

	getTargetRow() {
		const row = floor((this.rows - 1) * params.targetRowFrac);
		return constrain(row, 0, this.rows - 1);
	}

	nearestCell(wx, wy) {
		const pitch = params.gridSpacing;
		const col = constrain(round((wx - this.ox) / pitch), 0, this.cols - 1);
		const row = constrain(round((wy - this.oy) / pitch), 0, this.rows - 1);
		return this.getCell(col, row);
	}

	randomSpawnCell(maxAttempts = 80) {
		for (let i = 0; i < maxAttempts; i++) {
			const col = floor(random(0, this.cols));
			const row = floor(random(0, this.rows));
			const cell = this.getCell(col, row);
			if (cell && !cell.inClearRect) return cell;
		}
		return null;
	}

	randomSpawnCellAwayFromGoal(goalCol, goalRow, minDist = 4) {
		for (let i = 0; i < 100; i++) {
			const cell = this.randomSpawnCell(1);
			if (!cell) return null;
			const d = abs(cell.col - goalCol) + abs(cell.row - goalRow);
			if (d >= minDist) return cell;
		}
		return this.randomSpawnCell();
	}

	rebuild() {
		randomSeed(params.randomSeed);
		noiseSeed(params.randomSeed);

		const pitch = params.gridSpacing;
		this.cols = max(1, floor(width / pitch));
		this.rows = max(1, floor(height / pitch));

		const totalW = this.cols * pitch;
		const totalH = this.rows * pitch;
		this.ox = (width - totalW) / 2 + pitch * 0.5;
		this.oy = (height - totalH) / 2 + pitch * 0.5;

		this.clearRect = {
			x: (width - width * params.clearRectWidthFrac) / 2,
			y: (height - height * params.clearRectHeightFrac) / 2,
			w: width * params.clearRectWidthFrac,
			h: height * params.clearRectHeightFrac,
		};

		this.cells = [];
		for (let row = 0; row < this.rows; row++) {
			for (let col = 0; col < this.cols; col++) {
				const cx = this.ox + col * pitch;
				const cy = this.oy + row * pitch;
				const n = noise(col * params.blankNoiseScale, row * params.blankNoiseScale);
				const inClear = this.pointInClearRect(cx, cy);
				const hasDot = n > params.blankThreshold && !inClear;
				this.cells.push(new Cell(col, row, cx, cy, hasDot, inClear));
			}
		}
	}

	magnetize(x, y, radius, amount) {
		const pitch = params.gridSpacing;
		const col = round((x - this.ox) / pitch);
		const row = round((y - this.oy) / pitch);
		const cellRadius = ceil(radius / pitch) + 1;
		const r2 = radius * radius;

		for (let dr = -cellRadius; dr <= cellRadius; dr++) {
			for (let dc = -cellRadius; dc <= cellRadius; dc++) {
				const c = this.getCell(col + dc, row + dr);
				if (!c || c.inClearRect) continue;
				const dx = c.homeX - x;
				const dy = c.homeY - y;
				const d2 = dx * dx + dy * dy;
				if (d2 > r2) continue;
				const falloff = 1 - sqrt(d2) / radius;
				c.bumpOrder(amount * falloff);
			}
		}
	}

	/** Normalized 0–1 dot presence around a point (visible dots weighted by distance). */
	dotEnergyAt(x, y, radius, now) {
		const pitch = params.gridSpacing;
		const col = round((x - this.ox) / pitch);
		const row = round((y - this.oy) / pitch);
		const cellRadius = ceil(radius / pitch) + 1;
		const r2 = radius * radius;
		let weighted = 0;
		let capacity = 0;

		for (let dr = -cellRadius; dr <= cellRadius; dr++) {
			for (let dc = -cellRadius; dc <= cellRadius; dc++) {
				const c = this.getCell(col + dc, row + dr);
				if (!c || c.inClearRect || !c.hasDot) continue;
				const dx = c.homeX - x;
				const dy = c.homeY - y;
				const d2 = dx * dx + dy * dy;
				if (d2 > r2) continue;
				const falloff = 1 - sqrt(d2) / radius;
				capacity += falloff;
				const vis = c.lifeScale(now);
				if (vis <= 0.004) continue;
				weighted += falloff * vis;
			}
		}

		if (capacity <= 0) return 0;
		return constrain(weighted / capacity, 0, 1);
	}

	update(now, dt, mx, my) {
		const hoverR = params.hoverRadius;
		const hoverR2 = hoverR * hoverR;

		for (let i = 0; i < this.cells.length; i++) {
			const c = this.cells[i];
			let hoverPullTarget = 0;
			if (!c.inClearRect) {
				const dx = c.homeX - mx;
				const dy = c.homeY - my;
				const d2 = dx * dx + dy * dy;
				if (d2 <= hoverR2) {
					hoverPullTarget = 1 - sqrt(d2) / hoverR;
				}
			}

			const needsUpdate =
				c.hasDot ||
				c.activation > 0.001 ||
				now < c.activeUntil ||
				c.hoverPull > 0.001 ||
				c.settleBlend > 0.001 ||
				c.magnetBlend > 0.001 ||
				c.order > 0.001 ||
				hoverPullTarget > 0.001;
			if (needsUpdate) c.update(now, dt, hoverPullTarget);
		}
	}

	draw(now) {
		const pitch = params.gridSpacing;
		noStroke();
		for (let i = 0; i < this.cells.length; i++) {
			const c = this.cells[i];
			if (c.inClearRect) continue;

			const act = c.activation;
			const life = c.lifeScale(now);
			const baseScale = life + (1 - life) * act;
			let scale = lerp(baseScale, params.magnetSettleScale, c.magnetBlend);
			scale = lerp(scale, params.hoverSettleScale, c.settleBlend);
			if (scale <= 0.004) continue;

			const r = lerp(inactiveRGB.r, activeRGB.r, act);
			const g = lerp(inactiveRGB.g, activeRGB.g, act);
			const b = lerp(inactiveRGB.b, activeRGB.b, act);
			fill(r, g, b);
			circle(c.px, c.py, params.dotSize * pitch * scale);
		}

		if (params.showClearRect) {
			push();
			noFill();
			stroke(activeRGB.r, activeRGB.g, activeRGB.b, 160);
			strokeWeight(1);
			const cr = this.clearRect;
			rect(cr.x, cr.y, cr.w, cr.h);
			pop();
		}
	}
}

// ─── Tracer ──────────────────────────────────────────────────────────────────

/**
 * A travelling line head that moves along the grid in cardinal steps, drawing
 * a fading trail and activating the dots it passes. Mostly keeps its heading;
 * occasionally turns 90°. Dies only when it moves into a wall or is boxed in on all sides.
 */
class Tracer {
	constructor(col, row, dir, mode = 'random', goalCol = null, goalRow = null) {
		this.col = col;
		this.row = row;
		this.dir = dir;
		this.alive = true;
		this.mode = mode;
		this.goalCol = goalCol;
		this.goalRow = goalRow;
		this.reachedGoal = false;
		this.wallHits = 0;

		const start = this.cellCenter(col, row);
		this.fromX = start.x;
		this.fromY = start.y;

		this.target = this.nextTarget(col, row, dir);
		this.segProgress = 0;

		this.points = [{ x: start.x, y: start.y, born: timeMs }];

		this.energy = 0.5;
		this.baseStepMs = this.sampleBaseStepMs();
		this.stepMs = this.baseStepMs;
		this.touchCell(col, row, timeMs);
	}

	sampleBaseStepMs() {
		const j = params.tracerStepJitter;
		return params.tracerStepMs * random(1 - j, 1 + j);
	}

	stepMsFromEnergy() {
		if (prefersReducedMotion || !params.energyEnabled) return this.baseStepMs;
		const densityMult = lerp(params.energyStepMultMax, params.energyStepMultMin, this.energy);
		const mult = lerp(1, densityMult, params.energyInfluence);
		return this.baseStepMs * mult;
	}

	cellCenter(col, row) {
		return { x: grid.ox + col * params.gridSpacing, y: grid.oy + row * params.gridSpacing };
	}

	nextTarget(col, row, dir) {
		return { col: col + dir.dx, row: row + dir.dy };
	}

	offCanvas(x, y) {
		const m = params.gridSpacing;
		return x < -m || x > width + m || y < -m || y > height + m;
	}

	touchCell(col, row, now) {
		const cell = grid.getCell(col, row);
		if (cell && !cell.inClearRect) cell.activate(now, params.activeLingerMs);
		this.spread(col, row, now);
	}

	spread(col, row, now) {
		const radius = params.spreadRadius;
		if (radius <= 0) return;
		for (let dr = -radius; dr <= radius; dr++) {
			for (let dc = -radius; dc <= radius; dc++) {
				if (dc === 0 && dr === 0) continue;
				if (random() > params.spreadChance) continue;
				const c = grid.getCell(col + dc, row + dr);
				if (c && !c.inClearRect) c.activate(now, params.activeLingerMs * 0.7);
			}
		}
	}

	directionBlocked(dir) {
		const t = this.nextTarget(this.col, this.row, dir);
		return this.isWallCell(t.col, t.row);
	}

	isWallCell(col, row) {
		if (!grid.inBounds(col, row)) return true;
		const cen = this.cellCenter(col, row);
		return grid.pointInClearRect(cen.x, cen.y);
	}

	directionBlockedForExit(dir) {
		const t = this.nextTarget(this.col, this.row, dir);
		const cen = this.cellCenter(t.col, t.row);
		if (grid.pointInClearRect(cen.x, cen.y)) return true;
		return this.offCanvas(cen.x, cen.y);
	}

	/**
	 * Forward blocked — turn if budget remains, otherwise die.
	 * Returns a new direction or null.
	 */
	resolveWallTurn(straight, turnOptions) {
		if (turnOptions.length === 0) return null;
		if (this.wallHits >= params.maxWallTurns) return null;
		this.wallHits++;
		return random(turnOptions);
	}

	/** Go straight until a wall; only turn at walls (up to maxWallTurns). */
	resolveRandomDirection() {
		const straight = this.dir;
		if (!this.directionBlocked(straight)) return straight;

		const perp = CARDINALS.filter((d) => isPerpendicular(d, straight) && !this.directionBlocked(d));
		return this.resolveWallTurn(straight, perp);
	}

	/** Target seek: straight when open; at walls pick the best open direction toward the goal. */
	resolveTargetDirection() {
		const straight = this.dir;
		if (!this.directionBlocked(straight)) return straight;

		const open = CARDINALS.filter((d) => !this.directionBlocked(d));
		if (open.length === 0) return null;

		const ranked = open
			.map((d) => ({ dir: d, score: this.goalScore(d) }))
			.sort((a, b) => b.score - a.score);
		const bestScore = ranked[0].score;
		const best = ranked.filter((r) => r.score === bestScore).map((r) => r.dir);

		return this.resolveWallTurn(straight, best);
	}

	/** After reaching the goal, drive straight down until the canvas edge. */
	resolveExitDirection() {
		if (!params.targetExitAfterGoal) return null;
		const down = { dx: 0, dy: 1 };
		if (this.directionBlockedForExit(down)) return null;
		return down;
	}

	resolveNextDirection() {
		if (this.mode === 'target' && this.goalCol != null && this.goalRow != null) {
			if (this.reachedGoal) return this.resolveExitDirection();
			if (this.atGoal()) {
				this.reachedGoal = true;
				return this.resolveExitDirection();
			}
			return this.resolveTargetDirection();
		}
		return this.resolveRandomDirection();
	}

	/** Score how much a direction reduces Manhattan distance to the goal. */
	goalScore(dir) {
		const t = this.nextTarget(this.col, this.row, dir);
		const dc = abs(t.col - this.goalCol);
		const dr = abs(t.row - this.goalRow);
		return -(dc + dr);
	}

	atGoal() {
		return this.col === this.goalCol && this.row === this.goalRow;
	}

	update(now, dt) {
		if (!this.alive) return;

		const head = this.headPosition();
		const targetEnergy = grid.dotEnergyAt(head.x, head.y, params.energyRadius, now);
		const energyEase = min(1, dt / Math.max(1, params.energyEaseMs));
		this.energy = lerp(this.energy, targetEnergy, energyEase);
		this.stepMs = this.stepMsFromEnergy();

		const step = dt / Math.max(1, this.stepMs);
		this.segProgress += step;

		while (this.segProgress >= 1 && this.alive) {
			this.segProgress -= 1;
			this.arriveAtTarget(now);
		}
	}

	arriveAtTarget(now) {
		this.col = this.target.col;
		this.row = this.target.row;
		const reached = this.cellCenter(this.col, this.row);
		this.fromX = reached.x;
		this.fromY = reached.y;
		this.points.push({ x: reached.x, y: reached.y, born: now });

		this.touchCell(this.col, this.row, now);

		const nextDir = this.resolveNextDirection();
		if (!nextDir) {
			this.alive = false;
			return;
		}
		this.dir = nextDir;
		this.target = this.nextTarget(this.col, this.row, this.dir);
		this.baseStepMs = this.sampleBaseStepMs();
	}

	headPosition() {
		const to = this.cellCenter(this.target.col, this.target.row);
		const t = constrain(this.segProgress, 0, 1);
		return { x: lerp(this.fromX, to.x, t), y: lerp(this.fromY, to.y, t) };
	}

	segmentAlpha(born, now) {
		const age = now - born;
		if (age <= params.trailLingerMs) return 1;
		return constrain(1 - (age - params.trailLingerMs) / Math.max(1, params.trailFadeMs), 0, 1);
	}

	/** True once every committed point has fully faded and the head is gone. */
	isFinished(now) {
		if (this.alive) return false;
		const last = this.points[this.points.length - 1];
		return this.segmentAlpha(last.born, now) <= 0;
	}

	draw(now) {
		strokeWeight(params.lineWeight);
		strokeCap(ROUND);
		strokeJoin(ROUND);
		noFill();

		for (let i = 0; i < this.points.length - 1; i++) {
			const a = this.points[i];
			const b = this.points[i + 1];
			const alpha = this.segmentAlpha(a.born, now);
			if (alpha <= 0) continue;
			stroke(activeRGB.r, activeRGB.g, activeRGB.b, alpha * 255);
			line(a.x, a.y, b.x, b.y);
		}

		if (this.alive) {
			const last = this.points[this.points.length - 1];
			const head = this.headPosition();
			stroke(activeRGB.r, activeRGB.g, activeRGB.b, 255);
			line(last.x, last.y, head.x, head.y);
		}
	}
}

// ─── Tracer manager ────────────────────────────────────────────────────────────

class TracerManager {
	constructor() {
		this.list = [];
		this.nextSpawnAt = 0;
		this.introHandled = false;
	}

	clear() {
		this.list = [];
		this.nextSpawnAt = params.tracerIntroDelayMs;
		this.introHandled = false;
	}

	tracersActive(now) {
		if (prefersReducedMotion) return true;
		return now >= params.tracerIntroDelayMs;
	}

	scheduleNextSpawn(now) {
		const base = params.spawnIntervalMs;
		const span = base * params.spawnIntervalJitter;
		this.nextSpawnAt = now + base + random(-span, span);
	}

	aliveCount() {
		let n = 0;
		for (let i = 0; i < this.list.length; i++) {
			if (this.list[i].alive) n++;
		}
		return n;
	}

	hasTargetTracer() {
		for (let i = 0; i < this.list.length; i++) {
			if (this.list[i].mode === 'target' && this.list[i].alive) return true;
		}
		return false;
	}

	getTargetTracer() {
		for (let i = 0; i < this.list.length; i++) {
			if (this.list[i].mode === 'target' && this.list[i].alive) return this.list[i];
		}
		return null;
	}

	/** Kill the oldest live tracer (first in the list). */
	killOldestAlive() {
		for (let i = 0; i < this.list.length; i++) {
			if (this.list[i].alive) {
				this.list[i].alive = false;
				return true;
			}
		}
		return false;
	}

	initialDirection(col, row, goalCol, goalRow) {
		const dc = goalCol - col;
		const dr = goalRow - row;
		const options = [];
		if (dc !== 0) options.push({ dx: dc > 0 ? 1 : -1, dy: 0 });
		if (dr !== 0) options.push({ dx: 0, dy: dr > 0 ? 1 : -1 });
		const valid = options.filter((d) => {
			const tCol = col + d.dx;
			const tRow = row + d.dy;
			return grid.inBounds(tCol, tRow) && !grid.cellInClearRect(tCol, tRow);
		});
		if (valid.length > 0) return random(valid);
		const any = CARDINALS.filter((d) => {
			const tCol = col + d.dx;
			const tRow = row + d.dy;
			return grid.inBounds(tCol, tRow) && !grid.cellInClearRect(tCol, tRow);
		});
		return any.length > 0 ? random(any) : { dx: 0, dy: 1 };
	}

	spawnTargetTracer() {
		const goalCol = grid.getTargetColumn();
		const goalRow = grid.getTargetRow();
		const cell = grid.randomSpawnCellAwayFromGoal(goalCol, goalRow);
		if (!cell) return null;
		const dir = this.initialDirection(cell.col, cell.row, goalCol, goalRow);
		return new Tracer(cell.col, cell.row, dir, 'target', goalCol, goalRow);
	}

	spawnRandom() {
		const cell = grid.randomSpawnCell();
		if (!cell) return null;
		const validDirs = CARDINALS.filter((d) => {
			const tCol = cell.col + d.dx;
			const tRow = cell.row + d.dy;
			return grid.inBounds(tCol, tRow) && !grid.cellInClearRect(tCol, tRow);
		});
		if (validDirs.length === 0) return null;
		return new Tracer(cell.col, cell.row, random(validDirs), 'random');
	}

	spawnAt(col, row) {
		if (!grid.inBounds(col, row) || grid.cellInClearRect(col, row)) return null;
		const validDirs = CARDINALS.filter((d) => {
			const tCol = col + d.dx;
			const tRow = row + d.dy;
			return grid.inBounds(tCol, tRow) && !grid.cellInClearRect(tCol, tRow);
		});
		if (validDirs.length === 0) return null;
		return new Tracer(col, row, random(validDirs), 'random');
	}

	/** User click — kills the oldest live tracer, then spawns one at the click cell. */
	spawnFromClick(col, row) {
		if (!this.tracersActive(millis())) return false;
		const tracer = this.spawnAt(col, row);
		if (!tracer) return false;
		if (this.aliveCount() > 0) this.killOldestAlive();
		this.list.push(tracer);
		return true;
	}

	spawnOne(forceTarget = false) {
		let tracer = null;
		if (forceTarget || (params.targetFlowEnabled && !this.hasTargetTracer())) {
			tracer = this.spawnTargetTracer();
		}
		if (!tracer) tracer = this.spawnRandom();
		if (tracer) this.list.push(tracer);
	}

	ensureTargetTracer() {
		if (!params.targetFlowEnabled) return;
		if (this.hasTargetTracer()) return;
		if (this.aliveCount() >= params.maxTracers) return;

		const tracer = this.spawnTargetTracer();
		if (tracer) this.list.push(tracer);
	}

	handleIntro(now) {
		if (this.introHandled || !this.tracersActive(now)) return;
		this.introHandled = true;
		this.ensureTargetTracer();
		this.scheduleNextSpawn(now);
	}

	update(now, dt) {
		for (let i = 0; i < this.list.length; i++) {
			const t = this.list[i];
			if (t.alive) {
				const head = t.headPosition();
				grid.magnetize(head.x, head.y, params.magnetRadius, params.magnetStrength);
			}
			t.update(now, dt);
		}
		this.list = this.list.filter((t) => !t.isFinished(now));

		if (!this.tracersActive(now)) return;

		this.handleIntro(now);
		this.ensureTargetTracer();

		if (now >= this.nextSpawnAt && this.canSpawnRandom()) {
			this.spawnOne(false);
			this.scheduleNextSpawn(now);
		}
	}

	/**
	 * True when a non-target tracer may spawn. Reserves one slot for the target
	 * tracer when target flow is on and no target is currently alive, so random
	 * tracers can never starve the target out of the population.
	 */
	canSpawnRandom() {
		const alive = this.aliveCount();
		if (alive >= params.maxTracers) return false;
		if (params.targetFlowEnabled && !this.hasTargetTracer()) {
			return alive < params.maxTracers - 1;
		}
		return true;
	}

	draw(now) {
		for (let i = 0; i < this.list.length; i++) {
			this.list[i].draw(now);
		}
	}
}

// ─── Debug overlays ──────────────────────────────────────────────────────────

function drawFps() {
	const fps = Math.round(frameRate());
	const pad = 10;
	const boxW = 72;
	const boxH = 26;
	const x = pad;
	const y = pad;

	push();
	noStroke();
	fill(0, 0, 0, 140);
	rect(x, y, boxW, boxH, 4);

	fill(255);
	textFont('monospace');
	textSize(13);
	textAlign(LEFT, CENTER);
	text(`FPS  ${fps}`, x + 8, y + boxH / 2);
	pop();
}

function drawTargetFlowDebug() {
	if (!params.debugTargetFlow || !params.targetFlowEnabled) return;

	const goalCol = grid.getTargetColumn();
	const goalRow = grid.getTargetRow();
	const goalCell = grid.getCell(goalCol, goalRow);
	if (!goalCell) return;

	const gx = goalCell.cx;
	const gy = goalCell.cy;
	const pitch = params.gridSpacing;
	const r = pitch * 0.9;

	push();
	// ── target dot reticle ──────────────────────────────────────────────────
	strokeWeight(1.5);
	stroke(255, 255, 255, 230);
	noFill();
	circle(gx, gy, r * 2);

	const arm = r * 0.55;
	line(gx - r - arm, gy, gx - r + arm * 0.6, gy);
	line(gx + r - arm * 0.6, gy, gx + r + arm, gy);
	line(gx, gy - r - arm, gx, gy - r + arm * 0.6);
	line(gx, gy + r - arm * 0.6, gx, gy + r + arm);

	fill(255, 255, 255, 220);
	noStroke();
	circle(gx, gy, pitch * 0.28);

	// ── label under reticle ─────────────────────────────────────────────────
	fill(0, 0, 0, 160);
	noStroke();
	const lw = 110;
	const lh = 18;
	rect(gx - lw / 2, gy + r + 6, lw, lh, 3);
	fill(255);
	textFont('monospace');
	textSize(11);
	textAlign(CENTER, CENTER);
	text(`goal  col ${goalCol}  row ${goalRow}`, gx, gy + r + 6 + lh / 2);

	// ── active target tracer ─────────────────────────────────────────────────
	const t = tracers.getTargetTracer();
	if (t) {
		const head = t.headPosition();

		// dashed guide line from head → goal
		stroke(255, 255, 255, 70);
		strokeWeight(1);
		noFill();
		const segments = 12;
		for (let i = 0; i < segments; i++) {
			const ta = i / segments;
			const tb = (i + 0.5) / segments;
			const ax = lerp(head.x, gx, ta);
			const ay = lerp(head.y, gy, ta);
			const bx = lerp(head.x, gx, tb);
			const by = lerp(head.y, gy, tb);
			line(ax, ay, bx, by);
		}

		// head indicator
		const status = t.reachedGoal ? 'exiting' : 'seeking';
		const headColor = t.reachedGoal ? [80, 255, 160] : [255, 80, 80];

		stroke(headColor[0], headColor[1], headColor[2], 255);
		strokeWeight(2);
		noFill();
		const hr = pitch * 0.7;
		rect(head.x - hr / 2, head.y - hr / 2, hr, hr, 3);

		fill(0, 0, 0, 160);
		noStroke();
		const hw = 130;
		const hh = 36;
		const hx = constrain(head.x - hw / 2, 4, width - hw - 4);
		const hy = constrain(head.y - hr / 2 - hh - 6, 4, height - hh - 4);
		rect(hx, hy, hw, hh, 3);

		fill(headColor[0], headColor[1], headColor[2]);
		textFont('monospace');
		textSize(11);
		textAlign(LEFT, TOP);
		text(`tracer  ${status}`, hx + 7, hy + 5);
		fill(255);
		text(`col ${t.col}  row ${t.row}`, hx + 7, hy + 20);
	} else {
		// no active target tracer at this moment
		fill(0, 0, 0, 160);
		noStroke();
		const mw = 130;
		const mh = 20;
		rect(gx - mw / 2, gy - r - mh - 6, mw, mh, 3);
		fill(255, 200, 80);
		textFont('monospace');
		textSize(11);
		textAlign(CENTER, CENTER);
		text('no target tracer', gx, gy - r - 6 - mh / 2);
	}

	// ── HUD summary (top-right) ──────────────────────────────────────────────
	const hudLines = [
		`tracers  ${tracers.list.filter((t2) => t2.alive).length} / ${params.maxTracers}`,
		`target   col ${goalCol}  row ${goalRow}`,
		`status   ${t ? (t.reachedGoal ? 'exiting' : 'seeking') : 'waiting'}`,
	];
	const hudPad = 8;
	const hudLineH = 16;
	const hudW = 190;
	const hudH = hudLines.length * hudLineH + hudPad * 2;
	const hudX = width - hudW - 10;
	const hudY = 10;

	noStroke();
	fill(0, 0, 0, 160);
	rect(hudX, hudY, hudW, hudH, 4);
	textFont('monospace');
	textSize(11);
	textAlign(LEFT, TOP);
	for (let i = 0; i < hudLines.length; i++) {
		fill(i === 0 ? [200, 200, 255] : 255);
		text(hudLines[i], hudX + hudPad, hudY + hudPad + i * hudLineH);
	}

	pop();
}

// ─── GUI ─────────────────────────────────────────────────────────────────────

function applyPreset(name) {
	const patch = PRESETS[name];
	if (!patch) return;
	Object.assign(params, patch);
	params.preset = name;
	cacheColors();
	grid.rebuild();
	tracers.clear();
	if (gui) gui.controllersRecursive().forEach((c) => c.updateDisplay());
}

function setupGui() {
	const GUICtor = typeof lil !== 'undefined' ? lil.GUI : typeof GUI !== 'undefined' ? GUI : null;
	if (!GUICtor) return;

	gui = new GUICtor({ title: 'Dots and Lines' });

	const gGrid = gui.addFolder('Grid & Dots');
	gGrid.add(params, 'gridSpacing', 12, 60, 1).name('grid spacing').onFinishChange(() => grid.rebuild());
	gGrid.add(params, 'dotSize', 0.1, 0.7, 0.01).name('dot size');
	gGrid.add(params, 'blankNoiseScale', 0.02, 0.25, 0.005).name('noise scale').onFinishChange(() => grid.rebuild());
	gGrid.add(params, 'blankThreshold', 0.2, 0.75, 0.01).name('blank amount').onFinishChange(() => grid.rebuild());
	gGrid.add(params, 'dotVisibleFrac', 0.4, 1, 0.01).name('dot visible %');
	gGrid.close();

	const gLife = gui.addFolder('Dot Lifecycle');
	gLife.add(params, 'lifeDurationMin', 1500, 12000, 100).name('life min (ms)').onFinishChange(() => grid.rebuild());
	gLife.add(params, 'lifeDurationMax', 3000, 18000, 100).name('life max (ms)').onFinishChange(() => grid.rebuild());
	gLife.close();

	const gActive = gui.addFolder('Activation');
	gActive.add(params, 'activeLingerMs', 200, 4000, 50).name('linger (ms)');
	gActive.add(params, 'activeFadeInMs', 80, 2000, 20).name('fade in (ms)');
	gActive.add(params, 'activeFadeOutMs', 200, 4000, 50).name('fade out (ms)');
	gActive.close();

	const gLines = gui.addFolder('Lines / Tracers');
	gLines.add(params, 'maxTracers', 1, 20, 1).name('max tracers');
	gLines.add(params, 'spawnIntervalMs', 150, 2500, 50).name('spawn every (ms)');
	gLines.add(params, 'spawnIntervalJitter', 0, 1, 0.05).name('spawn jitter');
	gLines.add(params, 'tracerStepMs', 50, 400, 5).name('step time (ms)');
	gLines.add(params, 'tracerStepJitter', 0, 0.8, 0.05).name('step jitter');
	gLines.add(params, 'maxWallTurns', 0, 8, 1).name('wall turns before death');
	gLines.add(params, 'lineWeight', 0.5, 6, 0.25).name('line weight');
	gLines.add(params, 'trailLingerMs', 100, 3000, 50).name('trail linger (ms)');
	gLines.add(params, 'trailFadeMs', 200, 4000, 50).name('trail fade (ms)');
	gLines.add(params, 'energyEnabled').name('energy speed');
	gLines.add(params, 'energyRadius', 30, 200, 5).name('energy radius');
	gLines.add(params, 'energyStepMultMin', 0.4, 1, 0.02).name('fastest mult');
	gLines.add(params, 'energyStepMultMax', 1, 1.8, 0.02).name('slowest mult');
	gLines.add(params, 'energyInfluence', 0, 1, 0.05).name('energy influence');
	gLines.add(params, 'energyEaseMs', 80, 2000, 20).name('energy ease (ms)');
	gLines.close();

	const gIntro = gui.addFolder('Intro / Pacing');
	gIntro.add(params, 'tracerIntroDelayMs', 0, 5000, 50).name('line delay (ms)');
	gIntro.add(params, 'introDotStaggerMs', 0, 4000, 50).name('dot stagger (ms)');
	gIntro.add(params, 'introDotRiseMs', 80, 1200, 20).name('dot rise (ms)');
	gIntro.close();

	const gSpread = gui.addFolder('Spread');
	gSpread.add(params, 'spreadRadius', 0, 3, 1).name('spread radius');
	gSpread.add(params, 'spreadChance', 0, 1, 0.05).name('spread chance');
	gSpread.close();

	const gTarget = gui.addFolder('Target Column Flow');
	gTarget.add(params, 'targetFlowEnabled').name('enabled');
	gTarget.add(params, 'targetColumnFrac', 0, 0.5, 0.01).name('column %');
	gTarget.add(params, 'targetRowFrac', 0.5, 1, 0.01).name('row % (bottom)');
	gTarget.add(params, 'targetSeekStrength', 0.5, 1, 0.01).name('seek strength');
	gTarget.add(params, 'targetTurnChance', 0, 0.3, 0.01).name('turn chance');
	gTarget.add(params, 'targetExitAfterGoal').name('exit after goal');
	gTarget.add(params, 'debugTargetFlow').name('debug overlay');
	gTarget.close();

	const gMouse = gui.addFolder('Mouse');
	gMouse.add(params, 'hoverRadius', 20, 300, 5).name('hover radius');
	gMouse.add(params, 'hoverSettleScale', 0.2, 1.5, 0.05).name('settle size');
	gMouse.add(params, 'hoverEaseMs', 100, 2000, 20).name('settle ease (ms)');
	gMouse.add(params, 'hoverParkMs', 80, 1200, 20).name('park speed (ms)');
	gMouse.close();

	const gChaos = gui.addFolder('Chaos / Magnet');
	gChaos.add(params, 'chaosAmplitude', 0, 1.2, 0.01).name('chaos amplitude');
	gChaos.add(params, 'chaosNoiseScale', 0.02, 0.5, 0.01).name('noise scale');
	gChaos.add(params, 'chaosTimeScale', 0, 0.001, 0.00001).name('drift speed');
	gChaos.add(params, 'chaosEaseMs', 80, 2000, 20).name('position ease (ms)');
	gChaos.add(params, 'magnetRadius', 20, 200, 5).name('magnet radius');
	gChaos.add(params, 'magnetStrength', 0.05, 2, 0.05).name('magnet strength');
	gChaos.add(params, 'magnetSettleScale', 0.2, 1.5, 0.05).name('settle size');
	gChaos.add(params, 'magnetSettleEaseMs', 80, 2000, 20).name('settle ease (ms)');
	gChaos.add(params, 'orderDecayMs', 400, 8000, 50).name('order decay (ms)');
	gChaos.close();

	const gRect = gui.addFolder('Clear Text Area');
	gRect.add(params, 'clearRectWidthFrac', 0, 0.8, 0.02).name('width %').onFinishChange(() => grid.rebuild());
	gRect.add(params, 'clearRectHeightFrac', 0, 0.8, 0.02).name('height %').onFinishChange(() => grid.rebuild());
	gRect.add(params, 'showClearRect').name('show area');
	gRect.close();

	const gColor = gui.addFolder('Colours');
	gColor.addColor(params, 'bgColor').name('background').onChange(cacheColors);
	gColor.addColor(params, 'inactiveColor').name('inactive dots').onChange(cacheColors);
	gColor.addColor(params, 'activeColor').name('active / lines').onChange(cacheColors);
	gColor.close();

	const gDebug = gui.addFolder('Debug');
	gDebug.add(params, 'showFps').name('show FPS');
	gDebug.close();

	const gPresets = gui.addFolder('Presets');
	gPresets.add(params, 'preset', PRESET_NAMES).name('preset').onChange(applyPreset);
	gPresets.add(params, 'randomSeed', 0, 9999, 1).name('seed').onFinishChange(() => {
		grid.rebuild();
		tracers.clear();
	});
	gPresets.close();

	gui.close();
}

// ─── p5 lifecycle ────────────────────────────────────────────────────────────

function setup() {
	const canvasEl = createCanvas(windowWidth, windowHeight);
	canvasEl.parent('app');
	pixelDensity(min(2, displayDensity()));
	rectMode(CORNER);
	colorMode(RGB, 255);

	cacheColors();
	detectReducedMotion();
	grid = new GridSystem();
	tracers = new TracerManager();
	grid.rebuild();
	tracers.clear();
	setupGui();
}

function draw() {
	timeMs = millis();
	const dt = min(deltaTime, 64);

	background(bgRGB.r, bgRGB.g, bgRGB.b);

	tracers.update(timeMs, dt);
	grid.update(timeMs, dt, mouseX, mouseY);

	grid.draw(timeMs);
	tracers.draw(timeMs);
	drawTargetFlowDebug();
	if (params.showFps) drawFps();
}

function mousePressed() {
	if (!grid || !tracers) return;
	const cell = grid.nearestCell(mouseX, mouseY);
	if (!cell || cell.inClearRect) return;
	tracers.spawnFromClick(cell.col, cell.row);
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	grid.rebuild();
	tracers.clear();
}
