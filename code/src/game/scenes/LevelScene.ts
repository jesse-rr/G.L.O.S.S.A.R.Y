import * as Phaser from 'phaser';
import { createVignette } from '../utils/Vignette';
import { PlayerData } from '../data/PlayerData';

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

    private stairZones!: Phaser.GameObjects.Group;
    private onStairs = false;
    private inReverseZone = false;

    private activeStairZones: Set<number> = new Set();

    constructor() {
        super('LevelScene');
    }

    private previousMap: string = '';

    init(data: { mapKey?: string, previousMap?: string }) {
        this.mapKey = data?.mapKey || 'hub';
        this.previousMap = data?.previousMap || '';
        this.isTeleporting = false;
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

        this.load.spritesheet('protagonist', 'assets/exports/Boss/Protagonist-Sheet.png', {
            frameWidth: 32,
            frameHeight: 32
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

        if (this.scene.isActive('CombatScene')) {
            this.scene.stop('CombatScene');
        }

        this.cameras.main.setBackgroundColor('#111111');

        const cam = this.cameras.main;
        const originalPreRender = cam.preRender.bind(cam);
        cam.preRender = function () {
            originalPreRender();
            const subPixel = 1 / this.zoom;
            const rx = Math.round(this.scrollX / subPixel) * subPixel;
            const ry = Math.round(this.scrollY / subPixel) * subPixel;
            const midX = rx + this.width * 0.5;
            const midY = ry + this.height * 0.5;
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
                this.matrix.translate(-rx - originX, -ry - originY);
            } else {
                this.matrix.applyITRS(originX, originY, this.rotation, this.zoomX, this.zoomY);
                this.matrix.translate(-rx - originX, -ry - originY);
            }
            this.matrixExternal.applyITRS(this.x, this.y, 0, 1, 1);
            this.shakeEffect.preRender();
            this.matrixExternal.multiply(this.matrix, this.matrixCombined);
        };

        this.returnPortalGroup = this.add.group();

        if (this.mapKey === 'hub' || this.mapKey === 'central-hub') {
            this.createMap('central-hub');
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



    private createPortal(x: number, y: number, targetMap: string, color: number, label: string, width: number = 60, height: number = 60) {
        const portal = this.add.rectangle(x, y, width, height, color);
        this.matter.add.gameObject(portal, { isStatic: true, isSensor: true });
        this.returnPortalGroup.add(portal);
        portal.setData('target', targetMap);
        if (targetMap === 'hub') {
            portal.setAlpha(0);
        }
        this.add.text(x, y - 40, label, { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
    }

    private ensureClockwise(vertices: { x: number, y: number }[]): { x: number, y: number }[] {
        let sum = 0;
        for (let i = 0; i < vertices.length; i++) {
            const p1 = vertices[i];
            const p2 = vertices[(i + 1) % vertices.length];
            sum += (p2.x - p1.x) * (p2.y + p1.y);
        }
        if (sum > 0) {
            vertices.reverse();
        }
        return vertices;
    }

    private removeDuplicatePoints(vertices: { x: number, y: number }[]): { x: number, y: number }[] {
        const unique: { x: number, y: number }[] = [];
        for (let i = 0; i < vertices.length; i++) {
            const v = vertices[i];
            let isDuplicate = false;
            for (let j = 0; j < unique.length; j++) {
                if (Math.abs(unique[j].x - v.x) < 0.01 && Math.abs(unique[j].y - v.y) < 0.01) {
                    isDuplicate = true;
                    break;
                }
            }
            if (!isDuplicate) unique.push(v);
        }
        return unique;
    }

    private createPolygonSensorBody(x: number, y: number, localPoints: { x: number, y: number }[], angle: number) {
        const MatterLib = (Phaser.Physics.Matter as any).Matter;
        const worldPoints = localPoints.map(p => {
            let px = p.x, py = p.y;
            if (angle !== 0) {
                const r = Phaser.Math.RotateAround({ x: px, y: py }, 0, 0, angle);
                px = r.x; py = r.y;
            }
            return new Phaser.Math.Vector2(x + px, y + py);
        });
        let vertices = worldPoints.map(p => ({ x: p.x, y: p.y }));
        vertices = this.removeDuplicatePoints(vertices);
        if (vertices.length < 3) {
            const minX = Math.min(...worldPoints.map(p => p.x));
            const minY = Math.min(...worldPoints.map(p => p.y));
            const maxX = Math.max(...worldPoints.map(p => p.x));
            const maxY = Math.max(...worldPoints.map(p => p.y));
            const width = maxX - minX;
            const height = maxY - minY;
            const cx = minX + width / 2;
            const cy = minY + height / 2;
            return MatterLib.Bodies.rectangle(cx, cy, width, height, { isStatic: true, isSensor: true });
        }
        vertices = this.ensureClockwise(vertices);
        const matterVerts = vertices.map(v => MatterLib.Vector.create(v.x, v.y));
        try {
            const hull = MatterLib.Vertices.hull(matterVerts);
            const centroid = MatterLib.Vertices.centre(hull);
            const bodies = MatterLib.Bodies.fromVertices(centroid.x, centroid.y, [hull], { isStatic: true, isSensor: true });
            if (bodies && bodies.length > 0) {
                return bodies[0];
            }
        } catch (e) { }
        const minX = Math.min(...worldPoints.map(p => p.x));
        const minY = Math.min(...worldPoints.map(p => p.y));
        const maxX = Math.max(...worldPoints.map(p => p.x));
        const maxY = Math.max(...worldPoints.map(p => p.y));
        const width = maxX - minX;
        const height = maxY - minY;
        const cx = minX + width / 2;
        const cy = minY + height / 2;
        return MatterLib.Bodies.rectangle(cx, cy, width, height, { isStatic: true, isSensor: true });
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

        map.objects.forEach(layer => {
            if (layer.name.toLowerCase().includes('collision')) {
                layer.objects.forEach(obj => {
                    const x = obj.x || 0;
                    const y = obj.y || 0;
                    const rotation = obj.rotation || 0;
                    const angle = Phaser.Math.DegToRad(rotation);

                    if (obj.polygon || obj.polyline) {
                        const points = (obj.polygon || obj.polyline) as any[];
                        if (!points || points.length < 2) return;
                        const vertices = points.map(p => {
                            let px = p.x, py = p.y;
                            if (rotation !== 0) {
                                const r = Phaser.Math.RotateAround({ x: px, y: py }, 0, 0, angle);
                                px = r.x; py = r.y;
                            }
                            return { x: x + px, y: y + py };
                        });
                        if (obj.polygon) {
                            try {
                                const MatterLib = (Phaser.Physics.Matter as any).Matter;
                                const centroid = MatterLib.Vertices.centre(vertices);
                                const body = MatterLib.Bodies.fromVertices(centroid.x, centroid.y, [vertices], { isStatic: true });
                                if (body) {
                                    this.matter.world.add(body);
                                    const bounds = body.bounds;
                                    const dx = (Math.min(...vertices.map(v => v.x)) + Math.max(...vertices.map(v => v.x))) / 2 - (bounds.min.x + bounds.max.x) / 2;
                                    const dy = (Math.min(...vertices.map(v => v.y)) + Math.max(...vertices.map(v => v.y))) / 2 - (bounds.min.y + bounds.max.y) / 2;
                                    MatterLib.Body.setPosition(body, { x: body.position.x + dx, y: body.position.y + dy });
                                } else {
                                    const rw = obj.width || 32, rh = obj.height || 32;
                                    this.matter.add.rectangle(x + rw / 2, y + rh / 2, rw, rh, { isStatic: true });
                                }
                            } catch (e) { }
                        } else {
                            for (let i = 0; i < vertices.length - 1; i++) {
                                const p1 = vertices[i], p2 = vertices[i + 1];
                                const minX = Math.min(p1.x, p2.x), minY = Math.min(p1.y, p2.y), maxX = Math.max(p1.x, p2.x), maxY = Math.max(p1.y, p2.y);
                                const rectW = Math.max(maxX - minX, 6), rectH = Math.max(maxY - minY, 6);
                                const rectX = minX + (maxX - minX) / 2, rectY = minY + (maxY - minY) / 2;
                                this.matter.add.rectangle(rectX, rectY, rectW, rectH, { isStatic: true });
                            }
                        }
                    } else if (obj.ellipse) {
                        const rw = obj.width || 16, rh = obj.height || 16, radius = rw / 2;
                        const cx = x + radius, cy = y + radius;
                        const pos = rotation !== 0 ? Phaser.Math.RotateAround({ x: cx, y: cy }, x, y, angle) : { x: cx, y: cy };
                        this.matter.add.circle(pos.x, pos.y, radius, { isStatic: true, angle: angle });
                    } else if (obj.rectangle || (obj.width && obj.height)) {
                        const rw = obj.width || 16, rh = obj.height || 16;
                        const cx = x + rw / 2, cy = y + rh / 2;
                        const pos = rotation !== 0 ? Phaser.Math.RotateAround({ x: cx, y: cy }, x, y, angle) : { x: cx, y: cy };
                        this.matter.add.rectangle(pos.x, pos.y, rw, rh, { isStatic: true, angle: angle });
                    }
                });
            }
        });

        const stairsLayer = map.objects.find(layer => layer.name.toLowerCase() === 'stairs');
        if (stairsLayer) {
            stairsLayer.objects.forEach((obj, index) => {
                const x = obj.x || 0;
                const y = obj.y || 0;
                const rotation = obj.rotation || 0;
                const angle = Phaser.Math.DegToRad(rotation);
                const MatterLib = (Phaser.Physics.Matter as any).Matter;
                let body: MatterJS.BodyType | null = null;
                let visual: Phaser.GameObjects.GameObject;

                const isReverse = obj.name && obj.name.toLowerCase() === 'no-affect';

                if (!isReverse) {
                    const axisProp = obj.properties?.find((p: any) => p.name === 'axis');
                    if (!axisProp) return;
                    const axis = axisProp.value;
                    if (axis !== 'horizontal' && axis !== 'vertical') return;
                }

                if (obj.polygon && obj.polygon.length >= 3) {
                    const localPoints = obj.polygon.map((p: any) => ({ x: p.x, y: p.y }));
                    body = this.createPolygonSensorBody(x, y, localPoints, angle);
                    visual = this.add.polygon(x, y, localPoints, isReverse ? 0xff0000 : 0x00ff00, 0);
                    visual.setOrigin(0, 0);
                    if (rotation !== 0) visual.setRotation(angle);
                } else {
                    const width = obj.width || 32;
                    const height = obj.height || 32;
                    const cx = x + width / 2;
                    const cy = y + height / 2;
                    const pos = rotation !== 0 ? Phaser.Math.RotateAround({ x: cx, y: cy }, x, y, angle) : { x: cx, y: cy };
                    body = MatterLib.Bodies.rectangle(pos.x, pos.y, width, height, { isStatic: true, isSensor: true, angle: angle });
                    this.matter.world.add(body);
                    visual = this.add.rectangle(pos.x, pos.y, width, height, isReverse ? 0xff0000 : 0x00ff00, 0);
                    visual.setOrigin(0.5, 0.5);
                    if (rotation !== 0) visual.setRotation(angle);
                }

                if (body) {
                    if (!this.matter.world.engine.world.bodies.includes(body)) {
                        this.matter.world.add(body);
                    }
                    body.gameObject = visual;
                    const uniqueStairId = index;
                    if (isReverse) {
                        visual.setData('reverseSlow', true);
                    } else {
                        const axisProp = obj.properties?.find((p: any) => p.name === 'axis');
                        const axis = axisProp ? axisProp.value : 'unknown';
                        visual.setData('isStair', true);
                        visual.setData('stairId', uniqueStairId);
                    }
                    this.stairZones.add(visual);
                }
            });
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
                let label = '';
                let color = 0x00ff00;

                if (mapKey === 'central-hub') {
                    const covenant = PlayerData.getInstance().covenant;
                    if (y < -500) {
                        targetMap = covenant === 'dragon' ? 'boss-floor-mechanic' :
                            covenant === 'phoenix' ? 'boss-floor-desert' : 'boss-floor-abandoned';
                        label = 'Boss Fight';
                        color = 0xff0000;
                    } else if (x < -100) {
                        targetMap = covenant === 'dragon' ? 'mechanic-settlement' :
                            covenant === 'phoenix' ? 'desert-settlement' : 'abandoned-settlement';
                        label = 'Settlement';
                        color = 0x00ff00;
                    } else {
                        return;
                    }
                } else {
                    targetMap = 'hub';
                    label = 'Return to Hub';
                    color = 0x0000ff;
                }

                if (targetMap) {
                    this.createPortal(cx, cy, targetMap, color, label, width, height);
                }
            });
        }

        let spawnX = 0, spawnY = 0;
        const SPACING = 80;

        if (mapKey === 'central-hub') {
            if (this.previousMap.includes('boss-')) {
                const topPortal = portalsLayer?.objects.find(o => (o.y || 0) < -500);
                if (topPortal) {
                    spawnX = (topPortal.x || 0) + (topPortal.width || 60) / 2;
                    spawnY = (topPortal.y || 0) + (topPortal.height || 60) / 2 + SPACING;
                }
            } else if (this.previousMap.includes('-settlement')) {
                const leftPortal = portalsLayer?.objects.find(o => (o.x || 0) < -100 && (o.y || 0) > -500);
                if (leftPortal) {
                    spawnX = (leftPortal.x || 0) + (leftPortal.width || 60) / 2 + SPACING;
                    spawnY = (leftPortal.y || 0) + (leftPortal.height || 60) / 2;
                }
            } else {
                spawnX = 0;
                spawnY = -10;
            }
        } else {
            const returnPortal = portalsLayer?.objects[0];
            if (returnPortal) {
                const px = (returnPortal.x || 0) + (returnPortal.width || 60) / 2;
                const py = (returnPortal.y || 0) + (returnPortal.height || 60) / 2;

                if (mapKey.includes('boss-')) {
                    spawnX = px;
                    spawnY = py - SPACING;
                } else if (mapKey.includes('-settlement')) {
                    spawnX = px - SPACING;
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
        this.cameras.main.startFollow(this.player, false, 0.09, 0.09);
        this.player.play('idle');
    }

    private onPortalOverlap(portal: Phaser.GameObjects.GameObject) {
        if (this.isTeleporting) return;
        const targetMap = portal.getData('target');
        if (targetMap) {
            this.isTeleporting = true;
            this.scene.restart({ mapKey: targetMap, previousMap: this.mapKey });
        }
    }

    update() {
        this.currentSlowFactor = Phaser.Math.Linear(this.currentSlowFactor, this.targetSlowFactor, 0.05);
        const speed = 3 * this.currentSlowFactor;
        const body = this.player.body as MatterJS.BodyType;

        let moveX = 0, moveY = 0, moving = false;
        if (this.cursors.left.isDown || this.keys.A.isDown) { moveX = -1; this.player.setFlipX(true); moving = true; }
        else if (this.cursors.right.isDown || this.keys.D.isDown) { moveX = 1; this.player.setFlipX(false); moving = true; }
        if (this.cursors.up.isDown || this.keys.W.isDown) { moveY = -1; moving = true; }
        else if (this.cursors.down.isDown || this.keys.S.isDown) { moveY = 1; moving = true; }

        if (moving) {
            const inputVelocity = new Phaser.Math.Vector2(moveX, moveY).normalize().scale(speed);
            this.player.setVelocity(inputVelocity.x, inputVelocity.y);
            this.player.anims.timeScale = this.currentSlowFactor;
            if (this.player.anims.currentAnim?.key !== 'run') this.player.play('run');
        } else {
            this.player.setVelocity(body.velocity.x * 0.85, body.velocity.y * 0.85);
            this.player.anims.timeScale = 1;
            if (this.player.anims.currentAnim?.key === 'run') this.player.play('stop').chain('idle');
            else if (this.player.anims.currentAnim?.key !== 'stop' && this.player.anims.currentAnim?.key !== 'idle') this.player.play('idle');
        }
    }

    private getPlayerDepth(mapKey: string): number {
        switch (mapKey) {
            case 'boss-floor-abandoned': return 8;
            case 'boss-floor-desert': return 12;
            case 'boss-floor-mechanic': return 10;
            case 'abandoned-settlement': return 13;
            case 'desert-settlement': return 13;
            case 'mechanic-settlement': return 13;
            default: return 10;
        }
    }
}