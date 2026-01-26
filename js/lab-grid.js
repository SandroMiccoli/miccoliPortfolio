// Lab Grid - Isotope masonry grid with filtering and animations

(function() {
	'use strict';

	// Check if Isotope is available
	if (typeof Isotope === 'undefined') {
		console.error('Isotope not loaded! Check CDN link in lab-default.html');
		// Don't return - filters should still work without grid
	}

	const gridElement = document.getElementById('lab-grid');
	if (!gridElement) {
		console.warn('Grid element not found');
		return;
	}

	let grid = null;
	let activeTags = new Set();
	let searchQuery = '';
	let isInitializing = false;
	let filterTimeout = null;

	// Optimized initialization - wait for Isotope and DOM to be ready
	function waitForReady(callback) {
		// Check if Isotope is loaded, if not wait for it
		function checkIsotope() {
			if (typeof Isotope !== 'undefined') {
				// Isotope is loaded, proceed with DOM/image checks
				initGridWhenReady();
			} else {
				// Wait a bit more for Isotope to load
				setTimeout(checkIsotope, 100);
			}
		}

		// Wait for DOM to be ready
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', function() {
				setTimeout(checkIsotope, 50);
			});
		} else {
			setTimeout(checkIsotope, 50);
		}

		function initGridWhenReady() {
			// Wait for CSS to apply and a few images to load, but don't block on all images
			const images = gridElement.querySelectorAll('img');
			const totalImages = images.length;
			
			if (totalImages === 0) {
				// No images, proceed immediately
				setTimeout(callback, 100);
				return;
			}

			// Count how many images are already loaded
			let loadedCount = 0;
			images.forEach(img => {
				if (img.complete && img.naturalWidth > 0) {
					loadedCount++;
				}
			});

			// If at least 3 images are loaded or 30% of images, proceed
			// This prevents blocking on slow-loading images
			const minLoaded = Math.min(3, Math.ceil(totalImages * 0.3));
			
			if (loadedCount >= minLoaded) {
				// Enough images loaded, proceed
				setTimeout(callback, 100);
			} else {
				// Wait for a few more images or timeout after 800ms
				let timeoutId = setTimeout(function() {
					setTimeout(callback, 100);
				}, 800);
				
				let loaded = 0;
				images.forEach(img => {
					if (!img.complete || img.naturalWidth === 0) {
						img.addEventListener('load', function onLoad() {
							loaded++;
							if (loaded >= minLoaded - loadedCount) {
								clearTimeout(timeoutId);
								setTimeout(callback, 100);
							}
						}, { once: true });
						
						// Also handle error case
						img.addEventListener('error', function onError() {
							loaded++;
							if (loaded >= minLoaded - loadedCount) {
								clearTimeout(timeoutId);
								setTimeout(callback, 100);
							}
						}, { once: true });
					}
				});
			}
		}
	}

	// Filter function to check if item should be shown
	function shouldShowItem(element) {
		if (!element) return false;

		// Check search query
		if (searchQuery && searchQuery.trim()) {
			const title = (element.getAttribute('data-title') || '').toLowerCase();
			const description = (element.getAttribute('data-description') || '').toLowerCase();
			const stack = (element.getAttribute('data-stack') || '').toLowerCase();
			const searchLower = searchQuery.toLowerCase().trim();
			
			const matchesSearch = title.includes(searchLower) || 
			                     description.includes(searchLower) || 
			                     stack.includes(searchLower);
			
			if (!matchesSearch) {
				return false;
			}
		}

		// Check tag filters
		if (activeTags.size > 0 && !activeTags.has('all')) {
			const itemTagsAttr = element.getAttribute('data-tags') || '';
			const itemTags = itemTagsAttr.toLowerCase()
				.split(',')
				.map(tag => tag.trim())
				.filter(tag => tag.length > 0);
			
			if (itemTags.length === 0) {
				// Item has no tags, don't show if filters are active
				return false;
			}
			
			// Check if any active tag matches item tags
			const hasMatchingTag = Array.from(activeTags).some(activeTag => {
				const activeTagLower = activeTag.toLowerCase().trim();
				if (!activeTagLower) return false;
				
				// Direct match
				if (itemTags.includes(activeTagLower)) {
					return true;
				}
				
				// Handle special cases (e.g., "p5js" vs "p5.js" or "p5")
				if (activeTagLower === 'p5js' && itemTags.some(tag => tag.includes('p5'))) {
					return true;
				}
				if (activeTagLower === 'threejs' && itemTags.some(tag => tag.includes('three'))) {
					return true;
				}
				if (activeTagLower === 'ai-images' && itemTags.some(tag => tag.includes('ai'))) {
					return true;
				}
				
				return false;
			});
			
			if (!hasMatchingTag) {
				return false;
			}
		}

		return true;
	}

	// Initialize Isotope grid
	function initGrid() {
		if (isInitializing) return;
		isInitializing = true;

		// Check if Isotope is loaded
		if (typeof Isotope === 'undefined') {
			console.error('Cannot initialize grid: Isotope library is not loaded');
			isInitializing = false;
			return;
		}

		const items = gridElement.querySelectorAll('.lab-grid-item');
		if (items.length === 0) {
			console.warn('No grid items found');
			isInitializing = false;
			return;
		}

		// Destroy existing grid if it exists
		if (grid) {
			try {
				grid.destroy();
			} catch (e) {
				// Ignore destroy errors
			}
			grid = null;
		}

		try {
			// Calculate column width from a 1x1 tile element
			// Find first 1x1 tile to use as column width reference
			const columnWidthElement = gridElement.querySelector('.lab-grid-item.tile-1x1');
			let columnWidth;
			
			if (columnWidthElement) {
				// Use the actual element for more reliable calculation
				columnWidth = columnWidthElement;
			} else {
				// Fallback: use selector string if no 1x1 tile found
				columnWidth = '.lab-grid-item.tile-1x1';
			}

			// Initialize Isotope with masonry layout
			grid = new Isotope(gridElement, {
				itemSelector: '.lab-grid-item',
				layoutMode: 'masonry',
				masonry: {
					columnWidth: columnWidth
				},
				transitionDuration: '0.3s',
				percentPosition: true
			});
			
			// Force layout recalculation after images load and layout settles
			requestAnimationFrame(function() {
				setTimeout(function() {
					if (grid) {
						grid.layout();
					}
				}, 150);
			});

			console.log('✓ Isotope grid initialized successfully with', items.length, 'items');

			// After initialization, fade in items with GSAP staggered animation (only on initial load)
			if (typeof gsap !== 'undefined') {
				// Get visible items (those that pass the filter)
				const visibleItems = Array.from(items).filter(item => {
					return shouldShowItem(item);
				});
				
				// Only animate if items are still at opacity 0 (initial load)
				const itemsToAnimate = visibleItems.filter(item => {
					const style = window.getComputedStyle(item);
					return parseFloat(style.opacity) === 0;
				});
				
				if (itemsToAnimate.length > 0) {
					// Ensure pointer events are enabled before animating
					itemsToAnimate.forEach(item => {
						item.style.pointerEvents = 'auto';
					});
					
					// Set initial state for enhanced animation
					gsap.set(itemsToAnimate, {
						opacity: 0,
						scale: 0.95,
						y: 10
					});
					
					// Animate with scale, translateY, and fade for polished effect
					gsap.to(itemsToAnimate, {
						opacity: 1,
						scale: 1,
						y: 0,
						duration: 0.6,
						stagger: 0.03,
						ease: 'power2.out'
					});
				}
				
				// Ensure all visible items have pointer events enabled
				visibleItems.forEach(item => {
					item.style.pointerEvents = 'auto';
				});
			} else {
				// Fallback if GSAP not available
				items.forEach(item => {
					if (shouldShowItem(item)) {
						item.style.opacity = '1';
						item.style.pointerEvents = 'auto';
					} else {
						item.style.opacity = '0';
						item.style.pointerEvents = 'none';
					}
				});
			}

			isInitializing = false;

		} catch (error) {
			console.error('✗ Error initializing Isotope grid:', error);
			console.error('Error message:', error.message);
			if (error.stack) {
				console.error('Stack trace:', error.stack);
			}
			isInitializing = false;
		}
	}

	// Apply filters using Isotope's arrange method
	function applyFilters() {
		// Clear any pending filter timeout
		if (filterTimeout) {
			clearTimeout(filterTimeout);
			filterTimeout = null;
		}

		// Debounce filter application to prevent rapid-fire updates
		filterTimeout = setTimeout(function() {
			if (!grid) {
				// Grid not initialized yet - apply basic visibility filtering
				// Use opacity only (not display) so Isotope can still measure items for layout
				const items = gridElement.querySelectorAll('.lab-grid-item');
				items.forEach(function(item) {
					const shouldShow = shouldShowItem(item);
					if (shouldShow) {
						item.style.opacity = '1';
						item.style.pointerEvents = 'auto';
					} else {
						item.style.opacity = '0';
						item.style.pointerEvents = 'none';
					}
				});
				updateURLParams();
				filterTimeout = null;
				return;
			}

			// Use Isotope's arrange method with filter function
			try {
				// Get ALL items from DOM (not just grid.items) to ensure we process everything
				const allItems = Array.from(gridElement.querySelectorAll('.lab-grid-item'));
				
				// Store current visibility state before applying filters
				const visibilityMap = new Map();
				allItems.forEach(function(elem) {
					const shouldShow = shouldShowItem(elem);
					visibilityMap.set(elem, shouldShow);
				});
				
				grid.arrange({
					filter: function(itemElem) {
						return shouldShowItem(itemElem);
					}
				});

				// Wait for Isotope's layout to complete, then ensure visibility state with animations
				grid.once('layoutComplete', function() {
					if (!grid) return;
					
					// Process ALL items from DOM (not just grid.items)
					const itemsToShow = [];
					const itemsToHide = [];
					
					allItems.forEach(function(elem) {
						const shouldShow = shouldShowItem(elem);
						const wasVisible = visibilityMap.get(elem);
						
						if (shouldShow) {
							// Item should be visible
							itemsToShow.push(elem);
							elem.style.pointerEvents = 'auto';
							// Remove any display:none that might interfere
							if (elem.style.display === 'none') {
								elem.style.display = '';
							}
						} else {
							// Item should be hidden
							itemsToHide.push(elem);
							elem.style.pointerEvents = 'none';
						}
					});
					
					// Animate visibility changes with GSAP if available
					if (typeof gsap !== 'undefined') {
						// Fade in items that should be visible
						if (itemsToShow.length > 0) {
							gsap.to(itemsToShow, {
								opacity: 1,
								duration: 0.3,
								ease: 'power2.out',
								onComplete: function() {
									itemsToShow.forEach(function(elem) {
										elem.style.opacity = '1';
									});
								}
							});
						}
						
						// Fade out items that should be hidden
						if (itemsToHide.length > 0) {
							gsap.to(itemsToHide, {
								opacity: 0,
								duration: 0.3,
								ease: 'power2.in',
								onComplete: function() {
									itemsToHide.forEach(function(elem) {
										elem.style.opacity = '0';
									});
								}
							});
						}
					} else {
						// Fallback without GSAP
						itemsToShow.forEach(function(elem) {
							elem.style.opacity = '1';
						});
						itemsToHide.forEach(function(elem) {
							elem.style.opacity = '0';
						});
					}
				});
			} catch (error) {
				console.error('Error applying filters:', error);
			}

			// Update URL parameters
			updateURLParams();
			
			filterTimeout = null;
		}, 50);
	}

	// Update URL parameters for filter state
	function updateURLParams() {
		const params = new URLSearchParams();
		
		if (searchQuery) {
			params.set('search', searchQuery);
		}
		
		if (activeTags.size > 0 && !activeTags.has('all')) {
			params.set('tags', Array.from(activeTags).join(','));
		}
		
		const newURL = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
		window.history.replaceState({}, '', newURL);
	}

	// Restore filter state from URL and page data
	function restoreFilterState() {
		const params = new URLSearchParams(window.location.search);
		
		// Check for page-level filter tag (from type route pages)
		const labHome = document.querySelector('.lab-home');
		const pageFilterTag = labHome ? labHome.getAttribute('data-filter-tag') : null;
		
		// Restore search
		const searchParam = params.get('search');
		if (searchParam) {
			searchQuery = searchParam;
			const searchInput = document.getElementById('lab-search-input');
			if (searchInput) {
				searchInput.value = searchQuery;
			}
		}
		
		// Restore tags - prioritize page filter tag over URL params
		if (pageFilterTag) {
			// Page has a filter tag, use it
			activeTags.clear();
			activeTags.add(pageFilterTag.toLowerCase());
			
			// Update button states
			document.querySelectorAll('.lab-filters__tag-btn').forEach(btn => {
				btn.classList.remove('active');
				const btnTag = btn.getAttribute('data-tag');
				if (btnTag.toLowerCase() === pageFilterTag.toLowerCase()) {
					btn.classList.add('active');
				}
			});
		} else {
			// Use URL params or default to "all"
			const tagsParam = params.get('tags');
			if (tagsParam) {
				const tags = tagsParam.split(',').map(tag => tag.trim());
				tags.forEach(tag => {
					if (tag) {
						activeTags.add(tag.toLowerCase());
					}
				});
				
				// Update button states
				document.querySelectorAll('.lab-filters__tag-btn').forEach(btn => {
					const btnTag = btn.getAttribute('data-tag');
					if (activeTags.has(btnTag.toLowerCase())) {
						btn.classList.add('active');
					}
				});
			} else {
				// Default to "all"
				activeTags.add('all');
				const allBtn = document.querySelector('.lab-filters__tag-btn[data-tag="all"]');
				if (allBtn) {
					allBtn.classList.add('active');
				}
			}
		}
	}

	// Search input handler
	function setupSearch() {
		const searchInput = document.getElementById('lab-search-input');
		if (!searchInput) return;

		let searchTimeout;
		searchInput.addEventListener('input', function(e) {
			clearTimeout(searchTimeout);
			searchTimeout = setTimeout(function() {
				searchQuery = e.target.value.trim();
				applyFilters();
			}, 200);
		});
	}

	// Tag filter button handlers
	function setupTagFilters() {
		const tagButtons = document.querySelectorAll('.lab-filters__tag-btn');
		
		tagButtons.forEach(btn => {
			btn.addEventListener('click', function() {
				const tag = this.getAttribute('data-tag');
				
				if (tag === 'all') {
					// Toggle "all" - if active, do nothing; if inactive, activate only "all"
					if (activeTags.has('all')) {
						// Already active, do nothing
						return;
					} else {
						// Activate "all" and deactivate others
						activeTags.clear();
						activeTags.add('all');
						tagButtons.forEach(b => b.classList.remove('active'));
						this.classList.add('active');
					}
				} else {
					// Toggle specific tag
					const tagLower = tag.toLowerCase();
					
					// Remove "all" if it's active
					if (activeTags.has('all')) {
						activeTags.delete('all');
						const allBtn = document.querySelector('.lab-filters__tag-btn[data-tag="all"]');
						if (allBtn) {
							allBtn.classList.remove('active');
						}
					}
					
					// Toggle the clicked tag
					if (activeTags.has(tagLower)) {
						activeTags.delete(tagLower);
						this.classList.remove('active');
					} else {
						activeTags.add(tagLower);
						this.classList.add('active');
					}
					
					// If no tags active, activate "all"
					if (activeTags.size === 0) {
						activeTags.add('all');
						const allBtn = document.querySelector('.lab-filters__tag-btn[data-tag="all"]');
						if (allBtn) {
							allBtn.classList.add('active');
						}
					}
				}
				
				// Apply filters after tag change
				applyFilters();
			});
		});
	}

	// Clear filters handler
	function setupClearFilters() {
		const clearBtn = document.getElementById('lab-clear-filters');
		if (!clearBtn) return;

		clearBtn.addEventListener('click', function() {
			// Clear search
			searchQuery = '';
			const searchInput = document.getElementById('lab-search-input');
			if (searchInput) {
				searchInput.value = '';
			}
			
			// Clear tags
			activeTags.clear();
			activeTags.add('all');
			
			// Update button states
			document.querySelectorAll('.lab-filters__tag-btn').forEach(btn => {
				btn.classList.remove('active');
			});
			const allBtn = document.querySelector('.lab-filters__tag-btn[data-tag="all"]');
			if (allBtn) {
				allBtn.classList.add('active');
			}
			
			applyFilters();
		});
	}

	// Helper function to refresh grid layout
	function refreshGridLayout() {
		if (!grid) return;
		
		// Recalculate layout
		grid.layout();
	}

	// Handle window resize
	let resizeTimeout;
	window.addEventListener('resize', function() {
		if (!grid || isInitializing) return;
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(function() {
			refreshGridLayout();
		}, 200);
	});

	// Initialize on page load
	function init() {
		// Setup filter handlers first (they need to be ready)
		setupSearch();
		setupTagFilters();
		setupClearFilters();
		
		// Restore filter state from URL
		restoreFilterState();
		
		// Apply initial filters before grid init (for immediate feedback)
		applyFilters();
		
		// Wait for everything to be ready, then initialize grid
		waitForReady(function() {
			initGrid();
			
			// Apply filters after grid is initialized (with a small delay for layout to settle)
			requestAnimationFrame(function() {
				setTimeout(function() {
					applyFilters();
				}, 200);
			});
		});
	}

	// Initialize when DOM is ready
	// Use a small delay to ensure all scripts are loaded
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function() {
			setTimeout(init, 50);
		});
	} else {
		setTimeout(init, 50);
	}

	// Reinitialize grid after GSAP page transitions
	if (window.LabTransitions) {
		const originalTransitionTo = window.LabTransitions.transitionTo;
		window.LabTransitions.transitionTo = function(url) {
			// Destroy grid before transition
			if (grid) {
				grid.destroy();
				grid = null;
			}
			// Call original transition
			if (originalTransitionTo) {
				originalTransitionTo(url);
			}
		};
	}

	// Reinitialize on popstate (browser back/forward)
	window.addEventListener('popstate', function() {
		// Use requestAnimationFrame for better performance
		requestAnimationFrame(function() {
			const gridEl = document.getElementById('lab-grid');
			if (gridEl) {
				// Destroy existing grid if it exists
				if (grid) {
					try {
						grid.destroy();
					} catch (e) {
						// Ignore destroy errors
					}
					grid = null;
				}
				
				// Reset initialization flag
				isInitializing = false;
				
				// Restore filter state
				restoreFilterState();
				
				// Reinitialize grid
				waitForReady(function() {
					initGrid();
					if (grid) {
						// Apply filters after grid is ready
						requestAnimationFrame(function() {
							setTimeout(function() {
								applyFilters();
							}, 150);
						});
					}
				});
			}
		});
	});

	// Export for debugging
	window.LabGrid = {
		grid: function() { return grid; },
		refresh: function() {
			refreshGridLayout();
		},
		applyFilters: applyFilters
	};

})();
