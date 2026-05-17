import * as Phaser from 'phaser';
import { EventBus } from '../EventBus';

export function showAchievementNotification(_scene: Phaser.Scene, text: string): void {
    EventBus.emit('show-notification', text);
}

export function showRuneDiscoveryNotification(_scene: Phaser.Scene, runeName: string): void {
    showAchievementNotification(_scene, `Rune Found: ${runeName}`);
}
