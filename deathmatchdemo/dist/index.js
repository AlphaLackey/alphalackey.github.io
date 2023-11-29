"use strict";
class Config {
    static initGame() {
        let gameConfig = {
            width: this.gameOptions.gameWidth,
            height: this.gameOptions.gameHeight,
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
Config.emitter = new Phaser.Events.EventEmitter();
Config.gameOptions = {
    gameWidth: 1920,
    gameHeight: 1080,
    buttonWidth: 123,
    buttonHeight: 35,
    cardWidth: 266,
    cardHeight: 366,
    chipWidth: 102,
    chipHeight: 91,
    chipValues: [100, 25, 5, 1],
    scoreFormat: {
        fontFamily: "Arial",
        fontSize: "36px",
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
    },
    helpScreenFormat: {
        fontFamily: "Arial",
        fontSize: "22px",
        color: "#FFFFFF",
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
        this.TargetFontInstructionSize = 44;
        this.ButtonScale = 1.8;
        this.HorizButtonGap = 280;
        this.LeftPayoffOffset = new Point(-34 * 1.8, -37 * 1.8);
        this.RightPayoffOffset = new Point(34 * 1.8, -37 * 1.8);
        this.CardDelay = 200;
        this.CardSpeed = 500;
        this.LeftScoreboardAnchor = new Point(140, 420);
        this.RightScoreboardAnchor = new Point(1650, 420);
        this.ScoreboardSize = 9;
        this.DotScoreboardGap = 53;
        this.TotalScoreboardGap = 225;
        this.CardPositions = [
            new Point(480, 200),
            new Point(780, 200),
            new Point(630, 525),
            new Point(1110, 200),
            new Point(1410, 200),
            new Point(1260, 525)
        ];
        //#endregion
        //#region Hand information
        this._leftHand = new Array(0);
        this._leftScore = 0;
        this._rightHand = new Array(0);
        this._rightScore = 0;
        this._playerIsLeft = true;
        this._chipButtons = new Array(0);
        this._score = 0;
        //#endregion
        //#region Game lists
        this._stepList = new Array(0);
        this._commentaryList = new Array(0);
        this._payoutList = new Array(0);
        this._dotScoreboard = new Array(0);
        this._totalScoreboard = new Array(0);
        this._scoreboardData = new Array(0);
        //#endregion
        //#region Other member letiables
        this._currentState = -1;
        this._isLegendaryConquest = false;
    }
    create() {
        // Add the game felt.
        this.add.image(Config.gameOptions.gameWidth / 2, Config.gameOptions.gameHeight / 2, "gameFelt");
        this._leftSign = this.add.sprite(20, 0, "sign", 0);
        this._leftSign.setOrigin(0, 0);
        this._rightSign = this.add.sprite(1572, 0, "sign", 0);
        this._rightSign.setOrigin(0, 0);
        this._leftImage = this.add.image(623, 780, "left spot");
        this._leftImage.scale = 0.3;
        this._rightImage = this.add.image(1310, 780, "right spot");
        this._rightImage.scale = 0.3;
        // Create the shoe objects
        let blackRanks = new Array(52);
        let redRanks = new Array(52);
        for (let rank = 0; rank < 52; rank += 1) {
            blackRanks[rank] = 0;
            redRanks[rank] = 0;
            let suit = rank % 4;
            if (suit == 0 || suit == 3) {
                blackRanks[rank] += 1;
            }
            else {
                redRanks[rank] += 1;
            }
        }
        this._leftShoe = new QuantumShoe(blackRanks, 1);
        this._rightShoe = new QuantumShoe(redRanks, 1);
        // Turn on listening to input events
        this.input.on('gameobjectup', function (_, gameObject) {
            gameObject.emit('clicked', gameObject);
        }, this);
        //#region Scoreboard panel graphics
        // create handler to graphics object
        let graphics = this.add.graphics();
        // add the score display
        let scoreBitmap = this.add.image(210, 965, "blueText");
        scoreBitmap.setOrigin(0, 0);
        scoreBitmap.setDisplaySize(260, 100);
        graphics.lineStyle(10, 0xffffff, 1);
        graphics.strokeRoundedRect(210, 965, 260, 100, 5);
        this._scoreField = this.add.text(210, 965, [""]);
        this._scoreField.setFixedSize(260, 100);
        this._scoreField.setPadding(0, 6, 0, 0);
        this._scoreField.setStyle(Config.gameOptions.scoreFormat);
        this.Score = 5000;
        // Now, add the help field
        let helpBitmap = this.add.image(990, 965, "blueText");
        helpBitmap.setOrigin(0, 0);
        helpBitmap.setDisplaySize(700, 100);
        this._helpField = this.add.text(990, 965, [""]);
        this._helpField.setFixedSize(700, 0);
        this._helpField.setPadding(6, 6, 6, 6);
        this._helpField.setStyle(Config.gameOptions.scoreFormat);
        this._helpField.setWordWrapWidth(710);
        graphics.lineStyle(10, 0xffffff, 1);
        graphics.strokeRoundedRect(990, 965, 700, 100, 5);
        let chipDenominations = [1, 5, 25, 100];
        for (let index = 0; index < chipDenominations.length; index += 1) {
            let chipButton = new Chip({
                scene: this,
                x: 545 + (index * 123),
                y: 1015
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
        //#region Button Panels
        //#region Clear | Deal panel
        let panelAnchor = new Point(820, 915);
        this._clearButton = new Button({
            scene: this,
            style: AssetNames.BlueSmall,
            caption: "CLEAR",
            clickEvent: Emissions.ClearBettingSpots,
            x: panelAnchor.x,
            y: panelAnchor.y,
            visible: false
        });
        this._clearButton.scale = this.ButtonScale;
        this.add.existing(this._clearButton);
        Config.emitter.on(Emissions.ClearBettingSpots, this.clearBettingSpots, this);
        this._dealButton = new Button({
            scene: this,
            style: AssetNames.BlueSmall,
            caption: "DEAL",
            clickEvent: Emissions.BeginDeal,
            x: panelAnchor.x + (this.HorizButtonGap * 1),
            y: panelAnchor.y,
            visible: false
        });
        this._dealButton.scale = this.ButtonScale;
        this.add.existing(this._dealButton);
        Config.emitter.on(Emissions.BeginDeal, this.beginDeal, this);
        this._clearDealPanel = [
            this._clearButton,
            this._dealButton
        ];
        //#endregion
        //#region Main Panel
        this._hitButton = new Button({
            scene: this,
            style: AssetNames.GreenSmall,
            caption: "HIT",
            clickEvent: Emissions.Hit,
            x: panelAnchor.x,
            y: panelAnchor.y,
            visible: false
        });
        this._hitButton.scale = this.ButtonScale;
        this.add.existing(this._hitButton);
        Config.emitter.on(Emissions.Hit, this.hitPlayerHand, this);
        this._standButton = new Button({
            scene: this,
            style: AssetNames.RedSmall,
            caption: "STAND",
            clickEvent: Emissions.Stand,
            x: panelAnchor.x + (this.HorizButtonGap * 1),
            y: panelAnchor.y,
            visible: false
        });
        this._standButton.scale = this.ButtonScale;
        this.add.existing(this._standButton);
        Config.emitter.on(Emissions.Stand, this.standPlayerHand, this);
        this._mainPanel = [
            this._hitButton,
            this._standButton
        ];
        //#endregion
        //#region New | Rebet panel
        this._newButton = new Button({
            scene: this,
            style: AssetNames.BlueSmall,
            caption: "NEW",
            clickEvent: Emissions.NewGame,
            x: panelAnchor.x,
            y: panelAnchor.y,
            visible: false
        });
        this._newButton.scale = this.ButtonScale;
        this.add.existing(this._newButton);
        Config.emitter.on(Emissions.NewGame, this.newBets, this);
        this._rebetButton = new Button({
            scene: this,
            style: AssetNames.BlueSmall,
            caption: "REBET",
            clickEvent: Emissions.RebetBets,
            x: panelAnchor.x + (this.HorizButtonGap * 1),
            y: panelAnchor.y,
            visible: false
        });
        this._rebetButton.scale = this.ButtonScale;
        this.add.existing(this._rebetButton);
        Config.emitter.on(Emissions.RebetBets, this.rebetBets, this);
        this._newRebetButtonPanel = [this._newButton, this._rebetButton];
        //#endregion
        //#region Continue Button
        this._continueButton = new Button({
            scene: this,
            style: AssetNames.BlueSmall,
            caption: "CONTINUE",
            clickEvent: Emissions.Continue,
            x: panelAnchor.x + (this.HorizButtonGap * 0.5),
            y: panelAnchor.y,
            visible: false
        });
        this._continueButton.scale = this.ButtonScale;
        this.add.existing(this._continueButton);
        Config.emitter.on(Emissions.Continue, this.continueButton, this);
        //#endregion
        //#region How To Play Button
        this._howToPlayButton = new Button({
            scene: this,
            style: AssetNames.BlueSmall,
            caption: "HOW TO PLAY",
            clickEvent: Emissions.HowToPlay,
            x: 460,
            y: 915,
            visible: true
        });
        this._howToPlayButton.scale = this.ButtonScale;
        this.add.existing(this._howToPlayButton);
        Config.emitter.on(Emissions.HowToPlay, this.showHelpScreen, this);
        //#endregion
        //#region Betting Spots
        //#region LeftSpot
        let spotAnchor = new Point(680, 810);
        this._leftSpot = new BettingSpot({
            scene: this,
            x: spotAnchor.x,
            y: spotAnchor.y,
            amount: 0,
            isOptional: true,
            isLocked: true,
            isPlayerSpot: true,
            minimumBet: 5,
            maximumBet: 100,
            payoffOffset: this.LeftPayoffOffset,
        });
        this._leftImage.on("clicked", this.addSelectedValue, this);
        this.add.existing(this._leftSpot);
        //#endregion
        //#region RightSpot
        spotAnchor = new Point(1330, 810);
        this._rightSpot = new BettingSpot({
            scene: this,
            x: spotAnchor.x,
            y: spotAnchor.y,
            amount: 0,
            isOptional: true,
            isLocked: true,
            isPlayerSpot: true,
            minimumBet: 5,
            maximumBet: 100,
            payoffOffset: this.RightPayoffOffset
        });
        this._rightImage.on("clicked", this.addSelectedValue, this);
        this.add.existing(this._rightSpot);
        //#endregion
        this._bettingSpots = [
            this._leftSpot,
            this._rightSpot
        ];
        this._lastWagerAmounts = new Array(this._bettingSpots.length);
        //#endregion
        this.Score = 10000;
        this.CurrentState = GameState.Predeal;
    }
    //#region Animation Methods
    updateScore(target) {
        if (target == CardTarget.Player) {
            this.clearGameObjectArray(this._totalScoreboard);
            let playerScore = (this._playerIsLeft ? this._leftScore : this._rightScore);
            let rightScoreboardString = "MY\nPOWER\nRANKING\n" + playerScore.toString();
            let rightTextField = this.add.text(this.RightScoreboardAnchor.x, this.RightScoreboardAnchor.y, rightScoreboardString, Config.gameOptions.scoreFormat);
            rightTextField.scale = 1.0;
            this._totalScoreboard.push(rightTextField);
        }
        else {
            let dealerScore = (!this._playerIsLeft ? this._leftScore : this._rightScore);
            let rightScoreboardString = "RIVAL'S\nPOWER\nRANKING\n" + dealerScore.toString();
            let rightTextField = this.add.text(this.RightScoreboardAnchor.x, this.RightScoreboardAnchor.y + this.TotalScoreboardGap, rightScoreboardString, Config.gameOptions.scoreFormat);
            rightTextField.scale = 1.0;
            this._totalScoreboard.push(rightTextField);
        }
    }
    deliverThirdCard(target) {
        let cardLocations;
        let handToAddCardTo;
        let shoeToDrawFrom;
        let deliverToLeft;
        if ((this._playerIsLeft && target == CardTarget.Player) || (!this._playerIsLeft && target == CardTarget.Dealer)) {
            cardLocations = [
                this.CardPositions[2]
            ];
            handToAddCardTo = this._leftHand;
            shoeToDrawFrom = this._leftShoe;
            deliverToLeft = true;
        }
        else {
            cardLocations = [
                this.CardPositions[5]
            ];
            handToAddCardTo = this._rightHand;
            shoeToDrawFrom = this._rightShoe;
            deliverToLeft = false;
        }
        for (let stage = 0; stage < 1; stage += 1) {
            let newCardNumber = shoeToDrawFrom.drawCard();
            if (deliverToLeft) {
                this._leftScore += Blackjack.cardNumberToBlackjackRank(newCardNumber);
                this._leftScore = this._leftScore % 10;
            }
            else {
                this._rightScore += Blackjack.cardNumberToBlackjackRank(newCardNumber);
                this._rightScore = this._rightScore % 10;
            }
            let nextCard = new PlayingCard({
                scene: this,
                x: 0,
                y: 0,
                cardNumber: newCardNumber,
                isFaceUp: true
            });
            nextCard.alpha = 0.0;
            nextCard.setOrigin(0.5, 0.5);
            this.add.existing(nextCard);
            handToAddCardTo.push(nextCard);
            this.tweens.add({
                targets: nextCard,
                duration: this.CardSpeed,
                delay: (this.CardDelay * stage),
                x: cardLocations[stage].x,
                y: cardLocations[stage].y,
                alpha: 1.0,
                ease: Phaser.Math.Easing.Expo.Out,
                onComplete: (stage == 0 ? this.doAnimation : null),
                onCompleteScope: (stage == 0 ? this : null)
            });
        }
    }
    deliverToTarget(target) {
        let cardLocations;
        let handToAddCardTo;
        let shoeToDrawFrom;
        let deliverToLeft;
        if ((this._playerIsLeft && target == CardTarget.Player) || (!this._playerIsLeft && target == CardTarget.Dealer)) {
            cardLocations = [
                this.CardPositions[0],
                this.CardPositions[1]
            ];
            handToAddCardTo = this._leftHand;
            shoeToDrawFrom = this._leftShoe;
            deliverToLeft = true;
        }
        else {
            cardLocations = [
                this.CardPositions[3],
                this.CardPositions[4]
            ];
            handToAddCardTo = this._rightHand;
            shoeToDrawFrom = this._rightShoe;
            deliverToLeft = false;
        }
        for (let stage = 0; stage < 2; stage += 1) {
            let newCardNumber = shoeToDrawFrom.drawCard();
            if (deliverToLeft) {
                this._leftScore += Blackjack.cardNumberToBlackjackRank(newCardNumber);
                this._leftScore = this._leftScore % 10;
            }
            else {
                this._rightScore += Blackjack.cardNumberToBlackjackRank(newCardNumber);
                this._rightScore = this._rightScore % 10;
            }
            let nextCard = new PlayingCard({
                scene: this,
                x: 0,
                y: 0,
                cardNumber: newCardNumber,
                isFaceUp: true
            });
            nextCard.alpha = 0.0;
            nextCard.setOrigin(0.5, 0.5);
            this.add.existing(nextCard);
            handToAddCardTo.push(nextCard);
            this.tweens.add({
                targets: nextCard,
                duration: this.CardSpeed,
                delay: (this.CardDelay * stage),
                x: cardLocations[stage].x,
                y: cardLocations[stage].y,
                alpha: 1.0,
                ease: Phaser.Math.Easing.Expo.Out,
                onComplete: (stage == 1 ? this.doAnimation : null),
                onCompleteScope: (stage == 1 ? this : null)
            });
        }
    }
    doAnimation() {
        let thisAction = this._stepList.shift();
        switch (thisAction) {
            case Steps.UpdatePlayerScore: {
                this.updateScore(CardTarget.Player);
                this.doAnimation();
                break;
            }
            case Steps.UpdateDealerScore: {
                this.updateScore(CardTarget.Dealer);
                this.doAnimation();
                break;
            }
            case Steps.ClearCards: {
                let cardsToClear = [];
                for (let card of this._leftHand)
                    cardsToClear.push(card);
                for (let card of this._rightHand)
                    cardsToClear.push(card);
                for (let stage = 0; stage < cardsToClear.length; stage += 1) {
                    let isLastCard = (stage == (cardsToClear.length - 1));
                    let nextCard = cardsToClear[stage];
                    this.tweens.add({
                        targets: nextCard,
                        duration: this.CardSpeed,
                        delay: (this.CardDelay * stage),
                        x: 0,
                        y: 0,
                        alpha: 0,
                        ease: Phaser.Math.Easing.Expo.Out,
                        onComplete: (isLastCard ? this.doAnimation : null),
                        onCompleteScope: (isLastCard ? this : null)
                    });
                }
                break;
            }
            case Steps.ClearHands: {
                this.clearGameObjectArray(this._leftHand);
                this.clearGameObjectArray(this._rightHand);
                this.clearGameObjectArray(this._totalScoreboard);
                this._rightSign.setFrame(0);
                this._leftScore = 0;
                this._rightScore = 0;
                this.doAnimation();
                break;
            }
            case Steps.DeliverToPlayer: {
                this.deliverToTarget(CardTarget.Player);
                break;
            }
            case Steps.DeliverToDealer: {
                this.deliverToTarget(CardTarget.Dealer);
                break;
            }
            case Steps.ThirdToPlayer: {
                this.deliverThirdCard(CardTarget.Player);
                break;
            }
            case Steps.ThirdToDealer: {
                this.deliverThirdCard(CardTarget.Dealer);
                break;
            }
            case Steps.ChangeStateFirstInput: {
                this.CurrentState = GameState.FirstInput;
                break;
            }
            case Steps.ChangeStateGameOver: {
                this.CurrentState = GameState.GameOver;
                break;
            }
            case Steps.ChangeStateContinue: {
                this.CurrentState = GameState.Continue;
                break;
            }
            case Steps.CheckForDealerThird: {
                let dealerTakesThird = false;
                let playerScore = (this._playerIsLeft ? this._leftScore : this._rightScore);
                let dealerScore = (this._playerIsLeft ? this._rightScore : this._leftScore);
                if (playerScore > dealerScore) {
                    dealerTakesThird = true;
                }
                else if (playerScore == dealerScore && playerScore <= 4) {
                    dealerTakesThird = true;
                }
                if (dealerTakesThird) {
                    this._stepList.push(Steps.ThirdToDealer);
                }
                this._stepList.push(Steps.UpdateDealerScore);
                this._stepList.push(Steps.CheckForTie);
                this.doAnimation();
                break;
            }
            case Steps.CheckForTie: {
                let playerScore = (this._playerIsLeft ? this._leftScore : this._rightScore);
                let dealerScore = (this._playerIsLeft ? this._rightScore : this._leftScore);
                if (playerScore == dealerScore) {
                    this._isLegendaryConquest = (this._isLegendaryConquest || playerScore == 9);
                    this._stepList.push(Steps.ChangeStateContinue);
                    this._stepList.push(Steps.ClearCards);
                    this._stepList.push(Steps.ClearHands);
                    this._stepList.push(Steps.ThirdToPlayer);
                    this._stepList.push(Steps.UpdatePlayerScore);
                    this._stepList.push(Steps.ThirdToDealer);
                    this._stepList.push(Steps.UpdateDealerScore);
                    this._stepList.push(Steps.CheckForTie);
                }
                else {
                    this._stepList.push(Steps.ResolvePlayerWager);
                    this._stepList.push(Steps.ChangeStateGameOver);
                }
                this.doAnimation();
                break;
            }
            case Steps.ResolvePlayerWager: {
                let playerSpot = (this._playerIsLeft ? this._leftSpot : this._rightSpot);
                let playerScore = (this._playerIsLeft ? this._leftScore : this._rightScore);
                let dealerScore = (this._playerIsLeft ? this._rightScore : this._leftScore);
                let playerPayout = 0;
                if (playerScore > dealerScore) {
                    playerPayout = this._isLegendaryConquest ? 2 : 1;
                }
                else if (playerScore < dealerScore) {
                    playerPayout = this._isLegendaryConquest ? 0 : -1;
                }
                else {
                    console.debug("Should never be here with a tied hand");
                    this._stepList = [];
                }
                this.resolvePayout(playerSpot, playerPayout, true, true);
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
    clearGameObjectArray(target) {
        for (let index = 0; index < target.length; index += 1) {
            target[index].destroy();
        }
        target.length = 0;
    }
    predealInitialization() {
        // Shuffle shoe
        this._leftShoe.shuffle();
        this._rightShoe.shuffle();
        // TODO: AND THE REST
        this._isLegendaryConquest = false;
        // Clear arrays
        this.clearGameObjectArray(this._leftHand);
        this.clearGameObjectArray(this._rightHand);
        this.clearGameObjectArray(this._payoutList);
        this.clearGameObjectArray(this._commentaryList);
        this.clearGameObjectArray(this._totalScoreboard);
        // Reset hand values
        this._leftScore = 0;
        this._rightScore = 0;
        // // Reset anchors, if needed:
        // this._playerAnchor.setTo(this.PlayerHandAnchor.x, this.PlayerHandAnchor.y);
        // this._dealerAnchor.setTo(this.DealerHandAnchor.x, this.DealerHandAnchor.y);
        // Clear betting spots
        for (let i = 0; i < this._bettingSpots.length; i += 1) {
            this._bettingSpots[i].Amount = 0;
            this._bettingSpots[i].alpha = 1.0;
        }
        this._leftImage.setInteractive({ useHandCursor: true });
        this._rightImage.setInteractive({ useHandCursor: true });
        // Hide "New | Rebet" panel
        for (let thisButton of this._newRebetButtonPanel) {
            thisButton.visible = false;
        }
        // Show "Clear | Deal" panel
        for (let thisButton of this._clearDealPanel) {
            thisButton.visible = true;
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
                if (this._leftSpot.Amount + this._rightSpot.Amount == 0) {
                    // Default to left spot if both blank
                    this._leftSpot.Amount = this._leftSpot.MinimumBet;
                }
                for (let thisWager of this._bettingSpots) {
                    if (!thisWager.IsOptional || thisWager.Amount > 0) {
                        thisWager.Amount = Math.max(thisWager.Amount, thisWager.MinimumBet);
                    }
                }
                // Store the last wagers, close wagers for business.
                this._leftImage.disableInteractive();
                this._rightImage.disableInteractive();
                // Which hand is the player's?
                this._playerIsLeft = (this._leftSpot.Amount > 0);
                for (let index = 0; index < this._lastWagerAmounts.length; index += 1) {
                    this._bettingSpots[index].IsLocked = true;
                    this._lastWagerAmounts[index] = this._bettingSpots[index].Amount;
                }
                // TODO: load up game starting animations, ending with change to first decision.
                this._stepList.push(Steps.DeliverToPlayer);
                this._stepList.push(Steps.UpdatePlayerScore);
                this._stepList.push(Steps.ChangeStateFirstInput);
                // and now, if you please, we'll proceed
                this.doAnimation();
                break;
            }
            case GameState.FirstInput: {
                for (let thisButton of this._mainPanel)
                    thisButton.visible = true;
                this.Instructions = "The stars indicate how strong (9) or weak (0) the monster is. The team’s power ranking is added together. You can stay or add one more monster.";
                break;
            }
            case GameState.GameOver: {
                for (let thisButton of this._newRebetButtonPanel)
                    thisButton.visible = true;
                this.Instructions = StringTable.GameOver;
                if (this._scoreboardData.push([this._leftScore, this._rightScore]) > this.ScoreboardSize) {
                    this._scoreboardData.shift();
                }
                this.clearGameObjectArray(this._dotScoreboard);
                for (let x = 0; x < this._scoreboardData.length; x += 1) {
                    let thisData = this._scoreboardData[x];
                    if (thisData[0] > thisData[1]) {
                        let thisDot = this.add.image(this.LeftScoreboardAnchor.x, this.LeftScoreboardAnchor.y + (x * this.DotScoreboardGap), "eeDot");
                        thisDot.setOrigin(0.5, 0.5);
                        this._dotScoreboard.push(thisDot);
                    }
                    else {
                        let thisDot = this.add.image(this.LeftScoreboardAnchor.x + 95, this.LeftScoreboardAnchor.y + (x * this.DotScoreboardGap), "vvDot");
                        thisDot.setOrigin(0.5, 0.5);
                        this._dotScoreboard.push(thisDot);
                    }
                }
                break;
            }
            case GameState.Continue: {
                this.clearGameObjectArray(this._totalScoreboard);
                if (this._leftScore == 9) {
                    this.Instructions = "There is a 9-9 tie! A Legendary Conquest has been initiated. Just like a Showdown, but you either get a 2:1 bonus or you push.";
                    this._rightSign.setFrame(2);
                }
                else {
                    let scoreStr = this._leftScore.toString();
                    this.Instructions = "There is a " + scoreStr + "-" + scoreStr + " tie! A Showdown has been activated. Both teams will wipe their slate clean and draw one gladiator. The highest ranking card wins.";
                    this._rightSign.setFrame(1);
                }
                this._continueButton.visible = true;
                break;
            }
            default: {
                console.debug("StateID " + this.CurrentState.toString() + " not handled in updateControls()");
                break;
            }
        }
    }
    //#endregion
    //#region Event Handlers
    addSelectedValue(target) {
        if (this._cursorValue > 0) {
            if (target == this._leftImage) {
                this.playClick();
                this._leftSpot.Amount += this._cursorValue;
                this._leftSpot.Amount = Math.min(this._leftSpot.Amount, this._leftSpot.MaximumBet);
                this._rightSpot.Amount = 0;
            }
            else if (target == this._rightImage) {
                this.playClick();
                this._rightSpot.Amount += this._cursorValue;
                this._rightSpot.Amount = Math.min(this._rightSpot.Amount, this._rightSpot.MaximumBet);
                this._leftSpot.Amount = 0;
            }
            // let targetSpot = (target.parentContainer as BettingSpot);
            // let newValue = Math.min(targetSpot.Amount + this._cursorValue, targetSpot.MaximumBet);
            // this.playClick();
            // targetSpot.Amount = newValue;
            // if (targetSpot == this._leftSpot) {
            // 	this._rightSpot.Amount = 0
            // } else if (targetSpot == this._rightSpot) {
            // 	this._leftSpot.Amount = 0
            // }
        }
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
    continueButton() {
        this._continueButton.visible = false;
        this.playClick();
        this.Instructions = "";
        this.doAnimation();
    }
    showHelpScreen() {
        this.playClick();
        this.scene.switch("HelpScene");
    }
    hitPlayerHand() {
        this.playClick();
        this.Instructions = "";
        for (let thisButton of this._mainPanel)
            thisButton.visible = false;
        this._stepList.push(Steps.ThirdToPlayer);
        this._stepList.push(Steps.UpdatePlayerScore);
        this._stepList.push(Steps.DeliverToDealer);
        this._stepList.push(Steps.CheckForDealerThird);
        this.doAnimation();
    }
    standPlayerHand() {
        this.playClick();
        this.Instructions = "";
        for (let thisButton of this._mainPanel)
            thisButton.visible = false;
        this._stepList.push(Steps.DeliverToDealer);
        this._stepList.push(Steps.CheckForDealerThird);
        this.doAnimation();
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
        while (this._helpField.height > 100) {
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
        this._pageNumber = 1;
    }
    create() {
        this.input.on('gameobjectup', function (_, gameObject) {
            gameObject.emit('clicked', gameObject);
        }, this);
        let feltGraphic = this.add.image(0, 0, "blankGameFelt");
        feltGraphic.setOrigin(0, 0);
        let button = new Button({
            scene: this,
            style: AssetNames.BlueSmall,
            caption: "GO BACK",
            clickEvent: Emissions.ReturnToGame,
            x: 1790,
            y: 1030,
            visible: true
        });
        button.scale = 1.8;
        this.add.existing(button);
        Config.emitter.on(Emissions.ReturnToGame, this.returnToGame, this);
        this._helpText = this.add.text(50, 50, "");
        this._helpText.setWordWrapWidth(1870);
        this._helpText.setStyle(Config.gameOptions.helpScreenFormat);
        this.updateTextWithPage(1);
    }
    updateTextWithPage(pageNumber) {
        switch (pageNumber) {
            case 1: {
                let helpText = " * Introduction\n";
                helpText += "Get ready for the fight of the century! Witness an epic struggle between your favorite monsters as they battle to the death. If your team wins the Legendary Conquest, you’ll snag a sweet bonus! With a house edge of only 2.04%, your odds of success are hauntingly hopeful.\n";
                helpText += "\n";
                helpText += " * How to Play the Game\n";
                helpText += "The player will place their initial mandatory wager on the team they think is going to win, whether that is the Evil Empire or the Vile Vanguard. The player will be dealt 2 cards. Each card will have a monster on it with their power ranking. The number of stars the monster has indicates how strong or weak it is, with 0 being the weakest and 9 being the strongest. Predictably, these high-ranked villains brought their low-ranked minions with them.\n";
                helpText += "\n";
                helpText += "Some teams work well together and produce an overall high-power ranking. While other teams are stepping on each other’s toes and getting in the way, therefore producing an overall low-power ranking. To find out the overall ranking of a team, add the power ranking of each monster together and then drop the 10’s place value. For example, if one monster has 8 stars and the other monster has 7 stars:  8 + 7 = 15. Drop the 10’s place value and the overall power ranking for that team is 5. The team with the highest overall power ranking wins, with 9 being the highest and 0 being the lowest.\n";
                helpText += "\n";
                helpText += "After the player looks at their initial 2 cards, they will decide if they want to hit another card and add a 3rd monster to their team or if they want to stay with the 2 monsters they have.\n";
                helpText += "\n";
                helpText += " * Optimal Player Strategy\n";
                helpText += "Here are the suggested guidelines for optimal play:\n";
                helpText += ">> If your overall power ranking is 0-5, hit and take a third card.\n";
                helpText += ">> If your overall power ranking is 6-9, stay with your original two cards.\n";
                helpText += "\n";
                helpText += " * How to Win\n";
                helpText += "After the player has finished making their decision, the opposing team will be dealt 2 cards. If the overall power ranking of the first 2 cards is higher than the players, they will stay and win the round. The player will lose, and their wager taken. If the opposing team’s overall power ranking is lower, they will hit a 3rd card. If the player’s team has the higher overall power ranking, they will win even money or 1:1. Then a new round will begin.\n";
                helpText += "\n";
                helpText += " * Ties\n";
                helpText += "After the opposing team draws two cards, if the total score is tied at 4 or less, the opposing team will take a 3rd card. The team with the higher score wins. If the score is tied at 5 or higher, the opposing team will stay and keep their current cards. At this point, if the score is still tied, a Showdown is activated.\n";
                helpText += "\n";
                helpText += " * Showdown\n";
                helpText += "Once a Showdown has been initiated, discard the original cards, allowing both teams to wipe their slate clean. Each team draws one card, and the highest-ranked card wins. If there is a tie, repeat this process.\n";
                helpText += "\n";
                helpText += " * Legendary Conquest\n";
                helpText += "When two monsters tie with a power ranking of 9, this sparks a Legendary Conquest. Just like in a Showdown, all cards are discarded, and each team draws one card. The higher card wins. The difference is, if the player wins, they will receive a 2:1 bonus. If the player loses, their wager will push..\n";
                this._helpText.text = helpText;
                break;
            }
            default: {
                this._helpText.text = "Page #" + pageNumber.toString() + " not handled in help screen.";
            }
        }
    }
    returnToGame() {
        this.sound.play("chipClick");
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
            "./assets/sounds.ChipClick.ogg"
        ]);
        //#endregion
        //#region Load graphics
        this.load.image("gameFelt", "assets/images/Game Felt 1920x1080.png");
        this.load.image("blankGameFelt", "assets/images/Blank Game Felt 1920x1080.png");
        this.load.image("blueText", "assets/images/Blue Text 130x50.png");
        this.load.image("grayTextSmall", "assets/images/Gray Text 345x50.png");
        this.load.image("grayTextLarge", "assets/images/Gray Text 430x50.png");
        this.load.image("dropPixel", "assets/images/Drop Shape Pixel.jpg");
        this.load.image("left spot", "assets/images/Left Bet.png");
        this.load.image("right spot", "assets/images/Right Bet.png");
        this.load.image("scoreboard", "assets/images/Scoreboard.png");
        this.load.image("eeDot", "assets/images/EE Dot.png");
        this.load.image("vvDot", "assets/images/VV Dot.png");
        this.load.spritesheet("sign", "assets/images/Signage.png", {
            frameWidth: 334,
            frameHeight: 1022
        });
        this.load.spritesheet("card", "assets/images/Monster Cards.jpg", {
            frameWidth: Config.gameOptions.cardWidth,
            frameHeight: Config.gameOptions.cardHeight
        });
        this.load.spritesheet("chip", "assets/images/Chips.png", {
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
                dummyChip.setTint(0xFFFFFF);
                dummyChip.setAlpha(0);
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
    set HitZone(value) { this._hitZone = value; }
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
CardTarget.Player = 0;
CardTarget.Dealer = 1;
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
Emissions.HowToPlay = "How To Play";
Emissions.ShowPaytables = "Show Paytables";
Emissions.ReturnToGame = "Return to game";
Emissions.Yes = "Yes";
Emissions.No = "Nah";
Emissions.Hit = "HIT";
Emissions.Stand = "Stand";
Emissions.Continue = "Continue";
class GameState {
}
// Basic states
GameState.Predeal = 0;
GameState.StartDeal = 1;
GameState.FirstInput = 2;
GameState.Continue = 3;
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
            // No Card Backs in this game.
            // this.setFrame(this.CardBackFrame);
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
Steps.ChangeStateFirstInput = "CHANGE STATE: First input";
Steps.ChangeStateGameOver = "CHANGE STATE: Game Over";
Steps.DeliverToPlayer = "Deliver to player";
Steps.DeliverToDealer = "Deliver to dealer";
Steps.FlipPlayer = "Flip player hand";
Steps.SortPlayer = "Sort player hand";
Steps.FoldAnte = "Fold Ante";
Steps.ResolvePlayerWager = "Resolve Player Wager";
Steps.FlipDealer = "Flip Dealer";
Steps.SortDealer = "Sort Dealer";
Steps.ResolveAnte = "Resolve Ante Wager";
Steps.ResolvePlay = "Resolve Play Wager";
Steps.ThirdToPlayer = "Third To Player";
Steps.ThirdToDealer = "Thild To Dealer";
Steps.CheckForDealerThird = "Check For Dealer Third";
Steps.CheckForTie = "Check For Tie";
Steps.ChangeStateContinue = "CHANGE STATE: Continue";
Steps.ClearCards = "Clear Cards";
Steps.ClearHands = "Clear Hands";
Steps.DeliverSingleCards = "Deliver Single Cards";
Steps.UpdatePlayerScore = "Update Player Score";
Steps.UpdateDealerScore = "Update Dealer Score";
class StringTable {
}
// Basic strings
StringTable.PredealInstructions = "Click on the chip you want to bet. Place it on the team you think is going to win. Click DEAL to begin.";
StringTable.Instructions = "Click 'PLAY' to play the hand and make a 1x Play wager; otherwise, click 'FOLD'";
StringTable.GameOver = "The team with the highest power ranking wins. Click “Rebet” to make the same wager or “New” to make a new wager.";
//# sourceMappingURL=index.js.map