// RuneIndicatorSystem.ts
import * as Phaser from 'phaser';

export class RuneIndicatorSystem {
    private scene: Phaser.Scene;
    private player: Phaser.Physics.Matter.Sprite;
    private activeIndicators: RuneIndicator[] = [];
    private spawnTimers: Phaser.Time.TimerEvent[] = [];
    private isActive = false;
    private playArea: { x: number; y: number; width: number; height: number; minX: number; maxX: number; minY: number; maxY: number };
    private spawnInterval = 15000;
    private collectionTimeWindow = 8000;
    private requiredStayDuration = 1000;
    private maxIndicators = 6;
    private onAllCollected?: () => void;
    private indicatorsCollected = 0;

    constructor(scene: Phaser.Scene, player: Phaser.Physics.Matter.Sprite, barrierObjects: { x: number; y: number; width: number; height: number }[]) {
        this.scene = scene;
        this.player = player;
        this.playArea = this.calculatePlayArea(barrierObjects);
    }

    private calculatePlayArea(barrierObjects: { x: number; y: number; width: number; height: number }[]): { x: number; y: number; width: number; height: number; minX: number; maxX: number; minY: number; maxY: number } {
        if (barrierObjects.length === 0) {
            return { x: 0, y: 0, width: 704, height: 640, minX: -352, maxX: 352, minY: -320, maxY: 320 };
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const obj of barrierObjects) {
            const left = obj.x - obj.width / 2;
            const right = obj.x + obj.width / 2;
            const top = obj.y - obj.height / 2;
            const bottom = obj.y + obj.height / 2;

            minX = Math.min(minX, left);
            maxX = Math.max(maxX, right);
            minY = Math.min(minY, top);
            maxY = Math.max(maxY, bottom);
        }

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const width = maxX - minX;
        const height = maxY - minY;

        return {
            x: centerX,
            y: centerY,
            width: width,
            height: height,
            minX: minX,
            maxX: maxX,
            minY: minY,
            maxY: maxY
        };
    }

    startBattle(onAllCollected?: () => void): void {
        if (this.isActive) return;
        this.isActive = true;
        this.onAllCollected = onAllCollected;
        this.indicatorsCollected = 0;
        this.scheduleNextSpawn();
    }

    stop(): void {
        this.isActive = false;
        this.spawnTimers.forEach(timer => timer.remove());
        this.spawnTimers = [];
        this.activeIndicators.forEach(indicator => indicator.destroy());
        this.activeIndicators = [];
    }

    update(delta: number): void {
        for (let i = this.activeIndicators.length - 1; i >= 0; i--) {
            const indicator = this.activeIndicators[i];
            if (!indicator || !indicator.update) continue;

            indicator.update(delta);

            if (indicator.state === 'expired') {
                indicator.destroy();
                this.activeIndicators.splice(i, 1);
                continue;
            }

            if (indicator.state === 'ready' && this.checkPlayerInside(indicator)) {
                indicator.startCollecting();
            }

            if (indicator.state === 'collecting' && this.checkPlayerInside(indicator)) {
                if (indicator.updateCollection(delta)) {
                    this.collectIndicator(indicator);
                    this.activeIndicators.splice(i, 1);
                }
            } else if (indicator.state === 'collecting' && !this.checkPlayerInside(indicator)) {
                indicator.cancelCollection();
            }
        }
    }

    private scheduleNextSpawn(): void {
        if (!this.isActive) return;
        if (this.activeIndicators.length >= this.maxIndicators) {
            this.spawnTimers.push(this.scene.time.delayedCall(1000, () => this.scheduleNextSpawn()));
            return;
        }

        const timer = this.scene.time.delayedCall(this.spawnInterval, () => {
            this.spawnIndicator();
            this.scheduleNextSpawn();
        });
        this.spawnTimers.push(timer);
    }

    private spawnIndicator(): void {
        if (!this.isActive) return;

        const padding = 50;
        const x = Phaser.Math.Between(this.playArea.minX + padding, this.playArea.maxX - padding);
        const y = Phaser.Math.Between(this.playArea.minY + padding, this.playArea.maxY - padding);

        const indicator = new RuneIndicator(this.scene, x, y, this.collectionTimeWindow, this.requiredStayDuration);
        this.activeIndicators.push(indicator);
    }

    private checkPlayerInside(indicator: RuneIndicator): boolean {
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, indicator.x, indicator.y);
        return distance < 28;
    }

    private collectIndicator(indicator: RuneIndicator): void {
        indicator.complete();
        this.indicatorsCollected++;

        if (this.onAllCollected && this.indicatorsCollected >= this.maxIndicators) {
            this.onAllCollected();
            this.stop();
        }
    }
}

class RuneIndicator {
    public x: number;
    public y: number;
    public state: 'idle' | 'ready' | 'collecting' | 'expired' = 'idle';
    private sprite: Phaser.GameObjects.Sprite;
    private glowTween?: Phaser.Tweens.Tween;
    private collectionStartTime = 0;
    private collectionDuration: number;
    private requiredStay: number;
    private collectionProgress = 0;
    private progressBar?: Phaser.GameObjects.Graphics;
    private expireTimer?: Phaser.Time.TimerEvent;
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene, x: number, y: number, timeWindow: number, requiredStay: number) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.collectionDuration = timeWindow;
        this.requiredStay = requiredStay;

        this.sprite = scene.add.sprite(x, y, 'Rune-Indicator');
        this.sprite.setOrigin(0.5, 0.5);
        this.sprite.setDepth(15);
        this.sprite.setAlpha(0);

        this.fadeIn();
        this.startGlow();

        this.expireTimer = scene.time.delayedCall(timeWindow, () => {
            if (this.state !== 'collecting') {
                this.expire();
            }
        });
    }

    public update(delta: number): void {
        if (this.state === 'collecting') {
            this.collectionProgress += delta;
            const progress = Math.min(1, this.collectionProgress / this.requiredStay);
            this.updateProgressBar(progress);
        }
    }

    public updateCollection(delta: number): boolean {
        if (this.state !== 'collecting') return false;

        if (this.collectionProgress >= this.requiredStay) {
            return true;
        }

        const elapsed = this.scene.time.now - this.collectionStartTime;
        if (elapsed >= this.collectionDuration) {
            this.expire();
            return false;
        }

        return false;
    }

    private fadeIn(): void {
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.6,
            duration: 500,
            ease: 'Sine.easeOut',
            onComplete: () => {
                this.state = 'ready';
            }
        });
    }

    private startGlow(): void {
        this.glowTween = this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.9,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    public startCollecting(): void {
        if (this.state !== 'ready') return;

        this.state = 'collecting';
        this.collectionStartTime = this.scene.time.now;
        this.collectionProgress = 0;

        if (this.glowTween) {
            this.glowTween.stop();
        }

        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 1,
            duration: 100,
            ease: 'Sine.easeOut'
        });

        this.createProgressBar();
    }

    public cancelCollection(): void {
        if (this.state !== 'collecting') return;

        this.state = 'ready';
        this.collectionProgress = 0;
        this.destroyProgressBar();
        this.startGlow();

        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.6,
            duration: 200,
            ease: 'Sine.easeOut'
        });
    }

    private createProgressBar(): void {
        this.progressBar = this.scene.add.graphics();
        this.progressBar.setDepth(16);
        this.updateProgressBar(0);
    }

    private updateProgressBar(progress: number): void {
        if (!this.progressBar) return;

        this.progressBar.clear();
        const barWidth = 48;
        const barHeight = 6;
        const barX = this.x - barWidth / 2;
        const barY = this.y - 50;

        this.progressBar.fillStyle(0x000000, 0.6);
        this.progressBar.fillRect(barX, barY, barWidth, barHeight);
        this.progressBar.fillStyle(0xffaa44, 0.9);
        this.progressBar.fillRect(barX, barY, barWidth * progress, barHeight);
    }

    private destroyProgressBar(): void {
        if (this.progressBar) {
            this.progressBar.destroy();
            this.progressBar = undefined;
        }
    }

    private expire(): void {
        if (this.state === 'expired') return;

        this.state = 'expired';

        if (this.glowTween) {
            this.glowTween.stop();
        }

        if (this.expireTimer) {
            this.expireTimer.remove();
        }

        this.destroyProgressBar();

        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            duration: 500,
            ease: 'Sine.easeOut',
            onComplete: () => {
                this.sprite.destroy();
            }
        });
    }

    public complete(): void {
        if (this.state === 'expired') return;

        if (this.glowTween) {
            this.glowTween.stop();
        }

        if (this.expireTimer) {
            this.expireTimer.remove();
        }

        this.destroyProgressBar();

        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 300,
            ease: 'Back.easeIn',
            onComplete: () => {
                this.sprite.destroy();
            }
        });
    }

    public destroy(): void {
        if (this.glowTween) {
            this.glowTween.stop();
        }
        if (this.expireTimer) {
            this.expireTimer.remove();
        }
        this.destroyProgressBar();
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}