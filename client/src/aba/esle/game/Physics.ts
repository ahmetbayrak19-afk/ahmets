// Physics.ts

export const WORLD_WIDTH = 20000; // 10 Chunk
export const WORLD_HEIGHT = 2000;
export const SEA_LEVEL = 500;

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
    isEating: boolean;
}

export class PhysicsEngine {
    updateFish(fish: FishState, targetX: number, targetY: number) {
        const inWater = fish.y > SEA_LEVEL;

        if (inWater) {
            const dx = targetX - fish.x;
            const dy = targetY - fish.y;
            // Takip hızı
            fish.vx += dx * 0.0008;
            fish.vy += dy * 0.0008;
            // Sürtünme
            fish.vx *= 0.97;
            fish.vy *= 0.97;

            // Hız limiti
            const speed = Math.sqrt(fish.vx**2 + fish.vy**2);
            if (speed > 11) {
                const ratio = 11 / speed;
                fish.vx *= ratio;
                fish.vy *= ratio;
            }
        } else {
            // Hava (Yerçekimi)
            fish.vy += 0.8; 
            fish.vx *= 0.99;
        }

        fish.x += fish.vx;
        fish.y += fish.vy;

        // Sınırlar
        if (fish.x < 50) fish.x = 50;
        if (fish.x > WORLD_WIDTH - 50) fish.x = WORLD_WIDTH - 50;
        if (fish.y > WORLD_HEIGHT - 50) fish.y = WORLD_HEIGHT - 50;

        // Animasyon sayacı
        fish.timer++;
        if (fish.timer > 3) {
            fish.frame++;
            fish.timer = 0;
        }

        // Dönüş açısı
        const faceDir = fish.vx > 0.1 ? 1 : (fish.vx < -0.1 ? -1 : (fish.scaleX > 0 ? 1 : -1));
        let angle = Math.atan2(fish.vy, Math.abs(fish.vx));
        fish.rotation += (angle * (180 / Math.PI) * faceDir - fish.rotation) * 0.1;
        
        // Derinlik efekti
        const depthRatio = Math.max(0, (fish.y - SEA_LEVEL) / (WORLD_HEIGHT - SEA_LEVEL));
        const depthScale = 1 + (depthRatio * 0.6);
        fish.scaleX = faceDir * depthScale;
        fish.scaleY = depthScale;
    }
    }
    
