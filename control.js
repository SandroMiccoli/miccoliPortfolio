(function () {
	let uiApi = null;
	let applyingRemote = false;

	function setStatus(on) {
		const el = document.getElementById('sync-status');
		if (!el) return;
		el.textContent = on ? 'Connected' : 'Reconnecting…';
		el.classList.toggle('is-on', on);
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
			onStatus: setStatus
		});
	});
})();
