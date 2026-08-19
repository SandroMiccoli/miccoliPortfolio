const http = require('http');
const os = require('os');
const fs = require('fs');
const path = require('path');
const express = require('express');
const { WebSocketServer } = require('ws');

const ROOT = path.join(__dirname, '..');

const DEFAULT_OPERATORS = [
	{
		id: 'op_lines',
		type: 'lines',
		name: 'Lines',
		bypassed: false,
		parameters: {
			density: 18,
			thickness: 0.22,
			angle: 12,
			spread: 38,
			speed: 0.25,
			mix: 0.55,
			invert: 0,
			blendMode: 'normal'
		}
	},
	{
		id: 'op_warp',
		type: 'warp',
		name: 'Warp',
		bypassed: false,
		parameters: { amount: 0.22, frequency: 4.5, speed: 0.4, detail: 0.65 }
	},
	{
		id: 'op_lookup',
		type: 'lookup',
		name: 'Color Lookup',
		bypassed: false,
		parameters: {
			paletteId: 'fire',
			colors: ['#5C0812', '#D62408', '#FF9412', '#FFECC6'],
			bg: '#080206',
			savedPalettes: [],
			hue: 0,
			saturation: 1,
			exposure: 1
		}
	},
	{
		id: 'op_bloom',
		type: 'bloom',
		name: 'Bloom',
		bypassed: false,
		parameters: { threshold: 0.32, intensity: 0.9, radius: 1.35 }
	},
	{
		id: 'op_screen',
		type: 'screen',
		name: 'Screen',
		bypassed: false,
		parameters: { gain: 1 }
	}
];

const DEFAULT_STATE = {
	pipes: [
		{
			id: 'pipe_01',
			name: 'PIPE 01',
			thumbnail: '',
			operators: DEFAULT_OPERATORS
		}
	],
	activePipeId: 'pipe_01',
	clock: {
		bpm: 120,
		originMs: Date.now()
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

function applyOpParam(state, opParam) {
	if (!opParam || !opParam.id) return state;
	const next = clone(state);
	next.pipes = (next.pipes || []).map((pipe) => {
		const operators = (pipe.operators || []).map((op) => {
			if (op.id !== opParam.id) return op;
			const updated = clone(op);
			updated.parameters = updated.parameters || {};
			if (opParam.parameters) {
				Object.keys(opParam.parameters).forEach((key) => {
					updated.parameters[key] = opParam.parameters[key];
				});
			} else if (Object.prototype.hasOwnProperty.call(opParam, 'key')) {
				updated.parameters[opParam.key] = opParam.value;
			}
			if (typeof opParam.bypassed === 'boolean') {
				updated.bypassed = opParam.bypassed;
			}
			return updated;
		});
		return Object.assign({}, pipe, { operators: operators });
	});
	return next;
}

function applyOpMod(state, opMod) {
	if (!opMod || !opMod.id || !opMod.key) return state;
	const next = clone(state);
	next.pipes = (next.pipes || []).map((pipe) => {
		const operators = (pipe.operators || []).map((op) => {
			if (op.id !== opMod.id) return op;
			const updated = clone(op);
			updated.modulations = updated.modulations || {};
			if (!opMod.modulation) {
				delete updated.modulations[opMod.key];
				return updated;
			}
			updated.modulations[opMod.key] = Object.assign(
				{},
				updated.modulations[opMod.key] || {},
				opMod.modulation
			);
			return updated;
		});
		return Object.assign({}, pipe, { operators: operators });
	});
	return next;
}

function setActiveOperators(state, operators) {
	const next = clone(state);
	const id = next.activePipeId;
	next.pipes = (next.pipes || []).map((pipe) => {
		if (pipe.id !== id) return pipe;
		const updated = clone(pipe);
		updated.operators = clone(operators);
		return updated;
	});
	return next;
}

const PATCH_KEYS = {
	pipes: true,
	activePipeId: true,
	operators: true,
	pipeline: true,
	opParam: true,
	opMod: true,
	pipeThumb: true,
	pipeMeta: true
};

function applyPatch(state, patch) {
	if (!patch) return state;
	let next = state;
	if (Object.prototype.hasOwnProperty.call(patch, 'pipes')) {
		next = clone(next);
		next.pipes = clone(patch.pipes);
	}
	if (Object.prototype.hasOwnProperty.call(patch, 'activePipeId')) {
		next = clone(next);
		next.activePipeId = patch.activePipeId;
	}
	if (Object.prototype.hasOwnProperty.call(patch, 'operators')) {
		next = setActiveOperators(next, patch.operators);
	}
	if (Object.prototype.hasOwnProperty.call(patch, 'pipeline')) {
		next = setActiveOperators(next, patch.pipeline);
	}
	if (patch.opParam) {
		next = applyOpParam(next, patch.opParam);
	}
	if (patch.opMod) {
		next = applyOpMod(next, patch.opMod);
	}
	if (patch.pipeThumb && patch.pipeThumb.id) {
		next = clone(next);
		next.pipes = (next.pipes || []).map((pipe) => {
			if (pipe.id !== patch.pipeThumb.id) return pipe;
			const updated = clone(pipe);
			updated.thumbnail = patch.pipeThumb.thumbnail || '';
			return updated;
		});
	}
	if (patch.pipeMeta && patch.pipeMeta.id) {
		next = clone(next);
		next.pipes = (next.pipes || []).map((pipe) => {
			if (pipe.id !== patch.pipeMeta.id) return pipe;
			const updated = clone(pipe);
			if (typeof patch.pipeMeta.name === 'string') {
				updated.name = patch.pipeMeta.name;
			}
			return updated;
		});
	}
	const rest = {};
	Object.keys(patch).forEach((key) => {
		if (PATCH_KEYS[key]) return;
		rest[key] = patch[key];
	});
	if (Object.keys(rest).length) {
		next = deepMerge(next, rest);
	}
	return next;
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
	let livePreview = false;

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
				ws.role = msg.role || '';
				ws.send(JSON.stringify({ type: 'state', state: state }));
				ws.send(JSON.stringify(Object.assign({ type: 'info' }, makeInfo(port))));
				ws.send(JSON.stringify({ type: 'stats', fps: latestStats.fps, tempC: latestStats.tempC }));
				ws.send(JSON.stringify({ type: 'live', enabled: livePreview }));
				return;
			}

			if (msg.type === 'live') {
				livePreview = !!msg.enabled;
				broadcast({ type: 'live', enabled: livePreview });
				return;
			}

			if (msg.type === 'preview' && msg.url) {
				broadcast({ type: 'preview', url: msg.url, pipeId: msg.pipeId || '' }, ws);
				return;
			}

			if (msg.type === 'patch' && msg.patch) {
				state = applyPatch(state, msg.patch);
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
				return;
			}

			if (msg.type === 'fft') {
				broadcast({
					type: 'fft',
					low: Number(msg.low) || 0,
					mid: Number(msg.mid) || 0,
					high: Number(msg.high) || 0
				}, ws);
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
