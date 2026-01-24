import { SEA_LEVEL, WORLD_WIDTH } from './Physics';

export class SeaSurfaceRenderer {
  private offset = 0;

  draw(
    ctx: CanvasRenderingContext2D,
    texture: HTMLImageElement | null,
    cameraX: number,
    fishY: number,
    screenW: number
  ) {
    if (!texture || texture.width === 0) return;

    this.offset += 0.25;

    const depth = Math.max(0, fishY - SEA_LEVEL);
    const t = Math.min(1, depth / 350);

    const scaleY = 0.06 + t * 0.94;
    const lift = -70 * (1 - t);

    ctx.save();
    ctx.translate(-cameraX + screenW / 2, SEA_LEVEL + lift);
    ctx.scale(1, scaleY);

    ctx.globalAlpha = 0.55;
    const pat = ctx.createPattern(texture, 'repeat');
    if (pat) {
      ctx.fillStyle = pat;
      ctx.translate(-this.offset, -40);
      ctx.fillRect(cameraX - screenW, 0, WORLD_WIDTH + screenW * 2, 180);
    }

    ctx.restore();
  }
}
