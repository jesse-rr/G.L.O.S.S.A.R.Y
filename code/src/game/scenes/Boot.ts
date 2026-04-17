import { Scene } from 'phaser';

export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // 7680×360 → 12 frames of 640×360
        this.load.spritesheet('homeAnim', 'assets/UI/Homescreen-Sheet-UI.png', {
            frameWidth: 640,
            frameHeight: 360,
        });

        // 60×31 → 5 frames of 12×31
        this.load.spritesheet('selectorAnim', 'assets/Animations/Homescreen-Selector-Sheet.png', {
            frameWidth: 12,
            frameHeight: 31,
        });
    }

    create() {
        this.scene.start('MainMenu');
    }
}
