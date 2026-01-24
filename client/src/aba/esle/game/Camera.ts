import { SEA_LEVEL, WORLD_WIDTH, WORLD_HEIGHT } from './Physics';

export class Camera {
  x = 0;
  y = SEA_LEVEL + 200;

  update(tx: number, ty: number) {
    const safeY = Math.max(SEA_LEVEL + 150, ty);

    this.x += (tx - this.x) * 0.08;
    this.y += (safeY - this.y) * 0.06;

    this.x = Math.max(0, Math.min(WORLD_WIDTH, this.x));
    this.y = Math.max(SEA_LEVEL + 120, Math.min(WORLD_HEIGHT, this.y));
  }
}
