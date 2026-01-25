import { AssetLibrary } from './Assets';
import { FishState, WORLD_WIDTH, WORLD_HEIGHT, SEA_LEVEL } from './Physics';

export class GameRenderer {
    private ctx: CanvasRenderingContext2D;
    private width = 0;
    private height = 0;
    private surfaceOffset = 0; // Su yüzeyi akışı için

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
        
        this.surfaceOffset += 0.5; // Su dokusu yavaşça aksın

        // 1. TEMİZLİK (Siyah Arka Plan)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        // KAMERA SİSTEMİ (Dünya Koordinatları)
        ctx.translate(-camera.x + w / 2, -camera.y + h / 2);


        // --- KATMAN 1: GÖKYÜZÜ (EN ARKA) ---
        // Deniz seviyesinin ÜSTÜNDE görünür
        if (assets.gece) {
            const skyParallax = camera.x * 0.2; // Hafif hareket etsin
            const pat = ctx.createPattern(assets.gece, 'repeat');
            if (pat) {
                ctx.save();
                ctx.fillStyle = pat;
                ctx.translate(skyParallax, 0); 
                // Sadece SEA_LEVEL'in üstünü boya (Yıldızlar)
                ctx.fillRect(-skyParallax - 1000, SEA_LEVEL - 2000, WORLD_WIDTH + 2000, 2000);
                ctx.restore();
            }
        }


        // --- KATMAN 2: ZEMİNLER (EN ALT) ---
        const tileW = 600; 
        const tileOrder = [0, 0, 1, 0, 1]; // Anazemin, Anazemin, Zemin...
        
        tileOrder.forEach((type, index) => {
            const img = assets.zeminler[type];
            if (img) {
                ctx.drawImage(img, index * tileW, WORLD_HEIGHT - 300, tileW, 300);
            }
        });


        // --- KATMAN 3: DERİN SU PERDESİ (MAVİ 1 - %30) ---
        // Bu katman sadece ZEMİNİ ve ARKAYI karartır, balık bunun üstüne gelecek.
        ctx.fillStyle = 'rgba(0, 60, 120, 0.3)'; 
        ctx.fillRect(0, SEA_LEVEL, WORLD_WIDTH, WORLD_HEIGHT - SEA_LEVEL);


        // --- KATMAN 4: BALIK (ORTADA) ---
        // Şu an balık "Mavi 1"in üstünde, yani zeminden daha net ve parlak.
        ctx.save();
        ctx.translate(fish.x, fish.y);
        ctx.rotate((fish.rotation * Math.PI) / 180);
        ctx.scale(fish.scaleX, fish.scaleY);

        let img = assets.swim[0]; 
        if (fish.state === 'TURN_LEFT') img = assets.turnLeft[fish.frame % assets.turnLeft.length];
        else if (fish.state === 'EAT') img = assets.eat[fish.frame % assets.eat.length];
        else img = assets.swim[fish.frame % assets.swim.length];

        if (img) {
            // Hafif bir gölge ekleyelim ki derinlik belli olsun
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 20;
            ctx.drawImage(img, -80, -60, 160, 120);
            ctx.shadowBlur = 0;
        }
        ctx.restore();


        // --- KATMAN 5: YATIK KAPAK (SU DOKUSU) ---
        // Tam deniz seviyesinde, preslenmiş şeffaf su yüzeyi
        if (assets.su) { // Assets.ts'de 'su' (su_doku) olduğunu varsayıyoruz
            ctx.save();
            ctx.translate(0, SEA_LEVEL); // Tam su sınırına git
            ctx.scale(1, 0.25); // YATIR (Squash) -> %25 yüksekliğe ez
            
            ctx.globalAlpha = 0.4; // Şeffaflık
            ctx.globalCompositeOperation = 'overlay'; // Parlama efekti (suyun ışıltısı)
            
            const pat = ctx.createPattern(assets.su, 'repeat');
            if (pat) {
                ctx.fillStyle = pat;
                ctx.translate(-this.surfaceOffset, 0); // Akış efekti
                // Uzun bir şerit çiz
                ctx.fillRect(camera.x - w, -200, WORLD_WIDTH + w * 2, 600);
            }
            ctx.restore();
        }


        // --- KATMAN 6: YÜZEY SU PERDESİ (MAVİ 2 - %20) ---
        // Bu cila katmanı. Balığın ve Kapağın üstüne gelir.
        // Balık toplamda %50 (30+20) mavileşir ama zeminden daha önde durur.
        ctx.fillStyle = 'rgba(0, 40, 100, 0.2)'; 
        ctx.fillRect(0, SEA_LEVEL, WORLD_WIDTH, WORLD_HEIGHT - SEA_LEVEL);


        // --- SÜSLER VE SINIRLAR ---
        
        // Su Sınır Çizgisi (İnce Beyaz)
        ctx.beginPath();
        ctx.moveTo(0, SEA_LEVEL);
        ctx.lineTo(WORLD_WIDTH, SEA_LEVEL);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Sağ/Sol Siyah Duvarlar (Taşan kısımları kapatmak için)
        ctx.restore(); // Kamera modundan çık
        
        // Ekranın solunu ve sağını siyahla kapat (Dünya dışı)
        // Kameranın nerede olduğuna göre hesaplayıp siyah kutu çiziyoruz
        // Ama en kolayı, Physics motoru zaten balığı sınırladığı için,
        // Görsel olarak sadece dünyanın bittiği yere siyahlık çizmek.
        
        ctx.save();
        ctx.translate(-camera.x + w / 2, -camera.y + h / 2);
        ctx.fillStyle = '#000';
        ctx.fillRect(-2000, -2000, 2000, WORLD_HEIGHT + 4000); // Sol Duvar
        ctx.fillRect(WORLD_WIDTH, -2000, 2000, WORLD_HEIGHT + 4000); // Sağ Duvar
        ctx.restore();
    }
}
