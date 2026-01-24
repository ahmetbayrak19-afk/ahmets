export const WORLD_WIDTH = 20000;
export const WORLD_HEIGHT = 2000;
export const SEA_LEVEL = 500;

export interface FishState {
    x: number; y: number;
    vx: number; vy: number;
    rotation: number;
    scaleX: number; scaleY: number;
    frame: number; timer: number;
    isEating: boolean;
}

export class PhysicsEngine {
    updateFish(fish: FishState, tx: number, ty: number) {
        const dx = tx - fish.x;
        const dy = ty - fish.y;
        const dist = Math.hypot(dx, dy);

        const boost = Math.min(dist / 300, 1);
        fish.vx += dx * 0.0012 * boost;
        fish.vy += dy * 0.001 * boost;

        fish.vx *= 0.96;
        fish.vy *= 0.96;

        const speed = Math.hypot(fish.vx, fish.vy);
        if (speed > 14) {
            const r = 14 / speed;
            fish.vx *= r; fish.vy *= r;
        }

        fish.x += fish.vx;
        fish.y += fish.vy;

        fish.x = Math.max(60, Math.min(WORLD_WIDTH - 60, fish.x));
        fish.y = Math.min(WORLD_HEIGHT - 60, fish.y);

        fish.timer++;
        if (fish.timer > 3) {
            fish.frame++;
            fish.timer = 0;
        }

        const face = fish.vx >= 0 ? 1 : -1;
        const targetRot = Math.atan2(fish.vy, Math.abs(fish.vx)) * 180 / Math.PI * face;
        fish.rotation += (targetRot - fish.rotation) * 0.15;

        const depth = Math.max(0, (fish.y - SEA_LEVEL) / (WORLD_HEIGHT - SEA_LEVEL));
        const scale = 1 + depth * 0.6;
        const eatPulse = fish.isEating ? 0.1 : 0;

        fish.scaleX = face * (scale + eatPulse);
        fish.scaleY = scale - eatPulse;
    }
            }
