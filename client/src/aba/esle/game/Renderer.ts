import { AssetLibrary } from './Assets';
import { FishState, WORLD_WIDTH, WORLD_HEIGHT, SEA_LEVEL } from './Physics';

export class GameRenderer {
    private ctx: CanvasRenderingContext2D;
    private width = 0;
    private height = 0;
    
    private tempCanvas: HTMLCanvasElement;
    private tempCtx: CanvasRenderingContext2D;
    
    // Sütunları sakladığımız dizi
    private columns: { x: number, w: number, alpha: number }[] = [];
    
    private surfaceOffset = 0; 
    private lightTimer = 0; 

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d', { alpha: false })!;
        
        this.tempCanvas = document.createElement('canvas');
        this.tempCtx = this.tempCanvas.getContext('2d')!;

        // --- SIKLAŞTIRILMIŞ SÜTUNLAR ---
        let currentX = -2000; 
        while (currentX < WORLD_WIDTH + 2000) {
            // DÜZELTME 2: Genişliği azalttık (Daha sık sütunlar)
            // Eskiden: 100-400px idi. Şimdi: 40-120px arası.
            const w = 40 + Math.random() * 80;
            
            // Görünürlük ayarı (Bazıları çok belirgin, bazıları silik)
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

        // 1. GENEL TEMİZLİK (Gök Mavisi)
        ctx.fillStyle = '#87CEEB'; 
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.translate(-camera.x + w / 2, -camera.y + h / 2);


        // --- KATMAN 0: SONSUZ GÖKYÜZÜ ASTARI ---
        ctx.fillStyle = '#87CEEB'; 
        ctx.fillRect(-5000, -10000, WORLD_WIDTH + 10000, 10000 + SEA_LEVEL);


        // --- KATMAN 1: GÖKYÜZÜ RESMİ ---
        if (assets.gok) {
            ctx.drawImage(assets.gok, 0, 0, 3010, 500); 
        }


        // --- KATMAN 1.5: SU YÜZEYİ (HAYALET KATMAN) ---
        if (assets.su) {
            const distFromSurface = Math.max(0, camera.y - SEA_LEVEL);
            const lidHeight = Math.max(20, Math.min(500, distFromSurface * 0.6));

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


        // --- KATMAN 2: ZEMİNLER ---
        const tileW = 600; 
        const tileOrder = [0, 0, 1, 0, 1]; 
        tileOrder.forEach((type, index) => {
            const img = assets.zeminler[type];
            if (img) {
                ctx.drawImage(img, index * tileW, WORLD_HEIGHT - 300, tileW, 300);
            }
        });


        // --- KATMAN 3: DİKEY ARKA PLAN (MAVİ TONLAR) ---
        
        // 1. ADIM: Zemin Rengi (DÜZELTME 1: YEŞİL YOK, SAF MAVİ VAR)
        ctx.globalCompositeOperation = 'source-over';
        
        const baseGradient = ctx.createLinearGradient(0, SEA_LEVEL, 0, WORLD_HEIGHT);
        // Üst: Parlak Okyanus Mavisi (Yeşil yok)
        baseGradient.addColorStop(0, '#0077be'); 
        // Orta: Derin Deniz Mavisi
        baseGradient.addColorStop(0.6, '#004488'); 
        // Alt: Gece Mavisi / Lacivert (Hafif morumsu koyuluk, yeşil değil)
        baseGradient.addColorStop(1, '#002244'); 
        
        ctx.fillStyle = baseGradient;
        ctx.fillRect(0, SEA_LEVEL, WORLD_WIDTH, WORLD_HEIGHT - SEA_LEVEL);


        // 2. ADIM: Asimetrik Sütunlar (DÜZELTME 2: DAHA SIK)
        ctx.globalCompositeOperation = 'soft-light'; // Işıklandırma modu

        this.columns.forEach(col => {
            if (col.x + col.w > camera.x - w && col.x < camera.x + w) {
                
                const colGradient = ctx.createLinearGradient(0, SEA_LEVEL, 0, WORLD_HEIGHT);
                
                // Işık hüzmesi rengi (Beyazımsı mavi)
                colGradient.addColorStop(0, `rgba(200, 240, 255, ${col.alpha})`);
                colGradient.addColorStop(1, 'rgba(200, 240, 255, 0)');
                
                ctx.fillStyle = colGradient;
                ctx.fillRect(col.x, SEA_LEVEL, col.w, WORLD_HEIGHT - SEA_LEVEL);
                
                // Çizgiler (Detay)
                ctx.beginPath();
                ctx.moveTo(col.x, SEA_LEVEL);
                ctx.lineTo(col.x, WORLD_HEIGHT);
                // Çizgi rengi de hafif mavi, siyah değil
                ctx.strokeStyle = `rgba(0, 50, 100, 0.15)`; 
                ctx.lineWidth = 1; // Daha ince, daha zarif
                ctx.stroke();
            }
        });
        
        ctx.globalCompositeOperation = 'source-over';


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
