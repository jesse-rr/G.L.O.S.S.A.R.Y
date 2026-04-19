import * as Phaser from 'phaser';

const FONT_FAMILY = 'VCRosdNEUE';

export class Help extends Phaser.Scene {
    private scrollY = 0;
    private maxScroll = 0;

    constructor() {
        super('Help');
    }

    preload() {
        this.load.font(FONT_FAMILY, 'assets/exports/VCRosdNEUE.ttf');
        this.load.image('help-ui', 'assets/exports/UI/Help-UI.png');
        this.load.image('settings-ui', 'assets/exports/UI/Settings-UI.png');
        this.load.image('achievements-ui', 'assets/exports/UI/Achievements-UI.png');
        this.load.image('go-back-ui', 'assets/exports/UI/Go-Back-UI.png');
    }

    create() {
        this.cameras.main.roundPixels = true;

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

        const helpText =
            'GLOSSARY is a turn-based combat and exploration game. ' +
            'Choose a Covenant to define your playstyle and ability, then begin your ascent. ' +
            'Collect Runes and chain them to craft powerful attacks.\n\n' +
            'Discover enemies, items, and locations — all cataloged in your Glossary. ' +
            'Seek the three combat bosses symbols to challenge yourself. ' +
            'Death is permanent. Explore, grow stronger.\n' +
            'ASCEND';

        this.add.text(centerX, y + 125, helpText, {
            fontSize: '22px',
            color: '#847E87',
            fontFamily: FONT_FAMILY,
            wordWrap: { width: 860 },
            lineSpacing: 6,
            align: 'center'
        }).setOrigin(0.5, 0);

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
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true });

        goBack.on('pointerdown', () => {
            this.scene.stop('SettingsUI');
            this.scene.stop('AchievementsUI');
            this.scene.stop();
            this.scene.resume('MainMenu');
        });

        this.scene.launch('SettingsUI', {
            x: centerX,
            y: settingsTop,
            scene: this
        });

        this.scene.launch('AchievementsUI', {
            x: achievementsTopX,
            y: achievementsTopY,
            scale: scale,
            scene: this
        });
    }
}
