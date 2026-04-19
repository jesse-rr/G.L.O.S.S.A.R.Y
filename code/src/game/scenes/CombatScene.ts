import * as Phaser from 'phaser';
import { PlayerData } from '../data/PlayerData';

const FONT_FAMILY = 'VCRosdNEUE';

export class CombatScene extends Phaser.Scene {
    private playerData: PlayerData | null = null;
    private combatTimer: number = 0;
    private timerText: Phaser.GameObjects.Text | null = null;

    constructor() {
        super('CombatScene');
    }

    preload() {
        this.load.font(FONT_FAMILY, 'assets/exports/VCRosdNEUE.ttf');
        this.load.image('battle-ui', 'assets/exports/UI/Battle-UI.png');
        this.load.spritesheet('glossary', 'assets/exports/Objects/Glossary.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('currency', 'assets/exports/Objects/Currency.png', {
            frameWidth: 16,
            frameHeight: 16
        });
    }

    create() {
        this.playerData = this.registry.get('playerData') as PlayerData;
        this.combatTimer = 0;

        const centerX = this.scale.width / 2;

        this.add.image(centerX, 0, 'battle-ui')
            .setOrigin(0.5, 0)
            .setScale(2)
            .setScrollFactor(0);

        const hpLeftX = 50;
        const hpTopY = 22;

        this.add.sprite(hpLeftX, hpTopY, 'currency', 0)
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setScale(2);

        this.add.text(hpLeftX + 40, hpTopY, `${this.playerData.hp} / ${this.playerData.maxHp}`, {
            fontSize: '18px',
            color: '#FFFFFF',
            fontFamily: FONT_FAMILY
        }).setOrigin(0, 0.5).setScrollFactor(0);

        this.timerText = this.add.text(centerX, 22, '00:00', {
            fontSize: '20px',
            color: '#FFFFFF',
            fontFamily: FONT_FAMILY,
            align: 'center'
        }).setOrigin(0.5, 0.5).setScrollFactor(0);

        const currencyRightX = this.scale.width - 200;
        const currencyTopY = 22;

        this.add.sprite(currencyRightX, currencyTopY, 'currency', 4)
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setScale(2);

        this.add.text(currencyRightX + 40, currencyTopY, `${this.playerData.gemstones}`, {
            fontSize: '20px',
            color: '#FFFFFF',
            fontFamily: FONT_FAMILY
        }).setOrigin(0, 0.5).setScrollFactor(0);

        const specialCurrencyFrame = this.getSpecialCurrencyFrame(this.playerData.covenant);
        const currencySpacing = 120;

        this.add.sprite(currencyRightX + currencySpacing, currencyTopY, 'currency', specialCurrencyFrame)
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setScale(2);

        this.add.text(currencyRightX + currencySpacing + 40, currencyTopY, `${this.playerData.specialCurrency}`, {
            fontSize: '20px',
            color: '#FFFFFF',
            fontFamily: FONT_FAMILY
        }).setOrigin(0, 0.5).setScrollFactor(0);

        const glossaryX = 30;
        const glossaryY = this.scale.height - 100;

        this.add.sprite(glossaryX, glossaryY, 'glossary', 0)
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setScale(2);

        this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });

        this.input.keyboard!.on('keydown-ESC', () => {
            this.scene.start('Covenant');
        });
    }

    private updateTimer(): void {
        this.combatTimer++;
        const minutes = Math.floor(this.combatTimer / 60);
        const seconds = this.combatTimer % 60;
        const timerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (this.timerText) {
            this.timerText.setText(timerText);
        }
    }

    private getSpecialCurrencyFrame(covenant: string): number {
        switch (covenant) {
            case 'ouroborus':
                return 1;
            case 'phoenix':
                return 2;
            case 'dragon':
                return 3;
            default:
                return 1;
        }
    }
}
