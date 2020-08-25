import Point = Phaser.Geom.Point;

class GameScene extends Phaser.Scene {
	constructor() {
		super("GameScene");
	}

	create() {
		let feltAsset = this.add.image(0, 0, "felt");
		feltAsset.setOrigin(0, 0);
		this.add.sprite(100, 100, "card", 12);
	}
}