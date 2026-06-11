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
        this.submitPlayerChains(new Map([[this.combatSystem.getLocalPlayerId(), chain]]));
    }

    submitPlayerChains(chains: Map<string, string[]>): void {
        if (this.isResolvingTurn || this.combatSystem.getPhase() !== 'player_select') {
            return;
        }

        chains.forEach((chain, playerId) => {
            const resolvedValue = RuneData.resolveChainPower(chain);
            this.combatSystem.setPlayerChain(playerId, { runes: chain, resolvedValue });
        });

        const token = this.startFlow('ATTACKING...');
        this.delay(token, CombatTurnController.PLAYER_ATTACK_WINDUP_MS, () => this.resolvePlayerAttack(token));
    }

    private resolvePlayerAttack(token: number): void {
        const attackers = this.combatSystem.getAllPlayers()
            .filter(player => player.stats.hp > 0 && player.currentChain);

        for (const player of attackers) {
            const target = this.combatSystem.getAttackTargetEnemy(player.id);
            if (target && target.stats.hp > 0) {
                this.combatSystem.executePlayerAttack(player.id);
                if (player.isLocal) {
                    this.applyRunefallIfReady(target);
                }
            }
        }

        this.view.updateEnemyHp();
        this.view.updateHUD();
        this.view.updateStatusEffects();

        if (this.combatSystem.checkCombatEnd()) {
            this.finishFlow();
            return;
        }

        this.delay(token, 600, () => this.startEnemyTurn(token));
    }

    private startEnemyTurn(token: number): void {
        const enemies = this.combatSystem.getAllEnemies().filter(enemy => enemy.stats.hp > 0);
        if (enemies.length === 0 || this.combatSystem.checkCombatEnd()) {
            this.startNextRound();
            return;
        }

        this.view.updateTurnIndicator('ENEMY TURN');
        this.combatSystem.setPhase('enemy_attack');

        this.delay(token, 800, () => {
            if (!this.isCurrentFlow(token)) return;

            for (const enemy of enemies) {
                if (enemy.stats.hp > 0) {
                    this.resolveEnemyAttack(enemy);
                }
            }
            this.view.updateHUD();
            this.view.updateStatusEffects();

            this.delay(token, 600, () => {
                if (this.combatSystem.checkCombatEnd()) {
                    this.finishFlow();
                    return;
                }

                this.startNextRound();
            });
        });
    }

    private resolveEnemyAttack(enemy: CombatEnemy): void {
        if (enemy.stats.hp <= 0) return;
        this.combatSystem.executeEnemyAttack(enemy.id);
    }

    private applyRunefallIfReady(enemy: CombatEnemy): void {
        if (!this.equippedItemStatus.has(1) || Math.random() >= 0.5 || enemy.stats.hp <= 0) return;

        const extraDmg = 9;
        enemy.stats.hp = Math.max(0, enemy.stats.hp - extraDmg);
        this.view.showFloatingText(this.scene.scale.width - 200, 400, `Runefall: +${extraDmg} Lightning!`, '#50bfe6');
        this.view.updateEnemyHp();
        this.scene.cameras.main.flash(200, 80, 191, 230);
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

    private startFlow(turnText: string): number {
        this.flowToken++;
        this.isResolvingTurn = true;
        this.animationStartTime = null;
        this.view.updateTurnIndicator(turnText);
        this.view.setAbilityInteractive(false);
        return this.flowToken;
    }

    private finishFlow(): void {
        this.flowToken++;
        this.isResolvingTurn = false;
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
        return this.combatSystem.getAttackTargetEnemy(this.combatSystem.getLocalPlayerId()) ?? null;
    }

}
