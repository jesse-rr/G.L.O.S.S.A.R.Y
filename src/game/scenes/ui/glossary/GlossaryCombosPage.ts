import * as Phaser from 'phaser';
import { FONT_FAMILY, TITLE_FONT, RUNE_FONT } from '../../../constants';
import { RuneData, PREDEFINED_COMBOS, resolveCombo } from '../../../data/RuneData';
import { PlayerData } from '../../../data/PlayerData';
import { convertToRunicWords, playScrambleAnimation } from '../../../utils/ScrambleAnimation';
import { GlossaryUI } from '../GlossaryUI';

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
        const rightDescLayout = this.scene.add.image(rightPageX - 90, topY - 40, 'book-layout-5').setOrigin(0).setAlpha(0.5).setScale(1, 1.1);

        const leftTitle = this.scene.add.text(leftPageX + 210, topY + 120, 'Unique Combos', {
            fontFamily: TITLE_FONT, fontSize: '82px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.8);

        this.container.add([leftInfoLayout, leftDescLayout, rightDescLayout, leftTitle]);

        const runeData = RuneData.getInstance();
        const playerData = PlayerData.getInstance();
        const playerRunes = playerData.runes;

        PREDEFINED_COMBOS.forEach((combo, index) => {
            const isLeft = index < 11;
            const itemIndex = isLeft ? index : index - 11;
            const pageX = isLeft ? leftPageX : rightPageX;

            const x = pageX - 25;
            const y = isLeft ? (topY + 256 + itemIndex * spacingY) : (topY + 12 + itemIndex * spacingY);

            const isUnlocked = combo.runes.every(r => runeData.isDiscovered(r));
            const isViewed = runeData.isViewed(combo.id);
            const useRunic = !isUnlocked || (isUnlocked && !isViewed);

            const hasAccess = combo.runes.every(r => {
                const entry = playerRunes.find(pr => pr.id === r);
                return entry && entry.quantity > 0;
            });

            const defs = combo.runes.map(r => RuneData.getDefinition(r)).filter(Boolean);
            const resolved = resolveCombo(combo.runes);
            const power = resolved ? resolved.bonusPower : 10;
            const isHeal = defs.some(d => d && d.effectType === 'heal');
            const isDef = defs.some(d => d && d.effectType === 'defense');

            let effectText = `+${power} DMG`;
            if (isHeal) effectText = `+${power}% HP`;
            else if (isDef) effectText = `+${power}% DEF`;

            let finalNamePart: string;
            let finalDescPart: string;
            let displayAlpha: number;

            if (isUnlocked) {
                finalNamePart = combo.name;
                const partsPart = defs.map(d => d ? d.name : '').join(' + ');
                finalDescPart = `${partsPart}  (${effectText})`;
                displayAlpha = hasAccess ? 0.7 : 0.4;
            } else {
                finalNamePart = combo.name;
                finalDescPart = combo.runes.join(' + ');
                displayAlpha = 0.7;
            }

            const initialNameStr = useRunic ? convertToRunicWords(finalNamePart) : finalNamePart;
            const initialDescStr = useRunic ? convertToRunicWords(finalDescPart) : finalDescPart;

            const textY = useRunic ? y : y + 2;

            const nameTextObj = this.scene.add.text(x, textY, initialNameStr, {
                fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY,
                fontSize: '18px',
                color: '#000000',
                fontStyle: 'bold'
            }).setOrigin(0).setAlpha(displayAlpha);

            const descTextObj = this.scene.add.text(pageX + 435, textY, initialDescStr, {
                fontFamily: useRunic ? RUNE_FONT : FONT_FAMILY,
                fontSize: '15px',
                color: '#000000'
            }).setOrigin(1, 0).setAlpha(displayAlpha);

            if (useRunic) {
                nameTextObj.setStroke('#000000', 1);
                descTextObj.setStroke('#000000', 1);
            }

            this.container.add([nameTextObj, descTextObj]);

            if (isUnlocked && !isViewed) {
                this.scene.time.delayedCall(100 + index * 35, () => {
                    if (!this.scene || !this.scene.scene || !this.scene.scene.isActive()) return;
                    playScrambleAnimation(this.scene, this.scene,
                        [nameTextObj, descTextObj],
                        [finalNamePart, finalDescPart],
                        () => {
                            runeData.markViewed(combo.id);
                            this.scene.tweens.add({
                                targets: [nameTextObj, descTextObj],
                                y: y + 2,
                                duration: 250,
                                ease: 'Cubic.easeOut'
                            });
                        }
                    );
                });
            }
        });
    }
}
