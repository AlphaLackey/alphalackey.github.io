class Controller {
	constructor() {
		Config.emitter.on(Constants.SET_SCORE, this.setScore);
		Config.emitter.on(Constants.UP_POINTS, this.upPoints);
		Config.emitter.on(Constants.TOGGLE_SOUND, this.toggleSound);
		Config.emitter.on(Constants.TOGGLE_MUSIC, this.toggleMusic);
	}

	setScore(score: number) {
		Config.model.Score = score;
	}

	upPoints(points: number) {
		Config.model.Score += points;
	}

	toggleSound(value: boolean) {
		Config.model.SoundOn = value;
	}

	toggleMusic(value: boolean) {
		Config.model.MusicOn = value;
	}
}