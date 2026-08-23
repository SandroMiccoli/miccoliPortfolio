(function (root) {
	const cat = root.SynthCategories.effect;

	root.SynthRegistry.register({
		type: 'glitch',
		name: 'Glitch',
		category: cat.id,
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Tears the incoming image into quantized strips, then smears them along a spectrum. Amount is how far a strip travels. Speed is how many times per second the tear pattern jumps; 0 holds. Narrowness packs more strips. Blockiness makes the FBM rectangular. Sparsity is how few strips stay alive: low is a full tear, high leaves only the strongest hits. Chroma is the rainbow smear. Angle turns the slice axis. Tile fills the frame when a strip leaves the image: Hold, Repeat, or Mirror.',
		implemented: true,
		defaults: {
			amount: 0.18,
			speed: 2,
			narrowness: 4,
			blockiness: 2,
			sparsity: 6,
			chroma: 1,
			angle: 0,
			tile: 'hold'
		},
		presets: [
			{ id: 'soft', name: 'Soft', parameters: { amount: 0.08, speed: 1.1, narrowness: 3, blockiness: 1.2, sparsity: 8, chroma: 0.4, angle: 0, tile: 'hold' } },
			{ id: 'heavy', name: 'Heavy', parameters: { amount: 0.42, speed: 2.8, narrowness: 6, blockiness: 3, sparsity: 3.4, chroma: 1.15, angle: 0, tile: 'hold' } },
			{ id: 'slice', name: 'Slice', parameters: { amount: 0.26, speed: 1.4, narrowness: 2.2, blockiness: 5, sparsity: 5, chroma: 0.12, angle: 0, tile: 'hold' } },
			{ id: 'broken', name: 'Broken', parameters: { amount: 0.8, speed: 6.2, narrowness: 10, blockiness: 5.5, sparsity: 2, chroma: 1.55, angle: 8, tile: 'repeat' } }
		],
		params: [
			{ key: 'amount', label: 'Amount', kind: 'range', min: 0, max: 1.2, step: 0.01 },
			{ key: 'speed', label: 'Speed', kind: 'range', min: 0, max: 8, step: 0.01 },
			{ key: 'narrowness', label: 'Narrowness', kind: 'range', min: 0.5, max: 16, step: 0.1 },
			{ key: 'blockiness', label: 'Blockiness', kind: 'range', min: 0, max: 8, step: 0.01 },
			{ key: 'sparsity', label: 'Sparsity', kind: 'range', min: 1, max: 16, step: 0.1 },
			{ key: 'chroma', label: 'Chroma', kind: 'range', min: 0, max: 2, step: 0.01 },
			{ key: 'angle', label: 'Angle', kind: 'range', min: 0, max: 360, step: 1, unit: '°' },
			root.SynthTile.param
		],
		create: function (engine) {
			const defaults = root.SynthRegistry.get('glitch').defaults;

			function num(value, fallback) {
				const n = Number(value);
				return isFinite(n) ? n : fallback;
			}

			return {
				process: function (ctx) {
					const p = ctx.parameters || {};
					engine.drawTo(ctx.output, engine.shaders.glitch, {
						u_input: ctx.input,
						u_amount: num(p.amount, defaults.amount),
						u_speed: num(p.speed, defaults.speed),
						u_narrowness: num(p.narrowness, defaults.narrowness),
						u_blockiness: num(p.blockiness, defaults.blockiness),
						u_sparsity: num(p.sparsity, defaults.sparsity),
						u_chroma: num(p.chroma, defaults.chroma),
						u_angle: num(p.angle, defaults.angle),
						u_tile: root.SynthTile.resolve(p, defaults.tile),
						u_time: ctx.time
					});
				}
			};
		}
	});
})(window);
