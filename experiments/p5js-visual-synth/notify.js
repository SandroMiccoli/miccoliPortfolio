(function (root) {
	function ensureRoot() {
		let el = document.getElementById('synth-toasts');
		if (el) return el;
		el = document.createElement('div');
		el.id = 'synth-toasts';
		el.className = 'synth-toasts';
		el.setAttribute('aria-live', 'polite');
		document.body.appendChild(el);
		return el;
	}

	function show(level, message) {
		if (!message) return;
		const root = ensureRoot();
		const toast = document.createElement('div');
		const kind = level === 'error' || level === 'warning' || level === 'success' ? level : 'warning';
		toast.className = 'synth-toast synth-toast--' + kind;
		const label = kind === 'error' ? 'Error' : kind === 'warning' ? 'Warning' : 'OK';
		const tag = document.createElement('span');
		tag.className = 'synth-toast__kind';
		tag.textContent = label;
		const text = document.createElement('span');
		text.className = 'synth-toast__msg';
		text.textContent = message;
		toast.appendChild(tag);
		toast.appendChild(text);
		root.appendChild(toast);

		requestAnimationFrame(function () {
			toast.classList.add('is-in');
		});

		setTimeout(function () {
			toast.classList.remove('is-in');
			toast.classList.add('is-out');
		}, 3600);
		setTimeout(function () {
			if (toast.parentNode) toast.parentNode.removeChild(toast);
		}, 4200);
	}

	root.SynthNotify = { show: show };
})(window);
