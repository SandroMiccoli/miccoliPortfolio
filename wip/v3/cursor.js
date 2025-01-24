let cursorX, cursorY; // Smooth cursor position
let outterX, outterY; // Smooth outer cursor position
let mouseXPos, mouseYPos; // Mouse position
let maxMouseCapture = 150; // Max amount of particles for mouse to capture

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

    for(let i=0; i<10; i++){
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
