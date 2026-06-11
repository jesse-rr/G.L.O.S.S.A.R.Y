import * as Phaser from 'phaser';
import { DashSystem } from './DashSystem';

const DASH_TRACK_W = 56;
const DASH_TRACK_H = 10;
const UI_ZOOM = 2;

export class DashIndicatorHUD {
    private scene: Phaser.Scene;
    private dashContainer!: Phaser.GameObjects.Container;
    private dashFill!: Phaser.GameObjects.Rectangle;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.createDashIndicator();
    }

    isAlive(): boolean {
        return !!this.dashContainer?.active;
    }

    private uiScale(): number {
        return 1 / UI_ZOOM;
    }

    private screenPos(x: number, y: number): { x: number; y: number } {
        const w = this.scene.scale.width;
        const h = this.scene.scale.height;
        return {
            x: (x - w / 2) / UI_ZOOM + w / 2,
            y: (y - h / 2) / UI_ZOOM + h / 2
        };
    }

    private createDashIndicator(): void {
        const w = this.scene.scale.width;
        const pos = this.screenPos(w - 44, 28);

        this.dashContainer = this.scene.add.container(pos.x, pos.y).setScrollFactor(0).setDepth(202);

        const outline = this.scene.add.rectangle(0, 0, DASH_TRACK_W + 3, DASH_TRACK_H + 3, 0x000000, 1).setOrigin(0.5);
        const track = this.scene.add.rectangle(0, 0, DASH_TRACK_W, DASH_TRACK_H, 0x1a1a1a, 1).setOrigin(0.5);
        this.dashFill = this.scene.add.rectangle(-DASH_TRACK_W / 2, 0, DASH_TRACK_W, DASH_TRACK_H - 2, 0xe8e8e8, 1).setOrigin(0, 0.5);

        this.dashContainer.add([outline, track, this.dashFill]);
        this.dashContainer.setScale(this.uiScale());
    }

    update(dashSystem: DashSystem): void {
        if (!this.dashFill?.active) return;

        const ready = dashSystem.isDashAvailable();
        const progress = dashSystem.getCooldownProgress();

        if (ready) {
            this.dashFill.setFillStyle(0xe8e8e8, 1);
            this.dashFill.width = DASH_TRACK_W;
            this.dashFill.x = -DASH_TRACK_W / 2;
        } else {
            const filledW = DASH_TRACK_W * progress;
            this.dashFill.setFillStyle(0x888888, 1);
            this.dashFill.width = Math.max(2, filledW);
            this.dashFill.x = -DASH_TRACK_W / 2;
        }
    }

    destroy(): void {
        this.dashContainer?.destroy(true);
    }
}
