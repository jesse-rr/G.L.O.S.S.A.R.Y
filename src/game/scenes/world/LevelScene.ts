import * as Phaser from 'phaser';
import { createVignette } from '../../utils/Vignette';
import { InputKeys, FONT_FAMILY } from '../../constants';
import { LocationData } from '../../data/LocationData';
import { UserData } from '../../data/UserData';
import { EventBus, GameEvents } from '../../EventBus';
import { NetworkManager } from '../../NetworkManager';
import {DoorState, handleDoorInteraction, initDoorAudio} from '../../systems/DoorSystem';
import { SettlementDoor, handleSettlementDoorInteraction } from '../../systems/SettlementDoorSystem';
import { MechanicDoor, handleMechanicDoorInteraction } from '../../systems/MechanicDoorSystem';
import { BossButtonState, handleBossButtonInteraction } from '../../systems/BossButtonSystem';
import { ChestState, handleChestInteraction } from '../../systems/ChestSystem';
import { TradeState, handleTradeInteraction } from "../../systems/TradeSystem";
import { SlateState, handleSlateInteraction } from '../../systems/SlateInteraction';
import { PortalSystem } from '../../systems/PortalSystem';
import { PlayerData } from '../../data/PlayerData';
import { ItemDefinition } from '../../data/ItemData';
import { CombatTrackerHUD } from '../../systems/CombatTrackerHUD';
import { RaidhoRuneSystem } from '../../systems/RaidhoRuneSystem';
import { MerchantState, handleMerchantInteraction } from '../../systems/MerchantSystem';
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
import { launchCombat } from '../../utils/CombatStartSync';
import { clearCompletedCombats } from '../../utils/CombatProgress';
import {
    ensureLevelDoorAnimations,
    ensureLevelPlayerAnimations,
    preloadLevelSceneAssets
} from './level/LevelSceneAssets';
import { createLevelMap, discoverLocationForMap } from './level/LevelMapBuilder';
import {
    LevelMovementKeys,
    syncPlayerShadow,
    stopPlayerIntoIdle,
    updateLevelPlayerMovement
} from './level/LevelPlayerController';
import { LevelMultiplayerPresence } from './level/LevelMultiplayerPresence';
import { HostMigrationController } from '../../network/HostMigrationController';

export class LevelScene extends Phaser.Scene {
    private player!: Phaser.Physics.Matter.Sprite;
    private playerShadow!: Phaser.GameObjects.Image;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private keys!: LevelMovementKeys;
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
    private gamepadMoveX = 0;
    private gamepadMoveY = 0;
    private gamepadInteractDown = false;
    private gamepadInteractJustPressed = false;
    private gamepadDashJustPressed = false;
    private previousGamepadInteractDown = false;
    private previousGamepadDashDown = false;
    private multiplayerPresence?: LevelMultiplayerPresence;
    private hostMigration?: HostMigrationController;
    private peersInCombat = new Set<string>();

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
        this.gamepadMoveX = 0;
        this.gamepadMoveY = 0;
        this.gamepadInteractDown = false;
        this.gamepadInteractJustPressed = false;
        this.gamepadDashJustPressed = false;
        this.previousGamepadInteractDown = false;
        this.previousGamepadDashDown = false;
        this.hasPlayerPositionCache = false;
        this.persistSaveTimer = 0;
        this.bossEyeVisible = false;
        this.isBossDefeatedSequence = false;
        this.peersInCombat.clear();
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
        this.audioManager = new AudioManager(this);
        this.dashSystem = new DashSystem();
        const covenant = this.registry.get('playerData')?.covenant || 'phoenix';
        preloadLevelSceneAssets(this, covenant, this.audioManager, this.dashSystem);
    }

    create() {
        ScreenShake.init(this, this.audioManager);
        initDoorAudio(this.audioManager);

        if (this.mapKey !== 'summit-settlement' || !this.barrierActive) {
            this.audioManager.playAmbient(0.03);
        }

        this.sys.events.on(Phaser.Scenes.Events.RESUME, () => {
            if (this.mapKey !== 'summit-settlement' || !this.barrierActive) {
                this.audioManager.playAmbient(0.03);
            }
        });

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

        if (this.scene.isActive('CombatScene')) {
            this.scene.stop('CombatScene');
            const nm = NetworkManager.getInstance();
            if (nm.role !== 'offline') {
                for (const peerId of nm.getConnectedPeers()) {
                    this.peersInCombat.add(peerId);
                }
            }
        }

        if (this.mapKey !== 'summit-settlement') {
            this.createGlossaryUIButton();
        }

        this.cameras.main.setBackgroundColor('#111111');
        if (this.portalSystem) this.portalSystem.destroy();
        this.portalSystem = new PortalSystem(this);
        this.multiplayerPresence?.destroy();
        this.multiplayerPresence = undefined;
        this.hostMigration?.destroy();
        this.hostMigration = undefined;

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

        const locId = discoverLocationForMap(this.mapKey);
        if (locId) {
            if (!LocationData.getInstance().isViewed(locId)) {
                const locationDisplay = LocationDisplayScene.ensureRunning(this);
                locationDisplay.showLocation(locId);
                LocationData.getInstance().markViewed(locId);
            }
        }

        ensureLevelPlayerAnimations(this);

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

        ensureLevelDoorAnimations(this);

        this.input.keyboard!.on(InputKeys.HELP, () => {
            if (!this.scene.isPaused()) {
                this.scene.pause();
                this.scene.launch('Help', {previousScene: 'LevelScene'});
            }
        });
        EventBus.on(GameEvents.NETWORK_DATA_RECEIVED, this.onNetworkData, this);
        this.events.once('shutdown', () => {
            EventBus.off(GameEvents.NETWORK_DATA_RECEIVED, this.onNetworkData, this);
            this.multiplayerPresence?.destroy();
            this.multiplayerPresence = undefined;
            this.hostMigration?.destroy();
            this.hostMigration = undefined;
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
            this.audioManager.stopBossMusic(true);
            this.summitBossHUD?.destroy();
            this.summitBossHUD = undefined;
            this.dashIndicatorHUD?.destroy();
            this.dashIndicatorHUD = undefined;
            this.multiplayerPresence?.destroy();
            this.multiplayerPresence = undefined;
            this.hostMigration?.destroy();
            this.hostMigration = undefined;
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
                const tentaclesAnimation = this.tentaclesAnimation;
                if (this.runeIndicatorSystem && tentaclesAnimation) {
                    this.runeIndicatorSystem.setTentaclesAnimation(tentaclesAnimation);
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

    private holdBossEyeStill(): void {
        if (!this.bossEyeIdle) return;

        this.tweens.killTweensOf(this.bossEyeIdle);
        this.bossEyeIdle.setPosition(this.glossaryTentaclesX, this.glossaryTentaclesY - 10);
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
        if (pillarsDefeated < 4) {
            this.summitBossHUD?.onPillarDefeated(pillarsDefeated);
        }
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
        this.waitingForBossChoice = false;
        this.isGlossaryInteractable = false;
        this.bossAttackSystem?.stopAttacks();
        this.runeIndicatorSystem?.stopBattle();
        this.ensureSummitBossHUD();
        this.summitBossHUD?.setBattleVisible(true);
        this.summitBossHUD?.syncPillarsDefeated(4);

        const glossaryCenterX = this.glossaryTentaclesX;
        const glossaryCenterY = this.glossaryTentaclesY;

        this.cameras.main.stopFollow();
        this.cameras.main.pan(glossaryCenterX, glossaryCenterY, 1200, 'Quad.easeInOut');
        this.cameras.main.zoomTo(2.08, 1200, 'Quad.easeInOut');

        this.time.delayedCall(1200, () => {
            this.playRedBossFlash();
            ScreenShake.trigger(this, 500, 0.012);
            this.holdBossEyeStill();

            this.time.delayedCall(420, () => {
                this.fadeOutDefeatedBossVisuals(() => {
                    this.restoreControlAfterBossDefeat();
                });
            });
        });
    }

    private playRedBossFlash(): void {
        const flash = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xff0000, 0.5)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(99998);

        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 420,
            ease: 'Sine.easeOut',
            onComplete: () => {
                flash.destroy();
            }
        });
    }

    private fadeOutDefeatedBossVisuals(onComplete: () => void): void {
        let pending = 0;
        let completed = false;
        const waitFor = (start: (done: () => void) => void) => {
            pending++;
            start(() => {
                pending--;
                if (pending === 0 && !completed) {
                    completed = true;
                    onComplete();
                }
            });
        };

        waitFor(done => this.retractTentacles(done));
        waitFor(done => this.retractTentaclesV2(done));
        waitFor(done => this.fadeOutBossEye(done));

        if (this.summitBossHUD?.isAlive()) {
            waitFor(done => this.summitBossHUD?.fadeOut(900, done));
        }

        const playerHudTargets = [this.levelHpHudIcon, this.levelHpHudText].filter((target): target is Phaser.GameObjects.Sprite | Phaser.GameObjects.Text => (
            !!target && target.active
        ));
        if (playerHudTargets.length > 0) {
            waitFor(done => {
                this.tweens.add({
                    targets: playerHudTargets,
                    alpha: 0,
                    duration: 900,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                        this.setPlayerHpHudVisible(false);
                        done();
                    }
                });
            });
        }

        if (pending === 0 && !completed) {
            completed = true;
            onComplete();
        }
    }

    private retractTentacles(onComplete?: () => void): void {
        if (!this.tentaclesAnimation?.active) {
            onComplete?.();
            return;
        }

        const sprite = this.tentaclesAnimation;
        this.tweens.killTweensOf(sprite);

        const fadeAndDestroy = () => {
            sprite.setFrame(0);
            this.tweens.add({
                targets: sprite,
                alpha: 0,
                duration: 250,
                ease: 'Sine.easeIn',
                onComplete: () => {
                    sprite.destroy();
                    if (this.tentaclesAnimation === sprite) {
                        this.tentaclesAnimation = undefined;
                    }
                    onComplete?.();
                }
            });
        };

        if (this.anims.exists('tentaclesRetract')) {
            sprite.play('tentaclesRetract');
            sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, fadeAndDestroy);
        } else {
            fadeAndDestroy();
        }
    }

    private fadeOutBossEye(onComplete?: () => void): void {
        const eye = this.bossEyeIdle;
        const bg = this.bossEyeBg;
        let pending = 0;
        let completeCalled = false;
        const done = () => {
            pending--;
            if (pending <= 0 && !completeCalled) {
                completeCalled = true;
                this.bossEyeVisible = false;
                onComplete?.();
            }
        };

        if (eye?.active) {
            pending++;
            this.tweens.killTweensOf(eye);
            this.tweens.add({
                targets: eye,
                alpha: 0,
                scale: 0.7,
                duration: 650,
                ease: 'Sine.easeIn',
                onComplete: () => {
                    eye.destroy();
                    if (this.bossEyeIdle === eye) {
                        this.bossEyeIdle = undefined;
                    }
                    done();
                }
            });
        }

        if (bg?.active) {
            pending++;
            this.tweens.killTweensOf(bg);
            if (this.anims.exists('bossEyeBgAnim')) {
                bg.playReverse('bossEyeBgAnim');
            } else {
                bg.setFrame(0);
            }
            this.tweens.add({
                targets: bg,
                alpha: 0,
                duration: 650,
                ease: 'Sine.easeIn',
                onComplete: () => {
                    bg.destroy();
                    if (this.bossEyeBg === bg) {
                        this.bossEyeBg = undefined;
                    }
                    done();
                }
            });
        }

        if (pending === 0) {
            this.bossEyeVisible = false;
            onComplete?.();
        }
    }

    private clearBarrierForBossChoice(): void {
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

        this.glossaryInteractZone?.setInteractive();
        this.setPlayerHpHudVisible(false);
    }

    private restoreControlAfterBossDefeat(): void {
        this.clearBarrierForBossChoice();
        this.hideReplaceGlossaryPrompt();

        this.cameras.main.pan(this.player.x, this.player.y, 900, 'Quad.easeInOut');
        this.cameras.main.zoomTo(2, 900, 'Quad.easeInOut');

        this.time.delayedCall(900, () => {
            this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
            this.isBossDefeatedSequence = false;
            this.isCinematic = false;
            this.waitingForBossChoice = true;
        });
    }

    private showReplaceGlossaryPrompt(): void {
        if (this.replaceGlossaryText?.active) return;

        const centerX = this.glossaryTentaclesX;
        const centerY = this.glossaryTentaclesY - 60;

        this.replaceGlossaryText = this.add.text(centerX, centerY, 'Replace the Glossary?', {
            fontFamily: FONT_FAMILY,
            fontSize: '8px',
            color: '#e4dacf',
            stroke: '#000000',
            resolution: 4,
            strokeThickness: 1,
            align: 'center'
        }).setOrigin(0.5).setDepth(251);
    }

    private hideReplaceGlossaryPrompt(): void {
        if (this.replaceGlossaryText) {
            this.replaceGlossaryText.destroy();
            this.replaceGlossaryText = undefined;
        }
    }

    private bindGlossaryBossChoiceInput(): void {
        if (!this.glossaryInteractZone) return;

        this.glossaryInteractZone.on('pointerdown', () => {
            if (!this.waitingForBossChoice || this.isCinematic || this.replaceGlossaryText) return;

            this.showReplaceGlossaryPrompt();
        });
    }

    private completeBossDefeatedSequence(): void {
        this.isCinematic = true;
        this.waitingForBossChoice = false;
        this.hideReplaceGlossaryPrompt();

        const fadeToBlack = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 1)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(99999)
            .setAlpha(0);

        this.tweens.add({
            targets: fadeToBlack,
            alpha: 1,
            duration: 4500,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                UserData.getInstance().addWin();
                PlayerData.getInstance().replaceGlossary();
                PlayerData.getInstance().save();
                localStorage.removeItem('glossary_boss_fight_active');
                localStorage.removeItem('glossary_boss_pillars_defeated');
                localStorage.removeItem('glossary_boss_remaining_pillars');
                localStorage.removeItem('glossary_boss_current_combat_pillar');
                localStorage.removeItem('glossary_boss_combat_victory');

                this.bossAttackSystem?.stopAttacks();
                this.runeIndicatorSystem?.stopBattle();
                this.scene.start('GameOver');
            }
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

        this.audioManager.playBossMusic();
    }

    private deactivateBarrier(): void {
        if (!this.barrierActive) return;

        this.barrierActive = false;
        this.audioManager.stopBossMusic();

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

        if (this.isBossDefeatedSequence) {
            return;
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
        const isInteractKeyDown = this.interactKey.isDown || this.gamepadInteractDown;

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
        const builtMap = createLevelMap(this, {
            mapKey,
            previousMap: this.previousMap,
            portalSystem: this.portalSystem,
            stairZones: this.stairZones,
            overrideSpawnX: this.overrideSpawnX,
            overrideSpawnY: this.overrideSpawnY,
            isTeleportingFromRune: this.isTeleportingFromRune,
            entryDirX: this.entryDirX,
            entryDirY: this.entryDirY,
            onEnteringChange: (value) => {
                this.isEntering = value;
            },
            onBossPillarDamaged: (count) => {
                this.onBossPillarDamaged(count);
            }
        });

        this.player = builtMap.player;
        this.playerShadow = builtMap.playerShadow;
        this.doors = builtMap.doors;
        this.settlementDoors = builtMap.settlementDoors;
        this.mechanicDoors = builtMap.mechanicDoors;
        this.bossButtons = builtMap.bossButtons;
        this.chests = builtMap.chests;
        this.trades = builtMap.trades;
        this.slates = builtMap.slates;
        this.merchants = builtMap.merchants;
        this.merchantItems = builtMap.merchantItems;
        this.barrierLayers = builtMap.barrierLayers;
        this.barrierCollisionObjects = builtMap.barrierCollisionObjects;
        this.barrierBodies = builtMap.barrierBodies;
        this.barrierActive = false;
        this.glossaryInteractZone = builtMap.glossaryInteractZone;
        this.glossaryTentaclesX = builtMap.glossaryTentaclesX;
        this.glossaryTentaclesY = builtMap.glossaryTentaclesY;
        this.bindGlossaryBossChoiceInput();
        this.bossAttackSystem = builtMap.bossAttackSystem;
        this.runeIndicatorSystem = builtMap.runeIndicatorSystem;
        this.overrideSpawnX = null;
        this.overrideSpawnY = null;

        if (mapKey === 'summit-settlement' && builtMap.summitResumePillarsDefeated !== undefined) {
            const pillarsDefeated = builtMap.summitResumePillarsDefeated;
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

        this.updatePlayerPositionCache();
        this.persistPlayerLocation();
        this.multiplayerPresence?.destroy();
        this.hostMigration?.destroy();
        this.multiplayerPresence = new LevelMultiplayerPresence(this, () => {
            if (!this.player?.active) {
                return null;
            }

            const body = this.player.body as MatterJS.BodyType | null;
            const velocity = body?.velocity;
            return {
                mapKey: this.mapKey,
                x: this.player.x,
                y: this.player.y,
                flipX: this.player.flipX,
                moving: !!velocity && (Math.abs(velocity.x) > 0.05 || Math.abs(velocity.y) > 0.05)
            };
        });

        if (NetworkManager.getInstance().role !== 'offline') {
            this.hostMigration = new HostMigrationController();
            this.hostMigration.attach(this.multiplayerPresence);
        } else {
            this.hostMigration = undefined;
        }
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

    update(_time: number, delta: number) {
        if (!this.player || !this.player.active || !this.player.body) return;
        this.updateGamepadInput();
        this.multiplayerPresence?.update(_time);
        const interactDown = this.interactKey.isDown || this.gamepadInteractDown;
        const interactJustPressed = Phaser.Input.Keyboard.JustDown(this.interactKey) || this.gamepadInteractJustPressed;
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
            stopPlayerIntoIdle(this.player);
            syncPlayerShadow(this.player, this.playerShadow);
            return;
        }

        if (this.waitingForBossChoice) {
            const nearGlossary = !!this.glossaryInteractZone && this.glossaryInteractZone.getBounds().contains(this.player.x, this.player.y);

            if (nearGlossary && this.glossaryInteractZone) {
                this.interactSystem.show(this.glossaryInteractZone.x, this.glossaryInteractZone.y - 30, 0);

                if (interactJustPressed) {
                    if (this.replaceGlossaryText) {
                        this.completeBossDefeatedSequence();
                    } else {
                        this.showReplaceGlossaryPrompt();
                    }
                }
            } else {
                this.hideReplaceGlossaryPrompt();
            }
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

            if ((interactDown || this.glossaryKey.isDown) && !this.isHoldingGlossary) {
                this.startGlossaryHold();
            }
        }

        if (this.isHoldingGlossary) {
            this.updateGlossaryHold(delta);

            const progress = Math.min(1, this.glossaryHoldProgress / this.glossaryHoldDuration);
            this.interactSystem.show(this.glossaryInteractZone!.x, this.glossaryInteractZone!.y - 30, progress);
        }

        if (this.bossAttackSystem) this.bossAttackSystem.update();
        if (this.runeIndicatorSystem) this.runeIndicatorSystem.update(delta, interactDown);
        this.dashIndicatorHUD?.update(this.dashSystem);
        if (this.damageOverlay) this.damageOverlay.update(_time);

        if (this.pushDurationTimer > 0) {
            this.pushDurationTimer -= delta;
            this.player.setVelocity(this.pushVelocity.x, this.pushVelocity.y);
            syncPlayerShadow(this.player, this.playerShadow);
            return;
        }

        if (this.dashSystem.updateTimers(delta, this.player, this.playerShadow)) return;

        handleDoorInteraction(this, this.doors, this.player, interactDown, delta, this.isCinematic, this.portalSystem.getIsTeleporting(), this.isEntering, (val) => {
            this.isCinematic = val;
        });
        handleSettlementDoorInteraction(this, this.settlementDoors, this.player, interactDown, this.wasInteractPressed);
        handleMechanicDoorInteraction(this, this.mechanicDoors, this.player, interactDown, this.wasInteractPressed);
        handleBossButtonInteraction(this, this.bossButtons, this.player, interactDown, this.isCinematic, this.portalSystem.getIsTeleporting(), this.isEntering, (val) => {
            this.isCinematic = val;
        }, this.mapKey, delta, this.peersInCombat.size > 0);
        handleChestInteraction(this, this.chests, this.player, interactDown, delta, this.isCinematic, this.portalSystem.getIsTeleporting(), this.isEntering);
        if (this.mapKey === 'summit-trade') handleTradeInteraction(this, this.trades, this.player, interactDown, this.wasInteractPressed, (val) => {
            this.isCinematic = val;
        });
        handleSlateInteraction(this, this.slates, this.player, interactDown, this.wasInteractPressed, this.isCinematic, this.portalSystem.getIsTeleporting(), this.isEntering, this.mapKey);
        if (this.raidhoRuneSystem) this.raidhoRuneSystem.update(this.player, interactDown, delta, this.isCinematic, this.portalSystem.getIsTeleporting(), this.isEntering, (val) => {
            this.isCinematic = val;
        });
        if (this.mapKey === 'merchant') handleMerchantInteraction(this, this.merchants, this.player, interactDown, this.wasInteractPressed, this.isCinematic, this.portalSystem.getIsTeleporting(), this.isEntering);

        this.currentSlowFactor = updateLevelPlayerMovement({
            player: this.player,
            playerShadow: this.playerShadow,
            cursors: this.cursors,
            keys: this.keys,
            dashKey: this.dashKey,
            dashSystem: this.dashSystem,
            portalSystem: this.portalSystem,
            entryDirX: this.entryDirX,
            entryDirY: this.entryDirY,
            currentSlowFactor: this.currentSlowFactor,
            targetSlowFactor: this.targetSlowFactor,
            gamepadMoveX: this.gamepadMoveX,
            gamepadMoveY: this.gamepadMoveY,
            gamepadDashJustPressed: this.gamepadDashJustPressed,
            isEntering: this.isEntering,
            isCinematic: this.isCinematic,
            isHoldingGlossary: this.isHoldingGlossary
        });
    }

    private updateGamepadInput(): void {
        const gamepad = navigator.getGamepads?.().find(pad => pad?.connected);
        const axisX = gamepad?.axes[0] ?? 0;
        const axisY = gamepad?.axes[1] ?? 0;
        const dpadX = (gamepad?.buttons[15]?.pressed ? 1 : 0) - (gamepad?.buttons[14]?.pressed ? 1 : 0);
        const dpadY = (gamepad?.buttons[13]?.pressed ? 1 : 0) - (gamepad?.buttons[12]?.pressed ? 1 : 0);
        const interactDown = !!gamepad?.buttons[0]?.pressed;
        const dashDown = !!(gamepad?.buttons[1]?.pressed || gamepad?.buttons[5]?.pressed);

        this.gamepadMoveX = Math.abs(axisX) > 0.2 ? axisX : dpadX;
        this.gamepadMoveY = Math.abs(axisY) > 0.2 ? axisY : dpadY;
        this.gamepadInteractDown = interactDown;
        this.gamepadInteractJustPressed = interactDown && !this.previousGamepadInteractDown;
        this.gamepadDashJustPressed = dashDown && !this.previousGamepadDashDown;
        this.previousGamepadInteractDown = interactDown;
        this.previousGamepadDashDown = dashDown;
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
        this.audioManager.stopBossMusic();
        UserData.getInstance().addDeath();
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

    private onNetworkData(payload: any): void {
        const data = payload.data;
        if (this.multiplayerPresence?.handleNetworkData(data)) {
            return;
        }
        if (data?.type === 'COMBAT_LEFT') {
            if (typeof data.originPeerId === 'string') {
                this.peersInCombat.delete(data.originPeerId);
            }
            const nm = NetworkManager.getInstance();
            if (nm.role === 'host') {
                nm.broadcast(data);
            }
            return;
        }
        if (data?.type === 'PLAYER_STATE') {
            if (typeof data.originPeerId === 'string') {
                this.peersInCombat.delete(data.originPeerId);
            }
        }
        if (data?.type === 'COMBAT_START') {
            this.onCombatStartData(data);
            return;
        }
        if (!data || data.type !== 'MAP_CHANGE') return;

        const nm = NetworkManager.getInstance();
        if (data.originPeerId === nm.myPeerId || !data.teleportFromRune) return;

        if (nm.role === 'host') {
            nm.broadcast(data);
        }

        const playerData = PlayerData.getInstance();
        if (typeof data.currentFloor === 'number') {
            playerData.currentFloor = data.currentFloor;
        }
        if (typeof data.hubDoorOpened === 'boolean') {
            playerData.hubDoorOpened = data.hubDoorOpened;
        }
        clearCompletedCombats();
        playerData.save();

        this.scene.launch('TransitionScene', {
            targetScene: 'LevelScene',
            currentScene: 'LevelScene',
            targetData: {
                mapKey: data.targetMap,
                previousMap: data.previousMap,
                entryDirX: data.entryDirX ?? 0,
                entryDirY: data.entryDirY ?? 0,
                teleportFromRune: !!data.teleportFromRune
            }
        });
    }

    private onCombatStartData(data: any): void {
        const nm = NetworkManager.getInstance();
        if (data.originPeerId === nm.myPeerId) return;

        if (nm.role === 'host') {
            nm.broadcast(data);
        }

        if (this.player?.active) {
            localStorage.setItem('glossary_combat_return_map', this.mapKey);
            localStorage.setItem('glossary_combat_player_x', String(this.player.x));
            localStorage.setItem('glossary_combat_player_y', String(this.player.y));
        }

        launchCombat(this, {
            combatId: data.combatId,
            encounterTier: data.encounterTier ?? PlayerData.getInstance().combatTier ?? 1,
            mapKey: data.mapKey ?? this.mapKey,
            enemyId: data.enemyId ?? null,
            fadeFromWhite: !!data.fadeFromWhite,
            cohort: data.cohort,
            enemyMapping: data.enemyMapping
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
