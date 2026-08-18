(function (root) {
	const DEFAULT_STATE = {
		generator: 'waves',
		waves: {
			frequency: 6.5,
			amplitude: 0.45,
			speed: 0.55,
			direction: 28,
			scale: 1.1
		},
		noise: {
			mode: 'color',
			scale: 3.5,
			speed: 0.35,
			intensity: 0.85,
			hue: 200
		},
		shader: {
			speed: 0.8,
			scale: 1.2,
			distortion: 0.9,
			intensity: 0.85,
			hue: 310
		},
		camera: {
			enabled: false,
			connected: false,
			opacity: 0.45,
			blendMode: 'screen',
			intensity: 1
		},
		debug: {
			enabled: false
		}
	};

	const listeners = [];
	let state = clone(DEFAULT_STATE);

	function clone(value) {
		return JSON.parse(JSON.stringify(value));
	}

	function isPlainObject(value) {
		return value && typeof value === 'object' && !Array.isArray(value);
	}

	function deepMerge(target, patch) {
		const out = clone(target);
		Object.keys(patch || {}).forEach((key) => {
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

	function notify() {
		listeners.forEach((fn) => fn(state));
	}

	root.SynthState = {
		DEFAULT: DEFAULT_STATE,
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
			state = deepMerge(state, patch);
			notify();
			return state;
		},
		replace: function (next) {
			state = deepMerge(clone(DEFAULT_STATE), next || {});
			notify();
			return state;
		}
	};
})(window);
