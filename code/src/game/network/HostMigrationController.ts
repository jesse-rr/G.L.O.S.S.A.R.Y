import { EventBus, GameEvents } from '../EventBus';
import { NetworkManager } from '../NetworkManager';
import { PlayerData } from '../data/PlayerData';
import { LevelMultiplayerPresence } from '../scenes/world/level/LevelMultiplayerPresence';

const CANONICAL_RETURN_POLL_MS = 1000;

export class HostMigrationController {
    private presence: LevelMultiplayerPresence | null = null;
    private migrationInProgress = false;
    private heartbeatTimer: number | null = null;
    private returnPollTimer: number | null = null;

    private onPeerDisconnected = (peerId: string): void => {
        const nm = NetworkManager.getInstance();
        if (nm.role === 'offline') return;

        this.presence?.markPeerAway(peerId);

        if (peerId !== nm.getCanonicalHostPeerId()) return;
        if (this.migrationInProgress) return;

        this.migrationInProgress = true;

        const newHostId = nm.electNewHost();
        if (!newHostId) {
            this.migrationInProgress = false;
            return;
        }

        if (newHostId === nm.myPeerId) {
            nm.promoteToHost();
            this.startLobbyHeartbeat();
            nm.broadcast({ type: 'HOST_MIGRATION', newHostPeerId: newHostId, originPeerId: nm.myPeerId });
            this.migrationInProgress = false;
            return;
        }

        nm.reconnectToHost(newHostId, () => {
            this.migrationInProgress = false;
        }, () => {
            this.migrationInProgress = false;
        });
    };

    private onHostRestored = (): void => {
        const nm = NetworkManager.getInstance();
        if (nm.getIsTemporaryHost()) {
            this.stopLobbyHeartbeat();
            nm.handleHostRestored();
            return;
        }

        if (nm.role === 'client') {
            const canonicalId = nm.getCanonicalHostPeerId();
            if (nm.getRelayHostPeerId() !== canonicalId) {
                nm.reconnectToHost(canonicalId);
            }
        }
    };

    private onNetworkData = (payload: any): void => {
        const data = payload.data;
        if (!data) return;

        const nm = NetworkManager.getInstance();

        if (data.type === 'PEER_LEFT' && typeof data.peerId === 'string') {
            if (data.originPeerId === nm.myPeerId) return;
            this.presence?.markPeerAway(data.peerId);
            return;
        }

        if (data.type === 'HOST_MIGRATION' && typeof data.newHostPeerId === 'string') {
            if (data.newHostPeerId === nm.myPeerId) return;
            if (nm.role === 'host' && nm.getIsTemporaryHost()) return;

            if (nm.role === 'client' && data.newHostPeerId !== nm.myPeerId) {
                nm.reconnectToHost(data.newHostPeerId);
            }
            return;
        }

        if (data.type === 'HOST_RESTORED') {
            if (data.originPeerId === nm.myPeerId) return;
            this.onHostRestored();
        }
    };

    private onPeerConnected = (peerId: string): void => {
        NetworkManager.getInstance().trackKnownPeer(peerId);
    };

    attach(presence: LevelMultiplayerPresence): void {
        this.presence = presence;
        const nm = NetworkManager.getInstance();
        const playerData = PlayerData.getInstance();
        nm.getPeerCovenants().forEach(peer => nm.trackKnownPeer(peer.peerId));
        EventBus.on(GameEvents.PEER_DISCONNECTED, this.onPeerDisconnected);
        EventBus.on(GameEvents.PEER_CONNECTED, this.onPeerConnected);
        EventBus.on(GameEvents.HOST_RESTORED, this.onHostRestored);
        EventBus.on(GameEvents.NETWORK_DATA_RECEIVED, this.onNetworkData);
        this.startCanonicalReturnPoll();
        if (nm.role === 'host' && !nm.getIsTemporaryHost() && playerData.multiplayerPasscode) {
            this.startCanonicalHostHeartbeat();
        }
    }

    destroy(): void {
        this.stopLobbyHeartbeat();
        this.stopCanonicalReturnPoll();
        EventBus.off(GameEvents.PEER_DISCONNECTED, this.onPeerDisconnected);
        EventBus.off(GameEvents.PEER_CONNECTED, this.onPeerConnected);
        EventBus.off(GameEvents.HOST_RESTORED, this.onHostRestored);
        EventBus.off(GameEvents.NETWORK_DATA_RECEIVED, this.onNetworkData);
        this.presence = null;
        this.migrationInProgress = false;
    }

    private startLobbyHeartbeat(): void {
        this.stopLobbyHeartbeat();
        const playerData = PlayerData.getInstance();
        const passcode = playerData.multiplayerPasscode;
        if (!passcode) return;

        const sendHeartbeat = () => {
            const nm = NetworkManager.getInstance();
            if (nm.role !== 'host' || !nm.getIsTemporaryHost()) return;

            void nm.registerRoom({
                id: passcode,
                title: playerData.multiplayerRoomTitle || 'In Progress',
                passcode,
                isPrivate: true,
                currentPlayers: nm.getConnectedPeers().length + 1,
                maxPlayers: 3,
                hostPeerId: nm.myPeerId
            });
        };

        sendHeartbeat();
        this.heartbeatTimer = window.setInterval(sendHeartbeat, 1000);
    }

    private stopLobbyHeartbeat(): void {
        if (this.heartbeatTimer !== null) {
            window.clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    private startCanonicalHostHeartbeat(): void {
        this.stopLobbyHeartbeat();
        const playerData = PlayerData.getInstance();
        const passcode = playerData.multiplayerPasscode;
        if (!passcode) return;

        const sendHeartbeat = () => {
            const nm = NetworkManager.getInstance();
            if (nm.role !== 'host' || nm.getIsTemporaryHost()) return;

            void nm.registerRoom({
                id: passcode,
                title: playerData.multiplayerRoomTitle || 'In Progress',
                passcode,
                isPrivate: true,
                currentPlayers: nm.getConnectedPeers().length + 1,
                maxPlayers: 3,
                hostPeerId: nm.getCanonicalHostPeerId()
            });
        };

        sendHeartbeat();
        this.heartbeatTimer = window.setInterval(sendHeartbeat, 1000);
    }

    private startCanonicalReturnPoll(): void {
        this.stopCanonicalReturnPoll();
        const playerData = PlayerData.getInstance();
        const passcode = playerData.multiplayerPasscode;
        if (!passcode) return;

        this.returnPollTimer = window.setInterval(() => {
            const nm = NetworkManager.getInstance();
            if (nm.role === 'offline') return;

            const canonicalId = nm.getCanonicalHostPeerId();
            if (nm.getRelayHostPeerId() === canonicalId) return;
            if (nm.role === 'host' && !nm.getIsTemporaryHost()) return;

            void nm.fetchRooms().then(rooms => {
                const room = rooms.find(r => r.id === passcode || r.passcode === passcode);
                if (room?.hostPeerId !== canonicalId) return;

                if (nm.getIsTemporaryHost()) {
                    this.stopLobbyHeartbeat();
                    nm.handleHostRestored();
                } else if (nm.role === 'client') {
                    nm.reconnectToHost(canonicalId);
                }
            });
        }, CANONICAL_RETURN_POLL_MS);
    }

    private stopCanonicalReturnPoll(): void {
        if (this.returnPollTimer !== null) {
            window.clearInterval(this.returnPollTimer);
            this.returnPollTimer = null;
        }
    }
}
