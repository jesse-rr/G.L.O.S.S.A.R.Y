import * as Phaser from 'phaser';
import { UserData } from '../../data/UserData';

const CUBE_SIZE = 50.5;
import { FONT_FAMILY } from '../../constants';
import { ScrollableScene } from '../../types';
import { AudioManager } from '../../utils/AudioManager';

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
    private hitZones: Phaser.GameObjects.Rectangle[] = [];
    private overlays: Phaser.GameObjects.Rectangle[] = [];
    private overlayToIndex: number[] = [];
    tooltipBg!: Phaser.GameObjects.Rectangle;
    tooltipText!: Phaser.GameObjects.Text;
    tooltipVisible: boolean = false;
    private currentHoveredIndex: number | null = null;
    private audioManager!: AudioManager;

    constructor() {
        super('AchievementsUI');
    }

    preload() {
        this.audioManager = new AudioManager(this);
        this.audioManager.loadAudio();
    }

    create(data: any) {
        this.parentScene = data.scene;
        this.baseX = data.x;
        this.baseY = data.y;
        this.imgScale = data.scale || 2;

        this.hitZones = [];
        this.overlays = [];
        this.overlayToIndex = [];
        this.currentHoveredIndex = null;

        const userData = this.registry.get('userData') as UserData;

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
            .setOrigin(0, 0)
            .setVisible(false)
            .setDepth(1001);

        CUBE_POSITIONS.forEach((pos, i) => {
            const size = Math.round(CUBE_SIZE * this.imgScale);
            const x = Math.round(this.baseX + pos.x * this.imgScale);
            const y = Math.round(this.baseY + pos.y * this.imgScale);

            const hitZone = this.add.rectangle(x, y, size, size, 0x000000, 0)
                .setOrigin(0.5)
                .setDepth(99)
                .setInteractive({ useHandCursor: true });

            hitZone.on('pointerover', () => {
                this.audioManager.uiClick();
                this.currentHoveredIndex = i;
                const scrollY = this.parentScene.cameras.main.scrollY;
                this.showTooltip(i, x, y - scrollY);
            });

            hitZone.on('pointerout', () => {
                this.currentHoveredIndex = null;
                this.hideTooltip();
            });

            this.hitZones.push(hitZone);

            const achievement = userData.achievements[i];
            if (!achievement || !achievement.unlocked) {
                const overlay = this.add.rectangle(x, y, size, size, 0x000000, 0.75)
                    .setOrigin(0.5)
                    .setDepth(100);
                this.overlays.push(overlay);
                this.overlayToIndex.push(i);
            }
        });

        this.input.on('wheel', (_: any, __: any, ___: number, dy: number) => {
            const parent = this.parentScene as ScrollableScene;
            parent.scrollY += dy;
            parent.scrollY = Phaser.Math.Clamp(parent.scrollY, 0, parent.maxScroll);
            parent.cameras.main.scrollY = Math.floor(parent.scrollY);
        });

        this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
            if (p.isDown) {
                const parent = this.parentScene as ScrollableScene;
                if (parent && parent.scrollY !== undefined) {
                    parent.scrollY -= p.velocity.y / 10;
                    parent.scrollY = Phaser.Math.Clamp(parent.scrollY, 0, parent.maxScroll);
                    parent.cameras.main.scrollY = Math.floor(parent.scrollY);
                }
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
        const userData = this.registry.get('userData') as UserData;
        const scrollY = this.parentScene.cameras.main.scrollY;

        for (let i = this.overlays.length - 1; i >= 0; i--) {
            const overlay = this.overlays[i];
            const index = this.overlayToIndex[i];
            const achievement = userData.achievements[index];

            if (achievement && achievement.unlocked) {
                overlay.destroy();
                this.overlays.splice(i, 1);
                this.overlayToIndex.splice(i, 1);
                continue;
            }

            const pos = CUBE_POSITIONS[index];
            const x = Math.round(this.baseX + pos.x * this.imgScale);
            const y = Math.round(this.baseY + pos.y * this.imgScale - scrollY);
            overlay.setPosition(x, y);
        }

        for (let i = 0; i < this.hitZones.length; i++) {
            const pos = CUBE_POSITIONS[i];
            const x = Math.round(this.baseX + pos.x * this.imgScale);
            const y = Math.round(this.baseY + pos.y * this.imgScale - scrollY);
            this.hitZones[i].setPosition(x, y);
        }

        if (this.tooltipVisible && this.currentHoveredIndex !== null) {
            const index = this.currentHoveredIndex;
            const pos = CUBE_POSITIONS[index];
            const x = Math.round(this.baseX + pos.x * this.imgScale);
            const y = Math.round(this.baseY + pos.y * this.imgScale - scrollY);
            this.showTooltip(index, x, y);
        }
    }
}