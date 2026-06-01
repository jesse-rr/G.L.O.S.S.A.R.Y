import * as Phaser from 'phaser';
import { RuneData } from '../data/RuneData';
import { CombatEnemy, CombatSystem } from './CombatSystem';
import { EnemyAnimator } from './EnemyAnimator';

export interface CombatTurnView {
    refreshAbility: () => void;
    restoreRunePickerForTurn: () => void;
    setAbilityInteractive: (enabled: boolean) => void;
    showFloatingText: (x: number, y: number, text: string, color: string) => void;
    updateEnemyHp: () => void;
    updateHUD: () => void;
    updateStatusEffects: () => void;
    updateTurnIndicator: (text: string) => void;
    getEnemyAnimator: () => EnemyAnimator | null;
    getEnemyHpText: () => Phaser.GameObjects.Text | null;
    getEnemyShadow: () => Phaser.GameObjects.Image | null;
    getEnemySprite: () => Phaser.GameObjects.Sprite | null;
    getEnemyTooltip: () => Phaser.GameObjects.Container | null;
    getPlayerShadow: () => Phaser.GameObjects.Image | null;
    getPlayerSprite: () => Phaser.GameObjects.Sprite | null;
}

export class CombatTurnController {
    private scene: Phaser.Scene;
    private combatSystem: CombatSystem;
    private equippedItemStatus: Map<number, boolean>;
    private view: CombatTurnView;
    private isResolvingTurn = false;
    private enemyDeathResolving = false;
    private animationStartTime: number | null = null;
    private flowToken = 0;
    private static readonly ANIMATION_TIMEOUT_MS = 10000;
    private static readonly PLAYER_ATTACK_WINDUP_MS = 900;

    constructor(
        scene: Phaser.Scene,
        combatSystem: CombatSystem,
        equippedItemStatus: Map<number, boolean>,
        view: CombatTurnView
    ) {
        this.scene = scene;
        this.combatSystem = combatSystem;
        this.equippedItemStatus = equippedItemStatus;
        this.view = view;
    }

    isBusy(): boolean {
        return this.isResolvingTurn;
    }

    update(time: number): void {
        if (!this.isResolvingTurn) {
            this.animationStartTime = null;
            return;
        }

        if (!this.animationStartTime) {
            this.animationStartTime = time;
            return;
        }

        if (time - this.animationStartTime <= CombatTurnController.ANIMATION_TIMEOUT_MS) {
            return;
        }

        this.finishFlow();
        this.startNextRound();
    }

    submitPlayerChain(chain: string[]): void {
        if (this.isResolvingTurn || this.combatSystem.getPhase() !== 'player_select') {
            return;
        }

        const resolvedValue = RuneData.resolveChainPower(chain);
        this.combatSystem.setPlayerChain('local', { runes: chain, resolvedValue });

        const token = this.startFlow('ATTACKING...');
        this.delay(token, CombatTurnController.PLAYER_ATTACK_WINDUP_MS, () => this.resolvePlayerAttack(token));
    }

    private resolvePlayerAttack(token: number): void {
        const enemy = this.getPrimaryEnemy();
        if (!enemy || enemy.stats.hp <= 0) {
            this.playEnemyDeathAndEnd(token);
            return;
        }

        const damage = this.combatSystem.executePlayerAttack('local');
        if (enemy.stats.hp <= 0) {
            this.playEnemyHitFeedback(damage, token, () => this.playEnemyDeathAndEnd(token));
            return;
        }

        this.playEnemyHitFeedback(damage, token);
        this.applyRunefallIfReady(token);

        this.delay(token, 600, () => this.resolveAfterPlayerActions(token));
    }

    private resolveAfterPlayerActions(token: number): void {
        if (this.isEnemyDefeated()) {
            this.playEnemyDeathAndEnd(token);
            return;
        }

        if (this.combatSystem.checkCombatEnd()) {
            this.finishFlow();
            return;
        }

        this.startEnemyTurn(token);
    }

    private startEnemyTurn(token: number): void {
        const enemy = this.getPrimaryEnemy();
        if (!enemy || enemy.stats.hp <= 0 || this.combatSystem.checkCombatEnd()) {
            this.startNextRound();
            return;
        }

        this.view.updateTurnIndicator('ENEMY TURN');
        this.combatSystem.setPhase('enemy_attack');

        this.delay(token, 800, () => {
            const currentEnemy = this.getPrimaryEnemy();
            if (!currentEnemy || currentEnemy.stats.hp <= 0) {
                this.startNextRound();
                return;
            }

            const executeAttack = () => {
                if (!this.isCurrentFlow(token)) return;
                this.resolveEnemyAttack(currentEnemy, token);
            };

            const animator = this.view.getEnemyAnimator();
            if (animator && animator.hasAnim('attack')) {
                animator.playAttackWithFx({ onComplete: executeAttack });
            } else {
                executeAttack();
            }
        });
    }

    private resolveEnemyAttack(enemy: CombatEnemy, token: number): void {
        if (enemy.stats.hp <= 0) {
            this.startNextRound();
            return;
        }

        const damage = this.combatSystem.executeEnemyAttack(enemy.id);
        const playerSprite = this.view.getPlayerSprite();
        if (damage > 0 && playerSprite) {
            this.scene.tweens.add({
                targets: [playerSprite, this.view.getPlayerShadow()].filter(Boolean),
                x: '-=8',
                duration: 50,
                yoyo: true,
                repeat: 3
            });
        }

        this.delay(token, 600, () => {
            const player = this.combatSystem.getLocalPlayer();
            if (player && player.stats.hp <= 0) {
                this.combatSystem.checkCombatEnd();
                this.finishFlow();
                return;
            }

            if (this.combatSystem.checkCombatEnd()) {
                this.finishFlow();
                return;
            }

            this.startNextRound();
        });
    }

    private startNextRound(): void {
        this.finishFlow();

        if (this.combatSystem.checkCombatEnd()) {
            return;
        }

        this.combatSystem.startRound();
        if (this.combatSystem.getPhase() === 'combat_end') {
            return;
        }

        const enemy = this.getPrimaryEnemy();
        if (!enemy || enemy.stats.hp <= 0) {
            this.combatSystem.checkCombatEnd();
            return;
        }

        this.view.setAbilityInteractive(true);
        this.view.updateHUD();
        this.view.updateStatusEffects();
        this.view.updateTurnIndicator('YOUR TURN - Select Runes');
        this.view.refreshAbility();
        this.view.restoreRunePickerForTurn();
    }

    private playEnemyHitFeedback(damage: number, token: number, onComplete?: () => void): void {
        const enemySprite = this.view.getEnemySprite();
        if (damage <= 0 || !enemySprite) {
            onComplete?.();
            return;
        }

        enemySprite.setTint(0xff0000);
        this.scene.tweens.add({
            targets: enemySprite,
            x: enemySprite.x + 10,
            duration: 50,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                this.delay(token, 150, () => {
                    this.view.getEnemySprite()?.clearTint();
                    onComplete?.();
                });
            }
        });
    }

    private applyRunefallIfReady(token: number): void {
        if (!this.equippedItemStatus.has(1) || Math.random() >= 0.5) {
            return;
        }

        const enemy = this.getPrimaryEnemy();
        if (!enemy || enemy.stats.hp <= 0) {
            return;
        }

        const extraDmg = 9;
        enemy.stats.hp = Math.max(0, enemy.stats.hp - extraDmg);
        this.delay(token, 300, () => {
            this.view.showFloatingText(this.scene.scale.width - 200, 400, `Runefall: +${extraDmg} Lightning!`, '#50bfe6');
            this.view.updateEnemyHp();
            this.scene.cameras.main.flash(200, 80, 191, 230);

            if (enemy.stats.hp <= 0) {
                this.playEnemyDeathAndEnd(token);
            }
        });
    }

    private playEnemyDeathAndEnd(token: number): boolean {
        if (!this.isCurrentFlow(token)) {
            return false;
        }

        const enemy = this.getPrimaryEnemy();
        if (!enemy || enemy.stats.hp > 0) {
            return false;
        }
        if (this.enemyDeathResolving) {
            return true;
        }

        this.enemyDeathResolving = true;
        this.isResolvingTurn = true;
        this.view.setAbilityInteractive(false);

        const enemySprite = this.view.getEnemySprite();
        if (enemySprite) {
            enemySprite.clearTint();
            this.scene.tweens.killTweensOf(enemySprite);
        }

        const cleanupAndEnd = () => {
            this.view.getEnemyHpText()?.setAlpha(0);
            this.view.getEnemyShadow()?.setAlpha(0);
            this.view.getEnemyTooltip()?.setAlpha(0);

            this.delay(token, 100, () => {
                this.combatSystem.checkCombatEnd();
                this.finishFlow();
            });
        };

        if (enemySprite?.active) {
            const animator = this.view.getEnemyAnimator();
            if (animator && animator.hasAnim('death')) {
                animator.play('death', { onComplete: cleanupAndEnd });
                if (animator.hasFx('death_fx')) {
                    animator.playFx('death_fx');
                }
            } else {
                this.scene.tweens.add({
                    targets: enemySprite,
                    alpha: 0,
                    scale: 0.5,
                    duration: 500,
                    ease: 'Back.easeIn',
                    onComplete: cleanupAndEnd
                });
            }
        } else {
            cleanupAndEnd();
        }

        return true;
    }

    private startFlow(turnText: string): number {
        this.flowToken++;
        this.isResolvingTurn = true;
        this.enemyDeathResolving = false;
        this.animationStartTime = null;
        this.view.updateTurnIndicator(turnText);
        this.view.setAbilityInteractive(false);
        return this.flowToken;
    }

    private finishFlow(): void {
        this.flowToken++;
        this.isResolvingTurn = false;
        this.enemyDeathResolving = false;
        this.animationStartTime = null;
    }

    private delay(token: number, ms: number, callback: () => void): void {
        this.scene.time.delayedCall(ms, () => {
            if (this.isCurrentFlow(token)) {
                callback();
            }
        });
    }

    private isCurrentFlow(token: number): boolean {
        return this.isResolvingTurn && this.flowToken === token;
    }

    private getPrimaryEnemy(): CombatEnemy | null {
        return this.combatSystem.getAllEnemies()[0] ?? null;
    }

    private isEnemyDefeated(): boolean {
        const enemy = this.getPrimaryEnemy();
        return !enemy || enemy.stats.hp <= 0;
    }
}
