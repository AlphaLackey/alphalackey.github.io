class Model {
	private _score: number;
	private _soundOn: boolean;
	private _musicOn: boolean;
	private _gameOver: boolean;
	private _speed: number;

	constructor() {
		this._score = 0;
		this._soundOn = true;
		this._musicOn = true;
		this._gameOver = false;
		this._speed = 1;
	}

	get Score(): number { return this._score; }
	set Score(value: number) {
		this._score = value;
		console.log("Score now " + this._score);
		Config.emitter.emit(Constants.SCORE_UPDATED);
	}

	get MusicOn(): boolean { return this._musicOn; }
	set MusicOn(value: boolean) {
		this._musicOn = value;
		Config.emitter.emit(Constants.MUSIC_CHANGED);
	}

	get SoundOn(): boolean { return this._soundOn; }
	set SoundOn(value: boolean) {
		this._soundOn = value;
	}

	get GameOver(): boolean { return this._gameOver; }
	set GameOver(value: boolean) {
		this._gameOver = value;
	}

	get Speed(): number { return this._speed; }
	set Speed(value: number) {
		this._speed = value;
	}
}