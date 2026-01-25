import { AssetLibrary } from './Assets';
import { FishState, WORLD_WIDTH, WORLD_HEIGHT, SEA_LEVEL } from './Physics';

export class GameRenderer {
    private ctx: CanvasRenderingContext2D;
    private width = 0;
    private height = 0;
    
    // Arka plan kayaları (Sabit)
    private bgRocks: { x: number; y: number; scale: number; rotation: number }[] = [];

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d', { alpha: false })!;
        
        // Rastgele 15 kaya (Zemin arkası için)
        for(let i=0; i<15; i++) {
            this.bgRocks.push({
                x: Math.random() * WORLD_WIDTH, 
                y: WORLD_HEIGHT - 150 - Math.random() * 300, 
                scale: 0.5 + Math.random() * 0.8, 
                rotation: (Math.random() - 0.5) * 0.5 
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


        // --- KATMAN 2: ARKA PLAN KAYALARI ---
        if (assets.kaya) {
            ctx.save();
            this.bgRocks.forEach(rock => {
                if (Math.abs(rock.x - camera.x) < w + 500) {
                    ctx.save();
                    ctx.translate(rock.x, rock.y);
                    ctx.rotate(rock.rotation);
                    ctx.scale(rock.scale, rock.scale);
                    ctx.globalAlpha = 0.8; 
                    ctx.drawImage(assets.kaya!, -100, -100, 200, 200);
                    ctx.restore();
                }
            });
            ctx.restore();
        }


        // --- KATMAN 3: ZEMİNLER (EN ALT) ---
        const tileW = 600; 
        const tileOrder = [0, 0, 1, 0, 1]; 
        
        tileOrder.forEach((type, index) => {
            const img = assets.zeminler[type];
            if (img) {
                ctx.drawImage(img, index * tileW, WORLD_HEIGHT - 300, tileW, 300);
            }
        });


        // --- KATMAN 4: DERİN SU PERDESİ (MAVİ 1) ---
        // Balığın altında kalan her şeyi karartır.
        ctx.fillStyle = 'rgba(0, 60, 120, 0.4)'; 
        ctx.fillRect(0, SEA_LEVEL, WORLD_WIDTH, WORLD_HEIGHT - SEA_LEVEL);


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


        // --- KATMAN 6: OTLAR (ÖN PLAN) ---
        // İşte sihir burada: Balık çizildi, ŞİMDİ otları üstüne çiziyoruz.
        // Balık otun arkasında kalacak.
        
        // Hangi zeminde hangi ot var? (Null = Boş, 1 = ot1, 2 = ot2)
        // Senin isteğin: 2 tane ot1, 1 tane ot2.
        // Sıralama: [ot1,  Boş,  ot2,  ot1,  Boş]
        const grassMap = ['ot1', null, 'ot2', 'ot1', null];

        grassMap.forEach((grassType, index) => {
            if (!grassType) return; // Boşsa geç

            const grassImg = grassType === 'ot1' ? assets.otlar.ot1 : assets.otlar.ot2;
            
            if (grassImg) {
                // Konum: Zeminin olduğu yer (index * 600)
                // Yükseklik: Zemin ile aynı hizada (WORLD_HEIGHT - 300)
                // ot1 boyutu zeminle aynı demiştin, o yüzden direkt oturtuyorum.
                
                ctx.drawImage(grassImg, index * tileW, WORLD_HEIGHT - 300, 600, 300);
            }
        });


        // --- KATMAN 7: YÜZEY SU PERDESİ (MAVİ 2 - CİLA) ---
        // Bu perde OTLARIN DA üstüne gelir, böylece otlar suyun dışında gibi parlamaz.
        ctx.fillStyle = 'rgba(0, 40, 100, 0.2)'; 
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
