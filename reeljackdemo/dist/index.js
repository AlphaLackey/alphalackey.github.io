"use strict";
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
    layoutHelpFormat: {
        fontFamily: "Arial",
        fontSize: "24px",
        fontColor: "#FFFFFF",
        align: "center"
    },
    commentaryFormat: {
        fontFamily: "Arial",
        fontSize: "20px",
        fontColor: "#FFFFFF",
        fontStyle: "bold",
        align: "center"
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
        this.TargetFontInstructionSize = 22;
        this.InsuranceLocation = new Point(880, 100);
        this.InsurancePayoffOffset = new Point(-34, -37);
        this.DealerHandAnchor = new Point(950, 240);
        this.PlayerHandAnchors = [
            new Point(280, 75),
            new Point(280, 205),
            new Point(280, 335),
            new Point(280, 465),
            new Point(280, 595),
        ];
        this.PlayerHandOffsets = [
            new Point(34, -37),
            new Point(34, -37),
            new Point(34, -37),
            new Point(34, -37),
            new Point(34, -37),
        ];
        this.PlayerSpotLocations = [
            new Point(200, 100),
            new Point(200, 230),
            new Point(200, 360),
            new Point(200, 490),
            new Point(200, 620),
        ];
        this.TwentyOneMultipliers = [
            1,
            1,
            2,
            3,
            5,
            10
        ];
        //#endregion
        //#region Betting spots
        this._playerBettingSpots = new Array(0);
        this._lastWagerAmounts = new Array(0);
        //#endregion
        //#region Hand information
        this._playerAnchors = new Array(5);
        this._playerHands = new Array(5);
        this._playerTotals = new Array(5);
        this._dealerAnchor = new Point();
        this._dealerHand = new Array(0);
        this._dealerTotal = 0;
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
        //#endregion
        //#region Test hands
        this._testDealerHand = new Array(0);
        this._testPlayerHand = new Array(0);
    }
    create() {
        // If desired, initialize test hands by uncommenting.
        this._testDealerHand = General.cardStringToVector("AC TS");
        // this._testPlayerHand = General.cardStringToVector("AC 2D 2H 2S KC KD 2H 2S 2C 2D 2H 2S 2C 2D 2H 2S 2C 2D 2H 2S");
        // Add the game felt.
        this._gameFelt = this.add.image(Config.gameOptions.gameWidth / 2, Config.gameOptions.gameHeight / 2, "gameFelt");
        // Turn on listening to input events
        this.input.on('gameobjectup', function (_, gameObject) {
            gameObject.emit('clicked', gameObject);
        }, this);
        // Creates the shoe object
        let cardRanks = new Array(52);
        for (let rank = 0; rank < 52; rank += 1)
            cardRanks[rank] = 1;
        this._shoe = new QuantumShoe(cardRanks, 8);
        //#region Bumper panel graphics
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
        for (let index = 0; index < 5; index += 1) {
            this._playerHands[index] = new Array(0);
            this._playerAnchors[index] = new Point();
        }
        //#region Button panels
        //#region Clear | Deal panel
        this._clearButton = new Button({
            scene: this,
            style: AssetNames.BlueSmall,
            caption: "CLEAR",
            clickEvent: Emissions.ClearBettingSpots,
            x: 952,
            y: 620,
            visible: false
        });
        this.add.existing(this._clearButton);
        Config.emitter.on(Emissions.ClearBettingSpots, this.clearBettingSpots, this);
        this._dealButton = new Button({
            scene: this,
            style: AssetNames.BlueSmall,
            caption: "DEAL",
            clickEvent: Emissions.BeginDeal,
            x: 952,
            y: 665,
            visible: false
        });
        this.add.existing(this._dealButton);
        Config.emitter.on(Emissions.BeginDeal, this.beginDeal, this);
        this._clearDealPanel = [this._clearButton, this._dealButton];
        //#endregion
        //#region New | Rebet panel
        this._newButton = new Button({
            scene: this,
            style: AssetNames.BlueSmall,
            caption: "NEW",
            clickEvent: Emissions.NewGame,
            x: 952,
            y: 620,
            visible: false
        });
        this.add.existing(this._newButton);
        Config.emitter.on(Emissions.NewGame, this.newBets, this);
        this._rebetButton = new Button({
            scene: this,
            style: AssetNames.GreenSmall,
            caption: "REBET",
            clickEvent: Emissions.RebetBets,
            x: 952,
            y: 665,
            visible: false
        });
        this.add.existing(this._rebetButton);
        Config.emitter.on(Emissions.RebetBets, this.rebetBets, this);
        this._newRebetButtonPanel = [this._newButton, this._rebetButton];
        //#endregion
        //#region Yes | No panel
        this._yesButton = new Button({
            scene: this,
            style: AssetNames.GreenSmall,
            caption: "YES",
            clickEvent: Emissions.Yes,
            x: 952,
            y: 620,
            visible: false
        });
        this.add.existing(this._yesButton);
        Config.emitter.on(Emissions.Yes, this.clickYes, this);
        this._noButton = new Button({
            scene: this,
            style: AssetNames.RedSmall,
            caption: "NO",
            clickEvent: Emissions.No,
            x: 952,
            y: 665,
            visible: false
        });
        this.add.existing(this._noButton);
        Config.emitter.on(Emissions.No, this.clickNo, this);
        this._yesNoPanel = [this._yesButton, this._noButton];
        //#endregion
        //#region Main panel
        this._doubleButton = new Button({
            scene: this,
            style: AssetNames.GreenSmall,
            caption: "DOUBLE",
            clickEvent: Emissions.Double,
            x: 952,
            y: 575,
            visible: false
        });
        this.add.existing(this._doubleButton);
        Config.emitter.on(Emissions.Double, this.doubleDown, this);
        this._hitButton = new Button({
            scene: this,
            style: AssetNames.GreenSmall,
            caption: "HIT",
            clickEvent: Emissions.Hit,
            x: 952,
            y: 620,
            visible: false
        });
        this.add.existing(this._hitButton);
        Config.emitter.on(Emissions.Hit, this.hitOnHand, this);
        this._standButton = new Button({
            scene: this,
            style: AssetNames.GreenSmall,
            caption: "STAND",
            clickEvent: Emissions.Stand,
            x: 952,
            y: 665,
            visible: false
        });
        this.add.existing(this._standButton);
        Config.emitter.on(Emissions.Stand, this.standOnHand, this);
        this._mainPanel = [
            this._doubleButton,
            this._hitButton,
            this._standButton
        ];
        //#endregion
        //#region Insurance spot
        this._insuranceBettingSpot = new BettingSpot({
            scene: this,
            x: this.InsuranceLocation.x,
            y: this.InsuranceLocation.y,
            isOptional: true,
            isPlayerSpot: false,
            isLocked: true,
            minimumBet: 2.50,
            maximumBet: 50,
            payoffOffset: this.InsurancePayoffOffset
        });
        this.add.existing(this._insuranceBettingSpot);
        //#endregion
        //#region Player spots
        for (let index = 0; index < 5; index += 1) {
            let newSpot = new BettingSpot({
                scene: this,
                x: this.PlayerSpotLocations[index].x,
                y: this.PlayerSpotLocations[index].y,
                isOptional: false,
                isPlayerSpot: true,
                isLocked: false,
                minimumBet: 1,
                maximumBet: 100,
                payoffOffset: this.PlayerHandOffsets[index],
                amount: 0
            });
            this._playerBettingSpots[index] = newSpot;
            this._playerBettingSpots[index].HitZone.on("clicked", this.addSelectedValue, this);
            this.add.existing(this._playerBettingSpots[index]);
            let spotAnchor = new Point(this.PlayerSpotLocations[index].x, this.PlayerSpotLocations[index].y);
            graphics.strokeCircle(spotAnchor.x - 28, spotAnchor.y - 26, 40);
        }
        ;
        this._bettingSpots = [
            this._playerBettingSpots[0],
            this._playerBettingSpots[1],
            this._playerBettingSpots[2],
            this._playerBettingSpots[3],
            this._playerBettingSpots[4],
            this._insuranceBettingSpot
        ];
        this._lastWagerAmounts.length = this._bettingSpots.length;
        //#endregion
        this.Score = 10000;
        this.CurrentState = GameState.Predeal;
        //#endregion
    }
    //#region Animation methods
    addCommentaryField(xLoc, yLoc, fieldText) {
        let newCommentary = this.add.text(xLoc, yLoc, fieldText, Config.gameOptions.commentaryFormat);
        this._commentaryList.push(newCommentary);
    }
    cardToDealer() {
        let nextCardNumber;
        if (this._dealerHand.length >= this._testDealerHand.length) {
            nextCardNumber = this._shoe.drawCard();
        }
        else {
            nextCardNumber = this._testDealerHand[this._dealerHand.length];
        }
        let nextCard = new PlayingCard({
            scene: this,
            x: 0,
            y: 0,
            cardNumber: nextCardNumber,
            isFaceUp: this._dealerHand.length > 0
        });
        nextCard.setOrigin(0.5, 0.5);
        this.add.existing(nextCard);
        this._dealerHand.push(nextCard);
        this._dealerTotal = Blackjack.addCardNumberToHandValue(nextCard.CardNumber, this._dealerTotal);
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
    cardsToPlayer(isSideways = false) {
        for (let row = 0; row < 5; row += 1) {
            if (this._playerTotals[row] < 17 && this._playerTotals[row] > -19) {
                let totalHandLength = 0;
                for (let x = 0; x < 5; x += 1) {
                    totalHandLength += this._playerHands[x].length;
                }
                let nextCardNumber;
                if (totalHandLength >= this._testPlayerHand.length) {
                    nextCardNumber = this._shoe.drawCard();
                }
                else {
                    nextCardNumber = this._testPlayerHand[totalHandLength];
                }
                let nextCard = new PlayingCard({
                    scene: this,
                    x: 0,
                    y: 0,
                    cardNumber: nextCardNumber,
                    isFaceUp: true
                });
                nextCard.setOrigin(0.5, 0.5);
                this.add.existing(nextCard);
                this._playerHands[row].push(nextCard);
                this._playerTotals[row] = Blackjack.addCardNumberToHandValue(nextCard.CardNumber, this._playerTotals[row]);
                if (this._playerTotals[row] >= 17 || this._playerTotals[row] <= -19 || this._playerHands[row].length == 5) {
                    let outcome = "";
                    if (this._playerTotals[row] > 21) {
                        outcome = "BUST\n" + this._playerTotals[row].toString();
                    }
                    else if (this._playerHands[row].length == 2 && Math.abs(this._playerTotals[row]) == 21) {
                        outcome = "BJ\n21";
                    }
                    else if (this._playerHands[row].length == 5 && Math.abs(this._playerTotals[row]) != 21) {
                        outcome = "5 CARD\nCHARLIE";
                    }
                    else if (this._playerTotals[row] >= 17) {
                        outcome = "HARD\n" + this._playerTotals[row].toString();
                    }
                    else {
                        outcome = "SOFT\n" + Math.abs(this._playerTotals[row]).toString();
                    }
                    this.addCommentaryField(this.PlayerSpotLocations[row].x - 165, this.PlayerSpotLocations[row].y - 50, outcome);
                }
                this.tweens.add({
                    targets: nextCard,
                    duration: 400,
                    x: this._playerAnchors[row].x + (isSideways ? 20 : 0),
                    y: this._playerAnchors[row].y,
                    ease: Phaser.Math.Easing.Expo.Out,
                    onComplete: row == 4 ? this.doAnimation : null,
                    rotation: isSideways ? 1.5708 : 0,
                    onCompleteScope: this
                });
                this.updateLocation(this._playerAnchors[row], true);
            }
            else if (row == 4) {
                this.doAnimation();
            }
        }
    }
    flipHoleCard() {
        let tweenDurations = [200, 200, 200];
        let tweenDelays = [0, 200, 400];
        this.add.tween({
            targets: this._dealerHand[0],
            delay: tweenDelays[0],
            duration: tweenDurations[0],
            y: "-=120",
        });
        this.add.tween({
            targets: this._dealerHand[0],
            delay: tweenDelays[1],
            duration: tweenDurations[1],
            scaleX: 0,
            scaleY: 1.2,
            onComplete: () => {
                this._dealerHand[0].IsFaceUp = true;
            }
        });
        this.add.tween({
            targets: this._dealerHand[0],
            delay: tweenDelays[2],
            duration: tweenDurations[2],
            scaleX: 1.0,
            scaleY: 1.0,
            onComplete: this.doAnimation,
            onCompleteScope: this
        });
    }
    checkAndFlipHoleCard() {
        let tweenDurations = [300, 300, 200];
        let tweenDelays = [0, 700, 1000];
        this.add.tween({
            targets: this._dealerHand[0],
            delay: tweenDelays[0],
            duration: tweenDurations[0],
            y: "-=120",
        });
        this.add.tween({
            targets: this._dealerHand[0],
            delay: tweenDelays[1],
            duration: tweenDurations[1],
            scaleX: 0,
            scaleY: 1.2,
            onComplete: () => {
                this._dealerHand[0].IsFaceUp = true;
            }
        });
        this.add.tween({
            targets: this._dealerHand[0],
            delay: tweenDelays[2],
            duration: tweenDurations[2],
            scaleX: 1.0,
            scaleY: 1.0,
            onComplete: this.doAnimation,
            onCompleteScope: this
        });
    }
    checkAndReturnHoleCard() {
        let tweenDurations = [300, 300];
        let tweenDelays = [0, 700];
        this.add.tween({
            targets: this._dealerHand[0],
            delay: tweenDelays[0],
            duration: tweenDurations[0],
            y: "-=120",
        });
        this.add.tween({
            targets: this._dealerHand[0],
            delay: tweenDelays[1],
            duration: tweenDurations[1],
            y: "+=120",
            onComplete: this.doAnimation,
            onCompleteScope: this
        });
    }
    doAnimation() {
        let thisAction = this._stepList.shift();
        switch (thisAction) {
            case Steps.FlipHoleCard: {
                this.flipHoleCard();
                break;
            }
            case Steps.PlayDealerHand: {
                if (this._dealerTotal < 17 && this._dealerTotal >= -17) {
                    this._stepList.push(Steps.CardToDealer);
                    this._stepList.push(Steps.PlayDealerHand);
                }
                else {
                    this._stepList.push(Steps.ResolvePlayerHands);
                    this._stepList.push(Steps.ChangeStateGameOver);
                }
                this.doAnimation();
                break;
            }
            case Steps.DoublePlayerHands: {
                this.cardsToPlayer(true);
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
            case Steps.ResolvePlayerHands: {
                let dealerScore = Math.abs(this._dealerTotal);
                let dealerNatural = (dealerScore == 21 && this._dealerHand.length == 2);
                let playerTwentyOneCount = 0;
                for (let row = 0; row < 5; row += 1) {
                    let playerScore = Math.abs(this._playerTotals[row]);
                    if (playerScore == 21)
                        playerTwentyOneCount += 1;
                }
                for (let row = 0; row < 5; row += 1) {
                    let playerScore = Math.abs(this._playerTotals[row]);
                    let playerTwentyOne = playerScore == 21;
                    let playerNatural = (playerTwentyOne && this._playerHands[row].length == 2);
                    let fiveCardCharlie = (playerScore < 21 && this._playerHands[row].length == 5);
                    let payMultiple = 0;
                    if (playerScore > 21) {
                        payMultiple = -1;
                    }
                    else if (dealerNatural && !playerNatural) {
                        payMultiple = -1;
                    }
                    else if (playerNatural && !dealerNatural) {
                        payMultiple = 1;
                    }
                    else if (playerNatural && dealerNatural) {
                        payMultiple = 0;
                    }
                    else if (dealerScore > 21) {
                        payMultiple = 1;
                    }
                    else if (fiveCardCharlie) {
                        payMultiple = 1;
                    }
                    else if (playerScore > dealerScore) {
                        payMultiple = 1;
                    }
                    else if (dealerScore > playerScore) {
                        payMultiple = -1;
                    }
                    else {
                        payMultiple = 0;
                    }
                    if (payMultiple == 1) {
                        payMultiple *= this.TwentyOneMultipliers[playerTwentyOneCount];
                    }
                    this.resolvePayout(this._playerBettingSpots[row], payMultiple, true, row == 4);
                }
                break;
            }
            case Steps.AnnotateDealer: {
                let dealerScore = Math.abs(this._dealerTotal);
                let dealerScoreString = "";
                if (this._dealerTotal == -21 && this._dealerHand.length == 2) {
                    dealerScoreString = "BJ 21";
                    this.addCommentaryField(925, 20, dealerScoreString);
                }
                else {
                    dealerScoreString = dealerScore.toString();
                    this.addCommentaryField(930, 20, dealerScoreString);
                }
                this.doAnimation();
                break;
            }
            case Steps.ResolveInsurance: {
                if (this._insuranceBettingSpot.Amount > 0) {
                    let insurancePayout = (this._dealerTotal == -21 ? 2 : -1);
                    this.resolvePayout(this._insuranceBettingSpot, insurancePayout, true);
                }
                else {
                    this.doAnimation();
                }
                break;
            }
            case Steps.CheckHoleCard: {
                let upcardRank = Math.floor(this._dealerHand[1].CardNumber / 4);
                if (this._dealerTotal == -21) {
                    this.checkAndFlipHoleCard();
                }
                else if (upcardRank >= 8) {
                    this.checkAndReturnHoleCard();
                }
                else {
                    this.doAnimation();
                }
                break;
            }
            case Steps.ChangeStateInsuranceInput: {
                this.CurrentState = GameState.InsuranceInput;
                break;
            }
            case Steps.CheckForInsurance: {
                let upcardRank = Math.floor(this._dealerHand[1].CardNumber / 4);
                if (upcardRank == 12) {
                    this._stepList.push(Steps.ChangeStateInsuranceInput);
                }
                else if (this._dealerTotal == -21) {
                    this._stepList.push(Steps.CheckHoleCard);
                    this._stepList.push(Steps.ResolvePlayerHands);
                    this._stepList.push(Steps.ChangeStateGameOver);
                }
                else {
                    this._stepList.push(Steps.CheckHoleCard);
                    this._stepList.push(Steps.ChangeStateMainInput);
                }
                this.doAnimation();
                break;
            }
            case Steps.CardToPlayer: {
                this.cardsToPlayer(false);
                break;
            }
            case Steps.CardToDealer: {
                this.cardToDealer();
                break;
            }
            default: {
                console.debug("STEP NOT RESOLVED: ", thisAction);
                this._stepList = [];
            }
        }
    }
    playClick() {
        this.sound.play("chipClick");
    }
    resolveDealerNatural() {
        this.Instructions = "";
        for (let thisButton of this._yesNoPanel)
            thisButton.visible = false;
        let dealerNatural = (this._dealerTotal == -21);
        if (dealerNatural) {
            this._stepList.push(Steps.CheckHoleCard);
            this._stepList.push(Steps.ResolveInsurance);
            this._stepList.push(Steps.AnnotateDealer);
            this._stepList.push(Steps.ResolvePlayerHands);
            this._stepList.push(Steps.ChangeStateGameOver);
            this.doAnimation();
        }
        else {
            this._stepList.push(Steps.CheckHoleCard);
            this._stepList.push(Steps.ResolveInsurance);
            this._stepList.push(Steps.ChangeStateMainInput);
            this.doAnimation();
        }
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
                    duration: 300,
                    x: 0,
                    y: 0,
                    alpha: 0,
                    onComplete: (continueAnimation ? this.doAnimation : null),
                    onCompleteScope: this
                });
            }
            else {
                let winningPayoutSpot = new BettingSpot({
                    scene: this,
                    amount: wager.Amount * multiple,
                    x: 0,
                    y: 0,
                    isLocked: true
                });
                this._payoutList.push(winningPayoutSpot);
                this.Score += (wager.Amount * multiple);
                this.add.existing(winningPayoutSpot);
                if (elevateOldBet)
                    this.children.bringToTop(wager);
                this.tweens.add({
                    targets: winningPayoutSpot,
                    duration: 300,
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
                // Disable wager buttons
                for (let thisButton of this._chipButtons)
                    thisButton.disableInteractive();
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
                this._stepList.push(Steps.CardToDealer);
                this._stepList.push(Steps.CardToPlayer);
                this._stepList.push(Steps.CardToDealer);
                this._stepList.push(Steps.CheckForInsurance);
                // and now, if you please, we'll proceed
                this.doAnimation();
                break;
            }
            case GameState.InsuranceInput: {
                for (let thisButton of this._yesNoPanel)
                    thisButton.visible = true;
                this.Instructions = StringTable.Insurance;
                break;
            }
            case GameState.MainInput: {
                // First, see if all hands are done
                let doneYet = true;
                for (let row = 0; row < 5; row += 1) {
                    if (this._playerHands[row].length < 5 && this._playerTotals[row] < 17 && this._playerTotals[row] > -19) {
                        doneYet = false;
                    }
                }
                if (doneYet) {
                    this._stepList.push(Steps.FlipHoleCard);
                    this._stepList.push(Steps.PlayDealerHand);
                    this.doAnimation();
                }
                else {
                    for (let thisButton of this._mainPanel)
                        thisButton.visible = true;
                    if (this._playerHands[0].length == 2) {
                        this._doubleButton.unlock();
                    }
                    else {
                        this._doubleButton.lock();
                    }
                    this.Instructions = StringTable.Instructions;
                }
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
            for (let index = 0; index < 5; index += 1) {
                this._playerBettingSpots[index].Amount = newValue;
            }
            // targetSpot.Amount = newValue;
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
    clickNo() {
        this.playClick();
        if (this._currentState == GameState.InsuranceInput) {
            this.resolveDealerNatural();
        }
        else {
            console.debug("Current state " + this._currentState + " not resolved in clickNo();");
        }
    }
    clickYes() {
        this.playClick();
        if (this._currentState == GameState.InsuranceInput) {
            // Five equal spots, each with 0.5 units = 2.5 units.
            this._insuranceBettingSpot.Amount = this._playerBettingSpots[0].Amount * 2.5;
            this.resolveDealerNatural();
        }
        else {
            console.debug("Current state " + this._currentState + " not resolved in clickYes();");
        }
    }
    doubleDown() {
        this.playClick();
        for (let thisButton of this._mainPanel)
            thisButton.visible = false;
        this.Instructions = "";
        for (let row = 0; row < 5; row += 1) {
            // For now, double every bet; this may change someday to only doubling non-locked bets
            let thisSpot = this._playerBettingSpots[row];
            thisSpot.Amount *= 2.0;
        }
        this._stepList.push(Steps.DoublePlayerHands);
        this._stepList.push(Steps.FlipHoleCard);
        this._stepList.push(Steps.PlayDealerHand);
        this.doAnimation();
    }
    hitOnHand() {
        this.playClick();
        for (let thisButton of this._mainPanel)
            thisButton.visible = false;
        this.Instructions = "";
        this._stepList.push(Steps.CardToPlayer);
        this._stepList.push(Steps.ChangeStateMainInput);
        this.doAnimation();
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
    standOnHand() {
        this.playClick();
        for (let thisButton of this._mainPanel)
            thisButton.visible = false;
        this.Instructions = "";
        this._stepList.push(Steps.FlipHoleCard);
        this._stepList.push(Steps.PlayDealerHand);
        this.doAnimation();
    }
    //#endregion
    //#region Logic methods
    clearGameObjectArray(target) {
        for (let index = 0; index < target.length; index += 1) {
            target[index].destroy();
        }
        target.length = 0;
    }
    predealInitialization() {
        this._shoe.shuffle();
        for (let index = 0; index < 5; index += 1) {
            this._playerTotals[index] = 0;
            this._playerAnchors[index].x = this.PlayerHandAnchors[index].x;
            this._playerAnchors[index].y = this.PlayerHandAnchors[index].y;
            this.clearGameObjectArray(this._playerHands[index]);
            this._playerHands[index].length = 0;
        }
        // Clear dealer hand
        this._dealerTotal = 0;
        this._dealerAnchor.x = this.DealerHandAnchor.x;
        this._dealerAnchor.y = this.DealerHandAnchor.y;
        this.clearGameObjectArray(this._dealerHand);
        this._dealerHand.length = 0;
        this.clearGameObjectArray(this._payoutList);
        this.clearGameObjectArray(this._commentaryList);
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
        // Enable wager buttons
        for (let thisButton of this._chipButtons)
            thisButton.setInteractive();
    }
    updateLocation(location, isPlayer, isBackwards = false) {
        if (isPlayer) {
            location.x += (90 * (isBackwards ? -1 : 1));
        }
        else {
            // Is for dealer
            location.y += (30 * (isBackwards ? -1 : 1));
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
class Blackjack {
    static addCardNumberToHandValue(cardNumber, handValue) {
        let cardRank = Math.floor(cardNumber / 4);
        return this.addCardRankToHandValue(cardRank, handValue, false);
    }
    static addCardRankToHandValue(cardRank, handValue, usingBlackjackRanks = false) {
        let blackjackValue = 0;
        if (usingBlackjackRanks) {
            switch (cardRank) {
                case 0:
                    blackjackValue = 10;
                    break;
                default:
                    blackjackValue = cardRank;
                    break;
            }
        }
        else {
            switch (cardRank) {
                case 12:
                    blackjackValue = 1;
                    break;
                case 8:
                case 9:
                case 10:
                case 11:
                    blackjackValue = 10;
                    break;
                default:
                    blackjackValue = cardRank + 2;
                    break;
            }
        }
        return this.addBlackjackValueToHandValue(blackjackValue, handValue);
    }
    static addBlackjackValueToHandValue(blackjackValue, handValue) {
        let output = handValue;
        if (blackjackValue == 1) { // separate case for adding an ace.
            if (output < 0) { // soft hands require specific cases.
                output -= 1; // soft hand + ace = still soft hand, one higher -- WATCH THE SIGNS
            }
            else {
                output = -1 * (output + 11); // mollify a hard hand.
            }
        }
        else {
            if (output < 0) { // soft hands require specific cases
                output -= blackjackValue;
            }
            else {
                output += blackjackValue;
            }
        }
        if (output < -21) { // soft hand with a 'busting total' becomes a 10-point less hard hand.
            output = Math.abs(output + 10); // remember to WATCH THE SIGNS.
        }
        return output;
    }
    static cardNumberToBlackjackRank(cardNumber) {
        let cardRank = Math.floor(cardNumber / 4);
        let blackjackRank;
        switch (cardRank) {
            case 12:
                blackjackRank = 1;
                break;
            case 8:
            case 9:
            case 10:
            case 11:
                blackjackRank = 0;
                break;
            default:
                blackjackRank = cardRank + 2;
                break;
        }
        return blackjackRank;
    }
    static handTotalToHandString(total) {
        if (total > 0) {
            return "Hard " + total;
        }
        else {
            return "Soft " + Math.abs(total);
        }
    }
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
class CardTarget {
}
CardTarget.Autojack = 0;
CardTarget.Player = 1;
CardTarget.Dealer = 2;
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
Constants.RankNames = [
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Jack",
    "Queen",
    "King",
    "Ace"
];
Constants.SuitNames = [
    "Clubs",
    "Diamonds",
    "Hearts",
    "Spades"
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
// Basic emissions
Emissions.ChangeCursorValue = "Change cursor value";
Emissions.ClearBettingSpots = "Clear betting spots";
Emissions.AddCursorValue = "Add cursor value";
Emissions.BeginDeal = "Begin deal";
Emissions.NewGame = "New game";
Emissions.RebetBets = "Rebet bets";
Emissions.HintPlease = "Hint, please";
Emissions.Yes = "Yes";
Emissions.No = "Nah";
// Ante-Play-Fold emissions
Emissions.Play = "Play";
Emissions.FoldHand = "Fold Hand";
// Blackjack emissions
Emissions.Split = "Split";
Emissions.Double = "Double";
Emissions.Hit = "Hit";
Emissions.Stand = "Stand";
// Custom game emissions
Emissions.Surrender = "Surrender";
class GameState {
}
// Basic states
GameState.Predeal = 0;
GameState.StartDeal = 1;
GameState.MainInput = 2;
GameState.GameOver = 3;
// Blackjack steps
GameState.InsuranceInput = 4;
// Custom states
GameState.PlayOrFoldAutojack = 5;
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
// State control steps
Steps.ChangeStateMainInput = "CHANGE STATE: Main input";
Steps.ChangeStateGameOver = "CHANGE STATE: Game Over";
Steps.ChangeStateInsuranceInput = "CHANGE STATE: Insurance Input";
// Dealing steps
Steps.CardToPlayer = "Card to player";
Steps.DoublePlayerHands = "Double player hands";
Steps.CardToDealer = "Card to dealer";
// Blackjack steps
Steps.AnnotateDealer = "Annotate Dealer hand";
Steps.CheckForNaturals = "Check For Naturals";
Steps.CheckForInsurance = "Check for insurance";
Steps.CheckHoleCard = "Check Hole Card";
Steps.DealerDrawCard = "Dealer Draw Card";
Steps.FlipHoleCard = "Flip hole card";
Steps.ForceNextHand = "Force next hand";
Steps.PlayDealerHand = "Play Dealer Hand";
Steps.PostPlayerControl = "Post Double Control";
Steps.ResolveBust = "Resolve Bust";
Steps.ResolveInsurance = "Resolve Insurance";
Steps.ResolvePlayerHands = "Resolve Player Hands";
Steps.SplitPair = "Split Pair";
class StringTable {
}
// Basic strings
StringTable.PredealInstructions = "Click on chip to select denomination, click on any wager spot to add chips to make five equal bets, then click DEAL to begin.";
StringTable.Instructions = "Choose your play, which will apply to ALL unlocked hands (A hand is locked on hard 17 or more, or on soft 19 or more).";
StringTable.GameOver = "Game over.  Click 'REBET' to play again with same wagers, or click 'NEW' to set new wagers.";
// Blackjack strings
StringTable.Insurance = "Would you like insurance?  Yes/No";
//# sourceMappingURL=index.js.map