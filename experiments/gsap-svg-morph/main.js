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

const options = Array.from(document.querySelectorAll('.option'));
const indicator = document.querySelector('.option-indicator');
const morphBase = document.querySelector('#morph-base');
const morphAccent = document.querySelector('#morph-accent');
const morphGap = document.querySelector('#morph-gap');

let activeIndex = 0;
let activeTl = null;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

function goToState(index) {
	if (index === activeIndex) return;
	if (index < 0 || index >= STATES.length) return;

	const next = STATES[index];
	const duration = reducedMotion ? 0.01 : 0.9;

	activeIndex = index;
	setActiveOption(index);
	positionIndicator(index, !reducedMotion);

	if (activeTl) activeTl.kill();

	activeTl = gsap.timeline({
		defaults: { duration, ease: 'expo.inOut' }
	});

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

	window.addEventListener('resize', () => positionIndicator(activeIndex, false));

	try {
		await initMetaballBackground(document.getElementById('metaball-canvas'));
	} catch (err) {
		console.error('Metaball background failed to start:', err);
	}

	if (!reducedMotion) {
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
