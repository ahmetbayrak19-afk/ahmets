// Physics.ts

// DÜNYA AYARLARI (GENİŞ + YÜKSEK)
export const WORLD_WIDTH = 8000;   // sağ/sol çok olsun
export const WORLD_HEIGHT = 2200;  // yukarı/aşağı da büyüsün

// Deniz yüzeyi
export const SEA_LEVEL = 650;

// Balık state
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
    if (inWater) {
      const dx = targetX - fish.x;
      const dy = targetY - fish.y;

      // su altında hedefe çekim
      fish.vx += dx * 0.0008;
      fish.vy += dy * 0.0008;

      // sürtünme
      fish.vx *= 0.95;
      fish.vy *= 0.95;

      // max hız
      const speed = Math.sqrt(fish.vx ** 2 + fish.vy ** 2);
      if (speed > 12) {
        const ratio = 12 / speed;
        fish.vx *= ratio;
        fish.vy *= ratio;
      }
    } else {
      // hava: yerçekimi
      fish.vy += 0.55;
      fish.vx *= 0.985;
    }

    fish.x += fish.vx;
    fish.y += fish.vy;

    // 2) SINIRLAR (çok yukarı + geniş sağ/sol)
    const FISH_RADIUS_X = 90;
    const FISH_RADIUS_Y = 70;

    const JUMP_HEADROOM = 1300; // çok yukarı çıkabilsin
    const FLOOR_PAD = 120;

    const LEFT_WALL = 0 + FISH_RADIUS_X;
    const RIGHT_WALL = WORLD_WIDTH - FISH_RADIUS_X;

    const MAX_Y = WORLD_HEIGHT - FLOOR_PAD - FISH_RADIUS_Y; // kumun altına inmesin
    const MIN_Y = (SEA_LEVEL - JUMP_HEADROOM) + FISH_RADIUS_Y; // gökyüzü alanı

    if (fish.x < LEFT_WALL) { fish.x = LEFT_WALL; fish.vx = 0; }
    if (fish.x > RIGHT_WALL) { fish.x = RIGHT_WALL; fish.vx = 0; }

    if (fish.y > MAX_Y) { fish.y = MAX_Y; fish.vy = 0; }
    if (fish.y < MIN_Y) { fish.y = MIN_Y; fish.vy = 0; }

    // 3) ANİMASYON
    fish.timer++;
    const animSpeed = 4;

    const currentDir = fish.vx > 0.1 ? 1 : (fish.vx < -0.1 ? -1 : fish.lastDirection);

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

    // derinlikte minik squash
    const depthRatio = Math.max(0, (fish.y - SEA_LEVEL) / (WORLD_HEIGHT - SEA_LEVEL));
    fish.scaleY = 1 - (depthRatio * 0.1);
  }
        }
