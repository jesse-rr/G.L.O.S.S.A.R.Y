import * as Phaser from 'phaser';
import { createVignette } from '../../utils/Vignette';
import { InputKeys, FONT_FAMILY } from '../../constants';
import { LocationData } from '../../data/LocationData';
import { parseCollisionObjects, parseStairObjects } from '../../systems/CollisionParser';
import {DoorState, createDoors, handleDoorInteraction, initDoorAudio} from '../../systems/DoorSystem';
import { SettlementDoor, createSettlementDoors, handleSettlementDoorInteraction } from '../../systems/SettlementDoorSystem';
import { MechanicDoor, createMechanicDoors, handleMechanicDoorInteraction } from '../../systems/MechanicDoorSystem';
import { BossButtonState, createBossButtons, handleBossButtonInteraction } from '../../systems/BossButtonSystem';
import { ChestState, createChests, handleChestInteraction } from '../../systems/ChestSystem';
import { TradeState, createTrades, handleTradeInteraction } from "../../systems/TradeSystem";
import { SlateState, createSlates, handleSlateInteraction } from '../../systems/SlateInteraction';
import { PortalSystem } from '../../systems/PortalSystem';
import { PlayerData } from '../../data/PlayerData';
import { ItemData, ItemDefinition } from '../../data/ItemData';
import { CombatTrackerHUD } from '../../systems/CombatTrackerHUD';
import { isPipeLayer, fillPipeLayer } from '../../systems/PipeSystem';
import { RaidhoRuneSystem } from '../../systems/RaidhoRuneSystem';
import { MerchantState, createMerchants, handleMerchantInteraction } from '../../systems/MerchantSystem';
import { DashSystem } from '../../systems/DashSystem';
import { LightSystem } from '../../systems/LightSystem';
import { BossAttackSystem } from '../../systems/BossAttackSystem';
import { InteractSystem } from '../../systems/InteractSystem';
import { fadeIn, fadeOutAndDestroy } from '../../utils/TweenUtils';
import { RuneIndicatorSystem } from '../../systems/RuneIndicatorSystem';
import { DashIndicatorHUD } from '../../systems/DashIndicatorHUD';
import { SummitBossHUD } from '../../systems/SummitBossHUD';
import { DamageOverlay } from '../../utils/DamageOverlay';
import {LocationDisplayScene} from "../../utils/LocationDefinition";
import {AudioManager} from "../../utils/AudioManager";
import {ScreenShake} from "../../utils/ScreenShake";

export class LevelScene extends Phaser.Scene {
    private player!: Phaser.Physics.Matter.Sprite;
    private playerShadow!: Phaser.GameObjects.Image;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private keys!: { W: Phaser.Input.Keyboard.Key, A: Phaser.Input.Keyboard.Key, S: Phaser.Input.Keyboard.Key, D: Phaser.Input.Keyboard.Key };
    private mapKey!: string;
    private portalSystem!: PortalSystem;

    private targetSlowFactor = 1;
    private currentSlowFactor = 1;
    private stairZones!: Phaser.GameObjects.Group;
    private inReverseZone = false;

    private glossaryButton!: Phaser.GameObjects.Sprite;

    private activeStairZones: Set<number> = new Set();
    private doors: DoorState[] = [];
    private settlementDoors: SettlementDoor[] = [];
    private mechanicDoors: MechanicDoor[] = [];
    private bossButtons: BossButtonState[] = [];
    private chests: ChestState[] = [];
    private trades: TradeState[] = [];
    private slates: SlateState[] = [];
    private interactKey!: Phaser.Input.Keyboard.Key;
    private glossaryKey!: Phaser.Input.Keyboard.Key;
    private isCinematic = false;
    private settingsBtn!: Phaser.GameObjects.Sprite;
    private wasInteractPressed = {value: false};
    private levelHpHudIcon: Phaser.GameObjects.Sprite | null = null;
    private levelHpHudText: Phaser.GameObjects.Text | null = null;
    private summitBossHUD?: SummitBossHUD;
    private dashIndicatorHUD?: DashIndicatorHUD;
    private isDead = false;
    private raidhoRuneSystem?: RaidhoRuneSystem;
    private merchants: MerchantState[] = [];
    public merchantItems: ItemDefinition[] = [];

    private dashKey!: Phaser.Input.Keyboard.Key;
    private dashSystem!: DashSystem;
    private bossAttackSystem?: BossAttackSystem;
    private damageOverlay?: DamageOverlay;
    private pushVelocity = new Phaser.Math.Vector2(0, 0);
    private pushDurationTimer = 0;

    private barrierLayers: Phaser.Tilemaps.TilemapLayer[] = [];
    private barrierCollisionObjects: any[] = [];
    private barrierBodies: MatterJS.BodyType[] = [];
    private barrierActive = false;
    private isHoldingGlossary = false;
    private glossaryHoldProgress = 0;
    private glossaryHoldDuration = 1500;
    private interactSystem!: InteractSystem;
    private isGlossaryInteractable = true;
    private glossaryInteractZone: Phaser.GameObjects.Zone | null = null;
    private glossaryTentaclesX = 0;
    private glossaryTentaclesY = 0;
    private isNearGlossary = false;
    private runeIndicatorSystem?: RuneIndicatorSystem;
    private tentaclesAnimation?: Phaser.GameObjects.Sprite;
    private tentaclesV2Animation?: Phaser.GameObjects.Sprite;
    private bossEyeAnimation?: Phaser.GameObjects.Sprite;
    private bossEyeIdle?: Phaser.GameObjects.Image;
    private bossEyeBg?: Phaser.GameObjects.Sprite;
    private bossEyeVisible = false;
    private eyeIdleTimer?: Phaser.Time.TimerEvent;
    private persistSaveTimer = 0;
    private readonly persistSaveIntervalMs = 2000;
    private cachedPlayerX = 0;
    private cachedPlayerY = 0;
    private hasPlayerPositionCache = false;
    private isBossDefeatedSequence = false;
    private waitingForBossChoice = false;
    private audioManager: AudioManager;
    private replaceGlossaryText?: Phaser.GameObjects.Text;

    constructor() {
        super('LevelScene');
    }

    public pushPlayer(vx: number, vy: number, durationMs: number): void {
        if (this.isDead || this.isCinematic) return;
        this.pushVelocity.set(vx, vy);
        this.pushDurationTimer = durationMs;
    }

    private previousMap: string = '';
    private entryDirX: number = 0;
    private entryDirY: number = 0;
    private isEntering = false;
    private overrideSpawnX: number | null = null;
    private overrideSpawnY: number | null = null;
    private isTeleportingFromRune = false;

    init(data: { mapKey?: string, previousMap?: string, entryDirX?: number, entryDirY?: number, spawnX?: number, spawnY?: number, teleportFromRune?: boolean }) {
        this.mapKey = data?.mapKey || 'hub';
        this.previousMap = data?.previousMap || '';
        this.entryDirX = data?.entryDirX || 0;
        this.entryDirY = data?.entryDirY || 0;
        this.overrideSpawnX = data?.spawnX ?? null;
        this.overrideSpawnY = data?.spawnY ?? null;
        this.isTeleportingFromRune = data?.teleportFromRune ?? false;
        this.isEntering = false;
        this.isCinematic = false;
        this.barrierActive = false;
        this.isHoldingGlossary = false;
        this.glossaryHoldProgress = 0;
        this.isGlossaryInteractable = true;
        this.isNearGlossary = false;
        this.isDead = false;
        this.pushDurationTimer = 0;
        this.hasPlayerPositionCache = false;
        this.persistSaveTimer = 0;
        this.bossEyeVisible = false;
        this.isBossDefeatedSequence = false;
        this.waitingForBossChoice = false;
        this.summitBossHUD?.destroy();
        this.summitBossHUD = undefined;
        this.dashIndicatorHUD?.destroy();
        this.dashIndicatorHUD = undefined;
        this.tentaclesAnimation = undefined;
        this.tentaclesV2Animation = undefined;
        if (this.bossEyeAnimation) this.bossEyeAnimation.destroy();
        this.bossEyeAnimation = undefined;
        if (this.bossEyeIdle) this.bossEyeIdle.destroy();
        this.bossEyeIdle = undefined;
        if (this.bossEyeBg) this.bossEyeBg.destroy();
        this.bossEyeBg = undefined;
        if (this.eyeIdleTimer) this.eyeIdleTimer.remove();
        this.eyeIdleTimer = undefined;
    }

    preload() {
        this.load.image('Abandoned-Floor.png', 'assets/Models/exports/tileset/Abandoned-Floor.png');
        this.load.image('Desert-Floor.png', 'assets/Models/exports/tileset/Desert-Floor.png');
        this.load.image('Mechanic-Floor.png', 'assets/Models/exports/tileset/Mechanic-Floor.png');
        this.load.image('Objects.png', 'assets/Models/exports/tileset/Objects.png');
        this.load.image('Summit-Floor.png', 'assets/Models/exports/tileset/Summit-Floor.png');

        this.load.tilemapTiledJSON('central-hub', 'assets/Models/exports/Maps/central-hub.json');
        this.load.tilemapTiledJSON('boss-floor-abandoned', 'assets/Models/exports/Maps/boss-floor-abandoned.json');
        this.load.tilemapTiledJSON('boss-floor-desert', 'assets/Models/exports/Maps/boss-floor-desert.json');
        this.load.tilemapTiledJSON('boss-floor-mechanic', 'assets/Models/exports/Maps/boss-floor-mechanic.json');
        this.load.tilemapTiledJSON('summit-settlement', 'assets/Models/exports/Maps/summit-settlement.json');

        this.load.tilemapTiledJSON('abandoned-settlement', 'assets/Models/exports/Maps/abandoned-settlement.json');
        this.load.tilemapTiledJSON('desert-settlement', 'assets/Models/exports/Maps/desert-settlement.json');
        this.load.tilemapTiledJSON('mechanic-settlement', 'assets/Models/exports/Maps/mechanic-settlement.json');

        this.load.tilemapTiledJSON('summit-trade', 'assets/Models/exports/Maps/summit-trade.json');
        this.load.tilemapTiledJSON('merchant', 'assets/Models/exports/Maps/merchant.json');

        this.load.spritesheet('door-sheet-mechanic', 'assets/Models/exports/Animations/Door-Sheet-Mechanic-Sheet.png', {
            frameWidth: 32,
            frameHeight: 64
        });
        this.load.spritesheet('door-sheet', 'assets/Models/exports/Animations/Door-Sheet.png', {
            frameWidth: 64,
            frameHeight: 96
        });
        this.load.spritesheet('door-symbol', 'assets/Models/exports/Animations/Door-Symbol.png', {
            frameWidth: 64,
            frameHeight: 96
        });

        this.load.spritesheet('protagonist-idle', `assets/Models/Protagonist/Idle-${this.registry.get('playerData').covenant}.png`, {
            frameWidth: 48,
            frameHeight: 48
        });
        this.load.spritesheet('protagonist-run', `assets/Models/Protagonist/Run-${this.registry.get('playerData').covenant}.png`, {
            frameWidth: 48,
            frameHeight: 48
        });
        this.load.spritesheet('protagonist-dash', `assets/Models/Protagonist/Dash-${this.registry.get('playerData').covenant}.png`, {
            frameWidth: 48,
            frameHeight: 48
        });
        this.load.spritesheet('protagonist-death', `assets/Models/Protagonist/Death-${this.registry.get('playerData').covenant}.png`, {
            frameWidth: 48,
            frameHeight: 48
        });
        this.load.image('protagonist-shadow', `assets/Models/Protagonist/Shadow.png`);

        this.load.spritesheet('btn-boss-abandoned', 'assets/Models/exports/Animations/Btn-Boss-Abandoned.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('btn-boss-desert', 'assets/Models/exports/Animations/Btn-Boss-Desert.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('btn-boss-mechanic', 'assets/Models/exports/Animations/Btn-Boss-Mechanic.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('btn-boss-summit', 'assets/Models/exports/Animations/Btn-Boss-Summit.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('btn-boss-symbol', 'assets/Models/exports/Animations/Btn-Boss-Symbol.png', {
            frameWidth: 64,
            frameHeight: 64
        });

        this.load.spritesheet('chests', 'assets/Models/exports/Animations/Chests.png', {
            frameWidth: 32,
            frameHeight: 48
        });
        this.load.spritesheet('items', 'assets/Models/exports/Objects/Items.png', {frameWidth: 64, frameHeight: 64});
        this.load.image('interact-btn', 'assets/Models/exports/UI/Interact-Btn.png');
        this.load.image('achievement-ui', 'assets/Models/exports/UI/Achievement-UI.png');
        this.load.image('settings-btn', 'assets/Models/exports/UI/Settings-Btn.png');
        this.load.spritesheet('currency', 'assets/Models/exports/Objects/Currency.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        this.load.spritesheet('trade', 'assets/Models/exports/Animations/Trade.png', {
            frameWidth: 160,
            frameHeight: 190
        });
        this.load.spritesheet('combat-symbol-ui', 'assets/Models/exports/UI/Combat-Symbol-UI.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        this.load.spritesheet('pillar', 'assets/Models/Boss/boss-big-pillar-attack.png', {
            frameWidth: 32,
            frameHeight: 128
        });
        this.load.spritesheet('small_pillar', 'assets/Models/Boss/boss-small-pillar-attack.png', {
            frameWidth: 32,
            frameHeight: 96
        });
        this.load.spritesheet('inline_pillar', 'assets/Models/Boss/boss-inline-pillar-attack.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('spikes', 'assets/Models/Boss/boss-spikes-attack.png', {frameWidth: 32, frameHeight: 64});
        this.load.image('small_pillar_indicator', 'assets/Models/Boss/boss-small-pillar-attack-indicator.png');
        this.load.image('spikes_indicator', 'assets/Models/Boss/boss-spikes-attack-indicator.png');
        this.load.image('inline_pillar_indicator', 'assets/Models/Boss/boss-inline-pillar-attack-indicator.png');
        this.load.image('big_pillar_indicator', 'assets/Models/Boss/boss-big-pillar-attack-indicator.png');
        this.load.image('Rune-Indicator-Top', 'assets/Models/Boss/Rune-Indicator-Top.png');
        this.load.image('Rune-Indicator-Bottom', 'assets/Models/Boss/Rune-Indicator-Bottom.png');
        this.load.spritesheet('tentacles', 'assets/Models/Boss/boss-tentacles.png', {frameWidth: 128, frameHeight: 96});
        this.load.spritesheet('tentacles-v2', 'assets/Models/Boss/boss-tentacles-v2.png', {
            frameWidth: 64,
            frameHeight: 96
        });
        this.load.image('boss-eye', 'assets/Models/Boss/boss-eye.png');
        this.load.spritesheet('boss-eye-bg', 'assets/Models/Boss/boss-eye-bg.png', {frameWidth: 64, frameHeight: 64});

        this.audioManager = new AudioManager(this);
        this.audioManager.loadAudio();

        this.dashSystem = new DashSystem();
        this.dashSystem.setAudioManager(this.audioManager);
        this.dashSystem.preloadAudio(this);

        ScreenShake.preload(this);
    }

    create() {
        ScreenShake.init(this, this.audioManager);
        initDoorAudio(this.audioManager);

        this.interactSystem = InteractSystem.getInstance(this);

        this.stairZones = this.add.group();
        this.inReverseZone = false;
        this.targetSlowFactor = 1;
        this.currentSlowFactor = 1;
        this.activeStairZones.clear();
        this.doors = [];
        this.settlementDoors = [];
        this.mechanicDoors = [];
        this.bossButtons = [];
        this.chests = [];
        this.trades = [];
        this.slates = [];
        this.merchants = [];
        this.merchantItems = [];

        this.dashSystem.reset();

        if (this.scene.isActive('CombatScene')) this.scene.stop('CombatScene');

        if (this.mapKey !== 'summit-settlement') {
            this.createGlossaryUIButton();
        }

        this.cameras.main.setBackgroundColor('#111111');
        if (this.portalSystem) this.portalSystem.destroy();
        this.portalSystem = new PortalSystem(this);

        if (this.mapKey === 'summit-settlement') {
            this.createPlayerHpLevelHUD();
        }

        if (this.mapKey === 'hub' || this.mapKey === 'central-hub') this.createMap('central-hub');
        else this.createMap(this.mapKey);

        if (this.mapKey === 'summit-settlement' && this.runeIndicatorSystem?.hasPendingPillarDamage()) {
            this.time.delayedCall(850, () => {
                this.runeIndicatorSystem?.playPendingPillarDamage();
            });
        }

        let locId: string | null = null;
        if (this.mapKey === 'hub' || this.mapKey === 'central-hub') locId = 'central_hub';
        else if (this.mapKey === 'abandoned-settlement') locId = 'settlement_abandoned';
        else if (this.mapKey === 'desert-settlement') locId = 'settlement_desert';
        else if (this.mapKey === 'mechanic-settlement') locId = 'settlement_mechanic';
        else if (this.mapKey === 'boss-floor-abandoned') locId = 'boss_abandoned';
        else if (this.mapKey === 'boss-floor-desert') locId = 'boss_desert';
        else if (this.mapKey === 'boss-floor-mechanic') locId = 'boss_mechanic';
        else if (this.mapKey === 'summit-settlement') locId = 'summit';
        else if (this.mapKey === 'summit-trade') locId = 'summit_trade';
        else if (this.mapKey === 'merchant') locId = 'merchant';

        if (locId) {
            LocationData.getInstance().discoverLocation(locId);
            if (!LocationData.getInstance().isViewed(locId)) {
                const locationDisplay = LocationDisplayScene.ensureRunning(this);
                locationDisplay.showLocation(locId);
                LocationData.getInstance().markViewed(locId);
            }
        }

        if (!this.anims.exists('idle')) {
            this.anims.create({
                key: 'idle',
                frames: this.anims.generateFrameNumbers('protagonist-idle', {start: 0, end: 6}),
                frameRate: 8,
                repeat: -1
            });
            this.anims.create({
                key: 'run-start',
                frames: this.anims.generateFrameNumbers('protagonist-run', {start: 0, end: 7}),
                frameRate: 12,
                repeat: 0
            });
            this.anims.create({
                key: 'run-loop',
                frames: this.anims.generateFrameNumbers('protagonist-run', {start: 0, end: 7}),
                frameRate: 12,
                repeat: -1
            });
            this.anims.create({
                key: 'stop',
                frames: this.anims.generateFrameNumbers('protagonist-idle', {start: 0, end: 0}),
                frameRate: 12,
                repeat: 0
            });
            this.anims.create({
                key: 'dash',
                frames: this.anims.generateFrameNumbers('protagonist-dash', {start: 0, end: 11}),
                frameRate: 80,
                repeat: 0
            });
            this.anims.create({
                key: 'death',
                frames: this.anims.generateFrameNumbers('protagonist-death', {start: 0, end: 16}),
                frameRate: 12,
                repeat: 0
            });
        }

        this.cursors = this.input.keyboard!.createCursorKeys();
        this.keys = this.input.keyboard!.addKeys('W,A,S,D') as any;
        this.interactKey = this.input.keyboard!.addKey('X');
        this.glossaryKey = this.input.keyboard!.addKey('G');
        this.dashKey = this.input.keyboard!.addKey('SHIFT');

        this.input.keyboard!.on(InputKeys.GLOSSARY, () => {
            if (this.scene.isActive('GlossaryUI')) return;
            if (this.isDead) return;
            if (this.isCinematic) return;
            if (this.portalSystem.getIsTeleporting()) return;
            if (this.isHoldingGlossary) return;

            this.scene.pause();
            this.scene.launch('GlossaryUI', {
                previousScene: 'LevelScene',
                isPaused: true
            });
        });

        if (!this.anims.exists('door-open')) {
            const frames = [];
            for (let i = 0; i <= 13; i++) {
                const t = i / 13;
                frames.push({key: 'door-sheet', frame: i, duration: 60 + t * t * 200});
            }
            this.anims.create({key: 'door-open', frames, repeat: 0});
        }

        this.input.keyboard!.on(InputKeys.HELP, () => {
            if (!this.scene.isPaused()) {
                this.scene.pause();
                this.scene.launch('Help', {previousScene: 'LevelScene'});
            }
        });

        const w = this.scale.width, h = this.scale.height, camZoom = 2;
        const settingsScreenX = (w - 15 - w / 2) / camZoom + w / 2;
        const settingsScreenY = (h - 15 - h / 2) / camZoom + h / 2;
        this.settingsBtn = this.add.sprite(settingsScreenX, settingsScreenY, 'settings-btn').setOrigin(1, 1).setScrollFactor(0).setDepth(200).setScale(1 / camZoom).setInteractive({useHandCursor: true});
        this.settingsBtn.on('pointerover', () => this.settingsBtn.setTint(0xaaaaaa));
        this.settingsBtn.on('pointerout', () => this.settingsBtn.clearTint());
        this.settingsBtn.on('pointerdown', () => {
            if (!this.scene.isActive('Help')) {
                this.scene.pause();
                this.scene.launch('Help', {previousScene: 'LevelScene'});
            }
        });

        createVignette(this);
        this.damageOverlay = new DamageOverlay(this);
        if (this.mapKey === 'summit-settlement') {
            LightSystem.clearOverlay();
        } else {
            new LightSystem(this, 0.55, 0x000000);
        }

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.bossAttackSystem?.stopAttacks();
            this.summitBossHUD?.destroy();
            this.summitBossHUD = undefined;
            this.dashIndicatorHUD?.destroy();
            this.dashIndicatorHUD = undefined;
            this.persistPlayerLocation();
        });

        this.dashIndicatorHUD = new DashIndicatorHUD(this);

        if (this.mapKey !== 'summit-settlement') {
            new CombatTrackerHUD(this, this.mapKey);
        }

        if (this.raidhoRuneSystem) {
            this.raidhoRuneSystem.destroy();
            this.raidhoRuneSystem = undefined;
        }
        if (this.mapKey === 'hub' || this.mapKey === 'central-hub') {
            this.raidhoRuneSystem = new RaidhoRuneSystem(this, 0, 5);
        }

        this.matter.world.on('collisionstart', (event: any) => {
            event.pairs.forEach((pair: any) => {
                const {bodyA, bodyB} = pair;
                const gameObjectA = bodyA.gameObject;
                const gameObjectB = bodyB.gameObject;
                if (gameObjectA === this.player || gameObjectB === this.player) {
                    const other = gameObjectA === this.player ? gameObjectB : gameObjectA;
                    if (other && other.getData && typeof other.getData === 'function') {
                        if (other.getData('reverseSlow')) {
                            this.inReverseZone = true;
                            this.updateSlowFactor();
                        }
                        if (other.getData('isStair') && !this.inReverseZone) {
                            const stairId = other.getData('stairId') ?? (other as any).id;
                            if (stairId !== undefined) {
                                this.activeStairZones.add(stairId);
                                this.updateSlowFactor();
                            }
                        }
                        if (other.getData('target') && !this.isEntering) this.portalSystem.onPortalOverlap(other, this.player, this.mapKey);
                    }
                }
            });
        });

        this.matter.world.on('collisionend', (event: any) => {
            event.pairs.forEach((pair: any) => {
                const {bodyA, bodyB} = pair;
                const gameObjectA = bodyA.gameObject;
                const gameObjectB = bodyB.gameObject;
                if (gameObjectA === this.player || gameObjectB === this.player) {
                    const other = gameObjectA === this.player ? gameObjectB : gameObjectA;
                    if (other && other.getData && typeof other.getData === 'function') {
                        if (other.getData('reverseSlow')) {
                            this.inReverseZone = false;
                            this.updateSlowFactor();
                        }
                        if (other.getData('isStair') && !this.inReverseZone) {
                            const stairId = other.getData('stairId') ?? (other as any).id;
                            if (stairId !== undefined) {
                                this.activeStairZones.delete(stairId);
                                this.updateSlowFactor();
                            }
                        }
                    }
                }
            });
        });
    }

    private startGlossaryHold(): void {
        if (this.barrierActive) return;
        if (this.scene.isActive('GlossaryUI')) return;
        if (this.isCinematic) return;
        if (this.portalSystem.getIsTeleporting()) return;

        this.isHoldingGlossary = true;
        this.glossaryHoldProgress = 0;
        this.isGlossaryInteractable = false;
    }

    private cancelGlossaryHold(): void {
        if (!this.isHoldingGlossary) return;

        this.isHoldingGlossary = false;
        this.glossaryHoldProgress = 0;
        this.isGlossaryInteractable = true;
    }

    private completeGlossaryHold(): void {
        if (!this.isHoldingGlossary) return;

        this.isHoldingGlossary = false;
        this.glossaryHoldProgress = 0;
        this.isGlossaryInteractable = false;
        this.isCinematic = true;

        const darkVignette = createVignette(this, 99, true);
        darkVignette.setAlpha(0);

        fadeIn(this, darkVignette, 500, () => {
            this.cameras.main.shake(1000, 0.005);
            this.cameras.main.flash(500, 255, 255, 255);

            if (this.mapKey === 'summit-settlement') {
                this.playTentaclesAnimation();
            } else {
                this.activateBarrier();
            }

            fadeOutAndDestroy(this, darkVignette, 1000);

            this.time.delayedCall(1500, () => {
                this.isCinematic = false;
            });
        });
    }

    private playTentaclesAnimation(startLoop = false): void {
        const centerX = this.glossaryTentaclesX;
        const centerY = this.glossaryTentaclesY;

        if (!this.anims.exists('tentaclesRise')) {
            const totalFrames = this.textures.get('tentacles').getFrameNames().length;
            this.anims.create({
                key: 'tentaclesRise',
                frames: this.anims.generateFrameNumbers('tentacles', {start: 0, end: totalFrames - 6}),
                frameRate: 24,
                repeat: 0
            });
            this.anims.create({
                key: 'tentaclesLoop',
                frames: this.anims.generateFrameNumbers('tentacles', {start: totalFrames - 4, end: totalFrames - 1}),
                frameRate: 12,
                repeat: -1,
                yoyo: true
            });
            this.anims.create({
                key: 'tentaclesRetract',
                frames: this.anims.generateFrameNumbers('tentacles', {start: totalFrames - 6, end: 0}),
                frameRate: 20,
                repeat: 0
            });
        }

        if (this.tentaclesAnimation?.active) {
            if (startLoop) {
                this.tentaclesAnimation.play('tentaclesLoop');
            }
            this.runeIndicatorSystem?.setTentaclesAnimation(this.tentaclesAnimation);
            return;
        }

        this.tentaclesAnimation = this.add.sprite(centerX + 4, centerY - 4, 'tentacles');
        this.tentaclesAnimation.setOrigin(0.5, 0.5);
        this.tentaclesAnimation.setDepth(100);

        if (startLoop) {
            this.tentaclesAnimation.play('tentaclesLoop');
            this.runeIndicatorSystem?.setTentaclesAnimation(this.tentaclesAnimation);
        } else {
            this.tentaclesAnimation.play('tentaclesRise');
            this.tentaclesAnimation.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                if (this.tentaclesAnimation?.active) {
                    this.tentaclesAnimation.play('tentaclesLoop');
                }
                this.activateBarrier();
                if (this.runeIndicatorSystem) {
                    this.runeIndicatorSystem.setTentaclesAnimation(this.tentaclesAnimation);
                }
            });
        }
    }

    private ensureTentaclesV2Anims(): void {
        if (this.anims.exists('tentaclesV2Rise')) return;

        this.anims.create({
            key: 'tentaclesV2Rise',
            frames: this.anims.generateFrameNumbers('tentacles-v2', {start: 0, end: 5}),
            frameRate: 24,
            repeat: 0
        });
        this.anims.create({
            key: 'tentaclesV2Loop',
            frames: this.anims.generateFrameNumbers('tentacles-v2', {start: 6, end: 8}),
            frameRate: 12,
            repeat: -1,
            yoyo: true
        });
        this.anims.create({
            key: 'tentaclesV2Retract',
            frames: this.anims.generateFrameNumbers('tentacles-v2', {start: 5, end: 0}),
            frameRate: 20,
            repeat: 0
        });
    }

    private playTentaclesV2Animation(startLoop = false): void {
        if (this.tentaclesV2Animation?.active) {
            if (startLoop && this.anims.exists('tentaclesV2Loop')) {
                this.tentaclesV2Animation.play('tentaclesV2Loop');
            }
            return;
        }

        this.ensureTentaclesV2Anims();

        const centerX = this.glossaryTentaclesX;
        const centerY = this.glossaryTentaclesY;
        this.tentaclesV2Animation = this.add.sprite(centerX + 4, centerY - 4, 'tentacles-v2');
        this.tentaclesV2Animation.setOrigin(0.5, 0.5);
        this.tentaclesV2Animation.setDepth(101);

        if (startLoop) {
            this.tentaclesV2Animation.play('tentaclesV2Loop');
        } else {
            this.tentaclesV2Animation.play('tentaclesV2Rise');
            this.tentaclesV2Animation.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                if (this.tentaclesV2Animation?.active) {
                    this.tentaclesV2Animation.play('tentaclesV2Loop');
                }
            });
        }
    }

    private retractTentaclesV2(onComplete?: () => void): void {
        if (!this.tentaclesV2Animation?.active) {
            onComplete?.();
            return;
        }

        const sprite = this.tentaclesV2Animation;
        if (this.anims.exists('tentaclesV2Retract')) {
            sprite.play('tentaclesV2Retract');
            sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                sprite.destroy();
                if (this.tentaclesV2Animation === sprite) {
                    this.tentaclesV2Animation = undefined;
                }
                onComplete?.();
            });
        } else {
            sprite.destroy();
            this.tentaclesV2Animation = undefined;
            onComplete?.();
        }
    }

    private showBossEye(): void {
        if (this.bossEyeVisible) return;
        this.bossEyeVisible = true;

        const centerX = this.glossaryTentaclesX;
        const centerY = this.glossaryTentaclesY - 10;
        const bgX = centerX + 6;
        const bgY = centerY - 10;

        if (!this.anims.exists('bossEyeBgAnim')) {
            this.anims.create({
                key: 'bossEyeBgAnim',
                frames: this.anims.generateFrameNumbers('boss-eye-bg', {start: 0, end: 6}),
                frameRate: 12,
                repeat: 0
            });
        }

        this.bossEyeBg = this.add.sprite(bgX, bgY, 'boss-eye-bg');
        this.bossEyeBg.setOrigin(0.5, 0.5);
        this.bossEyeBg.setDepth(102);
        this.bossEyeBg.setAlpha(0);
        this.bossEyeBg.setScale(1);

        this.bossEyeBg.play('bossEyeBgAnim');

        this.tweens.add({
            targets: this.bossEyeBg,
            alpha: 1,
            duration: 200,
            ease: 'Linear',
            onComplete: () => {
                if (this.bossEyeBg) {
                    this.bossEyeBg.setFrame(6);

                    this.bossEyeIdle = this.add.image(centerX, centerY, 'boss-eye');
                    this.bossEyeIdle.setOrigin(0.5, 0.5);
                    this.bossEyeIdle.setDepth(103);
                    this.bossEyeIdle.setAlpha(0);
                    this.bossEyeIdle.setScale(1);

                    this.tweens.add({
                        targets: this.bossEyeIdle,
                        alpha: 1,
                        scale: 1,
                        duration: 150,
                        ease: 'Back.Out',
                        onComplete: () => {
                            this.startEyeIdleAnimation();
                        }
                    });
                }
            }
        });
    }

    private startEyeIdleAnimation(): void {
        if (!this.bossEyeIdle) return;

        const centerX = this.glossaryTentaclesX;
        const centerY = this.glossaryTentaclesY - 10;

        const randomMove = () => {
            if (!this.bossEyeIdle) return;

            const offsetX = (Math.random() - 0.5) * 8;
            const offsetY = (Math.random() - 0.5) * 6;

            this.tweens.add({
                targets: this.bossEyeIdle,
                x: centerX + offsetX,
                y: centerY + offsetY,
                duration: 50 + Math.random() * 60,
                ease: 'Quad.easeInOut',
                yoyo: true,
                hold: 60 + Math.random() * 120,
                onComplete: () => {
                    if (this.bossEyeIdle) {
                        this.bossEyeIdle.setPosition(centerX, centerY);
                    }
                    randomMove();
                }
            });
        };

        randomMove();
    }

    private hideBossEye(): void {
        if (!this.bossEyeVisible) return;

        if (this.bossEyeIdle) {
            this.tweens.killTweensOf(this.bossEyeIdle);
            this.bossEyeIdle.destroy();
            this.bossEyeIdle = undefined;
        }

        if (this.bossEyeBg) {
            this.bossEyeBg.destroy();
            this.bossEyeBg = undefined;
        }

        this.bossEyeVisible = false;
    }

    private onBossPillarDamaged(pillarsDefeated: number): void {
        this.summitBossHUD?.onPillarDefeated(pillarsDefeated);
        if (pillarsDefeated >= 1) {
            this.playTentaclesV2Animation(false);
        }
        if (pillarsDefeated >= 3 && !this.bossEyeVisible) {
            this.showBossEye();
        }
        if (pillarsDefeated >= 4 && !this.isBossDefeatedSequence) {
            this.onBossDefeated();
        }
    }

    private onBossDefeated(): void {
        if (this.isBossDefeatedSequence) return;
        this.isBossDefeatedSequence = true;
        this.isCinematic = true;
        this.bossAttackSystem?.stopAttacks();
        this.runeIndicatorSystem?.stopBattle();

        const glossaryCenterX = this.glossaryTentaclesX;
        const glossaryCenterY = this.glossaryTentaclesY;

        this.cameras.main.pan(glossaryCenterX, glossaryCenterY, 1200, 'Quad.easeInOut');

        this.time.delayedCall(1200, () => {
            if (this.levelHpHudIcon) {
                this.tweens.add({
                    targets: [this.levelHpHudIcon, this.levelHpHudText],
                    alpha: 0,
                    duration: 3000,
                    ease: 'Sine.easeOut'
                });
            }

            if (this.summitBossHUD) {
                this.tweens.add({
                    targets: this.summitBossHUD,
                    alpha: 0,
                    duration: 3000,
                    ease: 'Sine.easeOut',
                    onComplete: () => {
                    }
                });
            }

            this.time.delayedCall(1000, () => {
                this.cameras.main.flash(200, 255, 0, 0);
                ScreenShake.trigger(this, 500);

                if (this.tentaclesAnimation?.anims) {
                    this.tentaclesAnimation.stop();
                    this.tentaclesAnimation.setFrame(0);
                    this.tentaclesAnimation.play('tentaclesLoop');
                }

                if (this.tentaclesV2Animation?.anims) {
                    this.tentaclesV2Animation.stop();
                    this.tentaclesV2Animation.setFrame(0);
                    this.tentaclesV2Animation.play('tentaclesV2Loop');
                }

                if (this.bossEyeIdle) {
                    this.bossEyeIdle.setTexture('boss-eye');
                }

                this.time.delayedCall(1000, () => {
                    this.cameras.main.pan(this.player.x, this.player.y, 800, 'Quad.easeInOut');

                    this.time.delayedCall(800, () => {
                        this.isCinematic = false;
                        this.waitingForBossChoice = true;
                    });
                });
            });
        });
    }

    private showReplaceGlossaryPrompt(): void {
        const centerX = this.glossaryTentaclesX;
        const centerY = this.glossaryTentaclesY - 60;

        this.replaceGlossaryText = this.add.text(centerX, centerY, 'Press X to replace glossary', {
            fontFamily: FONT_FAMILY,
            fontSize: '20px',
            color: '#e4dacf',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5).setDepth(251).setScrollFactor(0);
    }

    private hideReplaceGlossaryPrompt(): void {
        if (this.replaceGlossaryText) {
            this.replaceGlossaryText.destroy();
            this.replaceGlossaryText = undefined;
        }
    }

    private completeBossDefeatedSequence(): void {
        this.isCinematic = true;
        this.waitingForBossChoice = false;
        this.hideReplaceGlossaryPrompt();

        const darkVignette = createVignette(this, 99, true);
        darkVignette.setAlpha(0);

        fadeIn(this, darkVignette, 3000, () => {
            PlayerData.getInstance().replaceGlossary();
            PlayerData.getInstance().save();
            localStorage.removeItem('glossary_boss_fight_active');
            localStorage.removeItem('glossary_boss_pillars_defeated');
            localStorage.removeItem('glossary_boss_current_combat_pillar');

            fadeOutAndDestroy(this, darkVignette, 500, () => {
                this.scene.launch('TransitionScene', {
                    targetScene: 'LevelScene',
                    currentScene: 'LevelScene',
                    targetData: { mapKey: 'hub' }
                });
                this.scene.launch('GameOver');
            });
        });
    }

    private ensureSummitBossHUD(): void {
        if (this.summitBossHUD && !this.summitBossHUD.isAlive()) {
            this.summitBossHUD = undefined;
        }
        if (!this.summitBossHUD) {
            this.summitBossHUD = new SummitBossHUD(this);
        }
        this.summitBossHUD.setBattleVisible(true);
    }

    private activateBarrier(): void {
        if (this.barrierActive) return;

        this.barrierActive = true;

        if (this.glossaryInteractZone) {
            this.glossaryInteractZone.disableInteractive();
        }

        for (const layer of this.barrierLayers) {
            layer.setVisible(true);
            layer.setDepth(10);
        }

        for (const obj of this.barrierCollisionObjects) {
            const barrierSprite = this.add.rectangle(obj.x, obj.y, obj.width, obj.height, 0x000000, 0);
            this.matter.add.gameObject(barrierSprite, {isStatic: true, label: 'barrier'});
            barrierSprite.setData('type', 'barrier');
            this.barrierBodies.push(barrierSprite.body as MatterJS.BodyType);
        }

        this.ensureSummitBossHUD();
        this.setPlayerHpHudVisible(true);

        if (this.runeIndicatorSystem) {
            this.runeIndicatorSystem.startBattle(() => {
                this.deactivateBarrier();
            });
            const defeated = this.runeIndicatorSystem.getPillarsDefeated();
            if (this.runeIndicatorSystem.hasPendingPillarDamage()) {
                this.summitBossHUD?.syncPillarsDefeated(Math.max(0, defeated - 1));
            } else {
                this.summitBossHUD?.syncPillarsDefeated(defeated);
            }
        }
    }

    private deactivateBarrier(): void {
        if (!this.barrierActive) return;

        this.barrierActive = false;

        for (const layer of this.barrierLayers) {
            layer.setVisible(false);
        }

        for (const body of this.barrierBodies) {
            if (body && this.matter.world) {
                this.matter.world.remove(body);
            }
        }
        this.barrierBodies = [];

        if (this.glossaryInteractZone) {
            this.glossaryInteractZone.setInteractive();
        }

        this.summitBossHUD?.setBattleVisible(false);
        this.setPlayerHpHudVisible(false);
        this.tentaclesAnimation = undefined;
        this.retractTentaclesV2();
        this.hideBossEye();
    }

    private updateGlossaryHold(delta: number): void {
        if (!this.isHoldingGlossary) return;

        const isGlossaryKeyDown = this.glossaryKey.isDown;
        const isInteractKeyDown = this.interactKey.isDown;

        if (!isGlossaryKeyDown && !isInteractKeyDown) {
            this.cancelGlossaryHold();
            return;
        }

        this.glossaryHoldProgress += delta;

        if (this.glossaryHoldProgress >= this.glossaryHoldDuration) {
            this.completeGlossaryHold();
        }
    }

    private updateSlowFactor(): void {
        if (this.inReverseZone) this.targetSlowFactor = 1;
        else if (this.activeStairZones.size > 0) this.targetSlowFactor = 0.6;
        else this.targetSlowFactor = 1;
    }

    private createMap(mapKey: string) {
        this.doors = [];
        this.settlementDoors = [];
        this.mechanicDoors = [];
        this.bossButtons = [];
        this.chests = [];
        this.trades = [];
        this.slates = [];
        this.merchants = [];
        this.barrierCollisionObjects = [];
        this.barrierLayers = [];
        this.barrierBodies = [];
        this.barrierActive = false;

        const map = this.make.tilemap({key: mapKey});
        const tilesets: Phaser.Tilemaps.Tileset[] = [];
        map.tilesets.forEach(ts => {
            const boundTileset = map.addTilesetImage(ts.name, ts.name + '.png');
            if (boundTileset) tilesets.push(boundTileset);
        });
        map.layers.forEach((layerData, i) => {
            const layer = map.createLayer(layerData.name, tilesets);
            if (layer) {
                let depthVal = i;
                const props = layerData.properties;
                if (props) {
                    if (Array.isArray(props)) {
                        const depthProp = props.find((p: any) => p && p.name === 'depth');
                        if (depthProp && depthProp.value !== undefined) depthVal = Number(depthProp.value);
                    } else if (typeof props === 'object') {
                        const depthProp = (props as any)['depth'];
                        if (depthProp !== undefined) depthVal = Number(typeof depthProp === 'object' ? depthProp.value : depthProp);
                    }
                }
                if (layerData.name.toLowerCase().includes('slate')) depthVal = this.getPlayerDepth(mapKey) - 1;
                if (layerData.name === 'Barrier' || layerData.name === 'Barrier+') {
                    this.barrierLayers.push(layer);
                    layer.setVisible(false);
                }
                if (layerData.name === 'Barrier') {
                    layer.setDepth(depthVal + 1);
                } else {
                    layer.setDepth(depthVal);
                }
                if (mapKey === 'central-hub' && isPipeLayer(layerData.name)) fillPipeLayer(layer);
            }
        });

        this.cameras.main.setZoom(2);
        this.matter.world.setBounds(-2000, -2000, 4000, 4000);
        parseCollisionObjects(this, map.objects);

        const barrierCollisionLayers = map.objects.filter(layer => layer.name.toLowerCase().includes('barrier'));

        for (const barrierLayer of barrierCollisionLayers) {
            if (barrierLayer.objects) {
                for (const obj of barrierLayer.objects) {
                    this.barrierCollisionObjects.push({
                        x: obj.x + (obj.width / 2),
                        y: obj.y + (obj.height / 2),
                        width: obj.width,
                        height: obj.height
                    });
                }
            }
        }

        const stairsLayer = map.objects.find(layer => layer.name.toLowerCase() === 'stairs');
        if (stairsLayer) parseStairObjects(this, stairsLayer, this.stairZones);

        const portalsLayer = map.objects.find(layer => layer.name.toLowerCase() === 'portals');
        if (portalsLayer) this.portalSystem.parsePortals(portalsLayer, this.mapKey, this.previousMap);

        const merchantEntranceLayer = map.objects.find(layer => layer.name === 'merchant_entrance');
        if (merchantEntranceLayer) this.portalSystem.parseMerchantEntrances(merchantEntranceLayer);

        const doorLayer = map.objects.find(layer => layer.name.toLowerCase() === 'door');
        if (doorLayer) {
            if (mapKey === 'mechanic-settlement' || mapKey === 'abandoned-settlement') this.mechanicDoors = createMechanicDoors(this, doorLayer, mapKey);
            else this.doors = createDoors(this, doorLayer);
        }

        this.settlementDoors = createSettlementDoors(this, map, mapKey);

        const buttonLayer = map.objects.find(layer => layer.name.toLowerCase() === 'button');
        if (buttonLayer) this.bossButtons = createBossButtons(this, buttonLayer, mapKey);

        const chestLayer = map.objects.find(layer => layer.name.toLowerCase() === 'chests');
        if (chestLayer) this.chests = createChests(this, chestLayer, mapKey, this.getPlayerDepth(mapKey) - 1);

        const tradeLayer = map.objects.find(layer => layer.name.toLowerCase() === 'trades');
        if (tradeLayer) this.trades = createTrades(this, tradeLayer, mapKey);

        const slateLayer = map.objects.find(layer => layer.name.toLowerCase() === 'slates');
        if (slateLayer) this.slates = createSlates(this, slateLayer, mapKey);
        else this.slates = [];

        const fillersLayer = map.objects.find(layer => layer.name.toLowerCase() === 'fillers');
        if (fillersLayer) {
            const fillerSlates = createSlates(this, fillersLayer, mapKey);
            const fillerIds = ['slate_ancestry', 'slate_void', 'slate_whispers'];
            fillerSlates.forEach((slate, index) => {
                slate.slateId = fillerIds[index % fillerIds.length];
            });
            this.slates.push(...fillerSlates);
        }

        const merchantLayer = map.objects.find(layer => layer.name.toLowerCase() === 'merchant');
        if (merchantLayer) {
            this.merchants = createMerchants(this, merchantLayer);
            this.generateMerchantItems();
        } else {
            this.merchants = [];
            this.merchantItems = [];
        }

        const glossaryLayer = map.objects.find(layer => layer.name.toLowerCase() === 'glossary');
        if (glossaryLayer && glossaryLayer.objects && glossaryLayer.objects[0]) {
            const glossaryObj = glossaryLayer.objects[0];
            const glossaryWorldX = glossaryObj.x + (glossaryObj.width / 2);
            const glossaryWorldY = glossaryObj.y + (glossaryObj.height / 2);
            this.glossaryTentaclesX = glossaryWorldX;
            this.glossaryTentaclesY = glossaryWorldY;

            this.glossaryInteractZone = this.add.zone(glossaryWorldX, glossaryWorldY, glossaryObj.width, glossaryObj.height);
            this.glossaryInteractZone.setInteractive();
        } else {
            this.glossaryInteractZone = null;
            this.glossaryTentaclesX = 0;
            this.glossaryTentaclesY = 0;
        }

        const spawn = map.objects.find(layer => layer.name.toLowerCase() === 'spawn')?.objects?.[0];
        const OFFSET = 54;
        const spawnPos = this.portalSystem.calculateSpawn(portalsLayer, merchantEntranceLayer, mapKey, this.previousMap, OFFSET);
        let spawnX = spawnPos.x, spawnY = spawnPos.y;

        if (spawn) {
            spawnX = spawn.x + (spawn.width / 2);
            spawnY = spawn.y + (spawn.height / 2);
        }

        this.spawnPlayer(this.overrideSpawnX ?? spawnX, this.overrideSpawnY ?? spawnY);
        this.overrideSpawnX = null;
        this.overrideSpawnY = null;
        const playerDepth = this.getPlayerDepth(mapKey);
        this.player.setDepth(playerDepth);
        this.playerShadow.setDepth(playerDepth);

        if (mapKey === 'summit-settlement') {
            this.bossAttackSystem = new BossAttackSystem(this, this.player);
            if (this.barrierCollisionObjects.length > 0) {
                const pillarsLayer = map.objects.find(layer => layer.name.toLowerCase() === 'pillars');
                const customPillarPositions: { x: number; y: number }[] = [];
                if (pillarsLayer && pillarsLayer.objects) {
                    for (const obj of pillarsLayer.objects) {
                        if (obj.x !== undefined && obj.y !== undefined && obj.width !== undefined && obj.height !== undefined) {
                            customPillarPositions.push({
                                x: obj.x + (obj.width / 2),
                                y: obj.y + (obj.height / 2)
                            });
                        }
                    }
                    customPillarPositions.sort((a, b) => a.y - b.y || a.x - b.x);
                }

                this.runeIndicatorSystem = new RuneIndicatorSystem(this, this.player, this.barrierCollisionObjects, customPillarPositions);
                this.runeIndicatorSystem.setBossAttackSystem(this.bossAttackSystem);
                this.runeIndicatorSystem.setOnPillarDamaged((count) => {
                    this.onBossPillarDamaged(count);
                });
                if (this.tentaclesAnimation) {
                    this.runeIndicatorSystem.setTentaclesAnimation(this.tentaclesAnimation);
                }
            }

            if (localStorage.getItem('glossary_boss_fight_active') === 'true') {
                const pillarsDefeated = parseInt(localStorage.getItem('glossary_boss_pillars_defeated') || '0', 10);
                this.playTentaclesAnimation(true);
                if (pillarsDefeated >= 1) {
                    this.playTentaclesV2Animation(true);
                }
                if (pillarsDefeated >= 3) {
                    this.showBossEye();
                }
                if (pillarsDefeated >= 4) {
                    this.onBossDefeated();
                } else {
                    this.activateBarrier();
                }
            }
        }

        if (this.isTeleportingFromRune) this.cameras.main.fadeIn(1200, 255, 255, 255);
        else this.cameras.main.fadeIn(800, 0, 0, 0);

        if (this.entryDirX !== 0 || this.entryDirY !== 0) {
            this.isEntering = true;
            if (this.entryDirX < 0) this.player.setFlipX(true);
            else if (this.entryDirX > 0) this.player.setFlipX(false);
            const duration = this.previousMap === 'merchant' ? 200 : 400;
            this.time.delayedCall(duration, () => {
                this.isEntering = false;
            });
        }

        this.updatePlayerPositionCache();
        this.persistPlayerLocation();
    }

    private updatePlayerPositionCache(): void {
        if (!this.player?.active) return;
        const body = this.player.body as MatterJS.BodyType | null;
        if (!body) return;
        this.cachedPlayerX = body.position.x;
        this.cachedPlayerY = body.position.y;
        this.hasPlayerPositionCache = true;
    }

    private persistPlayerLocation(): void {
        if (this.isDead) return;
        const playerData = PlayerData.getInstance();
        const mapKey = this.mapKey === 'central-hub' ? 'hub' : this.mapKey;
        if (mapKey === 'summit-settlement') {
            playerData.setLastLocation('summit-settlement', null, null);
        } else if (this.hasPlayerPositionCache) {
            playerData.setLastLocation(mapKey, this.cachedPlayerX, this.cachedPlayerY);
        }
    }

    private spawnPlayer(x: number, y: number) {
        this.player = this.matter.add.sprite(x, y, 'protagonist-idle');
        this.player.setDepth(15);
        this.player.setRectangle(20, 6, {chamfer: {radius: 2}});
        this.player.setOrigin(0.5, 0.67);
        this.player.setFixedRotation();
        this.player.setFriction(1);
        this.player.setFrictionAir(0.05);
        this.player.setFrictionStatic(1);
        this.player.setBounce(0);
        this.player.setMass(10);

        this.playerShadow = this.add.image(x, y + 16, 'protagonist-shadow');
        this.playerShadow.setOrigin(0.5, 1.06);
        this.playerShadow.setDepth(14);
        this.playerShadow.setAlpha(0.6);
        this.playerShadow.setScale(0.8);

        this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
        this.player.play('idle');
    }

    update(_time: number, delta: number) {
        const playerData = PlayerData.getInstance();
        if (this.levelHpHudText && !this.isBossDefeatedSequence) {
            this.levelHpHudText.setText(`${playerData.hp} / ${playerData.maxHp}`);
        }

        if (playerData.hp <= 0 && !this.isDead) {
            this.triggerPlayerDeath();
            return;
        }

        if (this.isDead) {
            this.player.setVelocity(0, 0);
            return;
        }

        if (this.isBossDefeatedSequence) {
            this.player.setVelocity(0, 0);
            if (this.player.anims.currentAnim?.key !== 'idle') {
                this.player.play('idle');
            }
            if (this.playerShadow && this.player.active) {
                this.playerShadow.setPosition(this.player.x, this.player.y + 16);
            }
            return;
        }

        if (this.waitingForBossChoice) {
            if (this.glossaryInteractZone && this.glossaryInteractZone.getBounds().contains(this.player.x, this.player.y)) {
                if (!this.replaceGlossaryText) {
                    this.showReplaceGlossaryPrompt();
                }
                if (this.interactKey.isDown && !this.isCinematic) {
                    this.completeBossDefeatedSequence();
                }
            } else {
                this.hideReplaceGlossaryPrompt();
            }

            this.player.setVelocity(0, 0);
            if (this.player.anims.currentAnim?.key !== 'idle') {
                this.player.play('idle');
            }
            if (this.playerShadow && this.player.active) {
                this.playerShadow.setPosition(this.player.x, this.player.y + 16);
            }
            return;
        }

        this.updatePlayerPositionCache();
        this.persistSaveTimer += delta;
        if (this.persistSaveTimer >= this.persistSaveIntervalMs) {
            this.persistSaveTimer = 0;
            this.persistPlayerLocation();
        }

        if (this.glossaryInteractZone) {
            this.isNearGlossary = this.glossaryInteractZone.getBounds().contains(this.player.x, this.player.y);
        }

        if (this.isNearGlossary && this.isGlossaryInteractable && !this.barrierActive && !this.isHoldingGlossary && !this.isBossDefeatedSequence && !this.waitingForBossChoice) {
            this.interactSystem.show(this.glossaryInteractZone!.x, this.glossaryInteractZone!.y - 30, 0);

            if ((this.interactKey.isDown || this.glossaryKey.isDown) && !this.isHoldingGlossary) {
                this.startGlossaryHold();
            }
        }

        if (this.isHoldingGlossary) {
            this.updateGlossaryHold(delta);

            const progress = Math.min(1, this.glossaryHoldProgress / this.glossaryHoldDuration);
            this.interactSystem.show(this.glossaryInteractZone!.x, this.glossaryInteractZone!.y - 30, progress);
        }

        if (this.bossAttackSystem) this.bossAttackSystem.update();
        if (this.runeIndicatorSystem) this.runeIndicatorSystem.update(delta, this.interactKey.isDown);
        this.dashIndicatorHUD?.update(this.dashSystem);
        if (this.damageOverlay) this.damageOverlay.update(_time);

        if (this.pushDurationTimer > 0) {
            this.pushDurationTimer -= delta;
            this.player.setVelocity(this.pushVelocity.x, this.pushVelocity.y);
            if (this.playerShadow && this.player.active) {
                this.playerShadow.setPosition(this.player.x, this.player.y + 16);
                this.playerShadow.setFlipX(this.player.flipX);
            }
            return;
        }

        if (this.dashSystem.updateTimers(delta, this.player, this.playerShadow)) return;

        handleDoorInteraction(this, this.doors, this.player, this.interactKey.isDown, delta, this.isCinematic, this.portalSystem.getIsTeleporting(), this.isEntering, (val) => {
            this.isCinematic = val;
        });
        handleSettlementDoorInteraction(this, this.settlementDoors, this.player, this.interactKey.isDown, this.wasInteractPressed);
        handleMechanicDoorInteraction(this, this.mechanicDoors, this.player, this.interactKey.isDown, this.wasInteractPressed);
        handleBossButtonInteraction(this, this.bossButtons, this.player, this.interactKey.isDown, this.isCinematic, this.portalSystem.getIsTeleporting(), this.isEntering, (val) => {
            this.isCinematic = val;
        }, this.mapKey, delta);
        handleChestInteraction(this, this.chests, this.player, this.interactKey.isDown, delta, this.isCinematic, this.portalSystem.getIsTeleporting(), this.isEntering);
        if (this.mapKey === 'summit-trade') handleTradeInteraction(this, this.trades, this.player, this.interactKey.isDown, this.wasInteractPressed, (val) => {
            this.isCinematic = val;
        });
        handleSlateInteraction(this, this.slates, this.player, this.interactKey.isDown, this.wasInteractPressed, this.isCinematic, this.portalSystem.getIsTeleporting(), this.isEntering, this.mapKey);
        if (this.raidhoRuneSystem) this.raidhoRuneSystem.update(this.player, this.interactKey.isDown, delta, this.isCinematic, this.portalSystem.getIsTeleporting(), this.isEntering, (val) => {
            this.isCinematic = val;
        });
        if (this.mapKey === 'merchant') handleMerchantInteraction(this, this.merchants, this.player, this.interactKey.isDown, this.wasInteractPressed, this.isCinematic, this.portalSystem.getIsTeleporting(), this.isEntering);

        this.currentSlowFactor = Phaser.Math.Linear(this.currentSlowFactor, this.targetSlowFactor, 0.05);
        const runSpeed = 3 * this.currentSlowFactor;
        const body = this.player.body as MatterJS.BodyType;

        let moveX = 0, moveY = 0, moving = false;

        if (this.portalSystem.getIsTeleporting()) {
            const dir = this.portalSystem.getTeleportDirection();
            moveX = dir.x;
            moveY = dir.y;
            if (moveX < 0) this.player.setFlipX(true);
            else if (moveX > 0) this.player.setFlipX(false);
            const modifier = this.portalSystem.getTeleportSpeedModifier();
            const currentSpeed = runSpeed * modifier;
            const isTeleportStopped = modifier === 0;
            if (isTeleportStopped) {
                this.player.setVelocity(body.velocity.x * 0.85, body.velocity.y * 0.85);
                this.player.anims.timeScale = 1;
                if (this.player.anims.currentAnim?.key === 'run-start' || this.player.anims.currentAnim?.key === 'run-loop') this.player.play('stop').chain('idle');
                else if (this.player.anims.currentAnim?.key !== 'stop' && this.player.anims.currentAnim?.key !== 'idle') this.player.play('idle');
            } else {
                const inputVelocity = new Phaser.Math.Vector2(moveX, moveY).normalize().scale(currentSpeed);
                this.player.setVelocity(inputVelocity.x, inputVelocity.y);
                this.player.anims.timeScale = this.currentSlowFactor * modifier;
                if (this.player.anims.currentAnim?.key !== 'run-start' && this.player.anims.currentAnim?.key !== 'run-loop') this.player.play('run-start').chain('run-loop');
            }
        } else if (this.isEntering) {
            const inputVelocity = new Phaser.Math.Vector2(this.entryDirX, this.entryDirY).normalize().scale(runSpeed);
            this.player.setVelocity(inputVelocity.x, inputVelocity.y);
            this.player.anims.timeScale = this.currentSlowFactor;
            if (this.player.anims.currentAnim?.key !== 'run-start' && this.player.anims.currentAnim?.key !== 'run-loop') this.player.play('run-start').chain('run-loop');
        } else if (this.isCinematic) {
        } else if (this.isHoldingGlossary) {
            this.player.setVelocity(body.velocity.x * 0.85, body.velocity.y * 0.85);
            this.player.anims.timeScale = 1;
            if (this.player.anims.currentAnim?.key === 'run-start' || this.player.anims.currentAnim?.key === 'run-loop') this.player.play('stop').chain('idle');
            else if (this.player.anims.currentAnim?.key !== 'stop' && this.player.anims.currentAnim?.key !== 'idle') this.player.play('idle');
        } else {
            const left = this.cursors.left.isDown || this.keys.A.isDown;
            const right = this.cursors.right.isDown || this.keys.D.isDown;
            const up = this.cursors.up.isDown || this.keys.W.isDown;
            const down = this.cursors.down.isDown || this.keys.S.isDown;

            moveX = (right ? 1 : 0) - (left ? 1 : 0);
            moveY = (down ? 1 : 0) - (up ? 1 : 0);
            moving = (moveX !== 0 || moveY !== 0);

            if (moving) {
                if (moveX < 0) this.player.setFlipX(true);
                else if (moveX > 0) this.player.setFlipX(false);
                const inputVelocity = new Phaser.Math.Vector2(moveX, moveY).normalize().scale(runSpeed);
                this.player.setVelocity(inputVelocity.x, inputVelocity.y);
                this.player.anims.timeScale = this.currentSlowFactor;
                if (this.player.anims.currentAnim?.key !== 'run-start' && this.player.anims.currentAnim?.key !== 'run-loop') this.player.play('run-start').chain('run-loop');
            } else {
                this.player.setVelocity(body.velocity.x * 0.85, body.velocity.y * 0.85);
                this.player.anims.timeScale = 1;
                if (this.player.anims.currentAnim?.key === 'run-start' || this.player.anims.currentAnim?.key === 'run-loop') this.player.play('stop').chain('idle');
                else if (this.player.anims.currentAnim?.key !== 'stop' && this.player.anims.currentAnim?.key !== 'idle') this.player.play('idle');
            }
        }

        const dashJustPressed = Phaser.Input.Keyboard.JustDown(this.dashKey);
        const canDash = !this.portalSystem.getIsTeleporting() && !this.isEntering && !this.isCinematic && !this.isHoldingGlossary;
        this.dashSystem.tryTrigger(dashJustPressed, moveX, moveY, this.player, canDash);

        if (this.playerShadow && this.player.active) {
            this.playerShadow.setPosition(this.player.x, this.player.y + 16);
            this.playerShadow.setFlipX(this.player.flipX);
        }
    }

    private getPlayerDepth(mapKey: string): number {
        switch (mapKey) {
            case 'boss-floor-abandoned':
                return 9;
            case 'boss-floor-desert':
                return 12;
            case 'boss-floor-mechanic':
                return 10;
            case 'summit-settlement':
                return 9;
            case 'abandoned-settlement':
                return 13;
            case 'desert-settlement':
                return 14;
            case 'mechanic-settlement':
                return 13;
            case 'summit-trade':
                return 4;
            case 'merchant':
                return 9;
            default:
                return 14;
        }
    }

    private generateMerchantItems(): void {
        const allItems = ItemData.getAllItems();
        const pd = PlayerData.getInstance();
        const undiscovered = allItems.filter(item => !ItemData.getInstance().isDiscovered(item.id) && pd.getItemQuantity(item.id.toString()) === 0);
        const pool = [...undiscovered];
        if (pool.length < 3) {
            const others = allItems.filter(item => !pool.includes(item));
            pool.push(...others);
        }
        const selected: ItemDefinition[] = [];
        const tempPool = [...pool];
        while (selected.length < 3 && tempPool.length > 0) {
            const randIdx = Math.floor(Math.random() * tempPool.length);
            selected.push(tempPool.splice(randIdx, 1)[0]);
        }
        while (selected.length < 3) selected.push(allItems[0]);
        this.merchantItems = selected;
    }

    private createPlayerHpLevelHUD(): void {
        const w = this.scale.width;
        const h = this.scale.height;
        const camZoom = 2;

        const hpLeftX = 40;
        const hpTopY = 32;

        const cx = (hpLeftX - w / 2) / camZoom + w / 2;
        const cy = (hpTopY - h / 2) / camZoom + h / 2;

        this.levelHpHudIcon = this.add.sprite(cx, cy, 'currency', 0)
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setDepth(201)
            .setScale(2 / camZoom);

        const playerData = PlayerData.getInstance();
        this.levelHpHudText = this.add.text(cx + 40 / camZoom, cy, `${playerData.hp} / ${playerData.maxHp}`, {
            fontSize: '18px',
            color: '#FFFFFF',
            fontFamily: FONT_FAMILY
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(201).setScale(1 / camZoom);

        this.setPlayerHpHudVisible(false);
    }

    private setPlayerHpHudVisible(visible: boolean): void {
        this.levelHpHudIcon?.setVisible(visible);
        this.levelHpHudText?.setVisible(visible);
    }

    private triggerPlayerDeath(): void {
        this.isDead = true;
        this.isCinematic = true;
        this.player.setVelocity(0, 0);
        this.player.setFixedRotation();

        if (this.bossAttackSystem) {
            this.bossAttackSystem.stopAttacks();
        }

        this.player.play('death');

        if (this.playerShadow) {
            this.playerShadow.setAlpha(0);
        }

        this.cameras.main.flash(500, 200, 0, 0);

        this.time.delayedCall(1500, () => {
            const darkVignette = createVignette(this, 250, true);
            darkVignette.setAlpha(0);
            const onSummit = this.mapKey === 'summit-settlement';

            fadeIn(this, darkVignette, 1000, () => {
                const playerData = PlayerData.getInstance();
                const wasBossActive = localStorage.getItem('glossary_boss_fight_active') === 'true';

                if (wasBossActive || onSummit) {
                    playerData.hp = 100;
                } else {
                    playerData.hp = playerData.maxHp;
                }

                playerData.inCombat = false;
                playerData.combatEnemyId = null;
                playerData.save();

                if (wasBossActive) {
                    playerData.clearSummitBossFightLocalStorage();
                } else {
                    localStorage.removeItem('glossary_boss_fight_active');
                    localStorage.removeItem('glossary_boss_current_combat_pillar');
                }

                const respawnMapKey = onSummit ? 'summit-settlement' : 'hub';

                fadeOutAndDestroy(this, darkVignette, 300, () => {
                    this.scene.launch('TransitionScene', {
                        targetScene: 'LevelScene',
                        currentScene: 'LevelScene',
                        targetData: {mapKey: respawnMapKey}
                    });
                });
            });
        });
    }

    private createGlossaryUIButton(): void {
        const w = this.scale.width;
        const h = this.scale.height;
        const camZoom = 2;

        const buttonX = (80 - w / 2) / camZoom + w / 2;
        const buttonY = (h - 80 - h / 2) / camZoom + h / 2;

        this.glossaryButton = this.add.sprite(buttonX, buttonY, 'glossary', 0)
            .setOrigin(0.5, 0.5)
            .setScrollFactor(0)
            .setDepth(200)
            .setScale(1)
            .setInteractive({useHandCursor: true});

        this.glossaryButton.on('pointerdown', () => {
            if (!this.scene.isActive('GlossaryUI')) {
                this.scene.pause();
                this.scene.launch('GlossaryUI', {
                    previousScene: 'LevelScene',
                    isPaused: true
                });
            }
        });

    }
}
