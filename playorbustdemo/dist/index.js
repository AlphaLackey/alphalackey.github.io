"use strict";
class CardTarget {
}
CardTarget.Player = 0;
CardTarget.Dealer = 1;
CardTarget.Board = 2;
class Config {
    static initGame() {
        let gameConfig = {
            width: this.gameOptions.gameWidth,
            height: this.gameOptions.gameHeight,
            type: Phaser.AUTO,
            backgroundColor: 0x000000,
            parent: 'game-div',
            scene: [LoaderScene, GameScene, HelpScene],
            scale: {
                parent: 'game-div',
                mode: Phaser.Scale.FIT,
                width: this.gameOptions.gameWidth,
                height: this.gameOptions.gameHeight
            }
        };
        this.gameReference = new Phaser.Game(gameConfig);
    }
}
Config.emitter = new Phaser.Events.EventEmitter(); //: Phaser.Events.EventEmitter;
Config.gameOptions = {
    gameWidth: 1024,
    gameHeight: 760,
    buttonWidth: 123,
    buttonHeight: 35,
    cardWidth: 79,
    cardHeight: 123,
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
    //#endregion
    constructor() {
        super("GameScene");
        //#region Constants
        this.PlayerHandAnchor = new Point(230, 500);
        this.DealerHandAnchor = new Point(465, 75);
        this.BoardAnchor = new Point(465, 220);
        this.AntePayoffOffset = new Point(-34, -37);
        this.PlayPayoffOffset = new Point(-34, -37);
        this.BonusPayoffOffset = new Point(-34, -37);
        this.BustPayoffOffset = new Point(34, -37);
        this.TargetFontInstructionSize = 22;
        this.CommentaryAnchor = new Point(10, 10);
        this.CommentarySpacing = 30;
        this.NumberOfDecks = 1;
        //#endregion
        //#region Hand information
        this._playerAnchor = new Point();
        this._playerHand = new Array(0);
        this._playerTotal = 0;
        this._dealerAnchor = new Point();
        this._dealerHand = new Array(0);
        this._dealerTotal = 0;
        this._boardAnchor = new Point();
        this._boardHand = new Array(0);
        this._chipButtons = new Array(0);
        this._score = 0;
        // #endregion
        //#region Game lists
        this._stepList = new Array(0);
        this._commentaryList = new Array(0);
        this._payoutList = new Array(0);
        //#endregion
        //#region Other member variables
        this._currentState = -1;
        this._antePayout = 0;
        this._playPayout = 0;
        this._bustPayout = 0;
        this._optimalPlay = 0;
        this._optimalAnnotation = "";
        this._doubleCheck = false;
        //#endregion
        //#region Test hands
        this._testDealerHand = new Array(0);
        this._testPlayerHand = new Array(0);
        this._testBoard = new Array(0);
    }
    create() {
        // Add the game felt.
        let feltGraphic = this.add.image(0, 0, "gameFelt");
        feltGraphic.setOrigin(0, 0);
        let paytableGraphic = this.add.image(650, 15, "logo");
        paytableGraphic.scale = 0.2;
        paytableGraphic.setOrigin(0, 0);
        let oddsGraphic = this.add.image(650, 225, "oddsPaytable");
        oddsGraphic.scale = 0.5;
        oddsGraphic.setOrigin(0, 0);
        let mainGraphic = this.add.image(628, 435, "mainGamePaytable");
        mainGraphic.scale = 0.5;
        mainGraphic.setOrigin(0, 0);
        // Creates the shoe object
        let cardRanks = new Array(52);
        for (let rank = 0; rank < 52; rank += 1)
            cardRanks[rank] = 1;
        this._shoe = new QuantumShoe(cardRanks, this.NumberOfDecks);
        // Turn on listening to input events
        this.input.on('gameobjectup', function (_, gameObject) {
            gameObject.emit('clicked', gameObject);
        }, this);
        //#region Scoreboard panel graphics
        // create handler to graphics object
        let graphics = this.add.graphics();
        // add the score display
        let scoreBitmap = this.add.image(15, 695, "blueText");
        scoreBitmap.setOrigin(0, 0);
        scoreBitmap.setDisplaySize(130, 50);
        graphics.lineStyle(5, 0xffffff, 1);
        graphics.strokeRoundedRect(15, 695, 130, 50, 5);
        this._scoreField = this.add.text(15, 695, [""]);
        this._scoreField.setFixedSize(130, 50);
        this._scoreField.setPadding(0, 3, 0, 0);
        this._scoreField.setStyle(Config.gameOptions.scoreFormat);
        this.Score = 5000;
        // Now, add the help field
        let helpBitmap = this.add.image(440, 695, "grayTextLarge");
        helpBitmap.setOrigin(0, 0);
        helpBitmap.setDisplaySize(569, 50);
        this._helpField = this.add.text(440, 695, [""]);
        this._helpField.setFixedSize(569, 0);
        this._helpField.setPadding(0, 3, 0, 0);
        this._helpField.setStyle(Config.gameOptions.helpFormat);
        this._helpField.setWordWrapWidth(569);
        graphics.lineStyle(6, 0xffffff, 1);
        graphics.strokeRoundedRect(440, 695, 569, 50, 5);
        let chipDenominations = [1, 5, 25, 100];
        for (let index = 0; index < chipDenominations.length; index += 1) {
            let chipButton = new Chip({
                scene: this,
                x: 188 + (index * 70),
                y: 720
            });
            chipButton.Value = chipDenominations[index];
            chipButton.setOrigin(.5, .5);
            chipButton.setInteractive({ useHandCursor: true });
            chipButton.on("clicked", this.selectChip, this);
            this.add.existing(chipButton);
            this._chipButtons.push(chipButton);
        }
        this.selectCursorValue(5);
        //#endregion
        //#region Button panels
        //#region Clear | Deal panel
        this._clearButton = new Button({
            scene: this,
            style: AssetNames.BlueSmall,
            caption: "CLEAR",
            clickEvent: Emissions.ClearBettingSpots,
            x: 379,
            y: 665,
            visible: false
        });
        this.add.existing(this._clearButton);
        Config.emitter.on(Emissions.ClearBettingSpots, this.clearBettingSpots, this);
        this._dealButton = new Button({
            scene: this,
            style: AssetNames.BlueSmall,
            caption: "DEAL",
            clickEvent: Emissions.BeginDeal,
            x: 522,
            y: 665,
            visible: false
        });
        this.add.existing(this._dealButton);
        Config.emitter.on(Emissions.BeginDeal, this.beginDeal, this);
        this._clearDealPanel = [
            this._clearButton,
            this._dealButton
        ];
        //#endregion
        //#region New | Rebet panel
        this._newButton = new Button({
            scene: this,
            style: AssetNames.BlueSmall,
            caption: "NEW",
            clickEvent: Emissions.NewGame,
            x: 379,
            y: 665,
            visible: false
        });
        this.add.existing(this._newButton);
        Config.emitter.on(Emissions.NewGame, this.newBets, this);
        this._rebetButton = new Button({
            scene: this,
            style: AssetNames.BlueSmall,
            caption: "REBET",
            clickEvent: Emissions.RebetBets,
            x: 522,
            y: 665,
            visible: false
        });
        this.add.existing(this._rebetButton);
        Config.emitter.on(Emissions.RebetBets, this.rebetBets, this);
        this._newRebetButtonPanel = [this._newButton, this._rebetButton];
        //#endregion
        // Help button
        this._helpButton = new Button({
            scene: this,
            style: AssetNames.BlueSmall,
            caption: "HELP",
            clickEvent: Emissions.HelpScreen,
            x: 952,
            y: 30,
            visible: true
        });
        this.add.existing(this._helpButton);
        Config.emitter.on(Emissions.HelpScreen, this.helpScreen, this);
        //#region Control panel
        this._playButton = new Button({
            scene: this,
            style: AssetNames.GreenSmall,
            caption: "PLAY",
            clickEvent: Emissions.MakePlayWager,
            x: 236 + 204,
            y: 665,
            visible: false
        });
        this.add.existing(this._playButton);
        Config.emitter.on(Emissions.MakePlayWager, this.makePlayWager, this);
        this._bustButton = new Button({
            scene: this,
            style: AssetNames.GreenSmall,
            caption: "BUST",
            clickEvent: Emissions.MakeBustWager,
            x: 379 + 204,
            y: 665,
            visible: false
        });
        this.add.existing(this._bustButton);
        Config.emitter.on(Emissions.MakeBustWager, this.makeBustWager, this);
        this._foldButton = new Button({
            scene: this,
            style: AssetNames.RedSmall,
            caption: "FOLD",
            clickEvent: Emissions.Fold,
            x: 522 + 204,
            y: 665,
            visible: false
        });
        this.add.existing(this._foldButton);
        Config.emitter.on(Emissions.Fold, this.foldHand, this);
        this._hintButton = new Button({
            scene: this,
            style: AssetNames.BlueSmall,
            caption: "HINT",
            clickEvent: Emissions.HintPlease,
            x: 726 + 226,
            y: 665,
            visible: false
        });
        this.add.existing(this._hintButton);
        Config.emitter.on(Emissions.HintPlease, this.hintPlease, this);
        this._mainPanel = [
            this._playButton,
            this._bustButton,
            this._foldButton,
            this._hintButton
        ];
        //#endregion
        let spotAnchor;
        graphics.lineStyle(5, 0xffffff, 1);
        //#region Ante spot
        spotAnchor = new Point(540, 500);
        graphics.beginPath();
        graphics.moveTo(spotAnchor.x - 27, spotAnchor.y - 68);
        graphics.lineTo(spotAnchor.x + 16, spotAnchor.y - 25);
        graphics.lineTo(spotAnchor.x - 27, spotAnchor.y + 18);
        graphics.lineTo(spotAnchor.x - 70, spotAnchor.y - 25);
        graphics.closePath();
        graphics.strokePath();
        let anteLabel = this.add.text(spotAnchor.x - 68, spotAnchor.y + 25, "ANTE");
        anteLabel.setFixedSize(80, 22);
        anteLabel.setStyle(Config.gameOptions.feltFormat);
        this._anteSpot = new BettingSpot({
            scene: this,
            x: spotAnchor.x,
            y: spotAnchor.y,
            amount: 0,
            isOptional: false,
            isLocked: false,
            isPlayerSpot: true,
            minimumBet: 5,
            maximumBet: 100,
            payoffOffset: this.AntePayoffOffset
        });
        this._anteSpot.HitZone.on("clicked", this.addSelectedValue, this);
        this.add.existing(this._anteSpot);
        //#endregion
        //#region Play spot
        spotAnchor = new Point(492, 591);
        graphics.fillStyle(0x000000);
        graphics.beginPath();
        graphics.moveTo(spotAnchor.x - 27, spotAnchor.y - 68);
        graphics.lineTo(spotAnchor.x + 16, spotAnchor.y - 25);
        graphics.lineTo(spotAnchor.x - 27, spotAnchor.y + 18);
        graphics.lineTo(spotAnchor.x - 70, spotAnchor.y - 25);
        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();
        let playLabel = this.add.text(spotAnchor.x - 68, spotAnchor.y + 25, "PLAY");
        playLabel.setFixedSize(80, 22);
        playLabel.setStyle(Config.gameOptions.feltFormat);
        this._playSpot = new BettingSpot({
            scene: this,
            x: spotAnchor.x,
            y: spotAnchor.y,
            amount: 0,
            isOptional: true,
            isLocked: true,
            isPlayerSpot: false,
            minimumBet: 5,
            maximumBet: 100,
            payoffOffset: this.PlayPayoffOffset
        });
        this.add.existing(this._playSpot);
        //#endregion
        //#region Bust spot
        spotAnchor = new Point(590, 591);
        graphics.fillStyle(0xFF0000);
        graphics.beginPath();
        graphics.moveTo(spotAnchor.x - 27, spotAnchor.y - 68);
        graphics.lineTo(spotAnchor.x + 16, spotAnchor.y - 25);
        graphics.lineTo(spotAnchor.x - 27, spotAnchor.y + 18);
        graphics.lineTo(spotAnchor.x - 70, spotAnchor.y - 25);
        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();
        let bustLabel = this.add.text(spotAnchor.x - 68, spotAnchor.y + 25, "BUST");
        bustLabel.setFixedSize(80, 22);
        bustLabel.setStyle(Config.gameOptions.feltFormat);
        this._bustSpot = new BettingSpot({
            scene: this,
            x: spotAnchor.x,
            y: spotAnchor.y,
            amount: 0,
            isOptional: true,
            isLocked: true,
            isPlayerSpot: false,
            minimumBet: 5,
            maximumBet: 100,
            payoffOffset: this.BustPayoffOffset
        });
        this.add.existing(this._bustSpot);
        //#endregion
        //#region Bonus spot
        spotAnchor = new Point(540, 389);
        graphics.lineStyle(5, 0xff0000, 1);
        graphics.strokeCircle(spotAnchor.x - 28, spotAnchor.y - 26, 40);
        let bonusLabel = this.add.text(spotAnchor.x - 68, spotAnchor.y + 19, "ODDS");
        bonusLabel.setFixedSize(80, 22);
        bonusLabel.setStyle(Config.gameOptions.feltFormat);
        this._bonusSpot = new BettingSpot({
            scene: this,
            x: spotAnchor.x,
            y: spotAnchor.y,
            amount: 0,
            isOptional: true,
            isLocked: false,
            isPlayerSpot: true,
            minimumBet: 5,
            maximumBet: 100,
            payoffOffset: this.BonusPayoffOffset
        });
        this._bonusSpot.HitZone.on("clicked", this.addSelectedValue, this);
        this.add.existing(this._bonusSpot);
        this._bettingSpots = [
            this._anteSpot,
            this._playSpot,
            this._bustSpot,
            this._bonusSpot
        ];
        this._lastWagerAmounts = new Array(this._bettingSpots.length);
        this.Score = 10000;
        this.CurrentState = GameState.Predeal;
        //#endregion
    }
    //#region Animation methods
    doAnimation() {
        let thisAction = this._stepList.shift();
        switch (thisAction) {
            case Steps.CardToPlayer: {
                this.deliverCard(CardTarget.Player);
                break;
            }
            case Steps.CardToDealer: {
                this.deliverCard(CardTarget.Dealer);
                break;
            }
            case Steps.CardToBoard: {
                this.deliverCard(CardTarget.Board);
                break;
            }
            case Steps.FoldHand: {
                this.resolvePayout(this._anteSpot, -1, false, true);
                break;
            }
            case Steps.FlipBoardHand: {
                this.flipHand(CardTarget.Board);
                break;
            }
            case Steps.FlipDealerHand: {
                this.flipHand(CardTarget.Dealer);
                break;
            }
            case Steps.CalculateTotals: {
                this._playerTotal = this.calculateTotal(this._playerHand);
                this._dealerTotal = this.calculateTotal(this._dealerHand);
                let cardNumbers = [
                    this._playerHand[0].CardNumber,
                    this._playerHand[1].CardNumber
                ];
                let highRank = Math.floor(Math.max(cardNumbers[0], cardNumbers[1]) / 4);
                let lowRank = Math.floor(Math.min(cardNumbers[0], cardNumbers[1]) / 4);
                let isSuited = (cardNumbers[0] % 4 == cardNumbers[1] % 4);
                this._optimalPlay = Strategy.Play;
                if (isSuited) {
                    this._optimalAnnotation = "Any two suited cards: PLAY";
                }
                else if (highRank == lowRank) {
                    this._optimalAnnotation = "Any two suited cards: PLAY";
                }
                else if (highRank >= 11) {
                    this._optimalAnnotation = "Any king-high or ace-high: PLAY";
                }
                else if (highRank == 10 && lowRank >= 2) {
                    this._optimalAnnotation = "Queen-four through queen-jack: PLAY";
                }
                else if ((highRank - lowRank) == 1) {
                    this._optimalAnnotation = "Any two connected cards: PLAY";
                }
                else if ((highRank - lowRank) == 2 && (lowRank >= 3)) {
                    this._optimalAnnotation = "Any one-gap hand at least seven-five or higher: PLAY";
                }
                else {
                    this._optimalAnnotation = "Make BUST wager.";
                    this._optimalPlay = Strategy.Bust;
                }
                this.doAnimation();
                break;
            }
            case Steps.ResolveBonus: {
                let payout = -1;
                let bonusAnnotation = "Odds wager loses";
                let playerRank = Math.floor(this._playerTotal / 100000);
                let allPlayerCards = [
                    this._playerHand[0].CardNumber,
                    this._playerHand[1].CardNumber,
                    this._boardHand[0].CardNumber,
                    this._boardHand[1].CardNumber
                ];
                let highCardNumber = allPlayerCards.reduce((a, b) => a > b ? a : b);
                let highCardRank = Math.floor(highCardNumber / 4);
                if (playerRank == ThreeCardPokerRank.MiniRoyal) {
                    bonusAnnotation = "Odds pays 50:1 for Mini Royal";
                    payout = 50;
                }
                else if (playerRank == ThreeCardPokerRank.StraightFlush) {
                    bonusAnnotation = "Odds pays 10:1 for straight flush";
                    payout = 10;
                }
                else if (playerRank == ThreeCardPokerRank.Trips) {
                    bonusAnnotation = "Odds pays 10:1 for trips";
                    payout = 10;
                }
                else if (playerRank == ThreeCardPokerRank.Straight) {
                    bonusAnnotation = "Odds pays 2:1 for straight";
                    payout = 2;
                }
                else if (playerRank == ThreeCardPokerRank.NoPair) {
                    if (highCardRank <= 5) {
                        bonusAnnotation = "Odds pays 10:1 for 6/7 high bust";
                        payout = 10;
                    }
                    else if (highCardRank <= 9) {
                        bonusAnnotation = "Odds pays 2:1 for 8/9/T/J high bust";
                        payout = 2;
                    }
                }
                this.addCommentaryField(bonusAnnotation);
                this.resolvePayout(this._bonusSpot, payout, true, true);
                break;
            }
            case Steps.CalculateGamePayouts: {
                let playerRank = Math.floor(this._playerTotal / 100000);
                if (this._playerTotal < this._dealerTotal) {
                    this._antePayout = -1;
                    this._playPayout = -1;
                }
                else if (this._playerTotal == this._dealerTotal) {
                    this._antePayout = 0;
                    this._playPayout = 0;
                }
                else if (playerRank >= ThreeCardPokerRank.OnePair) {
                    this._antePayout = 1;
                    this._playPayout = 1;
                }
                else {
                    this._antePayout = 1;
                    this._playPayout = 0;
                }
                this._bustPayout = (playerRank == ThreeCardPokerRank.NoPair ? 2 : -1);
                this.doAnimation();
                break;
            }
            case Steps.ResolveAnteWager: {
                if (this._antePayout == 0) {
                    this.addCommentaryField("Ante wager pushes.");
                    this.doAnimation();
                }
                else {
                    if (this._antePayout == 1) {
                        this.addCommentaryField("Ante wager pays 1:1");
                    }
                    else if (this._antePayout == -1) {
                        this.addCommentaryField("Ante wager loses");
                    }
                    this.resolvePayout(this._anteSpot, this._antePayout, true, true);
                }
                break;
            }
            case Steps.ResolvePlayWager: {
                if (this._playPayout == 0) {
                    this.doAnimation();
                }
                else {
                    if (this._playPayout == 1) {
                        this.addCommentaryField("Play wager pays 1:1");
                    }
                    else if (this._playPayout == -1) {
                        this.addCommentaryField("Play wager loses");
                    }
                    this.resolvePayout(this._playSpot, this._playPayout, true, true);
                }
                break;
            }
            case Steps.ResolveBustWager: {
                if (this._bustPayout == 0) {
                    this.doAnimation();
                }
                else {
                    if (this._bustPayout == 2) {
                        this.addCommentaryField("Bust wager pays 2:1");
                    }
                    else if (this._bustPayout == -1) {
                        this.addCommentaryField("Bust wager loses");
                    }
                    this.resolvePayout(this._bustSpot, this._bustPayout, true, true);
                }
                break;
            }
            case Steps.AnnotatePlayer: {
                this.addCommentaryField("Player hand: " + ThreeCardDescriptors[this._playerTotal]);
                this.doAnimation();
                break;
            }
            case Steps.AnnotateDealer: {
                this.addCommentaryField("Dealer hand: " + ThreeCardDescriptors[this._dealerTotal]);
                this.doAnimation();
                break;
            }
            case Steps.ChangeStateMainInput: {
                this.CurrentState = GameState.MainInput;
                break;
            }
            case Steps.ChangeStateGameOver: {
                this.CurrentState = GameState.GameOver;
                break;
            }
            default: {
                console.debug("STEP NOT RESOLVED: ", thisAction);
                this._stepList = [];
            }
        }
    }
    //#endregion
    //#region Logic methods
    addCommentaryField(fieldText) {
        let newCommentary = this.add.text(this.CommentaryAnchor.x, (this._commentaryList.length * this.CommentarySpacing) + this.CommentaryAnchor.y, fieldText, Config.gameOptions.commentaryFormat);
        this._commentaryList.push(newCommentary);
    }
    calculateTotal(holeCards) {
        let peakHand = -1;
        let cards = [
            holeCards[0].CardNumber,
            holeCards[1].CardNumber,
            this._boardHand[0].CardNumber,
            this._boardHand[1].CardNumber,
        ];
        peakHand = Math.max(peakHand, ThreeCardEvaluator.cardVectorToHandNumber([cards[0], cards[1], cards[2]], false));
        peakHand = Math.max(peakHand, ThreeCardEvaluator.cardVectorToHandNumber([cards[0], cards[1], cards[3]], false));
        peakHand = Math.max(peakHand, ThreeCardEvaluator.cardVectorToHandNumber([cards[0], cards[2], cards[3]], false));
        peakHand = Math.max(peakHand, ThreeCardEvaluator.cardVectorToHandNumber([cards[1], cards[2], cards[3]], false));
        return peakHand;
    }
    updateLocation(location, isPlayer, isBackwards = false) {
        if (isPlayer) {
            // Is for player
            location.x += (100 * (isBackwards ? -1 : 1));
        }
        else {
            // Is for dealer
            location.x += (100 * (isBackwards ? -1 : 1));
        }
    }
    clearGameObjectArray(target) {
        for (let index = 0; index < target.length; index += 1) {
            target[index].destroy();
        }
        target.length = 0;
    }
    predealInitialization() {
        // Shuffle shoe
        this._shoe.shuffle();
        // Clear arrays
        this.clearGameObjectArray(this._playerHand);
        this.clearGameObjectArray(this._dealerHand);
        this.clearGameObjectArray(this._boardHand);
        this.clearGameObjectArray(this._payoutList);
        this.clearGameObjectArray(this._commentaryList);
        // Reset hand values
        this._playerTotal = 0;
        this._dealerTotal = 0;
        // Reset anchors, if needed:
        this._playerAnchor.setTo(this.PlayerHandAnchor.x, this.PlayerHandAnchor.y);
        this._dealerAnchor.setTo(this.DealerHandAnchor.x, this.DealerHandAnchor.y);
        this._boardAnchor.setTo(this.BoardAnchor.x, this.BoardAnchor.y);
        // Clear betting spots
        for (let i = 0; i < this._bettingSpots.length; i += 1) {
            this._bettingSpots[i].Amount = 0;
            this._bettingSpots[i].alpha = 1.0;
            if (this._bettingSpots[i].IsPlayerSpot) {
                this._bettingSpots[i].IsLocked = false;
            }
        }
        // Hide "New | Rebet" panel
        for (let thisButton of this._newRebetButtonPanel) {
            thisButton.visible = false;
        }
        // Show "Clear | Deal" panel
        for (let thisButton of this._clearDealPanel) {
            thisButton.visible = true;
        }
        this._doubleCheck = true;
    }
    //#endregion
    //#region Animation methods
    flipHand(target) {
        let tweenDurations = [200, 200, 200, 200, 200, 200];
        let tweenDelays = [0, 200, 400, 600, 800, 1000];
        let handTarget;
        if (target == CardTarget.Dealer) {
            handTarget = this._dealerHand;
        }
        else if (target == CardTarget.Board) {
            handTarget = this._boardHand;
        }
        else {
            console.debug("invalid target ", target, " in flip hand");
            return;
        }
        this.add.tween({
            targets: handTarget[0],
            delay: tweenDelays[0],
            duration: tweenDurations[0],
            x: "-=30",
        });
        this.add.tween({
            targets: handTarget[0],
            delay: tweenDelays[1],
            duration: tweenDurations[1],
            scaleX: 0,
            scaleY: 1.2,
            onComplete: () => {
                handTarget[0].IsFaceUp = true;
            }
        });
        this.add.tween({
            targets: handTarget[0],
            delay: tweenDelays[2],
            duration: tweenDurations[2],
            scaleX: 1.0,
            scaleY: 1.0
        });
        this.add.tween({
            targets: handTarget[1],
            delay: tweenDelays[3],
            duration: tweenDurations[3],
            x: "-=30",
        });
        this.add.tween({
            targets: handTarget[1],
            delay: tweenDelays[4],
            duration: tweenDurations[4],
            scaleX: 0,
            scaleY: 1.2,
            onComplete: () => {
                handTarget[1].IsFaceUp = true;
            }
        });
        this.add.tween({
            targets: handTarget[1],
            delay: tweenDelays[5],
            duration: tweenDurations[5],
            scaleX: 1.0,
            scaleY: 1.0,
            onComplete: this.doAnimation,
            onCompleteScope: this
        });
    }
    deliverCard(target) {
        let nextCardNumber;
        if (target == CardTarget.Player) {
            if (this._playerHand.length >= this._testPlayerHand.length) {
                nextCardNumber = this._shoe.drawCard();
            }
            else {
                nextCardNumber = this._testPlayerHand[this._playerHand.length];
            }
        }
        else if (target == CardTarget.Dealer) {
            if (this._dealerHand.length >= this._testDealerHand.length) {
                nextCardNumber = this._shoe.drawCard();
            }
            else {
                nextCardNumber = this._testDealerHand[this._dealerHand.length];
            }
        }
        else if (target == CardTarget.Board) {
            if (this._boardHand.length >= this._testBoard.length) {
                nextCardNumber = this._shoe.drawCard();
            }
            else {
                nextCardNumber = this._testBoard[this._boardHand.length];
            }
        }
        else {
            console.debug("Eh, messed up target in deliver card");
            return;
        }
        let nextCard = new PlayingCard({
            scene: this,
            x: 0,
            y: 0,
            cardNumber: nextCardNumber,
            isFaceUp: target == CardTarget.Player
        });
        nextCard.setOrigin(0.5, 0.5);
        this.add.existing(nextCard);
        if (target == CardTarget.Player) {
            this._playerHand.push(nextCard);
            this.tweens.add({
                targets: nextCard,
                duration: 400,
                x: this._playerAnchor.x,
                y: this._playerAnchor.y,
                ease: Phaser.Math.Easing.Expo.Out,
                onComplete: this.doAnimation,
                onCompleteScope: this
            });
            this.updateLocation(this._playerAnchor, true);
        }
        else if (target == CardTarget.Dealer) {
            this._dealerHand.push(nextCard);
            this.tweens.add({
                targets: nextCard,
                duration: 400,
                x: this._dealerAnchor.x,
                y: this._dealerAnchor.y,
                ease: Phaser.Math.Easing.Expo.Out,
                onComplete: this.doAnimation,
                onCompleteScope: this
            });
            this.updateLocation(this._dealerAnchor, false);
        }
        else if (target == CardTarget.Board) {
            this._boardHand.push(nextCard);
            this.tweens.add({
                targets: nextCard,
                duration: 400,
                x: this._boardAnchor.x,
                y: this._boardAnchor.y,
                ease: Phaser.Math.Easing.Expo.Out,
                onComplete: this.doAnimation,
                onCompleteScope: this
            });
            this.updateLocation(this._boardAnchor, false);
        }
    }
    playChipClick() {
        this.sound.play("chipClick");
    }
    playButtonClick() {
        this.sound.play("buttonClick");
    }
    playChing() {
        this.sound.play("ching");
    }
    resolvePayout(wager, multiple, elevateOldBet, continueAnimation = true) {
        if (wager.Amount != 0) {
            if (multiple == -1) {
                this.Score -= wager.Amount;
                let losingPayout = new BettingSpot({
                    scene: this,
                    x: wager.x,
                    y: wager.y,
                    amount: wager.Amount,
                    isLocked: true
                });
                this._payoutList.push(losingPayout);
                this.add.existing(losingPayout);
                wager.alpha = 0;
                wager.Amount = 0;
                this.tweens.add({
                    targets: losingPayout,
                    duration: 500,
                    x: 0,
                    y: 0,
                    alpha: 0,
                    onComplete: (continueAnimation ? this.doAnimation : null),
                    onCompleteScope: this
                });
            }
            else {
                this.Score += (wager.Amount * multiple);
                let winningPayoutSpot = new BettingSpot({
                    scene: this,
                    amount: wager.Amount * multiple,
                    x: 0,
                    y: 0,
                    isLocked: true
                });
                this._payoutList.push(winningPayoutSpot);
                this.add.existing(winningPayoutSpot);
                if (elevateOldBet)
                    this.children.bringToTop(wager);
                this.tweens.add({
                    targets: winningPayoutSpot,
                    duration: 500,
                    x: wager.x + wager.PayoffOffset.x,
                    y: wager.y + wager.PayoffOffset.y,
                    onComplete: (continueAnimation ? this.doAnimation : null),
                    onCompleteScope: this
                });
            }
        }
        else {
            if (continueAnimation)
                this.doAnimation();
        }
    }
    selectCursorValue(value) {
        for (let index = 0; index < this._chipButtons.length; index += 1) {
            if (this._chipButtons[index].Value == value) {
                this._chipButtons[index].scale = 1.2;
                this._cursorValue = value;
            }
            else {
                this._chipButtons[index].scale = 1.0;
            }
        }
    }
    updateControls() {
        switch (this.CurrentState) {
            case GameState.Predeal: {
                this.predealInitialization();
                this.Instructions = StringTable.PredealInstructions;
                break;
            }
            case GameState.StartDeal: {
                // Turn off the Clear | Deal panel
                for (let thisButton of this._clearDealPanel)
                    thisButton.visible = false;
                this.Instructions = "";
                // If any non-optional wager OR partially wagered optional is not Min, make it so.
                for (let thisWager of this._bettingSpots) {
                    if (!thisWager.IsOptional || thisWager.Amount > 0) {
                        thisWager.Amount = Math.max(thisWager.Amount, thisWager.MinimumBet);
                    }
                }
                for (let chip of this._chipButtons) {
                    chip.disableInteractive();
                }
                // Store the last wagers, close wagers for business.
                for (let index = 0; index < this._lastWagerAmounts.length; index += 1) {
                    this._bettingSpots[index].disableInteractive();
                    this._bettingSpots[index].IsLocked = true;
                    this._lastWagerAmounts[index] = this._bettingSpots[index].Amount;
                }
                // TODO: load up game starting animations, ending with change to first decision.
                this._stepList.push(Steps.CardToPlayer);
                this._stepList.push(Steps.CardToPlayer);
                this._stepList.push(Steps.CardToDealer);
                this._stepList.push(Steps.CardToDealer);
                this._stepList.push(Steps.CardToBoard);
                this._stepList.push(Steps.CardToBoard);
                this._stepList.push(Steps.CalculateTotals);
                this._stepList.push(Steps.ChangeStateMainInput);
                // // and now, if you please, we'll proceed
                this.doAnimation();
                break;
            }
            case GameState.MainInput: {
                for (let thisButton of this._mainPanel) {
                    thisButton.scale = 1.0;
                    thisButton.visible = true;
                }
                break;
            }
            case GameState.GameOver: {
                for (let thisButton of this._newRebetButtonPanel)
                    thisButton.visible = true;
                for (let chip of this._chipButtons)
                    chip.setInteractive();
                this.Instructions = StringTable.GameOver;
                break;
            }
            default: {
                console.debug("STATE ID# NOT HANDLED: ", this.CurrentState);
                break;
            }
        }
    }
    //#endregion
    //#region Event handlers
    addSelectedValue(target) {
        if (this._cursorValue > 0) {
            let targetSpot = target.parentContainer;
            let newValue = Math.min(targetSpot.Amount + this._cursorValue, targetSpot.MaximumBet);
            this.playChipClick();
            targetSpot.Amount = newValue;
        }
    }
    beginDeal() {
        this.playButtonClick();
        this.CurrentState = GameState.StartDeal;
    }
    clearBettingSpots() {
        for (let spot of this._bettingSpots) {
            spot.Amount = 0;
        }
        this.playButtonClick();
    }
    helpScreen() {
        this.playButtonClick();
        this.scene.switch("HelpScene");
    }
    newBets() {
        this.playButtonClick();
        this.CurrentState = GameState.Predeal;
    }
    rebetBets() {
        this.playButtonClick();
        this.predealInitialization();
        for (let index = 0; index < this._bettingSpots.length; index += 1) {
            this._bettingSpots[index].Amount = this._lastWagerAmounts[index];
        }
        this.CurrentState = GameState.StartDeal;
    }
    selectChip(target) {
        this.playChipClick();
        this.selectCursorValue(target.Value);
    }
    makePlayWager() {
        if (this._optimalPlay != Strategy.Play && this._doubleCheck) {
            this.playChing();
            this.Instructions = "Are you sure you want to make a PLAY wager?\nOptimal strategy = " + this._optimalAnnotation;
            if (this._optimalPlay == Strategy.Play) {
                this._playButton.scale = 1.2;
            }
            else if (this._optimalPlay == Strategy.Bust) {
                this._bustButton.scale = 1.2;
            }
            this._doubleCheck = false;
        }
        else {
            this.playButtonClick();
            for (let button of this._mainPanel)
                button.visible = false;
            this._playSpot.Amount = this._anteSpot.Amount;
            this._stepList.push(Steps.FlipBoardHand);
            this._stepList.push(Steps.AnnotatePlayer);
            if (this._bonusSpot.Amount > 0) {
                this._stepList.push(Steps.ResolveBonus);
            }
            this._stepList.push(Steps.FlipDealerHand);
            this._stepList.push(Steps.AnnotateDealer);
            this._stepList.push(Steps.CalculateGamePayouts);
            this._stepList.push(Steps.ResolveAnteWager);
            this._stepList.push(Steps.ResolvePlayWager);
            this._stepList.push(Steps.ChangeStateGameOver);
            this.doAnimation();
        }
    }
    makeBustWager() {
        if (this._optimalPlay != Strategy.Bust && this._doubleCheck) {
            this.playChing();
            this.Instructions = "Are you sure you want to make a BUST wager?\nOptimal strategy = " + this._optimalAnnotation;
            if (this._optimalPlay == Strategy.Play) {
                this._playButton.scale = 1.2;
            }
            else if (this._optimalPlay == Strategy.Bust) {
                this._bustButton.scale = 1.2;
            }
            this._doubleCheck = false;
        }
        else {
            this.playButtonClick();
            for (let button of this._mainPanel)
                button.visible = false;
            this._bustSpot.Amount = this._anteSpot.Amount;
            this._antePayout = -1;
            this._stepList.push(Steps.ResolveAnteWager);
            this._stepList.push(Steps.CalculateGamePayouts);
            this._stepList.push(Steps.FlipBoardHand);
            this._stepList.push(Steps.AnnotatePlayer);
            if (this._bonusSpot.Amount > 0) {
                this._stepList.push(Steps.ResolveBonus);
            }
            this._stepList.push(Steps.ResolveBustWager);
            this._stepList.push(Steps.ChangeStateGameOver);
            this.doAnimation();
        }
    }
    foldHand() {
        if (this._optimalPlay != Strategy.Fold && this._doubleCheck) {
            this.playChing();
            this.Instructions = "Are you sure you want to fold?\nOptimal strategy = " + this._optimalAnnotation;
            if (this._optimalPlay == Strategy.Play) {
                this._playButton.scale = 1.2;
            }
            else if (this._optimalPlay == Strategy.Bust) {
                this._bustButton.scale = 1.2;
            }
            this._doubleCheck = false;
        }
        else {
            this.playButtonClick();
            for (let button of this._mainPanel)
                button.visible = false;
            this._stepList.push(Steps.FoldHand);
            if (this._bonusSpot.Amount > 0) {
                this._stepList.push(Steps.FlipBoardHand);
                this._stepList.push(Steps.AnnotatePlayer);
                this._stepList.push(Steps.ResolveBonus);
            }
            this._stepList.push(Steps.ChangeStateGameOver);
            this.doAnimation();
        }
    }
    hintPlease() {
        this.playButtonClick();
        this.Instructions = this._optimalAnnotation;
        if (this._optimalPlay == Strategy.Bust) {
            this._bustButton.scale = 1.2;
        }
        else if (this._optimalPlay == Strategy.Play) {
            this._playButton.scale = 1.2;
        }
    }
    //#endregion
    //#region Properties
    get CurrentState() { return this._currentState; }
    set CurrentState(value) {
        this._currentState = value;
        this.updateControls();
    }
    set Instructions(value) {
        let targetFontSize = this.TargetFontInstructionSize;
        this._helpField.text = value;
        while (this._helpField.height > 50) {
            targetFontSize -= 1;
            this._helpField.setFontSize(targetFontSize - 1);
        }
    }
    get Score() { return this._score; }
    set Score(value) {
        var _a;
        while (value < 0) {
            value += 50000;
        }
        this._score = value;
        let descriptors = ["BANKROLL", General.amountToDollarString(value)];
        (_a = this._scoreField) === null || _a === void 0 ? void 0 : _a.setText(descriptors);
    }
}
class HelpScene extends Phaser.Scene {
    constructor() {
        super("HelpScene");
    }
    create() {
        this.input.on('gameobjectup', function (_, gameObject) {
            gameObject.emit('clicked', gameObject);
        }, this);
        let feltGraphic = this.add.image(0, 0, "gameFelt");
        feltGraphic.setOrigin(0, 0);
        let howToPlayGraphic = this.add.image(0, 0, "helpScreen");
        howToPlayGraphic.setOrigin(0, 0);
        let button = new Button({
            scene: this,
            style: AssetNames.BlueSmall,
            caption: "GO BACK",
            clickEvent: Emissions.ReturnToGame,
            x: 726 + 226,
            y: 665 + 64,
            visible: true
        });
        this.add.existing(button);
        Config.emitter.on(Emissions.ReturnToGame, this.returnToGame, this);
    }
    returnToGame() {
        this.sound.play("buttonClick");
        this.scene.switch("GameScene");
    }
}
class LoaderScene extends Phaser.Scene {
    constructor() {
        super("LoaderScene");
    }
    preload() {
        //#region Load sounds
        this.load.audio("chipClick", [
            "./assets/sounds/ChipClick.mp3",
            "./assets/sounds/ChipClick.ogg"
        ]);
        this.load.audio("buttonClick", [
            "./assets/sounds/Button Click.mp3",
            "./assets/sounds/Button Click.ogg"
        ]);
        this.load.audio("ching", [
            "./assets/sounds/Cash Register.mp3",
            "./assets/sounds/Cash Register.ogg"
        ]);
        //#endregion
        //#region Load graphics
        this.load.image("gameFelt", "assets/images/Blank Game Felt.png");
        this.load.image("blueText", "assets/images/Blue Text 130x50.png");
        this.load.image("grayTextSmall", "assets/images/Gray Text 345x50.png");
        this.load.image("grayTextLarge", "assets/images/Gray Text 430x50.png");
        this.load.image("dropPixel", "assets/images/Drop Shape Pixel.jpg");
        this.load.image("logo", "assets/images/POB Logo.png");
        this.load.image("oddsPaytable", "assets/images/POB Bonus Paytable.png");
        this.load.image("helpScreen", "assets/images/How To Play.png");
        this.load.image("mainGamePaytable", "assets/images/Main Game Rules.png");
        this.load.spritesheet("card", "assets/images/TGS Cards.png", {
            frameWidth: Config.gameOptions.cardWidth,
            frameHeight: Config.gameOptions.cardHeight
        });
        this.load.spritesheet("chip", "assets/images/TGS Chips.png", {
            frameWidth: Config.gameOptions.chipWidth,
            frameHeight: Config.gameOptions.chipHeight
        });
        this.load.spritesheet(AssetNames.RedSmall, "assets/images/Red 123x35.png", {
            frameWidth: Config.gameOptions.buttonWidth,
            frameHeight: Config.gameOptions.buttonHeight
        });
        this.load.spritesheet(AssetNames.BlueSmall, "assets/images/Blue 123x35.png", {
            frameWidth: Config.gameOptions.buttonWidth,
            frameHeight: Config.gameOptions.buttonHeight
        });
        this.load.spritesheet(AssetNames.GreenSmall, "assets/images/Green 123x35.png", {
            frameWidth: Config.gameOptions.buttonWidth,
            frameHeight: Config.gameOptions.buttonHeight
        });
        //#endregion
    }
    create() {
        this.scene.start("GameScene");
    }
}
class AssetNames {
}
AssetNames.RedSmall = "buttonRedSmall";
AssetNames.BlueSmall = "buttonBlueSmall";
AssetNames.GreenSmall = "buttonGreenSmall";
class BettingSpot extends Phaser.GameObjects.Container {
    constructor(config) {
        var _a, _b, _c, _d, _e, _f, _g;
        super(config.scene, config.x, config.y);
        this.ChipStackOffset = -5;
        this._amount = 0;
        this._config = config;
        this._hitZone = new Phaser.GameObjects.Image(this.scene, 0, 0, "dropPixel");
        this._hitZone.setOrigin(1, 1);
        this._hitZone.alpha = 0.00001;
        this._hitZone.setInteractive({ useHandCursor: true });
        this.add(this._hitZone);
        this._amount = (_a = config.amount) !== null && _a !== void 0 ? _a : 0;
        this._isOptional = (_b = config.isOptional) !== null && _b !== void 0 ? _b : false;
        this._isLocked = (_c = config.isLocked) !== null && _c !== void 0 ? _c : false;
        this._isPlayerSpot = (_d = config.isPlayerSpot) !== null && _d !== void 0 ? _d : true;
        this._minimumBet = (_e = config.minimumBet) !== null && _e !== void 0 ? _e : 5;
        this._maximumBet = (_f = config.maximumBet) !== null && _f !== void 0 ? _f : 100;
        this._payoffOffset = (_g = config.payoffOffset) !== null && _g !== void 0 ? _g : new Point(-34, -37);
        this.fillSpot();
    }
    //#region Methods
    fillSpot() {
        let remainingAmount = this._amount;
        let currentChipIndex = 0;
        // First, eliminate all existing children.
        this.removeAll();
        if (remainingAmount == 0) {
            if (!this._isLocked) {
                let dummyChip = new Chip({ scene: this.scene, x: 0, y: 0 });
                dummyChip.Value = 5;
                dummyChip.setOrigin(1, 1);
                this.add(dummyChip);
                dummyChip.setTint(0x0000FF);
                let width = Config.gameOptions.chipWidth;
                let height = Config.gameOptions.chipHeight;
                this._hitZone.setDisplaySize(width, height);
                this.add(this._hitZone);
            }
        }
        else {
            let stackSize = 0;
            do {
                let currentChipAmount = Config.gameOptions.chipValues[currentChipIndex];
                if (remainingAmount >= currentChipAmount) {
                    let x = 0;
                    let y = (stackSize * this.ChipStackOffset);
                    if (stackSize > 0) {
                        x += (Math.random() * 3) - 1;
                        y += (Math.random() * 3) - 1;
                    }
                    ;
                    let nextChip = new Chip({
                        scene: this.scene,
                        x: x,
                        y: y
                    });
                    nextChip.Value = currentChipAmount;
                    nextChip.setOrigin(1, 1);
                    this.add(nextChip);
                    remainingAmount = Math.round((remainingAmount - currentChipAmount) * 100) / 100;
                    stackSize += 1;
                }
                else {
                    currentChipIndex += 1;
                }
            } while (remainingAmount >= 0.5);
            let width = Config.gameOptions.chipWidth;
            let height = -((Config.gameOptions.chipHeight * -1) + ((stackSize - 1) * this.ChipStackOffset));
            this._hitZone.setDisplaySize(width, height);
            this.add(this._hitZone);
        }
    }
    //#endregion
    //#region Properties
    get Amount() { return this._amount; }
    set Amount(value) {
        this._amount = value;
        this.fillSpot();
    }
    get HitZone() { return this._hitZone; }
    get IsLocked() { return this._isLocked; }
    set IsLocked(value) {
        this._isLocked = value;
        if (value) {
            this._hitZone.disableInteractive();
        }
        else {
            this._hitZone.setInteractive();
        }
        this.fillSpot();
    }
    get IsOptional() { return this._isOptional; }
    set IsOptional(value) { this._isOptional = value; }
    get IsPlayerSpot() { return this._isPlayerSpot; }
    set IsPlayerSpot(value) { this._isPlayerSpot = value; }
    get MaximumBet() { return this._maximumBet; }
    set MaximumBet(value) { this._maximumBet = value; }
    get MinimumBet() { return this._minimumBet; }
    set MinimumBet(value) { this._minimumBet = value; }
    get PayoffOffset() { return this._payoffOffset; }
    set PayoffOffset(value) { this._payoffOffset = value; }
}
class Button extends Phaser.GameObjects.Container {
    constructor(config) {
        var _a, _b, _c, _d, _e;
        super(config.scene, config.x, config.y);
        this._isMouseOver = false;
        this.scene = config.scene;
        this._config = config;
        this._background = this._config.scene.add.sprite(0, 0, this._config.style, 0);
        this.add(this._background);
        this._background.setInteractive({ useHandCursor: true });
        this._background.on("pointerdown", this.buttonDown, this);
        this._background.on("pointerup", this.buttonUp, this);
        this._background.on("pointerover", this.buttonOver, this);
        this._background.on("pointerout", this.buttonOut, this);
        this._caption = config.caption;
        this._label = this._config.scene.add.text(0, 0, config.caption);
        this._label.setFontSize((_a = config.fontSize) !== null && _a !== void 0 ? _a : 14);
        this._label.setFontStyle((_b = config.fontStyle) !== null && _b !== void 0 ? _b : "bold");
        this._label.setColor((_c = config.fontColor) !== null && _c !== void 0 ? _c : "#FFFFFF");
        this._label.setFontFamily((_d = config.fontFamily) !== null && _d !== void 0 ? _d : "Arial");
        this._label.setOrigin(0.5, 0.5);
        this.visible = ((_e = config.visible) !== null && _e !== void 0 ? _e : true);
        this.add(this._label);
    }
    //#region Methods
    lock() {
        this._background.disableInteractive();
        this._background.setTint(0x888888);
    }
    unlock() {
        this._background.setInteractive();
        this._background.clearTint();
    }
    //#endregion
    //#region Event handlers
    buttonUp() {
        if (this._isMouseOver) {
            this._background.setFrame(1);
            if (this._config.params != undefined) {
                Config.emitter.emit(this._config.clickEvent, this._config.params);
            }
            else {
                Config.emitter.emit(this._config.clickEvent);
            }
        }
        else {
            this._background.setFrame(0);
        }
    }
    buttonOver() {
        this._background.setFrame(1);
        this._isMouseOver = true;
    }
    buttonDown() {
        this._background.setFrame(2);
    }
    buttonOut() {
        this._background.setFrame(0);
        this._isMouseOver = false;
    }
    //#endregion
    //#region Properties	
    get Caption() { return this._caption; }
    set Caption(value) {
        this._caption = value;
        this._label.setText(value);
    }
}
class Chip extends Phaser.GameObjects.Sprite {
    constructor(config) {
        super(config.scene, config.x, config.y, "chip");
        this._value = 1;
    }
    get Value() { return this._value; }
    set Value(value) {
        // Only set the chip value if it's a legal one.
        let chipIndex = Config.gameOptions.chipValues.indexOf(value);
        if (chipIndex >= 0) {
            this.setFrame(chipIndex);
            this._value = value;
        }
    }
}
class Constants {
}
Constants.CardRanks = "23456789TJQKA";
Constants.CardSuits = "CDHS";
Constants.Primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241];
Constants.FiveCardPokerHandNames = [
    "Incomplete",
    "No pair",
    "One pair",
    "Two pair",
    "Trips",
    "Straight",
    "Flush",
    "Full house",
    "Four of a kind",
    "Straight flush",
    "Royal flush",
    "Five of a kind"
];
Constants.StraightCodes = [
    [],
    [],
    [],
    [
        Constants.Primes[0] * Constants.Primes[1] * Constants.Primes[12],
        Constants.Primes[0] * Constants.Primes[1] * Constants.Primes[2],
        Constants.Primes[1] * Constants.Primes[2] * Constants.Primes[3],
        Constants.Primes[2] * Constants.Primes[3] * Constants.Primes[4],
        Constants.Primes[3] * Constants.Primes[4] * Constants.Primes[5],
        Constants.Primes[4] * Constants.Primes[5] * Constants.Primes[6],
        Constants.Primes[5] * Constants.Primes[6] * Constants.Primes[7],
        Constants.Primes[6] * Constants.Primes[7] * Constants.Primes[8],
        Constants.Primes[7] * Constants.Primes[8] * Constants.Primes[9],
        Constants.Primes[8] * Constants.Primes[9] * Constants.Primes[10],
        Constants.Primes[9] * Constants.Primes[10] * Constants.Primes[11],
        Constants.Primes[10] * Constants.Primes[11] * Constants.Primes[12]
    ],
    [
        Constants.Primes[0] * Constants.Primes[1] * Constants.Primes[2] * Constants.Primes[12],
        Constants.Primes[0] * Constants.Primes[1] * Constants.Primes[2] * Constants.Primes[3],
        Constants.Primes[1] * Constants.Primes[2] * Constants.Primes[3] * Constants.Primes[4],
        Constants.Primes[2] * Constants.Primes[3] * Constants.Primes[4] * Constants.Primes[5],
        Constants.Primes[3] * Constants.Primes[4] * Constants.Primes[5] * Constants.Primes[6],
        Constants.Primes[4] * Constants.Primes[5] * Constants.Primes[6] * Constants.Primes[7],
        Constants.Primes[5] * Constants.Primes[6] * Constants.Primes[7] * Constants.Primes[8],
        Constants.Primes[6] * Constants.Primes[7] * Constants.Primes[8] * Constants.Primes[9],
        Constants.Primes[7] * Constants.Primes[8] * Constants.Primes[9] * Constants.Primes[10],
        Constants.Primes[8] * Constants.Primes[9] * Constants.Primes[10] * Constants.Primes[11],
        Constants.Primes[9] * Constants.Primes[10] * Constants.Primes[11] * Constants.Primes[12]
    ],
    [
        Constants.Primes[0] * Constants.Primes[1] * Constants.Primes[2] * Constants.Primes[3] * Constants.Primes[12],
        Constants.Primes[0] * Constants.Primes[1] * Constants.Primes[2] * Constants.Primes[3] * Constants.Primes[4],
        Constants.Primes[1] * Constants.Primes[2] * Constants.Primes[3] * Constants.Primes[4] * Constants.Primes[5],
        Constants.Primes[2] * Constants.Primes[3] * Constants.Primes[4] * Constants.Primes[5] * Constants.Primes[6],
        Constants.Primes[3] * Constants.Primes[4] * Constants.Primes[5] * Constants.Primes[6] * Constants.Primes[7],
        Constants.Primes[4] * Constants.Primes[5] * Constants.Primes[6] * Constants.Primes[7] * Constants.Primes[8],
        Constants.Primes[5] * Constants.Primes[6] * Constants.Primes[7] * Constants.Primes[8] * Constants.Primes[9],
        Constants.Primes[6] * Constants.Primes[7] * Constants.Primes[8] * Constants.Primes[9] * Constants.Primes[10],
        Constants.Primes[7] * Constants.Primes[8] * Constants.Primes[9] * Constants.Primes[10] * Constants.Primes[11],
        Constants.Primes[8] * Constants.Primes[9] * Constants.Primes[10] * Constants.Primes[11] * Constants.Primes[12]
    ],
    [
        Constants.Primes[0] * Constants.Primes[1] * Constants.Primes[2] * Constants.Primes[3] * Constants.Primes[4] * Constants.Primes[12],
        Constants.Primes[0] * Constants.Primes[1] * Constants.Primes[2] * Constants.Primes[3] * Constants.Primes[4] * Constants.Primes[5],
        Constants.Primes[1] * Constants.Primes[2] * Constants.Primes[3] * Constants.Primes[4] * Constants.Primes[5] * Constants.Primes[6],
        Constants.Primes[2] * Constants.Primes[3] * Constants.Primes[4] * Constants.Primes[5] * Constants.Primes[6] * Constants.Primes[7],
        Constants.Primes[3] * Constants.Primes[4] * Constants.Primes[5] * Constants.Primes[6] * Constants.Primes[7] * Constants.Primes[8],
        Constants.Primes[4] * Constants.Primes[5] * Constants.Primes[6] * Constants.Primes[7] * Constants.Primes[8] * Constants.Primes[9],
        Constants.Primes[5] * Constants.Primes[6] * Constants.Primes[7] * Constants.Primes[8] * Constants.Primes[9] * Constants.Primes[10],
        Constants.Primes[6] * Constants.Primes[7] * Constants.Primes[8] * Constants.Primes[9] * Constants.Primes[10] * Constants.Primes[11],
        Constants.Primes[7] * Constants.Primes[8] * Constants.Primes[9] * Constants.Primes[10] * Constants.Primes[11] * Constants.Primes[12]
    ],
    [
        Constants.Primes[0] * Constants.Primes[1] * Constants.Primes[2] * Constants.Primes[3] * Constants.Primes[4] * Constants.Primes[5] * Constants.Primes[12],
        Constants.Primes[0] * Constants.Primes[1] * Constants.Primes[2] * Constants.Primes[3] * Constants.Primes[4] * Constants.Primes[5] * Constants.Primes[6],
        Constants.Primes[1] * Constants.Primes[2] * Constants.Primes[3] * Constants.Primes[4] * Constants.Primes[5] * Constants.Primes[6] * Constants.Primes[7],
        Constants.Primes[2] * Constants.Primes[3] * Constants.Primes[4] * Constants.Primes[5] * Constants.Primes[6] * Constants.Primes[7] * Constants.Primes[8],
        Constants.Primes[3] * Constants.Primes[4] * Constants.Primes[5] * Constants.Primes[6] * Constants.Primes[7] * Constants.Primes[8] * Constants.Primes[9],
        Constants.Primes[4] * Constants.Primes[5] * Constants.Primes[6] * Constants.Primes[7] * Constants.Primes[8] * Constants.Primes[9] * Constants.Primes[10],
        Constants.Primes[5] * Constants.Primes[6] * Constants.Primes[7] * Constants.Primes[8] * Constants.Primes[9] * Constants.Primes[10] * Constants.Primes[11],
        Constants.Primes[6] * Constants.Primes[7] * Constants.Primes[8] * Constants.Primes[9] * Constants.Primes[10] * Constants.Primes[11] * Constants.Primes[12]
    ]
];
class Emissions {
}
Emissions.ChangeCursorValue = "Change cursor value";
Emissions.ClearBettingSpots = "Clear betting spots";
Emissions.AddCursorValue = "Add cursor value";
Emissions.BeginDeal = "Begin deal";
Emissions.NewGame = "New game";
Emissions.RebetBets = "Rebet bets";
Emissions.MakePlayWager = "Make play wager";
Emissions.MakeBustWager = "Make bust wager";
Emissions.Fold = "Fold";
Emissions.HintPlease = "Hint, please";
Emissions.HelpScreen = "Help Screen";
Emissions.ReturnToGame = "Return to game";
class GameState {
}
GameState.Predeal = 0;
GameState.StartDeal = 1;
GameState.InsuranceInput = 2;
GameState.MainInput = 3;
GameState.CheckForDoubleBack = 4;
GameState.GameOver = 5;
class General {
    static amountToDollarString(value) {
        let remainder = Math.floor(value);
        let cents = Math.round((value - remainder) * 100);
        let output = "";
        let digitCount = 0;
        do {
            let thisDigit = remainder % 10;
            if (digitCount > 0 && digitCount % 3 == 0) {
                output = "," + output;
            }
            output = thisDigit.toString() + output;
            digitCount += 1;
            remainder = Math.floor(remainder / 10);
        } while (remainder > 0);
        if (cents < 10) {
            output = output + ".0" + cents.toString();
        }
        else {
            output = output + "." + cents;
        }
        return "$" + output;
    }
    static cardNumberToString(cardNumber) {
        if (cardNumber == 53) {
            return "!!";
        }
        else if (cardNumber == 52) {
            return "ZZ";
        }
        else {
            let rank = Math.floor(cardNumber / 4);
            let suit = cardNumber % 4;
            return Constants.CardRanks.substr(rank, 1) + Constants.CardSuits.substr(suit, 1);
        }
    }
    static cardStringToNumber(cardString) {
        if (cardString == "!!") {
            return 53;
        }
        else if (cardString == "ZZ") {
            return 52;
        }
        else {
            let rank = cardString.substr(0, 1);
            let suit = cardString.substr(1, 1);
            return Constants.CardRanks.indexOf(rank) * 4 + Constants.CardSuits.indexOf(suit);
        }
    }
    static cardStringToVector(cardString) {
        let particles = cardString.split(" ");
        let output = new Array(particles.length);
        for (let index = 0; index < output.length; index += 1) {
            output[index] = this.cardStringToNumber(particles[index]);
        }
        return output;
    }
    static cardVectorToString(cardVector) {
        let output = this.cardNumberToString(cardVector[0]);
        for (let index = 1; index < cardVector.length; index += 1)
            output += (" " + this.cardNumberToString(cardVector[index]));
        return output;
    }
}
class PlayingCard extends Phaser.GameObjects.Sprite {
    constructor(config) {
        var _a, _b;
        super(config.scene, config.x, config.y, "card");
        this.CardBackFrame = 54;
        this.CardNumber = ((_a = config.cardNumber) !== null && _a !== void 0 ? _a : 0);
        this.IsFaceUp = ((_b = config.isFaceUp) !== null && _b !== void 0 ? _b : false);
    }
    get CardNumber() { return this._cardNumber; }
    set CardNumber(value) {
        this._cardNumber = value;
        if (this._isFaceUp) {
            this.setFrame(value);
        }
        else {
            this.setFrame(this.CardBackFrame);
        }
    }
    get IsFaceUp() { return this._isFaceUp; }
    set IsFaceUp(value) {
        this._isFaceUp = value;
        if (value) {
            this.setFrame(this._cardNumber);
        }
        else {
            this.setFrame(this.CardBackFrame);
        }
    }
}
class QuantumShoe {
    // #region Constructors
    constructor(rankVector, numberOfDecks = 1) {
        this._infiniteDeckMode = false;
        this._baseRankCount = [];
        this._rankCount = [];
        this._numCards = 0;
        this._numDecks = numberOfDecks;
        let vectorSize = rankVector.length;
        this._numRanks = vectorSize;
        this._baseRankCount.length = vectorSize;
        this._rankCount.length = vectorSize;
        for (let rank = 0; rank < vectorSize; rank += 1) {
            this._baseRankCount[rank] = rankVector[rank] * this._numDecks;
        }
        this.shuffle();
    }
    // #endregion
    // #region Standard methods
    shuffle() {
        this._numCards = 0;
        for (let rank = 0; rank < this._numRanks; rank += 1) {
            this._rankCount[rank] = this._baseRankCount[rank];
            this._numCards += this._rankCount[rank];
        }
    }
    drawCard() {
        let seed = Math.floor(Math.random() * this._numCards);
        for (let rank = 0; rank < this._numRanks; rank += 1) {
            seed -= this._rankCount[rank];
            if (seed < 0) {
                // remove the card, unless in infinite deck mode.
                if (!this._infiniteDeckMode) {
                    this.adjustQuantityOfRank(rank, -1);
                }
                return rank;
            }
        }
        return -1;
    }
    drawReturningCountOfRank(rank) {
        let output = this._rankCount[rank];
        this.adjustQuantityOfRank(rank, -1);
        return output;
    }
    drawReturningProbabilityOfRank(rank) {
        let output = 0.0;
        if (this._rankCount[rank] > 0) {
            output = this.getProbabilityOfDrawingRank(rank);
        }
        return output;
    }
    getCountOfRank(rank) {
        return this._rankCount[rank];
    }
    getProbabilityOfDrawingRank(rank) {
        return this._rankCount[rank] / this._numCards;
    }
    adjustQuantityOfRank(rank, quantity) {
        if (this._rankCount[rank] + quantity < 0) {
            return false;
        }
        else {
            this._rankCount[rank] += quantity;
            this._numCards += quantity;
            return true;
        }
    }
    // #endregion
    // #region Properties
    get CardsRemaining() { return this._numCards; }
}
class Steps {
}
Steps.ChangeStateMainInput = "CHANGE STATE: Main input";
Steps.ChangeStateGameOver = "CHANGE STATE: Game Over";
Steps.CardToPlayer = "Card To Player";
Steps.CardToDealer = "Card To Dealer";
Steps.CardToBoard = "Card To Board";
Steps.FoldHand = "Fold hand";
Steps.FlipBoardHand = "Flip board hand";
Steps.FlipDealerHand = "Flip dealer hand";
Steps.ResolveBonus = "Resolve bonus";
Steps.CalculateTotals = "Calculate hands";
Steps.CalculateGamePayouts = "Calculate Game Payouts";
Steps.ResolveAnteWager = "Resolve Ante Wager";
Steps.ResolvePlayWager = "Resolve Play Wager";
Steps.ResolveBustWager = "Resolve Bust Wager";
Steps.AnnotatePlayer = "Annotate Player";
Steps.AnnotateDealer = "Annotate Dealer";
Steps.ResolvePlayer0 = "Resolve player hand #0";
Steps.ResolvePlayer1 = "Resolve player hand #1";
Steps.ResolvePlayer2 = "Resolve player hand #2";
Steps.ResolvePlayer3 = "Resolve player hand #3";
Steps.FlipHoleCard = "Flip hole card";
Steps.PlayDealerHand = "Play dealer hand";
Steps.DealerDrawCard = "Dealer draw card";
Steps.PostDoubleControl = "Post double control";
Steps.ResolveBust = "Resolve Bust";
Steps.SplitPair = "Split pair";
Steps.ForceNextHand = "Force next hand";
class Strategy {
}
Strategy.Play = 0;
Strategy.Bust = 1;
Strategy.Fold = 2;
class StringTable {
}
StringTable.PredealInstructions = "Click on chip to select denomination, click on ANTE and/or BONUS betting spots to add chips, click DEAL to begin.";
StringTable.GameOver = "Game over.  Click 'REBET' to play again with same wagers, or click 'NEW' to set new wagers.";
StringTable.Insurance = "Would you like insurance? (YES / NO)";
StringTable.DoubleBack = "Would you like to make a Second Chance Wager? (YES / NO)";
class ThreeCardEvaluator {
    static cardVectorToHandNumber(cardVector, isJokerFullyWild) {
        let output = -1;
        let cards = new Array(...cardVector);
        let ranks = [0, 0, 0];
        let suits = [0, 0, 0];
        let miniRoyalVector = [40, 44, 48];
        cards.sort((a, b) => a - b);
        // First, we need to check for jokers
        if (cards[0] >= 52) {
            // Three jokers
            return this.cardVectorToHandNumber(miniRoyalVector, false);
        }
        else if (cards[1] >= 52) {
            // Two jokers
            if (cards[0] >= 40) {
                return this.cardVectorToHandNumber(miniRoyalVector, false);
            }
            else {
                let straightFlushVector = [cards[0], cards[0] + 4, cards[0] + 8];
                return this.cardVectorToHandNumber(straightFlushVector, false);
            }
        }
        else if (cards[2] >= 52) {
            // One joker
            let bestHand = -1;
            for (let replacement = 0; replacement < 52; replacement += 1) {
                let testHand = [cards[0], cards[1], replacement];
                let candidate = this.cardVectorToHandNumber(testHand, isJokerFullyWild);
                if (!isJokerFullyWild && replacement < 48) {
                    let candidateRank = Math.floor(candidate / 100000);
                    if (candidateRank == ThreeCardPokerRank.Straight ||
                        candidateRank == ThreeCardPokerRank.Flush ||
                        candidateRank == ThreeCardPokerRank.StraightFlush ||
                        candidateRank == ThreeCardPokerRank.MiniRoyal) {
                        bestHand = Math.max(candidate, bestHand);
                    }
                }
                else {
                    bestHand = Math.max(candidate, bestHand);
                }
            }
            return bestHand;
        }
        else {
            // No jokers
            for (let x = 0; x < 3; x += 1) {
                ranks[x] = Math.floor(cards[x] / 4);
                suits[x] = cards[x] % 4;
            }
            let uniqueRanks;
            if (ranks[0] == ranks[1] && ranks[1] == ranks[2]) {
                uniqueRanks = 1;
            }
            else if (ranks[0] == ranks[1] || ranks[1] == ranks[2]) {
                uniqueRanks = 2;
            }
            else {
                uniqueRanks = 3;
            }
            let isSuited = (suits[0] == suits[1] && suits[1] == suits[2]);
            let isWheel = (ranks[0] == 0 && ranks[1] == 1 && ranks[2] == 12);
            let isStraight = ((ranks[2] - ranks[0]) == 2) || isWheel;
            if (uniqueRanks == 1) {
                output = ThreeCardPokerRank.Trips * 100000 + this.tiebreakByCardRanks(ranks[2], ranks[1], ranks[0]);
            }
            else if (uniqueRanks == 2) {
                if (isSuited) { // it's a pair + flush hand, which gets scored as a flush, used in multi-deck games
                    output = ThreeCardPokerRank.Flush * 100000 + this.tiebreakByCardRanks(ranks[2], ranks[1], ranks[0]);
                }
                else {
                    if (ranks[2] == ranks[1]) {
                        // Pattern of Ranks = {xYY}
                        output = ThreeCardPokerRank.OnePair * 100000 + this.tiebreakByCardRanks(ranks[2], ranks[1], ranks[0]);
                    }
                    else if (ranks[1] == ranks[0]) {
                        // Pattern of Ranks = {XXy}
                        output = ThreeCardPokerRank.OnePair * 100000 + this.tiebreakByCardRanks(ranks[1], ranks[0], ranks[2]);
                    }
                }
            }
            else if (uniqueRanks == 3) {
                if (isSuited && isStraight) {
                    if (ranks[2] == 12 && ranks[1] == 11 && ranks[0] == 10) {
                        output = ThreeCardPokerRank.MiniRoyal * 100000;
                    }
                    else {
                        output = ThreeCardPokerRank.StraightFlush * 100000;
                    }
                }
                else if (isSuited && !isStraight) {
                    output = ThreeCardPokerRank.Flush * 100000;
                }
                else if (!isSuited && isStraight) {
                    output = ThreeCardPokerRank.Straight * 100000;
                }
                else if (!isSuited && !isStraight) {
                    output = ThreeCardPokerRank.NoPair * 100000;
                }
                if (!isWheel) {
                    // Wheel has a tiebreaker of 0, it's the bottom straight
                    output += this.tiebreakByCardRanks(ranks[2], ranks[1], ranks[0]);
                }
                // if (isStraight) {
                // 	var isBroadway: Boolean = ((ranks[0] == 10) && (ranks[1] == 11) && (ranks[2] == 12));
                // 	if (isBroadway) {
                // 		output += this.tiebreakByCardRanks(ranks[2], ranks[1], ranks[0]);
                // 	} else if (isWheel) {
                // 		output += this.tiebreakByCardRanks(11, 10, 9);
                // 	} else if (ranks[0] == 0) {
                // 		// lowest card is a 2, that must mean a 4-3-2 straight, the new "wheel" -- as you know, normally bottom straight has zero tiebreaker
                // 		// NOP
                // 	} else {
                // 		output += this.tiebreakByCardRanks(ranks[2] - 1, ranks[1] - 1, ranks[0] - 1);
                // 	}
                // } else {
                // 	output += this.tiebreakByCardRanks(ranks[2], ranks[1], ranks[0]);
                // }
            }
        }
        return output;
    }
    static tiebreakByCardRanks(highRank, middleRank, lowRank) {
        return highRank * 169 + middleRank * 13 + lowRank;
    }
}
let ThreeCardDescriptors = {
    100520: "No pair, 532",
    100533: "No pair, 542",
    100689: "No pair, 632",
    100702: "No pair, 642",
    100703: "No pair, 643",
    100715: "No pair, 652",
    100716: "No pair, 653",
    100858: "No pair, 732",
    100871: "No pair, 742",
    100872: "No pair, 743",
    100884: "No pair, 752",
    100885: "No pair, 753",
    100886: "No pair, 754",
    100897: "No pair, 762",
    100898: "No pair, 763",
    100899: "No pair, 764",
    101027: "No pair, 832",
    101040: "No pair, 842",
    101041: "No pair, 843",
    101053: "No pair, 852",
    101054: "No pair, 853",
    101055: "No pair, 854",
    101066: "No pair, 862",
    101067: "No pair, 863",
    101068: "No pair, 864",
    101069: "No pair, 865",
    101079: "No pair, 872",
    101080: "No pair, 873",
    101081: "No pair, 874",
    101082: "No pair, 875",
    101196: "No pair, 932",
    101209: "No pair, 942",
    101210: "No pair, 943",
    101222: "No pair, 952",
    101223: "No pair, 953",
    101224: "No pair, 954",
    101235: "No pair, 962",
    101236: "No pair, 963",
    101237: "No pair, 964",
    101238: "No pair, 965",
    101248: "No pair, 972",
    101249: "No pair, 973",
    101250: "No pair, 974",
    101251: "No pair, 975",
    101252: "No pair, 976",
    101261: "No pair, 982",
    101262: "No pair, 983",
    101263: "No pair, 984",
    101264: "No pair, 985",
    101265: "No pair, 986",
    101365: "No pair, T32",
    101378: "No pair, T42",
    101379: "No pair, T43",
    101391: "No pair, T52",
    101392: "No pair, T53",
    101393: "No pair, T54",
    101404: "No pair, T62",
    101405: "No pair, T63",
    101406: "No pair, T64",
    101407: "No pair, T65",
    101417: "No pair, T72",
    101418: "No pair, T73",
    101419: "No pair, T74",
    101420: "No pair, T75",
    101421: "No pair, T76",
    101430: "No pair, T82",
    101431: "No pair, T83",
    101432: "No pair, T84",
    101433: "No pair, T85",
    101434: "No pair, T86",
    101435: "No pair, T87",
    101443: "No pair, T92",
    101444: "No pair, T93",
    101445: "No pair, T94",
    101446: "No pair, T95",
    101447: "No pair, T96",
    101448: "No pair, T97",
    101534: "No pair, J32",
    101547: "No pair, J42",
    101548: "No pair, J43",
    101560: "No pair, J52",
    101561: "No pair, J53",
    101562: "No pair, J54",
    101573: "No pair, J62",
    101574: "No pair, J63",
    101575: "No pair, J64",
    101576: "No pair, J65",
    101586: "No pair, J72",
    101587: "No pair, J73",
    101588: "No pair, J74",
    101589: "No pair, J75",
    101590: "No pair, J76",
    101599: "No pair, J82",
    101600: "No pair, J83",
    101601: "No pair, J84",
    101602: "No pair, J85",
    101603: "No pair, J86",
    101604: "No pair, J87",
    101612: "No pair, J92",
    101613: "No pair, J93",
    101614: "No pair, J94",
    101615: "No pair, J95",
    101616: "No pair, J96",
    101617: "No pair, J97",
    101618: "No pair, J98",
    101625: "No pair, JT2",
    101626: "No pair, JT3",
    101627: "No pair, JT4",
    101628: "No pair, JT5",
    101629: "No pair, JT6",
    101630: "No pair, JT7",
    101631: "No pair, JT8",
    101703: "No pair, Q32",
    101716: "No pair, Q42",
    101717: "No pair, Q43",
    101729: "No pair, Q52",
    101730: "No pair, Q53",
    101731: "No pair, Q54",
    101742: "No pair, Q62",
    101743: "No pair, Q63",
    101744: "No pair, Q64",
    101745: "No pair, Q65",
    101755: "No pair, Q72",
    101756: "No pair, Q73",
    101757: "No pair, Q74",
    101758: "No pair, Q75",
    101759: "No pair, Q76",
    101768: "No pair, Q82",
    101769: "No pair, Q83",
    101770: "No pair, Q84",
    101771: "No pair, Q85",
    101772: "No pair, Q86",
    101773: "No pair, Q87",
    101781: "No pair, Q92",
    101782: "No pair, Q93",
    101783: "No pair, Q94",
    101784: "No pair, Q95",
    101785: "No pair, Q96",
    101786: "No pair, Q97",
    101787: "No pair, Q98",
    101794: "No pair, QT2",
    101795: "No pair, QT3",
    101796: "No pair, QT4",
    101797: "No pair, QT5",
    101798: "No pair, QT6",
    101799: "No pair, QT7",
    101800: "No pair, QT8",
    101801: "No pair, QT9",
    101807: "No pair, QJ2",
    101808: "No pair, QJ3",
    101809: "No pair, QJ4",
    101810: "No pair, QJ5",
    101811: "No pair, QJ6",
    101812: "No pair, QJ7",
    101813: "No pair, QJ8",
    101814: "No pair, QJ9",
    101872: "No pair, K32",
    101885: "No pair, K42",
    101886: "No pair, K43",
    101898: "No pair, K52",
    101899: "No pair, K53",
    101900: "No pair, K54",
    101911: "No pair, K62",
    101912: "No pair, K63",
    101913: "No pair, K64",
    101914: "No pair, K65",
    101924: "No pair, K72",
    101925: "No pair, K73",
    101926: "No pair, K74",
    101927: "No pair, K75",
    101928: "No pair, K76",
    101937: "No pair, K82",
    101938: "No pair, K83",
    101939: "No pair, K84",
    101940: "No pair, K85",
    101941: "No pair, K86",
    101942: "No pair, K87",
    101950: "No pair, K92",
    101951: "No pair, K93",
    101952: "No pair, K94",
    101953: "No pair, K95",
    101954: "No pair, K96",
    101955: "No pair, K97",
    101956: "No pair, K98",
    101963: "No pair, KT2",
    101964: "No pair, KT3",
    101965: "No pair, KT4",
    101966: "No pair, KT5",
    101967: "No pair, KT6",
    101968: "No pair, KT7",
    101969: "No pair, KT8",
    101970: "No pair, KT9",
    101976: "No pair, KJ2",
    101977: "No pair, KJ3",
    101978: "No pair, KJ4",
    101979: "No pair, KJ5",
    101980: "No pair, KJ6",
    101981: "No pair, KJ7",
    101982: "No pair, KJ8",
    101983: "No pair, KJ9",
    101984: "No pair, KJT",
    101989: "No pair, KQ2",
    101990: "No pair, KQ3",
    101991: "No pair, KQ4",
    101992: "No pair, KQ5",
    101993: "No pair, KQ6",
    101994: "No pair, KQ7",
    101995: "No pair, KQ8",
    101996: "No pair, KQ9",
    101997: "No pair, KQT",
    102054: "No pair, A42",
    102055: "No pair, A43",
    102067: "No pair, A52",
    102068: "No pair, A53",
    102069: "No pair, A54",
    102080: "No pair, A62",
    102081: "No pair, A63",
    102082: "No pair, A64",
    102083: "No pair, A65",
    102093: "No pair, A72",
    102094: "No pair, A73",
    102095: "No pair, A74",
    102096: "No pair, A75",
    102097: "No pair, A76",
    102106: "No pair, A82",
    102107: "No pair, A83",
    102108: "No pair, A84",
    102109: "No pair, A85",
    102110: "No pair, A86",
    102111: "No pair, A87",
    102119: "No pair, A92",
    102120: "No pair, A93",
    102121: "No pair, A94",
    102122: "No pair, A95",
    102123: "No pair, A96",
    102124: "No pair, A97",
    102125: "No pair, A98",
    102132: "No pair, AT2",
    102133: "No pair, AT3",
    102134: "No pair, AT4",
    102135: "No pair, AT5",
    102136: "No pair, AT6",
    102137: "No pair, AT7",
    102138: "No pair, AT8",
    102139: "No pair, AT9",
    102145: "No pair, AJ2",
    102146: "No pair, AJ3",
    102147: "No pair, AJ4",
    102148: "No pair, AJ5",
    102149: "No pair, AJ6",
    102150: "No pair, AJ7",
    102151: "No pair, AJ8",
    102152: "No pair, AJ9",
    102153: "No pair, AJT",
    102158: "No pair, AQ2",
    102159: "No pair, AQ3",
    102160: "No pair, AQ4",
    102161: "No pair, AQ5",
    102162: "No pair, AQ6",
    102163: "No pair, AQ7",
    102164: "No pair, AQ8",
    102165: "No pair, AQ9",
    102166: "No pair, AQT",
    102167: "No pair, AQJ",
    102171: "No pair, AK2",
    102172: "No pair, AK3",
    102173: "No pair, AK4",
    102174: "No pair, AK5",
    102175: "No pair, AK6",
    102176: "No pair, AK7",
    102177: "No pair, AK8",
    102178: "No pair, AK9",
    102179: "No pair, AKT",
    102180: "No pair, AKJ",
    200001: "Pair of 2s, 3 kicker",
    200002: "Pair of 2s, 4 kicker",
    200003: "Pair of 2s, 5 kicker",
    200004: "Pair of 2s, 6 kicker",
    200005: "Pair of 2s, 7 kicker",
    200006: "Pair of 2s, 8 kicker",
    200007: "Pair of 2s, 9 kicker",
    200008: "Pair of 2s, T kicker",
    200009: "Pair of 2s, J kicker",
    200010: "Pair of 2s, Q kicker",
    200011: "Pair of 2s, K kicker",
    200012: "Pair of 2s, A kicker",
    200182: "Pair of 3s, 2 kicker",
    200184: "Pair of 3s, 4 kicker",
    200185: "Pair of 3s, 5 kicker",
    200186: "Pair of 3s, 6 kicker",
    200187: "Pair of 3s, 7 kicker",
    200188: "Pair of 3s, 8 kicker",
    200189: "Pair of 3s, 9 kicker",
    200190: "Pair of 3s, T kicker",
    200191: "Pair of 3s, J kicker",
    200192: "Pair of 3s, Q kicker",
    200193: "Pair of 3s, K kicker",
    200194: "Pair of 3s, A kicker",
    200364: "Pair of 4s, 2 kicker",
    200365: "Pair of 4s, 3 kicker",
    200367: "Pair of 4s, 5 kicker",
    200368: "Pair of 4s, 6 kicker",
    200369: "Pair of 4s, 7 kicker",
    200370: "Pair of 4s, 8 kicker",
    200371: "Pair of 4s, 9 kicker",
    200372: "Pair of 4s, T kicker",
    200373: "Pair of 4s, J kicker",
    200374: "Pair of 4s, Q kicker",
    200375: "Pair of 4s, K kicker",
    200376: "Pair of 4s, A kicker",
    200546: "Pair of 5s, 2 kicker",
    200547: "Pair of 5s, 3 kicker",
    200548: "Pair of 5s, 4 kicker",
    200550: "Pair of 5s, 6 kicker",
    200551: "Pair of 5s, 7 kicker",
    200552: "Pair of 5s, 8 kicker",
    200553: "Pair of 5s, 9 kicker",
    200554: "Pair of 5s, T kicker",
    200555: "Pair of 5s, J kicker",
    200556: "Pair of 5s, Q kicker",
    200557: "Pair of 5s, K kicker",
    200558: "Pair of 5s, A kicker",
    200728: "Pair of 6s, 2 kicker",
    200729: "Pair of 6s, 3 kicker",
    200730: "Pair of 6s, 4 kicker",
    200731: "Pair of 6s, 5 kicker",
    200733: "Pair of 6s, 7 kicker",
    200734: "Pair of 6s, 8 kicker",
    200735: "Pair of 6s, 9 kicker",
    200736: "Pair of 6s, T kicker",
    200737: "Pair of 6s, J kicker",
    200738: "Pair of 6s, Q kicker",
    200739: "Pair of 6s, K kicker",
    200740: "Pair of 6s, A kicker",
    200910: "Pair of 7s, 2 kicker",
    200911: "Pair of 7s, 3 kicker",
    200912: "Pair of 7s, 4 kicker",
    200913: "Pair of 7s, 5 kicker",
    200914: "Pair of 7s, 6 kicker",
    200916: "Pair of 7s, 8 kicker",
    200917: "Pair of 7s, 9 kicker",
    200918: "Pair of 7s, T kicker",
    200919: "Pair of 7s, J kicker",
    200920: "Pair of 7s, Q kicker",
    200921: "Pair of 7s, K kicker",
    200922: "Pair of 7s, A kicker",
    201092: "Pair of 8s, 2 kicker",
    201093: "Pair of 8s, 3 kicker",
    201094: "Pair of 8s, 4 kicker",
    201095: "Pair of 8s, 5 kicker",
    201096: "Pair of 8s, 6 kicker",
    201097: "Pair of 8s, 7 kicker",
    201099: "Pair of 8s, 9 kicker",
    201100: "Pair of 8s, T kicker",
    201101: "Pair of 8s, J kicker",
    201102: "Pair of 8s, Q kicker",
    201103: "Pair of 8s, K kicker",
    201104: "Pair of 8s, A kicker",
    201274: "Pair of 9s, 2 kicker",
    201275: "Pair of 9s, 3 kicker",
    201276: "Pair of 9s, 4 kicker",
    201277: "Pair of 9s, 5 kicker",
    201278: "Pair of 9s, 6 kicker",
    201279: "Pair of 9s, 7 kicker",
    201280: "Pair of 9s, 8 kicker",
    201282: "Pair of 9s, T kicker",
    201283: "Pair of 9s, J kicker",
    201284: "Pair of 9s, Q kicker",
    201285: "Pair of 9s, K kicker",
    201286: "Pair of 9s, A kicker",
    201456: "Pair of Ts, 2 kicker",
    201457: "Pair of Ts, 3 kicker",
    201458: "Pair of Ts, 4 kicker",
    201459: "Pair of Ts, 5 kicker",
    201460: "Pair of Ts, 6 kicker",
    201461: "Pair of Ts, 7 kicker",
    201462: "Pair of Ts, 8 kicker",
    201463: "Pair of Ts, 9 kicker",
    201465: "Pair of Ts, J kicker",
    201466: "Pair of Ts, Q kicker",
    201467: "Pair of Ts, K kicker",
    201468: "Pair of Ts, A kicker",
    201638: "Pair of Js, 2 kicker",
    201639: "Pair of Js, 3 kicker",
    201640: "Pair of Js, 4 kicker",
    201641: "Pair of Js, 5 kicker",
    201642: "Pair of Js, 6 kicker",
    201643: "Pair of Js, 7 kicker",
    201644: "Pair of Js, 8 kicker",
    201645: "Pair of Js, 9 kicker",
    201646: "Pair of Js, T kicker",
    201648: "Pair of Js, Q kicker",
    201649: "Pair of Js, K kicker",
    201650: "Pair of Js, A kicker",
    201820: "Pair of Qs, 2 kicker",
    201821: "Pair of Qs, 3 kicker",
    201822: "Pair of Qs, 4 kicker",
    201823: "Pair of Qs, 5 kicker",
    201824: "Pair of Qs, 6 kicker",
    201825: "Pair of Qs, 7 kicker",
    201826: "Pair of Qs, 8 kicker",
    201827: "Pair of Qs, 9 kicker",
    201828: "Pair of Qs, T kicker",
    201829: "Pair of Qs, J kicker",
    201831: "Pair of Qs, K kicker",
    201832: "Pair of Qs, A kicker",
    202002: "Pair of Ks, 2 kicker",
    202003: "Pair of Ks, 3 kicker",
    202004: "Pair of Ks, 4 kicker",
    202005: "Pair of Ks, 5 kicker",
    202006: "Pair of Ks, 6 kicker",
    202007: "Pair of Ks, 7 kicker",
    202008: "Pair of Ks, 8 kicker",
    202009: "Pair of Ks, 9 kicker",
    202010: "Pair of Ks, T kicker",
    202011: "Pair of Ks, J kicker",
    202012: "Pair of Ks, Q kicker",
    202014: "Pair of Ks, A kicker",
    202184: "Pair of As, 2 kicker",
    202185: "Pair of As, 3 kicker",
    202186: "Pair of As, 4 kicker",
    202187: "Pair of As, 5 kicker",
    202188: "Pair of As, 6 kicker",
    202189: "Pair of As, 7 kicker",
    202190: "Pair of As, 8 kicker",
    202191: "Pair of As, 9 kicker",
    202192: "Pair of As, T kicker",
    202193: "Pair of As, J kicker",
    202194: "Pair of As, Q kicker",
    202195: "Pair of As, K kicker",
    300520: "Flush, 532",
    300533: "Flush, 542",
    300689: "Flush, 632",
    300702: "Flush, 642",
    300703: "Flush, 643",
    300715: "Flush, 652",
    300716: "Flush, 653",
    300858: "Flush, 732",
    300871: "Flush, 742",
    300872: "Flush, 743",
    300884: "Flush, 752",
    300885: "Flush, 753",
    300886: "Flush, 754",
    300897: "Flush, 762",
    300898: "Flush, 763",
    300899: "Flush, 764",
    301027: "Flush, 832",
    301040: "Flush, 842",
    301041: "Flush, 843",
    301053: "Flush, 852",
    301054: "Flush, 853",
    301055: "Flush, 854",
    301066: "Flush, 862",
    301067: "Flush, 863",
    301068: "Flush, 864",
    301069: "Flush, 865",
    301079: "Flush, 872",
    301080: "Flush, 873",
    301081: "Flush, 874",
    301082: "Flush, 875",
    301196: "Flush, 932",
    301209: "Flush, 942",
    301210: "Flush, 943",
    301222: "Flush, 952",
    301223: "Flush, 953",
    301224: "Flush, 954",
    301235: "Flush, 962",
    301236: "Flush, 963",
    301237: "Flush, 964",
    301238: "Flush, 965",
    301248: "Flush, 972",
    301249: "Flush, 973",
    301250: "Flush, 974",
    301251: "Flush, 975",
    301252: "Flush, 976",
    301261: "Flush, 982",
    301262: "Flush, 983",
    301263: "Flush, 984",
    301264: "Flush, 985",
    301265: "Flush, 986",
    301365: "Flush, T32",
    301378: "Flush, T42",
    301379: "Flush, T43",
    301391: "Flush, T52",
    301392: "Flush, T53",
    301393: "Flush, T54",
    301404: "Flush, T62",
    301405: "Flush, T63",
    301406: "Flush, T64",
    301407: "Flush, T65",
    301417: "Flush, T72",
    301418: "Flush, T73",
    301419: "Flush, T74",
    301420: "Flush, T75",
    301421: "Flush, T76",
    301430: "Flush, T82",
    301431: "Flush, T83",
    301432: "Flush, T84",
    301433: "Flush, T85",
    301434: "Flush, T86",
    301435: "Flush, T87",
    301443: "Flush, T92",
    301444: "Flush, T93",
    301445: "Flush, T94",
    301446: "Flush, T95",
    301447: "Flush, T96",
    301448: "Flush, T97",
    301534: "Flush, J32",
    301547: "Flush, J42",
    301548: "Flush, J43",
    301560: "Flush, J52",
    301561: "Flush, J53",
    301562: "Flush, J54",
    301573: "Flush, J62",
    301574: "Flush, J63",
    301575: "Flush, J64",
    301576: "Flush, J65",
    301586: "Flush, J72",
    301587: "Flush, J73",
    301588: "Flush, J74",
    301589: "Flush, J75",
    301590: "Flush, J76",
    301599: "Flush, J82",
    301600: "Flush, J83",
    301601: "Flush, J84",
    301602: "Flush, J85",
    301603: "Flush, J86",
    301604: "Flush, J87",
    301612: "Flush, J92",
    301613: "Flush, J93",
    301614: "Flush, J94",
    301615: "Flush, J95",
    301616: "Flush, J96",
    301617: "Flush, J97",
    301618: "Flush, J98",
    301625: "Flush, JT2",
    301626: "Flush, JT3",
    301627: "Flush, JT4",
    301628: "Flush, JT5",
    301629: "Flush, JT6",
    301630: "Flush, JT7",
    301631: "Flush, JT8",
    301703: "Flush, Q32",
    301716: "Flush, Q42",
    301717: "Flush, Q43",
    301729: "Flush, Q52",
    301730: "Flush, Q53",
    301731: "Flush, Q54",
    301742: "Flush, Q62",
    301743: "Flush, Q63",
    301744: "Flush, Q64",
    301745: "Flush, Q65",
    301755: "Flush, Q72",
    301756: "Flush, Q73",
    301757: "Flush, Q74",
    301758: "Flush, Q75",
    301759: "Flush, Q76",
    301768: "Flush, Q82",
    301769: "Flush, Q83",
    301770: "Flush, Q84",
    301771: "Flush, Q85",
    301772: "Flush, Q86",
    301773: "Flush, Q87",
    301781: "Flush, Q92",
    301782: "Flush, Q93",
    301783: "Flush, Q94",
    301784: "Flush, Q95",
    301785: "Flush, Q96",
    301786: "Flush, Q97",
    301787: "Flush, Q98",
    301794: "Flush, QT2",
    301795: "Flush, QT3",
    301796: "Flush, QT4",
    301797: "Flush, QT5",
    301798: "Flush, QT6",
    301799: "Flush, QT7",
    301800: "Flush, QT8",
    301801: "Flush, QT9",
    301807: "Flush, QJ2",
    301808: "Flush, QJ3",
    301809: "Flush, QJ4",
    301810: "Flush, QJ5",
    301811: "Flush, QJ6",
    301812: "Flush, QJ7",
    301813: "Flush, QJ8",
    301814: "Flush, QJ9",
    301872: "Flush, K32",
    301885: "Flush, K42",
    301886: "Flush, K43",
    301898: "Flush, K52",
    301899: "Flush, K53",
    301900: "Flush, K54",
    301911: "Flush, K62",
    301912: "Flush, K63",
    301913: "Flush, K64",
    301914: "Flush, K65",
    301924: "Flush, K72",
    301925: "Flush, K73",
    301926: "Flush, K74",
    301927: "Flush, K75",
    301928: "Flush, K76",
    301937: "Flush, K82",
    301938: "Flush, K83",
    301939: "Flush, K84",
    301940: "Flush, K85",
    301941: "Flush, K86",
    301942: "Flush, K87",
    301950: "Flush, K92",
    301951: "Flush, K93",
    301952: "Flush, K94",
    301953: "Flush, K95",
    301954: "Flush, K96",
    301955: "Flush, K97",
    301956: "Flush, K98",
    301963: "Flush, KT2",
    301964: "Flush, KT3",
    301965: "Flush, KT4",
    301966: "Flush, KT5",
    301967: "Flush, KT6",
    301968: "Flush, KT7",
    301969: "Flush, KT8",
    301970: "Flush, KT9",
    301976: "Flush, KJ2",
    301977: "Flush, KJ3",
    301978: "Flush, KJ4",
    301979: "Flush, KJ5",
    301980: "Flush, KJ6",
    301981: "Flush, KJ7",
    301982: "Flush, KJ8",
    301983: "Flush, KJ9",
    301984: "Flush, KJT",
    301989: "Flush, KQ2",
    301990: "Flush, KQ3",
    301991: "Flush, KQ4",
    301992: "Flush, KQ5",
    301993: "Flush, KQ6",
    301994: "Flush, KQ7",
    301995: "Flush, KQ8",
    301996: "Flush, KQ9",
    301997: "Flush, KQT",
    302054: "Flush, A42",
    302055: "Flush, A43",
    302067: "Flush, A52",
    302068: "Flush, A53",
    302069: "Flush, A54",
    302080: "Flush, A62",
    302081: "Flush, A63",
    302082: "Flush, A64",
    302083: "Flush, A65",
    302093: "Flush, A72",
    302094: "Flush, A73",
    302095: "Flush, A74",
    302096: "Flush, A75",
    302097: "Flush, A76",
    302106: "Flush, A82",
    302107: "Flush, A83",
    302108: "Flush, A84",
    302109: "Flush, A85",
    302110: "Flush, A86",
    302111: "Flush, A87",
    302119: "Flush, A92",
    302120: "Flush, A93",
    302121: "Flush, A94",
    302122: "Flush, A95",
    302123: "Flush, A96",
    302124: "Flush, A97",
    302125: "Flush, A98",
    302132: "Flush, AT2",
    302133: "Flush, AT3",
    302134: "Flush, AT4",
    302135: "Flush, AT5",
    302136: "Flush, AT6",
    302137: "Flush, AT7",
    302138: "Flush, AT8",
    302139: "Flush, AT9",
    302145: "Flush, AJ2",
    302146: "Flush, AJ3",
    302147: "Flush, AJ4",
    302148: "Flush, AJ5",
    302149: "Flush, AJ6",
    302150: "Flush, AJ7",
    302151: "Flush, AJ8",
    302152: "Flush, AJ9",
    302153: "Flush, AJT",
    302158: "Flush, AQ2",
    302159: "Flush, AQ3",
    302160: "Flush, AQ4",
    302161: "Flush, AQ5",
    302162: "Flush, AQ6",
    302163: "Flush, AQ7",
    302164: "Flush, AQ8",
    302165: "Flush, AQ9",
    302166: "Flush, AQT",
    302167: "Flush, AQJ",
    302171: "Flush, AK2",
    302172: "Flush, AK3",
    302173: "Flush, AK4",
    302174: "Flush, AK5",
    302175: "Flush, AK6",
    302176: "Flush, AK7",
    302177: "Flush, AK8",
    302178: "Flush, AK9",
    302179: "Flush, AKT",
    302180: "Flush, AKJ",
    400000: "Straight, 32A",
    400351: "Straight, 432",
    400534: "Straight, 543",
    400717: "Straight, 654",
    400900: "Straight, 765",
    401083: "Straight, 876",
    401266: "Straight, 987",
    401449: "Straight, T98",
    401632: "Straight, JT9",
    401815: "Straight, QJT",
    401998: "Straight, KQJ",
    402181: "Straight, AKQ",
    500000: "Trip 2s",
    500183: "Trip 3s",
    500366: "Trip 4s",
    500549: "Trip 5s",
    500732: "Trip 6s",
    500915: "Trip 7s",
    501098: "Trip 8s",
    501281: "Trip 9s",
    501464: "Trip Ts",
    501647: "Trip Js",
    501830: "Trip Qs",
    502013: "Trip Ks",
    502196: "Trip As",
    600000: "Straight flush, 32A",
    600351: "Straight flush, 432",
    600534: "Straight flush, 543",
    600717: "Straight flush, 654",
    600900: "Straight flush, 765",
    601083: "Straight flush, 876",
    601266: "Straight flush, 987",
    601449: "Straight flush, T98",
    601632: "Straight flush, JT9",
    601815: "Straight flush, QJT",
    601998: "Straight flush, KQJ",
    702181: "Mini-Royal"
};
class ThreeCardPokerRank {
}
ThreeCardPokerRank.Incomplete = 0;
ThreeCardPokerRank.NoPair = 1;
ThreeCardPokerRank.OnePair = 2;
ThreeCardPokerRank.Flush = 3;
ThreeCardPokerRank.Straight = 4;
ThreeCardPokerRank.Trips = 5;
ThreeCardPokerRank.StraightFlush = 6;
ThreeCardPokerRank.MiniRoyal = 7;
//# sourceMappingURL=index.js.map