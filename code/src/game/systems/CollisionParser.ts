import * as Phaser from 'phaser';
import { createPolygonSensorBody } from '../utils/GeometryUtils';
import { MatterScene } from '../types';

export function parseCollisionObjects(scene: Phaser.Scene, layers: Phaser.Tilemaps.ObjectLayer[]): void {
    layers.forEach(layer => {
        if (!layer.name.toLowerCase().includes('collision')) return;

        layer.objects.forEach(obj => {
            const x = obj.x || 0;
            const y = obj.y || 0;
            const rotation = obj.rotation || 0;
            const angle = Phaser.Math.DegToRad(rotation);

            if (obj.polygon || obj.polyline) {
                const points = (obj.polygon || obj.polyline) as any[];
                if (!points || points.length < 2) return;
                const vertices = points.map((p: any) => {
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
                            (scene as MatterScene).matter.world.add(body);
                            const bounds = body.bounds;
                            const dx = (Math.min(...vertices.map((v: any) => v.x)) + Math.max(...vertices.map((v: any) => v.x))) / 2 - (bounds.min.x + bounds.max.x) / 2;
                            const dy = (Math.min(...vertices.map((v: any) => v.y)) + Math.max(...vertices.map((v: any) => v.y))) / 2 - (bounds.min.y + bounds.max.y) / 2;
                            MatterLib.Body.setPosition(body, { x: body.position.x + dx, y: body.position.y + dy });
                        } else {
                            const rw = obj.width || 32, rh = obj.height || 32;
                            (scene as MatterScene).matter.add.rectangle(x + rw / 2, y + rh / 2, rw, rh, { isStatic: true });
                        }
                    } catch (e) { }
                } else {
                    for (let i = 0; i < vertices.length - 1; i++) {
                        const p1 = vertices[i], p2 = vertices[i + 1];
                        const minX = Math.min(p1.x, p2.x), minY = Math.min(p1.y, p2.y), maxX = Math.max(p1.x, p2.x), maxY = Math.max(p1.y, p2.y);
                        const rectW = Math.max(maxX - minX, 6), rectH = Math.max(maxY - minY, 6);
                        const rectX = minX + (maxX - minX) / 2, rectY = minY + (maxY - minY) / 2;
                        (scene as MatterScene).matter.add.rectangle(rectX, rectY, rectW, rectH, { isStatic: true });
                    }
                }
            } else if (obj.ellipse) {
                const rw = obj.width || 16, radius = rw / 2;
                const cx = x + radius, cy = y + radius;
                const pos = rotation !== 0 ? Phaser.Math.RotateAround({ x: cx, y: cy }, x, y, angle) : { x: cx, y: cy };
                (scene as MatterScene).matter.add.circle(pos.x, pos.y, radius, { isStatic: true, angle: angle });
            } else if (obj.rectangle || (obj.width && obj.height)) {
                const rw = obj.width || 16, rh = obj.height || 16;
                const cx = x + rw / 2, cy = y + rh / 2;
                const pos = rotation !== 0 ? Phaser.Math.RotateAround({ x: cx, y: cy }, x, y, angle) : { x: cx, y: cy };
                (scene as MatterScene).matter.add.rectangle(pos.x, pos.y, rw, rh, { isStatic: true, angle: angle });
            }
        });
    });
}

export interface StairParseResult {
    stairVisuals: Phaser.GameObjects.Shape[];
}

export function parseStairObjects(
    scene: Phaser.Scene,
    stairsLayer: Phaser.Tilemaps.ObjectLayer,
    stairZones: Phaser.GameObjects.Group
): StairParseResult {
    const visuals: Phaser.GameObjects.Shape[] = [];

    stairsLayer.objects.forEach((obj, index) => {
        const x = obj.x || 0;
        const y = obj.y || 0;
        const rotation = obj.rotation || 0;
        const angle = Phaser.Math.DegToRad(rotation);
        const MatterLib = (Phaser.Physics.Matter as any).Matter;
        let body: MatterJS.BodyType | null = null;
        let visual: Phaser.GameObjects.Shape;

        const isReverse = obj.name && obj.name.toLowerCase() === 'no-affect';



        if (obj.polygon && obj.polygon.length >= 3) {
            const localPoints = obj.polygon.map((p: any) => ({ x: p.x, y: p.y }));
            body = createPolygonSensorBody(x, y, localPoints, angle);
            visual = scene.add.polygon(x, y, localPoints, isReverse ? 0xff0000 : 0x00ff00, 0);
            visual.setOrigin(0, 0);
            if (rotation !== 0) visual.setRotation(angle);
        } else {
            const width = obj.width || 32;
            const height = obj.height || 32;
            const cx = x + width / 2;
            const cy = y + height / 2;
            const pos = rotation !== 0 ? Phaser.Math.RotateAround({ x: cx, y: cy }, x, y, angle) : { x: cx, y: cy };
            body = MatterLib.Bodies.rectangle(pos.x, pos.y, width, height, { isStatic: true, isSensor: true, angle: angle });
            if (body) (scene as MatterScene).matter.world.add(body as object);
            visual = scene.add.rectangle(pos.x, pos.y, width, height, isReverse ? 0xff0000 : 0x00ff00, 0);
            visual.setOrigin(0.5, 0.5);
            if (rotation !== 0) visual.setRotation(angle);
        }

        if (body) {
            if (!(scene as MatterScene).matter.world.getAllBodies().includes(body)) {
                (scene as MatterScene).matter.world.add(body as object);
            }
            body.gameObject = visual;
            const uniqueStairId = index;
            if (isReverse) {
                visual.setData('reverseSlow', true);
            } else {
                visual.setData('isStair', true);
                visual.setData('stairId', uniqueStairId);
            }
            stairZones.add(visual);
            visuals.push(visual);
        }
    });

    return { stairVisuals: visuals };
}
