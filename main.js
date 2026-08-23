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
	let thumbDirty = true;
	let thumbDue = 0;
	let watchPipeId = '';
	let watchVis = '';
	let watchCam = '';
	let capturingThumb = false;
	let livePreview = false;
	let liveThumbAge = 0;
	let camThumbTries = 0;
	let tplThumbDue = 0;
	let tplThumbForce = false;

	function inLab() {
		return document.body.classList.contains('lab-body');
	}

	function userPatch(patch) {
		if (applyingRemote) return;
		SynthState.patch(patch);
		SynthSync.sendPatch(patch);
		if (patch.presets && window.SynthPresets) {
			SynthPresets.syncDisk(SynthState.get().presets);
		}
		if ((patch.templates || patch.templateThumb || patch.templateOps) && window.SynthTemplates) {
			SynthTemplates.syncDisk(SynthState.get().templates);
		}
	}

	function requestThumb(immediate) {
		thumbDirty = true;
		thumbDue = immediate ? 0 : millis() + 180;
	}

	function cameraKey() {
		return window.SynthCamera && SynthCamera.signature ? SynthCamera.signature() : '';
	}

	function liveCameraOps(pipe) {
		return ((pipe && pipe.operators) || []).filter(function (op) {
			return op.type === 'camera' && !op.bypassed;
		});
	}

	function cameraNotReady(pipe) {
		const ops = liveCameraOps(pipe);
		if (!ops.length || !window.SynthCamera || !SynthCamera.ready) return false;
		return ops.some(function (op) {
			const source = (op.parameters && op.parameters.source) || 'display';
			return !SynthCamera.ready(source);
		});
	}

	function persistThumb(pipe, url) {
		if (!url) return false;
		if (cameraNotReady(pipe)) return false;
		if (liveCameraOps(pipe).length && SynthEngine.thumbLuma && SynthEngine.thumbLuma() < 0.008) {
			camThumbTries += 1;
			if (camThumbTries < 20) return false;
		}
		camThumbTries = 0;
		thumbDirty = false;
		if (pipe.template) {
			userPatch({ templateThumb: { id: pipe.id, thumbnail: url } });
		} else {
			userPatch({ pipeThumb: { id: pipe.id, thumbnail: url } });
		}
		return true;
	}

	function viewPipe(state) {
		if (window.SynthPipes && SynthPipes.output) return SynthPipes.output(state);
		return window.SynthPipes ? SynthPipes.active(state) : null;
	}

	function scheduleTemplateThumbs(state) {
		if (!window.SynthEngine || !SynthEngine.captureOperators) return;
		if (capturingThumb) return;
		if (!tplThumbForce && millis() < tplThumbDue) return;
		const list = state.templates || [];
		const previewId = state.previewTemplateId || '';
		const pending = list.filter(function (item) {
			if (!item) return false;
			if (previewId && item.id === previewId) return false;
			if (tplThumbForce) return true;
			return !item.thumbnail;
		});
		if (!pending.length) {
			tplThumbForce = false;
			return;
		}
		const item = pending[0];
		capturingThumb = true;
		const url = SynthEngine.captureOperators(item.operators, millis() / 1000);
		capturingThumb = false;
		tplThumbDue = millis() + (tplThumbForce ? 0 : 80);
		if (pending.length <= 1) tplThumbForce = false;
		if (url) userPatch({ templateThumb: { id: item.id, thumbnail: url } });
	}

	function scheduleThumb(state) {
		if (!window.SynthPipes || !window.SynthEngine || !SynthEngine.capture) return;
		const pipe = viewPipe(state);
		if (!pipe) return;
		const vis = SynthPipes.visualSignature(pipe);
		const cam = cameraKey();
		const switched = pipe.id !== watchPipeId;
		const changed = vis !== watchVis;
		const camChanged = cam !== watchCam;
		if (switched || changed || camChanged || !pipe.thumbnail) {
			watchPipeId = pipe.id;
			watchVis = vis;
			watchCam = cam;
			camThumbTries = 0;
			const waitingCam = !!liveCameraOps(pipe).length;
			requestThumb((switched || !pipe.thumbnail) && !waitingCam);
		}

		const flipCam = !!liveCameraOps(pipe).length;

		if (livePreview) {
			if (capturingThumb || millis() < thumbDue) return;
			capturingThumb = true;
			const url = SynthEngine.capture(0.52, flipCam);
			capturingThumb = false;
			if (!url) return;
			thumbDue = millis() + 90;
			liveThumbAge += 90;
			SynthSync.sendPreview(url, pipe.id);
			if (liveThumbAge >= 2000 || switched || changed) {
				liveThumbAge = 0;
				persistThumb(pipe, url);
			}
			return;
		}

		if (!thumbDirty || capturingThumb) return;
		if (millis() < thumbDue) return;
		if (cameraNotReady(pipe)) {
			thumbDue = millis() + 200;
			return;
		}
		capturingThumb = true;
		const url = SynthEngine.capture(undefined, flipCam);
		capturingThumb = false;
		if (!persistThumb(pipe, url)) {
			thumbDue = millis() + 160;
		}
	}

	function bootIsUp() {
		const overlay = document.getElementById('boot-overlay');
		return overlay && !overlay.hidden && !overlay.classList.contains('is-leaving');
	}

	function isUiChrome(target) {
		if (!target || !target.closest) return false;
		return !!(
			target.closest('.synth-panel') ||
			target.closest('.synth-picker') ||
			target.closest('.synth-float-tip') ||
			target.closest('#boot-overlay')
		);
	}

	function setPanel(open) {
		panelOpen = open;
		const panel = document.getElementById('ui-root');
		if (panel) panel.classList.toggle('is-open', open);
		if (open) {
			revealChrome(true);
			return;
		}
		revealChrome();
		if (uiApi && uiApi.closeOverlays) uiApi.closeOverlays();
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
			if (isUiChrome(event.target)) return;
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
			const tap = !didSwipe && dx < 12 && dy < 12;
			const onRight = event.clientX >= window.innerWidth - EDGE;
			if (tap && onRight) {
				setPanel(!panelOpen);
			} else if (tap && startOpen) {
				setPanel(false);
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

	function setup() {
		const parent = document.getElementById('app') || document.body;
		setAttributes('antialias', false);
		setAttributes('preserveDrawingBuffer', true);
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
			patch: userPatch,
			capturePipe: function () {
				requestThumb(true);
			},
			captureTemplates: function () {
				tplThumbForce = true;
				tplThumbDue = 0;
			}
		});

		if (window.SynthOutputOverlay) {
			window.SynthOutputOverlayApi = SynthOutputOverlay.mount({
				getState: function () {
					return SynthState.get();
				},
				patch: userPatch
			});
		}

		SynthState.subscribe(function (state) {
			if (uiApi) uiApi.refresh();
			setDebugHud(!!(state.debug && state.debug.enabled));
		});

		if (window.SynthCamera) {
			SynthCamera.onChange(function () {
				if (uiApi) uiApi.refresh();
				const pipe = viewPipe(SynthState.get());
				if (pipe && liveCameraOps(pipe).length && !cameraNotReady(pipe)) {
					requestThumb(false);
				}
			});
		}

		setupGestures();
		setupIdleChrome();
		setupBoot();
		setPanel(false);
		setDebugHud(false);

		SynthSync.connect({
			role: 'display',
			onState: function (state) {
				const incomingEmpty = !(state && state.templates && state.templates.length) && !(state && state.templatesSeeded);
				applyingRemote = true;
				SynthState.replace(state);
				applyingRemote = false;
				const next = SynthState.get();
				if (incomingEmpty && next.templates && next.templates.length) {
					userPatch({ templates: next.templates, templatesSeeded: true });
				}
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
			},
			onLive: function (enabled) {
				livePreview = !!enabled;
				thumbDue = 0;
				liveThumbAge = 2000;
			},
			onFft: function (msg) {
				if (window.SynthFft) SynthFft.setRemote(msg);
			},
			onCameraFrame: function (url) {
				if (window.SynthCamera) SynthCamera.setRemoteFrame(url);
			},
			onCameraStatus: function (info) {
				if (window.SynthCamera) SynthCamera.setRemoteStatus(info);
			},
			onCameraReconnect: function () {
				if (window.SynthCamera) SynthCamera.reconnect(true);
			}
		});

		if (window.SynthCamera) SynthCamera.probeDisplay();
	}

	function draw() {
		const state = SynthState.get();
		SynthEngine.draw(state, millis() / 1000);
		scheduleThumb(state);
		scheduleTemplateThumbs(state);
		if (uiApi && uiApi.tick) uiApi.tick();
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
		if (window.SynthEngine && SynthEngine.resize) SynthEngine.resize();
	}

	window.setup = setup;
	window.draw = draw;
	window.windowResized = windowResized;
})();
