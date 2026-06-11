import * as Phaser from 'phaser';
import { FONT_FAMILY, RUNE_FONT } from '../../constants';
import { AudioManager } from '../../utils/AudioManager';

export class Disclaimer extends Phaser.Scene {
    private audioManager!: AudioManager;

    constructor() {
        super('Disclaimer');
    }

    preload() {
        this.audioManager = new AudioManager(this);
        this.audioManager.loadAudio();
    }

    create() {
        this.audioManager.playAmbient(0.015);

        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;

        const bgGraphics = this.add.graphics();
        bgGraphics.fillGradientStyle(0x0a0a0c, 0x0a0a0c, 0x020203, 0x020203, 1);
        bgGraphics.fillRect(0, 0, this.scale.width, this.scale.height);

        const runeChars = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ'];
        for (let i = 0; i < 15; i++) {
            const rx = Phaser.Math.Between(50, this.scale.width - 50);
            const ry = Phaser.Math.Between(50, this.scale.height - 50);
            const runeChar = Phaser.Utils.Array.GetRandom(runeChars);
            const size = Phaser.Math.Between(20, 40);
            const alpha = Phaser.Math.FloatBetween(0.03, 0.08);

            const rune = this.add.text(rx, ry, runeChar, {
                fontFamily: RUNE_FONT,
                fontSize: `${size}px`,
                color: '#ffd700'
            }).setOrigin(0.5).setAlpha(alpha).setAngle(Phaser.Math.Between(0, 360));

            this.tweens.add({
                targets: rune,
                y: ry + Phaser.Math.Between(-30, 30),
                x: rx + Phaser.Math.Between(-30, 30),
                angle: rune.angle + Phaser.Math.Between(-15, 15),
                duration: Phaser.Math.Between(4000, 8000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        const cardWidth = 720;
        const cardHeight = 440;

        this.add.rectangle(cx + 6, cy + 6, cardWidth, cardHeight, 0x000000, 0.4).setOrigin(0.5);
        this.add.rectangle(cx, cy, cardWidth, cardHeight, 0x121214)
            .setStrokeStyle(1.5, 0x27272a)
            .setOrigin(0.5);

        this.add.text(cx, cy - 160, 'NOTICE & DISCLAIMER', {
            fontFamily: FONT_FAMILY,
            fontSize: '32px',
            color: '#ffd700',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const contentText = [
            'This game is designed to be a longer experience',
            '(expect 15 to 30 minutes of exploration).',
            '',
            'Each combat victory rewards 20 tokens,',
            'but you must reach the boss to cash them out.',
            '',
            'There is no permanent death.',
            '',
            'Enjoy the journey.'
        ].join('\n');

        this.add.text(cx, cy - 10, contentText, {
            fontFamily: FONT_FAMILY,
            fontSize: '18px',
            color: '#d4d4d8',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);

        const btnWidth = 220;
        const btnHeight = 46;
        const btnY = cy + 150;

        const btnBg = this.add.rectangle(cx, btnY, btnWidth, btnHeight, 0x1e1b18)
            .setStrokeStyle(1.5, 0x5c4d3c)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        const btnText = this.add.text(cx, btnY, 'ENTER GAME', {
            fontFamily: FONT_FAMILY,
            fontSize: '16px',
            color: '#ffd700',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        btnBg.on('pointerover', () => {
            btnBg.setFillStyle(0x2d241e);
            btnBg.setStrokeStyle(1.5, 0x8c6d4f);
            btnText.setColor('#ffffff');
            this.tweens.add({
                targets: [btnBg, btnText],
                scale: 1.04,
                duration: 120,
                ease: 'Quad.easeOut'
            });
        });

        btnBg.on('pointerout', () => {
            btnBg.setFillStyle(0x1e1b18);
            btnBg.setStrokeStyle(1.5, 0x5c4d3c);
            btnText.setColor('#ffd700');
            this.tweens.add({
                targets: [btnBg, btnText],
                scale: 1.0,
                duration: 120,
                ease: 'Quad.easeOut'
            });
        });

        btnBg.on('pointerdown', () => {
            localStorage.setItem('glossary_disclaimer_accepted', 'true');
            btnBg.disableInteractive();

            this.cameras.main.fadeOut(800, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MainMenu');
            });
        });
    }
}
