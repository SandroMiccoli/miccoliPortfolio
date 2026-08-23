(function (root) {
	const NS = 'http://www.w3.org/2000/svg';
	const CORNERS = ['tl', 'tr', 'br', 'bl'];

	function el(tag, className) {
		const node = document.createElement(tag);
		if (className) node.className = className;
		return node;
	}

	function svgEl(name, attrs) {
		const node = document.createElementNS(NS, name);
		Object.keys(attrs || {}).forEach(function (key) {
			node.setAttribute(key, attrs[key]);
		});
		return node;
	}

	function clamp(value, min, max) {
		return Math.min(max, Math.max(min, value));
	}

	function destFromEvent(event, host) {
		const rect = host.getBoundingClientRect();
		const w = rect.width || 1;
		const h = rect.height || 1;
		return {
			x: clamp((event.clientX - rect.left) / w, -0.15, 1.15),
			y: clamp((event.clientY - rect.top) / h, -0.15, 1.15)
		};
	}

	function pct(value) {
		return (value * 100).toFixed(3) + '%';
	}

	function circlePoints(item, n) {
		const pts = [];
		const count = n || 48;
		const w = window.innerWidth || 1;
		const h = window.innerHeight || 1;
		const m = Math.min(w, h);
		const rx = item.r * m / w;
		const ry = item.r * m / h;
		for (let i = 0; i < count; i += 1) {
			const a = (i / count) * Math.PI * 2;
			pts.push({
				x: item.x + Math.cos(a) * rx,
				y: item.y + Math.sin(a) * ry
			});
		}
		return pts;
	}

	function rectPoints(item) {
		const hx = item.w * 0.5;
		const hy = item.h * 0.5;
		return [
			{ x: item.x - hx, y: item.y - hy },
			{ x: item.x + hx, y: item.y - hy },
			{ x: item.x + hx, y: item.y + hy },
			{ x: item.x - hx, y: item.y + hy }
		];
	}

	function mount(options) {
		const getState = options.getState;
		const patch = options.patch;
		const host = options.host || document.body;
		if (!document.body.classList.contains('synth-display')) return null;

		const layer = el('div', 'synth-map-overlay');
		layer.hidden = true;
		layer.setAttribute('aria-hidden', 'true');

		const svg = svgEl('svg', {
			class: 'synth-map-overlay__svg',
			viewBox: '0 0 1 1',
			preserveAspectRatio: 'none'
		});
		const quad = svgEl('polygon', { class: 'synth-map-overlay__quad' });
		const masksG = svgEl('g', { class: 'synth-map-overlay__masks' });
		svg.appendChild(quad);
		svg.appendChild(masksG);
		layer.appendChild(svg);

		const handles = {};
		CORNERS.forEach(function (key) {
			const btn = el('button', 'synth-map-handle');
			btn.type = 'button';
			btn.dataset.corner = key;
			btn.setAttribute('aria-label', 'Move ' + key.toUpperCase() + ' corner');
			handles[key] = btn;
			layer.appendChild(btn);
		});

		host.appendChild(layer);

		let drag = null;
		let selectedId = null;

		function output() {
			return root.SynthOutput
				? root.SynthOutput.fromState(getState())
				: { mapping: { enabled: true, edit: false, corners: root.SynthOutput.IDENTITY }, masks: { items: [] } };
		}

		function cornersOf() {
			const mapping = output().mapping;
			if (mapping.enabled === false) {
				return root.SynthOutput.IDENTITY;
			}
			return mapping.corners;
		}

		function sourceFromDest(dest) {
			if (!root.SynthOutput) return dest;
			if (root.SynthOutput.destToSource) {
				return root.SynthOutput.destToSource(dest, cornersOf());
			}
			return root.SynthOutput.invBilinear(dest, cornersOf());
		}

		function placeHandle(btn, pt) {
			btn.style.left = pct(pt.x);
			btn.style.top = pct(pt.y);
		}

		function paint() {
			const out = output();
			const mapping = out.mapping;
			const editing = !!mapping.edit;
			document.body.classList.toggle('is-map-edit', editing);
			layer.hidden = !editing;
			layer.setAttribute('aria-hidden', editing ? 'false' : 'true');
			if (!editing) return;

			const corners = cornersOf();
			const pts = CORNERS.map(function (key) {
				placeHandle(handles[key], corners[key]);
				return corners[key].x + ',' + corners[key].y;
			});
			quad.setAttribute('points', pts.join(' '));

			masksG.innerHTML = '';
			if (out.masks.enabled === false) return;
			(out.masks.items || []).forEach(function (item) {
				if (item.enabled === false) return;
				const srcPts = item.type === 'circle' ? circlePoints(item) : rectPoints(item);
				const destPts = srcPts.map(function (pt) {
					return root.SynthOutput.mapPoint(pt, corners);
				});
				const node = svgEl('polygon', {
					class: 'synth-map-overlay__mask' + (item.id === selectedId ? ' is-active' : ''),
					points: destPts.map(function (pt) {
						return pt.x + ',' + pt.y;
					}).join(' '),
					'data-mask': item.id
				});
				masksG.appendChild(node);
			});
		}

		function setSelected(id) {
			selectedId = id || null;
			paint();
		}

		function patchMapping(next) {
			patch({ output: { mapping: next } });
		}

		function patchMasks(next) {
			patch({ output: { masks: next } });
		}

		function applyPointer(event) {
			if (!drag || event.pointerId !== drag.pointerId) return;
			const dest = destFromEvent(event, layer);
			if (drag.kind === 'corner') {
				const mapping = root.SynthOutput.setCorner(output().mapping, drag.key, dest.x, dest.y);
				mapping.edit = true;
				patchMapping(mapping);
				return;
			}
			const src = sourceFromDest(dest);
			if (!src) return;
			patchMasks(root.SynthOutput.updateMask(output().masks, drag.id, {
				x: clamp(src.x + drag.dx, 0, 1),
				y: clamp(src.y + drag.dy, 0, 1)
			}));
		}

		function endDrag(event) {
			if (!drag || event.pointerId !== drag.pointerId) return;
			const handle = handles[drag.key];
			if (handle) handle.classList.remove('is-drag');
			drag = null;
		}

		layer.addEventListener('pointerdown', function (event) {
			if (!output().mapping.edit) return;
			if (event.button !== 0 && event.pointerType === 'mouse') return;
			const handle = event.target.closest && event.target.closest('.synth-map-handle');
			const dest = destFromEvent(event, layer);
			if (handle) {
				drag = { kind: 'corner', key: handle.dataset.corner, pointerId: event.pointerId };
				handle.classList.add('is-drag');
				try {
					handle.setPointerCapture(event.pointerId);
				} catch (err) { /* ignore */ }
				event.preventDefault();
				applyPointer(event);
				return;
			}
			const maskNode = event.target.closest && event.target.closest('[data-mask]');
			if (maskNode && root.SynthOutput) {
				const id = maskNode.getAttribute('data-mask');
				const src = sourceFromDest(dest);
				if (!src) return;
				const masks = output().masks;
				const item = (masks.items || []).filter(function (entry) {
					return entry.id === id;
				})[0];
				if (!item) return;
				selectedId = id;
				drag = {
					kind: 'mask',
					id: id,
					pointerId: event.pointerId,
					dx: item.x - src.x,
					dy: item.y - src.y
				};
				event.preventDefault();
			}
		});

		layer.addEventListener('pointermove', applyPointer);
		layer.addEventListener('pointerup', endDrag);
		layer.addEventListener('pointercancel', endDrag);
		Object.keys(handles).forEach(function (key) {
			handles[key].addEventListener('pointermove', applyPointer);
			handles[key].addEventListener('pointerup', endDrag);
			handles[key].addEventListener('pointercancel', endDrag);
		});

		window.addEventListener('keydown', function (event) {
			if (event.key !== 'Escape') return;
			const mapping = output().mapping;
			if (!mapping.edit) return;
			const tag = event.target && event.target.tagName;
			if (tag === 'INPUT' || tag === 'TEXTAREA') return;
			patchMapping(Object.assign({}, mapping, { edit: false }));
		});

		if (root.SynthState && root.SynthState.subscribe) {
			root.SynthState.subscribe(paint);
		}
		window.addEventListener('resize', paint);
		paint();

		return {
			refresh: paint,
			setSelected: setSelected
		};
	}

	root.SynthOutputOverlay = { mount: mount };
})(window);
