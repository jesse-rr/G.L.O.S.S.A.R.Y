### Multiplayer Protocol

**1. Rooms & Lobby System**
- **Room Types:** Players can create public or private rooms, or choose to play alone.
- **Auto-Generated Names:** Room titles are automatically randomized by combining thematic words, creating a large number of unique possibilities. (e.g. "Silent Forest", "Whispering Cave", "Forgotten Temple") - There are 13.209 unique combinations.
- **Secure Passcodes:** Private rooms automatically generate a secure 6-character alphanumeric passcode (`A-Z`, `0-9`). Security is not the focus - as its just a room.
- **Player Capacity:** 1-3 Players.
- **Social Features:** Expected integration with a login and friends list system. `FUTURE ADDITION`

**2. Covenant Selection (Live Waiting Room)**
- **Real-Time Sync:** The Covenant selection scene acts as a live waiting room. Players' mouse X/Y coordinates are continuously sent to the Host and broadcasted. Local clients use linear interpolation to display real-time dummy cursors for other players.
- **Exclusive Locking:** Each player locks a different covenant.
- **State Management:** The Host maintains a central state of chosen Covenants (e.g., `{ dragon: null, phoenix: null, ouroborus: null }`). 
- **Selection Flow:** When a player selects a Covenant, they emit a lock request. The Host verifies availability, locks it, and broadcasts the update. Clients locally gray out the selected card and completely remove its interactive hit zone, preventing others from choosing it.

**3. Map Exploration & Shared Loot (Authoritative Host)**
- **Host Authority:** The Host holds the absolute master map configuration and state for all collectibles.
- **Loot Interaction:** When a player touches an item like a Rune, they do not collect it instantly. The client sends an action request (`take_item`) to the Host.
- **Global Sync:** The Host verifies if the item is still available. If accepted, it broadcasts an `item_taken` event to all players.
- **Visual Feedback:** Only upon receiving Host confirmation does the item smoothly fade out on everyone's screen simultaneously. This fundamentally prevents race conditions where network lag causes two players to grab the same rare item. Notification of Unlocked item is shown.
- **Shared Progression:** All acquired items, runes, and finds are shared among the team.

**4. Combat Mechanics**
- Combat is turn-based with all 3 Players participating.
- Players take turns attacking. Each attack can be different.
- The order of attack is random.
- All players have their own lives (100/70/1 hp - Depends on covenant)
- Currency is `NOT` shared
- Encounter scaling strictly follows: 1 Player = 1 Enemy. (Except bosses - Which are buffed)

**5. Networking Infrastructure (Host-Client P2P)**
- **Technology Choice:** The multiplayer implementation will operate on a Peer-to-Peer (P2P) basis (e.g., using WebRTC, PeerJS, or direct connections), where one player acts as the Network Host.
- **Why P2P/Host:** This removes the need for expensive dedicated servers. The Host's machine acts as the authoritative truth, instantly pushing live updates (cursor movements, locked covenants, dropped loot) to connected peer clients with minimal latency.
- **Data Payload:** Messages are kept extremely small using minimal JSON structures (e.g., `{ t: 'move', x: 120, y: 50 }`) to ensure a smooth, high-tick-rate environment for cursor interpolation and synchronized combat.
- **Connection Reliability:** The network layer will implement ping/pong heartbeats to measure latency, automatic reconnect logic for temporary lag-outs, and a session timeout buffer to handle dropped players elegantly (or migrate Host if the original Host disconnects).