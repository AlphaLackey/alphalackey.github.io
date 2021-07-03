"use strict";
class CardTarget {
}
CardTarget.Player = 0;
CardTarget.Dealer = 1;
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
    // //#endregion
    constructor() {
        super("GameScene");
        //#region Constants
        this.PlayerHandAnchor = new Point(240, 370);
        this.DealerHandAnchor = new Point(240, 75);
        this.AntePayoffOffset = new Point(-34, -37);
        this.PlayPayoffOffset = new Point(34, -37);
        this.BonusPayoffOffset = new Point(-34, -37);
        this.PlayerCardGap = new Point(90, 0);
        this.DealerCardGap = new Point(90, 0);
        this.TargetFontInstructionSize = 22;
        this.FlushLength = [
            "N/A",
            "N/A",
            "two card flush",
            "three card flush",
            "four card flush",
            "five card flush",
            "six card flush",
            "seven card flush"
        ];
        this.SuitNames = [
            "Wands",
            "Coins",
            "Cups",
            "Swords",
            "Major"
        ];
        this.BonusPayouts = [
            3, 10, 50, 1000,
            3, 5, 25, 500
        ];
        this.PlayPayoutForMajor = [
            1, 1, 1, 1, 2, 3, 10, 200
        ];
        this.MinorSuitRanks = "23456789TJNQKA";
        this.CommentaryAnchor = new Point(10, 160);
        this.CommentarySpacing = 30;
        this.NumberOfDecks = 1;
        //#endregion
        // //#region Hand information
        this._playerAnchor = new Point();
        this._playerHand = new Array(0);
        this._playerResult = new Array(0);
        this._dealerAnchor = new Point();
        this._dealerHand = new Array(0);
        this._dealerResult = new Array(0);
        this._dealerQualified = false;
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
        // private _antePayout = 0;
        // private _playerPayout = 0;
        // private _dealerPayout = 0;
        // private _optimalPlay = 0;
        // private _optimalAnnotation = "";
        // private _doubleCheck = false;
        // //#endregion
        // //#region Test hands
        this._testDealerHand = []; //General.cardStringToVector("6H 3D");
        this._testPlayerHand = []; //General.cardStringToVector("5H 6D");
    }
    create() {
        // Add the game felt.
        let feltGraphic = this.add.image(0, 0, "gameFelt");
        feltGraphic.setOrigin(0, 0);
        // Creates the shoe object
        let cardRanks = new Array(78);
        for (let rank = 0; rank < 78; rank += 1)
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
            x: 440,
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
            x: 583,
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
            x: 440,
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
            x: 583,
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
            x: 583,
            y: 665,
            visible: false
        });
        this.add.existing(this._playButton);
        Config.emitter.on(Emissions.MakePlayWager, this.playHand, this);
        this._foldButton = new Button({
            scene: this,
            style: AssetNames.RedSmall,
            caption: "FOLD",
            clickEvent: Emissions.Fold,
            x: 440,
            y: 665,
            visible: false
        });
        this.add.existing(this._foldButton);
        Config.emitter.on(Emissions.Fold, this.foldHand, this);
        this._mainPanel = [
            this._playButton,
            this._foldButton
        ];
        //#endregion
        //#endregion
        let spotAnchor;
        graphics.lineStyle(5, 0xffffff, 1);
        //#region Ante spot
        spotAnchor = new Point(540 - 50, 591);
        graphics.lineStyle(5, 0xffffff, 1);
        graphics.strokeCircle(spotAnchor.x - 28, spotAnchor.y - 26, 40);
        // graphics.beginPath();
        // graphics.moveTo(spotAnchor.x - 27, spotAnchor.y - 68);
        // graphics.lineTo(spotAnchor.x + 16, spotAnchor.y - 25);
        // graphics.lineTo(spotAnchor.x - 27, spotAnchor.y + 18);
        // graphics.lineTo(spotAnchor.x - 70, spotAnchor.y - 25);
        // graphics.closePath();
        // graphics.strokePath();
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
        spotAnchor = new Point(540 + 50, 591);
        graphics.lineStyle(5, 0xffffff, 1);
        graphics.strokeCircle(spotAnchor.x - 28, spotAnchor.y - 26, 40);
        // graphics.fillStyle(0x000000);
        // graphics.beginPath();
        // graphics.moveTo(spotAnchor.x - 27, spotAnchor.y - 68);
        // graphics.lineTo(spotAnchor.x + 16, spotAnchor.y - 25);
        // graphics.lineTo(spotAnchor.x - 27, spotAnchor.y + 18);
        // graphics.lineTo(spotAnchor.x - 70, spotAnchor.y - 25);
        // graphics.closePath();
        // graphics.fillPath()
        // graphics.strokePath();
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
        //#region Bonus spot
        // spotAnchor = new Point(540, 475);
        spotAnchor = new Point(340, 591);
        // graphics.fillStyle(0x000000);
        // graphics.fillCircle(spotAnchor.x - 28, spotAnchor.y - 26, 40);
        graphics.lineStyle(5, 0xffffff, 1);
        graphics.strokeCircle(spotAnchor.x - 28, spotAnchor.y - 26, 40);
        let playerHiLoLabel = this.add.text(spotAnchor.x - 68, spotAnchor.y + 25, "BONUS");
        playerHiLoLabel.setFixedSize(80, 32);
        playerHiLoLabel.setStyle(Config.gameOptions.feltFormat);
        this._bonusSpot = new BettingSpot({
            scene: this,
            x: spotAnchor.x,
            y: spotAnchor.y,
            amount: 0,
            isOptional: true,
            isLocked: false,
            isPlayerSpot: true,
            minimumBet: 1,
            maximumBet: 100,
            payoffOffset: this.BonusPayoffOffset
        });
        this._bonusSpot.HitZone.on("clicked", this.addSelectedValue, this);
        this.add.existing(this._bonusSpot);
        //#endregion
        this._bettingSpots = [
            this._anteSpot,
            this._playSpot,
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
            case Steps.ChangeStatePlayDecision:
                this.CurrentState = GameState.Decision;
                break;
            case Steps.ChangeStateGameOver: {
                this.CurrentState = GameState.GameOver;
                break;
            }
            case Steps.CardToPlayer: {
                this.deliverCard(CardTarget.Player);
                break;
            }
            case Steps.CardToDealer: {
                this.deliverCard(CardTarget.Dealer);
                break;
            }
            case Steps.SortPlayerHand: {
                this.sortPlayerHand();
                break;
            }
            case Steps.SortDealerHand: {
                this.sortDealerHand();
                break;
            }
            case Steps.EvaluateHands: {
                for (let card of this._playerHand) {
                    console.debug(card.CardNumber);
                }
                this._playerResult = this.findBestHand(this._playerHand);
                this._dealerResult = this.findBestHand(this._dealerHand);
                this._dealerQualified = (this._dealerResult.length >= 4); // Remmeber, first field is suit!
                if (this._dealerQualified) {
                }
                console.debug(this._playerResult);
                this.doAnimation();
                break;
            }
            case Steps.HighlightDealerHand: {
                this.highlightHand(CardTarget.Dealer);
                break;
            }
            case Steps.HighlightPlayerHand: {
                this.highlightHand(CardTarget.Player);
                break;
            }
            case Steps.AnnotatePlayerHand: {
                let commentaryString = "Player has " + this.FlushLength[this._playerResult.length - 1];
                commentaryString += " (";
                commentaryString += this.SuitNames[this._playerResult[0]] + " suit, ";
                if (this._playerResult[0] == 4) {
                    commentaryString += this._playerResult[1].toString();
                    for (let x = 2; x < this._playerResult.length; x += 1) {
                        commentaryString += "-" + this._playerResult[x].toString();
                    }
                }
                else {
                    commentaryString += this.MinorSuitRanks.substr(this._playerResult[1], 1);
                    for (let x = 2; x < this._playerResult.length; x += 1) {
                        commentaryString += "-" + this.MinorSuitRanks.substr(this._playerResult[x], 1);
                    }
                }
                commentaryString += ")";
                this.addCommentaryField(commentaryString);
                this.doAnimation();
                break;
            }
            case Steps.AnnotateDealerHand: {
                let commentaryString = "Dealer has " + this.FlushLength[this._dealerResult.length - 1];
                commentaryString += " (";
                commentaryString += this.SuitNames[this._dealerResult[0]] + " suit, ";
                if (this._dealerResult[0] == 4) {
                    commentaryString += this._dealerResult[1].toString();
                    for (let x = 2; x < this._dealerResult.length; x += 1) {
                        commentaryString += "-" + this._dealerResult[x].toString();
                    }
                }
                else {
                    commentaryString += this.MinorSuitRanks.substr(this._dealerResult[1], 1);
                    for (let x = 2; x < this._dealerResult.length; x += 1) {
                        commentaryString += "-" + this.MinorSuitRanks.substr(this._dealerResult[x], 1);
                    }
                }
                commentaryString += ")";
                commentaryString += (this._dealerQualified ? " and qualifies" : " and does NOT qualify");
                this.addCommentaryField(commentaryString);
                this.doAnimation();
                break;
            }
            case Steps.FoldHand: {
                this.resolvePayout(this._anteSpot, -1, false, true);
                break;
            }
            case Steps.ResolveBonus: {
                if (this._bonusSpot.Amount > 0) {
                    let commentaryString = "";
                    let flushLength = this._playerResult.length - 1;
                    let flushSuit = this._playerResult[0];
                    let payout = -1;
                    if (flushLength < 4) {
                        commentaryString = "Bonus wager loses";
                    }
                    else {
                        let result = flushLength - 4;
                        if (flushSuit != 4)
                            result += 4;
                        payout = this.BonusPayouts[result];
                        commentaryString = "Bonus wager wins " + Math.floor(payout).toString() + ":1 (";
                        commentaryString += this.FlushLength[flushLength];
                        if (flushSuit == 4) {
                            commentaryString += ", Major suit)";
                        }
                        else {
                            commentaryString += ", minor suit)";
                        }
                    }
                    this.addCommentaryField(commentaryString);
                    this.resolvePayout(this._bonusSpot, payout, true, true);
                }
                else {
                    this.doAnimation();
                }
                break;
            }
            case Steps.ResolveAnte: {
                if (this._dealerQualified) {
                    let result = this.compareLeftToRight(this._playerResult, this._dealerResult);
                    let reason = this.annotatePlayerVersusDealer(this._playerResult, this._dealerResult);
                    if (result == 1) {
                        this.addCommentaryField("Player beats dealer (" + reason + ")");
                        this.addCommentaryField("Ante pays 1:1");
                        this.resolvePayout(this._anteSpot, 1, true, true);
                    }
                    else if (result == -1) {
                        this.addCommentaryField("Dealer beats player (" + reason + ")");
                        this.addCommentaryField("Ante loses.");
                        this.resolvePayout(this._anteSpot, -1, true, true);
                    }
                    else {
                        this.addCommentaryField("Hands are tied (" + reason + ")");
                        this.addCommentaryField("Ante pushes");
                        this.doAnimation();
                    }
                }
                else {
                    this.addCommentaryField("Ante pays 1:1");
                    this.resolvePayout(this._anteSpot, 1, true, true);
                }
                break;
            }
            case Steps.ResolvePlay: {
                if (this._dealerQualified) {
                    let result = this.compareLeftToRight(this._playerResult, this._dealerResult);
                    if (result == 1) {
                        let playPayout = 1;
                        if (this._playerResult[0] == 4)
                            playPayout = this.PlayPayoutForMajor[this._playerResult.length - 1];
                        if (playPayout == 1) {
                            this.addCommentaryField("Play pays 1:1");
                            this.resolvePayout(this._playSpot, 1, true, true);
                        }
                        else {
                            this.addCommentaryField("Major flush bonus!  Play pays " + playPayout.toString() + ":1");
                            this.resolvePayout(this._playSpot, playPayout, true, true);
                        }
                    }
                    else if (result == -1) {
                        this.addCommentaryField("Play loses");
                        this.resolvePayout(this._playSpot, -1, true, true);
                    }
                    else {
                        this.addCommentaryField("Play pushes");
                        this.doAnimation();
                    }
                }
                else {
                    this.addCommentaryField("Play pushes");
                    this.doAnimation();
                }
                break;
            }
            case Steps.FlipDealerHand: {
                this.flipHand(CardTarget.Dealer);
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
    cardNumberToRankAndSuit(cardNumber) {
        let suit = -1;
        let rank = -1;
        if (cardNumber >= 56) {
            rank = cardNumber - 56;
            suit = 4;
        }
        else {
            suit = Math.floor(cardNumber / 14);
            rank = cardNumber % 14;
        }
        return [rank, suit];
    }
    annotatePlayerVersusDealer(player, dealer) {
        if (player.length > dealer.length)
            return "player has larger flush";
        if (player.length < dealer.length)
            return "dealer has larger flush";
        if (player[0] == 4 && dealer[0] != 4)
            return "player has major suit, dealer does not";
        if (player[0] != 4 && dealer[0] == 4)
            return "dealer has major suit, player does not";
        for (let index = 1; index < player.length; index += 1) {
            if (player[index] > dealer[index])
                return "player flush has higher card";
            if (player[index] < dealer[index])
                return "dealer flush has higher card";
        }
        return "player and dealer have same minor flush";
    }
    compareLeftToRight(left, right) {
        if (left.length > right.length)
            return 1;
        if (left.length < right.length)
            return -1;
        if (left[0] == 4 && right[0] != 4)
            return 1;
        if (left[0] != 4 && right[0] == 4)
            return -1;
        for (let index = 1; index < left.length; index += 1) {
            if (left[index] > right[index])
                return 1;
            if (left[index] < right[index])
                return -1;
        }
        return 0;
    }
    highlightHand(target) {
        let targetHand = (target == CardTarget.Player ? this._playerHand : this._dealerHand);
        let targetResult = (target == CardTarget.Player ? this._playerResult : this._dealerResult);
        for (let index = 0; index < 7; index += 1) {
            let cardData = this.cardNumberToRankAndSuit(targetHand[index].CardNumber);
            if (cardData[1] == targetResult[0]) {
                // It's the right suit
                this.tweens.add({
                    targets: targetHand[index],
                    duration: 100,
                    delay: index * 100,
                    y: (targetHand[index].y - 15),
                    ease: Phaser.Math.Easing.Expo.Out,
                    onComplete: (index == 6 ? this.doAnimation : null),
                    onCompleteScope: this
                });
            }
            else {
                // Not the right suit
                this.tweens.add({
                    targets: targetHand[index],
                    duration: 100,
                    delay: index * 100,
                    rotation: 0.1,
                    ease: Phaser.Math.Easing.Expo.Out,
                    onComplete: (index == 6 ? this.doAnimation : null),
                    onCompleteScope: this
                });
            }
        }
    }
    findBestHand(cards) {
        let suitCounts = Array(5);
        for (let suit = 0; suit < 5; suit += 1) {
            suitCounts[suit] = Array(0);
        }
        for (let card of cards) {
            let cardData = this.cardNumberToRankAndSuit(card.CardNumber);
            suitCounts[cardData[1]].push(cardData[0]);
        }
        let bestSuit = 0;
        suitCounts[0].sort((a, b) => b - a);
        suitCounts[0] = [0].concat(suitCounts[0]);
        for (let suit = 1; suit < 5; suit += 1) {
            suitCounts[suit].sort((a, b) => b - a);
            suitCounts[suit] = [suit].concat(suitCounts[suit]);
            if (this.compareLeftToRight(suitCounts[suit], suitCounts[bestSuit]) == 1)
                bestSuit = suit;
        }
        let output = suitCounts[bestSuit];
        return output;
    }
    addCommentaryField(fieldText) {
        let newCommentary = this.add.text(this.CommentaryAnchor.x, (this._commentaryList.length * this.CommentarySpacing) + this.CommentaryAnchor.y, fieldText, Config.gameOptions.commentaryFormat);
        this._commentaryList.push(newCommentary);
    }
    // calculateTotal(holeCards: Array<PlayingCard>): number {
    // 	let peakHand = -1;
    // 	let cards = [
    // 		holeCards[0].CardNumber,
    // 		holeCards[1].CardNumber,
    // 		this._boardHand[0].CardNumber,
    // 		this._boardHand[1].CardNumber,
    // 	];
    // 	peakHand = Math.max(peakHand, ThreeCardEvaluator.cardVectorToHandNumber([cards[0], cards[1], cards[2]], false));
    // 	peakHand = Math.max(peakHand, ThreeCardEvaluator.cardVectorToHandNumber([cards[0], cards[1], cards[3]], false));
    // 	peakHand = Math.max(peakHand, ThreeCardEvaluator.cardVectorToHandNumber([cards[0], cards[2], cards[3]], false));
    // 	peakHand = Math.max(peakHand, ThreeCardEvaluator.cardVectorToHandNumber([cards[1], cards[2], cards[3]], false));
    // 	return peakHand;
    // }
    updateLocation(location, isPlayer, isBackwards = false) {
        if (isPlayer) {
            // Is for player
            location.x += (this.PlayerCardGap.x * (isBackwards ? -1 : 1));
            location.y += (this.PlayerCardGap.y * (isBackwards ? -1 : 1));
        }
        else {
            // Is for dealer
            location.x += (this.DealerCardGap.x * (isBackwards ? -1 : 1));
            location.y += (this.DealerCardGap.y * (isBackwards ? -1 : 1));
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
        this.clearGameObjectArray(this._payoutList);
        this.clearGameObjectArray(this._commentaryList);
        // Reset hand values
        this._playerResult = [];
        this._dealerResult = [];
        // Reset anchors, if needed:
        this._playerAnchor.setTo(this.PlayerHandAnchor.x, this.PlayerHandAnchor.y);
        this._dealerAnchor.setTo(this.DealerHandAnchor.x, this.DealerHandAnchor.y);
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
    flipHand(target) {
        let tweenDurations = [200, 200, 200, 200, 200, 200];
        let tweenDelays = Array(tweenDurations.length);
        let total = 0;
        for (let x = 0; x < tweenDurations.length; x += 1) {
            tweenDelays[x] = total;
            total += tweenDurations[x];
        }
        let cardDelay = 200;
        let handTarget;
        if (target == CardTarget.Dealer) {
            handTarget = this._dealerHand;
        }
        else {
            console.debug("invalid target ", target, " in flip hand");
            return;
        }
        for (let x = 0; x < handTarget.length; x += 1) {
            let tweenTarget = handTarget[x];
            this.add.tween({
                targets: tweenTarget,
                delay: (cardDelay * x),
                duration: tweenDurations[0],
                x: "-=30"
            });
            this.add.tween({
                targets: tweenTarget,
                delay: (cardDelay * x) + tweenDurations[0],
                duration: tweenDurations[1],
                scaleX: 0,
                scaleY: 1.2,
                onComplete: () => {
                    tweenTarget.IsFaceUp = true;
                }
            });
            this.add.tween({
                targets: tweenTarget,
                delay: (cardDelay * x) + tweenDurations[0] + tweenDurations[1],
                duration: tweenDurations[2],
                scaleX: 1.0,
                scaleY: 1.0,
                onComplete: (x == 6 ? this.doAnimation : null),
                onCompleteScope: (x == 6 ? this : null)
            });
        }
        // this.add.tween({
        // 	targets: handTarget[0],
        // 	delay: tweenDelays[2],
        // 	duration: tweenDurations[2],
        // 	scaleX: 1.0,
        // 	scaleY: 1.0
        // });
        // this.add.tween({
        // 	targets: handTarget[1],
        // 	delay: tweenDelays[3],
        // 	duration: tweenDurations[3],
        // 	x: "-=30",
        // });
        // this.add.tween({
        // 	targets: handTarget[1],
        // 	delay: tweenDelays[4],
        // 	duration: tweenDurations[4],
        // 	scaleX: 0,
        // 	scaleY: 1.2,
        // 	onComplete: () => {
        // 		handTarget[1].IsFaceUp = true;
        // 	}
        // });
        // this.add.tween({
        // 	targets: handTarget[1],
        // 	delay: tweenDelays[5],
        // 	duration: tweenDurations[5],
        // 	scaleX: 1.0,
        // 	scaleY: 1.0,
        // 	onComplete: this.doAnimation,
        // 	onCompleteScope: this
        // });
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
                duration: 200,
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
                duration: 200,
                x: this._dealerAnchor.x,
                y: this._dealerAnchor.y,
                ease: Phaser.Math.Easing.Expo.Out,
                onComplete: this.doAnimation,
                onCompleteScope: this
            });
            this.updateLocation(this._dealerAnchor, false);
        }
    }
    sortDealerHand() {
        this._dealerHand.sort((a, b) => {
            let aData = this.cardNumberToRankAndSuit(a.CardNumber);
            let bData = this.cardNumberToRankAndSuit(b.CardNumber);
            if (aData[1] > bData[1])
                return 1;
            if (aData[1] < bData[1])
                return -1;
            if (aData[0] < bData[0])
                return 1;
            if (aData[0] > bData[0])
                return -1;
            return 0;
        });
        let destinationY = this.DealerHandAnchor.y + 10;
        for (let index = 0; index < 7; index += 1) {
            this.tweens.add({
                delay: index * 50,
                targets: this._dealerHand[index],
                x: this.DealerHandAnchor.x + (this.DealerCardGap.x * index),
                y: destinationY,
                ease: Phaser.Math.Easing.Expo.Out,
                onComplete: (index == 6 ? this.doAnimation : null),
                onCompleteScope: this
            });
        }
    }
    sortPlayerHand() {
        this._playerHand.sort((a, b) => {
            let aData = this.cardNumberToRankAndSuit(a.CardNumber);
            let bData = this.cardNumberToRankAndSuit(b.CardNumber);
            if (aData[1] > bData[1])
                return 1;
            if (aData[1] < bData[1])
                return -1;
            if (aData[0] < bData[0])
                return 1;
            if (aData[0] > bData[0])
                return -1;
            return 0;
        });
        let destinationY = this.PlayerHandAnchor.y + 80;
        for (let index = 0; index < 7; index += 1) {
            this.tweens.add({
                delay: index * 50,
                targets: this._playerHand[index],
                x: this.PlayerHandAnchor.x + (this.PlayerCardGap.x * index),
                y: destinationY,
                ease: Phaser.Math.Easing.Expo.Out,
                onComplete: (index == 6 ? this.doAnimation : null),
                onCompleteScope: this
            });
        }
    }
    playChipClick() {
        this.sound.play("chipClick");
    }
    playButtonClick() {
        this.sound.play("buttonClick");
    }
    // playChing() {
    // 	this.sound.play("ching");
    // }
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
                // 			// TODO: load up game starting animations, ending with change to first decision.
                this._stepList.push(Steps.CardToDealer);
                this._stepList.push(Steps.CardToDealer);
                this._stepList.push(Steps.CardToDealer);
                this._stepList.push(Steps.CardToDealer);
                this._stepList.push(Steps.CardToDealer);
                this._stepList.push(Steps.CardToDealer);
                this._stepList.push(Steps.CardToDealer);
                this._stepList.push(Steps.CardToPlayer);
                this._stepList.push(Steps.CardToPlayer);
                this._stepList.push(Steps.CardToPlayer);
                this._stepList.push(Steps.CardToPlayer);
                this._stepList.push(Steps.CardToPlayer);
                this._stepList.push(Steps.CardToPlayer);
                this._stepList.push(Steps.CardToPlayer);
                this._stepList.push(Steps.SortPlayerHand);
                this._stepList.push(Steps.EvaluateHands);
                this._stepList.push(Steps.HighlightPlayerHand);
                // 			this._stepList.push(Steps.CardToPlayer);
                // 			this._stepList.push(Steps.CardToDealer);
                // 			this._stepList.push(Steps.CardToDealer);
                // 			this._stepList.push(Steps.CardToBoard);
                // 			this._stepList.push(Steps.CardToBoard);
                // 			this._stepList.push(Steps.CalculateTotals);
                // 			this._stepList.push(Steps.ChangeStateMainInput);
                // TODO: nuke this shortly
                this._stepList.push(Steps.AnnotatePlayerHand);
                this._stepList.push(Steps.ChangeStatePlayDecision);
                // and now, if you please, we'll proceed
                this.doAnimation();
                break;
            }
            case GameState.Decision: {
                for (let thisButton of this._mainPanel) {
                    thisButton.scale = 1.0;
                    thisButton.visible = true;
                }
                this.Instructions = StringTable.Instructions;
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
    // #region Event handlers
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
    // helpScreen() {
    // 	this.playButtonClick();
    // 	this.scene.switch("HelpScene");
    // }
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
    // makePlayWager() {
    // 	if (this._optimalPlay != Strategy.Play && this._doubleCheck) {
    // 		this.playChing();
    // 		this.Instructions = "Best play is: " + this._optimalAnnotation;
    // 		if (this._optimalPlay == Strategy.Play) {
    // 			this._playButton.scale = 1.2;
    // 		} else if (this._optimalPlay == Strategy.Bust) {
    // 			this._bustButton.scale = 1.2;
    // 		}
    // 		this._doubleCheck = false;
    // 	} else {
    // 		this.playButtonClick();
    // 		for (let button of this._mainPanel) button.visible = false;
    // 		this._playSpot.Amount = this._anteSpot.Amount;
    // 		this._stepList.push(Steps.FlipBoardHand);
    // 		this._stepList.push(Steps.AnnotatePlayer);
    // 		if (this._playerHiLoSpot.Amount > 0) {
    // 			this._stepList.push(Steps.ResolvePlayerHiLo);
    // 		}
    // 		this._stepList.push(Steps.FlipDealerHand);
    // 		this._stepList.push(Steps.AnnotateDealer);
    // 		if (this._dealerHiLoSpot.Amount > 0) {
    // 			this._stepList.push(Steps.ResolveDealerHiLo);
    // 		}
    // 		// if (this._tieSpot.Amount > 0) {
    // 		// 	this._stepList.push(Steps.ResolveTie);
    // 		// }
    // 		this._stepList.push(Steps.SetPlayerPayouts);
    // 		this._stepList.push(Steps.ResolveAnteWager);
    // 		this._stepList.push(Steps.ResolvePlayerWager);
    // 		this._stepList.push(Steps.ChangeStateGameOver);
    // 		this.doAnimation();
    // 	}
    // }
    playHand() {
        this.playButtonClick();
        for (let button of this._mainPanel)
            button.visible = false;
        this.Instructions = "";
        this._playSpot.Amount = this._anteSpot.Amount;
        this._stepList.push(Steps.FlipDealerHand);
        this._stepList.push(Steps.SortDealerHand);
        this._stepList.push(Steps.HighlightDealerHand);
        this._stepList.push(Steps.AnnotateDealerHand);
        this._stepList.push(Steps.ResolveBonus);
        this._stepList.push(Steps.ResolveAnte);
        this._stepList.push(Steps.ResolvePlay);
        this._stepList.push(Steps.ChangeStateGameOver);
        this.doAnimation();
    }
    foldHand() {
        this.playButtonClick();
        for (let button of this._mainPanel)
            button.visible = false;
        this.Instructions = "";
        this._stepList.push(Steps.FoldHand);
        if (this._bonusSpot.Amount > 0) {
            this._stepList.push(Steps.ResolveBonus);
        }
        this._stepList.push(Steps.ChangeStateGameOver);
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
        this.load.spritesheet("card", "assets/images/TarotDeck.png", {
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
Emissions.Fold = "Fold";
Emissions.HintPlease = "Hint, please";
Emissions.HelpScreen = "Help Screen";
Emissions.ReturnToGame = "Return to game";
class GameState {
}
GameState.Predeal = 0;
GameState.StartDeal = 1;
GameState.Decision = 2;
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
        super(config.scene, config.x, config.y, "card");
        this.CardBackFrame = 78;
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
Steps.ChangeStatePlayDecision = "Change state: Play decision";
Steps.ChangeStateGameOver = "Change state: Game Over";
Steps.CardToPlayer = "Card To Player";
Steps.CardToDealer = "Card To Dealer";
Steps.SortPlayerHand = "Sort Player Hand";
Steps.EvaluateHands = "Evaluate Hands";
Steps.HighlightPlayerHand = "Highlight Player Hand";
Steps.AnnotatePlayerHand = "Annotate Player Hand";
Steps.FoldHand = "Fold hand";
Steps.ResolveBonus = "Resolve bonus";
Steps.FlipDealerHand = "Flip dealer hand";
Steps.SortDealerHand = "Sort dealer hand";
Steps.HighlightDealerHand = "Highlight Dealer Hand";
Steps.AnnotateDealerHand = "Annotate dealer hand";
Steps.ResolveAnte = "Resolve Ante";
Steps.ResolvePlay = "Resolve Play";
class StringTable {
}
StringTable.PredealInstructions = "Click on chip to select denomination, click on Ante and/or Bonus spots to add chips, click DEAL to begin.";
StringTable.Instructions = "Either FOLD, or make a PLAY wager equal to your ANTE wager";
StringTable.GameOver = "Game over.  Click 'REBET' to play again with same wagers, or click 'NEW' to set new wagers.";
//# sourceMappingURL=index.js.map