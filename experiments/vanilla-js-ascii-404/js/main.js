import { loadSettings } from './config.js';
import { mountGui } from './gui.js';
import { mountArtwork } from './renderer.js';

const canvas = document.querySelector('#artwork');
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('Demo is missing #artwork');
}

const settings = loadSettings();
const artwork = mountArtwork(canvas, settings);
const gui = mountGui(settings);

window.addEventListener('pagehide', () => {
  artwork.destroy();
  gui.destroy();
});
