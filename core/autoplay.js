(function (root) {
	const MODES = ['sequential', 'inverse', 'random'];
	const UNITS = ['seconds', 'bars'];
	const BAR_STEPS = [1, 2, 4, 8];
	const BAR_MIN = 1;
	const BAR_MAX = 32;
	const SEC_MIN = 2;
	const SEC_MAX = 60;
	const SEC_DEFAULT = 8;
	const BAR_DEFAULT = 4;

	function defaults() {
		return {
			enabled: false,
			mode: 'sequential',
			unit: 'seconds',
			intervalSec: SEC_DEFAULT,
			intervalBars: BAR_DEFAULT,
			lastSwitchMs: 0,
			shuffleQueue: []
		};
	}

	function clampSec(value) {
		const n = Math.round(Number(value) || 0);
		return Math.min(SEC_MAX, Math.max(SEC_MIN, n));
	}

	function clampBars(value) {
		const n = Math.round(Number(value) || 0);
		return Math.min(BAR_MAX, Math.max(BAR_MIN, n));
	}

	function normalize(raw) {
		const base = defaults();
		const src = raw && typeof raw === 'object' ? raw : {};
		const mode = String(src.mode || base.mode);
		const unit = String(src.unit || base.unit);
		const queue = Array.isArray(src.shuffleQueue)
			? src.shuffleQueue.map(String).filter(Boolean)
			: [];
		return {
			enabled: !!src.enabled,
			mode: MODES.indexOf(mode) >= 0 ? mode : base.mode,
			unit: UNITS.indexOf(unit) >= 0 ? unit : base.unit,
			intervalSec: clampSec(src.intervalSec != null ? src.intervalSec : base.intervalSec),
			intervalBars: clampBars(src.intervalBars != null ? src.intervalBars : base.intervalBars),
			lastSwitchMs: Number(src.lastSwitchMs) || 0,
			shuffleQueue: queue
		};
	}

	function pipeIds(state) {
		return ((state && state.pipes) || []).map(function (pipe) {
			return pipe && pipe.id ? String(pipe.id) : '';
		}).filter(Boolean);
	}

	function canRun(state) {
		return pipeIds(state).length >= 2;
	}

	function shuffle(ids) {
		const out = (ids || []).slice();
		for (let i = out.length - 1; i > 0; i -= 1) {
			const j = Math.floor(Math.random() * (i + 1));
			const tmp = out[i];
			out[i] = out[j];
			out[j] = tmp;
		}
		return out;
	}

	function refillQueue(ids, currentId) {
		const bag = shuffle(ids);
		if (bag.length > 1 && bag[0] === currentId) bag.push(bag.shift());
		return bag;
	}

	function nextSequential(ids, currentId, dir) {
		const n = ids.length;
		if (n < 2) return currentId;
		let i = ids.indexOf(currentId);
		if (i < 0) i = 0;
		return ids[(i + dir + n) % n];
	}

	function nextRandom(ids, currentId, queue) {
		const live = {};
		ids.forEach(function (id) {
			live[id] = true;
		});
		let rest = (queue || []).filter(function (id) {
			return live[id] && id !== currentId;
		});
		if (!rest.length) {
			rest = refillQueue(ids, currentId).filter(function (id) {
				return id !== currentId;
			});
		}
		if (!rest.length) {
			return { id: currentId, queue: [] };
		}
		return { id: rest[0], queue: rest.slice(1) };
	}

	function nextStep(state) {
		const ids = pipeIds(state);
		if (ids.length < 2) return null;
		const ap = normalize(state && state.autoplay);
		const current = state && state.activePipeId ? String(state.activePipeId) : ids[0];
		if (ap.mode === 'inverse') {
			return { id: nextSequential(ids, current, -1), queue: [] };
		}
		if (ap.mode === 'random') {
			return nextRandom(ids, current, ap.shuffleQueue);
		}
		return { id: nextSequential(ids, current, 1), queue: [] };
	}

	function beatsSince(state, fromMs, nowMs) {
		if (!root.SynthClock) return 0;
		const clock = root.SynthClock.fromState(state);
		const beatMs = root.SynthClock.beatMs(clock);
		if (!(beatMs > 0)) return 0;
		const start = Number(fromMs) || 0;
		const now = nowMs == null ? Date.now() : nowMs;
		return Math.max(0, (now - start) / beatMs);
	}

	function durationMs(state) {
		const ap = normalize(state && state.autoplay);
		if (ap.unit === 'bars') {
			if (!root.SynthClock) return ap.intervalBars * 2000;
			const clock = root.SynthClock.fromState(state);
			return ap.intervalBars * root.SynthClock.BEATS_PER_BAR * root.SynthClock.beatMs(clock);
		}
		return ap.intervalSec * 1000;
	}

	function progress(state, nowMs) {
		const ap = normalize(state && state.autoplay);
		if (!ap.enabled || !canRun(state)) return 0;
		const now = nowMs == null ? Date.now() : nowMs;
		const start = ap.lastSwitchMs > 0 ? ap.lastSwitchMs : now;
		if (ap.unit === 'bars') {
			const need = ap.intervalBars * (root.SynthClock ? root.SynthClock.BEATS_PER_BAR : 4);
			if (!(need > 0)) return 0;
			return Math.min(1, beatsSince(state, start, now) / need);
		}
		const dur = durationMs(state);
		if (!(dur > 0)) return 0;
		return Math.min(1, Math.max(0, (now - start) / dur));
	}

	function isDue(state, nowMs) {
		const ap = normalize(state && state.autoplay);
		if (!ap.enabled || !canRun(state)) return false;
		if (state && state.previewTemplateId) return false;
		return progress(state, nowMs) >= 1;
	}

	function startPatch(state, nowMs) {
		const ap = normalize(state && state.autoplay);
		if (!canRun(state)) {
			return { autoplay: { enabled: false } };
		}
		const ids = pipeIds(state);
		const current = state && state.activePipeId ? String(state.activePipeId) : '';
		const queue = ap.mode === 'random'
			? refillQueue(ids, current).filter(function (id) {
				return id !== current;
			})
			: [];
		return {
			autoplay: {
				enabled: true,
				lastSwitchMs: nowMs == null ? Date.now() : nowMs,
				shuffleQueue: queue
			}
		};
	}

	function stopPatch() {
		return { autoplay: { enabled: false } };
	}

	function advancePatch(state, nowMs) {
		const step = nextStep(state);
		if (!step || !step.id) return null;
		if (state && step.id === state.activePipeId && !(pipeIds(state).length > 1)) return null;
		if (state && step.id === state.activePipeId) return null;
		return {
			activePipeId: step.id,
			autoplay: {
				lastSwitchMs: nowMs == null ? Date.now() : nowMs,
				shuffleQueue: step.queue || []
			}
		};
	}

	function bumpTimer(nowMs, extra) {
		const patch = {
			autoplay: Object.assign({
				lastSwitchMs: nowMs == null ? Date.now() : nowMs
			}, extra || {})
		};
		return patch;
	}

	function manualSelectPatch(state, id, nowMs) {
		const ap = normalize(state && state.autoplay);
		if (!ap.enabled) return null;
		const extra = {};
		if (ap.mode === 'random') {
			const ids = pipeIds(state);
			const chosen = String(id || '');
			extra.shuffleQueue = (ap.shuffleQueue || []).filter(function (item) {
				return item !== chosen && ids.indexOf(item) >= 0;
			});
		}
		return bumpTimer(nowMs, extra);
	}

	function modePatch(state, mode, nowMs) {
		const ap = normalize(state && state.autoplay);
		const next = MODES.indexOf(mode) >= 0 ? mode : ap.mode;
		const ids = pipeIds(state);
		const current = state && state.activePipeId ? String(state.activePipeId) : '';
		const patch = { mode: next, shuffleQueue: [] };
		if (next === 'random') {
			patch.shuffleQueue = refillQueue(ids, current).filter(function (id) {
				return id !== current;
			});
		}
		if (ap.enabled) patch.lastSwitchMs = ap.lastSwitchMs || (nowMs == null ? Date.now() : nowMs);
		return { autoplay: patch };
	}

	function unitPatch(state, unit, nowMs) {
		const ap = normalize(state && state.autoplay);
		const next = UNITS.indexOf(unit) >= 0 ? unit : ap.unit;
		const patch = { unit: next };
		if (ap.enabled) patch.lastSwitchMs = nowMs == null ? Date.now() : nowMs;
		return { autoplay: patch };
	}

	function nudgeIntervalPatch(state, dir, nowMs) {
		const ap = normalize(state && state.autoplay);
		const patch = {};
		const step = dir < 0 ? -1 : 1;
		if (ap.unit === 'bars') {
			const i = BAR_STEPS.indexOf(ap.intervalBars);
			if (i >= 0) {
				const idx = Math.max(0, Math.min(BAR_STEPS.length - 1, i + step));
				patch.intervalBars = BAR_STEPS[idx];
			} else {
				patch.intervalBars = clampBars(ap.intervalBars + step);
			}
		} else {
			patch.intervalSec = clampSec(ap.intervalSec + step);
		}
		if (ap.enabled) patch.lastSwitchMs = nowMs == null ? Date.now() : nowMs;
		return { autoplay: patch };
	}

	function setIntervalPatch(state, value, nowMs) {
		const ap = normalize(state && state.autoplay);
		const patch = {};
		if (ap.unit === 'bars') patch.intervalBars = clampBars(value);
		else patch.intervalSec = clampSec(value);
		if (ap.enabled) patch.lastSwitchMs = nowMs == null ? Date.now() : nowMs;
		return { autoplay: patch };
	}

	function intervalLabel(autoplay) {
		const ap = normalize(autoplay);
		if (ap.unit === 'bars') {
			return ap.intervalBars + (ap.intervalBars === 1 ? ' bar' : ' bars');
		}
		return ap.intervalSec + ' s';
	}

	root.SynthAutoplay = {
		MODES: MODES,
		UNITS: UNITS,
		BAR_STEPS: BAR_STEPS,
		BAR_MIN: BAR_MIN,
		BAR_MAX: BAR_MAX,
		SEC_MIN: SEC_MIN,
		SEC_MAX: SEC_MAX,
		defaults: defaults,
		normalize: normalize,
		canRun: canRun,
		pipeIds: pipeIds,
		progress: progress,
		isDue: isDue,
		durationMs: durationMs,
		startPatch: startPatch,
		stopPatch: stopPatch,
		advancePatch: advancePatch,
		manualSelectPatch: manualSelectPatch,
		modePatch: modePatch,
		unitPatch: unitPatch,
		nudgeIntervalPatch: nudgeIntervalPatch,
		setIntervalPatch: setIntervalPatch,
		intervalLabel: intervalLabel
	};
})(window);
