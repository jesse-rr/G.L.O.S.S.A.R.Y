import * as Phaser from 'phaser';

export interface DashConfig {
    speed?: number;
    cooldownTime?: number;
    durationTime?: number;
}

const DEFAULTS: Required<DashConfig> = {
    speed: 10,
    cooldownTime: 5,
    durationTime: 0.15,
};

export class DashSystem {
    private isDashing = false;
    private dashCooldownTimer = 0;
    private dashDurationTimer = 0;
    private dashSpeed: number;
    private dashCooldownTime: number;
    private dashDurationTime: number;
    private dashDirection = new Phaser.Math.Vector2(0, 0);
    private dashAvailable = true;

    constructor(config?: DashConfig) {
        const cfg = { ...DEFAULTS, ...config };
        this.dashSpeed = cfg.speed;
        this.dashCooldownTime = cfg.cooldownTime;
        this.dashDurationTime = cfg.durationTime;
    }

    reset(): void {
        this.isDashing = false;
        this.dashCooldownTimer = 0;
        this.dashDurationTimer = 0;
        this.dashAvailable = true;
        this.dashDirection.set(0, 0);
    }

    getIsDashing(): boolean {
        return this.isDashing;
    }

    updateTimers(
        delta: number,
        player: Phaser.Physics.Matter.Sprite,
        playerShadow?: Phaser.GameObjects.Image,
    ): boolean {
        const dt = delta / 1000;

        if (this.dashCooldownTimer > 0) {
            this.dashCooldownTimer -= dt;
            if (this.dashCooldownTimer <= 0) {
                this.dashCooldownTimer = 0;
                this.dashAvailable = true;
            }
        }

        if (this.isDashing) {
            this.dashDurationTimer -= dt;
            if (this.dashDurationTimer <= 0) {
                this.isDashing = false;
                player.setVelocity(0, 0);
                player.play('idle');
            } else {
                player.setVelocity(
                    this.dashDirection.x * this.dashSpeed,
                    this.dashDirection.y * this.dashSpeed,
                );
                if (player.anims.currentAnim?.key !== 'dash') {
                    player.play('dash');
                }
                if (playerShadow && player.active) {
                    playerShadow.setPosition(player.x, player.y + 16);
                    playerShadow.setFlipX(player.flipX);
                }
                return true;
            }
        }
        return false;
    }

    tryTrigger(
        dashKeyPressed: boolean,
        moveX: number,
        moveY: number,
        player: Phaser.Physics.Matter.Sprite,
        canDash: boolean,
    ): void {
        const isMoving = moveX !== 0 || moveY !== 0;

        if (
            !this.isDashing &&
            canDash &&
            dashKeyPressed &&
            this.dashAvailable &&
            isMoving
        ) {
            this.isDashing = true;
            this.dashDurationTimer = this.dashDurationTime;
            this.dashAvailable = false;
            this.dashCooldownTimer = this.dashCooldownTime;

            this.dashDirection.set(moveX, moveY);
            if (this.dashDirection.length() === 0) {
                this.dashDirection.set(player.flipX ? -1 : 1, 0);
            }
            this.dashDirection.normalize();

            player.setVelocity(
                this.dashDirection.x * this.dashSpeed,
                this.dashDirection.y * this.dashSpeed,
            );
            player.play('dash');
        }
    }
}
