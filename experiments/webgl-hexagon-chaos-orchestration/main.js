/**
 * WebGL — Hexagon Chaos Orchestration
 *
 * A meditative WebGL exploration of the transition between chaos and order.
 * A central hexagonal form is continuously displaced by procedural noise
 * fields. Mouse proximity dampens the distortion within a soft "order
 * radius", smoothly resolving the form back to its canonical shape.
 *
 * The animation loop reads from a single `params` object (mutated by the
 * GUI / preset system) and lerps the renderer's shader uniforms toward
 * those targets each frame, so any change — including preset switches —
 * dissolves smoothly into the visual.
 */

import * as THREE from 'three';
import { createRenderer } from './modules/Renderer.js';
import { createInteraction } from './modules/Interaction.js';
import { createGui } from './modules/Gui.js';
import {
	DEFAULT_PARAMS,
	applyPresetToParams,
} from './modules/Presets.js';
import { distortionModeIndex } from './modules/Shaders.js';

// ─── State ─────────────────────────────────────────────────────────────────
const params = { ...DEFAULT_PARAMS };
applyPresetToParams(params, params.preset);

const container = document.getElementById('app');
const renderState = createRenderer(container, params);
const interaction = createInteraction(renderState.renderer.domElement, params);

// Cached THREE objects to avoid per-frame allocations.
const tmpColor = new THREE.Color();

// Frame timing.
let lastTime = performance.now() / 1000;
let frameAccumulator = 0;

// ─── GUI ────────────────────────────────────────────────────────────────────
createGui(params, {
	onResolutionChange: (scale) => renderState.setResolutionScale(scale),
});

// ─── Resize ─────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
	renderState.setSize(window.innerWidth, window.innerHeight);
});

// ─── Smoothed shader uniforms ──────────────────────────────────────────────
// Numeric uniforms ease toward their target value each frame for buttery
// preset transitions. Keep this list aligned with the uniform table so
// every numeric param participates.
const SMOOTHED_NUMERIC = [
	['uDistortionStrength',    'distortionStrength'],
	['uDistortionScale',       'distortionScale'],
	['uDistortionSpeed',       'distortionSpeed'],
	['uAnimationIntensity',    'animationIntensity'],
	['uNoiseInfluence',        'noiseInfluence'],
	['uTurbulenceAmount',      'turbulenceAmount'],
	['uDisplacementAmplitude', 'displacementAmplitude'],
	['uDisplacementFrequency', 'displacementFrequency'],
	['uFlowSpeedX',            'flowSpeedX'],
	['uFlowSpeedY',            'flowSpeedY'],
	['uOscillationSpeed',      'oscillationSpeed'],
	['uOscillationAmplitude',  'oscillationAmplitude'],
	['uDriftAmount',           'driftAmount'],
	['uBreathingSpeed',        'breathingSpeed'],
	['uOrderRadius',           'orderRadius'],
	['uInteractionFalloff',    'interactionFalloff'],
	['uGradientIntensity',     'gradientIntensity'],
	['uGlowAmount',            'glowAmount'],
	['uVignetteAmount',        'vignetteAmount'],
	['uContrast',              'contrast'],
	['uBrightness',            'brightness'],
	['uOpacity',               'opacity'],
	['uChromaticAberration',   'chromaticAberration'],
	['uEdgeSoftness',          'edgeSoftness'],
	['uBlurAmount',            'blurAmount'],
	['uHexScale',              'hexScale'],
];

const COLOR_UNIFORMS = [
	['uBgColor',        'backgroundColor'],
	['uPrimaryColor',   'primaryGradientColor'],
	['uSecondaryColor', 'secondaryGradientColor'],
];

function updateSmoothedUniforms(dt) {
	const u = renderState.uniforms;
	const smoothing = clamp(params.smoothing, 0.02, 1);
	const k = smoothing * 8;
	const t = 1 - Math.exp(-dt * k);

	for (const [uniformKey, paramKey] of SMOOTHED_NUMERIC) {
		const target = params[paramKey];
		const cur = u[uniformKey].value;
		u[uniformKey].value = cur + (target - cur) * t;
	}

	// Mode is integer — set it directly. The neighboring distortion fields
	// already smooth, so this rarely visually pops on its own.
	u.uMode.value = distortionModeIndex(params.distortionMode);

	// Combined mouse influence — interactionStrength acts as a multiplier.
	const targetInfl = clamp(params.mouseInfluence * params.interactionStrength, 0, 4);
	u.uMouseInfluence.value = u.uMouseInfluence.value + (targetInfl - u.uMouseInfluence.value) * t;

	// Colors — lerp in RGB space.
	for (const [uniformKey, paramKey] of COLOR_UNIFORMS) {
		const target = tmpColor.set(params[paramKey]);
		u[uniformKey].value.lerp(target, t);
	}

	renderState.scene.background = u.uBgColor.value;

	// Bloom strength — eased separately on the post pass.
	const bp = renderState.bloomPass;
	bp.strength = bp.strength + (params.bloomIntensity - bp.strength) * t;

	u.uDebugView.value = params.debugView ? 1 : 0;
}

// ─── Frame loop ────────────────────────────────────────────────────────────
function animate() {
	requestAnimationFrame(animate);

	const now = performance.now() / 1000;
	let dt = now - lastTime;
	lastTime = now;
	dt = Math.min(dt, 1 / 15); // clamp to avoid huge steps after tab focus

	const fps = params.fpsLimit;
	if (fps && fps > 0) {
		const target = 1 / fps;
		frameAccumulator += dt;
		if (frameAccumulator < target) return;
		// Use the accumulated time as effective dt so smoothing matches the actual interval.
		dt = frameAccumulator;
		frameAccumulator = 0;
	}

	if (!params.paused) {
		renderState.uniforms.uTime.value += dt;
	}

	interaction.update(dt);
	const m = interaction.get();
	renderState.uniforms.uMouse.value.set(m.x, m.y);
	renderState.uniforms.uMouseActive.value = m.active;

	updateSmoothedUniforms(dt);
	renderState.render();
}

function clamp(v, lo, hi) {
	return Math.max(lo, Math.min(hi, v));
}

// Sync the renderer state with the (preset-applied) params on first frame.
applyPresetToParams(params, params.preset);
syncUniformsImmediate();
animate();

/**
 * Snap all uniforms to their param targets without easing — used once on
 * boot so the very first rendered frame matches the current preset
 * exactly instead of starting from default mid-values.
 */
function syncUniformsImmediate() {
	const u = renderState.uniforms;
	for (const [uniformKey, paramKey] of SMOOTHED_NUMERIC) {
		u[uniformKey].value = params[paramKey];
	}
	u.uMode.value = distortionModeIndex(params.distortionMode);
	u.uMouseInfluence.value = clamp(params.mouseInfluence * params.interactionStrength, 0, 4);
	for (const [uniformKey, paramKey] of COLOR_UNIFORMS) {
		u[uniformKey].value.set(params[paramKey]);
	}
	renderState.scene.background = u.uBgColor.value;
	renderState.bloomPass.strength = params.bloomIntensity;
	u.uDebugView.value = params.debugView ? 1 : 0;
}
