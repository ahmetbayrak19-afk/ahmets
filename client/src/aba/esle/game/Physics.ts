// Physics.ts

// DÜNYA AYARLARI
export const WORLD_WIDTH = 3000; 
export const WORLD_HEIGHT = 1500; 

// DİKKAT: Resim yüksekliği 500 olduğu için Deniz Seviyesini de 500 yapıyoruz.
// Böylece resim (0 ile 500 arası) tam sığacak.
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
    state: 'SWIM' | 'TURN_LEFT' | 'EAT';
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

            const speed = Math.sqrt(fish.vx**2 + fish.vy**2);
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

        // 2. SINIRLAR
        if (fish.x < 100) { fish.x = 100; fish.vx = 0; }
        if (fish.x > WORLD_WIDTH - 100) { fish.x = WORLD_WIDTH - 100; fish.vx = 0; }
        
        if (fish.y > WORLD_HEIGHT - 100) { fish.y = WORLD_HEIGHT - 100; fish.vy = 0; }
        
        // Zıplama sınırı (Çok uçmasın)
        if (fish.y < SEA_LEVEL - 200) { fish.y = SEA_LEVEL - 200; fish.vy += 1; }

        // 3. ANİMASYON
        fish.timer++;
        const animSpeed = 4; 

        const currentDir = fish.vx > 0.1 ? 1 : (fish.vx < -0.1 ? -1 : fish.lastDirection);

        if (fish.state === 'SWIM') {
            if (fish.lastDirection === 1 && currentDir === -1) {
                fish.state = 'TURN_LEFT';
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
            
            if (fish.state === 'TURN_LEFT' && fish.frame >= 6) { 
                fish.state = 'SWIM';
                fish.lastDirection = -1; 
            }
            if (fish.state === 'EAT' && fish.frame >= 6) {
                fish.state = 'SWIM';
            }
        }

        if (fish.state === 'TURN_LEFT') {
            fish.rotation = 0;
            fish.scaleX = 1; 
        } else {
            const angle = Math.atan2(fish.vy, Math.abs(fish.vx));
            const targetRot = angle * (180 / Math.PI) * fish.lastDirection;
            fish.rotation += (targetRot - fish.rotation) * 0.1;
            fish.scaleX = fish.lastDirection; 
        }

        const depthRatio = Math.max(0, (fish.y - SEA_LEVEL) / (WORLD_HEIGHT - SEA_LEVEL));
        fish.scaleY = 1 - (depthRatio * 0.1); 
    }
}
