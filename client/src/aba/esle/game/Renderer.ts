// Renderer.ts
import { AssetLibrary } from './Assets'; // Yanındaki dosyadan alıyor
import { FishState, WORLD_WIDTH, WORLD_HEIGHT, SEA_LEVEL } from './Physics'; // Yanındaki dosyadan alıyor

export class GameRenderer {
    private ctx: CanvasRenderingContext2D;
    private width: number = 0;
    private height: number = 0;
    private waterOffset: number = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d', { alpha: false })!;
    }

    resize(w: number, h: number) {
        this.width = w;
        this.height = h;
        this.ctx.canvas.width = w;
        this.ctx.canvas.height = h;
    }

    draw(assets: AssetLibrary, fish: FishState, camera: {x: number, y: number}, chunks: any[], targets: any[]) {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        this.waterOffset += 1;

        // 1. Arka Plan
        const bgGrad = ctx.createRadialGradient(w/2, 0, 100, w/2, h/2, w);
        bgGrad.addColorStop(0, '#0d2b52');
        bgGrad.addColorStop(1, '#020a1a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.translate(-camera.x + w/2, -camera.y + h/2);

        // 2. Gökyüzü
        if (assets.gece && assets.gece.width > 0) {
            const pat = ctx.createPattern(assets.gece, 'repeat');
            if (pat) {
                ctx.fillStyle = pat;
                ctx.fillRect(camera.x - w, -500, WORLD_WIDTH + w*2, SEA_LEVEL + 500);
            }
        }

        // 3. Su Yüzeyi (Tembel Açı)
        const depth = Math.max(0, fish.y - SEA_LEVEL);
        const lazyTilt = 100 - (70 * (depth / (depth + 600)));
        
        ctx.save();
        ctx.translate(camera.x, SEA_LEVEL);
        ctx.scale(1, Math.cos(lazyTilt * Math.PI / 180));
        
        if (assets.su && assets.su.width > 0) {
            ctx.globalAlpha = 0.4;
            ctx.globalCompositeOperation = 'overlay';
            const offset = this.waterOffset % 800;
            ctx.translate(-offset, -300);
            const pat = ctx.createPattern(assets.su, 'repeat');
            if (pat) {
                ctx.fillStyle = pat;
                ctx.fillRect(camera.x - w - offset, 0, WORLD_WIDTH + w*2, 600);
            }
        }
        ctx.restore();

        // 4. Zeminler
        chunks.forEach(chunk => {
             if (Math.abs(chunk.x - camera.x) < w + 1000) {
                 if (chunk.base && chunk.base.width > 0) ctx.drawImage(chunk.base, chunk.x, WORLD_HEIGHT - 350, 2000, 350);
                 if (chunk.overlay && chunk.overlay.width > 0) ctx.drawImage(chunk.overlay, chunk.x, WORLD_HEIGHT - 350, 2000, 350);
             }
        });

        // 5. Yemler
        targets.forEach(t => {
            ctx.beginPath();
            ctx.arc(t.x, t.y, 20, 0, Math.PI * 2);
            ctx.fillStyle = t.color;
            ctx.fill();
        });

        // 6. Balık
        ctx.save();
        ctx.translate(fish.x, fish.y);
        ctx.rotate(fish.rotation * Math.PI / 180);
        ctx.scale(fish.scaleX, fish.scaleY);
        
        const frames = fish.isEating ? assets.eat : assets.swim;
        const img = frames[fish.frame % frames.length];
        
        if (img && img.width > 0) {
            ctx.drawImage(img, -80, -60, 160, 120);
        } else {
            // Resim yüklenemediyse kırmızı kutu çiz
            ctx.fillStyle = 'red';
            ctx.fillRect(-80, -60, 160, 120);
        }
        ctx.restore();

        ctx.restore();
    }
    }
    
