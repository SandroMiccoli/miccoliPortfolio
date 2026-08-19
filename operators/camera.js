(function (root) {
	const cat = root.SynthCategories.generator;

	root.SynthRegistry.register({
		type: 'camera',
		name: 'Camera Input',
		category: 'generator',
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Live camera texture. Display uses the USB webcam on the renderer. Phone uses this control phone and sends frames over the network. Device, Mirror, and Fit appear after that source is live. Reconnect stops and reopens the camera.',
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
				optionsFrom: 'cameraDevices',
				visibleWhen: 'cameraDevices'
			},
			{ key: 'mirror', label: 'Mirror', kind: 'enum', visibleWhen: 'cameraLive', options: [
				{ id: 0, label: 'Off' },
				{ id: 1, label: 'On' }
			]},
			{ key: 'fit', label: 'Fit', kind: 'enum', visibleWhen: 'cameraLive', options: [
				{ id: 'cover', label: 'Cover' },
				{ id: 'contain', label: 'Contain' }
			]},
			root.SynthBlend.param
		],
		create: function (engine) {
			let gfx = null;

			function dest(w, h) {
				w = Math.max(2, w | 0);
				h = Math.max(2, h | 0);
				if (!gfx || gfx.width !== w || gfx.height !== h) {
					if (gfx && gfx.remove) gfx.remove();
					gfx = createGraphics(w, h);
					gfx.pixelDensity(1);
				}
				return gfx;
			}

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
					const src = cam && cam.frame ? cam.frame(source) : null;
					if (!src || !src.el || src.w < 2) {
						engine.drawTo(ctx.output, engine.shaders.copy, {
							u_input: ctx.input,
							u_gain: ctx.hasInput ? 1 : 0
						});
						return;
					}
					const g = dest(src.w, src.h);
					g.clear();
					g.drawingContext.drawImage(src.el, 0, 0, src.w, src.h);
					engine.drawTo(ctx.output, engine.shaders.camera, {
						u_input: ctx.input,
						u_hasInput: ctx.hasInput ? 1 : 0,
						u_blendMode: root.SynthBlend.toUniform(ctx.parameters.blendMode),
						u_texSize: [src.w, src.h],
						u_mirror: ctx.parameters.mirror ? 1 : 0,
						u_cover: ctx.parameters.fit === 'contain' ? 0 : 1,
						u_video: g
					});
				},
				dispose: function () {
					if (gfx && gfx.remove) gfx.remove();
					gfx = null;
					if (root.SynthCamera) root.SynthCamera.stop();
				}
			};
		}
	});
})(window);
