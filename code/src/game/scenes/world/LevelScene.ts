import * as Phaser from 'phaser';
import { createVignette } from '../../utils/Vignette';
import { PlayerData } from '../../data/PlayerData';
import { LocationData } from '../../data/LocationData';
import { parseCollisionObjects, parseStairObjects } from '../../systems/CollisionParser';
import { DoorState, createDoors, handleDoorInteraction } from '../../systems/DoorSystem';
import { BossButtonState, createBossButtons, handleBossButtonInteraction } from '../../systems/BossButtonSystem';
import { ChestState, createChests, handleChestInteraction } from '../../systems/ChestSystem';
import { LightSystem } from '../../systems/LightSystem';

export class LevelScene extends Phaser.Scene {
    private player!: Phaser.Physics.Matter.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private keys!: any;
    private mapKey!: string;
    private returnPortalGroup!: Phaser.GameObjects.Group;
    private isTeleporting = false;
    private teleportDirection: { x: number, y: number } = { x: 0, y: 0 };

    private slowZones!: Phaser.GameObjects.Group;
    private targetSlowFactor = 1;
    private currentSlowFactor = 1;

    private stairZones!: Phaser.GameObjects.Group;
    private onStairs = false;
    private inReverseZone = false;

    private activeStairZones: Set<number> = new Set();
    private doors: DoorState[] = [];
    private bossButtons: BossButtonState[] = [];
    private chests: ChestState[] = [];
    private interactKey!: Phaser.Input.Keyboard.Key;
    private isCinematic = false;
    private glossaryBtn!: Phaser.GameObjects.Sprite;
    private settingsBtn!: Phaser.GameObjects.Sprite;
    private lightSystem!: LightSystem;

    constructor() {
        super('LevelScene');
    }

    private previousMap: string = '';
    private entryDirX: number = 0;
    private entryDirY: number = 0;
    private isEntering = false;

    init(data: { mapKey?: string, previousMap?: string, entryDirX?: number, entryDirY?: number }) {
        this.mapKey = data?.mapKey || 'hub';
        this.previousMap = data?.previousMap || '';
        this.entryDirX = data?.entryDirX || 0;
        this.entryDirY = data?.entryDirY || 0;
        this.isTeleporting = false;
        this.isEntering = false;
        this.isCinematic = false;
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
    }

    create() {
        this.slowZones = this.add.group();
        this.stairZones = this.add.group();
        this.onStairs = false;
        this.inReverseZone = false;
        this.targetSlowFactor = 1;
        this.currentSlowFactor = 1;
        this.activeStairZones.clear();
        this.doors = [];
        this.bossButtons = [];
        this.chests = [];

        if (this.scene.isActive('CombatScene')) {
            this.scene.stop('CombatScene');
        }

        this.cameras.main.setBackgroundColor('#111111');

        this.returnPortalGroup = this.add.group();

        if (this.mapKey === 'hub' || this.mapKey === 'central-hub') {
            this.createMap('central-hub');
        } else {
            this.createMap(this.mapKey);
        }

        let locId: string | null = null;
        if (this.mapKey === 'abandoned-settlement') locId = 'settlement_abandoned';
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
        this.keys = this.input.keyboard!.addKeys('W,A,S,D') as any;
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

        this.input.keyboard!.on('keydown-Q', () => {
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

        this.input.keyboard!.on('keydown-G', () => {
            if (!this.scene.isActive('GlossaryUI')) {
                this.scene.pause();
                this.scene.launch('GlossaryUI', { previousScene: 'LevelScene', isPaused: true });
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
                            this.onPortalOverlap(other);
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

        this.lightSystem = new LightSystem(this);
    }

    private updateSlowFactor(): void {
        if (this.inReverseZone) {
            this.targetSlowFactor = 1;
            this.onStairs = false;
        } else if (this.activeStairZones.size > 0) {
            this.targetSlowFactor = 0.6;
            this.onStairs = true;
        } else {
            this.targetSlowFactor = 1;
            this.onStairs = false;
        }
    }

    private createPortal(x: number, y: number, targetMap: string, width: number = 60, height: number = 60) {
        const portal = this.add.rectangle(x, y, width, height, 0x000000, 0);
        this.matter.add.gameObject(portal, { isStatic: true, isSensor: true });
        this.returnPortalGroup.add(portal);
        portal.setData('target', targetMap);
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

        parseCollisionObjects(this, map.objects as any);

        const stairsLayer = map.objects.find(layer => layer.name.toLowerCase() === 'stairs');
        if (stairsLayer) {
            parseStairObjects(this, stairsLayer as any, this.stairZones);
        }

        const portalsLayer = map.objects.find(layer => layer.name.toLowerCase() === 'portals');
        if (portalsLayer) {
            portalsLayer.objects.forEach(obj => {
                const x = obj.x || 0;
                const y = obj.y || 0;
                const width = obj.width || 60;
                const height = obj.height || 60;
                const cx = x + width / 2;
                const cy = y + height / 2;

                let targetMap = '';

                if (mapKey === 'central-hub') {
                    const covenant = PlayerData.getInstance().covenant;
                    if (y < -500) {
                        targetMap = covenant === 'dragon' ? 'boss-floor-mechanic' :
                            covenant === 'phoenix' ? 'boss-floor-desert' : 'boss-floor-abandoned';
                    } else if (x < -100) {
                        targetMap = covenant === 'dragon' ? 'mechanic-settlement' :
                            covenant === 'phoenix' ? 'desert-settlement' : 'abandoned-settlement';
                    } else if (x > 100) {
                        targetMap = 'summit-trade';
                    } else {
                        return;
                    }
                } else {
                    targetMap = 'hub';
                }

                if (targetMap) {
                    this.createPortal(cx, cy, targetMap, width, height);
                }
            });
        }

        const doorLayer = map.objects.find(layer => layer.name.toLowerCase() === 'door');
        if (doorLayer) {
            this.doors = createDoors(this, doorLayer as any);
        }

        const buttonLayer = map.objects.find(layer => layer.name.toLowerCase() === 'button');
        if (buttonLayer) {
            this.bossButtons = createBossButtons(this, buttonLayer as any, mapKey);
        }

        const chestLayer = map.objects.find(layer => layer.name.toLowerCase() === 'chests');
        if (chestLayer) {
            this.chests = createChests(this, chestLayer as any, mapKey, this.getPlayerDepth(mapKey) - 1);
        }

        let spawnX = 0, spawnY = 0;
        const OFFSET = 54;

        if (mapKey === 'central-hub') {
            if (this.previousMap.includes('boss-')) {
                const topPortal = portalsLayer?.objects.find(o => (o.y || 0) < -500);
                if (topPortal) {
                    const pw = topPortal.width || 60;
                    const ph = topPortal.height || 60;
                    spawnX = (topPortal.x || 0) + pw / 2;
                    spawnY = (topPortal.y || 0) + ph / 2 + OFFSET;
                }
            } else if (this.previousMap.includes('-settlement')) {
                const leftPortal = portalsLayer?.objects.find(o => (o.x || 0) < -100 && (o.y || 0) > -500);
                if (leftPortal) {
                    const pw = leftPortal.width || 60;
                    const ph = leftPortal.height || 60;
                    spawnX = (leftPortal.x || 0) + pw / 2 + OFFSET;
                    spawnY = (leftPortal.y || 0) + ph / 2;
                }
            } else if (this.previousMap === 'summit-trade') {
                const rightPortal = portalsLayer?.objects.find(o => (o.x || 0) > 100);
                if (rightPortal) {
                    const pw = rightPortal.width || 60;
                    const ph = rightPortal.height || 60;
                    spawnX = (rightPortal.x || 0) + pw / 2 - OFFSET;
                    spawnY = (rightPortal.y || 0) + ph / 2;
                }
            } else {
                spawnX = 0;
                spawnY = -30;
            }
        } else {
            const returnPortal = portalsLayer?.objects[0];
            if (returnPortal) {
                const pw = returnPortal.width || 60;
                const ph = returnPortal.height || 60;
                const px = (returnPortal.x || 0) + pw / 2;
                const py = (returnPortal.y || 0) + ph / 2;

                if (mapKey.includes('boss-')) {
                    spawnX = px;
                    spawnY = py - OFFSET;
                } else if (mapKey.includes('-settlement')) {
                    spawnX = px - OFFSET;
                    spawnY = py;
                } else if (mapKey === 'summit-trade') {
                    spawnX = px + OFFSET;
                    spawnY = py;
                } else {
                    spawnX = px;
                    spawnY = py;
                }
            }
        }

        this.spawnPlayer(spawnX, spawnY);
        this.player.setDepth(this.getPlayerDepth(mapKey));

        this.matter.world.on('collisionstart', (event: any) => {
            event.pairs.forEach((pair: any) => {
                const { bodyA, bodyB } = pair;
                const goA = bodyA.gameObject, goB = bodyB.gameObject;
                if ((goA === this.player || goB === this.player) && (goA?.getData?.('target') || goB?.getData?.('target'))) {
                    const portal = goA === this.player ? goB : goA;
                    if (portal?.getData('target')) this.onPortalOverlap(portal);
                }
            });
        });

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

    private onPortalOverlap(portal: Phaser.GameObjects.GameObject) {
        if (this.isTeleporting) return;
        const targetMap = portal.getData('target');
        if (targetMap) {
            this.isTeleporting = true;

            const px = (portal as Phaser.GameObjects.Rectangle).x;
            const py = (portal as Phaser.GameObjects.Rectangle).y;

            let dirX = 0; let dirY = 0;
            if (Math.abs(this.player.x - px) > Math.abs(this.player.y - py)) {
                dirX = this.player.x < px ? 1 : -1;
            } else {
                dirY = this.player.y < py ? 1 : -1;
            }
            this.teleportDirection = { x: dirX, y: dirY };

            this.time.delayedCall(100, () => {
                this.cameras.main.fadeOut(400, 0, 0, 0);
            });

            this.time.delayedCall(500, () => {
                this.scene.restart({ mapKey: targetMap, previousMap: this.mapKey, entryDirX: dirX, entryDirY: dirY });
            });
        }
    }

    update(time: number, delta: number) {
        handleDoorInteraction(
            this,
            this.doors,
            this.player,
            this.interactKey.isDown,
            delta,
            this.isCinematic,
            this.isTeleporting,
            this.isEntering,
            (val) => { this.isCinematic = val; }
        );

        handleBossButtonInteraction(
            this,
            this.bossButtons,
            this.player,
            this.interactKey.isDown,
            this.isCinematic,
            this.isTeleporting,
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
            this.isTeleporting,
            this.isEntering
        );

        this.currentSlowFactor = Phaser.Math.Linear(this.currentSlowFactor, this.targetSlowFactor, 0.05);
        const speed = 3 * this.currentSlowFactor;
        const body = this.player.body as MatterJS.BodyType;

        let moveX = 0, moveY = 0, moving = false;

        if (this.isTeleporting) {
            moveX = this.teleportDirection.x;
            moveY = this.teleportDirection.y;
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