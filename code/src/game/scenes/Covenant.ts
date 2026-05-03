import * as Phaser from 'phaser';
import { PlayerData } from '../data/PlayerData';
import { UserData } from '../data/UserData';
import { ScreenShake } from '../utils/ScreenShake';

const BG_FRAME_RATE = 8;
const CARD_FRAME_RATE = 8;
const CARD_FRAME_WIDTH = 146;
const CARD_FRAME_HEIGHT = 210;
const CARD_BASE_SCALE = 2;
const CARD_HOVER_SCALE = 2.15;
const CARD_SPACING = 360;
const DEFAULT_CARD_INDEX = 1;

const COVENANTS = [
    { key: 'dragon' },
    { key: 'phoenix' },
    { key: 'snake' }
] as const;

export class Covenant extends Phaser.Scene {
    private cards: Array<{ key: string; sprite: Phaser.GameObjects.Sprite }> = [];
    private selectedCardIndex = DEFAULT_CARD_INDEX;

    constructor() {
        super('Covenant');
    }

    preload() {
        this.load.spritesheet('covenant-bg', 'assets/exports/Covenant/Covenant-Sheet-BG.png', {
            frameWidth: 640,
            frameHeight: 360
        });
        this.load.spritesheet('dragon', 'assets/exports/Covenant/Dragon-Sheet.png', {
            frameWidth: CARD_FRAME_WIDTH,
            frameHeight: CARD_FRAME_HEIGHT
        });
        this.load.spritesheet('snake', 'assets/exports/Covenant/Ouroborus-Sheet.png', {
            frameWidth: CARD_FRAME_WIDTH,
            frameHeight: CARD_FRAME_HEIGHT
        });
        this.load.spritesheet('phoenix', 'assets/exports/Covenant/Phoenix-Sheet.png', {
            frameWidth: CARD_FRAME_WIDTH,
            frameHeight: CARD_FRAME_HEIGHT
        });
    }

    create() {
        this.cards = [];
        this.selectedCardIndex = DEFAULT_CARD_INDEX;
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        this.anims.create({
            key: 'covenant-bg',
            frames: this.anims.generateFrameNumbers('covenant-bg', { start: 0, end: 7 }),
            frameRate: BG_FRAME_RATE,
            repeat: -1
        });

        for (const covenant of COVENANTS) {
            this.anims.create({
                key: `${covenant.key}-anim`,
                frames: this.anims.generateFrameNumbers(covenant.key, { start: 0, end: 4 }),
                frameRate: CARD_FRAME_RATE,
                repeat: -1
            });
        }

        this.add.sprite(centerX, centerY, 'covenant-bg').setOrigin(0.5).setScale(2).play('covenant-bg');

        for (let i = 0; i < COVENANTS.length; i++) {
            const covenant = COVENANTS[i];
            const sprite = this.add.sprite(
                centerX + (i - 1) * CARD_SPACING,
                centerY,
                covenant.key
            ).setOrigin(0.5).setScale(CARD_BASE_SCALE).setFrame(1).setAlpha(0.88).setInteractive({ useHandCursor: true });

            sprite.on('pointerover', () => {
                this.setSelectedCard(i);
            });


            sprite.on('pointerdown', () => {
                this.selectCovenant(covenant.key as any);
            });

            this.cards.push({ key: covenant.key, sprite });
        }

        this.setSelectedCard(this.selectedCardIndex);

        this.input.keyboard!.on('keydown-LEFT', () => {
            this.setSelectedCard(this.selectedCardIndex - 1);
        });

        this.input.keyboard!.on('keydown-ENTER', () => {
            this.selectCovenant(COVENANTS[this.selectedCardIndex].key as any);
        });

        this.input.keyboard!.on('keydown-RIGHT', () => {
            this.setSelectedCard(this.selectedCardIndex + 1);
        });
    }

    private setSelectedCard(index: number) {
        this.selectedCardIndex = Phaser.Math.Wrap(index, 0, COVENANTS.length);

        for (let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i].sprite;
            const isSelected = i === this.selectedCardIndex;

            if (isSelected) {
                card.clearTint();
                card.setAlpha(1);
                this.tweenCardScale(card, CARD_HOVER_SCALE);
                card.play(`${this.cards[i].key}-anim`);
            } else {
                card.setTint(0x999999);
                card.setAlpha(0.85);
                this.tweenCardScale(card, CARD_BASE_SCALE);
                card.stop();
                card.setFrame(1);
            }
        }
    }

    private tweenCardScale(card: Phaser.GameObjects.Sprite, targetScale: number) {
        const existing = card.getData('scaleTween') as Phaser.Tweens.Tween | undefined;
        if (existing) {
            existing.stop();
        }

        const tween = this.tweens.add({
            targets: card,
            scaleX: targetScale,
            scaleY: targetScale,
            duration: 90,
            ease: 'Quad.easeOut'
        });

        card.setData('scaleTween', tween);
    }

    private getCardIndexAtPointer(pointer: Phaser.Input.Pointer) {
        for (let i = 0; i < this.cards.length; i++) {
            if (this.cards[i].sprite.getBounds().contains(pointer.worldX, pointer.worldY)) {
                return i;
            }
        }
        return -1;
    }

    private selectCovenant(covenant: 'dragon' | 'phoenix' | 'snake'): void {
        const playerData = this.registry.get('playerData') as PlayerData;
        playerData.setCovenantData(covenant);
        const userData = this.registry.get('userData') as UserData;
        userData.discoverCovenant(covenant);

        const sceneKeys = ['MainMenu', 'Help', 'Settings', 'SettingsUI', 'Achievements', 'AchievementsUI', 'Covenant'];
        for (const key of sceneKeys) {
            if (this.scene.isActive(key)) {
                this.scene.stop(key);
            }
        }
        this.scene.start('LevelScene');
    }
}
