const http = require('http');
const https = require('https');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
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
			name: 'ELOS 01',
			thumbnail: '',
			operators: DEFAULT_OPERATORS
		}
	],
	activePipeId: 'pipe_01',
	presets: [],
	templates: [],
	templatesSeeded: false,
	previewTemplateId: '',
	clock: {
		bpm: 120,
		originMs: Date.now()
	},
	debug: {
		enabled: false
	},
	output: {
		mapping: {
			enabled: true,
			mode: 'cornerPin',
			edit: false,
			template: false,
			corners: {
				tl: { x: 0, y: 0 },
				tr: { x: 1, y: 0 },
				br: { x: 1, y: 1 },
				bl: { x: 0, y: 1 }
			}
		},
		masks: {
			enabled: true,
			invert: false,
			items: []
		}
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

function mapChain(items, fn) {
	return (items || []).map((item) => {
		const operators = (item.operators || []).map(fn);
		return Object.assign({}, item, { operators: operators });
	});
}

function applyOpParam(state, opParam) {
	if (!opParam || !opParam.id) return state;
	const next = clone(state);
	const eachOp = (op) => {
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
		if (Object.prototype.hasOwnProperty.call(opParam, 'presetId')) {
			if (opParam.presetId) updated.presetId = opParam.presetId;
			else delete updated.presetId;
		}
		return updated;
	};
	next.pipes = mapChain(next.pipes, eachOp);
	next.templates = mapChain(next.templates, eachOp);
	return next;
}

function applyOpMod(state, opMod) {
	if (!opMod || !opMod.id || !opMod.key) return state;
	const next = clone(state);
	const eachOp = (op) => {
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
	};
	next.pipes = mapChain(next.pipes, eachOp);
	next.templates = mapChain(next.templates, eachOp);
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
	presets: true,
	templates: true,
	templatesSeeded: true,
	previewTemplateId: true,
	templateOps: true,
	templateThumb: true,
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
	if (Object.prototype.hasOwnProperty.call(patch, 'presets')) {
		next = clone(next);
		next.presets = Array.isArray(patch.presets) ? clone(patch.presets) : [];
	}
	if (Object.prototype.hasOwnProperty.call(patch, 'templates')) {
		next = clone(next);
		next.templates = Array.isArray(patch.templates) ? clone(patch.templates) : [];
		next.templatesSeeded = true;
	}
	if (Object.prototype.hasOwnProperty.call(patch, 'templatesSeeded')) {
		next = clone(next);
		next.templatesSeeded = !!patch.templatesSeeded;
	}
	if (Object.prototype.hasOwnProperty.call(patch, 'previewTemplateId')) {
		next = clone(next);
		next.previewTemplateId = patch.previewTemplateId ? String(patch.previewTemplateId) : '';
	}
	if (patch.templateOps && patch.templateOps.id) {
		next = clone(next);
		next.templates = (next.templates || []).map((item) => {
			if (item.id !== patch.templateOps.id) return item;
			const updated = clone(item);
			updated.operators = clone(patch.templateOps.operators || []);
			return updated;
		});
	}
	if (patch.templateThumb && patch.templateThumb.id) {
		next = clone(next);
		next.templates = (next.templates || []).map((item) => {
			if (item.id !== patch.templateThumb.id) return item;
			const updated = clone(item);
			updated.thumbnail = patch.templateThumb.thumbnail || '';
			return updated;
		});
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

function originFor(host, port, secure) {
	const proto = secure ? 'https' : 'http';
	if ((!secure && port === 80) || (secure && port === 443)) return proto + '://' + host;
	return proto + '://' + host + ':' + port;
}

function makeInfo(port, httpsPort) {
	const ip = lanAddress();
	const mdns = originFor(mdnsHost(), port);
	const ipOrigin = ip ? originFor(ip, port) : '';
	const httpsOrigin = httpsPort && ip ? originFor(ip, httpsPort, true) : '';
	return {
		hostname: os.hostname(),
		url: mdns,
		ipOrigin: ipOrigin,
		controlUrl: (ipOrigin || mdns) + '/control.html',
		httpsControlUrl: httpsOrigin ? httpsOrigin + '/control.html' : ''
	};
}

function ensureCerts() {
	const dir = path.join(__dirname, 'certs');
	const keyPath = path.join(dir, 'key.pem');
	const certPath = path.join(dir, 'cert.pem');
	if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
		return {
			key: fs.readFileSync(keyPath),
			cert: fs.readFileSync(certPath)
		};
	}
	try {
		fs.mkdirSync(dir, { recursive: true });
		execFileSync('openssl', [
			'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
			'-keyout', keyPath, '-out', certPath, '-days', '3650',
			'-subj', '/CN=visual-synth.local'
		], { stdio: 'ignore' });
		return {
			key: fs.readFileSync(keyPath),
			cert: fs.readFileSync(certPath)
		};
	} catch (err) {
		console.warn('HTTPS skipped (openssl not available). Phone camera needs a secure origin.');
		return null;
	}
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

const DATA_DIR = path.join(__dirname, 'data');
const PRESETS_PATH = path.join(DATA_DIR, 'presets.json');
const TEMPLATES_PATH = path.join(DATA_DIR, 'templates.json');

function persistedPresets(list) {
	return (Array.isArray(list) ? list : []).filter((item) => {
		return item && item.id && item.type && item.parameters && item.persisted && !item.builtin;
	}).map((item) => ({
		id: String(item.id),
		type: String(item.type),
		name: String(item.name || item.type).slice(0, 32),
		parameters: clone(item.parameters),
		persisted: true
	}));
}

function loadDiskPresets() {
	try {
		const raw = JSON.parse(fs.readFileSync(PRESETS_PATH, 'utf8'));
		return persistedPresets(Array.isArray(raw) ? raw : raw && raw.presets);
	} catch (err) {
		return [];
	}
}

function writeDiskPresets(list) {
	try {
		fs.mkdirSync(DATA_DIR, { recursive: true });
		fs.writeFileSync(PRESETS_PATH, JSON.stringify(persistedPresets(list), null, 2));
	} catch (err) {
		console.warn('Preset disk write failed: ' + err.message);
	}
}

function persistTemplate(item) {
	if (!item || !item.id || !Array.isArray(item.operators)) return null;
	const name = String(item.name || 'TEMPLATE').trim().slice(0, 32);
	if (!name) return null;
	return {
		id: String(item.id),
		name: name,
		thumbnail: typeof item.thumbnail === 'string' ? item.thumbnail : '',
		operators: clone(item.operators),
		persisted: true
	};
}

function persistedTemplates(list) {
	return (Array.isArray(list) ? list : []).map(persistTemplate).filter(Boolean);
}

function loadDiskTemplates() {
	if (!fs.existsSync(TEMPLATES_PATH)) {
		return { items: [], seeded: false };
	}
	try {
		const raw = JSON.parse(fs.readFileSync(TEMPLATES_PATH, 'utf8'));
		const items = persistedTemplates(Array.isArray(raw) ? raw : raw && raw.items);
		return { items: items, seeded: true };
	} catch (err) {
		return { items: [], seeded: true };
	}
}

function writeDiskTemplates(list) {
	try {
		fs.mkdirSync(DATA_DIR, { recursive: true });
		fs.writeFileSync(TEMPLATES_PATH, JSON.stringify(persistedTemplates(list), null, 2));
	} catch (err) {
		console.warn('Template disk write failed: ' + err.message);
	}
}

async function start() {
	const app = express();
	let port = Number(process.env.PORT) || 8080;
	let state = clone(DEFAULT_STATE);
	state.presets = loadDiskPresets();
	const diskTemplates = loadDiskTemplates();
	state.templates = diskTemplates.items;
	state.templatesSeeded = diskTemplates.seeded;

	app.get('/api/info', (_req, res) => {
		res.json(makeInfo(port));
	});
	app.use(express.static(ROOT));

	const server = http.createServer(app);
	const wss = new WebSocketServer({ noServer: true, maxPayload: 2 * 1024 * 1024 });
	let latestStats = { fps: null, tempC: readCpuTemp() };
	let livePreview = false;
	let cameras = [];
	let lastNotify = null;
	let httpsPort = 0;

	function attachUpgrade(httpServer) {
		httpServer.on('upgrade', (req, socket, head) => {
			wss.handleUpgrade(req, socket, head, (ws) => {
				wss.emit('connection', ws, req);
			});
		});
	}

	attachUpgrade(server);

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
				ws.send(JSON.stringify(Object.assign({ type: 'info' }, makeInfo(port, httpsPort))));
				ws.send(JSON.stringify({ type: 'stats', fps: latestStats.fps, tempC: latestStats.tempC }));
				ws.send(JSON.stringify({ type: 'live', enabled: livePreview }));
				ws.send(JSON.stringify({ type: 'cameras', devices: cameras }));
				if (lastNotify && ws.role === 'control' && Date.now() - lastNotify.at < 60000) {
					ws.send(JSON.stringify(lastNotify.payload));
				}
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

			if (msg.type === 'cameras') {
				cameras = Array.isArray(msg.devices) ? msg.devices : [];
				broadcast({ type: 'cameras', devices: cameras });
				return;
			}

			if (msg.type === 'cameraFrame' && msg.url) {
				const packed = JSON.stringify({ type: 'cameraFrame', url: msg.url });
				wss.clients.forEach((client) => {
					if (client !== ws && client.role === 'display' && client.readyState === 1) {
						client.send(packed);
					}
				});
				return;
			}

			if (msg.type === 'patch' && msg.patch) {
				state = applyPatch(state, msg.patch);
				if (Object.prototype.hasOwnProperty.call(msg.patch, 'presets')) {
					writeDiskPresets(state.presets);
				}
				if (
					Object.prototype.hasOwnProperty.call(msg.patch, 'templates') ||
					msg.patch.templateThumb ||
					msg.patch.templateOps
				) {
					writeDiskTemplates(state.templates);
					state.templatesSeeded = true;
				}
				broadcastState();
				return;
			}

			if (msg.type === 'notify' && msg.message) {
				const payload = {
					type: 'notify',
					level: msg.level || 'warning',
					message: String(msg.message)
				};
				lastNotify = (payload.level === 'warning' || payload.level === 'error')
					? { payload: payload, at: Date.now() }
					: lastNotify;
				const packed = JSON.stringify(payload);
				wss.clients.forEach((client) => {
					if (client.readyState !== 1) return;
					if (client.role !== 'control') return;
					if (client === ws) return;
					client.send(packed);
				});
				return;
			}

			if (msg.type === 'cameraStatus') {
				const packed = JSON.stringify({
					type: 'cameraStatus',
					source: msg.source || '',
					phase: msg.phase || 'idle',
					message: String(msg.message || ''),
					live: !!msg.live
				});
				wss.clients.forEach((client) => {
					if (client === ws || client.readyState !== 1) return;
					client.send(packed);
				});
				return;
			}

			if (msg.type === 'cameraReconnect') {
				const packed = JSON.stringify({ type: 'cameraReconnect' });
				wss.clients.forEach((client) => {
					if (client === ws || client.readyState !== 1) return;
					client.send(packed);
				});
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

	const ssl = ensureCerts();
	if (ssl) {
		const secure = https.createServer(ssl, app);
		attachUpgrade(secure);
		const preferredHttps = Number(process.env.HTTPS_PORT) || 8443;
		try {
			httpsPort = await listen(secure, preferredHttps);
		} catch (err) {
			console.warn('HTTPS listen failed on ' + preferredHttps + ': ' + err.message);
			httpsPort = 0;
		}
	}

	const info = makeInfo(port, httpsPort);
	console.log('ELO');
	console.log('  local   ' + originFor('127.0.0.1', port));
	console.log('  lan     ' + (info.ipOrigin || info.url));
	console.log('  control ' + info.controlUrl);
	if (info.httpsControlUrl) {
		console.log('  https   ' + info.httpsControlUrl + '  (phone camera)');
	}
}

start().catch((err) => {
	console.error(err);
	process.exit(1);
});
