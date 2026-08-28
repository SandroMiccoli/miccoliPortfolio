/** Vertex + fragment for the procedural metaball grid overlay (WebGL2). */

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
uniform float uMinDotDist;
uniform float uMergeK;
uniform float uMoveChance;
uniform float uMoveRadius;
uniform float uMoveDist;
uniform float uSpeed;
uniform float uFaceInside;
uniform float uDebugFaceArea;
uniform vec3  uColor;
uniform vec4  uMargin;
uniform vec2  uFaceAreaPos;
uniform vec2  uFaceAreaScale;

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

float borderFillOrder(vec2 id, float aspect) {
	vec2 cellCenter = (id + 0.5) / uGridScale;
	vec2 uv01 = vec2(cellCenter.x / max(aspect, 0.001) + 0.5, cellCenter.y + 0.5);

	vec2 rectMin = vec2(uMargin.x, uMargin.w);
	vec2 rectMax = vec2(1.0 - uMargin.y, 1.0 - uMargin.z);
	vec2 halfSize = max((rectMax - rectMin) * 0.5, vec2(0.001));

	vec2 edgeDepth = min(uv01 - rectMin, rectMax - uv01) / halfSize;
	float borderDepth = clamp(min(edgeDepth.x, edgeDepth.y), 0.0, 1.0);

	float randomRank = hash21(id + 17.0);
	float perimeterWeight = mix(0.68, 1.0, borderDepth);
	return randomRank * perimeterWeight;
}

bool primarySpawn(vec2 id, float aspect) {
	return borderFillOrder(id, aspect) < clamp(uDensity, 0.0, 1.0);
}

float groupStyle(vec2 id) {
	return hash21(id + 55.0);
}

vec2 looseBuddyDir(vec2 id) {
	float a = hash21(id + 50.0);
	if (a < 0.25) return vec2(1.0, 0.0);
	if (a < 0.50) return vec2(-1.0, 0.0);
	if (a < 0.75) return vec2(0.0, 1.0);
	return vec2(0.0, -1.0);
}

vec2 companionDir(vec2 id, float salt) {
	float a = hash21(id + salt);
	vec2 axis = a < 0.5 ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
	float sgn = hash21(id + salt + 3.0) < 0.5 ? -1.0 : 1.0;
	return axis * sgn;
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

vec2 faceCenterWorld(float aspect) {
	return (uFaceAreaPos - 0.5) * vec2(aspect, 1.0);
}

vec2 faceHalfWorld(float aspect) {
	return max(uFaceAreaScale * 0.5 * vec2(aspect, 1.0), vec2(0.001));
}

bool cellInFaceArea(vec2 id, float aspect) {
	float safeScale = max(uGridScale, 0.001);
	vec2 cellCenter = (id + 0.5) / safeScale;
	vec2 cellHalf = vec2(0.5 / safeScale);
	vec2 faCenter = faceCenterWorld(aspect);
	vec2 faHalf = faceHalfWorld(aspect);
	vec2 delta = abs(cellCenter - faCenter);
	return delta.x <= faHalf.x + cellHalf.x
		&& delta.y <= faHalf.y + cellHalf.y;
}

bool faceAreaAllowsCell(vec2 id, float aspect) {
	if (!cellInFaceArea(id, aspect)) return true;
	return hash21(id + 41.0) < clamp(uFaceInside, 0.0, 1.0);
}

bool isActiveCell(vec2 id, float aspect) {
	if (!insideMargin(id, aspect)) return false;
	if (!faceAreaAllowsCell(id, aspect)) return false;
	if (primarySpawn(id, aspect)) return true;

	for (int y = -1; y <= 1; y++) {
		for (int x = -1; x <= 1; x++) {
			if (abs(x) + abs(y) != 1) continue;
			vec2 n = id - vec2(float(x), float(y));
			if (!insideMargin(n, aspect)) continue;
			if (!faceAreaAllowsCell(n, aspect)) continue;
			if (!primarySpawn(n, aspect)) continue;
			if (groupStyle(n) < 0.5) continue;
			if (all(equal(n + looseBuddyDir(n), id))) return true;
		}
	}
	return false;
}

vec2 companionOffset(vec2 id, float salt, float extraMin, float extraMax) {
	vec2 dir = companionDir(id, salt);
	float lo = uMinDotDist + extraMin;
	float hi = max(uMinDotDist + extraMax, lo);
	float spacing = mix(lo, hi, hash21(id + salt + 1.0));
	return dir * spacing;
}

float addCompanion(float field, vec2 cellUv, vec2 origin, vec2 id, float salt, float extraMin, float extraMax) {
	vec2 pos = origin + companionOffset(id, salt, extraMin, extraMax);
	float d = length(cellUv - pos) - uDotRadius;
	return smin(field, d, uMergeK);
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

vec2 moverDirAwayFromFace(vec2 neighborId, float aspect) {
	vec2 primaryWorld = (neighborId + 0.5) / max(uGridScale, 0.001);
	vec2 away = primaryWorld - faceCenterWorld(aspect);

	if (length(away) < 1e-4) {
		float axisRand = hash21(neighborId + 30.0);
		vec2 axis = axisRand < 0.5 ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
		float sgn = hash21(neighborId + 31.0) < 0.5 ? -1.0 : 1.0;
		return axis * sgn;
	}

	if (abs(away.x) > abs(away.y)) {
		return vec2(sign(away.x), 0.0);
	}
	return vec2(0.0, sign(away.y));
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

			if (!isActiveCell(neighborId, aspect)) continue;

			vec2 dotPos = neighborOffset;
			float d = length(cellUv - dotPos) - uDotRadius;
			field = smin(field, d, uMergeK);

			if (primarySpawn(neighborId, aspect)) {
				float style = groupStyle(neighborId);

				if (style < 0.5) {
					field = addCompanion(field, cellUv, dotPos, neighborId, 80.0, 0.0, 0.12);
					if (hash21(neighborId + 81.0) < 0.45) {
						field = addCompanion(field, cellUv, dotPos, neighborId, 90.0, 0.0, 0.12);
					}
				} else {
					if (hash21(neighborId + 82.0) < 0.4) {
						field = addCompanion(field, cellUv, dotPos, neighborId, 85.0, 0.12, 0.28);
					}
				}
			}

			float randMove = hash21(neighborId + 10.0);
			if (randMove < uMoveChance) {
				vec2 moveDir = moverDirAwayFromFace(neighborId, aspect);
				float mergeGap = max(uMergeK * 0.55, 0.025);
				float nearSnap = uDotRadius + uMoveRadius + mergeGap;
				float farSnap = nearSnap + max(uMoveDist, 0.06);
				float phase = hash21(neighborId + 20.0);
				float cycle = fract(uTime * uSpeed * 0.31831 + phase);
				float travel = mix(nearSnap, farSnap, magnetCycle(cycle));
				vec2 movePos = dotPos + moveDir * travel;
				float dMove = length(cellUv - movePos) - uMoveRadius;
				field = smin(field, dMove, uMergeK);
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

	vec2 faMin = uFaceAreaPos - uFaceAreaScale * 0.5;
	vec2 faMax = uFaceAreaPos + uFaceAreaScale * 0.5;
	float faceOutside = max(
		max(faMin.x - screenUv.x, screenUv.x - faMax.x),
		max(faMin.y - screenUv.y, screenUv.y - faMax.y)
	);
	float faceSoft = 1.5 / max(min(uResolution.x, uResolution.y), 1.0);
	if (uFaceInside < 0.001) {
		alpha *= smoothstep(0.0, faceSoft, faceOutside);
	}

	vec3 rgb = uColor;

	if (uDebugFaceArea > 0.5) {
		float px = 2.0 / max(min(uResolution.x, uResolution.y), 1.0);
		float outside = faceOutside;
		float inside = max(
			max(screenUv.x - (faMin.x + px), (faMax.x - px) - screenUv.x),
			max(screenUv.y - (faMin.y + px), (faMax.y - px) - screenUv.y)
		);
		float border = (1.0 - step(0.0, outside)) * step(0.0, inside);
		float fill = (1.0 - step(0.0, outside)) * 0.12;

		vec3 debugCol = vec3(0.15, 0.85, 1.0);
		rgb = mix(rgb, debugCol, max(border, fill));
		alpha = max(alpha, max(border, fill * 0.5));
	}

	fragColor = vec4(rgb, alpha);
}
`;
