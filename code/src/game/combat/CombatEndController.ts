import * as Phaser from 'phaser';
import { FONT_FAMILY } from '../constants';
import { EventBus, GameEvents } from '../EventBus';
import { NetworkManager } from '../NetworkManager';
import { PlayerData } from '../data/PlayerData';
import { UserData } from '../data/UserData';
import { CombatCompletionRecord, recordCompletedCombat } from '../utils/CombatProgress';
import { CombatSystem } from './CombatSystem';

type CombatResult = 'VICTORY' | 'DEFEAT';

interface CombatEndControllerDeps {
    combatSystem: CombatSystem;
    encounterMapKey: string;
    encounterTier: number;
    playerData: PlayerData;
    getPlayerShadow: () => Phaser.GameObjects.Image | null;
    getPlayerSprite: () => Phaser.GameObjects.Sprite | null;
    combatId?: string;
}

export class CombatEndController {
    private scene: Phaser.Scene;
    private deps: CombatEndControllerDeps;
    private combatEnded = false;
    private transitionStarted = false;
    private overlayContainer: Phaser.GameObjects.Container | null = null;

    constructor(scene: Phaser.Scene, deps: CombatEndControllerDeps) {
        this.scene = scene;
        this.deps = deps;
    }

    show(result: CombatResult): void {
        if (this.combatEnded) return;
        this.combatEnded = true;

        this.syncPlayerDataFromCombat(result);
        const rewards = result === 'VICTORY' ? this.applyVictoryRewards() : {
            earnedGems: 0,
            earnedSpecial: 0,
            earnedTokens: 0,
            defeatedEnemyName: 'Unknown Enemy'
        };

        if (result === 'DEFEAT') {
            UserData.getInstance().addDeath();
            this.playDefeatAnimation();
        }

        this.deps.playerData.inCombat = false;
        this.deps.playerData.combatEnemyId = null;
        this.deps.playerData.save();

        this.showOverlay(result, rewards);
    }

    private syncPlayerDataFromCombat(result: CombatResult): void {
        const combatPlayer = this.deps.combatSystem.getLocalPlayer();
        if (!combatPlayer) return;

        if (this.deps.encounterMapKey === 'summit-settlement') {
            const isDefeat = result === 'DEFEAT' || combatPlayer.stats.hp <= 0;
            this.deps.playerData.hp = isDefeat ? 100 : combatPlayer.stats.hp;
        } else {
            this.deps.playerData.hp = this.deps.playerData.maxHp;
        }

        this.deps.playerData.specialCurrency = combatPlayer.specialCurrency;
        this.deps.playerData.save();
        this.scene.registry.set('playerData', this.deps.playerData);
    }

    private applyVictoryRewards(): CombatRewards {
        if (this.deps.encounterMapKey === 'summit-settlement') {
            localStorage.setItem('glossary_boss_combat_victory', 'true');
        }

        const enemy = this.deps.combatSystem.getAllEnemies()[0] ?? null;
        const defeatedEnemyName = enemy ? enemy.name : 'Unknown Enemy';
        const earnedGems = this.deps.encounterTier * 15 + Phaser.Math.Between(5, 15);
        const earnedSpecial = this.deps.encounterTier;
        const earnedTokens = 50;

        this.deps.playerData.gemstones += earnedGems;
        this.deps.playerData.specialCurrency += earnedSpecial;

        const completionRecord: CombatCompletionRecord = {
            enemyName: defeatedEnemyName,
            gems: earnedGems,
            specialCur: earnedSpecial,
            tokens: earnedTokens,
            completionId: this.deps.combatId || this.createCompletionId()
        };

        incrementEchojarCombatCount();
        if (recordCompletedCombat(this.deps.encounterMapKey, completionRecord)) {
            EventBus.emit(GameEvents.COMBAT_PROGRESS_CHANGED);
            this.broadcastCombatCompletion(completionRecord);
        }

        return { earnedGems, earnedSpecial, earnedTokens, defeatedEnemyName };
    }

    private createCompletionId(): string {
        const nm = NetworkManager.getInstance();
        const sourceId = nm.myPeerId || 'solo';
        return `${sourceId}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    private broadcastCombatCompletion(combatRecord: CombatCompletionRecord): void {
        const nm = NetworkManager.getInstance();
        if (nm.role === 'offline') return;

        nm.broadcast({
            type: 'COMBAT_COMPLETED',
            mapKey: this.deps.encounterMapKey,
            combatRecord,
            originPeerId: nm.myPeerId
        });
    }

    private playDefeatAnimation(): void {
        const playerSprite = this.deps.getPlayerSprite();
        if (playerSprite) {
            playerSprite.play('combat-player-death');
            playerSprite.setDepth(100);
        }

        const playerShadow = this.deps.getPlayerShadow();
        if (playerShadow) {
            this.scene.tweens.add({
                targets: playerShadow,
                alpha: 0,
                duration: 800,
                ease: 'Quad.easeIn'
            });
        }
    }

    private showOverlay(result: CombatResult, rewards: CombatRewards): void {
        const centerX = this.scene.scale.width / 2;
        const centerY = this.scene.scale.height / 2;

        this.overlayContainer = this.scene.add.container(0, 0).setDepth(500).setScrollFactor(0);

        const bg = this.scene.add.rectangle(centerX, centerY, this.scene.scale.width, this.scene.scale.height, 0x000000, 0);
        this.scene.tweens.add({ targets: bg, fillAlpha: 0.85, duration: 800, ease: 'Sine.easeOut' });

        const isVictory = result === 'VICTORY';
        const resultText = this.scene.add.text(centerX, centerY - 60, result, {
            fontFamily: FONT_FAMILY,
            fontSize: '80px',
            color: isVictory ? '#FFD700' : '#cc0000',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setAlpha(0);

        this.scene.tweens.add({
            targets: resultText,
            alpha: 1,
            duration: 800,
            ease: 'Sine.easeOut',
            delay: result === 'DEFEAT' ? 1000 : 300
        });

        const elements: Phaser.GameObjects.GameObject[] = [bg, resultText];
        let delayTime = result === 'DEFEAT' ? 1800 : 800;

        if (isVictory) {
            delayTime = this.addVictoryRewardText(centerX, centerY, delayTime, rewards, elements);
        }

        const continueText = this.scene.add.text(centerX, centerY + 100, '- Click anywhere to continue -', {
            fontFamily: FONT_FAMILY,
            fontSize: '18px',
            color: '#aaaaaa'
        }).setOrigin(0.5).setAlpha(0);
        elements.push(continueText);

        this.scene.tweens.add({
            targets: continueText,
            alpha: 1,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: delayTime
        });

        this.overlayContainer.add(elements);
        bg.setInteractive();
        bg.on('pointerdown', () => this.continueFromCombat(result));
    }

    private addVictoryRewardText(
        centerX: number,
        centerY: number,
        delayTime: number,
        rewards: CombatRewards,
        elements: Phaser.GameObjects.GameObject[]
    ): number {
        const subText = this.scene.add.text(centerX, centerY + 10, `${rewards.defeatedEnemyName} Defeated!`, {
            fontFamily: FONT_FAMILY,
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setAlpha(0);

        const lootText = this.scene.add.text(
            centerX,
            centerY + 45,
            `+${rewards.earnedGems} Gemstones  |  +${rewards.earnedSpecial} Special Currency  |  +${rewards.earnedTokens} Tokens`,
            {
                fontFamily: FONT_FAMILY,
                fontSize: '18px',
                color: '#50bfe6',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5).setAlpha(0);

        elements.push(subText, lootText);

        this.scene.tweens.add({
            targets: subText,
            y: centerY,
            alpha: 1,
            duration: 600,
            ease: 'Quad.easeOut',
            delay: delayTime
        });
        delayTime += 400;

        this.scene.tweens.add({
            targets: lootText,
            y: centerY + 35,
            alpha: 1,
            duration: 600,
            ease: 'Quad.easeOut',
            delay: delayTime
        });

        return delayTime + 600;
    }

    private continueFromCombat(result: CombatResult): void {
        if (this.transitionStarted) return;
        this.transitionStarted = true;

        if (result === 'DEFEAT') {
            this.continueFromDefeat();
            return;
        }

        const returnMap = localStorage.getItem('glossary_combat_return_map') || this.deps.encounterMapKey || 'hub';
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

        this.scene.scene.launch('TransitionScene', {
            targetScene: 'LevelScene',
            targetData: spawnData,
            currentScene: 'CombatScene'
        });
    }

    private continueFromDefeat(): void {
        clearBossCombatStorage();

        this.deps.playerData.hp = this.deps.playerData.maxHp;
        this.deps.playerData.save();

        this.scene.scene.launch('TransitionScene', {
            targetScene: 'LevelScene',
            targetData: { mapKey: this.deps.encounterMapKey === 'summit-settlement' ? 'summit-settlement' : 'hub' },
            currentScene: 'CombatScene'
        });
    }
}

interface CombatRewards {
    earnedGems: number;
    earnedSpecial: number;
    earnedTokens: number;
    defeatedEnemyName: string;
}

function incrementEchojarCombatCount(): void {
    try {
        const echoRaw = localStorage.getItem('glossary_echojar_completed_combats');
        const echoCount = (parseInt(echoRaw || '0', 10) || 0) + 1;
        localStorage.setItem('glossary_echojar_completed_combats', echoCount.toString());
    } catch { }
}

function clearBossCombatStorage(): void {
    localStorage.removeItem('glossary_boss_fight_active');
    localStorage.removeItem('glossary_boss_pillars_defeated');
    localStorage.removeItem('glossary_boss_remaining_pillars');
    localStorage.removeItem('glossary_boss_current_combat_pillar');
    localStorage.removeItem('glossary_boss_combat_victory');
}
