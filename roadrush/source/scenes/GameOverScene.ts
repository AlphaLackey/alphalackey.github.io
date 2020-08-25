class GameOverScene extends Phaser.Scene {
	private _alignGrid?: AlignGrid;
	private _title?: Phaser.GameObjects.Image;
	private _backImage?: Phaser.GameObjects.Image;
	private _btnStart?: FlatButton;

	constructor() {
		super(Constants.GAME_OVER_SCENE_NAME );
	}

	preload() {
	}

	create() {
		console.log("*BITE* *CHOMP* *CHEW* *GULP* YOU LOSE, SUCKER");

		this._alignGrid = new AlignGrid({ rows: 11, cols: 11, scene: this });
		this._alignGrid.showNumbers();

		this._backImage = this.add.image(Config.options.width / 2, Config.options.height / 2, "titleBack");
		this._title = this.add.image(0, 0, "title");

		Align.scaleToGameWidth(this._title, .8);
		this._alignGrid.placeAtIndex(38, this._title);

		this._btnStart = new FlatButton({ scene: this, key: "button1", text: "Play Again!", clickEvent: "start_game" });
		this._alignGrid.placeAtIndex(93, this._btnStart);
		Config.emitter.on("start_game", this.startGame, this);
	}

	update() {

	}
	startGame() {
		this.scene.start(Constants.MAIN_SCENE_NAME);
	}
}