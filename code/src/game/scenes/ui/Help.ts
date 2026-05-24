import * as Phaser from 'phaser';

import { FONT_FAMILY, InputKeys } from '../../constants';

export class Help extends Phaser.Scene {
    private scrollY = 0;
    private maxScroll = 0;
    private previousScene = 'MainMenu';

    constructor() {
        super('Help');
    }

    preload() {
        this.load.font(FONT_FAMILY, 'assets/Models/exports/VCRosdNEUE.ttf');
        this.load.image('help-ui', 'assets/Models/exports/UI/Help-UI.png');
        this.load.image('settings-ui', 'assets/Models/exports/UI/Settings-UI.png');
        this.load.image('achievements-ui', 'assets/Models/exports/UI/Achievements-UI.png');
        this.load.image('controls-ui', 'assets/Models/exports/UI/Controls-UI.png');
        this.load.image('go-back-ui', 'assets/Models/exports/UI/Go-Back-UI.png');

        this.load.spritesheet('ui-items', 'assets/Models/exports/UI/UI-Items.png', {
            frameWidth: 32,
            frameHeight: 32
        });
    }

    create(data: any) {
        this.previousScene = (data && data.previousScene) ? data.previousScene : 'MainMenu';
        this.scene.bringToTop();

        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.6)
            .setOrigin(0)
            .setScrollFactor(0);

        const spacing = 20;
        const scale = 2;
        const centerX = Math.floor(this.scale.width / 2);

        let y = spacing;

        const help = this.add.image(centerX, y, 'help-ui')
            .setOrigin(0.5, 0)
            .setScale(scale);

        const HELP_PAGES = [
            'GLOSSARY is a turn-based combat and exploration game. Choose a Covenant to define your playstyle and ability, then begin your ascent. Collect Runes and chain them to craft powerful attacks.\n\nDiscover enemies, items, and locations — all cataloged in your Glossary. Seek the three combat bosses symbols to challenge yourself. Death is permanent. Explore, grow stronger.',
            'During combat, Runes are drawn to form your hand each turn. To attack, you must chain these runes together. A valid combo requires at least one Base Rune to function.\n\nDamage = (Rune Base + Combo Bonus) * Status Multipliers - Enemy Defense.',
            'There are two types of combos, Normal & Unique (In Glossary)\n\n1. Normal Combos: These receive a flat base power boost depending on the amount of runes chained.\n\n2. Unique Combos: Formed when incorporating a Unique Rune correctly. These grant a much larger damage boost and unleash stronger effects.',
            'RUNE TYPES\n\nCube = Base Rune - Initiates the chain.\nArrow = Boost Rune - Increases stats.\nDiamond = Unique Effect Rune - Applies special conditions.',
            'FINDING RUNES AND GEMSTONES\n\n- Merchant: Purchase runes and items directly.\n- Chests: Found throughout the map containing various loot.\n- Monoliths: Interacting with these triggers a combat encounter. Winning rewards you with new runes.'
        ];

        let currentPage = 0;
        const totalPages = HELP_PAGES.length;

        const helpTextObj = this.add.text(centerX, y + 125, HELP_PAGES[0], {
            fontSize: '22px',
            color: '#847E87',
            fontFamily: FONT_FAMILY,
            wordWrap: { width: 860 },
            lineSpacing: 6,
            align: 'center'
        }).setOrigin(0.5, 0);

        const paginationY = y + help.displayHeight - 50;

        const prevBtn = this.add.text(centerX - 60, paginationY, '<', { fontSize: '24px', color: '#847E87', fontFamily: FONT_FAMILY })
            .setOrigin(0.5)
            .setPadding(20)
            .setInteractive({ useHandCursor: true });

        const pageTxt = this.add.text(centerX, paginationY, `1/${totalPages}`, { fontSize: '20px', color: '#847E87', fontFamily: FONT_FAMILY })
            .setOrigin(0.5);

        const nextBtn = this.add.text(centerX + 60, paginationY, '>', { fontSize: '24px', color: '#847E87', fontFamily: FONT_FAMILY })
            .setOrigin(0.5)
            .setPadding(20)
            .setInteractive({ useHandCursor: true });

        const renderPage = () => {
            helpTextObj.setText(HELP_PAGES[currentPage]);
            pageTxt.setText(`${currentPage + 1}/${totalPages}`);
            prevBtn.setAlpha(currentPage > 0 ? 1 : 0.3);
            nextBtn.setAlpha(currentPage < totalPages - 1 ? 1 : 0.3);
        };

        renderPage();

        prevBtn.on('pointerdown', () => {
            if (currentPage > 0) {
                currentPage--;
                renderPage();
            }
        });

        nextBtn.on('pointerdown', () => {
            if (currentPage < totalPages - 1) {
                currentPage++;
                renderPage();
            }
        });

        y += help.displayHeight + spacing;

        const settings = this.add.image(centerX, y, 'settings-ui')
            .setOrigin(0.5, 0)
            .setScale(scale);

        const settingsTop = y;

        y += settings.displayHeight + spacing;

        const achievements = this.add.image(centerX, y, 'achievements-ui')
            .setOrigin(0.5, 0)
            .setScale(scale);

        const achievementsTopX = centerX - achievements.displayWidth / 2;
        const achievementsTopY = y;

        y += achievements.displayHeight + spacing;

        const controls = this.add.image(centerX, y, 'controls-ui')
            .setOrigin(0.5, 0)
            .setScale(scale);

        const controlsTopX = centerX;
        const controlsTopY = y;

        y += controls.displayHeight + spacing;

        this.maxScroll = Math.max(0, y - this.scale.height);

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (pointer.isDown) {
                this.scrollY -= pointer.velocity.y / 10;
                this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScroll);
                this.cameras.main.scrollY = Math.floor(this.scrollY);
            }
        });

        this.input.on('wheel', (_: any, __: any, ___: number, dy: number) => {
            this.scrollY += dy;
            this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScroll);
            this.cameras.main.scrollY = Math.floor(this.scrollY);
        });

        const goBack = this.add.image(20, 20, 'go-back-ui')
            .setOrigin(0)
            .setScale(2)
            .setFlipX(true)
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true });

        goBack.on('pointerdown', (p: Phaser.Input.Pointer) => {
            if (p.button !== 0) return;
            this.scene.stop('SettingsUI');
            this.scene.stop('AchievementsUI');
            this.scene.stop('ControlsUI');
            this.scene.stop();
            this.scene.resume(this.previousScene);
        });

        this.input.keyboard!.on(InputKeys.BACK, () => {
            this.scene.stop('SettingsUI');
            this.scene.stop('AchievementsUI');
            this.scene.stop('ControlsUI');
            this.scene.stop();
            this.scene.resume(this.previousScene);
        });

        this.input.keyboard!.on(InputKeys.HELP, () => {
            this.scene.stop('SettingsUI');
            this.scene.stop('AchievementsUI');
            this.scene.stop('ControlsUI');
            this.scene.stop();
            this.scene.resume(this.previousScene);
        });

        this.scene.launch('SettingsUI', {
            x: centerX,
            y: settingsTop,
            scene: this
        });
        this.scene.bringToTop('SettingsUI');

        this.scene.launch('AchievementsUI', {
            x: achievementsTopX,
            y: achievementsTopY,
            scale: scale,
            scene: this
        });
        this.scene.bringToTop('AchievementsUI');

        this.scene.launch('ControlsUI', {
            x: controlsTopX,
            y: controlsTopY,
            scale: scale,
            scene: this
        });
        this.scene.bringToTop('ControlsUI');
    }
}
