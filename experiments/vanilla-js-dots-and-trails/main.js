/** Vanilla JS — Dots and Trails. See README.md for embed guide. */
(function () {
	'use strict';

	const MOBILE_QUERY = '(max-width: 768px)';
	const STATIC_LAYOUT = 'random'; // 'grid' | 'gesture' | 'random'

	const app = document.querySelector('.app');
	const canvas = document.getElementById('c');
	const staticDots = document.getElementById('staticDots');
	const mobileMq = window.matchMedia(MOBILE_QUERY);
	let trailInstance = null;

	function isMobile() {
		return mobileMq.matches;
	}

	function destroyTrail() {
		if (!trailInstance) return;
		trailInstance.destroy();
		trailInstance = null;
	}

	function renderMobileStatic() {
		destroyTrail();
		GridTrail.renderStaticPreview({
			staticDots,
			width: window.innerWidth,
			height: window.innerHeight,
			blended: true,
			layout: STATIC_LAYOUT,
		});
	}

	function startDesktopTrail() {
		destroyTrail();
		trailInstance = GridTrail.create({ canvas, staticDots });
	}

	function applyMode() {
		const mobile = isMobile();
		app.classList.toggle('is-mobile', mobile);
		app.classList.toggle('is-desktop', !mobile);
		if (mobile) renderMobileStatic();
		else startDesktopTrail();
	}

	mobileMq.addEventListener('change', applyMode);
	window.addEventListener('resize', () => {
		if (isMobile()) renderMobileStatic();
	});

	applyMode();
})();
