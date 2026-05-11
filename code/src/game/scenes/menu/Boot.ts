import { Scene } from 'phaser';
import { UserData } from '../../data/UserData';
import { PlayerData } from '../../data/PlayerData';

export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        this.load.spritesheet('homeAnim', 'assets/exports/UI/Homescreen-BG-Sheet.png', {
            frameWidth: 640,
            frameHeight: 360,
        });

        this.load.spritesheet('selectorAnim', 'assets/exports/UI/Homescreen-Selector-Sheet.png', {
            frameWidth: 32,
            frameHeight: 32,
        });

        this.load.image('transition', 'assets/exports/UI/Transitions.png');
        this.load.image('achievement-ui', 'assets/exports/UI/Achievement-UI.png');
        this.load.spritesheet('glossary', 'assets/exports/Objects/Glossary.png', {
            frameWidth: 64,
            frameHeight: 64
        });

        this.registry.set('userData', UserData.getInstance());
        this.registry.set('playerData', PlayerData.getInstance());
    }

    create() {
        this.scene.launch('NotificationOverlay');
        this.scene.start('MainMenu');
    }
}
