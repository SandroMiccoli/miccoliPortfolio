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

	function fpsTone(fps) {
		if (!(fps >= 0)) return '';
		if (fps > 24) return 'ok';
		if (fps >= 18) return 'warn';
		return 'bad';
	}

	function tempTone(c) {
		if (c == null || !isFinite(c)) return '';
		if (c < 60) return 'ok';
		if (c < 75) return 'warn';
		return 'bad';
	}

	function applyTone(el, tone) {
		if (!el) return;
		el.classList.remove('is-ok', 'is-warn', 'is-bad');
		if (tone) el.classList.add('is-' + tone);
	}

	root.SynthMeters = {
		fpsTone: fpsTone,
		tempTone: tempTone,
		apply: applyTone
	};

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
		rootEl.appendChild(el('p', 'synth-panel__mark', 'Synth'));

		const rail = el('div', 'synth-rail');
		const genRow = el('div', 'synth-row');
		genRow.setAttribute('role', 'tablist');
		genRow.setAttribute('aria-label', 'Generator');
		const genButtons = {};
		GENERATORS.forEach((gen) => {
			const btn = el('button', 'synth-btn', gen.label);
			btn.type = 'button';
			btn.setAttribute('role', 'tab');
			btn.addEventListener('click', function () {
				patch({ generator: gen.id });
			});
			genButtons[gen.id] = btn;
			genRow.appendChild(btn);
		});
		rail.appendChild(genRow);
		rootEl.appendChild(rail);

		const paramFields = el('div', 'synth-params');
		rootEl.appendChild(paramFields);

		const camera = el('section', 'synth-sec synth-sec--camera');
		const camHead = el('header', 'synth-sec__head');
		camHead.appendChild(el('h2', 'synth-sec__label', 'Camera'));
		const camToggle = el('button', 'synth-btn synth-toggle', 'Off');
		camToggle.type = 'button';
		camToggle.setAttribute('aria-pressed', 'false');
		camToggle.addEventListener('click', function () {
			patch({ camera: { enabled: !getState().camera.enabled } });
		});
		camHead.appendChild(camToggle);
		camera.appendChild(camHead);
		const camHint = el('p', 'synth-sec__hint', 'Blend controls appear after the camera connects.');
		camera.appendChild(camHint);
		const camParams = el('div', 'synth-cam-params');
		camParams.hidden = true;

		const opacityField = makeSlider('Opacity', 0, 1, 0.01, function (value) {
			patch({ camera: { opacity: value } });
		});
		const intensityField = makeSlider('Intensity', 0, 2, 0.01, function (value) {
			patch({ camera: { intensity: value } });
		});

		const blendField = el('div', 'synth-field');
		const blendTop = el('div', 'synth-field__top');
		blendTop.appendChild(el('span', '', 'Mode'));
		blendField.appendChild(blendTop);
		const blendRow = el('div', 'synth-row synth-row--4');
		blendRow.setAttribute('role', 'group');
		blendRow.setAttribute('aria-label', 'Blend mode');
		const blendButtons = {};
		BLENDS.forEach((mode) => {
			const btn = el('button', 'synth-btn', mode.label);
			btn.type = 'button';
			btn.addEventListener('click', function () {
				patch({ camera: { blendMode: mode.id } });
			});
			blendButtons[mode.id] = btn;
			blendRow.appendChild(btn);
		});
		blendField.appendChild(blendRow);

		camParams.appendChild(opacityField.wrap);
		camParams.appendChild(blendField);
		camParams.appendChild(intensityField.wrap);
		camera.appendChild(camParams);
		rootEl.appendChild(camera);

		const debug = el('section', 'synth-sec synth-sec--debug');
		const debugHead = el('header', 'synth-sec__head');
		debugHead.appendChild(el('h2', 'synth-sec__label', 'Sys'));
		const debugToggle = el('button', 'synth-btn synth-toggle', 'Off');
		debugToggle.type = 'button';
		debugToggle.setAttribute('aria-pressed', 'false');
		debugToggle.addEventListener('click', function () {
			const dbg = getState().debug || {};
			patch({ debug: { enabled: !dbg.enabled } });
		});
		debugHead.appendChild(debugToggle);
		debug.appendChild(debugHead);
		const debugStats = el('div', 'synth-debug-stats');
		debugStats.hidden = true;
		debugStats.appendChild(el('span', 'synth-debug-stats__key', 'Fps'));
		const fpsVal = el('span', 'synth-meter', '-');
		debugStats.appendChild(fpsVal);
		debugStats.appendChild(el('span', 'synth-debug-stats__key', 'Cpu'));
		const tempVal = el('span', 'synth-meter', '-');
		debugStats.appendChild(tempVal);
		debug.appendChild(debugStats);
		rootEl.appendChild(debug);

		function makeSlider(label, min, max, step, onChange) {
			const wrap = el('div', 'synth-field');
			const top = el('div', 'synth-field__top');
			top.appendChild(el('span', '', label));
			const valueEl = el('span', 'synth-field__value', '');
			top.appendChild(valueEl);

			const slider = el('div', 'synth-slider');
			slider.setAttribute('role', 'slider');
			slider.setAttribute('aria-label', label);
			slider.setAttribute('aria-valuemin', String(min));
			slider.setAttribute('aria-valuemax', String(max));
			slider.tabIndex = 0;
			const track = el('div', 'synth-slider__track');
			const fill = el('div', 'synth-slider__fill');
			const thumb = el('div', 'synth-slider__thumb');
			track.appendChild(fill);
			track.appendChild(thumb);
			slider.appendChild(track);
			wrap.appendChild(top);
			wrap.appendChild(slider);

			let current = min;
			let pointerId = null;
			let startX = 0;
			let startY = 0;
			let intent = null;

			function clamp(value) {
				const stepped = Math.round((value - min) / step) * step + min;
				return Math.min(max, Math.max(min, stepped));
			}

			function render() {
				const t = (current - min) / (max - min || 1);
				fill.style.width = (t * 100) + '%';
				thumb.style.left = (t * 100) + '%';
				valueEl.textContent = formatValue(current, step);
				slider.setAttribute('aria-valuenow', String(current));
			}

			function valueFromX(clientX) {
				const rect = track.getBoundingClientRect();
				const t = rect.width ? (clientX - rect.left) / rect.width : 0;
				return clamp(min + t * (max - min));
			}

			function commit(value, fromUser) {
				current = clamp(value);
				render();
				if (fromUser) onChange(current);
			}

			slider.addEventListener('pointerdown', function (event) {
				if (event.button !== 0 && event.pointerType === 'mouse') return;
				pointerId = event.pointerId;
				startX = event.clientX;
				startY = event.clientY;
				intent = null;
			});

			window.addEventListener('pointermove', function (event) {
				if (event.pointerId !== pointerId) return;
				const dx = event.clientX - startX;
				const dy = event.clientY - startY;
				if (!intent) {
					if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
					intent = Math.abs(dy) > Math.abs(dx) ? 'scroll' : 'slide';
					if (intent === 'slide') {
						dragging = true;
						try {
							slider.setPointerCapture(event.pointerId);
						} catch (err) { /* ignore */ }
					}
				}
				if (intent !== 'slide') return;
				event.preventDefault();
				commit(valueFromX(event.clientX), true);
			}, { passive: false });

			window.addEventListener('pointerup', function (event) {
				if (event.pointerId !== pointerId) return;
				if (intent === null) {
					commit(valueFromX(event.clientX), true);
				}
				pointerId = null;
				intent = null;
				dragging = false;
			});

			window.addEventListener('pointercancel', function (event) {
				if (event.pointerId !== pointerId) return;
				pointerId = null;
				intent = null;
				dragging = false;
			});

			slider.addEventListener('keydown', function (event) {
				let next = current;
				if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = current + step;
				else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = current - step;
				else return;
				event.preventDefault();
				dragging = true;
				commit(next, true);
				dragging = false;
			});

			render();
			return {
				wrap: wrap,
				valueEl: valueEl,
				step: step,
				setValue: function (value) {
					current = clamp(value);
					render();
				}
			};
		}

		function rebuildParams(generator) {
			paramFields.innerHTML = '';
			if (generator === 'noise') {
				const modeRow = el('div', 'synth-row synth-row--2');
				modeRow.setAttribute('role', 'group');
				modeRow.setAttribute('aria-label', 'Noise mode');
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
				field.wrap.dataset.param = spec.key;
				field.wrap._slider = field;
				paramFields.appendChild(field.wrap);
			});
		}

		function refresh() {
			const s = getState();
			GENERATORS.forEach((gen) => {
				const on = s.generator === gen.id;
				genButtons[gen.id].classList.toggle('is-active', on);
				genButtons[gen.id].setAttribute('aria-selected', on ? 'true' : 'false');
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
				paramFields.querySelectorAll('[data-param]').forEach((node) => {
					const key = node.dataset.param;
					if (group[key] == null || !node._slider) return;
					node._slider.setValue(group[key]);
				});
				opacityField.setValue(s.camera.opacity);
				intensityField.setValue(s.camera.intensity);
				BLENDS.forEach((mode) => {
					blendButtons[mode.id].classList.toggle('is-active', s.camera.blendMode === mode.id);
				});
			}

			const camOn = !!s.camera.enabled;
			const camLive = !!s.camera.connected;
			camToggle.classList.remove('is-wait');
			if (camOn && !camLive) {
				camToggle.textContent = 'Wait';
				camToggle.classList.add('is-wait');
			} else {
				camToggle.textContent = camLive ? 'On' : 'Off';
			}
			camToggle.classList.toggle('is-active', camLive);
			camToggle.setAttribute('aria-pressed', camLive ? 'true' : 'false');
			camParams.hidden = !camLive;
			camHint.hidden = camLive;

			const dbgOn = !!(s.debug && s.debug.enabled);
			debugToggle.textContent = dbgOn ? 'On' : 'Off';
			debugToggle.classList.toggle('is-active', dbgOn);
			debugToggle.setAttribute('aria-pressed', dbgOn ? 'true' : 'false');
			debugStats.hidden = !dbgOn;
		}

		function refreshStats(stats) {
			if (!stats) return;
			if (stats.fps != null) {
				fpsVal.textContent = Number(stats.fps).toFixed(1);
				applyTone(fpsVal, fpsTone(stats.fps));
			}
			if (!Object.prototype.hasOwnProperty.call(stats, 'tempC')) return;
			if (stats.tempC == null) {
				tempVal.textContent = '-';
				applyTone(tempVal, '');
			} else {
				tempVal.textContent = Number(stats.tempC).toFixed(1) + ' C';
				applyTone(tempVal, tempTone(stats.tempC));
			}
		}

		rootEl.addEventListener('pointerdown', function (event) {
			event.stopPropagation();
		});

		refresh();
		return { refresh: refresh, refreshStats: refreshStats };
	}

	root.SynthUI = { mount: mount };
})(window);
