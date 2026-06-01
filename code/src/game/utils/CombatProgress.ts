export interface CombatCompletionRecord {
    enemyName: string;
    gems: number;
    specialCur: number;
    tokens: number;
    completionId?: string;
}

const COMPLETED_COMBATS_KEY = 'glossary_completed_combats';
export const MAX_TOTAL_COMBATS = 3;

export function getTotalCompletedCombats(): number {
    try {
        const parsed = readCompletedCombats();
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

export function recordCompletedCombat(encounterMapKey: string, combatRecord: CombatCompletionRecord): boolean {
    const allCompleted = readCompletedCombats();
    const mapList = allCompleted[encounterMapKey] || [];

    if (combatRecord.completionId && hasCompletionId(allCompleted, combatRecord.completionId)) {
        return false;
    }

    let globalTotal = 0;
    for (const key of Object.keys(allCompleted)) {
        if (Array.isArray(allCompleted[key])) globalTotal += allCompleted[key].length;
    }

    if (mapList.length >= MAX_TOTAL_COMBATS || globalTotal >= MAX_TOTAL_COMBATS) {
        return false;
    }

    mapList.push(combatRecord);
    allCompleted[encounterMapKey] = mapList;
    localStorage.setItem(COMPLETED_COMBATS_KEY, JSON.stringify(allCompleted));
    return true;
}

export function clearCompletedCombats(): void {
    localStorage.removeItem(COMPLETED_COMBATS_KEY);
}

function readCompletedCombats(): Record<string, CombatCompletionRecord[]> {
    try {
        const existing = localStorage.getItem(COMPLETED_COMBATS_KEY);
        if (!existing) return {};

        const parsed = JSON.parse(existing);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

function hasCompletionId(allCompleted: Record<string, CombatCompletionRecord[]>, completionId: string): boolean {
    for (const key of Object.keys(allCompleted)) {
        const records = allCompleted[key];
        if (Array.isArray(records) && records.some(record => record?.completionId === completionId)) {
            return true;
        }
    }
    return false;
}
