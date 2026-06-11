import * as Phaser from 'phaser';
import { InteractSystem } from './InteractSystem';

export interface MerchantState {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function createMerchants(
    merchantLayer: Phaser.Tilemaps.ObjectLayer
): MerchantState[] {
    const merchants: MerchantState[] = [];

    if (!merchantLayer || !merchantLayer.objects) return merchants;

    merchantLayer.objects.forEach((obj: any) => {
        const x = (obj.x || 0) + (obj.width || 64) / 2;
        const y = (obj.y || 0) + (obj.height || 64) / 2;
        const width = obj.width || 64;
        const height = obj.height || 64;

        merchants.push({
            x: x,
            y: y,
            width: width,
            height: height
        });
    });

    return merchants;
}

export function handleMerchantInteraction(
    scene: Phaser.Scene,
    merchants: MerchantState[],
    player: Phaser.Physics.Matter.Sprite,
    interactKeyDown: boolean,
    wasInteractPressed: { value: boolean },
    isCinematic: boolean,
    isTeleporting: boolean,
    isEntering: boolean
): void {
    if (isTeleporting || isEntering || isCinematic) return;

    let nearMerchant = false;
    let targetX = 0;
    let targetY = 0;

    for (const merchant of merchants) {
        const playerX = player.x;
        const playerY = player.y;

        const left = merchant.x - merchant.width / 2 - 30;
        const right = merchant.x + merchant.width / 2 + 30;
        const top = merchant.y - merchant.height / 2 - 30;
        const bottom = merchant.y + merchant.height / 2 + 30;

        if (playerX >= left && playerX <= right && playerY >= top && playerY <= bottom) {
            nearMerchant = true;
            targetX = merchant.x;
            targetY = merchant.y;
            break;
        }
    }

    if (nearMerchant) {
        InteractSystem.getInstance(scene).show(targetX, targetY - 40);

        if (interactKeyDown && !wasInteractPressed.value) {
            wasInteractPressed.value = true;
            scene.scene.pause('LevelScene');
            scene.scene.launch('MerchantShop', { items: (scene as any).merchantItems });
        }
    }
}
