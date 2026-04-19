import { Scene } from 'phaser';

export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // 7680×360 → 12 frames of 640×360
        this.load.spritesheet('homeAnim', 'assets/exports/UI/Homescreen-BG-Sheet.png', {
            frameWidth: 640,
            frameHeight: 360,
        });

        // 96×32 → 3 frames of 32×32
        this.load.spritesheet('selectorAnim', 'assets/exports/UI/Homescreen-Selector-Sheet.png', {
            frameWidth: 32,
            frameHeight: 32,
        });
    }

    create() {
        this.scene.start('MainMenu');
    }
}
