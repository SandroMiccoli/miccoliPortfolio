(function (root) {
	const cat = root.SynthCategories.generator;

	root.SynthRegistry.register({
		type: 'gradient',
		name: 'Gradient',
		category: 'generator',
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Draws a color ramp. Linear, Radial, or Sweep. Angle turns it. Position slides the midpoint. Spread tightens or stretches the blend. After another operator, Blending Mode composites it with the previous image.',
		implemented: true,
		defaults: {
			kind: 'linear',
			angle: 90,
			position: 0.5,
			spread: 1,
			colorA: '#000000',
			colorB: '#FFFFFF',
			blendMode: 'normal'
		},
		presets: [
			{ id: 'horizon', name: 'Horizon', parameters: { kind: 'linear', angle: 90, position: 0.5, spread: 1, colorA: '#000000', colorB: '#FFFFFF', blendMode: 'normal' } },
			{ id: 'spot', name: 'Spot', parameters: { kind: 'radial', angle: 0, position: 0.15, spread: 0.45, colorA: '#FFFFFF', colorB: '#000000', blendMode: 'normal' } },
			{ id: 'sweep', name: 'Sweep', parameters: { kind: 'sweep', angle: 0, position: 0.5, spread: 1, colorA: '#1A0A00', colorB: '#FFE6B8', blendMode: 'normal' } },
			{ id: 'soft', name: 'Soft', parameters: { kind: 'linear', angle: 12, position: 0.42, spread: 1.4, colorA: '#141418', colorB: '#C8C8D2', blendMode: 'normal' } }
		],
		params: [
			{
				key: 'kind',
				label: 'Kind',
				kind: 'enum',
				options: [
					{ id: 'linear', label: 'Linear' },
					{ id: 'radial', label: 'Radial' },
					{ id: 'sweep', label: 'Sweep' }
				]
			},
			{ key: 'angle', label: 'Angle', kind: 'range', min: 0, max: 360, step: 1, unit: '°' },
			{ key: 'position', label: 'Position', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'spread', label: 'Spread', kind: 'range', min: 0.05, max: 2, step: 0.01 },
			{ key: 'colorA', label: 'Color A', kind: 'color' },
			{ key: 'colorB', label: 'Color B', kind: 'color' },
			root.SynthBlend.param
		],
		create: function (engine) {
			const defaults = root.SynthRegistry.get('gradient').defaults;

			function num(value, fallback) {
				const n = Number(value);
				return isFinite(n) ? n : fallback;
			}

			function kindId(value) {
				if (value === 'radial') return 1;
				if (value === 'sweep') return 2;
				return 0;
			}

			return {
				process: function (ctx) {
					const p = ctx.parameters || {};
					engine.drawTo(ctx.output, engine.shaders.gradient, {
						u_input: ctx.input,
						u_hasInput: ctx.hasInput ? 1 : 0,
						u_blendMode: root.SynthBlend.toUniform(p.blendMode),
						u_kind: kindId(p.kind),
						u_angle: num(p.angle, defaults.angle),
						u_position: num(p.position, defaults.position),
						u_spread: num(p.spread, defaults.spread),
						u_colorA: root.SynthColor.toRgb(p.colorA || defaults.colorA),
						u_colorB: root.SynthColor.toRgb(p.colorB || defaults.colorB)
					});
				}
			};
		}
	});
})(window);
