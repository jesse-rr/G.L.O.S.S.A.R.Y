import * as Phaser from 'phaser';
import { FONT_FAMILY, RUNE_FONT } from '../../../constants';
import { ItemData, ItemDefinition } from '../../../data/ItemData';
import { playScrambleAnimation, convertToRunicWords } from '../../../utils/ScrambleAnimation';
import { GlossaryUI } from '../GlossaryUI';
import { AudioManager } from '../../../utils/AudioManager';

export function getSelectedItems(): string[] {
    try {
        const data = localStorage.getItem('glossary_selected_items');
        if (data) {
            return JSON.parse(data) as string[];
        }
    } catch (_e) { }
    return [];
}

export function selectItem(id: string): void {
    const current = getSelectedItems();
    if (current.includes(id)) return;
    if (current.length >= 3) return;
    current.push(id);
    localStorage.setItem('glossary_selected_items', JSON.stringify(current));
}

export class GlossaryItemsPage {
    private scene: GlossaryUI;
    private container: Phaser.GameObjects.Container;
    private itemDefs: ItemDefinition[];
    private selectLetters: Phaser.GameObjects.Text[] = [];
    private selectHitZone: Phaser.GameObjects.Rectangle | null = null;

    constructor(scene: GlossaryUI, container: Phaser.GameObjects.Container) {
        this.scene = scene;
        this.container = container;
        this.itemDefs = ItemData.getAllItems();
    }

    render(centerX: number, height: number): void {
        const leftPageX = centerX - 510;
        const leftPageY = height - 590;
        const rightPageX = centerX + 80;
        const rightPageY = height - 660;

        this.itemDefs.forEach((def, index) => {
            const col = index % 5;
            const row = Math.floor(index / 5);
            const x = leftPageX + col * 110;
            const y = leftPageY + row * 110;

            const box = this.scene.add.image(x, y, 'book-layout').setAlpha(0.5).setInteractive({ useHandCursor: true });
            this.container.add(box);

            const isUnlocked = ItemData.getInstance().isDiscovered(def.id);
            const frame = ItemData.getItemFrame(def.id);

            const itemIcon = this.scene.add.sprite(x, y, 'items', frame)
                .setOrigin(0.5).setScale(1.2).setAlpha(isUnlocked ? 0.9 : 0.6);

            if (!isUnlocked) itemIcon.setTint(0x000000);

            box.on('pointerover', () => box.setAlpha(1));
            box.on('pointerout', () => box.setAlpha(0.5));
            box.on('pointerdown', () => this.showItemDetails(def, rightPageX, rightPageY, true));

            this.container.add(itemIcon);
        });

        if (this.itemDefs.length > 0) {
            this.showItemDetails(this.itemDefs[0], rightPageX, rightPageY, true);
        }
    }

    private showItemDetails(def: ItemDefinition, x: number, y: number, autoPlay: boolean = false, fadeInChains: boolean = false) {
        if (this.scene.currentSelectionId === def.id) return;
        this.scene.currentSelectionId = def.id;

        let startFrame = 0;
        if (this.scene.detailsContainer) {
            const oldChains = this.scene.detailsContainer.list.find(
                (child: any) => child.texture && child.texture.key === 'book-chains'
            ) as Phaser.GameObjects.Sprite | undefined;
            if (oldChains && oldChains.anims && oldChains.anims.currentFrame) {
                const idx = oldChains.anims.currentFrame.index - 1;
                startFrame = Math.max(0, idx);
            }
            this.scene.cleanupTweens();
            this.scene.detailsContainer.destroy();
        }
        this.scene.detailsContainer = this.scene.add.container(x, y);
        this.container.add(this.scene.detailsContainer);

        const isUnlocked = ItemData.getInstance().isDiscovered(def.id);
        const isViewed = ItemData.getInstance().isViewed(def.id);
        const useRunic = !isUnlocked || (isUnlocked && !isViewed);

        const frame = ItemData.getItemFrame(def.id);
        const itemIcon = this.scene.add.sprite(10, 120, 'items', frame)
            .setOrigin(0.5).setScale(1.5).setAlpha(isUnlocked ? 0.9 : 0.6);
        if (!isUnlocked) itemIcon.setTint(0x000000);

        const infoLayout = this.scene.add.image(-90, 20, 'book-layout-2').setOrigin(0).setAlpha(0.5);
        const textCenterX = 210;

        const displayNameStr = def.name;
        const abilityStr = `Ability: ${def.ability}`;
        const rarityStr = `Rarity: ${def.rarity}`;
        const costStr = `Cost: ${def.cost}`;
        const explanationOriginal = `${def.effectDescription}\n\n"${def.lore}"`;

        const title = this.scene.add.text(textCenterX, 65, useRunic ? convertToRunicWords(displayNameStr) : displayNameStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '32px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const abilityText = this.scene.add.text(textCenterX, 110, useRunic ? convertToRunicWords(abilityStr) : abilityStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '18px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const rarityText = this.scene.add.text(textCenterX, 140, useRunic ? convertToRunicWords(rarityStr) : rarityStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '18px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const costText = this.scene.add.text(textCenterX, 170, useRunic ? convertToRunicWords(costStr) : costStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '18px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const selectedItems = getSelectedItems();
        const isSelected = selectedItems.includes(def.id.toString());
        const hasReachedLimit = selectedItems.length >= 3;

        this.selectLetters = [];
        this.selectHitZone = null;

        if (isUnlocked && !isSelected && !hasReachedLimit) {
            const selectLabel = 'SELECT';
            const letterSpacing = 11;
            const selectColor = '#000000';
            const totalWidth = selectLabel.length * letterSpacing;
            const startX = 440 - totalWidth;

            for (let i = 0; i < selectLabel.length; i++) {
                const letterX = startX + i * letterSpacing;
                const letterObj = this.scene.add.text(letterX, 110, selectLabel[i], {
                    fontFamily: FONT_FAMILY,
                    fontSize: '18px',
                    color: selectColor
                }).setOrigin(0, 0);
                this.selectLetters.push(letterObj);
            }

            const hzX = 440 - totalWidth / 2;
            this.selectHitZone = this.scene.add.rectangle(hzX, 120, totalWidth, 25, 0x000000, 0)
                .setOrigin(0.5, 0.5)
                .setInteractive({ useHandCursor: true });

            let glint: Phaser.Tweens.Tween | null = null;

            const startGlint = () => {
                if (glint) glint.stop();
                const startingAlpha = this.selectLetters[0] ? this.selectLetters[0].alpha : 0.6;
                glint = this.scene.tweens.add({
                    targets: this.selectLetters,
                    alpha: { from: startingAlpha, to: 0.9 },
                    duration: 1000,
                    yoyo: true,
                    repeat: -1
                });
                this.scene.activeTweens.push(glint);
            };

            const stopGlint = () => {
                if (glint) {
                    glint.stop();
                    glint = null;
                }
            };

            startGlint();

            this.selectHitZone.on('pointerover', () => {
                stopGlint();
            });

            this.selectHitZone.on('pointerout', () => {
                startGlint();
            });

            this.selectHitZone.on('pointerdown', () => {
                this.showConfirmOverlay(def);
            });
        }

        const descLayout = this.scene.add.image(-90, 200, 'book-layout-3').setOrigin(0).setAlpha(0.5);

        const explanation = this.scene.add.text(210, 400, useRunic ? convertToRunicWords(explanationOriginal) : explanationOriginal, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '18px', color: '#000000',
            wordWrap: { width: 480 }, lineSpacing: 10, align: 'center'
        }).setOrigin(0.5).setAlpha(0.7);

        if (useRunic) explanation.setStroke('#000000', 1);

        let chainsSprite: Phaser.GameObjects.Sprite | null = null;
        if (isSelected) {
            if (!this.scene.anims.exists('book-chains-anim')) {
                this.scene.anims.create({
                    key: 'book-chains-anim',
                    frames: this.scene.anims.generateFrameNumbers('book-chains', { start: 0, end: 5 }),
                    frameRate: 8,
                    repeat: -1
                });
            }

            chainsSprite = this.scene.add.sprite(212, 289, 'book-chains')
                .setOrigin(0.5)
                .setScale(2)
                .setAlpha(fadeInChains ? 0 : 0.9);
            chainsSprite.play('book-chains-anim', false, startFrame);

            if (fadeInChains) {
                this.scene.tweens.add({
                    targets: chainsSprite,
                    alpha: 0.9,
                    duration: 600,
                    ease: 'Quad.easeOut'
                });
            }
        }

        const elements: Phaser.GameObjects.GameObject[] = [infoLayout, descLayout, itemIcon, title, abilityText, rarityText, costText, explanation];
        if (chainsSprite) {
            elements.push(chainsSprite);
        }
        if (this.selectHitZone) {
            elements.push(this.selectHitZone);
        }
        this.selectLetters.forEach(letter => {
            elements.push(letter);
        });
        this.scene.detailsContainer.add(elements);

        const triggerAnimation = () => {
            if (!isUnlocked || isViewed) return;
            this.scene.cleanupTweens();
            playScrambleAnimation(this.scene, this.scene,
                [title, abilityText, rarityText, costText, explanation],
                [displayNameStr, abilityStr, rarityStr, costStr, explanationOriginal],
                () => ItemData.getInstance().markViewed(def.id)
            );
        };

        if (autoPlay && isUnlocked && !isViewed) {
            this.scene.time.delayedCall(200, triggerAnimation);
        }
    }

    private showConfirmOverlay(def: ItemDefinition) {
        const blocker = this.scene.add.rectangle(0, 0, this.scene.scale.width, this.scene.scale.height, 0x000000, 0.4)
            .setOrigin(0)
            .setInteractive()
            .setDepth(2000);

        const centerX = this.scene.scale.width / 2;
        const centerY = this.scene.scale.height / 2;
        const overlay = this.scene.add.container(centerX, centerY).setDepth(2001);

        const bgWidth = 360;
        const bgHeight = 135;
        const dialogBg = this.scene.add.rectangle(0, 0, bgWidth, bgHeight, 0x000000, 0.95)
            .setStrokeStyle(1, 0x847E87)
            .setOrigin(0.5);

        const titleText = this.scene.add.text(0, -38, 'CONFIRM PERMANENT SELECTION', {
            fontFamily: FONT_FAMILY,
            fontSize: '13px',
            color: '#ffd700',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const msgText = this.scene.add.text(0, -26, `Do you want to permanently select "${def.name}"?\n(Limit 3 items. This choice cannot be undone.)`, {
            fontFamily: FONT_FAMILY,
            fontSize: '11px',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 3
        }).setOrigin(0.5, 0);

        const buttonWidth = 75;
        const buttonHeight = 20;

        const cancelBtn = this.scene.add.rectangle(-50, 36, buttonWidth, buttonHeight, 0x000000)
            .setStrokeStyle(1, 0x847E87)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        const cancelText = this.scene.add.text(-50, 36, 'CANCEL', {
            fontFamily: FONT_FAMILY,
            fontSize: '11px',
            color: '#847E87',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const confirmBtn = this.scene.add.rectangle(50, 36, buttonWidth, buttonHeight, 0x000000)
            .setStrokeStyle(1, 0xffd700)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        const confirmText = this.scene.add.text(50, 36, 'CONFIRM', {
            fontFamily: FONT_FAMILY,
            fontSize: '11px',
            color: '#ffd700',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        cancelBtn.on('pointerover', () => { cancelBtn.setFillStyle(0x222222); });
        cancelBtn.on('pointerout', () => { cancelBtn.setFillStyle(0x000000); });
        cancelBtn.on('pointerdown', () => {
            blocker.destroy();
            overlay.destroy();
        });

        confirmBtn.on('pointerover', () => { confirmBtn.setFillStyle(0x222222); });
        confirmBtn.on('pointerout', () => { confirmBtn.setFillStyle(0x000000); });
        confirmBtn.on('pointerdown', () => {
            new AudioManager(this.scene).playChains();
            selectItem(def.id.toString());
            blocker.destroy();
            overlay.destroy();

            if (this.selectHitZone) {
                this.selectHitZone.disableInteractive();
            }
            this.scene.cleanupTweens();

            if (this.selectLetters.length > 0) {
                this.selectLetters.forEach((letter, i) => {
                    const origX = letter.x;
                    this.scene.tweens.add({
                        targets: letter,
                        y: 110 - 15,
                        alpha: 0,
                        duration: 450,
                        delay: (this.selectLetters.length - 1 - i) * 120,
                        onUpdate: () => {
                            if (letter && letter.active) {
                                letter.x = origX + (Math.random() * 4 - 2);
                            }
                        },
                        onComplete: () => {
                            if (letter && letter.active) {
                                letter.destroy();
                            }
                            if (i === 0) {
                                this.scene.currentSelectionId = null;
                                this.showItemDetails(def, this.scene.detailsContainer.x, this.scene.detailsContainer.y, false, true);
                            }
                        }
                    });
                });
            } else {
                this.scene.currentSelectionId = null;
                this.showItemDetails(def, this.scene.detailsContainer.x, this.scene.detailsContainer.y, false, true);
            }
        });

        overlay.add([dialogBg, titleText, msgText, cancelBtn, cancelText, confirmBtn, confirmText]);
    }
}
