/**
 * One WebGL2 water-ripple surface bound to a single canvas.
 * Shared `params` are read every frame so the GUI drives every instance.
 */

export const VERT = `
	attribute vec2 a_position;
	varying vec2 v_texCoord;

	void main() {
		gl_Position = vec4(a_position, 0.0, 1.0);
		v_texCoord = (a_position + 1.0) * 0.5;
	}
`;

export const SIM_FRAG = `
	precision highp float;

	uniform sampler2D u_texture;
	uniform vec2 u_resolution;
	uniform int u_frame;
	uniform vec3 u_mouse;
	uniform float u_waveSpeed;
	uniform float u_springStrength;
	uniform float u_velocityDamping;
	uniform float u_pressureDamping;
	uniform float u_rippleSize;
	uniform float u_rippleStrength;

	varying vec2 v_texCoord;

	void main() {
		if (u_frame == 0) {
			gl_FragColor = vec4(0.0);
			return;
		}

		vec2 fragCoord = v_texCoord * u_resolution;
		float delta = u_waveSpeed;

		float pressure = texture2D(u_texture, v_texCoord).x;
		float pVel = texture2D(u_texture, v_texCoord).y;

		vec2 onePixel = 1.0 / u_resolution;

		float p_right = texture2D(u_texture, v_texCoord + vec2(onePixel.x, 0.0)).x;
		float p_left = texture2D(u_texture, v_texCoord - vec2(onePixel.x, 0.0)).x;
		float p_up = texture2D(u_texture, v_texCoord + vec2(0.0, onePixel.y)).x;
		float p_down = texture2D(u_texture, v_texCoord - vec2(0.0, onePixel.y)).x;

		if (fragCoord.x <= 0.5) p_left = p_right;
		if (fragCoord.x >= u_resolution.x - 0.5) p_right = p_left;
		if (fragCoord.y <= 0.5) p_down = p_up;
		if (fragCoord.y >= u_resolution.y - 0.5) p_up = p_down;

		pVel += delta * (-2.0 * pressure + p_right + p_left) / 4.0;
		pVel += delta * (-2.0 * pressure + p_up + p_down) / 4.0;
		pressure += delta * pVel;
		pVel -= u_springStrength * delta * pressure;
		pVel *= 1.0 - u_velocityDamping * delta;
		pressure *= u_pressureDamping;

		float gradX = (p_right - p_left) / 2.0;
		float gradY = (p_up - p_down) / 2.0;

		gl_FragColor = vec4(pressure, pVel, gradX, gradY);

		if (u_mouse.z > 0.5) {
			float dist = distance(fragCoord, u_mouse.xy);
			if (dist <= u_rippleSize) {
				gl_FragColor.x += u_rippleStrength * (1.0 - dist / u_rippleSize);
			}
		}
	}
`;

export const DISPLAY_FRAG = `
	precision highp float;

	uniform sampler2D u_waterTexture;
	uniform sampler2D u_imageTexture;
	uniform vec2 u_resolution;
	uniform vec2 u_imageSize;
	uniform float u_distortionStrength;
	uniform float u_chromaticAberrationStrength;
	uniform float u_chromaticAberrationDispersal;
	uniform float u_fitMode;
	uniform vec3 u_letterbox;

	varying vec2 v_texCoord;

	vec2 fitUv(vec2 uv, vec2 canvas, vec2 image) {
		vec2 canvasSize = max(canvas, vec2(1.0));
		vec2 imageSize = max(image, vec2(1.0));
		// cover: uniform scale until the canvas is filled, then crop overflow
		// contain: uniform scale until the image fits, then letterbox leftover
		float s = u_fitMode > 0.5
			? max(canvasSize.x / imageSize.x, canvasSize.y / imageSize.y)
			: min(canvasSize.x / imageSize.x, canvasSize.y / imageSize.y);
		vec2 drawn = imageSize * s;
		vec2 offset = (drawn - canvasSize) * 0.5;
		return (uv * canvasSize + offset) / drawn;
	}

	float inside01(vec2 uv) {
		vec2 inside = step(vec2(0.0), uv) * step(uv, vec2(1.0));
		return inside.x * inside.y;
	}

	vec4 sampleImage(vec2 uv) {
		vec2 clamped = clamp(uv, 0.0, 1.0);
		vec3 rgb = texture2D(u_imageTexture, clamped).rgb;
		if (u_fitMode > 0.5) {
			return vec4(rgb, 1.0);
		}
		float inside = inside01(uv);
		return vec4(mix(u_letterbox, rgb, inside), inside);
	}

	void main() {
		vec4 waterData = texture2D(u_waterTexture, v_texCoord);
		vec2 flipped = vec2(v_texCoord.x, 1.0 - v_texCoord.y);
		vec2 fixedTexCoord = fitUv(flipped, u_resolution, u_imageSize);

		if (u_fitMode < 0.5 && inside01(fixedTexCoord) < 0.5) {
			gl_FragColor = vec4(u_letterbox, 1.0);
			return;
		}

		vec2 distortion = u_distortionStrength * waterData.zw;
		vec3 color = vec3(0.0);

		if (u_chromaticAberrationStrength > 0.0) {
			vec2 center = vec2(0.5, 0.5);
			vec2 offset = fixedTexCoord - center;
			float distanceFromCenter = length(offset);
			float aberrationAmount = u_chromaticAberrationStrength * u_chromaticAberrationDispersal;
			float waterContribution = length(distortion) * u_chromaticAberrationStrength * 0.5;
			float radialContribution = distanceFromCenter * aberrationAmount;
			float totalAberration = waterContribution + radialContribution;
			vec2 radialDirection = normalize(offset + vec2(0.001, 0.001));

			color.r = sampleImage(fixedTexCoord + distortion - radialDirection * totalAberration).r;
			color.g = sampleImage(fixedTexCoord + distortion).g;
			color.b = sampleImage(fixedTexCoord + distortion + radialDirection * totalAberration).b;

			if (totalAberration > 0.001) {
				color.r = mix(color.r, sampleImage(fixedTexCoord + distortion - radialDirection * totalAberration * 1.5).r, 0.3);
				color.b = mix(color.b, sampleImage(fixedTexCoord + distortion + radialDirection * totalAberration * 1.5).b, 0.3);
			}
			color = clamp(color, 0.0, 1.0);
		} else {
			color = sampleImage(fixedTexCoord + distortion).rgb;
		}

		vec3 normal = normalize(vec3(-waterData.z, 0.2, -waterData.w));
		vec3 lightDir = normalize(vec3(-3.0, 10.0, 3.0));
		float glint = pow(max(0.0, dot(normal, lightDir)), 60.0);
		gl_FragColor = vec4(color + glint * vec3(1.0, 0.95, 0.9), 1.0);
	}
`;

function createShader(gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const log = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error(log || 'Shader compile failed');
	}
	return shader;
}

function createProgram(gl, vsSource, fsSource) {
	const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
	const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
	const program = gl.createProgram();
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	gl.bindAttribLocation(program, 0, 'a_position');
	gl.linkProgram(program);
	gl.deleteShader(vs);
	gl.deleteShader(fs);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		const log = gl.getProgramInfoLog(program);
		gl.deleteProgram(program);
		throw new Error(log || 'Program link failed');
	}
	return program;
}

export async function decodeToBitmap(source) {
	let blobOrFile = source;
	if (typeof source === 'string') {
		try {
			const res = await fetch(source);
			if (!res.ok) throw new Error('fetch failed');
			blobOrFile = await res.blob();
		} catch (err) {
			return loadHtmlImage(source);
		}
	}

	if (typeof createImageBitmap === 'function') {
		try {
			return await createImageBitmap(blobOrFile, {
				imageOrientation: 'from-image',
				premultiplyAlpha: 'none',
			});
		} catch (err) {
			try {
				return await createImageBitmap(blobOrFile);
			} catch (err2) {
				// fall through
			}
		}
	}

	if (typeof blobOrFile === 'string') return loadHtmlImage(blobOrFile);
	const url = URL.createObjectURL(blobOrFile);
	try {
		return await loadHtmlImage(url);
	} finally {
		URL.revokeObjectURL(url);
	}
}

async function loadHtmlImage(url) {
	const img = new Image();
	await new Promise((resolve, reject) => {
		img.onload = () => resolve();
		img.onerror = () => reject(new Error('Failed to load image'));
		img.src = url;
	});
	if (img.decode) await img.decode();
	return img;
}

export class RippleSurface {
	constructor(canvas, options = {}) {
		this.canvas = canvas;
		this.params = options.params;
		this.fit = options.fit === 'contain' ? 'contain' : 'cover';
		this.interact = options.interact === 'hover' ? 'hover' : 'click';
		this.letterbox = options.letterbox || [0.047, 0.071, 0.086];
		this.cap = options.cap || 1280;
		this.enabled = false;
		this.mouse = { x: 0, y: 0, down: 0 };
		this.imageSize = { x: 1, y: 1 };
		this.frame = 0;
		this.ping = null;
		this.pong = null;
		this.simW = 1;
		this.simH = 1;
		this.ok = false;

		const gl = canvas.getContext('webgl2', {
			alpha: false,
			antialias: false,
			premultipliedAlpha: false,
			preserveDrawingBuffer: false,
		});
		if (!gl || !gl.getExtension('EXT_color_buffer_float')) return;
		gl.getExtension('OES_texture_float_linear');
		this.gl = gl;

		this.simProgram = createProgram(gl, VERT, SIM_FRAG);
		this.displayProgram = createProgram(gl, VERT, DISPLAY_FRAG);
		this.simUniforms = {
			u_texture: gl.getUniformLocation(this.simProgram, 'u_texture'),
			u_resolution: gl.getUniformLocation(this.simProgram, 'u_resolution'),
			u_frame: gl.getUniformLocation(this.simProgram, 'u_frame'),
			u_mouse: gl.getUniformLocation(this.simProgram, 'u_mouse'),
			u_waveSpeed: gl.getUniformLocation(this.simProgram, 'u_waveSpeed'),
			u_springStrength: gl.getUniformLocation(this.simProgram, 'u_springStrength'),
			u_velocityDamping: gl.getUniformLocation(this.simProgram, 'u_velocityDamping'),
			u_pressureDamping: gl.getUniformLocation(this.simProgram, 'u_pressureDamping'),
			u_rippleSize: gl.getUniformLocation(this.simProgram, 'u_rippleSize'),
			u_rippleStrength: gl.getUniformLocation(this.simProgram, 'u_rippleStrength'),
		};
		this.displayUniforms = {
			u_waterTexture: gl.getUniformLocation(this.displayProgram, 'u_waterTexture'),
			u_imageTexture: gl.getUniformLocation(this.displayProgram, 'u_imageTexture'),
			u_resolution: gl.getUniformLocation(this.displayProgram, 'u_resolution'),
			u_imageSize: gl.getUniformLocation(this.displayProgram, 'u_imageSize'),
			u_distortionStrength: gl.getUniformLocation(this.displayProgram, 'u_distortionStrength'),
			u_chromaticAberrationStrength: gl.getUniformLocation(this.displayProgram, 'u_chromaticAberrationStrength'),
			u_chromaticAberrationDispersal: gl.getUniformLocation(this.displayProgram, 'u_chromaticAberrationDispersal'),
			u_fitMode: gl.getUniformLocation(this.displayProgram, 'u_fitMode'),
			u_letterbox: gl.getUniformLocation(this.displayProgram, 'u_letterbox'),
		};

		this.quad = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

		this.imageTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([12, 18, 22, 255]));

		this.onPointerDown = this.onPointerDown.bind(this);
		this.onPointerMove = this.onPointerMove.bind(this);
		this.onPointerUp = this.onPointerUp.bind(this);
		this.onPointerEnter = this.onPointerEnter.bind(this);
		canvas.addEventListener('pointerdown', this.onPointerDown);
		canvas.addEventListener('pointermove', this.onPointerMove);
		canvas.addEventListener('pointerup', this.onPointerUp);
		canvas.addEventListener('pointercancel', this.onPointerUp);
		canvas.addEventListener('pointerleave', this.onPointerUp);
		canvas.addEventListener('pointerenter', this.onPointerEnter);

		this.ok = true;
	}

	setFit(fit) {
		this.fit = fit === 'contain' ? 'contain' : 'cover';
	}

	setEnabled(enabled) {
		this.enabled = Boolean(enabled) && this.ok;
		if (!this.enabled) this.mouse.down = 0;
	}

	resetRipples() {
		this.frame = 0;
	}

	invalidateSim() {
		this.destroyTargets();
		this.ping = null;
		this.pong = null;
	}

	async setImage(source) {
		if (!this.ok) return;
		const bitmap = await decodeToBitmap(source);
		this.uploadImage(bitmap);
		if (bitmap && typeof bitmap.close === 'function') bitmap.close();
	}

	uploadImage(img) {
		const gl = this.gl;
		const width = img.naturalWidth || img.width;
		const height = img.naturalHeight || img.height;
		if (!width || !height) return;
		this.imageSize.x = width;
		this.imageSize.y = height;
		gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
		gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		try {
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, img);
		} catch (err) {
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		}
	}

	tick() {
		if (!this.enabled || !this.ok) return;
		this.resize();
		if (!this.ping || !this.pong) return;
		this.render();
	}

	resize() {
		const canvas = this.canvas;
		const cssW = Math.max(1, canvas.clientWidth);
		const cssH = Math.max(1, canvas.clientHeight);
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const displayW = Math.max(1, Math.round(cssW * dpr));
		const displayH = Math.max(1, Math.round(cssH * dpr));
		if (canvas.width !== displayW || canvas.height !== displayH) {
			canvas.width = displayW;
			canvas.height = displayH;
		}

		const [nextW, nextH] = this.simSize(cssW, cssH);
		if (!this.ping || !this.pong || nextW !== this.simW || nextH !== this.simH) {
			this.destroyTargets();
			this.simW = nextW;
			this.simH = nextH;
			this.ping = this.createFloatTarget(this.simW, this.simH);
			this.pong = this.createFloatTarget(this.simW, this.simH);
			this.frame = 0;
		}
	}

	simSize(cssW, cssH) {
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const scale = this.params.simScale;
		let w = Math.max(1, Math.round(cssW * dpr * scale));
		let h = Math.max(1, Math.round(cssH * dpr * scale));
		const longest = Math.max(w, h);
		if (longest > this.cap) {
			const s = this.cap / longest;
			w = Math.max(1, Math.round(w * s));
			h = Math.max(1, Math.round(h * s));
		}
		return [w, h];
	}

	createFloatTarget(width, height) {
		const gl = this.gl;
		return (
			this.tryFloatTarget(width, height, gl.RGBA16F, gl.HALF_FLOAT) ||
			this.tryFloatTarget(width, height, gl.RGBA16F, gl.FLOAT) ||
			this.tryFloatTarget(width, height, gl.RGBA32F, gl.FLOAT)
		);
	}

	tryFloatTarget(width, height, internalFormat, type) {
		const gl = this.gl;
		const tex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, gl.RGBA, type, null);
		const fbo = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
		const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		if (!ok) {
			gl.deleteFramebuffer(fbo);
			gl.deleteTexture(tex);
			return null;
		}
		return { tex, fbo, width, height };
	}

	destroyTargets() {
		const gl = this.gl;
		for (const target of [this.ping, this.pong]) {
			if (!target) continue;
			gl.deleteFramebuffer(target.fbo);
			gl.deleteTexture(target.tex);
		}
		this.ping = null;
		this.pong = null;
	}

	bindQuad(program) {
		const gl = this.gl;
		gl.useProgram(program);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
	}

	render() {
		const gl = this.gl;
		const p = this.params;
		gl.disable(gl.DEPTH_TEST);
		gl.disable(gl.BLEND);

		gl.viewport(0, 0, this.simW, this.simH);
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.pong.fbo);
		this.bindQuad(this.simProgram);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.ping.tex);
		gl.uniform1i(this.simUniforms.u_texture, 0);
		gl.uniform2f(this.simUniforms.u_resolution, this.simW, this.simH);
		gl.uniform1i(this.simUniforms.u_frame, this.frame);
		gl.uniform3f(this.simUniforms.u_mouse, this.mouse.x, this.mouse.y, this.mouse.down);
		gl.uniform1f(this.simUniforms.u_waveSpeed, p.waveSpeed);
		gl.uniform1f(this.simUniforms.u_springStrength, p.springStrength);
		gl.uniform1f(this.simUniforms.u_velocityDamping, p.velocityDamping);
		gl.uniform1f(this.simUniforms.u_pressureDamping, p.pressureDamping);
		gl.uniform1f(this.simUniforms.u_rippleSize, p.rippleSize);
		gl.uniform1f(this.simUniforms.u_rippleStrength, p.rippleStrength);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

		const swap = this.ping;
		this.ping = this.pong;
		this.pong = swap;
		this.frame += 1;
		if (this.interact === 'hover') this.mouse.down = 0;

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		this.bindQuad(this.displayProgram);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.ping.tex);
		gl.uniform1i(this.displayUniforms.u_waterTexture, 0);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
		gl.uniform1i(this.displayUniforms.u_imageTexture, 1);
		gl.uniform2f(this.displayUniforms.u_resolution, this.canvas.width, this.canvas.height);
		gl.uniform2f(this.displayUniforms.u_imageSize, this.imageSize.x, this.imageSize.y);
		gl.uniform1f(this.displayUniforms.u_distortionStrength, p.distortionStrength);
		gl.uniform1f(this.displayUniforms.u_chromaticAberrationStrength, p.chromaticAberrationStrength);
		gl.uniform1f(this.displayUniforms.u_chromaticAberrationDispersal, p.chromaticAberrationDispersal);
		gl.uniform1f(this.displayUniforms.u_fitMode, this.fit === 'cover' ? 1 : 0);
		gl.uniform3f(this.displayUniforms.u_letterbox, this.letterbox[0], this.letterbox[1], this.letterbox[2]);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}

	pointerToSim(event) {
		const rect = this.canvas.getBoundingClientRect();
		this.mouse.x = ((event.clientX - rect.left) / rect.width) * this.simW;
		this.mouse.y = (1 - (event.clientY - rect.top) / rect.height) * this.simH;
	}

	onPointerEnter(event) {
		if (!this.enabled || this.interact !== 'hover') return;
		this.pointerToSim(event);
		this.mouse.down = 1;
	}

	onPointerDown(event) {
		if (!this.enabled) return;
		if (this.interact === 'hover') {
			this.pointerToSim(event);
			this.mouse.down = 1;
			return;
		}
		if (event.button !== undefined && event.button !== 0) return;
		event.preventDefault();
		this.canvas.setPointerCapture(event.pointerId);
		this.pointerToSim(event);
		this.mouse.down = 1;
		if (this.params.onInteract) this.params.onInteract();
	}

	onPointerMove(event) {
		if (!this.enabled) return;
		if (this.interact === 'hover') {
			this.pointerToSim(event);
			this.mouse.down = 1;
			return;
		}
		if (!this.mouse.down) return;
		this.pointerToSim(event);
	}

	onPointerUp(event) {
		if (!this.mouse.down && this.interact !== 'hover') return;
		if (event && event.clientX !== undefined) this.pointerToSim(event);
		this.mouse.down = 0;
	}
}
