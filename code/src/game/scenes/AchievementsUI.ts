import * as Phaser from 'phaser';
import { UserData } from '../data/UserData';

const CUBE_SIZE = 50.5;
const FONT_FAMILY = 'VCRosdNEUE';

const CUBE_POSITIONS = [
    { x: 246, y: 107.5 },
    { x: 214, y: 171.5 },
    { x: 278, y: 171.5 },
    { x: 182, y: 235.5 },
    { x: 246, y: 235.5 },
    { x: 310, y: 235.5 }
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
    private overlayToIndex: number[] = [];

    tooltipBg!: Phaser.GameObjects.Rectangle;
    tooltipText!: Phaser.GameObjects.Text;
    tooltipVisible: boolean = false;

    constructor() {
        super('AchievementsUI');
    }

    create(data: any) {
        this.parentScene = data.scene;
        this.baseX = data.x;
        this.baseY = data.y;
        this.imgScale = data.scale || 2;

        const playerData = UserData.getInstance();

        this.tooltipBg = this.add.rectangle(0, 0, 400, 80, 0x000000, 0.8)
            .setOrigin(0, 0)
            .setVisible(false)
            .setDepth(1000);

        this.tooltipText = this.add.text(0, 0, '', {
            fontSize: '22px',
            color: '#847E87',
            fontFamily: FONT_FAMILY,
            wordWrap: { width: 380 },
            lineSpacing: 6
        })
        .setResolution(10)
        .setOrigin(0, 0)
        .setVisible(false)
        .setDepth(1001);

        CUBE_POSITIONS.forEach((pos, i) => {
            const achievement = playerData.achievements[i];
            const locked = !achievement || !achievement.unlocked;

            if (locked) {
                const size = Math.round(CUBE_SIZE * this.imgScale);

                const x = Math.round(this.baseX + pos.x * this.imgScale);
                const y = Math.round(this.baseY + pos.y * this.imgScale);

                const overlay = this.add.rectangle(x, y, size, size, 0x000000, 0.75)
                    .setOrigin(0.5)
                    .setDepth(100)
                    .setInteractive({ useHandCursor: true });

                overlay.on('pointerover', () => {
                    const scrollY = this.parentScene.cameras.main.scrollY;

                    const worldX = x;
                    const worldY = y - scrollY;

                    this.showTooltip(i, worldX, worldY);
                });

                overlay.on('pointerout', () => {
                    this.hideTooltip();
                });

                this.overlays.push(overlay);
                this.overlayToIndex.push(i);
            }
        });
    }

    private showTooltip(index: number, x: number, y: number) {
        const text = ACHIEVEMENT_TOOLTIPS[index];

        this.tooltipText.setText(text);

        const bounds = this.tooltipText.getBounds();

        const tooltipWidth = bounds.width + 20;
        const tooltipHeight = bounds.height + 20;

        const offsetX = 20;

        const bgX = x - tooltipWidth - offsetX;
        const bgY = y - tooltipHeight / 2;

        this.tooltipBg.setPosition(bgX, bgY);
        this.tooltipBg.setSize(tooltipWidth, tooltipHeight);
        this.tooltipBg.setVisible(true);

        this.tooltipText.setPosition(bgX + 10, bgY + 10);
        this.tooltipText.setVisible(true);

        this.tooltipVisible = true;
    }

    private hideTooltip() {
        this.tooltipBg.setVisible(false);
        this.tooltipText.setVisible(false);
        this.tooltipVisible = false;
    }

    update() {
        const scrollY = this.parentScene.cameras.main.scrollY;

        this.overlays.forEach((overlay, i) => {
            const index = this.overlayToIndex[i];
            const pos = CUBE_POSITIONS[index];
            const size = Math.round(CUBE_SIZE * this.imgScale);

            const x = Math.round(this.baseX + pos.x * this.imgScale);
            const y = Math.round(this.baseY + pos.y * this.imgScale - scrollY);

            overlay.setPosition(x, y);
        });
    }
}