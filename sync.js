(function (root) {
	let socket = null;
	let role = 'display';
	let connected = false;
	let handlers = {};

	function inLab() {
		return document.body.classList.contains('lab-body');
	}

	function wsUrl() {
		const proto = location.protocol === 'https:' ? 'wss' : 'ws';
		return proto + '://' + location.host;
	}

	function send(payload) {
		if (!socket || socket.readyState !== WebSocket.OPEN) return;
		socket.send(JSON.stringify(payload));
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
		sendStats: function (fps) {
			send({ type: 'stats', fps: fps });
		},
		connected: function () {
			return connected;
		}
	};
})(window);
