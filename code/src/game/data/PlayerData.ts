export type CovenantType = 'dragon' | 'phoenix' | 'snake';

export interface ItemData {
    id: string;
    quantity: number;
}

export interface PlayerRuneEntry {
    id: string;
    quantity: number;
}

export interface ActiveBuff {
    id: string;
    name: string;
    desc: string;
    frame: number;
    duration: number; // -1 for permanent, otherwise number of turns
}

export class PlayerData {
    covenant: CovenantType = 'phoenix';
    gemstones: number = 0;
    specialCurrency: number = 0;
    hp: number = 100;
    maxHp: number = 100;
    items: ItemData[] = [];
    runes: PlayerRuneEntry[] = [];
    activeBuffs: ActiveBuff[] = [];
    hubDoorOpened: boolean = false;
    lastMap: string = 'hub';
    lastX: number | null = null;
    lastY: number | null = null;
    inCombat: boolean = false;
    combatEnemyId: string | null = null;
    combatTier: number = 1;
    currentFloor: number = 1;
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

    addBuff(buff: ActiveBuff): void {
        const existing = this.activeBuffs.find(b => b.id === buff.id);
        if (existing) {
            existing.duration = buff.duration === -1 ? -1 : (existing.duration !== -1 ? existing.duration + buff.duration : -1);
            existing.name = buff.name;
            existing.desc = buff.desc;
            existing.frame = buff.frame;
        } else {
            this.activeBuffs.push(buff);
        }
        this.save();
    }

    removeBuff(id: string): void {
        this.activeBuffs = this.activeBuffs.filter(b => b.id !== id);
        this.save();
    }

    decrementBuffs(): void {
        let changed = false;
        this.activeBuffs.forEach(b => {
            if (b.duration > 0) {
                b.duration--;
                changed = true;
            }
        });
        if (this.activeBuffs.some(b => b.duration === 0)) {
            this.activeBuffs = this.activeBuffs.filter(b => b.duration !== 0);
            changed = true;
        }
        if (changed) {
            this.save();
        }
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
        this.activeBuffs = [];
        this.hubDoorOpened = false;
        this.lastMap = 'hub';
        this.lastX = null;
        this.lastY = null;
        this.inCombat = false;
        this.combatEnemyId = null;
        this.combatTier = 1;
        this.currentFloor = 1;
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
            activeBuffs: this.activeBuffs,
            hubDoorOpened: this.hubDoorOpened,
            lastMap: this.lastMap,
            lastX: this.lastX,
            lastY: this.lastY,
            inCombat: this.inCombat,
            combatEnemyId: this.combatEnemyId,
            combatTier: this.combatTier,
            currentFloor: this.currentFloor
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
        if (data.activeBuffs) {
            this.activeBuffs = data.activeBuffs.map((b: any) => {
                if (b.id && b.id.startsWith('trade_') && b.name !== 'Extra Buff') {
                    let val = b.name;
                    if (val === 'EXTRA DAMAGE') val = '+2 Damage';
                    else if (val === 'EXTRA DEFENSE') val = '+2 Defense';
                    else if (val === 'EXTRA HEALING') val = '+2 Healing';
                    else if (val === 'EXTRA BOOST') val = '+1 Boost';
                    else if (val === 'EXTRA POWER') val = '+1 Power';
                    else if (val === 'EXTRA BUFF') val = '+1 Buff';
                    else if (val === 'EXTRA DEBUFF') val = '+1 Debuff';

                    return {
                        ...b,
                        name: 'Extra Buff',
                        desc: `Trade - ${val}`
                    };
                }
                return b;
            });
        }
        if (data.hubDoorOpened !== undefined) this.hubDoorOpened = data.hubDoorOpened;
        if (data.lastMap !== undefined) this.lastMap = data.lastMap;
        if (data.lastX !== undefined) this.lastX = data.lastX;
        if (data.lastY !== undefined) this.lastY = data.lastY;
        if (data.inCombat !== undefined) this.inCombat = data.inCombat;
        if (data.combatEnemyId !== undefined) this.combatEnemyId = data.combatEnemyId;
        if (data.combatTier !== undefined) this.combatTier = data.combatTier;
        if (data.currentFloor !== undefined) this.currentFloor = data.currentFloor;
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