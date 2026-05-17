import * as Phaser from 'phaser';
import { FONT_FAMILY } from '../constants';

export class CombatHUD {
    private scene: Phaser.Scene;
    private timerText: Phaser.GameObjects.Text | null = null;
    private hpHudText: Phaser.GameObjects.Text | null = null;
    private scHudText: Phaser.GameObjects.Text | null = null;
    private turnIndicator: Phaser.GameObjects.Text | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    create(centerX: number, hp: number, maxHp: number, gemstones: number, specialCurrency: number, specialCurrencyFrame: number): void {
        const hpLeftX = 50;
        const hpTopY = 22;

        this.scene.add.sprite(hpLeftX, hpTopY, 'currency', 0)
            .setOrigin(0, 0.5).setScrollFactor(0).setScale(2);

        this.hpHudText = this.scene.add.text(hpLeftX + 40, hpTopY, `${hp} / ${maxHp}`, {
            fontSize: '18px', color: '#FFFFFF', fontFamily: FONT_FAMILY
        }).setOrigin(0, 0.5).setScrollFactor(0);

        this.timerText = this.scene.add.text(centerX, 22, '00:00 - 1', {
            fontSize: '20px', color: '#FFFFFF', fontFamily: FONT_FAMILY, align: 'center'
        }).setOrigin(0.5, 0.5).setScrollFactor(0);

        const currencyRightX = this.scene.scale.width - 200;
        const currencyTopY = 22;

        this.scene.add.sprite(currencyRightX, currencyTopY, 'currency', 4)
            .setOrigin(0, 0.5).setScrollFactor(0).setScale(2);
        this.scene.add.text(currencyRightX + 40, currencyTopY, `${gemstones}`, {
            fontSize: '20px', color: '#FFFFFF', fontFamily: FONT_FAMILY
        }).setOrigin(0, 0.5).setScrollFactor(0);

        const currencySpacing = 120;

        this.scene.add.sprite(currencyRightX + currencySpacing, currencyTopY, 'currency', specialCurrencyFrame)
            .setOrigin(0, 0.5).setScrollFactor(0).setScale(2);
        this.scHudText = this.scene.add.text(currencyRightX + currencySpacing + 40, currencyTopY, `${specialCurrency}`, {
            fontSize: '20px', color: '#FFFFFF', fontFamily: FONT_FAMILY
        }).setOrigin(0, 0.5).setScrollFactor(0);

        this.turnIndicator = this.scene.add.text(centerX, 55, 'YOUR TURN', {
            fontSize: '14px', color: '#FFD700', fontFamily: FONT_FAMILY, align: 'center'
        }).setOrigin(0.5, 0.5).setScrollFactor(0);
    }

    update(combatTimer: number, currentRound: number, specialCurrency: number): void {
        if (this.timerText) {
            const minutes = Math.floor(combatTimer / 60);
            const seconds = combatTimer % 60;
            const timerStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            this.timerText.setText(`${timerStr} - ${currentRound}`);
        }
        if (this.scHudText) {
            this.scHudText.setText(`${specialCurrency}`);
        }
    }

    setTurnText(text: string): void {
        if (this.turnIndicator) this.turnIndicator.setText(text);
    }

    updateHpText(hp: number, maxHp: number): void {
        if (this.hpHudText) {
            this.hpHudText.setText(`${hp} / ${maxHp}`);
        }
    }

    showDamageNumber(x: number, y: number, value: number, color: string, prefix: string = '-'): void {
        const dmgText = this.scene.add.text(x, y, `${prefix}${value}`, {
            fontFamily: FONT_FAMILY, fontSize: '28px', color, fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

        this.scene.tweens.add({
            targets: dmgText, y: y - 50, alpha: 0, duration: 1000, ease: 'Quad.easeOut',
            onComplete: () => dmgText.destroy()
        });
    }

    showFloatingText(x: number, y: number, text: string, color: string): void {
        const t = this.scene.add.text(x, y, text, {
            fontFamily: FONT_FAMILY, fontSize: '18px', color, fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

        this.scene.tweens.add({
            targets: t, y: y - 40, alpha: 0, duration: 1500, ease: 'Quad.easeOut',
            onComplete: () => t.destroy()
        });
    }
}
