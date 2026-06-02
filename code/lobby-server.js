const http = require('http');

const PORT = process.env.PORT || 3000;
let rooms = [];
let signals = [];

const sendJson = (res, status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
};

const readJsonBody = (req, onBody, onError) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
        try {
            onBody(body ? JSON.parse(body) : {});
        } catch (error) {
            onError(error);
        }
    });
};

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'GET' && url.pathname === '/rooms') {
        const safeRooms = rooms.map(r => ({
            id: r.id,
            title: r.title,
            isPrivate: r.isPrivate,
            currentPlayers: r.currentPlayers,
            maxPlayers: r.maxPlayers,
            passcode: r.isPrivate ? null : r.passcode,
            hostPeerId: r.hostPeerId ?? null
        }));
        sendJson(res, 200, safeRooms);
        return;
    }

    if (req.method === 'POST' && url.pathname === '/rooms') {
        readJsonBody(req, (room) => {
            room.lastSeen = Date.now();
            const existing = rooms.findIndex(r => r.id === room.id);
            if (existing >= 0) {
                rooms[existing] = room;
            } else {
                rooms.push(room);
            }
            sendJson(res, 200, { success: true });
        }, () => sendJson(res, 400, { success: false, error: 'Invalid JSON body' }));
        return;
    }

    if (req.method === 'DELETE' && url.pathname.startsWith('/rooms/')) {
        const id = decodeURIComponent(url.pathname.split('/')[2] || '');
        rooms = rooms.filter(r => r.id !== id);
        signals = signals.filter(signal => signal.roomId !== `glossary-game-${id.toLowerCase()}`);
        sendJson(res, 200, { success: true });
        return;
    }

    if (req.method === 'GET' && url.pathname.startsWith('/signals/')) {
        const roomId = decodeURIComponent(url.pathname.split('/')[2] || '');
        const peerId = url.searchParams.get('peerId');
        if (!roomId || !peerId) {
            sendJson(res, 400, { success: false, error: 'Missing roomId or peerId' });
            return;
        }

        const visibleSignals = signals.filter(signal => (
            signal.roomId === roomId
            && signal.from !== peerId
            && (!signal.to || signal.to === peerId)
        ));
        sendJson(res, 200, visibleSignals);
        return;
    }

    if (req.method === 'POST' && url.pathname.startsWith('/signals/')) {
        const roomId = decodeURIComponent(url.pathname.split('/')[2] || '');
        if (!roomId) {
            sendJson(res, 400, { success: false, error: 'Missing roomId' });
            return;
        }

        readJsonBody(req, (signal) => {
            if (!signal.from || !signal.type || !signal.payload) {
                sendJson(res, 400, { success: false, error: 'Invalid signal' });
                return;
            }

            signals.push({
                id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                roomId,
                from: signal.from,
                to: signal.to || null,
                type: signal.type,
                payload: signal.payload,
                createdAt: Date.now()
            });
            sendJson(res, 200, { success: true });
        }, () => sendJson(res, 400, { success: false, error: 'Invalid JSON body' }));
        return;
    }

    if (req.method === 'DELETE' && url.pathname.startsWith('/signals/')) {
        const [, , roomIdRaw, peerIdRaw] = url.pathname.split('/');
        const roomId = decodeURIComponent(roomIdRaw || '');
        const peerId = decodeURIComponent(peerIdRaw || '');
        signals = signals.filter(signal => (
            signal.roomId !== roomId
            || (peerId && signal.from !== peerId && signal.to !== peerId)
        ));
        sendJson(res, 200, { success: true });
        return;
    }

    res.writeHead(404);
    res.end();
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Lobby Server running at http://0.0.0.0:${PORT}`);
});

setInterval(() => {
    const now = Date.now();
    const beforeCount = rooms.length;
    rooms = rooms.filter(r => now - r.lastSeen < 10000);
    signals = signals.filter(signal => now - signal.createdAt < 30000);
    if (rooms.length < beforeCount) {
        console.log(`Cleaned up ${beforeCount - rooms.length} stale rooms.`);
    }
}, 5000);
