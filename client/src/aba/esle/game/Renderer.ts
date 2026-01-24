import { AssetLibrary } from './Assets';
import { FishState, WORLD_WIDTH, WORLD_HEIGHT, SEA_LEVEL } from './Physics';

// --- SU YÜZEYİ EFEKTİ ---
class SeaSurfaceRenderer {
  private offset = 0;

  draw(ctx: CanvasRenderingContext2D, texture: HTMLImageElement | null, cameraX: number, fishY: number, screenW: number) {
    if (!texture || texture.width === 0) return;

    this.offset += 0.5; // Akış hızı

    // Yüzey efekti
    ctx.save();
    ctx.translate(-cameraX + screenW / 2, SEA_LEVEL);
    
    // Yüzeyi biraz basıklaştır (Perspektif)
    ctx.scale(1, 0.3); 

    ctx.globalAlpha = 0.6; // Hafif şeffaf
    ctx.globalCompositeOperation = 'screen'; // Parlaklık verir

    const pat = ctx.createPattern(texture, 'repeat');
    if (pat) {
      ctx.fillStyle = pat;
      ctx.translate(-this.offset, 0);
      // Sadece yüzey çizgisi boyunca çiz
      ctx.fillRect(cameraX - screenW, -50, WORLD_WIDTH + screenW * 2, 200); 
    }
    ctx.restore();
  }
}

// --- ANA RESSAM ---
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

  draw(assets: AssetLibrary, fish: FishState, camera: { x: number; y: number }, chunks: any[], targets: any[]) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // --- KATMAN 1: GÖKYÜZÜ VE YILDIZLAR (EN ARKA) ---
    // Önce simsiyah uzay rengi
    ctx.fillStyle = '#020617'; 
    ctx.fillRect(0, 0, w, h);

    // Yıldızları çiz (Tüm ekrana, çünkü kamera yukarı çıkınca görünmeli)
    if (assets.gece) {
      const pat = ctx.createPattern(assets.gece, 'repeat');
      if (pat) {
        ctx.save();
        ctx.fillStyle = pat;
        // Hafif hareket (Parallax)
        ctx.translate(-camera.x * 0.05, -camera.y * 0.05); 
        ctx.fillRect(0, 0, w * 2 + WORLD_WIDTH, h * 2 + WORLD_HEIGHT); 
        ctx.restore();
      }
    }

    ctx.save();
    // DÜNYA KOORDİNATLARINA GEÇİŞ (Kamera Hareketi)
    ctx.translate(-camera.x + w / 2, -camera.y + h / 2);

    // --- KATMAN 2: MAVİ SU PERDESİ (YILDIZLARI KAPATAN KATMAN) ---
    // Deniz seviyesinden (SEA_LEVEL) en aşağıya kadar mavi bir dikdörtgen çiziyoruz.
    // Bu sayede suyun altındaki yıldızlar kapanıyor.
    
    const waterGrad = ctx.createLinearGradient(0, SEA_LEVEL, 0, WORLD_HEIGHT);
    waterGrad.addColorStop(0, 'rgba(0, 100, 180, 0.6)');   // Yüzey: Açık mavi, az şeffaf (Yıldızlar azıcık görünür)
    waterGrad.addColorStop(0.1, 'rgba(1, 20, 40, 0.95)');  // Biraz altı: Koyu mavi (Yıldızlar kapanır)
    waterGrad.addColorStop(1, '#000000');                  // Dip: Simsiyah

    ctx.fillStyle = waterGrad;
    // Sadece Deniz Seviyesinden aşağısını boya!
    ctx.fillRect(camera.x - w, SEA_LEVEL, WORLD_WIDTH + w * 2, WORLD_HEIGHT - SEA_LEVEL + 500);


    // --- KATMAN 3: SU YÜZEYİ DOKUSU (GOD RAYS) ---
    this.sea.draw(ctx, assets.su, camera.x, fish.y, w);

    // Beyaz bir çizgi çekelim tam su sınırına (Netlik için)
    ctx.beginPath();
    ctx.moveTo(camera.x - w, SEA_LEVEL);
    ctx.lineTo(camera.x + w * 2, SEA_LEVEL);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();


    // --- KATMAN 4: ZEMİNLER (KUMLAR) ---
    // En altta çiziyoruz
    chunks.forEach(c => {
      // Sadece ekranda görünenleri çiz
      if (Math.abs(c.x - camera.x) < w + 500) {
        if (c.base) {
            // WORLD_HEIGHT'ın en altına yapıştır
            ctx.drawImage(c.base, c.x, WORLD_HEIGHT - 350, 2000, 350);
        }
      }
    });


    // --- KATMAN 5: OYUN NESNELERİ (YEMLER) ---
    targets.forEach(t => {
      ctx.beginPath();
      ctx.arc(t.x, t.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = t.color;
      ctx.shadowBlur = 15; 
      ctx.shadowColor = t.color; 
      ctx.fill();
      ctx.shadowBlur = 0;
    });


    // --- KATMAN 6: BALIK ---
    ctx.save();
    ctx.translate(fish.x, fish.y);
    ctx.rotate((fish.rotation * Math.PI) / 180);
    ctx.scale(fish.scaleX, fish.scaleY);

    const frames = fish.isEating ? assets.eat : assets.swim;
    const img = frames[fish.frame % frames.length];
    
    if (img) {
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 20;
      ctx.drawImage(img, -80, -60, 160, 120);
      ctx.shadowBlur = 0;
    }
    ctx.restore();


    // --- KATMAN 7: ÖN PLAN SÜSLERİ (Yosunlar balığın önünde) ---
    chunks.forEach(c => {
      if (Math.abs(c.x - camera.x) < w + 500) {
        if (c.overlay) {
             ctx.drawImage(c.overlay, c.x, WORLD_HEIGHT - 350, 2000, 350);
        }
      }
    });

    ctx.restore();
  }
  }
  
