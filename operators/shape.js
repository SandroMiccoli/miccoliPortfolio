(function (root) {
	const cat = root.SynthCategories.generator;

	root.SynthRegistry.register({
		type: 'shape',
		name: 'Shape',
		category: 'generator',
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Draws a circle or a regular polygon. X/Y place the shape, Radius and Feather match the mask controls, Sides and Rotation apply to polygons. Color tints the fill. After another operator, Blending Mode composites it with the previous image.',
		implemented: true,
		defaults: {
			kind: 'circle',
			x: 0.5,
			y: 0.5,
			r: 0.32,
			sides: 5,
			rotation: 0,
			feather: 0.02,
			color: '#FFFFFF',
			blendMode: 'normal'
		},
		presets: [
			{ id: 'dot', name: 'Dot', parameters: { kind: 'circle', x: 0.5, y: 0.5, r: 0.12, sides: 5, rotation: 0, feather: 0.04, color: '#FFFFFF', blendMode: 'normal' } },
			{ id: 'disc', name: 'Disc', parameters: { kind: 'circle', x: 0.5, y: 0.5, r: 0.4, sides: 5, rotation: 0, feather: 0.12, color: '#FFFFFF', blendMode: 'normal' } },
			{ id: 'hex', name: 'Hex', parameters: { kind: 'polygon', x: 0.5, y: 0.5, r: 0.32, sides: 6, rotation: 0, feather: 0.02, color: '#FFFFFF', blendMode: 'normal' } }
		],
		params: [
			{
				key: 'kind',
				label: 'Kind',
				kind: 'enum',
				options: [
					{ id: 'circle', label: 'Circle' },
					{ id: 'polygon', label: 'Polygon' }
				]
			},
			{ key: 'x', label: 'X', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'y', label: 'Y', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'r', label: 'Radius', kind: 'range', min: 0.02, max: 0.8, step: 0.01 },
			{ key: 'sides', label: 'Sides', kind: 'int', min: 3, max: 12, step: 1, visibleWhen: 'param:kind=polygon' },
			{ key: 'rotation', label: 'Rotation', kind: 'range', min: 0, max: 360, step: 1, unit: '°', visibleWhen: 'param:kind=polygon' },
			{ key: 'feather', label: 'Feather', kind: 'range', min: 0, max: 0.4, step: 0.01 },
			{ key: 'color', label: 'Color', kind: 'color' },
			root.SynthBlend.param
		],
		create: function (engine) {
			const defaults = root.SynthRegistry.get('shape').defaults;

			function num(value, fallback) {
				const n = Number(value);
				return isFinite(n) ? n : fallback;
			}

			return {
				process: function (ctx) {
					const p = ctx.parameters || {};
					const kind = p.kind === 'polygon' ? 2 : 0;
					engine.drawTo(ctx.output, engine.shaders.shape, {
						u_input: ctx.input,
						u_hasInput: ctx.hasInput ? 1 : 0,
						u_blendMode: root.SynthBlend.toUniform(p.blendMode),
						u_kind: kind,
						u_center: [num(p.x, defaults.x), num(p.y, defaults.y)],
						u_size: [num(p.r, defaults.r), num(p.r, defaults.r)],
						u_sides: Math.max(3, num(p.sides, defaults.sides)),
						u_rotation: num(p.rotation, defaults.rotation),
						u_feather: num(p.feather, defaults.feather),
						u_color: root.SynthColor.toRgb(p.color || defaults.color)
					});
				}
			};
		}
	});
})(window);
