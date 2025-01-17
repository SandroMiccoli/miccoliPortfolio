let cursorX, cursorY; // Smooth cursor position
let outterX, outterY; // Smooth outer cursor position
let mouseXPos, mouseYPos; // Mouse position
let maxMouseCapture = 100; // Max amount of particles for mouse to capture

function initCursor(){
  
  // Initialize positions at the center of the canvas
  mouseXPos = width / 2;
  mouseYPos = height / 2;

  cursorX = mouseXPos;
  cursorY = mouseYPos;

  outterX = mouseXPos;
  outterY = mouseYPos;
}

function drawCursor() {
  // Find points in mouse range
  //   let range = new Rect(mouseX,mouseY,50,50);
  //   fill(0,255,0,50);
  //   stroke(0,255,0);
  //   rect(range.x,range.y,range.w*2,range.h*2);
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    // Update and draw the range
    let currentRadius = updateRange(deltaTime);
    let range = new Circle(mouseX, mouseY, currentRadius);
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

    // print(foundPoints.length);
    if (foundPoints.length<maxMouseCapture){
        for (let i = 0; i < foundPoints.length; i++) {
          let p = foundPoints[i].userData;
          p.r = noise(frameCount*0.01+.0134)*5;
          p.range = 30;
          p.life=100;
          // print(foundPoints.length,foundPoints.length/30*255);
          p.attract(cursorX,cursorY,1-foundPoints.length/maxMouseCapture*1);
          push();
          strokeWeight(0.1)
          stroke(255,255,0,35);
          line(cursorX,cursorY,p.x,p.y);
          pop();
          
        }
      }
  }
}

let rangeRadius = 50; // Initial range radius
let maxMultiplier = 2; // Maximum multiplier for the radius
let rangeGrowthTime = 500; // Time to grow (in milliseconds)
let rangeStayTime = 50; // Time to stay at max size (in milliseconds)
let rangeShrinkTime = 400; // Time to shrink back (in milliseconds)
let rangeTimer = 0; // Timer to track the state
let isAnimating = false; // Animation state

function mousePressed() {
  if (!isAnimating) {
    isAnimating = true;
    rangeTimer = 0; // Reset the timer
  }
}

function updateRange(deltaTime) {
  if (isAnimating) {
    rangeTimer += deltaTime;

    // Calculate total animation time
    let totalTime = rangeGrowthTime + rangeStayTime + rangeShrinkTime;

    if (rangeTimer <= rangeGrowthTime) {
      // Growing phase
      let progress = rangeTimer / rangeGrowthTime;
      return rangeRadius * (1 + (maxMultiplier - 1) * progress);
    } else if (rangeTimer <= rangeGrowthTime + rangeStayTime) {
      // Staying at max size
      return rangeRadius * maxMultiplier;
    } else if (rangeTimer <= totalTime) {
      // Shrinking phase
      let progress = (rangeTimer - rangeGrowthTime - rangeStayTime) / rangeShrinkTime;
      return rangeRadius * (maxMultiplier - (maxMultiplier - 1) * progress);
    } else {
      // Reset to initial state
      isAnimating = false;
      return rangeRadius;
    }
  }

  return rangeRadius; // Default state
}

// Track mouse movements
function mouseMoved() {
  mouseXPos = mouseX;
  mouseYPos = mouseY;
}
