import * as Phaser from 'phaser';
import { FONT_FAMILY, RUNE_FONT } from '../../../constants';
import { ItemData, ItemDefinition } from '../../../data/ItemData';
import { playScrambleAnimation, convertToRunicWords } from '../../../utils/ScrambleAnimation';
import { GlossaryUI } from '../GlossaryUI';

export class GlossaryItemsPage {
    private scene: GlossaryUI;
    private container: Phaser.GameObjects.Container;
    private itemDefs: ItemDefinition[];

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

    private showItemDetails(def: ItemDefinition, x: number, y: number, autoPlay: boolean = false) {
        if (this.scene.currentSelectionId === def.id) return;
        this.scene.currentSelectionId = def.id;

        if (this.scene.detailsContainer) {
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
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '20px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const rarityText = this.scene.add.text(textCenterX, 140, useRunic ? convertToRunicWords(rarityStr) : rarityStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '20px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const costText = this.scene.add.text(textCenterX, 170, useRunic ? convertToRunicWords(costStr) : costStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '20px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const descLayout = this.scene.add.image(-90, 200, 'book-layout-3').setOrigin(0).setAlpha(0.5);

        const explanation = this.scene.add.text(210, 400, useRunic ? convertToRunicWords(explanationOriginal) : explanationOriginal, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '22px', color: '#000000',
            wordWrap: { width: 480 }, lineSpacing: 10, align: 'center'
        }).setOrigin(0.5).setAlpha(0.7);

        if (useRunic) explanation.setStroke('#000000', 1);

        this.scene.detailsContainer.add([infoLayout, descLayout, itemIcon, title, abilityText, rarityText, costText, explanation]);

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
}
