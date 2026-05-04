import { Peer, DataConnection } from 'peerjs';
import { EventBus } from './EventBus';

export type NetworkRole = 'host' | 'client' | 'offline';

export class NetworkManager {
    private static instance: NetworkManager;
    private peer: Peer | null = null;
    public role: NetworkRole = 'offline';
    
    private connections: Map<string, DataConnection> = new Map();
    private hostConnection: DataConnection | null = null;

    public myPeerId: string = '';

    static getInstance(): NetworkManager {
        if (!NetworkManager.instance) {
            NetworkManager.instance = new NetworkManager();
        }
        return NetworkManager.instance;
    }

    public hostRoom(passcode: string, onReady: (id: string) => void, onError: (err: any) => void) {
        this.disconnect();
        this.role = 'host';
        
        const roomId = 'glossary-game-' + passcode.toLowerCase();
        this.peer = new Peer(roomId);
        
        this.peer.on('open', (id) => {
            this.myPeerId = id;
            onReady(id);
        });

        this.peer.on('connection', (conn) => {
            this.connections.set(conn.peer, conn);
            
            conn.on('open', () => {
                EventBus.emit('peer-connected', conn.peer);
            });

            conn.on('data', (data) => {
                EventBus.emit('network-data-received', { peerId: conn.peer, data });
            });

            conn.on('close', () => {
                this.connections.delete(conn.peer);
                EventBus.emit('peer-disconnected', conn.peer);
            });
        });

        this.peer.on('error', (err) => {
            onError(err);
        });
    }

    public joinRoom(passcode: string, onReady: () => void, onError: (err: any) => void) {
        this.disconnect();
        this.role = 'client';
        
        const hostId = 'glossary-game-' + passcode.toLowerCase();
        this.peer = new Peer();

        this.peer.on('open', (id) => {
            this.myPeerId = id;
            const conn = this.peer!.connect(hostId);
            
            conn.on('open', () => {
                this.hostConnection = conn;
                onReady();
            });

            conn.on('data', (data) => {
                EventBus.emit('network-data-received', { peerId: hostId, data });
            });

            conn.on('close', () => {
                this.hostConnection = null;
                EventBus.emit('host-disconnected');
            });

            conn.on('error', (err) => {
                onError(err);
            });
        });

        this.peer.on('error', (err) => {
            onError(err);
        });
    }

    public broadcast(data: any) {
        if (this.role === 'host') {
            this.connections.forEach(conn => conn.send(data));
        } else if (this.role === 'client' && this.hostConnection) {
            this.hostConnection.send(data);
        }
    }

    public sendTo(peerId: string, data: any) {
        if (this.role === 'host') {
            const conn = this.connections.get(peerId);
            if (conn) {
                conn.send(data);
            }
        }
    }

    public getConnectedPeers(): string[] {
        return Array.from(this.connections.keys());
    }

    public disconnect() {
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        this.connections.clear();
        this.hostConnection = null;
        this.role = 'offline';
        this.myPeerId = '';
    }

    public async registerRoom(roomData: any) {
        try {
            await fetch('http://localhost:3000/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roomData)
            });
        } catch (e) {
            console.error("Lobby register error", e);
        }
    }

    public async unregisterRoom(roomId: string) {
        try {
            await fetch(`http://localhost:3000/rooms/${roomId}`, { method: 'DELETE' });
        } catch (e) {
            console.error("Lobby unregister error", e);
        }
    }

    public async fetchRooms(): Promise<any[]> {
        try {
            const res = await fetch('http://localhost:3000/rooms');
            return await res.json();
        } catch (e) {
            return [];
        }
    }
}
