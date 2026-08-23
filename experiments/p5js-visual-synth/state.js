(function (root) {
	function clone(value) {
		return JSON.parse(JSON.stringify(value));
	}

	function isPlainObject(value) {
		return value && typeof value === 'object' && !Array.isArray(value);
	}

	function deepMerge(target, patch) {
		const out = clone(target);
		Object.keys(patch || {}).forEach(function (key) {
			const next = patch[key];
			const prev = out[key];
			if (isPlainObject(next) && isPlainObject(prev)) {
				out[key] = deepMerge(prev, next);
			} else {
				out[key] = next;
			}
		});
		return out;
	}

	function defaultState() {
		const pipe = root.SynthPipes && root.SynthPipes.createDefault
			? root.SynthPipes.createDefault()
			: { id: 'pipe_01', name: 'PIPE 01', thumbnail: '', operators: [] };
		return {
			pipes: [pipe],
			activePipeId: pipe.id,
			presets: root.SynthPresets ? root.SynthPresets.initial() : [],
			clock: root.SynthClock ? root.SynthClock.defaults() : { bpm: 120, originMs: Date.now() },
			debug: { enabled: false },
			output: root.SynthOutput ? root.SynthOutput.defaults() : {
				mapping: { enabled: true, mode: 'cornerPin', edit: false, corners: { tl: { x: 0, y: 0 }, tr: { x: 1, y: 0 }, br: { x: 1, y: 1 }, bl: { x: 0, y: 1 } } },
				masks: { enabled: true, invert: false, items: [] }
			}
		};
	}

	function migrate(raw) {
		const base = defaultState();
		if (!raw) return base;
		const clock = root.SynthClock
			? root.SynthClock.fromState(raw)
			: Object.assign({ bpm: 120, originMs: Date.now() }, raw.clock || {});
		const output = root.SynthOutput
			? root.SynthOutput.normalize(raw.output)
			: (raw.output || base.output);
		const presets = root.SynthPresets
			? root.SynthPresets.listUser(raw.presets)
			: (Array.isArray(raw.presets) ? clone(raw.presets) : []);
		if (raw.pipes && raw.pipes.length) {
			return {
				pipes: clone(raw.pipes),
				activePipeId: raw.activePipeId || raw.pipes[0].id,
				presets: presets,
				clock: clock,
				debug: raw.debug || { enabled: false },
				output: output
			};
		}
		if (raw.pipeline) {
			const pipe = root.SynthPipes
				? root.SynthPipes.create(raw.pipeline, 'PIPE 01', 'pipe_01')
				: { id: 'pipe_01', name: 'PIPE 01', thumbnail: '', operators: clone(raw.pipeline) };
			return {
				pipes: [pipe],
				activePipeId: pipe.id,
				presets: presets,
				clock: clock,
				debug: raw.debug || { enabled: false },
				output: output
			};
		}
		return deepMerge(base, raw);
	}

	function applyOpParam(state, opParam) {
		if (!opParam || !opParam.id) return state;
		const next = clone(state);
		next.pipes = (next.pipes || []).map(function (pipe) {
			const operators = (pipe.operators || []).map(function (op) {
				if (op.id !== opParam.id) return op;
				const updated = clone(op);
				updated.parameters = updated.parameters || {};
				if (opParam.parameters) {
					Object.keys(opParam.parameters).forEach(function (key) {
						updated.parameters[key] = opParam.parameters[key];
					});
				} else if (Object.prototype.hasOwnProperty.call(opParam, 'key')) {
					updated.parameters[opParam.key] = opParam.value;
				}
				if (typeof opParam.bypassed === 'boolean') {
					updated.bypassed = opParam.bypassed;
				}
				if (Object.prototype.hasOwnProperty.call(opParam, 'presetId')) {
					if (opParam.presetId) updated.presetId = opParam.presetId;
					else delete updated.presetId;
				}
				return updated;
			});
			return Object.assign({}, pipe, { operators: operators });
		});
		return next;
	}

	function applyOpMod(state, opMod) {
		if (!opMod || !opMod.id || !opMod.key) return state;
		const next = clone(state);
		next.pipes = (next.pipes || []).map(function (pipe) {
			const operators = (pipe.operators || []).map(function (op) {
				if (op.id !== opMod.id) return op;
				const updated = clone(op);
				updated.modulations = updated.modulations || {};
				if (!opMod.modulation) {
					delete updated.modulations[opMod.key];
					return updated;
				}
				updated.modulations[opMod.key] = Object.assign(
					{},
					updated.modulations[opMod.key] || {},
					opMod.modulation
				);
				return updated;
			});
			return Object.assign({}, pipe, { operators: operators });
		});
		return next;
	}

	function setActiveOperators(state, operators) {
		const next = clone(state);
		const id = next.activePipeId;
		next.pipes = (next.pipes || []).map(function (pipe) {
			if (pipe.id !== id) return pipe;
			const updated = clone(pipe);
			updated.operators = clone(operators);
			return updated;
		});
		return next;
	}

	const PATCH_KEYS = {
		pipes: true,
		activePipeId: true,
		presets: true,
		operators: true,
		pipeline: true,
		opParam: true,
		opMod: true,
		pipeThumb: true,
		pipeMeta: true
	};

	function applyPatch(state, patch) {
		if (!patch) return state;
		let next = state;
		if (Object.prototype.hasOwnProperty.call(patch, 'pipes')) {
			next = clone(next);
			next.pipes = clone(patch.pipes);
		}
		if (Object.prototype.hasOwnProperty.call(patch, 'activePipeId')) {
			next = clone(next);
			next.activePipeId = patch.activePipeId;
		}
		if (Object.prototype.hasOwnProperty.call(patch, 'presets')) {
			next = clone(next);
			next.presets = root.SynthPresets
				? root.SynthPresets.listUser(patch.presets)
				: clone(patch.presets);
		}
		if (Object.prototype.hasOwnProperty.call(patch, 'operators')) {
			next = setActiveOperators(next, patch.operators);
		}
		if (Object.prototype.hasOwnProperty.call(patch, 'pipeline')) {
			next = setActiveOperators(next, patch.pipeline);
		}
		if (patch.opParam) {
			next = applyOpParam(next, patch.opParam);
		}
		if (patch.opMod) {
			next = applyOpMod(next, patch.opMod);
		}
		if (patch.pipeThumb && patch.pipeThumb.id) {
			next = clone(next);
			next.pipes = (next.pipes || []).map(function (pipe) {
				if (pipe.id !== patch.pipeThumb.id) return pipe;
				const updated = clone(pipe);
				updated.thumbnail = patch.pipeThumb.thumbnail || '';
				return updated;
			});
		}
		if (patch.pipeMeta && patch.pipeMeta.id) {
			next = clone(next);
			next.pipes = (next.pipes || []).map(function (pipe) {
				if (pipe.id !== patch.pipeMeta.id) return pipe;
				const updated = clone(pipe);
				if (typeof patch.pipeMeta.name === 'string') {
					updated.name = patch.pipeMeta.name;
				}
				return updated;
			});
		}
		const rest = {};
		Object.keys(patch).forEach(function (key) {
			if (PATCH_KEYS[key]) return;
			rest[key] = patch[key];
		});
		if (Object.keys(rest).length) {
			next = deepMerge(next, rest);
		}
		return next;
	}

	const listeners = [];
	let state = defaultState();

	function notify() {
		listeners.forEach(function (fn) {
			fn(state);
		});
	}

	root.SynthState = {
		getDefault: defaultState,
		applyPatch: applyPatch,
		migrate: migrate,
		get: function () {
			return state;
		},
		clone: clone,
		subscribe: function (fn) {
			listeners.push(fn);
			return function () {
				const i = listeners.indexOf(fn);
				if (i >= 0) listeners.splice(i, 1);
			};
		},
		patch: function (patch) {
			state = applyPatch(state, patch);
			notify();
			return state;
		},
		replace: function (next) {
			state = migrate(next);
			notify();
			return state;
		}
	};
})(window);
