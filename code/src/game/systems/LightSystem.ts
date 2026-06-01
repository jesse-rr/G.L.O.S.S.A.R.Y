import {UserData} from "../data/UserData";

export class LightSystem {
    private overlay: Phaser.GameObjects.Rectangle;
    private minAlpha: number = 0;
    private maxAlpha: number = 0.9;
    private duration: number = 120000;
    private scene: Phaser.Scene;
    private static globalAlpha: number = 0;
    private static globalIsDarkening: boolean = true;
    private static globalTween: Phaser.Tweens.Tween | null = null;
    private static globalOverlay: Phaser.GameObjects.Rectangle | null = null;

    static clearOverlay(): void {
        if (LightSystem.globalTween) {
            LightSystem.globalTween.stop();
            LightSystem.globalTween = null;
        }
        if (LightSystem.globalOverlay) {
            LightSystem.globalOverlay.destroy();
            LightSystem.globalOverlay = null;
        }
        LightSystem.globalAlpha = 0;
    }

    constructor(scene: Phaser.Scene, maxAlpha?: number, color?: number) {
        if (!UserData.getInstance().settings.lightSystem) {
            this.destroy();
            return;
        }
        this.scene = scene;

        if (maxAlpha !== undefined) {
            this.maxAlpha = Math.min(1, Math.max(0, maxAlpha));
        }

        const w = scene.scale.width;
        const h = scene.scale.height;
        const zoom = scene.cameras.main.zoom || 1;
        const overlayColor = color !== undefined ? color : 0x000000;

        if (LightSystem.globalOverlay && LightSystem.globalOverlay.active) {
            this.overlay = LightSystem.globalOverlay;
            this.overlay.setPosition(w / 2, h / 2);
            this.overlay.setSize(w * 4, h * 4);
            this.overlay.setScale(1 / zoom);
        } else {
            this.overlay = scene.add.rectangle(w / 2, h / 2, w * 4, h * 4, overlayColor)
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