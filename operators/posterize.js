(function (root) {
	const cat = root.SynthCategories.color;

	root.SynthRegistry.register({
		type: 'posterize',
		name: 'Posterize',
		category: cat.id,
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Cuts the incoming color into a few steps. Levels is how many values remain. RGB quantizes each channel. Luma quantizes brightness and keeps the hue. Mix blends back to the source. Geometry stays.',
		implemented: true,
		defaults: {
			levels: 6,
			mix: 1,
			mode: 'rgb'
		},
		presets: [
			{ id: 'duo', name: 'Duo', parameters: { levels: 2, mix: 1, mode: 'rgb' } },
			{ id: 'comic', name: 'Comic', parameters: { levels: 4, mix: 1, mode: 'rgb' } },
			{ id: 'soft', name: 'Soft', parameters: { levels: 8, mix: 1, mode: 'rgb' } },
			{ id: 'crush', name: 'Crush', parameters: { levels: 3, mix: 1, mode: 'luma' } }
		],
		params: [
			{ key: 'levels', label: 'Levels', kind: 'int', min: 2, max: 16, step: 1 },
			{ key: 'mix', label: 'Mix', kind: 'range', min: 0, max: 1, step: 0.01 },
			{
				key: 'mode',
				label: 'Mode',
				kind: 'enum',
				options: [
					{ id: 'rgb', label: 'RGB' },
					{ id: 'luma', label: 'Luma' }
				]
			}
		],
		create: function (engine) {
			const defaults = root.SynthRegistry.get('posterize').defaults;

			function num(value, fallback) {
				const n = Number(value);
				return isFinite(n) ? n : fallback;
			}

			return {
				process: function (ctx) {
					const p = ctx.parameters || {};
					engine.drawTo(ctx.output, engine.shaders.posterize, {
						u_input: ctx.input,
						u_levels: num(p.levels, defaults.levels),
						u_mix: num(p.mix, defaults.mix),
						u_mode: p.mode === 'luma' ? 1 : 0
					});
				}
			};
		}
	});
})(window);
