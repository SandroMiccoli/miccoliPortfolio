// thanks to Patt Vira: https://www.youtube.com/watch?v=7pxyIC_ZEwA
let DEBUG = false;

let quadtree;
let boundary;
let capacity = 1;

let particles = [];
let numParticles = 1000;
let maxParticlesConnections=30;

let img;
let brightestPixels;
let randomBrightPixel;

function preload() {
  img = loadImage('/wip/v3/img003.jpeg'); // Replace with your image path
}

function gaussianRandom(mean, sd) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); // Avoid zero
    while (v === 0) v = Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * sd + mean;
}

// Function to find the brightest pixels in an image
// Function to find the brightest pixels with a sensitivity threshold
function findBrightestPixels(img, sensitivity = 0.75) {
  img.loadPixels();
  let brightestValue = 0;
  let brightestPixels = [];

  // First pass: find the maximum brightness value
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let index = (x + y * img.width) * 4;
      let r = img.pixels[index];
      let g = img.pixels[index + 1];
      let b = img.pixels[index + 2];

      // Calculate brightness (perceived luminance)
      let brightness = 0.299 * r + 0.587 * g + 0.114 * b;

      if (brightness > brightestValue) {
        brightestValue = brightness;
      }
    }
  }

  // Calculate the threshold based on sensitivity
  let threshold = brightestValue * sensitivity;

  // Second pass: collect pixels meeting the brightness threshold
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let index = (x + y * img.width) * 4;
      let r = img.pixels[index];
      let g = img.pixels[index + 1];
      let b = img.pixels[index + 2];

      let brightness = 0.299 * r + 0.587 * g + 0.114 * b;

      if (brightness >= threshold) {
        brightestPixels.push([x+(width/2-img.width/2), y+(height/2-img.height/2)]);
      }
    }
  }

  return brightestPixels;
}


// Function to get a random bright pixel position
function getRandomBrightPixel(brightestPixels) {
  if (brightestPixels.length === 0) return null;
  return brightestPixels[Math.floor(Math.random() * brightestPixels.length)];
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noCursor();
  initCursor();

  brightestPixels = findBrightestPixels(img);
  randomBrightPixel = getRandomBrightPixel(brightestPixels);
  console.log('Random Bright Pixel:', randomBrightPixel);

  for (let i = 0; i < numParticles; i++) {
    randomBrightPixel = getRandomBrightPixel(brightestPixels);
    particles[i] = new Particle(constrain(randomBrightPixel[0], 0, width), constrain(randomBrightPixel[1], 0, height));
  }

  boundary = new Rect(width / 2, height / 2, width / 2, height / 2);
  quadtree = new QuadTree(boundary, capacity);


}

function draw() {
  background(0, 255 / 3);
  quadtree.clearQuadtree();

  particles = particles.filter(particle => particle.life >= 0);

  // Update particles
  for (let i = 0; i < particles.length; i++) {
    let p = new Point(particles[i].x, particles[i].y, particles[i]);
    quadtree.insert(p);
    
    // Attract to bright spots
    particles[i].run();
    particles[i].connected = false;
    particles[i].connections = 0;
  }

  // Spawn new particles if needed
  if (particles.length < numParticles) {
    randomBrightPixel = getRandomBrightPixel(brightestPixels);
    particles.push(new Particle(constrain(randomBrightPixel[0], 0, width), constrain(randomBrightPixel[1], 0, height)));
  }

  drawCursor();

  if (DEBUG) {
    quadtree.display();
    if (frameCount % 2 == 0) {
      push();
      textSize(90);
      noStroke();
      fill(255, 125);
      text(int(frameRate()), width - 200, 100);
      pop();
    }
  }
}


function keyPressed() {
	if (key == "d") DEBUG = !DEBUG;
	if (DEBUG) print("DEBUG ON");
	else print("DEBUG OFF");
}

const resize = () => {
	print("Resize canvas!")
    if(navigator.userAgent.indexOf("HeadlessChrome") == -1) {		
			resizeCanvas(windowWidth, windowHeight);
	    boundary = new Rect(width / 2, height / 2, width / 2, height / 2);
		  quadtree = new QuadTree(boundary, capacity);
			// background(255,0,0);
    }
}

window.addEventListener('resize', resize);