"use strict";
class Config {
    static initGame() {
        let gameConfig = {
            width: this.gameOptions.gameWidth,
            height: this.gameOptions.gameHeight,
            backgroundColor: 0x000000,
            parent: 'game-div',
            scene: [LoaderScene, GameScene, HelpScene]
        };
        this.gameReference = new Phaser.Game(gameConfig);
    }
}
Config.emitter = new Phaser.Events.EventEmitter(); //: Phaser.Events.EventEmitter;
Config.gameOptions = {
    gameWidth: 760,
    gameHeight: 1024,
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
        fontStyle: "bold",
        color: "#FFFFFF",
        align: "center"
    },
    helpScreenFormat: {
        fontFamily: "Arial",
        fontSize: "22px",
        color: "#FFFFFF",
        align: "left"
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
        this.GridAnchor = new Point(210, 90);
        this.GridGap = new Point(120, 168);
        this.AwardsByRow = [
            [0.1, 0.2, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            [0.1, 0.2, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            [0.1, 0.2, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            [0.1, 0.2, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            [20, 25, 50, 75, 100, 200, 300, 400, 500],
        ];
        this.AwardWeightsByRow = [
            [1, 2, 2, 3, 2, 2, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 2, 2, 2, 3, 2, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 2, 3, 3, 5, 2, 1],
            [1, 1, 2, 2, 3, 3, 2, 1, 1, 1, 1, 1, 1],
            [18, 20, 20, 25, 61, 60, 30, 20, 10]
        ];
        this.MultiplierWeightsByRow = [
            [10, 6, 4, 1],
            [12, 6, 3, 1],
            [12, 6, 3, 1],
            [12, 6, 3, 1],
            [10, 5, 4, 2]
        ];
        this.OutcomeWeightsByRow = [
            [9, 2, 1],
            [8, 2, 6],
            [10, 1, 5],
            [10, 5, 40],
            [5, 5, 33]
        ];
        this.Multipliers = [
            2, 3, 4, 5
        ];
        //#endregion
        //#region Betting spots
        this._lastWagerAmounts = new Array(0);
        this._chipButtons = new Array(0);
        this._score = 0;
        this._wager = 0;
        this._currentAward = 0;
        // #endregion
        //#region Game lists
        this._stepList = new Array(0);
        this._commentaryList = new Array(0);
        this._payoutList = new Array(0);
        this._gameBoardByRowCol = new Array(5);
        //#endregion
        //#region Other member variables
        this._currentState = -1;
        this._currentLevel = -1;
        //#endregion
        //#region Test hands
        this._testDealerHand = new Array(0);
        this._testPlayerHand = new Array(0);
    }
    create() {
        // If desired, initialize test hands by uncommenting.
        // this._testDealerHand = General.cardStringToVector("AC TS");
        // this._testPlayerHand = General.cardStringToVector("AC 2D 2H 2S KC KD 2H 2S 2C 2D 2H 2S 2C 2D 2H 2S 2C 2D 2H 2S");
        // Add the game felt.
        this._gameFelt = this.add.image(Config.gameOptions.gameWidth / 2, Config.gameOptions.gameHeight / 2, "gameFelt");
        // Turn on listening to input events
        this.input.on('gameobjectup', function (_, gameObject) {
            gameObject.emit('clicked', gameObject);
        }, this);
        for (let index = 0; index < 5; index += 1) {
            this._gameBoardByRowCol[index] = new Array(0);
        }
        //#region Bumper panel graphics
        // create handler to graphics object
        let graphics = this.add.graphics();
        // add the score display
        let scoreBitmap = this.add.image(15, 960, "blueText");
        scoreBitmap.setOrigin(0, 0);
        scoreBitmap.setDisplaySize(130, 50);
        graphics.lineStyle(5, 0xffffff, 1);
        graphics.strokeRoundedRect(15, 960, 130, 50, 5);
        this._scoreField = this.add.text(15, 960, [""]);
        this._scoreField.setFixedSize(130, 50);
        this._scoreField.setPadding(0, 3, 0, 0);
        this._scoreField.setStyle(Config.gameOptions.scoreFormat);
        let wagerBitmap = this.add.image(15, 15, "blueText");
        wagerBitmap.setOrigin(0, 0);
        wagerBitmap.setDisplaySize(130, 50);
        graphics.lineStyle(5, 0xffffff, 1);
        graphics.strokeRoundedRect(15, 15, 130, 50, 5);
        this._wagerField = this.add.text(15, 15, [""]);
        this._wagerField.setFixedSize(130, 50);
        this._wagerField.setPadding(0, 3, 0, 0);
        this._wagerField.setStyle(Config.gameOptions.scoreFormat);
        let awardBitmap = this.add.image(15, 80, "blueText");
        awardBitmap.setOrigin(0, 0);
        wagerBitmap.setDisplaySize(130, 50);
        graphics.lineStyle(5, 0xffffff, 1);
        graphics.strokeRoundedRect(15, 80, 130, 50, 5);
        this._awardfield = this.add.text(15, 80, [""]);
        this._awardfield.setFixedSize(130, 50);
        this._awardfield.setPadding(0, 3, 0, 0);
        this._awardfield.setStyle(Config.gameOptions.scoreFormat);
        // Now, add the help field
        let helpBitmap = this.add.image(440, 960, "grayTextLarge");
        helpBitmap.setOrigin(0, 0);
        helpBitmap.setDisplaySize(304, 50);
        this._helpField = this.add.text(440, 960, [""]);
        this._helpField.setFixedSize(304, 0);
        this._helpField.setPadding(0, 3, 0, 0);
        this._helpField.setStyle(Config.gameOptions.helpFormat);
        this._helpField.setWordWrapWidth(304);
        graphics.lineStyle(6, 0xffffff, 1);
        graphics.strokeRoundedRect(440, 960, 304, 50, 5);
        let chipDenominations = [1, 5, 25, 100];
        for (let index = 0; index < chipDenominations.length; index += 1) {
            let chipButton = new Chip({
                scene: this,
                x: 188 + (index * 70),
                y: 985
            });
            chipButton.Value = chipDenominations[index];
            chipButton.setOrigin(.5, .5);
            chipButton.setInteractive({ useHandCursor: true });
            chipButton.on("clicked", this.selectChip, this);
            this.add.existing(chipButton);
            this._chipButtons.push(chipButton);
        }
        this.selectCursorValue(1);
        this.Award = 0;
        //#endregion
        //#region Button panels
        //#region Clear | Deal panel
        this._clearButton = new Button({
            scene: this,
            style: AssetNames.BlueSmall,
            caption: "CLEAR",
            clickEvent: Emissions.ClearBettingSpots,
            x: 550,
            y: 930,
            visible: false
        });
        this.add.existing(this._clearButton);
        Config.emitter.on(Emissions.ClearBettingSpots, this.clearBettingSpots, this);
        this._dealButton = new Button({
            scene: this,
            style: AssetNames.BlueSmall,
            caption: "DEAL",
            clickEvent: Emissions.BeginDeal,
            x: 687,
            y: 930,
            visible: false
        });
        this.add.existing(this._dealButton);
        Config.emitter.on(Emissions.BeginDeal, this.beginDeal, this);
        this._clearDealPanel = [this._clearButton, this._dealButton];
        //#endregion
        //#region Rules Button
        this._rulesButton = new Button({
            scene: this,
            style: AssetNames.RedSmall,
            caption: "RULES",
            clickEvent: Emissions.ShowRules,
            x: 82,
            y: 930,
            visible: true
        });
        this.add.existing(this._rulesButton);
        Config.emitter.on(Emissions.ShowRules, this.showRules, this);
        //#endregion
        //#region New | Rebet panel
        this._newButton = new Button({
            scene: this,
            style: AssetNames.BlueSmall,
            caption: "NEW",
            clickEvent: Emissions.NewGame,
            x: 550,
            y: 930,
            visible: false
        });
        this.add.existing(this._newButton);
        Config.emitter.on(Emissions.NewGame, this.newBets, this);
        this._rebetButton = new Button({
            scene: this,
            style: AssetNames.GreenSmall,
            caption: "REBET",
            clickEvent: Emissions.RebetBets,
            x: 687,
            y: 930,
            visible: false
        });
        this.add.existing(this._rebetButton);
        Config.emitter.on(Emissions.RebetBets, this.rebetBets, this);
        this._newRebetButtonPanel = [this._newButton, this._rebetButton];
        //#endregion
        //#region Cashout button
        this._cashoutButton = new Button({
            scene: this,
            style: AssetNames.RedSmall,
            caption: "CASHOUT?",
            clickEvent: Emissions.Cashout,
            x: 0,
            y: 0,
            visible: false
        });
        this.add.existing(this._cashoutButton);
        Config.emitter.on(Emissions.Cashout, this.cashout, this);
        //#endregion
        this.Score = 100000;
        this.CurrentState = GameState.Predeal;
        //#endregion
    }
    //#region Animation methods
    addCommentaryField(xLoc, yLoc, fieldText) {
        let newCommentary = this.add.text(xLoc, yLoc, fieldText, Config.gameOptions.commentaryFormat);
        this._commentaryList.push(newCommentary);
        return newCommentary;
    }
    doAnimation() {
        let thisAction = this._stepList.shift();
        switch (thisAction) {
            case Steps.PayPlayer: {
                this.payPlayer();
                break;
            }
            case Steps.AdvanceLine: {
                this._currentLevel += 1;
                this.doAnimation();
                break;
            }
            case Steps.GenerateResult: {
                let outcomeIndex = this.drawFromWeights(this.OutcomeWeightsByRow[this._currentLevel]);
                let outcomeText = [""];
                let curAward = 0;
                if (outcomeIndex == Outcome.Blocker) {
                    curAward = -1;
                    outcomeText = ["ROCK", "Game", "Over"];
                }
                else if (outcomeIndex == Outcome.Award) {
                    let awardIndex = this.drawFromWeights(this.AwardWeightsByRow[this._currentLevel]);
                    curAward = this.AwardsByRow[this._currentLevel][awardIndex];
                    // this._currentAward = this.AwardsByRow[this._currentLevel][awardIndex];
                    outcomeText = ["AWARD", curAward + " units"];
                    curAward *= this._cursorValue;
                    outcomeText.push(General.amountToDollarString(curAward));
                }
                else if (outcomeIndex == Outcome.Multiplier) {
                    let multIndex = this.drawFromWeights(this.MultiplierWeightsByRow[this._currentLevel]);
                    let awardIndex = this.drawFromWeights(this.AwardWeightsByRow[this._currentLevel]);
                    let curMult = this.Multipliers[multIndex];
                    curAward = this.AwardsByRow[this._currentLevel][awardIndex];
                    outcomeText = ["MULT", curMult.toString() + "x " + curAward + " units"];
                    curAward = curMult * curAward * this._cursorValue;
                    outcomeText.push(General.amountToDollarString(curAward));
                }
                let row = Math.floor(this._selectedCard.CardNumber / 5);
                let col = this._selectedCard.CardNumber % 5;
                let commentaryField = this.addCommentaryField(this.GridAnchor.x + (this.GridGap.x * col), this.GridAnchor.y + (this.GridGap.y * row), outcomeText);
                commentaryField.setOrigin(0.5, 0.5);
                if (curAward > 0) {
                    if (this._currentLevel == 4) {
                        this._stepList.push(Steps.PayPlayer);
                        this._stepList.push(Steps.ChangeStateGameOver);
                    }
                    else {
                        this._stepList.push(Steps.AdvanceLine);
                        this._stepList.push(Steps.ChangeStateMainInput);
                    }
                    this.tweens.addCounter({
                        from: this.Award,
                        to: this.Award + curAward,
                        duration: 500,
                        ease: 'linear',
                        onUpdate: tween => {
                            this.Award = tween.getValue();
                        },
                        onComplete: this.doAnimation,
                        onCompleteScope: this
                    });
                }
                else {
                    this._stepList.push(Steps.ChangeStateGameOver);
                    this.tweens.addCounter({
                        from: this.Award,
                        to: 0,
                        duration: 500,
                        ease: 'linear',
                        onUpdate: tween => {
                            this.Award = tween.getValue();
                        },
                        onComplete: this.doAnimation,
                        onCompleteScope: this
                    });
                }
                break;
            }
            case Steps.FlipSelectedCard: {
                this.add.tween({
                    targets: this._selectedCard,
                    duration: 300,
                    scaleX: 0,
                    scaleY: 1.2,
                    onComplete: this.doAnimation,
                    onCompleteScope: this
                });
                break;
            }
            case Steps.DeliverGrid: {
                for (let index = 0; index < 25; index += 1) {
                    let row = Math.floor(index / 5);
                    let col = index % 5;
                    let nextCard = new PlayingCard({
                        scene: this,
                        x: 0,
                        y: 0,
                        cardNumber: index,
                        isFaceUp: false,
                    });
                    nextCard.alpha = 0;
                    nextCard.setOrigin(0.5, 0.5);
                    this.add.existing(nextCard);
                    this._gameBoardByRowCol[row].push(nextCard);
                    nextCard.disableInteractive();
                    nextCard.on("clicked", this.selectCard, this);
                    this.tweens.add({
                        targets: nextCard,
                        duration: 400,
                        delay: (row + col) * 100,
                        alpha: 1,
                        x: this.GridAnchor.x + (this.GridGap.x * col),
                        y: this.GridAnchor.y + (this.GridGap.y * row),
                        ease: Phaser.Math.Easing.Expo.Out,
                        onComplete: (row == 4 && col == 4) ? this.doAnimation : null,
                        onCompleteScope: this
                    });
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
        this.Wager = value * 10;
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
                this.Score -= this.Wager;
                // TODO: load up game starting animations, ending with change to first decision.
                this._stepList.push(Steps.DeliverGrid);
                this._stepList.push(Steps.ChangeStateMainInput);
                // and now, if you please, we'll proceed
                this.doAnimation();
                break;
            }
            case GameState.MainInput: {
                if (this._currentLevel == 0) {
                    this.Instructions = "Select card from row 1";
                }
                else {
                    this.Instructions = "Select card from row " + (this._currentLevel + 1).toString() + "\nor cash out.";
                    this._cashoutButton.x = 75;
                    this._cashoutButton.y = this.GridAnchor.y + (this.GridGap.y * this._currentLevel);
                    this._cashoutButton.visible = true;
                }
                for (let card of this._gameBoardByRowCol[this._currentLevel]) {
                    card.setInteractive({ useHandCursor: true });
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
    beginDeal() {
        this.playClick();
        this.CurrentState = GameState.StartDeal;
    }
    cashout() {
        this.playClick();
        this._cashoutButton.visible = false;
        this._stepList.push(Steps.ChangeStateGameOver);
        this.payPlayer();
    }
    clearBettingSpots() {
        this.playClick();
    }
    newBets() {
        this.playClick();
        this.CurrentState = GameState.Predeal;
    }
    payPlayer() {
        let startBankroll = this.Score;
        let fullAward = this.Award;
        this.tweens.addCounter({
            from: this.Award,
            to: 0,
            duration: 500,
            ease: 'linear',
            onUpdate: tween => {
                this.Award = tween.getValue();
                this.Score = startBankroll + (fullAward - tween.getValue());
            },
            onComplete: this.doAnimation,
            onCompleteScope: this
        });
    }
    rebetBets() {
        this.playClick();
        this.predealInitialization();
        this.CurrentState = GameState.StartDeal;
    }
    selectChip(target) {
        this.playClick();
        this.selectCursorValue(target.Value);
    }
    selectCard(target) {
        this.playClick();
        for (let card of this._gameBoardByRowCol[this._currentLevel]) {
            card.disableInteractive();
        }
        this.Instructions = "";
        this._cashoutButton.visible = false;
        this._selectedCard = target;
        this._stepList.push(Steps.FlipSelectedCard);
        this._stepList.push(Steps.GenerateResult);
        this.doAnimation();
    }
    showRules() {
        this.playClick();
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
    drawFromWeights(source) {
        let testShoe = new QuantumShoe(source, 1);
        return testShoe.drawCard();
    }
    predealInitialization() {
        this.clearGameObjectArray(this._payoutList);
        this.clearGameObjectArray(this._commentaryList);
        for (let thisRow of this._gameBoardByRowCol) {
            this.clearGameObjectArray(thisRow);
        }
        // Reset game level
        this._currentLevel = 0;
        // Reset current award
        this.Award = 0;
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
    get Wager() { return this._wager; }
    set Wager(value) {
        var _a;
        this._wager = value;
        let descriptors = [
            "WAGER",
            General.amountToDollarString(value)
        ];
        (_a = this._wagerField) === null || _a === void 0 ? void 0 : _a.setText(descriptors);
    }
    get Award() { return this._currentAward; }
    set Award(value) {
        var _a;
        this._currentAward = value;
        let descriptors = [
            "AWARD",
            General.amountToDollarString(value)
        ];
        (_a = this._awardfield) === null || _a === void 0 ? void 0 : _a.setText(descriptors);
    }
}
class HelpScene extends Phaser.Scene {
    constructor() {
        super("HelpScene");
    }
    create() {
        let HelpText = [
            "Digger rules (Coming soon)"
        ];
        this.input.on('gameobjectup', function (_, gameObject) {
            gameObject.emit('clicked', gameObject);
        }, this);
        let feltGraphic = this.add.image(0, 0, "gameFelt");
        feltGraphic.setOrigin(0, 0);
        let button = new Button({
            scene: this,
            style: AssetNames.GreenSmall,
            caption: "GO BACK",
            clickEvent: Emissions.ReturnToGame,
            x: 687,
            y: 995,
            visible: true
        });
        this.add.existing(button);
        Config.emitter.on(Emissions.ReturnToGame, this.returnToGame, this);
        let helpText = this.add.text(50, 50, HelpText);
        helpText.setWordWrapWidth(910);
        helpText.setStyle(Config.gameOptions.helpScreenFormat);
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
            "./assets/sounds/beep-22.mp3",
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
Emissions.ShowRules = "Show Rules";
Emissions.ReturnToGame = "Return To Game";
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
Emissions.Cashout = "Cash out";
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
class Outcome {
}
Outcome.Award = 0;
Outcome.Multiplier = 1;
Outcome.Blocker = 2;
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
// Dealing steps
Steps.FlipSelectedCard = "Flip Card";
Steps.GenerateResult = "Generate Result";
// Digger steps
Steps.DeliverGrid = "Deliver Grid";
Steps.AdvanceLine = "Advance Line";
Steps.PayPlayer = "Pay Player";
class StringTable {
}
// Basic strings
StringTable.PredealInstructions = "Select game denomination.";
StringTable.Instructions = "Choose your play, which will apply to ALL unlocked hands (A hand is locked on hard 17 or more, or on soft 19 or more).";
StringTable.GameOver = "Game over";
// Blackjack strings
StringTable.Insurance = "Would you like insurance?  Yes/No";
//# sourceMappingURL=index.js.map