(function (root) {
	const cat = root.SynthCategories.color;

	root.SynthRegistry.register({
		type: 'contrast',
		name: 'Contrast',
		category: cat.id,
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Pushes values away from Pivot, then adds Brightness. Contrast of 1 is identity. Geometry stays.',
		implemented: true,
		defaults: {
			contrast: 1,
			brightness: 0,
			pivot: 0.5
		},
		presets: [
			{ id: 'neutral', name: 'Neutral', parameters: { contrast: 1, brightness: 0, pivot: 0.5 } },
			{ id: 'hard', name: 'Hard', parameters: { contrast: 1.7, brightness: 0, pivot: 0.5 } },
			{ id: 'soft', name: 'Soft', parameters: { contrast: 0.7, brightness: 0.06, pivot: 0.5 } },
			{ id: 'crush', name: 'Crush', parameters: { contrast: 2.2, brightness: -0.04, pivot: 0.42 } }
		],
		params: [
			{ key: 'contrast', label: 'Contrast', kind: 'range', min: 0, max: 3, step: 0.01 },
			{ key: 'brightness', label: 'Brightness', kind: 'range', min: -1, max: 1, step: 0.01 },
			{ key: 'pivot', label: 'Pivot', kind: 'range', min: 0, max: 1, step: 0.01 }
		],
		create: function (engine) {
			return {
				process: function (ctx) {
					engine.drawTo(ctx.output, engine.shaders.contrast, {
						u_input: ctx.input,
						u_contrast: ctx.parameters.contrast,
						u_brightness: ctx.parameters.brightness,
						u_pivot: ctx.parameters.pivot
					});
				}
			};
		}
	});
})(window);
