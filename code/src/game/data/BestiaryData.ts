export interface BestiaryDefinition {
    id: string;
    name: string;
    description: string;
    texture: string;
    frame: number;
    rarity: string;
    hp: number;
    baseDamage: number;
    tier: number;
}

export const BESTIARY: BestiaryDefinition[] = [
    {
        id: 'rationalist',
        name: 'Rationalist',
        description: 'A pale entity resembling a statue of Michelangelo. In combat, it guards its mind fiercely, rendering it completely immune to psychic status effects.',
        texture: 'rationalist',
        frame: 0,
        rarity: 'Rare',
        hp: 300,
        baseDamage: 25,
        tier: 3
    },
    {
        id: 'cultist_1',
        name: 'Lost Shadow',
        description: 'A shadow wrapped in a tattered cape, wandering without purpose. It attacks with erratic lunges, occasionally inflicting the "Bleed" status.',
        texture: 'cultist',
        frame: 0,
        rarity: 'Common',
        hp: 60,
        baseDamage: 5,
        tier: 1
    },
    {
        id: 'cultist_2',
        name: 'The Fool',
        description: 'A twisted shadow wearing a broken crown. It uses horrific tentacles hidden beneath its cloak to "Bind" you, interrupting Rune chain progression.',
        texture: 'cultist',
        frame: 4,
        rarity: 'Rare',
        hp: 270,
        baseDamage: 18,
        tier: 2
    },
    {
        id: 'scavenger',
        name: 'Scavenger',
        description: 'A vulture adorned with a stolen golden chain and shoes. It actively attempts to "Steal" unidentified Runes directly from your hand.',
        texture: 'scavenger',
        frame: 0,
        rarity: 'Uncommon',
        hp: 90,
        baseDamage: 8,
        tier: 2
    },
    {
        id: 'slime_1',
        name: 'Green Slime',
        description: 'A gelatinous creature wearing glasses. Its highly acidic body inflicts "Corrosion", permanently lowering your defense each turn it survives.',
        texture: 'slime',
        frame: 0,
        rarity: 'Common',
        hp: 40,
        baseDamage: 3,
        tier: 1
    },
    {
        id: 'slime_2',
        name: 'Blue Slime',
        description: 'A denser ooze with a shattered sword lodged within. It boasts immense physical resistance and reflects a portion of physical damage back at the attacker.',
        texture: 'slime',
        frame: 10,
        rarity: 'Uncommon',
        hp: 120,
        baseDamage: 6,
        tier: 2
    },
    {
        id: 'wisp_1',
        name: 'Ember Wisp',
        description: 'A floating head engulfed in eternal flames. It casts "Burn" upon contact, dealing small but continuous Fire damage over time.',
        texture: 'wisp',
        frame: 0,
        rarity: 'Common',
        hp: 50,
        baseDamage: 10,
        tier: 1
    },
    {
        id: 'wisp_2',
        name: 'Necro Wisp',
        description: 'A blazing torso with fiery arms. It uses its intense heat to manipulate the bones of the dead, capable of "Reviving" fallen skeletons as allies.',
        texture: 'wisp',
        frame: 10,
        rarity: 'Rare',
        hp: 160,
        baseDamage: 18,
        tier: 2
    },
    {
        id: 'golem_1',
        name: 'Moss Golem',
        description: 'An animated rock construct overgrown with ancient foliage. It possesses immense health and occasionally "Stuns" with heavy, earth-shattering slams.',
        texture: 'golem',
        frame: 0,
        rarity: 'Uncommon',
        hp: 240,
        baseDamage: 15,
        tier: 2
    },
    {
        id: 'golem_2',
        name: 'Runic Golem',
        description: 'A volatile construct seeping arcane energy, oddly wearing a cowboy hat. Highly unstable, its attacks can "Silence" your ability to use specific Runes.',
        texture: 'golem',
        frame: 10,
        rarity: 'Rare',
        hp: 400,
        baseDamage: 22,
        tier: 3
    },
    {
        id: 'pillar_core_syntax',
        name: 'Core of Syntax',
        description: 'The first pillar of the Glossary. It guards the structures of language with high-frequency wards.',
        texture: 'golem',
        frame: 10,
        rarity: 'Rare',
        hp: 120,
        baseDamage: 10,
        tier: 3
    },
    {
        id: 'pillar_core_semantics',
        name: 'Core of Semantics',
        description: 'The second pillar of the Glossary. It twists the meaning of runes, distorting spells and energy.',
        texture: 'golem',
        frame: 10,
        rarity: 'Rare',
        hp: 140,
        baseDamage: 12,
        tier: 3
    },
    {
        id: 'pillar_core_lexicon',
        name: 'Core of Lexicon',
        description: 'The third pillar of the Glossary. It links its life force directly to the trespasser, draining their energy.',
        texture: 'golem',
        frame: 10,
        rarity: 'Rare',
        hp: 150,
        baseDamage: 12,
        tier: 3
    },
    {
        id: 'pillar_core_etymology',
        name: 'Core of Etymology',
        description: 'The final pillar of the Glossary. It silences and alters ancient symbols, fracturing rune connections.',
        texture: 'golem',
        frame: 10,
        rarity: 'Rare',
        hp: 160,
        baseDamage: 14,
        tier: 3
    }
];

export class BestiaryData {
    private static instance: BestiaryData;
    private discoveredEntities: Set<string> = new Set();
    private viewedEntities: Set<string> = new Set();

    private constructor() {
        this.load();
    }

    public static getInstance(): BestiaryData {
        if (!BestiaryData.instance) {
            BestiaryData.instance = new BestiaryData();
        }
        return BestiaryData.instance;
    }

    public isDiscovered(id: string): boolean {
        return this.discoveredEntities.has(id);
    }

    public discoverEntity(id: string): void {
        if (this.discoveredEntities.has(id)) return;
        this.discoveredEntities.add(id);
        this.save();
    }

    public isViewed(id: string): boolean {
        return this.viewedEntities.has(id);
    }

    public markViewed(id: string): void {
        if (this.viewedEntities.has(id)) return;
        this.viewedEntities.add(id);
        this.save();
    }

    public getDiscoveredCount(): number {
        return this.discoveredEntities.size;
    }

    public getDiscoveredEntities(): string[] {
        return Array.from(this.discoveredEntities);
    }

    public save(): void {
        localStorage.setItem('bestiary_discovered', JSON.stringify(Array.from(this.discoveredEntities)));
        localStorage.setItem('bestiary_viewed', JSON.stringify(Array.from(this.viewedEntities)));
    }

    public load(): void {
        const discoveredData = localStorage.getItem('bestiary_discovered');
        if (discoveredData) {
            try {
                const arr = JSON.parse(discoveredData) as string[];
                this.discoveredEntities = new Set(arr);
            } catch (e) {
                this.discoveredEntities = new Set();
            }
        }

        const viewedData = localStorage.getItem('bestiary_viewed');
        if (viewedData) {
            try {
                const arr = JSON.parse(viewedData) as string[];
                this.viewedEntities = new Set(arr);
            } catch (e) {
                this.viewedEntities = new Set();
            }
        }
    }

    public reset(): void {
        this.discoveredEntities.clear();
        this.viewedEntities.clear();
        this.save();
    }
}