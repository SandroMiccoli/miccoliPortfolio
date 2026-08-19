(function (root) {
	const cat = root.SynthCategories.generator;

	root.SynthRegistry.register({
		type: 'camera',
		name: 'Camera Input',
		category: 'generator',
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Uses the display device camera as a live texture. Mirror flips the image. Cover fills the frame; Contain letterboxes. After another operator, Blending Mode composites the camera with whatever came before.',
		implemented: true,
		defaults: {
			mirror: 1,
			fit: 'cover',
			blendMode: 'normal'
		},
		params: [
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
			let held = false;
			let warned = false;

			function hold() {
				if (held || !root.SynthCamera) return;
				held = true;
				root.SynthCamera.retain(function (err) {
					if (warned) return;
					warned = true;
					if (root.SynthNotify) {
						root.SynthNotify.show('warning', (err && err.message) || 'Camera unavailable');
					}
				});
			}

			return {
				process: function (ctx) {
					hold();
					const cam = root.SynthCamera;
					const ready = cam && cam.ready();
					const tex = ready ? cam.texture() : null;
					if (!tex) {
						engine.drawTo(ctx.output, engine.shaders.copy, {
							u_input: ctx.input,
							u_gain: ctx.hasInput ? 1 : 0
						});
						return;
					}
					const tw = tex.width || (tex.elt && tex.elt.videoWidth) || 1;
					const th = tex.height || (tex.elt && tex.elt.videoHeight) || 1;
					engine.drawTo(ctx.output, engine.shaders.camera, {
						u_input: ctx.input,
						u_hasInput: ctx.hasInput ? 1 : 0,
						u_blendMode: root.SynthBlend.toUniform(ctx.parameters.blendMode),
						u_video: tex,
						u_texSize: [tw, th],
						u_mirror: ctx.parameters.mirror ? 1 : 0,
						u_cover: ctx.parameters.fit === 'contain' ? 0 : 1
					});
				},
				dispose: function () {
					if (held && root.SynthCamera) root.SynthCamera.release();
					held = false;
				}
			};
		}
	});
})(window);
