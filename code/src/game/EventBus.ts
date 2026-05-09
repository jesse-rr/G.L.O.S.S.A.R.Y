import { Events } from 'phaser';

export const GameEvents = {
    NETWORK_DATA_RECEIVED: 'network-data-received',
    PEER_CONNECTED: 'peer-connected',
    PEER_DISCONNECTED: 'peer-disconnected',
    ACHIEVEMENT_UNLOCKED: 'achievement-unlocked',
    RUNE_DISCOVERED: 'rune-discovered',
    ITEM_DISCOVERED: 'item-discovered',
    ENEMY_DISCOVERED: 'enemy-discovered',
    LOCATION_DISCOVERED: 'location-discovered',
    SCENE_TRANSITION_START: 'scene-transition-start',
    SCENE_TRANSITION_COMPLETE: 'scene-transition-complete',
    DOOR_OPENED: 'door-opened',
    PORTAL_ENTERED: 'portal-entered',
    COMBAT_ROUND_START: 'combat-round-start',
    COMBAT_CHAIN_RESOLVED: 'combat-chain-resolved',
} as const;

export type GameEventKey = typeof GameEvents[keyof typeof GameEvents];

export const EventBus = new Events.EventEmitter();
