import { AssetLibrary } from './Assets';
import { FishState, WORLD_WIDTH, WORLD_HEIGHT, SEA_LEVEL } from './Physics';

export class GameRenderer {
    private ctx: CanvasRenderingContext2D;
    private width = 0;
    private height = 0;
    
    // Su akışını kontrol etmek için sayaç
    private surfaceOffset = 0; 

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

        this.surfaceOffset += 1.0; // Akış hızı biraz daha sakin

        // 1. TEMİZLİK
        ctx.fillStyle = '#87CEEB'; 
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        // KAMERA SİSTEMİ
        ctx.translate(-camera.x + w / 2, -camera.y + h / 2);


        // --- KATMAN 1: GÖKYÜZÜ ---
        if (assets.gok) {
            ctx.drawImage(assets.gok, 0, 0, 3010, 500); 
        }


        // --- KATMAN 1.5: SU YÜZEYİ (IŞIK HÜZMESİ VERSİYONU) ---
        if (assets.su) {
            const distFromSurface = Math.max(0, camera.y - SEA_LEVEL);
            
            // Yüksekliği biraz daha kısıtladım (Max 400). Çok uzamasın.
            const lidHeight = Math.min(400, distFromSurface * 0.5);

            if (lidHeight > 2) { 
                ctx.save();
                
                // CRITICAL 1: SCREEN MODU (Işık gibi davranır, parlar)
                ctx.globalCompositeOperation = 'screen'; 
                ctx.globalAlpha = 0.6; 
                
                const imgW = 592; 
                const shift = this.surfaceOffset % imgW;
                const count = Math.ceil(WORLD_WIDTH / imgW) + 2; 

                // Önce resimleri çiziyoruz (Yan yana ve ezilmiş olarak)
                for (let i = 0; i < count; i++) {
                    const drawX = (i * imgW) - shift;
                    if (drawX < WORLD_WIDTH && drawX + imgW > -500) {
                        ctx.drawImage(assets.su, drawX, SEA_LEVEL, imgW, lidHeight);
                    }
                }
                
                // CRITICAL 2: FADE OUT (ALT TARAFI SİLME)
                // Resmin üzerine, "şeffaftan -> koyu maviye" giden bir gradyan çiziyoruz.
                // Bu sayede resmin alt kenarı yumuşakça kayboluyor.
                ctx.globalCompositeOperation = 'destination-in'; // Sadece kesişen yerleri tut
                
                const fadeGradient = ctx.createLinearGradient(0, SEA_LEVEL, 0, SEA_LEVEL + lidHeight);
                fadeGradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)'); // Üst taraf TAM GÖRÜNÜR
                fadeGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.5)'); // Orta YARI ŞEFFAF
                fadeGradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)'); // Alt taraf GÖRÜNMEZ (Silinir)
                
                ctx.fillStyle = fadeGradient;
                // Maskeyi tüm su yüzeyi alanına uyguluyoruz
                ctx.fillRect(camera.x - w, SEA_LEVEL, w * 3, lidHeight);

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


        // --- KATMAN 3: DERİN SU PERDESİ (GRADYANLI) ---
        // Normal moda geri dön (Yukarıda screen yapmıştık, karışmasın)
        ctx.globalCompositeOperation = 'source-over';

        const deepGradient = ctx.createLinearGradient(0, SEA_LEVEL, 0, WORLD_HEIGHT);
        deepGradient.addColorStop(0, 'rgba(0, 150, 255, 0.3)'); 
        deepGradient.addColorStop(1, 'rgba(0, 10, 50, 0.6)');   
        
        ctx.fillStyle = deepGradient;
        ctx.fillRect(0, SEA_LEVEL, WORLD_WIDTH, WORLD_HEIGHT - SEA_LEVEL);


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


        // --- KATMAN 6: YÜZEY CİLASI ---
        const surfaceGradient = ctx.createLinearGradient(0, SEA_LEVEL, 0, WORLD_HEIGHT);
        surfaceGradient.addColorStop(0, 'rgba(0, 100, 200, 0.1)');
        surfaceGradient.addColorStop(1, 'rgba(0, 50, 100, 0.3)'); 
        ctx.fillStyle = surfaceGradient;
        ctx.fillRect(0, SEA_LEVEL, WORLD_WIDTH, WORLD_HEIGHT - SEA_LEVEL);


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
