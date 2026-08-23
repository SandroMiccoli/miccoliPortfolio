(function (root) {
	const cat = root.SynthCategories.effect;

	root.SynthRegistry.register({
		type: 'tile',
		name: 'Tile',
		category: cat.id,
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Repeats the incoming image across the frame. Count X and Count Y are how many copies fit. Offset slides the grid. Angle turns it before it repeats. The Tile mode is what happens at each cell edge: Hold clamps, Repeat wraps, Mirror reflects.',
		implemented: true,
		defaults: {
			countX: 2,
			countY: 2,
			offsetX: 0,
			offsetY: 0,
			angle: 0,
			tile: 'repeat'
		},
		presets: [
			{ id: 'dual', name: 'Dual', parameters: { countX: 2, countY: 1, offsetX: 0, offsetY: 0, angle: 0, tile: 'repeat' } },
			{ id: 'grid', name: 'Grid', parameters: { countX: 3, countY: 3, offsetX: 0, offsetY: 0, angle: 0, tile: 'repeat' } },
			{ id: 'wallpaper', name: 'Wallpaper', parameters: { countX: 4, countY: 4, offsetX: 0, offsetY: 0, angle: 0, tile: 'mirror' } },
			{ id: 'strip', name: 'Strip', parameters: { countX: 1, countY: 8, offsetX: 0, offsetY: 0, angle: 0, tile: 'repeat' } }
		],
		params: [
			{ key: 'count', label: 'Count', kind: 'xy', min: 0.25, max: 12, step: 0.01 },
			{ key: 'offset', label: 'Offset', kind: 'xy', min: -1, max: 1, step: 0.01 },
			{ key: 'angle', label: 'Angle', kind: 'range', min: -180, max: 180, step: 0.1, unit: '°' },
			root.SynthTile.param
		],
		create: function (engine) {
			const defaults = root.SynthRegistry.get('tile').defaults;

			function num(value, fallback) {
				const n = Number(value);
				return isFinite(n) ? n : fallback;
			}

			return {
				process: function (ctx) {
					const p = ctx.parameters || {};
					engine.drawTo(ctx.output, engine.shaders.tile, {
						u_input: ctx.input,
						u_count: [
							num(p.countX, defaults.countX),
							num(p.countY, defaults.countY)
						],
						u_offset: [
							num(p.offsetX, defaults.offsetX),
							num(p.offsetY, defaults.offsetY)
						],
						u_angle: num(p.angle, defaults.angle),
						u_tile: root.SynthTile.resolve(p, defaults.tile)
					});
				}
			};
		}
	});
})(window);
