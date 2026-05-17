import { CovenantType } from '../data/PlayerData';
import { RuneData, RuneStatusEffect } from '../data/RuneData';

export interface CombatantStats {
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
}

export interface ActiveStatusEffect {
    effect: RuneStatusEffect;
    duration: number;
    stacks?: number;
}

export interface RuneChain {
    runes: string[];
    resolvedValue: number;
}

export interface CombatPlayer {
    id: string;
    name: string;
    covenant: CovenantType;
    stats: CombatantStats;
    gemstones: number;
    specialCurrency: number;
    currentChain: RuneChain | null;
    isLocal: boolean;
    statusEffects: ActiveStatusEffect[];
    roundDefense?: number;
}

export interface CombatEnemy {
    id: string;
    name: string;
    stats: CombatantStats;
    targetPlayerId: string;
    texture: string;
    frame: number;
    damageModifier: number;
    statusEffects: ActiveStatusEffect[];
    slowSkipNext: boolean;
}

export type TurnPhase = 'player_select' | 'player_attack' | 'enemy_attack' | 'resolution' | 'combat_end';

export interface TurnEntry {
    combatantId: string;
    type: 'player' | 'enemy';
}

export type CombatEventType =
    | 'turn_start'
    | 'turn_end'
    | 'phase_change'
    | 'player_damaged'
    | 'enemy_damaged'
    | 'status_applied'
    | 'status_expired'
    | 'player_defeated'
    | 'enemy_defeated'
    | 'combat_victory'
    | 'combat_defeat'
    | 'turn_order_set'
    | 'player_healed'
    | 'ability_used'
    | 'ability_failed';

export interface CombatEvent {
    type: CombatEventType;
    data?: any;
}

type CombatEventListener = (event: CombatEvent) => void;

export class CombatSystem {
    private players: CombatPlayer[] = [];
    private enemies: CombatEnemy[] = [];
    private currentRound: number = 0;
    private phase: TurnPhase = 'player_select';
    private isActive: boolean = false;
    private listeners: Map<CombatEventType, CombatEventListener[]> = new Map();
    private lastEnemyDamage: Map<string, number> = new Map();
    private intimidateRoundsLeft: number = 0;
    private phoenixBurnActive: boolean = false;
    private burnedRuneLetter: string | null = null;
    private covenantAbilityUsedThisTurn: boolean = false;

    initCombat(players: CombatPlayer[], enemies: CombatEnemy[]): void {
        this.players = players;
        this.enemies = enemies;
        this.currentRound = 0;
        this.phase = 'player_select';
        this.isActive = true;
        this.lastEnemyDamage.clear();
        this.intimidateRoundsLeft = 0;
        this.phoenixBurnActive = false;
        this.burnedRuneLetter = null;
        this.covenantAbilityUsedThisTurn = false;
        this.players.forEach(p => {
            p.statusEffects = [];
            p.roundDefense = 0;
        });
        this.enemies.forEach(e => {
            e.statusEffects = [];
            e.slowSkipNext = false;
        });
    }

    startRound(): void {
        this.currentRound++;
        this.phase = 'player_select';
        this.covenantAbilityUsedThisTurn = false;
        this.phoenixBurnActive = false;
        this.burnedRuneLetter = null;

        if (this.intimidateRoundsLeft > 0) {
            this.intimidateRoundsLeft--;
            if (this.intimidateRoundsLeft <= 0) {
                for (const enemy of this.enemies) {
                    enemy.damageModifier = 1.0;
                }
            }
        }


        for (const enemy of this.enemies) {
            if (enemy.stats.hp <= 0) continue;

            const venom = enemy.statusEffects.find(s => s.effect === 'venom');
            if (venom) {
                const dmg = (venom.stacks || 1) * 2;
                enemy.stats.hp = Math.max(0, enemy.stats.hp - dmg);
                this.emit({ type: 'enemy_damaged', data: { enemyId: enemy.id, damage: dmg, remainingHp: enemy.stats.hp, isDoT: true, effect: 'venom' } });
            }

            const ignite = enemy.statusEffects.find(s => s.effect === 'ignite');
            if (ignite) {
                const dmg = 5;
                enemy.stats.hp = Math.max(0, enemy.stats.hp - dmg);
                this.emit({ type: 'enemy_damaged', data: { enemyId: enemy.id, damage: dmg, remainingHp: enemy.stats.hp, isDoT: true, effect: 'ignite' } });
            }

            if (enemy.stats.hp <= 0) {
                this.emit({ type: 'enemy_defeated', data: { enemyId: enemy.id, byPlayerId: 'dot' } });
            }

            enemy.statusEffects.forEach(s => s.duration--);
            enemy.statusEffects = enemy.statusEffects.filter(s => s.duration > 0);
        }

        for (const player of this.players) {
            if (player.stats.hp <= 0) continue;
            player.statusEffects.forEach(s => s.duration--);
            player.statusEffects = player.statusEffects.filter(s => s.duration > 0);
        }

        if (this.checkCombatEnd()) return;

        this.emit({ type: 'turn_start', data: { round: this.currentRound } });
        this.emit({ type: 'phase_change', data: { phase: this.phase } });
    }

    setPhase(phase: TurnPhase): void {
        this.phase = phase;
        this.emit({ type: 'phase_change', data: { phase } });
    }

    setPlayerChain(playerId: string, chain: RuneChain): void {
        const player = this.getPlayer(playerId);
        if (player) {
            player.currentChain = chain;
        }
    }

    executePlayerAttack(playerId: string): number {
        const player = this.getPlayer(playerId);
        const enemy = this.enemies.find(e => e.targetPlayerId === playerId);

        if (!player || !enemy || !player.currentChain) return 0;

        this.lastEnemyDamage.clear();

        let damagePower = player.stats.attack;
        let healPower = 0;
        let defensePower = 0;

        for (const letter of player.currentChain.runes) {
            const def = RuneData.getDefinition(letter);
            if (def) {
                if (def.effectType === 'heal') healPower += def.basePower;
                else if (def.effectType === 'defense') defensePower += def.basePower;
                else damagePower += def.basePower;
            }
        }

        const combo = RuneData.findMatchingCombo(player.currentChain.runes);
        if (combo) {
            damagePower += combo.bonusPower;
        }

        if (healPower > 0) {
            player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + healPower);
            this.emit({ type: 'player_healed', data: { playerId: player.id, amount: healPower, newHp: player.stats.hp } });
        }
        player.roundDefense = defensePower;

        let rawDamage = damagePower;

        const overcharge = player.statusEffects.find(s => s.effect === 'overcharge');
        if (overcharge) {
            rawDamage = Math.floor(rawDamage * 1.5);
        }

        if (this.phoenixBurnActive) {
            rawDamage = Math.floor(rawDamage * 1.5);
        }

        let enemyDef = enemy.stats.defense;
        const shatter = enemy.statusEffects.find(s => s.effect === 'shatter');
        if (shatter) {
            enemyDef = 0;
        }

        const damage = Math.max(1, rawDamage - enemyDef);

        enemy.stats.hp = Math.max(0, enemy.stats.hp - damage);
        this.emit({ type: 'enemy_damaged', data: { enemyId: enemy.id, damage, remainingHp: enemy.stats.hp } });

        const appliedEffects: RuneStatusEffect[] = [];
        for (const letter of player.currentChain.runes) {
            const def = RuneData.getDefinition(letter);
            if (def && def.statusEffect && !appliedEffects.includes(def.statusEffect)) {
                appliedEffects.push(def.statusEffect);
                this.applyStatusEffect(def.statusEffect, player, enemy);
            }
        }

        if (enemy.stats.hp <= 0) {
            this.emit({ type: 'enemy_defeated', data: { enemyId: enemy.id, byPlayerId: playerId } });
        }

        player.currentChain = null;
        return damage;
    }

    private applyStatusEffect(effect: RuneStatusEffect, player: CombatPlayer, enemy: CombatEnemy) {
        if (effect === 'overcharge' || effect === 'fortify') {
            if (effect === 'overcharge' && (!player.currentChain || player.currentChain.runes.length !== 3)) {
                return;
            }

            const duration = effect === 'fortify' ? 2 : 3;
            const existing = player.statusEffects.find(s => s.effect === effect);
            if (existing) {
                existing.duration = duration;
            } else {
                player.statusEffects.push({ effect, duration });
            }
            this.emit({ type: 'status_applied', data: { targetId: player.id, effect } });
            return;
        }

        let duration = 3;
        if (effect === 'dazed' || effect === 'shatter' || effect === 'weaken') duration = 2;

        const existing = enemy.statusEffects.find(s => s.effect === effect);
        if (existing) {
            if (effect === 'venom') {
                existing.stacks = (existing.stacks || 1) + 1;
            }
            existing.duration = duration;
        } else {
            enemy.statusEffects.push({ effect, duration, stacks: effect === 'venom' ? 1 : undefined });
            if (effect === 'slow') enemy.slowSkipNext = true;
        }
        this.emit({ type: 'status_applied', data: { targetId: enemy.id, effect } });
    }

    executeEnemyAttack(enemyId: string): number {
        const enemy = this.getEnemy(enemyId);
        if (!enemy || enemy.stats.hp <= 0) return 0;

        const slow = enemy.statusEffects.find(s => s.effect === 'slow');
        if (slow) {
            if (enemy.slowSkipNext) {
                enemy.slowSkipNext = false;
                this.emit({ type: 'status_applied', data: { targetId: enemy.id, effect: 'slow_skip' } });
                return 0;
            } else {
                enemy.slowSkipNext = true;
            }
        }

        const dazed = enemy.statusEffects.find(s => s.effect === 'dazed');
        if (dazed) {
            if (Math.random() < 0.5) {
                this.emit({ type: 'status_applied', data: { targetId: enemy.id, effect: 'dazed_miss' } });
                return 0;
            }
        }

        const player = this.getPlayer(enemy.targetPlayerId);
        if (!player) return 0;

        let rawDamage = Math.floor(enemy.stats.attack * enemy.damageModifier);
        const weaken = enemy.statusEffects.find(s => s.effect === 'weaken');
        if (weaken) {
            rawDamage = Math.max(1, Math.floor(rawDamage * 0.5));
        }

        let playerDef = player.stats.defense + (player.roundDefense || 0);
        const fortify = player.statusEffects.find(s => s.effect === 'fortify');
        if (fortify) {
            playerDef = Math.floor(playerDef * 1.5);
        }

        const damage = Math.max(1, rawDamage - playerDef);

        this.lastEnemyDamage.set(enemyId, damage);
        player.stats.hp = Math.max(0, player.stats.hp - damage);
        this.emit({ type: 'player_damaged', data: { playerId: player.id, damage, remainingHp: player.stats.hp } });

        if (player.stats.hp <= 0) {
            this.emit({ type: 'player_defeated', data: { playerId: player.id } });
        }

        return damage;
    }

    useCovenantAbility(playerId: string, abilityData?: any): boolean {
        const player = this.getPlayer(playerId);
        if (!player || this.covenantAbilityUsedThisTurn) {
            this.emit({ type: 'ability_failed', data: { reason: 'already_used' } });
            return false;
        }

        switch (player.covenant) {
            case 'snake':
                return this.useSnakeRewind(player);
            case 'phoenix':
                return this.usePhoenixBurn(player, abilityData?.runeLetter);
            case 'dragon':
                return this.useDragonIntimidate(player);
            default:
                return false;
        }
    }

    private useSnakeRewind(player: CombatPlayer): boolean {
        if (player.specialCurrency < 3) {
            this.emit({ type: 'ability_failed', data: { reason: 'not_enough_currency', cost: 3 } });
            return false;
        }

        let totalRestored = 0;
        this.lastEnemyDamage.forEach((damage) => {
            totalRestored += damage;
        });

        if (totalRestored === 0) {
            this.emit({ type: 'ability_failed', data: { reason: 'no_damage_to_rewind' } });
            return false;
        }

        player.specialCurrency -= 3;
        player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + totalRestored);
        this.covenantAbilityUsedThisTurn = true;

        this.emit({
            type: 'ability_used', data: {
                ability: 'rewind',
                covenant: 'snake',
                hpRestored: totalRestored,
                newHp: player.stats.hp,
                cost: 3
            }
        });

        return true;
    }

    private usePhoenixBurn(player: CombatPlayer, runeLetter?: string): boolean {
        if (player.specialCurrency < 3) {
            this.emit({ type: 'ability_failed', data: { reason: 'not_enough_currency', cost: 3 } });
            return false;
        }

        if (!runeLetter) {
            this.emit({ type: 'ability_failed', data: { reason: 'no_rune_selected' } });
            return false;
        }

        player.specialCurrency -= 3;
        this.phoenixBurnActive = true;
        this.burnedRuneLetter = runeLetter;
        this.covenantAbilityUsedThisTurn = true;

        this.emit({
            type: 'ability_used', data: {
                ability: 'burn',
                covenant: 'phoenix',
                burnedRune: runeLetter,
                cost: 3
            }
        });

        return true;
    }

    private useDragonIntimidate(player: CombatPlayer): boolean {
        if (player.specialCurrency < 3) {
            this.emit({ type: 'ability_failed', data: { reason: 'not_enough_currency', cost: 3 } });
            return false;
        }

        player.specialCurrency -= 3;
        this.intimidateRoundsLeft = 3;
        this.covenantAbilityUsedThisTurn = true;

        for (const enemy of this.enemies) {
            enemy.damageModifier = 0.75;
        }

        this.emit({
            type: 'ability_used', data: {
                ability: 'intimidate',
                covenant: 'dragon',
                rounds: 3,
                cost: 3
            }
        });

        return true;
    }

    checkCombatEnd(): boolean {
        const allEnemiesDead = this.enemies.every(e => e.stats.hp <= 0);
        const allPlayersDead = this.players.every(p => p.stats.hp <= 0);

        if (allEnemiesDead) {
            this.isActive = false;
            this.phase = 'combat_end';
            this.emit({ type: 'combat_victory' });
            return true;
        } else if (allPlayersDead) {
            this.isActive = false;
            this.phase = 'combat_end';
            this.emit({ type: 'combat_defeat' });
            return true;
        }
        return false;
    }

    getBurnedRune(): string | null {
        return this.burnedRuneLetter;
    }

    isPhoenixBurnActive(): boolean {
        return this.phoenixBurnActive;
    }

    getIntimidateRoundsLeft(): number {
        return this.intimidateRoundsLeft;
    }

    isAbilityUsedThisTurn(): boolean {
        return this.covenantAbilityUsedThisTurn;
    }

    getPlayer(id: string): CombatPlayer | undefined {
        return this.players.find(p => p.id === id);
    }

    getEnemy(id: string): CombatEnemy | undefined {
        return this.enemies.find(e => e.id === id);
    }

    getEnemyForPlayer(playerId: string): CombatEnemy | undefined {
        return this.enemies.find(e => e.targetPlayerId === playerId);
    }

    getOtherPlayers(): CombatPlayer[] {
        return this.players.filter(p => !p.isLocal).slice(0, 2);
    }

    getAllPlayers(): CombatPlayer[] {
        return this.players;
    }

    getLocalPlayer(): CombatPlayer | undefined {
        return this.players.find(p => p.isLocal);
    }

    getAllEnemies(): CombatEnemy[] {
        return this.enemies;
    }

    getCurrentRound(): number {
        return this.currentRound;
    }

    getPhase(): TurnPhase {
        return this.phase;
    }

    getIsActive(): boolean {
        return this.isActive;
    }

    on(type: CombatEventType, listener: CombatEventListener): void {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type)!.push(listener);
    }

    off(type: CombatEventType, listener: CombatEventListener): void {
        const arr = this.listeners.get(type);
        if (arr) {
            this.listeners.set(type, arr.filter(l => l !== listener));
        }
    }

    private emit(event: CombatEvent): void {
        const arr = this.listeners.get(event.type);
        if (arr) {
            arr.forEach(l => l(event));
        }
    }

    destroy(): void {
        this.listeners.clear();
        this.players = [];
        this.enemies = [];
        this.isActive = false;
    }
}
