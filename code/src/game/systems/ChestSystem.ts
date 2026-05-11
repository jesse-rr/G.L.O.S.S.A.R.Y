import * as Phaser from 'phaser';
import { ItemData } from '../data/ItemData';
import { UserData } from '../data/UserData';

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
    } catch (e) {}
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
    chestLayer: { objects: any[] },
    mapKey: string
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

        const sprite = scene.add.sprite(cx, spriteY, 'chests', frame).setOrigin(0.5).setDepth(12);
        if (inverted) {
            sprite.setFlipX(true);
        }

        let bodyY = type === 'big' ? cy + 2 : cy + 12;
        if (sideways) {
            bodyY -= 6;
        } else if (type === 'small') {
            bodyY -= 3
        }

        const bodyWidth = (type === 'big' && !sideways) ? width - 10 : width - 14;
        const body = (scene as any).matter.add.rectangle(cx, bodyY, bodyWidth, 22, { isStatic: true });

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
    delta: number,
    isCinematic: boolean,
    isTeleporting: boolean,
    isEntering: boolean
): boolean {
    let interactingChest = false;

    if (interactKeyDown && !isTeleporting && !isEntering && !isCinematic) {
        for (const chest of chests) {
            if (chest.opened) continue;
            const dist = Phaser.Math.Distance.Between(player.x, player.y, chest.x, chest.y);
            if (dist < INTERACT_DISTANCE) {
                interactingChest = true;
                chest.opened = true;

                chest.sprite.setFrame(getOpenFrame(chest.type, chest.sideways));
                saveOpenedChest(chest.chestId);

                let availableItems = ItemData.getAllItems().filter(item => !ItemData.getInstance().isDiscovered(item.id));
                if (availableItems.length === 0) {
                    availableItems = ItemData.getAllItems();
                }
                const randomItem = availableItems[Phaser.Math.Between(0, availableItems.length - 1)];

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

    return interactingChest;
}
