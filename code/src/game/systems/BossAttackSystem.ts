import * as Phaser from 'phaser';
import { ScreenShake } from '../utils/ScreenShake';
import { PlayerData } from '../data/PlayerData';

const INDICATOR_DEPTH = 7;
const ATTACK_DEPTH = 8;
const ATTACK_DISSOLVE_MS = 280;

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
    private bigPillarPushDirectionX: number = 0;
    private activeSmallPillars: { sprite: Phaser.GameObjects.Sprite; body: MatterJS.BodyType; indicator?: Phaser.GameObjects.Sprite; damaged: boolean }[] = [];
    private isSmallAttacking: boolean = false;
    private activeInlinePillars: { sprite: Phaser.GameObjects.Sprite; body: MatterJS.BodyType; indicator?: Phaser.GameObjects.Sprite; damaged: boolean }[] = [];
    private isInlineAttacking: boolean = false;
    private activeSpikes: { sprite: Phaser.GameObjects.Sprite; body: MatterJS.BodyType; indicator?: Phaser.GameObjects.Sprite; damaged: boolean }[] = [];
    private isSpikesAttacking: boolean = false;
    private attackSpeedMultiplier: number = 1;
    private baseCooldowns = {
        bigPillar: 5000,
        smallPillars: 4000,
        inlinePillar: 4500,
        spikes: 5500
    };
    private nextAttackTimer?: Phaser.Time.TimerEvent;
    private scheduledTimers: Phaser.Time.TimerEvent[] = [];
    private isStopped: boolean = true;
    private isPaused: boolean = false;
    private pillarsActivated: number = 0;
    private isInvulnerable: boolean = false;

    private canRunAttacks(): boolean {
        if (this.isStopped || this.isPaused) return false;
        return this.scene?.sys?.isActive() === true;
    }

    private scheduleAttackCallback(delay: number, fn: () => void): Phaser.Time.TimerEvent {
        const timer = this.scene.time.delayedCall(delay, () => {
            if (!this.canRunAttacks()) return;
            fn();
        });
        this.scheduledTimers.push(timer);
        return timer;
    }

    private clearScheduledTimers(): void {
        for (const timer of this.scheduledTimers) {
            timer.remove(false);
        }
        this.scheduledTimers = [];
    }

    private getSpriteAnims(sprite: Phaser.GameObjects.Sprite | undefined): Phaser.Animations.AnimationState | null {
        if (!sprite?.active || !sprite.anims) return null;
        return sprite.anims;
    }

    private destroySmallPillarEntry(
        pillarObj: { sprite: Phaser.GameObjects.Sprite; body: MatterJS.BodyType; indicator?: Phaser.GameObjects.Sprite; damaged: boolean },
        indicatorTween?: Phaser.Tweens.Tween
    ): void {
        if (indicatorTween) indicatorTween.stop();
        if (pillarObj.body && this.scene.matter?.world) {
            this.scene.matter.world.remove(pillarObj.body);
        }
        if (pillarObj.indicator?.active) pillarObj.indicator.destroy();
        if (pillarObj.sprite?.active) pillarObj.sprite.destroy();
        this.activeSmallPillars = this.activeSmallPillars.filter(p => p !== pillarObj);
    }

    constructor(scene: Phaser.Scene, player: Phaser.Physics.Matter.Sprite) {
        this.scene = scene;
        this.player = player;
        this.createAnimations();
        this.bigPillar = this.scene.add.sprite(0, 0, 'pillar');
        this.bigPillar.setVisible(false);
        this.bigPillar.setDepth(ATTACK_DEPTH);
    }

    private createAnimations(): void {
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
                frames: this.scene.anims.generateFrameNumbers('small_pillar', { start: 0, end: 17 }),
                frameRate: 60,
                repeat: 0
            });
        }

        if (!this.scene.anims.exists('smallPillarFall')) {
            this.scene.anims.create({
                key: 'smallPillarFall',
                frames: this.scene.anims.generateFrameNumbers('small_pillar', { start: 17, end: 0 }),
                frameRate: 30,
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

        if (!this.scene.anims.exists('tentaclesRetract') && this.scene.textures.exists('tentacles')) {
            const totalFrames = this.scene.textures.get('tentacles').getFrameNames().length;
            this.scene.anims.create({
                key: 'tentaclesRetract',
                frames: this.scene.anims.generateFrameNumbers('tentacles', { start: totalFrames - 6, end: 0 }),
                frameRate: 20,
                repeat: 0
            });
        }
    }

    setAttackSpeedMultiplier(multiplier: number): void {
        this.attackSpeedMultiplier = multiplier;
        if (!this.isStopped) {
            if (this.nextAttackTimer) {
                this.nextAttackTimer.remove();
            }
            this.scheduleNextAttack();
        }
    }

    setPillarsActivated(count: number): void {
        this.pillarsActivated = count;
    }

    setInvulnerable(duration: number): void {
        this.isInvulnerable = true;
        this.scene.tweens.add({
            targets: this.player,
            alpha: 0.3,
            yoyo: true,
            repeat: Math.floor(duration / 150),
            duration: 150,
            onComplete: () => {
                this.isInvulnerable = false;
                this.player.setAlpha(1);
            }
        });
    }

    setAttacksPaused(paused: boolean): void {
        if (this.isStopped) return;

        if (paused) {
            if (this.isPaused) return;
            this.isPaused = true;
            if (this.nextAttackTimer) {
                this.nextAttackTimer.remove(false);
                this.nextAttackTimer = undefined;
            }
            this.clearScheduledTimers();
            this.dissolveActiveAttacks();
            return;
        }

        if (!this.isPaused) return;
        this.isPaused = false;
        this.scheduleNextAttack();
    }

    private fadeOutTargets(
        targets: Phaser.GameObjects.GameObject[],
        onComplete?: () => void
    ): void {
        const active = targets.filter(t => t?.active);
        if (active.length === 0) {
            onComplete?.();
            return;
        }

        for (const target of active) {
            this.scene.tweens.killTweensOf(target);
        }

        this.scene.tweens.add({
            targets: active,
            alpha: 0,
            duration: ATTACK_DISSOLVE_MS,
            ease: 'Sine.easeIn',
            onComplete: () => {
                for (const target of active) {
                    if (target.active) target.destroy();
                }
                onComplete?.();
            }
        });
    }

    private dissolveActiveAttacks(): void {
        if (this.bigIndicator?.active) {
            const indicator = this.bigIndicator;
            this.bigIndicator = undefined;
            this.fadeOutTargets([indicator]);
        }

        if (this.bigPillarBody && this.scene.matter?.world) {
            this.scene.matter.world.remove(this.bigPillarBody);
            this.bigPillarBody = undefined;
        }

        if (this.bigPillar?.active && (this.isBigAttacking || this.bigPillar.visible)) {
            this.scene.tweens.killTweensOf(this.bigPillar);
            this.getSpriteAnims(this.bigPillar)?.stop();
            this.bigPillar.removeAllListeners(Phaser.Animations.Events.ANIMATION_COMPLETE);
            const pillar = this.bigPillar;
            this.scene.tweens.add({
                targets: pillar,
                alpha: 0,
                duration: ATTACK_DISSOLVE_MS,
                ease: 'Sine.easeIn',
                onComplete: () => {
                    pillar.setVisible(false);
                    pillar.setAlpha(1);
                }
            });
        }
        this.isBigAttacking = false;
        this.bigDamaged = false;

        for (const entry of [...this.activeSmallPillars]) {
            if (entry.body && this.scene.matter?.world) {
                this.scene.matter.world.remove(entry.body);
            }
            if (entry.sprite?.active) {
                this.scene.tweens.killTweensOf(entry.sprite);
                entry.sprite.removeAllListeners(Phaser.Animations.Events.ANIMATION_COMPLETE);
            }
            if (entry.indicator?.active) {
                this.scene.tweens.killTweensOf(entry.indicator);
            }
            this.fadeOutTargets(
                [entry.sprite, entry.indicator].filter(s => s?.active) as Phaser.GameObjects.GameObject[]
            );
        }
        this.activeSmallPillars = [];
        this.isSmallAttacking = false;

        for (const entry of [...this.activeInlinePillars]) {
            if (entry.body && this.scene.matter?.world) {
                this.scene.matter.world.remove(entry.body);
            }
            if (entry.sprite?.active) {
                this.scene.tweens.killTweensOf(entry.sprite);
                entry.sprite.removeAllListeners(Phaser.Animations.Events.ANIMATION_COMPLETE);
            }
            if (entry.indicator?.active) {
                this.scene.tweens.killTweensOf(entry.indicator);
            }
            this.fadeOutTargets(
                [entry.sprite, entry.indicator].filter(s => s?.active) as Phaser.GameObjects.GameObject[]
            );
        }
        this.activeInlinePillars = [];
        this.isInlineAttacking = false;

        for (const entry of [...this.activeSpikes]) {
            if (entry.body && this.scene.matter?.world) {
                this.scene.matter.world.remove(entry.body);
            }
            if (entry.sprite?.active) {
                this.scene.tweens.killTweensOf(entry.sprite);
                entry.sprite.removeAllListeners(Phaser.Animations.Events.ANIMATION_COMPLETE);
            }
            if (entry.indicator?.active) {
                this.scene.tweens.killTweensOf(entry.indicator);
            }
            this.fadeOutTargets(
                [entry.sprite, entry.indicator].filter(s => s?.active) as Phaser.GameObjects.GameObject[]
            );
        }
        this.activeSpikes = [];
        this.isSpikesAttacking = false;
    }

    startAttacks(): void {
        if (!this.isStopped) return;
        console.log('[SummitBoss] Attack system armed');
        this.isStopped = false;
        this.startAttackCycle();
    }

    stopAttacks(): void {
        if (this.isStopped) return;
        console.log('[SummitBoss] Attack system disarmed (hard stop)');
        this.isStopped = true;
        this.isPaused = false;
        if (this.nextAttackTimer) {
            this.nextAttackTimer.remove(false);
            this.nextAttackTimer = undefined;
        }
        this.clearScheduledTimers();

        this.cleanupBigAttack();
        this.cleanupSmallAttacks();
        this.cleanupInlineAttacks();
        this.cleanupSpikesAttacks();
    }

    private cleanupBigAttack(): void {
        if (this.bigIndicator) {
            this.bigIndicator.destroy();
            this.bigIndicator = undefined;
        }
        if (this.bigPillarBody) {
            this.scene.matter.world.remove(this.bigPillarBody);
            this.bigPillarBody = undefined;
        }
        this.bigPillar.setVisible(false);
        this.isBigAttacking = false;
    }

    private cleanupSmallAttacks(): void {
        for (const pillar of [...this.activeSmallPillars]) {
            this.destroySmallPillarEntry(pillar);
        }
        this.isSmallAttacking = false;
    }

    private cleanupInlineAttacks(): void {
        for (const pillar of this.activeInlinePillars) {
            if (pillar.body) this.scene.matter.world.remove(pillar.body);
            if (pillar.sprite) pillar.sprite.destroy();
            if (pillar.indicator) pillar.indicator.destroy();
        }
        this.activeInlinePillars = [];
        this.isInlineAttacking = false;
    }

    private cleanupSpikesAttacks(): void {
        for (const spike of this.activeSpikes) {
            if (spike.body) this.scene.matter.world.remove(spike.body);
            if (spike.sprite) spike.sprite.destroy();
            if (spike.indicator) spike.indicator.destroy();
        }
        this.activeSpikes = [];
        this.isSpikesAttacking = false;
    }

    private startAttackCycle(): void {
        if (this.isStopped) return;
        this.scheduleNextAttack();
    }

    private getPhaseCooldownMultiplier(): number {
        if (this.pillarsActivated <= 0) return 0.5;
        if (this.pillarsActivated <= 1) return 0.65;
        if (this.pillarsActivated <= 2) return 0.8;
        return 1;
    }

    private scheduleNextAttack(): void {
        if (this.isStopped || this.isPaused) return;
        if (!this.scene || !this.player || !this.player.active) return;

        const attacks = ['big', 'small', 'inline', 'spikes'];
        const randomAttack = attacks[Math.floor(Math.random() * attacks.length)];
        let cooldown = 0;

        const phaseMul = this.getPhaseCooldownMultiplier();
        switch (randomAttack) {
            case 'big': cooldown = this.baseCooldowns.bigPillar / this.attackSpeedMultiplier; break;
            case 'small': cooldown = this.baseCooldowns.smallPillars / this.attackSpeedMultiplier; break;
            case 'inline': cooldown = this.baseCooldowns.inlinePillar / this.attackSpeedMultiplier; break;
            case 'spikes': cooldown = this.baseCooldowns.spikes / this.attackSpeedMultiplier; break;
        }

        cooldown = Math.max(300, cooldown * phaseMul);

        this.nextAttackTimer = this.scheduleAttackCallback(cooldown, () => {
            if (!this.canRunAttacks()) return;
            if (this.scene && this.player && this.player.active) {
                this.executeAttack(randomAttack);

                const comboChance = this.pillarsActivated <= 1 ? 0.65 : 0.75;
                if (this.pillarsActivated >= 1 && Math.random() < comboChance) {
                    const remaining = attacks.filter(a => a !== randomAttack);
                    const secondAttack = remaining[Math.floor(Math.random() * remaining.length)];
                    this.scheduleAttackCallback(200, () => {
                        if (this.canRunAttacks()) {
                            this.executeAttack(secondAttack);
                        }
                    });
                    const tripleChance = this.pillarsActivated <= 1 ? 0.35 : 0.5;
                    if (this.pillarsActivated >= 2 && Math.random() < tripleChance) {
                        const thirdAttack = remaining.filter(a => a !== secondAttack)[Math.floor(Math.random() * (remaining.length - 1))];
                        this.scheduleAttackCallback(400, () => {
                            if (this.canRunAttacks()) {
                                this.executeAttack(thirdAttack);
                            }
                        });
                    }
                }
                this.scheduleNextAttack();
            }
        });
    }

    private executeAttack(attackType: string): void {
        if (!this.canRunAttacks()) return;
        switch (attackType) {
            case 'big':
                if (!this.isBigAttacking) this.executeBigPillarAttack();
                break;
            case 'small':
                if (!this.isSmallAttacking) this.executeSmallPillarsSpam();
                break;
            case 'inline':
                if (!this.isInlineAttacking) this.executeInlinePillarAttack();
                break;
            case 'spikes':
                if (!this.isSpikesAttacking) this.executeSpikesAttack();
                break;
        }
    }

    update() {
        if (!this.canRunAttacks()) return;
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
        this.bigPillarPushDirectionX = targetX > startX ? 1 : -1;

        this.bigIndicator = this.scene.add.sprite(spawnX, spawnY, 'big_pillar_indicator');
        this.bigIndicator.setOrigin(0.5, 0.5);
        this.bigIndicator.setDepth(INDICATOR_DEPTH);
        this.bigIndicator.setAlpha(0.6);

        this.scene.tweens.add({
            targets: this.bigIndicator,
            alpha: 0.9,
            yoyo: true,
            repeat: -1,
            duration: 300 / this.attackSpeedMultiplier,
            ease: 'Sine.easeInOut'
        });

        const delay = 500 / this.attackSpeedMultiplier;
        this.scheduleAttackCallback(delay, () => {
            if (!this.canRunAttacks()) return;
            this.bigPillar.setPosition(startX, spawnY);
            this.bigPillar.setVisible(true);
            this.bigPillar.setDepth(ATTACK_DEPTH);
            this.bigPillar.anims.play('pillarRise');
            ScreenShake.trigger(this.scene, 150, 0.005);

            this.bigPillarX = startX;
            this.bigPillarY = spawnY;

            this.scene.tweens.add({
                targets: this.bigPillar,
                y: spawnY,
                duration: 350 / this.attackSpeedMultiplier,
                ease: 'Back.easeOut',
                onUpdate: () => {
                    this.bigPillarY = this.bigPillar.y + 8;
                    if (this.bigPillarBody) {
                        this.scene.matter.body.setPosition(this.bigPillarBody, { x: this.bigPillarX, y: this.bigPillarY });
                    }
                }
            });

            this.bigPillarBody = this.scene.matter.add.rectangle(startX, spawnY, 20, 99, { isStatic: true, label: 'bigPillar' });

            const slideDelay = 500 / this.attackSpeedMultiplier;
            this.scheduleAttackCallback(slideDelay, () => {
                if (this.canRunAttacks()) this.slideBigPillar(targetX);
            });
        });
    }

    private slideBigPillar(targetX: number) {
        this.scene.tweens.add({
            targets: this.bigPillar,
            x: targetX,
            duration: 600 / this.attackSpeedMultiplier,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                this.bigPillarX = this.bigPillar.x;
                if (this.bigPillarBody) {
                    this.scene.matter.body.setPosition(this.bigPillarBody, { x: this.bigPillarX, y: this.bigPillarY });
                }
            },
            onComplete: () => {
                if (this.canRunAttacks()) this.retractBigPillar();
                else this.dissolveActiveAttacks();
            }
        });
    }

    private retractBigPillar() {
        if (this.bigIndicator) {
            this.scene.tweens.killTweensOf(this.bigIndicator);
            this.scene.tweens.add({
                targets: this.bigIndicator,
                alpha: 0,
                duration: 500 / this.attackSpeedMultiplier,
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
            this.scheduleAttackCallback(50, () => {
                this.bigPillar.setVisible(false);
                if (this.bigPillarBody) {
                    this.scene.matter.world.remove(this.bigPillarBody);
                    this.bigPillarBody = undefined;
                }
                this.isBigAttacking = false;
            });
        });
    }

    private checkCollision(bodyA: MatterJS.BodyType, bodyB: MatterJS.BodyType): boolean {
        if (!bodyA || !bodyB) return false;
        const bA = bodyA.bounds;
        const bB = bodyB.bounds;
        if (!bA || !bB) return false;
        return !(bA.max.x < bB.min.x || bA.min.x > bB.max.x ||
                 bA.max.y < bB.min.y || bA.min.y > bB.max.y);
    }

    private checkBigCollision() {
        if (!this.bigPillar.visible || this.bigDamaged || !this.bigPillarBody || !this.player.body) {
            return;
        }

        const playerBody = this.player.body as MatterJS.BodyType;
        if (this.checkCollision(this.bigPillarBody, playerBody)) {
            this.bigDamaged = true;
            this.playerDamage(15);

            if (this.scene && typeof (this.scene as any).pushPlayer === 'function') {
                (this.scene as any).pushPlayer(this.bigPillarPushDirectionX * 8, 0, 400);
            }
        }
    }

    private executeSmallPillarsSpam() {
        this.isSmallAttacking = true;
        const maxGroups = Math.min(8, 5 + Math.floor(this.attackSpeedMultiplier) + (this.pillarsActivated <= 1 ? 2 : 0));
        const groupSizes = [3, 2, 3, 2, 3, 2, 3, 2];
        const interval = Math.max(280, 650 / this.attackSpeedMultiplier);

        let groupsExecuted = 0;
        const executeGroup = () => {
            if (!this.canRunAttacks() || groupsExecuted >= maxGroups) {
                this.scheduleAttackCallback(2200 / this.attackSpeedMultiplier, () => {
                    this.isSmallAttacking = false;
                });
                return;
            }

            this.spawnSmallPillarGroup(groupSizes[groupsExecuted % groupSizes.length]);
            groupsExecuted++;

            this.scheduleAttackCallback(interval, () => executeGroup());
        };

        executeGroup();
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
            const delay = Phaser.Math.Between(0, 350 / this.attackSpeedMultiplier);
            this.scheduleAttackCallback(delay, () => {
                if (this.canRunAttacks()) this.triggerSmallPillar(tx, ty);
            });
        }
    }

    private triggerSmallPillar(x: number, y: number) {
        const indicator = this.scene.add.sprite(x, y, 'small_pillar_indicator');
        indicator.setOrigin(0.5, 0.5);
        indicator.setDepth(INDICATOR_DEPTH);
        indicator.setAlpha(0.6);

        const indicatorTween = this.scene.tweens.add({
            targets: indicator,
            alpha: 0.9,
            yoyo: true,
            repeat: -1,
            duration: 300 / this.attackSpeedMultiplier,
            ease: 'Sine.easeInOut'
        });

        const delay = 500 / this.attackSpeedMultiplier;
        this.scheduleAttackCallback(delay, () => {
            if (!this.canRunAttacks()) {
                indicatorTween.stop();
                if (indicator.active) indicator.destroy();
                return;
            }
            const sprite = this.scene.add.sprite(x, y - 26, 'small_pillar', 0);
            sprite.setOrigin(0.5, 0.5);
            sprite.setDepth(ATTACK_DEPTH);

            const body = this.scene.matter.add.rectangle(x - 8, y - 28, 6, 58, { isStatic: true, label: 'smallPillar' });
            const pillarObj = { sprite, body, indicator, damaged: false };
            this.activeSmallPillars.push(pillarObj);

            const riseAnims = this.getSpriteAnims(sprite);
            if (!riseAnims) {
                this.destroySmallPillarEntry(pillarObj, indicatorTween);
                return;
            }
            riseAnims.play('smallPillarRise');
            riseAnims.pause();
            sprite.setFrame(0);

            this.scheduleAttackCallback(100 / this.attackSpeedMultiplier, () => {
                if (!this.getSpriteAnims(sprite)) return;
                sprite.setFrame(1);
            });

            this.scheduleAttackCallback(200 / this.attackSpeedMultiplier, () => {
                const anims = this.getSpriteAnims(sprite);
                if (!anims) return;
                sprite.setFrame(2);
                anims.resume();
                anims.msPerFrame = 1000 / (120 * this.attackSpeedMultiplier);
            });

            sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                if (!this.canRunAttacks()) {
                    this.destroySmallPillarEntry(pillarObj, indicatorTween);
                    return;
                }
                this.scheduleAttackCallback(500 / this.attackSpeedMultiplier, () => {
                    if (!this.canRunAttacks()) {
                        this.destroySmallPillarEntry(pillarObj, indicatorTween);
                        return;
                    }
                    const fallAnims = this.getSpriteAnims(sprite);
                    if (!fallAnims) {
                        this.destroySmallPillarEntry(pillarObj, indicatorTween);
                        return;
                    }
                    fallAnims.play('smallPillarFall');
                    fallAnims.msPerFrame = 1000 / (30 * this.attackSpeedMultiplier);
                    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                        if (!this.canRunAttacks()) {
                            this.destroySmallPillarEntry(pillarObj, indicatorTween);
                            return;
                        }
                        if (indicator.active) {
                            indicatorTween.stop();
                            this.scene.tweens.add({
                                targets: indicator,
                                alpha: 0,
                                duration: 500 / this.attackSpeedMultiplier,
                                ease: 'Sine.easeOut',
                                onComplete: () => {
                                    if (indicator.active) indicator.destroy();
                                }
                            });
                        }
                        this.scheduleAttackCallback(50, () => {
                            this.destroySmallPillarEntry(pillarObj);
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

            if (this.checkCollision(pillar.body, playerBody)) {
                pillar.damaged = true;
                this.playerDamage(6);
            }
        }
    }

    private executeInlinePillarAttack() {
        this.isInlineAttacking = true;
        this.activeInlinePillars = [];

        const direction = Phaser.Math.Between(0, 7);
        const count = Math.min(10, 7 + Math.floor(this.attackSpeedMultiplier / 2) + (this.pillarsActivated <= 1 ? 2 : 0));
        const spacing = 26;
        const stepDelay = Math.max(40, 75 / this.attackSpeedMultiplier);

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
            const offset = (i - (count - 1) / 2) * spacing;
            const px = this.player.x + offset * ux;
            const py = this.player.y + offset * uy;
            points.push({ x: px, y: py });
        }

        const pillarSprites: Phaser.GameObjects.Sprite[] = [];
        const indicators: Phaser.GameObjects.Sprite[] = [];
        const indicatorTweens: Phaser.Tweens.Tween[] = [];

        for (let i = 0; i < count; i++) {
            const p = points[i];
            const indicator = this.scene.add.sprite(p.x, p.y, 'inline_pillar_indicator');
            indicator.setOrigin(0.5, 0.5);
            indicator.setDepth(INDICATOR_DEPTH);
            indicator.setAlpha(0.6);

            const tween = this.scene.tweens.add({
                targets: indicator,
                alpha: 0.9,
                yoyo: true,
                repeat: -1,
                duration: 300 / this.attackSpeedMultiplier,
                ease: 'Sine.easeInOut'
            });
            indicators.push(indicator);
            indicatorTweens.push(tween);
        }

        const delay = 500 / this.attackSpeedMultiplier;
        this.scheduleAttackCallback(delay, () => {
            if (!this.canRunAttacks()) {
                indicators.forEach(i => i.destroy());
                return;
            }
            for (let i = 0; i < count; i++) {
                this.scheduleAttackCallback(i * stepDelay, () => {
                    if (!this.canRunAttacks()) return;
                    const p = points[i];
                    const sprite = this.scene.add.sprite(p.x, p.y, 'inline_pillar');
                    sprite.setOrigin(0.5, 0.5);
                    sprite.setDepth(ATTACK_DEPTH);
                    sprite.setAlpha(0.7);
                    sprite.anims.play('inlinePillarRise');

                    this.scene.tweens.add({
                        targets: sprite,
                        y: p.y,
                        alpha: 1,
                        duration: 250 / this.attackSpeedMultiplier,
                        ease: 'Back.easeOut'
                    });

                    const body = this.scene.matter.add.rectangle(p.x, p.y, 20, 35, { isStatic: true, label: 'inlinePillar' });

                    pillarSprites.push(sprite);
                    const pillarObj = { sprite, body, indicator: indicators[i], damaged: false };
                    this.activeInlinePillars.push(pillarObj);

                    if (i === count - 1) {
                        sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                            this.scheduleAttackCallback(300 / this.attackSpeedMultiplier, () => {
                                if (this.canRunAttacks()) this.retractInlineWave(pillarSprites, indicators, indicatorTweens);
                                else this.dissolveActiveAttacks();
                            });
                        });
                    }
                });
            }
        });
    }

    private retractInlineWave(sprites: Phaser.GameObjects.Sprite[], indicators: Phaser.GameObjects.Sprite[], indicatorTweens: Phaser.Tweens.Tween[]) {
        const stepDelay = Math.max(40, 75 / this.attackSpeedMultiplier);
        for (let i = 0; i < sprites.length; i++) {
            this.scheduleAttackCallback(i * stepDelay, () => {
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
                                duration: 500 / this.attackSpeedMultiplier,
                                ease: 'Sine.easeOut',
                                onComplete: () => {
                                    if (indicators[i] && indicators[i].active) {
                                        indicators[i].destroy();
                                    }
                                }
                            });
                        }
                        this.scheduleAttackCallback(50, () => {
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

            if (this.checkCollision(pillar.body, playerBody)) {
                pillar.damaged = true;
                this.playerDamage(8);
            }
        }
    }

    private executeSpikesAttack() {
        this.isSpikesAttacking = true;

        const baseAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const radius = 160;
        let totalGroups = Math.min(11, 8 + Math.floor(this.attackSpeedMultiplier / 1.5) + (this.pillarsActivated <= 1 ? 2 : 0));
        const groupSizesBase = [4, 3, 4, 3, 4, 3, 4, 3, 4];
        const groupWaveDelay = Math.max(100, 200 / this.attackSpeedMultiplier);

        const sweepDirection = Phaser.Math.Between(0, 1);
        let completedCount = 0;
        const totalSpikes = groupSizesBase.slice(0, totalGroups).reduce((a, b) => a + b, 0);

        for (let g = 0; g < totalGroups; g++) {
            const actualGroupIndex = sweepDirection === 0 ? g : (totalGroups - 1 - g);
            const t = (actualGroupIndex / (totalGroups - 1)) - 0.5;
            const arcAngle = baseAngle + Math.PI + t * 3.0 + Phaser.Math.FloatBetween(-0.15, 0.15);
            const groupRadius = radius + Phaser.Math.Between(-40, 40);

            const gx = this.player.x + Math.cos(arcAngle) * groupRadius;
            const gy = this.player.y + Math.sin(arcAngle) * groupRadius;

            const size = groupSizesBase[actualGroupIndex % groupSizesBase.length];

            this.scheduleAttackCallback(g * groupWaveDelay, () => {
                if (!this.canRunAttacks()) return;
                for (let j = 0; j < size; j++) {
                    const offsetIndex = j - (size - 1) / 2;
                    const perpAngle = arcAngle + Math.PI / 2;
                    const px = gx + Math.cos(perpAngle) * offsetIndex * 30 + Phaser.Math.Between(-5, 5);
                    const py = gy + Math.sin(perpAngle) * offsetIndex * 30 + Phaser.Math.Between(-5, 5);

                    const flipX = Phaser.Math.Between(0, 1) === 0;

                    const indicator = this.scene.add.sprite(px, py, 'spikes_indicator');
                    indicator.setOrigin(0.5, 0.5);
                    indicator.setDepth(INDICATOR_DEPTH);
                    indicator.setAlpha(0.6);
                    indicator.setFlipX(flipX);

                    const indicatorTween = this.scene.tweens.add({
                        targets: indicator,
                        alpha: 0.9,
                        yoyo: true,
                        repeat: -1,
                        duration: 300 / this.attackSpeedMultiplier,
                        ease: 'Sine.easeInOut'
                    });

                    const staggerDelay = Phaser.Math.Between(0, 120 / this.attackSpeedMultiplier);

                    this.scheduleAttackCallback(staggerDelay, () => {
                        const delay = 500 / this.attackSpeedMultiplier;
                        this.scheduleAttackCallback(delay, () => {
                            if (!this.canRunAttacks()) {
                                indicator.destroy();
                                return;
                            }
                            const sprite = this.scene.add.sprite(px, py - 12, 'spikes', 0);
                            sprite.setOrigin(0.5, 0.5);
                            sprite.setDepth(ATTACK_DEPTH);
                            sprite.setFlipX(flipX);
                            sprite.anims.play('spikesRise');

                            const collisionX = flipX ? px - 3 : px + 3;
                            const collisionY = py - 5;
                            const body = this.scene.matter.add.rectangle(collisionX, collisionY, 8, 32, { isStatic: true, label: 'spikes' });

                            const spikeObj = { sprite, body, indicator, damaged: false };
                            this.activeSpikes.push(spikeObj);

                            const duration = 6000 / this.attackSpeedMultiplier;
                            this.scheduleAttackCallback(duration, () => {
                                if (!this.canRunAttacks()) return;
                                this.scene.tweens.add({
                                    targets: sprite,
                                    x: sprite.x + (flipX ? -1 : 1),
                                    y: sprite.y + (flipX ? -1 : 1),
                                    yoyo: true,
                                    repeat: 1,
                                    duration: 30 / this.attackSpeedMultiplier,
                                    onComplete: () => {
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
                                                        duration: 500 / this.attackSpeedMultiplier,
                                                        ease: 'Sine.easeOut',
                                                        onComplete: () => {
                                                            if (indicator && indicator.active) {
                                                                indicator.destroy();
                                                            }
                                                        }
                                                    });
                                                }
                                                this.scheduleAttackCallback(50, () => {
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
                                    }
                                });
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

            if (this.checkCollision(spike.body, playerBody)) {
                spike.damaged = true;
                this.playerDamage(10);
            }
        }
    }

    private playerDamage(amount: number) {
        if (this.isInvulnerable || !this.canRunAttacks()) return;
        if (!this.player?.active) return;
        PlayerData.getInstance().takeDamage(amount);
        this.player.setTint(0xff0000);
        this.scheduleAttackCallback(150, () => {
            if (this.player?.active) this.player.clearTint();
        });
    }
}