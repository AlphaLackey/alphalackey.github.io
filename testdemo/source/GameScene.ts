import Point = Phaser.Geom.Point;

class GameScene extends Phaser.Scene {
	constructor() {
		super("GameScene");
	}

	create() {
		this.add.sprite(100, 100, "card", 12);
	}
}