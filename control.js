(function () {
	let uiApi = null;
	let applyingRemote = false;

	let warnedOffline = false;
	let seenLive = false;

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
		} else if (!warnedOffline) {
			warnedOffline = true;
			SynthNotify.show('warning', 'Connection lost. Reconnecting.');
		}
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

	document.addEventListener('DOMContentLoaded', function () {
		uiApi = SynthUI.mount(document.getElementById('ui-root'), {
			getState: function () {
				return SynthState.get();
			},
			patch: userPatch,
			setLivePreview: function (on) {
				SynthSync.sendLive(on);
			}
		});

		if (window.SynthFft) {
			SynthFft.setBroadcast(function (levels) {
				SynthSync.sendFft(levels);
			});
		}

		function loop() {
			if (uiApi && uiApi.tick) uiApi.tick();
			window.requestAnimationFrame(loop);
		}
		window.requestAnimationFrame(loop);

		SynthState.subscribe(function () {
			if (uiApi) uiApi.refresh();
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
				const next = SynthState.get();
				if (incomingEmpty && next.templates && next.templates.length) {
					userPatch({ templates: next.templates, templatesSeeded: true });
				}
			},
			onStatus: setStatus,
			onNotify: function (level, message) {
				if (window.SynthNotify) SynthNotify.show(level, message);
			},
			onStats: function (stats) {
				if (uiApi && uiApi.refreshStats) uiApi.refreshStats(stats);
			},
			onPreview: function (msg) {
				if (uiApi && uiApi.setPreviewFrame) uiApi.setPreviewFrame(msg.url);
			},
			onLive: function (enabled) {
				if (uiApi && uiApi.setLiveMode) uiApi.setLiveMode(!!enabled);
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
	});
})();
