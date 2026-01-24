// Camera.ts
import { WORLD_WIDTH, WORLD_HEIGHT, SEA_LEVEL } from './Physics';

export class Camera {
  x = 0;
  y = 0;

  update(targetX: number, targetY: number) {
    // Yüzeye yaklaştıkça kamera Y daha az hareket etsin
    const depth = Math.max(0, targetY - SEA_LEVEL);
    const yFactor = depth / (depth + 600); // 0..1

    const desiredX = targetX;
    const desiredY = SEA_LEVEL + depth * yFactor;

    // Smooth follow (Hungry Shark hissi)
    this.x += (desiredX - this.x) * 0.08;
    this.y += (desiredY - this.y) * 0.06;

    // Clamp
    this.x = Math.max(0, Math.min(WORLD_WIDTH, this.x));
    this.y = Math.max(0, Math.min(WORLD_HEIGHT, this.y));
  }
      }
