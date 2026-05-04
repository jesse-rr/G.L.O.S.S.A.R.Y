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
            const runeText = this.add.text(x, y, def.letter, {
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



        const letter = this.add.text(10, 120, def.letter, {
            fontFamily: RUNE_FONT,
            fontSize: '96px',
            color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const infoLayout = this.add.image(-90, 20, 'book-layout-2')
            .setOrigin(0)
            .setAlpha(0.5);

        const textCenterX = 210;

        const displayName = isUnlocked ? def.name : '???';

        const title = this.add.text(textCenterX, 65, displayName, {
            fontFamily: FONT_FAMILY,
            fontSize: '32px',
            color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const typeText = this.add.text(textCenterX, 110, `Type: ${isUnlocked ? def.cardType.toUpperCase() : '???'}`, {
            fontFamily: FONT_FAMILY,
            fontSize: '20px',
            color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const effectText = this.add.text(textCenterX, 140, `Effect: ${isUnlocked ? def.effectType.toUpperCase() : '???'}`, {
            fontFamily: FONT_FAMILY,
            fontSize: '20px',
            color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const powerText = this.add.text(textCenterX, 170, `Base Power: ${isUnlocked ? def.basePower : '???'}`, {
            fontFamily: FONT_FAMILY,
            fontSize: '20px',
            color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        let explanationText = def.description;
        if (!isUnlocked) {
            explanationText = this.convertToRunicWords(explanationText);
        }

        const descLayout = this.add.image(-90, 200, 'book-layout-3')
            .setOrigin(0)
            .setAlpha(0.5);

        const explanation = this.add.text(210, 400, explanationText, {
            fontFamily: isUnlocked ? FONT_FAMILY : RUNE_FONT,
            fontSize: '22px',
            color: '#000000',
            wordWrap: { width: 480 },
            lineSpacing: 10,
            align: 'center'
        }).setOrigin(0.5).setAlpha(0.7);

        if (!isUnlocked) {
            explanation.setStroke('#000000', 1);
        }

        this.detailsContainer.add([infoLayout, descLayout, letter, title, typeText, effectText, powerText, explanation]);
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

        const displayName = isUnlocked ? def.name : '???';

        const title = this.add.text(textCenterX, 65, displayName, {
            fontFamily: FONT_FAMILY,
            fontSize: '32px',
            color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const abilityText = this.add.text(textCenterX, 110, `Ability: ${isUnlocked ? def.ability : '???'}`, {
            fontFamily: FONT_FAMILY,
            fontSize: '20px',
            color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const rarityText = this.add.text(textCenterX, 140, `Rarity: ${isUnlocked ? def.rarity : '???'}`, {
            fontFamily: FONT_FAMILY,
            fontSize: '20px',
            color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const costText = this.add.text(textCenterX, 170, `Cost: ${isUnlocked ? def.cost : '???'}`, {
            fontFamily: FONT_FAMILY,
            fontSize: '20px',
            color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        let explanationText = `${def.effectDescription}\n\n"${def.lore}"`;
        if (!isUnlocked) {
            explanationText = this.convertToRunicWords(explanationText);
        }

        const descLayout = this.add.image(-90, 200, 'book-layout-3')
            .setOrigin(0)
            .setAlpha(0.5);

        const explanation = this.add.text(210, 400, explanationText, {
            fontFamily: isUnlocked ? FONT_FAMILY : RUNE_FONT,
            fontSize: '22px',
            color: '#000000',
            wordWrap: { width: 480 },
            lineSpacing: 10,
            align: 'center'
        }).setOrigin(0.5).setAlpha(0.7);

        if (!isUnlocked) {
            explanation.setStroke('#000000', 1);
        }

        this.detailsContainer.add([infoLayout, descLayout, itemIcon, title, abilityText, rarityText, costText, explanation]);
    }

    private convertToRunicWords(text: string): string {
        return text
            .replace(/404/g, 'four hundred four')
            .replace(/50%/g, 'fifty percent')
            .replace(/30%/g, 'thirty percent')
            .replace(/20%/g, 'twenty percent')
            .replace(/15%/g, 'fifteen percent')
            .replace(/10%/g, 'ten percent')
            .replace(/5%/g, 'five percent')
            .replace(/\b1\b/g, 'one')
            .replace(/\b3\b/g, 'three')
            .replace(/%/g, ' percent');
    }

    private renderLocationsSection() {
        const centerX = this.scale.width / 2;
        const leftPageX = centerX - 590;
        const rightPageX = centerX - 5;
        const startY = this.scale.height - 660;

        const locData = LocationData.getInstance();


        SETTLEMENTS.forEach((def, index) => {
            const y = startY + index * 190;
            const isUnlocked = locData.isDiscovered(def.id);

            const box = this.add.image(leftPageX, y, 'book-layout-4')
                .setOrigin(0)
                .setAlpha(0.5);

            const mapIcon = this.add.sprite(leftPageX + 110, y + 100, 'map-outlines', def.frame)
                .setOrigin(0.5)
                .setAlpha(isUnlocked ? 0.9 : 0.6);

            if (!isUnlocked) {
                mapIcon.setTint(0x000000);
            }

            const title = this.add.text(leftPageX + 230, y + 30, isUnlocked ? def.name : '???', {
                fontFamily: FONT_FAMILY,
                fontSize: '24px',
                color: '#000000'
            }).setAlpha(0.7);

            let descText = def.description;
            if (!isUnlocked) descText = this.convertToRunicWords(descText);

            const explanation = this.add.text(leftPageX + 230, y + 70, descText, {
                fontFamily: isUnlocked ? FONT_FAMILY : RUNE_FONT,
                fontSize: '20px',
                color: '#000000',
                wordWrap: { width: 290 },
                lineSpacing: 5
            }).setAlpha(0.7);

            if (!isUnlocked) explanation.setStroke('#000000', 1);

            this.contentContainer.add([box, mapIcon, title, explanation]);
        });


        BOSSES.forEach((def, index) => {
            const y = startY + index * 190;
            const isUnlocked = locData.isDiscovered(def.id);

            const box = this.add.image(rightPageX, y, 'book-layout-4')
                .setOrigin(0)
                .setAlpha(0.5);

            const mapIcon = this.add.sprite(rightPageX + 110, y + 100, 'map-boss-outlines', def.frame)
                .setOrigin(0.5)
                .setScale(1.5)
                .setAlpha(isUnlocked ? 0.9 : 0.6);

            if (!isUnlocked) {
                mapIcon.setTint(0x000000);
            }

            const title = this.add.text(rightPageX + 230, y + 30, isUnlocked ? def.name : '???', {
                fontFamily: FONT_FAMILY,
                fontSize: '24px',
                color: '#000000'
            }).setAlpha(0.7);

            let descText = def.description;
            if (!isUnlocked) descText = this.convertToRunicWords(descText);

            const explanation = this.add.text(rightPageX + 230, y + 70, descText, {
                fontFamily: isUnlocked ? FONT_FAMILY : RUNE_FONT,
                fontSize: '20px',
                color: '#000000',
                wordWrap: { width: 290 },
                lineSpacing: 5
            }).setAlpha(0.7);

            if (!isUnlocked) explanation.setStroke('#000000', 1);

            this.contentContainer.add([box, mapIcon, title, explanation]);
        });
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

        const displayName = isUnlocked ? def.name : '???';

        const title = this.add.text(textCenterX, 65, displayName, {
            fontFamily: FONT_FAMILY,
            fontSize: '32px',
            color: '#000000'
        }).setOrigin(0.5).setAlpha(0.7);

        const rarityVal = isUnlocked ? def.rarity : '???';
        const hpVal = isUnlocked ? def.hp : '???';
        const dmgVal = isUnlocked ? def.baseDamage : '???';

        const statsStr = `Rarity: ${rarityVal}\nHP: ${hpVal}\nDMG: ${dmgVal}`;

        const statsText = this.add.text(textCenterX, 140, statsStr, {
            fontFamily: FONT_FAMILY,
            fontSize: '20px',
            color: '#000000',
            align: 'center',
            lineSpacing: 5
        }).setOrigin(0.5).setAlpha(0.6);

        let explanationText = def.description;
        if (!isUnlocked) {
            explanationText = this.convertToRunicWords(explanationText);
        }

        const descLayout = this.add.image(-90, 200, 'book-layout-3')
            .setOrigin(0)
            .setAlpha(0.5);

        const explanation = this.add.text(210, 400, explanationText, {
            fontFamily: isUnlocked ? FONT_FAMILY : RUNE_FONT,
            fontSize: '22px',
            color: '#000000',
            wordWrap: { width: 480 },
            lineSpacing: 10,
            align: 'center'
        }).setOrigin(0.5).setAlpha(0.7);

        if (!isUnlocked) {
            explanation.setStroke('#000000', 1);
        }

        this.detailsContainer.add([infoLayout, descLayout, sprite, title, statsText, explanation]);

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
