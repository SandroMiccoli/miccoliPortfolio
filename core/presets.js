(function (root) {
	const STORAGE_KEY = 'visual-synth.operator-presets.v1';
	const SKIP = {
		savedPalettes: true,
		deviceId: true,
		dirty: true
	};

	function clone(value) {
		return JSON.parse(JSON.stringify(value));
	}

	function uid() {
		return 'usr_' + Math.random().toString(36).slice(2, 10);
	}

	function sameValue(a, b) {
		if (a === b) return true;
		if (Array.isArray(a) && Array.isArray(b)) {
			if (a.length !== b.length) return false;
			for (let i = 0; i < a.length; i += 1) {
				if (!sameValue(a[i], b[i])) return false;
			}
			return true;
		}
		if (typeof a === 'number' && typeof b === 'number') {
			return Math.abs(a - b) < 1e-4;
		}
		if (typeof a === 'string' && typeof b === 'string') {
			const left = a[0] === '#' ? a.toUpperCase() : a;
			const right = b[0] === '#' ? b.toUpperCase() : b;
			return left === right;
		}
		return false;
	}

	function paramKeys(type) {
		const def = root.SynthRegistry ? root.SynthRegistry.get(type) : null;
		const keys = [];
		((def && def.params) || []).forEach(function (spec) {
			if (!spec || !spec.key || spec.kind === 'palette') return;
			if (SKIP[spec.key]) return;
			if (spec.kind === 'xyz' && root.SynthParams) {
				root.SynthParams.expand(spec).forEach(function (axis) {
					keys.push(axis.key);
				});
				return;
			}
			keys.push(spec.key);
		});
		if (type === 'lookup') {
			['paletteId', 'colors', 'bg'].forEach(function (key) {
				if (keys.indexOf(key) < 0) keys.push(key);
			});
		}
		return keys;
	}

	function snapshot(type, parameters) {
		const src = parameters || {};
		const out = {};
		paramKeys(type).forEach(function (key) {
			if (!Object.prototype.hasOwnProperty.call(src, key)) return;
			if (SKIP[key]) return;
			out[key] = clone(src[key]);
		});
		return out;
	}

	function factory(type) {
		const def = root.SynthRegistry ? root.SynthRegistry.get(type) : null;
		return ((def && def.presets) || []).map(function (item) {
			const id = item.id || String(item.name || 'preset').toLowerCase().replace(/\s+/g, '-');
			return {
				id: 'factory:' + type + ':' + id,
				type: type,
				name: item.name || id,
				parameters: snapshot(type, item.parameters || def.defaults || {}),
				builtin: true,
				persisted: true
			};
		});
	}

	function normalize(raw) {
		if (!raw || typeof raw !== 'object' || raw.builtin) return null;
		const type = String(raw.type || '');
		const name = String(raw.name || '').trim();
		if (!type || !name || !raw.parameters) return null;
		return {
			id: String(raw.id || uid()),
			type: type,
			name: name.slice(0, 32),
			parameters: snapshot(type, raw.parameters),
			builtin: false,
			persisted: !!raw.persisted
		};
	}

	function listUser(userPresets, type) {
		return (userPresets || []).map(normalize).filter(function (item) {
			return item && (!type || item.type === type);
		});
	}

	function catalog(type, userPresets) {
		return factory(type).concat(listUser(userPresets, type));
	}

	function sameSnapshot(a, b) {
		const keys = {};
		Object.keys(a || {}).forEach(function (key) {
			keys[key] = true;
		});
		Object.keys(b || {}).forEach(function (key) {
			keys[key] = true;
		});
		const list = Object.keys(keys);
		if (!list.length) return false;
		for (let i = 0; i < list.length; i += 1) {
			const key = list[i];
			if (!sameValue((a || {})[key], (b || {})[key])) return false;
		}
		return true;
	}

	function match(op, preset) {
		if (!op || !preset || op.type !== preset.type) return false;
		return sameSnapshot(snapshot(op.type, op.parameters), preset.parameters);
	}

	function findActive(op, userPresets) {
		const items = catalog(op && op.type, userPresets);
		if (op && op.presetId) {
			for (let i = 0; i < items.length; i += 1) {
				if (items[i].id === op.presetId) return items[i];
			}
		}
		for (let i = items.length - 1; i >= 0; i -= 1) {
			if (match(op, items[i])) return items[i];
		}
		return null;
	}

	function applyTo(op, preset) {
		const next = clone(op.parameters || {});
		Object.keys(preset.parameters || {}).forEach(function (key) {
			if (SKIP[key]) return;
			next[key] = clone(preset.parameters[key]);
		});
		return next;
	}

	function nextName(type, userPresets) {
		const def = root.SynthRegistry ? root.SynthRegistry.get(type) : null;
		const base = (def && def.name) || type || 'Preset';
		const used = {};
		catalog(type, userPresets).forEach(function (item) {
			used[String(item.name).toLowerCase()] = true;
		});
		let n = 1;
		let name = base + ' ' + String(n).padStart(2, '0');
		while (used[name.toLowerCase()]) {
			n += 1;
			name = base + ' ' + String(n).padStart(2, '0');
		}
		return name;
	}

	function create(type, name, parameters, persisted) {
		const clean = String(name || '').trim() || nextName(type, []);
		return {
			id: uid(),
			type: type,
			name: clean.slice(0, 32),
			parameters: snapshot(type, parameters),
			builtin: false,
			persisted: !!persisted
		};
	}

	function upsert(userPresets, preset) {
		const next = listUser(userPresets);
		const item = normalize(preset);
		if (!item) return next;
		let found = false;
		const out = next.map(function (entry) {
			if (entry.id !== item.id) return entry;
			found = true;
			return item;
		});
		if (!found) out.push(item);
		return out.slice(-64);
	}

	function remove(userPresets, id) {
		return listUser(userPresets).filter(function (item) {
			return item.id !== id;
		});
	}

	function persist(userPresets, id) {
		return listUser(userPresets).map(function (item) {
			if (item.id !== id) return item;
			const next = clone(item);
			next.persisted = true;
			return next;
		});
	}

	function persistedOnly(userPresets) {
		return listUser(userPresets).filter(function (item) {
			return item.persisted;
		}).map(function (item) {
			return {
				id: item.id,
				type: item.type,
				name: item.name,
				parameters: item.parameters,
				persisted: true
			};
		});
	}

	function loadLocal() {
		try {
			const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
			return persistedOnly(Array.isArray(raw) ? raw : raw && raw.presets);
		} catch (err) {
			return [];
		}
	}

	function saveLocal(userPresets) {
		try {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedOnly(userPresets)));
		} catch (err) { /* private mode / quota */ }
	}

	function syncDisk(userPresets) {
		if (root.SynthSync && root.SynthSync.connected()) return;
		saveLocal(userPresets);
	}

	root.SynthPresets = {
		snapshot: snapshot,
		factory: factory,
		catalog: catalog,
		listUser: listUser,
		normalize: normalize,
		match: match,
		findActive: findActive,
		applyTo: applyTo,
		nextName: nextName,
		create: create,
		upsert: upsert,
		remove: remove,
		persist: persist,
		persistedOnly: persistedOnly,
		loadLocal: loadLocal,
		saveLocal: saveLocal,
		syncDisk: syncDisk,
		initial: loadLocal
	};
})(window);
