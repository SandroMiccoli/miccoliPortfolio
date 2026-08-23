(function (root) {
	const cat = root.SynthCategories.effect;

	root.SynthRegistry.register({
		type: 'kaleidoscope',
		name: 'Kaleidoscope',
		category: cat.id,
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Mirrors the incoming image around the center. Segments is the number of slices. Angle turns the pattern, Zoom scales it, Offset slides the center. Tile fills the frame when zoom or offset leaves the image: Hold, Repeat, or Mirror.',
		implemented: true,
		defaults: {
			segments: 6,
			angle: 0,
			zoom: 1,
			offsetX: 0.5,
			offsetY: 0.5,
			tile: 'hold'
		},
		presets: [
			{ id: 'hex', name: 'Hex', parameters: { segments: 6, angle: 0, zoom: 1, offsetX: 0.5, offsetY: 0.5, tile: 'mirror' } },
			{ id: 'shatter', name: 'Shatter', parameters: { segments: 14, angle: 18, zoom: 1.6, offsetX: 0.5, offsetY: 0.5, tile: 'mirror' } },
			{ id: 'slow', name: 'Slow', parameters: { segments: 4, angle: 0, zoom: 0.7, offsetX: 0.46, offsetY: 0.52, tile: 'hold' } }
		],
		params: [
			{ key: 'segments', label: 'Segments', kind: 'int', min: 2, max: 16, step: 1 },
			{ key: 'angle', label: 'Angle', kind: 'range', min: 0, max: 360, step: 1, unit: '°' },
			{ key: 'zoom', label: 'Zoom', kind: 'range', min: 0.25, max: 3, step: 0.01 },
			{ key: 'offsetX', label: 'Offset X', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'offsetY', label: 'Offset Y', kind: 'range', min: 0, max: 1, step: 0.01 },
			root.SynthTile.param
		],
		create: function (engine) {
			const defaults = root.SynthRegistry.get('kaleidoscope').defaults;

			function num(value, fallback) {
				const n = Number(value);
				return isFinite(n) ? n : fallback;
			}

			return {
				process: function (ctx) {
					const p = ctx.parameters || {};
					engine.drawTo(ctx.output, engine.shaders.kaleidoscope, {
						u_input: ctx.input,
						u_segments: num(p.segments, defaults.segments),
						u_angle: num(p.angle, defaults.angle),
						u_zoom: num(p.zoom, defaults.zoom),
						u_offsetX: num(p.offsetX, defaults.offsetX),
						u_offsetY: num(p.offsetY, defaults.offsetY),
						u_tile: root.SynthTile.resolve(p, defaults.tile)
					});
				}
			};
		}
	});
})(window);
