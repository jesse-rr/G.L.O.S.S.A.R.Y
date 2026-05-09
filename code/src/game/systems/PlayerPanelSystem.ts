import * as Phaser from 'phaser';
import { CombatPlayer } from '../combat/CombatSystem';
import { FONT_FAMILY } from '../constants';

export class PlayerPanelSystem {
    private scene: Phaser.Scene;
    private panelContainer: Phaser.GameObjects.Container | null = null;
    private tooltipContainer: Phaser.GameObjects.Container | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    create(otherPlayers: CombatPlayer[], getCovenantTint: (c: string) => number): void {
        if (otherPlayers.length === 0) return;

        const iconSize = 16;
        const panelX = this.scene.scale.width - 15 - iconSize / 2;
        const panelStartY = 100;
        const spacing = iconSize + 20;

        this.panelContainer = this.scene.add.container(5, 5)
            .setScrollFactor(0)
            .setDepth(50);

        this.tooltipContainer = this.scene.add.container(0, 0)
            .setScrollFactor(0)
            .setDepth(60)
            .setVisible(false);

        const tooltipBg = this.scene.add.rectangle(0, 0, 200, 130, 0x000000, 0.92)
            .setOrigin(1, 0);
        this.tooltipContainer.add(tooltipBg);

        otherPlayers.forEach((player, index) => {
            const y = panelStartY + index * spacing;
            const covenantTint = getCovenantTint(player.covenant);

            const icon = this.scene.add.image(panelX, y, 'player-ui')
                .setScrollFactor(0)
                .setInteractive({ useHandCursor: true })
                .setTint(covenantTint);

            this.panelContainer!.add([icon]);

            icon.on('pointerover', () => {
                const tooltipAnchorX = panelX - iconSize / 2 - 5;
                this.showTooltip(player, tooltipAnchorX, y);
                icon.setTint(0x888888);
            });

            icon.on('pointerout', () => {
                this.hideTooltip();
                icon.setTint(covenantTint);
            });
        });
    }

    private showTooltip(player: CombatPlayer, anchorX: number, anchorY: number): void {
        if (!this.tooltipContainer) return;

        while (this.tooltipContainer.list.length > 1) {
            const child = this.tooltipContainer.list[this.tooltipContainer.list.length - 1] as Phaser.GameObjects.GameObject;
            this.tooltipContainer.remove(child, true);
        }

        const tooltipX = anchorX;
        const tooltipY = anchorY - 10;

        const bg = this.tooltipContainer.list[0] as Phaser.GameObjects.Rectangle;
        bg.setPosition(0, 0);

        this.tooltipContainer.setPosition(tooltipX, tooltipY);

        const padX = -100;
        let offsetY = 12;

        const nameText = this.scene.add.text(padX, offsetY, `${player.name}  [${player.covenant}]`, {
            fontSize: '13px',
            color: '#FFD700',
            fontFamily: FONT_FAMILY,
            align: 'center'
        }).setOrigin(0.5, 0);
        this.tooltipContainer.add(nameText);
        offsetY += 24;

        const hpText = this.scene.add.text(padX, offsetY, `HP: ${player.stats.hp} / ${player.stats.maxHp}`, {
            fontSize: '12px',
            color: '#FFFFFF',
            fontFamily: FONT_FAMILY,
            align: 'center'
        }).setOrigin(0.5, 0);
        this.tooltipContainer.add(hpText);
        offsetY += 20;

        const gemText = this.scene.add.text(padX, offsetY, `Gemstones: ${player.gemstones}`, {
            fontSize: '12px',
            color: '#55ddff',
            fontFamily: FONT_FAMILY,
            align: 'center'
        }).setOrigin(0.5, 0);
        this.tooltipContainer.add(gemText);
        offsetY += 20;

        let chainLabel = 'Combo: None';
        if (player.currentChain && player.currentChain.runes.length > 0) {
            chainLabel = `Combo: ${player.currentChain.runes.join(' ')}`;
        }
        const chainText = this.scene.add.text(padX, offsetY, chainLabel, {
            fontSize: '12px',
            color: '#cccccc',
            fontFamily: FONT_FAMILY,
            wordWrap: { width: 185 },
            align: 'center'
        }).setOrigin(0.5, 0);
        this.tooltipContainer.add(chainText);
        offsetY += chainText.height + 10;

        bg.setSize(200, offsetY + 5);

        this.tooltipContainer.setVisible(true);
    }

    private hideTooltip(): void {
        if (this.tooltipContainer) {
            this.tooltipContainer.setVisible(false);
        }
    }
}
