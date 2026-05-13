import * as Phaser from 'phaser';
import { PlayerData } from '../../data/PlayerData';
import { FONT_FAMILY, COVENANT_COLORS, COVENANT_TINTS } from '../../constants';
import { createVignette } from '../../utils/Vignette';
import { CombatSystem, CombatPlayer, CombatEnemy } from '../../combat/CombatSystem';
import { RunePickerSystem } from '../../systems/RunePickerSystem';
import { PlayerPanelSystem } from '../../systems/PlayerPanelSystem';

const RUNE_FONT = 'RuneFont';

export class CombatScene extends Phaser.Scene {
    private playerData: PlayerData | null = null;
    private combatTimer: number = 0;
    private timerText: Phaser.GameObjects.Text | null = null;
    private currentTurn: Number = 1;
    private combatSystem: CombatSystem | null = null;
    private runePickerSystem: RunePickerSystem | null = null;
    private playerPanelSystem: PlayerPanelSystem | null = null;

    constructor() {
        super('CombatScene');
    }

    preload() {
        this.load.font(FONT_FAMILY, 'assets/exports/VCRosdNEUE.ttf');
        this.load.font(RUNE_FONT, 'assets/exports/RUNE.TTF');
        this.load.image('battle-ui', 'assets/exports/UI/Battle-UI.png');
        this.load.image('book-ui', 'assets/exports/UI/Book-UI.png');
        this.load.image('book-layout', 'assets/exports/UI/Book-Layout-1.png');
        this.load.image('book-layout-2', 'assets/exports/UI/Book-Layout-2.png');
        this.load.image('book-layout-3', 'assets/exports/UI/Book-Layout-3.png');
        this.load.image('book-layout-4', 'assets/exports/UI/Book-Layout-4.png');
        this.load.image('player-ui', 'assets/exports/UI/Player-UI.png');
        this.load.spritesheet('rune-overlay', 'assets/exports/UI/Combat-Overlay-Rune.png', {
            frameWidth: 48,
            frameHeight: 64
        });
        this.load.image('achievement-ui', 'assets/exports/UI/Achievement-UI.png');
        this.load.image('settings-btn', 'assets/exports/UI/Settings-Btn.png');
        this.load.spritesheet('chain-link', 'assets/exports/UI/Combat-Overlay-Chains.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('bookmarks-ui', 'assets/exports/UI/Bookmarks-UI.png', {
            frameWidth: 17,
            frameHeight: 22
        });

        this.load.spritesheet('attack-selector', 'assets/exports/UI/Combat-Attack-Selector.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('items', 'assets/exports/Objects/Items.png', {
            frameWidth: 64,
            frameHeight: 64
        });

        this.load.spritesheet('cultist', 'assets/exports/characters/Cultist-Sheet.png', { frameWidth: 57, frameHeight: 67 });
        this.load.spritesheet('golem', 'assets/exports/characters/Golem-Sheet.png', { frameWidth: 57, frameHeight: 56 });
        this.load.spritesheet('rationalist', 'assets/exports/characters/Rationalist-Sheet.png', { frameWidth: 59, frameHeight: 73 });
        this.load.spritesheet('scavenger', 'assets/exports/characters/Scavenger-Sheet.png', { frameWidth: 59, frameHeight: 61 });
        this.load.spritesheet('slime', 'assets/exports/characters/Slime-Sheet.png', { frameWidth: 32, frameHeight: 27 });
        this.load.spritesheet('wisp', 'assets/exports/characters/Wisp-Sheet.png', { frameWidth: 27, frameHeight: 51 });
        this.load.spritesheet('map-outlines', 'assets/exports/Objects/map-outlines.png', {
            frameWidth: 192,
            frameHeight: 128
        });
        this.load.spritesheet('map-boss-outlines', 'assets/exports/Objects/map-boss-outlines.png', {
            frameWidth: 64,
            frameHeight: 128
        });
        this.load.spritesheet('currency', 'assets/exports/Objects/Currency.png', {
            frameWidth: 16,
            frameHeight: 16
        });
    }

    create() {
        this.cameras.main.setBackgroundColor('#FFFFFF');
        this.playerData = this.registry.get('playerData') as PlayerData;
        this.combatTimer = 0;

        this.initCombatSystem();

        if (!this.anims.exists('chain-anim')) {
            this.anims.create({
                key: 'chain-anim',
                frames: this.anims.generateFrameNumbers('chain-link', { start: 0, end: 5 }),
                frameRate: 8,
                repeat: -1
            });
        }

        if (!this.anims.exists('attack-selector-anim')) {
            this.anims.create({
                key: 'attack-selector-anim',
                frames: this.anims.generateFrameNumbers('attack-selector', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1,
                yoyo: true
            });
        }

        const centerX = this.scale.width / 2;

        this.add.image(centerX, 0, 'battle-ui')
            .setOrigin(0.5, 0)
            .setScale(2)
            .setScrollFactor(0);

        this.createHUD(centerX);
        this.createPlayerPanel();

        this.runePickerSystem = new RunePickerSystem(
            this,
            this.playerData.covenant,
            this.getRuneFrame.bind(this),
            (cov) => COVENANT_COLORS[cov] ?? COVENANT_COLORS['default']
        );
        this.runePickerSystem.createDimOverlay();
        this.runePickerSystem.createChainSlots();
        this.runePickerSystem.createRunePicker();

        const glossaryX = 30;
        const glossaryY = this.scale.height - 100;

        const glossaryBtn = this.add.sprite(glossaryX, glossaryY, 'glossary', 0)
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setScale(2)
            .setInteractive({ useHandCursor: true });

        glossaryBtn.on('pointerdown', () => {
            if (!this.scene.isActive('GlossaryUI')) {
                this.scene.pause();
                this.scene.launch('GlossaryUI', { previousScene: 'CombatScene', isPaused: true });
            }
        });

        const settingsX = this.scale.width - 15;
        const settingsY = this.scale.height - 15;

        const settingsBtn = this.add.sprite(settingsX, settingsY, 'settings-btn')
            .setOrigin(1, 1)
            .setScrollFactor(0)
            .setScale(1)
            .setInteractive({ useHandCursor: true });

        settingsBtn.on('pointerover', () => {
            settingsBtn.setTint(0xaaaaaa);
        });

        settingsBtn.on('pointerout', () => {
            settingsBtn.clearTint();
        });

        settingsBtn.on('pointerdown', () => {
            if (!this.scene.isActive('Help')) {
                this.scene.pause();
                this.scene.launch('Help', { previousScene: 'CombatScene' });
            }
        });

        this.input.keyboard!.on('keydown-Q', () => {
            if (!this.scene.isPaused()) {
                this.scene.pause();
                this.scene.launch('Help', { previousScene: 'CombatScene' });
            }
        });

        this.input.keyboard!.on('keydown-G', () => {
            if (!this.scene.isActive('GlossaryUI')) {
                this.scene.pause();
                this.scene.launch('GlossaryUI', { previousScene: 'CombatScene', isPaused: true });
            }
        });

        this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });

        createVignette(this);
    }

    private createHUD(centerX: number): void {
        const hpLeftX = 50;
        const hpTopY = 22;

        this.add.sprite(hpLeftX, hpTopY, 'currency', 0)
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setScale(2);

        this.add.text(hpLeftX + 40, hpTopY, `${this.playerData!.hp} / ${this.playerData!.maxHp}`, {
            fontSize: '18px',
            color: '#FFFFFF',
            fontFamily: FONT_FAMILY
        }).setOrigin(0, 0.5).setScrollFactor(0);

        this.timerText = this.add.text(centerX, 22, '00:00' + " - " + this.currentTurn, {
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

        this.add.text(currencyRightX + 40, currencyTopY, `${this.playerData!.gemstones}`, {
            fontSize: '20px',
            color: '#FFFFFF',
            fontFamily: FONT_FAMILY
        }).setOrigin(0, 0.5).setScrollFactor(0);

        const specialCurrencyFrame = this.getSpecialCurrencyFrame(this.playerData!.covenant);
        const currencySpacing = 120;

        this.add.sprite(currencyRightX + currencySpacing, currencyTopY, 'currency', specialCurrencyFrame)
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setScale(2);

        this.add.text(currencyRightX + currencySpacing + 40, currencyTopY, `${this.playerData!.specialCurrency}`, {
            fontSize: '20px',
            color: '#FFFFFF',
            fontFamily: FONT_FAMILY
        }).setOrigin(0, 0.5).setScrollFactor(0);
    }

    private initCombatSystem(): void {
        this.combatSystem = new CombatSystem();

        const localPlayer: CombatPlayer = {
            id: 'local',
            name: 'You',
            covenant: this.playerData!.covenant,
            stats: {
                hp: this.playerData!.hp,
                maxHp: this.playerData!.maxHp,
                attack: 10,
                defense: 3
            },
            gemstones: this.playerData!.gemstones,
            specialCurrency: this.playerData!.specialCurrency,
            currentChain: null,
            isLocal: true
        };

        const allPlayers = [localPlayer];

        const enemies: CombatEnemy[] = allPlayers.map((p, i) => ({
            id: `enemy-${i}`,
            name: `Golem ${i + 1}`,
            stats: { hp: 60 + i * 20, maxHp: 60 + i * 20, attack: 8 + i * 2, defense: 2 + i },
            targetPlayerId: p.id
        }));

        this.combatSystem.initCombat(allPlayers, enemies);
        this.combatSystem.startRound();
    }

    private createPlayerPanel(): void {
        if (!this.combatSystem) return;

        this.playerPanelSystem = new PlayerPanelSystem(this);
        this.playerPanelSystem.create(
            this.combatSystem.getOtherPlayers(),
            (cov) => COVENANT_TINTS[cov] ?? COVENANT_TINTS['default']
        );
    }

    private updateTimer(): void {
        this.combatTimer++;
        const minutes = Math.floor(this.combatTimer / 60);
        const seconds = this.combatTimer % 60;
        const timerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (this.timerText) {
            this.timerText.setText(timerText + " - " + this.currentTurn);
        }
    }

    private getSpecialCurrencyFrame(covenant: string): number {
        switch (covenant) {
            case 'snake': return 1;
            case 'phoenix': return 2;
            case 'dragon': return 3;
            default: return 1;
        }
    }

    private getRuneFrame(cardType: string): number {
        switch (cardType) {
            case 'boost': return 0;
            case 'unique': return 1;
            case 'base': return 2;
            default: return 2;
        }
    }
}
