(function (root) {
	function clone(value) {
		return JSON.parse(JSON.stringify(value));
	}

	function uid() {
		return 'pipe_' + Math.random().toString(36).slice(2, 10);
	}

	function pad(n) {
		return n < 10 ? '0' + n : String(n);
	}

	function nextName(pipes) {
		const used = {};
		(pipes || []).forEach(function (pipe) {
			used[pipe.name] = true;
		});
		let n = 1;
		let name = 'PIPE ' + pad(n);
		while (used[name]) {
			n += 1;
			name = 'PIPE ' + pad(n);
		}
		return name;
	}

	function reIdOperators(operators) {
		return clone(operators || []).map(function (op) {
			op.id = 'op_' + Math.random().toString(36).slice(2, 10);
			return op;
		});
	}

	function createPipe(operators, name, id) {
		return {
			id: id || uid(),
			name: name || 'PIPE 01',
			thumbnail: '',
			operators: operators || []
		};
	}

	function active(state) {
		const pipes = (state && state.pipes) || [];
		if (!pipes.length) return null;
		const found = pipes.filter(function (pipe) {
			return pipe.id === state.activePipeId;
		})[0];
		return found || pipes[0];
	}

	function visualSignature(pipe) {
		if (!pipe) return '';
		return JSON.stringify((pipe.operators || []).map(function (op) {
			return {
				id: op.id,
				type: op.type,
				bypassed: !!op.bypassed,
				parameters: op.parameters || {}
			};
		}));
	}

	root.SynthPipes = {
		uid: uid,
		nextName: nextName,
		create: createPipe,
		active: active,
		visualSignature: visualSignature,

		createDefault: function () {
			const ops = root.SynthPipeline.createDefault();
			return createPipe(ops, 'PIPE 01', 'pipe_01');
		},

		createNew: function (pipes) {
			const ops = root.SynthPipeline.createFresh();
			return createPipe(ops, nextName(pipes));
		},

		duplicate: function (pipe, pipes) {
			const copy = createPipe(
				reIdOperators(pipe.operators),
				nextName(pipes),
				uid()
			);
			copy.thumbnail = pipe.thumbnail || '';
			return copy;
		},

		map: function (state, fn) {
			const next = clone(state);
			next.pipes = (next.pipes || []).map(fn);
			return next;
		},

		setOperators: function (state, operators) {
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
	};
})(window);
