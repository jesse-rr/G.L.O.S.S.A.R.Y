export type RuneEffectType = 'damage' | 'defense' | 'heal' | 'buff' | 'debuff' | 'utility';
export type RuneCardType = 'base' | 'boost' | 'unique';

export interface RuneDefinition {
    letter: string;
    name: string;
    translation: string;
    effectType: RuneEffectType;
    cardType: RuneCardType;
    basePower: number;
}

export interface ChainCombo {
    name: string;
    bonusPower: number;
    description: string;
}

const RUNE_DEFINITIONS: RuneDefinition[] = [
    { letter: 'A', name: 'Aether', translation: 'Strength', effectType: 'damage', cardType: 'base', basePower: 8 },
    { letter: 'B', name: 'Basalt', translation: 'Shield', effectType: 'defense', cardType: 'base', basePower: 6 },
    { letter: 'C', name: 'Cipher', translation: 'Pierce', effectType: 'damage', cardType: 'base', basePower: 10 },
    { letter: 'D', name: 'Dusk', translation: 'Drain', effectType: 'heal', cardType: 'boost', basePower: 5 },
    { letter: 'E', name: 'Echo', translation: 'Repeat', effectType: 'utility', cardType: 'boost', basePower: 0 },
    { letter: 'F', name: 'Fyre', translation: 'Burn', effectType: 'damage', cardType: 'base', basePower: 12 },
    { letter: 'G', name: 'Glyph', translation: 'Mark', effectType: 'debuff', cardType: 'boost', basePower: 4 },
    { letter: 'H', name: 'Hallow', translation: 'Purify', effectType: 'heal', cardType: 'boost', basePower: 7 },
    { letter: 'I', name: 'Ignis', translation: 'Ignite', effectType: 'damage', cardType: 'base', basePower: 9 },
    { letter: 'J', name: 'Jinx', translation: 'Curse', effectType: 'debuff', cardType: 'unique', basePower: 6 },
    { letter: 'K', name: 'Kael', translation: 'Fortify', effectType: 'defense', cardType: 'base', basePower: 8 },
    { letter: 'L', name: 'Lux', translation: 'Light', effectType: 'heal', cardType: 'boost', basePower: 6 },
    { letter: 'M', name: 'Morth', translation: 'Decay', effectType: 'debuff', cardType: 'unique', basePower: 7 },
    { letter: 'N', name: 'Nyx', translation: 'Shadow', effectType: 'damage', cardType: 'base', basePower: 11 },
    { letter: 'O', name: 'Orin', translation: 'Amplify', effectType: 'buff', cardType: 'boost', basePower: 0 },
    { letter: 'P', name: 'Prism', translation: 'Reflect', effectType: 'defense', cardType: 'unique', basePower: 5 },
    { letter: 'Q', name: 'Quell', translation: 'Silence', effectType: 'debuff', cardType: 'unique', basePower: 3 },
    { letter: 'R', name: 'Rime', translation: 'Freeze', effectType: 'damage', cardType: 'base', basePower: 7 },
    { letter: 'S', name: 'Sigil', translation: 'Seal', effectType: 'utility', cardType: 'unique', basePower: 0 },
    { letter: 'T', name: 'Thorn', translation: 'Retaliate', effectType: 'defense', cardType: 'base', basePower: 9 },
    { letter: 'U', name: 'Umbra', translation: 'Veil', effectType: 'buff', cardType: 'boost', basePower: 4 },
    { letter: 'V', name: 'Vox', translation: 'Command', effectType: 'buff', cardType: 'boost', basePower: 5 },
    { letter: 'W', name: 'Wyrd', translation: 'Fate', effectType: 'utility', cardType: 'unique', basePower: 0 },
    { letter: 'X', name: 'Xael', translation: 'Shatter', effectType: 'damage', cardType: 'base', basePower: 14 },
    { letter: 'Y', name: 'Ymir', translation: 'Endure', effectType: 'defense', cardType: 'unique', basePower: 10 },
    { letter: 'Z', name: 'Zeph', translation: 'Windstrike', effectType: 'damage', cardType: 'base', basePower: 13 }
];

const COMBO_NAMES_2: Record<string, string[]> = {
    'base+boost': ['Enhanced', 'Empowered', 'Infused', 'Charged', 'Awakened'],
    'base+unique': ['Rare', 'Mythic', 'Ancient', 'Forbidden', 'Arcane'],
    'base+base': ['Dual', 'Primal', 'Twin', 'Combined', 'United'],
    'boost+unique': ['Resonant', 'Harmonic', 'Attuned', 'Synced', 'Woven'],
    'boost+boost': ['Layered', 'Stacked', 'Doubled', 'Mirrored', 'Cascading'],
    'unique+unique': ['Paradox', 'Enigma', 'Anomaly', 'Rift', 'Nexus']
};

const COMBO_NAMES_3: Record<string, string[]> = {
    'base+base+base': ['Primal Surge', 'Trinity Force', 'Elemental Fury'],
    'base+base+boost': ['Grand Strike', 'Empowered Fury', 'Raging Torrent'],
    'base+base+unique': ['Mythic Assault', 'Legendary Blow', 'Fated Strike'],
    'base+boost+boost': ['Overcharged', 'Supercharged', 'Hyper Infusion'],
    'base+boost+unique': ['Legendary', 'Transcendent', 'Ascended'],
    'base+unique+unique': ['Forbidden Art', 'Lost Technique', 'Ancient Rite'],
    'boost+boost+boost': ['Triple Cascade', 'Overflow', 'Resonance Wave'],
    'boost+boost+unique': ['Rare Harmony', 'Exotic Sync', 'Strange Chord'],
    'boost+unique+unique': ['Paradox Weave', 'Anomaly Flux', 'Twisted Fate'],
    'unique+unique+unique': ['Impossible Chain', 'Void Convergence', 'Singularity']
};

const EFFECT_FLAVOR: Record<string, string[]> = {
    'damage': ['Strike', 'Blast', 'Fury', 'Wrath', 'Ruin'],
    'defense': ['Guard', 'Wall', 'Aegis', 'Barrier', 'Bulwark'],
    'heal': ['Mend', 'Grace', 'Renewal', 'Remedy', 'Blessing'],
    'buff': ['Surge', 'Rally', 'Anthem', 'Hymn', 'Aura'],
    'debuff': ['Hex', 'Bane', 'Wither', 'Blight', 'Rot'],
    'utility': ['Shift', 'Flux', 'Weave', 'Rift', 'Echo']
};

function getTypeKey(types: RuneCardType[]): string {
    const sorted = [...types].sort();
    return sorted.join('+');
}

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function resolveCombo(chain: string[]): ChainCombo | null {
    if (chain.length < 2) return null;

    const defs = chain.map(l => RUNE_DEFINITIONS.find(r => r.letter === l.toUpperCase())).filter(Boolean) as RuneDefinition[];
    if (defs.length < 2) return null;

    const types = defs.map(d => d.cardType);
    const hasBase = types.includes('base');

    if (!hasBase) return null;

    const typeKey = getTypeKey(types);
    const effectTypes = defs.map(d => d.effectType);
    const names = defs.map(d => d.name);

    let prefix: string;
    let bonusPower: number;

    if (chain.length === 2) {
        const nameList = COMBO_NAMES_2[typeKey] || ['Linked'];
        prefix = pickRandom(nameList);

        const baseCount = types.filter(t => t === 'base').length;
        const uniqueCount = types.filter(t => t === 'unique').length;
        bonusPower = 3 + baseCount * 2 + uniqueCount * 3;
    } else {
        const nameList = COMBO_NAMES_3[typeKey] || ['Convergence'];
        prefix = pickRandom(nameList);

        const baseCount = types.filter(t => t === 'base').length;
        const uniqueCount = types.filter(t => t === 'unique').length;
        const boostCount = types.filter(t => t === 'boost').length;
        bonusPower = 5 + baseCount * 3 + uniqueCount * 4 + boostCount * 2;
    }

    const primaryEffect = effectTypes.find(e => e === 'damage') || effectTypes[0];
    const flavor = pickRandom(EFFECT_FLAVOR[primaryEffect] || ['Power']);
    const comboName = `${prefix} ${flavor}`;
    const description = names.join(' + ');

    return {
        name: comboName,
        bonusPower,
        description
    };
}

export class RuneData {
    private discoveredRunes: Set<string> = new Set();
    private static instance: RuneData;

    static getInstance(): RuneData {
        if (!RuneData.instance) {
            const inst = new RuneData();
            inst.load();
            RuneData.instance = inst;
        }
        return RuneData.instance;
    }

    static getAllDefinitions(): RuneDefinition[] {
        return RUNE_DEFINITIONS;
    }

    static getDefinition(letter: string): RuneDefinition | undefined {
        return RUNE_DEFINITIONS.find(r => r.letter === letter.toUpperCase());
    }

    static findMatchingCombo(chain: string[]): ChainCombo | null {
        return resolveCombo(chain);
    }

    static resolveChainPower(chain: string[]): number {
        let total = 0;
        for (const letter of chain) {
            const def = RuneData.getDefinition(letter);
            if (def) total += def.basePower;
        }
        const combo = resolveCombo(chain);
        if (combo) total += combo.bonusPower;
        return total;
    }

    discoverRune(letter: string): boolean {
        const upper = letter.toUpperCase();
        if (this.discoveredRunes.has(upper)) return false;
        this.discoveredRunes.add(upper);
        this.save();
        return true;
    }

    isDiscovered(letter: string): boolean {
        return this.discoveredRunes.has(letter.toUpperCase());
    }

    getDiscoveredRunes(): string[] {
        return Array.from(this.discoveredRunes).sort();
    }

    getDiscoveredDefinitions(): RuneDefinition[] {
        return RUNE_DEFINITIONS.filter(r => this.discoveredRunes.has(r.letter));
    }

    save(): void {
        localStorage.setItem('glossary_rune_discoveries', JSON.stringify(Array.from(this.discoveredRunes)));
    }

    load(): void {
        const data = localStorage.getItem('glossary_rune_discoveries');
        if (data) {
            try {
                const arr = JSON.parse(data) as string[];
                this.discoveredRunes = new Set(arr);
            } catch (e) {
                this.discoveredRunes = new Set();
            }
        }
    }

    reset(): void {
        this.discoveredRunes.clear();
        this.save();
    }
}
