/** Vertex + fragment for the ordered metaball grid (WebGL2 port of the TD GLSL TOP). */

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
uniform float uGridScale;
uniform float uSeed;
uniform float uDensity;
uniform float uDotRadius;
uniform float uMergeK;
uniform float uMoveChance;
uniform float uMoveRadius;
uniform float uMoveDist;
uniform float uSpeed;
uniform vec3  uColor;
uniform vec4  uMargin;

in vec2 vUV;
out vec4 fragColor;

float hash21(vec2 p) {
	p = fract(p * vec2(123.34, 456.21) + uSeed);
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

float smin(float a, float b, float k) {
	float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
	return mix(b, a, h) - k * h * (1.0 - h);
}

bool insideMargin(vec2 id, float aspect) {
	vec2 cellCenter = (id + 0.5) / uGridScale;
	vec2 uv01 = vec2(cellCenter.x / max(aspect, 0.001) + 0.5, cellCenter.y + 0.5);

	float safeScale = max(uGridScale, 0.001);
	vec2 cellHalf = vec2(
		0.5 / (safeScale * max(aspect, 0.001)),
		0.5 / safeScale
	);
	return uv01.x + cellHalf.x >= uMargin.x
		&& uv01.x - cellHalf.x <= 1.0 - uMargin.y
		&& uv01.y + cellHalf.y >= uMargin.w
		&& uv01.y - cellHalf.y <= 1.0 - uMargin.z;
}

float orderedFillRank(vec2 id, float aspect) {
	vec2 cellCenter = (id + 0.5) / uGridScale;
	vec2 uv01 = vec2(cellCenter.x / max(aspect, 0.001) + 0.5, cellCenter.y + 0.5);

	vec2 rectMin = vec2(uMargin.x, uMargin.w);
	vec2 rectMax = vec2(1.0 - uMargin.y, 1.0 - uMargin.z);
	vec2 span = max(rectMax - rectMin, vec2(0.001));

	vec2 local = clamp((uv01 - rectMin) / span, 0.0, 1.0);
	return local.y * 0.999 + local.x * 0.001;
}

bool isStaticCell(vec2 id, float aspect) {
	if (!insideMargin(id, aspect)) return false;
	return orderedFillRank(id, aspect) < clamp(uDensity, 0.0, 1.0);
}

float travelToSeparation(vec2 origin, vec2 moveDir, vec2 obsPos, float separation) {
	vec2 delta = obsPos - origin;
	float along = dot(delta, moveDir);
	if (along <= 0.0) return 1e6;

	float perpSq = max(dot(delta, delta) - along * along, 0.0);
	float sepSq = separation * separation;
	if (perpSq >= sepSq) return 1e6;

	float chord = sqrt(sepSq - perpSq);
	return max(along - chord, 0.0);
}

void scanMoverObstacles(
	vec2 primaryRel,
	vec2 neighborId,
	vec2 cellId,
	vec2 moveDir,
	float aspect,
	float softSep,
	float hardSep,
	out float firstSoft,
	out float firstHard
) {
	firstSoft = 1e6;
	firstHard = 1e6;

	for (int y = -2; y <= 2; y++) {
		for (int x = -2; x <= 2; x++) {
			vec2 obsId = neighborId + vec2(float(x), float(y));
			if (!isStaticCell(obsId, aspect)) continue;
			if (all(equal(obsId, neighborId))) continue;

			vec2 obsPrimaryRel = obsId - cellId;
			firstSoft = min(firstSoft, travelToSeparation(primaryRel, moveDir, obsPrimaryRel, softSep));
			firstHard = min(firstHard, travelToSeparation(primaryRel, moveDir, obsPrimaryRel, hardSep));
		}
	}
}

bool tryMoverMagnetLimits(
	vec2 primaryRel,
	vec2 neighborId,
	vec2 cellId,
	vec2 moveDir,
	float aspect,
	out float nearSnap,
	out float farSnap
) {
	float mergeGap = max(uMergeK * 0.55, 0.025);
	float hardOwn = uDotRadius + uMoveRadius;
	float softOwn = hardOwn + mergeGap;
	float hardSep = uMoveRadius + uDotRadius;
	float softSep = hardSep + mergeGap;
	float minSpan = max(uMoveDist * 0.25, 0.04);

	float firstSoft;
	float firstHard;
	scanMoverObstacles(
		primaryRel, neighborId, cellId, moveDir, aspect,
		softSep, hardSep, firstSoft, firstHard
	);

	nearSnap = softOwn;
	if (nearSnap >= firstHard - 0.015) {
		return false;
	}

	if (firstSoft < 1e5) {
		farSnap = firstSoft;
	} else {
		farSnap = nearSnap + max(uMoveDist, 0.0);
	}
	farSnap = min(farSnap, firstHard - 0.02);

	if (farSnap < nearSnap + minSpan) {
		return false;
	}
	return true;
}

bool resolveMoverPath(
	vec2 primaryRel,
	vec2 neighborId,
	vec2 cellId,
	vec2 preferredDir,
	float aspect,
	out vec2 moveDir,
	out float nearSnap,
	out float farSnap
) {
	vec2 perp = vec2(-preferredDir.y, preferredDir.x);

	moveDir = preferredDir;
	if (tryMoverMagnetLimits(primaryRel, neighborId, cellId, moveDir, aspect, nearSnap, farSnap)) {
		return true;
	}

	moveDir = -preferredDir;
	if (tryMoverMagnetLimits(primaryRel, neighborId, cellId, moveDir, aspect, nearSnap, farSnap)) {
		return true;
	}

	moveDir = perp;
	if (tryMoverMagnetLimits(primaryRel, neighborId, cellId, moveDir, aspect, nearSnap, farSnap)) {
		return true;
	}

	moveDir = -perp;
	if (tryMoverMagnetLimits(primaryRel, neighborId, cellId, moveDir, aspect, nearSnap, farSnap)) {
		return true;
	}

	return false;
}

float magnetCycle(float cycle) {
	float goEnd = 0.34;
	float holdFarEnd = 0.50;
	float returnEnd = 0.84;

	if (cycle < goEnd) {
		float p = cycle / goEnd;
		p = 1.0 - (1.0 - p) * (1.0 - p);
		return p;
	}
	if (cycle < holdFarEnd) {
		return 1.0;
	}
	if (cycle < returnEnd) {
		float p = (cycle - holdFarEnd) / (returnEnd - holdFarEnd);
		p = 1.0 - (1.0 - p) * (1.0 - p);
		return 1.0 - p;
	}
	return 0.0;
}

vec2 preferredMoverDir(vec2 neighborId) {
	float axisRand = hash21(neighborId + 30.0);
	vec2 axis = axisRand < 0.5 ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
	float sgn = hash21(neighborId + 31.0) < 0.5 ? -1.0 : 1.0;
	return axis * sgn;
}

void main() {
	vec2 uv = vUV - 0.5;
	float aspect = uResolution.x / max(uResolution.y, 1.0);
	uv.x *= aspect;

	vec2 gridUV = uv * uGridScale;
	vec2 cellId = floor(gridUV);
	vec2 cellUv = fract(gridUV) - 0.5;

	float field = 1.0;

	for (int y = -1; y <= 1; y++) {
		for (int x = -1; x <= 1; x++) {
			vec2 neighborOffset = vec2(float(x), float(y));
			vec2 neighborId = cellId + neighborOffset;

			if (!isStaticCell(neighborId, aspect)) continue;

			vec2 dotPos = neighborOffset;
			float d = length(cellUv - dotPos) - uDotRadius;
			field = smin(field, d, uMergeK);

			float randMove = hash21(neighborId + 10.0);
			if (randMove < uMoveChance) {
				vec2 preferredDir = preferredMoverDir(neighborId);
				vec2 moveDir;
				float nearSnap;
				float farSnap;

				if (resolveMoverPath(
					dotPos, neighborId, cellId, preferredDir, aspect,
					moveDir, nearSnap, farSnap
				)) {
					float phase = hash21(neighborId + 20.0);
					float cycle = fract(uTime * uSpeed * 0.31831 + phase);
					float travel = mix(nearSnap, farSnap, magnetCycle(cycle));
					vec2 movePos = dotPos + moveDir * travel;

					float dMove = length(cellUv - movePos) - uMoveRadius;
					field = smin(field, dMove, uMergeK);
				}
			}
		}
	}

	float edgeSoft = 2.0 / max(uResolution.y, 1.0) * uGridScale;
	float alpha = 1.0 - smoothstep(0.0, edgeSoft, field);

	vec2 screenUv = vUV;
	float marginDistance = min(
		min(screenUv.x - uMargin.x, (1.0 - uMargin.y) - screenUv.x),
		min(screenUv.y - uMargin.w, (1.0 - uMargin.z) - screenUv.y)
	);
	float marginSoft = 1.5 / max(min(uResolution.x, uResolution.y), 1.0);
	alpha *= smoothstep(0.0, marginSoft, marginDistance);

	fragColor = vec4(uColor * alpha, alpha);
}
`;
