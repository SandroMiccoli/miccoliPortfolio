(function (root) {
	const color = (root.SynthCategories && root.SynthCategories.effect.color) || '#4AAE72';

	root.SynthRegistry.register({
		type: 'warp',
		name: 'Warp',
		category: 'effect',
		categoryLabel: 'Effects / Filters',
		color: color,
		help: 'Warps the incoming texture in space. It does not generate its own image. Amount and frequency control how far UVs travel.',
		implemented: true,
		defaults: {
			amount: 0.22,
			frequency: 4.5,
			speed: 0.4,
			detail: 0.65
		},
		params: [
			{ key: 'amount', label: 'Amount', kind: 'range', min: 0, max: 1.2, step: 0.01 },
			{ key: 'frequency', label: 'Frequency', kind: 'range', min: 0.5, max: 18, step: 0.1 },
			{ key: 'speed', label: 'Speed', kind: 'range', min: -2, max: 2, step: 0.01 },
			{ key: 'detail', label: 'Detail', kind: 'range', min: 0, max: 1, step: 0.01 }
		],
		create: function (engine) {
			return {
				process: function (ctx) {
					engine.drawTo(ctx.output, engine.shaders.warp, {
						u_input: ctx.input,
						u_amount: ctx.parameters.amount,
						u_frequency: ctx.parameters.frequency,
						u_speed: ctx.parameters.speed,
						u_detail: ctx.parameters.detail,
						u_time: ctx.time
					});
				}
			};
		}
	});
})(window);
