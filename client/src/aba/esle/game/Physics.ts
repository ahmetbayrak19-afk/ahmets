// 🔥 SENİN SABİTLEDİĞİN SINIRLAR 🔥
export const LIMIT_LEFT = -5400; 
export const LIMIT_RIGHT = 5400;  
export const LIMIT_TOP = -700;    // En yüksek tavan
export const LIMIT_BOTTOM = 400;  // En derin dip

// 🌊 SU YÜZEYİ ÇİZGİSİ
// Senin mantığına göre yerçekiminin başladığı sınır
const WATER_SURFACE = -500; 

export const WORLD_WIDTH = Math.abs(LIMIT_LEFT) + LIMIT_RIGHT; 
export const WORLD_HEIGHT = Math.abs(LIMIT_TOP) + LIMIT_BOTTOM;

const MARGIN = 50; 
const GRAVITY = 0.4; // Yerçekimi şiddeti

export class PhysicsEngine {
  
  updateFish(fish: any, targetX: number, targetY: number) {
    const dx = targetX - fish.x;
    const dy = targetY - fish.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 🚀 HAVADA MI KONTROLÜ
    // Balık -500'den daha yukarıdaysa (örn: -600) havada kabul edilir.
    const isInAir = fish.y < WATER_SURFACE;

    // --- HAREKET MANTIĞI ---
    if (!isInAir) {
      // 🐟 SUYUN İÇİNDE (-500 ile 400 arası)
      if (dist > 10) {
        const force = Math.min(dist * 0.05, 1.2); 
        const angle = Math.atan2(dy, dx);
        fish.vx += Math.cos(angle) * force;
        fish.vy += Math.sin(angle) * force;
      }
      fish.vx *= 0.93; 
      fish.vy *= 0.93;
    } else {
      // 🚀 HAVADA (-500 ile -700 arası)
      // Yerçekimi devreye girer
      fish.vy += GRAVITY; 
      
      // Hava direnci
      fish.vx *= 0.98; 
      fish.vy *= 0.99;
    }

    // Pozisyon Güncelleme
    fish.x += fish.vx;
    fish.y += fish.vy;

    // 🔥 SINIR KONTROLLERİ 🔥
    if (fish.x < LIMIT_LEFT + MARGIN) { fish.x = LIMIT_LEFT + MARGIN; fish.vx *= -0.5; }
    if (fish.x > LIMIT_RIGHT - MARGIN) { fish.x = LIMIT_RIGHT - MARGIN; fish.vx *= -0.5; }
    
    // Tavan (Havadaki en üst nokta: -700)
    if (fish.y < LIMIT_TOP) { 
        fish.y = LIMIT_TOP; 
        fish.vy = 0; 
    }
    
    // Taban (Deniz Dibi: 400)
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
        // Havada burnunu düşüş yönüne çevirir
        let jumpAngle = Math.atan2(fish.vy, Math.abs(fish.vx)) * (180 / Math.PI);
        if (fish.lastDirection === -1) jumpAngle *= -1;
        fish.rotation += (jumpAngle - fish.rotation) * 0.2;
    } else if (speed > 1) {
        let targetRotation = (Math.atan2(fish.vy, Math.abs(fish.vx)) * 180) / Math.PI;
        if (fish.lastDirection === -1) targetRotation *= -1; 
        fish.rotation += (targetRotation - fish.rotation) * 0.1;
    } else {
        fish.rotation *= 0.9;
    }

    // Animasyon hızı
    fish.timer++;
    const animSpeed = isInAir ? 12 : (speed > 10 ? 3 : 5); 
    if (fish.timer > animSpeed) {
        fish.frame++;
        fish.timer = 0;
        if (fish.state === "EAT" && fish.frame > 5) fish.state = "SWIM";
    }
  }
    }
