import * as Phaser from 'phaser';
import { EventBus } from '../../EventBus';
import { FONT_FAMILY } from '../../constants';

const NOTIFICATION_DURATION = 3000;
const FADE_DURATION = 400;
const NOTIFICATION_HEIGHT = 44; // Approx height + spacing

interface NotificationItem {
    bg: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.Text;
    targetY: number;
}

export class NotificationOverlay extends Phaser.Scene {
    private messageQueue: string[] = [];
    private isShowingNotification = false;

    constructor() {
        super('NotificationOverlay');
    }

    create() {
        EventBus.on('show-notification', this.handleShowNotification, this);
        EventBus.on('network-data-received', this.onNetworkData, this);

        this.events.on('shutdown', () => {
            EventBus.off('show-notification', this.handleShowNotification, this);
            EventBus.off('network-data-received', this.onNetworkData, this);
        });
    }

    private onNetworkData(payload: any) {
        const data = payload.data;
        if (data && data.type === 'ITEM_FOUND') {
            this.handleShowNotification(`Ally found: ${data.itemName}`);
        }
    }

    private handleShowNotification(text: string) {
        this.messageQueue.push(text);
        if (!this.isShowingNotification) {
            this.showNextNotification();
        }
    }

    private showNextNotification() {
        if (this.messageQueue.length === 0) {
            this.isShowingNotification = false;
            return;
        }

        this.isShowingNotification = true;
        const text = this.messageQueue.shift()!;

        const x = this.scale.width - 10;
        const y = this.scale.height - 10;

        const bg = this.add.image(x, y, 'achievement-ui')
            .setOrigin(1, 1)
            .setScrollFactor(0)
            .setDepth(200)
            .setAlpha(0);

        const labelX = x - bg.width / 2;
        const labelY = y - bg.height / 2;

        const label = this.add.text(labelX, labelY, text, {
            fontSize: '12px',
            color: '#FFFFFF',
            fontFamily: FONT_FAMILY,
            align: 'center',
            wordWrap: { width: bg.width - 20 }
        }).setOrigin(0.5, 0.5)
            .setScrollFactor(0)
            .setDepth(201)
            .setAlpha(0);

        this.tweens.add({
            targets: [bg, label],
            alpha: 1,
            duration: FADE_DURATION,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.time.delayedCall(NOTIFICATION_DURATION, () => {
                    this.tweens.add({
                        targets: [bg, label],
                        alpha: 0,
                        duration: FADE_DURATION,
                        ease: 'Quad.easeIn',
                        onComplete: () => {
                            bg.destroy();
                            label.destroy();
                            this.showNextNotification();
                        }
                    });
                });
            }
        });
    }
}
