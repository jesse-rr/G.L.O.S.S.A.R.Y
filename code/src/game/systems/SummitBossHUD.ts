import * as Phaser from 'phaser';
import { ScreenShake } from '../utils/ScreenShake';

const SEGMENT_COUNT = 4;
const BAR_WIDTH = 240;
const BAR_HEIGHT = 14;
const OUTLINE = 2;
const INNER_OUTLINE = 1;
const UI_ZOOM = 2;

export class SummitBossHUD {
    private scene: Phaser.Scene;
    private barContainer!: Phaser.GameObjects.Container;
    private segmentFills: Phaser.GameObjects.Rectangle[] = [];
    private barBaseX = 0;
    private pillarsDefeated = 0;
    private battleVisible = false;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.createBossHealthBar();
        this.setBattleVisible(false);
    }

    setBattleVisible(visible: boolean): void {
        this.battleVisible = visible;
        this.barContainer.setVisible(visible);
    }

    isBattleVisible(): boolean {
        return this.battleVisible;
    }

    isAlive(): boolean {
        return !!this.barContainer?.active;
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

    private createBossHealthBar(): void {
        const w = this.scene.scale.width;
        const pos = this.screenPos(w / 2, 30);
        this.barBaseX = pos.x;

        this.barContainer = this.scene.add.container(pos.x, pos.y).setScrollFactor(0).setDepth(202);

        const totalW = BAR_WIDTH + OUTLINE * 2;
        const totalH = BAR_HEIGHT + OUTLINE * 2;
        const outer = this.scene.add.rectangle(0, 0, totalW, totalH, 0x000000, 1).setOrigin(0.5);
        const innerBg = this.scene.add.rectangle(0, 0, BAR_WIDTH, BAR_HEIGHT, 0x1a1a1a, 1).setOrigin(0.5);

        this.barContainer.add([outer, innerBg]);

        const segmentW = (BAR_WIDTH - INNER_OUTLINE * (SEGMENT_COUNT - 1)) / SEGMENT_COUNT;
        const startX = -BAR_WIDTH / 2 + segmentW / 2;

        for (let i = 0; i < SEGMENT_COUNT; i++) {
            const cx = startX + i * (segmentW + INNER_OUTLINE);
            const divider = this.scene.add.rectangle(
                -BAR_WIDTH / 2 + (i + 1) * segmentW + i * INNER_OUTLINE + INNER_OUTLINE / 2,
                0,
                INNER_OUTLINE,
                BAR_HEIGHT,
                0x000000,
                1
            ).setOrigin(0.5);
            if (i < SEGMENT_COUNT - 1) {
                this.barContainer.add(divider);
            }

            const fill = this.scene.add.rectangle(cx, 0, segmentW - 1, BAR_HEIGHT - 2, 0xcc2222, 1).setOrigin(0.5);
            fill.setData('segmentIndex', i);
            this.segmentFills.push(fill);
            this.barContainer.add(fill);
        }

        this.barContainer.setScale(this.uiScale());
    }

    /** Sync bar to saved pillar count without hit animation (e.g. after reload). */
    syncPillarsDefeated(count: number): void {
        this.pillarsDefeated = Phaser.Math.Clamp(count, 0, SEGMENT_COUNT);
        for (let i = 0; i < SEGMENT_COUNT; i++) {
            this.applySegmentDefeated(i, i >= SEGMENT_COUNT - this.pillarsDefeated);
        }
    }

    /** Called when a pillar is cleared — plays heavy-hit damage on the bar. */
    onPillarDefeated(pillarsDefeated: number): void {
        const count = Phaser.Math.Clamp(pillarsDefeated, 0, SEGMENT_COUNT);
        if (count <= this.pillarsDefeated) {
            this.syncPillarsDefeated(count);
            return;
        }

        const segmentIndex = SEGMENT_COUNT - count;
        this.pillarsDefeated = count;
        this.playSegmentHit(segmentIndex);
    }

    private applySegmentDefeated(segmentIndex: number, defeated: boolean): void {
        const fill = this.segmentFills[segmentIndex];
        if (!fill) return;

        if (defeated) {
            fill.setFillStyle(0x2a1515, 1);
            fill.setAlpha(0.35);
            fill.setScale(1, 0.35);
        } else {
            fill.setFillStyle(0xcc2222, 1);
            fill.setAlpha(1);
            fill.setScale(1, 1);
            fill.setVisible(true);
        }
    }

    private playSegmentHit(segmentIndex: number): void {
        const fill = this.segmentFills[segmentIndex];
        if (!fill) return;

        ScreenShake.trigger(this.scene, 280, 0.012);

        const w = this.scene.scale.width;
        const h = this.scene.scale.height;
        const flash = this.scene.add
            .rectangle(w / 2, h / 2, w + 64, h + 64, 0xff2828, 0.18)
            .setScrollFactor(0)
            .setDepth(203);
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 160,
            ease: 'Sine.easeOut',
            onComplete: () => flash.destroy()
        });

        const scale = this.uiScale();
        this.scene.tweens.add({
            targets: this.barContainer,
            x: this.barBaseX + 10 * scale,
            duration: 45,
            yoyo: true,
            repeat: 4,
            ease: 'Sine.easeInOut'
        });

        fill.setFillStyle(0xffffff, 1);
        this.scene.time.delayedCall(60, () => {
            fill.setFillStyle(0xff4444, 1);
        });

        this.scene.tweens.add({
            targets: fill,
            scaleY: 0.15,
            alpha: 0.25,
            duration: 420,
            ease: 'Back.easeIn',
            onComplete: () => {
                fill.setFillStyle(0x2a1515, 1);
                fill.setAlpha(0.35);
            }
        });
    }

    destroy(): void {
        this.barContainer?.destroy(true);
    }
}
