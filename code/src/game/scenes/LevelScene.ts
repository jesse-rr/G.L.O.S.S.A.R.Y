import * as Phaser from 'phaser';
import { createVignette } from '../utils/Vignette';

export class LevelScene extends Phaser.Scene {
    private player!: Phaser.Physics.Matter.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private keys!: any;
    private mapKey!: string;
    private returnPortalGroup!: Phaser.GameObjects.Group;
    private isTeleporting = false;

    private slowZones!: Phaser.GameObjects.Group;
    private targetSlowFactor = 1;
    private currentSlowFactor = 1;


    constructor() {
        super('LevelScene');
    }

    init(data: { mapKey?: string }) {
        this.mapKey = data?.mapKey || 'hub';
        this.isTeleporting = false;
    }

    preload() {
        this.load.image('Abandoned-Floor-Sheet.png', 'assets/exports/Maps/Abandoned-Floor-Sheet.png');
        this.load.image('Desert-Floor-Sheet.png', 'assets/exports/Maps/Desert-Floor-Sheet.png');
        this.load.image('Mechanic-Floor-Sheet.png', 'assets/exports/Maps/Mechanic-Floor-Sheet.png');
        this.load.image('Objects-Sheet.png', 'assets/exports/Maps/Objects-Sheet.png');

        this.load.tilemapTiledJSON('boss-floor-abandoned', 'assets/exports/Maps/boss-floor-abandoned.json');
        this.load.tilemapTiledJSON('boss-floor-desert', 'assets/exports/Maps/boss-floor-desert.json');
        this.load.tilemapTiledJSON('boss-floor-mechanic', 'assets/exports/Maps/boss-floor-mechanic.json');

        this.load.tilemapTiledJSON('abandoned-settlement', 'assets/exports/Maps/abandoned-settlement.json');

        this.load.spritesheet('protagonist', 'assets/exports/Boss/Protagonist-Sheet.png', {
            frameWidth: 32,
            frameHeight: 32
        });
    }

    create() {
        this.slowZones = this.add.group();
        this.targetSlowFactor = 1;
        this.currentSlowFactor = 1;

        if (this.scene.isActive('CombatScene')) {
            this.scene.stop('CombatScene');
        }

        this.cameras.main.setBackgroundColor('#111111');

        const cam = this.cameras.main;
        const originalPreRender = cam.preRender.bind(cam);
        cam.preRender = function () {
            originalPreRender();
            const subPixel = 1 / this.zoom;
            this.scrollX = Math.round(this.scrollX / subPixel) * subPixel;
            this.scrollY = Math.round(this.scrollY / subPixel) * subPixel;
            const midX = this.scrollX + this.width * 0.5;
            const midY = this.scrollY + this.height * 0.5;
            this.midPoint.set(midX, midY);
            const displayWidth = this.width / this.zoomX;
            const displayHeight = this.height / this.zoomY;
            this.worldView.setTo(
                midX - displayWidth / 2,
                midY - displayHeight / 2,
                displayWidth,
                displayHeight
            );
            const originX = this.width * this.originX;
            const originY = this.height * this.originY;
            if (this.isObjectInversion) {
                this.matrix.loadIdentity();
                this.matrix.translate(originX, originY);
                this.matrix.scale(this.zoomX, this.zoomY);
                this.matrix.rotate(this.rotation);
                this.matrix.translate(-this.scrollX - originX, -this.scrollY - originY);
            } else {
                this.matrix.applyITRS(originX, originY, this.rotation, this.zoomX, this.zoomY);
                this.matrix.translate(-this.scrollX - originX, -this.scrollY - originY);
            }
            this.matrixExternal.applyITRS(this.x, this.y, 0, 1, 1);
            this.shakeEffect.preRender();
            this.matrixExternal.multiply(this.matrix, this.matrixCombined);
        };

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

        createVignette(this);

        this.matter.world.on('collisionstart', (event: any) => {
            event.pairs.forEach((pair: any) => {
                const { bodyA, bodyB } = pair;
                const gameObjectA = bodyA.gameObject;
                const gameObjectB = bodyB.gameObject;

                if (gameObjectA === this.player || gameObjectB === this.player) {
                    const other = gameObjectA === this.player ? gameObjectB : gameObjectA;

                    if (other && other.getData('slowFactor')) {
                        this.targetSlowFactor = other.getData('slowFactor');
                    }

                    if (other && other.getData('target')) {
                        this.onPortalOverlap(other);
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

                    if (other && other.getData('slowFactor')) {
                        this.targetSlowFactor = 1;
                    }
                }
            });
        });
    }

    private createHub() {
        this.targetSlowFactor = 1;
        this.currentSlowFactor = 1;
        const width = 1200;
        const height = 800;

        this.matter.world.setBounds(-2000, -2000, 4000, 4000);
        this.cameras.main.setZoom(2);

        const rect = this.add.rectangle(width / 2, height / 2, 800, 400, 0xaa0000);

        this.createPortal(width / 2, height / 2 - 150, 'boss-floor-abandoned', 0x00aa00, 'Abandoned Swamp');
        this.createPortal(width / 2 - 300, height / 2 + 100, 'boss-floor-mechanic', 0xaaaa00, 'Mechanic Island');
        this.createPortal(width / 2 + 300, height / 2 + 100, 'boss-floor-desert', 0xdd8800, 'Desert City');
        this.createPortal(width / 2, height / 2 + 150, 'abandoned-settlement', 0x44aa44, 'Abandoned Settlement');

        const walls = [
            this.add.rectangle(width / 2, height / 2 - 200, 800, 20, 0x000000),
            this.add.rectangle(width / 2, height / 2 + 200, 800, 20, 0x000000),
            this.add.rectangle(width / 2 - 400, height / 2, 20, 400, 0x000000),
            this.add.rectangle(width / 2 + 400, height / 2, 20, 400, 0x000000)
        ];
        walls.forEach(w => this.matter.add.gameObject(w, { isStatic: true }));

        this.spawnPlayer(width / 2, height / 2);
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
        this.matter.world.setBounds(-2000, -2000, 4000, 4000);

        map.objects.forEach(layer => {
            const layerName = layer.name.toLowerCase();

            if (layerName.includes('collision') || layerName.includes('collider')) {
                layer.objects.forEach(obj => {
                    const x = obj.x || 0;
                    const y = obj.y || 0;
                    const rotation = obj.rotation || 0;
                    const angle = Phaser.Math.DegToRad(rotation);

                    if (obj.polygon || obj.polyline) {
                        const points = (obj.polygon || obj.polyline) as any[];
                        if (!points || points.length < 2) return;

                        const vertices = points.map(p => {
                            let px = p.x;
                            let py = p.y;
                            if (rotation !== 0) {
                                const r = Phaser.Math.RotateAround({ x: px, y: py }, 0, 0, angle);
                                px = r.x;
                                py = r.y;
                            }
                            return {
                                x: x + px,
                                y: y + py
                            };
                        });

                        if (obj.polygon) {
                            try {
                                const MatterLib = (Phaser.Physics.Matter as any).Matter;

                                const origBoundsMinX = Math.min(...vertices.map((v: any) => v.x));
                                const origBoundsMinY = Math.min(...vertices.map((v: any) => v.y));
                                const origBoundsMaxX = Math.max(...vertices.map((v: any) => v.x));
                                const origBoundsMaxY = Math.max(...vertices.map((v: any) => v.y));

                                const centroid = MatterLib.Vertices.centre(vertices);
                                const body = MatterLib.Bodies.fromVertices(centroid.x, centroid.y, [vertices], { isStatic: true });

                                if (body) {
                                    const bodyBoundsCenterX = (body.bounds.min.x + body.bounds.max.x) / 2;
                                    const bodyBoundsCenterY = (body.bounds.min.y + body.bounds.max.y) / 2;
                                    const origBoundsCenterX = (origBoundsMinX + origBoundsMaxX) / 2;
                                    const origBoundsCenterY = (origBoundsMinY + origBoundsMaxY) / 2;

                                    this.matter.world.add(body);

                                    MatterLib.Body.setPosition(body, {
                                        x: body.position.x + (origBoundsCenterX - bodyBoundsCenterX),
                                        y: body.position.y + (origBoundsCenterY - bodyBoundsCenterY)
                                    });
                                } else {
                                    const rw = obj.width || 32;
                                    const rh = obj.height || 32;
                                    this.matter.add.rectangle(x + rw / 2, y + rh / 2, rw, rh, { isStatic: true });
                                }
                            } catch (e) {
                            }
                        } else {
                            for (let i = 0; i < points.length - 1; i++) {
                                const p1 = points[i];
                                const p2 = points[i + 1];
                                const minX = Math.min(p1.x, p2.x);
                                const minY = Math.min(p1.y, p2.y);
                                const maxX = Math.max(p1.x, p2.x);
                                const maxY = Math.max(p1.y, p2.y);
                                const rectW = Math.max(maxX - minX, 4);
                                const rectH = Math.max(maxY - minY, 4);
                                const rectX = x + minX + (maxX - minX) / 2;
                                const rectY = y + minY + (maxY - minY) / 2;
                                this.matter.add.rectangle(rectX, rectY, rectW, rectH, { isStatic: true });
                            }
                        }
                    } else if (obj.ellipse) {
                        const rw = obj.width || 16;
                        const rh = obj.height || 16;
                        const radius = rw / 2;
                        const cx = x + radius;
                        const cy = y + radius;
                        const pos = rotation !== 0 ? Phaser.Math.RotateAround({ x: cx, y: cy }, x, y, angle) : { x: cx, y: cy };

                        this.matter.add.circle(pos.x, pos.y, radius, {
                            isStatic: true,
                            angle: angle
                        });
                    } else if (obj.rectangle || (obj.width && obj.height)) {
                        const rw = obj.width || 16;
                        const rh = obj.height || 16;
                        const cx = x + rw / 2;
                        const cy = y + rh / 2;
                        const pos = rotation !== 0 ? Phaser.Math.RotateAround({ x: cx, y: cy }, x, y, angle) : { x: cx, y: cy };

                        this.matter.add.rectangle(pos.x, pos.y, rw, rh, {
                            isStatic: true,
                            angle: angle
                        });
                    }
                });
            }
        });

        let spawnX = 0;
        let spawnY = 0;
        let portalX = 0;
        let portalY = 0;

        if (mapKey === 'boss-floor-abandoned') {
            spawnX = 32;
            spawnY = 380;
            portalX = 32;
            portalY = 430;
        } else if (mapKey === 'boss-floor-desert') {
            spawnX = 0;
            spawnY = 380;
            portalX = 0;
            portalY = 430;
        } else if (mapKey === 'boss-floor-mechanic') {
            spawnX = 416;
            spawnY = 795;
            portalX = 416;
            portalY = 845;
        } else if (mapKey === 'abandoned-settlement') {
            spawnX = 650;
            spawnY = -353;
            portalX = 700;
            portalY = -353;
        }

        this.spawnPlayer(spawnX, spawnY);
        this.player.setDepth(this.getPlayerDepth(mapKey));
        this.createPortal(portalX, portalY, 'hub', 0xff0000, 'Return to Hub');

        if (mapKey !== 'abandoned-settlement') {
            const tileSize = 32;
            const stairHeight = tileSize * 6;
            const stairCenterY = portalY - (stairHeight / 1.8);
            this.createSlowZone(portalX, stairCenterY, tileSize * 2, stairHeight, 0.6);
        }

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
        this.player.setDepth(9);
        this.player.setRectangle(16, 10, { chamfer: { radius: 2 } });
        this.player.setOrigin(0.5, 0.8);
        this.player.setFixedRotation();
        this.player.setFriction(0);
        this.player.setFrictionStatic(0);
        this.player.setBounce(0);

        this.cameras.main.startFollow(this.player, false, 0.1, 0.1);
        this.player.play('idle');
    }

    private onPortalOverlap(portal: Phaser.GameObjects.GameObject) {
        if (this.isTeleporting) return;

        const targetMap = portal.getData('target');
        if (targetMap) {
            this.isTeleporting = true;
            this.scene.restart({ mapKey: targetMap });
        }
    }

    update() {
        this.currentSlowFactor = Phaser.Math.Linear(this.currentSlowFactor, this.targetSlowFactor, 0.08);
        const speed = 3 * this.currentSlowFactor;
        const body = this.player.body as MatterJS.BodyType;

        let moveX = 0;
        let moveY = 0;
        let moving = false;

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
            const moveVec = new Phaser.Math.Vector2(moveX, moveY).normalize().scale(speed);
            this.player.setVelocity(moveVec.x, moveVec.y);
            this.player.anims.timeScale = this.currentSlowFactor;

            if (this.player.anims.currentAnim?.key !== 'run') {
                this.player.play('run');
            }
        } else {
            const friction = 0.85;
            this.player.setVelocity(body.velocity.x * friction, body.velocity.y * friction);
            this.player.anims.timeScale = 1;

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

    private getPlayerDepth(mapKey: string): number {
        switch (mapKey) {
            case 'boss-floor-abandoned': return 9;
            case 'boss-floor-desert': return 12;
            case 'boss-floor-mechanic': return 10;
            case 'abandoned-settlement': return 20;
            default: return 10;
        }
    }

    private createSlowZone(x: number, y: number, w: number, h: number, factor = 0.6) {
        const zone = this.add.rectangle(x, y, w, h, 0x0000ff, 0);
        this.matter.add.gameObject(zone, { isStatic: true, isSensor: true });
        zone.setData('slowFactor', factor);
        this.slowZones.add(zone);
    }
}