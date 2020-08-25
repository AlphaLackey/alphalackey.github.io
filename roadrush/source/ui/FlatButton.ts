type FlatButtonConfig = {
	scene: Phaser.Scene,
	key: string,
	text: string,
	x?: number,
	y?: number,
	clickEvent: string,
	params?: string,
	fontSize?: number,
	fontColor?: string
};

class FlatButton extends Phaser.GameObjects.Container {
	private _back: Phaser.GameObjects.Image;
	private _label: Phaser.GameObjects.Text;
	private _config: FlatButtonConfig;

	constructor(config: FlatButtonConfig) {
		super(config.scene);

		this._config = config;

		this._back = this._config.scene.add.image(0, 0, config.key);
		this.add(this._back);

		this._label = this._config.scene.add.text(0, 0, config.text);
		if (config.fontSize != undefined) {
			this._label.setFontSize(config.fontSize);
		}
		if (config.fontColor != undefined) {
			this._label.setColor(config.fontColor);
		}
		this._label.setOrigin(0.5, 0.5);
		this.add(this._label);

		this.x = (config.x != undefined ? config.x : 0);
		this.y = (config.y != undefined ? config.y : 0);

		if (config.clickEvent != undefined) {
			this._back.setInteractive();
			this._back.on('pointerdown', this.pressed, this);
		}

		if (Config.isMobile == -1) {
			this._back.on("pointerover", this.over, this);
			this._back.on("pointerout", this.out, this);
		}

		this.scene.add.existing(this);
	}
	pressed() {
		if (this._config.params != undefined) {
			Config.emitter.emit(this._config.clickEvent, this._config.params);
		} else {
			Config.emitter.emit(this._config.clickEvent);
		}
	}

	over() {
		this._back.setTint(0xff9955);
		this.scale = 1.1;
	}

	out() {
		this._back.setTint(0xffffff);
		this.scale = 1.0;
	}
}