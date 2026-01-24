// SeaSurfaceRenderer.ts
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

    this.offset += 0.4;

    const depth = Math.max(0, fishY - SEA_LEVEL);
    const t = depth / (depth + 400); // 0..1

    const scaleY = 0.05 + t * 0.95; // yukarıda çizgi gibi
    const lift = -80 * (1 - t);     // arka yükselme

    ctx.save();
    ctx.translate(-cameraX + screenW / 2, SEA_LEVEL + lift);
    ctx.scale(1, scaleY);

    ctx.globalAlpha = 0.5;
    const pat = ctx.createPattern(texture, 'repeat');
    if (pat) {
      ctx.fillStyle = pat;
      ctx.translate(-this.offset, -50);
      ctx.fillRect(cameraX - screenW, 0, WORLD_WIDTH + screenW * 2, 200);
    }

    ctx.restore();
  }
}
