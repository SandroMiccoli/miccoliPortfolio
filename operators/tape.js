(function (root) {
	const cat = root.SynthCategories.generator;

	root.SynthRegistry.register({
		type: 'tape',
		name: 'VHS Tape',
		category: 'generator',
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Analog VHS tape noise after Vladimir Storm. Lines quantizes the frame into scanline fields. Speed scrolls the dropout. Threshold kills weak hits so only bright streaks remain. Grain is the horizontal hash that breaks each line into cells. Amount scales the luminance. Output is luminance, so Color Lookup can remap it. After another operator, Blending Mode composites this field with whatever came before.',
		implemented: true,
		defaults: {
			speed: 2,
			lines: 240,
			threshold: 0.7,
			grain: 1,
			amount: 1,
			blendMode: 'normal'
		},
		presets: [
			{ id: 'worn', name: 'Worn', parameters: { speed: 2, lines: 240, threshold: 0.7, grain: 1, amount: 1, blendMode: 'normal' } },
			{ id: 'snow', name: 'Snow', parameters: { speed: 3.2, lines: 180, threshold: 0.45, grain: 1.15, amount: 1, blendMode: 'normal' } },
			{ id: 'dropout', name: 'Dropout', parameters: { speed: 1.2, lines: 120, threshold: 0.85, grain: 0.8, amount: 1.25, blendMode: 'normal' } },
			{ id: 'crawl', name: 'Crawl', parameters: { speed: 0.35, lines: 72, threshold: 0.58, grain: 1, amount: 1, blendMode: 'normal' } }
		],
		params: [
			{ key: 'speed', label: 'Speed', kind: 'range', min: 0, max: 8, step: 0.01 },
			{ key: 'lines', label: 'Lines', kind: 'int', min: 20, max: 480, step: 1 },
			{ key: 'threshold', label: 'Threshold', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'grain', label: 'Grain', kind: 'range', min: 0, max: 2, step: 0.01 },
			{ key: 'amount', label: 'Amount', kind: 'range', min: 0, max: 2, step: 0.01 },
			root.SynthBlend.param
		],
		create: function (engine) {
			const defaults = root.SynthRegistry.get('tape').defaults;

			function num(value, fallback) {
				const n = Number(value);
				return isFinite(n) ? n : fallback;
			}

			return {
				process: function (ctx) {
					const p = ctx.parameters || {};
					engine.drawTo(ctx.output, engine.shaders.tape, {
						u_input: ctx.input,
						u_hasInput: ctx.hasInput ? 1 : 0,
						u_blendMode: root.SynthBlend.toUniform(p.blendMode),
						u_speed: num(p.speed, defaults.speed),
						u_lines: Math.max(1, num(p.lines, defaults.lines)),
						u_threshold: num(p.threshold, defaults.threshold),
						u_grain: num(p.grain, defaults.grain),
						u_amount: num(p.amount, defaults.amount),
						u_time: ctx.time
					});
				}
			};
		}
	});
})(window);
