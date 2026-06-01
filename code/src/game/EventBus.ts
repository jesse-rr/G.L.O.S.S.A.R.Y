import { Events } from 'phaser';

export const GameEvents = {
    NETWORK_DATA_RECEIVED: 'network-data-received',
    PEER_CONNECTED: 'peer-connected',
    PEER_DISCONNECTED: 'peer-disconnected',
    SHOW_NOTIFICATION: 'show-notification',
} as const;

export const EventBus = new Events.EventEmitter();
