import * as Phaser from 'phaser';
import { PlayerData } from '../../data/PlayerData';
import { ItemData, ItemDefinition } from '../../data/ItemData';
import { FONT_FAMILY, InputKeys } from '../../constants';

export class MerchantShop extends Phaser.Scene {
    private bgOverlay!: Phaser.GameObjects.Rectangle;
    private shopContainer!: Phaser.GameObjects.Container;
    private playerGemstonesText!: Phaser.GameObjects.Text;
    private merchantItems: ItemDefinition[] = [];
    private buyButtons: { btn: Phaser.GameObjects.Rectangle, txt: Phaser.GameObjects.Text, cost: number, item: ItemDefinition }[] = [];

    constructor() {
        super('MerchantShop');
    }

    create(data?: { items?: ItemDefinition[] }) {
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

        if (data && data.items && data.items.length === 3) {
            this.merchantItems = data.items;
        } else {
            this.generateItems();
        }

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

        const subtitleText = this.add.text(0, -180, 'ACQUIRE RARE ARTIFACTS AND RELICS', {
            fontFamily: FONT_FAMILY,
            fontSize: '16px',
            color: '#a1a1aa'
        }).setOrigin(0.5);
        this.shopContainer.add(subtitleText);

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

        const cardWidth = 260;
        const cardHeight = 320;
        const cardGap = 40;
        const startX = -(cardWidth * 1.5 + cardGap);

        this.buyButtons = [];

        this.merchantItems.forEach((item, index) => {
            const x = startX + index * (cardWidth + cardGap) + cardWidth / 2;
            const y = 30;

            const cardContainer = this.add.container(x, y);
            this.shopContainer.add(cardContainer);

            const cardBg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x27272a)
                .setStrokeStyle(1, 0x3f3f46)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });
            cardContainer.add(cardBg);

            const rarityColors = {
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
            cardContainer.add(rarityText);

            const frame = ItemData.getItemFrame(item.id);
            const itemSprite = this.add.sprite(0, -80, 'items', frame).setScale(1.5).setOrigin(0.5);
            cardContainer.add(itemSprite);

            const nameText = this.add.text(0, -15, item.name, {
                fontFamily: FONT_FAMILY,
                fontSize: '20px',
                color: '#ffffff'
            }).setOrigin(0.5);
            cardContainer.add(nameText);

            const abilityText = this.add.text(0, 2, `Ability: ${item.ability}`, {
                fontFamily: FONT_FAMILY,
                fontSize: '12px',
                color: '#e2e8f0'
            }).setOrigin(0.5);
            cardContainer.add(abilityText);

            const descText = this.add.text(0, 48, item.effectDescription, {
                fontFamily: FONT_FAMILY,
                fontSize: '10px',
                color: '#94a3b8',
                align: 'center',
                wordWrap: { width: cardWidth - 30 }
            }).setOrigin(0.5);
            cardContainer.add(descText);

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
            cardContainer.add(buyBtn);

            const buyText = this.add.text(0, btnY, label, {
                fontFamily: FONT_FAMILY,
                fontSize: '14px',
                color: '#ffffff'
            }).setOrigin(0.5);
            cardContainer.add(buyText);

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
