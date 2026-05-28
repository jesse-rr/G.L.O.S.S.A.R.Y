import * as Phaser from 'phaser';

export function createVignette(scene: Phaser.Scene, depth: number = 90, isDark: boolean = false): Phaser.GameObjects.Image {
    const name = isDark ? 'vignette_dark' : 'vignette';
    const textureKey = isDark ? '__vignette_dark__' : '__vignette__';
    const edgeSize = isDark ? 0.15 : 0.075;
    const alphaStr = isDark ? '0.30' : '0.10';

    const existing = scene.children.getByName(name) as Phaser.GameObjects.Image;
    if (existing) {
        return existing;
    }

    const w = Number(scene.game.config.width);
    const h = Number(scene.game.config.height);

    if (!scene.textures.exists(textureKey)) {
        const p = 100;
        const canvas = scene.textures.createCanvas(textureKey, w + 2 * p, h + 2 * p);
        const ctx = canvas!.context;

        ctx.fillStyle = `rgba(0, 0, 0, ${alphaStr})`;
        ctx.fillRect(0, 0, w + 2 * p, p);
        ctx.fillRect(0, h + p, w + 2 * p, p);
        ctx.fillRect(0, 0, p, h + 2 * p);
        ctx.fillRect(w + p, 0, p, h + 2 * p);

        const top = ctx.createLinearGradient(0, p, 0, p + h * edgeSize);
        top.addColorStop(0, `rgba(0, 0, 0, ${alphaStr})`);
        top.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = top;
        ctx.fillRect(0, p, w + 2 * p, h * edgeSize);

        const bottom = ctx.createLinearGradient(0, p + h, 0, p + h - h * edgeSize);
        bottom.addColorStop(0, `rgba(0, 0, 0, ${alphaStr})`);
        bottom.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = bottom;
        ctx.fillRect(0, p + h - h * edgeSize, w + 2 * p, h * edgeSize);

        const left = ctx.createLinearGradient(p, 0, p + w * edgeSize, 0);
        left.addColorStop(0, `rgba(0, 0, 0, ${alphaStr})`);
        left.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = left;
        ctx.fillRect(p, 0, w * edgeSize, h + 2 * p);

        const right = ctx.createLinearGradient(p + w, 0, p + w - w * edgeSize, 0);
        right.addColorStop(0, `rgba(0, 0, 0, ${alphaStr})`);
        right.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = right;
        ctx.fillRect(p + w - w * edgeSize, 0, w * edgeSize, h + 2 * p);

        canvas!.refresh();
    }

    const zoom = scene.cameras.main.zoom || 1;
    const vignette = scene.add.image(w / 2, h / 2, textureKey);
    vignette.setOrigin(0.5, 0.5);
    vignette.setScrollFactor(0);
    vignette.setScale(1 / zoom);
    vignette.setDepth(depth);
    vignette.setName(name);

    return vignette;
}
