class Particle {
  constructor(x, y, _inputState, mouse=false) {
    this.life = random(1,50);
    this.lifeInc = random(0.05,0.1);
    this.x = x;
    this.y = y;
    if(random()>0.98){
      this.x = x+random(-350,350);
      this.y = y+random(-350,350); 
    }
    this.targetX = x; // Target bright pixel position
    this.targetY = y;
    this.r = random(1,2);
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

    this.defaultColor = color(_inputState,_inputState);
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
    let maxSpeed = 0.75; // Maximum speed when far from the target
    let minSpeed = 0.25; // Minimum speed when close to the target
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
      finalImageCanvasPG.fill(this.defaultColor,50);
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
