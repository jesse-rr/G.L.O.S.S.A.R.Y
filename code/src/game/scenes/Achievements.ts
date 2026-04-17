import * as Phaser from 'phaser';

export class Achievements extends Phaser.Scene {

    constructor() {
        super('Achievements');
    }

    preload() {
        this.load.image('achievements-ui', 'assets/exports/UI/Achievements-UI.png');
        this.load.image('go-back-ui', 'assets/exports/UI/Go-Back-UI.png');
    }

    create() {
        this.cameras.main.roundPixels = true;

        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.6)
            .setOrigin(0)
            .setScrollFactor(0);

        const scale = 2;
        const centerX = Math.floor(this.scale.width / 2);
        const centerY = Math.floor(this.scale.height / 2);

        this.add.image(centerX, centerY, 'achievements-ui')
            .setOrigin(0.5)
            .setScale(scale);

        const goBack = this.add.image(20, 20, 'go-back-ui')
            .setOrigin(0)
            .setScale(2)
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true });

        goBack.on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume('MainMenu');
        });
    }
}
