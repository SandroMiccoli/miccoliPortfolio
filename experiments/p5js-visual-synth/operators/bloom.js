(function (root) {
	const color = '#5B7FD4';
	const LEVELS = 4;

	function makeFbo(w, h) {
		const opts = {
			width: Math.max(2, Math.floor(w)),
			height: Math.max(2, Math.floor(h)),
			density: 1,
			antialias: false
		};
		if (typeof LINEAR !== 'undefined') opts.textureFiltering = LINEAR;
		return createFramebuffer(opts);
	}

	root.SynthRegistry.register({
		type: 'bloom',
		name: 'Bloom',
		category: 'effect',
		categoryLabel: 'Effects / Filters',
		color: color,
		help: 'Extracts bright regions, blurs them through a dual-filter pyramid, and composites the glow back. Threshold picks what counts as bright. Radius spreads the haze. Intensity is the mix.',
		implemented: true,
		defaults: {
			threshold: 0.32,
			intensity: 0.9,
			radius: 1.35
		},
		presets: [
			{ id: 'soft', name: 'Soft', parameters: { threshold: 0.45, intensity: 0.4, radius: 1.8 } },
			{ id: 'heavy', name: 'Heavy', parameters: { threshold: 0.18, intensity: 1.8, radius: 2.2 } },
			{ id: 'tight', name: 'Tight', parameters: { threshold: 0.4, intensity: 1.1, radius: 0.6 } }
		],
		params: [
			{ key: 'threshold', label: 'Threshold', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'intensity', label: 'Intensity', kind: 'range', min: 0, max: 2.5, step: 0.01 },
			{ key: 'radius', label: 'Radius', kind: 'range', min: 0.4, max: 3, step: 0.01 }
		],
		create: function (engine) {
			let mips = [];
			let srcW = 0;
			let srcH = 0;

			function clearMips() {
				mips.forEach(function (fbo) {
					if (fbo) fbo.remove();
				});
				mips = [];
			}

			function ensure(w, h) {
				w = Math.max(2, Math.floor(w));
				h = Math.max(2, Math.floor(h));
				if (mips.length === LEVELS && srcW === w && srcH === h) return;
				srcW = w;
				srcH = h;
				clearMips();
				let mw = w;
				let mh = h;
				for (let i = 0; i < LEVELS; i += 1) {
					mw = Math.max(2, Math.floor(mw / 2));
					mh = Math.max(2, Math.floor(mh / 2));
					mips.push(makeFbo(mw, mh));
				}
			}

			return {
				process: function (ctx) {
					ensure(ctx.width, ctx.height);
					const offset = ctx.parameters.radius;

					engine.drawTo(mips[0], engine.shaders.bloomBright, {
						u_input: ctx.input,
						u_threshold: ctx.parameters.threshold
					});

					for (let i = 1; i < mips.length; i += 1) {
						const src = mips[i - 1];
						engine.drawTo(mips[i], engine.shaders.bloomDown, {
							u_input: src,
							u_texel: [1 / src.width, 1 / src.height],
							u_offset: offset
						});
					}

					for (let i = mips.length - 2; i >= 0; i -= 1) {
						const src = mips[i + 1];
						engine.drawTo(mips[i], engine.shaders.bloomUp, {
							u_input: src,
							u_texel: [1 / mips[i].width, 1 / mips[i].height],
							u_offset: offset
						});
					}

					engine.drawTo(ctx.output, engine.shaders.bloomComp, {
						u_input: ctx.input,
						u_bloom: mips[0],
						u_intensity: ctx.parameters.intensity
					});
				},
				resize: function (w, h) {
					ensure(w, h);
				},
				dispose: function () {
					clearMips();
					srcW = srcH = 0;
				}
			};
		}
	});
})(window);
