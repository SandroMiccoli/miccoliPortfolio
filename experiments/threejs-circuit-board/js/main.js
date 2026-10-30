import { mountCircuitBoard } from './circuit-board.js';
import { mountLookPanel } from './look-panel.js';

const stage = document.querySelector('#stage');
if (!(stage instanceof HTMLElement)) {
	throw new Error('Demo is missing its stage');
}

const study = mountCircuitBoard(stage, { zoom: true });
const panel = mountLookPanel(stage, {
	getLook: () => study.getLook(),
	setLook(next) {
		const look = study.setLook(next);
		document.body.style.background = look.system.background;
		return look;
	},
});

window.addEventListener('keydown', (event) => {
	if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
	if (event.key.toLowerCase() === 'r') study.resetView();
});

window.boardStudy = study;
window.addEventListener('pagehide', () => {
	panel.destroy();
	study.destroy();
});
