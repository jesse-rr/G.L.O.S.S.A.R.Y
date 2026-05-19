import * as Phaser from 'phaser';
import { createVignette } from '../../utils/Vignette';
import { InputKeys } from '../../constants';
import { LocationData } from '../../data/LocationData';
import { parseCollisionObjects, parseStairObjects } from '../../systems/CollisionParser';
import { DoorState, createDoors, handleDoorInteraction } from '../../systems/DoorSystem';
import { BossButtonState, createBossButtons, handleBossButtonInteraction } from '../../systems/BossButtonSystem';
import { ChestState, createChests, handleChestInteraction } from '../../systems/ChestSystem';
import { TradeState, createTrades, handleTradeInteraction } from "../../systems/TradeSystem";
import { PortalSystem } from '../../systems/PortalSystem';
import { PlayerData } from '../../data/PlayerData';

export class LevelScene extends Phaser.Scene {
    private player!: Phaser.Physics.Matter.Sprite;
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
    private bossButtons: BossButtonState[] = [];
    private chests: ChestState[] = [];
    private trades: TradeState[] = [];
    private interactKey!: Phaser.Input.Keyboard.Key;
    private isCinematic = false;
    private glossaryBtn!: Phaser.GameObjects.Sprite;
    private settingsBtn!: Phaser.GameObjects.Sprite;
    private wasInteractPressed = { value: false };

    constructor() {
        super('LevelScene');
    }

    private previousMap: string = '';
    private entryDirX: number = 0;
    private entryDirY: number = 0;
    private isEntering = false;
    private overrideSpawnX: number | null = null;
    private overrideSpawnY: number | null = null;

    init(data: { mapKey?: string, previousMap?: string, entryDirX?: number, entryDirY?: number, spawnX?: number, spawnY?: number }) {
        this.mapKey = data?.mapKey || 'hub';
        this.previousMap = data?.previousMap || '';
        this.entryDirX = data?.entryDirX || 0;
        this.entryDirY = data?.entryDirY || 0;
        this.overrideSpawnX = data?.spawnX ?? null;
        this.overrideSpawnY = data?.spawnY ?? null;
        this.isEntering = false;
        this.isCinematic = false;
        if (this.portalSystem) {
        }
    }

    preload() {
        this.load.image('Abandoned-Floor.png', 'assets/exports/tileset/Abandoned-Floor.png');
        this.load.image('Desert-Floor.png', 'assets/exports/tileset/Desert-Floor.png');
        this.load.image('Mechanic-Floor.png', 'assets/exports/tileset/Mechanic-Floor.png');
        this.load.image('Objects.png', 'assets/exports/tileset/Objects.png');
        this.load.image('Summit-Floor.png', 'assets/exports/tileset/Summit-Floor.png');

        this.load.tilemapTiledJSON('central-hub', 'assets/exports/Maps/central-hub.json');
        this.load.tilemapTiledJSON('boss-floor-abandoned', 'assets/exports/Maps/boss-floor-abandoned.json');
        this.load.tilemapTiledJSON('boss-floor-desert', 'assets/exports/Maps/boss-floor-desert.json');
        this.load.tilemapTiledJSON('boss-floor-mechanic', 'assets/exports/Maps/boss-floor-mechanic.json');

        this.load.tilemapTiledJSON('abandoned-settlement', 'assets/exports/Maps/abandoned-settlement.json');
        this.load.tilemapTiledJSON('desert-settlement', 'assets/exports/Maps/desert-settlement.json');
        this.load.tilemapTiledJSON('mechanic-settlement', 'assets/exports/Maps/mechanic-settlement.json');

        this.load.tilemapTiledJSON('summit-trade', 'assets/exports/Maps/summit-trade.json');

        this.load.spritesheet('door-sheet', 'assets/exports/Animations/Door-Sheet.png', {
            frameWidth: 64,
            frameHeight: 96
        });
        this.load.spritesheet('door-symbol', 'assets/exports/Animations/Door-Symbol.png', {
            frameWidth: 64,
            frameHeight: 96
        });

        this.load.spritesheet('protagonist', 'assets/exports/Boss/Protagonist-Sheet.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        this.load.spritesheet('btn-boss-abandoned', 'assets/exports/Animations/Btn-Boss-Abandoned.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('btn-boss-desert', 'assets/exports/Animations/Btn-Boss-Desert.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('btn-boss-mechanic', 'assets/exports/Animations/Btn-Boss-Mechanic.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('btn-boss-summit', 'assets/exports/Animations/Btn-Boss-Summit.png', {
            frameWidth: 64,
            frameHeight: 64
        });

        this.load.spritesheet('btn-boss-symbol', 'assets/exports/Animations/Btn-Boss-Symbol.png', {
            frameWidth: 64,
            frameHeight: 64
        });

        this.load.spritesheet('chests', 'assets/exports/Animations/Chests.png', {
            frameWidth: 32,
            frameHeight: 48
        });

        this.load.spritesheet('items', 'assets/exports/Objects/Items.png', {
            frameWidth: 64,
            frameHeight: 64
        });

        this.load.image('interact-btn', 'assets/exports/UI/Interact-Btn.png');
        this.load.image('achievement-ui', 'assets/exports/UI/Achievement-UI.png');
        this.load.image('settings-btn', 'assets/exports/UI/Settings-Btn.png');
        this.load.spritesheet('currency', 'assets/exports/Objects/Currency.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        this.load.spritesheet('trade', 'assets/exports/Animations/Trade.png', {
            frameWidth: 160,
            frameHeight: 190
        });

    }

    create() {
        this.stairZones = this.add.group();
        this.inReverseZone = false;
        this.targetSlowFactor = 1;
        this.currentSlowFactor = 1;
        this.activeStairZones.clear();
        this.doors = [];
        this.bossButtons = [];
        this.chests = [];
        this.trades = [];

        if (this.scene.isActive('CombatScene')) {
            this.scene.stop('CombatScene');
        }

        this.cameras.main.setBackgroundColor('#111111');

        this.portalSystem = new PortalSystem(this);

        if (this.mapKey === 'hub' || this.mapKey === 'central-hub') {
            this.createMap('central-hub');
        } else {
            this.createMap(this.mapKey);
        }

        let locId: string | null = null;
        if (this.mapKey === 'hub' || this.mapKey === 'central-hub') locId = 'central_hub';
        else if (this.mapKey === 'abandoned-settlement') locId = 'settlement_abandoned';
        else if (this.mapKey === 'desert-settlement') locId = 'settlement_desert';
        else if (this.mapKey === 'mechanic-settlement') locId = 'settlement_mechanic';
        else if (this.mapKey === 'boss-floor-abandoned') locId = 'boss_abandoned';
        else if (this.mapKey === 'boss-floor-desert') locId = 'boss_desert';
        else if (this.mapKey === 'boss-floor-mechanic') locId = 'boss_mechanic';
        else if (this.mapKey === 'summit-trade') locId = 'summit_trade';

        if (locId) {
            LocationData.getInstance().discoverLocation(locId);
        }

        if (!this.anims.exists('idle')) {
            this.anims.create({
                key: 'idle',
                frames: this.anims.generateFrameNumbers('protagonist', { start: 0, end: 2 }),
                frameRate: 6,
                repeat: -1
            });
            this.anims.create({
                key: 'run-start',
                frames: this.anims.generateFrameNumbers('protagonist', { start: 10, end: 16 }),
                frameRate: 12,
                repeat: 0
            });
            this.anims.create({
                key: 'run-loop',
                frames: this.anims.generateFrameNumbers('protagonist', { start: 11, end: 16 }),
                frameRate: 12,
                repeat: -1
            });
            this.anims.create({
                key: 'stop',
                frames: this.anims.generateFrameNumbers('protagonist', { start: 17, end: 19 }),
                frameRate: 12,
                repeat: 0
            });
        }

        this.cursors = this.input.keyboard!.createCursorKeys();
        this.keys = this.input.keyboard!.addKeys('W,A,S,D') as { W: Phaser.Input.Keyboard.Key, A: Phaser.Input.Keyboard.Key, S: Phaser.Input.Keyboard.Key, D: Phaser.Input.Keyboard.Key };
        this.interactKey = this.input.keyboard!.addKey('X');

        if (!this.anims.exists('door-open')) {
            const baseDuration = 60;
            const frames = [];
            for (let i = 0; i <= 13; i++) {
                const t = i / 13;
                frames.push({ key: 'door-sheet', frame: i, duration: baseDuration + t * t * 200 });
            }
            this.anims.create({
                key: 'door-open',
                frames,
                repeat: 0
            });
        }

        this.input.keyboard!.on(InputKeys.HELP, () => {
            if (!this.scene.isPaused()) {
                this.scene.pause();
                this.scene.launch('Help', { previousScene: 'LevelScene' });
            }
        });

        const w = this.scale.width;
        const h = this.scale.height;
        const camZoom = 2;
        const glossaryScreenX = (15 - w / 2) / camZoom + w / 2;
        const glossaryScreenY = (h - 15 - h / 2) / camZoom + h / 2;

        this.glossaryBtn = this.add.sprite(glossaryScreenX, glossaryScreenY, 'glossary', 0)
            .setOrigin(0, 1)
            .setScrollFactor(0)
            .setDepth(200)
            .setScale(2 / camZoom)
            .setInteractive({ useHandCursor: true });

        this.glossaryBtn.on('pointerdown', () => {
            if (!this.scene.isActive('GlossaryUI')) {
                this.scene.pause();
                this.scene.launch('GlossaryUI', { previousScene: 'LevelScene', isPaused: true });
            }
        });

        this.input.keyboard!.on(InputKeys.GLOSSARY, () => {
            if (!this.scene.isActive('GlossaryUI')) {
                this.scene.pause();
                this.scene.launch('GlossaryUI', { previousScene: 'LevelScene', isPaused: true });
            }
        });

        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (this.player && this.player.active) {
                    const pd = PlayerData.getInstance();
                    pd.lastMap = this.mapKey;
                    pd.lastX = this.player.x;
                    pd.lastY = this.player.y;
                    pd.save();
                }
            }
        });

        const settingsScreenX = (w - 15 - w / 2) / camZoom + w / 2;
        const settingsScreenY = (h - 15 - h / 2) / camZoom + h / 2;

        this.settingsBtn = this.add.sprite(settingsScreenX, settingsScreenY, 'settings-btn')
            .setOrigin(1, 1)
            .setScrollFactor(0)
            .setDepth(200)
            .setScale(1 / camZoom)
            .setInteractive({ useHandCursor: true });

        this.settingsBtn.on('pointerover', () => {
            this.settingsBtn.setTint(0xaaaaaa);
        });

        this.settingsBtn.on('pointerout', () => {
            this.settingsBtn.clearTint();
        });

        this.settingsBtn.on('pointerdown', () => {
            if (!this.scene.isActive('Help')) {
                this.scene.pause();
                this.scene.launch('Help', { previousScene: 'LevelScene' });
            }
        });

        createVignette(this);

        this.matter.world.on('collisionstart', (event: any) => {
            event.pairs.forEach((pair: any) => {
                const { bodyA, bodyB } = pair;
                const gameObjectA = bodyA.gameObject;
                const gameObjectB = bodyB.gameObject;

                if (gameObjectA === this.player || gameObjectB === this.player) {
                    const other = gameObjectA === this.player ? gameObjectB : gameObjectA;

                    if (other && other.getData) {
                        if (other.getData('reverseSlow')) {
                            this.inReverseZone = true;
                            this.updateSlowFactor();
                        }
                        if (other.getData('isStair') && !this.inReverseZone) {
                            const stairId = other.getData('stairId') ?? (other as any).id;
                            if (stairId !== undefined) {
                                this.activeStairZones.add(stairId);
                                this.updateSlowFactor();
                            }
                        }
                        if (other.getData('target')) {
                            this.portalSystem.onPortalOverlap(other, this.player, this.mapKey);
                        }
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
                        if (other.getData('reverseSlow')) {
                            this.inReverseZone = false;
                            this.updateSlowFactor();
                        }
                        if (other.getData('isStair') && !this.inReverseZone) {
                            const stairId = other.getData('stairId') ?? (other as any).id;
                            if (stairId !== undefined) {
                                this.activeStairZones.delete(stairId);
                                this.updateSlowFactor();
                            }
                        }
                    }
                }
            });
        });
    }

    private updateSlowFactor(): void {
        if (this.inReverseZone) {
            this.targetSlowFactor = 1;
        } else if (this.activeStairZones.size > 0) {
            this.targetSlowFactor = 0.6;
        } else {
            this.targetSlowFactor = 1;
        }
    }

    private createMap(mapKey: string) {
        const map = this.make.tilemap({ key: mapKey });
        const tilesets: Phaser.Tilemaps.Tileset[] = [];

        map.tilesets.forEach(ts => {
            const boundTileset = map.addTilesetImage(ts.name, ts.name + '.png');
            if (boundTileset) tilesets.push(boundTileset);
        });

        map.layers.forEach((layerData, i) => {
            const layer = map.createLayer(layerData.name, tilesets);
            if (layer) layer.setDepth(i);
        });

        this.cameras.main.setZoom(2);
        this.matter.world.setBounds(-2000, -2000, 4000, 4000);
        parseCollisionObjects(this, map.objects);

        const stairsLayer = map.objects.find(layer => layer.name.toLowerCase() === 'stairs');
        if (stairsLayer) {
            parseStairObjects(this, stairsLayer, this.stairZones);
        }

        const portalsLayer = map.objects.find(layer => layer.name.toLowerCase() === 'portals');
        if (portalsLayer) {
            this.portalSystem.parsePortals(portalsLayer, this.mapKey);
        }

        const doorLayer = map.objects.find(layer => layer.name.toLowerCase() === 'door');
        if (doorLayer) {
            this.doors = createDoors(this, doorLayer);
        }

        const buttonLayer = map.objects.find(layer => layer.name.toLowerCase() === 'button');
        if (buttonLayer) {
            this.bossButtons = createBossButtons(this, buttonLayer, mapKey);
        }

        const chestLayer = map.objects.find(layer => layer.name.toLowerCase() === 'chests');
        if (chestLayer) {
            this.chests = createChests(this, chestLayer, mapKey, this.getPlayerDepth(mapKey) - 1);
        }

        const tradeLayer = map.objects.find(layer => layer.name.toLowerCase() === 'trades');
        if (tradeLayer) {
            this.trades = createTrades(this, tradeLayer, mapKey);
        }

        const OFFSET = 54;
        const spawnPos = this.portalSystem.calculateSpawn(portalsLayer, mapKey, this.previousMap, OFFSET);
        let spawnX = spawnPos.x;
        let spawnY = spawnPos.y;

        this.spawnPlayer(this.overrideSpawnX !== null ? this.overrideSpawnX : spawnX, this.overrideSpawnY !== null ? this.overrideSpawnY : spawnY);
        this.overrideSpawnX = null;
        this.overrideSpawnY = null;
        this.player.setDepth(this.getPlayerDepth(mapKey));

        this.cameras.main.fadeIn(800, 0, 0, 0);

        if (this.entryDirX !== 0 || this.entryDirY !== 0) {
            this.isEntering = true;
            if (this.entryDirX < 0) this.player.setFlipX(true);
            else if (this.entryDirX > 0) this.player.setFlipX(false);

            this.time.delayedCall(400, () => {
                this.isEntering = false;
            });
        }
    }

    private spawnPlayer(x: number, y: number) {
        this.player = this.matter.add.sprite(x, y, 'protagonist');
        this.player.setDepth(15);
        this.player.setRectangle(16, 10, { chamfer: { radius: 4 } });
        this.player.setOrigin(0.5, 0.8);
        this.player.setFixedRotation();
        this.player.setFriction(0);
        this.player.setFrictionStatic(0);
        this.player.setBounce(0);
        this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
        this.player.play('idle');
    }

    update(_time: number, delta: number) {
        handleDoorInteraction(
            this,
            this.doors,
            this.player,
            this.interactKey.isDown,
            delta,
            this.isCinematic,
            this.portalSystem.getIsTeleporting(),
            this.isEntering,
            (val) => { this.isCinematic = val; }
        );

        handleBossButtonInteraction(
            this,
            this.bossButtons,
            this.player,
            this.interactKey.isDown,
            this.isCinematic,
            this.portalSystem.getIsTeleporting(),
            this.isEntering,
            (val) => { this.isCinematic = val; },
            this.mapKey,
            delta
        );

        handleChestInteraction(
            this,
            this.chests,
            this.player,
            this.interactKey.isDown,
            delta,
            this.isCinematic,
            this.portalSystem.getIsTeleporting(),
            this.isEntering
        );

        if (this.mapKey === 'summit-trade') {
            handleTradeInteraction(
                this,
                this.trades,
                this.player,
                this.interactKey.isDown,
                this.wasInteractPressed,
                (val) => { this.isCinematic = val; }
            );
        }

        this.currentSlowFactor = Phaser.Math.Linear(this.currentSlowFactor, this.targetSlowFactor, 0.05);
        const speed = 3 * this.currentSlowFactor;
        const body = this.player.body as MatterJS.BodyType;

        let moveX = 0, moveY = 0, moving = false;

        if (this.portalSystem.getIsTeleporting()) {
            const dir = this.portalSystem.getTeleportDirection();
            moveX = dir.x;
            moveY = dir.y;
            moving = true;
            if (moveX < 0) this.player.setFlipX(true);
            else if (moveX > 0) this.player.setFlipX(false);
        } else if (this.isEntering) {
            moveX = this.entryDirX;
            moveY = this.entryDirY;
            moving = true;
        } else if (this.isCinematic) {
            moving = false;
        } else {
            if (this.cursors.left.isDown || this.keys.A.isDown) { moveX = -1; this.player.setFlipX(true); moving = true; }
            else if (this.cursors.right.isDown || this.keys.D.isDown) { moveX = 1; this.player.setFlipX(false); moving = true; }
            if (this.cursors.up.isDown || this.keys.W.isDown) { moveY = -1; moving = true; }
            else if (this.cursors.down.isDown || this.keys.S.isDown) { moveY = 1; moving = true; }
        }

        if (moving) {
            const inputVelocity = new Phaser.Math.Vector2(moveX, moveY).normalize().scale(speed);
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

    private getPlayerDepth(mapKey: string): number {
        switch (mapKey) {
            case 'boss-floor-abandoned': return 9;
            case 'boss-floor-desert': return 12;
            case 'boss-floor-mechanic': return 10;
            case 'abandoned-settlement': return 13;
            case 'desert-settlement': return 13;
            case 'mechanic-settlement': return 13;
            case 'summit-trade': return 4;
            default: return 11;
        }
    }
}