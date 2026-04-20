import * as Phaser from 'phaser';
import { PlayerData } from '../data/PlayerData';

export class LevelScene extends Phaser.Scene {
    private player!: Phaser.Physics.Matter.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private keys!: any;
    private mapKey!: string;
    private returnPortalGroup!: Phaser.GameObjects.Group;

    constructor() {
        super('LevelScene');
    }

    init(data: { mapKey?: string }) {
        this.mapKey = data?.mapKey || 'hub';
        this.isTeleporting = false;
    }

    preload() {
        // Preload our physical tileset textures
        this.load.image('Abandoned-Floor-Sheet.png', 'assets/exports/Maps/Abandoned-Floor-Sheet.png');
        this.load.image('Desert-Floor-Sheet.png', 'assets/exports/Maps/Desert-Floor-Sheet.png');
        this.load.image('Mechanic-Floor-Sheet.png', 'assets/exports/Maps/Mechanic-Floor-Sheet.png');
        this.load.image('Objects-Sheet.png', 'assets/exports/Maps/Objects-Sheet.png');

        this.load.tilemapTiledJSON('boss-floor-abandoned', 'assets/exports/Maps/boss-floor-abandoned.json');
        this.load.tilemapTiledJSON('boss-floor-desert', 'assets/exports/Maps/boss-floor-desert.json');
        this.load.tilemapTiledJSON('boss-floor-mechanic', 'assets/exports/Maps/boss-floor-mechanic.json');

        this.load.spritesheet('protagonist', 'assets/exports/Boss/Protagonist-Sheet.png', {
            frameWidth: 32,
            frameHeight: 32
        });
    }

    create() {
        if (this.scene.isActive('CombatScene')) {
            this.scene.stop('CombatScene');
        }

        this.cameras.main.setBackgroundColor('#111111');
        this.returnPortalGroup = this.add.group();

        if (this.mapKey === 'hub') {
            this.createHub();
        } else {
            this.createMap(this.mapKey);
        }

        if (!this.anims.exists('idle')) {
            this.anims.create({
                key: 'idle',
                frames: this.anims.generateFrameNumbers('protagonist', { start: 0, end: 2 }),
                frameRate: 6,
                repeat: -1
            });
            this.anims.create({
                key: 'run',
                frames: this.anims.generateFrameNumbers('protagonist', { start: 10, end: 16 }),
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

        this.input.keyboard!.on('keydown-Q', () => {
            if (!this.scene.isPaused()) {
                this.scene.pause();
                this.scene.launch('Help', { previousScene: 'LevelScene' });
            }
        });
    }

    private createHub() {
        const width = 1200;
        const height = 800;

        this.matter.world.setBounds(-2000, -2000, 4000, 4000);
        this.cameras.main.setZoom(2.5);

        const rect = this.add.rectangle(width / 2, height / 2, 800, 400, 0xaa0000);

        this.createPortal(width / 2, height / 2 - 150, 'boss-floor-abandoned', 0x00aa00, 'Abandoned Swamp');
        this.createPortal(width / 2 - 300, height / 2 + 100, 'boss-floor-mechanic', 0xaaaa00, 'Mechanic Island');
        this.createPortal(width / 2 + 300, height / 2 + 100, 'boss-floor-desert', 0xdd8800, 'Desert City');

        const walls = [
            this.add.rectangle(width / 2, height / 2 - 200, 800, 20, 0x000000),
            this.add.rectangle(width / 2, height / 2 + 200, 800, 20, 0x000000),
            this.add.rectangle(width / 2 - 400, height / 2, 20, 400, 0x000000),
            this.add.rectangle(width / 2 + 400, height / 2, 20, 400, 0x000000)
        ];
        walls.forEach(w => this.matter.add.gameObject(w, { isStatic: true }));

        this.spawnPlayer(width / 2, height / 2);

        this.matter.world.on('collisionstart', (event: any) => {
            event.pairs.forEach((pair: any) => {
                const { bodyA, bodyB } = pair;
                const gameObjectA = bodyA.gameObject;
                const gameObjectB = bodyB.gameObject;

                if (gameObjectA === this.player || gameObjectB === this.player) {
                    const portal = gameObjectA === this.player ? gameObjectB : gameObjectA;
                    if (portal && portal.getData('target')) {
                        this.onPortalOverlap(portal);
                    }
                }
            });
        });
    }

    private createPortal(x: number, y: number, targetMap: string, color: number, label: string) {
        const portal = this.add.rectangle(x, y, 60, 60, color);
        this.matter.add.gameObject(portal, { isStatic: true, isSensor: true });
        this.returnPortalGroup.add(portal);
        portal.setData('target', targetMap);

        this.add.text(x, y - 40, label, { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
    }

    private createMap(mapKey: string) {
        const map = this.make.tilemap({ key: mapKey });

        const tilesets: Phaser.Tilemaps.Tileset[] = [];

        // Bind all the embedded tilesets to our preloaded textures based on their natural names
        map.tilesets.forEach(ts => {
            const boundTileset = map.addTilesetImage(ts.name, ts.name + '-Sheet.png');
            if (boundTileset) {
                tilesets.push(boundTileset);
            }
        });

        map.layers.forEach((layerData, i) => {
            const layer = map.createLayer(layerData.name, tilesets);
            if (layer) {
                layer.setDepth(i);
            }
        });

        this.cameras.main.setZoom(2.5);
        this.matter.world.setBounds(-2000, -2000, 4000, 4000);

        const worldW = map.widthInPixels || 2000;
        const worldH = map.heightInPixels || 2000;

        // Iterate through ALL layers to find Object Layers (not just the first one)
        map.objects.forEach(layer => {
            const layerName = layer.name.toLowerCase();
            if (layerName.includes('collision') || layerName.includes('collider')) {
                layer.objects.forEach(obj => {
                    const x = obj.x || 0;
                    const y = (obj.y || 0) - 10;

                    if (obj.polygon || obj.polyline) {
                        const points = (obj.polygon || obj.polyline) as any[];

                        // Re-do segment-by-segment logic to match previous Arcade feel
                        const segments = obj.polygon ? points.length : points.length - 1;

                        for (let i = 0; i < segments; i++) {
                            const p1 = points[i];
                            const p2 = points[(i + 1) % points.length];

                            // If it's a polyline, don't loop back to start
                            if (obj.polyline && i === points.length - 1) continue;

                            const minX = Math.min(p1.x, p2.x);
                            const minY = Math.min(p1.y, p2.y);
                            const maxX = Math.max(p1.x, p2.x);
                            const maxY = Math.max(p1.y, p2.y);

                            const rectW = Math.max(maxX - minX, 4); // 4px thick lines
                            const rectH = Math.max(maxY - minY, 4);
                            const rectX = x + minX + (maxX - minX) / 2;
                            const rectY = y + minY + (maxY - minY) / 2;

                            this.matter.add.rectangle(rectX, rectY, rectW, rectH, { isStatic: true });
                        }

                    } else if (obj.ellipse) {
                        const rw = obj.width || 16;
                        const radius = rw / 2;
                        this.matter.add.circle(x + radius, y + radius, radius, { isStatic: true });

                    } else if (obj.rectangle || (obj.width && obj.height)) {
                        const rw = obj.width || 16;
                        const rh = obj.height || 16;
                        this.matter.add.rectangle(x + rw / 2, y + rh / 2, rw, rh, { isStatic: true });
                    }
                });
            }
        });

        // Define specific spawn and portal coordinates depending on the map being loaded.
        let spawnX = worldW / 2;
        let spawnY = worldH / 2;
        let portalX = worldW / 2;
        let portalY = worldH / 2 + 100;

        if (mapKey === 'boss-floor-abandoned') {
            spawnX = worldW;
            spawnY = 280; // Was 380
            portalX = worldW;
            portalY = 430;
        } else if (mapKey === 'boss-floor-desert') {
            // Shifted 16px left and brought 100px down
            spawnX = (worldW / 2) - 16;
            spawnY = 280; // Was 380
            portalX = (worldW / 2) - 16;
            portalY = 430;
        } else if (mapKey === 'boss-floor-mechanic') {
            // Shifted 64px left and brought 300px down
            spawnX = (worldW / 2) - 64;
            spawnY = 695; // Was 795
            portalX = (worldW / 2) - 64;
            portalY = 845;
        }

        this.spawnPlayer(spawnX, spawnY);
        this.createPortal(portalX, portalY, 'hub', 0xff0000, 'Return to Hub');

        this.matter.world.on('collisionstart', (event: any) => {
            event.pairs.forEach((pair: any) => {
                const { bodyA, bodyB } = pair;
                const gameObjectA = bodyA.gameObject;
                const gameObjectB = bodyB.gameObject;

                if (gameObjectA === this.player || gameObjectB === this.player) {
                    const portal = gameObjectA === this.player ? gameObjectB : gameObjectA;
                    if (portal && portal.getData('target')) {
                        this.onPortalOverlap(portal);
                    }
                }
            });
        });
    }

    private spawnPlayer(x: number, y: number) {
        this.player = this.matter.add.sprite(x, y, 'protagonist');
        this.player.setDepth(10);

        // Match the previous Arcade dimensions (16x10)
        // Adding a chamfer (rounded corners) allows the body to slide smoothly against walls
        this.player.setRectangle(16, 10, { chamfer: { radius: 2 } });
        this.player.setOrigin(0.5, 0.8);

        // Fixed rotation MUST be called after setRectangle as setRectangle resets the body
        this.player.setFixedRotation();

        this.player.setFriction(0);
        this.player.setFrictionStatic(0);
        this.player.setBounce(0);

        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.player.play('idle');
    }

    private isTeleporting = false;

    private onPortalOverlap(portal: Phaser.GameObjects.GameObject) {
        if (this.isTeleporting) return;

        const targetMap = portal.getData('target');
        if (targetMap) {
            this.isTeleporting = true;
            this.scene.restart({ mapKey: targetMap });
        }
    }

    update() {
        const speed = 3; // Reduced speed
        const body = this.player.body as MatterJS.BodyType;

        let moveX = 0;
        let moveY = 0;
        let moving = false;

        // WASD + Cursors
        if (this.cursors.left.isDown || this.keys.A.isDown) {
            moveX = -1;
            this.player.setFlipX(true);
            moving = true;
        } else if (this.cursors.right.isDown || this.keys.D.isDown) {
            moveX = 1;
            this.player.setFlipX(false);
            moving = true;
        }

        if (this.cursors.up.isDown || this.keys.W.isDown) {
            moveY = -1;
            moving = true;
        } else if (this.cursors.down.isDown || this.keys.S.isDown) {
            moveY = 1;
            moving = true;
        }

        if (moving) {
            // Vector speed: Normalize so diagonal isn't faster
            const moveVec = new Phaser.Math.Vector2(moveX, moveY).normalize().scale(speed);
            this.player.setVelocity(moveVec.x, moveVec.y);

            if (this.player.anims.currentAnim?.key !== 'run') {
                this.player.play('run');
            }
        } else {
            // De-acceleration: Dampen current velocity instead of stopping instantly
            const friction = 0.85;
            this.player.setVelocity(body.velocity.x * friction, body.velocity.y * friction);

            if (this.player.anims.currentAnim?.key === 'run') {
                this.player.play('stop').chain('idle');
            } else if (
                this.player.anims.currentAnim?.key !== 'stop' &&
                this.player.anims.currentAnim?.key !== 'idle'
            ) {
                this.player.play('idle');
            }
        }
    }
}