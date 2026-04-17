import * as Phaser from 'phaser';
import { PlayerData } from '../data/PlayerData';

const CUBE_SIZE = 50.5;

const CUBE_POSITIONS = [
    { x: 141, y: 126.5 },
    { x: 110, y: 190.5 },
    { x: 175, y: 190.5 },
    { x: 77, y: 254.5 },
    { x: 141, y: 254.5 },
    { x: 205, y: 254.5 }
];

const ACHIEVEMENT_TOOLTIPS = [
    "Mastered: Unlocked every rune, item, boss, enemy, and location. True completion!",
    "Greed Unleashed: Collected every rune and item through relentless pursuit.",
    "Covenant Conqueror: Chose all three covenants in your journey.",
    "Cat Mode: Discovered and unlocked the secret cat mode.",
    "Champion: Achieved ultimate victory.",
    "Defeat: Faced loss, but every end is a new beginning."
];

export class AchievementsUI extends Phaser.Scene {

    private baseX = 0;
    private baseY = 0;
    private imgScale = 2;
    private parentScene!: Phaser.Scene;
    private overlays: Phaser.GameObjects.Rectangle[] = [];

    constructor() {
        super('AchievementsUI');
    }

    create(data: any) {
        this.parentScene = data.scene;
        this.baseX = data.x;
        this.baseY = data.y;
        this.imgScale = data.scale || 2;

        const playerData = PlayerData.getInstance();

        // Tooltip setup (hidden by default)
        this.tooltipBg = this.add.rectangle(0, 0, 400, 80, 0x000000, 0.8)
            .setOrigin(0, 0)
            .setVisible(false)
            .setDepth(100);
        this.tooltipText = this.add.text(0, 0, '', {
            fontSize: '22px',
            color: '#847E87',
            fontFamily: 'font',
            wordWrap: { width: 380 },
            lineSpacing: 6,
            align: 'left'
        }).setOrigin(0, 0).setVisible(false).setDepth(101);

        CUBE_POSITIONS.forEach((pos, i) => {
            const achievement = playerData.achievements[i];
            const locked = !achievement || !achievement.unlocked;

            if (locked) {
                const size = Math.round(CUBE_SIZE * this.imgScale);
                const halfSize = size / 2;
                const screenX = Math.round(this.baseX + pos.x * this.imgScale - halfSize);
                const screenY = Math.round(this.baseY + pos.y * this.imgScale - halfSize);

                const overlay = this.add.rectangle(screenX, screenY, size, size, 0x000000, 0.75)
                    .setOrigin(0.5)
                    .setDepth(10)
                    .setInteractive({ useHandCursor: true })
                    .on('pointerover', () => this.showTooltip(i, screenY))
                    .on('pointerout', () => this.hideTooltip());

                this.overlays.push(overlay);
            }
        });
    }

    private showTooltip(index: number, y: number) {
        if (!this.tooltipBg || !this.tooltipText) return;
        const text = ACHIEVEMENT_TOOLTIPS[index];
        this.tooltipText.setText(text);
        this.tooltipText.setPosition(40, y - 20); // 40px from left, aligned with cube
        this.tooltipText.setVisible(true);
        // Adjust background size to text
        const bounds = this.tooltipText.getBounds();
        this.tooltipBg.setPosition(bounds.x - 10, bounds.y - 10);
        this.tooltipBg.setSize(bounds.width + 20, bounds.height + 20);
        this.tooltipBg.setVisible(true);
        this.tooltipVisible = true;
    }

    private hideTooltip() {
        if (!this.tooltipBg || !this.tooltipText) return;
        this.tooltipBg.setVisible(false);
        this.tooltipText.setVisible(false);
        this.tooltipVisible = false;
    }

    update() {
        const scrollY = (this.parentScene.cameras.main as any).scrollY;

        this.overlays.forEach((overlay, i) => {
            const pos = CUBE_POSITIONS[this.getLockedIndex(i)];
            const size = Math.round(CUBE_SIZE * this.imgScale);
            const halfSize = size / 2;
            overlay.setPosition(
                Math.round(this.baseX + pos.x * this.imgScale - halfSize),
                Math.round(this.baseY + pos.y * this.imgScale - halfSize - scrollY)
            );
        });
    }

    private getLockedIndex(overlayIndex: number): number {
        const playerData = PlayerData.getInstance();
        let lockedCount = 0;
        for (let i = 0; i < CUBE_POSITIONS.length; i++) {
            const achievement = playerData.achievements[i];
            if (!achievement || !achievement.unlocked) {
                if (lockedCount === overlayIndex) return i;
                lockedCount++;
            }
        }
        return 0;
    }
}
