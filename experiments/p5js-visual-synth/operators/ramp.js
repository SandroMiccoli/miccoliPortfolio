(function (root) {
	const color = (root.SynthCategories && root.SynthCategories.color.color) || '#D4A84B';
	const LUT_SIZE = 256;
	const MAX_STOPS = 32;

	const DEFAULT_STOPS = [
		{ id: 'n0', pos: 0, color: '#000000' },
		{ id: 'n1', pos: 0.16, color: '#F0C400' },
		{ id: 'n2', pos: 0.42, color: '#5A1810' },
		{ id: 'n3', pos: 0.78, color: '#F0D4D6' },
		{ id: 'n4', pos: 1, color: '#000000' }
	];

	function clamp(n, min, max) {
		return Math.min(max, Math.max(min, n));
	}

	function lerp(a, b, t) {
		return a + (b - a) * t;
	}

	function uid() {
		return 'n' + Math.random().toString(36).slice(2, 8);
	}

	function hexOf(value) {
		if (root.SynthColor) {
			const rgb = root.SynthColor.parseHex(value);
			return root.SynthColor.toHex(rgb[0], rgb[1], rgb[2]);
		}
		return String(value || '#FFFFFF').toUpperCase();
	}

	function rgbOf(value) {
		return root.SynthColor
			? root.SynthColor.parseHex(value)
			: [255, 255, 255];
	}

	function cloneStop(stop, index) {
		const src = stop || {};
		const pos = Number(src.pos);
		return {
			id: src.id || ('n' + index),
			pos: clamp(isFinite(pos) ? pos : 0, 0, 1),
			color: hexOf(src.color || '#FFFFFF')
		};
	}

	function sortStops(stops) {
		return (stops || []).slice().sort(function (a, b) {
			if (a.pos === b.pos) return String(a.id).localeCompare(String(b.id));
			return a.pos - b.pos;
		});
	}

	function normalizeStops(raw) {
		const list = Array.isArray(raw) && raw.length ? raw : DEFAULT_STOPS;
		const seen = {};
		const out = list.slice(0, MAX_STOPS).map(function (stop, index) {
			const next = cloneStop(stop, index);
			if (seen[next.id]) next.id = uid();
			seen[next.id] = true;
			return next;
		});
		while (out.length < 2) {
			out.push(cloneStop({
				pos: out.length ? 1 : 0,
				color: out.length ? '#FFFFFF' : '#000000'
			}, out.length));
		}
		return out;
	}

	function interpolateId(value) {
		return value === 'step' ? 'step' : 'linear';
	}

	function normalize(params) {
		const src = params || {};
		const phase = Number(src.phase);
		const period = Number(src.period);
		return {
			stops: normalizeStops(src.stops),
			phase: isFinite(phase) ? phase : 0,
			period: isFinite(period) ? period : 1,
			interpolate: interpolateId(src.interpolate)
		};
	}

	function sampleStops(stops, t, interpolate) {
		const sorted = sortStops(stops);
		if (!sorted.length) return [0, 0, 0];
		if (t <= sorted[0].pos) return rgbOf(sorted[0].color);
		const last = sorted[sorted.length - 1];
		if (t >= last.pos) return rgbOf(last.color);
		for (let i = 1; i < sorted.length; i++) {
			if (t < sorted[i].pos) {
				const a = sorted[i - 1];
				const b = sorted[i];
				if (interpolate === 'step') return rgbOf(a.color);
				const u = (t - a.pos) / (b.pos - a.pos || 1);
				const ar = rgbOf(a.color);
				const br = rgbOf(b.color);
				return [
					lerp(ar[0], br[0], u),
					lerp(ar[1], br[1], u),
					lerp(ar[2], br[2], u)
				];
			}
		}
		return rgbOf(last.color);
	}

	function paintLut(g, stops, interpolate) {
		g.pixelDensity(1);
		g.noStroke();
		for (let x = 0; x < LUT_SIZE; x++) {
			const rgb = sampleStops(stops, x / (LUT_SIZE - 1), interpolate);
			g.fill(rgb[0], rgb[1], rgb[2]);
			g.rect(x, 0, 1, 1);
		}
	}

	function lutKey(stops, interpolate) {
		return interpolateId(interpolate) + '|' + sortStops(stops).map(function (stop) {
			return stop.pos.toFixed(4) + stop.color;
		}).join(',');
	}

	function cssGradient(stops, interpolate) {
		const sorted = sortStops(stops);
		if (!sorted.length) return '#000';
		if (interpolate === 'step') {
			const parts = [];
			sorted.forEach(function (stop, index) {
				const start = (index === 0 ? 0 : stop.pos) * 100;
				const end = (index + 1 < sorted.length ? sorted[index + 1].pos : 1) * 100;
				parts.push(stop.color + ' ' + start + '%');
				parts.push(stop.color + ' ' + end + '%');
			});
			return 'linear-gradient(to right, ' + parts.join(', ') + ')';
		}
		return 'linear-gradient(to right, ' + sorted.map(function (stop) {
			return stop.color + ' ' + (stop.pos * 100) + '%';
		}).join(', ') + ')';
	}

	function sampleColor(stops, t, interpolate) {
		const rgb = sampleStops(stops, clamp(t, 0, 1), interpolate);
		return root.SynthColor
			? root.SynthColor.toHex(rgb[0], rgb[1], rgb[2])
			: '#FFFFFF';
	}

	function addStop(params, pos, hex) {
		const next = normalize(params);
		if (next.stops.length >= MAX_STOPS) return next;
		const t = clamp(Number(pos), 0, 1);
		next.stops = next.stops.concat([{
			id: uid(),
			pos: isFinite(t) ? t : 0.5,
			color: hexOf(hex || sampleColor(next.stops, t, next.interpolate))
		}]);
		return next;
	}

	function setStop(params, id, patch) {
		const next = normalize(params);
		next.stops = next.stops.map(function (stop) {
			if (stop.id !== id) return stop;
			const pos = patch && patch.pos != null ? Number(patch.pos) : stop.pos;
			return {
				id: stop.id,
				pos: clamp(isFinite(pos) ? pos : stop.pos, 0, 1),
				color: patch && patch.color != null ? hexOf(patch.color) : stop.color
			};
		});
		return next;
	}

	function removeStop(params, id) {
		const next = normalize(params);
		if (next.stops.length <= 2) return next;
		const filtered = next.stops.filter(function (stop) {
			return stop.id !== id;
		});
		if (filtered.length >= 2) next.stops = filtered;
		return next;
	}

	function largestGapPos(stops) {
		const sorted = sortStops(stops);
		let bestAt = 0.5;
		let bestSpan = 0;
		if (!sorted.length) return bestAt;
		if (sorted[0].pos > bestSpan) {
			bestSpan = sorted[0].pos;
			bestAt = sorted[0].pos / 2;
		}
		for (let i = 1; i < sorted.length; i++) {
			const span = sorted[i].pos - sorted[i - 1].pos;
			if (span > bestSpan) {
				bestSpan = span;
				bestAt = sorted[i - 1].pos + span / 2;
			}
		}
		if (1 - sorted[sorted.length - 1].pos > bestSpan) {
			bestAt = (sorted[sorted.length - 1].pos + 1) / 2;
		}
		return bestAt;
	}

	root.SynthRamp = {
		maxStops: MAX_STOPS,
		lutSize: LUT_SIZE,
		defaults: DEFAULT_STOPS,
		normalize: normalize,
		sortStops: sortStops,
		sampleColor: sampleColor,
		cssGradient: cssGradient,
		lutKey: lutKey,
		paintLut: paintLut,
		addStop: addStop,
		setStop: setStop,
		removeStop: removeStop,
		largestGapPos: largestGapPos
	};

	root.SynthRegistry.register({
		type: 'ramp',
		name: 'Color Ramp',
		category: 'color',
		categoryLabel: 'Color',
		color: color,
		help: 'Maps luminance through a color ramp you author. Add notches on the 0–1 line, then drag them to place color. Phase slides the lookup, Period repeats it, Interpolate chooses a blend or a hard step between notches.',
		implemented: true,
		defaults: {
			stops: DEFAULT_STOPS.map(cloneStop),
			phase: 0,
			period: 1,
			interpolate: 'linear'
		},
		presets: [
			{
				id: 'ember',
				name: 'Ember',
				parameters: {
					stops: DEFAULT_STOPS.map(cloneStop),
					phase: 0,
					period: 1,
					interpolate: 'linear'
				}
			},
			{
				id: 'fire',
				name: 'Fire',
				parameters: {
					stops: [
						{ pos: 0, color: '#080000' },
						{ pos: 0.22, color: '#C41414' },
						{ pos: 0.55, color: '#FF7A00' },
						{ pos: 0.82, color: '#FFE14A' },
						{ pos: 1, color: '#FFF6D2' }
					],
					phase: 0,
					period: 1,
					interpolate: 'linear'
				}
			},
			{
				id: 'poster',
				name: 'Poster',
				parameters: {
					stops: [
						{ pos: 0, color: '#101014' },
						{ pos: 0.28, color: '#1A3A8C' },
						{ pos: 0.55, color: '#E23A2E' },
						{ pos: 0.78, color: '#F0C400' },
						{ pos: 1, color: '#F4F1EA' }
					],
					phase: 0,
					period: 1,
					interpolate: 'step'
				}
			},
			{
				id: 'steel',
				name: 'Steel',
				parameters: {
					stops: [
						{ pos: 0, color: '#07080C' },
						{ pos: 0.38, color: '#4C6A8A' },
						{ pos: 0.7, color: '#D8DEE9' },
						{ pos: 1, color: '#F6F7FA' }
					],
					phase: 0,
					period: 1,
					interpolate: 'linear'
				}
			}
		],
		params: [
			{ key: 'stops', label: 'Ramp', kind: 'ramp' },
			{ key: 'phase', label: 'Phase', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'period', label: 'Period', kind: 'range', min: 0, max: 8, step: 0.01 },
			{
				key: 'interpolate',
				label: 'Interpolate',
				kind: 'enum',
				options: [
					{ id: 'linear', label: 'Linear' },
					{ id: 'step', label: 'Step' }
				]
			}
		],
		randomize: function (params) {
			const n = 3 + Math.floor(Math.random() * 4);
			const stops = [];
			for (let i = 0; i < n; i++) {
				const pos = i === 0 ? 0 : i === n - 1 ? 1 : clamp((i / (n - 1)) + (Math.random() - 0.5) * 0.12, 0.04, 0.96);
				stops.push({
					id: 'n' + i,
					pos: pos,
					color: root.SynthColor ? root.SynthColor.random() : '#FFFFFF'
				});
			}
			params.stops = sortStops(stops);
			params.interpolate = Math.random() < 0.28 ? 'step' : 'linear';
		},
		create: function (engine) {
			let lut = null;
			let lastKey = '';

			function ensureLut(stops, interpolate) {
				const key = lutKey(stops, interpolate);
				if (!lut) {
					lut = createGraphics(LUT_SIZE, 1);
					lut.pixelDensity(1);
				}
				if (key !== lastKey) {
					paintLut(lut, stops, interpolate);
					lastKey = key;
				}
				return lut;
			}

			return {
				process: function (ctx) {
					const resolved = normalize(ctx.parameters);
					const tex = ensureLut(resolved.stops, resolved.interpolate);
					engine.drawTo(ctx.output, engine.shaders.ramp, {
						u_input: ctx.input,
						u_lut: tex,
						u_phase: resolved.phase,
						u_period: resolved.period
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
