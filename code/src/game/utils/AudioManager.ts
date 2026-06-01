export class AudioManager {
    private scene: Phaser.Scene;
    private sounds: Map<string, Phaser.Sound.BaseSound> = new Map();
    private activeSounds: Phaser.Sound.BaseSound[] = [];
    private lastPlayTime: Map<string, number> = new Map();
    private throttleMs: number = 100;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    loadAudio() {
        this.scene.load.audio('ui_click', 'assets/sfx/ui/click.mp3');
        this.scene.load.audio('whoosh', 'assets/sfx/whoosh/whoosh-2.mp3');
        this.scene.load.audio('rumble', 'assets/sfx/rumble.mp3');
        this.scene.load.audio('rocks', 'assets/sfx/falling-rocks/rocks.mp3');
    }

    play(soundKey: string, config: { volume?: number; pitchVariation?: number; throttle?: boolean; rate?: number; seek?: number; loop?: boolean; stopDelay?: number } = {}) {
        const { volume = 0.12, pitchVariation = 0.08, throttle = true, rate = 1, seek = 0, loop = false, stopDelay = null } = config;

        if (throttle) {
            const now = Date.now();
            const lastTime = this.lastPlayTime.get(soundKey) || 0;
            if (now - lastTime < this.throttleMs) {
                return null;
            }
            this.lastPlayTime.set(soundKey, now);
        }

        let soundObj = this.sounds.get(soundKey);
        if (!soundObj) {
            soundObj = this.scene.sound.add(soundKey);
            this.sounds.set(soundKey, soundObj);
        }

        const lastPitch = (soundObj as any).lastPitch || 1;
        let newPitch;
        do {
            newPitch = 1 - pitchVariation + Math.random() * (pitchVariation * 2);
        } while (Math.abs(newPitch - lastPitch) < 0.03);
        (soundObj as any).lastPitch = newPitch;

        const instance = this.scene.sound.add(soundKey);

        instance.on('complete', () => {
            const index = this.activeSounds.indexOf(instance);
            if (index !== -1) this.activeSounds.splice(index, 1);
            instance.destroy();
        });

        instance.play({ volume, rate: newPitch * rate, seek, loop });
        this.activeSounds.push(instance);

        if (stopDelay !== null) {
            this.scene.time.delayedCall(stopDelay, () => {
                if (instance.isPlaying) {
                    instance.stop();
                    const index = this.activeSounds.indexOf(instance);
                    if (index !== -1) this.activeSounds.splice(index, 1);
                    instance.destroy();
                }
            });
        }

        return instance;
    }

    uiClick() {
        return this.play('ui_click', { volume: 0.05, pitchVariation: 0.08, throttle: true });
    }

    playWhoosh() {
        return this.play('whoosh', { volume: 0.05, pitchVariation: 0.05, throttle: false, rate: 2.5, seek: 0.05 });
    }

    playRumble() {
        return this.play('rumble', {
            volume: 0.015,
            pitchVariation: 0.05,
            throttle: false,
            rate: 2.5
        });
    }

    playRocks(volume: number = 0.3) {
        return this.play('rocks', { volume, pitchVariation: 0.1, throttle: false, rate: 2 });
    }

    stopAll() {
        for (const sound of this.activeSounds) {
            if (sound.isPlaying) {
                this.scene.tweens.add({
                    targets: sound,
                    volume: 0,
                    duration: 100,
                    onComplete: () => {
                        sound.stop();
                        sound.destroy();
                    }
                });
            }
        }
        this.activeSounds = [];
    }

    setThrottleDelay(ms: number) {
        this.throttleMs = ms;
    }
}