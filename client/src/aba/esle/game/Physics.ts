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
    const inWater = fish.y >= SEA_LEVEL;

    if (inWater) {
      const dx = targetX - fish.x;
      const dy = targetY - fish.y;

      // 🟢 DAHA YUMUŞAK TAKİP
      fish.vx += dx * 0.00045;
      fish.vy += dy * 0.00045;

      fish.vx *= 0.94;
      fish.vy *= 0.94;

      // 🟢 SURFACE YAKININDA YAVAŞLAT
      const depth = fish.y - SEA_LEVEL;
      const depthFactor = Math.min(1, depth / 250);

      const maxSpeed = 7 * depthFactor + 2;
      const speed = Math.hypot(fish.vx, fish.vy);
      if (speed > maxSpeed) {
        const r = maxSpeed / speed;
        fish.vx *= r;
        fish.vy *= r;
      }
    }

    fish.x += fish.vx;
    fish.y += fish.vy;

    // 🟢 DENİZ ÜSTÜNE ÇIKAMAZ
    if (fish.y < SEA_LEVEL + 20) {
      fish.y = SEA_LEVEL + 20;
      fish.vy = Math.max(0, fish.vy);
    }

    // Sınırlar
    fish.x = Math.max(50, Math.min(WORLD_WIDTH - 50, fish.x));
    fish.y = Math.min(WORLD_HEIGHT - 50, fish.y);

    // Animasyon
    fish.timer++;
    if (fish.timer > 4) {
      fish.frame++;
      fish.timer = 0;
    }

    // Yön & dönüş
    const dir = fish.vx >= 0 ? 1 : -1;
    const angle = Math.atan2(fish.vy, Math.abs(fish.vx));
    fish.rotation += (angle * 180 / Math.PI * dir - fish.rotation) * 0.12;

    // Derinlik ölçeği
    const depthRatio = Math.max(0, (fish.y - SEA_LEVEL) / (WORLD_HEIGHT - SEA_LEVEL));
    const scale = 1 + depthRatio * 0.5;

    fish.scaleX = dir * scale;
    fish.scaleY = scale;
  }
                               }
