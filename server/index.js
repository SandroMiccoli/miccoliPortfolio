const http = require('http');
const https = require('https');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const express = require('express');
const { WebSocketServer } = require('ws');
const irCam = require('./ir');

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
			name: 'Chain 01',
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
	autoplay: {
		enabled: false,
		mode: 'sequential',
		unit: 'seconds',
		intervalSec: 8,
		intervalBars: 4,
		lastSwitchMs: 0,
		shuffleQueue: []
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

const AP_GATEWAY = '10.42.0.1';

const CAPTIVE_PATHS = new Set([
	'/hotspot-detect.html',
	'/library/test/success.html',
	'/success.txt',
	'/generate_204',
	'/gen_204',
	'/ncsi.txt',
	'/connecttest.txt',
	'/redirect',
	'/canonical.html',
	'/mobile/status.php'
]);

function isApMode() {
	const forced = process.env.ELO_NET_MODE;
	if (forced === 'ap') return true;
	if (forced === 'wifi') return false;
	const nets = os.networkInterfaces();
	let found = false;
	Object.keys(nets).forEach((name) => {
		if (found) return;
		(nets[name] || []).forEach((net) => {
			if (found) return;
			const ipv4 = net.family === 'IPv4' || net.family === 4;
			if (ipv4 && net.address === AP_GATEWAY) found = true;
		});
	});
	return found;
}

function isLoopbackHost(host) {
	const h = String(host || '').split(':')[0].toLowerCase();
	return h === '127.0.0.1' || h === 'localhost' || h === '::1';
}

function isStaticAsset(reqPath) {
	return /\.[a-z0-9]{1,8}$/i.test(reqPath);
}

function attachCaptivePortal(app) {
	const controlFile = path.join(ROOT, 'control.html');
	app.use((req, res, next) => {
		if (!isApMode()) return next();
		if (req.method !== 'GET' && req.method !== 'HEAD') return next();
		if (isLoopbackHost(req.hostname)) return next();
		if (req.path === '/control' || req.path.startsWith('/control/')) return next();
		if (req.path.startsWith('/api')) return next();
		if (CAPTIVE_PATHS.has(req.path) || !isStaticAsset(req.path)) {
			if (req.method === 'HEAD') {
				res.status(200).end();
				return;
			}
			res.sendFile(controlFile);
			return;
		}
		next();
	});
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
	const ap = isApMode();
	const ip = ap ? AP_GATEWAY : lanAddress();
	const mdns = originFor(mdnsHost(), port);
	const ipOrigin = ip ? originFor(ip, port) : '';
	const httpsOrigin = httpsPort && ip ? originFor(ip, httpsPort, true) : '';
	return {
		hostname: os.hostname(),
		url: mdns,
		ipOrigin: ipOrigin,
		controlUrl: (ipOrigin || mdns) + '/control',
		httpsControlUrl: httpsOrigin ? httpsOrigin + '/control' : '',
		apMode: ap
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
	const host = process.env.HOST || '0.0.0.0';
	return new Promise((resolve, reject) => {
		const onError = (err) => reject(err);
		server.once('error', onError);
		server.listen(port, host, () => {
			server.off('error', onError);
			resolve(port);
		});
	});
}

const DATA_DIR = path.join(__dirname, 'data');
const LIBRARY_DIR = path.join(ROOT, 'library');
const LIB_TEMPLATES_DIR = path.join(LIBRARY_DIR, 'templates');
const LIB_PRESETS_DIR = path.join(LIBRARY_DIR, 'presets');
const DATA_TEMPLATES_DIR = path.join(DATA_DIR, 'templates');
const DATA_PRESETS_DIR = path.join(DATA_DIR, 'presets');
const PRESETS_PATH = path.join(DATA_DIR, 'presets.json');
const TEMPLATES_PATH = path.join(DATA_DIR, 'templates.json');
const HIDDEN_PATH = path.join(DATA_DIR, 'hidden.json');
const SKIP_PARAMS = { savedPalettes: true, deviceId: true, dirty: true };

let suppressWatchUntil = 0;

function markWrite() {
	suppressWatchUntil = Date.now() + 900;
}

function safeFileName(id) {
	const base = String(id || '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 64);
	return (base || 'item') + '.json';
}

function compactParams(parameters) {
	const src = parameters || {};
	const out = {};
	Object.keys(src).forEach((key) => {
		if (SKIP_PARAMS[key]) return;
		out[key] = clone(src[key]);
	});
	return out;
}

function compactOperators(operators) {
	return (operators || []).map((op) => {
		if (!op || !op.type) return null;
		const item = {
			type: String(op.type),
			parameters: compactParams(op.parameters)
		};
		if (op.bypassed) item.bypassed = true;
		if (op.modulations && Object.keys(op.modulations).length) {
			item.modulations = clone(op.modulations);
		}
		return item;
	}).filter(Boolean);
}

function readJsonFile(file) {
	try {
		return JSON.parse(fs.readFileSync(file, 'utf8'));
	} catch (err) {
		return null;
	}
}

function writeJsonFile(file, value) {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}

function indexOrder(dir) {
	const ranked = {};
	const index = readJsonFile(path.join(dir, 'index.json'));
	if (Array.isArray(index)) {
		index.forEach((name, i) => {
			ranked[String(name)] = i;
		});
	}
	return ranked;
}

function listJsonFiles(dir) {
	if (!fs.existsSync(dir)) return [];
	let names;
	try {
		names = fs.readdirSync(dir).filter((name) => name.endsWith('.json') && name !== 'index.json');
	} catch (err) {
		return [];
	}
	const rank = indexOrder(dir);
	names.sort((a, b) => {
		const ia = rank[a];
		const ib = rank[b];
		if (ia == null && ib == null) return a.localeCompare(b);
		if (ia == null) return 1;
		if (ib == null) return -1;
		return ia - ib;
	});
	return names.map((name) => path.join(dir, name));
}

function persistPreset(item) {
	if (!item || item.builtin || !item.id || !item.type || !item.parameters) return null;
	if (item.persisted === false) return null;
	return {
		id: String(item.id),
		type: String(item.type),
		name: String(item.name || item.type).slice(0, 32),
		parameters: compactParams(item.parameters)
	};
}

function persistTemplate(item) {
	if (!item || !item.id || !Array.isArray(item.operators)) return null;
	const name = String(item.name || 'TEMPLATE').trim().slice(0, 32);
	if (!name) return null;
	return {
		id: String(item.id),
		name: name,
		operators: compactOperators(item.operators)
	};
}

function sameDoc(a, b) {
	return JSON.stringify(a || null) === JSON.stringify(b || null);
}

function loadPresetFile(file, origin) {
	const raw = readJsonFile(file);
	const item = persistPreset(Object.assign({}, raw, {
		id: (raw && raw.id) || path.basename(file, '.json'),
		persisted: true
	}));
	if (!item) return null;
	return Object.assign({}, item, {
		persisted: true,
		origin: origin || 'disk'
	});
}

function loadTemplateFile(file, origin) {
	const raw = readJsonFile(file);
	const item = persistTemplate(Object.assign({}, raw, {
		id: (raw && raw.id) || path.basename(file, '.json')
	}));
	if (!item) return null;
	return Object.assign({}, item, {
		thumbnail: '',
		persisted: true,
		origin: origin || 'disk'
	});
}

function loadDirItems(dir, origin, loader) {
	return listJsonFiles(dir).map((file) => loader(file, origin)).filter(Boolean);
}

function loadHidden() {
	const raw = readJsonFile(HIDDEN_PATH);
	const templates = raw && Array.isArray(raw.templates) ? raw.templates.map(String) : [];
	const presets = raw && Array.isArray(raw.presets) ? raw.presets.map(String) : [];
	return { templates: templates, presets: presets };
}

function writeHidden(hidden) {
	markWrite();
	writeJsonFile(HIDDEN_PATH, {
		templates: (hidden && hidden.templates) || [],
		presets: (hidden && hidden.presets) || []
	});
}

function keepThumbs(prev, next) {
	const thumbs = {};
	(prev || []).forEach((item) => {
		if (item && item.id && item.thumbnail) thumbs[item.id] = item.thumbnail;
	});
	return (next || []).map((item) => {
		if (!item || item.thumbnail) return item;
		const thumb = thumbs[item.id];
		return thumb ? Object.assign({}, item, { thumbnail: thumb }) : item;
	});
}

function mergeById(library, user, hiddenIds) {
	const hidden = {};
	(hiddenIds || []).forEach((id) => {
		hidden[id] = true;
	});
	const byId = {};
	(library || []).forEach((item) => {
		if (!item || hidden[item.id]) return;
		byId[item.id] = item;
	});
	(user || []).forEach((item) => {
		if (!item) return;
		byId[item.id] = item;
	});
	const out = [];
	const seen = {};
	(library || []).forEach((item) => {
		if (!item || hidden[item.id] || seen[item.id]) return;
		seen[item.id] = true;
		out.push(byId[item.id]);
	});
	(user || []).forEach((item) => {
		if (!item || seen[item.id]) return;
		seen[item.id] = true;
		out.push(item);
	});
	return out;
}

function loadLibraryTemplates() {
	return loadDirItems(LIB_TEMPLATES_DIR, 'library', loadTemplateFile);
}

function loadUserTemplates() {
	return loadDirItems(DATA_TEMPLATES_DIR, 'disk', loadTemplateFile);
}

function loadLibraryPresets() {
	return loadDirItems(LIB_PRESETS_DIR, 'library', loadPresetFile);
}

function loadUserPresets() {
	return loadDirItems(DATA_PRESETS_DIR, 'disk', loadPresetFile);
}

function combinedTemplates() {
	return mergeById(loadLibraryTemplates(), loadUserTemplates(), loadHidden().templates);
}

function combinedPresets(sessionPresets) {
	const session = (sessionPresets || []).filter((item) => {
		return item && item.persisted === false && !item.builtin;
	}).map((item) => Object.assign({}, persistPreset(Object.assign({}, item, { persisted: true })), {
		persisted: false,
		origin: 'session'
	})).filter(Boolean);
	return session.concat(mergeById(loadLibraryPresets(), loadUserPresets(), loadHidden().presets));
}

function migrateLegacyList(file, dir, pick, persist) {
	if (!fs.existsSync(file)) return;
	try {
		if (fs.existsSync(dir) && listJsonFiles(dir).length) return;
		const raw = readJsonFile(file);
		const items = pick(raw);
		if (!items.length) return;
		fs.mkdirSync(dir, { recursive: true });
		items.forEach((item) => {
			const doc = persist(item);
			if (!doc) return;
			fs.writeFileSync(path.join(dir, safeFileName(doc.id)), JSON.stringify(doc, null, 2) + '\n');
		});
	} catch (err) {
		console.warn('Legacy migrate failed for ' + file + ': ' + err.message);
	}
}

function migrateLegacy() {
	const libraryIds = {};
	loadLibraryTemplates().forEach((item) => {
		libraryIds[item.id] = true;
	});
	migrateLegacyList(TEMPLATES_PATH, DATA_TEMPLATES_DIR, (raw) => {
		return (Array.isArray(raw) ? raw : ((raw && raw.items) || [])).filter((item) => {
			return item && item.id && !libraryIds[item.id];
		});
	}, persistTemplate);
	migrateLegacyList(PRESETS_PATH, DATA_PRESETS_DIR, (raw) => {
		return Array.isArray(raw) ? raw : ((raw && raw.presets) || []);
	}, persistPreset);
}

function clearDirFiles(dir, keepIds) {
	if (!fs.existsSync(dir)) return;
	listJsonFiles(dir).forEach((file) => {
		const raw = readJsonFile(file);
		const id = raw && raw.id ? String(raw.id) : path.basename(file, '.json');
		if (keepIds[id]) return;
		try {
			fs.unlinkSync(file);
		} catch (err) { /* ignore */ }
	});
}

function persistTemplatesFromState(list) {
	const library = loadLibraryTemplates();
	const libById = {};
	library.forEach((item) => {
		libById[item.id] = persistTemplate(item);
	});
	const hidden = [];
	const keep = {};
	markWrite();
	fs.mkdirSync(DATA_TEMPLATES_DIR, { recursive: true });
	library.forEach((item) => {
		const live = (list || []).find((entry) => entry && entry.id === item.id);
		if (!live) hidden.push(item.id);
	});
	(list || []).forEach((item) => {
		if (!item || item.origin === 'library') return;
		const doc = persistTemplate(item);
		if (!doc) return;
		const lib = libById[doc.id];
		if (lib && sameDoc(lib, doc)) {
			const overlay = path.join(DATA_TEMPLATES_DIR, safeFileName(doc.id));
			if (fs.existsSync(overlay)) {
				try { fs.unlinkSync(overlay); } catch (err) { /* ignore */ }
			}
			return;
		}
		keep[doc.id] = true;
		writeJsonFile(path.join(DATA_TEMPLATES_DIR, safeFileName(doc.id)), doc);
	});
	clearDirFiles(DATA_TEMPLATES_DIR, keep);
	const prev = loadHidden();
	writeHidden({ templates: hidden, presets: prev.presets });
}

function persistPresetsFromState(list) {
	const library = loadLibraryPresets();
	const libById = {};
	library.forEach((item) => {
		libById[item.id] = persistPreset(item);
	});
	const hidden = [];
	const keep = {};
	markWrite();
	fs.mkdirSync(DATA_PRESETS_DIR, { recursive: true });
	library.forEach((item) => {
		const live = (list || []).find((entry) => entry && entry.id === item.id);
		if (!live) hidden.push(item.id);
	});
	(list || []).forEach((item) => {
		if (!item || item.builtin || item.persisted === false || item.origin === 'library') return;
		const doc = persistPreset(item);
		if (!doc) return;
		if (libById[doc.id] && sameDoc(libById[doc.id], doc)) {
			const overlay = path.join(DATA_PRESETS_DIR, safeFileName(doc.id));
			if (fs.existsSync(overlay)) {
				try { fs.unlinkSync(overlay); } catch (err) { /* ignore */ }
			}
			return;
		}
		keep[doc.id] = true;
		writeJsonFile(path.join(DATA_PRESETS_DIR, safeFileName(doc.id)), doc);
	});
	clearDirFiles(DATA_PRESETS_DIR, keep);
	const prev = loadHidden();
	writeHidden({ templates: prev.templates, presets: hidden });
}

function persistOneTemplate(item) {
	const doc = persistTemplate(item);
	if (!doc) return;
	const lib = persistTemplate(loadLibraryTemplates().find((entry) => entry.id === doc.id) || null);
	markWrite();
	if (lib && sameDoc(lib, doc)) {
		const overlay = path.join(DATA_TEMPLATES_DIR, safeFileName(doc.id));
		if (fs.existsSync(overlay)) {
			try { fs.unlinkSync(overlay); } catch (err) { /* ignore */ }
		}
		return;
	}
	writeJsonFile(path.join(DATA_TEMPLATES_DIR, safeFileName(doc.id)), doc);
}

function watchDirs(dirs, onChange) {
	let timer = 0;
	const kick = () => {
		if (Date.now() < suppressWatchUntil) return;
		clearTimeout(timer);
		timer = setTimeout(() => {
			if (Date.now() < suppressWatchUntil) return;
			onChange();
		}, 280);
	};
	dirs.forEach((dir) => {
		try {
			fs.mkdirSync(dir, { recursive: true });
			fs.watch(dir, kick);
		} catch (err) {
			console.warn('Watch failed for ' + dir + ': ' + err.message);
		}
	});
}

async function start() {
	const app = express();
	let port = Number(process.env.PORT) || 8080;
	migrateLegacy();
	let state = clone(DEFAULT_STATE);
	state.presets = combinedPresets([]);
	state.templates = combinedTemplates();
	state.templatesSeeded = true;

	function mergeCameraList(list) {
		const ir = irCam.deviceOption();
		const rest = (Array.isArray(list) ? list : []).filter((item) => {
			if (!item || !item.id) return false;
			if (irCam.isIrId(item.id)) return false;
			const label = String(item.label || '');
			return !/\bDEPTH\s*$/i.test(label.replace(/\s*\([^)]*\)\s*$/, '').trim());
		});
		if (!ir) return rest;
		return rest.concat(ir);
	}

	app.get('/api/info', (_req, res) => {
		res.json(makeInfo(port));
	});
	app.get('/control/', (_req, res) => {
		res.redirect(302, '/control');
	});
	app.get('/control', (_req, res) => {
		res.sendFile(path.join(ROOT, 'control.html'));
	});
	irCam.attach(app);
	attachCaptivePortal(app);
	app.use(express.static(ROOT));

	const server = http.createServer(app);
	const wss = new WebSocketServer({
		noServer: true,
		maxPayload: 8 * 1024 * 1024,
		perMessageDeflate: false
	});
	let latestStats = { fps: null, tempC: readCpuTemp(), frameMs: null, size: null };
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

	function isLoopback(req) {
		const addr = req && req.socket && req.socket.remoteAddress;
		return addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1';
	}

	function hasLocalDisplay() {
		let found = false;
		wss.clients.forEach((client) => {
			if (found) return;
			if (client.readyState === 1 && client.role === 'display' && client.fromLoopback) {
				found = true;
			}
		});
		return found;
	}

	function statsPayload() {
		return {
			type: 'stats',
			fps: latestStats.fps,
			tempC: latestStats.tempC,
			frameMs: latestStats.frameMs,
			size: latestStats.size,
			source: 'display'
		};
	}

	function broadcastStats() {
		latestStats.tempC = readCpuTemp();
		const packed = JSON.stringify(statsPayload());
		wss.clients.forEach((client) => {
			if (client.readyState === 1) client.send(packed);
		});
	}

	wss.on('connection', (ws, req) => {
		ws.fromLoopback = isLoopback(req);
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
				ws.send(JSON.stringify(statsPayload()));
				ws.send(JSON.stringify({ type: 'live', enabled: livePreview }));
				ws.send(JSON.stringify({ type: 'cameras', devices: mergeCameraList(cameras) }));
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
				if (typeof msg.url !== 'string' || msg.url.length > 900000) return;
				const packed = JSON.stringify({
					type: 'preview',
					url: msg.url,
					pipeId: msg.pipeId || ''
				});
				wss.clients.forEach((client) => {
					if (client === ws || client.readyState !== 1 || client.role !== 'control') return;
					if (client.bufferedAmount > 256 * 1024) return;
					client.send(packed);
				});
				return;
			}

			if (msg.type === 'cameras') {
				cameras = mergeCameraList(msg.devices);
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
					persistPresetsFromState(state.presets);
				}
				if (Object.prototype.hasOwnProperty.call(msg.patch, 'templates')) {
					persistTemplatesFromState(state.templates);
					state.templatesSeeded = true;
				} else if (msg.patch.templateOps && msg.patch.templateOps.id) {
					state.templates = (state.templates || []).map((item) => {
						if (item.id !== msg.patch.templateOps.id) return item;
						return Object.assign({}, item, { origin: 'disk', persisted: true });
					});
					const live = (state.templates || []).find((item) => item.id === msg.patch.templateOps.id);
					if (live) persistOneTemplate(live);
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

			if (msg.type === 'cameraArm') {
				const packed = JSON.stringify({ type: 'cameraArm' });
				wss.clients.forEach((client) => {
					if (client === ws || client.readyState !== 1) return;
					client.send(packed);
				});
				return;
			}

			if (msg.type === 'stats' && msg.fps != null) {
				if (ws.role !== 'display') return;
				if (hasLocalDisplay() && !ws.fromLoopback) return;
				latestStats.fps = Number(msg.fps);
				latestStats.frameMs = msg.frameMs != null && isFinite(Number(msg.frameMs))
					? Number(msg.frameMs)
					: null;
				latestStats.size = msg.size && isFinite(Number(msg.size.w)) && isFinite(Number(msg.size.h))
					? { w: Math.round(Number(msg.size.w)), h: Math.round(Number(msg.size.h)) }
					: null;
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

	watchDirs(
		[LIB_TEMPLATES_DIR, DATA_TEMPLATES_DIR, LIB_PRESETS_DIR, DATA_PRESETS_DIR],
		() => {
			const nextTemplates = keepThumbs(state.templates, combinedTemplates());
			const nextPresets = combinedPresets(state.presets);
			const tplChanged = JSON.stringify((state.templates || []).map((item) => {
				return [item.id, item.name, item.origin, compactOperators(item.operators)];
			})) !== JSON.stringify((nextTemplates || []).map((item) => {
				return [item.id, item.name, item.origin, compactOperators(item.operators)];
			}));
			const preChanged = JSON.stringify((state.presets || []).map((item) => {
				return [item.id, item.name, item.origin, item.persisted, item.parameters];
			})) !== JSON.stringify((nextPresets || []).map((item) => {
				return [item.id, item.name, item.origin, item.persisted, item.parameters];
			}));
			if (!tplChanged && !preChanged) return;
			state.templates = nextTemplates;
			state.presets = nextPresets;
			state.templatesSeeded = true;
			broadcastState();
		}
	);

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
	process.on('exit', function () { irCam.stop(); });
	process.on('SIGTERM', function () { irCam.stop(); process.exit(0); });
	console.log('ELO');
	if (irCam.available()) {
		console.log('  ir      ' + irCam.status().device);
	}
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
