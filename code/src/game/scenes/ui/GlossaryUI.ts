import { Scene, GameObjects } from 'phaser';
import { FONT_FAMILY, InputKeys, RUNE_FONT } from '../../constants';
import {
    ScrambleContext,
    cleanupAnimations
} from '../../utils/ScrambleAnimation';
import { GlossaryProloguePage } from './glossary/GlossaryProloguePage';
import { GlossaryPlayerPage } from './glossary/GlossaryPlayerPage';
import { GlossaryRunesPage } from './glossary/GlossaryRunesPage';
import { GlossaryItemsPage } from './glossary/GlossaryItemsPage';
import { GlossaryBestiaryPage } from './glossary/GlossaryBestiaryPage';
import { GlossaryLocationsPage } from './glossary/GlossaryLocationsPage';
import { GlossaryCombosPage } from './glossary/GlossaryCombosPage';
import { GlossarySlatesPage } from './glossary/GlossarySlatesPage';

export class GlossaryUI extends Scene implements ScrambleContext {
    private previousScene = 'CombatScene';
    private contentContainer!: GameObjects.Container;
    public detailsContainer!: GameObjects.Container | null;
    public currentSelectionId: string | number | null = null;
    private currentPage: number = 0;
    private readonly totalPages: number = 10;
    private prevArrow!: GameObjects.Text;
    private nextArrow!: GameObjects.Text;
    private prevHitZone!: GameObjects.Rectangle;
    private nextHitZone!: GameObjects.Rectangle;
    public activeTweens: Phaser.Tweens.Tween[] = [];
    public activeScrambleTimers: Phaser.Time.TimerEvent[] = [];

    public cleanupTweens(): void {
        this.activeTweens.forEach(t => t.stop());
        this.activeTweens = [];
    }

    constructor() {
        super({ key: 'GlossaryUI' });
    }

    preload() {
        this.load.font(FONT_FAMILY, 'assets/Models/exports/VCRosdNEUE.ttf');
        this.load.font(RUNE_FONT, 'assets/Models/exports/RUNE.TTF');
        this.load.image('book-ui', 'assets/Models/exports/UI/Book-UI.png');
        this.load.image('book-layout', 'assets/Models/exports/UI/Book-Layout-1.png');
        this.load.image('book-layout-2', 'assets/Models/exports/UI/Book-Layout-2.png');
        this.load.image('book-layout-3', 'assets/Models/exports/UI/Book-Layout-3.png');
        this.load.image('book-layout-4', 'assets/Models/exports/UI/Book-Layout-4.png');
        this.load.image('book-layout-5', 'assets/Models/exports/UI/Book-Layout-5.png');
        this.load.spritesheet('rune-overlay', 'assets/Models/exports/UI/Combat-Overlay-Rune.png', {
            frameWidth: 48, frameHeight: 64
        });
        this.load.spritesheet('book-chains', 'assets/Models/exports/UI/Book-v2-Chains-Sheet.png', {
            frameWidth: 281, frameHeight: 296
        });
        this.load.spritesheet('bookmarks-ui', 'assets/Models/exports/UI/Bookmarks-UI.png', {
            frameWidth: 17, frameHeight: 22
        });
        this.load.spritesheet('items', 'assets/Models/exports/Objects/Items.png', {
            frameWidth: 64, frameHeight: 64
        });
        this.load.spritesheet('glossary', 'assets/Models/exports/Objects/Glossary.png', {
            frameWidth: 64, frameHeight: 64
        });
        this.load.spritesheet('cultist', 'assets/Models/exports/characters/Cultist-Sheet.png', { frameWidth: 57, frameHeight: 67 });
        this.load.spritesheet('golem', 'assets/Models/exports/characters/Golem-Sheet.png', { frameWidth: 57, frameHeight: 56 });
        this.load.spritesheet('rationalist', 'assets/Models/exports/characters/Rationalist-Sheet.png', { frameWidth: 59, frameHeight: 73 });
        this.load.spritesheet('scavenger', 'assets/Models/exports/characters/Scavenger-Sheet.png', { frameWidth: 59, frameHeight: 61 });
        this.load.spritesheet('slime', 'assets/Models/exports/characters/Slime-Sheet.png', { frameWidth: 32, frameHeight: 27 });
        this.load.spritesheet('wisp', 'assets/Models/exports/characters/Wisp-Sheet.png', { frameWidth: 27, frameHeight: 51 });
        this.load.spritesheet('map-outlines', 'assets/Models/exports/Objects/map-outlines.png', {
            frameWidth: 192, frameHeight: 128
        });
        this.load.spritesheet('map-boss-outlines', 'assets/Models/exports/Objects/map-boss-outlines.png', {
            frameWidth: 64, frameHeight: 128
        });
        this.load.image('map-central-hub', 'assets/Models/exports/Objects/map-central-hub.png');
        this.load.image('map-trade-hub', 'assets/Models/exports/Objects/map-trade-hub.png');
    }

    create(data: any) {
        if (data && data.slateId) {
            localStorage.setItem('glossary_selected_slate_id', data.slateId);
        }
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
        const offsets = [-40, 2, 44, 86, 128];

        const bookmarkZone = this.add.rectangle(startX + 43, bmY, 210, 40, 0x000000, 0)
            .setDepth(100)
            .setScrollFactor(0)
            .setInteractive();

        bookmarkZone.on('pointerdown', (_ptr: any, _x: number, _y: number, event: any) => {
            event.stopPropagation();
        });

        for (let i = 0; i < 5; i++) {
            const bx = startX + offsets[i];
            const bm = this.add.sprite(bx, bmY, 'bookmarks-ui', i)
                .setDepth(101)
                .setScrollFactor(0)
                .setScale(2)
                .setInteractive({ useHandCursor: true });

            bm.on('pointerover', () => { bm.setFrame(i + 5); });
            bm.on('pointerout', () => { bm.setFrame(i); });
            bm.on('pointerdown', (_ptr: any, _x: number, _y: number, event: any) => {
                event.stopPropagation();
                this.switchSection(i);
            });
            bookmarks.push(bm);
        }

        this.contentContainer = this.add.container(0, 0).setDepth(102);

        const navY = this.scale.height - 100;
        this.prevArrow = this.add.text(centerX - 550, navY, '<', {
            fontFamily: FONT_FAMILY, fontSize: '32px', color: '#000000', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0.35).setDepth(103);

        this.nextArrow = this.add.text(centerX + 550, navY, '>', {
            fontFamily: FONT_FAMILY, fontSize: '32px', color: '#000000', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0.35).setDepth(103);

        this.prevHitZone = this.add.rectangle(centerX - 550, navY, 40, 50, 0x000000, 0)
            .setDepth(104).setInteractive({ useHandCursor: true });
        this.nextHitZone = this.add.rectangle(centerX + 550, navY, 40, 50, 0x000000, 0)
            .setDepth(104).setInteractive({ useHandCursor: true });

        this.prevHitZone.on('pointerover', () => this.prevArrow.setAlpha(0.7));
        this.prevHitZone.on('pointerout', () => this.prevArrow.setAlpha(0.35));
        this.prevHitZone.on('pointerdown', (_ptr: any, _x: number, _y: number, event: any) => {
            event.stopPropagation();
            if (this.currentPage > 0) {
                this.currentPage--;
                this.navigateToPage(this.currentPage);
            }
        });

        this.nextHitZone.on('pointerover', () => this.nextArrow.setAlpha(0.7));
        this.nextHitZone.on('pointerout', () => this.nextArrow.setAlpha(0.35));
        this.nextHitZone.on('pointerdown', (_ptr: any, _x: number, _y: number, event: any) => {
            event.stopPropagation();
            if (this.currentPage < this.totalPages - 1) {
                this.currentPage++;
                this.navigateToPage(this.currentPage);
            }
        });

        const startPage = (data && typeof data.openPage === 'number') ? data.openPage : 0;
        this.navigateToPage(startPage);

        const closeGlossary = () => {
            cleanupAnimations(this);
            this.scene.stop();
            if (isPaused) {
                this.scene.resume(this.previousScene);
            }
        };

        bookUI.on('pointerdown', (_ptr: any, _x: number, _y: number, event: any) => {
            event.stopPropagation(); ``
        });

        overlay.on('pointerdown', closeGlossary);

        this.input.keyboard!.on(InputKeys.BACK, closeGlossary);
        this.input.keyboard!.on(InputKeys.GLOSSARY, closeGlossary);

        this.input.keyboard!.on(InputKeys.LEFT, () => {
            if (this.currentPage > 0) {
                this.currentPage--;
                this.navigateToPage(this.currentPage);
            }
        });

        this.input.keyboard!.on(InputKeys.RIGHT, () => {
            if (this.currentPage < this.totalPages - 1) {
                this.currentPage++;
                this.navigateToPage(this.currentPage);
            }
        });
    }

    private navigateToPage(page: number) {
        this.currentPage = page;
        cleanupAnimations(this);
        this.currentSelectionId = null;
        this.contentContainer.removeAll(true);
        this.detailsContainer = null;

        if (page === 0) {
            this.renderFrontPageSection();
        } else if (page === 1) {
            this.renderInfoPage2();
        } else if (page === 2) {
            this.renderCombosSection();
        } else if (page === 3) {
            this.renderSlatesSection();
        } else if (page === 4) {
            this.renderPlayerPage();
        } else if (page === 5) {
            this.renderRunesSection();
        } else if (page === 6) {
            this.renderItemsSection();
        } else if (page === 7) {
            this.renderBestiarySection();
        } else if (page === 8) {
            this.renderLocationsSection();
        } else if (page === 9) {
            this.renderLocationsPage2();
        }

        this.updateNavArrows();
    }

    private updateNavArrows() {
        const pointer = this.input.activePointer;
        const prevHovered = this.prevHitZone.getBounds().contains(pointer.x, pointer.y);
        const nextHovered = this.nextHitZone.getBounds().contains(pointer.x, pointer.y);

        if (this.currentPage <= 0) {
            this.prevArrow.setAlpha(0.15);
            this.prevHitZone.disableInteractive();
        } else {
            this.prevArrow.setAlpha(prevHovered ? 0.7 : 0.35);
            this.prevHitZone.setInteractive({ useHandCursor: true });
        }

        if (this.currentPage >= this.totalPages - 1) {
            this.nextArrow.setAlpha(0.15);
            this.nextHitZone.disableInteractive();
        } else {
            this.nextArrow.setAlpha(nextHovered ? 0.7 : 0.35);
            this.nextHitZone.setInteractive({ useHandCursor: true });
        }
    }

    private switchSection(index: number) {
        const pageMap: Record<number, number> = { 0: 0, 1: 5, 2: 6, 3: 7, 4: 8 };
        this.navigateToPage(pageMap[index] ?? index);
    }

    private renderFrontPageSection() {
        const prologuePage = new GlossaryProloguePage(this, this.contentContainer);
        prologuePage.renderFrontPage(this.scale.width / 2, this.scale.height);
    }

    private renderPlayerPage() {
        const playerPage = new GlossaryPlayerPage(this, this.contentContainer);
        playerPage.render(this.scale.width / 2, this.scale.height);
    }

    private renderInfoPage2() {
        const prologuePage = new GlossaryProloguePage(this, this.contentContainer);
        prologuePage.renderInfoPage(this.scale.width / 2, this.scale.height);
    }

    private renderRunesSection() {
        const runesPage = new GlossaryRunesPage(this, this.contentContainer);
        runesPage.render(this.scale.width / 2, this.scale.height);
    }

    private renderItemsSection() {
        const itemsPage = new GlossaryItemsPage(this, this.contentContainer);
        itemsPage.render(this.scale.width / 2, this.scale.height);
    }

    private renderLocationsSection() {
        const locationsPage = new GlossaryLocationsPage(this, this.contentContainer);
        locationsPage.renderPage1(this.scale.width / 2, this.scale.height);
    }

    private renderLocationsPage2() {
        const locationsPage = new GlossaryLocationsPage(this, this.contentContainer);
        locationsPage.renderPage2(this.scale.width / 2, this.scale.height);
    }

    private renderBestiarySection() {
        const bestiaryPage = new GlossaryBestiaryPage(this, this.contentContainer);
        bestiaryPage.render(this.scale.width / 2, this.scale.height);
    }

    private renderCombosSection() {
        const combosPage = new GlossaryCombosPage(this, this.contentContainer);
        combosPage.render(this.scale.width / 2, this.scale.height);
    }

    private renderSlatesSection() {
        const slatesPage = new GlossarySlatesPage(this, this.contentContainer);
        slatesPage.render(this.scale.width / 2, this.scale.height);
    }
}