// Three.js Blob Wave — noise-displaced cylinder with perturbed normals

import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const CYLINDER_RADIUS = 0.5;
const CYLINDER_LENGTH = 8.0;
const HEIGHT_SEGMENTS  = 128;

// ─── Config ────────────────────────────────────────────────────────────────────

const params = {
	noiseAmplitude:   0.7,
	noiseSpeed:       0.14,  // scrolls fast-flow Y input (horizontal wave along length)
	noiseSpeedX:      0.3,  // oscillates x-input of each noise layer (bounded, no drift)
	noiseSpeedY:      1.47,  // scrolls slow-flow Y input (large-scale axial drift)
	noiseFloor:      -1,
	// Mouse interaction — 2D Gaussian centred on the hovered point
	mouseAmplitude:   0.45,  // peak displacement added at hover point
	mouseAxialFalloff: 1.0,  // how quickly it fades along the cylinder length (higher = tighter)
	mouseAngleFalloff: 4.0,  // how quickly it fades around the ring (higher = tighter spotlight)
	noiseFreqAngle:   0.5,
	noiseFreqFlow:    0.9,
	cylinderResolution: 128,
	meshRotationX:    0,
	wireframe:        false,
	wireframeOpacity: 0.15,
	showFps:          true,
};

const lightParams = {
	ambient: 0.12,
	// Extra shading terms — NOT tied to the 4 point lights; disable both to get
	// pure Lambert (geometry goes fully black when ambient + lights are all 0)
	rimLight: true,
	rimStrength: 1,
	specHighlight: true,
	specStrength: 0.15,
	l1X: -2.2, l1Y:  0.85, l1Z: -0.3, l1Color: '#ffffff', l1Intensity: 1.5,
	l2X:  1.5, l2Y:  1.05, l2Z: 0.2, l2Color: '#ffffff', l2Intensity: 0.5,
	l3X: -2.65, l3Y: -1.1, l3Z: 0.5, l3Color: '#ffffff', l3Intensity: 0.6,
	l4X:  2.55, l4Y: -0.9, l4Z: 0.5, l4Color: '#ffffff', l4Intensity: 0.5,
};

const debugParams = {
	viewMode:     'off',
	lightSpheres:  false,
	normalLines:   false,
	vertexPoints:  false,
	axes:          false,
	normalScale:   0.12,
};

const DEBUG_VIEW = { off: 0, normals: 1, displacement: 2, progress: 3 };

// ─── Vertex Shader ─────────────────────────────────────────────────────────────
//
// Key change from previous version: normals are now computed AFTER displacement
// via finite differences (central idea: sample the displacement field at two
// neighboring points, form tangent vectors, cross-product them to get the
// surface normal of the actual deformed surface).
//
// `computeDisp(ang, posY)` isolates the noise evaluation so it can be
// reused for the three samples (base vertex, angular neighbor, Y neighbor).
//
// Angular neighbor: step `EPS` radians around the cylinder ring.
//   neighborA = (cos(angle+EPS) * (baseR + dN), y, sin(angle+EPS) * (baseR + dN))
//
// Y neighbor: step `EPS` along the cylinder axis, same radial direction.
//   neighborY = position + (0, EPS, 0) + radial * dYn
//
// tangA = neighborA - newPos  (circumferential tangent)
// tangY = neighborY - newPos  (axial tangent)
// normal = normalize(cross(tangY, tangA))   ← outward by right-hand rule
//
// Because vWorldNormal now carries the displaced surface normal, all downstream
// lighting and the shader debug "normals" view are automatically correct.

const vertexShader = `
  uniform float uTime;
  uniform vec2  uMouse;
  uniform float uMouseStrength;
  uniform float uMouseAngle;       // angle on the cylinder ring closest to the cursor
  uniform float uMouseAmplitude;
  uniform float uMouseAxialFalloff;
  uniform float uMouseAngleFalloff;
  uniform float uNoiseAmplitude;
  uniform float uNoiseSpeed;
  uniform float uNoiseSpeedX;
  uniform float uNoiseSpeedY;
  uniform float uNoiseFloor;
  uniform float uNoiseFreqAngle;
  uniform float uNoiseFreqFlow;
  varying float vProgress;
  varying float vDisplace;
  varying vec3  vWorldNormal;
  varying vec3  vWorldPos;

  vec3 mod289v3(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec4 mod289v4(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 permute(vec4 x){return mod289v4(((x*34.)+1.)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.);
    const vec4 D=vec4(0.,.5,1.,2.);
    vec3 i=floor(v+dot(v,C.yyy));
    vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);
    vec3 l=1.-g;
    vec3 i1=min(g.xyz,l.zxy);
    vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;
    vec3 x2=x0-i2+C.yyy;
    vec3 x3=x0-D.yyy;
    i=mod289v3(i);
    vec4 p=permute(permute(permute(
      i.z+vec4(0.,i1.z,i2.z,1.))
      +i.y+vec4(0.,i1.y,i2.y,1.))
      +i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=0.142857142857;
    vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);
    vec4 y_=floor(j-7.*x_);
    vec4 x=x_*ns.x+ns.yyyy;
    vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);
    vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.+1.;
    vec4 s1=floor(b1)*2.+1.;
    vec4 sh=-step(h,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
    vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);
    vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z);
    vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
    m=m*m;
    return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  // Each snoise call is vec3(x, y, z). Speeds target specific inputs:
  //
  //   Speed Length → y-input on fast layers (fl)
  //   Speed Y      → y-input on slow layers (sfl)
  //   Speed X      → x-input oscillation: uses sin/cos of time so the noise
  //                  x-input pulses back and forth in a bounded range instead
  //                  of scrolling. Each layer gets a different phase offset so
  //                  they don't all pulse in sync → complex morphing in place.
  //
  //     xOsc = sin(tX + phaseOffset) * amplitude   (bounded: never scrolls away)
  //
  // SEAMLESS ANGULAR ENCODING:
  //   Previously used sA = ang * fa where ang = atan(z, x). atan2 has a
  //   branch-cut discontinuity at ang = ±π, which sits exactly at the bottom
  //   of the cylinder after the mesh's rotation.z = π/2 transform, causing a
  //   visible seam in both displacement and normals.
  //   Fix: project the angle onto the unit circle — cos(ang) and sin(ang) are
  //   continuous everywhere, including across the ±π boundary. Both components
  //   are spread across the x and z noise dimensions for full circular coverage.
  float computeDisp(float ang, float posY) {
    float tLen = uTime * uNoiseSpeed;
    float tX   = uTime * uNoiseSpeedX;
    float tY   = uTime * uNoiseSpeedY;

    float fa = uNoiseFreqAngle;
    float ff = uNoiseFreqFlow;

    // Continuous circular coordinates — no ±π branch-cut discontinuity
    float cA = cos(ang) * fa;
    float sA = sin(ang) * fa;

    float fl  = posY * 0.55 * ff + tLen * 0.38;
    float sfl = posY * 0.18 * ff + tY   * 0.10;

    // Per-layer oscillating x offsets — different phases keep layers out of sync.
    // cA drives the noise x-axis, sA drives z so both circular components are used.
    float n1 = snoise(vec3(cA*1.10 + sin(tX         )*0.40, fl *1.02, sA*1.10 + tLen*0.05      )) * 0.157;
    float n2 = snoise(vec3(cA*2.18 + sin(tX + 1.571 )*0.32, fl *1.57, sA*2.18 + tLen*0.05+ 5.0 )) * 0.075;
    float n3 = snoise(vec3(cA*0.53 + cos(tX + 0.785 )*0.28, fl *0.60, sA*0.53 + tLen*0.05+12.0 )) * 0.048;
    float s1 = snoise(vec3(cA*0.24 + sin(tX + 3.141 )*0.50, sfl*0.68, sA*0.24 + tY  *0.04      )) * 0.629;
    float s2 = snoise(vec3(cA*0.48 + cos(tX + 2.356 )*0.50, sfl*0.38, sA*0.48 + tY  *0.06+20.0 )) * 0.387;
    return (n1+n2+n3+s1+s2) * uNoiseAmplitude;
  }

  void main() {
    vec3  radial  = normalize(vec3(position.x, 0.0, position.z));
    float angle   = atan(position.z, position.x);
    float baseR   = length(vec2(position.x, position.z));

    float halfLen = 4.0;
    vProgress = (position.y + halfLen) / (halfLen * 2.0);

    // ── Displacement ─────────────────────────────────────────────────────────
    float d = computeDisp(angle, position.y);

    // 2D Gaussian: axial (along cylinder length) × angular (around the ring).
    // mouseLocalY maps screen X  → position along the cylinder axis.
    // uMouseAngle maps screen Y  → angle on the front-facing half of the ring.
    // The angular distance uses the shortest arc to handle the ±π wrap.
    float mouseLocalY  = -uMouse.x * 4.0;
    float axialProx    = exp(-pow(position.y - mouseLocalY, 2.0) * uMouseAxialFalloff);
    float angDist      = abs(angle - uMouseAngle);
    angDist = min(angDist, 6.28318 - angDist);  // shortest arc (handle ±π wrap)
    float angProx      = exp(-angDist * angDist * uMouseAngleFalloff);
    d += axialProx * angProx * uMouseStrength * uMouseAmplitude;

    // Two-level floor:
    //   1. uNoiseFloor — user-controlled aesthetic floor
    //   2. geometry safety floor — hard limit so vertices can NEVER cross the
    //      cylinder axis (baseR - epsilon). If d < -baseR the vertex passes
    //      center, face winding reverses, and normals/lighting break completely.
    float geoFloor = -(baseR - 0.01);
    d = max(d, max(uNoiseFloor, geoFloor));

    vDisplace = d;
    vec3 newPos = position + radial * d;

    // ── Perturbed normal (finite differences on the displaced field) ──────────
    const float EPS = 0.04;

    // Angular neighbor — step EPS radians around the ring (mouse included)
    // Apply the same two-level floor as the base vertex so the tangent vector
    // is always computed between geometrically valid positions.
    float  angleN    = angle + EPS;
    float  angDistN  = abs(angleN - uMouseAngle);
           angDistN  = min(angDistN, 6.28318 - angDistN);
    float  dN = max(computeDisp(angleN, position.y)
                  + axialProx * exp(-angDistN*angDistN*uMouseAngleFalloff)
                    * uMouseStrength * uMouseAmplitude,
                  max(uNoiseFloor, geoFloor));
    vec3   neighborA = vec3(cos(angleN)*(baseR+dN), position.y, sin(angleN)*(baseR+dN));

    // Axial neighbor — step EPS along the cylinder axis (mouse included)
    float  axialProxY = exp(-pow(position.y + EPS - mouseLocalY, 2.0) * uMouseAxialFalloff);
    float  dYn = max(computeDisp(angle, position.y + EPS)
                   + axialProxY * angProx * uMouseStrength * uMouseAmplitude,
                   max(uNoiseFloor, geoFloor));
    vec3   neighborY = position + vec3(0.0, EPS, 0.0) + radial * dYn;

    vec3 tangA = neighborA - newPos;   // circumferential tangent
    vec3 tangY = neighborY - newPos;   // axial tangent
    // cross(tangY, tangA) → outward normal (right-hand rule for cylinder orientation)
    vec3 perturbedNormal = normalize(cross(tangY, tangA));

    // The cross product can flip inward when displacement is large.
    // Guarantee outward orientation: step(dot,0) = 1 when dot <= 0 (flip needed).
    // normalSign becomes -1 to flip, or +1 to keep — branch-free.
    float normalSign = 1.0 - 2.0 * step(dot(perturbedNormal, radial), 0.0);
    perturbedNormal *= normalSign;

    vWorldNormal = normalize(mat3(modelMatrix) * perturbedNormal);
    vWorldPos    = (modelMatrix * vec4(newPos, 1.0)).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
  }
`;

// ─── Fragment Shader ───────────────────────────────────────────────────────────

const fragmentShader = `
  uniform float uTime;
  uniform float uAmbient;
  uniform vec3  uLightPositions[4];
  uniform vec3  uLightColors[4];
  uniform float uLightIntensities[4];
  uniform float uRimStrength;
  uniform float uSpecStrength;
  uniform float uDebugView;
  varying float vProgress;
  varying float vDisplace;
  varying vec3  vWorldNormal;
  varying vec3  vWorldPos;

  void main() {
    vec3 N = normalize(vWorldNormal);
    // DoubleSide rendering makes the inner surface visible when displacement
    // folds the mesh or the cylinder is viewed from below. Flip the normal for
    // back-facing fragments so diffuse and specular lighting stay correct.
    if (!gl_FrontFacing) N = -N;

    // ── Debug views ──────────────────────────────────────────────────────────
    if (uDebugView > 2.5) {
      gl_FragColor = vec4(vProgress, vProgress, vProgress, 1.0);
      return;
    }
    if (uDebugView > 1.5) {
      float d  = clamp(vDisplace * 0.5 + 0.5, 0.0, 1.0);
      float t1 = clamp(d * 2.0, 0.0, 1.0);
      float t2 = clamp((d - 0.5) * 2.0, 0.0, 1.0);
      vec3 cold = vec3(0.0, 0.2, 0.9);
      vec3 mid  = vec3(0.05, 0.05, 0.05);
      vec3 hot  = vec3(1.0, 0.35, 0.0);
      gl_FragColor = vec4(mix(mix(cold, mid, t1), hot, t2), 1.0);
      return;
    }
    if (uDebugView > 0.5) {
      // vWorldNormal is now the POST-displacement perturbed normal
      gl_FragColor = vec4(N * 0.5 + 0.5, 1.0);
      return;
    }

    // ── Normal shading ───────────────────────────────────────────────────────
    // DEBUG: flat white base — restore palette below when done testing lights
    // Planned palette: vivid grape-purple (left) → sky blue / cyan (right)
    vec3 c0 = vec3(0.42, 0.84, 1.00);
    vec3 c1 = vec3(0.25, 0.72, 1.00);
    vec3 c2 = vec3(0.15, 0.58, 0.96);
    vec3 c3 = vec3(0.48, 0.38, 0.95);
    vec3 c4 = vec3(0.48, 0.12, 0.92);
    vec3 c5 = vec3(0.52, 0.05, 0.90);
    vec3 c6 = vec3(0.40, 0.02, 0.78);
    // vec3 c0 = vec3(0.9, 0.9, 0.9);
    // vec3 c1 = vec3(0.9, 0.9, 0.9);
    // vec3 c2 = vec3(0.9, 0.9, 0.9);
    // vec3 c3 = vec3(0.9, 0.9, 0.9);
    // vec3 c4 = vec3(0.9, 0.9, 0.9);
    // vec3 c5 = vec3(0.9, 0.9, 0.9);
    // vec3 c6 = vec3(0.9, 0.9, 0.9);

    float t = vProgress;
    vec3 baseColor = mix(c0, c1, smoothstep(0.000, 0.167, t));
         baseColor = mix(baseColor, c2, smoothstep(0.167, 0.333, t));
         baseColor = mix(baseColor, c3, smoothstep(0.333, 0.500, t));
         baseColor = mix(baseColor, c4, smoothstep(0.500, 0.667, t));
         baseColor = mix(baseColor, c5, smoothstep(0.667, 0.833, t));
         baseColor = mix(baseColor, c6, smoothstep(0.833, 1.000, t));

    vec3 lightAccum = vec3(uAmbient);
    vec3 L; float diff;
    L = normalize(uLightPositions[0] - vWorldPos); diff = max(dot(N, L), 0.0);
    lightAccum += uLightColors[0] * diff * uLightIntensities[0];
    L = normalize(uLightPositions[1] - vWorldPos); diff = max(dot(N, L), 0.0);
    lightAccum += uLightColors[1] * diff * uLightIntensities[1];
    L = normalize(uLightPositions[2] - vWorldPos); diff = max(dot(N, L), 0.0);
    lightAccum += uLightColors[2] * diff * uLightIntensities[2];
    L = normalize(uLightPositions[3] - vWorldPos); diff = max(dot(N, L), 0.0);
    lightAccum += uLightColors[3] * diff * uLightIntensities[3];

    vec3 color = baseColor * lightAccum;

    // Rim light — fake edge glow from the camera direction (not a scene light)
    if (uRimStrength > 0.0) {
      vec3 viewDir = normalize(cameraPosition - vWorldPos);
      float rim = pow(1.0 - abs(dot(N, viewDir)), 3.0);
      color += rim * baseColor * uRimStrength;
    }

    // Displacement specular — highlight on outward bumps (also not a scene light)
    if (uSpecStrength > 0.0) {
      float spec = smoothstep(0.12, 0.35, vDisplace);
      vec3 specColor = mix(vec3(0.42, 0.08, 0.68), vec3(0.10, 0.30, 0.90), vProgress);
      color += spec * specColor * uSpecStrength;
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ─── JS Simplex Noise (mirrors the GLSL implementation for debug geometry) ────
//
// The vertex shader displaces geometry on the GPU and never writes back to CPU
// buffers. To keep the JS debug overlays (normal arrows, vertex points) in sync
// with the actual displaced surface, we replicate the same noise math here.
//
// _m289 / _perm match mod289v4 / permute in the shader exactly.
// snoise3js returns the same value as snoise() for the same inputs (floating-point
// rounding may differ slightly: GLSL uses 32-bit mediump, JS uses 64-bit doubles).

function _m289(x) { return x - Math.floor(x / 289.0) * 289.0; }
function _perm(x) { return _m289(((x * 34.0) + 1.0) * x); }

function snoise3js(vx, vy, vz) {
	const F3 = 1.0 / 3.0, G3 = 1.0 / 6.0;
	const s = (vx + vy + vz) * F3;
	let ix = Math.floor(vx + s), iy = Math.floor(vy + s), iz = Math.floor(vz + s);
	const t0 = (ix + iy + iz) * G3;
	const x0 = vx - ix + t0, y0 = vy - iy + t0, z0 = vz - iz + t0;

	let i1, j1, k1, i2, j2, k2;
	if (x0 >= y0) {
		if      (y0 >= z0)  { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
		else if (x0 >= z0)  { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
		else                { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
	} else {
		if      (y0 < z0)   { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
		else if (x0 < z0)   { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
		else                { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
	}

	const x1=x0-i1+G3, y1=y0-j1+G3, z1=z0-k1+G3;
	const x2=x0-i2+F3, y2=y0-j2+F3, z2=z0-k2+F3;
	const x3=x0-.5,    y3=y0-.5,    z3=z0-.5;

	ix=_m289(ix); iy=_m289(iy); iz=_m289(iz);
	const p0=_perm(_perm(_perm(iz    )+iy    )+ix    );
	const p1=_perm(_perm(_perm(iz+k1 )+iy+j1 )+ix+i1 );
	const p2=_perm(_perm(_perm(iz+k2 )+iy+j2 )+ix+i2 );
	const p3=_perm(_perm(_perm(iz+1  )+iy+1  )+ix+1  );

	const N_=1.0/7.0, NS_X=2.0*N_, NS_Y=0.5*N_-1.0;

	// Combines gradient extraction, normalization, and weighted contribution
	function corner(p, xc, yc, zc) {
		const j  = p - 49.0 * Math.floor(p * N_ * N_);
		const gx = Math.floor(j * N_) * NS_X + NS_Y;
		const gy = Math.floor(j - 7.0 * Math.floor(j * N_)) * NS_X + NS_Y;
		const h  = 1.0 - Math.abs(gx) - Math.abs(gy);
		const sh = h < 0 ? -1 : 0;
		const ax = gx + (Math.floor(gx) * 2.0 + 1.0) * sh;
		const ay = gy + (Math.floor(gy) * 2.0 + 1.0) * sh;
		const w  = 1.79284291400159 - 0.85373472095314 * (ax*ax + ay*ay + h*h);
		let   m  = 0.6 - (xc*xc + yc*yc + zc*zc);
		if (m <= 0) return 0;
		m *= m;
		return (m * m) * (ax*w*xc + ay*w*yc + h*w*zc);
	}

	return 42.0 * (corner(p0,x0,y0,z0) + corner(p1,x1,y1,z1) +
	               corner(p2,x2,y2,z2) + corner(p3,x3,y3,z3));
}

function computeDispJs(angle, posY, elapsed) {
	const tLen = elapsed * params.noiseSpeed;
	const tX   = elapsed * params.noiseSpeedX;
	const tY   = elapsed * params.noiseSpeedY;

	const fa = params.noiseFreqAngle, ff = params.noiseFreqFlow;

	// Continuous circular coordinates — mirrors the GLSL fix (no ±π seam)
	const cA = Math.cos(angle) * fa;
	const sA = Math.sin(angle) * fa;

	const fl  = posY * 0.55 * ff + tLen * 0.38;
	const sfl = posY * 0.18 * ff + tY   * 0.10;

	const n1 = snoise3js(cA*1.10 + Math.sin(tX         )*0.40, fl *1.02, sA*1.10 + tLen*0.05      ) * 0.157;
	const n2 = snoise3js(cA*2.18 + Math.sin(tX + 1.571 )*0.32, fl *1.57, sA*2.18 + tLen*0.05+ 5.0 ) * 0.075;
	const n3 = snoise3js(cA*0.53 + Math.cos(tX + 0.785 )*0.28, fl *0.60, sA*0.53 + tLen*0.05+12.0 ) * 0.048;
	const s1 = snoise3js(cA*0.24 + Math.sin(tX + 3.141 )*0.50, sfl*0.68, sA*0.24 + tY  *0.04      ) * 0.629;
	const s2 = snoise3js(cA*0.48 + Math.cos(tX + 2.356 )*0.50, sfl*0.38, sA*0.48 + tY  *0.06+20.0 ) * 0.387;
	return (n1+n2+n3+s1+s2) * params.noiseAmplitude;
}

// ─── Runtime state ─────────────────────────────────────────────────────────────

let container, scene, camera, renderer, mesh, material, stats;
let wireframeMesh, wireframeMaterial;
let lightSpheresGroup;
let normalLinesMesh, vertexPointsMesh;
let axesHelperObj;
// Pre-allocated CPU buffers for debug geometry (reused every frame)
let normalLinesData  = null; // Float32Array: 2 points × 3 floats per arrow
let vertexPointsData = null; // Float32Array: 1 point × 3 floats
let debugVertCount   = 0;
const DEBUG_STEP     = 8; // sample every Nth vertex for debug overlays

const targetMouse = new THREE.Vector2(0, 0);
let   targetMouseAngle = Math.PI / 2; // default: front-facing angle
let   targetStrength = 0;

// Screen Y → angle on the visible front half of the cylinder.
// clientY grows downward, so after (clientY/height)*2-1 the sign is:
//   ndcY = -1 at screen top, +1 at screen bottom.
// The cylinder lies on its side (rotation.z = π/2):
//   angle = 0  → world-up   (top of cylinder)
//   angle = π/2→ toward cam (front, screen center)
//   angle = π  → world-down (bottom of cylinder)
// Mapping: ndcY=-1 (top screen) → angle=0, ndcY=+1 (bottom screen) → angle=π
function screenYToAngle(ndcY) {
	return (1.0 + ndcY) * (Math.PI / 2.0);
}
const clock = new THREE.Clock();

// ─── Light helpers ─────────────────────────────────────────────────────────────

function getLightPositions() {
	return [
		new THREE.Vector3(lightParams.l1X, lightParams.l1Y, lightParams.l1Z),
		new THREE.Vector3(lightParams.l2X, lightParams.l2Y, lightParams.l2Z),
		new THREE.Vector3(lightParams.l3X, lightParams.l3Y, lightParams.l3Z),
		new THREE.Vector3(lightParams.l4X, lightParams.l4Y, lightParams.l4Z),
	];
}

function getLightColors() {
	return [
		new THREE.Color(lightParams.l1Color),
		new THREE.Color(lightParams.l2Color),
		new THREE.Color(lightParams.l3Color),
		new THREE.Color(lightParams.l4Color),
	];
}

function rebuildLightSpheres() {
	lightSpheresGroup.clear();
	const positions = getLightPositions();
	const colors    = getLightColors();
	const geo = new THREE.SphereGeometry(0.07, 8, 8);
	positions.forEach((pos, i) => {
		const sphere = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: colors[i] }));
		sphere.position.copy(pos);
		lightSpheresGroup.add(sphere);
	});
}

function updateLightUniforms() {
	material.uniforms.uLightPositions.value   = getLightPositions();
	material.uniforms.uLightColors.value      = getLightColors();
	material.uniforms.uLightIntensities.value = [
		lightParams.l1Intensity, lightParams.l2Intensity,
		lightParams.l3Intensity, lightParams.l4Intensity,
	];
	material.uniforms.uAmbient.value      = lightParams.ambient;
	material.uniforms.uRimStrength.value  = lightParams.rimLight  ? lightParams.rimStrength  : 0;
	material.uniforms.uSpecStrength.value = lightParams.specHighlight ? lightParams.specStrength : 0;
	rebuildLightSpheres();
}

// ─── Debug geometry (CPU-side, mirrors displaced surface) ──────────────────────
//
// The debug normal arrows and vertex points are computed in JavaScript using the
// same noise function as the shader. They match the displaced surface positions,
// not the base cylinder. Both helpers are children of `mesh` so they inherit the
// same rotation (rotation.z = π/2, meshRotationX).
//
// Buffer strategy: pre-allocate Float32Arrays once (or on resolution change) and
// update them in-place each frame. THREE.BufferAttribute references the same
// typed array — setting `needsUpdate = true` uploads the changes to the GPU.

function allocDebugBuffers(count) {
	debugVertCount = count;
	normalLinesData  = new Float32Array(count * 6);
	vertexPointsData = new Float32Array(count * 3);
}

function rebuildDebugBuffers() {
	const count = Math.ceil(mesh.geometry.attributes.position.count / DEBUG_STEP);
	allocDebugBuffers(count);

	const lineGeo = new THREE.BufferGeometry();
	lineGeo.setAttribute('position', new THREE.BufferAttribute(normalLinesData, 3));
	normalLinesMesh.geometry.dispose();
	normalLinesMesh.geometry = lineGeo;

	const ptGeo = new THREE.BufferGeometry();
	ptGeo.setAttribute('position', new THREE.BufferAttribute(vertexPointsData, 3));
	vertexPointsMesh.geometry.dispose();
	vertexPointsMesh.geometry = ptGeo;
}

// Called every frame when debug helpers are visible.
// Computes displaced positions + finite-difference normals in JS to match the shader.
function updateDebugGeometry(elapsed) {
	if (!normalLinesData || debugVertCount === 0) return;

	const nf   = params.noiseFloor;
	const sc   = debugParams.normalScale;
	const EPS  = 0.04;
	const pos  = mesh.geometry.attributes.position;

	const mouseX        = material.uniforms.uMouse.value.x;
	const mouseStr      = material.uniforms.uMouseStrength.value;
	const mouseLocalY   = -mouseX * 4.0;
	const mouseAngle    = material.uniforms.uMouseAngle.value;
	const mouseAmp      = params.mouseAmplitude;
	const axialFall     = params.mouseAxialFalloff;
	const angFall       = params.mouseAngleFalloff;

	for (let i = 0; i < debugVertCount; i++) {
		const j  = i * DEBUG_STEP;
		const px = pos.getX(j), py = pos.getY(j), pz = pos.getZ(j);

		const angle = Math.atan2(pz, px);
		const baseR = Math.sqrt(px*px + pz*pz);
		const rx = px / baseR, rz = pz / baseR; // radial unit vector

		// Base displacement + 2D Gaussian mouse
		let d = computeDispJs(angle, py, elapsed);
		const axialProx = Math.exp(-Math.pow(py - mouseLocalY, 2.0) * axialFall);
		let   angDist   = Math.abs(angle - mouseAngle);
		angDist = Math.min(angDist, Math.PI * 2 - angDist);
		const angProx   = Math.exp(-angDist * angDist * angFall);
		d += axialProx * angProx * mouseStr * mouseAmp;
		const dC = Math.max(d, nf);

		// Displaced position (matches newPos in vertex shader)
		const dpx = px + rx * dC, dpz = pz + rz * dC;

		// Angular neighbor (mouse included)
		const aN     = angle + EPS;
		let   angDistN = Math.abs(aN - mouseAngle);
		angDistN = Math.min(angDistN, Math.PI * 2 - angDistN);
		const dN  = Math.max(
			computeDispJs(aN, py, elapsed)
			+ axialProx * Math.exp(-angDistN * angDistN * angFall) * mouseStr * mouseAmp,
			nf
		);
		const nax = Math.cos(aN) * (baseR + dN);
		const naz = Math.sin(aN) * (baseR + dN);

		// Axial neighbor (mouse included)
		const axialProxY = Math.exp(-Math.pow(py + EPS - mouseLocalY, 2.0) * axialFall);
		const dYn = Math.max(
			computeDispJs(angle, py + EPS, elapsed)
			+ axialProxY * angProx * mouseStr * mouseAmp,
			nf
		);
		const nyx = px + rx * dYn, nyy = py + EPS, nyz = pz + rz * dYn;

		// Tangents
		const tax = nax - dpx, taz = naz - dpz;           // circumferential (tay=0)
		const tyx = nyx - dpx, tyy = EPS, tyz = nyz - dpz; // axial

		// Normal = cross(tangY, tangA), outward by right-hand rule
		const nx_ = tyy * taz - tyz * 0;    // = tyy*taz
		const ny_ = tyz * tax - tyx * taz;
		const nz_ = tyx * 0   - tyy * tax;  // = -tyy*tax
		const nl  = Math.sqrt(nx_*nx_ + ny_*ny_ + nz_*nz_) || 1;

		vertexPointsData[i*3+0] = dpx;
		vertexPointsData[i*3+1] = py;
		vertexPointsData[i*3+2] = dpz;

		normalLinesData[i*6+0] = dpx;
		normalLinesData[i*6+1] = py;
		normalLinesData[i*6+2] = dpz;
		normalLinesData[i*6+3] = dpx + (nx_/nl) * sc;
		normalLinesData[i*6+4] = py  + (ny_/nl) * sc;
		normalLinesData[i*6+5] = dpz + (nz_/nl) * sc;
	}

	if (debugParams.vertexPoints && vertexPointsMesh)
		vertexPointsMesh.geometry.attributes.position.needsUpdate = true;
	if (debugParams.normalLines && normalLinesMesh)
		normalLinesMesh.geometry.attributes.position.needsUpdate = true;
}

// ─── Cylinder geometry ─────────────────────────────────────────────────────────

function createCylinderGeometry(radialSegments) {
	return new THREE.CylinderGeometry(
		CYLINDER_RADIUS, CYLINDER_RADIUS,
		CYLINDER_LENGTH, radialSegments, HEIGHT_SEGMENTS, true
	);
}

function createMaterial() {
	return new THREE.ShaderMaterial({
		vertexShader,
		fragmentShader,
		uniforms: {
			uTime:              { value: 0 },
			uMouse:             { value: new THREE.Vector2(0, 0) },
			uMouseStrength:     { value: 0 },
			uMouseAngle:        { value: Math.PI / 2 },
			uMouseAmplitude:    { value: params.mouseAmplitude },
			uMouseAxialFalloff: { value: params.mouseAxialFalloff },
			uMouseAngleFalloff: { value: params.mouseAngleFalloff },
			uNoiseAmplitude:    { value: params.noiseAmplitude },
			uNoiseSpeed:        { value: params.noiseSpeed },
			uNoiseSpeedX:       { value: params.noiseSpeedX },
			uNoiseSpeedY:       { value: params.noiseSpeedY },
			uNoiseFloor:        { value: params.noiseFloor },
			uNoiseFreqAngle:    { value: params.noiseFreqAngle },
			uNoiseFreqFlow:     { value: params.noiseFreqFlow },
			uDebugView:         { value: 0.0 },
			uAmbient:           { value: lightParams.ambient },
			uRimStrength:       { value: lightParams.rimLight ? lightParams.rimStrength : 0 },
			uSpecStrength:      { value: lightParams.specHighlight ? lightParams.specStrength : 0 },
			uLightPositions:    { value: getLightPositions() },
			uLightColors:       { value: getLightColors() },
			uLightIntensities:  { value: [
				lightParams.l1Intensity, lightParams.l2Intensity,
				lightParams.l3Intensity, lightParams.l4Intensity,
			]},
		},
		transparent: false,
		// DoubleSide prevents holes when adjacent vertices have very different
		// displacements and a quad twists inside-out. The hemisphere normal check
		// in the vertex shader ensures lighting is always correct on both sides.
		side: THREE.DoubleSide,
		depthWrite: true,
		depthTest: true,
	});
}

function updateCylinderResolution(radialSegments) {
	const next = createCylinderGeometry(radialSegments);
	mesh.geometry.dispose();
	mesh.geometry = next;

	if (wireframeMesh) {
		wireframeMesh.geometry.dispose();
		wireframeMesh.geometry = new THREE.WireframeGeometry(next);
	}
	rebuildDebugBuffers();
}

// ─── Stats ─────────────────────────────────────────────────────────────────────

function toggleStats() {
	if (!stats) return;
	if (params.showFps) {
		container.appendChild(stats.dom);
	} else if (stats.dom.parentElement) {
		stats.dom.parentElement.removeChild(stats.dom);
	}
}

// ─── GUI ───────────────────────────────────────────────────────────────────────

function addLightFolder(parent, label, prefix) {
	const lf = parent.addFolder(label);
	lf.add(lightParams, `${prefix}X`, -8, 8, 0.05).name('X').onChange(updateLightUniforms);
	lf.add(lightParams, `${prefix}Y`, -8, 8, 0.05).name('Y').onChange(updateLightUniforms);
	lf.add(lightParams, `${prefix}Z`, -4, 8, 0.05).name('Z').onChange(updateLightUniforms);
	lf.addColor(lightParams, `${prefix}Color`).name('Color').onChange(updateLightUniforms);
	lf.add(lightParams, `${prefix}Intensity`, 0, 2, 0.01).name('Intensity').onChange(updateLightUniforms);
}

function setupGui() {
	const gui = new GUI();
	gui.title('Blob Wave');

	const noiseFolder = gui.addFolder('Noise');
	noiseFolder.add(params, 'noiseAmplitude',  0,   2, 0.01).name('Amplitude').onChange((v) => { material.uniforms.uNoiseAmplitude.value = v; });
	noiseFolder.add(params, 'noiseSpeed',       0,   3, 0.01).name('Speed — Length (Y fast)').onChange((v) => { material.uniforms.uNoiseSpeed.value  = v; });
	noiseFolder.add(params, 'noiseSpeedX',      0,   3, 0.01).name('Speed — X oscillation').onChange((v) => { material.uniforms.uNoiseSpeedX.value = v; });
	noiseFolder.add(params, 'noiseSpeedY',      0,   3, 0.01).name('Speed — Y slow').onChange((v)     => { material.uniforms.uNoiseSpeedY.value = v; });
	noiseFolder.add(params, 'noiseFloor',      -1,   0, 0.01).name('Floor').onChange((v)     => { material.uniforms.uNoiseFloor.value    = v; });
	noiseFolder.add(params, 'noiseFreqAngle', 0.1,   6, 0.05).name('Freq — Angle (X)').onChange((v) => { material.uniforms.uNoiseFreqAngle.value = v; });
	noiseFolder.add(params, 'noiseFreqFlow',  0.1,   6, 0.05).name('Freq — Flow (Y)').onChange((v)  => { material.uniforms.uNoiseFreqFlow.value  = v; });
	noiseFolder.open();

	const mouseFolder = gui.addFolder('Mouse Interaction');
	mouseFolder.add(params, 'mouseAmplitude',    0, 1.5, 0.01).name('Amplitude').onChange((v) => { material.uniforms.uMouseAmplitude.value    = v; });
	mouseFolder.add(params, 'mouseAxialFalloff', 0.1, 8, 0.05).name('Falloff — Length').onChange((v) => { material.uniforms.uMouseAxialFalloff.value = v; });
	mouseFolder.add(params, 'mouseAngleFalloff', 0.1, 16, 0.1).name('Falloff — Angle').onChange((v) => { material.uniforms.uMouseAngleFalloff.value = v; });

	const geoFolder = gui.addFolder('Geometry');
	geoFolder.add(params, 'cylinderResolution', 8, 128, 1).name('Resolution').onChange((v) => { updateCylinderResolution(Math.round(v)); });
	geoFolder.add(params, 'meshRotationX', -Math.PI, Math.PI, 0.01).name('Rotation X').onChange((v) => { mesh.rotation.x = v; });

	const lightsFolder = gui.addFolder('Lights');
	lightsFolder.add(lightParams, 'ambient', 0, 0.5, 0.01).name('Ambient').onChange(updateLightUniforms);
	lightsFolder.add(lightParams, 'rimLight').name('Rim Light').onChange(updateLightUniforms);
	lightsFolder.add(lightParams, 'rimStrength', 0, 1, 0.01).name('Rim Strength').onChange(updateLightUniforms);
	lightsFolder.add(lightParams, 'specHighlight').name('Spec Highlight').onChange(updateLightUniforms);
	lightsFolder.add(lightParams, 'specStrength', 0, 1, 0.01).name('Spec Strength').onChange(updateLightUniforms);
	addLightFolder(lightsFolder, 'Light 1 — Top-Left',    'l1');
	addLightFolder(lightsFolder, 'Light 2 — Top-Right',   'l2');
	addLightFolder(lightsFolder, 'Light 3 — Bottom-Left', 'l3');
	addLightFolder(lightsFolder, 'Light 4 — Bottom-Right','l4');

	const renderFolder = gui.addFolder('Render');
	renderFolder.add(params, 'wireframe').name('Wireframe').onChange((v) => { wireframeMesh.visible = v; });
	renderFolder.add(params, 'wireframeOpacity', 0.01, 1, 0.01).name('Wire Opacity').onChange((v) => { wireframeMaterial.opacity = v; });

	const debugFolder = gui.addFolder('Debug');
	debugFolder.add(debugParams, 'viewMode', ['off', 'normals', 'displacement', 'progress'])
		.name('View Mode').onChange((v) => { material.uniforms.uDebugView.value = DEBUG_VIEW[v] ?? 0; });
	debugFolder.add(debugParams, 'lightSpheres').name('Light Spheres').onChange((v) => { lightSpheresGroup.visible = v; });
	debugFolder.add(debugParams, 'normalLines').name('Normal Lines').onChange((v)  => { normalLinesMesh.visible = v; });
	debugFolder.add(debugParams, 'vertexPoints').name('Vertex Points').onChange((v) => { vertexPointsMesh.visible = v; });
	debugFolder.add(debugParams, 'axes').name('Axes').onChange((v) => { axesHelperObj.visible = v; });
	debugFolder.add(debugParams, 'normalScale', 0.01, 0.5, 0.01).name('Normal Scale');

	const perfFolder = gui.addFolder('Performance');
	perfFolder.add(params, 'showFps').name('Show FPS').onChange(toggleStats);

  gui.close();
}

// ─── Init ──────────────────────────────────────────────────────────────────────

function init() {
	container = document.getElementById('canvas-container');

	scene  = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
	camera.position.set(0, 0.8, 4.5);
	camera.lookAt(0, 0, 0);

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0x000824, 1);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	container.appendChild(renderer.domElement);

	// ── Main mesh ──────────────────────────────────────────────────────────────
	material = createMaterial();
	const geo = createCylinderGeometry(params.cylinderResolution);
	mesh = new THREE.Mesh(geo, material);
	mesh.rotation.z = Math.PI / 2;
	mesh.rotation.x = params.meshRotationX;
	scene.add(mesh);

	// ── Wireframe overlay (child of mesh → inherits rotation) ─────────────────
	wireframeMaterial = new THREE.LineBasicMaterial({
		color: 0xffffff, opacity: params.wireframeOpacity, transparent: true,
	});
	wireframeMesh = new THREE.LineSegments(new THREE.WireframeGeometry(geo), wireframeMaterial);
	wireframeMesh.visible = params.wireframe;
	mesh.add(wireframeMesh);

	// ── Debug helpers (children of mesh → local cylinder space) ───────────────
	const count = Math.ceil(geo.attributes.position.count / DEBUG_STEP);
	allocDebugBuffers(count);

	normalLinesMesh = new THREE.LineSegments(
		new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(normalLinesData, 3)),
		new THREE.LineBasicMaterial({ color: 0x00ffcc })
	);
	normalLinesMesh.visible = debugParams.normalLines;
	mesh.add(normalLinesMesh);

	vertexPointsMesh = new THREE.Points(
		new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(vertexPointsData, 3)),
		new THREE.PointsMaterial({ color: 0xffee00, size: 0.025 })
	);
	vertexPointsMesh.visible = debugParams.vertexPoints;
	mesh.add(vertexPointsMesh);

	// ── Light indicator spheres (world space) ──────────────────────────────────
	lightSpheresGroup = new THREE.Group();
	lightSpheresGroup.visible = debugParams.lightSpheres;
	scene.add(lightSpheresGroup);
	rebuildLightSpheres();

	// ── Axes helper ────────────────────────────────────────────────────────────
	axesHelperObj = new THREE.AxesHelper(2);
	axesHelperObj.visible = debugParams.axes;
	scene.add(axesHelperObj);

	// ── Stats ──────────────────────────────────────────────────────────────────
	stats = new Stats();
	stats.dom.style.position = 'absolute';
	stats.dom.style.left = '0';
	stats.dom.style.top  = '0';
	if (params.showFps) container.appendChild(stats.dom);

	setupGui();

	window.addEventListener('mousemove', (e) => {
		targetMouse.x    = (e.clientX / window.innerWidth)  * 2 - 1;
		targetMouse.y    = (e.clientY / window.innerHeight) * 2 - 1;
		targetMouseAngle = screenYToAngle(targetMouse.y);
		targetStrength   = 1;
	});
	window.addEventListener('mouseleave', () => { targetStrength = 0; });
	window.addEventListener('resize', onWindowResize);

	animate();
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
	requestAnimationFrame(animate);
	if (params.showFps) stats.begin();

	const elapsed = clock.getElapsedTime();
	material.uniforms.uTime.value = elapsed;
	material.uniforms.uMouse.value.lerp(targetMouse, 0.06);
	material.uniforms.uMouseAngle.value +=
		(targetMouseAngle - material.uniforms.uMouseAngle.value) * 0.06;
	material.uniforms.uMouseStrength.value +=
		(targetStrength - material.uniforms.uMouseStrength.value) * 0.05;

	// Update debug geometry every frame (only when visible — JS noise is fast)
	if (debugParams.normalLines || debugParams.vertexPoints) {
		updateDebugGeometry(elapsed);
	}

	renderer.render(scene, camera);
	if (params.showFps) stats.end();
}

init();
