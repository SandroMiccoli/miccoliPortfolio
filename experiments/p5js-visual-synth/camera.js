(function (root) {
	let capture = null;
	let starting = false;
	let ready = false;

	function stopTracks(el) {
		const stream = el && el.srcObject;
		if (stream && stream.getTracks) {
			stream.getTracks().forEach((track) => track.stop());
		}
	}

	function stop() {
		ready = false;
		starting = false;
		if (!capture) return;
		stopTracks(capture.elt);
		capture.remove();
		capture = null;
	}

	function start(onFail) {
		if (capture || starting) return;
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			if (onFail) onFail(new Error('Camera not available'));
			return;
		}

		starting = true;
		ready = false;

		try {
			capture = createCapture({ video: true, audio: false }, function () {
				starting = false;
				ready = true;
			});
			capture.elt.setAttribute('playsinline', 'true');
			capture.elt.setAttribute('muted', 'true');
			capture.hide();

			const watchdog = setTimeout(function () {
				if (!ready) {
					stop();
					if (onFail) onFail(new Error('Camera timeout'));
				}
			}, 5000);

			capture.elt.addEventListener('loadeddata', function () {
				clearTimeout(watchdog);
				starting = false;
				ready = true;
			});
		} catch (err) {
			starting = false;
			stop();
			if (onFail) onFail(err);
		}
	}

	root.SynthCamera = {
		start: start,
		stop: stop,
		texture: function () {
			return capture;
		},
		ready: function () {
			return !!(capture && ready);
		},
		isStarting: function () {
			return starting;
		}
	};
})(window);
