const http = require('http');
const os = require('os');
const fs = require('fs');
const path = require('path');
const express = require('express');
const { WebSocketServer } = require('ws');

const ROOT = path.join(__dirname, '..');

const DEFAULT_STATE = {
	generator: 'waves',
	waves: {
		frequency: 6.5,
		amplitude: 0.45,
		speed: 0.55,
		direction: 28,
		scale: 1.1
	},
	noise: {
		mode: 'color',
		scale: 3.5,
		speed: 0.35,
		intensity: 0.85,
		hue: 200
	},
	shader: {
		speed: 0.8,
		scale: 1.2,
		distortion: 0.9,
		intensity: 0.85,
		hue: 310
	},
	camera: {
		enabled: false,
		opacity: 0.45,
		blendMode: 'screen',
		intensity: 1
	},
	debug: {
		enabled: false
	}
};

function clone(value) {
	return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
	return value && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(target, patch) {
	const out = clone(target);
	Object.keys(patch || {}).forEach((key) => {
		const next = patch[key];
		const prev = out[key];
		if (isPlainObject(next) && isPlainObject(prev)) {
			out[key] = deepMerge(prev, next);
		} else {
			out[key] = next;
		}
	});
	return out;
}

function lanAddress() {
	const nets = os.networkInterfaces();
	const preferred = [];
	const rest = [];
	Object.keys(nets).forEach((name) => {
		(nets[name] || []).forEach((net) => {
			const ipv4 = net.family === 'IPv4' || net.family === 4;
			if (!ipv4 || net.internal) return;
			if (/wlan|wifi|eth|enp|ens|wl/i.test(name)) preferred.push(net.address);
			else rest.push(net.address);
		});
	});
	return preferred[0] || rest[0] || '';
}

function mdnsHost() {
	return String(os.hostname() || 'visual-synth').split('.')[0] + '.local';
}

function readCpuTemp() {
	try {
		const raw = fs.readFileSync('/sys/class/thermal/thermal_zone0/temp', 'utf8');
		const milli = Number(raw);
		if (!Number.isFinite(milli)) return null;
		return milli / 1000;
	} catch (err) {
		return null;
	}
}

function originFor(host, port) {
	if (port === 80) return 'http://' + host;
	return 'http://' + host + ':' + port;
}

function makeInfo(port) {
	const ip = lanAddress();
	const mdns = originFor(mdnsHost(), port);
	const ipOrigin = ip ? originFor(ip, port) : '';
	return {
		hostname: os.hostname(),
		url: mdns,
		ipOrigin: ipOrigin,
		controlUrl: (ipOrigin || mdns) + '/control.html'
	};
}

function listen(server, port) {
	return new Promise((resolve, reject) => {
		const onError = (err) => reject(err);
		server.once('error', onError);
		server.listen(port, () => {
			server.off('error', onError);
			resolve(port);
		});
	});
}

async function start() {
	const app = express();
	let port = Number(process.env.PORT) || 8080;
	let state = clone(DEFAULT_STATE);

	app.get('/api/info', (_req, res) => {
		res.json(makeInfo(port));
	});
	app.use(express.static(ROOT));

	const server = http.createServer(app);
	const wss = new WebSocketServer({ server });
	let latestStats = { fps: null, tempC: readCpuTemp() };

	function broadcastState() {
		const packed = JSON.stringify({ type: 'state', state: state });
		wss.clients.forEach((client) => {
			if (client.readyState === 1) client.send(packed);
		});
	}

	function broadcast(payload, except) {
		const packed = JSON.stringify(payload);
		wss.clients.forEach((client) => {
			if (client !== except && client.readyState === 1) client.send(packed);
		});
	}

	function broadcastStats() {
		latestStats.tempC = readCpuTemp();
		const payload = { type: 'stats', fps: latestStats.fps, tempC: latestStats.tempC };
		wss.clients.forEach((client) => {
			if (client.readyState === 1) client.send(JSON.stringify(payload));
		});
	}

	wss.on('connection', (ws) => {
		ws.on('message', (raw) => {
			let msg;
			try {
				msg = JSON.parse(String(raw));
			} catch (err) {
				return;
			}

			if (msg.type === 'hello') {
				ws.send(JSON.stringify({ type: 'state', state: state }));
				ws.send(JSON.stringify(Object.assign({ type: 'info' }, makeInfo(port))));
				ws.send(JSON.stringify({ type: 'stats', fps: latestStats.fps, tempC: latestStats.tempC }));
				return;
			}

			if (msg.type === 'patch' && msg.patch) {
				state = deepMerge(state, msg.patch);
				broadcastState();
				return;
			}

			if (msg.type === 'notify' && msg.message) {
				broadcast({ type: 'notify', level: msg.level || 'warning', message: msg.message }, ws);
				return;
			}

			if (msg.type === 'stats' && msg.fps != null) {
				latestStats.fps = Number(msg.fps);
				broadcastStats();
			}
		});
	});

	setInterval(broadcastStats, 2000);

	const preferred = port;
	try {
		port = await listen(server, preferred);
	} catch (err) {
		if (preferred === 80 && (err.code === 'EACCES' || err.code === 'EADDRINUSE')) {
			port = await listen(server, 8080);
		} else {
			throw err;
		}
	}

	const info = makeInfo(port);
	console.log('Visual Synth');
	console.log('  local   ' + originFor('127.0.0.1', port));
	console.log('  lan     ' + (info.ipOrigin || info.url));
	console.log('  control ' + info.controlUrl);
}

start().catch((err) => {
	console.error(err);
	process.exit(1);
});
