class FlowField{
	constructor(width,height){
		this.cellSize=20;
		this.width = width;
		this.height = height;
		this.rows;
		this.cols
		this.flowField = [];
		this.curve = 0.5;
		this.zoom = 0.2;
		this.fromImage = false;

		this.init();
	}

	init() {
	    this.flowField = [];

	    if (!this.fromImage) {
	        console.log("Flowfield from math functions");
	        this.rows = floor(this.height / this.cellSize);
	        this.cols = floor(this.width / this.cellSize);

	        for (let y = 0; y < this.rows; y++) {
	            for (let x = 0; x < this.cols; x++) {
	                let angle = cos(x * this.zoom) + sin(y * this.zoom) * this.curve;
	                this.flowField.push({
	                    x: x,
	                    y: y,
	                    colorAngle: angle,
	                });
	            }
	        }
	    } else {
	        console.log("Flowfield from image!");
	        img.loadPixels(); // Ensure pixels are loaded

	        this.rows = floor(img.height / this.cellSize);
	        this.cols = floor(img.width / this.cellSize);

	        for (let y = 0; y < img.height; y += this.cellSize) {
	            for (let x = 0; x < img.width; x += this.cellSize) {
	                const index = (y * img.width + x) * 4; // Calculate the starting index for the pixel
	                const r = img.pixels[index];
	                const g = img.pixels[index + 1];
	                const b = img.pixels[index + 2];
	                const grayvalue = (r + g + b) / 3;
	                const colorAngle = map(grayvalue, 0, 255, 0, TWO_PI);

	                // Push normalized x and y
	                this.flowField.push({
	                    x: floor(x / this.cellSize),
	                    y: floor(y / this.cellSize),
	                    colorAngle: colorAngle,
	                });
	            }
	        }
	    }

	    console.log(`Flowfield initialized with ${this.flowField.length} elements.`);
	}


	display() {
	    for (let y = 0; y < this.rows; y++) {
	        for (let x = 0; x < this.cols; x++) {
	            const index = x + y * this.cols; // Corrected index calculation
	            push();
	            noFill();
	            translate(this.cellSize / 4, this.cellSize / 4);
	            translate(x * this.cellSize + this.cellSize / 2, y * this.cellSize + this.cellSize / 2);
	            

	            noStroke();
	            fill(map(this.flowField[index].colorAngle,0,TWO_PI,0,255));
	            rectMode(CENTER)
	            rect(0,0,this.cellSize/4,this.cellSize/4);


	            
	            rotate(this.flowField[index].colorAngle);
	            noFill();
	            stroke(255, 0, 0);
	            strokeWeight(0.1);
	            line(0, 0, this.cellSize / 2, 0);
	            ellipse(this.cellSize / 2, 0, 2, 2); // Fixed typo: 'cellSiez' to 'cellSize'
	            pop();
	        }
	    }
	}

}