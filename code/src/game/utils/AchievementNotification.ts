import * as Phaser from 'phaser';
import { FONT_FAMILY } from '../constants';

const NOTIFICATION_DURATION = 3000;
const FADE_DURATION = 400;

export function showAchievementNotification(scene: Phaser.Scene, text: string): void {
    const x = scene.scale.width - 10;
    const y = scene.scale.height - 10;

    const bg = scene.add.image(x, y, 'achievement-ui')
        .setOrigin(1, 1)
        .setScale(2)
        .setScrollFactor(0)
        .setDepth(200)
        .setAlpha(0);

    const label = scene.add.text(x - 96, y - 16, text, {
        fontSize: '11px',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY,
        align: 'center',
        wordWrap: { width: 170 }
    }).setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(201)
        .setAlpha(0);

    scene.tweens.add({
        targets: [bg, label],
        alpha: 1,
        duration: FADE_DURATION,
        ease: 'Quad.easeOut',
        onComplete: () => {
            scene.time.delayedCall(NOTIFICATION_DURATION, () => {
                scene.tweens.add({
                    targets: [bg, label],
                    alpha: 0,
                    duration: FADE_DURATION,
                    ease: 'Quad.easeIn',
                    onComplete: () => {
                        bg.destroy();
                        label.destroy();
                    }
                });
            });
        }
    });
}

export function showRuneDiscoveryNotification(scene: Phaser.Scene, runeName: string): void {
    showAchievementNotification(scene, `Rune Found: ${runeName}`);
}
