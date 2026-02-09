// Physics.ts

// DÜNYA AYARLARI
export const WORLD_WIDTH = 12000;   // ✅ sağ/sol daha rahat
export const WORLD_HEIGHT = 1500;

// DİKKAT: Resim yüksekliği 500 olduğu için Deniz Seviyesini 500 yapıyoruz.
export const SEA_LEVEL = 500;

// ✅ Renderer'da zeminleri WORLD_HEIGHT - 300'e çiziyorsun (300px yüksek zemin)
const FLOOR_HEIGHT = 300;
const FLOOR_Y = WORLD_HEIGHT - FLOOR_HEIGHT;

// ✅ Balığın “gövde merkezine” göre güvenli boşluklar (sprite boyuna göre)
const FISH_RADIUS_X = 80;   // balık çizimi -80..+80 idi
const FISH_RADIUS_Y = 60;   // balık çizimi -60..+60 idi

// ✅ Su üstüne çıkma payı
const JUMP_HEADROOM = 220; // SEA_LEVEL - 220'ye kadar çıkabilir

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

    // 1. HAREKET
    if (inWater) {
      const dx = targetX - fish.x;
      const dy = targetY - fish.y;

      fish.vx += dx * 0.0008;
      fish.vy += dy * 0.0008;

      fish.vx *= 0.95;
      fish.vy *= 0.95;

      const speed = Math.sqrt(fish.vx ** 2 + fish.vy ** 2);
      if (speed > 10) {
        const ratio = 10 / speed;
        fish.vx *= ratio;
        fish.vy *= ratio;
      }
    } else {
      // Hava (Yerçekimi)
      fish.vy += 0.5;
      fish.vx *= 0.98;
    }

    fish.x += fish.vx;
    fish.y += fish.vy;

    // 2. SINIRLAR (✅ gerçek sahneye göre)
    // X sınırları (balık yarıçapını dikkate al)
    const minX = 0 + FISH_RADIUS_X;
    const maxX = WORLD_WIDTH - FISH_RADIUS_X;
    if (fish.x < minX) {
      fish.x = minX;
      fish.vx = 0;
    }
    if (fish.x > maxX) {
      fish.x = maxX;
      fish.vx = 0;
    }

    // Y alt sınır: kumun ÜSTÜ (balığın altı kuma girmesin)
    const maxY = FLOOR_Y - FISH_RADIUS_Y;
    if (fish.y > maxY) {
      fish.y = maxY;
      fish.vy = 0;
    }

    // Y üst sınır: su yüzeyinin üstüne “biraz” çıkabilsin ama uçmasın
    const minY = (SEA_LEVEL - JUMP_HEADROOM) + FISH_RADIUS_Y;
    if (fish.y < minY) {
      fish.y = minY;
      // yukarı çıkmayı kes, hafif aşağı it
      if (fish.vy < 0) fish.vy = 0.5;
    }

    // 3. ANİMASYON
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

    if (fish.state === "TURN_LEFT") {
      fish.rotation = 0;
      fish.scaleX = 1;
    } else {
      const angle = Math.atan2(fish.vy, Math.abs(fish.vx));
      const targetRot = angle * (180 / Math.PI) * fish.lastDirection;
      fish.rotation += (targetRot - fish.rotation) * 0.1;
      fish.scaleX = fish.lastDirection;
    }

    // Derinlik ölçeği (SEA_LEVEL altına göre)
    const depthRatio = Math.max(
      0,
      (fish.y - SEA_LEVEL) / (FLOOR_Y - SEA_LEVEL)
    );
    fish.scaleY = 1 - depthRatio * 0.1;
  }
          }
