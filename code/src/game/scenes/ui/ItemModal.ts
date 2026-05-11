import * as Phaser from 'phaser';
import { NetworkManager } from '../../NetworkManager';

export class ItemModal extends Phaser.Scene {
    private bgOverlay!: Phaser.GameObjects.Rectangle;
    private itemSprite!: Phaser.GameObjects.Sprite;

    constructor() {
        super('ItemModal');
    }

    create(data: { itemKey: string, itemFrame: number, itemName: string }) {
        const { width, height } = this.scale;

        this.bgOverlay = this.add.rectangle(0, 0, width, height, 0x000000, 0)
            .setOrigin(0, 0);

        this.tweens.add({
            targets: this.bgOverlay,
            fillAlpha: 0.85,
            duration: 600
        });

        this.itemSprite = this.add.sprite(width / 2, height / 2 - 10, data.itemKey, data.itemFrame)
            .setScale(2)
            .setTint(0x000000)
            .setAlpha(0);

        this.tweens.add({
            targets: this.itemSprite,
            alpha: 1,
            duration: 600,
            onComplete: () => {
                this.time.delayedCall(800, () => {
                    this.itemSprite.clearTint();
                    this.cameras.main.flash(400, 255, 255, 255);
                    
                    const nm = NetworkManager.getInstance();
                    if (nm.role !== 'offline') {
                        nm.broadcast({ type: 'ITEM_FOUND', itemName: data.itemName });
                    }

                    this.time.delayedCall(1000, () => this.closeModal());
                });
            }
        });
    }

    private closeModal() {
        this.tweens.add({
            targets: [this.bgOverlay, this.itemSprite],
            alpha: 0,
            duration: 400,
            onComplete: () => {
                this.scene.resume('LevelScene');
                this.scene.stop();
            }
        });
    }
}