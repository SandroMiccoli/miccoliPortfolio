// thanks to Patt Vira: https://www.youtube.com/watch?v=7pxyIC_ZEwA
let DEBUG = false;

let quadtree;
let boundary;
let capacity = 1;

let particles = [];
let numParticles = 150;
let maxParticlesConnections=30;

function setup() {
  createCanvas(windowWidth, windowHeight);
  noCursor();
  initCursor();

	// Define the grid center and dimensions
	let gridCenterX = width*0.55; // Center of the grid on the canvas (X-coordinate)
	let gridCenterY = height / 2; // Center of the grid on the canvas (Y-coordinate)
	let gridWidth = width * 0.2; // Total width of the grid
	let gridHeight = height * 0.2*16/9; // Total height of the grid

	// Calculate the number of rows and columns based on the number of particles
	let cols = Math.floor(Math.sqrt(numParticles)); // Number of columns
	let rows = Math.ceil(numParticles / cols); // Number of rows

	// Calculate spacing between particles
	let spacingX = gridWidth / (cols - 1);
	let spacingY = gridHeight / (rows - 1);

	// Create particles in the grid
	let index = 0;
	for (let row = 0; row < rows; row++) {
	  for (let col = 0; col < cols; col++) {
	    if (index >= numParticles) break;

	    // Calculate particle position
	    let x = gridCenterX - gridWidth / 2 + col * spacingX;
	    let y = gridCenterY - gridHeight / 2 + row * spacingY;

	    particles[index] = new Particle(x, y);
	    index++;
	  }
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

  // Check for proximity
  if (frameCount % int(random(1, 2)) == 0) {
	  for (let i = 0; i < particles.length; i++) {
	    let range = new Circle(
	      particles[i].x,
	      particles[i].y,
	      particles[i].range * 2
	    );
	    let foundPoints = [];
	    quadtree.query(range, foundPoints);
	    if(foundPoints.length<maxParticlesConnections) { // limit amount of found points for better performance
	    	for (let j = 0; j < foundPoints.length; j++) {
	  	      let p = foundPoints[j].userData;
	  	      if (particles[i] != p && particles[i].insideRange(p) && particles[i].connections<particles[i].maxConnections) {
	  	        particles[i].connected = true;
	  	        particles[i].connections+=1;
	  
	  	        // draw connection
	  	        push();
	  	        stroke(255,255, 220, 50);
	  	        strokeWeight(0.25);
	  	        line(particles[i].x, particles[i].y, p.x, p.y);
	  	        pop();
	  
	  	        // draw synapsis
	  	        if (particles[i].synapseActive){
  	  	        if (frameCount % int(random(1, 2)) == 0) {
  	  	        	push();
  	  	          stroke(255, 255, 180,55);
  	  	          let v0 = createVector(particles[i].x, particles[i].y);
  	  	          let v1 = createVector(p.x, p.y);
  	  	          v0.lerp(v1, particles[i].synapse);
  	  	          rect(v0.x, v0.y, 1, 1);
  	  	          pop();
  	  	        }
  	  	      }
	  	      }
	  	  }
    	}
	  }
  }  

  drawCursor();

  if (particles.length < numParticles){
    let x = gaussianRandom(width *0.55, width / 10); // Mean and standard deviation
    let y = gaussianRandom(height / 2, height / 10);
    particles.push(new Particle(constrain(x, 0, width), constrain(y, 0, height)));
  }

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

function gaussianRandom(mean, sd) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); // Avoid zero
    while (v === 0) v = Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * sd + mean;
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