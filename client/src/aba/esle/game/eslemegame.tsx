import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- GÖRSELLER ---
import balikNormalImg from './balik.png';
import balikYemeImg from './balik_yeme.png';
import suYuzeyiImg from './su_yuzeyi.png';
import zeminImg from './zemin.png';

export default function EslemeGame({ onClose }: { onClose: () => void }) {
  // --- FİZİK AYARLARI ---
  const WORLD_HEIGHT = 3000; 
  const SEA_LEVEL = 400;     
  
  // YENİ AYARLAR:
  const GRAVITY = 0.8;         // Yerçekimi artırıldı (Daha tok düşüş - Cup diye girsin)
  const FOLLOW_SPEED = 0.04;   // Takip hızı
  const WATER_FRICTION = 0.94; // Su içi süzülme (Daha kaygan, hemen durmaz)
  const AIR_RESISTANCE = 0.99; // Hava direnci
  const MIN_IDLE_SPEED = 0.5;  // Balık hiç durmasın, minimal süzülsün

  // --- STATE'LER ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [isEating, setIsEating] = useState(false); 
  const [faceDirection, setFaceDirection] = useState(1); 

  // Fiziksel Referanslar
  const fishPhys = useRef({ x: 200, y: 500, vx: 0, vy: 0, rotation: 0, scaleY: 1, scaleX: 1 });
  const mousePos = useRef({ x: window.innerWidth / 2, y: 500 });
  const cameraY = useRef(0);
  const backgroundX = useRef(0);
  const requestRef = useRef<number>();
  const [targets, setTargets] = useState<{id: number, x: number, y: number, color: string, type: 'food'}[]>([]);

  // Önceki karede suda mıydı? (Giriş/Çıkış tespiti için)
  const wasInWater = useRef(true);

  // --- INPUT ---
  const handleInput = (e: any) => {
    if (!isPlaying) return;
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    mousePos.current = { x: clientX, y: clientY };
  };

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    fishPhys.current = { x: window.innerWidth / 2, y: 500, vx: 0, vy: 0, rotation: 0, scaleY: 1, scaleX: 1 };
    mousePos.current = { x: window.innerWidth / 2, y: 500 };
    cameraY.current = 0;
    setTargets([]);
  };

  const triggerEatAnimation = () => {
    setIsEating(true);
    setTimeout(() => setIsEating(false), 200);
  };

  // --- OYUN DÖNGÜSÜ ---
  const gameLoop = () => {
    const inWater = fishPhys.current.y > SEA_LEVEL;

    // --- 1. GİRİŞ / ÇIKIŞ OLAYLARI (Sudan çıkış kontrolü) ---
    if (wasInWater.current && !inWater) {
        // Sudan ÇIKTIĞI AN:
        // Hızını %60 kes! (Bu sayede uzaya gitmez)
        fishPhys.current.vy *= 0.4; 
    }
    wasInWater.current = inWater;


    // --- 2. HAREKET FİZİĞİ ---
    if (inWater) {
      // --- SUDA HAREKET ---
      
      let targetY = mousePos.current.y + cameraY.current;
      
      // HEDEF SINIRLAMASI (YÜZEYDE TAKILMA ÇÖZÜMÜ):
      // Eğer parmak suyun üstündeyse, balık oraya gitmeye çalışmasın.
      // Balığın hedefi en fazla suyun 50px altı olabilir.
      if (targetY < SEA_LEVEL + 50) {
          targetY = SEA_LEVEL + 50;
      }

      const dx = mousePos.current.x - fishPhys.current.x;
      const dy = targetY - fishPhys.current.y;

      // Hızlandırma
      fishPhys.current.vx += dx * FOLLOW_SPEED;
      fishPhys.current.vy += dy * FOLLOW_SPEED;
      
      // Sürtünme
      fishPhys.current.vx *= WATER_FRICTION;
      fishPhys.current.vy *= WATER_FRICTION;

      // Minimal Süzülme (Durmasın, çok yavaşça aksın)
      if (Math.abs(fishPhys.current.vx) < MIN_IDLE_SPEED) {
          fishPhys.current.vx += (faceDirection * 0.05); // Baktığı yöne minik itiş
      }

    } else {
      // --- HAVADA HAREKET ---
      fishPhys.current.vy += GRAVITY; // Yerçekimi (Aşağı çeker)
      fishPhys.current.vx *= AIR_RESISTANCE; // Hava direnci
    }

    // Pozisyonu Uygula
    fishPhys.current.x += fishPhys.current.vx;
    fishPhys.current.y += fishPhys.current.vy;

    // --- 3. YÖN VE DÖNME ---
    if (Math.abs(fishPhys.current.vx) > 0.5) {
        setFaceDirection(fishPhys.current.vx > 0 ? 1 : -1);
    }

    // Eğim (Tilt) Hesabı
    let targetRotation = fishPhys.current.vy * 2 * faceDirection;
    targetRotation = Math.max(-30, Math.min(30, targetRotation)); // Max 30 derece
    
    // Havadaysa burnu düşüş hızına göre dönsün (Cup diye girmesi için)
    if (!inWater) {
        // Eğer yukarı çıkıyorsa (vy negatif) dik dursun, düşüyorsa kafa aşağı
        targetRotation = Math.min(fishPhys.current.vy * 5, 90) * faceDirection;
    }

    fishPhys.current.rotation += (targetRotation - fishPhys.current.rotation) * 0.1;

    // --- 4. JELİBON EFEKTİ ---
    const totalSpeed = Math.sqrt(fishPhys.current.vx**2 + fishPhys.current.vy**2);
    const stretch = Math.min(totalSpeed * 0.01, 0.2); 
    fishPhys.current.scaleX = 1 + stretch;
    fishPhys.current.scaleY = 1 - stretch * 0.5;

    // --- 5. SINIRLAR ---
    if (fishPhys.current.x < 50) { fishPhys.current.x = 50; fishPhys.current.vx *= -0.5; }
    if (fishPhys.current.x > window.innerWidth - 50) { fishPhys.current.x = window.innerWidth - 50; fishPhys.current.vx *= -0.5; }
    if (fishPhys.current.y > WORLD_HEIGHT - 120) { fishPhys.current.y = WORLD_HEIGHT - 120; fishPhys.current.vy = 0; }

    // --- 6. KAMERA ---
    const targetCamY = fishPhys.current.y - window.innerHeight / 2;
    cameraY.current += (targetCamY - cameraY.current) * 0.1;
    if (cameraY.current < 0) cameraY.current = 0;
    if (cameraY.current > WORLD_HEIGHT - window.innerHeight) cameraY.current = WORLD_HEIGHT - window.innerHeight;

    backgroundX.current -= 1.5;

    // --- 7. HEDEF YÖNETİMİ ---
    setTargets(prev => {
        if (Math.random() < 0.015) { 
            return [...prev, {
                id: Date.now(),
                x: window.innerWidth + 100, 
                y: Math.random() * (WORLD_HEIGHT - SEA_LEVEL - 200) + SEA_LEVEL + 100, 
                color: ['#ef4444', '#22c55e', '#eab308'][Math.floor(Math.random() * 3)],
                type: 'food'
            }];
        }
        return prev
            .map(t => ({...t, x: t.x - 2}))
            .filter(t => {
                const dist = Math.hypot(fishPhys.current.x - t.x, fishPhys.current.y - t.y);
                if (dist < 70) { 
                    triggerEatAnimation();
                    setScore(s => s + 10);
                    confetti({ origin: { x: fishPhys.current.x / window.innerWidth, y: 0.5 }, particleCount: 20, spread: 40 });
                    return false; 
                }
                return t.x > -100; 
            });
    });

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    if (isPlaying) requestRef.current = requestAnimationFrame(gameLoop);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isPlaying]);

  return (
    <div 
        className="fixed inset-0 overflow-hidden bg-sky-200 font-sans select-none touch-none"
        onMouseMove={handleInput}
        onTouchMove={handleInput}
    >
        {/* === DÜNYA === */}
        <div 
            className="absolute w-full top-0 left-0 will-change-transform"
            style={{ 
                height: WORLD_HEIGHT,
                transform: `translateY(${-cameraY.current}px)` 
            }}
        >
            {/* GÖKYÜZÜ */}
            <div style={{ height: SEA_LEVEL }} className="w-full bg-gradient-to-b from-sky-300 to-sky-100 relative">
                 <h1 className="text-center text-white/50 font-black text-6xl pt-20">GÖKYÜZÜ</h1>
            </div>

            {/* DENİZ */}
            <div 
                className="w-full relative"
                style={{ 
                    top: -2,
                    height: WORLD_HEIGHT - SEA_LEVEL,
                    background: 'linear-gradient(to bottom, #60a5fa 0%, #1e3a8a 90%)' 
                }}
            >
                {/* SU YÜZEYİ */}
                <div 
                    className="absolute top-0 left-0 w-[200%] h-16 pointer-events-none"
                    style={{ 
                        backgroundImage: `url(${suYuzeyiImg})`,
                        backgroundRepeat: 'repeat-x',
                        backgroundSize: 'auto 100%',
                        transform: `translateX(${backgroundX.current % window.innerWidth}px) translateY(-50%)`
                    }}
                />

                {/* ZEMİN (KUM) */}
                <div 
                    className="absolute bottom-0 left-0 w-[200%] h-40 pointer-events-none"
                    style={{ 
                        backgroundImage: `url(${zeminImg})`,
                        backgroundColor: '#e6c288',
                        backgroundRepeat: 'repeat-x',
                        backgroundSize: 'auto 100%',
                        backgroundPosition: 'bottom',
                        transform: `translateX(${backgroundX.current % window.innerWidth}px)`
                    }}
                />
            </div>

            {/* HEDEFLER */}
            {targets.map(t => (
                <div 
                    key={t.id}
                    className="absolute w-12 h-12 rounded-full shadow-lg border-2 border-white/50 flex items-center justify-center animate-pulse"
                    style={{ left: t.x, top: t.y, backgroundColor: t.color }}
                >
                    <div className="w-4 h-4 bg-white/40 rounded-full blur-sm"></div>
                </div>
            ))}

            {/* OYUNCU BALIĞI */}
            {isPlaying && (
                <div 
                    className="absolute z-50 will-change-transform"
                    style={{
                        left: fishPhys.current.x,
                        top: fishPhys.current.y,
                        width: 90, 
                        height: 70,
                        transform: `translate(-50%, -50%) 
                                    scale(${faceDirection * fishPhys.current.scaleX}, ${fishPhys.current.scaleY})
                                    rotate(${fishPhys.current.rotation}deg)` 
                    }}
                >
                    <img 
                        src={isEating ? balikYemeImg : balikNormalImg} 
                        alt="Karakter" 
                        className="w-full h-full object-contain drop-shadow-2xl"
                    />
                </div>
            )}
        </div>

        {/* UI */}
        <div className="fixed top-5 left-5 bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-xl border-4 border-orange-400 z-[100]">
            <span className="font-black text-2xl text-orange-600">SKOR: {score}</span>
        </div>

        <button onClick={onClose} className="fixed top-5 right-5 z-[100] bg-white p-2 rounded-full shadow-lg hover:scale-110 transition">
            <XCircle className="text-red-500 w-8 h-8" />
        </button>

        {!isPlaying && (
            <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={startGame}
                    className="bg-orange-500 text-white px-12 py-6 rounded-3xl font-black text-4xl shadow-orange-500/50 shadow-2xl flex items-center gap-4 border-b-8 border-orange-700 active:border-b-0 active:translate-y-2 transition-all"
                >
                    <Play size={40} fill="currentColor" /> BAŞLA
                </motion.button>
            </div>
        )}
    </div>
  );
}
