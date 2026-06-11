import * as Phaser from 'phaser';

export function fadeIn(scene: Phaser.Scene, targets: any, duration: number = 500, onComplete?: () => void) {
    return scene.tweens.add({
        targets,
        alpha: 1,
        duration,
        ease: 'Linear',
        onComplete
    });
}

export function fadeOut(scene: Phaser.Scene, targets: any, duration: number = 500, onComplete?: () => void) {
    return scene.tweens.add({
        targets,
        alpha: 0,
        duration,
        ease: 'Linear',
        onComplete
    });
}

export function fadeOutAndDestroy(scene: Phaser.Scene, targets: any, duration: number = 500, onComplete?: () => void) {
    return scene.tweens.add({
        targets,
        alpha: 0,
        duration,
        ease: 'Linear',
        onComplete: () => {
            if (Array.isArray(targets)) {
                targets.forEach(t => t && t.destroy && t.destroy());
            } else if (targets && targets.destroy) {
                targets.destroy();
            }
            if (onComplete) onComplete();
        }
    });
}
