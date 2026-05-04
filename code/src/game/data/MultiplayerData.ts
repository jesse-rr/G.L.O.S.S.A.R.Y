import { ROOM_FIRST_WORDS, ROOM_SECOND_WORDS } from '../constants';

export class MultiplayerData {
    rooms: RoomData[] = [];
    myRoom: RoomData | null = null;
    joinedRoom: RoomData | null = null;
    sharedRunes: string[] = [];

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

    generateSharedRunes(allDefinitions: any[]): void {
        this.sharedRunes = [];
        this.sharedRunes.push('A');

        const pool = allDefinitions.filter(r => r.letter !== 'A' && r.letter !== 'I' && r.letter !== 'E' && r.letter !== 'P' && r.letter !== 'Z').map(r => r.letter);
        const shuffled = pool.sort(() => 0.5 - Math.random());
        this.sharedRunes.push(...shuffled.slice(0, 5));
    }
}

export class RoomData {
    title: string = this.generateRandomName();
    maxPlayers: number = 3;
    currentPlayers: number = 1;
    isPrivate: boolean = true;
    passcode: string = this.generatePasscode();
    ownerId: number = -1;

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
        return ROOM_FIRST_WORDS[Math.floor(Math.random() * ROOM_FIRST_WORDS.length)] + ' ' + ROOM_SECOND_WORDS[Math.floor(Math.random() * ROOM_SECOND_WORDS.length)];
    }

    private generatePasscode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
        return code;
    }
}
