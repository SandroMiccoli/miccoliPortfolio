(function (root) {
	const BLEND = { normal: 0, add: 1, multiply: 2, screen: 3 };

	let shaders = {};
	let dummyTex = null;

	function isWebGL2() {
		return typeof WebGL2RenderingContext !== 'undefined' &&
			drawingContext instanceof WebGL2RenderingContext;
	}

	function compile(vertSrc, fragSrc) {
		if (!isWebGL2()) {
			return createShader(
				'precision mediump float;\n' + vertSrc,
				'precision mediump float;\n' + fragSrc
			);
		}

		const vert = [
			'#version 300 es',
			'#define attribute in',
			'#define varying out',
			'precision mediump float;',
			vertSrc
		].join('\n');

		const frag = [
			'#version 300 es',
			'precision mediump float;',
			'#define varying in',
			'#define texture2D texture',
			'#define gl_FragColor outColor',
			'out vec4 outColor;',
			fragSrc
		].join('\n');

		return createShader(vert, frag);
	}

	function setCameraUniforms(sh, state) {
		const live = state.camera.enabled && root.SynthCamera.ready();
		const tex = live ? root.SynthCamera.texture() : dummyTex;
		sh.setUniform('u_camera', tex);
		sh.setUniform('u_cameraEnabled', live ? 1.0 : 0.0);
		sh.setUniform('u_camOpacity', state.camera.opacity);
		sh.setUniform('u_camIntensity', state.camera.intensity);
		sh.setUniform('u_blendMode', BLEND[state.camera.blendMode] || 0);
	}

	root.SynthEngine = {
		init: function () {
			shaders.waves = compile(SYNTH_SHADERS.vert, SYNTH_SHADERS.waves);
			shaders.noise = compile(SYNTH_SHADERS.vert, SYNTH_SHADERS.noise);
			shaders.shader = compile(SYNTH_SHADERS.vert, SYNTH_SHADERS.psychedelic);

			dummyTex = createGraphics(2, 2);
			dummyTex.pixelDensity(1);
			dummyTex.background(0);
		},

		draw: function (state, time) {
			ortho();
			const name = shaders[state.generator] ? state.generator : 'waves';
			const sh = shaders[name];
			shader(sh);
			sh.setUniform('u_resolution', [width, height]);
			sh.setUniform('u_time', time);
			setCameraUniforms(sh, state);

			if (name === 'waves') {
				sh.setUniform('u_frequency', state.waves.frequency);
				sh.setUniform('u_amplitude', state.waves.amplitude);
				sh.setUniform('u_speed', state.waves.speed);
				sh.setUniform('u_direction', state.waves.direction);
				sh.setUniform('u_scale', state.waves.scale);
			} else if (name === 'noise') {
				sh.setUniform('u_scale', state.noise.scale);
				sh.setUniform('u_speed', state.noise.speed);
				sh.setUniform('u_intensity', state.noise.intensity);
				sh.setUniform('u_hue', state.noise.hue);
				sh.setUniform('u_mode', state.noise.mode === 'color' ? 1.0 : 0.0);
			} else {
				sh.setUniform('u_speed', state.shader.speed);
				sh.setUniform('u_scale', state.shader.scale);
				sh.setUniform('u_distortion', state.shader.distortion);
				sh.setUniform('u_intensity', state.shader.intensity);
				sh.setUniform('u_hue', state.shader.hue);
			}

			noStroke();
			rectMode(CORNER);
			rect(-width / 2, -height / 2, width, height);
		}
	};
})(window);
