import * as Phaser from 'phaser';
import { PlayerData } from '../data/PlayerData';
import {
    SETTLEMENT_ROTATION,
    BOSS_FLOOR_ROTATION,
    COVENANT_BASE_INDEX
} from '../constants';

export class PortalSystem {
    private scene: Phaser.Scene;
    private group: Phaser.GameObjects.Group;
    private isTeleporting: boolean = false;
    private teleportDirection: { x: number, y: number } = { x: 0, y: 0 };

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.group = scene.add.group();
    }

    createPortal(x: number, y: number, targetMap: string, width: number = 60, height: number = 60): void {
        const portal = this.scene.add.rectangle(x, y, width, height, 0x000000, 0);
        this.scene.matter.add.gameObject(portal, { isStatic: true, isSensor: true });
        this.group.add(portal);
        portal.setData('target', targetMap);
    }

    parsePortals(portalsLayer: any, mapKey: string): void {
        if (!portalsLayer) return;

        portalsLayer.objects.forEach((obj: any) => {
            const x = obj.x || 0;
            const y = obj.y || 0;
            const width = obj.width || 60;
            const height = obj.height || 60;
            const cx = x + width / 2;
            const cy = y + height / 2;

            let targetMap = '';

            if (mapKey === 'central-hub' || mapKey === 'hub') {
                const playerData = PlayerData.getInstance();
                const baseIdx = COVENANT_BASE_INDEX[playerData.covenant] ?? 0;
                const floorOffset = playerData.currentFloor - 1;
                const rotatedIdx = (baseIdx + floorOffset) % 3;

                if (y < -500) {
                    targetMap = BOSS_FLOOR_ROTATION[rotatedIdx];
                } else if (x < -100) {
                    targetMap = SETTLEMENT_ROTATION[rotatedIdx];
                } else if (x > 100) {
                    targetMap = 'summit-trade';
                } else {
                    return;
                }
            } else {
                targetMap = 'hub';
            }

            if (targetMap) {
                this.createPortal(cx, cy, targetMap, width, height);
            }
        });
    }

    calculateSpawn(portalsLayer: any, mapKey: string, previousMap: string, OFFSET: number): { x: number, y: number } {
        let spawnX = 0, spawnY = 0;

        if (mapKey === 'central-hub' || mapKey === 'hub') {
            if (previousMap.includes('boss-')) {
                const topPortal = portalsLayer?.objects.find((o: any) => (o.y || 0) < -500);
                if (topPortal) {
                    const pw = topPortal.width || 60;
                    const ph = topPortal.height || 60;
                    spawnX = (topPortal.x || 0) + pw / 2;
                    spawnY = (topPortal.y || 0) + ph / 2 + OFFSET;
                }
            } else if (previousMap.includes('-settlement')) {
                const leftPortal = portalsLayer?.objects.find((o: any) => (o.x || 0) < -100 && (o.y || 0) > -500);
                if (leftPortal) {
                    const pw = leftPortal.width || 60;
                    const ph = leftPortal.height || 60;
                    spawnX = (leftPortal.x || 0) + pw / 2 + OFFSET;
                    spawnY = (leftPortal.y || 0) + ph / 2;
                }
            } else if (previousMap === 'summit-trade') {
                const rightPortal = portalsLayer?.objects.find((o: any) => (o.x || 0) > 100);
                if (rightPortal) {
                    const pw = rightPortal.width || 60;
                    const ph = rightPortal.height || 60;
                    spawnX = (rightPortal.x || 0) + pw / 2 - OFFSET;
                    spawnY = (rightPortal.y || 0) + ph / 2;
                }
            } else {
                spawnX = 0;
                spawnY = -30;
            }
        } else {
            const returnPortal = portalsLayer?.objects[0];
            if (returnPortal) {
                const pw = returnPortal.width || 60;
                const ph = returnPortal.height || 60;
                const px = (returnPortal.x || 0) + pw / 2;
                const py = (returnPortal.y || 0) + ph / 2;

                if (mapKey.includes('boss-')) {
                    spawnX = px;
                    spawnY = py - OFFSET;
                } else if (mapKey.includes('-settlement')) {
                    spawnX = px - OFFSET;
                    spawnY = py;
                } else if (mapKey === 'summit-trade') {
                    spawnX = px + OFFSET;
                    spawnY = py;
                } else {
                    spawnX = px;
                    spawnY = py;
                }
            }
        }

        return { x: spawnX, y: spawnY };
    }

    onPortalOverlap(portal: Phaser.GameObjects.GameObject, player: Phaser.Physics.Matter.Sprite, mapKey: string): void {
        if (this.isTeleporting) return;
        const targetMap = portal.getData('target');
        if (targetMap) {
            this.isTeleporting = true;

            const px = (portal as Phaser.GameObjects.Rectangle).x;
            const py = (portal as Phaser.GameObjects.Rectangle).y;

            let dirX = 0; let dirY = 0;
            if (Math.abs(player.x - px) > Math.abs(player.y - py)) {
                dirX = player.x < px ? 1 : -1;
            } else {
                dirY = player.y < py ? 1 : -1;
            }
            this.teleportDirection = { x: dirX, y: dirY };

            this.scene.time.delayedCall(100, () => {
                this.scene.cameras.main.fadeOut(400, 0, 0, 0);
            });

            this.scene.time.delayedCall(500, () => {
                this.scene.scene.restart({ mapKey: targetMap, previousMap: mapKey, entryDirX: dirX, entryDirY: dirY });
            });
        }
    }

    getIsTeleporting(): boolean {
        return this.isTeleporting;
    }

    getTeleportDirection(): { x: number, y: number } {
        return this.teleportDirection;
    }
}
