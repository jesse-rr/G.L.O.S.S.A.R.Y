import * as Phaser from 'phaser';
import { createVignette } from '../utils/Vignette';
import { PlayerData } from '../data/PlayerData';
import { COVENANT_BASE_INDEX } from '../constants';
import { InteractSystem } from './InteractSystem';
import { MatterScene } from '../types';
import { fadeIn, fadeOutAndDestroy } from '../utils/TweenUtils';
import { ScreenShake } from "../utils/ScreenShake";
import { AudioManager } from '../utils/AudioManager';

export interface DoorState {
    sprite: Phaser.GameObjects.Sprite;
    bodyBase: MatterJS.BodyType | null;
    bodyLeft: MatterJS.BodyType | null;
    bodyRight: MatterJS.BodyType | null;
    symbolLeft: Phaser.GameObjects.Sprite;
    symbolRight: Phaser.GameObjects.Sprite;
    x: number;
    y: number;
    opened: boolean;
    interactTimer: number;
}

let audioManager: AudioManager | null = null;

export function initDoorAudio(manager: AudioManager) {
    audioManager = manager;
}

export function createDoors(
    scene: Phaser.Scene,
    doorLayer: Phaser.Tilemaps.ObjectLayer
): DoorState[] {
    const doors: DoorState[] = [];
    const playerOpenedDoor = PlayerData.getInstance().hubDoorOpened;

    doorLayer.objects.forEach(obj => {
        const x = obj.x || 0;
        const y = obj.y || 0;
        const width = obj.width || 64;
        const height = obj.height || 96;
        const cx = x + width / 2;
        const cy = y + height / 2;

        const doorSprite = scene.add.sprite(cx, cy, 'door-sheet', playerOpenedDoor ? 13 : 0).setDepth(8);

        let bodyBase: MatterJS.BodyType | null = null;
        let bodyLeft: MatterJS.BodyType | null = null;
        let bodyRight: MatterJS.BodyType | null = null;

        const baseY = cy + 25;
        if (!playerOpenedDoor) {
            bodyBase = (scene as MatterScene).matter.add.rectangle(cx, baseY - 40, width, height, { isStatic: true });
        } else {
            bodyLeft = (scene as MatterScene).matter.add.rectangle(cx - 27, baseY, 10, 10, { isStatic: true });
            bodyRight = (scene as MatterScene).matter.add.rectangle(cx + 27, baseY, 10, 10, { isStatic: true });
        }

        let symbolIndex = 0;
        const mapKey = (scene as any).mapKey || '';
        if (mapKey.includes('desert')) {
            symbolIndex = 2;
        } else if (mapKey.includes('mechanic')) {
            symbolIndex = 1;
        } else if (mapKey.includes('abandoned')) {
            symbolIndex = 0;
        } else {
            const playerData = PlayerData.getInstance();
            const covenant = playerData.covenant;
            const baseIdx = COVENANT_BASE_INDEX[covenant] ?? 0;
            const floorOffset = playerData.currentFloor - 1;
            const rotatedIdx = (baseIdx + floorOffset) % 3;
            if (rotatedIdx === 0) symbolIndex = 0;
            else if (rotatedIdx === 1) symbolIndex = 2;
            else if (rotatedIdx === 2) symbolIndex = 1;
        }

        const symbolLeft = scene.add.sprite(cx, cy, 'door-symbol', symbolIndex).setDepth(8.1);
        symbolLeft.setCrop(0, 0, 32, 96);

        const symbolRight = scene.add.sprite(cx, cy, 'door-symbol', symbolIndex).setDepth(8.1);
        symbolRight.setCrop(32, 0, 32, 96);

        if (playerOpenedDoor) {
            symbolLeft.x = cx - 26;
            symbolRight.x = cx + 26;
        }

        doors.push({
            sprite: doorSprite,
            bodyBase,
            bodyLeft,
            bodyRight,
            symbolLeft,
            symbolRight,
            x: cx,
            y: cy,
            opened: playerOpenedDoor,
            interactTimer: 0
        });
    });

    return doors;
}

export function handleDoorInteraction(
    scene: Phaser.Scene,
    doors: DoorState[],
    player: Phaser.Physics.Matter.Sprite,
    interactKeyDown: boolean,
    delta: number,
    isCinematic: boolean,
    isTeleporting: boolean,
    isEntering: boolean,
    setCinematic: (val: boolean) => void
): boolean {
    let interactingDoor = false;

    if (!isTeleporting && !isEntering && !isCinematic) {
        for (const door of doors) {
            if (door.opened) continue;
            const dist = Phaser.Math.Distance.Between(player.x, player.y, door.x, door.y);
            if (dist < 40) {
                interactingDoor = true;

                if (interactKeyDown) {
                    door.interactTimer += delta;
                } else {
                    door.interactTimer = 0;
                }

                const progress = Math.min(door.interactTimer / 1000, 1);
                InteractSystem.getInstance(scene).show(door.x, door.y - 45, progress);

                if (door.interactTimer >= 1000) {
                    door.opened = true;
                    PlayerData.getInstance().hubDoorOpened = true;

                    if (audioManager) {
                        audioManager.playRocks();
                    }

                    setCinematic(true);

                    const startDoorAnimation = () => {
                        ScreenShake.trigger(scene, 1000, 0.001);
                        door.sprite.play('door-open');
                        if (door.bodyBase) (scene as MatterScene).matter.world.remove(door.bodyBase);

                        const baseY = door.y + 25;
                        door.bodyLeft = (scene as MatterScene).matter.add.rectangle(door.x - 29, baseY, 8, 8, { isStatic: true });
                        door.bodyRight = (scene as MatterScene).matter.add.rectangle(door.x + 29, baseY, 8, 8, { isStatic: true });

                        door.sprite.on('animationupdate', (_anim: any, frame: any) => {
                            const offset = (frame.index - 1) * 2;
                            door.symbolLeft.x = door.x - offset;
                            door.symbolRight.x = door.x + offset;
                        });

                        door.sprite.on('animationcomplete', () => {
                            setCinematic(false);
                        });
                    };

                    const darkVignette = createVignette(scene, 99, true);
                    darkVignette.setAlpha(0);
                    fadeIn(scene, darkVignette, 500, () => {
                        startDoorAnimation();
                        fadeOutAndDestroy(scene, darkVignette, 1000);
                    });
                }
            }
        }
    }

    if (!interactingDoor) {
        for (const door of doors) {
            if (!door.opened) door.interactTimer = 0;
        }
    }

    return interactingDoor;
}