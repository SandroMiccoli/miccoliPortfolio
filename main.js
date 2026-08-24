(function () {
	const EDGE = 48;
	const CHROME_IDLE_MS = 2800;
	let uiApi = null;
	let panelOpen = false;
	let applyingRemote = false;
	let chromeTimer = 0;
	let lastFpsSent = 0;
	let thumbDirty = true;
	let thumbDue = 0;
	let watchPipeId = '';
	let watchVis = '';
	let watchCam = '';
	let capturingThumb = false;
	let hitchThisFrame = false;
	let lastDrawAt = 0;
	const fpsDts = [];
	const FPS_SAMPLES = 45;
	let livePreview = false;
	let liveThumbAge = 0;
	let camThumbTries = 0;
	let tplThumbDue = 0;
	let tplThumbForce = false;

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
		hitchThisFrame = true;
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
			hitchThisFrame = true;
			const url = SynthEngine.capture(0.52, flipCam);
			capturingThumb = false;
			if (!url) return;
			thumbDue = millis() + 90;
			liveThumbAge += 90;
			SynthSync.sendPreview(url, pipe.id);
			if (uiApi && uiApi.setPreviewFrame) uiApi.setPreviewFrame(url);
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
		hitchThisFrame = true;
		const url = SynthEngine.capture(undefined, flipCam);
		capturingThumb = false;
		if (!persistThumb(pipe, url)) {
			thumbDue = millis() + 160;
		}
	}

	function isUiChrome(target) {
		if (!target || !target.closest) return false;
		return !!(
			target.closest('#synth-ui') ||
			target.closest('.synth-panel') ||
			target.closest('.synth-picker') ||
			target.closest('.synth-float-tip')
		);
	}

	function setPanel(open) {
		panelOpen = open;
		const ui = document.getElementById('synth-ui');
		const panel = document.getElementById('ui-root');
		if (ui) {
			ui.classList.toggle('is-open', open);
			ui.setAttribute('aria-hidden', open ? 'false' : 'true');
			if ('inert' in ui) ui.inert = !open;
		} else if (panel) {
			panel.classList.toggle('is-open', open);
		}
		if (open) {
			revealChrome(true);
			return;
		}
		revealChrome();
		if (uiApi && uiApi.closeOverlays) uiApi.closeOverlays();
	}

	function revealChrome(keep) {
		document.body.classList.add('is-chrome-visible');
		clearTimeout(chromeTimer);
		if (keep || panelOpen) return;
		chromeTimer = setTimeout(function () {
			if (!panelOpen) document.body.classList.remove('is-chrome-visible');
		}, CHROME_IDLE_MS);
	}

	function setupIdleChrome() {
		window.addEventListener('pointermove', function () {
			revealChrome();
		});
		window.addEventListener('pointerdown', function () {
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

	function updateStats(stats) {
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
			},
			setLivePreview: function (on) {
				livePreview = !!on;
				thumbDue = 0;
				liveThumbAge = 2000;
				SynthSync.sendLive(on);
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

		SynthState.subscribe(function () {
			if (uiApi) uiApi.refresh();
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
		setPanel(false);

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
			onNotify: function (level, message) {
				if (window.SynthNotify) SynthNotify.show(level, message);
			},
			onStats: function (stats) {
				updateStats(stats);
			},
			onLive: function (enabled) {
				livePreview = !!enabled;
				thumbDue = 0;
				liveThumbAge = 2000;
				if (uiApi && uiApi.setLiveMode) uiApi.setLiveMode(!!enabled);
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

	function noteFrame() {
		const now = (window.performance && performance.now) ? performance.now() : Date.now();
		if (lastDrawAt > 0) {
			const dt = now - lastDrawAt;
			if (!hitchThisFrame && dt >= 8 && dt <= 220) {
				fpsDts.push(dt);
				if (fpsDts.length > FPS_SAMPLES) fpsDts.shift();
			}
		}
		lastDrawAt = now;
		hitchThisFrame = false;
	}

	function smoothFps() {
		if (fpsDts.length < 10) return 0;
		const sorted = fpsDts.slice().sort(function (a, b) {
			return a - b;
		});
		const drop = Math.max(1, Math.floor(sorted.length * 0.12));
		const slice = sorted.slice(0, sorted.length - drop);
		let sum = 0;
		for (let i = 0; i < slice.length; i += 1) sum += slice[i];
		return 1000 / (sum / slice.length);
	}

	function draw() {
		noteFrame();
		const state = SynthState.get();
		SynthEngine.draw(state, millis() / 1000);
		scheduleThumb(state);
		scheduleTemplateThumbs(state);
		if (uiApi && uiApi.tick) uiApi.tick();
		if (millis() - lastFpsSent > 500) {
			const fps = smoothFps();
			if (!(fps >= 1)) return;
			lastFpsSent = millis();
			const stats = {
				fps: fps,
				frameMs: 1000 / fps,
				size: { w: width, h: height }
			};
			if (uiApi && uiApi.refreshStats) uiApi.refreshStats(stats);
			SynthSync.sendStats(stats);
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
