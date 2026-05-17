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
    hubDoorOpened: boolean = false;
    private static instance: PlayerData | null = null;

    static getInstance(): PlayerData {
        if (!PlayerData.instance) {
            const instance = new PlayerData();
            instance.load();
            PlayerData.instance = instance;
        }
        return PlayerData.instance;
    }

    static resetInstance(): void {
        PlayerData.instance = null;
    }

    setCovenantData(covenant: CovenantType): void {
        this.covenant = covenant;
        this.save();
    }

    updateSpecialCurrency(quantity: number): void {
        this.specialCurrency += quantity;
        this.save();
    }

    addItem(itemId: string, quantity: number = 1): void {
        const item = this.items.find(i => i.id === itemId);
        if (item) {
            item.quantity += quantity;
        } else {
            this.items.push({ id: itemId, quantity });
        }
        this.save();
    }

    removeItem(itemId: string, quantity: number = 1): boolean {
        const item = this.items.find(i => i.id === itemId);
        if (item && item.quantity >= quantity) {
            item.quantity -= quantity;
            if (item.quantity === 0) {
                this.items = this.items.filter(i => i.id !== itemId);
            }
            this.save();
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
        this.save();
    }

    removeRune(runeId: string, quantity: number = 1): boolean {
        const rune = this.runes.find(r => r.id === runeId);
        if (rune && rune.quantity >= quantity) {
            rune.quantity -= quantity;
            if (rune.quantity === 0) {
                this.runes = this.runes.filter(r => r.id !== runeId);
            }
            this.save();
            return true;
        }
        return false;
    }

    getRuneQuantity(runeId: string): number {
        return this.runes.find(r => r.id === runeId)?.quantity ?? 0;
    }

    getRunes(): PlayerRuneEntry[] {
        return this.runes;
    }

    takeDamage(damage: number): void {
        this.hp = Math.max(0, this.hp - damage);
        this.save();
    }

    heal(amount: number): void {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        this.save();
    }

    reset(): void {
        this.covenant = 'phoenix';
        this.gemstones = 0;
        this.specialCurrency = 0;
        this.hp = this.maxHp;
        this.items = [];
        this.runes = [];
        this.hubDoorOpened = false;
        this.save();
    }

    toJSON(): object {
        return {
            covenant: this.covenant,
            gemstones: this.gemstones,
            specialCurrency: this.specialCurrency,
            hp: this.hp,
            maxHp: this.maxHp,
            items: this.items,
            runes: this.runes,
            hubDoorOpened: this.hubDoorOpened
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
        if (data.hubDoorOpened !== undefined) this.hubDoorOpened = data.hubDoorOpened;
    }

    save(): void {
        const data = this.toJSON();
        localStorage.setItem('glossary_player_data', JSON.stringify(data));
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

    forceReload(): void {
        this.load();
    }
}