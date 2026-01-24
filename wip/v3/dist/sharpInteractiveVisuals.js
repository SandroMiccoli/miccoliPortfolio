// Sharp Interactive Visuals by Sandro Miccoli (sandromiccoli.com)

/////////////////////////////////////
// sketch.js
/////////////////////////////////////

	let DEBUG = false;

	// let quadtree;
	// let boundary;
	let capacity = 1;

	let particles = [];
	let numParticles = 1000;
	let maxParticlesConnections=30;

	let imgs=[];
	let totalImages=7;
	let currentImg=0;
	let img;
	let brightestPixels;
	let randomBrightPixel;

	let finalImageCanvasPG;
	let amountOfDots=0;

	let effectImageCanvasPG;

	let lastSwitchTime = 0; // Keeps track of the last time the image was updated
	let interval = 9500; // Interval in milliseconds (3 seconds)

	let startTransition = false;
	let transition=0;

	let videoElement;

	let isMobileDevice=false;

	let horizontalPosition = 0.7;
	let verticalPosition = 0.6;

	function preload() {
	  // mobile
	  isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	  console.log('Is Mobile Device:', isMobileDevice);

	  if(!isMobileDevice){
	    for(let i=1; i<=totalImages; i++){
	      img = loadImage('img00'+i+'.jpeg'); // Replace with your image path  
	      // print(img.width, img.height)
	      // print(img.width, img.height)
	      imgs.push(img);
	    }
	  }
	  else{
	    // Create a video element and play it
	    videoElement = createVideo("SharpCharacter.mp4",muteVideo); // Replace with actual video path
	  }
	  
	}

	function gaussianRandom(mean, sd) {
	    let u = 0, v = 0;
	    while (u === 0) u = Math.random(); // Avoid zero
	    while (v === 0) v = Math.random();
	    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
	    return z * sd + mean;
	}

	// Function to find the brightest pixels with a sensitivity threshold
	function findBrightestPixels(img, sensitivity = 0.2) {
	  print(windowWidth)

	  // Scale up image for higher resolutions
	  if(windowWidth>1920)
	    img.resize(1280,0)
	  print(img.width, img.height)

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
	        brightestPixels.push([x+(width*horizontalPosition-img.width/2), y+(height*verticalPosition-img.height/2), brightness]);
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

	// Mute the video once it loads.
	function muteVideo() {
	  print("MUTE VIDEO")
	  videoElement.volume(0);
	  videoElement.hideControls();
	  videoElement.autoplay(true);
	  videoElement.play();
	}

	function setup() {
	  // mobile
	  isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	  console.log('Is Mobile Device:', isMobileDevice);

	  if(isMobileDevice){

	    // Hide the canvas (if created)
	    noCanvas();

	    videoElement.size(windowWidth, windowHeight);
	    videoElement.position(0, 0);
	    videoElement.style("object-fit", "cover");
	    videoElement.autoplay(true);
	    videoElement.loop(); // Make it loop
	    // videoElement.showControls(); // Optional: Show play/pause controls
	  }
	  else{
	    createCanvas(windowWidth, windowHeight);
	    finalImageCanvasPG = createGraphics(windowWidth, windowHeight);
	    effectImageCanvasPG = createGraphics(windowWidth, windowHeight, P2D);
	  
	    finalImageCanvasPG.drawingContext.willReadFrequently = true;
	    effectImageCanvasPG.drawingContext.willReadFrequently = true;
	  
	  
	    // noCursor();
	    initCursor();
	    currentImg=0;
	    brightestPixels = findBrightestPixels(imgs[currentImg]);
	    randomBrightPixel = getRandomBrightPixel(brightestPixels);
	    console.log('Random Bright Pixel:', randomBrightPixel);
	  
	    for (let i = 0; i < numParticles; i++) {
	      randomBrightPixel = getRandomBrightPixel(brightestPixels);
	      let x = gaussianRandom(width / 2, width / 20); // Mean and standard deviation
	      let y = gaussianRandom(height / 2, height / 10);
	      particles.push(new Particle(constrain(randomBrightPixel[0], 0, width), constrain(randomBrightPixel[1], 0, height),randomBrightPixel[2]));
	    }
	  
	    updateImage();
	  }
	}

	function draw() {
	  if(!isMobileDevice){
	    let alpha=75;
	    background(0,alpha);
	    transitionImage();
	    particles = particles.filter(particle => particle.life >= 0);
	  
	    // Update particles
	    for (let i = 0; i < particles.length; i++) {
	      // let p = new Point(particles[i].x, particles[i].y, particles[i]);
	      // quadtree.insert(p);
	      
	      // Attract to bright spots
	      particles[i].run();
	      particles[i].connected = false;
	      particles[i].finalState=false;
	      particles[i].connections = 0;
	    }
	  
	    // Spawn new particles if needed
	    while (particles.length < numParticles) {
	      randomBrightPixel = getRandomBrightPixel(brightestPixels);
	      particles.push(new Particle(constrain(randomBrightPixel[0], 0, width), constrain(randomBrightPixel[1], 0, height),randomBrightPixel[2],true));
	    }
	  
	  
	    image(finalImageCanvasPG,0,0);
	    // print("Amount of dots: "+amountOfDots);
	  
	    numParticles = constrain(map(amountOfDots,0,75000,500,5),5,500);
	    // print("Num Particles: "+str(int(numParticles)));
	    if(numParticles==5){
	      updateImage();
	    }
	  // 
	    drawCursor();
	  
	  
	    // Check if 3 seconds have passed since the last switch
	    if (millis() - lastSwitchTime > interval) {
	      if(DEBUG) print("Timer switch!")
	      updateImage();
	      lastSwitchTime = millis(); // Update the last switch time
	    }
	  
	    // reset timer when mouse moved
	    if(mouseX!=pmouseX || mouseY!=pmouseY){
	      lastSwitchTime = millis(); // Update the last switch time
	    }
	  
	  
	    if (DEBUG) {
	      // quadtree.display();
	      if (frameCount % 2 == 0) {
	        push();
	        textSize(90);
	        noStroke();
	        fill(255, 125);
	        text(int(frameRate()), width - 200, 100);
	        pop();
	  
	        push();
	        stroke(0,205,0,150)
	        line(width/2,0,width/2,height);
	        line(0,height/2,width,height/2);
	        pop();
	      }
	    }
	  }
	}


	function keyPressed() {
	  if (key == "d") DEBUG = !DEBUG;
	  if (DEBUG) print("DEBUG ON");
	  else print("DEBUG OFF");
	}

	function mouseClicked(){
	  print("CLICK MOUSE!")

	  if(!isMobileDevice){
	    lastSwitchTime = millis(); // Update the last switch time
	    updateImage();
	  }

	}

	function transitionImage() {
	  if (startTransition){
	    finalImageCanvasPG.push();
	    finalImageCanvasPG.fill(0,transition*25)
	    finalImageCanvasPG.noStroke();
	    finalImageCanvasPG.rect(0,0,width,height)
	    finalImageCanvasPG.pop();
	    transition+=0.1;
	  }
	  if(transition>1){
	    finalImageCanvasPG.clear();
	    startTransition=false;
	    transition=0;
	  }
	}

	function updateImage() {
	  startTransition=true;
	  amountOfDots=0;
	  brightestPixels = findBrightestPixels(imgs[currentImg]);
	  randomBrightPixel = getRandomBrightPixel(brightestPixels);

	  for (let i = 0; i < particles.length; i++) {
	    randomBrightPixel = getRandomBrightPixel(brightestPixels);
	    particles[i].setTarget(constrain(randomBrightPixel[0], 0, width), constrain(randomBrightPixel[1], 0, height));
	  }

	  effectImageCanvasPG.image(imgs[currentImg],width*horizontalPosition-imgs[currentImg].width/2,height*verticalPosition-imgs[currentImg].height/2);
	  effectImageCanvasPG.loadPixels();
	  
	  if (currentImg < totalImages - 1) {
	    currentImg += 1;
	  } else {
	    currentImg = 0;
	  }
	}

	function windowResized() {
	  print("Resize canvas!")
	    if(navigator.userAgent.indexOf("HeadlessChrome") == -1) {   
	      resizeCanvas(windowWidth, windowHeight);
	      if(!isMobileDevice){
	        finalImageCanvasPG.resizeCanvas(windowWidth, windowHeight);
	        effectImageCanvasPG.resizeCanvas(windowWidth, windowHeight);
	        brightestPixels = findBrightestPixels(imgs[currentImg]);
	        updateImage();
	      }
	      // boundary = new Rect(width / 2, height / 2, width / 2, height / 2);
	      // quadtree = new QuadTree(boundary, capacity);
	      // background(255,0,0);
	    }
	}


/////////////////////////////////////
// cursor.js
/////////////////////////////////////
	let cursorX, cursorY; // Smooth cursor position
	let outterX, outterY; // Smooth outer cursor position
	let mouseXPos, mouseYPos; // Mouse position
	let maxMouseCapture = 150; // Max amount of particles for mouse to capture

	let mouseActive=0;
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
	  for (let i = 0; i < 10; i++) {
	    orbitingParticles.push({
	      x: mouseXPos+random(-150,150), // Initial x position
	      y: mouseYPos+random(-150,150), // Initial y position
	      angle: random(TWO_PI), // Initial angle for orbit
	      radius: random(5, 10), // Initial orbit radius
	      speed: random(0.005, 0.02), // Speed of orbit
	      size: random(1, 3), // Size of the particle
	      vx: 0, // Velocity in x direction
	      vy: 0, // Velocity in y direction
	      attractionStrength: random(0.0125, 0.05), // How strongly it is attracted to the cursor
	    });
	  }
	}



	function drawCursor() {
	  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
	    // let range = new Circle(mouseX, mouseY, 50);

	    // Smoothly interpolate cursor positions using easing
	    cursorX += (mouseXPos - cursorX) * 0.075;
	    cursorY += (mouseYPos - cursorY) * 0.075;

	    outterX += (mouseXPos - outterX) * 0.95;
	    outterY += (mouseYPos - outterY) * 0.95;

	    push();

	    // // Draw inner cursor
	    // fill(255, 255, 230, 150 );
	    // noStroke();
	    // ellipse(cursorX, cursorY, 7);

	    // // Draw outer cursor
	    // noFill();
	    // stroke(255, 255, 230, 150);
	    // strokeWeight(1);
	    // circle(range.x, range.y, range.r * 2);
	    // pop();


	    // Draw close oscilating particles
	    push();
	    fill(255,255,180,150);
	    noStroke();
	    for(let a=0; a<TWO_PI; a+=TWO_PI/10){
	      let r=sin(frameCount*0.0125667+cos(frameCount*0.0255123+2+a)+a+5+noise(a))*40;
	      let aInc = sin(frameCount*0.01+a*2)*2;
	      circle(cursorX+sin(a+aInc)*r,cursorY+cos(a+aInc)*r,3);
	    }
	    pop();

	    // draw orbiting particles
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
	      push();
	      noStroke();
	      fill(255, 255, 202, 100); // Yellow particles
	      ellipse(p.x, p.y, p.size, p.size);
	      pop()
	    });

	    // paint over
	    if(mouseActive>50){
	      for(let i=0; i<50; i++){
	          let angle = random(TWO_PI); // Random angle between 0 and 2π
	          let radius = random(50);    // Random radius between 0 and 50
	          let closeToCursorX = int(cursorX + cos(angle) * radius);
	          let closeToCursorY = int(cursorY + sin(angle) * radius);
	          let pixelColor = effectImageCanvasPG.get(closeToCursorX, closeToCursorY);
	          // pixelColor[2] *= 0.8;
	      
	          // Draw a circle with the same color on the finalImageCanvasPG graphics
	          finalImageCanvasPG.push();
	          finalImageCanvasPG.fill(50,20,pixelColor[0]/255*100,pixelColor[0]/255);
	          finalImageCanvasPG.noStroke();
	          finalImageCanvasPG.circle(closeToCursorX, closeToCursorY, random(1,5)); // Adjust the size of the circle as needed
	          finalImageCanvasPG.pop();
	          amountOfDots+=1;
	        }
	      }
	  }
	}



	// Track mouse movements
	function mouseMoved() {
	  mouseXPos = mouseX;
	  mouseYPos = mouseY;
	  // print("Mouse moved!! "+lastSwitchTime)
	  lastSwitchTime = millis(); // Update the last switch time
	  mouseActive+=1;
	  // print(mouseActive)
	}


/////////////////////////////////////
// particle.js
/////////////////////////////////////

	class Particle {
	  constructor(x, y, _inputState, mouse=false) {
	    this.life = random(1,50);
	    this.lifeInc = random(0.05,0.1);
	    this.x = x+random(-10,10);
	    this.y = y+random(-10,10);
	    if(random()>0.99){
	      this.x = x+random(-350,350);
	      this.y = y+random(-350,350); 
	    }
	    if(mouse && random()>0.9999 && mouseY!=0){
	      this.x = mouseX+random(-5,5);
	      this.y = mouseY+random(-5,5); 
	      this.r = random(2,4);
	    }
	    else{
	      this.r = random(1,2);
	    }
	    this.targetX = x; // Target bright pixel position
	    this.targetY = y;
	    this.range = 30;
	    this.vx = random(-0.05, 0.05);
	    this.vy = random(-0.05, 0.05);
	    this.noiseOffsetX = random(1000); // Offset for Perlin noise
	    this.noiseOffsetY = random(1000);

	    this.connected = false;
	    this.connections = 0;
	    this.maxConnections = 10;

	    this.finalState = false;

	    this.synapseActive = false;
	    this.synapse = 0;
	    this.synapseInc = random(0.05);

	    this.defaultColor = color('hsla(50, 20%, '+str(_inputState/255*100)+'%,'+str(_inputState/255)+')');
	    this.defaultColor.setAlpha(_inputState);
	    this.connectedColor = color(255,50);

	    this.inputState = _inputState;
	  }



	gravitateToTarget() {
	    let dx = this.targetX - this.x;
	    let dy = this.targetY - this.y;

	    // Calculate distance to the target
	    let distance = sqrt(dx * dx + dy * dy);

	    // If the particle is at the target, stop it
	    if (distance < 5.5) { // Threshold for stopping
	        this.vx = 0;
	        this.vy = 0;
	        this.finalState = true;
	        this.life=0;
	        this.display();
	        return; // Exit the function
	    }

	    // Adjust speed based on distance
	    let maxSpeed = 0.5; // Maximum speed when far from the target
	    let minSpeed = 0.15; // Minimum speed when close to the target
	    let speedFactor = map(distance, 0, 100, minSpeed, maxSpeed); // Map distance to speed range

	    // Calculate normalized direction to target
	    let angle = atan2(dy, dx);
	    this.vx = cos(angle) * speedFactor;
	    this.vy = sin(angle) * speedFactor;

	    // Apply velocity
	    this.x += this.vx;
	    this.y += this.vy;
	}


	  setTarget(x, y){
	    this.targetX = x;
	    this.targetY = y;
	  }


	  addTurbulence() {
	      // Adjust velocity using Perlin noise with balanced inputs
	      let turbulenceStrength = 0.0125; // Control intensity of turbulence
	      let noiseX = noise(this.noiseOffsetX, this.noiseOffsetY) - 0.5;
	      let noiseY = noise(this.noiseOffsetY, this.noiseOffsetX) - 0.5;

	      // Apply symmetrical noise
	      this.vx += noiseX * turbulenceStrength;
	      this.vy += noiseY * turbulenceStrength;

	      // Increment noise offsets independently
	      this.noiseOffsetX += 0.02; // Adjust per-frame change
	      this.noiseOffsetY += 0.03; // Use a slightly different increment

	      // Normalize velocity to prevent uncontrolled speed increase
	      let maxSpeed = 2.85; // Maximum allowed speed
	      let speed = sqrt(this.vx * this.vx + this.vy * this.vy);
	      if (speed > maxSpeed) {
	          this.vx = (this.vx / speed) * maxSpeed;
	          this.vy = (this.vy / speed) * maxSpeed;
	      }
	  }


	  checkEdges() {
	    // Revert velocity
	    // if (this.x > width || this.x < 0) this.vx *= -1;
	    // if (this.y > height || this.y < 0) this.vy *= -1;

	    // Teleport to other side
	    if (this.x > width) this.x = 1;
	    if (this.x < 0) this.x = width - 1;
	    if (this.y > height) this.y = 1;
	    if (this.y < 0) this.y = height - 1;
	  }

	  updateSinapse() {
	    if(random()>0.99) this.synapseActive=true;
	    this.synapse += this.synapseInc;
	    if (this.synapse > 1){
	      this.synapse = 0;
	      this.synapseActive=false;
	    }
	  }

	  collides(particle) {
	    let distance = dist(this.x, this.y, particle.x, particle.y);
	    if (distance <= this.r + particle.r) return true;
	    else return false;
	  }

	  insideRange(particle) {
	    let distance = dist(this.x, this.y, particle.x, particle.y);
	    if (distance <= this.range + particle.range) return true;
	    else return false;
	  }

	  attract(mx, my, mult=1) {
	    let forceStrength = 0.5*mult; // Strength of attraction
	    let dx = mx - this.x;
	    let dy = my - this.y;
	    let distance = dist(mx, my, this.x, this.y);
	    distance = constrain(distance, 1, 500); // Avoid overly strong or weak forces

	    // Calculate attraction force inversely proportional to distance
	    let force = forceStrength / distance;
	    this.vx += dx * force;
	    this.vy += dy * force;
	  }

	  applyBoundaryForce(centerX, centerY, areaType, size) {
	    let forceStrength = 0.00005; //0.0005; // Strength of the boundary force
	    let dx = centerX - this.x;
	    let dy = centerY - this.y;

	    if (areaType === "circle") {
	      let distance = sqrt(dx * dx + dy * dy);
	      if (distance > size / 2) {
	        let force = forceStrength * ((distance - size / 2) / distance);
	        this.vx += dx * force;
	        this.vy += dy * force;
	      }
	    } else if (areaType === "square") {
	      let halfSize = size / 2;
	      if (
	        this.x < centerX - halfSize ||
	        this.x > centerX + halfSize ||
	        this.y < centerY - halfSize ||
	        this.y > centerY + halfSize
	      ) {
	        this.vx += dx * forceStrength;
	        this.vy += dy * forceStrength;
	      }
	    }

	    if (DEBUG){
	      push();
	      rectMode(CENTER);
	      noFill();
	      stroke(0,255,0,20);
	      rect(centerX, centerY, size, size);
	      pop();
	    }
	  }
	  
	  applyConnectionGrowth(){
	    if(this.connected){
	      this.r = noise(frameCount*0.01+this.noiseOffsetX)*4;
	    }
	  }

	  updateLife(){
	    this.life -= this.lifeInc;
	  }

	  update() {
	    this.gravitateToTarget();
	    this.updateLife();
	    //this.updateSinapse();
	    this.addTurbulence();
	    // this.applyBoundaryForce(width*.5, height / 2, 'square', height*0.75);
	    // this.applyConnectionGrowth();
	    // this.checkEdges();
	    this.x += this.vx;
	    this.y += this.vy;
	  }
	  
	  display() {
	    push();
	    noStroke();
	    
	    if (!this.connected && this.finalState){
	      finalImageCanvasPG.noStroke();
	      finalImageCanvasPG.colorMode(HSB);
	      finalImageCanvasPG.fill(this.defaultColor);
	      finalImageCanvasPG.ellipse(this.x, this.y, this.r+random(1), this.r+random(1));
	      amountOfDots+=1;
	    }
	    else if (this.connected){ // mouse over
	      fill(255,255,222);
	      ellipse(this.x, this.y, this.r * 3, this.r * 3);
	    }
	    else {
	      fill(255,255,170,95); // moving
	      ellipse(this.x, this.y, this.r * 1.15, this.r * 1.15);
	    }

	    pop();

	    // display range
	    // push();
	    // noFill();
	    // stroke(255,255,0,100);
	    // ellipse(this.x, this.y, this.range*2, this.range*2);
	    // pop();
	  }

	  run() {
	    this.update();
	    this.display();
	  }
	}
