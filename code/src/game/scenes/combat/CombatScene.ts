import * as Phaser from 'phaser';
import { PlayerData } from '../../data/PlayerData';
import { FONT_FAMILY, COVENANT_COLORS } from '../../constants';
import { createVignette } from '../../utils/Vignette';
import { EventBus, GameEvents } from '../../EventBus';
import { NetworkManager } from '../../NetworkManager';
import { CombatEnemy, CombatPlayer, CombatSystem } from '../../combat/CombatSystem';
import { CombatHUD } from '../../combat/CombatHUD';
import { StatusEffectUI } from '../../combat/StatusEffectUI';
import { RunePickerSystem } from '../../systems/RunePickerSystem';
import { CombatInventoryUI } from '../../combat/CombatInventoryUI';
import { getSelectedItems } from '../ui/glossary/GlossaryItemsPage';
import { RuneData } from '../../data/RuneData';
import { EnemyAnimator } from '../../combat/EnemyAnimator';
import { preloadCombatSceneAssets, ensureCombatSceneAnimations } from '../../combat/CombatSceneAssets';
import { createCombatEncounter, isActiveCombatPlayer } from '../../combat/CombatEncounter';
import { CombatTurnController } from '../../combat/CombatTurnController';
import { CombatEndController } from '../../combat/CombatEndController';
import { createCombatSceneControls } from '../../combat/CombatSceneControls';
import { getRuneFrame, getSpecialCurrencyFrame } from '../../combat/CombatFrameUtils';

interface CombatLaneView {
    player: CombatPlayer;
    enemy: CombatEnemy;
    playerSprite: Phaser.GameObjects.Sprite;
    playerShadow: Phaser.GameObjects.Image;
    enemySprite: Phaser.GameObjects.Sprite;
    enemyShadow: Phaser.GameObjects.Image;
    enemyHpText: Phaser.GameObjects.Text;
    enemyAnimator?: EnemyAnimator;
}

export class CombatScene extends Phaser.Scene {
    private playerData: PlayerData | null = null;
    private combatId: string = '';
    private combatHUD: CombatHUD | null = null;
    private statusEffectUI: StatusEffectUI | null = null;
    private combatSystem: CombatSystem | null = null;
    private runePickerSystem: RunePickerSystem | null = null;
    private inventoryUI: CombatInventoryUI | null = null;
    private equippedItemStatus: Map<number, boolean> = new Map();
    private encounterTier: number = 1;
    private encounterMapKey: string = '';
    private targetEnemyId: string | null = null;
    private enemySprite: Phaser.GameObjects.Sprite | null = null;
    private enemyHpText: Phaser.GameObjects.Text | null = null;
    private playerSprite: Phaser.GameObjects.Sprite | null = null;
    private playerShadow: Phaser.GameObjects.Image | null = null;
    private abilityBtnSprite: Phaser.GameObjects.Sprite | null = null;
    private abilityBtnText: Phaser.GameObjects.Text | null = null;
    private abilityWobbleTween: Phaser.Tweens.Tween | null = null;
    private enemyStatusContainer: Phaser.GameObjects.Container | null = null;
    private combatTimer: number = 0;
    private enemyTooltip: Phaser.GameObjects.Container | null = null;
    private enemyTooltipTitle: Phaser.GameObjects.Text | null = null;
    private enemyTooltipDesc: Phaser.GameObjects.Text | null = null;
    private pillarWhiteout?: Phaser.GameObjects.Rectangle;
    private enemyAnimator: EnemyAnimator | null = null;
    private enemyShadow: Phaser.GameObjects.Image | null = null;
    private laneViews: Map<string, CombatLaneView> = new Map();
    private pendingCombatChains: Map<string, string[]> = new Map();
    private bufferedCombatActions: Map<number, Array<{ playerId: string, chain: string[] }>> = new Map();
    private localChainBroadcasted = false;
    private combatEndBroadcasted = false;
    private onPeerDisconnectedBound = (peerId: string) => this.onPeerDisconnected(peerId);
    private turnController: CombatTurnController | null = null;
    private endController: CombatEndController | null = null;
    private static readonly PILLAR_WHITE_HOLD_MS = 850;
    private static readonly PILLAR_WHITE_FADE_OUT_MS = 1400;

    constructor() {
        super('CombatScene');
    }

    preload() {
        preloadCombatSceneAssets(this);
    }

    create(data?: any) {
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            if (this.enemyAnimator) {
                this.enemyAnimator.destroy();
                this.enemyAnimator = null;
            }
            this.laneViews.forEach(lane => lane.enemyAnimator?.destroy());
            this.bufferedCombatActions.clear();
            EventBus.off(GameEvents.NETWORK_DATA_RECEIVED, this.onNetworkData, this);
            EventBus.off(GameEvents.PEER_DISCONNECTED, this.onPeerDisconnectedBound);
        });

        const fadeFromWhite = !!data?.fadeFromWhite;
        if (fadeFromWhite) {
            this.ensurePillarWhiteout();
        }

        this.playerData = this.registry.get('playerData') as PlayerData;
        this.combatId = data?.combatId || `combat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        this.encounterTier = data?.encounterTier || this.playerData.combatTier || 1;
        this.encounterMapKey = data?.mapKey || '';
        this.targetEnemyId = data?.enemyId || null;

        if (this.encounterMapKey && !localStorage.getItem('glossary_combat_return_map')) {
            localStorage.setItem('glossary_combat_return_map', this.encounterMapKey);
        }

        let bgKey = 'combat-bg-desert';
        if (this.encounterMapKey.includes('abandoned')) {
            bgKey = 'combat-bg-abandoned';
        } else if (this.encounterMapKey.includes('mechanic')) {
            bgKey = 'combat-bg-mechanic';
        }

        this.add.image(this.scale.width / 2, this.scale.height / 2, bgKey).setOrigin(0.5, 0.5).setDisplaySize(this.scale.width, this.scale.height).setScrollFactor(0);
        this.combatTimer = 0;
        this.turnController = null;
        this.endController = null;
        this.bufferedCombatActions = new Map();
        this.combatEndBroadcasted = false;

        const encounter = createCombatEncounter({
            playerData: this.playerData,
            encounterTier: this.encounterTier,
            encounterMapKey: this.encounterMapKey,
            targetEnemyId: this.targetEnemyId,
            cohort: data?.cohort
        });
        this.combatSystem = encounter.combatSystem;
        this.targetEnemyId = encounter.targetEnemyId;

        this.equippedItemStatus.clear();
        const equippedIds = getSelectedItems();
        const plumeConsumed = localStorage.getItem('glossary_seraphs_plume_consumed') === 'true';
        equippedIds.forEach(idStr => {
            const id = parseInt(idStr, 10);
            if (id === 2) {
                this.equippedItemStatus.set(2, plumeConsumed);
            } else {
                this.equippedItemStatus.set(id, false);
            }
        });

        if (this.equippedItemStatus.has(0)) {
            this.equippedItemStatus.set(0, true);
            const player = this.combatSystem ? this.combatSystem.getLocalPlayer() : null;
            if (player) {
                player.stats.defense += 2;
                player.specialCurrency = Math.min(10, player.specialCurrency + 1);
                this.time.delayedCall(400, () => {
                    this.showFloatingText(200, 420, "Namaste: +2 DEF & +1 Currency!", "#00ff00");
                    this.updateHUD();
                });
            }
        }

        if (this.equippedItemStatus.has(6)) {
            this.equippedItemStatus.set(6, true);
            const player = this.combatSystem ? this.combatSystem.getLocalPlayer() : null;
            if (player) {
                const choices = [
                    { effect: 'schizo_dmg', name: 'Extra Buff', desc: 'Trade: +2 Damage', duration: -1, frame: 9 },
                    { effect: 'schizo_def', name: 'Extra Buff', desc: 'Trade: +2 Defense', duration: -1, frame: 9 },
                    { effect: 'schizo_heal', name: 'Extra Buff', desc: 'Trade: +2 Healing', duration: -1, frame: 9 }
                ];
                const choice = choices[Math.floor(Math.random() * choices.length)];
                player.statusEffects.push(choice);
                this.time.delayedCall(600, () => {
                    this.showFloatingText(200, 400, `Schizostone: ${choice.desc.replace('Trade: ', '')}!`, "#ef4444");
                    this.updateStatusEffects();
                });
            }
        }

        this.playerData.inCombat = true;
        this.playerData.combatTier = this.encounterTier;
        this.playerData.combatEnemyId = this.targetEnemyId;
        this.playerData.save();

        ensureCombatSceneAnimations(this);

        const centerX = this.scale.width / 2;

        this.add.image(centerX, 0, 'battle-ui')
            .setOrigin(0.5, 0).setScale(2).setScrollFactor(0);

        this.combatHUD = new CombatHUD(this);
        this.combatHUD.create(centerX, this.playerData.hp, this.playerData.maxHp, this.playerData.gemstones, this.playerData.specialCurrency, getSpecialCurrencyFrame(this.playerData.covenant));
        this.statusEffectUI = new StatusEffectUI(this);
        this.statusEffectUI.createTooltip();
        this.createPlayerVisual();
        this.createEnemyVisual();
        this.createAbilityButton();

        this.runePickerSystem = new RunePickerSystem(
            this,
            this.playerData.covenant,
            getRuneFrame,
            (cov) => COVENANT_COLORS[cov] ?? COVENANT_COLORS['default'],
            (chain) => this.onComboConfirmed(chain),
            (chain) => this.combatSystem!.previewAttack(this.combatSystem!.getLocalPlayerId(), chain)
        );
        this.runePickerSystem.createDimOverlay();
        this.runePickerSystem.createChainSlots();
        this.runePickerSystem.createRunePicker();

        this.createTurnController();
        this.createEndController();
        this.setupCombatEvents();
        EventBus.on(GameEvents.NETWORK_DATA_RECEIVED, this.onNetworkData, this);
        EventBus.on(GameEvents.PEER_DISCONNECTED, this.onPeerDisconnectedBound);
        createCombatSceneControls(this, {
            clearRuneChain: () => this.runePickerSystem?.clearChain(),
            hideInventory: () => this.inventoryUI?.hide(),
            isInventoryOpen: () => !!this.inventoryUI?.isOpen(),
            openInventory: () => this.openInventoryPanel()
        });

        this.time.addEvent({ delay: 1000, callback: this.updateTimer, callbackScope: this, loop: true });

        createVignette(this);

        this.updateStatusEffects();
        this.updateTurnIndicator('YOUR TURN - Select Runes');

        if (fadeFromWhite) {
            this.scene.bringToTop('CombatScene');
            if (this.scene.isActive('LevelScene')) {
                this.scene.stop('LevelScene');
            }
            this.finalizePillarWhiteoutTransition();
        }
    }

    update(time: number, _delta: number): void {
        this.turnController?.update(time);
    }

    private ensurePillarWhiteout(): void {
        this.cameras.main.setBackgroundColor('#ffffff');
        const { width, height } = this.scale;
        if (this.pillarWhiteout?.active) return;

        this.pillarWhiteout = this.add
            .rectangle(width / 2, height / 2, width + 64, height + 64, 0xffffff, 1)
            .setScrollFactor(0)
            .setDepth(99999)
            .setAlpha(1);
    }

    private finalizePillarWhiteoutTransition(): void {
        this.time.delayedCall(CombatScene.PILLAR_WHITE_HOLD_MS, () => {
            if (!this.pillarWhiteout?.active) return;

            this.tweens.add({
                targets: this.pillarWhiteout,
                alpha: 0,
                duration: CombatScene.PILLAR_WHITE_FADE_OUT_MS,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    this.pillarWhiteout?.destroy();
                    this.pillarWhiteout = undefined;
                    this.cameras.main.setBackgroundColor('#000000');
                }
            });
        });
    }

    private createTurnController(): void {
        if (!this.combatSystem) return;

        this.turnController = new CombatTurnController(this, this.combatSystem, this.equippedItemStatus, {
            refreshAbility: () => this.updateAbilityButton(),
            restoreRunePickerForTurn: () => this.runePickerSystem?.restoreForPlayerTurn(),
            setAbilityInteractive: (enabled) => this.setAbilityButtonInteractive(enabled),
            showFloatingText: (x, y, text, color) => this.showFloatingText(x, y, text, color),
            updateEnemyHp: () => this.updateEnemyHp(),
            updateHUD: () => this.updateHUD(),
            updateStatusEffects: () => this.updateStatusEffects(),
            updateTurnIndicator: (text) => this.updateTurnIndicator(text),
            getEnemyAnimator: () => this.enemyAnimator,
            getEnemyHpText: () => this.getCurrentEnemyLane()?.enemyHpText ?? this.enemyHpText,
            getEnemyShadow: () => this.getCurrentEnemyLane()?.enemyShadow ?? this.enemyShadow,
            getEnemySprite: () => this.getCurrentEnemyLane()?.enemySprite ?? this.enemySprite,
            getEnemyTooltip: () => this.enemyTooltip,
            getPlayerShadow: () => this.getLocalLane()?.playerShadow ?? this.playerShadow,
            getPlayerSprite: () => this.getLocalLane()?.playerSprite ?? this.playerSprite
        });
    }

    private createEndController(): void {
        if (!this.combatSystem || !this.playerData) return;

        this.endController = new CombatEndController(this, {
            combatSystem: this.combatSystem,
            encounterMapKey: this.encounterMapKey,
            encounterTier: this.encounterTier,
            playerData: this.playerData,
            getPlayerShadow: () => this.playerShadow,
            getPlayerSprite: () => this.playerSprite,
            combatId: this.combatId
        });
    }

    private setupCombatEvents(): void {
        if (!this.combatSystem) return;

        this.combatSystem.on('enemy_damaged', (e) => {
            this.updateEnemyHp();
            const lane = this.getLaneForEnemy(e.data.enemyId);
            const enemySprite = lane?.enemySprite;
            this.showDamageNumber(enemySprite?.x ?? this.scale.width - 200, (enemySprite?.y ?? 320) - 80, e.data.damage, '#cc0000', '-');
            if (lane?.enemyAnimator?.hasAnim('hit')) {
                lane.enemyAnimator.play('hit', { chainTo: 'idle' });
            } else if (enemySprite) {
                enemySprite.setTint(0xff0000);
                this.time.delayedCall(180, () => enemySprite.clearTint());
            }
        });

        this.combatSystem.on('player_damaged', (e) => {
            const attackingLane = e.data.enemyId ? this.getLaneForEnemy(e.data.enemyId) : null;
            if (attackingLane?.enemyAnimator?.hasAnim('attack')) {
                attackingLane.enemyAnimator.playAttackWithFx({ chainTo: 'idle' });
            }
            const player = this.combatSystem ? this.combatSystem.getLocalPlayer() : null;
            if (player) {
                if (this.equippedItemStatus.has(4) && !this.equippedItemStatus.get(4)) {
                    this.equippedItemStatus.set(4, true);
                    const reflectDmg = Math.floor(e.data.damage * 0.5);
                    if (reflectDmg > 0) {
                        const enemy = this.combatSystem!.getAttackTargetEnemy(player.id);
                        if (enemy) {
                            enemy.stats.hp = Math.max(0, enemy.stats.hp - reflectDmg);
                            this.time.delayedCall(400, () => {
                                this.showFloatingText(this.scale.width - 200, 420, `Reflected ${reflectDmg} DMG!`, "#ffd700");
                                this.updateEnemyHp();
                            });
                        }
                    }
                }

                if (player.stats.hp <= 0 && this.equippedItemStatus.has(2) && !this.equippedItemStatus.get(2)) {
                    this.equippedItemStatus.set(2, true);
                    localStorage.setItem('glossary_seraphs_plume_consumed', 'true');
                    const reviveHp = Math.floor(player.stats.maxHp * 0.3);
                    player.stats.hp = reviveHp;
                    this.time.delayedCall(300, () => {
                        this.showFloatingText(200, 420, "Seraph's Plume Revived!", "#ffd700");
                        this.updatePlayerHp();
                        this.cameras.main.flash(500, 255, 215, 0);
                    });
                }
            }
            this.updatePlayerHp();
            const lane = this.laneViews.get(e.data.playerId) ?? this.getLocalLane();
            this.showDamageNumber(lane?.playerSprite.x ?? 200, (lane?.playerSprite.y ?? 330) - 80, e.data.damage, '#0000cc', '-');
            if (lane?.playerSprite) {
                lane.playerSprite.play(`combat-hurt-${lane.player.covenant}`).chain(`combat-idle-${lane.player.covenant}`);
                lane.playerSprite.setTint(0xff0000);
                this.time.delayedCall(250, () => {
                    lane.playerSprite.clearTint();
                });
            }
        });

        this.combatSystem.on('player_healed', (e) => {
            this.updatePlayerHp();
            const lane = this.laneViews.get(e.data.playerId) ?? this.getLocalLane();
            this.showDamageNumber(lane?.playerSprite.x ?? 200, (lane?.playerSprite.y ?? 330) - 80, e.data.amount, '#00cc00', '+');
        });

        this.combatSystem.on('enemy_defeated', (e) => {
            const lane = this.getLaneForEnemy(e.data.enemyId);
            if (!lane?.enemyAnimator) return;

            if (lane.enemyAnimator.hasFx('death_fx')) {
                lane.enemyAnimator.playFx('death_fx', {
                    x: lane.enemySprite.x,
                    y: lane.enemySprite.y
                });
            }
            if (lane.enemyAnimator.hasAnim('death')) {
                lane.enemyAnimator.play('death');
            }
        });

        this.combatSystem.on('combat_victory', () => {
            this.broadcastCombatEnd('VICTORY');
            this.endController?.show('VICTORY');
        });

        this.combatSystem.on('combat_defeat', () => {
            this.broadcastCombatEnd('DEFEAT');
            this.endController?.show('DEFEAT');
        });

        this.combatSystem.on('ability_used', (e) => {
            this.updateAbilityButton();
            this.updateHUD();
            const msg = e.data.ability === 'rewind' ? `Rewind! +${e.data.hpRestored} HP & Fortified!`
                : e.data.ability === 'burn' ? `Burned ${e.data.burnedRune}! +50% DMG`
                    : `Intimidate! Enemies -25% DMG`;
            this.showFloatingText(this.scale.width / 2, 150, msg, '#FFD700');
            if (e.data.ability === 'rewind') {
                this.updatePlayerHp();
            }
        });

        this.combatSystem.on('ability_failed', (e) => {
            const msg = e.data.reason === 'not_enough_currency' ? 'Not enough currency!'
                : e.data.reason === 'already_used' ? 'Already used this turn!'
                    : 'Cannot use ability!';
            this.showFloatingText(this.scale.width / 2, 150, msg, '#cc0000');
        });

        this.combatSystem.on('status_applied', (e) => {
            if (e.data?.effect === 'voidframe_negate') {
                const negated = (e.data.negatedEffect || 'effect').toString().toUpperCase();
                this.showFloatingText(200, 420, `VoidFrame: Negated ${negated}!`, "#ffd700");
            } else if (e.data?.effect === 'fog_skip') {
                this.showFloatingText(this.scale.width - 200, 420, "Fog of War: Enemy Stunned!", "#ffd700");
            } else if (e.data?.effect === 'dodge') {
                this.showFloatingText(200, 420, "404: Attack Not Found!", "#3b82f6");
            } else if (e.data?.effect === 'dazed_miss') {
                const isPlayer = this.combatSystem?.getLocalPlayer()?.id === e.data?.targetId;
                const lane = isPlayer ? this.getLocalLane() : this.getCurrentEnemyLane();
                this.showFloatingText(lane?.playerSprite.x ?? (isPlayer ? 200 : this.scale.width - 200), 380, 'Missed Attack!', '#ff6b6b');
            }
            this.updateStatusEffects();
        });

        this.combatSystem.on('turn_start', () => {
            this.updateStatusEffects();
            this.applyBufferedCombatActions();
        });
    }

    private createPlayerVisual(): void {
        if (!this.combatSystem) return;

        const players = this.combatSystem.getAllPlayers();
        const enemies = this.combatSystem.getAllEnemies();
        this.laneViews.clear();

        players.forEach((player, index) => {
            const enemy = enemies.find(e => e.targetPlayerId === player.id);
            if (!enemy) return;

            const y = this.getLaneY(index, players.length);
            const x = 230;
            const scale = players.length === 1 ? 3 : 2.35;

            const playerShadow = this.add.image(x, y + 25, 'protagonist-shadow')
                .setOrigin(0.5, 0.95)
                .setScrollFactor(0)
                .setAlpha(0.6)
                .setScale(scale);

            const playerSprite = this.add.sprite(x, y, `combat-protagonist-idle-${player.covenant}`)
                .setOrigin(0.5, 0.75)
                .setScrollFactor(0)
                .setScale(scale);
            playerSprite.play(`combat-idle-${player.covenant}`);

            const lane: CombatLaneView = {
                player,
                enemy,
                playerSprite,
                playerShadow,
                enemySprite: null as any,
                enemyShadow: null as any,
                enemyHpText: null as any
            };
            this.laneViews.set(player.id, lane);

            if (player.isLocal) {
                this.playerSprite = playerSprite;
                this.playerShadow = playerShadow;
            }

            this.bindPlayerTooltip(player, playerSprite);
        });
    }

    private createEnemyVisual(): void {
        if (!this.combatSystem) return;

        const players = this.combatSystem.getAllPlayers();
        const x = this.scale.width - 230;
        const scale = players.length === 1 ? 2.5 : 1.9;

        this.combatSystem.getAllEnemies().forEach((enemy, index) => {
            const y = this.getLaneY(index, players.length) - 35;
            const lane = this.laneViews.get(enemy.targetPlayerId);
            if (!lane) return;

            const enemyShadow = this.add.image(x, y + 15, 'protagonist-shadow')
                .setOrigin(0.5, 0.5)
                .setScrollFactor(0)
                .setAlpha(0.6)
                .setScale(scale);

            let enemySprite: Phaser.GameObjects.Sprite;
            if (enemy.animProfile) {
                const animator = new EnemyAnimator(this, enemy.animProfile);
                animator.createAnims();
                enemySprite = animator.createSprite(x, y, scale).setInteractive({ useHandCursor: true });
                lane.enemyAnimator = animator;
                if (enemy.animProfile === 'golem_armored' && animator.hasAnim('intro')) {
                    animator.play('intro', { chainTo: 'idle' });
                }
            } else {
                const idleKey = `enemy-idle-${enemy.texture}-${enemy.frame}`;
                if (!this.anims.exists(idleKey)) {
                    this.anims.create({
                        key: idleKey,
                        frames: this.anims.generateFrameNumbers(enemy.texture, { start: enemy.frame, end: enemy.frame + 3 }),
                        frameRate: 6,
                        repeat: -1
                    });
                }
                enemySprite = this.add.sprite(x, y, enemy.texture, enemy.frame)
                    .setScale(scale)
                    .setScrollFactor(0)
                    .setInteractive({ useHandCursor: true });
                enemySprite.play(idleKey);
            }

            const enemyHpText = this.add.text(x, y - 76, `${enemy.stats.hp}/${enemy.stats.maxHp}`, {
                fontFamily: FONT_FAMILY,
                fontSize: '14px',
                color: '#000000'
            }).setOrigin(0.5).setScrollFactor(0);

            lane.enemySprite = enemySprite;
            lane.enemyShadow = enemyShadow;
            lane.enemyHpText = enemyHpText;

            if (!this.enemySprite) {
                this.enemySprite = enemySprite;
                this.enemyShadow = enemyShadow;
                this.enemyHpText = enemyHpText;
            }

            this.bindEnemyTooltip(enemy, enemySprite);
        });

        this.enemyStatusContainer = this.add.container(this.scale.width - 40, 95).setScrollFactor(0);

        this.enemyTooltip = this.add.container(0, 0).setDepth(1000).setScrollFactor(0).setAlpha(0);
        const bg = this.add.rectangle(75, -42.5, 150, 85, 0x000000, 0.9).setStrokeStyle(1, 0x847E87);
        this.enemyTooltipTitle = this.add.text(10, -75, '', {
            fontFamily: FONT_FAMILY, fontSize: '15px', color: '#FFD700', fontStyle: 'bold'
        }).setOrigin(0, 0);
        this.enemyTooltipDesc = this.add.text(10, -55, '', {
            fontFamily: FONT_FAMILY, fontSize: '12px', color: '#FFFFFF', wordWrap: { width: 130 }
        }).setOrigin(0, 0);
        this.enemyTooltip.add([bg, this.enemyTooltipTitle, this.enemyTooltipDesc]);
    }

    private bindEnemyTooltip(enemy: CombatEnemy, enemySprite: Phaser.GameObjects.Sprite): void {
        enemySprite.on('pointerover', (pointer: Phaser.Input.Pointer) => {
            if (this.enemyTooltip && this.enemyTooltipTitle && this.enemyTooltipDesc) {
                this.enemyTooltipTitle.setText(enemy.name);
                this.enemyTooltipDesc.setText(`HP: ${enemy.stats.hp}/${enemy.stats.maxHp}\nDMG: ${enemy.stats.attack}\nDEF: ${enemy.stats.defense}`);
                const tx = pointer.x > this.scale.width / 2 ? pointer.x - 170 : pointer.x + 20;
                this.enemyTooltip.setPosition(tx, pointer.y - 10);
                this.enemyTooltip.setAlpha(1);
            }
        });

        enemySprite.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.enemyTooltip && this.enemyTooltip.alpha > 0) {
                const tx = pointer.x > this.scale.width / 2 ? pointer.x - 170 : pointer.x + 20;
                this.enemyTooltip.setPosition(tx, pointer.y - 10);
            }
        });

        enemySprite.on('pointerout', () => {
            if (this.enemyTooltip) {
                this.enemyTooltip.setAlpha(0);
            }
        });
    }

    private bindPlayerTooltip(player: CombatPlayer, playerSprite: Phaser.GameObjects.Sprite): void {
        playerSprite.setInteractive({ useHandCursor: true });

        playerSprite.on('pointerover', (pointer: Phaser.Input.Pointer) => {
            if (this.enemyTooltip && this.enemyTooltipTitle && this.enemyTooltipDesc) {
                this.enemyTooltipTitle.setText(player.name);
                this.enemyTooltipDesc.setText(this.buildPlayerTooltipText(player));
                const tx = pointer.x > this.scale.width / 2 ? pointer.x - 170 : pointer.x + 20;
                this.enemyTooltip.setPosition(tx, pointer.y - 10);
                this.enemyTooltip.setAlpha(1);
            }
        });

        playerSprite.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.enemyTooltip && this.enemyTooltip.alpha > 0) {
                const tx = pointer.x > this.scale.width / 2 ? pointer.x - 170 : pointer.x + 20;
                this.enemyTooltip.setPosition(tx, pointer.y - 10);
            }
        });

        playerSprite.on('pointerout', () => {
            if (this.enemyTooltip) {
                this.enemyTooltip.setAlpha(0);
            }
        });
    }

    private buildPlayerTooltipText(player: CombatPlayer): string {
        const statusLine = player.statusEffects.length > 0
            ? player.statusEffects.map(effect => {
                const name = effect.name || String(effect.effect);
                const suffix = effect.stacks ? ` x${effect.stacks}` : '';
                const duration = effect.duration === -1 ? ' perm' : ` ${effect.duration}t`;
                return `${name}${suffix}${duration}`;
            }).join(', ')
            : 'None';

        return `HP: ${player.stats.hp}/${player.stats.maxHp}\nDMG: ${player.stats.attack}\nDEF: ${player.stats.defense + (player.roundDefense || 0)}\nStatus: ${statusLine}`;
    }

    private getLaneY(index: number, total: number): number {
        if (total <= 1) return 500;
        if (total === 2) return index === 0 ? 455 : 535;
        return [410, 500, 590][index] ?? 500;
    }

    private getLocalLane(): CombatLaneView | null {
        if (!this.combatSystem) return null;
        return this.laneViews.get(this.combatSystem.getLocalPlayerId()) ?? null;
    }

    private getCurrentEnemyLane(): CombatLaneView | null {
        if (!this.combatSystem) return null;
        const enemy = this.combatSystem.getAttackTargetEnemy(this.combatSystem.getLocalPlayerId());
        if (!enemy) return null;
        return this.laneViews.get(enemy.targetPlayerId) ?? null;
    }

    private getLaneForEnemy(enemyId: string): CombatLaneView | null {
        for (const lane of this.laneViews.values()) {
            if (lane.enemy.id === enemyId) return lane;
        }
        return null;
    }

    private createAbilityButton(): void {
        const covenant = this.playerData!.covenant;

        const btnX = this.scale.width - 50;
        const btnY = this.scale.height - 90;

        this.abilityBtnSprite = this.add.sprite(btnX, btnY, 'special-attack-btn', 0)
            .setOrigin(1, 0.5).setScrollFactor(0).setScale(2).setDepth(100)
            .setInteractive({ useHandCursor: true });

        const loreLabel = covenant === 'snake' ? "Special:\nRewind"
            : covenant === 'phoenix' ? 'Special:\nPyre'
                : "Special:\nRoar";

        this.abilityBtnText = this.add.text(btnX - 64, btnY, loreLabel, {
            fontFamily: FONT_FAMILY,
            fontSize: '14px',
            color: '#cccccc',
            align: 'center',
            resolution: 2
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(101);

        this.refreshAbilityVisual();

        this.abilityBtnSprite.on('pointerover', () => {
            if (this.canUseAbility() && this.abilityBtnSprite) {
                this.abilityBtnSprite.stop();
                this.abilityBtnSprite.setFrame(0);
            }
        });
        this.abilityBtnSprite.on('pointerout', () => this.refreshAbilityVisual());
        this.abilityBtnSprite.on('pointerdown', () => this.onAbilityClick());
    }

    private canUseAbility(): boolean {
        if (!this.combatSystem) return false;
        if (this.combatSystem.isAbilityUsedThisTurn()) return false;
        const player = this.combatSystem.getLocalPlayer();
        if (!player) return false;
        return player.specialCurrency >= 3;
    }

    private refreshAbilityVisual(): void {
        if (!this.abilityBtnSprite) return;

        const btnX = this.scale.width - 50;
        const btnY = this.scale.height - 90;

        if (this.canUseAbility()) {
            this.abilityBtnSprite.clearTint();
            this.abilityBtnSprite.setAlpha(1);
            if (this.abilityBtnText) this.abilityBtnText.setAlpha(1);

            if (!this.abilityBtnSprite.anims.isPlaying || this.abilityBtnSprite.anims.currentAnim?.key !== 'ability-btn-loop') {
                this.abilityBtnSprite.play('ability-btn-loop');
            }
            if (!this.abilityWobbleTween || !this.abilityWobbleTween.isPlaying()) {
                this.abilityBtnSprite.setPosition(btnX, btnY);
                if (this.abilityBtnText) this.abilityBtnText.setPosition(btnX - 64, btnY);
                this.abilityWobbleTween = this.tweens.add({
                    targets: [this.abilityBtnSprite, this.abilityBtnText].filter(Boolean),
                    y: btnY - 2,
                    duration: 800,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        } else {
            this.abilityBtnSprite.stop();
            this.abilityBtnSprite.setFrame(0);
            this.abilityBtnSprite.clearTint();
            this.abilityBtnSprite.setAlpha(0.6);
            if (this.abilityBtnText) this.abilityBtnText.setAlpha(0.6);
            if (this.abilityWobbleTween) {
                this.abilityWobbleTween.stop();
                this.abilityWobbleTween = null;
            }
            this.abilityBtnSprite.setPosition(btnX, btnY);
            if (this.abilityBtnText) this.abilityBtnText.setPosition(btnX - 64, btnY);
        }
    }

    private onAbilityClick(): void {
        if (!this.combatSystem || this.turnController?.isBusy() || !this.canUseAbility()) return;
        const covenant = this.playerData!.covenant;

        let success = false;
        if (covenant === 'phoenix') {
            const discovered = RuneData.getInstance().getDiscoveredDefinitions();
            if (discovered.length > 0) {
                const randomRune = discovered[Math.floor(Math.random() * discovered.length)];
                success = this.combatSystem.useCovenantAbility(this.combatSystem.getLocalPlayerId(), { runeLetter: randomRune.letter });
            }
        } else {
            success = this.combatSystem.useCovenantAbility(this.combatSystem.getLocalPlayerId());
        }

        if (success && this.abilityBtnSprite) {
            this.refreshAbilityVisual();
            if (this.runePickerSystem) {
                this.runePickerSystem.refreshPreview();
            }
        }
    }

    private updateAbilityButton(): void {
        this.refreshAbilityVisual();
    }

    private setAbilityButtonInteractive(enabled: boolean): void {
        if (!this.abilityBtnSprite) return;

        if (enabled) {
            this.abilityBtnSprite.setInteractive({ useHandCursor: true });
        } else {
            this.abilityBtnSprite.disableInteractive();
        }
    }

    private updateHUD(): void {
        if (!this.combatHUD || !this.combatSystem) return;
        const player = this.combatSystem.getLocalPlayer();
        this.combatHUD.update(this.combatTimer, this.combatSystem.getCurrentRound(), player ? player.specialCurrency : 0);
    }

    private updateTurnIndicator(text: string): void {
        if (this.combatHUD) this.combatHUD.setTurnText(text);
    }

    private updatePlayerHp(): void {
        if (!this.combatSystem || !this.combatHUD) return;
        const player = this.combatSystem.getLocalPlayer();
        if (player) this.combatHUD.updateHpText(player.stats.hp, player.stats.maxHp);
    }

    private updateEnemyHp(): void {
        if (!this.combatSystem) return;
        this.laneViews.forEach(lane => {
            lane.enemyHpText.setText(`${lane.enemy.stats.hp}/${lane.enemy.stats.maxHp}`);
            const alive = lane.enemy.stats.hp > 0;
            lane.enemySprite.setAlpha(alive ? 1 : 0.25);
            lane.enemyShadow.setAlpha(alive ? 0.6 : 0.15);
        });
    }

    private showDamageNumber(x: number, y: number, value: number, color: string, prefix: string = '-'): void {
        if (this.combatHUD) this.combatHUD.showDamageNumber(x, y, value, color, prefix);
    }

    private showFloatingText(x: number, y: number, text: string, color: string): void {
        if (this.combatHUD) this.combatHUD.showFloatingText(x, y, text, color);
    }

    public onComboConfirmed(chain: string[]): void {
        if (!this.combatSystem || this.turnController?.isBusy() || this.combatSystem.getPhase() !== 'player_select') return;
        const localPlayerId = this.combatSystem.getLocalPlayerId();
        this.pendingCombatChains.set(localPlayerId, chain);
        this.localChainBroadcasted = false;
        this.tryResolvePendingCombos();
    }

    private broadcastCombatAction(chain: string[]): void {
        if (!this.combatSystem) return;
        const nm = NetworkManager.getInstance();
        if (nm.role === 'offline') return;

        nm.broadcast({
            type: 'COMBAT_ACTION',
            combatId: this.combatId,
            playerId: this.combatSystem.getLocalPlayerId(),
            chain,
            round: this.combatSystem.getCurrentRound(),
            originPeerId: nm.myPeerId
        });
    }

    private onNetworkData(payload: any): void {
        const data = payload.data;
        if (!data || (data.type !== 'COMBAT_ACTION' && data.type !== 'COMBAT_END')) return;

        const nm = NetworkManager.getInstance();
        if (data.originPeerId === nm.myPeerId) return;
        if (nm.role === 'host') {
            nm.broadcast(data);
        }

        if (data.combatId && data.combatId !== this.combatId) return;

        if (data.type === 'COMBAT_END') {
            if (data.result === 'VICTORY' || data.result === 'DEFEAT') {
                this.endController?.show(data.result);
            }
            return;
        }

        if (!this.combatSystem || typeof data.playerId !== 'string' || !Array.isArray(data.chain)) return;

        const currentRound = this.combatSystem.getCurrentRound();
        if (typeof data.round === 'number' && data.round > currentRound) {
            if (!this.bufferedCombatActions.has(data.round)) {
                this.bufferedCombatActions.set(data.round, []);
            }
            this.bufferedCombatActions.get(data.round)!.push({ playerId: data.playerId, chain: data.chain });
            return;
        }

        if (typeof data.round === 'number' && data.round !== currentRound) return;
        if (data.playerId === this.combatSystem.getLocalPlayerId()) return;

        this.receiveRemoteCombatAction(data.playerId, data.chain);
    }

    private applyBufferedCombatActions(): void {
        if (!this.combatSystem) return;
        const currentRound = this.combatSystem.getCurrentRound();
        const actions = this.bufferedCombatActions.get(currentRound);
        if (actions) {
            actions.forEach(act => {
                this.pendingCombatChains.set(act.playerId, act.chain);
            });
            this.bufferedCombatActions.delete(currentRound);
            this.tryResolvePendingCombos();
        }
    }

    private receiveRemoteCombatAction(playerId: string, chain: string[]): void {
        if (!this.combatSystem) return;
        if (this.turnController?.isBusy() || this.combatSystem.getPhase() !== 'player_select') return;
        const player = this.combatSystem.getPlayer(playerId);
        if (!player || player.stats.hp <= 0) return;

        this.pendingCombatChains.set(playerId, chain);
        this.tryResolvePendingCombos();
    }

    private tryResolvePendingCombos(): void {
        if (!this.combatSystem || !this.turnController) return;

        this.forfeitInactiveRosterPlayers();

        const waitingFor = this.combatSystem.getAllPlayers()
            .filter(player => {
                if (player.stats.hp <= 0) return false;
                if (!isActiveCombatPlayer(player.id)) return false;

                const ownEnemy = this.combatSystem?.getEnemyForPlayer(player.id);
                if (ownEnemy && ownEnemy.stats.hp > 0) return true;

                return this.pendingCombatChains.has(player.id) && !!this.combatSystem?.getAttackTargetEnemy(player.id);
            })
            .map(player => player.id);

        const localPlayerId = this.combatSystem.getLocalPlayerId();
        const localChain = this.pendingCombatChains.get(localPlayerId);
        if (localChain && !this.localChainBroadcasted) {
            this.broadcastCombatAction(localChain);
            this.localChainBroadcasted = true;
        }

        const missing = waitingFor.filter(playerId => !this.pendingCombatChains.has(playerId));
        if (missing.length > 0) {
            const localPlayer = this.combatSystem.getLocalPlayer();
            const localCanAssist = !!localPlayer
                && localPlayer.stats.hp > 0
                && !localChain
                && !!this.combatSystem.getAttackTargetEnemy(localPlayerId);

            if (missing.includes(localPlayerId) || localCanAssist) {
                this.updateTurnIndicator('YOUR TURN - Select Runes');
            } else {
                this.updateTurnIndicator(`WAITING FOR ALLIES (${waitingFor.length - missing.length}/${waitingFor.length})`);
            }
            return;
        }

        const chains = new Map(this.pendingCombatChains);
        this.pendingCombatChains.clear();
        this.localChainBroadcasted = false;
        this.turnController.submitPlayerChains(chains);
    }

    private onPeerDisconnected(peerId: string): void {
        if (!this.combatSystem) return;
        const player = this.combatSystem.getPlayer(peerId);
        if (!player || player.isLocal) return;
        this.forfeitCombatPlayer(peerId);
    }

    private forfeitInactiveRosterPlayers(): void {
        if (!this.combatSystem) return;

        for (const player of this.combatSystem.getAllPlayers()) {
            if (player.isLocal || player.stats.hp <= 0) continue;
            if (!isActiveCombatPlayer(player.id)) {
                this.forfeitCombatPlayer(player.id);
            }
        }
    }

    private forfeitCombatPlayer(playerId: string): void {
        if (!this.combatSystem) return;

        const player = this.combatSystem.getPlayer(playerId);
        if (!player || player.stats.hp <= 0) return;

        player.stats.hp = 0;
        this.pendingCombatChains.delete(playerId);

        const enemy = this.combatSystem.getEnemyForPlayer(playerId);
        if (enemy && enemy.stats.hp > 0) {
            enemy.stats.hp = 0;
        }

        const lane = this.laneViews.get(playerId);
        if (lane) {
            lane.playerSprite.setAlpha(0.25);
            lane.playerShadow.setAlpha(0.1);
            lane.enemySprite.setAlpha(0.25);
            lane.enemyShadow.setAlpha(0.15);
            lane.enemyHpText.setText('0/0');
        }

        if (player.isLocal) {
            this.updatePlayerHp();
        }
        this.updateEnemyHp();

        if (this.combatSystem.checkCombatEnd()) {
            return;
        }

        this.tryResolvePendingCombos();
    }

    private broadcastCombatEnd(result: 'VICTORY' | 'DEFEAT'): void {
        if (this.combatEndBroadcasted) return;
        this.combatEndBroadcasted = true;

        const nm = NetworkManager.getInstance();
        if (nm.role === 'offline') return;

        nm.broadcast({
            type: 'COMBAT_END',
            combatId: this.combatId,
            result,
            originPeerId: nm.myPeerId
        });
    }


    private updateStatusEffects(): void {
        if (!this.combatSystem || !this.statusEffectUI || !this.enemyStatusContainer) return;

        const enemyEffects = this.combatSystem.getAttackTargetEnemy(this.combatSystem.getLocalPlayerId())?.statusEffects ?? [];
        this.statusEffectUI.syncIcons(enemyEffects, this.enemyStatusContainer);
    }

    private updateTimer(): void {
        this.combatTimer++;
        this.updateHUD();
    }

    private openInventoryPanel(): void {
        if (this.turnController?.isBusy()) return;
        this.inventoryUI = new CombatInventoryUI(this, this.equippedItemStatus);
        this.inventoryUI.show();
    }
}
