import * as Phaser from 'phaser';
import { FONT_FAMILY } from '../constants';
import { EventBus, GameEvents } from '../EventBus';

export interface CompletedCombat {
    enemyName: string;
    gems: number;
    specialCur: number;
}

export class CombatTrackerHUD {
    private scene: Phaser.Scene;
    private mapKey: string;
    private container: Phaser.GameObjects.Container;
    private sprites: Phaser.GameObjects.Sprite[] = [];
    private tweens: Phaser.Tweens.Tween[] = [];
    private tooltip: Phaser.GameObjects.Container | null = null;
    private completedList: CompletedCombat[] = [];

    constructor(scene: Phaser.Scene, mapKey: string) {
        this.scene = scene;
        this.mapKey = mapKey;
        this.container = this.scene.add.container(0, 0).setDepth(200).setScrollFactor(0);
        this.loadCompletedCombats();
        this.createIcons();
        EventBus.on(GameEvents.COMBAT_PROGRESS_CHANGED, this.refreshProgress, this);
        this.scene.events.on('shutdown', this.destroy, this);
        this.scene.events.on('destroy', this.destroy, this);
    }

    public refreshProgress(): void {
        this.hideTooltip();
        this.tweens.forEach(t => t.stop());
        this.tweens = [];
        this.sprites.forEach(s => s.destroy());
        this.sprites = [];
        this.loadCompletedCombats();
        this.createIcons();
    }

    private getFloorMapKey(mapKey: string): string {
        if (mapKey.includes('abandoned')) {
            localStorage.setItem('glossary_last_floor', 'abandoned');
            return 'boss-floor-abandoned';
        }
        if (mapKey.includes('desert')) {
            localStorage.setItem('glossary_last_floor', 'desert');
            return 'boss-floor-desert';
        }
        if (mapKey.includes('mechanic')) {
            localStorage.setItem('glossary_last_floor', 'mechanic');
            return 'boss-floor-mechanic';
        }
        const lastFloor = localStorage.getItem('glossary_last_floor') || 'abandoned';
        return `boss-floor-${lastFloor}`;
    }

    private loadCompletedCombats(): void {
        const raw = localStorage.getItem('glossary_completed_combats');
        const targetMapKey = this.getFloorMapKey(this.mapKey);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                this.completedList = parsed[targetMapKey] || [];
            } catch (e) {
                this.completedList = [];
            }
        } else {
            this.completedList = [];
        }
    }

    private createIcons(): void {
        const w = this.scene.scale.width;
        const h = this.scene.scale.height;
        const camZoom = 2;

        for (let i = 0; i < 3; i++) {
            const screenX = 40 + i * 45;
            const screenY = 35;

            const cx = (screenX - w / 2) / camZoom + w / 2;
            const cy = (screenY - h / 2) / camZoom + h / 2;

            const isDone = i < this.completedList.length;

            const sprite = this.scene.add.sprite(cx, cy, 'combat-symbol-ui', i)
                .setScrollFactor(0)
                .setDepth(201)
                .setScale(1 / camZoom);

            if (isDone) {
                sprite.clearTint();
                sprite.setAlpha(1);

                const tween = this.scene.tweens.add({
                    targets: sprite,
                    y: cy + 2,
                    duration: 1000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut',
                    delay: i * 250
                });
                this.tweens.push(tween);

                const combatIndex = i;
                sprite.setInteractive({ useHandCursor: true });
                sprite.on('pointerover', (pointer: Phaser.Input.Pointer) => {
                    this.showTooltip(pointer.x, pointer.y, combatIndex);
                });
                sprite.on('pointerout', () => {
                    this.hideTooltip();
                });
                sprite.on('pointermove', (pointer: Phaser.Input.Pointer) => {
                    if (this.tooltip) {
                        const screenX = pointer.x + 15 + 75;
                        const screenY = pointer.y;
                        const tx = (screenX - w / 2) / camZoom + w / 2;
                        const ty = (screenY - h / 2) / camZoom + h / 2;
                        this.tooltip.setPosition(tx, ty);
                    }
                });
            } else {
                sprite.setTint(0x333333);
                sprite.setAlpha(0.5);
            }

            this.sprites.push(sprite);
            this.container.add(sprite);
        }
    }

    private showTooltip(mouseX: number, mouseY: number, index: number): void {
        this.hideTooltip();

        const data = this.completedList[index];
        if (!data) return;

        const w = this.scene.scale.width;
        const h = this.scene.scale.height;
        const camZoom = 2;

        const screenX = mouseX + 15 + 75;
        const screenY = mouseY;

        const cx = (screenX - w / 2) / camZoom + w / 2;
        const cy = (screenY - h / 2) / camZoom + h / 2;

        this.tooltip = this.scene.add.container(cx, cy).setDepth(250).setScrollFactor(0).setScale(1 / camZoom);

        const romanNumerals = ['I', 'II', 'III'];
        const titleTextStr = `COMBAT ${romanNumerals[index]}`;
        const enemyTextStr = `Foe: ${data.enemyName}`;
        const rewardTextStr = `+${data.gems} Gems  +${data.specialCur} SC`;

        const titleText = this.scene.add.text(0, -18, titleTextStr, {
            fontFamily: FONT_FAMILY,
            fontSize: '14px',
            color: '#FFD700',
            resolution: 4
        }).setOrigin(0.5);

        const enemyText = this.scene.add.text(0, -1, enemyTextStr, {
            fontFamily: FONT_FAMILY,
            fontSize: '12px',
            color: '#ffffff',
            resolution: 4
        }).setOrigin(0.5);

        const rewardText = this.scene.add.text(0, 15, rewardTextStr, {
            fontFamily: FONT_FAMILY,
            fontSize: '11px',
            color: '#aaffaa',
            resolution: 4
        }).setOrigin(0.5);

        const bg = this.scene.add.rectangle(0, 0, 150, 62, 0x000000, 0.85)
            .setOrigin(0.5)
            .setStrokeStyle(1.5, 0x847E87);

        this.tooltip.add([bg, titleText, enemyText, rewardText]);
        this.container.add(this.tooltip);
    }

    private hideTooltip(): void {
        if (this.tooltip) {
            this.tooltip.destroy();
            this.tooltip = null;
        }
    }

    public destroy(): void {
        this.hideTooltip();
        this.tweens.forEach(t => t.stop());
        this.tweens = [];
        this.sprites.forEach(s => s.destroy());
        this.sprites = [];
        this.container.destroy();
        EventBus.off(GameEvents.COMBAT_PROGRESS_CHANGED, this.refreshProgress, this);
        this.scene.events.off('shutdown', this.destroy, this);
        this.scene.events.off('destroy', this.destroy, this);
    }
}
