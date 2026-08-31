(function (root) {
	const operators = {};

	root.SynthCategories = {
		generator: {
			id: 'generator',
			label: 'Generators',
			color: '#B45CC8',
			about: 'Creates a visual from nothing. Lines, Noise, VHS Tape, Shape, Gradient, and Camera Input start the picture. If another image already exists above it in the stack, the generator composites with that image using Blending Mode (Difference, Add, Multiply, and so on).'
		},
		effect: {
			id: 'effect',
			label: 'Effects',
			color: '#4AAE72',
			about: 'Transforms the incoming image in space. Warp, Transform, and Displace bend it. Kaleidoscope and Mirror fold it. Tile repeats it. Pixelate snaps it to a grid. Glitch tears it into time-quantized bands. Feedback keeps a decaying trail and transforms that trail. Spatial effects expose Tile (Hold, Repeat, Mirror) when UVs leave the frame. An effect never starts a new picture on its own.'
		},
		filter: {
			id: 'filter',
			label: 'Filters',
			color: '#5B7FD4',
			about: 'Processes the incoming image without remapping its geometry. Blur softens everything. Bloom glows around bright areas. Edge traces luminance outlines. A filter never starts a new picture on its own.'
		},
		color: {
			id: 'color',
			label: 'Color',
			color: '#D4A84B',
			about: 'Remaps brightness and color of the incoming image. Color Lookup maps luminance to a palette. Color Ramp does the same through authored notches, with phase, period, and linear or step interpolation. HSV, Levels, and Contrast grade the existing color. Posterize cuts it into steps. Invert flips RGB, luma, or hue. Chroma Key excludes a chosen color. Geometry stays. Values change.'
		},
		compositing: {
			id: 'compositing',
			label: 'Compositing',
			color: '#D4784A',
			about: 'Combines images with blend, mask, add, or multiply. Placeholder in this build.'
		},
		output: {
			id: 'output',
			label: 'Output',
			color: '#8E8E8E',
			about: 'Sends the current image somewhere. Screen is the default display for this build.'
		}
	};

	const BLEND_MODES = [
		{ id: 'normal', label: 'Normal', value: 0 },
		{ id: 'add', label: 'Add', value: 1 },
		{ id: 'multiply', label: 'Multiply', value: 2 },
		{ id: 'screen', label: 'Screen', value: 3 },
		{ id: 'difference', label: 'Difference', value: 4 },
		{ id: 'overlay', label: 'Overlay', value: 5 },
		{ id: 'subtract', label: 'Subtract', value: 6 },
		{ id: 'lighten', label: 'Lighten', value: 7 },
		{ id: 'darken', label: 'Darken', value: 8 }
	];

	root.SynthBlend = {
		modes: BLEND_MODES,
		param: {
			key: 'blendMode',
			label: 'Blending Mode',
			kind: 'enum',
			show: 'afterInput',
			options: BLEND_MODES.map(function (mode) {
				return { id: mode.id, label: mode.label };
			})
		},
		toUniform: function (id) {
			const found = BLEND_MODES.filter(function (mode) {
				return mode.id === id;
			})[0];
			return found ? found.value : 0;
		}
	};

	function clampByte(n) {
		return Math.max(0, Math.min(255, Math.round(n)));
	}

	root.SynthColor = {
		parseHex: function (hex) {
			const raw = String(hex || '').trim().replace(/^#/, '');
			if (raw.length === 3) {
				return [
					parseInt(raw[0] + raw[0], 16),
					parseInt(raw[1] + raw[1], 16),
					parseInt(raw[2] + raw[2], 16)
				];
			}
			if (raw.length >= 6) {
				return [
					parseInt(raw.slice(0, 2), 16),
					parseInt(raw.slice(2, 4), 16),
					parseInt(raw.slice(4, 6), 16)
				];
			}
			return [255, 255, 255];
		},
		toRgb: function (hex) {
			const rgb = root.SynthColor.parseHex(hex);
			return [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
		},
		toHex: function (r, g, b) {
			function byte(n) {
				return clampByte(n).toString(16).padStart(2, '0');
			}
			return ('#' + byte(r) + byte(g) + byte(b)).toUpperCase();
		},
		random: function () {
			const n = Math.floor(Math.random() * 0xffffff);
			return '#' + n.toString(16).padStart(6, '0').toUpperCase();
		}
	};

	const XYZ_AXES = ['X', 'Y', 'Z'];
	const XY_AXES = ['X', 'Y'];

	root.SynthParams = {
		axes: XYZ_AXES,
		isVec: function (spec) {
			return !!(spec && (spec.kind === 'xyz' || spec.kind === 'xy'));
		},
		axesFor: function (spec) {
			return spec && spec.kind === 'xy' ? XY_AXES : XYZ_AXES;
		},
		axisKey: function (spec, axis) {
			return spec.key + String(axis).toUpperCase();
		},
		axisSpec: function (spec, axis) {
			const letter = String(axis).toUpperCase();
			return {
				key: spec.key + letter,
				label: letter,
				kind: 'range',
				min: spec.min,
				max: spec.max,
				step: spec.step,
				unit: spec.unit
			};
		},
		expand: function (spec) {
			if (!this.isVec(spec)) return spec ? [spec] : [];
			return this.axesFor(spec).map(function (axis) {
				return root.SynthParams.axisSpec(spec, axis);
			});
		}
	};

	const TILE_MODES = [
		{ id: 'hold', label: 'Hold', value: 0 },
		{ id: 'repeat', label: 'Repeat', value: 1 },
		{ id: 'mirror', label: 'Mirror', value: 2 }
	];

	root.SynthTile = {
		modes: TILE_MODES,
		param: {
			key: 'tile',
			label: 'Tile',
			kind: 'enum',
			options: TILE_MODES.map(function (mode) {
				return { id: mode.id, label: mode.label };
			})
		},
		toUniform: function (id) {
			if (id === 'repeat' || id === 1 || id === '1') return 1;
			if (id === 'mirror' || id === 2 || id === '2') return 2;
			return 0;
		},
		resolve: function (params, fallback) {
			const p = params || {};
			if (p.tile != null && p.tile !== '') return this.toUniform(p.tile);
			if (p.wrap != null && p.wrap !== '') return this.toUniform(p.wrap);
			return this.toUniform(fallback == null ? 'hold' : fallback);
		}
	};

	root.SynthRegistry = {
		register: function (def) {
			if (!def || !def.type) return;
			operators[def.type] = def;
			return def;
		},

		get: function (type) {
			return operators[type] || null;
		},

		list: function () {
			return Object.keys(operators).map(function (type) {
				return operators[type];
			});
		},

		listByCategory: function () {
			const order = ['generator', 'effect', 'filter', 'color', 'compositing', 'output'];
			const map = {};
			this.list().forEach(function (def) {
				if (def.hidden) return;
				const cat = def.category || 'other';
				if (!map[cat]) {
					map[cat] = { id: cat, label: def.categoryLabel || cat, items: [] };
				}
				map[cat].items.push(def);
			});
			Object.keys(map).forEach(function (id) {
				map[id].items.sort(function (a, b) {
					return String(a.name || a.type).localeCompare(String(b.name || b.type), undefined, { sensitivity: 'base' });
				});
			});
			const groups = [];
			order.forEach(function (id) {
				if (map[id]) groups.push(map[id]);
			});
			Object.keys(map).forEach(function (id) {
				if (order.indexOf(id) < 0) groups.push(map[id]);
			});
			return groups;
		}
	};
})(window);
