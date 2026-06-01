import * as Phaser from 'phaser';
import { InteractSystem } from './InteractSystem';
import { MatterScene, DOOR_INTERACT_DISTANCE } from '../types';

export interface SettlementDoorTile {
    layer: Phaser.Tilemaps.TilemapLayer;
    tileX: number;
    tileY: number;
    flipX: boolean;
    flipY: boolean;
    rotation: number;
}

export interface SettlementDoor {
    doorId: string;
    tiles: SettlementDoorTile[];
    opened: boolean;
    centerX: number;
    centerY: number;
    bottomY: number;
    width: number;
    body: MatterJS.BodyType | null;
    zone: Phaser.GameObjects.Zone;
}

const STORAGE_KEY = 'glossary_settlement_doors';

function getOpenedDoors(): Set<string> {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) return new Set(JSON.parse(data));
    } catch (e) { }
    return new Set();
}

function saveDoorState(doorId: string, opened: boolean) {
    const openedDoors = getOpenedDoors();
    if (opened) {
        openedDoors.add(doorId);
    } else {
        openedDoors.delete(doorId);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(openedDoors)));
}

const DOOR_GID_MAPPING: Record<number, number> = {
    214: 215,
    254: 255,
    215: 214,
    255: 254
};

function mapGid(origGid: number, targetOpened: boolean): number {
    const cleanGid = origGid & 0x0fffffff;
    const isCurrentlyOpen = cleanGid === 215 || cleanGid === 255;
    if (isCurrentlyOpen === targetOpened) return origGid;

    const mapped = DOOR_GID_MAPPING[cleanGid];
    if (mapped !== undefined) {
        const flags = origGid & 0xf0000000;
        return mapped | flags;
    }
    return origGid;
}

function updateDoorTilesVisuals(door: SettlementDoor, targetOpened: boolean) {
    for (const t of door.tiles) {
        const currentTile = t.layer.getTileAt(t.tileX, t.tileY);
        if (currentTile) {
            const newIndex = mapGid(currentTile.index, targetOpened);
            if (newIndex !== currentTile.index) {
                const placed = t.layer.putTileAt(newIndex, t.tileX, t.tileY);
                if (placed) {
                    placed.flipX = t.flipX;
                    placed.flipY = t.flipY;
                    placed.rotation = t.rotation;
                    const collides = !targetOpened;
                    placed.setCollision(collides, collides, collides, collides);
                }
            } else {
                const collides = !targetOpened;
                currentTile.setCollision(collides, collides, collides, collides);
            }
        }
    }
}

export function createSettlementDoors(
    scene: Phaser.Scene,
    map: Phaser.Tilemaps.Tilemap,
    mapKey: string
): SettlementDoor[] {
    if (mapKey !== 'desert-settlement') {
        return [];
    }

    const doors: SettlementDoor[] = [];
    const openedSet = getOpenedDoors();

    const merchantLayer = map.objects.find(l => l.name === 'merchant_entrance');
    if (!merchantLayer || !merchantLayer.objects.length) {
        return [];
    }

    const targetGids = new Set([214, 215, 254, 255]);
    const matchedTileKeys = new Set<string>();

    for (const obj of merchantLayer.objects) {
        const px = obj.x!;
        const py = obj.y!;
        const tileX = Math.floor(px / 32);
        const tileY = Math.floor(py / 32);

        const baseWorldX = Math.floor(px / 32) * 32;
        const baseWorldY = Math.floor(py / 32) * 32;

        const doorTiles: SettlementDoorTile[] = [];

        map.layers.forEach(layerData => {
            const layer = layerData.tilemapLayer;
            if (!layer) return;

            for (let dy = -1; dy <= 2; dy++) {
                for (let dx = -1; dx <= 2; dx++) {
                    const targetWorldX = baseWorldX + dx * 32;
                    const targetWorldY = baseWorldY + dy * 32;
                    const tx = layer.worldToTileX(targetWorldX);
                    const ty = layer.worldToTileY(targetWorldY);

                    const tile = layer.getTileAt(tx, ty);
                    if (tile && tile.index > 0) {
                        const realGid = tile.index & 0x0fffffff;
                        if (targetGids.has(realGid)) {
                            const tileKey = `${layerData.name}_${tx}_${ty}`;
                            if (!matchedTileKeys.has(tileKey)) {
                                doorTiles.push({
                                    layer,
                                    tileX: tx,
                                    tileY: ty,
                                    flipX: tile.flipX,
                                    flipY: tile.flipY,
                                    rotation: tile.rotation
                                });
                            }
                        }
                    }
                }
            }
        });

        if (doorTiles.length === 0) {
            continue;
        }

        for (const t of doorTiles) {
            matchedTileKeys.add(`${t.layer.name}_${t.tileX}_${t.tileY}`);
        }

        const doorId = `${mapKey}_door_${tileX}_${tileY}`;
        const opened = openedSet.has(doorId);

        let minWorldX = Infinity;
        let maxWorldX = -Infinity;
        let minWorldY = Infinity;
        let maxWorldY = -Infinity;

        for (const t of doorTiles) {
            const wx = t.layer.tileToWorldX(t.tileX)!;
            const wy = t.layer.tileToWorldY(t.tileY)!;
            if (wx < minWorldX) minWorldX = wx;
            if (wx > maxWorldX) maxWorldX = wx;
            if (wy < minWorldY) minWorldY = wy;
            if (wy > maxWorldY) maxWorldY = wy;
        }

        const centerX = minWorldX + (maxWorldX - minWorldX + 32) / 2;
        const centerY = minWorldY + (maxWorldY - minWorldY + 32) / 2;
        const bottomY = maxWorldY + 32;
        const doorWidth = maxWorldX - minWorldX + 32;

        const door: SettlementDoor = {
            doorId,
            tiles: doorTiles,
            opened,
            centerX,
            centerY,
            bottomY,
            width: doorWidth,
            body: null,
            zone: null as any
        };

        updateDoorTilesVisuals(door, opened);

        const doorMinX = minWorldX;
        const doorMaxX = maxWorldX + 32;
        const doorMinY = minWorldY;
        const doorMaxY = bottomY;

        const allBodies = (scene as MatterScene).matter.world.getAllBodies();
        for (const body of allBodies) {
            if (body.isStatic && !body.isSensor && body.position) {
                const bx = body.position.x;
                const by = body.position.y;
                if (bx >= doorMinX - 5 && bx <= doorMaxX + 5 && by >= doorMinY - 5 && by <= doorMaxY + 5) {
                    (scene as MatterScene).matter.world.remove(body);
                }
            }
        }

        if (!opened) {
            door.body = (scene as MatterScene).matter.add.rectangle(centerX, bottomY - 20, doorWidth + 32, 20, { isStatic: true });
        }

        const zone = scene.add.zone(centerX, centerY, 32, 32);
        zone.setInteractive({ useHandCursor: true });
        door.zone = zone;

        zone.on('pointerdown', () => {
            const ls = scene as any;
            if (!ls.player) return;
            if (ls.isCinematic || ls.isEntering || (ls.portalSystem && ls.portalSystem.getIsTeleporting())) return;
            const dist = Phaser.Math.Distance.Between(ls.player.x, ls.player.y, centerX, centerY);
            if (dist < DOOR_INTERACT_DISTANCE) {
                toggleSettlementDoor(scene, door);
            }
        });

        doors.push(door);
    }

    return doors;
}

export function toggleSettlementDoor(scene: Phaser.Scene, door: SettlementDoor) {
    door.opened = !door.opened;
    saveDoorState(door.doorId, door.opened);

    updateDoorTilesVisuals(door, door.opened);

    if (door.opened && door.body) {
        (scene as MatterScene).matter.world.remove(door.body);
        door.body = null;
    } else if (!door.opened && !door.body) {
        door.body = (scene as MatterScene).matter.add.rectangle(door.centerX, door.bottomY - 20, door.width + 32, 20, { isStatic: true });
    }
}

export function handleSettlementDoorInteraction(
    scene: Phaser.Scene,
    doors: SettlementDoor[],
    player: Phaser.Physics.Matter.Sprite,
    interactKeyDown: boolean,
    wasInteractPressed: { value: boolean }
) {
    const ls = scene as any;
    if (ls.isCinematic || ls.isEntering || (ls.portalSystem && ls.portalSystem.getIsTeleporting())) return;

    let nearAnyDoor = false;
    for (const door of doors) {
        const dist = Phaser.Math.Distance.Between(player.x, player.y, door.centerX, door.centerY);
        if (dist < DOOR_INTERACT_DISTANCE) {
            nearAnyDoor = true;
            InteractSystem.getInstance(scene).show(door.centerX, door.bottomY - 25);
            if (interactKeyDown && !wasInteractPressed.value) {
                wasInteractPressed.value = true;
                toggleSettlementDoor(scene, door);
            }
        }
    }
    if (nearAnyDoor && !interactKeyDown) {
        wasInteractPressed.value = false;
    }
}
