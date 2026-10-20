import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export const BLOOM_LAYER = 1;

const COMPOSITE_VERT = `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const COMPOSITE_FRAG = `
uniform sampler2D tBloom;
varying vec2 vUv;
void main() {
	gl_FragColor = vec4(texture2D(tBloom, vUv).rgb, 1.0);
	#include <colorspace_fragment>
}
`;

function makeTarget(width, height) {
	const target = new THREE.WebGLRenderTarget(width, height, {
		depthBuffer: true,
		stencilBuffer: false,
		generateMipmaps: false,
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		format: THREE.RGBAFormat,
		type: THREE.HalfFloatType,
	});
	target.texture.colorSpace = THREE.LinearSRGBColorSpace;
	return target;
}

export function markBloom(root) {
	root.traverse((child) => {
		if (child.isMesh || child.isLine || child.isPoints) child.layers.set(BLOOM_LAYER);
	});
}

/**
 * Selective bloom. The caller draws only the hologram into the source target.
 * UnrealBloomPass blurs that target; the glow is added back on the canvas.
 */
export function createBloom(renderer) {
	const source = makeTarget(1, 1);
	const clear = new THREE.Color();
	const pass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.2, 0, 0.06);
	pass.renderToScreen = false;
	pass.highPassUniforms.smoothWidth.value = 0.14;

	const compositeMaterial = new THREE.ShaderMaterial({
		uniforms: { tBloom: { value: pass.renderTargetsHorizontal[0].texture } },
		vertexShader: COMPOSITE_VERT,
		fragmentShader: COMPOSITE_FRAG,
		depthTest: false,
		depthWrite: false,
		blending: THREE.CustomBlending,
		blendSrc: THREE.OneFactor,
		blendDst: THREE.OneFactor,
		blendEquation: THREE.AddEquation,
		transparent: true,
	});
	const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), compositeMaterial);
	quad.frustumCulled = false;
	const quadScene = new THREE.Scene();
	quadScene.add(quad);
	const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

	const bloom = {
		strength: pass.strength,
		radius: pass.radius,
		threshold: pass.threshold,
		resize(width, height) {
			const w = Math.max(1, width | 0);
			const h = Math.max(1, height | 0);
			source.setSize(w, h);
			pass.resolution.set(w, h);
			pass.setSize(w, h);
		},
		capture(draw) {
			pass.strength = bloom.strength;
			pass.radius = bloom.radius;
			pass.threshold = bloom.threshold;

			const alpha = renderer.getClearAlpha();
			renderer.getClearColor(clear);
			const previousTarget = renderer.getRenderTarget();
			const previousAutoClear = renderer.autoClear;

			renderer.setRenderTarget(source);
			renderer.setClearColor(0x000000, 1);
			renderer.autoClear = true;
			draw();
			pass.render(renderer, null, source, 0, false);

			renderer.setRenderTarget(previousTarget);
			renderer.setClearColor(clear, alpha);
			renderer.autoClear = previousAutoClear;
		},
		composite() {
			compositeMaterial.uniforms.tBloom.value = pass.renderTargetsHorizontal[0].texture;
			renderer.setRenderTarget(null);
			renderer.autoClear = false;
			renderer.render(quadScene, quadCamera);
		},
	};

	return bloom;
}
