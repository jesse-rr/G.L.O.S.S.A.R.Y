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
    animProfile?: string;
}

export const BESTIARY: BestiaryDefinition[] = [
    {
        id: 'bat',
        name: 'Giant Bat',
        description: 'A swift flying creature of the dark. It strikes quickly and returns to the shadows, relying on speed to confuse its prey.\nEffect: Applies Poison on hit (Takes damage each round for 3 rounds).',
        texture: 'bat_fly',
        frame: 0,
        rarity: 'Common',
        hp: 75,
        baseDamage: 9,
        tier: 1,
        animProfile: 'bat'
    },
    {
        id: 'crab',
        name: 'Chitin Crab',
        description: 'A heavily armored crustacean native to the ruins\' flooded corridors. Its claws pack a powerful punch, and its thick shell absorbs physical damage.',
        texture: 'crab_idle',
        frame: 0,
        rarity: 'Uncommon',
        hp: 150,
        baseDamage: 13,
        tier: 2,
        animProfile: 'crab'
    },
    {
        id: 'rat',
        name: 'Dire Rat',
        description: `A vicious rodent that hunts in the dark corners of the ruins. Quick and aggressive, it bites with disease-coated fangs.
Effect: Applies Poison on hit (Takes damage each round for 3 rounds).`,
        texture: 'rat_idle',
        frame: 0,
        rarity: 'Common',
        hp: 88,
        baseDamage: 10,
        tier: 1,
        animProfile: 'rat'
    },
    {
        id: 'skull',
        name: 'Lost Soul',
        description: `A floating skull animated by ancient runic magic. It flies erratically and channels unstable energy from the beyond.
Effect: Applies Dazed on hit (50% chance to miss attacks for 2 rounds).`,
        texture: 'skull_idle',
        frame: 0,
        rarity: 'Uncommon',
        hp: 113,
        baseDamage: 15,
        tier: 2,
        animProfile: 'skull'
    },
    {
        id: 'slime_1',
        name: 'Green Slime',
        description: `A gelatinous creature wearing glasses. Its highly acidic body inflicts "Corrosion", lowering your defense over time.
Effect: Passive 25% damage reduction.`,
        texture: 'slime_green_idle',
        frame: 0,
        rarity: 'Common',
        hp: 63,
        baseDamage: 6,
        tier: 1,
        animProfile: 'slime_green'
    },
    {
        id: 'slime_2',
        name: 'Blue Slime',
        description: `A denser ooze with a shattered sword lodged within. It boasts immense physical resistance and reflects a portion of physical damage back.
Effect: Passive 25% damage reduction.`,
        texture: 'slime_blue_idle',
        frame: 0,
        rarity: 'Uncommon',
        hp: 138,
        baseDamage: 9,
        tier: 2,
        animProfile: 'slime_blue'
    },
    {
        id: 'pebble',
        name: 'Pebble',
        description: `A small animated stone construct. It is mostly passive and defensive, observing its environment quietly.
Effect: Reflects 50% of received damage back to the attacker.`,
        texture: 'pebble_idle',
        frame: 0,
        rarity: 'Common',
        hp: 50,
        baseDamage: 0,
        tier: 1,
        animProfile: 'pebble'
    },
    {
        id: 'skeleton_warrior',
        name: 'Skeleton Warrior',
        description: 'A reanimated skeletal warrior clad in decaying steel. It swings its heavy sword with tireless, lethal force.',
        texture: 'skeleton_warrior_idle',
        frame: 0,
        rarity: 'Uncommon',
        hp: 300,
        baseDamage: 14,
        tier: 2,
        animProfile: 'skeleton_warrior'
    },
    {
        id: 'skeleton_mage',
        name: 'Skeleton Mage',
        description: 'A skeletal practitioner of the dark arts. It channels necrotic energy to sap the life force of its foes.',
        texture: 'skeleton_mage_idle',
        frame: 0,
        rarity: 'Uncommon',
        hp: 106,
        baseDamage: 17,
        tier: 2,
        animProfile: 'skeleton_mage'
    },
    {
        id: 'golem_1',
        name: 'Moss Golem',
        description: 'An animated rock construct overgrown with ancient foliage. It possesses immense health and occasionally stuns with heavy slams.',
        texture: 'golem_na_idleA',
        frame: 0,
        rarity: 'Uncommon',
        hp: 150,
        baseDamage: 17,
        tier: 3,
        animProfile: 'golem_noarmor'
    },
    {
        id: 'golem_2',
        name: 'Runic Golem',
        description: 'A volatile construct seeping arcane energy, armored in dark stone. Its attacks can disrupt your rune spells.',
        texture: 'golem_ar_idle',
        frame: 0,
        rarity: 'Rare',
        hp: 250,
        baseDamage: 24,
        tier: 3,
        animProfile: 'golem_armored'
    },
    {
        id: 'pillar_1',
        name: 'Core of Syntax',
        description: 'The first pillar of the Glossary. It guards the structures of language with high-frequency wards.',
        texture: 'pillar-1',
        frame: 0,
        rarity: 'Rare',
        hp: 150,
        baseDamage: 11,
        tier: 4
    },
    {
        id: 'pillar_2',
        name: 'Core of Semantics',
        description: 'The second pillar of the Glossary. It twists the meaning of runes, distorting spells and energy.',
        texture: 'pillar-2',
        frame: 0,
        rarity: 'Rare',
        hp: 175,
        baseDamage: 13,
        tier: 4
    },
    {
        id: 'pillar_3',
        name: 'Core of Lexicon',
        description: 'The third pillar of the Glossary. It links its life force directly to the trespasser, draining their energy.',
        texture: 'pillar-3',
        frame: 0,
        rarity: 'Rare',
        hp: 188,
        baseDamage: 13,
        tier: 4
    },
    {
        id: 'pillar_4',
        name: 'Core of Etymology',
        description: 'The final pillar of the Glossary. It silences and alters ancient symbols, fracturing rune connections.',
        texture: 'pillar-4',
        frame: 0,
        rarity: 'Rare',
        hp: 200,
        baseDamage: 15,
        tier: 4
    }
];

const BESTIARY_IDS = new Set(BESTIARY.map(def => def.id));

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
        if (!BESTIARY_IDS.has(id)) return;
        if (this.discoveredEntities.has(id)) return;
        this.discoveredEntities.add(id);
        this.save();
    }

    public isViewed(id: string): boolean {
        return this.viewedEntities.has(id);
    }

    public markViewed(id: string): void {
        if (!BESTIARY_IDS.has(id)) return;
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
                this.discoveredEntities = new Set(arr.filter(id => typeof id === 'string' && BESTIARY_IDS.has(id)));
            } catch (e) {
                this.discoveredEntities = new Set();
            }
        }

        const viewedData = localStorage.getItem('bestiary_viewed');
        if (viewedData) {
            try {
                const arr = JSON.parse(viewedData) as string[];
                this.viewedEntities = new Set(arr.filter(id => typeof id === 'string' && BESTIARY_IDS.has(id)));
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
