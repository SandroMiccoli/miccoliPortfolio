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
	let lastPresentAt = 0;
	const fpsDts = [];
	const FPS_WINDOW_MS = 1000;
	let livePreview = false;
	let liveThumbAge = 0;
	let idleThumbDue = 0;
	const LIVE_MS = 55;
	const STILL_MS = 1400;
	const PERSIST_MS = 8000;
	let persistThumbDue = 0;
	let camThumbTries = 0;
	let tplThumbDue = 0;
	let tplThumbForce = false;
	let sawRemoteState = false;

	if (window.SynthShare && SynthShare.captureLocation) SynthShare.captureLocation();

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

	function consumeShare() {
		if (!window.SynthShare) return;
		SynthShare.consume(function (patch) {
			SynthState.patch(patch);
			SynthSync.sendPatch(patch);
			if (patch.presets && window.SynthPresets) {
				SynthPresets.syncDisk(SynthState.get().presets);
			}
			if ((patch.templates || patch.templateThumb || patch.templateOps) && window.SynthTemplates) {
				SynthTemplates.syncDisk(SynthState.get().templates);
			}
			if (window.SynthCamera && SynthCamera.armFromState) {
				SynthCamera.armFromState(SynthState.get());
			}
		});
	}

	function mergeOfflineLibrary() {
		if (window.SynthSync && SynthSync.connected()) return;
		if (!window.SynthTemplates) return;
		const state = SynthState.get();
		const merged = SynthTemplates.merge(
			SynthTemplates.factory(),
			SynthTemplates.userOnly(state.templates)
		);
		userPatch({ templates: merged, templatesSeeded: true });
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
			if (SynthSync.previewBusy && SynthSync.previewBusy()) return;
			capturingThumb = true;
			const url = SynthEngine.capturePreview
				? SynthEngine.capturePreview(0.7, flipCam)
				: SynthEngine.capture(0.7, flipCam);
			capturingThumb = false;
			if (!url) return;
			if (!SynthSync.sendPreview(url, pipe.id)) return;
			thumbDue = millis() + LIVE_MS;
			liveThumbAge += LIVE_MS;
			if (uiApi && uiApi.setPreviewFrame) uiApi.setPreviewFrame(url, pipe.id);
			if (liveThumbAge >= PERSIST_MS || switched || changed) {
				liveThumbAge = 0;
				const thumb = SynthEngine.capture(undefined, flipCam);
				if (thumb) persistThumb(pipe, thumb);
			}
			return;
		}

		const stillDue = millis() >= idleThumbDue;
		if (!thumbDirty && !stillDue) return;
		if (capturingThumb || millis() < thumbDue) return;
		if (cameraNotReady(pipe)) {
			thumbDue = millis() + 200;
			return;
		}
		capturingThumb = true;
		const previewUrl = SynthEngine.capturePreview
			? SynthEngine.capturePreview(0.7, flipCam)
			: SynthEngine.capture(undefined, flipCam);
		capturingThumb = false;
		if (!previewUrl) {
			thumbDue = millis() + 160;
			return;
		}
		if (!(SynthSync.previewBusy && SynthSync.previewBusy())) {
			SynthSync.sendPreview(previewUrl, pipe.id);
		}
		if (uiApi && uiApi.setPreviewFrame) uiApi.setPreviewFrame(previewUrl, pipe.id);
		if (thumbDirty || millis() >= persistThumbDue) {
			const thumb = SynthEngine.capture(undefined, flipCam);
			if (!persistThumb(pipe, thumb)) {
				thumbDue = millis() + 160;
				return;
			}
			persistThumbDue = millis() + PERSIST_MS;
		} else {
			thumbDirty = false;
		}
		idleThumbDue = millis() + STILL_MS;
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
		const scrim = document.getElementById('synth-scrim');
		if (ui) {
			ui.classList.toggle('is-open', open);
			ui.setAttribute('aria-hidden', open ? 'false' : 'true');
			if ('inert' in ui) ui.inert = !open;
		} else if (panel) {
			panel.classList.toggle('is-open', open);
		}
		if (scrim) {
			scrim.hidden = !open;
			scrim.classList.toggle('is-open', open);
			scrim.setAttribute('aria-hidden', open ? 'false' : 'true');
		}
		if (open) {
			revealChrome(true);
			return;
		}
		revealChrome();
		if (uiApi && uiApi.closeOverlays) uiApi.closeOverlays();
	}

	function setupPanelDismiss() {
		const helpSlot = document.getElementById('synth-help-slot');
		if (helpSlot && !helpSlot.querySelector('[data-panel-close]')) {
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'synth-icon';
			btn.setAttribute('data-panel-close', '1');
			btn.setAttribute('aria-label', 'Close menu');
			if (window.SynthIcons) btn.appendChild(SynthIcons.svg('x'));
			btn.addEventListener('click', function (event) {
				event.preventDefault();
				event.stopPropagation();
				setPanel(false);
			});
			helpSlot.appendChild(btn);
		}

		let scrim = document.getElementById('synth-scrim');
		if (!scrim) {
			scrim = document.createElement('button');
			scrim.id = 'synth-scrim';
			scrim.type = 'button';
			scrim.className = 'synth-scrim';
			scrim.hidden = true;
			scrim.setAttribute('aria-label', 'Close menu');
			scrim.setAttribute('aria-hidden', 'true');
			const ui = document.getElementById('synth-ui');
			if (ui && ui.parentNode) ui.parentNode.insertBefore(scrim, ui);
			else document.body.appendChild(scrim);
		}
		scrim.addEventListener('click', function () {
			setPanel(false);
		});
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
			const tag = event.target && event.target.tagName;
			if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
			if (event.key === 'Escape' && panelOpen) {
				event.preventDefault();
				setPanel(false);
				return;
			}
			if (event.key !== 'e' && event.key !== 'E') return;
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
				idleThumbDue = 0;
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

		setupPanelDismiss();
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
				sawRemoteState = true;
				const next = SynthState.get();
				if (incomingEmpty && next.templates && next.templates.length) {
					userPatch({ templates: next.templates, templatesSeeded: true });
				}
				consumeShare();
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
				idleThumbDue = 0;
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
			},
			onCameraArm: function () {
				if (window.SynthCamera && SynthCamera.arm) SynthCamera.arm(true);
			}
		});

		if (window.SynthCamera) SynthCamera.probeDisplay();

		const libraryJobs = [];
		if (window.SynthTemplates && SynthTemplates.loadLibrary) {
			libraryJobs.push(SynthTemplates.loadLibrary());
		}
		if (window.SynthPresets && SynthPresets.loadLibrary) {
			libraryJobs.push(SynthPresets.loadLibrary());
		}
		Promise.all(libraryJobs).then(function () {
			if (!sawRemoteState) mergeOfflineLibrary();
		});
		window.setTimeout(function () {
			if (sawRemoteState) return;
			mergeOfflineLibrary();
			if (document.body.classList.contains('lab-body') || !(window.SynthSync && SynthSync.connected())) {
				consumeShare();
			}
		}, 2500);
	}

	function syncGpu() {
		const gl = typeof drawingContext !== 'undefined' ? drawingContext : null;
		if (!gl) return;
		try {
			if (typeof gl.fenceSync === 'function' && typeof gl.clientWaitSync === 'function') {
				const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
				if (sync) {
					gl.flush();
					gl.clientWaitSync(sync, gl.SYNC_FLUSH_COMMANDS_BIT, 1e9);
					gl.deleteSync(sync);
					return;
				}
			}
			if (typeof gl.finish === 'function') gl.finish();
		} catch (err) {}
	}

	function notePresented() {
		const now = (window.performance && performance.now) ? performance.now() : Date.now();
		if (lastPresentAt > 0) {
			const dt = now - lastPresentAt;
			if (dt >= 1 && dt <= 2500) fpsDts.push({ t: now, dt: dt });
		}
		lastPresentAt = now;
		const cutoff = now - FPS_WINDOW_MS;
		while (fpsDts.length && fpsDts[0].t < cutoff) fpsDts.shift();
	}

	function measuredFps() {
		if (fpsDts.length < 3) return 0;
		const first = fpsDts[0];
		const last = fpsDts[fpsDts.length - 1];
		const span = last.t - (first.t - first.dt);
		if (!(span > 0)) return 0;
		return fpsDts.length / (span / 1000);
	}

	function draw() {
		const state = SynthState.get();
		SynthEngine.draw(state, millis() / 1000);
		syncGpu();
		notePresented();
		scheduleThumb(state);
		scheduleTemplateThumbs(state);
		if (uiApi && uiApi.tick) uiApi.tick();
		if (millis() - lastFpsSent > 500) {
			const fps = measuredFps();
			if (!(fps >= 1)) return;
			lastFpsSent = millis();
			const stats = {
				fps: fps,
				frameMs: 1000 / fps,
				size: { w: width, h: height },
				source: 'display'
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
