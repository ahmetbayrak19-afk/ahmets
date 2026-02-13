// 🔥 SENİN SABİTLEDİĞİN SINIRLAR 🔥
export const LIMIT_LEFT = -5400; 
export const LIMIT_RIGHT = 5400;  
export const LIMIT_TOP = -700;    
export const LIMIT_BOTTOM = 400; 

export const WORLD_WIDTH = Math.abs(LIMIT_LEFT) + LIMIT_RIGHT; 
export const WORLD_HEIGHT = Math.abs(LIMIT_TOP) + LIMIT_BOTTOM;

const MARGIN = 50; 
// 🌍 YERÇEKİMİ AYARI: Havaya çıkınca aşağı çekme şiddeti (0.3 - 0.5 idealdir)
const GRAVITY = 0.35; 

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

    // 🌊 SU YÜZEYİ KONTROLÜ (0 noktası suyun üstü kabul edilir)
    const isInAir = fish.y < 0;

    // --- HAREKET MANTIĞI ---
    if (!isInAir) {
      // 🐟 SUYUN İÇİNDE: Normal Yüzme
      if (dist > 10) {
        const force = Math.min(dist * 0.05, 1.2); 
        const angle = Math.atan2(dy, dx);
        fish.vx += Math.cos(angle) * force;
        fish.vy += Math.sin(angle) * force;
      }
      // Su sürtünmesi (Yavaşlama)
      fish.vx *= 0.93; 
      fish.vy *= 0.93;
    } else {
      // 🚀 HAVADA: Zıplama Fiziği
      // Havada balığı mouse ile yukarı çekemezsin, sadece yerçekimi çalışır
      fish.vy += GRAVITY; 
      
      // Hava direnci (Suda olduğundan daha az yavaşlar)
      fish.vx *= 0.98; 
      fish.vy *= 0.99;
    }

    // Pozisyon Güncelleme
    fish.x += fish.vx;
    fish.y += fish.vy;

    // 🔥 SINIR KONTROLLERİ 🔥
    if (fish.x < LIMIT_LEFT + MARGIN) { fish.x = LIMIT_LEFT + MARGIN; fish.vx *= -0.5; }
    if (fish.x > LIMIT_RIGHT - MARGIN) { fish.x = LIMIT_RIGHT - MARGIN; fish.vx *= -0.5; }
    
    // Tavan (Havadaki en üst nokta)
    if (fish.y < LIMIT_TOP) { 
        fish.y = LIMIT_TOP; 
        fish.vy = 0; // Tavana çarpınca asılı kalmasın, hemen düşmeye başlasın
    }
    
    // Taban (Deniz Dibi)
    if (fish.y > LIMIT_BOTTOM - MARGIN) { 
        fish.y = LIMIT_BOTTOM - MARGIN; 
        fish.vy *= -0.5; 
    }

    // --- YÖN VE ROTASYON ---
    if (fish.vx > 0.5) fish.lastDirection = 1;
    if (fish.vx < -0.5) fish.lastDirection = -1;
    fish.scaleX = fish.lastDirection; 

    const speed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
    
    if (isInAir) {
        // 🔄 HAVADAYKEN: Atlayış Rotasyonu
        // Balık havada kavis çizerken burnu düştüğü yöne (aşağı) doğru döner
        let jumpAngle = Math.atan2(fish.vy, Math.abs(fish.vx)) * (180 / Math.PI);
        if (fish.lastDirection === -1) jumpAngle *= -1;
        fish.rotation += (jumpAngle - fish.rotation) * 0.2; // Havada daha hızlı döner
    } else if (speed > 1) {
        // SUDA: Normal Dönüş
        let targetRotation = (Math.atan2(fish.vy, Math.abs(fish.vx)) * 180) / Math.PI;
        if (fish.lastDirection === -1) targetRotation *= -1; 
        fish.rotation += (targetRotation - fish.rotation) * 0.1;
    } else {
        fish.rotation *= 0.9;
    }

    fish.scaleY = 1;

    // --- ANİMASYON ---
    fish.timer++;
    // Havada kuyruk sallama yavaşlar (Sadece su itişi bittiği için)
    const animSpeed = isInAir ? 12 : (speed > 10 ? 3 : 5); 
    if (fish.timer > animSpeed) {
        fish.frame++;
        fish.timer = 0;
        if (fish.state === "EAT" && fish.frame > 5) fish.state = "SWIM";
    }
  }
  }
