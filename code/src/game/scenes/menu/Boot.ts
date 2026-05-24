import { Scene } from 'phaser';
import { UserData } from '../../data/UserData';
import { PlayerData } from '../../data/PlayerData';
import { FONT_FAMILY, RUNE_FONT, TITLE_FONT } from '../../constants';

export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        this.load.spritesheet('homeAnim', 'assets/Models/exports/UI/Homescreen-BG-Sheet.png', {
            frameWidth: 640,
            frameHeight: 360,
        });

        this.load.spritesheet('selectorAnim', 'assets/Models/exports/UI/Homescreen-Selector-Sheet.png', {
            frameWidth: 32,
            frameHeight: 32,
        });

        this.load.image('transition', 'assets/Models/exports/UI/Transitions.png');
        this.load.image('achievement-ui', 'assets/Models/exports/UI/Achievement-UI.png');
        this.load.spritesheet('glossary', 'assets/Models/exports/Objects/Glossary.png', {
            frameWidth: 64,
            frameHeight: 64
        });

        this.load.font(RUNE_FONT, 'assets/Models/exports/RUNE.TTF')
        this.load.font(FONT_FAMILY, 'assets/Models/exports/VCRosdNEUE.ttf')
        this.load.font(TITLE_FONT, 'assets/Models/exports/OldeEnglish.ttf')

        this.registry.set('userData', UserData.getInstance());
        this.registry.set('playerData', PlayerData.getInstance());
    }

    create() {
        this.scene.launch('NotificationOverlay');
        this.scene.start('MainMenu');
    }
}
