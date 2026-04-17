import * as Phaser from 'phaser';

export class SettingsUI extends Phaser.Scene {

    private elements: any[] = [];
    private selected = 0;
    private selL!: Phaser.GameObjects.Sprite;
    private selR!: Phaser.GameObjects.Sprite;

    private baseX = 0;
    private baseY = 0;
    private parentScene!: Phaser.Scene;

    private draggingSlider: any = null;

    private leftCount = 3;
    private rightCount = 4;

    constructor() {
        super('SettingsUI');
    }

    preload() {
        this.load.font('font', 'assets/exports/VCRosdNEUE.ttf')
        this.load.spritesheet('ui-items', 'assets/exports/UI/UI-Items.png', {
            frameWidth: 32,
            frameHeight: 32
        });
    }

    create(data: any) {
        this.parentScene = data.scene;
        this.baseX = data.x;
        this.baseY = data.y;

        this.anims.create({
            key: 'selector_anim',
            frames: [
                { key: 'ui-items', frame: 6 },
                { key: 'ui-items', frame: 7 },
                { key: 'ui-items', frame: 6 }
            ],
            frameRate: 6,
            repeat: -1
        });

        const scale = 2;

        const leftTextX = -470;
        const rightTextX = 40;
        const uiOffset = 400;

        const startY = 180;
        const gap = 60;

        const leftLabels = ['VSync', 'Particles', 'Screen Shake'];
        const rightLabels = ['Volume', 'Screen Size', 'Cat Mode', 'User Data'];

        this.elements = [
            { type: 'button', ox: leftTextX + uiOffset, oy: startY, toggle: true, enabled: false, label: leftLabels[0] },
            { type: 'button', ox: leftTextX + uiOffset, oy: startY + gap, toggle: true, enabled: false, label: leftLabels[1] },
            { type: 'button', ox: leftTextX + uiOffset, oy: startY + gap * 2, toggle: true, enabled: false, label: leftLabels[2] },

            { type: 'slider', ox: rightTextX + uiOffset, oy: startY, value: 50, label: rightLabels[0] },
            { type: 'button', ox: rightTextX + uiOffset, oy: startY + gap, toggle: false, label: rightLabels[1] },
            { type: 'button', ox: rightTextX + uiOffset, oy: startY + gap * 2, toggle: true, enabled: false, label: rightLabels[2] },
            { type: 'download', ox: rightTextX + uiOffset, oy: startY + gap * 3, label: rightLabels[3] }
        ];

        this.elements.forEach((el, i) => {
            el.obj = this.add.container(0, 0);

            const label = this.add.text(-380, 0, el.label ?? '', {
                fontSize: '34px',
                color: '#847E87',
                fontFamily: 'font'
            }).setOrigin(0, 0.5);

            el.obj.add(label);

            if (el.type === 'button') {
                const hit = this.add.zone(-177, 0, 415, 40)
                    .setOrigin(0.5)
                    .setInteractive({ cursor: 'pointer' })
                    .on('pointerover', () => this.select(i))
                    .on('pointerdown', () => this.activate(i));

                const btn = this.add.image(0, 0, 'ui-items', 2).setScale(scale);

                el.yesIcon = this.add.image(0, 0, 'ui-items', 0)
                    .setScale(scale)
                    .setVisible(el.enabled ?? false);

                el.obj.add([hit, btn, el.yesIcon]);
            }

            if (el.type === 'slider') {

                const trackWidth = 160;
                const sliderY = 0;
                const leftEdge = -trackWidth / 2;
                const rightEdge = trackWidth / 2;

                const leftCap = this.add.image(leftEdge - 36, sliderY, 'ui-items', 4)
                    .setOrigin(0, 0.5)
                    .setScale(scale);

                const rightCap = this.add.image(rightEdge - 68, sliderY, 'ui-items', 5)
                    .setOrigin(1, 0.5)
                    .setScale(scale);

                const knob = this.add.image(leftEdge - 36, sliderY, 'ui-items', 1)
                    .setOrigin(0.5)
                    .setScale(scale)
                    .setDepth(3);

                const txt = this.add.text(leftEdge - 50, -7, '50')
                    .setOrigin(1, 0.1)
                    .setStyle({
                        fontSize: '26px',
                        color: '#847E87',
                        fontFamily: 'font'
                    })
                    .setDepth(3);

                const update = (v: number) => {
                    el.value = Phaser.Math.Clamp(v, 0, 100);

                    const t = el.value / 100;
                    const minX = leftEdge - 36;
                    const maxX = rightEdge - 68;

                    knob.x = Phaser.Math.Linear(minX, maxX, t);
                    txt.setText(`${Math.round(el.value)}`);
                };

                update(50);

                const rowHit = this.add.zone(-177, sliderY, 415, 40)
                    .setOrigin(0.5)
                    .setInteractive({ cursor: 'pointer' })
                    .on('pointerover', () => this.select(i));

                const hit = this.add.zone(-50, sliderY, trackWidth, 40)
                    .setOrigin(0.5)
                    .setInteractive({ cursor: 'pointer' })
                    .on('pointerover', () => this.select(i))
                    .on('pointerdown', (p: Phaser.Input.Pointer) => {
                        const minX = leftEdge - 36;
                        const maxX = rightEdge - 68;

                        this.draggingSlider = { el, update, minX, maxX };
                        const local = el.obj.getWorldTransformMatrix().applyInverse(p.x, p.y);
                        const clamped = Phaser.Math.Clamp(local.x, minX, maxX);
                        update(((clamped - minX) / (maxX - minX)) * 100);
                    });

                el.obj.add([rowHit, leftCap, rightCap, hit, knob, txt]);
            }

            if (el.type === 'download') {
                const hit = this.add.zone(-177, 0, 415, 40)
                    .setOrigin(0.5)
                    .setInteractive({ cursor: 'pointer' })
                    .on('pointerover', () => this.select(i))
                    .on('pointerdown', () => this.activate(i));

                const dl = this.add.image(0, 0, 'ui-items', 3).setScale(scale);

                el.obj.add([hit, dl]);
            }
        });

        this.selL = this.add.sprite(0, 0, 'ui-items', 6)
            .setScale(2)
            .setDisplaySize(64, 68)
            .play('selector_anim')
            .setDepth(20);

        this.selR = this.add.sprite(0, 0, 'ui-items', 6)
            .setScale(2)
            .setDisplaySize(64, 68)
            .setFlipX(true)
            .play('selector_anim')
            .setDepth(20);

        this.select(0);

        this.input.keyboard!.on('keydown-UP', () => this.move(-1));
        this.input.keyboard!.on('keydown-DOWN', () => this.move(1));
        this.input.keyboard!.on('keydown-LEFT', () => this.moveSide(-1));
        this.input.keyboard!.on('keydown-RIGHT', () => this.moveSide(1));
        this.input.keyboard!.on('keydown-ENTER', () => this.activate(this.selected));

        this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
            if (this.draggingSlider) {
                const { el, update, minX, maxX } = this.draggingSlider;
                const local = el.obj.getWorldTransformMatrix().applyInverse(p.x, p.y);
                const clamped = Phaser.Math.Clamp(local.x, minX, maxX);
                update(((clamped - minX) / (maxX - minX)) * 100);
            }
        });

        this.input.on('pointerup', () => {
            this.draggingSlider = null;
        });
    }

    update() {
        const scrollY = (this.parentScene.cameras.main as any).scrollY;

        this.elements.forEach((el: any) => {
            el.obj.setPosition(
                this.baseX + el.ox,
                this.baseY + el.oy - scrollY
            );
        });

        const el = this.elements[this.selected];
        const isLeft = el.ox < 0;

        const textX = isLeft ? -470 : 40;
        const btnX = el.ox;

        const worldTextX = this.baseX + textX;
        const worldBtnX = this.baseX + btnX;

        const y = this.baseY + el.oy - scrollY;

        const pad = 10;

        this.selL.setPosition(worldTextX + pad + 20, y);
        this.selR.setPosition(worldBtnX - pad + 5, y);
    }

    private move(dir: number) {
        this.selected = Phaser.Math.Wrap(this.selected + dir, 0, this.elements.length);
    }

    private moveSide(dir: number) {
        const isLeft = this.selected < this.leftCount;

        if (dir > 0 && isLeft) {
            const row = this.selected;
            const target = this.leftCount + row;
            if (target < this.elements.length) {
                this.selected = target;
            }
        } else if (dir < 0 && !isLeft) {
            const row = this.selected - this.leftCount;
            if (row < this.leftCount) {
                this.selected = row;
            }
        }
    }

    private select(i: number) {
        this.selected = i;
    }

    private activate(i: number) {
        const el = this.elements[i];

        if (el.type === 'button' && el.toggle) {
            el.enabled = !el.enabled;
            if (el.yesIcon) el.yesIcon.setVisible(el.enabled);
        }

        if (el.type === 'download') {
            const data = {
                vsync: this.elements[0].enabled,
                particles: this.elements[1].enabled,
                screenShake: this.elements[2].enabled,
                volume: this.elements[3].value,
                catMode: this.elements[5].enabled
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'USER_DATA.json';
            a.click();
        }
    }
}
