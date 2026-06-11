import * as Phaser from 'phaser';
import { createVignette } from '../../utils/Vignette';
import { AudioManager } from '../../utils/AudioManager';

export class Achievements extends Phaser.Scene {
    private audioManager!: AudioManager;

    constructor() {
        super('Achievements');
    }

    preload() {
        this.load.image('achievements-ui', 'assets/Models/exports/UI/Achievements-UI.png');
        this.load.image('go-back-ui', 'assets/Models/exports/UI/Go-Back-UI.png');
        this.audioManager = new AudioManager(this);
        this.audioManager.loadAudio();
    }

    create() {
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
            .setFlipX(true)
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true });

        goBack.on('pointerdown', (p: Phaser.Input.Pointer) => {
            if (p.button !== 0) return;
            this.audioManager.uiClick();
            this.scene.stop();
            this.scene.resume('MainMenu');
        });

        createVignette(this);
    }
}