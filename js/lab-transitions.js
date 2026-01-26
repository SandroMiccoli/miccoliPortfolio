// Lab Transitions - GSAP page transitions

(function() {
	'use strict';

	if (typeof gsap === 'undefined') {
		console.warn('GSAP not loaded, transitions disabled');
		return;
	}

	const transitionContainer = document.querySelector('.lab-transition-container');
	if (!transitionContainer) return;

	let isTransitioning = false;

	function transitionTo(url) {
		if (isTransitioning) return;
		isTransitioning = true;

		// Exit animation (fade only)
		gsap.to(transitionContainer, {
			opacity: 0,
			duration: 0.3,
			ease: 'power2.in',
			onComplete: function() {
				// Navigate
				window.location.href = url;
			}
		});
	}

	function handleLinkClick(e) {
		const link = e.target.closest('a');
		if (!link) return;

		const href = link.getAttribute('href');
		if (!href) return;

		// Skip external links, anchors, and special protocols
		if (href.startsWith('http') || 
		    href.startsWith('mailto:') || 
		    href.startsWith('tel:') ||
		    href.startsWith('#') ||
		    link.target === '_blank') {
			return;
		}

		// Skip if modifier keys are pressed
		if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
			return;
		}

		e.preventDefault();
		transitionTo(href);
	}

	// Intercept all link clicks
	document.addEventListener('click', handleLinkClick);

	// Handle browser back/forward
	window.addEventListener('popstate', function() {
		// Enter animation (fade only)
		gsap.fromTo(transitionContainer, 
			{ opacity: 0 },
			{ 
				opacity: 1, 
				duration: 0.4, 
				ease: 'power2.out',
				onComplete: function() {
					isTransitioning = false;
				}
			}
		);
	});

	// Initial enter animation (fade only)
	gsap.fromTo(transitionContainer,
		{ opacity: 0 },
		{
			opacity: 1,
			duration: 0.4,
			ease: 'power2.out',
			onComplete: function() {
				isTransitioning = false;
			}
		}
	);

	// Export for use in other scripts
	window.LabTransitions = {
		transitionTo: transitionTo
	};

})();
