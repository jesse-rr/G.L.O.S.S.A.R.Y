import * as Phaser from 'phaser';
import { UserData } from '../data/UserData';
import {AudioManager} from "./AudioManager";

export class ScreenShake {
    static audioManager: AudioManager;
    static scene: Phaser.Scene | null = null;

    static init(scene: Phaser.Scene, audioManager: any) {
        ScreenShake.scene = scene;
        ScreenShake.audioManager = audioManager;
    }

    static preload(scene: Phaser.Scene) {
        scene.load.audio('rumble', 'assets/sfx/rumble.mp3');
    }

    static trigger(scene: Phaser.Scene, duration: number = 200, intensity: number = 0.01, playSound: boolean = true): void {
        const userData = UserData.getInstance();
        if (userData.settings.screenShake) {
            scene.cameras.main.shake(duration, intensity);
        }

        if (playSound) {
            this.audioManager.playRumble();
        }
    }
}