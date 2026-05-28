import * as Phaser from 'phaser';
import { FONT_FAMILY, RUNE_FONT } from '../constants';
import { SlateDefinition, SlateFragment, SlateProgress } from '../data/SlateData';
import { SLATE_DARK_COLORS, SLATE_LIGHT_COLORS } from '../data/SlateData';
import { showCurrencyPopup } from './ChestSystem';
import { PlayerData } from '../data/PlayerData';

interface FragmentSlot {
    container: Phaser.GameObjects.Container;
    bg: Phaser.GameObjects.Rectangle;
    runicText: Phaser.GameObjects.Text;
    index: number;
    originalIndex: number;
    targetY: number;
    isLocked: boolean;
}

interface SlotZone {
    y: number;
    index: number;
    bg: Phaser.GameObjects.Rectangle;
}

export class SlateSystem {
    private scene: Phaser.Scene;
    private parentContainer: Phaser.GameObjects.Container;
    private slate: SlateDefinition;
    private onComplete?: () => void;

    private fragmentSlots: FragmentSlot[] = [];
    private slotZones: SlotZone[] = [];
    private numIndicators: Phaser.GameObjects.Text[] = [];
    private currentOrder: number[] = [];
    private solved = false;
    private locked = false;

    private dragIndex: number = -1;
    private dragOffsetY: number = 0;

    private slateContainer!: Phaser.GameObjects.Container;
    private titleText!: Phaser.GameObjects.Text;
    private slotWidth = 500;
    private slotHeight = 36;
    private slotGap = 4;
    private startY = 0;
    private activeTweens: Phaser.Tweens.Tween[] = [];
    private activeTimers: Phaser.Time.TimerEvent[] = [];
    private colors: typeof SLATE_DARK_COLORS;
    private rewardGiven = false;
    private alreadyCompleted: boolean;

    constructor(
        scene: Phaser.Scene,
        parentContainer: Phaser.GameObjects.Container,
        slate: SlateDefinition,
        onComplete?: () => void,
        colorScheme?: string
    ) {
        this.scene = scene;
        this.parentContainer = parentContainer;
        this.slate = slate;
        this.onComplete = onComplete;
        this.colors = colorScheme === 'light' ? SLATE_LIGHT_COLORS : SLATE_DARK_COLORS;
        this.alreadyCompleted = SlateProgress.getInstance().isCompleted(slate.id);
    }

    create(centerX: number, centerY: number): void {
        if (this.alreadyCompleted) {
            this.showAlreadyCompletedLore(centerX, centerY);
            return;
        }

        this.slateContainer = this.scene.add.container(centerX, centerY);
        this.parentContainer.add(this.slateContainer);

        const totalHeight = 520;
        const totalWidth = 580;

        const slateBg = this.scene.add.rectangle(0, 0, totalWidth, totalHeight, this.colors.SLATE_BG_COLOR, 0.95)
            .setStrokeStyle(2, this.colors.SLATE_BORDER_COLOR);
        this.slateContainer.add(slateBg);

        this.titleText = this.scene.add.text(0, -totalHeight / 2 + 30, this.slate.title, {
            fontFamily: FONT_FAMILY,
            fontSize: '22px',
            color: this.colors.TITLE_COLOR,
            align: 'center',
            resolution: 2,
            letterSpacing: 6
        }).setOrigin(0.5);
        this.slateContainer.add(this.titleText);

        const numFragments = this.slate.fragments.length;
        const slotsAreaHeight = numFragments * (this.slotHeight + this.slotGap) - this.slotGap;
        this.startY = -slotsAreaHeight / 2 + 20;

        this.currentOrder = this.slate.fragments.map((_, i) => i);
        let hasFixedPoint = true;
        while (hasFixedPoint) {
            this.shuffleArray(this.currentOrder);
            hasFixedPoint = false;
            for (let i = 0; i < this.currentOrder.length; i++) {
                if (this.currentOrder[i] === i) {
                    hasFixedPoint = true;
                    break;
                }
            }
        }

        for (let i = 0; i < numFragments; i++) {
            const slotY = this.startY + i * (this.slotHeight + this.slotGap);
            const slotBg = this.scene.add.rectangle(0, slotY, this.slotWidth, this.slotHeight, this.colors.SLOT_BG_COLOR, 0.6)
                .setStrokeStyle(1, 0x444444, 0.5);
            this.slateContainer.add(slotBg);

            const numIndicator = this.scene.add.text(
                -this.slotWidth / 2 - 18, slotY,
                `${i + 1}`,
                { fontFamily: FONT_FAMILY, fontSize: '14px', color: this.colors.TEXT_DIM, resolution: 2 }
            ).setOrigin(0.5);
            this.slateContainer.add(numIndicator);
            this.numIndicators.push(numIndicator);

            this.slotZones.push({ y: slotY, index: i, bg: slotBg });
        }

        for (let i = 0; i < numFragments; i++) {
            const fragmentIndex = this.currentOrder[i];
            const fragment = this.slate.fragments[fragmentIndex];
            const slotY = this.startY + i * (this.slotHeight + this.slotGap);
            this.createFragmentSlot(fragment, fragmentIndex, i, slotY);
        }

        this.slateContainer.setAlpha(0);
        this.slateContainer.setScale(0.9);
        const entranceTween = this.scene.tweens.add({
            targets: this.slateContainer,
            alpha: 1,
            scale: 1,
            duration: 400,
            ease: 'Back.easeOut',
        });
        this.activeTweens.push(entranceTween);
    }

    private showAlreadyCompletedLore(centerX: number, centerY: number): void {
        this.slateContainer = this.scene.add.container(centerX, centerY);
        this.parentContainer.add(this.slateContainer);

        const totalHeight = 520;
        const totalWidth = 580;

        const slateBg = this.scene.add.rectangle(0, 0, totalWidth, totalHeight, this.colors.SLATE_BG_COLOR, 0.95)
            .setStrokeStyle(2, this.colors.SLATE_BORDER_COLOR);
        this.slateContainer.add(slateBg);

        this.titleText = this.scene.add.text(0, -totalHeight / 2 + 30, this.slate.title, {
            fontFamily: FONT_FAMILY,
            fontSize: '22px',
            color: this.colors.TITLE_COLOR,
            align: 'center',
            resolution: 2,
            letterSpacing: 6
        }).setOrigin(0.5);
        this.slateContainer.add(this.titleText);

        const dividerTop = this.scene.add.rectangle(0, -120, 300, 1, 0x888888, 0.4);
        this.slateContainer.add(dividerTop);

        const loreText = this.scene.add.text(0, 0, this.slate.loreText, {
            fontFamily: FONT_FAMILY,
            fontSize: '16px',
            color: this.colors.TEXT_LORE,
            align: 'center',
            wordWrap: { width: 460 },
            lineSpacing: 8,
            resolution: 2,
        }).setOrigin(0.5);
        this.slateContainer.add(loreText);

        const dividerBottom = this.scene.add.rectangle(0, 120, 300, 1, 0x888888, 0.4);
        this.slateContainer.add(dividerBottom);

        const completedLabel = this.scene.add.text(0, 165, 'press ESC to leave  •  this information can be found on the glossary info pages', {
            fontFamily: FONT_FAMILY,
            fontSize: '11px',
            color: this.colors.TEXT_DIM,
            align: 'center',
            resolution: 2,
        }).setOrigin(0.5);
        this.slateContainer.add(completedLabel);

        this.slateContainer.setAlpha(0);
        this.slateContainer.setScale(0.9);
        const entranceTween = this.scene.tweens.add({
            targets: this.slateContainer,
            alpha: 1,
            scale: 1,
            duration: 400,
            ease: 'Back.easeOut',
        });
        this.activeTweens.push(entranceTween);
    }

    private createFragmentSlot(
        fragment: SlateFragment,
        originalIndex: number,
        slotIndex: number,
        slotY: number
    ): void {
        const container = this.scene.add.container(0, slotY);

        const bg = this.scene.add.rectangle(0, 0, this.slotWidth - 8, this.slotHeight - 6, this.colors.FRAGMENT_BG_COLOR, 0.85)
            .setStrokeStyle(1, this.colors.ACCENT_GLOW, 0.3);
        container.add(bg);

        for (let d = 0; d < 3; d++) {
            const dotY = -6 + d * 6;
            const dot1 = this.scene.add.circle(-this.slotWidth / 2 + 18, dotY, 2, 0x666666, 0.6);
            const dot2 = this.scene.add.circle(-this.slotWidth / 2 + 24, dotY, 2, 0x666666, 0.6);
            container.add([dot1, dot2]);
        }

        const runicText = this.scene.add.text(0, 0, fragment.runic, {
            fontFamily: RUNE_FONT,
            fontSize: '22px',
            color: this.colors.TEXT_RUNE,
            align: 'center',
            resolution: 3,
            letterSpacing: 6,
            stroke: '#1e1e1e',
            strokeThickness: 2
        }).setOrigin(0.5).setName('runic_symbol');
        container.add(runicText);

        bg.setInteractive({ useHandCursor: true });

        bg.on('pointerover', () => {
            const slot = this.fragmentSlots.find(s => s.bg === bg);
            if (!this.locked && this.dragIndex === -1 && slot && !slot.isLocked) {
                bg.setFillStyle(this.colors.SLOT_HOVER_COLOR, 0.9);
                bg.setStrokeStyle(1, 0x888888, 0.6);
            }
        });

        bg.on('pointerout', () => {
            const slot = this.fragmentSlots.find(s => s.bg === bg);
            if (!this.locked && this.dragIndex === -1 && slot && !slot.isLocked) {
                bg.setFillStyle(this.colors.FRAGMENT_BG_COLOR, 0.85);
                bg.setStrokeStyle(1, this.colors.ACCENT_GLOW, 0.3);
            }
        });

        bg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.locked || this.solved) return;
            const slot = this.fragmentSlots.find(s => s.bg === bg);
            if (!slot || slot.isLocked) return;

            this.dragIndex = this.fragmentSlots.indexOf(slot);
            this.dragOffsetY = pointer.y - this.slateContainer.y - container.y;

            bg.setFillStyle(this.colors.FRAGMENT_DRAG_COLOR, 0.95);
            bg.setStrokeStyle(2, 0x888888, 0.8);
            container.setDepth(100);
        });

        this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.dragIndex === -1 || this.locked) return;
            const slot = this.fragmentSlots[this.dragIndex];
            if (!slot) return;

            const localY = pointer.y - this.slateContainer.y - this.dragOffsetY;
            slot.container.y = localY;

            const nearestSlot = this.getNearestSlotIndex(localY);
            this.slotZones.forEach((sz, idx) => {
                if (idx === nearestSlot) {
                    sz.bg.setFillStyle(this.colors.SLOT_HOVER_COLOR, 0.5);
                } else {
                    sz.bg.setFillStyle(this.colors.SLOT_BG_COLOR, 0.6);
                }
            });
        });

        this.scene.input.on('pointerup', () => {
            if (this.dragIndex === -1 || this.locked) return;
            const slot = this.fragmentSlots[this.dragIndex];
            if (!slot) { this.dragIndex = -1; return; }

            const localY = slot.container.y;
            const targetSlotIndex = this.getNearestSlotIndex(localY);
            const currentSlotIndex = this.getSlotIndexOfFragment(this.dragIndex);

            const targetSlotLocked = this.isSlotLocked(targetSlotIndex);
            if (targetSlotIndex !== currentSlotIndex && !targetSlotLocked) {
                this.swapFragments(currentSlotIndex, targetSlotIndex);
            }

            slot.bg.setFillStyle(this.colors.FRAGMENT_BG_COLOR, 0.85);
            slot.bg.setStrokeStyle(1, this.colors.ACCENT_GLOW, 0.3);
            slot.container.setDepth(0);

            this.animateToPositions();

            this.slotZones.forEach(sz => {
                sz.bg.setFillStyle(this.colors.SLOT_BG_COLOR, 0.6);
            });

            this.dragIndex = -1;

            this.checkAndLockCorrectFragments();

            if (this.isCorrectOrder() && !this.solved) {
                this.solved = true;
                this.onSolved();
            }
        });

        this.slateContainer.add(container);

        const slot: FragmentSlot = {
            container,
            bg,
            runicText,
            index: slotIndex,
            originalIndex,
            targetY: slotY,
            isLocked: false,
        };

        this.fragmentSlots.push(slot);
    }

    private getNearestSlotIndex(y: number): number {
        let closest = 0;
        let closestDist = Infinity;
        for (let i = 0; i < this.slotZones.length; i++) {
            const dist = Math.abs(y - this.slotZones[i].y);
            if (dist < closestDist) {
                closestDist = dist;
                closest = i;
            }
        }
        return closest;
    }

    private getSlotIndexOfFragment(fragArrayIndex: number): number {
        const frag = this.fragmentSlots[fragArrayIndex];
        return this.currentOrder.indexOf(frag.originalIndex);
    }

    private swapFragments(fromSlot: number, toSlot: number): void {
        const temp = this.currentOrder[fromSlot];
        this.currentOrder[fromSlot] = this.currentOrder[toSlot];
        this.currentOrder[toSlot] = temp;
    }

    private isSlotLocked(slotIndex: number): boolean {
        const origIdx = this.currentOrder[slotIndex];
        const frag = this.fragmentSlots.find(f => f.originalIndex === origIdx);
        return frag ? frag.isLocked : false;
    }

    private checkAndLockCorrectFragments(): void {
        for (let slotIdx = 0; slotIdx < this.currentOrder.length; slotIdx++) {
            const origIdx = this.currentOrder[slotIdx];
            if (origIdx !== slotIdx) continue;

            const frag = this.fragmentSlots.find(f => f.originalIndex === origIdx);
            if (!frag || frag.isLocked) continue;

            frag.isLocked = true;
            frag.bg.disableInteractive();
            frag.bg.setFillStyle(this.colors.FRAGMENT_LOCKED_COLOR, 0.95);
            frag.bg.setStrokeStyle(1, this.colors.ACCENT_LOCKED, 0.7);
            frag.runicText.setColor('#7a8a7a');

            this.slotZones[slotIdx].bg.setFillStyle(this.colors.SLOT_CORRECT_COLOR, 0.5);
            this.slotZones[slotIdx].bg.setStrokeStyle(1, this.colors.ACCENT_LOCKED, 0.4);

            const flashTween = this.scene.tweens.add({
                targets: frag.bg,
                alpha: { from: 0.7, to: 1 },
                yoyo: true,
                duration: 200,
                ease: 'Sine.easeInOut',
            });
            this.activeTweens.push(flashTween);
        }
    }

    private animateToPositions(): void {
        for (let slotIdx = 0; slotIdx < this.currentOrder.length; slotIdx++) {
            const origIdx = this.currentOrder[slotIdx];
            const frag = this.fragmentSlots.find(f => f.originalIndex === origIdx);
            if (!frag) continue;

            const targetY = this.startY + slotIdx * (this.slotHeight + this.slotGap);
            frag.targetY = targetY;
            frag.index = slotIdx;

            const tween = this.scene.tweens.add({
                targets: frag.container,
                y: targetY,
                duration: 250,
                ease: 'Back.easeOut',
            });
            this.activeTweens.push(tween);
        }
    }

    private isCorrectOrder(): boolean {
        for (let i = 0; i < this.currentOrder.length; i++) {
            if (this.currentOrder[i] !== i) return false;
        }
        return true;
    }

    private onSolved(): void {
        this.locked = true;

        this.fragmentSlots.forEach(f => {
            f.container.disableInteractive();
        });

        this.slotZones.forEach(sz => {
            sz.bg.setFillStyle(this.colors.SLOT_CORRECT_COLOR, 0.6);
            const flashTween = this.scene.tweens.add({
                targets: sz.bg,
                alpha: { from: 0.4, to: 1 },
                yoyo: true,
                duration: 300,
                ease: 'Sine.easeInOut',
            });
            this.activeTweens.push(flashTween);
        });

        if (!this.alreadyCompleted) {
            if (!this.rewardGiven) {
                this.rewardGiven = true;
                PlayerData.getInstance().gemstones += 10;
                PlayerData.getInstance().save();

                const levelScene = this.scene.scene.get('LevelScene') as Phaser.Scene;
                if (levelScene) {
                    showCurrencyPopup(levelScene, 10, 0);
                } else {
                    showCurrencyPopup(this.scene, 10, 0);
                }
            }
            SlateProgress.getInstance().completeSlate(this.slate.id);
            this.alreadyCompleted = true;
        }

        this.scene.time.delayedCall(500, () => {
            this.playTranslationSequence();
        });
    }

    private playTranslationSequence(): void {
        const orderedFragments = this.currentOrder.map(idx =>
            this.fragmentSlots.find(f => f.originalIndex === idx)!
        );

        let delay = 0;
        const lineDelay = 300;

        orderedFragments.forEach((frag, lineIndex) => {
            const timer = this.scene.time.delayedCall(delay, () => {
                this.scrambleTranslateLine(frag, lineIndex);
            });
            this.activeTimers.push(timer);
            delay += lineDelay;
        });

        const loreTimer = this.scene.time.delayedCall(delay + 300, () => {
            this.showLoreReveal();
        });
        this.activeTimers.push(loreTimer);
    }

    private scrambleTranslateLine(frag: FragmentSlot, _lineIndex: number): void {
        const finalText = this.slate.fragments[frag.originalIndex].translated;
        const runicText = frag.runicText;

        let elapsed = 0;
        const totalDuration = 600;
        const stepDelay = 30;
        const totalSteps = Math.floor(totalDuration / stepDelay);
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

        const glowTween = this.scene.tweens.add({
            targets: frag.bg,
            alpha: { from: 0.6, to: 1 },
            duration: 300,
            yoyo: true,
            ease: 'Sine.easeInOut',
        });
        this.activeTweens.push(glowTween);

        frag.bg.setStrokeStyle(2, 0xd4a574, 0.8);

        const timer = this.scene.time.addEvent({
            delay: stepDelay,
            repeat: totalSteps - 1,
            callback: () => {
                elapsed++;
                const linearProgress = elapsed / totalSteps;
                const easedProgress = linearProgress < 0.5
                    ? 2 * linearProgress * linearProgress
                    : 1 - Math.pow(-2 * linearProgress + 2, 2) / 2;

                if (easedProgress > 0.3) {
                    runicText.setFontFamily(FONT_FAMILY);
                    runicText.setStroke('#000000', 0);
                    runicText.setColor(this.colors.TEXT_TRANSLATED);
                    runicText.setFontSize('18px');
                }

                let scrambled = '';
                for (let i = 0; i < finalText.length; i++) {
                    if (finalText[i] === ' ' || finalText[i] === '\n') {
                        scrambled += finalText[i];
                    } else {
                        if (Math.random() < easedProgress) {
                            scrambled += finalText[i];
                        } else {
                            scrambled += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                    }
                }
                runicText.setText(scrambled);

                if (elapsed === totalSteps) {
                    runicText.setText(finalText);
                    runicText.setFontFamily(FONT_FAMILY);
                    runicText.setColor(this.colors.TEXT_TRANSLATED);
                    runicText.setFontSize('18px');
                    runicText.setStroke('#000000', 0);

                    frag.bg.setFillStyle(this.colors.SLOT_CORRECT_COLOR, 0.7);
                    frag.bg.setStrokeStyle(1, 0x4a7a4a, 0.6);
                }
            }
        });
        this.activeTimers.push(timer);
    }

    private showLoreReveal(): void {
        if (!this.alreadyCompleted) {
            SlateProgress.getInstance().completeSlate(this.slate.id);
        }

        this.fragmentSlots.forEach(frag => {
            const fadeTween = this.scene.tweens.add({
                targets: frag.container,
                alpha: 0,
                duration: 600,
                ease: 'Sine.easeOut',
            });
            this.activeTweens.push(fadeTween);
        });

        this.slotZones.forEach(sz => {
            const fadeTween = this.scene.tweens.add({
                targets: sz.bg,
                alpha: 0,
                duration: 600,
                ease: 'Sine.easeOut',
            });
            this.activeTweens.push(fadeTween);
        });

        this.numIndicators.forEach(ni => {
            const fadeTween = this.scene.tweens.add({
                targets: ni,
                alpha: 0,
                duration: 600,
                ease: 'Sine.easeOut',
            });
            this.activeTweens.push(fadeTween);
        });

        const revealTimer = this.scene.time.delayedCall(800, () => {
            this.renderLoreText();
        });
        this.activeTimers.push(revealTimer);
    }

    private renderLoreText(): void {
        this.titleText.setText(this.slate.title);

        const dividerTop = this.scene.add.rectangle(0, -120, 300, 1, 0x888888, 0.4);
        this.slateContainer.add(dividerTop);

        const loreText = this.scene.add.text(0, 0, this.slate.loreText, {
            fontFamily: FONT_FAMILY,
            fontSize: '16px',
            color: this.colors.TEXT_LORE,
            align: 'center',
            wordWrap: { width: 460 },
            lineSpacing: 8,
            resolution: 2,
        }).setOrigin(0.5).setAlpha(0);
        this.slateContainer.add(loreText);

        const dividerBottom = this.scene.add.rectangle(0, 120, 300, 1, 0x888888, 0.4).setAlpha(0);
        this.slateContainer.add(dividerBottom);

        const completedLabel = this.scene.add.text(0, 165, 'press ESC to leave  •  this information can be found on the glossary info pages', {
            fontFamily: FONT_FAMILY,
            fontSize: '11px',
            color: this.colors.TEXT_DIM,
            align: 'center',
            resolution: 2,
        }).setOrigin(0.5).setAlpha(0);
        this.slateContainer.add(completedLabel);

        const loreTween = this.scene.tweens.add({
            targets: [loreText, dividerTop, dividerBottom, completedLabel],
            alpha: 1,
            duration: 1000,
            ease: 'Sine.easeIn',
        });
        this.activeTweens.push(loreTween);
    }

    private shuffleArray<T>(arr: T[]): void {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    destroy(): void {
        this.activeTweens.forEach(t => {
            if (t && t.isPlaying()) t.stop();
        });
        this.activeTweens = [];

        this.activeTimers.forEach(t => {
            if (t) t.destroy();
        });
        this.activeTimers = [];

        if (this.slateContainer) {
            this.slateContainer.destroy();
        }
    }
}