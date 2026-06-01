import * as Phaser from 'phaser';
import { CombatSystem } from '../combat/CombatSystem';
import { PlayerData } from '../data/PlayerData';

export interface GodModeStats {
    hp?: number;
    attack?: number;
}

export interface ActiveGodModeStats {
    hp: number;
    attack: number;
}

type GodModeTarget = Phaser.Game | Phaser.Scene;

const STORAGE_KEY = 'glossary_god_mode';
const DEFAULT_STATS: ActiveGodModeStats = {
    hp: 9999,
    attack: 9999
};

export class GodMode {
    static enable(target?: GodModeTarget, stats: GodModeStats = {}): ActiveGodModeStats {
        const nextStats = GodMode.normalizeStats(stats);
        GodMode.save(nextStats);
        GodMode.applyToPlayerData(nextStats);
        if (target) {
            GodMode.applyToTarget(target, nextStats);
        }
        return nextStats;
    }

    static apply(target: GodModeTarget): ActiveGodModeStats | null {
        const stats = GodMode.getActiveStats();
        if (!stats) return null;

        GodMode.applyToPlayerData(stats);
        GodMode.applyToTarget(target, stats);
        return stats;
    }

    static disable(target?: GodModeTarget): void {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch { }

        if (target) {
            const scenes = GodMode.getScenes(target);
            scenes.forEach(scene => scene.registry.set('godMode', false));
        }
    }

    static isEnabled(): boolean {
        return GodMode.getActiveStats() !== null;
    }

    static getActiveStats(): ActiveGodModeStats | null {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;

            const parsed = JSON.parse(raw) as GodModeStats;
            return GodMode.normalizeStats(parsed);
        } catch {
            return null;
        }
    }

    static getAttack(defaultAttack: number = 0): number {
        return GodMode.getActiveStats()?.attack ?? defaultAttack;
    }

    private static normalizeStats(stats: GodModeStats): ActiveGodModeStats {
        return {
            hp: Number.isFinite(stats.hp) && stats.hp !== undefined ? stats.hp : DEFAULT_STATS.hp,
            attack: Number.isFinite(stats.attack) && stats.attack !== undefined ? stats.attack : DEFAULT_STATS.attack
        };
    }

    private static save(stats: ActiveGodModeStats): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
        } catch { }
    }

    private static applyToPlayerData(stats: ActiveGodModeStats): void {
        const playerData = PlayerData.getInstance();
        playerData.maxHp = stats.hp;
        playerData.hp = stats.hp;
        playerData.save();
    }

    private static applyToTarget(target: GodModeTarget, stats: ActiveGodModeStats): void {
        const scenes = GodMode.getScenes(target);
        scenes.forEach(scene => GodMode.applyToScene(scene, stats));
    }

    private static applyToScene(scene: Phaser.Scene, stats: ActiveGodModeStats): void {
        const playerData = scene.registry.get('playerData') as PlayerData | undefined;
        if (playerData) {
            playerData.maxHp = stats.hp;
            playerData.hp = stats.hp;
            playerData.save();
        }
        scene.registry.set('godMode', true);

        const combatSystem = (scene as unknown as { combatSystem?: CombatSystem }).combatSystem;
        const localPlayer = combatSystem?.getLocalPlayer();
        if (localPlayer) {
            localPlayer.stats.maxHp = stats.hp;
            localPlayer.stats.hp = stats.hp;
            localPlayer.stats.attack = stats.attack;
        }
    }

    private static getScenes(target: GodModeTarget): Phaser.Scene[] {
        if (target instanceof Phaser.Scene) {
            return [target];
        }

        const sceneManager = target.scene as Phaser.Scenes.SceneManager & { scenes?: Phaser.Scene[] };
        if (typeof sceneManager.getScenes === 'function') {
            return sceneManager.getScenes(false);
        }
        return sceneManager.scenes ?? [];
    }
}
