(function (root) {
	const cat = root.SynthCategories.color;

	root.SynthRegistry.register({
		type: 'invert',
		name: 'Invert',
		category: cat.id,
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Inverts the incoming color. RGB is a photographic negative. Luma flips brightness and keeps the hue. Hue rotates to the complementary. Amount is dry to wet. Geometry stays.',
		implemented: true,
		defaults: {
			amount: 1,
			mode: 'rgb'
		},
		presets: [
			{ id: 'full', name: 'Full', parameters: { amount: 1, mode: 'rgb' } },
			{ id: 'half', name: 'Half', parameters: { amount: 0.5, mode: 'rgb' } },
			{ id: 'night', name: 'Night', parameters: { amount: 1, mode: 'luma' } },
			{ id: 'complement', name: 'Complement', parameters: { amount: 1, mode: 'hue' } }
		],
		params: [
			{ key: 'amount', label: 'Amount', kind: 'range', min: 0, max: 1, step: 0.01 },
			{
				key: 'mode',
				label: 'Mode',
				kind: 'enum',
				options: [
					{ id: 'rgb', label: 'RGB' },
					{ id: 'luma', label: 'Luma' },
					{ id: 'hue', label: 'Hue' }
				]
			}
		],
		create: function (engine) {
			const defaults = root.SynthRegistry.get('invert').defaults;

			function num(value, fallback) {
				const n = Number(value);
				return isFinite(n) ? n : fallback;
			}

			function modeUniform(id) {
				if (id === 'luma') return 1;
				if (id === 'hue') return 2;
				return 0;
			}

			return {
				process: function (ctx) {
					const p = ctx.parameters || {};
					engine.drawTo(ctx.output, engine.shaders.invert, {
						u_input: ctx.input,
						u_amount: num(p.amount, defaults.amount),
						u_mode: modeUniform(p.mode || defaults.mode)
					});
				}
			};
		}
	});
})(window);
