// RuneIndicatorSystem.ts

import * as Phaser from 'phaser';
import { createVignette } from '../utils/Vignette';
import { fadeIn, fadeOutAndDestroy } from '../utils/TweenUtils';
import { ScreenShake } from '../utils/ScreenShake';
import { InteractSystem } from './InteractSystem';

const RUNE_INTERACT_WIDTH = 110;
const RUNE_INTERACT_HEIGHT = 81;
const RUNE_LIFETIME_MS = 12000;
const RUNE_EXIT_AFTER_LEAVE_MS = 10000;
const RUNE_RESPAWN_DELAY_MS = RUNE_LIFETIME_MS;
const POST_PILLAR_MOVE_MS = 3000;
const POST_PILLAR_ATTACK_MIN_MS = 10000;
const POST_PILLAR_ATTACK_MAX_MS = 20000;
const POST_PILLAR_PILLAR_WINDOW_MS = 5000;

export class RuneIndicatorSystem {
    private scene: Phaser.Scene;
    private player: Phaser.Physics.Matter.Sprite;
    private activeIndicators: RuneIndicator[] = [];
    private spawnTimers: Phaser.Time.TimerEvent[] = [];
    private isActive = false;
    private playArea: { x: number; y: number; width: number; height: number; minX: number; maxX: number; minY: number; maxY: number };
    private pillarPositions: { x: number; y: number; index: number; activated: boolean }[] = [];
    private remainingPillars: number[] = [];
    private currentPillarIndex = 0;
    private bossAttackSystem: any;
    private onAllPillarsDefeated?: () => void;
    private onPillarDamaged?: (pillarsDefeated: number) => void;
    private pendingPillarDamageCount: number | null = null;
    private pillarsDefeated = 0;
    private baseAttackSpeed = 1;
    private currentAttackSpeed = 1;
    private isBattleEnding = false;
    private tentaclesAnimation?: Phaser.GameObjects.Sprite;
    private originalZoom = 2;
    private originalScrollX = 0;
    private originalScrollY = 0;
    private mapCenterX = -300;
    private mapCenterY = -200;
    private attackPhaseTimer?: Phaser.Time.TimerEvent;
    private pauseReasons = new Set<string>();
    private pendingPostPillarCycle = false;
    private attacksPaused = false;

    constructor(scene: Phaser.Scene, player: Phaser.Physics.Matter.Sprite, barrierObjects: { x: number; y: number; width: number; height: number }[], customPillarPositions?: { x: number; y: number }[]) {
        this.scene = scene;
        this.player = player;
        this.playArea = this.calculatePlayArea(barrierObjects);
        this.initializePillarPositions(customPillarPositions);
        this.originalZoom = this.scene.cameras.main.zoom;
    }

    private initializePillarPositions(customPillarPositions?: { x: number; y: number }[]): void {
        if (customPillarPositions && customPillarPositions.length === 4) {
            this.pillarPositions = customPillarPositions.map((pos, idx) => ({
                x: pos.x,
                y: pos.y,
                index: idx,
                activated: false
            }));
        } else {
            this.pillarPositions = [
                { x: this.playArea.minX + 150, y: this.playArea.minY + 150, index: 0, activated: false },
                { x: this.playArea.maxX - 150, y: this.playArea.minY + 150, index: 1, activated: false },
                { x: this.playArea.minX + 150, y: this.playArea.maxY - 150, index: 2, activated: false },
                { x: this.playArea.maxX - 150, y: this.playArea.maxY - 150, index: 3, activated: false }
            ];
        }
        this.remainingPillars = [0, 1, 2, 3];
    }

    private calculatePlayArea(barrierObjects: { x: number; y: number; width: number; height: number }[]): { x: number; y: number; width: number; height: number; minX: number; maxX: number; minY: number; maxY: number } {
        if (barrierObjects.length === 0) {
            return { x: 0, y: 0, width: 704, height: 640, minX: -352, maxX: 352, minY: -320, maxY: 320 };
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const obj of barrierObjects) {
            const left = obj.x - obj.width / 2;
            const right = obj.x + obj.width / 2;
            const top = obj.y - obj.height / 2;
            const bottom = obj.y + obj.height / 2;

            minX = Math.min(minX, left);
            maxX = Math.max(maxX, right);
            minY = Math.min(minY, top);
            maxY = Math.max(maxY, bottom);
        }

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const width = maxX - minX;
        const height = maxY - minY;

        return {
            x: centerX,
            y: centerY,
            width: width,
            height: height,
            minX: minX,
            maxX: maxX,
            minY: minY,
            maxY: maxY
        };
    }

    setBossAttackSystem(bossAttackSystem: any): void {
        this.bossAttackSystem = bossAttackSystem;
        this.updateAttackSpeed();
    }

    setTentaclesAnimation(tentacles: Phaser.GameObjects.Sprite): void {
        this.tentaclesAnimation = tentacles;
    }

    setOnPillarDamaged(callback: (pillarsDefeated: number) => void): void {
        this.onPillarDamaged = callback;
    }

    getPillarsDefeated(): number {
        return this.pillarsDefeated;
    }

    hasPendingPillarDamage(): boolean {
        return this.pendingPillarDamageCount !== null;
    }

    playPendingPillarDamage(): void {
        if (this.pendingPillarDamageCount === null) return;
        const count = this.pendingPillarDamageCount;
        this.pendingPillarDamageCount = null;
        this.onPillarDamaged?.(count);
    }

    private updateAttackSpeed(): void {
        if (!this.bossAttackSystem) return;

        this.currentAttackSpeed = this.baseAttackSpeed + (this.pillarsDefeated * 0.3);
        this.bossAttackSystem.setAttackSpeedMultiplier(this.currentAttackSpeed);
        if (typeof this.bossAttackSystem.setPillarsActivated === 'function') {
            this.bossAttackSystem.setPillarsActivated(this.pillarsDefeated);
        }
    }

    startBattle(onAllPillarsDefeated?: () => void): void {
        this.isActive = true;
        this.isBattleEnding = false;
        if (onAllPillarsDefeated) {
            this.onAllPillarsDefeated = onAllPillarsDefeated;
        }

        const isBossActive = localStorage.getItem('glossary_boss_fight_active') === 'true';
        if (isBossActive) {
            this.pillarsDefeated = parseInt(localStorage.getItem('glossary_boss_pillars_defeated') || '0', 10);
            try {
                this.remainingPillars = JSON.parse(localStorage.getItem('glossary_boss_remaining_pillars') || '[0,1,2,3]');
            } catch {
                this.remainingPillars = [0, 1, 2, 3];
            }

            const justWon = localStorage.getItem('glossary_boss_combat_victory') === 'true';
            if (justWon) {
                localStorage.removeItem('glossary_boss_combat_victory');
                const lastFoughtPillar = parseInt(localStorage.getItem('glossary_boss_current_combat_pillar') || '0', 10);
                this.pillarsDefeated++;
                this.remainingPillars = this.remainingPillars.filter(p => p !== lastFoughtPillar);

                this.persistBossProgress();
                this.pendingPillarDamageCount = this.pillarsDefeated;
                this.pendingPostPillarCycle = true;
            }
        } else {
            this.pillarsDefeated = 0;
            this.remainingPillars = [0, 1, 2, 3];
            localStorage.setItem('glossary_boss_fight_active', 'true');
            this.persistBossProgress();
        }

        this.updateAttackSpeed();

        if (this.bossAttackSystem && typeof this.bossAttackSystem.startAttacks === 'function') {
            this.bossAttackSystem.startAttacks();
        }

        if (this.pendingPostPillarCycle) {
            this.pendingPostPillarCycle = false;
            this.triggerPostPillarAttackCycle();
        }

        if (this.pillarsDefeated >= 4) {
            this.endBattle();
        } else if (this.activeIndicators.length === 0) {
            this.spawnNextPillar();
        }
    }

    public stopBattle(): void {
        if (this.bossAttackSystem) {
            this.bossAttackSystem.stopAttacks();
        }
        this.isActive = false;
        this.isBattleEnding = true;
        if (this.attackPhaseTimer) {
            this.attackPhaseTimer.remove();
            this.attackPhaseTimer = undefined;
        }
        this.clearAttackPhaseTimer();
        this.pauseReasons.clear();
        this.attacksPaused = false;
        this.syncAttackPause();
        this.spawnTimers.forEach(timer => timer.remove());
        this.spawnTimers = [];
        const fading = [...this.activeIndicators];
        this.activeIndicators = [];
        fading.forEach(indicator => indicator.fadeOutAndDestroy());
    }

    private persistBossProgress(): void {
        localStorage.setItem('glossary_boss_pillars_defeated', String(this.pillarsDefeated));
        localStorage.setItem('glossary_boss_remaining_pillars', JSON.stringify(this.remainingPillars));
    }

    private setPauseReason(reason: string, active: boolean, durationMs?: number): void {
        if (active) {
            this.pauseReasons.add(reason);
        } else {
            this.pauseReasons.delete(reason);
        }
        this.syncAttackPause();
    }

    private syncAttackPause(): void {
        if (!this.bossAttackSystem || typeof this.bossAttackSystem.setAttacksPaused !== 'function') return;

        const shouldPause = this.pauseReasons.size > 0;
        this.bossAttackSystem.setAttacksPaused(shouldPause);

        if (shouldPause && !this.attacksPaused) {
            this.attacksPaused = true;
        } else if (!shouldPause && this.attacksPaused) {
            this.attacksPaused = false;
        }
    }

    private clearAttackPhaseTimer(): void {
        if (this.attackPhaseTimer) {
            this.attackPhaseTimer.remove();
            this.attackPhaseTimer = undefined;
        }
    }

    private triggerPostPillarAttackCycle(): void {
        if (!this.bossAttackSystem || typeof this.bossAttackSystem.setAttacksPaused !== 'function') return;

        this.clearAttackPhaseTimer();

        const attackMs = Phaser.Math.Between(POST_PILLAR_ATTACK_MIN_MS, POST_PILLAR_ATTACK_MAX_MS);

        this.setPauseReason('postPillarMove', true, POST_PILLAR_MOVE_MS);
        this.attackPhaseTimer = this.scene.time.delayedCall(POST_PILLAR_MOVE_MS, () => {
            this.attackPhaseTimer = undefined;
            if (!this.isActive || this.isBattleEnding) return;

            this.setPauseReason('postPillarMove', false);

            this.attackPhaseTimer = this.scene.time.delayedCall(attackMs, () => {
                this.attackPhaseTimer = undefined;
                if (!this.isActive || this.isBattleEnding) return;

                this.setPauseReason('postPillarWindow', true, POST_PILLAR_PILLAR_WINDOW_MS);
                this.attackPhaseTimer = this.scene.time.delayedCall(POST_PILLAR_PILLAR_WINDOW_MS, () => {
                    this.attackPhaseTimer = undefined;
                    if (!this.isActive || this.isBattleEnding) return;
                    this.setPauseReason('postPillarWindow', false);
                });
            });
        });
    }

    stop(): void {
        this.isActive = false;
        this.clearAttackPhaseTimer();
        this.pauseReasons.clear();
        this.attacksPaused = false;
        this.syncAttackPause();
        this.spawnTimers.forEach(timer => timer.remove());
        this.spawnTimers = [];
        const fading = [...this.activeIndicators];
        this.activeIndicators = [];
        fading.forEach(indicator => indicator.fadeOutAndDestroy());
    }

    private spawnNextPillar(preferredPillarIdx?: number): void {
        if (!this.isActive) return;
        if (this.isBattleEnding) return;
        if (this.activeIndicators.length > 0) return;

        if (this.remainingPillars.length === 0) {
            return;
        }

        let pillarIdx: number;
        if (preferredPillarIdx !== undefined && this.remainingPillars.includes(preferredPillarIdx)) {
            pillarIdx = preferredPillarIdx;
        } else {
            const randomIndex = Math.floor(Math.random() * this.remainingPillars.length);
            pillarIdx = this.remainingPillars[randomIndex];
        }

        const pillar = this.pillarPositions[pillarIdx];
        if (!pillar) return;

        pillar.activated = true;
        this.currentPillarIndex = pillarIdx;

        const indicator = new RuneIndicator(
            this.scene,
            pillar.x,
            pillar.y,
            RUNE_LIFETIME_MS,
            3000,
            pillarIdx,
            () => this.onPillarDefeated(pillarIdx)
        );
        this.activeIndicators.push(indicator);
    }

    private onIndicatorMissed(pillarIdx: number): void {
        if (!this.isActive || this.isBattleEnding) return;
        if (!this.remainingPillars.includes(pillarIdx)) return;

        const timer = this.scene.time.delayedCall(RUNE_RESPAWN_DELAY_MS, () => {
            if (!this.isActive || this.isBattleEnding) return;
            this.spawnNextPillar(pillarIdx);
        });
        this.spawnTimers.push(timer);
    }

    private onPillarDefeated(pillarIndex: number): void {
        if (this.isBattleEnding) return;

        this.pillarsDefeated++;
        this.updateAttackSpeed();

        const indicatorIndex = this.activeIndicators.findIndex(i => i.pillarIndex === pillarIndex);
        if (indicatorIndex !== -1) {
            this.activeIndicators.splice(indicatorIndex, 1);
        }

        this.playPillarActivationEffect();

        if (this.pillarsDefeated >= 4) {
            this.endBattle();
        } else {
            this.spawnNextPillar();
        }
    }

    private playPillarActivationEffect(): void {
        const camera = this.scene.cameras.main;
        const originalZoom = camera.zoom;
        const wasFollowing = camera._follow !== undefined;

        if (wasFollowing) {
            camera.stopFollow();
        }

        const targetScrollX = this.mapCenterX - camera.width / 2 / originalZoom;
        const targetScrollY = this.mapCenterY - camera.height / 2 / originalZoom;
        const originalScrollX = camera.scrollX;
        const originalScrollY = camera.scrollY;

        this.scene.tweens.add({
            targets: camera,
            scrollX: targetScrollX,
            scrollY: targetScrollY,
            zoom: originalZoom * 0.8,
            duration: 300,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                const darkVignette = createVignette(this.scene, 99, true);
                darkVignette.setAlpha(0);

                ScreenShake.trigger(this.scene, 400, 0.008);

                fadeIn(this.scene, darkVignette, 300, () => {
                    this.scene.cameras.main.flash(300, 255, 255, 255);

                    fadeOutAndDestroy(this.scene, darkVignette, 300);

                    this.scene.tweens.add({
                        targets: camera,
                        scrollX: originalScrollX,
                        scrollY: originalScrollY,
                        zoom: originalZoom,
                        duration: 400,
                        ease: 'Back.easeOut',
                        delay: 100,
                        onComplete: () => {
                            if (wasFollowing) {
                                camera.startFollow(this.player, true, 0.09, 0.09);
                            }
                        }
                    });
                });
            }
        });
    }

    private endBattle(): void {
        if (this.isBattleEnding) return;
        this.isBattleEnding = true;

        if (this.bossAttackSystem) {
            this.bossAttackSystem.stopAttacks();
        }

        const fading = [...this.activeIndicators];
        this.activeIndicators = [];
        fading.forEach(indicator => indicator.fadeOutAndDestroy());

        if (this.tentaclesAnimation) {
            this.retractTentacles();
        } else {
            this.completeBattle();
        }
    }

    private retractTentacles(): void {
        if (!this.tentaclesAnimation) {
            this.completeBattle();
            return;
        }

        const darkVignette = createVignette(this.scene, 99, true);
        darkVignette.setAlpha(0);

        fadeIn(this.scene, darkVignette, 500, () => {
            this.scene.cameras.main.shake(500, 0.005);

            if (this.tentaclesAnimation) {
                if (this.scene.anims.exists('tentaclesRetract')) {
                    this.tentaclesAnimation.play('tentaclesRetract');
                    this.tentaclesAnimation.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                        if (this.tentaclesAnimation) {
                            this.tentaclesAnimation.destroy();
                            this.tentaclesAnimation = undefined;
                        }
                        fadeOutAndDestroy(this.scene, darkVignette, 500);
                        this.completeBattle();
                    });
                } else {
                    this.tentaclesAnimation.destroy();
                    this.tentaclesAnimation = undefined;
                    fadeOutAndDestroy(this.scene, darkVignette, 500);
                    this.completeBattle();
                }
            } else {
                fadeOutAndDestroy(this.scene, darkVignette, 500);
                this.completeBattle();
            }
        });
    }

    private completeBattle(): void {
        localStorage.removeItem('glossary_boss_fight_active');
        localStorage.removeItem('glossary_boss_pillars_defeated');
        localStorage.removeItem('glossary_boss_remaining_pillars');
        localStorage.removeItem('glossary_boss_current_combat_pillar');
        localStorage.removeItem('glossary_boss_combat_victory');

        if (this.onAllPillarsDefeated) {
            this.onAllPillarsDefeated();
        }
        this.stop();
    }

    update(delta: number, interactKeyDown: boolean): void {
        if (!this.isActive) return;
        if (this.isBattleEnding) return;

        const interactSystem = InteractSystem.getInstance(this.scene);

        for (let i = this.activeIndicators.length - 1; i >= 0; i--) {
            const indicator = this.activeIndicators[i];
            if (!indicator) continue;

            if (indicator.state === 'completing') continue;

            if (indicator.state === 'expired') {
                const missedPillar = indicator.pillarIndex;
                this.activeIndicators.splice(i, 1);
                indicator.fadeOutAndDestroy(() => this.onIndicatorMissed(missedPillar));
                continue;
            }

            if (indicator.state !== 'ready') continue;

            const inside = this.checkPlayerInside(indicator);
            indicator.setPlayerInside(inside);

            const expiry = indicator.tickLifetime(delta, inside);
            if (expiry === 'expired') {
                const missedPillar = indicator.pillarIndex;
                indicator.markExpired();
                this.activeIndicators.splice(i, 1);
                indicator.fadeOutAndDestroy(() => this.onIndicatorMissed(missedPillar));
                continue;
            }

            if (!inside) {
                indicator.resetHold();
                continue;
            }

            if (interactKeyDown) {
                indicator.holdTimer += delta;
            } else {
                indicator.resetHold();
            }

            const progress = Math.min(indicator.holdTimer / indicator.requiredStayMs, 1);
            interactSystem.show(indicator.x, indicator.y - 30, progress);

            if (indicator.holdTimer >= indicator.requiredStayMs) {
                indicator.resetHold();
                this.activeIndicators.splice(i, 1);
                indicator.complete();
            }
        }
    }

    private checkPlayerInside(indicator: RuneIndicator): boolean {
        return Phaser.Geom.Rectangle.Contains(
            indicator.getInteractBounds(),
            this.player.x,
            this.player.y
        );
    }
}

class RuneIndicator {
    public x: number;
    public y: number;
    public state: 'idle' | 'ready' | 'expired' | 'completing' = 'idle';
    public pillarIndex: number;
    public holdTimer = 0;
    public readonly requiredStayMs: number;
    private bottomSprite: Phaser.GameObjects.Sprite;
    private topSprite: Phaser.GameObjects.Sprite;
    private glowTween?: Phaser.Tweens.Tween;
    private alphaTween?: Phaser.Tweens.Tween;
    private readonly timeWindowMs: number;
    private lifetimeRemainingMs: number;
    private exitAfterLeaveMs: number | null = null;
    private isPlayerInside = false;
    private scene: Phaser.Scene;
    private onDefeated: () => void;
    private static readonly ALPHA_OUTSIDE = 0.55;
    private static readonly ALPHA_INSIDE = 1;

    getInteractBounds(): Phaser.Geom.Rectangle {
        return new Phaser.Geom.Rectangle(
            this.x - RUNE_INTERACT_WIDTH / 2,
            this.y - RUNE_INTERACT_HEIGHT / 2 + 24,
            RUNE_INTERACT_WIDTH,
            RUNE_INTERACT_HEIGHT
        );
    }

    constructor(scene: Phaser.Scene, x: number, y: number, timeWindow: number, requiredStay: number, pillarIndex: number, onDefeated: () => void) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.timeWindowMs = timeWindow;
        this.requiredStayMs = requiredStay;
        this.lifetimeRemainingMs = timeWindow;
        this.pillarIndex = pillarIndex;
        this.onDefeated = onDefeated;

        this.bottomSprite = scene.add.sprite(x, y + 54, 'Rune-Indicator-Bottom');
        this.bottomSprite.setOrigin(0.5, 0.5);
        this.bottomSprite.setDepth(9);
        this.bottomSprite.setAlpha(0);

        this.topSprite = scene.add.sprite(x, y, 'Rune-Indicator-Top');
        this.topSprite.setOrigin(0.5, 0.5);
        this.topSprite.setDepth(8);
        this.topSprite.setAlpha(0);

        this.fadeIn();
    }

    public setPlayerInside(inside: boolean): void {
        if (this.state !== 'ready' || this.isPlayerInside === inside) return;
        this.isPlayerInside = inside;

        if (this.alphaTween) {
            this.alphaTween.stop();
            this.alphaTween = undefined;
        }

        if (inside) {
            if (this.glowTween) {
                this.glowTween.stop();
                this.glowTween = undefined;
            }
            this.alphaTween = this.scene.tweens.add({
                targets: [this.bottomSprite, this.topSprite],
                alpha: RuneIndicator.ALPHA_INSIDE,
                duration: 150,
                ease: 'Sine.easeOut'
            });
        } else {
            this.startGlow();
        }
    }

    public resetHold(): void {
        this.holdTimer = 0;
    }

    public tickLifetime(delta: number, inside: boolean): 'ok' | 'expired' {
        if (inside) {
            this.exitAfterLeaveMs = null;
            return 'ok';
        }

        if (this.exitAfterLeaveMs !== null) {
            this.exitAfterLeaveMs -= delta;
            return this.exitAfterLeaveMs <= 0 ? 'expired' : 'ok';
        }

        if (this.lifetimeRemainingMs > 0) {
            this.lifetimeRemainingMs -= delta;
            return 'ok';
        }

        this.exitAfterLeaveMs = RUNE_EXIT_AFTER_LEAVE_MS;
        this.exitAfterLeaveMs -= delta;
        return this.exitAfterLeaveMs <= 0 ? 'expired' : 'ok';
    }

    public markExpired(): void {
        if (this.state === 'expired' || this.state === 'completing') return;
        this.state = 'expired';
        this.resetHold();
        if (this.glowTween) {
            this.glowTween.stop();
            this.glowTween = undefined;
        }
        if (this.alphaTween) {
            this.alphaTween.stop();
            this.alphaTween = undefined;
        }
    }

    private fadeIn(): void {
        this.scene.tweens.add({
            targets: [this.bottomSprite, this.topSprite],
            alpha: RuneIndicator.ALPHA_OUTSIDE,
            duration: 500,
            ease: 'Sine.easeOut',
            onComplete: () => {
                if (this.state === 'idle') {
                    this.state = 'ready';
                    this.startGlow();
                }
            }
        });
    }

    private startGlow(): void {
        if (this.state !== 'ready' || this.isPlayerInside) return;
        if (this.glowTween) this.glowTween.stop();

        this.glowTween = this.scene.tweens.add({
            targets: [this.bottomSprite, this.topSprite],
            alpha: { from: RuneIndicator.ALPHA_OUTSIDE, to: 0.85 },
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    public fadeOutAndDestroy(onComplete?: () => void): void {
        if (this.state === 'completing') return;
        this.state = 'completing';
        this.resetHold();

        if (this.glowTween) {
            this.glowTween.stop();
            this.glowTween = undefined;
        }
        if (this.alphaTween) {
            this.alphaTween.stop();
            this.alphaTween = undefined;
        }

        this.scene.tweens.add({
            targets: [this.bottomSprite, this.topSprite],
            alpha: 0,
            duration: 500,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.destroySprites();
                if (onComplete) onComplete();
            }
        });
    }

    public complete(): void {
        if (this.state === 'expired' || this.state === 'completing') return;
        this.state = 'completing';
        this.resetHold();

        if (this.glowTween) {
            this.glowTween.stop();
            this.glowTween = undefined;
        }
        if (this.alphaTween) {
            this.alphaTween.stop();
            this.alphaTween = undefined;
        }

        this.scene.tweens.add({
            targets: [this.bottomSprite, this.topSprite],
            alpha: 0,
            duration: 400,
            ease: 'Sine.easeIn',
            onComplete: () => {
                this.destroySprites();
                this.triggerClashTransition();
            }
        });
    }

    private triggerClashTransition(): void {
        const levelScene = this.scene as Phaser.Scene & {
            player?: Phaser.Physics.Matter.Sprite;
            bossAttackSystem?: { stopAttacks(): void };
        };
        const player = levelScene.player;

        if (!player) return;

        levelScene.bossAttackSystem?.stopAttacks();

        localStorage.setItem('glossary_boss_current_combat_pillar', String(this.pillarIndex));
        localStorage.setItem('glossary_combat_return_map', 'summit-settlement');
        localStorage.setItem('glossary_combat_player_x', String(player.x));
        localStorage.setItem('glossary_combat_player_y', String(player.y));

        const targetEnemyId = this.pillarIndex === 0 ? 'pillar_core_syntax'
            : this.pillarIndex === 1 ? 'pillar_core_semantics'
                : this.pillarIndex === 2 ? 'pillar_core_lexicon'
                    : 'pillar_core_etymology';

        const whitenMs = 1200;
        const { width, height } = this.scene.scale;
        const whiteout = this.scene.add
            .rectangle(width / 2, height / 2, width + 64, height + 64, 0xffffff, 1)
            .setScrollFactor(0)
            .setDepth(99999)
            .setAlpha(0);

        this.scene.tweens.add({
            targets: whiteout,
            alpha: 1,
            duration: whitenMs,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                if (this.scene.scene.isActive('CombatScene')) {
                    whiteout.destroy();
                    return;
                }

                this.scene.scene.launch('CombatScene', {
                    encounterTier: 3,
                    mapKey: 'summit-settlement',
                    enemyId: targetEnemyId,
                    fadeFromWhite: true
                });
            }
        });
    }

    private destroySprites(): void {
        if (this.bottomSprite?.active) this.bottomSprite.destroy();
        if (this.topSprite?.active) this.topSprite.destroy();
    }

    public destroy(): void {
        if (this.glowTween) this.glowTween.stop();
        if (this.alphaTween) this.alphaTween.stop();
        this.destroySprites();
    }
}