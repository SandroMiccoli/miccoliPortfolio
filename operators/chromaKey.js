(function (root) {
	const cat = root.SynthCategories.color;

	root.SynthRegistry.register({
		type: 'chromaKey',
		name: 'Chroma Key',
		category: cat.id,
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Excludes a chosen color from the incoming image. Key is the color to cut. Tolerance is how close a pixel must be. Softness feathers the edge. Spill pulls leftover key tint off the fringe. Fill replaces the hole. Invert keeps only the key. Chroma ignores brightness so screens stay even; Color matches the exact shade. Geometry stays.',
		implemented: true,
		defaults: {
			key: '#00FF00',
			fill: '#000000',
			tolerance: 0.18,
			softness: 0.14,
			spill: 0.4,
			invert: 0,
			match: 'chroma'
		},
		presets: [
			{ id: 'green', name: 'Green', parameters: { key: '#00FF00', fill: '#000000', tolerance: 0.2, softness: 0.14, spill: 0.45, invert: 0, match: 'chroma' } },
			{ id: 'blue', name: 'Blue', parameters: { key: '#0040FF', fill: '#000000', tolerance: 0.2, softness: 0.14, spill: 0.4, invert: 0, match: 'chroma' } },
			{ id: 'tight', name: 'Tight', parameters: { key: '#00FF00', fill: '#000000', tolerance: 0.08, softness: 0.06, spill: 0.25, invert: 0, match: 'chroma' } },
			{ id: 'keep', name: 'Keep', parameters: { key: '#00FF00', fill: '#000000', tolerance: 0.16, softness: 0.1, spill: 0, invert: 1, match: 'color' } }
		],
		params: [
			{ key: 'key', label: 'Key', kind: 'color' },
			{ key: 'fill', label: 'Fill', kind: 'color' },
			{ key: 'tolerance', label: 'Tolerance', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'softness', label: 'Softness', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'spill', label: 'Spill', kind: 'range', min: 0, max: 1, step: 0.01 },
			{
				key: 'invert',
				label: 'Invert',
				kind: 'enum',
				options: [
					{ id: 0, label: 'Off' },
					{ id: 1, label: 'On' }
				]
			},
			{
				key: 'match',
				label: 'Match',
				kind: 'enum',
				options: [
					{ id: 'chroma', label: 'Chroma' },
					{ id: 'color', label: 'Color' }
				]
			}
		],
		create: function (engine) {
			const defaults = root.SynthRegistry.get('chromaKey').defaults;

			function num(value, fallback) {
				const n = Number(value);
				return isFinite(n) ? n : fallback;
			}

			return {
				process: function (ctx) {
					const p = ctx.parameters || {};
					engine.drawTo(ctx.output, engine.shaders.chromaKey, {
						u_input: ctx.input,
						u_key: root.SynthColor.toRgb(p.key || defaults.key),
						u_fill: root.SynthColor.toRgb(p.fill || defaults.fill),
						u_tolerance: num(p.tolerance, defaults.tolerance),
						u_softness: num(p.softness, defaults.softness),
						u_spill: num(p.spill, defaults.spill),
						u_invert: num(p.invert, defaults.invert) > 0.5 ? 1 : 0,
						u_match: p.match === 'color' ? 1 : 0
					});
				}
			};
		}
	});
})(window);
