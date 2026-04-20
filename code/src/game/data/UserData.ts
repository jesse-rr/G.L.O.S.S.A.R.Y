export interface AchievementData {
    id: string;
    unlocked: boolean;
}

class Settings {
    volume: number = 50;
    vsync: boolean = true;
    particles: boolean = true;
    screenShake: boolean = true;
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
    completedGame: boolean = false;
    settings: Settings = new Settings();

    private static instance: UserData;

    static getInstance(): UserData {
        if (!UserData.instance) {
            const instance = new UserData();
            instance.load();

            const handler = {
                get(obj: any, prop: any): any {
                    const val = obj[prop];
                    if (typeof val === 'object' && val !== null) {
                        return new Proxy(val, handler);
                    }
                    if (typeof val === 'function') {
                        return function (...args: any[]) {
                            const res = val.apply(obj, args);
                            if (typeof prop === 'string' && !['save', 'load', 'loadFromJSON', 'toJSON'].includes(prop)) {
                                obj.save?.() ?? instance.save();
                            }
                            return res;
                        };
                    }
                    return val;
                },
                set(obj: any, prop: any, val: any): boolean {
                    obj[prop] = val;
                    instance.save();
                    return true;
                }
            };

            UserData.instance = new Proxy(instance, handler) as UserData;
        }
        return UserData.instance;
    }

    updateSettings(settings: Settings): void {
        this.settings = settings;
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
        if (this.covenantsDiscovered.length === 3) {
            this.unlockAchievement('ritualist');
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
            completedGame: this.completedGame,
            settings: this.settings
        };
    }

    loadFromJSON(data: any): void {
        if (data.achievements) this.achievements = data.achievements;
        if (data.itemsDiscovered) this.itemsDiscovered = data.itemsDiscovered;
        if (data.runesDiscovered) this.runesDiscovered = data.runesDiscovered;
        if (data.covenantsDiscovered) this.covenantsDiscovered = data.covenantsDiscovered;
        if (data.deaths !== undefined) this.deaths = data.deaths;
        if (data.wins !== undefined) this.wins = data.wins;
        if (data.completedGame !== undefined) this.completedGame = data.completedGame;
        if (data.settings) this.settings = data.settings;
    }

    save(): void {
        localStorage.setItem('glossary_user_data', JSON.stringify(this.toJSON()));
    }

    load(): void {
        const data = localStorage.getItem('glossary_user_data');
        if (data) {
            try {
                this.loadFromJSON(JSON.parse(data));
            } catch (e) {
                console.error("Failed to load user data", e);
            }
        }
    }
}
