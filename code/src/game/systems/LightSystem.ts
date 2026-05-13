import * as Phaser from 'phaser';

export class LightSystem {
    private overlay: Phaser.GameObjects.Rectangle;
    private minAlpha: number = 0;
    private maxAlpha: number = 0.5;
    private duration: number = 900000;
    private isDarkening: boolean = true;
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;

        const w = scene.scale.width;
        const h = scene.scale.height;
        const zoom = scene.cameras.main.zoom || 1;

        this.overlay = scene.add.rectangle(w / 2, h / 2, w, h, 0x0a0a1a)
            .setScrollFactor(0)
            .setDepth(150)
            .setOrigin(0.5)
            .setAlpha(this.minAlpha)
            .setScale(1 / zoom);

        this.startCycle();
    }

    private startCycle(): void {
        if (!this.overlay || !this.overlay.active) return;

        this.scene.tweens.add({
            targets: this.overlay,
            alpha: this.isDarkening ? this.maxAlpha : this.minAlpha,
            duration: this.duration,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.isDarkening = !this.isDarkening;
                this.startCycle();
            }
        });
    }

    public destroy(): void {
        if (this.overlay && this.overlay.active) {
            this.scene.tweens.killTweensOf(this.overlay);
            this.overlay.destroy();
        }
    }
}
