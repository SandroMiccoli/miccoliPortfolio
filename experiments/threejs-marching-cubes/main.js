// Three.js Marching Cubes — Futuristic Metaball Cube

import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import { ToonShader1, ToonShader2, ToonShaderHatching, ToonShaderDotted } from 'three/addons/shaders/ToonShader.js';

let container, stats, camera, scene, renderer;
let effect, resolution, gridHelper;
let materials, currentMaterial;
let light, pointLight, ambientLight;
let effectController;
let time = 0;

const TEXTURE_BASE = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/textures';

function init() {
	container = document.getElementById('canvas-container');

	// Camera — corner/isometric view (top-front-right)
	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
	const dist = 1200;
	camera.position.set(dist, dist, dist);
	camera.lookAt(0, 0, 0);

	// Scene — white background
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0xffffff);

	// Lights — neutral white for B&W
	light = new THREE.DirectionalLight(0xffffff, 2.5);
	light.position.set(0.5, 0.8, 1);
	scene.add(light);

	pointLight = new THREE.PointLight(0xffffff, 1.5, 800, 2);
	pointLight.position.set(200, 200, 300);
	scene.add(pointLight);

	const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
	fillLight.position.set(-0.5, 0.3, 0.5);
	scene.add(fillLight);

	ambientLight = new THREE.AmbientLight(0x404040, 1.2);
	scene.add(ambientLight);

	// Materials — all black and white
	materials = generateMaterials();
	currentMaterial = 'toon1';

	// Marching Cubes — cube-shaped metaball structure (enableColors for colors/multiColors)
	resolution = 52;
	effect = new MarchingCubes(resolution, materials[currentMaterial], false, true, 100000);
	effect.position.set(0, 0, 0);
	effect.scale.set(700, 700, 700);
	effect.enableUvs = false;
	effect.enableColors = true;
	scene.add(effect);

	// Background wireframe grid — structure behind metaballs
	gridHelper = createBackgroundGrid();
	scene.add(gridHelper);

	// Renderer
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setAnimationLoop(animate);
	container.appendChild(renderer.domElement);

	// Stats
	stats = new Stats();
	container.appendChild(stats.dom);

	// OrbitControls — target at center for corner view
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.target.set(0, 0, 0);
	controls.minDistance = 400;
	controls.maxDistance = 3000;
	controls.enableDamping = true;
	controls.dampingFactor = 0.05;

	// GUI
	setupGui();

	window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

// Hash for deterministic pseudo-noise per metaball
function hash3(i, j, k) {
	const s = i * 0.123 + j * 0.456 + k * 0.789;
	return Math.sin(s * 12.9898) * 43758.5453 % 1;
}

function createInfiniteGrid() {
	const vertexShader = `
		varying vec3 vWorldPosition;
		void main() {
			vec4 p = modelViewMatrix * vec4(position, 1.0);
			vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
			gl_Position = projectionMatrix * p;
		}
	`;
	const fragmentShader = `
		uniform vec3 uColor;
		uniform float uOpacity;
		varying vec3 vWorldPosition;
		void main() {
			float scale = 0.02;
			vec2 coord = vWorldPosition.xz * scale;
			vec2 g = abs(fract(coord - 0.5) - 0.5);
			float line = 1.0 - min(g.x * 80.0, 1.0) * min(g.y * 80.0, 1.0);
			float dist = length(vWorldPosition.xz);
			float fade = 1.0 - smoothstep(200.0, 1200.0, dist);
			float alpha = line * uOpacity * fade;
			gl_FragColor = vec4(uColor, alpha);
			if (alpha < 0.01) discard;
		}
	`;
	const material = new THREE.ShaderMaterial({
		vertexShader,
		fragmentShader,
		uniforms: {
			uColor: { value: new THREE.Color(0x999999) },
			uOpacity: { value: 0.3 },
		},
		transparent: true,
		depthWrite: false,
		side: THREE.DoubleSide,
	});
	const geo = new THREE.PlaneGeometry(4000, 4000);
	const mesh = new THREE.Mesh(geo, material);
	mesh.rotation.x = -Math.PI / 2;
	return mesh;
}

function createBackgroundGrid() {
	const group = new THREE.Group();

	// Wireframe box — larger cube outline behind metaballs
	const boxSize = 900;
	const boxGeo = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
	const boxEdges = new THREE.EdgesGeometry(boxGeo);
	const boxMaterial = new THREE.LineBasicMaterial({
		color: 0x999999,
		opacity: 0.4,
		transparent: true,
		depthWrite: false,
	});
	const boxWireframe = new THREE.LineSegments(boxEdges, boxMaterial);
	group.add(boxWireframe);

	// Infinite grid — extends to horizon
	group.add(createInfiniteGrid());

	return group;
}

function createShaderMaterial(shader, light, ambientLight) {
	const u = THREE.UniformsUtils.clone(shader.uniforms);
	const material = new THREE.ShaderMaterial({
		uniforms: u,
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader,
	});
	material.uniforms.uDirLightPos.value = light.position;
	material.uniforms.uDirLightColor.value = light.color;
	material.uniforms.uAmbientLightColor.value = ambientLight.color;
	// B&W: base and line colors
	material.uniforms.uBaseColor.value.set(0x333333);
	if (material.uniforms.uLineColor1) material.uniforms.uLineColor1.value.set(0x000000);
	if (material.uniforms.uLineColor2) material.uniforms.uLineColor2.value.set(0x000000);
	if (material.uniforms.uLineColor3) material.uniforms.uLineColor3.value.set(0x000000);
	if (material.uniforms.uLineColor4) material.uniforms.uLineColor4.value.set(0x000000);
	return material;
}

function generateMaterials() {
	const cubeTextureLoader = new THREE.CubeTextureLoader();
	const path = `${TEXTURE_BASE}/cube/SwedishRoyalCastle/`;
	const format = '.jpg';
	const urls = [
		path + 'px' + format, path + 'nx' + format,
		path + 'py' + format, path + 'ny' + format,
		path + 'pz' + format, path + 'nz' + format,
	];

	const reflectionCube = cubeTextureLoader.load(urls);
	const refractionCube = cubeTextureLoader.load(urls);
	refractionCube.mapping = THREE.CubeRefractionMapping;

	const toon1 = createShaderMaterial(ToonShader1, light, ambientLight);
	const toon2 = createShaderMaterial(ToonShader2, light, ambientLight);
	const hatching = createShaderMaterial(ToonShaderHatching, light, ambientLight);
	const dotted = createShaderMaterial(ToonShaderDotted, light, ambientLight);

	return {
		shiny: new THREE.MeshStandardMaterial({
			color: 0x333333,
			envMap: reflectionCube,
			roughness: 0.1,
			metalness: 1.0,
		}),
		chrome: new THREE.MeshLambertMaterial({
			color: 0xffffff,
			envMap: reflectionCube,
		}),
		liquid: new THREE.MeshLambertMaterial({
			color: 0xffffff,
			envMap: refractionCube,
			refractionRatio: 0.85,
		}),
		matte: new THREE.MeshPhongMaterial({
			color: 0x333333,
			specular: 0x494949,
			shininess: 1,
		}),
		flat: new THREE.MeshLambertMaterial({
			color: 0x333333,
			flatShading: true,
		}),
		colors: new THREE.MeshPhongMaterial({
			color: 0xffffff,
			specular: 0xffffff,
			shininess: 2,
			vertexColors: true,
		}),
		multiColors: new THREE.MeshPhongMaterial({
			shininess: 2,
			vertexColors: true,
		}),
		plastic: new THREE.MeshPhongMaterial({
			color: 0x333333,
			specular: 0xc1c1c1,
			shininess: 250,
		}),
		toon1,
		toon2,
		hatching,
		dotted,
	};
}

function setupGui() {
	const createMaterialHandler = (id) => () => {
		currentMaterial = id;
		effect.material = materials[id];
		effect.enableColors = (id === 'colors' || id === 'multiColors');
	};

	effectController = {
		material: 'toon1',
		speed: 1.0,
		gridSize: 7,
		resolution: 52,
		isolation: 55,
		strength: 0.6,
		subtract: 6,
		breathAmp: 0,
		noiseAmp: 0.025,
		noiseFreq: 6,
		noiseSpeed: 0.2,
		orbitRadius: 0,
		pulseAmp: 0.4,
		spread: 0,
		floor: false,
		wallx: false,
		wallz: false,
		showGrid: true,
	};

	// Attach material handlers
	for (const m of Object.keys(materials)) {
		effectController[m] = createMaterialHandler(m);
	}

	const gui = new GUI({ title: 'Marching Cubes' });

	// Materials
	const matFolder = gui.addFolder('Materials');
	for (const m of Object.keys(materials)) {
		matFolder.add(effectController, m).name(m);
	}

	// Simulation
	const simFolder = gui.addFolder('Simulation');
	simFolder.add(effectController, 'speed', 0.1, 4.0, 0.1);
	simFolder.add(effectController, 'gridSize', 2, 10, 1).name('Grid size');
	simFolder.add(effectController, 'resolution', 16, 64, 2);
	simFolder.add(effectController, 'isolation', 40, 150, 5);
	simFolder.add(effectController, 'strength', 0.6, 2.0, 0.1);
	simFolder.add(effectController, 'subtract', 6, 24, 1);
	simFolder.add(effectController, 'breathAmp', 0, 0.12, 0.01).name('Breath amount');
	simFolder.add(effectController, 'noiseAmp', 0, 0.08, 0.005).name('Noise amount');
	simFolder.add(effectController, 'noiseFreq', 0.5, 6, 0.1).name('Noise frequency');
	simFolder.add(effectController, 'noiseSpeed', 0.2, 3, 0.1).name('Noise speed');
	simFolder.add(effectController, 'orbitRadius', 0, 0.08, 0.005).name('Orbit radius');
	simFolder.add(effectController, 'pulseAmp', 0, 0.4, 0.02).name('Pulse strength');
	simFolder.add(effectController, 'spread', 0, 0.08, 0.005).name('Spread');

	// Planes
	const planeFolder = gui.addFolder('Planes');
	planeFolder.add(effectController, 'floor');
	planeFolder.add(effectController, 'wallx');
	planeFolder.add(effectController, 'wallz');

	// Display
	const displayFolder = gui.addFolder('Display');
	displayFolder.add(effectController, 'showGrid').name('Show Grid').onChange((v) => {
		gridHelper.visible = v;
	});

	gui.close();
}

// Grayscale palette for multiColors (black to white)
const GRAYSCALE = [
	new THREE.Color(0x000000),
	new THREE.Color(0x333333),
	new THREE.Color(0x666666),
	new THREE.Color(0x999999),
	new THREE.Color(0xcccccc),
	new THREE.Color(0xeeeeee),
	new THREE.Color(0xffffff),
];

/**
 * Update marching cubes field with a cube-shaped metaball structure.
 * Metaballs are arranged in a grid with organic motion: breath, noise, orbit, pulse, spread.
 */
function updateCubes(object, t, params) {
	object.reset();

	const n = params.gridSize;
	const strengthNorm = params.strength / ((Math.sqrt(n * n * n) - 1) / 4 + 1);
	const useVertexColors = currentMaterial === 'colors' || currentMaterial === 'multiColors';

	// Cube bounds: keep metaballs in center (0.2–0.8) for a clean cube shape
	const minVal = 0.2;
	const maxVal = 0.8;
	const step = (maxVal - minVal) / Math.max(1, n - 1);

	for (let i = 0; i < n; i++) {
		for (let j = 0; j < n; j++) {
			for (let k = 0; k < n; k++) {
				// Base grid position
				let baseX = n === 1 ? 0.5 : minVal + i * step;
				let baseY = n === 1 ? 0.5 : minVal + j * step;
				let baseZ = n === 1 ? 0.5 : minVal + k * step;

				// Spread — random offset from perfect grid (deterministic per blob)
				const spreadX = (hash3(i + 1, j, k) - 0.5) * 2 * params.spread;
				const spreadY = (hash3(i, j + 1, k) - 0.5) * 2 * params.spread;
				const spreadZ = (hash3(i, j, k + 1) - 0.5) * 2 * params.spread;
				baseX += spreadX;
				baseY += spreadY;
				baseZ += spreadZ;

				// Phase for per-blob variation
				const phase = (i * 1.26 + j * 1.12 + k * 1.32) * 0.5;

				// Breath — gentle oscillation
				const breath = params.breathAmp * Math.sin(t * 0.8 + phase);
				const breathY = params.breathAmp * 0.6 * Math.cos(t * 0.7 + phase * 1.1);

				// Noise — organic eccentric displacement (multi-octave pseudo-noise)
				const nf = params.noiseFreq;
				const nt = t * params.noiseSpeed;
				const noiseX = params.noiseAmp * (
					Math.sin((i + nt) * nf) * Math.cos((j + nt * 0.7) * nf * 1.3) +
					Math.sin((k + nt * 0.5) * nf * 0.8) * 0.5
				);
				const noiseY = params.noiseAmp * (
					Math.cos((i + nt * 1.1) * nf * 0.9) * Math.sin((j + nt) * nf) +
					Math.cos((k + nt * 0.3) * nf * 1.2) * 0.5
				);
				const noiseZ = params.noiseAmp * (
					Math.sin((i + nt * 0.8) * nf * 1.1) * Math.sin((k + nt) * nf) +
					Math.cos((j + nt * 0.6) * nf * 0.7) * 0.5
				);

				// Orbit — circular motion around base position
				const orbitAngle = t * 1.2 + phase * 2;
				const orbitX = params.orbitRadius * Math.cos(orbitAngle);
				const orbitZ = params.orbitRadius * Math.sin(orbitAngle);
				const orbitY = params.orbitRadius * 0.5 * Math.sin(orbitAngle * 1.3);

				const ballx = baseX + breath + noiseX + orbitX;
				const bally = baseY + breathY + noiseY + orbitY;
				const ballz = baseZ + breath * 0.8 + noiseZ + orbitZ;

				// Pulse — strength varies per blob over time (changes whole structure)
				const pulsePhase = phase * 3 + t * 2.1;
				const pulse = 1 + params.pulseAmp * Math.sin(pulsePhase);
				const blobStrength = strengthNorm * pulse;

				if (useVertexColors) {
					const idx = (i + j + k) % GRAYSCALE.length;
					object.addBall(ballx, bally, ballz, blobStrength, params.subtract, GRAYSCALE[idx]);
				} else {
					object.addBall(ballx, bally, ballz, blobStrength, params.subtract);
				}
			}
		}
	}

	if (params.floor) object.addPlaneY(2, 12);
	if (params.wallz) object.addPlaneZ(2, 12);
	if (params.wallx) object.addPlaneX(2, 12);

	object.update();
}

function animate() {
	stats.begin();

	const delta = 0.016;
	time += delta * effectController.speed * 0.5;

	if (effectController.resolution !== resolution) {
		resolution = effectController.resolution;
		effect.init(Math.floor(resolution));
	}

	if (effectController.isolation !== effect.isolation) {
		effect.isolation = effectController.isolation;
	}

	updateCubes(effect, time, {
		gridSize: effectController.gridSize,
		strength: effectController.strength,
		subtract: effectController.subtract,
		breathAmp: effectController.breathAmp,
		noiseAmp: effectController.noiseAmp,
		noiseFreq: effectController.noiseFreq,
		noiseSpeed: effectController.noiseSpeed,
		orbitRadius: effectController.orbitRadius,
		pulseAmp: effectController.pulseAmp,
		spread: effectController.spread,
		floor: effectController.floor,
		wallx: effectController.wallx,
		wallz: effectController.wallz,
	});

	renderer.render(scene, camera);

	stats.end();
}

init();
