import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- GÖRSELLER ---
import d1 from './d1.png'; 
import d2 from './d2.png';
import d3 from './d3.png';
import d4 from './d4.png'; 
import d5 from './d5.png'; 
import d6 from './d6.png';
import d7 from './d7.png';
import d8 from './d8.png'; 

import balikye1 from './balikye1.png';
import balikye2 from './balikye2.png';
import balikye3 from './balikye3.png';
import balikye4 from './balikye4.png';

import suYuzeyiImg from './su_yuzeyi.png';

import altzemin1 from './altzemin1.png';
import altzemin2 from './altzemin2.png';
import ustzemin1 from './ustzemin1.png';
import ustzemin2 from './ustzemin2.png';
import ustzemin3 from './ustzemin3.png';

// --- ANİMASYON DİZİLERİ ---
const SWIM_FRAMES = [
  d1, d2, d3, d4, d3, d2,       
  d1,                           
  d5, d6, d7, d8, d7, d6, d5    
];

const EAT_FRAMES = [balikye1, balikye2, balikye3, balikye4];

export default function EslemeGame({ onClose }: { onClose: () => void }) {
  // --- AYARLAR ---
  const WORLD_HEIGHT = 3000; 
  const SEA_LEVEL = 400;     
  const ZEMIN_YUKSEKLIK = 350;
  const CHUNK_WIDTH = 2000; 

  // --- FİZİK AYARLARI ---
  const FOLLOW_SPEED = 0.0008;   
  const MAX_SPEED = 11; 
  const WATER_FRICTION = 0.97; 
  const GRAVITY = 0.8;          
  const AIR_RESISTANCE = 0.99;  

  // --- STATE'LER ---
  const [isPortrait, setIsPortrait] = useState(false); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  
  const [isEating, setIsEating] = useState(false); 
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  
  const [faceDirection, setFaceDirection] = useState(1); 
  const [chunks, setChunks] = useState<any[]>([]);

  // Balığın DÜNYA üzerindeki mutlak konumu
  const fishPhys = useRef({ x: 0, y: 500, vx: 0, vy: 0, rotation: 0, scaleY: 1, scaleX: 1 });
  const mousePos = useRef({ x: 0, y: 500 });
  
  // KAMERA KONUMU (Artık hem X hem Y var)
  const camera = useRef({ x: 0, y: 0 });
  
  // Animasyon sayacı (Tıkırdamayı önlemek için gameLoop içinde kullanılacak)
  const animTimerRef = useRef(0);

  const requestRef = useRef<number>();
  const [targets, setTargets] = useState<{id: number, x: number, y: number, color: string, type: 'food'}[]>([]);
  const wasInWater = useRef(true);

  // --- EKRAN YÖNÜ KONTROLÜ ---
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  //NOT: Eski useEffect tabanlı animasyon motoru silindi. Artık gameLoop içinde.

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

  // --- INPUT YÖNETİMİ ---
  const handleInput = (e: any) => {
    if (!isPlaying) return;
    
    let rawX, rawY;
    if (e.touches && e.touches.length > 0) {
      rawX = e.touches[0].clientX;
      rawY = e.touches[0].clientY;
    } else {
      rawX = e.clientX;
      rawY = e.clientY;
    }

    // Mouse pozisyonunu ekranın ortasına göre ayarla (Merkez 0,0 olsun)
    const screenW = isPortrait ? window.innerHeight : window.innerWidth;
    const screenH = isPortrait ? window.innerWidth : window.innerHeight;
    
    let screenMouseX, screenMouseY;

    if (isPortrait) {
        screenMouseX = rawY - screenW / 2;
        screenMouseY = (window.innerWidth - rawX) - screenH / 2;
    } else {
        screenMouseX = rawX - screenW / 2;
        screenMouseY = rawY - screenH / 2;
    }

    // Mouse'un dünya üzerindeki hedef konumu = Kamera Konumu + Ekran Merkezine Uzaklık
    mousePos.current = { 
        x: camera.current.x + screenMouseX,
        y: camera.current.y + screenMouseY
    };
  };

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    
    // Başlangıçta her şey 0 noktasında
    fishPhys.current = { x: 0, y: 500, vx: 0, vy: 0, rotation: 0, scaleY: 1, scaleX: 1 };
    camera.current = { x: 0, y: 500 };
    mousePos.current = { x: 0, y: 500 };
    animTimerRef.current = 0;

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
    setCurrentFrameIndex(0); 
    setTimeout(() => setIsEating(false), 300);
  };

  // --- OYUN DÖNGÜSÜ (GÜNCELLENDİ) ---
  const gameLoop = () => {
    const screenW = isPortrait ? window.innerHeight : window.innerWidth;
    const screenH = isPortrait ? window.innerWidth : window.innerHeight;

    // --- 1. YENİ ANİMASYON MOTORU (SENKRONİZE) ---
    // Her döngü yaklaşık 16ms sürer (60fps). Bunu sayaca ekliyoruz.
    animTimerRef.current += 16.67; 
    // 50ms (saniyede 20 kare) geçince resmi değiştir.
    if (animTimerRef.current >= 50) {
        setCurrentFrameIndex(prev => prev + 1);
        animTimerRef.current = 0; // Sayacı sıfırla
    }

    // --- 2. FİZİK ---
    const inWater = fishPhys.current.y > SEA_LEVEL;
    if (wasInWater.current && !inWater) fishPhys.current.vy *= 0.5; 
    wasInWater.current = inWater;

    if (inWater) {
      const dx = mousePos.current.x - fishPhys.current.x;
      const dy = mousePos.current.y - fishPhys.current.y;

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

    // --- 3. KAMERA TAKİBİ (MERKEZCİL SİSTEM) ---
    // Kamera balığın tam olduğu yere gitmek ister
    const targetCamX = fishPhys.current.x;
    const targetCamY = fishPhys.current.y;

    // X ekseninde daha sıkı takip et (0.1 yerine 0.15 yaptım, balık daha ortada kalır)
    camera.current.x += (targetCamX - camera.current.x) * 0.15;
    // Y ekseninde biraz daha yumuşak takip et (derinlik hissi için)
    camera.current.y += (targetCamY - camera.current.y) * 0.1;

    // Kamera Y sınırları
    if (camera.current.y < screenH / 2) camera.current.y = screenH / 2;
    if (camera.current.y > WORLD_HEIGHT - screenH / 2) camera.current.y = WORLD_HEIGHT - screenH / 2;


    // --- 4. DÜNYA YÖNETİMİ ---
    setChunks(prevChunks => {
        // Ekranın sağ kenarının dünya koordinatı
        const currentRightEdge = camera.current.x + screenW / 2;
        const lastChunk = prevChunks[prevChunks.length - 1];
        
        if (lastChunk && lastChunk.x < currentRightEdge + CHUNK_WIDTH) {
            return [...prevChunks, generateChunk(lastChunk.x + CHUNK_WIDTH)];
        }
        // Ekranın sol kenarının dünya koordinatı
        const currentLeftEdge = camera.current.x - screenW / 2;
        if (prevChunks[0].x < currentLeftEdge - CHUNK_WIDTH * 2) {
             return prevChunks.slice(1);
        }
        return prevChunks;
    });

    // --- 5. GÖRSEL EFEKTLER (Dönme, Esneme) ---
    if (Math.abs(fishPhys.current.vx) > 0.1) {
        setFaceDirection(fishPhys.current.vx > 0 ? 1 : -1);
    }
    
    let angleRad = Math.atan2(fishPhys.current.vy, Math.abs(fishPhys.current.vx));
    let angleDeg = angleRad * (180 / Math.PI);
    let targetRotation = angleDeg * faceDirection;
    fishPhys.current.rotation += (targetRotation - fishPhys.current.rotation) * 0.1;

    const totalSpeed = Math.sqrt(fishPhys.current.vx**2 + fishPhys.current.vy**2);
    const stretch = Math.min(totalSpeed * 0.02, 0.3); 
    fishPhys.current.scaleX = 1 + stretch;
    fishPhys.current.scaleY = 1 - stretch * 0.5;

    // --- 6. SINIRLAR ---
    // X sınırı kaldırıldı (Sonsuz dünya)
    if (fishPhys.current.y > WORLD_HEIGHT - 10) { 
        fishPhys.current.y = WORLD_HEIGHT - 10; 
        fishPhys.current.vy = 0; 
    }

    // --- 7. HEDEFLER ---
    setTargets(prev => {
        if (Math.random() < 0.015) { 
            const spawnRight = Math.random() > 0.5; 
            // Hedefleri kameranın görüş alanının hemen dışına koy
            const spawnX = camera.current.x + (spawnRight ? screenW/2 + 200 : -screenW/2 - 200);
            return [...prev, {
                id: Date.now(),
                x: spawnX,
                y: Math.random() * (WORLD_HEIGHT - SEA_LEVEL - ZEMIN_YUKSEKLIK - 100) + SEA_LEVEL + 100, 
                color: ['#ef4444', '#22c55e', '#eab308'][Math.floor(Math.random() * 3)],
                type: 'food'
            }];
        }
        return prev
            .filter(t => {
                const dist = Math.hypot(fishPhys.current.x - t.x, fishPhys.current.y - t.y);
                if (dist < 100) { 
                    triggerEatAnimation();
                    setScore(s => s + 10);
                    // Konfeti ekranın ortasında patlasın
                    confetti({ origin: { x: 0.5, y: 0.5 }, particleCount: 20, spread: 40 });
                    return false; 
                }
                // Kameradan çok uzaklaşanları sil
                return Math.abs(t.x - camera.current.x) < screenW + 1000;
            });
    });

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    if (isPlaying) requestRef.current = requestAnimationFrame(gameLoop);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isPlaying]);

  const getCurrentImage = () => {
    if (isEating) {
        return EAT_FRAMES[currentFrameIndex % EAT_FRAMES.length];
    } else {
        return SWIM_FRAMES[currentFrameIndex % SWIM_FRAMES.length];
    }
  };

  // --- ANA RENDER ---
  return (
    <div className="fixed inset-0 bg-black overflow-hidden touch-none select-none flex items-center justify-center">
        
        {/* --- OYUN KONTEYNERİ --- */}
        <div 
            className="relative overflow-hidden bg-sky-200 shadow-2xl"
            style={{
                width: isPortrait ? '100vh' : '100vw',
                height: isPortrait ? '100vw' : '100vh',
                position: 'absolute',
                left: '50%', top: '50%',
                transform: isPortrait ? 'translate(-50%, -50%) rotate(90deg)' : 'translate(-50%, -50%)',
                zIndex: 10
            }}
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

            {/* === DÜNYA (Kamera X ve Y'ye göre kayıyor) === */}
            <div 
                className="absolute w-full top-0 left-0 will-change-transform"
                style={{ 
                    height: WORLD_HEIGHT,
                    // İŞTE BÜYÜK DEĞİŞİKLİK: Hem X hem Y kayıyor.
                    // Ekranın ortası referans alındığı için screenW/2 ve screenH/2 ekliyoruz.
                    transform: `translate(
                        ${-camera.current.x + (isPortrait ? window.innerHeight : window.innerWidth) / 2}px, 
                        ${-camera.current.y + (isPortrait ? window.innerWidth : window.innerHeight) / 2}px
                    )` 
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
                    {/* SU YÜZEYİ (Paralaks efekti için daha yavaş kayıyor: * 0.5) */}
                    <div 
                        className="absolute top-0 left-0 w-full h-16 pointer-events-none"
                        style={{ 
                            backgroundImage: `url(${suYuzeyiImg})`,
                            backgroundRepeat: 'repeat-x',
                            backgroundSize: 'auto 100%',
                            backgroundPositionX: `${camera.current.x * 0.5}px`, 
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
                                transform: `translateX(${chunk.x}px)` // Artık sadece kendi X'i
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
                            // Balık artık dünya koordinatlarında duruyor.
                            // Dünya kameraya göre kaydığı için balık ekranda sabit görünecek.
                            left: fishPhys.current.x,
                            top: fishPhys.current.y,
                            width: 160, 
                            height: 120,
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
                            src={getCurrentImage()} 
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
    </div>
  );
  }
                           
