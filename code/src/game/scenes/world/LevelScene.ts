import * as Phaser from 'phaser';
import { createVignette } from '../../utils/Vignette';
import { InputKeys } from '../../constants';
import { LocationData } from '../../data/LocationData';
import { parseCollisionObjects, parseStairObjects } from '../../systems/CollisionParser';
import { DoorState, createDoors, handleDoorInteraction } from '../../systems/DoorSystem';
import { SettlementDoor, createSettlementDoors, handleSettlementDoorInteraction } from '../../systems/SettlementDoorSystem';
import { MechanicDoor, createMechanicDoors, handleMechanicDoorInteraction } from '../../systems/MechanicDoorSystem';
import { BossButtonState, createBossButtons, handleBossButtonInteraction } from '../../systems/BossButtonSystem';
import { ChestState, createChests, handleChestInteraction } from '../../systems/ChestSystem';
import { TradeState, createTrades, handleTradeInteraction } from "../../systems/TradeSystem";
import { SlateState, createSlates, handleSlateInteraction } from '../../systems/SlateInteraction';
import { PortalSystem } from '../../systems/PortalSystem';
import { PlayerData } from '../../data/PlayerData';
import { ItemData, ItemDefinition } from '../../data/ItemData';
import { CombatTrackerHUD } from '../../systems/CombatTrackerHUD';
import { isPipeLayer, fillPipeLayer } from '../../systems/PipeSystem';
import { RaidhoRuneSystem } from '../../systems/RaidhoRuneSystem';
import { MerchantState, createMerchants, handleMerchantInteraction } from '../../systems/MerchantSystem';
import { DashSystem } from '../../systems/DashSystem';
import { LightSystem } from '../../systems/LightSystem';

export class LevelScene extends Phaser.Scene {
    private player!: Phaser.Physics.Matter.Sprite;
    private playerShadow!: Phaser.GameObjects.Image;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private keys!: { W: Phaser.Input.Keyboard.Key, A: Phaser.Input.Keyboard.Key, S: Phaser.Input.Keyboard.Key, D: Phaser.Input.Keyboard.Key };
    private mapKey!: string;
    private portalSystem!: PortalSystem;

    private targetSlowFactor = 1;
    private currentSlowFactor = 1;
    private stairZones!: Phaser.GameObjects.Group;
    private inReverseZone = false;

    private activeStairZones: Set<number> = new Set();
    private doors: DoorState[] = [];
    private settlementDoors: SettlementDoor[] = [];
    private mechanicDoors: MechanicDoor[] = [];
    private bossButtons: BossButtonState[] = [];
    private chests: ChestState[] = [];
    private trades: TradeState[] = [];
    private slates: SlateState[] = [];
    private interactKey!: Phaser.Input.Keyboard.Key;
    private isCinematic = false;
    private glossaryBtn!: Phaser.GameObjects.Sprite;
    private settingsBtn!: Phaser.GameObjects.Sprite;
    private wasInteractPressed = { value: false };
    private combatTrackerHUD!: CombatTrackerHUD;
    private raidhoRuneSystem?: RaidhoRuneSystem;
    private merchants: MerchantState[] = [];
    public merchantItems: ItemDefinition[] = [];

    private dashKey!: Phaser.Input.Keyboard.Key;
    private dashSystem!: DashSystem;

    constructor() {
        super('LevelScene');
    }

    private previousMap: string = '';
    private entryDirX: number = 0;
    private entryDirY: number = 0;
    private isEntering = false;
    private overrideSpawnX: number | null = null;
    private overrideSpawnY: number | null = null;
    private isTeleportingFromRune = false;

    init(data: { mapKey?: string, previousMap?: string, entryDirX?: number, entryDirY?: number, spawnX?: number, spawnY?: number, teleportFromRune?: boolean }) {
        this.mapKey = data?.mapKey || 'hub';
        this.previousMap = data?.previousMap || '';
        this.entryDirX = data?.entryDirX || 0;
        this.entryDirY = data?.entryDirY || 0;
        this.overrideSpawnX = data?.spawnX ?? null;
        this.overrideSpawnY = data?.spawnY ?? null;
        this.isTeleportingFromRune = data?.teleportFromRune ?? false;
        this.isEntering = false;
        this.isCinematic = false;
    }

    preload() {
        this.load.image('Abandoned-Floor.png', 'assets/Models/exports/tileset/Abandoned-Floor.png');
        this.load.image('Desert-Floor.png', 'assets/Models/exports/tileset/Desert-Floor.png');
        this.load.image('Mechanic-Floor.png', 'assets/Models/exports/tileset/Mechanic-Floor.png');
        this.load.image('Objects.png', 'assets/Models/exports/tileset/Objects.png');
        this.load.image('Summit-Floor.png', 'assets/Models/exports/tileset/Summit-Floor.png');

        this.load.tilemapTiledJSON('central-hub', 'assets/Models/exports/Maps/central-hub.json');
        this.load.tilemapTiledJSON('boss-floor-abandoned', 'assets/Models/exports/Maps/boss-floor-abandoned.json');
        this.load.tilemapTiledJSON('boss-floor-desert', 'assets/Models/exports/Maps/boss-floor-desert.json');
        this.load.tilemapTiledJSON('boss-floor-mechanic', 'assets/Models/exports/Maps/boss-floor-mechanic.json');

        this.load.tilemapTiledJSON('abandoned-settlement', 'assets/Models/exports/Maps/abandoned-settlement.json');
        this.load.tilemapTiledJSON('desert-settlement', 'assets/Models/exports/Maps/desert-settlement.json');
        this.load.tilemapTiledJSON('mechanic-settlement', 'assets/Models/exports/Maps/mechanic-settlement.json');

        this.load.tilemapTiledJSON('summit-trade', 'assets/Models/exports/Maps/summit-trade.json');
        this.load.tilemapTiledJSON('merchant', 'assets/Models/exports/Maps/merchant.json');

        this.load.spritesheet('door-sheet-mechanic', 'assets/Models/exports/Animations/Door-Sheet-Mechanic-Sheet.png', { frameWidth: 32, frameHeight: 64 });
        this.load.spritesheet('door-sheet', 'assets/Models/exports/Animations/Door-Sheet.png', { frameWidth: 64, frameHeight: 96 });
        this.load.spritesheet('door-symbol', 'assets/Models/exports/Animations/Door-Symbol.png', { frameWidth: 64, frameHeight: 96 });

        this.load.spritesheet('protagonist-idle', `assets/Models/Protagonist/Idle-${this.registry.get('playerData').covenant}.png`, { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('protagonist-run', `assets/Models/Protagonist/Run-${this.registry.get('playerData').covenant}.png`, { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('protagonist-dash', `assets/Models/Protagonist/Dash-${this.registry.get('playerData').covenant}.png`, { frameWidth: 48, frameHeight: 48 });
        this.load.image('protagonist-shadow', `assets/Models/Protagonist/Shadow.png`);

        this.load.spritesheet('btn-boss-abandoned', 'assets/Models/exports/Animations/Btn-Boss-Abandoned.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('btn-boss-desert', 'assets/Models/exports/Animations/Btn-Boss-Desert.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('btn-boss-mechanic', 'assets/Models/exports/Animations/Btn-Boss-Mechanic.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('btn-boss-summit', 'assets/Models/exports/Animations/Btn-Boss-Summit.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('btn-boss-symbol', 'assets/Models/exports/Animations/Btn-Boss-Symbol.png', { frameWidth: 64, frameHeight: 64 });

        this.load.spritesheet('chests', 'assets/Models/exports/Animations/Chests.png', { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet('items', 'assets/Models/exports/Objects/Items.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('interact-btn', 'assets/Models/exports/UI/Interact-Btn.png');
        this.load.image('achievement-ui', 'assets/Models/exports/UI/Achievement-UI.png');
        this.load.image('settings-btn', 'assets/Models/exports/UI/Settings-Btn.png');
        this.load.spritesheet('currency', 'assets/Models/exports/Objects/Currency.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('trade', 'assets/Models/exports/Animations/Trade.png', { frameWidth: 160, frameHeight: 190 });
        this.load.spritesheet('combat-symbol-ui', 'assets/Models/exports/UI/Combat-Symbol-UI.png', { frameWidth: 32, frameHeight: 32 });
    }

    create() {
        this.stairZones = this.add.group();
        this.inReverseZone = false;
        this.targetSlowFactor = 1;
        this.currentSlowFactor = 1;
        this.activeStairZones.clear();
        this.doors = [];
        this.settlementDoors = [];
        this.bossButtons = [];
        this.chests = [];
        this.trades = [];
        this.slates = [];
        this.merchants = [];
        this.merchantItems = [];

        this.dashSystem = new DashSystem();
        this.dashSystem.reset();

        if (this.scene.isActive('CombatScene')) this.scene.stop('CombatScene');

        this.cameras.main.setBackgroundColor('#111111');
        if (this.portalSystem) this.portalSystem.destroy();
        this.portalSystem = new PortalSystem(this);

        if (this.mapKey === 'hub' || this.mapKey === 'central-hub') this.createMap('central-hub');
        else this.createMap(this.mapKey);

        let locId: string | null = null;
        if (this.mapKey === 'hub' || this.mapKey === 'central-hub') locId = 'central_hub';
        else if (this.mapKey === 'abandoned-settlement') locId = 'settlement_abandoned';
        else if (this.mapKey === 'desert-settlement') locId = 'settlement_desert';
        else if (this.mapKey === 'mechanic-settlement') locId = 'settlement_mechanic';
        else if (this.mapKey === 'boss-floor-abandoned') locId = 'boss_abandoned';
        else if (this.mapKey === 'boss-floor-desert') locId = 'boss_desert';
        else if (this.mapKey === 'boss-floor-mechanic') locId = 'boss_mechanic';
        else if (this.mapKey === 'summit-trade') locId = 'summit_trade';
        else if (this.mapKey === 'merchant') locId = 'merchant';
        if (locId) LocationData.getInstance().discoverLocation(locId);

        if (!this.anims.exists('idle')) {
            this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('protagonist-idle', { start: 0, end: 6 }), frameRate: 8, repeat: -1 });
            this.anims.create({ key: 'run-start', frames: this.anims.generateFrameNumbers('protagonist-run', { start: 0, end: 7 }), frameRate: 12, repeat: 0 });
            this.anims.create({ key: 'run-loop', frames: this.anims.generateFrameNumbers('protagonist-run', { start: 0, end: 7 }), frameRate: 12, repeat: -1 });
            this.anims.create({ key: 'stop', frames: this.anims.generateFrameNumbers('protagonist-idle', { start: 0, end: 0 }), frameRate: 12, repeat: 0 });
            this.anims.create({ key: 'dash', frames: this.anims.generateFrameNumbers('protagonist-dash', { start: 0, end: 11 }), frameRate: 80, repeat: 0 });
        }

        this.cursors = this.input.keyboard!.createCursorKeys();
        this.keys = this.input.keyboard!.addKeys('W,A,S,D') as any;
        this.interactKey = this.input.keyboard!.addKey('X');
        this.dashKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

        if (!this.anims.exists('door-open')) {
            const frames = [];
            for (let i = 0; i <= 13; i++) {
                const t = i / 13;
                frames.push({ key: 'door-sheet', frame: i, duration: 60 + t * t * 200 });
            }
            this.anims.create({ key: 'door-open', frames, repeat: 0 });
        }

        this.input.keyboard!.on(InputKeys.HELP, () => {
            if (!this.scene.isPaused()) { this.scene.pause(); this.scene.launch('Help', { previousScene: 'LevelScene' }); }
        });

        const w = this.scale.width, h = this.scale.height, camZoom = 2;
        const glossaryScreenX = (15 - w / 2) / camZoom + w / 2;
        const glossaryScreenY = (h - 15 - h / 2) / camZoom + h / 2;
        this.glossaryBtn = this.add.sprite(glossaryScreenX, glossaryScreenY, 'glossary', 0).setOrigin(0, 1).setScrollFactor(0).setDepth(200).setScale(2 / camZoom).setInteractive({ useHandCursor: true });
        this.glossaryBtn.on('pointerdown', () => { if (!this.scene.isActive('GlossaryUI')) { this.scene.pause(); this.scene.launch('GlossaryUI', { previousScene: 'LevelScene', isPaused: true }); } });
        this.input.keyboard!.on(InputKeys.GLOSSARY, () => { if (!this.scene.isActive('GlossaryUI')) { this.scene.pause(); this.scene.launch('GlossaryUI', { previousScene: 'LevelScene', isPaused: true }); } });

        this.time.addEvent({
            delay: 1000, loop: true, callback: () => {
                if (this.player && this.player.active) {
                    const pd = PlayerData.getInstance();
                    pd.lastMap = this.mapKey; pd.lastX = this.player.x; pd.lastY = this.player.y; pd.save();
                }
            }
        });

        const settingsScreenX = (w - 15 - w / 2) / camZoom + w / 2;
        const settingsScreenY = (h - 15 - h / 2) / camZoom + h / 2;
        this.settingsBtn = this.add.sprite(settingsScreenX, settingsScreenY, 'settings-btn').setOrigin(1, 1).setScrollFactor(0).setDepth(200).setScale(1 / camZoom).setInteractive({ useHandCursor: true });
        this.settingsBtn.on('pointerover', () => this.settingsBtn.setTint(0xaaaaaa));
        this.settingsBtn.on('pointerout', () => this.settingsBtn.clearTint());
        this.settingsBtn.on('pointerdown', () => { if (!this.scene.isActive('Help')) { this.scene.pause(); this.scene.launch('Help', { previousScene: 'LevelScene' }); } });

        createVignette(this);
        new LightSystem(this, 0.55, 0x000000);

        this.combatTrackerHUD = new CombatTrackerHUD(this, this.mapKey);
        if (this.mapKey === 'hub' || this.mapKey === 'central-hub') this.raidhoRuneSystem = new RaidhoRuneSystem(this, 0, 5);

        this.matter.world.on('collisionstart', (event: any) => {
            event.pairs.forEach((pair: any) => {
                const { bodyA, bodyB } = pair;
                const gameObjectA = bodyA.gameObject;
                const gameObjectB = bodyB.gameObject;
                if (gameObjectA === this.player || gameObjectB === this.player) {
                    const other = gameObjectA === this.player ? gameObjectB : gameObjectA;
                    if (other && other.getData) {
                        if (other.getData('reverseSlow')) { this.inReverseZone = true; this.updateSlowFactor(); }
                        if (other.getData('isStair') && !this.inReverseZone) {
                            const stairId = other.getData('stairId') ?? (other as any).id;
                            if (stairId !== undefined) { this.activeStairZones.add(stairId); this.updateSlowFactor(); }
                        }
                        if (other.getData('target') && !this.isEntering) this.portalSystem.onPortalOverlap(other, this.player, this.mapKey);
                    }
                }
            });
        });

        this.matter.world.on('collisionend', (event: any) => {
            event.pairs.forEach((pair: any) => {
                const { bodyA, bodyB } = pair;
                const gameObjectA = bodyA.gameObject;
                const gameObjectB = bodyB.gameObject;
                if (gameObjectA === this.player || gameObjectB === this.player) {
                    const other = gameObjectA === this.player ? gameObjectB : gameObjectA;
                    if (other && other.getData) {
                        if (other.getData('reverseSlow')) { this.inReverseZone = false; this.updateSlowFactor(); }
                        if (other.getData('isStair') && !this.inReverseZone) {
                            const stairId = other.getData('stairId') ?? (other as any).id;
                            if (stairId !== undefined) { this.activeStairZones.delete(stairId); this.updateSlowFactor(); }
                        }
                    }
                }
            });
        });
    }

    private updateSlowFactor(): void {
        if (this.inReverseZone) this.targetSlowFactor = 1;
        else if (this.activeStairZones.size > 0) this.targetSlowFactor = 0.6;
        else this.targetSlowFactor = 1;
    }

    private createMap(mapKey: string) {
        this.doors = [];
        this.settlementDoors = [];
        this.mechanicDoors = [];
        this.bossButtons = [];
        this.chests = [];
        this.trades = [];
        this.slates = [];
        this.merchants = [];

        const map = this.make.tilemap({ key: mapKey });
        const tilesets: Phaser.Tilemaps.Tileset[] = [];
        map.tilesets.forEach(ts => {
            const boundTileset = map.addTilesetImage(ts.name, ts.name + '.png');
            if (boundTileset) tilesets.push(boundTileset);
        });
        map.layers.forEach((layerData, i) => {
            const layer = map.createLayer(layerData.name, tilesets);
            if (layer) {
                let depthVal = i;
                const props = layerData.properties;
                if (props) {
                    if (Array.isArray(props)) {
                        const depthProp = props.find((p: any) => p && p.name === 'depth');
                        if (depthProp && depthProp.value !== undefined) depthVal = Number(depthProp.value);
                    } else if (typeof props === 'object') {
                        const depthProp = (props as any)['depth'];
                        if (depthProp !== undefined) depthVal = Number(typeof depthProp === 'object' ? depthProp.value : depthProp);
                    }
                }
                if (layerData.name.toLowerCase().includes('slate')) depthVal = this.getPlayerDepth(mapKey) - 1;
                layer.setDepth(depthVal);
                if (mapKey === 'central-hub' && isPipeLayer(layerData.name)) fillPipeLayer(layer);
            }
        });

        this.cameras.main.setZoom(2);
        this.matter.world.setBounds(-2000, -2000, 4000, 4000);
        parseCollisionObjects(this, map.objects);

        const stairsLayer = map.objects.find(layer => layer.name.toLowerCase() === 'stairs');
        if (stairsLayer) parseStairObjects(this, stairsLayer, this.stairZones);

        const portalsLayer = map.objects.find(layer => layer.name.toLowerCase() === 'portals');
        if (portalsLayer) this.portalSystem.parsePortals(portalsLayer, this.mapKey, this.previousMap);

        const merchantEntranceLayer = map.objects.find(layer => layer.name === 'merchant_entrance');
        if (merchantEntranceLayer) this.portalSystem.parseMerchantEntrances(merchantEntranceLayer);

        const doorLayer = map.objects.find(layer => layer.name.toLowerCase() === 'door');
        if (doorLayer) {
            if (mapKey === 'mechanic-settlement' || mapKey === 'abandoned-settlement') this.mechanicDoors = createMechanicDoors(this, doorLayer, mapKey);
            else this.doors = createDoors(this, doorLayer);
        }

        this.settlementDoors = createSettlementDoors(this, map, mapKey);

        const buttonLayer = map.objects.find(layer => layer.name.toLowerCase() === 'button');
        if (buttonLayer) this.bossButtons = createBossButtons(this, buttonLayer, mapKey);

        const chestLayer = map.objects.find(layer => layer.name.toLowerCase() === 'chests');
        if (chestLayer) this.chests = createChests(this, chestLayer, mapKey, this.getPlayerDepth(mapKey) - 1);

        const tradeLayer = map.objects.find(layer => layer.name.toLowerCase() === 'trades');
        if (tradeLayer) this.trades = createTrades(this, tradeLayer, mapKey);

        const slateLayer = map.objects.find(layer => layer.name.toLowerCase() === 'slates');
        if (slateLayer) this.slates = createSlates(this, slateLayer, mapKey);
        else this.slates = [];

        const fillersLayer = map.objects.find(layer => layer.name.toLowerCase() === 'fillers');
        if (fillersLayer) {
            const fillerSlates = createSlates(this, fillersLayer, mapKey);
            const fillerIds = ['slate_ancestry', 'slate_void', 'slate_whispers'];
            fillerSlates.forEach((slate, index) => { slate.slateId = fillerIds[index % fillerIds.length]; });
            this.slates.push(...fillerSlates);
        }

        const merchantLayer = map.objects.find(layer => layer.name.toLowerCase() === 'merchant');
        if (merchantLayer) {
            this.merchants = createMerchants(this, merchantLayer);
            this.generateMerchantItems();
        } else {
            this.merchants = [];
            this.merchantItems = [];
        }

        const OFFSET = 54;
        const spawnPos = this.portalSystem.calculateSpawn(portalsLayer, merchantEntranceLayer, mapKey, this.previousMap, OFFSET);
        let spawnX = spawnPos.x, spawnY = spawnPos.y;
        this.spawnPlayer(this.overrideSpawnX !== null ? this.overrideSpawnX : spawnX, this.overrideSpawnY !== null ? this.overrideSpawnY : spawnY);
        this.overrideSpawnX = null;
        this.overrideSpawnY = null;
        const playerDepth = this.getPlayerDepth(mapKey);
        this.player.setDepth(playerDepth);
        this.playerShadow.setDepth(playerDepth);

        if (this.isTeleportingFromRune) this.cameras.main.fadeIn(1200, 255, 255, 255);
        else this.cameras.main.fadeIn(800, 0, 0, 0);

        if (this.entryDirX !== 0 || this.entryDirY !== 0) {
            this.isEntering = true;
            if (this.entryDirX < 0) this.player.setFlipX(true);
            else if (this.entryDirX > 0) this.player.setFlipX(false);
            const duration = this.previousMap === 'merchant' ? 200 : 400;
            this.time.delayedCall(duration, () => { this.isEntering = false; });
        }
    }

    private spawnPlayer(x: number, y: number) {
        this.player = this.matter.add.sprite(x, y, 'protagonist-idle');
        this.player.setDepth(15);
        this.player.setRectangle(20, 6, { chamfer: { radius: 2 } });
        this.player.setOrigin(0.5, 0.67);
        this.player.setFixedRotation();
        this.player.setFriction(1);
        this.player.setFrictionAir(0.05);
        this.player.setFrictionStatic(1);
        this.player.setBounce(0);
        this.player.setMass(10);

        this.playerShadow = this.add.image(x, y + 16, 'protagonist-shadow');
        this.playerShadow.setOrigin(0.5, 1.06);
        this.playerShadow.setDepth(14);
        this.playerShadow.setAlpha(0.6);
        this.playerShadow.setScale(0.8);

        this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
        this.player.play('idle');
    }

    update(_time: number, delta: number) {
        if (this.dashSystem.updateTimers(delta, this.player, this.playerShadow)) return;

        handleDoorInteraction(this, this.doors, this.player, this.interactKey.isDown, delta, this.isCinematic, this.portalSystem.getIsTeleporting(), this.isEntering, (val) => { this.isCinematic = val; });
        handleSettlementDoorInteraction(this, this.settlementDoors, this.player, this.interactKey.isDown, this.wasInteractPressed);
        handleMechanicDoorInteraction(this, this.mechanicDoors, this.player, this.interactKey.isDown, this.wasInteractPressed);
        handleBossButtonInteraction(this, this.bossButtons, this.player, this.interactKey.isDown, this.isCinematic, this.portalSystem.getIsTeleporting(), this.isEntering, (val) => { this.isCinematic = val; }, this.mapKey, delta);
        handleChestInteraction(this, this.chests, this.player, this.interactKey.isDown, delta, this.isCinematic, this.portalSystem.getIsTeleporting(), this.isEntering);
        if (this.mapKey === 'summit-trade') handleTradeInteraction(this, this.trades, this.player, this.interactKey.isDown, this.wasInteractPressed, (val) => { this.isCinematic = val; });
        handleSlateInteraction(this, this.slates, this.player, this.interactKey.isDown, this.wasInteractPressed, this.isCinematic, this.portalSystem.getIsTeleporting(), this.isEntering, this.mapKey);
        if (this.raidhoRuneSystem) this.raidhoRuneSystem.update(this.player, this.interactKey.isDown, delta, this.isCinematic, this.portalSystem.getIsTeleporting(), this.isEntering, (val) => { this.isCinematic = val; });
        if (this.mapKey === 'merchant') handleMerchantInteraction(this, this.merchants, this.player, this.interactKey.isDown, this.wasInteractPressed, this.isCinematic, this.portalSystem.getIsTeleporting(), this.isEntering);

        this.currentSlowFactor = Phaser.Math.Linear(this.currentSlowFactor, this.targetSlowFactor, 0.05);
        const runSpeed = 3 * this.currentSlowFactor;
        const body = this.player.body as MatterJS.BodyType;

        let moveX = 0, moveY = 0, moving = false;

        if (this.portalSystem.getIsTeleporting()) {
            const dir = this.portalSystem.getTeleportDirection();
            moveX = dir.x; moveY = dir.y;
            if (moveX < 0) this.player.setFlipX(true);
            else if (moveX > 0) this.player.setFlipX(false);
            const modifier = this.portalSystem.getTeleportSpeedModifier();
            const currentSpeed = runSpeed * modifier;
            const isTeleportStopped = modifier === 0;
            if (isTeleportStopped) {
                this.player.setVelocity(body.velocity.x * 0.85, body.velocity.y * 0.85);
                this.player.anims.timeScale = 1;
                if (this.player.anims.currentAnim?.key === 'run-start' || this.player.anims.currentAnim?.key === 'run-loop') this.player.play('stop').chain('idle');
                else if (this.player.anims.currentAnim?.key !== 'stop' && this.player.anims.currentAnim?.key !== 'idle') this.player.play('idle');
            } else {
                const inputVelocity = new Phaser.Math.Vector2(moveX, moveY).normalize().scale(currentSpeed);
                this.player.setVelocity(inputVelocity.x, inputVelocity.y);
                this.player.anims.timeScale = this.currentSlowFactor * modifier;
                if (this.player.anims.currentAnim?.key !== 'run-start' && this.player.anims.currentAnim?.key !== 'run-loop') this.player.play('run-start').chain('run-loop');
            }
        } else if (this.isEntering) {
            const inputVelocity = new Phaser.Math.Vector2(this.entryDirX, this.entryDirY).normalize().scale(runSpeed);
            this.player.setVelocity(inputVelocity.x, inputVelocity.y);
            this.player.anims.timeScale = this.currentSlowFactor;
            if (this.player.anims.currentAnim?.key !== 'run-start' && this.player.anims.currentAnim?.key !== 'run-loop') this.player.play('run-start').chain('run-loop');
        } else if (this.isCinematic) {
        } else {
            const left = this.cursors.left.isDown || this.keys.A.isDown;
            const right = this.cursors.right.isDown || this.keys.D.isDown;
            const up = this.cursors.up.isDown || this.keys.W.isDown;
            const down = this.cursors.down.isDown || this.keys.S.isDown;

            moveX = (right ? 1 : 0) - (left ? 1 : 0);
            moveY = (down ? 1 : 0) - (up ? 1 : 0);
            moving = (moveX !== 0 || moveY !== 0);

            if (moving) {
                if (moveX < 0) this.player.setFlipX(true);
                else if (moveX > 0) this.player.setFlipX(false);
                const inputVelocity = new Phaser.Math.Vector2(moveX, moveY).normalize().scale(runSpeed);
                this.player.setVelocity(inputVelocity.x, inputVelocity.y);
                this.player.anims.timeScale = this.currentSlowFactor;
                if (this.player.anims.currentAnim?.key !== 'run-start' && this.player.anims.currentAnim?.key !== 'run-loop') this.player.play('run-start').chain('run-loop');
            } else {
                this.player.setVelocity(body.velocity.x * 0.85, body.velocity.y * 0.85);
                this.player.anims.timeScale = 1;
                if (this.player.anims.currentAnim?.key === 'run-start' || this.player.anims.currentAnim?.key === 'run-loop') this.player.play('stop').chain('idle');
                else if (this.player.anims.currentAnim?.key !== 'stop' && this.player.anims.currentAnim?.key !== 'idle') this.player.play('idle');
            }
        }

        const dashJustPressed = Phaser.Input.Keyboard.JustDown(this.dashKey);
        const canDash = !this.portalSystem.getIsTeleporting() && !this.isEntering && !this.isCinematic;
        this.dashSystem.tryTrigger(dashJustPressed, moveX, moveY, this.player, canDash);

        if (this.playerShadow && this.player.active) {
            this.playerShadow.setPosition(this.player.x, this.player.y + 16);
            this.playerShadow.setFlipX(this.player.flipX);
        }
    }

    private getPlayerDepth(mapKey: string): number {
        switch (mapKey) {
            case 'boss-floor-abandoned': return 9;
            case 'boss-floor-desert': return 12;
            case 'boss-floor-mechanic': return 10;
            case 'abandoned-settlement': return 13;
            case 'desert-settlement': return 14;
            case 'mechanic-settlement': return 13;
            case 'summit-trade': return 4;
            case 'merchant': return 9;
            default: return 14;
        }
    }

    private generateMerchantItems(): void {
        const allItems = ItemData.getAllItems();
        const pd = PlayerData.getInstance();
        const undiscovered = allItems.filter(item => !ItemData.getInstance().isDiscovered(item.id) && pd.getItemQuantity(item.id.toString()) === 0);
        const pool = [...undiscovered];
        if (pool.length < 3) {
            const others = allItems.filter(item => !pool.includes(item));
            pool.push(...others);
        }
        const selected: ItemDefinition[] = [];
        const tempPool = [...pool];
        while (selected.length < 3 && tempPool.length > 0) {
            const randIdx = Math.floor(Math.random() * tempPool.length);
            selected.push(tempPool.splice(randIdx, 1)[0]);
        }
        while (selected.length < 3) selected.push(allItems[0]);
        this.merchantItems = selected;
    }
}