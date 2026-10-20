import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
import { createBoard } from './js/board.js';
import { createIntelligence } from './js/intelligence.js';
import { createArm } from './js/arm.js';
import { createBlueprint } from './js/blueprint.js';
import { createPlane } from './js/plane.js';
import { createSatellite } from './js/satellite.js';
import { createBloom } from './js/bloom.js';

const HOME_PITCH = -0.96;
const HOME_ROLL = 0.02;
const MOUSE_PITCH = 0.36;
const MOUSE_ROLL = 0.49;
const FOV = 38;
const FRAME_PADDING = 1.28;

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
let baseDistance = 28;

const board = createBoard(renderer);
scene.add(board);

const armStudy = new THREE.Group();
const planeStudy = new THREE.Group();
const satelliteStudy = new THREE.Group();
const blueprintStudy = new THREE.Group();
const studyGroups = [armStudy, planeStudy, satelliteStudy, blueprintStudy];
armStudy.name = 'study-arm';
planeStudy.name = 'study-plane';
satelliteStudy.name = 'study-satellite';
blueprintStudy.name = 'study-blueprint';
armStudy.add(createIntelligence().group, createArm());
planeStudy.add(createIntelligence().group, createPlane());
satelliteStudy.add(createIntelligence().group, createSatellite());
blueprintStudy.add(createIntelligence().group, createBlueprint());
planeStudy.visible = false;
satelliteStudy.visible = false;
blueprintStudy.visible = false;
board.add(armStudy, planeStudy, satelliteStudy, blueprintStudy);

const studies = {
	arm: { group: armStudy, label: '3D ROBOTIC ARM', layer: 'Industrial arm · hologram' },
	plane: { group: planeStudy, label: '3D PLANE', layer: 'Airframe · hologram' },
	satellite: { group: satelliteStudy, label: '3D SATELLITE', layer: 'Spacecraft · hologram' },
	blueprint: { group: blueprintStudy, label: '2D PLANE', layer: 'Aircraft · blueprint' },
};

const bloom = createBloom(renderer);
const background = scene.background;

let mode = 'arm';
let pitch = HOME_PITCH;
let roll = HOME_ROLL;
let targetPitch = HOME_PITCH;
let targetRoll = HOME_ROLL;
let zoom = 1;
let targetZoom = 1;
let pointerX = 0;
let pointerY = 0;
let last = 0;
let viewW = 0;
let viewH = 0;
let viewRatio = 0;
const frameStats = { triangles: 0, lines: 0, calls: 0 };

board.rotation.set(HOME_PITCH, 0, HOME_ROLL);

const studyLabel = document.querySelector('#study-label');
const layerTech = document.querySelector('#layer-tech');
const modeButtons = document.querySelectorAll('[data-mode]');

function setMode(next) {
	if (!studies[next] || next === mode) return;
	mode = next;
	for (const name of Object.keys(studies)) studies[name].group.visible = name === next;
	for (const button of modeButtons) {
		button.setAttribute('aria-pressed', button.dataset.mode === next ? 'true' : 'false');
	}
	studyLabel.textContent = studies[next].label;
	layerTech.textContent = studies[next].layer;
}

for (const button of modeButtons) {
	button.addEventListener('click', () => setMode(button.dataset.mode));
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
	camera.lookAt(lookTarget);
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
	pointerX = (event.clientX / window.innerWidth) * 2 - 1;
	pointerY = (event.clientY / window.innerHeight) * 2 - 1;
});

document.documentElement.addEventListener('pointerleave', () => {
	pointerX = 0;
	pointerY = 0;
});

stage.addEventListener('wheel', (event) => {
	event.preventDefault();
	targetZoom = THREE.MathUtils.clamp(targetZoom - event.deltaY * 0.0005, 0.75, 1.6);
}, { passive: false });

window.addEventListener('keydown', (event) => {
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
		bloom.capture(() => renderer.render(scene, camera));
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
		targetPitch = HOME_PITCH - pointerY * MOUSE_PITCH;
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
	resetView,
	get mode() { return mode; },
	renderer,
	scene,
	camera,
};
