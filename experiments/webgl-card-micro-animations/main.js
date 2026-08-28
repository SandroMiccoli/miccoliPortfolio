/**
 * WebGL Card Micro-Animations
 * Scene switcher: Image Over, Card BG, and Card Grid.
 */

import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/+esm';
import { Draggable } from 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/Draggable.js/+esm';
import { InertiaPlugin } from 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/InertiaPlugin.js/+esm';
import { Observer } from 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/Observer.js/+esm';

gsap.registerPlugin(Draggable, InertiaPlugin, Observer);
gsap.defaults({ ease: 'power3.out' });

const runtimes = {
	imageOver: null,
	cardBg: null,
	cardGrid: null,
};

function afterFirstPaint(fn) {
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			if (typeof requestIdleCallback === 'function') {
				requestIdleCallback(fn, { timeout: 280 });
				return;
			}
			fn();
		});
	});
}

function initSurfaces(viewport) {
	afterFirstPaint(() => {
		import('./modules/MetaballGridRenderer.js')
			.then(({ MetaballGridRenderer }) => {
				const renderer = new MetaballGridRenderer();
				if (!renderer.ok) {
					console.warn('WebGL2 is required for the card overlay.');
					return;
				}
				document.querySelectorAll('.person-card').forEach((card) => renderer.attach(card));
				renderer.observe(viewport);
				runtimes.imageOver = renderer;
				const active = document.querySelector('.scene:not([hidden])')?.dataset.scene;
				if (active === 'image-over') renderer.start();
			})
			.catch((error) => {
				console.error(error);
			});
	});
}

function initCardBg() {
	if (runtimes.cardBg) {
		runtimes.cardBg.start();
		return Promise.resolve(runtimes.cardBg);
	}
	if (runtimes.cardBgPending) return runtimes.cardBgPending;

	const canvas = document.querySelector('.talent-card__gl');
	if (!canvas) return Promise.resolve(null);

	runtimes.cardBgPending = import('./modules/MetaballPairRenderer.js')
		.then(({ MetaballPairRenderer }) => {
			const renderer = new MetaballPairRenderer(canvas);
			runtimes.cardBgPending = null;
			if (!renderer.ok) {
				console.warn('WebGL2 is required for the card background.');
				return null;
			}
			runtimes.cardBg = renderer;
			renderer.start();
			return renderer;
		})
		.catch((error) => {
			runtimes.cardBgPending = null;
			console.error(error);
			return null;
		});

	return runtimes.cardBgPending;
}

function initCardGrid() {
	if (runtimes.cardGrid) {
		runtimes.cardGrid.start();
		return Promise.resolve(runtimes.cardGrid);
	}
	if (runtimes.cardGridPending) return runtimes.cardGridPending;

	const canvas = document.querySelector('.client-card__gl');
	if (!canvas) return Promise.resolve(null);

	runtimes.cardGridPending = import('./modules/MetaballOrderedGridRenderer.js')
		.then(({ MetaballOrderedGridRenderer }) => {
			const renderer = new MetaballOrderedGridRenderer(canvas);
			runtimes.cardGridPending = null;
			if (!renderer.ok) {
				console.warn('WebGL2 is required for the card grid.');
				return null;
			}
			runtimes.cardGrid = renderer;
			renderer.start();
			return renderer;
		})
		.catch((error) => {
			runtimes.cardGridPending = null;
			console.error(error);
			return null;
		});

	return runtimes.cardGridPending;
}

function setScene(id) {
	const panels = document.querySelectorAll('.scene[data-scene]');
	const tabs = document.querySelectorAll('.scene-switch__btn');

	for (const panel of panels) {
		const on = panel.dataset.scene === id;
		panel.hidden = !on;
		panel.setAttribute('aria-hidden', on ? 'false' : 'true');
	}

	for (const tab of tabs) {
		const on = tab.dataset.scene === id;
		tab.setAttribute('aria-selected', on ? 'true' : 'false');
		tab.tabIndex = on ? 0 : -1;
	}

	if (id === 'card-bg') {
		runtimes.imageOver?.pause?.();
		runtimes.cardGrid?.pause?.();
		initCardBg();
		return;
	}

	if (id === 'card-grid') {
		runtimes.imageOver?.pause?.();
		runtimes.cardBg?.pause?.();
		initCardGrid();
		return;
	}

	runtimes.cardBg?.pause?.();
	runtimes.cardGrid?.pause?.();
	runtimes.imageOver?.start();
}

function initSceneSwitch() {
	const tabs = [...document.querySelectorAll('.scene-switch__btn')];
	if (!tabs.length) return;

	for (const tab of tabs) {
		tab.addEventListener('click', () => setScene(tab.dataset.scene));
	}

	const list = document.querySelector('.scene-switch');
	list?.addEventListener('keydown', (event) => {
		const current = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
		if (current < 0) return;

		let next = current;
		if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % tabs.length;
		if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current - 1 + tabs.length) % tabs.length;
		if (next === current) return;

		event.preventDefault();
		tabs[next].focus();
		setScene(tabs[next].dataset.scene);
	});
}

function initGallery(track) {
	const viewport = track?.closest('.gallery__viewport');
	const prevBtn = document.querySelector('.gallery__arrow--prev');
	const nextBtn = document.querySelector('.gallery__arrow--next');
	if (!track || !viewport || !prevBtn || !nextBtn) return;

	const mm = gsap.matchMedia();

	mm.add(
		{
			motion: '(prefers-reduced-motion: no-preference)',
			reduce: '(prefers-reduced-motion: reduce)',
		},
		(context) => {
			const reduce = Boolean(context.conditions.reduce);
			const duration = reduce ? 0 : 0.85;
			let wheelLock = false;
			let wheelUnlock;

			const cardStep = () => {
				const card = track.querySelector('.person-card');
				if (!card) return viewport.clientWidth * 0.7;
				const styles = getComputedStyle(track);
				const gap = parseFloat(styles.columnGap || styles.gap) || 18;
				return card.getBoundingClientRect().width + gap;
			};

			const minX = () => Math.min(0, viewport.clientWidth - track.scrollWidth);
			const currentX = () => Number(gsap.getProperty(track, 'x')) || 0;

			const snapX = (x) => {
				const step = cardStep();
				if (step <= 0) return gsap.utils.clamp(minX(), 0, x);
				return gsap.utils.clamp(minX(), 0, Math.round(x / step) * step);
			};

			const updateArrows = () => {
				const x = currentX();
				prevBtn.disabled = x >= -2;
				nextBtn.disabled = x <= minX() + 2;
			};

			const goToX = (x) => {
				const target = snapX(x);
				gsap.killTweensOf(track);
				gsap.to(track, {
					x: target,
					duration,
					overwrite: 'auto',
					onUpdate: updateArrows,
					onComplete() {
						draggable.update();
						updateArrows();
					},
				});
			};

			const go = (dir) => {
				goToX(currentX() - dir * cardStep());
			};

			const draggable = Draggable.create(track, {
				type: 'x',
				inertia: !reduce,
				cursor: 'grab',
				activeCursor: 'grabbing',
				edgeResistance: 0.82,
				bounds: { minX: minX(), maxX: 0 },
				snap: { x: snapX },
				onPress() {
					gsap.killTweensOf(track);
					track.classList.add('is-dragging');
				},
				onDrag: updateArrows,
				onThrowUpdate: updateArrows,
				onRelease() {
					track.classList.remove('is-dragging');
				},
				onThrowComplete: updateArrows,
			})[0];

			const applyBounds = () => {
				draggable.applyBounds({ minX: minX(), maxX: 0 });
				gsap.set(track, { x: snapX(currentX()) });
				draggable.update();
				updateArrows();
			};

			const onPrev = () => go(-1);
			const onNext = () => go(1);
			const onKey = (event) => {
				if (event.key === 'ArrowLeft') {
					event.preventDefault();
					go(-1);
				}
				if (event.key === 'ArrowRight') {
					event.preventDefault();
					go(1);
				}
			};

			prevBtn.addEventListener('click', onPrev);
			nextBtn.addEventListener('click', onNext);
			track.addEventListener('keydown', onKey);
			window.addEventListener('resize', applyBounds);

			const observer = Observer.create({
				target: viewport,
				type: 'wheel',
				wheelSpeed: -1,
				onChangeY(self) {
					if (Math.abs(self.deltaY) < 10) return;

					const atStart = currentX() >= -2 && self.deltaY < 0;
					const atEnd = currentX() <= minX() + 2 && self.deltaY > 0;
					if (atStart || atEnd || wheelLock) return;

					self.event?.preventDefault();
					wheelLock = true;
					go(self.deltaY > 0 ? 1 : -1);
					wheelUnlock = gsap.delayedCall(reduce ? 0 : 0.5, () => {
						wheelLock = false;
					});
				},
			});

			gsap.set(track, { x: 0 });
			applyBounds();

			if (!reduce) {
				gsap
					.timeline({ defaults: { ease: 'power3.out' } })
					.from('.scene-header > *', { y: 18, autoAlpha: 0, duration: 0.55, stagger: 0.08 })
					.from(
						'.person-card',
						{ y: 32, autoAlpha: 0, duration: 0.7, stagger: { each: 0.07, from: 'start' } },
						'-=0.3',
					)
					.from('.gallery__nav', { y: 8, autoAlpha: 0, duration: 0.4 }, '-=0.45');
			}

			return () => {
				wheelUnlock?.kill();
				observer.kill();
				draggable.kill();
				prevBtn.removeEventListener('click', onPrev);
				nextBtn.removeEventListener('click', onNext);
				track.removeEventListener('keydown', onKey);
				window.removeEventListener('resize', applyBounds);
			};
		},
	);
}

initSceneSwitch();
initGallery(document.getElementById('fellows-track'));
initSurfaces(document.querySelector('.gallery__viewport'));

const initial = location.hash.replace('#', '');
if (initial === 'card-bg' || initial === 'card-grid') setScene(initial);
