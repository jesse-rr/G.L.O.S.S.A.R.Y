import * as Phaser from 'phaser';
import { FONT_FAMILY, TITLE_FONT } from '../constants';
import { BOSSES, HUBS, LocationDefinition, SETTLEMENTS } from "../data/LocationData";

export class LocationDisplayScene extends Phaser.Scene {
    private activeTitle: Phaser.GameObjects.Text | null = null;
    private activeDescription: Phaser.GameObjects.Text | null = null;
    private hideTimer: Phaser.Time.TimerEvent | null = null;

    constructor() {
        super({ key: 'LocationDisplayScene', active: false });
    }

    public static ensureRunning(scene: Phaser.Scene): LocationDisplayScene {
        let instance = scene.scene.get('LocationDisplayScene') as LocationDisplayScene;
        if (!instance) {
            scene.scene.add('LocationDisplayScene', LocationDisplayScene, true);
            instance = scene.scene.get('LocationDisplayScene') as LocationDisplayScene;
        }
        if (!instance.scene.isActive()) {
            scene.scene.run('LocationDisplayScene');
        }
        return instance;
    }

    create(): void {
        this.scene.bringToTop();
    }

    private getLocationDefinition(locId: string): LocationDefinition | undefined {
        return [...SETTLEMENTS, ...BOSSES, ...HUBS].find(l => l.id === locId);
    }

    public showLocation(locId: string, duration: number = 4000): void {
        if (!locId) {
            return;
        }

        const definition = this.getLocationDefinition(locId);
        if (!definition) {
            return;
        }

        if (this.hideTimer) {
            this.hideTimer.remove();
            this.hideTimer = null;
        }

        if (!this.scene.isActive()) {
            this.scene.wake();
        }

        this.scene.bringToTop();

        this.hide();

        const centerX = this.cameras.main.width / 2;
        const topY = 80;

        this.activeTitle = this.add.text(centerX, topY, definition.name, {
            fontSize: '56px',
            color: '#FFFFFF',
            fontFamily: TITLE_FONT,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.activeTitle.setOrigin(0.5, 0.5);
        this.activeTitle.setDepth(10001);
        this.activeTitle.setAlpha(0);

        this.activeDescription = this.add.text(centerX, topY + 40, definition.description, {
            fontSize: '12px',
            color: '#FFFFFF',
            fontFamily: FONT_FAMILY,
            align: 'center',
            wordWrap: { width: 500 }
        });
        this.activeDescription.setOrigin(0.5, 0.5);
        this.activeDescription.setDepth(10001);
        this.activeDescription.setAlpha(0);

        this.tweens.add({
            targets: this.activeTitle,
            alpha: 1,
            duration: 500,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: this.activeDescription,
                    alpha: 1,
                    duration: 500,
                    ease: 'Cubic.easeOut'
                });
            }
        });

        this.tweens.add({
            targets: this.activeDescription,
            alpha: 0.5,
            duration: 500,
            ease: 'Cubic.easeOut',
            delay: 200
        });

        this.hideTimer = this.time.delayedCall(duration, () => {
            this.tweens.add({
                targets: [this.activeTitle, this.activeDescription],
                alpha: 0,
                duration: 600,
                ease: 'Cubic.easeIn',
                onComplete: () => {
                    this.hide();
                    this.scene.sleep();
                }
            });
        });
    }

    public hide(): void {
        if (this.hideTimer) {
            this.hideTimer.remove();
            this.hideTimer = null;
        }
        if (this.activeTitle) {
            this.activeTitle.destroy();
            this.activeTitle = null;
        }
        if (this.activeDescription) {
            this.activeDescription.destroy();
            this.activeDescription = null;
        }
    }
}