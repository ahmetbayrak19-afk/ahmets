// 🔥 AYARLANMIŞ SINIRLAR 🔥
export const LIMIT_LEFT = -5400; 
export const LIMIT_RIGHT = 5400;  

// Sıçrama payı için tavanı -1100 yaptım (Eskisi -900 idi, kafa çarpıyordu)
export const LIMIT_TOP = -1100;    
export const LIMIT_BOTTOM = 400;  

// 🌊 SU YÜZEYİ EŞİĞİ
const WATER_SURFACE = -670; 

export const WORLD_WIDTH = Math.abs(LIMIT_LEFT) + LIMIT_RIGHT; 
export const WORLD_HEIGHT = Math.abs(LIMIT_TOP) + LIMIT_BOTTOM;

const MARGIN = 50; 

// 🚀 SIÇRAMA AYARI: Gravity 0.5'ten 0.3'e çekildi (Daha yüksek zıplar)
const GRAVITY = 0.3; 

// --- KABARCIK SİSTEMİ TİPİ ---
export interface Bubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;   // 1.0 -> 0.0 (Şeffaflık)
  size: number;
  color: string;
}

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
  // Aktif baloncuk listesi
  public particles: Bubble[] = [];
  private lastY: number = 0; 

  // --- EFEKT OLUŞTURUCU ---
  private createSplash(x: number, y: number, isEntry: boolean) {
    const count = isEntry ? 25 : 15; // Girişte daha çok baloncuk
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 40, // Balığın genişliğine yay
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: isEntry ? (Math.random() * -4) : (Math.random() * -8), 
        life: 1.0,
        size: Math.random() * 6 + 2,
        color: isEntry ? "rgba(200, 230, 255, " : "rgba(255, 255, 255, " 
      });
    }
  }

  updateFish(fish: FishState, targetX: number, targetY: number) {
    const dx = targetX - fish.x;
    const dy = targetY - fish.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 🚀 HAVADA MI KONTROLÜ
    const isInAir = fish.y < WATER_SURFACE;

    // 🔥 SIÇRAMA VE DALIŞ TESPİTİ
    if (this.lastY >= WATER_SURFACE && fish.y < WATER_SURFACE) {
      this.createSplash(fish.x, WATER_SURFACE, false); // Sudan çıkış
    } else if (this.lastY < WATER_SURFACE && fish.y >= WATER_SURFACE) {
      this.createSplash(fish.x, WATER_SURFACE, true);  // Suya giriş
    }
    this.lastY = fish.y;

    // --- HAREKET ---
    if (!isInAir) {
      // 🐟 SU ALTI: Normal kontrol
      if (dist > 10) {
        const force = Math.min(dist * 0.05, 1.2); 
        const angle = Math.atan2(dy, dx);
        fish.vx += Math.cos(angle) * force;
        fish.vy += Math.sin(angle) * force;
      }
      fish.vx *= 0.93; 
      fish.vy *= 0.93;
    } else {
      // 🚀 HAVA: Yerçekimi devrede
      fish.vy += GRAVITY; 
      fish.vx *= 0.98; // Havada hızını daha iyi korur
      fish.vy *= 0.99;
    }

    fish.x += fish.vx;
    fish.y += fish.vy;

    // --- SINIRLAR ---
    if (fish.x < LIMIT_LEFT + MARGIN) { fish.x = LIMIT_LEFT + MARGIN; fish.vx *= -0.5; }
    if (fish.x > LIMIT_RIGHT - MARGIN) { fish.x = LIMIT_RIGHT - MARGIN; fish.vx *= -0.5; }
    if (fish.y < LIMIT_TOP) { fish.y = LIMIT_TOP; fish.vy = 0; }
    if (fish.y > LIMIT_BOTTOM - MARGIN) { fish.y = LIMIT_BOTTOM - MARGIN; fish.vy *= -0.5; }

    // --- YÖN VE ROTASYON ---
    if (fish.vx > 0.5) fish.lastDirection = 1;
    if (fish.vx < -0.5) fish.lastDirection = -1;
    fish.scaleX = fish.lastDirection; 

    const speed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
    
    if (isInAir) {
        // Havada burnunu aşağı büker
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

    // Animasyon
    fish.timer++;
    const animSpeed = isInAir ? 12 : (speed > 10 ? 3 : 5); 
    if (fish.timer > animSpeed) {
        fish.frame++;
        fish.timer = 0;
        if (fish.state === "EAT" && fish.frame > 5) fish.state = "SWIM";
    }

    // 🔥 KABARCIKLARI GÜNCELLE
    this.updateParticles();
  }

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.025; // Yok olma hızı
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
  }
          
