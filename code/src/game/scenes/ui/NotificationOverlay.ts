import * as Phaser from 'phaser';
import { EventBus, GameEvents } from '../../EventBus';
import { ItemData } from '../../data/ItemData';
import { PlayerData } from '../../data/PlayerData';
import { UserData } from '../../data/UserData';
import { NetworkManager } from '../../NetworkManager';
import { FONT_FAMILY } from '../../constants';
import { fadeIn, fadeOutAndDestroy } from '../../utils/TweenUtils';

const NOTIFICATION_DURATION = 3000;
const FADE_DURATION = 400;

export class NotificationOverlay extends Phaser.Scene {
    private messageQueue: string[] = [];
    private isShowingNotification = false;

    constructor() {
        super('NotificationOverlay');
    }

    create() {
        EventBus.on(GameEvents.SHOW_NOTIFICATION, this.handleShowNotification, this);
        EventBus.on(GameEvents.NETWORK_DATA_RECEIVED, this.onNetworkData, this);
        this.input.once('pointerdown', this.requestBrowserNotifications, this);
        this.input.keyboard?.once('keydown', this.requestBrowserNotifications, this);

        this.events.on('shutdown', () => {
            EventBus.off(GameEvents.SHOW_NOTIFICATION, this.handleShowNotification, this);
            EventBus.off(GameEvents.NETWORK_DATA_RECEIVED, this.onNetworkData, this);
        });
    }

    private onNetworkData(payload: any) {
        const data = payload.data;
        if (data && data.type === 'ITEM_FOUND') {
            if (data.originPeerId === NetworkManager.getInstance().myPeerId) return;
            this.receiveSharedItem(data);
            this.handleShowNotification(`Ally found: ${data.itemName}`);
        }
    }

    private receiveSharedItem(data: any): void {
        const nm = NetworkManager.getInstance();
        if (nm.role === 'host' && data.originPeerId !== nm.myPeerId) {
            nm.broadcast(data);
        }
        if (typeof data.itemId !== 'number') return;

        const item = ItemData.getItem(data.itemId);
        if (!item) return;

        PlayerData.getInstance().addItem(item.id.toString());
        ItemData.getInstance().discoverItem(item.id);
        UserData.getInstance().discoverItem(item.name);
    }

    private handleShowNotification(text: string) {
        this.showBrowserNotification(text);
        this.messageQueue.push(text);
        if (!this.isShowingNotification) {
            this.showNextNotification();
        }
    }

    private requestBrowserNotifications(): void {
        if ('Notification' in window && Notification.permission === 'default') {
            void Notification.requestPermission();
        }
    }

    private showBrowserNotification(text: string): void {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('G.L.O.S.S.A.R.Y', { body: text });
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

        fadeIn(this, [bg, label], FADE_DURATION, () => {
            this.time.delayedCall(NOTIFICATION_DURATION, () => {
                fadeOutAndDestroy(this, [bg, label], FADE_DURATION, () => {
                    this.showNextNotification();
                });
            });
        });
    }
}
