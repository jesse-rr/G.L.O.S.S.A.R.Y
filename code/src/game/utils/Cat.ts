import * as Phaser from 'phaser';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Cat extends Phaser.Scene {
  private threeRenderer!: THREE.WebGLRenderer;
  private threeScene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private model!: THREE.Object3D;
  private container!: HTMLDivElement;

  private isSpinning = false;
  private spinStartTime = 0;
  private spinDuration = 0;
  private baseRotation = 0;
  private bgTime = 0;
  private spinAudio!: Phaser.Sound.BaseSound;

  constructor() {
    super('Cat');
  }

  preload() {
    this.load.audio('catSpin', 'assets/exports/cat-meme.mp3');
  }

  create() {
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100vw';
    this.container.style.height = '100vh';
    this.container.style.zIndex = '1000';
    this.container.style.pointerEvents = 'none';
    document.body.appendChild(this.container);

    this.threeScene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 1000);
    this.camera.position.set(0, 5, 7);
    this.camera.lookAt(0, 0, 0);

    this.threeRenderer = new THREE.WebGLRenderer({ alpha: true });
    this.threeRenderer.setClearColor(0x000000, 0);
    this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.threeRenderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    this.threeScene.add(light);

    new GLTFLoader().load('assets/exports/cat.glb', (gltf) => {
      this.model = gltf.scene;
      this.model.scale.setScalar(0.5);
      this.model.position.set(0, 0, 0);
      this.baseRotation = THREE.MathUtils.degToRad(40);
      this.model.rotation.y = this.baseRotation;
      this.threeScene.add(this.model);

      this.startSequence();
    });

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.on(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
  }
  
  private startSequence() {
    this.time.delayedCall(3000, () => {
      this.beginSpin(1000, 5);
      this.time.delayedCall(1000, () => {
        this.endSpin();
        this.time.delayedCall(3000, () => {
          this.beginSpin(1800, 5);
          this.time.delayedCall(1800, () => {
            this.endSpin();
            this.time.delayedCall(300, () => {
              this.scene.stop('Cat');
            });
          });
        });
      });
    });
  }

  private beginSpin(duration: number, _rotations: number) {
    this.isSpinning = true;
    this.spinStartTime = this.game.getTime();
    this.spinDuration = duration;
    this.spinAudio = this.sound.add('catSpin');
    this.spinAudio.play();
  }

  private endSpin() {
    this.isSpinning = false;
    this.model.rotation.y = this.baseRotation;
    if (this.spinAudio) this.spinAudio.stop();
  }

  update(_time: number, delta: number) {
    if (!this.model) return;

    if (this.isSpinning) {
      const elapsed = this.game.getTime() - this.spinStartTime;
      const progress = Math.min(elapsed / this.spinDuration, 1);
      this.model.rotation.y = this.baseRotation + progress * 5 * Math.PI;
      this.bgTime += delta;

      const r = 0.5 + 0.5 * Math.sin(this.bgTime * 0.002);
      const g = 0.5 + 0.5 * Math.sin(this.bgTime * 0.002 + 2);
      const b = 0.5 + 0.5 * Math.sin(this.bgTime * 0.002 + 4);
      this.threeRenderer.setClearColor(new THREE.Color(r, g, b), 1);
    } else {
      this.threeRenderer.setClearColor(0x000000, 0);
    }

    this.threeRenderer.render(this.threeScene, this.camera);
  }

  private cleanup() {
    if (this.spinAudio) this.spinAudio.stop();
    if (this.model) this.threeScene.remove(this.model);
    if (this.threeRenderer) this.threeRenderer.dispose();
    if (this.container?.parentNode) this.container.parentNode.removeChild(this.container);
  }
}