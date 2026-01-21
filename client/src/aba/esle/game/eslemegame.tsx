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
  const ZEMIN_YUKSEKLIK = 350; // Zemin yüksekliği (Tepelik)

  // 1. HIZ AYARI: Eski hızın 6'da 1'i (0.04 -> 0.007)
  const FOLLOW_SPEED = 0.007;   
  
  // 2. DİĞER FİZİKLER
  const GRAVITY = 0.8;          // Su üstüne çıkınca aşağı çeken kuvvet
  const WATER_FRICTION = 0.96;  // Suda süzülme (Daha kaygan yaptık ki yavaş hızda hareket edebilsin)
  const AIR_RESISTANCE = 0.99;  
  const MIN_IDLE_SPEED = 0.5;   

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

    // --- 1. SUDAN ÇIKIŞ KONTROLÜ ---
    if (wasInWater.current && !inWater) {
        // Sudan çıktığı an dikey hızını yarıya düşür (Uzaya gitmesin ama zıplasın)
        fishPhys.current.vy *= 0.5; 
    }
    wasInWater.current = inWater;

    // --- 2. HAREKET FİZİĞİ ---
    if (inWater) {
      // Zıplama Kilidini Kaldırdık! 
      // Artık parmak neredeyse orayı hedefler.
      const targetY = mousePos.current.y + cameraY.current;
      
      const dx = mousePos.current.x - fishPhys.current.x;
      const dy = targetY - fishPhys.current.y;

      fishPhys.current.vx += dx * FOLLOW_SPEED;
      fishPhys.current.vy += dy * FOLLOW_SPEED;
      
      fishPhys.current.vx *= WATER_FRICTION;
      fishPhys.current.vy *= WATER_FRICTION;

      if (Math.abs(fishPhys.current.vx) < MIN_IDLE_SPEED) {
          fishPhys.current.vx += (faceDirection * 0.05);
      }

    } else {
      // HAVADAYKEN
      fishPhys.current.vy += GRAVITY; 
      fishPhys.current.vx *= AIR_RESISTANCE; 
    }

    fishPhys.current.x += fishPhys.current.vx;
    fishPhys.current.y += fishPhys.current.vy;

    // --- 3. YÖN VE DÖNME ---
    if (Math.abs(fishPhys.current.vx) > 0.5) {
        setFaceDirection(fishPhys.current.vx > 0 ? 1 : -1);
    }

    let targetRotation = fishPhys.current.vy * 2 * faceDirection;
    targetRotation = Math.max(-30, Math.min(30, targetRotation)); 
    
    // Su dışında düşüş efekti
    if (!inWater) {
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
    
    // Zemin Çarpışması
    if (fishPhys.current.y > WORLD_HEIGHT - ZEMIN_YUKSEKLIK) { 
        fishPhys.current.y = WORLD_HEIGHT - ZEMIN_YUKSEKLIK; 
        fishPhys.current.vy = 0; 
    }

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
                // Hedefler kuma gömülmesin diye ZEMIN_YUKSEKLIK kadar pay bıraktık
                y: Math.random() * (WORLD_HEIGHT - SEA_LEVEL - ZEMIN_YUKSEKLIK - 100) + SEA_LEVEL + 100, 
                color: ['#ef4444', '#22c55e', '#eab308'][Math.floor(Math.random() * 3)],
                type: 'food'
            }];
        }
        return prev
            .map(t => ({...t, x: t.x - 2}))
            .filter(t => {
                const dist = Math.hypot(fishPhys.current.x - t.x, fishPhys.current.y - t.y);
                if (dist < 80) { 
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

                {/* ZEMİN (KUM) - YÜKSEK (350px) */}
                <div 
                    className="absolute bottom-0 left-0 w-[200%] pointer-events-none"
                    style={{ 
                        height: ZEMIN_YUKSEKLIK, 
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

            {/* OYUNCU BALIĞI (3D EFFECT) */}
            {isPlaying && (
                <div 
                    className="absolute z-50 will-change-transform"
                    style={{
                        left: fishPhys.current.x,
                        top: fishPhys.current.y,
                        width: 90, 
                        height: 70,
                        transform: (() => {
                            // DERİNLİK HESABI
                            const depthRatio = Math.max(0, (fishPhys.current.y - SEA_LEVEL) / (WORLD_HEIGHT - SEA_LEVEL));
                            const depthScale = 1 + (depthRatio * 0.6); // %60 Büyüme

                            return `translate(-50%, -50%) 
                                    rotate(${fishPhys.current.rotation}deg) 
                                    scale(${faceDirection * fishPhys.current.scaleX * depthScale}, ${fishPhys.current.scaleY * depthScale})`;
                        })()
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
          
