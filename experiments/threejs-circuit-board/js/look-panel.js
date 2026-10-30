import {
	BLOOM_LIMITS,
	DEFAULT_LOOK,
	LOOK_SECTIONS,
	cloneLook,
	parseLook,
	serializeLook,
	toHex,
} from './look.js';

const FILE_NAME = 'circuit-board-look.json';
const MAX_FILE = 100000;

/**
 * Lab control for colors and bloom.
 * `stage` is the study element. Pointer events stay on the panel.
 *
 * @param {HTMLElement} stage
 * @param {{ getLook: () => object, setLook: (look: object) => object }} study
 */
export function mountLookPanel(stage, study) {
	const events = new AbortController();
	const { signal } = events;
	let draft = study.getLook();
	let open = window.matchMedia('(min-width: 800px)').matches;

	const root = document.createElement('div');
	root.className = 'look';
	if (stage.closest('.lab-experiment-demo')) root.classList.add('look--lab');

	const toggle = document.createElement('button');
	toggle.type = 'button';
	toggle.className = 'look-toggle';
	toggle.textContent = 'Colors';

	const panel = document.createElement('section');
	panel.id = 'look-panel';
	panel.className = 'look-panel';
	panel.setAttribute('aria-labelledby', 'look-title');
	toggle.setAttribute('aria-controls', 'look-panel');
	toggle.setAttribute('aria-expanded', 'false');

	const head = document.createElement('div');
	head.className = 'look-head';
	const title = document.createElement('h2');
	title.id = 'look-title';
	title.className = 'look-title';
	title.textContent = 'Colors';
	const close = document.createElement('button');
	close.type = 'button';
	close.className = 'look-close';
	close.textContent = 'Close';
	head.append(title, close);

	const intro = document.createElement('p');
	intro.className = 'look-intro';
	intro.textContent = 'Set the colors and the bloom. Export writes circuit-board-look.json for the team to save as the default.';

	const actions = document.createElement('div');
	actions.className = 'look-actions';
	const reset = button('Reset', 'look-button');
	const load = button('Load', 'look-button');
	const copy = button('Copy', 'look-button');
	const download = button('Download', 'look-button look-button--primary');
	actions.append(reset, load, copy, download);

	const file = document.createElement('input');
	file.type = 'file';
	file.accept = 'application/json,.json';
	file.hidden = true;
	file.tabIndex = -1;
	file.setAttribute('aria-hidden', 'true');

	const status = document.createElement('p');
	status.className = 'look-status';
	status.setAttribute('role', 'status');
	status.setAttribute('aria-live', 'polite');

	const body = document.createElement('div');
	body.className = 'look-body';

	for (const section of LOOK_SECTIONS) {
		const block = document.createElement('section');
		block.className = 'look-section';
		const heading = document.createElement('h3');
		heading.className = 'look-section__title';
		heading.textContent = section.title;
		const hint = document.createElement('p');
		hint.className = 'look-hint';
		hint.textContent = section.hint;
		block.append(heading, hint);
		if (section.sliders) {
			for (const slider of section.sliders) {
				block.append(sliderRow(section.id, slider));
			}
		}
		if (section.colors) {
			for (const color of section.colors) {
				block.append(colorRow(section.id, color));
			}
		}
		body.append(block);
	}

	panel.append(head, intro, actions, status, body, file);
	root.append(toggle, panel);
	stage.append(root);

	function stop(event) {
		event.stopPropagation();
	}
	for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'wheel', 'click', 'dblclick']) {
		root.addEventListener(type, stop, { signal });
	}

	toggle.addEventListener('click', () => {
		open = true;
		syncOpen();
		close.focus();
	}, { signal });
	close.addEventListener('click', () => {
		open = false;
		syncOpen();
		toggle.focus();
	}, { signal });

	reset.addEventListener('click', () => {
		draft = cloneLook(DEFAULT_LOOK);
		publish();
		fill();
		note('Defaults restored.');
	}, { signal });
	load.addEventListener('click', () => file.click(), { signal });
	file.addEventListener('change', () => {
		const picked = file.files && file.files[0];
		file.value = '';
		if (!picked) return;
		if (picked.size > MAX_FILE) {
			note('That file is not a look.');
			return;
		}
		picked.text().then((text) => {
			try {
				draft = parseLook(text);
			} catch (err) {
				note('That file is not a look.');
				return;
			}
			publish();
			fill();
			note('Look loaded.');
		}).catch(() => {
			note('That file is not a look.');
		});
	}, { signal });
	copy.addEventListener('click', () => {
		const text = serializeLook(draft);
		copyText(text).then((ok) => {
			note(ok
				? 'Copied.'
				: 'Copy is blocked in this browser. Download the file instead.');
		});
	}, { signal });
	download.addEventListener('click', () => {
		saveFile(serializeLook(draft));
		note('Download started.');
	}, { signal });

	body.addEventListener('input', onEdit, { signal });
	body.addEventListener('change', onEdit, { signal });

	fill();
	syncOpen();

	function onEdit(event) {
		const target = event.target;
		if (!(target instanceof HTMLInputElement)) return;
		const ink = target.getAttribute('data-ink');
		const channel = target.getAttribute('data-channel');
		if (ink && target.type === 'color') {
			setInk(ink, target.value);
			const hex = root.querySelector(`[data-hex="${ink}"]`);
			if (hex instanceof HTMLInputElement) {
				hex.value = target.value;
				hex.removeAttribute('aria-invalid');
			}
			return;
		}
		if (ink && target.type === 'text') {
			const next = toHex(target.value);
			if (!next) {
				if (event.type === 'change') {
					target.value = readInk(ink);
					target.removeAttribute('aria-invalid');
				} else if (target.value.trim().length >= 7) {
					target.setAttribute('aria-invalid', 'true');
				}
				return;
			}
			target.value = next;
			target.removeAttribute('aria-invalid');
			const swatch = root.querySelector(`[data-swatch="${ink}"]`);
			if (swatch instanceof HTMLInputElement) swatch.value = next;
			setInk(ink, next);
			return;
		}
		if (channel && target.type === 'range') {
			const value = Number(target.value);
			draft.bloom[channel] = value;
			const out = root.querySelector(`[data-value="${channel}"]`);
			if (out) out.textContent = value.toFixed(2);
			publish();
		}
	}

	function setInk(ink, hex) {
		const dot = ink.indexOf('.');
		draft[ink.slice(0, dot)][ink.slice(dot + 1)] = hex;
		publish();
	}

	function readInk(ink) {
		const dot = ink.indexOf('.');
		return draft[ink.slice(0, dot)][ink.slice(dot + 1)];
	}

	function publish() {
		draft = study.setLook(draft);
	}

	function fill() {
		for (const section of LOOK_SECTIONS) {
			if (section.sliders) {
				for (const slider of section.sliders) {
					const value = draft.bloom[slider.key];
					const range = root.querySelector(`#look-${section.id}-${slider.key}`);
					const out = root.querySelector(`[data-value="${slider.key}"]`);
					if (range instanceof HTMLInputElement) range.value = String(value);
					if (out) out.textContent = Number(value).toFixed(2);
				}
			}
			if (section.colors) {
				for (const color of section.colors) {
					const ink = `${section.id}.${color.key}`;
					const hex = draft[section.id][color.key];
					const swatch = root.querySelector(`[data-swatch="${ink}"]`);
					const field = root.querySelector(`[data-hex="${ink}"]`);
					if (swatch instanceof HTMLInputElement) swatch.value = hex;
					if (field instanceof HTMLInputElement) {
						field.value = hex;
						field.removeAttribute('aria-invalid');
					}
				}
			}
		}
	}

	function syncOpen() {
		toggle.hidden = open;
		toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
		panel.hidden = !open;
	}

	function note(message) {
		status.textContent = message;
	}

	return {
		destroy() {
			events.abort();
			root.remove();
		},
	};
}

function button(label, className) {
	const node = document.createElement('button');
	node.type = 'button';
	node.className = className;
	node.textContent = label;
	return node;
}

function sliderRow(group, slider) {
	const limit = BLOOM_LIMITS[slider.key];
	const id = `look-${group}-${slider.key}`;
	const label = document.createElement('label');
	label.className = 'look-slider';
	label.htmlFor = id;
	const name = document.createElement('span');
	name.textContent = slider.label;
	const out = document.createElement('output');
	out.htmlFor = id;
	out.setAttribute('data-value', slider.key);
	const input = document.createElement('input');
	input.id = id;
	input.type = 'range';
	input.min = String(limit.min);
	input.max = String(limit.max);
	input.step = String(limit.step);
	input.setAttribute('data-channel', slider.key);
	label.append(name, out, input);
	return label;
}

function colorRow(group, color) {
	const ink = `${group}.${color.key}`;
	const id = `look-${group}-${color.key}`;
	const row = document.createElement('div');
	row.className = 'look-row';
	const label = document.createElement('label');
	label.htmlFor = id;
	label.textContent = color.label;
	const swatch = document.createElement('input');
	swatch.id = id;
	swatch.className = 'look-swatch';
	swatch.type = 'color';
	swatch.setAttribute('data-ink', ink);
	swatch.setAttribute('data-swatch', ink);
	const hex = document.createElement('input');
	hex.className = 'look-hex';
	hex.type = 'text';
	hex.spellcheck = false;
	hex.autocomplete = 'off';
	hex.maxLength = 9;
	hex.setAttribute('aria-label', `${color.label} hex`);
	hex.setAttribute('data-ink', ink);
	hex.setAttribute('data-hex', ink);
	row.append(label, swatch, hex);
	return row;
}

function saveFile(text) {
	const blob = new Blob([text], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = FILE_NAME;
	link.hidden = true;
	document.body.append(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

async function copyText(text) {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch (err) {
		try {
			const area = document.createElement('textarea');
			area.value = text;
			area.setAttribute('readonly', '');
			area.style.position = 'fixed';
			area.style.left = '-999px';
			document.body.append(area);
			area.select();
			const ok = document.execCommand('copy');
			area.remove();
			return ok;
		} catch (copyErr) {
			return false;
		}
	}
}
