export const WORLD_WIDTH = 20000;
export const WORLD_HEIGHT = 2000;
export const SEA_LEVEL = 500;

export interface FishState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  frame: number;
  timer: number;
  isEating: boolean;
}

export class PhysicsEngine {
  updateFish(fish: FishState, targetX: number, targetY: number) {
    const depth = fish.y - SEA_LEVEL;
    const inWater = depth >= 0;

    if (inWater) {
      const dx = targetX - fish.x;
      const dy = targetY - fish.y;

      fish.vx += dx * 0.0004;
      fish.vy += dy * 0.0004;

      fish.vx *= 0.93;
      fish.vy *= 0.93;

      const depthFactor = Math.min(1, depth / 300);
      const maxSpeed = 2 + depthFactor * 6;

      const speed = Math.hypot(fish.vx, fish.vy);
      if (speed > maxSpeed) {
        const r = maxSpeed / speed;
        fish.vx *= r;
        fish.vy *= r;
      }
    }

    fish.x += fish.vx;
    fish.y += fish.vy;

    // 🚫 Deniz üstüne çıkamaz
    if (fish.y < SEA_LEVEL + 25) {
      fish.y = SEA_LEVEL + 25;
      fish.vy = Math.max(0, fish.vy);
    }

    fish.x = Math.max(80, Math.min(WORLD_WIDTH - 80, fish.x));
    fish.y = Math.min(WORLD_HEIGHT - 80, fish.y);

    fish.timer++;
    if (fish.timer > 4) {
      fish.frame++;
      fish.timer = 0;
    }

    const dir = fish.vx >= 0 ? 1 : -1;
    const angle = Math.atan2(fish.vy, Math.abs(fish.vx));
    fish.rotation += ((angle * 180) / Math.PI * dir - fish.rotation) * 0.12;

    const depthRatio = Math.min(1, depth / (WORLD_HEIGHT - SEA_LEVEL));
    const scale = 1 + depthRatio * 0.5;

    fish.scaleX = dir * scale;
    fish.scaleY = scale;
  }
  }
