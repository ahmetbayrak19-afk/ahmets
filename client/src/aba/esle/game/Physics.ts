// Physics.ts

// 🔥 GÜNCELLENMİŞ SINIRLAR 🔥

// SOL SINIR: Eskiden -500 idi.
// Şimdi -1500 yaptık. (Böylece sola doğru epey bir alan açıldı, hemen çarpmaz)
export const LIMIT_LEFT = -1500; 

// SAĞ SINIR: 10000 (Sağa gidiş serbest)
export const LIMIT_RIGHT = 10000;  

// YUKARI (TAVAN): -300 (Su yüzeyine hafif zıplama payı)
export const LIMIT_TOP = -300;    

// AŞAĞI (TABAN): 300 (Sığ deniz, dibe çabuk değer)
export const LIMIT_BOTTOM = 300; 

// Harita boyutlarını hesapla
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

    // Pozisyon
    fish.x += fish.vx;
    fish.y += fish.vy;

    // 🔥 SINIR KONTROLLERİ 🔥
    
    // 1. SOL DUVAR (Genişletildi)
    if (fish.x < LIMIT_LEFT + MARGIN) { 
        fish.x = LIMIT_LEFT + MARGIN; 
        fish.vx *= -0.5; 
    }
    
    // 2. SAĞ DUVAR
    if (fish.x > LIMIT_RIGHT - MARGIN) { 
        fish.x = LIMIT_RIGHT - MARGIN; 
        fish.vx *= -0.5; 
    }
    
    // 3. TAVAN (YUKARI)
    if (fish.y < LIMIT_TOP) { 
        fish.y = LIMIT_TOP; 
        fish.vy *= -0.3; 
    }
    
    // 4. TABAN (AŞAĞI)
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
