/**
 * Metaball grid background for morph-section__visual
 * Uniform defaults match the TouchDesigner Vectors screenshots.
 */

const VERT_SRC = `
attribute vec2 a_position;
void main() {
	gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const UNIFORMS = {
	uSeed: 3,
	uGridScale: 18.0,
	uDensity: 0.103,
	uMergeK: 0.23,
	uMoveChance: 0.75,
	uMoveRadius: 0.08,
	uMinDotDist: -0.603,
	uSpeed: 5.2,
	uDotRadius: 0.08,
	uMoveDist: 1.1,
	uMargin: [0.05, 0.07, 0.07, 0.037],
	// Black + orange clusters (replaces solid white uColor)
	uColorA: [0.165, 0.165, 0.165],
	uColorB: [0.91, 0.365, 0.016],
	uClusterScale: 5.5
};

function shaderUrl() {
	const path = window.location.pathname || '';
	if (path.includes('/experiments/gsap-svg-morph')) {
		return new URL('metaball-grid.frag', window.location.href).href;
	}
	return '/experiments/gsap-svg-morph/metaball-grid.frag';
}

function createShader(gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const info = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error(info || 'Shader compile failed');
	}
	return shader;
}

function createProgram(gl, vertSrc, fragSrc) {
	const vs = createShader(gl, gl.VERTEX_SHADER, vertSrc);
	const fs = createShader(gl, gl.FRAGMENT_SHADER, fragSrc);
	const program = gl.createProgram();
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		const info = gl.getProgramInfoLog(program);
		gl.deleteProgram(program);
		throw new Error(info || 'Program link failed');
	}
	return program;
}

function getLocations(gl, program, names) {
	const out = {};
	names.forEach((name) => {
		out[name] = gl.getUniformLocation(program, name);
	});
	return out;
}

export async function initMetaballBackground(canvas) {
	if (!canvas) return null;

	const gl = canvas.getContext('webgl', {
		alpha: true,
		premultipliedAlpha: true,
		antialias: true
	});

	if (!gl) {
		console.warn('WebGL unavailable — metaball background skipped');
		return null;
	}

	const fragSrc = await fetch(shaderUrl()).then((res) => {
		if (!res.ok) throw new Error(`Failed to load shader (${res.status})`);
		return res.text();
	});

	const program = createProgram(gl, VERT_SRC, fragSrc);
	gl.useProgram(program);

	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
		gl.STATIC_DRAW
	);

	const aPosition = gl.getAttribLocation(program, 'a_position');
	gl.enableVertexAttribArray(aPosition);
	gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

	const locs = getLocations(gl, program, [
		'uResolution',
		'uTime',
		'uGridScale',
		'uSeed',
		'uDensity',
		'uDotRadius',
		'uMinDotDist',
		'uMergeK',
		'uMoveChance',
		'uMoveRadius',
		'uMoveDist',
		'uSpeed',
		'uMargin',
		'uColorA',
		'uColorB',
		'uClusterScale'
	]);

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	gl.clearColor(0, 0, 0, 0);

	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	let shaderTime = 0;
	let motionScale = 0;
	let lastNow = performance.now();
	let raf = 0;
	let running = true;

	function resize() {
		const rect = canvas.getBoundingClientRect();
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const w = Math.max(1, Math.round(rect.width * dpr));
		const h = Math.max(1, Math.round(rect.height * dpr));
		if (canvas.width !== w || canvas.height !== h) {
			canvas.width = w;
			canvas.height = h;
		}
		gl.viewport(0, 0, canvas.width, canvas.height);
	}

	function setStaticUniforms() {
		gl.uniform1f(locs.uSeed, UNIFORMS.uSeed);
		gl.uniform1f(locs.uGridScale, UNIFORMS.uGridScale);
		gl.uniform1f(locs.uDensity, UNIFORMS.uDensity);
		gl.uniform1f(locs.uDotRadius, UNIFORMS.uDotRadius);
		gl.uniform1f(locs.uMinDotDist, UNIFORMS.uMinDotDist);
		gl.uniform1f(locs.uMergeK, UNIFORMS.uMergeK);
		gl.uniform1f(locs.uMoveChance, UNIFORMS.uMoveChance);
		gl.uniform1f(locs.uMoveRadius, UNIFORMS.uMoveRadius);
		gl.uniform1f(locs.uMoveDist, UNIFORMS.uMoveDist);
		gl.uniform1f(locs.uSpeed, reducedMotion ? 0 : UNIFORMS.uSpeed);
		gl.uniform4f(locs.uMargin, ...UNIFORMS.uMargin);
		gl.uniform3f(locs.uColorA, ...UNIFORMS.uColorA);
		gl.uniform3f(locs.uColorB, ...UNIFORMS.uColorB);
		gl.uniform1f(locs.uClusterScale, UNIFORMS.uClusterScale);
	}

	function render(now) {
		if (!running) return;
		resize();
		gl.clear(gl.COLOR_BUFFER_BIT);

		const dt = Math.min(0.05, (now - lastNow) * 0.001);
		lastNow = now;

		// Only advance shader time while motion is engaged (during SVG morphs)
		if (!reducedMotion && motionScale > 0) {
			shaderTime += dt * motionScale;
		}

		gl.uniform1f(locs.uTime, shaderTime);
		gl.uniform2f(locs.uResolution, canvas.width, canvas.height);
		setStaticUniforms();
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

		raf = requestAnimationFrame(render);
	}

	const ro = typeof ResizeObserver !== 'undefined'
		? new ResizeObserver(() => resize())
		: null;
	if (ro) ro.observe(canvas);
	window.addEventListener('resize', resize);

	setStaticUniforms();
	raf = requestAnimationFrame(render);

	return {
		/** 0 = frozen dots, 1 = normal travel speed, >1 = faster */
		setMotionScale(value) {
			motionScale = Math.max(0, value);
		},
		getMotionScale() {
			return motionScale;
		},
		destroy() {
			running = false;
			cancelAnimationFrame(raf);
			if (ro) ro.disconnect();
			window.removeEventListener('resize', resize);
		}
	};
}
