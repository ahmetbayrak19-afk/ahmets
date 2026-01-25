import { AssetLibrary } from './Assets';
import { FishState, WORLD_WIDTH, WORLD_HEIGHT, SEA_LEVEL } from './Physics';

export class GameRenderer {
    private ctx: CanvasRenderingContext2D;
    private width = 0;
    private height = 0;
    
    private surfaceOffset = 0; 
    private lightTimer = 0; 
    private rays: { x: number, w: number, speed: number }[] = [];

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d', { alpha: false })!;
        for(let i = -500; i < WORLD_WIDTH + 500; i += 400) {
            this.rays.push({
                x: i,
                w: 200 + Math.random() * 150, 
                speed: 0.02 + Math.random() * 0.03 
            });
        }
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

        this.surfaceOffset += 1.0; 
        this.lightTimer += 1;

        // 1. TEMİZLİK
        ctx.fillStyle = '#87CEEB'; 
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        // KAMERA SİSTEMİ
        ctx.translate(-camera.x + w / 2, -camera.y + h / 2);


        // --- KATMAN 0: SONSUZ GÖKYÜZÜ ASTARI ---
        ctx.fillStyle = '#87CEEB'; 
        ctx.fillRect(-2000, -10000, WORLD_WIDTH + 4000, 10000 + SEA_LEVEL);


        // --- KATMAN 1: GÖKYÜZÜ RESMİ ---
        if (assets.gok) {
            ctx.drawImage(assets.gok, 0, 0, 3010, 500); 
        }


        // --- KATMAN 1.5: SU YÜZEYİ (GRADYANLI FADE) ---
        if (assets.su) {
            const distFromSurface = Math.max(0, camera.y - SEA_LEVEL);
            const lidHeight = Math.max(20, Math.min(500, distFromSurface * 0.6));

            if (lidHeight > 2) { 
                const upPart = lidHeight * 0.95; // %95 Havada
                const drawY = SEA_LEVEL - upPart; 

                ctx.save();
                
                // 1. Resmi Çiziyoruz (Normal Mod)
                ctx.globalAlpha = 0.9; // Temel görünürlük yüksek
                ctx.globalCompositeOperation = 'source-over'; 
                
                const imgW = 592; 
                const shift = this.surfaceOffset % imgW;
                const count = Math.ceil(WORLD_WIDTH / imgW) + 2; 

                for (let i = 0; i < count; i++) {
                    const drawX = (i * imgW) - shift;
                    if (drawX < WORLD_WIDTH && drawX + imgW > -500) {
                        ctx.drawImage(assets.su, drawX, drawY, imgW, lidHeight);
                    }
                }
                
                // 2. MASKELEME (İSTEĞİN OLAN KISIM)
                // "destination-in" modu, var olan çizimi maskeler (keser/siler).
                // Gradyan ile üst tarafı siliyoruz, alt tarafı tutuyoruz.
                ctx.globalCompositeOperation = 'destination-in';
                
                const fadeGradient = ctx.createLinearGradient(0, drawY, 0, drawY + lidHeight);
                // ÜST (Ufuk): Opacity 0.1 (Çok silik, Gökyüzü görünüyor)
                fadeGradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)'); 
                // ORTA: Opacity 0.6 (Belirginleşiyor)
                fadeGradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.6)'); 
                // ALT (Deniz): Opacity 1.0 (Tam Net)
                fadeGradient.addColorStop(1, 'rgba(0, 0, 0, 1.0)'); 
                
                ctx.fillStyle = fadeGradient;
                ctx.fillRect(camera.x - w, drawY, w * 3, lidHeight);

                ctx.restore();
            }
        }


        // --- KATMAN 2: ZEMİNLER ---
        const tileW = 600; 
        const tileOrder = [0, 0, 1, 0, 1]; 
        tileOrder.forEach((type, index) => {
            const img = assets.zeminler[type];
            if (img) {
                ctx.drawImage(img, index * tileW, WORLD_HEIGHT - 300, tileW, 300);
            }
        });


        // --- KATMAN 3: DERİN SU PERDESİ (GÜNDÜZ) ---
        ctx.globalCompositeOperation = 'source-over';
        const deepGradient = ctx.createLinearGradient(0, SEA_LEVEL, 0, WORLD_HEIGHT);
        deepGradient.addColorStop(0, 'rgba(0, 180, 255, 0.05)'); 
        deepGradient.addColorStop(0.5, 'rgba(0, 100, 200, 0.3)'); 
        deepGradient.addColorStop(1, 'rgba(0, 40, 100, 0.85)');    
        ctx.fillStyle = deepGradient;
        ctx.fillRect(0, SEA_LEVEL, WORLD_WIDTH, WORLD_HEIGHT - SEA_LEVEL);


        // --- KATMAN 3.5: TANRISAL IŞIKLAR ---
        ctx.save();
        ctx.globalCompositeOperation = 'overlay'; 
        const rayGradient = ctx.createLinearGradient(0, SEA_LEVEL, 0, WORLD_HEIGHT);
        rayGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)'); 
        rayGradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');   
        ctx.fillStyle = rayGradient;
        this.rays.forEach((ray, index) => {
            if (ray.x > camera.x - w && ray.x < camera.x + w) {
                const sway = Math.sin(this.lightTimer * ray.speed + index) * 50; 
                const slant = 300; 
                ctx.beginPath();
                ctx.moveTo(ray.x, SEA_LEVEL); 
                ctx.lineTo(ray.x + ray.w, SEA_LEVEL); 
                ctx.lineTo(ray.x + ray.w + slant + sway, WORLD_HEIGHT); 
                ctx.lineTo(ray.x + slant + sway, WORLD_HEIGHT); 
                ctx.closePath();
                ctx.fill();
            }
        });
        ctx.restore();


        // --- KATMAN 4: BALIK ---
        ctx.save();
        ctx.translate(fish.x, fish.y);
        ctx.rotate((fish.rotation * Math.PI) / 180);
        ctx.scale(fish.scaleX, fish.scaleY);
        let img = assets.swim[0]; 
        if (fish.state === 'TURN_LEFT') img = assets.turnLeft[fish.frame % assets.turnLeft.length];
        else if (fish.state === 'EAT') img = assets.eat[fish.frame % assets.eat.length];
        else img = assets.swim[fish.frame % assets.swim.length];
        if (img) {
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 20;
            ctx.drawImage(img, -80, -60, 160, 120);
            ctx.shadowBlur = 0;
        }
        ctx.restore();


        // --- KATMAN 5: OTLAR ---
        const grassMap = ['ot1', null, 'ot2', 'ot1', null];
        grassMap.forEach((grassType, index) => {
            if (!grassType) return; 
            const grassImg = grassType === 'ot1' ? assets.otlar.ot1 : assets.otlar.ot2;
            if (grassImg) {
                ctx.drawImage(grassImg, index * tileW, WORLD_HEIGHT - 300, 600, 300);
            }
        });


        // --- SÜSLER ---
        ctx.beginPath();
        ctx.moveTo(0, SEA_LEVEL);
        ctx.lineTo(WORLD_WIDTH, SEA_LEVEL);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore(); 
        
        // Duvarlar
        ctx.save();
        ctx.translate(-camera.x + w / 2, -camera.y + h / 2);
        ctx.fillStyle = '#000';
        ctx.fillRect(-2000, -2000, 2000, WORLD_HEIGHT + 4000); 
        ctx.fillRect(WORLD_WIDTH, -2000, 2000, WORLD_HEIGHT + 4000); 
        ctx.restore();
    }
}
