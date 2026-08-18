(function () {
	let uiApi = null;
	let applyingRemote = false;

	let warnedOffline = false;
	let seenLive = false;

	function setStatus(on) {
		const el = document.getElementById('sync-status');
		if (!el) return;
		if (on) {
			el.textContent = 'Connected';
			seenLive = true;
		} else {
			el.textContent = seenLive ? 'Reconnecting' : 'Connecting';
		}
		el.classList.toggle('is-on', on);
		if (!window.SynthNotify) return;
		if (on) {
			SynthNotify.show('success', 'Connected to Visual Synth');
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
	}

	document.addEventListener('DOMContentLoaded', function () {
		uiApi = SynthUI.mount(document.getElementById('ui-root'), {
			getState: function () {
				return SynthState.get();
			},
			patch: userPatch
		});

		SynthState.subscribe(function () {
			if (uiApi) uiApi.refresh();
		});

		SynthSync.connect({
			role: 'control',
			onState: function (state) {
				applyingRemote = true;
				SynthState.replace(state);
				applyingRemote = false;
			},
			onStatus: setStatus,
			onNotify: function (level, message) {
				if (window.SynthNotify) SynthNotify.show(level, message);
			},
			onStats: function (stats) {
				if (uiApi && uiApi.refreshStats) uiApi.refreshStats(stats);
			}
		});
	});
})();
