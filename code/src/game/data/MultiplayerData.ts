export class MultiplayerData {
    rooms: RoomData[] = [];

    static instance: MultiplayerData;

    static getInstance(): MultiplayerData {
        if (!MultiplayerData.instance) {
            MultiplayerData.instance = new MultiplayerData();
        }
        return MultiplayerData.instance;
    }
    
    addRoom(room: RoomData): void {
        this.rooms.push(room);
    }

    getRooms(): RoomData[] {
        return this.rooms;
    }

    removeRoom(room: RoomData): void {
        this.rooms = this.rooms.filter(r => r !== room);
    }
}

export class RoomData {
    title: string = this.generateRandomName();
    maxPlayers: number = 3;
    isPrivate: boolean = false;
    ownerId: number = -1;
    private static instance: RoomData;
    
    static getInstance(): RoomData {
        if (!RoomData.instance) {
            RoomData.instance = new RoomData();
        }
        return RoomData.instance;
    }

    setMaxPlayers(num: number): void {
        this.maxPlayers = num;
    }

    setIsPrivate(isPrivate: boolean): void {
        this.isPrivate = isPrivate;
    }

    setOwnerId(ownerId: number): void {
        this.ownerId = ownerId;
    }

    private generateRandomName(): string {
        const firstWord: string[] = ['Shadow', 'Rune', 'Void', 'Echo', 'Ash', 'Coil', 'Crown', 'Ember', 'Babel', 'Glossary', 'Silhouette', 'Fractured', 'Unnamed', 'Hollow', 'Wisp', 'Monolith', 'Sigil', 'Glyph', 'Cipher', 'Shade', 'Abyss', 'Flame', 'Stone', 'Tower', 'Summit'];
        const secondWord: string[] = ['Ascension', 'Covenant', 'Recursion', 'Dominance', 'Sacrifice', 'Godhood', 'Meaning', 'Identity', 'Symbol', 'Translation', 'Knowledge', 'Reality', 'Forgotten', 'Unwritten', 'Destabilized', 'Glitched', 'Echoes', 'Splinter', 'Relic', 'Sanctum', 'Labyrinth', 'Pilgrim', 'Hollow', 'Remnant', 'Awakening'];
        return firstWord[Math.floor(Math.random() * firstWord.length)] + ' ' + secondWord[Math.floor(Math.random() * secondWord.length)];
    }
}
