"use strict";
class Line extends Phaser.GameObjects.Image {
}
class Road extends Phaser.GameObjects.Container {
    constructor(scene) {
        super(scene);
        this.obstacleArray = [
            { key: "pcar1", speed: 10, scale: 0.1 },
            { key: "pcar2", speed: 10, scale: 0.1 },
            { key: "cone", speed: 20, scale: 0.05 },
            { key: "barrier", speed: 20, scale: 0.08 },
        ];
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
        let laneRoll = (Math.random() * 100);
        let divisor = (laneRoll < 50 ? -4.0 : 4.0);
        let obstacleKey = this.obstacleArray[this.obstacleIndex].key;
        this.obstacle = this.scene.add.sprite(this.back.displayWidth / divisor, 0, obstacleKey);
        Align.scaleToGameWidth(this.obstacle, this.obstacleArray[this.obstacleIndex].scale);
        this.add(this.obstacle);
    }
    changeLanes() {
        if (Config.model.GameOver)
            return;
        Config.emitter.emit(Constants.PLAY_SOUND, "whoosh");
        this.car.x *= -1;
    }
    makeLines() {
        this.vSpace = Config.options.height * 0.1;
        for (var i = 0; i < 20; i += 1) {
            var line;
            line = this.scene.add.image(this.x, this.vSpace * i, "line");
            line.oy = line.y;
            this.lineGroup.add(line);
        }
    }
    moveLines() {
        if (Config.model.GameOver)
            return;
        this.lineGroup.children.iterate(function (child) {
            child.y += this.vSpace / 20;
        }.bind(this));
        this.lineCount += 1;
        if (this.lineCount == 20) {
            this.lineCount = 0;
            this.lineGroup.children.iterate(function (child) {
                child.y = child.oy;
            }.bind(this));
        }
    }
    goGameOver() {
        this.scene.scene.start(Constants.GAME_OVER_SCENE_NAME);
    }
    moveObject() {
        if (Config.model.GameOver)
            return;
        this.obstacle.y += (this.vSpace / this.obstacleArray[this.obstacleIndex].speed) * Config.model.Speed;
        if (Collision.checkCollide(this.car, this.obstacle)) {
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
        }
        else {
            this.car.alpha = 1.0;
        }
        if (this.obstacle.y >= Config.options.height) {
            Config.emitter.emit(Constants.UP_POINTS, 1);
            this.obstacle.destroy();
            this.addObject();
        }
    }
}
class ProgressBar extends Phaser.GameObjects.Container {
    constructor(config) {
        super(config.scene);
        this._config = config;
        this.scene = config.scene;
        this._config.color = (config.color == null ? 0xFF0000 : config.color);
        this._config.width = (config.width == null ? 200 : config.width);
        this._config.height = (config.height == null ? this._config.width / 4 : config.height);
        this._graphics = this.scene.add.graphics();
        this._graphics.fillStyle(this._config.color, 1);
        this._graphics.fillRect(0, 0, this._config.width, this._config.height);
        this.add(this._graphics);
        this._graphics.x = -this._config.width / 2;
        this._graphics.y = -this._config.height / 2;
        this._config.x = (config.x == null ? 0 : config.x);
        this._config.y = (config.y == null ? 0 : config.y);
        this.x = this._config.x;
        this.y = this._config.y;
        this.scene.add.existing(this);
    }
    setPercent(percent) {
        this._graphics.scaleX = percent;
    }
}
class ScoreBox extends Phaser.GameObjects.Container {
    constructor(config) {
        super(config.scene);
        this.scene = config.scene;
        this.text1 = this.scene.add.text(0, 0, "SCORE: 0");
        this.text1.setOrigin(0.5, 0.5);
        this.text1.setBackgroundColor("#000000");
        this.add(this.text1);
        this.scene.add.existing(this);
        Config.emitter.on(Constants.SCORE_UPDATED, this.scoreUpdated, this);
    }
    scoreUpdated() {
        this.text1.setText("SCORE: " + Config.model.Score);
    }
}
class Config {
    static initGame() {
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
        }
        else {
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
Config.options = {
    width: 480,
    height: 640
};
window.onload = () => {
    Config.initGame();
};
class Constants {
}
Constants.SET_SCORE = "set score";
Constants.SCORE_UPDATED = "score updated";
Constants.UP_POINTS = "up points";
Constants.LOADER_SCENE_NAME = "Loader Scene";
Constants.TITLE_SCENE_NAME = "Title Scene";
Constants.MAIN_SCENE_NAME = "Main Scene";
Constants.GAME_OVER_SCENE_NAME = "Game Over Scene";
Constants.PLAY_SOUND = "Play sound";
Constants.MUSIC_CHANGED = "Music changed";
Constants.TOGGLE_SOUND = "Toggle sound";
Constants.TOGGLE_MUSIC = "Toggle music";
class Controller {
    constructor() {
        Config.emitter.on(Constants.SET_SCORE, this.setScore);
        Config.emitter.on(Constants.UP_POINTS, this.upPoints);
        Config.emitter.on(Constants.TOGGLE_SOUND, this.toggleSound);
        Config.emitter.on(Constants.TOGGLE_MUSIC, this.toggleMusic);
    }
    setScore(score) {
        Config.model.Score = score;
    }
    upPoints(points) {
        Config.model.Score += points;
    }
    toggleSound(value) {
        Config.model.SoundOn = value;
    }
    toggleMusic(value) {
        Config.model.MusicOn = value;
    }
}
class Model {
    constructor() {
        this._score = 0;
        this._soundOn = true;
        this._musicOn = true;
        this._gameOver = false;
        this._speed = 1;
    }
    get Score() { return this._score; }
    set Score(value) {
        this._score = value;
        console.log("Score now " + this._score);
        Config.emitter.emit(Constants.SCORE_UPDATED);
    }
    get MusicOn() { return this._musicOn; }
    set MusicOn(value) {
        this._musicOn = value;
        Config.emitter.emit(Constants.MUSIC_CHANGED);
    }
    get SoundOn() { return this._soundOn; }
    set SoundOn(value) {
        this._soundOn = value;
    }
    get GameOver() { return this._gameOver; }
    set GameOver(value) {
        this._gameOver = value;
    }
    get Speed() { return this._speed; }
    set Speed(value) {
        this._speed = value;
    }
}
class GameOverScene extends Phaser.Scene {
    constructor() {
        super(Constants.GAME_OVER_SCENE_NAME);
    }
    preload() {
    }
    create() {
        console.log("*BITE* *CHOMP* *CHEW* *GULP* YOU LOSE, SUCKER");
        this._alignGrid = new AlignGrid({ rows: 11, cols: 11, scene: this });
        this._alignGrid.showNumbers();
        this._backImage = this.add.image(Config.options.width / 2, Config.options.height / 2, "titleBack");
        this._title = this.add.image(0, 0, "title");
        Align.scaleToGameWidth(this._title, .8);
        this._alignGrid.placeAtIndex(38, this._title);
        this._btnStart = new FlatButton({ scene: this, key: "button1", text: "Play Again!", clickEvent: "start_game" });
        this._alignGrid.placeAtIndex(93, this._btnStart);
        Config.emitter.on("start_game", this.startGame, this);
    }
    update() {
    }
    startGame() {
        this.scene.start(Constants.MAIN_SCENE_NAME);
    }
}
class GameScene extends Phaser.Scene {
    constructor() {
        super(Constants.MAIN_SCENE_NAME);
    }
    create() {
        Config.model.GameOver = false;
        Config.model.Speed = 1;
        Config.model.Score = 0;
        this.gridConfig = {
            rows: 5,
            cols: 5,
            scene: this
        };
        this.road = new Road(this);
        this.road.x = Config.options.width * 0.25;
        this.road.makeLines();
        this.road2 = new Road(this);
        this.road2.x = Config.options.width * 0.75;
        this.road2.makeLines();
        this.road2.car.setFrame(1);
        this.grid = new AlignGrid(this.gridConfig);
        var sb = new SoundButtons({
            scene: this
        });
        this.add.existing(sb);
        this.scoreBox = new ScoreBox({ scene: this });
        this.scoreBox.x = Config.options.width / 2;
        this.scoreBox.y = 50;
        // this.grid.placeAtIndex(4, this.scoreBox);
        this.add.existing(this.scoreBox);
        Config.emitter.on(Constants.SCORE_UPDATED, this.scoreUpdated, this);
    }
    update() {
        this.road.moveLines();
        this.road.moveObject();
        this.road2.moveLines();
        this.road2.moveObject();
    }
    scoreUpdated() {
        if (Config.model.Score % 5 == 0) {
            Config.model.Speed += 0.25;
        }
    }
}
class LoaderScene extends Phaser.Scene {
    constructor() {
        super(Constants.LOADER_SCENE_NAME);
    }
    preload() {
        this._bar = new ProgressBar({ scene: this, x: 240, y: 320 });
        this._progText = this.add.text(Config.options.width / 2, Config.options.height / 2, "0%", { color: "#FFFFFF", fontSize: Config.options.width / 20 });
        this._progText.setOrigin(0.5, 0.5);
        this.load.on("progress", this.onProgress, this);
        this.load.spritesheet("cars", "./assets/images/cars.png", { frameWidth: 60, frameHeight: 126 });
        this.load.image("road", "./assets/images/road.jpg");
        this.load.image("line", "./assets/images/line.png");
        this.load.image("pcar1", "./assets/images/pcar1.png");
        this.load.image("pcar2", "./assets/images/pcar2.png");
        this.load.image("cone", "./assets/images/cone.png");
        this.load.image("barrier", "./assets/images/barrier.png");
        this.load.image("button1", "./assets/images/ui/buttons/2/1.png");
        this.load.image("button2", "./assets/images/ui/buttons/2/5.png");
        this.load.image("title", "assets/images/title.png");
        this.load.image("titleBack", "assets/images/titleBack.jpg");
        this.load.image("toggleBack", "./assets/images/ui/toggles/1.png");
        this.load.image("sfxOn", "./assets/images/ui/icons/sfx_on.png");
        this.load.image("sfxOff", "./assets/images/ui/icons/sfx_off.png");
        this.load.image("musicOn", "./assets/images/ui/icons/music_on.png");
        this.load.image("musicOff", "./assets/images/ui/icons/music_off.png");
        this.load.audio("backgroundMusic", ["./assets/audio/random-race.mp3", "./assets/audio/random-race.ogg"]);
        this.load.audio("boom", ["./assets/audio/boom.mp3", "./assets/audio/boom.ogg"]);
        this.load.audio("whoosh", ["./assets/audio/whoosh.mp3", "./assets/audio/whoosh.ogg"]);
    }
    create() {
        this.scene.start(Constants.TITLE_SCENE_NAME);
    }
    onProgress(value) {
        this._bar.setPercent(value);
        var per = Math.floor(value * 10000) / 100;
        console.log(per);
        this._progText.setText(per.toString() + "%");
    }
}
class TitleScene extends Phaser.Scene {
    constructor() {
        super(Constants.TITLE_SCENE_NAME);
    }
    preload() {
        this.load.image("title", "assets/images/title.png");
    }
    create() {
        console.log("Nonono, that's famous TITLES, Mr. Connery.. famous.. titles");
        Config.emitter = new Phaser.Events.EventEmitter();
        Config.controller = new Controller();
        this._alignGrid = new AlignGrid({ rows: 11, cols: 11, scene: this });
        this._backImage = this.add.image(Config.options.width / 2, Config.options.height / 2, "titleBack");
        this._title = this.add.image(0, 0, "title");
        Align.scaleToGameWidth(this._title, .8);
        this._alignGrid.placeAtIndex(38, this._title);
        this._btnStart = new FlatButton({ scene: this, key: "button1", text: "start", clickEvent: "start_game" });
        this._alignGrid.placeAtIndex(93, this._btnStart);
        Config.emitter.on("start_game", this.startGame, this);
        var mediaManager = new MediaManager({ scene: this });
        mediaManager.setBackgroundMusic("backgroundMusic");
    }
    update() {
    }
    startGame() {
        this.scene.start(Constants.MAIN_SCENE_NAME);
    }
}
class FlatButton extends Phaser.GameObjects.Container {
    constructor(config) {
        super(config.scene);
        this._config = config;
        this._back = this._config.scene.add.image(0, 0, config.key);
        this.add(this._back);
        this._label = this._config.scene.add.text(0, 0, config.text);
        if (config.fontSize != undefined) {
            this._label.setFontSize(config.fontSize);
        }
        if (config.fontColor != undefined) {
            this._label.setColor(config.fontColor);
        }
        this._label.setOrigin(0.5, 0.5);
        this.add(this._label);
        this.x = (config.x != undefined ? config.x : 0);
        this.y = (config.y != undefined ? config.y : 0);
        if (config.clickEvent != undefined) {
            this._back.setInteractive();
            this._back.on('pointerdown', this.pressed, this);
        }
        if (Config.isMobile == -1) {
            this._back.on("pointerover", this.over, this);
            this._back.on("pointerout", this.out, this);
        }
        this.scene.add.existing(this);
    }
    pressed() {
        if (this._config.params != undefined) {
            Config.emitter.emit(this._config.clickEvent, this._config.params);
        }
        else {
            Config.emitter.emit(this._config.clickEvent);
        }
    }
    over() {
        this._back.setTint(0xff9955);
        this.scale = 1.1;
    }
    out() {
        this._back.setTint(0xffffff);
        this.scale = 1.0;
    }
}
class SoundButtons extends Phaser.GameObjects.Container {
    constructor(config) {
        super(config.scene);
        this._config = config;
        this.scene = config.scene;
        this._musicButton = new ToggleButton({
            scene: this.scene,
            backKey: "toggleBack",
            onIconKey: "musicOn",
            offIconKey: "musicOff",
            event: Constants.TOGGLE_MUSIC,
            x: 0,
            y: 0,
            value: true
        });
        this._sfxButton = new ToggleButton({
            scene: this.scene,
            backKey: "toggleBack",
            onIconKey: "sfxOn",
            offIconKey: "sfxOff",
            event: Constants.TOGGLE_SOUND,
            x: 0,
            y: 0,
            value: true
        });
        this.add(this._musicButton);
        this.add(this._sfxButton);
        this._musicButton.x = this._musicButton.width / 2;
        this._musicButton.y = this._musicButton.height / 2;
        this._sfxButton.x = Config.options.width - this._sfxButton.width / 2;
        this._sfxButton.y = this._musicButton.y;
        this._sfxButton.setScrollFactor(0);
        this._musicButton.setScrollFactor(0);
        if (!Config.model.MusicOn) {
            this._musicButton.toggle();
        }
        if (!Config.model.SoundOn) {
            this._sfxButton.toggle();
        }
    }
}
class ToggleButton extends Phaser.GameObjects.Container {
    constructor(config) {
        super(config.scene);
        this.scene = config.scene;
        this._config = config;
        this._back = this._config.scene.add.image(0, 0, config.backKey);
        this._onIcon = this._config.scene.add.image(0, 0, config.onIconKey);
        this._offIcon = this._config.scene.add.image(0, 0, config.offIconKey);
        Align.scaleToGameWidth(this._back, 0.1);
        Align.scaleToGameWidth(this._onIcon, 0.05);
        Align.scaleToGameWidth(this._offIcon, 0.05);
        this.add(this._back);
        this.add(this._onIcon);
        this.add(this._offIcon);
        this._value = config.value;
        this.setIcons();
        this._back.setInteractive();
        this._back.on("pointerdown", this.toggle, this);
        this.x = this._config.x;
        this.y = this._config.y;
        this.setSize(this._back.displayWidth, this._back.displayHeight);
        this.scene.add.existing(this);
    }
    setIcons() {
        this._onIcon.visible = this._value;
        this._offIcon.visible = !this._value;
    }
    toggle() {
        this._value = !this._value;
        this.setIcons();
        Config.emitter.emit(this._config.event, this._value);
    }
}
class Align {
    static scaleToGameWidth(obj, percentage) {
        obj.displayWidth = Config.options.width * percentage;
        obj.scaleY = obj.scaleX;
    }
    static center(obj) {
        obj.x = Config.options.width / 2;
        obj.y = Config.options.height / 2;
    }
    static centerHorizontal(obj) {
        obj.x = Config.options.width / 2;
    }
    static centerVertical(obj) {
        obj.y = Config.options.height / 2;
    }
}
class AlignGrid {
    constructor(config) {
        this.config = config;
        if (!config.scene) {
            console.log("missing scene");
            return;
        }
        if (config.rows == 0) {
            this.config.rows = 5;
        }
        if (config.cols == 0) {
            this.config.cols = 5;
        }
        this.config.height = (config.height == undefined ? Config.options.height : config.height);
        this.config.width = (config.width == undefined ? Config.options.width : config.width);
        this.config.scene = config.scene;
        // cell params
        this.cw = this.config.width / this.config.cols;
        this.ch = this.config.height / this.config.rows;
    }
    show() {
        this.gfx = this.config.scene.add.graphics();
        this.gfx.lineStyle(2, 0xFF0000);
        for (var i = 0; i < this.config.width; i += this.cw) {
            this.gfx.moveTo(i, 0);
            this.gfx.lineTo(i, this.config.height);
        }
        for (var i = 0; i < this.config.height; i += this.ch) {
            this.gfx.moveTo(0, i);
            this.gfx.lineTo(this.config.height, i);
        }
        this.gfx.strokePath();
    }
    placeAt(gridX, gridY, obj) {
        // calc position based on cell w/h
        var x2 = this.cw * (gridX + 0.5);
        var y2 = this.ch * (gridY + 0.5);
        obj.x = x2;
        obj.y = y2;
    }
    placeAtIndex(index, obj) {
        var yy = Math.floor(index / this.config.cols);
        var xx = index - (yy * this.config.cols);
        this.placeAt(xx, yy, obj);
    }
    showNumbers() {
        this.show();
        var count = 0;
        for (var i = 0; i < this.config.rows; i += 1) {
            for (var j = 0; j < this.config.cols; j += 1) {
                let numText = this.config.scene.add.text(0, 0, count.toString(), { color: "#FF0000" });
                numText.setOrigin(0.5, 0.5);
                this.placeAtIndex(count, numText);
                count += 1;
            }
        }
    }
}
class Collision {
    static checkCollide(obj1, obj2) {
        let distX = Math.abs(obj1.x - obj2.x);
        let distY = Math.abs(obj1.y - obj2.y);
        if (distX < obj1.width / 2 && distY < obj1.height) {
            return true;
        }
        return false;
    }
}
class MediaManager {
    constructor(config) {
        this.config = config;
        Config.emitter.on(Constants.PLAY_SOUND, this.playSound, this);
        Config.emitter.on(Constants.MUSIC_CHANGED, this.musicChanged, this);
    }
    playSound(key) {
        if (Config.model.SoundOn) {
            let sound = this.config.scene.sound.add(key);
            sound.play();
        }
    }
    setBackgroundMusic(key) {
        if (this.background != null)
            return;
        this.background = this.config.scene.sound.add(key, { volume: 0.5, loop: true });
        if (Config.model.MusicOn) {
            this.background.play();
        }
    }
    musicChanged() {
        if (this.background) {
            if (Config.model.MusicOn) {
                this.background.play();
            }
            else {
                this.background.stop();
            }
        }
    }
}
//# sourceMappingURL=index.js.map