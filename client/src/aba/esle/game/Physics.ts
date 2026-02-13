// Physics.ts

// 🔥 AYARLANMIŞ YENİ SINIRLAR 🔥

// SOL SINIR: -500 (Fazla sola gidemesin, hemen duvara çarpsın)
export const LIMIT_LEFT = -500; 

// SAĞ SINIR: 10000 (Sağa doğru çok uzun bir yolun var)
export const LIMIT_RIGHT = 10000;  

// YUKARI SINIR (YÜZEY): 0 (Suyun yüzeyi 0 noktasıdır. Eksiye düşerse uçar, o yüzden 0'da tutuyoruz.)
export const LIMIT_TOP = 0;    

// AŞAĞI SINIR (DİP): 2000 (Denizin dibi)
export const LIMIT_BOTTOM = 2000; 

// Harita boyutlarını hesapla
export const WORLD_WIDTH = Math.abs(LIMIT_LEFT) + LIMIT_RIGHT; 
export const WORLD_HEIGHT = Math.abs(LIMIT_TOP) + LIMIT_BOTTOM;

const MARGIN = 50; // Duvara yumuşak çarpma payı

export interface FishState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  frame: number;
  timer: number;
  state: "SWIM" | "TURN_LEFT" | "EAT";
  lastDirection: 1 | -1;
}

export class PhysicsEngine {
  
  updateFish(fish: FishState, targetX: number, targetY: number) {
    const dx = targetX - fish.x;
    const dy = targetY - fish.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // --- HAREKET ---
    if (dist > 10) {
      const force = Math.min(dist * 0.05, 1.2); 
      const angle = Math.atan2(dy, dx);
      fish.vx += Math.cos(angle) * force;
      fish.vy += Math.sin(angle) * force;
    }

    // Sürtünme (Yavaşlama)
    fish.vx *= 0.93; 
    fish.vy *= 0.93;

    // Pozisyonu uygula
    fish.x += fish.vx;
    fish.y += fish.vy;

    // 🔥 SINIR KONTROLLERİ (DUVARLAR) 🔥
    
    // 1. SOL DUVAR (Daraltıldı)
    if (fish.x < LIMIT_LEFT + MARGIN) { 
        fish.x = LIMIT_LEFT + MARGIN; 
        fish.vx *= -0.5; // Çarpınca geri seksin
    }
    
    // 2. SAĞ DUVAR (Genişletildi)
    if (fish.x > LIMIT_RIGHT - MARGIN) { 
        fish.x = LIMIT_RIGHT - MARGIN; 
        fish.vx *= -0.5; 
    }
    
    // 3. TAVAN (SU YÜZEYİ - ÖNEMLİ!)
    // Balık Y < 0 olursa (eksiye düşerse) sudan çıkmış olur.
    // Bunu engelliyoruz.
    if (fish.y < LIMIT_TOP) { 
        fish.y = LIMIT_TOP; // 0 noktasına sabitle
        fish.vy *= -0.3;    // Tavana çarpınca hafif aşağı seksin
    }
    
    // 4. TABAN (DENİZ DİBİ)
    if (fish.y > LIMIT_BOTTOM - MARGIN) { 
        fish.y = LIMIT_BOTTOM - MARGIN; 
        fish.vy *= -0.5; 
    }

    // --- YÖN VE ANİMASYON ---
    if (fish.vx > 0.5) fish.lastDirection = 1;
    if (fish.vx < -0.5) fish.lastDirection = -1;

    fish.scaleX = fish.lastDirection; 

    // Dönüş açısı hesaplama (Burnunu gittiği yere çevir)
    const speed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
    
    if (speed > 1) {
        let targetRotation = (Math.atan2(fish.vy, Math.abs(fish.vx)) * 180) / Math.PI;
        if (fish.lastDirection === -1) targetRotation *= -1; 
        fish.rotation += (targetRotation - fish.rotation) * 0.1;
    } else {
        fish.rotation *= 0.9;
    }

    fish.scaleY = 1;

    // Kuyruk sallama animasyonu
    fish.timer++;
    const animSpeed = speed > 10 ? 3 : 5; 
    if (fish.timer > animSpeed) {
        fish.frame++;
        fish.timer = 0;
        if (fish.state === "EAT" && fish.frame > 5) fish.state = "SWIM";
    }
  }
}
