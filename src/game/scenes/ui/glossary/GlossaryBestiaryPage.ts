import * as Phaser from 'phaser';
import { FONT_FAMILY, RUNE_FONT } from '../../../constants';
import { BestiaryData, BESTIARY } from '../../../data/BestiaryData';
import { playScrambleAnimation, convertToRunicWords } from '../../../utils/ScrambleAnimation';
import { GlossaryUI } from '../GlossaryUI';

export class GlossaryBestiaryPage {
    private scene: GlossaryUI;
    private container: Phaser.GameObjects.Container;

    constructor(scene: GlossaryUI, container: Phaser.GameObjects.Container) {
        this.scene = scene;
        this.container = container;
    }

    render(centerX: number, height: number): void {
        const leftPageX = centerX - 510;
        const leftPageY = height - 590;
        const rightPageX = centerX + 80;
        const rightPageY = height - 660;

        const bestiaryData = BestiaryData.getInstance();
        const baseEntries = BESTIARY.filter(def => !def.id.endsWith('_2'));

        baseEntries.forEach((def, index) => {
            if (def.id.includes("pillar")) return;
            const col = index % 5;
            const row = Math.floor(index / 5);
            const x = leftPageX + col * 110;
            const y = leftPageY + row * 110;

            const box = this.scene.add.image(x, y, 'book-layout').setAlpha(0.5).setInteractive({ useHandCursor: true });
            this.container.add(box);

            const isUnlocked = bestiaryData.isDiscovered(def.id);
            const sprite = this.scene.add.sprite(x, y, def.texture, def.frame)
                .setOrigin(0.5).setScale(2).setAlpha(isUnlocked ? 0.9 : 0.6);
            if (!isUnlocked) sprite.setTint(0x000000);

            box.on('pointerover', () => box.setAlpha(1));
            box.on('pointerout', () => box.setAlpha(0.5));
            box.on('pointerdown', () => this.showBestiaryDetails(def, rightPageX, rightPageY, true));

            this.container.add(sprite);
        });

        if (BESTIARY.length > 0) {
            this.showBestiaryDetails(BESTIARY[0], rightPageX, rightPageY, true);
        }
    }

    private showBestiaryDetails(def: any, x: number, y: number, autoPlay: boolean = false) {
        if (this.scene.currentSelectionId === def.id) return;
        this.scene.currentSelectionId = def.id;

        if (this.scene.detailsContainer) {
            this.scene.cleanupTweens();
            this.scene.detailsContainer.destroy();
        }
        this.scene.detailsContainer = this.scene.add.container(x, y);
        this.container.add(this.scene.detailsContainer);

        const isUnlocked = BestiaryData.getInstance().isDiscovered(def.id);
        const isViewed = BestiaryData.getInstance().isViewed(def.id);
        const useRunic = !isUnlocked || (isUnlocked && !isViewed);

        const sprite = this.scene.add.sprite(10, 120, def.texture, def.frame)
            .setOrigin(0.5).setScale(1.5).setAlpha(isUnlocked ? 0.9 : 0.6);
        if (!isUnlocked) sprite.setTint(0x000000);

        const infoLayout = this.scene.add.image(-90, 20, 'book-layout-2').setOrigin(0).setAlpha(0.5);
        const textCenterX = 210;

        const displayNameStr = def.name;
        const statsStr = `Rarity: ${def.rarity}\nHP: ${def.hp}\nDMG: ${def.baseDamage}\nDEF: ${Math.floor(def.baseDamage * 0.2)}`;
        const explanationOriginal = def.description;

        const title = this.scene.add.text(textCenterX, 65, useRunic ? convertToRunicWords(displayNameStr) : displayNameStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '32px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const statsText = this.scene.add.text(textCenterX, 140, useRunic ? convertToRunicWords(statsStr) : statsStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '18px', color: '#000000',
            align: 'center', lineSpacing: 5
        }).setOrigin(0.5).setAlpha(0.6);

        const descLayout = this.scene.add.image(-90, 200, 'book-layout-3').setOrigin(0).setAlpha(0.5);

        const explanation = this.scene.add.text(210, 400, useRunic ? convertToRunicWords(explanationOriginal) : explanationOriginal, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '18px', color: '#000000',
            wordWrap: { width: 480 }, lineSpacing: 10, align: 'center'
        }).setOrigin(0.5).setAlpha(0.7);

        if (useRunic) explanation.setStroke('#000000', 1);

        this.scene.detailsContainer.add([infoLayout, descLayout, sprite, title, statsText, explanation]);

        const triggerAnimation = () => {
            if (!isUnlocked || isViewed) return;
            this.scene.cleanupTweens();
            playScrambleAnimation(this.scene, this.scene,
                [title, statsText, explanation],
                [displayNameStr, statsStr, explanationOriginal],
                () => BestiaryData.getInstance().markViewed(def.id)
            );
        };

        if (autoPlay && isUnlocked && !isViewed) {
            this.scene.time.delayedCall(200, triggerAnimation);
        }

        const isV1 = def.id.endsWith('_1');
        const isV2 = def.id.endsWith('_2');

        if (isV1 || isV2) {
            const baseId = def.id.split('_')[0];
            const counterpartId = isV1 ? `${baseId}_2` : `${baseId}_1`;
            const counterpartDef = BESTIARY.find((e: any) => e.id === counterpartId);

            if (counterpartDef) {
                const switchText = this.scene.add.text(410, 120, '< >', {
                    fontFamily: FONT_FAMILY, fontSize: '40px', color: '#000000', fontStyle: 'bold'
                }).setOrigin(0.5).setAlpha(0.6).setInteractive({ useHandCursor: true });

                const versionStr = isV1 ? '1/2' : '2/2';
                const versionText = this.scene.add.text(410, 90, versionStr, {
                    fontFamily: FONT_FAMILY, fontSize: '18px', color: '#000000'
                }).setOrigin(0.5).setAlpha(0.6);

                switchText.on('pointerover', () => switchText.setAlpha(1));
                switchText.on('pointerout', () => switchText.setAlpha(0.6));
                switchText.on('pointerdown', () => this.showBestiaryDetails(counterpartDef, x, y, true));

                this.scene.detailsContainer.add([switchText, versionText]);
            }
        }
    }
}
