/**
 * Direct WebGL2 draw of the paired-metaball field onto one visible canvas.
 */

import { FRAG, VERT } from './metaballPairShader.js';

const SHARED = {
	uNumPairs: 9,
	uBigRadius: 0.114,
	uSmallRadius: 0.038,
	uOrbitRadius: 0.3,
	uMergeK: 0.07,
	uEdgeSoft: 0.002,
	uTravelAmt: 1.1,
	uPulseSpeed: 0.75,
	uRotSpeed: 0.15,
	uTranslate: [0.75, 0],
	uColor: [0.956863, 0.419608, 0.101961],
	uBackground: [0, 0, 0],
};

const MAX_EDGE = 720;
const MAX_DPR = 1.5;

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

function bufferSize(cssWidth, cssHeight) {
	const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
	const w = Math.max(1, cssWidth * dpr);
	const h = Math.max(1, cssHeight * dpr);
	const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
	return [Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale))];
}

export class MetaballPairRenderer {
	constructor(canvas) {
		this.canvas = canvas;
		this.gl = canvas.getContext('webgl2', {
			alpha: true,
			premultipliedAlpha: true,
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
		this.raf = 0;
		this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
			'uNumPairs',
			'uBigRadius',
			'uSmallRadius',
			'uOrbitRadius',
			'uMergeK',
			'uEdgeSoft',
			'uTravelAmt',
			'uPulseSpeed',
			'uRotSpeed',
			'uTranslate',
			'uColor',
			'uBackground',
		];
		for (const name of names) {
			this.uniforms[name] = gl.getUniformLocation(this.program, name);
		}

		gl.disable(gl.DEPTH_TEST);
		gl.disable(gl.BLEND);
		gl.clearColor(0, 0, 0, 0);

		this._bindShared();
		this._fit();
		this.ro = new ResizeObserver(() => this._fit());
		this.ro.observe(canvas);
	}

	_bindShared() {
		const gl = this.gl;
		const u = this.uniforms;
		gl.uniform1f(u.uNumPairs, SHARED.uNumPairs);
		gl.uniform1f(u.uBigRadius, SHARED.uBigRadius);
		gl.uniform1f(u.uSmallRadius, SHARED.uSmallRadius);
		gl.uniform1f(u.uOrbitRadius, SHARED.uOrbitRadius);
		gl.uniform1f(u.uMergeK, SHARED.uMergeK);
		gl.uniform1f(u.uEdgeSoft, SHARED.uEdgeSoft);
		gl.uniform1f(u.uTravelAmt, SHARED.uTravelAmt);
		gl.uniform1f(u.uPulseSpeed, SHARED.uPulseSpeed);
		gl.uniform1f(u.uRotSpeed, SHARED.uRotSpeed);
		gl.uniform2f(u.uTranslate, SHARED.uTranslate[0], SHARED.uTranslate[1]);
		gl.uniform3f(u.uColor, SHARED.uColor[0], SHARED.uColor[1], SHARED.uColor[2]);
		gl.uniform3f(
			u.uBackground,
			SHARED.uBackground[0],
			SHARED.uBackground[1],
			SHARED.uBackground[2],
		);
	}

	_fit() {
		const rect = this.canvas.getBoundingClientRect();
		const [w, h] = bufferSize(rect.width, rect.height);
		if (this.canvas.width === w && this.canvas.height === h) {
			this.gl.viewport(0, 0, w, h);
			return;
		}
		this.canvas.width = w;
		this.canvas.height = h;
		this.gl.useProgram(this.program);
		this.gl.viewport(0, 0, w, h);
		this._bindShared();
		this.gl.uniform2f(this.uniforms.uResolution, w, h);
		if (!this.raf) this._draw(this.reduceMotion ? 0 : performance.now() * 0.001);
	}

	start() {
		if (!this.ok || this.raf) return;
		this._fit();
		if (this.reduceMotion) {
			this._draw(0);
			return;
		}
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
		this.ro?.disconnect();
	}

	_draw(time) {
		const gl = this.gl;
		gl.useProgram(this.program);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		gl.uniform2f(this.uniforms.uResolution, this.canvas.width, this.canvas.height);
		gl.uniform1f(this.uniforms.uTime, time);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}
}
