type ToggleButtonConfig = {
	scene: Phaser.Scene
	backKey: string;
	onIconKey: string;
	offIconKey: string;
	value: boolean;
	x: number;
	y: number;
	event: string;
}

class ToggleButton extends Phaser.GameObjects.Container {
	private _back: Phaser.GameObjects.Image;
	private _onIcon: Phaser.GameObjects.Image;
	private _offIcon: Phaser.GameObjects.Image;

	private _config: ToggleButtonConfig;

	private _value: boolean;

	constructor(config: ToggleButtonConfig) {
		super(config.scene);
		this.scene = config.scene;
		this._config = config;

		this._back = this._config.scene.add.image(0, 0, config.backKey);
		this._onIcon = this._config.scene.add.image(0, 0, config.onIconKey);
		this._offIcon = this._config.scene.add.image(0, 0, config.offIconKey);

		Align.scaleToGameWidth(this._back, 0.1);
		Align.scaleToGameWidth(this._onIcon, 0.05);
		Align.scaleToGameWidth(this._offIcon, 0.05);

		this.add(this._back);
		this.add(this._onIcon);
		this.add(this._offIcon);

		this._value = config.value;
		this.setIcons();

		this._back.setInteractive();
		this._back.on("pointerdown", this.toggle, this);

		this.x = this._config.x;
		this.y = this._config.y;

		this.setSize(this._back.displayWidth, this._back.displayHeight);
		this.scene.add.existing(this);
	}
	
	setIcons() {
		this._onIcon.visible = this._value;
		this._offIcon.visible = !this._value;
	}

	toggle() {
		this._value = !this._value;
		this.setIcons();

		Config.emitter.emit(this._config.event, this._value);
	}
}