(function (root) {
	const color = '#5B7FD4';

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
		help: 'Extracts bright regions of the incoming image, blurs them, and adds the glow back. Threshold picks what counts as bright.',
		implemented: true,
		defaults: {
			threshold: 0.32,
			intensity: 0.9,
			radius: 1.35
		},
		params: [
			{ key: 'threshold', label: 'Threshold', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'intensity', label: 'Intensity', kind: 'range', min: 0, max: 2.5, step: 0.01 },
			{ key: 'radius', label: 'Radius', kind: 'range', min: 0.4, max: 3, step: 0.01 }
		],
		create: function (engine) {
			let bright = null;
			let blurA = null;
			let blurB = null;
			let bw = 0;
			let bh = 0;

			function ensure(w, h) {
				const nextW = Math.max(2, Math.floor(w / 2));
				const nextH = Math.max(2, Math.floor(h / 2));
				if (bright && bw === nextW && bh === nextH) return;
				bw = nextW;
				bh = nextH;
				if (bright) bright.remove();
				if (blurA) blurA.remove();
				if (blurB) blurB.remove();
				bright = makeFbo(bw, bh);
				blurA = makeFbo(bw, bh);
				blurB = makeFbo(bw, bh);
			}

			return {
				process: function (ctx) {
					ensure(ctx.width, ctx.height);
					const radius = ctx.parameters.radius;
					const texel = [1 / bw, 1 / bh];

					engine.drawTo(bright, engine.shaders.bloomBright, {
						u_input: ctx.input,
						u_threshold: ctx.parameters.threshold
					});
					engine.drawTo(blurA, engine.shaders.bloomBlur, {
						u_input: bright,
						u_texel: texel,
						u_dir: [1, 0],
						u_radius: radius
					});
					engine.drawTo(blurB, engine.shaders.bloomBlur, {
						u_input: blurA,
						u_texel: texel,
						u_dir: [0, 1],
						u_radius: radius
					});
					engine.drawTo(blurA, engine.shaders.bloomBlur, {
						u_input: blurB,
						u_texel: texel,
						u_dir: [1, 0],
						u_radius: radius * 1.6
					});
					engine.drawTo(blurB, engine.shaders.bloomBlur, {
						u_input: blurA,
						u_texel: texel,
						u_dir: [0, 1],
						u_radius: radius * 1.6
					});
					engine.drawTo(ctx.output, engine.shaders.bloomComp, {
						u_input: ctx.input,
						u_bloom: blurB,
						u_intensity: ctx.parameters.intensity
					});
				},
				resize: function (w, h) {
					ensure(w, h);
				},
				dispose: function () {
					if (bright) bright.remove();
					if (blurA) blurA.remove();
					if (blurB) blurB.remove();
					bright = blurA = blurB = null;
				}
			};
		}
	});
})(window);
