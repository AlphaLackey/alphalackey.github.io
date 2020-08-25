type SoundButtonsConfig = {
	scene: Phaser.Scene;
}

class SoundButtons extends Phaser.GameObjects.Container {
	private _config: SoundButtonsConfig;
	private _musicButton: ToggleButton;
	private _sfxButton: ToggleButton;

	constructor(config: SoundButtonsConfig) {
		super(config.scene);

		this._config = config;
		this.scene = config.scene;

		this._musicButton = new ToggleButton({
			scene: this.scene,
			backKey: "toggleBack",
			onIconKey: "musicOn",
			offIconKey: "musicOff",
			event: Constants.TOGGLE_MUSIC,
			x: 0,
			y: 0,
			value: true
		});

		this._sfxButton = new ToggleButton({
			scene: this.scene,
			backKey: "toggleBack",
			onIconKey: "sfxOn",
			offIconKey: "sfxOff",
			event: Constants.TOGGLE_SOUND,
			x: 0,
			y: 0,
			value: true
		});

		this.add(this._musicButton);
		this.add(this._sfxButton);

		this._musicButton.x = this._musicButton.width / 2;
		this._musicButton.y = this._musicButton.height / 2;

		this._sfxButton.x = Config.options.width - this._sfxButton.width / 2;
		this._sfxButton.y = this._musicButton.y;

		this._sfxButton.setScrollFactor(0);
		this._musicButton.setScrollFactor(0);

		if (!Config.model.MusicOn) {
			this._musicButton.toggle();
		}

		if (!Config.model.SoundOn) {
			this._sfxButton.toggle();
		}
	}
}