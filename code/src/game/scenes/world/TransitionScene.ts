import { Scene } from 'phaser';

export class TransitionScene extends Scene {
    private static isPlaying = false;

    constructor() {
        super({ key: 'TransitionScene' });
    }

    create(data: { targetScene: string; targetData?: any; currentScene: string }) {
        if (TransitionScene.isPlaying) return;
        TransitionScene.isPlaying = true;

        const overlays = ['GlossaryUI', 'Help', 'Settings', 'SettingsUI', 'Achievements', 'AchievementsUI'];
        for (const key of overlays) {
            if (this.scene.isActive(key)) {
                this.scene.stop(key);
            }
        }

        this.scene.bringToTop();

        const centerX = this.scale.width / 2;
        const topTargetY = 180;
        const bottomTargetY = this.scale.height - 180;

        const topSprite = this.add.sprite(centerX, -180, 'transition')
            .setScrollFactor(0)
            .setDepth(99999)
            .setScale(2);

        const bottomSprite = this.add.sprite(centerX, this.scale.height + 180, 'transition')
            .setScrollFactor(0)
            .setDepth(99999)
            .setScale(2)
            .setFlipY(true);

        const durationMs = 500;

        let targetSceneLoaded = false;

        const finishTransition = () => {
            this.tweens.add({
                targets: topSprite,
                y: -180,
                duration: durationMs,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    TransitionScene.isPlaying = false;
                    this.scene.stop();
                }
            });

            this.tweens.add({
                targets: bottomSprite,
                y: this.scale.height + 180,
                duration: durationMs,
                ease: 'Sine.easeInOut'
            });
        };

        const onTargetSceneReady = () => {
            if (targetSceneLoaded) return;
            targetSceneLoaded = true;
            finishTransition();
        };

        const loadTargetScene = () => {
            if (data.currentScene && data.currentScene === data.targetScene) {
                const existingScene = this.scene.get(data.targetScene);
                if (existingScene) {
                    existingScene.scene.restart(data.targetData);
                    this.scene.bringToTop('TransitionScene');
                    this.time.delayedCall(100, onTargetSceneReady);
                } else {
                    onTargetSceneReady();
                }
            } else {
                this.scene.launch(data.targetScene, data.targetData);
                this.scene.bringToTop('TransitionScene');

                const targetScene = this.scene.get(data.targetScene);

                if (targetScene && targetScene.scene.isActive()) {
                    this.time.delayedCall(100, onTargetSceneReady);
                } else {
                    this.scene.get(data.targetScene).sys.events.once('create', onTargetSceneReady);
                    this.time.delayedCall(5000, () => {
                        if (!targetSceneLoaded) onTargetSceneReady();
                    });
                }

                if (data.currentScene) {
                    this.scene.stop(data.currentScene);
                }
            }
        };

        this.tweens.add({
            targets: topSprite,
            y: topTargetY,
            duration: durationMs,
            ease: 'Sine.easeInOut'
        });

        this.tweens.add({
            targets: bottomSprite,
            y: bottomTargetY,
            duration: durationMs,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                loadTargetScene();
            }
        });
    }
}