import * as Phaser from 'phaser';
import { NetworkManager } from '../../../NetworkManager';
import { PlayerData } from '../../../data/PlayerData';
import { getLevelPlayerDepth } from './LevelPlayerController';

type PresenceCovenant = 'dragon' | 'phoenix' | 'snake';

interface LocalPresenceState {
    mapKey: string;
    x: number;
    y: number;
    flipX: boolean;
    moving: boolean;
}

interface RemotePlayerAvatar {
    sprite: Phaser.GameObjects.Sprite;
    shadow: Phaser.GameObjects.Image;
    targetX: number;
    targetY: number;
    lastSeen: number;
    covenant: PresenceCovenant;
}

const PLAYER_STATE_INTERVAL_MS = 100;
const REMOTE_TIMEOUT_MS = 3500;

export class LevelMultiplayerPresence {
    private scene: Phaser.Scene;
    private getLocalState: () => LocalPresenceState | null;
    private remotePlayers = new Map<string, RemotePlayerAvatar>();
    private awayPeers = new Set<string>();
    private lastStateSent = 0;

    constructor(scene: Phaser.Scene, getLocalState: () => LocalPresenceState | null) {
        this.scene = scene;
        this.getLocalState = getLocalState;
    }

    update(time: number): void {
        this.broadcastLocalState(time);
        this.updateRemotePlayers(time);
    }

    handleNetworkData(data: any): boolean {
        if (!data || data.type !== 'PLAYER_STATE') return false;

        const nm = NetworkManager.getInstance();
        if (data.originPeerId === nm.myPeerId) return true;
        if (nm.role === 'host') {
            nm.broadcast(data);
        }

        if (data.mapKey !== this.getLocalState()?.mapKey) {
            this.destroyRemotePlayer(data.originPeerId);
            return true;
        }

        this.receiveRemoteState(data);
        return true;
    }

    destroy(): void {
        this.remotePlayers.forEach(remote => {
            remote.sprite.destroy();
            remote.shadow.destroy();
        });
        this.remotePlayers.clear();
        this.awayPeers.clear();
    }

    markPeerAway(peerId: string): void {
        this.awayPeers.add(peerId);
    }

    private broadcastLocalState(time: number): void {
        const nm = NetworkManager.getInstance();
        if (nm.role === 'offline' || time - this.lastStateSent < PLAYER_STATE_INTERVAL_MS) return;

        const state = this.getLocalState();
        if (!state) return;

        this.lastStateSent = time;
        nm.broadcast({
            type: 'PLAYER_STATE',
            mapKey: state.mapKey,
            x: Math.round(state.x),
            y: Math.round(state.y),
            flipX: state.flipX,
            moving: state.moving,
            covenant: PlayerData.getInstance().covenant,
            originPeerId: nm.myPeerId
        });
    }

    private receiveRemoteState(data: any): void {
        if (typeof data.originPeerId !== 'string' || typeof data.x !== 'number' || typeof data.y !== 'number') return;

        NetworkManager.getInstance().trackKnownPeer(data.originPeerId);
        this.awayPeers.delete(data.originPeerId);

        let remote = this.remotePlayers.get(data.originPeerId);
        if (!remote) {
            remote = this.createRemotePlayer(data.originPeerId, data.x, data.y, this.normalizeCovenant(data.covenant));
            this.remotePlayers.set(data.originPeerId, remote);
        }

        remote.covenant = this.normalizeCovenant(data.covenant);
        remote.targetX = data.x;
        remote.targetY = data.y;
        remote.lastSeen = this.scene.time.now;
        remote.sprite.setFlipX(!!data.flipX);
        remote.shadow.setFlipX(!!data.flipX);

        const desiredAnim = data.moving ? `remote-run-loop-${remote.covenant}` : `remote-idle-${remote.covenant}`;
        if (remote.sprite.anims.currentAnim?.key !== desiredAnim) {
            remote.sprite.play(desiredAnim);
        }
    }

    private createRemotePlayer(_peerId: string, x: number, y: number, covenant: PresenceCovenant): RemotePlayerAvatar {
        const depth = getLevelPlayerDepth(this.getLocalState()?.mapKey ?? 'hub');
        const shadow = this.scene.add.image(x, y + 16, 'protagonist-shadow')
            .setOrigin(0.5, 1.06)
            .setDepth(depth - 1)
            .setAlpha(0.35)
            .setScale(0.8);

        const sprite = this.scene.add.sprite(x, y, `remote-protagonist-idle-${covenant}`)
            .setOrigin(0.5, 0.67)
            .setDepth(depth)
            .setAlpha(0.78);
        sprite.play(`remote-idle-${covenant}`);

        return {
            sprite,
            shadow,
            targetX: x,
            targetY: y,
            lastSeen: this.scene.time.now,
            covenant
        };
    }

    private updateRemotePlayers(time: number): void {
        this.remotePlayers.forEach((remote, peerId) => {
            if (time - remote.lastSeen > REMOTE_TIMEOUT_MS) {
                if (this.awayPeers.has(peerId)) {
                    return;
                }
                this.destroyRemotePlayer(peerId);
                return;
            }

            remote.sprite.x = Phaser.Math.Linear(remote.sprite.x, remote.targetX, 0.24);
            remote.sprite.y = Phaser.Math.Linear(remote.sprite.y, remote.targetY, 0.24);
            remote.shadow.setPosition(remote.sprite.x, remote.sprite.y + 16);
        });
    }

    private destroyRemotePlayer(peerId: string): void {
        const remote = this.remotePlayers.get(peerId);
        if (!remote) return;

        remote.sprite.destroy();
        remote.shadow.destroy();
        this.remotePlayers.delete(peerId);
    }

    private normalizeCovenant(covenant: unknown): PresenceCovenant {
        if (covenant === 'dragon' || covenant === 'phoenix' || covenant === 'snake') {
            return covenant;
        }
        return 'phoenix';
    }
}
