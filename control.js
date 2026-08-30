(function () {
	let uiApi = null;
	let applyingRemote = false;

	let warnedOffline = false;
	let seenLive = false;
	let sawRemoteState = false;
	let sawStaticServer = false;

	if (window.SynthShare && SynthShare.captureLocation) SynthShare.captureLocation();

	function setStatus(on) {
		const el = document.getElementById('sync-status');
		if (!el) return;
		el.classList.remove('is-on', 'is-wait', 'is-off');
		if (on) {
			el.textContent = 'Connected';
			el.classList.add('is-on');
			seenLive = true;
		} else if (seenLive) {
			el.textContent = 'Reconnecting';
			el.classList.add('is-off');
		} else {
			el.textContent = 'Connecting';
			el.classList.add('is-wait');
		}
		if (!window.SynthNotify) return;
		if (on) {
			SynthNotify.show('success', 'Connected to ELO');
			warnedOffline = false;
			sawStaticServer = false;
		} else if (!warnedOffline) {
			warnedOffline = true;
			if (seenLive) SynthNotify.show('warning', 'Connection lost. Reconnecting.');
			else checkSyncServer();
		}
	}

	function checkSyncServer() {
		fetch('/api/info', { cache: 'no-store' }).then(function (res) {
			if (res.ok || seenLive) return;
			sawStaticServer = true;
			const el = document.getElementById('sync-status');
			if (el) {
				el.textContent = 'No sync server';
				el.classList.remove('is-wait', 'is-on');
				el.classList.add('is-off');
			}
			if (window.SynthNotify) {
				SynthNotify.show('warning', 'Jekyll has no WebSocket. Run cd server && npm start, then open that URL on the phone.');
			}
		}).catch(function () {});
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

	document.addEventListener('DOMContentLoaded', function () {
		uiApi = SynthUI.mount(document.getElementById('ui-root'), {
			getState: function () {
				return SynthState.get();
			},
			patch: userPatch,
			setLivePreview: function (on) {
				if (window.SynthPreview && SynthPreview.setLive) {
					SynthPreview.setLive(on);
					return;
				}
				SynthSync.sendLive(on);
			}
		});

		if (window.SynthFft) {
			SynthFft.setBroadcast(function (levels) {
				SynthSync.sendFft(levels);
			});
		}

		let lastLocalFpsAt = 0;
		function loop() {
			if (uiApi && uiApi.tick) uiApi.tick();
			const now = Date.now();
			if (now - lastLocalFpsAt > 500) {
				lastLocalFpsAt = now;
				const localFps = window.SynthPreview && SynthPreview.localFps
					? SynthPreview.localFps()
					: 0;
				if (uiApi && uiApi.refreshStats) {
					uiApi.refreshStats({ localFps: localFps >= 1 ? localFps : null });
				}
			}
			window.requestAnimationFrame(loop);
		}
		window.requestAnimationFrame(loop);

		SynthState.subscribe(function () {
			if (uiApi) uiApi.refresh();
			if (window.SynthPreview && SynthPreview.nudge) SynthPreview.nudge();
			if (window.SynthCamera) SynthCamera.syncControl(SynthState.get());
		});

		if (window.SynthCamera) {
			SynthCamera.onChange(function () {
				if (uiApi) uiApi.refresh();
			});
		}

		SynthSync.connect({
			role: 'control',
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
			onStatus: setStatus,
			onNotify: function (level, message) {
				if (window.SynthNotify) SynthNotify.show(level, message);
			},
			onStats: function (stats) {
				if (uiApi && uiApi.refreshStats) uiApi.refreshStats(stats);
			},
			onPreview: function (msg) {
				if (window.SynthPreview && SynthPreview.active && SynthPreview.active()) return;
				if (uiApi && uiApi.setPreviewFrame) uiApi.setPreviewFrame(msg.url, msg.pipeId);
			},
			onLive: function (enabled) {
				if (uiApi && uiApi.setLiveMode) uiApi.setLiveMode(!!enabled);
				if (window.SynthPreview && SynthPreview.setLive) SynthPreview.setLive(!!enabled);
			},
			onFft: function (msg) {
				if (window.SynthFft) SynthFft.setRemote(msg);
			},
			onCameras: function (devices) {
				if (window.SynthCamera) SynthCamera.setDisplayDevices(devices);
			},
			onCameraStatus: function (info) {
				if (window.SynthCamera) SynthCamera.setRemoteStatus(info);
			},
			onCameraReconnect: function () {
				if (window.SynthCamera) SynthCamera.reconnect(true);
			}
		});

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
	});
})();
