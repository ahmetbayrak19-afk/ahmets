import { AssetLibrary } from './Assets';
import { FishState, WORLD_WIDTH, WORLD_HEIGHT } from './Physics';
import { SeaSurfaceRenderer } from './SeaSurfaceRenderer';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private sea = new SeaSurfaceRenderer();

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
  }

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.ctx.canvas.width = w;
    this.ctx.canvas.height = h;
  }

  draw(
    assets: AssetLibrary,
    fish: FishState,
    camera: { x: number; y: number },
    chunks: any[],
    targets: any[]
  ) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);

    if (assets.gece) {
      const pat = ctx.createPattern(assets.gece, 'repeat');
      if (pat) {
        ctx.fillStyle = pat;
        ctx.fillRect(0, 0, w, h);
      }
    }

    ctx.save();
    ctx.translate(-camera.x + w / 2, -camera.y + h / 2);

    this.sea.draw(ctx, assets.su, camera.x, fish.y, w);

    chunks.forEach(c => {
      if (c.base) ctx.drawImage(c.base, c.x, WORLD_HEIGHT - 350, 2000, 350);
    });

    targets.forEach(t => {
      ctx.beginPath();
      ctx.arc(t.x, t.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = t.color;
      ctx.fill();
    });

    ctx.save();
    ctx.translate(fish.x, fish.y);
    ctx.rotate((fish.rotation * Math.PI) / 180);
    ctx.scale(fish.scaleX, fish.scaleY);

    const frames = fish.isEating ? assets.eat : assets.swim;
    const img = frames[fish.frame % frames.length];
    ctx.drawImage(img, -80, -60, 160, 120);
    ctx.restore();

    chunks.forEach(c => {
      if (c.overlay) ctx.drawImage(c.overlay, c.x, WORLD_HEIGHT - 350, 2000, 350);
    });

    ctx.restore();
  }
                }
