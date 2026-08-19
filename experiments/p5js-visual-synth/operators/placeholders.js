(function (root) {
	const CATS = root.SynthCategories || {};

	const PLACEHOLDERS = [
		{ type: 'gradient', name: 'Gradient', category: 'generator' },
		{ type: 'particles', name: 'Particles', category: 'generator' },
		{ type: 'video', name: 'Video', category: 'generator' },
		{ type: 'displace', name: 'Displace', category: 'effect' },
		{ type: 'blur', name: 'Blur', category: 'effect' },
		{ type: 'feedback', name: 'Feedback', category: 'effect' },
		{ type: 'hue', name: 'Hue / Saturation', category: 'color' },
		{ type: 'levels', name: 'Levels', category: 'color' },
		{ type: 'contrast', name: 'Contrast', category: 'color' },
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
		effect: 'Effects / Filters',
		filter: 'Effects / Filters',
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
