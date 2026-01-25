// Renderer.ts
import { AssetLibrary } from './Assets';
import { FishState, WORLD_WIDTH, WORLD_HEIGHT, SEA_LEVEL } from './Physics';

export class GameRenderer {
    private ctx: CanvasRenderingContext2D;
    private width = 0;
    private height = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d', { alpha: false })!;
    }

    resize(w: number, h: number) {
        this.width = w;
        this.height = h;
        this.ctx.canvas.width = w;
        this.ctx.canvas.height = h;
    }

    draw(assets: AssetLibrary, fish: FishState, camera: { x: number; y: number }, targets: any[]) {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        // EKRANI TEMİZLE
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        // KAMERA SİSTEMİ
        ctx.translate(-camera.x + w / 2, -camera.y + h / 2);

        // --- KATMAN 4: ZEMİNLER (EN ALT) ---
        const tileW = 600; 
        const tileOrder = [0, 0, 1, 0, 1]; // 0: Anazemin, 1: Zemin
        
        tileOrder.forEach((type, index) => {
            const img = assets.zeminler[type];
            if (img) {
                ctx.drawImage(img, index * tileW, WORLD_HEIGHT - 300, tileW, 300);
            }
        });

        // --- KATMAN 3: GÖKYÜZÜ ---
        if (assets.gece) {
            const skyX = camera.x * 0.5; 
            const pat = ctx.createPattern(assets.gece, 'repeat');
            if (pat) {
                ctx.save();
                ctx.fillStyle = pat;
                ctx.translate(skyX, 0); 
                // Sadece deniz seviyesinin üstünü boya
                ctx.fillRect(-skyX, SEA_LEVEL - 1000, WORLD_WIDTH + 1000, 1000);
                ctx.restore();
            }
        }

        // --- KATMAN 2: DENİZ SUYU (MAVİ PERDE) ---
        ctx.fillStyle = 'rgba(0, 100, 200, 0.4)'; 
        ctx.fillRect(0, SEA_LEVEL, WORLD_WIDTH, WORLD_HEIGHT - SEA_LEVEL);
        
        // Su Yüzeyi Çizgisi
        ctx.beginPath();
        ctx.moveTo(0, SEA_LEVEL);
        ctx.lineTo(WORLD_WIDTH, SEA_LEVEL);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // --- KATMAN 1: BALIK (EN ÜST) ---
        ctx.save();
        ctx.translate(fish.x, fish.y);
        ctx.rotate((fish.rotation * Math.PI) / 180);
        ctx.scale(fish.scaleX, fish.scaleY);

        let img = assets.swim[0]; 

        if (fish.state === 'TURN_LEFT') {
            img = assets.turnLeft[fish.frame % assets.turnLeft.length];
        } else if (fish.state === 'EAT') {
            img = assets.eat[fish.frame % assets.eat.length];
        } else {
            img = assets.swim[fish.frame % assets.swim.length];
        }

        if (img) {
            ctx.drawImage(img, -80, -60, 160, 120); 
        }
        ctx.restore();

        // SAĞ/SOL DUVARLARI KAPAT (Görsel temizlik)
        ctx.restore(); 
        ctx.save();
        ctx.translate(-camera.x + w / 2, -camera.y + h / 2);
        ctx.fillStyle = '#000';
        ctx.fillRect(-1000, 0, 1000, WORLD_HEIGHT + 1000); // Sol Duvar
        ctx.fillRect(WORLD_WIDTH, 0, 1000, WORLD_HEIGHT + 1000); // Sağ Duvar
        ctx.restore();
    }
}
