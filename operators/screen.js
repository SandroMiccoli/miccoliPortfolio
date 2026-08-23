(function (root) {
	const color = (root.SynthCategories && root.SynthCategories.output.color) || '#8E8E8E';

	root.SynthRegistry.register({
		type: 'screen',
		name: 'Screen',
		category: 'output',
		categoryLabel: 'Output',
		color: color,
		help: 'Presents the current image on this display. Gain is a final brightness multiplier. No extra outputs in this build.',
		implemented: true,
		defaults: {
			gain: 1
		},
		presets: [
			{ id: 'unity', name: 'Unity', parameters: { gain: 1 } },
			{ id: 'dim', name: 'Dim', parameters: { gain: 0.55 } },
			{ id: 'hot', name: 'Hot', parameters: { gain: 1.6 } }
		],
		params: [
			{ key: 'gain', label: 'Gain', kind: 'range', min: 0, max: 2, step: 0.01 }
		],
		create: function (engine) {
			return {
				process: function (ctx) {
					engine.drawTo(ctx.output, engine.shaders.copy, {
						u_input: ctx.input,
						u_gain: ctx.parameters.gain
					});
				}
			};
		}
	});
})(window);
