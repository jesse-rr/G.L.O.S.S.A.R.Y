import * as Phaser from 'phaser';
import { FONT_FAMILY } from '../../constants';
import { ScrollableScene } from '../../constants';
import { AudioManager } from '../../utils/AudioManager';

export class ControlsUI extends Phaser.Scene {
    private baseX = 0;
    private baseY = 0;
    private parentScene!: Phaser.Scene;
    private container!: Phaser.GameObjects.Container;
    private audioManager!: AudioManager;

    constructor() {
        super('ControlsUI');
    }

    preload() {
        this.audioManager = new AudioManager(this);
        this.audioManager.loadAudio();
    }

    create(data: any) {
        this.parentScene = data.scene;
        this.baseX = data.x;
        this.baseY = data.y;

        this.container = this.add.container(this.baseX, this.baseY);

        const makeKey = (x: number, y: number, letter: string, customFrame?: number) => {
            const frame = customFrame !== undefined ? customFrame : 2;
            const bg = this.add.image(x, y, 'ui-items', frame)
                .setScale(4)
                .setOrigin(0.5);

            const txt = this.add.text(x, y, letter, {
                fontSize: '22px', color: '#ffffff', fontFamily: FONT_FAMILY
            }).setOrigin(0.5);
            this.container.add([bg, txt]);
        };
        const makePadButton = (x: number, y: number, label: string) => {
            const bg = this.add.circle(x, y, 18, 0x2f2f36, 1)
                .setStrokeStyle(2, 0x847E87);
            const txt = this.add.text(x, y, label, {
                fontSize: '18px', color: '#ffffff', fontFamily: FONT_FAMILY
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

        makeKey(rightX, actionsYStart, 'X');
        this.container.add(this.add.text(rightX + 45, actionsYStart, '- Interact (Press/Hold)', { fontSize: '20px', color: '#847E87', fontFamily: FONT_FAMILY }).setOrigin(0, 0.5));

        const rightColumnX = rightX + 320;
        makeKey(rightColumnX, actionsYStart, 'C');
        this.container.add(this.add.text(rightColumnX + 45, actionsYStart, '- Open Items (Combat)', { fontSize: '20px', color: '#847E87', fontFamily: FONT_FAMILY }).setOrigin(0, 0.5));

        makeKey(rightX, actionsYStart + actSpacing, 'G');
        this.container.add(this.add.text(rightX + 45, actionsYStart + actSpacing, '- Glossary / Book', { fontSize: '20px', color: '#847E87', fontFamily: FONT_FAMILY }).setOrigin(0, 0.5));

        makeKey(rightX, actionsYStart + actSpacing * 2, 'Q');
        this.container.add(this.add.text(rightX + 45, actionsYStart + actSpacing * 2, '- Settings', { fontSize: '20px', color: '#847E87', fontFamily: FONT_FAMILY }).setOrigin(0, 0.5));

        makeKey(rightX, actionsYStart + actSpacing * 3, 'Esc');
        this.container.add(this.add.text(rightX + 45, actionsYStart + actSpacing * 3, '- Go Back', { fontSize: '20px', color: '#847E87', fontFamily: FONT_FAMILY }).setOrigin(0, 0.5));

        const shiftFrame = this.textures.get('ui-items').frameTotal - 2;
        makeKey(rightX, actionsYStart + actSpacing * 4, 'Shift', shiftFrame);
        this.container.add(this.add.text(rightX + 45, actionsYStart + actSpacing * 4, '- View Rune Info (While in combat) / Dash', { fontSize: '20px', color: '#847E87', fontFamily: FONT_FAMILY }).setOrigin(0, 0.5));

        const padX = rightX + 290;
        const padY = actSpacing * 4 + 20;
        this.container.add(this.add.text(padX, padY, 'GAMEPAD', {
            fontSize: '20px', color: '#ffffff', fontFamily: FONT_FAMILY
        }).setOrigin(0, 0.5));
        this.container.add(this.add.text(padX, padY + 36, 'Left Stick / D-Pad - Move', {
            fontSize: '18px', color: '#847E87', fontFamily: FONT_FAMILY
        }).setOrigin(0, 0.5));
        makePadButton(padX + 18, padY + 76, 'A');
        this.container.add(this.add.text(padX + 45, padY + 76, '- Interact (Press/Hold)', {
            fontSize: '18px', color: '#847E87', fontFamily: FONT_FAMILY
        }).setOrigin(0, 0.5));
        makePadButton(padX + 18, padY + 116, 'B');
        makePadButton(padX + 68, padY + 116, 'RB');
        this.container.add(this.add.text(padX + 100, padY + 116, '- Dash', {
            fontSize: '18px', color: '#847E87', fontFamily: FONT_FAMILY
        }).setOrigin(0, 0.5));

        this.input.on('wheel', (_: any, __: any, ___: number, dy: number) => {
            const parent = this.parentScene as ScrollableScene;
            if (parent && parent.scrollY !== undefined) {
                parent.scrollY += dy;
                parent.scrollY = Phaser.Math.Clamp(parent.scrollY, 0, parent.maxScroll);
                parent.cameras.main.scrollY = Math.floor(parent.scrollY);
            }
        });

        this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
            if (p.isDown) {
                const parent = this.parentScene as ScrollableScene;
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
