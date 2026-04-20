import * as Phaser from 'phaser';
import { UserData } from '../data/UserData';

export class ScreenShake {

    static trigger(scene: Phaser.Scene, duration: number = 200, intensity: number = 0.01): void {
        const userData = UserData.getInstance();
        if (userData.settings.screenShake) {
            scene.cameras.main.shake(duration, intensity);
        }
    }
}
