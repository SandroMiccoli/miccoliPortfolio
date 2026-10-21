import { loadSettings } from './config.js';
import { mountAscii404 } from './ascii-404.js';
import { mountGui } from './gui.js';

const root = document.querySelector('#ascii-404');
if (!(root instanceof HTMLElement)) {
  throw new Error('Demo is missing #ascii-404');
}

const perf = document.querySelector('#perf');
const field = mountAscii404(root, {
  ...loadSettings(),
  onPaint(sample) {
    if (!(perf instanceof HTMLElement)) return;
    const next = sample.ms === 0
      ? '0 fps'
      : `${sample.fps} fps · ${sample.ms.toFixed(1)} ms`;
    if (perf.textContent !== next) perf.textContent = next;
  },
});
const gui = mountGui(field.settings);

window.addEventListener('pagehide', () => {
  field.destroy();
  gui.destroy();
});
