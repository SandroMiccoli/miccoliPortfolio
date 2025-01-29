let cursorX, cursorY; // Smooth cursor position
let outterX, outterY; // Smooth outer cursor position
let mouseXPos, mouseYPos; // Mouse position
let maxMouseCapture = 150; // Max amount of particles for mouse to capture
let orbitingParticles = [];

function initCursor(){
  
  // Initialize positions at the center of the canvas
  mouseXPos = width / 2;
  mouseYPos = height / 2;

  cursorX = mouseXPos;
  cursorY = mouseYPos;

  outterX = mouseXPos;
  outterY = mouseYPos;

  initOrbitingParticles();
}

function initOrbitingParticles() {
  for (let i = 0; i < 50; i++) {
    orbitingParticles.push({
      x: random(width), // Initial x position
      y: random(height), // Initial y position
      angle: random(TWO_PI), // Initial angle for orbit
      radius: random(5, 20), // Initial orbit radius
      speed: random(0.005, 0.02), // Speed of orbit
      size: random(1, 3), // Size of the particle
      vx: 0, // Velocity in x direction
      vy: 0, // Velocity in y direction
      attractionStrength: random(0.05, 0.25), // How strongly it is attracted to the cursor
    });
  }
}



function drawCursor() {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    let range = new Circle(mouseX, mouseY, 50);
    let foundPoints = [];
    quadtree.query(range, foundPoints);

    // Smoothly interpolate cursor positions using easing
    cursorX += (mouseXPos - cursorX) * 0.075;
    cursorY += (mouseYPos - cursorY) * 0.075;

    outterX += (mouseXPos - outterX) * 0.95;
    outterY += (mouseYPos - outterY) * 0.95;

    push();

    // Draw inner cursor
    fill(255, 255, 230, 150 + (foundPoints.length / maxMouseCapture) * 255);
    noStroke();
    ellipse(cursorX, cursorY, 7);

    // Draw outer cursor
    noFill();
    stroke(255, 255, 230, 150 + (foundPoints.length / maxMouseCapture) * 255);
    strokeWeight(1);
    circle(range.x, range.y, range.r * 2);
    pop();


    // push();
    // fill(0,255,0,50);
    // noStroke();
    // for(let a=0; a<TWO_PI; a+=TWO_PI/10){
    //  circle(cursorX+sin(a)*(50*sin(noise(frameCount*0.5)+a*sin(frameCount*0.01))),cursorY+cos(a)*(50*sin(noise(frameCount*0.5)+a*sin(frameCount*0.01))),5) 
    // }
    // pop();

    // draw orbiting particles
    push();
    noStroke();
    fill(255, 255, 202, 100); // Yellow particles

    orbitingParticles.forEach(p => {
      // Attraction force towards cursor
      let dx = cursorX - p.x;
      let dy = cursorY - p.y;
      let distance = dist(p.x, p.y, cursorX, cursorY);
      let force = p.attractionStrength / (distance + 1); // Avoid division by zero

      // Update velocity based on attraction
      p.vx += dx * force;
      p.vy += dy * force;

      // Apply velocity limits to avoid excessive speed
      let maxSpeed = 2;
      let speed = sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > maxSpeed) {
        p.vx = (p.vx / speed) * maxSpeed;
        p.vy = (p.vy / speed) * maxSpeed;
      }

      // Update position with velocity
      p.x += p.vx;
      p.y += p.vy;

      // Oscillate around the orbit radius
      p.angle += p.speed;
      p.x += cos(p.angle) * p.radius * 0.05;
      p.y += sin(p.angle) * p.radius * 0.05;

      // Draw particle
      ellipse(p.x, p.y, p.size, p.size);
    });
    pop()

    // paint over
    for(let i=0; i<30; i++){
        let angle = random(TWO_PI); // Random angle between 0 and 2π
        let radius = random(50);    // Random radius between 0 and 50
        let closeToCursorX = int(cursorX + cos(angle) * radius);
        let closeToCursorY = int(cursorY + sin(angle) * radius);
        let pixelColor = effectImageCanvasPG.get(closeToCursorX, closeToCursorY);
    
        // Draw a circle with the same color on the finalImageCanvasPG graphics
        finalImageCanvasPG.push();
        finalImageCanvasPG.fill(pixelColor);
        finalImageCanvasPG.noStroke();
        finalImageCanvasPG.circle(closeToCursorX, closeToCursorY, random(1,5)); // Adjust the size of the circle as needed
        finalImageCanvasPG.pop();
      }
  }
}


function drawCursorFindQuadrtree() {
  // Find points in mouse range
  //   let range = new Rect(mouseX,mouseY,50,50);
  //   fill(0,255,0,50);
  //   stroke(0,255,0);
  //   rect(range.x,range.y,range.w*2,range.h*2);
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    let range = new Circle(mouseX, mouseY, 50);
    let foundPoints = [];
    quadtree.query(range, foundPoints);

    // Smoothly interpolate cursor positions using easing
    cursorX += (mouseXPos - cursorX) * 0.075;
    cursorY += (mouseYPos - cursorY) * 0.075;

    outterX += (mouseXPos - outterX) * 0.95;
    outterY += (mouseYPos - outterY) * 0.95;
    push();
    // Draw inner cursor
    fill(255,255,230,150+foundPoints.length/maxMouseCapture*255);
    noStroke();
    ellipse(cursorX, cursorY, 7);

    // Draw outer cursor
    noFill();
    stroke(255,255,230,150+foundPoints.length/maxMouseCapture*255);
    strokeWeight(1);
    circle(range.x, range.y, range.r * 2);
    pop();


    if (foundPoints.length<maxMouseCapture){
        for (let i = 0; i < foundPoints.length; i++) {
          let p = foundPoints[i].userData;


          // p.life=100;
          // p.lifeInc=0.25;
          // p.connected=true;
          // print(foundPoints.length,foundPoints.length/30*255);
          // p.attract(cursorX,cursorY,2);
          // push();
          // strokeWeight(0.5)
          // stroke(255,255,188,55);
          // line(cursorX,cursorY,p.x,p.y);
          // pop();
          
        }
      }
  }
}

// Track mouse movements
function mouseMoved() {
  mouseXPos = mouseX;
  mouseYPos = mouseY;
}
