import * as Phaser from 'phaser';
import { FONT_FAMILY } from '../constants';

const STATUS_DATA: Record<string, { frame: number, name: string, desc: string }> = {
    'slow': { frame: 1, name: 'Slow', desc: 'Skips every other attack.' },
    'venom': { frame: 2, name: 'Venom', desc: 'Stacking damage each turn.' },
    'ignite': { frame: 3, name: 'Ignite', desc: 'Takes flat fire damage each turn.' },
    'overcharge': { frame: 4, name: 'Overcharge', desc: '+50% attack power.' },
    'shatter': { frame: 5, name: 'Shatter', desc: 'Defense reduced to 0.' },
    'dazed': { frame: 6, name: 'Dazed', desc: '50% chance to miss attacks.' },
    'weaken': { frame: 7, name: 'Weaken', desc: 'Enemy damage reduced by 50%.' },
    'fortify': { frame: 8, name: 'Fortify', desc: '+50% defense.' }
};

export interface StatusEffect {
    effect: string;
    duration: number;
    stacks?: number;
    name?: string;
    desc?: string;
    frame?: number;
}

export class StatusEffectUI {
    private scene: Phaser.Scene;
    private tooltip: Phaser.GameObjects.Container | null = null;
    private tooltipTitle: Phaser.GameObjects.Text | null = null;
    private tooltipDesc: Phaser.GameObjects.Text | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    createTooltip(): void {
        this.tooltip = this.scene.add.container(0, 0).setDepth(1000).setScrollFactor(0).setAlpha(0);
        const bg = this.scene.add.rectangle(0, 0, 160, 60, 0x000000, 0.8).setOrigin(0, 1);
        this.tooltipTitle = this.scene.add.text(10, -50, '', {
            fontFamily: FONT_FAMILY, fontSize: '14px', color: '#FFD700', fontStyle: 'bold'
        }).setOrigin(0, 0);
        this.tooltipDesc = this.scene.add.text(10, -30, '', {
            fontFamily: FONT_FAMILY, fontSize: '12px', color: '#FFFFFF', wordWrap: { width: 140 }
        }).setOrigin(0, 0);
        this.tooltip.add([bg, this.tooltipTitle, this.tooltipDesc]);
    }

    syncIcons(effects: StatusEffect[], container: Phaser.GameObjects.Container): void {
        const activeEffects = new Set(effects.map(e => e.effect));
        const isLeftSide = container.x < this.scene.scale.width / 2;

        container.each((child: Phaser.GameObjects.GameObject) => {
            if (child.name && !activeEffects.has(child.name)) {
                child.name = '';
                this.scene.tweens.add({
                    targets: child, scaleX: 0, scaleY: 0, alpha: 0, duration: 300,
                    onComplete: () => { child.destroy(); }
                });
            }
        });

        let index = 0;
        effects.forEach(eff => {
            const data = STATUS_DATA[eff.effect] || { frame: eff.frame ?? 9, name: eff.name || 'Buff', desc: eff.desc || '' };
            if (!data) return;

            const targetY = index * 34;
            let iconContainer = container.getByName(eff.effect) as Phaser.GameObjects.Container;

            if (!iconContainer) {
                iconContainer = this.scene.add.container(0, targetY);
                iconContainer.name = eff.effect;

                const bg = this.scene.add.sprite(0, 0, 'status-btn', 0).setScale(1);
                const icon = this.scene.add.sprite(0, 0, 'status-btn', data.frame).setScale(1);
                iconContainer.add([bg, icon]);

                const hitArea = new Phaser.Geom.Rectangle(-16, -16, 32, 32);
                iconContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

                iconContainer.on('pointerout', () => {
                    if (this.tooltip) this.tooltip.setAlpha(0);
                });
                iconContainer.on('pointermove', (pointer: Phaser.Input.Pointer) => {
                    if (this.tooltip) {
                        const tooltipX = isLeftSide ? pointer.x + 15 : pointer.x - 175;
                        this.tooltip.setPosition(tooltipX, pointer.y - 10);
                    }
                });

                container.add(iconContainer);

                iconContainer.setScale(0);
                iconContainer.setAlpha(0);
                this.scene.tweens.add({
                    targets: iconContainer, scaleX: 1, scaleY: 1, alpha: 1, duration: 300, ease: 'Back.easeOut'
                });
            } else {
                if (iconContainer.y !== targetY) {
                    this.scene.tweens.add({
                        targets: iconContainer, y: targetY, duration: 300, ease: 'Cubic.easeOut'
                    });
                }
            }

            iconContainer.off('pointerover');
            iconContainer.on('pointerover', (pointer: Phaser.Input.Pointer) => {
                if (this.tooltip && this.tooltipTitle && this.tooltipDesc) {
                    let title = data.name;
                    if (eff.stacks) title += ` (${eff.stacks}x)`;
                    if (eff.duration === -1) {
                        title += ` (Perm)`;
                    } else {
                        title += ` - ${eff.duration} TURN`;
                    }
                    this.tooltipTitle.setText(title);
                    this.tooltipDesc.setText(data.desc);

                    const tooltipX = isLeftSide ? pointer.x + 15 : pointer.x - 175;
                    this.tooltip.setPosition(tooltipX, pointer.y - 10);
                    this.tooltip.setAlpha(1);
                }
            });

            index++;
        });
    }
}
