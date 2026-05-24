import { Scene, GameObjects } from 'phaser';
import { FONT_FAMILY, RUNE_FONT, InputKeys } from '../../constants';
import { SLATE_DEFINITIONS, SlateDefinition } from '../../data/SlateData';
import { SlateSystem } from '../../systems/SlateSystem';

export class SlateMinigame extends Scene {
    private previousScene = 'LevelScene';
    private isPaused = false;
    private overlay!: GameObjects.Rectangle;
    private contentContainer!: GameObjects.Container;
    private activeSlateSystem: SlateSystem | null = null;
    private requestedSlateId: string | null = null;
    private activeTweens: Phaser.Tweens.Tween[] = [];

    constructor() {
        super({ key: 'SlateMinigame' });
    }

    preload() {
        this.load.font(FONT_FAMILY, 'assets/Models/exports/VCRosdNEUE.ttf');
        this.load.font(RUNE_FONT, 'assets/Models/exports/RUNE.TTF');
    }

    create(data: { previousScene?: string; isPaused?: boolean; slateId?: string; colorScheme?: string }) {
        this.previousScene = data?.previousScene || 'LevelScene';
        this.isPaused = !!data?.isPaused;
        this.requestedSlateId = data?.slateId || null;
        const colorScheme = data?.colorScheme || 'dark';

        this.scene.bringToTop();

        const w = this.scale.width;
        const h = this.scale.height;

        this.overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(0)
            .setInteractive();

        this.tweens.add({
            targets: this.overlay,
            fillAlpha: 0.8,
            duration: 400,
            ease: 'Sine.easeIn',
        });

        this.contentContainer = this.add.container(0, 0).setDepth(10);

        if (this.requestedSlateId) {
            const slate = SLATE_DEFINITIONS.find(s => s.id === this.requestedSlateId);
            if (slate) {
                this.openSlate(slate, colorScheme);
            }
        }

        this.input.keyboard!.on(InputKeys.BACK, () => {
            this.closeScene();
        });
    }

    private openSlate(slate: SlateDefinition, colorScheme: string): void {
        this.contentContainer.removeAll(true);

        const w = this.scale.width;
        const h = this.scale.height;

        this.activeSlateSystem = new SlateSystem(
            this,
            this.contentContainer,
            slate,
            () => {
                this.closeScene();
            },
            colorScheme
        );

        this.activeSlateSystem.create(w / 2, h / 2);
    }

    private closeScene(): void {
        this.input.keyboard!.off(InputKeys.BACK);

        this.tweens.add({
            targets: [this.overlay, this.contentContainer],
            alpha: 0,
            duration: 400,
            ease: 'Sine.easeOut',
            onComplete: () => {
                if (this.activeSlateSystem) {
                    this.activeSlateSystem.destroy();
                    this.activeSlateSystem = null;
                }

                this.activeTweens.forEach(t => {
                    if (t && t.isPlaying()) t.stop();
                });
                this.activeTweens = [];

                this.scene.stop();
                if (this.isPaused) {
                    this.scene.resume(this.previousScene);
                }
            }
        });
    }
}