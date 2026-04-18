import * as Phaser from 'phaser';

const FRAME_RATE = 8;
const STOP_DELAY = 5000;

const ANIM_DEFS = [
    { index: 0, bgKey: 'home_anim0', start: 0, end: 2 },
    { index: 1, bgKey: 'home_anim1', start: 3, end: 5 },
    { index: 2, bgKey: 'home_anim2', start: 6, end: 8 },
    { index: 3, bgKey: 'home_anim3', start: 9, end: 11 },
] as const;

const CANVAS_SCALE = 2;

const BUTTONS = [
        { label: 'NEW SAVE', srcX: 79, srcY: 178, srcW: 90, srcH: 22 },
        { label: 'MULTIPLAYER', srcX: 95, srcY: 210, srcW: 126, srcH: 22 },
        { label: 'HELP', srcX: 55, srcY: 242, srcW: 48, srcH: 22 },
        { label: 'EXIT', srcX: 55, srcY: 274, srcW: 44, srcH: 22 },
] as const;

const BUTTON_LEFT_X = 34;
const SEL_SRC_W = 12;
const SEL_GAP = 0;

export class MainMenu extends Phaser.Scene {

    private bg!: Phaser.GameObjects.Sprite;
    private selL!: Phaser.GameObjects.Sprite;
    private selR!: Phaser.GameObjects.Sprite;
    private currentAnim: number = 0;
    // private activeButton: number = 0;
    private stopTimer?: Phaser.Time.TimerEvent;

    constructor() {
        super('MainMenu');
    }

    create() {
        for (const def of ANIM_DEFS) {
            this.anims.create({
                key: def.bgKey,
                frames: this.anims.generateFrameNumbers('homeAnim', { start: def.start, end: def.end }),
                frameRate: FRAME_RATE,
                repeat: -1,
            });
        }

        this.anims.create({
            key: 'sel_anim',
            frames: this.anims.generateFrameNumbers('selectorAnim', { start: 0, end: 4 }),
            frameRate: FRAME_RATE,
            repeat: -1,
        });

        this.bg = this.add.sprite(640, 360, 'homeAnim')
            .setOrigin(0.5, 0.5)
            .setScale(CANVAS_SCALE);

        this.selL = this.add.sprite(0, 0, 'selectorAnim')
            .setOrigin(0.5, 0.5)
            .setScale(CANVAS_SCALE)
            .play('sel_anim');

        this.selR = this.add.sprite(0, 0, 'selectorAnim')
            .setOrigin(0.5, 0.5)
            .setScale(CANVAS_SCALE)
            .setFlipX(true)
            .play('sel_anim');

        const buttonLeft = BUTTON_LEFT_X * CANVAS_SCALE;
        for (let i = 0; i < BUTTONS.length; i++) {
            const btn = BUTTONS[i];
            const cx = buttonLeft + (btn.srcW * CANVAS_SCALE) / 2;
            const cy = btn.srcY * CANVAS_SCALE;
            const bw = btn.srcW * CANVAS_SCALE;
            const bh = btn.srcH * CANVAS_SCALE;

            const zone = this.add.zone(cx, cy, bw, bh)
                .setOrigin(0.5, 0.5)
                .setInteractive({ cursor: 'pointer' });

            zone.on('pointerover', () => {
                // this.activeButton = i;
                this.positionSelector(i);
                this.input.setDefaultCursor('pointer');
            });
            zone.on('pointerout', () => this.input.setDefaultCursor('default'));
            zone.on('pointerdown', () => this.onButtonClick(btn.label));
        }

        this.positionSelector(0);

        this.scale.on('resize', this.resize, this);
        this.playCurrentAnim();
    }

    private onButtonClick(label: string) {
        console.log(`[MainMenu] Button: ${label}`);
        switch (label) {
            case BUTTONS[0].label:
                break;
            case BUTTONS[1].label:
                break;
            case BUTTONS[2].label:
                this.openSettings();
                break;
            case BUTTONS[3].label:
                this.game.destroy(true, true);
                break;
        }
    }

    private positionSelector(i: number) {
        const btn = BUTTONS[i];
        const buttonLeft = BUTTON_LEFT_X * CANVAS_SCALE;
        const cx = buttonLeft + (btn.srcW * CANVAS_SCALE) / 2;
        const cy = btn.srcY * CANVAS_SCALE;
        const bw = btn.srcW * CANVAS_SCALE;
        const selDisplayW = SEL_SRC_W * CANVAS_SCALE;

        this.selL.setPosition(cx - bw / 2 - SEL_GAP - selDisplayW / 2, cy);
        this.selR.setPosition(cx + bw / 2 + SEL_GAP + selDisplayW / 2, cy);
    }

    private playCurrentAnim() {
        const def = ANIM_DEFS[this.currentAnim];

        this.bg.stop();
        this.bg.setFrame(def.start);

        this.stopTimer = this.time.delayedCall(STOP_DELAY, () => {
            this.bg.once(Phaser.Animations.Events.ANIMATION_COMPLETE, this.advanceAnim, this);
            this.bg.play({ key: def.bgKey, repeat: 0 });
        }, [], this);
    }

    private advanceAnim() {
        this.currentAnim = (this.currentAnim + 1) % ANIM_DEFS.length;
        this.playCurrentAnim();
    }

    private resize() {
        const { width, height } = this.scale;
        const scale = Math.max(width / 640, height / 360);
        this.bg.setPosition(width / 2, height / 2).setScale(scale);
    }

    shutdown() {
        this.stopTimer?.remove(false);
        this.scale.off('resize', this.resize, this);
        this.input.setDefaultCursor('default');
    }

    private openSettings() {
        this.scene.pause();
        this.scene.launch('Help');
    }
}
