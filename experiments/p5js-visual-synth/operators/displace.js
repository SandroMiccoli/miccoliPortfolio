(function (root) {
	const color = (root.SynthCategories && root.SynthCategories.effect.color) || '#4AAE72';

	root.SynthRegistry.register({
		type: 'displace',
		name: 'Displace',
		category: 'effect',
		categoryLabel: 'Effects / Filters',
		color: color,
		help: 'Offsets the incoming image using itself as a map. Luma slides pixels along Angle. Chroma uses red and green as X and Y. Center is the value that stays still. Wrap repeats the edges instead of clamping them.',
		implemented: true,
		defaults: {
			amount: 0.16,
			angle: 0,
			center: 0.5,
			mode: 'luma',
			wrap: 0
		},
		presets: [
			{ id: 'soft', name: 'Soft', parameters: { amount: 0.08, angle: 0, center: 0.5, mode: 'luma', wrap: 0 } },
			{ id: 'heavy', name: 'Heavy', parameters: { amount: 0.48, angle: 18, center: 0.5, mode: 'luma', wrap: 0 } },
			{ id: 'melt', name: 'Melt', parameters: { amount: 0.32, angle: 90, center: 0.42, mode: 'luma', wrap: 0 } },
			{ id: 'chroma', name: 'Chroma', parameters: { amount: 0.22, angle: 0, center: 0.5, mode: 'chroma', wrap: 1 } }
		],
		params: [
			{ key: 'amount', label: 'Amount', kind: 'range', min: 0, max: 1.2, step: 0.01 },
			{ key: 'angle', label: 'Angle', kind: 'range', min: 0, max: 360, step: 1, unit: '°', visibleWhen: 'param:mode=luma' },
			{ key: 'center', label: 'Center', kind: 'range', min: 0, max: 1, step: 0.01 },
			{
				key: 'mode',
				label: 'Map',
				kind: 'enum',
				options: [
					{ id: 'luma', label: 'Luma' },
					{ id: 'chroma', label: 'Chroma' }
				]
			},
			{ key: 'wrap', label: 'Wrap', kind: 'enum', options: [
				{ id: 0, label: 'Clamp' },
				{ id: 1, label: 'Repeat' }
			]}
		],
		create: function (engine) {
			const defaults = root.SynthRegistry.get('displace').defaults;

			function num(value, fallback) {
				const n = Number(value);
				return isFinite(n) ? n : fallback;
			}

			return {
				process: function (ctx) {
					const p = ctx.parameters || {};
					engine.drawTo(ctx.output, engine.shaders.displace, {
						u_input: ctx.input,
						u_amount: num(p.amount, defaults.amount),
						u_angle: num(p.angle, defaults.angle),
						u_center: num(p.center, defaults.center),
						u_mode: p.mode === 'chroma' ? 1 : 0,
						u_wrap: num(p.wrap, defaults.wrap)
					});
				}
			};
		}
	});
})(window);
