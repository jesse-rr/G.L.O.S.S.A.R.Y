export interface BestiaryDefinition {
    id: string;
    name: string;
    description: string;
    texture: string;
    frame: number;
    rarity: string;
    hp: number;
    baseDamage: number;
}

export const BESTIARY: BestiaryDefinition[] = [
    {
        id: 'rationalist',
        name: 'Rationalist',
        description: 'A pale entity resembling a statue of Michelangelo. In combat, it guards its mind fiercely, rendering it completely immune to psychic status effects.',
        texture: 'rationalist',
        frame: 0,
        rarity: 'Rare',
        hp: 150,
        baseDamage: 25
    },
    {
        id: 'cultist_1',
        name: 'Lost Shadow',
        description: 'A shadow wrapped in a tattered cape, wandering without purpose. It attacks with erratic lunges, occasionally inflicting the "Bleed" status.',
        texture: 'cultist',
        frame: 0,
        rarity: 'Common',
        hp: 30,
        baseDamage: 5
    },
    {
        id: 'cultist_2',
        name: 'The Fool',
        description: 'A twisted shadow wearing a broken crown. It uses horrific tentacles hidden beneath its cloak to "Bind" you, interrupting Rune chain progression.',
        texture: 'cultist',
        frame: 4,
        rarity: 'Rare',
        hp: 135,
        baseDamage: 18
    },
    {
        id: 'scavenger',
        name: 'Scavenger',
        description: 'A vulture adorned with a stolen golden chain and shoes. It actively attempts to "Steal" unidentified Runes directly from your hand.',
        texture: 'scavenger',
        frame: 0,
        rarity: 'Uncommon',
        hp: 45,
        baseDamage: 8
    },
    {
        id: 'slime_1',
        name: 'Green Slime',
        description: 'A gelatinous creature wearing glasses. Its highly acidic body inflicts "Corrosion", permanently lowering your defense each turn it survives.',
        texture: 'slime',
        frame: 0,
        rarity: 'Common',
        hp: 20,
        baseDamage: 3
    },
    {
        id: 'slime_2',
        name: 'Blue Slime',
        description: 'A denser ooze with a shattered sword lodged within. It boasts immense physical resistance and reflects a portion of physical damage back at the attacker.',
        texture: 'slime',
        frame: 10,
        rarity: 'Uncommon',
        hp: 60,
        baseDamage: 6
    },
    {
        id: 'wisp_1',
        name: 'Ember Wisp',
        description: 'A floating head engulfed in eternal flames. It casts "Burn" upon contact, dealing small but continuous Fire damage over time.',
        texture: 'wisp',
        frame: 0,
        rarity: 'Common',
        hp: 25,
        baseDamage: 10
    },
    {
        id: 'wisp_2',
        name: 'Necro Wisp',
        description: 'A blazing torso with fiery arms. It uses its intense heat to manipulate the bones of the dead, capable of "Reviving" fallen skeletons as allies.',
        texture: 'wisp',
        frame: 10,
        rarity: 'Rare',
        hp: 80,
        baseDamage: 18
    },
    {
        id: 'golem_1',
        name: 'Moss Golem',
        description: 'An animated rock construct overgrown with ancient foliage. It possesses immense health and occasionally "Stuns" with heavy, earth-shattering slams.',
        texture: 'golem',
        frame: 0,
        rarity: 'Uncommon',
        hp: 120,
        baseDamage: 15
    },
    {
        id: 'golem_2',
        name: 'Runic Golem',
        description: 'A volatile construct seeping arcane energy, oddly wearing a cowboy hat. Highly unstable, its attacks can "Silence" your ability to use specific Runes.',
        texture: 'golem',
        frame: 10,
        rarity: 'Rare',
        hp: 200,
        baseDamage: 22
    }
];

export class BestiaryData {
    private static instance: BestiaryData;
    private discoveredEntities: Set<string> = new Set();

    private constructor() {
        // Unlock 3 random entities for debugging
        const ids = BESTIARY.map(e => e.id);
        for (let i = ids.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [ids[i], ids[j]] = [ids[j], ids[i]];
        }
        this.discoveredEntities.add(ids[0]);
        this.discoveredEntities.add(ids[1]);
        this.discoveredEntities.add(ids[2]);
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

    public discoverEntity(id: string) {
        this.discoveredEntities.add(id);
    }

    public getDiscoveredCount(): number {
        return this.discoveredEntities.size;
    }
}
