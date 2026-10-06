import { mountAsciiStack } from './ascii-stack.js';

const root = document.querySelector('#ascii-stack');
if (!(root instanceof HTMLElement)) {
  throw new Error('Demo is missing #ascii-stack');
}

const app = mountAsciiStack(root);
window.addEventListener('pagehide', () => app.destroy());
