import * as Phaser from 'phaser';
import { FONT_FAMILY, RUNE_FONT } from '../../../constants';
import { RuneData, RuneDefinition } from '../../../data/RuneData';
import { playScrambleAnimation, convertToRunicWords } from '../../../utils/ScrambleAnimation';
import { GlossaryUI } from '../GlossaryUI';

export class GlossaryRunesPage {
    private scene: GlossaryUI;
    private container: Phaser.GameObjects.Container;
    private runeDefs: RuneDefinition[];

    constructor(scene: GlossaryUI, container: Phaser.GameObjects.Container) {
        this.scene = scene;
        this.container = container;
        this.runeDefs = RuneData.getAllDefinitions();
    }

    render(centerX: number, height: number): void {
        const leftPageX = centerX - 510;
        const leftPageY = height - 590;
        const rightPageX = centerX + 80;
        const rightPageY = height - 660;

        this.runeDefs.forEach((def, index) => {
            const col = index % 5;
            const row = Math.floor(index / 5);
            const x = leftPageX + col * 110;
            const y = leftPageY + row * 110;

            const box = this.scene.add.image(x, y, 'book-layout')
                .setAlpha(0.5)
                .setInteractive({ useHandCursor: true });
            this.container.add(box);

            const isUnlocked = RuneData.getInstance().isDiscovered(def.letter);
            const runeText = this.scene.add.text(x, y, def.letter, {
                fontFamily: RUNE_FONT, fontSize: '76px', color: '#000000'
            }).setOrigin(0.5).setAlpha(isUnlocked ? 0.7 : 0.3);

            box.on('pointerover', () => box.setAlpha(1));
            box.on('pointerout', () => box.setAlpha(0.5));
            box.on('pointerdown', () => this.showRuneDetails(def, rightPageX, rightPageY, true));

            this.container.add(runeText);
        });

        if (this.runeDefs.length > 0) {
            this.showRuneDetails(this.runeDefs[0], rightPageX, rightPageY, true);
        }
    }

    private showRuneDetails(def: RuneDefinition, x: number, y: number, autoPlay: boolean = false) {
        if (this.scene.currentSelectionId === def.letter) return;
        this.scene.currentSelectionId = def.letter;

        if (this.scene.detailsContainer) {
            this.scene.cleanupTweens();
            this.scene.detailsContainer.destroy();
        }
        this.scene.detailsContainer = this.scene.add.container(x, y);
        this.container.add(this.scene.detailsContainer);

        const isUnlocked = RuneData.getInstance().isDiscovered(def.letter);
        const isViewed = RuneData.getInstance().isViewed(def.letter);
        const useRunic = !isUnlocked || (isUnlocked && !isViewed);

        const letter = this.scene.add.text(10, 130, def.letter, {
            fontFamily: RUNE_FONT, fontSize: '96px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const infoLayout = this.scene.add.image(-90, 20, 'book-layout-2').setOrigin(0).setAlpha(0.5);
        const textCenterX = 210;

        const displayNameStr = def.name;
        const typeStr = `Type: ${def.cardType.toUpperCase()}`;
        const effectStr = `Effect: ${def.effectType.toUpperCase()}`;
        const powerStr = `Base Power: ${def.basePower}`;
        const explanationOriginal = def.description;

        const title = this.scene.add.text(textCenterX, 65, useRunic ? convertToRunicWords(displayNameStr) : displayNameStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '32px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const typeText = this.scene.add.text(textCenterX, 110, useRunic ? convertToRunicWords(typeStr) : typeStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '18px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const effectText = this.scene.add.text(textCenterX, 140, useRunic ? convertToRunicWords(effectStr) : effectStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '18px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const powerText = this.scene.add.text(textCenterX, 170, useRunic ? convertToRunicWords(powerStr) : powerStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '18px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const descLayout = this.scene.add.image(-90, 200, 'book-layout-3').setOrigin(0).setAlpha(0.5);

        const explanation = this.scene.add.text(210, 400, useRunic ? convertToRunicWords(explanationOriginal) : explanationOriginal, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '18px', color: '#000000',
            wordWrap: { width: 480 }, lineSpacing: 10, align: 'center'
        }).setOrigin(0.5).setAlpha(0.7);

        if (useRunic) explanation.setStroke('#000000', 1);

        this.scene.detailsContainer.add([infoLayout, descLayout, letter, title, typeText, effectText, powerText, explanation]);

        const triggerAnimation = () => {
            if (!isUnlocked || isViewed) return;
            this.scene.cleanupTweens();
            playScrambleAnimation(this.scene, this.scene,
                [title, typeText, effectText, powerText, explanation],
                [displayNameStr, typeStr, effectStr, powerStr, explanationOriginal],
                () => RuneData.getInstance().markViewed(def.letter)
            );
        };

        if (autoPlay && isUnlocked && !isViewed) {
            this.scene.time.delayedCall(200, triggerAnimation);
        }
    }
}
