// 🔥 GÜNCELLENMİŞ SINIRLAR 🔥
export const LIMIT_LEFT = -5400; 
export const LIMIT_RIGHT = 5400;  
export const LIMIT_TOP = -900;    // Dünya tavanı yükseltildi
export const LIMIT_BOTTOM = 400;  

// 🎯 YENİ ZIPLAMA EŞİĞİ
// Balık bu noktayı geçince (Y < -750) yerçekimi başlar.
const WATER_SURFACE = -630; 

export const WORLD_WIDTH = Math.abs(LIMIT_LEFT) + LIMIT_RIGHT; 
export const WORLD_HEIGHT = Math.abs(LIMIT_TOP) + LIMIT_BOTTOM;

const MARGIN = 50; 
const GRAVITY = 0.5; // Zıplama alanı daraldığı için yerçekimini biraz hissettirelim

export class PhysicsEngine {
  
  updateFish(fish: any, targetX: number, targetY: number) {
    const dx = targetX - fish.x;
    const dy = targetY - fish.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 🚀 HAVA KONTROLÜ
    const isInAir = fish.y < WATER_SURFACE;

    // --- HAREKET VE FİZİK ---
    if (!isInAir) {
      // 🐟 SU ALTI (Y >= -750)
      if (dist > 10) {
        const force = Math.min(dist * 0.05, 1.2); 
        const angle = Math.atan2(dy, dx);
        fish.vx += Math.cos(angle) * force;
        fish.vy += Math.sin(angle) * force;
      }
      fish.vx *= 0.93; 
      fish.vy *= 0.93;
    } else {
      // 🚀 HAVA (Y < -750)
      fish.vy += GRAVITY; 
      
      // Havada kontrol azalır, sürtünme düşer
      fish.vx *= 0.98; 
      fish.vy *= 0.99;
    }

    fish.x += fish.vx;
    fish.y += fish.vy;

    // --- SINIR KONTROLLERİ ---
    if (fish.x < LIMIT_LEFT + MARGIN) { fish.x = LIMIT_LEFT + MARGIN; fish.vx *= -0.5; }
    if (fish.x > LIMIT_RIGHT - MARGIN) { fish.x = LIMIT_RIGHT - MARGIN; fish.vx *= -0.5; }
    
    // Tavan kontrolü (-900)
    if (fish.y < LIMIT_TOP) { 
        fish.y = LIMIT_TOP; 
        fish.vy = 0; 
    }
    
    // Taban kontrolü (400)
    if (fish.y > LIMIT_BOTTOM - MARGIN) { 
        fish.y = LIMIT_BOTTOM - MARGIN; 
        fish.vy *= -0.5; 
    }

    // --- ROTASYON VE ANİMASYON ---
    if (fish.vx > 0.5) fish.lastDirection = 1;
    if (fish.vx < -0.5) fish.lastDirection = -1;
    fish.scaleX = fish.lastDirection; 

    const speed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
    
    if (isInAir) {
        // Havada burnunu aşağı büken o estetik atlayış
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

    fish.timer++;
    const animSpeed = isInAir ? 12 : (speed > 10 ? 3 : 5); 
    if (fish.timer > animSpeed) {
        fish.frame++;
        fish.timer = 0;
        if (fish.state === "EAT" && fish.frame > 5) fish.state = "SWIM";
    }
  }
               }
