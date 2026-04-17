import * as Phaser from 'phaser';
import { PlayerData } from '../data/PlayerData';

const CUBE_SIZE = 55;

const CUBE_POSITIONS = [
    { x: 117, y: 100 },
    { x: 86, y: 172 },
    { x: 150, y: 172 },
    { x: 57, y: 244 },
    { x: 121, y: 244 },
    { x: 185, y: 244 }
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

        CUBE_POSITIONS.forEach((pos, i) => {
            const achievement = playerData.achievements[i];
            const locked = !achievement || !achievement.unlocked;

            if (locked) {
                const screenX = this.baseX + pos.x * this.imgScale;
                const screenY = this.baseY + pos.y * this.imgScale;
                const size = CUBE_SIZE * this.imgScale;

                const overlay = this.add.rectangle(screenX, screenY, size, size, 0x000000, 0.75)
                    .setOrigin(0.5)
                    .setDepth(10);

                this.overlays.push(overlay);
            }
        });
    }

    update() {
        const scrollY = (this.parentScene.cameras.main as any).scrollY;

        this.overlays.forEach((overlay, i) => {
            const pos = CUBE_POSITIONS[this.getLockedIndex(i)];
            overlay.setPosition(
                this.baseX + pos.x * this.imgScale,
                this.baseY + pos.y * this.imgScale - scrollY
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
