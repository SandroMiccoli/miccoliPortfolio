(function (root) {
	const color = '#5B7FD4';

	root.SynthRegistry.register({
		type: 'edge',
		name: 'Edge',
		category: 'effect',
		categoryLabel: 'Effects / Filters',
		color: color,
		help: 'Finds luminance gradients with a Sobel kernel and turns them into outlines. Threshold hides weak edges. Radius is the sample distance. Intensity is the gain. Mix blends back to the source. Invert flips light and dark.',
		implemented: true,
		defaults: {
			threshold: 0.12,
			intensity: 1.6,
			radius: 1,
			mix: 1,
			invert: 0
		},
		params: [
			{ key: 'threshold', label: 'Threshold', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'intensity', label: 'Intensity', kind: 'range', min: 0, max: 4, step: 0.01 },
			{ key: 'radius', label: 'Radius', kind: 'range', min: 0.4, max: 4, step: 0.01 },
			{ key: 'mix', label: 'Mix', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'invert', label: 'Invert', kind: 'range', min: 0, max: 1, step: 0.01 }
		],
		create: function (engine) {
			return {
				process: function (ctx) {
					engine.drawTo(ctx.output, engine.shaders.edge, {
						u_input: ctx.input,
						u_threshold: ctx.parameters.threshold,
						u_intensity: ctx.parameters.intensity,
						u_radius: ctx.parameters.radius,
						u_mix: ctx.parameters.mix,
						u_invert: ctx.parameters.invert
					});
				}
			};
		}
	});
})(window);
