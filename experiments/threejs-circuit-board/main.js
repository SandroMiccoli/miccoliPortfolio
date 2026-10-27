import * as THREE from 'three';
import gsap from 'gsap';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
import { createBoard } from './js/board.js';
import { createNxpBoard } from './js/board-nxp.js';
import { createVersalBoard } from './js/board-versal.js';
import { createIntelligence, createRoutes } from './js/intelligence.js';
import { createArm } from './js/arm.js';
import { createDataCenter } from './js/datacenter.js';
import { createPlane } from './js/plane.js';
import { createSatellite } from './js/satellite.js';
import { createBloom } from './js/bloom.js';
import { applyPartLifts } from './js/batch.js';
import { createPcbBase, PROFILES, mixProfile, cloneProfile } from './js/pcb-base.js';
import { createPartHover } from './js/hover.js';

const HOME_PITCH = -1.25;
const HOME_ROLL = 0.02;
const MOUSE_PITCH = 0.12;
const MOUSE_ROLL = 0.16;
const FOV = 45;
const FRAME_PADDING = 1.22;
const FRAME_PAN_Y = 1.2;

const stage = document.querySelector('#stage');
const errorEl = document.querySelector('#error');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

let renderer;
try {
	renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: false,
		powerPreference: 'high-performance',
	});
} catch (err) {
	errorEl.hidden = false;
	throw err;
}
if (!renderer.getContext()) {
	errorEl.hidden = false;
	throw new Error('WebGL unavailable');
}

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.setClearColor(0x000000, 1);
renderer.info.autoReset = false;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x06090c);
const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 500);
const lookTarget = new THREE.Vector3();
const viewOffset = new THREE.Vector3(2.4, 0.6, 14);
const _look = new THREE.Vector3();
let baseDistance = 28;

const board = new THREE.Group();
board.name = 'stage';
const pcbReference = createBoard(renderer);
const pcbNxp = createNxpBoard(renderer);
const pcbVersal = createVersalBoard(renderer);
pcbNxp.visible = false;
pcbVersal.visible = false;
board.add(pcbReference, pcbNxp, pcbVersal);
const partHover = createPartHover([pcbReference, pcbNxp, pcbVersal], renderer);
const pcbBase = createPcbBase();
pcbBase.group.position.y = -2.4;
board.add(pcbBase.group);
let liveProfile = cloneProfile(PROFILES.reference);
pcbBase.apply(liveProfile);
scene.add(board);

const armStudy = new THREE.Group();
const planeStudy = new THREE.Group();
const satelliteStudy = new THREE.Group();
const dataCenterStudy = new THREE.Group();
const studyGroups = [armStudy, planeStudy, satelliteStudy, dataCenterStudy];
armStudy.name = 'study-arm';
planeStudy.name = 'study-plane';
satelliteStudy.name = 'study-satellite';
dataCenterStudy.name = 'study-datacenter';
armStudy.add(createArm());
planeStudy.add(createPlane());
satelliteStudy.add(createSatellite());
dataCenterStudy.add(createDataCenter());
armStudy.visible = false;
planeStudy.visible = false;
dataCenterStudy.visible = false;
const overlay = new THREE.Group();
overlay.name = 'studies';
overlay.position.y = -2.4;
overlay.add(createIntelligence().group, armStudy, planeStudy, satelliteStudy, dataCenterStudy);
board.add(overlay);

const studies = {
	arm: { group: armStudy, label: '3D ROBOTIC ARM', layer: 'Industrial arm · hologram' },
	plane: { group: planeStudy, label: '3D PLANE', layer: 'Airframe · hologram' },
	satellite: { group: satelliteStudy, label: '3D SATELLITE', layer: 'Spacecraft · hologram' },
	datacenter: { group: dataCenterStudy, label: '3D DATA CENTER', layer: 'Compute cluster · hologram' },
};

for (const key of Object.keys(studies)) {
	const routes = createRoutes(key);
	studies[key].group.add(routes.group);
	studies[key].routes = routes;
}

const MODEL_FOR = { reference: 'satellite', nxp: 'plane', versal: 'datacenter' };

function bindStudy(entry) {
	const tech = entry.group.children[0];
	const lines = [];
	const fades = [];
	entry.group.traverse((obj) => {
		if (obj === entry.group) return;
		if (obj.isLineSegments && obj.geometry?.attributes?.position) {
			const count = obj.geometry.attributes.position.count;
			obj.userData.count = count;
			obj.userData.grow = { p: 1 };
			obj.userData.shown = count;
			lines.push(obj);
		} else if (obj.isMesh && obj.material && !Array.isArray(obj.material) && obj.material.transparent) {
			obj.material.userData.baseOpacity = obj.material.opacity;
			fades.push(obj.material);
		}
	});
	entry.tech = tech;
	entry.lines = lines;
	entry.fades = fades;
	entry.reveal = { v: 1 };
}

for (const entry of Object.values(studies)) bindStudy(entry);
for (const key of Object.keys(studies)) {
	if (key === 'satellite') continue;
	studies[key].reveal.v = 0;
	for (const line of studies[key].lines) line.userData.grow.p = 0;
}

const bloom = createBloom(renderer);
const background = scene.background;

let mode = 'satellite';
let shownMode = 'satellite';
let holoTween = null;
let pitch = HOME_PITCH;
let roll = HOME_ROLL;
let targetPitch = HOME_PITCH;
let targetRoll = HOME_ROLL;
let zoom = 1;
let targetZoom = 1;
let energyTime = 0;
let pointerX = 0;
let pointerY = 0;
let pointerInside = false;
let last = 0;
let viewW = 0;
let viewH = 0;
let viewRatio = 0;
const frameStats = { triangles: 0, lines: 0, calls: 0 };

board.rotation.set(HOME_PITCH, 0, HOME_ROLL);

const studyLabel = document.querySelector('#study-label');
const layerTech = document.querySelector('#layer-tech');
const layerBoard = document.querySelector('#layer-board');
const modeButtons = document.querySelectorAll('[data-mode]');
const pcbButtons = document.querySelectorAll('[data-pcb]');

const pcbs = {
	reference: { group: pcbReference, label: 'Reference board' },
	nxp: { group: pcbNxp, label: 'NXP EVK board' },
	versal: { group: pcbVersal, label: 'Versal VEK board' },
};

let pcb = 'reference';
let shownPcb = 'reference';
let pcbTween = null;

const FLAT = 0.02;

for (const entry of Object.values(pcbs)) {
	entry.parts = entry.group.userData.parts;
	entry.lifts = entry.group.userData.lifts;
	entry.traces = entry.group.userData.traces;
}

function applyTraces(entry) {
	const lines = entry.traces;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const count = line.userData.count;
		const shown = Math.max(0, Math.min(count, Math.round(line.userData.grow.p * count)));
		if (line.userData.shown === shown) continue;
		line.geometry.setDrawRange(0, shown);
		line.userData.shown = shown;
	}
}

function setTraces(entry, value) {
	for (const line of entry.traces) line.userData.grow.p = value;
	applyTraces(entry);
}

function wave(lifts) {
	return lifts.slice().sort((a, b) => (a.x * a.x + a.y * a.y) - (b.x * b.x + b.y * b.y));
}

function traceWave(lines) {
	return lines.slice().sort((a, b) => a.userData.d - b.userData.d).map((line) => line.userData.grow);
}

function staggerEach(list) {
	return 0.34 / Math.max(list.length - 1, 1);
}

function snapBase(name) {
	liveProfile = cloneProfile(PROFILES[name]);
	pcbBase.apply(liveProfile);
}

function profilesDiffer(a, b) {
	if (Math.abs(a.w - b.w) > 0.02 || Math.abs(a.h - b.h) > 0.02) return true;
	if (Math.abs(a.r - b.r) > 0.02 || Math.abs(a.bow - b.bow) > 0.02) return true;
	for (let i = 0; i < a.holes.length; i++) {
		const hole = a.holes[i];
		const other = b.holes[i];
		if (Math.abs(hole.x - other.x) > 0.02 || Math.abs(hole.y - other.y) > 0.02) return true;
		if (Math.abs(hole.r - other.r) > 0.02) return true;
	}
	return false;
}

function parkBoard(name) {
	const entry = pcbs[name];
	entry.group.visible = false;
	entry.parts.visible = true;
	for (const part of entry.lifts) part.lift = 1;
	applyPartLifts(entry.group);
	setTraces(entry, 1);
}

function layFlat(name) {
	const entry = pcbs[name];
	for (const part of entry.lifts) part.lift = FLAT;
	applyPartLifts(entry.group);
	entry.parts.visible = false;
	setTraces(entry, 0);
	entry.group.visible = true;
}

function syncPcbUi(name) {
	for (const button of pcbButtons) {
		button.setAttribute('aria-pressed', button.dataset.pcb === name ? 'true' : 'false');
	}
	layerBoard.textContent = pcbs[name].label;
}

function applyHolo(name) {
	const study = studies[name];
	if (!study?.tech) return;
	const v = study.reveal.v;
	study.tech.scale.setScalar(0.04 + 0.96 * v);
	for (let i = 0; i < study.fades.length; i++) {
		const mat = study.fades[i];
		mat.opacity = mat.userData.baseOpacity * Math.min(1, v * 1.35);
	}
	if (study.routes?.sparks) {
		const sparkMat = study.routes.sparks.material;
		sparkMat.opacity = sparkMat.userData.baseOpacity * Math.min(1, v * 1.35);
		study.routes.sparks.visible = v > 0.04;
	}
	for (let i = 0; i < study.lines.length; i++) {
		const line = study.lines[i];
		const count = line.userData.count;
		let shown = Math.round(line.userData.grow.p * count);
		if (shown % 2) shown -= 1;
		if (shown < 0) shown = 0;
		if (line.userData.shown === shown) continue;
		line.geometry.setDrawRange(0, shown);
		line.userData.shown = shown;
	}
}

function syncModeUi(name) {
	for (const button of modeButtons) {
		button.setAttribute('aria-pressed', button.dataset.mode === name ? 'true' : 'false');
	}
	studyLabel.textContent = studies[name].label;
	layerTech.textContent = studies[name].layer;
}

function snapHolo(name) {
	if (holoTween) {
		holoTween.kill();
		holoTween = null;
	}
	for (const key of Object.keys(studies)) {
		const study = studies[key];
		const on = key === name;
		study.group.visible = on;
		study.reveal.v = on ? 1 : 0;
		for (const line of study.lines) line.userData.grow.p = on ? 1 : 0;
		applyHolo(key);
	}
	mode = name;
	shownMode = name;
	syncModeUi(name);
}

function holoOut(tl, name, position) {
	const study = studies[name];
	if (!study.lines.length) return;
	tl.to(study.lines.map((line) => line.userData.grow), {
		p: 0,
		duration: 0.42,
		ease: 'power2.in',
		stagger: { each: 0.02, from: 'end' },
	}, position);
	tl.to(study.reveal, { v: 0, duration: 0.5, ease: 'power2.in' }, position);
}

function holoIn(tl, name, position) {
	const study = studies[name];
	tl.add(() => {
		study.group.visible = true;
		study.reveal.v = 0;
		for (const line of study.lines) line.userData.grow.p = 0;
		applyHolo(name);
	}, position);
	tl.fromTo(study.reveal, { v: 0 }, {
		v: 1,
		duration: 0.55,
		ease: 'power2.out',
		immediateRender: false,
	}, position);
	if (study.lines.length) {
		tl.fromTo(study.lines.map((line) => line.userData.grow), { p: 0 }, {
			p: 1,
			duration: 0.72,
			ease: 'power2.out',
			immediateRender: false,
			stagger: { each: 0.025, from: 'start' },
		}, position);
	}
}

function showPcbImmediate(name) {
	if (pcbTween) {
		pcbTween.kill();
		pcbTween = null;
	}
	for (const key of Object.keys(pcbs)) parkBoard(key);
	const entry = pcbs[name];
	entry.group.visible = true;
	shownPcb = name;
	pcb = name;
	snapBase(name);
	snapHolo(MODEL_FOR[name]);
	measureFrame();
	placeCamera();
}

function sinkVars(order) {
	return {
		lift: FLAT,
		duration: 0.36,
		ease: 'power2.in',
		stagger: { each: staggerEach(order), from: 'start' },
	};
}

function riseVars(order) {
	return {
		lift: 1,
		duration: 0.42,
		ease: 'power2.out',
		stagger: { each: staggerEach(order), from: 'start' },
	};
}

function traceVars(order, to) {
	const span = to === 1 ? 0.45 : 0.28;
	return {
		p: to,
		duration: to === 1 ? 0.55 : 0.34,
		ease: to === 1 ? 'power2.out' : 'power2.in',
		stagger: { each: span / Math.max(order.length - 1, 1), from: 'start' },
	};
}

function addTraceTween(tl, order, to, position) {
	if (!order.length) return;
	tl.to(order, traceVars(order, to), position);
}

function addWarp(tl, targetName, position) {
	const origin = liveProfile;
	if (!profilesDiffer(origin, PROFILES[targetName])) return;
	const warp = { u: 0 };
	tl.to(warp, {
		u: 1,
		duration: position === 0 ? 0.5 : 0.66,
		ease: 'power2.inOut',
		onUpdate: () => {
			liveProfile = mixProfile(origin, PROFILES[targetName], warp.u);
			pcbBase.apply(liveProfile);
		},
	}, position);
}

function startTransition(to) {
	if (pcbTween) {
		pcbTween.kill();
		pcbTween = null;
	}
	const from = shownPcb;
	const holoTo = MODEL_FOR[to];
	if (reduced.matches || from === to) {
		if (from === to && !reduced.matches) {
			for (const key of Object.keys(pcbs)) {
				if (key !== from) parkBoard(key);
			}
			const entry = pcbs[from];
			entry.group.visible = true;
			entry.parts.visible = true;
			const order = wave(entry.lifts);
			const traces = traceWave(entry.traces);
			const holoFrom = shownMode;
			const tl = gsap.timeline({
				onUpdate: () => {
					applyPartLifts(entry.group);
					applyTraces(entry);
					applyHolo(holoFrom);
					if (holoTo !== holoFrom) applyHolo(holoTo);
				},
				onComplete: () => {
					snapBase(from);
					snapHolo(holoTo);
					pcbTween = null;
				},
			});
			pcbTween = tl;
			tl.to(order, riseVars(order), 0);
			addTraceTween(tl, traces, 1, 0);
			addWarp(tl, from, 0);
			if (holoFrom !== holoTo) {
				holoOut(tl, holoFrom, 0);
				tl.add(() => {
					studies[holoFrom].group.visible = false;
					shownMode = holoTo;
					mode = holoTo;
					syncModeUi(holoTo);
				});
				holoIn(tl, holoTo);
			} else {
				tl.to(studies[holoFrom].reveal, { v: 1, duration: 0.4, ease: 'power2.out' }, 0);
				if (studies[holoFrom].lines.length) {
					tl.to(studies[holoFrom].lines.map((line) => line.userData.grow), {
						p: 1,
						duration: 0.45,
						ease: 'power2.out',
					}, 0);
				}
			}
			return;
		}
		showPcbImmediate(to);
		return;
	}

	for (const key of Object.keys(pcbs)) {
		if (key !== from) parkBoard(key);
	}
	layFlat(to);

	const outgoing = pcbs[from];
	const incoming = pcbs[to];
	const outOrder = wave(outgoing.lifts);
	const inOrder = wave(incoming.lifts);
	const outTraces = traceWave(outgoing.traces);
	const inTraces = traceWave(incoming.traces);
	const holoFrom = shownMode;
	const tl = gsap.timeline({
		onUpdate: () => {
			applyPartLifts(outgoing.group);
			applyPartLifts(incoming.group);
			applyTraces(outgoing);
			applyTraces(incoming);
			applyHolo(holoFrom);
			if (holoTo !== holoFrom) applyHolo(holoTo);
		},
		onComplete: () => {
			parkBoard(from);
			snapBase(to);
			if (holoFrom !== holoTo) studies[holoFrom].group.visible = false;
			snapHolo(holoTo);
			shownPcb = to;
			pcbTween = null;
			if (pcb !== shownPcb) startTransition(pcb);
		},
	});
	pcbTween = tl;
	tl.to(outOrder, sinkVars(outOrder), 0);
	addTraceTween(tl, outTraces, 0, 0);
	if (holoFrom !== holoTo) holoOut(tl, holoFrom, 0);
	tl.add(() => {
		outgoing.parts.visible = false;
		setTraces(outgoing, 0);
		if (holoFrom !== holoTo) {
			studies[holoFrom].group.visible = false;
			shownMode = holoTo;
			mode = holoTo;
			syncModeUi(holoTo);
		}
	});
	addWarp(tl, to);
	tl.add(() => {
		incoming.parts.visible = true;
	});
	tl.to(inOrder, riseVars(inOrder));
	addTraceTween(tl, inTraces, 1, '<');
	if (holoFrom !== holoTo) holoIn(tl, holoTo, '<');
}

const CYCLE = ['reference', 'nxp', 'versal'];
const CYCLE_DWELL = 4;
let cycleTime = 0;

function setPcb(next) {
	cycleTime = 0;
	if (!pcbs[next]) return;
	if (next === pcb && (!pcbTween || shownPcb === next) && shownMode === MODEL_FOR[next]) return;
	if (next === pcb && pcbTween && shownPcb !== next) return;
	if (holoTween) {
		holoTween.kill();
		holoTween = null;
	}
	pcb = next;
	syncPcbUi(next);
	mode = MODEL_FOR[next];
	syncModeUi(mode);
	if (reduced.matches) {
		showPcbImmediate(next);
		return;
	}
	startTransition(next);
}

function setMode(next) {
	if (!studies[next] || next === shownMode || pcbTween) return;
	if (holoTween) {
		holoTween.kill();
		holoTween = null;
	}
	const from = shownMode;
	mode = next;
	syncModeUi(next);
	if (reduced.matches) {
		snapHolo(next);
		return;
	}
	const tl = gsap.timeline({
		onUpdate: () => {
			applyHolo(from);
			applyHolo(next);
		},
		onComplete: () => {
			studies[from].group.visible = false;
			holoTween = null;
			snapHolo(next);
		},
	});
	holoTween = tl;
	holoOut(tl, from, 0);
	tl.add(() => {
		studies[from].group.visible = false;
		shownMode = next;
	});
	holoIn(tl, next);
}

for (const button of modeButtons) {
	button.addEventListener('click', () => setMode(button.dataset.mode));
}

for (const button of pcbButtons) {
	button.addEventListener('click', () => setPcb(button.dataset.pcb));
}

function resetView() {
	targetZoom = 1;
}
document.querySelector('#reset').addEventListener('click', resetView);

function resolvePixelRatio() {
	if (perf.pixelRatio === 'Device') return Math.min(window.devicePixelRatio || 1, 2);
	return Number(perf.pixelRatio);
}

const _bounds = new THREE.Box3();
const _size = new THREE.Vector3();
const _viewDir = new THREE.Vector3();

function measureFrame() {
	const shown = studyGroups.map((study) => study.visible);
	for (const study of studyGroups) study.visible = true;
	board.updateMatrixWorld(true);
	_bounds.setFromObject(board);
	studyGroups.forEach((study, index) => {
		study.visible = shown[index];
	});

	_bounds.getCenter(lookTarget);
	_bounds.getSize(_size);
	const aspect = camera.aspect || 1;
	const vFov = THREE.MathUtils.degToRad(FOV);
	const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
	const distV = (_size.y * 0.5 * FRAME_PADDING) / Math.tan(vFov / 2);
	const distH = (_size.x * 0.5 * FRAME_PADDING) / Math.tan(hFov / 2);
	baseDistance = Math.max(distV, distH);
}

function placeCamera() {
	_viewDir.copy(viewOffset).normalize();
	camera.position.copy(lookTarget).addScaledVector(_viewDir, baseDistance / zoom);
	camera.position.y -= FRAME_PAN_Y;
	_look.copy(lookTarget);
	_look.y -= FRAME_PAN_Y;
	camera.lookAt(_look);
	camera.updateProjectionMatrix();
}

function resize() {
	const w = stage.clientWidth;
	const h = stage.clientHeight;
	const ratio = resolvePixelRatio();
	if (!w || !h) return;
	if (w === viewW && h === viewH && ratio === viewRatio) return;
	viewW = w;
	viewH = h;
	viewRatio = ratio;
	renderer.setPixelRatio(ratio);
	renderer.setSize(w, h);
	camera.aspect = w / h;
	measureFrame();
	placeCamera();
	bloom.resize(renderer.domElement.width, renderer.domElement.height);
}

window.addEventListener('pointermove', (event) => {
	pointerInside = true;
	pointerX = (event.clientX / window.innerWidth) * 2 - 1;
	pointerY = (event.clientY / window.innerHeight) * 2 - 1;
});

document.documentElement.addEventListener('pointerleave', () => {
	pointerInside = false;
	pointerX = 0;
	pointerY = 0;
	partHover.hide();
	stage.style.cursor = '';
});

stage.addEventListener('wheel', (event) => {
	event.preventDefault();
	targetZoom = THREE.MathUtils.clamp(targetZoom - event.deltaY * 0.0005, 0.75, 1.6);
}, { passive: false });

const chrome = document.querySelectorAll('header, nav, footer, .layers');

function setChrome(on) {
	shell.classList.toggle('show-ui', on);
	for (const el of chrome) el.setAttribute('aria-hidden', on ? 'false' : 'true');
}

window.addEventListener('keydown', (event) => {
	if (event.code === 'KeyD' && (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey) {
		event.preventDefault();
		setChrome(!shell.classList.contains('show-ui'));
		return;
	}
	if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
	if (event.key.toLowerCase() === 'r') resetView();
});

const perf = {
	fps: '—',
	triangles: '—',
	lines: '—',
	drawCalls: '—',
	pixelRatio: 'Device',
};

const shell = document.querySelector('.circuit-board');
setChrome(false);
const gui = new GUI({ title: 'Performance', autoPlace: false });
gui.domElement.classList.add('perf-gui');
shell.appendChild(gui.domElement);
const fpsCtrl = gui.add(perf, 'fps').name('FPS').disable();
const triCtrl = gui.add(perf, 'triangles').name('Triangles').disable();
const lineCtrl = gui.add(perf, 'lines').name('Lines').disable();
const callCtrl = gui.add(perf, 'drawCalls').name('Draw calls').disable();
gui.add(perf, 'pixelRatio', ['Device', '1', '1.5', '2']).name('Pixel ratio').onChange(() => {
	viewRatio = -1;
	resize();
});
gui.add(bloom, 'strength', 0, 3, 0.01).name('Bloom');
gui.add(bloom, 'radius', 0, 1, 0.01).name('Bloom radius');
gui.add(bloom, 'threshold', 0, 1, 0.01).name('Bloom threshold');
gui.open();

const statsRow = document.createElement('div');
statsRow.className = 'perf-stats';
shell.appendChild(statsRow);
const statsPanels = [0, 1, 2].map((panel) => {
	const stats = new Stats();
	stats.showPanel(panel);
	stats.dom.style.position = 'relative';
	stats.dom.style.top = '0';
	stats.dom.style.left = '0';
	statsRow.appendChild(stats.dom);
	return stats;
});

let fpsFrames = 0;
let fpsWindow = 0;

function formatInt(value) {
	return Math.round(value).toLocaleString('en-US');
}

function notePerf(dt) {
	fpsFrames += 1;
	fpsWindow += dt;
	if (fpsWindow < 0.4) return;
	perf.fps = (fpsFrames / fpsWindow).toFixed(1);
	perf.triangles = formatInt(frameStats.triangles);
	perf.lines = formatInt(frameStats.lines);
	perf.drawCalls = formatInt(frameStats.calls);
	fpsCtrl.updateDisplay();
	triCtrl.updateDisplay();
	lineCtrl.updateDisplay();
	callCtrl.updateDisplay();
	fpsFrames = 0;
	fpsWindow = 0;
}

const depthMaterial = new THREE.MeshBasicMaterial({
	colorWrite: false,
	depthWrite: true,
	polygonOffset: true,
	polygonOffsetFactor: 1,
	polygonOffsetUnits: 1,
});

function renderFrame() {
	renderer.info.reset();

	camera.layers.set(0);
	scene.background = background;
	renderer.setRenderTarget(null);
	renderer.autoClear = true;
	renderer.render(scene, camera);

	camera.layers.set(1);
	scene.background = null;
	renderer.autoClear = false;
	renderer.render(scene, camera);

	frameStats.triangles = renderer.info.render.triangles;
	frameStats.lines = renderer.info.render.lines;

	if (bloom.strength > 0) {
		bloom.capture(() => {
			const hidden = [];
			scene.traverse((obj) => {
				if (!obj.visible) return;
				if (obj.isLine || obj.isLineSegments || obj.isLineSegments2 || obj.isPoints) {
					hidden.push(obj);
					obj.visible = false;
				}
			});
			camera.layers.set(0);
			scene.overrideMaterial = depthMaterial;
			renderer.render(scene, camera);
			scene.overrideMaterial = null;
			for (const obj of hidden) obj.visible = true;
			camera.layers.set(1);
			renderer.autoClear = false;
			renderer.render(scene, camera);
		});
		bloom.composite();
	}

	frameStats.calls = renderer.info.render.calls;
	camera.layers.set(0);
	scene.background = background;
}

function tick(now) {
	for (const stats of statsPanels) stats.begin();
	const raw = last ? Math.min((now - last) / 1000, 0.1) : 0;
	const dt = Math.min(raw, 0.05);
	last = now;

	if (reduced.matches) {
		targetPitch = HOME_PITCH;
		targetRoll = HOME_ROLL;
	} else {
		targetPitch = HOME_PITCH + pointerY * MOUSE_PITCH;
		targetRoll = HOME_ROLL + pointerX * MOUSE_ROLL;
	}

	const pitchDelta = targetPitch - pitch;
	const rollDelta = targetRoll - roll;
	const zoomDelta = targetZoom - zoom;
	if (Math.abs(pitchDelta) > 0.00005 || Math.abs(rollDelta) > 0.00005 || Math.abs(zoomDelta) > 0.0001) {
		const blend = reduced.matches ? 1 : 1 - Math.exp(-dt * 7);
		pitch += pitchDelta * blend;
		roll += rollDelta * blend;
		zoom += zoomDelta * (reduced.matches ? 1 : 1 - Math.exp(-dt * 12));
		board.rotation.set(pitch, 0, roll);
		if (Math.abs(zoomDelta) > 0.0001) placeCamera();
	}

	if (pcbTween || holoTween) cycleTime = 0;
	else {
		cycleTime += dt;
		if (cycleTime >= CYCLE_DWELL) {
			cycleTime = 0;
			const next = CYCLE[(CYCLE.indexOf(shownPcb) + 1) % CYCLE.length];
			setPcb(next);
		}
	}

	if (!reduced.matches) energyTime += dt;
	for (const study of Object.values(studies)) {
		if (study.group.visible && study.routes) study.routes.update(energyTime);
	}

	if (pointerInside) {
		const hot = partHover.update(pointerX, -pointerY, camera);
		stage.style.cursor = hot ? 'pointer' : '';
	}

	renderFrame();
	notePerf(raw || dt);
	for (const stats of statsPanels) stats.end();
}

resize();
new ResizeObserver(resize).observe(stage);
document.addEventListener('visibilitychange', () => {
	if (document.hidden) {
		renderer.setAnimationLoop(null);
		return;
	}
	last = 0;
	renderer.setAnimationLoop(tick);
});
renderer.setAnimationLoop(tick);

window.boardStudy = {
	setMode,
	setPcb,
	resetView,
	get mode() { return mode; },
	get pcb() { return pcb; },
	renderer,
	scene,
	camera,
};
