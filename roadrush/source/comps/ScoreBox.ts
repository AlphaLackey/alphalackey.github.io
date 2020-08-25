class ScoreBox extends Phaser.GameObjects.Container {
	private text1?: Phaser.GameObjects.Text;

	constructor(config: { scene: Phaser.Scene }) {
		super(config.scene);

		this.scene = config.scene;
		this.text1 = this.scene.add.text(0, 0, "SCORE: 0");
		this.text1.setOrigin(0.5, 0.5);
		this.text1.setBackgroundColor("#000000");
		this.add(this.text1);

		this.scene.add.existing(this);

		Config.emitter.on(Constants.SCORE_UPDATED, this.scoreUpdated, this);
	}

	scoreUpdated() {
		this.text1!.setText("SCORE: " + Config.model.Score);
	}
}