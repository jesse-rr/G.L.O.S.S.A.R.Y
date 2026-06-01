import StartGame from './game/main';
import { GodMode } from './game/utils/GodMode';

document.addEventListener('DOMContentLoaded', () => {
    const game = StartGame('game-container');
    (window as any).game = game;
    (window as any).GodMode = GodMode;
});
