type ProgressBarConfig = {
	scene: Phaser.Scene;
	color?: number;
	height?: number
	width?: number;
	x?: number;
	y?: number;
}

class ProgressBar extends Phaser.GameObjects.Container {
	private _config: ProgressBarConfig;
	private _graphics: Phaser.GameObjects.Graphics;

	constructor(config: ProgressBarConfig) {
		super(config.scene);
		this._config = config;

		this.scene = config.scene;

		this._config.color = (config.color == null ? 0xFF0000 : config.color);
		this._config.width = (config.width == null ? 200 : config.width);
		this._config.height = (config.height == null ? this._config.width / 4 : config.height);

		this._graphics = this.scene.add.graphics();
		this._graphics.fillStyle(this._config.color, 1);
		this._graphics.fillRect(0, 0, this._config.width, this._config.height);
		this.add(this._graphics);

		this._graphics.x = -this._config.width / 2;
		this._graphics.y = -this._config.height / 2;

		this._config.x = (config.x == null ? 0 : config.x);
		this._config.y = (config.y == null ? 0 : config.y);

		this.x = this._config.x;
		this.y = this._config.y;

		this.scene.add.existing(this);
	}

	setPercent(percent: number) {
		this._graphics.scaleX = percent;
	}
}