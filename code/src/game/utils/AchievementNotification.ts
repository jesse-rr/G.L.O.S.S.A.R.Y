import * as Phaser from 'phaser';
import { FONT_FAMILY } from '../constants';
import { EventBus } from '../EventBus';

const NOTIFICATION_DURATION = 3000;
const FADE_DURATION = 400;

export function showAchievementNotification(scene: Phaser.Scene, text: string): void {
    EventBus.emit('show-notification', text);
}

export function showRuneDiscoveryNotification(scene: Phaser.Scene, runeName: string): void {
    showAchievementNotification(scene, `Rune Found: ${runeName}`);
}
