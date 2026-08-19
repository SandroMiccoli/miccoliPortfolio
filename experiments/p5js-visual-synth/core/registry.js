(function (root) {
	const operators = {};

	root.SynthCategories = {
		generator: {
			id: 'generator',
			label: 'Generators',
			color: '#B45CC8',
			about: 'Creates a visual from nothing. If another image already exists above it in the stack, the generator composites with that image using Blending Mode (Difference, Add, Multiply, and so on).'
		},
		effect: {
			id: 'effect',
			label: 'Effects / Filters',
			color: '#4AAE72',
			about: 'Transforms the incoming image. Warp bends space. Bloom glows bright areas. An effect never starts a new picture on its own.'
		},
		color: {
			id: 'color',
			label: 'Color',
			color: '#D4A84B',
			about: 'Remaps brightness and color of the incoming image. Geometry stays. Values change.'
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
			const order = ['generator', 'effect', 'color', 'compositing', 'output'];
			const map = {};
			this.list().forEach(function (def) {
				const cat = def.category || 'other';
				if (!map[cat]) {
					map[cat] = { id: cat, label: def.categoryLabel || cat, items: [] };
				}
				map[cat].items.push(def);
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
