import * as Phaser from 'phaser';
import { PlayerData } from '../data/PlayerData';

export class LevelScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private mapKey!: string;
    private returnPortalGroup!: Phaser.Physics.Arcade.StaticGroup;

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
        this.returnPortalGroup = this.physics.add.staticGroup();

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
    }

    private createHub() {
        const width = 1200;
        const height = 800;

        this.physics.world.setBounds(-2000, -2000, 4000, 4000);
        this.cameras.main.setZoom(2);

        const rect = this.add.rectangle(width / 2, height / 2, 800, 400, 0xaa0000);
        this.physics.add.existing(rect, true);

        this.createPortal(width / 2, height / 2 - 150, 'boss-floor-abandoned', 0x00aa00, 'Abandoned Swamp');
        this.createPortal(width / 2 - 300, height / 2 + 100, 'boss-floor-mechanic', 0xaaaa00, 'Mechanic Island');
        this.createPortal(width / 2 + 300, height / 2 + 100, 'boss-floor-desert', 0xdd8800, 'Desert City');

        const walls = this.physics.add.staticGroup();
        walls.add(this.add.rectangle(width / 2, height / 2 - 200, 800, 20, 0x000000));
        walls.add(this.add.rectangle(width / 2, height / 2 + 200, 800, 20, 0x000000));
        walls.add(this.add.rectangle(width / 2 - 400, height / 2, 20, 400, 0x000000));
        walls.add(this.add.rectangle(width / 2 + 400, height / 2, 20, 400, 0x000000));

        this.spawnPlayer(width / 2, height / 2);
        this.physics.add.collider(this.player, walls);
        this.physics.add.overlap(this.player, this.returnPortalGroup, this.onPortalOverlap, undefined, this);
    }

    private createPortal(x: number, y: number, targetMap: string, color: number, label: string) {
        const portal = this.add.rectangle(x, y, 60, 60, color);
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

        this.cameras.main.setZoom(2);
        this.physics.world.setBounds(-2000, -2000, 4000, 4000);

        const worldW = map.widthInPixels || 2000;
        const worldH = map.heightInPixels || 2000;

        const collisionGroup = this.physics.add.staticGroup();
        const objLayer = map.getObjectLayer('collision')
            || map.getObjectLayer('Collision')
            || map.getObjectLayer('collisions')
            || map.getObjectLayer('Collisions');

        const debugGraphics = this.add.graphics().setDepth(100);

        if (objLayer && objLayer.objects) {
            objLayer.objects.forEach(obj => {
                const x = obj.x || 0;
                const y = obj.y || 0;

                if (obj.polygon || obj.polyline) {
                    const points = obj.polygon || obj.polyline;

                    // Visual Debug Line Trace
                    debugGraphics.lineStyle(2, 0xff00ff, 1);
                    debugGraphics.beginPath();
                    debugGraphics.moveTo(x + points[0].x, y + points[0].y);

                    for (let i = 1; i < points.length; i++) {
                        debugGraphics.lineTo(x + points[i].x, y + points[i].y);
                    }
                    if (obj.polygon) debugGraphics.closePath();
                    debugGraphics.strokePath();

                    // Arcade Physics Support for lines/polygons: 
                    // Generate multiple smaller bounding boxes along the vector path roughly
                    for (let i = 0; i < points.length - 1; i++) {
                        const p1 = points[i];
                        const p2 = points[i + 1];

                        const minX = Math.min(p1.x, p2.x);
                        const minY = Math.min(p1.y, p2.y);
                        const maxX = Math.max(p1.x, p2.x);
                        const maxY = Math.max(p1.y, p2.y);

                        const rectW = Math.max(maxX - minX, 8); // At least 8px thick
                        const rectH = Math.max(maxY - minY, 8);
                        const rectX = x + minX + (maxX - minX) / 2;
                        const rectY = y + minY + (maxY - minY) / 2;

                        const rect = this.add.rectangle(rectX, rectY, rectW, rectH, 0xff00ff, 0);
                        this.physics.add.existing(rect, true);
                        collisionGroup.add(rect);
                    }

                    // Loop back to start if polygon
                    if (obj.polygon && points.length > 2) {
                        const p1 = points[points.length - 1];
                        const p2 = points[0];
                        const minX = Math.min(p1.x, p2.x);
                        const minY = Math.min(p1.y, p2.y);
                        const maxX = Math.max(p1.x, p2.x);
                        const maxY = Math.max(p1.y, p2.y);

                        const rectW = Math.max(maxX - minX, 8);
                        const rectH = Math.max(maxY - minY, 8);
                        const rectX = x + minX + (maxX - minX) / 2;
                        const rectY = y + minY + (maxY - minY) / 2;

                        const rect = this.add.rectangle(rectX, rectY, rectW, rectH, 0xff00ff, 0);
                        this.physics.add.existing(rect, true);
                        collisionGroup.add(rect);
                    }

                } else if (obj.ellipse) {
                    const rw = obj.width || 16;
                    const radius = rw / 2;

                    // Visual Debug Layer
                    debugGraphics.lineStyle(2, 0x00ffff, 1);
                    debugGraphics.strokeCircle(x + radius, y + radius, radius);

                    const circle = this.add.circle(x + radius, y + radius, radius, 0x000000, 0);
                    this.physics.add.existing(circle, true);
                    const body = circle.body as Phaser.Physics.Arcade.StaticBody;
                    body.setCircle(radius);
                    collisionGroup.add(circle);

                } else if (obj.rectangle || (obj.width && obj.height)) {
                    const rw = obj.width || 16;
                    const rh = obj.height || 16;
                    const rectX = x + rw / 2;
                    const rectY = y + rh / 2;

                    // Visual Debug Layer
                    debugGraphics.lineStyle(2, 0xffff00, 1);
                    debugGraphics.strokeRect(x, y, rw, rh);

                    const rect = this.add.rectangle(rectX, rectY, rw, rh, 0x000000, 0);
                    this.physics.add.existing(rect, true);
                    collisionGroup.add(rect);
                }
            });
        }

        // Define specific spawn and portal coordinates depending on the map being loaded.
        let spawnX = worldW / 2;
        let spawnY = worldH / 2;
        let portalX = worldW / 2;
        let portalY = worldH / 2 + 100;

        if (mapKey === 'boss-floor-abandoned') {
            spawnX = worldW;
            spawnY = 380;
            portalX = worldW;
            portalY = 430;
        } else if (mapKey === 'boss-floor-desert') {
            // Shifted 16px left and brought 100px down
            spawnX = (worldW / 2) - 16;
            spawnY = 380;
            portalX = (worldW / 2) - 16;
            portalY = 430;
        } else if (mapKey === 'boss-floor-mechanic') {
            // Shifted 64px left and brought 300px down
            spawnX = (worldW / 2) - 64;
            spawnY = 795;
            portalX = (worldW / 2) - 64;
            portalY = 845;
        }

        this.spawnPlayer(spawnX, spawnY);
        this.physics.add.collider(this.player, collisionGroup);

        this.createPortal(portalX, portalY, 'hub', 0xff0000, 'Return to Hub');
        this.physics.add.overlap(this.player, this.returnPortalGroup, this.onPortalOverlap, undefined, this);
    }

    private spawnPlayer(x: number, y: number) {
        this.player = this.physics.add.sprite(x, y, 'protagonist');
        this.player.setDepth(10);
        this.player.setSize(16, 10);
        this.player.setOffset(6, 20);

        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.player.play('idle');
    }

    private isTeleporting = false;

    private onPortalOverlap(player: Phaser.GameObjects.GameObject, portal: Phaser.GameObjects.GameObject) {
        if (this.isTeleporting) return;

        const targetMap = portal.getData('target');
        if (targetMap) {
            this.isTeleporting = true;
            this.scene.restart({ mapKey: targetMap });
        }
    }

    update() {
        const speed = 200;
        const body = this.player.body as Phaser.Physics.Arcade.Body;

        body.setVelocity(0);

        let moving = false;

        if (this.cursors.left.isDown) {
            body.setVelocityX(-speed);
            this.player.setFlipX(true);
            moving = true;
        } else if (this.cursors.right.isDown) {
            body.setVelocityX(speed);
            this.player.setFlipX(false);
            moving = true;
        }

        if (this.cursors.up.isDown) {
            body.setVelocityY(-speed);
            moving = true;
        } else if (this.cursors.down.isDown) {
            body.setVelocityY(speed);
            moving = true;
        }

        if (moving) {
            if (this.player.anims.currentAnim?.key !== 'run') {
                this.player.play('run');
            }
        } else {
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