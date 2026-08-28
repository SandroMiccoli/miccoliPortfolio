const NS = 'http://www.w3.org/2000/svg';
const COLOR = '#F46B1A';
const SCALE = 114;
const REST_BLUR = 12;
const PULSE_BLUR = 12;
const BIG_R = 40;
const NECK_R = 15;
const TRAVEL_R = 26;
const DEPTH = 0.34;

const STATIC_POS = [
	[-0.48, -1.27, 0.62],
	[0.48, -1.27, -0.62],
	[-1.28, -0.66, -0.42],
	[1.28, -0.66, 0.42],
	[-0.48, 0.0, 0.62],
	[0.48, 0.0, -0.62],
	[-1.28, 0.66, -0.42],
	[1.28, 0.66, 0.42],
	[-0.48, 1.27, 0.62],
	[0.48, 1.27, -0.62]
];

const CLUSTER_DEFS = [
	{ id: 'cluster-tl', nodes: [0, 2, 4], links: [[0, 2], [2, 4]] },
	{ id: 'cluster-tr', nodes: [1, 3], links: [[1, 3]] },
	{ id: 'cluster-bl', nodes: [6, 8], links: [[6, 8]] },
	{ id: 'cluster-br', nodes: [5, 7, 9], links: [[5, 7], [7, 9]] }
];

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const hit = document.querySelector('#logo-hit');
const hint = document.querySelector('#hint');
const mesh = document.querySelector('#mesh');
const gooBlur = document.querySelector('#goo feGaussianBlur');
const gooGroups = Array.from(document.querySelectorAll('.cluster'));
const versionBtns = Array.from(document.querySelectorAll('.version-btn'));

const nodes = STATIC_POS.map(([x, y, z]) => ({ x, y, z }));
const gooState = { blur: REST_BLUR };
const pose = { rx: 0, ry: 0 };

let version = 'v1';
let unified = false;
let pulseTl = null;
let hintHidden = false;

function circleAttr({ x, y, r }) {
	return { cx: x, cy: y, r };
}

function createCircle(parent, cx, cy, r, className) {
	const circle = document.createElementNS(NS, 'circle');
	circle.setAttribute('class', className);
	circle.setAttribute('cx', String(cx));
	circle.setAttribute('cy', String(cy));
	circle.setAttribute('r', String(r));
	circle.setAttribute('fill', COLOR);
	parent.appendChild(circle);
	return circle;
}

function setCircle(el, pt, r) {
	gsap.set(el, { attr: circleAttr({ x: pt.x, y: pt.y, r }) });
}

function setGooBlur(value) {
	gooState.blur = value;
	if (!gooBlur) return;
	const blur = Math.max(0, value);
	gooBlur.setAttribute('stdDeviation', String(blur));
	const targets = unified ? [mesh] : gooGroups;
	targets.forEach((group) => {
		if (!group) return;
		if (blur < 0.5) group.removeAttribute('filter');
		else group.setAttribute('filter', 'url(#goo)');
	});
}

function tweenGoo(tl, blur, duration, ease, pos) {
	const vars = { blur, duration, onUpdate: () => setGooBlur(gooState.blur) };
	if (ease) vars.ease = ease;
	tl.to(gooState, vars, pos);
}

function rotatePoint({ x, y, z }, rx, ry) {
	const cosY = Math.cos(ry);
	const sinY = Math.sin(ry);
	const x1 = x * cosY - z * sinY;
	const z1 = x * sinY + z * cosY;
	const cosX = Math.cos(rx);
	const sinX = Math.sin(rx);
	return {
		x: x1,
		y: y * cosX - z1 * sinX,
		z: y * sinX + z1 * cosX
	};
}

function transformPoint(pt, origin, rx, ry) {
	const rotated = rotatePoint(
		{ x: pt.x - origin.x, y: pt.y - origin.y, z: pt.z - origin.z },
		rx,
		ry
	);
	return {
		x: rotated.x + origin.x,
		y: rotated.y + origin.y,
		z: rotated.z + origin.z
	};
}

function screenPoint(world, rest, baseR) {
	const r = baseR * gsap.utils.clamp(0.7, 1.32, 1 + (world.z - rest.z) * DEPTH);
	return { x: world.x * SCALE, y: world.y * SCALE, r, z: world.z };
}

function project(pt3, baseR) {
	return screenPoint(transformPoint(pt3, { x: 0, y: 0, z: 0 }, pose.rx, pose.ry), pt3, baseR);
}

function clusterOrigin(nodeIdxs) {
	const n = nodeIdxs.length;
	return {
		x: nodeIdxs.reduce((sum, i) => sum + nodes[i].x, 0) / n,
		y: nodeIdxs.reduce((sum, i) => sum + nodes[i].y, 0) / n,
		z: nodeIdxs.reduce((sum, i) => sum + nodes[i].z, 0) / n
	};
}

function buildCluster(def) {
	const group = document.querySelector(`#${def.id}`);
	const statics = def.nodes.map((i) => {
		const p = project(nodes[i], BIG_R);
		return { el: createCircle(group, p.x, p.y, BIG_R, 'blob blob--static'), node: nodes[i] };
	});
	const necks = def.links.map(([a, b]) => {
		const pt = {
			x: (nodes[a].x + nodes[b].x) / 2,
			y: (nodes[a].y + nodes[b].y) / 2,
			z: (nodes[a].z + nodes[b].z) / 2
		};
		const p = project(pt, NECK_R);
		const el = createCircle(group, p.x, p.y, NECK_R, 'blob blob--neck');
		return { el, pt, a: nodes[a], b: nodes[b] };
	});
	const travelers = def.links.map(([a, b]) => {
		const p = project(nodes[a], 0);
		const el = createCircle(group, p.x, p.y, 0, 'blob blob--travel');
		return { el, a: nodes[a], b: nodes[b] };
	});
	return {
		def,
		group,
		origin: clusterOrigin(def.nodes),
		spin: { rx: 0, ry: 0 },
		dir: def.id.endsWith('tr') || def.id.endsWith('br') ? -1 : 1,
		statics,
		necks,
		travelers
	};
}

const clusters = CLUSTER_DEFS.map(buildCluster);

function allBlobs() {
	const list = [];
	clusters.forEach((cluster) => {
		cluster.statics.forEach((blob) => list.push(blob.el));
		cluster.necks.forEach((neck) => list.push(neck.el));
		cluster.travelers.forEach((traveler) => list.push(traveler.el));
	});
	return list;
}

function setUnifiedGoo(on) {
	if (on === unified) return;
	unified = on;
	if (on) {
		gooGroups.forEach((group) => group.removeAttribute('filter'));
		allBlobs().forEach((el) => mesh.appendChild(el));
		mesh.setAttribute('filter', 'url(#goo)');
	} else {
		mesh.removeAttribute('filter');
		clusters.forEach((cluster) => {
			cluster.statics.forEach((blob) => cluster.group.appendChild(blob.el));
			cluster.necks.forEach((neck) => cluster.group.appendChild(neck.el));
			cluster.travelers.forEach((traveler) => cluster.group.appendChild(traveler.el));
			cluster.group.setAttribute('filter', 'url(#goo)');
		});
	}
}

function sortByDepth(items) {
	const parent = unified ? mesh : items[0]?.el.parentNode;
	if (!parent) return;
	items
		.slice()
		.sort((a, b) => a.z - b.z)
		.forEach((item) => parent.appendChild(item.el));
}

function restPoint(pt3) {
	return { x: pt3.x * SCALE, y: pt3.y * SCALE };
}

function applyRest() {
	resetPose();
	clusters.forEach((cluster) => {
		cluster.statics.forEach((blob) => {
			setCircle(blob.el, restPoint(blob.node), BIG_R);
		});
		cluster.necks.forEach((neck) => {
			setCircle(neck.el, restPoint(neck.pt), NECK_R);
		});
		cluster.travelers.forEach((traveler) => {
			setCircle(traveler.el, restPoint(traveler.a), 0);
		});
	});
}

function applyMesh() {
	const depthItems = [];
	clusters.forEach((cluster) => {
		cluster.statics.forEach((blob) => {
			const p = project(blob.node, BIG_R);
			setCircle(blob.el, p, p.r);
			depthItems.push({ el: blob.el, z: p.z });
		});
		cluster.necks.forEach((neck) => {
			const p = project(neck.pt, NECK_R);
			setCircle(neck.el, p, p.r);
			depthItems.push({ el: neck.el, z: p.z });
		});
		cluster.travelers.forEach((traveler) => {
			setCircle(traveler.el, project(traveler.a, 0), 0);
		});
	});
	sortByDepth(depthItems);
}

function applyClusters() {
	clusters.forEach((cluster) => {
		const depthItems = [];
		cluster.statics.forEach((blob) => {
			const world = transformPoint(blob.node, cluster.origin, cluster.spin.rx, cluster.spin.ry);
			const p = screenPoint(world, blob.node, BIG_R);
			setCircle(blob.el, p, p.r);
			depthItems.push({ el: blob.el, z: p.z });
		});
		cluster.necks.forEach((neck) => {
			const world = transformPoint(neck.pt, cluster.origin, cluster.spin.rx, cluster.spin.ry);
			const p = screenPoint(world, neck.pt, NECK_R);
			setCircle(neck.el, p, p.r);
			depthItems.push({ el: neck.el, z: p.z });
		});
		cluster.travelers.forEach((traveler) => {
			setCircle(traveler.el, restPoint(traveler.a), 0);
		});
		sortByDepth(depthItems);
	});
}

function hideHint() {
	if (hintHidden || !hint) return;
	hintHidden = true;
	hint.classList.add('is-hidden');
}

function killPulse() {
	if (!pulseTl) return;
	pulseTl.kill();
	pulseTl = null;
}

function resetPose() {
	pose.rx = 0;
	pose.ry = 0;
	clusters.forEach((cluster) => {
		cluster.spin.rx = 0;
		cluster.spin.ry = 0;
	});
}

function resetBlobs() {
	resetPose();
	setUnifiedGoo(false);
	setGooBlur(REST_BLUR);
	applyRest();
}

function animateDrop(tl, traveler, start) {
	const from = project(traveler.a, TRAVEL_R);
	const to = project(traveler.b, TRAVEL_R);
	tl.set(traveler.el, { attr: circleAttr({ x: from.x, y: from.y, r: 0 }) }, start);
	tl.to(traveler.el, { attr: { r: TRAVEL_R }, duration: 0.32, ease: 'sine.out' }, start);
	tl.to(
		traveler.el,
		{ attr: { cx: to.x, cy: to.y }, duration: 0.92, ease: 'sine.inOut' },
		start + 0.12
	);
	tl.to(traveler.el, { attr: { r: 0 }, duration: 0.28, ease: 'power2.in' }, start + 0.84);
	tl.to(traveler.el, { attr: { r: TRAVEL_R }, duration: 0.32, ease: 'sine.out' }, start + 1.18);
	tl.to(
		traveler.el,
		{ attr: { cx: from.x, cy: from.y }, duration: 0.92, ease: 'sine.inOut' },
		start + 1.3
	);
	tl.to(traveler.el, { attr: { r: 0 }, duration: 0.28, ease: 'power2.in' }, start + 2.02);
}

function nextHomes(cluster) {
	const homes = cluster.statics.map((blob) => blob.node);
	return homes.map((_, i) => homes[(i + 1) % homes.length]);
}

function commitHomes(cluster, homes) {
	cluster.statics.forEach((blob, i) => {
		blob.node = homes[i];
	});
}

function playShuffle() {
	if (reducedMotion) return;

	hideHint();
	killPulse();
	resetPose();
	setUnifiedGoo(false);
	setGooBlur(REST_BLUR);

	const moves = clusters.map((cluster) => ({
		cluster,
		homes: nextHomes(cluster)
	}));

	pulseTl = gsap.timeline({
		defaults: { overwrite: 'auto' },
		onComplete: () => {
			moves.forEach(({ cluster, homes }) => commitHomes(cluster, homes));
			resetBlobs();
		}
	});

	clusters.forEach((cluster) => {
		cluster.necks.forEach((neck) => {
			pulseTl.to(neck.el, { attr: { r: 0 }, duration: 0.38, ease: 'power2.in' }, 0);
		});
	});

	moves.forEach(({ cluster, homes }) => {
		cluster.statics.forEach((blob, i) => {
			const to = restPoint(homes[i]);
			pulseTl.to(
				blob.el,
				{ attr: { cx: to.x, cy: to.y }, duration: 1.05, ease: 'power3.inOut' },
				0.4
			);
		});
	});

	clusters.forEach((cluster) => {
		cluster.necks.forEach((neck) => {
			const mid = restPoint(neck.pt);
			pulseTl.set(neck.el, { attr: { cx: mid.x, cy: mid.y, r: 0 } }, 1.4);
			pulseTl.to(neck.el, { attr: { r: NECK_R }, duration: 0.42, ease: 'power2.out' }, 1.4);
		});
	});
}

function playPulse() {
	if (reducedMotion) return;

	hideHint();
	killPulse();
	resetBlobs();

	pulseTl = gsap.timeline({
		defaults: { overwrite: 'auto' },
		onComplete: () => {
			resetBlobs();
		}
	});

	clusters.forEach((cluster) => {
		cluster.travelers.forEach((traveler, i) => {
			animateDrop(pulseTl, traveler, i * 0.18);
		});
	});
}

function playRotate() {
	if (reducedMotion) return;

	hideHint();
	killPulse();
	resetPose();
	setUnifiedGoo(true);
	setGooBlur(REST_BLUR);
	applyMesh();

	pulseTl = gsap.timeline({
		defaults: { overwrite: 'auto' },
		onUpdate: () => {
			pose.rx = Math.sin(pulseTl.progress() * Math.PI) * 0.16;
			applyMesh();
		},
		onComplete: () => {
			resetBlobs();
		}
	});

	pulseTl.fromTo(
		pose,
		{ ry: 0 },
		{ ry: Math.PI * 2, duration: 3.2, ease: 'power3.inOut' }
	);
}

function playClusterRotate() {
	if (reducedMotion) return;

	hideHint();
	killPulse();
	resetPose();
	setUnifiedGoo(false);
	setGooBlur(REST_BLUR);
	applyClusters();

	pulseTl = gsap.timeline({
		defaults: { overwrite: 'auto' },
		onUpdate: () => {
			const tilt = Math.sin(pulseTl.progress() * Math.PI) * 0.16;
			clusters.forEach((cluster) => {
				cluster.spin.rx = tilt;
			});
			applyClusters();
		},
		onComplete: () => {
			resetBlobs();
		}
	});

	clusters.forEach((cluster) => {
		pulseTl.fromTo(
			cluster.spin,
			{ ry: 0 },
			{ ry: cluster.dir * Math.PI * 2, duration: 3.2, ease: 'power3.inOut' },
			0
		);
	});
}

function versionCopy(next) {
	if (next === 'v2') {
		return { hint: 'Click to reshuffle', label: 'Dissolve connections and swap nodes' };
	}
	if (next === 'v3') {
		return { hint: 'Click to rotate', label: 'Rotate the metaball mesh' };
	}
	if (next === 'v4') {
		return { hint: 'Click to spin clusters', label: 'Spin each metaball cluster' };
	}
	return { hint: 'Click the logo', label: 'Pulse the metaball logo' };
}

function setVersion(next) {
	if (next === version) return;
	killPulse();
	resetBlobs();
	version = next;
	hintHidden = false;
	const copy = versionCopy(version);
	if (hint) {
		hint.textContent = copy.hint;
		hint.classList.remove('is-hidden');
	}
	hit.setAttribute('aria-label', copy.label);
	versionBtns.forEach((btn) => {
		const active = btn.dataset.version === version;
		btn.classList.toggle('is-active', active);
		btn.setAttribute('aria-pressed', String(active));
	});
	if (reducedMotion) hideHint();
}

function onLogoClick() {
	if (version === 'v2') playShuffle();
	else if (version === 'v3') playRotate();
	else if (version === 'v4') playClusterRotate();
	else playPulse();
}

hit.addEventListener('click', onLogoClick);
versionBtns.forEach((btn) => {
	btn.addEventListener('click', (event) => {
		event.stopPropagation();
		setVersion(btn.dataset.version);
	});
});

setGooBlur(REST_BLUR);
applyRest();
if (reducedMotion) hideHint();
