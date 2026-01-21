import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- GÖRSELLER ---
import balikNormalImg from './balik.png';
import balikYemeImg from './balik_yeme.png';
import suYuzeyiImg from './su_yuzeyi.png';
import zeminImg from './zemin.png';

export default function EslemeGame({ onClose }: { onClose: () => void }) {
  // --- AYARLAR (Burayı güncelledik) ---
  const WORLD_HEIGHT = 3000; 
  const SEA_LEVEL = 400;     
  const GRAVITY = 0.4;       // Yerçekimini biraz azalttım
  
  // HAREKET AYARLARI (Yavaşlatıldı)
  const FOLLOW_STRENGTH = 0.025; // Takip hızı (Düşürüldü: 0.05 -> 0.025)
  const WATER_DRAG = 0.12;       // Sürtünme (Artırıldı: 0.08 -> 0.12) - Daha tok durur
  const SCROLL_SPEED = 2;        // Arka plan hızı (Düşürüldü: 4 -> 2)

  // --- STATE'LER ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  
  const [isEating, setIsEating] = useState(false); 
  const [faceDirection, setFaceDirection] = useState(1); 

  const fishPhys = useRef({ x: 200, y: 500, vx: 0, vy: 0, rotation: 0, scaleY: 1, scaleX: 1 });
  const mousePos = useRef({ x: 200, y: 500 });
  const cameraY = useRef(0);
  const backgroundX = useRef(0);
  const requestRef = useRef<number>();

  const [targets, setTargets] = useState<{id: number, x: number, y: number, color: string, type: 'food'|'enemy'}[]>([]);

  // --- INPUT (MOUSE/TOUCH) ---
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
    setGameOver(false);
    setScore(0);
    fishPhys.current = { x: window.innerWidth / 2, y: 500, vx: 0, vy: 0, rotation: 0, scaleY: 1, scaleX: 1 };
    mousePos.current = { x: window.innerWidth / 2, y: 500 }; // Mouse'u da resetle
    setTargets([]);
  };

  const triggerEatAnimation = () => {
    setIsEating(true);
    setTimeout(() => setIsEating(false), 200);
  };

  // --- OYUN DÖNGÜSÜ ---
  const gameLoop = () => {
    if (gameOver) return;

    const inWater = fishPhys.current.y > SEA_LEVEL;

    // --- FİZİK HESAPLAMA ---
    if (inWater) {
      const targetWorldY = mousePos.current.y + cameraY.current; 
      
      const dx = mousePos.current.x - fishPhys.current.x; 
      const dy = targetWorldY - fishPhys.current.y;

      // Takip hızı (Smooth Follow)
      fishPhys.current.vx += dx * FOLLOW_STRENGTH;
      fishPhys.current.vy += dy * FOLLOW_STRENGTH;
      
      // Sürtünme (Hızı kes)
      fishPhys.current.vx *= (1 - WATER_DRAG);
      fishPhys.current.vy *= (1 - WATER_DRAG);

      // Yön Bulma
      if (Math.abs(fishPhys.current.vx) > 0.5) {
          setFaceDirection(fishPhys.current.vx > 0 ? 1 : -1);
      }

    } else {
      // Havadayken
      fishPhys.current.vy += GRAVITY; 
      fishPhys.current.vx *= 0.98; 
    }

    // Pozisyonu Uygula
    fishPhys.current.x += fishPhys.current.vx;
    fishPhys.current.y += fishPhys.current.vy;

    // --- EKRAN SINIRLARI (Balık kaybolmasın) ---
    // Sol ve Sağ duvarlar
    if (fishPhys.current.x < 50) {
        fishPhys.current.x = 50;
        fishPhys.current.vx = 0; // Duvara çarpınca hızı sıfırla
    }
    if (fishPhys.current.x > window.innerWidth - 50) {
        fishPhys.current.x = window.innerWidth - 50;
        fishPhys.current.vx = 0;
    }

    // Dip Sınırı
    if (fishPhys.current.y > WORLD_HEIGHT - 120) {
        fishPhys.current.y = WORLD_HEIGHT - 120;
        fishPhys.current.vy = 0;
    }

    // --- JELİBON EFEKTİ ---
    const speed = Math.sqrt(fishPhys.current.vx**2 + fishPhys.current.vy**2);
    const stretch = Math.min(speed * 0.02, 0.2); // Esnemeyi de biraz azalttım (Daha tok)
    
    let angle = Math.atan2(fishPhys.current.vy, fishPhys.current.vx) * (180 / Math.PI);
    if (faceDirection === -1) { 
        angle = angle - 180; 
        angle = angle * -1; 
    }
    // Havadayken kafa aşağı düşsün
    if (!inWater) angle = 90;

    fishPhys.current.rotation += (angle - fishPhys.current.rotation) * 0.1; // Yumuşak dönüş
    fishPhys.current.scaleX = 1 + stretch;
    fishPhys.current.scaleY = 1 - stretch * 0.5;

    // --- KAMERA ---
    const targetCamY = fishPhys.current.y - window.innerHeight / 2;
    cameraY.current += (targetCamY - cameraY.current) * 0.08; // Kamera daha yavaş takip etsin
    if (cameraY.current < 0) cameraY.current = 0;
    if (cameraY.current > WORLD_HEIGHT - window.innerHeight) cameraY.current = WORLD_HEIGHT - window.innerHeight;

    // --- ARKA PLAN KAYMASI ---
    backgroundX.current -= SCROLL_SPEED;

    // --- HEDEFLER ---
    setTargets(prev => {
        if (Math.random() < 0.015) { // Hedef çıkma sıklığı
            return [...prev, {
                id: Date.now(),
                x: window.innerWidth + 100, 
                y: Math.random() * (WORLD_HEIGHT - SEA_LEVEL - 200) + SEA_LEVEL + 100, 
                color: ['#ef4444', '#22c55e', '#eab308'][Math.floor(Math.random() * 3)],
                type: 'food'
            }];
        }
        
        return prev
            .map(t => ({...t, x: t.x - SCROLL_SPEED}))
            .filter(t => {
                const dist = Math.hypot(fishPhys.current.x - t.x, fishPhys.current.y - t.y);
                if (dist < 70) { // Yeme mesafesi (Hitbox)
                    triggerEatAnimation();
                    setScore(s => s + 10);
                    confetti({
                         origin: { x: fishPhys.current.x / window.innerWidth, y: 0.5 },
                         particleCount: 20,
                         spread: 40
                    });
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
        className="fixed inset-0 overflow-hidden bg-sky-200 font-sans select-none touch-none" // touch-none mobilde kaydırmayı engeller
        onMouseMove={handleInput}
        onTouchMove={handleInput}
    >
        {/* === DÜNYA CONTAINER === */}
        <div 
            className="absolute w-full top-0 left-0 will-change-transform"
            style={{ 
                height: WORLD_HEIGHT,
                transform: `translateY(${-cameraY.current}px)` 
            }}
        >
            {/* 1. GÖKYÜZÜ */}
            <div style={{ height: SEA_LEVEL }} className="w-full bg-gradient-to-b from-sky-300 to-sky-100 relative">
                <h1 className="text-center text-white/50 font-black text-6xl pt-20">GÖKYÜZÜ</h1>
            </div>

            {/* 2. DENİZ SUYU (Ana Gövde) */}
            <div 
                className="w-full relative"
                style={{ 
                    top: -2,
                    height: WORLD_HEIGHT - SEA_LEVEL,
                    background: 'linear-gradient(to bottom, #60a5fa 0%, #1e3a8a 90%)' 
                }}
            >
                {/* SU YÜZEYİ (Dalgalar) */}
                <div 
                    className="absolute top-0 left-0 w-[200%] h-16 pointer-events-none"
                    style={{ 
                        backgroundImage: `url(${suYuzeyiImg})`,
                        backgroundRepeat: 'repeat-x',
                        backgroundSize: 'auto 100%',
                        transform: `translateX(${backgroundX.current % window.innerWidth}px) translateY(-50%)`
                    }}
                />

                {/* --- ZEMİN (KUM) DÜZELTMESİ --- */}
                {/* Altına bir kutu daha koyduk ve rengini kum rengi yaptık (blue glitch fix) */}
                <div 
                    className="absolute bottom-0 left-0 w-[200%] h-40 pointer-events-none"
                    style={{ 
                        backgroundImage: `url(${zeminImg})`,
                        backgroundColor: '#e6c288', // Kum rengi astar (Altta mavi görünmesin diye)
                        backgroundRepeat: 'repeat-x',
                        backgroundSize: 'auto 100%', // Resmi tam sığdır
                        backgroundPosition: 'bottom', // En alta yapıştır
                        transform: `translateX(${backgroundX.current % window.innerWidth}px)`
                    }}
                />
            </div>

            {/* 3. HEDEFLER */}
            {targets.map(t => (
                <div 
                    key={t.id}
                    className="absolute w-12 h-12 rounded-full shadow-lg border-2 border-white/50 flex items-center justify-center animate-pulse"
                    style={{ 
                        left: t.x, 
                        top: t.y,
                        backgroundColor: t.color 
                    }}
                >
                    {/* Basit parlama efekti */}
                    <div className="w-4 h-4 bg-white/40 rounded-full blur-sm"></div>
                </div>
            ))}

            {/* 4. OYUNCU BALIĞI */}
            {isPlaying && (
                <div 
                    className="absolute z-50 will-change-transform"
                    style={{
                        left: fishPhys.current.x,
                        top: fishPhys.current.y,
                        width: 90, // Balığı biraz büyüttüm
                        height: 70,
                        transform: `translate(-50%, -50%) 
                                    rotate(${fishPhys.current.rotation}deg) 
                                    scale(${faceDirection * fishPhys.current.scaleX}, ${fishPhys.current.scaleY})` 
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

        {/* === UI (ARAYÜZ) === */}
        <div className="fixed top-5 left-5 bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-xl border-4 border-orange-400 z-[100]">
            <span className="font-black text-2xl text-orange-600">SKOR: {score}</span>
        </div>

        <button onClick={onClose} className="fixed top-5 right-5 z-[100] bg-white p-2 rounded-full shadow-lg hover:scale-110 transition">
            <XCircle className="text-red-500 w-8 h-8" />
        </button>

        {/* MENÜ EKRANI */}
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
                <div className="mt-8 text-white/90 text-lg font-medium bg-white/10 p-4 rounded-xl backdrop-blur-md">
                    <p>👆 Parmağınla balığı yönlendir</p>
                    <p>🐟 Renkli yemleri topla</p>
                </div>
            </div>
        )}
    </div>
  );
    }
    
