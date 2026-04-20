import * as Phaser from 'phaser';
import { MultiplayerData } from '../data/MultiplayerData';

export class Multiplayer extends Phaser.Scene {

    constructor() {
        super('Multiplayer');
    }

    preload() {
        const multiplayerData = MultiplayerData.getInstance();

        this.load.image('multiplayer-bg', 'assets/exports/UI/Multiplayer-UI.png');
        this.load.image('multiplayer-room-ui', 'assets/exports/UI/Multiplayer-Room-UI.png');
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

        const bg = this.add.image(centerX, centerY, 'multiplayer-bg')
            .setOrigin(0.5)
            .setScale(scale);

        const goBack = this.add.image(20, 20, 'go-back-ui')
            .setOrigin(0)
            .setScale(2)
            .setFlipX(true)
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true });

        goBack.on('pointerdown', (p: Phaser.Input.Pointer) => {
            if (p.button !== 0) return;
            this.scene.stop();
            this.scene.resume('MainMenu');
        });

        this.input.keyboard!.on('keydown-ESC', () => {
            this.scene.stop();
            this.scene.resume('MainMenu');
        });
    }
}