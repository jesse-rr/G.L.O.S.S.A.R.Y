import { BESTIARY, BestiaryData } from '../data/BestiaryData';
import { PlayerData, CovenantType } from '../data/PlayerData';
import { NetworkManager } from '../NetworkManager';
import { UserData } from '../data/UserData';

import { CombatCohortEntry, getActiveCombatParticipants, isActiveCombatPlayer } from '../utils/CombatStartSync';
import { CombatEnemy, CombatPlayer, CombatSystem } from './CombatSystem';

interface EnemyCombatDefinition {
    id: string;
    name: string;
    hp: number;
    attack: number;
    defense: number;
    texture: string;
    frame: number;
    animProfile?: string;
}

export interface CombatEncounterConfig {
    playerData: PlayerData;
    encounterTier: number;
    encounterMapKey: string;
    targetEnemyId: string | null;
    cohort?: CombatCohortEntry[];
}

export interface CombatEncounterState {
    combatSystem: CombatSystem;
    targetEnemyId: string;
}

export function createCombatEncounter(config: CombatEncounterConfig): CombatEncounterState {
    const combatSystem = new CombatSystem();
    const roster = buildCombatRoster(config.playerData, config.cohort);
    const players: CombatPlayer[] = roster.map((entry, index) => ({
        id: entry.id,
        name: entry.isLocal ? 'You' : `Ally ${index + 1}`,
        covenant: entry.covenant,
        stats: {
            hp: entry.isLocal ? config.playerData.hp : config.playerData.maxHp,
            maxHp: entry.isLocal ? config.playerData.maxHp : config.playerData.maxHp,
            attack: 0,
            defense: 3
        },
        gemstones: entry.isLocal ? config.playerData.gemstones : 0,
        specialCurrency: entry.isLocal ? config.playerData.specialCurrency : 0,
        currentChain: null,
        isLocal: entry.isLocal,
        statusEffects: [],
        roundDefense: 0
    }));

    const enemyDef = pickEnemyFromBestiary(config);
    const enemies: CombatEnemy[] = players.map((player) => ({
        id: `${enemyDef.id}-${player.id}`,
        name: enemyDef.name,
        stats: { hp: enemyDef.hp, maxHp: enemyDef.hp, attack: enemyDef.attack, defense: enemyDef.defense },
        targetPlayerId: player.id,
        texture: enemyDef.texture,
        frame: enemyDef.frame,
        animProfile: enemyDef.animProfile,
        damageModifier: 1.0,
        statusEffects: [],
        slowSkipNext: false
    }));

    combatSystem.initCombat(players, enemies);
    combatSystem.startRound();

    return {
        combatSystem,
        targetEnemyId: enemyDef.id
    };
}

function buildCombatRoster(playerData: PlayerData, combatCohort?: CombatCohortEntry[]): Array<{ id: string; covenant: CovenantType; isLocal: boolean }> {
    const nm = NetworkManager.getInstance();
    const localId = nm.role === 'offline' ? 'local' : nm.myPeerId || 'local';
    const byPeer = new Map<string, CovenantType>();

    if (nm.role === 'host') {
        if (combatCohort && combatCohort.length > 0) {
            combatCohort.forEach(entry => {
                if (entry.peerId && entry.covenant) {
                    byPeer.set(entry.peerId, entry.covenant);
                }
            });
        } else {
            for (const peer of nm.getPeerCovenants()) {
                byPeer.set(peer.peerId, peer.covenant);
            }
        }
        byPeer.set(localId, playerData.covenant);
    } else if (nm.role === 'client') {
        const hostId = nm.getCanonicalHostPeerId();
        const relayHostId = nm.getRelayHostPeerId();
        const effectiveHost = relayHostId || hostId;
        
        if (combatCohort && combatCohort.length > 0) {
            combatCohort.forEach(entry => {
                if (entry.peerId && entry.covenant) {
                    byPeer.set(entry.peerId, entry.covenant);
                }
            });
            if (effectiveHost && effectiveHost !== localId && !byPeer.has(effectiveHost)) {
                const hostCovenant = nm.getPeerCovenants().find(p => p.peerId === effectiveHost)?.covenant;
                byPeer.set(effectiveHost, hostCovenant || 'dragon');
            }
        } else if (nm.getPeerCovenants().length > 0) {
            for (const peer of nm.getPeerCovenants()) {
                byPeer.set(peer.peerId, peer.covenant);
            }
            if (effectiveHost && effectiveHost !== localId && !byPeer.has(effectiveHost)) {
                const hostCovenant = nm.getPeerCovenants().find(p => p.peerId === effectiveHost)?.covenant;
                if (hostCovenant) {
                    byPeer.set(effectiveHost, hostCovenant);
                }
            }
        } else {
            if (effectiveHost && effectiveHost !== localId) {
                byPeer.set(effectiveHost, 'dragon');
            }
        }
        byPeer.set(localId, playerData.covenant);
    } else {
        byPeer.set(localId, playerData.covenant);
    }

    const roster = Array.from(byPeer.entries())
        .map(([id, covenant]) => ({
            id,
            covenant,
            isLocal: id === localId
        }));

    return roster.sort((a, b) => Number(b.isLocal) - Number(a.isLocal) || a.id.localeCompare(b.id)).slice(0, 3);
}

export { isActiveCombatPlayer };

function pickEnemyFromBestiary(config: CombatEncounterConfig): EnemyCombatDefinition {
    let lookupId = config.targetEnemyId;
    if (lookupId === 'pillar_core_syntax') lookupId = 'pillar_1';
    else if (lookupId === 'pillar_core_semantics') lookupId = 'pillar_2';
    else if (lookupId === 'pillar_core_lexicon') lookupId = 'pillar_3';
    else if (lookupId === 'pillar_core_etymology') lookupId = 'pillar_4';

    let pick = BESTIARY.find(e => e.id === lookupId);

    if (!pick) {
        let targetTier = config.encounterTier;
        if (config.encounterMapKey === 'summit-settlement') {
            targetTier = 4;
        }

        const tierEnemies = BESTIARY.filter(e => e.tier === targetTier);
        const pool = tierEnemies.length > 0 ? tierEnemies : BESTIARY.filter(e => e.tier === 1);
        const battledNames = readBattledEnemyNames();

        let unbattled = pool.filter(e => !battledNames.has(e.name.toLowerCase()));
        if (unbattled.length === 0) {
            unbattled = pool;
        }
        if (NetworkManager.getInstance().role === 'offline') {
            pick = unbattled[Math.floor(Math.random() * unbattled.length)];
        } else {
            pick = [...unbattled].sort((a, b) => a.id.localeCompare(b.id))[0];
        }
    }

    BestiaryData.getInstance().discoverEntity(pick.id);
    UserData.getInstance().checkCompletionist();

    return {
        id: pick.id,
        name: pick.name,
        hp: pick.hp,
        attack: pick.baseDamage,
        defense: Math.floor(pick.baseDamage * 0.2),
        texture: pick.texture,
        frame: pick.frame,
        animProfile: pick.animProfile
    };
}

function readBattledEnemyNames(): Set<string> {
    const battledNames = new Set<string>();
    try {
        const raw = localStorage.getItem('glossary_completed_combats');
        if (!raw) return battledNames;

        const parsed = JSON.parse(raw);
        for (const mapKey of Object.keys(parsed)) {
            if (Array.isArray(parsed[mapKey])) {
                parsed[mapKey].forEach((combat: any) => {
                    if (combat?.enemyName) {
                        battledNames.add(combat.enemyName.toLowerCase());
                    }
                });
            }
        }
    } catch { }
    return battledNames;
}