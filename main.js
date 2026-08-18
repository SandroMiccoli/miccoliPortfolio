(function () {
	const EDGE = 48;
	const BOOT_MS = 10000;
	const CHROME_IDLE_MS = 2800;
	let uiApi = null;
	let panelOpen = false;
	let applyingRemote = false;
	let bootTimer = 0;
	let lastInfo = null;
	let bootShown = false;
	let chromeTimer = 0;
	let lastFpsSent = 0;
	let cameraAnnouncedOn = false;

	function inLab() {
		return document.body.classList.contains('lab-body');
	}

	function notifyAll(level, message) {
		if (window.SynthNotify) SynthNotify.show(level, message);
		SynthSync.sendNotify(level, message);
	}

	function userPatch(patch) {
		if (applyingRemote) return;
		SynthState.patch(patch);
		SynthSync.sendPatch(patch);
	}

	function bootIsUp() {
		const overlay = document.getElementById('boot-overlay');
		return overlay && !overlay.hidden && !overlay.classList.contains('is-leaving');
	}

	function setPanel(open) {
		panelOpen = open;
		const panel = document.getElementById('ui-root');
		if (panel) panel.classList.toggle('is-open', open);
		if (open) revealChrome(true);
		else revealChrome();
	}

	function revealChrome(keep) {
		if (bootIsUp()) return;
		document.body.classList.add('is-chrome-visible');
		const qrBtn = document.getElementById('qr-btn');
		if (qrBtn && lastInfo) qrBtn.hidden = false;
		clearTimeout(chromeTimer);
		if (keep || panelOpen) return;
		chromeTimer = setTimeout(function () {
			if (!panelOpen) document.body.classList.remove('is-chrome-visible');
		}, CHROME_IDLE_MS);
	}

	function setupIdleChrome() {
		window.addEventListener('pointermove', function () {
			if (bootIsUp()) return;
			revealChrome();
		});
		window.addEventListener('pointerdown', function (event) {
			if (event.target.closest && event.target.closest('#boot-overlay')) return;
			if (bootIsUp()) return;
			revealChrome();
		});
	}

	function setupGestures() {
		const panel = document.getElementById('ui-root');
		if (!panel) return;

		let startX = null;
		let startY = null;
		let startOpen = false;
		let didSwipe = false;

		window.addEventListener('pointerdown', function (event) {
			if (event.pointerType === 'mouse' && event.button !== 0) return;
			if (event.target.closest && event.target.closest('.synth-panel')) return;
			if (bootIsUp()) return;
			const x = event.clientX;
			const w = window.innerWidth;
			if (x >= w - EDGE || panelOpen) {
				startX = x;
				startY = event.clientY;
				startOpen = panelOpen;
				didSwipe = false;
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

		window.addEventListener('pointerup', function (event) {
			if (startX == null) {
				return;
			}
			const dx = Math.abs(event.clientX - startX);
			const dy = Math.abs(event.clientY - startY);
			const onRight = event.clientX >= window.innerWidth - EDGE;
			if (!didSwipe && onRight && dx < 12 && dy < 12) {
				setPanel(!panelOpen);
			}
			startX = null;
		});
		window.addEventListener('pointercancel', function () {
			startX = null;
		});

		window.addEventListener('keydown', function (event) {
			if (event.key !== 'u' && event.key !== 'U') return;
			const tag = event.target && event.target.tagName;
			if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
			event.preventDefault();
			setPanel(!panelOpen);
		});
	}

	function hideBoot() {
		const overlay = document.getElementById('boot-overlay');
		if (!overlay || overlay.hidden) return;
		if (bootTimer) {
			clearTimeout(bootTimer);
			bootTimer = 0;
		}
		overlay.classList.add('is-leaving');
		let done = false;
		function finish() {
			if (done) return;
			done = true;
			overlay.removeEventListener('transitionend', finish);
			overlay.hidden = true;
			overlay.classList.remove('is-leaving');
		}
		overlay.addEventListener('transitionend', finish);
		setTimeout(finish, 1000);
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
		urlEl.textContent = lines.join('\n') || 'http://visual-synth.local:8080';
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

		overlay.classList.remove('is-leaving');
		overlay.hidden = false;
		if (bootTimer) clearTimeout(bootTimer);
		bootTimer = setTimeout(hideBoot, BOOT_MS);
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

	function setDebugHud(on) {
		const hud = document.getElementById('debug-hud');
		if (hud) hud.hidden = !on;
	}

	function updateDebugHud(stats) {
		const fpsEl = document.getElementById('debug-fps');
		const tempEl = document.getElementById('debug-temp');
		const meters = window.SynthMeters;
		if (fpsEl && stats.fps != null) {
			fpsEl.textContent = Number(stats.fps).toFixed(1);
			if (meters) meters.apply(fpsEl, meters.fpsTone(stats.fps));
		}
		if (tempEl && Object.prototype.hasOwnProperty.call(stats, 'tempC')) {
			if (stats.tempC == null) {
				tempEl.textContent = '-';
				if (meters) meters.apply(tempEl, '');
			} else {
				tempEl.textContent = Number(stats.tempC).toFixed(1) + '°C';
				if (meters) meters.apply(tempEl, meters.tempTone(stats.tempC));
			}
		}
		if (uiApi && uiApi.refreshStats) uiApi.refreshStats(stats);
	}

	function syncCamera(state) {
		if (state.camera.enabled) {
			if (SynthCamera.ready() || SynthCamera.isStarting()) return;
			notifyAll('warning', 'Opening camera…');
			SynthCamera.start(function (err) {
				cameraAnnouncedOn = false;
				notifyAll('error', (err && err.message) || 'Camera failed');
				userPatch({ camera: { enabled: false, connected: false } });
			}, function () {
				cameraAnnouncedOn = true;
				notifyAll('success', 'Camera on');
				userPatch({ camera: { connected: true } });
			});
		} else {
			const wasLive = SynthCamera.ready() || SynthCamera.isStarting() || cameraAnnouncedOn;
			SynthCamera.stop();
			if (wasLive && cameraAnnouncedOn) {
				notifyAll('success', 'Camera off');
			}
			cameraAnnouncedOn = false;
			if (state.camera.connected) {
				userPatch({ camera: { connected: false } });
			}
		}
	}

	function setup() {
		const parent = document.getElementById('app') || document.body;
		setAttributes('antialias', false);
		const canvas = createCanvas(windowWidth, windowHeight, WEBGL);
		canvas.parent(parent);
		pixelDensity(1);
		frameRate(30);
		noCursor();

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
			setDebugHud(!!(state.debug && state.debug.enabled));
		});

		setupGestures();
		setupIdleChrome();
		setupBoot();
		setPanel(false);
		setDebugHud(false);
		syncCamera(SynthState.get());

		SynthSync.connect({
			role: 'display',
			onState: function (state) {
				applyingRemote = true;
				SynthState.replace(state);
				applyingRemote = false;
			},
			onInfo: function (info) {
				lastInfo = info;
				if (!bootShown) {
					bootShown = true;
					showBoot(info);
				}
			},
			onNotify: function (level, message) {
				if (window.SynthNotify) SynthNotify.show(level, message);
			},
			onStats: function (stats) {
				updateDebugHud(stats);
			}
		});
	}

	function draw() {
		noCursor();
		const state = SynthState.get();
		SynthEngine.draw(state, millis() / 1000);
		if (state.debug && state.debug.enabled) {
			const fps = frameRate();
			updateDebugHud({ fps: fps });
			if (millis() - lastFpsSent > 500) {
				lastFpsSent = millis();
				SynthSync.sendStats(fps);
			}
		}
	}

	function windowResized() {
		resizeCanvas(windowWidth, windowHeight);
	}

	window.setup = setup;
	window.draw = draw;
	window.windowResized = windowResized;
})();
