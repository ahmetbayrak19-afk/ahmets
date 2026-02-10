// Physics.ts

// DÜNYA AYARLARI (BÜYÜTTÜM)
export const WORLD_WIDTH = 12000;   // ESKİ: 3000
export const WORLD_HEIGHT = 4500;   // ESKİ: 1500

// Deniz seviyesi (gökyüzü/deniz yüzeyi çizgin)
export const SEA_LEVEL = 500;

// Balığın “zemin üstü” sınırları
const FISH_HALF_W = 80;
const FISH_HALF_H = 60;

// Balık SU ÜSTÜNE ÇIKABİLSİN diye tavan (SEA_LEVEL üstüne daha çok çık)
const AIR_TOP = SEA_LEVEL - 1100;   // ESKİ -200 gibi kısaydı, büyüttüm

// Zeminin altına çok gömülmesin diye taban (deniz kumu bölgesi)
const FLOOR_Y = WORLD_HEIGHT - 120;

// Hava hareketinde de biraz kontrol olsun (tam düşmesin)
const AIR_STEER = 0.00035; // havada target'a çok hafif yönelme
const WATER_STEER = 0.0008;

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
    const inWater = fish.y > SEA_LEVEL;

    // 1) HAREKET
    const dx = targetX - fish.x;
    const dy = targetY - fish.y;

    if (inWater) {
      fish.vx += dx * WATER_STEER;
      fish.vy += dy * WATER_STEER;

      fish.vx *= 0.95;
      fish.vy *= 0.95;

      // hız limiti
      const speed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
      const maxSpeed = 12;
      if (speed > maxSpeed) {
        const r = maxSpeed / speed;
        fish.vx *= r;
        fish.vy *= r;
      }
    } else {
      // SU ÜSTÜ (hava): yerçekimi + çok hafif yönlenme
      fish.vx += dx * AIR_STEER;
      fish.vy += 0.55; // gravity
      fish.vx *= 0.985;
      fish.vy *= 0.99;

      // havada da aşırı hızlanmasın
      const speed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
      const maxSpeed = 16;
      if (speed > maxSpeed) {
        const r = maxSpeed / speed;
        fish.vx *= r;
        fish.vy *= r;
      }
    }

    fish.x += fish.vx;
    fish.y += fish.vy;

    // 2) SINIRLAR (world devasa, ama yine de kenarları koru)
    if (fish.x < FISH_HALF_W) {
      fish.x = FISH_HALF_W;
      fish.vx = 0;
    }
    if (fish.x > WORLD_WIDTH - FISH_HALF_W) {
      fish.x = WORLD_WIDTH - FISH_HALF_W;
      fish.vx = 0;
    }

    // taban (deniz kumu altına çok inmesin)
    if (fish.y > FLOOR_Y) {
      fish.y = FLOOR_Y;
      fish.vy = 0;
    }

    // tavan (su üstüne zıplama payı)
    if (fish.y < AIR_TOP) {
      fish.y = AIR_TOP;
      fish.vy = 0.5; // yukarıda yapışmasın, yumuşak geri it
    }

    // 3) ANİMASYON
    fish.timer++;
    const animSpeed = 4;

    const currentDir =
      fish.vx > 0.1 ? 1 : fish.vx < -0.1 ? -1 : fish.lastDirection;

    if (fish.state === "SWIM") {
      if (fish.lastDirection === 1 && currentDir === -1) {
        fish.state = "TURN_LEFT";
        fish.frame = 0;
      } else if (fish.lastDirection === -1 && currentDir === 1) {
        fish.lastDirection = 1;
      } else {
        fish.lastDirection = currentDir;
      }
    }

    if (fish.timer > animSpeed) {
      fish.frame++;
      fish.timer = 0;

      if (fish.state === "TURN_LEFT" && fish.frame >= 6) {
        fish.state = "SWIM";
        fish.lastDirection = -1;
      }
      if (fish.state === "EAT" && fish.frame >= 6) {
        fish.state = "SWIM";
      }
    }

    // rotasyon / flip
    if (fish.state === "TURN_LEFT") {
      fish.rotation = 0;
      fish.scaleX = 1;
    } else {
      const angle = Math.atan2(fish.vy, Math.abs(fish.vx));
      const targetRot = (angle * 180) / Math.PI * fish.lastDirection;
      fish.rotation += (targetRot - fish.rotation) * 0.1;
      fish.scaleX = fish.lastDirection;
    }

    // derinlik ölçeği (çok hafif)
    const depthRatio = Math.max(0, (fish.y - SEA_LEVEL) / (WORLD_HEIGHT - SEA_LEVEL));
    fish.scaleY = 1 - depthRatio * 0.08;
  }
  }
