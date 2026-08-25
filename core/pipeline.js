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
		if (spec.kind === 'palette' || spec.kind === 'ramp') return undefined;
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
			if (root.SynthParams && root.SynthParams.isVec(spec)) {
				root.SynthParams.expand(spec).forEach(function (axis) {
					const value = randomParam(axis);
					if (value !== undefined) out[axis.key] = value;
				});
				return;
			}
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

	function pick(list) {
		return list[Math.floor(Math.random() * list.length)];
	}

	function chance(p) {
		return Math.random() < p;
	}

	function clamp(n, min, max) {
		return Math.min(max, Math.max(min, n));
	}

	function dropLast(types, type, keepAtLeast) {
		let count = 0;
		types.forEach(function (item) {
			if (item === type) count += 1;
		});
		if (count <= (keepAtLeast || 0)) return false;
		for (let i = types.length - 1; i >= 0; i -= 1) {
			if (types[i] === type) {
				types.splice(i, 1);
				return true;
			}
		}
		return false;
	}

	function isGenerator(type) {
		const def = root.SynthRegistry.get(type);
		return !!(def && def.category === 'generator');
	}

	function tuneRandomInstance(inst, index, types) {
		if (!inst || !inst.parameters) return inst;
		const p = inst.parameters;

		if (inst.type === 'lines') {
			p.amount = Math.max(3, p.amount | 0);
			p.width = clamp(p.width, 0.08, 0.62);
			p.fuzzyness = clamp(p.fuzzyness, 0.15, 0.9);
		}
		if (inst.type === 'noise') {
			p.scale = clamp(p.scale, 1.2, 14);
			p.contrast = clamp(p.contrast, 0.7, 2.2);
			p.octaves = Math.max(2, p.octaves | 0);
		}
		if (inst.type === 'tape') {
			p.lines = clamp(p.lines, 80, 360);
			p.threshold = clamp(p.threshold, 0.45, 0.82);
			p.speed = clamp(p.speed, 0.4, 4);
			p.grain = clamp(p.grain, 0.6, 1.4);
			p.amount = clamp(p.amount, 0.7, 1.3);
		}
		if (inst.type === 'shape') {
			p.x = clamp(p.x, 0.28, 0.72);
			p.y = clamp(p.y, 0.28, 0.72);
			p.r = clamp(p.r, 0.18, 0.55);
		}
		if (inst.type === 'warp') {
			p.amount = clamp(p.amount, 0.16, 0.85);
			p.frequency = clamp(p.frequency, 1.5, 12);
		}
		if (inst.type === 'kaleidoscope') {
			p.segments = Math.max(3, p.segments | 0);
			p.zoom = clamp(p.zoom, 0.55, 1.8);
			p.offsetX = clamp(p.offsetX, 0.35, 0.65);
			p.offsetY = clamp(p.offsetY, 0.35, 0.65);
		}
		if (inst.type === 'edge') {
			p.mix = clamp(p.mix, 0.55, 1);
			p.intensity = clamp(p.intensity, 0.9, 3.2);
			p.threshold = clamp(p.threshold, 0.04, 0.35);
		}
		if (inst.type === 'lookup') {
			p.exposure = clamp(p.exposure, 0.55, 1.45);
			p.saturation = clamp(p.saturation, 0.55, 1.7);
		}
		if (inst.type === 'ramp') {
			p.period = clamp(p.period, 0.7, 2.2);
			p.phase = clamp(p.phase, 0, 0.35);
		}
		if (inst.type === 'hsv') {
			p.hue = clamp(p.hue, -90, 90);
			p.saturation = clamp(p.saturation, 0.45, 1.6);
			p.value = clamp(p.value, 0.7, 1.35);
		}
		if (inst.type === 'levels') {
			p.inBlack = clamp(p.inBlack, 0, 0.22);
			p.inWhite = clamp(p.inWhite, 0.78, 1);
			p.gamma = clamp(p.gamma, 0.7, 1.45);
			p.outBlack = clamp(p.outBlack, 0, 0.12);
			p.outWhite = clamp(p.outWhite, 0.88, 1);
		}
		if (inst.type === 'contrast') {
			p.contrast = clamp(p.contrast, 0.75, 1.85);
			p.brightness = clamp(p.brightness, -0.12, 0.12);
			p.pivot = clamp(p.pivot, 0.38, 0.62);
		}
		if (inst.type === 'bloom') {
			p.intensity = clamp(p.intensity, 0.4, 1.8);
			p.threshold = clamp(p.threshold, 0.12, 0.55);
		}
		if (inst.type === 'gradient') {
			p.spread = clamp(p.spread, 0.35, 1.6);
			p.position = clamp(p.position, 0.25, 0.75);
		}
		if (inst.type === 'warpedConstellations') {
			p.speed = clamp(p.speed, 0.35, 1.4);
			p.scale = clamp(p.scale, 0.6, 1.35);
			p.glow = clamp(p.glow, 0.75, 1.45);
			p.warp = clamp(p.warp, 0.55, 1.4);
		}
		if (inst.type === 'displace') {
			p.amount = clamp(p.amount, 0.08, 0.55);
		}
		if (inst.type === 'blur') {
			p.radius = clamp(p.radius, 0.6, 4.2);
			p.mix = clamp(p.mix, 0.35, 1);
		}
		if (inst.type === 'feedback') {
			p.amount = clamp(p.amount, 0.28, 0.7);
			p.decay = clamp(p.decay, 0.72, 0.94);
			p.scale = clamp(p.scale, 0.94, 1.04);
			p.rotate = clamp(p.rotate, -3, 3);
		}
		if (inst.type === 'transform') {
			p.translateX = clamp(p.translateX, -0.28, 0.28);
			p.translateY = clamp(p.translateY, -0.28, 0.28);
			p.rotate = clamp(p.rotate, -28, 28);
			p.scaleX = clamp(p.scaleX, 0.72, 1.45);
			p.scaleY = clamp(p.scaleY, 0.72, 1.45);
			p.tile = pick(['hold', 'repeat', 'mirror']);
		}
		if (inst.type === 'pixelate') {
			p.sizeX = clamp(p.sizeX, 3, 28);
			p.sizeY = clamp(p.sizeY, 3, 28);
			p.mix = clamp(p.mix, 0.7, 1);
		}
		if (inst.type === 'posterize') {
			p.levels = Math.max(3, p.levels | 0);
			p.mix = clamp(p.mix, 0.7, 1);
		}
		if (inst.type === 'mirror') {
			p.offsetX = clamp(p.offsetX, 0.35, 0.65);
			p.offsetY = clamp(p.offsetY, 0.35, 0.65);
			p.angle = clamp(p.angle, -18, 18);
		}
		if (inst.type === 'tile') {
			p.countX = clamp(p.countX, 1.4, 5);
			p.countY = clamp(p.countY, 1.4, 5);
			p.offsetX = clamp(p.offsetX, -0.2, 0.2);
			p.offsetY = clamp(p.offsetY, -0.2, 0.2);
			p.angle = clamp(p.angle, -12, 12);
			p.tile = pick(['repeat', 'mirror']);
		}
		if (inst.type === 'invert') {
			p.amount = clamp(p.amount, 0.55, 1);
		}
		if (inst.type === 'screen') {
			p.gain = 1;
		}
		if (isGenerator(inst.type) && index > 0 && isGenerator(types[0])) {
			p.blendMode = pick(['difference', 'add', 'overlay', 'screen', 'multiply', 'lighten']);
		}
		return inst;
	}

	// Generator → [blend generator] → warp/kaleido → [edge] → [lookup] → [bloom] → screen
	function randomTypes() {
		const generators = ['lines', 'noise', 'tape', 'shape', 'gradient', 'warpedConstellations'];
		const types = [pick(generators)];

		if (chance(0.38)) {
			types.push(pick(generators.filter(function (type) {
				return type !== types[0];
			})));
		}

		const spatial = [];
		if (chance(0.8)) spatial.push('warp');
		if (chance(0.38)) spatial.push('transform');
		if (chance(0.42)) spatial.push('displace');
		if (chance(0.7)) spatial.push('kaleidoscope');
		if (chance(0.32)) spatial.push('mirror');
		if (chance(0.28)) spatial.push('tile');
		if (chance(0.3)) spatial.push('pixelate');
		if (!spatial.length) spatial.push(pick(['warp', 'transform', 'kaleidoscope', 'displace']));
		types.push.apply(types, spatial);

		if (types.indexOf('kaleidoscope') >= 0 && chance(0.22)) {
			types.push('warp');
		}
		if (chance(0.28)) types.push('feedback');
		if (chance(0.32)) types.push('blur');
		if (chance(0.42)) types.push('edge');
		if (chance(0.88)) types.push(chance(0.42) ? 'ramp' : 'lookup');
		if (chance(0.4)) types.push(pick(['hsv', 'levels', 'contrast', 'posterize', 'invert']));
		if (chance(0.55)) types.push('bloom');
		types.push('screen');

		while (types.length > 8) {
			if (dropLast(types, 'warp', 1)) continue;
			if (dropLast(types, 'transform', 0)) continue;
			if (dropLast(types, 'blur', 0)) continue;
			if (dropLast(types, 'feedback', 0)) continue;
			if (dropLast(types, 'displace', 0)) continue;
			if (dropLast(types, 'mirror', 0)) continue;
			if (dropLast(types, 'tile', 0)) continue;
			if (dropLast(types, 'pixelate', 0)) continue;
			if (dropLast(types, 'hsv', 0)) continue;
			if (dropLast(types, 'levels', 0)) continue;
			if (dropLast(types, 'contrast', 0)) continue;
			if (dropLast(types, 'posterize', 0)) continue;
			if (dropLast(types, 'invert', 0)) continue;
			if (dropLast(types, 'bloom', 0)) continue;
			if (dropLast(types, 'edge', 0)) continue;
			if (types.length > 2 && isGenerator(types[0]) && isGenerator(types[1])) {
				types.splice(1, 1);
				continue;
			}
			types.splice(Math.max(1, types.length - 2), 1);
		}

		while (types.length < 3) {
			const fill = types.indexOf('lookup') < 0 && types.indexOf('ramp') < 0 ? 'lookup' : 'warp';
			types.splice(types.length - 1, 0, fill);
		}

		return types;
	}

	function createRandom() {
		return randomTypes().map(function (type, i, types) {
			return tuneRandomInstance(makeInstance(type, null, type !== 'screen'), i, types);
		}).filter(Boolean);
	}

	root.SynthPipeline = {
		MVP_ORDER: MVP_ORDER,

		createDefault: function () {
			return MVP_ORDER.map(function (type, i) {
				return makeInstance(type, MVP_IDS[i]);
			}).filter(Boolean);
		},

		createFresh: createRandom,
		createRandom: createRandom,

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

		isGenerator: isGenerator,

		isOutput: function (type) {
			const def = root.SynthRegistry.get(type);
			return !!(def && def.category === 'output') || type === 'screen';
		},

		setBypass: function (pipeline, id, bypassed) {
			return (pipeline || []).map(function (op) {
				if (op.id !== id) return op;
				const next = clone(op);
				next.bypassed = !!bypassed;
				return next;
			});
		},

		isSoloed: function (pipeline, id) {
			let found = false;
			for (let i = 0; i < (pipeline || []).length; i += 1) {
				const op = pipeline[i];
				if (this.isOutput(op.type)) continue;
				if (op.id === id) {
					if (op.bypassed) return false;
					found = true;
				} else if (!op.bypassed) {
					return false;
				}
			}
			return found;
		},

		setSolo: function (pipeline, id) {
			const list = pipeline || [];
			const exists = list.some(function (op) {
				return op.id === id;
			});
			if (!exists) return list;
			if (this.isSoloed(list, id)) {
				return list.map(function (op) {
					const next = clone(op);
					if (Object.prototype.hasOwnProperty.call(op, 'preSoloBypassed')) {
						next.bypassed = !!op.preSoloBypassed;
						delete next.preSoloBypassed;
					} else if (op.id === id) {
						next.bypassed = false;
					}
					return next;
				});
			}
			const keepSnapshot = list.some(function (op) {
				return Object.prototype.hasOwnProperty.call(op, 'preSoloBypassed');
			});
			const self = this;
			return list.map(function (op) {
				const next = clone(op);
				if (!keepSnapshot) next.preSoloBypassed = !!op.bypassed;
				next.bypassed = !self.isOutput(op.type) && op.id !== id;
				return next;
			});
		}
	};
})(window);
