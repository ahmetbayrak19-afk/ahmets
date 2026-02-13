// 🔥 SENİN İSTEDİĞİN ÖZEL AYARLAR 🔥

// SOL SINIR: -2000
export const LIMIT_LEFT = -2000; 

// SAĞ SINIR: 7000
export const LIMIT_RIGHT = 7000;  

// YUKARI (TAVAN): -1600 
// (Eksi değer yukarı demektir. Sudan bayağı yükseğe zıplarsın.)
export const LIMIT_TOP = -1600;    

// AŞAĞI (TABAN): 200
// (Deniz çok sığ, hemen dibe değer.)
export const LIMIT_BOTTOM = 200; 

// Harita boyutlarını otomatik hesapla
export const WORLD_WIDTH = Math.abs(LIMIT_LEFT) + LIMIT_RIGHT; 
export const WORLD_HEIGHT = Math.abs(LIMIT_TOP) + LIMIT_BOTTOM;

const MARGIN = 50; 

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

    // Sürtünme
    fish.vx *= 0.93; 
    fish.vy *= 0.93;

    // Pozisyon Güncelleme
    fish.x += fish.vx;
    fish.y += fish.vy;

    // 🔥 SINIR KONTROLLERİ (Senin Değerlerinle) 🔥
    
    // SOL
    if (fish.x < LIMIT_LEFT + MARGIN) { 
        fish.x = LIMIT_LEFT + MARGIN; 
        fish.vx *= -0.5; 
    }
    
    // SAĞ
    if (fish.x > LIMIT_RIGHT - MARGIN) { 
        fish.x = LIMIT_RIGHT - MARGIN; 
        fish.vx *= -0.5; 
    }
    
    // YUKARI (TAVAN)
    if (fish.y < LIMIT_TOP) { 
        fish.y = LIMIT_TOP; 
        fish.vy *= -0.3; 
    }
    
    // AŞAĞI (TABAN)
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
  
