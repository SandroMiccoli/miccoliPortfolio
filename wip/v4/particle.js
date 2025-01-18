class Particle {
  constructor(x, y, _inputState) {
    this.life = random(25,100);
    this.lifeInc = random(0.05,0.1);
    this.x = x+random(-50,50);
    this.y = y+random(-50,50);
    if(random()>0.99){
      this.x = x+random(-250,250);
      this.y = y+random(-250,250); 
    }
    this.targetX = x; // Target bright pixel position
    this.targetY = y;
    this.r = 1;
    this.range = 30;
    this.vx = random(-2, 2);
    this.vy = random(-2, 2);
    this.noiseOffsetX = random(1000); // Offset for Perlin noise
    this.noiseOffsetY = random(1000);

    this.connected = false;
    this.connections = 0;
    this.maxConnections = 10;

    this.synapseActive = false;
    this.synapse = 0;
    this.synapseInc = random(0.05);

    this.defaultColor = color(255,255,222,_inputState/2);
    this.connectedColor = color(255,50);
    // print(_inputState)

    this.history = [{x: this.x, y: this.y}];

    this.angle=0;

  }



  gravitateToTarget() {
    // Calculate distance to target
    let dx = this.targetX - this.x;
    let dy = this.targetY - this.y;
    let distance = sqrt(dx * dx + dy * dy);

    // Smoothly move back to target
    let returnStrength = 0.025; // Adjust the strength of the return force
    if (distance > 0.5) { // Avoid oscillations near the target
      this.vx += dx * returnStrength;
      this.vy += dy * returnStrength;

      // Limit velocity to prevent overshooting
      let maxSpeed = 1;
      let speed = sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > maxSpeed) {
        this.vx = (this.vx / speed) * maxSpeed;
        this.vy = (this.vy / speed) * maxSpeed;
      }
    } else {
      // Park the particle (stop movement when near the target)
      this.vx = 0;
      this.vy = 0;
    }
  }


  addTurbulence() {
      // Adjust velocity using Perlin noise with balanced inputs
      let turbulenceStrength = 0.0000125; // Control intensity of turbulence
      let noiseX = noise(this.noiseOffsetX, this.noiseOffsetY) - 0.5;
      let noiseY = noise(this.noiseOffsetY, this.noiseOffsetX) - 0.5;

      // Apply symmetrical noise
      this.vx += noiseX * turbulenceStrength;
      this.vy += noiseY * turbulenceStrength;

      // Increment noise offsets independently
      this.noiseOffsetX += 0.02; // Adjust per-frame change
      this.noiseOffsetY += 0.03; // Use a slightly different increment

      // Normalize velocity to prevent uncontrolled speed increase
      let maxSpeed = 0.85; // Maximum allowed speed
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
      this.r = noise(frameCount*0.01+this.noiseOffsetX)*4;
    }
  }

  updateLife(){
    this.life -= this.lifeInc;
  }


  applyFlowfield(){
    let x = floor(this.x / flowfield.cellSize);
    let y = floor(this.y / flowfield.cellSize);
    let index = y * flowfield.cols + x;
    this.angle = flowfield.flowField[index];
    this.vx = cos(this.angle);
    this.vy = sin(this.angle);

  }

  update() {
    // this.gravitateToTarget();
    // this.updateSinapse();
    // this.addTurbulence();
    // this.applyBoundaryForce(width*.5, height / 2, 'square', height*0.75);
    // this.applyConnectionGrowth();
    // this.checkEdges();
    // this.updateHistory();
    this.updateLife();

    this.applyFlowfield();

    this.x += this.vx;
    this.y += this.vy;
  }

  updateHistory(){
    this.history.push({x: this.x, y: this.y});
    if (this.history.length>15)
      this.history.shift();
  }

  displayHistory(){
    for (let i=0; i<this.history.length; i++){
      push();
      fill(this.defaultColor,75)
      noStroke();
      ellipse(this.history[i].x, this.history[i].y, this.r , this.r);
      pop();
    }
  }
  
  display() {
    push();
    // if (this.connected) fill(255,255,150,this.life);
    // else fill(255,255,200,this.life);
    fill(this.defaultColor)
    noStroke();
    ellipse(this.x, this.y, this.r * 2, this.r * 2);
    pop();

    // this.displayHistory();

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
