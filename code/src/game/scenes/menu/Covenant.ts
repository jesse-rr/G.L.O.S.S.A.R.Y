import * as Phaser from 'phaser';
import { PlayerData, CovenantType } from '../../data/PlayerData';
import { UserData } from '../../data/UserData';
import { MultiplayerData } from '../../data/MultiplayerData';
import { RuneData } from '../../data/RuneData';
import { ItemData } from '../../data/ItemData';
import { LocationData } from '../../data/LocationData';
import { BestiaryData } from '../../data/BestiaryData';
import { SlateProgress } from '../../data/SlateData';
import { NetworkManager } from '../../NetworkManager';
import { EventBus, GameEvents } from '../../EventBus';
import { COVENANT_CARD_TINTS, InputKeys, FONT_FAMILY } from '../../constants';
import { resetOpenedChests } from '../../systems/ChestSystem';
import { resetCompletedTrades } from '../../systems/TradeSystem';
import { clearGameplayStorageForNewRun } from '../../utils/SaveReset';

const BG_FRAME_RATE = 8;
const CARD_FRAME_RATE = 8;
const CARD_FRAME_WIDTH = 146;
const CARD_FRAME_HEIGHT = 210;
const CARD_BASE_SCALE = 2;
const CARD_HOVER_SCALE = 2.15;
const CARD_SPACING = 360;
const DEFAULT_CARD_INDEX = 1;

const COVENANTS = [
    { key: 'dragon' },
    { key: 'phoenix' },
    { key: 'snake' }
] as const;

export class Covenant extends Phaser.Scene {
    private cards: Array<{ key: string; sprite: Phaser.GameObjects.Sprite }> = [];
    private selectedCardIndex = DEFAULT_CARD_INDEX;

    private dummyCursors: Map<string, Phaser.GameObjects.Graphics> = new Map();
    private targetPositions: Map<string, { x: number, y: number }> = new Map();
    private lockedCovenants: Map<string, string> = new Map();
    private myLock: string | null = null;
    private inputReady = false;
    private isStartingGame = false;
    private startGameTimer: Phaser.Time.TimerEvent | null = null;

    constructor() {
        super('Covenant');
    }

    preload() {
        this.load.spritesheet('covenant-bg', 'assets/Models/exports/Covenant/Covenant-Sheet-BG.png', {
            frameWidth: 640,
            frameHeight: 360
        });
        this.load.spritesheet('dragon', 'assets/Models/exports/Covenant/Dragon-Sheet.png', {
            frameWidth: CARD_FRAME_WIDTH,
            frameHeight: CARD_FRAME_HEIGHT
        });
        this.load.spritesheet('snake', 'assets/Models/exports/Covenant/Ouroborus-Sheet.png', {
            frameWidth: CARD_FRAME_WIDTH,
            frameHeight: CARD_FRAME_HEIGHT
        });
        this.load.spritesheet('phoenix', 'assets/Models/exports/Covenant/Phoenix-Sheet.png', {
            frameWidth: CARD_FRAME_WIDTH,
            frameHeight: CARD_FRAME_HEIGHT
        });
    }

    create() {
        this.cards = [];
        this.selectedCardIndex = DEFAULT_CARD_INDEX;
        this.dummyCursors.clear();
        this.targetPositions.clear();
        this.lockedCovenants.clear();
        this.myLock = null;
        this.inputReady = false;
        this.isStartingGame = false;
        this.startGameTimer = null;

        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        this.anims.create({
            key: 'covenant-bg',
            frames: this.anims.generateFrameNumbers('covenant-bg', { start: 0, end: 7 }),
            frameRate: BG_FRAME_RATE,
            repeat: -1
        });

        for (const covenant of COVENANTS) {
            this.anims.create({
                key: `${covenant.key}-anim`,
                frames: this.anims.generateFrameNumbers(covenant.key, { start: 0, end: 4 }),
                frameRate: CARD_FRAME_RATE,
                repeat: -1
            });
        }

        this.add.sprite(centerX, centerY, 'covenant-bg').setOrigin(0.5).setScale(2).play('covenant-bg');

        for (let i = 0; i < COVENANTS.length; i++) {
            const covenant = COVENANTS[i];
            const sprite = this.add.sprite(
                centerX + (i - 1) * CARD_SPACING,
                centerY,
                covenant.key
            ).setOrigin(0.5).setScale(CARD_BASE_SCALE).setFrame(1).setAlpha(0.88).setInteractive({ useHandCursor: true });

            sprite.on('pointerover', () => {
                if (!this.inputReady || this.myLock || this.isStartingGame) return;
                this.setSelectedCard(i);
            });

            sprite.on('pointerdown', () => {
                if (!this.inputReady || this.myLock || this.isStartingGame) return;
                this.selectCovenant(covenant.key as CovenantType);
            });

            this.cards.push({ key: covenant.key, sprite });
        }

        this.setSelectedCard(this.selectedCardIndex);

        this.input.keyboard!.on(InputKeys.LEFT, () => {
            if (!this.inputReady || this.myLock || this.isStartingGame) return;
            this.setSelectedCard(this.selectedCardIndex - 1);
        });

        this.input.keyboard!.on(InputKeys.ENTER, () => {
            if (!this.inputReady || this.myLock || this.isStartingGame) return;
            this.selectCovenant(COVENANTS[this.selectedCardIndex].key as CovenantType);
        });

        this.input.keyboard!.on(InputKeys.RIGHT, () => {
            if (!this.inputReady || this.myLock || this.isStartingGame) return;
            this.setSelectedCard(this.selectedCardIndex + 1);
        });

        this.input.keyboard!.on(InputKeys.INTERACT, () => {
            if (!this.inputReady || this.myLock || this.isStartingGame) return;
            this.selectCovenant(COVENANTS[this.selectedCardIndex].key as CovenantType);
        });

        this.time.delayedCall(200, () => { this.inputReady = true; });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            const nm = NetworkManager.getInstance();
            if (nm.role !== 'offline') {
                nm.broadcast({ type: 'CURSOR_MOVE', id: nm.myPeerId, x: pointer.x, y: pointer.y });
            }
        });

        EventBus.on(GameEvents.NETWORK_DATA_RECEIVED, this.onNetworkData, this);
        this.events.on('shutdown', () => {
            EventBus.off(GameEvents.NETWORK_DATA_RECEIVED, this.onNetworkData, this);
            this.startGameTimer?.remove(false);
            this.startGameTimer = null;
        });

        const interactText = this.add.text(centerX, this.scale.height - 30, 'PRESS/HOLD X TO INTERACT', {
            fontFamily: FONT_FAMILY,
            fontSize: '14px',
            color: '#888888',
            align: 'center'
        }).setOrigin(0.5).setAlpha(0.5);

        this.tweens.add({
            targets: interactText,
            alpha: { from: 0.2, to: 0.5 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    update() {
        this.dummyCursors.forEach((sprite, id) => {
            const target = this.targetPositions.get(id);
            if (target) {
                sprite.x = Phaser.Math.Linear(sprite.x, target.x, 0.2);
                sprite.y = Phaser.Math.Linear(sprite.y, target.y, 0.2);
            }
        });
    }

    private onNetworkData(payload: any) {
        const { data } = payload;
        const nm = NetworkManager.getInstance();

        if (data.type === 'CURSOR_MOVE') {
            if (data.id === nm.myPeerId) return;

            if (nm.role === 'host') nm.broadcast(data);

            if (!this.dummyCursors.has(data.id)) {
                const cursor = this.add.graphics();
                cursor.fillStyle(0x999999, 0.9);
                cursor.lineStyle(2, 0x333333, 1);
                cursor.fillTriangle(0, 0, 12, 6, 6, 12);
                cursor.strokeTriangle(0, 0, 12, 6, 6, 12);
                cursor.setDepth(100);
                cursor.x = data.x;
                cursor.y = data.y;

                this.dummyCursors.set(data.id, cursor);
                this.targetPositions.set(data.id, { x: data.x, y: data.y });
            } else {
                this.targetPositions.set(data.id, { x: data.x, y: data.y });
            }
        } else if (data.type === 'LOCK_REQUEST') {
            if (this.isStartingGame) return;
            if (nm.role === 'host') {
                this.handleLockRequest(data.id, data.covenant);
            }
        } else if (data.type === 'COVENANT_LOCKED') {
            if (this.isStartingGame) return;
            if (nm.role === 'host' && data.id !== nm.myPeerId) nm.broadcast(data);
            this.lockedCovenants.set(data.covenant, data.id);
            nm.setPeerCovenant(data.id, data.covenant);
            if (data.id === nm.myPeerId) this.myLock = data.covenant;
            this.updateCardLocks();
        } else if (data.type === 'ALL_READY') {
            this.scheduleStartGame();
        }
    }

    private handleLockRequest(peerId: string, covenant: string) {
        if (this.isStartingGame) return;
        if (this.lockedCovenants.has(covenant)) return;

        for (const [cov, id] of Array.from(this.lockedCovenants.entries())) {
            if (id === peerId) this.lockedCovenants.delete(cov);
        }

        this.lockedCovenants.set(covenant, peerId);
        NetworkManager.getInstance().setPeerCovenant(peerId, covenant as CovenantType);
        for (const [lockedCovenant, lockedPeerId] of this.lockedCovenants.entries()) {
            NetworkManager.getInstance().broadcast({
                type: 'COVENANT_LOCKED',
                id: lockedPeerId,
                covenant: lockedCovenant
            });
        }

        if (peerId === NetworkManager.getInstance().myPeerId) {
            this.myLock = covenant;
        }

        this.updateCardLocks();
        this.checkAllReady();
    }

    private updateCardLocks() {
        const nm = NetworkManager.getInstance();

        for (let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i];
            const lockedBy = this.lockedCovenants.get(card.key);

            const isMyLock = lockedBy === nm.myPeerId || (nm.role === 'offline' && lockedBy === 'offline');

            if (lockedBy && !isMyLock) {
                card.sprite.setTint(0x333333);
                card.sprite.setAlpha(0.85);
                card.sprite.disableInteractive();
                card.sprite.stop();
                card.sprite.setFrame(0);
                this.tweenCardScale(card.sprite, CARD_BASE_SCALE);
            } else if (isMyLock) {
                card.sprite.setTint(COVENANT_CARD_TINTS[card.key as keyof typeof COVENANT_CARD_TINTS]);
                card.sprite.setAlpha(1);
                card.sprite.play(`${card.key}-anim`, true);
                this.tweenCardScale(card.sprite, CARD_HOVER_SCALE);
            } else {
                if (this.myLock) {
                    card.sprite.setTint(0x333333);
                    card.sprite.disableInteractive();
                    card.sprite.stop();
                    card.sprite.setFrame(0);
                    this.tweenCardScale(card.sprite, CARD_BASE_SCALE);
                } else {
                    card.sprite.setInteractive({ useHandCursor: true });
                    if (i !== this.selectedCardIndex) card.sprite.setTint(0x999999);
                }
            }
        }
    }

    private checkAllReady() {
        const nm = NetworkManager.getInstance();
        if (nm.role !== 'host') return;

        const totalPlayers = nm.getConnectedPeers().length + 1;
        if (this.lockedCovenants.size === totalPlayers) {
            nm.broadcast({ type: 'ALL_READY' });
            this.scheduleStartGame();
        }
    }

    private setSelectedCard(index: number) {
        this.selectedCardIndex = Phaser.Math.Wrap(index, 0, COVENANTS.length);

        for (let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i].sprite;
            const isSelected = i === this.selectedCardIndex;

            if (isSelected) {
                card.clearTint();
                card.setAlpha(1);
                this.tweenCardScale(card, CARD_HOVER_SCALE);
                card.play(`${this.cards[i].key}-anim`);
            } else {
                card.setTint(0x999999);
                card.setAlpha(0.85);
                this.tweenCardScale(card, CARD_BASE_SCALE);
                card.stop();
                card.setFrame(1);
            }
        }
    }

    private tweenCardScale(card: Phaser.GameObjects.Sprite, targetScale: number) {
        const existing = card.getData('scaleTween') as Phaser.Tweens.Tween | undefined;
        if (existing) {
            existing.stop();
        }

        const tween = this.tweens.add({
            targets: card,
            scaleX: targetScale,
            scaleY: targetScale,
            duration: 90,
            ease: 'Quad.easeOut'
        });

        card.setData('scaleTween', tween);
    }



    private selectCovenant(covenant: 'dragon' | 'phoenix' | 'snake'): void {
        if (this.isStartingGame) return;

        const nm = NetworkManager.getInstance();
        if (nm.role === 'offline') {
            this.myLock = covenant;
            this.lockedCovenants.set(covenant, 'offline');
            this.updateCardLocks();
            this.scheduleStartGame();
        } else if (nm.role === 'client') {
            nm.broadcast({ type: 'LOCK_REQUEST', id: nm.myPeerId, covenant });
        } else if (nm.role === 'host') {
            this.handleLockRequest(nm.myPeerId, covenant);
        }
    }

    private scheduleStartGame(): void {
        if (this.isStartingGame || this.startGameTimer) return;

        this.startGameTimer = this.time.delayedCall(500, () => {
            this.startGameTimer = null;
            this.startGameWithLock();
        });
    }

    private startGameWithLock(): void {
        if (!this.myLock || this.isStartingGame) return;
        this.isStartingGame = true;
        this.inputReady = false;

        const covenant = this.myLock as 'dragon' | 'phoenix' | 'snake';

        const playerData = this.registry.get('playerData') as PlayerData || PlayerData.getInstance();
        clearGameplayStorageForNewRun();
        playerData.reset();
        playerData.setCovenantData(covenant);
        const userData = this.registry.get('userData') as UserData;
        if (userData) userData.discoverCovenant(covenant);

        let mapKey = 'hub';
        let uniqueRune = '';

        if (covenant === 'dragon') {
            uniqueRune = 'P';
        } else if (covenant === 'phoenix') {
            uniqueRune = 'I';
        } else if (covenant === 'snake') {
            uniqueRune = 'E';
        }

        const runeData = RuneData.getInstance();
        runeData.reset();
        runeData.discoverRune(uniqueRune);
        userData?.discoverRune(uniqueRune);

        ItemData.getInstance().reset();
        LocationData.getInstance().reset();
        BestiaryData.getInstance().reset();
        SlateProgress.getInstance().reset();
        resetOpenedChests();
        resetCompletedTrades();

        const md = MultiplayerData.getInstance();
        if (NetworkManager.getInstance().role === 'offline') {
            md.sharedRunes = [];
        }
        if (md.sharedRunes.length === 0) {
            md.generateSharedRunes(RuneData.getAllDefinitions());
        }
        for (const r of md.sharedRunes) {
            runeData.discoverRune(r);
            userData?.discoverRune(r);
        }

        const nm = NetworkManager.getInstance();
        if (nm.role !== 'offline') {
            const passcode = md.myRoom?.passcode || md.joinedRoom?.passcode || nm.getPasscode();
            const wasHost = nm.role === 'host';
            const roomTitle = md.myRoom?.title || md.joinedRoom?.title || '';
            const peerMap = new Map<string, typeof playerData.covenant>();
            peerMap.set(nm.myPeerId, playerData.covenant);
            nm.getPeerCovenants().forEach(peer => peerMap.set(peer.peerId, peer.covenant));
            const multiplayerPeers = Array.from(peerMap.entries()).map(([peerId, covenant]) => ({ peerId, covenant }));
            if (passcode) {
                playerData.setMultiplayerSession(passcode, wasHost, roomTitle, multiplayerPeers);
            }
            nm.getPeerCovenants().forEach(peer => nm.trackKnownPeer(peer.peerId));
        }

        const sceneKeys = ['MainMenu', 'Help', 'Settings', 'SettingsUI', 'Achievements', 'AchievementsUI', 'Multiplayer'];
        for (const key of sceneKeys) {
            if (this.scene.isActive(key)) {
                this.scene.stop(key);
            }
        }

        if (this.scene.isActive('TransitionScene')) return;

        this.scene.launch('TransitionScene', {
            targetScene: 'LevelScene',
            targetData: { mapKey: mapKey },
            currentScene: 'Covenant'
        });
    }
}
