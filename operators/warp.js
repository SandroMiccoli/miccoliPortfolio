(function (root) {
	const cat = root.SynthCategories.effect;

	root.SynthRegistry.register({
		type: 'warp',
		name: 'Warp',
		category: cat.id,
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Warps the incoming texture in space. It does not generate its own image. Amount and frequency control how far UVs travel. Tile decides what happens when those UVs leave the frame: Hold clamps the edge, Repeat tiles, Mirror reflects.',
		implemented: true,
		defaults: {
			amount: 0.22,
			frequency: 4.5,
			speed: 0.4,
			detail: 0.65,
			tile: 'hold'
		},
		presets: [
			{ id: 'soft', name: 'Soft', parameters: { amount: 0.12, frequency: 2.2, speed: 0.15, detail: 0.3, tile: 'hold' } },
			{ id: 'heavy', name: 'Heavy', parameters: { amount: 0.85, frequency: 6.5, speed: 0.55, detail: 0.85, tile: 'repeat' } },
			{ id: 'liquid', name: 'Liquid', parameters: { amount: 0.45, frequency: 1.8, speed: 0.8, detail: 0.4, tile: 'repeat' } },
			{ id: 'broken', name: 'Broken', parameters: { amount: 1.1, frequency: 14, speed: 1.4, detail: 1, tile: 'mirror' } }
		],
		params: [
			{ key: 'amount', label: 'Amount', kind: 'range', min: 0, max: 1.2, step: 0.01 },
			{ key: 'frequency', label: 'Frequency', kind: 'range', min: 0.5, max: 18, step: 0.1 },
			{ key: 'speed', label: 'Speed', kind: 'range', min: -2, max: 2, step: 0.01 },
			{ key: 'detail', label: 'Detail', kind: 'range', min: 0, max: 1, step: 0.01 },
			root.SynthTile.param
		],
		create: function (engine) {
			const defaults = root.SynthRegistry.get('warp').defaults;

			function num(value, fallback) {
				const n = Number(value);
				return isFinite(n) ? n : fallback;
			}

			return {
				process: function (ctx) {
					const p = ctx.parameters || {};
					engine.drawTo(ctx.output, engine.shaders.warp, {
						u_input: ctx.input,
						u_amount: num(p.amount, defaults.amount),
						u_frequency: num(p.frequency, defaults.frequency),
						u_speed: num(p.speed, defaults.speed),
						u_detail: num(p.detail, defaults.detail),
						u_tile: root.SynthTile.resolve(p, defaults.tile),
						u_time: ctx.time
					});
				}
			};
		}
	});
})(window);
