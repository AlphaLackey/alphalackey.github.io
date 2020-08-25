class TitleScene extends Phaser.Scene {
	private _alignGrid?: AlignGrid;
	private _title?: Phaser.GameObjects.Image;
	private _btnStart?: FlatButton;
	private _backImage?: Phaser.GameObjects.Image;

	constructor() {
		super(Constants.TITLE_SCENE_NAME);
	}

	preload() {
		this.load.image("title", "assets/images/title.png");
	}

	create() {
		console.log("Nonono, that's famous TITLES, Mr. Connery.. famous.. titles");

		Config.emitter = new Phaser.Events.EventEmitter();
		Config.controller = new Controller();
		
		this._alignGrid = new AlignGrid({ rows: 11, cols: 11, scene: this });
		this._backImage = this.add.image(Config.options.width / 2, Config.options.height / 2, "titleBack");

		this._title = this.add.image(0, 0, "title");
		Align.scaleToGameWidth(this._title, .8);
		this._alignGrid.placeAtIndex(38, this._title);

		this._btnStart = new FlatButton({ scene: this, key: "button1", text: "start", clickEvent: "start_game" });
		this._alignGrid.placeAtIndex(93, this._btnStart);
		
		Config.emitter.on("start_game", this.startGame, this);

		var mediaManager = new MediaManager({ scene: this });
		mediaManager.setBackgroundMusic("backgroundMusic");
	}

	update() {

	}
	startGame() {
		this.scene.start(Constants.MAIN_SCENE_NAME);
	}
}