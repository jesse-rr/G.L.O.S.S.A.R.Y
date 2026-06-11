import * as Phaser from 'phaser';
import { PlayerData } from '../data/PlayerData';
import { NetworkManager } from '../NetworkManager';
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
    private teleportSpeedModifier: number = 1;
    private activeTweens: Phaser.Tweens.Tween[] = [];
    private activeTimers: Phaser.Time.TimerEvent[] = [];

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.group = scene.add.group();
    }

    destroy(): void {
        this.activeTweens.forEach(t => {
            if (t) t.remove();
        });
        this.activeTweens = [];
        this.activeTimers.forEach(t => {
            if (t) t.destroy();
        });
        this.activeTimers = [];
    }

    createPortal(x: number, y: number, targetMap: string, width: number = 60, height: number = 60): void {
        const portal = this.scene.add.rectangle(x, y, width, height, 0x000000, 0);
        this.scene.matter.add.gameObject(portal, { isStatic: true, isSensor: true });
        this.group.add(portal);
        portal.setData('target', targetMap);
    }

    parsePortals(portalsLayer: any, mapKey: string, previousMap: string = ''): void {
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
                const isMultiplayer = NetworkManager.getInstance().role !== 'offline';
                const baseIdx = isMultiplayer ? 0 : COVENANT_BASE_INDEX[playerData.covenant] ?? 0;
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
            } else if (mapKey === 'merchant') {
                const storedReturn = localStorage.getItem('glossary_merchant_return_map');
                targetMap = previousMap && previousMap.includes('-settlement') ? previousMap : (storedReturn || 'hub');
            } else {
                targetMap = 'hub';
            }

            if (targetMap) {
                this.createPortal(cx, cy, targetMap, width, height);
            }
        });
    }

    parseMerchantEntrances(merchantEntranceLayer: Phaser.Tilemaps.ObjectLayer | undefined): void {
        if (!merchantEntranceLayer) return;

        merchantEntranceLayer.objects.forEach((obj: any) => {
            const x = obj.x || 0;
            const y = obj.y || 0;
            const width = obj.width || 60;
            const height = obj.height || 60;
            const cx = x + width / 2;
            const cy = y + height / 2;

            const portal = this.scene.add.rectangle(cx, cy, width, height, 0x000000, 0);
            this.scene.matter.add.gameObject(portal, { isStatic: true, isSensor: true });
            this.group.add(portal);
            portal.setData('target', 'merchant');
            portal.setData('isMerchantEntrance', true);
        });
    }

    calculateSpawn(
        portalsLayer: Phaser.Tilemaps.ObjectLayer | undefined,
        merchantEntranceLayer: Phaser.Tilemaps.ObjectLayer | undefined,
        mapKey: string,
        previousMap: string,
        OFFSET: number
    ): { x: number, y: number } {
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
        } else if (mapKey === 'merchant') {
            const returnPortal = portalsLayer?.objects[0];
            if (returnPortal) {
                const pw = returnPortal.width || 60;
                const ph = returnPortal.height || 60;
                spawnX = (returnPortal.x || 0) + pw / 2;
                spawnY = (returnPortal.y || 0) + ph / 2 - OFFSET;
            }
        } else if (mapKey.includes('-settlement') && previousMap === 'merchant') {
            const entrance = merchantEntranceLayer?.objects[0];
            if (entrance) {
                const ew = entrance.width || 60;
                const eh = entrance.height || 60;
                spawnX = (entrance.x || 0) + ew / 2;
                spawnY = (entrance.y || 0) + eh / 2 + OFFSET;
            } else {
                spawnX = 0;
                spawnY = 0;
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

    onPortalOverlap(portal: Phaser.GameObjects.GameObject, _player: Phaser.Physics.Matter.Sprite, mapKey: string): void {
        if (this.isTeleporting) return;
        const targetMap = portal.getData('target');
        if (targetMap) {
            const px = (portal as Phaser.GameObjects.Rectangle).x;
            const py = (portal as Phaser.GameObjects.Rectangle).y;

            const isMerchant = portal.getData('isMerchantEntrance');
            if (isMerchant) {
                const ls = this.scene as any;
                if (ls.settlementDoors) {
                    const door = ls.settlementDoors.find((d: any) => {
                        return Phaser.Math.Distance.Between(d.centerX, d.centerY, px, py) < 50;
                    });
                    if (door && !door.opened) {
                        return;
                    }
                }
            }

            this.isTeleporting = true;
            if (targetMap === 'merchant') {
                localStorage.setItem('glossary_merchant_return_map', mapKey);
            }

            const { x: dirX, y: dirY } = this.getFixedDirection(mapKey, targetMap, isMerchant);
            this.teleportDirection = { x: dirX, y: dirY };
            if (isMerchant) {
                this.teleportSpeedModifier = 1;

                const t1 = this.scene.time.delayedCall(300, () => {
                    this.teleportSpeedModifier = 0;
                    this.scene.cameras.main.fadeOut(300, 0, 0, 0);
                });
                this.activeTimers.push(t1);

                const t2 = this.scene.time.delayedCall(600, () => {
                    this.scene.scene.restart({ mapKey: targetMap, previousMap: mapKey, entryDirX: dirX, entryDirY: dirY });
                });
                this.activeTimers.push(t2);
            } else {
                this.teleportSpeedModifier = 1;
                const t1 = this.scene.time.delayedCall(100, () => {
                    this.scene.cameras.main.fadeOut(400, 0, 0, 0);
                });
                this.activeTimers.push(t1);

                const t2 = this.scene.time.delayedCall(500, () => {
                    this.scene.scene.restart({ mapKey: targetMap, previousMap: mapKey, entryDirX: dirX, entryDirY: dirY });
                });
                this.activeTimers.push(t2);
            }
        }
    }

    private getFixedDirection(sourceMap: string, targetMap: string, isMerchant: boolean): { x: number, y: number } {
        if (isMerchant) return { x: 0, y: -1 };

        const isHub = sourceMap === 'central-hub' || sourceMap === 'hub';

        if (isHub) {
            if (targetMap.includes('boss-')) return { x: 0, y: -1 };
            if (targetMap.includes('-settlement')) return { x: -1, y: 0 };
            if (targetMap === 'summit-trade') return { x: 1, y: 0 };
        }

        if (targetMap === 'hub' || targetMap === 'central-hub') {
            if (sourceMap.includes('boss-')) return { x: 0, y: 1 };
            if (sourceMap.includes('-settlement')) return { x: 1, y: 0 };
            if (sourceMap === 'summit-trade') return { x: -1, y: 0 };
        }

        if (sourceMap === 'merchant') return { x: 0, y: 1 };

        return { x: 0, y: -1 };
    }

    getIsTeleporting(): boolean {
        return this.isTeleporting;
    }

    getTeleportDirection(): { x: number, y: number } {
        return this.teleportDirection;
    }

    getTeleportSpeedModifier(): number {
        return this.teleportSpeedModifier;
    }
}
