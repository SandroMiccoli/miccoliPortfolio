(function (root) {
	let capture = null;
	let starting = false;
	let ready = false;
	let failed = false;
	let refs = 0;
	let failHandler = null;

	function stopTracks(el) {
		const stream = el && el.srcObject;
		if (stream && stream.getTracks) {
			stream.getTracks().forEach(function (track) {
				track.stop();
			});
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

	function start(onFail, onSuccess) {
		if (capture || starting) return;
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			failed = true;
			if (onFail) onFail(new Error('Camera not available in this browser'));
			return;
		}

		starting = true;
		ready = false;

		try {
			let announced = false;
			function succeed() {
				if (announced || !capture) return;
				announced = true;
				clearTimeout(watchdog);
				starting = false;
				ready = true;
				failed = false;
				if (onSuccess) onSuccess();
			}

			const watchdog = setTimeout(function () {
				if (!ready) {
					stop();
					failed = true;
					if (onFail) onFail(new Error('Camera timed out. Check the device and permissions.'));
				}
			}, 8000);

			capture = createCapture({ video: true, audio: false }, succeed);
			capture.elt.setAttribute('playsinline', 'true');
			capture.elt.setAttribute('muted', 'true');
			capture.hide();

			capture.elt.addEventListener('loadeddata', succeed);

			capture.elt.addEventListener('error', function () {
				clearTimeout(watchdog);
				stop();
				failed = true;
				if (onFail) onFail(new Error('Camera device error'));
			});
		} catch (err) {
			starting = false;
			stop();
			failed = true;
			if (onFail) onFail(err || new Error('Camera failed'));
		}
	}

	root.SynthCamera = {
		retain: function (onFail) {
			refs += 1;
			if (refs === 1) {
				failed = false;
				failHandler = onFail;
				start(function (err) {
					if (failHandler) failHandler(err);
				});
			} else if (!ready && !starting && !failed) {
				start(onFail);
			}
		},
		release: function () {
			refs = Math.max(0, refs - 1);
			if (refs === 0) {
				failHandler = null;
				stop();
			}
		},
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
