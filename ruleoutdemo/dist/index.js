"use strict";
class CardTarget {
}
CardTarget.Player = 0;
class Config {
    static initGame() {
        let gameConfig = {
            width: this.gameOptions.gameWidth,
            height: this.gameOptions.gameHeight,
            type: Phaser.AUTO,
            backgroundColor: 0x000000,
            parent: 'game-div',
            scene: [LoaderScene, GameScene],
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
    },
    bannerFormat: {
        fontFamily: "Arial",
        fontSize: "80px",
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
    // #endregion
    // #region 'tors
    constructor() {
        super("GameScene");
        // #region Constants
        this.TargetFontInstructionSize = 22;
        this.CommentaryAnchor = new Point(10, 10);
        this.CommentarySpacing = 30;
        this.AnteOffset = new Point(-34, -37);
        this.BonusOffset = new Point(-34, -37);
        this.CardSpread = 94;
        this.RuleCardSpread = 100;
        // #endregion
        // #region Hand information
        this.m_DealerCards = new Array(0);
        this.m_PlayerCards = new Array(0);
        this.m_RuleCards = new Array(0);
        this._chipButtons = new Array(0);
        this._score = 0;
        this._currentState = -1;
        // #endregion
        // #region Game lists
        this.m_AnimationList = Array(0);
        this.m_CommentaryList = new Array(0);
        this.m_PayoutList = new Array(0);
        // #endregion
        // #region Test hands
        this.m_TestPlayerHand = []; //General.CardStringToVector("9S KS");
        this.m_TestRuleCards = [];
    }
    create() {
        // Add the game felt.
        let feltGraphic = this.add.image(0, 0, "gameFelt");
        feltGraphic.setOrigin(0, 0);
        // Creates the shoe object
        let cardRanks = new Array(54);
        for (let rank = 0; rank < 54; rank += 1)
            cardRanks[rank] = 1;
        this.m_Deck = new QuantumShoe(cardRanks, 1);
        // Create rule deck object
        cardRanks = new Array(15);
        for (let rank = 0; rank < 15; rank += 1)
            cardRanks[rank] = 1;
        this.m_RuleDeck = new QuantumShoe(cardRanks, 1);
        // Turn on listening to input events
        this.input.on('gameobjectup', function (_, gameObject) {
            gameObject.emit('clicked', gameObject);
        }, this);
        // #region Scoreboard panel graphics
        // create handler to graphics object
        let graphics = this.add.graphics();
        // Draw the border
        graphics.lineStyle(6, 0xffffff, 1);
        graphics.strokeRect(0, 682, 1024, 76);
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
        this.Score = 0;
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
        // #endregion
        // #region Button panels
        // #region Clear | Deal panel
        this.m_ClearButton = new Button({
            scene: this,
            style: AssetNames.BlueSmall,
            caption: "CLEAR",
            clickEvent: Emissions.ClearBettingSpots,
            x: 440,
            y: 645,
            visible: false
        });
        this.add.existing(this.m_ClearButton);
        Config.emitter.on(Emissions.ClearBettingSpots, this.clearBettingSpots, this);
        this.m_DealButton = new Button({
            scene: this,
            style: AssetNames.BlueSmall,
            caption: "DEAL",
            clickEvent: Emissions.BeginDeal,
            x: 583,
            y: 645,
            visible: false
        });
        this.add.existing(this.m_DealButton);
        Config.emitter.on(Emissions.BeginDeal, this.beginDeal, this);
        this.m_ClearDealButtonPanel = [
            this.m_ClearButton,
            this.m_DealButton
        ];
        // #endregion
        // #region New | Rebet panel
        this.m_NewButton = new Button({
            scene: this,
            style: AssetNames.BlueSmall,
            caption: "NEW",
            clickEvent: Emissions.NewGame,
            x: 440,
            y: 645,
            visible: false
        });
        this.add.existing(this.m_NewButton);
        Config.emitter.on(Emissions.NewGame, this.newBets, this);
        this.m_RebetButton = new Button({
            scene: this,
            style: AssetNames.BlueSmall,
            caption: "REBET",
            clickEvent: Emissions.RebetBets,
            x: 583,
            y: 645,
            visible: false
        });
        this.add.existing(this.m_RebetButton);
        Config.emitter.on(Emissions.RebetBets, this.rebetBets, this);
        this.m_NewRebetButtonPanel = [
            this.m_NewButton,
            this.m_RebetButton
        ];
        // #endregion
        // #region Trade | Stand panel
        this.m_TradeButton = new Button({
            scene: this,
            style: AssetNames.GreenSmall,
            caption: "TRADE",
            clickEvent: Emissions.Trade,
            x: 440,
            y: 645,
            visible: false
        });
        this.m_StandButton = new Button({
            scene: this,
            style: AssetNames.RedSmall,
            caption: "STAND",
            clickEvent: Emissions.Stand,
            x: 583,
            y: 645,
            visible: false
        });
        this.add.existing(this.m_TradeButton);
        this.add.existing(this.m_StandButton);
        Config.emitter.on(Emissions.Trade, this.tradeCardFromHand, this);
        Config.emitter.on(Emissions.Stand, this.standOnHand, this);
        this.m_TradeStandButtonPanel = [
            this.m_TradeButton,
            this.m_StandButton
        ];
        // #endregion
        // #region Reveal Button
        this.m_RevealButton = new Button({
            scene: this,
            style: AssetNames.GreenSmall,
            caption: "REVEAL",
            clickEvent: Emissions.Reveal,
            x: 512,
            y: 645,
            visible: false
        });
        this.add.existing(this.m_RevealButton);
        Config.emitter.on(Emissions.Reveal, this.revealRuleCard, this);
        // #endregion
        // #endregion
        // #region Betting spots
        let spotAnchor;
        graphics.lineStyle(5, 0xffffff, 1);
        // #region Ante spot
        spotAnchor = new Point(420, 600);
        // graphics.lineStyle(5, 0xffffff, 1);
        // graphics.strokeCircle(spotAnchor.x - 28, spotAnchor.y - 26, 40);
        // let anteLabel = this.add.text(spotAnchor.x - 68, spotAnchor.y + 25, "MAIN");
        // anteLabel.setFixedSize(80, 22);
        // anteLabel.setStyle(Config.gameOptions.feltFormat);
        this.m_AnteSpot = new BettingSpot({
            scene: this,
            x: 430,
            y: 437,
            amount: 0,
            isOptional: false,
            isLocked: false,
            isPlayerSpot: true,
            minimumBet: 5,
            maximumBet: 100,
            payoffOffset: this.AnteOffset
        });
        // #endregion
        // #region Bonus spot
        // spotAnchor.x += 230;
        // graphics.lineStyle(5, 0xffffff, 1);
        // graphics.strokeCircle(spotAnchor.x - 28, spotAnchor.y - 26, 40);
        // let bonusLabel = this.add.text(spotAnchor.x - 68, spotAnchor.y + 25, "BONUS");
        // bonusLabel.setFixedSize(80, 32);
        // bonusLabel.setStyle(Config.gameOptions.feltFormat);
        this.m_BonusSpot = new BettingSpot({
            scene: this,
            x: 638,
            y: 436,
            amount: 0,
            isOptional: true,
            isLocked: false,
            isPlayerSpot: true,
            minimumBet: 1,
            maximumBet: 25,
            payoffOffset: this.BonusOffset
        });
        // #endregion
        this.m_AnteSpot.HitZone.on("clicked", this.addSelectedValue, this);
        this.m_BonusSpot.HitZone.on("clicked", this.addSelectedValue, this);
        this.add.existing(this.m_AnteSpot);
        this.add.existing(this.m_BonusSpot);
        this.m_BettingSpots = [
            this.m_AnteSpot,
            this.m_BonusSpot
        ];
        this.m_LastWagers = new Array(this.m_BettingSpots.length);
        // #endregion
        this.Score = 10000;
        this.CurrentState = GameState.Predeal;
    }
    // #endregion
    // #region Animation methods
    addCommentaryField(fieldText) {
        let newCommentary = this.add.text(this.CommentaryAnchor.x, (this.m_CommentaryList.length * this.CommentarySpacing) + this.CommentaryAnchor.y, fieldText, Config.gameOptions.commentaryFormat);
        this.m_CommentaryList.push(newCommentary);
    }
    deliverRuleCards() {
        let cardLocations;
        let handToAddCardTo;
        let testCards;
        cardLocations = [
            new Point(950, 50 + (this.RuleCardSpread * 0)),
            new Point(950, 50 + (this.RuleCardSpread * 1)),
            new Point(950, 50 + (this.RuleCardSpread * 2)),
        ];
        handToAddCardTo = this.m_RuleCards;
        testCards = this.m_TestRuleCards;
        let newCardNumber;
        for (let stage = 0; stage < cardLocations.length; stage += 1) {
            let lastCard = (stage == cardLocations.length - 1);
            if (stage >= testCards.length) {
                newCardNumber = this.m_RuleDeck.drawCard();
            }
            else {
                newCardNumber = testCards[stage];
            }
            let nextCard = new RuleCard({
                scene: this,
                x: 0,
                y: 0,
                cardNumber: newCardNumber,
                isFaceUp: false
            });
            nextCard.alpha = 0.0;
            nextCard.setOrigin(0.5, 0.5);
            this.add.existing(nextCard);
            handToAddCardTo.push(nextCard);
            this.tweens.add({
                targets: nextCard,
                duration: 500,
                delay: (stage * 200),
                x: cardLocations[stage].x,
                y: cardLocations[stage].y,
                alpha: 1.0,
                ease: Phaser.Math.Easing.Expo.Out,
                onComplete: (lastCard ? this.doAnimation : null),
                onCompleteScope: (lastCard ? this : null)
            });
        }
    }
    deliverToTarget(target) {
        let cardLocations;
        let handToAddCardTo;
        let testCards;
        if (target == CardTarget.Player) {
            cardLocations = [
                new Point(414 + (this.CardSpread * 0), 535),
                new Point(414 + (this.CardSpread * 1), 535),
                new Point(414 + (this.CardSpread * 2), 535)
            ];
            handToAddCardTo = this.m_PlayerCards;
            testCards = this.m_TestPlayerHand;
        }
        else {
            return;
        }
        let newCardNumber;
        for (let stage = 0; stage < cardLocations.length; stage += 1) {
            let lastCard = (stage == cardLocations.length - 1);
            if (stage >= testCards.length) {
                newCardNumber = this.m_Deck.drawCard();
            }
            else {
                newCardNumber = testCards[stage];
            }
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
            handToAddCardTo.push(nextCard);
            this.tweens.add({
                targets: nextCard,
                duration: 500,
                delay: (stage * 200),
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
        let thisAction = this.m_AnimationList.shift();
        switch (thisAction) {
            case Animations.ReplaceNewCard: {
                let newCard = new PlayingCard({
                    scene: this,
                    x: 100,
                    y: 100,
                    cardNumber: this.m_Deck.drawCard(),
                    isFaceUp: true
                });
                newCard.alpha = 0.0;
                this.add.existing(newCard);
                this.m_PlayerCards[this.m_PlayerCardToTrade] = newCard;
                this.tweens.add({
                    targets: newCard,
                    duration: 500,
                    delay: 200,
                    x: 414 + (this.CardSpread * this.m_PlayerCardToTrade),
                    y: 535,
                    alpha: 1.0,
                    onComplete: this.doAnimation,
                    onCompleteScope: this
                });
                break;
            }
            case Animations.RemoveOldCard: {
                let target = this.m_PlayerCards[this.m_PlayerCardToTrade];
                this.tweens.add({
                    targets: target,
                    duration: 500,
                    x: 0,
                    y: 0,
                    alpha: 0,
                    onComplete: this.doAnimation,
                    onCompleteScope: this
                });
                break;
            }
            case Animations.ChangeStateGameOver: {
                this.CurrentState = GameState.GameOver;
                break;
            }
            case Animations.ResolveMainWager: {
                let cardsLeft = 0;
                for (let x = 0; x < 3; x += 1) {
                    if (this.m_PlayerCards[x].alpha == 1.0) {
                        cardsLeft += 1;
                    }
                }
                if (cardsLeft == 0) {
                    this.addCommentaryField("No cards left; main wager loses.");
                    this.resolvePayout(this.m_AnteSpot, -1, false, true);
                }
                else if (cardsLeft == 1) {
                    this.addCommentaryField("One card left; main wager pushes.");
                    this.doAnimation();
                }
                else if (cardsLeft == 2) {
                    this.addCommentaryField("Two cards left; main wager pays 2:1");
                    this.resolvePayout(this.m_AnteSpot, 2, false, true);
                }
                else if (cardsLeft == 3) {
                    this.addCommentaryField("Three cards left; main wager pays 7:1");
                    this.resolvePayout(this.m_AnteSpot, 7, false, true);
                }
                break;
            }
            case Animations.ProgramFlowMoreToReveal: {
                let allRuleCardsFlipped = true;
                let allPlayerCardsRemoved = true;
                // First, check for player cards -- any remaining, might not be done
                for (let x = 0; x < 3; x += 1) {
                    if (!this.m_RuleCards[x].IsFaceUp) {
                        allRuleCardsFlipped = false;
                    }
                    if (this.m_PlayerCards[x].alpha == 1.0) {
                        allPlayerCardsRemoved = false;
                    }
                }
                if (allRuleCardsFlipped || allPlayerCardsRemoved) {
                    this.m_AnimationList.push(Animations.ResolveMainWager);
                    this.m_AnimationList.push(Animations.ChangeStateGameOver);
                }
                else {
                    this.m_AnimationList.push(Animations.ChangeStateRevealRuleCard);
                }
                this.doAnimation();
                break;
            }
            case Animations.ResolveSelectedRuleCard: {
                let cardsToTarget = new Array(54);
                for (let x = 0; x < 54; x += 1)
                    cardsToTarget[x] = false;
                let sortedCardNumbers = new Array(3);
                for (let x = 0; x < 3; x += 1) {
                    sortedCardNumbers[x] = this.m_PlayerCards[x].CardNumber;
                    // We need to force the aces low, so make them negative
                    if (sortedCardNumbers[x] >= 48) {
                        sortedCardNumbers[x] -= 100;
                    }
                }
                sortedCardNumbers.sort((a, b) => a - b);
                // Now, restore the ace card numbers
                for (let x = 0; x < 3; x += 1) {
                    if (sortedCardNumbers[x] < 0) {
                        sortedCardNumbers[x] += 100;
                    }
                }
                let ruleIndex = this.m_RuleCards[this.m_RuleCardToReveal].CardNumber;
                switch (ruleIndex) {
                    case 0: {
                        // 2-5
                        for (let x = 0; x < 16; x += 1)
                            cardsToTarget[x] = true;
                        break;
                    }
                    case 1: {
                        // 6-9
                        for (let x = 16; x < 32; x += 1)
                            cardsToTarget[x] = true;
                        break;
                    }
                    case 2: {
                        // T-K
                        for (let x = 32; x < 48; x += 1)
                            cardsToTarget[x] = true;
                        break;
                    }
                    case 3: {
                        // Even
                        for (let x = 0; x < 36; x += 1) {
                            if (Math.floor(x / 4) % 2 == 0) {
                                cardsToTarget[x] = true;
                            }
                        }
                        break;
                    }
                    case 4: {
                        // Odd
                        for (let x = 0; x < 32; x += 1) {
                            if (Math.floor(x / 4) % 2 == 1) {
                                cardsToTarget[x] = true;
                            }
                        }
                        // .. and the aces are odd
                        for (let x = 48; x < 52; x += 1) {
                            cardsToTarget[x] = true;
                        }
                        break;
                    }
                    case 5: {
                        // Diamonds
                        for (let x = 0; x < 52; x += 1) {
                            if (x % 4 == 1) {
                                cardsToTarget[x] = true;
                            }
                        }
                        break;
                    }
                    case 6: {
                        // Clubs
                        for (let x = 0; x < 52; x += 1) {
                            if (x % 4 == 0) {
                                cardsToTarget[x] = true;
                            }
                        }
                        break;
                    }
                    case 7: {
                        // Hearts
                        for (let x = 0; x < 52; x += 1) {
                            if (x % 4 == 2) {
                                cardsToTarget[x] = true;
                            }
                        }
                        break;
                    }
                    case 8: {
                        // Spades
                        for (let x = 0; x < 52; x += 1) {
                            if (x % 4 == 3) {
                                cardsToTarget[x] = true;
                            }
                        }
                        break;
                    }
                    case 9: {
                        // Ace & face
                        for (let x = 36; x < 52; x += 1)
                            cardsToTarget[x] = true;
                        break;
                    }
                    case 10: {
                        // Highest						
                        if (sortedCardNumbers[2] < 52) {
                            // No jokers
                            cardsToTarget[sortedCardNumbers[2]] = true;
                        }
                        else if (sortedCardNumbers[1] < 52 && sortedCardNumbers[2] >= 52) {
                            // One joker, that's the highest, so the 'middle' card is actually high
                            cardsToTarget[sortedCardNumbers[1]] = true;
                        }
                        break;
                    }
                    case 11: {
                        // Lowest
                        if (sortedCardNumbers[2] < 52) {
                            // No jokers
                            cardsToTarget[sortedCardNumbers[0]] = true;
                        }
                        else if (sortedCardNumbers[1] < 52 && sortedCardNumbers[2] >= 52) {
                            cardsToTarget[sortedCardNumbers[0]] = true;
                        }
                        break;
                    }
                    case 12: {
                        // Middle
                        if (sortedCardNumbers[2] < 52) {
                            cardsToTarget[sortedCardNumbers[1]] = true;
                        }
                        break;
                    }
                    case 13: {
                        // Red
                        for (let x = 0; x < 52; x += 1) {
                            let suit = x % 4;
                            let color = (suit == 0 || suit == 3 ? 0 : 1);
                            if (color == 1) {
                                cardsToTarget[x] = true;
                            }
                        }
                        break;
                    }
                    case 14: {
                        // Black
                        for (let x = 0; x < 52; x += 1) {
                            let suit = x % 4;
                            let color = (suit == 0 || suit == 3 ? 0 : 1);
                            if (color == 0) {
                                cardsToTarget[x] = true;
                            }
                        }
                        break;
                    }
                    default: {
                        console.debug("Rule index", ruleIndex, " not resolve on card #", this.m_RuleCardToReveal);
                        break;
                    }
                }
                for (let x = 0; x < 3; x += 1) {
                    let thisCard = this.m_PlayerCards[x];
                    if (thisCard.alpha == 1.0) {
                        if (cardsToTarget[thisCard.CardNumber]) {
                            thisCard.alpha = 0.5;
                            thisCard.rotation = 0.1;
                        }
                    }
                }
                this.doAnimation();
                break;
            }
            case Animations.FlipSelectedRuleCard: {
                this.flipRuleCard(this.m_RuleCardToReveal);
                break;
            }
            case Animations.ShowNextRuleCard: {
                this.m_RuleCardToReveal = -1;
                // First, look for a highest / middle / lowest to show
                for (let x = 0; x < 3; x += 1) {
                    if (!this.m_RuleCards[x].IsFaceUp && this.m_RuleCards[x].CardNumber >= 10 && this.m_RuleCards[x].CardNumber <= 12) {
                        this.m_RuleCardToReveal = x;
                    }
                }
                // No HML to show?  Then show the first not face up card
                if (this.m_RuleCardToReveal == -1) {
                    for (let x = 2; x >= 0; x -= 1) {
                        if (!this.m_RuleCards[x].IsFaceUp) {
                            this.m_RuleCardToReveal = x;
                        }
                    }
                }
                this.m_AnimationList.push(Animations.FlipSelectedRuleCard);
                this.m_AnimationList.push(Animations.ResolveSelectedRuleCard);
                this.m_AnimationList.push(Animations.ProgramFlowMoreToReveal);
                this.doAnimation();
                break;
            }
            case Animations.ChangeStateRevealRuleCard: {
                this.CurrentState = GameState.RevealRuleCard;
                break;
            }
            case Animations.DeliverRuleCards: {
                this.deliverRuleCards();
                break;
            }
            case Animations.ChangeStateTradeStand: {
                this.CurrentState = GameState.TradeOrStand;
                break;
            }
            case Animations.RemoveJokers: {
                this.removeJokers();
                break;
            }
            case Animations.ResolveBonusWager: {
                if (this.m_BonusSpot.Amount > 0) {
                    let jokerCount = 0;
                    for (let card of this.m_PlayerCards) {
                        if (card.CardNumber >= 52) {
                            jokerCount += 1;
                        }
                    }
                    let bonusCommentary = "No jokers in hand, Bonus wager loses.";
                    let bonusMultiplier = -1;
                    if (jokerCount == 2) {
                        bonusCommentary = "Bonus wager pays 50:1 for two jokers.";
                        bonusMultiplier = 50;
                    }
                    else if (jokerCount == 1) {
                        bonusCommentary = "Bonus wager pays 5:1 for one joker.";
                        bonusMultiplier = 5;
                    }
                    this.addCommentaryField(bonusCommentary);
                    this.resolvePayout(this.m_BonusSpot, bonusMultiplier, true, true);
                }
                else {
                    this.doAnimation();
                }
                break;
            }
            case Animations.FlipPlayerCards: {
                this.flipHand(CardTarget.Player);
                break;
            }
            case Animations.DeliverPlayerCards: {
                this.deliverToTarget(CardTarget.Player);
                break;
            }
            default: {
                console.debug("STEP NOT RESOLVED: ", thisAction);
                this.m_AnimationList = [];
                break;
            }
        }
    }
    flipHand(target) {
        let cardTargets;
        if (target == CardTarget.Player) {
            cardTargets = [
                this.m_PlayerCards[0],
                this.m_PlayerCards[1],
                this.m_PlayerCards[2]
            ];
        }
        else {
            throw new Error("Target not resolved in flipHand()");
        }
        for (let stage = 0; stage < cardTargets.length; stage += 1) {
            let isLastCard = (stage == cardTargets.length - 1);
            this.add.tween({
                targets: cardTargets[stage],
                delay: 0,
                duration: 100,
                x: "-=30"
            });
            this.add.tween({
                targets: cardTargets[stage],
                delay: 100,
                duration: 100,
                scaleX: 0,
                scaleY: 1.2,
                onComplete: () => {
                    cardTargets[stage].IsFaceUp = true;
                }
            });
            this.add.tween({
                targets: cardTargets[stage],
                delay: 200,
                duration: 100,
                scaleX: 1.0,
                scaleY: 1.0,
            });
            this.add.tween({
                targets: cardTargets[stage],
                delay: 300,
                duration: 100,
                x: "+=30",
                onComplete: (isLastCard ? this.doAnimation : null),
                onCompleteScope: (isLastCard ? this : null)
            });
        }
    }
    flipRuleCard(target) {
        let cardTarget = this.m_RuleCards[target];
        this.add.tween({
            targets: cardTarget,
            delay: 0,
            duration: 100,
            x: "-=30"
        });
        this.add.tween({
            targets: cardTarget,
            delay: 100,
            duration: 100,
            scaleX: 0,
            scaleY: 1.2,
            onComplete: () => {
                cardTarget.IsFaceUp = true;
            }
        });
        this.add.tween({
            targets: cardTarget,
            delay: 200,
            duration: 100,
            scaleX: 1.0,
            scaleY: 1.0,
        });
        this.add.tween({
            targets: cardTarget,
            delay: 300,
            duration: 100,
            x: "+=30",
            onComplete: this.doAnimation,
            onCompleteScope: this
        });
    }
    playButtonClick() {
        this.sound.play("buttonClick");
    }
    playChipClick() {
        this.sound.play("chipClick");
    }
    removeJokers() {
        for (let x = 0; x < 3; x += 1) {
            let card = this.m_PlayerCards[x];
            if (card.CardNumber >= 52) {
                card.disableInteractive();
                this.tweens.add({
                    targets: card,
                    rotation: 0.1,
                    alpha: 0.5,
                    duration: 0.5,
                    onComplete: (x == 2 ? this.doAnimation : null),
                    onCompleteScope: this
                });
            }
            else {
                if (x == 2)
                    this.doAnimation();
            }
        }
    }
    resolvePayout(wager, multiple, elevateOldBet, continueAnimation) {
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
                this.m_PayoutList.push(losingPayout);
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
                this.m_PayoutList.push(winningPayoutSpot);
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
            case GameState.GameOver: {
                for (let thisButton of this.m_NewRebetButtonPanel)
                    thisButton.visible = true;
                for (let chip of this._chipButtons)
                    chip.setInteractive();
                this.Instructions = StringTable.GameOver;
                break;
            }
            case GameState.RevealRuleCard: {
                this.m_RevealButton.visible = true;
                this.Instructions = StringTable.Reveal;
                break;
            }
            case GameState.TradeOrStand: {
                for (let thisButton of this.m_TradeStandButtonPanel)
                    thisButton.visible = true;
                this.m_TradeButton.lock();
                this.Instructions = StringTable.PlayFoldInstructions;
                for (let card of this.m_PlayerCards) {
                    if (card.CardNumber < 52) {
                        card.setInteractive({ useHandCursor: true });
                        card.on("clicked", this.selectCard, this);
                    }
                }
                break;
            }
            case GameState.Predeal: {
                this.predealInitialization();
                this.Instructions = StringTable.PredealInstructions;
                break;
            }
            case GameState.StartDeal: {
                // Turn off the Clear | Deal panel
                for (let thisButton of this.m_ClearDealButtonPanel)
                    thisButton.visible = false;
                this.Instructions = "";
                // If any non-optional wager OR partially wagered optional is not Min, make it so.
                for (let thisWager of this.m_BettingSpots) {
                    if (!thisWager.IsOptional || thisWager.Amount > 0) {
                        thisWager.Amount = Math.max(thisWager.Amount, thisWager.MinimumBet);
                    }
                }
                for (let chip of this._chipButtons) {
                    chip.disableInteractive();
                }
                // Store the last wagers, close wagers for business.
                for (let index = 0; index < this.m_LastWagers.length; index += 1) {
                    this.m_BettingSpots[index].disableInteractive();
                    this.m_BettingSpots[index].IsLocked = true;
                    this.m_LastWagers[index] = this.m_BettingSpots[index].Amount;
                }
                // Load up animation list
                this.m_AnimationList.push(Animations.DeliverPlayerCards);
                this.m_AnimationList.push(Animations.FlipPlayerCards);
                this.m_AnimationList.push(Animations.ResolveBonusWager);
                this.m_AnimationList.push(Animations.RemoveJokers);
                this.m_AnimationList.push(Animations.ChangeStateTradeStand);
                // and now, if you please, we'll proceed
                this.doAnimation();
                break;
            }
            default: {
                console.debug("STATE ID# NOT HANDLED: ", this.CurrentState);
                break;
            }
        }
    }
    // #endregion
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
        for (let spot of this.m_BettingSpots) {
            spot.Amount = 0;
        }
        this.playButtonClick();
    }
    newBets() {
        this.playButtonClick();
        this.CurrentState = GameState.Predeal;
    }
    rebetBets() {
        this.playButtonClick();
        this.predealInitialization();
        for (let index = 0; index < this.m_BettingSpots.length; index += 1) {
            this.m_BettingSpots[index].Amount = this.m_LastWagers[index];
        }
        this.CurrentState = GameState.StartDeal;
    }
    revealRuleCard() {
        this.playButtonClick();
        this.m_RevealButton.visible = false;
        this.Instructions = "";
        this.m_AnimationList.push(Animations.ShowNextRuleCard);
        this.doAnimation();
    }
    selectCard(target) {
        if (target.IsSelected) {
            target.y += 55;
            target.IsSelected = false;
            this.m_TradeButton.lock();
        }
        else {
            for (let card of this.m_PlayerCards) {
                if (card.IsSelected) {
                    card.y += 55;
                    card.IsSelected = false;
                }
            }
            target.y -= 55;
            target.IsSelected = true;
            this.m_TradeButton.unlock();
        }
    }
    selectChip(target) {
        this.playChipClick();
        this.selectCursorValue(target.Value);
    }
    standOnHand() {
        this.playButtonClick();
        this.Instructions = "";
        for (let button of this.m_TradeStandButtonPanel)
            button.visible = false;
        for (let card of this.m_PlayerCards) {
            card.disableInteractive();
            if (card.IsSelected) {
                card.y += 55;
                card.IsSelected = false;
            }
        }
        this.m_AnimationList.push(Animations.DeliverRuleCards);
        this.m_AnimationList.push(Animations.ChangeStateRevealRuleCard);
        this.doAnimation();
        // TO COME:
        // TODO: flip card
        // TODO: hide cards
        // TODO: Change state: flip second card
        // et cetera, et cetera.
    }
    tradeCardFromHand() {
        this.playButtonClick();
        this.Instructions = "";
        for (let button of this.m_TradeStandButtonPanel)
            button.visible = false;
        let targetCard;
        for (let x = 0; x < 3; x += 1) {
            this.m_PlayerCards[x].disableInteractive();
            if (this.m_PlayerCards[x].IsSelected) {
                this.m_PlayerCardToTrade = x;
                targetCard = this.m_PlayerCards[x];
            }
        }
        targetCard.IsSelected = false;
        this.m_AnimationList.push(Animations.RemoveOldCard);
        this.m_AnimationList.push(Animations.ReplaceNewCard);
        this.m_AnimationList.push(Animations.RemoveJokers);
        this.m_AnimationList.push(Animations.DeliverRuleCards);
        this.m_AnimationList.push(Animations.ChangeStateRevealRuleCard);
        this.doAnimation();
    }
    // #endregion
    // #region Event handlers
    predealInitialization() {
        this.m_AnimationList = [];
        this.m_Deck.shuffle();
        this.m_RuleDeck.shuffle();
        this.clearGameObjectArray(this.m_PayoutList);
        this.clearGameObjectArray(this.m_CommentaryList);
        this.clearGameObjectArray(this.m_PlayerCards);
        this.clearGameObjectArray(this.m_DealerCards);
        this.clearGameObjectArray(this.m_RuleCards);
        // this.m_PlayerData = new Array<number>(2);
        // this.m_DealerData = new Array<number>(2);
        // Open chip panels
        for (let thisChip of this._chipButtons) {
            thisChip.setInteractive({ useHandCursor: true });
        }
        // Clear betting spots
        for (let i = 0; i < this.m_BettingSpots.length; i += 1) {
            this.m_BettingSpots[i].Amount = 0;
            this.m_BettingSpots[i].alpha = 1.0;
            if (this.m_BettingSpots[i].IsPlayerSpot) {
                this.m_BettingSpots[i].IsLocked = false;
            }
        }
        // Hide "New | Rebet" panel
        for (let thisButton of this.m_NewRebetButtonPanel) {
            thisButton.visible = false;
        }
        // Hide "Trade | Stand" panel
        for (let thisButton of this.m_TradeStandButtonPanel) {
            thisButton.visible = false;
        }
        // Show "Clear | Deal" panel
        for (let thisButton of this.m_ClearDealButtonPanel) {
            thisButton.visible = true;
        }
        // Reset the card reveal index.
        this.m_RuleCardToReveal = -1;
    }
    // #endregion
    // #region Game logic methods
    clearGameObjectArray(target) {
        for (let index = 0; index < target.length; index += 1) {
            target[index].destroy();
        }
        target.length = 0;
    }
    // #endregion
    // #region Properties
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
        this.load.image("gameFelt", "assets/images/Felt.jpg");
        this.load.image("blueText", "assets/images/Blue Text 130x50.png");
        this.load.image("grayTextSmall", "assets/images/Gray Text 345x50.png");
        this.load.image("grayTextLarge", "assets/images/Gray Text 430x50.png");
        this.load.image("dropPixel", "assets/images/Drop Shape Pixel.jpg");
        this.load.spritesheet("card", "assets/images/Cards 85x131.png", {
            frameWidth: Config.gameOptions.cardWidth,
            frameHeight: Config.gameOptions.cardHeight
        });
        this.load.spritesheet("rule card", "assets/images/Rule Deck.png", {
            frameWidth: 131,
            frameHeight: 85
        });
        this.load.spritesheet("chip", "assets/images/Chips 55x51.png", {
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
class RuleCard extends Phaser.GameObjects.Sprite {
    constructor(config) {
        var _a, _b;
        super(config.scene, config.x, config.y, "rule card");
        this.CardBackFrame = 15;
        this.CardNumber = ((_a = config.cardNumber) !== null && _a !== void 0 ? _a : 0);
        this.IsFaceUp = ((_b = config.isFaceUp) !== null && _b !== void 0 ? _b : false);
        this.IsSelected = false;
    }
    // #region Properties
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
    get IsSelected() { return this._isSelected; }
    set IsSelected(value) {
        this._isSelected = value;
    }
}
class Animations {
}
Animations.DeliverPlayerCards = "DELIVER PLAYER CARDS";
Animations.FlipPlayerCards = "FLIP PLAYER CARDS";
Animations.ResolveBonusWager = "RESOLVE BONUS WAGER";
Animations.RemoveJokers = "REMOVE JOKERS";
Animations.DeliverRuleCards = "Deliver rule cards";
Animations.ChangeStateRevealRuleCard = "CHANGE STATE -- Reveal rule card";
Animations.ShowNextRuleCard = "Show next rule card";
Animations.FlipSelectedRuleCard = "Flip selected rule card";
Animations.ResolveSelectedRuleCard = "Resolve selected rule card";
Animations.ProgramFlowMoreToReveal = "PROGRAM FLOW -- More cards to reveal?";
Animations.ResolveMainWager = "Resolve Main Wager";
Animations.RemoveOldCard = "Remove Old Card";
Animations.ReplaceNewCard = "Replace New Card";
Animations.ChangeStateTradeStand = "CHANGE STATE -- TRADE OR STAND";
Animations.ChangeStateGameOver = "CHANGE STATE -- GAME OVER";
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
                dummyChip.alpha = 0.3;
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
Emissions.Trade = "Trade card";
Emissions.Stand = "Stand";
Emissions.Reveal = "Reveal";
class GameState {
}
GameState.Predeal = 0;
GameState.StartDeal = 1;
GameState.TradeOrStand = 2;
GameState.GameOver = 3;
GameState.RevealRuleCard = 4;
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
        this.IsSelected = false;
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
    get IsSelected() { return this._isSelected; }
    set IsSelected(value) {
        this._isSelected = value;
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
class StringTable {
}
StringTable.PredealInstructions = "Click on chip to select denomination, click on MAIN or BONUS betting spots to add chips, click DEAL to begin.";
StringTable.GameOver = "Game over.";
StringTable.PlayFoldInstructions = "Select a card to exchange and click TRADE, or click PLAY to stand pat";
StringTable.Reveal = "Click on the REVEAL button to show the next rule card.";
//# sourceMappingURL=index.js.map