import * as Phaser from 'phaser';
import { SLATE_DEFINITIONS, SlateProgress } from '../data/SlateData';
import { InteractSystem } from './InteractSystem';
import { MatterScene } from '../types';

const INTERACT_DISTANCE = 90;

export interface SlateState {
    body: MatterJS.BodyType;
    x: number;
    y: number;
    slateId: string;
    physicalKey: string;
}

export function createSlates(
    scene: Phaser.Scene,
    slateLayer: Phaser.Tilemaps.ObjectLayer,
    mapKey: string
): SlateState[] {
    const slates: SlateState[] = [];

    slateLayer.objects.forEach((obj, index) => {
        const x = obj.x || 0;
        const y = obj.y || 0;
        const width = obj.width || 32;
        const height = obj.height || 32;
        const cx = x + width / 2;
        const cy = y + height / 2;

        const physicalKey = `slate_physical_${mapKey}_${index}`;

        const mappingStr = localStorage.getItem('glossary_physical_slate_mapping');
        const mapping = mappingStr ? JSON.parse(mappingStr) : {};
        let slateId = mapping[physicalKey] || '';

        if (!slateId) {
            if (obj.properties) {
                const idProp = obj.properties.find((p: { name: string; value: unknown }) => p.name === 'slateId');
                if (idProp && typeof idProp.value === 'string') {
                    slateId = idProp.value;
                }
            }
        }

        const body = (scene as MatterScene).matter.add.rectangle(cx, cy, width, height, { isStatic: true });

        slates.push({ body, x: cx, y: cy, slateId, physicalKey });
    });

    return slates;
}

export function handleSlateInteraction(
    scene: Phaser.Scene,
    slates: SlateState[],
    player: Phaser.Physics.Matter.Sprite,
    interactKeyDown: boolean,
    wasInteractPressed: { value: boolean },
    isCinematic: boolean,
    isTeleporting: boolean,
    isEntering: boolean,
    mapKey: string
): void {
    if (isTeleporting || isEntering || isCinematic) return;

    for (const slate of slates) {
        const dist = Phaser.Math.Distance.Between(player.x, player.y, slate.x, slate.y);
        if (dist < INTERACT_DISTANCE) {
            InteractSystem.getInstance(scene).show(slate.x, slate.y - 30);

            if (interactKeyDown && !wasInteractPressed.value) {
                wasInteractPressed.value = true;
                const progress = SlateProgress.getInstance();

                if (!slate.slateId) {
                    const completedIds = progress.getCompletedSlates();
                    const uncompleted = SLATE_DEFINITIONS.filter(s => !completedIds.includes(s.id));

                    if (uncompleted.length > 0) {
                        const randomSlate = uncompleted[Math.floor(Math.random() * uncompleted.length)];
                        slate.slateId = randomSlate.id;

                        const mappingStr = localStorage.getItem('glossary_physical_slate_mapping');
                        const mapping = mappingStr ? JSON.parse(mappingStr) : {};
                        mapping[slate.physicalKey] = slate.slateId;
                        localStorage.setItem('glossary_physical_slate_mapping', JSON.stringify(mapping));
                    } else {
                        slate.slateId = SLATE_DEFINITIONS[0].id;
                    }
                }

                const colorScheme = mapKey === 'hub' ? 'light' : 'dark';

                if (progress.isCompleted(slate.slateId)) {
                    scene.scene.pause('LevelScene');
                    scene.scene.launch('GlossaryUI', {
                        previousScene: 'LevelScene',
                        isPaused: true,
                        openPage: 3,
                        slateId: slate.slateId
                    });
                } else {
                    scene.scene.pause('LevelScene');
                    scene.scene.launch('SlateMinigame', {
                        previousScene: 'LevelScene',
                        isPaused: true,
                        slateId: slate.slateId,
                        colorScheme: colorScheme
                    });
                }
            }
        }
    }

    if (!interactKeyDown) {
        wasInteractPressed.value = false;
    }
}