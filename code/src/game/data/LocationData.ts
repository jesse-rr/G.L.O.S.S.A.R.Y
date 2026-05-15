export interface LocationDefinition {
    id: string;
    name: string;
    type: 'settlement' | 'boss' | 'hub';
    description: string;
    frame: number;
    texture?: string;
}

export const SETTLEMENTS: LocationDefinition[] = [
    {
        id: 'settlement_abandoned',
        name: 'Abandoned Settlement',
        type: 'settlement',
        description: 'A drowned ruin sinking into the muck. Murky waters hide what lurks beneath.',
        frame: 0
    },
    {
        id: 'settlement_mechanic',
        name: 'Mechanic Settlement',
        type: 'settlement',
        description: 'An industrial hub built on grinding gears and hissing steam vents. It never sleeps.',
        frame: 1
    },
    {
        id: 'settlement_desert',
        name: 'Desert Settlement',
        type: 'settlement',
        description: 'An oasis of life surrounded by endless dunes. Trade flows as freely as the sand.',
        frame: 2
    }
];

export const BOSSES: LocationDefinition[] = [
    {
        id: 'boss_abandoned',
        name: 'The Usurper',
        type: 'boss',
        description: 'A swollen abomination reigning over a drowned court. It drags victims into the suffocating mire.',
        frame: 2
    },
    {
        id: 'boss_mechanic',
        name: 'The Machine God',
        type: 'boss',
        description: 'A towering construct of brass and oil. It seeks to optimize everything into scrap.',
        frame: 0
    },
    {
        id: 'boss_desert',
        name: 'The Sand Leviathan',
        type: 'boss',
        description: 'An ancient terror that swims through the dunes as if they were water. It consumes all.',
        frame: 1
    }
];

export const HUBS: LocationDefinition[] = [
    {
        id: 'central_hub',
        name: 'Central Hub',
        type: 'hub',
        description: 'The crossroads of all covenants. Every path begins and ends here.',
        frame: 0,
        texture: 'map-central-hub'
    },
    {
        id: 'summit_trade',
        name: 'Trade Hub',
        type: 'hub',
        description: 'A summit where merchants gather. Runes and relics exchange hands under watchful eyes.',
        frame: 0,
        texture: 'map-trade-hub'
    }
];

export class LocationData {
    private static instance: LocationData;
    private discoveredLocations: Set<string> = new Set();
    private viewedLocations: Set<string> = new Set();

    private constructor() {
        this.load();
        if (this.discoveredLocations.size === 0) {
            const settlements = ['settlement_abandoned', 'settlement_mechanic', 'settlement_desert'];
            const randomIndex = Math.floor(Math.random() * settlements.length);
            const chosenSettlement = settlements[randomIndex];
            const chosenBoss = chosenSettlement.replace('settlement', 'boss');
            this.discoveredLocations.add(chosenSettlement);
            this.discoveredLocations.add(chosenBoss);
            this.save();
        }
    }

    public static getInstance(): LocationData {
        if (!LocationData.instance) {
            LocationData.instance = new LocationData();
        }
        return LocationData.instance;
    }

    public isDiscovered(id: string): boolean {
        return this.discoveredLocations.has(id);
    }

    public discoverLocation(id: string): void {
        if (this.discoveredLocations.has(id)) return;
        this.discoveredLocations.add(id);
        this.save();
    }

    public isViewed(id: string): boolean {
        return this.viewedLocations.has(id);
    }

    public markViewed(id: string): void {
        if (this.viewedLocations.has(id)) return;
        this.viewedLocations.add(id);
        this.save();
    }

    public getDiscoveredLocations(): string[] {
        return Array.from(this.discoveredLocations);
    }

    public save(): void {
        localStorage.setItem('locations_discovered', JSON.stringify(Array.from(this.discoveredLocations)));
        localStorage.setItem('locations_viewed', JSON.stringify(Array.from(this.viewedLocations)));
    }

    public load(): void {
        const discoveredData = localStorage.getItem('locations_discovered');
        if (discoveredData) {
            try {
                const arr = JSON.parse(discoveredData) as string[];
                this.discoveredLocations = new Set(arr);
            } catch {
                this.discoveredLocations = new Set();
            }
        }

        const viewedData = localStorage.getItem('locations_viewed');
        if (viewedData) {
            try {
                const arr = JSON.parse(viewedData) as string[];
                this.viewedLocations = new Set(arr);
            } catch {
                this.viewedLocations = new Set();
            }
        }
    }

    public reset(): void {
        this.discoveredLocations.clear();
        this.viewedLocations.clear();
        this.save();
    }
}