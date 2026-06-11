import * as Phaser from 'phaser';
import { UserData } from '../data/UserData';

export class AudioManager {
    private static readonly MAX_CONCURRENT_SOUNDS = 10;
    private scene: Phaser.Scene;
    private sounds: Map<string, Phaser.Sound.BaseSound> = new Map();
    private activeSounds: Phaser.Sound.BaseSound[] = [];
    private lastPlayTime: Map<string, number> = new Map();
    private throttleMs: number = 100;
    private bossMusic: Phaser.Sound.BaseSound | null = null;
    private static ambientMusic: Phaser.Sound.BaseSound | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        AudioManager.applyGlobalVolume(scene);
    }

    static applyGlobalVolume(scene: Phaser.Scene): void {
        const volume = Phaser.Math.Clamp(UserData.getInstance().settings.volume, 0, 100) / 100;
        (scene.sound as any).volume = volume;
    }

    loadAudio() {
        this.scene.load.audio('ui_click', 'assets/sfx/ui/click.mp3');
        this.scene.load.audio('whoosh', 'assets/sfx/movement/dash/whoosh-2.mp3');
        this.scene.load.audio('rumble', 'assets/sfx/world/rumble.mp3');
        this.scene.load.audio('rocks', 'assets/sfx/world/impacts/rocks.mp3');
        this.scene.load.audio('chest', 'assets/sfx/chest.mp3');
        this.scene.load.audio('door', 'assets/sfx/door.mp3');
        this.scene.load.audio('footsteps', 'assets/sfx/footsteps.mp3');
        this.scene.load.audio('fractured_glossary', 'assets/sfx/Fractured Glossary.mp3');
        this.scene.load.audio('defeat', 'assets/sfx/hurt-1.mp3');
        this.scene.load.audio('hurt', 'assets/sfx/hurt-2.mp3');
        this.scene.load.audio('unlocked_item', 'assets/sfx/unlocked-item.mp3');
        this.scene.load.audio('victory', 'assets/sfx/victory.mp3');
        this.scene.load.audio('teleport_whoosh', 'assets/sfx/transitions/teleport/teleport-whoosh-1.mp3');
        this.scene.load.audio('chains', 'assets/sfx/world/chains/chains-1.mp3');
        this.scene.load.audio('empty_hall', 'assets/sfx/Empty Hall.mp3');
    }

    play(soundKey: string, config: { volume?: number; pitchVariation?: number; throttle?: boolean; rate?: number; seek?: number; loop?: boolean; stopDelay?: number } = {}) {
        const { volume = 0.05, pitchVariation = 0.08, throttle = true, rate = 1, seek = 0, loop = false, stopDelay = null } = config;
        AudioManager.applyGlobalVolume(this.scene);

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

        let newPitch = 1;
        if (pitchVariation > 0) {
            const lastPitch = (soundObj as any).lastPitch || 1;
            do {
                newPitch = 1 - pitchVariation + Math.random() * (pitchVariation * 2);
            } while (Math.abs(newPitch - lastPitch) < 0.03);
            (soundObj as any).lastPitch = newPitch;
        }

        // Evict oldest sounds if at the concurrent limit
        while (this.activeSounds.length >= AudioManager.MAX_CONCURRENT_SOUNDS) {
            const oldest = this.activeSounds.shift();
            if (oldest) {
                try { oldest.stop(); } catch { /* already stopped */ }
                try { oldest.destroy(); } catch { /* already destroyed */ }
            }
        }

        const instance = this.scene.sound.add(soundKey);

        instance.on('complete', () => {
            const index = this.activeSounds.indexOf(instance);
            if (index !== -1) this.activeSounds.splice(index, 1);
            try { instance.destroy(); } catch { /* already destroyed */ }
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

    playRocks(volume: number = 0.1) {
        return this.play('rocks', { volume, pitchVariation: 0.1, throttle: false, rate: 2 });
    }

    playChest() {
        return this.play('chest', { volume: 0.05, pitchVariation: 0.08, throttle: true });
    }

    playDoor() {
        return this.play('door', { volume: 0.05, pitchVariation: 0.08, throttle: true });
    }

    playFootsteps() {
        return this.play('footsteps', { volume: 0.01, pitchVariation: 0.05, throttle: true });
    }

    playFracturedGlossary() {
        return this.play('fractured_glossary', { volume: 0.05, pitchVariation: 0.08, throttle: true });
    }

    playDefeat() {
        return this.play('defeat', { volume: 0.05, pitchVariation: 0.08, throttle: true });
    }

    playHurt() {
        return this.play('hurt', { volume: 0.12, pitchVariation: 0.08, throttle: true });
    }

    playUnlockedItem() {
        return this.play('unlocked_item', { volume: 0.05, pitchVariation: 0.08, throttle: true });
    }

    playVictory() {
        return this.play('victory', { volume: 0.05, pitchVariation: 0.08, throttle: true });
    }

    playTeleportWhoosh() {
        return this.play('teleport_whoosh', { volume: 0.05, pitchVariation: 0.08, throttle: true });
    }

    playChains() {
        return this.play('chains', { volume: 0.03, pitchVariation: 0.08, throttle: true });
    }

    playBossMusic(volume: number = 0.04) {
        this.stopAmbient();
        if (this.bossMusic) return;
        this.bossMusic = this.play('fractured_glossary', {
            volume: 0,
            pitchVariation: 0,
            throttle: false,
            loop: true
        });
        if (this.bossMusic) {
            this.scene.tweens.add({
                targets: this.bossMusic,
                volume,
                duration: 1500,
                ease: 'Linear'
            });
        }
    }

    stopBossMusic(immediate: boolean = false) {
        if (!this.bossMusic) return;
        const music = this.bossMusic;
        this.bossMusic = null;
        if (immediate) {
            try { music.stop(); } catch { /* already stopped */ }
            try { music.destroy(); } catch { /* already destroyed */ }
            return;
        }
        this.scene.tweens.add({
            targets: music,
            volume: 0,
            duration: 1500,
            ease: 'Linear',
            onComplete: () => {
                try { music.stop(); } catch { /* already stopped */ }
                try { music.destroy(); } catch { /* already destroyed */ }
            }
        });
    }

    playAmbient(volume: number) {
        if (AudioManager.ambientMusic) {
            if (AudioManager.ambientMusic.isPlaying) {
                this.scene.tweens.add({
                    targets: AudioManager.ambientMusic,
                    volume: volume,
                    duration: 1000,
                    ease: 'Linear'
                });
                return AudioManager.ambientMusic;
            } else {
                AudioManager.ambientMusic.destroy();
                AudioManager.ambientMusic = null;
            }
        }

        AudioManager.ambientMusic = this.scene.sound.add('empty_hall');
        if (AudioManager.ambientMusic) {
            (AudioManager.ambientMusic as any).play({
                volume: 0,
                loop: true
            });
            this.scene.tweens.add({
                targets: AudioManager.ambientMusic,
                volume: volume,
                duration: 1000,
                ease: 'Linear'
            });
        }
        return AudioManager.ambientMusic;
    }

    stopAmbient(immediate: boolean = false) {
        if (!AudioManager.ambientMusic) return;
        const music = AudioManager.ambientMusic;
        AudioManager.ambientMusic = null;
        if (immediate) {
            try { music.stop(); } catch { /* already stopped */ }
            try { music.destroy(); } catch { /* already destroyed */ }
            return;
        }
        this.scene.tweens.add({
            targets: music,
            volume: 0,
            duration: 1000,
            ease: 'Linear',
            onComplete: () => {
                try { music.stop(); } catch { /* already stopped */ }
                try { music.destroy(); } catch { /* already destroyed */ }
            }
        });
    }

    stopAll(immediate: boolean = false) {
        for (const sound of this.activeSounds) {
            if (immediate) {
                try { sound.stop(); } catch { /* already stopped */ }
                try { sound.destroy(); } catch { /* already destroyed */ }
            } else if (sound.isPlaying) {
                this.scene.tweens.add({
                    targets: sound,
                    volume: 0,
                    duration: 100,
                    onComplete: () => {
                        try { sound.stop(); } catch { /* already stopped */ }
                        try { sound.destroy(); } catch { /* already destroyed */ }
                    }
                });
            }
        }
        this.activeSounds = [];
        this.stopBossMusic(immediate);
    }

    setThrottleDelay(ms: number) {
        this.throttleMs = ms;
    }

}
