export const WORLD_WIDTH = 5000;   // Dünyayı biraz makul boyuta çektim (Çok büyük olunca kayboluyor)
export const WORLD_HEIGHT = 2000; 

// Sınırlar
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
    // 1. HEDEFİ HESAPLA (Mouse/Parmak Neredeyse Oraya Git)
    const dx = targetX - fish.x;
    const dy = targetY - fish.y;
    
    // Mesafeyi bul
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Eğer çok yakınsa dur (Titremeyi önler)
    if (dist > 10) {
        // Hızlanma (Acceleration) - Hungry Shark gibi ivmeli
        const speed = Math.min(dist * 0.05, 15); // Max hız 15
        const angle = Math.atan2(dy, dx);
        
        fish.vx += Math.cos(angle) * 0.8; // İvme gücü
        fish.vy += Math.sin(angle) * 0.8;
    }

    // Sürtünme (Su direnci)
    fish.vx *= 0.92;
    fish.vy *= 0.92;

    // Pozisyonu Güncelle
    fish.x += fish.vx;
    fish.y += fish.vy;

    // 2. DÜNYA SINIRLARI (Duvara çarpınca sekme)
    if (fish.x < MARGIN) { fish.x = MARGIN; fish.vx *= -0.5; }
    if (fish.x > WORLD_WIDTH - MARGIN) { fish.x = WORLD_WIDTH - MARGIN; fish.vx *= -0.5; }
    if (fish.y < MARGIN) { fish.y = MARGIN; fish.vy *= -0.5; }
    if (fish.y > WORLD_HEIGHT - MARGIN) { fish.y = WORLD_HEIGHT - MARGIN; fish.vy *= -0.5; }

    // 3. YÖN VE ROTASYON (Hungry Shark Stili)
    // Sağa mı sola mı bakıyor?
    if (fish.vx > 0.5) fish.lastDirection = 1;
    if (fish.vx < -0.5) fish.lastDirection = -1;

    fish.scaleX = fish.lastDirection; // Aynalama

    // Balığın burnunu gittiği yere çevir (Rotasyon)
    // Ama sadece yüzerken, dururken değil
    const speed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
    if (speed > 1) {
        let targetRotation = (Math.atan2(fish.vy, Math.abs(fish.vx)) * 180) / Math.PI;
        
        // Dönüşü yumuşat
        fish.rotation += (targetRotation - fish.rotation) * 0.1;
    } else {
        // Durunca düzelsin
        fish.rotation *= 0.9;
    }
    
    // Animasyon Frame İlerletme
    fish.timer++;
    if (fish.timer > 5) { // Animasyon hızı
        fish.frame++;
        fish.timer = 0;
    }
  }
}
