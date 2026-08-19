(function (root) {
	const cat = root.SynthCategories.generator;

	root.SynthRegistry.register({
		type: 'lines',
		name: 'Lines',
		category: 'generator',
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Draws a procedural field of lines. Angle and spread set two directions, so you can build grids and moire. After another operator, Blending Mode composites this field with whatever came before (try Difference for a second set of lines).',
		implemented: true,
		defaults: {
			density: 18,
			thickness: 0.22,
			angle: 12,
			spread: 38,
			speed: 0.25,
			mix: 0.55,
			invert: 0,
			blendMode: 'normal'
		},
		params: [
			{ key: 'density', label: 'Density', kind: 'range', min: 2, max: 64, step: 0.5 },
			{ key: 'thickness', label: 'Thickness', kind: 'range', min: 0.04, max: 0.48, step: 0.01 },
			{ key: 'angle', label: 'Angle', kind: 'range', min: 0, max: 180, step: 1 },
			{ key: 'spread', label: 'Spread', kind: 'range', min: 0, max: 90, step: 1 },
			{ key: 'speed', label: 'Speed', kind: 'range', min: -2, max: 2, step: 0.01 },
			{ key: 'mix', label: 'Mix', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'invert', label: 'Invert', kind: 'enum', options: [
				{ id: 0, label: 'Off' },
				{ id: 1, label: 'On' }
			]},
			root.SynthBlend.param
		],
		create: function (engine) {
			return {
				process: function (ctx) {
					engine.drawTo(ctx.output, engine.shaders.lines, {
						u_input: ctx.input,
						u_hasInput: ctx.hasInput ? 1 : 0,
						u_blendMode: root.SynthBlend.toUniform(ctx.parameters.blendMode),
						u_density: ctx.parameters.density,
						u_thickness: ctx.parameters.thickness,
						u_angle: ctx.parameters.angle,
						u_spread: ctx.parameters.spread,
						u_speed: ctx.parameters.speed,
						u_mix: ctx.parameters.mix,
						u_invert: ctx.parameters.invert,
						u_time: ctx.time
					});
				}
			};
		}
	});
})(window);
