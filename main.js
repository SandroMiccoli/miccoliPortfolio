(function () {
	const EDGE = 32;
	let uiApi = null;
	let panelOpen = false;
	let applyingRemote = false;
	let bootTimer = 0;
	let lastInfo = null;
	let bootShown = false;

	function inLab() {
		return document.body.classList.contains('lab-body');
	}

	function userPatch(patch) {
		if (applyingRemote) return;
		SynthState.patch(patch);
		SynthSync.sendPatch(patch);
	}

	function setPanel(open) {
		panelOpen = open;
		const panel = document.getElementById('ui-root');
		const handle = document.getElementById('synth-handle');
		if (panel) panel.classList.toggle('is-open', open);
		if (handle) {
			handle.classList.toggle('is-open', open);
			handle.setAttribute('aria-expanded', open ? 'true' : 'false');
			handle.setAttribute('aria-label', open ? 'Close controls' : 'Open controls');
		}
	}

	function setupGestures() {
		const panel = document.getElementById('ui-root');
		const handle = document.getElementById('synth-handle');
		if (!panel || !handle) return;

		let startX = null;
		let startOpen = false;
		let didSwipe = false;

		handle.addEventListener('click', function (event) {
			event.stopPropagation();
			if (didSwipe) {
				didSwipe = false;
				return;
			}
			setPanel(!panelOpen);
		});

		window.addEventListener('pointerdown', function (event) {
			if (event.pointerType === 'mouse' && event.button !== 0) return;
			if (event.target.closest && event.target.closest('.synth-panel')) return;
			const x = event.clientX;
			const w = window.innerWidth;
			const fromEdge = !panelOpen && x >= w - EDGE;
			const onHandle = event.target.closest && event.target.closest('#synth-handle');
			if (fromEdge || onHandle) {
				startX = x;
				startOpen = panelOpen;
			}
		});

		window.addEventListener('pointermove', function (event) {
			if (startX == null) return;
			const dx = event.clientX - startX;
			if (!startOpen && dx < -48) {
				didSwipe = true;
				setPanel(true);
			}
			if (startOpen && dx > 48) {
				didSwipe = true;
				setPanel(false);
			}
		});

		window.addEventListener('pointerup', function () {
			startX = null;
		});
		window.addEventListener('pointercancel', function () {
			startX = null;
		});
	}

	function hideBoot() {
		const overlay = document.getElementById('boot-overlay');
		if (overlay) overlay.hidden = true;
		if (bootTimer) {
			clearTimeout(bootTimer);
			bootTimer = 0;
		}
		const qrBtn = document.getElementById('qr-btn');
		if (qrBtn && lastInfo) qrBtn.hidden = false;
	}

	function showBoot(info) {
		if (inLab()) return;
		lastInfo = info;
		const overlay = document.getElementById('boot-overlay');
		const urlEl = document.getElementById('boot-url');
		const qrEl = document.getElementById('boot-qr');
		if (!overlay || !urlEl || !qrEl) return;

		const lines = [info.url, info.ipOrigin].filter(function (line, i, arr) {
			return line && arr.indexOf(line) === i;
		});
		urlEl.textContent = lines.join('\n') || 'http://visual.local';
		qrEl.innerHTML = '';
		if (typeof QRCode === 'function' && (info.controlUrl || info.url)) {
			new QRCode(qrEl, {
				text: info.controlUrl || info.url,
				width: 176,
				height: 176,
				colorDark: '#000000',
				colorLight: '#ffffff',
				correctLevel: QRCode.CorrectLevel.M
			});
		}

		overlay.hidden = false;
		if (bootTimer) clearTimeout(bootTimer);
		bootTimer = setTimeout(hideBoot, 8000);
	}

	function setupBoot() {
		const overlay = document.getElementById('boot-overlay');
		const qrBtn = document.getElementById('qr-btn');
		if (overlay) {
			overlay.addEventListener('click', hideBoot);
		}
		if (qrBtn) {
			qrBtn.addEventListener('click', function () {
				if (lastInfo) showBoot(lastInfo);
			});
		}
	}

	function syncCamera(state) {
		if (state.camera.enabled) {
			SynthCamera.start(function () {
				userPatch({ camera: { enabled: false } });
			});
		} else {
			SynthCamera.stop();
		}
	}

	function setup() {
		const parent = document.getElementById('app') || document.body;
		setAttributes('antialias', false);
		const canvas = createCanvas(windowWidth, windowHeight, WEBGL);
		canvas.parent(parent);
		pixelDensity(1);
		frameRate(30);

		SynthEngine.init();

		uiApi = SynthUI.mount(document.getElementById('ui-root'), {
			getState: function () {
				return SynthState.get();
			},
			patch: userPatch
		});

		SynthState.subscribe(function (state) {
			if (uiApi) uiApi.refresh();
			syncCamera(state);
		});

		setupGestures();
		setupBoot();
		setPanel(false);
		syncCamera(SynthState.get());

		SynthSync.connect({
			role: 'display',
			onState: function (state) {
				applyingRemote = true;
				SynthState.replace(state);
				applyingRemote = false;
			},
			onInfo: function (info) {
				if (!bootShown) {
					bootShown = true;
					showBoot(info);
				} else {
					lastInfo = info;
					const qrBtn = document.getElementById('qr-btn');
					if (qrBtn) qrBtn.hidden = false;
				}
			}
		});
	}

	function draw() {
		SynthEngine.draw(SynthState.get(), millis() / 1000);
	}

	function windowResized() {
		resizeCanvas(windowWidth, windowHeight);
	}

	window.setup = setup;
	window.draw = draw;
	window.windowResized = windowResized;
})();
