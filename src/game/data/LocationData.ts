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
        description: 'An water filled swampy place. \nIts abandoned, yet nature lives here.',
        frame: 0
    },
    {
        id: 'settlement_mechanic',
        name: 'Mechanic Settlement',
        type: 'settlement',
        description: 'An industrial hub built on grinding gears and chains. \nIt never sleeps even tho there is noone to see.',
        frame: 1
    },
    {
        id: 'settlement_desert',
        name: 'Desert Settlement',
        type: 'settlement',
        description: 'An old now abadoned sand filled place, no people, all doors closed. \nYet, it remains.',
        frame: 2
    }
];

export const BOSSES: LocationDefinition[] = [
    {
        id: 'boss_abandoned',
        name: 'Trial of the Drowned',
        type: 'boss',
        description: 'An forgotten place, no beast awaits, only the weight of the waters and its sounds.',
        frame: 2
    },
    {
        id: 'boss_mechanic',
        name: 'Trial of the Gears',
        type: 'boss',
        description: 'An ancient proving mechanic island of. \nThe machine judges your worth.',
        frame: 0
    },
    {
        id: 'boss_desert',
        name: 'Trial of the Sands',
        type: 'boss',
        description: 'A circular arena swallowed by dunes. \nThe desert itself rises to challenge the unworthy.',
        frame: 1
    }
];

export const HUBS: LocationDefinition[] = [
    {
        id: 'central_hub',
        name: 'Central Hub',
        type: 'hub',
        description: 'The crossroads of all covenants. \nEvery path begins and ends here.',
        frame: 0,
        texture: 'map-central-hub'
    },
    {
        id: 'summit_trade',
        name: 'Trade Hub',
        type: 'hub',
        description: 'A place where Runes exchange hands for a price.',
        frame: 0,
        texture: 'map-trade-hub'
    },
    {
        id: 'merchant',
        name: 'Merchant Base',
        type: 'hub',
        description: 'A hidden interdimentional merchant outpost nestled in the settlements. \nRare goods await.',
        frame: 0,
        texture: "map-merchant"
    },
    {
        id: 'summit',
        name: 'Summit',
        type: 'hub',
        description: 'The origin of all things. The Glossary pulses at its core, channeling the towers \nunfathomable power.',
        frame: 0,
        texture: "map-summit"
    }
];

const LOCATION_IDS = new Set([...SETTLEMENTS, ...BOSSES, ...HUBS].map(location => location.id));

export class LocationData {
    private static instance: LocationData;
    private discoveredLocations: Set<string> = new Set();
    private viewedLocations: Set<string> = new Set();

    private constructor() {
        this.load();
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
        if (!LOCATION_IDS.has(id)) return;
        if (this.discoveredLocations.has(id)) return;
        this.discoveredLocations.add(id);
        this.save();
    }

    public isViewed(id: string): boolean {
        return this.viewedLocations.has(id);
    }

    public markViewed(id: string): void {
        if (!LOCATION_IDS.has(id)) return;
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
                this.discoveredLocations = new Set(arr.filter(id => typeof id === 'string' && LOCATION_IDS.has(id)));
            } catch {
                this.discoveredLocations = new Set();
            }
        }

        const viewedData = localStorage.getItem('locations_viewed');
        if (viewedData) {
            try {
                const arr = JSON.parse(viewedData) as string[];
                this.viewedLocations = new Set(arr.filter(id => typeof id === 'string' && LOCATION_IDS.has(id)));
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
