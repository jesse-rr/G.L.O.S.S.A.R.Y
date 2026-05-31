import * as Phaser from 'phaser';
import { InputKeys } from '../../constants';
import { PlayerData } from '../../data/PlayerData';
import { ItemData } from '../../data/ItemData';
import { RuneData } from '../../data/RuneData';
import { LocationData } from '../../data/LocationData';
import { BestiaryData } from '../../data/BestiaryData';
import { SlateProgress } from '../../data/SlateData';

const BG_FRAME_RATE = 8;
const SELECTOR_FRAME_RATE = 10;
const STOP_DELAY = 5000;

const ANIM_DEFS = [
    { index: 0, bgKey: 'home_anim0', start: 0, end: 2 },
    { index: 1, bgKey: 'home_anim1', start: 3, end: 5 },
    { index: 2, bgKey: 'home_anim2', start: 6, end: 8 },
    { index: 3, bgKey: 'home_anim3', start: 9, end: 11 },
] as const;

const CANVAS_SCALE = 2;

const BUTTONS = [
    { label: 'NEW SAVE', srcX: 79, srcY: 178, srcW: 90, srcH: 22 },
    { label: 'CONTINUE', srcX: 79, srcY: 210, srcW: 90, srcH: 22 },
    { label: 'MULTIPLAYER', srcX: 95, srcY: 242, srcW: 126, srcH: 22 },
    { label: 'HELP', srcX: 55, srcY: 274, srcW: 48, srcH: 22 },
    { label: 'EXIT', srcX: 55, srcY: 306, srcW: 44, srcH: 22 },
] as const;

const BUTTON_LEFT_X = 34;
const SEL_SRC_W = 12;
const SEL_GAP = 0;

export class MainMenu extends Phaser.Scene {

    private bg!: Phaser.GameObjects.Sprite;
    private selL!: Phaser.GameObjects.Sprite;
    private selR!: Phaser.GameObjects.Sprite;
    private currentAnim: number = 0;
    private selectedButton: number = 0;
    private stopTimer?: Phaser.Time.TimerEvent;
    private inputLocked = false;
    private confirmContainer?: Phaser.GameObjects.Container;
    private confirmSelectionIndex = 1;
    private confirmBtnRect?: Phaser.GameObjects.Rectangle;
    private cancelBtnRect?: Phaser.GameObjects.Rectangle;

    constructor() {
        super('MainMenu');
    }

    create() {
        for (const def of ANIM_DEFS) {
            this.anims.create({
                key: def.bgKey,
                frames: this.anims.generateFrameNumbers('homeAnim', { start: def.start, end: def.end }),
                frameRate: BG_FRAME_RATE,
                repeat: -1,
            });
        }

        this.anims.create({
            key: 'sel_anim',
            frames: this.anims.generateFrameNumbers('selectorAnim', { start: 0, end: 2 }),
            frameRate: SELECTOR_FRAME_RATE,
            repeat: -1,
        });

        this.bg = this.add.sprite(640, 360, 'homeAnim')
            .setOrigin(0.5, 0.5)
            .setScale(CANVAS_SCALE);

        this.selL = this.add.sprite(0, 0, 'selectorAnim')
            .setOrigin(0.5, 0.5)
            .setScale(CANVAS_SCALE)
            .play('sel_anim');

        this.selR = this.add.sprite(0, 0, 'selectorAnim')
            .setOrigin(0.5, 0.5)
            .setScale(CANVAS_SCALE)
            .setFlipX(true)
            .play('sel_anim');

        const buttonLeft = BUTTON_LEFT_X * CANVAS_SCALE;
        for (let i = 0; i < BUTTONS.length; i++) {
            const btn = BUTTONS[i];

            if (btn.label === 'CONTINUE' && !this.hasExistingGame()) {
                continue;
            }

            const cx = buttonLeft + (btn.srcW * CANVAS_SCALE) / 2;
            const cy = btn.srcY * CANVAS_SCALE;
            const bw = btn.srcW * CANVAS_SCALE;
            const bh = btn.srcH * CANVAS_SCALE;

            const zone = this.add.zone(cx, cy, bw, bh)
                .setOrigin(0.5, 0.5)
                .setInteractive({ cursor: 'pointer' });

            zone.on('pointerover', () => {
                this.positionSelector(i);
                this.input.setDefaultCursor('pointer');
            });
            zone.on('pointerout', () => this.input.setDefaultCursor('default'));
            zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
                if (p.button !== 0) return;
                this.onButtonClick(btn.label);
            });
        }

        this.positionSelector(0);

        this.input.keyboard!.on(InputKeys.UP, () => this.moveSelection(-1, false));
        this.input.keyboard!.on(InputKeys.DOWN, () => this.moveSelection(1, false));
        this.input.keyboard!.on(InputKeys.LEFT, () => this.moveSelection(-1, true));
        this.input.keyboard!.on(InputKeys.RIGHT, () => this.moveSelection(1, true));
        this.input.keyboard!.on(InputKeys.ENTER, () => {
            if (this.confirmContainer) {
                if (this.confirmSelectionIndex === 0) {
                    this.confirmContainer.destroy();
                    this.confirmContainer = undefined;
                    this.startNewGame();
                } else {
                    this.confirmContainer.destroy();
                    this.confirmContainer = undefined;
                    this.inputLocked = false;
                }
            } else {
                this.onButtonClick(BUTTONS[this.selectedButton].label);
            }
        });
        this.input.keyboard!.on(InputKeys.HELP, () => this.onButtonClick('HELP'));
        this.input.keyboard!.on(InputKeys.BACK, () => {
            if (this.confirmContainer) {
                this.confirmContainer.destroy();
                this.confirmContainer = undefined;
                this.inputLocked = false;
            }
        });

        this.scale.on('resize', this.resize, this);
        this.playCurrentAnim();
    }

    private hasExistingGame(): boolean {
        return !!localStorage.getItem('glossary_player_data');
    }

    private startNewGame() {
        this.inputLocked = true;
        try { PlayerData.getInstance().reset(); } catch (_e) {}
        try { ItemData.getInstance().reset(); } catch (_e) {}
        try { RuneData.getInstance().reset(); } catch (_e) {}
        try { LocationData.getInstance().reset(); } catch (_e) {}
        try { BestiaryData.getInstance().reset(); } catch (_e) {}
        try { SlateProgress.getInstance().reset(); } catch (_e) {}
        localStorage.removeItem('glossary_selected_items');
        localStorage.removeItem('glossary_physical_slate_mapping');
        localStorage.removeItem('glossary_selected_slate_id');
        localStorage.removeItem('glossary_completed_combats');
        localStorage.removeItem('glossary_echojar_completed_combats');
        localStorage.removeItem('glossary_seraphs_plume_consumed');
        localStorage.removeItem('glossary_boss_presses');
        localStorage.removeItem('glossary_boss_fight_active');
        localStorage.removeItem('glossary_boss_pillars_defeated');
        localStorage.removeItem('glossary_boss_remaining_pillars');
        localStorage.removeItem('glossary_boss_current_combat_pillar');
        localStorage.removeItem('glossary_boss_combat_victory');
        localStorage.removeItem('glossary_last_floor');
        localStorage.removeItem('merchant_shop_state')
        localStorage.removeItem('glossary_mechanic_doors')
        localStorage.removeItem('glossary_settlement_doors')
        this.scene.launch('TransitionScene', { targetScene: 'Covenant', currentScene: 'MainMenu' });
    }

    private showConfirmOverlay() {
        if (this.confirmContainer) return;
        this.inputLocked = true;

        const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.8)
            .setOrigin(0, 0)
            .setInteractive();

        this.confirmContainer = this.add.container(0, 0).setDepth(100);
        this.confirmContainer.add(overlay);

        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        const box = this.add.rectangle(cx, cy, 340, 140, 0x111111, 1)
            .setStrokeStyle(2, 0x444444);
        this.confirmContainer.add(box);

        const text = this.add.text(cx, cy - 30, 'YOU ALREADY HAVE A SAVE.', {
            fontFamily: 'VCRosdNEUE', fontSize: '18px', color: '#ffffff'
        }).setOrigin(0.5);

        const subtext = this.add.text(cx, cy - 10, 'STARTING A NEW GAME WILL OVERWRITE IT.', {
            fontFamily: 'VCRosdNEUE', fontSize: '12px', color: '#aaaaaa'
        }).setOrigin(0.5);

        this.confirmContainer.add([text, subtext]);

        this.confirmBtnRect = this.add.rectangle(cx - 70, cy + 35, 120, 30, 0x444444)
            .setInteractive({ cursor: 'pointer' });
        const confirmText = this.add.text(cx - 70, cy + 35, 'CONFIRM', {
            fontFamily: 'VCRosdNEUE', fontSize: '16px', color: '#ffffff'
        }).setOrigin(0.5);

        this.cancelBtnRect = this.add.rectangle(cx + 70, cy + 35, 120, 30, 0x444444)
            .setInteractive({ cursor: 'pointer' });
        const cancelText = this.add.text(cx + 70, cy + 35, 'CANCEL', {
            fontFamily: 'VCRosdNEUE', fontSize: '16px', color: '#ffffff'
        }).setOrigin(0.5);

        this.confirmContainer.add([this.confirmBtnRect, confirmText, this.cancelBtnRect, cancelText]);

        this.confirmSelectionIndex = 1;
        this.updateConfirmSelection();

        this.confirmBtnRect.on('pointerover', () => {
            this.confirmSelectionIndex = 0;
            this.updateConfirmSelection();
        });
        
        this.cancelBtnRect.on('pointerover', () => {
            this.confirmSelectionIndex = 1;
            this.updateConfirmSelection();
        });

        this.confirmBtnRect.on('pointerdown', () => {
            this.confirmContainer!.destroy();
            this.confirmContainer = undefined;
            this.startNewGame();
        });

        this.cancelBtnRect.on('pointerdown', () => {
            this.confirmContainer!.destroy();
            this.confirmContainer = undefined;
            this.inputLocked = false;
        });
    }

    private addColorTween(rect: Phaser.GameObjects.Rectangle, targetColor: number) {
        if (!rect) return;
        const startColor = rect.fillColor;
        if (startColor === targetColor) return;

        const startRGB = Phaser.Display.Color.IntegerToColor(startColor);
        const endRGB = Phaser.Display.Color.IntegerToColor(targetColor);

        if (rect.getData('colorTween')) {
            (rect.getData('colorTween') as Phaser.Tweens.Tween).stop();
        }

        const tween = this.tweens.addCounter({
            from: 0,
            to: 100,
            duration: 150,
            ease: 'Sine.easeInOut',
            onUpdate: (tw) => {
                const val = tw.getValue();
                const colorObject = Phaser.Display.Color.Interpolate.ColorWithColor(startRGB, endRGB, 100, val ?? undefined);
                const color = Phaser.Display.Color.GetColor(colorObject.r, colorObject.g, colorObject.b);
                rect.setFillStyle(color);
            }
        });
        rect.setData('colorTween', tween);
    }

    private updateConfirmSelection() {
        if (!this.confirmContainer || !this.confirmBtnRect || !this.cancelBtnRect) return;

        if (this.confirmSelectionIndex === 0) {
            this.addColorTween(this.confirmBtnRect, 0x2e662a);
            this.addColorTween(this.cancelBtnRect, 0x444444);
        } else {
            this.addColorTween(this.confirmBtnRect, 0x444444);
            this.addColorTween(this.cancelBtnRect, 0x8a2323);
        }
    }

    private onButtonClick(label: string) {
        if (this.inputLocked) return;
        switch (label) {
            case 'NEW SAVE':
                if (this.hasExistingGame()) {
                    this.showConfirmOverlay();
                } else {
                    this.startNewGame();
                }
                break;
            case 'CONTINUE':
                if (this.hasExistingGame()) {
                    this.inputLocked = true;
                    const pData = PlayerData.getInstance();
                    if (PlayerData.shouldReturnToSummitBossBattle(pData)) {
                        pData.returnToSummitBossBattle();
                        this.scene.launch('TransitionScene', {
                            targetScene: 'LevelScene',
                            currentScene: 'MainMenu',
                            targetData: { mapKey: 'summit-settlement' }
                        });
                    } else if (pData.inCombat) {
                        this.scene.launch('TransitionScene', { 
                            targetScene: 'CombatScene', 
                            currentScene: 'MainMenu', 
                            targetData: { encounterTier: pData.combatTier, mapKey: pData.lastMap, enemyId: pData.combatEnemyId } 
                        });
                    } else {
                        const targetData: { mapKey: string; spawnX?: number; spawnY?: number } = {
                            mapKey: pData.lastMap || 'hub'
                        };
                        if (pData.lastX != null && pData.lastY != null) {
                            targetData.spawnX = pData.lastX;
                            targetData.spawnY = pData.lastY;
                        }
                        this.scene.launch('TransitionScene', {
                            targetScene: 'LevelScene',
                            currentScene: 'MainMenu',
                            targetData
                        });
                    }
                }
                break;
            case 'MULTIPLAYER':
                this.scene.pause();
                this.scene.launch('Multiplayer');
                break;
            case 'HELP':
                this.scene.pause();
                this.scene.launch('Help');
                break;
            case 'EXIT':
                localStorage.clear();
                window.location.reload();
                break;
        }
    }

    private positionSelector(i: number) {
        const btn = BUTTONS[i];
        const buttonLeft = BUTTON_LEFT_X * CANVAS_SCALE;
        const cx = buttonLeft + (btn.srcW * CANVAS_SCALE) / 2;
        const cy = btn.srcY * CANVAS_SCALE;
        const bw = btn.srcW * CANVAS_SCALE;
        const selDisplayW = SEL_SRC_W * CANVAS_SCALE;

        this.selL.setPosition(cx - bw / 2 - SEL_GAP - selDisplayW / 2, cy);
        this.selR.setPosition(cx + bw / 2 + SEL_GAP + selDisplayW / 2, cy);
    }

    private playCurrentAnim() {
        const def = ANIM_DEFS[this.currentAnim];

        this.bg.stop();
        this.bg.setFrame(def.start);

        this.stopTimer = this.time.delayedCall(STOP_DELAY, () => {
            this.bg.once(Phaser.Animations.Events.ANIMATION_COMPLETE, this.advanceAnim, this);
            this.bg.play({ key: def.bgKey, repeat: 0 });
        }, [], this);
    }

    private advanceAnim() {
        this.currentAnim = (this.currentAnim + 1) % ANIM_DEFS.length;
        this.playCurrentAnim();
    }

    private moveSelection(dir: number, isHorizontal: boolean = false) {
        if (this.confirmContainer) {
            if (isHorizontal) {
                this.confirmSelectionIndex = (this.confirmSelectionIndex === 0) ? 1 : 0;
                this.updateConfirmSelection();
            }
            return;
        }

        if (isHorizontal) return;

        this.selectedButton = Phaser.Math.Wrap(this.selectedButton + dir, 0, BUTTONS.length);

        if (BUTTONS[this.selectedButton].label === 'CONTINUE' && !this.hasExistingGame()) {
            this.selectedButton = Phaser.Math.Wrap(this.selectedButton + dir, 0, BUTTONS.length);
        }

        this.positionSelector(this.selectedButton);
    }

    private resize() {
        const { width, height } = this.scale;
        const scale = Math.max(width / 640, height / 360);
        this.bg.setPosition(width / 2, height / 2).setScale(scale);
    }

    shutdown() {
        this.stopTimer?.remove(false);
        this.scale.off('resize', this.resize, this);
        this.input.setDefaultCursor('default');
    }
}
