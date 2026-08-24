(function (root) {
	const cat = root.SynthCategories.effect;

	root.SynthRegistry.register({
		type: 'transform',
		name: 'Transform',
		category: cat.id,
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Moves, turns, and scales the incoming image around the center. Translate slides it, Rotate turns it, Scale X/Y zoom independently. Tile fills the frame when the image leaves its bounds: Hold, Repeat, or Mirror.',
		implemented: true,
		defaults: {
			translateX: 0,
			translateY: 0,
			rotate: 0,
			scaleX: 1,
			scaleY: 1,
			tile: 'hold'
		},
		presets: [
			{ id: 'center', name: 'Center', parameters: { translateX: 0, translateY: 0, rotate: 0, scaleX: 1, scaleY: 1, tile: 'hold' } },
			{ id: 'spin', name: 'Spin', parameters: { translateX: 0, translateY: 0, rotate: 25, scaleX: 1, scaleY: 1, tile: 'hold' } },
			{ id: 'punch', name: 'Punch', parameters: { translateX: 0, translateY: 0, rotate: 0, scaleX: 1.45, scaleY: 1.45, tile: 'hold' } },
			{ id: 'tile', name: 'Tile', parameters: { translateX: 0.12, translateY: 0, rotate: 8, scaleX: 0.72, scaleY: 0.72, tile: 'repeat' } }
		],
		params: [
			{ key: 'translate', label: 'Translate', kind: 'xy', min: -1, max: 1, step: 0.01 },
			{ key: 'rotate', label: 'Rotate', kind: 'range', min: -180, max: 180, step: 0.1, unit: '°' },
			{ key: 'scale', label: 'Scale', kind: 'xy', min: 0, max: 4, step: 0.01 },
			root.SynthTile.param
		],
		create: function (engine) {
			const defaults = root.SynthRegistry.get('transform').defaults;

			function num(value, fallback) {
				const n = Number(value);
				return isFinite(n) ? n : fallback;
			}

			return {
				process: function (ctx) {
					const p = ctx.parameters || {};
					engine.drawTo(ctx.output, engine.shaders.transform, {
						u_input: ctx.input,
						u_translate: [
							num(p.translateX, defaults.translateX),
							num(p.translateY, defaults.translateY)
						],
						u_rotate: num(p.rotate, defaults.rotate),
						u_scale: [
							num(p.scaleX, defaults.scaleX),
							num(p.scaleY, defaults.scaleY)
						],
						u_tile: root.SynthTile.resolve(p, defaults.tile)
					});
				}
			};
		}
	});
})(window);
