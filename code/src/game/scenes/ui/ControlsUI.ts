import * as Phaser from 'phaser';

import { FONT_FAMILY } from '../../constants';

export class ControlsUI extends Phaser.Scene {
    private baseX = 0;
    private baseY = 0;
    private imgScale = 2;
    private parentScene!: Phaser.Scene;
    private container!: Phaser.GameObjects.Container;

    constructor() {
        super('ControlsUI');
    }

    create(data: any) {
        this.parentScene = data.scene;
        this.baseX = data.x;
        this.baseY = data.y;
        this.imgScale = data.scale || 2;

        this.container = this.add.container(this.baseX, this.baseY);

        const makeKey = (x: number, y: number, letter: string) => {
            const bg = this.add.image(x, y, 'ui-items', 2)
                .setScale(4)
                .setOrigin(0.5);

            if (letter.length > 2) {
                bg.scaleX = this.imgScale * 2;
            }
            const txt = this.add.text(x, y, letter, {
                fontSize: '22px', color: '#ffffff', fontFamily: FONT_FAMILY
            }).setOrigin(0.5);
            this.container.add([bg, txt]);
        };

        const leftX = 320;
        const keyY = 210;
        const spacing = 68;

        makeKey(leftX, keyY, 'W');
        makeKey(leftX - spacing, keyY + spacing, 'A');
        makeKey(leftX, keyY + spacing, 'S');
        makeKey(leftX + spacing, keyY + spacing, 'D');

        const arrowTxt = this.add.text(leftX, keyY + spacing * 2 - 5, 'Arrow Keys also work', {
            fontSize: '18px', color: '#847E87', fontFamily: FONT_FAMILY
        }).setOrigin(0.5);
        this.container.add(arrowTxt);

        const rightX = -370;
        const actionsYStart = 210;
        const actSpacing = 68;

        makeKey(rightX, actionsYStart, 'G');
        this.container.add(this.add.text(rightX + 45, actionsYStart, '- Glossary / Book', { fontSize: '20px', color: '#847E87', fontFamily: FONT_FAMILY }).setOrigin(0, 0.5));

        makeKey(rightX, actionsYStart + actSpacing, 'X');
        this.container.add(this.add.text(rightX + 45, actionsYStart + actSpacing, '- Interact (Press/Hold)', { fontSize: '20px', color: '#847E87', fontFamily: FONT_FAMILY }).setOrigin(0, 0.5));

        makeKey(rightX, actionsYStart + actSpacing * 2, 'Q');
        this.container.add(this.add.text(rightX + 45, actionsYStart + actSpacing * 2, '- Settings', { fontSize: '20px', color: '#847E87', fontFamily: FONT_FAMILY }).setOrigin(0, 0.5));

        makeKey(rightX, actionsYStart + actSpacing * 3, 'Esc');
        this.container.add(this.add.text(rightX + 45, actionsYStart + actSpacing * 3, '- Go Back', { fontSize: '20px', color: '#847E87', fontFamily: FONT_FAMILY }).setOrigin(0, 0.5));

        this.input.on('wheel', (_: any, __: any, ___: number, dy: number) => {
            const parent = this.parentScene as any;
            if (parent && parent.scrollY !== undefined) {
                parent.scrollY += dy;
                parent.scrollY = Phaser.Math.Clamp(parent.scrollY, 0, parent.maxScroll);
                parent.cameras.main.scrollY = Math.floor(parent.scrollY);
            }
        });

        this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
            if (p.isDown) {
                const parent = this.parentScene as any;
                if (parent && parent.scrollY !== undefined) {
                    parent.scrollY -= p.velocity.y / 10;
                    parent.scrollY = Phaser.Math.Clamp(parent.scrollY, 0, parent.maxScroll);
                    parent.cameras.main.scrollY = Math.floor(parent.scrollY);
                }
            }
        });
    }

    update() {
        const scrollY = this.parentScene.cameras.main.scrollY;
        this.container.setY(this.baseY - scrollY);
    }
}
