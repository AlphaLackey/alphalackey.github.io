class LoaderScene extends Phaser.Scene {
	private _progText?: Phaser.GameObjects.Text;
	private _bar?: ProgressBar;

	constructor() {
		super(Constants.LOADER_SCENE_NAME);		
	}

	preload() {
		this._bar = new ProgressBar({ scene: this, x: 240, y: 320 });
		
		this._progText = this.add.text(Config.options.width / 2, Config.options.height / 2, "0%", { color: "#FFFFFF", fontSize: Config.options.width / 20 });
		this._progText!.setOrigin(0.5, 0.5);
		this.load.on("progress", this.onProgress, this);
		this.load.spritesheet("cars", "./assets/images/cars.png", { frameWidth: 60, frameHeight: 126 });
		
		this.load.image("road", "./assets/images/road.jpg");
		this.load.image("line", "./assets/images/line.png");
		this.load.image("pcar1", "./assets/images/pcar1.png");
		this.load.image("pcar2", "./assets/images/pcar2.png");
		this.load.image("cone", "./assets/images/cone.png");
		this.load.image("barrier", "./assets/images/barrier.png");
		this.load.image("button1", "./assets/images/ui/buttons/2/1.png");
		this.load.image("button2", "./assets/images/ui/buttons/2/5.png");

		this.load.image("title", "assets/images/title.png");
		this.load.image("titleBack", "assets/images/titleBack.jpg");

		this.load.image("toggleBack", "./assets/images/ui/toggles/1.png");
		this.load.image("sfxOn", "./assets/images/ui/icons/sfx_on.png");
		this.load.image("sfxOff", "./assets/images/ui/icons/sfx_off.png");
		this.load.image("musicOn", "./assets/images/ui/icons/music_on.png");
		this.load.image("musicOff", "./assets/images/ui/icons/music_off.png");

		this.load.audio("backgroundMusic", ["./assets/audio/random-race.mp3", "./assets/audio/random-race.ogg"]);
		this.load.audio("boom", ["./assets/audio/boom.mp3", "./assets/audio/boom.ogg"]);
		this.load.audio("whoosh", ["./assets/audio/whoosh.mp3", "./assets/audio/whoosh.ogg"]);

		
	}

	create() {
		this.scene.start(Constants.TITLE_SCENE_NAME);
	}

	onProgress(value: number) {
		this._bar!.setPercent(value);
		var per = Math.floor(value * 10000) / 100;
		console.log(per);
		this._progText!.setText(per.toString() + "%");
	}
}