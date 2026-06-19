/**
 * p5.js — Dots and Lines · Div Population (scroll-driven module)
 * ---------------------------------------------------------------
 * A drop-in, monochrome spin-off of the original "Dots and Lines" hero
 * animation. Instead of one full-screen sketch, this scans the page for
 * marked containers and grows an independent <canvas> inside each one.
 *
 * Each module draws a small grid of dots plus a SINGLE tracer. The tracer
 * does not run on a timer — its motion is driven entirely by page scroll:
 *
 *   • scroll down  → the tracer draws forward through the grid
 *   • scroll up    → the tracer retraces backward
 *   • stop scroll  → the tracer eases to a halt (inertia), it never stops dead
 *
 * Usage (see README.md for the full guide):
 *
 *   <div data-dots-lines></div>
 *   <script src=".../p5.min.js"></script>
 *   <script src=".../gsap.min.js"></script>   <!-- optional, used for the ticker -->
 *   <script src="dots-lines.js"></script>
 *
 * Every matching element is upgraded automatically on DOMContentLoaded.
 * Per-element overrides are read from data-dl-* attributes, or pass an
 * options object to DotsAndLines.init(selector, options).
 */

(function (global) {
	'use strict';

	// ─── Defaults ────────────────────────────────────────────────────────────
	// All of these can be overridden per element via data-dl-* attributes
	// (camelCase → kebab-case, e.g. dotSize → data-dl-dot-size).

	const DEFAULTS = {
		spacing: 26, // px between grid points
		dotSize: 0.34, // dot diameter as a fraction of spacing
		density: 0.6, // 0..1 — how much of the grid carries a dot
		noiseScale: 0.14, // controls the size of the organic blank patches
		speed: 1, // multiplier on scroll velocity → tracer motion
		idleSpeed: 2, // cells/sec the tracer drifts when not scrolling (0 = halt)
		maxStep: 1.4, // hard clamp on cells advanced per frame
		trailCells: 7, // length of the glowing trail behind the head
		lineWeight: 2, // tracer stroke weight in px
		turnChance: 0.08, // probability the tracer turns at a node
		bg: 'transparent', // canvas background ('transparent' clears each frame)
		inactive: '#F6F6F6', // resting dot colour
		active: '#E4E4E4', // colour of lit dots + the tracer line
		hoverRadius: 80, // px radius of the mouse influence
		hoverBoost: 0.9, // extra scale applied to dots under the cursor
		breathe: 0.16, // amplitude of the gentle idle dot pulsing (0 = off)
		spreadRadius: 1, // how many cells away from the tracer head to spread activation
		spreadChance: 0.35, // probability each neighbour gets activated (0 = off)
		pixelDensityCap: 2, // upper bound on devicePixelRatio for retina sharpness
		seed: null, // fixed layout seed (null → random per module)
		maxPath: 600, // safety cap on stored tracer path length
	};

	const CARDINALS = [
		{ dx: 1, dy: 0 },
		{ dx: -1, dy: 0 },
		{ dx: 0, dy: 1 },
		{ dx: 0, dy: -1 },
	];

	const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
	const lerp = (a, b, t) => a + (b - a) * t;

	function hexToRGB(hex) {
		const c = String(hex).replace('#', '');
		const full = c.length === 3 ? c.split('').map((ch) => ch + ch).join('') : c;
		return {
			r: parseInt(full.slice(0, 2), 16) || 0,
			g: parseInt(full.slice(2, 4), 16) || 0,
			b: parseInt(full.slice(4, 6), 16) || 0,
		};
	}

	function moveToward(value, target, maxStep) {
		if (value < target) return Math.min(target, value + maxStep);
		if (value > target) return Math.max(target, value - maxStep);
		return value;
	}

	// ─── Global scroll driver ──────────────────────────────────────────────────
	// One shared, signed velocity value every module reads. Three input sources
	// are combined so input works in every environment:
	//   • wheel   — mouse wheel / trackpad, works inside iframes & custom containers
	//   • scroll  — covers keyboard nav (arrow keys, Page Down, spacebar)
	//   • touch   — mobile swipe
	// The ticker bleeds the raw target toward 0 while idle, giving the tracer
	// natural inertia rather than a hard stop.

	const ScrollDriver = (function () {
		const nowMs = () =>
			typeof performance !== 'undefined' ? performance.now() : Date.now();

		let velocity = 0;
		let target = 0;
		let lastEventMs = 0;

		// ── wheel (primary — most reliable across all contexts) ────────────────
		function onWheel(e) {
			// Normalise all deltaMode values to approximate CSS pixels.
			const px =
				e.deltaMode === 0 ? e.deltaY
				: e.deltaMode === 1 ? e.deltaY * 16
				: e.deltaY * 400;
			target = clamp(px * 0.35, -12, 12);
			lastEventMs = nowMs();
		}

		// ── scroll (keyboard nav, programmatic) ────────────────────────────────
		let lastY = 0;
		let lastScrollMs = 0;
		function onScroll() {
			const t = nowMs();
			const y = global.pageYOffset || document.documentElement.scrollTop || 0;
			const dy = y - lastY;
			const dt = Math.max(8, t - lastScrollMs);
			lastY = y;
			lastScrollMs = t;
			lastEventMs = t;
			const v = clamp((dy / dt) * 16, -12, 12);
			// Only update if this gives a stronger signal than the current target
			// (avoids wheel and scroll fighting each other on smooth-scroll UAs).
			if (Math.abs(v) > Math.abs(target)) target = v;
		}

		// ── touch ──────────────────────────────────────────────────────────────
		let touchY = 0;
		function onTouchStart(e) {
			touchY = e.touches[0].clientY;
		}
		function onTouchMove(e) {
			const dy = touchY - e.touches[0].clientY;
			touchY = e.touches[0].clientY;
			target = clamp(dy * 0.8, -12, 12);
			lastEventMs = nowMs();
		}

		// ── per-frame tick ─────────────────────────────────────────────────────
		function tick() {
			const idle = nowMs() - lastEventMs;
			if (idle > 60) target *= 0.78; // bleed toward 0 while idle
			if (Math.abs(target) < 0.002) target = 0;
			velocity += (target - velocity) * 0.15;
			if (Math.abs(velocity) < 0.001) velocity = 0;
		}

		global.addEventListener('wheel', onWheel, { passive: true });
		global.addEventListener('scroll', onScroll, { passive: true });
		global.addEventListener('touchstart', onTouchStart, { passive: true });
		global.addEventListener('touchmove', onTouchMove, { passive: true });

		let started = false;
		function start() {
			if (started) return;
			started = true;
			lastY = global.pageYOffset || document.documentElement.scrollTop || 0;
			lastScrollMs = nowMs();
			lastEventMs = nowMs();
			if (typeof gsap !== 'undefined' && gsap.ticker) {
				gsap.ticker.add(tick);
			} else {
				const loop = () => {
					tick();
					requestAnimationFrame(loop);
				};
				requestAnimationFrame(loop);
			}
		}

		return {
			start,
			get velocity() {
				return velocity;
			},
		};
	})();

	// ─── Per-module sketch factory ──────────────────────────────────────────────

	function createSketch(el, config) {
		return function (p) {
			let W = 0;
			let H = 0;
			let cols = 0;
			let rows = 0;
			let ox = 0;
			let oy = 0;
			let cells = [];

			const inactiveRGB = hexToRGB(config.inactive);
			const activeRGB = hexToRGB(config.active);
			const transparent = String(config.bg).toLowerCase() === 'transparent';
			const bgRGB = transparent ? null : hexToRGB(config.bg);

			// Tracer state — a single head walking a generated path of cells.
			let path = []; // [{ c, r }]
			let pos = 0; // floating index of the head along `path`

			const cellX = (c) => ox + c * config.spacing;
			const cellY = (r) => oy + r * config.spacing;
			const inBounds = (c, r) => c >= 0 && c < cols && r >= 0 && r < rows;
			const cellAt = (c, r) => (inBounds(c, r) ? cells[r * cols + c] : null);

			function buildGrid() {
				const pitch = config.spacing;
				cols = Math.max(1, Math.floor(W / pitch));
				rows = Math.max(1, Math.floor(H / pitch));

				const totalW = cols * pitch;
				const totalH = rows * pitch;
				ox = (W - totalW) / 2 + pitch * 0.5;
				oy = (H - totalH) / 2 + pitch * 0.5;

				const seed = config.seed == null ? Math.floor(p.random(1e6)) : config.seed;
				p.randomSeed(seed);
				p.noiseSeed(seed);

				// Higher density → lower threshold → more dots survive.
				const threshold = 1 - clamp(config.density, 0, 1);

				cells = new Array(cols * rows);
				for (let r = 0; r < rows; r++) {
					for (let c = 0; c < cols; c++) {
						const n = p.noise(c * config.noiseScale, r * config.noiseScale);
						cells[r * cols + c] = {
							c,
							r,
							hasDot: n > threshold,
							breatheOffset: p.random(p.TWO_PI),
							breatheSpeed: p.random(0.0006, 0.0016),
							activation: 0,
							activeUntil: 0,
							hoverBoost: 0,
						};
					}
				}
			}

			// ── Tracer path generation ──────────────────────────────────────────

			function normDir(d) {
				if (d.dx === 0 && d.dy === 0) return { dx: 1, dy: 0 };
				return { dx: Math.sign(d.dx), dy: Math.sign(d.dy) };
			}

			function pickDir(c, r, curDir, avoidC, avoidR) {
				const straight = normDir(curDir);
				const canStraight = inBounds(c + straight.dx, r + straight.dy);
				const wantTurn = p.random() < config.turnChance;

				if (canStraight && !wantTurn) return straight;

				const opts = CARDINALS.filter((d) => {
					const nc = c + d.dx;
					const nr = r + d.dy;
					return inBounds(nc, nr) && !(nc === avoidC && nr === avoidR);
				});
				if (opts.length === 0) {
					return canStraight ? straight : { dx: -straight.dx, dy: -straight.dy };
				}
				const perp = opts.filter((d) => d.dx * straight.dx + d.dy * straight.dy === 0);
				const pool = wantTurn && perp.length ? perp : opts;
				return pool[Math.floor(p.random(pool.length))];
			}

			function growTail() {
				let guard = 0;
				while (pos > path.length - (config.trailCells + 3) && guard++ < 64) {
					const tail = path[path.length - 1];
					const prev = path[path.length - 2] || tail;
					const dir = pickDir(
						tail.c,
						tail.r,
						{ dx: tail.c - prev.c, dy: tail.r - prev.r },
						prev.c,
						prev.r
					);
					path.push({ c: tail.c + dir.dx, r: tail.r + dir.dy });
				}
			}

			function growHead() {
				let guard = 0;
				while (pos < config.trailCells + 3 && guard++ < 64) {
					const head = path[0];
					const next = path[1] || head;
					const dir = pickDir(
						head.c,
						head.r,
						{ dx: head.c - next.c, dy: head.r - next.r },
						next.c,
						next.r
					);
					path.unshift({ c: head.c + dir.dx, r: head.r + dir.dy });
					pos += 1; // every node prepended shifts the head index forward
				}
			}

			function trimPath() {
				if (path.length <= config.maxPath) return;
				// Drop nodes from whichever end is furthest from the head.
				const frontGap = Math.floor(pos) - (config.trailCells + 2);
				const backGap = path.length - 1 - (Math.ceil(pos) + (config.trailCells + 2));
				if (frontGap > backGap && frontGap > 0) {
					const drop = Math.min(frontGap, path.length - config.maxPath);
					path.splice(0, drop);
					pos -= drop;
				} else if (backGap > 0) {
					const drop = Math.min(backGap, path.length - config.maxPath);
					path.splice(path.length - drop, drop);
				}
			}

			function seedTracer() {
				const c = Math.floor(cols / 2);
				const r = Math.floor(rows / 2);
				path = [{ c, r }];
				pos = 0;
				growHead();
				growTail();
				pos = clamp(config.trailCells + 3, 0, path.length - 1);
			}

			// ── Per-frame updates ──────────────────────────────────────────────

			function advanceTracer(dt) {
				const frame = dt / 16.67; // normalise to 60fps steps
				// Idle drift: slow constant forward motion so the animation is always
				// visibly alive even without scrolling. Scroll adds to / subtracts
				// from this, so scrolling up can still reverse the tracer.
				const idleStep = (config.idleSpeed / 60) * frame;
				const scrollStep = ScrollDriver.velocity * 0.02 * config.speed * frame;
				let step = idleStep + scrollStep;
				step = clamp(step, -config.maxStep, config.maxStep);
				pos += step;
				if (pos < 0) pos = 0;

				growTail();
				growHead();
				trimPath();
			}

			function spreadActivation(node, now) {
			if (config.spreadRadius <= 0) return;
			for (let dr = -config.spreadRadius; dr <= config.spreadRadius; dr++) {
				for (let dc = -config.spreadRadius; dc <= config.spreadRadius; dc++) {
					if (dc === 0 && dr === 0) continue;
					if (Math.random() > config.spreadChance) continue;
					const cell = cellAt(node.c + dc, node.r + dr);
					if (cell) cell.activeUntil = Math.max(cell.activeUntil, now + 560);
				}
			}
		}

		function activateTrail(now) {
			const lo = Math.max(0, Math.floor(pos - config.trailCells));
			const hi = Math.min(path.length - 1, Math.ceil(pos));
			for (let i = lo; i <= hi; i++) {
				const node = path[i];
				const cell = cellAt(node.c, node.r);
				if (cell) cell.activeUntil = Math.max(cell.activeUntil, now + 900);
			}
			// Spread activation outward from the current head position
			const headIdx = clamp(Math.floor(pos), 0, path.length - 1);
			if (path[headIdx]) spreadActivation(path[headIdx], now);
		}

			function updateCells(now, dt) {
				const hoverR = config.hoverRadius;
				const hoverR2 = hoverR * hoverR;
				const over =
					p.mouseX >= 0 && p.mouseX <= W && p.mouseY >= 0 && p.mouseY <= H;

				for (let i = 0; i < cells.length; i++) {
					const cell = cells[i];

					const actTarget = now < cell.activeUntil ? 1 : 0;
					const actDur = actTarget > cell.activation ? 420 : 1600;
					cell.activation = moveToward(cell.activation, actTarget, dt / actDur);

					let hoverTarget = 0;
					if (over && cell.hasDot) {
						const dx = cellX(cell.c) - p.mouseX;
						const dy = cellY(cell.r) - p.mouseY;
						const d2 = dx * dx + dy * dy;
						if (d2 <= hoverR2) {
							hoverTarget = (1 - Math.sqrt(d2) / hoverR) * config.hoverBoost;
						}
					}
					cell.hoverBoost = moveToward(cell.hoverBoost, hoverTarget, dt / 520);
				}
			}

			// ── Rendering ──────────────────────────────────────────────────────────

		function drawDots(now) {
			const pitch = config.spacing;
			p.noStroke();
			for (let i = 0; i < cells.length; i++) {
				const cell = cells[i];
				const act = cell.activation;
				const hover = cell.hoverBoost;

				if (cell.hasDot) {
					// Normal grid dot: breathes gently and lights up when activated.
					const breathe =
						1 - config.breathe + config.breathe * Math.sin(now * cell.breatheSpeed + cell.breatheOffset);
					const scale = Math.max(breathe, hover, act);
					if (scale <= 0.01) continue;
					const r = lerp(inactiveRGB.r, activeRGB.r, act);
					const g = lerp(inactiveRGB.g, activeRGB.g, act);
					const b = lerp(inactiveRGB.b, activeRGB.b, act);
					p.fill(r, g, b);
					p.circle(cellX(cell.c), cellY(cell.r), config.dotSize * pitch * scale);
				} else if (act > 0.01 || hover > 0.01) {
					// Blank cell: only visible when the tracer or cursor touches it.
					// Slightly smaller than regular dots to keep the blank areas lighter.
					const scale = Math.max(act, hover) * 0.72;
					if (scale <= 0.01) continue;
					p.fill(activeRGB.r, activeRGB.g, activeRGB.b);
					p.circle(cellX(cell.c), cellY(cell.r), config.dotSize * pitch * scale);
				}
			}
		}

			function headPoint() {
				const i = Math.floor(pos);
				const f = pos - i;
				const a = path[clamp(i, 0, path.length - 1)];
				const b = path[clamp(i + 1, 0, path.length - 1)];
				return {
					x: lerp(cellX(a.c), cellX(b.c), f),
					y: lerp(cellY(a.r), cellY(b.r), f),
				};
			}

			function drawTracer() {
				const lo = Math.max(0, Math.floor(pos - config.trailCells));
				const head = headPoint();

				p.noFill();
				p.strokeWeight(config.lineWeight);
				p.strokeCap(p.ROUND);
				p.strokeJoin(p.ROUND);

				// Build the comet from `lo` up to the floating head, fading by
				// distance behind the head so the trail tapers off.
				let prevX = cellX(path[lo].c);
				let prevY = cellY(path[lo].r);
				const top = Math.floor(pos);

				for (let i = lo + 1; i <= top; i++) {
					const node = path[i];
					const x = cellX(node.c);
					const y = cellY(node.r);
					const dist = pos - i;
					const alpha = clamp(1 - dist / config.trailCells, 0, 1);
					if (alpha > 0) {
						p.stroke(activeRGB.r, activeRGB.g, activeRGB.b, alpha * 255);
						p.line(prevX, prevY, x, y);
					}
					prevX = x;
					prevY = y;
				}

				// Final partial segment from the last node to the head.
				p.stroke(activeRGB.r, activeRGB.g, activeRGB.b, 255);
				p.line(prevX, prevY, head.x, head.y);
			}

			// ── p5 lifecycle ─────────────────────────────────────────────────────

			function measure() {
				const rect = el.getBoundingClientRect();
				W = Math.max(1, Math.round(rect.width));
				H = Math.max(1, Math.round(rect.height));
			}

			p.setup = function () {
				measure();
				const cv = p.createCanvas(W, H);
				cv.parent(el);
				p.pixelDensity(Math.min(config.pixelDensityCap, p.displayDensity()));
				p.rectMode(p.CORNER);
				p.colorMode(p.RGB, 255);
				buildGrid();
				seedTracer();

				// Pause the loop while the module is off-screen — this is the main
				// performance lever when many modules live on one page.
				if ('IntersectionObserver' in global) {
					const io = new IntersectionObserver(
						(entries) => {
							for (const entry of entries) {
								if (entry.isIntersecting) p.loop();
								else p.noLoop();
							}
						},
						{ rootMargin: '120px' }
					);
					io.observe(el);
				}

				// Reflow the grid when the container resizes.
				if ('ResizeObserver' in global) {
					let raf = null;
					const ro = new ResizeObserver(() => {
						if (raf) return;
						raf = requestAnimationFrame(() => {
							raf = null;
							const prevW = W;
							const prevH = H;
							measure();
							if (W !== prevW || H !== prevH) {
								p.resizeCanvas(W, H);
								buildGrid();
								seedTracer();
							}
						});
					});
					ro.observe(el);
				}
			};

			p.draw = function () {
				const now = p.millis();
				const dt = Math.min(p.deltaTime, 64);

				if (transparent) p.clear();
				else p.background(bgRGB.r, bgRGB.g, bgRGB.b);

				advanceTracer(dt);
				activateTrail(now);
				updateCells(now, dt);

				drawDots(now);
				drawTracer();
			};
		};
	}

	// ─── Public API ──────────────────────────────────────────────────────────────

	const instances = [];

	function readConfig(el, overrides) {
		const cfg = Object.assign({}, DEFAULTS, overrides || {});
		const numeric = {
			spacing: 1,
			dotSize: 1,
			density: 1,
			noiseScale: 1,
			speed: 1,
			idleSpeed: 1,
			maxStep: 1,
			trailCells: 1,
			lineWeight: 1,
			turnChance: 1,
			hoverRadius: 1,
			hoverBoost: 1,
			breathe: 1,
			spreadRadius: 1,
			spreadChance: 1,
			pixelDensityCap: 1,
			seed: 1,
			maxPath: 1,
		};
		// dotSize → attribute data-dl-dot-size → el.dataset.dlDotSize
		for (const key in cfg) {
			const kebab = key.replace(/([A-Z])/g, '-$1').toLowerCase();
			const datasetKey =
				'dl' +
				kebab
					.split('-')
					.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
					.join('');
			const raw = el.dataset[datasetKey];
			if (raw == null) continue;
			if (numeric[key]) {
				const num = parseFloat(raw);
				if (!Number.isNaN(num)) cfg[key] = num;
			} else {
				cfg[key] = raw;
			}
		}
		return cfg;
	}

	// p5 (and GSAP) may be injected asynchronously by a host page / loader, so
	// run a callback once p5 is actually on the window — polling briefly rather
	// than giving up immediately if it isn't there yet.
	function whenP5Ready(cb, tries) {
		tries = tries || 0;
		if (typeof p5 !== 'undefined') {
			ScrollDriver.start();
			return cb();
		}
		if (tries > 200) {
			console.warn('[DotsAndLines] p5.js was not found after waiting ~10s.');
			return;
		}
		setTimeout(() => whenP5Ready(cb, tries + 1), 50);
	}

	function create(el, overrides) {
		if (!el || el.__dotsLines) return el && el.__dotsLines;
		if (typeof p5 === 'undefined') {
			console.warn('[DotsAndLines] p5.js is required but was not found.');
			return null;
		}
		const cfg = readConfig(el, overrides);
		const sketch = createSketch(el, cfg);
		const instance = new p5(sketch);
		el.__dotsLines = instance;
		instances.push(instance);
		return instance;
	}

	function init(selector, overrides) {
		const sel = selector || '[data-dots-lines]';
		const run = () => {
			const els = document.querySelectorAll(sel);
			els.forEach((el) => create(el, overrides));
		};
		whenP5Ready(run);
		return instances;
	}

	const API = { init, create, instances, DEFAULTS };
	global.DotsAndLines = API;

	// Auto-initialise unless the host opts out with <body data-dl-manual>.
	function boot() {
		if (document.body && document.body.hasAttribute('data-dl-manual')) return;
		init();
	}
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot);
	} else {
		boot();
	}
})(typeof window !== 'undefined' ? window : this);
