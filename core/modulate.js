(function (root) {
	const SOURCES = ['time', 'bpm', 'fft'];
	const PLAY_MODES = ['loop', 'bounce', 'random'];
	const BANDS = ['low', 'mid', 'high'];
	const DURATION_MIN = 0.25;
	const DURATION_SLIDER_MAX = 30;
	const DURATION_MAX = 300;
	const BEATS_MIN = 1;
	const BEATS_MAX = 32;

	function clone(value) {
		return JSON.parse(JSON.stringify(value));
	}

	function clamp(value, min, max) {
		return Math.min(max, Math.max(min, value));
	}

	function snap(value, min, max, step) {
		step = step || 1;
		const stepped = Math.round((value - min) / step) * step + min;
		const out = clamp(stepped, min, max);
		if (step >= 1) return Math.round(out);
		const digits = step < 0.1 ? 2 : 1;
		return Number(out.toFixed(digits));
	}

	function unitHash(key) {
		let h = 2166136261;
		for (let i = 0; i < key.length; i += 1) {
			h ^= key.charCodeAt(i);
			h = Math.imul(h, 16777619);
		}
		return h >>> 0;
	}

	function random01(seed, cycle) {
		let t = unitHash(String(seed || 'mod')) ^ Math.imul(cycle, 0x9E3779B9);
		t = Math.imul(t ^ t >>> 15, t | 1);
		t ^= t + Math.imul(t ^ t >>> 7, t | 61);
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	}

	function playhead(linear, mode, seed) {
		const cycle = Math.floor(linear);
		const wrapped = linear - cycle;
		if (mode === 'bounce') {
			return cycle % 2 === 0 ? wrapped : 1 - wrapped;
		}
		if (mode === 'random') {
			return random01(seed, cycle);
		}
		return wrapped;
	}

	function driverT(mod, ctx, seed) {
		const source = SOURCES.indexOf(mod.source) >= 0 ? mod.source : 'time';
		const mode = PLAY_MODES.indexOf(mod.playMode) >= 0 ? mod.playMode : 'loop';
		const nowMs = ctx && ctx.nowMs != null ? ctx.nowMs : Date.now();

		if (source === 'fft') {
			const fft = (ctx && ctx.fft) || { low: 0, mid: 0, high: 0 };
			const band = BANDS.indexOf(mod.band) >= 0 ? mod.band : 'low';
			return clamp(Number(fft[band]) || 0, 0, 1);
		}

		if (source === 'bpm') {
			const clock = ctx && ctx.clock;
			const beats = Math.max(BEATS_MIN, Number(mod.beats) || 4);
			const elapsed = root.SynthClock ? root.SynthClock.beatsElapsed(clock, nowMs) : 0;
			if (mode === 'random') {
				return random01(seed, Math.floor(elapsed / beats));
			}
			return playhead(elapsed / beats, mode, seed);
		}

		const duration = clamp(Number(mod.duration) || 2, DURATION_MIN, DURATION_MAX);
		const linear = nowMs / 1000 / duration;
		if (mode === 'random') {
			return random01(seed, Math.floor(linear));
		}
		return playhead(linear, mode, seed);
	}

	function defaults(spec, current) {
		const min = spec && typeof spec.min === 'number' ? spec.min : 0;
		const max = spec && typeof spec.max === 'number' ? spec.max : 1;
		const step = (spec && spec.step) || 1;
		const value = current == null ? min : Number(current);
		const span = (max - min) * 0.4;
		let inMark = value - span / 2;
		let outMark = value + span / 2;
		if (inMark < min) {
			outMark += min - inMark;
			inMark = min;
		}
		if (outMark > max) {
			inMark -= outMark - max;
			outMark = max;
		}
		inMark = snap(inMark, min, max, step);
		outMark = snap(outMark, min, max, step);
		if (Math.abs(outMark - inMark) < step) {
			inMark = min;
			outMark = max;
		}
		return {
			enabled: true,
			source: 'time',
			inMark: inMark,
			outMark: outMark,
			duration: 2,
			beats: 4,
			playMode: 'loop',
			band: 'low'
		};
	}

	function normalize(raw, spec) {
		const base = defaults(spec, spec && spec.min);
		const mod = raw && typeof raw === 'object' ? raw : {};
		const min = spec && typeof spec.min === 'number' ? spec.min : 0;
		const max = spec && typeof spec.max === 'number' ? spec.max : 1;
		const step = (spec && spec.step) || 1;
		let beats = Number(mod.beats);
		if (!isFinite(beats) || beats < BEATS_MIN) beats = 4;
		beats = Math.round(beats);
		if (beats > BEATS_MAX) beats = BEATS_MAX;
		beats = Math.pow(2, Math.round(Math.log2(Math.max(BEATS_MIN, beats))));
		beats = clamp(beats, BEATS_MIN, BEATS_MAX);
		return {
			enabled: !!mod.enabled,
			source: SOURCES.indexOf(mod.source) >= 0 ? mod.source : base.source,
			inMark: snap(mod.inMark == null ? base.inMark : mod.inMark, min, max, step),
			outMark: snap(mod.outMark == null ? base.outMark : mod.outMark, min, max, step),
			duration: clamp(Number(mod.duration) || base.duration, DURATION_MIN, DURATION_MAX),
			beats: beats,
			playMode: PLAY_MODES.indexOf(mod.playMode) >= 0 ? mod.playMode : base.playMode,
			band: BANDS.indexOf(mod.band) >= 0 ? mod.band : base.band
		};
	}

	function evaluate(mod, spec, ctx, seed) {
		if (!mod || !mod.enabled || !spec || spec.kind === 'enum' || spec.kind === 'palette' || spec.kind === 'ramp' || spec.kind === 'color') return undefined;
		const t = driverT(mod, ctx, seed);
		const min = spec.min;
		const max = spec.max;
		const step = spec.step || 1;
		const inMark = snap(mod.inMark == null ? spec.min : mod.inMark, min, max, step);
		const outMark = snap(mod.outMark == null ? spec.max : mod.outMark, min, max, step);
		const value = inMark + t * (outMark - inMark);
		if (spec.kind === 'int') return snap(value, min, max, step);
		return clamp(value, min, max);
	}

	function specFor(type, key) {
		const def = root.SynthRegistry && root.SynthRegistry.get(type);
		if (!def) return null;
		const params = def.params || [];
		for (let i = 0; i < params.length; i += 1) {
			const spec = params[i];
			if (!spec) continue;
			if (spec.key === key) return spec;
			if (root.SynthParams && root.SynthParams.isVec(spec)) {
				const axes = root.SynthParams.expand(spec);
				for (let a = 0; a < axes.length; a += 1) {
					if (axes[a].key === key) return axes[a];
				}
			}
		}
		return null;
	}

	function resolveOp(op, ctx) {
		const params = Object.assign({}, (op && op.parameters) || {});
		const mods = (op && op.modulations) || {};
		Object.keys(mods).forEach(function (key) {
			const spec = specFor(op.type, key);
			const value = evaluate(mods[key], spec, ctx, op.id + ':' + key);
			if (value !== undefined) params[key] = value;
		});
		return params;
	}

	function usesFft(operators) {
		const list = operators || [];
		for (let i = 0; i < list.length; i += 1) {
			const mods = list[i] && list[i].modulations;
			if (!mods) continue;
			const keys = Object.keys(mods);
			for (let k = 0; k < keys.length; k += 1) {
				const mod = mods[keys[k]];
				if (mod && mod.enabled && mod.source === 'fft') return true;
			}
		}
		return false;
	}

	root.SynthModulate = {
		SOURCES: SOURCES,
		PLAY_MODES: PLAY_MODES,
		BANDS: BANDS,
		DURATION_MIN: DURATION_MIN,
		DURATION_SLIDER_MAX: DURATION_SLIDER_MAX,
		DURATION_MAX: DURATION_MAX,
		BEATS_MIN: BEATS_MIN,
		BEATS_MAX: BEATS_MAX,
		defaults: defaults,
		normalize: normalize,
		evaluate: evaluate,
		resolveOp: resolveOp,
		usesFft: usesFft,
		snap: snap,
		doubleBeats: function (beats) {
			return clamp((Number(beats) || 4) * 2, BEATS_MIN, BEATS_MAX);
		},
		halfBeats: function (beats) {
			return clamp(Math.round((Number(beats) || 4) / 2), BEATS_MIN, BEATS_MAX);
		},
		clone: clone
	};
})(window);
