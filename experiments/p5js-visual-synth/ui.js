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
		let lastSignature = null;
		let lastGridSig = null;
		let sliding = false;
		let renaming = false;
		let expandedId = null;
		let libInsertAt = 0;
		const sliders = {};

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
			'PIPE and operators',
			'A PIPE is a reusable chain of operators. The grid picks a PIPE; the stack below edits it.',
			openTypesHelp
		));

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

		function closeSheet() {
			sheet.hidden = true;
			sheetBody.innerHTML = '';
			hideTip();
		}

		function openSheet(title) {
			sheetTitle.textContent = title;
			sheet.hidden = false;
			sheet.scrollTop = 0;
		}

		function openTypesHelp() {
			openSheet('Operator types');
			sheetBody.innerHTML = '';
			const intro = el(
				'p',
				'synth-help__lead',
				'A PIPE is a reusable visual processing chain. Pick one in the grid, then edit its ordered operators. Each operator reads what came before, does one job, and passes a new image down.'
			);
			sheetBody.appendChild(intro);
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
				patchOps(root.SynthPipeline.add(ops(), def.type, libInsertAt));
				closeSheet();
			});
			return chip;
		}

		function makeSlider(label, min, max, step, onChange) {
			const bipolar = min < 0 && max > 0;
			const wrap = el('div', bipolar ? 'synth-field synth-field--bipolar' : 'synth-field');
			const topRow = el('div', 'synth-field__top');
			topRow.appendChild(el('span', '', label));
			const valueEl = el('span', 'synth-field__value', '');
			topRow.appendChild(valueEl);

			const slider = el('div', bipolar ? 'synth-slider synth-slider--bipolar' : 'synth-slider');
			slider.setAttribute('role', 'slider');
			slider.setAttribute('aria-label', label);
			slider.setAttribute('aria-valuemin', String(min));
			slider.setAttribute('aria-valuemax', String(max));
			slider.tabIndex = 0;
			const track = el('div', 'synth-slider__track');
			const fill = el('div', 'synth-slider__fill');
			const thumb = el('div', 'synth-slider__thumb');
			track.appendChild(fill);
			if (bipolar) track.appendChild(el('div', 'synth-slider__zero'));
			track.appendChild(thumb);
			slider.appendChild(track);
			wrap.appendChild(topRow);
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

			function posFromValue(value) {
				if (!bipolar) return (value - min) / (max - min || 1);
				if (value < 0) return 0.5 * (value - min) / (0 - min || 1);
				return 0.5 + 0.5 * value / (max || 1);
			}

			function formatDisplay(value) {
				const text = formatValue(value, step);
				if (bipolar && value > 0) return '+' + text;
				return text;
			}

			function render() {
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
				slider.setAttribute('aria-valuenow', String(current));
				slider.setAttribute('aria-valuetext', formatDisplay(current));
			}

			function valueFromX(clientX) {
				const rect = track.getBoundingClientRect();
				const t = rect.width ? Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) : 0;
				if (!bipolar) return clamp(min + t * (max - min));
				if (t < 0.5) return clamp(min + (t / 0.5) * (0 - min));
				return clamp((t - 0.5) / 0.5 * max);
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
						sliding = true;
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
				sliding = false;
			});

			window.addEventListener('pointercancel', function (event) {
				if (event.pointerId !== pointerId) return;
				pointerId = null;
				intent = null;
				sliding = false;
			});

			slider.addEventListener('keydown', function (event) {
				let next = current;
				if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = current + step;
				else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = current - step;
				else return;
				event.preventDefault();
				sliding = true;
				commit(next, true);
				sliding = false;
			});

			render();
			return {
				wrap: wrap,
				step: step,
				setValue: function (value) {
					current = clamp(value);
					render();
				}
			};
		}

		function setParam(id, key, value) {
			patch({ opParam: { id: id, key: key, value: value } });
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
				cards.forEach(function (card) {
					card.classList.toggle('is-drop', false);
					card.classList.toggle('is-dragging', card.dataset.id === opId);
				});
				let target = null;
				cards.forEach(function (card) {
					const rect = card.getBoundingClientRect();
					if (event.clientY >= rect.top && event.clientY <= rect.bottom) target = card;
				});
				if (target && target.dataset.id !== opId) target.classList.add('is-drop');
			}, { passive: false });

			function finish(event) {
				if (event.pointerId !== pointerId) return;
				const cards = Array.prototype.slice.call(stack.querySelectorAll('.synth-op'));
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

		function buildOpCard(op, index, total) {
			const def = root.SynthRegistry.get(op.type) || {};
			const color = def.color || '#8E8E8E';
			const card = el('article', 'synth-op');
			card.dataset.id = op.id;
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
			caret.appendChild(root.SynthIcons.svg(op.id === expandedId ? 'caret-up' : 'caret-down'));
			ident.appendChild(caret);
			ident.addEventListener('click', function () {
				expandedId = expandedId === op.id ? null : op.id;
				lastSignature = null;
				refresh();
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
			body.appendChild(tools);
			const params = def.params || [];
			params.forEach(function (spec) {
				if (spec.show === 'afterInput' && index === 0) return;
				if (spec.kind === 'enum') {
					const field = el('div', 'synth-field');
					const fieldTop = el('div', 'synth-field__top');
					fieldTop.appendChild(el('span', '', spec.label));
					field.appendChild(fieldTop);
					const row = el('div', 'synth-row synth-row--wrap');
					row.setAttribute('role', 'group');
					row.setAttribute('aria-label', spec.label);
					spec.options.forEach(function (opt) {
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
					body.appendChild(field);
					return;
				}

				const field = makeSlider(spec.label, spec.min, spec.max, spec.step, function (value) {
					setParam(op.id, spec.key, value);
				});
				field.wrap.dataset.param = spec.key;
				sliders[op.id + ':' + spec.key] = field;
				body.appendChild(field.wrap);
			});
			card.appendChild(body);
			return card;
		}

		function rebuildStack(pipeline) {
			Object.keys(sliders).forEach(function (key) {
				delete sliders[key];
			});
			stack.innerHTML = '';
			stack.classList.toggle('is-empty', !pipeline.length);
			if (!pipeline.length) {
				stack.appendChild(el('p', 'synth-stack__empty', 'Tap Add operator to start the chain.'));
				stack.appendChild(insertBtn(0, 'add'));
				return;
			}
			stack.appendChild(insertBtn(0, 'node'));
			pipeline.forEach(function (op, index) {
				stack.appendChild(buildOpCard(op, index, pipeline.length));
				const last = index === pipeline.length - 1;
				stack.appendChild(insertBtn(index + 1, last ? 'add' : 'node'));
			});
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
			deletePipeBtn.disabled = pipes.length <= 1;

			const signature = pipelineSignature(pipeline) + ':' + String(expandedId) + ':' + String(s.activePipeId || '');
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
						if (slider) slider.setValue(op.parameters[key]);
					});

					card.querySelectorAll('[data-enum-key]').forEach(function (btn) {
						const key = btn.dataset.enumKey;
						btn.classList.toggle(
							'is-active',
							String(op.parameters[key]) === String(btn.dataset.enumValue)
						);
					});
				});
			}

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

		window.addEventListener('keydown', function (event) {
			if (event.key !== 'Escape' || sheet.hidden) return;
			closeSheet();
		});

		refresh();
		return { refresh: refresh, refreshStats: refreshStats };
	}

	root.SynthUI = { mount: mount };
})(window);
