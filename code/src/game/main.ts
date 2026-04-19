import { Boot } from './scenes/Boot';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game, Scale } from 'phaser';
import { Help } from './scenes/Help';
import { Settings } from './scenes/Settings';
import { SettingsUI } from './scenes/SettingsUI';
import { Achievements } from './scenes/Achievements';
import { AchievementsUI } from './scenes/AchievementsUI';
import { Covenant } from './scenes/Covenant';
import { CombatScene } from './scenes/CombatScene';
import { Cat } from './util/Cat';

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#000000',
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
    },
    scene: [
        Boot,
        MainMenu,
        Help,
        Settings,
        SettingsUI,
        Achievements,
        AchievementsUI,
        Covenant,
        CombatScene,
        Cat
    ]
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
};

export default StartGame;
