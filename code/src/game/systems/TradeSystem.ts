import * as Phaser from 'phaser';
import { PlayerData } from "../data/PlayerData";
import { InteractSystem } from "./InteractSystem";
import { RuneData } from "../data/RuneData";
import { ItemData as ItemDataClass } from "../data/ItemData";
import { FONT_FAMILY, COVENANT_COLORS, RUNE_FONT, InputKeys } from "../constants";

const TRADE_STORAGE_KEY = 'glossary_completed_trades';

let tradeActive = false;
let tradeCard: Phaser.GameObjects.Sprite | null = null;
let tradeInfoRightContainer: Phaser.GameObjects.Container | null = null;
let tradeOverlay: Phaser.GameObjects.Rectangle | null = null;
let tradeTooltip: Phaser.GameObjects.Container | null = null;
let tradeLocked = false;
let escKey: Phaser.Input.Keyboard.Key | null = null;
let selectedRuneIndex = 0;
let centerRuneContainer: Phaser.GameObjects.Container | null = null;
let centerRuneText: Phaser.GameObjects.Text | null = null;
let centerRuneNameText: Phaser.GameObjects.Text | null = null;

export interface TradeState {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    tradeType: 'gemstone' | 'boost' | 'special';
    isAnimating: boolean;
    tradeZone: Phaser.GameObjects.Rectangle;
    completed: boolean;
}

interface TradeReward {
    type: 'gemstone' | 'special' | 'hp';
    amount: number;
    iconFrame: number;
}

function getCompletedTrades(): Set<string> {
    try {
        const data = localStorage.getItem(TRADE_STORAGE_KEY);
        if (data) return new Set(JSON.parse(data));
    } catch (e) { }
    return new Set();
}

function saveCompletedTrade(tradeType: string): void {
    const completed = getCompletedTrades();
    completed.add(tradeType);
    localStorage.setItem(TRADE_STORAGE_KEY, JSON.stringify(Array.from(completed)));
}

export function resetCompletedTrades(): void {
    localStorage.removeItem(TRADE_STORAGE_KEY);
}

function getTradeReward(tradeType: 'gemstone' | 'boost' | 'special'): TradeReward {
    const items = ItemDataClass.getAllItems();
    const avgCost = Math.floor(items.reduce((sum, i) => sum + i.cost, 0) / items.length);
    const covenant = PlayerData.getInstance().covenant;
    const scFrame = covenant === 'snake' ? 1 : covenant === 'phoenix' ? 2 : 3;

    switch (tradeType) {
        case 'gemstone':
            return { type: 'gemstone', amount: Math.floor(avgCost * 0.75), iconFrame: 4 };
        case 'boost':
            return { type: 'hp', amount: Math.floor(avgCost * 0.12), iconFrame: 0 };
        case 'special':
            return { type: 'special', amount: 3, iconFrame: scFrame };
    }
}

function getCovenantFrames(): { start: number; end: number } {
    const covenant = PlayerData.getInstance().covenant;
    if (covenant === 'snake') return { start: 1, end: 6 };
    if (covenant === 'dragon') return { start: 7, end: 13 };
    return { start: 15, end: 20 };
}

function covenantColorHex(): string {
    const covenant = PlayerData.getInstance().covenant;
    const color = COVENANT_COLORS[covenant] || COVENANT_COLORS['default'];
    return '#' + color.toString(16).padStart(6, '0');
}

export function isTradeActive(): boolean {
    return tradeActive;
}

export function createTrades(scene: Phaser.Scene, layer: Phaser.Tilemaps.ObjectLayer, mapKey: string): TradeState[] {
    const trades: TradeState[] = [];

    if (mapKey !== 'summit-trade') return trades;

    tradeActive = false;
    tradeCard = null;
    tradeInfoRightContainer = null;
    tradeOverlay = null;
    tradeTooltip = null;
    tradeLocked = false;
    selectedRuneIndex = 0;
    centerRuneContainer = null;
    centerRuneText = null;
    centerRuneNameText = null;

    escKey = scene.input.keyboard!.addKey('ESC');

    if (!layer || !layer.objects) return trades;

    const completedTrades = getCompletedTrades();

    const tradeTypes: ('gemstone' | 'boost' | 'special')[] = ['gemstone', 'boost', 'special'];

    layer.objects.forEach((obj: any, index: number) => {
        const x = (obj.x || 0) + (obj.width || 64) / 2;
        const y = (obj.y || 0) + (obj.height || 64) / 2;
        const width = obj.width || 64;
        const height = obj.height || 64;

        let tradeType: 'gemstone' | 'boost' | 'special' = tradeTypes[index % tradeTypes.length];

        if (obj.type === 'gemstone') tradeType = 'gemstone';
        else if (obj.type === 'boost') tradeType = 'boost';
        else if (obj.type === 'special') tradeType = 'special';

        const isCompleted = completedTrades.has(tradeType);

        const tradeZone = scene.add.rectangle(x, y, width, height, 0xff0000, 0);
        scene.matter.add.gameObject(tradeZone, { isStatic: true, isSensor: true });
        tradeZone.setData('isTrade', true);
        tradeZone.setData('tradeId', index);
        tradeZone.setData('tradeType', tradeType);

        trades.push({
            id: index,
            x: x,
            y: y,
            width: width,
            height: height,
            tradeType: tradeType,
            isAnimating: false,
            tradeZone: tradeZone,
            completed: isCompleted
        });
    });

    return trades;
}

let activeTradeCached: TradeState | null = null;
let activeRewardCached: TradeReward | null = null;
let activeSetCinematic: ((val: boolean) => void) | null = null;

export function handleTradeInteraction(
    scene: Phaser.Scene,
    trades: TradeState[],
    player: Phaser.Physics.Matter.Sprite,
    interactPressed: boolean,
    wasInteractPressed: { value: boolean },
    setCinematic: (val: boolean) => void
): boolean {
    if (!player || !player.active) return false;

    if (tradeLocked) {
        wasInteractPressed.value = interactPressed;
        return true;
    }

    if (tradeActive) {
        if (escKey && Phaser.Input.Keyboard.JustDown(escKey)) {
            cleanupTrade(scene);
            setCinematic(false);
        }
        wasInteractPressed.value = interactPressed;
        return true;
    }

    const playerX = player.x;
    const playerY = player.y;
    const interactSystem = InteractSystem.getInstance(scene);

    let activeTrade: TradeState | null = null;

    for (const trade of trades) {
        if (trade.isAnimating || trade.completed) continue;

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
        interactSystem.show(activeTrade.x, activeTrade.y - 30, 0);

        if (interactPressed && !wasInteractPressed.value) {
            activeSetCinematic = setCinematic;
            openTradeCard(scene, activeTrade, setCinematic);
        }
    }

    wasInteractPressed.value = interactPressed;
    return tradeActive;
}

function cleanupTrade(_scene: Phaser.Scene): void {
    if (centerRuneContainer) {
        centerRuneContainer.destroy();
        centerRuneContainer = null;
    }
    if (tradeCard) {
        tradeCard.destroy();
        tradeCard = null;
    }
    if (tradeInfoRightContainer) {
        tradeInfoRightContainer.destroy();
        tradeInfoRightContainer = null;
    }
    if (tradeOverlay) {
        tradeOverlay.destroy();
        tradeOverlay = null;
    }
    if (tradeTooltip) {
        tradeTooltip.destroy();
        tradeTooltip = null;
    }
    tradeActive = false;
    tradeLocked = false;
    activeTradeCached = null;
    activeRewardCached = null;
    activeSetCinematic = null;
    selectedRuneIndex = 0;
    centerRuneText = null;
    centerRuneNameText = null;
}

function openTradeCard(
    scene: Phaser.Scene,
    trade: TradeState,
    setCinematic: (val: boolean) => void
): void {
    tradeActive = true;
    setCinematic(true);
    activeTradeCached = trade;
    activeRewardCached = getTradeReward(trade.tradeType);
    selectedRuneIndex = 0;

    const w = scene.scale.width;
    const h = scene.scale.height;
    const cardY = h / 2 - 10;
    const cardX = w / 2;

    tradeOverlay = scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0)
        .setScrollFactor(0)
        .setDepth(299)
        .setOrigin(0.5);

    scene.tweens.add({
        targets: tradeOverlay,
        fillAlpha: 0.6,
        duration: 400,
        ease: 'Sine.easeIn'
    });

    tradeCard = scene.add.sprite(cardX, cardY, 'trade', 0)
        .setScrollFactor(0)
        .setDepth(300)
        .setAlpha(0);

    scene.input.on('pointermove', handleTradePointerMove);
    scene.input.on('pointerdown', handleCardClick);

    scene.input.keyboard!.on(InputKeys.INTERACT, () => {
        if (tradeActive && !tradeLocked) {
            onConfirmTrade();
        }
    });

    scene.tweens.add({
        targets: tradeCard,
        alpha: 1,
        duration: 400,
        ease: 'Sine.easeIn'
    });

    const reward = activeRewardCached;

    tradeInfoRightContainer = scene.add.container(cardX + 60, cardY - 30)
        .setScrollFactor(0)
        .setDepth(301)
        .setAlpha(0);

    const rewardIcon = scene.add.sprite(0, 0, 'currency', reward.iconFrame)
        .setOrigin(0, 0.5);
    tradeInfoRightContainer.add(rewardIcon);

    const rewardAmount = scene.add.text(18, 0, `+${reward.amount}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '10px',
        color: '#66ff66',
        shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true },
        resolution: 2
    }).setOrigin(0, 0.5);
    tradeInfoRightContainer.add(rewardAmount);

    const hintText = scene.add.text(0, 24, 'CLICK CARD\nTO SWITCH', {
        fontFamily: FONT_FAMILY,
        fontSize: '6px',
        color: '#666666',
        align: 'left',
        resolution: 2
    }).setOrigin(0, 0.5);
    tradeInfoRightContainer.add(hintText);

    const confirmHint = scene.add.text(0, 44, 'PRESS X\nTO TRADE', {
        fontFamily: FONT_FAMILY,
        fontSize: '6px',
        color: '#666666',
        align: 'left',
        resolution: 2
    }).setOrigin(0, 0.5);
    tradeInfoRightContainer.add(confirmHint);

    scene.tweens.add({
        targets: tradeInfoRightContainer,
        alpha: 1,
        duration: 400,
        delay: 100,
        ease: 'Sine.easeIn'
    });

    createCenterRuneDisplay(scene, cardX, cardY);

    scene.events.once('shutdown', () => {
        scene.input.keyboard!.off(InputKeys.INTERACT);
    });
}

function handleCardClick(pointer: Phaser.Input.Pointer): void {
    if (!tradeActive || tradeLocked || !tradeCard) return;

    const scene = tradeCard.scene;
    const w = scene.scale.width;
    const h = scene.scale.height;
    const cardX = w / 2;
    const cardY = h / 2 - 10;

    const zoom = scene.cameras.main.zoom || 1;
    const dx = pointer.x - cardX;
    const dy = pointer.y - cardY;

    if (Math.abs(dx) <= (160 * zoom) / 2 && Math.abs(dy) <= (190 * zoom) / 2) {
        const discoveredRunes = RuneData.getInstance().getDiscoveredDefinitions();
        if (discoveredRunes.length === 0) return;
        selectedRuneIndex = (selectedRuneIndex + 1) % discoveredRunes.length;
        updateCenterRuneDisplay(scene, cardX, cardY);
    }
}

function createCenterRuneDisplay(scene: Phaser.Scene, cardX: number, cardY: number): void {
    const runeData = RuneData.getInstance();
    const discoveredRunes = runeData.getDiscoveredDefinitions();

    if (!discoveredRunes || discoveredRunes.length === 0) {
        centerRuneContainer = scene.add.container(cardX, cardY)
            .setScrollFactor(0)
            .setDepth(302);

        const noRunesText = scene.add.text(0, 0, "NO RUNES\nDISCOVERED", {
            fontFamily: FONT_FAMILY,
            fontSize: '12px',
            color: '#ff6666',
            align: 'center',
            resolution: 2
        }).setOrigin(0.5);
        centerRuneContainer.add(noRunesText);
        return;
    }

    centerRuneContainer = scene.add.container(cardX, cardY)
        .setScrollFactor(0)
        .setDepth(302);

    const selectedRune = discoveredRunes[selectedRuneIndex % discoveredRunes.length];

    centerRuneText = scene.add.text(0, 0, selectedRune.letter, {
        fontFamily: RUNE_FONT,
        fontSize: '70px',
        color: '#cccccc',
        align: 'center',
        resolution: 2
    }).setOrigin(0.5, 0.5);
    centerRuneContainer.add(centerRuneText);

    centerRuneNameText = scene.add.text(0, 45, selectedRune.name, {
        fontFamily: FONT_FAMILY,
        fontSize: '8px',
        color: '#cccccc',
        align: 'center',
        resolution: 2
    }).setOrigin(0.5, 0);
    centerRuneContainer.add(centerRuneNameText);
}

function updateCenterRuneDisplay(scene: Phaser.Scene, cardX: number, cardY: number): void {
    if (!centerRuneContainer || !centerRuneText || !centerRuneNameText) return;

    const discoveredRunes = RuneData.getInstance().getDiscoveredDefinitions();
    if (discoveredRunes.length === 0) return;

    const selectedRune = discoveredRunes[selectedRuneIndex % discoveredRunes.length];

    centerRuneText.setText(selectedRune.letter);
    centerRuneNameText.setText(selectedRune.name);

    if (tradeTooltip && tradeTooltip.visible) {
        showRuneTooltip(scene, cardX, cardY);
    }
}

function handleTradePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!tradeActive || tradeLocked || !tradeCard) return;

    const scene = tradeCard.scene;
    const w = scene.scale.width;
    const h = scene.scale.height;
    const cardX = w / 2;
    const cardY = h / 2 - 10;

    const zoom = scene.cameras.main.zoom || 1;
    const dx = pointer.x - cardX;
    const dy = pointer.y - cardY;

    if (Math.abs(dx) <= (160 * zoom) / 2 && Math.abs(dy) <= (190 * zoom) / 2) {
        if (!tradeTooltip || !tradeTooltip.active) {
            showRuneTooltip(scene, cardX, cardY);
        }
    } else {
        hideRuneTooltip();
    }
}

function onConfirmTrade(): void {
    if (!tradeActive || tradeLocked) return;
    if (!activeTradeCached || !activeRewardCached || !activeSetCinematic) return;

    const discoveredRunes = RuneData.getInstance().getDiscoveredDefinitions();
    if (discoveredRunes.length === 0) return;

    const scene = tradeCard?.scene;
    if (!scene) return;

    const selectedRune = discoveredRunes[selectedRuneIndex % discoveredRunes.length];

    hideRuneTooltip();

    executeTradeWithAnim(scene, activeTradeCached, activeRewardCached, selectedRune.letter, activeSetCinematic);
}

function showRuneTooltip(scene: Phaser.Scene, cardX: number, cardY: number): void {
    hideRuneTooltip();

    const discoveredRunes = RuneData.getInstance().getDiscoveredDefinitions();
    if (discoveredRunes.length === 0) return;

    const selectedRune = discoveredRunes[selectedRuneIndex % discoveredRunes.length];

    const covColor = covenantColorHex();
    const tooltipX = cardX - 80;
    const tooltipY = cardY;

    tradeTooltip = scene.add.container(tooltipX, tooltipY)
        .setScrollFactor(0)
        .setDepth(350);

    const bgImage = scene.add.image(0, 0, 'trade-ui')
        .setOrigin(0.5, 0.5)
        .setScale(1);

    const nameText = scene.add.text(5, -18, selectedRune.name, {
        fontFamily: FONT_FAMILY,
        fontSize: '10px',
        color: covColor,
        resolution: 2
    }).setOrigin(0.6, 0.5);

    const translationText = scene.add.text(5, -7, `"${selectedRune.translation}"`, {
        fontFamily: FONT_FAMILY,
        fontSize: '7px',
        color: '#aaaaaa',
        fontStyle: 'italic',
        resolution: 2
    }).setOrigin(0.6, 0.5);

    const typeText = scene.add.text(5, 4, selectedRune.effectType.toUpperCase(), {
        fontFamily: FONT_FAMILY,
        fontSize: '7px',
        color: getEffectColor(selectedRune.effectType),
        resolution: 2
    }).setOrigin(0.6, 0.5);

    const powerText = scene.add.text(5, 15, `Power: ${selectedRune.basePower}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '7px',
        color: '#cccccc',
        resolution: 2
    }).setOrigin(0.6, 0.5);

    tradeTooltip.add([bgImage, nameText, translationText, typeText, powerText]);
}

function hideRuneTooltip(): void {
    if (tradeTooltip) {
        tradeTooltip.destroy();
        tradeTooltip = null;
    }
}

function getEffectColor(effectType: string): string {
    switch (effectType) {
        case 'damage': return '#ff4444';
        case 'defense': return '#4488ff';
        case 'heal': return '#44ff44';
        case 'buff': return '#ffaa00';
        case 'debuff': return '#cc44cc';
        case 'utility': return '#44dddd';
        default: return '#ffffff';
    }
}

function executeTradeWithAnim(
    scene: Phaser.Scene,
    trade: TradeState,
    reward: TradeReward,
    runeLetter: string,
    setCinematic: (val: boolean) => void
): void {
    tradeLocked = true;

    scene.input.keyboard!.off(InputKeys.INTERACT);
    scene.input.off('pointermove', handleTradePointerMove);
    scene.input.off('pointerdown', handleCardClick);

    if (tradeInfoRightContainer) {
        scene.tweens.add({
            targets: tradeInfoRightContainer,
            alpha: 0,
            duration: 300,
            ease: 'Sine.easeOut',
            onComplete: () => {
                if (tradeInfoRightContainer) {
                    tradeInfoRightContainer.destroy();
                    tradeInfoRightContainer = null;
                }
            }
        });
    }

    if (tradeTooltip) {
        hideRuneTooltip();
    }

    if (tradeOverlay) {
        scene.tweens.add({
            targets: tradeOverlay,
            fillAlpha: 0,
            duration: 300,
            ease: 'Sine.easeOut'
        });
    }

    if (centerRuneContainer) {
        centerRuneContainer.setAlpha(0);
    }

    const playerData = PlayerData.getInstance();
    playerData.removeRune(runeLetter, 1);

    const runeData = RuneData.getInstance();
    const remainingCount = playerData.getRuneQuantity(runeLetter);
    if (remainingCount <= 0) {
        runeData.undiscoverRune(runeLetter);
    }

    switch (reward.type) {
        case 'gemstone':
            playerData.gemstones += reward.amount;
            break;
        case 'special':
            playerData.updateSpecialCurrency(reward.amount);
            break;
        case 'hp':
            playerData.heal(reward.amount);
            break;
    }

    trade.completed = true;
    saveCompletedTrade(trade.tradeType);

    const frames = getCovenantFrames();
    const animKey = `trade-anim-${trade.tradeType}`;

    if (!scene.anims.exists(animKey)) {
        const animFrames = [];
        for (let i = frames.start; i <= frames.end; i++) {
            animFrames.push({ key: 'trade', frame: i });
        }
        scene.anims.create({
            key: animKey,
            frames: animFrames,
            frameRate: 10,
            repeat: 0
        });
    }

    if (tradeCard) {
        tradeCard.play(animKey);

        tradeCard.once('animationcomplete', () => {
            if (tradeCard) {
                tradeCard.setFrame(frames.end);
            }

            if (centerRuneContainer) {
                centerRuneContainer.destroy();
                centerRuneContainer = null;
            }

            showTradeRewardPopup(scene, reward, runeLetter);

            if (tradeCard) {
                scene.tweens.add({
                    targets: tradeCard,
                    alpha: 0,
                    duration: 500,
                    ease: 'Sine.easeOut',
                    onComplete: () => {
                        cleanupTrade(scene);
                        setCinematic(false);
                    }
                });
            }
        });
    }
}

function showTradeRewardPopup(scene: Phaser.Scene, reward: TradeReward, runeLetter: string): void {
    const w = scene.scale.width;
    const h = scene.scale.height;
    const camZoom = 2;

    const startX = (w - 15 - w / 2) / camZoom + w / 2;
    const startY = (50 - h / 2) / camZoom + h / 2;

    const runeDef = RuneData.getDefinition(runeLetter);
    const runeName = runeDef ? runeDef.name : runeLetter;
    const covenant = PlayerData.getInstance().covenant;
    const covColorNum = COVENANT_COLORS[covenant] || 0xffffff;
    const covColorStr = '#' + covColorNum.toString(16).padStart(6, '0');

    const container = scene.add.container(startX, startY).setDepth(500).setScrollFactor(0);

    const lostText = scene.add.text(0, 0, `-1 ${runeName}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        color: '#ff6666',
        stroke: '#000000',
        strokeThickness: 4
    }).setOrigin(1, 0.5).setScale(0.5);
    container.add(lostText);

    let gainText: Phaser.GameObjects.Text;
    let gainIcon: Phaser.GameObjects.Sprite;

    if (reward.type === 'gemstone') {
        gainText = scene.add.text(0, 20, `+${reward.amount}`, {
            fontFamily: FONT_FAMILY,
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(1, 0.5).setScale(0.5);
        gainIcon = scene.add.sprite(-gainText.width * 0.5 - 5, 20, 'currency', 4)
            .setOrigin(1, 0.5)
            .setScale(1);
    } else if (reward.type === 'special') {
        const scFrame = covenant === 'snake' ? 1 : covenant === 'phoenix' ? 2 : 3;
        gainText = scene.add.text(0, 20, `+${reward.amount}`, {
            fontFamily: FONT_FAMILY,
            fontSize: '24px',
            color: covColorStr,
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(1, 0.5).setScale(0.5);
        gainIcon = scene.add.sprite(-gainText.width * 0.5 - 5, 20, 'currency', scFrame)
            .setOrigin(1, 0.5)
            .setScale(1);
    } else {
        gainText = scene.add.text(0, 20, `+${reward.amount} HP`, {
            fontFamily: FONT_FAMILY,
            fontSize: '24px',
            color: '#44ff44',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(1, 0.5).setScale(0.5);
        gainIcon = scene.add.sprite(-gainText.width * 0.5 - 5, 20, 'currency', 0)
            .setOrigin(1, 0.5)
            .setScale(1);
    }

    container.add([gainText, gainIcon]);

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