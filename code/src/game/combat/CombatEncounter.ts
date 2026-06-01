import { BESTIARY, BestiaryData } from '../data/BestiaryData';
import { PlayerData } from '../data/PlayerData';
import { UserData } from '../data/UserData';
import { GodMode } from '../utils/GodMode';
import { CombatEnemy, CombatPlayer, CombatSystem } from './CombatSystem';

interface EnemyCombatDefinition {
    id: string;
    name: string;
    hp: number;
    attack: number;
    defense: number;
    texture: string;
    frame: number;
}

export interface CombatEncounterConfig {
    playerData: PlayerData;
    encounterTier: number;
    encounterMapKey: string;
    targetEnemyId: string | null;
}

export interface CombatEncounterState {
    combatSystem: CombatSystem;
    targetEnemyId: string;
}

export function createCombatEncounter(config: CombatEncounterConfig): CombatEncounterState {
    const combatSystem = new CombatSystem();
    const godModeStats = GodMode.getActiveStats();
    const localPlayer: CombatPlayer = {
        id: 'local',
        name: 'You',
        covenant: config.playerData.covenant,
        stats: {
            hp: godModeStats?.hp ?? config.playerData.hp,
            maxHp: godModeStats?.hp ?? config.playerData.maxHp,
            attack: godModeStats?.attack ?? 0,
            defense: 3
        },
        gemstones: config.playerData.gemstones,
        specialCurrency: config.playerData.specialCurrency,
        currentChain: null,
        isLocal: true,
        statusEffects: [],
        roundDefense: 0
    };

    const enemyDef = pickEnemyFromBestiary(config);
    const enemies: CombatEnemy[] = [{
        id: enemyDef.id,
        name: enemyDef.name,
        stats: { hp: enemyDef.hp, maxHp: enemyDef.hp, attack: enemyDef.attack, defense: enemyDef.defense },
        targetPlayerId: 'local',
        texture: enemyDef.texture,
        frame: enemyDef.frame,
        damageModifier: 1.0,
        statusEffects: [],
        slowSkipNext: false
    }];

    combatSystem.initCombat([localPlayer], enemies);
    combatSystem.startRound();

    return {
        combatSystem,
        targetEnemyId: enemyDef.id
    };
}

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
        pick = unbattled[Math.floor(Math.random() * unbattled.length)];
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
        frame: pick.frame
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
