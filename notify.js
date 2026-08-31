(function (root) {
	const DURATIONS = {
		info: 3200,
		success: 2600,
		warning: 5600,
		error: 8000
	};

	function ensureRoot() {
		let el = document.getElementById('synth-toasts');
		if (el) return el;
		el = document.createElement('div');
		el.id = 'synth-toasts';
		el.className = 'synth-toasts';
		el.setAttribute('aria-live', 'polite');
		const chrome = document.querySelector('body.synth-control > .synth-chrome');
		if (chrome) chrome.appendChild(el);
		else document.body.appendChild(el);
		return el;
	}

	function show(level, message) {
		if (!message) return;
		const hold = ensureRoot();
		const kind = level === 'error' || level === 'warning' || level === 'success' || level === 'info'
			? level
			: 'warning';
		hold.setAttribute('aria-live', kind === 'error' || kind === 'warning' ? 'assertive' : 'polite');

		const existing = hold.querySelectorAll('.synth-toast');
		for (let i = 0; i < existing.length; i += 1) {
			const msg = existing[i].querySelector('.synth-toast__msg');
			if (msg && msg.textContent === message) {
				existing[i].parentNode.removeChild(existing[i]);
			}
		}

		const toast = document.createElement('div');
		toast.className = 'synth-toast synth-toast--' + kind;
		const label = kind === 'error' ? 'Error'
			: kind === 'warning' ? 'Warning'
			: kind === 'success' ? 'OK'
			: 'Camera';
		const tag = document.createElement('span');
		tag.className = 'synth-toast__kind';
		tag.textContent = label;
		const text = document.createElement('span');
		text.className = 'synth-toast__msg';
		text.textContent = message;
		toast.appendChild(tag);
		toast.appendChild(text);
		hold.appendChild(toast);

		requestAnimationFrame(function () {
			toast.classList.add('is-in');
		});

		const stay = DURATIONS[kind] || DURATIONS.warning;
		setTimeout(function () {
			toast.classList.remove('is-in');
			toast.classList.add('is-out');
		}, stay);
		setTimeout(function () {
			if (toast.parentNode) toast.parentNode.removeChild(toast);
		}, stay + 600);
	}

	root.SynthNotify = { show: show };
})(window);
