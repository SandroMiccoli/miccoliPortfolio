(function (root) {
	const GENERATORS = [
		{ id: 'waves', label: 'Waves' },
		{ id: 'noise', label: 'Noise' },
		{ id: 'shader', label: 'Shader' }
	];

	const PARAMS = {
		waves: [
			{ key: 'frequency', label: 'Frequency', min: 1, max: 24, step: 0.1 },
			{ key: 'amplitude', label: 'Amplitude', min: 0, max: 1, step: 0.01 },
			{ key: 'speed', label: 'Speed', min: -2, max: 2, step: 0.01 },
			{ key: 'direction', label: 'Direction', min: 0, max: 360, step: 1 },
			{ key: 'scale', label: 'Scale', min: 0.25, max: 4, step: 0.01 }
		],
		noise: [
			{ key: 'scale', label: 'Scale', min: 0.5, max: 12, step: 0.1 },
			{ key: 'speed', label: 'Speed', min: 0, max: 2, step: 0.01 },
			{ key: 'intensity', label: 'Intensity', min: 0, max: 1, step: 0.01 },
			{ key: 'hue', label: 'Hue', min: 0, max: 360, step: 1 }
		],
		shader: [
			{ key: 'speed', label: 'Speed', min: 0, max: 3, step: 0.01 },
			{ key: 'scale', label: 'Scale', min: 0.25, max: 6, step: 0.01 },
			{ key: 'distortion', label: 'Distortion', min: 0, max: 2, step: 0.01 },
			{ key: 'intensity', label: 'Intensity', min: 0, max: 1, step: 0.01 },
			{ key: 'hue', label: 'Hue', min: 0, max: 360, step: 1 }
		]
	};

	const BLENDS = [
		{ id: 'normal', label: 'Normal' },
		{ id: 'add', label: 'Add' },
		{ id: 'multiply', label: 'Multiply' },
		{ id: 'screen', label: 'Screen' }
	];

	function el(tag, className, text) {
		const node = document.createElement(tag);
		if (className) node.className = className;
		if (text != null) node.textContent = text;
		return node;
	}

	function formatValue(value, step) {
		if (Math.abs(step - 1) < 1e-6) return String(Math.round(value));
		const digits = step < 0.1 ? 2 : 1;
		return Number(value).toFixed(digits);
	}

	function mount(rootEl, options) {
		const getState = options.getState;
		const patch = options.patch;
		let lastGenerator = null;
		let dragging = false;

		rootEl.innerHTML = '';
		rootEl.appendChild(el('p', 'synth-panel__title', 'Visual Synth'));

		const genSection = el('section', 'synth-section');
		genSection.appendChild(el('h2', 'synth-section__label', 'Generator'));
		const genRow = el('div', 'synth-row');
		const genButtons = {};
		GENERATORS.forEach((gen) => {
			const btn = el('button', 'synth-btn', gen.label);
			btn.type = 'button';
			btn.addEventListener('click', function () {
				patch({ generator: gen.id });
			});
			genButtons[gen.id] = btn;
			genRow.appendChild(btn);
		});
		genSection.appendChild(genRow);
		rootEl.appendChild(genSection);

		const paramSection = el('section', 'synth-section');
		paramSection.appendChild(el('h2', 'synth-section__label', 'Parameters'));
		const paramFields = el('div', 'synth-params');
		paramSection.appendChild(paramFields);
		rootEl.appendChild(paramSection);

		const camSection = el('section', 'synth-section');
		camSection.appendChild(el('h2', 'synth-section__label', 'Camera'));
		const camToggle = el('button', 'synth-btn synth-toggle', 'OFF');
		camToggle.type = 'button';
		camToggle.addEventListener('click', function () {
			patch({ camera: { enabled: !getState().camera.enabled } });
		});
		camSection.appendChild(camToggle);
		rootEl.appendChild(camSection);

		const debugSection = el('section', 'synth-section');
		debugSection.appendChild(el('h2', 'synth-section__label', 'Debug'));
		const debugToggle = el('button', 'synth-btn synth-toggle', 'OFF');
		debugToggle.type = 'button';
		debugToggle.addEventListener('click', function () {
			const debug = getState().debug || {};
			patch({ debug: { enabled: !debug.enabled } });
		});
		debugSection.appendChild(debugToggle);
		const debugStats = el('div', 'synth-debug-stats');
		const fpsLine = el('p', 'synth-debug-stats__line', 'FPS —');
		const tempLine = el('p', 'synth-debug-stats__line', 'CPU —');
		debugStats.appendChild(fpsLine);
		debugStats.appendChild(tempLine);
		debugSection.appendChild(debugStats);
		rootEl.appendChild(debugSection);

		const blendSection = el('section', 'synth-section');
		blendSection.appendChild(el('h2', 'synth-section__label', 'Blend'));

		const opacityField = makeSlider('Opacity', 0, 1, 0.01, function (value) {
			patch({ camera: { opacity: value } });
		});
		const intensityField = makeSlider('Intensity', 0, 2, 0.01, function (value) {
			patch({ camera: { intensity: value } });
		});

		const blendWrap = el('label', 'synth-field');
		const blendTop = el('div', 'synth-field__top');
		blendTop.appendChild(el('span', '', 'Mode'));
		blendWrap.appendChild(blendTop);
		const blendSelect = el('select', 'synth-select');
		BLENDS.forEach((mode) => {
			const opt = document.createElement('option');
			opt.value = mode.id;
			opt.textContent = mode.label;
			blendSelect.appendChild(opt);
		});
		blendSelect.addEventListener('change', function () {
			patch({ camera: { blendMode: blendSelect.value } });
		});
		blendWrap.appendChild(blendSelect);

		blendSection.appendChild(opacityField.wrap);
		blendSection.appendChild(blendWrap);
		blendSection.appendChild(intensityField.wrap);
		rootEl.appendChild(blendSection);

		function makeSlider(label, min, max, step, onChange) {
			const wrap = el('label', 'synth-field');
			const top = el('div', 'synth-field__top');
			top.appendChild(el('span', '', label));
			const valueEl = el('span', 'synth-field__value', '');
			top.appendChild(valueEl);
			const input = document.createElement('input');
			input.type = 'range';
			input.min = String(min);
			input.max = String(max);
			input.step = String(step);
			input.addEventListener('pointerdown', function () {
				dragging = true;
			});
			input.addEventListener('pointerup', function () {
				dragging = false;
			});
			input.addEventListener('pointercancel', function () {
				dragging = false;
			});
			input.addEventListener('input', function () {
				const value = parseFloat(input.value);
				valueEl.textContent = formatValue(value, step);
				onChange(value);
			});
			wrap.appendChild(top);
			wrap.appendChild(input);
			return { wrap: wrap, input: input, valueEl: valueEl, step: step };
		}

		function rebuildParams(generator) {
			paramFields.innerHTML = '';
			if (generator === 'noise') {
				const modeRow = el('div', 'synth-row');
				['mono', 'color'].forEach((mode) => {
					const btn = el('button', 'synth-btn', mode === 'mono' ? 'Mono' : 'Color');
					btn.type = 'button';
					btn.dataset.mode = mode;
					btn.addEventListener('click', function () {
						patch({ noise: { mode: mode } });
					});
					modeRow.appendChild(btn);
				});
				paramFields.appendChild(modeRow);
			}

			PARAMS[generator].forEach((spec) => {
				const field = makeSlider(spec.label, spec.min, spec.max, spec.step, function (value) {
					const next = {};
					next[generator] = {};
					next[generator][spec.key] = value;
					patch(next);
				});
				field.input.dataset.param = spec.key;
				paramFields.appendChild(field.wrap);
			});
		}

		function refresh() {
			const s = getState();
			GENERATORS.forEach((gen) => {
				genButtons[gen.id].classList.toggle('is-active', s.generator === gen.id);
			});

			if (s.generator !== lastGenerator) {
				lastGenerator = s.generator;
				rebuildParams(s.generator);
			}

			if (s.generator === 'noise') {
				paramFields.querySelectorAll('[data-mode]').forEach((btn) => {
					btn.classList.toggle('is-active', btn.dataset.mode === s.noise.mode);
				});
			}

			if (!dragging) {
				const group = s[s.generator];
				paramFields.querySelectorAll('input[data-param]').forEach((input) => {
					const key = input.dataset.param;
					if (group[key] == null) return;
					input.value = String(group[key]);
					const valueEl = input.parentElement.querySelector('.synth-field__value');
					if (valueEl) valueEl.textContent = formatValue(group[key], parseFloat(input.step));
				});
				opacityField.input.value = String(s.camera.opacity);
				opacityField.valueEl.textContent = formatValue(s.camera.opacity, 0.01);
				intensityField.input.value = String(s.camera.intensity);
				intensityField.valueEl.textContent = formatValue(s.camera.intensity, 0.01);
				blendSelect.value = s.camera.blendMode;
			}

			camToggle.textContent = s.camera.enabled ? 'ON' : 'OFF';
			camToggle.classList.toggle('is-active', s.camera.enabled);
			debugToggle.textContent = (s.debug && s.debug.enabled) ? 'ON' : 'OFF';
			debugToggle.classList.toggle('is-active', !!(s.debug && s.debug.enabled));
			debugStats.hidden = !(s.debug && s.debug.enabled);
		}

		function refreshStats(stats) {
			if (!stats) return;
			if (stats.fps != null) fpsLine.textContent = 'FPS ' + Number(stats.fps).toFixed(1);
			if (stats.tempC == null) tempLine.textContent = 'CPU —';
			else tempLine.textContent = 'CPU ' + Number(stats.tempC).toFixed(1) + ' °C';
		}

		rootEl.addEventListener('pointerdown', function (event) {
			event.stopPropagation();
		});
		window.addEventListener('pointerup', function () {
			dragging = false;
		});
		window.addEventListener('pointercancel', function () {
			dragging = false;
		});

		refresh();
		return { refresh: refresh, refreshStats: refreshStats };
	}

	root.SynthUI = { mount: mount };
})(window);
