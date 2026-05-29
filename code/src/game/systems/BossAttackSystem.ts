import * as Phaser from 'phaser';
import { ScreenShake } from '../utils/ScreenShake';

export class BossAttackSystem {
    private scene: Phaser.Scene;
    private player: Phaser.Physics.Matter.Sprite;
    private bigPillar!: Phaser.GameObjects.Sprite;
    private bigPillarBody?: MatterJS.BodyType;
    private bigPillarX: number = 0;
    private bigPillarY: number = 0;
    private isBigAttacking: boolean = false;
    private bigDamaged: boolean = false;
    private bigIndicator?: Phaser.GameObjects.Sprite;
    private activeSmallPillars: { sprite: Phaser.GameObjects.Sprite; body: MatterJS.BodyType; indicator?: Phaser.GameObjects.Sprite; damaged: boolean }[] = [];
    private isSmallAttacking: boolean = false;
    private activeInlinePillars: { sprite: Phaser.GameObjects.Sprite; body: MatterJS.BodyType; indicator?: Phaser.GameObjects.Sprite; damaged: boolean }[] = [];
    private isInlineAttacking: boolean = false;
    private activeSpikes: { sprite: Phaser.GameObjects.Sprite; body: MatterJS.BodyType; indicator?: Phaser.GameObjects.Sprite; damaged: boolean }[] = [];
    private isSpikesAttacking: boolean = false;

    constructor(scene: Phaser.Scene, player: Phaser.Physics.Matter.Sprite) {
        this.scene = scene;
        this.player = player;

        if (!this.scene.anims.exists('pillarRise')) {
            this.scene.anims.create({
                key: 'pillarRise',
                frames: this.scene.anims.generateFrameNumbers('pillar', { start: 0, end: 5 }),
                frameRate: 20,
                repeat: 0
            });
        }

        if (!this.scene.anims.exists('pillarFall')) {
            this.scene.anims.create({
                key: 'pillarFall',
                frames: this.scene.anims.generateFrameNumbers('pillar', { start: 5, end: 0 }),
                frameRate: 20,
                repeat: 0
            });
        }

        if (!this.scene.anims.exists('smallPillarRise')) {
            this.scene.anims.create({
                key: 'smallPillarRise',
                frames: this.scene.anims.generateFrameNumbers('small_pillar', { start: 0, end: 11 }),
                frameRate: 15,
                repeat: 0
            });
        }

        if (!this.scene.anims.exists('smallPillarFall')) {
            this.scene.anims.create({
                key: 'smallPillarFall',
                frames: this.scene.anims.generateFrameNumbers('small_pillar', { start: 11, end: 0 }),
                frameRate: 15,
                repeat: 0
            });
        }

        if (!this.scene.anims.exists('inlinePillarRise')) {
            this.scene.anims.create({
                key: 'inlinePillarRise',
                frames: this.scene.anims.generateFrameNumbers('inline_pillar', { start: 0, end: 6 }),
                frameRate: 20,
                repeat: 0
            });
        }

        if (!this.scene.anims.exists('inlinePillarFall')) {
            this.scene.anims.create({
                key: 'inlinePillarFall',
                frames: this.scene.anims.generateFrameNumbers('inline_pillar', { start: 6, end: 0 }),
                frameRate: 20,
                repeat: 0
            });
        }

        if (!this.scene.anims.exists('spikesRise')) {
            this.scene.anims.create({
                key: 'spikesRise',
                frames: this.scene.anims.generateFrameNumbers('spikes', { start: 0, end: 10 }),
                frameRate: 24,
                repeat: 0
            });
        }

        if (!this.scene.anims.exists('spikesFall')) {
            this.scene.anims.create({
                key: 'spikesFall',
                frames: this.scene.anims.generateFrameNumbers('spikes', { start: 10, end: 0 }),
                frameRate: 24,
                repeat: 0
            });
        }

        this.bigPillar = this.scene.add.sprite(0, 0, 'pillar');
        this.bigPillar.setVisible(false);
        this.bigPillar.setDepth(100);

        this.scene.input.keyboard!.on('keydown-H', () => {
            if (!this.isBigAttacking) {
                this.executeBigPillarAttack();
            }
        });

        this.scene.input.keyboard!.on('keydown-J', () => {
            if (!this.isSmallAttacking) {
                this.executeSmallPillarsSpam();
            }
        });

        this.scene.input.keyboard!.on('keydown-K', () => {
            if (!this.isInlineAttacking) {
                this.executeInlinePillarAttack();
            }
        });

        this.scene.input.keyboard!.on('keydown-I', () => {
            if (!this.isSpikesAttacking) {
                this.executeSpikesAttack();
            }
        });
    }

    update() {
        if (this.isBigAttacking && this.bigPillarBody) {
            this.scene.matter.body.setPosition(this.bigPillarBody, { x: this.bigPillarX, y: this.bigPillarY });
        }
        this.checkBigCollision();
        this.checkSmallCollisions();
        this.checkInlineCollisions();
        this.checkSpikesCollisions();
    }

    private executeBigPillarAttack() {
        this.isBigAttacking = true;
        this.bigDamaged = false;
        const spawnX = this.player.x;
        const spawnY = this.player.y;
        const side = Phaser.Math.Between(0, 1) === 0 ? 'left' : 'right';
        const targetX = side === 'left' ? spawnX - 250 : spawnX + 250;
        const startX = side === 'left' ? spawnX + 250 : spawnX - 250;

        this.bigIndicator = this.scene.add.sprite(spawnX, spawnY, 'big_pillar_indicator');
        this.bigIndicator.setOrigin(0.5, 0.5);
        this.bigIndicator.setDepth(97);
        this.bigIndicator.setAlpha(0.6);

        this.scene.tweens.add({
            targets: this.bigIndicator,
            alpha: 0.9,
            yoyo: true,
            repeat: -1,
            duration: 300,
            ease: 'Sine.easeInOut'
        });

        this.scene.time.delayedCall(500, () => {
            this.bigPillar.setPosition(startX, spawnY + 20);
            this.bigPillar.setVisible(true);
            this.bigPillar.anims.play('pillarRise');
            ScreenShake.trigger(this.scene, 150, 0.005);

            this.bigPillarX = startX;
            this.bigPillarY = spawnY;

            this.scene.tweens.add({
                targets: this.bigPillar,
                y: spawnY,
                duration: 350,
                ease: 'Back.easeOut',
                onUpdate: () => {
                    this.bigPillarY = this.bigPillar.y + 8;
                    if (this.bigPillarBody) {
                        this.scene.matter.body.setPosition(this.bigPillarBody, { x: this.bigPillarX, y: this.bigPillarY });
                    }
                }
            });

            this.bigPillarBody = this.scene.matter.add.rectangle(startX, spawnY, 20, 99, { isStatic: true, label: 'bigPillar' });

            this.scene.time.delayedCall(500, () => {
                this.slideBigPillar(targetX);
            });
        });
    }

    private slideBigPillar(targetX: number) {
        this.scene.tweens.add({
            targets: this.bigPillar,
            x: targetX,
            duration: 600,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                this.bigPillarX = this.bigPillar.x;
                if (this.bigPillarBody) {
                    this.scene.matter.body.setPosition(this.bigPillarBody, { x: this.bigPillarX, y: this.bigPillarY });
                }
            },
            onComplete: () => {
                this.retractBigPillar();
            }
        });
    }

    private retractBigPillar() {
        if (this.bigIndicator) {
            this.scene.tweens.killTweensOf(this.bigIndicator);
            this.scene.tweens.add({
                targets: this.bigIndicator,
                alpha: 0,
                duration: 500,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    if (this.bigIndicator) {
                        this.bigIndicator.destroy();
                        this.bigIndicator = undefined;
                    }
                }
            });
        }

        this.bigPillar.anims.play('pillarFall');
        this.bigPillar.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            this.scene.time.delayedCall(50, () => {
                this.bigPillar.setVisible(false);
                if (this.bigPillarBody) {
                    this.scene.matter.world.remove(this.bigPillarBody);
                    this.bigPillarBody = undefined;
                }
                this.isBigAttacking = false;
            });
        });
    }

    private checkBigCollision() {
        if (!this.bigPillar.visible || this.bigDamaged || !this.bigPillarBody || !this.player.body) {
            return;
        }

        const playerBody = this.player.body as MatterJS.BodyType;
        const collision = this.scene.matter.collision.collides(this.bigPillarBody, playerBody);

        if (collision && collision.length > 0) {
            this.bigDamaged = true;
            this.playerDamage();
        }
    }

    private executeSmallPillarsSpam() {
        this.isSmallAttacking = true;
        let groupIndex = 0;
        const maxGroups = 4;
        const groupSizes = [3, 2, 3, 2];
        const interval = 800;

        this.scene.time.addEvent({
            delay: interval,
            repeat: maxGroups - 1,
            callback: () => {
                this.spawnSmallPillarGroup(groupSizes[groupIndex]);
                groupIndex++;
                if (groupIndex >= maxGroups) {
                    this.scene.time.delayedCall(2200, () => {
                        this.isSmallAttacking = false;
                    });
                }
            }
        });
    }

    private spawnSmallPillarGroup(size: number) {
        const baseAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        for (let i = 0; i < size; i++) {
            let tx = this.player.x;
            let ty = this.player.y;
            if (i > 0) {
                const angle = baseAngle + (i * (Math.PI * 2 / size)) + Phaser.Math.FloatBetween(-0.2, 0.2);
                const dist = Phaser.Math.Between(35, 55);
                tx += Math.cos(angle) * dist;
                ty += Math.sin(angle) * dist;
            } else {
                tx += Phaser.Math.Between(-10, 10);
                ty += Phaser.Math.Between(-10, 10);
            }
            const delay = Phaser.Math.Between(0, 350);
            this.scene.time.delayedCall(delay, () => {
                this.triggerSmallPillar(tx, ty);
            });
        }
    }

    private triggerSmallPillar(x: number, y: number) {
        const indicator = this.scene.add.sprite(x, y + 10, 'small_pillar_indicator');
        indicator.setOrigin(0.5, 0.9);
        indicator.setDepth(97);
        indicator.setAlpha(0.6);

        const indicatorTween = this.scene.tweens.add({
            targets: indicator,
            alpha: 0.9,
            yoyo: true,
            repeat: -1,
            duration: 300,
            ease: 'Sine.easeInOut'
        });

        this.scene.time.delayedCall(500, () => {
            const sprite = this.scene.add.sprite(x, y + 10, 'small_pillar', 0);
            sprite.setOrigin(0.5, 0.9);
            sprite.setDepth(100);
            sprite.anims.play('smallPillarRise');

            const body = this.scene.matter.add.rectangle(x, y + 10, 6, 69, { isStatic: true, label: 'smallPillar' });
            const pillarObj = { sprite, body, indicator, damaged: false };
            this.activeSmallPillars.push(pillarObj);

            sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                this.scene.time.delayedCall(150, () => {
                    sprite.anims.play('smallPillarFall');
                    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                        if (indicator && indicator.active) {
                            indicatorTween.stop();
                            this.scene.tweens.add({
                                targets: indicator,
                                alpha: 0,
                                duration: 500,
                                ease: 'Sine.easeOut',
                                onComplete: () => {
                                    if (indicator && indicator.active) {
                                        indicator.destroy();
                                    }
                                }
                            });
                        }
                        this.scene.time.delayedCall(50, () => {
                            if (body && this.scene.matter.world) {
                                this.scene.matter.world.remove(body);
                            }
                            if (sprite && sprite.active) {
                                sprite.destroy();
                            }
                            this.activeSmallPillars = this.activeSmallPillars.filter(p => p !== pillarObj);
                        });
                    });
                });
            });
        });
    }

    private checkSmallCollisions() {
        if (!this.player.body) return;

        const playerBody = this.player.body as MatterJS.BodyType;

        for (const pillar of this.activeSmallPillars) {
            if (pillar.damaged || !pillar.body) {
                continue;
            }

            const collision = this.scene.matter.collision.collides(pillar.body, playerBody);
            if (collision && collision.length > 0) {
                pillar.damaged = true;
                this.playerDamage();
            }
        }
    }

    private executeInlinePillarAttack() {
        this.isInlineAttacking = true;
        this.activeInlinePillars = [];

        const direction = Phaser.Math.Between(0, 7);
        const count = 6;
        const spacing = 26;
        const stepDelay = 75;

        const directions = [
            { ux: 1, uy: 0 },
            { ux: -1, uy: 0 },
            { ux: 0, uy: 1 },
            { ux: 0, uy: -1 },
            { ux: 0.707, uy: 0.707 },
            { ux: -0.707, uy: -0.707 },
            { ux: 0.707, uy: -0.707 },
            { ux: -0.707, uy: 0.707 }
        ];

        const { ux, uy } = directions[direction];
        const points: { x: number; y: number }[] = [];

        for (let i = 0; i < count; i++) {
            const offset = (i - 5) * spacing;
            const px = this.player.x + offset * ux;
            const py = this.player.y + offset * uy;
            points.push({ x: px, y: py });
        }

        const pillarSprites: Phaser.GameObjects.Sprite[] = [];
        const indicators: Phaser.GameObjects.Sprite[] = [];
        const indicatorTweens: Phaser.Tweens.Tween[] = [];

        for (let i = 0; i < count; i++) {
            const p = points[i];
            const indicator = this.scene.add.sprite(p.x - 15, p.y - 10, 'inline_pillar_indicator');
            indicator.setOrigin(0.5, 0.85);
            indicator.setDepth(97);
            indicator.setAlpha(0.6);

            const tween = this.scene.tweens.add({
                targets: indicator,
                alpha: 0.9,
                yoyo: true,
                repeat: -1,
                duration: 300,
                ease: 'Sine.easeInOut'
            });
            indicators.push(indicator);
            indicatorTweens.push(tween);
        }

        this.scene.time.delayedCall(500, () => {
            for (let i = 0; i < count; i++) {
                this.scene.time.delayedCall(i * stepDelay, () => {
                    const p = points[i];
                    const sprite = this.scene.add.sprite(p.x, p.y + 26, 'inline_pillar');
                    sprite.setOrigin(0.5, 0.85);
                    sprite.setDepth(100);
                    sprite.setAlpha(0.7);
                    sprite.anims.play('inlinePillarRise');

                    this.scene.tweens.add({
                        targets: sprite,
                        y: p.y + 10,
                        alpha: 1,
                        duration: 250,
                        ease: 'Back.easeOut'
                    });

                    const body = this.scene.matter.add.rectangle(p.x, p.y + 10, 20, 35, { isStatic: true, label: 'inlinePillar' });

                    pillarSprites.push(sprite);
                    const pillarObj = { sprite, body, indicator: indicators[i], damaged: false };
                    this.activeInlinePillars.push(pillarObj);

                    if (i === count - 1) {
                        sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                            this.scene.time.delayedCall(300, () => {
                                this.retractInlineWave(pillarSprites, indicators, indicatorTweens);
                            });
                        });
                    }
                });
            }
        });
    }

    private retractInlineWave(sprites: Phaser.GameObjects.Sprite[], indicators: Phaser.GameObjects.Sprite[], indicatorTweens: Phaser.Tweens.Tween[]) {
        const stepDelay = 75;
        for (let i = 0; i < sprites.length; i++) {
            this.scene.time.delayedCall(i * stepDelay, () => {
                const sprite = sprites[i];
                if (sprite && sprite.active) {
                    sprite.anims.play('inlinePillarFall');
                    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                        if (indicators[i] && indicators[i].active) {
                            if (indicatorTweens[i]) {
                                indicatorTweens[i].stop();
                            }
                            this.scene.tweens.add({
                                targets: indicators[i],
                                alpha: 0,
                                duration: 500,
                                ease: 'Sine.easeOut',
                                onComplete: () => {
                                    if (indicators[i] && indicators[i].active) {
                                        indicators[i].destroy();
                                    }
                                }
                            });
                        }
                        this.scene.time.delayedCall(50, () => {
                            const activeObj = this.activeInlinePillars.find(p => p.sprite === sprite);
                            if (activeObj && activeObj.body && this.scene.matter.world) {
                                this.scene.matter.world.remove(activeObj.body);
                            }
                            this.activeInlinePillars = this.activeInlinePillars.filter(p => p.sprite !== sprite);
                            if (sprite && sprite.active) {
                                sprite.destroy();
                            }
                            if (i === sprites.length - 1) {
                                this.isInlineAttacking = false;
                            }
                        });
                    });
                }
            });
        }
    }

    private checkInlineCollisions() {
        if (!this.player.body) return;

        const playerBody = this.player.body as MatterJS.BodyType;

        for (const pillar of this.activeInlinePillars) {
            if (pillar.damaged || !pillar.body) {
                continue;
            }

            const collision = this.scene.matter.collision.collides(pillar.body, playerBody);
            if (collision && collision.length > 0) {
                pillar.damaged = true;
                this.playerDamage();
            }
        }
    }

    private executeSpikesAttack() {
        this.isSpikesAttacking = true;

        const baseAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const radius = 160;
        const totalGroups = 7;
        const groupSizes = [4, 3, 4, 3, 4, 3, 4];
        const groupWaveDelay = 200;

        const sweepDirection = Phaser.Math.Between(0, 1);
        let completedCount = 0;
        const totalSpikes = groupSizes.reduce((a, b) => a + b, 0);

        for (let g = 0; g < totalGroups; g++) {
            const actualGroupIndex = sweepDirection === 0 ? g : (totalGroups - 1 - g);
            const t = (actualGroupIndex / (totalGroups - 1)) - 0.5;
            const arcAngle = baseAngle + Math.PI + t * 3.0 + Phaser.Math.FloatBetween(-0.15, 0.15);
            const groupRadius = radius + Phaser.Math.Between(-40, 40);

            const gx = this.player.x + Math.cos(arcAngle) * groupRadius;
            const gy = this.player.y + Math.sin(arcAngle) * groupRadius;

            const size = groupSizes[actualGroupIndex];

            this.scene.time.delayedCall(g * groupWaveDelay, () => {
                for (let j = 0; j < size; j++) {
                    const offsetIndex = j - (size - 1) / 2;
                    const perpAngle = arcAngle + Math.PI / 2;
                    const px = gx + Math.cos(perpAngle) * offsetIndex * 30 + Phaser.Math.Between(-5, 5);
                    const py = gy + Math.sin(perpAngle) * offsetIndex * 30 + Phaser.Math.Between(-5, 5);

                    const flipX = Phaser.Math.Between(0, 1) === 0;

                    const indicator = this.scene.add.sprite(px, py + 10, 'spikes_indicator');
                    indicator.setOrigin(0.5, 0.85);
                    indicator.setDepth(97);
                    indicator.setAlpha(0.6);
                    indicator.setFlipX(flipX);

                    const indicatorTween = this.scene.tweens.add({
                        targets: indicator,
                        alpha: 0.9,
                        yoyo: true,
                        repeat: -1,
                        duration: 300,
                        ease: 'Sine.easeInOut'
                    });

                    const staggerDelay = Phaser.Math.Between(0, 120);

                    this.scene.time.delayedCall(staggerDelay, () => {
                        this.scene.time.delayedCall(500, () => {
                            const sprite = this.scene.add.sprite(px, py + 10, 'spikes', 0);
                            sprite.setOrigin(0.5, 0.85);
                            sprite.setDepth(99);
                            sprite.setFlipX(flipX);
                            sprite.anims.play('spikesRise');

                            const body = this.scene.matter.add.rectangle(px, py + 10, 8, 32, { isStatic: true, label: 'spikes' });
                            const spikeObj = { sprite, body, indicator, damaged: false };
                            this.activeSpikes.push(spikeObj);

                            this.scene.time.delayedCall(6000, () => {
                                if (body && this.scene.matter.world) {
                                    this.scene.matter.world.remove(body);
                                }
                                if (sprite && sprite.active) {
                                    sprite.anims.play('spikesFall');
                                    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                                        if (indicator && indicator.active) {
                                            indicatorTween.stop();
                                            this.scene.tweens.add({
                                                targets: indicator,
                                                alpha: 0,
                                                duration: 500,
                                                ease: 'Sine.easeOut',
                                                onComplete: () => {
                                                    if (indicator && indicator.active) {
                                                        indicator.destroy();
                                                    }
                                                }
                                            });
                                        }
                                        this.scene.time.delayedCall(50, () => {
                                            this.activeSpikes = this.activeSpikes.filter(s => s !== spikeObj);
                                            if (sprite && sprite.active) {
                                                sprite.destroy();
                                            }
                                            completedCount++;
                                            if (completedCount === totalSpikes) {
                                                this.isSpikesAttacking = false;
                                            }
                                        });
                                    });
                                } else {
                                    completedCount++;
                                    if (completedCount === totalSpikes) {
                                        this.isSpikesAttacking = false;
                                    }
                                }
                            });
                        });
                    });
                }
            });
        }
    }

    private checkSpikesCollisions() {
        if (!this.player.body) return;

        const playerBody = this.player.body as MatterJS.BodyType;

        for (const spike of this.activeSpikes) {
            if (spike.damaged || !spike.body) {
                continue;
            }

            const collision = this.scene.matter.collision.collides(spike.body, playerBody);
            if (collision && collision.length > 0) {
                spike.damaged = true;
                this.playerDamage();
            }
        }
    }

    private playerDamage() {
        this.player.setTint(0xff0000);
        this.scene.time.delayedCall(150, () => {
            this.player.clearTint();
        });
    }
}