/**
 *
 * 曲线类
 * 自动生成 canvas标签,absolute定位,通过控制 left\bottom来确定摆放位置
 * @constructor
 */
function WaveLine(opt){
	this.opt = opt || {};

	this.points = this.opt.points || new Array();
	this.K = this.opt.K || 2;
	this.F = this.opt.F || 6;
	this.speed = this.opt.speed || 0.1;
	this.noise = this.opt.noise || 0;
	this.phase = this.opt.phase || 0;
	this.color = this.opt.color || 'rgba(255,255,255,1)';




	if (!devicePixelRatio) devicePixelRatio = 1;
	this.width = devicePixelRatio * (this.opt.width || 320);
	this.height = devicePixelRatio * (this.opt.height || 100);
	this.MAX = (this.height/2)-4;

	this.bottom = this.opt.bottom || this.height;
	this.left = this.opt.left || 0;


	this.canvas = document.createElement('canvas');
	this.canvas.style.position = 'absolute';
	this.canvas.style.background = 'none';
	this.canvas.style.bottom = this.bottom+'px';
	this.canvas.style.left = this.left+'px';

	//this.canvas = document.getElementById('myCanvas');
	this.canvas.width = this.width;
	this.canvas.height = this.height;
	this.canvas.style.width = (this.width/devicePixelRatio)+'px';
	this.canvas.style.height = (this.height/devicePixelRatio)+'px';
	(this.opt.container || document.body).appendChild(this.canvas);
	this.ctx = this.canvas.getContext('2d');

	this.run = false;
}

WaveLine.prototype = {

	_globalAttenuationFn: function(x){
		return Math.pow(this.K*4/(this.K*4+Math.pow(x,4)),this.K*2);
	},

	_drawLine: function(attenuation, color, width){
		this.ctx.moveTo(0,0);
		this.ctx.beginPath();
		this.ctx.strokeStyle = color;
		this.ctx.lineWidth = width || 1;
		var x, y;


		//var pointsArrayTemp = new Array();
		//for(var i=0;i<this.points.length;i++)
		//{
		//	pointsArrayTemp[i] = this.getPoint(this.points[i]);
		//}
        //
		//var drawPointsArray = new Array();

		var step = this.K/200;
		for (var i=-this.K; i<=this.K; i+=step)
		{
			x = this.width*((i+this.K)/(this.K*2));
			y = this.height/2 + this.noise * this._globalAttenuationFn(i) * (1/attenuation) * Math.sin(this.F*i-this.phase);

			//for(var j=0;j<pointsArrayTemp.length;j++)
			//{
			//	pointSet = pointsArrayTemp[j];
			//	if(x>=pointSet.x)
			//	{
			//		pointSet.x = x;
			//		pointSet.y = y;
			//		drawPointsArray.push(pointSet);
			//		pointsArrayTemp.splice(j,1);
			//		break;
			//	}
			//}
			this.ctx.lineTo(x, y);

		}
		this.ctx.stroke();

		//for(var i=0;i<pointsArrayTemp.length;i++)
		//{
		//	var pointSet = pointsArrayTemp[i];
		//	pointSet.x = this.width;
		//	drawPointsArray.push(pointSet);
		//}

		//画点
		for(var i=0;i<this.points.length;i++)
		{
			this.ctx.beginPath();
			var pointSet = this.points[i];
			this.ctx.strokeStyle = pointSet.color;
			var temp_i = pointSet.x*(2*this.K)/this.width-this.K;
			pointSet.y = this.height/2 + this.noise * this._globalAttenuationFn(temp_i) * (1/attenuation) * Math.sin(this.F*temp_i-this.phase);
			this.ctx.arc(pointSet.x, pointSet.y, pointSet.r, 0, 2*Math.PI, false);
			this.ctx.closePath();
			this.ctx.fillStyle = pointSet.color;
			this.ctx.fill();

			pointSet.x = (pointSet.x+pointSet.speed)%this.width;
			this.points[i] = pointSet;
			this.ctx.stroke();
		}
		//for(var i=0;i<drawPointsArray.length;i++)
		//{
		//	this.ctx.beginPath();
		//	var pointSet = drawPointsArray[i];
		//	this.ctx.strokeStyle = pointSet.color;
		//	var temp_i = pointSet.x*(2*this.K)/this.width-this.K;
		//	pointSet.y = this.height/2 + this.noise * this._globalAttenuationFn(temp_i) * (1/attenuation) * Math.sin(this.F*temp_i-this.phase);
		//	this.ctx.arc(pointSet.x, pointSet.y, pointSet.r, 0, 2*Math.PI, false);
		//	this.ctx.closePath();
		//	this.ctx.fillStyle = pointSet.color;
		//	this.ctx.fill();
        //
		//	pointSet.x = (pointSet.x+pointSet.speed)%this.width;
		//	drawPointsArray[i] = pointSet;
		//	this.ctx.stroke();
		//}

		//this.points = drawPointsArray;



	},

	_clear: function(){
		this.ctx.globalCompositeOperation = 'destination-out';
		this.ctx.fillRect(0, 0, this.width, this.height);
		this.ctx.globalCompositeOperation = 'source-over';
	},

	_draw: function(){
		if (!this.run) return;

		this.phase = (this.phase+this.speed)%(Math.PI*64);
		this._clear();
		//this._drawLine(-2, 'rgba(255,255,255,0.1)');
		//this._drawLine(-6, 'rgba(255,255,255,0.2)');
		//this._drawLine(4, 'rgba(255,255,255,0.4)');
		//this._drawLine(2, 'rgba(255,255,255,0.6)');
		this._drawLine(1, this.color, 1.5);

		requestAnimationFrame(this._draw.bind(this));
	},

	start: function(){
		this.phase = 0;
		this.run = true;
		this._draw();
	},

	stop: function(){
		this.run = false;
		this._clear();
	},

	setNoise: function(v){
		this.noise = Math.min(v, 1)*this.MAX;
	},

	setSpeed: function(v){
		this.speed = v;
	},
	getPoint:function(p){
		var newP = p || {};
		newP.x = p.hasOwnProperty('x')? p.x: 10;
		newP.r = p.hasOwnProperty('r')? p.r: 3;
		newP.speed = p.hasOwnProperty('speed')? p.speed: 0.01;
		newP.color = p.hasOwnProperty('color')? p.color: 'black';
		newP.y = 0;
		return newP;
	},

	set: function(noise, speed) {
		this.setNoise(noise);
		this.setSpeed(speed);
	}

};
