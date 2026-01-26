// Lab Core - Shared functionality

(function() {
	'use strict';

	// Google Analytics - Track engaged time
	let startTime = Date.now();
	let isActive = true;
	let totalActiveTime = 0;
	let lastActiveTime = startTime;

	function trackEngagedTime() {
		if (isActive) {
			const now = Date.now();
			totalActiveTime += now - lastActiveTime;
			lastActiveTime = now;
		}
	}

	function resetEngagedTime() {
		startTime = Date.now();
		lastActiveTime = startTime;
		totalActiveTime = 0;
		isActive = true;
	}

	// Track user activity
	document.addEventListener('visibilitychange', function() {
		if (document.hidden) {
			isActive = false;
			trackEngagedTime();
		} else {
			isActive = true;
			lastActiveTime = Date.now();
		}
	});

	// Send engaged time on page unload
	window.addEventListener('beforeunload', function() {
		trackEngagedTime();
		if (totalActiveTime > 0 && typeof gtag !== 'undefined') {
			const seconds = Math.round(totalActiveTime / 1000);
			gtag('event', 'time_on_page', {
				'value': seconds,
				'event_category': 'Engagement',
				'event_label': window.location.pathname
			});
		}
	});

	// Info Panel functionality
	const infoPanel = document.getElementById('lab-info-panel');
	const infoToggle = document.querySelector('.lab-info-toggle');
	const infoClose = document.querySelector('.lab-info-panel__close');
	const infoOverlay = document.querySelector('.lab-info-panel__overlay');

	function openInfoPanel() {
		if (infoPanel) {
			infoPanel.classList.add('active');
			document.body.style.overflow = 'hidden';
			
			// Animate with GSAP if available
			if (typeof gsap !== 'undefined') {
				gsap.fromTo(infoPanel.querySelector('.lab-info-panel__content'), 
					{ x: '100%' },
					{ x: 0, duration: 0.3, ease: 'power2.out' }
				);
			}
		}
	}

	function closeInfoPanel() {
		if (infoPanel) {
			if (typeof gsap !== 'undefined') {
				gsap.to(infoPanel.querySelector('.lab-info-panel__content'), {
					x: '100%',
					duration: 0.3,
					ease: 'power2.in',
					onComplete: function() {
						infoPanel.classList.remove('active');
						document.body.style.overflow = '';
					}
				});
			} else {
				infoPanel.classList.remove('active');
				document.body.style.overflow = '';
			}
		}
	}

	if (infoToggle) {
		infoToggle.addEventListener('click', openInfoPanel);
	}

	if (infoClose) {
		infoClose.addEventListener('click', closeInfoPanel);
	}

	if (infoOverlay) {
		infoOverlay.addEventListener('click', closeInfoPanel);
	}

	// Close on Escape key
	document.addEventListener('keydown', function(e) {
		if (e.key === 'Escape') {
			if (infoPanel && infoPanel.classList.contains('active')) {
				closeInfoPanel();
			}
			if (globalInfoPanel && globalInfoPanel.classList.contains('active')) {
				closeGlobalInfoPanel();
			}
		}
	});

	// Reset engaged time on navigation
	window.addEventListener('popstate', resetEngagedTime);

	// Global Info Panel functionality
	const globalInfoPanel = document.getElementById('lab-global-info-panel');
	const globalInfoToggle = document.querySelector('.lab-global-info-toggle');
	const globalInfoClose = document.querySelector('.lab-global-info-panel__close');
	const globalInfoOverlay = document.querySelector('.lab-global-info-panel__overlay');

	function openGlobalInfoPanel() {
		if (globalInfoPanel) {
			globalInfoPanel.classList.add('active');
			document.body.style.overflow = 'hidden';
			
			// Animate with GSAP if available
			if (typeof gsap !== 'undefined') {
				const content = globalInfoPanel.querySelector('.lab-global-info-panel__content');
				const overlay = globalInfoPanel.querySelector('.lab-global-info-panel__overlay');
				
				// Create timeline for smooth sequenced animation
				const tl = gsap.timeline();
				
				// Animate overlay fade-in first
				if (overlay) {
					gsap.set(overlay, { opacity: 0 });
					tl.to(overlay, {
						opacity: 1,
						duration: 0.2,
						ease: 'power2.out'
					});
				}
				
				// Then animate content with scale and slide
				if (content) {
					gsap.set(content, { x: '100%', scale: 0.95 });
					tl.to(content, {
						x: 0,
						scale: 1,
						duration: 0.4,
						ease: 'power3.out'
					}, '-=0.1');
				}
			}
		}
	}

	function closeGlobalInfoPanel() {
		if (globalInfoPanel) {
			if (typeof gsap !== 'undefined') {
				const content = globalInfoPanel.querySelector('.lab-global-info-panel__content');
				const overlay = globalInfoPanel.querySelector('.lab-global-info-panel__overlay');
				
				// Create timeline for smooth sequenced animation
				const tl = gsap.timeline({
					onComplete: function() {
						globalInfoPanel.classList.remove('active');
						document.body.style.overflow = '';
					}
				});
				
				// Animate content out first
				if (content) {
					tl.to(content, {
						x: '100%',
						scale: 0.95,
						duration: 0.3,
						ease: 'power3.in'
					});
				}
				
				// Then fade out overlay
				if (overlay) {
					tl.to(overlay, {
						opacity: 0,
						duration: 0.2,
						ease: 'power2.in'
					}, '-=0.1');
				}
			} else {
				globalInfoPanel.classList.remove('active');
				document.body.style.overflow = '';
			}
		}
	}

	if (globalInfoToggle) {
		globalInfoToggle.addEventListener('click', openGlobalInfoPanel);
	}

	if (globalInfoClose) {
		globalInfoClose.addEventListener('click', closeGlobalInfoPanel);
	}

	if (globalInfoOverlay) {
		globalInfoOverlay.addEventListener('click', closeGlobalInfoPanel);
	}

	// Close global info panel on Escape key
	document.addEventListener('keydown', function(e) {
		if (e.key === 'Escape' && globalInfoPanel && globalInfoPanel.classList.contains('active')) {
			closeGlobalInfoPanel();
		}
	});

	// Export for use in other scripts
	window.LabCore = {
		resetEngagedTime: resetEngagedTime,
		openInfoPanel: openInfoPanel,
		closeInfoPanel: closeInfoPanel,
		openGlobalInfoPanel: openGlobalInfoPanel,
		closeGlobalInfoPanel: closeGlobalInfoPanel
	};

})();
