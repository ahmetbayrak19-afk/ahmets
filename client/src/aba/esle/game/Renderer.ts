import { AssetLibrary } from './Assets';
import { FishState, WORLD_WIDTH, WORLD_HEIGHT, SEA_LEVEL } from './Physics';

export class GameRenderer {
    private ctx: CanvasRenderingContext2D;
    private width = 0;
    private height = 0;
    
    private tempCanvas: HTMLCanvasElement;
    private tempCtx: CanvasRenderingContext2D;
    
    private columns: { x: number, w: number, alpha: number }[] = [];
    
    private surfaceOffset = 0; 
    private lightTimer = 0; 

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d', { alpha: false })!;
        
        this.tempCanvas = document.createElement('canvas');
        this.tempCtx = this.tempCanvas.getContext('2d')!;

        // Sütunları oluştur
        let currentX = -2000; 
        while (currentX < WORLD_WIDTH + 2000) {
            const w = 40 + Math.random() * 80; 
            const alpha = 0.03 + Math.random() * 0.12;
            this.columns.push({ x: currentX, w: w, alpha: alpha });
            currentX += w; 
        }
    }

    resize(w: number, h: number) {
        this.width = w;
        this.height = h;
        this.ctx.canvas.width = w;
        this.ctx.canvas.height = h;
        
        this.tempCanvas.width = w;
        this.tempCanvas.height = h;
    }

    draw(assets: AssetLibrary, fish: FishState, camera: { x: number; y: number }, targets: any[]) {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        this.surfaceOffset += 1.0; 
        this.lightTimer += 1;

        // 1. GENEL TEMİZLİK
        ctx.fillStyle = '#87CEEB'; 
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.translate(-camera.x + w / 2, -camera.y + h / 2);


        // --- KATMAN 0: SONSUZ GÖKYÜZÜ ---
        ctx.fillStyle = '#87CEEB'; 
        ctx.fillRect(-5000, -10000, WORLD_WIDTH + 10000, 10000 + SEA_LEVEL);


        // --- KATMAN 1: GÖKYÜZÜ RESMİ ---
        if (assets.gok) {
            ctx.drawImage(assets.gok, 0, 0, 3010, 500); 
        }


        // --- KATMAN 2: DİKEY OKYANUS ARKA PLANI ---
        ctx.globalCompositeOperation = 'source-over';
        
        const baseGradient = ctx.createLinearGradient(0, SEA_LEVEL, 0, WORLD_HEIGHT);
        baseGradient.addColorStop(0, '#0077be');    
        baseGradient.addColorStop(0.6, '#004488');  
        baseGradient.addColorStop(1, '#002244');    
        
        ctx.fillStyle = baseGradient;
        ctx.fillRect(0, SEA_LEVEL, WORLD_WIDTH, WORLD_HEIGHT - SEA_LEVEL);

        // Sütunlar
        ctx.globalCompositeOperation = 'soft-light';
        this.columns.forEach(col => {
            if (col.x + col.w > camera.x - w && col.x < camera.x + w) {
                const colGradient = ctx.createLinearGradient(0, SEA_LEVEL, 0, WORLD_HEIGHT);
                colGradient.addColorStop(0, `rgba(200, 240, 255, ${col.alpha})`);
                colGradient.addColorStop(1, 'rgba(200, 240, 255, 0)');
                ctx.fillStyle = colGradient;
                ctx.fillRect(col.x, SEA_LEVEL, col.w, WORLD_HEIGHT - SEA_LEVEL);
            }
        });
        ctx.globalCompositeOperation = 'source-over';


        // --- KATMAN 3: ZEMİNLER ---
        const tileW = 600; 
        const tileOrder = [0, 0, 1, 0, 1]; 
        tileOrder.forEach((type, index) => {
            const img = assets.zeminler[type];
            if (img) {
                ctx.drawImage(img, index * tileW, WORLD_HEIGHT - 300, tileW, 300);
            }
        });


        // --- KATMAN 4: SU YÜZEYİ DOKUSU (GÜNCELLENDİ: OPTİMUM BOYUT) ---
        if (assets.su) {
            const distFromSurface = Math.max(0, camera.y - SEA_LEVEL);
            
            // DÜZELTME: 1.4 yerine 0.9 (Daha dengeli uzama)
            // Maksimum boy: 750px (Ekranı yutmaz)
            const lidHeight = Math.max(50, Math.min(750, distFromSurface * 0.9));

            if (lidHeight > 2) { 
                const upPart = lidHeight * 0.95; 
                const drawY = SEA_LEVEL - upPart; 

                this.tempCtx.clearRect(0, 0, w, h);
                this.tempCtx.save();
                this.tempCtx.translate(-camera.x + w / 2, -camera.y + h / 2);

                const imgW = 592; 
                const shift = this.surfaceOffset % imgW;
                const count = Math.ceil(WORLD_WIDTH / imgW) + 2; 

                for (let i = 0; i < count; i++) {
                    const drawX = (i * imgW) - shift;
                    if (drawX < WORLD_WIDTH && drawX + imgW > -500) {
                        this.tempCtx.drawImage(assets.su, drawX, drawY, imgW, lidHeight);
                    }
                }

                this.tempCtx.globalCompositeOperation = 'destination-in';
                const fadeGradient = this.tempCtx.createLinearGradient(0, drawY, 0, drawY + lidHeight);
                fadeGradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)'); 
                fadeGradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.7)'); 
                fadeGradient.addColorStop(1, 'rgba(0, 0, 0, 1.0)'); 
                
                this.tempCtx.fillStyle = fadeGradient;
                this.tempCtx.fillRect(camera.x - w, drawY, w * 3, lidHeight);
                this.tempCtx.restore();

                ctx.drawImage(this.tempCanvas, camera.x - w / 2, camera.y - h / 2);
            }
        }


        // --- KATMAN 5: BALIK ---
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


        // --- KATMAN 6: OTLAR ---
        const grassMap = ['ot1', null, 'ot2', 'ot1', null];
        grassMap.forEach((grassType, index) => {
            if (!grassType) return; 
            const grassImg = grassType === 'ot1' ? assets.otlar.ot1 : assets.otlar.ot2;
            if (grassImg) {
                ctx.drawImage(grassImg, index * tileW, WORLD_HEIGHT - 300, 600, 300);
            }
        });


        // --- KATMAN 7: SU ATMOSFERİ CİLASI ---
        ctx.globalCompositeOperation = 'source-over';
        const tintGradient = ctx.createLinearGradient(0, SEA_LEVEL, 0, WORLD_HEIGHT);
        tintGradient.addColorStop(0, 'rgba(0, 80, 120, 0.05)'); 
        tintGradient.addColorStop(1, 'rgba(0, 30, 70, 0.5)');   
        
        ctx.fillStyle = tintGradient;
        ctx.fillRect(camera.x - w, SEA_LEVEL, w * 3, WORLD_HEIGHT - SEA_LEVEL);


        // --- SÜSLER ---
        ctx.beginPath();
        ctx.moveTo(0, SEA_LEVEL);
        ctx.lineTo(WORLD_WIDTH, SEA_LEVEL);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore(); 
        
        // Duvarlar
        ctx.save();
        ctx.translate(-camera.x + w / 2, -camera.y + h / 2);
        ctx.fillStyle = '#000';
        ctx.fillRect(-6000, -2000, 4000, WORLD_HEIGHT + 4000); 
        ctx.fillRect(WORLD_WIDTH, -2000, 4000, WORLD_HEIGHT + 4000); 
        ctx.restore();
    }
}
