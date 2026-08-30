(function (root) {
	const cat = root.SynthCategories.filter;

	root.SynthRegistry.register({
		type: 'edge',
		name: 'Edge',
		category: cat.id,
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Finds luminance gradients with a Sobel kernel and turns them into outlines. Threshold hides weak edges. Radius is the sample distance. Intensity is the gain. Color tints the outlines. Mix blends back to the source. Invert flips light and dark. After another operator, Blending Mode composites the outlines with the incoming image.',
		implemented: true,
		defaults: {
			threshold: 0.12,
			intensity: 1.6,
			radius: 1,
			mix: 1,
			invert: 0,
			color: '#FFFFFF',
			blendMode: 'normal'
		},
		presets: [
			{ id: 'soft', name: 'Soft', parameters: { threshold: 0.28, intensity: 0.9, radius: 1.4, mix: 1, invert: 0, color: '#FFFFFF', blendMode: 'normal' } },
			{ id: 'ink', name: 'Ink', parameters: { threshold: 0.08, intensity: 2.8, radius: 0.8, mix: 1, invert: 1, color: '#FFFFFF', blendMode: 'normal' } },
			{ id: 'trace', name: 'Trace', parameters: { threshold: 0.16, intensity: 1.4, radius: 1, mix: 0.55, invert: 0, color: '#FFFFFF', blendMode: 'normal' } }
		],
		params: [
			{ key: 'threshold', label: 'Threshold', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'intensity', label: 'Intensity', kind: 'range', min: 0, max: 4, step: 0.01 },
			{ key: 'radius', label: 'Radius', kind: 'range', min: 0.4, max: 4, step: 0.01 },
			{ key: 'mix', label: 'Mix', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'invert', label: 'Invert', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'color', label: 'Color', kind: 'color' },
			root.SynthBlend.param
		],
		create: function (engine) {
			const defaults = root.SynthRegistry.get('edge').defaults;

			function num(value, fallback) {
				const n = Number(value);
				return isFinite(n) ? n : fallback;
			}

			return {
				process: function (ctx) {
					const p = ctx.parameters || {};
					engine.drawTo(ctx.output, engine.shaders.edge, {
						u_input: ctx.input,
						u_hasInput: ctx.hasInput ? 1 : 0,
						u_blendMode: root.SynthBlend.toUniform(p.blendMode),
						u_threshold: num(p.threshold, defaults.threshold),
						u_intensity: num(p.intensity, defaults.intensity),
						u_radius: num(p.radius, defaults.radius),
						u_mix: num(p.mix, defaults.mix),
						u_invert: num(p.invert, defaults.invert),
						u_color: root.SynthColor.toRgb(p.color || defaults.color)
					});
				}
			};
		}
	});
})(window);
