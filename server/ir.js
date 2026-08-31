const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');

const IR_ID = '__realsense_ir__';
const IR_LABEL = 'RealSense IR';
const IDLE_MS = 4000;

let proc = null;
let lastJpeg = null;
let lastTouch = 0;
let idleTimer = 0;
let irPath = '';

function videoNodes() {
	try {
		return fs.readdirSync('/dev')
			.filter(function (name) { return /^video\d+$/.test(name); })
			.map(function (name) { return '/dev/' + name; });
	} catch (err) {
		return [];
	}
}

function cardName(dev) {
	try {
		const id = path.basename(dev);
		return fs.readFileSync('/sys/class/video4linux/' + id + '/name', 'utf8').trim();
	} catch (err) {
		return '';
	}
}

function which(name) {
	const full = '/usr/bin/' + name;
	try {
		fs.accessSync(full);
		return full;
	} catch (err) {
		return name;
	}
}

function listFormats(dev) {
	try {
		return execFileSync(which('v4l2-ctl'), ['-d', dev, '--list-formats'], {
			encoding: 'utf8',
			timeout: 2500,
			stdio: ['ignore', 'pipe', 'ignore']
		});
	} catch (err) {
		return '';
	}
}

let foundCache = { at: 0, node: null };

function findGreyNode() {
	if (Date.now() - foundCache.at < 2500) return foundCache.node;
	const nodes = videoNodes();
	let hit = null;
	for (let i = 0; i < nodes.length; i += 1) {
		const dev = nodes[i];
		const name = cardName(dev);
		if (!/realsense/i.test(name)) continue;
		if (/'GREY'/i.test(listFormats(dev))) {
			hit = { path: dev, name: name };
			break;
		}
	}
	foundCache = { at: Date.now(), node: hit };
	return hit;
}

function parseMjpeg(stream, onJpeg) {
	let buf = Buffer.alloc(0);
	const soi = Buffer.from([0xff, 0xd8]);
	const eoi = Buffer.from([0xff, 0xd9]);
	stream.on('data', function (chunk) {
		buf = Buffer.concat([buf, chunk]);
		for (;;) {
			const start = buf.indexOf(soi);
			if (start < 0) {
				buf = Buffer.alloc(0);
				break;
			}
			if (start > 0) buf = buf.slice(start);
			const end = buf.indexOf(eoi, 2);
			if (end < 0) {
				if (buf.length > 2 * 1024 * 1024) buf = Buffer.alloc(0);
				break;
			}
			onJpeg(buf.slice(0, end + 2));
			buf = buf.slice(end + 2);
		}
	});
}

function stopCapture() {
	if (idleTimer) {
		clearTimeout(idleTimer);
		idleTimer = 0;
	}
	if (proc) {
		try { proc.kill('SIGTERM'); } catch (err) { /* ignore */ }
		proc = null;
	}
}

function scheduleIdle() {
	if (idleTimer) clearTimeout(idleTimer);
	idleTimer = setTimeout(function () {
		idleTimer = 0;
		if (Date.now() - lastTouch >= IDLE_MS) stopCapture();
	}, IDLE_MS);
}

function startCapture() {
	if (proc) return true;
	const found = findGreyNode();
	if (!found) return false;
	irPath = found.path;
	const child = spawn(which('ffmpeg'), [
		'-hide_banner',
		'-loglevel', 'error',
		'-f', 'v4l2',
		'-input_format', 'gray',
		'-video_size', '640x480',
		'-framerate', '15',
		'-i', found.path,
		'-an',
		'-f', 'mjpeg',
		'-q:v', '7',
		'pipe:1'
	], { stdio: ['ignore', 'pipe', 'pipe'] });
	proc = child;
	parseMjpeg(child.stdout, function (jpeg) {
		lastJpeg = jpeg;
	});
	child.stderr.on('data', function (chunk) {
		const text = String(chunk).trim();
		if (text) console.warn('RealSense IR ffmpeg: ' + text.slice(0, 300));
	});
	child.on('exit', function () {
		if (proc === child) proc = null;
	});
	child.on('error', function () {
		if (proc === child) proc = null;
	});
	return true;
}

function touch() {
	lastTouch = Date.now();
	startCapture();
	scheduleIdle();
}

function available() {
	return !!findGreyNode();
}

function status() {
	const found = findGreyNode();
	return {
		id: IR_ID,
		label: IR_LABEL,
		available: !!found,
		device: found ? found.path : '',
		live: !!proc && !!lastJpeg
	};
}

function deviceOption() {
	if (!available()) return null;
	return { id: IR_ID, label: IR_LABEL };
}

function isIrId(id) {
	return String(id || '') === IR_ID;
}

function attach(app) {
	app.get('/api/ir', function (_req, res) {
		res.json(status());
	});
	app.get('/ir.jpg', function (_req, res) {
		touch();
		if (!lastJpeg) {
			res.status(503).type('text/plain').send('RealSense IR is starting…');
			return;
		}
		res.type('image/jpeg').send(lastJpeg);
	});
}

module.exports = {
	IR_ID: IR_ID,
	IR_LABEL: IR_LABEL,
	attach: attach,
	available: available,
	status: status,
	deviceOption: deviceOption,
	isIrId: isIrId,
	stop: stopCapture
};
