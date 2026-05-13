import * as Phaser from 'phaser';
import { FONT_FAMILY } from '../constants';

export function convertToRunicWords(text: string): string {
    return text.toString()
        .replace(/[0-9]/g, (match) => {
            const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
            return words[parseInt(match)];
        })
        .replace(/%/g, ' percent');
}

export interface ScrambleContext {
    activeTweens: Phaser.Tweens.Tween[];
    activeScrambleTimers: Phaser.Time.TimerEvent[];
}

export function playScrambleAnimation(
    scene: Phaser.Scene,
    ctx: ScrambleContext,
    texts: Phaser.GameObjects.Text[],
    finalTexts: string[],
    onComplete?: () => void
): void {
    let elapsed = 0;
    const totalDuration = 1200;
    const stepDelay = 50;
    const totalSteps = Math.floor(totalDuration / stepDelay);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    const timer = scene.time.addEvent({
        delay: stepDelay,
        repeat: totalSteps - 1,
        callback: () => {
            elapsed++;

            const linearProgress = elapsed / totalSteps;
            const easedProgress = linearProgress < 0.5
                ? 2 * linearProgress * linearProgress
                : 1 - Math.pow(-2 * linearProgress + 2, 2) / 2;

            texts.forEach((textObj, index) => {
                if (!textObj || !textObj.active) return;

                const targetText = finalTexts[index];

                if (easedProgress > 0.3) {
                    textObj.setFontFamily(FONT_FAMILY);
                    textObj.setStroke('#000000', 0);
                }

                const revealProgress = easedProgress;

                let scrambled = '';
                for (let i = 0; i < targetText.length; i++) {
                    if (targetText[i] === ' ' || targetText[i] === '\n' || targetText[i] === ':') {
                        scrambled += targetText[i];
                    } else {
                        if (Math.random() < revealProgress) {
                            scrambled += targetText[i];
                        } else {
                            scrambled += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                    }
                }
                textObj.setText(scrambled);
            });

            if (elapsed === totalSteps && texts.some(t => t && t.active)) {
                texts.forEach((textObj, index) => {
                    if (!textObj || !textObj.active) return;
                    textObj.setText(finalTexts[index]);
                    textObj.setFontFamily(FONT_FAMILY);
                    textObj.setStroke('#000000', 0);
                });
                if (onComplete) onComplete();
            }
        }
    });

    ctx.activeScrambleTimers.push(timer);
}

export function cleanupAnimations(ctx: ScrambleContext): void {
    ctx.activeTweens.forEach(tween => {
        if (tween && tween.isPlaying()) {
            tween.stop();
        }
    });
    ctx.activeTweens = [];

    ctx.activeScrambleTimers.forEach(timer => {
        if (timer) {
            timer.destroy();
        }
    });
    ctx.activeScrambleTimers = [];
}
