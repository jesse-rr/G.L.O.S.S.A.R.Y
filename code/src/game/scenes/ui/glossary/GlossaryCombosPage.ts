import * as Phaser from 'phaser';
import { FONT_FAMILY, TITLE_FONT, RUNE_FONT } from '../../../constants';
import { RuneData } from '../../../data/RuneData';
import { PlayerData } from '../../../data/PlayerData';
import { convertToRunicWords } from '../../../utils/ScrambleAnimation';
import { GlossaryUI } from '../GlossaryUI';

interface PredefinedCombo {
    id: string;
    name: string;
    runes: string[];
}

const PREDEFINED_COMBOS: PredefinedCombo[] = [
    { id: 'fire_storm', name: 'Fire Storm', runes: ['F', 'I', 'A'] },
    { id: 'abyssal_strike', name: 'Abyssal Strike', runes: ['N', 'J', 'M'] },
    { id: 'titan_defense', name: 'Titan Defense', runes: ['B', 'K', 'T'] },
    { id: 'sun_blessing', name: 'Sun Blessing', runes: ['B', 'L', 'H'] },
    { id: 'piercing_rift', name: 'Piercing Rift', runes: ['C', 'O', 'Q'] },
    { id: 'infinite_echo', name: 'Infinite Echo', runes: ['A', 'E', 'W'] },
    { id: 'shattering_cinder', name: 'Shattering Cinder', runes: ['X', 'I', 'G'] },
    { id: 'phoenix_ward', name: 'Phoenix Ward', runes: ['B', 'P', 'Y'] },
    { id: 'blood_lust', name: 'Blood Lust', runes: ['A', 'D', 'J'] },
    { id: 'grave_call', name: 'Grave Call', runes: ['N', 'G', 'J'] },
    { id: 'runic_strike', name: 'Runic Strike', runes: ['C', 'K', 'O'] },
    { id: 'gale_force', name: 'Gale Force', runes: ['A', 'R', 'E'] },
    { id: 'star_mending', name: 'Star Mending', runes: ['L', 'O', 'H'] },
    { id: 'iron_guard', name: 'Iron Guard', runes: ['B', 'K', 'B'] },
    { id: 'venomous_fang', name: 'Venomous Fang', runes: ['C', 'J', 'D'] },
    { id: 'soul_siphon', name: 'Soul Siphon', runes: ['N', 'D', 'O'] },
    { id: 'cursed_ember', name: 'Cursed Ember', runes: ['F', 'J', 'I'] },
    { id: 'shadow_veil', name: 'Shadow Veil', runes: ['N', 'U', 'G'] },
    { id: 'glacial_aegis', name: 'Glacial Aegis', runes: ['B', 'R', 'P'] },
    { id: 'divine_light', name: 'Divine Light', runes: ['L', 'H', 'Y'] },
    { id: 'void_bridge', name: 'Void Bridge', runes: ['C', 'E', 'S'] },
    { id: 'earth_slam', name: 'Earth Slam', runes: ['A', 'K', 'T'] },
    { id: 'phoenix_pyre', name: 'Phoenix Pyre', runes: ['F', 'I', 'P'] },
    { id: 'temporal_shift', name: 'Temporal Shift', runes: ['E', 'W', 'S'] },
    { id: 'frozen_wrath', name: 'Frozen Wrath', runes: ['R', 'G', 'A'] },
    { id: 'lumina_shield', name: 'Lumina Shield', runes: ['B', 'L', 'P'] },
    { id: 'silent_hex', name: 'Silent Hex', runes: ['Q', 'J', 'G'] },
    { id: 'vanguard_crest', name: 'Vanguard Crest', runes: ['B', 'K', 'Y'] },
    { id: 'acid_spray', name: 'Acid Spray', runes: ['C', 'J', 'M'] },
    { id: 'ember_blast', name: 'Ember Blast', runes: ['F', 'O', 'I'] },
    { id: 'echoing_purify', name: 'Echoing Purify', runes: ['H', 'E', 'O'] },
    { id: 'celestial_will', name: 'Celestial Will', runes: ['A', 'V', 'W'] }
];

export class GlossaryCombosPage {
    private scene: GlossaryUI;
    private container: Phaser.GameObjects.Container;

    constructor(scene: GlossaryUI, container: Phaser.GameObjects.Container) {
        this.scene = scene;
        this.container = container;
    }

    render(centerX: number, height: number): void {
        const leftPageX = centerX - 500;
        const rightPageX = centerX + 80;
        const topY = height - 660;
        const spacingY = 27;

        const leftInfoLayout = this.scene.add.image(leftPageX - 90, topY + 20, 'book-layout-2').setOrigin(0).setAlpha(0.5);
        const leftDescLayout = this.scene.add.image(leftPageX - 90, topY + 200, 'book-layout-3').setOrigin(0).setAlpha(0.5);
        const rightDescLayout = this.scene.add.image(rightPageX - 75, topY + 20, 'book-layout-3').setOrigin(0).setAlpha(0.5).setScale(1.0, 1.35);

        const leftTitle = this.scene.add.text(leftPageX + 210, topY + 120, 'Combos', {
            fontFamily: TITLE_FONT, fontSize: '82px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.8);

        this.container.add([leftInfoLayout, leftDescLayout, rightDescLayout, leftTitle]);

        const runeData = RuneData.getInstance();
        const playerData = PlayerData.getInstance();
        const playerRunes = playerData.runes;

        PREDEFINED_COMBOS.forEach((combo, index) => {
            const isLeft = index < 12;
            const itemIndex = isLeft ? index : index - 12;
            const pageX = isLeft ? leftPageX : rightPageX;

            const x = pageX - 25;
            const y = isLeft ? (topY + 276 + itemIndex * spacingY) : (topY + 67 + itemIndex * spacingY);

            const isUnlocked = combo.runes.every(r => runeData.isDiscovered(r));
            const hasAccess = combo.runes.every(r => {
                const entry = playerRunes.find(pr => pr.id === r);
                return entry && entry.quantity > 0;
            });

            const defs = combo.runes.map(r => RuneData.getDefinition(r)).filter(Boolean);
            const power = RuneData.resolveChainPower(combo.runes);
            const isHeal = defs.some(d => d && d.effectType === 'heal');
            const isDef = defs.some(d => d && d.effectType === 'defense');
            const typeLabel = isHeal ? 'HEAL' : (isDef ? 'DEF' : 'DMG');

            if (isUnlocked) {
                const namePart = combo.name;
                const partsPart = defs.map(d => d ? d.name : '').join(' + ');
                const descPart = `${partsPart} (${power} ${typeLabel})`;
                const alpha = hasAccess ? 0.7 : 0.4;

                const nameTextObj = this.scene.add.text(x, y, namePart, {
                    fontFamily: FONT_FAMILY,
                    fontSize: '18px',
                    color: '#000000',
                    fontStyle: 'bold'
                }).setOrigin(0).setAlpha(alpha);

                const descTextObj = this.scene.add.text(pageX + 415, y, descPart, {
                    fontFamily: FONT_FAMILY,
                    fontSize: '18px',
                    color: '#000000'
                }).setOrigin(1, 0).setAlpha(alpha);

                this.container.add([nameTextObj, descTextObj]);
            } else {
                const namePart = combo.name;
                const partsPart = combo.runes.join(' + ');
                const descPart = `${partsPart} (${power} ${typeLabel})`;
                
                const nameRunic = convertToRunicWords(namePart);
                const descRunic = convertToRunicWords(descPart);
                const alpha = 0.7;

                const nameTextObj = this.scene.add.text(x, y, nameRunic, {
                    fontFamily: RUNE_FONT,
                    fontSize: '18px',
                    color: '#000000',
                    fontStyle: 'bold'
                }).setOrigin(0).setAlpha(alpha).setStroke('#000000', 1);

                const descTextObj = this.scene.add.text(pageX + 415, y, descRunic, {
                    fontFamily: RUNE_FONT,
                    fontSize: '18px',
                    color: '#000000'
                }).setOrigin(1, 0).setAlpha(alpha).setStroke('#000000', 1);

                this.container.add([nameTextObj, descTextObj]);
            }
        });
    }
}
