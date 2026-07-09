/**
 * Grid Trail — interactive dot orchestration animation.
 *
 * Mouse-driven canvas field: colored geometric dots activate around the
 * cursor, connect with alignment-aware lines, and fade through eased
 * intensity. A static gray-dot texture overlay hides during interaction
 * and returns once the trail clears.
 *
 * ─── Public API (global GridTrail) ───────────────────────────────────────
 *
 *   GridTrail.create({ canvas, staticDots })
 *     → { resize, destroy }   // live desktop animation
 *
 *   GridTrail.renderStaticPreview({ staticDots, layout, width, height, blended })
 *     → data URL string       // non-interactive mobile / fallback image
 *
 *   GridTrail.generateStaticPreviewTexture(w, h, layout)
 *   GridTrail.generateRestingDotsTexture(w, h)
 *   GridTrail.STATIC_LAYOUTS  // ['grid', 'gesture', 'random']
 *
 * ─── Embed example ───────────────────────────────────────────────────────
 *
 *   <canvas id="c"></canvas>
 *   <div id="staticDots"></div>
 *   <script src="grid-trail.js"></script>
 *   <script>
 *     const canvas = document.getElementById('c');
 *     const staticDots = document.getElementById('staticDots');
 *     const trail = GridTrail.create({ canvas, staticDots });
 *     // later: trail.destroy();
 *   </script>
 *
 * ─── Customize ───────────────────────────────────────────────────────────
 *   COLORS              — brand palette
 *   TRAIL_PATHS_GRID    — static 'grid' layout strokes
 *   TRAIL_PATHS_GESTURE — static 'gesture' layout stroke
 *   buildRandomTrailPaths() — static 'random' layout generator
 *   RISE_EASE / FALL_EASE / TARGET_DECAY — motion feel
 *
 * See README.md for full documentation.
 */

(function (global) {
	'use strict';

	const COLORS = {
		main: '#ffc608',
		coral: '#ff7052',
		periwinkle: '#3f4bf5',
		teal: '#61cdb5',
		black: '#14140f',
		gray: '#c4c5c9',
		bg: '#ffffff',
	};

	const COLOR_ONLY_PALETTE = [
		COLORS.main, COLORS.main, COLORS.main, COLORS.main, COLORS.main, COLORS.main, COLORS.main,
		COLORS.coral,
		COLORS.periwinkle,
		COLORS.teal,
		COLORS.black,
	];
	const GRAY_PROBABILITY = 0.45;

	const SHAPES = [
		'circle', 'circle', 'circle', 'circle', 'circle', 'circle', 'circle', 'circle', 'circle', 'circle', 'circle',
		'hexagon', 'hexagon', 'hexagon', 'hexagon', 'hexagon', 'hexagon', 'hexagon',
		'ring', 'hex-outline',
	];

	const SIZE_TIERS = [0.735, 0.9, 1.1];

	const CLUSTER_PATTERNS = [
		[[0, 0], [1, 0], [2, 0]],
		[[0, 0], [1, 0], [0, 1], [1, 1]],
		[[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]],
	];

	const RISE_EASE = 0.10;
	const FALL_EASE = 0.065;
	const TARGET_DECAY = 0.94;

	const STATIC_LAYOUTS = ['grid', 'gesture', 'random'];

	/** Static preview: nine localized strokes (see README — layout: 'grid'). */
	const TRAIL_PATHS_GRID = [
		// top-left — short horizontal sweep
		{ p0: [0.10, 0.16], p1: [0.22, 0.10], p2: [0.34, 0.18], p3: [0.44, 0.13], steps: 42, radiusCells: 1, strength: 0.82 },
		// top-right — gentle arc
		{ p0: [0.88, 0.14], p1: [0.78, 0.20], p2: [0.70, 0.10], p3: [0.62, 0.18], steps: 40, radiusCells: 1, strength: 0.76 },
		// upper-center — small hook
		{ p0: [0.46, 0.10], p1: [0.54, 0.16], p2: [0.50, 0.24], p3: [0.58, 0.20], steps: 34, radiusCells: 1, strength: 0.68 },
		// left-middle — vertical-ish stroke
		{ p0: [0.12, 0.42], p1: [0.18, 0.36], p2: [0.16, 0.52], p3: [0.22, 0.48], steps: 38, radiusCells: 1, strength: 0.74 },
		// right-middle — downward tick
		{ p0: [0.84, 0.44], p1: [0.76, 0.50], p2: [0.80, 0.58], p3: [0.72, 0.54], steps: 36, radiusCells: 1, strength: 0.70 },
		// center — compact gesture (does not span the canvas)
		{ p0: [0.44, 0.40], p1: [0.52, 0.36], p2: [0.56, 0.46], p3: [0.48, 0.50], steps: 32, radiusCells: 1, strength: 0.62 },
		// bottom-left — soft curve
		{ p0: [0.14, 0.74], p1: [0.24, 0.68], p2: [0.30, 0.80], p3: [0.22, 0.86], steps: 40, radiusCells: 1, strength: 0.78 },
		// bottom-center — wider resting stroke
		{ p0: [0.38, 0.82], p1: [0.50, 0.76], p2: [0.58, 0.86], p3: [0.48, 0.90], steps: 44, radiusCells: 2, strength: 0.85 },
		// bottom-right — corner accent
		{ p0: [0.78, 0.78], p1: [0.86, 0.72], p2: [0.90, 0.84], p3: [0.82, 0.88], steps: 36, radiusCells: 1, strength: 0.72 },
	];

	/** Static preview: one full-screen crossing stroke (layout: 'gesture'). */
	const TRAIL_PATHS_GESTURE = [
		{
			p0: [0.05, 0.18],
			p1: [0.36, 0.06],
			p2: [0.64, 0.94],
			p3: [0.95, 0.76],
			steps: 128,
			radiusCells: 2,
			strength: 1,
		},
	];

	function buildRandomTrailPaths() {
		// layout: 'random' — positions change on every call / page reload
		const count = 8 + ((Math.random() * 6) | 0);
		const paths = [];

		for (let i = 0; i < count; i++) {
			const cx = 0.10 + Math.random() * 0.80;
			const cy = 0.10 + Math.random() * 0.80;
			const span = 0.05 + Math.random() * 0.11;
			const angle = Math.random() * Math.PI * 2;
			const c1 = angle + (Math.random() - 0.5) * 1.4;
			const c2 = angle + (Math.random() - 0.5) * 1.4;
			const end = angle + (Math.random() - 0.5) * 0.9;

			paths.push({
				p0: [cx, cy],
				p1: [cx + Math.cos(c1) * span, cy + Math.sin(c1) * span],
				p2: [cx + Math.cos(c2) * span * 1.35, cy + Math.sin(c2) * span * 1.35],
				p3: [cx + Math.cos(end) * span * 0.85, cy + Math.sin(end) * span * 0.85],
				steps: 26 + ((Math.random() * 22) | 0),
				radiusCells: Math.random() < 0.28 ? 2 : 1,
				strength: 0.52 + Math.random() * 0.38,
			});
		}

		return paths;
	}

	function resolveTrailPaths(layout) {
		if (layout === 'gesture') return TRAIL_PATHS_GESTURE;
		if (layout === 'random') return buildRandomTrailPaths();
		return TRAIL_PATHS_GRID;
	}

	function normalizeStaticLayout(layout) {
		return STATIC_LAYOUTS.includes(layout) ? layout : 'grid';
	}

	function cellSizeForWidth(width) {
		return width < 640 ? 15 : width < 1100 ? 18 : 22;
	}

	function pickColor() {
		if (Math.random() < GRAY_PROBABILITY) return COLORS.gray;
		return COLOR_ONLY_PALETTE[(Math.random() * COLOR_ONLY_PALETTE.length) | 0];
	}

	function pickShape() {
		return SHAPES[(Math.random() * SHAPES.length) | 0];
	}

	function pickSize() {
		return SIZE_TIERS[(Math.random() * SIZE_TIERS.length) | 0];
	}

	function mulberry32(seed) {
		return function () {
			seed |= 0;
			seed = (seed + 0x6d2b79f5) | 0;
			let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}

	function seedFor(col, row) {
		return (Math.imul(col, 73856093) ^ Math.imul(row, 19349663)) | 0;
	}

	function pickFromSeeded(arr, rng) {
		return arr[(rng() * arr.length) | 0];
	}

	function pickColorSeeded(rng) {
		if (rng() < GRAY_PROBABILITY) return COLORS.gray;
		return pickFromSeeded(COLOR_ONLY_PALETTE, rng);
	}

	function easeOutCubic(t) {
		return 1 - Math.pow(1 - t, 3);
	}

	function clamp(v, a, b) {
		return Math.max(a, Math.min(b, v));
	}

	function lerp(a, b, t) {
		return a + (b - a) * t;
	}

	function hexToRgba(hex, a) {
		const v = hex.replace('#', '');
		const r = parseInt(v.substring(0, 2), 16);
		const g = parseInt(v.substring(2, 4), 16);
		const b = parseInt(v.substring(4, 6), 16);
		return `rgba(${r},${g},${b},${a})`;
	}

	function cubicBezier(p0, p1, p2, p3, t) {
		const u = 1 - t;
		const tt = t * t;
		const uu = u * u;
		const uuu = uu * u;
		const ttt = tt * t;
		return {
			x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
			y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
		};
	}

	function roundedRect(ctx, x, y, w, h, r) {
		ctx.beginPath();
		ctx.moveTo(x + r, y);
		ctx.arcTo(x + w, y, x + w, y + h, r);
		ctx.arcTo(x + w, y + h, x, y + h, r);
		ctx.arcTo(x, y + h, x, y, r);
		ctx.arcTo(x, y, x + w, y, r);
		ctx.closePath();
	}

	function drawShape(ctx, cell, cellSize) {
		const s = cellSize * 0.48 * cell.sizeJitter * cell.sizeBoost * easeOutCubic(cell.intensity);
		const alpha = clamp(easeOutCubic(cell.intensity) * 1.15, 0, 1);
		const displayColor = cell.revealOnHover
			? cell.revealed ? cell.color : COLORS.gray
			: cell.color;
		const fillHex = hexToRgba(displayColor, alpha);

		ctx.save();
		ctx.translate(cell.x, cell.y);
		ctx.rotate(cell.shape === 'hexagon' || cell.shape === 'hex-outline' ? 0 : cell.rot);
		ctx.fillStyle = fillHex;
		ctx.strokeStyle = fillHex;
		ctx.shadowColor = hexToRgba(displayColor, alpha * 0.5);
		ctx.shadowBlur = 4 * alpha;

		if (cell.shape === 'circle') {
			ctx.beginPath();
			ctx.arc(0, 0, Math.max(s * 0.5, 0.5), 0, Math.PI * 2);
			ctx.fill();
		} else if (cell.shape === 'hexagon') {
			const r = Math.max(s * 0.55, 0.5);
			ctx.beginPath();
			for (let i = 0; i < 6; i++) {
				const angle = (Math.PI / 3) * i + Math.PI / 2;
				const px = r * Math.cos(angle);
				const py = r * Math.sin(angle);
				if (i === 0) ctx.moveTo(px, py);
				else ctx.lineTo(px, py);
			}
			ctx.closePath();
			ctx.fill();
		} else if (cell.shape === 'hex-outline') {
			const r = Math.max(s * 0.55, 0.5);
			ctx.fillStyle = `rgba(255,255,255,${alpha})`;
			ctx.strokeStyle = `rgba(20,20,15,${alpha})`;
			ctx.shadowBlur = 0;
			ctx.lineWidth = Math.max(s * 0.18, 2);
			ctx.beginPath();
			for (let i = 0; i < 6; i++) {
				const angle = (Math.PI / 3) * i + Math.PI / 2;
				const px = r * Math.cos(angle);
				const py = r * Math.sin(angle);
				if (i === 0) ctx.moveTo(px, py);
				else ctx.lineTo(px, py);
			}
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
		} else if (cell.shape === 'ring') {
			ctx.fillStyle = `rgba(255,255,255,${alpha})`;
			ctx.strokeStyle = `rgba(20,20,15,${alpha})`;
			ctx.shadowBlur = 0;
			ctx.lineWidth = Math.max(s * 0.18, 2);
			ctx.beginPath();
			ctx.arc(0, 0, Math.max(s * 0.55, 0.5), 0, Math.PI * 2);
			ctx.fill();
			ctx.stroke();
		} else if (cell.shape === 'pill') {
			const w = s * 1.7;
			const h = s * 0.62;
			roundedRect(ctx, -w / 2, -h / 2, w, h, h / 2);
			ctx.fill();
		} else if (cell.shape === 'square') {
			const w = s * 0.82;
			ctx.lineWidth = Math.max(s * 0.14, 1.4);
			roundedRect(ctx, -w / 2, -w / 2, w, w, w * 0.16);
			ctx.stroke();
		} else {
			ctx.lineWidth = Math.max(s * 0.16, 1.5);
			ctx.lineCap = 'round';
			ctx.beginPath();
			ctx.moveTo(-s, 0);
			ctx.lineTo(s, 0);
			ctx.stroke();
		}

		ctx.restore();
	}

	function drawConnections(ctx, activeList, cellSize) {
		const dots = activeList.filter((c) => c.shape === 'circle' && c.intensity >= 0.05);
		const maxDist = cellSize * 3.6;
		const alignTolerance = cellSize * 0.3;
		ctx.lineCap = 'round';

		const rowBuckets = new Map();
		const colBuckets = new Map();

		for (const dot of dots) {
			const rowKey = Math.round(dot.y / cellSize);
			const colKey = Math.round(dot.x / cellSize);
			if (!rowBuckets.has(rowKey)) rowBuckets.set(rowKey, []);
			rowBuckets.get(rowKey).push(dot);
			if (!colBuckets.has(colKey)) colBuckets.set(colKey, []);
			colBuckets.get(colKey).push(dot);
		}

		function considerPair(a, b) {
			const dx = a.x - b.x;
			const dy = a.y - b.y;
			const d = Math.hypot(dx, dy);
			if (d > maxDist || d < 0.01) return;

			const sameColumn = Math.abs(dx) < alignTolerance;
			const sameRow = Math.abs(dy) < alignTolerance;
			if (!sameColumn && !sameRow) return;

			const strength = Math.min(a.intensity, b.intensity) * (1 - d / maxDist);
			if (strength <= 0.006) return;
			if (a.sociable + b.sociable < 0.82) return;

			ctx.strokeStyle = `rgba(196,197,201,${strength * 0.95})`;
			ctx.lineWidth = 1.1;
			ctx.beginPath();

			let lineX;
			let lineY;
			if (sameColumn) {
				lineX = (a.x + b.x) / 2;
				ctx.moveTo(lineX, a.y);
				ctx.lineTo(lineX, b.y);
			} else {
				lineY = (a.y + b.y) / 2;
				ctx.moveTo(a.x, lineY);
				ctx.lineTo(b.x, lineY);
			}
			ctx.stroke();

			const spacing = cellSize * 0.65;
			const steps = Math.floor(d / spacing);
			const clearance = cellSize * 0.42;
			ctx.fillStyle = `rgba(196,197,201,${strength * 0.9})`;

			for (let k = 1; k < steps; k++) {
				const t = k / steps;
				if (t * d < clearance || (1 - t) * d < clearance) continue;
				const px = sameColumn ? lineX : a.x + (b.x - a.x) * t;
				const py = sameColumn ? a.y + (b.y - a.y) * t : lineY;
				ctx.beginPath();
				ctx.arc(px, py, 1.1, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		for (const bucket of rowBuckets.values()) {
			for (let i = 0; i < bucket.length; i++) {
				for (let j = i + 1; j < bucket.length; j++) {
					considerPair(bucket[i], bucket[j]);
				}
			}
		}

		for (const bucket of colBuckets.values()) {
			for (let i = 0; i < bucket.length; i++) {
				for (let j = i + 1; j < bucket.length; j++) {
					considerPair(bucket[i], bucket[j]);
				}
			}
		}
	}

	function drawRestingDots(ctx, width, height, seed) {
		const rng = mulberry32(seed);
		const spacing = 18;

		for (let y = -spacing; y < height + spacing; y += spacing) {
			for (let x = -spacing; x < width + spacing; x += spacing) {
				if (rng() < 0.58) {
					const r = [1.7, 2.2, 2.8, 3.4][(rng() * 4) | 0];
					const alpha = 0.12 + rng() * 0.4;
					ctx.fillStyle = `rgba(180,181,188,${alpha})`;
					ctx.beginPath();
					ctx.arc(x, y, r, 0, Math.PI * 2);
					ctx.fill();
				}
			}
		}
	}

	function buildPathPoints(width, height, pathDef) {
		const p0 = { x: width * pathDef.p0[0], y: height * pathDef.p0[1] };
		const p1 = { x: width * pathDef.p1[0], y: height * pathDef.p1[1] };
		const p2 = { x: width * pathDef.p2[0], y: height * pathDef.p2[1] };
		const p3 = { x: width * pathDef.p3[0], y: height * pathDef.p3[1] };
		const points = [];

		for (let i = 0; i <= pathDef.steps; i++) {
			points.push(cubicBezier(p0, p1, p2, p3, i / pathDef.steps));
		}

		return points;
	}

	function trailEnvelope(progress) {
		const centered = Math.sin(progress * Math.PI);
		const leading = Math.pow(clamp(1 - progress * 1.08, 0, 1), 0.55);
		return clamp(centered * 0.72 + leading * 0.42, 0.08, 1);
	}

	function stampTrailAtPoint(cells, mx, my, cellSize, pathStrength, radiusCells) {
		const col0 = Math.round(mx / cellSize);
		const row0 = Math.round(my / cellSize);

		for (let dc = -radiusCells; dc <= radiusCells; dc++) {
			for (let dr = -radiusCells; dr <= radiusCells; dr++) {
				const col = col0 + dc;
				const row = row0 + dr;
				const cx = col * cellSize;
				const cy = row * cellSize;
				const dist = Math.hypot(cx - mx, cy - my);
				const maxDist = cellSize * (radiusCells + 0.45);
				if (dist > maxDist) continue;

				const falloff = 1 - dist / maxDist;
				const targetIntensity = Math.min(1, falloff * pathStrength * 1.12);
				if (targetIntensity < 0.04) continue;

				const key = col + ',' + row;
				const jitterAmount = cellSize * 0.05;
				const rng = mulberry32(seedFor(col, row));
				const existing = cells.get(key);

				if (!existing) {
					const revealOnHover = rng() < 0.75;
					cells.set(key, {
						x: cx + (rng() - 0.5) * jitterAmount,
						y: cy + (rng() - 0.5) * jitterAmount,
						intensity: targetIntensity,
						shape: pickFromSeeded(SHAPES, rng),
						color: pickColorSeeded(rng),
						rot: rng() * Math.PI,
						sizeJitter: pickFromSeeded(SIZE_TIERS, rng),
						sizeBoost: rng() < 0.15 ? 1.02 : 1.0,
						sociable: rng(),
						revealOnHover,
						revealed: revealOnHover ? rng() < 0.58 : false,
					});
				} else if (targetIntensity > existing.intensity) {
					existing.intensity = targetIntensity;
				}
			}
		}
	}

	function buildSyntheticTrail(width, height, cellSize, layout) {
		const cells = new Map();
		const pathDefs = resolveTrailPaths(normalizeStaticLayout(layout));

		for (const pathDef of pathDefs) {
			const points = buildPathPoints(width, height, pathDef);
			const pathScale = pathDef.strength == null ? 1 : pathDef.strength;

			for (let i = 0; i < points.length; i++) {
				const progress = i / Math.max(1, points.length - 1);
				const strength = trailEnvelope(progress) * pathScale;
				const point = points[i];
				stampTrailAtPoint(cells, point.x, point.y, cellSize, strength, pathDef.radiusCells);
			}
		}

		return Array.from(cells.values());
	}

	function generateRestingDotsTexture(width, height) {
		const off = document.createElement('canvas');
		off.width = Math.max(1, Math.round(width));
		off.height = Math.max(1, Math.round(height));
		const octx = off.getContext('2d');

		octx.fillStyle = COLORS.bg;
		octx.fillRect(0, 0, width, height);
		drawRestingDots(octx, width, height, 0x51a7f3);

		return off.toDataURL();
	}

	function generateStaticPreviewTexture(width, height, layout) {
		const cellSize = cellSizeForWidth(width);
		const off = document.createElement('canvas');
		off.width = Math.max(1, Math.round(width));
		off.height = Math.max(1, Math.round(height));
		const octx = off.getContext('2d');

		octx.fillStyle = COLORS.bg;
		octx.fillRect(0, 0, width, height);
		drawRestingDots(octx, width, height, 0x51a7f3);

		const trailCells = buildSyntheticTrail(width, height, cellSize, layout);
		drawConnections(octx, trailCells, cellSize);
		for (const cell of trailCells) {
			drawShape(octx, cell, cellSize);
		}

		return off.toDataURL();
	}

	/**
	 * Paints a static background into `staticDots` (used on mobile).
	 * @param {object} options
	 * @param {HTMLElement} options.staticDots — target overlay div
	 * @param {string} [options.layout='grid'] — 'grid' | 'gesture' | 'random'
	 * @param {number} [options.width] — defaults to window.innerWidth
	 * @param {number} [options.height] — defaults to window.innerHeight
	 * @param {boolean} [options.blended=true] — resting dots + trail vs resting only
	 */
	function renderStaticPreview(options) {
		const staticOverlay = options.staticDots;
		const width = options.width != null ? options.width : window.innerWidth;
		const height = options.height != null ? options.height : window.innerHeight;
		const blended = options.blended !== false;
		const layout = normalizeStaticLayout(options.layout);

		if (!staticOverlay) return null;

		const texture = blended
			? generateStaticPreviewTexture(width, height, layout)
			: generateRestingDotsTexture(width, height);

		staticOverlay.style.backgroundImage = `url(${texture})`;
		staticOverlay.classList.remove('hidden');
		return texture;
	}

	/**
	 * Starts the live interactive animation (used on desktop).
	 * @param {object} options
	 * @param {HTMLCanvasElement} options.canvas — required
	 * @param {HTMLElement} [options.staticDots] — resting texture overlay
	 * @returns {{ resize: Function, destroy: Function }}
	 */
	function createGridTrail(options) {
		const canvas = options.canvas;
		const staticOverlay = options.staticDots || null;

		if (!canvas) {
			throw new Error('GridTrail.create requires a canvas element.');
		}

		const ctx = canvas.getContext('2d', { alpha: false });
		const cells = new Map();
		const mouse = { x: -9999, y: -9999, has: false, vx: 0, vy: 0 };
		let outlierCounter = 0;
		let baseDots = [];
		let showRequestId = 0;
		let lastFrameTime = performance.now();
		let frameId = 0;
		let destroyed = false;

		let DPR = Math.min(window.devicePixelRatio || 1, 2);
		let W = 0;
		let H = 0;
		let CELL = 56;

		const listeners = [];

		function on(target, type, handler, opts) {
			target.addEventListener(type, handler, opts);
			listeners.push([target, type, handler, opts]);
		}

		function buildBaseGrid() {
			baseDots = [];
			const cols = Math.ceil(W / CELL) + 1;
			const rows = Math.ceil(H / CELL) + 1;
			for (let r = 0; r < rows; r++) {
				for (let c = 0; c < cols; c++) {
					baseDots.push({ x: c * CELL, y: r * CELL });
				}
			}
		}

		function resize() {
			W = window.innerWidth;
			H = window.innerHeight;
			canvas.width = Math.floor(W * DPR);
			canvas.height = Math.floor(H * DPR);
			canvas.style.width = W + 'px';
			canvas.style.height = H + 'px';
			ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
			CELL = cellSizeForWidth(W);
			buildBaseGrid();
			regenerateStaticDots();
		}

		function spawnOutlierCluster(cx, cy, targetIntensity, colorOverride) {
			const pattern = CLUSTER_PATTERNS[(Math.random() * CLUSTER_PATTERNS.length) | 0];
			const spacing = CELL * 0.85;
			const swapAxes = Math.random() < 0.5;
			const anchorX = cx + (Math.random() - 0.5) * CELL * 2.4;
			const anchorY = cy + (Math.random() - 0.5) * CELL * 2.4;

			for (const [ox, oy] of pattern) {
				const gx = swapAxes ? oy : ox;
				const gy = swapAxes ? ox : oy;
				const key2 = 'outlier-' + outlierCounter++;
				cells.set(key2, {
					x: anchorX + gx * spacing + (Math.random() - 0.5) * spacing * 0.2,
					y: anchorY + gy * spacing + (Math.random() - 0.5) * spacing * 0.2,
					intensity: 0,
					target: targetIntensity * (0.7 + Math.random() * 0.3),
					shape: pickShape(),
					color: colorOverride || pickColor(),
					rot: Math.random() * Math.PI,
					sizeJitter: pickSize(),
					sizeBoost: Math.random() < 0.15 ? 1.02 : 1.0,
					sociable: Math.random(),
					revealOnHover: Math.random() < 0.75,
					revealAmount: 0,
					hoverTime: 0,
					holdDuration: 3000 + Math.random() * 1500,
					born: performance.now(),
				});
			}
		}

		function activateAround(mx, my) {
			const col0 = Math.round(mx / CELL);
			const row0 = Math.round(my / CELL);
			const radiusCells = 1;

			for (let dc = -radiusCells; dc <= radiusCells; dc++) {
				for (let dr = -radiusCells; dr <= radiusCells; dr++) {
					const col = col0 + dc;
					const row = row0 + dr;
					const cx = col * CELL;
					const cy = row * CELL;
					const dist = Math.hypot(cx - mx, cy - my);
					const maxDist = CELL * (radiusCells + 0.4);
					if (dist > maxDist) continue;

					const falloff = 1 - dist / maxDist;
					const key = col + ',' + row;
					let cell = cells.get(key);
					const targetIntensity = Math.min(1, falloff * 1.15);

					if (!cell) {
						const jitterAmount = CELL * 0.05;
						const rng = mulberry32(seedFor(col, row));
						cell = {
							x: cx + (rng() - 0.5) * jitterAmount,
							y: cy + (rng() - 0.5) * jitterAmount,
							intensity: 0,
							target: 0,
							shape: pickFromSeeded(SHAPES, rng),
							color: pickColorSeeded(rng),
							rot: rng() * Math.PI,
							sizeJitter: pickFromSeeded(SIZE_TIERS, rng),
							sizeBoost: rng() < 0.15 ? 1.02 : 1.0,
							sociable: rng(),
							revealOnHover: rng() < 0.75,
							revealAmount: 0,
							hoverTime: 0,
							holdDuration: 3000 + rng() * 1500,
							born: performance.now(),
						};
						cells.set(key, cell);

						if (Math.random() < 0.05) {
							spawnOutlierCluster(cx, cy, targetIntensity);
						}
					}

					if (targetIntensity > cell.target) {
						cell.target = targetIntensity;
					}
				}
			}
		}

		function setPointer(x, y) {
			mouse.vx = x - (mouse.has ? mouse.x : x);
			mouse.vy = y - (mouse.has ? mouse.y : y);
			mouse.x = x;
			mouse.y = y;
			mouse.has = true;
			activateAround(x, y);
		}

		function frame() {
			if (destroyed) return;

			const now = performance.now();
			const dt = Math.min(now - lastFrameTime, 100);
			lastFrameTime = now;

			ctx.fillStyle = COLORS.bg;
			ctx.fillRect(0, 0, W, H);

			const activeList = [];
			cells.forEach((cell, key) => {
				const decay = cell.customDecay || TARGET_DECAY;
				cell.target *= decay;
				const riseEase = cell.customRiseEase || RISE_EASE;
				const fallEase = cell.customFallEase || FALL_EASE;
				const ease = cell.target > cell.intensity ? riseEase : fallEase;
				cell.intensity = lerp(cell.intensity, cell.target, ease);

				if (cell.intensity < 0.01 && cell.target < 0.01) {
					cells.delete(key);
					return;
				}

				if (cell.revealOnHover) {
					const hoverRadius = CELL * 0.85;
					const dist = mouse.has ? Math.hypot(cell.x - mouse.x, cell.y - mouse.y) : Infinity;
					const isHovering = dist < hoverRadius;

					if (isHovering) {
						cell.hoverTime += dt;
						cell.awayTime = 0;
					} else {
						cell.awayTime = (cell.awayTime || 0) + dt;
						if (cell.awayTime > 200) cell.hoverTime = 0;
					}

					cell.revealed = cell.hoverTime >= cell.holdDuration;
				}

				activeList.push(cell);
			});

			drawConnections(ctx, activeList, CELL);
			for (const cell of activeList) drawShape(ctx, cell, CELL);

			frameId = requestAnimationFrame(frame);
		}

		function regenerateStaticDots() {
			if (!staticOverlay) return;
			staticOverlay.style.backgroundImage = `url(${generateRestingDotsTexture(W, H)})`;
		}

		function hideStaticDots() {
			showRequestId++;
			if (staticOverlay) staticOverlay.classList.add('hidden');
		}

		function requestShowStaticDots() {
			const myId = ++showRequestId;
			(function check() {
				if (myId !== showRequestId || destroyed) return;
				if (cells.size <= 28) {
					if (staticOverlay) staticOverlay.classList.remove('hidden');
				} else {
					setTimeout(check, 150);
				}
			})();
		}

		on(window, 'mousemove', (e) => setPointer(e.clientX, e.clientY), { passive: true });
		on(window, 'touchmove', (e) => {
			if (e.touches && e.touches[0]) {
				setPointer(e.touches[0].clientX, e.touches[0].clientY);
			}
		}, { passive: true });
		on(window, 'touchstart', (e) => {
			if (e.touches && e.touches[0]) {
				setPointer(e.touches[0].clientX, e.touches[0].clientY);
			}
		}, { passive: true });
		on(window, 'mouseleave', () => {
			mouse.has = false;
		});
		on(window, 'resize', resize);
		on(window, 'mousemove', hideStaticDots, { passive: true });
		on(window, 'touchstart', hideStaticDots, { passive: true });
		on(document, 'mouseout', (e) => {
			if (!e.relatedTarget) requestShowStaticDots();
		}, { passive: true });

		resize();
		frameId = requestAnimationFrame(frame);

		return {
			resize,
			destroy() {
				destroyed = true;
				cancelAnimationFrame(frameId);
				cells.clear();
				for (const [target, type, handler, opts] of listeners) {
					target.removeEventListener(type, handler, opts);
				}
				listeners.length = 0;
			},
		};
	}

	global.GridTrail = {
		create: createGridTrail,
		renderStaticPreview,
		generateStaticPreviewTexture,
		generateRestingDotsTexture,
		STATIC_LAYOUTS,
	};
})(typeof window !== 'undefined' ? window : this);
