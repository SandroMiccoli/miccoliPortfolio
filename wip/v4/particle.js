class Particle {
  constructor(x, y, _inputState, mouse=false) {
    this.life = random(1,50);
    this.lifeInc = random(0.05,0.1);
    this.x = x+random(-100,100);
    this.y = y+random(-100,100);
    if(random()>0.98){
      this.x = x+random(-350,350);
      this.y = y+random(-350,350); 
    }
    if(mouse && random()>0.95){ // shooting star particle
      this.x = mouseX+random(-5,5);
      this.y = mouseY+random(-5,5); 
      this.r = random(2,4);
      this.burst = true;
    }
    else{
      this.r = random(1,2);
      this.burst = false;
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

    this.defaultColor = color(_inputState,_inputState);
    this.defaultColor.setAlpha(_inputState);
    this.connectedColor = color(255,50);

    this.inputState = _inputState;

    this.burstParticles = [];
    this.burstTriggered = false;
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
        // this.life=0;
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
      // paints main particle
      if(!this.burst){
        finalImageCanvasPG.noStroke();
        finalImageCanvasPG.fill(this.defaultColor,50);
        finalImageCanvasPG.ellipse(this.x, this.y, this.r+random(1), this.r+random(1));
        this.life=0;
        // amountOfDots+=1;

      }
      

      // Generate burst particles
      if (this.burst && !this.burstTriggered) {
        for (let i = 0; i < 50; i++) {
          this.burstParticles.push(new BurstParticle(this.x, this.y));
        }
        this.burstTriggered = true;
      }

      if(this.burst){
        // Update and draw burst particles
        for (let i = this.burstParticles.length - 1; i >= 0; i--) {
          const bp = this.burstParticles[i];
          bp.update();
          bp.displayPath();
  
          if (bp.isDead()) {
            bp.display();
            this.burstParticles.splice(i, 1);
          }
        }
  
        // kill particle of no more burstParticles
        if(this.burstParticles.length<=2){
          this.life=0;
          // amountOfDots+=1;
        }
      }
    }
    else if (this.connected){ // mouse over
      fill(255,255,222);
      ellipse(this.x, this.y, this.r * 3, this.r * 3);
    }
    else {
      let pixelColor = effectImageCanvasPG.get(this.x, this.y);
      fill(255,255,170,95); // moving
      // fill(pixelColor); // moving
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



class BurstParticle {
  constructor(x, y) {
    // Store origin for reference
    this.originX = x;
    this.originY = y;
    
    // Movement properties
    this.angle = random(TWO_PI);
    this.maxRadius = random(1, 50);
    this.currentRadius = 0;
    this.lifespan = 30;
    this.age = 0;
    
    // Splatter-style movement variations
    this.radiusJitter = random(-0.5, 0.5);
    this.angleJitter = random(-0.1, 0.1);
    
    // Appearance properties
    this.size = random(1, 5);
    this.targetColor = effectImageCanvasPG.get(
      int(x + cos(this.angle) * this.maxRadius),
      int(y + sin(this.angle) * this.maxRadius)
    );
    
    // Initial position
    this.x = x;
    this.y = y;
  }

  update() {
    if (this.age < this.lifespan) {
      // Calculate progress with easing
      const progress = this.age / this.lifespan;
      const easedProgress = pow(progress, 0.7);
      
      // Update radius with organic variation
      this.currentRadius = easedProgress * this.maxRadius + this.radiusJitter;
      
      // Add angle variation over time
      this.angle += this.angleJitter;
      
      // Update position
      this.x = this.originX + cos(this.angle) * this.currentRadius;
      this.y = this.originY + sin(this.angle) * this.currentRadius;
      
      this.age++;
    }
  }

  display() {
    finalImageCanvasPG.fill(this.targetColor);
    finalImageCanvasPG.noStroke();
    
    // Add splatter-style randomness
    finalImageCanvasPG.circle(
      this.x + random(-1, 1),
      this.y + random(-1, 1),
      this.size * random(0.8, 1.2)
    );
  
  }


  displayPath() {
    fill(this.targetColor);
    noStroke();
    circle(this.x, this.y, this.size);
  }

  isDead() {
    return this.age >= this.lifespan;
  }
}