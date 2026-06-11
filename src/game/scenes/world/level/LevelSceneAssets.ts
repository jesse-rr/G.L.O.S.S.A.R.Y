import * as Phaser from 'phaser';
import { AudioManager } from '../../../utils/AudioManager';
import { DashSystem } from '../../../systems/DashSystem';
import { ScreenShake } from '../../../utils/ScreenShake';

const COVENANTS = ['dragon', 'phoenix', 'snake'] as const;

export function preloadLevelSceneAssets(
    scene: Phaser.Scene,
    covenant: string,
    audioManager: AudioManager,
    dashSystem: DashSystem
): void {
    scene.load.image('Abandoned-Floor.png', 'assets/Models/exports/tileset/Abandoned-Floor.png');
    scene.load.image('Desert-Floor.png', 'assets/Models/exports/tileset/Desert-Floor.png');
    scene.load.image('Mechanic-Floor.png', 'assets/Models/exports/tileset/Mechanic-Floor.png');
    scene.load.image('Objects.png', 'assets/Models/exports/tileset/Objects.png');
    scene.load.image('Summit-Floor.png', 'assets/Models/exports/tileset/Summit-Floor.png');

    scene.load.tilemapTiledJSON('central-hub', 'assets/Models/exports/Maps/central-hub.json');
    scene.load.tilemapTiledJSON('boss-floor-abandoned', 'assets/Models/exports/Maps/boss-floor-abandoned.json');
    scene.load.tilemapTiledJSON('boss-floor-desert', 'assets/Models/exports/Maps/boss-floor-desert.json');
    scene.load.tilemapTiledJSON('boss-floor-mechanic', 'assets/Models/exports/Maps/boss-floor-mechanic.json');
    scene.load.tilemapTiledJSON('summit-settlement', 'assets/Models/exports/Maps/summit-settlement.json');
    scene.load.tilemapTiledJSON('abandoned-settlement', 'assets/Models/exports/Maps/abandoned-settlement.json');
    scene.load.tilemapTiledJSON('desert-settlement', 'assets/Models/exports/Maps/desert-settlement.json');
    scene.load.tilemapTiledJSON('mechanic-settlement', 'assets/Models/exports/Maps/mechanic-settlement.json');
    scene.load.tilemapTiledJSON('summit-trade', 'assets/Models/exports/Maps/summit-trade.json');
    scene.load.tilemapTiledJSON('merchant', 'assets/Models/exports/Maps/merchant.json');

    scene.load.spritesheet('door-sheet-mechanic', 'assets/Models/exports/Animations/Door-Sheet-Mechanic-Sheet.png', {
        frameWidth: 32,
        frameHeight: 64
    });
    scene.load.spritesheet('door-sheet', 'assets/Models/exports/Animations/Door-Sheet.png', {
        frameWidth: 64,
        frameHeight: 96
    });
    scene.load.spritesheet('door-symbol', 'assets/Models/exports/Animations/Door-Symbol.png', {
        frameWidth: 64,
        frameHeight: 96
    });
    scene.load.spritesheet('protagonist-idle', `assets/Models/Protagonist/Idle-${covenant}.png`, {
        frameWidth: 48,
        frameHeight: 48
    });
    scene.load.spritesheet('protagonist-run', `assets/Models/Protagonist/Run-${covenant}.png`, {
        frameWidth: 48,
        frameHeight: 48
    });
    scene.load.spritesheet('protagonist-dash', `assets/Models/Protagonist/Dash-${covenant}.png`, {
        frameWidth: 48,
        frameHeight: 48
    });
    scene.load.spritesheet('protagonist-death', `assets/Models/Protagonist/Death-${covenant}.png`, {
        frameWidth: 48,
        frameHeight: 48
    });
    COVENANTS.forEach(remoteCovenant => {
        scene.load.spritesheet(`remote-protagonist-idle-${remoteCovenant}`, `assets/Models/Protagonist/Idle-${remoteCovenant}.png`, {
            frameWidth: 48,
            frameHeight: 48
        });
        scene.load.spritesheet(`remote-protagonist-run-${remoteCovenant}`, `assets/Models/Protagonist/Run-${remoteCovenant}.png`, {
            frameWidth: 48,
            frameHeight: 48
        });
    });
    scene.load.image('protagonist-shadow', 'assets/Models/Protagonist/Shadow.png');

    scene.load.spritesheet('btn-boss-abandoned', 'assets/Models/exports/Animations/Btn-Boss-Abandoned.png', {
        frameWidth: 64,
        frameHeight: 64
    });
    scene.load.spritesheet('btn-boss-desert', 'assets/Models/exports/Animations/Btn-Boss-Desert.png', {
        frameWidth: 64,
        frameHeight: 64
    });
    scene.load.spritesheet('btn-boss-mechanic', 'assets/Models/exports/Animations/Btn-Boss-Mechanic.png', {
        frameWidth: 64,
        frameHeight: 64
    });
    scene.load.spritesheet('btn-boss-summit', 'assets/Models/exports/Animations/Btn-Boss-Summit.png', {
        frameWidth: 64,
        frameHeight: 64
    });
    scene.load.spritesheet('btn-boss-symbol', 'assets/Models/exports/Animations/Btn-Boss-Symbol.png', {
        frameWidth: 64,
        frameHeight: 64
    });

    scene.load.spritesheet('chests', 'assets/Models/exports/Animations/Chests.png', {
        frameWidth: 32,
        frameHeight: 48
    });
    scene.load.spritesheet('items', 'assets/Models/exports/Objects/Items.png', {
        frameWidth: 64,
        frameHeight: 64
    });
    scene.load.image('interact-btn', 'assets/Models/exports/UI/Interact-Btn.png');
    scene.load.image('achievement-ui', 'assets/Models/exports/UI/Achievement-UI.png');
    scene.load.image('settings-btn', 'assets/Models/exports/UI/Settings-Btn.png');
    scene.load.spritesheet('currency', 'assets/Models/exports/Objects/Currency.png', {
        frameWidth: 16,
        frameHeight: 16
    });
    scene.load.spritesheet('trade', 'assets/Models/exports/Animations/Trade.png', {
        frameWidth: 160,
        frameHeight: 190
    });
    scene.load.spritesheet('combat-symbol-ui', 'assets/Models/exports/UI/Combat-Symbol-UI.png', {
        frameWidth: 32,
        frameHeight: 32
    });

    scene.load.spritesheet('pillar', 'assets/Models/Boss/boss-big-pillar-attack.png', {
        frameWidth: 32,
        frameHeight: 128
    });
    scene.load.spritesheet('small_pillar', 'assets/Models/Boss/boss-small-pillar-attack.png', {
        frameWidth: 32,
        frameHeight: 96
    });
    scene.load.spritesheet('inline_pillar', 'assets/Models/Boss/boss-inline-pillar-attack.png', {
        frameWidth: 64,
        frameHeight: 64
    });
    scene.load.spritesheet('spikes', 'assets/Models/Boss/boss-spikes-attack.png', {
        frameWidth: 32,
        frameHeight: 64
    });
    scene.load.image('small_pillar_indicator', 'assets/Models/Boss/boss-small-pillar-attack-indicator.png');
    scene.load.image('spikes_indicator', 'assets/Models/Boss/boss-spikes-attack-indicator.png');
    scene.load.image('inline_pillar_indicator', 'assets/Models/Boss/boss-inline-pillar-attack-indicator.png');
    scene.load.image('big_pillar_indicator', 'assets/Models/Boss/boss-big-pillar-attack-indicator.png');
    scene.load.image('Rune-Indicator-Top', 'assets/Models/Boss/Rune-Indicator-Top.png');
    scene.load.image('Rune-Indicator-Bottom', 'assets/Models/Boss/Rune-Indicator-Bottom.png');
    scene.load.spritesheet('tentacles', 'assets/Models/Boss/boss-tentacles.png', {
        frameWidth: 128,
        frameHeight: 96
    });
    scene.load.spritesheet('tentacles-v2', 'assets/Models/Boss/boss-tentacles-v2.png', {
        frameWidth: 64,
        frameHeight: 96
    });
    scene.load.image('boss-eye', 'assets/Models/Boss/boss-eye.png');
    scene.load.spritesheet('boss-eye-bg', 'assets/Models/Boss/boss-eye-bg.png', {
        frameWidth: 64,
        frameHeight: 64
    });

    audioManager.loadAudio();
    dashSystem.setAudioManager(audioManager);
    dashSystem.preloadAudio(scene);
    ScreenShake.preload(scene);
}

export function ensureLevelPlayerAnimations(scene: Phaser.Scene): void {
    if (!scene.anims.exists('idle')) {
        scene.anims.create({
            key: 'idle',
            frames: scene.anims.generateFrameNumbers('protagonist-idle', { start: 0, end: 6 }),
            frameRate: 8,
            repeat: -1
        });
        scene.anims.create({
            key: 'run-start',
            frames: scene.anims.generateFrameNumbers('protagonist-run', { start: 0, end: 7 }),
            frameRate: 12,
            repeat: 0
        });
        scene.anims.create({
            key: 'run-loop',
            frames: scene.anims.generateFrameNumbers('protagonist-run', { start: 0, end: 7 }),
            frameRate: 12,
            repeat: -1
        });
        scene.anims.create({
            key: 'stop',
            frames: scene.anims.generateFrameNumbers('protagonist-idle', { start: 0, end: 0 }),
            frameRate: 12,
            repeat: 0
        });
        scene.anims.create({
            key: 'dash',
            frames: scene.anims.generateFrameNumbers('protagonist-dash', { start: 0, end: 11 }),
            frameRate: 80,
            repeat: 0
        });
        scene.anims.create({
            key: 'death',
            frames: scene.anims.generateFrameNumbers('protagonist-death', { start: 0, end: 16 }),
            frameRate: 12,
            repeat: 0
        });
    }

    COVENANTS.forEach(covenant => {
        if (!scene.anims.exists(`remote-idle-${covenant}`)) {
            scene.anims.create({
                key: `remote-idle-${covenant}`,
                frames: scene.anims.generateFrameNumbers(`remote-protagonist-idle-${covenant}`, { start: 0, end: 6 }),
                frameRate: 8,
                repeat: -1
            });
        }
        if (!scene.anims.exists(`remote-run-loop-${covenant}`)) {
            scene.anims.create({
                key: `remote-run-loop-${covenant}`,
                frames: scene.anims.generateFrameNumbers(`remote-protagonist-run-${covenant}`, { start: 0, end: 7 }),
                frameRate: 12,
                repeat: -1
            });
        }
    });
}

export function ensureLevelDoorAnimations(scene: Phaser.Scene): void {
    if (scene.anims.exists('door-open')) return;

    const frames = [];
    for (let i = 0; i <= 13; i++) {
        const t = i / 13;
        frames.push({ key: 'door-sheet', frame: i, duration: 60 + t * t * 200 });
    }
    scene.anims.create({ key: 'door-open', frames, repeat: 0 });
}
