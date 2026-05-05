/**
 * p5.js — Grid orchestration
 * Grid of line segments with procedural angles and mouse-driven alignment.
 */

// ─── Pattern mode keys (also used by GUI dropdown) ─────────────────────────
const PATTERN_MODES = [
	'noiseX',
	'noiseY',
	'noiseXY',
	'sineWave',
	'cosineWave',
	'tangentWarp',
	'radial',
	'vortex',
	'cursorField',
	'randomSeeded',
];

/** Keys copied when using "Save preset to clipboard" (matches `PRESETS` patch shape). */
const PRESET_EXPORT_KEYS = [
	'cols',
	'rows',
	'spacing',
	'lineLength',
	'lineThickness',
	'lineOpacity',
	'animationSpeed',
	'rotationAmount',
	'noiseScale',
	'noiseStrength',
	'mathFrequency',
	'interactionRadius',
	'interactionStrength',
	'alignmentStrength',
	'easingAmount',
	'mouseFalloff',
	'crossLinesOnHover',
	'patternMode',
	'bgColor',
	'lineColor',
	'randomSeed',
];

const PRESETS = {
	'Minimal Grid': {
		cols: 15,
		rows: 15,
		spacing: 50,
		lineLength: 50,
		lineThickness: 1.1,
		lineOpacity: 0.9,
		animationSpeed: 0.55,
		rotationAmount: 0.28,
		noiseScale: 2.91,
		noiseStrength: 1.5,
		mathFrequency: 0.9,
		interactionRadius: 161,
		interactionStrength: 2,
		alignmentStrength: 1,
		easingAmount: 0.06,
		mouseFalloff: 0.8,
		crossLinesOnHover: true,
		patternMode: "noiseXY",
		bgColor: "#ffffff",
		lineColor: "#0a0a0a",
		randomSeed: 11,
	},
	'Dense Grid': {
		cols: 48,
		rows: 48,
		spacing: 15,
		lineLength: 15,
		lineThickness: 1.5,
		lineOpacity: 0.9,
		animationSpeed: 1.79,
		rotationAmount: 0.87,
		noiseScale: 0.85,
		noiseStrength: 0.2,
		mathFrequency: 0.9,
		interactionRadius: 308,
		interactionStrength: 2,
		alignmentStrength: 0,
		easingAmount: 0.07,
		mouseFalloff: 4,
		crossLinesOnHover: true,
		patternMode: "noiseXY",
		bgColor: "#ffffff",
		lineColor: "#0a0a0a",
		randomSeed: 11,
	},
	'Fullscreen Grid': {
		cols: 48,
		rows: 48,
		spacing: 43,
		lineLength: 44,
		lineThickness: 1.5,
		lineOpacity: 1,
		animationSpeed: 1.79,
		rotationAmount: 0.87,
		noiseScale: 0.85,
		noiseStrength: 0.2,
		mathFrequency: 0.9,
		interactionRadius: 246,
		interactionStrength: 2,
		alignmentStrength: 0,
		easingAmount: 0.07,
		mouseFalloff: 0.9,
		crossLinesOnHover: true,
		patternMode: 'noiseXY',
		bgColor: '#ffffff',
		lineColor: '#0a0a0a',
		randomSeed: 11,
	},
	'Noise Hard Align': {
		cols: 37,
		rows: 25,
		spacing: 30,
		lineLength: 30,
		lineThickness: 2,
		lineOpacity: 1,
		animationSpeed: 1.55,
		rotationAmount: 0.57,
		noiseScale: 1.54,
		noiseStrength: 0.55,
		mathFrequency: 1.85,
		interactionRadius: 230,
		interactionStrength: 2,
		alignmentStrength: 1,
		easingAmount: 0.11,
		mouseFalloff: 1.75,
		patternMode: 'noiseXY',
		bgColor: '#ffffff',
		lineColor: '#000000',
		randomSeed: 707,
	},
	'Vortex Alignment': {
		cols: 20,
		rows: 20,
		spacing: 32,
		lineLength: 18,
		lineThickness: 1.2,
		lineOpacity: 0.88,
		animationSpeed: 0.7,
		rotationAmount: 0.4,
		noiseScale: 1.1,
		noiseStrength: 0.65,
		mathFrequency: 1,
		interactionRadius: 300,
		interactionStrength: 1,
		alignmentStrength: 0.82,
		easingAmount: 0.15,
		mouseFalloff: 1.4,
		patternMode: 'vortex',
		bgColor: '#ffffff',
		lineColor: '#101010',
		randomSeed: 303,
	},
	'Cursor Orchestra': {
		cols: 48,
		rows: 48,
		spacing: 18,
		lineLength: 15,
		lineThickness: 1.3,
		lineOpacity: 0.95,
		animationSpeed: 0.95,
		rotationAmount: 0.52,
		noiseScale: 1.2,
		noiseStrength: 0.5,
		mathFrequency: 1.1,
		interactionRadius: 340,
		interactionStrength: 1.15,
		alignmentStrength: 0.6,
		easingAmount: 0.2,
		mouseFalloff: 1.6,
		crossLinesOnHover: true,
		patternMode: "cursorField",
		bgColor: "#ffffff",
		lineColor: "#080808",
		randomSeed: 606,
	},
};

/** Preset labels for the GUI: same order as keys in `PRESETS` (add a preset once, it appears here). */
const PRESET_NAMES = Object.keys(PRESETS);

// ─── Default + preset configuration ───────────────────────────────────────
const DEFAULT_PARAMS = {
	preset: PRESET_NAMES[0],
	cols: 18,
	rows: 18,
	spacing: 36,
	lineLength: 16,
	lineThickness: 1.25,
	lineOpacity: 0.92,
	animationSpeed: 0.85,
	rotationAmount: 0.45,
	noiseScale: 1.35,
	noiseStrength: 0.45,
	mathFrequency: 1.15,
	interactionRadius: 240,
	interactionStrength: 1,
	alignmentStrength: 0.55,
	easingAmount: 0.12,
	mouseFalloff: 1.65,
	crossLinesOnHover: false,
	patternMode: 'noiseXY',
	bgColor: '#ffffff',
	lineColor: '#111111',
	debugGrid: false,
	randomSeed: 2025,
	paused: false,
	presetExportName: 'New preset',
};

// ─── Mutable runtime state ─────────────────────────────────────────────────
const params = { ...DEFAULT_PARAMS, ...PRESETS[PRESET_NAMES[0]] };
params.preset = PRESET_NAMES[0];
/** @type {{ ix: number, iy: number, cx: number, cy: number, randAngle: number, smoothAngle: number, crossBlend: number }[]} */
let lines = [];
let gui = null;
let timeMs = 0;

// ─── Grid / pattern ─────────────────────────────────────────────────────────
function buildLines() {
	const { cols, rows, spacing, randomSeed: seed } = params;
	randomSeed(seed);
	noiseSeed(seed);

	const arr = [];
	const totalW = Math.max(0, (cols - 1) * spacing);
	const totalH = Math.max(0, (rows - 1) * spacing);
	const ox = (width - totalW) / 2;
	const oy = (height - totalH) / 2;

	for (let iy = 0; iy < rows; iy++) {
		for (let ix = 0; ix < cols; ix++) {
			const cx = ox + ix * spacing;
			const cy = oy + iy * spacing;
			const randAngle = random(TWO_PI);
			const line = { ix, iy, cx, cy, randAngle, smoothAngle: 0, crossBlend: 0 };
			line.smoothAngle = computeBaseAngle(line, timeMs);
			arr.push(line);
		}
	}
	return arr;
}

function regenerate() {
	lines = buildLines();
}

function computeBaseAngle(line, t) {
	const p = params;
	const { cx, cy, ix, iy, randAngle } = line;
	const cxn = width * 0.5;
	const cyn = height * 0.5;
	const ns = p.noiseScale * 0.09;
	const mf = p.mathFrequency * 0.085;
	const str = p.noiseStrength;
	const waveT = t * 0.00035 * p.animationSpeed;

	let ang = 0;
	switch (p.patternMode) {
		case 'noiseX':
			ang = map(noise(ix * ns, 333, 333), 0, 1, 0, TWO_PI) * str;
			break;
		case 'noiseY':
			ang = map(noise(444, iy * ns, 444), 0, 1, 0, TWO_PI) * str;
			break;
		case 'noiseXY':
			ang = map(noise(ix * ns + 200, iy * ns + 200, t * 0.00002), 0, 1, 0, TWO_PI) * str;
			break;
		case 'sineWave':
			ang = sin(ix * mf + waveT * 3) * TWO_PI * 0.45 * str;
			break;
		case 'cosineWave':
			ang = cos(iy * mf + waveT * 3) * TWO_PI * 0.45 * str;
			break;
		case 'tangentWarp': {
			const u = constrain(ix * mf * 1.2 + waveT, -1.35, 1.35);
			const w = tan(u);
			ang = atan2(w, 1) * str;
			break;
		}
		case 'radial':
			ang = atan2(cy - cyn, cx - cxn);
			break;
		case 'vortex': {
			const dx = cx - cxn;
			const dy = cy - cyn;
			const r = sqrt(dx * dx + dy * dy) + 0.001;
			ang = atan2(dy, dx) + log(r + 2) * str * 0.75;
			break;
		}
		case 'cursorField':
			ang = atan2(mouseY - cy, mouseX - cx);
			break;
		case 'randomSeeded':
			ang = randAngle * min(str, 1.5);
			break;
		default:
			ang = map(noise(ix * ns, iy * ns), 0, 1, 0, TWO_PI) * str;
	}

	// Motion is independent of local `ang`: using `sin(time + f(ang))` made every cell with similar
	// pattern angle share the same offset (visual “alignment”). Instead, phase comes from grid
	// noise + a per-cell turn bias for steady rotation — patternMode still sets `ang` only.
	const spd = p.animationSpeed;
	const amp = p.rotationAmount * 0.38;
	const cellPhase = TWO_PI * noise(ix * 0.39 + 4.2, iy * 0.39 + 1.8, 16.7);
	const cellTurn = map(noise(ix * 0.33 + 8.1, iy * 0.33 + 2.4, 203.5), 0, 1, -1, 1);
	const oscillation = sin(t * 0.00088 * spd + cellPhase) * amp;
	const steadyTurn = t * 0.0001 * spd * p.rotationAmount * cellTurn * 1.1;
	return ang + oscillation + steadyTurn;
}

/** Interpolate from angle `a` toward `b` by `t` ∈ [0, 1] along the shortest arc (avoids π/−π jumps from atan2). */
function lerpAngle(a, b, t) {
	const tt = constrain(t, 0, 1);
	const delta = atan2(sin(b - a), cos(b - a));
	return a + delta * tt;
}

function orchestrationTarget(line) {
	const { cx, cy } = line;
	const toCursor = atan2(mouseY - cy, mouseX - cx);
	const cardinal = round(toCursor / HALF_PI) * HALF_PI;
	return lerpAngle(toCursor, cardinal, constrain(params.alignmentStrength, 0, 1));
}

function interactionWeight(line) {
	const { cx, cy } = line;
	const d = dist(mouseX, mouseY, cx, cy);
	const r = max(params.interactionRadius, 1);
	const edge = constrain(1 - d / r, 0, 1);
	const fo = max(params.mouseFalloff, 0.05);
	return pow(edge, fo) * params.interactionStrength;
}

function getCurrentPresetPatch() {
	const o = {};
	for (let i = 0; i < PRESET_EXPORT_KEYS.length; i++) {
		const k = PRESET_EXPORT_KEYS[i];
		o[k] = params[k];
	}
	return o;
}

/** Escape a string for use as a single-quoted JS key (PRESETS). */
function escapePresetKeyName(name) {
	return String(name).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Format current params as a `PRESETS` entry for pasting into main.js.
 */
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
	};
	if (navigator.clipboard && navigator.clipboard.writeText) {
		navigator.clipboard.writeText(text).catch(onFail);
	} else {
		onFail();
	}
}

// ─── GUI ───────────────────────────────────────────────────────────────────
function applyPreset(name) {
	const patch = PRESETS[name];
	if (!patch) return;
	Object.assign(params, patch);
	params.preset = name;
	regenerate();
	if (gui) {
		gui.controllersRecursive().forEach((c) => c.updateDisplay());
	}
}

function setupGui() {
	const GUICtor = typeof lil !== 'undefined' ? lil.GUI : typeof GUI !== 'undefined' ? GUI : null;
	if (!GUICtor) return;

	gui = new GUICtor({ title: 'Grid orchestration' });

	const gGrid = gui.addFolder('Grid');
	gGrid.add(params, 'cols', 4, 48, 1).onFinishChange(regenerate);
	gGrid.add(params, 'rows', 4, 48, 1).onFinishChange(regenerate);
	gGrid.add(params, 'spacing', 8, 80, 1).onFinishChange(regenerate);

	const gLine = gui.addFolder('Line');
	gLine.add(params, 'lineLength', 4, 80, 1);
	gLine.add(params, 'lineThickness', 0.5, 4, 0.05);
	gLine.add(params, 'lineOpacity', 0.05, 1, 0.01);

	const gMotion = gui.addFolder('Motion');
	gMotion.add(params, 'animationSpeed', 0, 2.5, 0.01);
	gMotion.add(params, 'rotationAmount', 0, 2, 0.01);
	gMotion.add(params, 'paused').name('pause animation');

	const gField = gui.addFolder('Field');
	gField.add(params, 'noiseScale', 0.1, 3.5, 0.01);
	gField.add(params, 'noiseStrength', 0, 1.5, 0.01);
	gField.add(params, 'mathFrequency', 0.2, 4, 0.01);
	gField.add(params, 'patternMode', PATTERN_MODES);
	gField.add(params, 'randomSeed', 0, 99999, 1).name('random seed').onFinishChange(regenerate);
	gField.add({ regenerate: () => regenerate() }, 'regenerate').name('regenerate pattern');

	const gInteract = gui.addFolder('Interaction');
	gInteract.add(params, 'interactionRadius', 40, 500, 1);
	gInteract.add(params, 'interactionStrength', 0, 2, 0.01);
	gInteract.add(params, 'alignmentStrength', 0, 1, 0.01).name('alignment (→ grid)');
	gInteract.add(params, 'easingAmount', 0.02, 1, 0.01).name('easing / lerp');
	gInteract.add(params, 'mouseFalloff', 0.2, 4, 0.05).name('mouse falloff');
	gInteract.add(params, 'crossLinesOnHover').name('Cross lines on hover');

	const gLook = gui.addFolder('Appearance');
	gLook.addColor(params, 'bgColor').name('background');
	gLook.addColor(params, 'lineColor').name('line color');

	const gExport = gui.addFolder('Export');
	gExport.add(params, 'presetExportName').name('new preset name');
	gExport.add({ savePresetToClipboard }, 'savePresetToClipboard').name('Save preset to clipboard');

	gui.add(params, 'debugGrid').name('show debug grid');

	gui.add(params, 'preset', PRESET_NAMES).name('preset').onChange(applyPreset);

	gui.close();
}

function setup() {
	const canvasEl = createCanvas(windowWidth, windowHeight);
	canvasEl.parent('app');
	strokeCap(ROUND);
	pixelDensity(min(2, displayDensity()));
	regenerate();
	setupGui();
}

function draw() {
	if (!params.paused) {
		timeMs = millis();
	}

	background(params.bgColor);

	for (let i = 0; i < lines.length; i++) {
		const seg = lines[i];
		const infl = constrain(interactionWeight(seg), 0, 1);
		const ease = constrain(params.easingAmount, 0.02, 1);

		if (!params.paused) {
			const base = computeBaseAngle(seg, timeMs);
			const target = orchestrationTarget(seg);
			const ideal = lerpAngle(base, target, infl);
			seg.smoothAngle = lerpAngle(seg.smoothAngle, ideal, ease);
			const crossTarget = params.crossLinesOnHover ? infl : 0;
			seg.crossBlend = lerp(seg.crossBlend, crossTarget, ease);
		}

		const half = params.lineLength * 0.5;
		const a = seg.smoothAngle;
		const b = constrain(seg.crossBlend, 0, 1);
		const angHalf = half * (1 - b);
		const crossHalf = half * b;

		const c = color(params.lineColor);
		c.setAlpha(constrain(params.lineOpacity, 0, 1) * 255);
		stroke(c);
		strokeWeight(params.lineThickness);

		if (angHalf > 0.02) {
			line(
				seg.cx - cos(a) * angHalf,
				seg.cy - sin(a) * angHalf,
				seg.cx + cos(a) * angHalf,
				seg.cy + sin(a) * angHalf
			);
		}
		if (crossHalf > 0.02) {
			line(seg.cx - crossHalf, seg.cy, seg.cx + crossHalf, seg.cy);
			line(seg.cx, seg.cy - crossHalf, seg.cx, seg.cy + crossHalf);
		}
	}

	if (params.debugGrid) {
		drawDebugGrid();
	}
}

function drawDebugGrid() {
	const { cols, rows, spacing } = params;
	const totalW = Math.max(0, (cols - 1) * spacing);
	const totalH = Math.max(0, (rows - 1) * spacing);
	const ox = (width - totalW) / 2;
	const oy = (height - totalH) / 2;
	const xMax = ox + totalW;
	const yMax = oy + totalH;

	push();
	stroke(0, 230, 70);
	strokeWeight(1);
	for (let ix = 0; ix < cols; ix++) {
		const x = ox + ix * spacing;
		line(x, oy, x, yMax);
	}
	for (let iy = 0; iy < rows; iy++) {
		const y = oy + iy * spacing;
		line(ox, y, xMax, y);
	}

	noStroke();
	fill(255, 40, 55);
	for (let iy = 0; iy < rows; iy++) {
		for (let ix = 0; ix < cols; ix++) {
			circle(ox + ix * spacing, oy + iy * spacing, 3);
		}
	}
	pop();
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	regenerate();
}
