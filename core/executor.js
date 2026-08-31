(function (root) {
	function makeFbo(w, h) {
		const opts = { density: 1, antialias: false };
		if (w && h) {
			opts.width = Math.max(2, Math.floor(w));
			opts.height = Math.max(2, Math.floor(h));
		}
		if (typeof LINEAR !== 'undefined') opts.textureFiltering = LINEAR;
		return createFramebuffer(opts);
	}

	root.SynthExecutor = {
		create: function (engine) {
			let ping = null;
			let pong = null;
			let dummy = null;
			let bufW = 0;
			let bufH = 0;
			const runtimes = {};

			function ensureBuffers(w, h) {
				w = Math.max(2, Math.floor(w || width));
				h = Math.max(2, Math.floor(h || height));
				if (ping && bufW === w && bufH === h) return;
				bufW = w;
				bufH = h;
				if (ping && ping.remove) ping.remove();
				if (pong && pong.remove) pong.remove();
				ping = makeFbo(w, h);
				pong = makeFbo(w, h);
				if (!dummy) {
					dummy = makeFbo(2, 2);
					dummy.begin();
					background(0);
					dummy.end();
				}
			}

			function runtimeFor(op) {
				if (runtimes[op.id]) return runtimes[op.id];
				const def = root.SynthRegistry.get(op.type);
				if (!def || !def.implemented || typeof def.create !== 'function') return null;
				const rt = def.create(engine);
				runtimes[op.id] = rt;
				return rt;
			}

			function prune(pipeline) {
				const live = {};
				(pipeline || []).forEach(function (op) {
					live[op.id] = true;
				});
				Object.keys(runtimes).forEach(function (id) {
					if (live[id]) return;
					if (runtimes[id] && runtimes[id].dispose) runtimes[id].dispose();
					delete runtimes[id];
				});
			}

			function copyTo(tex, dest, gain) {
				engine.drawTo(dest, engine.shaders.copy, {
					u_input: tex,
					u_gain: gain == null ? 1 : gain
				});
			}

			return {
				resize: function () {
					bufW = 0;
					bufH = 0;
					Object.keys(runtimes).forEach(function (id) {
						if (runtimes[id] && runtimes[id].resize) {
							runtimes[id].resize(width, height);
						}
					});
				},

				run: function (pipeline, time, opts) {
					opts = opts || {};
					const w = opts.width || width;
					const h = opts.height || height;
					const dest = Object.prototype.hasOwnProperty.call(opts, 'dest') ? opts.dest : null;

					ensureBuffers(w, h);
					prune(pipeline);

					let read = null;
					let writePing = true;
					let drewScreen = false;

					(pipeline || []).forEach(function (op) {
						if (op.bypassed) return;
						const rt = runtimeFor(op);
						if (!rt || !rt.process) return;

						const isScreen = op.type === 'screen';
						const output = isScreen ? dest : (writePing ? ping : pong);
						if (!isScreen) writePing = !writePing;

						const ctx = {
							time: time,
							nowMs: opts.nowMs != null ? opts.nowMs : Date.now(),
							clock: opts.clock,
							fft: opts.fft
						};
						const parameters = root.SynthModulate
							? root.SynthModulate.resolveOp(op, ctx)
							: (op.parameters || {});

						rt.process({
							input: read || dummy,
							hasInput: !!read,
							output: output,
							parameters: parameters,
							time: time,
							width: w,
							height: h,
							engine: engine,
							allowCamera: opts.allowCamera !== false
						});

						if (isScreen) {
							drewScreen = true;
						} else {
							read = output;
						}
					});

					if (!drewScreen) {
						if (read) copyTo(read, dest, 1);
						else if (!dest) background(0);
					}
				},

				dispose: function () {
					Object.keys(runtimes).forEach(function (id) {
						if (runtimes[id] && runtimes[id].dispose) runtimes[id].dispose();
					});
				}
			};
		}
	};
})(window);
