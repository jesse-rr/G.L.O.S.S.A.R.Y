import * as Phaser from 'phaser';
import { PlayerData } from '../../data/PlayerData';
import { FONT_FAMILY, COVENANT_COLORS, COVENANT_TINTS, RUNE_FONT, InputKeys } from '../../constants';
import { createVignette } from '../../utils/Vignette';
import { CombatSystem, CombatPlayer, CombatEnemy } from '../../combat/CombatSystem';
import { CombatHUD } from '../../combat/CombatHUD';
import { StatusEffectUI } from '../../combat/StatusEffectUI';
import { RunePickerSystem } from '../../systems/RunePickerSystem';
import { PlayerPanelSystem } from '../../systems/PlayerPanelSystem';
import { BESTIARY, BestiaryData } from '../../data/BestiaryData';
import { RuneData } from '../../data/RuneData';



export class CombatScene extends Phaser.Scene {
    private playerData: PlayerData | null = null;
    private combatHUD: CombatHUD | null = null;
    private statusEffectUI: StatusEffectUI | null = null;
    private combatSystem: CombatSystem | null = null;
    private runePickerSystem: RunePickerSystem | null = null;
    private playerPanelSystem: PlayerPanelSystem | null = null;
    private encounterTier: number = 1;
    private encounterMapKey: string = '';
    private enemySprite: Phaser.GameObjects.Sprite | null = null;
    private enemyHpText: Phaser.GameObjects.Text | null = null;
    private playerRect: Phaser.GameObjects.Rectangle | null = null;
    private abilityBtnSprite: Phaser.GameObjects.Sprite | null = null;
    private isAnimating: boolean = false;
    private overlayContainer: Phaser.GameObjects.Container | null = null;
    private enemyStatusContainer: Phaser.GameObjects.Container | null = null;
    private playerStatusContainer: Phaser.GameObjects.Container | null = null;
    private combatTimer: number = 0;

    constructor() {
        super('CombatScene');
    }

    preload() {
        this.load.font(FONT_FAMILY, 'assets/exports/VCRosdNEUE.ttf');
        this.load.font(RUNE_FONT, 'assets/exports/RUNE.TTF');
        this.load.image('battle-ui', 'assets/exports/UI/Battle-UI.png');
        this.load.image('book-ui', 'assets/exports/UI/Book-UI.png');
        this.load.image('book-layout', 'assets/exports/UI/Book-Layout-1.png');
        this.load.image('book-layout-2', 'assets/exports/UI/Book-Layout-2.png');
        this.load.image('book-layout-3', 'assets/exports/UI/Book-Layout-3.png');
        this.load.image('book-layout-4', 'assets/exports/UI/Book-Layout-4.png');
        this.load.image('player-ui', 'assets/exports/UI/Player-UI.png');
        this.load.spritesheet('rune-overlay', 'assets/exports/UI/Combat-Overlay-Rune.png', {
            frameWidth: 48, frameHeight: 64
        });
        this.load.image('achievement-ui', 'assets/exports/UI/Achievement-UI.png');
        this.load.image('settings-btn', 'assets/exports/UI/Settings-Btn.png');
        this.load.spritesheet('chain-link', 'assets/exports/UI/Combat-Overlay-Chains.png', {
            frameWidth: 64, frameHeight: 64
        });
        this.load.spritesheet('bookmarks-ui', 'assets/exports/UI/Bookmarks-UI.png', {
            frameWidth: 17, frameHeight: 22
        });
        this.load.spritesheet('attack-selector', 'assets/exports/UI/Combat-Attack-Selector.png', {
            frameWidth: 64, frameHeight: 64
        });
        this.load.spritesheet('items', 'assets/exports/Objects/Items.png', {
            frameWidth: 64, frameHeight: 64
        });
        this.load.spritesheet('glossary', 'assets/exports/Objects/Glossary.png', {
            frameWidth: 64, frameHeight: 64
        });
        this.load.spritesheet('cultist', 'assets/exports/characters/Cultist-Sheet.png', { frameWidth: 57, frameHeight: 67 });
        this.load.spritesheet('golem', 'assets/exports/characters/Golem-Sheet.png', { frameWidth: 57, frameHeight: 56 });
        this.load.spritesheet('rationalist', 'assets/exports/characters/Rationalist-Sheet.png', { frameWidth: 59, frameHeight: 73 });
        this.load.spritesheet('scavenger', 'assets/exports/characters/Scavenger-Sheet.png', { frameWidth: 59, frameHeight: 61 });
        this.load.spritesheet('slime', 'assets/exports/characters/Slime-Sheet.png', { frameWidth: 32, frameHeight: 27 });
        this.load.spritesheet('wisp', 'assets/exports/characters/Wisp-Sheet.png', { frameWidth: 27, frameHeight: 51 });
        this.load.spritesheet('map-outlines', 'assets/exports/Objects/map-outlines.png', {
            frameWidth: 192, frameHeight: 128
        });
        this.load.spritesheet('map-boss-outlines', 'assets/exports/Objects/map-boss-outlines.png', {
            frameWidth: 64, frameHeight: 128
        });
        this.load.spritesheet('currency', 'assets/exports/Objects/Currency.png', {
            frameWidth: 16, frameHeight: 16
        });
        this.load.spritesheet('special-attack-btn', 'assets/exports/UI/Special-Attack-Btn.png', {
            frameWidth: 80, frameHeight: 80
        });
        this.load.spritesheet('status-btn', 'assets/exports/UI/Status-Btn.png', {
            frameWidth: 32, frameHeight: 32
        });
    }

    create(data?: any) {
        this.encounterTier = data?.encounterTier || 1;
        this.encounterMapKey = data?.mapKey || '';
        if (this.encounterMapKey) {
            localStorage.setItem('glossary_combat_return_map', this.encounterMapKey);
        }
        this.cameras.main.setBackgroundColor('#FFFFFF');
        this.playerData = this.registry.get('playerData') as PlayerData;
        this.combatTimer = 0;
        this.isAnimating = false;

        this.initCombatSystem();

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
            (chain) => this.onComboConfirmed(chain)
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

        this.input.keyboard!.on(InputKeys.HELP, () => {
            if (!this.scene.isPaused()) {
                this.scene.pause();
                this.scene.launch('Help', { previousScene: 'CombatScene' });
            }
        });
        this.input.keyboard!.on(InputKeys.BACK, () => {
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

        this.time.addEvent({ delay: 1000, callback: this.updateTimer, callbackScope: this, loop: true });

        createVignette(this);

        this.updateTurnIndicator('YOUR TURN - Select Runes');
    }

    private pickEnemyFromBestiary(): { name: string; hp: number; attack: number; defense: number; texture: string; frame: number } {
        const tierEnemies = BESTIARY.filter(e => e.tier === this.encounterTier);
        const pool = tierEnemies.length > 0 ? tierEnemies : BESTIARY.filter(e => e.tier === 1);
        const pick = pool[Math.floor(Math.random() * pool.length)];

        BestiaryData.getInstance().discoverEntity(pick.id);

        return {
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
            stats: { hp: this.playerData!.hp, maxHp: this.playerData!.maxHp, attack: 10, defense: 3 },
            gemstones: this.playerData!.gemstones,
            specialCurrency: this.playerData!.specialCurrency,
            currentChain: null,
            isLocal: true,
            statusEffects: [],
            roundDefense: 0
        };

        const enemyDef = this.pickEnemyFromBestiary();
        const enemies: CombatEnemy[] = [{
            id: 'enemy-0',
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
            this.updatePlayerHp();
            this.showDamageNumber(200, 250, e.data.damage, '#0000cc', '-');
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

        this.combatSystem.on('status_applied', () => {
            this.updateStatusEffects();
        });

        this.combatSystem.on('turn_start', () => {
            this.updateStatusEffects();
        });
    }

    private createPlayerVisual(): void {
        const x = 200;
        const y = 280;
        const covenantColor = COVENANT_COLORS[this.playerData!.covenant] ?? 0xaaaaaa;

        this.playerRect = this.add.rectangle(x, y, 60, 80, covenantColor, 1)
            .setStrokeStyle(3, 0x000000).setScrollFactor(0);

        this.playerStatusContainer = this.add.container(40, 95).setScrollFactor(0);
    }

    private createEnemyVisual(): void {
        if (!this.combatSystem) return;
        const enemy = this.combatSystem.getAllEnemies()[0];
        if (!enemy) return;

        const x = this.scale.width - 200;
        const y = 260;

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
            .setScale(2.5).setScrollFactor(0);
        this.enemySprite.play(idleKey);

        this.enemyHpText = this.add.text(x, y - 85, `${enemy.stats.hp}/${enemy.stats.maxHp}`, {
            fontFamily: FONT_FAMILY, fontSize: '14px', color: '#000000'
        }).setOrigin(0.5).setScrollFactor(0);

        this.enemyStatusContainer = this.add.container(this.scale.width - 40, 95).setScrollFactor(0);
    }

    private createAbilityButton(): void {
        const covenant = this.playerData!.covenant;
        const frame = covenant === 'phoenix' ? 0 : covenant === 'snake' ? 1 : 2;

        const btnX = this.scale.width - 30;
        const btnY = this.scale.height - 100;

        this.abilityBtnSprite = this.add.sprite(btnX, btnY, 'special-attack-btn', frame)
            .setOrigin(1, 0.5).setScrollFactor(0).setScale(2)
            .setInteractive({ useHandCursor: true });

        this.refreshAbilityVisual();

        this.abilityBtnSprite.on('pointerover', () => {
            if (this.canUseAbility()) this.abilityBtnSprite?.setAlpha(1);
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
        if (this.canUseAbility()) {
            this.abilityBtnSprite.clearTint();
            this.abilityBtnSprite.setAlpha(0.85);
        } else {
            this.abilityBtnSprite.setTint(0x555555);
            this.abilityBtnSprite.setAlpha(0.4);
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
            this.tweens.add({
                targets: this.abilityBtnSprite,
                scaleX: 1.3, scaleY: 1.3,
                duration: 150, yoyo: true, ease: 'Quad.easeOut',
                onComplete: () => this.refreshAbilityVisual()
            });
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
                this.enemySprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
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

            const enemy = this.combatSystem!.getAllEnemies()[0];
            const enemyDead = enemy && enemy.stats.hp <= 0;

            this.time.delayedCall(600, () => {
                if (enemyDead && this.enemySprite) {
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
            if (damage > 0 && this.playerRect) {
                this.tweens.add({
                    targets: this.playerRect, x: this.playerRect.x - 8, duration: 50, yoyo: true, repeat: 3
                });
            }

            this.time.delayedCall(600, () => {
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

    private syncPlayerDataFromCombat(): void {
        if (!this.combatSystem || !this.playerData) return;
        const combatPlayer = this.combatSystem.getLocalPlayer();
        if (!combatPlayer) return;
        this.playerData.hp = this.playerData.maxHp;
        this.playerData.specialCurrency = combatPlayer.specialCurrency;
        this.playerData.save();
        this.registry.set('playerData', this.playerData);
    }

    private showCombatEnd(result: string): void {
        this.syncPlayerDataFromCombat();

        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        this.overlayContainer = this.add.container(0, 0).setDepth(500).setScrollFactor(0);

        const bg = this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x000000, 0.8);
        const resultText = this.add.text(centerX, centerY - 30, result, {
            fontFamily: FONT_FAMILY, fontSize: '48px', color: result === 'VICTORY' ? '#FFD700' : '#cc0000', fontStyle: 'bold'
        }).setOrigin(0.5);

        const continueText = this.add.text(centerX, centerY + 40, 'Click to continue', {
            fontFamily: FONT_FAMILY, fontSize: '18px', color: '#FFFFFF'
        }).setOrigin(0.5).setAlpha(0);

        this.overlayContainer.add([bg, resultText, continueText]);

        this.tweens.add({
            targets: continueText, alpha: 1, duration: 1000, delay: 500
        });

        bg.setInteractive();
        bg.on('pointerdown', () => {
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
}
