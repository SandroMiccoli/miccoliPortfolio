import { mountCircuitBoard } from './circuit-board.js';

const stage = document.querySelector('#stage');
if (!(stage instanceof HTMLElement)) {
	throw new Error('Demo is missing its stage');
}

const study = mountCircuitBoard(stage, { zoom: true });

window.addEventListener('keydown', (event) => {
	if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
	if (event.key.toLowerCase() === 'r') study.resetView();
});

window.boardStudy = study;
window.addEventListener('pagehide', () => study.destroy());
