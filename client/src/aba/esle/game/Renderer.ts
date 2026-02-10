import { AssetLibrary } from './Assets';
import { FishState, WORLD_WIDTH, WORLD_HEIGHT, SEA_LEVEL } from './Physics';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;

  // Eğer eski renderer'da tempCanvas vs. vardıysa kalabilir,
  // ama 3D arkaplana geçtiğimiz için ihtiyaç yok.
  constructor(canvas: HTMLCanvasElement) {
    // ✅ alpha:true => canvas şeffaf olur
    const ctx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
    } as any);

    if (!ctx) throw new Error("2D context alınamadı");
    this.ctx = ctx;
  }

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;

    // Canvas boyutlarını kesin set et
    this.ctx.canvas.width = Math.max(1, Math.floor(w));
    this.ctx.canvas.height = Math.max(1, Math.floor(h));

    // Ölçek/transform sıfırla
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  draw(assets: AssetLibrary, fish: FishState, camera: { x: number; y: number }, targets: any[]) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // ✅ Her frame başında temizle -> alttaki 3D görünür
    ctx.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Dünya transformu
    ctx.save();
    ctx.translate(-camera.x + w / 2, -camera.y + h / 2);

    // --- BALIK ---
    ctx.save();
    ctx.translate(fish.x, fish.y);
    ctx.rotate((fish.rotation * Math.PI) / 180);
    ctx.scale(fish.scaleX, fish.scaleY);

    let img = assets.swim?.[0];
    if (fish.state === 'TURN_LEFT') img = assets.turnLeft?.[fish.frame % assets.turnLeft.length];
    else if (fish.state === 'EAT') img = assets.eat?.[fish.frame % assets.eat.length];
    else img = assets.swim?.[fish.frame % assets.swim.length];

    if (img) {
      // İstersen gölgeyi kapat (bazı cihazlarda “kutu” hissi veriyor)
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 16;

      ctx.drawImage(img, -80, -60, 160, 120);

      ctx.shadowBlur = 0;
    }

    ctx.restore();

    // targets çiziyorsan burada çiz (şimdilik boş)

    ctx.restore();
  }
      }
