import { Boot } from './scenes/menu/Boot';
import { MainMenu } from './scenes/menu/MainMenu';
import { AUTO, Game, Scale } from 'phaser';
import { Help } from './scenes/ui/Help';
import { Settings } from './scenes/ui/Settings';
import { SettingsUI } from './scenes/ui/SettingsUI';
import { Achievements } from './scenes/ui/Achievements';
import { AchievementsUI } from './scenes/ui/AchievementsUI';
import { Covenant } from './scenes/menu/Covenant';
import { CombatScene } from './scenes/combat/CombatScene';
import { Cat } from './utils/Cat';
import { Multiplayer } from './scenes/menu/Multiplayer';
import { ControlsUI } from './scenes/ui/ControlsUI';
import { LevelScene } from './scenes/world/LevelScene';
import { TransitionScene } from './scenes/world/TransitionScene';
import { GlossaryUI } from './scenes/ui/GlossaryUI';
import { NotificationOverlay } from './scenes/ui/NotificationOverlay';
import { ItemModal } from './scenes/ui/ItemModal';
import { SlateMinigame } from './scenes/ui/SlateMinigame';
import { MerchantShop } from './scenes/ui/MerchantShop';
import { LocationDisplayScene } from "./utils/LocationDefinition";
import {GameOver} from "./scenes/world/GameOver";



let useVsync = true;

const data = localStorage.getItem('glossary_user_data');
if (data) {
    const parsed = JSON.parse(data);
    if (parsed?.settings?.vsync !== undefined) {
        useVsync = parsed.settings.vsync;
    }
}


const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#000000',
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    pauseOnBlur: false,
    fps: {
        forceSetTimeOut: !useVsync,
        target: useVsync ? 30 : 60
    },
    scale: {
        mode: Scale.NONE,
        autoCenter: Scale.CENTER_BOTH,
    },
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 0, x: 0 },
            debug: false
        }
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
        Cat,
        Multiplayer,
        ControlsUI,
        LevelScene,
        TransitionScene,
        GlossaryUI,
        NotificationOverlay,
        ItemModal,
        SlateMinigame,
        MerchantShop,
        LocationDisplayScene,
        GameOver
    ]
};

const StartGame = (parent: string) => {
    const game = new Game({ ...config, parent });
    return game;
};

export default StartGame;
