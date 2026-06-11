import * as Phaser from 'phaser';
import { FONT_FAMILY } from '../constants';
import { ItemData, ItemDefinition } from '../data/ItemData';
import { getSelectedItems } from '../scenes/ui/glossary/GlossaryItemsPage';

export class CombatInventoryUI {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container | null = null;
    private blocker: Phaser.GameObjects.Rectangle | null = null;
    private equippedItemStatus: Map<number, boolean>;

    constructor(scene: Phaser.Scene, equippedItemStatus: Map<number, boolean>) {
        this.scene = scene;
        this.equippedItemStatus = equippedItemStatus;
    }

    show(): void {
        if (this.container) return;

        const centerX = this.scene.scale.width / 2;
        const centerY = this.scene.scale.height / 2;

        this.blocker = this.scene.add.rectangle(0, 0, this.scene.scale.width, this.scene.scale.height, 0x000000, 0.75)
            .setOrigin(0)
            .setInteractive()
            .setDepth(2000)
            .setScrollFactor(0);

        this.container = this.scene.add.container(centerX, centerY).setDepth(2001).setScrollFactor(0);

        const width = 520;
        const height = 380;

        const dialogBg = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.95)
            .setStrokeStyle(2, 0x847E87)
            .setOrigin(0.5);
        this.container.add(dialogBg);

        const titleText = this.scene.add.text(0, -height / 2 + 30, 'EQUIPPED ITEMS', {
            fontFamily: FONT_FAMILY,
            fontSize: '22px',
            color: '#ffd700',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(titleText);

        const divider = this.scene.add.rectangle(0, -height / 2 + 55, width - 40, 1, 0x847E87).setOrigin(0.5);
        this.container.add(divider);

        const equippedIds = getSelectedItems();
        if (equippedIds.length === 0) {
            const emptyText = this.scene.add.text(0, 0, 'No items equipped.\nSelect items in your Glossary.', {
                fontFamily: FONT_FAMILY,
                fontSize: '16px',
                color: '#847E87',
                align: 'center'
            }).setOrigin(0.5);
            this.container.add(emptyText);
        } else {
            let startY = -90;
            equippedIds.forEach((idStr) => {
                const id = parseInt(idStr, 10);
                const def = ItemData.getItem(id);
                if (!def) return;

                const itemRow = this.createItemRow(def, startY);
                this.container?.add(itemRow);
                startY += 90;
            });
        }

        const closeBtn = this.scene.add.rectangle(0, height / 2 - 35, 120, 30, 0x000000)
            .setStrokeStyle(1, 0x847E87)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        const closeText = this.scene.add.text(0, height / 2 - 35, 'CLOSE', {
            fontFamily: FONT_FAMILY,
            fontSize: '14px',
            color: '#847E87',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        closeBtn.on('pointerover', () => {
            closeBtn.setFillStyle(0x222222);
            closeBtn.setStrokeStyle(1, 0xffd700);
            closeText.setColor('#ffd700');
        });
        closeBtn.on('pointerout', () => {
            closeBtn.setFillStyle(0x000000);
            closeBtn.setStrokeStyle(1, 0x847E87);
            closeText.setColor('#847E87');
        });
        closeBtn.on('pointerdown', () => {
            this.hide();
        });

        this.container.add([closeBtn, closeText]);

        this.container.setScale(0.8);
        this.container.setAlpha(0);
        this.scene.tweens.add({
            targets: this.container,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 200,
            ease: 'Back.easeOut'
        });
    }

    private createItemRow(def: ItemDefinition, y: number): Phaser.GameObjects.Container {
        const row = this.scene.add.container(0, y);

        const rowBg = this.scene.add.rectangle(0, 0, 480, 75, 0x111111, 0.6)
            .setStrokeStyle(1, 0x222222)
            .setOrigin(0.5);
        row.add(rowBg);

        const frame = ItemData.getItemFrame(def.id);
        const itemIcon = this.scene.add.sprite(-200, -5, 'items', frame)
            .setScale(1)
            .setOrigin(0.5);
        row.add(itemIcon);

        const rarityColors: Record<string, string> = {
            'Common': '#847E87',
            'Rare': '#3b82f6',
            'Epic': '#8b5cf6',
            'Legendary': '#ffd700',
            'Mythic': '#ef4444'
        };
        const rarityColor = rarityColors[def.rarity] || '#ffffff';

        const nameText = this.scene.add.text(-150, -22, def.name.toUpperCase(), {
            fontFamily: FONT_FAMILY,
            fontSize: '15px',
            color: rarityColor,
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        row.add(nameText);

        const effectText = this.scene.add.text(-150, -5, def.effectDescription, {
            fontFamily: FONT_FAMILY,
            fontSize: '12px',
            color: '#cccccc',
            wordWrap: { width: 280 },
            lineSpacing: 2
        }).setOrigin(0, 0);
        row.add(effectText);

        const isUsed = this.equippedItemStatus.get(def.id) ?? false;
        const isConsumable = def.id === 2;

        if (isConsumable) {
            const statusLabel = isUsed ? 'CONSUMED' : 'READY';
            const statusColor = isUsed ? '#ef4444' : '#00ff00';
            const statusText = this.scene.add.text(200, 0, statusLabel, {
                fontFamily: FONT_FAMILY,
                fontSize: '13px',
                color: statusColor,
                fontStyle: 'bold'
            }).setOrigin(0.5);
            row.add(statusText);
        } else if (def.id === 3) {
            let count = 0;
            try {
                const raw = localStorage.getItem('glossary_echojar_completed_combats');
                if (raw) count = parseInt(raw, 10) || 0;
            } catch {}
            const statusText = this.scene.add.text(200, 0, `+${count} PWR`, {
                fontFamily: FONT_FAMILY,
                fontSize: '13px',
                color: '#ffd700',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            row.add(statusText);
        } else {
            const statusLabel = isUsed ? 'TRIGGERED' : 'ACTIVE';
            const statusColor = isUsed ? '#847E87' : '#00ff00';
            const statusText = this.scene.add.text(200, 0, statusLabel, {
                fontFamily: FONT_FAMILY,
                fontSize: '13px',
                color: statusColor,
                fontStyle: 'bold'
            }).setOrigin(0.5);
            row.add(statusText);
        }

        return row;
    }

    hide(): void {
        if (!this.container) return;

        this.scene.tweens.add({
            targets: this.container,
            scaleX: 0.8,
            scaleY: 0.8,
            alpha: 0,
            duration: 150,
            ease: 'Quad.easeIn',
            onComplete: () => {
                this.container?.destroy();
                this.container = null;
                this.blocker?.destroy();
                this.blocker = null;
            }
        });
    }

    destroy(): void {
        this.container?.destroy();
        this.container = null;
        this.blocker?.destroy();
        this.blocker = null;
    }

    isOpen(): boolean {
        return this.container !== null;
    }
}
