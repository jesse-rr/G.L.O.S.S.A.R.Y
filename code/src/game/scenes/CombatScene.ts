import * as Phaser from 'phaser';
import { PlayerData } from '../data/PlayerData';
import { RuneData } from '../data/RuneData';

import { FONT_FAMILY } from '../constants';
import { createVignette } from '../utils/Vignette';
import { showRuneDiscoveryNotification } from '../utils/AchievementNotification';
import { CombatSystem, CombatPlayer, CombatEnemy } from '../combat/CombatSystem';

const RUNE_FONT = 'RuneFont';
const MAX_CHAIN_RUNES = 3;
const CHAIN_CARD_SCALE = 3;
const PICKER_CARD_SCALE = 2;
const CHAIN_CARD_W = 48 * CHAIN_CARD_SCALE;
const CHAIN_GAP = 27;
const CHAIN_SLOT_SPACING = CHAIN_CARD_W + CHAIN_GAP;

export class CombatScene extends Phaser.Scene {
    private playerData: PlayerData | null = null;
    private runeData: RuneData | null = null;
    private combatTimer: number = 0;
    private timerText: Phaser.GameObjects.Text | null = null;
    private combatSystem: CombatSystem | null = null;
    private playerPanelContainer: Phaser.GameObjects.Container | null = null;
    private tooltipContainer: Phaser.GameObjects.Container | null = null;

    private runePickerContainer: Phaser.GameObjects.Container | null = null;
    private chainSlotContainer: Phaser.GameObjects.Container | null = null;
    private chainDimOverlay: Phaser.GameObjects.Rectangle | null = null;
    private selectedChain: string[] = [];
    private chainCards: Phaser.GameObjects.Container[] = [];
    private chainLinks: Phaser.GameObjects.Sprite[] = [];
    private pickerItems: Map<string, Phaser.GameObjects.Container> = new Map();

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
        this.load.spritesheet('chain-link', 'assets/exports/UI/Combat-Overlay-Chains.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('bookmarks-ui', 'assets/exports/UI/Bookmarks-UI.png', {
            frameWidth: 17,
            frameHeight: 22
        });
        this.load.spritesheet('glossary', 'assets/exports/Objects/Glossary.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('attack-selector', 'assets/exports/UI/Combat-Attack-Selector.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('items', 'assets/exports/Objects/Items.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        
        // Bestiary Spritesheets
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
        this.runeData = RuneData.getInstance();
        this.combatTimer = 0;
        this.selectedChain = [];
        this.chainCards = [];
        this.chainLinks = [];
        this.pickerItems = new Map();

        // Rune generation is now handled in Covenant scene
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

        this.createPlayerPanel();

        this.chainDimOverlay = this.add.rectangle(
            centerX, this.scale.height / 2,
            this.scale.width, this.scale.height,
            0x000000, 1
        ).setScrollFactor(0).setDepth(69).setAlpha(0);

        this.createChainSlots();
        this.createRunePicker();

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

        const otherPlayers: CombatPlayer[] = [
            {
                id: 'player-2',
                name: 'Ally 1',
                covenant: 'dragon',
                stats: { hp: 80, maxHp: 100, attack: 12, defense: 4 },
                gemstones: 25,
                specialCurrency: 3,
                currentChain: { runes: ['Strength', 'Pierce'], resolvedValue: 14 },
                isLocal: false
            },
            {
                id: 'player-3',
                name: 'Ally 2',
                covenant: 'snake',
                stats: { hp: 55, maxHp: 90, attack: 8, defense: 6 },
                gemstones: 40,
                specialCurrency: 7,
                currentChain: { runes: ['Echo', 'Shield', 'Heal'], resolvedValue: 10 },
                isLocal: false
            }
        ];

        const allPlayers = [localPlayer, ...otherPlayers];

        const enemies: CombatEnemy[] = allPlayers.map((p, i) => ({
            id: `enemy-${i}`,
            name: `Golem ${i + 1}`,
            stats: { hp: 60 + i * 20, maxHp: 60 + i * 20, attack: 8 + i * 2, defense: 2 + i },
            targetPlayerId: p.id
        }));

        this.combatSystem.initCombat(allPlayers, enemies);
        this.combatSystem.startRound();
    }

    private createRunePicker(): void {
        if (!this.runeData) return;

        const discovered = this.runeData.getDiscoveredDefinitions();
        if (discovered.length === 0) return;

        const pickerBaseY = this.scale.height - 80;

        this.runePickerContainer = this.add.container(0, 0)
            .setScrollFactor(0)
            .setDepth(80);

        discovered.forEach((runeDef) => {
            const itemContainer = this.add.container(0, 0).setScrollFactor(0);

            const cardBg = this.add.sprite(0, 0, 'rune-overlay', this.getRuneFrame(runeDef.cardType))
                .setScale(PICKER_CARD_SCALE)
                .setInteractive({ useHandCursor: true });

            const runeText = this.add.text(0, -5, runeDef.letter, {
                fontSize: '56px',
                color: '#cccccc',
                fontFamily: RUNE_FONT,
                align: 'center'
            }).setOrigin(0.5, 0.5);

            const nameLabel = this.add.text(0, 40, runeDef.name, {
                fontSize: '10px',
                color: '#cccccc',
                fontFamily: FONT_FAMILY,
                align: 'center'
            }).setOrigin(0.5, 0);

            itemContainer.add([cardBg, runeText, nameLabel]);
            this.runePickerContainer!.add(itemContainer);
            this.pickerItems.set(runeDef.letter, itemContainer);

            let restY = pickerBaseY;
            itemContainer.setData('restY', restY);

            cardBg.on('pointerover', () => {
                restY = itemContainer.getData('restY') as number;
                this.tweens.add({
                    targets: itemContainer,
                    y: restY - 12,
                    duration: 150,
                    ease: 'Quad.easeInOut'
                });
            });

            cardBg.on('pointerout', () => {
                restY = itemContainer.getData('restY') as number;
                this.tweens.add({
                    targets: itemContainer,
                    y: restY,
                    duration: 150,
                    ease: 'Quad.easeInOut'
                });
            });

            cardBg.on('pointerdown', () => {
                this.addRuneToChain(runeDef.letter);
            });
        });

        this.repositionPicker();
    }

    private repositionPicker(): void {
        if (!this.runePickerContainer) return;

        const pickerBaseY = this.scale.height - 90;
        const cardW = 48 * PICKER_CARD_SCALE;
        const cardGap = 8;
        const visible: Phaser.GameObjects.Container[] = [];

        this.pickerItems.forEach((item) => {
            if (item.visible) visible.push(item);
        });

        const totalWidth = visible.length * (cardW + cardGap) - (visible.length > 0 ? cardGap : 0);
        const startX = (this.scale.width - totalWidth) / 2 + cardW / 2;

        visible.forEach((item, i) => {
            const rx = startX + i * (cardW + cardGap);
            const archOffset = this.computeArchOffset(i, visible.length);
            const targetY = pickerBaseY + archOffset;

            item.setData('restY', targetY);

            this.tweens.add({
                targets: item,
                x: rx,
                y: targetY,
                duration: 200,
                ease: 'Quad.easeInOut'
            });
        });
    }

    private computeArchOffset(index: number, total: number): number {
        if (total <= 1) return 0;
        const mid = (total - 1) / 2;
        const dist = (index - mid) / mid;
        return dist * dist * 18;
    }

    private createChainSlots(): void {
        this.chainSlotContainer = this.add.container(0, 0)
            .setScrollFactor(0)
            .setDepth(74);
    }

    private addRuneToChain(letter: string): void {
        if (this.selectedChain.length >= MAX_CHAIN_RUNES) return;
        if (this.selectedChain.includes(letter)) return;

        this.selectedChain.push(letter);

        const pickerCard = this.pickerItems.get(letter);
        if (pickerCard) {
            pickerCard.setVisible(false);
        }

        this.repositionPicker();
        this.rebuildChainDisplay(true);
    }

    private removeRuneFromChain(index: number): void {
        const letter = this.selectedChain[index];
        this.selectedChain.splice(index, 1);

        const pickerCard = this.pickerItems.get(letter);
        if (pickerCard) {
            pickerCard.setVisible(true);
        }

        this.repositionPicker();
        this.rebuildChainDisplay(false);
    }

    private updateDimOverlay(): void {
        if (!this.chainDimOverlay) return;

        if (this.selectedChain.length > 0) {
            this.tweens.add({
                targets: this.chainDimOverlay,
                alpha: 0.7,
                duration: 250,
                ease: 'Quad.easeOut'
            });
        } else {
            this.tweens.add({
                targets: this.chainDimOverlay,
                alpha: 0,
                duration: 200,
                ease: 'Quad.easeIn',
                onComplete: () => {
                }
            });
        }
    }

    private rebuildChainDisplay(animate: boolean): void {
        for (const card of this.chainCards) {
            card.destroy();
        }
        this.chainCards = [];

        for (const link of this.chainLinks) {
            link.destroy();
        }
        this.chainLinks = [];

        this.updateDimOverlay();

        const centerX = this.scale.width / 2;
        const chainY = this.scale.height / 2 - 50;
        const totalSlots = this.selectedChain.length;
        const totalWidth = (totalSlots - 1) * CHAIN_SLOT_SPACING;
        const startSlotX = Math.round(centerX - totalWidth / 2);

        if (totalSlots === 0) return;

        const lastIndex = totalSlots - 1;

        for (let i = 1; i < totalSlots; i++) {
            const prevX = startSlotX + (i - 1) * CHAIN_SLOT_SPACING;
            const slotX = startSlotX + i * CHAIN_SLOT_SPACING;
            const linkX = Math.round((prevX + slotX) / 2);

            const isNewLink = animate && i === totalSlots - 1;

            const chainSprite = this.add.sprite(linkX + 5, chainY, 'chain-link', 0)
                .setScrollFactor(0)
                .setDepth(74)
                .setAlpha(isNewLink ? 0 : 1);

            if (i % 2 === 0) {
                chainSprite.playReverse('chain-anim');
            } else {
                chainSprite.play('chain-anim');
            }

            if (isNewLink) {
                this.tweens.add({
                    targets: chainSprite,
                    alpha: 1,
                    duration: 300,
                    delay: 100,
                    ease: 'Quad.easeOut'
                });
            }

            this.chainLinks.push(chainSprite);
            this.chainSlotContainer!.add(chainSprite);
        }

        for (let i = 0; i < totalSlots; i++) {
            const slotX = startSlotX + i * CHAIN_SLOT_SPACING;
            const letter = this.selectedChain[i];
            const def = RuneData.getDefinition(letter);
            const slotIndex = i;

            const isNew = animate && i === lastIndex;

            const card = this.add.container(slotX, chainY)
                .setScrollFactor(0)
                .setDepth(76)
                .setAlpha(isNew ? 0 : 1);

            const bg = this.add.sprite(0, 0, 'rune-overlay', def ? this.getRuneFrame(def.cardType) : 2)
                .setScale(CHAIN_CARD_SCALE)
                .setInteractive({ useHandCursor: true });

            const runeChar = this.add.text(0, -8, letter, {
                fontSize: '84px',
                color: '#cccccc',
                fontFamily: RUNE_FONT,
                align: 'center'
            }).setOrigin(0.5, 0.5);

            const transLabel = this.add.text(0, 60, def ? def.name : '???', {
                fontSize: '12px',
                color: '#cccccc',
                fontFamily: FONT_FAMILY,
                align: 'center'
            }).setOrigin(0.5, 0);

            card.add([bg, runeChar, transLabel]);
            this.chainSlotContainer!.add(card);
            this.chainCards.push(card);

            bg.on('pointerdown', () => {
                this.removeRuneFromChain(slotIndex);
            });

            bg.on('pointerover', () => {
                bg.setTint(0xdddddd);
                runeChar.setAlpha(0.5);
                transLabel.setAlpha(0.5);
            });

            bg.on('pointerout', () => {
                bg.clearTint();
                runeChar.setAlpha(1);
                transLabel.setAlpha(1);
            });

            if (isNew) {
                this.tweens.add({
                    targets: card,
                    alpha: 1,
                    duration: 250,
                    ease: 'Quad.easeOut'
                });
            }
        }

        const combo = RuneData.findMatchingCombo(this.selectedChain);
        if (combo && totalSlots >= 2) {
            const hexColor = '#' + this.getCovenantColor(this.playerData!.covenant).toString(16).padStart(6, '0');
            const comboLabel = this.add.text(centerX, chainY + 125, combo.name, {
                fontSize: '16px',
                color: hexColor,
                fontFamily: FONT_FAMILY,
                align: 'center',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5, 0.5)
                .setScrollFactor(0)
                .setDepth(77)
                .setAlpha(0)
                .setInteractive({ useHandCursor: true });

            const labelWidth = comboLabel.width;

            const selectorLeft = this.add.sprite(centerX - labelWidth / 2 - 40, chainY + 125, 'attack-selector')
                .setDepth(77)
                .setScrollFactor(0)
                .setAlpha(0)
                .play('attack-selector-anim');

            const selectorRight = this.add.sprite(centerX + labelWidth / 2 + 40, chainY + 125, 'attack-selector')
                .setDepth(77)
                .setScrollFactor(0)
                .setAlpha(0)
                .setFlipX(true)
                .play('attack-selector-anim');

            this.tweens.add({
                targets: [comboLabel, selectorLeft, selectorRight],
                alpha: 1,
                duration: 400,
                ease: 'Quad.easeOut'
            });

            const comboContainer = this.add.container(0, 0).add([comboLabel, selectorLeft, selectorRight])
                .setDepth(77)
                .setScrollFactor(0);
            this.chainCards.push(comboContainer);

            comboLabel.on('pointerover', () => {
                comboLabel.setTint(0xdddddd);
            });

            comboLabel.on('pointerout', () => {
                comboLabel.clearTint();
            });

            comboLabel.on('pointerdown', () => {
                comboLabel.disableInteractive();

                // 1. Fade out chains and combo text
                this.tweens.add({
                    targets: [...this.chainLinks, comboContainer],
                    alpha: 0,
                    duration: 300,
                    ease: 'Quad.easeOut',
                    onComplete: () => {
                        // 2. Converge the cards to the center
                        const actualCards = this.chainCards.filter(c => c !== comboContainer);
                        
                        actualCards.forEach((c, idx) => {
                            c.setDepth(80 + idx); // Stack them correctly
                        });

                        this.tweens.add({
                            targets: actualCards,
                            x: centerX,
                            duration: 400,
                            ease: 'Back.easeIn',
                            onComplete: () => {
                                // 3. Fade out the stacked cards
                                this.tweens.add({
                                    targets: actualCards,
                                    alpha: 0,
                                    scale: 0.5,
                                    duration: 300,
                                    ease: 'Quad.easeIn',
                                    onComplete: () => {
                                        // Restore picker items
                                        for (const letter of this.selectedChain) {
                                            const pickerCard = this.pickerItems.get(letter);
                                            if (pickerCard) pickerCard.setVisible(true);
                                        }
                                        this.selectedChain = [];
                                        this.rebuildChainDisplay(false);
                                        this.repositionPicker();
                                    }
                                });
                            }
                        });
                    }
                });
            });
        }
    }

    private createPlayerPanel(): void {
        if (!this.combatSystem) return;

        const otherPlayers = this.combatSystem.getOtherPlayers();
        if (otherPlayers.length === 0) return;

        const iconSize = 16;
        const panelX = this.scale.width - 15 - iconSize / 2;
        const panelStartY = 100;
        const spacing = iconSize + 20;

        this.playerPanelContainer = this.add.container(5, 5)
            .setScrollFactor(0)
            .setDepth(50);

        this.tooltipContainer = this.add.container(0, 0)
            .setScrollFactor(0)
            .setDepth(60)
            .setVisible(false);

        const tooltipBg = this.add.rectangle(0, 0, 200, 130, 0x000000, 0.92)
            .setOrigin(1, 0);
        this.tooltipContainer.add(tooltipBg);

        otherPlayers.forEach((player, index) => {
            const y = panelStartY + index * spacing;
            const covenantTint = this.getCovenantTint(player.covenant);

            const icon = this.add.image(panelX, y, 'player-ui')
                .setScrollFactor(0)
                .setInteractive({ useHandCursor: true })
                .setTint(covenantTint);

            this.playerPanelContainer!.add([icon]);

            icon.on('pointerover', () => {
                const tooltipAnchorX = panelX - iconSize / 2 - 5;
                this.showPlayerTooltip(player, tooltipAnchorX, y);
                icon.setTint(0x888888);
            });

            icon.on('pointerout', () => {
                this.hidePlayerTooltip();
                icon.setTint(covenantTint);
            });
        });
    }

    private showPlayerTooltip(player: CombatPlayer, anchorX: number, anchorY: number): void {
        if (!this.tooltipContainer) return;

        while (this.tooltipContainer.list.length > 1) {
            const child = this.tooltipContainer.list[this.tooltipContainer.list.length - 1] as Phaser.GameObjects.GameObject;
            this.tooltipContainer.remove(child, true);
        }

        const tooltipX = anchorX;
        const tooltipY = anchorY - 10;

        const bg = this.tooltipContainer.list[0] as Phaser.GameObjects.Rectangle;
        bg.setPosition(0, 0);

        this.tooltipContainer.setPosition(tooltipX, tooltipY);

        const padX = -100;
        let offsetY = 12;

        const nameText = this.add.text(padX, offsetY, `${player.name}  [${player.covenant}]`, {
            fontSize: '13px',
            color: '#FFD700',
            fontFamily: FONT_FAMILY,
            align: 'center'
        }).setOrigin(0.5, 0);
        this.tooltipContainer.add(nameText);
        offsetY += 24;

        const hpText = this.add.text(padX, offsetY, `HP: ${player.stats.hp} / ${player.stats.maxHp}`, {
            fontSize: '12px',
            color: '#FFFFFF',
            fontFamily: FONT_FAMILY,
            align: 'center'
        }).setOrigin(0.5, 0);
        this.tooltipContainer.add(hpText);
        offsetY += 20;

        const gemText = this.add.text(padX, offsetY, `Gemstones: ${player.gemstones}`, {
            fontSize: '12px',
            color: '#55ddff',
            fontFamily: FONT_FAMILY,
            align: 'center'
        }).setOrigin(0.5, 0);
        this.tooltipContainer.add(gemText);
        offsetY += 20;

        let chainLabel = 'Combo: None';
        if (player.currentChain && player.currentChain.runes.length > 0) {
            chainLabel = `Combo: ${player.currentChain.runes.join(' ')}`;
        }
        const chainText = this.add.text(padX, offsetY, chainLabel, {
            fontSize: '12px',
            color: '#cccccc',
            fontFamily: FONT_FAMILY,
            wordWrap: { width: 185 },
            align: 'center'
        }).setOrigin(0.5, 0);
        this.tooltipContainer.add(chainText);
        offsetY += chainText.height + 10;

        bg.setSize(200, offsetY + 5);

        this.tooltipContainer.setVisible(true);
    }

    private hidePlayerTooltip(): void {
        if (this.tooltipContainer) {
            this.tooltipContainer.setVisible(false);
        }
    }

    private getCovenantColor(covenant: string): number {
        switch (covenant) {
            case 'dragon': return 0x734f7b;
            case 'phoenix': return 0x9e2e2e;
            case 'snake': return 0x545f67;
            default: return 0xaaaaaa;
        }
    }

    private getCovenantTint(covenant: string): number {
        switch (covenant) {
            case 'dragon': return 0x734f7b;
            case 'phoenix': return 0x9e2e2e;
            case 'snake': return 0x545f67;
            default: return 0xffffff;
        }
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
            case 'snake':
                return 1;
            case 'phoenix':
                return 2;
            case 'dragon':
                return 3;
            default:
                return 1;
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
