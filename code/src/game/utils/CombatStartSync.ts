import * as Phaser from 'phaser';
import { NetworkManager } from '../NetworkManager';
import { PlayerData, CovenantType } from '../data/PlayerData';

export interface CombatCohortEntry {
    peerId: string;
    covenant: CovenantType;
}

export interface CombatStartPayload {
    type: 'COMBAT_START';
    combatId?: string;
    encounterTier: number;
    mapKey: string;
    enemyId?: string | null;
    fadeFromWhite?: boolean;
    cohort?: CombatCohortEntry[];
    originPeerId: string;
}

export function buildCombatStartData(data: Omit<CombatStartPayload, 'type' | 'originPeerId' | 'cohort'>): Omit<CombatStartPayload, 'type' | 'originPeerId'> {
    return {
        combatId: data.combatId || `combat-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        ...data,
        cohort: buildCombatCohort()
    };
}

export function broadcastCombatStart(data: Omit<CombatStartPayload, 'type' | 'originPeerId'>): void {
    const nm = NetworkManager.getInstance();
    if (nm.role === 'offline') return;

    nm.broadcast({
        type: 'COMBAT_START',
        ...data,
        originPeerId: nm.myPeerId
    });
}

export function launchCombat(scene: Phaser.Scene, data: Omit<CombatStartPayload, 'type' | 'originPeerId'>): void {
    if (scene.scene.isActive('CombatScene')) return;

    scene.scene.launch('TransitionScene', {
        targetScene: 'CombatScene',
        currentScene: scene.sys.settings.key,
        targetData: {
            combatId: data.combatId,
            encounterTier: data.encounterTier,
            mapKey: data.mapKey,
            enemyId: data.enemyId ?? null,
            fadeFromWhite: !!data.fadeFromWhite,
            cohort: data.cohort
        }
    });
}

export function getActiveCombatParticipants(): CombatCohortEntry[] {
    const nm = NetworkManager.getInstance();
    const localId = nm.role === 'offline' ? 'local' : nm.myPeerId || 'local';
    const cohort = new Map<string, CovenantType>();

    cohort.set(localId, PlayerData.getInstance().covenant);

    if (nm.role !== 'offline') {
        const connected = new Set(nm.getConnectedPeers());
        nm.getPeerCovenants().forEach(peer => {
            if (connected.has(peer.peerId)) {
                cohort.set(peer.peerId, peer.covenant);
            }
        });
    }

    return Array.from(cohort.entries())
        .map(([peerId, covenant]) => ({ peerId, covenant }))
        .sort((a, b) => a.peerId.localeCompare(b.peerId))
        .slice(0, 3);
}

export function isActiveCombatPlayer(playerId: string): boolean {
    const nm = NetworkManager.getInstance();
    if (nm.role === 'offline') {
        return playerId === 'local';
    }

    const localId = nm.myPeerId || 'local';
    if (playerId === localId) return true;
    return nm.getConnectedPeers().includes(playerId);
}

function buildCombatCohort(): CombatCohortEntry[] {
    return getActiveCombatParticipants();
}
