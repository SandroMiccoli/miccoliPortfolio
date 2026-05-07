/**
 * GLSL shaders for the hexagon chaos orchestration.
 *
 * The fragment shader samples the loaded Hexagon.png texture at a
 * displaced UV coordinate. The displacement is driven by procedural
 * noise (mode-dependent: liquid flow, curl turbulence, plasma, vortex,
 * etc.) and attenuated near the cursor — producing the chaos-to-order
 * transition.
 */

export const HEX_VERTEX_SHADER = /* glsl */ `
	varying vec2 vUv;

	void main() {
		vUv = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

export const HEX_FRAGMENT_SHADER = /* glsl */ `
	precision highp float;

	varying vec2 vUv;

	uniform float uTime;
	uniform vec2  uResolution;
	uniform vec2  uMouse;
	uniform float uMouseActive;

	// texture
	uniform sampler2D uTexture;
	uniform vec2  uTextureAspect;
	uniform float uTextureLoaded;
	uniform float uHexScale;

	// distortion
	uniform int   uMode;
	uniform float uDistortionStrength;
	uniform float uDistortionScale;
	uniform float uDistortionSpeed;
	uniform float uAnimationIntensity;
	uniform float uNoiseInfluence;
	uniform float uTurbulenceAmount;
	uniform float uDisplacementAmplitude;
	uniform float uDisplacementFrequency;

	// motion
	uniform float uFlowSpeedX;
	uniform float uFlowSpeedY;
	uniform float uOscillationSpeed;
	uniform float uOscillationAmplitude;
	uniform float uDriftAmount;
	uniform float uBreathingSpeed;

	// interaction
	uniform float uOrderRadius;
	uniform float uMouseInfluence;
	uniform float uInteractionFalloff;

	// visual
	uniform vec3  uBgColor;
	uniform vec3  uPrimaryColor;
	uniform vec3  uSecondaryColor;
	uniform float uGradientIntensity;
	uniform float uGlowAmount;
	uniform float uVignetteAmount;
	uniform float uContrast;
	uniform float uBrightness;
	uniform float uOpacity;
	uniform float uChromaticAberration;
	uniform float uEdgeSoftness;
	uniform float uBlurAmount;

	// debug
	uniform float uDebugView;

	// ─── Noise primitives ─────────────────────────────────────────────────
	vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
	vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
	vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

	float snoise(vec2 v) {
		const vec4 C = vec4(0.211324865405187,
							0.366025403784439,
						   -0.577350269189626,
							0.024390243902439);
		vec2 i  = floor(v + dot(v, C.yy));
		vec2 x0 = v - i + dot(i, C.xx);
		vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
		vec4 x12 = x0.xyxy + C.xxzz;
		x12.xy -= i1;
		i = mod289(i);
		vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
			+ i.x + vec3(0.0, i1.x, 1.0));
		vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
		m = m * m;
		m = m * m;
		vec3 x = 2.0 * fract(p * C.www) - 1.0;
		vec3 h = abs(x) - 0.5;
		vec3 ox = floor(x + 0.5);
		vec3 a0 = x - ox;
		m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
		vec3 g;
		g.x  = a0.x  * x0.x  + h.x  * x0.y;
		g.yz = a0.yz * x12.xz + h.yz * x12.yw;
		return 130.0 * dot(m, g);
	}

	float fbm(vec2 p) {
		float v = 0.0;
		float a = 0.5;
		for (int i = 0; i < 5; i++) {
			v += a * snoise(p);
			p *= 2.02;
			a *= 0.5;
		}
		return v;
	}

	// 2D curl of a scalar noise field — solenoidal (volume-preserving) flow.
	vec2 curlNoise(vec2 p) {
		float e = 0.012;
		float n1 = snoise(p + vec2(0.0,  e));
		float n2 = snoise(p + vec2(0.0, -e));
		float n3 = snoise(p + vec2( e, 0.0));
		float n4 = snoise(p + vec2(-e, 0.0));
		float dy = (n1 - n2) / (2.0 * e);
		float dx = (n3 - n4) / (2.0 * e);
		return vec2(dy, -dx);
	}

	// ─── Distortion modes ────────────────────────────────────────────────
	// Switch on uMode to compute a 2D displacement vector for the input point.
	vec2 distortion(vec2 p, float t) {
		float scale = uDistortionScale * uDisplacementFrequency;
		float speed = uDistortionSpeed;
		vec2 flow = vec2(uFlowSpeedX, uFlowSpeedY) * t * 0.05;
		vec2 d = vec2(0.0);

		if (uMode == 0) {
			// Liquid Flow — directional FBM flowing across the field.
			vec2 q = p * scale + flow;
			float n1 = fbm(q + vec2(t * 0.10 * speed, 0.0));
			float n2 = fbm(q + vec2(5.2, 1.3) + vec2(0.0, t * 0.13 * speed));
			d = vec2(n1, n2);
		} else if (uMode == 1) {
			// Magnetic Turbulence — solenoidal curl noise.
			d = curlNoise(p * scale + flow + t * 0.08 * speed);
		} else if (uMode == 2) {
			// Soft Wave — gentle orthogonal sine waves.
			float w1 = sin(p.y * scale * 3.0 + t * 0.6 * speed);
			float w2 = cos(p.x * scale * 3.0 + t * 0.5 * speed);
			d = vec2(w1, w2);
		} else if (uMode == 3) {
			// Orbital Drift — tangential motion modulated by radius.
			float angle = atan(p.y, p.x);
			float r = length(p);
			float spin = sin(r * scale * 2.0 + t * 0.4 * speed);
			d = vec2(-sin(angle), cos(angle)) * spin;
		} else if (uMode == 4) {
			// Field Noise — pure FBM displacement.
			d = vec2(
				fbm(p * scale + t * 0.10 * speed),
				fbm(p * scale + vec2(8.7, 2.3) + t * 0.10 * speed)
			);
		} else if (uMode == 5) {
			// Ribbon Distortion — quantized horizontal bands offset by noise.
			float row = floor(p.y * scale * 4.0);
			float n = snoise(vec2(row, t * 0.2 * speed));
			d = vec2(n, fbm(p * scale + t * 0.1 * speed) * 0.4);
		} else if (uMode == 6) {
			// Plasma Drift — layered sin/cos crossfields.
			float a = sin(p.x * scale * 2.0 + t * 0.50 * speed);
			float b = cos(p.y * scale * 2.0 + t * 0.40 * speed);
			float c = sin(length(p) * scale * 3.0 + t * 0.70 * speed);
			d = vec2(a + c, b + c) * 0.5;
		} else if (uMode == 7) {
			// Calm Refraction — layered sine + low-frequency curl.
			d  = vec2(
				sin(p.y * scale * 5.0 + t * 0.30 * speed),
				cos(p.x * scale * 5.0 + t * 0.30 * speed)
			) * 0.3;
			d += curlNoise(p * scale * 0.5 + t * 0.05 * speed) * 0.4;
		} else if (uMode == 8) {
			// Vortex Pull — spiral whose strength fades with radius.
			float r = length(p) + 1e-4;
			float angle = atan(p.y, p.x);
			float spiral = sin(angle * 3.0 + r * scale * 4.0 + t * 0.5 * speed);
			d = vec2(-sin(angle), cos(angle)) * spiral * (1.0 - smoothstep(0.0, 1.5, r));
		} else if (uMode == 9) {
			// Harmonic Oscillation — coupled sin/cos products.
			float h1 = sin(p.x * scale * 2.0 + t * 0.50 * speed) * cos(p.y * scale * 1.7 + t * 0.40 * speed);
			float h2 = cos(p.y * scale * 2.3 + t * 0.45 * speed) * sin(p.x * scale * 2.1 + t * 0.55 * speed);
			d = vec2(h1, h2);
		}

		// Baseline ambient turbulence + low-frequency noise field.
		vec2 turbulence = curlNoise(p * scale * 1.7 + t * 0.04 * speed) * uTurbulenceAmount;
		vec2 noiseField = vec2(
			fbm(p * scale * 0.7 + t * 0.05 * speed),
			fbm(p * scale * 0.7 + vec2(3.7, 9.1) + t * 0.05 * speed)
		) * uNoiseInfluence;

		d += turbulence + noiseField;
		return d * uDistortionStrength * uAnimationIntensity;
	}

	// ─── Mouse-driven calmness mask ──────────────────────────────────────
	// 0 → fully chaotic, 1 → fully resolved into the canonical hexagon.
	float calmness(vec2 p, vec2 mp) {
		float d = distance(p, mp);
		float c = 1.0 - smoothstep(0.0, max(uOrderRadius, 0.001), d);
		c = pow(c, max(uInteractionFalloff, 0.001));
		return c * uMouseInfluence * uMouseActive;
	}

	// ─── Texture sampling ────────────────────────────────────────────────
	// Maps a centered, aspect-corrected position pd to texture UV space.
	// The hexagon image fits inside a centered box whose half-height is
	// uHexScale, with its width derived from the texture's native aspect.
	vec2 hexUv(vec2 pd) {
		float texAspect = uTextureAspect.x / max(uTextureAspect.y, 1.0);
		vec2 uv = vec2(
			(pd.x / (uHexScale * texAspect)) * 0.5 + 0.5,
			(pd.y / uHexScale)               * 0.5 + 0.5
		);
		return uv;
	}

	// Sample texture. UV outside [0,1] must contribute zero — if we only clamp
	// UV to 0..1, CLAMP_TO_EDGE repeats the border texels and color “streaks”
	// in a cross to the viewport (same bug as sampling u<0 with edge clamp).
	vec4 sampleHex(vec2 uv) {
		vec2 outside = step(uv, vec2(0.0)) + step(vec2(1.0), uv);
		float inside = 1.0 - clamp(outside.x + outside.y, 0.0, 1.0);
		vec2 uvS = clamp(uv, vec2(0.0), vec2(1.0));
		return texture2D(uTexture, uvS) * inside;
	}

	void main() {
		// Aspect-corrected centered coordinates: y in [-1, 1], x in [-aspect, aspect].
		vec2 uv = vUv;
		vec2 p = (uv - 0.5) * 2.0;
		float aspect = uResolution.x / uResolution.y;
		p.x *= aspect;

		vec2 mp = (uMouse - 0.5) * 2.0;
		mp.x *= aspect;

		float t = uTime;

		// Slow breathing pulse — applied as a tiny scale around the center.
		float breathing = 1.0 + sin(t * uBreathingSpeed) * 0.025;

		float cMask = calmness(p, mp);

		// Distortion attenuates as the cursor approaches.
		vec2 d = distortion(p, t);
		d *= (1.0 - cMask);

		// Subtle global oscillation — keeps the form alive even at rest.
		vec2 osc = vec2(sin(t * uOscillationSpeed), cos(t * uOscillationSpeed * 1.1)) * uOscillationAmplitude;
		d += osc * (1.0 - cMask);

		// Continuous drift — slow ambient motion regardless of cursor.
		vec2 drift = vec2(sin(t * 0.13), cos(t * 0.11)) * uDriftAmount;
		d += drift;

		vec2 pd = (p / breathing) + d * uDisplacementAmplitude;
		// Keep sampling coordinates inside the texture: large displacementAmplitude
		// values otherwise push UVs outside [0,1] — sampleHex returns transparent
		// and the ring “vanishes” on aggressive presets.
		float texAspect = uTextureAspect.x / max(uTextureAspect.y, 1.0);
		vec2 pdHalf = vec2(uHexScale * texAspect, uHexScale);
		float uvPad = 0.02;
		vec2 pdLim = pdHalf * (1.0 - 2.0 * uvPad);
		pd = clamp(pd, -pdLim, pdLim);

		vec2 baseUv = hexUv(pd);

		// Sample the texture, with optional radial chromatic aberration.
		vec4 sampled;
		if (uChromaticAberration > 0.0001) {
			vec2 dir = pd;
			float dl = length(dir);
			dir = dl > 1e-4 ? dir / dl : vec2(1.0, 0.0);
			float ca = uChromaticAberration * 0.006;
			vec4 sR = sampleHex(baseUv + dir * ca);
			vec4 sG = sampleHex(baseUv);
			vec4 sB = sampleHex(baseUv - dir * ca);
			sampled = vec4(sR.r, sG.g, sB.b, max(max(sR.a, sG.a), sB.a));
		} else {
			sampled = sampleHex(baseUv);
		}

		// Optional micro-blur — averages 4 neighbours for an atmospheric feel.
		if (uBlurAmount > 0.001) {
			float k = uBlurAmount * 0.012;
			vec4 b1 = sampleHex(baseUv + vec2( k,  0.0));
			vec4 b2 = sampleHex(baseUv + vec2(-k,  0.0));
			vec4 b3 = sampleHex(baseUv + vec2( 0.0,  k));
			vec4 b4 = sampleHex(baseUv + vec2( 0.0, -k));
			sampled = (sampled + b1 + b2 + b3 + b4) / 5.0;
		}

		// Tint: optionally re-color the sampled hexagon using the GUI gradient.
		// gradientIntensity = 0 → original PNG colors, 1 → fully recolored.
		vec3 tint = mix(uPrimaryColor, uSecondaryColor, smoothstep(0.0, 1.0, vUv.y));
		float lum = dot(sampled.rgb, vec3(0.299, 0.587, 0.114));
		vec3 recolored = tint * (0.4 + lum * 1.4);
		vec3 hexColor = mix(sampled.rgb, recolored, clamp(uGradientIntensity, 0.0, 1.5));

		// Composite over background using the texture's own alpha.
		vec3 col = mix(uBgColor, hexColor, sampled.a);

		// Soft outer halo — additive based on alpha and a low-pass of the sample.
		if (uGlowAmount > 0.001) {
			float k = uEdgeSoftness * 1.5 + 0.005;
			vec4 hA = sampleHex(baseUv + vec2( k,  0.0));
			vec4 hB = sampleHex(baseUv + vec2(-k,  0.0));
			vec4 hC = sampleHex(baseUv + vec2( 0.0,  k));
			vec4 hD = sampleHex(baseUv + vec2( 0.0, -k));
			float halo = (hA.a + hB.a + hC.a + hD.a) * 0.25;
			vec3 haloCol = mix(sampled.rgb, tint, 0.5);
			col += haloCol * halo * uGlowAmount * 0.4 * (1.0 - sampled.a);
		}

		// Vignette — darkens far corners gently.
		float vig = smoothstep(1.6, 0.4, length(p));
		col = mix(col * (1.0 - uVignetteAmount * 0.5), col, vig);

		// Contrast / brightness trim.
		col = (col - 0.5) * uContrast + 0.5;
		col *= uBrightness;

		col = clamp(col, 0.0, 1.0);

		if (uDebugView > 0.5) {
			vec3 dbg = mix(vec3(0.96, 0.55, 0.55), vec3(0.55, 0.96, 0.65), cMask);
			col = mix(dbg, hexColor, sampled.a);
		}

		gl_FragColor = vec4(col, uOpacity);
	}
`;

/** Distortion modes ↔ shader uMode int. Keep in sync with the fragment shader. */
export const DISTORTION_MODES = [
	'Liquid Flow',
	'Magnetic Turbulence',
	'Soft Wave',
	'Orbital Drift',
	'Field Noise',
	'Ribbon Distortion',
	'Plasma Drift',
	'Calm Refraction',
	'Vortex Pull',
	'Harmonic Oscillation',
];

export function distortionModeIndex(name) {
	const idx = DISTORTION_MODES.indexOf(name);
	return idx < 0 ? 0 : idx;
}
