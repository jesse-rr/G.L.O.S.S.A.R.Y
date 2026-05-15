import { CovenantType } from '../data/PlayerData';

export interface CombatantStats {
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
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
}

export interface CombatEnemy {
    id: string;
    name: string;
    stats: CombatantStats;
    targetPlayerId: string;
    texture: string;
    frame: number;
    damageModifier: number;
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
    | 'player_defeated'
    | 'enemy_defeated'
    | 'combat_victory'
    | 'combat_defeat'
    | 'turn_order_set'
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

        let rawDamage = player.currentChain.resolvedValue + player.stats.attack;

        if (this.phoenixBurnActive) {
            rawDamage = Math.floor(rawDamage * 1.5);
        }

        const damage = Math.max(1, rawDamage - enemy.stats.defense);

        enemy.stats.hp = Math.max(0, enemy.stats.hp - damage);
        this.emit({ type: 'enemy_damaged', data: { enemyId: enemy.id, damage, remainingHp: enemy.stats.hp } });

        if (enemy.stats.hp <= 0) {
            this.emit({ type: 'enemy_defeated', data: { enemyId: enemy.id, byPlayerId: playerId } });
        }

        player.currentChain = null;
        return damage;
    }

    executeEnemyAttack(enemyId: string): number {
        const enemy = this.getEnemy(enemyId);
        if (!enemy || enemy.stats.hp <= 0) return 0;

        const player = this.getPlayer(enemy.targetPlayerId);
        if (!player) return 0;

        const rawDamage = Math.floor(enemy.stats.attack * enemy.damageModifier);
        const damage = Math.max(1, rawDamage - player.stats.defense);

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
        if (player.specialCurrency < 2) {
            this.emit({ type: 'ability_failed', data: { reason: 'not_enough_currency', cost: 2 } });
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

        player.specialCurrency -= 2;
        player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + totalRestored);
        this.covenantAbilityUsedThisTurn = true;

        this.emit({ type: 'ability_used', data: {
            ability: 'rewind',
            covenant: 'snake',
            hpRestored: totalRestored,
            newHp: player.stats.hp,
            cost: 2
        }});

        return true;
    }

    private usePhoenixBurn(player: CombatPlayer, runeLetter?: string): boolean {
        if (player.specialCurrency < 1) {
            this.emit({ type: 'ability_failed', data: { reason: 'not_enough_currency', cost: 1 } });
            return false;
        }

        if (!runeLetter) {
            this.emit({ type: 'ability_failed', data: { reason: 'no_rune_selected' } });
            return false;
        }

        player.specialCurrency -= 1;
        this.phoenixBurnActive = true;
        this.burnedRuneLetter = runeLetter;
        this.covenantAbilityUsedThisTurn = true;

        this.emit({ type: 'ability_used', data: {
            ability: 'burn',
            covenant: 'phoenix',
            burnedRune: runeLetter,
            cost: 1
        }});

        return true;
    }

    private useDragonIntimidate(player: CombatPlayer): boolean {
        if (player.specialCurrency < 1) {
            this.emit({ type: 'ability_failed', data: { reason: 'not_enough_currency', cost: 1 } });
            return false;
        }

        player.specialCurrency -= 1;
        this.intimidateRoundsLeft = 3;
        this.covenantAbilityUsedThisTurn = true;

        for (const enemy of this.enemies) {
            enemy.damageModifier = 0.75;
        }

        this.emit({ type: 'ability_used', data: {
            ability: 'intimidate',
            covenant: 'dragon',
            rounds: 3,
            cost: 1
        }});

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
