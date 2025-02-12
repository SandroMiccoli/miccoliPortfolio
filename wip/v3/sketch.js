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
      img = loadImage('/wip/v3/img00'+i+'.jpeg'); // Replace with your image path  
      // print(img.width, img.height)
      // print(img.width, img.height)
      imgs.push(img);
    }
  }
  else{
    // Create a video element and play it
    videoElement = createVideo("/wip/v3/SharpCharacter.mp4",muteVideo); // Replace with actual video path
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
