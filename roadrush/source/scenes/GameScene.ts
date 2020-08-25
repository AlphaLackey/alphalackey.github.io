class GameScene extends Phaser.Scene {
	private road?: Road;
	private road2?: Road;
	private scoreBox?: ScoreBox;
	private gridConfig?: GridConfig;
	private grid?: AlignGrid;

	private test?: Phaser.GameObjects.Sprite;

	constructor() {
		super(Constants.MAIN_SCENE_NAME);
	}

	create() {
		Config.model.GameOver = false;
		Config.model.Speed = 1;
		Config.model.Score = 0;
		
		this.gridConfig = {
			rows: 5,
			cols: 5,
			scene: this
		};
		
		
		this.road = new Road(this);
		this.road.x = Config.options.width * 0.25;
		this.road.makeLines();
		
		this.road2 = new Road(this);
		this.road2.x = Config.options.width * 0.75;
		this.road2.makeLines();
		
		this.road2.car.setFrame(1);
		
		this.grid = new AlignGrid(this.gridConfig);		
		
		var sb = new SoundButtons({
			scene: this
		});
		
		this.add.existing(sb);
		
		this.scoreBox = new ScoreBox({ scene: this });
		this.scoreBox.x = Config.options.width / 2;
		this.scoreBox.y = 50;
		// this.grid.placeAtIndex(4, this.scoreBox);
		this.add.existing(this.scoreBox);

		Config.emitter.on(Constants.SCORE_UPDATED, this.scoreUpdated, this);

	}

	update() {
		this.road!.moveLines();
		this.road!.moveObject();

		this.road2!.moveLines();
		this.road2!.moveObject();
	}

	scoreUpdated() {
		if (Config.model.Score % 5 == 0) {
			Config.model.Speed += 0.25;
		}
	}
}