(function (root) {
	const color = '#5B7FD4';

	function makeFbo(w, h) {
		const opts = {
			width: Math.max(2, Math.floor(w)),
			height: Math.max(2, Math.floor(h)),
			density: 1,
			antialias: false
		};
		if (typeof LINEAR !== 'undefined') opts.textureFiltering = LINEAR;
		return createFramebuffer(opts);
	}

	root.SynthRegistry.register({
		type: 'feedback',
		name: 'Feedback',
		category: 'effect',
		categoryLabel: 'Effects / Filters',
		color: color,
		help: 'Keeps a decaying trail of this operator\'s previous output and adds it back. Amount is how much trail returns. Decay fades it. Scale and Rotate transform the trail each frame, the analog-video tunnel move.',
		implemented: true,
		defaults: {
			amount: 0.55,
			decay: 0.86,
			scale: 1,
			rotate: 0,
			offsetX: 0,
			offsetY: 0
		},
		presets: [
			{ id: 'trail', name: 'Trail', parameters: { amount: 0.55, decay: 0.86, scale: 1, rotate: 0, offsetX: 0, offsetY: 0 } },
			{ id: 'tunnel', name: 'Tunnel', parameters: { amount: 0.72, decay: 0.92, scale: 0.97, rotate: 0, offsetX: 0, offsetY: 0 } },
			{ id: 'spin', name: 'Spin', parameters: { amount: 0.62, decay: 0.88, scale: 0.995, rotate: 1.8, offsetX: 0, offsetY: 0 } },
			{ id: 'echo', name: 'Echo', parameters: { amount: 0.34, decay: 0.7, scale: 1.03, rotate: 0, offsetX: 0, offsetY: 0 } }
		],
		params: [
			{ key: 'amount', label: 'Amount', kind: 'range', min: 0, max: 1, step: 0.01 },
			{ key: 'decay', label: 'Decay', kind: 'range', min: 0.2, max: 0.99, step: 0.01 },
			{ key: 'scale', label: 'Scale', kind: 'range', min: 0.85, max: 1.15, step: 0.001 },
			{ key: 'rotate', label: 'Rotate', kind: 'range', min: -12, max: 12, step: 0.01, unit: '°' },
			{ key: 'offsetX', label: 'Offset X', kind: 'range', min: -0.2, max: 0.2, step: 0.001 },
			{ key: 'offsetY', label: 'Offset Y', kind: 'range', min: -0.2, max: 0.2, step: 0.001 }
		],
		create: function (engine) {
			const defaults = root.SynthRegistry.get('feedback').defaults;
			let trail = null;
			let srcW = 0;
			let srcH = 0;

			function num(value, fallback) {
				const n = Number(value);
				return isFinite(n) ? n : fallback;
			}

			function clear(fbo) {
				if (!fbo || typeof fbo.begin !== 'function') return;
				fbo.begin();
				try {
					background(0);
				} finally {
					fbo.end();
				}
			}

			function ensure(w, h) {
				w = Math.max(2, Math.floor(w));
				h = Math.max(2, Math.floor(h));
				if (trail && srcW === w && srcH === h) return;
				srcW = w;
				srcH = h;
				if (trail && trail.remove) trail.remove();
				trail = makeFbo(w, h);
				clear(trail);
			}

			return {
				process: function (ctx) {
					const p = ctx.parameters || {};
					ensure(ctx.width, ctx.height);
					engine.drawTo(ctx.output, engine.shaders.feedback, {
						u_input: ctx.input,
						u_feedback: trail,
						u_amount: num(p.amount, defaults.amount),
						u_decay: num(p.decay, defaults.decay),
						u_scale: num(p.scale, defaults.scale),
						u_rotate: num(p.rotate, defaults.rotate),
						u_offset: [
							num(p.offsetX, defaults.offsetX),
							num(p.offsetY, defaults.offsetY)
						]
					});
					engine.drawTo(trail, engine.shaders.copy, {
						u_input: ctx.output,
						u_gain: 1
					});
				},
				resize: function (w, h) {
					ensure(w, h);
				},
				dispose: function () {
					if (trail && trail.remove) trail.remove();
					trail = null;
					srcW = srcH = 0;
				}
			};
		}
	});
})(window);
