/** Vertex + fragment for the paired-metaball card background (WebGL2). */

export const VERT = `#version 300 es
layout(location = 0) in vec2 aPosition;
out vec2 vUV;

void main() {
	gl_Position = vec4(aPosition, 0.0, 1.0);
	vUV = aPosition * 0.5 + 0.5;
}
`;

export const FRAG = `#version 300 es
precision highp float;

uniform vec2  uResolution;
uniform float uTime;
uniform float uNumPairs;
uniform float uBigRadius;
uniform float uSmallRadius;
uniform float uOrbitRadius;
uniform float uMergeK;
uniform float uEdgeSoft;
uniform float uTravelAmt;
uniform float uPulseSpeed;
uniform float uRotSpeed;
uniform vec2  uTranslate;
uniform vec3  uColor;
uniform vec3  uBackground;

in vec2 vUV;
out vec4 fragColor;

float smin(float a, float b, float k) {
	float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
	return mix(b, a, h) - k * h * (1.0 - h);
}

float sdCircle(vec2 p, vec2 center, float radius) {
	return length(p - center) - radius;
}

vec2 rotate2d(vec2 p, float angle) {
	float c = cos(angle);
	float s = sin(angle);
	return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

const int STATIC_COUNT = 10;
const vec2 STATIC_POS[STATIC_COUNT] = vec2[](
	vec2(-0.48, -1.27),
	vec2( 0.48, -1.27),
	vec2(-1.28, -0.66),
	vec2( 1.28, -0.66),
	vec2(-0.48,  0.00),
	vec2( 0.48,  0.00),
	vec2(-1.28,  0.66),
	vec2( 1.28,  0.66),
	vec2(-0.48,  1.27),
	vec2( 0.48,  1.27)
);

const int CONN_COUNT = 9;
const int CONN_A[CONN_COUNT] = int[](0, 1, 2, 3, 4, 6, 7, 4, 5);
const int CONN_B[CONN_COUNT] = int[](2, 3, 4, 5, 5, 8, 9, 6, 7);

const float CONN_TRAVEL[CONN_COUNT] = float[](
	0.75,
	0.75,
	0.00,
	0.75,
	0.75,
	0.75,
	0.75,
	0.75,
	0.75
);

const float CONN_SPEED[CONN_COUNT] = float[](
	0.75,
	1.1,
	1.12,
	0.95,
	0.98,
	1.11,
	1.10,
	1.09,
	1.08
);

// Same sine path as before, with a short stall at each midpoint crossing.
float lingerCycle(float cycle) {
	float hold = 0.045;
	float span = 0.5 - hold;
	if (cycle < hold) return 0.0;
	if (cycle < 0.5) return ((cycle - hold) / span) * 0.5;
	if (cycle < 0.5 + hold) return 0.5;
	return 0.5 + ((cycle - 0.5 - hold) / span) * 0.5;
}

void main() {
	vec2 uv = vUV - 0.5;
	float aspect = uResolution.x / max(uResolution.y, 1.0);
	uv.x *= aspect;

	uv -= uTranslate;
	uv = rotate2d(uv, -uTime * uRotSpeed);

	float scale = uOrbitRadius;
	float field = 1e5;
	float dStatic[STATIC_COUNT];

	for (int i = 0; i < STATIC_COUNT; i++) {
		dStatic[i] = sdCircle(uv, STATIC_POS[i] * scale, uBigRadius);
		field = min(field, dStatic[i]);
	}

	int activeConns = CONN_COUNT;
	if (uNumPairs > 0.0 && uNumPairs < float(CONN_COUNT)) {
		activeConns = int(uNumPairs);
	}

	for (int i = 0; i < CONN_COUNT; i++) {
		if (i >= activeConns) break;

		int idxA = CONN_A[i];
		int idxB = CONN_B[i];
		float travel = clamp(uTravelAmt * CONN_TRAVEL[i], 0.0, 1.0);
		float phase = float(i) * (6.2831853 / float(CONN_COUNT));
		float pulseTime = uTime * uPulseSpeed * CONN_SPEED[i] + phase;
		float cycle = fract(pulseTime * 0.159154943);
		float pulseA = sin(lingerCycle(cycle) * 6.2831853);
		float pulseB = sin(lingerCycle(fract(cycle + 0.25)) * 6.2831853);
		float tA = 0.5 + 0.5 * pulseA * travel;
		float tB = 0.5 + 0.5 * pulseB * travel;

		vec2 movingPosA = mix(STATIC_POS[idxA], STATIC_POS[idxB], tA) * scale;
		vec2 movingPosB = mix(STATIC_POS[idxA], STATIC_POS[idxB], tB) * scale;
		float radiusPulseA = 1.0 + 0.06 * pulseA;
		float radiusPulseB = 0.92 + 0.06 * pulseB;
		float dMoveA = sdCircle(uv, movingPosA, uSmallRadius * radiusPulseA);
		float dMoveB = sdCircle(uv, movingPosB, uSmallRadius * radiusPulseB);
		float dTravelers = smin(dMoveA, dMoveB, uMergeK * 0.65);
		float fusedA = smin(dStatic[idxA], dTravelers, uMergeK);
		float fusedB = smin(dStatic[idxB], dTravelers, uMergeK);
		field = min(field, min(fusedA, fusedB));
	}

	float coverage = 1.0 - smoothstep(0.0, uEdgeSoft, field);
	float alpha = coverage;
	vec3 rgb = mix(uBackground, uColor, coverage);
	fragColor = vec4(rgb, alpha);
}
`;
