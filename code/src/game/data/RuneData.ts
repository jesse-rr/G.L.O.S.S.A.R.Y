export type RuneEffectType = 'damage' | 'defense' | 'heal' | 'buff' | 'debuff' | 'utility';
export type RuneCardType = 'base' | 'boost' | 'unique';

export interface RuneDefinition {
    letter: string;
    name: string;
    translation: string;
    effectType: RuneEffectType;
    cardType: RuneCardType;
    basePower: number;
    description: string;
}

export interface ChainCombo {
    name: string;
    bonusPower: number;
    description: string;
}

const RUNE_DEFINITIONS: RuneDefinition[] = [
    { letter: 'A', name: 'Aether', translation: 'Strength', effectType: 'damage', cardType: 'base', basePower: 8, description: "Recovered from the crumbling pillars of the High Settlement, Aether represents raw, unbridled power. Scholars of old believed invoking this rune would grant the strength of titans to the wielder." },
    { letter: 'B', name: 'Basalt', translation: 'Shield', effectType: 'defense', cardType: 'base', basePower: 6, description: "Carved into the impenetrable gates of the lost city of Oakhaven, Basalt embodies unyielding protection. It was traditionally used by vanguard knights to turn away even the fiercest of blows." },
    { letter: 'C', name: 'Cipher', translation: 'Pierce', effectType: 'damage', cardType: 'base', basePower: 10, description: "Discovered on the obsidian spearheads of the desert nomads, Cipher represents the ability to strike through any defense. It is said its true meaning translates to 'the unavoidable truth'." },
    { letter: 'D', name: 'Dusk', translation: 'Drain', effectType: 'heal', cardType: 'boost', basePower: 5, description: "Forbidden by the elders of the Lumina Sect, Dusk draws the life force from one vessel to another. Ancient cults used it under the eclipse to siphon energy from the earth itself." },
    { letter: 'E', name: 'Echo', translation: 'Repeat', effectType: 'utility', cardType: 'unique', basePower: 0, description: "Found etched within the whispering caves of the Hollow Peaks. Echo signifies eternity through repetition, allowing skilled casters to mirror their own actions across time." },
    { letter: 'F', name: 'Fyre', translation: 'Burn', effectType: 'damage', cardType: 'base', basePower: 12, description: "The primordial spark. Fyre was revered by the first men who survived the Great Winter. When channeled, it ignites the air itself, bringing the wrath of ancient volcanoes." },
    { letter: 'G', name: 'Glyph', translation: 'Mark', effectType: 'debuff', cardType: 'boost', basePower: 4, description: "Used by the royal assassins of the Silver Throne, Glyph was a death sentence. To be marked by this rune meant your soul was already tethered to the abyss." },
    { letter: 'H', name: 'Hallow', translation: 'Purify', effectType: 'heal', cardType: 'boost', basePower: 7, description: "Blessed by the High Priestesses of the Sun Altar. Hallow washes away corruption and decay, returning the flesh and spirit to its most pristine, untainted state." },
    { letter: 'I', name: 'Ignis', translation: 'Ignite', effectType: 'damage', cardType: 'unique', basePower: 9, description: "Distinct from raw fire, Ignis represents the sudden, violent birth of a spark. Found on the anvils of the legendary dwarven smiths, it forces a target to combust from within." },
    { letter: 'J', name: 'Jinx', translation: 'Curse', effectType: 'debuff', cardType: 'boost', basePower: 6, description: "Unearthed from the cursed catacombs of the Usurper King. Jinx twists probability and fate, ensuring misfortune plagues anyone who dares stand against its invoker." },
    { letter: 'K', name: 'Kael', translation: 'Fortify', effectType: 'defense', cardType: 'base', basePower: 8, description: "The foundational stone of the Great Bastion. Kael goes beyond physical shields; it reinforces the very spirit and resolve of an ally, making them immovable objects." },
    { letter: 'L', name: 'Lux', translation: 'Light', effectType: 'heal', cardType: 'boost', basePower: 6, description: "A beacon in the dark age. Lux is said to be a crystallized fragment of a falling star, offering warmth, clarity, and mending to those lost in the shadow." },
    { letter: 'M', name: 'Morth', translation: 'Decay', effectType: 'debuff', cardType: 'base', basePower: 7, description: "A taboo rune banished from all grand libraries. Morth symbolizes the inevitable end of all things. It accelerates time locally, causing weapons to rust and flesh to rot." },
    { letter: 'N', name: 'Nyx', translation: 'Shadow', effectType: 'damage', cardType: 'base', basePower: 11, description: "Worshipped by the veiled brotherhood, Nyx is the embodiment of the void. It swallows light and hope alike, striking enemies from places the eye cannot see." },
    { letter: 'O', name: 'Orin', translation: 'Amplify', effectType: 'buff', cardType: 'boost', basePower: 0, description: "The rune of the grand choir. Orin does not create, it multiplies. Found inscribed inside ancient amplifying horns, it pushes any action taken to its absolute limit." },
    { letter: 'P', name: 'Prism', translation: 'Reflect', effectType: 'defense', cardType: 'unique', basePower: 5, description: "Crafted by the glass-weavers of the crystal coast. Prism teaches that the greatest defense is turning the enemy's strength against them, shattering their intentions." },
    { letter: 'Q', name: 'Quell', translation: 'Silence', effectType: 'debuff', cardType: 'unique', basePower: 3, description: "The peacemaker's last resort. Quell stifles sound, magic, and willpower. Used to bind rogue sorcerers, it creates an absolute void where no spells can be cast." },
    { letter: 'R', name: 'Rime', translation: 'Freeze', effectType: 'damage', cardType: 'base', basePower: 7, description: "Born from the heart of the eternal glacier. Rime halts the flow of life and time. Victims hit by this rune often feel a cold so deep it stops their heart entirely." },
    { letter: 'S', name: 'Sigil', translation: 'Seal', effectType: 'utility', cardType: 'unique', basePower: 0, description: "The warden's key. Sigil was used to lock away ancient evils beneath the earth. It binds physical and magical properties, locking an enemy's potential away." },
    { letter: 'T', name: 'Thorn', translation: 'Retaliate', effectType: 'defense', cardType: 'base', basePower: 9, description: "A testament to nature's vengeance. Thorn ensures that pain given is pain received. It was the crest of the Briar Knights, who welcomed strikes only to reflect the agony." },
    { letter: 'U', name: 'Umbra', translation: 'Veil', effectType: 'buff', cardType: 'boost', basePower: 4, description: "The trickster's cloak. Umbra hides the truth from the world, obscuring the caster in a shroud of mystery. It protects by making one simply cease to exist to the naked eye." },
    { letter: 'V', name: 'Vox', translation: 'Command', effectType: 'buff', cardType: 'boost', basePower: 5, description: "The word of the sovereign. Vox enforces absolute authority over lesser beings. Uttering this rune bends the will of the weak and bolsters the courage of the loyal." },
    { letter: 'W', name: 'Wyrd', translation: 'Fate', effectType: 'utility', cardType: 'unique', basePower: 0, description: "Interpreted by the blind seers of the oracle pool. Wyrd acknowledges that all paths are pre-written. It manipulates destiny slightly, shifting luck entirely in your favor." },
    { letter: 'X', name: 'Xael', translation: 'Shatter', effectType: 'damage', cardType: 'base', basePower: 14, description: "The breaker of chains. Xael represents pure destructive resonance. It was used in siege warfare to turn impenetrable fortress walls into dust with a single strike." },
    { letter: 'Y', name: 'Ymir', translation: 'Endure', effectType: 'defense', cardType: 'unique', basePower: 10, description: "The rune of the lone survivor. Ymir demands that life persists against all odds. It grants an unnatural resilience, allowing one to stand firm long after they should have fallen." }
];

export const SUMMIT_RUNE: RuneDefinition = {
    letter: 'Z',
    name: 'Zeph',
    translation: 'Hidden by God',
    effectType: 'utility',
    cardType: 'unique',
    basePower: 0,
    description: "The forbidden coordinate. Zeph was stricken from the grand archives. It is said to mark the exact location of the Summit, a place entirely hidden from the eyes of the divine."
};

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
    private viewedRunes: Set<string> = new Set();
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
        localStorage.setItem('glossary_rune_viewed', JSON.stringify(Array.from(this.viewedRunes)));
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

        const viewedData = localStorage.getItem('glossary_rune_viewed');
        if (viewedData) {
            try {
                const arr = JSON.parse(viewedData) as string[];
                this.viewedRunes = new Set(arr);
            } catch (e) {
                this.viewedRunes = new Set();
            }
        }
    }

    reset(): void {
        this.discoveredRunes.clear();
        this.viewedRunes.clear();
        this.save();
    }

    isViewed(letter: string): boolean {
        return this.viewedRunes.has(letter.toUpperCase());
    }

    markViewed(letter: string): void {
        this.viewedRunes.add(letter.toUpperCase());
        this.save();
    }
}
