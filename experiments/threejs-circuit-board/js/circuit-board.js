import * as THREE from '../vendor/three.module.min.js';
import gsap from '../vendor/gsap-core.js';
import { createBoard } from './board.js';
import { createNxpBoard } from './board-nxp.js';
import { createVersalBoard } from './board-versal.js';
import { createIntelligence, createRoutes } from './intelligence.js';
import { createArm } from './arm.js';
import { createDataCenter } from './datacenter.js';
import { createPlane } from './plane.js';
import { createSatellite } from './satellite.js';
import { createBloom } from './bloom.js';
import { applyPartLifts } from './batch.js';
import { createPcbBase, PROFILES, mixProfile, cloneProfile } from './pcb-base.js';
import { createPartHover } from './hover.js';
import { cloneLook, installLook, normalizeLook, paintRoot, seedLook } from './look.js';

const HOME_PITCH = -1.15;
const HOME_ROLL = -0.58;
const MOUSE_PITCH = 0.12;
const MOUSE_ROLL = 0.16;
const FRAME_PADDING = 1.16;
const FRAME_PAN_Y = 0.15;
const CAM_Z = 48;
const FLAT = 0.02;
const CYCLE = ['reference', 'nxp', 'versal'];
const MODES = ['arm', 'plane', 'satellite', 'datacenter'];

/** Hologram that opens with each physical board. */
export const BOARD_HOLOGRAM = {
	reference: 'satellite',
	nxp: 'plane',
	versal: 'datacenter',
};

const active = new WeakMap();
const NO_HOVER = {
	update() {
		return false;
	},
	hide() {},
	dispose() {},
	refresh() {},
};

/**
 * Mount the circuit-board study into `root`.
 * The element needs a real width and height. The canvas fills it.
 * Call `destroy()` when the host page removes it.
 *
 * @param {HTMLElement} root
 * @param {object} [options]
 * @param {'reference'|'nxp'|'versal'} [options.pcb]
 * @param {'arm'|'plane'|'satellite'|'datacenter'} [options.mode]
 * @param {boolean} [options.cycle] Walk the three boards. Default true.
 * @param {number} [options.cycleDwell] Seconds each board stays. Default 4.
 * @param {boolean} [options.tilt] Pointer tilt and part highlight. Default true.
 * @param {boolean} [options.zoom] Wheel zoom. Default false, so the page can scroll.
 * @param {string|number|null} [options.background] CSS color, or 'transparent'.
 * @param {object} [options.look] Colors and bloom. Missing keys keep the default. See js/look.js.
 * @param {number|string} [options.pixelRatio] A number, or 'device'.
 * @param {string} [options.label] Accessible name, when the element has none.
 * @param {HTMLElement} [options.pointerRoot] Element that tracks the pointer. Defaults to `root`.
 * @param {(state: {pcb: string, mode: string, pcbLabel: string, modeLabel: string, layer: string}) => void} [options.onChange]
 * @param {(phase: 'start'|'end') => void} [options.onFrame]
 * @param {(sample: {fps: number, triangles: number, lines: number, drawCalls: number}) => void} [options.onPerf]
 */
export function mountCircuitBoard(root, options = {}) {
	if (!(root instanceof HTMLElement)) {
		throw new Error('mountCircuitBoard needs an element');
	}
	active.get(root)?.destroy();

	const initialPcb = CYCLE.includes(options.pcb) ? options.pcb : 'reference';
	const initialMode = MODES.includes(options.mode) ? options.mode : BOARD_HOLOGRAM[initialPcb];
	const cycleOn = options.cycle !== false;
	const cycleDwell = Math.max(0.5, Number(options.cycleDwell) || 4);
	const tiltOn = options.tilt !== false;
	const zoomOn = options.zoom === true;
	const transparent = options.background === 'transparent' || options.background === null;
	let lookState = seedLook(options.look, transparent ? undefined : options.background);
	installLook(lookState);
	const background = lookState.system.background;
	const pointerRoot = options.pointerRoot instanceof HTMLElement ? options.pointerRoot : root;
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
	const events = new AbortController();
	const { signal } = events;

	let alive = true;
	let api;
	let renderer = null;
	let pixelRatioMode = options.pixelRatio ?? 'device';
	let canvas = null;
	let bloom = null;
	let partHover = NO_HOVER;
	let resizeObserver = null;
	let intersectionObserver = null;
	let forcedPosition = false;
	let hoverFrame = 0;
	const addedClass = !root.classList.contains('circuit-board');

	root.classList.add('circuit-board');
	root.classList.toggle('circuit-board--zoom', zoomOn);
	root.style.setProperty('--cb-bg', transparent ? 'transparent' : cssColor(background));
	if (getComputedStyle(root).position === 'static') {
		root.style.position = 'relative';
		forcedPosition = true;
	}
	const ownsLabel = !root.hasAttribute('aria-label');
	const ownsRole = !root.hasAttribute('role') && ownsLabel;
	if (ownsRole) root.setAttribute('role', 'img');
	if (ownsLabel) {
		root.setAttribute('aria-label', options.label || (zoomOn
			? 'Circuit board study. Move the pointer to tilt. Scroll to zoom.'
			: 'Circuit board study. Move the pointer to tilt.'));
	}

	function fail(drop) {
		alive = false;
		drop?.dispose();
		root.classList.add('is-error');
		const message = document.createElement('p');
		message.className = 'circuit-board__fallback';
		message.textContent = 'WebGL is unavailable. Please enable hardware acceleration.';
		root.append(message);
		const dead = {
			element: root,
			bloom: { strength: 0, radius: 0, threshold: 0 },
			setPcb() {},
			setMode() {},
			resetView() {},
			setPixelRatio() {},
			getLook() { return cloneLook(lookState); },
			setLook(next) {
				lookState = normalizeLook(next, lookState);
				installLook(lookState);
				return cloneLook(lookState);
			},
			get mode() { return initialMode; },
			get pcb() { return initialPcb; },
			destroy() {
				message.remove();
				root.classList.remove('is-error');
				if (addedClass) root.classList.remove('circuit-board');
				root.classList.remove('circuit-board--zoom');
				if (forcedPosition) root.style.position = '';
				if (ownsLabel) root.removeAttribute('aria-label');
				if (ownsRole) root.removeAttribute('role');
				if (active.get(root) === dead) active.delete(root);
			},
		};
		active.set(root, dead);
		return dead;
	}

	try {
		renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: transparent,
			powerPreference: 'high-performance',
		});
	} catch (err) {
		return fail(null);
	}
	if (!renderer.getContext()) return fail(renderer);

	renderer.setPixelRatio(resolvePixelRatio(options.pixelRatio));
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.NoToneMapping;
	const clearColor = new THREE.Color(transparent ? 0x000000 : background);
	renderer.setClearColor(clearColor, transparent ? 0 : 1);
	renderer.info.autoReset = false;
	canvas = renderer.domElement;
	canvas.setAttribute('aria-hidden', 'true');
	root.appendChild(canvas);

	const scene = new THREE.Scene();
	scene.background = transparent ? null : clearColor.clone();
	const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
	const lookTarget = new THREE.Vector3();
	const _corner = new THREE.Vector3();

	const board = new THREE.Group();
	board.name = 'stage';
	const pcbReference = createBoard(renderer);
	const pcbNxp = createNxpBoard(renderer);
	const pcbVersal = createVersalBoard(renderer);
	pcbReference.visible = initialPcb === 'reference';
	pcbNxp.visible = initialPcb === 'nxp';
	pcbVersal.visible = initialPcb === 'versal';
	board.add(pcbReference, pcbNxp, pcbVersal);
	partHover = tiltOn ? createPartHover([pcbReference, pcbNxp, pcbVersal], renderer) : NO_HOVER;
	const pcbBase = createPcbBase();
	pcbBase.group.position.y = -2.4;
	board.add(pcbBase.group);
	let liveProfile = cloneProfile(PROFILES[initialPcb]);
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

	function bindStudy(entry) {
		const tech = entry.group.children[0];
		const lines = [];
		const fades = [];
		entry.group.traverse((obj) => {
			if (obj === entry.group || obj.userData.energy) return;
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

	bloom = createBloom(renderer);
	bloom.strength = lookState.bloom.strength;
	bloom.radius = lookState.bloom.radius;
	bloom.threshold = lookState.bloom.threshold;
	const sceneBackground = scene.background;

	function scheduleHoverRefresh() {
		if (hoverFrame) clearTimeout(hoverFrame);
		hoverFrame = setTimeout(() => {
			hoverFrame = 0;
			if (alive) partHover.refresh();
		}, 160);
	}

	function applyLook(next) {
		const prevPcb = JSON.stringify(lookState.pcb);
		lookState = normalizeLook(next, lookState);
		installLook(lookState);
		paintRoot(scene);
		if (!transparent) {
			clearColor.set(lookState.system.background);
			sceneBackground.copy(clearColor);
			renderer.setClearColor(clearColor, 1);
			root.style.setProperty('--cb-bg', lookState.system.background);
		}
		bloom.strength = lookState.bloom.strength;
		bloom.radius = lookState.bloom.radius;
		bloom.threshold = lookState.bloom.threshold;
		if (JSON.stringify(lookState.pcb) !== prevPcb) scheduleHoverRefresh();
		return cloneLook(lookState);
	}

	let mode = initialMode;
	let shownMode = initialMode;
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
	let pageVisible = !document.hidden;
	let onScreen = inView(root);
	let looping = false;
	const frameStats = { triangles: 0, lines: 0, calls: 0 };

	board.rotation.set(HOME_PITCH, 0, HOME_ROLL);

	const pcbs = {
		reference: { group: pcbReference, label: 'Reference board' },
		nxp: { group: pcbNxp, label: 'NXP EVK board' },
		versal: { group: pcbVersal, label: 'Versal VEK board' },
	};

	let pcb = initialPcb;
	let shownPcb = initialPcb;
	let pcbTween = null;
	let cycleTime = 0;

	for (const entry of Object.values(pcbs)) {
		entry.parts = entry.group.userData.parts;
		entry.lifts = entry.group.userData.lifts;
		entry.traces = entry.group.userData.traces;
	}

	function emit() {
		const study = studies[mode];
		const current = pcbs[pcb];
		options.onChange?.({
			pcb,
			mode,
			pcbLabel: current.label,
			modeLabel: study.label,
			layer: study.layer,
		});
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

	function energyPaths(study) {
		return study.routes?.paths || [];
	}

	function snapEnergy(study, on) {
		const p = on ? 1 : 0;
		if (study.routes?.hexScale) study.routes.hexScale.s = p;
		for (const line of energyPaths(study)) line.userData.grow.p = p;
		study.routes?.apply();
	}

	function energyOut(tl, study, position) {
		if (study.routes?.hexScale) {
			tl.to(study.routes.hexScale, {
				s: 0,
				duration: 0.32,
				ease: 'power2.in',
			}, position);
		}
		const paths = energyPaths(study);
		if (paths.length) {
			tl.to(paths.map((line) => line.userData.grow), {
				p: 0,
				duration: 0.58,
				ease: 'power2.in',
				stagger: { each: 0.04, from: 'end' },
			}, position);
		}
	}

	function energyIn(tl, study, position) {
		const paths = energyPaths(study);
		if (paths.length) {
			tl.fromTo(paths.map((line) => line.userData.grow), { p: 0 }, {
				p: 1,
				duration: 0.74,
				ease: 'power2.out',
				immediateRender: false,
				stagger: { each: 0.05, from: 'start' },
			}, position);
		}
		if (study.routes?.hexScale) {
			tl.fromTo(study.routes.hexScale, { s: 0 }, {
				s: 1,
				duration: 0.4,
				ease: 'back.out(1.5)',
				immediateRender: false,
				delay: 0.2,
			}, position);
		}
	}

	function applyHolo(name) {
		const study = studies[name];
		if (!study?.tech) return;
		const v = study.reveal.v;
		for (let i = 0; i < study.fades.length; i++) {
			const mat = study.fades[i];
			mat.opacity = mat.userData.baseOpacity * Math.min(1, v * 1.35);
		}
		study.routes?.apply();
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
			snapEnergy(study, on);
			applyHolo(key);
		}
		mode = name;
		shownMode = name;
		emit();
	}

	function holoOut(tl, name, position) {
		const study = studies[name];
		if (study.lines.length) {
			tl.to(study.lines.map((line) => line.userData.grow), {
				p: 0,
				duration: 0.42,
				ease: 'power2.in',
				stagger: { each: 0.02, from: 'end' },
			}, position);
		}
		tl.to(study.reveal, { v: 0, duration: 0.5, ease: 'power2.in' }, position);
		energyOut(tl, study, position);
	}

	function holoIn(tl, name, position) {
		const study = studies[name];
		tl.add(() => {
			study.group.visible = true;
			study.reveal.v = 0;
			for (const line of study.lines) line.userData.grow.p = 0;
			snapEnergy(study, false);
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
		energyIn(tl, study, position);
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
		snapHolo(BOARD_HOLOGRAM[name]);
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
		const holoTo = BOARD_HOLOGRAM[to];
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
						measureFrame();
						placeCamera();
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
						emit();
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
					energyIn(tl, studies[holoFrom], 0);
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
				measureFrame();
				placeCamera();
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
				emit();
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

	function setPcb(next) {
		if (!alive) return;
		cycleTime = 0;
		if (!pcbs[next]) return;
		if (next === pcb && (!pcbTween || shownPcb === next) && shownMode === BOARD_HOLOGRAM[next]) return;
		if (next === pcb && pcbTween && shownPcb !== next) return;
		if (holoTween) {
			holoTween.kill();
			holoTween = null;
		}
		pcb = next;
		mode = BOARD_HOLOGRAM[next];
		emit();
		if (reduced.matches) {
			showPcbImmediate(next);
			return;
		}
		startTransition(next);
	}

	function setMode(next) {
		if (!alive || !studies[next] || next === shownMode || pcbTween) return;
		if (holoTween) {
			holoTween.kill();
			holoTween = null;
		}
		const from = shownMode;
		mode = next;
		emit();
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
				measureFrame();
				placeCamera();
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

	function resetView() {
		targetZoom = 1;
	}

	function setPixelRatio(value) {
		pixelRatioMode = value;
		viewRatio = -1;
		resize();
	}

	function resolvePixelRatio(value = pixelRatioMode) {
		if (value === 'device' || value === 'Device') return Math.min(window.devicePixelRatio || 1, 2);
		const number = Number(value);
		return Number.isFinite(number) && number > 0 ? number : Math.min(window.devicePixelRatio || 1, 2);
	}

	const _bounds = new THREE.Box3();
	let frameReady = false;

	function measureFrame() {
		if (frameReady) return;
		const savedRot = board.rotation.clone();
		board.rotation.set(HOME_PITCH, 0, HOME_ROLL);
		board.updateMatrixWorld(true);
		_bounds.makeEmpty();
		_bounds.expandByObject(pcbBase.group);
		for (const entry of Object.values(pcbs)) _bounds.expandByObject(entry.group);
		for (const study of studyGroups) _bounds.expandByObject(study);
		if (overlay.children[0]) _bounds.expandByObject(overlay.children[0]);
		if (_bounds.isEmpty()) _bounds.setFromObject(board);
		_bounds.getCenter(lookTarget);
		board.rotation.copy(savedRot);
		board.updateMatrixWorld(true);
		frameReady = true;
	}

	function placeCamera() {
		if (!viewW || !viewH) return;
		camera.position.set(lookTarget.x, lookTarget.y, lookTarget.z + CAM_Z);
		camera.up.set(0, 1, 0);
		camera.lookAt(lookTarget);
		camera.updateMatrixWorld(true);

		const min = _bounds.min;
		const max = _bounds.max;
		let minX = Infinity;
		let maxX = -Infinity;
		let minY = Infinity;
		let maxY = -Infinity;
		for (const x of [min.x, max.x]) {
			for (const y of [min.y, max.y]) {
				for (const z of [min.z, max.z]) {
					_corner.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
					if (_corner.x < minX) minX = _corner.x;
					if (_corner.x > maxX) maxX = _corner.x;
					if (_corner.y < minY) minY = _corner.y;
					if (_corner.y > maxY) maxY = _corner.y;
				}
			}
		}

		const width = Math.max(0.01, (maxX - minX) * FRAME_PADDING);
		const height = Math.max(0.01, (maxY - minY) * FRAME_PADDING);
		const aspect = viewW / viewH;
		let halfW = width / 2;
		let halfH = height / 2;
		if (halfW / halfH > aspect) halfH = halfW / aspect;
		else halfW = halfH * aspect;

		const z = zoom || 1;
		camera.left = -halfW / z;
		camera.right = halfW / z;
		camera.top = halfH / z - FRAME_PAN_Y;
		camera.bottom = -halfH / z - FRAME_PAN_Y;
		camera.updateProjectionMatrix();
	}

	function resize() {
		const w = root.clientWidth;
		const h = root.clientHeight;
		const ratio = resolvePixelRatio();
		if (!w || !h) return;
		if (w === viewW && h === viewH && ratio === viewRatio) return;
		viewW = w;
		viewH = h;
		viewRatio = ratio;
		renderer.setPixelRatio(ratio);
		renderer.setSize(w, h);
		measureFrame();
		placeCamera();
		bloom.resize(renderer.domElement.width, renderer.domElement.height);
		if (pcbBase.resize) pcbBase.resize(w, h);
	}

	function onPointerMove(event) {
		const rect = root.getBoundingClientRect();
		if (!rect.width || !rect.height) return;
		pointerInside = true;
		pointerX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		pointerY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
	}

	function onPointerLeave() {
		pointerInside = false;
		pointerX = 0;
		pointerY = 0;
		partHover.hide();
		root.style.cursor = '';
	}

	if (tiltOn) {
		pointerRoot.addEventListener('pointermove', onPointerMove, { signal });
		pointerRoot.addEventListener('pointerleave', onPointerLeave, { signal });
		pointerRoot.addEventListener('pointercancel', onPointerLeave, { signal });
	}
	if (zoomOn) {
		root.addEventListener('wheel', (event) => {
			event.preventDefault();
			targetZoom = THREE.MathUtils.clamp(targetZoom - event.deltaY * 0.0005, 0.75, 1.6);
		}, { signal, passive: false });
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
		scene.background = sceneBackground;
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
		scene.background = sceneBackground;
	}

	let fpsFrames = 0;
	let fpsWindow = 0;

	function notePerf(dt) {
		if (!options.onPerf) return;
		fpsFrames += 1;
		fpsWindow += dt;
		if (fpsWindow < 0.4) return;
		options.onPerf({
			fps: fpsFrames / fpsWindow,
			triangles: frameStats.triangles,
			lines: frameStats.lines,
			drawCalls: frameStats.calls,
		});
		fpsFrames = 0;
		fpsWindow = 0;
	}

	function tick(now) {
		if (!alive) return;
		if (!viewW || !viewH) resize();
		options.onFrame?.('start');
		const raw = last ? Math.min((now - last) / 1000, 0.1) : 0;
		const dt = Math.min(raw, 0.05);
		last = now;

		if (!tiltOn || reduced.matches) {
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

		if (cycleOn) {
			if (pcbTween || holoTween) cycleTime = 0;
			else {
				cycleTime += dt;
				if (cycleTime >= cycleDwell) {
					cycleTime = 0;
					const next = CYCLE[(CYCLE.indexOf(shownPcb) + 1) % CYCLE.length];
					setPcb(next);
				}
			}
		}

		if (!reduced.matches) energyTime += dt;
		for (const study of Object.values(studies)) {
			if (study.group.visible && study.routes) study.routes.update(energyTime);
		}

		if (tiltOn && pointerInside) {
			const hot = partHover.update(pointerX, -pointerY, camera);
			root.style.cursor = hot ? 'pointer' : '';
		}

		renderFrame();
		notePerf(raw || dt);
		options.onFrame?.('end');
	}

	function syncLoop() {
		if (!alive) return;
		const should = pageVisible && onScreen;
		if (should && !looping) {
			last = 0;
			looping = true;
			renderer.setAnimationLoop(tick);
		} else if (!should && looping) {
			looping = false;
			renderer.setAnimationLoop(null);
		}
	}

	function killMotion() {
		if (pcbTween) {
			pcbTween.kill();
			pcbTween = null;
		}
		if (holoTween) {
			holoTween.kill();
			holoTween = null;
		}
		for (const entry of Object.values(pcbs)) {
			gsap.killTweensOf(entry.lifts);
			gsap.killTweensOf(entry.traces.map((line) => line.userData.grow));
		}
		for (const study of Object.values(studies)) {
			gsap.killTweensOf(study.reveal);
			gsap.killTweensOf(study.lines.map((line) => line.userData.grow));
			const paths = study.routes?.paths || [];
			if (paths.length) gsap.killTweensOf(paths.map((line) => line.userData.grow));
			if (study.routes?.hexScale) gsap.killTweensOf(study.routes.hexScale);
		}
	}

	function destroy() {
		if (!alive) return;
		alive = false;
		looping = false;
		if (hoverFrame) clearTimeout(hoverFrame);
		renderer.setAnimationLoop(null);
		events.abort();
		resizeObserver?.disconnect();
		intersectionObserver?.disconnect();
		killMotion();
		partHover.dispose();
		disposeScene(scene);
		depthMaterial.dispose();
		bloom.dispose();
		renderer.dispose();
		renderer.forceContextLoss();
		canvas.remove();
		root.classList.remove('circuit-board--zoom');
		if (addedClass) root.classList.remove('circuit-board');
		if (forcedPosition) root.style.position = '';
		if (ownsLabel) root.removeAttribute('aria-label');
		if (ownsRole) root.removeAttribute('role');
		root.style.cursor = '';
		if (active.get(root) === api) active.delete(root);
	}

	document.addEventListener('visibilitychange', () => {
		pageVisible = !document.hidden;
		syncLoop();
	}, { signal });

	resizeObserver = new ResizeObserver(() => {
		if (alive) resize();
	});
	intersectionObserver = new IntersectionObserver((entries) => {
		onScreen = entries.some((entry) => entry.isIntersecting);
		syncLoop();
	});

	snapHolo(initialMode);

	api = {
		setPcb,
		setMode,
		resetView,
		setPixelRatio,
		getLook() { return cloneLook(lookState); },
		setLook: applyLook,
		destroy,
		bloom,
		get mode() { return mode; },
		get pcb() { return pcb; },
		element: root,
	};
	active.set(root, api);

	resize();
	resizeObserver.observe(root);
	intersectionObserver.observe(root);
	syncLoop();
	return api;
}

function disposeScene(rootObject) {
	const geometries = new Set();
	const materials = new Set();
	const textures = new Set();
	rootObject.traverse((obj) => {
		if (obj.geometry) geometries.add(obj.geometry);
		if (!obj.material) return;
		const list = Array.isArray(obj.material) ? obj.material : [obj.material];
		for (const material of list) materials.add(material);
	});
	for (const material of materials) {
		for (const value of Object.values(material)) {
			if (value && value.isTexture) textures.add(value);
		}
		material.dispose();
	}
	for (const texture of textures) texture.dispose();
	for (const geometry of geometries) geometry.dispose();
}

function cssColor(value) {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return '#' + (value >>> 0).toString(16).padStart(6, '0').slice(-6);
	}
	return String(value);
}

function inView(element) {
	const rect = element.getBoundingClientRect();
	return rect.width > 0
		&& rect.height > 0
		&& rect.bottom > 0
		&& rect.right > 0
		&& rect.top < window.innerHeight
		&& rect.left < window.innerWidth;
}
