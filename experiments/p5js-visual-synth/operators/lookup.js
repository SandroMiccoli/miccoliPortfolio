(function (root) {
	const color = (root.SynthCategories && root.SynthCategories.color.color) || '#D4A84B';

	const RAMPS = {
		fire: [
			[0, 8, 2, 6],
			[0.18, 92, 8, 18],
			[0.42, 214, 36, 8],
			[0.68, 255, 148, 18],
			[1, 255, 236, 198]
		],
		ice: [
			[0, 2, 4, 14],
			[0.28, 8, 42, 110],
			[0.58, 20, 168, 196],
			[0.82, 160, 230, 255],
			[1, 240, 250, 255]
		],
		spectrum: [
			[0, 40, 0, 70],
			[0.2, 20, 40, 210],
			[0.4, 0, 180, 140],
			[0.6, 220, 200, 10],
			[0.8, 230, 40, 20],
			[1, 255, 240, 230]
		],
		acid: [
			[0, 6, 0, 10],
			[0.35, 180, 0, 140],
			[0.7, 40, 220, 30],
			[1, 240, 255, 80]
		],
		mono: [
			[0, 0, 0, 0],
			[1, 245, 245, 245]
		]
	};

	function lerp(a, b, t) {
		return a + (b - a) * t;
	}

	function sampleRamp(stops, t) {
		if (t <= stops[0][0]) return [stops[0][1], stops[0][2], stops[0][3]];
		for (let i = 1; i < stops.length; i++) {
			if (t <= stops[i][0]) {
				const a = stops[i - 1];
				const b = stops[i];
				const u = (t - a[0]) / (b[0] - a[0] || 1);
				return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)];
			}
		}
		const last = stops[stops.length - 1];
		return [last[1], last[2], last[3]];
	}

	function rgbToHsv(r, g, b) {
		r /= 255;
		g /= 255;
		b /= 255;
		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const d = max - min;
		let h = 0;
		const s = max === 0 ? 0 : d / max;
		if (d !== 0) {
			if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
			else if (max === g) h = ((b - r) / d + 2) / 6;
			else h = ((r - g) / d + 4) / 6;
		}
		return [h, s, max];
	}

	function hsvToRgb(h, s, v) {
		const i = Math.floor(h * 6);
		const f = h * 6 - i;
		const p = v * (1 - s);
		const q = v * (1 - f * s);
		const t = v * (1 - (1 - f) * s);
		const n = i % 6;
		const r = [v, q, p, p, t, v][n];
		const g = [t, v, v, q, p, p][n];
		const b = [p, p, t, v, v, q][n];
		return [r * 255, g * 255, b * 255];
	}

	function hueShiftRgb(r, g, b, deg) {
		if (!deg) return [r, g, b];
		const hsv = rgbToHsv(r, g, b);
		hsv[0] = (hsv[0] + deg / 360) % 1;
		if (hsv[0] < 0) hsv[0] += 1;
		return hsvToRgb(hsv[0], hsv[1], hsv[2]);
	}

	function paintLut(g, preset, hue) {
		const stops = RAMPS[preset] || RAMPS.fire;
		g.pixelDensity(1);
		g.noStroke();
		for (let x = 0; x < 256; x++) {
			const rgb = sampleRamp(stops, x / 255);
			const shifted = hueShiftRgb(rgb[0], rgb[1], rgb[2], hue || 0);
			g.fill(shifted[0], shifted[1], shifted[2]);
			g.rect(x, 0, 1, 1);
		}
	}

	root.SynthRegistry.register({
		type: 'lookup',
		name: 'Color Lookup',
		category: 'color',
		categoryLabel: 'Color',
		color: color,
		help: 'Maps luminance from the previous operator onto a 1D color ramp (Fire, Ice, Spectrum, Acid, Mono). Geometry stays. Color changes.',
		implemented: true,
		defaults: {
			ramp: 'fire',
			hue: 0,
			contrast: 1.1,
			brightness: 0
		},
		params: [
			{ key: 'ramp', label: 'Ramp', kind: 'enum', options: [
				{ id: 'fire', label: 'Fire' },
				{ id: 'ice', label: 'Ice' },
				{ id: 'spectrum', label: 'Spectrum' },
				{ id: 'acid', label: 'Acid' },
				{ id: 'mono', label: 'Mono' }
			]},
			{ key: 'hue', label: 'Hue', kind: 'range', min: -180, max: 180, step: 1 },
			{ key: 'contrast', label: 'Contrast', kind: 'range', min: 0.2, max: 2.4, step: 0.01 },
			{ key: 'brightness', label: 'Brightness', kind: 'range', min: -0.5, max: 0.5, step: 0.01 }
		],
		create: function (engine) {
			let lut = null;
			let lastKey = '';

			function ensureLut(preset, hue) {
				const key = String(preset) + ':' + String(hue);
				if (!lut) {
					lut = createGraphics(256, 1);
					lut.pixelDensity(1);
				}
				if (key !== lastKey) {
					paintLut(lut, preset, hue);
					lastKey = key;
				}
				return lut;
			}

			return {
				process: function (ctx) {
					const tex = ensureLut(ctx.parameters.ramp, ctx.parameters.hue);
					engine.drawTo(ctx.output, engine.shaders.lookup, {
						u_input: ctx.input,
						u_lut: tex,
						u_contrast: ctx.parameters.contrast,
						u_brightness: ctx.parameters.brightness
					});
				},
				dispose: function () {
					if (lut) lut.remove();
					lut = null;
				}
			};
		}
	});
})(window);
