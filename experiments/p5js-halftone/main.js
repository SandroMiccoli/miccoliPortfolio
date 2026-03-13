const IMAGE_PATH = '/experiments/p5js-halftone/BX-NYC-Skyline.png';
const MAX_COLUMNS = 220;
const MIN_CELL_SIZE = 3;
const BACKGROUND_COLOR = [0, 0, 0];
const MIN_DOT_SCALE = 0.1;
const MAX_DOT_SCALE = 0.62;
const BRIGHTNESS_GAMMA = 1.2;
const ACCENT_THRESHOLD = 0.05;
const ANIMATION_SPEED = 0.05;
const SIZE_NOISE_INTENSITY = 0.7;
const TARGET_FRAME_RATE = 30;
const ANIMATED_POINT_RATIO = 0.05;

// Mouse influence on dot size
const MOUSE_INFLUENCE_RADIUS = 80;
const MOUSE_INFLUENCE_RADIUS_SQ = MOUSE_INFLUENCE_RADIUS * MOUSE_INFLUENCE_RADIUS;
const MOUSE_INFLUENCE_STRENGTH = 0.75;  // dots near cursor scale up by this factor
const MOUSE_INFLUENCE_FADE_POWER = 0.5;  // <1 = softer fade (extends influence toward edge), >1 = sharper
const MOUSE_OVERLAY_RADIUS_SQ = (MOUSE_INFLUENCE_RADIUS * 1.2) ** 2;  // buffer to avoid visible circle edge

// Perspective dotted floor — vertical lines receding to vanishing point
const FLOOR_VANISHING_Y_START = 0.53;    // start: horizon near top
const FLOOR_VANISHING_Y_END = 0.95;     // end: horizon lower (floor expands)
const FLOOR_FRONT_Y_RATIO = 1.05;       // front edge of floor
const FLOOR_COLUMN_COUNT_START = 100;          // number of vertical dotted lines
const FLOOR_COLUMN_COUNT_END = 100;          // number of vertical dotted lines
const FLOOR_DOTS_PER_COLUMN_START = 50;       // dots along each vertical line
const FLOOR_DOTS_PER_COLUMN_END = 25;       // dots along each vertical line
const FLOOR_SCROLL_SPEED = 0.0005;      // depth scroll for infinite feel
const FLOOR_OVERSCAN_X = 0.5;          // horizontal overscan at front (wider floor)
const FLOOR_DOT_SIZE_NEAR = 2.2;        // dot diameter at front
const FLOOR_DOT_SIZE_FAR = 0.3;         // dot diameter at horizon
const FLOOR_DOT_SIZE_SCALE_END = 2;   // final scale multiplier (larger dots)
const FLOOR_NOISE_AMOUNT = 2;        // noise variation intensity (0–1)
const FLOOR_FADE_POWER = 2.2;           // how sharply dots fade with distance

// GSAP intro animation timings (seconds)
const DURATION_FLOOR_LERP = 4.5;
const DURATION_HALFTONE_FADE = 2;
const DURATION_FLOOR_DOT_SIZE = 3;
const DURATION_HALFTONE_REVEAL = 3;   // bottom-to-top reveal
const HALFTONE_REVEAL_FADE_BAND = 0.08;  // smooth fade band (0–1 of height)

let sourceImage;
let animatedPoints = [];
let allHalftonePoints = [];
let staticLayer;
let cachedCellSize = MIN_CELL_SIZE;
let floorPatternBuffer;
let floorPerspectiveBuffer;
let halftoneBounds = { left: 0, top: 0, width: 0, height: 0, bottom: 0 };

// GSAP-animated state
const animState = {
	floorVanishingYRatio: FLOOR_VANISHING_Y_START,
	halftoneOpacity: 0,
	halftoneRevealProgress: 0,  // 0 = none visible, 1 = all visible (bottom-to-top)
	floorColumnCount: FLOOR_COLUMN_COUNT_START,
	floorDotSizeScale: 1,
	floorDotsPerColumn: FLOOR_DOTS_PER_COLUMN_START
};

function preload() {
	sourceImage = loadImage(IMAGE_PATH);
}

function setup() {
	const canvas = createCanvas(windowWidth, windowHeight);
	canvas.parent('app');
	pixelDensity(1);
	noStroke();
	frameRate(TARGET_FRAME_RATE);
	rebuildHalftoneCache();

	const tl = gsap.timeline();
	tl.to(animState, {
		floorVanishingYRatio: FLOOR_VANISHING_Y_END,
		duration: DURATION_FLOOR_LERP,
		ease: 'power2.inOut'
	}).to(animState, {
		halftoneOpacity: 1,
		duration: DURATION_HALFTONE_FADE,
		floorColumnCount: FLOOR_COLUMN_COUNT_END,
		ease: 'power2.inOut'
	}, '-=1.5').to(animState, {
		halftoneRevealProgress: 1,
		duration: DURATION_HALFTONE_REVEAL,
		ease: 'power2.inOut'
	}, '-=1.5').to(animState, {
		floorDotSizeScale: FLOOR_DOT_SIZE_SCALE_END,
		// floorDotsPerColumn: FLOOR_DOTS_PER_COLUMN_END,
		duration: DURATION_FLOOR_DOT_SIZE,
		ease: 'power2.inOut'
	}, '-=1.5').to(animState, {
		// floorDotsPerColumn: FLOOR_DOTS_PER_COLUMN_END,
		duration: 10,
		ease: 'power2.inOut'
	}, '-=10');
}

function draw() {
	background(...BACKGROUND_COLOR);

	if (animState.halftoneOpacity > 0.001 && allHalftonePoints.length > 0) {
		drawingContext.globalAlpha = animState.halftoneOpacity;
		renderHalftone();
		drawingContext.globalAlpha = 1;
	}

	drawPerspectiveDottedFloor();

	fill(255);
	push();
	fill(int(frameRate())>20?color(0,255,0):color(255,0,0));
	text("FPS: " + int(frameRate()), 10, 15);
	pop();
}

function rebuildHalftoneCache() {
	if (!sourceImage) {
		animatedPoints = [];
		allHalftonePoints = [];
		staticLayer = null;
		halftoneBounds = { left: 0, top: 0, width: 0, height: 0, bottom: 0 };
		return;
	}

	const imageAspect = sourceImage.width / sourceImage.height;
	const canvasAspect = width / height;

	let renderWidth;
	let renderHeight;

	if (imageAspect > canvasAspect) {
		renderWidth = width;
		renderHeight = renderWidth / imageAspect;
	} else {
		renderHeight = height;
		renderWidth = renderHeight * imageAspect;
	}

	cachedCellSize = max(MIN_CELL_SIZE, floor(renderWidth / MAX_COLUMNS));

	const cols = max(1, floor(renderWidth / cachedCellSize));
	const rows = max(1, floor(renderHeight / cachedCellSize));

	const sampleBuffer = createGraphics(cols, rows);
	sampleBuffer.pixelDensity(1);
	sampleBuffer.image(sourceImage, 0, 0, cols, rows);
	sampleBuffer.loadPixels();

	const offsetX = (width - cols * cachedCellSize) * 0.5;
	const offsetY = (height - rows * cachedCellSize) * 0.5;
	halftoneBounds = {
		left: offsetX,
		top: offsetY,
		width: cols * cachedCellSize,
		height: rows * cachedCellSize,
		bottom: offsetY + rows * cachedCellSize
	};
	const nextAnimatedPoints = [];
	const nextAllPoints = [];

	if (staticLayer) staticLayer.remove();
	staticLayer = createGraphics(width, height);
	staticLayer.pixelDensity(1);
	staticLayer.noStroke();
	staticLayer.background(...BACKGROUND_COLOR);

	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const pixelIndex = (row * cols + col) * 4;
			const red = sampleBuffer.pixels[pixelIndex];
			const green = sampleBuffer.pixels[pixelIndex + 1];
			const blue = sampleBuffer.pixels[pixelIndex + 2];
			const alpha = sampleBuffer.pixels[pixelIndex + 3];
			const isPureBlack = red === 0 && green === 0 && blue === 0;

			if (isPureBlack || alpha === 0) {
				continue;
			}

			const brightnessValue = 0.299 * red + 0.587 * green + 0.114 * blue;
			const tone = pow(brightnessValue / 255, BRIGHTNESS_GAMMA);
			const baseDiameter = lerp(
				cachedCellSize * MIN_DOT_SCALE,
				cachedCellSize * MAX_DOT_SCALE,
				tone
			);
			const x = offsetX + col * cachedCellSize + cachedCellSize * 0.5;
			const y = offsetY + row * cachedCellSize + cachedCellSize * 0.5;
			const revealT = halftoneBounds.height > 0
				? (y - halftoneBounds.top) / halftoneBounds.height
				: 1;  // bottom=1, top=0
			const patternSeed = ((row * 73856093) ^ (col * 19349663)) >>> 0;
			const selection = (patternSeed % 1000) / 1000;
			const phase = ((patternSeed >> 3) % 628) / 100;
			const speed = 0.8 + (((patternSeed >> 5) % 100) / 100) * 0.8;
			const accentVariation = ((patternSeed >> 7) % 100) / 100;
			const isAnimated = selection < ANIMATED_POINT_RATIO;
			const accentOffset = cachedCellSize * lerp(0.16, 0.24, tone);
			const s = patternSeed;
			const showAccent1 = ((s % 100) / 100) < 0.25 + tone * 0.45;
			const showAccent2 = (((s >> 6) % 100) / 100) < 0.2 + tone * 0.4;
			const angle1 = ((s >> 2) % 360) * (TWO_PI / 360);
			const angle2 = ((s >> 12) % 360) * (TWO_PI / 360);
			const mult1 = 0.85 + ((s >> 4) % 30) / 100;
			const mult2 = 1.2 + ((s >> 10) % 40) / 100;
			const baseGray = 0.299 * red + 0.587 * green + 0.114 * blue;
			const point = {
				x: x,
				y: y,
				revealT: revealT,
				alpha: alpha,
				baseDiameter: baseDiameter,
				accentOffset: accentOffset,
				accentBase: baseDiameter * lerp(0.22, 0.34, tone),
				hasAccent: tone >= ACCENT_THRESHOLD,
				phase: phase,
				speed: speed,
				accentVariation: accentVariation,
				isAnimated: isAnimated,
				showAccent1: showAccent1,
				showAccent2: showAccent2,
				accent1Dx: mult1 * cos(angle1),
				accent1Dy: mult1 * sin(angle1),
				accent2Dx: mult2 * cos(angle2),
				accent2Dy: mult2 * sin(angle2),
				gray1: constrain(lerp(60, 120, baseGray / 255), 60, 130),
				gray2: constrain(lerp(100, 180, baseGray / 255), 100, 180)
			};

			nextAllPoints.push(point);
			if (isAnimated) {
				nextAnimatedPoints.push(point);
			} else {
				renderClusterDot(staticLayer, point, baseDiameter, point.accentVariation);
			}
		}
	}

	animatedPoints = nextAnimatedPoints;
	allHalftonePoints = nextAllPoints;
	sampleBuffer.remove();
}

function getMouseSizeMultiplier(dotX, dotY) {
	const dx = mouseX - dotX;
	const dy = mouseY - dotY;
	const distSq = dx * dx + dy * dy;
	if (distSq >= MOUSE_INFLUENCE_RADIUS_SQ) return 1;
	const dist = sqrt(distSq);
	const normalizedDist = dist / MOUSE_INFLUENCE_RADIUS;
	const t = pow(max(0, 1 - normalizedDist), MOUSE_INFLUENCE_FADE_POWER);
	return 1 + t * MOUSE_INFLUENCE_STRENGTH;
}

function isWithinMouseInfluence(dotX, dotY) {
	const dx = mouseX - dotX;
	const dy = mouseY - dotY;
	return (dx * dx + dy * dy) < MOUSE_OVERLAY_RADIUS_SQ;
}

function getDotRevealAlpha(point) {
	const p = animState.halftoneRevealProgress;
	const t = point.revealT;
	return constrain((p + t + HALFTONE_REVEAL_FADE_BAND - 1) / HALFTONE_REVEAL_FADE_BAND, 0, 1);
}

function renderHalftone() {
	const minDiameter = cachedCellSize * MIN_DOT_SCALE;
	const maxDiameter = cachedCellSize * MAX_DOT_SCALE;
	const time = frameCount * ANIMATION_SPEED;
	const inReveal = animState.halftoneRevealProgress < 1;

	if (inReveal) {
		// During reveal: render all dots with per-dot fade-in from bottom to top
		for (const point of allHalftonePoints) {
			const revealAlpha = getDotRevealAlpha(point);
			if (revealAlpha <= 0.001) continue;

			const mouseScale = getMouseSizeMultiplier(point.x, point.y);
			let diameter = point.baseDiameter * mouseScale;

			if (point.isAnimated) {
				const pulse = sin(time * point.speed + point.phase);
				diameter = point.baseDiameter * mouseScale * (1 + pulse * SIZE_NOISE_INTENSITY);
			}

			diameter = constrain(diameter, minDiameter, maxDiameter * 1.4);
			const variation = point.isAnimated
				? constrain(point.accentVariation + sin(time * point.speed + point.phase) * 0.2, 0, 1)
				: point.accentVariation;

			const effectiveAlpha = point.alpha * revealAlpha;
			renderClusterDot(null, point, diameter, variation, effectiveAlpha);
		}
	} else {
		// After reveal: use static layer + overlay for performance
		if (staticLayer) {
			image(staticLayer, 0, 0);
		} else {
			background(...BACKGROUND_COLOR);
		}

		for (const point of allHalftonePoints) {
			const needsOverlay = point.isAnimated || isWithinMouseInfluence(point.x, point.y);
			if (!needsOverlay) continue;

			const mouseScale = getMouseSizeMultiplier(point.x, point.y);
			let diameter = point.baseDiameter * mouseScale;

			if (point.isAnimated) {
				const pulse = sin(time * point.speed + point.phase);
				diameter = point.baseDiameter * mouseScale * (1 + pulse * SIZE_NOISE_INTENSITY);
			}

			diameter = constrain(diameter, minDiameter, maxDiameter * 1.4);
			const variation = point.isAnimated
				? constrain(point.accentVariation + sin(time * point.speed + point.phase) * 0.2, 0, 1)
				: point.accentVariation;

			renderClusterDot(null, point, diameter, variation);
		}
	}
}

function drawPerspectiveDottedFloor() {
	const textureWidth = max(1, floor(width * (1 + FLOOR_OVERSCAN_X * 2)));
	const textureHeight = max(1, floor(height * 0.7));
	const scrollOffset = (frameCount * FLOOR_SCROLL_SPEED) % 1;

	if (!floorPatternBuffer || floorPatternBuffer.width !== textureWidth || floorPatternBuffer.height !== textureHeight) {
		if (floorPatternBuffer) {
			floorPatternBuffer.remove();
		}
		floorPatternBuffer = createGraphics(textureWidth, textureHeight);
		floorPatternBuffer.pixelDensity(1);
		floorPatternBuffer.noStroke();
	}

	if (!floorPerspectiveBuffer || floorPerspectiveBuffer.width !== width || floorPerspectiveBuffer.height !== height) {
		if (floorPerspectiveBuffer) {
			floorPerspectiveBuffer.remove();
		}
		floorPerspectiveBuffer = createGraphics(width, height, WEBGL);
		floorPerspectiveBuffer.pixelDensity(1);
		floorPerspectiveBuffer.noStroke();
	}

	floorPatternBuffer.clear();
	for (let col = 0; col < animState.floorColumnCount; col++) {
		const colT = animState.floorColumnCount <= 1 ? 0.5 : col / (animState.floorColumnCount - 1);
		const x = lerp(0, textureWidth, colT);
		const edgeFade = constrain(1 - abs(colT - 0.5) * 1.5, 0, 1);

		for (let i = 0; i < animState.floorDotsPerColumn; i++) {
			const depthT = (i / animState.floorDotsPerColumn + scrollOffset) % 1;
			const y = textureHeight - depthT * textureHeight;
			const baseDiameter = lerp(FLOOR_DOT_SIZE_NEAR, FLOOR_DOT_SIZE_FAR, depthT);
			const noiseVal = noise(col * 0.5, i * 0.2, frameCount * 0.015);
			const diameter = max(
				0.5,
				baseDiameter + (0.5 + noiseVal * FLOOR_NOISE_AMOUNT) * animState.floorDotSizeScale * 0.4
			);
			const alpha = 255 * pow(1 - depthT, FLOOR_FADE_POWER) * edgeFade;

			floorPatternBuffer.fill(255, alpha);
			floorPatternBuffer.circle(x, y, diameter);
		}
	}

	const tilt = map(
		animState.floorVanishingYRatio,
		FLOOR_VANISHING_Y_START,
		FLOOR_VANISHING_Y_END,
		PI * 0.17,
		PI * 0.56,
		true
	);
	const planeHeight = height * FLOOR_FRONT_Y_RATIO;
	const planeWidth = textureWidth;
	const verticalOffset = map(
		animState.floorVanishingYRatio,
		FLOOR_VANISHING_Y_START,
		FLOOR_VANISHING_Y_END,
		height * 0.06,
		height * 0.3,
		true
	);

	floorPerspectiveBuffer.clear();
	floorPerspectiveBuffer.push();
	floorPerspectiveBuffer.noStroke();
	floorPerspectiveBuffer.translate(0, verticalOffset, 0);
	floorPerspectiveBuffer.rotateX(tilt);
	floorPerspectiveBuffer.texture(floorPatternBuffer);
	floorPerspectiveBuffer.plane(planeWidth, planeHeight);
	floorPerspectiveBuffer.pop();

	if (animState.halftoneOpacity <= 0.9) {
		image(floorPerspectiveBuffer, 0, 0);
		return;
	}

	const floorTopY = constrain(halftoneBounds.bottom, 0, height);
	drawingContext.save();
	drawingContext.beginPath();
	drawingContext.rect(0, floorTopY, width, height - floorTopY);
	drawingContext.clip();
	image(floorPerspectiveBuffer, 0, 0);
	drawingContext.restore();
}

function renderClusterDot(target, point, diameter, variation, alphaOverride) {
	const alpha = alphaOverride !== undefined ? alphaOverride : point.alpha;
	if (target) {
		target.fill(255, 255, 255, alpha);
		target.circle(point.x, point.y, diameter);
	} else {
		fill(255, 255, 255, alpha);
		circle(point.x, point.y, diameter);
	}

	if (!point.hasAccent || (!point.showAccent1 && !point.showAccent2)) return;

	const accentBase = point.accentBase * (diameter / point.baseDiameter);
	const scaleA = lerp(0.8, 1.15, variation);
	const scaleB = lerp(0.7, 1.05, 1 - variation);
	const a = alpha * 0.9;
	const ox = point.accentOffset;

	if (point.showAccent1) {
		const ax = point.x + ox * point.accent1Dx;
		const ay = point.y + ox * point.accent1Dy;
		const sz = max(1, accentBase * scaleA);
		if (target) {
			target.fill(point.gray1, point.gray1, point.gray1, a);
			target.circle(ax, ay, sz);
		} else {
			fill(point.gray1, point.gray1, point.gray1, a);
			circle(ax, ay, sz);
		}
	}
	if (point.showAccent2) {
		const ax = point.x + ox * point.accent2Dx;
		const ay = point.y + ox * point.accent2Dy;
		const sz = max(1, accentBase * 0.8 * scaleB);
		if (target) {
			target.fill(point.gray2, point.gray2, point.gray2, a);
			target.circle(ax, ay, sz);
		} else {
			fill(point.gray2, point.gray2, point.gray2, a);
			circle(ax, ay, sz);
		}
	}
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	rebuildHalftoneCache();
}
