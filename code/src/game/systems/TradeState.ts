import * as Phaser from 'phaser';
import {PlayerData} from "../data/PlayerData";
import {InteractSystem} from "./InteractSystem";
import {RuneData} from "../data/RuneData";

export interface TradeState {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    tradeType: 'gemstone' | 'boost' | 'special';
    isAnimating: boolean;
    animationSprite: Phaser.GameObjects.Sprite | null;
}

export function createTrades(scene: Phaser.Scene, layer: any, mapKey: string): TradeState[] {
    const trades: TradeState[] = [];
    
    if (mapKey !== 'summit-trade') return trades;

    const covenant = PlayerData.getInstance().covenant;
    
    let frameStart = 0;
    let frameEnd = 0;
    
    if (covenant === 'echo') {
        frameStart = 0;
        frameEnd = 6;
    } else if (covenant === 'dragon') {
        frameStart = 7;
        frameEnd = 14;
    } else {
        frameStart = 15;
        frameEnd = 21;
    }
    
    if (!scene.anims.exists('trade-animation')) {
        const frames = [];
        for (let i = frameStart; i <= frameEnd; i++) {
            frames.push({ key: 'trade', frame: i });
        }
        scene.anims.create({
            key: 'trade-animation',
            frames: frames,
            frameRate: 12,
            repeat: 0
        });
    }
    
    layer.objects.forEach((obj: any, index: number) => {
        const x = (obj.x || 0) + (obj.width || 64) / 2;
        const y = (obj.y || 0) + (obj.height || 64) / 2;
        const width = obj.width || 64;
        const height = obj.height || 64;
        
        let tradeType: 'gemstone' | 'boost' | 'special' = 'gemstone';
        
        if (obj.type === 'gemstone') tradeType = 'gemstone';
        else if (obj.type === 'boost') tradeType = 'boost';
        else if (obj.type === 'special') tradeType = 'special';
        
        const tradeZone = scene.add.rectangle(x, y, width, height, 0x000000, 0);
        scene.matter.add.gameObject(tradeZone, { isStatic: true, isSensor: true });
        tradeZone.setData('isTrade', true);
        tradeZone.setData('tradeId', index);
        
        trades.push({
            id: index,
            x: x,
            y: y,
            width: width,
            height: height,
            tradeType: tradeType,
            isAnimating: false,
            animationSprite: null
        });
    });
    
    return trades;
}

export function handleTradeInteraction(
    scene: Phaser.Scene,
    trades: TradeState[],
    player: Phaser.GameObjects.Sprite,
    interactPressed: boolean,
    wasInteractPressed: { value: boolean },
    selectedRune: string | null,
    onTradeComplete: () => void
): void {
    const playerX = player.x;
    const playerY = player.y;
    const interactSystem = InteractSystem.getInstance(scene);
    
    let activeTrade: TradeState | null = null;
    
    for (const trade of trades) {
        if (trade.isAnimating) continue;
        
        const left = trade.x - trade.width / 2;
        const right = trade.x + trade.width / 2;
        const top = trade.y - trade.height / 2;
        const bottom = trade.y + trade.height / 2;
        
        if (playerX >= left && playerX <= right && playerY >= top && playerY <= bottom) {
            activeTrade = trade;
            break;
        }
    }
    
    if (activeTrade) {
        const showInteract = selectedRune !== null;
        
        if (showInteract) {
            interactSystem.show(activeTrade.x + 40, activeTrade.y, 0);
        }
        
        if (interactPressed && !wasInteractPressed.value && selectedRune !== null && !activeTrade.isAnimating) {
            performTrade(scene, activeTrade, selectedRune, onTradeComplete);
        }
    }
    
    wasInteractPressed.value = interactPressed;
}

function performTrade(
    scene: Phaser.Scene,
    trade: TradeState,
    runeLetter: string,
    onTradeComplete: () => void
): void {
    const playerData = PlayerData.getInstance();
    const runeData = RuneData.getInstance();
    
    const runeQuantity = playerData.getRuneQuantity(runeLetter);
    
    if (runeQuantity <= 0) return;
    
    let success = false;
    
    switch (trade.tradeType) {
        case 'gemstone':
            playerData.removeRune(runeLetter, 1);
            playerData.gemstones += 1;
            success = true;
            break;
        case 'boost':
            playerData.removeRune(runeLetter, 1);
            playerData.updateSpecialCurrency(1);
            success = true;
            break;
        case 'special':
            playerData.removeRune(runeLetter, 1);
            playerData.specialCurrency += 2;
            success = true;
            break;
    }
    
    if (success) {
        trade.isAnimating = true;
        
        trade.animationSprite = scene.add.sprite(trade.x, trade.y, 'trade')
            .setDepth(200)
            .setAlpha(0);
        
        scene.tweens.add({
            targets: trade.animationSprite,
            alpha: 1,
            duration: 200,
            onComplete: () => {
                trade.animationSprite!.play('trade-animation');
                
                trade.animationSprite!.once('animationcomplete', () => {
                    scene.tweens.add({
                        targets: trade.animationSprite,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => {
                            if (trade.animationSprite) {
                                trade.animationSprite.destroy();
                                trade.animationSprite = null;
                            }
                            trade.isAnimating = false;
                            onTradeComplete();
                        }
                    });
                });
            }
        });
    }
}