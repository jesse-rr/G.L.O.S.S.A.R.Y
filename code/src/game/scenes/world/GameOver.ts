import { Scene } from "phaser";
import axios from "axios";
import {FONT_FAMILY} from "../../constants";
import {cleanupAnimations, playScrambleAnimation, ScrambleContext} from "../../utils/ScrambleAnimation";

export class GameOver extends Scene {
    private finalCredits: number = 0;
    private lorePieces: Phaser.GameObjects.Image[] = [];
    private loreTexts: Phaser.GameObjects.Text[] = [];
    private narratorText!: Phaser.GameObjects.Text;
    private currentPieceIndex: number = 0;
    background!: Phaser.GameObjects.Image;
    private layout!: Phaser.GameObjects.Image;
    private currentCharIndex: number = 0;
    private currentFullText: string = '';
    private textRevealTimer: Phaser.Time.TimerEvent | null = null;
    private scrambleCtx: ScrambleContext = { activeTweens: [], activeScrambleTimers: [] };
    private loreScript: { frame: number; text: string }[] = [];
    private covenant: string = '';

    constructor() {
        super("GameOver");
    }

    init(data: { finalCredits?: number }) {
        if (data.finalCredits) {
            this.finalCredits = Math.min(data.finalCredits, 800);
        } else {
            const completedCombats = localStorage.getItem('glossary_echojar_completed_combats');
            const combatsWon = completedCombats ? parseInt(completedCombats) : 0;
            let credits = combatsWon * 50;

            const bossDefeated = localStorage.getItem('glossary_boss_fight_active') === 'false' ||
                localStorage.getItem('glossary_boss_combat_victory') === 'true';
            if (bossDefeated) {
                credits = credits * 2;
            }

            this.finalCredits = Math.min(credits, 800);
        }

        const playerData = this.registry.get('playerData');
        this.covenant = playerData?.covenant || 'snake';
    }

    preload() {
        this.load.spritesheet('lore-sheet', 'assets/Models/exports/Lore-Sheet.png', {
            frameWidth: 640,
            frameHeight: 360
        });
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');

        this.background = this.add.image(640, 360, 'lore-sheet', 0)
            .setOrigin(0.5, 0.5)
            .setDisplaySize(1280, 720)
            .setDepth(0);

        this.narratorText = this.add.text(640, 20, `"Narrator"`, {
            fontFamily: FONT_FAMILY,
            fontSize: '18px',
            color: '#e4dacf',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(20).setAlpha(0);

        this.loreScript = [
            {
                frame: 2,
                text: "In a valley bathed in eternal light,\nstood a city of three ruling covenants.\nTogether, they built a tower\nhousing a power akin to magic."
            },
            {
                frame: 3,
                text: "But the power grew sentient.\nIt saw the world through a crack it made\nand spread like a plague."
            },
            {
                frame: 4,
                text: "The Glossary was consumed and everything was corrupted.\nOnly the runes remained untouched,\nfor they were carved not by magic,\nbut by human hands."
            },
            {
                frame: 5,
                text: "Now desolate and abandoned,\nyou found yourself here.\nNo memories. Only the will to climb.\nYou fought. You won."
            },
            {
                frame: 6,
                text: "The old Glossary is no more.\nOnly yours remains.\n\nThank you, Traveler."
            }
        ];

        for (let i = 0; i < this.loreScript.length; i++) {
            const piece = this.add.image(640, 360, 'lore-sheet', this.loreScript[i].frame)
                .setOrigin(0.5, 0.5)
                .setDisplaySize(1280, 720)
                .setDepth(5)
                .setAlpha(0);
            this.lorePieces.push(piece);

            const text = this.add.text(640, 620, this.loreScript[i].text, {
                fontFamily: FONT_FAMILY,
                fontSize: '24px',
                color: '#e4dacf',
                align: 'center',
                wordWrap: { width: 1000 },
                stroke: '#000000',
                strokeThickness: 4,
                lineSpacing: 8
            }).setOrigin(0.5, 0.5).setDepth(15).setAlpha(0);

            this.loreTexts.push(text);
        }

        this.layout = this.add.image(640, 360, 'lore-sheet', 1)
            .setOrigin(0.5, 0.5)
            .setDisplaySize(1280, 720)
            .setDepth(10)
            .setAlpha(0.2);

        this.showNextLorePiece();
    }

    private revealNextCharacter(textObj: Phaser.GameObjects.Text) {
        if (this.currentCharIndex <= this.currentFullText.length) {
            const visibleText = this.currentFullText.substring(0, this.currentCharIndex);
            textObj.setText(visibleText);
            this.currentCharIndex++;

            this.textRevealTimer = this.time.delayedCall(30, () => {
                this.revealNextCharacter(textObj);
            });
        }
    }

    private showNextLorePiece() {
        if (this.currentPieceIndex >= this.lorePieces.length) {
            this.fadeToGoogleAuth();
            return;
        }

        const currentPiece = this.lorePieces[this.currentPieceIndex];
        const currentText = this.loreTexts[this.currentPieceIndex];

        if (!currentPiece || !currentPiece.active || !currentText || !currentText.active) {
            this.currentPieceIndex++;
            this.showNextLorePiece();
            return;
        }

        this.currentFullText = this.loreScript[this.currentPieceIndex].text;
        this.currentCharIndex = 0;

        currentText.setText('');

        this.tweens.add({
            targets: currentPiece,
            alpha: 1,
            duration: 1000,
            ease: 'Sine.easeIn',
            onComplete: () => {
                if (!this.narratorText || !this.narratorText.active) return;

                this.tweens.add({
                    targets: this.narratorText,
                    alpha: 1,
                    duration: 500,
                    ease: 'Sine.easeIn'
                });

                this.tweens.add({
                    targets: currentText,
                    alpha: 1,
                    duration: 300,
                    ease: 'Sine.easeIn',
                    onComplete: () => {
                        this.revealNextCharacter(currentText);

                        const estimatedDuration = this.currentFullText.length * 30 + 1000;
                        this.time.delayedCall(estimatedDuration, () => {
                            this.time.delayedCall(3000, () => {
                                if (this.textRevealTimer) {
                                    this.textRevealTimer.remove();
                                }

                                const isLastPiece = this.currentPieceIndex === this.lorePieces.length - 1;

                                if (isLastPiece) {
                                    const covenantName = this.covenant.charAt(0).toUpperCase() + this.covenant.slice(1);
                                    const targetNarratorText = `"${covenantName}"`;

                                    cleanupAnimations(this.scrambleCtx);

                                    playScrambleAnimation(
                                        this,
                                        this.scrambleCtx,
                                        [this.narratorText],
                                        [targetNarratorText],
                                        () => {
                                            this.time.delayedCall(2000, () => {
                                                if (currentPiece && currentPiece.active && currentText && currentText.active) {
                                                    this.tweens.add({
                                                        targets: [currentPiece, currentText],
                                                        alpha: 0,
                                                        duration: 800,
                                                        ease: 'Sine.easeOut',
                                                        onComplete: () => {
                                                            this.currentPieceIndex++;
                                                            this.showNextLorePiece();
                                                        }
                                                    });
                                                } else {
                                                    this.currentPieceIndex++;
                                                    this.showNextLorePiece();
                                                }
                                            });
                                        }
                                    );
                                } else {
                                    if (currentPiece && currentPiece.active && currentText && currentText.active) {
                                        this.tweens.add({
                                            targets: [currentPiece, currentText],
                                            alpha: 0,
                                            duration: 800,
                                            ease: 'Sine.easeOut',
                                            onComplete: () => {
                                                this.currentPieceIndex++;
                                                this.showNextLorePiece();
                                            }
                                        });
                                    } else {
                                        this.currentPieceIndex++;
                                        this.showNextLorePiece();
                                    }
                                }
                            });
                        });
                    }
                });
            }
        });
    }

    private fadeToGoogleAuth() {
        if (this.textRevealTimer) {
            this.textRevealTimer.remove();
        }

        cleanupAnimations(this.scrambleCtx);

        const targetsToFade = [];

        if (this.layout && this.layout.active) {
            targetsToFade.push(this.layout);
        }

        this.lorePieces.forEach(piece => {
            if (piece && piece.active) {
                targetsToFade.push(piece);
            }
        });

        this.loreTexts.forEach(text => {
            if (text && text.active) {
                targetsToFade.push(text);
            }
        });

        if (targetsToFade.length > 0) {
            this.tweens.add({
                targets: targetsToFade,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    this.time.delayedCall(500, () => {
                        this.cameras.main.fadeOut(1000, 0, 0, 0);
                        this.time.delayedCall(1200, () => {
                            if (this.narratorText && this.narratorText.active) {
                                this.narratorText.destroy();
                            }
                            this.showGoogleAuth();
                        });
                    });
                }
            });
        } else {
            this.time.delayedCall(500, () => {
                this.cameras.main.fadeOut(1000, 0, 0, 0);
                this.time.delayedCall(1200, () => {
                    if (this.narratorText && this.narratorText.active) {
                        this.narratorText.destroy();
                    }
                    this.showGoogleAuth();
                });
            });
        }
    }

    private showGoogleAuth() {
        this.lorePieces.forEach(piece => piece.destroy());
        this.loreTexts.forEach(text => text.destroy());
        this.layout.destroy();

        this.cameras.main.setBackgroundColor('#000000');
        this.cameras.main.fadeIn(500);

        const titleText = this.add.text(640, 220, `YOU EARNED ${this.finalCredits} CREDITS!`, {
            fontSize: '42px',
            color: '#facc15',
            fontFamily: FONT_FAMILY,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5).setDepth(20);

        this.tweens.add({
            targets: titleText,
            scale: 1.05,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.add.text(640, 310, 'Sign in with Google to claim your reward', {
            fontSize: '22px',
            color: '#cccccc',
            fontFamily: FONT_FAMILY,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(20);

        google.accounts.id.initialize({
            client_id: "331191695151-ku8mdhd76pc2k36itas8lm722krn0u64.apps.googleusercontent.com",
            callback: async (res: any) => {
                if (res.error) {
                    console.error(res.error);
                    this.showMessage("Authentication failed", true);
                } else {
                    try {
                        const response = await axios.post(
                            "https://feira-de-jogos.dev.br/api/v2/credit",
                            {
                                product: 1,
                                value: this.finalCredits,
                            },
                            {
                                headers: {
                                    Authorization: `Bearer ${res.credential}`,
                                },
                            },
                        );
                        console.log(response);
                        this.showMessage(`✓ ${this.finalCredits} credits added!`, false);
                    } catch (error) {
                        console.error(error);
                        this.showMessage("Error adding credit :(", true);
                    }
                }
            },
        });

        google.accounts.id.prompt();
    }

    private showMessage(msg: string, isError: boolean) {
        const text = this.add.text(640, 400, msg, {
            fontSize: '22px',
            color: isError ? '#ff8888' : '#88ff88',
            fontFamily: FONT_FAMILY,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(20);

        this.time.delayedCall(3000, () => {
            this.tweens.add({
                targets: text,
                alpha: 0,
                duration: 500,
                onComplete: () => text.destroy()
            });
        });
    }
}