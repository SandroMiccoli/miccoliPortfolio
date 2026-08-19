(function (root) {
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

	function prefersReduced() {
		return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
	}

	function dur(seconds) {
		return prefersReduced() ? 0 : seconds;
	}

	function getGsap() {
		return window.gsap || null;
	}

	if (window.gsap && window.Flip) {
		window.gsap.registerPlugin(window.Flip);
	}

	function el(tag, className, text) {
		const node = document.createElement(tag);
		if (className) node.className = className;
		if (text != null) node.textContent = text;
		return node;
	}

	function formatValue(value, step) {
		if (typeof value === 'string') return value;
		if (Math.abs(step - 1) < 1e-6) return String(Math.round(value));
		const digits = step < 0.1 ? 2 : 1;
		return Number(value).toFixed(digits);
	}

	function pipelineSignature(pipeline) {
		return (pipeline || []).map(function (op) {
			return op.id + ':' + op.type;
		}).join('|');
	}

	function gridSignature(pipes, activeId) {
		return (pipes || []).map(function (pipe) {
			return pipe.id + ':' + pipe.name;
		}).join('|') + '#' + String(activeId || '');
	}

	function mount(rootEl, options) {
		const getState = options.getState;
		const patch = options.patch;
		const capturePipe = options.capturePipe;
		const setLivePreview = options.setLivePreview;
		let lastSignature = null;
		let lastGridSig = null;
		let sliding = false;
		let picking = false;
		let renaming = false;
		let expandedId = null;
		let libInsertAt = 0;
		let liveOn = false;
		let liveFrame = '';
		const sliders = {};
		const palettes = {};
		const colors = {};

		function activePipe() {
			return root.SynthPipes ? root.SynthPipes.active(getState()) : null;
		}

		function ops() {
			const pipe = activePipe();
			return (pipe && pipe.operators) || [];
		}

		function patchOps(operators) {
			patch({ operators: operators });
		}

		rootEl.innerHTML = '';

		const preview = el('section', 'synth-preview');
		preview.setAttribute('aria-label', 'PIPE output preview');
		const previewFrame = el('div', 'synth-preview__frame');
		const previewImg = el('img');
		previewImg.alt = '';
		previewImg.hidden = true;
		const previewEmpty = el('p', 'synth-preview__empty', 'Waiting for output');
		const previewName = el('p', 'synth-preview__name', 'PIPE');
		previewFrame.appendChild(previewImg);
		previewFrame.appendChild(previewEmpty);
		previewFrame.appendChild(previewName);
		const liveBtn = el('button', 'synth-preview__live', 'Live');
		liveBtn.type = 'button';
		liveBtn.setAttribute('aria-pressed', 'false');
		liveBtn.setAttribute('aria-label', 'Toggle live preview');
		liveBtn.addEventListener('click', function () {
			const next = !liveOn;
			setLiveMode(next);
			if (typeof setLivePreview === 'function') setLivePreview(next);
		});
		previewFrame.appendChild(liveBtn);
		preview.appendChild(previewFrame);
		rootEl.appendChild(preview);

		const top = el('div', 'synth-panel__top');
		top.appendChild(el('p', 'synth-panel__mark', 'Synth'));
		rootEl.appendChild(top);

		const pipesSec = el('section', 'synth-pipes');
		const pipesHead = el('header', 'synth-sec__head');
		pipesHead.appendChild(el('h2', 'synth-sec__label', 'PIPE'));
		pipesSec.appendChild(pipesHead);
		const grid = el('div', 'synth-pipe-grid');
		grid.setAttribute('aria-label', 'PIPE grid');
		pipesSec.appendChild(grid);
		rootEl.appendChild(pipesSec);

		const activeBar = el('section', 'synth-pipe-active');
		const activeHead = el('header', 'synth-pipe-active__head');
		const activeName = el('h2', 'synth-pipe-active__name', 'PIPE');
		activeHead.appendChild(activeName);
		const activeTools = el('div', 'synth-pipe-active__tools');
		activeHead.appendChild(activeTools);
		activeBar.appendChild(activeHead);
		rootEl.appendChild(activeBar);

		const stack = el('div', 'synth-stack');
		stack.setAttribute('aria-label', 'Operator stack');
		rootEl.appendChild(stack);

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

		const sheet = el('div', 'synth-sheet');
		sheet.hidden = true;
		sheet.setAttribute('role', 'dialog');
		sheet.setAttribute('aria-modal', 'true');
		const sheetHead = el('header', 'synth-sheet__head');
		const sheetTitle = el('h2', 'synth-sheet__title', 'Library');
		sheetHead.appendChild(sheetTitle);
		const sheetClose = iconBtn('x', 'Close', 'Close this panel', closeSheet);
		sheetHead.appendChild(sheetClose);
		sheet.appendChild(sheetHead);
		const sheetBody = el('div', 'synth-sheet__body');
		sheet.appendChild(sheetBody);
		rootEl.appendChild(sheet);

		const tip = el('div', 'synth-float-tip');
		tip.hidden = true;
		tip.setAttribute('role', 'tooltip');
		const tipName = el('strong', 'synth-float-tip__name', '');
		const tipDesc = el('span', 'synth-float-tip__desc', '');
		tip.appendChild(tipName);
		tip.appendChild(tipDesc);
		document.body.appendChild(tip);

		function hideTip() {
			tip.hidden = true;
		}

		function showTip(btn) {
			tipName.textContent = btn.dataset.tip || '';
			tipDesc.textContent = btn.dataset.tipDesc || '';
			tip.hidden = false;
			const rect = btn.getBoundingClientRect();
			const pad = 8;
			let left = rect.left;
			let topY = rect.bottom + 6;
			const tw = 220;
			if (left + tw > window.innerWidth - pad) left = window.innerWidth - tw - pad;
			if (topY + 80 > window.innerHeight) topY = rect.top - 80;
			tip.style.left = Math.max(pad, left) + 'px';
			tip.style.top = Math.max(pad, topY) + 'px';
		}

		function bindTip(btn) {
			btn.addEventListener('pointerenter', function (event) {
				if (event.pointerType !== 'mouse') return;
				showTip(btn);
			});
			btn.addEventListener('pointerleave', hideTip);
			btn.addEventListener('blur', hideTip);
		}

		function iconBtn(iconName, name, description, onClick) {
			const btn = el('button', 'synth-icon');
			btn.type = 'button';
			btn.setAttribute('aria-label', name + '. ' + description);
			btn.dataset.tip = name;
			btn.dataset.tipDesc = description;
			btn.appendChild(root.SynthIcons.svg(iconName));
			btn.addEventListener('click', onClick);
			bindTip(btn);
			return btn;
		}

		top.appendChild(iconBtn(
			'question',
			'About Visual Synth',
			'What this instrument is, and how operator families work.',
			openTypesHelp
		));
		const helpSlot = document.getElementById('synth-help-slot');
		if (helpSlot) {
			helpSlot.appendChild(top.lastElementChild);
		}

		function startRename(pipe) {
			if (!pipe || renaming) return;
			renaming = true;
			const input = el('input', 'synth-pipe-rename');
			input.type = 'text';
			input.value = pipe.name;
			input.setAttribute('aria-label', 'PIPE name');
			input.maxLength = 32;
			activeName.replaceWith(input);
			input.focus();
			input.select();

			function commit() {
				if (!renaming) return;
				renaming = false;
				const name = input.value.trim() || pipe.name;
				if (input.parentNode) input.replaceWith(activeName);
				activeName.textContent = name;
				if (name !== pipe.name) {
					patch({ pipeMeta: { id: pipe.id, name: name } });
				} else {
					refresh();
				}
			}

			input.addEventListener('keydown', function (event) {
				if (event.key === 'Enter') {
					event.preventDefault();
					commit();
				}
				if (event.key === 'Escape') {
					renaming = false;
					input.replaceWith(activeName);
					refresh();
				}
			});
			input.addEventListener('blur', commit);
		}

		activeTools.appendChild(iconBtn(
			'pencil',
			'Rename',
			'Change the name of the active PIPE.',
			function () {
				const pipe = activePipe();
				if (pipe) startRename(pipe);
			}
		));
		activeTools.appendChild(iconBtn(
			'copy',
			'Duplicate PIPE',
			'Create an independent copy of this PIPE and its operators.',
			function () {
				const s = getState();
				const pipe = activePipe();
				if (!pipe) return;
				const copy = root.SynthPipes.duplicate(pipe, s.pipes);
				patch({
					pipes: (s.pipes || []).concat([copy]),
					activePipeId: copy.id
				});
				expandedId = null;
			}
		));
		const deletePipeBtn = iconBtn(
			'trash',
			'Delete PIPE',
			'Remove this PIPE. Its operators are not shared with other PIPEs.',
			function () {
				const s = getState();
				const pipe = activePipe();
				if (!pipe || (s.pipes || []).length <= 1) return;
				const pipes = (s.pipes || []).filter(function (item) {
					return item.id !== pipe.id;
				});
				expandedId = null;
				patch({
					pipes: pipes,
					activePipeId: pipes[0].id
				});
			}
		);
		activeTools.appendChild(deletePipeBtn);

		const clockBar = el('div', 'synth-clock');
		const tapBtn = el('button', 'synth-clock__tap');
		tapBtn.type = 'button';
		tapBtn.setAttribute('aria-label', 'Tap tempo');
		const bpmVal = el('span', 'synth-clock__bpm', '120');
		const readout = el('span', 'synth-clock__readout');
		readout.appendChild(bpmVal);
		readout.appendChild(el('span', 'synth-clock__unit', 'BPM'));
		tapBtn.appendChild(el('span', 'synth-clock__hint', 'Tap'));
		tapBtn.appendChild(readout);
		clockBar.appendChild(tapBtn);

		const viz = el('div', 'synth-clock__viz');
		viz.setAttribute('aria-hidden', 'true');
		const beatCells = [];
		for (let b = 0; b < 4; b += 1) {
			const cell = el('span', 'synth-clock__beat');
			if (b === 0) cell.classList.add('is-down');
			viz.appendChild(cell);
			beatCells.push(cell);
		}
		clockBar.appendChild(viz);

		const syncBtn = iconBtn(
			'sync',
			'Sync',
			'Jump the clock back to beat 1 of the 4/4 bar.',
			function () {
				const clock = root.SynthClock.fromState(getState());
				patch({ clock: root.SynthClock.sync(clock) });
			}
		);
		syncBtn.classList.add('synth-clock__sync');
		clockBar.appendChild(syncBtn);
		pipesSec.appendChild(clockBar);

		let lastBeat = -1;

		tapBtn.addEventListener('pointerdown', function (event) {
			if (event.button !== 0 && event.pointerType === 'mouse') return;
			event.preventDefault();
			const prev = root.SynthClock.fromState(getState());
			const next = root.SynthClock.tap(prev);
			if (next.bpm !== prev.bpm || Math.abs(next.originMs - prev.originMs) > 1) {
				patch({ clock: { bpm: next.bpm, originMs: next.originMs } });
			}
			tapBtn.classList.add('is-hit');
			const g = getGsap();
			if (g && !prefersReduced()) {
				g.fromTo(tapBtn, { scale: 0.97 }, {
					scale: 1,
					duration: dur(0.16),
					ease: 'power2.out'
				});
			}
			window.setTimeout(function () {
				tapBtn.classList.remove('is-hit');
			}, 140);
		});

		function liveOp(id) {
			return ops().find(function (item) {
				return item.id === id;
			}) || null;
		}

		function liveMod(id, key) {
			const op = liveOp(id);
			return (op && op.modulations && op.modulations[key]) || null;
		}

		function closeSheet() {
			hideTip();
			const g = getGsap();
			if (!g || sheet.hidden || prefersReduced()) {
				sheet.hidden = true;
				sheetBody.innerHTML = '';
				return;
			}
			g.to(sheet, {
				autoAlpha: 0,
				y: 10,
				duration: dur(0.2),
				ease: 'power2.in',
				onComplete: function () {
					sheet.hidden = true;
					sheetBody.innerHTML = '';
					g.set(sheet, { y: 0, autoAlpha: 1 });
				}
			});
		}

		function openSheet(title) {
			const wasHidden = sheet.hidden;
			sheetTitle.textContent = title;
			sheet.hidden = false;
			sheet.scrollTop = 0;
			const g = getGsap();
			if (g) g.killTweensOf(sheet);
			if (wasHidden && g && !prefersReduced()) {
				g.fromTo(sheet, { autoAlpha: 0, y: 16 }, {
					autoAlpha: 1,
					y: 0,
					duration: dur(0.28),
					ease: 'power2.out'
				});
			} else if (g) {
				g.set(sheet, { autoAlpha: 1, y: 0 });
			}
		}

		function openTypesHelp() {
			openSheet('Visual Synth');
			sheetBody.innerHTML = '';
			sheetBody.appendChild(el('p', 'synth-help__lead', 'Visual Synth is a visual instrument. You build PIPEs: ordered stacks of operators that process an image the way a synthesizer processes sound. Order is the patch.'));
			sheetBody.appendChild(el('p', 'synth-help__text', 'Pick a PIPE in the grid, then edit its operators. Each operator reads what came before, does one job, and passes a new image down. Bypass, reorder, or remove a stage and the chain recomputes.'));
			const cats = root.SynthCategories;
			['generator', 'effect', 'color', 'compositing', 'output'].forEach(function (id) {
				const cat = cats[id];
				if (!cat) return;
				const block = el('article', 'synth-help__cat');
				block.style.setProperty('--op-color', cat.color);
				block.appendChild(el('h3', 'synth-help__cat-name', cat.label));
				block.appendChild(el('p', 'synth-help__text', cat.about));
				sheetBody.appendChild(block);
			});
		}

		function openOpHelp(def) {
			openSheet(def.name || 'Operator');
			sheetBody.innerHTML = '';
			const block = el('article', 'synth-help__cat');
			block.style.setProperty('--op-color', def.color || '#8E8E8E');
			block.appendChild(el('h3', 'synth-help__cat-name', def.categoryLabel || def.category || ''));
			block.appendChild(el('p', 'synth-help__text', def.help || 'No description yet.'));
			sheetBody.appendChild(block);
		}

		function openLibrary(index) {
			libInsertAt = index;
			openSheet('Add operator');
			sheetBody.innerHTML = '';
			const groups = root.SynthRegistry.listByCategory();
			groups.forEach(function (group) {
				const ready = group.items.filter(function (def) {
					return def.implemented;
				});
				const soon = group.items.filter(function (def) {
					return !def.implemented;
				});
				const block = el('div', 'synth-lib__cat');
				const catHead = el('div', 'synth-lib__cat-head');
				catHead.appendChild(el('h3', 'synth-lib__cat-label', group.label));
				const cat = root.SynthCategories[group.id];
				const about = el('p', 'synth-help__text synth-lib__about');
				about.hidden = true;
				if (cat) {
					about.textContent = cat.about;
					const help = iconBtn('question', group.label, cat.about, function () {
						about.hidden = !about.hidden;
					});
					help.classList.add('synth-icon--tiny');
					catHead.appendChild(help);
				}
				block.appendChild(catHead);
				if (cat) block.appendChild(about);
				if (ready.length) {
					const row = el('div', 'synth-lib__ops');
					ready.forEach(function (def) {
						row.appendChild(makeChip(def));
					});
					block.appendChild(row);
				}
				if (soon.length) {
					const extra = el('details', 'synth-lib__later');
					if (!ready.length) extra.open = true;
					extra.appendChild(el('summary', '', 'Later'));
					const laterRow = el('div', 'synth-lib__ops');
					soon.forEach(function (def) {
						laterRow.appendChild(makeChip(def));
					});
					extra.appendChild(laterRow);
					block.appendChild(extra);
				}
				sheetBody.appendChild(block);
			});
			const g = getGsap();
			if (g && !prefersReduced()) {
				g.from(sheetBody.querySelectorAll('.synth-chip, .synth-lib__cat-label'), {
					autoAlpha: 0,
					y: 8,
					duration: dur(0.24),
					stagger: 0.025,
					ease: 'power2.out'
				});
			}
		}

		function makeChip(def) {
			const chip = el('button', 'synth-chip', def.name);
			chip.type = 'button';
			chip.style.setProperty('--op-color', def.color);
			if (!def.implemented) {
				chip.disabled = true;
				chip.classList.add('is-soon');
				chip.title = 'Not in this build';
				return chip;
			}
			chip.addEventListener('click', function () {
				const seen = {};
				ops().forEach(function (op) {
					seen[op.id] = true;
				});
				const next = root.SynthPipeline.add(ops(), def.type, libInsertAt);
				const added = next.filter(function (op) {
					return !seen[op.id];
				})[0];
				if (added) expandedId = added.id;
				patchOps(next);
				closeSheet();
			});
			return chip;
		}

		function makeSlider(label, min, max, step, onChange, options) {
			options = options || {};
			const canMod = !!options.modulate && !!root.SynthModulate;
			const opId = options.opId;
			const paramKey = options.paramKey;
			const spec = options.spec;
			const bipolar = min < 0 && max > 0;
			const isStepper = !!(options.stepper || (spec && spec.kind === 'int'));
			const wrap = el('div', bipolar ? 'synth-field synth-field--bipolar' : 'synth-field');
			if (isStepper) wrap.classList.add('synth-field--stepper');
			if (options.className) wrap.classList.add(options.className);

			const topRow = el('div', 'synth-field__top');
			const lead = el('span', 'synth-field__lead');
			const labelEl = el(canMod ? 'button' : 'span', canMod ? 'synth-field__name' : '', label);
			if (canMod) {
				labelEl.type = 'button';
				labelEl.setAttribute('aria-label', 'Modulate ' + label);
			}
			lead.appendChild(labelEl);
			topRow.appendChild(lead);
			const valueEl = el('span', 'synth-field__value', '');

			let modBtn = null;
			if (canMod) {
				modBtn = el('button', 'synth-icon synth-icon--tiny synth-field__mod');
				modBtn.type = 'button';
				modBtn.setAttribute('aria-label', 'Toggle modulation');
				modBtn.dataset.tip = 'Modulate';
				modBtn.dataset.tipDesc = 'Drive this parameter from a timeline, the BPM clock, or the microphone.';
				modBtn.appendChild(root.SynthIcons.svg('wave'));
				bindTip(modBtn);
				lead.appendChild(modBtn);
			}

			const slider = el('div', bipolar ? 'synth-slider synth-slider--bipolar' : 'synth-slider');
			slider.setAttribute('role', 'slider');
			slider.setAttribute('aria-label', label);
			slider.setAttribute('aria-valuemin', String(min));
			slider.setAttribute('aria-valuemax', String(max));
			slider.tabIndex = 0;
			const track = el('div', 'synth-slider__track');
			const fill = el('div', 'synth-slider__fill');
			const thumb = el('div', 'synth-slider__thumb synth-slider__thumb--value');
			const inThumb = el('div', 'synth-slider__thumb synth-slider__thumb--in');
			const outThumb = el('div', 'synth-slider__thumb synth-slider__thumb--out');
			const playhead = el('div', 'synth-slider__playhead');
			track.appendChild(fill);
			if (bipolar) track.appendChild(el('div', 'synth-slider__zero'));
			track.appendChild(thumb);
			track.appendChild(inThumb);
			track.appendChild(outThumb);
			track.appendChild(playhead);
			slider.appendChild(track);
			wrap.appendChild(topRow);

			let minusBtn = null;
			let plusBtn = null;
			if (isStepper) {
				const tail = el('div', 'synth-field__tail');
				tail.appendChild(valueEl);
				const stepper = el('div', 'synth-stepper');
				minusBtn = el('button', 'synth-stepper__btn', '−');
				plusBtn = el('button', 'synth-stepper__btn', '+');
				minusBtn.type = 'button';
				plusBtn.type = 'button';
				minusBtn.setAttribute('aria-label', 'Decrease ' + label);
				plusBtn.setAttribute('aria-label', 'Increase ' + label);
				minusBtn.addEventListener('click', function () {
					commit(current - step, true);
				});
				plusBtn.addEventListener('click', function () {
					commit(current + step, true);
				});
				stepper.appendChild(minusBtn);
				stepper.appendChild(plusBtn);
				tail.appendChild(stepper);
				topRow.appendChild(tail);
			} else {
				topRow.appendChild(valueEl);
			}

			wrap.appendChild(slider);

			let current = min;
			let inMark = min;
			let outMark = max;
			let liveValue = min;
			let modOn = false;
			let dragTarget = 'value';
			let pointerId = null;
			let startX = 0;
			let startY = 0;
			let intent = null;
			let speedSlider = null;
			let beatsEl = null;
			let panel = null;
			let modeRow = null;
			let timeRow = null;
			let bpmRow = null;
			let fftRow = null;

			function clamp(value) {
				const stepped = Math.round((value - min) / step) * step + min;
				return Math.min(max, Math.max(min, stepped));
			}

			function posFromValue(value) {
				if (!bipolar) return (value - min) / (max - min || 1);
				if (value < 0) return 0.5 * (value - min) / (0 - min || 1);
				return 0.5 + 0.5 * value / (max || 1);
			}

			function formatDisplay(value) {
				if (spec && spec.unit === '°') return Math.round(value) + '°';
				const text = formatValue(value, step);
				if (bipolar && value > 0) return '+' + text;
				return text;
			}

			function place(node, value) {
				node.style.left = (posFromValue(value) * 100) + '%';
			}

			function renderFill(from, to) {
				const a = posFromValue(from);
				const b = posFromValue(to);
				const left = Math.min(a, b);
				const right = Math.max(a, b);
				fill.style.left = (left * 100) + '%';
				fill.style.width = ((right - left) * 100) + '%';
			}

			function render() {
				if (modOn) {
					renderFill(inMark, outMark);
					place(inThumb, inMark);
					place(outThumb, outMark);
					place(playhead, liveValue);
					valueEl.textContent = formatDisplay(liveValue);
					slider.setAttribute('aria-valuenow', String(liveValue));
					slider.setAttribute('aria-valuetext', formatDisplay(liveValue));
					return;
				}
				const t = posFromValue(current);
				if (bipolar) {
					const zero = 0.5;
					if (t >= zero) {
						fill.style.left = (zero * 100) + '%';
						fill.style.width = ((t - zero) * 100) + '%';
					} else {
						fill.style.left = (t * 100) + '%';
						fill.style.width = ((zero - t) * 100) + '%';
					}
				} else {
					fill.style.left = '0';
					fill.style.width = (t * 100) + '%';
				}
				thumb.style.left = (t * 100) + '%';
				valueEl.textContent = formatDisplay(current);
				if (minusBtn) minusBtn.disabled = current <= min;
				if (plusBtn) plusBtn.disabled = current >= max;
				slider.setAttribute('aria-valuenow', String(current));
				slider.setAttribute('aria-valuetext', formatDisplay(current));
			}

			function tFromX(clientX) {
				const rect = track.getBoundingClientRect();
				return rect.width ? Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) : 0;
			}

			function valueFromX(clientX) {
				const t = tFromX(clientX);
				if (!bipolar) return clamp(min + t * (max - min));
				if (t < 0.5) return clamp(min + (t / 0.5) * (0 - min));
				return clamp((t - 0.5) / 0.5 * max);
			}

			function nearestHandle(clientX) {
				const t = tFromX(clientX);
				const inT = posFromValue(inMark);
				const outT = posFromValue(outMark);
				return Math.abs(t - inT) <= Math.abs(t - outT) ? 'in' : 'out';
			}

			function commit(value, fromUser) {
				current = clamp(value);
				render();
				if (fromUser) onChange(current);
			}

			function commitMark(which, value, fromUser) {
				if (which === 'in') inMark = clamp(value);
				else outMark = clamp(value);
				render();
				if (fromUser && opId && paramKey) {
					patch({
						opMod: {
							id: opId,
							key: paramKey,
							modulation: { inMark: inMark, outMark: outMark }
						}
					});
				}
			}

			function applyDrag(clientX, fromUser) {
				if (modOn && (dragTarget === 'in' || dragTarget === 'out')) {
					commitMark(dragTarget, valueFromX(clientX), fromUser);
					return;
				}
				commit(valueFromX(clientX), fromUser);
			}

			slider.addEventListener('pointerdown', function (event) {
				if (event.button !== 0 && event.pointerType === 'mouse') return;
				pointerId = event.pointerId;
				startX = event.clientX;
				startY = event.clientY;
				intent = null;
				dragTarget = modOn ? nearestHandle(event.clientX) : 'value';
			});

			window.addEventListener('pointermove', function (event) {
				if (event.pointerId !== pointerId) return;
				const dx = event.clientX - startX;
				const dy = event.clientY - startY;
				if (!intent) {
					if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
					intent = Math.abs(dy) > Math.abs(dx) ? 'scroll' : 'slide';
					if (intent === 'slide') {
						sliding = true;
						try {
							slider.setPointerCapture(event.pointerId);
						} catch (err) { /* ignore */ }
					}
				}
				if (intent !== 'slide') return;
				event.preventDefault();
				applyDrag(event.clientX, true);
			}, { passive: false });

			window.addEventListener('pointerup', function (event) {
				if (event.pointerId !== pointerId) return;
				if (intent === null) applyDrag(event.clientX, true);
				pointerId = null;
				intent = null;
				sliding = false;
			});

			window.addEventListener('pointercancel', function (event) {
				if (event.pointerId !== pointerId) return;
				pointerId = null;
				intent = null;
				sliding = false;
			});

			slider.addEventListener('keydown', function (event) {
				if (modOn) return;
				let next = current;
				if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = current + step;
				else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = current - step;
				else return;
				event.preventDefault();
				sliding = true;
				commit(next, true);
				sliding = false;
			});

			function setSourceUi(source) {
				if (!panel) return;
				panel.querySelectorAll('[data-src]').forEach(function (btn) {
					btn.classList.toggle('is-active', btn.dataset.src === source);
				});
				if (modeRow) modeRow.hidden = source === 'fft';
				if (timeRow) timeRow.hidden = source !== 'time';
				if (bpmRow) bpmRow.hidden = source !== 'bpm';
				if (fftRow) fftRow.hidden = source !== 'fft';
			}

			function setModeUi(mode) {
				if (!panel) return;
				panel.querySelectorAll('[data-mode]').forEach(function (btn) {
					btn.classList.toggle('is-active', btn.dataset.mode === mode);
				});
			}

			function setBandUi(band) {
				if (!panel) return;
				panel.querySelectorAll('[data-band]').forEach(function (btn) {
					btn.classList.toggle('is-active', btn.dataset.band === band);
				});
			}

			function patchMod(partial) {
				if (!opId || !paramKey) return;
				patch({ opMod: { id: opId, key: paramKey, modulation: partial } });
			}

			function toggleMod() {
				const existing = liveMod(opId, paramKey);
				if (existing && existing.enabled) {
					patchMod({ enabled: false });
					return;
				}
				if (existing) {
					patchMod({ enabled: true });
					return;
				}
				const op = liveOp(opId);
				const value = op && op.parameters ? op.parameters[paramKey] : current;
				patch({
					opMod: {
						id: opId,
						key: paramKey,
						modulation: root.SynthModulate.defaults(spec, value)
					}
				});
			}

			if (canMod) {
				labelEl.addEventListener('click', toggleMod);
				modBtn.addEventListener('click', toggleMod);

				panel = el('div', 'synth-mod');
				panel.hidden = true;

				const srcRow = el('div', 'synth-mod__row');
				[
					{ id: 'time', icon: 'timer', name: 'Speed', desc: 'Cycle in real seconds.' },
					{ id: 'bpm', icon: 'metronome', name: 'BPM', desc: 'Cycle in musical beats.' },
					{ id: 'fft', icon: 'mic', name: 'FFT', desc: 'Follow the phone microphone.' }
				].forEach(function (src) {
					const btn = iconBtn(src.icon, src.name, src.desc, function () {
						patchMod({ source: src.id, enabled: true });
						if (src.id === 'fft' && root.SynthFft) {
							root.SynthFft.start(true).catch(function () {
								if (root.SynthNotify) {
									root.SynthNotify.show('warning', 'Microphone unavailable');
								}
							});
						}
					});
					btn.dataset.src = src.id;
					srcRow.appendChild(btn);
				});
				panel.appendChild(srcRow);

				modeRow = el('div', 'synth-mod__row');
				[
					{ id: 'loop', icon: 'repeat', name: 'Loop', desc: 'Jump back to In when the cycle ends.' },
					{ id: 'bounce', icon: 'bounce', name: 'Bounce', desc: 'Travel In to Out, then reverse.' },
					{ id: 'random', icon: 'dice', name: 'Random', desc: 'Hold a random value, then jump when the cycle restarts (beat 1 in BPM, or when the timer ends).' }
				].forEach(function (mode) {
					const btn = iconBtn(mode.icon, mode.name, mode.desc, function () {
						patchMod({ playMode: mode.id });
					});
					btn.dataset.mode = mode.id;
					modeRow.appendChild(btn);
				});
				panel.appendChild(modeRow);

				timeRow = el('div', 'synth-mod__time');
				speedSlider = makeSlider('Seconds', root.SynthModulate.DURATION_MIN, root.SynthModulate.DURATION_MAX, 0.25, function (value) {
					patchMod({ duration: value });
				}, { className: 'synth-mod__speed' });
				timeRow.appendChild(speedSlider.wrap);
				panel.appendChild(timeRow);

				bpmRow = el('div', 'synth-mod__bpm');
				bpmRow.hidden = true;
				const halfBtn = el('button', 'synth-btn synth-mod__beat-btn', '/2');
				halfBtn.type = 'button';
				halfBtn.setAttribute('aria-label', 'Halve beats');
				halfBtn.addEventListener('click', function () {
					const mod = liveMod(opId, paramKey) || {};
					patchMod({ beats: root.SynthModulate.halfBeats(mod.beats) });
				});
				beatsEl = el('span', 'synth-mod__beats', '4 beats');
				const doubleBtn = el('button', 'synth-btn synth-mod__beat-btn', 'x2');
				doubleBtn.type = 'button';
				doubleBtn.setAttribute('aria-label', 'Double beats');
				doubleBtn.addEventListener('click', function () {
					const mod = liveMod(opId, paramKey) || {};
					patchMod({ beats: root.SynthModulate.doubleBeats(mod.beats) });
				});
				bpmRow.appendChild(halfBtn);
				bpmRow.appendChild(beatsEl);
				bpmRow.appendChild(doubleBtn);
				panel.appendChild(bpmRow);

				fftRow = el('div', 'synth-mod__row synth-mod__fft');
				fftRow.hidden = true;
				[
					{ id: 'low', label: 'Low' },
					{ id: 'mid', label: 'Mid' },
					{ id: 'high', label: 'High' }
				].forEach(function (band) {
					const btn = el('button', 'synth-btn', band.label);
					btn.type = 'button';
					btn.dataset.band = band.id;
					btn.addEventListener('click', function () {
						patchMod({ band: band.id });
					});
					fftRow.appendChild(btn);
				});
				panel.appendChild(fftRow);

				wrap.appendChild(panel);
			}

			function setMod(mod) {
				const on = !!(mod && mod.enabled);
				modOn = on;
				wrap.classList.toggle('is-mod', on);
				slider.classList.toggle('is-mod', on);
				if (modBtn) {
					modBtn.classList.toggle('is-active', on);
					modBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
				}
				if (panel) panel.hidden = !on;
				if (on) {
					inMark = clamp(mod.inMark);
					outMark = clamp(mod.outMark);
					setSourceUi(mod.source || 'time');
					setModeUi(mod.playMode || 'loop');
					setBandUi(mod.band || 'low');
					if (speedSlider) speedSlider.setValue(mod.duration);
					if (beatsEl) {
						const beats = mod.beats || 4;
						beatsEl.textContent = beats + (beats === 1 ? ' beat' : ' beats');
					}
				}
				render();
			}

			render();
			return {
				wrap: wrap,
				step: step,
				setValue: function (value) {
					current = clamp(value);
					if (!modOn) render();
				},
				setMod: setMod,
				updateLive: function (ctx) {
					if (!modOn || !spec) return;
					const mod = liveMod(opId, paramKey);
					const value = root.SynthModulate.evaluate(mod, spec, ctx, opId + ':' + paramKey);
					if (value === undefined) return;
					liveValue = value;
					place(playhead, liveValue);
					valueEl.textContent = formatDisplay(liveValue);
					slider.setAttribute('aria-valuenow', String(liveValue));
					slider.setAttribute('aria-valuetext', formatDisplay(liveValue));
				}
			};
		}

		function setParam(id, key, value) {
			patch({ opParam: { id: id, key: key, value: value } });
		}

		function setParams(id, parameters) {
			patch({ opParam: { id: id, parameters: parameters } });
		}

		function lookupParams(op) {
			return root.SynthLookup
				? root.SynthLookup.normalize(op.parameters || {})
				: (op.parameters || {});
		}

		function patchLookup(opId, next) {
			setParams(opId, {
				paletteId: next.paletteId,
				colors: next.colors,
				bg: next.bg,
				savedPalettes: next.savedPalettes
			});
		}

		function makeColorPicker() {
			const Lookup = root.SynthLookup;
			const pop = el('div', 'synth-picker');
			pop.hidden = true;
			pop.setAttribute('role', 'dialog');
			pop.setAttribute('aria-label', 'Color picker');

			const map = el('div', 'synth-picker__map');
			map.setAttribute('role', 'slider');
			map.setAttribute('aria-label', 'Saturation and brightness');
			const mapCursor = el('div', 'synth-picker__map-cursor');
			map.appendChild(mapCursor);

			const tools = el('div', 'synth-picker__tools');
			const dropBtn = el('button', 'synth-picker__drop');
			dropBtn.type = 'button';
			dropBtn.setAttribute('aria-label', 'Sample color');
			dropBtn.appendChild(root.SynthIcons.svg('eyedropper'));
			if (!window.EyeDropper) dropBtn.hidden = true;
			const preview = el('div', 'synth-picker__preview');
			const hue = el('div', 'synth-picker__hue');
			hue.setAttribute('role', 'slider');
			hue.setAttribute('aria-label', 'Hue');
			const hueThumb = el('div', 'synth-picker__hue-thumb');
			hue.appendChild(hueThumb);
			tools.appendChild(dropBtn);
			tools.appendChild(preview);
			tools.appendChild(hue);

			const rgbRow = el('div', 'synth-picker__rgb');
			const channels = ['R', 'G', 'B'].map(function (name, index) {
				const cell = el('label', 'synth-picker__chan');
				const input = el('input', 'synth-picker__num');
				input.type = 'number';
				input.min = '0';
				input.max = '255';
				input.step = '1';
				input.inputMode = 'numeric';
				input.setAttribute('aria-label', name);
				cell.appendChild(input);
				cell.appendChild(el('span', '', name));
				rgbRow.appendChild(cell);
				return { name: name, index: index, input: input };
			});

			pop.appendChild(map);
			pop.appendChild(tools);
			pop.appendChild(rgbRow);
			document.body.appendChild(pop);

			let hsv = [0, 1, 1];
			let onChange = null;
			let onClose = null;
			let open = false;
			let mapPointer = null;
			let huePointer = null;

			function hexNow() {
				if (!Lookup) return '#000000';
				const rgb = Lookup.hsvToRgb(hsv[0], hsv[1], hsv[2]);
				return Lookup.toHex(rgb[0], rgb[1], rgb[2]);
			}

			function rgbNow() {
				if (!Lookup) return [0, 0, 0];
				return Lookup.hsvToRgb(hsv[0], hsv[1], hsv[2]).map(function (n) {
					return Math.max(0, Math.min(255, Math.round(n)));
				});
			}

			function paint() {
				const hueDeg = hsv[0] * 360;
				const rgb = rgbNow();
				const hex = hexNow();
				map.style.setProperty('--picker-hue-color', 'hsl(' + hueDeg + 'deg, 100%, 50%)');
				mapCursor.style.left = (hsv[1] * 100) + '%';
				mapCursor.style.top = ((1 - hsv[2]) * 100) + '%';
				hueThumb.style.left = (hsv[0] * 100) + '%';
				preview.style.background = hex;
				channels.forEach(function (chan) {
					if (document.activeElement !== chan.input) {
						chan.input.value = String(rgb[chan.index]);
					}
				});
			}

			function emit() {
				if (onChange) onChange(hexNow());
			}

			function setFromHex(hex, silent) {
				if (!Lookup) return;
				const rgb = Lookup.parseHex(hex);
				hsv = Lookup.rgbToHsv(rgb[0], rgb[1], rgb[2]);
				paint();
				if (!silent) emit();
			}

			function svFromEvent(event) {
				const rect = map.getBoundingClientRect();
				const x = rect.width ? (event.clientX - rect.left) / rect.width : 0;
				const y = rect.height ? (event.clientY - rect.top) / rect.height : 0;
				hsv[1] = Math.max(0, Math.min(1, x));
				hsv[2] = Math.max(0, Math.min(1, 1 - y));
				paint();
				emit();
			}

			function hueFromEvent(event) {
				const rect = hue.getBoundingClientRect();
				const x = rect.width ? (event.clientX - rect.left) / rect.width : 0;
				hsv[0] = Math.max(0, Math.min(1, x));
				paint();
				emit();
			}

			map.addEventListener('pointerdown', function (event) {
				if (event.button !== 0 && event.pointerType === 'mouse') return;
				mapPointer = event.pointerId;
				try { map.setPointerCapture(event.pointerId); } catch (err) { /* ignore */ }
				svFromEvent(event);
			});
			map.addEventListener('pointermove', function (event) {
				if (event.pointerId !== mapPointer) return;
				svFromEvent(event);
			});
			map.addEventListener('pointerup', function (event) {
				if (event.pointerId === mapPointer) mapPointer = null;
			});
			map.addEventListener('pointercancel', function () {
				mapPointer = null;
			});

			hue.addEventListener('pointerdown', function (event) {
				if (event.button !== 0 && event.pointerType === 'mouse') return;
				huePointer = event.pointerId;
				try { hue.setPointerCapture(event.pointerId); } catch (err) { /* ignore */ }
				hueFromEvent(event);
			});
			hue.addEventListener('pointermove', function (event) {
				if (event.pointerId !== huePointer) return;
				hueFromEvent(event);
			});
			hue.addEventListener('pointerup', function (event) {
				if (event.pointerId === huePointer) huePointer = null;
			});
			hue.addEventListener('pointercancel', function () {
				huePointer = null;
			});

			channels.forEach(function (chan) {
				chan.input.addEventListener('focus', function () {
					chan.input.select();
				});
				chan.input.addEventListener('input', function () {
					const rgb = rgbNow();
					const next = Number(chan.input.value);
					if (!isFinite(next)) return;
					rgb[chan.index] = Math.max(0, Math.min(255, next));
					if (!Lookup) return;
					hsv = Lookup.rgbToHsv(rgb[0], rgb[1], rgb[2]);
					paint();
					emit();
				});
			});

			dropBtn.addEventListener('click', function () {
				if (!window.EyeDropper) return;
				const dropper = new window.EyeDropper();
				dropper.open().then(function (result) {
					if (result && result.sRGBHex) setFromHex(result.sRGBHex);
				}).catch(function () { /* cancelled */ });
			});

			function place(anchor) {
				const rect = anchor.getBoundingClientRect();
				const width = pop.offsetWidth || 228;
				const height = pop.offsetHeight || 268;
				const pad = 8;
				let left = rect.left + rect.width / 2 - width / 2;
				let top = rect.bottom + pad;
				if (top + height > window.innerHeight - pad) {
					top = rect.top - height - pad;
				}
				left = Math.max(pad, Math.min(left, window.innerWidth - width - pad));
				top = Math.max(pad, Math.min(top, window.innerHeight - height - pad));
				pop.style.left = left + 'px';
				pop.style.top = top + 'px';
			}

			function close() {
				if (!open) return;
				open = false;
				picking = false;
				pop.hidden = true;
				mapPointer = null;
				huePointer = null;
				const done = onClose;
				onChange = null;
				onClose = null;
				if (done) done();
			}

			function onDocPointer(event) {
				if (!open) return;
				if (pop.contains(event.target)) return;
				if (event.target.closest && event.target.closest('.synth-swatch__face, .synth-palettes__add, .synth-palette, .synth-color__face')) return;
				close();
			}

			function onKey(event) {
				if (!open) return;
				if (event.key === 'Escape') close();
			}

			document.addEventListener('pointerdown', onDocPointer, true);
			document.addEventListener('keydown', onKey);

			return {
				node: pop,
				isOpen: function () {
					return open;
				},
				open: function (hex, anchor, change, closed) {
					onChange = change;
					onClose = closed;
					open = true;
					picking = true;
					pop.hidden = false;
					setFromHex(hex, true);
					place(anchor);
				},
				close: close,
				syncAnchor: function (anchor) {
					if (open && anchor) place(anchor);
				}
			};
		}

		const colorPicker = makeColorPicker();

		function makeColorField(op, spec) {
			const field = el('div', 'synth-field synth-field--color');
			const top = el('div', 'synth-field__top');
			top.appendChild(el('span', '', spec.label));
			const swatch = el('button', 'synth-color__face');
			swatch.type = 'button';
			swatch.setAttribute('aria-label', 'Edit ' + spec.label);
			top.appendChild(swatch);
			field.appendChild(top);

			function currentHex() {
				const found = ops().filter(function (item) {
					return item.id === op.id;
				})[0];
				const params = (found && found.parameters) || op.parameters || {};
				return params[spec.key] || '#FFFFFF';
			}

			function paint(hex) {
				const value = hex || currentHex();
				swatch.style.background = value;
				swatch.classList.toggle('is-active', colorPicker.isOpen() && pickingSlot === swatch);
			}

			let pickingSlot = null;

			swatch.addEventListener('click', function () {
				if (colorPicker.isOpen() && pickingSlot === swatch) {
					colorPicker.close();
					return;
				}
				pickingSlot = swatch;
				colorPicker.open(currentHex(), swatch, function (nextHex) {
					setParam(op.id, spec.key, nextHex);
					paint(nextHex);
				}, function () {
					pickingSlot = null;
					paint();
				});
				paint(currentHex());
			});

			paint();
			return {
				wrap: field,
				setValue: function (hex) {
					paint(hex);
					if (colorPicker.isOpen() && pickingSlot === swatch) {
						colorPicker.syncAnchor(swatch);
					}
				}
			};
		}

		function makePaletteField(op) {
			const Lookup = root.SynthLookup;
			const field = el('div', 'synth-field synth-palettes');
			const grid = el('div', 'synth-palettes__grid');
			grid.setAttribute('role', 'listbox');
			grid.setAttribute('aria-label', 'Color palettes');
			const edit = el('div', 'synth-palettes__edit');
			field.appendChild(grid);
			field.appendChild(edit);

			let activeSlot = null;

			function current() {
				const found = ops().filter(function (item) {
					return item.id === op.id;
				})[0];
				return lookupParams(found || op);
			}

			function paintChip(node, palette) {
				node.innerHTML = '';
				node.dataset.paletteId = palette.id;
				const strip = el('span', 'synth-palette__strip');
				(palette.colors || []).forEach(function (hex) {
					const band = el('span', 'synth-palette__band');
					band.style.background = hex;
					strip.appendChild(band);
				});
				node.appendChild(strip);
			}

			function renderGrid(resolved) {
				const items = Lookup ? Lookup.catalog(resolved.savedPalettes) : [];
				grid.innerHTML = '';
				items.forEach(function (palette) {
					const btn = el('button', 'synth-palette');
					btn.type = 'button';
					btn.setAttribute('role', 'option');
					btn.setAttribute('aria-label', 'Palette ' + palette.id);
					paintChip(btn, palette);
					const selected = !resolved.dirty && palette.id === resolved.paletteId;
					btn.classList.toggle('is-active', selected);
					btn.setAttribute('aria-selected', selected ? 'true' : 'false');
					btn.addEventListener('click', function () {
						if (!Lookup) return;
						patchLookup(op.id, Lookup.applyPreset(current(), palette.id));
						colorPicker.close();
					});
					grid.appendChild(btn);
				});
			}

			function swatchButton(slot, hex, label) {
				const wrap = el('div', 'synth-swatch');
				const btn = el('button', 'synth-swatch__face');
				btn.type = 'button';
				btn.dataset.slot = String(slot);
				btn.style.background = hex;
				btn.setAttribute('aria-label', 'Edit color ' + label);
				btn.addEventListener('click', function (event) {
					event.stopPropagation();
					openSlot(slot, btn);
				});
				wrap.appendChild(btn);
				wrap.appendChild(el('span', 'synth-swatch__label', label));
				return wrap;
			}

			function openSlot(slot, anchor) {
				const resolved = current();
				const hex = slot === 'bg' ? resolved.bg : resolved.colors[Number(slot)];
				activeSlot = slot;
				edit.querySelectorAll('.synth-swatch__face.is-active').forEach(function (node) {
					node.classList.remove('is-active');
				});
				anchor.classList.add('is-active');
				colorPicker.open(hex, anchor, function (nextHex) {
					if (!Lookup) return;
					patchLookup(op.id, Lookup.setSlot(current(), slot, nextHex));
					anchor.style.background = nextHex;
				}, function () {
					activeSlot = null;
					render(current());
				});
			}

			function renderEdit(resolved) {
				edit.innerHTML = '';
				const letters = (Lookup && Lookup.letters) || 'ABCD';
				(resolved.colors || []).forEach(function (hex, index) {
					edit.appendChild(swatchButton(index, hex, letters[index] || String(index + 1)));
				});
				edit.appendChild(el('span', 'synth-palettes__rule'));
				edit.appendChild(swatchButton('bg', resolved.bg, 'BG'));
				const addWrap = el('div', 'synth-swatch synth-swatch--add');
				const add = el('button', 'synth-palettes__add');
				add.type = 'button';
				add.setAttribute('aria-label', 'Save palette');
				add.appendChild(root.SynthIcons.svg('plus'));
				add.addEventListener('click', function () {
					if (!Lookup || !current().dirty) return;
					patchLookup(op.id, Lookup.saveCurrent(current()));
					colorPicker.close();
				});
				addWrap.appendChild(add);
				addWrap.appendChild(el('span', 'synth-swatch__label', '\u00a0'));
				addWrap.hidden = !resolved.dirty;
				edit.appendChild(addWrap);
			}

			function render(resolved) {
				renderGrid(resolved);
				renderEdit(resolved);
			}

			render(lookupParams(op));

			return {
				wrap: field,
				setParams: function (parameters) {
					const resolved = Lookup
						? Lookup.normalize(parameters || {})
						: parameters || {};
					if (picking) {
						const faces = edit.querySelectorAll('.synth-swatch__face');
						faces.forEach(function (btn) {
							const slot = btn.dataset.slot;
							const hex = slot === 'bg' ? resolved.bg : resolved.colors[Number(slot)];
							if (hex) btn.style.background = hex;
						});
						const addWrap = edit.querySelector('.synth-swatch--add');
						if (addWrap) addWrap.hidden = !resolved.dirty;
						return;
					}
					render(resolved);
				}
			};
		}

		function insertBtn(index, kind) {
			const isAdd = kind === 'add';
			const wrap = el('div', isAdd ? 'synth-insert synth-insert--add' : 'synth-insert synth-insert--node');
			const btn = el('button', 'synth-insert__btn');
			btn.type = 'button';
			btn.setAttribute('aria-label', 'Add operator here');
			btn.dataset.tip = 'Add operator';
			btn.dataset.tipDesc = 'Open the library and insert a new operator at this point in the stack.';
			btn.appendChild(root.SynthIcons.svg('plus'));
			if (isAdd) btn.appendChild(el('span', 'synth-insert__label', 'Add operator'));
			btn.addEventListener('click', function () {
				openLibrary(index);
			});
			bindTip(btn);
			wrap.appendChild(btn);
			return wrap;
		}

		function bindGrip(handle, opId) {
			let pointerId = null;
			let startY = 0;
			let dragging = false;

			handle.addEventListener('pointerdown', function (event) {
				if (event.button !== 0 && event.pointerType === 'mouse') return;
				pointerId = event.pointerId;
				startY = event.clientY;
				dragging = false;
				try {
					handle.setPointerCapture(event.pointerId);
				} catch (err) { /* ignore */ }
			});

			handle.addEventListener('pointermove', function (event) {
				if (event.pointerId !== pointerId) return;
				if (!dragging && Math.abs(event.clientY - startY) < 8) return;
				dragging = true;
				event.preventDefault();
				const cards = Array.prototype.slice.call(stack.querySelectorAll('.synth-op'));
				const dragCard = stack.querySelector('[data-id="' + opId + '"]');
				const g = getGsap();
				if (dragCard && g) {
					g.set(dragCard, {
						y: event.clientY - startY,
						scale: 1.03,
						zIndex: 6
					});
				}
				cards.forEach(function (card) {
					card.classList.toggle('is-drop', false);
					card.classList.toggle('is-dragging', card.dataset.id === opId);
				});
				let target = null;
				cards.forEach(function (card) {
					if (card.dataset.id === opId) return;
					const rect = card.getBoundingClientRect();
					if (event.clientY >= rect.top && event.clientY <= rect.bottom) target = card;
				});
				if (target) target.classList.add('is-drop');
			}, { passive: false });

			function finish(event) {
				if (event.pointerId !== pointerId) return;
				const cards = Array.prototype.slice.call(stack.querySelectorAll('.synth-op'));
				const dragCard = stack.querySelector('[data-id="' + opId + '"]');
				const g = getGsap();
				if (dragCard && g) {
					g.set(dragCard, { y: 0, scale: 1, zIndex: 1, clearProps: 'transform,zIndex' });
				}
				let dest = -1;
				cards.forEach(function (card, i) {
					if (card.classList.contains('is-drop')) dest = i;
					card.classList.remove('is-drop', 'is-dragging');
				});
				pointerId = null;
				if (!dragging) return;
				dragging = false;
				if (dest < 0) return;
				patchOps(root.SynthPipeline.moveTo(ops(), opId, dest));
			}

			handle.addEventListener('pointerup', finish);
			handle.addEventListener('pointercancel', finish);
		}

		function setCardOpen(card, open, animate) {
			if (!card) return;
			const body = card.querySelector('.synth-op__body');
			const caret = card.querySelector('.synth-op__caret');
			const ident = card.querySelector('.synth-op__ident');
			if (ident) ident.setAttribute('aria-expanded', open ? 'true' : 'false');
			card.classList.toggle('is-open', open);
			if (body) {
				if (open) body.removeAttribute('inert');
				else body.setAttribute('inert', '');
				body.setAttribute('aria-hidden', open ? 'false' : 'true');
			}
			const g = getGsap();
			const instant = !animate || prefersReduced();
			if (caret && g) {
				if (instant) g.set(caret, { rotation: open ? 180 : 0 });
				else g.to(caret, { rotation: open ? 180 : 0, duration: dur(0.22), ease: 'power2.out' });
			}
			if (!body) return;
			if (!g) {
				body.style.display = open ? 'block' : 'none';
				body.style.height = open ? 'auto' : '0px';
				body.style.opacity = open ? '1' : '0';
				body.style.visibility = open ? 'visible' : 'hidden';
				return;
			}
			g.set(body, { overflow: 'hidden', display: 'block' });
			const vars = { height: open ? 'auto' : 0, autoAlpha: open ? 1 : 0 };
			if (instant) g.set(body, vars);
			else g.to(body, Object.assign({
				duration: open ? dur(0.38) : dur(0.26),
				ease: open ? 'power2.out' : 'power2.in'
			}, vars));
		}

		function cameraView(op) {
			if (!root.SynthCamera || !root.SynthCamera.view) {
				return { phase: 'idle', message: '', live: false, hasDevices: false };
			}
			const source = (op.parameters && op.parameters.source) || 'display';
			return root.SynthCamera.view(source);
		}

		function makeCamPanel() {
			const wrap = el('div', 'synth-cam-panel');
			const status = el('div', 'synth-cam-status');
			status.dataset.phase = 'idle';
			status.appendChild(el('p', 'synth-cam-status__msg', 'Waiting for camera…'));
			wrap.appendChild(status);
			const reconnect = el('button', 'synth-btn synth-cam-reconnect', 'Reconnect');
			reconnect.type = 'button';
			reconnect.addEventListener('click', function () {
				if (root.SynthCamera && root.SynthCamera.reconnect) {
					root.SynthCamera.reconnect();
				}
			});
			wrap.appendChild(reconnect);
			return wrap;
		}

		function paintCamStatus(card, op) {
			if (!card || op.type !== 'camera') return;
			const view = op.bypassed
				? { phase: 'idle', message: 'Bypassed. Enable the operator to open the camera.', live: false, hasDevices: false }
				: cameraView(op);
			const status = card.querySelector('.synth-cam-status');
			if (status) {
				status.dataset.phase = view.phase || 'idle';
				const msg = status.querySelector('.synth-cam-status__msg');
				if (msg) msg.textContent = view.message || 'Waiting for camera…';
			}
			card.querySelectorAll('[data-visible-when]').forEach(function (node) {
				const when = node.dataset.visibleWhen;
				let show = true;
				if (when === 'cameraDevices') show = !!view.hasDevices;
				if (when === 'cameraLive') show = !!view.live;
				node.hidden = !show;
			});
		}

		function buildOpCard(op, index, total) {
			const def = root.SynthRegistry.get(op.type) || {};
			const color = def.color || '#8E8E8E';
			const card = el('article', 'synth-op');
			card.dataset.id = op.id;
			card.setAttribute('data-flip-id', op.id);
			card.style.setProperty('--op-color', color);
			if (op.id === expandedId) card.classList.add('is-open');
			if (op.bypassed) card.classList.add('is-bypass');

			const head = el('header', 'synth-op__head');

			const grip = el('button', 'synth-icon synth-icon--grip');
			grip.type = 'button';
			grip.setAttribute('aria-label', 'Drag to reorder');
			grip.dataset.tip = 'Reorder';
			grip.dataset.tipDesc = 'Drag this handle to change the operator order in the stack.';
			grip.appendChild(root.SynthIcons.svg('grip'));
			bindTip(grip);
			bindGrip(grip, op.id);
			head.appendChild(grip);

			const ident = el('button', 'synth-op__ident');
			ident.type = 'button';
			ident.setAttribute('aria-expanded', op.id === expandedId ? 'true' : 'false');
			ident.appendChild(el('span', 'synth-op__swatch'));
			ident.appendChild(el('span', 'synth-op__name', op.name || def.name || op.type));
			const caret = el('span', 'synth-op__caret');
			caret.appendChild(root.SynthIcons.svg('caret-down'));
			ident.appendChild(caret);
			ident.addEventListener('click', function () {
				const next = expandedId === op.id ? null : op.id;
				const prev = expandedId;
				expandedId = next;
				if (prev && prev !== next) {
					setCardOpen(stack.querySelector('[data-id="' + prev + '"]'), false, true);
				}
				setCardOpen(card, next === op.id, true);
			});
			head.appendChild(ident);

			const tools = el('div', 'synth-op__tools');

			tools.appendChild(iconBtn(
				'question',
				def.name || 'Help',
				def.help || 'Operator help',
				function () {
					openOpHelp(def);
				}
			));

			const bypassBtn = iconBtn(
				op.bypassed ? 'eye-slash' : 'eye',
				'Bypass',
				'Skip this operator. The previous image passes through unchanged.',
				function () {
					const current = ops().find(function (item) {
						return item.id === op.id;
					});
					if (!current) return;
					patchOps(root.SynthPipeline.setBypass(ops(), op.id, !current.bypassed));
				}
			);
			bypassBtn.classList.add('synth-icon--bypass');
			if (op.bypassed) bypassBtn.classList.add('is-active');
			tools.appendChild(bypassBtn);

			const upBtn = iconBtn('caret-up', 'Move up', 'Move this operator one step earlier in the stack.', function () {
				patchOps(root.SynthPipeline.move(ops(), op.id, -1));
			});
			upBtn.disabled = index === 0;
			tools.appendChild(upBtn);

			const downBtn = iconBtn('caret-down', 'Move down', 'Move this operator one step later in the stack.', function () {
				patchOps(root.SynthPipeline.move(ops(), op.id, 1));
			});
			downBtn.disabled = index === total - 1;
			tools.appendChild(downBtn);

			tools.appendChild(iconBtn('copy', 'Duplicate', 'Insert a copy of this operator directly below it.', function () {
				patchOps(root.SynthPipeline.duplicate(ops(), op.id));
			}));

			tools.appendChild(iconBtn('trash', 'Delete', 'Remove this operator from the stack.', function () {
				if (expandedId === op.id) expandedId = null;
				patchOps(root.SynthPipeline.remove(ops(), op.id));
			}));

			card.appendChild(head);

			const body = el('div', 'synth-op__body');
			const inner = el('div', 'synth-op__body-inner');
			inner.appendChild(tools);
			const params = def.params || [];
			params.forEach(function (spec) {
				if (spec.show === 'afterInput' && index === 0) return;
				if (spec.kind === 'palette') {
					const field = makePaletteField(op);
					palettes[op.id] = field;
					inner.appendChild(field.wrap);
					return;
				}
				if (spec.kind === 'color') {
					const field = makeColorField(op, spec);
					colors[op.id + ':' + spec.key] = field;
					if (spec.visibleWhen) field.wrap.dataset.visibleWhen = spec.visibleWhen;
					inner.appendChild(field.wrap);
					return;
				}
				if (spec.kind === 'enum') {
					const field = el('div', 'synth-field');
					if (spec.visibleWhen) field.dataset.visibleWhen = spec.visibleWhen;
					const fieldTop = el('div', 'synth-field__top');
					fieldTop.appendChild(el('span', '', spec.label));
					field.appendChild(fieldTop);
					const row = el('div', 'synth-row synth-row--wrap');
					row.setAttribute('role', 'group');
					row.setAttribute('aria-label', spec.label);
					let options = spec.options || [];
					if (typeof spec.options === 'function') options = spec.options(op) || [];
					if (spec.optionsFrom === 'cameraDevices' && root.SynthCamera) {
						const source = (op.parameters && op.parameters.source) || 'display';
						options = root.SynthCamera.deviceOptions(source);
					}
					options.forEach(function (opt) {
						const btn = el('button', 'synth-btn', opt.label);
						btn.type = 'button';
						btn.dataset.enumKey = spec.key;
						btn.dataset.enumValue = String(opt.id);
						btn.addEventListener('click', function () {
							setParam(op.id, spec.key, opt.id);
						});
						row.appendChild(btn);
					});
					field.appendChild(row);
					inner.appendChild(field);
					if (spec.key === 'source' && def.type === 'camera') {
						inner.appendChild(makeCamPanel());
					}
					return;
				}

				const field = makeSlider(spec.label, spec.min, spec.max, spec.step, function (value) {
					setParam(op.id, spec.key, value);
				}, {
					modulate: true,
					opId: op.id,
					paramKey: spec.key,
					spec: spec
				});
				field.wrap.dataset.param = spec.key;
				if (spec.visibleWhen) field.wrap.dataset.visibleWhen = spec.visibleWhen;
				sliders[op.id + ':' + spec.key] = field;
				inner.appendChild(field.wrap);
			});
			body.appendChild(inner);
			card.appendChild(body);
			paintCamStatus(card, op);
			return card;
		}

		function rebuildStack(pipeline) {
			const g = getGsap();
			const Flip = window.Flip;
			const prevOps = stack.querySelectorAll('.synth-op');
			const state = (g && Flip && prevOps.length) ? Flip.getState(prevOps) : null;

			Object.keys(sliders).forEach(function (key) {
				delete sliders[key];
			});
			Object.keys(palettes).forEach(function (key) {
				delete palettes[key];
			});
			Object.keys(colors).forEach(function (key) {
				delete colors[key];
			});
			colorPicker.close();
			if (g) g.killTweensOf(stack.querySelectorAll('.synth-op, .synth-op__body, .synth-op__caret'));
			stack.innerHTML = '';
			stack.classList.toggle('is-empty', !pipeline.length);
			if (!pipeline.length) {
				stack.appendChild(el('p', 'synth-stack__empty', 'Tap Add operator to start the chain.'));
				stack.appendChild(insertBtn(0, 'add'));
				if (state && Flip && g) {
					Flip.from(state, {
						duration: dur(0.32),
						ease: 'power2.inOut',
						absolute: true,
						onLeave: function (elements) {
							g.to(elements, { autoAlpha: 0, y: -8, duration: dur(0.2), ease: 'power2.in' });
						}
					});
				}
				return;
			}
			stack.appendChild(insertBtn(0, 'node'));
			pipeline.forEach(function (op, index) {
				stack.appendChild(buildOpCard(op, index, pipeline.length));
				const last = index === pipeline.length - 1;
				stack.appendChild(insertBtn(index + 1, last ? 'add' : 'node'));
			});

			const nextOps = stack.querySelectorAll('.synth-op');
			nextOps.forEach(function (card) {
				setCardOpen(card, card.dataset.id === expandedId, false);
			});

			if (state && Flip && g) {
				Flip.from(state, {
					duration: dur(0.42),
					ease: 'power2.inOut',
					absolute: true,
					simple: true,
					onEnter: function (elements) {
						g.fromTo(elements, { autoAlpha: 0, y: 16 }, {
							autoAlpha: 1,
							y: 0,
							duration: dur(0.3),
							ease: 'power2.out'
						});
					},
					onLeave: function (elements) {
						g.to(elements, { autoAlpha: 0, y: -10, duration: dur(0.22), ease: 'power2.in' });
					}
				});
			}
		}

		function refreshPreview(pipe) {
			previewName.textContent = pipe ? pipe.name : 'PIPE';
			if (liveOn && liveFrame) {
				if (previewImg.getAttribute('src') !== liveFrame) previewImg.src = liveFrame;
				previewImg.hidden = false;
				previewEmpty.hidden = true;
				return;
			}
			const url = pipe && pipe.thumbnail;
			if (url) {
				if (previewImg.getAttribute('src') !== url) previewImg.src = url;
				previewImg.hidden = false;
				previewEmpty.hidden = true;
			} else {
				previewImg.removeAttribute('src');
				previewImg.hidden = true;
				previewEmpty.hidden = false;
			}
		}

		function setLiveMode(on) {
			liveOn = !!on;
			liveBtn.classList.toggle('is-on', liveOn);
			liveBtn.setAttribute('aria-pressed', liveOn ? 'true' : 'false');
			preview.classList.toggle('is-live', liveOn);
			if (!liveOn) {
				liveFrame = '';
				previewEmpty.textContent = 'Waiting for output';
				refreshPreview(activePipe());
				return;
			}
			previewEmpty.textContent = 'Waiting for live';
			if (!liveFrame) {
				previewEmpty.hidden = false;
			}
		}

		function setPreviewFrame(url) {
			if (!url) return;
			liveFrame = url;
			if (!liveOn) return;
			if (previewImg.getAttribute('src') !== url) previewImg.src = url;
			previewImg.hidden = false;
			previewEmpty.hidden = true;
		}

		function makePipeTile(pipe, activeId) {
			const tile = el('button', 'synth-pipe-tile');
			tile.type = 'button';
			tile.dataset.pipe = pipe.id;
			tile.setAttribute('aria-pressed', pipe.id === activeId ? 'true' : 'false');
			if (pipe.id === activeId) tile.classList.add('is-active');
			const thumb = el('div', 'synth-pipe-tile__thumb');
			const img = el('img');
			img.alt = '';
			if (pipe.thumbnail) img.src = pipe.thumbnail;
			else img.hidden = true;
			thumb.appendChild(img);
			tile.appendChild(thumb);
			tile.appendChild(el('span', 'synth-pipe-tile__name', pipe.name));
			tile.addEventListener('click', function () {
				expandedId = null;
				if (typeof capturePipe === 'function') capturePipe();
				if (getState().activePipeId === pipe.id) return;
				patch({ activePipeId: pipe.id });
			});
			return tile;
		}

		function rebuildGrid(pipes, activeId) {
			grid.innerHTML = '';
			(pipes || []).forEach(function (pipe) {
				grid.appendChild(makePipeTile(pipe, activeId));
			});
			const add = el('button', 'synth-pipe-tile synth-pipe-tile--new');
			add.type = 'button';
			add.setAttribute('aria-label', 'New PIPE');
			const plusWrap = el('span', 'synth-pipe-tile__plus');
			plusWrap.appendChild(root.SynthIcons.svg('plus'));
			add.appendChild(plusWrap);
			add.appendChild(el('span', 'synth-pipe-tile__name', 'New PIPE'));
			add.addEventListener('click', function () {
				const s = getState();
				const pipe = root.SynthPipes.createNew(s.pipes);
				expandedId = null;
				patch({
					pipes: (s.pipes || []).concat([pipe]),
					activePipeId: pipe.id
				});
			});
			grid.appendChild(add);
		}

		function refreshThumbs(pipes) {
			(pipes || []).forEach(function (pipe) {
				const tile = grid.querySelector('[data-pipe="' + pipe.id + '"]');
				if (!tile) return;
				const img = tile.querySelector('img');
				if (!img) return;
				if (pipe.thumbnail) {
					if (img.getAttribute('src') !== pipe.thumbnail) img.src = pipe.thumbnail;
					img.hidden = false;
				} else {
					img.removeAttribute('src');
					img.hidden = true;
				}
			});
		}

		function refresh() {
			const s = getState();
			const pipes = s.pipes || [];
			const pipeline = ops();
			const gsig = gridSignature(pipes, s.activePipeId);
			if (gsig !== lastGridSig) {
				lastGridSig = gsig;
				rebuildGrid(pipes, s.activePipeId);
			} else {
				refreshThumbs(pipes);
				pipes.forEach(function (pipe) {
					const tile = grid.querySelector('[data-pipe="' + pipe.id + '"]');
					if (!tile) return;
					tile.classList.toggle('is-active', pipe.id === s.activePipeId);
					tile.setAttribute('aria-pressed', pipe.id === s.activePipeId ? 'true' : 'false');
				});
			}

			const pipe = activePipe();
			if (!renaming) {
				activeName.textContent = pipe ? pipe.name : 'PIPE';
			}
			refreshPreview(pipe);
			deletePipeBtn.disabled = pipes.length <= 1;

			const signature = pipelineSignature(pipeline) + ':' + String(s.activePipeId || '') + ':' + (
				root.SynthCamera && root.SynthCamera.signature ? root.SynthCamera.signature() : ''
			);
			if (signature !== lastSignature) {
				lastSignature = signature;
				rebuildStack(pipeline);
			}

			if (!sliding) {
				pipeline.forEach(function (op) {
					const card = stack.querySelector('[data-id="' + op.id + '"]');
					if (!card) return;
					card.classList.toggle('is-bypass', !!op.bypassed);
					const bypassBtn = card.querySelector('.synth-icon--bypass');
					if (bypassBtn) {
						bypassBtn.classList.toggle('is-active', !!op.bypassed);
						bypassBtn.innerHTML = '';
						bypassBtn.appendChild(root.SynthIcons.svg(op.bypassed ? 'eye-slash' : 'eye'));
					}

					Object.keys(op.parameters || {}).forEach(function (key) {
						const slider = sliders[op.id + ':' + key];
						if (slider) {
							const mod = (op.modulations || {})[key];
							if (slider.setMod) slider.setMod(mod);
							if (!(mod && mod.enabled)) slider.setValue(op.parameters[key]);
						}
						const colorField = colors[op.id + ':' + key];
						if (colorField && colorField.setValue) {
							colorField.setValue(op.parameters[key]);
						}
					});

					const paletteField = palettes[op.id];
					if (paletteField && paletteField.setParams) {
						paletteField.setParams(op.parameters);
					}

					card.querySelectorAll('[data-enum-key]').forEach(function (btn) {
						const key = btn.dataset.enumKey;
						btn.classList.toggle(
							'is-active',
							String(op.parameters[key]) === String(btn.dataset.enumValue)
						);
					});
					paintCamStatus(card, op);
				});
			}

			const dbgOn = !!(s.debug && s.debug.enabled);
			debugToggle.textContent = dbgOn ? 'On' : 'Off';
			debugToggle.classList.toggle('is-active', dbgOn);
			debugToggle.setAttribute('aria-pressed', dbgOn ? 'true' : 'false');
			debugStats.hidden = !dbgOn;

			if (root.SynthClock) {
				bpmVal.textContent = String(Math.round(root.SynthClock.fromState(s).bpm));
			}
		}

		function tick() {
			if (!root.SynthClock) return;
			const s = getState();
			const clock = root.SynthClock.fromState(s);
			const nowMs = Date.now();
			const beat = root.SynthClock.beatInBar(clock, nowMs);
			bpmVal.textContent = String(Math.round(clock.bpm));
			tapBtn.setAttribute('aria-valuenow', String(Math.round(clock.bpm)));
			beatCells.forEach(function (cell, i) {
				cell.classList.toggle('is-on', i === beat);
			});
			if (beat !== lastBeat) {
				lastBeat = beat;
				const onCell = beatCells[beat];
				const g = getGsap();
				if (onCell && g && !prefersReduced()) {
					g.fromTo(onCell, { scale: 1.18 }, {
						scale: 1,
						duration: dur(0.14),
						ease: 'power2.out'
					});
				}
			}

			const pipeline = ops();
			if (root.SynthModulate && root.SynthFft && root.SynthModulate.usesFft(pipeline)) {
				root.SynthFft.ensure();
			}

			const ctx = {
				nowMs: nowMs,
				clock: clock,
				fft: root.SynthFft ? root.SynthFft.levels() : null
			};
			Object.keys(sliders).forEach(function (id) {
				const slider = sliders[id];
				if (slider && slider.updateLive) slider.updateLive(ctx);
			});
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

		window.addEventListener('keydown', function (event) {
			if (event.key !== 'Escape' || sheet.hidden) return;
			closeSheet();
		});

		refresh();
		return {
			refresh: refresh,
			refreshStats: refreshStats,
			setPreviewFrame: setPreviewFrame,
			setLiveMode: setLiveMode,
			tick: tick
		};
	}

	root.SynthUI = { mount: mount };
})(window);
