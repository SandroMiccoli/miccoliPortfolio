(function (root) {
	const color = (root.SynthCategories && root.SynthCategories.color.color) || '#D4A84B';

	const PALETTES = [
		{ id: 'fire', colors: ['#5C0812', '#D62408', '#FF9412', '#FFECC6'], bg: '#080206' },
		{ id: 'ice', colors: ['#082A6E', '#14A8C4', '#A0E6FF', '#F0FAFF'], bg: '#02040E' },
		{ id: 'spectrum', colors: ['#1428D2', '#00B48C', '#DCC80A', '#E62814'], bg: '#140028' },
		{ id: 'acid', colors: ['#B4008C', '#28DC1E', '#F0FF50', '#FFFFFF'], bg: '#06000A' },
		{ id: 'mono', colors: ['#2A2A2A', '#6E6E6E', '#B4B4B4', '#F5F5F5'], bg: '#000000' },
		{ id: 'grove', colors: ['#C6F25A', '#1FA38A', '#1B5C3A', '#D6E87A'], bg: '#050806' },
		{ id: 'dusk', colors: ['#F26A3D', '#F2B199', '#6B4C9A', '#1B1638'], bg: '#0A0614' },
		{ id: 'ocean', colors: ['#0B3D5C', '#1A7FA8', '#5ED0E6', '#E8F7FF'], bg: '#031018' },
		{ id: 'candy', colors: ['#00D4D4', '#FF2D78', '#FF8A3D', '#7A2BFF'], bg: '#0A0610' },
		{ id: 'copper', colors: ['#3A1C0C', '#B85A1A', '#E8A04A', '#F6E2C4'], bg: '#0C0704' },
		{ id: 'pulp', colors: ['#8B1020', '#E23A2E', '#F2C7A4', '#F7EFE4'], bg: '#140808' },
		{ id: 'nord', colors: ['#4C6A8A', '#88A0B8', '#D8DEE9', '#ECEFF4'], bg: '#0E1218' },
		{ id: 'heat', colors: ['#1A0000', '#C41414', '#FF7A00', '#FFE14A'], bg: '#080000' },
		{ id: 'chalk', colors: ['#F26D8C', '#8EC5E8', '#F2E6A2', '#D9D2F2'], bg: '#16141C' },
		{ id: 'neon', colors: ['#39FF14', '#00F0FF', '#FF00A8', '#F5FF7A'], bg: '#050508' },
		{ id: 'ink', colors: ['#1C3A7A', '#3D6BDB', '#C9D6F2', '#F4F1EA'], bg: '#06080E' }
	];

	const LETTERS = 'ABCDEFGH';

	function lerp(a, b, t) {
		return a + (b - a) * t;
	}

	function clampByte(n) {
		return Math.max(0, Math.min(255, Math.round(n)));
	}

	function parseHex(hex) {
		const raw = String(hex || '').trim().replace(/^#/, '');
		if (raw.length === 3) {
			return [
				parseInt(raw[0] + raw[0], 16),
				parseInt(raw[1] + raw[1], 16),
				parseInt(raw[2] + raw[2], 16)
			];
		}
		if (raw.length >= 6) {
			return [
				parseInt(raw.slice(0, 2), 16),
				parseInt(raw.slice(2, 4), 16),
				parseInt(raw.slice(4, 6), 16)
			];
		}
		return [0, 0, 0];
	}

	function toHex(r, g, b) {
		function byte(n) {
			return clampByte(n).toString(16).padStart(2, '0');
		}
		return ('#' + byte(r) + byte(g) + byte(b)).toUpperCase();
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

	function clonePalette(palette) {
		return {
			id: palette.id,
			colors: (palette.colors || []).map(function (hex) {
				return toHex.apply(null, parseHex(hex));
			}),
			bg: toHex.apply(null, parseHex(palette.bg || '#000000'))
		};
	}

	function findBuiltin(id) {
		for (let i = 0; i < PALETTES.length; i++) {
			if (PALETTES[i].id === id) return clonePalette(PALETTES[i]);
		}
		return null;
	}

	function findSaved(id, saved) {
		const list = saved || [];
		for (let i = 0; i < list.length; i++) {
			if (list[i] && list[i].id === id) return clonePalette(list[i]);
		}
		return null;
	}

	function findPalette(id, saved) {
		return findSaved(id, saved) || findBuiltin(id) || clonePalette(PALETTES[0]);
	}

	function sameColors(a, b) {
		if (!a || !b) return false;
		if (toHex.apply(null, parseHex(a.bg)) !== toHex.apply(null, parseHex(b.bg))) return false;
		const ac = a.colors || [];
		const bc = b.colors || [];
		if (ac.length !== bc.length) return false;
		for (let i = 0; i < ac.length; i++) {
			if (toHex.apply(null, parseHex(ac[i])) !== toHex.apply(null, parseHex(bc[i]))) return false;
		}
		return true;
	}

	function catalog(saved) {
		return PALETTES.map(clonePalette).concat((saved || []).map(clonePalette));
	}

	function normalize(params) {
		const src = params || {};
		const saved = Array.isArray(src.savedPalettes) ? src.savedPalettes.map(clonePalette) : [];
		const fallbackId = src.paletteId || src.ramp || PALETTES[0].id;
		const found = findSaved(fallbackId, saved) || findBuiltin(fallbackId) || clonePalette(PALETTES[0]);
		const colors = Array.isArray(src.colors) && src.colors.length
			? src.colors.map(function (hex) {
				return toHex.apply(null, parseHex(hex));
			})
			: found.colors.slice();
		const bg = src.bg != null ? toHex.apply(null, parseHex(src.bg)) : found.bg;
		const current = { colors: colors, bg: bg };
		const matched = catalog(saved).filter(function (item) {
			return sameColors(current, item);
		})[0];
		const hue = typeof src.hue === 'number' ? src.hue : 0;
		const saturation = typeof src.saturation === 'number' ? src.saturation : 1;
		const exposure = typeof src.exposure === 'number'
			? src.exposure
			: 1;
		return {
			paletteId: matched ? matched.id : (src.paletteId || ''),
			colors: colors,
			bg: bg,
			savedPalettes: saved,
			hue: hue,
			saturation: saturation,
			exposure: exposure,
			dirty: !matched
		};
	}

	function applyPreset(params, id) {
		const next = normalize(params);
		const found = findPalette(id, next.savedPalettes);
		next.paletteId = found.id;
		next.colors = found.colors.slice();
		next.bg = found.bg;
		next.dirty = false;
		return next;
	}

	function setSlot(params, slot, hex) {
		const next = normalize(params);
		const value = toHex.apply(null, parseHex(hex));
		if (slot === 'bg') next.bg = value;
		else {
			const index = Number(slot);
			if (index >= 0 && index < next.colors.length) next.colors[index] = value;
		}
		const matched = catalog(next.savedPalettes).filter(function (item) {
			return sameColors(next, item);
		})[0];
		next.paletteId = matched ? matched.id : next.paletteId;
		next.dirty = !matched;
		return next;
	}

	function saveCurrent(params) {
		const next = normalize(params);
		const id = 'user_' + Math.random().toString(36).slice(2, 10);
		next.savedPalettes = next.savedPalettes.concat([{
			id: id,
			colors: next.colors.slice(),
			bg: next.bg
		}]).slice(-24);
		next.paletteId = id;
		next.dirty = false;
		return next;
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

	function stopsFromPalette(colors, bg) {
		const hexes = [bg].concat(colors || []);
		const last = Math.max(1, hexes.length - 1);
		return hexes.map(function (hex, i) {
			const rgb = parseHex(hex);
			return [i / last, rgb[0], rgb[1], rgb[2]];
		});
	}

	function paintLut(g, colors, bg) {
		const stops = stopsFromPalette(colors, bg);
		g.pixelDensity(1);
		g.noStroke();
		for (let x = 0; x < 256; x++) {
			const rgb = sampleRamp(stops, x / 255);
			g.fill(rgb[0], rgb[1], rgb[2]);
			g.rect(x, 0, 1, 1);
		}
	}

	const fire = clonePalette(PALETTES[0]);

	root.SynthLookup = {
		palettes: PALETTES,
		letters: LETTERS,
		parseHex: parseHex,
		toHex: toHex,
		rgbToHsv: rgbToHsv,
		hsvToRgb: hsvToRgb,
		catalog: catalog,
		normalize: normalize,
		applyPreset: applyPreset,
		setSlot: setSlot,
		saveCurrent: saveCurrent,
		sameColors: sameColors,
		findPalette: findPalette
	};

	root.SynthRegistry.register({
		type: 'lookup',
		name: 'Color Lookup',
		category: 'color',
		categoryLabel: 'Color',
		color: color,
		help: 'Maps luminance from the previous operator onto a color palette. Tap a preset, then edit A-D or BG. Hue shift, saturation, and exposure grade the mapped color. Geometry stays.',
		implemented: true,
		defaults: {
			paletteId: fire.id,
			colors: fire.colors.slice(),
			bg: fire.bg,
			savedPalettes: [],
			hue: 0,
			saturation: 1,
			exposure: 1
		},
		presets: [
			{ id: 'neutral', name: 'Neutral', parameters: { paletteId: 'fire', colors: ['#5C0812', '#D62408', '#FF9412', '#FFECC6'], bg: '#080206', hue: 0, saturation: 1, exposure: 1 } },
			{ id: 'hot', name: 'Hot', parameters: { paletteId: 'heat', colors: ['#1A0000', '#C41414', '#FF7A00', '#FFE14A'], bg: '#080000', hue: 8, saturation: 1.3, exposure: 1.15 } },
			{ id: 'cool', name: 'Cool', parameters: { paletteId: 'ice', colors: ['#082A6E', '#14A8C4', '#A0E6FF', '#F0FAFF'], bg: '#02040E', hue: -12, saturation: 0.9, exposure: 1 } },
			{ id: 'fade', name: 'Fade', parameters: { paletteId: 'mono', colors: ['#2A2A2A', '#6E6E6E', '#B4B4B4', '#F5F5F5'], bg: '#000000', hue: 0, saturation: 0.4, exposure: 0.85 } }
		],
		params: [
			{ key: 'palette', label: 'Palette', kind: 'palette' },
			{ key: 'hue', label: 'Hue shift', kind: 'range', min: -180, max: 180, step: 1, unit: '°' },
			{ key: 'saturation', label: 'Saturation', kind: 'range', min: 0, max: 2, step: 0.01 },
			{ key: 'exposure', label: 'Exposure', kind: 'range', min: 0, max: 2, step: 0.01 }
		],
		randomize: function (params) {
			const pick = PALETTES[Math.floor(Math.random() * PALETTES.length)];
			params.paletteId = pick.id;
			params.colors = pick.colors.slice();
			params.bg = pick.bg;
			params.savedPalettes = Array.isArray(params.savedPalettes) ? params.savedPalettes : [];
		},
		create: function (engine) {
			let lut = null;
			let lastKey = '';

			function ensureLut(colors, bg) {
				const key = String(bg) + '|' + (colors || []).join(',');
				if (lut && key !== lastKey) {
					lut.remove();
					lut = null;
				}
				if (!lut) {
					lut = createGraphics(256, 1);
					lut.pixelDensity(1);
					paintLut(lut, colors, bg);
					lastKey = key;
				}
				return lut;
			}

			return {
				process: function (ctx) {
					const resolved = root.SynthLookup.normalize(ctx.parameters);
					const tex = ensureLut(resolved.colors, resolved.bg);
					engine.drawTo(ctx.output, engine.shaders.lookup, {
						u_input: ctx.input,
						u_lut: tex,
						u_hue: resolved.hue,
						u_saturation: resolved.saturation,
						u_exposure: resolved.exposure
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
