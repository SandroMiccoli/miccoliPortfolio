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
		type: 'blur',
		name: 'Blur',
		category: 'effect',
		categoryLabel: 'Effects / Filters',
		color: color,
		help: 'A two-pass Gaussian blur on the incoming image. Radius is the spread. Mix is dry to wet. Unlike Bloom, it blurs everything, not only the bright parts.',
		implemented: true,
		defaults: {
			radius: 1.6,
			mix: 1
		},
		presets: [
			{ id: 'soft', name: 'Soft', parameters: { radius: 1.2, mix: 0.7 } },
			{ id: 'heavy', name: 'Heavy', parameters: { radius: 4.5, mix: 1 } },
			{ id: 'fog', name: 'Fog', parameters: { radius: 6.2, mix: 0.85 } },
			{ id: 'kiss', name: 'Kiss', parameters: { radius: 0.55, mix: 0.4 } }
		],
		params: [
			{ key: 'radius', label: 'Radius', kind: 'range', min: 0.2, max: 8, step: 0.01 },
			{ key: 'mix', label: 'Mix', kind: 'range', min: 0, max: 1, step: 0.01 }
		],
		create: function (engine) {
			const defaults = root.SynthRegistry.get('blur').defaults;
			let temp = null;
			let srcW = 0;
			let srcH = 0;

			function num(value, fallback) {
				const n = Number(value);
				return isFinite(n) ? n : fallback;
			}

			function ensure(w, h) {
				w = Math.max(2, Math.floor(w));
				h = Math.max(2, Math.floor(h));
				if (temp && srcW === w && srcH === h) return;
				srcW = w;
				srcH = h;
				if (temp && temp.remove) temp.remove();
				temp = makeFbo(w, h);
			}

			return {
				process: function (ctx) {
					const p = ctx.parameters || {};
					const mix = num(p.mix, defaults.mix);
					const radius = num(p.radius, defaults.radius);
					if (mix <= 0.001) {
						engine.drawTo(ctx.output, engine.shaders.copy, {
							u_input: ctx.input,
							u_gain: 1
						});
						return;
					}
					ensure(ctx.width, ctx.height);
					engine.drawTo(temp, engine.shaders.blur, {
						u_input: ctx.input,
						u_dry: ctx.input,
						u_axis: [1, 0],
						u_radius: radius,
						u_mix: mix,
						u_final: 0
					});
					engine.drawTo(ctx.output, engine.shaders.blur, {
						u_input: temp,
						u_dry: ctx.input,
						u_axis: [0, 1],
						u_radius: radius,
						u_mix: mix,
						u_final: 1
					});
				},
				resize: function (w, h) {
					ensure(w, h);
				},
				dispose: function () {
					if (temp && temp.remove) temp.remove();
					temp = null;
					srcW = srcH = 0;
				}
			};
		}
	});
})(window);
