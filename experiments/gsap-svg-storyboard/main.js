const DARK = '#211E26';
const ORANGE = '#F46B1A';

/** Placeholder for unused MorphSVG fallback path (boards 0–3 are custom SVG+GSAP). */
const STORYBOARDS = [null, null, null, null];

/** Form cluster (index 0) */
const BLOBS = [
	{
		start: { cx: 400, cy: 322, r: 34 },
		attached: { cx: 455, cy: 275, r: 50 },
		stretch: { cx: 470, cy: 210, r: 48 },
		released: { cx: 443.2, cy: 119.2, r: 59.5 }
	},
	{
		start: { cx: 301, cy: 322, r: 34 },
		attached: { cx: 245, cy: 275, r: 50 },
		stretch: { cx: 175, cy: 195, r: 44 },
		released: { cx: 106.2, cy: 109.2, r: 42.5 }
	},
	{
		start: { cx: 301, cy: 420, r: 34 },
		attached: { cx: 245, cy: 468, r: 50 },
		stretch: { cx: 230, cy: 560, r: 52 },
		released: { cx: 247.2, cy: 645.2, r: 59.5 }
	},
	{
		start: { cx: 400, cy: 420, r: 34 },
		attached: { cx: 455, cy: 468, r: 50 },
		stretch: { cx: 485, cy: 500, r: 44 },
		released: { cx: 499.2, cy: 512.2, r: 43 }
	}
];

const CORE = {
	rest: { x: 267, y: 288, w: 167.314, h: 167.314, rx: 50 },
	pinched: { x: 274, y: 295, w: 153.314, h: 153.314, rx: 48 }
};

/**
 * Signal grid (index 1)
 * disperse → call (tendrils from core + balls) → connect (tips meet) → order (stacked exits)
 */
const S2_CORE_CENTER = { x: 267 + 167.314 / 2, y: 288 + 167.314 / 2 };
const S2_CORE_HALF = 167.314 / 2;
const S2_CORE_RX = 50;

function lerpPt(a, b, t) {
	return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/**
 * Exit on the rounded square (rx=50), not the AABB.
 * Near corners the AABB overshoots outside the visible squircle — that was
 * why the lower-right stump looked like it started outside the core.
 */
function squareExit(ux, uy) {
	const half = S2_CORE_HALF;
	const r = S2_CORE_RX;
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
		// Ray from square center (inside corner circle) → first positive hit on circle
		const b = -2 * (ux * cornerOx + uy * cornerOy);
		const c = cornerOx * cornerOx + cornerOy * cornerOy - r * r;
		const disc = Math.max(0, b * b - 4 * c);
		const sqrt = Math.sqrt(disc);
		const t1 = (-b - sqrt) / 2;
		const t2 = (-b + sqrt) / 2;
		const candidates = [t1, t2].filter((v) => v > 0);
		t = candidates.length ? Math.min(...candidates) : tBox;
	}

	return {
		x: S2_CORE_CENTER.x + ux * t,
		y: S2_CORE_CENTER.y + uy * t
	};
}

/**
 * Build a perfectly colinear tendril pair (core ↔ ball) along the center-to-center axis.
 * Scene02 leaves a mid gap; Scene03 meets at the midpoint.
 * Scene04 stem is also colinear: exit on left-core right edge → ball left surface.
 */
function buildColinearTendril(blob, orderExitY) {
	const dx = blob.home.cx - S2_CORE_CENTER.x;
	const dy = blob.home.cy - S2_CORE_CENTER.y;
	const len = Math.hypot(dx, dy) || 1;
	const ux = dx / len;
	const uy = dy / len;

	const coreFrom = squareExit(ux, uy);
	const ballFrom = {
		x: blob.home.cx - ux * blob.home.r,
		y: blob.home.cy - uy * blob.home.r
	};
	const meet = lerpPt(coreFrom, ballFrom, 0.5);
	// Each side grows ~38% of the span → ~24% gap remains in scene 02
	const coreCall = lerpPt(coreFrom, ballFrom, 0.38);
	const ballCall = lerpPt(coreFrom, ballFrom, 0.62);

	const leftCoreRight = 150 + 167.314;
	const orderY = orderExitY ?? blob.order.cy;
	const orderFrom = { x: leftCoreRight, y: orderY };
	const orderTo = {
		x: blob.order.cx - blob.order.r,
		y: blob.order.cy
	};

	return { coreFrom, ballFrom, coreCall, ballCall, meet, orderFrom, orderTo };
}

const S2_PIN_GAP = 103.657;
const S2_EXIT_GAP = 61.657;

const S2_BLOBS = [
	{ home: { cx: 443.2, cy: 119.2, r: 59.5 }, order: { cx: 478, cy: S2_CORE_CENTER.y - S2_PIN_GAP, r: 42 } },
	// Middle pin shares the square’s vertical center so the stem is perfectly horizontal
	{ home: { cx: 247.2, cy: 645.2, r: 59.5 }, order: { cx: 478, cy: S2_CORE_CENTER.y, r: 42 } },
	{ home: { cx: 499.2, cy: 512.2, r: 43 }, order: { cx: 478, cy: S2_CORE_CENTER.y + S2_PIN_GAP, r: 42 } }
];

const S2 = {
	core: {
		center: { x: 267, y: 288, w: 167.314, h: 167.314, rx: 50 },
		left: { x: 150, y: 288, w: 167.314, h: 167.314, rx: 50 }
	},
	blobs: S2_BLOBS,
	softOpacity: [0.3, 0.2, 0.2, 0.2, 0.2],
	// Staggered exits mirrored around the square centerline
	tendrils: [
		buildColinearTendril(S2_BLOBS[0], S2_CORE_CENTER.y - S2_EXIT_GAP),
		buildColinearTendril(S2_BLOBS[1], S2_CORE_CENTER.y),
		buildColinearTendril(S2_BLOBS[2], S2_CORE_CENTER.y + S2_EXIT_GAP)
	],
	stroke: {
		call: 3.5,
		connect: 8,
		order: 8
	}
};

/**
 * Nested focus / converge (index 2)
 * Continues from Signal grid end: 3 branches → retract → merge → mark
 */
const S3_MID_Y = S2_CORE_CENTER.y;
const S3_PIN_GAP = S2_PIN_GAP;
const S3_EXIT_GAP = S2_EXIT_GAP;

const S3 = {
	core: { x: 150, y: 288, w: 167.314, h: 167.314, rx: 50 },
	balls: [
		{
			full: { cx: 478, cy: S3_MID_Y - S3_PIN_GAP, r: 42 },
			pale: { cx: 478, cy: S3_MID_Y - S3_PIN_GAP, r: 28 }
		},
		{ full: { cx: 478, cy: S3_MID_Y, r: 42 }, pale: { cx: 478, cy: S3_MID_Y, r: 42 } },
		{
			full: { cx: 478, cy: S3_MID_Y + S3_PIN_GAP, r: 42 },
			pale: { cx: 478, cy: S3_MID_Y + S3_PIN_GAP, r: 28 }
		}
	],
	links: [
		{
			from: { x: 317.314, y: S3_MID_Y - S3_EXIT_GAP },
			to: { x: 436, y: S3_MID_Y - S3_PIN_GAP },
			stub: { x: 340, y: S3_MID_Y - 55 }
		},
		{
			from: { x: 317.314, y: S3_MID_Y },
			to: { x: 436, y: S3_MID_Y },
			stub: { x: 340, y: S3_MID_Y }
		},
		{
			from: { x: 317.314, y: S3_MID_Y + S3_EXIT_GAP },
			to: { x: 436, y: S3_MID_Y + S3_PIN_GAP },
			stub: { x: 340, y: S3_MID_Y + 55 }
		}
	],
	mark: {
		midX: (317.314 + 436) / 2,
		midY: S3_MID_Y,
		budH: 16,
		tickH: 104,
		width: 10
	},
	stroke: {
		full: 8,
		thin: 6,
		stub: 7
	}
};

/**
 * Linked path / orbit (index 3)
 * Continues from Nested focus end: settle → reveal ellipse → bud → travel
 */
const S4 = {
	core: { x: 150, y: 288, w: 167.314, h: 167.314, rx: 50 },
	ball: { cx: 478, cy: S3_MID_Y, r: 42 },
	link: {
		from: { x: 317.314, y: S3_MID_Y },
		to: { x: 436, y: S3_MID_Y },
		stroke: 6
	},
	mark: {
		midX: S3.mark.midX,
		midY: S3_MID_Y,
		tickH: 104,
		budH: 14,
		width: 10
	},
	orbit: {
		cx: 351,
		cy: S3_MID_Y,
		rx: 301.7,
		ry: 189.15,
		stroke: 3.1,
		// Scene02 starts oversized (beyond frame), then radii settle in from all sides
		revealRx: 586,
		revealRy: 367
	},
	seed: {
		lozenge: { rx: 18, ry: 12 },
		circle: { r: 19 }
	}
};

function orbitPoint(angle) {
	return {
		x: S4.orbit.cx + S4.orbit.rx * Math.cos(angle),
		y: S4.orbit.cy + S4.orbit.ry * Math.sin(angle)
	};
}

const FRAME_HOLD = 0.45;
const ACC_EASE = 'power3.out';
const ACC_DUR = 0.45;

const items = Array.from(document.querySelectorAll('.acc-item'));
const morphBase = document.querySelector('#morph-base');
const morphAccent = document.querySelector('#morph-accent');
const morphGap = document.querySelector('#morph-gap');
const visualObject = document.querySelector('#visual-object');

const storyMetaball = document.querySelector('#story-metaball');
const storySignal = document.querySelector('#story-signal');
const storyConverge = document.querySelector('#story-converge');
const storyOrbit = document.querySelector('#story-orbit');
const storyMorph = document.querySelector('#story-morph');

const gooGroup = document.querySelector('#goo-group');
const metaCore = document.querySelector('#meta-core');
const softDots = document.querySelector('#soft-dots');
const gooBlur = document.querySelector('#goo feGaussianBlur');
const blobEls = [0, 1, 2, 3].map((i) => document.querySelector(`#blob-${i}`));

const s2Core = document.querySelector('#s2-core');
const s2Soft = document.querySelector('#s2-soft');
const s2BlobEls = [0, 1, 2].map((i) => document.querySelector(`#s2-blob-${i}`));
const s2CoreTendrilEls = [0, 1, 2].map((i) => document.querySelector(`#s2-t${i}`));
const s2BallTendrilEls = [0, 1, 2].map((i) => document.querySelector(`#s2-b${i}`));
const s2FloatEls = () => Array.from(document.querySelectorAll('#story-signal .s2-float'));

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

let activeIndex = -1;
let visualIndex = -1;
let morphTl = null;
let s2FloatTl = null;
let transitionTl = null;
let transitionGen = 0;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const gooState = { blur: 16 };

const HANDOFF_DUR = 0.55;
const CROSSFADE_DUR = 0.4;
const SETTLE_DUR = 0.65;

const BOARD_KEYS = ['form', 'signal', 'converge', 'orbit'];

function killMorph() {
	if (morphTl) {
		morphTl.kill();
		morphTl = null;
	}
	killSignalFloat();
}

function killTransition() {
	if (transitionTl) {
		transitionTl.kill();
		transitionTl = null;
	}
}

function killSignalFloat() {
	if (s2FloatTl) {
		s2FloatTl.kill();
		s2FloatTl = null;
	}
	s2FloatEls().forEach((el) => gsap.set(el, { y: 0 }));
}

function setGooBlur(value, group = gooGroup, state = gooState) {
	state.blur = value;
	if (gooBlur) gooBlur.setAttribute('stdDeviation', String(Math.max(0, value)));
	if (group) {
		if (value < 0.5) group.removeAttribute('filter');
		else group.setAttribute('filter', 'url(#goo)');
	}
}

function boardEl(index) {
	return [storyMetaball, storySignal, storyConverge, storyOrbit][index] || null;
}

function setLayerActive(el, on, opacity = on ? 1 : 0) {
	if (!el) return;
	el.classList.toggle('is-active', on);
	const vis = on || opacity > 0.01 ? 'visible' : 'hidden';
	el.style.visibility = vis;
	el.setAttribute('visibility', vis);
	gsap.set(el, { opacity });
}

function showLayer(mode) {
	const layers = {
		form: storyMetaball,
		signal: storySignal,
		converge: storyConverge,
		orbit: storyOrbit,
		morph: storyMorph
	};

	Object.entries(layers).forEach(([key, el]) => {
		if (!el) return;
		setLayerActive(el, key === mode, key === mode ? 1 : 0);
	});
}

/** Instant pose for handoff / jump landing. pose: 'start' | 'end' */
function snapBoard(index, pose) {
	if (index === 0) {
		if (pose === 'start') {
			resetMetaballScene();
			return;
		}
		setGooBlur(0, gooGroup, gooState);
		setCore(CORE.rest);
		blobEls.forEach((el, i) => setBlob(el, BLOBS[i].released, ORANGE));
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
		s2FloatEls().forEach((el) => gsap.set(el, { y: 0 }));
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
		gsap.set(s4Orbit, {
			opacity: 1,
			attr: {
				cx: S4.orbit.cx,
				cy: S4.orbit.cy,
				rx: S4.orbit.rx,
				ry: S4.orbit.ry,
				'stroke-width': S4.orbit.stroke
			}
		});
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
					onUpdate: () => setGooBlur(gooState.blur, gooGroup, gooState)
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
					onUpdate: () => setGooBlur(gooState.blur, gooGroup, gooState)
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
		s2FloatEls().forEach((el) => gsap.set(el, { y: 0 }));
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
				tl.to(
					el,
					{
						attr: {
							x1: t.orderFrom.x,
							y1: t.orderFrom.y,
							x2: t.orderTo.x,
							y2: t.orderTo.y,
							'stroke-width': S2.stroke.order
						},
						duration
					},
					0
				);
			});
			s2BallTendrilEls.forEach((el, i) => {
				const t = S2.tendrils[i];
				tl.to(
					el,
					{
						attr: {
							x1: t.ballFrom.x,
							y1: t.ballFrom.y,
							x2: t.ballFrom.x,
							y2: t.ballFrom.y,
							'stroke-width': 0
						},
						duration: duration * 0.5
					},
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
					el,
					{
						attr: {
							x1: t.coreFrom.x,
							y1: t.coreFrom.y,
							x2: t.coreFrom.x,
							y2: t.coreFrom.y,
							'stroke-width': 0
						},
						duration: duration * 0.55
					},
					0
				);
			});
			s2BallTendrilEls.forEach((el, i) => {
				const t = S2.tendrils[i];
				tl.to(
					el,
					{
						attr: {
							x1: t.ballFrom.x,
							y1: t.ballFrom.y,
							x2: t.ballFrom.x,
							y2: t.ballFrom.y,
							'stroke-width': 0
						},
						duration: duration * 0.45
					},
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
					s3LinkEls[i],
					{ attr: { x2: L.from.x, y2: L.from.y, 'stroke-width': 0 }, opacity: 0, duration },
					0
				);
				tl.to(s3BallEls[i], { opacity: 0, duration }, 0);
			});
			tl.to(s3BallEls[1], { fill: DARK, duration }, 0);
			tl.to(s3LinkEls[1], { attr: { 'stroke-width': S3.stroke.thin }, opacity: 1, duration }, 0);
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
			tl.to(s3BallEls[1], { fill: ORANGE, duration }, 0);
			[0, 1, 2].forEach((i) => {
				const L = S3.links[i];
				const B = S3.balls[i].full;
				tl.to(
					s3LinkEls[i],
					{
						attr: {
							x1: L.from.x,
							y1: L.from.y,
							x2: L.to.x,
							y2: L.to.y,
							'stroke-width': S3.stroke.full
						},
						opacity: 1,
						duration
					},
					0
				);
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
		toEl.style.visibility = 'visible';
		toEl.setAttribute('visibility', 'visible');
		toEl.classList.add('is-active');
		gsap.set(toEl, { opacity: 0 });
		tl.to(toEl, { opacity: 1, duration, ease: 'power2.inOut' }, 0);
	}
	if (fromEl) {
		tl.to(
			fromEl,
			{
				opacity: 0,
				duration,
				ease: 'power2.inOut',
				onComplete: () => {
					fromEl.classList.remove('is-active');
					fromEl.style.visibility = 'hidden';
					fromEl.setAttribute('visibility', 'hidden');
					gsap.set(fromEl, { opacity: 1 });
				}
			},
			0
		);
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

	const finishPlay = (prepared) => {
		if (gen !== transitionGen) return;
		transitionTl = null;
		visualIndex = toIndex;
		playStoryboard(toIndex, { prepared, skipPunch: true });
	};

	if (reducedMotion || fromIndex < 0) {
		showLayer(BOARD_KEYS[toIndex]);
		finishPlay(false);
		return;
	}

	const fromEl = boardEl(fromIndex);
	const toEl = boardEl(toIndex);
	const delta = toIndex - fromIndex;
	const adjacent = Math.abs(delta) === 1;

	// Ensure outgoing layer is visible if a prior fade was interrupted
	if (fromEl) setLayerActive(fromEl, true, 1);

	transitionTl = gsap.timeline({
		onComplete: () => finishPlay(true)
	});

	if (adjacent && delta === 1) {
		// Forward handoff: from → end, to @ start
		transitionTl.add(tweenBoard(fromIndex, 'end', HANDOFF_DUR));
		transitionTl.call(() => {
			snapBoard(toIndex, 'start');
			setLayerActive(toEl, true, 0);
		});
		transitionTl.add(crossfadeLayers(fromEl, toEl, CROSSFADE_DUR));
		return;
	}

	if (adjacent && delta === -1) {
		// Back handoff: from → start, land on to @ end, settle to start, then play
		transitionTl.add(tweenBoard(fromIndex, 'start', HANDOFF_DUR));
		transitionTl.call(() => {
			snapBoard(toIndex, 'end');
			setLayerActive(toEl, true, 0);
		});
		transitionTl.add(crossfadeLayers(fromEl, toEl, CROSSFADE_DUR));
		transitionTl.add(tweenBoard(toIndex, 'start', SETTLE_DUR));
		return;
	}

	// Jump / skip: soft dissolve into destination start
	transitionTl.to(fromEl, { opacity: 0, duration: CROSSFADE_DUR, ease: 'power2.in' });
	transitionTl.call(() => {
		if (fromEl) {
			fromEl.classList.remove('is-active');
			fromEl.style.visibility = 'hidden';
			fromEl.setAttribute('visibility', 'hidden');
			gsap.set(fromEl, { opacity: 1 });
		}
		snapBoard(toIndex, 'start');
		setLayerActive(toEl, true, 0);
	});
	transitionTl.to(toEl, { opacity: 1, duration: CROSSFADE_DUR, ease: 'power2.out' });
}

function setCircle(el, state, color) {
	const props = { attr: { cx: state.cx, cy: state.cy, r: state.r } };
	if (color) props.fill = color;
	gsap.set(el, props);
}

function setCoreEl(el, state) {
	gsap.set(el, {
		attr: {
			x: state.x,
			y: state.y,
			width: state.w,
			height: state.h,
			rx: state.rx
		},
		fill: DARK
	});
}

function setBlob(el, state, color = DARK) {
	setCircle(el, state, color);
}

function setCore(state) {
	setCoreEl(metaCore, state);
}

function resetMetaballScene() {
	setGooBlur(16, gooGroup, gooState);
	setCore(CORE.rest);
	blobEls.forEach((el, i) => setBlob(el, BLOBS[i].start, DARK));
	gsap.set(softDots, { opacity: 0 });
	gsap.set(blobEls, { opacity: 1, scale: 1, transformOrigin: '50% 50%' });
}

function playMetaballStoryboard({ skipSetup = false } = {}) {
	if (!skipSetup) {
		showLayer('form');
		resetMetaballScene();
	}

	if (reducedMotion) {
		blobEls.forEach((el, i) => setBlob(el, BLOBS[i].released, ORANGE));
		setGooBlur(0, gooGroup, gooState);
		gsap.set(softDots, { opacity: 1 });
		return;
	}

	morphTl = gsap.timeline({ repeat: -1, defaults: { ease: 'power2.inOut' } });

	morphTl.to({}, { duration: 0.6 });

	morphTl.to(
		metaCore,
		{
			attr: {
				x: CORE.pinched.x,
				y: CORE.pinched.y,
				width: CORE.pinched.w,
				height: CORE.pinched.h,
				rx: CORE.pinched.rx
			},
			duration: 1.25,
			ease: 'power3.inOut'
		},
		'bulge'
	);

	blobEls.forEach((el, i) => {
		const a = BLOBS[i].attached;
		morphTl.to(el, { attr: { cx: a.cx, cy: a.cy, r: a.r }, duration: 1.25, ease: 'power3.inOut' }, 'bulge');
	});

	morphTl.to({}, { duration: 0.6 });

	const stretch = 'stretch';
	blobEls.forEach((el, i) => {
		const s = BLOBS[i].stretch;
		morphTl.to(el, { attr: { cx: s.cx, cy: s.cy, r: s.r }, duration: 0.65, ease: 'power2.in' }, stretch);
	});

	morphTl.to(
		gooState,
		{ blur: 8, duration: 0.65, ease: 'power2.in', onUpdate: () => setGooBlur(gooState.blur, gooGroup, gooState) },
		stretch
	);

	const release = 'release';
	morphTl.to(
		gooState,
		{ blur: 0, duration: 0.28, ease: 'power4.in', onUpdate: () => setGooBlur(gooState.blur, gooGroup, gooState) },
		release
	);

	morphTl.to(
		metaCore,
		{
			attr: {
				x: CORE.rest.x,
				y: CORE.rest.y,
				width: CORE.rest.w,
				height: CORE.rest.h,
				rx: CORE.rest.rx
			},
			duration: 0.8,
			ease: 'power3.out'
		},
		release
	);

	blobEls.forEach((el, i) => {
		const r = BLOBS[i].released;
		morphTl.to(el, { attr: { cx: r.cx, cy: r.cy, r: r.r }, duration: 0.95, ease: 'back.out(1.2)' }, release);
		morphTl.to(el, { fill: ORANGE, duration: 0.5, ease: 'power2.out' }, 'release+=0.3');
	});

	morphTl.to(softDots, { opacity: 1, duration: 0.55, ease: 'power2.out' }, 'release+=0.4');
	morphTl.to({}, { duration: 0.9 });
	morphTl.to(softDots, { opacity: 0, duration: 0.35, ease: 'power2.in' });

	morphTl.to(
		gooState,
		{ blur: 16, duration: 0.22, onUpdate: () => setGooBlur(gooState.blur, gooGroup, gooState) },
		'reabsorb'
	);

	blobEls.forEach((el, i) => {
		const s = BLOBS[i].start;
		morphTl.to(
			el,
			{ attr: { cx: s.cx, cy: s.cy, r: s.r }, fill: DARK, duration: 0.95, ease: 'power3.inOut' },
			'reabsorb'
		);
	});

	morphTl.to(
		metaCore,
		{
			attr: {
				x: CORE.rest.x,
				y: CORE.rest.y,
				width: CORE.rest.w,
				height: CORE.rest.h,
				rx: CORE.rest.rx
			},
			duration: 0.95,
			ease: 'power3.inOut'
		},
		'reabsorb'
	);
}

function setTendril(el, from, to, width) {
	gsap.set(el, {
		attr: {
			x1: from.x,
			y1: from.y,
			x2: to.x,
			y2: to.y,
			'stroke-width': width
		}
	});
}

function setSoftOpacities(values) {
	if (!s2Soft) return;
	s2Soft.querySelectorAll('circle').forEach((el, i) => {
		gsap.set(el, { opacity: values[i] ?? 0.2 });
	});
}

function startSignalFloat() {
	killSignalFloat();
	if (reducedMotion) return;

	s2FloatTl = gsap.timeline();
	s2FloatEls().forEach((el) => {
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
	s2FloatEls().forEach((el) => gsap.to(el, { y: 0, duration: 0.35, ease: 'power2.out' }));
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
	s2FloatEls().forEach((el) => gsap.set(el, { y: 0 }));
}

/**
 * Scene01 disperse → Scene02 mutual reach → Scene03 tips meet → Scene04 stacked exits
 */
function playSignalStoryboard({ skipSetup = false } = {}) {
	if (!skipSetup) {
		showLayer('signal');
		resetSignalScene();
	}

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

	morphTl = gsap.timeline({
		repeat: -1,
		defaults: { ease: 'power2.inOut' },
		onRepeat: () => {
			startSignalFloat();
		}
	});

	// —— Scene 01: dispersion hold ——
	morphTl.to({}, { duration: 1.1 });

	// —— Scene 01 → 02: stumps grow from core AND from each ball (gap remains) ——
	const call = 'call';
	morphTl.call(pauseSignalFloat, null, call);

	s2CoreTendrilEls.forEach((el, i) => {
		const t = S2.tendrils[i];
		morphTl.fromTo(
			el,
			{
				attr: {
					x1: t.coreFrom.x,
					y1: t.coreFrom.y,
					x2: t.coreFrom.x,
					y2: t.coreFrom.y,
					'stroke-width': 0
				}
			},
			{
				attr: {
					x1: t.coreFrom.x,
					y1: t.coreFrom.y,
					x2: t.coreCall.x,
					y2: t.coreCall.y,
					'stroke-width': S2.stroke.call
				},
				duration: 0.9,
				ease: 'power3.out'
			},
			call
		);
	});

	s2BallTendrilEls.forEach((el, i) => {
		const t = S2.tendrils[i];
		morphTl.fromTo(
			el,
			{
				attr: {
					x1: t.ballFrom.x,
					y1: t.ballFrom.y,
					x2: t.ballFrom.x,
					y2: t.ballFrom.y,
					'stroke-width': 0
				}
			},
			{
				attr: {
					x1: t.ballFrom.x,
					y1: t.ballFrom.y,
					x2: t.ballCall.x,
					y2: t.ballCall.y,
					'stroke-width': S2.stroke.call
				},
				duration: 0.9,
				ease: 'power3.out'
			},
			call
		);
	});

	// Soft echoes start fading (as in reference scene 02)
	morphTl.to(s2Soft.querySelectorAll('circle'), { opacity: 0.08, duration: 0.9, ease: 'power2.out' }, call);

	morphTl.to({}, { duration: 0.65 });

	// —— Scene 02 → 03: tips meet + thicken into continuous stems ——
	const connect = 'connect';
	s2CoreTendrilEls.forEach((el, i) => {
		const t = S2.tendrils[i];
		morphTl.to(
			el,
			{
				attr: {
					x2: t.meet.x,
					y2: t.meet.y,
					'stroke-width': S2.stroke.connect
				},
				duration: 0.8,
				ease: 'power3.inOut'
			},
			connect
		);
	});

	s2BallTendrilEls.forEach((el, i) => {
		const t = S2.tendrils[i];
		morphTl.to(
			el,
			{
				attr: {
					x2: t.meet.x,
					y2: t.meet.y,
					'stroke-width': S2.stroke.connect
				},
				duration: 0.8,
				ease: 'power3.inOut'
			},
			connect
		);
	});

	// Unify into one stem: core extends to ball surface, ball stump collapses
	morphTl.addLabel('unify', 'connect+=0.55');
	s2CoreTendrilEls.forEach((el, i) => {
		const t = S2.tendrils[i];
		morphTl.to(
			el,
			{
				attr: {
					x2: t.ballFrom.x,
					y2: t.ballFrom.y,
					'stroke-width': S2.stroke.connect
				},
				duration: 0.35,
				ease: 'power2.out'
			},
			'unify'
		);
	});
	s2BallTendrilEls.forEach((el, i) => {
		const t = S2.tendrils[i];
		morphTl.to(
			el,
			{
				attr: {
					x2: t.ballFrom.x,
					y2: t.ballFrom.y,
					'stroke-width': 0
				},
				duration: 0.3,
				ease: 'power2.in'
			},
			'unify'
		);
	});

	morphTl.to(s2Soft.querySelectorAll('circle'), { opacity: 0, duration: 0.7, ease: 'power2.out' }, connect);
	morphTl.to(s2Soft, { opacity: 0, duration: 0.7, ease: 'power2.out' }, connect);

	morphTl.to({}, { duration: 0.7 });

	// —— Scene 03 → 04: core left, balls stack, stems from staggered exits ——
	const order = 'order';
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
			duration: 1.2,
			ease: 'power3.inOut'
		},
		order
	);

	s2BlobEls.forEach((el, i) => {
		const b = S2.blobs[i].order;
		morphTl.to(el, { attr: { cx: b.cx, cy: b.cy, r: b.r }, duration: 1.2, ease: 'power3.inOut' }, order);
	});

	s2CoreTendrilEls.forEach((el, i) => {
		const t = S2.tendrils[i];
		morphTl.to(
			el,
			{
				attr: {
					x1: t.orderFrom.x,
					y1: t.orderFrom.y,
					x2: t.orderTo.x,
					y2: t.orderTo.y,
					'stroke-width': S2.stroke.order
				},
				duration: 1.2,
				ease: 'power3.inOut'
			},
			order
		);
	});

	morphTl.to({}, { duration: 1.0 });

	// —— Loop back to dispersion ——
	const reset = 'reset';
	s2CoreTendrilEls.forEach((el, i) => {
		const t = S2.tendrils[i];
		morphTl.to(
			el,
			{
				attr: {
					x1: t.coreFrom.x,
					y1: t.coreFrom.y,
					x2: t.coreFrom.x,
					y2: t.coreFrom.y,
					'stroke-width': 0
				},
				duration: 0.55,
				ease: 'power2.in'
			},
			reset
		);
	});
	s2BallTendrilEls.forEach((el, i) => {
		const t = S2.tendrils[i];
		morphTl.to(
			el,
			{
				attr: {
					x1: t.ballFrom.x,
					y1: t.ballFrom.y,
					x2: t.ballFrom.x,
					y2: t.ballFrom.y,
					'stroke-width': 0
				},
				duration: 0.4,
				ease: 'power2.in'
			},
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

function setMark(height, opacity = 1) {
	const { midX, midY, width } = S3.mark;
	gsap.set(s3Mark, {
		attr: {
			x: midX - width / 2,
			y: midY - height / 2,
			width,
			height,
			rx: width / 2
		},
		opacity,
		fill: ORANGE
	});
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
 * Scene01 three branches → Scene02 retract top/bot → Scene03 merge + bud → Scene04 tick mark
 */
function playConvergeStoryboard({ skipSetup = false } = {}) {
	if (!skipSetup) {
		showLayer('converge');
		resetConvergeScene();
	}

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

	morphTl = gsap.timeline({ repeat: -1, defaults: { ease: 'power2.inOut' } });

	// —— Scene 01 hold: three-pronged connector ——
	morphTl.to({}, { duration: 0.85 });

	// —— Scene 01 → 02: top & bottom retract; balls desaturate + shrink ——
	const retract = 'retract';
	[0, 2].forEach((i) => {
		const L = S3.links[i];
		const pale = S3.balls[i].pale;
		morphTl.to(
			s3LinkEls[i],
			{
				attr: {
					x2: L.stub.x,
					y2: L.stub.y,
					'stroke-width': S3.stroke.stub
				},
				duration: 1.05,
				ease: 'power3.inOut'
			},
			retract
		);
		morphTl.to(
			s3BallEls[i],
			{
				attr: { cx: pale.cx, cy: pale.cy, r: pale.r },
				fill: ORANGE,
				opacity: 0.2,
				duration: 1.05,
				ease: 'power3.inOut'
			},
			retract
		);
	});

	morphTl.to({}, { duration: 0.55 });

	// —— Scene 02 → 03: pale branches vanish; mid ball settles dark; bud appears ——
	const merge = 'merge';
	[0, 2].forEach((i) => {
		const L = S3.links[i];
		morphTl.to(
			s3LinkEls[i],
			{
				attr: { x2: L.from.x, y2: L.from.y, 'stroke-width': 0 },
				opacity: 0,
				duration: 0.55,
				ease: 'power2.in'
			},
			merge
		);
		morphTl.to(s3BallEls[i], { opacity: 0, duration: 0.55, ease: 'power2.in' }, merge);
	});

	morphTl.to(s3BallEls[1], { fill: DARK, duration: 0.85, ease: 'power2.inOut' }, merge);

	morphTl.to(
		s3Mark,
		{
			attr: {
				x: S3.mark.midX - S3.mark.width / 2,
				y: S3.mark.midY - S3.mark.budH / 2,
				width: S3.mark.width,
				height: S3.mark.budH,
				rx: S3.mark.width / 2
			},
			opacity: 1,
			duration: 0.7,
			ease: 'back.out(1.5)'
		},
		'merge+=0.2'
	);

	morphTl.to({}, { duration: 0.55 });

	// —— Scene 03 → 04: bud snap-opens into vertical tick; line thins ——
	const mark = 'mark';
	morphTl.to(
		s3Mark,
		{
			attr: {
				y: S3.mark.midY - S3.mark.tickH / 2,
				height: S3.mark.tickH
			},
			duration: 0.45,
			ease: 'back.out(1.7)'
		},
		mark
	);
	morphTl.to(
		s3LinkEls[1],
		{ attr: { 'stroke-width': S3.stroke.thin }, duration: 0.45, ease: 'power2.out' },
		mark
	);

	morphTl.to({}, { duration: 1.0 });

	// —— Loop back to three orange branches ——
	const reset = 'reset';
	morphTl.to(s3Mark, { opacity: 0, attr: { height: 0, y: S3.mark.midY }, duration: 0.35, ease: 'power2.in' }, reset);

	morphTl.to(s3BallEls[1], { fill: ORANGE, duration: 0.55, ease: 'power2.out' }, reset);

	[0, 1, 2].forEach((i) => {
		const L = S3.links[i];
		const B = S3.balls[i].full;
		morphTl.to(
			s3LinkEls[i],
			{
				attr: {
					x1: L.from.x,
					y1: L.from.y,
					x2: L.to.x,
					y2: L.to.y,
					'stroke-width': S3.stroke.full
				},
				opacity: 1,
				duration: 0.9,
				ease: 'power3.out'
			},
			reset
		);
		morphTl.to(
			s3BallEls[i],
			{
				attr: { cx: B.cx, cy: B.cy, r: B.r },
				opacity: 1,
				fill: ORANGE,
				duration: 0.9,
				ease: 'power3.out'
			},
			reset
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
 * Scene01 settled core → Scene02 orbit reveals / tick shrinks →
 * Scene03 seed buds at top → Scene04 travels left and keeps looping
 */
function playOrbitStoryboard({ skipSetup = false } = {}) {
	if (!skipSetup) {
		showLayer('orbit');
		resetOrbitScene();
	}

	const topAngle = -Math.PI / 2;
	const leftAngle = -Math.PI; // quarter-turn clockwise from top → left
	const seedState = { angle: topAngle };
	const ORBIT_LAPS = 4;
	const ORBIT_LAP_DUR = 2.6; // seconds per full revolution

	if (reducedMotion) {
		gsap.set(s4Orbit, {
			opacity: 1,
			attr: { rx: S4.orbit.rx, ry: S4.orbit.ry }
		});
		gsap.set(s4Mark, { opacity: 0, attr: { height: 0, y: S4.mark.midY } });
		setOrbitSeed(leftAngle, S4.seed.circle.r, S4.seed.circle.r, 1);
		return;
	}

	morphTl = gsap.timeline({ repeat: -1, defaults: { ease: 'power2.inOut' } });

	// —— Scene 01 hold ——
	morphTl.to({}, { duration: 0.8 });

	// —— Scene 01 → 02: radii shrink in from all sides (center fixed); tick shrinks ——
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
			duration: 1.35,
			ease: 'power3.out'
		},
		reveal
	);
	morphTl.to(
		s4Mark,
		{
			attr: {
				y: S4.mark.midY - S4.mark.budH / 2,
				height: S4.mark.budH
			},
			duration: 1.1,
			ease: 'power3.inOut'
		},
		reveal
	);

	morphTl.to({}, { duration: 0.45 });

	// —— Scene 02 → 03: tick dissolves; seed buds at ellipse top ——
	const bud = 'bud';
	morphTl.to(
		s4Mark,
		{
			attr: { height: 0, y: S4.mark.midY },
			opacity: 0,
			duration: 0.55,
			ease: 'power2.in'
		},
		bud
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
			duration: 0.75,
			ease: 'back.out(1.6)'
		},
		'bud+=0.15'
	);

	morphTl.to({}, { duration: 0.5 });

	// —— Scene 03 → 04: release into orbit (top → left), round into a circle ——
	const travel = 'travel';
	seedState.angle = topAngle;
	morphTl.to(
		seedState,
		{
			angle: leftAngle,
			duration: 1.5,
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
		travel
	);

	// Four slow full clockwise laps before looping the storyboard
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
		'travel+=1.5'
	);

	morphTl.to({}, { duration: 0.35 });

	// —— Loop back to settled core ——
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

function appendMorph(frame, duration) {
	morphTl.to(morphBase, {
		morphSVG: { shape: frame.base, shapeIndex: 'auto' },
		fill: frame.baseFill || DARK,
		duration
	});
	morphTl.to(
		morphAccent,
		{
			morphSVG: { shape: frame.accent, shapeIndex: 'auto' },
			opacity: frame.accentOpacity ?? 1,
			fill: frame.accentFill || ORANGE,
			duration
		},
		'<'
	);
	morphTl.to(
		morphGap,
		{
			morphSVG: { shape: frame.gap, shapeIndex: 'auto' },
			opacity: frame.gapOpacity ?? 0,
			fill: frame.gapFill || ORANGE,
			duration
		},
		'<'
	);
}

function startFrameLoop(boardIndex) {
	if (activeIndex !== boardIndex || reducedMotion) return;
	const board = STORYBOARDS[boardIndex];
	if (!board) return;

	const frames = board.frames;
	const stepDur = 0.8;

	morphTl = gsap.timeline({
		defaults: { ease: 'expo.inOut' },
		repeat: -1
	});

	for (let i = 1; i <= frames.length; i++) {
		const frame = frames[i % frames.length];
		morphTl.to({}, { duration: FRAME_HOLD });
		appendMorph(frame, stepDur);
	}
}

function playStoryboard(index, { prepared = false, skipPunch = false } = {}) {
	if (index < 0 || index >= items.length) return;

	killMorph();
	visualIndex = index;

	if (!reducedMotion && visualObject && !skipPunch) {
		gsap.fromTo(
			visualObject,
			{ scale: 0.96, opacity: 0.75 },
			{ scale: 1, opacity: 1, duration: 0.5, ease: 'power2.out' }
		);
	}

	const opts = { skipSetup: prepared };

	if (index === 0) {
		playMetaballStoryboard(opts);
		return;
	}

	if (index === 1) {
		playSignalStoryboard(opts);
		return;
	}

	if (index === 2) {
		playConvergeStoryboard(opts);
		return;
	}

	if (index === 3) {
		playOrbitStoryboard(opts);
		return;
	}

	showLayer('morph');
	const board = STORYBOARDS[index];
	if (!board) return;
	const enterDur = reducedMotion ? 0.01 : 0.85;

	morphTl = gsap.timeline({
		defaults: { ease: 'expo.inOut' },
		onComplete: () => startFrameLoop(index)
	});

	appendMorph(board.frames[0], enterDur);
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
