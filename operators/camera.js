(function (root) {
	const cat = root.SynthCategories.generator;

	root.SynthRegistry.register({
		type: 'camera',
		name: 'Camera Input',
		category: 'generator',
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Live camera texture. Display uses the USB webcam on the Pi. Phone uses the control phone camera and sends frames over the network. Mirror flips the image. Cover fills the frame; Contain letterboxes.',
		implemented: true,
		defaults: {
			source: 'display',
			deviceId: '',
			mirror: 1,
			fit: 'cover',
			blendMode: 'normal'
		},
		params: [
			{
				key: 'source',
				label: 'Source',
				kind: 'enum',
				randomize: false,
				options: [
					{ id: 'display', label: 'Display' },
					{ id: 'phone', label: 'Phone' }
				]
			},
			{
				key: 'deviceId',
				label: 'Device',
				kind: 'enum',
				randomize: false,
				optionsFrom: 'cameraDevices'
			},
			{ key: 'mirror', label: 'Mirror', kind: 'enum', options: [
				{ id: 0, label: 'Off' },
				{ id: 1, label: 'On' }
			]},
			{ key: 'fit', label: 'Fit', kind: 'enum', options: [
				{ id: 'cover', label: 'Cover' },
				{ id: 'contain', label: 'Contain' }
			]},
			root.SynthBlend.param
		],
		create: function (engine) {
			return {
				process: function (ctx) {
					const source = ctx.parameters.source || 'display';
					if (root.SynthCamera) {
						root.SynthCamera.ensure({
							source: source,
							deviceId: ctx.parameters.deviceId || ''
						});
					}
					const cam = root.SynthCamera;
					const tex = cam ? cam.texture(source) : null;
					if (!tex) {
						engine.drawTo(ctx.output, engine.shaders.copy, {
							u_input: ctx.input,
							u_gain: ctx.hasInput ? 1 : 0
						});
						return;
					}
					const size = cam.size(source);
					engine.drawTo(ctx.output, engine.shaders.camera, {
						u_input: ctx.input,
						u_hasInput: ctx.hasInput ? 1 : 0,
						u_blendMode: root.SynthBlend.toUniform(ctx.parameters.blendMode),
						u_video: tex,
						u_texSize: size,
						u_mirror: ctx.parameters.mirror ? 1 : 0,
						u_cover: ctx.parameters.fit === 'contain' ? 0 : 1
					});
				},
				dispose: function () {
					if (root.SynthCamera) root.SynthCamera.stop();
				}
			};
		}
	});
})(window);
