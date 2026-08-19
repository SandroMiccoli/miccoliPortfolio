(function (root) {
	let video = null;
	let stream = null;
	let blitCanvas = null;
	let blitCtx = null;
	let blitW = 1;
	let blitH = 1;
	let starting = false;
	let ready = false;
	let failed = false;
	let failMessage = '';
	let currentKey = '';
	let retryAt = 0;
	let displayDevices = [];
	let phoneDevices = [];
	let remoteCanvas = null;
	let remoteCtx = null;
	let remoteImage = null;
	let remoteReady = false;
	let sendTimer = 0;
	let sendCanvas = null;
	let sendCtx = null;
	let lastWarn = '';
	const listeners = [];
	const MAX_BLIT_W = 1280;

	function isControl() {
		return !!(document.body && document.body.classList.contains('synth-control'));
	}

	function emit() {
		listeners.forEach(function (fn) {
			fn();
		});
	}

	function warn(message) {
		if (!message || message === lastWarn) return;
		lastWarn = message;
		if (root.SynthNotify) root.SynthNotify.show('warning', message);
		if (root.SynthSync && typeof root.SynthSync.sendNotify === 'function') {
			root.SynthSync.sendNotify('warning', message);
		}
	}

	function stopTracks(media) {
		if (!media || !media.getTracks) return;
		media.getTracks().forEach(function (track) {
			track.stop();
		});
	}

	function stopLocal() {
		ready = false;
		starting = false;
		currentKey = '';
		if (sendTimer) {
			window.clearInterval(sendTimer);
			sendTimer = 0;
		}
		stopTracks(stream);
		stream = null;
		if (video) {
			video.srcObject = null;
			if (video.parentNode) video.parentNode.removeChild(video);
			video = null;
		}
	}

	function ensureVideo() {
		if (video) return video;
		video = document.createElement('video');
		video.setAttribute('playsinline', 'true');
		video.setAttribute('webkit-playsinline', 'true');
		video.setAttribute('muted', 'true');
		video.setAttribute('autoplay', 'true');
		video.muted = true;
		video.autoplay = true;
		video.playsInline = true;
		video.controls = false;
		video.disablePictureInPicture = true;
		// Keep a real on-screen box. Chromium often refuses to decode / upload
		// a 2px off-screen <video> to WebGL even when the camera LED is on.
		video.style.cssText = [
			'position:fixed',
			'left:0',
			'bottom:0',
			'width:32px',
			'height:24px',
			'opacity:0.02',
			'pointer-events:none',
			'z-index:0',
			'border:0'
		].join(';');
		document.body.appendChild(video);
		return video;
	}

	function blitLocal() {
		if (!video || video.videoWidth < 2) return null;
		const vw = video.videoWidth;
		const vh = video.videoHeight;
		const w = vw > MAX_BLIT_W ? MAX_BLIT_W : vw;
		const h = Math.max(2, Math.round(vh * (w / vw)));
		if (!blitCanvas) {
			blitCanvas = document.createElement('canvas');
			blitCtx = blitCanvas.getContext('2d', { alpha: false });
		}
		if (blitCanvas.width !== w || blitCanvas.height !== h) {
			blitCanvas.width = w;
			blitCanvas.height = h;
		}
		blitCtx.drawImage(video, 0, 0, w, h);
		blitW = w;
		blitH = h;
		return blitCanvas;
	}

	function ensureRemote() {
		if (remoteCanvas) return remoteCanvas;
		remoteCanvas = document.createElement('canvas');
		remoteCanvas.width = 2;
		remoteCanvas.height = 2;
		remoteCtx = remoteCanvas.getContext('2d');
		remoteImage = new Image();
		remoteImage.onload = function () {
			if (!remoteCanvas || !remoteCtx) return;
			if (remoteCanvas.width !== remoteImage.width || remoteCanvas.height !== remoteImage.height) {
				remoteCanvas.width = remoteImage.width;
				remoteCanvas.height = remoteImage.height;
			}
			remoteCtx.drawImage(remoteImage, 0, 0);
			remoteReady = true;
		};
		return remoteCanvas;
	}

	function labelOf(device, index) {
		const raw = String(device.label || '').trim();
		if (raw) return raw.replace(/\s*\([0-9a-f:]{4,}\)\s*$/i, '');
		return 'Camera ' + (index + 1);
	}

	function readDevices(kind) {
		if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
			return Promise.resolve([]);
		}
		return navigator.mediaDevices.enumerateDevices().then(function (list) {
			const cams = (list || []).filter(function (item) {
				return item.kind === 'videoinput' && item.deviceId;
			}).map(function (item, i) {
				return { id: item.deviceId, label: labelOf(item, i) };
			});
			if (kind === 'phone') phoneDevices = cams;
			else displayDevices = cams;
			emit();
			return cams;
		}).catch(function () {
			return [];
		});
	}

	function constraintsFor(deviceId, facing) {
		const video = { audio: false };
		if (deviceId) {
			video.video = { deviceId: { exact: deviceId } };
		} else if (facing) {
			video.video = { facingMode: { ideal: facing } };
		} else {
			video.video = true;
		}
		return video;
	}

	function waitForFrame(node) {
		return new Promise(function (resolve, reject) {
			let poll = 0;
			let settled = false;

			function cleanup() {
				window.clearTimeout(watchdog);
				window.clearInterval(poll);
				node.removeEventListener('loadedmetadata', check);
				node.removeEventListener('loadeddata', check);
				node.removeEventListener('playing', check);
				node.removeEventListener('canplay', check);
				node.removeEventListener('resize', check);
				node.onerror = null;
			}

			function succeed() {
				if (settled) return;
				settled = true;
				cleanup();
				starting = false;
				ready = true;
				failed = false;
				lastWarn = '';
				readDevices(isControl() ? 'phone' : 'display').then(function (cams) {
					if (!isControl() && root.SynthSync && root.SynthSync.sendCameras) {
						root.SynthSync.sendCameras(cams);
					}
					emit();
				});
				resolve(true);
			}

			function fail(message, err) {
				if (settled) return;
				settled = true;
				cleanup();
				starting = false;
				failed = true;
				failMessage = message;
				retryAt = Date.now() + 2500;
				warn(failMessage);
				stopLocal();
				reject(err || new Error(failMessage));
			}

			const watchdog = window.setTimeout(function () {
				fail(
					'Camera timed out. Check the device, cable, and Chromium camera permission.',
					new Error('Camera timed out')
				);
			}, 12000);

			function check() {
				if (node.videoWidth >= 2 && node.videoHeight >= 2 && node.readyState >= 2) {
					succeed();
				}
			}

			node.addEventListener('loadedmetadata', check);
			node.addEventListener('loadeddata', check);
			node.addEventListener('playing', check);
			node.addEventListener('canplay', check);
			node.addEventListener('resize', check);
			node.onerror = function () {
				fail('Camera device error');
			};
			poll = window.setInterval(check, 80);
			check();
		});
	}

	function startLocal(deviceId, facing) {
		const key = String(deviceId || '') + ':' + String(facing || '');
		if (stream && currentKey === key && ready) return Promise.resolve(true);
		if (starting && currentKey === key) return Promise.resolve(false);
		if (failed && Date.now() < retryAt) return Promise.resolve(false);
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			failed = true;
			failMessage = 'Camera API not available in this browser';
			warn(failMessage);
			return Promise.reject(new Error(failMessage));
		}
		if (!window.isSecureContext && isControl()) {
			failed = true;
			failMessage = 'Phone camera needs HTTPS. Use Display for the Pi USB cam, or open the HTTPS control URL.';
			warn(failMessage);
			return Promise.reject(new Error(failMessage));
		}

		stopLocal();
		starting = true;
		ready = false;
		failed = false;
		currentKey = key;
		const node = ensureVideo();

		function attach(media) {
			stream = media;
			node.srcObject = media;
			const play = node.play();
			if (play && typeof play.catch === 'function') {
				play.catch(function () { /* autoplay may wait for metadata */ });
			}
			return waitForFrame(node);
		}

		return navigator.mediaDevices.getUserMedia(constraintsFor(deviceId, facing)).catch(function () {
			return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
		}).then(attach).catch(function (err) {
			if (failed && failMessage) throw err;
			starting = false;
			failed = true;
			retryAt = Date.now() + 2500;
			const name = err && err.name;
			if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
				failMessage = 'Camera permission denied. On the Pi, add --use-fake-ui-for-media-stream to Chromium.';
			} else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
				failMessage = 'No camera found. On the Pi, check the USB webcam with v4l2-ctl --list-devices.';
			} else if (name === 'NotReadableError' || name === 'TrackStartError') {
				failMessage = 'Camera is busy or blocked. Close other apps using it, and confirm the pi user is in the video group.';
			} else {
				failMessage = (err && err.message) || 'Camera failed';
			}
			warn(failMessage);
			stopLocal();
			throw err;
		});
	}

	function startSender() {
		if (sendTimer || !isControl()) return;
		sendCanvas = sendCanvas || document.createElement('canvas');
		sendCtx = sendCanvas.getContext('2d', { alpha: false });
		sendTimer = window.setInterval(function () {
			if (!ready || !video || !video.videoWidth || !root.SynthSync || !root.SynthSync.sendCameraFrame) return;
			const w = 480;
			const h = Math.max(2, Math.round(video.videoHeight * (w / video.videoWidth)));
			if (sendCanvas.width !== w || sendCanvas.height !== h) {
				sendCanvas.width = w;
				sendCanvas.height = h;
			}
			sendCtx.drawImage(video, 0, 0, w, h);
			try {
				root.SynthSync.sendCameraFrame(sendCanvas.toDataURL('image/jpeg', 0.5));
			} catch (err) { /* ignore */ }
		}, 120);
	}

	function neededPhone(state) {
		const pipes = (state && state.pipes) || [];
		const activeId = state && state.activePipeId;
		let pipe = pipes.filter(function (item) {
			return item.id === activeId;
		})[0] || pipes[0];
		if (!pipe) return null;
		const ops = pipe.operators || [];
		for (let i = 0; i < ops.length; i += 1) {
			const op = ops[i];
			if (op.type !== 'camera' || op.bypassed) continue;
			const src = (op.parameters && op.parameters.source) || 'display';
			if (src === 'phone') return op.parameters || {};
		}
		return null;
	}

	root.SynthCamera = {
		onChange: function (fn) {
			if (typeof fn === 'function') listeners.push(fn);
		},
		signature: function () {
			return (isControl() ? 'c' : 'd') + ':' + displayDevices.map(function (d) {
				return d.id;
			}).join(',') + ':' + phoneDevices.map(function (d) {
				return d.id;
			}).join(',');
		},
		deviceOptions: function (source) {
			if (source === 'phone') {
				if (!isControl()) {
					return [{ id: '', label: 'From phone' }];
				}
				const list = phoneDevices.length ? phoneDevices : [{ id: '', label: 'This phone' }];
				if (phoneDevices.length && phoneDevices[0].id) {
					return [{ id: '', label: 'Default' }].concat(phoneDevices);
				}
				return list;
			}
			const list = displayDevices;
			if (!list.length) return [{ id: '', label: 'Default USB' }];
			return [{ id: '', label: 'Default USB' }].concat(list);
		},
		setDisplayDevices: function (list) {
			displayDevices = Array.isArray(list) ? list : [];
			emit();
		},
		setRemoteFrame: function (url) {
			if (!url) return;
			ensureRemote();
			remoteImage.src = url;
		},
		syncControl: function (state) {
			if (!isControl()) return;
			const params = neededPhone(state);
			if (!params) {
				stopLocal();
				return;
			}
			startLocal(params.deviceId, params.deviceId ? '' : 'environment').then(function () {
				startSender();
			}).catch(function () { /* warned */ });
		},
		ensure: function (cfg) {
			cfg = cfg || {};
			const source = cfg.source || 'display';
			if (isControl()) return;
			if (source === 'phone') {
				if (currentKey) stopLocal();
				ensureRemote();
				return;
			}
			startLocal(cfg.deviceId || '', '').catch(function () { /* warned */ });
		},
		probeDisplay: function () {
			if (isControl()) return;
			readDevices('display').then(function (cams) {
				if (root.SynthSync && root.SynthSync.sendCameras) {
					root.SynthSync.sendCameras(cams);
				}
			});
			if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
				navigator.mediaDevices.addEventListener('devicechange', function () {
					readDevices('display').then(function (cams) {
						if (root.SynthSync && root.SynthSync.sendCameras) {
							root.SynthSync.sendCameras(cams);
						}
					});
				});
			}
		},
		texture: function (source) {
			if (source === 'phone') {
				return remoteReady ? ensureRemote() : null;
			}
			return ready ? blitLocal() : null;
		},
		size: function (source) {
			if (source === 'phone' && remoteReady && remoteCanvas) {
				return [remoteCanvas.width, remoteCanvas.height];
			}
			if (ready && blitW > 1) return [blitW, blitH];
			if (video && video.videoWidth) return [video.videoWidth, video.videoHeight];
			return [1, 1];
		},
		ready: function (source) {
			if (source === 'phone') return remoteReady;
			return !!(ready && video && video.videoWidth >= 2);
		},
		stop: stopLocal
	};
})(window);
