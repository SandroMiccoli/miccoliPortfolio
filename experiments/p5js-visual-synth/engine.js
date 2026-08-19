(function (root) {
	const THUMB_W = 160;
	const THUMB_H = 90;

	function isWebGL2() {
		return typeof WebGL2RenderingContext !== 'undefined' &&
			drawingContext instanceof WebGL2RenderingContext;
	}

	function compile(vertSrc, fragSrc) {
		if (!isWebGL2()) {
			return createShader(
				'precision mediump float;\n' + vertSrc,
				'precision mediump float;\n' + fragSrc
			);
		}

		const vert = [
			'#version 300 es',
			'#define attribute in',
			'#define varying out',
			'precision mediump float;',
			vertSrc
		].join('\n');

		const frag = [
			'#version 300 es',
			'precision mediump float;',
			'#define varying in',
			'#define texture2D texture',
			'#define gl_FragColor outColor',
			'out vec4 outColor;',
			fragSrc
		].join('\n');

		return createShader(vert, frag);
	}

	function drawTo(target, sh, uniforms) {
		const w = target ? target.width : width;
		const h = target ? target.height : height;

		function blit() {
			ortho(-w / 2, w / 2, -h / 2, h / 2);
			shader(sh);
			sh.setUniform('u_resolution', [w, h]);
			if (uniforms) {
				Object.keys(uniforms).forEach(function (key) {
					sh.setUniform(key, uniforms[key]);
				});
			}
			noStroke();
			rectMode(CORNER);
			rect(-w / 2, -h / 2, w, h);
			resetShader();
		}

		if (target && typeof target.begin === 'function') {
			target.begin();
			resetShader();
			clear();
			blit();
			target.end();
			return;
		}
		blit();
	}

	let liveExecutor = null;
	let thumbGfx = null;
	let readCanvas = null;
	let readImage = null;
	let pixelBuf = null;
	let pixelBufLen = 0;
	const shaders = {};

	function operatorsOf(stateOrOps) {
		if (Array.isArray(stateOrOps)) return stateOrOps;
		if (root.SynthPipes) {
			const pipe = root.SynthPipes.active(stateOrOps);
			if (pipe) return pipe.operators || [];
		}
		return (stateOrOps && stateOrOps.pipeline) || [];
	}

	root.SynthEngine = {
		shaders: shaders,
		compile: compile,
		drawTo: drawTo,
		THUMB_W: THUMB_W,
		THUMB_H: THUMB_H,

		init: function () {
			const src = root.SYNTH_SHADERS;
			const vert = src.vert;
			['lines', 'noise', 'camera', 'warp', 'lookup', 'kaleidoscope', 'bloomBright', 'bloomDown', 'bloomUp', 'bloomComp', 'copy'].forEach(function (name) {
				shaders[name] = compile(vert, src[name]);
			});
			liveExecutor = root.SynthExecutor.create(root.SynthEngine);
		},

		resize: function () {
			if (liveExecutor) liveExecutor.resize();
		},

		draw: function (stateOrOps, time) {
			ortho();
			background(0);
			if (!liveExecutor) return;
			const state = Array.isArray(stateOrOps) ? null : stateOrOps;
			liveExecutor.run(operatorsOf(stateOrOps), time, {
				nowMs: Date.now(),
				clock: root.SynthClock && state ? root.SynthClock.fromState(state) : null,
				fft: root.SynthFft ? root.SynthFft.levels() : null
			});
		},

		capture: function (quality) {
			const gl = drawingContext;
			if (!gl || typeof gl.readPixels !== 'function') return '';
			const w = gl.drawingBufferWidth | 0;
			const h = gl.drawingBufferHeight | 0;
			if (w < 2 || h < 2) return '';

			const len = w * h * 4;
			if (!pixelBuf || pixelBufLen !== len) {
				pixelBuf = new Uint8Array(len);
				pixelBufLen = len;
			}

			const prevFbo = gl.getParameter(gl.FRAMEBUFFER_BINDING);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixelBuf);
			if (prevFbo) gl.bindFramebuffer(gl.FRAMEBUFFER, prevFbo);

			if (!readCanvas) readCanvas = document.createElement('canvas');
			if (readCanvas.width !== w || readCanvas.height !== h) {
				readCanvas.width = w;
				readCanvas.height = h;
				readImage = null;
			}
			const rctx = readCanvas.getContext('2d');
			if (!readImage) readImage = rctx.createImageData(w, h);
			const row = w * 4;
			for (let y = 0; y < h; y += 1) {
				readImage.data.set(
					pixelBuf.subarray((h - 1 - y) * row, (h - y) * row),
					y * row
				);
			}
			rctx.putImageData(readImage, 0, 0);

			if (!thumbGfx) {
				thumbGfx = document.createElement('canvas');
				thumbGfx.width = THUMB_W;
				thumbGfx.height = THUMB_H;
			}
			const ctx = thumbGfx.getContext('2d');
			ctx.fillStyle = '#000';
			ctx.fillRect(0, 0, THUMB_W, THUMB_H);
			ctx.drawImage(readCanvas, 0, 0, THUMB_W, THUMB_H);
			try {
				const q = quality == null ? 0.72 : quality;
				return thumbGfx.toDataURL('image/jpeg', q);
			} catch (err) {
				return '';
			}
		}
	};
})(window);
