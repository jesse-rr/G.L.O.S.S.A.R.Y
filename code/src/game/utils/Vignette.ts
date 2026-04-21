import * as Phaser from 'phaser';

const VIGNETTE_KEY = '__vignette__';

export function createVignette(scene: Phaser.Scene, depth: number = 90): Phaser.GameObjects.Image {
    const w = Number(scene.game.config.width);
    const h = Number(scene.game.config.height);

    if (!scene.textures.exists(VIGNETTE_KEY)) {
        const canvas = scene.textures.createCanvas(VIGNETTE_KEY, w, h);
        const ctx = canvas!.context;
        const edgeSize = 0.075;

        const top = ctx.createLinearGradient(0, 0, 0, h * edgeSize);
        top.addColorStop(0, 'rgba(0, 0, 0, 0.10)');
        top.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = top;
        ctx.fillRect(0, 0, w, h * edgeSize);

        const bottom = ctx.createLinearGradient(0, h, 0, h - h * edgeSize);
        bottom.addColorStop(0, 'rgba(0, 0, 0, 0.10)');
        bottom.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = bottom;
        ctx.fillRect(0, h - h * edgeSize, w, h * edgeSize);

        const left = ctx.createLinearGradient(0, 0, w * edgeSize, 0);
        left.addColorStop(0, 'rgba(0, 0, 0, 0.10)');
        left.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = left;
        ctx.fillRect(0, 0, w * edgeSize, h);

        const right = ctx.createLinearGradient(w, 0, w - w * edgeSize, 0);
        right.addColorStop(0, 'rgba(0, 0, 0, 0.10)');
        right.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = right;
        ctx.fillRect(w - w * edgeSize, 0, w * edgeSize, h);

        canvas!.refresh();
    }

    const zoom = scene.cameras.main.zoom || 1;
    const vignette = scene.add.image(0, 0, VIGNETTE_KEY);
    vignette.setOrigin(-.5, -.5);
    vignette.setScrollFactor(0);
    vignette.setScale(1 / zoom);
    vignette.setDepth(depth);

    return vignette;
}
