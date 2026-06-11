const GAMEPLAY_STORAGE_KEYS = [
    'glossary_player_data',
    'glossary_selected_items',
    'glossary_physical_slate_mapping',
    'glossary_selected_slate_id',
    'glossary_completed_combats',
    'glossary_echojar_completed_combats',
    'glossary_seraphs_plume_consumed',
    'glossary_boss_presses',
    'glossary_boss_fight_active',
    'glossary_boss_pillars_defeated',
    'glossary_boss_remaining_pillars',
    'glossary_boss_current_combat_pillar',
    'glossary_boss_combat_victory',
    'glossary_combat_return_map',
    'glossary_combat_player_x',
    'glossary_combat_player_y',
    'glossary_last_floor',
    'glossary_opened_chests',
    'glossary_completed_trades',
    'glossary_mechanic_doors',
    'glossary_settlement_doors',
    'glossary_merchant_return_map',
    'merchant_shop_state',
    'glossary_god_mode',
    'glossary_rune_discoveries',
    'glossary_rune_viewed',
    'items_discovered',
    'items_viewed',
    'locations_discovered',
    'locations_viewed',
    'bestiary_discovered',
    'bestiary_viewed',
    'glossary_slate_progress'
];

export function clearGameplayStorageForNewRun(): void {
    for (const key of GAMEPLAY_STORAGE_KEYS) {
        localStorage.removeItem(key);
    }
}
