export interface AchievementData {
    id: string;
    unlocked: boolean;
}

export class UserData {
    achievements: AchievementData[] = [
        { id: 'completionist', unlocked: false },
        { id: 'greedy', unlocked: false },
        { id: 'ritualist', unlocked: false },
        { id: 'cat_whisperer', unlocked: false },
        { id: 'champion', unlocked: false },
        { id: 'bum', unlocked: false }
    ];

    itemsDiscovered: string[] = [];
    runesDiscovered: string[] = [];
    covenantsDiscovered: string[] = [];

    deaths: number = 0;
    wins: number = 0;

    catModeFound: boolean = false;
    completedGame: boolean = false;

    private static instance: UserData;

    static getInstance(): UserData {
        if (!UserData.instance) {
            UserData.instance = new UserData();
        }
        return UserData.instance;
    }

    unlockAchievement(id: string): void {
        const achievement = this.achievements.find(a => a.id === id);
        if (achievement) {
            achievement.unlocked = true;
        }
    }

    isAchievementUnlocked(id: string): boolean {
        const achievement = this.achievements.find(a => a.id === id);
        return achievement?.unlocked ?? false;
    }

    discoverItem(item: string): void {
        if (!this.itemsDiscovered.includes(item)) {
            this.itemsDiscovered.push(item);
        }
    }

    discoverRune(rune: string): void {
        if (!this.runesDiscovered.includes(rune)) {
            this.runesDiscovered.push(rune);
        }
    }

    discoverCovenant(covenant: string): void {
        if (this.covenantsDiscovered.length < 3 && !this.covenantsDiscovered.includes(covenant)) {
            this.covenantsDiscovered.push(covenant);
        }
    }

    addDeath(): void {
        this.deaths++;
    }

    addWin(): void {
        this.wins++;
    }

    toJSON(): object {
        return {
            achievements: this.achievements,
            itemsDiscovered: this.itemsDiscovered,
            runesDiscovered: this.runesDiscovered,
            covenantsDiscovered: this.covenantsDiscovered,
            deaths: this.deaths,
            wins: this.wins,
            catModeFound: this.catModeFound,
            completedGame: this.completedGame
        };
    }

    loadFromJSON(data: any): void {
        if (data.achievements) this.achievements = data.achievements;
        if (data.itemsDiscovered) this.itemsDiscovered = data.itemsDiscovered;
        if (data.runesDiscovered) this.runesDiscovered = data.runesDiscovered;
        if (data.covenantsDiscovered) this.covenantsDiscovered = data.covenantsDiscovered;
        if (data.deaths !== undefined) this.deaths = data.deaths;
        if (data.wins !== undefined) this.wins = data.wins;
        if (data.catModeFound !== undefined) this.catModeFound = data.catModeFound;
        if (data.completedGame !== undefined) this.completedGame = data.completedGame;
    }
}
