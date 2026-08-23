(function (root) {
	const cat = root.SynthCategories.effect;

	root.SynthRegistry.register({
		type: 'pixelate',
		name: 'Pixelate',
		category: cat.id,
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Snaps the incoming image to a coarse grid. Size X and Size Y are the block size in pixels. Mix blends back to the source. Geometry is quantized; color is not.',
		implemented: true,
		defaults: {
			sizeX: 8,
			sizeY: 8,
			mix: 1
		},
		presets: [
			{ id: 'soft', name: 'Soft', parameters: { sizeX: 4, sizeY: 4, mix: 1 } },
			{ id: 'heavy', name: 'Heavy', parameters: { sizeX: 18, sizeY: 18, mix: 1 } },
			{ id: 'scan', name: 'Scan', parameters: { sizeX: 2, sizeY: 24, mix: 1 } },
			{ id: 'crush', name: 'Crush', parameters: { sizeX: 48, sizeY: 48, mix: 1 } }
		],
		params: [
			{ key: 'size', label: 'Size', kind: 'xy', min: 1, max: 64, step: 0.5 },
			{ key: 'mix', label: 'Mix', kind: 'range', min: 0, max: 1, step: 0.01 }
		],
		create: function (engine) {
			const defaults = root.SynthRegistry.get('pixelate').defaults;

			function num(value, fallback) {
				const n = Number(value);
				return isFinite(n) ? n : fallback;
			}

			return {
				process: function (ctx) {
					const p = ctx.parameters || {};
					engine.drawTo(ctx.output, engine.shaders.pixelate, {
						u_input: ctx.input,
						u_size: [
							num(p.sizeX, defaults.sizeX),
							num(p.sizeY, defaults.sizeY)
						],
						u_mix: num(p.mix, defaults.mix)
					});
				}
			};
		}
	});
})(window);
