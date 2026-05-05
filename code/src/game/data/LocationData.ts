export interface LocationDefinition {
    id: string;
    name: string;
    type: 'settlement' | 'boss';
    description: string;
    frame: number;
}

export const SETTLEMENTS: LocationDefinition[] = [
    {
        id: 'settlement_abandoned',
        name: 'Abandoned Settlement',
        type: 'settlement',
        description: 'A drowned ruin slowly sinking into the muck. Murky waters hide whatever still lurks beneath the surface.',
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
        description: 'A swollen abomination reigning over a drowned court. It drags its victims into the suffocating mire.',
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

export class LocationData {
    private static instance: LocationData;
    private discoveredLocations: Set<string> = new Set();
    private viewedLocations: Set<string> = new Set();

    private constructor() {
        const settlements = ['settlement_abandoned', 'settlement_mechanic', 'settlement_desert'];
        const bosses = ['boss_abandoned', 'boss_mechanic', 'boss_desert'];

        for (let i = settlements.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [settlements[i], settlements[j]] = [settlements[j], settlements[i]];
        }
        for (let i = bosses.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [bosses[i], bosses[j]] = [bosses[j], bosses[i]];
        }

        this.discoveredLocations.add(settlements[0]);
        this.discoveredLocations.add(bosses[0]);
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
        this.discoveredLocations.add(id);
    }

    public isViewed(id: string): boolean {
        return this.viewedLocations.has(id);
    }

    public markViewed(id: string): void {
        this.viewedLocations.add(id);
    }
}
