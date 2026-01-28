// p5.js Generative Pattern

let angle = 0;

function setup() {
	createCanvas(windowWidth, windowHeight);
	background(0);
	colorMode(HSB, 360, 100, 100);
}

function draw() {
	background(0, 0, 0, 0.1);
	
	translate(width / 2, height / 2);
	
	for (let i = 0; i < 12; i++) {
		push();
		rotate(angle + i * PI / 6);
		stroke((frameCount + i * 30) % 360, 80, 100);
		strokeWeight(2);
		noFill();
		
		beginShape();
		for (let j = 0; j < 50; j++) {
			let x = cos(j * 0.1) * (100 + sin(j * 0.2 + angle) * 50);
			let y = sin(j * 0.1) * (100 + cos(j * 0.2 + angle) * 50);
			vertex(x, y);
		}
		endShape();
		pop();
	}
	
	angle += 0.02;
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}
