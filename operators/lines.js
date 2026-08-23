(function (root) {
	const cat = root.SynthCategories.generator;

	root.SynthRegistry.register({
		type: 'lines',
		name: 'Lines',
		category: 'generator',
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Draws parallel stripes. Amount is the count, Width and Fuzzyness shape each band, Rotation and Position place them. Color tints the lines. After another operator, Blending Mode composites this field with whatever came before.',
		implemented: true,
		defaults: {
			fuzzyness: 0.64,
			amount: 5,
			width: 0.44,
			rotation: 0,
			position: 0.5,
			color: '#FFFFFF',
			blendMode: 'normal'
		},
		presets: [
			{ id: 'soft', name: 'Soft', parameters: { fuzzyness: 0.85, amount: 4, width: 0.6, rotation: 8, position: 0.5, color: '#FFFFFF', blendMode: 'normal' } },
			{ id: 'tight', name: 'Tight', parameters: { fuzzyness: 0.12, amount: 22, width: 0.16, rotation: 0, position: 0.5, color: '#FFFFFF', blendMode: 'normal' } },
			{ id: 'cross', name: 'Cross', parameters: { fuzzyness: 0.35, amount: 10, width: 0.28, rotation: 45, position: 0.5, color: '#FFFFFF', blendMode: 'difference' } },
			{ id: 'drift', name: 'Drift', parameters: { fuzzyness: 0.5, amount: 7, width: 0.4, rotation: 12, position: 0.35, color: '#FFFFFF', blendMode: 'normal' } }
		],
		params: [
			{ key: 'fuzzyness', label: 'Fuzzyness', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'amount', label: 'Amount', kind: 'int', min: 0, max: 30, step: 1 },
			{ key: 'width', label: 'Width', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'rotation', label: 'Rotation', kind: 'range', min: 0, max: 360, step: 1, unit: '°' },
			{ key: 'position', label: 'Position', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'color', label: 'Color', kind: 'color' },
			root.SynthBlend.param
		],
		create: function (engine) {
			const defaults = root.SynthRegistry.get('lines').defaults;

			function num(value, fallback) {
				const n = Number(value);
				return isFinite(n) ? n : fallback;
			}

			return {
				process: function (ctx) {
					const p = ctx.parameters || {};
					const amount = p.amount != null ? p.amount : (p.density != null ? p.density : defaults.amount);
					const width = p.width != null ? p.width : (p.thickness != null ? p.thickness : defaults.width);
					const rotation = p.rotation != null ? p.rotation : (p.angle != null ? p.angle : defaults.rotation);
					engine.drawTo(ctx.output, engine.shaders.lines, {
						u_input: ctx.input,
						u_hasInput: ctx.hasInput ? 1 : 0,
						u_blendMode: root.SynthBlend.toUniform(p.blendMode),
						u_fuzzyness: num(p.fuzzyness, defaults.fuzzyness),
						u_amount: Math.max(0, num(amount, defaults.amount)),
						u_width: num(width, defaults.width),
						u_rotation: num(rotation, defaults.rotation),
						u_position: num(p.position, defaults.position),
						u_color: root.SynthColor.toRgb(p.color || defaults.color)
					});
				}
			};
		}
	});
})(window);
