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
            backgroundColor: 0x000000,
            parent: 'game-div',
            scene: [LoaderScene, GameScene]
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
        this.PlayerCommentaryAnchor = new Point(255, 475);
        this.AntePayoffOffset = new Point(-34, -37);
        this.PlayPayoffOffset = new Point(-34, -37);
        this.BonusPayoffOffset = new Point(-34, -37);
        this.BustPayoffOffset = new Point(34, -37);
        this.DealerHandAnchor = new Point(465, 75);
        this.DealerCommentaryAnchor = new Point(490, 172);
        this.BoardAnchor = new Point(465, 220);
        this.TargetFontInstructionSize = 22;
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
        //#endregion
        //#region Test hands
        this._testDealerHand = new Array(0);
        this._testPlayerHand = new Array(0);
        this._testBoard = new Array(0);
    }
    create() {
        // Add the game felt.
        this.add.image(Config.gameOptions.gameWidth / 2, Config.gameOptions.gameHeight / 2, "gameFelt");
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
        graphics.strokeCircle(spotAnchor.x - 28, spotAnchor.y - 26, 40);
        let anteLabel = this.add.text(spotAnchor.x - 68, spotAnchor.y + 19, "ANTE");
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
        spotAnchor = new Point(492, 611);
        graphics.strokeCircle(spotAnchor.x - 28, spotAnchor.y - 26, 40);
        let playLabel = this.add.text(spotAnchor.x - 68, spotAnchor.y + 19, "PLAY");
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
        spotAnchor = new Point(590, 611);
        graphics.strokeCircle(spotAnchor.x - 28, spotAnchor.y - 26, 40);
        let bustLabel = this.add.text(spotAnchor.x - 68, spotAnchor.y + 19, "BUST");
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
        //#region Bonus spot
        spotAnchor = new Point(540, 389);
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
                this.doAnimation();
                break;
            }
            case Steps.ResolveBonus: {
                let payout = -1;
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
                    payout = 50;
                }
                else if (playerRank == ThreeCardPokerRank.StraightFlush) {
                    payout = 10;
                }
                else if (playerRank == ThreeCardPokerRank.Trips) {
                    payout = 10;
                }
                else if (playerRank == ThreeCardPokerRank.Straight) {
                    payout = 2;
                }
                else if (playerRank == ThreeCardPokerRank.NoPair) {
                    if (highCardRank <= 5) {
                        payout = 10;
                    }
                    else if (highCardRank <= 9) {
                        payout = 2;
                    }
                }
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
                if (this._antePayout != 0) {
                    this.resolvePayout(this._anteSpot, this._antePayout, true, true);
                }
                else {
                    this.doAnimation();
                }
                break;
            }
            case Steps.ResolvePlayWager: {
                if (this._playPayout != 0) {
                    this.resolvePayout(this._playSpot, this._playPayout, true, true);
                }
                else {
                    this.doAnimation();
                }
                break;
            }
            case Steps.ResolveBustWager: {
                if (this._bustPayout != 0) {
                    this.resolvePayout(this._bustSpot, this._bustPayout, true, true);
                }
                else {
                    this.doAnimation();
                }
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
    calculateTotal(holeCards) {
        let peakHand = -1;
        let cards = [
            holeCards[0].CardNumber,
            holeCards[1].CardNumber,
            this._boardHand[0].CardNumber,
            this._boardHand[1].CardNumber,
        ];
        peakHand = Math.max(peakHand, ThreeCardEvaluator.cardVectorToHandNumber([cards[0], cards[1], cards[2]], false, true));
        peakHand = Math.max(peakHand, ThreeCardEvaluator.cardVectorToHandNumber([cards[0], cards[1], cards[3]], false, true));
        peakHand = Math.max(peakHand, ThreeCardEvaluator.cardVectorToHandNumber([cards[0], cards[2], cards[3]], false, true));
        peakHand = Math.max(peakHand, ThreeCardEvaluator.cardVectorToHandNumber([cards[1], cards[2], cards[3]], false, true));
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
    playClick() {
        this.sound.play("chipClick");
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
                for (let thisButton of this._mainPanel)
                    thisButton.visible = true;
                break;
            }
            case GameState.GameOver: {
                for (let thisButton of this._newRebetButtonPanel)
                    thisButton.visible = true;
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
            this.playClick();
            targetSpot.Amount = newValue;
        }
    }
    beginDeal() {
        this.playClick();
        this.CurrentState = GameState.StartDeal;
    }
    clearBettingSpots() {
        for (let spot of this._bettingSpots) {
            spot.Amount = 0;
        }
        this.playClick();
    }
    newBets() {
        this.playClick();
        this.CurrentState = GameState.Predeal;
    }
    rebetBets() {
        this.playClick();
        this.predealInitialization();
        for (let index = 0; index < this._bettingSpots.length; index += 1) {
            this._bettingSpots[index].Amount = this._lastWagerAmounts[index];
        }
        this.CurrentState = GameState.StartDeal;
    }
    selectChip(target) {
        this.playClick();
        this.selectCursorValue(target.Value);
    }
    makePlayWager() {
        this.playClick();
        for (let button of this._mainPanel)
            button.visible = false;
        this._playSpot.Amount = this._anteSpot.Amount;
        this._stepList.push(Steps.FlipBoardHand);
        if (this._bonusSpot.Amount > 0) {
            this._stepList.push(Steps.ResolveBonus);
        }
        this._stepList.push(Steps.FlipDealerHand);
        this._stepList.push(Steps.CalculateGamePayouts);
        this._stepList.push(Steps.ResolveAnteWager);
        this._stepList.push(Steps.ResolvePlayWager);
        this._stepList.push(Steps.ChangeStateGameOver);
        this.doAnimation();
    }
    makeBustWager() {
        this.playClick();
        for (let button of this._mainPanel)
            button.visible = false;
        this._bustSpot.Amount = this._anteSpot.Amount;
        this._antePayout = -1;
        this._stepList.push(Steps.CalculateGamePayouts);
        this._stepList.push(Steps.ResolveAnteWager);
        this._stepList.push(Steps.FlipBoardHand);
        if (this._bonusSpot.Amount > 0) {
            this._stepList.push(Steps.ResolveBonus);
        }
        this._stepList.push(Steps.ResolveBustWager);
        this._stepList.push(Steps.ChangeStateGameOver);
        this.doAnimation();
    }
    foldHand() {
        this.playClick();
        for (let button of this._mainPanel)
            button.visible = false;
        this._stepList.push(Steps.FoldHand);
        if (this._bonusSpot.Amount > 0) {
            this._stepList.push(Steps.FlipBoardHand);
            this._stepList.push(Steps.ResolveBonus);
        }
        this._stepList.push(Steps.ChangeStateGameOver);
        this.doAnimation();
    }
    hintPlease() { }
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
class LoaderScene extends Phaser.Scene {
    constructor() {
        super("LoaderScene");
    }
    preload() {
        //#region Load sounds
        this.load.audio("chipClick", [
            "./assets/sounds/ChipClick.mp3",
            "./assets/sounds.ChipClick.ogg"
        ]);
        //#endregion
        //#region Load graphics
        this.load.image("gameFelt", "assets/images/Blank Game Felt.png");
        this.load.image("blueText", "assets/images/Blue Text 130x50.png");
        this.load.image("grayTextSmall", "assets/images/Gray Text 345x50.png");
        this.load.image("grayTextLarge", "assets/images/Gray Text 430x50.png");
        this.load.image("dropPixel", "assets/images/Drop Shape Pixel.jpg");
        this.load.image("playerSpot", "assets/images/2nd Chance Spot.png");
        this.load.image("banner", "assets/images/2nd Chance Banner.png");
        this.load.image("logo", "assets/images/2nd Chance Logo.png");
        this.load.image("dealerBar", "assets/images/2nd Chance Dealer Bar.png");
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
Steps.AnnotateDealer = "Annotate dealer";
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
class StringTable {
}
StringTable.PredealInstructions = "Click on chip to select denomination, click on ANTE and/or BONUS betting spots to add chips, click DEAL to begin.";
StringTable.GameOver = "Game over.  Click 'REBET' to play again with same wagers, or click 'NEW' to set new wagers.";
StringTable.Insurance = "Would you like insurance? (YES / NO)";
StringTable.DoubleBack = "Would you like to make a Second Chance Wager? (YES / NO)";
class ThreeCardEvaluator {
    static cardVectorToHandNumber(cardVector, isJokerFullyWild, isWheelSecondBest = false) {
        let output = -1;
        let cards = new Array(...cardVector);
        let ranks = [0, 0, 0];
        let suits = [0, 0, 0];
        let miniRoyalVector = [40, 44, 48];
        cards.sort((a, b) => a - b);
        // First, we need to check for jokers
        if (cards[0] >= 52) {
            // Three jokers
            return this.cardVectorToHandNumber(miniRoyalVector, false, isWheelSecondBest);
        }
        else if (cards[1] >= 52) {
            // Two jokers
            if (cards[0] >= 40) {
                return this.cardVectorToHandNumber(miniRoyalVector, false, isWheelSecondBest);
            }
            else {
                let straightFlushVector = [cards[0], cards[0] + 4, cards[0] + 8];
                return this.cardVectorToHandNumber(straightFlushVector, false, isWheelSecondBest);
            }
        }
        else if (cards[2] >= 52) {
            // One joker
            let bestHand = -1;
            for (let replacement = 0; replacement < 52; replacement += 1) {
                let testHand = [cards[0], cards[1], replacement];
                let candidate = this.cardVectorToHandNumber(testHand, isJokerFullyWild, isWheelSecondBest);
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
                if (isWheelSecondBest) {
                    if (isStraight) {
                        var isBroadway = ((ranks[0] == 10) && (ranks[1] == 11) && (ranks[2] == 12));
                        if (isBroadway) {
                            output += this.tiebreakByCardRanks(ranks[2], ranks[1], ranks[0]);
                        }
                        else if (isWheel) {
                            output += this.tiebreakByCardRanks(11, 10, 9);
                        }
                        else if (ranks[0] == 0) {
                            // lowest card is a 2, that must mean a 4-3-2 straight, the new "wheel" -- as you know, normally bottom straight has zero tiebreaker
                            // NOP
                        }
                        else {
                            output += this.tiebreakByCardRanks(ranks[2] - 1, ranks[1] - 1, ranks[0] - 1);
                        }
                    }
                    else {
                        output += this.tiebreakByCardRanks(ranks[2], ranks[1], ranks[0]);
                    }
                }
                else {
                    if (!isWheel) {
                        // A wheel will have lowest tiebreaker, not adding anything.
                        output += this.tiebreakByCardRanks(ranks[2], ranks[1], ranks[0]);
                    }
                }
            }
        }
        return output;
    }
    static tiebreakByCardRanks(highRank, middleRank, lowRank) {
        return highRank * 169 + middleRank * 13 + lowRank;
    }
}
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