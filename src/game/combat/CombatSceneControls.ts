import * as Phaser from 'phaser';
import { InputKeys } from '../constants';

export interface CombatSceneControlsOptions {
    clearRuneChain: () => void;
    hideInventory: () => void;
    isInventoryOpen: () => boolean;
    openInventory: () => void;
}

export function createCombatSceneControls(scene: Phaser.Scene, options: CombatSceneControlsOptions): void {
    const glossaryX = 30;
    const glossaryY = scene.scale.height - 100;
    const glossaryBtn = scene.add.sprite(glossaryX, glossaryY, 'glossary', 0)
        .setOrigin(0, 0.5).setScrollFactor(0).setScale(2)
        .setInteractive({ useHandCursor: true });
    glossaryBtn.on('pointerdown', () => openGlossary(scene));

    const settingsX = scene.scale.width - 24;
    const settingsY = scene.scale.height - 10;
    const settingsBtn = scene.add.sprite(settingsX, settingsY, 'settings-btn')
        .setOrigin(1, 1).setScrollFactor(0).setScale(1)
        .setInteractive({ useHandCursor: true });
    settingsBtn.on('pointerover', () => settingsBtn.setTint(0xaaaaaa));
    settingsBtn.on('pointerout', () => settingsBtn.clearTint());
    settingsBtn.on('pointerdown', () => openHelp(scene));

    const inventoryBtn = scene.add.image(24, settingsY, 'inventory-btn')
        .setOrigin(0, 1).setScrollFactor(0).setScale(1)
        .setInteractive({ useHandCursor: true });
    inventoryBtn.on('pointerover', () => inventoryBtn.setTint(0xaaaaaa));
    inventoryBtn.on('pointerout', () => inventoryBtn.clearTint());
    inventoryBtn.on('pointerdown', () => options.openInventory());

    scene.input.keyboard?.on(InputKeys.HELP, () => {
        if (!scene.scene.isPaused()) {
            openHelp(scene);
        }
    });
    scene.input.keyboard?.on(InputKeys.BACK, () => {
        if (options.isInventoryOpen()) {
            options.hideInventory();
            return;
        }
        if (!scene.scene.isPaused()) {
            options.clearRuneChain();
        }
    });
    scene.input.keyboard?.on(InputKeys.GLOSSARY, () => openGlossary(scene));
    scene.input.keyboard?.on(InputKeys.INVENTORY, () => {
        if (options.isInventoryOpen()) {
            options.hideInventory();
        } else {
            options.openInventory();
        }
    });
}

function openGlossary(scene: Phaser.Scene): void {
    if (!scene.scene.isActive('GlossaryUI')) {
        scene.scene.pause();
        scene.scene.launch('GlossaryUI', { previousScene: 'CombatScene', isPaused: true });
    }
}

function openHelp(scene: Phaser.Scene): void {
    if (!scene.scene.isActive('Help')) {
        scene.scene.pause();
        scene.scene.launch('Help', { previousScene: 'CombatScene' });
    }
}
