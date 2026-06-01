export type ItemRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export interface ItemDefinition {
    id: number;
    name: string;
    ability: string;
    effectDescription: string;
    lore: string;
    cost: number;
    rarity: ItemRarity;
}

const ITEMS: ItemDefinition[] = [
    {
        id: 0,
        name: "Namaste",
        ability: "Inner Peace",
        effectDescription: "Gain +2 Defense and +1 Special Covenant Currency at the start of combat.",
        lore: "A string of ancient monk beads. They vibrate with a bizarrely calm energy, whispering 'chill bro' into the mind of the holder.",
        cost: 100,
        rarity: 'Common'
    },
    {
        id: 1,
        name: "Runefall",
        ability: "Thunder Strike",
        effectDescription: "Adds a 50% chance to cast a secondary Lightning Rune on every base attack. +9",
        lore: "A suspiciously familiar miniature hammer. Legend says it was wielded by a god of thunder who really hated frost giants.",
        cost: 300,
        rarity: 'Epic'
    },
    {
        id: 2,
        name: "Seraph's Plume",
        ability: "Rebirth",
        effectDescription: "Upon taking fatal damage, instantly revive with 30% HP. Consumed on use.",
        lore: "An enchanted feather plucked from a dying phoenix. It still burns with the warmth of a thousand suns, refusing to extinguish.",
        cost: 450,
        rarity: 'Legendary'
    },
    {
        id: 3,
        name: "Echojar of The Damned",
        ability: "Soul Siphon",
        effectDescription: "Gain 1 Base Power for every enemy defeated during the current run.",
        lore: "A sealed jar filled with screaming souls. If you put your ear to the glass, you can hear them arguing about rent prices in the underworld.",
        cost: 350,
        rarity: 'Rare'
    },
    {
        id: 4,
        name: "Reversed Scale",
        ability: "Deflection",
        effectDescription: "Reflects 50% of the first instance of damage taken in combat back to the attacker.",
        lore: "A golden scale of judgment that has been completely inverted. Instead of weighing guilt, it weighs retribution, punishing those who strike first.",
        cost: 200,
        rarity: 'Epic'
    },
    {
        id: 5,
        name: "404: Not Found",
        ability: "Evasion",
        effectDescription: "Grants a flat 10% chance to completely dodge any incoming attack.",
        lore: "A map depicting a realm that simply does not exist. Looking at it too long makes you feel like you've misplaced your own coordinates.",
        cost: 150,
        rarity: 'Rare'
    },
    {
        id: 6,
        name: "Schizostone",
        ability: "Mad Whispers",
        effectDescription: "Grants a random permanent buff (+2 DMG, +2 DEF, or +2 HEAL) at the start of combat.",
        lore: "A rock that talks incessantly. It claims to have created the universe but currently resides in your pocket. It refuses to pay rent.",
        cost: 250,
        rarity: 'Mythic'
    },
    {
        id: 7,
        name: "The Archive",
        ability: "Wildcard",
        effectDescription: "Increases all resolved combo bonus power by 50%.",
        lore: "A mystical deck of cards containing the sum of all possibilities. Drawing the wrong card might turn your hair blue, but it's worth the risk.",
        cost: 400,
        rarity: 'Legendary'
    },
    {
        id: 8,
        name: "Second Amendment",
        ability: "Freedom Dispenser",
        effectDescription: "Permanently boosts your damage dealt by 25%, but you take 25% more damage from all sources.",
        lore: "A strange, metallic wand that fires tiny lead projectiles at deafening speeds. Its original creators believed it solved literally every problem.",
        cost: 550,
        rarity: 'Mythic'
    },
    {
        id: 9,
        name: "Fog of War",
        ability: "Absolute Swag",
        effectDescription: "Enemies have a 5% chance to skip their turn in sheer awe of your presence.",
        lore: "A lit cigar paired with pixelated black glasses. Wearing them grants unparalleled confidence and an irresistible urge to drop the bass.",
        cost: 370,
        rarity: 'Epic'
    },
    {
        id: 10,
        name: "Broken Crown",
        ability: "Ruined King",
        effectDescription: "Convert 10% of all damage dealt into healing.",
        lore: "The shattered crown of a mad king who lost everything for love. It still seeps with a corrupting, sorrowful mist.",
        cost: 500,
        rarity: 'Legendary'
    },
    {
        id: 11,
        name: "VoidFrame",
        ability: "Event Horizon",
        effectDescription: "Nullifies the first negative status effect applied to you at the start of each turn.",
        lore: "A picture frame holding a literal black hole. It slowly consumes any dust in the room, making it an incredibly dangerous, yet effective, vacuum cleaner.",
        cost: 330,
        rarity: 'Rare'
    }
];

const ITEM_IDS = new Set(ITEMS.map(item => item.id));

export class ItemData {
    private static instance: ItemData;
    private discoveredItems: Set<number> = new Set();
    private viewedItems: Set<number> = new Set();

    private constructor() {
        this.load();
    }

    public static getInstance(): ItemData {
        if (!ItemData.instance) {
            ItemData.instance = new ItemData();
        }
        return ItemData.instance;
    }

    public static getAllItems(): ItemDefinition[] {
        return ITEMS;
    }

    public static getItem(id: number): ItemDefinition | undefined {
        return ITEMS.find(item => item.id === id);
    }

    public isDiscovered(id: number): boolean {
        return this.discoveredItems.has(id);
    }

    public discoverItem(id: number): void {
        if (!ITEM_IDS.has(id)) return;
        if (this.discoveredItems.has(id)) return;
        this.discoveredItems.add(id);
        this.save();
    }

    public isViewed(id: number): boolean {
        return this.viewedItems.has(id);
    }

    public markViewed(id: number): void {
        if (!ITEM_IDS.has(id)) return;
        if (this.viewedItems.has(id)) return;
        this.viewedItems.add(id);
        this.save();
    }

    public static getItemFrame(id: number): number {
        return id;
    }

    public getDiscoveredItems(): number[] {
        return Array.from(this.discoveredItems);
    }

    public save(): void {
        localStorage.setItem('items_discovered', JSON.stringify(Array.from(this.discoveredItems)));
        localStorage.setItem('items_viewed', JSON.stringify(Array.from(this.viewedItems)));
    }

    public load(): void {
        const discoveredData = localStorage.getItem('items_discovered');

        if (discoveredData) {
            try {
                const arr = JSON.parse(discoveredData) as number[];
                this.discoveredItems = new Set(arr.filter(id => typeof id === 'number' && ITEM_IDS.has(id)));
            } catch {
                this.discoveredItems = new Set();
            }
        }

        const viewedData = localStorage.getItem('items_viewed');

        if (viewedData) {
            try {
                const arr = JSON.parse(viewedData) as number[];
                this.viewedItems = new Set(arr.filter(id => typeof id === 'number' && ITEM_IDS.has(id)));
            } catch {
                this.viewedItems = new Set();
            }
        }
    }

    public reset(): void {
        this.discoveredItems.clear();
        this.viewedItems.clear();
        this.save();
    }
}
