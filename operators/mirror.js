(function (root) {
	const cat = root.SynthCategories.effect;

	root.SynthRegistry.register({
		type: 'mirror',
		name: 'Mirror',
		category: cat.id,
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Folds or flips the incoming image across a line. Axis chooses Horizontal, Vertical, or Both. Fold reflects one side onto the other. Flip inverts across the line. Offset sits the fold. Angle turns it. Tile fills the frame when the fold leaves the image: Hold, Repeat, or Mirror.',
		implemented: true,
		defaults: {
			axis: 'horizontal',
			mode: 'fold',
			offsetX: 0.5,
			offsetY: 0.5,
			angle: 0,
			tile: 'hold'
		},
		presets: [
			{ id: 'split', name: 'Split', parameters: { axis: 'horizontal', mode: 'fold', offsetX: 0.5, offsetY: 0.5, angle: 0, tile: 'hold' } },
			{ id: 'floor', name: 'Floor', parameters: { axis: 'vertical', mode: 'fold', offsetX: 0.5, offsetY: 0.5, angle: 0, tile: 'hold' } },
			{ id: 'quad', name: 'Quad', parameters: { axis: 'both', mode: 'fold', offsetX: 0.5, offsetY: 0.5, angle: 0, tile: 'hold' } },
			{ id: 'flip', name: 'Flip', parameters: { axis: 'horizontal', mode: 'flip', offsetX: 0.5, offsetY: 0.5, angle: 0, tile: 'hold' } }
		],
		params: [
			{
				key: 'axis',
				label: 'Axis',
				kind: 'enum',
				options: [
					{ id: 'horizontal', label: 'Horizontal' },
					{ id: 'vertical', label: 'Vertical' },
					{ id: 'both', label: 'Both' }
				]
			},
			{
				key: 'mode',
				label: 'Mode',
				kind: 'enum',
				options: [
					{ id: 'fold', label: 'Fold' },
					{ id: 'flip', label: 'Flip' }
				]
			},
			{ key: 'offsetX', label: 'Offset X', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'offsetY', label: 'Offset Y', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'angle', label: 'Angle', kind: 'range', min: -180, max: 180, step: 0.1, unit: '°' },
			root.SynthTile.param
		],
		create: function (engine) {
			const defaults = root.SynthRegistry.get('mirror').defaults;

			function num(value, fallback) {
				const n = Number(value);
				return isFinite(n) ? n : fallback;
			}

			function axisUniform(id) {
				if (id === 'vertical') return 1;
				if (id === 'both') return 2;
				return 0;
			}

			return {
				process: function (ctx) {
					const p = ctx.parameters || {};
					engine.drawTo(ctx.output, engine.shaders.mirror, {
						u_input: ctx.input,
						u_axis: axisUniform(p.axis || defaults.axis),
						u_mode: (p.mode || defaults.mode) === 'flip' ? 1 : 0,
						u_offsetX: num(p.offsetX, defaults.offsetX),
						u_offsetY: num(p.offsetY, defaults.offsetY),
						u_angle: num(p.angle, defaults.angle),
						u_tile: root.SynthTile.resolve(p, defaults.tile)
					});
				}
			};
		}
	});
})(window);
