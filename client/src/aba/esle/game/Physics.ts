// DÜNYA AYARLARI (Hungry Shark Modu)
export const WORLD_WIDTH = 6000;  // Okyanus Genişliği
export const WORLD_HEIGHT = 3000; // Okyanus Derinliği

// Deniz Seviyesi (0 = Ekranın en tepesi)
// 300 piksel aşağısı su başlar. Yukarısı gökyüzü (zıplamak için).
export const SEA_LEVEL = 300; 

// Kenar Boşlukları (Balık ekranın dibine yapışmasın)
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
    // 1. HEDEF MESAFESİ VE AÇISI
    const dx = targetX - fish.x;
    const dy = targetY - fish.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 2. HAREKET MANTIĞI (İvmelenme)
    // Eğer hedefe çok yakınsa (10px) titremesin diye durduruyoruz.
    if (dist > 10) {
      // Hız Limiti (Max Speed): 18 birim
      // Hedefe yaklaştıkça yavaşlasın (dist * 0.05)
      const force = Math.min(dist * 0.05, 1.2); 
      
      const angle = Math.atan2(dy, dx);
      
      fish.vx += Math.cos(angle) * force;
      fish.vy += Math.sin(angle) * force;
    }

    // 3. SÜRTÜNME (Su Direnci)
    // Bu değer 1'e ne kadar yakınsa balık o kadar çok kayar (Buz gibi).
    // 0.90 - 0.95 arası "Su" hissi verir.
    fish.vx *= 0.93; 
    fish.vy *= 0.93;

    // 4. POZİSYON GÜNCELLEME
    fish.x += fish.vx;
    fish.y += fish.vy;

    // 5. SINIRLARI KORU (Dünyadan düşmesin)
    if (fish.x < MARGIN) { 
        fish.x = MARGIN; 
        fish.vx *= -0.5; // Duvara çarpınca hafif geri seksin
    }
    if (fish.x > WORLD_WIDTH - MARGIN) { 
        fish.x = WORLD_WIDTH - MARGIN; 
        fish.vx *= -0.5; 
    }
    
    // Tavan (Su yüzeyine çıkabilir ama çok uçmasın)
    // Gökyüzü sınırı: -500
    if (fish.y < -500) { 
        fish.y = -500; 
        fish.vy += 0.5; // Yerçekimi gibi aşağı it
    }
    
    // Taban (Deniz dibi)
    if (fish.y > WORLD_HEIGHT - MARGIN) { 
        fish.y = WORLD_HEIGHT - MARGIN; 
        fish.vy *= -0.5; 
    }

    // 6. YÖN VE ROTASYON (Sprite Yönetimi)
    
    // Hızına göre yön belirle (Sağa mı sola mı bakıyor?)
    // 0.5'ten büyük hız varsa yönünü değiştir.
    if (fish.vx > 0.5) fish.lastDirection = 1;
    if (fish.vx < -0.5) fish.lastDirection = -1;

    // Aynalama (Flip)
    fish.scaleX = fish.lastDirection; 

    // Rotasyon (Burnunu gittiği yere çevir)
    // Sadece hareket halindeyken dön
    const speed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
    
    if (speed > 1) {
        // Radyan cinsinden açıyı bul ve dereceye çevir
        let targetRotation = (Math.atan2(fish.vy, Math.abs(fish.vx)) * 180) / Math.PI;
        
        // Yön sola bakıyorsa açıyı düzelt (Ters dönmesin)
        if (fish.lastDirection === -1) {
            targetRotation *= -1; 
        }

        // Yumuşak geçiş (Lerp)
        fish.rotation += (targetRotation - fish.rotation) * 0.1;
    } else {
        // Durunca yavaşça düzelsin (0 dereceye dönsün)
        fish.rotation *= 0.9;
    }

    // 7. DERİNLİK EFEKTİ (Perspektif)
    // Aşağı indikçe balık %10 küçülsün, yukarı çıkınca büyüsün.
    const depthFactor = (fish.y / WORLD_HEIGHT); // 0 ile 1 arası
    fish.scaleY = 1 - (depthFactor * 0.15); // Max %15 küçülme
    // scaleX yönünü koruyarak küçült
    fish.scaleX = fish.lastDirection * (1 - (depthFactor * 0.15));

    // 8. ANİMASYON FRAME (Sprite Sheet)
    fish.timer++;
    // Hızına göre animasyon hızlansın (Hızlı yüzerken hızlı kuyruk sallasın)
    const animSpeed = speed > 10 ? 3 : 5; 

    if (fish.timer > animSpeed) {
        fish.frame++;
        fish.timer = 0;

        // "Yeme" animasyonu bitince yüzmeye dön
        if (fish.state === "EAT" && fish.frame > 5) { // 5 frame varsaydık
            fish.state = "SWIM";
        }
    }
  }
          }
