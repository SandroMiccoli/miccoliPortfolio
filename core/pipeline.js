(function (root) {
	const MVP_ORDER = ['lines', 'warp', 'lookup', 'bloom', 'screen'];
	const MVP_IDS = ['op_lines', 'op_warp', 'op_lookup', 'op_bloom', 'op_screen'];

	function clone(value) {
		return JSON.parse(JSON.stringify(value));
	}

	function uid() {
		return 'op_' + Math.random().toString(36).slice(2, 10);
	}

	function makeInstance(type, id) {
		const def = root.SynthRegistry.get(type);
		if (!def || !def.implemented) return null;
		return {
			id: id || uid(),
			type: def.type,
			name: def.name,
			bypassed: false,
			parameters: clone(def.defaults || {})
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
			const inst = makeInstance(type);
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
