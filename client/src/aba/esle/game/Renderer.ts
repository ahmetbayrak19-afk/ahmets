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

        // 1. TEMİZLİK (Siyah Arka Plan)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        // KAMERA SİSTEMİ
        ctx.translate(-camera.x + w / 2, -camera.y + h / 2);


        // --- KATMAN 1: GÖKYÜZÜ (YAN YANA MURAL) ---
        // Deniz seviyesinden (SEA_LEVEL) YUKARIYA çiziyoruz.
        // Dünyamız 3000px genişliğinde. 
        // 0-1500 arasına gok1, 1500-3000 arasına gok2 koyuyoruz.
        
        const skyHeight = 1500; // Gökyüzü ne kadar yukarı uzasın?
        const skyY = SEA_LEVEL - skyHeight; // Çizim başlangıç Y noktası
        
        // 1. Parça: SOL GÖK (gok1)
        if (assets.gok1) {
            // Parallax efektini kapattım ki "yan yana" tam otursun, kaymasın.
            ctx.drawImage(assets.gok1, 0, skyY, WORLD_WIDTH / 2, skyHeight); 
        }
        
        // 2. Parça: SAĞ GÖK (gok2)
        if (assets.gok2) {
             ctx.drawImage(assets.gok2, WORLD_WIDTH / 2, skyY, WORLD_WIDTH / 2, skyHeight);
        }


        // --- KATMAN 2: ZEMİNLER (EN ALT) ---
        const tileW = 600; 
        const tileOrder = [0, 0, 1, 0, 1]; 
        
        tileOrder.forEach((type, index) => {
            const img = assets.zeminler[type];
            if (img) {
                ctx.drawImage(img, index * tileW, WORLD_HEIGHT - 300, tileW, 300);
            }
        });


        // --- KATMAN 3: DERİN SU PERDESİ (MAVİ 1) ---
        // Gökyüzünden hemen sonra (SEA_LEVEL'den itibaren) başlar.
        ctx.fillStyle = 'rgba(0, 60, 120, 0.4)'; // Biraz daha belirgin deniz mavisi
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


        // --- (SU DOKUSU KALDIRILDI) --- 
        // Kullanıcı isteği üzerine su_doku katmanı iptal.


        // --- KATMAN 5: YÜZEY SU PERDESİ (MAVİ 2 - CİLA) ---
        ctx.fillStyle = 'rgba(0, 40, 100, 0.2)'; 
        ctx.fillRect(0, SEA_LEVEL, WORLD_WIDTH, WORLD_HEIGHT - SEA_LEVEL);


        // --- SÜSLER ---
        // Su ile Gökyüzü arasına net bir çizgi
        ctx.beginPath();
        ctx.moveTo(0, SEA_LEVEL);
        ctx.lineTo(WORLD_WIDTH, SEA_LEVEL);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Duvarlar
        ctx.restore(); 
        ctx.save();
        ctx.translate(-camera.x + w / 2, -camera.y + h / 2);
        ctx.fillStyle = '#000';
        ctx.fillRect(-2000, -2000, 2000, WORLD_HEIGHT + 4000); 
        ctx.fillRect(WORLD_WIDTH, -2000, 2000, WORLD_HEIGHT + 4000); 
        ctx.restore();
    }
}
