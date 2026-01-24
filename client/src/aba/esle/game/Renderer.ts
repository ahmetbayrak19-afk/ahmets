import { AssetLibrary } from './Assets';
import { FishState, WORLD_WIDTH, WORLD_HEIGHT, SEA_LEVEL } from './Physics';

// --- SU YÜZEYİ VE IŞIK EFEKTİ ---
class SeaSurfaceRenderer {
  private offset = 0;

  draw(ctx: CanvasRenderingContext2D, texture: HTMLImageElement | null, cameraX: number, fishY: number, screenW: number) {
    if (!texture || texture.width === 0) return;

    this.offset += 0.5; // Akış hızı

    // Derinliğe göre ışık açısı değişsin
    const depth = Math.max(0, fishY - SEA_LEVEL);
    const t = Math.min(1, depth / 600);
    
    // Işık hüzmelerinin uzaması (Yüzeye yakınken kısa, derinde uzun)
    const scaleY = 1 + t * 2; 

    ctx.save();
    // Su yüzeyinin başladığı yer
    ctx.translate(-cameraX + screenW / 2, SEA_LEVEL);
    
    // Perspektif efekti (üst taraf dar, alt taraf geniş gibi hile yapıyoruz)
    ctx.scale(1, scaleY);

    // Işık Hüzmesi Rengi (Beyaz/Mavi karışımı)
    ctx.globalCompositeOperation = 'overlay'; // Renkleri parlatır
    ctx.globalAlpha = 0.3; // Şeffaflık

    const pat = ctx.createPattern(texture, 'repeat');
    if (pat) {
      ctx.fillStyle = pat;
      // Dokuyu hareket ettir
      ctx.translate(-this.offset, 0);
      // Çok uzun bir dikdörtgen çiz ki derine inince bitmesin
      ctx.fillRect(cameraX - screenW, 0, WORLD_WIDTH + screenW * 2, 1000);
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

    // 1. ADIM: GÖKYÜZÜ (YILDIZLAR)
    // Önce arka planı lacivert yap
    ctx.fillStyle = '#020617'; 
    ctx.fillRect(0, 0, w, h);

    // Yıldız resmini sadece yukarı çiz (Background)
    if (assets.gece) {
      const pat = ctx.createPattern(assets.gece, 'repeat');
      if (pat) {
        ctx.save();
        ctx.fillStyle = pat;
        // Yıldızlar kamerayla çok az hareket etsin (Parallax efekti)
        ctx.translate(-camera.x * 0.1, -camera.y * 0.1); 
        ctx.fillRect(0, 0, w + 2000, h + 2000); // Geniş çiz
        ctx.restore();
      }
    }

    ctx.save();
    // Kamerayı ayarla (Dünya koordinatlarına geçiş)
    ctx.translate(-camera.x + w / 2, -camera.y + h / 2);

    // 2. ADIM: SUYUN KENDİSİ (MAVİ PERDE)
    // Yıldızların üzerine mavi bir katman atıyoruz ki su gibi görünsün
    const gradient = ctx.createLinearGradient(0, SEA_LEVEL, 0, SEA_LEVEL + 1500);
    gradient.addColorStop(0, 'rgba(0, 105, 148, 0.4)'); // Yüzeyde açık mavi, şeffaf
    gradient.addColorStop(0.3, 'rgba(2, 6, 23, 0.95)'); // Biraz aşağıda koyulaşsın
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');       // Dipte zifiri karanlık

    ctx.fillStyle = gradient;
    // Deniz seviyesinden aşağıya doğru kocaman bir dikdörtgen çiz
    ctx.fillRect(camera.x - w, SEA_LEVEL, WORLD_WIDTH + w * 2, WORLD_HEIGHT);

    // 3. ADIM: SU YÜZEYİ EFEKTİ (GOD RAYS)
    // Senin yolladığın texture burada kullanılıyor
    this.sea.draw(ctx, assets.su, camera.x, fish.y, w);

    // 4. ADIM: SU YÜZEYİ ÇİZGİSİ (Beyaz Köpük)
    ctx.beginPath();
    ctx.moveTo(camera.x - w, SEA_LEVEL);
    ctx.lineTo(camera.x + w * 2, SEA_LEVEL);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 5. ADIM: ZEMİNLER
    chunks.forEach(c => {
      // Sadece ekranda görünenleri çiz (Performans için)
      if (Math.abs(c.x - camera.x) < w + 500) {
        if (c.base) ctx.drawImage(c.base, c.x, WORLD_HEIGHT - 350, 2000, 350);
      }
    });

    // 6. ADIM: YEMLER
    targets.forEach(t => {
      ctx.beginPath();
      ctx.arc(t.x, t.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = t.color;
      ctx.shadowBlur = 15; 
      ctx.shadowColor = t.color; // Yemler parlasın
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // 7. ADIM: BALIK
    ctx.save();
    ctx.translate(fish.x, fish.y);
    
    // Balık dönüşü ve derinlik efekti (Scale)
    ctx.rotate((fish.rotation * Math.PI) / 180);
    ctx.scale(fish.scaleX, fish.scaleY);

    const frames = fish.isEating ? assets.eat : assets.swim;
    const img = frames[fish.frame % frames.length];
    
    if (img) {
      // Gölge efekti (Balık derinlik hissi versin)
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 20;
      ctx.drawImage(img, -80, -60, 160, 120);
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    // 8. ADIM: ÖN KATMAN (Yosunlar balığın önünde kalsın)
    chunks.forEach(c => {
      if (Math.abs(c.x - camera.x) < w + 500) {
        if (c.overlay) {
             // Hafif sallanma efekti verilebilir mi? Şimdilik sabit kalsın.
             ctx.drawImage(c.overlay, c.x, WORLD_HEIGHT - 350, 2000, 350);
        }
      }
    });

    ctx.restore();
  }
      }
        
