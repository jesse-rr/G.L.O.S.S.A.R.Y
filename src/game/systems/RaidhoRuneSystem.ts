import * as Phaser from 'phaser';
import {
    FONT_FAMILY,
    RUNE_FONT,
    RAIDHO_CHAR,
    RAIDHO_START_COLOR,
    RAIDHO_END_COLOR,
    RAIDHO_FONT_SIZE,
    RAIDHO_HOLD_DURATION,
    RAIDHO_INTERACT_RANGE,
    RAIDHO_MOUNT_OFFSET_Y,
    MAX_FLOORS
} from '../constants';
import { PlayerData } from '../data/PlayerData';
import { NetworkManager } from '../NetworkManager';
import { InteractSystem } from './InteractSystem';
import { getTotalCompletedCombats } from './PipeSystem';
import { clearCompletedCombats } from '../utils/CombatProgress';
import { AudioManager } from '../utils/AudioManager';

const MAX_COMBATS = 3;

const START_R = (RAIDHO_START_COLOR >> 16) & 0xff;
const START_G = (RAIDHO_START_COLOR >> 8) & 0xff;
const START_B = RAIDHO_START_COLOR & 0xff;

const END_R = (RAIDHO_END_COLOR >> 16) & 0xff;
const END_G = (RAIDHO_END_COLOR >> 8) & 0xff;
const END_B = RAIDHO_END_COLOR & 0xff;

export class RaidhoRuneSystem {
    private scene: Phaser.Scene;
    private runeText!: Phaser.GameObjects.Text;
    private glintOverlay!: Phaser.GameObjects.Text;
    private tweens: Phaser.Tweens.Tween[] = [];
    private holdTimer: number = 0;
    private completedCombats: number = 0;
    private mountX: number = 0;
    private mountY: number = 0;
    private teleporting: boolean = false;

    private activeSpeechText: Phaser.GameObjects.Text | null = null;
    private speechOffsetY: number = -42;
    private speechTween: Phaser.Tweens.Tween | null = null;

    constructor(scene: Phaser.Scene, mountX: number, mountY: number) {
        this.scene = scene;
        this.mountX = mountX;
        this.mountY = mountY + RAIDHO_MOUNT_OFFSET_Y;
        this.completedCombats = getTotalCompletedCombats();

        this.createRune();

        if (this.completedCombats > 0) {
            this.startPulseAnimation();
        }

        scene.events.on('shutdown', this.destroy, this);
        scene.events.on('destroy', this.destroy, this);
    }

    private createRune(): void {
        const color = this.buildColorString(this.completedCombats);

        this.runeText = this.scene.add.text(this.mountX, this.mountY - 38, RAIDHO_CHAR, {
            fontFamily: RUNE_FONT,
            fontSize: RAIDHO_FONT_SIZE,
            color: color,
            resolution: 2,
            metrics: { ascent: 34, descent: 6, fontSize: 40 }
        }).setOrigin(0.5).setDepth(12);

        this.glintOverlay = this.scene.add.text(this.mountX, this.mountY - 38, RAIDHO_CHAR, {
            fontFamily: RUNE_FONT,
            fontSize: RAIDHO_FONT_SIZE,
            color: '#ffffff',
            resolution: 2,
            metrics: { ascent: 34, descent: 6, fontSize: 40 }
        }).setOrigin(0.5).setDepth(12).setAlpha(0);
    }

    private buildColorString(combats: number): string {
        const t = Math.min(combats / MAX_COMBATS, 1);
        const r = Math.round(START_R + (END_R - START_R) * t);
        const g = Math.round(START_G + (END_G - START_G) * t);
        const b = Math.round(START_B + (END_B - START_B) * t);
        return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
    }

    private startPulseAnimation(): void {
        const maxAlpha = this.completedCombats === 1 ? 0.08 : this.completedCombats === 2 ? 0.18 : 0.35;
        const glintTween = this.scene.tweens.add({
            targets: this.glintOverlay,
            alpha: { from: 0, to: maxAlpha },
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        this.tweens.push(glintTween);
    }

    refreshProgress(): void {
        const nextCompletedCombats = getTotalCompletedCombats();
        if (nextCompletedCombats === this.completedCombats) return;

        this.completedCombats = nextCompletedCombats;
        this.runeText.setColor(this.buildColorString(this.completedCombats));
        this.glintOverlay.setAlpha(0);

        this.tweens.forEach(t => t.stop());
        this.tweens = [];
        if (this.completedCombats > 0) {
            this.startPulseAnimation();
        }
    }

    private wasInteractPressed: boolean = false;

    update(
        player: Phaser.Physics.Matter.Sprite,
        interactKeyDown: boolean,
        delta: number,
        isCinematic: boolean,
        isTeleporting: boolean,
        isEntering: boolean,
        setCinematic: (val: boolean) => void
    ): void {
        if (this.teleporting) return;

        if (this.activeSpeechText && this.activeSpeechText.active) {
            this.activeSpeechText.setPosition(player.x, player.y + this.speechOffsetY);
        }

        if (isCinematic || isTeleporting || isEntering) {
            this.holdTimer = 0;
            this.wasInteractPressed = interactKeyDown;
            return;
        }

        const dist = Phaser.Math.Distance.Between(player.x, player.y, this.mountX, this.mountY);
        if (dist < RAIDHO_INTERACT_RANGE) {
            if (this.completedCombats >= MAX_COMBATS) {
                if (interactKeyDown) {
                    this.holdTimer += delta;
                } else {
                    this.holdTimer = 0;
                }

                const progress = Math.min(this.holdTimer / RAIDHO_HOLD_DURATION, 1);
                InteractSystem.getInstance(this.scene).show(this.mountX, this.mountY - 63, progress);

                if (this.holdTimer >= RAIDHO_HOLD_DURATION) {
                    this.holdTimer = 0;
                    this.startWalkSequence(player, setCinematic);
                }
            } else {
                InteractSystem.getInstance(this.scene).show(this.mountX, this.mountY - 63, 0);

                if (interactKeyDown && !this.wasInteractPressed) {
                    let text = '';
                    if (this.completedCombats === 0) {
                        text = "The rune is cold and silent. The pipes leading to it are completely empty.";
                    } else if (this.completedCombats === 1) {
                        text = "One pipe seems filled by some strange energy, the rune is glowing, but only slightly...";
                    } else if (this.completedCombats === 2) {
                        text = "Only one missing pipe, the rune is almost asking to be activated.";
                    }

                    if (text) {
                        if (this.activeSpeechText) {
                            if (this.speechTween) this.speechTween.stop();
                            this.activeSpeechText.destroy();
                            this.activeSpeechText = null;
                        }

                        this.activeSpeechText = this.scene.add.text(player.x, player.y, text, {
                            fontFamily: FONT_FAMILY,
                            fontSize: '12px',
                            color: '#e4dacf',
                            align: 'center',
                            stroke: '#141417',
                            strokeThickness: 2,
                            wordWrap: { width: 220 }
                        }).setOrigin(0.5, 0).setDepth(200).setAlpha(0).setScale(0.5);

                        this.speechTween = this.scene.tweens.add({
                            targets: this,
                            speechOffsetY: -52,
                            duration: 350,
                            ease: 'Quad.easeOut',
                            onStart: () => {
                                if (this.activeSpeechText) this.activeSpeechText.setAlpha(0);
                            },
                            onUpdate: () => {
                                if (this.activeSpeechText && this.activeSpeechText.active) {
                                    this.activeSpeechText.setAlpha(Math.min(1, (this.speechOffsetY + 42) / -10));
                                }
                            },
                            onComplete: () => {
                                if (this.activeSpeechText) this.activeSpeechText.setAlpha(1);
                                this.scene.time.delayedCall(3000, () => {
                                    if (this.activeSpeechText && this.activeSpeechText.active) {
                                        this.speechTween = this.scene.tweens.add({
                                            targets: this,
                                            speechOffsetY: -62,
                                            duration: 400,
                                            ease: 'Quad.easeIn',
                                            onUpdate: () => {
                                                if (this.activeSpeechText && this.activeSpeechText.active) {
                                                    this.activeSpeechText.setAlpha(Math.max(0, 1 - (this.speechOffsetY + 52) / -10));
                                                }
                                            },
                                            onComplete: () => {
                                                if (this.activeSpeechText) {
                                                    this.activeSpeechText.destroy();
                                                    this.activeSpeechText = null;
                                                }
                                                this.speechTween = null;
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                }
            }
        } else {
            this.holdTimer = 0;
        }

        this.wasInteractPressed = interactKeyDown;
    }

    private startWalkSequence(player: Phaser.Physics.Matter.Sprite, setCinematic: (val: boolean) => void): void {
        this.teleporting = true;
        setCinematic(true);
        player.setVelocity(0, 0);

        this.scene.tweens.add({
            targets: player,
            x: this.mountX,
            y: this.mountY - 30,
            duration: 400,
            ease: 'Quad.easeInOut',
            onUpdate: () => {
                const dx = this.mountX - player.x;
                if (Math.abs(dx) > 1) player.setFlipX(dx < 0);
                if (player.anims.currentAnim?.key !== 'run-start' && player.anims.currentAnim?.key !== 'run-loop') {
                    player.play('run-start').chain('run-loop');
                }
            },
            onComplete: () => {
                player.setVelocity(0, 0);
                player.play('stop').chain('idle');
                this.triggerTeleport();
            }
        });
    }

    private triggerTeleport(): void {
        this.scene.cameras.main.fadeOut(1000, 255, 255, 255);
        new AudioManager(this.scene).playTeleportWhoosh();

        this.scene.time.delayedCall(1000, () => {
            this.advanceFloor();
        });
    }

    private advanceFloor(): void {
        const playerData = PlayerData.getInstance();
        const nextFloor = playerData.currentFloor + 1;

        if (playerData.combatTier >= 3 && playerData.currentFloor == 3) {
            playerData.currentFloor = 3;
            clearCompletedCombats();
            playerData.hubDoorOpened = false;
            playerData.save();
            this.broadcastMapChange('summit-settlement', playerData);
            this.scene.scene.restart({ mapKey: 'summit-settlement', teleportFromRune: true });
        } else {
            playerData.currentFloor = nextFloor > MAX_FLOORS ? 1 : nextFloor;
            clearCompletedCombats();
            playerData.hubDoorOpened = false;
            playerData.save();
            this.broadcastMapChange('hub', playerData);
            this.scene.scene.restart({ mapKey: 'hub', teleportFromRune: true });
        }
    }

    private broadcastMapChange(targetMap: string, playerData: PlayerData): void {
        const nm = NetworkManager.getInstance();
        if (nm.role === 'offline') return;

        nm.broadcast({
            type: 'MAP_CHANGE',
            targetMap,
            previousMap: 'hub',
            entryDirX: 0,
            entryDirY: 0,
            teleportFromRune: true,
            currentFloor: playerData.currentFloor,
            hubDoorOpened: playerData.hubDoorOpened,
            originPeerId: nm.myPeerId
        });
    }

    destroy(): void {
        this.tweens.forEach(t => t.stop());
        this.tweens = [];
        if (this.speechTween) {
            this.speechTween.stop();
            this.speechTween = null;
        }
        if (this.activeSpeechText) {
            this.activeSpeechText.destroy();
            this.activeSpeechText = null;
        }
        if (this.runeText) this.runeText.destroy();
        if (this.glintOverlay) this.glintOverlay.destroy();
        this.scene.events.off('shutdown', this.destroy, this);
        this.scene.events.off('destroy', this.destroy, this);
    }
}
