class Config {
	static game: Phaser.Game;
	static model: Model;
	static emitter: Phaser.Events.EventEmitter;
	static controller: Controller;
	static isMobile: number;

	static options = {		
		width: 480,
		height: 640
	}

	public static initGame() {
		Config.isMobile = navigator.userAgent.indexOf("Mobile");
		if (Config.isMobile == -1) {
			Config.isMobile = navigator.userAgent.indexOf("Tablet");
		}

		var gameConfig;

		if (Config.isMobile == -1) {
			gameConfig = {
				width: this.options.width,
				height: this.options.height,
				type: Phaser.AUTO,
				backgroundColor: 0x000000,
				scene: [LoaderScene, TitleScene, GameScene, GameOverScene]
			};
		} else {
			gameConfig = {
				type: Phaser.AUTO,
				width: window.innerWidth,
				height: window.innerHeight,
				parent: 'phaser-game',
				scene: [LoaderScene, TitleScene, GameScene, GameOverScene]
			};
			this.options.width = window.innerWidth;
			this.options.height = window.innerHeight;
		}

		this.model = new Model();
		this.game = new Phaser.Game(gameConfig);
	}
}

window.onload = () => {
	Config.initGame();
}