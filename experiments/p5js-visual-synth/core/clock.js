(function (root) {
	const BPM_MIN = 40;
	const BPM_MAX = 240;
	const TAP_RESET_MS = 2000;
	const TAP_MAX = 8;
	const BEATS_PER_BAR = 4;

	const taps = [];

	function clampBpm(value) {
		const n = Math.round(Number(value) || 0);
		return Math.min(BPM_MAX, Math.max(BPM_MIN, n));
	}

	function normalize(raw) {
		const clock = raw && typeof raw === 'object' ? raw : {};
		return {
			bpm: clampBpm(clock.bpm || 120),
			originMs: Number(clock.originMs) || Date.now()
		};
	}

	function elapsedMs(clock, nowMs) {
		const origin = Number(clock && clock.originMs) || 0;
		const now = nowMs == null ? Date.now() : nowMs;
		return Math.max(0, now - origin);
	}

	function beatMs(clock) {
		return 60000 / (clock && clock.bpm ? clock.bpm : 120);
	}

	function beatsElapsed(clock, nowMs) {
		return elapsedMs(clock, nowMs) / beatMs(clock);
	}

	root.SynthClock = {
		BEATS_PER_BAR: BEATS_PER_BAR,
		BPM_MIN: BPM_MIN,
		BPM_MAX: BPM_MAX,

		defaults: function () {
			return { bpm: 120, originMs: Date.now() };
		},

		fromState: function (state) {
			return normalize(state && state.clock);
		},

		beatMs: beatMs,
		beatsElapsed: beatsElapsed,

		beatInBar: function (clock, nowMs) {
			const beats = beatsElapsed(clock, nowMs);
			return Math.floor(beats) % BEATS_PER_BAR;
		},

		beatPhase: function (clock, nowMs) {
			const beats = beatsElapsed(clock, nowMs);
			return beats - Math.floor(beats);
		},

		sync: function (clock, nowMs) {
			const next = normalize(clock);
			next.originMs = nowMs == null ? Date.now() : nowMs;
			return next;
		},

		tap: function (clock, nowMs) {
			const now = nowMs == null ? Date.now() : nowMs;
			const prev = normalize(clock);
			if (taps.length && now - taps[taps.length - 1] > TAP_RESET_MS) {
				taps.length = 0;
			}
			taps.push(now);
			if (taps.length > TAP_MAX) taps.shift();

			if (taps.length < 2) {
				return {
					bpm: prev.bpm,
					originMs: prev.originMs,
					taps: taps.length
				};
			}

			let sum = 0;
			for (let i = 1; i < taps.length; i += 1) {
				sum += taps[i] - taps[i - 1];
			}
			const avg = sum / (taps.length - 1);
			const bpm = clampBpm(60000 / avg);
			const phaseBeats = beatsElapsed(prev, now);
			return {
				bpm: bpm,
				originMs: now - phaseBeats * (60000 / bpm),
				taps: taps.length
			};
		}
	};
})(window);
