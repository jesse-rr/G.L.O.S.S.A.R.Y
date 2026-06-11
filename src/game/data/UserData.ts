import { EventBus, GameEvents } from '../EventBus';
import { BestiaryData, BESTIARY } from './BestiaryData';
import { ItemData } from './ItemData';
import { LocationData, BOSSES, HUBS, SETTLEMENTS } from './LocationData';
import { RuneData } from './RuneData';

const VALID_COVENANTS = new Set(['dragon', 'phoenix', 'snake']);

export interface AchievementData {
    id: string;
    unlocked: boolean;
}

class Settings {
    volume: number = 50;
    vsync: boolean = true;
    lightSystem: boolean = true;
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
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            EventBus.emit(GameEvents.SHOW_NOTIFICATION, `Achievement Unlocked: ${id.replace('_', ' ').toUpperCase()}`);
        }
    }

    isAchievementUnlocked(id: string): boolean {
        const achievement = this.achievements.find(a => a.id === id);
        return achievement?.unlocked ?? false;
    }

    discoverItem(item: string): void {
        if (!ItemData.getAllItems().some(def => def.name === item)) return;
        if (!this.itemsDiscovered.includes(item)) {
            this.itemsDiscovered.push(item);
            this.checkGreedy();
            this.checkCompletionist();
        }
    }

    discoverRune(rune: string): void {
        const upper = rune.toUpperCase();
        if (!RuneData.getDefinition(upper)) return;
        if (!this.runesDiscovered.includes(upper)) {
            this.runesDiscovered.push(upper);
            this.checkGreedy();
            this.checkCompletionist();
        }
    }

    discoverCovenant(covenant: string): void {
        if (!VALID_COVENANTS.has(covenant)) return;
        if (!this.covenantsDiscovered.includes(covenant)) {
            this.covenantsDiscovered.push(covenant);
        }
        if (this.covenantsDiscovered.length >= 3) {
            this.unlockAchievement('ritualist');
        }
        this.checkCompletionist();
    }

    addDeath(): void {
        this.deaths++;
        this.unlockAchievement('bum');
    }

    addWin(): void {
        this.wins++;
        this.completedGame = true;
        this.unlockAchievement('champion');
        this.checkCompletionist();
    }

    checkCompletionist(): void {
        if (!this.completedGame) return;

        if (this.itemsDiscovered.length < ItemData.getAllItems().length) return;

        if (this.runesDiscovered.length < RuneData.getAllDefinitions().length) return;

        if (BestiaryData.getInstance().getDiscoveredCount() < BESTIARY.length) return;

        const locationData = LocationData.getInstance();
        const totalLocations = SETTLEMENTS.length + BOSSES.length + HUBS.length;
        if (locationData.getDiscoveredLocations().length < totalLocations) return;

        if (this.covenantsDiscovered.length < VALID_COVENANTS.size) return;

        this.unlockAchievement('completionist');
    }

    private checkGreedy(): void {
        if (this.itemsDiscovered.length < ItemData.getAllItems().length) return;
        if (this.runesDiscovered.length < RuneData.getAllDefinitions().length) return;

        this.unlockAchievement('greedy');
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
        if (data.achievements) {
            const loadedAchievements = new Map<string, boolean>(
                data.achievements
                    .filter((achievement: any) => typeof achievement?.id === 'string')
                    .map((achievement: AchievementData): [string, boolean] => [achievement.id, Boolean(achievement.unlocked)])
            );
            this.achievements = this.achievements.map(achievement => ({
                ...achievement,
                unlocked: loadedAchievements.get(achievement.id) ?? achievement.unlocked
            }));
        }
        if (data.itemsDiscovered) {
            const validItemNames = new Set(ItemData.getAllItems().map(item => item.name));
            this.itemsDiscovered = data.itemsDiscovered.filter((item: unknown) => typeof item === 'string' && validItemNames.has(item));
        }
        if (data.runesDiscovered) {
            this.runesDiscovered = Array.from(new Set(
                data.runesDiscovered
                    .filter((rune: unknown): rune is string => typeof rune === 'string')
                    .map((rune: string) => rune.toUpperCase())
                    .filter((rune: string) => RuneData.getDefinition(rune))
            ));
        }
        if (data.covenantsDiscovered) {
            this.covenantsDiscovered = data.covenantsDiscovered.filter((covenant: unknown) => (
                typeof covenant === 'string' && VALID_COVENANTS.has(covenant)
            ));
        }
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
