import * as Phaser from 'phaser';
import { LocationData } from '../../../data/LocationData';
import { ItemData, ItemDefinition } from '../../../data/ItemData';
import { PlayerData } from '../../../data/PlayerData';
import { UserData } from '../../../data/UserData';
import { parseCollisionObjects, parseStairObjects } from '../../../systems/CollisionParser';
import { DoorState, createDoors } from '../../../systems/DoorSystem';
import { SettlementDoor, createSettlementDoors } from '../../../systems/SettlementDoorSystem';
import { MechanicDoor, createMechanicDoors } from '../../../systems/MechanicDoorSystem';
import { BossButtonState, createBossButtons } from '../../../systems/BossButtonSystem';
import { ChestState, createChests } from '../../../systems/ChestSystem';
import { TradeState, createTrades } from '../../../systems/TradeSystem';
import { SlateState, createSlates } from '../../../systems/SlateInteraction';
import { PortalSystem } from '../../../systems/PortalSystem';
import { isPipeLayer, fillPipeLayer } from '../../../systems/PipeSystem';
import { MerchantState, createMerchants } from '../../../systems/MerchantSystem';
import { BossAttackSystem } from '../../../systems/BossAttackSystem';
import { RuneIndicatorSystem } from '../../../systems/RuneIndicatorSystem';
import { getLevelPlayerDepth, LevelPlayerHandles, spawnLevelPlayer } from './LevelPlayerController';

interface LevelMapBuilderConfig {
    mapKey: string;
    previousMap: string;
    portalSystem: PortalSystem;
    stairZones: Phaser.GameObjects.Group;
    overrideSpawnX: number | null;
    overrideSpawnY: number | null;
    isTeleportingFromRune: boolean;
    entryDirX: number;
    entryDirY: number;
    onEnteringChange: (isEntering: boolean) => void;
    onBossPillarDamaged: (pillarsDefeated: number) => void;
}

export interface LevelMapBuildResult extends LevelPlayerHandles {
    doors: DoorState[];
    settlementDoors: SettlementDoor[];
    mechanicDoors: MechanicDoor[];
    bossButtons: BossButtonState[];
    chests: ChestState[];
    trades: TradeState[];
    slates: SlateState[];
    merchants: MerchantState[];
    merchantItems: ItemDefinition[];
    barrierLayers: Phaser.Tilemaps.TilemapLayer[];
    barrierCollisionObjects: Array<{ x: number; y: number; width: number; height: number }>;
    barrierBodies: MatterJS.BodyType[];
    glossaryInteractZone: Phaser.GameObjects.Zone | null;
    glossaryTentaclesX: number;
    glossaryTentaclesY: number;
    bossAttackSystem?: BossAttackSystem;
    runeIndicatorSystem?: RuneIndicatorSystem;
    summitResumePillarsDefeated?: number;
}

function getLayerDepth(layerData: Phaser.Tilemaps.LayerData, fallback: number): number {
    let depthVal = fallback;
    const props = layerData.properties;

    if (Array.isArray(props)) {
        const depthProp = (props as any[]).find((p) => p && p.name === 'depth');
        if (depthProp && depthProp.value !== undefined) {
            depthVal = Number(depthProp.value);
        }
    } else if (props && typeof props === 'object') {
        const depthProp = (props as Record<string, unknown>)['depth'];
        if (depthProp !== undefined) {
            depthVal = Number(typeof depthProp === 'object' && depthProp !== null && 'value' in depthProp
                ? (depthProp as { value: unknown }).value
                : depthProp);
        }
    }

    return depthVal;
}

function generateMerchantItems(): ItemDefinition[] {
    const allItems = ItemData.getAllItems();
    const playerData = PlayerData.getInstance();
    const undiscovered = allItems.filter(item => (
        !ItemData.getInstance().isDiscovered(item.id)
        && playerData.getItemQuantity(item.id.toString()) === 0
    ));
    const pool = [...undiscovered];

    if (pool.length < 3) {
        const others = allItems.filter(item => !pool.includes(item));
        pool.push(...others);
    }

    const selected: ItemDefinition[] = [];
    const tempPool = [...pool];
    while (selected.length < 3 && tempPool.length > 0) {
        const randIdx = Math.floor(Math.random() * tempPool.length);
        const item = tempPool.splice(randIdx, 1)[0];
        if (item) selected.push(item);
    }
    while (selected.length < 3 && allItems[0]) {
        selected.push(allItems[0]);
    }

    return selected;
}

function getLocationIdForMap(mapKey: string): string | null {
    switch (mapKey) {
        case 'hub':
        case 'central-hub':
            return 'central_hub';
        case 'abandoned-settlement':
            return 'settlement_abandoned';
        case 'desert-settlement':
            return 'settlement_desert';
        case 'mechanic-settlement':
            return 'settlement_mechanic';
        case 'boss-floor-abandoned':
            return 'boss_abandoned';
        case 'boss-floor-desert':
            return 'boss_desert';
        case 'boss-floor-mechanic':
            return 'boss_mechanic';
        case 'summit-settlement':
            return 'summit';
        case 'summit-trade':
            return 'summit_trade';
        case 'merchant':
            return 'merchant';
        default:
            return null;
    }
}

export function discoverLocationForMap(mapKey: string): string | null {
    const locId = getLocationIdForMap(mapKey);
    if (!locId) return null;

    LocationData.getInstance().discoverLocation(locId);
    UserData.getInstance().checkCompletionist();
    return locId;
}

export function createLevelMap(scene: Phaser.Scene, config: LevelMapBuilderConfig): LevelMapBuildResult {
    const mapKey = config.mapKey;
    const doors: DoorState[] = [];
    let settlementDoors: SettlementDoor[] = [];
    let mechanicDoors: MechanicDoor[] = [];
    let bossButtons: BossButtonState[] = [];
    let chests: ChestState[] = [];
    let trades: TradeState[] = [];
    let slates: SlateState[] = [];
    let merchants: MerchantState[] = [];
    let merchantItems: ItemDefinition[] = [];
    const barrierCollisionObjects: LevelMapBuildResult['barrierCollisionObjects'] = [];
    const barrierLayers: Phaser.Tilemaps.TilemapLayer[] = [];
    const barrierBodies: MatterJS.BodyType[] = [];
    let glossaryInteractZone: Phaser.GameObjects.Zone | null = null;
    let glossaryTentaclesX = 0;
    let glossaryTentaclesY = 0;
    let bossAttackSystem: BossAttackSystem | undefined;
    let runeIndicatorSystem: RuneIndicatorSystem | undefined;
    let summitResumePillarsDefeated: number | undefined;

    const map = scene.make.tilemap({ key: mapKey });
    const tilesets: Phaser.Tilemaps.Tileset[] = [];
    map.tilesets.forEach(ts => {
        const boundTileset = map.addTilesetImage(ts.name, `${ts.name}.png`);
        if (boundTileset) tilesets.push(boundTileset);
    });

    map.layers.forEach((layerData, i) => {
        const layer = map.createLayer(layerData.name, tilesets) as Phaser.Tilemaps.TilemapLayer | null;
        if (!layer) return;

        let depthVal = getLayerDepth(layerData, i);
        if (layerData.name.toLowerCase().includes('slate')) {
            depthVal = getLevelPlayerDepth(mapKey) - 1;
        }
        if (layerData.name === 'Barrier' || layerData.name === 'Barrier+') {
            barrierLayers.push(layer);
            layer.setVisible(false);
        }
        layer.setDepth(layerData.name === 'Barrier' ? depthVal + 1 : depthVal);

        if (mapKey === 'central-hub' && isPipeLayer(layerData.name)) {
            fillPipeLayer(layer);
        }
    });

    scene.cameras.main.setZoom(2);
    scene.matter.world.setBounds(-2000, -2000, 4000, 4000);
    parseCollisionObjects(scene, map.objects);

    const barrierCollisionLayers = map.objects.filter(layer => layer.name.toLowerCase().includes('barrier'));
    for (const barrierLayer of barrierCollisionLayers) {
        for (const obj of barrierLayer.objects ?? []) {
            if (obj.x === undefined || obj.y === undefined || obj.width === undefined || obj.height === undefined) {
                continue;
            }
            barrierCollisionObjects.push({
                x: obj.x + obj.width / 2,
                y: obj.y + obj.height / 2,
                width: obj.width,
                height: obj.height
            });
        }
    }

    const stairsLayer = map.objects.find(layer => layer.name.toLowerCase() === 'stairs');
    if (stairsLayer) parseStairObjects(scene, stairsLayer, config.stairZones);

    const portalsLayer = map.objects.find(layer => layer.name.toLowerCase() === 'portals');
    if (portalsLayer) config.portalSystem.parsePortals(portalsLayer, mapKey, config.previousMap);

    const merchantEntranceLayer = map.objects.find(layer => layer.name === 'merchant_entrance');
    if (merchantEntranceLayer) config.portalSystem.parseMerchantEntrances(merchantEntranceLayer);

    const doorLayer = map.objects.find(layer => layer.name.toLowerCase() === 'door');
    if (doorLayer) {
        if (mapKey === 'mechanic-settlement' || mapKey === 'abandoned-settlement') {
            mechanicDoors = createMechanicDoors(scene, doorLayer, mapKey);
        } else {
            doors.push(...createDoors(scene, doorLayer));
        }
    }

    settlementDoors = createSettlementDoors(scene, map, mapKey);

    const buttonLayer = map.objects.find(layer => layer.name.toLowerCase() === 'button');
    if (buttonLayer) bossButtons = createBossButtons(scene, buttonLayer, mapKey);

    const chestLayer = map.objects.find(layer => layer.name.toLowerCase() === 'chests');
    if (chestLayer) chests = createChests(scene, chestLayer, mapKey, getLevelPlayerDepth(mapKey) - 1);

    const tradeLayer = map.objects.find(layer => layer.name.toLowerCase() === 'trades');
    if (tradeLayer) trades = createTrades(scene, tradeLayer, mapKey);

    const slateLayer = map.objects.find(layer => layer.name.toLowerCase() === 'slates');
    if (slateLayer) slates = createSlates(scene, slateLayer, mapKey);

    const fillersLayer = map.objects.find(layer => layer.name.toLowerCase() === 'fillers');
    if (fillersLayer) {
        const fillerSlates = createSlates(scene, fillersLayer, mapKey);
        const fillerIds = ['slate_ancestry', 'slate_void', 'slate_whispers'];
        fillerSlates.forEach((slate, index) => {
            slate.slateId = fillerIds[index % fillerIds.length];
        });
        slates.push(...fillerSlates);
    }

    const merchantLayer = map.objects.find(layer => layer.name.toLowerCase() === 'merchant');
    if (merchantLayer) {
        merchants = createMerchants(merchantLayer);
        merchantItems = generateMerchantItems();
    }

    const glossaryLayer = map.objects.find(layer => layer.name.toLowerCase() === 'glossary');
    const glossaryObj = glossaryLayer?.objects?.[0];
    if (
        glossaryObj
        && glossaryObj.x !== undefined
        && glossaryObj.y !== undefined
        && glossaryObj.width !== undefined
        && glossaryObj.height !== undefined
    ) {
        glossaryTentaclesX = glossaryObj.x + glossaryObj.width / 2;
        glossaryTentaclesY = glossaryObj.y + glossaryObj.height / 2;
        glossaryInteractZone = scene.add.zone(glossaryTentaclesX, glossaryTentaclesY, glossaryObj.width, glossaryObj.height);
        glossaryInteractZone.setInteractive();
    }

    const spawn = map.objects.find(layer => layer.name.toLowerCase() === 'spawn')?.objects?.[0];
    const spawnPos = config.portalSystem.calculateSpawn(portalsLayer, merchantEntranceLayer, mapKey, config.previousMap, 54);
    let spawnX = spawnPos.x;
    let spawnY = spawnPos.y;

    if (
        spawn
        && spawn.x !== undefined
        && spawn.y !== undefined
        && spawn.width !== undefined
        && spawn.height !== undefined
    ) {
        spawnX = spawn.x + spawn.width / 2;
        spawnY = spawn.y + spawn.height / 2;
    }

    const { player, playerShadow } = spawnLevelPlayer(
        scene,
        config.overrideSpawnX ?? spawnX,
        config.overrideSpawnY ?? spawnY
    );
    const playerDepth = getLevelPlayerDepth(mapKey);
    player.setDepth(playerDepth);
    playerShadow.setDepth(playerDepth);

    if (mapKey === 'summit-settlement') {
        bossAttackSystem = new BossAttackSystem(scene, player);

        if (barrierCollisionObjects.length > 0) {
            const pillarsLayer = map.objects.find(layer => layer.name.toLowerCase() === 'pillars');
            const customPillarPositions: { x: number; y: number }[] = [];
            for (const obj of pillarsLayer?.objects ?? []) {
                if (obj.x !== undefined && obj.y !== undefined && obj.width !== undefined && obj.height !== undefined) {
                    customPillarPositions.push({
                        x: obj.x + obj.width / 2,
                        y: obj.y + obj.height / 2
                    });
                }
            }
            customPillarPositions.sort((a, b) => a.y - b.y || a.x - b.x);

            runeIndicatorSystem = new RuneIndicatorSystem(scene, player, barrierCollisionObjects, customPillarPositions);
            runeIndicatorSystem.setBossAttackSystem(bossAttackSystem);
            runeIndicatorSystem.setOnPillarDamaged(config.onBossPillarDamaged);
        }

        if (localStorage.getItem('glossary_boss_fight_active') === 'true') {
            summitResumePillarsDefeated = parseInt(localStorage.getItem('glossary_boss_pillars_defeated') || '0', 10);
        }
    }

    if (config.isTeleportingFromRune) {
        scene.cameras.main.fadeIn(1200, 255, 255, 255);
    } else {
        scene.cameras.main.fadeIn(800, 0, 0, 0);
    }

    if (config.entryDirX !== 0 || config.entryDirY !== 0) {
        config.onEnteringChange(true);
        if (config.entryDirX < 0) player.setFlipX(true);
        else if (config.entryDirX > 0) player.setFlipX(false);

        const duration = config.previousMap === 'merchant' ? 200 : 400;
        scene.time.delayedCall(duration, () => {
            config.onEnteringChange(false);
        });
    }

    return {
        player,
        playerShadow,
        doors,
        settlementDoors,
        mechanicDoors,
        bossButtons,
        chests,
        trades,
        slates,
        merchants,
        merchantItems,
        barrierLayers,
        barrierCollisionObjects,
        barrierBodies,
        glossaryInteractZone,
        glossaryTentaclesX,
        glossaryTentaclesY,
        bossAttackSystem,
        runeIndicatorSystem,
        summitResumePillarsDefeated
    };
}
