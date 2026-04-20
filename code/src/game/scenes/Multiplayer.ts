import * as Phaser from 'phaser';
import { MultiplayerData, RoomData } from '../data/MultiplayerData';

import { FONT_FAMILY } from '../constants';

export class Multiplayer extends Phaser.Scene {

    constructor() {
        super('Multiplayer');
    }

    preload() {
        const multiplayerData = MultiplayerData.getInstance();

        this.load.image('multiplayer-bg', 'assets/exports/UI/Multiplayer-UI.png');
        this.load.image('multiplayer-room-ui', 'assets/exports/UI/Multiplayer-Room-UI.png');
        this.load.image('multiplayer-room-ui-2', 'assets/exports/UI/Multiplayer-Room-UI-2.png');
        this.load.image('go-back-ui', 'assets/exports/UI/Go-Back-UI.png');
        this.load.spritesheet('ui-items', 'assets/exports/UI/UI-Items.png', { frameWidth: 32, frameHeight: 32 });
    }

    create() {
        this.cameras.main.roundPixels = true;

        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.6)
            .setOrigin(0)
            .setScrollFactor(0);

        const scale = 2;
        const centerX = Math.floor(this.scale.width / 2);
        const centerY = Math.floor(this.scale.height / 2);

        const bg = this.add.image(centerX, centerY, 'multiplayer-bg')
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
            this.scene.stop();
            this.scene.resume('MainMenu');
        });

        this.input.keyboard!.on('keydown-ESC', () => {
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

        // Testing Mocks
        if (md.getRooms().length === 0 && !md.myRoom && !md.joinedRoom) {
            for (let i = 0; i < 10; i++) {
                const mock = new RoomData();
                mock.isPrivate = true;
                mock.passcode = '123';
                md.addRoom(mock);
            }
        }

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

                    selectedRoom = room;
                    typedPasscode = '';
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
            if (currentPage > 0) {
                currentPage--;
                renderPage();
            }
        });

        nextBtn.on('pointerdown', () => {
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
        const playersToggle = this.add.text(rightPanelX, createPanelY + 145, '', { fontSize: '20px', color: '#aaaaaa', fontFamily: FONT_FAMILY }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        const createRoomBtnImg = this.add.image(rightPanelX, createPanelY + 195, 'multiplayer-room-ui-2').setScale(scale).setOrigin(0.5).setInteractive({ useHandCursor: true });
        const createRoomBtnTxt = this.add.text(rightPanelX, createPanelY + 195, '', { fontSize: '20px', fontFamily: FONT_FAMILY }).setOrigin(0.5);

        const deleteBtn = this.add.image(rightPanelX + 100, paginationY, 'ui-items', 8).setScale(scale)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        deleteBtn.on('pointerover', () => deleteBtn.setTint(0xff5555).setBlendMode(Phaser.BlendModes.ADD));
        deleteBtn.on('pointerout', () => deleteBtn.clearTint().setBlendMode(Phaser.BlendModes.NORMAL));
        deleteBtn.on('pointerdown', () => {
            if (md.myRoom) {
                md.removeRoom(md.myRoom);
                md.myRoom = null;
            } else if (md.joinedRoom) {
                md.joinedRoom.currentPlayers--;
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
            previewRoom.isPrivate = !previewRoom.isPrivate;
            updateRightPanel();
            if (md.myRoom) renderPage();
        });

        playersToggle.on('pointerover', () => { if (!md.joinedRoom) playersToggle.setBlendMode(Phaser.BlendModes.ADD); });
        playersToggle.on('pointerout', () => playersToggle.setBlendMode(Phaser.BlendModes.NORMAL));
        playersToggle.on('pointerdown', () => {
            if (md.joinedRoom) return;
            previewRoom.maxPlayers++;
            if (previewRoom.maxPlayers > 3) previewRoom.maxPlayers = 1;
            updateRightPanel();
            if (md.myRoom) renderPage();
        });

        createRoomBtnImg.on('pointerover', () => {
            if (!md.joinedRoom) {
                createRoomBtnImg.setBlendMode(Phaser.BlendModes.ADD);
            }
        });
        createRoomBtnImg.on('pointerout', () => {
            createRoomBtnImg.setBlendMode(Phaser.BlendModes.NORMAL);
        });
        createRoomBtnImg.on('pointerdown', () => {
            if (md.joinedRoom) return;

            if (md.myRoom) {
                this.scene.stop();
                this.scene.start('Covenant');
            } else {
                md.myRoom = previewRoom;
                md.addRoom(previewRoom);
            }
            updateRightPanel();
            renderPage();
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
            } else if (!selectedRoom.isPrivate) {
                joinCodeTxt.setText('OPEN ROOM').setColor('#55ff55');
            } else {
                let displayCode = typedPasscode.padEnd(6, '-').split('').join(' ');
                joinCodeTxt.setText(displayCode).setColor('#ffffff');
            }
        };
        updateJoinPanel();

        this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
            if (!selectedRoom || !selectedRoom.isPrivate) return;

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
            if (md.joinedRoom) {
                md.joinedRoom.currentPlayers = Math.max(0, md.joinedRoom.currentPlayers - 1);
                md.joinedRoom = null;
                selectedRoom = null;
                updateRightPanel();
                updateJoinPanel();
                renderPage();
                return;
            }

            if (!selectedRoom) {
                if (selectRoomTween && selectRoomTween.isPlaying()) return;

                selectRoomTween = this.tweens.add({
                    targets: joinCodeTxt,
                    alpha: 0.2,
                    duration: 400,
                    yoyo: true,
                    repeat: 2,
                    onComplete: () => joinCodeTxt.setAlpha(1)
                });
                return;
            }

            if (md.myRoom || md.joinedRoom) {
                flashJoinButton('ALREADY IN ROOM', '#ff5555');
                return;
            }

            if (selectedRoom.currentPlayers >= selectedRoom.maxPlayers) {
                flashJoinButton('ROOM FULL', '#ff5555');
                return;
            }

            if (selectedRoom.isPrivate && typedPasscode !== selectedRoom.passcode) {
                flashJoinButton('WRONG CODE', '#ff5555');
                return;
            }

            joinRoomBtnTxt.setText('JOINING...').setColor('#55ff55');
            this.time.delayedCall(800, () => {
                if (selectedRoom) {
                    selectedRoom.currentPlayers++;
                    md.joinedRoom = selectedRoom;
                    joinRoomBtnTxt.setText('Join').setColor('#ffffff');
                    selectedRoom = null;
                    typedPasscode = '';
                    updateRightPanel();
                    updateJoinPanel();
                    renderPage();
                }
            });
        });
    }
}