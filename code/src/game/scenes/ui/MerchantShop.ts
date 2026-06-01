import * as Phaser from 'phaser';
import { PlayerData } from '../../data/PlayerData';
import { ItemData, ItemDefinition } from '../../data/ItemData';
import { RuneData, RuneDefinition } from '../../data/RuneData';
import { FONT_FAMILY, InputKeys, RUNE_FONT } from '../../constants';

export class MerchantShop extends Phaser.Scene {
    private bgOverlay!: Phaser.GameObjects.Rectangle;
    private shopContainer!: Phaser.GameObjects.Container;
    private playerGemstonesText!: Phaser.GameObjects.Text;
    private merchantItems: ItemDefinition[] = [];
    private merchantRunes: RuneDefinition[] = [];
    private buyButtons: { btn: Phaser.GameObjects.Rectangle, txt: Phaser.GameObjects.Text, cost: number, item: ItemDefinition }[] = [];
    private runeBuyButtons: { btn: Phaser.GameObjects.Rectangle, txt: Phaser.GameObjects.Text, cost: number, rune: RuneDefinition }[] = [];
    private currentTab: 'items' | 'runes' = 'items';
    private itemsTabBtn!: Phaser.GameObjects.Rectangle;
    private itemsTabText!: Phaser.GameObjects.Text;
    private runesTabBtn!: Phaser.GameObjects.Rectangle;
    private runesTabText!: Phaser.GameObjects.Text;
    private cardContainer!: Phaser.GameObjects.Container;

    constructor() {
        super('MerchantShop');
    }

    create(data?: { items?: ItemDefinition[], runes?: RuneDefinition[] }) {
        const { width, height } = this.scale;

        this.bgOverlay = this.add.rectangle(0, 0, width, height, 0x09090b, 0)
            .setOrigin(0)
            .setInteractive();

        this.tweens.add({
            targets: this.bgOverlay,
            fillAlpha: 0.85,
            duration: 300
        });

        this.shopContainer = this.add.container(width / 2, height / 2).setAlpha(0);

        const savedState = localStorage.getItem('merchant_shop_state');
        if (data && data.items && data.items.length === 3) {
            this.merchantItems = data.items;
        } else if (savedState) {
            const parsed = JSON.parse(savedState);
            this.merchantItems = parsed.items || [];
            if (this.merchantItems.length === 0) this.generateItems();
        } else {
            this.generateItems();
        }

        if (data && data.runes && data.runes.length === 3) {
            this.merchantRunes = data.runes;
        } else if (savedState) {
            const parsed = JSON.parse(savedState);
            this.merchantRunes = parsed.runes || [];
            if (this.merchantRunes.length === 0) this.generateRunes();
        } else {
            this.generateRunes();
        }

        localStorage.setItem('merchant_shop_state', JSON.stringify({ items: this.merchantItems, runes: this.merchantRunes }));

        const dialogBg = this.add.rectangle(0, 0, 960, 540, 0x18181b)
            .setStrokeStyle(2, 0x847E87)
            .setOrigin(0.5);
        this.shopContainer.add(dialogBg);

        const titleText = this.add.text(0, -220, 'MERCHANT OUTPOST', {
            fontFamily: FONT_FAMILY,
            fontSize: '36px',
            color: '#d4af37'
        }).setOrigin(0.5);
        this.shopContainer.add(titleText);

        const gemstoneContainer = this.add.container(440, -230);
        this.shopContainer.add(gemstoneContainer);

        const gemstoneIcon = this.add.sprite(0, 0, 'currency', 4).setScale(2).setOrigin(1, 0.5);
        gemstoneContainer.add(gemstoneIcon);

        this.playerGemstonesText = this.add.text(-25, 0, PlayerData.getInstance().gemstones.toString(), {
            fontFamily: FONT_FAMILY,
            fontSize: '24px',
            color: '#22c55e'
        }).setOrigin(1, 0.5);
        gemstoneContainer.add(this.playerGemstonesText);

        const tabY = -170;
        const tabW = 120;
        const tabH = 30;
        const tabGap = 10;

        this.itemsTabBtn = this.add.rectangle(-tabW / 2 - tabGap / 2, tabY, tabW, tabH, 0x3f3f46)
            .setStrokeStyle(1, 0x847E87)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        this.shopContainer.add(this.itemsTabBtn);

        this.itemsTabText = this.add.text(-tabW / 2 - tabGap / 2, tabY, 'ITEMS', {
            fontFamily: FONT_FAMILY,
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.shopContainer.add(this.itemsTabText);

        this.runesTabBtn = this.add.rectangle(tabW / 2 + tabGap / 2, tabY, tabW, tabH, 0x27272a)
            .setStrokeStyle(1, 0x3f3f46)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        this.shopContainer.add(this.runesTabBtn);

        this.runesTabText = this.add.text(tabW / 2 + tabGap / 2, tabY, 'RUNES', {
            fontFamily: FONT_FAMILY,
            fontSize: '14px',
            color: '#a1a1aa'
        }).setOrigin(0.5);
        this.shopContainer.add(this.runesTabText);

        this.itemsTabBtn.on('pointerdown', () => this.switchTab('items'));
        this.runesTabBtn.on('pointerdown', () => this.switchTab('runes'));

        this.cardContainer = this.add.container(0, 0);
        this.shopContainer.add(this.cardContainer);

        this.renderItemCards();

        const closeText = this.add.text(0, 235, 'PRESS X OR ESC TO RETURN', {
            fontFamily: FONT_FAMILY,
            fontSize: '14px',
            color: '#a1a1aa'
        }).setOrigin(0.5);
        this.shopContainer.add(closeText);

        this.tweens.add({
            targets: this.shopContainer,
            alpha: 1,
            duration: 300
        });

        this.input.keyboard!.on(InputKeys.BACK, () => this.closeShop());
        this.input.keyboard!.on(InputKeys.INTERACT, () => this.closeShop());
    }

    private switchTab(tab: 'items' | 'runes') {
        if (this.currentTab === tab) return;
        this.currentTab = tab;

        if (tab === 'items') {
            this.itemsTabBtn.setFillStyle(0x3f3f46).setStrokeStyle(1, 0x847E87);
            this.itemsTabText.setColor('#ffffff');
            this.runesTabBtn.setFillStyle(0x27272a).setStrokeStyle(1, 0x3f3f46);
            this.runesTabText.setColor('#a1a1aa');
            this.renderItemCards();
        } else {
            this.runesTabBtn.setFillStyle(0x3f3f46).setStrokeStyle(1, 0x847E87);
            this.runesTabText.setColor('#ffffff');
            this.itemsTabBtn.setFillStyle(0x27272a).setStrokeStyle(1, 0x3f3f46);
            this.itemsTabText.setColor('#a1a1aa');
            this.renderRuneCards();
        }
    }

    private renderItemCards() {
        this.cardContainer.removeAll(true);
        this.buyButtons = [];

        const cardWidth = 260;
        const cardHeight = 320;
        const cardGap = 40;
        const startX = -(cardWidth * 1.5 + cardGap);

        this.merchantItems.forEach((item, index) => {
            const x = startX + index * (cardWidth + cardGap) + cardWidth / 2;
            const y = 30;

            const card = this.add.container(x, y);
            this.cardContainer.add(card);

            const cardBg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x27272a)
                .setStrokeStyle(1, 0x3f3f46)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });
            card.add(cardBg);

            const rarityColors: Record<string, string> = {
                Common: '#a1a1aa',
                Rare: '#3b82f6',
                Epic: '#a855f7',
                Legendary: '#eab308',
                Mythic: '#ef4444'
            };

            const rarityText = this.add.text(0, -135, item.rarity.toUpperCase(), {
                fontFamily: FONT_FAMILY,
                fontSize: '12px',
                color: rarityColors[item.rarity] || '#ffffff'
            }).setOrigin(0.5);
            card.add(rarityText);

            const frame = ItemData.getItemFrame(item.id);
            const itemSprite = this.add.sprite(0, -80, 'items', frame).setScale(1.5).setOrigin(0.5);
            card.add(itemSprite);

            const nameText = this.add.text(0, -15, item.name, {
                fontFamily: FONT_FAMILY,
                fontSize: '20px',
                color: '#ffffff'
            }).setOrigin(0.5);
            card.add(nameText);

            const abilityText = this.add.text(0, 2, `Ability: ${item.ability}`, {
                fontFamily: FONT_FAMILY,
                fontSize: '12px',
                color: '#e2e8f0'
            }).setOrigin(0.5);
            card.add(abilityText);

            const descText = this.add.text(0, 48, item.effectDescription, {
                fontFamily: FONT_FAMILY,
                fontSize: '10px',
                color: '#94a3b8',
                align: 'center',
                wordWrap: { width: cardWidth - 30 }
            }).setOrigin(0.5);
            card.add(descText);

            const btnY = 120;
            const btnWidth = cardWidth - 40;
            const btnHeight = 35;

            const isOwned = PlayerData.getInstance().getItemQuantity(item.id.toString()) > 0;
            const hasGemstones = PlayerData.getInstance().gemstones >= item.cost;

            let btnColor = 0xd4af37;
            let label = `BUY: ${item.cost}`;

            if (isOwned) {
                btnColor = 0x16a34a;
                label = 'OWNED';
            } else if (!hasGemstones) {
                btnColor = 0x4b5563;
            }

            const buyBtn = this.add.rectangle(0, btnY, btnWidth, btnHeight, btnColor)
                .setStrokeStyle(1, 0xffffff, isOwned ? 0 : 0.5)
                .setOrigin(0.5);
            card.add(buyBtn);

            const buyText = this.add.text(0, btnY, label, {
                fontFamily: FONT_FAMILY,
                fontSize: '14px',
                color: '#ffffff'
            }).setOrigin(0.5);
            card.add(buyText);

            this.buyButtons.push({
                btn: buyBtn,
                txt: buyText,
                cost: item.cost,
                item: item
            });

            if (!isOwned && hasGemstones) {
                buyBtn.setInteractive({ useHandCursor: true });
                buyBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
                    if (p.button !== 0) return;
                    this.purchaseItem(item, index);
                });
                buyBtn.on('pointerover', () => {
                    buyBtn.setFillStyle(0xe5c158);
                });
                buyBtn.on('pointerout', () => {
                    buyBtn.setFillStyle(0xd4af37);
                });
            }

            cardBg.on('pointerover', () => {
                this.tweens.add({
                    targets: itemSprite,
                    y: -86,
                    duration: 150,
                    ease: 'Quad.easeOut'
                });
                cardBg.setStrokeStyle(2, 0x847E87);
            });

            cardBg.on('pointerout', () => {
                this.tweens.add({
                    targets: itemSprite,
                    y: -80,
                    duration: 150,
                    ease: 'Quad.easeOut'
                });
                cardBg.setStrokeStyle(1, 0x3f3f46);
            });
        });
    }

    private renderRuneCards() {
        this.cardContainer.removeAll(true);
        this.runeBuyButtons = [];

        const cardWidth = 260;
        const cardHeight = 320;
        const cardGap = 40;
        const startX = -(cardWidth * 1.5 + cardGap);

        const cardTypeColors: Record<string, string> = {
            base: '#3b82f6',
            boost: '#a855f7',
            unique: '#eab308'
        };

        const effectTypeColors: Record<string, string> = {
            damage: '#ef4444',
            defense: '#3b82f6',
            heal: '#22c55e',
            buff: '#eab308',
            debuff: '#a855f7',
            utility: '#a1a1aa'
        };

        this.merchantRunes.forEach((rune, index) => {
            const x = startX + index * (cardWidth + cardGap) + cardWidth / 2;
            const y = 30;

            const card = this.add.container(x, y);
            this.cardContainer.add(card);

            const cardBg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x27272a)
                .setStrokeStyle(1, 0x3f3f46)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });
            card.add(cardBg);

            const typeLabel = rune.cardType.toUpperCase();
            const typeColor = cardTypeColors[rune.cardType] || '#ffffff';
            const typeText = this.add.text(0, -135, typeLabel, {
                fontFamily: FONT_FAMILY,
                fontSize: '12px',
                color: typeColor
            }).setOrigin(0.5);
            card.add(typeText);

            const runeLetter = this.add.text(0, -80, rune.letter, {
                fontFamily: RUNE_FONT,
                fontSize: '40px',
                color: '#ffffff'
            }).setOrigin(0.5);
            card.add(runeLetter);

            const nameText = this.add.text(0, -25, rune.name, {
                fontFamily: FONT_FAMILY,
                fontSize: '20px',
                color: '#ffffff'
            }).setOrigin(0.5);
            card.add(nameText);

            const translationText = this.add.text(0, -5, `"${rune.translation}"`, {
                fontFamily: FONT_FAMILY,
                fontSize: '12px',
                color: '#a1a1aa'
            }).setOrigin(0.5);
            card.add(translationText);

            const effectColor = effectTypeColors[rune.effectType] || '#ffffff';
            const effectText = this.add.text(0, 18, `${rune.effectType.toUpperCase()} • Power: ${rune.basePower}`, {
                fontFamily: FONT_FAMILY,
                fontSize: '11px',
                color: effectColor
            }).setOrigin(0.5);
            card.add(effectText);

            let shortDesc = rune.description;
            if (shortDesc.length > 100) {
                shortDesc = shortDesc.substring(0, 97) + '...';
            }
            const descText = this.add.text(0, 58, shortDesc, {
                fontFamily: FONT_FAMILY,
                fontSize: '10px',
                color: '#94a3b8',
                align: 'center',
                wordWrap: { width: cardWidth - 30 }
            }).setOrigin(0.5);
            card.add(descText);

            const btnY = 120;
            const btnWidth = cardWidth - 40;
            const btnHeight = 35;

            const runeCost = this.getRuneCost(rune);
            const pd = PlayerData.getInstance();
            const isOwned = pd.getRuneQuantity(rune.letter) > 0;
            const hasGemstones = pd.gemstones >= runeCost;

            let btnColor = 0xd4af37;
            let label = `BUY: ${runeCost}`;

            if (isOwned) {
                btnColor = 0x16a34a;
                label = 'OWNED';
            } else if (!hasGemstones) {
                btnColor = 0x4b5563;
            }

            const buyBtn = this.add.rectangle(0, btnY, btnWidth, btnHeight, btnColor)
                .setStrokeStyle(1, 0xffffff, isOwned ? 0 : 0.5)
                .setOrigin(0.5);
            card.add(buyBtn);

            const buyText = this.add.text(0, btnY, label, {
                fontFamily: FONT_FAMILY,
                fontSize: '14px',
                color: '#ffffff'
            }).setOrigin(0.5);
            card.add(buyText);

            this.runeBuyButtons.push({
                btn: buyBtn,
                txt: buyText,
                cost: runeCost,
                rune: rune
            });

            if (!isOwned && hasGemstones) {
                buyBtn.setInteractive({ useHandCursor: true });
                buyBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
                    if (p.button !== 0) return;
                    this.purchaseRune(rune, index);
                });
                buyBtn.on('pointerover', () => {
                    buyBtn.setFillStyle(0xe5c158);
                });
                buyBtn.on('pointerout', () => {
                    buyBtn.setFillStyle(0xd4af37);
                });
            }

            cardBg.on('pointerover', () => {
                this.tweens.add({
                    targets: runeLetter,
                    y: -86,
                    duration: 150,
                    ease: 'Quad.easeOut'
                });
                cardBg.setStrokeStyle(2, 0x847E87);
            });

            cardBg.on('pointerout', () => {
                this.tweens.add({
                    targets: runeLetter,
                    y: -80,
                    duration: 150,
                    ease: 'Quad.easeOut'
                });
                cardBg.setStrokeStyle(1, 0x3f3f46);
            });
        });
    }

    private getRuneCost(rune: RuneDefinition): number {
        switch (rune.cardType) {
            case 'unique': return 200;
            case 'boost': return 120;
            case 'base': return 80;
            default: return 100;
        }
    }

    private generateItems() {
        const allItems = ItemData.getAllItems();
        const pd = PlayerData.getInstance();
        const undiscovered = allItems.filter(item => !ItemData.getInstance().isDiscovered(item.id) && pd.getItemQuantity(item.id.toString()) === 0);

        const pool = [...undiscovered];
        if (pool.length < 3) {
            const others = allItems.filter(item => !pool.includes(item));
            pool.push(...others);
        }

        const selected: ItemDefinition[] = [];
        const tempPool = [...pool];
        while (selected.length < 3 && tempPool.length > 0) {
            const randIdx = Math.floor(Math.random() * tempPool.length);
            selected.push(tempPool.splice(randIdx, 1)[0]);
        }

        while (selected.length < 3) {
            selected.push(allItems[0]);
        }

        this.merchantItems = selected;
    }

    private generateRunes() {
        const allRunes = RuneData.getAllDefinitions();
        const pd = PlayerData.getInstance();
        const unowned = allRunes.filter(r => pd.getRuneQuantity(r.letter) === 0);

        const pool = [...unowned];
        if (pool.length < 3) {
            const others = allRunes.filter(r => !pool.includes(r));
            pool.push(...others);
        }

        const selected: RuneDefinition[] = [];
        const tempPool = [...pool];
        while (selected.length < 3 && tempPool.length > 0) {
            const randIdx = Math.floor(Math.random() * tempPool.length);
            selected.push(tempPool.splice(randIdx, 1)[0]);
        }

        while (selected.length < 3) {
            selected.push(allRunes[0]);
        }

        this.merchantRunes = selected;
    }

    private purchaseItem(item: ItemDefinition, index: number) {
        const pd = PlayerData.getInstance();
        if (pd.gemstones < item.cost) return;

        pd.gemstones -= item.cost;
        pd.addItem(item.id.toString());
        pd.save();

        ItemData.getInstance().discoverItem(item.id);

        this.playerGemstonesText.setText(pd.gemstones.toString());

        const state = this.buyButtons[index];
        state.btn.disableInteractive();
        state.btn.setFillStyle(0x16a34a);
        state.btn.setStrokeStyle(1, 0xffffff, 0);
        state.txt.setText('OWNED');

        this.buyButtons.forEach((btnState) => {
            const isOwned = pd.getItemQuantity(btnState.item.id.toString()) > 0;
            const hasGemstones = pd.gemstones >= btnState.cost;

            if (!isOwned && !hasGemstones) {
                btnState.btn.disableInteractive();
                btnState.btn.setFillStyle(0x4b5563);
                btnState.btn.setStrokeStyle(1, 0xffffff, 0.5);
                btnState.txt.setText(`BUY: ${btnState.cost}`);
            }
        });

        this.refreshRuneAffordability();
    }

    private purchaseRune(rune: RuneDefinition, index: number) {
        const pd = PlayerData.getInstance();
        const cost = this.getRuneCost(rune);
        if (pd.gemstones < cost) return;

        pd.gemstones -= cost;
        pd.addRune(rune.letter, 1);
        pd.save();

        RuneData.getInstance().discoverRune(rune.letter);

        this.playerGemstonesText.setText(pd.gemstones.toString());

        const state = this.runeBuyButtons[index];
        state.btn.disableInteractive();
        state.btn.setFillStyle(0x16a34a);
        state.btn.setStrokeStyle(1, 0xffffff, 0);
        state.txt.setText('OWNED');

        this.runeBuyButtons.forEach((btnState) => {
            const isOwned = pd.getRuneQuantity(btnState.rune.letter) > 0;
            const hasGemstones = pd.gemstones >= btnState.cost;

            if (!isOwned && !hasGemstones) {
                btnState.btn.disableInteractive();
                btnState.btn.setFillStyle(0x4b5563);
                btnState.btn.setStrokeStyle(1, 0xffffff, 0.5);
                btnState.txt.setText(`BUY: ${btnState.cost}`);
            }
        });

        this.refreshItemAffordability();
    }

    private refreshRuneAffordability() {
        const pd = PlayerData.getInstance();
        this.runeBuyButtons.forEach((btnState) => {
            const isOwned = pd.getRuneQuantity(btnState.rune.letter) > 0;
            const hasGemstones = pd.gemstones >= btnState.cost;
            if (!isOwned && !hasGemstones) {
                btnState.btn.disableInteractive();
                btnState.btn.setFillStyle(0x4b5563);
            }
        });
    }

    private refreshItemAffordability() {
        const pd = PlayerData.getInstance();
        this.buyButtons.forEach((btnState) => {
            const isOwned = pd.getItemQuantity(btnState.item.id.toString()) > 0;
            const hasGemstones = pd.gemstones >= btnState.cost;
            if (!isOwned && !hasGemstones) {
                btnState.btn.disableInteractive();
                btnState.btn.setFillStyle(0x4b5563);
            }
        });
    }

    private closeShop() {
        this.tweens.add({
            targets: this.shopContainer,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                this.scene.resume('LevelScene');
                this.scene.stop();
            }
        });
    }
}
