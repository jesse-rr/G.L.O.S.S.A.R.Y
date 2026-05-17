export class LightSystem {
    private overlay: Phaser.GameObjects.Rectangle;
    private minAlpha: number = 0;
    private maxAlpha: number = 0.5;
    private duration: number = 900000;
    private scene: Phaser.Scene;
    private static globalAlpha: number = 0;
    private static globalIsDarkening: boolean = true;
    private static globalTween: Phaser.Tweens.Tween | null = null;
    private static globalOverlay: Phaser.GameObjects.Rectangle | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;

        const w = scene.scale.width;
        const h = scene.scale.height;
        const zoom = scene.cameras.main.zoom || 1;

        if (LightSystem.globalOverlay && LightSystem.globalOverlay.active) {
            this.overlay = LightSystem.globalOverlay;
            this.overlay.setPosition(w / 2, h / 2);
            this.overlay.setScale(1 / zoom);
        } else {
            this.overlay = scene.add.rectangle(w / 2, h / 2, w, h, 0x0a0a1a)
                .setScrollFactor(0)
                .setDepth(150)
                .setOrigin(0.5)
                .setAlpha(LightSystem.globalAlpha)
                .setScale(1 / zoom);
            LightSystem.globalOverlay = this.overlay;
        }

        this.startCycle();
    }

    private startCycle(): void {
        if (!this.overlay || !this.overlay.active) return;

        if (LightSystem.globalTween && LightSystem.globalTween.isActive()) {
            return;
        }

        LightSystem.globalTween = this.scene.tweens.add({
            targets: this.overlay,
            alpha: LightSystem.globalIsDarkening ? this.maxAlpha : this.minAlpha,
            duration: this.duration,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                LightSystem.globalAlpha = this.overlay.alpha;
            },
            onComplete: () => {
                LightSystem.globalIsDarkening = !LightSystem.globalIsDarkening;
                LightSystem.globalTween = null;
                this.startCycle();
            }
        });
    }

    public destroy(): void {
        if (LightSystem.globalTween) {
            LightSystem.globalTween.stop();
            LightSystem.globalTween = null;
        }
    }
}