import * as Phaser from 'phaser';
import { RuneData } from '../data/RuneData';
import { FONT_FAMILY } from '../constants';

const RUNE_FONT = 'RuneFont';
const MAX_CHAIN_RUNES = 3;
const CHAIN_CARD_SCALE = 3;
const PICKER_CARD_SCALE = 2;
const CHAIN_CARD_W = 48 * CHAIN_CARD_SCALE;
const CHAIN_GAP = 27;
const CHAIN_SLOT_SPACING = CHAIN_CARD_W + CHAIN_GAP;

export class RunePickerSystem {
    private scene: Phaser.Scene;
    private runePickerContainer: Phaser.GameObjects.Container | null = null;
    private chainSlotContainer: Phaser.GameObjects.Container | null = null;
    private chainDimOverlay: Phaser.GameObjects.Rectangle | null = null;
    private selectedChain: string[] = [];
    private chainCards: Phaser.GameObjects.Container[] = [];
    private chainLinks: Phaser.GameObjects.Sprite[] = [];
    private pickerItems: Map<string, Phaser.GameObjects.Container> = new Map();
    private getRuneFrame: (cardType: string) => number;
    private getCovenantColor: (covenant: string) => number;
    private covenant: string;

    constructor(
        scene: Phaser.Scene,
        covenant: string,
        getRuneFrame: (cardType: string) => number,
        getCovenantColor: (covenant: string) => number
    ) {
        this.scene = scene;
        this.covenant = covenant;
        this.getRuneFrame = getRuneFrame;
        this.getCovenantColor = getCovenantColor;
    }

    createDimOverlay(): void {
        const centerX = this.scene.scale.width / 2;
        this.chainDimOverlay = this.scene.add.rectangle(
            centerX, this.scene.scale.height / 2,
            this.scene.scale.width, this.scene.scale.height,
            0x000000, 1
        ).setScrollFactor(0).setDepth(69).setAlpha(0);
    }

    createChainSlots(): void {
        this.chainSlotContainer = this.scene.add.container(0, 0)
            .setScrollFactor(0)
            .setDepth(74);
    }

    createRunePicker(): void {
        const runeData = RuneData.getInstance();
        const discovered = runeData.getDiscoveredDefinitions();
        if (discovered.length === 0) return;

        const pickerBaseY = this.scene.scale.height - 80;

        this.runePickerContainer = this.scene.add.container(0, 0)
            .setScrollFactor(0)
            .setDepth(80);

        discovered.forEach((runeDef) => {
            const itemContainer = this.scene.add.container(0, 0).setScrollFactor(0);

            const cardBg = this.scene.add.sprite(0, 0, 'rune-overlay', this.getRuneFrame(runeDef.cardType))
                .setScale(PICKER_CARD_SCALE)
                .setInteractive({ useHandCursor: true });

            const runeText = this.scene.add.text(0, -5, runeDef.letter, {
                fontSize: '56px',
                color: '#cccccc',
                fontFamily: RUNE_FONT,
                align: 'center'
            }).setOrigin(0.5, 0.5);

            const nameLabel = this.scene.add.text(0, 40, runeDef.name, {
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
                this.scene.tweens.add({
                    targets: itemContainer,
                    y: restY - 12,
                    duration: 150,
                    ease: 'Quad.easeInOut'
                });
            });

            cardBg.on('pointerout', () => {
                restY = itemContainer.getData('restY') as number;
                this.scene.tweens.add({
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

        const pickerBaseY = this.scene.scale.height - 90;
        const cardW = 48 * PICKER_CARD_SCALE;
        const cardGap = 8;
        const visible: Phaser.GameObjects.Container[] = [];

        this.pickerItems.forEach((item) => {
            if (item.visible) visible.push(item);
        });

        const totalWidth = visible.length * (cardW + cardGap) - (visible.length > 0 ? cardGap : 0);
        const startX = (this.scene.scale.width - totalWidth) / 2 + cardW / 2;

        visible.forEach((item, i) => {
            const rx = startX + i * (cardW + cardGap);
            const archOffset = this.computeArchOffset(i, visible.length);
            const targetY = pickerBaseY + archOffset;

            item.setData('restY', targetY);

            this.scene.tweens.add({
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
            this.scene.tweens.add({
                targets: this.chainDimOverlay,
                alpha: 0.7,
                duration: 250,
                ease: 'Quad.easeOut'
            });
        } else {
            this.scene.tweens.add({
                targets: this.chainDimOverlay,
                alpha: 0,
                duration: 200,
                ease: 'Quad.easeIn',
                onComplete: () => { }
            });
        }
    }

    rebuildChainDisplay(animate: boolean): void {
        for (const card of this.chainCards) {
            card.destroy();
        }
        this.chainCards = [];

        for (const link of this.chainLinks) {
            link.destroy();
        }
        this.chainLinks = [];

        this.updateDimOverlay();

        const centerX = this.scene.scale.width / 2;
        const chainY = this.scene.scale.height / 2 - 50;
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

            const chainSprite = this.scene.add.sprite(linkX + 5, chainY, 'chain-link', 0)
                .setScrollFactor(0)
                .setDepth(74)
                .setAlpha(isNewLink ? 0 : 1);

            if (i % 2 === 0) {
                chainSprite.playReverse('chain-anim');
            } else {
                chainSprite.play('chain-anim');
            }

            if (isNewLink) {
                this.scene.tweens.add({
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

            const card = this.scene.add.container(slotX, chainY)
                .setScrollFactor(0)
                .setDepth(76)
                .setAlpha(isNew ? 0 : 1);

            const bg = this.scene.add.sprite(0, 0, 'rune-overlay', def ? this.getRuneFrame(def.cardType) : 2)
                .setScale(CHAIN_CARD_SCALE)
                .setInteractive({ useHandCursor: true });

            const runeChar = this.scene.add.text(0, -8, letter, {
                fontSize: '84px',
                color: '#cccccc',
                fontFamily: RUNE_FONT,
                align: 'center'
            }).setOrigin(0.5, 0.5);

            const transLabel = this.scene.add.text(0, 60, def ? def.name : '???', {
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
                this.scene.tweens.add({
                    targets: card,
                    alpha: 1,
                    duration: 250,
                    ease: 'Quad.easeOut'
                });
            }
        }

        const combo = RuneData.findMatchingCombo(this.selectedChain);
        if (combo && totalSlots >= 2) {
            const hexColor = '#' + this.getCovenantColor(this.covenant).toString(16).padStart(6, '0');
            const comboLabel = this.scene.add.text(centerX, chainY + 125, combo.name, {
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

            const selectorLeft = this.scene.add.sprite(centerX - labelWidth / 2 - 40, chainY + 125, 'attack-selector')
                .setDepth(77)
                .setScrollFactor(0)
                .setAlpha(0)
                .play('attack-selector-anim');

            const selectorRight = this.scene.add.sprite(centerX + labelWidth / 2 + 40, chainY + 125, 'attack-selector')
                .setDepth(77)
                .setScrollFactor(0)
                .setAlpha(0)
                .setFlipX(true)
                .play('attack-selector-anim');

            this.scene.tweens.add({
                targets: [comboLabel, selectorLeft, selectorRight],
                alpha: 1,
                duration: 400,
                ease: 'Quad.easeOut'
            });

            const comboContainer = this.scene.add.container(0, 0).add([comboLabel, selectorLeft, selectorRight])
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

                this.scene.tweens.add({
                    targets: [...this.chainLinks, comboContainer],
                    alpha: 0,
                    duration: 300,
                    ease: 'Quad.easeOut',
                    onComplete: () => {
                        const actualCards = this.chainCards.filter(c => c !== comboContainer);

                        actualCards.forEach((c, idx) => {
                            c.setDepth(80 + idx);
                        });

                        this.scene.tweens.add({
                            targets: actualCards,
                            x: centerX,
                            duration: 400,
                            ease: 'Back.easeIn',
                            onComplete: () => {
                                this.scene.tweens.add({
                                    targets: actualCards,
                                    alpha: 0,
                                    scale: 0.5,
                                    duration: 300,
                                    ease: 'Quad.easeIn',
                                    onComplete: () => {
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

    reset(): void {
        this.selectedChain = [];
        this.chainCards = [];
        this.chainLinks = [];
        this.pickerItems = new Map();
    }
}
