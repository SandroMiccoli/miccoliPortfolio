// thanks to Patt Vira: https://www.youtube.com/watch?v=7pxyIC_ZEwA
let DEBUG = false;

let quadtree;
let boundary;
let capacity = 1;

let particles = [];
let numParticles = 150;

let mode = 1; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  noCursor();
  initCursor();

  for (let i = 0; i < numParticles; i++) {
    particles[i] = new Particle(random(width), random(height));
  }

  boundary = new Rect(width / 2, height / 2, width / 2, height / 2);
  quadtree = new QuadTree(boundary, capacity);
}

function draw() {
    // background(0,10);
  fill(0,0,0, int(255 / 3));
  noStroke();
  rectMode(CORNER);
  rect(0, 0, width, height);
  quadtree.clearQuadtree();
	  	
  if (mode==2){
  	particles = particles.filter(particle => particle.life >= 0);
  	if (frameCount % int(random(2, 15)) == 0) {
	  	if(particles.length<numParticles)
	  		particles.push(new Particle(mouseX, mouseY))
	  }
  }

  // Adds particles to quadtree
  for (let i = 0; i < particles.length; i++) {

    let p = new Point(particles[i].x, particles[i].y, particles[i]);
    quadtree.insert(p);
    particles[i].run();
    particles[i].collided = false;
    // print(p)
  }

  // Check for proximity
  // if (frameCount % int(random(2, 4)) == 0) {
	  for (let i = 0; i < particles.length; i++) {
	    let range = new Circle(
	      particles[i].x,
	      particles[i].y,
	      particles[i].range * 2
	    );
	    let foundPoints = [];
	    quadtree.query(range, foundPoints);
	    for (let j = 0; j < foundPoints.length; j++) {
	      let p = foundPoints[j].userData;
	      if (particles[i] != p && particles[i].insideRange(p)) {
	        particles[i].collided = true;

	        // draw connection
	        push();
	        stroke(255, 75);
	        strokeWeight(0.1);
	        line(particles[i].x, particles[i].y, p.x, p.y);
	        pop();

	        // draw synapsis
	        if (frameCount % int(random(10, 60)) == 0) {
	          stroke(255, 255, 240);
	          let v0 = createVector(particles[i].x, particles[i].y);
	          let v1 = createVector(p.x, p.y);
	          v0.lerp(v1, particles[i].sinapse);
	          rect(v0.x, v0.y, 1, 1);
	        }
	      }
	    }
	  }
  // }  

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

	if (key == '1') mode=1
	if (key == '2') mode=2
	print("Mode: "+mode);
  
	push();
	textSize(60);
	noStroke();
	fill(255,255)
	text("MODE "+mode,width/2,100);
	pop();

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