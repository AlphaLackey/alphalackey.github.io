class LoaderScene extends Phaser.Scene {
	constructor() {
		super("LoaderScene");
	}

	preload() {
		this.load.spritesheet(
			"card",
			"assets/images/TGS Cards.png", {
				frameWidth: Config.gameOptions.cardWidth,
				frameHeight: Config.gameOptions.cardHeight
			}
		);
	}

	create() {
		this.scene.start("GameScene");
	}
}