import { initMetaballBackground } from './metaball-bg.js';

gsap.registerPlugin(MorphSVGPlugin);

const STATES = [
	{
		base: '#shape-01-base',
		accent: '#shape-01-accent',
		gap: '#shape-gap-hidden',
		gapOpacity: 0,
		baseFill: '#211e26'
	},
	{
		base: '#shape-02-base',
		accent: '#shape-02-accent',
		gap: '#shape-gap-hidden',
		gapOpacity: 0,
		baseFill: '#211e26'
	},
	{
		base: '#shape-03-base',
		accent: '#shape-03-accent',
		gap: '#shape-03-gap',
		gapOpacity: 1,
		baseFill: '#000000'
	},
	{
		base: '#shape-04-base',
		accent: '#shape-04-accent',
		gap: '#shape-gap-hidden',
		gapOpacity: 0,
		baseFill: '#211e26'
	}
];

/** V1: idle frozen. V2: idle crawl, burst on morph. */
const VERSIONS = {
	v1: { idle: 0, peak: 1.35 },
	v2: { idle: 0.07, peak: 1.35 }
};

const options = Array.from(document.querySelectorAll('.option'));
const versionCards = Array.from(document.querySelectorAll('.version-card'));
const indicator = document.querySelector('.option-indicator');
const morphBase = document.querySelector('#morph-base');
const morphAccent = document.querySelector('#morph-accent');
const morphGap = document.querySelector('#morph-gap');

let activeIndex = 0;
let activeVersion = 'v1';
let activeTl = null;
let metaballBg = null;

const motion = { scale: 0 };
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function currentVersion() {
	return VERSIONS[activeVersion] || VERSIONS.v1;
}

function syncShaderMotion() {
	metaballBg?.setMotionScale(motion.scale);
}

function restoreIdleMotion() {
	motion.scale = reducedMotion ? 0 : currentVersion().idle;
	syncShaderMotion();
}

function positionIndicator(index, animate = true) {
	const option = options[index];
	if (!option || !indicator) return;

	const copy = option.closest('.morph-card__copy');
	const title = option.querySelector('.option__title');
	const copyRect = copy.getBoundingClientRect();
	const titleRect = title.getBoundingClientRect();
	const y = titleRect.top - copyRect.top + (titleRect.height - indicator.offsetHeight) / 2;

	if (!animate || reducedMotion) {
		gsap.set(indicator, { y });
		return;
	}

	gsap.to(indicator, {
		y,
		duration: 0.45,
		ease: 'power3.out'
	});
}

function setActiveOption(index) {
	options.forEach((btn, i) => {
		const on = i === index;
		btn.classList.toggle('is-active', on);
		btn.setAttribute('aria-pressed', on ? 'true' : 'false');
	});
}

function setActiveVersion(version) {
	if (!VERSIONS[version] || version === activeVersion) return;

	activeVersion = version;
	versionCards.forEach((btn) => {
		const on = btn.dataset.version === version;
		btn.classList.toggle('is-active', on);
		btn.setAttribute('aria-pressed', on ? 'true' : 'false');
	});

	// If a morph burst is running, let it finish into the new idle;
	// otherwise snap idle motion immediately.
	if (!activeTl || !activeTl.isActive()) {
		restoreIdleMotion();
	}
}

function goToState(index) {
	if (index === activeIndex) return;
	if (index < 0 || index >= STATES.length) return;

	const next = STATES[index];
	const duration = reducedMotion ? 0.01 : 0.9;
	const { idle, peak } = currentVersion();

	activeIndex = index;
	setActiveOption(index);
	positionIndicator(index, !reducedMotion);

	if (activeTl) activeTl.kill();
	motion.scale = reducedMotion ? 0 : idle;
	syncShaderMotion();

	activeTl = gsap.timeline({
		defaults: { duration, ease: 'expo.inOut' },
		onComplete: restoreIdleMotion
	});

	// Accel from idle → peak, then brake back to idle (0 for V1, crawl for V2)
	if (metaballBg && !reducedMotion) {
		const accelDur = duration * 0.32;
		const brakeDur = duration - accelDur;

		activeTl.fromTo(
			motion,
			{ scale: idle },
			{
				scale: peak,
				duration: accelDur,
				ease: 'power2.in',
				onUpdate: syncShaderMotion
			},
			0
		);
		activeTl.to(
			motion,
			{
				scale: idle,
				duration: brakeDur,
				ease: 'power3.out',
				onUpdate: syncShaderMotion
			},
			accelDur
		);
	}

	activeTl.to(morphBase, { morphSVG: next.base, fill: next.baseFill }, 0);
	activeTl.to(morphAccent, { morphSVG: next.accent }, 0);
	activeTl.to(
		morphGap,
		{
			morphSVG: next.gap,
			opacity: next.gapOpacity
		},
		0
	);
}

async function init() {
	positionIndicator(0, false);

	options.forEach((btn) => {
		btn.addEventListener('click', () => {
			goToState(Number(btn.dataset.index));
		});
	});

	versionCards.forEach((btn) => {
		btn.addEventListener('click', () => {
			setActiveVersion(btn.dataset.version);
		});
	});

	window.addEventListener('resize', () => positionIndicator(activeIndex, false));

	try {
		metaballBg = await initMetaballBackground(document.getElementById('metaball-canvas'));
		restoreIdleMotion();
	} catch (err) {
		console.error('Metaball background failed to start:', err);
	}

	if (!reducedMotion) {
		gsap.from('.version-switch', {
			opacity: 0,
			y: -8,
			duration: 0.5,
			ease: 'power2.out'
		});
		gsap.from('.morph-card__copy', {
			opacity: 0,
			x: -18,
			duration: 0.65,
			ease: 'power2.out'
		});
		gsap.from('.morph-card__visual', {
			opacity: 0,
			scale: 0.96,
			duration: 0.75,
			ease: 'power2.out'
		});
	}
}

init();
