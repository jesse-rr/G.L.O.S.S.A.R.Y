import * as Phaser from 'phaser';
import { InteractSystem } from './InteractSystem';
import { MatterScene } from '../constants';

export interface MechanicDoor {
    doorId: string;
    sprite: Phaser.GameObjects.Sprite;
    body: MatterJS.BodyType | null;
    opened: boolean;
    centerX: number;
    centerY: number;
    width: number;
    height: number;
    zone: Phaser.GameObjects.Zone;
}

const STORAGE_KEY = 'glossary_mechanic_doors';

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

export function createMechanicDoors(
    scene: Phaser.Scene,
    doorLayer: Phaser.Tilemaps.ObjectLayer,
    mapKey: string
): MechanicDoor[] {
    if (mapKey !== 'mechanic-settlement' && mapKey !== 'abandoned-settlement') {
        return [];
    }

    if (!scene.anims.exists('mechanic-door-open')) {
        scene.anims.create({
            key: 'mechanic-door-open',
            frames: scene.anims.generateFrameNumbers('door-sheet-mechanic', { start: 0, end: 20 }),
            duration: 300,
            repeat: 0
        });
    }
    if (!scene.anims.exists('mechanic-door-close')) {
        scene.anims.create({
            key: 'mechanic-door-close',
            frames: scene.anims.generateFrameNumbers('door-sheet-mechanic', { start: 20, end: 0 }),
            duration: 300,
            repeat: 0
        });
    }

    const doors: MechanicDoor[] = [];
    const openedSet = getOpenedDoors();

    doorLayer.objects.forEach((obj, index) => {
        const x = obj.x || 0;
        const y = obj.y || 0;
        const width = obj.width || 32;
        const height = obj.height || 64;
        const centerX = x + width / 2;
        const centerY = y + height / 2;

        const doorId = `${mapKey}_mech_door_${index}`;
        const opened = openedSet.has(doorId);

        const startFrame = opened ? 20 : 0;
        const sprite = scene.add.sprite(centerX, centerY, 'door-sheet-mechanic', startFrame).setDepth(8);

        let body: MatterJS.BodyType | null = null;
        if (!opened) {
            body = (scene as MatterScene).matter.add.rectangle(centerX, centerY - 2, width, height, { isStatic: true });
        }

        const door: MechanicDoor = {
            doorId,
            sprite,
            body,
            opened,
            centerX,
            centerY,
            width,
            height,
            zone: null as any
        };

        const zone = scene.add.zone(centerX, centerY, width + 16, height + 16);
        zone.setInteractive({ useHandCursor: true });
        door.zone = zone;

        zone.on('pointerdown', () => {
            const ls = scene as any;
            if (!ls.player) return;
            if (ls.isCinematic || ls.isEntering || (ls.portalSystem && ls.portalSystem.getIsTeleporting())) return;
            const dist = Phaser.Math.Distance.Between(ls.player.x, ls.player.y, centerX, centerY);
            if (dist < 50) {
                toggleMechanicDoor(scene, door);
            }
        });

        doors.push(door);
    });

    return doors;
}

export function toggleMechanicDoor(scene: Phaser.Scene, door: MechanicDoor) {
    door.opened = !door.opened;
    saveDoorState(door.doorId, door.opened);

    if (door.opened) {
        if (door.body) {
            (scene as MatterScene).matter.world.remove(door.body);
            door.body = null;
        }
        door.sprite.play('mechanic-door-open');
    } else {
        door.sprite.play('mechanic-door-close');
        if (!door.body) {
            door.body = (scene as MatterScene).matter.add.rectangle(door.centerX, door.centerY - 2, door.width, door.height, { isStatic: true });
        }
    }
}

export function handleMechanicDoorInteraction(
    scene: Phaser.Scene,
    doors: MechanicDoor[],
    player: Phaser.Physics.Matter.Sprite,
    interactKeyDown: boolean,
    wasInteractPressed: { value: boolean }
) {
    const ls = scene as any;
    if (ls.isCinematic || ls.isEntering || (ls.portalSystem && ls.portalSystem.getIsTeleporting())) return;

    let nearAnyDoor = false;
    for (const door of doors) {
        const dist = Phaser.Math.Distance.Between(player.x, player.y, door.centerX, door.centerY);
        if (dist < 50) {
            nearAnyDoor = true;
            InteractSystem.getInstance(scene).show(door.centerX, door.centerY - door.height / 2 - 10);
            if (interactKeyDown && !wasInteractPressed.value) {
                wasInteractPressed.value = true;
                toggleMechanicDoor(scene, door);
            }
        }
    }
    if (nearAnyDoor && !interactKeyDown) {
        wasInteractPressed.value = false;
    }
}
