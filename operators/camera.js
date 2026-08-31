(function (root) {
	const cat = root.SynthCategories.generator;

	root.SynthRegistry.register({
		type: 'camera',
		name: 'Camera Input',
		category: 'generator',
		categoryLabel: cat.label,
		color: cat.color,
		help: 'Live camera texture. Display uses a USB webcam on the renderer, or a RealSense infrared (GREY) node if you pick it in Device. Depth is ignored. Phone uses this control phone and sends frames over the network. Device, Mirror, and Fit appear after that source is live. Reconnect stops and reopens the camera.',
		implemented: true,
		defaults: {
			source: 'display',
			deviceId: '',
			mirror: 1,
			fit: 'cover',
			blendMode: 'normal'
		},
		presets: [
			{ id: 'mirror', name: 'Mirror', parameters: { source: 'display', mirror: 1, fit: 'cover', blendMode: 'normal' } },
			{ id: 'clean', name: 'Clean', parameters: { source: 'display', mirror: 0, fit: 'contain', blendMode: 'normal' } }
		],
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

			function drawAuthorizeHint(g, w, h) {
				const ctx2d = g.drawingContext;
				ctx2d.setTransform(1, 0, 0, 1, 0, 0);
				ctx2d.fillStyle = '#000';
				ctx2d.fillRect(0, 0, w, h);
				const size = Math.max(10, Math.min(15, Math.min(w, h) * 0.022));
				ctx2d.font = '400 ' + size + 'px ui-monospace, "Cascadia Mono", Menlo, Consolas, monospace';
				if (ctx2d.letterSpacing !== undefined) ctx2d.letterSpacing = '0.14em';
				ctx2d.fillStyle = 'rgba(255,255,255,0.18)';
				ctx2d.textAlign = 'center';
				ctx2d.textBaseline = 'middle';
				ctx2d.fillText('autorize sua câmera', w * 0.5, h * 0.5);
			}

			function blitFit(ctx2d, el, srcW, srcH, dstW, dstH, cover, mirror) {
				ctx2d.setTransform(1, 0, 0, 1, 0, 0);
				ctx2d.fillStyle = '#000';
				ctx2d.fillRect(0, 0, dstW, dstH);
				const texA = srcW / srcH;
				const outA = dstW / dstH;
				let dw;
				let dh;
				if (cover) {
					if (texA > outA) {
						dh = dstH;
						dw = dh * texA;
					} else {
						dw = dstW;
						dh = dw / texA;
					}
				} else if (texA > outA) {
					dw = dstW;
					dh = dw / texA;
				} else {
					dh = dstH;
					dw = dh * texA;
				}
				const dx = (dstW - dw) / 2;
				const dy = (dstH - dh) / 2;
				ctx2d.save();
				if (mirror) {
					ctx2d.translate(dstW, 0);
					ctx2d.scale(-1, 1);
				}
				ctx2d.drawImage(el, dx, dy, dw, dh);
				ctx2d.restore();
			}

			return {
				process: function (ctx) {
					const source = ctx.parameters.source || 'display';
					if (ctx.allowCamera !== false && root.SynthCamera) {
						root.SynthCamera.ensure({
							source: source,
							deviceId: ctx.parameters.deviceId || ''
						});
					}
					const cam = root.SynthCamera;
					const src = cam && cam.frame ? cam.frame(source) : null;
					if (!src || !src.el || src.w < 2 || src.h < 2) {
						if (ctx.allowCamera === false) {
							engine.drawTo(ctx.output, engine.shaders.copy, {
								u_input: ctx.input,
								u_gain: ctx.hasInput ? 1 : 0
							});
							return;
						}
						const outW = Math.max(2, ctx.width | 0);
						const outH = Math.max(2, ctx.height | 0);
						const g = dest(outW, outH);
						drawAuthorizeHint(g, outW, outH);
						engine.drawTo(ctx.output, engine.shaders.camera, {
							u_input: ctx.input,
							u_hasInput: ctx.hasInput ? 1 : 0,
							u_blendMode: root.SynthBlend.toUniform(ctx.parameters.blendMode),
							u_video: g
						});
						return;
					}
					const outW = Math.max(2, ctx.width | 0);
					const outH = Math.max(2, ctx.height | 0);
					const g = dest(outW, outH);
					blitFit(
						g.drawingContext,
						src.el,
						src.w,
						src.h,
						outW,
						outH,
						ctx.parameters.fit !== 'contain',
						!!ctx.parameters.mirror
					);
					engine.drawTo(ctx.output, engine.shaders.camera, {
						u_input: ctx.input,
						u_hasInput: ctx.hasInput ? 1 : 0,
						u_blendMode: root.SynthBlend.toUniform(ctx.parameters.blendMode),
						u_video: g
					});
				},
				dispose: function () {
					if (gfx && gfx.remove) gfx.remove();
					gfx = null;
					if (root.SynthCamera) {
						if (root.SynthCamera.release) root.SynthCamera.release();
						else root.SynthCamera.stop();
					}
				}
			};
		}
	});
})(window);
