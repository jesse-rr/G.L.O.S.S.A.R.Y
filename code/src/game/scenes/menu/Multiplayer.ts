import * as Phaser from 'phaser';
import { MultiplayerData, RoomData } from '../../data/MultiplayerData';
import { RuneData } from '../../data/RuneData';
import { NetworkManager } from '../../NetworkManager';
import { EventBus, GameEvents } from '../../EventBus';
import { FONT_FAMILY, InputKeys } from '../../constants';
import { AudioManager } from '../../utils/AudioManager';

export class Multiplayer extends Phaser.Scene {
    private audioManager!: AudioManager;
    private isStartingGame = false;

    constructor() {
        super('Multiplayer');
    }

    preload() {
        this.load.image('multiplayer-bg', 'assets/Models/exports/UI/Multiplayer-UI.png');
        this.load.image('multiplayer-room-ui', 'assets/Models/exports/UI/Multiplayer-Room-UI.png');
        this.load.image('multiplayer-room-ui-2', 'assets/Models/exports/UI/Multiplayer-Room-UI-2.png');
        this.load.image('go-back-ui', 'assets/Models/exports/UI/Go-Back-UI.png');
        this.load.spritesheet('ui-items', 'assets/Models/exports/UI/UI-Items.png', { frameWidth: 32, frameHeight: 32 });
        this.audioManager = new AudioManager(this);
        this.audioManager.loadAudio();
    }

    create() {
        this.isStartingGame = false;
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.6)
            .setOrigin(0)
            .setScrollFactor(0);

        const scale = 2;
        const centerX = Math.floor(this.scale.width / 2);
        const centerY = Math.floor(this.scale.height / 2);

        this.add.image(centerX, centerY, 'multiplayer-bg')
            .setOrigin(0.5)
            .setScale(scale);

        const goBack = this.add.image(20, 20, 'go-back-ui')
            .setOrigin(0)
            .setScale(2)
            .setFlipX(true)
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true });

        goBack.on('pointerdown', (p: Phaser.Input.Pointer) => {
            if (p.button !== 0) return;
            if (this.isStartingGame) return;
            this.audioManager.uiClick();
            this.scene.stop();
            this.scene.resume('MainMenu');
        });

        this.input.keyboard!.on(InputKeys.BACK, () => {
            if (this.isStartingGame) return;
            this.audioManager.uiClick();
            this.scene.stop();
            this.scene.resume('MainMenu');
        });

        const panelWidth = 257 * scale;
        const panelHeight = 440;
        const panelX = centerX - 144;
        const panelY = centerY + 90;

        const headerY = panelY - panelHeight / 2 + 10;
        this.add.text(panelX - panelWidth / 2 + 30, headerY, 'Name', { fontSize: '20px', color: '#aaaaaa', fontFamily: FONT_FAMILY }).setOrigin(0, 0);
        this.add.text(panelX, headerY, 'Private', { fontSize: '20px', color: '#aaaaaa', fontFamily: FONT_FAMILY }).setOrigin(0.5, 0);
        this.add.text(panelX + panelWidth / 2 - 30, headerY, 'Players', { fontSize: '20px', color: '#aaaaaa', fontFamily: FONT_FAMILY }).setOrigin(1, 0);

        const listY = headerY + 35;
        const listHeight = 340;

        const md = MultiplayerData.getInstance();

        let selectedRoom: RoomData | null = null;
        let typedPasscode: string = '';
        let updateJoinPanel: () => void;
        let flashJoinButton: (msg: string, color?: string) => void;

        const itemsPerPage = 7;
        let currentPage = 0;
        let totalPages = Math.max(1, Math.ceil(md.getRooms().length / itemsPerPage));

        const paginationY = listY + listHeight + 10;

        const prevBtn = this.add.text(panelX - 60, paginationY, '<', { fontSize: '24px', color: '#ffffff', fontFamily: FONT_FAMILY })
            .setOrigin(0.5)
            .setPadding(20)
            .setInteractive({ useHandCursor: true });
        const pageTxt = this.add.text(panelX, paginationY, '1/3', { fontSize: '20px', color: '#ffffff', fontFamily: FONT_FAMILY })
            .setOrigin(0.5);
        const nextBtn = this.add.text(panelX + 60, paginationY, '>', { fontSize: '24px', color: '#ffffff', fontFamily: FONT_FAMILY })
            .setOrigin(0.5)
            .setPadding(20)
            .setInteractive({ useHandCursor: true });

        const serverSpacing = 42;
        const listContainer = this.add.container(panelX, listY);

        const renderPage = () => {
            const rooms = md.getRooms().slice();
            const activeRoom = md.myRoom || md.joinedRoom;
            if (activeRoom) {
                rooms.sort((a, b) => {
                    if (a === activeRoom) return -1;
                    if (b === activeRoom) return 1;
                    return 0;
                });
            }

            totalPages = Math.max(1, Math.ceil(rooms.length / itemsPerPage));
            if (currentPage >= totalPages) currentPage = totalPages - 1;

            listContainer.removeAll(true);
            pageTxt.setText(`${currentPage + 1}/${totalPages}`);

            prevBtn.setAlpha(currentPage > 0 ? 1 : 0.3);
            nextBtn.setAlpha(currentPage < totalPages - 1 ? 1 : 0.3);

            const startIdx = currentPage * itemsPerPage;
            const endIdx = Math.min(startIdx + itemsPerPage, rooms.length);

            for (let i = startIdx; i < endIdx; i++) {
                const roomIndex = i - startIdx;
                const room = rooms[i];
                const srvY = roomIndex * serverSpacing + 20;

                const srvBg = this.add.image(0, srvY, 'multiplayer-room-ui')
                    .setScale(scale)
                    .setOrigin(0.5);

                if (room !== md.myRoom) {
                    srvBg.setInteractive({ useHandCursor: true });
                }

                const updateTint = () => {
                    srvBg.setAlpha(room === md.myRoom || room === md.joinedRoom ? 0.3 : 1);
                    if (room === md.myRoom || room === md.joinedRoom) srvBg.setTint(0xffff66);
                    else if (selectedRoom === room) srvBg.setTint(0x888888);
                    else srvBg.clearTint();
                };
                updateTint();

                srvBg.on('pointerover', () => {
                    if (selectedRoom !== room && room !== md.myRoom && room !== md.joinedRoom) srvBg.setBlendMode(Phaser.BlendModes.ADD);
                });

                srvBg.on('pointerout', () => {
                    srvBg.setBlendMode(Phaser.BlendModes.NORMAL);
                    updateTint();
                });

                srvBg.on('pointerdown', () => {
                    if (room === md.myRoom || room === md.joinedRoom) return;
                    this.audioManager.uiClick();
                    selectedRoom = room;
                    typedPasscode = '';
                    if (!room.isPrivate && room.passcode) {
                        typedPasscode = room.passcode;
                    }
                    renderPage();
                    if (updateJoinPanel) updateJoinPanel();
                });

                const nameTxt = this.add.text(-panelWidth / 2 + 30, srvY, room.title, {
                    fontSize: '18px', color: '#ffffff', fontFamily: FONT_FAMILY
                }).setOrigin(0, 0.5);

                const privTxt = this.add.text(0, srvY, room.isPrivate ? 'True' : 'False', {
                    fontSize: '18px', color: room.isPrivate ? '#ff5555' : '#55ff55', fontFamily: FONT_FAMILY
                }).setOrigin(0.5, 0.5);

                const plyTxt = this.add.text(panelWidth / 2 - 30, srvY, `${room.currentPlayers}/${room.maxPlayers}`, {
                    fontSize: '18px', color: '#ffffff', fontFamily: FONT_FAMILY
                }).setOrigin(1, 0.5);

                listContainer.add([srvBg, nameTxt, privTxt, plyTxt]);
            }
        };

        renderPage();

        prevBtn.on('pointerdown', () => {
            this.audioManager.uiClick();
            if (currentPage > 0) {
                currentPage--;
                renderPage();
            }
        });

        nextBtn.on('pointerdown', () => {
            this.audioManager.uiClick();
            if (currentPage < totalPages - 1) {
                currentPage++;
                renderPage();
            }
        });

        const rightPanelX = centerX + 315;
        const createPanelY = centerY - 110;

        let previewRoom = md.myRoom ? md.myRoom : (md.joinedRoom ? md.joinedRoom : new RoomData());

        this.add.text(rightPanelX, createPanelY, 'Personal Room', { fontSize: '24px', color: '#847E87', fontFamily: FONT_FAMILY }).setOrigin(0.5);

        const roomNameTxt = this.add.text(rightPanelX, createPanelY + 35, '', { fontSize: '18px', color: '#aaaaaa', fontFamily: FONT_FAMILY }).setOrigin(0.5);
        const passcodeTxt = this.add.text(rightPanelX, createPanelY + 65, '', { fontSize: '18px', color: '#ffffff', fontFamily: FONT_FAMILY }).setOrigin(0.5);
        const privateToggle = this.add.text(rightPanelX, createPanelY + 105, '', { fontSize: '20px', fontFamily: FONT_FAMILY }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        const playersToggle = this.add.text(rightPanelX, createPanelY + 145, '', { fontSize: '20px', color: '#aaaaaa', fontFamily: FONT_FAMILY }).setOrigin(0.5);
        const createRoomBtnImg = this.add.image(rightPanelX, createPanelY + 195, 'multiplayer-room-ui-2').setScale(scale).setOrigin(0.5).setInteractive({ useHandCursor: true });
        const createRoomBtnTxt = this.add.text(rightPanelX, createPanelY + 195, '', { fontSize: '20px', fontFamily: FONT_FAMILY }).setOrigin(0.5);

        const deleteBtn = this.add.image(rightPanelX + 100, paginationY, 'ui-items', 8).setScale(scale)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        deleteBtn.on('pointerover', () => deleteBtn.setTint(0xff5555).setBlendMode(Phaser.BlendModes.ADD));
        deleteBtn.on('pointerout', () => deleteBtn.clearTint().setBlendMode(Phaser.BlendModes.NORMAL));
        deleteBtn.on('pointerdown', () => {
            if (this.isStartingGame) return;
            this.audioManager.uiClick();
            if (md.myRoom) {
                NetworkManager.getInstance().unregisterRoom(md.myRoom.passcode);
                NetworkManager.getInstance().disconnect();
                md.myRoom = null;
            } else if (md.joinedRoom) {
                md.joinedRoom.currentPlayers--;
                NetworkManager.getInstance().disconnect();
                md.joinedRoom = null;
            } else {
                return;
            }
            previewRoom = new RoomData();
            updateRightPanel();
            renderPage();
        });

        const updateRightPanel = () => {
            previewRoom = md.myRoom || md.joinedRoom || previewRoom;
            roomNameTxt.setText(`"${previewRoom.title}"`);
            passcodeTxt.setText(previewRoom.isPrivate ? `Passcode: ${previewRoom.passcode}` : 'Passcode: ******');
            passcodeTxt.setVisible(true);
            privateToggle.setText(`Private: ${previewRoom.isPrivate ? 'True' : 'False'}`);
            privateToggle.setColor(previewRoom.isPrivate ? '#ff5555' : '#55ff55');
            playersToggle.setText(`Players: ${previewRoom.currentPlayers}/${previewRoom.maxPlayers}`);

            if (md.myRoom || md.joinedRoom) {
                createRoomBtnTxt.setText('Start Game');
                createRoomBtnImg.setAlpha(md.myRoom ? 1 : 0.5);
                createRoomBtnTxt.setAlpha(md.myRoom ? 1 : 0.5);
                createRoomBtnImg.setTint(md.myRoom ? 0x55ff55 : 0xffffff);
                createRoomBtnTxt.setColor('#ffffff');
                deleteBtn.setVisible(!!md.myRoom);
            } else {
                createRoomBtnTxt.setText('Create');
                createRoomBtnImg.setAlpha(1);
                createRoomBtnTxt.setAlpha(1);
                createRoomBtnImg.clearTint();
                createRoomBtnTxt.setColor('#ffffff');
                deleteBtn.setVisible(false);
            }
        };

        privateToggle.on('pointerover', () => { if (!md.joinedRoom) privateToggle.setBlendMode(Phaser.BlendModes.ADD); });
        privateToggle.on('pointerout', () => privateToggle.setBlendMode(Phaser.BlendModes.NORMAL));
        privateToggle.on('pointerdown', () => {
            if (md.joinedRoom) return;
            this.audioManager.uiClick();
            previewRoom.isPrivate = !previewRoom.isPrivate;
            updateRightPanel();
            if (md.myRoom) {
                NetworkManager.getInstance().registerRoom({ ...md.myRoom, id: md.myRoom.passcode });
                renderPage();
            }
        });

        createRoomBtnImg.on('pointerover', () => {
            if (!md.joinedRoom && !this.isStartingGame) {
                createRoomBtnImg.setBlendMode(Phaser.BlendModes.ADD);
            }
        });
        createRoomBtnImg.on('pointerout', () => {
            createRoomBtnImg.setBlendMode(Phaser.BlendModes.NORMAL);
        });
        createRoomBtnImg.on('pointerdown', () => {
            if (this.isStartingGame) return;
            this.audioManager.uiClick();
            if (md.joinedRoom) return;

            if (md.myRoom) {
                this.isStartingGame = true;
                createRoomBtnImg.disableInteractive();
                createRoomBtnImg.setBlendMode(Phaser.BlendModes.NORMAL);
                createRoomBtnImg.setAlpha(0.5);
                createRoomBtnTxt.setText('STARTING...');
                md.generateSharedRunes(RuneData.getAllDefinitions());
                NetworkManager.getInstance().unregisterRoom(md.myRoom.passcode);
                NetworkManager.getInstance().broadcast({ type: 'START_GAME', sharedRunes: md.sharedRunes });
                this.launchCovenantOnce();
            } else {
                createRoomBtnTxt.setText('HOSTING...');
                createRoomBtnImg.disableInteractive();
                NetworkManager.getInstance().hostRoom(previewRoom.passcode, (_id: string) => {
                    md.myRoom = previewRoom;
                    NetworkManager.getInstance().registerRoom({ ...previewRoom, id: previewRoom.passcode });
                    createRoomBtnImg.setInteractive({ useHandCursor: true });
                    updateRightPanel();
                    renderPage();
                }, (_err) => {
                    createRoomBtnImg.setInteractive({ useHandCursor: true });
                    createRoomBtnTxt.setText('Create');
                    console.error('Host error', _err);
                });
            }
        });

        updateRightPanel();
        const joinPanelY = centerY + 120;

        const joinCodeTxt = this.add.text(rightPanelX, joinPanelY + 35, '', { fontSize: '20px', color: '#ffffff', fontFamily: FONT_FAMILY }).setOrigin(0.5);

        const joinRoomBtnImg = this.add.image(rightPanelX, joinPanelY + 75, 'multiplayer-room-ui-2').setScale(scale).setOrigin(0.5).setInteractive({ useHandCursor: true });
        const joinRoomBtnTxt = this.add.text(rightPanelX, joinPanelY + 75, 'Join', { fontSize: '20px', color: '#ffffff', fontFamily: FONT_FAMILY }).setOrigin(0.5);

        flashJoinButton = (msg: string, color: string = '#ff5555') => {
            joinRoomBtnTxt.setText(msg).setColor(color);
            this.time.delayedCall(2000, () => {
                if (joinRoomBtnTxt.active && joinRoomBtnTxt.text === msg) {
                    joinRoomBtnTxt.setText('Join').setColor('#ffffff');
                }
            });
        };

        let selectRoomTween: Phaser.Tweens.Tween | null = null;

        updateJoinPanel = () => {
            if (md.joinedRoom) {
                if (joinRoomBtnTxt.text !== 'JOINING...') {
                    joinRoomBtnTxt.setText('Leave').setColor('#ffffff');
                    joinRoomBtnImg.setTint(0xff5555);
                }
                if (selectRoomTween) { selectRoomTween.stop(); selectRoomTween = null; }
                joinCodeTxt.setAlpha(1).setText(`IN ROOM`).setColor('#ffffff');
                return;
            }

            if (joinRoomBtnTxt.text !== 'JOINING...') {
                joinRoomBtnTxt.setText('Join').setColor('#ffffff');
                joinRoomBtnImg.clearTint();
            }

            if (selectRoomTween) {
                selectRoomTween.stop();
                selectRoomTween = null;
            }
            joinCodeTxt.setAlpha(1);

            if (!selectedRoom) {
                joinCodeTxt.setText('SELECT ROOM').setColor('#aaaaaa');
            } else if (!selectedRoom.isPrivate && selectedRoom.passcode) {
                joinCodeTxt.setText('OPEN ROOM').setColor('#55ff55');
            } else {
                let displayCode = typedPasscode.padEnd(6, '-').split('').join(' ');
                joinCodeTxt.setText(displayCode).setColor('#ffffff');
            }
        };
        updateJoinPanel();

        this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
            if (md.joinedRoom || md.myRoom) return;
            if (selectedRoom && (!selectedRoom.isPrivate && selectedRoom.passcode)) return;

            if (event.key === 'Backspace') {
                typedPasscode = typedPasscode.slice(0, -1);
                updateJoinPanel();
            } else if (typedPasscode.length < 6 && /^[a-zA-Z0-9]$/.test(event.key)) {
                typedPasscode += event.key.toUpperCase();
                updateJoinPanel();
            }
        });

        joinRoomBtnImg.on('pointerover', () => joinRoomBtnImg.setBlendMode(Phaser.BlendModes.ADD));
        joinRoomBtnImg.on('pointerout', () => joinRoomBtnImg.setBlendMode(Phaser.BlendModes.NORMAL));
        joinRoomBtnImg.on('pointerdown', () => {
            if (this.isStartingGame) return;
            this.audioManager.uiClick();
            if (md.joinedRoom) {
                md.joinedRoom = null;
                NetworkManager.getInstance().disconnect();
                updateRightPanel();
                updateJoinPanel();
                renderPage();
                return;
            }

            if (md.myRoom) {
                flashJoinButton('ALREADY HOSTING', '#ff5555');
                return;
            }

            if (typedPasscode.length !== 6) {
                flashJoinButton('NEED 6 CHARS', '#ff5555');
                return;
            }

            joinRoomBtnTxt.setText('JOINING...').setColor('#55ff55');
            NetworkManager.getInstance().joinRoom(typedPasscode, () => {
                const fakeRoom = new RoomData();
                fakeRoom.passcode = typedPasscode;
                md.joinedRoom = fakeRoom;
                joinRoomBtnTxt.setText('Leave').setColor('#ffffff');
                updateRightPanel();
                updateJoinPanel();
                renderPage();
            }, (_err) => {
                flashJoinButton('NOT FOUND', '#ff5555');
                NetworkManager.getInstance().disconnect();
            });
        });

        const onNetworkData = (payload: any) => {
            const data = payload.data;
            if (data && data.type === 'START_GAME') {
                if (this.isStartingGame) return;
                this.isStartingGame = true;
                createRoomBtnImg.disableInteractive();
                joinRoomBtnImg.disableInteractive();
                md.sharedRunes = data.sharedRunes;
                this.launchCovenantOnce();
            }
        };

        const onPeerConnected = (_peerId: string) => {
            if (md.myRoom) {
                md.myRoom.currentPlayers++;
                NetworkManager.getInstance().registerRoom({ ...md.myRoom, id: md.myRoom.passcode });
                updateRightPanel();
                renderPage();
            }
        };

        const onPeerDisconnected = (_peerId: string) => {
            if (md.myRoom) {
                md.myRoom.currentPlayers = Math.max(1, md.myRoom.currentPlayers - 1);
                NetworkManager.getInstance().registerRoom({ ...md.myRoom, id: md.myRoom.passcode });
                updateRightPanel();
                renderPage();
            }
        };

        EventBus.on(GameEvents.NETWORK_DATA_RECEIVED, onNetworkData, this);
        EventBus.on(GameEvents.PEER_CONNECTED, onPeerConnected, this);
        EventBus.on(GameEvents.PEER_DISCONNECTED, onPeerDisconnected, this);

        const fetchInterval = setInterval(async () => {
            if (md.myRoom) {
                NetworkManager.getInstance().registerRoom({ ...md.myRoom, id: md.myRoom.passcode });
            }
            const rooms = await NetworkManager.getInstance().fetchRooms();
            md.rooms = rooms;
            renderPage();
        }, 1000);

        this.events.on('shutdown', () => {
            EventBus.off(GameEvents.NETWORK_DATA_RECEIVED, onNetworkData, this);
            EventBus.off(GameEvents.PEER_CONNECTED, onPeerConnected, this);
            EventBus.off(GameEvents.PEER_DISCONNECTED, onPeerDisconnected, this);
            clearInterval(fetchInterval);
        });
    }

    private launchCovenantOnce(): void {
        if (this.scene.isActive('TransitionScene')) return;

        this.scene.launch('TransitionScene', {
            targetScene: 'Covenant',
            currentScene: 'Multiplayer'
        });
    }
}
