import { labelPoster, prefersPoster } from './capabilities.js';

const root = document.querySelector('#globe');
if (!(root instanceof HTMLElement)) {
  throw new Error('Demo is missing #globe');
}

// The poster is already in the page. Download the globe only for a fine
// pointer that can hover, and only once the frame is near the viewport.
// Another section passes its own photos: initGlobe(root, { images: [...] })
// or globe.setImages([...]) after this one is up.
if (prefersPoster()) {
  labelPoster(root);
} else {
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    import('./globe.js')
      .then(({ initGlobe }) => {
        const globe = initGlobe(root);
        window.addEventListener('pagehide', () => globe.destroy());
      })
      .catch(() => {
        labelPoster(root);
      });
  }, { rootMargin: '400px' });
  observer.observe(root);
}
