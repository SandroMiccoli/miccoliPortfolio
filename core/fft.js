(function (root) {
	const FFT_SIZE = 1024;
	const SMOOTH = 0.72;
	const GAIN = { low: 3.4, mid: 2.6, high: 2.8 };
	const BANDS = {
		low: [20, 160],
		mid: [160, 2000],
		high: [2000, 8000]
	};

	let ctx = null;
	let analyser = null;
	let source = null;
	let stream = null;
	let data = null;
	let raf = 0;
	let starting = null;
	let blocked = false;
	let broadcast = null;
	let lastPacked = '';
	let lastSent = 0;

	const local = { low: 0, mid: 0, high: 0 };
	const remote = { low: 0, mid: 0, high: 0, at: 0 };

	function clamp01(value) {
		return Math.min(1, Math.max(0, value));
	}

	function bandLevel(bytes, sampleRate, range) {
		if (!bytes || !bytes.length) return 0;
		const binHz = sampleRate / FFT_SIZE;
		const i0 = Math.max(0, Math.floor(range[0] / binHz));
		const i1 = Math.min(bytes.length - 1, Math.ceil(range[1] / binHz));
		let sum = 0;
		let n = 0;
		for (let i = i0; i <= i1; i += 1) {
			sum += bytes[i] / 255;
			n += 1;
		}
		return n ? sum / n : 0;
	}

	function read() {
		if (!analyser || !data) return;
		analyser.getByteFrequencyData(data);
		const rate = (ctx && ctx.sampleRate) || 44100;
		['low', 'mid', 'high'].forEach(function (name) {
			const raw = bandLevel(data, rate, BANDS[name]);
			const boosted = clamp01(raw * GAIN[name]);
			local[name] = local[name] * SMOOTH + boosted * (1 - SMOOTH);
		});
		if (typeof broadcast === 'function') {
			const now = Date.now();
			const packed = local.low.toFixed(2) + ',' + local.mid.toFixed(2) + ',' + local.high.toFixed(2);
			if (now - lastSent < 50) return;
			if (packed === lastPacked && now - lastSent < 180) return;
			lastSent = now;
			lastPacked = packed;
			broadcast({ low: local.low, mid: local.mid, high: local.high });
		}
	}

	function loop() {
		read();
		raf = window.requestAnimationFrame(loop);
	}

	function stop() {
		if (raf) {
			window.cancelAnimationFrame(raf);
			raf = 0;
		}
		if (source) {
			try { source.disconnect(); } catch (err) { /* ignore */ }
			source = null;
		}
		if (stream) {
			stream.getTracks().forEach(function (track) {
				track.stop();
			});
			stream = null;
		}
		if (ctx && ctx.state !== 'closed' && typeof ctx.close === 'function') {
			ctx.close().catch(function () { /* ignore */ });
		}
		ctx = null;
		analyser = null;
		data = null;
		starting = null;
		local.low = local.mid = local.high = 0;
	}

	function start(retry) {
		if (retry) blocked = false;
		if (analyser) return Promise.resolve(true);
		if (starting) return starting;
		if (blocked) return Promise.reject(new Error('Microphone unavailable'));
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			return Promise.reject(new Error('No microphone API'));
		}
		starting = navigator.mediaDevices.getUserMedia({
			audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
			video: false
		}).catch(function () {
			return navigator.mediaDevices.getUserMedia({ audio: true, video: false });
		}).then(function (mic) {
			stream = mic;
			const AC = window.AudioContext || window.webkitAudioContext;
			ctx = new AC();
			analyser = ctx.createAnalyser();
			analyser.fftSize = FFT_SIZE;
			analyser.smoothingTimeConstant = 0.45;
			data = new Uint8Array(analyser.frequencyBinCount);
			source = ctx.createMediaStreamSource(stream);
			source.connect(analyser);
			if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
				return ctx.resume();
			}
			return undefined;
		}).then(function () {
			starting = null;
			if (!raf) loop();
			return true;
		}).catch(function (err) {
			starting = null;
			blocked = true;
			stop();
			throw err;
		});
		return starting;
	}

	root.SynthFft = {
		start: start,
		stop: stop,
		ensure: function () {
			if (blocked && !analyser) return Promise.resolve(false);
			return start().catch(function () {
				return false;
			});
		},
		running: function () {
			return !!analyser;
		},
		setBroadcast: function (fn) {
			broadcast = typeof fn === 'function' ? fn : null;
		},
		setRemote: function (levels) {
			if (!levels) return;
			remote.low = clamp01(Number(levels.low) || 0);
			remote.mid = clamp01(Number(levels.mid) || 0);
			remote.high = clamp01(Number(levels.high) || 0);
			remote.at = Date.now();
		},
		levels: function () {
			if (Date.now() - remote.at < 400) {
				return { low: remote.low, mid: remote.mid, high: remote.high };
			}
			return { low: local.low, mid: local.mid, high: local.high };
		}
	};
})(window);
