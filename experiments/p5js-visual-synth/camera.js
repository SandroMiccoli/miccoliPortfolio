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
	let displayDevices = [];
	let phoneDevices = [];
	let remoteCanvas = null;
	let remoteCtx = null;
	let remoteImage = null;
	let remoteReady = false;
	let sendTimer = 0;
	let sendCanvas = null;
	let sendCtx = null;
	let lastToast = '';
	let lastAttemptKey = '';
	let phase = 'idle';
	let statusMessage = 'Pick Display or Phone, then wait for a live signal.';
	let remoteStatus = {
		phase: 'idle',
		message: '',
		live: false,
		source: 'display'
	};
	let lastCfg = { deviceId: '', facing: '' };
	let bootId = 0;
	let restartTimer = 0;
	const listeners = [];
	const MAX_BLIT_W = 1280;
	const GUM_MS = 8000;
	const GUM_TRY_MS = 4500;
	const FRAME_MS = 10000;
	const SKIP_CAM = /bcm2835|rpi-hevc|hevc-dec|codec|isp\b|metadata|dummy|loopback|vivid|pisp/i;
	const PREFER_CAM = /logitech|c270|c920|c922|uvc|usb|webcam|hd camera|0825/i;

	function isControl() {
		return !!(document.body && document.body.classList.contains('synth-control'));
	}

	function emit() {
		listeners.forEach(function (fn) {
			fn();
		});
	}

	function toast(level, message) {
		if (!message || message === lastToast) return;
		lastToast = message;
		if (root.SynthNotify) root.SynthNotify.show(level, message);
		if (root.SynthSync && typeof root.SynthSync.sendNotify === 'function') {
			root.SynthSync.sendNotify(level, message);
		}
	}

	function sendStatus() {
		if (!root.SynthSync || typeof root.SynthSync.sendCameraStatus !== 'function') return;
		root.SynthSync.sendCameraStatus({
			source: isControl() ? 'phone' : 'display',
			phase: phase,
			message: statusMessage,
			live: !!ready
		});
	}

	function setPhase(next, message) {
		const msg = message || statusMessage;
		const changed = phase !== next || statusMessage !== msg;
		phase = next;
		statusMessage = msg;
		if (!changed) return;
		emit();
		sendStatus();
		if (next === 'connecting' || next === 'waiting') toast('info', msg);
		else if (next === 'live') toast('success', msg);
		else if (next === 'error') toast('warning', msg);
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
		video.style.cssText = [
			'position:fixed',
			'right:8px',
			'bottom:8px',
			'width:160px',
			'height:90px',
			'opacity:0.06',
			'pointer-events:none',
			'z-index:1',
			'border:0',
			'object-fit:cover'
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
			const wasLive = remoteReady;
			remoteReady = true;
			if (!wasLive) {
				setPhase('live', 'Receiving phone camera');
			}
		};
		return remoteCanvas;
	}

	function labelOf(device, index) {
		const raw = String(device.label || '').trim();
		if (raw) return raw.replace(/\s*\([0-9a-f:]{4,}\)\s*$/i, '');
		return 'Camera ' + (index + 1);
	}

	function isSkipCam(label) {
		return SKIP_CAM.test(String(label || ''));
	}

	function rankCaptureDevices(list, preferredId) {
		const raw = (list || []).filter(function (item) {
			return item.kind === 'videoinput' && item.deviceId && !isSkipCam(item.label);
		});
		const seenGroup = {};
		const out = [];
		raw.forEach(function (item, i) {
			const gid = item.groupId || ('solo-' + i);
			if (seenGroup[gid]) return;
			seenGroup[gid] = true;
			out.push(item);
		});
		out.sort(function (a, b) {
			if (preferredId && a.deviceId === preferredId) return -1;
			if (preferredId && b.deviceId === preferredId) return 1;
			const ap = PREFER_CAM.test(a.label) ? 1 : 0;
			const bp = PREFER_CAM.test(b.label) ? 1 : 0;
			return bp - ap;
		});
		return out;
	}

	function readDevices(kind) {
		if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
			return Promise.resolve([]);
		}
		return navigator.mediaDevices.enumerateDevices().then(function (list) {
			const cams = (list || []).filter(function (item) {
				if (item.kind !== 'videoinput' || !item.deviceId) return false;
				if (kind !== 'phone' && isSkipCam(item.label)) return false;
				return true;
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

	function withTimeout(promise, ms, message) {
		return new Promise(function (resolve, reject) {
			const timer = window.setTimeout(function () {
				const err = new Error(message);
				err.name = 'TimeoutError';
				reject(err);
			}, ms);
			promise.then(function (value) {
				window.clearTimeout(timer);
				resolve(value);
			}, function (err) {
				window.clearTimeout(timer);
				reject(err);
			});
		});
	}

	function getUserMediaTimed(constraints, ms) {
		return withTimeout(
			navigator.mediaDevices.getUserMedia(constraints),
			ms == null ? GUM_MS : ms,
			'Camera did not start in time'
		);
	}

	function openDisplayStream(preferredId, my) {
		function attempt(constraints, label) {
			if (my !== bootId) return Promise.reject(new Error('stale'));
			setPhase('connecting', 'Opening ' + (label || 'USB camera') + '…');
			return getUserMediaTimed(constraints, GUM_MS);
		}

		const sized = {
			audio: false,
			video: { width: { ideal: 640 }, height: { ideal: 480 } }
		};
		if (preferredId) {
			return attempt({
				audio: false,
				video: {
					deviceId: { exact: preferredId },
					width: { ideal: 640 },
					height: { ideal: 480 }
				}
			}, 'selected camera').catch(function () {
				return attempt(sized, 'USB 640×480');
			});
		}
		return attempt(sized, 'USB 640×480');
	}

	function waitForFrame(node, my) {
		return new Promise(function (resolve, reject) {
			let poll = 0;
			let settled = false;

			function stale() {
				return my !== bootId;
			}

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
				if (stale()) {
					resolve(false);
					return;
				}
				starting = false;
				ready = true;
				failed = false;
				lastToast = '';
				setPhase('live', isControl() ? 'Phone camera live' : 'Display camera live');
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
				if (stale()) {
					reject(err || new Error(message));
					return;
				}
				starting = false;
				failed = true;
				failMessage = message;
				stopLocal();
				setPhase('error', failMessage);
				reject(err || new Error(failMessage));
			}

			const watchdog = window.setTimeout(function () {
				fail(
					'Camera opened but sent no frames. Check the cable, close other apps using it, then tap Reconnect.',
					new Error('Camera timed out')
				);
			}, FRAME_MS);

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
		lastCfg = { deviceId: deviceId || '', facing: facing || '' };
		if (restartTimer) return Promise.resolve(false);
		if (stream && currentKey === key && ready) return Promise.resolve(true);
		if (starting && currentKey === key) return Promise.resolve(false);
		if (failed && lastAttemptKey === key) {
			if (phase !== 'error') setPhase('error', failMessage || 'Camera failed. Tap Reconnect.');
			return Promise.resolve(false);
		}
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			failed = true;
			failMessage = isControl()
				? 'Camera API not available. Open the HTTPS control URL (port 8443).'
				: 'Camera API not available in this Chromium. On the Pi, PipeWire must be running.';
			setPhase('error', failMessage);
			return Promise.reject(new Error(failMessage));
		}
		if (!window.isSecureContext && isControl()) {
			failed = true;
			failMessage = 'Phone camera needs HTTPS. Use Display for the USB cam, or open the HTTPS control URL.';
			setPhase('error', failMessage);
			return Promise.reject(new Error(failMessage));
		}

		stopLocal();
		const my = ++bootId;
		starting = true;
		ready = false;
		failed = false;
		currentKey = key;
		lastAttemptKey = key;
		if (isControl()) {
			setPhase('connecting', 'Opening this phone\'s camera…');
		}
		const node = ensureVideo();

		function attach(media) {
			if (my !== bootId) {
				stopTracks(media);
				return false;
			}
			stream = media;
			node.srcObject = media;
			const play = node.play();
			if (play && typeof play.catch === 'function') {
				play.catch(function () { /* autoplay may wait for metadata */ });
			}
			setPhase('connecting', 'Camera granted. Waiting for the first frame…');
			return waitForFrame(node, my);
		}

		return (isControl()
			? getUserMediaTimed(constraintsFor(deviceId, facing))
			: openDisplayStream(deviceId, my)
		).then(function (media) {
			if (my !== bootId) {
				stopTracks(media);
				return false;
			}
			return attach(media);
		}).catch(function (err) {
			if (my !== bootId) return;
			if (failed && failMessage && phase === 'error') throw err;
			starting = false;
			failed = true;
			const name = err && err.name;
			if (name === 'TimeoutError') {
				failMessage = isControl()
					? 'Camera did not start in time. Tap Reconnect.'
					: 'USB camera timed out. On the Pi kiosk, add --disable-features=WebRtcPipeWireCamera so Chromium uses V4L2 instead of PipeWire, then restart visual-synth-kiosk.';
			} else if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
				failMessage = 'Camera permission denied. On the Pi, add --use-fake-ui-for-media-stream to Chromium.';
			} else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
				failMessage = 'No camera found. ffmpeg can work while Chromium cannot — on Lite, install and start PipeWire.';
			} else if (name === 'NotReadableError' || name === 'TrackStartError') {
				failMessage = 'Camera is busy. Close other apps, confirm the pi user is in the video group, then Reconnect.';
			} else {
				failMessage = (err && err.message) || 'Camera failed';
			}
			stopLocal();
			setPhase('error', failMessage);
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

	function viewFor(source) {
		source = source || 'display';
		if (isControl() && source === 'display') {
			const live = !!remoteStatus.live;
			return {
				phase: remoteStatus.phase || 'idle',
				message: remoteStatus.message || 'Waiting for the display to open the USB camera…',
				live: live,
				hasDevices: displayDevices.length > 0 || live
			};
		}
		if (source === 'phone' && !isControl()) {
			return {
				phase: remoteReady ? 'live' : 'waiting',
				message: remoteReady ? 'Receiving phone camera' : 'Waiting for frames from the phone…',
				live: remoteReady,
				hasDevices: remoteReady
			};
		}
		return {
			phase: phase,
			message: statusMessage,
			live: !!ready,
			hasDevices: (isControl() ? phoneDevices : displayDevices).length > 0 || !!ready
		};
	}

	function reconnect(fromRemote) {
		bootId += 1;
		lastToast = '';
		failed = false;
		failMessage = '';
		lastAttemptKey = '';
		ready = false;
		remoteReady = false;
		stopLocal();
		if (restartTimer) {
			window.clearTimeout(restartTimer);
			restartTimer = 0;
		}
		if (!fromRemote && root.SynthSync && typeof root.SynthSync.sendCameraReconnect === 'function') {
			root.SynthSync.sendCameraReconnect();
		}

		const phoneParams = isControl() && root.SynthState ? neededPhone(root.SynthState.get()) : null;
		if (isControl() && !phoneParams) {
			emit();
			return;
		}

		setPhase('connecting', 'Reconnecting camera…');
		restartTimer = window.setTimeout(function () {
			restartTimer = 0;
			if (isControl()) {
				syncControl(root.SynthState.get());
				return;
			}
			startLocal(lastCfg.deviceId, lastCfg.facing).catch(function () { /* status already set */ });
		}, 250);
		emit();
	}

	function syncControl(state) {
		if (!isControl()) return;
		const params = neededPhone(state);
		if (!params) {
			if (currentKey || ready || starting) stopLocal();
			return;
		}
		startLocal(params.deviceId, params.deviceId ? '' : 'environment').then(function () {
			startSender();
		}).catch(function () { /* status already set */ });
	}

	root.SynthCamera = {
		onChange: function (fn) {
			if (typeof fn === 'function') listeners.push(fn);
		},
		signature: function () {
			const local = viewFor(isControl() ? 'phone' : 'display');
			const remote = isControl() ? viewFor('display') : viewFor('phone');
			return [
				isControl() ? 'c' : 'd',
				local.phase,
				local.live ? '1' : '0',
				remote.phase,
				remote.live ? '1' : '0',
				displayDevices.map(function (d) { return d.id; }).join(','),
				phoneDevices.map(function (d) { return d.id; }).join(',')
			].join(':');
		},
		view: viewFor,
		deviceOptions: function (source) {
			if (source === 'phone') {
				if (!isControl()) return [];
				if (!phoneDevices.length) return ready ? [{ id: '', label: 'This phone' }] : [];
				return [{ id: '', label: 'Default' }].concat(phoneDevices);
			}
			if (!displayDevices.length) return ready ? [{ id: '', label: 'Default USB' }] : [];
			return [{ id: '', label: 'Default USB' }].concat(displayDevices);
		},
		setDisplayDevices: function (list) {
			displayDevices = Array.isArray(list) ? list : [];
			emit();
		},
		setRemoteStatus: function (payload) {
			if (!payload || payload.source === 'phone') return;
			remoteStatus = {
				phase: payload.phase || 'idle',
				message: payload.message || '',
				live: !!payload.live,
				source: payload.source || 'display'
			};
			emit();
		},
		setRemoteFrame: function (url) {
			if (!url) return;
			ensureRemote();
			remoteImage.src = url;
		},
		syncControl: syncControl,
		reconnect: reconnect,
		ensure: function (cfg) {
			cfg = cfg || {};
			const source = cfg.source || 'display';
			if (isControl()) return;
			if (source === 'phone') {
				if (currentKey) stopLocal();
				ensureRemote();
				if (!remoteReady) {
					setPhase('waiting', 'Waiting for frames from the phone…');
				}
				return;
			}
			lastCfg = { deviceId: cfg.deviceId || '', facing: '' };
			if (restartTimer) return;
			startLocal(cfg.deviceId || '', '').catch(function () { /* status already set */ });
		},
		frame: function (source) {
			if (source === 'phone') {
				if (!remoteReady) return null;
				const el = ensureRemote();
				return { el: el, w: el.width, h: el.height };
			}
			if (!ready || !video || video.videoWidth < 2) return null;
			const vw = video.videoWidth;
			const vh = video.videoHeight;
			const w = vw > MAX_BLIT_W ? MAX_BLIT_W : vw;
			const h = Math.max(2, Math.round(vh * (w / vw)));
			return { el: video, w: w, h: h };
		},
		probeDisplay: function () {
			if (isControl()) return;
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
			if (!ready) return null;
			return blitLocal() || video;
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
		stop: function () {
			stopLocal();
			failed = false;
			if (phase === 'idle') return;
			phase = 'idle';
			statusMessage = 'Camera stopped.';
			emit();
			sendStatus();
		}
	};
})(window);
