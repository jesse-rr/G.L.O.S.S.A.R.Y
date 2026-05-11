import * as Phaser from 'phaser';
import { EventBus } from '../EventBus';

export function showAchievementNotification(scene: Phaser.Scene, text: string): void {
    EventBus.emit('show-notification', text);
}

export function showRuneDiscoveryNotification(scene: Phaser.Scene, runeName: string): void {
    showAchievementNotification(scene, `Rune Found: ${runeName}`);
}
