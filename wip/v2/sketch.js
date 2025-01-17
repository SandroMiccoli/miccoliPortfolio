// thanks to Patt Vira: https://www.youtube.com/watch?v=7pxyIC_ZEwA
let DEBUG = false;

let quadtree;
let boundary;
let capacity = 1;

let particles = [];
let numParticles = 1000;
let maxParticlesConnections=30;

function gaussianRandom(mean, sd) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); // Avoid zero
    while (v === 0) v = Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * sd + mean;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noCursor();
  initCursor();

  for (let i = 0; i < numParticles; i++) {
    let x = gaussianRandom(width / 2, width / 20); // Mean and standard deviation
    let y = gaussianRandom(height / 2, height / 10);
    particles[i] = new Particle(constrain(x, 0, width), constrain(y, 0, height));
  }

  boundary = new Rect(width / 2, height / 2, width / 2, height / 2);
  quadtree = new QuadTree(boundary, capacity);
}

function draw() {
  background(0,255 / 2);
  quadtree.clearQuadtree();
	  	
  particles = particles.filter(particle => particle.life >= 0);
  // Adds particles to quadtree
  for (let i = 0; i < particles.length; i++) {

    let p = new Point(particles[i].x, particles[i].y, particles[i]);
    quadtree.insert(p);
    particles[i].run();
    particles[i].connected = false;
    particles[i].connections=0;
    // print(p)
  }

  if (particles.length < numParticles){
    let x = gaussianRandom(width / 2, width / 10); // Mean and standard deviation
    let y = gaussianRandom(height / 2, height / 10);
    particles.push(new Particle(constrain(x, 0, width), constrain(y, 0, height)));
  }

  drawCursor();

  if (DEBUG) {
    quadtree.display();
    // print(frameRate());
    if(frameCount%2==0){
        push();
        textSize(90);
        noStroke();
        fill(255,125)
        text(int(frameRate()),width-200,100);
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