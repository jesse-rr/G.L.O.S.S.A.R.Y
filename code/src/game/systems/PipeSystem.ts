import * as Phaser from 'phaser';

const COMPLETED_COMBATS_KEY = 'glossary_completed_combats';
const MAX_TOTAL_COMBATS = 3;

const PIPE_LAYER_NAMES = ['Pipes/Pipe 1', 'Pipes/Pipe 2', 'Pipes/Pipe 3'];

const EMPTY_TO_FILLED_GID: Record<number, number> = {
    304: 300,
    344: 340,
    307: 303,
    305: 301,
    306: 302,
    345: 341,
    346: 342
};

export function getTotalCompletedCombats(): number {
    try {
        const raw = localStorage.getItem(COMPLETED_COMBATS_KEY);
        if (!raw) return 0;
        const parsed = JSON.parse(raw) as Record<string, unknown[]>;
        let total = 0;
        for (const key of Object.keys(parsed)) {
            if (Array.isArray(parsed[key])) {
                total += parsed[key].length;
            }
        }
        return Math.min(total, MAX_TOTAL_COMBATS);
    } catch {
        return 0;
    }
}

export function hasReachedMaxCombats(): boolean {
    return getTotalCompletedCombats() >= MAX_TOTAL_COMBATS;
}

export function isPipeLayer(layerName: string): boolean {
    return PIPE_LAYER_NAMES.includes(layerName);
}

export function getPipeIndex(layerName: string): number {
    return PIPE_LAYER_NAMES.indexOf(layerName);
}

export function fillPipeLayer(layer: Phaser.Tilemaps.TilemapLayer): void {
    const completedCount = getTotalCompletedCombats();
    const pipeIndex = getPipeIndex(layer.layer.name);
    if (pipeIndex < 0 || pipeIndex >= completedCount) return;

    layer.layer.data.forEach((row: Phaser.Tilemaps.Tile[]) => {
        row.forEach((tile: Phaser.Tilemaps.Tile) => {
            if (!tile || tile.index < 0) return;
            const filledGid = EMPTY_TO_FILLED_GID[tile.index];
            if (filledGid !== undefined) {
                layer.putTileAt(filledGid, tile.x, tile.y);
            }
        });
    });
}
