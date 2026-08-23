(function (root) {
	const color = (root.SynthCategories && root.SynthCategories.effect.color) || '#4AAE72';

	root.SynthRegistry.register({
		type: 'kaleidoscope',
		name: 'Kaleidoscope',
		category: 'effect',
		categoryLabel: 'Effects / Filters',
		color: color,
		help: 'Mirrors the incoming image around the center. Segments is the number of slices. Angle turns the pattern, Zoom scales it, Offset slides the center.',
		implemented: true,
		defaults: {
			segments: 6,
			angle: 0,
			zoom: 1,
			offsetX: 0.5,
			offsetY: 0.5
		},
		presets: [
			{ id: 'hex', name: 'Hex', parameters: { segments: 6, angle: 0, zoom: 1, offsetX: 0.5, offsetY: 0.5 } },
			{ id: 'shatter', name: 'Shatter', parameters: { segments: 14, angle: 18, zoom: 1.6, offsetX: 0.5, offsetY: 0.5 } },
			{ id: 'slow', name: 'Slow', parameters: { segments: 4, angle: 0, zoom: 0.7, offsetX: 0.46, offsetY: 0.52 } }
		],
		params: [
			{ key: 'segments', label: 'Segments', kind: 'int', min: 2, max: 16, step: 1 },
			{ key: 'angle', label: 'Angle', kind: 'range', min: 0, max: 360, step: 1, unit: '°' },
			{ key: 'zoom', label: 'Zoom', kind: 'range', min: 0.25, max: 3, step: 0.01 },
			{ key: 'offsetX', label: 'Offset X', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'offsetY', label: 'Offset Y', kind: 'range', min: 0, max: 1, step: 0.01 }
		],
		create: function (engine) {
			return {
				process: function (ctx) {
					engine.drawTo(ctx.output, engine.shaders.kaleidoscope, {
						u_input: ctx.input,
						u_segments: ctx.parameters.segments,
						u_angle: ctx.parameters.angle,
						u_zoom: ctx.parameters.zoom,
						u_offsetX: ctx.parameters.offsetX,
						u_offsetY: ctx.parameters.offsetY
					});
				}
			};
		}
	});
})(window);
