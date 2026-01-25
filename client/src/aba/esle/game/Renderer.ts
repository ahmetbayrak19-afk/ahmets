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

        // 1. TEMİZLİK (Gök Mavisi)
        // Burası sadece resmin olmadığı en uç noktalar için güvenlik rengi.
        ctx.fillStyle = '#87CEEB'; 
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        // KAMERA SİSTEMİ
        ctx.translate(-camera.x + w / 2, -camera.y + h / 2);


        // --- KATMAN 1: GÖKYÜZÜ (BULUTLAR) ---
        // HATA DÜZELTİLDİ: Artık bunun önüne mavi perde çekmiyoruz.
        if (assets.gok) {
            // Resmi olduğu gibi çiziyoruz. Arkası şeffaf değil, resim neyse o.
            ctx.drawImage(assets.gok, 0, 0, 3010, 500); 
        }


        // --- KATMAN 1.5: SU YÜZEYİ (BİRLEŞİM YERİ) ---
        if (assets.su) {
            const distFromSurface = Math.max(0, camera.y - SEA_LEVEL);
            const lidHeight = Math.min(400, distFromSurface * 0.5);
            
            // "Su dokusu üstüne gelmesin" dedin, overlap'i azalttım.
            const overlap = 20; 
            const drawY = SEA_LEVEL - overlap; 

            if (lidHeight > 2) { 
                ctx.save();
                
                // BULUTLARI GÖRMEK İÇİN KRİTİK AYAR:
                // Opacity: 0.5 (Yarı yarıya şeffaf, arkadaki bulut görünsün)
                // Mod: source-over (Normal karışım, ekranı patlatmasın)
                ctx.globalAlpha = 0.5; 
                ctx.globalCompositeOperation = 'source-over'; 
                
                const imgW = 592; 
                const shift = this.surfaceOffset % imgW;
                const count = Math.ceil(WORLD_WIDTH / imgW) + 2; 

                for (let i = 0; i < count; i++) {
                    const drawX = (i * imgW) - shift;
                    if (drawX < WORLD_WIDTH && drawX + imgW > -500) {
                        ctx.drawImage(assets.su, drawX, drawY, imgW, lidHeight + overlap);
                    }
                }
                
                // Alt taraftaki keskin çizgiyi yumuşatma (Yine sadece alt uca)
                const blendGradient = ctx.createLinearGradient(0, drawY + lidHeight - 100, 0, drawY + lidHeight + overlap);
                blendGradient.addColorStop(0, 'rgba(0, 60, 120, 0.0)'); 
                blendGradient.addColorStop(1, 'rgba(0, 60, 120, 0.6)'); 
                
                ctx.fillStyle = blendGradient;
                ctx.fillRect(camera.x - w, drawY + lidHeight - 100, w * 3, 200);

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


        // --- KATMAN 3: DERİN SU PERDESİ (DÜZELTİLEN YER) ---
        ctx.globalCompositeOperation = 'source-over';

        // "O katmanın boyunu kısalt" dediğin yer burası!
        // Eskiden -5000'den başlatıyordum, göğü kapatıyordu.
        // ŞİMDİ: Tam SEA_LEVEL'dan (500) başlatıyorum. 
        // Böylece 0-500 arasındaki GÖKYÜZÜNE DOKUNMUYORUZ.
        const deepGradient = ctx.createLinearGradient(0, SEA_LEVEL, 0, WORLD_HEIGHT);
        
        // Başlangıcı çok şeffaf yapıyoruz ki su yüzeyindeki bulutlar net görünsün
        deepGradient.addColorStop(0, 'rgba(0, 150, 255, 0.1)'); // %10 Opacity (Neredeyse yok)
        deepGradient.addColorStop(0.3, 'rgba(0, 100, 200, 0.4)'); // Biraz derinleşince mavileşiyor
        deepGradient.addColorStop(1, 'rgba(0, 10, 50, 0.9)');    // Dip karanlık
        
        ctx.fillStyle = deepGradient;
        // Çizime tam SEA_LEVEL'dan başlıyoruz! Yukarı taşmıyor.
        ctx.fillRect(0, SEA_LEVEL, WORLD_WIDTH, WORLD_HEIGHT - SEA_LEVEL);


        // --- KATMAN 3.5: TANRISAL IŞIKLAR ---
        ctx.save();
        ctx.globalCompositeOperation = 'overlay'; 
        
        const rayGradient = ctx.createLinearGradient(0, SEA_LEVEL, 0, WORLD_HEIGHT);
        rayGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)'); 
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


        // --- KATMAN 6: YÜZEY CİLASI ---
        const surfaceGradient = ctx.createLinearGradient(0, SEA_LEVEL, 0, WORLD_HEIGHT);
        surfaceGradient.addColorStop(0, 'rgba(0, 100, 200, 0.05)'); // Çok hafif cila
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
