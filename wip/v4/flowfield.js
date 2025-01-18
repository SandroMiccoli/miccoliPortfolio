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
		this.init();
	}

	init(){
		this.rows = floor(this.height/this.cellSize);
		this.cols = floor(this.width/this.cellSize);
		this.flowField=[];
		for (let y=0; y<this.rows; y++){
			for (let x=0; x<this.cols; x++){
				let angle = (cos(x*this.zoom) + sin(y*this.zoom)*this.curve);
				this.flowField.push(angle);
			}
		}
	}
}