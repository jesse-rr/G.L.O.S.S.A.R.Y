export type CovenantType = 'dragon' | 'phoenix' | 'snake';

export interface ItemData {
    id: string;
    quantity: number;
}

export interface PlayerRuneEntry {
    id: string;
    quantity: number;
}

export class PlayerData {
    covenant: CovenantType = 'phoenix';
    gemstones: number = 0;
    specialCurrency: number = 0;
    hp: number = 100;
    maxHp: number = 100;
    items: ItemData[] = [];
    runes: PlayerRuneEntry[] = [];

    private static instance: PlayerData;

    static getInstance(): PlayerData {
        if (!PlayerData.instance) {
            const instance = new PlayerData();
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

            PlayerData.instance = new Proxy(instance, handler) as PlayerData;
        }
        return PlayerData.instance;
    }

    setCovenantData(covenant: CovenantType): void {
        this.covenant = covenant;
    }

    updateSpecialCurrency(quantity: number): void {
        this.specialCurrency += quantity;
    }

    addItem(itemId: string, quantity: number = 1): void {
        const item = this.items.find(i => i.id === itemId);
        if (item) {
            item.quantity += quantity;
        } else {
            this.items.push({ id: itemId, quantity });
        }
    }

    removeItem(itemId: string, quantity: number = 1): boolean {
        const item = this.items.find(i => i.id === itemId);
        if (item && item.quantity >= quantity) {
            item.quantity -= quantity;
            if (item.quantity === 0) {
                this.items = this.items.filter(i => i.id !== itemId);
            }
            return true;
        }
        return false;
    }

    getItemQuantity(itemId: string): number {
        return this.items.find(i => i.id === itemId)?.quantity ?? 0;
    }

    addRune(runeId: string, quantity: number = 1): void {
        const rune = this.runes.find(r => r.id === runeId);
        if (rune) {
            rune.quantity += quantity;
        } else {
            this.runes.push({ id: runeId, quantity });
        }
    }

    removeRune(runeId: string, quantity: number = 1): boolean {
        const rune = this.runes.find(r => r.id === runeId);
        if (rune && rune.quantity >= quantity) {
            rune.quantity -= quantity;
            if (rune.quantity === 0) {
                this.runes = this.runes.filter(r => r.id !== runeId);
            }
            return true;
        }
        return false;
    }

    getRuneQuantity(runeId: string): number {
        return this.runes.find(r => r.id === runeId)?.quantity ?? 0;
    }

    takeDamage(damage: number): void {
        this.hp = Math.max(0, this.hp - damage);
    }

    heal(amount: number): void {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    reset(): void {
        this.covenant = 'phoenix';
        this.gemstones = 0;
        this.specialCurrency = 0;
        this.hp = this.maxHp;
        this.items = [];
        this.runes = [];
    }
    toJSON(): object {
        return {
            covenant: this.covenant,
            gemstones: this.gemstones,
            specialCurrency: this.specialCurrency,
            hp: this.hp,
            maxHp: this.maxHp,
            items: this.items,
            runes: this.runes
        };
    }

    loadFromJSON(data: any): void {
        if (data.covenant) this.covenant = data.covenant;
        if (data.gemstones !== undefined) this.gemstones = data.gemstones;
        if (data.specialCurrency !== undefined) this.specialCurrency = data.specialCurrency;
        if (data.hp !== undefined) this.hp = data.hp;
        if (data.maxHp !== undefined) this.maxHp = data.maxHp;
        if (data.items) this.items = data.items;
        if (data.runes) this.runes = data.runes;
    }

    save(): void {
        localStorage.setItem('glossary_player_data', JSON.stringify(this.toJSON()));
    }

    load(): void {
        const data = localStorage.getItem('glossary_player_data');
        if (data) {
            try {
                this.loadFromJSON(JSON.parse(data));
            } catch (e) {
                console.error("Failed to load player data", e);
            }
        }
    }
}
