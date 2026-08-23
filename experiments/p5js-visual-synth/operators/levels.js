(function (root) {
	const cat = root.SynthCategories.color;

	root.SynthRegistry.register({
		type: 'levels',
		name: 'Levels',
		category: cat.id,
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Remaps the incoming tonal range. In Black and In White set the input floor and ceiling. Gamma bends the midtones. Out Black and Out White set the output range. Geometry stays.',
		implemented: true,
		defaults: {
			inBlack: 0,
			inWhite: 1,
			gamma: 1,
			outBlack: 0,
			outWhite: 1
		},
		presets: [
			{ id: 'neutral', name: 'Neutral', parameters: { inBlack: 0, inWhite: 1, gamma: 1, outBlack: 0, outWhite: 1 } },
			{ id: 'crush', name: 'Crush', parameters: { inBlack: 0.12, inWhite: 0.88, gamma: 0.85, outBlack: 0, outWhite: 1 } },
			{ id: 'lift', name: 'Lift', parameters: { inBlack: 0, inWhite: 1, gamma: 1.35, outBlack: 0.08, outWhite: 0.92 } },
			{ id: 'punch', name: 'Punch', parameters: { inBlack: 0.08, inWhite: 0.94, gamma: 0.72, outBlack: 0, outWhite: 1 } }
		],
		params: [
			{ key: 'inBlack', label: 'In Black', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'inWhite', label: 'In White', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'gamma', label: 'Gamma', kind: 'range', min: 0.1, max: 3, step: 0.01 },
			{ key: 'outBlack', label: 'Out Black', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'outWhite', label: 'Out White', kind: 'range', min: 0, max: 1, step: 0.01 }
		],
		create: function (engine) {
			return {
				process: function (ctx) {
					engine.drawTo(ctx.output, engine.shaders.levels, {
						u_input: ctx.input,
						u_inBlack: ctx.parameters.inBlack,
						u_inWhite: ctx.parameters.inWhite,
						u_gamma: ctx.parameters.gamma,
						u_outBlack: ctx.parameters.outBlack,
						u_outWhite: ctx.parameters.outWhite
					});
				}
			};
		}
	});
})(window);
