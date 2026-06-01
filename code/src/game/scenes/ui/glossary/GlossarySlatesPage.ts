import * as Phaser from 'phaser';
import { FONT_FAMILY, RUNE_FONT, TITLE_FONT } from '../../../constants';
import { SLATE_DEFINITIONS, SlateDefinition, SlateProgress } from '../../../data/SlateData';
import { cleanupAnimations, ScrambleContext } from '../../../utils/ScrambleAnimation';

export class GlossarySlatesPage {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;
    private selectedSlateId: string | null = null;
    private rightPageContainer!: Phaser.GameObjects.Container;
    private leftListItems: { text: Phaser.GameObjects.Text; id: string }[] = [];

    private centerX: number = 0;
    private height: number = 0;

    constructor(scene: Phaser.Scene, container: Phaser.GameObjects.Container) {
        this.scene = scene;
        this.container = container;
    }

    render(centerX: number, height: number): void {
        this.centerX = centerX;
        this.height = height;

        const leftPageX = centerX - 500;
        const rightPageX = centerX + 80;
        const topY = height - 660;

        const leftInfoLayout = this.scene.add.image(leftPageX - 90, topY + 20, 'book-layout-2').setOrigin(0).setAlpha(0.5);
        const leftDescLayout = this.scene.add.image(leftPageX - 90, topY + 200, 'book-layout-3').setOrigin(0).setAlpha(0.5);
        const rightDescLayout = this.scene.add.image(rightPageX - 90, topY - 40, 'book-layout-5').setOrigin(0).setAlpha(0.5).setScale(1, 1.1);

        this.container.add([leftInfoLayout, leftDescLayout, rightDescLayout]);

        const titleText = this.scene.add.text(leftPageX + 210, topY + 120, 'Slates', {
            fontFamily: TITLE_FONT, fontSize: '82px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.8);
        this.container.add(titleText);

        const slates = SLATE_DEFINITIONS;

        this.rightPageContainer = this.scene.add.container(0, 0);
        this.container.add(this.rightPageContainer);

        if (!this.selectedSlateId) {
            const saved = localStorage.getItem('glossary_selected_slate_id');
            if (saved && SLATE_DEFINITIONS.some(s => s.id === saved)) {
                this.selectedSlateId = saved;
            } else {
                this.selectedSlateId = slates[0].id;
            }
        }

        this.renderLeftList(slates, leftPageX, topY);
        this.renderRightDetails(rightPageX + 210, topY);

        const keyboard = this.scene.input.keyboard;
        const onKeyDown = (event: KeyboardEvent) => {
            if (!this.scene || !this.scene.sys.isActive() || !this.container.active) {
                return;
            }
            const key = event.key;
            if (key.toLowerCase() === 'u') {
                const progress = SlateProgress.getInstance();
                SLATE_DEFINITIONS.forEach(s => {
                    progress.completeSlate(s.id);
                });
                this.container.removeAll(true);
                this.render(this.centerX, this.height);
                return;
            }

            if (key === 'ArrowUp' || key === 'Up') {
                const currentIndex = slates.findIndex(s => s.id === this.selectedSlateId);
                const newIndex = (currentIndex - 1 + slates.length) % slates.length;
                this.selectedSlateId = slates[newIndex].id;
                localStorage.setItem('glossary_selected_slate_id', this.selectedSlateId);
                this.refreshPage(leftPageX, topY);
            } else if (key === 'ArrowDown' || key === 'Down') {
                const currentIndex = slates.findIndex(s => s.id === this.selectedSlateId);
                const newIndex = (currentIndex + 1) % slates.length;
                this.selectedSlateId = slates[newIndex].id;
                localStorage.setItem('glossary_selected_slate_id', this.selectedSlateId);
                this.refreshPage(leftPageX, topY);
            }
        };

        if (keyboard) {
            keyboard.on('keydown', onKeyDown);
        }

        const cleanupKeys = () => {
            if (keyboard) {
                keyboard.off('keydown', onKeyDown);
            }
            cleanupAnimations(this.scene as unknown as ScrambleContext);
        };

        this.container.once('destroy', cleanupKeys);
        this.scene.events.once('shutdown', cleanupKeys);
        this.scene.events.once('destroy', cleanupKeys);
    }

    private renderLeftList(slates: SlateDefinition[], leftPageX: number, topY: number): void {
        this.leftListItems = [];
        const col1X = leftPageX + 105;
        const col2X = leftPageX + 315;
        const spacingY = 50;

        const numRows = Math.min(6, slates.length);
        const totalHeight = (numRows - 1) * spacingY;
        const startY = (topY + 410) - (totalHeight / 2);

        slates.forEach((slate, index) => {
            const isCol2 = index >= 6;
            const itemIndex = isCol2 ? index - 6 : index;
            const cx = isCol2 ? col2X : col1X;
            const yPos = startY + itemIndex * spacingY;

            const isSelected = slate.id === this.selectedSlateId;
            const titleStr = slate.title;
            const displayText = isSelected ? `>  ${titleStr}  <` : titleStr;

            const textItem = this.scene.add.text(cx, yPos, displayText, {
                fontFamily: FONT_FAMILY,
                fontSize: isSelected ? '18px' : '15px',
                color: '#000000',
                align: 'center'
            }).setOrigin(0.5).setAlpha(isSelected ? 0.95 : 0.45).setInteractive({ useHandCursor: true });

            textItem.on('pointerover', () => {
                if (this.selectedSlateId !== slate.id) {
                    textItem.setAlpha(0.75);
                }
            });

            textItem.on('pointerout', () => {
                if (this.selectedSlateId !== slate.id) {
                    textItem.setAlpha(0.45);
                }
            });

            textItem.on('pointerdown', () => {
                if (this.selectedSlateId !== slate.id) {
                    this.selectedSlateId = slate.id;
                    localStorage.setItem('glossary_selected_slate_id', slate.id);
                    this.refreshPage(leftPageX, topY);
                }
            });

            this.container.add(textItem);
            this.leftListItems.push({ text: textItem, id: slate.id });
        });
    }

    private refreshPage(leftPageX: number, topY: number): void {
        if (!this.scene || !this.scene.sys.isActive() || !this.container.active) {
            return;
        }

        cleanupAnimations(this.scene as unknown as ScrambleContext);

        this.leftListItems.forEach(item => {
            if (!item.text || !item.text.active || !item.text.scene) return;
            const isSelected = item.id === this.selectedSlateId;
            const slate = SLATE_DEFINITIONS.find(s => s.id === item.id);
            if (slate) {
                const titleStr = slate.title;
                item.text.setText(isSelected ? `>  ${titleStr}  <` : titleStr);
                item.text.setFontSize(isSelected ? '18px' : '15px');
                item.text.setColor('#000000');
                item.text.setAlpha(isSelected ? 0.95 : 0.45);
            }
        });

        if (this.rightPageContainer && this.rightPageContainer.active) {
            this.rightPageContainer.removeAll(true);
            const rightPageX = leftPageX + 580;
            this.renderRightDetails(rightPageX + 210, topY);
        }
    }

    private renderRightDetails(cx: number, topY: number): void {
        const slate = SLATE_DEFINITIONS.find(s => s.id === this.selectedSlateId);
        if (!slate) return;

        const progress = SlateProgress.getInstance();
        const completedIds = progress.getCompletedSlates();
        const isCompleted = completedIds.includes(slate.id);

        const pageCenterY = topY + 310;
        const paragraphText = isCompleted ? slate.loreText : slate.enticingLore;

        const RUNE_NAMES = new Set([
            'Aether', 'Basalt', 'Cipher', 'Dusk', 'Echo', 'Fyre', 'Glyph', 'Hallow',
            'Ignis', 'Jinx', 'Kael', 'Lux', 'Morth', 'Nyx', 'Orin', 'Prism', 'Quell',
            'Rime', 'Sigil', 'Thorn', 'Umbra', 'Vox', 'Wyrd', 'Xael', 'Ymir', 'Zeph'
        ]);

        const tempNormal = this.scene.add.text(0, 0, '', {
            fontFamily: FONT_FAMILY,
            fontSize: '15px',
            color: '#000000'
        }).setVisible(false);

        const tempRune = this.scene.add.text(0, 0, '', {
            fontFamily: RUNE_FONT,
            fontSize: '17px',
            color: '#000000',
            stroke: '#000000',
            strokeThickness: 1
        }).setVisible(false);

        const tokenize = (word: string): { text: string; isRune: boolean; width: number }[] => {
            const leadingMatch = word.match(/^[^A-Za-z]+/);
            const leading = leadingMatch ? leadingMatch[0] : '';

            const trailingMatch = word.match(/[^A-Za-z]+$/);
            const trailing = trailingMatch ? trailingMatch[0] : '';

            const startIdx = leading.length;
            const endIdx = word.length - trailing.length;
            const core = startIdx < endIdx ? word.substring(startIdx, endIdx) : '';

            const tokens: { text: string; isRune: boolean; width: number }[] = [];
            if (leading) {
                tempNormal.setText(leading);
                tokens.push({ text: leading, isRune: false, width: tempNormal.width });
            }
            if (core) {
                const isRune = RUNE_NAMES.has(core);
                const temp = isRune ? tempRune : tempNormal;
                temp.setText(core);
                tokens.push({ text: core, isRune: isRune, width: temp.width });
            }
            if (trailing) {
                tempNormal.setText(trailing);
                tokens.push({ text: trailing, isRune: false, width: tempNormal.width });
            }
            return tokens;
        };

        tempNormal.setText(' ');
        const spaceWidth = tempNormal.width;

        const rawWords = paragraphText.split(' ');
        interface LineItem {
            text: string;
            isRune: boolean;
            width: number;
        }
        const lines: LineItem[][] = [];
        let currentLine: LineItem[] = [];
        let currentLineWidth = 0;

        for (let w = 0; w < rawWords.length; w++) {
            const wordTokens = tokenize(rawWords[w]);
            let wordWidth = 0;
            wordTokens.forEach(t => wordWidth += t.width);

            const needSpace = currentLine.length > 0;
            const addedWidth = wordWidth + (needSpace ? spaceWidth : 0);

            if (currentLineWidth + addedWidth > 360) {
                if (currentLine.length > 0) {
                    lines.push(currentLine);
                }
                currentLine = [];
                wordTokens.forEach(t => currentLine.push({ text: t.text, isRune: t.isRune, width: t.width }));
                currentLineWidth = wordWidth;
            } else {
                if (needSpace) {
                    currentLine.push({ text: ' ', isRune: false, width: spaceWidth });
                    currentLineWidth += spaceWidth;
                }
                wordTokens.forEach(t => currentLine.push({ text: t.text, isRune: t.isRune, width: t.width }));
                currentLineWidth += wordWidth;
            }
        }
        if (currentLine.length > 0) {
            lines.push(currentLine);
        }

        tempNormal.destroy();
        tempRune.destroy();

        const paraH = lines.length * 20;
 
        const headerH = 88;
        const rowsH = 6 * 24;
        const dividerH = 24;
        const totalHeight = headerH + rowsH + dividerH + paraH + 20;

        let currentY = pageCenterY - (totalHeight / 2);

        const titleText = this.scene.add.text(cx, currentY + 18, slate.title, {
            fontFamily: FONT_FAMILY,
            fontSize: '22px',
            color: '#000000',
            align: 'center'
        }).setOrigin(0.5).setAlpha(0.85);
        this.rightPageContainer.add(titleText);

        const locationStr = slate.location || 'Unknown Location';
        const statusText = isCompleted ? '[Decoded]' : '[Encrypted]';
        const metaStr = `Location: ${locationStr}    •    ${statusText}`;

        const metaText = this.scene.add.text(cx, currentY + 48, metaStr, {
            fontFamily: FONT_FAMILY,
            fontSize: '11px',
            color: '#000000',
            align: 'center'
        }).setOrigin(0.5).setAlpha(0.55);
        this.rightPageContainer.add(metaText);

        currentY += headerH;

        slate.fragments.forEach((frag, r) => {
            const rowY = currentY + r * 24 + 12;

            const numStr = (r + 1).toString();
            const numLine = this.scene.add.text(cx - 225, rowY, numStr, {
                fontFamily: FONT_FAMILY,
                fontSize: '13px',
                color: '#000000',
                align: 'center'
            }).setOrigin(0.5).setAlpha(0.25);
            this.rightPageContainer.add(numLine);

            const runicLine = this.scene.add.text(cx - 40, rowY, frag.runic, {
                fontFamily: RUNE_FONT,
                fontSize: '17px',
                color: '#000000',
                align: 'right',
                stroke: '#000000',
                strokeThickness: 1
            }).setOrigin(1, 0.5).setAlpha(0.45);
            this.rightPageContainer.add(runicLine);
 
            if (isCompleted) {
                const transLine = this.scene.add.text(cx - 10, rowY, frag.translated, {
                    fontFamily: FONT_FAMILY,
                    fontSize: '16px',
                    color: '#000000',
                    align: 'left'
                }).setOrigin(0, 0.5).setAlpha(0.45);
                this.rightPageContainer.add(transLine);
            } else {
                const dotsLine = this.scene.add.text(cx - 10, rowY, '...................', {
                    fontFamily: FONT_FAMILY,
                    fontSize: '16px',
                    color: '#000000',
                    align: 'left'
                }).setOrigin(0, 0.5).setAlpha(0.15);
                this.rightPageContainer.add(dotsLine);
            }
        });

        currentY += rowsH + 20;
 
        const hDivider = this.scene.add.rectangle(cx, currentY + 5, 320, 1, 0x000000, 0.12);
        this.rightPageContainer.add(hDivider);

        currentY += dividerH;

        let paraY = currentY;
        lines.forEach(line => {
            let lineWidth = 0;
            line.forEach(item => lineWidth += item.width);

            let itemX = cx - (lineWidth / 2);
            line.forEach(item => {
                const txt = this.scene.add.text(itemX, paraY + (item.isRune ? 0 : 2), item.text, {
                    fontFamily: item.isRune ? RUNE_FONT : FONT_FAMILY,
                    fontSize: item.isRune ? '17px' : '15px',
                    color: '#000000',
                    stroke: '#000000',
                    strokeThickness: item.isRune ? 1 : 0
                }).setOrigin(0, 0).setAlpha(isCompleted ? 0.85 : 0.65);
                this.rightPageContainer.add(txt);
                itemX += item.width;
            });
            paraY += 20;
        });
    }
}
