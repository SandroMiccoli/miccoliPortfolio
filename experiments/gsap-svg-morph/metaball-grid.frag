// Procedural metaball grid — WebGL fragment shader
// Ported from TouchDesigner GLSL TOP (face-area logic removed).
// Colors: large black + orange clusters via coarse cell grouping.

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
uniform vec4  uMargin;      // left, right, top, bottom
uniform vec3  uColorA;      // black cluster
uniform vec3  uColorB;      // orange cluster
uniform float uClusterScale; // larger = bigger color regions

float hash21(vec2 p) {
	p = fract(p * vec2(123.34, 456.21) + uSeed);
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

float smin(float a, float b, float k) {
	float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
	return mix(b, a, h) - k * h * (1.0 - h);
}

// Stable random fill order with a gentle perimeter bias.
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

bool isActiveCell(vec2 id, float aspect) {
	if (!insideMargin(id, aspect)) return false;
	if (primarySpawn(id, aspect)) return true;

	for (float y = -1.0; y <= 1.0; y++) {
		for (float x = -1.0; x <= 1.0; x++) {
			if (abs(x) + abs(y) != 1.0) continue;
			vec2 n = id - vec2(x, y);
			if (!insideMargin(n, aspect)) continue;
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

void accumulateColor(inout vec3 colorSum, inout float weightSum, float d, vec3 col) {
	float w = max(uMergeK * 3.0 - d, 0.0);
	colorSum += col * w;
	weightSum += w;
}

float addCompanionColored(
	float field,
	inout vec3 colorSum,
	inout float weightSum,
	vec2 cellUv,
	vec2 origin,
	vec2 id,
	float salt,
	float extraMin,
	float extraMax,
	vec3 col
) {
	vec2 pos = origin + companionOffset(id, salt, extraMin, extraMax);
	float d = length(cellUv - pos) - uDotRadius;
	accumulateColor(colorSum, weightSum, d, col);
	return smin(field, d, uMergeK);
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

	for (float y = -2.0; y <= 2.0; y++) {
		for (float x = -2.0; x <= 2.0; x++) {
			vec2 obsId = neighborId + vec2(x, y);
			if (!isActiveCell(obsId, aspect)) continue;

			vec2 obsPrimaryRel = obsId - cellId;

			if (!all(equal(obsId, neighborId))) {
				firstSoft = min(firstSoft, travelToSeparation(primaryRel, moveDir, obsPrimaryRel, softSep));
				firstHard = min(firstHard, travelToSeparation(primaryRel, moveDir, obsPrimaryRel, hardSep));
			}

			if (!primarySpawn(obsId, aspect)) continue;

			float style = groupStyle(obsId);
			if (style < 0.5) {
				vec2 c0 = obsPrimaryRel + companionOffset(obsId, 80.0, 0.0, 0.12);
				firstSoft = min(firstSoft, travelToSeparation(primaryRel, moveDir, c0, softSep));
				firstHard = min(firstHard, travelToSeparation(primaryRel, moveDir, c0, hardSep));
				if (hash21(obsId + 81.0) < 0.45) {
					vec2 c1 = obsPrimaryRel + companionOffset(obsId, 90.0, 0.0, 0.12);
					firstSoft = min(firstSoft, travelToSeparation(primaryRel, moveDir, c1, softSep));
					firstHard = min(firstHard, travelToSeparation(primaryRel, moveDir, c1, hardSep));
				}
			} else if (hash21(obsId + 82.0) < 0.4) {
				vec2 c2 = obsPrimaryRel + companionOffset(obsId, 85.0, 0.12, 0.28);
				firstSoft = min(firstSoft, travelToSeparation(primaryRel, moveDir, c2, softSep));
				firstHard = min(firstHard, travelToSeparation(primaryRel, moveDir, c2, hardSep));
			}
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
	float minSpan = max(uMoveDist * 0.4, 0.06);

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

	farSnap = min(nearSnap + max(uMoveDist, 0.0), firstSoft);
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

vec2 moverPreferredDir(vec2 neighborId) {
	float axisRand = hash21(neighborId + 30.0);
	vec2 axis = axisRand < 0.5 ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
	float sgn = hash21(neighborId + 31.0) < 0.5 ? -1.0 : 1.0;
	return axis * sgn;
}

// Large contiguous color regions (black vs orange clusters).
vec3 clusterColor(vec2 id) {
	float scale = max(uClusterScale, 1.0);
	vec2 clusterId = floor(id / scale);
	float n = hash21(clusterId + 3.7);
	// Soften block edges slightly with a coarser octave.
	float n2 = hash21(floor(id / (scale * 1.7)) + 11.3);
	float pick = mix(n, n2, 0.28);
	return pick < 0.5 ? uColorA : uColorB;
}

void main() {
	vec2 screenUv = gl_FragCoord.xy / uResolution;
	vec2 uv = screenUv - 0.5;
	float aspect = uResolution.x / max(uResolution.y, 1.0);
	uv.x *= aspect;

	vec2 gridUV = uv * uGridScale;
	vec2 cellId = floor(gridUV);
	vec2 cellUv = fract(gridUV) - 0.5;

	float field = 1.0;
	vec3 colorSum = vec3(0.0);
	float weightSum = 0.0;

	for (float y = -1.0; y <= 1.0; y++) {
		for (float x = -1.0; x <= 1.0; x++) {
			vec2 neighborOffset = vec2(x, y);
			vec2 neighborId = cellId + neighborOffset;

			if (!isActiveCell(neighborId, aspect)) continue;

			vec3 col = clusterColor(neighborId);

			vec2 dotPos = neighborOffset;
			float d = length(cellUv - dotPos) - uDotRadius;
			field = smin(field, d, uMergeK);
			accumulateColor(colorSum, weightSum, d, col);

			if (primarySpawn(neighborId, aspect)) {
				float style = groupStyle(neighborId);

				if (style < 0.5) {
					field = addCompanionColored(field, colorSum, weightSum, cellUv, dotPos, neighborId, 80.0, 0.0, 0.12, col);
					if (hash21(neighborId + 81.0) < 0.45) {
						field = addCompanionColored(field, colorSum, weightSum, cellUv, dotPos, neighborId, 90.0, 0.0, 0.12, col);
					}
				} else {
					if (hash21(neighborId + 82.0) < 0.4) {
						field = addCompanionColored(field, colorSum, weightSum, cellUv, dotPos, neighborId, 85.0, 0.12, 0.28, col);
					}
				}
			}

			float randMove = hash21(neighborId + 10.0);
			if (randMove < uMoveChance) {
				vec2 preferredDir = moverPreferredDir(neighborId);
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
					accumulateColor(colorSum, weightSum, dMove, col);
				}
			}
		}
	}

	float edgeSoft = 2.0 / max(uResolution.y, 1.0) * uGridScale;
	float alpha = 1.0 - smoothstep(0.0, edgeSoft, field);

	float marginDistance = min(
		min(screenUv.x - uMargin.x, (1.0 - uMargin.y) - screenUv.x),
		min(screenUv.y - uMargin.w, (1.0 - uMargin.z) - screenUv.y)
	);
	float marginSoft = 1.5 / max(min(uResolution.x, uResolution.y), 1.0);
	alpha *= smoothstep(0.0, marginSoft, marginDistance);

	vec3 baseColor = weightSum > 0.0 ? (colorSum / weightSum) : uColorA;
	vec3 rgb = baseColor * alpha;

	gl_FragColor = vec4(rgb, alpha);
}
