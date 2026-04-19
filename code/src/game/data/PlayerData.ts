export type CovenantType = 'dragon' | 'phoenix' | 'ouroborus';

export interface ItemData {
    id: string;
    quantity: number;
}

export interface RuneData {
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
    runes: RuneData[] = [];

    private static instance: PlayerData;

    static getInstance(): PlayerData {
        if (!PlayerData.instance) {
            PlayerData.instance = new PlayerData();
        }
        return PlayerData.instance;
    }

    setCovenantData(covenant: CovenantType, specialCurrency: number = 0): void {
        this.covenant = covenant;
        this.specialCurrency = specialCurrency;
        this.hp = this.maxHp;
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
}
