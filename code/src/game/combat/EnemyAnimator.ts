import * as Phaser from 'phaser';
import {
    ENEMY_ANIM_PROFILES,
    EnemyAnimProfile,
    EnemyAnimType,
    EnemyFxType,
    EnemySpriteSheet,
} from './EnemyAnimData';

export interface PlayOptions {
    variant?: string;
    chainTo?: EnemyAnimType;
    onComplete?: () => void;
}

export interface PlayFxOptions {
    x?: number;
    y?: number;
    offsetX?: number;
    offsetY?: number;
    onComplete?: () => void;
}

const LOOPING_ANIMS: Set<EnemyAnimType> = new Set(['idle', 'fly']);
const DEFAULT_FRAME_RATE = 10;
const IDLE_FRAME_RATE = 8;

export class EnemyAnimator {
    private scene: Phaser.Scene;
    private profile: EnemyAnimProfile;
    private sprite: Phaser.GameObjects.Sprite | null = null;
    private activeFxSprites: Phaser.GameObjects.Sprite[] = [];
    private selectedVariants: Partial<Record<EnemyAnimType, string>> = {};
    private registeredAnims: Set<string> = new Set();

    constructor(scene: Phaser.Scene, profileKey: string) {
        this.scene = scene;
        const profile = ENEMY_ANIM_PROFILES[profileKey];
        if (!profile) {
            throw new Error(`EnemyAnimator: unknown profile "${profileKey}"`);
        }
        this.profile = profile;
        this.preselectVariants();
    }

    static preloadProfile(scene: Phaser.Scene, profileKey: string): void {
        const profile = ENEMY_ANIM_PROFILES[profileKey];
        if (!profile) return;

        const loadSheet = (s: EnemySpriteSheet) => {
            if (scene.textures.exists(s.key)) return;
            scene.load.spritesheet(s.key, s.path, {
                frameWidth: s.frameWidth,
                frameHeight: s.frameHeight,
            });
        };

        for (const animSet of Object.values(profile.anims)) {
            if (!animSet) continue;
            for (const s of Object.values(animSet.sheets)) {
                loadSheet(s);
            }
        }
        for (const fxSet of Object.values(profile.fx)) {
            if (!fxSet) continue;
            for (const s of Object.values(fxSet.sheets)) {
                loadSheet(s);
            }
        }
    }

    static preloadAll(scene: Phaser.Scene): void {
        for (const key of Object.keys(ENEMY_ANIM_PROFILES)) {
            EnemyAnimator.preloadProfile(scene, key);
        }
    }

    createAnims(): void {
        for (const [animType, animSet] of Object.entries(this.profile.anims)) {
            if (!animSet) continue;
            const type = animType as EnemyAnimType;
            const isLoop = LOOPING_ANIMS.has(type);
            const rate = isLoop ? IDLE_FRAME_RATE : DEFAULT_FRAME_RATE;

            for (const [variantKey, sheetDef] of Object.entries(animSet.sheets)) {
                const animKey = this.buildAnimKey(type, variantKey);
                if (this.scene.anims.exists(animKey)) {
                    this.registeredAnims.add(animKey);
                    continue;
                }
                this.scene.anims.create({
                    key: animKey,
                    frames: this.scene.anims.generateFrameNumbers(sheetDef.key, {
                        start: sheetDef.startFrame ?? 0,
                        end: sheetDef.endFrame ?? (sheetDef.totalFrames - 1),
                    }),
                    frameRate: rate,
                    repeat: isLoop ? -1 : 0,
                });
                this.registeredAnims.add(animKey);
            }
        }

        for (const [fxType, fxSet] of Object.entries(this.profile.fx)) {
            if (!fxSet) continue;
            for (const [variantKey, sheetDef] of Object.entries(fxSet.sheets)) {
                const animKey = this.buildFxKey(fxType as EnemyFxType, variantKey);
                if (this.scene.anims.exists(animKey)) {
                    this.registeredAnims.add(animKey);
                    continue;
                }
                this.scene.anims.create({
                    key: animKey,
                    frames: this.scene.anims.generateFrameNumbers(sheetDef.key, {
                        start: sheetDef.startFrame ?? 0,
                        end: sheetDef.endFrame ?? (sheetDef.totalFrames - 1),
                    }),
                    frameRate: DEFAULT_FRAME_RATE,
                    repeat: 0,
                });
                this.registeredAnims.add(animKey);
            }
        }
    }

    createSprite(x: number, y: number): Phaser.GameObjects.Sprite {
        const idleAnim = this.resolveIdleAnimKey();
        const firstSheet = this.resolveIdleSheet();

        this.sprite = this.scene.add
            .sprite(x, y, firstSheet.key, 0)
            .setScale(2.5)
            .setScrollFactor(0)
            .setFlipX(!this.profile.enemyKey.startsWith('slime'));

        if (idleAnim && this.scene.anims.exists(idleAnim)) {
            this.sprite.play(idleAnim);
        }

        return this.sprite;
    }

    play(animType: EnemyAnimType, options?: PlayOptions): void {
        if (!this.sprite) return;

        if (animType === 'armorBreak') {
            const startX = this.sprite.x;
            const startY = this.sprite.y;
            const variant = options?.variant ?? this.selectedVariants['armorBreak'] ?? 'default';
            const animKey = this.resolveAnimKey('armorBreak', variant);
            if (!animKey || !this.scene.anims.exists(animKey)) return;

            const projectile = this.scene.add.sprite(startX, startY, 'golem_ar_armorbreak', 0)
                .setScale(2.5)
                .setScrollFactor(0)
                .setFlipX(true);

            projectile.play(animKey);

            this.scene.tweens.add({
                targets: projectile,
                x: startX - 500, // Travel to the left
                duration: 600,
                ease: 'Linear',
                onComplete: () => {
                    projectile.destroy();
                    options?.onComplete?.();
                }
            });
            return;
        }

        const variant = options?.variant ?? this.selectedVariants[animType];
        const animKey = this.resolveAnimKey(animType, variant);
        if (!animKey || !this.scene.anims.exists(animKey)) return;

        this.sprite.play(animKey);

        if (options?.chainTo) {
            const chainKey = this.resolveIdleAnimKeyForChain(options.chainTo);
            if (chainKey && this.scene.anims.exists(chainKey)) {
                this.sprite.chain(chainKey);
            }
        }

        if (options?.onComplete) {
            const cb = options.onComplete;
            this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                cb();
            });
        }
    }

    playFx(fxType: EnemyFxType, options?: PlayFxOptions): Phaser.GameObjects.Sprite | null {
        const fxSet = this.profile.fx[fxType];
        if (!fxSet) return null;

        let variantKey = 'default';
        if (fxSet.variants && fxSet.variants.length > 0) {
            variantKey = fxSet.variants[Math.floor(Math.random() * fxSet.variants.length)];
        }

        const sheetDef = fxSet.sheets[variantKey];
        if (!sheetDef) return null;

        const animKey = this.buildFxKey(fxType, variantKey);
        if (!this.scene.anims.exists(animKey)) return null;

        let fx: number, fy: number;
        if (options?.x !== undefined && options?.y !== undefined) {
            fx = options.x + (options?.offsetX ?? 0);
            fy = options.y + (options?.offsetY ?? 0);
        } else if (this.sprite) {
            fx = this.sprite.x + (options?.offsetX ?? 0);
            fy = this.sprite.y + (options?.offsetY ?? 0);
        } else {
            return null;
        }

        const fxSprite = this.scene.add
            .sprite(fx, fy, sheetDef.key, 0)
            .setScale(2.5)
            .setScrollFactor(0)
            .setFlipX(true);

        this.activeFxSprites.push(fxSprite);

        fxSprite.play(animKey);
        fxSprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            fxSprite.destroy();
            this.activeFxSprites = this.activeFxSprites.filter(s => s !== fxSprite);
            options?.onComplete?.();
        });

        return fxSprite;
    }

    playAttackWithFx(options?: PlayOptions & PlayFxOptions): void {
        const attackVariant = options?.variant ?? this.pickRandomVariant('attack');
        this.play('attack', {
            ...options,
            variant: attackVariant,
            chainTo: options?.chainTo ?? 'idle',
        });

        const fxSet = this.profile.fx['attack_fx'];
        if (fxSet) {
            const fxVariant = fxSet.sheets[attackVariant] ? attackVariant : 'default';
            const fxKey = this.buildFxKey('attack_fx', fxVariant);
            if (this.scene.anims.exists(fxKey)) {
                const sheetDef = fxSet.sheets[fxVariant];
                if (sheetDef) {
                    let fx: number, fy: number;
                    if (options?.x !== undefined && options?.y !== undefined) {
                        fx = options.x + (options?.offsetX ?? 0);
                        fy = options.y + (options?.offsetY ?? 0);
                    } else if (this.sprite) {
                        fx = this.sprite.x + (options?.offsetX ?? 0);
                        fy = this.sprite.y + (options?.offsetY ?? 0);
                    } else {
                        return;
                    }

                    const fxSprite = this.scene.add
                        .sprite(fx, fy, sheetDef.key, 0)
                        .setScale(2.5)
                        .setScrollFactor(0)
                        .setFlipX(true);

                    this.activeFxSprites.push(fxSprite);
                    fxSprite.play(fxKey);
                    fxSprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                        fxSprite.destroy();
                        this.activeFxSprites = this.activeFxSprites.filter(s => s !== fxSprite);
                    });
                }
            }
        }
    }

    getSprite(): Phaser.GameObjects.Sprite | null {
        return this.sprite;
    }

    hasAnim(animType: EnemyAnimType): boolean {
        return !!this.profile.anims[animType];
    }

    hasFx(fxType: EnemyFxType): boolean {
        return !!this.profile.fx[fxType];
    }

    playIdle(): void {
        if (!this.sprite) return;
        const key = this.resolveIdleAnimKey();
        if (key && this.scene.anims.exists(key)) {
            this.sprite.play(key);
        }
    }

    destroy(): void {
        for (const fx of this.activeFxSprites) {
            if (fx && fx.active) fx.destroy();
        }
        this.activeFxSprites = [];
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }
    }

    private preselectVariants(): void {
        for (const [animType, animSet] of Object.entries(this.profile.anims)) {
            if (!animSet || !animSet.variants || animSet.variants.length === 0) continue;
            const type = animType as EnemyAnimType;
            this.selectedVariants[type] = animSet.variants[
                Math.floor(Math.random() * animSet.variants.length)
            ];
        }
    }

    private pickRandomVariant(animType: EnemyAnimType): string {
        const animSet = this.profile.anims[animType];
        if (!animSet || !animSet.variants || animSet.variants.length === 0) return 'default';
        return animSet.variants[Math.floor(Math.random() * animSet.variants.length)];
    }

    private buildAnimKey(animType: EnemyAnimType, variant: string): string {
        return `enemy_${this.profile.enemyKey}_${animType}_${variant}`;
    }

    private buildFxKey(fxType: EnemyFxType, variant: string): string {
        return `enemy_${this.profile.enemyKey}_${fxType}_${variant}`;
    }

    private resolveAnimKey(animType: EnemyAnimType, variant?: string): string | null {
        const animSet = this.profile.anims[animType];
        if (!animSet) return null;

        let v = variant ?? 'default';
        if (!animSet.sheets[v]) {
            if (animSet.variants && animSet.variants.length > 0) {
                v = this.selectedVariants[animType] ?? animSet.variants[0];
            } else {
                v = 'default';
            }
        }
        if (!animSet.sheets[v]) return null;
        return this.buildAnimKey(animType, v);
    }

    private resolveIdleAnimKey(): string | null {
        const idleKey = this.resolveAnimKey('idle');
        if (idleKey) return idleKey;
        return this.resolveAnimKey('fly');
    }

    private resolveIdleSheet(): EnemySpriteSheet {
        const idleSet = this.profile.anims['idle'] ?? this.profile.anims['fly'];
        if (!idleSet) {
            const firstAnim = Object.values(this.profile.anims).find(a => !!a);
            if (firstAnim) {
                const firstSheet = Object.values(firstAnim.sheets)[0];
                if (firstSheet) return firstSheet;
            }
            throw new Error(`EnemyAnimator: no sheets found for "${this.profile.enemyKey}"`);
        }

        const variant = this.selectedVariants['idle'] ?? this.selectedVariants['fly'] ?? 'default';
        return idleSet.sheets[variant] ?? Object.values(idleSet.sheets)[0];
    }

    private resolveIdleAnimKeyForChain(animType: EnemyAnimType): string | null {
        if (animType === 'idle' || animType === 'fly') {
            return this.resolveIdleAnimKey();
        }
        return this.resolveAnimKey(animType);
    }
}
