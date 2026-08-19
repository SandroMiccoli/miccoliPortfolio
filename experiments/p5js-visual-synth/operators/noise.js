(function (root) {
	const cat = root.SynthCategories.generator;

	root.SynthRegistry.register({
		type: 'noise',
		name: 'Noise',
		category: 'generator',
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Procedural value-noise field. Scale sets grain size, Speed drifts it, Octaves add detail, Contrast stretches the values. Output is luminance, so Color Lookup can remap it.',
		implemented: true,
		defaults: {
			scale: 4.5,
			speed: 0.18,
			octaves: 4,
			contrast: 1,
			blendMode: 'normal'
		},
		params: [
			{ key: 'scale', label: 'Scale', kind: 'range', min: 0.4, max: 24, step: 0.1 },
			{ key: 'speed', label: 'Speed', kind: 'range', min: -2, max: 2, step: 0.01 },
			{ key: 'octaves', label: 'Octaves', kind: 'int', min: 1, max: 6, step: 1 },
			{ key: 'contrast', label: 'Contrast', kind: 'range', min: 0.2, max: 3, step: 0.01 },
			root.SynthBlend.param
		],
		create: function (engine) {
			return {
				process: function (ctx) {
					engine.drawTo(ctx.output, engine.shaders.noise, {
						u_input: ctx.input,
						u_hasInput: ctx.hasInput ? 1 : 0,
						u_blendMode: root.SynthBlend.toUniform(ctx.parameters.blendMode),
						u_scale: ctx.parameters.scale,
						u_speed: ctx.parameters.speed,
						u_octaves: ctx.parameters.octaves,
						u_contrast: ctx.parameters.contrast,
						u_time: ctx.time
					});
				}
			};
		}
	});
})(window);
