(function (root) {
	let socket = null;
	let role = 'display';
	let connected = false;
	let handlers = {};
	const pending = [];

	function enqueue(payload) {
		if (!payload || (payload.type !== 'notify' && payload.type !== 'cameras' && payload.type !== 'cameraStatus')) return;
		pending.push(payload);
		if (pending.length > 24) pending.shift();
	}

	function inLab() {
		return document.body.classList.contains('lab-body');
	}

	function wsUrl() {
		const proto = location.protocol === 'https:' ? 'wss' : 'ws';
		return proto + '://' + location.host;
	}

	function send(payload) {
		if (!socket || socket.readyState !== WebSocket.OPEN) {
			enqueue(payload);
			return;
		}
		socket.send(JSON.stringify(payload));
	}

	function flushPending() {
		const queued = pending.splice(0, pending.length);
		queued.forEach(send);
	}

	function connect(options) {
		handlers = options || {};
		role = handlers.role || 'display';

		if (inLab() && !/(\?|&)ws=1\b/.test(location.search)) {
			if (handlers.onStatus) handlers.onStatus(false);
			return;
		}

		let ws;
		try {
			ws = new WebSocket(wsUrl());
		} catch (err) {
			if (handlers.onStatus) handlers.onStatus(false);
			return;
		}

		socket = ws;

		ws.addEventListener('open', function () {
			connected = true;
			send({ type: 'hello', role: role });
			flushPending();
			if (handlers.onStatus) handlers.onStatus(true);
		});

		ws.addEventListener('message', function (event) {
			let msg;
			try {
				msg = JSON.parse(event.data);
			} catch (err) {
				return;
			}
			if (msg.type === 'state' && handlers.onState) {
				handlers.onState(msg.state);
			} else if (msg.type === 'info' && handlers.onInfo) {
				handlers.onInfo(msg);
			} else if (msg.type === 'notify' && handlers.onNotify) {
				handlers.onNotify(msg.level, msg.message);
			} else if (msg.type === 'stats' && handlers.onStats) {
				handlers.onStats(msg);
			} else if (msg.type === 'preview' && handlers.onPreview) {
				handlers.onPreview(msg);
			} else if (msg.type === 'live' && handlers.onLive) {
				handlers.onLive(!!msg.enabled);
			} else if (msg.type === 'fft' && handlers.onFft) {
				handlers.onFft(msg);
			} else if (msg.type === 'cameras' && handlers.onCameras) {
				handlers.onCameras(msg.devices || []);
			} else if (msg.type === 'cameraFrame' && handlers.onCameraFrame) {
				handlers.onCameraFrame(msg.url);
			} else if (msg.type === 'cameraStatus' && handlers.onCameraStatus) {
				handlers.onCameraStatus(msg);
			} else if (msg.type === 'cameraReconnect' && handlers.onCameraReconnect) {
				handlers.onCameraReconnect();
			}
		});

		ws.addEventListener('close', function () {
			connected = false;
			if (handlers.onStatus) handlers.onStatus(false);
			if (!inLab()) {
				setTimeout(function () {
					connect(handlers);
				}, 1500);
			}
		});

		ws.addEventListener('error', function () {
			ws.close();
		});
	}

	root.SynthSync = {
		connect: connect,
		sendPatch: function (patch) {
			send({ type: 'patch', patch: patch });
		},
		sendNotify: function (level, message) {
			send({ type: 'notify', level: level, message: message });
		},
		sendStats: function (fpsOrStats) {
			const stats = typeof fpsOrStats === 'number'
				? { fps: fpsOrStats }
				: (fpsOrStats || {});
			send(Object.assign({ type: 'stats' }, stats));
		},
		sendLive: function (enabled) {
			send({ type: 'live', enabled: !!enabled });
		},
		sendPreview: function (url, pipeId) {
			send({ type: 'preview', url: url, pipeId: pipeId || '' });
		},
		sendFft: function (levels) {
			send({
				type: 'fft',
				low: levels && levels.low,
				mid: levels && levels.mid,
				high: levels && levels.high
			});
		},
		sendCameras: function (devices) {
			send({ type: 'cameras', devices: devices || [] });
		},
		sendCameraFrame: function (url) {
			if (!url) return;
			send({ type: 'cameraFrame', url: url });
		},
		sendCameraStatus: function (info) {
			if (!info) return;
			send({
				type: 'cameraStatus',
				source: info.source || '',
				phase: info.phase || 'idle',
				message: info.message || '',
				live: !!info.live
			});
		},
		sendCameraReconnect: function () {
			send({ type: 'cameraReconnect' });
		},
		connected: function () {
			return connected;
		}
	};
})(window);
