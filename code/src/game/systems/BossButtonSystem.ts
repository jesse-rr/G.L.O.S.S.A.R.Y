import * as Phaser from 'phaser';
import { ScreenShake } from '../utils/ScreenShake';
import { createVignette } from '../utils/Vignette';

const INTERACT_DISTANCE = 30;
const SYMBOL_Y_OFFSET = -6;
const WALK_DURATION = 300;
const SHAKE_DURATION = 300;
const SHAKE_INTENSITY = 0.002;
const BUTTON_PRESS_ANIM_KEY = 'btn-boss-press';
const BUTTON_FRAME_RATE = 6;

export interface BossButtonState {
    button: Phaser.GameObjects.Sprite;
    symbol: Phaser.GameObjects.Sprite;
    symbolGlow: Phaser.GameObjects.Sprite;
    glowTween: Phaser.Tweens.Tween;
    x: number;
    y: number;
    symbolBaseY: number;
    pressed: boolean;
}

function getBossButtonTextureKey(mapKey: string): string {
    if (mapKey.includes('abandoned')) return 'btn-boss-abandoned';
    if (mapKey.includes('desert')) return 'btn-boss-desert';
    if (mapKey.includes('mechanic')) return 'btn-boss-mechanic';
    if (mapKey.includes('summit')) return 'btn-boss-summit';
    return 'btn-boss-abandoned';
}

export function createBossButtons(
    scene: Phaser.Scene,
    buttonLayer: { objects: any[] },
    mapKey: string
): BossButtonState[] {
    const buttons: BossButtonState[] = [];
    const textureKey = getBossButtonTextureKey(mapKey);

    const animKey = `${BUTTON_PRESS_ANIM_KEY}-${mapKey}`;
    if (!scene.anims.exists(animKey)) {
        scene.anims.create({
            key: animKey,
            frames: scene.anims.generateFrameNumbers(textureKey, { start: 1, end: 2 }),
            frameRate: BUTTON_FRAME_RATE,
            repeat: 0
        });
    }

    buttonLayer.objects.forEach(obj => {
        const x = obj.x || 0;
        const y = obj.y || 0;
        const width = obj.width || 64;
        const height = obj.height || 64;
        const cx = x + width / 2;
        const cy = y + height / 2;

        const button = scene.add.sprite(cx, cy, textureKey, 0).setOrigin(0.5).setDepth(8);

        const symbol = scene.add.sprite(cx, cy + SYMBOL_Y_OFFSET, 'btn-boss-symbol', 0).setOrigin(0.5).setDepth(8.1);

        const symbolGlow = scene.add.sprite(cx, cy + SYMBOL_Y_OFFSET, 'btn-boss-symbol', 0)
            .setOrigin(0.5)
            .setDepth(8.2)
            .setTint(0xffffff)
            .setAlpha(0);
        symbolGlow.setTintMode(Phaser.TintModes.FILL);

        const glowTween = (scene as any).tweens.add({
            targets: symbolGlow,
            alpha: 0.15,
            duration: 3000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        buttons.push({
            button,
            symbol,
            symbolGlow,
            glowTween,
            x: cx,
            y: cy,
            symbolBaseY: cy + SYMBOL_Y_OFFSET,
            pressed: false
        });
    });

    return buttons;
}

export function handleBossButtonInteraction(
    scene: Phaser.Scene,
    buttons: BossButtonState[],
    player: Phaser.Physics.Matter.Sprite,
    interactKeyDown: boolean,
    isCinematic: boolean,
    isTeleporting: boolean,
    isEntering: boolean,
    setCinematic: (val: boolean) => void,
    mapKey: string
): void {
    if (!interactKeyDown || isTeleporting || isEntering || isCinematic) return;

    const animKey = `${BUTTON_PRESS_ANIM_KEY}-${mapKey}`;

    for (const btn of buttons) {
        if (btn.pressed) continue;

        const dist = Phaser.Math.Distance.Between(player.x, player.y, btn.x, btn.y);
        if (dist > INTERACT_DISTANCE) continue;

        btn.pressed = true;
        setCinematic(true);
        player.setVelocity(0, 0);

        const darkVignette = createVignette(scene, 99, true);
        darkVignette.setAlpha(0);

        (scene as any).tweens.add({
            targets: darkVignette,
            alpha: 1,
            duration: 500,
            ease: 'Linear',
            onComplete: () => {
                (scene as any).tweens.add({
                    targets: player,
                    x: btn.x,
                    y: btn.y + 2,
                    duration: WALK_DURATION,
                    ease: 'Quad.easeInOut',
                    onUpdate: () => {
                        const dx = btn.x - player.x;
                        if (Math.abs(dx) > 1) player.setFlipX(dx < 0);
                        if (player.anims.currentAnim?.key !== 'run') player.play('run');
                    },
                    onComplete: () => {
                        player.setVelocity(0, 0);
                        player.play('stop').chain('idle');

                        let frameOffset = 0;
                        btn.button.on('animationupdate', () => {
                            frameOffset++;
                            btn.symbol.y = btn.symbolBaseY + frameOffset;
                            btn.symbolGlow.y = btn.symbolBaseY + frameOffset;
                        });

                        btn.button.play(animKey);
                        ScreenShake.trigger(scene, SHAKE_DURATION, SHAKE_INTENSITY);

                        btn.button.on('animationcomplete', () => {
                            btn.glowTween.stop();
                            btn.symbolGlow.setAlpha(0);

                            (scene as any).tweens.add({
                                targets: darkVignette,
                                alpha: 0,
                                duration: 1000,
                                ease: 'Linear',
                                onComplete: () => {
                                    darkVignette.destroy();
                                    setCinematic(false);
                                }
                            });
                        });
                    }
                });
            }
        });

        return;
    }
}