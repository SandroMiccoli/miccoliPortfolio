(function (root) {
	const STORAGE_KEY = 'visual-synth.pipe-templates.v1';

	function clone(value) {
		return JSON.parse(JSON.stringify(value));
	}

	function uid() {
		return 'tpl_' + Math.random().toString(36).slice(2, 10);
	}

	function pad(n) {
		return n < 10 ? '0' + n : String(n);
	}

	function usedNames(list) {
		const used = {};
		(list || []).forEach(function (item) {
			if (item && item.name) used[String(item.name).toLowerCase()] = true;
		});
		return used;
	}

	function uniqueName(name, list) {
		const used = usedNames(list);
		const base = String(name || 'TEMPLATE').trim().slice(0, 32) || 'TEMPLATE';
		if (!used[base.toLowerCase()]) return base;
		let n = 2;
		let next = (base.slice(0, 28) + ' ' + pad(n)).slice(0, 32);
		while (used[next.toLowerCase()]) {
			n += 1;
			next = (base.slice(0, 28) + ' ' + pad(n)).slice(0, 32);
		}
		return next;
	}

	function makeOp(pipeId, type, overrides) {
		const def = root.SynthRegistry ? root.SynthRegistry.get(type) : null;
		const parameters = Object.assign({}, (def && def.defaults) || {}, overrides || {});
		return {
			id: 'op_' + pipeId + '_' + type,
			type: type,
			name: (def && def.name) || type,
			bypassed: false,
			parameters: parameters,
			modulations: {}
		};
	}

	function makeTemplate(id, name, operators) {
		return {
			id: id,
			name: name,
			thumbnail: '',
			operators: operators,
			persisted: true
		};
	}

	function factory() {
		const stripe = makeTemplate('tpl_stripe', 'STRIPE', [
			makeOp('stripe', 'lines', { fuzzyness: 0.12, amount: 22, width: 0.16, rotation: 8 }),
			makeOp('stripe', 'warp', { amount: 0.12, frequency: 2.2, speed: 0.15, detail: 0.3 }),
			makeOp('stripe', 'lookup', {
				paletteId: 'fire',
				colors: ['#5C0812', '#D62408', '#FF9412', '#FFECC6'],
				bg: '#080206'
			}),
			makeOp('stripe', 'bloom', { threshold: 0.4, intensity: 1.1, radius: 0.6 }),
			makeOp('stripe', 'screen', { gain: 1 })
		]);

		const prism = makeTemplate('tpl_prism', 'PRISM', [
			makeOp('prism', 'noise', { scale: 12, speedX: 0.22, octaves: 5, contrast: 1.1 }),
			makeOp('prism', 'kaleidoscope', { segments: 14, angle: 18, zoom: 1.6 }),
			makeOp('prism', 'warp', { amount: 0.45, frequency: 1.8, speed: 0.8, detail: 0.4 }),
			makeOp('prism', 'lookup', {
				paletteId: 'ice',
				colors: ['#082A6E', '#14A8C4', '#A0E6FF', '#F0FAFF'],
				bg: '#02040E',
				hue: -12,
				saturation: 0.9
			}),
			makeOp('prism', 'bloom', { threshold: 0.32, intensity: 0.9, radius: 1.35 }),
			makeOp('prism', 'screen', { gain: 1 })
		]);

		const ink = makeTemplate('tpl_ink', 'INK', [
			makeOp('ink', 'lines', {
				fuzzyness: 0.35,
				amount: 10,
				width: 0.28,
				rotation: 45,
				blendMode: 'difference'
			}),
			makeOp('ink', 'edge', { threshold: 0.08, intensity: 2.8, radius: 0.8, mix: 1, invert: 1 }),
			makeOp('ink', 'contrast', { contrast: 2.2, brightness: -0.04, pivot: 0.42 }),
			makeOp('ink', 'lookup', {
				paletteId: 'mono',
				colors: ['#2A2A2A', '#6E6E6E', '#B4B4B4', '#F5F5F5'],
				bg: '#000000',
				saturation: 0.4,
				exposure: 0.85
			}),
			makeOp('ink', 'screen', { gain: 1 })
		]);

		const tunnel = makeTemplate('tpl_tunnel', 'TUNNEL', [
			makeOp('tunnel', 'noise', { scale: 1.8, speedX: 0.08, octaves: 3, contrast: 0.85 }),
			makeOp('tunnel', 'kaleidoscope', { segments: 6, zoom: 1 }),
			makeOp('tunnel', 'feedback', { amount: 0.72, decay: 0.92, scale: 0.97, rotate: 0 }),
			makeOp('tunnel', 'ramp', {
				stops: [
					{ id: 'n0', pos: 0, color: '#080000' },
					{ id: 'n1', pos: 0.22, color: '#C41414' },
					{ id: 'n2', pos: 0.55, color: '#FF7A00' },
					{ id: 'n3', pos: 0.82, color: '#FFE14A' },
					{ id: 'n4', pos: 1, color: '#FFF6C8' }
				],
				phase: 0,
				period: 1,
				interpolate: 'linear'
			}),
			makeOp('tunnel', 'bloom', { threshold: 0.18, intensity: 1.8, radius: 2.2 }),
			makeOp('tunnel', 'screen', { gain: 1 })
		]);

		const melt = makeTemplate('tpl_melt', 'MELT', [
			makeOp('melt', 'gradient', {
				kind: 'sweep',
				angle: 0,
				position: 0.5,
				spread: 1,
				colorA: '#1A0A00',
				colorB: '#FFE6B8'
			}),
			makeOp('melt', 'displace', { amount: 0.32, angle: 90, center: 0.42, mode: 'luma', tile: 'hold' }),
			makeOp('melt', 'warp', { amount: 0.85, frequency: 6.5, speed: 0.55, detail: 0.85 }),
			makeOp('melt', 'hsv', { hue: 18, saturation: 1.25, value: 1.05 }),
			makeOp('melt', 'bloom', { threshold: 0.32, intensity: 0.9, radius: 1.35 }),
			makeOp('melt', 'screen', { gain: 1.05 })
		]);

		const tape = makeTemplate('tpl_tape', 'VHS TAPE', [
			makeOp('tape', 'tape', { speed: 2, lines: 240, threshold: 0.7, grain: 1, amount: 1 }),
			makeOp('tape', 'lookup', {
				paletteId: 'mono',
				colors: ['#0A0808', '#3A2A22', '#C8B8A0', '#F2EDE4'],
				bg: '#050404',
				saturation: 0.55,
				exposure: 1.05
			}),
			makeOp('tape', 'bloom', { threshold: 0.38, intensity: 0.7, radius: 0.85 }),
			makeOp('tape', 'screen', { gain: 1 })
		]);

		return [stripe, prism, ink, tunnel, melt, tape];
	}

	function reIdOperators(operators) {
		return clone(operators || []).map(function (op) {
			op.id = 'op_' + Math.random().toString(36).slice(2, 10);
			return op;
		});
	}

	function normalize(raw) {
		if (!raw || typeof raw !== 'object') return null;
		const name = String(raw.name || '').trim();
		if (!name || !Array.isArray(raw.operators)) return null;
		return {
			id: String(raw.id || uid()),
			name: name.slice(0, 32),
			thumbnail: typeof raw.thumbnail === 'string' ? raw.thumbnail : '',
			operators: clone(raw.operators),
			persisted: raw.persisted !== false
		};
	}

	function list(templates) {
		return (templates || []).map(normalize).filter(Boolean);
	}

	function find(templates, id) {
		const items = list(templates);
		for (let i = 0; i < items.length; i += 1) {
			if (items[i].id === id) return items[i];
		}
		return null;
	}

	function upsert(templates, template) {
		const next = list(templates);
		const item = normalize(template);
		if (!item) return next;
		let found = false;
		const out = next.map(function (entry) {
			if (entry.id !== item.id) return entry;
			found = true;
			return item;
		});
		if (!found) out.push(item);
		return out.slice(-48);
	}

	function remove(templates, id) {
		return list(templates).filter(function (item) {
			return item.id !== id;
		});
	}

	function fromPipe(pipe, templates) {
		const src = pipe || {};
		return {
			id: uid(),
			name: uniqueName(src.name || 'TEMPLATE', templates),
			thumbnail: src.thumbnail || '',
			operators: clone(src.operators || []),
			persisted: true
		};
	}

	function duplicate(template, templates) {
		const src = normalize(template);
		if (!src) return null;
		return {
			id: uid(),
			name: uniqueName(src.name, templates),
			thumbnail: src.thumbnail || '',
			operators: clone(src.operators),
			persisted: true
		};
	}

	function instantiate(template, pipes) {
		const src = normalize(template);
		if (!src) return null;
		const pipe = root.SynthPipes
			? root.SynthPipes.create(reIdOperators(src.operators), uniqueName(src.name, pipes))
			: {
				id: 'pipe_' + Math.random().toString(36).slice(2, 10),
				name: uniqueName(src.name, pipes),
				thumbnail: '',
				operators: reIdOperators(src.operators)
			};
		pipe.thumbnail = src.thumbnail || '';
		return pipe;
	}

	function loadLocal() {
		try {
			const raw = window.localStorage.getItem(STORAGE_KEY);
			if (raw == null) return null;
			const parsed = JSON.parse(raw);
			return list(Array.isArray(parsed) ? parsed : parsed && parsed.items);
		} catch (err) {
			return null;
		}
	}

	function saveLocal(templates) {
		try {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list(templates)));
		} catch (err) { /* private mode / quota */ }
	}

	function syncDisk(templates) {
		if (root.SynthSync && root.SynthSync.connected()) return;
		saveLocal(templates);
	}

	function initial() {
		const local = loadLocal();
		if (local) return local;
		return factory();
	}

	root.SynthTemplates = {
		uid: uid,
		factory: factory,
		list: list,
		find: find,
		normalize: normalize,
		upsert: upsert,
		remove: remove,
		uniqueName: uniqueName,
		fromPipe: fromPipe,
		duplicate: duplicate,
		instantiate: instantiate,
		loadLocal: loadLocal,
		saveLocal: saveLocal,
		syncDisk: syncDisk,
		initial: initial
	};
})(window);
