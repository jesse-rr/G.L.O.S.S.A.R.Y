import { EventBus, GameEvents } from './EventBus';

export type NetworkRole = 'host' | 'client' | 'offline';

type SignalType = 'offer' | 'answer' | 'ice';

interface SignalMessage {
    id: string;
    roomId: string;
    from: string;
    to: string | null;
    type: SignalType;
    payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

interface PeerConnectionState {
    peerConnection: RTCPeerConnection;
    dataChannel: RTCDataChannel | null;
    pendingIceCandidates: RTCIceCandidateInit[];
}

const LOBBY_SERVER_URL = 'http://localhost:3000';
const SIGNAL_POLL_MS = 650;
const RTC_CONFIGURATION: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

export class NetworkManager {
    private static instance: NetworkManager;
    public role: NetworkRole = 'offline';
    public myPeerId: string = '';

    private roomId = '';
    private connections: Map<string, PeerConnectionState> = new Map();
    private hostConnection: PeerConnectionState | null = null;
    private seenSignals: Set<string> = new Set();
    private pollTimer: number | null = null;

    static getInstance(): NetworkManager {
        if (!NetworkManager.instance) {
            NetworkManager.instance = new NetworkManager();
        }
        return NetworkManager.instance;
    }

    public hostRoom(passcode: string, onReady: (id: string) => void, onError: (err: any) => void) {
        this.disconnect();
        this.role = 'host';
        this.roomId = this.getRoomId(passcode);
        this.myPeerId = this.roomId;
        this.startSignalPolling(onError);
        onReady(this.myPeerId);
    }

    public joinRoom(passcode: string, onReady: () => void, onError: (err: any) => void) {
        this.disconnect();
        this.role = 'client';
        this.roomId = this.getRoomId(passcode);
        this.myPeerId = this.createPeerId();

        const peerState = this.createPeerConnection(this.roomId, onError);
        this.hostConnection = peerState;

        const channel = peerState.peerConnection.createDataChannel('glossary-game', { ordered: true });
        peerState.dataChannel = channel;
        this.bindDataChannel(this.roomId, channel, onReady);
        this.startSignalPolling(onError);

        peerState.peerConnection.createOffer()
            .then(offer => peerState.peerConnection.setLocalDescription(offer))
            .then(() => this.sendSignal({
                from: this.myPeerId,
                to: this.roomId,
                type: 'offer',
                payload: peerState.peerConnection.localDescription!.toJSON()
            }))
            .catch(onError);
    }

    public broadcast(data: any) {
        if (this.role === 'host') {
            this.connections.forEach(conn => this.sendOnChannel(conn.dataChannel, data));
        } else if (this.role === 'client' && this.hostConnection) {
            this.sendOnChannel(this.hostConnection.dataChannel, data);
        }
    }

    public sendTo(peerId: string, data: any) {
        if (this.role !== 'host') return;

        const conn = this.connections.get(peerId);
        if (conn) {
            this.sendOnChannel(conn.dataChannel, data);
        }
    }

    public getConnectedPeers(): string[] {
        return Array.from(this.connections.entries())
            .filter(([, conn]) => conn.dataChannel?.readyState === 'open')
            .map(([peerId]) => peerId);
    }

    public disconnect() {
        if (this.pollTimer !== null) {
            window.clearInterval(this.pollTimer);
            this.pollTimer = null;
        }

        this.connections.forEach(conn => {
            this.closePeerState(conn);
        });
        this.connections.clear();

        if (this.hostConnection) {
            this.closePeerState(this.hostConnection);
        }
        this.hostConnection = null;

        if (this.roomId) {
            void this.clearSignals(this.roomId, this.myPeerId);
        }

        this.role = 'offline';
        this.myPeerId = '';
        this.roomId = '';
        this.seenSignals.clear();
    }

    public async registerRoom(roomData: any) {
        try {
            await fetch(`${LOBBY_SERVER_URL}/rooms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roomData)
            });
        } catch (e) {
            console.error('Lobby register error', e);
        }
    }

    public async unregisterRoom(roomId: string) {
        try {
            await fetch(`${LOBBY_SERVER_URL}/rooms/${roomId}`, { method: 'DELETE' });
            await this.clearSignals(this.getRoomId(roomId), this.myPeerId);
        } catch (e) {
            console.error('Lobby unregister error', e);
        }
    }

    public async fetchRooms(): Promise<any[]> {
        try {
            const res = await fetch(`${LOBBY_SERVER_URL}/rooms`);
            return await res.json();
        } catch (e) {
            return [];
        }
    }

    private createPeerConnection(peerId: string, onError: (err: any) => void): PeerConnectionState {
        const peerConnection = new RTCPeerConnection(RTC_CONFIGURATION);
        const state: PeerConnectionState = { peerConnection, dataChannel: null, pendingIceCandidates: [] };

        peerConnection.onicecandidate = (event) => {
            if (!event.candidate || this.role === 'offline') return;

            void this.sendSignal({
                from: this.myPeerId,
                to: peerId,
                type: 'ice',
                payload: event.candidate.toJSON()
            }).catch(onError);
        };

        peerConnection.ondatachannel = (event) => {
            state.dataChannel = event.channel;
            this.bindDataChannel(peerId, event.channel);
        };

        peerConnection.onconnectionstatechange = () => {
            if (['failed', 'closed', 'disconnected'].includes(peerConnection.connectionState)) {
                this.removePeer(peerId);
            }
        };

        return state;
    }

    private bindDataChannel(peerId: string, channel: RTCDataChannel, onOpen?: () => void): void {
        channel.onopen = () => {
            EventBus.emit(GameEvents.PEER_CONNECTED, peerId);
            onOpen?.();
        };

        channel.onmessage = (event) => {
            const data = this.parseData(event.data);
            EventBus.emit(GameEvents.NETWORK_DATA_RECEIVED, { peerId, data });
        };

        channel.onclose = () => {
            this.removePeer(peerId);
        };
    }

    private async handleSignal(signal: SignalMessage, onError: (err: any) => void): Promise<void> {
        if (signal.from === this.myPeerId || this.seenSignals.has(signal.id)) return;

        this.seenSignals.add(signal.id);

        if (this.role === 'host') {
            await this.handleHostSignal(signal, onError);
        } else if (this.role === 'client') {
            await this.handleClientSignal(signal);
        }
    }

    private async handleHostSignal(signal: SignalMessage, onError: (err: any) => void): Promise<void> {
        if (signal.type === 'offer') {
            let state = this.connections.get(signal.from);
            if (!state) {
                state = this.createPeerConnection(signal.from, onError);
                this.connections.set(signal.from, state);
            }

            await state.peerConnection.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
            await this.flushPendingIceCandidates(state);
            const answer = await state.peerConnection.createAnswer();
            await state.peerConnection.setLocalDescription(answer);
            await this.sendSignal({
                from: this.myPeerId,
                to: signal.from,
                type: 'answer',
                payload: state.peerConnection.localDescription!.toJSON()
            });
            return;
        }

        if (signal.type === 'ice') {
            const state = this.connections.get(signal.from);
            if (state) {
                await this.addIceCandidate(state, signal.payload as RTCIceCandidateInit);
            }
        }
    }

    private async handleClientSignal(signal: SignalMessage): Promise<void> {
        if (!this.hostConnection) return;

        if (signal.type === 'answer') {
            await this.hostConnection.peerConnection.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
            await this.flushPendingIceCandidates(this.hostConnection);
            return;
        }

        if (signal.type === 'ice') {
            await this.addIceCandidate(this.hostConnection, signal.payload as RTCIceCandidateInit);
        }
    }

    private async addIceCandidate(state: PeerConnectionState, candidate: RTCIceCandidateInit): Promise<void> {
        if (!state.peerConnection.remoteDescription) {
            state.pendingIceCandidates.push(candidate);
            return;
        }

        await state.peerConnection.addIceCandidate(candidate);
    }

    private async flushPendingIceCandidates(state: PeerConnectionState): Promise<void> {
        const candidates = state.pendingIceCandidates.splice(0);
        for (const candidate of candidates) {
            await state.peerConnection.addIceCandidate(candidate);
        }
    }

    private startSignalPolling(onError: (err: any) => void): void {
        this.pollTimer = window.setInterval(() => {
            void this.fetchSignals()
                .then(signals => Promise.all(signals.map(signal => this.handleSignal(signal, onError))))
                .catch(onError);
        }, SIGNAL_POLL_MS);
    }

    private async fetchSignals(): Promise<SignalMessage[]> {
        if (!this.roomId || !this.myPeerId) return [];

        const res = await fetch(`${LOBBY_SERVER_URL}/signals/${this.roomId}?peerId=${this.myPeerId}`);
        return await res.json();
    }

    private async sendSignal(signal: Omit<SignalMessage, 'id' | 'roomId'>): Promise<void> {
        await fetch(`${LOBBY_SERVER_URL}/signals/${this.roomId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(signal)
        });
    }

    private async clearSignals(roomId: string, peerId: string): Promise<void> {
        if (!roomId || !peerId) return;

        await fetch(`${LOBBY_SERVER_URL}/signals/${roomId}/${peerId}`, { method: 'DELETE' });
    }

    private sendOnChannel(channel: RTCDataChannel | null, data: any): void {
        if (channel?.readyState === 'open') {
            channel.send(JSON.stringify(data));
        }
    }

    private parseData(data: unknown): any {
        if (typeof data !== 'string') return data;

        try {
            return JSON.parse(data);
        } catch {
            return data;
        }
    }

    private removePeer(peerId: string): void {
        if (this.role === 'host') {
            const conn = this.connections.get(peerId);
            if (conn) {
                this.closePeerState(conn);
                this.connections.delete(peerId);
                EventBus.emit(GameEvents.PEER_DISCONNECTED, peerId);
            }
            return;
        }

        if (this.hostConnection && peerId === this.roomId) {
            this.closePeerState(this.hostConnection);
            this.hostConnection = null;
            EventBus.emit(GameEvents.PEER_DISCONNECTED, peerId);
        }
    }

    private closePeerState(state: PeerConnectionState): void {
        if (state.dataChannel) {
            state.dataChannel.onclose = null;
            state.dataChannel.close();
        }
        state.peerConnection.onconnectionstatechange = null;
        state.peerConnection.onicecandidate = null;
        state.peerConnection.ondatachannel = null;
        state.peerConnection.close();
    }

    private getRoomId(passcode: string): string {
        return `glossary-game-${passcode.toLowerCase()}`;
    }

    private createPeerId(): string {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return `glossary-peer-${crypto.randomUUID()}`;
        }

        return `glossary-peer-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
}
