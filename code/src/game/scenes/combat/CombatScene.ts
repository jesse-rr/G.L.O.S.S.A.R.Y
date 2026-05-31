import * as Phaser from 'phaser';
import { PlayerData } from '../../data/PlayerData';
import { FONT_FAMILY, COVENANT_COLORS, COVENANT_TINTS, RUNE_FONT, InputKeys } from '../../constants';
import { createVignette } from '../../utils/Vignette';
import { CombatSystem, CombatPlayer, CombatEnemy } from '../../combat/CombatSystem';
import { CombatHUD } from '../../combat/CombatHUD';
import { StatusEffectUI } from '../../combat/StatusEffectUI';
import { RunePickerSystem } from '../../systems/RunePickerSystem';
import { CombatInventoryUI } from '../../combat/CombatInventoryUI';
import { getSelectedItems } from '../ui/glossary/GlossaryItemsPage';
import { PlayerPanelSystem } from '../../systems/PlayerPanelSystem';
import { BESTIARY, BestiaryData } from '../../data/BestiaryData';
import { RuneData } from '../../data/RuneData';

export class CombatScene extends Phaser.Scene {
    private playerData: PlayerData | null = null;
    private combatHUD: CombatHUD | null = null;
    private statusEffectUI: StatusEffectUI | null = null;
    private combatSystem: CombatSystem | null = null;
    private runePickerSystem: RunePickerSystem | null = null;
    private inventoryUI: CombatInventoryUI | null = null;
    private equippedItemStatus: Map<number, boolean> = new Map();
    private playerPanelSystem: PlayerPanelSystem | null = null;
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
    private isAnimating: boolean = false;
    private overlayContainer: Phaser.GameObjects.Container | null = null;
    private enemyStatusContainer: Phaser.GameObjects.Container | null = null;
    private playerStatusContainer: Phaser.GameObjects.Container | null = null;
    private combatTimer: number = 0;
    private enemyTooltip: Phaser.GameObjects.Container | null = null;
    private enemyTooltipTitle: Phaser.GameObjects.Text | null = null;
    private enemyTooltipDesc: Phaser.GameObjects.Text | null = null;
    private transitionStarted: boolean = false;
    private combatEnded: boolean = false;
    private pillarWhiteout?: Phaser.GameObjects.Rectangle;
    private static readonly PILLAR_WHITE_HOLD_MS = 850;
    private static readonly PILLAR_WHITE_FADE_OUT_MS = 1400;

    constructor() {
        super('CombatScene');
    }

    preload() {
        this.load.image('combat-bg-desert', 'assets/Models/exports/backgrounds/Desert-Floor.png');
        this.load.image('combat-bg-abandoned', 'assets/Models/exports/backgrounds/Abandoned-Floor.png');
        this.load.image('combat-bg-mechanic', 'assets/Models/exports/backgrounds/Mechanic-Floor.png');
        this.load.font(FONT_FAMILY, 'assets/Models/exports/VCRosdNEUE.ttf');
        this.load.font(RUNE_FONT, 'assets/Models/exports/RUNE.TTF');
        this.load.image('battle-ui', 'assets/Models/exports/UI/Battle-UI.png');
        this.load.image('book-ui', 'assets/Models/exports/UI/Book-UI.png');
        this.load.image('book-layout', 'assets/Models/exports/UI/Book-Layout-1.png');
        this.load.image('book-layout-2', 'assets/Models/exports/UI/Book-Layout-2.png');
        this.load.image('book-layout-3', 'assets/Models/exports/UI/Book-Layout-3.png');
        this.load.image('book-layout-4', 'assets/Models/exports/UI/Book-Layout-4.png');
        this.load.image('player-ui', 'assets/Models/exports/UI/Player-UI.png');
        this.load.spritesheet('rune-overlay', 'assets/Models/exports/UI/Combat-Overlay-Rune.png', {
            frameWidth: 48, frameHeight: 64
        });
        this.load.image('achievement-ui', 'assets/Models/exports/UI/Achievement-UI.png');
        this.load.image('settings-btn', 'assets/Models/exports/UI/Settings-Btn.png');
        this.load.image('inventory-btn', 'assets/Models/exports/UI/Inventory-Btn.png');
        this.load.spritesheet('chain-link', 'assets/Models/exports/UI/Combat-Overlay-Chains.png', {
            frameWidth: 64, frameHeight: 64
        });
        this.load.spritesheet('bookmarks-ui', 'assets/Models/exports/UI/Bookmarks-UI.png', {
            frameWidth: 17, frameHeight: 22
        });
        this.load.spritesheet('attack-selector', 'assets/Models/exports/UI/Combat-Attack-Selector.png', {
            frameWidth: 64, frameHeight: 64
        });
        this.load.spritesheet('items', 'assets/Models/exports/Objects/Items.png', {
            frameWidth: 64, frameHeight: 64
        });
        this.load.spritesheet('glossary', 'assets/Models/exports/Objects/Glossary.png', {
            frameWidth: 64, frameHeight: 64
        });
        this.load.spritesheet('cultist', 'assets/Models/exports/characters/Cultist-Sheet.png', { frameWidth: 57, frameHeight: 67 });
        this.load.spritesheet('golem', 'assets/Models/exports/characters/Golem-Sheet.png', { frameWidth: 57, frameHeight: 56 });
        this.load.spritesheet('rationalist', 'assets/Models/exports/characters/Rationalist-Sheet.png', { frameWidth: 59, frameHeight: 73 });
        this.load.spritesheet('scavenger', 'assets/Models/exports/characters/Scavenger-Sheet.png', { frameWidth: 59, frameHeight: 61 });
        this.load.spritesheet('slime', 'assets/Models/exports/characters/Slime-Sheet.png', { frameWidth: 32, frameHeight: 27 });
        this.load.spritesheet('wisp', 'assets/Models/exports/characters/Wisp-Sheet.png', { frameWidth: 27, frameHeight: 51 });
        this.load.spritesheet('map-outlines', 'assets/Models/exports/Objects/map-outlines.png', {
            frameWidth: 192, frameHeight: 128
        });
        this.load.spritesheet('map-boss-outlines', 'assets/Models/exports/Objects/map-boss-outlines.png', {
            frameWidth: 64, frameHeight: 128
        });
        this.load.spritesheet('currency', 'assets/Models/exports/Objects/Currency.png', {
            frameWidth: 16, frameHeight: 16
        });
        this.load.spritesheet('special-attack-btn', 'assets/Models/exports/UI/Special-Attack-Btn.png', {
            frameWidth: 64, frameHeight: 64
        });
        this.load.spritesheet('status-btn', 'assets/Models/exports/UI/Status-Btn.png', {
            frameWidth: 32, frameHeight: 32
        });
        const covenant = this.registry.get('playerData')?.covenant || 'snake';
        this.load.spritesheet('protagonist-idle', `assets/Models/Protagonist/Idle-${covenant}.png`, { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet('protagonist-hurt', `assets/Models/Protagonist/Hurt-${covenant}.png`, { frameWidth: 48, frameHeight: 48 });
        this.load.image('protagonist-shadow', 'assets/Models/Protagonist/Shadow.png');
    }

    create(data?: any) {
        const fadeFromWhite = !!data?.fadeFromWhite;
        if (fadeFromWhite) {
            this.ensurePillarWhiteout();
        }

        this.playerData = this.registry.get('playerData') as PlayerData;
        this.encounterTier = data?.encounterTier || this.playerData.combatTier || 1;
        this.encounterMapKey = data?.mapKey || '';
        this.targetEnemyId = data?.enemyId || null;

        if (this.encounterMapKey) {
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
        this.isAnimating = false;
        this.transitionStarted = false;
        this.combatEnded = false;

        this.initCombatSystem();

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

        if (!this.anims.exists('chain-anim')) {
            this.anims.create({
                key: 'chain-anim',
                frames: this.anims.generateFrameNumbers('chain-link', { start: 0, end: 5 }),
                frameRate: 8, repeat: -1
            });
        }

        if (!this.anims.exists('attack-selector-anim')) {
            this.anims.create({
                key: 'attack-selector-anim',
                frames: this.anims.generateFrameNumbers('attack-selector', { start: 0, end: 3 }),
                frameRate: 8, repeat: -1, yoyo: true
            });
        }

        const centerX = this.scale.width / 2;

        this.add.image(centerX, 0, 'battle-ui')
            .setOrigin(0.5, 0).setScale(2).setScrollFactor(0);

        this.combatHUD = new CombatHUD(this);
        this.combatHUD.create(centerX, this.playerData.hp, this.playerData.maxHp, this.playerData.gemstones, this.playerData.specialCurrency, this.getSpecialCurrencyFrame(this.playerData.covenant));
        this.statusEffectUI = new StatusEffectUI(this);
        this.statusEffectUI.createTooltip();
        this.createPlayerVisual();
        this.createEnemyVisual();
        this.createAbilityButton();
        this.createPlayerPanel();

        this.runePickerSystem = new RunePickerSystem(
            this,
            this.playerData.covenant,
            this.getRuneFrame.bind(this),
            (cov) => COVENANT_COLORS[cov] ?? COVENANT_COLORS['default'],
            (chain) => this.onComboConfirmed(chain),
            (chain) => this.combatSystem!.previewAttack('local', chain)
        );
        this.runePickerSystem.createDimOverlay();
        this.runePickerSystem.createChainSlots();
        this.runePickerSystem.createRunePicker();

        this.setupCombatEvents();

        const glossaryX = 30;
        const glossaryY = this.scale.height - 100;
        const glossaryBtn = this.add.sprite(glossaryX, glossaryY, 'glossary', 0)
            .setOrigin(0, 0.5).setScrollFactor(0).setScale(2)
            .setInteractive({ useHandCursor: true });
        glossaryBtn.on('pointerdown', () => {
            if (!this.scene.isActive('GlossaryUI')) {
                this.scene.pause();
                this.scene.launch('GlossaryUI', { previousScene: 'CombatScene', isPaused: true });
            }
        });

        const settingsX = this.scale.width - 24;
        const settingsY = this.scale.height - 10;
        const settingsBtn = this.add.sprite(settingsX, settingsY, 'settings-btn')
            .setOrigin(1, 1).setScrollFactor(0).setScale(1)
            .setInteractive({ useHandCursor: true });
        settingsBtn.on('pointerover', () => settingsBtn.setTint(0xaaaaaa));
        settingsBtn.on('pointerout', () => settingsBtn.clearTint());
        settingsBtn.on('pointerdown', () => {
            if (!this.scene.isActive('Help')) {
                this.scene.pause();
                this.scene.launch('Help', { previousScene: 'CombatScene' });
            }
        });

        const inventoryX = 24;
        const inventoryY = settingsY;
        const inventoryBtn = this.add.image(inventoryX, inventoryY, 'inventory-btn')
            .setOrigin(0, 1).setScrollFactor(0).setScale(1)
            .setInteractive({ useHandCursor: true });
        inventoryBtn.on('pointerover', () => inventoryBtn.setTint(0xaaaaaa));
        inventoryBtn.on('pointerout', () => inventoryBtn.clearTint());
        inventoryBtn.on('pointerdown', () => {
            this.openInventoryPanel();
        });

        this.input.keyboard!.on(InputKeys.HELP, () => {
            if (!this.scene.isPaused()) {
                this.scene.pause();
                this.scene.launch('Help', { previousScene: 'CombatScene' });
            }
        });
        this.input.keyboard!.on(InputKeys.BACK, () => {
            if (this.inventoryUI && this.inventoryUI.isOpen()) {
                this.inventoryUI.hide();
                return;
            }
            if (!this.scene.isPaused() && this.runePickerSystem) {
                this.runePickerSystem.clearChain();
            }
        });
        this.input.keyboard!.on(InputKeys.GLOSSARY, () => {
            if (!this.scene.isActive('GlossaryUI')) {
                this.scene.pause();
                this.scene.launch('GlossaryUI', { previousScene: 'CombatScene', isPaused: true });
            }
        });
        this.input.keyboard!.on(InputKeys.INVENTORY, () => {
            if (this.inventoryUI && this.inventoryUI.isOpen()) {
                this.inventoryUI.hide();
            } else {
                this.openInventoryPanel();
            }
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

    private pickEnemyFromBestiary(): { id: string, name: string; hp: number; attack: number; defense: number; texture: string; frame: number } {
        let pick = BESTIARY.find(e => e.id === this.targetEnemyId);

        if (!pick) {
            const tierEnemies = BESTIARY.filter(e => e.tier === this.encounterTier);
            const pool = tierEnemies.length > 0 ? tierEnemies : BESTIARY.filter(e => e.tier === 1);
            const battledNames = new Set<string>();
            try {
                const raw = localStorage.getItem('glossary_completed_combats');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    for (const mapKey of Object.keys(parsed)) {
                        if (Array.isArray(parsed[mapKey])) {
                            parsed[mapKey].forEach((c: any) => {
                                if (c && c.enemyName) battledNames.add(c.enemyName.toLowerCase());
                            });
                        }
                    }
                }
            } catch { }

            let unbattled = pool.filter(e => !battledNames.has(e.name.toLowerCase()));
            if (unbattled.length === 0) {
                unbattled = pool;
            }
            pick = unbattled[Math.floor(Math.random() * unbattled.length)];
        }

        BestiaryData.getInstance().discoverEntity(pick.id);
        this.targetEnemyId = pick.id;

        return {
            id: pick.id,
            name: pick.name,
            hp: pick.hp,
            attack: pick.baseDamage,
            defense: Math.floor(pick.baseDamage * 0.2),
            texture: pick.texture,
            frame: pick.frame
        };
    }

    private initCombatSystem(): void {
        this.combatSystem = new CombatSystem();

        const localPlayer: CombatPlayer = {
            id: 'local',
            name: 'You',
            covenant: this.playerData!.covenant,
            stats: { hp: this.playerData!.hp, maxHp: this.playerData!.maxHp, attack: 0, defense: 3 },
            gemstones: this.playerData!.gemstones,
            specialCurrency: this.playerData!.specialCurrency,
            currentChain: null,
            isLocal: true,
            statusEffects: [],
            roundDefense: 0
        };

        const enemyDef = this.pickEnemyFromBestiary();
        const enemies: CombatEnemy[] = [{
            id: enemyDef.id,
            name: enemyDef.name,
            stats: { hp: enemyDef.hp, maxHp: enemyDef.hp, attack: enemyDef.attack, defense: enemyDef.defense },
            targetPlayerId: 'local',
            texture: enemyDef.texture,
            frame: enemyDef.frame,
            damageModifier: 1.0,
            statusEffects: [],
            slowSkipNext: false
        }];

        this.combatSystem.initCombat([localPlayer], enemies);
        this.combatSystem.startRound();
    }

    private setupCombatEvents(): void {
        if (!this.combatSystem) return;

        this.combatSystem.on('enemy_damaged', (e) => {
            this.updateEnemyHp();
            this.showDamageNumber(this.scale.width - 200, 250, e.data.damage, '#cc0000', '-');
        });

        this.combatSystem.on('player_damaged', (e) => {
            const player = this.combatSystem ? this.combatSystem.getLocalPlayer() : null;
            if (player) {
                if (this.equippedItemStatus.has(4) && !this.equippedItemStatus.get(4)) {
                    this.equippedItemStatus.set(4, true);
                    const reflectDmg = Math.floor(e.data.damage * 0.5);
                    if (reflectDmg > 0) {
                        const enemy = this.combatSystem!.getAllEnemies()[0];
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
            this.showDamageNumber(200, 250, e.data.damage, '#0000cc', '-');
            if (this.playerSprite) {
                this.playerSprite.play('combat-player-hurt').chain('combat-player-idle');
                this.playerSprite.setTint(0xff0000);
                this.time.delayedCall(250, () => {
                    this.playerSprite?.clearTint();
                });
            }
        });

        this.combatSystem.on('player_healed', (e) => {
            this.updatePlayerHp();
            this.showDamageNumber(200, 250, e.data.amount, '#00cc00', '+');
        });

        this.combatSystem.on('combat_victory', () => {
            this.showCombatEnd('VICTORY');
        });

        this.combatSystem.on('combat_defeat', () => {
            this.showCombatEnd('DEFEAT');
        });

        this.combatSystem.on('ability_used', (e) => {
            this.updateAbilityButton();
            this.updateHUD();
            const msg = e.data.ability === 'rewind' ? `Rewound! +${e.data.hpRestored} HP`
                : e.data.ability === 'burn' ? `Burned ${e.data.burnedRune}! +50% DMG`
                    : `Intimidate! Enemies -25% DMG`;
            this.showFloatingText(this.scale.width / 2, 150, msg, '#FFD700');
        });

        this.combatSystem.on('ability_failed', (e) => {
            const msg = e.data.reason === 'not_enough_currency' ? 'Not enough currency!'
                : e.data.reason === 'already_used' ? 'Already used this turn!'
                    : e.data.reason === 'no_damage_to_rewind' ? 'No damage to rewind!'
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
            }
            this.updateStatusEffects();
        });

        this.combatSystem.on('turn_start', () => {
            this.updateStatusEffects();
        });
    }

    private createPlayerVisual(): void {
        const x = 200;
        const y = 500;

        if (!this.anims.exists('combat-player-idle')) {
            this.anims.create({
                key: 'combat-player-idle',
                frames: this.anims.generateFrameNumbers('protagonist-idle', { start: 0, end: 6 }),
                frameRate: 8,
                repeat: -1
            });
        }
        if (!this.anims.exists('combat-player-hurt')) {
            this.anims.create({
                key: 'combat-player-hurt',
                frames: this.anims.generateFrameNumbers('protagonist-hurt', { start: 0, end: 2 }),
                frameRate: 8,
                repeat: 0
            });
        }

        this.playerShadow = this.add.image(x, y + 30, 'protagonist-shadow')
            .setOrigin(0.5, 0.95)
            .setScrollFactor(0)
            .setAlpha(0.6)
            .setScale(3);

        this.playerSprite = this.add.sprite(x, y, 'protagonist-idle')
            .setOrigin(0.5, 0.75)
            .setScrollFactor(0)
            .setScale(3);

        this.playerSprite.play('combat-player-idle');

        this.playerStatusContainer = this.add.container(40, 95).setScrollFactor(0);
    }

    private createEnemyVisual(): void {
        if (!this.combatSystem) return;
        const enemy = this.combatSystem.getAllEnemies()[0];
        if (!enemy) return;

        const x = this.scale.width - 200;
        const y = 450;

        const idleKey = `enemy-idle-${enemy.texture}-${enemy.frame}`;
        if (!this.anims.exists(idleKey)) {
            this.anims.create({
                key: idleKey,
                frames: this.anims.generateFrameNumbers(enemy.texture, { start: enemy.frame, end: enemy.frame + 3 }),
                frameRate: 6,
                repeat: -1
            });
        }

        this.enemySprite = this.add.sprite(x, y, enemy.texture, enemy.frame)
            .setScale(2.5).setScrollFactor(0).setInteractive({ useHandCursor: true });
        this.enemySprite.play(idleKey);

        this.enemyHpText = this.add.text(x, y - 85, `${enemy.stats.hp}/${enemy.stats.maxHp}`, {
            fontFamily: FONT_FAMILY, fontSize: '14px', color: '#000000'
        }).setOrigin(0.5).setScrollFactor(0);

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

        this.enemySprite.on('pointerover', (pointer: Phaser.Input.Pointer) => {
            if (this.enemyTooltip && this.enemyTooltipTitle && this.enemyTooltipDesc) {
                this.enemyTooltipTitle.setText(enemy.name);
                this.enemyTooltipDesc.setText(`HP: ${enemy.stats.hp}/${enemy.stats.maxHp}\nDMG: ${enemy.stats.attack}\nDEF: ${enemy.stats.defense}`);
                const tx = pointer.x > this.scale.width / 2 ? pointer.x - 170 : pointer.x + 20;
                this.enemyTooltip.setPosition(tx, pointer.y - 10);
                this.enemyTooltip.setAlpha(1);
            }
        });

        this.enemySprite.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.enemyTooltip && this.enemyTooltip.alpha > 0) {
                const tx = pointer.x > this.scale.width / 2 ? pointer.x - 170 : pointer.x + 20;
                this.enemyTooltip.setPosition(tx, pointer.y - 10);
            }
        });

        this.enemySprite.on('pointerout', () => {
            if (this.enemyTooltip) {
                this.enemyTooltip.setAlpha(0);
            }
        });
    }

    private createAbilityButton(): void {
        const covenant = this.playerData!.covenant;

        const btnX = this.scale.width - 50;
        const btnY = this.scale.height - 90;

        if (!this.anims.exists('ability-btn-loop')) {
            this.anims.create({
                key: 'ability-btn-loop',
                frames: this.anims.generateFrameNumbers('special-attack-btn', { start: 0, end: 5 }),
                frameRate: 8,
                repeat: -1
            });
        }

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
        if (!this.combatSystem || this.isAnimating || !this.canUseAbility()) return;
        const covenant = this.playerData!.covenant;

        let success = false;
        if (covenant === 'phoenix') {
            const discovered = RuneData.getInstance().getDiscoveredDefinitions();
            if (discovered.length > 0) {
                const randomRune = discovered[Math.floor(Math.random() * discovered.length)];
                success = this.combatSystem.useCovenantAbility('local', { runeLetter: randomRune.letter });
            }
        } else {
            success = this.combatSystem.useCovenantAbility('local');
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
        if (!this.enemyHpText || !this.combatSystem) return;
        const enemy = this.combatSystem.getAllEnemies()[0];
        if (enemy) this.enemyHpText.setText(`${enemy.stats.hp}/${enemy.stats.maxHp}`);
    }

    private showDamageNumber(x: number, y: number, value: number, color: string, prefix: string = '-'): void {
        if (this.combatHUD) this.combatHUD.showDamageNumber(x, y, value, color, prefix);
    }

    private showFloatingText(x: number, y: number, text: string, color: string): void {
        if (this.combatHUD) this.combatHUD.showFloatingText(x, y, text, color);
    }

    public onComboConfirmed(chain: string[]): void {
        if (!this.combatSystem || this.isAnimating) return;

        const resolvedValue = RuneData.resolveChainPower(chain);
        this.combatSystem.setPlayerChain('local', { runes: chain, resolvedValue });

        this.isAnimating = true;
        this.updateTurnIndicator('ATTACKING...');

        this.time.delayedCall(400, () => {
            const damage = this.combatSystem!.executePlayerAttack('local');
            if (damage > 0 && this.enemySprite) {
                this.enemySprite.setTint(0xff0000);
                this.tweens.add({
                    targets: this.enemySprite,
                    x: this.enemySprite.x + 10,
                    duration: 50,
                    yoyo: true,
                    repeat: 3,
                    onComplete: () => {
                        this.time.delayedCall(150, () => {
                            this.enemySprite?.clearTint();
                        });
                    }
                });
            }

            if (this.equippedItemStatus.has(1) && Math.random() < 0.5) {
                const enemy = this.combatSystem!.getAllEnemies()[0];
                if (enemy && enemy.stats.hp > 0) {
                    const extraDmg = 9;
                    enemy.stats.hp = Math.max(0, enemy.stats.hp - extraDmg);
                    this.time.delayedCall(300, () => {
                        this.showFloatingText(this.scale.width - 200, 400, `Runefall: +${extraDmg} Lightning!`, "#50bfe6");
                        this.updateEnemyHp();
                        this.cameras.main.flash(200, 80, 191, 230);
                    });
                }
            }

            this.time.delayedCall(600, () => {
                if (this.checkEnemyDeathAndAnimate()) {
                    return;
                }

                if (this.combatSystem!.checkCombatEnd()) {
                    this.isAnimating = false;
                    return;
                }
                this.executeEnemyTurn();
            });
        });
    }

    private executeEnemyTurn(): void {
        this.updateTurnIndicator('ENEMY TURN');
        this.combatSystem!.setPhase('enemy_attack');

        this.time.delayedCall(800, () => {
            const enemy = this.combatSystem!.getAllEnemies()[0];
            if (!enemy || enemy.stats.hp <= 0) {
                this.startNextRound();
                return;
            }

            const damage = this.combatSystem!.executeEnemyAttack(enemy.id);
            if (damage > 0 && this.playerSprite) {
                this.tweens.add({
                    targets: [this.playerSprite, this.playerShadow].filter(Boolean),
                    x: '-=8',
                    duration: 50,
                    yoyo: true,
                    repeat: 3
                });
            }

            this.time.delayedCall(600, () => {
                if (this.checkEnemyDeathAndAnimate()) {
                    return;
                }
                if (this.combatSystem!.checkCombatEnd()) {
                    this.isAnimating = false;
                    return;
                }
                this.startNextRound();
            });
        });
    }

    private startNextRound(): void {
        this.isAnimating = false;
        this.combatSystem!.startRound();
        if (this.checkEnemyDeathAndAnimate()) {
            return;
        }
        this.combatSystem!.getCurrentRound();
        this.updateHUD();
        this.updateStatusEffects();
        this.updateTurnIndicator('YOUR TURN - Select Runes');
        this.updateAbilityButton();
        if (this.abilityBtnSprite) this.abilityBtnSprite.setInteractive({ useHandCursor: true });
    }

    private updateStatusEffects(): void {
        if (!this.combatSystem || !this.statusEffectUI || !this.enemyStatusContainer || !this.playerStatusContainer) return;

        const enemy = this.combatSystem.getAllEnemies()[0];
        const enemyEffects = enemy ? enemy.statusEffects : [];
        this.statusEffectUI.syncIcons(enemyEffects, this.enemyStatusContainer);

        const player = this.combatSystem.getLocalPlayer();
        const playerEffects = player ? player.statusEffects : [];
        this.statusEffectUI.syncIcons(playerEffects, this.playerStatusContainer);
    }

    private syncPlayerDataFromCombat(result?: string): void {
        if (!this.combatSystem || !this.playerData) return;
        const combatPlayer = this.combatSystem.getLocalPlayer();
        if (!combatPlayer) return;
        if (this.encounterMapKey === 'summit-settlement') {
            const isDefeat = result === 'DEFEAT' || combatPlayer.stats.hp <= 0;
            this.playerData.hp = isDefeat ? 100 : combatPlayer.stats.hp;
        } else {
            this.playerData.hp = this.playerData.maxHp;
        }
        this.playerData.specialCurrency = combatPlayer.specialCurrency;
        this.playerData.save();
        this.registry.set('playerData', this.playerData);
    }

    private showCombatEnd(result: string): void {
        if (this.combatEnded) return;
        this.combatEnded = true;

        this.syncPlayerDataFromCombat(result);

        let earnedGems = 0;
        let earnedSpecial = 0;
        let defeatedEnemyName = 'Unknown Enemy';

        if (result === 'VICTORY' && this.playerData) {
            if (this.encounterMapKey === 'summit-settlement') {
                localStorage.setItem('glossary_boss_combat_victory', 'true');
            }

            const enemy = this.combatSystem ? this.combatSystem.getAllEnemies()[0] : null;
            defeatedEnemyName = enemy ? enemy.name : 'Unknown Enemy';

            earnedGems = this.encounterTier * 15 + Phaser.Math.Between(5, 15);
            earnedSpecial = this.encounterTier;

            this.playerData.gemstones += earnedGems;
            this.playerData.specialCurrency += earnedSpecial;

            try {
                const echoRaw = localStorage.getItem('glossary_echojar_completed_combats');
                const echoCount = (parseInt(echoRaw || '0', 10) || 0) + 1;
                localStorage.setItem('glossary_echojar_completed_combats', echoCount.toString());
            } catch { }

            const key = 'glossary_completed_combats';
            let allCompleted: Record<string, any[]> = {};
            try {
                const existing = localStorage.getItem(key);
                if (existing) allCompleted = JSON.parse(existing);
            } catch { }

            const mapList = allCompleted[this.encounterMapKey] || [];
            let globalTotal = 0;
            for (const k of Object.keys(allCompleted)) {
                if (Array.isArray(allCompleted[k])) globalTotal += allCompleted[k].length;
            }
            if (mapList.length < 3 && globalTotal < 3) {
                mapList.push({
                    enemyName: defeatedEnemyName,
                    gems: earnedGems,
                    specialCur: earnedSpecial
                });
                allCompleted[this.encounterMapKey] = mapList;
                localStorage.setItem(key, JSON.stringify(allCompleted));
            }
        }

        if (this.playerData) {
            this.playerData.inCombat = false;
            this.playerData.combatEnemyId = null;
            this.playerData.save();
        }

        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        this.overlayContainer = this.add.container(0, 0).setDepth(500).setScrollFactor(0);

        const bg = this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x000000, 0);
        this.tweens.add({ targets: bg, fillAlpha: 0.85, duration: 800, ease: 'Sine.easeOut' });

        const isVictory = result === 'VICTORY';
        const color = isVictory ? '#FFD700' : '#cc0000';

        const resultText = this.add.text(centerX, centerY - 60, result, {
            fontFamily: FONT_FAMILY, fontSize: '80px', color: color, stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: resultText,
            alpha: 1,
            duration: 800,
            ease: 'Sine.easeOut',
            delay: 300
        });

        const elements: Phaser.GameObjects.GameObject[] = [bg, resultText];
        let delayTime = 800;

        if (isVictory && this.playerData) {
            const subText = this.add.text(centerX, centerY + 10, `${defeatedEnemyName} Defeated!`, {
                fontFamily: FONT_FAMILY, fontSize: '24px', color: '#ffffff', stroke: '#000000', strokeThickness: 2
            }).setOrigin(0.5).setAlpha(0);

            const lootText = this.add.text(centerX, centerY + 45, `+${earnedGems} Gemstones  |  +${earnedSpecial} Special Currency`, {
                fontFamily: FONT_FAMILY, fontSize: '18px', color: '#50bfe6', stroke: '#000000', strokeThickness: 2
            }).setOrigin(0.5).setAlpha(0);

            elements.push(subText, lootText);

            this.tweens.add({
                targets: subText, y: centerY, alpha: 1, duration: 600, ease: 'Quad.easeOut', delay: delayTime
            });
            delayTime += 400;
            this.tweens.add({
                targets: lootText, y: centerY + 35, alpha: 1, duration: 600, ease: 'Quad.easeOut', delay: delayTime
            });
            delayTime += 600;
        }

        const continueText = this.add.text(centerX, centerY + 100, '- Click anywhere to continue -', {
            fontFamily: FONT_FAMILY, fontSize: '18px', color: '#aaaaaa'
        }).setOrigin(0.5).setAlpha(0);
        elements.push(continueText);

        this.tweens.add({
            targets: continueText, alpha: 1, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: delayTime
        });

        this.overlayContainer.add(elements);

        bg.setInteractive();
        bg.on('pointerdown', () => {
            if (this.transitionStarted) return;
            this.transitionStarted = true;

            const returnMap = this.encounterMapKey || localStorage.getItem('glossary_combat_return_map') || 'hub';
            const savedX = localStorage.getItem('glossary_combat_player_x');
            const savedY = localStorage.getItem('glossary_combat_player_y');
            localStorage.removeItem('glossary_combat_return_map');
            localStorage.removeItem('glossary_combat_player_x');
            localStorage.removeItem('glossary_combat_player_y');
            const spawnData: any = { mapKey: returnMap };
            if (savedX !== null && savedY !== null) {
                spawnData.spawnX = parseFloat(savedX);
                spawnData.spawnY = parseFloat(savedY);
            }
            this.scene.launch('TransitionScene', {
                targetScene: 'LevelScene',
                targetData: spawnData,
                currentScene: 'CombatScene'
            });
        });
    }

    private createPlayerPanel(): void {
        if (!this.combatSystem) return;
        this.playerPanelSystem = new PlayerPanelSystem(this);
        this.playerPanelSystem.create(
            this.combatSystem.getOtherPlayers(),
            (cov) => COVENANT_TINTS[cov] ?? COVENANT_TINTS['default']
        );
    }

    private updateTimer(): void {
        this.combatTimer++;
        this.updateHUD();
    }

    private getSpecialCurrencyFrame(covenant: string): number {
        switch (covenant) {
            case 'snake': return 1;
            case 'phoenix': return 2;
            case 'dragon': return 3;
            default: return 1;
        }
    }

    private getRuneFrame(cardType: string): number {
        switch (cardType) {
            case 'boost': return 0;
            case 'unique': return 1;
            case 'base': return 2;
            default: return 2;
        }
    }

    private checkEnemyDeathAndAnimate(): boolean {
        const enemy = this.combatSystem ? this.combatSystem.getAllEnemies()[0] : null;
        if (enemy && enemy.stats.hp <= 0) {
            this.isAnimating = true;
            if (this.enemySprite) {
                this.enemySprite.clearTint();
                this.tweens.add({
                    targets: this.enemySprite,
                    alpha: 0,
                    duration: 700,
                    ease: 'Quad.easeIn',
                    onComplete: () => {
                        if (this.enemyHpText) this.enemyHpText.setAlpha(0);
                        this.combatSystem!.checkCombatEnd();
                        this.isAnimating = false;
                    }
                });
            } else {
                this.combatSystem!.checkCombatEnd();
                this.isAnimating = false;
            }
            return true;
        }
        return false;
    }

    private openInventoryPanel(): void {
        if (this.isAnimating) return;
        this.inventoryUI = new CombatInventoryUI(this, this.equippedItemStatus);
        this.inventoryUI.show();
    }
}
