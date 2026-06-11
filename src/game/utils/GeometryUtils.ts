import * as Phaser from 'phaser';

export function ensureClockwise(vertices: { x: number, y: number }[]): { x: number, y: number }[] {
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

export function removeDuplicatePoints(vertices: { x: number, y: number }[]): { x: number, y: number }[] {
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

export function createPolygonSensorBody(
    x: number, y: number,
    localPoints: { x: number, y: number }[],
    angle: number
): MatterJS.BodyType {
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
    vertices = removeDuplicatePoints(vertices);
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
    vertices = ensureClockwise(vertices);
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
