(function (root) {
	const FPS_SAMPLES = 45;
	let frameEl = null;
	let canvasElt = null;
	let gpuOk = false;
	let engineReady = false;
	let live = false;
	let placed = false;
	let recordW = 0;
	let recordH = 0;
	let baseDensity = 1;
	const fpsDts = [];
	let lastDrawAt = 0;

	function resetFps() {
		fpsDts.length = 0;
		lastDrawAt = 0;
	}

	function noteFrame() {
		const now = (root.performance && performance.now) ? performance.now() : Date.now();
		if (lastDrawAt > 0) {
			const dt = now - lastDrawAt;
			if (dt >= 8 && dt <= 220) {
				fpsDts.push(dt);
				if (fpsDts.length > FPS_SAMPLES) fpsDts.shift();
			}
		}
		lastDrawAt = now;
	}

	function smoothFps() {
		if (fpsDts.length < 8) return 0;
		const sorted = fpsDts.slice().sort(function (a, b) {
			return a - b;
		});
		const drop = Math.max(1, Math.floor(sorted.length * 0.12));
		const slice = sorted.slice(0, sorted.length - drop);
		let sum = 0;
		for (let i = 0; i < slice.length; i += 1) sum += slice[i];
		return 1000 / (sum / slice.length);
	}

	function markHost(on) {
		const host = frameEl && frameEl.closest('.synth-preview');
		if (host) host.classList.toggle('is-gpu', !!on);
		if (canvasElt) canvasElt.style.visibility = on ? 'visible' : 'hidden';
	}

	function fitCanvas() {
		if (!frameEl || !gpuOk || typeof resizeCanvas !== 'function') return;
		const w = recordW > 0
			? recordW
			: Math.max(2, Math.floor(frameEl.clientWidth));
		const h = recordH > 0
			? recordH
			: Math.max(2, Math.floor(frameEl.clientHeight));
		if (w === width && h === height) return;
		resizeCanvas(w, h);
		if (root.SynthEngine && SynthEngine.resize) SynthEngine.resize();
		if (live && typeof redraw === 'function') redraw();
	}

	function placeCanvas() {
		if (!frameEl || !canvasElt || placed) {
			if (frameEl && canvasElt && placed) fitCanvas();
			return;
		}
		frameEl.appendChild(canvasElt);
		placed = true;
		canvasElt.style.visibility = 'hidden';
		fitCanvas();
		if (root.ResizeObserver) {
			new ResizeObserver(function () {
				if (live) fitCanvas();
			}).observe(frameEl);
		}
	}

	function setLive(on) {
		live = !!on;
		resetFps();
		markHost(live);
		if (!gpuOk) return;
		if (live) {
			fitCanvas();
			if (typeof frameRate === 'function') frameRate(30);
			if (typeof loop === 'function') loop();
			if (typeof redraw === 'function') redraw();
			return;
		}
		if (typeof noLoop === 'function') noLoop();
	}

	root.SynthPreview = {
		attach: function (frame) {
			frameEl = frame;
			if (gpuOk) placeCanvas();
		},
		setLive: setLive,
		canvas: function () {
			return canvasElt;
		},
		setRecordSize: function (w, h) {
			recordW = w > 0 ? Math.floor(w) : 0;
			recordH = h > 0 ? Math.floor(h) : 0;
			if (typeof pixelDensity === 'function') {
				pixelDensity(recordW > 0 ? 1 : baseDensity);
			}
			if (live) fitCanvas();
		},
		active: function () {
			return gpuOk;
		},
		running: function () {
			return live && gpuOk;
		},
		nudge: function () {
			if (!gpuOk || !live) return;
			if (typeof redraw === 'function') redraw();
		},
		localFps: function () {
			if (!live || !gpuOk) return 0;
			return smoothFps();
		}
	};

	root.setup = function () {
		if (typeof p5 !== 'undefined') p5.disableFriendlyErrors = true;
		setAttributes('antialias', false);
		setAttributes('alpha', false);
		setAttributes('preserveDrawingBuffer', true);
		try {
			const canvas = createCanvas(2, 2, WEBGL);
			canvasElt = canvas.elt;
			canvasElt.style.pointerEvents = 'none';
			canvasElt.style.visibility = 'hidden';
			canvasElt.setAttribute('aria-hidden', 'true');
			baseDensity = Math.min(2, window.devicePixelRatio || 1);
			pixelDensity(recordW > 0 ? 1 : baseDensity);
			if (root.SynthEngine && SynthEngine.init) SynthEngine.init();
			engineReady = true;
			gpuOk = true;
		} catch (err) {
			gpuOk = false;
			return;
		}
		noLoop();
		if (frameEl) placeCanvas();
		if (live) setLive(true);
	};

	root.draw = function () {
		if (!engineReady || !live || !root.SynthEngine || !root.SynthState) return;
		noteFrame();
		try {
			SynthEngine.draw(SynthState.get(), millis() / 1000, { preview: true });
		} catch (err) {}
	};

	root.windowResized = function () {
		if (live) fitCanvas();
	};

	root.touchStarted = function () { return true; };
	root.touchMoved = function () { return true; };
	root.touchEnded = function () { return true; };
	root.mousePressed = function () { return true; };
	root.mouseWheel = function () { return true; };
})(window);
