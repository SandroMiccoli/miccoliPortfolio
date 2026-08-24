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
			try {
				resetShader();
				clear();
				blit();
			} finally {
				target.end();
			}
			return;
		}
		blit();
	}

	let liveExecutor = null;
	let thumbExecutor = null;
	let thumbComp = null;
	let composition = null;
	let maskPing = null;
	let maskPong = null;
	let maskDummy = null;
	let outW = 0;
	let outH = 0;
	let thumbGfx = null;
	let readCanvas = null;
	let readImage = null;
	let pixelBuf = null;
	let pixelBufLen = 0;
	let lastThumbLuma = 0;
	const shaders = {};

	function thumbLuma(canvas) {
		if (!canvas) return 0;
		const ctx = canvas.getContext('2d');
		if (!ctx) return 0;
		let data;
		try {
			data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
		} catch (err) {
			return 0;
		}
		let sum = 0;
		let n = 0;
		for (let i = 0; i < data.length; i += 16) {
			sum += data[i] + data[i + 1] + data[i + 2];
			n += 1;
		}
		return n ? sum / (n * 765) : 0;
	}

	function makeFbo(w, h) {
		const opts = { density: 1, antialias: false };
		if (w && h) {
			opts.width = Math.max(2, Math.floor(w));
			opts.height = Math.max(2, Math.floor(h));
		}
		if (typeof LINEAR !== 'undefined') opts.textureFiltering = LINEAR;
		return createFramebuffer(opts);
	}

	function disposeFbo(fbo) {
		if (fbo && fbo.remove) fbo.remove();
	}

	function ensureOutputBuffers(w, h) {
		w = Math.max(2, Math.floor(w || width));
		h = Math.max(2, Math.floor(h || height));
		if (composition && outW === w && outH === h) return;
		outW = w;
		outH = h;
		disposeFbo(composition);
		disposeFbo(maskPing);
		disposeFbo(maskPong);
		composition = makeFbo(w, h);
		maskPing = makeFbo(w, h);
		maskPong = makeFbo(w, h);
		if (!maskDummy) {
			maskDummy = makeFbo(2, 2);
			clearFbo(maskDummy);
		}
	}

	function clearFbo(fbo) {
		if (!fbo || typeof fbo.begin !== 'function') return;
		fbo.begin();
		try {
			background(0);
		} finally {
			fbo.end();
		}
	}

	function buildMask(masks) {
		const items = root.SynthOutput ? root.SynthOutput.liveMasks(masks) : [];
		if (!items.length) return null;
		let writePing = true;
		let hasPrev = false;
		items.forEach(function (item) {
			const dest = writePing ? maskPing : maskPong;
			const prev = writePing ? maskPong : maskPing;
			drawTo(dest, shaders.maskShape, {
				u_input: hasPrev ? prev : maskDummy,
				u_hasPrev: hasPrev ? 1 : 0,
				u_shape: item.type === 'circle' ? 1 : 0,
				u_center: [item.x, item.y],
				u_size: item.type === 'circle' ? [item.r, item.r] : [item.w, item.h],
				u_feather: item.feather,
				u_invert: item.invert ? 1 : 0
			});
			hasPrev = true;
			writePing = !writePing;
		});
		return writePing ? maskPong : maskPing;
	}

	function applyOutput(state) {
		const output = root.SynthOutput
			? root.SynthOutput.fromState(state)
			: { mapping: { enabled: true, corners: { tl: { x: 0, y: 0 }, tr: { x: 1, y: 0 }, br: { x: 1, y: 1 }, bl: { x: 0, y: 1 } } }, masks: { enabled: true, invert: false, items: [] } };
		const mapping = output.mapping;
		const masks = output.masks;
		if (mapping.template) {
			drawTo(composition, shaders.testCard, {});
		}
		const maskTex = masks.enabled !== false ? buildMask(masks) : null;
		const useMap = mapping.enabled !== false;
		const corners = useMap ? mapping.corners : (root.SynthOutput && root.SynthOutput.IDENTITY);
		const identity = !useMap || (root.SynthOutput && root.SynthOutput.isIdentity(corners));

		if (identity && !maskTex) {
			drawTo(null, shaders.copy, {
				u_input: composition,
				u_gain: 1
			});
			return;
		}

		const h = root.SynthOutput
			? root.SynthOutput.destToSourceMatrix(corners)
			: [1, 0, 0, 0, 1, 0, 0, 0, 1];
		drawTo(null, shaders.cornerPin, {
			u_input: composition,
			u_mask: maskTex || composition,
			u_hasMask: maskTex ? 1 : 0,
			u_maskInvert: maskTex && masks.invert ? 1 : 0,
			u_h0: [h[0], h[1], h[2]],
			u_h1: [h[3], h[4], h[5]],
			u_h2: [h[6], h[7], h[8]]
		});
	}

	function targetPixelSize(target) {
		if (target && target.width && target.height) {
			const d = Number(target.density) > 0 ? Number(target.density) : 1;
			return {
				w: Math.max(2, Math.round(target.width * d)),
				h: Math.max(2, Math.round(target.height * d))
			};
		}
		const gl = drawingContext;
		return {
			w: (gl && gl.drawingBufferWidth) | 0,
			h: (gl && gl.drawingBufferHeight) | 0
		};
	}

	function restoreMain() {
		const gl = drawingContext;
		if (!gl) return;
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
		if (typeof ortho === 'function') ortho();
	}

	function ensureThumbComp() {
		if (!thumbComp) thumbComp = makeFbo(THUMB_W, THUMB_H);
		if (typeof thumbComp.resize === 'function') {
			if (Math.abs(thumbComp.width - THUMB_W) > 1 || Math.abs(thumbComp.height - THUMB_H) > 1) {
				thumbComp.resize(THUMB_W, THUMB_H);
			}
		}
		return thumbComp;
	}

	function readFrom(target, flipY) {
		const gl = drawingContext;
		if (!gl || typeof gl.readPixels !== 'function') return '';
		const size = targetPixelSize(target);
		let w = size.w;
		let h = size.h;
		const prevFbo = gl.getParameter(gl.FRAMEBUFFER_BINDING);
		if (target && typeof target.begin === 'function') {
			target.begin();
		} else {
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			w = gl.drawingBufferWidth | 0;
			h = gl.drawingBufferHeight | 0;
		}
		if (w < 2 || h < 2) {
			if (target && typeof target.end === 'function') target.end();
			else if (prevFbo) gl.bindFramebuffer(gl.FRAMEBUFFER, prevFbo);
			else restoreMain();
			return '';
		}

		const len = w * h * 4;
		if (!pixelBuf || pixelBufLen !== len) {
			pixelBuf = new Uint8Array(len);
			pixelBufLen = len;
		}

		gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixelBuf);
		if (target && typeof target.end === 'function') target.end();
		else if (prevFbo) gl.bindFramebuffer(gl.FRAMEBUFFER, prevFbo);
		else restoreMain();

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
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.fillStyle = '#000';
		ctx.fillRect(0, 0, THUMB_W, THUMB_H);
		if (flipY) {
			ctx.translate(0, THUMB_H);
			ctx.scale(1, -1);
		}
		ctx.drawImage(readCanvas, 0, 0, THUMB_W, THUMB_H);
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		return thumbGfx;
	}

	function operatorsOf(stateOrOps) {
		if (Array.isArray(stateOrOps)) return stateOrOps;
		if (root.SynthPipes) {
			const pipe = root.SynthPipes.output
				? root.SynthPipes.output(stateOrOps)
				: root.SynthPipes.active(stateOrOps);
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
			['lines', 'noise', 'camera', 'warp', 'lookup', 'ramp', 'hsv', 'levels', 'contrast', 'kaleidoscope', 'bloomBright', 'bloomDown', 'bloomUp', 'bloomComp', 'edge', 'copy', 'maskShape', 'cornerPin', 'testCard', 'shape', 'gradient', 'displace', 'blur', 'feedback', 'transform', 'glitch', 'tape', 'pixelate', 'posterize', 'mirror', 'tile', 'invert'].forEach(function (name) {
				shaders[name] = compile(vert, src[name]);
			});
			liveExecutor = root.SynthExecutor.create(root.SynthEngine);
			thumbExecutor = root.SynthExecutor.create(root.SynthEngine);
		},

		resize: function () {
			outW = 0;
			outH = 0;
			if (liveExecutor) liveExecutor.resize();
		},

		draw: function (stateOrOps, time) {
			restoreMain();
			ortho();
			background(0);
			if (!liveExecutor) return;
			ensureOutputBuffers(width, height);
			clearFbo(composition);
			const state = Array.isArray(stateOrOps) ? null : stateOrOps;
			liveExecutor.run(operatorsOf(stateOrOps), time, {
				dest: composition,
				nowMs: Date.now(),
				clock: root.SynthClock && state ? root.SynthClock.fromState(state) : null,
				fft: root.SynthFft ? root.SynthFft.levels() : null
			});
			applyOutput(state);
		},

		profile: function () {
			return liveExecutor && liveExecutor.profile ? liveExecutor.profile() : null;
		},

		capture: function (quality, flipY) {
			lastThumbLuma = 0;
			const gfx = readFrom(composition, !!flipY);
			restoreMain();
			if (!gfx) return '';
			lastThumbLuma = thumbLuma(gfx);
			try {
				const q = quality == null ? 0.72 : quality;
				return gfx.toDataURL('image/jpeg', q);
			} catch (err) {
				return '';
			}
		},

		captureOperators: function (operators, time, quality) {
			if (!thumbExecutor) return '';
			const dest = ensureThumbComp();
			if (!dest) return '';
			const state = root.SynthState ? root.SynthState.get() : null;
			clearFbo(dest);
			thumbExecutor.run(operators || [], time || 0, {
				dest: dest,
				width: dest.width || THUMB_W,
				height: dest.height || THUMB_H,
				nowMs: Date.now(),
				clock: root.SynthClock && state ? root.SynthClock.fromState(state) : null,
				fft: root.SynthFft ? root.SynthFft.levels() : null
			});
			lastThumbLuma = 0;
			const gfx = readFrom(dest, false);
			restoreMain();
			if (!gfx) return '';
			lastThumbLuma = thumbLuma(gfx);
			try {
				const q = quality == null ? 0.62 : quality;
				return gfx.toDataURL('image/jpeg', q);
			} catch (err) {
				return '';
			}
		},

		thumbLuma: function () {
			return lastThumbLuma;
		}
	};
})(window);
