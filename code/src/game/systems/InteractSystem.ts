import * as Phaser from 'phaser';

export class InteractSystem {
    private static instanceMap: Map<Phaser.Scene, InteractSystem> = new Map();

    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;
    private isVisibleThisFrame: boolean = false;
    private currentAlpha: number = 0;

    private targetX: number = 0;
    private targetY: number = 0;

    private constructor(scene: Phaser.Scene) {
        this.scene = scene;

        const bg = scene.add.sprite(0, 0, 'interact-btn').setScale(0.5);

        this.container = scene.add.container(0, 0, [bg]);
        this.container.setDepth(2000);
        this.container.setVisible(false);
        this.container.setAlpha(0);

        scene.events.on('preupdate', this.resetFrame, this);
        scene.events.on('postupdate', this.applyVisibility, this);
        scene.events.on('shutdown', () => {
            InteractSystem.instanceMap.delete(scene);
        });
    }

    public static getInstance(scene: Phaser.Scene): InteractSystem {
        if (!this.instanceMap.has(scene)) {
            this.instanceMap.set(scene, new InteractSystem(scene));
        }
        return this.instanceMap.get(scene)!;
    }

    private resetFrame() {
        this.isVisibleThisFrame = false;
    }

    private currentProgress: number = 0;

    public show(x: number, y: number, progress: number = 0) {
        this.targetX = x;
        this.targetY = y - 10;
        this.currentProgress = progress;
        this.isVisibleThisFrame = true;
    }

    private applyVisibility(time: number, delta: number) {
        const fadeSpeed = 0.005 * delta;

        if (this.isVisibleThisFrame) {
            this.currentAlpha += fadeSpeed;
            if (this.currentAlpha > 1) this.currentAlpha = 1;
        } else {
            this.currentAlpha -= fadeSpeed;
            if (this.currentAlpha < 0) this.currentAlpha = 0;
        }

        if (this.currentAlpha > 0) {
            this.container.setVisible(true);
            this.container.setAlpha(this.currentAlpha);

            const hoverY = Math.sin(time / 200) * 3;
            const appearY = (1 - this.currentAlpha) * 8;

            let shakeX = 0;
            let shakeY = 0;
            if (this.currentProgress > 0) {
                shakeX = (Math.random() - 0.5) * 6 * this.currentProgress;
                shakeY = (Math.random() - 0.5) * 6 * this.currentProgress;
            }

            this.container.setPosition(this.targetX + shakeX, this.targetY + hoverY + appearY + shakeY);
        } else {
            this.container.setVisible(false);
        }
    }
}
