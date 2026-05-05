import { Scene, GameObjects } from 'phaser';
import { RuneData, RuneDefinition } from '../data/RuneData';
import { ItemData, ItemDefinition } from '../data/ItemData';
import { LocationData, SETTLEMENTS, BOSSES } from '../data/LocationData';
import { BestiaryData, BESTIARY } from '../data/BestiaryData';
import { FONT_FAMILY } from '../constants';

const RUNE_FONT = 'RuneFont';

export class GlossaryUI extends Scene {
    private previousScene = 'CombatScene';
    private activeSection: number = 0;
    private contentContainer!: GameObjects.Container;
    private detailsContainer!: GameObjects.Container;
    private runeDefs = RuneData.getAllDefinitions();
    private currentBestiaryPage: number = 0;

    private playScrambleAnimation(texts: Phaser.GameObjects.Text[], finalTexts: string[], onComplete?: () => void) {
        let iterations = 0;
        const maxIterations = 20;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

        this.time.addEvent({
            delay: 40,
            repeat: maxIterations - 1,
            callback: () => {
                iterations++;
                const isMidway = iterations > maxIterations / 2;
                
                texts.forEach((textObj, index) => {
                    const targetText = finalTexts[index];
                    
                    if (isMidway && textObj.style.fontFamily !== FONT_FAMILY) {
                        textObj.setFontFamily(FONT_FAMILY);
                        textObj.setStroke('', 0);
                    }
                    
                    let scrambled = '';
                    for (let i = 0; i < targetText.length; i++) {
                        if (targetText[i] === ' ' || targetText[i] === '\n' || targetText[i] === ':') {
                            scrambled += targetText[i];
                        } else {
                            if (isMidway && Math.random() < (iterations - maxIterations / 2) / (maxIterations / 2)) {
                                scrambled += targetText[i];
                            } else {
                                scrambled += chars.charAt(Math.floor(Math.random() * chars.length));
                            }
                        }
                    }
                    textObj.setText(scrambled);
                });

                if (iterations === maxIterations) {
                    texts.forEach((textObj, index) => {
                        textObj.setText(finalTexts[index]);
                        textObj.setFontFamily(FONT_FAMILY);
                        textObj.setStroke('', 0);
                    });
                    if (onComplete) onComplete();
                }
            }
        });
    }

    constructor() {
        super({ key: 'GlossaryUI' });
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
        this.activeSection = index;
        this.contentContainer.removeAll(true);

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
            const isFirefox = navigator.userAgent.includes("Firefox");
            const runeText = this.add.text(x, isFirefox ? y : y + 5, def.letter, {
                fontFamily: RUNE_FONT,
                fontSize: '76px',
                color: '#000000'
            }).setOrigin(0.5)
                .setAlpha(isUnlocked ? 0.7 : 0.3);

            box.on('pointerover', () => {
                box.setAlpha(1);
            });
            box.on('pointerout', () => {
                box.setAlpha(0.5);
            });

            box.on('pointerdown', () => this.showRuneDetails(def, rightPageX, rightPageY));

            this.contentContainer.add(runeText);
        });

        if (this.runeDefs.length > 0) {
            this.showRuneDetails(this.runeDefs[0], rightPageX, rightPageY);
        }
    }

    private showRuneDetails(def: RuneDefinition, x: number, y: number) {
        if (this.detailsContainer) {
            this.detailsContainer.destroy();
        }
        this.detailsContainer = this.add.container(x, y);
        this.contentContainer.add(this.detailsContainer);

        const isUnlocked = RuneData.getInstance().isDiscovered(def.letter);
        const isViewed = RuneData.getInstance().isViewed(def.letter);
        const useRunic = !isUnlocked || (isUnlocked && !isViewed);
        const isFirefox = navigator.userAgent.includes("Firefox");

        const letter = this.add.text(10, isFirefox ? 120 : 135, def.letter, {
            fontFamily: RUNE_FONT,
            fontSize: '96px',
            color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const infoLayout = this.add.image(-90, 20, 'book-layout-2')
            .setOrigin(0)
            .setAlpha(0.5);

        const textCenterX = 210;

        const displayNameStr = def.name;
        const title = this.add.text(textCenterX, 65, useRunic ? this.convertToRunicWords(displayNameStr) : displayNameStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY,
            fontSize: '32px',
            color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const typeStr = `Type: ${def.cardType.toUpperCase()}`;
        const typeText = this.add.text(textCenterX, 110, useRunic ? this.convertToRunicWords(typeStr) : typeStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY,
            fontSize: '20px',
            color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const effectStr = `Effect: ${def.effectType.toUpperCase()}`;
        const effectText = this.add.text(textCenterX, 140, useRunic ? this.convertToRunicWords(effectStr) : effectStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY,
            fontSize: '20px',
            color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const powerStr = `Base Power: ${def.basePower}`;
        const powerText = this.add.text(textCenterX, 170, useRunic ? this.convertToRunicWords(powerStr) : powerStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY,
            fontSize: '20px',
            color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const explanationOriginal = def.description;
        const explanationText = useRunic ? this.convertToRunicWords(explanationOriginal) : explanationOriginal;

        const descLayout = this.add.image(-90, 200, 'book-layout-3')
            .setOrigin(0)
            .setAlpha(0.5);

        const explanation = this.add.text(210, 400, explanationText, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY,
            fontSize: '22px',
            color: '#000000',
            wordWrap: { width: 480 },
            lineSpacing: 10,
            align: 'center'
        }).setOrigin(0.5).setAlpha(0.7);

        if (useRunic) {
            explanation.setStroke('#000000', 1);
        }

        this.detailsContainer.add([infoLayout, descLayout, letter, title, typeText, effectText, powerText, explanation]);

        if (isUnlocked && !isViewed) {
            letter.setInteractive({ useHandCursor: true });
            
            const tween = this.tweens.add({
                targets: letter,
                alpha: 1,
                yoyo: true,
                repeat: -1,
                duration: 800
            });

            letter.once('pointerdown', () => {
                tween.stop();
                letter.setAlpha(0.7);
                this.playScrambleAnimation(
                    [title, typeText, effectText, powerText, explanation],
                    [displayNameStr, typeStr, effectStr, powerStr, explanationOriginal],
                    () => {
                        RuneData.getInstance().markViewed(def.letter);
                    }
                );
            });
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

            const box = this.add.image(x, y, 'book-layout')
                .setAlpha(0.5)
                .setInteractive({ useHandCursor: true });
            this.contentContainer.add(box);

            const isUnlocked = ItemData.getInstance().isDiscovered(def.id);
            const frame = ItemData.getItemFrame(def.id, isUnlocked);

            const itemIcon = this.add.sprite(x, y, 'items', frame)
                .setOrigin(0.5)
                .setScale(1.2)
                .setAlpha(isUnlocked ? 0.9 : 0.6);

            if (!isUnlocked) {
                itemIcon.setTint(0x000000);
            }

            box.on('pointerover', () => {
                box.setAlpha(1);
            });
            box.on('pointerout', () => {
                box.setAlpha(0.5);
            });

            box.on('pointerdown', () => this.showItemDetails(def, rightPageX, rightPageY));

            this.contentContainer.add(itemIcon);
        });

        if (items.length > 0) {
            this.showItemDetails(items[0], rightPageX, rightPageY);
        }
    }

    private showItemDetails(def: ItemDefinition, x: number, y: number) {
        if (this.detailsContainer) {
            this.detailsContainer.destroy();
        }
        this.detailsContainer = this.add.container(x, y);
        this.contentContainer.add(this.detailsContainer);

        const isUnlocked = ItemData.getInstance().isDiscovered(def.id);
        const isViewed = ItemData.getInstance().isViewed(def.id);
        const useRunic = !isUnlocked || (isUnlocked && !isViewed);

        const frame = ItemData.getItemFrame(def.id, isUnlocked);
        const itemIcon = this.add.sprite(10, 120, 'items', frame)
            .setOrigin(0.5)
            .setScale(1.5)
            .setAlpha(isUnlocked ? 0.9 : 0.6);

        if (!isUnlocked) {
            itemIcon.setTint(0x000000);
        }

        const infoLayout = this.add.image(-90, 20, 'book-layout-2')
            .setOrigin(0)
            .setAlpha(0.5);

        const textCenterX = 210;

        const displayNameStr = def.name;
        const title = this.add.text(textCenterX, 65, useRunic ? this.convertToRunicWords(displayNameStr) : displayNameStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY,
            fontSize: '32px',
            color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const abilityStr = `Ability: ${def.ability}`;
        const abilityText = this.add.text(textCenterX, 110, useRunic ? this.convertToRunicWords(abilityStr) : abilityStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY,
            fontSize: '20px',
            color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const rarityStr = `Rarity: ${def.rarity}`;
        const rarityText = this.add.text(textCenterX, 140, useRunic ? this.convertToRunicWords(rarityStr) : rarityStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY,
            fontSize: '20px',
            color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const costStr = `Cost: ${def.cost}`;
        const costText = this.add.text(textCenterX, 170, useRunic ? this.convertToRunicWords(costStr) : costStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY,
            fontSize: '20px',
            color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const explanationOriginal = `${def.effectDescription}\n\n"${def.lore}"`;
        const explanationText = useRunic ? this.convertToRunicWords(explanationOriginal) : explanationOriginal;

        const descLayout = this.add.image(-90, 200, 'book-layout-3')
            .setOrigin(0)
            .setAlpha(0.5);

        const explanation = this.add.text(210, 400, explanationText, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY,
            fontSize: '22px',
            color: '#000000',
            wordWrap: { width: 480 },
            lineSpacing: 10,
            align: 'center'
        }).setOrigin(0.5).setAlpha(0.7);

        if (useRunic) {
            explanation.setStroke('#000000', 1);
        }

        this.detailsContainer.add([infoLayout, descLayout, itemIcon, title, abilityText, rarityText, costText, explanation]);
        
        if (isUnlocked && !isViewed) {
            itemIcon.setInteractive({ useHandCursor: true });
            
            const tween = this.tweens.add({
                targets: itemIcon,
                alpha: 1,
                yoyo: true,
                repeat: -1,
                duration: 800
            });

            itemIcon.once('pointerdown', () => {
                tween.stop();
                itemIcon.setAlpha(0.9);
                this.playScrambleAnimation(
                    [title, abilityText, rarityText, costText, explanation],
                    [displayNameStr, abilityStr, rarityStr, costStr, explanationOriginal],
                    () => {
                        ItemData.getInstance().markViewed(def.id);
                    }
                );
            });
        }
    }

    private convertToRunicWords(text: string): string {
        return text.toString()
            .replace(/[0-9]/g, (match) => {
                const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
                return words[parseInt(match)];
            })
            .replace(/%/g, ' percent');
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
                .setOrigin(0)
                .setAlpha(0.5);

            const mapIcon = this.add.sprite(x + 110, y + 100, isBoss ? 'map-boss-outlines' : 'map-outlines', def.frame)
                .setOrigin(0.5)
                .setAlpha(isUnlocked ? 0.9 : 0.6);
            if (isBoss) mapIcon.setScale(1.5);

            if (!isUnlocked) {
                mapIcon.setTint(0x000000);
            }

            const titleStr = def.name;
            const title = this.add.text(x + 230, y + 30, useRunic ? this.convertToRunicWords(titleStr) : titleStr, {
                fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY,
                fontSize: '24px',
                color: '#000000'
            }).setAlpha(0.7);

            const explanationStr = def.description;
            const descText = useRunic ? this.convertToRunicWords(explanationStr) : explanationStr;

            const explanation = this.add.text(x + 230, y + 70, descText, {
                fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY,
                fontSize: '20px',
                color: '#000000',
                wordWrap: { width: 290 },
                lineSpacing: 5
            }).setAlpha(0.7);

            if (useRunic) explanation.setStroke('#000000', 1);

            this.contentContainer.add([box, mapIcon, title, explanation]);

            if (isUnlocked && !isViewed) {
                mapIcon.setInteractive({ useHandCursor: true });
                const tween = this.tweens.add({
                    targets: mapIcon,
                    alpha: 1,
                    yoyo: true,
                    repeat: -1,
                    duration: 800
                });
                mapIcon.once('pointerdown', () => {
                    tween.stop();
                    mapIcon.setAlpha(0.9);
                    this.playScrambleAnimation(
                        [title, explanation],
                        [titleStr, explanationStr],
                        () => locData.markViewed(def.id)
                    );
                });
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

            const box = this.add.image(x, y, 'book-layout')
                .setAlpha(0.5)
                .setInteractive({ useHandCursor: true });
            this.contentContainer.add(box);

            const isUnlocked = bestiaryData.isDiscovered(def.id);

            const sprite = this.add.sprite(x, y, def.texture, def.frame)
                .setOrigin(0.5)
                .setScale(1.2)
                .setAlpha(isUnlocked ? 0.9 : 0.6);

            if (!isUnlocked) {
                sprite.setTint(0x000000);
            }

            box.on('pointerover', () => {
                box.setAlpha(1);
            });
            box.on('pointerout', () => {
                box.setAlpha(0.5);
            });

            box.on('pointerdown', () => this.showBestiaryDetails(def, rightPageX, rightPageY));

            this.contentContainer.add(sprite);
        });

        if (BESTIARY.length > 0) {
            this.showBestiaryDetails(BESTIARY[0], rightPageX, rightPageY);
        }
    }

    private showBestiaryDetails(def: any, x: number, y: number) {
        if (this.detailsContainer) {
            this.detailsContainer.destroy();
        }
        this.detailsContainer = this.add.container(x, y);
        this.contentContainer.add(this.detailsContainer);

        const isUnlocked = BestiaryData.getInstance().isDiscovered(def.id);
        const isViewed = BestiaryData.getInstance().isViewed(def.id);
        const useRunic = !isUnlocked || (isUnlocked && !isViewed);

        const sprite = this.add.sprite(10, 120, def.texture, def.frame)
            .setOrigin(0.5)
            .setScale(1.5)
            .setAlpha(isUnlocked ? 0.9 : 0.6);

        if (!isUnlocked) {
            sprite.setTint(0x000000);
        }

        const infoLayout = this.add.image(-90, 20, 'book-layout-2')
            .setOrigin(0)
            .setAlpha(0.5);

        const textCenterX = 210;

        const displayNameStr = def.name;
        const title = this.add.text(textCenterX, 65, useRunic ? this.convertToRunicWords(displayNameStr) : displayNameStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY,
            fontSize: '32px',
            color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const statsStr = `Rarity: ${def.rarity}\nHP: ${def.hp}\nDMG: ${def.baseDamage}`;
        const statsText = this.add.text(textCenterX, 140, useRunic ? this.convertToRunicWords(statsStr) : statsStr, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY,
            fontSize: '20px',
            color: '#000000',
            align: 'center',
            lineSpacing: 5
        }).setOrigin(0.5).setAlpha(0.6);

        const explanationOriginal = def.description;
        const explanationText = useRunic ? this.convertToRunicWords(explanationOriginal) : explanationOriginal;

        const descLayout = this.add.image(-90, 200, 'book-layout-3')
            .setOrigin(0)
            .setAlpha(0.5);

        const explanation = this.add.text(210, 400, explanationText, {
            fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY,
            fontSize: '22px',
            color: '#000000',
            wordWrap: { width: 480 },
            lineSpacing: 10,
            align: 'center'
        }).setOrigin(0.5).setAlpha(0.7);

        if (useRunic) {
            explanation.setStroke('#000000', 1);
        }

        this.detailsContainer.add([infoLayout, descLayout, sprite, title, statsText, explanation]);
        
        if (isUnlocked && !isViewed) {
            sprite.setInteractive({ useHandCursor: true });
            
            const tween = this.tweens.add({
                targets: sprite,
                alpha: 1,
                yoyo: true,
                repeat: -1,
                duration: 800
            });

            sprite.once('pointerdown', () => {
                tween.stop();
                sprite.setAlpha(0.9);
                this.playScrambleAnimation(
                    [title, statsText, explanation],
                    [displayNameStr, statsStr, explanationOriginal],
                    () => {
                        BestiaryData.getInstance().markViewed(def.id);
                    }
                );
            });
        }

        const isV1 = def.id.endsWith('_1');
        const isV2 = def.id.endsWith('_2');

        if (isV1 || isV2) {
            const baseId = def.id.split('_')[0];
            const counterpartId = isV1 ? `${baseId}_2` : `${baseId}_1`;
            const counterpartDef = BESTIARY.find((e: any) => e.id === counterpartId);

            if (counterpartDef) {
                const switchText = this.add.text(410, 120, '< >', {
                    fontFamily: FONT_FAMILY,
                    fontSize: '40px',
                    color: '#000000',
                    fontStyle: 'bold'
                }).setOrigin(0.5).setAlpha(0.6).setInteractive({ useHandCursor: true });

                const versionStr = isV1 ? '1/2' : '2/2';
                const versionText = this.add.text(410, 90, versionStr, {
                    fontFamily: FONT_FAMILY,
                    fontSize: '18px',
                    color: '#000000'
                }).setOrigin(0.5).setAlpha(0.6);

                switchText.on('pointerover', () => switchText.setAlpha(1));
                switchText.on('pointerout', () => switchText.setAlpha(0.6));
                switchText.on('pointerdown', () => {
                    this.showBestiaryDetails(counterpartDef, x, y);
                });

                this.detailsContainer.add([switchText, versionText]);
            }
        }
    }
}
