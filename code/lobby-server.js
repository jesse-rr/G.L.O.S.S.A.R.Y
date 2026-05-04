const http = require('http');

const PORT = 3000;
let rooms = []; // Array of { id, title, isPrivate, currentPlayers, maxPlayers, passcode }

const server = http.createServer((req, res) => {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'GET' && req.url === '/rooms') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        // Don't send passcodes for private rooms
        const safeRooms = rooms.map(r => ({
            id: r.id,
            title: r.title,
            isPrivate: r.isPrivate,
            currentPlayers: r.currentPlayers,
            maxPlayers: r.maxPlayers,
            passcode: r.isPrivate ? null : r.passcode
        }));
        res.end(JSON.stringify(safeRooms));
        return;
    }

    if (req.method === 'POST' && req.url === '/rooms') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            const room = JSON.parse(body);
            room.lastSeen = Date.now();
            const existing = rooms.findIndex(r => r.id === room.id);
            if (existing >= 0) {
                rooms[existing] = room;
            } else {
                rooms.push(room);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        });
        return;
    }

    if (req.method === 'DELETE' && req.url.startsWith('/rooms/')) {
        const id = req.url.split('/')[2];
        rooms = rooms.filter(r => r.id !== id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
    }

    res.writeHead(404);
    res.end();
});

server.listen(PORT, () => {
    console.log(`Lobby Server running at http://localhost:${PORT}`);
});

setInterval(() => {
    const now = Date.now();
    const beforeCount = rooms.length;
    rooms = rooms.filter(r => now - r.lastSeen < 10000); // Remove if no ping for 10s
    if (rooms.length < beforeCount) {
        console.log(`Cleaned up ${beforeCount - rooms.length} stale rooms.`);
    }
}, 5000);
