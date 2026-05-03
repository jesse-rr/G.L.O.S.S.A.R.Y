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
}

export type TurnPhase = 'selection' | 'execution' | 'enemy_turn' | 'resolution';

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
    | 'turn_order_set';

export interface CombatEvent {
    type: CombatEventType;
    data?: any;
}

type CombatEventListener = (event: CombatEvent) => void;

export class CombatSystem {
    private players: CombatPlayer[] = [];
    private enemies: CombatEnemy[] = [];
    private turnOrder: TurnEntry[] = [];
    private currentTurnIndex: number = 0;
    private currentRound: number = 0;
    private phase: TurnPhase = 'selection';
    private isActive: boolean = false;
    private listeners: Map<CombatEventType, CombatEventListener[]> = new Map();

    initCombat(players: CombatPlayer[], enemies: CombatEnemy[]): void {
        this.players = players;
        this.enemies = enemies;
        this.currentRound = 0;
        this.currentTurnIndex = 0;
        this.phase = 'selection';
        this.isActive = true;

        this.generateTurnOrder();
    }

    private generateTurnOrder(): void {
        const shuffledPlayers = [...this.players].sort(() => Math.random() - 0.5);

        this.turnOrder = [];
        for (const player of shuffledPlayers) {
            this.turnOrder.push({ combatantId: player.id, type: 'player' });

            const enemy = this.enemies.find(e => e.targetPlayerId === player.id);
            if (enemy) {
                this.turnOrder.push({ combatantId: enemy.id, type: 'enemy' });
            }
        }

        this.emit({ type: 'turn_order_set', data: { order: this.turnOrder } });
    }

    startRound(): void {
        this.currentRound++;
        this.currentTurnIndex = 0;
        this.generateTurnOrder();
        this.phase = 'selection';

        this.emit({ type: 'turn_start', data: { round: this.currentRound, turn: this.getCurrentTurn() } });
    }

    getCurrentTurn(): TurnEntry | null {
        if (this.currentTurnIndex >= this.turnOrder.length) return null;
        return this.turnOrder[this.currentTurnIndex];
    }

    advanceTurn(): void {
        this.emit({ type: 'turn_end', data: { turn: this.getCurrentTurn() } });

        this.currentTurnIndex++;

        if (this.currentTurnIndex >= this.turnOrder.length) {
            this.checkCombatEnd();
            if (this.isActive) {
                this.startRound();
            }
            return;
        }

        const nextTurn = this.getCurrentTurn();
        if (nextTurn) {
            this.phase = nextTurn.type === 'player' ? 'selection' : 'enemy_turn';
            this.emit({ type: 'turn_start', data: { round: this.currentRound, turn: nextTurn } });
        }
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

        const rawDamage = player.currentChain.resolvedValue + player.stats.attack;
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
        if (!enemy) return 0;

        const player = this.getPlayer(enemy.targetPlayerId);
        if (!player) return 0;

        const rawDamage = enemy.stats.attack;
        const damage = Math.max(1, rawDamage - player.stats.defense);

        player.stats.hp = Math.max(0, player.stats.hp - damage);
        this.emit({ type: 'player_damaged', data: { playerId: player.id, damage, remainingHp: player.stats.hp } });

        if (player.stats.hp <= 0) {
            this.emit({ type: 'player_defeated', data: { playerId: player.id } });
        }

        return damage;
    }

    private checkCombatEnd(): void {
        const allEnemiesDead = this.enemies.every(e => e.stats.hp <= 0);
        const allPlayersDead = this.players.every(p => p.stats.hp <= 0);

        if (allEnemiesDead) {
            this.isActive = false;
            this.emit({ type: 'combat_victory' });
        } else if (allPlayersDead) {
            this.isActive = false;
            this.emit({ type: 'combat_defeat' });
        }
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

    getTurnOrder(): TurnEntry[] {
        return [...this.turnOrder];
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
        this.turnOrder = [];
        this.isActive = false;
    }
}
