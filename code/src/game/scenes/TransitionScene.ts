import { Scene } from 'phaser';

export class TransitionScene extends Scene {
    constructor() {
        super({ key: 'TransitionScene' });
    }

    create(data: { targetScene: string; targetData?: any; currentScene: string }) {
        this.scene.bringToTop();

        const centerX = this.scale.width / 2;

        const topSprite = this.add.sprite(centerX, -180, 'transition')
            .setScrollFactor(0)
            .setDepth(99999)
            .setScale(2);

        const bottomSprite = this.add.sprite(centerX, 900, 'transition')
            .setScrollFactor(0)
            .setDepth(99999)
            .setScale(2)
            .setFlipY(true);

        const durationMs = 500;
        const holdDelay = 250;

        let swapped = false;

        const handleSwap = () => {
            if (swapped) return;
            swapped = true;
            this.scene.launch(data.targetScene, data.targetData);
            this.scene.bringToTop('TransitionScene');
            if (data.currentScene) {
                this.scene.stop(data.currentScene);
            }
        };

        this.tweens.add({
            targets: topSprite,
            y: 180,
            duration: durationMs,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                handleSwap();

                this.tweens.add({
                    targets: topSprite,
                    y: -180,
                    duration: durationMs,
                    delay: holdDelay,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                        this.scene.stop();
                    }
                });
            }
        });

        this.tweens.add({
            targets: bottomSprite,
            y: 540,
            duration: durationMs,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.tweens.add({
                    targets: bottomSprite,
                    y: 900,
                    duration: durationMs,
                    delay: holdDelay,
                    ease: 'Sine.easeInOut'
                });
            }
        });
    }
}
