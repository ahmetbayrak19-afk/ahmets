import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- GÖRSELLER (YENİLER EKLENDİ) ---
// Yüzme Kareleri
import duzbalikAna from './duzbalikana.png';
import duzbalik1 from './duzbalik1.png';
import duzbalik2 from './duzbalik2.png';

// Yeme Kareleri
import balikye1 from './balikye1.png';
import balikye2 from './balikye2.png';
import balikye3 from './balikye3.png';
import balikye4 from './balikye4.png';

import suYuzeyiImg from './su_yuzeyi.png';

// ZEMİN PARÇALARI
import altzemin1 from './altzemin1.png';
import altzemin2 from './altzemin2.png';
import ustzemin1 from './ustzemin1.png';
import ustzemin2 from './ustzemin2.png';
import ustzemin3 from './ustzemin3.png';

// --- ANİMASYON DİZİLERİ ---
const SWIM_FRAMES = [duzbalikAna, duzbalik1, duzbalik2, duzbalik1]; // 1-2-Ana-1 döngüsü daha akıcı olur
const EAT_FRAMES = [balikye1, balikye2, balikye3, balikye4];

export default function EslemeGame({ onClose }: { onClose: () => void }) {
  // --- AYARLAR ---
  const WORLD_HEIGHT = 3000; 
  const SEA_LEVEL = 400;     
  const ZEMIN_YUKSEKLIK = 350;
  const CHUNK_WIDTH = 2000; 

  // --- FİZİK AYARLARI ---
  const FOLLOW_SPEED = 0.0008;   
  const MAX_SPEED = 10; 
  const WATER_FRICTION = 0.98; 
  const GRAVITY = 0.8;          
  const AIR_RESISTANCE = 0.99;  

  // --- STATE'LER ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  
  // ANİMASYON STATE'LERİ
  const [isEating, setIsEating] = useState(false); 
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0); // Hangi karedeyiz?
  
  const [faceDirection, setFaceDirection] = useState(1); 
  const [chunks, setChunks] = useState<any[]>([]);

  const fishPhys = useRef({ x: 200, y: 500, vx: 0, vy: 0, rotation: 0, scaleY: 1, scaleX: 1 });
  const mousePos = useRef({ x: window.innerWidth / 2, y: 500 });
  const cameraY = useRef(0);
  const backgroundX = useRef(0);
  const requestRef = useRef<number>();
  const [targets, setTargets] = useState<{id: number, x: number, y: number, color: string, type: 'food'}[]>([]);
  const wasInWater = useRef(true);

  // --- ANİMASYON MOTORU (YENİ) ---
  useEffect(() => {
    if (!isPlaying) return;

    // Animasyon hızı: 
    // Balık hızlı yüzerse (vx artarsa) kuyruk daha hızlı sallansın istersek burayı dinamik yapabiliriz.
    // Şimdilik sabit 100ms (saniyede 10 kare) idealdir.
    const animInterval = setInterval(() => {
        setCurrentFrameIndex(prev => prev + 1);
    }, 120); 

    return () => clearInterval(animInterval);
  }, [isPlaying]);

  // --- ZEMİN ÜRETİCİ ---
  const generateChunk = (xPos: number) => {
    const baseImg = Math.random() > 0.5 ? altzemin1 : altzemin2;
    let overlayImg = null;
    const rand = Math.random();
    if (rand > 0.75) overlayImg = ustzemin1;
    else if (rand > 0.50) overlayImg = ustzemin2;
    else if (rand > 0.25) overlayImg = ustzemin3;

    return {
        id: Date.now() + Math.random(),
        x: xPos,
        base: baseImg,
        overlay: overlayImg
    };
  };

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
    backgroundX.current = 0;
    cameraY.current = 0;
    setTargets([]);

    const initialChunks = [
        generateChunk(-CHUNK_WIDTH),
        generateChunk(0),
        generateChunk(CHUNK_WIDTH)
    ];
    setChunks(initialChunks);
  };

  const triggerEatAnimation = () => {
    setIsEating(true);
    setCurrentFrameIndex(0); // Yeme animasyonunu baştan başlat
    // 4 karelik yeme animasyonu bitince normale dön (4 kare * 100ms = 400ms)
    setTimeout(() => setIsEating(false), 400);
  };

  // --- OYUN DÖNGÜSÜ ---
  const gameLoop = () => {
    const inWater = fishPhys.current.y > SEA_LEVEL;

    // 1. Sudan Çıkış
    if (wasInWater.current && !inWater) {
        fishPhys.current.vy *= 0.5; 
    }
    wasInWater.current = inWater;

    // 2. Fizik
    if (inWater) {
      const targetY = mousePos.current.y + cameraY.current;
      const dx = mousePos.current.x - fishPhys.current.x;
      const dy = targetY - fishPhys.current.y;

      fishPhys.current.vx += dx * FOLLOW_SPEED;
      fishPhys.current.vy += dy * FOLLOW_SPEED;
      
      fishPhys.current.vx *= WATER_FRICTION;
      fishPhys.current.vy *= WATER_FRICTION;

      const currentSpeed = Math.sqrt(fishPhys.current.vx**2 + fishPhys.current.vy**2);
      if (currentSpeed > MAX_SPEED) {
          const ratio = MAX_SPEED / currentSpeed;
          fishPhys.current.vx *= ratio;
          fishPhys.current.vy *= ratio;
      }
    } else {
      fishPhys.current.vy += GRAVITY; 
      fishPhys.current.vx *= AIR_RESISTANCE; 
    }

    fishPhys.current.x += fishPhys.current.vx;
    fishPhys.current.y += fishPhys.current.vy;

    // 3. Dünya Kaydırma
    if (backgroundX.current - fishPhys.current.vx > 0) {
        backgroundX.current = 0; 
        if (fishPhys.current.vx < 0) fishPhys.current.vx = 0; 
    } else {
        backgroundX.current -= fishPhys.current.vx; 
    }

    // 4. Chunk Yönetimi
    setChunks(prevChunks => {
        const currentRightEdge = -backgroundX.current + window.innerWidth;
        const lastChunk = prevChunks[prevChunks.length - 1];
        
        if (lastChunk && lastChunk.x < currentRightEdge + CHUNK_WIDTH) {
            return [...prevChunks, generateChunk(lastChunk.x + CHUNK_WIDTH)];
        }
        const currentLeftEdge = -backgroundX.current;
        if (prevChunks[0].x < currentLeftEdge - CHUNK_WIDTH * 2) {
             return prevChunks.slice(1);
        }
        return prevChunks;
    });

    // 5. Yön ve Dönme
    if (Math.abs(fishPhys.current.vx) > 0.1) {
        setFaceDirection(fishPhys.current.vx > 0 ? 1 : -1);
    }
    
    let angleRad = Math.atan2(fishPhys.current.vy, Math.abs(fishPhys.current.vx));
    let angleDeg = angleRad * (180 / Math.PI);
    let targetRotation = angleDeg * faceDirection;
    
    fishPhys.current.rotation += (targetRotation - fishPhys.current.rotation) * 0.1;

    // 6. Esneme
    const totalSpeed = Math.sqrt(fishPhys.current.vx**2 + fishPhys.current.vy**2);
    const stretch = Math.min(totalSpeed * 0.02, 0.3); 
    fishPhys.current.scaleX = 1 + stretch;
    fishPhys.current.scaleY = 1 - stretch * 0.5;

    // 7. Sınırlar
    if (fishPhys.current.x < 50) { 
        fishPhys.current.x = 50; 
        if(backgroundX.current >= 0) fishPhys.current.vx = 0; 
    }
    if (fishPhys.current.x > window.innerWidth - 50) { 
        fishPhys.current.x = window.innerWidth - 50; 
    }
    
    if (fishPhys.current.y > WORLD_HEIGHT - 10) { 
        fishPhys.current.y = WORLD_HEIGHT - 10; 
        fishPhys.current.vy = 0; 
    }

    // 8. Kamera
    const targetCamY = fishPhys.current.y - window.innerHeight / 2;
    cameraY.current += (targetCamY - cameraY.current) * 0.1;
    if (cameraY.current < 0) cameraY.current = 0;
    if (cameraY.current > WORLD_HEIGHT - window.innerHeight) cameraY.current = WORLD_HEIGHT - window.innerHeight;

    // 9. Hedefler
    setTargets(prev => {
        if (Math.random() < 0.015) { 
            const spawnRight = Math.random() > 0.5; 
            return [...prev, {
                id: Date.now(),
                x: (spawnRight ? window.innerWidth + 200 : -200) + Math.abs(backgroundX.current), 
                y: Math.random() * (WORLD_HEIGHT - SEA_LEVEL - ZEMIN_YUKSEKLIK - 100) + SEA_LEVEL + 100, 
                color: ['#ef4444', '#22c55e', '#eab308'][Math.floor(Math.random() * 3)],
                type: 'food'
            }];
        }
        return prev
            .map(t => ({ ...t, x: t.x - fishPhys.current.vx }))
            .filter(t => {
                const dist = Math.hypot(fishPhys.current.x - t.x, fishPhys.current.y - t.y);
                if (dist < 80) { 
                    triggerEatAnimation();
                    setScore(s => s + 10);
                    confetti({ origin: { x: fishPhys.current.x / window.innerWidth, y: 0.5 }, particleCount: 20, spread: 40 });
                    return false; 
                }
                return t.x > -2000 && t.x < window.innerWidth + 2000; 
            });
    });

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    if (isPlaying) requestRef.current = requestAnimationFrame(gameLoop);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isPlaying]);

  // --- GÖRSEL SEÇİCİ ---
  // Hangi resmi göstereceğimize karar veren fonksiyon
  const getCurrentImage = () => {
    if (isEating) {
        // Yeme modundaysak EAT_FRAMES dizisinden sıradaki kareyi al
        // Modulo (%) operatörü dizinin dışına taşmayı engeller (0,1,2,3,0,1,2,3...)
        return EAT_FRAMES[currentFrameIndex % EAT_FRAMES.length];
    } else {
        // Yüzme modundaysak SWIM_FRAMES dizisinden al
        return SWIM_FRAMES[currentFrameIndex % SWIM_FRAMES.length];
    }
  };

  return (
    <div 
        className="fixed inset-0 overflow-hidden bg-sky-200 font-sans select-none touch-none"
        onMouseMove={handleInput}
        onTouchMove={handleInput}
    >
        <style>{`
          @keyframes yosunSallan {
            0% { transform: skewX(0deg); }
            50% { transform: skewX(4deg); }
            100% { transform: skewX(0deg); }
          }
        `}</style>

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
                    className="absolute top-0 left-0 w-full h-16 pointer-events-none"
                    style={{ 
                        backgroundImage: `url(${suYuzeyiImg})`,
                        backgroundRepeat: 'repeat-x',
                        backgroundSize: 'auto 100%',
                        backgroundPositionX: `${backgroundX.current}px`,
                        transform: `translateY(-50%)`
                    }}
                />

                {/* --- CHUNKS --- */}
                {chunks.map(chunk => (
                    <div 
                        key={chunk.id}
                        className="absolute bottom-0 pointer-events-none"
                        style={{
                            left: 0,
                            width: CHUNK_WIDTH,
                            height: ZEMIN_YUKSEKLIK,
                            transform: `translateX(${chunk.x + backgroundX.current}px)`
                        }}
                    >
                        <div 
                            className="absolute bottom-0 left-0 w-full h-full"
                            style={{
                                backgroundImage: `url(${chunk.base})`,
                                backgroundSize: '100% 100%',
                                filter: 'brightness(0.95)'
                            }}
                        />
                        {chunk.overlay && (
                            <div 
                                className="absolute bottom-0 left-0 w-full h-full"
                                style={{
                                    backgroundImage: `url(${chunk.overlay})`,
                                    backgroundSize: '100% 100%',
                                    transformOrigin: 'bottom center',
                                    animation: 'yosunSallan 5s infinite ease-in-out',
                                    filter: 'drop-shadow(5px 10px 10px rgba(0,0,0,0.6)) brightness(0.9)'
                                }}
                            />
                        )}
                    </div>
                ))}
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

            {/* --- BALIK --- */}
            {isPlaying && (
                <div 
                    className="absolute z-50 will-change-transform"
                    style={{
                        left: fishPhys.current.x,
                        top: fishPhys.current.y,
                        width: 120, // Balık biraz daha büyük görünsün diye 120 yaptım
                        height: 90,
                        // Balık Pivot Merkezini Ayarlama
                        // Not: Eğer balık biraz aşağıda kalıyorsa buradaki `translate` değerleriyle oyna.
                        // Şu an tam ortalıyor: (-50%, -50%)
                        transform: (() => {
                            const depthRatio = Math.max(0, (fishPhys.current.y - SEA_LEVEL) / (WORLD_HEIGHT - SEA_LEVEL));
                            const depthScale = 1 + (depthRatio * 0.6); 
                            return `translate(-50%, -50%) 
                                    rotate(${fishPhys.current.rotation}deg) 
                                    scale(${faceDirection * fishPhys.current.scaleX * depthScale}, ${fishPhys.current.scaleY * depthScale})`;
                        })()
                    }}
                >
                    <img 
                        // BURASI OTOMATİK DEĞİŞİYOR
                        src={getCurrentImage()} 
                        alt="Karakter" 
                        className="w-full h-full object-contain drop-shadow-2xl"
                        // Eğer resim içinde balık biraz kayıksa, ince ayar için buraya margin verebilirsin:
                        // style={{ marginTop: '-10px' }} gibi.
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
