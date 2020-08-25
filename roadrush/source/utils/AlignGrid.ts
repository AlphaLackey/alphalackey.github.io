type GridConfig = {
	rows: number,
	cols: number,
	height?: number,
	width?: number,
	scene: Phaser.Scene;
}

class AlignGrid  {
	private config: GridConfig;

	public cw?: number;
	public ch?: number;
	public gfx?: Phaser.GameObjects.Graphics;

	constructor(config: GridConfig) {
		this.config = config;

		if (!config.scene) {
			console.log("missing scene");
			return;
		}

		if (config.rows == 0) {
			this.config.rows = 5;
		}

		if (config.cols == 0) {
			this.config.cols = 5;
		}

		this.config.height = (config.height == undefined ? Config.options.height : config.height);
		this.config.width = (config.width == undefined ? Config.options.width : config.width);
		this.config.scene = config.scene

		// cell params
		this.cw = this.config.width / this.config.cols;
		this.ch = this.config.height / this.config.rows;
	}

	show() {
		this.gfx = this.config.scene.add.graphics();
		this.gfx.lineStyle(2, 0xFF0000);

		for (var i = 0; i < this.config.width!; i += this.cw!) {
			this.gfx.moveTo(i, 0);
			this.gfx.lineTo(i, this.config.height!);
		}

		for (var i = 0; i < this.config.height!; i += this.ch!) {
			this.gfx.moveTo(0, i);
			this.gfx.lineTo(this.config.height!, i);
		}

		this.gfx.strokePath();
	}

	placeAt(gridX: number, gridY: number, obj: any) {
		// calc position based on cell w/h

		var x2 = this.cw! * (gridX + 0.5);
		var y2 = this.ch! * (gridY + 0.5);

		obj.x = x2;
		obj.y = y2;
	}

	placeAtIndex(index: number, obj: any) {
		var yy = Math.floor(index / this.config.cols);
		var xx = index - (yy * this.config.cols);

		this.placeAt(xx, yy, obj);
	}

	showNumbers() {
		this.show();
		var count = 0;

		for (var i = 0; i < this.config.rows; i += 1) {
			for (var j = 0; j < this.config.cols; j += 1) {
				let numText = this.config.scene.add.text(0, 0, count.toString(), { color: "#FF0000" });
				numText.setOrigin(0.5, 0.5);
				this.placeAtIndex(count, numText);
				count += 1;
			}
		}
	}
}