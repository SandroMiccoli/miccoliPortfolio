class Particle {
  constructor(x, y) {
    this.life = 100;
    this.lifeInc = random(0.5,1);
    this.x = x;
    this.y = y;
    this.r = 1;
    this.range = 30;
    this.vx = random(-1, 1);
    this.vy = random(-1, 1);
    this.noiseOffsetX = random(1000); // Offset for Perlin noise
    this.noiseOffsetY = random(1000);

    this.connected = false;
    this.connections = 0;
    this.maxConnections = 10;

    this.synapseActive = false;
    this.synapse = 0;
    this.synapseInc = random(0.05);

    this.defaultColor = color(255,250);
    this.connectedColor = color(255,50);
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
      let maxSpeed = 0.95; // Maximum allowed speed
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
    let forceStrength = 0.05*mult; // Strength of attraction
    let dx = mx - this.x;
    let dy = my - this.y;
    let distance = dist(mx, my, this.x, this.y);
    distance = constrain(distance, 10, 200); // Avoid overly strong or weak forces

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
      this.r = noise(frameCount*0.01+this.noiseOffsetX)*2;
    }
  }

  updateLife(){
    this.life -= this.lifeInc;
  }

  update() {
    // this.updateLife();
    this.updateSinapse();
    this.addTurbulence();
    this.applyBoundaryForce(width*0.55, height / 2, 'square', 400);
    this.applyConnectionGrowth();
    // this.checkEdges();
    this.x += this.vx;
    this.y += this.vy;
  }
  
  display() {
    if (this.connected) fill(this.connectedColor);
    else fill(this.defaultColor);
    noStroke();
    ellipse(this.x, this.y, this.r * 2, this.r * 2);

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
