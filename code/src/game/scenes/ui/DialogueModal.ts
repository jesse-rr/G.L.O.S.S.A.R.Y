import * as Phaser from 'phaser';
import { FONT_FAMILY, InputKeys } from '../../constants';

export class DialogueModal extends Phaser.Scene {
    private previousScene = 'LevelScene';

    constructor() {
        super('DialogueModal');
    }

    create(data: { text: string, previousScene?: string }) {
        this.previousScene = data.previousScene || 'LevelScene';
        this.scene.bringToTop();

        const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0)
            .setOrigin(0)
            .setScrollFactor(0);

        this.tweens.add({
            targets: overlay,
            fillAlpha: 0.65,
            duration: 300
        });

        const boxWidth = 620;
        const boxHeight = 190;
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        const container = this.add.container(centerX, centerY);

        const bg = this.add.rectangle(0, 0, boxWidth, boxHeight, 0x141417, 0.95)
            .setStrokeStyle(2, 0xd4a574, 0.8)
            .setOrigin(0.5);

        const innerBorder = this.add.rectangle(0, 0, boxWidth - 12, boxHeight - 12, 0x000000, 0)
            .setStrokeStyle(1, 0xffffff, 0.1)
            .setOrigin(0.5);

        const text = this.add.text(0, -15, data.text, {
            fontFamily: FONT_FAMILY,
            fontSize: '18px',
            color: '#e4dacf',
            align: 'center',
            wordWrap: { width: boxWidth - 60 },
            lineSpacing: 8
        }).setOrigin(0.5);

        const closeHint = this.add.text(0, boxHeight / 2 - 25, 'press X or ESC to continue', {
            fontFamily: FONT_FAMILY,
            fontSize: '12px',
            color: '#847e87',
            align: 'center'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: closeHint,
            alpha: 0.4,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        container.add([bg, innerBorder, text, closeHint]);

        container.setScale(0.85);
        container.setAlpha(0);
        this.tweens.add({
            targets: container,
            scale: 1,
            alpha: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });

        const close = () => {
            this.input.keyboard?.removeAllListeners();
            this.input.removeAllListeners();

            this.tweens.add({
                targets: container,
                scale: 0.95,
                alpha: 0,
                duration: 200,
                ease: 'Quad.easeIn',
                onComplete: () => {
                    this.scene.stop();
                    this.scene.resume(this.previousScene);
                }
            });

            this.tweens.add({
                targets: overlay,
                fillAlpha: 0,
                duration: 200
            });
        };

        overlay.setInteractive();
        overlay.on('pointerdown', close);
        bg.setInteractive();
        bg.on('pointerdown', close);

        this.input.keyboard?.on(InputKeys.INTERACT, close);
        this.input.keyboard?.on(InputKeys.BACK, close);
    }
}
