import { Scene, GameObjects } from 'phaser';
import { RuneData, RuneDefinition } from '../../data/RuneData';
import { ItemData, ItemDefinition } from '../../data/ItemData';
import { LocationData, SETTLEMENTS, BOSSES } from '../../data/LocationData';
import { BestiaryData, BESTIARY } from '../../data/BestiaryData';
import { FONT_FAMILY, RUNE_FONT } from '../../constants';
import {
    ScrambleContext,
    playScrambleAnimation,
    cleanupAnimations,
    convertToRunicWords
} from '../../utils/ScrambleAnimation';

export class GlossaryUI extends Scene implements ScrambleContext {
    private previousScene = 'CombatScene';
    private activeSection: number = 0;
    private contentContainer!: GameObjects.Container;
    private detailsContainer!: GameObjects.Container;
    private runeDefs = RuneData.getAllDefinitions();
    private currentBestiaryPage: number = 0;
    private currentSelectionId: string | number | null = null;
    activeTweens: Phaser.Tweens.Tween[] = [];
    activeScrambleTimers: Phaser.Time.TimerEvent[] = [];

    constructor() {
        super({ key: 'GlossaryUI' });
    }

    preload() {
        this.load.font(FONT_FAMILY, 'assets/exports/VCRosdNEUE.ttf');
        this.load.font(RUNE_FONT, 'assets/exports/RUNE.TTF');
        this.load.image('book-ui', 'assets/exports/UI/Book-UI.png');
        this.load.image('book-layout', 'assets/exports/UI/Book-Layout-1.png');
        this.load.image('book-layout-2', 'assets/exports/UI/Book-Layout-2.png');
        this.load.image('book-layout-3', 'assets/exports/UI/Book-Layout-3.png');
        this.load.image('book-layout-4', 'assets/exports/UI/Book-Layout-4.png');
        this.load.spritesheet('rune-overlay', 'assets/exports/UI/Combat-Overlay-Rune.png', {
            frameWidth: 48, frameHeight: 64
        });
        this.load.spritesheet('bookmarks-ui', 'assets/exports/UI/Bookmarks-UI.png', {
            frameWidth: 17, frameHeight: 22
        });
        this.load.spritesheet('items', 'assets/exports/Objects/Items.png', {
            frameWidth: 64, frameHeight: 64
        });
        this.load.spritesheet('glossary', 'assets/exports/Objects/Glossary.png', {
            frameWidth: 64, frameHeight: 64
        });
        this.load.spritesheet('cultist', 'assets/exports/characters/Cultist-Sheet.png', { frameWidth: 57, frameHeight: 67 });
        this.load.spritesheet('golem', 'assets/exports/characters/Golem-Sheet.png', { frameWidth: 57, frameHeight: 56 });
        this.load.spritesheet('rationalist', 'assets/exports/characters/Rationalist-Sheet.png', { frameWidth: 59, frameHeight: 73 });
        this.load.spritesheet('scavenger', 'assets/exports/characters/Scavenger-Sheet.png', { frameWidth: 59, frameHeight: 61 });
        this.load.spritesheet('slime', 'assets/exports/characters/Slime-Sheet.png', { frameWidth: 32, frameHeight: 27 });
        this.load.spritesheet('wisp', 'assets/exports/characters/Wisp-Sheet.png', { frameWidth: 27, frameHeight: 51 });
        this.load.spritesheet('map-outlines', 'assets/exports/Objects/map-outlines.png', {
            frameWidth: 192, frameHeight: 128
        });
        this.load.spritesheet('map-boss-outlines', 'assets/exports/Objects/map-boss-outlines.png', {
            frameWidth: 64, frameHeight: 128
        });
    }

    create(data: any) {
        this.previousScene = (data && data.previousScene) ? data.previousScene : 'CombatScene';
        const isPaused = data && data.isPaused;
        this.scene.bringToTop();

        const centerX = this.scale.width / 2;

        const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7)
            .setOrigin(0)
            .setScrollFactor(0)
            .setInteractive();

        const bookUI = this.add.image(centerX, this.scale.height, 'book-ui')
            .setOrigin(0.5, 1.05)
            .setScrollFactor(0)
            .setDepth(100)
            .setScale(2)
            .setInteractive();

        const bmY = this.scale.height - 688;
        const bookmarks: Phaser.GameObjects.Sprite[] = [];
        const startX = Math.floor(centerX + 315);
        const offsets = [0, 44, 86, 128];

        const bookmarkZone = this.add.rectangle(startX + 64, bmY, 162, 40, 0x000000, 0)
            .setDepth(100)
            .setScrollFactor(0)
            .setInteractive();

        bookmarkZone.on('pointerdown', (ptr: any, x: number, y: number, event: any) => {
            event.stopPropagation();
        });

        for (let i = 0; i < 4; i++) {
            const bx = startX + offsets[i];
            const bm = this.add.sprite(bx, bmY, 'bookmarks-ui', i)
                .setDepth(101)
                .setScrollFactor(0)
                .setScale(2)
                .setInteractive({ useHandCursor: true });

            bm.on('pointerover', () => { bm.setFrame(i + 4); });
            bm.on('pointerout', () => { bm.setFrame(i); });
            bm.on('pointerdown', (ptr: any, x: number, y: number, event: any) => {
                event.stopPropagation();
                this.switchSection(i);
            });
            bookmarks.push(bm);
        }

        this.contentContainer = this.add.container(0, 0).setDepth(102);
        this.switchSection(0);

        const closeGlossary = () => {
            cleanupAnimations(this);
            this.scene.stop();
            if (isPaused) {
                this.scene.resume(this.previousScene);
            }
        };

        bookUI.on('pointerdown', (ptr: any, x: number, y: number, event: any) => {
            event.stopPropagation();
        });

        overlay.on('pointerdown', closeGlossary);

        this.input.keyboard!.on('keydown-ESC', closeGlossary);
        this.input.keyboard!.on('keydown-G', closeGlossary);
    }

    private switchSection(index: number) {
        cleanupAnimations(this);
        this.activeSection = index;
        this.currentSelectionId = null;
        this.contentContainer.removeAll(true);
        this.detailsContainer = null as any;

        if (index === 0) {
            this.renderRunesSection();
        } else if (index === 1) {
            this.renderItemsSection();
        } else if (index === 2) {
            this.currentBestiaryPage = 0;
            this.renderBestiarySection();
        } else if (index === 3) {
            this.renderLocationsSection();
        } else {
            const centerX = this.scale.width / 2;
            const wipText = this.add.text(centerX, this.scale.height - 400, 'Work In Progress', {
                fontFamily: FONT_FAMILY,
                fontSize: '48px',
                color: '#000000'
            }).setOrigin(0.5).setAlpha(0.7);
            this.contentContainer.add(wipText);
        }
    }

    private renderRunesSection() {
        const centerX = this.scale.width / 2;
        const leftPageX = centerX - 510;
        const leftPageY = this.scale.height - 590;
        const rightPageX = centerX + 80;
        const rightPageY = this.scale.height - 660;

        this.runeDefs.forEach((def, index) => {
            const col = index % 5;
            const row = Math.floor(index / 5);
            const x = leftPageX + col * 110;
            const y = leftPageY + row * 110;

            const box = this.add.image(x, y, 'book-layout')
                .setAlpha(0.5)
                .setInteractive({ useHandCursor: true });
            this.contentContainer.add(box);

            const isUnlocked = RuneData.getInstance().isDiscovered(def.letter);
            const runeText = this.add.text(x, y, def.letter, {
                fontFamily: RUNE_FONT,
                fontSize: '76px',
                color: '#000000'
            }).setOrigin(0.5).setAlpha(isUnlocked ? 0.7 : 0.3);

            box.on('pointerover', () => box.setAlpha(1));
            box.on('pointerout', () => box.setAlpha(0.5));
            box.on('pointerdown', () => this.showRuneDetails(def, rightPageX, rightPageY, true));

            this.contentContainer.add(runeText);
        });

        if (this.runeDefs.length > 0) {
            this.showRuneDetails(this.runeDefs[0], rightPageX, rightPageY, true);
        }
    }

    private showRuneDetails(def: RuneDefinition, x: number, y: number, autoPlay: boolean = false) {
        if (this.currentSelectionId === def.letter) return;
        this.currentSelectionId = def.letter;

        if (this.detailsContainer) {
            cleanupAnimations(this);
            this.detailsContainer.destroy();
        }
        this.detailsContainer = this.add.container(x, y);
        this.contentContainer.add(this.detailsContainer);

        const isUnlocked = RuneData.getInstance().isDiscovered(def.letter);
        const isViewed = RuneData.getInstance().isViewed(def.letter);
        const useRunic = !isUnlocked || (isUnlocked && !isViewed);

        const letter = this.add.text(10, 130, def.letter, {
            fontFamily: RUNE_FONT, fontSize: '96px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const infoLayout = this.add.image(-90, 20, 'book-layout-2').setOrigin(0).setAlpha(0.5);
        const textCenterX = 210;

        const displayNameStr = def.name;
        const typeStr = `Type: ${def.cardType.toUpperCase()}`;
        const effectStr = `Effect: ${def.effectType.toUpperCase()}`;
        const powerStr = `Base Power: ${def.basePower}`;
        const explanationOriginal = def.description;

        const title = this.add.text(textCenterX, 65, useRunic ? convertToRunicWords(displayNameStr) : displayNameStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '32px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const typeText = this.add.text(textCenterX, 110, useRunic ? convertToRunicWords(typeStr) : typeStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '20px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const effectText = this.add.text(textCenterX, 140, useRunic ? convertToRunicWords(effectStr) : effectStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '20px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const powerText = this.add.text(textCenterX, 170, useRunic ? convertToRunicWords(powerStr) : powerStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '20px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const descLayout = this.add.image(-90, 200, 'book-layout-3').setOrigin(0).setAlpha(0.5);

        const explanation = this.add.text(210, 400, useRunic ? convertToRunicWords(explanationOriginal) : explanationOriginal, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '22px', color: '#000000',
            wordWrap: { width: 480 }, lineSpacing: 10, align: 'center'
        }).setOrigin(0.5).setAlpha(0.7);

        if (useRunic) explanation.setStroke('#000000', 1);

        this.detailsContainer.add([infoLayout, descLayout, letter, title, typeText, effectText, powerText, explanation]);

        const triggerAnimation = () => {
            if (!isUnlocked || isViewed) return;
            this.activeTweens.forEach(tween => tween.stop());
            this.activeTweens = [];
            playScrambleAnimation(this, this,
                [title, typeText, effectText, powerText, explanation],
                [displayNameStr, typeStr, effectStr, powerStr, explanationOriginal],
                () => RuneData.getInstance().markViewed(def.letter)
            );
        };

        if (autoPlay && isUnlocked && !isViewed) {
            this.time.delayedCall(200, triggerAnimation);
        }
    }

    private renderItemsSection() {
        const centerX = this.scale.width / 2;
        const leftPageX = centerX - 510;
        const leftPageY = this.scale.height - 590;
        const rightPageX = centerX + 80;
        const rightPageY = this.scale.height - 660;

        const items = ItemData.getAllItems();

        items.forEach((def, index) => {
            const col = index % 5;
            const row = Math.floor(index / 5);
            const x = leftPageX + col * 110;
            const y = leftPageY + row * 110;

            const box = this.add.image(x, y, 'book-layout').setAlpha(0.5).setInteractive({ useHandCursor: true });
            this.contentContainer.add(box);

            const isUnlocked = ItemData.getInstance().isDiscovered(def.id);
            const frame = ItemData.getItemFrame(def.id, isUnlocked);

            const itemIcon = this.add.sprite(x, y, 'items', frame)
                .setOrigin(0.5).setScale(1.2).setAlpha(isUnlocked ? 0.9 : 0.6);

            if (!isUnlocked) itemIcon.setTint(0x000000);

            box.on('pointerover', () => box.setAlpha(1));
            box.on('pointerout', () => box.setAlpha(0.5));
            box.on('pointerdown', () => this.showItemDetails(def, rightPageX, rightPageY, true));

            this.contentContainer.add(itemIcon);
        });

        if (items.length > 0) {
            this.showItemDetails(items[0], rightPageX, rightPageY, true);
        }
    }

    private showItemDetails(def: ItemDefinition, x: number, y: number, autoPlay: boolean = false) {
        if (this.currentSelectionId === def.id) return;
        this.currentSelectionId = def.id;

        if (this.detailsContainer) {
            cleanupAnimations(this);
            this.detailsContainer.destroy();
        }
        this.detailsContainer = this.add.container(x, y);
        this.contentContainer.add(this.detailsContainer);

        const isUnlocked = ItemData.getInstance().isDiscovered(def.id);
        const isViewed = ItemData.getInstance().isViewed(def.id);
        const useRunic = !isUnlocked || (isUnlocked && !isViewed);

        const frame = ItemData.getItemFrame(def.id, isUnlocked);
        const itemIcon = this.add.sprite(10, 120, 'items', frame)
            .setOrigin(0.5).setScale(1.5).setAlpha(isUnlocked ? 0.9 : 0.6);
        if (!isUnlocked) itemIcon.setTint(0x000000);

        const infoLayout = this.add.image(-90, 20, 'book-layout-2').setOrigin(0).setAlpha(0.5);
        const textCenterX = 210;

        const displayNameStr = def.name;
        const abilityStr = `Ability: ${def.ability}`;
        const rarityStr = `Rarity: ${def.rarity}`;
        const costStr = `Cost: ${def.cost}`;
        const explanationOriginal = `${def.effectDescription}\n\n"${def.lore}"`;

        const title = this.add.text(textCenterX, 65, useRunic ? convertToRunicWords(displayNameStr) : displayNameStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '32px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const abilityText = this.add.text(textCenterX, 110, useRunic ? convertToRunicWords(abilityStr) : abilityStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '20px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const rarityText = this.add.text(textCenterX, 140, useRunic ? convertToRunicWords(rarityStr) : rarityStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '20px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const costText = this.add.text(textCenterX, 170, useRunic ? convertToRunicWords(costStr) : costStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '20px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const descLayout = this.add.image(-90, 200, 'book-layout-3').setOrigin(0).setAlpha(0.5);

        const explanation = this.add.text(210, 400, useRunic ? convertToRunicWords(explanationOriginal) : explanationOriginal, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '22px', color: '#000000',
            wordWrap: { width: 480 }, lineSpacing: 10, align: 'center'
        }).setOrigin(0.5).setAlpha(0.7);

        if (useRunic) explanation.setStroke('#000000', 1);

        this.detailsContainer.add([infoLayout, descLayout, itemIcon, title, abilityText, rarityText, costText, explanation]);

        const triggerAnimation = () => {
            if (!isUnlocked || isViewed) return;
            this.activeTweens.forEach(tween => tween.stop());
            this.activeTweens = [];
            playScrambleAnimation(this, this,
                [title, abilityText, rarityText, costText, explanation],
                [displayNameStr, abilityStr, rarityStr, costStr, explanationOriginal],
                () => ItemData.getInstance().markViewed(def.id)
            );
        };

        if (autoPlay && isUnlocked && !isViewed) {
            this.time.delayedCall(200, triggerAnimation);
        }
    }

    private renderLocationsSection() {
        const centerX = this.scale.width / 2;
        const leftPageX = centerX - 590;
        const rightPageX = centerX - 5;
        const startY = this.scale.height - 660;

        const locData = LocationData.getInstance();

        const createLocationEntry = (def: LocationDefinition, index: number, x: number, isBoss: boolean) => {
            const y = startY + index * 190;
            const isUnlocked = locData.isDiscovered(def.id);
            const isViewed = locData.isViewed(def.id);
            const useRunic = !isUnlocked || (isUnlocked && !isViewed);

            const box = this.add.image(x, y, 'book-layout-4')
                .setOrigin(0).setAlpha(0.5).setInteractive({ useHandCursor: true });

            const mapIcon = this.add.sprite(x + 110, y + 100, isBoss ? 'map-boss-outlines' : 'map-outlines', def.frame)
                .setOrigin(0.5).setAlpha(isUnlocked ? 0.9 : 0.6);
            if (isBoss) mapIcon.setScale(1.5);
            if (!isUnlocked) mapIcon.setTint(0x000000);

            const titleStr = def.name;
            const explanationStr = def.description;

            const title = this.add.text(x + 230, y + 30, useRunic ? convertToRunicWords(titleStr) : titleStr, {
                fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '22px', color: '#000000',
                wordWrap: { width: 270 }, lineSpacing: 3
            }).setAlpha(0.7);

            const explanation = this.add.text(x + 230, y + 70, useRunic ? convertToRunicWords(explanationStr) : explanationStr, {
                fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '18px', color: '#000000',
                wordWrap: { width: 270 }, lineSpacing: 5
            }).setAlpha(0.7);

            if (useRunic) explanation.setStroke('#000000', 1);

            this.contentContainer.add([box, mapIcon, title, explanation]);

            let isAnimating = false;
            const triggerAnimation = () => {
                if (!isUnlocked || locData.isViewed(def.id) || isAnimating) return;
                isAnimating = true;
                this.activeTweens.forEach(tween => tween.stop());
                this.activeTweens = [];
                playScrambleAnimation(this, this,
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
                this.time.delayedCall(300 + index * 150, triggerAnimation);
            }
        };

        SETTLEMENTS.forEach((def, index) => createLocationEntry(def, index, leftPageX, false));
        BOSSES.forEach((def, index) => createLocationEntry(def, index, rightPageX, true));
    }

    private renderBestiarySection() {
        const centerX = this.scale.width / 2;
        const leftPageX = centerX - 510;
        const leftPageY = this.scale.height - 590;
        const rightPageX = centerX + 80;
        const rightPageY = this.scale.height - 660;

        const bestiaryData = BestiaryData.getInstance();
        const baseEntries = BESTIARY.filter(def => !def.id.endsWith('_2'));

        baseEntries.forEach((def, index) => {
            const col = index % 5;
            const row = Math.floor(index / 5);
            const x = leftPageX + col * 110;
            const y = leftPageY + row * 110;

            const box = this.add.image(x, y, 'book-layout').setAlpha(0.5).setInteractive({ useHandCursor: true });
            this.contentContainer.add(box);

            const isUnlocked = bestiaryData.isDiscovered(def.id);
            const sprite = this.add.sprite(x, y, def.texture, def.frame)
                .setOrigin(0.5).setScale(1.2).setAlpha(isUnlocked ? 0.9 : 0.6);
            if (!isUnlocked) sprite.setTint(0x000000);

            box.on('pointerover', () => box.setAlpha(1));
            box.on('pointerout', () => box.setAlpha(0.5));
            box.on('pointerdown', () => this.showBestiaryDetails(def, rightPageX, rightPageY, true));

            this.contentContainer.add(sprite);
        });

        if (BESTIARY.length > 0) {
            this.showBestiaryDetails(BESTIARY[0], rightPageX, rightPageY, true);
        }
    }

    private showBestiaryDetails(def: any, x: number, y: number, autoPlay: boolean = false) {
        if (this.currentSelectionId === def.id) return;
        this.currentSelectionId = def.id;

        if (this.detailsContainer) {
            cleanupAnimations(this);
            this.detailsContainer.destroy();
        }
        this.detailsContainer = this.add.container(x, y);
        this.contentContainer.add(this.detailsContainer);

        const isUnlocked = BestiaryData.getInstance().isDiscovered(def.id);
        const isViewed = BestiaryData.getInstance().isViewed(def.id);
        const useRunic = !isUnlocked || (isUnlocked && !isViewed);

        const sprite = this.add.sprite(10, 120, def.texture, def.frame)
            .setOrigin(0.5).setScale(1.5).setAlpha(isUnlocked ? 0.9 : 0.6);
        if (!isUnlocked) sprite.setTint(0x000000);

        const infoLayout = this.add.image(-90, 20, 'book-layout-2').setOrigin(0).setAlpha(0.5);
        const textCenterX = 210;

        const displayNameStr = def.name;
        const statsStr = `Rarity: ${def.rarity}\nHP: ${def.hp}\nDMG: ${def.baseDamage}`;
        const explanationOriginal = def.description;

        const title = this.add.text(textCenterX, 65, useRunic ? convertToRunicWords(displayNameStr) : displayNameStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '32px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const statsText = this.add.text(textCenterX, 140, useRunic ? convertToRunicWords(statsStr) : statsStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '20px', color: '#000000',
            align: 'center', lineSpacing: 5
        }).setOrigin(0.5).setAlpha(0.6);

        const descLayout = this.add.image(-90, 200, 'book-layout-3').setOrigin(0).setAlpha(0.5);

        const explanation = this.add.text(210, 400, useRunic ? convertToRunicWords(explanationOriginal) : explanationOriginal, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY, fontSize: '22px', color: '#000000',
            wordWrap: { width: 480 }, lineSpacing: 10, align: 'center'
        }).setOrigin(0.5).setAlpha(0.7);

        if (useRunic) explanation.setStroke('#000000', 1);

        this.detailsContainer.add([infoLayout, descLayout, sprite, title, statsText, explanation]);

        const triggerAnimation = () => {
            if (!isUnlocked || isViewed) return;
            this.activeTweens.forEach(tween => tween.stop());
            this.activeTweens = [];
            playScrambleAnimation(this, this,
                [title, statsText, explanation],
                [displayNameStr, statsStr, explanationOriginal],
                () => BestiaryData.getInstance().markViewed(def.id)
            );
        };

        if (autoPlay && isUnlocked && !isViewed) {
            this.time.delayedCall(200, triggerAnimation);
        }

        const isV1 = def.id.endsWith('_1');
        const isV2 = def.id.endsWith('_2');

        if (isV1 || isV2) {
            const baseId = def.id.split('_')[0];
            const counterpartId = isV1 ? `${baseId}_2` : `${baseId}_1`;
            const counterpartDef = BESTIARY.find((e: any) => e.id === counterpartId);

            if (counterpartDef) {
                const switchText = this.add.text(410, 120, '< >', {
                    fontFamily: FONT_FAMILY, fontSize: '40px', color: '#000000', fontStyle: 'bold'
                }).setOrigin(0.5).setAlpha(0.6).setInteractive({ useHandCursor: true });

                const versionStr = isV1 ? '1/2' : '2/2';
                const versionText = this.add.text(410, 90, versionStr, {
                    fontFamily: FONT_FAMILY, fontSize: '18px', color: '#000000'
                }).setOrigin(0.5).setAlpha(0.6);

                switchText.on('pointerover', () => switchText.setAlpha(1));
                switchText.on('pointerout', () => switchText.setAlpha(0.6));
                switchText.on('pointerdown', () => this.showBestiaryDetails(counterpartDef, x, y, true));

                this.detailsContainer.add([switchText, versionText]);
            }
        }
    }
}