(function (root) {
	const cat = root.SynthCategories.generator;

	root.SynthRegistry.register({
		type: 'noise',
		name: 'Noise',
		category: 'generator',
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Procedural value-noise field. Scale sets grain size, Translate XYZ slides the volume (Z is depth), Speed drifts it, Octaves add detail, Contrast stretches the values. Output is luminance, so Color Lookup can remap it.',
		implemented: true,
		defaults: {
			scale: 4.5,
			translateX: 0,
			translateY: 0,
			translateZ: 0,
			speed: 0.18,
			octaves: 4,
			contrast: 1,
			blendMode: 'normal'
		},
		params: [
			{ key: 'scale', label: 'Scale', kind: 'range', min: 0.4, max: 24, step: 0.1 },
			{ key: 'translate', label: 'Translate', kind: 'xyz', min: -4, max: 4, step: 0.01 },
			{ key: 'speed', label: 'Speed', kind: 'range', min: -2, max: 2, step: 0.01 },
			{ key: 'octaves', label: 'Octaves', kind: 'int', min: 1, max: 6, step: 1 },
			{ key: 'contrast', label: 'Contrast', kind: 'range', min: 0.2, max: 3, step: 0.01 },
			root.SynthBlend.param
		],
		create: function (engine) {
			const defaults = root.SynthRegistry.get('noise').defaults;

			function num(value, fallback) {
				const n = Number(value);
				return isFinite(n) ? n : fallback;
			}

			return {
				process: function (ctx) {
					const p = ctx.parameters || {};
					engine.drawTo(ctx.output, engine.shaders.noise, {
						u_input: ctx.input,
						u_hasInput: ctx.hasInput ? 1 : 0,
						u_blendMode: root.SynthBlend.toUniform(p.blendMode),
						u_scale: num(p.scale, defaults.scale),
						u_translate: [
							num(p.translateX, defaults.translateX),
							num(p.translateY, defaults.translateY),
							num(p.translateZ, defaults.translateZ)
						],
						u_speed: num(p.speed, defaults.speed),
						u_octaves: Math.max(1, num(p.octaves, defaults.octaves)),
						u_contrast: num(p.contrast, defaults.contrast),
						u_time: ctx.time
					});
				}
			};
		}
	});
})(window);
