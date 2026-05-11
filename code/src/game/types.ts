import { CovenantType } from './data/PlayerData';

export type { CovenantType } from './data/PlayerData';

export type CardType = 'boost' | 'unique' | 'base';
export type EffectType = 'damage' | 'heal' | 'shield' | 'buff' | 'debuff';

export enum Depth {
    FLOOR = 0,
    DECO = 5,
    DOOR = 8,
    DOOR_SYMBOL = 8.1,
    PLAYER_DEFAULT = 10,
    PLAYER_SETTLEMENT = 13,
    PLAYER_BOSS_ABANDONED = 8,
    PLAYER_BOSS_DESERT = 12,
    PLAYER_BOSS_MECHANIC = 10,
    VIGNETTE = 90,
    VIGNETTE_DARK = 99,
    DIM_OVERLAY = 69,
    CHAIN_LINK = 74,
    CHAIN_CARD = 76,
    CHAIN_COMBO = 77,
    PICKER = 80,
    UI_BOOK = 100,
    UI_BOOKMARK = 101,
    UI_CONTENT = 102,
    NOTIFICATION = 200,
    TRANSITION = 99999,
}

export enum Timing {
    TRANSITION_DURATION = 500,
    TRANSITION_HOLD = 250,
    PORTAL_FADE_DELAY = 100,
    PORTAL_FADE_DURATION = 400,
    PORTAL_RESTART_DELAY = 500,
    CAMERA_FADE_IN = 800,
    ENTRY_WALK_DURATION = 400,
    DOOR_HOLD_TIME = 1000,
    DOOR_SHAKE_DURATION = 1000,
    VIGNETTE_FADE_IN = 500,
    VIGNETTE_FADE_OUT = 1000,
    NOTIFICATION_DURATION = 3000,
    NOTIFICATION_FADE = 400,
}

export const TILE_SIZE = 32;
export const PLAYER_SPEED = 3;
export const STAIR_SLOW_FACTOR = 0.6;
export const CAMERA_LERP = 0.09;
export const DOOR_INTERACT_DISTANCE = 80;
export const SPAWN_OFFSET = 54;

export const COVENANT_COLORS: Record<CovenantType, number> = {
    dragon: 0x734f7b,
    phoenix: 0x9e2e2e,
    snake: 0x545f67
};

export const COVENANT_TINTS: Record<CovenantType, number> = {
    dragon: 0x816188,
    phoenix: 0xa74444,
    snake: 0x5a7872
};
