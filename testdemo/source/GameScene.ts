import Point = Phaser.Geom.Point;

class GameScene extends Phaser.Scene {
	constructor() {
		super("GameScene");
	}

	create() {
		let feltAsset = this.add.image(0, 0, "felt");
		feltAsset.setOrigin(0, 0);

		for (let x = 0; x <= 54; x += 1) {
			let card = this.add.sprite(x * 15, x * 11.3, "card", x);
			card.setOrigin(0, 0);
		}
	}
}