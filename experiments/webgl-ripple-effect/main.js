/**
 * WebGL — Ripple Effect
 *
 * Two views share the same water simulation:
 * fullscreen image and case-study cards. Images cover the canvas (fit outside).
 * Card pages pass with a GSAP slide.
 */

import { GUI } from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm';
import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm';
import { RippleSurface } from './modules/RippleSurface.js';

const DEFAULT_IMAGE_URL = new URL('./background.jpg', import.meta.url).href;
const CARD_IMAGES = {
	harbor: new URL('./card-01.jpg', import.meta.url).href,
	kitewell: new URL('./card-02.jpg', import.meta.url).href,
};

const STUDIES = [
	{
		image: CARD_IMAGES.harbor,
		logoHtml: `
			<div class="logo-split">
				<span class="logo-split__mark">HARBOR</span>
				<span class="logo-split__rule"></span>
				<span class="logo-split__meta">Product<br>studio</span>
			</div>
		`,
		copy: 'We rebuilt the catalog, search, and checkout around how buyers already shop. Time to first purchase dropped, and the team finally had a site that could keep up with the product line.',
		stat: '240%',
		label: 'Return on investment',
	},
	{
		image: null,
		logoHtml: `
			<div class="logo-word">Ridge Line<small>Outdoor supply</small></div>
		`,
		copy: 'A quieter storefront and a faster restock flow gave the wholesale team a site they could demo without a deck. Seasonal drops now land on time, with fewer support tickets behind them.',
		stat: '4.2x',
		label: 'Repeat order rate',
	},
	{
		image: CARD_IMAGES.kitewell,
		logoHtml: `
			<div class="logo-split">
				<span class="logo-split__mark">KITE</span>
				<span class="logo-split__rule"></span>
				<span class="logo-split__meta">Wellness<br>club</span>
			</div>
		`,
		copy: 'Class booking, membership, and the studio diary now live in one place. Front-desk staff stopped juggling three tools, and members actually finish the signup they start.',
		stat: '68%',
		label: 'Fewer no-shows',
	},
	{
		image: null,
		logoHtml: `
			<div class="logo-word">North Current<small>Coastal kitchen</small></div>
		`,
		copy: 'Menus, reservations, and private dining requests were split across inboxes. One calendar and a clearer room story cut the back-and-forth and filled weeknights that used to sit empty.',
		stat: '31%',
		label: 'Lift in covers',
	},
];

const params = {
	waveSpeed: 0.85,
	springStrength: 0.008,
	velocityDamping: 0.02,
	pressureDamping: 0.996,
	rippleSize: 8,
	rippleStrength: 1.15,
	distortionStrength: 0.055,
	chromaticAberrationStrength: 0.012,
	chromaticAberrationDispersal: 0.018,
	simScale: 1,
	loadImage() {},
	resetImage() {},
	resetRipples() {},
	onInteract() {},
};

const canvas = document.getElementById('canvas');
const hint = document.getElementById('hint');
const errorEl = document.getElementById('error');
const fileInput = document.getElementById('image-input');
const cardsView = document.getElementById('cards-view');
const dotsRoot = document.querySelector('.cards-dots');
const slotEls = [...document.querySelectorAll('.study-card')];

let mode = 'fullscreen';
let page = 0;
let running = false;
let passing = false;
let hasShownCards = false;
let fullscreen = null;
const cardSurfaces = [null, null];
const cardImageUrls = [null, null];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function showError(message) {
	if (hint) hint.hidden = true;
	if (errorEl) {
		errorEl.hidden = false;
		if (message) errorEl.textContent = message;
	}
}

function hideHint() {
	if (hint) hint.classList.add('is-hidden');
}

params.onInteract = hideHint;

function pageCount() {
	return STUDIES.length;
}

function studyAt(offset) {
	const count = STUDIES.length;
	return STUDIES[((page + offset) % count + count) % count];
}

function renderLogo(el, html) {
	el.innerHTML = html;
}

async function surfaceFor(index) {
	if (cardSurfaces[index]) return cardSurfaces[index];
	const cardCanvas = slotEls[index].querySelector('canvas');
	const surface = new RippleSurface(cardCanvas, {
		params,
		fit: 'cover',
		interact: 'hover',
		letterbox: [0.043, 0.11, 0.2],
		cap: 720,
	});
	if (!surface.ok) {
		showError('WebGL2 with floating-point buffers is required for this experiment.');
		return null;
	}
	cardSurfaces[index] = surface;
	return surface;
}

async function paintSlot(index) {
	const el = slotEls[index];
	const study = studyAt(index);
	if (!el || !study) return;

	el.classList.toggle('study-card--photo', Boolean(study.image));
	el.classList.toggle('study-card--text', !study.image);
	renderLogo(el.querySelector('.study-card__logo'), study.logoHtml);
	el.querySelector('.study-card__copy').textContent = study.copy;
	el.querySelector('.study-card__value').textContent = study.stat;
	el.querySelector('.study-card__label').textContent = study.label;

	if (study.image) {
		const surface = await surfaceFor(index);
		if (!surface) return;
		if (cardImageUrls[index] !== study.image) {
			cardImageUrls[index] = study.image;
			await surface.setImage(study.image);
		}
		surface.setEnabled(mode === 'cards');
	} else if (cardSurfaces[index]) {
		cardImageUrls[index] = null;
		cardSurfaces[index].setEnabled(false);
	}
}

function renderDots() {
	dotsRoot.innerHTML = '';
	for (let i = 0; i < pageCount(); i += 1) {
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.className = 'cards-dot' + (i === page ? ' is-active' : '');
		btn.setAttribute('aria-label', 'Show pair ' + (i + 1));
		btn.setAttribute('aria-current', i === page ? 'true' : 'false');
		btn.addEventListener('click', () => setPage(i));
		dotsRoot.appendChild(btn);
	}
}

function shortestDir(from, to, count) {
	const fwd = (to - from + count) % count;
	const back = (from - to + count) % count;
	if (fwd === 0) return 1;
	return fwd <= back ? 1 : -1;
}

function animateTo(vars) {
	return new Promise((resolve) => {
		gsap.to(slotEls, {
			...vars,
			onComplete: resolve,
		});
	});
}

async function paintCurrent() {
	renderDots();
	await Promise.all([paintSlot(0), paintSlot(1)]);
	const row = document.querySelector('.cards-row');
	if (row) row.classList.toggle('is-flipped', !studyAt(0).image && Boolean(studyAt(1).image));
	cardSurfaces.forEach((surface) => surface && surface.invalidateSim());
}

async function setPage(next, direction) {
	const count = pageCount();
	const wrapped = ((next % count) + count) % count;
	if (passing) return;
	if (wrapped === page && hasShownCards) return;

	passing = true;
	const dir = direction || shortestDir(page, wrapped, count);
	const reduce = reduceMotion.matches;

	gsap.killTweensOf(slotEls);

	if (hasShownCards && !reduce) {
		await animateTo({
			xPercent: -20 * dir,
			opacity: 0,
			duration: 0.36,
			stagger: 0.05,
			ease: 'power2.in',
			overwrite: true,
		});
	}

	page = wrapped;
	await paintCurrent();

	if (reduce) {
		gsap.set(slotEls, { xPercent: 0, y: 0, opacity: 1 });
		hasShownCards = true;
		passing = false;
		return;
	}

	await new Promise((resolve) => {
		gsap.fromTo(
			slotEls,
			{
				xPercent: hasShownCards ? 20 * dir : 0,
				y: hasShownCards ? 0 : 18,
				opacity: 0,
			},
			{
				xPercent: 0,
				y: 0,
				opacity: 1,
				duration: 0.52,
				stagger: 0.07,
				ease: 'power3.out',
				overwrite: true,
				onComplete: resolve,
			}
		);
	});

	hasShownCards = true;
	passing = false;
}

async function setMode(next) {
	if (next === mode) return;
	mode = next;
	document.body.dataset.mode = mode;
	cardsView.hidden = mode !== 'cards';

	document.querySelectorAll('.mode-switch__btn').forEach((btn) => {
		const active = btn.dataset.mode === mode;
		btn.classList.toggle('is-active', active);
		btn.setAttribute('aria-selected', active ? 'true' : 'false');
	});

	if (fullscreen) fullscreen.setEnabled(mode === 'fullscreen');

	if (mode === 'cards') {
		requestAnimationFrame(() => {
			setPage(page).catch((err) => console.warn('[ripple] cards failed', err));
		});
	} else {
		hasShownCards = false;
		gsap.killTweensOf(slotEls);
		gsap.set(slotEls, { xPercent: 0, y: 0, opacity: 1 });
		cardSurfaces.forEach((surface) => surface && surface.setEnabled(false));
	}
}

function allSurfaces() {
	return [fullscreen, ...cardSurfaces].filter(Boolean);
}

async function loadUserFile(file) {
	if (!file || !file.type.startsWith('image/')) return;
	try {
		if (mode === 'cards') {
			const left = await surfaceFor(0);
			if (left) {
				await left.setImage(file);
				cardImageUrls[0] = 'user';
				slotEls[0].classList.add('study-card--photo');
				slotEls[0].classList.remove('study-card--text');
				left.setEnabled(true);
			}
		} else if (fullscreen) {
			await fullscreen.setImage(file);
		}
	} catch (err) {
		console.warn('[ripple] could not load image', err);
	}
}

function setupGui() {
	params.loadImage = () => fileInput.click();
	params.resetImage = () => {
		if (mode === 'cards') {
			cardImageUrls[0] = null;
			cardImageUrls[1] = null;
			paintCurrent().catch((err) => console.warn('[ripple] reset cards failed', err));
		} else if (fullscreen) {
			fullscreen.setImage(DEFAULT_IMAGE_URL).catch((err) => {
				console.warn('[ripple] could not restore default image', err);
			});
		}
	};
	params.resetRipples = () => {
		allSurfaces().forEach((surface) => surface.resetRipples());
	};

	const gui = new GUI({ title: 'Ripple Effect' });
	const imageFolder = gui.addFolder('Image');
	imageFolder.add(params, 'loadImage').name('load image');
	imageFolder.add(params, 'resetImage').name('reset image');
	imageFolder.close();

	const rippleFolder = gui.addFolder('Ripple');
	rippleFolder.add(params, 'rippleSize', 8, 220, 1).name('size');
	rippleFolder.add(params, 'rippleStrength', 0, 4, 0.01).name('strength');
	rippleFolder.close();

	const simFolder = gui.addFolder('Simulation');
	simFolder.add(params, 'waveSpeed', 0.1, 1.2, 0.01).name('wave speed');
	simFolder.add(params, 'springStrength', 0, 0.08, 0.001).name('spring');
	simFolder.add(params, 'velocityDamping', 0, 0.15, 0.001).name('velocity damp');
	simFolder.add(params, 'pressureDamping', 0.95, 1, 0.001).name('pressure damp');
	simFolder.add(params, 'resetRipples').name('reset ripples');
	simFolder.close();

	const lookFolder = gui.addFolder('Look');
	lookFolder.add(params, 'distortionStrength', 0, 0.25, 0.001).name('distortion');
	lookFolder.add(params, 'chromaticAberrationStrength', 0, 0.08, 0.001).name('chroma');
	lookFolder.add(params, 'chromaticAberrationDispersal', 0, 0.08, 0.001).name('chroma spread');
	lookFolder.close();

	const systemFolder = gui.addFolder('System');
	systemFolder.add(params, 'simScale', 0.35, 1, 0.05).name('sim scale').onFinishChange(() => {
		allSurfaces().forEach((surface) => surface.invalidateSim());
	});
	systemFolder.close();
	gui.close();
}

function setupChrome() {
	document.querySelectorAll('.mode-switch__btn').forEach((btn) => {
		btn.addEventListener('click', () => setMode(btn.dataset.mode));
	});

	document.querySelectorAll('.cards-arrow').forEach((btn) => {
		btn.addEventListener('click', () => {
			const dir = Number(btn.dataset.dir);
			setPage(page + dir, dir);
		});
	});

	fileInput.addEventListener('change', () => {
		const file = fileInput.files && fileInput.files[0];
		loadUserFile(file);
		fileInput.value = '';
	});

	window.addEventListener('dragover', (event) => event.preventDefault());
	window.addEventListener('drop', (event) => {
		event.preventDefault();
		if (mode !== 'fullscreen') return;
		const file = [...(event.dataTransfer.files || [])].find((item) => item.type.startsWith('image/'));
		if (file) loadUserFile(file);
	});
}

function loop() {
	if (fullscreen) fullscreen.tick();
	cardSurfaces.forEach((surface) => surface && surface.tick());
	requestAnimationFrame(loop);
}

async function init() {
	fullscreen = new RippleSurface(canvas, {
		params,
		fit: 'cover',
		letterbox: [0.047, 0.071, 0.086],
	});
	if (!fullscreen.ok) {
		showError('WebGL2 with floating-point buffers is required for this experiment.');
		return;
	}

	setupGui();
	setupChrome();
	renderDots();

	try {
		await fullscreen.setImage(DEFAULT_IMAGE_URL);
	} catch (err) {
		console.warn('[ripple] default image failed', err);
	}

	fullscreen.setEnabled(true);
	if (!running) {
		running = true;
		requestAnimationFrame(loop);
	}
}

init().catch((err) => {
	showError(err.message || 'Failed to start this experiment.');
	console.error('[ripple]', err);
});
