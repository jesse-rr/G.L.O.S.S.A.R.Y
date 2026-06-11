import * as Phaser from 'phaser';
import { FONT_FAMILY, TITLE_FONT } from '../../../constants';

export class GlossaryProloguePage {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene, container: Phaser.GameObjects.Container) {
        this.scene = scene;
        this.container = container;
    }

    renderFrontPage(centerX: number, height: number): void {
        const leftPageX = centerX - 500;
        const rightPageX = centerX + 80;
        const topY = height - 660;

        const leftInfoLayout = this.scene.add.image(leftPageX - 90, topY + 20, 'book-layout-2').setOrigin(0).setAlpha(0.5);
        const leftDescLayout = this.scene.add.image(leftPageX - 90, topY + 200, 'book-layout-3').setOrigin(0).setAlpha(0.5);
        const rightInfoLayout = this.scene.add.image(rightPageX - 90, topY + 20, 'book-layout-2').setOrigin(0).setAlpha(0.5);
        const rightDescLayout = this.scene.add.image(rightPageX - 90, topY + 200, 'book-layout-3').setOrigin(0).setAlpha(0.5);

        const titleText = this.scene.add.text(leftPageX + 210, topY + 120, 'Prologue', {
            fontFamily: TITLE_FONT, fontSize: '82px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.8);

        const leftExplanation =
            "    Welcome, ████████. Within these pages lies the ████████ knowledge of the ██████ around you.\n\n" +
            "    As you venture deeper into the ███████, the entries of this book will unveil themselves. " +
            "Every rune ██████████, every ████████ encountered, and every land traversed shall find its place here.\n\n" +
            "    Guard this ████ well, for it holds the ██████ of all you have ██████████.";

        const leftDescText = this.scene.add.text(leftPageX + 210, topY + 400, leftExplanation, {
            fontFamily: FONT_FAMILY, fontSize: '18px', color: '#000000',
            wordWrap: { width: 470 }, lineSpacing: 5, align: 'left'
        }).setOrigin(0.5).setAlpha(0.7);

        const rightTitle = this.scene.add.text(rightPageX + 210, topY + 120, 'Contents', {
            fontFamily: TITLE_FONT, fontSize: '82px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.8);

        const rightExplanation =
            "    I. Runes - The ancient symbols of power used in combat.\n\n" +
            "    II. Items - Artifacts and tools discovered along the way.\n\n" +
            "    III. Bestiary - Records of creatures that roam these lands.\n\n" +
            "    IV. Locations - Maps and descriptions of known territories.";

        const rightDescText = this.scene.add.text(rightPageX + 210, topY + 400, rightExplanation, {
            fontFamily: FONT_FAMILY, fontSize: '18px', color: '#000000',
            wordWrap: { width: 470 }, lineSpacing: 5, align: 'left'
        }).setOrigin(0.5).setAlpha(0.7);

        this.container.add([leftInfoLayout, leftDescLayout, rightInfoLayout, rightDescLayout, titleText, leftDescText, rightTitle, rightDescText]);
    }

    renderInfoPage(centerX: number, height: number): void {
        const leftPageX = centerX - 500;
        const rightPageX = centerX + 80;
        const topY = height - 660;

        const leftInfoLayout = this.scene.add.image(leftPageX - 90, topY + 20, 'book-layout-2').setOrigin(0).setAlpha(0.5);
        const leftDescLayout = this.scene.add.image(leftPageX - 90, topY + 200, 'book-layout-3').setOrigin(0).setAlpha(0.5);
        const rightInfoLayout = this.scene.add.image(rightPageX - 90, topY + 20, 'book-layout-2').setOrigin(0).setAlpha(0.5);
        const rightDescLayout = this.scene.add.image(rightPageX - 90, topY + 200, 'book-layout-3').setOrigin(0).setAlpha(0.5);

        const leftTitle = this.scene.add.text(leftPageX + 210, topY + 120, 'Covenants', {
            fontFamily: TITLE_FONT, fontSize: '82px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.8);

        const leftExplanation =
            "    Dragon — Followers of ████████ strength. Their ████ burns through ██████████ with ██████████ force.\n\n" +
            "    Phoenix — Devoted to ██████████ and ███████. They ████ wounds and ██████ the fallen back from ████████.\n\n" +
            "    Snake — Masters of ████████ and ██████████. They strike from the ███████ and ████████ their enemies.";

        const leftDescText = this.scene.add.text(leftPageX + 210, topY + 400, leftExplanation, {
            fontFamily: FONT_FAMILY, fontSize: '18px', color: '#000000',
            wordWrap: { width: 470 }, lineSpacing: 5, align: 'left'
        }).setOrigin(0.5).setAlpha(0.7);

        const rightTitle = this.scene.add.text(rightPageX + 210, topY + 120, 'Runes', {
            fontFamily: TITLE_FONT, fontSize: '82px', color: '#000000'
        }).setOrigin(0.5).setAlpha(0.8);

        const rightExplanation =
            "    I. Power — Runes of offense deal damage to the enemy. The stronger the rune, the greater the blow.\n\n" +
            "    II. Defense — Protective runes raise a barrier that reduces incoming damage for a limited time.\n\n" +
            "    III. Buff — These runes enhance the caster, strengthening their abilities or restoring health over time.";

        const rightDescText = this.scene.add.text(rightPageX + 210, topY + 400, rightExplanation, {
            fontFamily: FONT_FAMILY, fontSize: '18px', color: '#000000',
            wordWrap: { width: 470 }, lineSpacing: 5, align: 'left'
        }).setOrigin(0.5).setAlpha(0.7);

        this.container.add([leftInfoLayout, leftDescLayout, rightInfoLayout, rightDescLayout, leftTitle, leftDescText, rightTitle, rightDescText]);
    }
}
