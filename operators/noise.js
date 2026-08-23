(function (root) {
	const cat = root.SynthCategories.generator;

	root.SynthRegistry.register({
		type: 'noise',
		name: 'Noise',
		category: 'generator',
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Procedural value-noise field. Scale sets grain size, Translate XYZ slides the volume (Z is depth), Speed XYZ is a constant drift on each axis, Amplitude and Offset remap the luminance, Octaves add detail, Contrast stretches the values. Output is luminance, so Color Lookup can remap it.',
		implemented: true,
		defaults: {
			scale: 4.5,
			translateX: 0,
			translateY: 0,
			translateZ: 0,
			speedX: 0.18,
			speedY: 0,
			speedZ: 0,
			amplitude: 1,
			offset: 0,
			octaves: 4,
			contrast: 1,
			blendMode: 'normal'
		},
		presets: [
			{ id: 'fine', name: 'Fine', parameters: { scale: 12, translateX: 0, translateY: 0, translateZ: 0, speedX: 0.22, speedY: 0, speedZ: 0, amplitude: 1, offset: 0, octaves: 5, contrast: 1.1, blendMode: 'normal' } },
			{ id: 'cloud', name: 'Cloud', parameters: { scale: 1.8, translateX: 0, translateY: 0, translateZ: 0, speedX: 0.08, speedY: 0, speedZ: 0, amplitude: 1, offset: 0, octaves: 3, contrast: 0.85, blendMode: 'normal' } },
			{ id: 'harsh', name: 'Harsh', parameters: { scale: 8, translateX: 0, translateY: 0, translateZ: 0, speedX: 0.4, speedY: 0, speedZ: 0, amplitude: 1.2, offset: 0, octaves: 2, contrast: 2.2, blendMode: 'normal' } }
		],
		params: [
			{ key: 'scale', label: 'Scale', kind: 'range', min: 0.4, max: 24, step: 0.1 },
			{ key: 'translate', label: 'Translate', kind: 'xyz', min: -4, max: 4, step: 0.01 },
			{ key: 'speed', label: 'Speed', kind: 'xyz', min: -2, max: 2, step: 0.01 },
			{ key: 'amplitude', label: 'Amplitude', kind: 'range', min: 0, max: 3, step: 0.01 },
			{ key: 'offset', label: 'Offset', kind: 'range', min: -1, max: 1, step: 0.01 },
			{ key: 'octaves', label: 'Octaves', kind: 'int', min: 1, max: 6, step: 1 },
			{ key: 'contrast', label: 'Contrast', kind: 'range', min: 0.2, max: 3, step: 0.01 },
			root.SynthBlend.param
		],
		create: function (engine) {
			const defaults = root.SynthRegistry.get('noise').defaults;

			function num(value, fallback) {
				const n = Number(value);
				return isFinite(n) ? n : fallback;
			}

			return {
				process: function (ctx) {
					const p = ctx.parameters || {};
					engine.drawTo(ctx.output, engine.shaders.noise, {
						u_input: ctx.input,
						u_hasInput: ctx.hasInput ? 1 : 0,
						u_blendMode: root.SynthBlend.toUniform(p.blendMode),
						u_scale: num(p.scale, defaults.scale),
						u_translate: [
							num(p.translateX, defaults.translateX),
							num(p.translateY, defaults.translateY),
							num(p.translateZ, defaults.translateZ)
						],
						u_speed: [
							num(p.speedX != null ? p.speedX : p.speed, defaults.speedX),
							num(p.speedY, defaults.speedY),
							num(p.speedZ, defaults.speedZ)
						],
						u_amplitude: num(p.amplitude, defaults.amplitude),
						u_offset: num(p.offset, defaults.offset),
						u_octaves: Math.max(1, num(p.octaves, defaults.octaves)),
						u_contrast: num(p.contrast, defaults.contrast),
						u_time: ctx.time
					});
				}
			};
		}
	});
})(window);
