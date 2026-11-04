//
//
// Board JS
//
//



(function ($) {
	'use strict';



	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - Navigation

	// Global vars
	var navTarget = $('body').attr('data-page-url');
	var docTitle = document.title;
	var History = window.History;
	var videoObserver = null;

	// State change event
	History.Adapter.bind(window,'statechange',function(){
		var state = History.getState();
		// console.log(state);

		// Loading state
		$('body').addClass('loading');

		// Load the page
		$('.page-loader').load( state.hash + ' .page__content', function() {

			// Scroll to top
			$( 'body, html' ).animate({
				scrollTop: 0
			}, 300);

			// Find transition time
			var transitionTime = 400;

			// After current content fades out
			setTimeout( function() {

				// Remove old content
				$('.page .page__content').remove();

				// Append new content
				$('.page-loader .page__content').appendTo('.page');

				// Set page URL
				$('body').attr('data-page-url', window.location.pathname);

				// Update navTarget
				navTarget = $('body').attr('data-page-url');

				// Set page title
				docTitle = $('.page__content').attr('data-page-title');
				document.title = docTitle;

				// Run page functions
				pageFunctions();

			}, transitionTime);

		});

	});


	// On clicking a link

	if ( $('body').hasClass('ajax-loading') ) {

		$(document).on('click', 'a', function (event){

			// Don't follow link
			event.preventDefault();

			// Get the link target
			var thisTarget = $(this).attr('href');

			// If we don't want to use ajax, or the link is an anchor/mailto/tel
			if ($(this).hasClass('js-no-ajax') || thisTarget.indexOf('#') >= 0 || thisTarget.indexOf('mailto:') >= 0 || thisTarget.indexOf('tel:') >= 0) {

				// Use the given link
				window.location = thisTarget;
			}

			// If link is handled by some JS action – e.g. fluidbox
			else if ( $(this).is('.gallery__item__link') ) {
				
				// Let JS handle it
			}

			// If link is external
			else if ( thisTarget.indexOf('http') >= 0 ) {

				// Go to the external link
				window.open(thisTarget, '_blank', 'noopener,noreferrer');

			}

			// If link is internal
			else {

				// Change navTarget
				navTarget = thisTarget;
				
				// Switch the URL via History
				History.pushState(null, docTitle, thisTarget);
			}

		});
		
	}



	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - Page load

	function pageFunctions() {


		// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - Show content

		// Show the page as soon as the first image is ready, or after a short
		// timeout. Images reserve their space through width/height, so late
		// images no longer shift the layout.
		var contentShown = false;

		function showContent() {
			if ( contentShown ) {
				return;
			}
			contentShown = true;

			// Show the content
			$('body').removeClass('loading');

			// Hide the menu
			setMenuOpen(false);
		}

		// Portfolio grid layout
		var $listing = $('.listing-wrap');

		if ( $listing.length ) {
			var listingFrame = null;

			$listing.masonry({
				itemSelector: '.listing-item',
				transitionDuration: 0
			});

			// Re-layout while lazy images arrive (no-op when sizes are already known)
			$listing.imagesLoaded().progress( function() {
				if ( listingFrame === null ) {
					listingFrame = window.requestAnimationFrame( function() {
						listingFrame = null;
						$listing.masonry('layout');
					});
				}
			});
		}

		$('.page__content').find('img:first').imagesLoaded( showContent );
		window.setTimeout( showContent, 700 );



		// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - Active links

		// Switch active link states
		$('.active-link').removeClass('active-link');

		$('a[href="' + navTarget + '"]').addClass('active-link');



		// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - Galleries

		// Destroy all existing waypoints
		Waypoint.destroyAll();

		// Set up count for galleries to give them unique IDs
		var galleryCount = 0;

		// If there's a gallery
		$('.gallery').each( function() {

			// Get gallery element
			var $this = $(this);

			// Add ID via count
			galleryCount++;
			var thisId = 'gallery-' + galleryCount;
			$this.attr('id', thisId);

			// Gallery columns
			var galleryCols = $this.attr('data-columns');

			// Set up gallery container
			$this.append('<div class="gallery__wrap"></div>');

			// Add images to container
			$this.children('img, picture').each( function() {
				$(this).appendTo('#' + thisId + ' .gallery__wrap');
			});

			// Wrap images. Zoom target: large derivative (data-zoom) when available, else the image itself
			$this.find('.gallery__wrap > img, .gallery__wrap > picture').each( function() {
				var $img = $(this).is('img') ? $(this) : $(this).find('img').first();
				var imageSrc = $img.attr('data-zoom') || $img.attr('src');
				$(this).wrapAll('<div class="gallery__item"><a href="' + imageSrc + '" class="gallery__item__link"></div></div>').appendTo();
			});

			// Set up the gallery (carousel or masonry grid)
			var initGallery = function() {

				// If it's a single column gallery
				if ( galleryCols === '1' ) {

					// Add carousel class to gallery
					$this.addClass('gallery--carousel');

					// Add owl styles to gallery wrap
					$this.children('.gallery__wrap').addClass('owl-carousel');

					// Use carousel
					$this.children('.gallery__wrap').owlCarousel({
						items: 1,
						loop: true,
						mouseDrag: false,
						touchDrag: true,
						pullDrag: false,
						dots: true,
						autoplay: false,
						autoplayTimeout: 6000,
						autoHeight: true,
						animateOut: 'fadeOut'
					});

					// When scrolling over the bottom
					var waypoint1 = new Waypoint({
						element: document.getElementById(thisId),
						handler: function(direction) {

							if ( direction === 'down') {

								// console.log('pause');
							
								// Pause this carousel
								$this.children('.gallery__wrap').trigger('stop.owl.autoplay');
							}

							if ( direction === 'up') {

								// console.log('play');
								
								// Play this carousel
								$this.children('.gallery__wrap').trigger('play.owl.autoplay');
							}
						},
						offset: '-100%'
					});

					// When scrolling over the top
					var waypoint2 = new Waypoint({
						element: document.getElementById(thisId),
						handler: function(direction) {

							if ( direction === 'down') {

								// console.log('play');
								
								// Play this carousel
								$this.children('.gallery__wrap').trigger('play.owl.autoplay');
							}

							if ( direction === 'up') {

								// console.log('pause');
							
								// Pause this carousel
								$this.children('.gallery__wrap').trigger('stop.owl.autoplay');
							}
						},
						offset: '100%'
					});

				}

				else {

					$this.addClass('gallery--grid');

					// Use masonry layout
					$this.children('.gallery__wrap').masonry({
						itemSelector: '.gallery__item',
						transitionDuration: 0
					});
							
					// Init fluidbox
					// SHOW CAPTION
					$this.find('.gallery__item__link').on('openend.fluidbox',function(){
						console.log("OPEN END");
						var $img = $(this).find('img');
						$('body').find('.caption')
							.addClass('visible')
							.text($img.attr('title'))
					}).on('closestart.fluidbox',function(){
						$('body').find('.caption')
							.removeClass('visible')
					}).fluidbox({
						loader: true
					});

				}

				// Show gallery once initialized
				$this.addClass('gallery--on');
			};

			// Images with width/height reserve their space, so there is no need
			// to wait for downloads (lazy images below the fold would block it)
			var allSized = $this.find('img').toArray().every( function(img) {
				return img.getAttribute('width') && img.getAttribute('height');
			});

			if ( allSized ) {
				initGallery();
			}

			else {
				$this.imagesLoaded( initGallery );
			}

		});



		// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - Images

		// kramdown leaves a lone <picture> (img.html include) outside a <p>
		$('.single > picture').each( function() {
			$(this).wrapAll('<div class="image-wrap"></div>');
		});

		$('.single p > img, .single p > picture').each( function() {
			var thisP = $(this).parent('p');
			$(this).insertAfter(thisP);
			$(this).wrapAll('<div class="image-wrap"></div>');
			thisP.remove();
		});



		// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - Videos

		// Autoplaying videos only load and play while visible
		if ( videoObserver ) {
			videoObserver.disconnect();
			videoObserver = null;
		}

		var $visibleVideos = $('video[data-autoplay-visible]');

		if ( $visibleVideos.length && 'IntersectionObserver' in window ) {
			videoObserver = new IntersectionObserver( function(entries) {
				entries.forEach( function(entry) {
					if ( entry.isIntersecting ) {
						var playing = entry.target.play();
						if ( playing && playing.catch ) {
							playing.catch( function() {} );
						}
					}
					else {
						entry.target.pause();
					}
				});
			}, { rootMargin: '200px' });

			$visibleVideos.each( function() {
				videoObserver.observe(this);
			});
		}


		// For each iframe
		$('.single iframe').each( function() {

			// If it's YouTube or Vimeo
			if ( $(this).attr('src').indexOf('youtube') >= 0 || $(this).attr('src').indexOf('vimeo') >= 0 ) {

				var width = $(this).attr('width');
				var height = $(this).attr('height');
				var ratio = (height/width)*100;

				// Wrap in video container
				$(this).wrapAll('<div class="video-wrap"><div class="video" style="padding-bottom:' + ratio + '%;"></div></div>');

			}

		});



		// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - Tables

		$('.single table').each(function () {
			$(this).wrapAll('<div class="table-wrap"></div>');
		});

	}

	// Run functions on load
	pageFunctions();


	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - Menu

	function setMenuOpen(isOpen) {
		$('body').toggleClass('menu--open', isOpen);
		$('.js-menu-toggle').attr('aria-expanded', isOpen ? 'true' : 'false');
	}

	$(document).on('click', '.js-menu-toggle', function (){
		setMenuOpen( !$('body').hasClass('menu--open') );
	});

	$(document).on('keydown', function (e) {
		if ( e.key === 'Escape' && $('body').hasClass('menu--open') ) {
			setMenuOpen(false);
			$('.js-menu-toggle:visible').trigger('focus');
		}
	});

	$(document).on('click', '.menu__list__item__link', function (){

		// If menu is open when you click a link on mobile
		if ( $('.menu').hasClass('menu--open') ) {
			$('.menu').removeClass('menu--open');
		}
	});



	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - Contact Form

	// Override the submit event
	$(document).on('submit', '#contact-form', function (e) {

		// Clear previous classes
		$('.contact-form__item--error').removeClass('contact-form__item--error');

		// Get form elements
		var emailField = $('.contact-form__input[name="email"]');
		var nameField = $('.contact-form__input[name="name"]');
		var messageField = $('.contact-form__textarea[name="message"]');
		var gotchaField = $('.contact-form__gotcha');

		// Validate email
		if ( emailField.val() === '' ) {
			emailField.closest('.contact-form__item').addClass('contact-form__item--error');
		}

		// Validate name
		if ( nameField.val() === '' ) {
			nameField.closest('.contact-form__item').addClass('contact-form__item--error');
		}

		// Validate message
		if ( messageField.val() === '' ) {
			messageField.closest('.contact-form__item').addClass('contact-form__item--error');
		}

		// If all fields are filled, except gotcha
		if ( emailField.val() !== '' && nameField.val() !== '' && messageField.val() !== '' && gotchaField.val().length === 0 ) {

			// Submit the form!
		}

		else {

			// Stop submission
			e.preventDefault();
		}

	});
	
	
	
}(jQuery));