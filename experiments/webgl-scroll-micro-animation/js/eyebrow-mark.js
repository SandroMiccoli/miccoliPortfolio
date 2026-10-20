/**
 * Scroll-driven metaball eyebrow.
 *
 * The shape only changes when the scroll position changes. `uTime` is derived
 * from that position, and `uProgress` stays below 0 so the shader plays its
 * own hold / split / hold / merge cycle. Stop scrolling and the frame freezes.
 *
 * Embed: copy this file, put a <canvas data-eyebrow> where the mark should
 * sit, then call mountEyebrowMarks({ gsap, ScrollTrigger }).
 */

export const EYEBROW_DEFAULTS = {
	pixelsPerCycle: 900,
	phase: 0,
	color: [0.965, 0.447, 0.125],
	frameScale: 3.3,
	animSpeed: 0.25,
	hold: 0.15,
	easeAmt: 0.75,
	// TouchDesigner spatial defaults. frameScale zooms them into a short,
	// wide canvas. Scale radius, spread, center, and merge together.
	radius: 0.11,
	spread: 0.14,
	centerRadius: 0.007,
	mergeK: 0.09,
};

const VERT = `#version 300 es
layout(location = 0) in vec2 aPosition;
out vec2 vUV;

void main() {
	gl_Position = vec4(aPosition, 0.0, 1.0);
	vUV = aPosition * 0.5 + 0.5;
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uProgress;
uniform float uAnimSpeed;
uniform float uHold;
uniform float uRadius;
uniform float uSpread;
uniform float uCenterRadius;
uniform float uMergeK;
uniform float uEdgeSoft;
uniform float uEaseAmt;
uniform vec2 uTranslate;
uniform vec3 uColor;

in vec2 vUV;
out vec4 fragColor;

float smin(float a, float b, float k) {
	float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
	return mix(b, a, h) - k * h * (1.0 - h);
}

float sdCircle(vec2 p, vec2 center, float radius) {
	return length(p - center) - radius;
}

float easeOutBack(float t) {
	const float c1 = 2.2;
	const float c3 = c1 + 1.0;
	float u = t - 1.0;
	return 1.0 + c3 * u * u * u + c1 * u * u;
}

float applyEase(float t) {
	t = clamp(t, 0.0, 1.0);
	float eased = easeOutBack(t);
	return mix(t, eased, clamp(uEaseAmt, 0.0, 1.0));
}

float animatedMorph(float time) {
	float speed = max(uAnimSpeed, 0.001);
	float cycle = fract(time * speed);

	float hold = clamp(uHold, 0.0, 0.45);
	float move = 0.5 - hold;

	float t;
	float goingOut;

	if (cycle < hold) {
		return 0.0;
	} else if (cycle < hold + move) {
		t = (cycle - hold) / max(move, 1e-5);
		goingOut = 1.0;
	} else if (cycle < hold + move + hold) {
		return 1.0;
	} else {
		t = (cycle - hold - move - hold) / max(move, 1e-5);
		goingOut = 0.0;
	}

	float eased = applyEase(t);
	return mix(1.0 - eased, eased, goingOut);
}

void main() {
	vec2 uv = vUV - 0.5;
	float aspect = uResolution.x / max(uResolution.y, 1.0);
	uv.x *= aspect;
	uv -= uTranslate;

	float morph;
	if (uProgress < 0.0) {
		morph = animatedMorph(uTime);
	} else {
		morph = applyEase(clamp(uProgress, 0.0, 1.0));
	}

	float t = max(morph, 0.0);
	vec2 left = mix(vec2(0.0), vec2(-uSpread, 0.0), t);
	vec2 right = mix(vec2(0.0), vec2(uSpread, 0.0), t);

	float field = smin(
		sdCircle(uv, left, uRadius),
		sdCircle(uv, right, uRadius),
		uMergeK
	);
	if (uCenterRadius > 0.0005) {
		field = smin(field, sdCircle(uv, vec2(0.0), uCenterRadius), uMergeK);
	}

	float coverage = 1.0 - smoothstep(0.0, max(uEdgeSoft, 1e-4), field);
	// Premultiplied coverage. The page shows through; there is no background plate.
	fragColor = vec4(uColor * coverage, coverage);
}
`;

function compile(gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const log = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error(log || 'Shader compile failed');
	}
	return shader;
}

function linkProgram(gl) {
	const program = gl.createProgram();
	const vs = compile(gl, gl.VERTEX_SHADER, VERT);
	const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	gl.bindAttribLocation(program, 0, 'aPosition');
	gl.linkProgram(program);
	gl.deleteShader(vs);
	gl.deleteShader(fs);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		const log = gl.getProgramInfoLog(program);
		gl.deleteProgram(program);
		throw new Error(log || 'Program link failed');
	}
	return program;
}

function uniformLocations(gl, program) {
	const names = [
		'uResolution',
		'uTime',
		'uProgress',
		'uAnimSpeed',
		'uHold',
		'uRadius',
		'uSpread',
		'uCenterRadius',
		'uMergeK',
		'uEdgeSoft',
		'uEaseAmt',
		'uTranslate',
		'uColor',
	];
	const locs = {};
	for (const name of names) {
		locs[name] = gl.getUniformLocation(program, name);
	}
	return locs;
}

export class EyebrowMark {
	constructor(canvas, options = {}) {
		this.canvas = canvas;
		this.color = options.color || EYEBROW_DEFAULTS.color;
		this.frameScale = options.frameScale || EYEBROW_DEFAULTS.frameScale;
		this.gl = canvas.getContext('webgl2', {
			alpha: true,
			premultipliedAlpha: true,
			antialias: false,
			depth: false,
			stencil: false,
			powerPreference: 'low-power',
		});
		if (!this.gl) {
			throw new Error('WebGL2 is required for the eyebrow mark.');
		}

		const gl = this.gl;
		this.program = linkProgram(gl);
		this.locs = uniformLocations(gl, this.program);

		this.vao = gl.createVertexArray();
		gl.bindVertexArray(this.vao);
		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
			gl.STATIC_DRAW
		);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
		gl.bindVertexArray(null);
		this.buffer = buffer;

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
		this.width = 0;
		this.height = 0;
	}

	resize() {
		const gl = this.gl;
		if (!gl) return false;
		const cssW = this.canvas.clientWidth;
		const cssH = this.canvas.clientHeight;
		if (cssW < 2 || cssH < 2) return false;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const width = Math.max(1, Math.round(cssW * dpr));
		const height = Math.max(1, Math.round(cssH * dpr));
		if (width === this.width && height === this.height) return false;
		this.canvas.width = width;
		this.canvas.height = height;
		this.width = width;
		this.height = height;
		this.cssHeight = cssH;
		gl.viewport(0, 0, width, height);
		return true;
	}

	/**
	 * @param {number} time shader uTime
	 * @param {number} progress shader uProgress. Below 0 plays the time cycle.
	 */
	draw(time, progress) {
		const gl = this.gl;
		if (!gl || this.width < 2 || this.height < 2) return;

		const scale = this.frameScale;
		const edge = 1.5 / Math.max(this.cssHeight || 1, 1);

		gl.useProgram(this.program);
		gl.bindVertexArray(this.vao);
		gl.uniform2f(this.locs.uResolution, this.width, this.height);
		gl.uniform1f(this.locs.uTime, time);
		gl.uniform1f(this.locs.uProgress, progress);
		gl.uniform1f(this.locs.uAnimSpeed, EYEBROW_DEFAULTS.animSpeed);
		gl.uniform1f(this.locs.uHold, EYEBROW_DEFAULTS.hold);
		gl.uniform1f(this.locs.uRadius, EYEBROW_DEFAULTS.radius * scale);
		gl.uniform1f(this.locs.uSpread, EYEBROW_DEFAULTS.spread * scale);
		gl.uniform1f(this.locs.uCenterRadius, EYEBROW_DEFAULTS.centerRadius * scale);
		gl.uniform1f(this.locs.uMergeK, EYEBROW_DEFAULTS.mergeK * scale);
		gl.uniform1f(this.locs.uEdgeSoft, edge);
		gl.uniform1f(this.locs.uEaseAmt, EYEBROW_DEFAULTS.easeAmt);
		gl.uniform2f(this.locs.uTranslate, 0, 0);
		gl.uniform3f(this.locs.uColor, this.color[0], this.color[1], this.color[2]);

		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		gl.bindVertexArray(null);
	}

	destroy() {
		const gl = this.gl;
		if (!gl) return;
		gl.deleteBuffer(this.buffer);
		gl.deleteVertexArray(this.vao);
		gl.deleteProgram(this.program);
		const lose = gl.getExtension('WEBGL_lose_context');
		if (lose) lose.loseContext();
		this.gl = null;
	}
}

function findScroller(page) {
	const lab = page.closest?.('.lab-experiment-demo');
	if (lab) return lab;

	let node = page.parentElement;
	while (node && node !== document.body && node !== document.documentElement) {
		const { overflowY } = getComputedStyle(node);
		const scrolls = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
		if (scrolls && node.scrollHeight > node.clientHeight + 2) return node;
		node = node.parentElement;
	}
	return window;
}

function resolveScroller(scroller, page) {
	if (scroller == null) return findScroller(page);
	if (scroller === window || scroller === document.body || scroller === document.documentElement) {
		return window;
	}
	if (typeof scroller === 'string') {
		const found = document.querySelector(scroller);
		if (!found) throw new Error(`Eyebrow scroller not found: ${scroller}`);
		return found;
	}
	if (scroller instanceof Element) return scroller;
	return findScroller(page);
}

function readScroll(scroller) {
	if (scroller === window) {
		return window.scrollY || document.documentElement.scrollTop || 0;
	}
	return scroller.scrollTop || 0;
}

function resolvePage(root, canvas) {
	if (root instanceof Element && root.classList.contains('page')) return root;
	const queried = root.querySelector?.('.page');
	if (queried) return queried;
	return canvas.closest('.page') || document.documentElement;
}

/**
 * Paint every matching canvas and tie uTime to scroll position.
 * Returns a function that removes the scroll trigger and the GL contexts.
 */
export function mountEyebrowMarks(options = {}) {
	const root = options.root || document;
	const selector = options.selector || '[data-eyebrow]';
	const canvases = [...root.querySelectorAll(selector)];
	if (!canvases.length) return () => {};

	const color = options.color || EYEBROW_DEFAULTS.color;
	const frameScale = options.frameScale || EYEBROW_DEFAULTS.frameScale;
	const pixelsPerCycle = Math.max(1, options.pixelsPerCycle || EYEBROW_DEFAULTS.pixelsPerCycle);
	const phase = options.phase || 0;
	const animSpeed = EYEBROW_DEFAULTS.animSpeed;
	const timeUnitsPerCycle = 1 / animSpeed;

	const marks = [];
	for (const canvas of canvases) {
		try {
			marks.push(new EyebrowMark(canvas, { color, frameScale }));
		} catch (error) {
			console.warn(error);
			for (const mark of marks) mark.destroy();
			return () => {};
		}
	}

	const page = resolvePage(root, canvases[0]);
	let scroller = resolveScroller(options.scroller, page);
	const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

	function timeForScroll() {
		if (motion.matches) return 0;
		const cycles = readScroll(scroller) / pixelsPerCycle + phase;
		return cycles * timeUnitsPerCycle;
	}

	function progressForMotion() {
		// 1 is the settled two-lobe pose. Negative progress plays uTime.
		return motion.matches ? 1 : -1;
	}

	function redraw() {
		const time = timeForScroll();
		const progress = progressForMotion();
		for (const mark of marks) {
			mark.resize();
			mark.draw(time, progress);
		}
	}

	const gsap = options.gsap || globalThis.gsap;
	const ScrollTrigger = options.ScrollTrigger || globalThis.ScrollTrigger;
	let trigger = null;

	function attachTrigger() {
		if (!gsap || !ScrollTrigger) {
			console.error('mountEyebrowMarks: pass gsap and ScrollTrigger, or load them on window before calling.');
			return;
		}
		gsap.registerPlugin(ScrollTrigger);
		if (trigger) trigger.kill();
		trigger = ScrollTrigger.create({
			trigger: page,
			scroller: scroller === window ? undefined : scroller,
			start: 0,
			end: 'max',
			onUpdate: redraw,
			onRefresh: redraw,
		});
		if (motion.matches) trigger.disable();
	}

	attachTrigger();
	redraw();

	const observer = new ResizeObserver(() => {
		redraw();
	});
	for (const mark of marks) observer.observe(mark.canvas);

	function onMotion() {
		if (!trigger) {
			redraw();
			return;
		}
		if (motion.matches) trigger.disable();
		else trigger.enable();
		redraw();
	}

	function onLoad() {
		const next = resolveScroller(options.scroller, page);
		if (next !== scroller) {
			scroller = next;
			attachTrigger();
		} else if (ScrollTrigger) {
			ScrollTrigger.refresh();
		}
		redraw();
	}

	motion.addEventListener('change', onMotion);
	window.addEventListener('load', onLoad);
	if (document.fonts?.ready) {
		document.fonts.ready.then(() => {
			if (ScrollTrigger) ScrollTrigger.refresh();
			redraw();
		}).catch(() => {});
	}

	return function destroy() {
		motion.removeEventListener('change', onMotion);
		window.removeEventListener('load', onLoad);
		observer.disconnect();
		if (trigger) trigger.kill();
		for (const mark of marks) mark.destroy();
	};
}
