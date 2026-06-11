import * as Phaser from 'phaser';
import { DashSystem } from '../../../systems/DashSystem';
import { PortalSystem } from '../../../systems/PortalSystem';
import { AudioManager } from '../../../utils/AudioManager';

export interface LevelMovementKeys {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
}

export interface LevelPlayerHandles {
    player: Phaser.Physics.Matter.Sprite;
    playerShadow: Phaser.GameObjects.Image;
}

export interface LevelPlayerMovementContext {
    player: Phaser.Physics.Matter.Sprite;
    playerShadow: Phaser.GameObjects.Image;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    keys: LevelMovementKeys;
    dashKey: Phaser.Input.Keyboard.Key;
    dashSystem: DashSystem;
    portalSystem: PortalSystem;
    entryDirX: number;
    entryDirY: number;
    currentSlowFactor: number;
    targetSlowFactor: number;
    gamepadMoveX: number;
    gamepadMoveY: number;
    gamepadDashJustPressed: boolean;
    isEntering: boolean;
    isCinematic: boolean;
    isHoldingGlossary: boolean;
}

export function getLevelPlayerDepth(mapKey: string): number {
    switch (mapKey) {
        case 'boss-floor-abandoned':
            return 9;
        case 'boss-floor-desert':
            return 12;
        case 'boss-floor-mechanic':
            return 10;
        case 'summit-settlement':
            return 9;
        case 'abandoned-settlement':
            return 13;
        case 'desert-settlement':
            return 14;
        case 'mechanic-settlement':
            return 13;
        case 'summit-trade':
            return 4;
        case 'merchant':
            return 9;
        default:
            return 14;
    }
}

export function spawnLevelPlayer(scene: Phaser.Scene, x: number, y: number): LevelPlayerHandles {
    const player = scene.matter.add.sprite(x, y, 'protagonist-idle');
    player.setDepth(15);
    player.setRectangle(20, 6, { chamfer: { radius: 2 } });
    player.setOrigin(0.5, 0.67);
    player.setFixedRotation();
    player.setFriction(1);
    player.setFrictionAir(0.05);
    player.setFrictionStatic(1);
    player.setBounce(0);
    player.setMass(10);

    const playerShadow = scene.add.image(x, y + 16, 'protagonist-shadow');
    playerShadow.setOrigin(0.5, 1.06);
    playerShadow.setDepth(14);
    playerShadow.setAlpha(0.6);
    playerShadow.setScale(0.8);

    scene.cameras.main.startFollow(player, true, 0.09, 0.09);
    player.play('idle');

    return { player, playerShadow };
}

export function syncPlayerShadow(
    player: Phaser.Physics.Matter.Sprite,
    playerShadow: Phaser.GameObjects.Image
): void {
    if (!playerShadow || !player.active) return;
    playerShadow.setPosition(player.x, player.y + 16);
    playerShadow.setFlipX(player.flipX);
}

export function stopPlayerIntoIdle(player: Phaser.Physics.Matter.Sprite): void {
    player.anims.timeScale = 1;
    if (player.anims.currentAnim?.key === 'run-start' || player.anims.currentAnim?.key === 'run-loop') {
        player.play('stop').chain('idle');
    } else if (player.anims.currentAnim?.key !== 'stop' && player.anims.currentAnim?.key !== 'idle') {
        player.play('idle');
    }
}

export function updateLevelPlayerMovement(ctx: LevelPlayerMovementContext): number {
    const currentSlowFactor = Phaser.Math.Linear(ctx.currentSlowFactor, ctx.targetSlowFactor, 0.05);
    const runSpeed = 3 * currentSlowFactor;
    const body = ctx.player.body as MatterJS.BodyType;

    let moveX = 0;
    let moveY = 0;

    if (ctx.portalSystem.getIsTeleporting()) {
        const dir = ctx.portalSystem.getTeleportDirection();
        moveX = dir.x;
        moveY = dir.y;
        if (moveX < 0) ctx.player.setFlipX(true);
        else if (moveX > 0) ctx.player.setFlipX(false);

        const modifier = ctx.portalSystem.getTeleportSpeedModifier();
        const currentSpeed = runSpeed * modifier;
        if (modifier === 0) {
            ctx.player.setVelocity(body.velocity.x * 0.85, body.velocity.y * 0.85);
            stopPlayerIntoIdle(ctx.player);
        } else {
            const inputVelocity = new Phaser.Math.Vector2(moveX, moveY).normalize().scale(currentSpeed);
            ctx.player.setVelocity(inputVelocity.x, inputVelocity.y);
            ctx.player.anims.timeScale = currentSlowFactor * modifier;
            if (ctx.player.anims.currentAnim?.key !== 'run-start' && ctx.player.anims.currentAnim?.key !== 'run-loop') {
                ctx.player.play('run-start').chain('run-loop');
            }
        }
    } else if (ctx.isEntering) {
        const inputVelocity = new Phaser.Math.Vector2(ctx.entryDirX, ctx.entryDirY).normalize().scale(runSpeed);
        ctx.player.setVelocity(inputVelocity.x, inputVelocity.y);
        ctx.player.anims.timeScale = currentSlowFactor;
        if (ctx.player.anims.currentAnim?.key !== 'run-start' && ctx.player.anims.currentAnim?.key !== 'run-loop') {
            ctx.player.play('run-start').chain('run-loop');
        }
    } else if (ctx.isCinematic) {
        // Cinematics own player velocity.
    } else if (ctx.isHoldingGlossary) {
        ctx.player.setVelocity(body.velocity.x * 0.85, body.velocity.y * 0.85);
        stopPlayerIntoIdle(ctx.player);
    } else {
        const left = ctx.cursors.left.isDown || ctx.keys.A.isDown;
        const right = ctx.cursors.right.isDown || ctx.keys.D.isDown;
        const up = ctx.cursors.up.isDown || ctx.keys.W.isDown;
        const down = ctx.cursors.down.isDown || ctx.keys.S.isDown;

        moveX = ((right ? 1 : 0) - (left ? 1 : 0)) + ctx.gamepadMoveX;
        moveY = ((down ? 1 : 0) - (up ? 1 : 0)) + ctx.gamepadMoveY;

        if (moveX !== 0 || moveY !== 0) {
            if (moveX < 0) ctx.player.setFlipX(true);
            else if (moveX > 0) ctx.player.setFlipX(false);

            const inputVelocity = new Phaser.Math.Vector2(moveX, moveY).normalize().scale(runSpeed);
            ctx.player.setVelocity(inputVelocity.x, inputVelocity.y);
            ctx.player.anims.timeScale = currentSlowFactor;
            if (ctx.player.anims.currentAnim?.key !== 'run-start' && ctx.player.anims.currentAnim?.key !== 'run-loop') {
                ctx.player.play('run-start').chain('run-loop');
            }
        } else {
            ctx.player.setVelocity(body.velocity.x * 0.85, body.velocity.y * 0.85);
            stopPlayerIntoIdle(ctx.player);
        }
    }

    const dashJustPressed = Phaser.Input.Keyboard.JustDown(ctx.dashKey) || ctx.gamepadDashJustPressed;
    const canDash = !ctx.portalSystem.getIsTeleporting()
        && !ctx.isEntering
        && !ctx.isCinematic
        && !ctx.isHoldingGlossary;
    ctx.dashSystem.tryTrigger(dashJustPressed, moveX, moveY, ctx.player, canDash);

    syncPlayerShadow(ctx.player, ctx.playerShadow);

    const isMoving = (ctx.player.anims.currentAnim?.key === 'run-start' || ctx.player.anims.currentAnim?.key === 'run-loop') && !ctx.dashSystem.getIsDashing();
    if (isMoving) {
        const now = ctx.player.scene.time.now;
        const lastTime = (ctx.player as any).lastFootstepTime || 0;
        if (now - lastTime > 320) {
            (ctx.player as any).lastFootstepTime = now;
            new AudioManager(ctx.player.scene).playFootsteps();
        }
    }

    return currentSlowFactor;
}
