import * as Phaser from 'phaser';
import { FONT_FAMILY, TITLE_FONT } from '../../../constants';
import { PlayerData } from '../../../data/PlayerData';
import { RuneData } from '../../../data/RuneData';
import { BestiaryData, BESTIARY } from '../../../data/BestiaryData';
import { ItemData } from '../../../data/ItemData';
import { LocationData, SETTLEMENTS, BOSSES, HUBS } from '../../../data/LocationData';
import { getSelectedItems } from './GlossaryItemsPage';

export class GlossaryPlayerPage {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene, container: Phaser.GameObjects.Container) {
        this.scene = scene;
        this.container = container;
    }

    render(centerX: number, height: number): void {
        const leftPageX = centerX - 500;
        const rightPageX = centerX + 80;
        const topY = height - 660;

        const leftInfoLayout = this.scene.add.image(leftPageX - 90, topY + 20, 'book-layout-2').setOrigin(0).setAlpha(0.5);
        const leftDescLayout = this.scene.add.image(leftPageX - 90, topY + 200, 'book-layout-3').setOrigin(0).setAlpha(0.5);
        const rightInfoLayout = this.scene.add.image(rightPageX - 90, topY + 20, 'book-layout-2').setOrigin(0).setAlpha(0.5);
        const rightDescLayout = this.scene.add.image(rightPageX - 90, topY + 200, 'book-layout-3').setOrigin(0).setAlpha(0.5);

        this.container.add([leftInfoLayout, leftDescLayout, rightInfoLayout, rightDescLayout]);

        const leftTitle = this.scene.add.text(leftPageX + 210, topY + 120, 'Discovery', {
            fontFamily: TITLE_FONT, fontSize: '82px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.8);
        this.container.add(leftTitle);

        const runeData = RuneData.getInstance();
        const bestiaryData = BestiaryData.getInstance();
        const itemData = ItemData.getInstance();
        const locationData = LocationData.getInstance();

        const totalRunes = RuneData.getAllDefinitions().length;
        const discoveredRunes = runeData.getDiscoveredRunes().length;

        const totalBeasts = BESTIARY.length;
        const discoveredBeasts = bestiaryData.getDiscoveredCount();

        const allItems = ItemData.getAllItems();
        const totalItems = allItems.length;
        const discoveredItems = allItems.filter(item => itemData.isDiscovered(item.id)).length;

        const allLocations = [...SETTLEMENTS, ...BOSSES, ...HUBS];
        const totalLocations = allLocations.length;
        const discoveredLocations = allLocations.filter(loc => locationData.isDiscovered(loc.id)).length;

        const lineHeight = 42;
        const contentW = 420;
        const leftCenter = leftPageX + 210;
        const labelX = leftCenter - contentW / 2;
        const valueX = leftCenter + contentW / 2;
        let y = topY + 290;

        const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
            fontFamily: FONT_FAMILY, fontSize: '18px', color: '#000000', align: 'left'
        };
        const valueStyle: Phaser.Types.GameObjects.Text.TextStyle = {
            fontFamily: FONT_FAMILY, fontSize: '18px', color: '#000000', align: 'right'
        };

        const entries = [
            { label: 'Runes Discovered', value: `${discoveredRunes} / ${totalRunes}` },
            { label: 'Bestiary Entries', value: `${discoveredBeasts} / ${totalBeasts}` },
            { label: 'Items Found', value: `${discoveredItems} / ${totalItems}` },
            { label: 'Locations Visited', value: `${discoveredLocations} / ${totalLocations}` }
        ];

        for (const entry of entries) {
            const label = this.scene.add.text(labelX, y, entry.label, labelStyle).setOrigin(0, 0.5).setAlpha(0.7);
            const value = this.scene.add.text(valueX, y, entry.value, valueStyle).setOrigin(1, 0.5).setAlpha(0.7);

            const lineY = y + lineHeight / 2 - 4;
            const separator = this.scene.add.rectangle(leftCenter, lineY, contentW, 1, 0x000000).setAlpha(0.15);

            this.container.add([label, value, separator]);
            y += lineHeight;
        }

        const totalAll = totalRunes + totalBeasts + totalItems + totalLocations;
        const discoveredAll = discoveredRunes + discoveredBeasts + discoveredItems + discoveredLocations;
        const pct = totalAll > 0 ? Math.floor((discoveredAll / totalAll) * 100) : 0;

        y += 12;
        const completionLabel = this.scene.add.text(labelX, y, 'Total Completion', labelStyle).setOrigin(0, 0.5).setAlpha(0.8);
        const completionValue = this.scene.add.text(valueX, y, `${pct}%`, valueStyle).setOrigin(1, 0.5).setAlpha(0.8);
        this.container.add([completionLabel, completionValue]);

        y += 30;
        const barH = 12;
        const barBg = this.scene.add.rectangle(leftCenter, y, contentW, barH, 0x000000, 0.1).setOrigin(0.5, 0.5);
        const fillW = Math.max(1, (pct / 100) * contentW);
        const barFill = this.scene.add.rectangle(leftCenter - contentW / 2, y, fillW, barH, 0x3a3a3a, 0.5).setOrigin(0, 0.5);
        this.container.add([barBg, barFill]);

        const rightTitle = this.scene.add.text(rightPageX + 210, topY + 120, 'Status', {
            fontFamily: TITLE_FONT, fontSize: '82px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.8);
        this.container.add(rightTitle);

        const playerData = PlayerData.getInstance();
        const completedTradesCount = this.getCompletedTradesCount();
        const covenantDisplay = playerData.covenant.charAt(0).toUpperCase() + playerData.covenant.slice(1);

        const rightCenter = rightPageX + 210;
        const rLabelX = rightCenter - contentW / 2;
        const rValueX = rightCenter + contentW / 2;
        let ry = topY + 270;

        const statusEntries = [
            { label: 'Covenant', value: covenantDisplay },
            { label: 'Health', value: `${playerData.hp} / ${playerData.maxHp}` },
            { label: 'Gemstones', value: `${playerData.gemstones}` },
            { label: 'Special Currency', value: `${playerData.specialCurrency}` },
            { label: 'Trades Completed', value: `${completedTradesCount} / 3` }
        ];

        for (const entry of statusEntries) {
            const label = this.scene.add.text(rLabelX, ry, entry.label, labelStyle).setOrigin(0, 0.5).setAlpha(0.7);
            const value = this.scene.add.text(rValueX, ry, entry.value, valueStyle).setOrigin(1, 0.5).setAlpha(0.7);

            const lineY = ry + lineHeight / 2 - 4;
            const separator = this.scene.add.rectangle(rightCenter, lineY, contentW, 1, 0x000000).setAlpha(0.15);

            this.container.add([label, value, separator]);
            ry += lineHeight;
        }

        ry += 16;
        const equipTitle = this.scene.add.text(rightCenter, ry, 'Equipped Items', {
            fontFamily: FONT_FAMILY, fontSize: '18px', color: '#000000'
        }).setOrigin(0.5, 0.5).setAlpha(0.8);
        this.container.add(equipTitle);

        ry += 32;

        const equippedIds = getSelectedItems();

        if (equippedIds.length === 0) {
            const emptyText = this.scene.add.text(rightCenter, ry, '— No items equipped —', {
                fontFamily: FONT_FAMILY, fontSize: '15px', color: '#000000'
            }).setOrigin(0.5, 0.5).setAlpha(0.4);
            this.container.add(emptyText);
        } else {
            const names = equippedIds.map(id => {
                const itemDef = ItemData.getItem(parseInt(id));
                return itemDef ? `[${itemDef.name}]` : `[Item #${id}]`;
            }).join('   ');

            const itemsText = this.scene.add.text(rightCenter, ry, names, {
                fontFamily: FONT_FAMILY,
                fontSize: '15px',
                color: '#000000',
                fontStyle: 'bold',
                align: 'center',
                wordWrap: { width: contentW }
            }).setOrigin(0.5, 0.5).setAlpha(0.7);
            this.container.add(itemsText);
        }
    }

    private getCompletedTradesCount(): number {
        try {
            const data = localStorage.getItem('glossary_completed_trades');
            if (data) {
                const arr = JSON.parse(data) as string[];
                return arr.length;
            }
        } catch (_e) { }
        return 0;
    }
}
