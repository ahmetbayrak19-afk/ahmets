// 🔥 ÖZEL SINIR AYARLARI 🔥

// SAĞ / SOL
export const LIMIT_LEFT = -10000; // Sola 3 kat daha fazla (Çok geniş)
export const LIMIT_RIGHT = 2000;  // Sağa 3 kat daha az (Hemen çarpacaksın)

// YUKARI / AŞAĞI
export const LIMIT_TOP = -2000;   // Yukarı 4 kat daha fazla (Gökyüzü)
export const LIMIT_BOTTOM = 1500; // Aşağı 2 kat daha az (Hemen zemin gelecek)

export const SEA_LEVEL = 300; 
const MARGIN = 100;

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

    // Hareket (İvme)
    if (dist > 10) {
      const force = Math.min(dist * 0.05, 1.2); 
      const angle = Math.atan2(dy, dx);
      fish.vx += Math.cos(angle) * force;
      fish.vy += Math.sin(angle) * force;
    }

    // Sürtünme
    fish.vx *= 0.93; 
    fish.vy *= 0.93;

    // Pozisyon
    fish.x += fish.vx;
    fish.y += fish.vy;

    // 🔥 YENİ SINIR KONTROLLERİ (Senin isteğine göre) 🔥
    
    // SOL SINIR (Çok uzak)
    if (fish.x < LIMIT_LEFT + MARGIN) { 
        fish.x = LIMIT_LEFT + MARGIN; 
        fish.vx *= -0.5; 
    }
    // SAĞ SINIR (Çok yakın)
    if (fish.x > LIMIT_RIGHT - MARGIN) { 
        fish.x = LIMIT_RIGHT - MARGIN; 
        fish.vx *= -0.5; 
    }
    
    // TAVAN (Gökyüzü - Çok yüksek)
    if (fish.y < LIMIT_TOP) { 
        fish.y = LIMIT_TOP; 
        fish.vy += 0.5; 
    }
    
    // TABAN (Zemin - Daha sığ)
    if (fish.y > LIMIT_BOTTOM - MARGIN) { 
        fish.y = LIMIT_BOTTOM - MARGIN; 
        fish.vy *= -0.5; 
    }

    // Yön ve Rotasyon
    if (fish.vx > 0.5) fish.lastDirection = 1;
    if (fish.vx < -0.5) fish.lastDirection = -1;

    fish.scaleX = fish.lastDirection; 

    const speed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
    
    if (speed > 1) {
        let targetRotation = (Math.atan2(fish.vy, Math.abs(fish.vx)) * 180) / Math.PI;
        if (fish.lastDirection === -1) targetRotation *= -1; 
        fish.rotation += (targetRotation - fish.rotation) * 0.1;
    } else {
        fish.rotation *= 0.9;
    }

    // Derinlik Efekti (Basit)
    fish.scaleY = 1;

    // Animasyon
    fish.timer++;
    const animSpeed = speed > 10 ? 3 : 5; 
    if (fish.timer > animSpeed) {
        fish.frame++;
        fish.timer = 0;
        if (fish.state === "EAT" && fish.frame > 5) fish.state = "SWIM";
    }
  }
  }
        
