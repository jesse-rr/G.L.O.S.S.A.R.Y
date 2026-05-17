import * as Phaser from 'phaser';
import { FONT_FAMILY, RUNE_FONT } from '../../../constants';
import { LocationData, LocationDefinition, SETTLEMENTS, BOSSES, HUBS } from '../../../data/LocationData';
import { playScrambleAnimation, convertToRunicWords } from '../../../utils/ScrambleAnimation';
import { GlossaryUI } from '../GlossaryUI';

export class GlossaryLocationsPage {
    private scene: GlossaryUI;
    private container: Phaser.GameObjects.Container;

    constructor(scene: GlossaryUI, container: Phaser.GameObjects.Container) {
        this.scene = scene;
        this.container = container;
    }

    renderPage1(centerX: number, height: number): void {
        const leftPageX = centerX - 590;
        const rightPageX = centerX - 5;
        const startY = height - 660;

        const locData = LocationData.getInstance();

        const createLocationEntry = (def: LocationDefinition, index: number, x: number, isBoss: boolean) => {
            const y = startY + index * 190;
            const isUnlocked = locData.isDiscovered(def.id);
            const isViewed = locData.isViewed(def.id);
            const useRunic = !isUnlocked || (isUnlocked && !isViewed);

            const box = this.scene.add.image(x, y, 'book-layout-4')
                .setOrigin(0).setAlpha(0.5).setInteractive({ useHandCursor: true });

            const mapIcon = this.scene.add.sprite(x + 110, y + 100, isBoss ? 'map-boss-outlines' : 'map-outlines', def.frame)
                .setOrigin(0.5).setAlpha(isUnlocked ? 0.9 : 0.6);
            if (isBoss) mapIcon.setScale(1.5);
            if (!isUnlocked) mapIcon.setTint(0x000000);

            const titleStr = def.name;
            const explanationStr = def.description;

            const title = this.scene.add.text(x + 230, y + 30, useRunic ? convertToRunicWords(titleStr) : titleStr, {
                fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '22px', color: '#000000',
                wordWrap: { width: 270 }, lineSpacing: 3
            }).setAlpha(0.7);

            const explanation = this.scene.add.text(x + 230, y + 70, useRunic ? convertToRunicWords(explanationStr) : explanationStr, {
                fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '18px', color: '#000000',
                wordWrap: { width: 270 }, lineSpacing: 5
            }).setAlpha(0.7);

            if (useRunic) explanation.setStroke('#000000', 1);

            this.container.add([box, mapIcon, title, explanation]);

            let isAnimating = false;
            const triggerAnimation = () => {
                if (!isUnlocked || locData.isViewed(def.id) || isAnimating) return;
                isAnimating = true;
                this.scene.cleanupTweens();
                playScrambleAnimation(this.scene, this.scene,
                    [title, explanation],
                    [titleStr, explanationStr],
                    () => {
                        isAnimating = false;
                        locData.markViewed(def.id);
                    }
                );
            };

            if (isUnlocked && !isViewed) {
                box.on('pointerover', () => box.setAlpha(1));
                box.on('pointerout', () => box.setAlpha(0.5));
                box.on('pointerdown', triggerAnimation);
                this.scene.time.delayedCall(300 + index * 150, triggerAnimation);
            }
        };

        SETTLEMENTS.forEach((def, index) => createLocationEntry(def, index, leftPageX, false));
        BOSSES.forEach((def, index) => createLocationEntry(def, index, rightPageX, true));
    }

    renderPage2(centerX: number, height: number): void {
        const leftPageX = centerX - 590;
        const rightPageX = centerX - 5;
        const startY = height - 660;

        const locData = LocationData.getInstance();

        HUBS.forEach((def, index) => {
            const isLeft = index % 2 === 0;
            const x = isLeft ? leftPageX : rightPageX;
            const row = Math.floor(index / 2);
            const y = startY + row * 190;
            const isUnlocked = locData.isDiscovered(def.id);
            const isViewed = locData.isViewed(def.id);
            const useRunic = !isUnlocked || (isUnlocked && !isViewed);

            const box = this.scene.add.image(x, y, 'book-layout-4')
                .setOrigin(0).setAlpha(0.5).setInteractive({ useHandCursor: true });

            const textureKey = def.texture || 'map-outlines';
            const mapIcon = this.scene.add.image(x + 125, y + 100, textureKey)
                .setOrigin(0.5).setAlpha(isUnlocked ? 0.9 : 0.6).setScale(1.4);
            if (!isUnlocked) mapIcon.setTint(0x000000);

            const titleStr = def.name;
            const explanationStr = def.description;

            const title = this.scene.add.text(x + 230, y + 30, useRunic ? convertToRunicWords(titleStr) : titleStr, {
                fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '22px', color: '#000000',
                wordWrap: { width: 270 }, lineSpacing: 3
            }).setAlpha(0.7);

            const explanation = this.scene.add.text(x + 230, y + 70, useRunic ? convertToRunicWords(explanationStr) : explanationStr, {
                fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '18px', color: '#000000',
                wordWrap: { width: 270 }, lineSpacing: 5
            }).setAlpha(0.7);

            if (useRunic) explanation.setStroke('#000000', 1);

            this.container.add([box, mapIcon, title, explanation]);

            let isAnimating = false;
            const triggerAnimation = () => {
                if (!isUnlocked || locData.isViewed(def.id) || isAnimating) return;
                isAnimating = true;
                this.scene.cleanupTweens();
                playScrambleAnimation(this.scene, this.scene,
                    [title, explanation],
                    [titleStr, explanationStr],
                    () => {
                        isAnimating = false;
                        locData.markViewed(def.id);
                    }
                );
            };

            if (isUnlocked && !isViewed) {
                box.on('pointerover', () => box.setAlpha(1));
                box.on('pointerout', () => box.setAlpha(0.5));
                box.on('pointerdown', triggerAnimation);
                this.scene.time.delayedCall(300 + index * 150, triggerAnimation);
            }
        });
    }
}
