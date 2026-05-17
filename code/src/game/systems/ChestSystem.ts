import * as Phaser from 'phaser';
import { ItemData } from '../data/ItemData';
import { UserData } from '../data/UserData';
import { PlayerData } from '../data/PlayerData';
import { InteractSystem } from './InteractSystem';
import { COVENANT_COLORS, FONT_FAMILY } from '../constants';
import { MatterScene } from '../types';

const INTERACT_DISTANCE = 40;
const STORAGE_KEY = 'glossary_opened_chests';

export interface ChestState {
    sprite: Phaser.GameObjects.Sprite;
    body: MatterJS.BodyType | null;
    type: 'big' | 'small';
    sideways: boolean;
    inverted: boolean;
    opened: boolean;
    x: number;
    y: number;
    chestId: string;
}

function getOpenedChests(): Set<string> {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) return new Set(JSON.parse(data));
    } catch (e) { }
    return new Set();
}

function saveOpenedChest(chestId: string): void {
    const opened = getOpenedChests();
    opened.add(chestId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(opened)));
}

export function resetOpenedChests(): void {
    localStorage.removeItem(STORAGE_KEY);
}

function getOpenFrame(type: 'big' | 'small', sideways: boolean): number {
    if (sideways) return type === 'big' ? 6 : 7;
    return type === 'big' ? 2 : 3;
}

export function createChests(
    scene: Phaser.Scene,
    chestLayer: Phaser.Tilemaps.ObjectLayer,
    mapKey: string,
    playerDepth: number = 12
): ChestState[] {
    const chests: ChestState[] = [];
    const openedChests = getOpenedChests();

    chestLayer.objects.forEach((obj, index) => {
        const x = obj.x || 0;
        const y = obj.y || 0;
        const width = obj.width || 32;
        const height = obj.height || 48;
        const cx = x + width / 2;
        const cy = y + height / 2 - 10;

        let type: 'big' | 'small' = 'small';
        let sideways = false;
        let inverted = false;

        if (obj.properties) {
            const typeProp = obj.properties.find((p: any) => p.name === 'type');
            if (typeProp && typeof typeProp.value === 'string') {
                type = typeProp.value as 'big' | 'small';
            }

            const sidewaysProp = obj.properties.find((p: any) => p.name === 'sideways');
            if (sidewaysProp && typeof sidewaysProp.value === 'boolean') {
                sideways = sidewaysProp.value;
            }

            const invertedProp = obj.properties.find((p: any) => p.name === 'inverted');
            if (invertedProp && typeof invertedProp.value === 'boolean') {
                inverted = invertedProp.value;
            }
        }

        const chestId = `${mapKey}_chest_${obj.id ?? index}`;
        const alreadyOpened = openedChests.has(chestId);

        let frame = 0;
        if (alreadyOpened) {
            frame = getOpenFrame(type, sideways);
        } else if (sideways) {
            frame = type === 'big' ? 4 : 5;
        } else {
            frame = type === 'big' ? 0 : 1;
        }

        let spriteY = cy;
        if (type === 'small' && !sideways) {
            spriteY += 5;
        }

        const sprite = scene.add.sprite(cx, spriteY, 'chests', frame).setOrigin(0.5).setDepth(playerDepth);
        if (inverted) {
            sprite.setFlipX(true);
        }

        let bodyY = type === 'big' ? cy + 2 : cy + 12;
        if (sideways) {
            bodyY -= 6;
            if (type === 'big') bodyY -= 5;
            if (type === 'small') bodyY -= 10;
        } else if (type === 'small') {
            bodyY -= 3
        }

        const bodyWidth = (type === 'big' && !sideways) ? width - 10 : width - 14;
        const bodyHeight = (type === 'big' && sideways) ? 31 : 22;
        const body = (scene as MatterScene).matter.add.rectangle(cx, bodyY, bodyWidth, bodyHeight, { isStatic: true });

        chests.push({
            sprite,
            body,
            type,
            sideways,
            inverted,
            opened: alreadyOpened,
            x: cx,
            y: cy,
            chestId
        });
    });

    return chests;
}

export function handleChestInteraction(
    scene: Phaser.Scene,
    chests: ChestState[],
    player: Phaser.Physics.Matter.Sprite,
    interactKeyDown: boolean,
    _delta: number,
    isCinematic: boolean,
    isTeleporting: boolean,
    isEntering: boolean
): boolean {
    let interactingChest = false;

    if (!isTeleporting && !isEntering && !isCinematic) {
        for (const chest of chests) {
            if (chest.opened) continue;
            const dist = Phaser.Math.Distance.Between(player.x, player.y, chest.x, chest.y);
            if (dist < INTERACT_DISTANCE) {
                InteractSystem.getInstance(scene).show(chest.x, chest.y - 25);
                if (interactKeyDown) {
                    interactingChest = true;
                    chest.opened = true;

                    chest.sprite.setFrame(getOpenFrame(chest.type, chest.sideways));
                    saveOpenedChest(chest.chestId);

                    let availableItems = ItemData.getAllItems().filter(item => !ItemData.getInstance().isDiscovered(item.id));
                    if (availableItems.length === 0) {
                        availableItems = ItemData.getAllItems();
                    }
                    const randomItem = availableItems[Phaser.Math.Between(0, availableItems.length - 1)];

                    const gems = Phaser.Math.Between(30, 60);
                    const specialCur = Phaser.Math.Between(1, 3);
                    PlayerData.getInstance().gemstones += gems;
                    PlayerData.getInstance().updateSpecialCurrency(specialCur);

                    showCurrencyPopup(scene, gems, specialCur);

                    ItemData.getInstance().discoverItem(randomItem.id);
                    UserData.getInstance().discoverItem(randomItem.name);

                    scene.scene.pause('LevelScene');
                    scene.scene.launch('ItemModal', {
                        itemKey: 'items',
                        itemFrame: randomItem.id,
                        itemName: randomItem.name
                    });
                }
            }
        }
    }

    return interactingChest;
}

function showCurrencyPopup(scene: Phaser.Scene, gems: number, specialCur: number) {
    const w = scene.scale.width;
    const h = scene.scale.height;
    const camZoom = 2;

    const startX = (w - 15 - w / 2) / camZoom + w / 2;
    const startY = (50 - h / 2) / camZoom + h / 2;

    const covenant = PlayerData.getInstance().covenant;
    const covColorNum = COVENANT_COLORS[covenant] || 0xffffff;
    const covColorStr = '#' + covColorNum.toString(16).padStart(6, '0');
    const scFrame = covenant === 'snake' ? 1 : covenant === 'phoenix' ? 2 : covenant === 'dragon' ? 3 : 1;

    const container = scene.add.container(startX, startY).setDepth(300).setScrollFactor(0);

    const gemText = scene.add.text(0, 0, `+${gems}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
    }).setOrigin(1, 0.5).setScale(0.5);

    const gemIcon = scene.add.sprite(-gemText.width * 0.5 - 5, 0, 'currency', 4)
        .setOrigin(1, 0.5)
        .setScale(1);

    const scText = scene.add.text(0, 20, `+${specialCur}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        color: covColorStr,
        stroke: '#000000',
        strokeThickness: 4
    }).setOrigin(1, 0.5).setScale(0.5);

    const scIcon = scene.add.sprite(-scText.width * 0.5 - 5, 20, 'currency', scFrame)
        .setOrigin(1, 0.5)
        .setScale(1);

    container.add([gemText, gemIcon, scText, scIcon]);

    scene.tweens.add({
        targets: container,
        y: startY - 20,
        alpha: 0,
        duration: 3000,
        ease: 'Power2',
        onComplete: () => {
            container.destroy();
        }
    });
}

