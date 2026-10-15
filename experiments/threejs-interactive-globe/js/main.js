import { mountGlobe } from './globe.js';

const root = document.querySelector('#globe');
if (!(root instanceof HTMLElement)) {
  throw new Error('Demo is missing #globe');
}

const globe = mountGlobe(root);
window.addEventListener('pagehide', () => globe.destroy());
