(function (root) {
	const cat = root.SynthCategories.color;

	root.SynthRegistry.register({
		type: 'hsv',
		name: 'HSV',
		category: cat.id,
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Grades the incoming color in HSV. Hue rotates the wheel. Saturation and Value scale chroma and brightness. Geometry stays. Neutral is 0 / 1 / 1.',
		implemented: true,
		defaults: {
			hue: 0,
			saturation: 1,
			value: 1
		},
		presets: [
			{ id: 'neutral', name: 'Neutral', parameters: { hue: 0, saturation: 1, value: 1 } },
			{ id: 'warm', name: 'Warm', parameters: { hue: 18, saturation: 1.25, value: 1.05 } },
			{ id: 'cool', name: 'Cool', parameters: { hue: -22, saturation: 0.9, value: 1 } },
			{ id: 'fade', name: 'Fade', parameters: { hue: 0, saturation: 0.35, value: 0.9 } }
		],
		params: [
			{ key: 'hue', label: 'Hue', kind: 'range', min: -180, max: 180, step: 1, unit: '°' },
			{ key: 'saturation', label: 'Saturation', kind: 'range', min: 0, max: 2, step: 0.01 },
			{ key: 'value', label: 'Value', kind: 'range', min: 0, max: 2, step: 0.01 }
		],
		create: function (engine) {
			return {
				process: function (ctx) {
					engine.drawTo(ctx.output, engine.shaders.hsv, {
						u_input: ctx.input,
						u_hue: ctx.parameters.hue,
						u_saturation: ctx.parameters.saturation,
						u_value: ctx.parameters.value
					});
				}
			};
		}
	});
})(window);
