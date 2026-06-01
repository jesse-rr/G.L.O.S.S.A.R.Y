import * as Phaser from 'phaser';
import { FONT_FAMILY, RUNE_FONT } from '../constants';
import { EnemyAnimator } from './EnemyAnimator';

export function preloadCombatSceneAssets(scene: Phaser.Scene): void {
    scene.load.image('combat-bg-desert', 'assets/Models/exports/backgrounds/Desert-Floor.png');
    scene.load.image('combat-bg-abandoned', 'assets/Models/exports/backgrounds/Abandoned-Floor.png');
    scene.load.image('combat-bg-mechanic', 'assets/Models/exports/backgrounds/Mechanic-Floor.png');
    scene.load.font(FONT_FAMILY, 'assets/Models/exports/VCRosdNEUE.ttf');
    scene.load.font(RUNE_FONT, 'assets/Models/exports/RUNE.TTF');
    scene.load.image('battle-ui', 'assets/Models/exports/UI/Battle-UI.png');
    scene.load.image('book-ui', 'assets/Models/exports/UI/Book-UI.png');
    scene.load.image('book-layout', 'assets/Models/exports/UI/Book-Layout-1.png');
    scene.load.image('book-layout-2', 'assets/Models/exports/UI/Book-Layout-2.png');
    scene.load.image('book-layout-3', 'assets/Models/exports/UI/Book-Layout-3.png');
    scene.load.image('book-layout-4', 'assets/Models/exports/UI/Book-Layout-4.png');
    scene.load.image('player-ui', 'assets/Models/exports/UI/Player-UI.png');
    scene.load.spritesheet('rune-overlay', 'assets/Models/exports/UI/Combat-Overlay-Rune.png', {
        frameWidth: 48, frameHeight: 64
    });
    scene.load.image('achievement-ui', 'assets/Models/exports/UI/Achievement-UI.png');
    scene.load.image('settings-btn', 'assets/Models/exports/UI/Settings-Btn.png');
    scene.load.image('inventory-btn', 'assets/Models/exports/UI/Inventory-Btn.png');
    scene.load.spritesheet('chain-link', 'assets/Models/exports/UI/Combat-Overlay-Chains.png', {
        frameWidth: 64, frameHeight: 64
    });
    scene.load.spritesheet('bookmarks-ui', 'assets/Models/exports/UI/Bookmarks-UI.png', {
        frameWidth: 17, frameHeight: 22
    });
    scene.load.spritesheet('attack-selector', 'assets/Models/exports/UI/Combat-Attack-Selector.png', {
        frameWidth: 64, frameHeight: 64
    });
    scene.load.spritesheet('items', 'assets/Models/exports/Objects/Items.png', {
        frameWidth: 64, frameHeight: 64
    });
    scene.load.spritesheet('glossary', 'assets/Models/exports/Objects/Glossary.png', {
        frameWidth: 64, frameHeight: 64
    });
    scene.load.spritesheet('pillar-1', 'assets/Models/exports/characters/Pillar-1.png', { frameWidth: 48, frameHeight: 80 });
    scene.load.spritesheet('pillar-2', 'assets/Models/exports/characters/Pillar-2.png', { frameWidth: 48, frameHeight: 80 });
    scene.load.spritesheet('pillar-3', 'assets/Models/exports/characters/Pillar-3.png', { frameWidth: 48, frameHeight: 80 });
    scene.load.spritesheet('pillar-4', 'assets/Models/exports/characters/Pillar-4.png', { frameWidth: 48, frameHeight: 80 });
    scene.load.spritesheet('map-outlines', 'assets/Models/exports/Objects/map-outlines.png', {
        frameWidth: 192, frameHeight: 128
    });
    scene.load.spritesheet('map-boss-outlines', 'assets/Models/exports/Objects/map-boss-outlines.png', {
        frameWidth: 64, frameHeight: 128
    });
    scene.load.spritesheet('currency', 'assets/Models/exports/Objects/Currency.png', {
        frameWidth: 16, frameHeight: 16
    });
    scene.load.spritesheet('special-attack-btn', 'assets/Models/exports/UI/Special-Attack-Btn.png', {
        frameWidth: 64, frameHeight: 64
    });
    scene.load.spritesheet('status-btn', 'assets/Models/exports/UI/Status-Btn.png', {
        frameWidth: 32, frameHeight: 32
    });

    const covenant = scene.registry.get('playerData')?.covenant || 'snake';
    scene.load.spritesheet('protagonist-idle', `assets/Models/Protagonist/Idle-${covenant}.png`, { frameWidth: 48, frameHeight: 48 });
    scene.load.spritesheet('protagonist-hurt', `assets/Models/Protagonist/Hurt-${covenant}.png`, { frameWidth: 48, frameHeight: 48 });
    scene.load.spritesheet('protagonist-death', `assets/Models/Protagonist/Death-${covenant}.png`, { frameWidth: 48, frameHeight: 48 });
    scene.load.image('protagonist-shadow', 'assets/Models/Protagonist/Shadow.png');

    EnemyAnimator.preloadAll(scene);
}

export function ensureCombatSceneAnimations(scene: Phaser.Scene): void {
    if (!scene.anims.exists('chain-anim')) {
        scene.anims.create({
            key: 'chain-anim',
            frames: scene.anims.generateFrameNumbers('chain-link', { start: 0, end: 5 }),
            frameRate: 8,
            repeat: -1
        });
    }

    if (!scene.anims.exists('attack-selector-anim')) {
        scene.anims.create({
            key: 'attack-selector-anim',
            frames: scene.anims.generateFrameNumbers('attack-selector', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1,
            yoyo: true
        });
    }

    if (!scene.anims.exists('combat-player-idle')) {
        scene.anims.create({
            key: 'combat-player-idle',
            frames: scene.anims.generateFrameNumbers('protagonist-idle', { start: 0, end: 6 }),
            frameRate: 8,
            repeat: -1
        });
    }

    if (!scene.anims.exists('combat-player-hurt')) {
        scene.anims.create({
            key: 'combat-player-hurt',
            frames: scene.anims.generateFrameNumbers('protagonist-hurt', { start: 0, end: 2 }),
            frameRate: 8,
            repeat: 0
        });
    }

    if (!scene.anims.exists('combat-player-death')) {
        scene.anims.create({
            key: 'combat-player-death',
            frames: scene.anims.generateFrameNumbers('protagonist-death', { start: 0, end: 16 }),
            frameRate: 12,
            repeat: 0
        });
    }

    if (!scene.anims.exists('ability-btn-loop')) {
        scene.anims.create({
            key: 'ability-btn-loop',
            frames: scene.anims.generateFrameNumbers('special-attack-btn', { start: 0, end: 5 }),
            frameRate: 8,
            repeat: -1
        });
    }
}
