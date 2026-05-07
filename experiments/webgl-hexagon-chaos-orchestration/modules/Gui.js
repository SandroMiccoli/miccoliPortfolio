/**
 * lil-gui controls for the experiment.
 *
 * The GUI mutates a single `params` object in place. The animation loop
 * reads this object every frame and smoothly interpolates the shader
 * uniforms — meaning the GUI never needs to touch uniforms directly.
 */

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { PRESET_NAMES, applyPresetToParams } from './Presets.js';
import { DISTORTION_MODES } from './Shaders.js';

const FPS_OPTIONS = { '30': 30, '60': 60, '120': 120, 'Unlimited': 0 };

export function createGui(params, callbacks = {}) {
	const gui = new GUI({ title: 'Hexagon Chaos Orchestration' });

	gui.add(params, 'preset', PRESET_NAMES).name('preset').onChange((name) => {
		applyPresetToParams(params, name);
		if (callbacks.onPresetChange) callbacks.onPresetChange(name);
		gui.controllersRecursive().forEach((c) => c.updateDisplay());
	});

	gui.add(params, 'distortionMode', DISTORTION_MODES).name('distortion mode');

	const fGeneral = gui.addFolder('General');
	fGeneral.add(params, 'distortionStrength',    0,    1.5,  0.001);
	fGeneral.add(params, 'distortionScale',       0.2,  4,    0.01);
	fGeneral.add(params, 'distortionSpeed',       0,    2.5,  0.01);
	fGeneral.add(params, 'animationIntensity',    0,    1.6,  0.01);
	fGeneral.add(params, 'smoothing',             0.02, 1,    0.01);
	fGeneral.add(params, 'noiseInfluence',        0,    1,    0.01);
	fGeneral.add(params, 'turbulenceAmount',      0,    1,    0.01);
	fGeneral.add(params, 'relaxationSpeed',       0.05, 1,    0.01);
	fGeneral.add(params, 'orderRadius',           0.05, 2.5,  0.01).name('order radius');
	fGeneral.add(params, 'interactionStrength',   0,    2,    0.01);
	fGeneral.add(params, 'blurAmount',            0,    1.5,  0.01);
	fGeneral.add(params, 'gradientIntensity',     0,    1.5,  0.01);
	fGeneral.add(params, 'opacity',               0,    1,    0.01);
	fGeneral.add(params, 'bloomIntensity',        0,    1.5,  0.01);
	fGeneral.add(params, 'chromaticAberration',   0,    1.5,  0.01);
	fGeneral.add(params, 'edgeSoftness',          0.001, 0.08, 0.0005);
	fGeneral.add(params, 'displacementAmplitude', 0,    1.5,  0.01);
	fGeneral.add(params, 'displacementFrequency', 0.2,  3,    0.01);
	fGeneral.close();

	const fMotion = gui.addFolder('Motion');
	fMotion.add(params, 'flowSpeedX',           -1,   1,    0.01);
	fMotion.add(params, 'flowSpeedY',           -1,   1,    0.01);
	fMotion.add(params, 'oscillationSpeed',      0,   2,    0.01);
	fMotion.add(params, 'oscillationAmplitude',  0,   0.15, 0.001);
	fMotion.add(params, 'driftAmount',           0,   0.05, 0.0005);
	fMotion.add(params, 'breathingSpeed',        0,   2,    0.01);
	fMotion.close();

	const fVisual = gui.addFolder('Visual');
	fVisual.addColor(params, 'backgroundColor').name('background');
	fVisual.addColor(params, 'primaryGradientColor').name('primary');
	fVisual.addColor(params, 'secondaryGradientColor').name('secondary');
	fVisual.add(params, 'hexScale',       0.2,  1.0,  0.01).name('hex size');
	fVisual.add(params, 'glowAmount',     0,    1.5,  0.01);
	fVisual.add(params, 'vignetteAmount', 0,    1,    0.01);
	fVisual.add(params, 'contrast',       0.5,  1.6,  0.01);
	fVisual.add(params, 'brightness',     0.5,  1.6,  0.01);
	fVisual.close();

	const fInteract = gui.addFolder('Interaction');
	fInteract.add(params, 'mouseInfluence',     0,    1.5, 0.01);
	fInteract.add(params, 'interactionFalloff', 0.2,  4,   0.01);
	fInteract.add(params, 'easingAmount',       0.02, 1,   0.01);
	fInteract.add(params, 'snapBackSpeed',      0.02, 1,   0.01);
	fInteract.close();

	const fSystem = gui.addFolder('System');
	fSystem.add(params, 'resolutionScale', 0.4, 2, 0.05).name('resolution scale').onFinishChange(() => {
		if (callbacks.onResolutionChange) callbacks.onResolutionChange(params.resolutionScale);
	});
	fSystem.add(params, 'fpsLimit', FPS_OPTIONS).name('fps limit');
	fSystem.add(params, 'debugView').name('debug view');
	fSystem.add(params, 'paused').name('pause');
	fSystem.close();

	gui.close();

	return gui;
}
