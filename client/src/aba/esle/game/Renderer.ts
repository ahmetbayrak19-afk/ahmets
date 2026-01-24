// Renderer.ts
import { AssetLibrary } from './Assets';
import { FishState, WORLD_WIDTH, WORLD_HEIGHT, SEA_LEVEL } from './Physics';

// --- SU YÜZEYİ ÇİZİCİ (Senin yolladığın kod buraya eklendi) ---
class SeaSurfaceRenderer {
  private offset = 0;

  draw(ctx: CanvasRenderingContext2D, texture: HTMLImageElement | null, cameraX: number, fishY: number, screenW: number) {
    if (!texture || texture.width === 0) return;

    this.offset += 0.25;

    const depth = Math.max(0, fishY - SEA_LEVEL);
    const t = Math.min(1, depth / 350);

    const scaleY = 0.06 + t * 0.94; // Derine indikçe su yüzeyi düzleşir
    const lift = -70 * (1 - t);

    ctx.save();
    ctx.translate(-cameraX + screenW / 2, SEA_LEVEL + lift);
    ctx.scale(1, scaleY);

    ctx.globalAlpha = 0.55;
    const pat = ctx.createPattern(texture, 'repeat');
    if (pat) {
      ctx.fillStyle = pat;
      // Suyu hareket ettir
      ctx.translate(-this.offset, -40);
      ctx.fillRect(cameraX - screenW, 0, WORLD_WIDTH + screenW * 2, 180);
    }
    ctx.restore();
  }
}

// --- ANA RESSAM ---
export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private sea = new SeaSurfaceRenderer(); // Yukarıdaki sınıfı kullanıyor

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
  }

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.ctx.canvas.width = w;
    this.ctx.canvas.height = h;
  }

  draw(assets: AssetLibrary, fish: FishState, camera: { x: number; y: number }, chunks: any[], targets: any[]) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // 1. Arkaplan (Lacivert Derinlik)
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
    // Kamerayı merkeze al
    ctx.translate(-camera.x + w / 2, -camera.y + h / 2);

    // 2. Su Yüzeyi (God Rays burada oluşuyor)
    this.sea.draw(ctx, assets.su, camera.x, fish.y, w);

    // 3. Zeminler
    chunks.forEach(c => {
      if (c.base) ctx.drawImage(c.base, c.x, WORLD_HEIGHT - 350, 2000, 350);
    });

    // 4. Yemler
    targets.forEach(t => {
      ctx.beginPath();
      ctx.arc(t.x, t.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = t.color;
      ctx.shadowBlur = 10; ctx.shadowColor = t.color; // Parlama efekti
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // 5. Balık Çizimi
    ctx.save();
    ctx.translate(fish.x, fish.y);
    ctx.rotate((fish.rotation * Math.PI) / 180);
    ctx.scale(fish.scaleX, fish.scaleY);

    const frames = fish.isEating ? assets.eat : assets.swim;
    const img = frames[fish.frame % frames.length];
    if(img) ctx.drawImage(img, -80, -60, 160, 120);
    
    ctx.restore();

    // 6. Zemin Üstü Süsler (Yosun vb.)
    chunks.forEach(c => {
      if (c.overlay) ctx.drawImage(c.overlay, c.x, WORLD_HEIGHT - 350, 2000, 350);
    });

    ctx.restore();
  }
        }
  
