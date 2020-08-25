"use strict";
class Config {
    static initGame() {
        let gameConfig = {
            width: this.gameOptions.gameWidth,
            height: this.gameOptions.gameHeight,
            backgroundColor: 0x000000,
            parent: 'game-div',
            scene: [LoaderScene, GameScene],
        };
        this.gameReference = new Phaser.Game(gameConfig);
    }
}
Config.emitter = new Phaser.Events.EventEmitter(); //: Phaser.Events.EventEmitter;
Config.gameOptions = {
    gameWidth: 400,
    gameHeight: 400,
    buttonWidth: 123,
    buttonHeight: 35,
    cardWidth: 79,
    cardHeight: 110,
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
window.onload = () => {
    Config.initGame();
};
var Point = Phaser.Geom.Point;
class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }
    create() {
        let feltAsset = this.add.image(0, 0, "felt");
        feltAsset.setOrigin(0, 0);
        this.add.sprite(100, 100, "card", 12);
    }
}
class LoaderScene extends Phaser.Scene {
    constructor() {
        super("LoaderScene");
    }
    preload() {
        this.load.image("felt", "assets/images/Felt.png");
        this.load.spritesheet("card", "assets/images/Galaxy Cards.png", {
            frameWidth: Config.gameOptions.cardWidth,
            frameHeight: Config.gameOptions.cardHeight
        });
    }
    create() {
        this.scene.start("GameScene");
    }
}
//# sourceMappingURL=index.js.map