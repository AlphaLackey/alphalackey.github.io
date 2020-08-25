class Road extends Phaser.GameObjects.Container {
	private lineGroup: Phaser.GameObjects.Group;
	private back: Phaser.GameObjects.Image;
	private obstacle?: Phaser.GameObjects.Sprite;
	private obstacleIndex?: number;
	
	private vSpace: number;
	private lineCount: number;
	
	public car: Phaser.GameObjects.Sprite;

	private obstacleArray = [
		{ key: "pcar1", speed: 10, scale: 0.1 },
		{ key: "pcar2", speed: 10, scale: 0.1 },
		{ key: "cone", speed: 20, scale: 0.05 },
		{ key: "barrier", speed: 20, scale: 0.08 },
	];

	constructor(scene: Phaser.Scene) {
		super(scene);
		this.back = scene.add.image(0, 0, "road");
		this.add(this.back);
		scene.add.existing(this);

		Align.scaleToGameWidth(this.back, 0.5);
		this.lineGroup = this.scene.add.group();

		this.vSpace = 0;
		this.lineCount = 0;
		this.car = this.scene.add.sprite(this.back.displayWidth / 4, Config.options.height * 0.9, "cars");
		Align.scaleToGameWidth(this.car, 0.1);
		this.add(this.car);

		this.back.setInteractive();
		this.back.on("pointerdown", this.changeLanes, this);
		this.addObject();
	}
	
	addObject() {
		this.obstacleIndex = Math.floor(Math.random() * 4);

		let laneRoll: number = (Math.random() * 100);
		let divisor = (laneRoll < 50 ? -4.0 : 4.0);
		
		let obstacleKey = this.obstacleArray[this.obstacleIndex].key;

		this.obstacle = this.scene.add.sprite(this.back.displayWidth / divisor, 0, obstacleKey);
		Align.scaleToGameWidth(this.obstacle, this.obstacleArray[this.obstacleIndex!].scale);

		this.add(this.obstacle);		 
	}

	changeLanes() {
		if (Config.model.GameOver) return;

		Config.emitter.emit(Constants.PLAY_SOUND, "whoosh");
		this.car.x *= -1;
	}

	makeLines() {
		this.vSpace = Config.options.height * 0.1;

		for (var i = 0; i < 20; i += 1) {
			var line: Line;
			line = this.scene.add.image(this.x, this.vSpace * i, "line");
			line.oy = line.y;
			this.lineGroup.add(line);
		}
	}

	moveLines() {
		if (Config.model.GameOver) return;

		this.lineGroup.children.iterate(function (this: any, child: any) {
			child.y += this.vSpace / 20;
		}.bind(this));

		this.lineCount += 1;
		if (this.lineCount == 20) {
			this.lineCount = 0;

			this.lineGroup.children.iterate(function (this: any, child: any) {
				child.y = child.oy;
			}.bind(this));
		}
	}

	goGameOver() {
		this.scene.scene.start(Constants.GAME_OVER_SCENE_NAME);
	}

	moveObject() {
		if (Config.model.GameOver) return;

		this.obstacle!.y += (this.vSpace / this.obstacleArray[this.obstacleIndex!].speed) * Config.model.Speed;
		if (Collision.checkCollide(this.car, this.obstacle!)) {
			this.car.alpha = 0.5;
			Config.model.GameOver = true;
			Config.emitter.emit(Constants.PLAY_SOUND, "boom");
			this.scene.tweens.add({
				targets: this.car,
				duration: 1000,
				y: Config.options.height,
				angle: -270				
			});
			this.scene.time.addEvent({
				delay: 2000,
				callback: this.goGameOver,
				callbackScope: this,
				loop: false
			});
		} else {
			this.car.alpha = 1.0;
		}
		if (this.obstacle!.y >= Config.options.height) {
			Config.emitter.emit(Constants.UP_POINTS, 1);
			
			this.obstacle!.destroy();
			this.addObject();
		}
	}
}