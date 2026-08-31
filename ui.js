(function (root) {
	function fpsTone(fps) {
		if (!(fps >= 0)) return '';
		if (fps >= 20) return 'ok';
		if (fps >= 15) return 'warn';
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

	function formatMs(ms) {
		if (!(ms >= 0) || !isFinite(ms)) return '-';
		if (ms >= 100) return Math.round(ms) + 'ms';
		if (ms >= 10) return ms.toFixed(0) + 'ms';
		return ms.toFixed(1) + 'ms';
	}

	function formatSize(size) {
		if (!size || !(size.w > 0) || !(size.h > 0)) return '-';
		return Math.round(size.w) + '\u00d7' + Math.round(size.h);
	}

	function nextLoadLevel(fps, prev) {
		if (!(fps >= 1)) return prev || 0;
		if (fps < 10) return 2;
		if (fps < 12 && prev >= 2) return 2;
		if (fps < 15) return 1;
		if (fps < 17 && prev >= 1) return 1;
		return 0;
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

	function gridSignature(gallery, pipes, templates) {
		if (gallery === 'templates') {
			return 'tpl|' + (templates || []).map(function (item) {
				return item.id + ':' + item.name;
			}).join('|');
		}
		return 'set|' + (pipes || []).map(function (pipe) {
			return pipe.id + ':' + pipe.name;
		}).join('|');
	}

	function mount(rootEl, options) {
		const getState = options.getState;
		const patch = options.patch;
		const capturePipe = options.capturePipe;
		const captureTemplates = options.captureTemplates;
		const setLivePreview = options.setLivePreview;
		const setLocalPreview = options.setLocalPreview;
		let lastSignature = null;
		let lastGridSig = null;
		let sliding = false;
		let picking = false;
		let renaming = false;
		let expandedId = null;
		let expandedMaskId = null;
		let lastMaskSig = null;
		let galleryMode = 'set';
		let selectedTemplateId = '';
		let activeStage = 'pipeline';
		let libInsertAt = 0;
		let liveOn = false;
		let localOn = false;
		let liveFrame = '';
		let liveFrameId = '';
		let previewSeq = 0;
		let lastStats = null;
		let loadLevel = 0;
		const sliders = {};
		const outSliders = {};
		const palettes = {};
		const ramps = {};
		const presetFields = {};
		const colors = {};

		function activePipe() {
			return root.SynthPipes ? root.SynthPipes.active(getState()) : null;
		}

		function viewingTemplate() {
			return galleryMode === 'templates';
		}

		function ops() {
			const pipe = activePipe();
			return (pipe && pipe.operators) || [];
		}

		function hasLiveCamera(operators) {
			return (operators || []).some(function (op) {
				return op && op.type === 'camera' && !op.bypassed;
			});
		}

		function armCameraFromOperators(operators) {
			if (!hasLiveCamera(operators) || !root.SynthCamera || !root.SynthCamera.armFromOperators) return;
			root.SynthCamera.armFromOperators(operators);
		}

		function cameraBecameLive(prev, next) {
			const live = {};
			(prev || []).forEach(function (op) {
				if (op && op.type === 'camera' && !op.bypassed) live[op.id] = true;
			});
			return (next || []).some(function (op) {
				return op && op.type === 'camera' && !op.bypassed && !live[op.id];
			});
		}

		function patchOps(operators) {
			if (viewingTemplate()) return;
			if (cameraBecameLive(ops(), operators)) armCameraFromOperators(operators);
			patch({ operators: operators });
		}

		rootEl.innerHTML = '';

		const preview = el('section', 'synth-preview');
		preview.setAttribute('aria-label', 'Chain output preview');
		const previewFrame = el('div', 'synth-preview__frame');
		const previewImg = el('img');
		previewImg.alt = '';
		previewImg.hidden = true;
		previewImg.draggable = false;
		previewImg.decoding = 'async';
		const previewEmpty = el('p', 'synth-preview__empty', 'Waiting for output');
		const previewName = el('p', 'synth-preview__name', 'Chain');
		previewFrame.appendChild(previewImg);
		previewFrame.appendChild(previewEmpty);
		previewFrame.appendChild(previewName);
		const previewModes = el('div', 'synth-preview__modes');
		const liveBtn = el('button', 'synth-preview__live', 'Live');
		liveBtn.type = 'button';
		liveBtn.setAttribute('aria-pressed', 'false');
		liveBtn.setAttribute('aria-label', 'Toggle live preview from the renderer');
		liveBtn.addEventListener('click', function () {
			const next = !liveOn;
			if (next) setLocalMode(false, true);
			setLiveMode(next);
			if (typeof setLivePreview === 'function') setLivePreview(next);
		});
		previewModes.appendChild(liveBtn);
		let localBtn = null;
		if (document.body.classList.contains('synth-control')) {
			localBtn = el('button', 'synth-preview__live synth-preview__local', 'Local');
			localBtn.type = 'button';
			localBtn.setAttribute('aria-pressed', 'false');
			localBtn.setAttribute('aria-label', 'Run this chain on this device');
			localBtn.addEventListener('click', function () {
				const next = !localOn;
				if (next) {
					setLiveMode(false);
					if (typeof setLivePreview === 'function') setLivePreview(false);
				}
				setLocalMode(next, true);
			});
			previewModes.appendChild(localBtn);
		}
		previewFrame.appendChild(previewModes);
		preview.appendChild(previewFrame);
		rootEl.appendChild(preview);
		if (document.body.classList.contains('synth-control') && root.SynthPreview && SynthPreview.attach) {
			SynthPreview.attach(previewFrame);
		}

		const panelBody = el('div', 'synth-panel__body');
		rootEl.appendChild(panelBody);

		const top = el('div', 'synth-panel__top');
		top.appendChild(el('p', 'synth-panel__mark', 'ELO'));
		panelBody.appendChild(top);

		const pipesSec = el('section', 'synth-pipes');
		const galleryTabs = el('div', 'synth-gallery-tabs');
		galleryTabs.setAttribute('role', 'tablist');
		galleryTabs.setAttribute('aria-label', 'Chain collections');
		const galleryTabBtns = {};
		[
			{ id: 'set', label: 'Set' },
			{ id: 'templates', label: 'Templates' }
		].forEach(function (tab) {
			const btn = el('button', 'synth-gallery-tab', tab.label);
			btn.type = 'button';
			btn.setAttribute('role', 'tab');
			btn.setAttribute('aria-selected', tab.id === 'set' ? 'true' : 'false');
			if (tab.id === 'set') btn.classList.add('is-active');
			btn.dataset.gallery = tab.id;
			btn.addEventListener('pointerdown', function (event) {
				if (event.pointerType === 'mouse') return;
				event.preventDefault();
			});
			btn.addEventListener('click', function () {
				setGalleryMode(tab.id);
			});
			galleryTabBtns[tab.id] = btn;
			galleryTabs.appendChild(btn);
		});
		pipesSec.appendChild(galleryTabs);
		const grid = el('div', 'synth-pipe-grid');
		grid.setAttribute('aria-label', 'SET');
		pipesSec.appendChild(grid);
		const galleryActions = el('div', 'synth-pipe-gallery-actions');
		galleryActions.hidden = true;
		pipesSec.appendChild(galleryActions);
		panelBody.appendChild(pipesSec);

		const activeBar = el('section', 'synth-pipe-active');
		const activeHead = el('header', 'synth-pipe-active__head');
		const activeName = el('h2', 'synth-pipe-active__name', 'Chain');
		activeName.tabIndex = 0;
		activeName.setAttribute('role', 'button');
		activeName.setAttribute('aria-label', 'Rename chain');
		activeHead.appendChild(activeName);
		const activeTools = el('div', 'synth-pipe-active__tools');
		activeHead.appendChild(activeTools);
		activeBar.appendChild(activeHead);
		panelBody.appendChild(activeBar);

		const stack = el('div', 'synth-stack');
		stack.setAttribute('aria-label', 'Operator chain');
		panelBody.appendChild(stack);

		const sysSlot = document.getElementById('synth-sys-slot');
		const dualFps = document.body.classList.contains('synth-control');
		let fpsVal = null;
		let phoneFpsVal = null;
		let tempVal = null;
		let drawVal = null;
		let sizeVal = null;
		let sysWarn = null;
		if (sysSlot) {
			sysSlot.innerHTML = '';
			const sys = el('div', 'synth-sys');
			sys.setAttribute('aria-label', dualFps ? 'Pi and phone performance' : 'System performance');
			const sysRow = el('div', 'synth-sys__row');
			const makeSysCell = function (key, hint) {
				const cell = el('div', 'synth-sys__cell');
				const label = el('span', 'synth-sys__key', key);
				if (hint) label.title = hint;
				cell.appendChild(label);
				const val = el('span', 'synth-meter', '-');
				if (hint) val.setAttribute('aria-label', hint);
				cell.appendChild(val);
				sysRow.appendChild(cell);
				return val;
			};
			fpsVal = makeSysCell(
				dualFps ? 'Pi' : 'Fps',
				dualFps ? 'Raspberry Pi output frames per second' : 'Frames per second'
			);
			if (dualFps) {
				phoneFpsVal = makeSysCell('Phone', 'This phone preview frames per second');
			}
			tempVal = makeSysCell('Cpu', dualFps ? 'Raspberry Pi CPU temperature' : 'CPU temperature');
			drawVal = makeSysCell('Ms', dualFps ? 'Raspberry Pi frame time' : 'Frame time');
			sizeVal = makeSysCell('Out', dualFps ? 'Raspberry Pi output size' : 'Output size');
			sys.appendChild(sysRow);
			sysWarn = el('p', 'synth-sys__warn');
			sysWarn.hidden = true;
			sysWarn.setAttribute('role', 'status');
			sysWarn.setAttribute('aria-live', 'polite');
			sysSlot.appendChild(sys);
			const warnHost = document.querySelector('.synth-ui') || document.body;
			warnHost.appendChild(sysWarn);
		}

		const sheetHost = el('div', 'synth-sheet-host');
		sheetHost.hidden = true;
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
		sheetHost.appendChild(sheet);
		if (document.body.classList.contains('synth-control')) {
			document.body.appendChild(sheetHost);
		} else {
			rootEl.appendChild(sheetHost);
		}

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
			btn.addEventListener('click', function (event) {
				event.preventDefault();
				event.stopPropagation();
				if (onClick) onClick(event);
			});
			bindTip(btn);
			return btn;
		}

		function paintBypassIcon(btn, bypassed) {
			if (!btn) return;
			const on = !!bypassed;
			btn.classList.toggle('is-active', on);
			const key = on ? '1' : '0';
			if (btn.dataset.bypassed === key) return;
			btn.dataset.bypassed = key;
			btn.innerHTML = '';
			btn.appendChild(root.SynthIcons.svg(on ? 'eye-slash' : 'eye'));
		}

		top.appendChild(iconBtn(
			'question',
			'About ELO',
			'What this instrument is, and how operators and chains work.',
			openTypesHelp
		));
		const helpSlot = document.getElementById('synth-help-slot');
		if (helpSlot) {
			helpSlot.appendChild(top.lastElementChild);
		}

		const stageTabs = el('div', 'synth-stage-tabs');
		stageTabs.setAttribute('role', 'tablist');
		stageTabs.setAttribute('aria-label', 'Output stages');
		const tabBtns = {};
		const stagePanels = {};
		[
			{ id: 'pipeline', label: 'Chain' },
			{ id: 'mask', label: 'Mask' },
			{ id: 'mapping', label: 'Mapping' }
		].forEach(function (tab) {
			const btn = el('button', 'synth-stage-tab', tab.label);
			btn.type = 'button';
			btn.setAttribute('role', 'tab');
			btn.setAttribute('aria-selected', tab.id === 'pipeline' ? 'true' : 'false');
			btn.dataset.stage = tab.id;
			btn.addEventListener('click', function () {
				setActiveStage(tab.id);
			});
			tabBtns[tab.id] = btn;
			stageTabs.appendChild(btn);
		});

		const stagePipeline = el('div', 'synth-stage-panel');
		stagePipeline.dataset.stage = 'pipeline';
		stagePipeline.setAttribute('role', 'tabpanel');
		stagePipeline.appendChild(activeBar);
		stagePipeline.appendChild(stack);
		stagePanels.pipeline = stagePipeline;

		const stageMask = el('section', 'synth-stage-panel synth-sec synth-sec--mask');
		stageMask.dataset.stage = 'mask';
		stageMask.setAttribute('role', 'tabpanel');
		stageMask.hidden = true;
		stagePanels.mask = stageMask;

		const maskHead = el('header', 'synth-sec__head');
		const maskToggles = el('div', 'synth-map__mask-toggles');
		const maskToggle = el('button', 'synth-btn synth-toggle', 'On');
		maskToggle.type = 'button';
		maskToggle.setAttribute('aria-pressed', 'true');
		maskToggle.addEventListener('click', function () {
			const masks = outputState().masks;
			patch({ output: { masks: { enabled: !masks.enabled } } });
		});
		const maskInvert = el('button', 'synth-btn', 'Invert');
		maskInvert.type = 'button';
		maskInvert.setAttribute('aria-pressed', 'false');
		maskInvert.addEventListener('click', function () {
			const masks = outputState().masks;
			patch({ output: { masks: { invert: !masks.invert } } });
		});
		maskToggles.appendChild(maskToggle);
		maskToggles.appendChild(maskInvert);
		maskHead.appendChild(maskToggles);
		stageMask.appendChild(maskHead);

		const maskAdd = el('div', 'synth-map__add');
		const addRect = el('button', 'synth-btn synth-map__add-btn');
		addRect.type = 'button';
		addRect.appendChild(root.SynthIcons.svg('square'));
		addRect.appendChild(el('span', '', 'Rect'));
		addRect.addEventListener('click', function () {
			addOutputMask('rect');
		});
		const addCircle = el('button', 'synth-btn synth-map__add-btn');
		addCircle.type = 'button';
		addCircle.appendChild(root.SynthIcons.svg('circle'));
		addCircle.appendChild(el('span', '', 'Circle'));
		addCircle.addEventListener('click', function () {
			addOutputMask('circle');
		});
		maskAdd.appendChild(addRect);
		maskAdd.appendChild(addCircle);
		stageMask.appendChild(maskAdd);

		const maskList = el('div', 'synth-map-list');
		stageMask.appendChild(maskList);

		const stageMap = el('section', 'synth-stage-panel synth-sec synth-sec--map');
		stageMap.dataset.stage = 'mapping';
		stageMap.setAttribute('role', 'tabpanel');
		stageMap.hidden = true;
		stagePanels.mapping = stageMap;

		const mapHead = el('header', 'synth-sec__head');
		mapHead.appendChild(el('h2', 'synth-sec__label', 'Corner Pin'));
		const mapToggle = el('button', 'synth-btn synth-toggle', 'On');
		mapToggle.type = 'button';
		mapToggle.setAttribute('aria-pressed', 'true');
		mapToggle.addEventListener('click', function () {
			const mapping = outputState().mapping;
			patch({ output: { mapping: { enabled: !mapping.enabled } } });
		});
		mapHead.appendChild(mapToggle);
		stageMap.appendChild(mapHead);

		const mapTools = el('div', 'synth-map__tools');
		const mapEdit = el('button', 'synth-btn', 'Edit');
		mapEdit.type = 'button';
		mapEdit.setAttribute('aria-pressed', 'false');
		mapEdit.addEventListener('click', function () {
			const mapping = outputState().mapping;
			patch({ output: { mapping: { edit: !mapping.edit } } });
		});
		const mapReset = el('button', 'synth-btn', 'Reset');
		mapReset.type = 'button';
		mapReset.addEventListener('click', function () {
			if (!root.SynthOutput) return;
			patch({ output: { mapping: { corners: root.SynthOutput.identityCorners(), edit: outputState().mapping.edit } } });
		});
		mapTools.appendChild(mapEdit);
		mapTools.appendChild(mapReset);
		stageMap.appendChild(mapTools);

		const mapPad = makeMapPad();
		stageMap.appendChild(mapPad.wrap);

		const cardRow = el('div', 'synth-map__tools');
		cardRow.appendChild(el('p', 'synth-map__mode', 'Template card'));
		const cardToggle = el('button', 'synth-btn synth-toggle', 'Off');
		cardToggle.type = 'button';
		cardToggle.setAttribute('aria-pressed', 'false');
		cardToggle.addEventListener('click', function () {
			const mapping = outputState().mapping;
			patch({ output: { mapping: { template: !mapping.template } } });
		});
		cardRow.appendChild(cardToggle);
		stageMap.appendChild(cardRow);
		stageMap.appendChild(el('p', 'synth-sec__hint', 'Covers the chain so you can pin corners to the display.'));

		rootEl.appendChild(stageTabs);
		rootEl.appendChild(stagePipeline);
		rootEl.appendChild(stageMask);
		rootEl.appendChild(stageMap);

		function setActiveStage(id) {
			activeStage = id === 'mask' || id === 'mapping' ? id : 'pipeline';
			Object.keys(tabBtns).forEach(function (key) {
				const on = key === activeStage;
				tabBtns[key].classList.toggle('is-active', on);
				tabBtns[key].setAttribute('aria-selected', on ? 'true' : 'false');
			});
			Object.keys(stagePanels).forEach(function (key) {
				stagePanels[key].hidden = key !== activeStage;
			});
		}

		function setEditorHidden(hidden) {
			rootEl.classList.toggle('is-templates', !!hidden);
			stageTabs.hidden = !!hidden;
			if (hidden) {
				Object.keys(stagePanels).forEach(function (key) {
					stagePanels[key].hidden = true;
				});
				return;
			}
			setActiveStage(activeStage);
		}

		setActiveStage('pipeline');

		function outputState() {
			return root.SynthOutput
				? root.SynthOutput.fromState(getState())
				: { mapping: { enabled: true, edit: false, corners: { tl: { x: 0, y: 0 }, tr: { x: 1, y: 0 }, br: { x: 1, y: 1 }, bl: { x: 0, y: 1 } } }, masks: { enabled: true, invert: false, items: [] } };
		}

		function addOutputMask(type) {
			if (!root.SynthOutput) return;
			const result = root.SynthOutput.addMask(outputState().masks, type);
			expandedMaskId = result.added.id;
			if (root.SynthOutputOverlayApi) root.SynthOutputOverlayApi.setSelected(expandedMaskId);
			patch({ output: { masks: result.masks } });
		}

		function makeMapPad() {
			const NS = 'http://www.w3.org/2000/svg';
			const keys = ['tl', 'tr', 'br', 'bl'];
			const wrap = el('div', 'synth-map-pad');
			wrap.setAttribute('role', 'application');
			wrap.setAttribute('aria-label', 'Corner pin');
			const svg = document.createElementNS(NS, 'svg');
			svg.setAttribute('viewBox', '0 0 1 1');
			svg.setAttribute('preserveAspectRatio', 'none');
			svg.setAttribute('class', 'synth-map-pad__svg');
			const poly = document.createElementNS(NS, 'polygon');
			poly.setAttribute('class', 'synth-map-pad__quad');
			svg.appendChild(poly);
			wrap.appendChild(svg);
			const handleEls = {};
			let dragKey = null;
			let pointerId = null;
			let liveCorners = null;

			function destFromEvent(event) {
				const rect = wrap.getBoundingClientRect();
				return {
					x: Math.min(1.15, Math.max(-0.15, (event.clientX - rect.left) / Math.max(rect.width, 1))),
					y: Math.min(1.15, Math.max(-0.15, (event.clientY - rect.top) / Math.max(rect.height, 1)))
				};
			}

			function paintCorners(corners) {
				const c = corners || outputState().mapping.corners;
				const pts = keys.map(function (key) {
					const pt = c[key];
					handleEls[key].style.left = (pt.x * 100) + '%';
					handleEls[key].style.top = (pt.y * 100) + '%';
					return pt.x + ',' + pt.y;
				});
				poly.setAttribute('points', pts.join(' '));
			}

			function canEdit() {
				return !!(outputState().mapping && outputState().mapping.edit);
			}

			function applyDrag(event) {
				if (!dragKey || !root.SynthOutput) return;
				const dest = destFromEvent(event);
				liveCorners = liveCorners || JSON.parse(JSON.stringify(outputState().mapping.corners));
				liveCorners[dragKey] = { x: dest.x, y: dest.y };
				paintCorners(liveCorners);
				const mapping = root.SynthOutput.setCorner(outputState().mapping, dragKey, dest.x, dest.y);
				mapping.edit = true;
				patch({ output: { mapping: mapping } });
			}

			function endDrag(event) {
				if (event.pointerId !== pointerId) return;
				if (handleEls[dragKey]) handleEls[dragKey].classList.remove('is-drag');
				dragKey = null;
				pointerId = null;
				liveCorners = null;
				sliding = false;
			}

			keys.forEach(function (key) {
				const btn = el('button', 'synth-map-pad__h');
				btn.type = 'button';
				btn.dataset.corner = key;
				btn.setAttribute('aria-label', key.toUpperCase() + ' corner');
				btn.addEventListener('pointerdown', function (event) {
					if (!canEdit()) return;
					if (event.button !== 0 && event.pointerType === 'mouse') return;
					dragKey = key;
					pointerId = event.pointerId;
					sliding = true;
					liveCorners = JSON.parse(JSON.stringify(outputState().mapping.corners));
					btn.classList.add('is-drag');
					try {
						btn.setPointerCapture(event.pointerId);
					} catch (err) { /* ignore */ }
					event.preventDefault();
					applyDrag(event);
				});
				btn.addEventListener('pointermove', function (event) {
					if (event.pointerId !== pointerId) return;
					event.preventDefault();
					applyDrag(event);
				});
				btn.addEventListener('pointerup', endDrag);
				btn.addEventListener('pointercancel', endDrag);
				handleEls[key] = btn;
				wrap.appendChild(btn);
			});

			return {
				wrap: wrap,
				setCorners: paintCorners,
				setLocked: function (locked) {
					wrap.classList.toggle('is-locked', !!locked);
				}
			};
		}

		function maskSignature(masks) {
			return (masks.items || []).map(function (item) {
				return item.id + ':' + item.type;
			}).join('|');
		}

		function setMaskOpen(card, open, animate) {
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
				return;
			}
			g.set(body, { overflow: 'hidden', display: 'block' });
			const vars = { height: open ? 'auto' : 0, autoAlpha: open ? 1 : 0 };
			if (instant) {
				g.set(body, vars);
				if (open) g.set(body, { height: 'auto' });
				return;
			}
			g.to(body, Object.assign({
				duration: open ? dur(0.32) : dur(0.22),
				ease: open ? 'power2.out' : 'power2.in',
				onComplete: function () {
					if (open) g.set(body, { height: 'auto' });
				}
			}, vars));
		}

		function patchMask(id, partial) {
			if (!root.SynthOutput) return;
			patch({ output: { masks: root.SynthOutput.updateMask(outputState().masks, id, partial) } });
		}

		function buildMaskCard(item) {
			const card = el('article', 'synth-op synth-mask');
			card.dataset.id = item.id;
			card.style.setProperty('--op-color', '#8E8E8E');
			const head = el('header', 'synth-op__head');
			const ident = el('button', 'synth-op__ident synth-mask__ident');
			ident.type = 'button';
			ident.setAttribute('aria-expanded', 'false');
			const mark = el('span', 'synth-mask__mark');
			mark.appendChild(root.SynthIcons.svg(item.type === 'circle' ? 'circle' : 'square'));
			ident.appendChild(mark);
			ident.appendChild(el('span', 'synth-mask__name', item.name));
			const caret = el('span', 'synth-op__caret');
			caret.appendChild(root.SynthIcons.svg('caret-down'));
			ident.appendChild(caret);
			ident.addEventListener('click', function () {
				const next = expandedMaskId === item.id ? null : item.id;
				const prev = expandedMaskId;
				expandedMaskId = next;
				if (root.SynthOutputOverlayApi) root.SynthOutputOverlayApi.setSelected(next);
				if (prev && prev !== next) {
					setMaskOpen(maskList.querySelector('[data-id="' + prev + '"]'), false, true);
				}
				setMaskOpen(card, next === item.id, true);
			});
			head.appendChild(ident);

			const tools = el('div', 'synth-op__tools');
			const bypassBtn = iconBtn(
				item.enabled === false ? 'eye-slash' : 'eye',
				'Bypass',
				'Skip this mask. Other masks stay active.',
				function () {
					const current = outputState().masks.items.filter(function (entry) {
						return entry.id === item.id;
					})[0];
					if (!current || !root.SynthOutput) return;
					patch({
						output: {
							masks: root.SynthOutput.setMaskEnabled(outputState().masks, item.id, current.enabled === false)
						}
					});
				}
			);
			bypassBtn.classList.add('synth-icon--bypass');
			bypassBtn.dataset.bypassed = item.enabled === false ? '1' : '0';
			if (item.enabled === false) bypassBtn.classList.add('is-active');
			tools.appendChild(bypassBtn);
			tools.appendChild(iconBtn('trash', 'Delete', 'Remove this mask from the stack.', function () {
				if (expandedMaskId === item.id) expandedMaskId = null;
				if (!root.SynthOutput) return;
				patch({ output: { masks: root.SynthOutput.removeMask(outputState().masks, item.id) } });
			}));
			card.appendChild(head);

			const body = el('div', 'synth-op__body');
			const inner = el('div', 'synth-op__body-inner');
			inner.appendChild(tools);

			function addSlider(label, key, min, max, step) {
				const maskDefaults = { x: 0.5, y: 0.5, r: 0.38, w: 0.72, h: 0.72, feather: 0.02 };
				const field = makeSlider(label, min, max, step, function (value) {
					const partial = {};
					partial[key] = value;
					patchMask(item.id, partial);
				}, { value: item[key], defaultValue: maskDefaults[key] });
				outSliders[item.id + ':' + key] = field;
				inner.appendChild(field.wrap);
			}

			addSlider('X', 'x', 0, 1, 0.01);
			addSlider('Y', 'y', 0, 1, 0.01);
			if (item.type === 'circle') {
				addSlider('Radius', 'r', 0.02, 0.8, 0.01);
			} else {
				addSlider('Width', 'w', 0.04, 1, 0.01);
				addSlider('Height', 'h', 0.04, 1, 0.01);
			}
			addSlider('Feather', 'feather', 0, 0.4, 0.01);

			const invertField = el('div', 'synth-field');
			invertField.appendChild(el('div', 'synth-field__top', 'Hole'));
			const invertBtn = el('button', 'synth-btn', item.invert ? 'On' : 'Off');
			invertBtn.type = 'button';
			invertBtn.dataset.maskInvert = '1';
			invertBtn.classList.toggle('is-active', !!item.invert);
			invertBtn.setAttribute('aria-pressed', item.invert ? 'true' : 'false');
			invertBtn.addEventListener('click', function () {
				const current = outputState().masks.items.filter(function (entry) {
					return entry.id === item.id;
				})[0];
				if (!current) return;
				patchMask(item.id, { invert: !current.invert });
			});
			invertField.appendChild(invertBtn);
			inner.appendChild(invertField);

			body.appendChild(inner);
			card.appendChild(body);
			return card;
		}

		function rebuildMasks(masks) {
			Object.keys(outSliders).forEach(function (key) {
				delete outSliders[key];
			});
			maskList.innerHTML = '';
			const items = (masks && masks.items) || [];
			if (!items.length) {
				maskList.appendChild(el('p', 'synth-map-list__empty', 'Add shapes to reveal the image. Stack them, then mark one as a hole to punch through.'));
				return;
			}
			items.forEach(function (item) {
				maskList.appendChild(buildMaskCard(item));
			});
			maskList.querySelectorAll('.synth-mask').forEach(function (card) {
				setMaskOpen(card, card.dataset.id === expandedMaskId, false);
			});
		}

		function refreshOutput() {
			const out = outputState();
			const mapping = out.mapping;
			const masks = out.masks;
			mapToggle.textContent = mapping.enabled ? 'On' : 'Off';
			mapToggle.classList.toggle('is-active', mapping.enabled);
			mapToggle.setAttribute('aria-pressed', mapping.enabled ? 'true' : 'false');
			mapTools.classList.toggle('is-bypass', !mapping.enabled);
			mapPad.wrap.classList.toggle('is-bypass', !mapping.enabled);
			mapEdit.textContent = mapping.edit ? 'Done' : 'Edit';
			mapEdit.classList.toggle('is-active', !!mapping.edit);
			mapEdit.setAttribute('aria-pressed', mapping.edit ? 'true' : 'false');
			if (mapPad.setLocked) mapPad.setLocked(!mapping.edit);
			if (!sliding) mapPad.setCorners(mapping.corners);
			cardToggle.textContent = mapping.template ? 'On' : 'Off';
			cardToggle.classList.toggle('is-active', !!mapping.template);
			cardToggle.setAttribute('aria-pressed', mapping.template ? 'true' : 'false');

			maskToggle.textContent = masks.enabled ? 'On' : 'Off';
			maskToggle.classList.toggle('is-active', masks.enabled);
			maskToggle.setAttribute('aria-pressed', masks.enabled ? 'true' : 'false');
			maskInvert.classList.toggle('is-active', !!masks.invert);
			maskInvert.setAttribute('aria-pressed', masks.invert ? 'true' : 'false');
			maskList.classList.toggle('is-bypass', !masks.enabled);

			const sig = maskSignature(masks);
			if (sig !== lastMaskSig) {
				lastMaskSig = sig;
				rebuildMasks(masks);
			}
			if (!sliding) {
				(masks.items || []).forEach(function (item) {
					const card = maskList.querySelector('[data-id="' + item.id + '"]');
					if (!card) return;
					card.classList.toggle('is-bypass', item.enabled === false);
					const bypassBtn = card.querySelector('.synth-icon--bypass');
					if (bypassBtn) paintBypassIcon(bypassBtn, item.enabled === false);
					['x', 'y', 'r', 'w', 'h', 'feather'].forEach(function (key) {
						const slider = outSliders[item.id + ':' + key];
						if (slider && item[key] != null) slider.setValue(item[key]);
					});
					const holeBtn = card.querySelector('[data-mask-invert]');
					if (holeBtn) {
						holeBtn.textContent = item.invert ? 'On' : 'Off';
						holeBtn.classList.toggle('is-active', !!item.invert);
						holeBtn.setAttribute('aria-pressed', item.invert ? 'true' : 'false');
					}
				});
			}
		}

		function templates() {
			return root.SynthTemplates
				? root.SynthTemplates.list((getState().templates) || [])
				: (getState().templates || []);
		}

		function selectedTemplate() {
			const items = templates();
			if (!items.length || !selectedTemplateId) return null;
			return root.SynthTemplates
				? (root.SynthTemplates.find(items, selectedTemplateId) || null)
				: (items.filter(function (item) { return item.id === selectedTemplateId; })[0] || null);
		}

		function patchTemplates(list) {
			patch({ templates: list, templatesSeeded: true });
		}

		function cancelRename() {
			if (!renaming) return;
			renaming = false;
			const input = activeBar.querySelector('.synth-pipe-rename');
			if (input && input.parentNode) input.replaceWith(activeName);
		}

		function requestTemplateThumbs() {
			if (typeof captureTemplates === 'function') captureTemplates();
		}

		function setPreview(id) {
			const next = id || '';
			if ((getState().previewTemplateId || '') === next) {
				if (next) {
					const same = selectedTemplate();
					armCameraFromOperators(same && same.operators);
				}
				return;
			}
			if (next) {
				const tpl = root.SynthTemplates
					? root.SynthTemplates.find(templates(), next)
					: (templates().filter(function (item) { return item.id === next; })[0] || null);
				armCameraFromOperators(tpl && tpl.operators);
			}
			patch({ previewTemplateId: next });
		}

		function pinElementScroll(el) {
			if (!el) return function () {};
			const top = el.getBoundingClientRect().top;
			return function restore() {
				const dy = el.getBoundingClientRect().top - top;
				if (Math.abs(dy) < 1) return;
				window.scrollBy(0, dy);
			};
		}

		function setGalleryMode(mode) {
			const next = mode === 'templates' ? 'templates' : 'set';
			if (galleryMode === next) return;
			const restore = pinElementScroll(galleryTabs);
			cancelRename();
			galleryMode = next;
			lastGridSig = null;
			if (galleryMode === 'templates') {
				setPreview('');
				requestTemplateThumbs();
				if (typeof closeSheet === 'function') closeSheet();
			} else {
				setPreview('');
			}
			refresh();
			restore();
			window.requestAnimationFrame(function () {
				restore();
				window.requestAnimationFrame(restore);
			});
		}

		function mergeAutoplaySelect(base, id) {
			if (!root.SynthAutoplay) return base;
			const extra = root.SynthAutoplay.manualSelectPatch(getState(), id, Date.now());
			if (!extra) return base;
			return Object.assign({}, base, extra);
		}

		function sendTemplateToSet(template) {
			if (!template || !root.SynthTemplates) return;
			armCameraFromOperators(template.operators);
			const s = getState();
			const copy = root.SynthTemplates.instantiate(template, s.pipes || []);
			if (!copy) return;
			expandedId = null;
			galleryMode = 'set';
			lastGridSig = null;
			patch(mergeAutoplaySelect({
				pipes: (s.pipes || []).concat([copy]),
				activePipeId: copy.id,
				previewTemplateId: ''
			}, copy.id));
			if (root.SynthNotify) root.SynthNotify.show('success', 'Added to SET');
		}

		function saveActiveToTemplates() {
			const pipe = activePipe();
			if (!pipe || !root.SynthTemplates) return;
			const created = root.SynthTemplates.fromPipe(pipe, templates());
			selectedTemplateId = created.id;
			galleryMode = 'templates';
			lastGridSig = null;
			patch({
				templates: root.SynthTemplates.upsert(templates(), created),
				templatesSeeded: true,
				previewTemplateId: created.id
			});
			requestTemplateThumbs();
			if (root.SynthNotify) root.SynthNotify.show('success', 'Template saved to disk');
		}

		function currentShareSource() {
			if (galleryMode === 'templates') return selectedTemplate();
			return activePipe();
		}

		function applySharePayload(payload) {
			if (!payload || !root.SynthShare) {
				if (root.SynthNotify) root.SynthNotify.show('warning', 'Could not read that share');
				return false;
			}
			const result = root.SynthShare.apply(payload, getState());
			if (!result || !result.patch) {
				if (root.SynthNotify) root.SynthNotify.show('warning', 'Could not load that share');
				return false;
			}
			lastGridSig = null;
			if (result.patch.pipes) {
				galleryMode = 'set';
				expandedId = null;
			} else if (result.patch.templates) {
				galleryMode = 'templates';
				if (result.item && result.item.id) selectedTemplateId = result.item.id;
			}
			patch(result.patch);
			if (result.patch.templates) requestTemplateThumbs();
			if (root.SynthCamera && root.SynthCamera.armFromState) {
				root.SynthCamera.armFromState(getState());
			}
			if (result.message && root.SynthNotify) root.SynthNotify.show('success', result.message);
			return true;
		}

		function openShareSheet() {
			const item = currentShareSource();
			openSheet('Share');
			sheetBody.innerHTML = '';
			if (!item || !root.SynthShare) {
				sheetBody.appendChild(el('p', 'synth-help__text', 'Nothing to share yet.'));
				return;
			}

			sheetBody.appendChild(el(
				'p',
				'synth-help__lead',
				'This visual as a link. Open it on any ELO instance — this Pi, a laptop, or a phone — to load every operator and parameter.'
			));
			sheetBody.appendChild(el(
				'p',
				'synth-help__text',
				'JSON files in library/templates are the default templates in the repo. Saving to disk writes a file on this instance, so anyone else connected here sees it immediately.'
			));

			const actions = el('div', 'synth-share__actions');
			const copyBtn = el('button', 'synth-btn synth-btn--fill', 'Copy link');
			copyBtn.type = 'button';
			copyBtn.addEventListener('click', function () {
				const payload = root.SynthShare.fromTemplate(item);
				root.SynthShare.encode(payload).then(function (token) {
					const url = root.SynthShare.shareUrl(token);
					return root.SynthShare.copyText(url).then(function () {
						if (root.SynthNotify) root.SynthNotify.show('success', 'Link copied');
					});
				}).catch(function () {
					if (root.SynthNotify) root.SynthNotify.show('warning', 'Could not copy the link');
				});
			});
			actions.appendChild(copyBtn);

			const downloadBtn = el('button', 'synth-btn', 'Download JSON');
			downloadBtn.type = 'button';
			downloadBtn.addEventListener('click', function () {
				const doc = root.SynthShare.toDocument(item);
				root.SynthShare.downloadJson(
					root.SynthShare.fileName(item.name, 'chain'),
					doc
				);
			});
			actions.appendChild(downloadBtn);
			sheetBody.appendChild(actions);

			sheetBody.appendChild(el('p', 'synth-help__text', 'Import a copied link, or a JSON file from another machine.'));
			const paste = el('textarea', 'synth-share__paste');
			paste.rows = 3;
			paste.setAttribute('aria-label', 'Paste a share link or JSON');
			paste.placeholder = 'Paste a link or JSON';
			sheetBody.appendChild(paste);
			const importRow = el('div', 'synth-share__actions');
			const loadBtn = el('button', 'synth-btn synth-btn--fill', 'Load');
			loadBtn.type = 'button';
			loadBtn.addEventListener('click', function () {
				root.SynthShare.parseText(paste.value).then(function (payload) {
					if (applySharePayload(payload)) closeSheet();
				});
			});
			importRow.appendChild(loadBtn);
			const fileBtn = el('button', 'synth-btn', 'Import file');
			fileBtn.type = 'button';
			const fileInput = el('input');
			fileInput.type = 'file';
			fileInput.accept = 'application/json,.json';
			fileInput.hidden = true;
			fileBtn.addEventListener('click', function () {
				fileInput.click();
			});
			fileInput.addEventListener('change', function () {
				const file = fileInput.files && fileInput.files[0];
				fileInput.value = '';
				if (!file) return;
				const reader = new FileReader();
				reader.onload = function () {
					root.SynthShare.parseText(String(reader.result || '')).then(function (payload) {
						if (applySharePayload(payload)) closeSheet();
					});
				};
				reader.readAsText(file);
			});
			importRow.appendChild(fileBtn);
			importRow.appendChild(fileInput);
			sheetBody.appendChild(importRow);
		}

		function startRename(item, kind) {
			if (!item) return;
			if (renaming) cancelRename();
			renaming = true;
			const input = el('input', 'synth-pipe-rename');
			input.type = 'text';
			input.value = item.name;
			input.setAttribute('aria-label', kind === 'template' ? 'Template name' : 'Chain name');
			input.setAttribute('enterkeyhint', 'done');
			input.autocomplete = 'off';
			input.autocapitalize = 'characters';
			input.spellcheck = false;
			input.maxLength = 32;
			activeName.replaceWith(input);

			let armed = false;
			function arm() {
				armed = true;
			}

			function commit() {
				if (!renaming) return;
				renaming = false;
				armed = false;
				const name = input.value.trim() || item.name;
				if (input.parentNode) input.replaceWith(activeName);
				activeName.textContent = name;
				if (name === item.name) {
					refresh();
					return;
				}
				if (kind === 'template' && root.SynthTemplates) {
					patchTemplates(root.SynthTemplates.upsert(templates(), Object.assign({}, item, { name: name })));
					return;
				}
				patch({ pipeMeta: { id: item.id, name: name } });
			}

			input.addEventListener('keydown', function (event) {
				if (event.key === 'Enter') {
					event.preventDefault();
					commit();
				}
				if (event.key === 'Escape') {
					renaming = false;
					armed = false;
					if (input.parentNode) input.replaceWith(activeName);
					refresh();
				}
			});
			input.addEventListener('blur', function () {
				window.setTimeout(function () {
					if (!renaming || !armed) return;
					if (!input.parentNode) return;
					if (document.activeElement === input) return;
					commit();
				}, 0);
			});

			input.focus();
			if (typeof input.setSelectionRange === 'function') {
				input.setSelectionRange(0, input.value.length);
			} else {
				input.select();
			}
			input.scrollIntoView({ block: 'nearest', inline: 'nearest' });
			window.setTimeout(arm, 250);
		}

		function beginRename() {
			if (galleryMode === 'templates') return;
			const pipe = activePipe();
			if (pipe) startRename(pipe, 'pipe');
		}

		activeName.addEventListener('click', beginRename);
		activeName.addEventListener('keydown', function (event) {
			if (event.key !== 'Enter' && event.key !== ' ') return;
			event.preventDefault();
			beginRename();
		});

		const renameBtn = iconBtn(
			'pencil',
			'Rename',
			'Change the name of the selected chain.',
			beginRename
		);
		const dupBtn = iconBtn(
			'copy',
			'Duplicate',
			'Create an independent copy of the selected chain.',
			function () {
				const s = getState();
				if (galleryMode === 'templates') {
					const tpl = selectedTemplate();
					if (!tpl || !root.SynthTemplates) return;
					const copy = root.SynthTemplates.duplicate(tpl, templates());
					if (!copy) return;
					selectedTemplateId = copy.id;
					lastGridSig = null;
					patch({
						templates: root.SynthTemplates.upsert(templates(), copy),
						templatesSeeded: true,
						previewTemplateId: ''
					});
					return;
				}
				const pipe = activePipe();
				if (!pipe) return;
				const copy = root.SynthPipes.duplicate(pipe, s.pipes);
				expandedId = null;
				patch(mergeAutoplaySelect({
					pipes: (s.pipes || []).concat([copy]),
					activePipeId: copy.id
				}, copy.id));
			}
		);
		const saveTplBtn = iconBtn(
			'disk',
			'Save template',
			'Store this chain on disk and add it to TEMPLATES.',
			saveActiveToTemplates
		);
		const shareBtn = iconBtn(
			'share',
			'Share',
			'Copy a link or JSON that reloads this visual with every parameter.',
			openShareSheet
		);
		const addToSetBtn = el('button', 'synth-btn synth-btn--fill', 'Add to SET');
		addToSetBtn.type = 'button';
		addToSetBtn.setAttribute('aria-label', 'Add to SET');
		addToSetBtn.title = 'Copy this template into the SET so you can edit and perform it.';
		addToSetBtn.addEventListener('click', function () {
			sendTemplateToSet(selectedTemplate());
		});
		const deletePipeBtn = iconBtn(
			'trash',
			'Delete',
			'Remove the selected chain or template.',
			function () {
				if (galleryMode === 'templates') {
					const tpl = selectedTemplate();
					if (!tpl || !root.SynthTemplates) return;
					const next = root.SynthTemplates.remove(templates(), tpl.id);
					selectedTemplateId = next[0] ? next[0].id : '';
					lastGridSig = null;
					patch({
						templates: next,
						templatesSeeded: true,
						previewTemplateId: ''
					});
					return;
				}
				const s = getState();
				const pipe = activePipe();
				if (!pipe || (s.pipes || []).length <= 1) return;
				const pipes = (s.pipes || []).filter(function (item) {
					return item.id !== pipe.id;
				});
				expandedId = null;
				const next = {
					pipes: pipes,
					activePipeId: pipes[0].id
				};
				if (pipes.length < 2) next.autoplay = { enabled: false };
				else Object.assign(next, mergeAutoplaySelect(next, pipes[0].id));
				patch(next);
			}
		);
		activeTools.appendChild(renameBtn);
		activeTools.appendChild(dupBtn);
		activeTools.appendChild(saveTplBtn);
		activeTools.appendChild(shareBtn);
		activeTools.appendChild(deletePipeBtn);
		galleryActions.appendChild(addToSetBtn);

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

		const autoplayBar = el('div', 'synth-autoplay');
		autoplayBar.setAttribute('aria-label', 'SET autoplay');
		const autoplayRowModes = el('div', 'synth-autoplay__row synth-autoplay__row--modes');
		const playBtn = el('button', 'synth-autoplay__play');
		playBtn.type = 'button';
		playBtn.setAttribute('aria-pressed', 'false');
		playBtn.setAttribute('aria-label', 'Play SET autoplay');
		playBtn.dataset.tip = 'Autoplay';
		playBtn.dataset.tipDesc = 'Cycle the SET on a timer. Needs two or more chains.';
		bindTip(playBtn);
		const playIconWrap = el('span', 'synth-autoplay__play-icon');
		playIconWrap.appendChild(root.SynthIcons.svg('play'));
		playBtn.appendChild(playIconWrap);
		playBtn.appendChild(el('span', 'synth-autoplay__play-label', 'Play'));
		playBtn.addEventListener('click', function () {
			if (!root.SynthAutoplay) return;
			const s = getState();
			if (root.SynthAutoplay.normalize(s.autoplay).enabled) {
				patch(root.SynthAutoplay.stopPatch());
				return;
			}
			patch(root.SynthAutoplay.startPatch(s, Date.now()));
		});
		const modeGroup = el('div', 'synth-autoplay__modes');
		modeGroup.setAttribute('role', 'group');
		modeGroup.setAttribute('aria-label', 'Autoplay order');
		const modeBtns = {};
		[
			{ id: 'sequential', label: 'Seq' },
			{ id: 'inverse', label: 'Inv' },
			{ id: 'random', label: 'Rand' }
		].forEach(function (mode) {
			const btn = el('button', 'synth-autoplay__seg', mode.label);
			btn.type = 'button';
			btn.dataset.mode = mode.id;
			btn.setAttribute('aria-pressed', mode.id === 'sequential' ? 'true' : 'false');
			btn.addEventListener('click', function () {
				if (!root.SynthAutoplay) return;
				patch(root.SynthAutoplay.modePatch(getState(), mode.id, Date.now()));
			});
			modeBtns[mode.id] = btn;
			modeGroup.appendChild(btn);
		});
		autoplayRowModes.appendChild(playBtn);
		autoplayRowModes.appendChild(modeGroup);
		autoplayBar.appendChild(autoplayRowModes);

		const autoplayRowTime = el('div', 'synth-autoplay__row synth-autoplay__row--time');
		const unitGroup = el('div', 'synth-autoplay__units');
		unitGroup.setAttribute('role', 'group');
		unitGroup.setAttribute('aria-label', 'Autoplay interval unit');
		const unitBtns = {};
		[
			{ id: 'seconds', label: 'Sec' },
			{ id: 'bars', label: 'Bars' }
		].forEach(function (unit) {
			const btn = el('button', 'synth-autoplay__seg', unit.label);
			btn.type = 'button';
			btn.dataset.unit = unit.id;
			btn.setAttribute('aria-pressed', unit.id === 'seconds' ? 'true' : 'false');
			btn.addEventListener('click', function () {
				if (!root.SynthAutoplay) return;
				if (typeof finishIntervalEdit === 'function') finishIntervalEdit(false);
				patch(root.SynthAutoplay.unitPatch(getState(), unit.id, Date.now()));
			});
			unitBtns[unit.id] = btn;
			unitGroup.appendChild(btn);
		});
		const step = el('div', 'synth-autoplay__step');
		const minusBtn = el('button', 'synth-autoplay__step-btn');
		minusBtn.type = 'button';
		minusBtn.setAttribute('aria-label', 'Shorter autoplay interval');
		minusBtn.appendChild(root.SynthIcons.svg('minus'));
		minusBtn.addEventListener('click', function () {
			if (!root.SynthAutoplay) return;
			finishIntervalEdit(false);
			patch(root.SynthAutoplay.nudgeIntervalPatch(getState(), -1, Date.now()));
		});
		const intervalVal = el('span', 'synth-autoplay__interval');
		intervalVal.setAttribute('aria-live', 'polite');
		const intervalNum = el('span', 'synth-autoplay__interval-num', '8');
		intervalNum.tabIndex = 0;
		intervalNum.setAttribute('role', 'textbox');
		intervalNum.setAttribute('aria-label', 'Autoplay interval');
		const intervalUnit = el('span', 'synth-autoplay__interval-unit', 's');
		intervalVal.appendChild(intervalNum);
		intervalVal.appendChild(intervalUnit);
		const plusBtn = el('button', 'synth-autoplay__step-btn');
		plusBtn.type = 'button';
		plusBtn.setAttribute('aria-label', 'Longer autoplay interval');
		plusBtn.appendChild(root.SynthIcons.svg('plus'));
		plusBtn.addEventListener('click', function () {
			if (!root.SynthAutoplay) return;
			finishIntervalEdit(false);
			patch(root.SynthAutoplay.nudgeIntervalPatch(getState(), 1, Date.now()));
		});
		step.appendChild(minusBtn);
		step.appendChild(intervalVal);
		step.appendChild(plusBtn);
		autoplayRowTime.appendChild(unitGroup);
		autoplayRowTime.appendChild(step);
		autoplayBar.appendChild(autoplayRowTime);

		const meter = el('div', 'synth-autoplay__meter is-seconds');
		meter.setAttribute('aria-hidden', 'true');
		const meterFill = el('span', 'synth-autoplay__meter-fill');
		const meterBars = el('div', 'synth-autoplay__meter-bars');
		meter.appendChild(meterFill);
		meter.appendChild(meterBars);
		autoplayBar.appendChild(meter);
		pipesSec.appendChild(autoplayBar);

		let editingInterval = false;
		let intervalEditInput = null;
		let lastMeterBars = 0;
		let meterMotionKey = '';

		function cancelScaleAnim(el) {
			if (!el) return;
			if (el._synthTimer) {
				window.clearTimeout(el._synthTimer);
				el._synthTimer = 0;
			}
			if (el._synthAnim && typeof el._synthAnim.cancel === 'function') {
				el._synthAnim.cancel();
			}
			el._synthAnim = null;
			el.style.transition = 'none';
		}

		function animateScaleX(el, from, to, ms, delay) {
			if (!el) return;
			cancelScaleAnim(el);
			const start = Math.max(0, Math.min(1, from));
			const end = Math.max(0, Math.min(1, to));
			const wait = Math.max(0, delay || 0);
			const dur = Math.max(0, ms || 0);
			el.style.transform = 'scaleX(' + start + ')';
			if (dur <= 16 && wait <= 16) {
				el.style.transform = 'scaleX(' + end + ')';
				return;
			}
			if (typeof el.animate === 'function') {
				el._synthAnim = el.animate(
					[
						{ transform: 'scaleX(' + start + ')' },
						{ transform: 'scaleX(' + end + ')' }
					],
					{
						duration: Math.max(16, dur),
						delay: wait,
						easing: 'linear',
						fill: 'forwards'
					}
				);
				return;
			}
			const startMotion = function () {
				el._synthTimer = 0;
				void el.offsetWidth;
				el.style.transition = 'transform ' + Math.round(Math.max(16, dur)) + 'ms linear';
				el.style.transform = 'scaleX(' + end + ')';
			};
			if (wait > 16) {
				el._synthTimer = window.setTimeout(startMotion, wait);
				return;
			}
			startMotion();
		}

		function finishIntervalEdit(shouldCommit) {
			if (!editingInterval) return;
			editingInterval = false;
			const input = intervalEditInput;
			intervalEditInput = null;
			const typed = input ? parseFloat(String(input.value).trim().replace(',', '.')) : NaN;
			if (input && input.parentNode) input.replaceWith(intervalNum);
			if (shouldCommit && isFinite(typed) && root.SynthAutoplay) {
				patch(root.SynthAutoplay.setIntervalPatch(getState(), typed, Date.now()));
			} else if (root.SynthAutoplay) {
				const ap = root.SynthAutoplay.normalize(getState().autoplay);
				intervalNum.textContent = String(ap.unit === 'bars' ? ap.intervalBars : ap.intervalSec);
			}
		}

		function startIntervalEdit() {
			if (editingInterval || !root.SynthAutoplay) return;
			editingInterval = true;
			const ap = root.SynthAutoplay.normalize(getState().autoplay);
			const input = el('input', 'synth-autoplay__edit');
			input.type = 'text';
			input.inputMode = 'numeric';
			input.autocomplete = 'off';
			input.spellcheck = false;
			input.setAttribute('aria-label', ap.unit === 'bars' ? 'Autoplay bars' : 'Autoplay seconds');
			input.value = String(ap.unit === 'bars' ? ap.intervalBars : ap.intervalSec);
			intervalNum.replaceWith(input);
			intervalEditInput = input;
			input.focus();
			input.select();
			input.addEventListener('keydown', function (event) {
				if (event.key === 'Enter') {
					event.preventDefault();
					finishIntervalEdit(true);
				} else if (event.key === 'Escape') {
					event.preventDefault();
					finishIntervalEdit(false);
				}
			});
			input.addEventListener('blur', function () {
				finishIntervalEdit(true);
			});
		}

		intervalNum.addEventListener('click', function (event) {
			event.preventDefault();
			event.stopPropagation();
			startIntervalEdit();
		});
		intervalNum.addEventListener('keydown', function (event) {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				startIntervalEdit();
			}
		});
		intervalVal.addEventListener('click', function (event) {
			if (event.target.closest('.synth-autoplay__edit')) return;
			if (editingInterval) return;
			startIntervalEdit();
		});

		let lastBeat = -1;
		let editingBpm = false;
		let bpmEditInput = null;
		let lastBpmTap = 0;
		let bpmResetAt = 0;

		function finishBpmEdit(shouldCommit) {
			if (!editingBpm) return;
			editingBpm = false;
			const input = bpmEditInput;
			bpmEditInput = null;
			const typed = input ? parseFloat(String(input.value).trim().replace(',', '.')) : NaN;
			if (input && input.parentNode) input.replaceWith(bpmVal);
			if (shouldCommit && isFinite(typed) && root.SynthClock) {
				const clock = root.SynthClock.fromState(getState());
				const bpm = Math.min(root.SynthClock.BPM_MAX, Math.max(root.SynthClock.BPM_MIN, Math.round(typed)));
				patch({ clock: { bpm: bpm, originMs: clock.originMs } });
			} else if (root.SynthClock) {
				bpmVal.textContent = String(Math.round(root.SynthClock.fromState(getState()).bpm));
			}
		}

		function startBpmEdit() {
			if (editingBpm) return;
			editingBpm = true;
			const input = el('input', 'synth-clock__edit');
			input.type = 'text';
			input.inputMode = 'numeric';
			input.autocomplete = 'off';
			input.spellcheck = false;
			input.setAttribute('aria-label', 'BPM');
			const clock = root.SynthClock ? root.SynthClock.fromState(getState()) : { bpm: 120 };
			input.value = String(Math.round(clock.bpm));
			bpmVal.replaceWith(input);
			bpmEditInput = input;
			input.focus();
			input.select();
			input.addEventListener('keydown', function (event) {
				if (event.key === 'Enter') {
					event.preventDefault();
					finishBpmEdit(true);
				} else if (event.key === 'Escape') {
					event.preventDefault();
					finishBpmEdit(false);
				}
			});
			input.addEventListener('blur', function () {
				finishBpmEdit(true);
			});
		}

		function resetBpm() {
			bpmResetAt = Date.now();
			finishBpmEdit(false);
			if (!root.SynthClock) return;
			const clock = root.SynthClock.fromState(getState());
			patch({ clock: { bpm: 120, originMs: clock.originMs } });
		}

		tapBtn.addEventListener('pointerdown', function (event) {
			if (event.button !== 0 && event.pointerType === 'mouse') return;
			if (event.target.closest('.synth-clock__bpm, .synth-clock__edit')) return;
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

		bpmVal.tabIndex = 0;
		bpmVal.setAttribute('role', 'textbox');
		bpmVal.setAttribute('aria-label', 'BPM value');
		bpmVal.addEventListener('click', function (event) {
			event.preventDefault();
			event.stopPropagation();
			if (Date.now() - bpmResetAt < 400) return;
			startBpmEdit();
		});
		bpmVal.addEventListener('keydown', function (event) {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				startBpmEdit();
			}
		});
		readout.addEventListener('contextmenu', function (event) {
			event.preventDefault();
			resetBpm();
		});
		bpmVal.addEventListener('pointerdown', function (event) {
			event.stopPropagation();
			if (event.pointerType === 'mouse') return;
			const now = Date.now();
			if (now - lastBpmTap < 340) {
				event.preventDefault();
				lastBpmTap = 0;
				resetBpm();
				return;
			}
			lastBpmTap = now;
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

		function paramDefault(type, key, fallback) {
			const def = root.SynthRegistry && root.SynthRegistry.get(type);
			if (def && def.defaults && def.defaults[key] != null && isFinite(Number(def.defaults[key]))) {
				return Number(def.defaults[key]);
			}
			return fallback;
		}

		let sheetSavedY = 0;
		let sheetLocked = false;

		function isControlPage() {
			return document.body.classList.contains('synth-control');
		}

		function isPhoneClient() {
			if (window.matchMedia) {
				const coarse = window.matchMedia('(pointer: coarse)').matches;
				const noHover = window.matchMedia('(hover: none)').matches;
				if (coarse && noHover) return true;
			}
			return /Android.+Mobile|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
				navigator.userAgent || ''
			);
		}

		function pageScrollY() {
			if (window.visualViewport && isFinite(window.visualViewport.pageTop)) {
				return window.visualViewport.pageTop;
			}
			return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
		}

		function viewHeight() {
			if (window.visualViewport && isFinite(window.visualViewport.height)) {
				return window.visualViewport.height;
			}
			return window.innerHeight;
		}

		function sheetDockTop() {
			if (preview && preview.offsetParent) {
				const bottom = preview.getBoundingClientRect().bottom;
				if (isFinite(bottom)) return bottom;
			}
			const chrome = document.querySelector('.synth-chrome');
			if (chrome) return chrome.getBoundingClientRect().bottom;
			return 0;
		}

		function lockSheetPage() {
			if (!isControlPage() || sheetLocked) return;
			sheetSavedY = pageScrollY();
			sheetLocked = true;
			document.body.classList.add('is-sheet-open');
		}

		function unlockSheetPage() {
			if (!sheetLocked) return;
			sheetLocked = false;
			document.body.classList.remove('is-sheet-open');
		}

		function pinSheetHost() {
			const dock = Math.max(0, sheetDockTop());
			const viewH = viewHeight();
			const height = Math.max(160, viewH - dock);

			if (!isControlPage()) {
				const parentRect = rootEl.getBoundingClientRect();
				sheetHost.style.position = 'absolute';
				sheetHost.style.top = Math.max(0, dock - parentRect.top) + 'px';
				sheetHost.style.left = '0';
				sheetHost.style.right = '0';
				sheetHost.style.width = '100%';
				sheetHost.style.height = height + 'px';
				sheetHost.style.bottom = 'auto';
				sheetHost.style.transform = '';
				return;
			}

			sheetHost.style.position = 'fixed';
			sheetHost.style.top = dock + 'px';
			sheetHost.style.left = '0';
			sheetHost.style.right = '0';
			sheetHost.style.width = '100%';
			sheetHost.style.maxWidth = '520px';
			sheetHost.style.marginLeft = 'auto';
			sheetHost.style.marginRight = 'auto';
			sheetHost.style.height = height + 'px';
			sheetHost.style.bottom = 'auto';
			sheetHost.style.transform = '';

			const placed = sheetHost.getBoundingClientRect().top;
			const error = dock - placed;
			if (Math.abs(error) > 1) {
				const y = sheetLocked ? sheetSavedY : pageScrollY();
				sheetHost.style.position = 'absolute';
				sheetHost.style.top = (y + dock) + 'px';
				sheetHost.style.maxWidth = '';
				sheetHost.style.marginLeft = '';
				sheetHost.style.marginRight = '';
			}
		}

		function hideSheetNow() {
			const g = getGsap();
			if (g) {
				g.killTweensOf(sheet);
				g.set(sheet, { clearProps: 'transform,visibility,opacity' });
			}
			sheet.hidden = true;
			sheetHost.hidden = true;
			sheetBody.innerHTML = '';
			unlockSheetPage();
			if (typeof paintRecChrome === 'function') paintRecChrome();
		}

		function closeSheet() {
			if (sheet.hidden && sheetHost.hidden) return;
			hideTip();
			const g = getGsap();
			if (!g || prefersReduced()) {
				hideSheetNow();
				return;
			}
			g.killTweensOf(sheet);
			g.to(sheet, {
				yPercent: -100,
				autoAlpha: 0,
				duration: dur(0.22),
				ease: 'power2.in',
				onComplete: hideSheetNow
			});
		}

		function openSheet(title) {
			const wasHidden = sheet.hidden || sheetHost.hidden;
			if (wasHidden) lockSheetPage();
			sheetTitle.textContent = title;
			sheetHost.hidden = false;
			sheet.hidden = false;
			if (typeof paintRecChrome === 'function') paintRecChrome();
			sheet.scrollTop = 0;
			pinSheetHost();
			window.requestAnimationFrame(function () {
				pinSheetHost();
				window.requestAnimationFrame(pinSheetHost);
			});
			const g = getGsap();
			if (g) g.killTweensOf(sheet);
			if (wasHidden && g && !prefersReduced()) {
				g.fromTo(sheet, {
					yPercent: -100,
					autoAlpha: 1
				}, {
					yPercent: 0,
					autoAlpha: 1,
					duration: dur(0.4),
					ease: 'power3.out'
				});
			} else if (g) {
				g.set(sheet, { yPercent: 0, autoAlpha: 1 });
			}
		}

		function keepSheetDocked() {
			if (sheetHost.hidden) return;
			pinSheetHost();
		}

		window.addEventListener('resize', keepSheetDocked);
		window.addEventListener('scroll', keepSheetDocked, { passive: true });
		if (window.visualViewport) {
			window.visualViewport.addEventListener('resize', keepSheetDocked);
			window.visualViewport.addEventListener('scroll', keepSheetDocked);
		}
		document.addEventListener('touchmove', function (event) {
			if (sheetHost.hidden) return;
			if (sheet.contains(event.target)) return;
			event.preventDefault();
		}, { passive: false });

		function openTypesHelp() {
			openSheet('ELO');
			sheetBody.innerHTML = '';
			sheetBody.appendChild(el('p', 'synth-help__lead', 'ELO is a modular visual instrument. You create visuals by connecting operators. Each operator does one job. A chain is a sequence of connected operators — the consolidated visual. Order is the patch.'));
			sheetBody.appendChild(el('p', 'synth-help__text', 'Pick a chain in the grid, then edit its operators. Each operator reads what came before, does one job, and passes a new image down. Bypass, reorder, or remove a stage and the chain recomputes.'));
			sheetBody.appendChild(el('p', 'synth-help__text', 'The SET is the collection of chains you can activate for the live output. TEMPLATES is a gallery of stored examples. Send one into the SET to edit and perform it. Save a chain from the SET to keep it on disk as a template. Share copies a link that reloads the visual on this instance or another. Default templates live as JSON files in library/templates.'));
			sheetBody.appendChild(el('p', 'synth-help__text', 'AUTOPLAY cycles the SET on a timer. Seq, Inv, and Rand pick the order (Rand shuffles without repeating until every chain has played). Interval is seconds or bars of the BPM clock. Editing a chain does not stop it. Previewing a template pauses it until you return to the SET.'));
			sheetBody.appendChild(el('p', 'synth-help__text', 'LIVE streams the renderer output into the preview. LOCAL runs the same chain on this device so you can watch the real frame rate without that stream.'));
			sheetBody.appendChild(el('p', 'synth-help__text', 'Below the SET, three tabs split the rest of the instrument. Chain is the operator stack. Mask cuts the image with stacked rectangles and circles. Mapping pins that image to the display, and the mapping card covers the chain so you can align corners.'));
			const cats = root.SynthCategories;
			['generator', 'effect', 'filter', 'color', 'compositing', 'output'].forEach(function (id) {
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
			openSheet('Add Operator');
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
					y: 10,
					duration: dur(0.22),
					stagger: 0.018,
					delay: 0.12,
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
			const sliderMax = max;
			const valueMax = options.typedMax != null && isFinite(Number(options.typedMax))
				? Math.max(max, Number(options.typedMax))
				: max;
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
			slider.setAttribute('aria-valuemax', String(valueMax));
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
			slider.appendChild(track);
			slider.appendChild(playhead);
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

			let current = options.value != null ? options.value : min;
			let inMark = min;
			let outMark = max;
			let liveValue = min;
			let modOn = false;
			let modPrimed = false;
			let editing = false;
			let editInput = null;
			let lastTapAt = 0;
			let lastTapX = 0;
			let lastTapY = 0;
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
			const defaultValue = options.defaultValue;

			function snapValue(value, lo, hi) {
				const stepped = Math.round((value - min) / step) * step + min;
				return Math.min(hi, Math.max(lo, stepped));
			}

			function clamp(value) {
				return snapValue(value, min, sliderMax);
			}

			function clampTyped(value) {
				return snapValue(value, min, valueMax);
			}

			function posFromValue(value) {
				let t;
				if (!bipolar) t = (value - min) / (max - min || 1);
				else if (value < 0) t = 0.5 * (value - min) / (0 - min || 1);
				else t = 0.5 + 0.5 * value / (max || 1);
				if (!isFinite(t)) t = 0;
				return Math.min(1, Math.max(0, t));
			}

			function formatDisplay(value) {
				if (spec && spec.unit === '°') return Math.round(value) + '°';
				const text = formatValue(value, step);
				if (bipolar && value > 0) return '+' + text;
				return text;
			}

			function formatEditValue(value) {
				if (spec && spec.unit === '°') return String(Math.round(value * 1000) / 1000);
				if (Math.abs(step - 1) < 1e-6) return String(Math.round(value));
				const digits = step < 0.01 ? 3 : (step < 0.1 ? 2 : 1);
				return String(Number(value.toFixed(digits)));
			}

			function parseTyped(text) {
				const n = parseFloat(String(text).trim().replace(',', '.'));
				if (!isFinite(n)) return null;
				return clampTyped(n);
			}

			function place(node, value) {
				node.style.left = (posFromValue(value) * 100) + '%';
			}

			function placePlayhead(value) {
				slider.style.setProperty('--mod-t', String(posFromValue(value)));
			}

			function renderFill(from, to) {
				const a = posFromValue(from);
				const b = posFromValue(to);
				const left = Math.min(a, b);
				const right = Math.max(a, b);
				fill.style.left = (left * 100) + '%';
				fill.style.width = ((right - left) * 100) + '%';
			}

			function paintValue(value) {
				if (editing) return;
				valueEl.textContent = formatDisplay(value);
			}

			function render() {
				valueEl.classList.toggle('is-live', modOn);
				if (modOn) {
					renderFill(inMark, outMark);
					place(inThumb, inMark);
					place(outThumb, outMark);
					placePlayhead(liveValue);
					paintValue(liveValue);
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
				paintValue(current);
				if (minusBtn) minusBtn.disabled = current <= min;
				if (plusBtn) plusBtn.disabled = current >= valueMax;
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
				current = clampTyped(value);
				render();
				if (fromUser) onChange(current);
			}

			function finishEdit(shouldCommit) {
				if (!editing) return;
				editing = false;
				const input = editInput;
				editInput = null;
				const typed = input ? parseTyped(input.value) : null;
				if (input && input.parentNode) input.replaceWith(valueEl);
				if (shouldCommit && typed != null) commit(typed, true);
				else render();
			}

			function startEdit() {
				if (editing || modOn) return;
				editing = true;
				const input = el('input', 'synth-field__edit');
				input.type = 'text';
				input.inputMode = Math.abs(step - 1) < 1e-6 ? 'numeric' : 'decimal';
				input.autocomplete = 'off';
				input.spellcheck = false;
				input.setAttribute('aria-label', label + ' value');
				input.value = formatEditValue(current);
				valueEl.replaceWith(input);
				editInput = input;
				input.focus();
				input.select();
				input.addEventListener('keydown', function (event) {
					if (event.key === 'Enter') {
						event.preventDefault();
						finishEdit(true);
					} else if (event.key === 'Escape') {
						event.preventDefault();
						finishEdit(false);
					}
				});
				input.addEventListener('blur', function () {
					finishEdit(true);
				});
			}

			function resetToDefault() {
				if (defaultValue == null || !isFinite(Number(defaultValue))) return;
				finishEdit(false);
				const next = clampTyped(defaultValue);
				current = next;
				render();
				if (modOn && opId && paramKey) {
					patch({
						opParam: { id: opId, key: paramKey, value: next, presetId: null },
						opMod: { id: opId, key: paramKey, modulation: { enabled: false } }
					});
					return;
				}
				onChange(next);
			}

			function isOwnControl(node) {
				if (!node || !wrap.contains(node)) return false;
				if (node.closest('.synth-field') !== wrap) return false;
				if (node.closest('.synth-mod') && !wrap.classList.contains('synth-mod__speed')) return false;
				if (node.closest('.synth-field__mod, .synth-stepper, input')) return false;
				return true;
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
				if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
					next = current + step;
					if (current <= sliderMax) next = Math.min(next, sliderMax);
				} else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
					next = current - step;
				} else return;
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
				const nextMode = source === 'fft';
				const nextTime = source !== 'time';
				const nextBpm = source !== 'bpm';
				const nextFft = source !== 'fft';
				const changed = (modeRow && modeRow.hidden !== nextMode)
					|| (timeRow && timeRow.hidden !== nextTime)
					|| (bpmRow && bpmRow.hidden !== nextBpm)
					|| (fftRow && fftRow.hidden !== nextFft);
				if (modeRow) modeRow.hidden = nextMode;
				if (timeRow) timeRow.hidden = nextTime;
				if (bpmRow) bpmRow.hidden = nextBpm;
				if (fftRow) fftRow.hidden = nextFft;
				if (changed && modOn && opId) relayoutOpBody(opId);
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
						setSourceUi(src.id);
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
				speedSlider = makeSlider('Seconds', root.SynthModulate.DURATION_MIN, root.SynthModulate.DURATION_SLIDER_MAX, 0.25, function (value) {
					patchMod({ duration: value });
				}, {
					className: 'synth-mod__speed',
					defaultValue: 2,
					typedMax: root.SynthModulate.DURATION_MAX
				});
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
				beatsEl.tabIndex = 0;
				beatsEl.setAttribute('role', 'textbox');
				beatsEl.setAttribute('aria-label', 'Beats');
				function snapBeats(value) {
					const lo = root.SynthModulate.BEATS_MIN;
					const hi = root.SynthModulate.BEATS_MAX;
					const n = Math.round(Number(value) || 4);
					return Math.min(hi, Math.max(lo, Math.pow(2, Math.round(Math.log2(Math.max(lo, n))))));
				}
				function finishBeatsEdit(input, shouldCommit) {
					const typed = parseFloat(String(input.value).trim().replace(',', '.'));
					if (input.parentNode) input.replaceWith(beatsEl);
					if (shouldCommit && isFinite(typed)) patchMod({ beats: snapBeats(typed) });
					else {
						const beats = (liveMod(opId, paramKey) || {}).beats || 4;
						beatsEl.textContent = beats + (beats === 1 ? ' beat' : ' beats');
					}
				}
				let beatsResetAt = 0;
				function resetBeats() {
					beatsResetAt = Date.now();
					const input = bpmRow.querySelector('.synth-mod__beats-edit');
					if (input && input.parentNode) input.replaceWith(beatsEl);
					patchMod({ beats: 4 });
				}
				function startBeatsEdit() {
					if (!beatsEl.parentNode || beatsEl.parentNode.querySelector('.synth-mod__beats-edit')) return;
					if (Date.now() - beatsResetAt < 400) return;
					const currentBeats = (liveMod(opId, paramKey) || {}).beats || 4;
					const input = el('input', 'synth-field__edit synth-mod__beats-edit');
					input.type = 'text';
					input.inputMode = 'numeric';
					input.autocomplete = 'off';
					input.spellcheck = false;
					input.setAttribute('aria-label', 'Beats');
					input.value = String(currentBeats);
					beatsEl.replaceWith(input);
					input.focus();
					input.select();
					input.addEventListener('keydown', function (event) {
						if (event.key === 'Enter') {
							event.preventDefault();
							finishBeatsEdit(input, true);
						} else if (event.key === 'Escape') {
							event.preventDefault();
							finishBeatsEdit(input, false);
						}
					});
					input.addEventListener('blur', function () {
						finishBeatsEdit(input, true);
					});
				}
				beatsEl.addEventListener('click', function (event) {
					event.preventDefault();
					event.stopPropagation();
					if (Date.now() - beatsResetAt < 400) return;
					startBeatsEdit();
				});
				beatsEl.addEventListener('keydown', function (event) {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						startBeatsEdit();
					}
				});
				beatsEl.addEventListener('contextmenu', function (event) {
					event.preventDefault();
					resetBeats();
				});
				let lastBeatsTap = 0;
				beatsEl.addEventListener('pointerdown', function (event) {
					if (event.pointerType === 'mouse') return;
					const now = Date.now();
					if (now - lastBeatsTap < 340) {
						event.preventDefault();
						event.stopPropagation();
						lastBeatsTap = 0;
						resetBeats();
						return;
					}
					lastBeatsTap = now;
				});
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

			valueEl.tabIndex = 0;
			valueEl.setAttribute('role', 'textbox');
			valueEl.setAttribute('aria-label', label + ' value');
			valueEl.addEventListener('click', function (event) {
				event.preventDefault();
				event.stopPropagation();
				startEdit();
			});
			valueEl.addEventListener('keydown', function (event) {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					startEdit();
				}
			});

			wrap.addEventListener('contextmenu', function (event) {
				if (!isOwnControl(event.target)) return;
				event.preventDefault();
				resetToDefault();
			});

			wrap.addEventListener('pointerdown', function (event) {
				if (event.pointerType === 'mouse' || !isOwnControl(event.target)) return;
				const now = Date.now();
				const close = Math.abs(event.clientX - lastTapX) < 28 && Math.abs(event.clientY - lastTapY) < 28;
				if (close && now - lastTapAt < 340) {
					event.preventDefault();
					event.stopPropagation();
					pointerId = null;
					intent = null;
					sliding = false;
					lastTapAt = 0;
					resetToDefault();
					return;
				}
				lastTapAt = now;
				lastTapX = event.clientX;
				lastTapY = event.clientY;
			}, true);

			function setMod(mod) {
				const on = !!(mod && mod.enabled);
				const wasOn = modOn;
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
					if (beatsEl && beatsEl.parentNode && !beatsEl.parentNode.querySelector('.synth-mod__beats-edit')) {
						const beats = mod.beats || 4;
						beatsEl.textContent = beats + (beats === 1 ? ' beat' : ' beats');
					}
				}
				render();
				if (on !== wasOn && opId) {
					relayoutOpBody(opId);
					if (on && panel && modPrimed) {
						window.requestAnimationFrame(function () {
							panel.scrollIntoView({ block: 'nearest', inline: 'nearest' });
						});
					}
				}
				modPrimed = true;
			}

			current = clamp(current);
			render();
			return {
				wrap: wrap,
				step: step,
				setValue: function (value) {
					if (editing) return;
					current = clampTyped(value);
					if (!modOn) render();
				},
				setMod: setMod,
				updateLive: function (ctx) {
					if (!modOn || !spec || editing) return;
					const mod = liveMod(opId, paramKey);
					const value = root.SynthModulate.evaluate(mod, spec, ctx, opId + ':' + paramKey);
					if (value === undefined) return;
					liveValue = value;
					placePlayhead(liveValue);
					paintValue(liveValue);
					slider.setAttribute('aria-valuenow', String(liveValue));
					slider.setAttribute('aria-valuetext', formatDisplay(liveValue));
				}
			};
		}

		function makeXyzField(op, spec) {
			const wrap = el('div', spec.kind === 'xy' ? 'synth-xyz synth-xyz--xy' : 'synth-xyz');
			wrap.setAttribute('role', 'group');
			wrap.setAttribute('aria-label', spec.label);
			if (spec.visibleWhen) wrap.dataset.visibleWhen = spec.visibleWhen;
			wrap.appendChild(el('div', 'synth-xyz__head', spec.label));
			const axes = el('div', 'synth-xyz__axes');
			const mods = el('div', 'synth-xyz__mods');
			const letters = (root.SynthParams && root.SynthParams.axesFor)
				? root.SynthParams.axesFor(spec)
				: (spec.kind === 'xy' ? ['X', 'Y'] : ['X', 'Y', 'Z']);
			letters.forEach(function (axis) {
				const axisSpec = root.SynthParams
					? root.SynthParams.axisSpec(spec, axis)
					: { key: spec.key + axis, label: axis, kind: 'range', min: spec.min, max: spec.max, step: spec.step };
				const field = makeSlider(axisSpec.label, spec.min, spec.max, spec.step, function (value) {
					setParam(op.id, axisSpec.key, value);
				}, {
					modulate: true,
					opId: op.id,
					paramKey: axisSpec.key,
					spec: axisSpec,
					className: 'synth-xyz__axis',
					defaultValue: paramDefault(op.type, axisSpec.key, 0)
				});
				field.wrap.dataset.param = axisSpec.key;
				field.wrap.dataset.axis = axis.toLowerCase();
				sliders[op.id + ':' + axisSpec.key] = field;
				const panel = field.wrap.querySelector('.synth-mod');
				if (panel) mods.appendChild(panel);
				axes.appendChild(field.wrap);
			});
			wrap.appendChild(axes);
			wrap.appendChild(mods);
			return { wrap: wrap };
		}

		function setParam(id, key, value) {
			const op = ops().filter(function (item) {
				return item.id === id;
			})[0];
			if (op && op.type === 'camera' && !op.bypassed) armCameraFromOperators([op]);
			patch({ opParam: { id: id, key: key, value: value, presetId: null } });
		}

		function setParams(id, parameters, presetId) {
			patch({
				opParam: {
					id: id,
					parameters: parameters,
					presetId: presetId || null
				}
			});
		}

		function relayoutOpBody(opId) {
			const card = stack.querySelector('[data-id="' + opId + '"]');
			if (!card || !card.classList.contains('is-open')) return;
			const body = card.querySelector('.synth-op__body');
			if (!body) return;
			const g = getGsap();
			if (g) {
				g.killTweensOf(body);
				g.set(body, {
					height: 'auto',
					overflow: 'hidden',
					autoAlpha: 1,
					display: 'block'
				});
			} else {
				body.style.display = 'block';
				body.style.height = 'auto';
				body.style.opacity = '1';
				body.style.visibility = 'visible';
			}
		}

		function userPresets() {
			return (getState().presets || []);
		}

		function patchPresets(next) {
			patch({ presets: next });
		}

		function makePresetField(op) {
			const Presets = root.SynthPresets;
			const field = el('div', 'synth-field synth-presets');
			const top = el('div', 'synth-field__top');
			const title = el('span', '', 'Presets');
			top.appendChild(title);
			field.appendChild(top);
			const grid = el('div', 'synth-presets__grid');
			grid.setAttribute('role', 'listbox');
			grid.setAttribute('aria-label', 'Operator presets');
			field.appendChild(grid);
			const tools = el('div', 'synth-presets__tools');
			field.appendChild(tools);
			const form = el('div', 'synth-preset-form');
			form.hidden = true;
			field.appendChild(form);
			let lastSig = '';
			let formMode = null;

			function hideForm() {
				formMode = null;
				form.hidden = true;
				form.innerHTML = '';
				grid.hidden = false;
				title.textContent = 'Presets';
				relayoutOpBody(op.id);
			}

			function showForm(mode, preset) {
				const live = liveOp(op.id) || op;
				formMode = mode;
				form.hidden = false;
				form.innerHTML = '';
				grid.hidden = true;
				tools.hidden = true;
				title.textContent = mode === 'rename' ? 'Rename preset' : 'Save preset';

				form.appendChild(el(
					'p',
					'synth-preset-form__hint',
					mode === 'rename'
						? 'Change the name of this preset.'
						: 'Session only, or save to disk to keep it after ELO closes.'
				));
				const input = el('input', 'synth-pipe-rename synth-preset-form__name');
				input.type = 'text';
				input.maxLength = 32;
				input.value = mode === 'rename' && preset
					? preset.name
					: Presets.nextName(live.type, userPresets());
				input.setAttribute('aria-label', 'Preset name');
				form.appendChild(input);
				const actions = el('div', 'synth-preset-form__actions');

				function finish(nextPresets, presetId, message) {
					hideForm();
					const next = {};
					if (nextPresets) next.presets = nextPresets;
					if (presetId) next.opParam = { id: live.id, presetId: presetId };
					if (Object.keys(next).length) patch(next);
					if (message && root.SynthNotify) root.SynthNotify.show('success', message);
				}

				if (mode === 'rename' && preset) {
					const saveBtn = el('button', 'synth-btn synth-btn--fill', 'Rename');
					saveBtn.type = 'button';
					function commitRename() {
						const name = input.value.trim() || preset.name;
						finish(Presets.upsert(userPresets(), Object.assign({}, preset, { name: name })), preset.id);
					}
					saveBtn.addEventListener('click', commitRename);
					actions.appendChild(saveBtn);
					input.addEventListener('keydown', function (event) {
						if (event.key === 'Enter') {
							event.preventDefault();
							commitRename();
						}
					});
				} else {
					function commit(persisted) {
						const now = liveOp(op.id) || live;
						const name = input.value.trim() || Presets.nextName(now.type, userPresets());
						const created = Presets.create(now.type, name, now.parameters, persisted);
						finish(
							Presets.upsert(userPresets(), created),
							created.id,
							persisted ? 'Preset saved to disk' : 'Preset saved for this session'
						);
					}
					const sessionBtn = el('button', 'synth-btn', 'Save');
					sessionBtn.type = 'button';
					sessionBtn.addEventListener('click', function () {
						commit(false);
					});
					const diskBtn = el('button', 'synth-btn synth-btn--fill', 'Save to disk');
					diskBtn.type = 'button';
					diskBtn.addEventListener('click', function () {
						commit(true);
					});
					actions.appendChild(sessionBtn);
					actions.appendChild(diskBtn);
					input.addEventListener('keydown', function (event) {
						if (event.key === 'Enter') {
							event.preventDefault();
							commit(false);
						}
					});
				}

				const cancel = el('button', 'synth-btn', 'Cancel');
				cancel.type = 'button';
				cancel.addEventListener('click', function () {
					hideForm();
					paint(liveOp(op.id) || op);
				});
				actions.appendChild(cancel);
				form.appendChild(actions);
				relayoutOpBody(op.id);
				input.focus();
				input.select();
			}

			function paint(current) {
				if (!Presets) return;
				if (formMode) {
					relayoutOpBody(op.id);
					return;
				}
				const live = current || liveOp(op.id) || op;
				const items = Presets.catalog(live.type, userPresets());
				const active = Presets.findActive(live, userPresets());
				const sig = items.map(function (item) {
					return item.id + ':' + item.name + ':' + (item.persisted ? '1' : '0');
				}).join('|') + '#' + (active ? active.id : '') + '#' + (live.presetId || '');
				if (sig === lastSig && grid.childNodes.length) {
					relayoutOpBody(op.id);
					return;
				}
				lastSig = sig;
				grid.hidden = false;
				grid.innerHTML = '';
				items.forEach(function (preset) {
					const btn = el('button', 'synth-preset');
					btn.type = 'button';
					btn.setAttribute('role', 'option');
					const selected = !!(active && active.id === preset.id);
					btn.setAttribute('aria-selected', selected ? 'true' : 'false');
					btn.classList.toggle('is-active', selected);
					if (preset.origin === 'disk') btn.classList.add('is-disk');
					btn.appendChild(el('span', 'synth-preset__name', preset.name));
					if (preset.origin === 'disk') {
						const mark = el('span', 'synth-preset__disk');
						mark.appendChild(root.SynthIcons.svg('disk'));
						btn.appendChild(mark);
					}
					btn.addEventListener('click', function () {
						const now = liveOp(op.id) || live;
						setParams(now.id, Presets.applyTo(now, preset), preset.id);
					});
					grid.appendChild(btn);
				});
				const add = el('button', 'synth-preset synth-preset--add');
				add.type = 'button';
				add.setAttribute('aria-label', 'Save current parameters as a preset');
				add.appendChild(root.SynthIcons.svg('plus'));
				add.addEventListener('click', function () {
					showForm('save');
				});
				grid.appendChild(add);

				tools.innerHTML = '';
				if (!active || active.builtin) {
					tools.hidden = true;
					relayoutOpBody(op.id);
					return;
				}
				tools.hidden = false;
				if (!active.persisted) {
					const disk = el('button', 'synth-btn', 'Save to disk');
					disk.type = 'button';
					disk.addEventListener('click', function () {
						patchPresets(Presets.persist(userPresets(), active.id));
						if (root.SynthNotify) root.SynthNotify.show('success', 'Preset saved to disk');
					});
					tools.appendChild(disk);
				}
				const rename = el('button', 'synth-btn', 'Rename');
				rename.type = 'button';
				rename.addEventListener('click', function () {
					showForm('rename', active);
				});
				tools.appendChild(rename);
				const del = el('button', 'synth-btn', 'Delete');
				del.type = 'button';
				del.addEventListener('click', function () {
					patch({ opParam: { id: op.id, presetId: null } });
					patchPresets(Presets.remove(userPresets(), active.id));
				});
				tools.appendChild(del);
				relayoutOpBody(op.id);
			}

			paint(op);
			return { wrap: field, paint: paint, closeForm: hideForm };
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
			pop.addEventListener('pointerdown', function (event) {
				event.stopPropagation();
			});
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
				if (event.target.closest && event.target.closest('.synth-swatch__face, .synth-palettes__add, .synth-palette, .synth-color__face, .synth-ramp__notch, .synth-ramp__swatch')) return;
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
			let lastCatalogSig = '';

			function current() {
				const found = ops().filter(function (item) {
					return item.id === op.id;
				})[0];
				return lookupParams(found || op);
			}

			function catalogSig(resolved) {
				const items = Lookup ? Lookup.catalog(resolved.savedPalettes) : [];
				return items.map(function (palette) {
					return palette.id;
				}).join('|');
			}

			function selectedId(resolved) {
				return resolved && !resolved.dirty ? resolved.paletteId : '';
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

			function applySelection(resolved) {
				const active = selectedId(resolved);
				grid.querySelectorAll('.synth-palette').forEach(function (btn) {
					const selected = btn.dataset.paletteId === active;
					btn.classList.toggle('is-active', selected);
					btn.setAttribute('aria-selected', selected ? 'true' : 'false');
				});
			}

			function applySwatches(resolved) {
				const faces = edit.querySelectorAll('.synth-swatch__face');
				faces.forEach(function (btn) {
					const slot = btn.dataset.slot;
					const hex = slot === 'bg' ? resolved.bg : resolved.colors[Number(slot)];
					if (hex) btn.style.background = hex;
				});
				const addWrap = edit.querySelector('.synth-swatch--add');
				if (addWrap) addWrap.hidden = !resolved.dirty;
			}

			function pickPalette(id) {
				if (!Lookup) return;
				patchLookup(op.id, Lookup.applyPreset(current(), id));
				colorPicker.close();
			}

			function renderGrid(resolved) {
				const items = Lookup ? Lookup.catalog(resolved.savedPalettes) : [];
				lastCatalogSig = catalogSig(resolved);
				grid.innerHTML = '';
				items.forEach(function (palette) {
					const btn = el('button', 'synth-palette');
					btn.type = 'button';
					btn.setAttribute('role', 'option');
					btn.setAttribute('aria-label', 'Palette ' + palette.id);
					paintChip(btn, palette);
					const selected = palette.id === selectedId(resolved);
					btn.classList.toggle('is-active', selected);
					btn.setAttribute('aria-selected', selected ? 'true' : 'false');
					btn.addEventListener('pointerdown', function (event) {
						if (event.button !== 0 && event.pointerType === 'mouse') return;
						pickPalette(palette.id);
					});
					btn.addEventListener('click', function (event) {
						event.preventDefault();
						pickPalette(palette.id);
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
						applySwatches(resolved);
						return;
					}
					if (catalogSig(resolved) === lastCatalogSig && grid.childNodes.length) {
						applySelection(resolved);
						applySwatches(resolved);
						return;
					}
					render(resolved);
				}
			};
		}

		function makeRampField(op) {
			const Ramp = root.SynthRamp;
			const field = el('div', 'synth-field synth-ramp');
			const top = el('div', 'synth-field__top');
			top.appendChild(el('span', '', 'Ramp'));
			const posLabel = el('span', 'synth-ramp__pos', '—');
			top.appendChild(posLabel);
			field.appendChild(top);

			const editor = el('div', 'synth-ramp__editor');
			editor.tabIndex = 0;
			const notches = el('div', 'synth-ramp__notches');
			const track = el('button', 'synth-ramp__track');
			track.type = 'button';
			track.setAttribute('aria-label', 'Add color notch');
			editor.appendChild(notches);
			editor.appendChild(track);
			field.appendChild(editor);

			const tools = el('div', 'synth-ramp__tools');
			const addBtn = el('button', 'synth-ramp__tool');
			addBtn.type = 'button';
			addBtn.setAttribute('aria-label', 'Add notch');
			addBtn.appendChild(root.SynthIcons.svg('plus'));
			const swatch = el('button', 'synth-ramp__swatch');
			swatch.type = 'button';
			swatch.setAttribute('aria-label', 'Edit notch color');
			const removeBtn = el('button', 'synth-ramp__tool');
			removeBtn.type = 'button';
			removeBtn.setAttribute('aria-label', 'Remove notch');
			removeBtn.appendChild(root.SynthIcons.svg('x'));
			tools.appendChild(addBtn);
			tools.appendChild(swatch);
			tools.appendChild(removeBtn);
			field.appendChild(tools);

			let selectedId = null;
			let pickingSlot = null;
			let notchPointer = null;
			let notchIntent = null;
			let trackPointer = null;

			function current() {
				const found = ops().filter(function (item) {
					return item.id === op.id;
				})[0];
				return Ramp
					? Ramp.normalize((found || op).parameters || {})
					: { stops: [], interpolate: 'linear' };
			}

			function commit(next) {
				setParams(op.id, { stops: next.stops });
			}

			function selectedStop(resolved) {
				const stops = (resolved && resolved.stops) || [];
				for (let i = 0; i < stops.length; i++) {
					if (stops[i].id === selectedId) return stops[i];
				}
				return stops[0] || null;
			}

			function posFromEvent(event) {
				const rect = track.getBoundingClientRect();
				if (!rect.width) return 0;
				return Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
			}

			function openColor(hex, anchor) {
				pickingSlot = anchor;
				colorPicker.open(hex, anchor, function (nextHex) {
					if (!Ramp || !selectedId) return;
					const next = Ramp.setStop(current(), selectedId, { color: nextHex });
					commit(next);
					paint(next);
				}, function () {
					pickingSlot = null;
					paint(current());
				});
				paint(current());
			}

			function bindNotch(btn, stop) {
				btn.addEventListener('pointerdown', function (event) {
					if (event.button !== 0 && event.pointerType === 'mouse') return;
					selectedId = stop.id;
					notchPointer = {
						id: event.pointerId,
						startX: event.clientX,
						startY: event.clientY,
						stopId: stop.id
					};
					notchIntent = null;
					paint(current());
				});
			}

			function makeNotch(stop) {
				const btn = el('button', 'synth-ramp__notch');
				btn.type = 'button';
				btn.dataset.stopId = stop.id;
				btn.style.left = (stop.pos * 100) + '%';
				btn.style.setProperty('--notch-color', stop.color);
				btn.setAttribute('aria-label', 'Color notch at ' + stop.pos.toFixed(2));
				bindNotch(btn, stop);
				return btn;
			}

			function paint(resolved) {
				const data = resolved || current();
				if (Ramp) {
					track.style.background = Ramp.cssGradient(data.stops, data.interpolate);
				}
				const ids = (data.stops || []).map(function (stop) {
					return stop.id;
				}).join('|');
				if (ids !== notches.dataset.ids) {
					notches.dataset.ids = ids;
					notches.innerHTML = '';
					(data.stops || []).forEach(function (stop) {
						notches.appendChild(makeNotch(stop));
					});
				} else {
					(data.stops || []).forEach(function (stop) {
						const btn = notches.querySelector('[data-stop-id="' + stop.id + '"]');
						if (!btn) return;
						btn.style.left = (stop.pos * 100) + '%';
						btn.style.setProperty('--notch-color', stop.color);
						btn.setAttribute('aria-label', 'Color notch at ' + stop.pos.toFixed(2));
					});
				}
				if (!selectedId || !(data.stops || []).some(function (stop) {
					return stop.id === selectedId;
				})) {
					selectedId = data.stops && data.stops[0] ? data.stops[0].id : null;
				}
				const sel = selectedStop(data);
				posLabel.textContent = sel ? Number(sel.pos).toFixed(2) : '—';
				swatch.style.background = sel ? sel.color : '#111';
				swatch.classList.toggle('is-active', colorPicker.isOpen() && pickingSlot === swatch);
				notches.querySelectorAll('.synth-ramp__notch').forEach(function (btn) {
					btn.classList.toggle('is-active', btn.dataset.stopId === selectedId);
				});
				const count = (data.stops || []).length;
				addBtn.disabled = !Ramp || count >= Ramp.maxStops;
				removeBtn.disabled = !Ramp || count <= 2;
			}

			window.addEventListener('pointermove', function (event) {
				if (!notchPointer || event.pointerId !== notchPointer.id) return;
				const dx = event.clientX - notchPointer.startX;
				const dy = event.clientY - notchPointer.startY;
				if (!notchIntent) {
					if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
					notchIntent = Math.abs(dy) > Math.abs(dx) ? 'scroll' : 'slide';
					if (notchIntent === 'slide') {
						sliding = true;
						const node = notches.querySelector('[data-stop-id="' + notchPointer.stopId + '"]');
						try {
							if (node) node.setPointerCapture(event.pointerId);
						} catch (err) { /* ignore */ }
					}
				}
				if (notchIntent !== 'slide' || !Ramp) return;
				event.preventDefault();
				selectedId = notchPointer.stopId;
				const next = Ramp.setStop(current(), selectedId, { pos: posFromEvent(event) });
				commit(next);
				paint(next);
			}, { passive: false });

			window.addEventListener('pointerup', function (event) {
				if (!notchPointer || event.pointerId !== notchPointer.id) return;
				const stopId = notchPointer.stopId;
				const wasTap = notchIntent === null;
				notchPointer = null;
				notchIntent = null;
				sliding = false;
				if (!wasTap || !Ramp) return;
				selectedId = stopId;
				const sel = selectedStop(current());
				const node = notches.querySelector('[data-stop-id="' + stopId + '"]');
				if (sel && node) openColor(sel.color, node);
				else paint(current());
			});

			window.addEventListener('pointercancel', function (event) {
				if (!notchPointer || event.pointerId !== notchPointer.id) return;
				notchPointer = null;
				notchIntent = null;
				sliding = false;
			});

			track.addEventListener('pointerdown', function (event) {
				if (event.button !== 0 && event.pointerType === 'mouse') return;
				trackPointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
			});

			track.addEventListener('pointerup', function (event) {
				if (!trackPointer || event.pointerId !== trackPointer.id) return;
				const dx = event.clientX - trackPointer.x;
				const dy = event.clientY - trackPointer.y;
				trackPointer = null;
				if (Math.abs(dx) > 8 || Math.abs(dy) > 8 || !Ramp) return;
				const resolved = current();
				if (resolved.stops.length >= Ramp.maxStops) return;
				const pos = posFromEvent(event);
				const near = resolved.stops.some(function (stop) {
					return Math.abs(stop.pos - pos) < 0.03;
				});
				if (near) return;
				const next = Ramp.addStop(resolved, pos);
				selectedId = next.stops[next.stops.length - 1].id;
				commit(next);
				paint(next);
			});

			addBtn.addEventListener('click', function () {
				if (!Ramp) return;
				const resolved = current();
				if (resolved.stops.length >= Ramp.maxStops) return;
				const next = Ramp.addStop(resolved, Ramp.largestGapPos(resolved.stops));
				selectedId = next.stops[next.stops.length - 1].id;
				commit(next);
				paint(next);
			});

			removeBtn.addEventListener('click', function () {
				if (!Ramp || !selectedId) return;
				const next = Ramp.removeStop(current(), selectedId);
				selectedId = null;
				colorPicker.close();
				commit(next);
				paint(next);
			});

			swatch.addEventListener('click', function () {
				const sel = selectedStop(current());
				if (!sel) return;
				if (colorPicker.isOpen() && pickingSlot === swatch) {
					colorPicker.close();
					return;
				}
				openColor(sel.color, swatch);
			});

			editor.addEventListener('keydown', function (event) {
				if (!Ramp || !selectedId) return;
				const resolved = current();
				const sel = selectedStop(resolved);
				if (!sel) return;
				if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
					event.preventDefault();
					const delta = event.key === 'ArrowRight' ? 0.01 : -0.01;
					const next = Ramp.setStop(resolved, selectedId, { pos: sel.pos + delta });
					commit(next);
					paint(next);
					return;
				}
				if ((event.key === 'Backspace' || event.key === 'Delete') && resolved.stops.length > 2) {
					event.preventDefault();
					const next = Ramp.removeStop(resolved, selectedId);
					selectedId = null;
					colorPicker.close();
					commit(next);
					paint(next);
				}
			});

			paint(current());

			return {
				wrap: field,
				setParams: function (parameters) {
					const resolved = Ramp ? Ramp.normalize(parameters || {}) : parameters || {};
					if (picking || sliding) {
						track.style.background = Ramp
							? Ramp.cssGradient(resolved.stops, resolved.interpolate)
							: track.style.background;
						(resolved.stops || []).forEach(function (stop) {
							const btn = notches.querySelector('[data-stop-id="' + stop.id + '"]');
							if (!btn) return;
							btn.style.left = (stop.pos * 100) + '%';
							btn.style.setProperty('--notch-color', stop.color);
						});
						const sel = selectedStop(resolved);
						if (sel) {
							posLabel.textContent = Number(sel.pos).toFixed(2);
							swatch.style.background = sel.color;
						}
						return;
					}
					paint(resolved);
				}
			};
		}

		function insertBtn(index, kind) {
			const isAdd = kind === 'add';
			const wrap = el('div', isAdd ? 'synth-insert synth-insert--add' : 'synth-insert synth-insert--node');
			const btn = el('button', 'synth-insert__btn');
			btn.type = 'button';
			btn.setAttribute('aria-label', 'Add operator here');
			btn.dataset.tip = 'Add Operator';
			btn.dataset.tipDesc = 'Open the library and insert a new operator at this point in the chain.';
			btn.appendChild(root.SynthIcons.svg('plus'));
			if (isAdd) btn.appendChild(el('span', 'synth-insert__label', 'Add Operator'));
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
			if (instant) {
				g.set(body, vars);
				if (open) g.set(body, { height: 'auto' });
				return;
			}
			g.to(body, Object.assign({
				duration: open ? dur(0.38) : dur(0.26),
				ease: open ? 'power2.out' : 'power2.in',
				onComplete: function () {
					if (open) g.set(body, { height: 'auto' });
				}
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

		function paintVisibleParams(card, op) {
			if (!card || !op) return;
			card.querySelectorAll('[data-visible-when]').forEach(function (node) {
				const when = node.dataset.visibleWhen || '';
				if (when.indexOf('param:') !== 0) return;
				const parts = when.slice(6).split('=');
				node.hidden = String((op.parameters || {})[parts[0]]) !== parts[1];
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
			const soloed = !!(root.SynthPipeline.isSoloed && root.SynthPipeline.isSoloed(ops(), op.id));
			if (soloed) card.classList.add('is-solo');

			const head = el('header', 'synth-op__head');

			const grip = el('button', 'synth-icon synth-icon--grip');
			grip.type = 'button';
			grip.setAttribute('aria-label', 'Drag to reorder');
			grip.dataset.tip = 'Reorder';
			grip.dataset.tipDesc = 'Drag this handle to change the operator order in the chain.';
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

			const headTools = el('div', 'synth-op__head-tools');
			if (def.category === 'generator') {
				const soloBtn = el('button', 'synth-icon synth-op__solo', 'S');
				soloBtn.type = 'button';
				soloBtn.setAttribute('aria-label', 'Solo. Bypass every other operator and leave only this generator on the output.');
				soloBtn.setAttribute('aria-pressed', soloed ? 'true' : 'false');
				if (soloed) soloBtn.classList.add('is-active');
				soloBtn.dataset.tip = 'Solo';
				soloBtn.dataset.tipDesc = 'Bypass every other operator and leave only this generator on the output.';
				bindTip(soloBtn);
				soloBtn.addEventListener('pointerup', function (event) {
					if (event.pointerType === 'mouse' && event.button !== 0) return;
					event.preventDefault();
					event.stopPropagation();
					if (!root.SynthPipeline.setSolo) return;
					patchOps(root.SynthPipeline.setSolo(ops(), op.id));
				});
				headTools.appendChild(soloBtn);
			}

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
			bypassBtn.dataset.bypassed = op.bypassed ? '1' : '0';
			if (op.bypassed) bypassBtn.classList.add('is-active');
			headTools.appendChild(bypassBtn);
			head.appendChild(headTools);

			const tools = el('div', 'synth-op__tools');

			tools.appendChild(iconBtn(
				'question',
				def.name || 'Help',
				def.help || 'Operator help',
				function () {
					openOpHelp(def);
				}
			));

			const upBtn = iconBtn('caret-up', 'Move up', 'Move this operator one step earlier in the chain.', function () {
				patchOps(root.SynthPipeline.move(ops(), op.id, -1));
			});
			upBtn.disabled = index === 0;
			tools.appendChild(upBtn);

			const downBtn = iconBtn('caret-down', 'Move down', 'Move this operator one step later in the chain.', function () {
				patchOps(root.SynthPipeline.move(ops(), op.id, 1));
			});
			downBtn.disabled = index === total - 1;
			tools.appendChild(downBtn);

			tools.appendChild(iconBtn('copy', 'Duplicate', 'Insert a copy of this operator directly below it.', function () {
				patchOps(root.SynthPipeline.duplicate(ops(), op.id));
			}));

			tools.appendChild(iconBtn('trash', 'Delete', 'Remove this operator from the chain.', function () {
				if (expandedId === op.id) expandedId = null;
				patchOps(root.SynthPipeline.remove(ops(), op.id));
			}));

			card.appendChild(head);

			const body = el('div', 'synth-op__body');
			const inner = el('div', 'synth-op__body-inner');
			inner.appendChild(tools);
			if (root.SynthPresets) {
				const presetField = makePresetField(op);
				presetFields[op.id] = presetField;
				inner.appendChild(presetField.wrap);
			}
			const params = def.params || [];
			params.forEach(function (spec) {
				if (spec.show === 'afterInput' && index === 0) return;
				if (spec.kind === 'palette') {
					const field = makePaletteField(op);
					palettes[op.id] = field;
					inner.appendChild(field.wrap);
					return;
				}
				if (spec.kind === 'ramp') {
					const field = makeRampField(op);
					ramps[op.id] = field;
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
				if (spec.kind === 'xyz' || spec.kind === 'xy') {
					inner.appendChild(makeXyzField(op, spec).wrap);
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
					spec: spec,
					defaultValue: paramDefault(op.type, spec.key, spec.min)
				});
				field.wrap.dataset.param = spec.key;
				if (spec.visibleWhen) field.wrap.dataset.visibleWhen = spec.visibleWhen;
				sliders[op.id + ':' + spec.key] = field;
				inner.appendChild(field.wrap);
			});
			body.appendChild(inner);
			card.appendChild(body);
			paintCamStatus(card, op);
			paintVisibleParams(card, op);
			return card;
		}

		function stackIdsOverlap(prevOps, pipeline) {
			const prev = {};
			prevOps.forEach(function (node) {
				if (node.dataset.id) prev[node.dataset.id] = true;
			});
			return (pipeline || []).some(function (op) {
				return !!prev[op.id];
			});
		}

		function rebuildStack(pipeline) {
			const g = getGsap();
			const Flip = window.Flip;
			const prevOps = stack.querySelectorAll('.synth-op');
			const canFlip = !!(g && Flip && prevOps.length && stackIdsOverlap(prevOps, pipeline));
			const state = canFlip ? Flip.getState(prevOps) : null;

			Object.keys(sliders).forEach(function (key) {
				delete sliders[key];
			});
			Object.keys(palettes).forEach(function (key) {
				delete palettes[key];
			});
			Object.keys(ramps).forEach(function (key) {
				delete ramps[key];
			});
			Object.keys(presetFields).forEach(function (key) {
				delete presetFields[key];
			});
			Object.keys(colors).forEach(function (key) {
				delete colors[key];
			});
			colorPicker.close();
			if (g) g.killTweensOf(stack.querySelectorAll('.synth-op, .synth-op__body, .synth-op__caret'));
			stack.innerHTML = '';
			stack.classList.toggle('is-empty', !pipeline.length);
			if (!pipeline.length) {
				stack.appendChild(el('p', 'synth-stack__empty', 'Tap Add Operator to start the chain.'));
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

		function localPreviewOn() {
			return localOn || !!(root.SynthPreview && SynthPreview.running && SynthPreview.running());
		}

		function previewView() {
			if (viewingTemplate()) {
				const previewId = getState().previewTemplateId || '';
				if (previewId) {
					const live = root.SynthTemplates
						? root.SynthTemplates.find(templates(), previewId)
						: selectedTemplate();
					if (live) return live;
				}
			}
			return activePipe();
		}

		function refreshPreview(view) {
			previewName.textContent = view ? view.name : 'Chain';
			if (localPreviewOn()) {
				previewImg.hidden = true;
				previewEmpty.hidden = true;
				return;
			}
			if (view && liveFrameId && liveFrameId !== view.id) liveFrame = '';
			const url = liveFrame || (view && view.thumbnail);
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
				if (!localOn) previewEmpty.textContent = 'Waiting for output';
				refreshPreview(previewView());
				return;
			}
			previewEmpty.textContent = 'Waiting for live';
			if (!localOn && !liveFrame && previewImg.hidden) {
				previewEmpty.hidden = false;
			}
		}

		function setLocalMode(on, notify) {
			localOn = !!on;
			if (localBtn) {
				localBtn.classList.toggle('is-on', localOn);
				localBtn.setAttribute('aria-pressed', localOn ? 'true' : 'false');
			}
			preview.classList.toggle('is-gpu', localOn);
			preview.classList.toggle('is-local', localOn);
			if (localOn) {
				previewImg.hidden = true;
				previewEmpty.hidden = true;
			} else {
				previewEmpty.textContent = liveOn ? 'Waiting for live' : 'Waiting for output';
				refreshPreview(previewView());
			}
			if (notify && typeof setLocalPreview === 'function') setLocalPreview(localOn);
		}

		const recW = 960;
		const recH = 540;
		let recBusy = false;
		let recHost = null;
		let recBtn = null;
		let recTime = null;

		function formatRecTime(ms) {
			const total = Math.max(0, Math.floor(ms / 1000));
			const m = Math.floor(total / 60);
			const s = total % 60;
			return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
		}

		function recOn() {
			return !!(root.SynthRecorder && SynthRecorder.recording && SynthRecorder.recording());
		}

		function displayCanvas() {
			if (root.SynthDisplay && typeof root.SynthDisplay.canvas === 'function') {
				return root.SynthDisplay.canvas();
			}
			return document.querySelector('#app canvas');
		}

		function recSizeFor(canvas) {
			const srcW = (canvas && canvas.width) || recW;
			const srcH = (canvas && canvas.height) || recH;
			const scale = Math.min(1, 1280 / Math.max(srcW, srcH, 1));
			return {
				width: Math.max(2, Math.round(srcW * scale)),
				height: Math.max(2, Math.round(srcH * scale))
			};
		}

		function paintRecChrome() {
			if (isControlPage()) {
				document.body.classList.remove('is-rec-armed', 'is-rec-on');
				if (recHost) recHost.hidden = true;
				return;
			}
			const on = recOn();
			const sheetOpen = sheet && !sheet.hidden;
			const show = (isPhoneClient() || on) &&
				hasLiveCamera((previewView() && previewView().operators) || ops()) &&
				(!sheetOpen || on);
			document.body.classList.toggle('is-rec-armed', show);
			document.body.classList.toggle('is-rec-on', on);
			if (!recHost) return;
			recHost.hidden = !show;
			recHost.classList.toggle('is-on', on);
			if (recBtn) {
				recBtn.classList.toggle('is-on', on);
				recBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
				recBtn.setAttribute('aria-label', on ? 'Stop recording' : 'Record video');
			}
			if (recTime) {
				recTime.hidden = !on;
				if (on) recTime.textContent = formatRecTime(root.SynthRecorder.elapsed());
			}
		}

		function clearRecordSize() {
			if (root.SynthPreview && SynthPreview.setRecordSize) {
				SynthPreview.setRecordSize(0, 0);
			}
		}

		function waitForCanvas(tries) {
			return new Promise(function (resolve, reject) {
				function check(left) {
					const canvas = displayCanvas();
					const ready = !!(canvas && canvas.width > 2 && canvas.height > 2);
					if (ready) {
						resolve(canvas);
						return;
					}
					if (left <= 0) {
						reject(new Error('Preview is not running'));
						return;
					}
					root.requestAnimationFrame(function () {
						check(left - 1);
					});
				}
				check(tries || 60);
			});
		}

		function finishRec(silent) {
			if (!root.SynthRecorder || recBusy) return;
			if (!recOn()) {
				clearRecordSize();
				paintRecChrome();
				return;
			}
			recBusy = true;
			SynthRecorder.stop().then(function (blob) {
				clearRecordSize();
				paintRecChrome();
				if (!blob) {
					if (!silent && root.SynthNotify) {
						SynthNotify.show('warning', 'Nothing was recorded.');
					}
					return;
				}
				return SynthRecorder.save(blob).then(function (how) {
					if (how === 'abort' || how === 'empty') return;
					if (!root.SynthNotify) return;
					if (how === 'shared') SynthNotify.show('success', 'Video ready.');
					else SynthNotify.show('success', 'Video downloaded. Save it to your gallery.');
				});
			}).catch(function () {
				if (!silent && root.SynthNotify) {
					SynthNotify.show('error', 'Could not save the video.');
				}
			}).then(function () {
				recBusy = false;
				paintRecChrome();
			});
		}

		function startRec() {
			if (!root.SynthRecorder || recBusy || recOn()) return;
			if (isControlPage() || !isPhoneClient()) return;
			if (!SynthRecorder.supported()) {
				if (root.SynthNotify) {
					SynthNotify.show('warning', 'This browser cannot record video.');
				}
				return;
			}
			recBusy = true;
			waitForCanvas(60).then(function (canvas) {
				return SynthRecorder.start(canvas, recSizeFor(canvas));
			}).then(function () {
				recBusy = false;
				paintRecChrome();
			}).catch(function () {
				recBusy = false;
				clearRecordSize();
				paintRecChrome();
				if (root.SynthNotify) {
					SynthNotify.show('error', 'Could not start recording.');
				}
			});
		}

		function toggleRec() {
			if (recOn()) finishRec(false);
			else startRec();
		}

		if (!isControlPage()) {
			recHost = el('div', 'synth-rec');
			recHost.hidden = true;
			recTime = el('p', 'synth-rec__time', '00:00');
			recTime.hidden = true;
			recTime.setAttribute('aria-live', 'off');
			recBtn = el('button', 'synth-rec__btn');
			recBtn.type = 'button';
			recBtn.setAttribute('aria-pressed', 'false');
			recBtn.setAttribute('aria-label', 'Record video');
			recBtn.appendChild(el('span', 'synth-rec__dot'));
			recBtn.addEventListener('click', toggleRec);
			recHost.appendChild(recTime);
			recHost.appendChild(recBtn);
			document.body.appendChild(recHost);
			if (root.SynthRecorder && SynthRecorder.onChange) {
				SynthRecorder.onChange(paintRecChrome);
			}
			document.addEventListener('visibilitychange', function () {
				if (document.hidden && recOn()) finishRec(false);
			});
			if (window.matchMedia) {
				const phoneMq = window.matchMedia('(pointer: coarse)');
				const onPhoneMq = function () {
					paintRecChrome();
				};
				if (phoneMq.addEventListener) phoneMq.addEventListener('change', onPhoneMq);
				else if (phoneMq.addListener) phoneMq.addListener(onPhoneMq);
			}
		}

		function setPreviewFrame(url, pipeId) {
			if (localPreviewOn()) return;
			if (!url) return;
			liveFrame = url;
			if (pipeId) liveFrameId = pipeId;
			previewSeq += 1;
			const seq = previewSeq;
			const loader = new Image();
			loader.onload = function () {
				if (seq !== previewSeq || localPreviewOn()) return;
				if (previewImg.getAttribute('src') !== url) previewImg.src = url;
				previewImg.hidden = false;
				previewEmpty.hidden = true;
			};
			loader.src = url;
		}

		function makeTile(item, activeId, kind) {
			const tile = el('button', 'synth-pipe-tile');
			tile.type = 'button';
			tile.dataset.pipe = item.id;
			tile.setAttribute('aria-pressed', item.id === activeId ? 'true' : 'false');
			if (item.id === activeId) tile.classList.add('is-active');
			const thumb = el('div', 'synth-pipe-tile__thumb');
			const img = el('img');
			img.alt = '';
			if (item.thumbnail) img.src = item.thumbnail;
			else img.hidden = true;
			thumb.appendChild(img);
			const progress = el('span', 'synth-pipe-tile__progress');
			progress.setAttribute('aria-hidden', 'true');
			thumb.appendChild(progress);
			tile.appendChild(thumb);
			tile.appendChild(el('span', 'synth-pipe-tile__name', item.name));
			if (kind === 'template') {
				tile.setAttribute('aria-label', item.name + '. Tap to preview. Tap again to add to the SET.');
				tile.addEventListener('click', function () {
					if (selectedTemplateId === item.id && (getState().previewTemplateId || '') === item.id) {
						sendTemplateToSet(item);
						return;
					}
					selectedTemplateId = item.id;
					setPreview(item.id);
					refresh();
				});
				return tile;
			}
			tile.addEventListener('click', function () {
				expandedId = null;
				if (typeof capturePipe === 'function') capturePipe();
				armCameraFromOperators(item.operators);
				if (getState().activePipeId === item.id) {
					const bump = root.SynthAutoplay
						? root.SynthAutoplay.manualSelectPatch(getState(), item.id, Date.now())
						: null;
					if (bump) patch(bump);
					return;
				}
				patch(mergeAutoplaySelect({ activePipeId: item.id }, item.id));
			});
			return tile;
		}

		function rebuildGrid(pipes, activeId, items, selectedId) {
			meterMotionKey = '';
			grid.innerHTML = '';
			if (galleryMode === 'templates') {
				grid.setAttribute('aria-label', 'TEMPLATES');
				if (!(items || []).length) {
					grid.appendChild(el(
						'p',
						'synth-pipe-grid__empty',
						'Save a chain from the SET to keep it here.'
					));
					return;
				}
				grid.appendChild(el(
					'p',
					'synth-pipe-grid__hint',
					'Tap to preview. Tap again to add to the SET.'
				));
				(items || []).forEach(function (item) {
					grid.appendChild(makeTile(item, selectedId, 'template'));
				});
				return;
			}
			grid.setAttribute('aria-label', 'SET');
			(pipes || []).forEach(function (pipe) {
				grid.appendChild(makeTile(pipe, activeId, 'pipe'));
			});
			const add = el('button', 'synth-pipe-tile synth-pipe-tile--new');
			add.type = 'button';
			add.setAttribute('aria-label', 'New chain');
			const plusWrap = el('span', 'synth-pipe-tile__plus');
			plusWrap.appendChild(root.SynthIcons.svg('plus'));
			add.appendChild(plusWrap);
			add.appendChild(el('span', 'synth-pipe-tile__name', 'New Chain'));
			add.addEventListener('click', function () {
				const s = getState();
				const pipe = root.SynthPipes.createNew(s.pipes);
				expandedId = null;
				patch(mergeAutoplaySelect({
					pipes: (s.pipes || []).concat([pipe]),
					activePipeId: pipe.id
				}, pipe.id));
			});
			grid.appendChild(add);
		}

		function refreshThumbs(items) {
			(items || []).forEach(function (item) {
				const tile = grid.querySelector('[data-pipe="' + item.id + '"]');
				if (!tile) return;
				const img = tile.querySelector('img');
				if (!img) return;
				if (item.thumbnail) {
					if (img.getAttribute('src') !== item.thumbnail) img.src = item.thumbnail;
					img.hidden = false;
				} else {
					img.removeAttribute('src');
					img.hidden = true;
				}
			});
		}

		function paintPlayIcon(on) {
			const key = on ? 'stop' : 'play';
			if (playBtn.dataset.icon === key) return;
			playBtn.dataset.icon = key;
			playIconWrap.innerHTML = '';
			playIconWrap.appendChild(root.SynthIcons.svg(key));
			const label = playBtn.querySelector('.synth-autoplay__play-label');
			if (label) label.textContent = on ? 'Stop' : 'Play';
		}

		let frozenAutoplayProgress = 0;

		function ensureMeterBars(count) {
			const n = Math.max(1, Math.round(count) || 1);
			if (n === lastMeterBars && meterBars.childNodes.length === n) return false;
			lastMeterBars = n;
			meterBars.innerHTML = '';
			meterBars.style.gridTemplateColumns = 'repeat(' + n + ', minmax(0, 1fr))';
			for (let i = 0; i < n; i += 1) {
				const cell = el('span', 'synth-autoplay__meter-bar');
				cell.appendChild(el('span', 'synth-autoplay__meter-bar-fill'));
				meterBars.appendChild(cell);
			}
			return true;
		}

		function paintAutoplayProgress(s, ap, on) {
			if (!root.SynthAutoplay) return;
			s = s || getState();
			ap = ap || root.SynthAutoplay.normalize(s.autoplay);
			if (on == null) on = !!(ap.enabled && root.SynthAutoplay.canRun(s));
			const held = !!(on && s.previewTemplateId);
			const dur = on ? root.SynthAutoplay.durationMs(s) : 0;
			let p = 0;
			let remain = 0;
			if (held) {
				p = frozenAutoplayProgress;
			} else if (on) {
				p = root.SynthAutoplay.progress(s, Date.now());
				frozenAutoplayProgress = p;
				remain = dur > 0 ? Math.max(0, (1 - p) * dur) : 0;
			} else {
				frozenAutoplayProgress = 0;
			}
			const clock = root.SynthClock ? root.SynthClock.fromState(s) : null;
			const key = [
				on ? (held ? 'hold' : 'run') : 'off',
				ap.lastSwitchMs,
				ap.unit,
				ap.intervalSec,
				ap.intervalBars,
				s.activePipeId || '',
				galleryMode,
				clock ? clock.bpm : ''
			].join('|');
			if (key === meterMotionKey) return;
			meterMotionKey = key;

			const activeId = s.activePipeId;
			grid.querySelectorAll('.synth-pipe-tile__progress').forEach(function (bar) {
				const tile = bar.closest('[data-pipe]');
				const show = on && galleryMode === 'set' && tile && tile.dataset.pipe === activeId;
				if (show && !held) animateScaleX(bar, p, 1, remain);
				else {
					cancelScaleAnim(bar);
					bar.style.transform = 'scaleX(' + (show ? p : 0) + ')';
				}
			});
			const barsMode = ap.unit === 'bars';
			meter.classList.toggle('is-bars', barsMode);
			meter.classList.toggle('is-seconds', !barsMode);
			meter.classList.toggle('is-on', on);
			if (barsMode) {
				ensureMeterBars(ap.intervalBars);
				cancelScaleAnim(meterFill);
				meterFill.style.transform = 'scaleX(0)';
				const n = Math.max(1, ap.intervalBars);
				const pos = p * n;
				const oneBarMs = dur > 0 ? dur / n : 0;
				const cells = meterBars.children;
				for (let i = 0; i < cells.length; i += 1) {
					const cell = cells[i];
					const fill = cell.firstElementChild;
					const frac = Math.max(0, Math.min(1, pos - i));
					cell.classList.toggle('is-done', frac >= 1);
					cell.classList.toggle('is-on', on && frac > 0 && frac < 1);
					if (!fill) continue;
					if (!on || held) {
						cancelScaleAnim(fill);
						fill.style.transform = 'scaleX(' + (on ? frac : 0) + ')';
					} else if (frac >= 1) {
						cancelScaleAnim(fill);
						fill.style.transform = 'scaleX(1)';
					} else if (frac > 0) {
						animateScaleX(fill, frac, 1, (1 - frac) * oneBarMs);
					} else {
						animateScaleX(fill, 0, 1, oneBarMs, (i - pos) * oneBarMs);
					}
				}
			} else if (on && !held) {
				Array.prototype.forEach.call(meterBars.querySelectorAll('.synth-autoplay__meter-bar-fill'), cancelScaleAnim);
				animateScaleX(meterFill, p, 1, remain);
			} else {
				Array.prototype.forEach.call(meterBars.querySelectorAll('.synth-autoplay__meter-bar-fill'), cancelScaleAnim);
				cancelScaleAnim(meterFill);
				meterFill.style.transform = 'scaleX(' + (on ? p : 0) + ')';
			}
		}

		function refreshAutoplay() {
			if (!root.SynthAutoplay) return;
			const s = getState();
			const ap = root.SynthAutoplay.normalize(s.autoplay);
			const runnable = root.SynthAutoplay.canRun(s);
			const on = ap.enabled && runnable;
			playBtn.disabled = !runnable && !ap.enabled;
			playBtn.title = runnable
				? (on ? 'Stop SET autoplay' : 'Play SET autoplay')
				: 'Add another chain to the SET to use autoplay';
			playBtn.classList.toggle('is-on', on);
			playBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
			playBtn.setAttribute('aria-label', on ? 'Stop SET autoplay' : 'Play SET autoplay');
			intervalNum.setAttribute(
				'aria-label',
				ap.unit === 'bars' ? 'Autoplay bars' : 'Autoplay seconds'
			);
			paintPlayIcon(on);
			Object.keys(modeBtns).forEach(function (id) {
				const active = ap.mode === id;
				modeBtns[id].classList.toggle('is-active', active);
				modeBtns[id].setAttribute('aria-pressed', active ? 'true' : 'false');
			});
			Object.keys(unitBtns).forEach(function (id) {
				const active = ap.unit === id;
				unitBtns[id].classList.toggle('is-active', active);
				unitBtns[id].setAttribute('aria-pressed', active ? 'true' : 'false');
			});
			if (!editingInterval) {
				intervalNum.textContent = String(ap.unit === 'bars' ? ap.intervalBars : ap.intervalSec);
				intervalUnit.textContent = ap.unit === 'bars'
					? (ap.intervalBars === 1 ? 'bar' : 'bars')
					: 's';
			}
			minusBtn.disabled = ap.unit === 'bars'
				? ap.intervalBars <= root.SynthAutoplay.BAR_MIN
				: ap.intervalSec <= root.SynthAutoplay.SEC_MIN;
			plusBtn.disabled = ap.unit === 'bars'
				? ap.intervalBars >= root.SynthAutoplay.BAR_MAX
				: ap.intervalSec >= root.SynthAutoplay.SEC_MAX;
			autoplayBar.classList.toggle('is-on', on);
			autoplayBar.classList.toggle('is-held', on && !!s.previewTemplateId);
			paintAutoplayProgress(s, ap, on);
		}

		function refreshGalleryChrome() {
			Object.keys(galleryTabBtns).forEach(function (id) {
				const on = galleryMode === id;
				galleryTabBtns[id].classList.toggle('is-active', on);
				galleryTabBtns[id].setAttribute('aria-selected', on ? 'true' : 'false');
			});
			const onSet = galleryMode === 'set';
			saveTplBtn.hidden = !onSet;
			clockBar.hidden = !onSet;
			autoplayBar.hidden = !onSet;
			setEditorHidden(!onSet);
			if (onSet) {
				if (shareBtn.parentNode !== activeTools) activeTools.appendChild(shareBtn);
				if (deletePipeBtn.parentNode !== activeTools) activeTools.appendChild(deletePipeBtn);
				galleryActions.hidden = true;
			} else {
				galleryActions.appendChild(addToSetBtn);
				galleryActions.appendChild(shareBtn);
				galleryActions.appendChild(deletePipeBtn);
				galleryActions.hidden = !templates().length;
			}
		}

		function refresh() {
			const s = getState();
			const pipes = s.pipes || [];
			const items = templates();
			const pipeline = ops();
			if (selectedTemplateId && items.length && !items.some(function (item) {
				return item.id === selectedTemplateId;
			})) {
				selectedTemplateId = '';
			}
			refreshGalleryChrome();
			const activeId = galleryMode === 'templates' ? selectedTemplateId : s.activePipeId;
			const gsig = gridSignature(galleryMode, pipes, items);
			if (gsig !== lastGridSig) {
				lastGridSig = gsig;
				rebuildGrid(pipes, s.activePipeId, items, selectedTemplateId);
			} else {
				refreshThumbs(galleryMode === 'templates' ? items : pipes);
				(galleryMode === 'templates' ? items : pipes).forEach(function (item) {
					const tile = grid.querySelector('[data-pipe="' + item.id + '"]');
					if (!tile) return;
					tile.classList.toggle('is-active', item.id === activeId);
					tile.setAttribute('aria-pressed', item.id === activeId ? 'true' : 'false');
				});
			}
			refreshAutoplay();

			const pipe = activePipe();
			const tpl = selectedTemplate();
			if (!renaming) {
				activeName.textContent = pipe ? pipe.name : 'Chain';
				activeName.setAttribute('aria-label', 'Rename chain');
			}
			refreshPreview(previewView());
			if (recOn() && !hasLiveCamera((previewView() && previewView().operators) || pipeline)) finishRec(false);
			else paintRecChrome();
			renameBtn.disabled = !pipe || galleryMode === 'templates';
			dupBtn.disabled = !pipe || galleryMode === 'templates';
			saveTplBtn.disabled = !pipe;
			addToSetBtn.disabled = !tpl;
			shareBtn.disabled = galleryMode === 'templates' ? !tpl : !pipe;
			deletePipeBtn.disabled = galleryMode === 'templates' ? !tpl : pipes.length <= 1;

			if (!viewingTemplate()) {
				const signature = pipelineSignature(pipeline) + ':' + String(s.activePipeId || '') + ':' + (
					root.SynthCamera && root.SynthCamera.deviceSignature ? root.SynthCamera.deviceSignature() : ''
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
					const soloed = !!(root.SynthPipeline.isSoloed && root.SynthPipeline.isSoloed(pipeline, op.id));
					card.classList.toggle('is-solo', soloed);
					const soloBtn = card.querySelector('.synth-op__solo');
					if (soloBtn) {
						soloBtn.classList.toggle('is-active', soloed);
						soloBtn.setAttribute('aria-pressed', soloed ? 'true' : 'false');
					}
					paintBypassIcon(card.querySelector('.synth-icon--bypass'), op.bypassed);

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

					const rampField = ramps[op.id];
					if (rampField && rampField.setParams) {
						rampField.setParams(op.parameters);
					}

					const presetField = presetFields[op.id];
					if (presetField && presetField.paint) {
						presetField.paint(op);
					}

					card.querySelectorAll('[data-enum-key]').forEach(function (btn) {
						const key = btn.dataset.enumKey;
						const def = root.SynthRegistry.get(op.type);
						const fallback = def && def.defaults ? def.defaults[key] : undefined;
						const current = op.parameters[key] != null ? op.parameters[key] : fallback;
						btn.classList.toggle(
							'is-active',
							String(current) === String(btn.dataset.enumValue)
						);
					});
					paintCamStatus(card, op);
					paintVisibleParams(card, op);
				});
			}
			}

			refreshOutput();

			if (root.SynthClock && !editingBpm) {
				bpmVal.textContent = String(Math.round(root.SynthClock.fromState(s).bpm));
			}
		}

		function tick() {
			try {
				tickLive();
			} catch (err) { /* keep the control rAF loop alive */ }
		}

		function tickLive() {
			const s = getState();
			const nowMs = Date.now();
			const clock = root.SynthClock ? root.SynthClock.fromState(s) : null;
			if (clock) {
				const beat = root.SynthClock.beatInBar(clock, nowMs);
				if (!editingBpm) bpmVal.textContent = String(Math.round(clock.bpm));
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
				if (slider && slider.updateLive) {
					try {
						slider.updateLive(ctx);
					} catch (err) { /* ignore a single slider */ }
				}
			});
			if (recOn() && recTime) recTime.textContent = formatRecTime(root.SynthRecorder.elapsed());
			paintAutoplayProgress();
		}

		function refreshStats(stats) {
			if (!stats) return;
			lastStats = lastStats ? Object.assign({}, lastStats, stats) : Object.assign({}, stats);
			const current = lastStats;
			if (current.fps != null && fpsVal) {
				fpsVal.textContent = Number(current.fps).toFixed(1);
				applyTone(fpsVal, fpsTone(current.fps));
			}
			if (Object.prototype.hasOwnProperty.call(stats, 'localFps') && phoneFpsVal) {
				if (!(stats.localFps >= 1)) {
					phoneFpsVal.textContent = '-';
					applyTone(phoneFpsVal, '');
				} else {
					phoneFpsVal.textContent = Number(stats.localFps).toFixed(1);
					applyTone(phoneFpsVal, fpsTone(stats.localFps));
				}
			}
			if (Object.prototype.hasOwnProperty.call(stats, 'tempC') && tempVal) {
				if (stats.tempC == null) {
					tempVal.textContent = '-';
					applyTone(tempVal, '');
				} else {
					tempVal.textContent = Number(stats.tempC).toFixed(1) + '\u00b0C';
					applyTone(tempVal, tempTone(stats.tempC));
				}
			}
			if (drawVal) {
				const ms = current.fps > 0 ? 1000 / Number(current.fps) : null;
				drawVal.textContent = formatMs(ms);
				if (current.fps != null) applyTone(drawVal, fpsTone(current.fps));
			}
			if (sizeVal && current.size) {
				sizeVal.textContent = formatSize(current.size);
			}
			if (current.fps != null) {
				loadLevel = nextLoadLevel(Number(current.fps), loadLevel);
			}
			if (sysSlot) {
				document.body.classList.toggle('is-sys-warn', loadLevel > 0);
				document.body.classList.toggle('is-sys-bad', loadLevel > 1);
			}
			if (sysWarn) {
				if (loadLevel <= 0) {
					sysWarn.hidden = true;
					sysWarn.textContent = '';
				} else {
					sysWarn.textContent = loadLevel > 1 ? 'Chain is too heavy' : 'Chain is getting heavy';
					sysWarn.hidden = false;
				}
			}
		}

		rootEl.addEventListener('pointerdown', function (event) {
			event.stopPropagation();
		});

		window.addEventListener('keydown', function (event) {
			if (event.key !== 'Escape') return;
			let closedForm = false;
			Object.keys(presetFields).forEach(function (id) {
				const field = presetFields[id];
				if (!field || !field.closeForm) return;
				field.closeForm();
				closedForm = true;
			});
			if (closedForm) {
				event.preventDefault();
				refresh();
				return;
			}
			if (sheet.hidden) return;
			closeSheet();
		});

		refresh();
		return {
			refresh: refresh,
			refreshStats: refreshStats,
			setPreviewFrame: setPreviewFrame,
			setLiveMode: setLiveMode,
			setLocalMode: function (on) {
				setLocalMode(on, false);
			},
			tick: tick,
			closeOverlays: function () {
				colorPicker.close();
				hideTip();
			}
		};
	}

	root.SynthUI = { mount: mount };
})(window);
