let cursorX, cursorY; // Smooth cursor position
let outterX, outterY; // Smooth outer cursor position
let mouseXPos, mouseYPos; // Mouse position

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
    let range = new Circle(mouseX, mouseY, 50);
    let foundPoints = [];
    quadtree.query(range, foundPoints);

    // Smoothly interpolate cursor positions using easing
    cursorX += (mouseXPos - cursorX) * 0.075;
    cursorY += (mouseYPos - cursorY) * 0.075;

    outterX += (mouseXPos - outterX) * 0.95;
    outterY += (mouseYPos - outterY) * 0.95;
    
    // Draw inner cursor
    fill(255, 250);
    noStroke();
    ellipse(cursorX, cursorY, 7);

    // Draw outer cursor
    noFill();
    stroke(255,255,230,25+foundPoints.length/50*255);
    strokeWeight(1);
    circle(range.x, range.y, range.r * 2);
    
    // fill(255,255,200,10);
    // let a = frameCount/60;
    // circle(range.x+range.r*cos(a), range.y+range.r*sin(a), 2);
    // circle(range.x+range.r*cos(-a), range.y+range.r*sin(-a), 2);

    for (let i = 0; i < foundPoints.length; i++) {
      let p = foundPoints[i].userData;
      // print(foundPoints.length,foundPoints.length/30*255);
      p.attract(cursorX,cursorY,1-foundPoints.length/25*0.9);
      
      strokeWeight(1)
      stroke(255,255,0,35);
      line(cursorX,cursorY,p.x,p.y);
      
    }
  }
}

// Track mouse movements
function mouseMoved() {
  mouseXPos = mouseX;
  mouseYPos = mouseY;
}
