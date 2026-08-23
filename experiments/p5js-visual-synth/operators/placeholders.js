(function (root) {
	const CATS = root.SynthCategories || {};

	const PLACEHOLDERS = [
		{ type: 'particles', name: 'Particles', category: 'generator' },
		{ type: 'video', name: 'Video', category: 'generator' },
		{ type: 'blend', name: 'Blend', category: 'compositing' },
		{ type: 'mask', name: 'Mask', category: 'compositing' },
		{ type: 'add', name: 'Add', category: 'compositing' },
		{ type: 'multiply', name: 'Multiply', category: 'compositing' },
		{ type: 'texture', name: 'Texture', category: 'output' },
		{ type: 'syphon', name: 'Syphon / Spout', category: 'output' },
		{ type: 'ndi', name: 'NDI', category: 'output' }
	];

	const LABELS = {
		generator: 'Generators',
		effect: 'Effects',
		filter: 'Filters',
		color: 'Color',
		compositing: 'Compositing',
		output: 'Output'
	};

	PLACEHOLDERS.forEach(function (item) {
		const cat = CATS[item.category] || {};
		root.SynthRegistry.register({
			type: item.type,
			name: item.name,
			category: item.category,
			categoryLabel: LABELS[item.category] || item.category,
			color: cat.color || '#666666',
			implemented: false,
			defaults: {},
			params: []
		});
	});
})(window);
