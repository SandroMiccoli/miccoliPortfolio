(function (root) {
	const cat = root.SynthCategories.generator;

	root.SynthRegistry.register({
		type: 'warpedConstellations',
		name: 'Warped Constellations',
		category: 'generator',
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Travels through a hexagonal lattice of glowing filaments. Speed moves the camera along the path, Travel scrubs depth, Scale sizes the lattice, Glow brightens the threads, Hue shifts their color, Warp bends the light between layers. After another operator, Blending Mode composites this field with whatever came before.',
		implemented: true,
		defaults: {
			speed: 1,
			travel: 0,
			scale: 1,
			glow: 1,
			hue: 0,
			warp: 1,
			blendMode: 'normal'
		},
		presets: [
			{ id: 'drift', name: 'Drift', parameters: { speed: 1, travel: 0, scale: 1, glow: 1, hue: 0, warp: 1, blendMode: 'normal' } },
			{ id: 'abyss', name: 'Abyss', parameters: { speed: 0.45, travel: 1.2, scale: 1.15, glow: 1.35, hue: 210, warp: 1.4, blendMode: 'normal' } },
			{ id: 'dense', name: 'Dense', parameters: { speed: 0.8, travel: 0.4, scale: 0.62, glow: 1.2, hue: 28, warp: 0.7, blendMode: 'normal' } },
			{ id: 'still', name: 'Still', parameters: { speed: 0, travel: 2.4, scale: 1, glow: 1.1, hue: 0, warp: 1, blendMode: 'normal' } }
		],
		params: [
			{ key: 'speed', label: 'Speed', kind: 'range', min: 0, max: 2, step: 0.01 },
			{ key: 'travel', label: 'Travel', kind: 'range', min: 0, max: 16, step: 0.01 },
			{ key: 'scale', label: 'Scale', kind: 'range', min: 0.35, max: 2.4, step: 0.01 },
			{ key: 'glow', label: 'Glow', kind: 'range', min: 0, max: 2.5, step: 0.01 },
			{ key: 'hue', label: 'Hue', kind: 'range', min: 0, max: 360, step: 1, unit: '°' },
			{ key: 'warp', label: 'Warp', kind: 'range', min: 0, max: 2, step: 0.01 },
			root.SynthBlend.param
		],
		create: function (engine) {
			const defaults = root.SynthRegistry.get('warpedConstellations').defaults;

			function num(value, fallback) {
				const n = Number(value);
				return isFinite(n) ? n : fallback;
			}

			return {
				process: function (ctx) {
					const p = ctx.parameters || {};
					engine.drawTo(ctx.output, engine.shaders.warpedConstellations, {
						u_input: ctx.input,
						u_hasInput: ctx.hasInput ? 1 : 0,
						u_blendMode: root.SynthBlend.toUniform(p.blendMode),
						u_speed: num(p.speed, defaults.speed),
						u_travel: num(p.travel, defaults.travel),
						u_scale: num(p.scale, defaults.scale),
						u_glow: num(p.glow, defaults.glow),
						u_hue: num(p.hue, defaults.hue) * 0.017453292,
						u_warp: num(p.warp, defaults.warp),
						u_time: ctx.time
					});
				}
			};
		}
	});
})(window);
