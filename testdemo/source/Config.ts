class Config {
	static gameReference: Phaser.Game;
	static emitter = new Phaser.Events.EventEmitter();//: Phaser.Events.EventEmitter;

	static gameOptions = {
		gameWidth: 1024,
		gameHeight: 760,

		buttonWidth: 123,
		buttonHeight: 35,

		cardWidth: 85,
		cardHeight: 131,

		chipWidth: 55,
		chipHeight: 51,
		chipValues: [5000, 1000, 500, 100, 25, 5, 1, 0.5],

		scoreFormat: {
			fontFamily: "Arial",
			fontSize: "18px",
			fontStyle: "bold",
			color: "#FFFFFF",
			align: "center"
		},

		helpFormat: {
			fontFamily: "Arial",
			fontSize: "22px",
			color: "#000000",
			align: "center"
		},

		feltFormat: {
			fontFamily: "Arial",
			fontSize: "12px",
			fontColor: "#FFFFFF",
			align: "center"
		},

		commentaryFormat: {
			fontFamily: "Arial",
			fontSize: "20px",
			fontColor: "#FFFFFF",
			fontStyle: "bold",
			align: "left"
		}
	};

	public static initGame() {
		let gameConfig = {
			width: this.gameOptions.gameWidth,
			height: this.gameOptions.gameHeight,
			backgroundColor: 0x000000,
			parent: 'game-div',
			scene: [LoaderScene, GameScene],
			// scale: {
			// 	parent: 'game-div',
			// 	mode: Phaser.Scale.FIT,
			// 	width: this.gameOptions.gameWidth,
			// 	height: this.gameOptions.gameHeight
			// }
		}

		this.gameReference = new Phaser.Game(gameConfig);
	}
}

window.onload = () => {
	Config.initGame();
}