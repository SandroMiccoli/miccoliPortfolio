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

  for (let i = 0; i < numParticles; i++) {
    particles[i] = new Particle(random(width*0.55,width*0.55), random(height*0.1,height*0.9));
  }

  boundary = new Rect(width / 2, height / 2, width / 2, height / 2);
  quadtree = new QuadTree(boundary, capacity);
}

function draw() {
  background(0,255,0,255 / 2);
  quadtree.clearQuadtree();
	  	
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