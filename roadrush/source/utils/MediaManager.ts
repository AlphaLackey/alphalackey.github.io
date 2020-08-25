type MediaManagerConfig = {
	scene: Phaser.Scene
};

class MediaManager {
	private config: MediaManagerConfig;
	private background?: Phaser.Sound.BaseSound;

	constructor(config: MediaManagerConfig) {
		this.config = config;

		Config.emitter.on(Constants.PLAY_SOUND, this.playSound, this);
		Config.emitter.on(Constants.MUSIC_CHANGED, this.musicChanged, this);
	}

	playSound(key: string) {
		if (Config.model.SoundOn) {
			let sound = this.config.scene.sound.add(key);
			sound.play();
		}
	}

	setBackgroundMusic(key: string) {
		if (this.background != null) return;
		
		this.background = this.config.scene.sound.add(key, { volume: 0.5, loop: true });

		if (Config.model.MusicOn) {
			this.background.play();
		}
	}

	musicChanged() {
		if (this.background) {
			if (Config.model.MusicOn) {
				this.background.play();
			} else {				
				this.background.stop();
			}
		}
	}
}