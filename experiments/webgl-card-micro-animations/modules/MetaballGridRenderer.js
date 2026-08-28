/**
 * One WebGL2 program, one backing canvas.
 * Each card canvas is a 2D blit target so we never spin up extra GPU contexts.
 * Unique per card: uSeed, uFaceAreaPos, uFaceAreaScale.
 */

import { FRAG, VERT } from './metaballGridShader.js';

const SHARED = {
	uGridScale: 18,
	uDensity: 0.05,
	uDotRadius: 0.08,
	uMinDotDist: 0.6,
	uMergeK: 0.23,
	uMoveChance: 0.28,
	uMoveRadius: 0.08,
	uMoveDist: 1.1,
	uSpeed: 1.55,
	uFaceInside: 0,
	uDebugFaceArea: 0,
	uColor: [1, 1, 1],
	uMargin: [0.05, 0.05, 0.05, 0.05],
};

const MAX_EDGE = 420;
const MAX_DPR = 1.25;

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

function link(gl, vertSrc, fragSrc) {
	const vs = compile(gl, gl.VERTEX_SHADER, vertSrc);
	const fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc);
	const program = gl.createProgram();
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
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

function readNumber(el, name, fallback) {
	const value = parseFloat(el.dataset[name]);
	return Number.isFinite(value) ? value : fallback;
}

function bufferSize(cssWidth, cssHeight) {
	const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
	const w = Math.max(1, cssWidth * dpr);
	const h = Math.max(1, cssHeight * dpr);
	const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
	return [Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale))];
}

export class MetaballGridRenderer {
	constructor() {
		this.glCanvas = document.createElement('canvas');
		this.gl = this.glCanvas.getContext('webgl2', {
			alpha: true,
			premultipliedAlpha: false,
			preserveDrawingBuffer: true,
			antialias: false,
			depth: false,
			stencil: false,
			powerPreference: 'high-performance',
		});
		if (!this.gl) {
			this.ok = false;
			return;
		}

		const gl = this.gl;
		this.ok = true;
		this.cards = [];
		this.raf = 0;
		try {
			this.program = link(gl, VERT, FRAG);
		} catch (error) {
			console.error(error);
			this.ok = false;
			return;
		}
		gl.useProgram(this.program);

		this.quad = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
			gl.STATIC_DRAW,
		);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

		this.uniforms = {};
		const names = [
			'uResolution',
			'uTime',
			'uGridScale',
			'uSeed',
			'uDensity',
			'uDotRadius',
			'uMinDotDist',
			'uMergeK',
			'uMoveChance',
			'uMoveRadius',
			'uMoveDist',
			'uSpeed',
			'uFaceInside',
			'uDebugFaceArea',
			'uColor',
			'uMargin',
			'uFaceAreaPos',
			'uFaceAreaScale',
		];
		for (const name of names) {
			this.uniforms[name] = gl.getUniformLocation(this.program, name);
		}

		gl.disable(gl.DEPTH_TEST);
		gl.disable(gl.BLEND);
		gl.clearColor(0, 0, 0, 0);

		this._bindShared();
	}

	_bindQuad() {
		const gl = this.gl;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
	}

	_ensureSize(w, h) {
		if (this.glCanvas.width === w && this.glCanvas.height === h) {
			this.gl.viewport(0, 0, w, h);
			return;
		}
		this.glCanvas.width = w;
		this.glCanvas.height = h;
		this.gl.useProgram(this.program);
		this._bindQuad();
		this.gl.viewport(0, 0, w, h);
		this._bindShared();
	}

	_bindShared() {
		const gl = this.gl;
		const u = this.uniforms;
		gl.uniform1f(u.uGridScale, SHARED.uGridScale);
		gl.uniform1f(u.uDensity, SHARED.uDensity);
		gl.uniform1f(u.uDotRadius, SHARED.uDotRadius);
		gl.uniform1f(u.uMinDotDist, SHARED.uMinDotDist);
		gl.uniform1f(u.uMergeK, SHARED.uMergeK);
		gl.uniform1f(u.uMoveChance, SHARED.uMoveChance);
		gl.uniform1f(u.uMoveRadius, SHARED.uMoveRadius);
		gl.uniform1f(u.uMoveDist, SHARED.uMoveDist);
		gl.uniform1f(u.uSpeed, SHARED.uSpeed);
		gl.uniform1f(u.uFaceInside, SHARED.uFaceInside);
		gl.uniform1f(u.uDebugFaceArea, SHARED.uDebugFaceArea);
		gl.uniform3f(u.uColor, SHARED.uColor[0], SHARED.uColor[1], SHARED.uColor[2]);
		gl.uniform4f(
			u.uMargin,
			SHARED.uMargin[0],
			SHARED.uMargin[1],
			SHARED.uMargin[2],
			SHARED.uMargin[3],
		);
	}

	attach(cardEl) {
		if (!this.ok) return;
		const canvas = cardEl.querySelector('.person-card__gl');
		const media = cardEl.querySelector('.person-card__media');
		if (!canvas || !media) return;

		const ctx2d = canvas.getContext('2d', { alpha: true });
		const card = {
			el: cardEl,
			media,
			canvas,
			ctx2d,
			visible: true,
			seed: readNumber(cardEl, 'seed', 1.23),
			facePos: [readNumber(cardEl, 'faceX', 0.5), readNumber(cardEl, 'faceY', 0.66)],
			faceScale: [readNumber(cardEl, 'faceW', 0.4), readNumber(cardEl, 'faceH', 0.46)],
		};
		this.cards.push(card);

		const fit = () => {
			const rect = media.getBoundingClientRect();
			const [w, h] = bufferSize(rect.width, rect.height);
			if (canvas.width !== w) canvas.width = w;
			if (canvas.height !== h) canvas.height = h;
		};
		fit();
		card.ro = new ResizeObserver(fit);
		card.ro.observe(media);
	}

	observe(root) {
		if (!this.ok) return;
		this.io = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const card = this.cards.find((item) => item.el === entry.target);
					if (card) card.visible = entry.isIntersecting && entry.intersectionRatio > 0;
				}
			},
			{ root: root || null, threshold: 0.02, rootMargin: '8%' },
		);
		for (const card of this.cards) this.io.observe(card.el);
	}

	start() {
		if (!this.ok || this.raf) return;
		const tick = () => {
			this.raf = requestAnimationFrame(tick);
			if (document.hidden) return;
			this._draw(performance.now() * 0.001);
		};
		this.raf = requestAnimationFrame(tick);
	}

	pause() {
		cancelAnimationFrame(this.raf);
		this.raf = 0;
	}

	stop() {
		this.pause();
		this.io?.disconnect();
		for (const card of this.cards) card.ro?.disconnect();
	}

	_draw(time) {
		const gl = this.gl;
		const visible = this.cards.filter((card) => card.visible && card.canvas.width > 1);
		if (!visible.length) return;

		let lastW = 0;
		let lastH = 0;

		for (const card of visible) {
			const w = card.canvas.width;
			const h = card.canvas.height;
			if (w !== lastW || h !== lastH) {
				this._ensureSize(w, h);
				gl.uniform2f(this.uniforms.uResolution, w, h);
				lastW = w;
				lastH = h;
			}

			gl.uniform1f(this.uniforms.uTime, time);
			gl.uniform1f(this.uniforms.uSeed, card.seed);
			gl.uniform2f(this.uniforms.uFaceAreaPos, card.facePos[0], card.facePos[1]);
			gl.uniform2f(this.uniforms.uFaceAreaScale, card.faceScale[0], card.faceScale[1]);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.drawArrays(gl.TRIANGLES, 0, 6);

			const ctx = card.ctx2d;
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, w, h);
			ctx.setTransform(1, 0, 0, -1, 0, h);
			ctx.drawImage(this.glCanvas, 0, 0, w, h);
			ctx.setTransform(1, 0, 0, 1, 0, 0);
		}
	}
}
