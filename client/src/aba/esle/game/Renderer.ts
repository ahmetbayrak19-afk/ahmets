import { AssetLibrary } from './Assets';
import { FishState, WORLD_WIDTH, WORLD_HEIGHT, SEA_LEVEL } from './Physics';

export class GameRenderer {
    private ctx: CanvasRenderingContext2D;
    private w = 0;
    private h = 0;
    private waterOffset = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d', { alpha: false })!;
    }

    resize(w: number, h: number) {
        if (this.w !== w || this.h !== h) {
            this.w = w; this.h = h;
            this.ctx.canvas.width = w;
            this.ctx.canvas.height = h;
        }
    }

    draw(
        assets: AssetLibrary,
        fish: FishState,
        camera: { x: number; y: number },
        chunks: any[],
        targets: any[]
    ) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.w, this.h);
        this.waterOffset++;

        // Background
        const g = ctx.createLinearGradient(0, 0, 0, this.h);
        g.addColorStop(0, '#0b2c55');
        g.addColorStop(1, '#020a1a');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, this.w, this.h);

        ctx.save();
        ctx.translate(-camera.x + this.w / 2, -camera.y + this.h / 2);

        // Zemin
        chunks.forEach(c => {
            if (Math.abs(c.x - camera.x) < this.w + 1000) {
                c.base && ctx.drawImage(c.base, c.x, WORLD_HEIGHT - 350, 2000, 350);
                c.overlay && ctx.drawImage(c.overlay, c.x, WORLD_HEIGHT - 350, 2000, 350);
            }
        });

        // Yemler
        targets.forEach(t => {
            const pulse = Math.sin(t.pulse) * 3;
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.r + pulse, 0, Math.PI * 2);
            ctx.fillStyle = t.color;
            ctx.fill();
        });

        // Balık
        ctx.save();
        ctx.translate(fish.x, fish.y);
        ctx.rotate(fish.rotation * Math.PI / 180);
        ctx.scale(fish.scaleX, fish.scaleY);

        const frames = fish.isEating ? assets.eat : assets.swim;
        const img = frames[fish.frame % frames.length];
        img && ctx.drawImage(img, -80, -60, 160, 120);

        ctx.restore();
        ctx.restore();
    }
                  }
