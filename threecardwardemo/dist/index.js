"use strict";
class AssetNames {
}
AssetNames.Cards = "cards";
AssetNames.Chips = "chips";
AssetNames.RedButtonSmall = "buttonRedSmall";
AssetNames.BlueButtonSmall = "buttonBlueSmall";
AssetNames.GreenButtonSmall = "buttonGreenSmall";
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
                // parent: 'game-div',
                // mode: Phaser.Scale.FIT,
                width: this.gameOptions.gameWidth,
                height: this.gameOptions.gameHeight
            }
        };
        this.gameReference = new Phaser.Game(gameConfig);
    }
}
Config.emitter = new Phaser.Events.EventEmitter();
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
    feltFormat: {
        fontFamily: "Arial",
        fontSize: "12px",
        fontColor: "#FFFFFF",
        align: "center"
    },
    scoreFormat: {
        fontFamily: "Arial",
        fontSize: "18px",
        fontStyle: "bold",
        color: "#FFFFFF",
        align: "center"
    },
    commentaryFormat: {
        fontFamily: "Arial",
        fontSize: "20px",
        fontColor: "#FFFFFF",
        fontStyle: "bold",
        align: "left"
    },
    helpFormat: {
        fontFamily: "Arial",
        fontSize: "22px",
        color: "#FFFFFF",
        align: "left"
    },
    instructionFormat: {
        fontFamily: "Arial",
        fontSize: "22px",
        color: "#000000",
        align: "center"
    },
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
        this.PayLeftOffset = new Point(-34, -37);
        this.PayRightOffset = new Point(34, -37);
        this.HandAnchors = [
            new Point(372, 240),
            new Point(372, 380)
        ];
        this.CommentaryAnchor = new Point(340, 140);
        this.Paytable = [0, 0, 0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 10, 10, 10, 10, 25, 25, 25, 25, 50, 50, 100, 500, 1000];
        this.HandCardGap = 100;
        this._lastWagerAmounts = new Array(0);
        //#endregion
        //#region Hand information
        this._playerAnchors = new Array(2);
        this._playerHands = new Array(2);
        this._playerChoice = -1;
        this._playerResult = 0;
        this._chipButtons = new Array(0);
        this._score = 0;
        // #endregion
        //#region Game lists
        this._stepList = new Array(0);
        this._commentaryList = new Array(0);
        this._payoutList = new Array(0);
        //#endregion
        //#region Test hands
        this._testHands = new Array(0);
        //#endregion
        //#region Other member variables
        this._currentState = -1;
    }
    create() {
        // Add the game felt.
        let feltGraphic = this.add.image(0, 0, "gameFelt");
        feltGraphic.setOrigin(0, 0);
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
        // Create handler to graphics object
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
        let helpBitmap = this.add.image(440, 695, "greyTextLarge");
        helpBitmap.setOrigin(0, 0);
        helpBitmap.setDisplaySize(569, 50);
        this._helpField = this.add.text(440, 695, [""]);
        this._helpField.setFixedSize(569, 0);
        this._helpField.setPadding(0, 3, 0, 0);
        this._helpField.setStyle(Config.gameOptions.instructionFormat);
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
        // Create player hand objects
        for (let index = 0; index < 5; index += 1) {
            this._playerHands[index] = new Array(0);
            this._playerAnchors[index] = new Point();
        }
        //#region Button panels
        //#region Clear | Deal panel
        this._clearButton = new Button({
            scene: this,
            style: AssetNames.BlueButtonSmall,
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
            style: AssetNames.BlueButtonSmall,
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
            style: AssetNames.BlueButtonSmall,
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
            style: AssetNames.GreenButtonSmall,
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
        //#region Main panel
        this._topRowButton = new Button({
            scene: this,
            style: AssetNames.GreenButtonSmall,
            caption: "TOP",
            clickEvent: Emissions.TopRow,
            x: 252,
            y: 245,
            visible: false
        });
        this.add.existing(this._topRowButton);
        Config.emitter.on(Emissions.TopRow, this.betTopRow, this);
        this._bottomRowButton = new Button({
            scene: this,
            style: AssetNames.GreenButtonSmall,
            caption: "BOTTOM",
            clickEvent: Emissions.BottomRow,
            x: 252,
            y: 385,
            visible: false
        });
        this.add.existing(this._bottomRowButton);
        Config.emitter.on(Emissions.BottomRow, this.betBottomRow, this);
        this._mainPanel = [this._topRowButton, this._bottomRowButton];
        //#endregion
        //#region Other buttons
        this._helpButton = new Button({
            scene: this,
            style: AssetNames.RedButtonSmall,
            caption: "RULES",
            clickEvent: Emissions.HelpScreen,
            x: 82,
            y: 665,
            visible: true
        });
        this.add.existing(this._helpButton);
        Config.emitter.on(Emissions.HelpScreen, this.showHelpScreen, this);
        //#endregion
        //#endregion
        //#region Betting spots
        this._anteSpot = this.placeBettingSpot(new Point(500, 625), SpotType.Main, "ANTE", this.PayLeftOffset);
        this._bettingSpots = [this._anteSpot];
        this._lastWagerAmounts = new Array(this._bettingSpots.length);
        //#endregion
        //#region Payout move spots
        this._topMoveWager = this.placeBettingSpot(new Point(705, 260), SpotType.Locked, "", this.PayRightOffset);
        this._bottomMoveWager = this.placeBettingSpot(new Point(705, 400), SpotType.Locked, "", this.PayRightOffset);
        this._wagerMoveSpots = [this._topMoveWager, this._bottomMoveWager];
        //#endregion
        this.Score = 10000;
        this.CurrentState = GameState.Predeal;
    }
    //#region Animation Methods
    addCommentaryField(xLoc, yLoc, fieldText) {
        let newCommentary = this.add.text(xLoc, yLoc, fieldText, Config.gameOptions.commentaryFormat);
        this._commentaryList.push(newCommentary);
        return newCommentary;
    }
    deliverHand(target) {
        let cardLocations = new Array(0);
        for (let index = 0; index < 3; index += 1) {
            cardLocations.push(new Point());
            cardLocations[index].x = this.HandAnchors[target].x + (index * this.HandCardGap);
            cardLocations[index].y = this.HandAnchors[target].y;
        }
        ;
        // Deliver the cards
        let newCardNumber;
        for (let stage = 0; stage < cardLocations.length; stage += 1) {
            let lastCard = (stage == cardLocations.length - 1);
            newCardNumber = this._shoe.drawCard();
            // TODO: Eliminate this when done testing
            // if (target == CardTarget.PeakHand) newCardNumber = 21 - (stage * 4);
            // if (target == CardTarget.NextHand && this._gameRound == 2) newCardNumber = 26 - (stage * 4);
            let nextCard = new PlayingCard({
                scene: this,
                x: 0,
                y: 0,
                cardNumber: newCardNumber,
                isFaceUp: false
            });
            nextCard.alpha = 0.0;
            nextCard.setOrigin(0.5, 0.5);
            this.add.existing(nextCard);
            this._playerHands[target].push(nextCard);
            this.tweens.add({
                targets: nextCard,
                duration: 300,
                delay: 50 * stage,
                x: cardLocations[stage].x,
                y: cardLocations[stage].y,
                alpha: 1.0,
                ease: Phaser.Math.Easing.Expo.Out,
                onComplete: (lastCard ? this.doAnimation : null),
                onCompleteScope: (lastCard ? this : null)
            });
        }
    }
    doAnimation() {
        let thisAction = this._stepList.shift();
        switch (thisAction) {
            case Steps.ResolvePayout: {
                if (this._playerResult < 0) {
                    let startAmount = this._wagerMoveSpots[this._playerChoice].Amount;
                    this.tweens.addCounter({
                        from: startAmount,
                        to: 0,
                        duration: 500,
                        ease: 'linear',
                        onUpdate: tween => {
                            this._wagerMoveSpots[this._playerChoice].Amount = tween.getValue();
                        },
                        onComplete: this.doAnimation,
                        onCompleteScope: this
                    });
                }
                else {
                    this.sound.play("chching");
                    let startAmount = this._wagerMoveSpots[this._playerChoice].Amount;
                    let newAmount = startAmount + this.Paytable[this._playerResult] * this._wagerMoveSpots[this._playerChoice].Amount;
                    this.tweens.addCounter({
                        from: startAmount,
                        to: newAmount,
                        duration: 500,
                        ease: 'linear',
                        onUpdate: tween => {
                            this._wagerMoveSpots[this._playerChoice].Amount = tween.getValue();
                        }
                    });
                    this.tweens.addCounter({
                        from: newAmount,
                        to: 0,
                        delay: 1500,
                        duration: 1500,
                        ease: 'linear',
                        onUpdate: tween => {
                            this._wagerMoveSpots[this._playerChoice].Amount = tween.getValue();
                        }
                    });
                    let startScore = this.Score;
                    let finalScore = startScore + newAmount;
                    this.tweens.addCounter({
                        from: startScore,
                        to: finalScore,
                        delay: 1500,
                        duration: 1500,
                        ease: 'linear',
                        onUpdate: tween => {
                            this.Score = tween.getValue();
                        },
                        onComplete: this.doAnimation,
                        onCompleteScope: this
                    });
                    console.debug(startScore);
                    console.debug(finalScore);
                }
                break;
            }
            case Steps.ResolveFirstCard: {
                this.resolveMatchup(0);
                break;
            }
            case Steps.ResolveSecondCard: {
                this.resolveMatchup(1);
                break;
            }
            case Steps.ResolveThirdCard: {
                this.resolveMatchup(2);
                break;
            }
            case Steps.FlipFirstPlayerCard: {
                this.flipCard(this._playerHands[this._playerChoice][0]);
                break;
            }
            case Steps.FlipFirstDealerCard: {
                this.flipCard(this._playerHands[1 - this._playerChoice][0]);
                break;
            }
            case Steps.FlipSecondPlayerCard: {
                this.flipCard(this._playerHands[this._playerChoice][1]);
                break;
            }
            case Steps.FlipSecondDealerCard: {
                this.flipCard(this._playerHands[1 - this._playerChoice][1]);
                break;
            }
            case Steps.FlipThirdPlayerCard: {
                this.flipCard(this._playerHands[this._playerChoice][2]);
                break;
            }
            case Steps.FlipThirdDealerCard: {
                this.flipCard(this._playerHands[1 - this._playerChoice][2]);
                break;
            }
            case Steps.MoveWagerToSelected: {
                let moveTarget = this._wagerMoveSpots[this._playerChoice];
                let wagerAmount = this._anteSpot.Amount;
                this.tweens.addCounter({
                    from: 0,
                    to: wagerAmount,
                    duration: 500,
                    ease: 'linear',
                    onUpdate: tween => {
                        moveTarget.Amount = tween.getValue();
                    }
                });
                this.tweens.addCounter({
                    from: wagerAmount,
                    to: 0,
                    duration: 500,
                    ease: 'linear',
                    onUpdate: tween => {
                        this._anteSpot.Amount = tween.getValue();
                    },
                    onComplete: this.doAnimation,
                    onCompleteScope: this
                });
                break;
            }
            case Steps.CollectInitialBet: {
                if (this.Score < this._anteSpot.Amount) {
                    this.sound.play("chching");
                    this.Score += 10000;
                }
                this.spinBankrollToTarget(this.Score - this._anteSpot.Amount);
                break;
            }
            case Steps.DeliverTopHand: {
                this.deliverHand(0);
                break;
            }
            case Steps.DeliverBottomHand: {
                this.deliverHand(1);
                break;
            }
            case Steps.DeliverBottomHand: {
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
    flipCard(target) {
        let lengths = [150, 100, 100, 150];
        let delays = [];
        for (let x = 0; x < 4; x += 1) {
            let thisDelay = 0;
            for (let i = 1; i <= x; i += 1)
                thisDelay += lengths[i - 1];
            delays.push(thisDelay);
        }
        this.add.tween({
            targets: target,
            delay: delays[0],
            duration: lengths[0],
            x: "-=30"
        });
        this.add.tween({
            targets: target,
            delay: delays[1],
            duration: lengths[1],
            scaleX: 0,
            scaleY: 1.2,
            onComplete: () => {
                target.IsFaceUp = true;
            }
        });
        this.add.tween({
            targets: target,
            delay: delays[2],
            duration: lengths[2],
            scaleX: 1.0,
            scaleY: 1.0
        });
        this.add.tween({
            targets: target,
            delay: delays[3],
            duration: lengths[3],
            x: "+=30",
            onComplete: this.doAnimation,
            onCompleteScope: this
        });
    }
    mountAnimationSteps(steps) {
        for (let thisStep of steps) {
            this._stepList.push(thisStep);
        }
    }
    playDoubleBeep() {
        this.sound.play("doubleBeep");
    }
    playSingleBeep() {
        this.sound.play("singleBeep");
    }
    predealInitialization() {
        this._shoe.shuffle();
        // Clear arrays
        for (let i = 0; i < 2; i += 1) {
            this.clearGameObjectArray(this._playerHands[i]);
            this._playerAnchors[i].setTo(this.HandAnchors[i].x, this.HandAnchors[i].y);
        }
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
        // Reset player result
        this._playerResult = 0;
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
            thisButton.setInteractive({ useHandCursor: true });
    }
    resolveMatchup(round) {
        let playerRank = Math.floor(this._playerHands[this._playerChoice][round].CardNumber / 4);
        let dealerRank = Math.floor(this._playerHands[1 - this._playerChoice][round].CardNumber / 4);
        if (dealerRank == 12) {
            // Ace is low for dealer
            dealerRank = -1;
        }
        let margin = playerRank - dealerRank;
        if (margin < 0) {
            // Player loses, game over
            this._playerResult = -1;
            let locX = this.CommentaryAnchor.x + (this.HandCardGap * round);
            let locY = this.CommentaryAnchor.y;
            this.addCommentaryField(locX, locY, "LOSE");
            this.mountAnimationSteps([
                Steps.ResolvePayout,
                Steps.ChangeStateGameOver
            ]);
            this.doAnimation();
        }
        else {
            this._playerResult += margin;
            let locX = this.CommentaryAnchor.x + (this.HandCardGap * round);
            let locY = this.CommentaryAnchor.y;
            this.addCommentaryField(locX, locY, "WIN (" + margin.toString() + ")");
            if (round == 2) {
                this.mountAnimationSteps([
                    Steps.ResolvePayout,
                    Steps.ChangeStateGameOver
                ]);
                this.doAnimation();
            }
            else if (round == 1) {
                this.mountAnimationSteps([
                    Steps.FlipThirdPlayerCard,
                    Steps.FlipThirdDealerCard,
                    Steps.ResolveThirdCard
                ]);
                this.doAnimation();
            }
            else if (round == 0) {
                this.mountAnimationSteps([
                    Steps.FlipSecondPlayerCard,
                    Steps.FlipSecondDealerCard,
                    Steps.ResolveSecondCard
                ]);
                this.doAnimation();
            }
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
    spinBankrollToTarget(value) {
        let startBankroll = this.Score;
        this.tweens.addCounter({
            from: startBankroll,
            to: value,
            duration: 500,
            ease: 'linear',
            onUpdate: tween => {
                this.Score = tween.getValue();
            },
            onComplete: this.doAnimation,
            onCompleteScope: this
        });
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
                // Mount and do the animations
                this.mountAnimationSteps([
                    Steps.CollectInitialBet,
                    Steps.DeliverTopHand,
                    Steps.DeliverBottomHand,
                    Steps.ChangeStateMainInput
                ]);
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
    //#region Drawing methods
    placeBettingSpot(spotAnchor, spotType, label, payoffOffset) {
        if (label != "") {
            let graphics = this.add.graphics();
            graphics.lineStyle(5, 0xffffff, 1);
            graphics.strokeCircle(spotAnchor.x - 28, spotAnchor.y - 26, 40);
            let anteLabel = this.add.text(spotAnchor.x - 68, spotAnchor.y + 25, label);
            anteLabel.setFixedSize(80, 22);
            anteLabel.setStyle(Config.gameOptions.feltFormat);
        }
        let output = new BettingSpot({
            scene: this,
            x: spotAnchor.x,
            y: spotAnchor.y,
            amount: 0,
            payoffOffset: payoffOffset
        });
        switch (spotType) {
            case SpotType.Main: {
                output.MinimumBet = 5;
                output.MaximumBet = 500;
                output.IsOptional = false;
                output.IsPlayerSpot = true;
                output.IsLocked = false;
                break;
            }
            case SpotType.Side: {
                output.MinimumBet = 1;
                output.MaximumBet = 25;
                output.IsOptional = true;
                output.IsPlayerSpot = true;
                output.IsLocked = false;
                break;
            }
            case SpotType.Locked: {
                output.MinimumBet = 1;
                output.MaximumBet = 500;
                output.IsOptional = true;
                output.IsPlayerSpot = false;
                output.IsLocked = true;
                break;
            }
            default: {
                console.debug("BETTING SPOT TYPE NOT HANDLED: ", spotType);
            }
        }
        output.HitZone.on("clicked", this.addSelectedValue, this);
        this.add.existing(output);
        return output;
    }
    //#endregion
    //#region Event handlers
    addSelectedValue(target) {
        if (this._cursorValue > 0) {
            let targetSpot = target.parentContainer;
            let newValue = Math.min(targetSpot.Amount + this._cursorValue, targetSpot.MaximumBet);
            this.playSingleBeep();
            targetSpot.Amount = newValue;
        }
    }
    beginDeal() {
        this.playDoubleBeep();
        this.CurrentState = GameState.StartDeal;
    }
    betBottomRow() {
        for (let button of this._mainPanel)
            button.visible = false;
        this.playSingleBeep();
        this._playerChoice = 1;
        this.mountAnimationSteps([
            Steps.MoveWagerToSelected,
            Steps.FlipFirstPlayerCard,
            Steps.FlipFirstDealerCard,
            Steps.ResolveFirstCard
        ]);
        this.doAnimation();
    }
    betTopRow() {
        for (let button of this._mainPanel)
            button.visible = false;
        this.playSingleBeep();
        this._playerChoice = 0;
        this.mountAnimationSteps([
            Steps.MoveWagerToSelected,
            Steps.FlipFirstPlayerCard,
            Steps.FlipFirstDealerCard,
            Steps.ResolveFirstCard
        ]);
        this.doAnimation();
    }
    clearBettingSpots() {
        this.playDoubleBeep();
        for (let spot of this._bettingSpots) {
            spot.Amount = 0;
        }
    }
    newBets() {
        this.playDoubleBeep();
        this.CurrentState = GameState.Predeal;
    }
    rebetBets() {
        this.playDoubleBeep();
        this.predealInitialization();
        for (let index = 0; index < this._bettingSpots.length; index += 1) {
            this._bettingSpots[index].Amount = this._lastWagerAmounts[index];
        }
        this.CurrentState = GameState.StartDeal;
    }
    selectChip(target) {
        this.playSingleBeep();
        this.selectCursorValue(target.Value);
    }
    showHelpScreen() {
        this.playDoubleBeep();
        this.scene.switch("HelpScene");
    }
    //#endregion
    //#region Logic methods
    clearGameObjectArray(target) {
        for (let index = 0; index < target.length; index += 1) {
            target[index].destroy();
        }
        target.length = 0;
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
            this.sound.play("chching");
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
    preload() {
        this.load.text("helpText", "assets/text/helpText.txt");
    }
    create() {
        this.input.on('gameobjectup', function (_, gameObject) {
            gameObject.emit('clicked', gameObject);
        }, this);
        let feltGraphic = this.add.image(0, 0, "gameFelt");
        feltGraphic.setOrigin(0, 0);
        let button = new Button({
            scene: this,
            style: AssetNames.GreenButtonSmall,
            caption: "GO BACK",
            clickEvent: Emissions.ReturnToGame,
            x: 952,
            y: 729,
            visible: true
        });
        this.add.existing(button);
        Config.emitter.on(Emissions.ReturnToGame, this.returnToGame, this);
        // Load the help text
        let helpTextData = this.cache.text.get("helpText").split('\n');
        let helpTextField = this.add.text(50, 50, helpTextData);
        helpTextField.setWordWrapWidth(910);
        helpTextField.setStyle(Config.gameOptions.helpFormat);
    }
    returnToGame() {
        this.sound.play("doubleBeep");
        this.scene.switch("GameScene");
    }
}
class LoaderScene extends Phaser.Scene {
    constructor() {
        super("LoaderScene");
    }
    preload() {
        //#region Load sounds
        this.load.audio("buttonClick", ["./assets/sounds/buttonClick.mp3"]);
        this.load.audio("chipClick", ["./assets/sounds/chipClick.mp3"]);
        this.load.audio("chching", ["./assets/sounds/chching.mp3"]);
        this.load.audio("doubleBeep", ["./assets/sounds/doubleBeep.mp3"]);
        this.load.audio("shuffle", ["./assets/sounds/shuffle.mp3"]);
        this.load.audio("singleBeep", ["./assets/sounds/singleBeep.mp3"]);
        //#endregion
        //#region Load images
        this.load.image("gameFelt", "assets/images/greenFeltHoriz.png");
        this.load.image("blueText", "assets/images/blueText130x50.png");
        this.load.image("greyTextSmall", "assets/images/greyText345x50.png");
        this.load.image("greyTextLarge", "assets/images/greyText430x50.png");
        this.load.image("dropPixel", "assets/images/dropPixel.jpg");
        //#endregion
        //#region Load spritesheets
        this.load.spritesheet(AssetNames.Cards, "assets/images/dkCards.png", {
            frameWidth: Config.gameOptions.cardWidth,
            frameHeight: Config.gameOptions.cardHeight
        });
        this.load.spritesheet(AssetNames.Chips, "assets/images/dkChips.png", {
            frameWidth: Config.gameOptions.chipWidth,
            frameHeight: Config.gameOptions.chipHeight
        });
        this.load.spritesheet(AssetNames.RedButtonSmall, "assets/images/redButton123x35.png", {
            frameWidth: Config.gameOptions.buttonWidth,
            frameHeight: Config.gameOptions.buttonHeight
        });
        this.load.spritesheet(AssetNames.BlueButtonSmall, "assets/images/blueButton123x35.png", {
            frameWidth: Config.gameOptions.buttonWidth,
            frameHeight: Config.gameOptions.buttonHeight
        });
        this.load.spritesheet(AssetNames.GreenButtonSmall, "assets/images/greenButton123x35.png", {
            frameWidth: Config.gameOptions.buttonWidth,
            frameHeight: Config.gameOptions.buttonHeight
        });
        //#endregion
    }
    // Start the game
    create() {
        this.scene.start("GameScene");
    }
}
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
        super(config.scene, config.x, config.y, AssetNames.Chips);
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
// Common Emissions
Emissions.ChangeCursorValue = "Change cursor value";
Emissions.ClearBettingSpots = "Clear betting spots";
Emissions.AddCursorValue = "Add cursor value";
Emissions.BeginDeal = "Begin deal";
Emissions.NewGame = "New game";
Emissions.RebetBets = "Rebet bets";
Emissions.HintPlease = "Hint, please";
Emissions.HelpScreen = "Help Screen";
Emissions.ReturnToGame = "Return to game";
// Specific game Emissions
Emissions.TopRow = "Bet on top row";
Emissions.BottomRow = "Bet on bottom row";
class GameState {
}
// Basic states
GameState.Predeal = 0;
GameState.StartDeal = 1;
GameState.MainInput = 2;
GameState.GameOver = 3;
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
        super(config.scene, config.x, config.y, AssetNames.Cards);
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
class SpotType {
}
SpotType.Main = "Main wager type";
SpotType.Side = "Side wager type";
SpotType.Locked = "Locked wager type";
class Steps {
}
// State control steps
Steps.ChangeStateMainInput = "CHANGE STATE: Main input";
Steps.ChangeStateGameOver = "CHANGE STATE: Game Over";
// Dealing steps
Steps.DeliverBottomHand = "Deliver Bottom Hand";
Steps.DeliverTopHand = "Deliver Top Hand";
Steps.FlipFirstPlayerCard = "Flip first player card";
Steps.FlipFirstDealerCard = "Flip first dealer card";
Steps.ResolveFirstCard = "Resolve first card";
Steps.FlipSecondPlayerCard = "Flip Second player card";
Steps.FlipSecondDealerCard = "Flip Second dealer card";
Steps.ResolveSecondCard = "Resolve Second card";
Steps.FlipThirdPlayerCard = "Flip Third player card";
Steps.FlipThirdDealerCard = "Flip Third dealer card";
Steps.ResolveThirdCard = "Resolve Third card";
Steps.ResolvePayout = "Resolve Payout";
// Money manipulation steps
Steps.CollectInitialBet = "Collect initial bet";
Steps.MoveWagerToSelected = "Move wager to selected space";
class StringTable {
}
// Basic strings
StringTable.PredealInstructions = "Click on chip to select denomination, click on any wager spot to add chips to make five equal bets, then click DEAL to begin.";
StringTable.Instructions = "Choose your play, which will apply to ALL unlocked hands (A hand is locked on hard 17 or more, or on soft 19 or more).";
StringTable.GameOver = "Game over.  Click 'REBET' to play again with same wagers, or click 'NEW' to set new wagers.";
//# sourceMappingURL=index.js.map