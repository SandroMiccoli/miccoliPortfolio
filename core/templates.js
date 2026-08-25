(function (root) {
	const STORAGE_KEY = 'visual-synth.pipe-templates.v1';
	const LIBRARY_INDEX = 'library/templates/index.json';
	const LIBRARY_DIR = 'library/templates/';

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

	function hydrateOperators(operators) {
		return clone(operators || []).map(function (op) {
			if (!op || !op.type) return null;
			const def = root.SynthRegistry ? root.SynthRegistry.get(op.type) : null;
			const parameters = Object.assign({}, (def && def.defaults) || {}, op.parameters || {});
			if (Object.prototype.hasOwnProperty.call(parameters, 'savedPalettes') && !Array.isArray(parameters.savedPalettes)) {
				parameters.savedPalettes = [];
			}
			return {
				id: op.id || ('op_' + Math.random().toString(36).slice(2, 10)),
				type: String(op.type),
				name: op.name || (def && def.name) || op.type,
				bypassed: !!op.bypassed,
				parameters: parameters,
				modulations: op.modulations && typeof op.modulations === 'object' ? clone(op.modulations) : {}
			};
		}).filter(Boolean);
	}

	function originOf(raw) {
		if (!raw) return 'disk';
		if (raw.origin === 'library' || raw.builtin) return 'library';
		if (raw.origin === 'session' || raw.persisted === false) return 'session';
		return 'disk';
	}

	function normalize(raw) {
		if (!raw || typeof raw !== 'object') return null;
		const name = String(raw.name || '').trim();
		if (!name || !Array.isArray(raw.operators)) return null;
		const origin = originOf(raw);
		return {
			id: String(raw.id || uid()),
			name: name.slice(0, 32),
			thumbnail: typeof raw.thumbnail === 'string' ? raw.thumbnail : '',
			operators: hydrateOperators(raw.operators),
			persisted: origin !== 'session',
			origin: origin
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

	function userOnly(templates) {
		return list(templates).filter(function (item) {
			return item.origin !== 'library';
		});
	}

	function merge(library, user) {
		const byId = {};
		list(library).forEach(function (item) {
			const next = clone(item);
			next.origin = 'library';
			next.persisted = true;
			byId[item.id] = next;
		});
		list(user).forEach(function (item) {
			if (item.origin === 'library') return;
			byId[item.id] = item;
		});
		const libIds = {};
		list(library).forEach(function (item) {
			libIds[item.id] = true;
		});
		const out = [];
		list(library).forEach(function (item) {
			out.push(byId[item.id]);
		});
		list(user).forEach(function (item) {
			if (libIds[item.id] || item.origin === 'library') return;
			out.push(item);
		});
		return out;
	}

	function upsert(templates, template) {
		const next = list(templates);
		const item = normalize(template);
		if (!item) return next;
		if (item.origin === 'library') item.origin = 'disk';
		item.persisted = item.origin !== 'session';
		let found = false;
		const out = next.map(function (entry) {
			if (entry.id !== item.id) return entry;
			found = true;
			if (entry.origin === 'library') item.origin = 'disk';
			item.thumbnail = item.thumbnail || entry.thumbnail;
			return item;
		});
		if (!found) out.push(item);
		const lib = out.filter(function (entry) {
			return entry.origin === 'library';
		});
		const rest = out.filter(function (entry) {
			return entry.origin !== 'library';
		}).slice(-48);
		return lib.concat(rest);
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
			operators: hydrateOperators(src.operators || []),
			persisted: true,
			origin: 'disk'
		};
	}

	function fromShare(payload, templates) {
		return {
			id: uid(),
			name: uniqueName((payload && payload.name) || 'TEMPLATE', templates),
			thumbnail: '',
			operators: hydrateOperators((payload && payload.operators) || []),
			persisted: true,
			origin: 'disk'
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
			persisted: true,
			origin: 'disk'
		};
	}

	function instantiate(template, pipes) {
		const src = normalize(template);
		if (!src) return null;
		const operators = hydrateOperators(src.operators).map(function (op) {
			op.id = 'op_' + Math.random().toString(36).slice(2, 10);
			return op;
		});
		const pipe = root.SynthPipes
			? root.SynthPipes.create(operators, uniqueName(src.name, pipes))
			: {
				id: 'pipe_' + Math.random().toString(36).slice(2, 10),
				name: uniqueName(src.name, pipes),
				thumbnail: '',
				operators: operators
			};
		pipe.thumbnail = src.thumbnail || '';
		return pipe;
	}

	function toDocument(template) {
		if (root.SynthShare && root.SynthShare.toDocument) {
			return root.SynthShare.toDocument(template);
		}
		const src = normalize(template);
		if (!src) return null;
		return {
			id: src.id,
			name: src.name,
			operators: src.operators.map(function (op) {
				const item = { type: op.type, parameters: clone(op.parameters || {}) };
				if (op.bypassed) item.bypassed = true;
				if (op.modulations && Object.keys(op.modulations).length) {
					item.modulations = clone(op.modulations);
				}
				if (item.parameters.savedPalettes) delete item.parameters.savedPalettes;
				return item;
			})
		};
	}

	let cachedLibrary = [];

	function loadLocal() {
		try {
			const raw = window.localStorage.getItem(STORAGE_KEY);
			if (raw == null) return [];
			const parsed = JSON.parse(raw);
			return userOnly(Array.isArray(parsed) ? parsed : parsed && parsed.items);
		} catch (err) {
			return [];
		}
	}

	function saveLocal(templates) {
		try {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(userOnly(templates)));
		} catch (err) { /* private mode / quota */ }
	}

	function syncDisk(templates) {
		if (root.SynthSync && root.SynthSync.connected()) return;
		saveLocal(templates);
	}

	function fetchJson(url) {
		return fetch(url, { cache: 'no-store' }).then(function (res) {
			if (!res.ok) throw new Error(String(res.status));
			return res.json();
		});
	}

	function loadLibrary() {
		return fetchJson(LIBRARY_INDEX).then(function (index) {
			const files = Array.isArray(index) ? index : [];
			return Promise.all(files.map(function (name) {
				return fetchJson(LIBRARY_DIR + name).then(function (raw) {
					const item = normalize(Object.assign({}, raw, { origin: 'library' }));
					return item;
				}).catch(function () {
					return null;
				});
			}));
		}).then(function (items) {
			cachedLibrary = items.filter(Boolean);
			return cachedLibrary;
		}).catch(function () {
			return cachedLibrary;
		});
	}

	function factory() {
		return list(cachedLibrary);
	}

	function initial() {
		return merge(cachedLibrary, loadLocal());
	}

	root.SynthTemplates = {
		uid: uid,
		factory: factory,
		list: list,
		find: find,
		normalize: normalize,
		hydrateOperators: hydrateOperators,
		userOnly: userOnly,
		merge: merge,
		upsert: upsert,
		remove: remove,
		uniqueName: uniqueName,
		fromPipe: fromPipe,
		fromShare: fromShare,
		duplicate: duplicate,
		instantiate: instantiate,
		toDocument: toDocument,
		loadLibrary: loadLibrary,
		loadLocal: loadLocal,
		saveLocal: saveLocal,
		syncDisk: syncDisk,
		initial: initial
	};
})(window);
