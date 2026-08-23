(function (root) {
	function clone(value) {
		return JSON.parse(JSON.stringify(value));
	}

	function uid(prefix) {
		return (prefix || 'mask') + '_' + Math.random().toString(36).slice(2, 10);
	}

	function clamp(value, min, max) {
		if (typeof value !== 'number' || !isFinite(value)) return min;
		return Math.min(max, Math.max(min, value));
	}

	function point(raw, fallback) {
		const src = raw && typeof raw === 'object' ? raw : {};
		return {
			x: clamp(src.x != null ? src.x : fallback.x, -0.15, 1.15),
			y: clamp(src.y != null ? src.y : fallback.y, -0.15, 1.15)
		};
	}

	const IDENTITY = {
		tl: { x: 0, y: 0 },
		tr: { x: 1, y: 0 },
		br: { x: 1, y: 1 },
		bl: { x: 0, y: 1 }
	};

	function defaultMapping() {
		return {
			enabled: true,
			mode: 'cornerPin',
			edit: false,
			template: false,
			corners: clone(IDENTITY)
		};
	}

	function defaultMasks() {
		return {
			enabled: true,
			invert: false,
			items: []
		};
	}

	function defaults() {
		return {
			mapping: defaultMapping(),
			masks: defaultMasks()
		};
	}

	function normalizeCorners(raw) {
		const src = raw && typeof raw === 'object' ? raw : {};
		return {
			tl: point(src.tl, IDENTITY.tl),
			tr: point(src.tr, IDENTITY.tr),
			br: point(src.br, IDENTITY.br),
			bl: point(src.bl, IDENTITY.bl)
		};
	}

	function normalizeMapping(raw) {
		const src = raw && typeof raw === 'object' ? raw : {};
		return {
			enabled: src.enabled !== false,
			mode: src.mode === 'perspective' || src.mode === 'bezier' ? src.mode : 'cornerPin',
			edit: !!src.edit,
			template: !!src.template,
			corners: normalizeCorners(src.corners)
		};
	}

	function snap(value, min, max, step) {
		const stepped = Math.round((value - min) / step) * step + min;
		return clamp(stepped, min, max);
	}

	function rand(min, max, step) {
		return snap(min + Math.random() * (max - min), min, max, step);
	}

	function defaultMask(type) {
		const kind = type === 'circle' ? 'circle' : 'rect';
		const item = {
			id: uid('mask'),
			type: kind,
			name: kind === 'circle' ? 'Circle' : 'Rect',
			enabled: true,
			invert: false,
			feather: rand(0, 0.08, 0.01),
			x: rand(0.28, 0.72, 0.01),
			y: rand(0.28, 0.72, 0.01)
		};
		if (kind === 'circle') {
			item.r = rand(0.18, 0.42, 0.01);
		} else {
			item.w = rand(0.28, 0.7, 0.01);
			item.h = rand(0.28, 0.7, 0.01);
		}
		return item;
	}

	function normalizeMask(raw, index) {
		const src = raw && typeof raw === 'object' ? raw : {};
		const type = src.type === 'circle' ? 'circle' : 'rect';
		const item = {
			id: typeof src.id === 'string' && src.id ? src.id : uid('mask'),
			type: type,
			name: typeof src.name === 'string' && src.name
				? src.name
				: (type === 'circle' ? 'Circle' : 'Rect') + ' ' + String((index || 0) + 1),
			enabled: src.enabled !== false,
			invert: !!src.invert,
			feather: clamp(src.feather != null ? src.feather : 0.02, 0, 0.4),
			x: clamp(src.x != null ? src.x : 0.5, 0, 1),
			y: clamp(src.y != null ? src.y : 0.5, 0, 1)
		};
		if (type === 'circle') {
			item.r = clamp(src.r != null ? src.r : 0.38, 0.02, 0.8);
		} else {
			item.w = clamp(src.w != null ? src.w : 0.72, 0.04, 1);
			item.h = clamp(src.h != null ? src.h : 0.72, 0.04, 1);
		}
		return item;
	}

	function normalizeMasks(raw) {
		const src = raw && typeof raw === 'object' ? raw : {};
		const items = Array.isArray(src.items) ? src.items : [];
		return {
			enabled: src.enabled !== false,
			invert: !!src.invert,
			items: items.map(normalizeMask)
		};
	}

	function normalize(raw) {
		const src = raw && typeof raw === 'object' ? raw : {};
		return {
			mapping: normalizeMapping(src.mapping),
			masks: normalizeMasks(src.masks)
		};
	}

	function fromState(state) {
		return normalize(state && state.output);
	}

	function nameMask(items, type) {
		const kind = type === 'circle' ? 'Circle' : 'Rect';
		let n = 1;
		const used = {};
		(items || []).forEach(function (item) {
			used[item.name] = true;
		});
		let name = kind + ' ' + n;
		while (used[name]) {
			n += 1;
			name = kind + ' ' + n;
		}
		return name;
	}

	function addMask(masks, type) {
		const next = normalizeMasks(masks);
		const item = defaultMask(type);
		item.name = nameMask(next.items, item.type);
		next.items.push(item);
		return { masks: next, added: item };
	}

	function removeMask(masks, id) {
		const next = normalizeMasks(masks);
		next.items = next.items.filter(function (item) {
			return item.id !== id;
		});
		return next;
	}

	function updateMask(masks, id, patch) {
		const next = normalizeMasks(masks);
		next.items = next.items.map(function (item) {
			if (item.id !== id) return item;
			return normalizeMask(Object.assign({}, item, patch), 0);
		});
		return next;
	}

	function setMaskEnabled(masks, id, enabled) {
		return updateMask(masks, id, { enabled: !!enabled });
	}

	function identityCorners() {
		return clone(IDENTITY);
	}

	function isIdentity(corners) {
		const c = normalizeCorners(corners);
		return ['tl', 'tr', 'br', 'bl'].every(function (key) {
			return Math.abs(c[key].x - IDENTITY[key].x) < 1e-4 &&
				Math.abs(c[key].y - IDENTITY[key].y) < 1e-4;
		});
	}

	function mappingActive(mapping) {
		return !!(mapping && mapping.enabled && !isIdentity(mapping.corners));
	}

	function liveMasks(masks) {
		if (!masks || masks.enabled === false) return [];
		return (masks.items || []).filter(function (item) {
			return item && item.enabled !== false;
		});
	}

	function masksActive(masks) {
		return liveMasks(masks).length > 0;
	}

	function setCorner(mapping, key, x, y) {
		const next = normalizeMapping(mapping);
		if (!IDENTITY[key]) return next;
		next.corners[key] = point({ x: x, y: y }, IDENTITY[key]);
		return next;
	}

	function mapPoint(uv, corners) {
		const c = normalizeCorners(corners);
		const u = clamp(uv.x, 0, 1);
		const v = clamp(uv.y, 0, 1);
		const a = 1 - u;
		const b = 1 - v;
		return {
			x: a * b * c.tl.x + u * b * c.tr.x + u * v * c.br.x + a * v * c.bl.x,
			y: a * b * c.tl.y + u * b * c.tr.y + u * v * c.br.y + a * v * c.bl.y
		};
	}

	function solveLinear(A, b) {
		const n = b.length;
		const M = A.map(function (row, i) {
			return row.concat([b[i]]);
		});
		for (let i = 0; i < n; i += 1) {
			let max = i;
			for (let r = i + 1; r < n; r += 1) {
				if (Math.abs(M[r][i]) > Math.abs(M[max][i])) max = r;
			}
			const swap = M[i];
			M[i] = M[max];
			M[max] = swap;
			const pivot = M[i][i];
			if (Math.abs(pivot) < 1e-10) return null;
			for (let c = i; c <= n; c += 1) M[i][c] /= pivot;
			for (let r = 0; r < n; r += 1) {
				if (r === i) continue;
				const f = M[r][i];
				for (let c = i; c <= n; c += 1) M[r][c] -= f * M[i][c];
			}
		}
		return M.map(function (row) {
			return row[n];
		});
	}

	function destToSourceMatrix(corners) {
		const c = normalizeCorners(corners);
		const from = [c.tl, c.tr, c.br, c.bl];
		const to = [
			{ x: 0, y: 0 },
			{ x: 1, y: 0 },
			{ x: 1, y: 1 },
			{ x: 0, y: 1 }
		];
		const A = [];
		const b = [];
		for (let i = 0; i < 4; i += 1) {
			const x = from[i].x;
			const y = from[i].y;
			const u = to[i].x;
			const v = to[i].y;
			A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
			b.push(u);
			A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
			b.push(v);
		}
		const h = solveLinear(A, b);
		if (!h) return [1, 0, 0, 0, 1, 0, 0, 0, 1];
		return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
	}

	function applyHomography(p, matrix) {
		const x = matrix[0] * p.x + matrix[1] * p.y + matrix[2];
		const y = matrix[3] * p.x + matrix[4] * p.y + matrix[5];
		const w = matrix[6] * p.x + matrix[7] * p.y + matrix[8];
		if (Math.abs(w) < 1e-8) return null;
		return { x: x / w, y: y / w };
	}

	function destToSource(p, corners) {
		return applyHomography(p, destToSourceMatrix(corners));
	}

	function invBilinear(p, corners) {
		const c = normalizeCorners(corners);
		const a = c.tl;
		const b = c.tr;
		const d = c.br;
		const e0 = c.bl;
		const e = { x: b.x - a.x, y: b.y - a.y };
		const f = { x: e0.x - a.x, y: e0.y - a.y };
		const g = { x: a.x - b.x + d.x - e0.x, y: a.y - b.y + d.y - e0.y };
		const h = { x: p.x - a.x, y: p.y - a.y };
		const k2 = g.x * f.y - g.y * f.x;
		const k1 = e.x * f.y - e.y * f.x + h.x * g.y - h.y * g.x;
		const k0 = h.x * f.y - h.y * f.x;
		let u;
		let v;
		if (Math.abs(k2) < 1e-4) {
			v = Math.abs(k1) < 1e-4 ? 0 : -k0 / k1;
			u = (h.x - f.x * v) / Math.max(e.x + g.x * v, 1e-6);
		} else {
			const w = k1 * k1 - 4 * k2 * k0;
			if (w < 0) return null;
			const rootW = Math.sqrt(w);
			const ik2 = 0.5 / k2;
			v = (-k1 - rootW) * ik2;
			u = (h.x - f.x * v) / Math.max(e.x + g.x * v, 1e-6);
			if (u < -0.02 || u > 1.02 || v < -0.02 || v > 1.02) {
				v = (-k1 + rootW) * ik2;
				u = (h.x - f.x * v) / Math.max(e.x + g.x * v, 1e-6);
			}
		}
		if (u < -0.15 || u > 1.15 || v < -0.15 || v > 1.15) return null;
		return { x: clamp(u, 0, 1), y: clamp(v, 0, 1) };
	}

	root.SynthOutput = {
		defaults: defaults,
		normalize: normalize,
		fromState: fromState,
		defaultMask: defaultMask,
		addMask: addMask,
		removeMask: removeMask,
		updateMask: updateMask,
		setMaskEnabled: setMaskEnabled,
		identityCorners: identityCorners,
		isIdentity: isIdentity,
		mappingActive: mappingActive,
		masksActive: masksActive,
		liveMasks: liveMasks,
		setCorner: setCorner,
		mapPoint: mapPoint,
		invBilinear: invBilinear,
		destToSource: destToSource,
		destToSourceMatrix: destToSourceMatrix,
		IDENTITY: IDENTITY
	};
})(window);
