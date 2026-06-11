import * as Phaser from 'phaser';
import { PlayerData } from '../data/PlayerData';

export class DamageOverlay {
    private scene: Phaser.Scene;
    private overlayImage!: Phaser.GameObjects.Image;
    private flashAlpha: number = 0;
    private lastHp: number = 0;
    private flashTween?: Phaser.Tweens.Tween;

    constructor(scene: Phaser.Scene, depth: number = 98) {
        this.scene = scene;
        
        const w = Number(scene.game.config.width);
        const h = Number(scene.game.config.height);
        const textureKey = '__damage_overlay__';

        if (!scene.textures.exists(textureKey)) {
            const canvas = scene.textures.createCanvas(textureKey, w, h);
            const ctx = canvas!.context;

            const cx = w / 2;
            const cy = h / 2;
            const r1 = Math.min(w, h) * 0.35;
            const r2 = Math.max(w, h) * 0.75;
            const gradient = ctx.createRadialGradient(cx, cy, r1, cx, cy, r2);
            gradient.addColorStop(0, 'rgba(180, 0, 0, 0)');
            gradient.addColorStop(0.5, 'rgba(180, 0, 0, 0.35)');
            gradient.addColorStop(1, 'rgba(180, 0, 0, 0.85)');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);
            canvas!.refresh();
        }

        const zoom = scene.cameras.main.zoom || 1;
        this.overlayImage = scene.add.image(w / 2, h / 2, textureKey);
        this.overlayImage.setOrigin(0.5, 0.5);
        this.overlayImage.setScrollFactor(0);
        this.overlayImage.setScale(1 / zoom);
        this.overlayImage.setDepth(depth);
        this.overlayImage.setAlpha(0);

        const player = PlayerData.getInstance();
        this.lastHp = player.hp;
    }

    public flash(intensity: number = 0.65): void {
        if (this.flashTween) {
            this.flashTween.stop();
        }

        this.flashAlpha = intensity;
        this.flashTween = this.scene.tweens.add({
            targets: this,
            flashAlpha: 0,
            duration: 450,
            ease: 'Quad.easeOut'
        });
    }

    public update(time: number): void {
        const player = PlayerData.getInstance();
        const currentHp = player.hp;
        const maxHp = player.maxHp;

        if (currentHp < this.lastHp) {
            this.flash(0.65);
        }
        this.lastHp = currentHp;

        if (currentHp <= 0) {
            this.overlayImage.setAlpha(Math.max(0, this.overlayImage.alpha - 0.05));
            return;
        }

        const hpPercent = currentHp / maxHp;
        const missingHpPercent = 1 - hpPercent;
        const baseAlpha = missingHpPercent * 0.35;

        let pulse = 0;
        if (hpPercent <= 0.35) {
            pulse = Math.sin(time * 0.005) * 0.05;
        }

        const finalAlpha = Phaser.Math.Clamp(Math.max(this.flashAlpha, baseAlpha + pulse), 0, 0.8);
        this.overlayImage.setAlpha(finalAlpha);
    }

    public destroy(): void {
        if (this.flashTween) {
            this.flashTween.stop();
        }
        this.overlayImage.destroy();
    }
}
