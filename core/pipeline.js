(function (root) {
	const MVP_ORDER = ['lines', 'warp', 'lookup', 'bloom', 'screen'];
	const MVP_IDS = ['op_lines', 'op_warp', 'op_lookup', 'op_bloom', 'op_screen'];

	function clone(value) {
		return JSON.parse(JSON.stringify(value));
	}

	function uid() {
		return 'op_' + Math.random().toString(36).slice(2, 10);
	}

	function snap(value, min, max, step) {
		const stepped = Math.round((value - min) / step) * step + min;
		const clamped = Math.min(max, Math.max(min, stepped));
		if (step >= 1) return Math.round(clamped);
		const digits = step < 0.1 ? 2 : 1;
		return Number(clamped.toFixed(digits));
	}

	function randomParam(spec) {
		if (!spec) return undefined;
		if (spec.randomize === false) return undefined;
		if (spec.kind === 'enum' && spec.options && spec.options.length) {
			return spec.options[Math.floor(Math.random() * spec.options.length)].id;
		}
		if (spec.kind === 'palette') return undefined;
		if (spec.kind === 'color') {
			return root.SynthColor ? root.SynthColor.random() : '#FFFFFF';
		}
		if (typeof spec.min !== 'number' || typeof spec.max !== 'number') return undefined;
		const step = spec.step || 1;
		const span = spec.max - spec.min;
		return snap(spec.min + Math.random() * span, spec.min, spec.max, step);
	}

	function randomizeParameters(def) {
		const out = clone(def.defaults || {});
		(def.params || []).forEach(function (spec) {
			if (!spec || !spec.key) return;
			const value = randomParam(spec);
			if (value !== undefined) out[spec.key] = value;
		});
		if (typeof def.randomize === 'function') def.randomize(out);
		return out;
	}

	function makeInstance(type, id, randomize) {
		const def = root.SynthRegistry.get(type);
		if (!def || !def.implemented) return null;
		return {
			id: id || uid(),
			type: def.type,
			name: def.name,
			bypassed: false,
			parameters: randomize ? randomizeParameters(def) : clone(def.defaults || {}),
			modulations: {}
		};
	}

	function insertIndex(pipeline) {
		let lastScreen = -1;
		(pipeline || []).forEach(function (op, i) {
			if (op.type === 'screen') lastScreen = i;
		});
		return lastScreen >= 0 ? lastScreen : (pipeline || []).length;
	}

	root.SynthPipeline = {
		MVP_ORDER: MVP_ORDER,

		createDefault: function () {
			return MVP_ORDER.map(function (type, i) {
				return makeInstance(type, MVP_IDS[i]);
			}).filter(Boolean);
		},

		createFresh: function () {
			return MVP_ORDER.map(function (type) {
				return makeInstance(type);
			}).filter(Boolean);
		},

		createInstance: makeInstance,

		add: function (pipeline, type, index) {
			const next = (pipeline || []).slice();
			const inst = makeInstance(type, null, true);
			if (!inst) return next;
			const at = index == null ? insertIndex(next) : Math.max(0, Math.min(next.length, index));
			const def = root.SynthRegistry.get(type);
			if (def && def.category === 'generator' && at > 0) {
				inst.parameters.blendMode = 'difference';
			}
			next.splice(at, 0, inst);
			return next;
		},

		moveTo: function (pipeline, id, toIndex) {
			const next = (pipeline || []).slice();
			const from = next.findIndex(function (op) {
				return op.id === id;
			});
			if (from < 0) return next;
			const dest = Math.max(0, Math.min(next.length - 1, toIndex));
			if (from === dest) return next;
			const item = next.splice(from, 1)[0];
			next.splice(dest, 0, item);
			return next;
		},

		remove: function (pipeline, id) {
			return (pipeline || []).filter(function (op) {
				return op.id !== id;
			});
		},

		duplicate: function (pipeline, id) {
			const next = (pipeline || []).slice();
			const index = next.findIndex(function (op) {
				return op.id === id;
			});
			if (index < 0) return next;
			const copy = clone(next[index]);
			copy.id = uid();
			next.splice(index + 1, 0, copy);
			return next;
		},

		move: function (pipeline, id, dir) {
			const next = (pipeline || []).slice();
			const index = next.findIndex(function (op) {
				return op.id === id;
			});
			const dest = index + dir;
			if (index < 0 || dest < 0 || dest >= next.length) return next;
			const item = next.splice(index, 1)[0];
			next.splice(dest, 0, item);
			return next;
		},

		setBypass: function (pipeline, id, bypassed) {
			return (pipeline || []).map(function (op) {
				if (op.id !== id) return op;
				const next = clone(op);
				next.bypassed = !!bypassed;
				return next;
			});
		}
	};
})(window);
