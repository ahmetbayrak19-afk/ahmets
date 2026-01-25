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

        // Her karede suyun kayma miktarını artır (Hız: 1.5 birim)
        this.surfaceOffset += 1.5;

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


        // --- KATMAN 1.5: SU KAPAĞI (AKAN + ŞEFFAF) ---
        if (assets.su) {
            const distFromSurface = Math.max(0, camera.y - SEA_LEVEL);
            // Yükseklik yine perspektife göre değişiyor
            const lidHeight = Math.min(600, distFromSurface * 0.5);

            if (lidHeight > 1) { 
                ctx.save();
                
                // --- ŞEFFAFLIK AYARI ---
                // "Hafif gökyüzü görünsün ama az" dediğin yer burası.
                // 1.0 = Beton gibi (arkası görünmez)
                // 0.0 = Görünmez
                // 0.55 = Tam kararında (Su net, ama arkadaki bulut hayal meyal belli)
                ctx.globalAlpha = 0.55; 
                
                // Karıştırma modu: Normal (source-over) yaparak gökyüzüyle doğal karışmasını sağladım.
                // Overlay yaparsak çok parlıyordu, bu daha doğal.
                ctx.globalCompositeOperation = 'source-over'; 
                
                const imgW = 592; 
                // Kayma miktarı (Modülüs alıyoruz ki sayı sonsuza gitmesin)
                const shift = this.surfaceOffset % imgW;
                
                // Ekranı doldurmak için kaç tane lazım? (+2 diyerek kenarlardaki boşluk riskini alıyoruz)
                const count = Math.ceil(WORLD_WIDTH / imgW) + 2; 

                for (let i = 0; i < count; i++) {
                    // X Hesabı: (Sıra * Genişlik) - (Kayma Miktarı)
                    // Böylece hepsi sola doğru kayar.
                    const drawX = (i * imgW) - shift;
                    
                    // Sadece ekranda görünenleri çiz (Performans)
                    if (drawX < WORLD_WIDTH && drawX + imgW > -500) {
                        ctx.drawImage(assets.su, drawX, SEA_LEVEL, imgW, lidHeight);
                    }
                }
                
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
