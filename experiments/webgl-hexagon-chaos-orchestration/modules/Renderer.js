/**
 * Three.js renderer setup with a fullscreen shader quad and
 * an UnrealBloom post-processing chain for the soft halo bloom.
 *
 * The shader samples a hexagon texture (Hexagon.png) at distorted UV
 * coordinates — the texture provides the canonical form, the shader
 * provides the chaos-to-order motion.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { HEX_VERTEX_SHADER, HEX_FRAGMENT_SHADER } from './Shaders.js';

const FULLSCREEN_QUAD_SIZE = 2;
// Resolve next to this module so paths stay correct when the experiment is embedded
// in the lab layout (document URL is /slug/… not /experiments/slug/…).
const HEX_TEXTURE_URL = new URL('../Hexagon.png', import.meta.url).href;

export function createRenderer(container, params) {
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(params.backgroundColor);

	// Bulletproof fullscreen-quad camera: plane at z=0 lands in the middle
	// of the view frustum, no near/far precision games to worry about.
	const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);

	const renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: false,
		powerPreference: 'high-performance',
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2) * params.resolutionScale);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	container.appendChild(renderer.domElement);

	// Texture — sampled at distorted UV by the fragment shader.
	const textureLoader = new THREE.TextureLoader();
	const texture = textureLoader.load(
		HEX_TEXTURE_URL,
		(tex) => {
			tex.colorSpace = THREE.SRGBColorSpace;
			uniforms.uTextureAspect.value.set(tex.image.width, tex.image.height);
			uniforms.uTextureLoaded.value = 1;
		},
		undefined,
		(err) => {
			console.warn('[hexagon] failed to load Hexagon.png', err);
		}
	);
	texture.wrapS = THREE.ClampToEdgeWrapping;
	texture.wrapT = THREE.ClampToEdgeWrapping;
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
	texture.generateMipmaps = false;

	const uniforms = createUniforms(params, texture);

	const material = new THREE.ShaderMaterial({
		vertexShader: HEX_VERTEX_SHADER,
		fragmentShader: HEX_FRAGMENT_SHADER,
		uniforms,
		transparent: false,
		depthTest: false,
		depthWrite: false,
	});

	const geometry = new THREE.PlaneGeometry(FULLSCREEN_QUAD_SIZE, FULLSCREEN_QUAD_SIZE);
	const mesh = new THREE.Mesh(geometry, material);
	mesh.frustumCulled = false; // fullscreen quad — never cull regardless of camera framing
	scene.add(mesh);

	// Composer chain: render → bloom → output.
	const composer = new EffectComposer(renderer);
	composer.setPixelRatio(Math.min(window.devicePixelRatio, 2) * params.resolutionScale);
	composer.setSize(window.innerWidth, window.innerHeight);

	const renderPass = new RenderPass(scene, camera);
	composer.addPass(renderPass);

	const bloomPass = new UnrealBloomPass(
		new THREE.Vector2(window.innerWidth, window.innerHeight),
		params.bloomIntensity,
		0.85,
		0.2
	);
	composer.addPass(bloomPass);

	const outputPass = new OutputPass();
	composer.addPass(outputPass);

	function setSize(w, h) {
		renderer.setSize(w, h);
		composer.setSize(w, h);
		uniforms.uResolution.value.set(w, h);
		bloomPass.setSize(w, h);
	}

	function setResolutionScale(scale) {
		const px = Math.min(window.devicePixelRatio, 2) * scale;
		renderer.setPixelRatio(px);
		composer.setPixelRatio(px);
	}

	function render() {
		composer.render();
	}

	function dispose() {
		geometry.dispose();
		material.dispose();
		texture.dispose();
		renderer.dispose();
		composer.dispose();
	}

	return {
		scene,
		camera,
		renderer,
		composer,
		bloomPass,
		mesh,
		material,
		uniforms,
		texture,
		setSize,
		setResolutionScale,
		render,
		dispose,
	};
}

function createUniforms(p, texture) {
	return {
		uTime:                  { value: 0 },
		uResolution:            { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
		uMouse:                 { value: new THREE.Vector2(0.5, 0.5) },
		uMouseActive:           { value: 0 },

		uTexture:               { value: texture },
		uTextureAspect:         { value: new THREE.Vector2(1, 1) },
		uTextureLoaded:         { value: 0 },
		uHexScale:              { value: p.hexScale },

		uMode:                  { value: 0 },
		uDistortionStrength:    { value: p.distortionStrength },
		uDistortionScale:       { value: p.distortionScale },
		uDistortionSpeed:       { value: p.distortionSpeed },
		uAnimationIntensity:    { value: p.animationIntensity },
		uNoiseInfluence:        { value: p.noiseInfluence },
		uTurbulenceAmount:      { value: p.turbulenceAmount },
		uDisplacementAmplitude: { value: p.displacementAmplitude },
		uDisplacementFrequency: { value: p.displacementFrequency },

		uFlowSpeedX:            { value: p.flowSpeedX },
		uFlowSpeedY:            { value: p.flowSpeedY },
		uOscillationSpeed:      { value: p.oscillationSpeed },
		uOscillationAmplitude:  { value: p.oscillationAmplitude },
		uDriftAmount:           { value: p.driftAmount },
		uBreathingSpeed:        { value: p.breathingSpeed },

		uOrderRadius:           { value: p.orderRadius },
		uMouseInfluence:        { value: p.mouseInfluence },
		uInteractionFalloff:    { value: p.interactionFalloff },

		uBgColor:               { value: new THREE.Color(p.backgroundColor) },
		uPrimaryColor:          { value: new THREE.Color(p.primaryGradientColor) },
		uSecondaryColor:        { value: new THREE.Color(p.secondaryGradientColor) },
		uGradientIntensity:     { value: p.gradientIntensity },
		uGlowAmount:            { value: p.glowAmount },
		uVignetteAmount:        { value: p.vignetteAmount },
		uContrast:              { value: p.contrast },
		uBrightness:            { value: p.brightness },
		uOpacity:               { value: p.opacity },
		uChromaticAberration:   { value: p.chromaticAberration },
		uEdgeSoftness:          { value: p.edgeSoftness },
		uBlurAmount:            { value: p.blurAmount },

		uDebugView:             { value: 0 },
	};
}
