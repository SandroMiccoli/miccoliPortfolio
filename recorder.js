(function (root) {
	const FPS = 30;
	const BITRATE = 4e6;
	const MIMES = [
		'video/mp4;codecs=avc1.42E01E',
		'video/mp4',
		'video/webm;codecs=vp9',
		'video/webm;codecs=vp8',
		'video/webm'
	];

	let recorder = null;
	let chunks = [];
	let stream = null;
	let recCanvas = null;
	let recCtx = null;
	let srcCanvas = null;
	let pumping = false;
	let startedAt = 0;
	let mime = '';
	let changeFn = null;

	function emit() {
		if (typeof changeFn === 'function') changeFn();
	}

	function pickMime() {
		if (!root.MediaRecorder) return '';
		if (typeof MediaRecorder.isTypeSupported !== 'function') return '';
		for (let i = 0; i < MIMES.length; i += 1) {
			if (MediaRecorder.isTypeSupported(MIMES[i])) return MIMES[i];
		}
		return '';
	}

	function canRecord() {
		return !!(
			root.MediaRecorder &&
			root.HTMLCanvasElement &&
			HTMLCanvasElement.prototype.captureStream
		);
	}

	function extFor(type) {
		return /mp4/i.test(type || '') ? 'mp4' : 'webm';
	}

	function filename(type) {
		const d = new Date();
		const pad = function (n) {
			return n < 10 ? '0' + n : String(n);
		};
		return 'elo-' +
			d.getFullYear() +
			pad(d.getMonth() + 1) +
			pad(d.getDate()) +
			'-' +
			pad(d.getHours()) +
			pad(d.getMinutes()) +
			pad(d.getSeconds()) +
			'.' +
			extFor(type);
	}

	function ensureCanvas(w, h) {
		if (!recCanvas) {
			recCanvas = document.createElement('canvas');
			recCanvas.setAttribute('aria-hidden', 'true');
			recCanvas.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none';
			document.body.appendChild(recCanvas);
		}
		if (recCanvas.width !== w || recCanvas.height !== h) {
			recCanvas.width = w;
			recCanvas.height = h;
		}
		if (!recCtx) {
			recCtx = recCanvas.getContext('2d', { alpha: false, desynchronized: true });
		}
		return recCanvas;
	}

	function blit() {
		if (!srcCanvas || !recCtx) return;
		try {
			recCtx.drawImage(srcCanvas, 0, 0, recCanvas.width, recCanvas.height);
		} catch (err) {}
	}

	function pump() {
		if (!pumping) return;
		blit();
		root.requestAnimationFrame(pump);
	}

	function download(blob, name) {
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = name;
		a.rel = 'noopener';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		root.setTimeout(function () {
			URL.revokeObjectURL(url);
		}, 2500);
	}

	function saveBlob(blob) {
		if (!blob) return Promise.resolve('empty');
		const type = blob.type || mime || 'video/mp4';
		const name = filename(type);
		const file = new File([blob], name, { type: type });
		if (navigator.canShare && navigator.canShare({ files: [file] })) {
			return navigator.share({
				files: [file],
				title: 'ELO'
			}).then(function () {
				return 'shared';
			}).catch(function (err) {
				if (err && err.name === 'AbortError') return 'abort';
				download(blob, name);
				return 'download';
			});
		}
		download(blob, name);
		return Promise.resolve('download');
	}

	function start(canvas, opts) {
		opts = opts || {};
		if (recorder && recorder.state !== 'inactive') {
			return Promise.reject(new Error('Already recording'));
		}
		if (!canRecord()) {
			return Promise.reject(new Error('Recording is not supported'));
		}
		if (!canvas) {
			return Promise.reject(new Error('No canvas'));
		}
		const w = Math.max(2, Math.floor(opts.width || canvas.width || 960));
		const h = Math.max(2, Math.floor(opts.height || canvas.height || 540));
		srcCanvas = canvas;
		mime = pickMime();
		ensureCanvas(w, h);
		if (recCtx) {
			recCtx.fillStyle = '#000';
			recCtx.fillRect(0, 0, w, h);
		}
		blit();
		stream = recCanvas.captureStream(FPS);
		chunks = [];
		const recOpts = { videoBitsPerSecond: BITRATE };
		if (mime) recOpts.mimeType = mime;
		try {
			recorder = new MediaRecorder(stream, recOpts);
		} catch (err) {
			recorder = new MediaRecorder(stream);
		}
		recorder.ondataavailable = function (event) {
			if (event.data && event.data.size) chunks.push(event.data);
		};
		return new Promise(function (resolve, reject) {
			recorder.onerror = function () {
				pumping = false;
				reject(new Error('Recording failed'));
			};
			recorder.onstart = function () {
				startedAt = Date.now();
				pumping = true;
				pump();
				emit();
				resolve();
			};
			try {
				recorder.start(400);
			} catch (err) {
				try {
					recorder.start();
				} catch (inner) {
					recorder = null;
					reject(inner);
				}
			}
		});
	}

	function stop() {
		return new Promise(function (resolve) {
			if (!recorder || recorder.state === 'inactive') {
				pumping = false;
				resolve(null);
				return;
			}
			recorder.onstop = function () {
				pumping = false;
				startedAt = 0;
				const type = (chunks[0] && chunks[0].type) || mime || 'video/webm';
				const blob = chunks.length ? new Blob(chunks, { type: type }) : null;
				if (stream) {
					stream.getTracks().forEach(function (track) {
						track.stop();
					});
				}
				recorder = null;
				stream = null;
				chunks = [];
				emit();
				resolve(blob);
			};
			try {
				recorder.requestData();
			} catch (err) {}
			try {
				recorder.stop();
			} catch (err) {
				pumping = false;
				recorder = null;
				resolve(null);
			}
		});
	}

	root.SynthRecorder = {
		supported: canRecord,
		recording: function () {
			return !!(recorder && recorder.state === 'recording');
		},
		elapsed: function () {
			return startedAt ? Date.now() - startedAt : 0;
		},
		start: start,
		stop: stop,
		save: saveBlob,
		onChange: function (fn) {
			changeFn = fn;
		}
	};
})(window);
