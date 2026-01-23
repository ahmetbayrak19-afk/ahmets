import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- GÖRSELLER ---
import d1 from './d1.png'; import d2 from './d2.png'; import d3 from './d3.png';
import d4 from './d4.png'; import d5 from './d5.png'; import d6 from './d6.png';
import d7 from './d7.png'; import d8 from './d8.png'; 
import balikye1 from './balikye1.png'; import balikye2 from './balikye2.png';
import balikye3 from './balikye3.png'; import balikye4 from './balikye4.png';

// SENİN İSTEDİĞİN DOSYA (İsmi su_doku.png olarak değiştirdim dediğin için)
import suDokuImg from './su_doku.png'; 

import altzemin1 from './altzemin1.png'; import altzemin2 from './altzemin2.png';
import ustzemin1 from './ustzemin1.png'; import ustzemin2 from './ustzemin2.png';
import ustzemin3 from './ustzemin3.png';

const SWIM_FRAMES = [d1, d2, d3, d4, d3, d2, d1, d5, d6, d7, d8, d7, d6, d5];
const EAT_FRAMES = [balikye1, balikye2, balikye3, balikye4];

export default function EslemeGame({ onClose }: { onClose: () => void }) {
  // --- DÜNYA AYARLARI ---
  const CHUNK_COUNT = 20;       
  const CHUNK_WIDTH = 2000; 
  const WORLD_WIDTH = CHUNK_COUNT * CHUNK_WIDTH; 
  const WORLD_HEIGHT = 2000; // Derinlik kısaltıldı
  const SEA_LEVEL = 500;     
  const ZEMIN_YUKSEKLIK = 350;

  // --- FİZİK ---
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
  const [surfaceTilt, setSurfaceTilt] = useState(0); 

  // Balık başlangıç konumu (Yüzeyin biraz altında başlasın)
  const fishPhys = useRef({ x: WORLD_WIDTH / 2, y: 800, vx: 0, vy: 0, rotation: 0, scaleY: 1, scaleX: 1 });
  const mousePos = useRef({ x: WORLD_WIDTH / 2, y: 800 });
  const camera = useRef({ x: WORLD_WIDTH / 2, y: 0 });
  const animTimerRef = useRef(0);
  const requestRef = useRef<number>();
  const [targets, setTargets] = useState<{id: number, x: number, y: number, color: string, type: 'food'}[]>([]);
  const wasInWater = useRef(true);

  // Ekran yönü kontrolü
  useEffect(() => {
    const checkOrientation = () => setIsPortrait(window.innerHeight > window.innerWidth);
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const initWorld = () => {
      const newChunks = [];
      for (let i = 0; i < CHUNK_COUNT; i++) {
        const baseImg = Math.random() > 0.5 ? altzemin1 : altzemin2;
        let overlayImg = null;
        const rand = Math.random();
        if (rand > 0.75) overlayImg = ustzemin1;
        else if (rand > 0.50) overlayImg = ustzemin2;
        else if (rand > 0.25) overlayImg = ustzemin3;

        newChunks.push({
            id: i,
            x: i * CHUNK_WIDTH, 
            base: baseImg,
            overlay: overlayImg
        });
      }
      setChunks(newChunks);
  };

  const handleInput = (e: any) => {
    if (!isPlaying) return;
    let rawX, rawY;
    if (e.touches && e.touches.length > 0) {
      rawX = e.touches[0].clientX; rawY = e.touches[0].clientY;
    } else {
      rawX = e.clientX; rawY = e.clientY;
    }
    
    // YATAY MOD HESABI (KRİTİK DÜZELTME)
    // Telefon yan tutulduğunda X ve Y eksenleri değişir.
    // CSS ile 90 derece döndürdüğümüz için mouse koordinatlarını da döndürmeliyiz.
    const screenW = isPortrait ? window.innerHeight : window.innerWidth;
    const screenH = isPortrait ? window.innerWidth : window.innerHeight;
    
    let screenMouseX, screenMouseY;

    if (isPortrait) {
        // Dikey tutarken (Ama oyun yatay çalışıyor)
        // Dokunmatik Y -> Oyun X'i
        // Dokunmatik X -> Oyun Y'si (Ters)
        screenMouseX = rawY - screenW / 2;
        screenMouseY = (window.innerWidth - rawX) - screenH / 2;
    } else {
        // Zaten yatay tutuyorsa
        screenMouseX = rawX - screenW / 2;
        screenMouseY = rawY - screenH / 2;
    }
    
    mousePos.current = { x: camera.current.x + screenMouseX, y: camera.current.y + screenMouseY };
  };

  const startGame = () => {
    initWorld(); 
    setIsPlaying(true); setScore(0);
    fishPhys.current = { x: WORLD_WIDTH / 2, y: 800, vx: 0, vy: 0, rotation: 0, scaleY: 1, scaleX: 1 };
    camera.current = { x: WORLD_WIDTH / 2, y: 800 }; 
    mousePos.current = { x: WORLD_WIDTH / 2, y: 800 };
    animTimerRef.current = 0; setTargets([]);
  };

  const triggerEatAnimation = () => {
    setIsEating(true); setCurrentFrameIndex(0); setTimeout(() => setIsEating(false), 300);
  };

  const gameLoop = () => {
    const screenW = isPortrait ? window.innerHeight : window.innerWidth;
    const screenH = isPortrait ? window.innerWidth : window.innerHeight;

    animTimerRef.current += 16.67; 
    if (animTimerRef.current >= 50) { setCurrentFrameIndex(prev => prev + 1); animTimerRef.current = 0; }

    const inWater = fishPhys.current.y > SEA_LEVEL;
    if (wasInWater.current && !inWater) fishPhys.current.vy *= 0.5; 
    wasInWater.current = inWater;

    // Fizik Hesapları
    if (inWater) {
      const dx = mousePos.current.x - fishPhys.current.x; const dy = mousePos.current.y - fishPhys.current.y;
      fishPhys.current.vx += dx * FOLLOW_SPEED; fishPhys.current.vy += dy * FOLLOW_SPEED;
      fishPhys.current.vx *= WATER_FRICTION; fishPhys.current.vy *= WATER_FRICTION;
      const currentSpeed = Math.sqrt(fishPhys.current.vx**2 + fishPhys.current.vy**2);
      if (currentSpeed > MAX_SPEED) { const ratio = MAX_SPEED / currentSpeed; fishPhys.current.vx *= ratio; fishPhys.current.vy *= ratio; }
    } else {
      fishPhys.current.vy += GRAVITY; fishPhys.current.vx *= AIR_RESISTANCE; 
    }
    fishPhys.current.x += fishPhys.current.vx; fishPhys.current.y += fishPhys.current.vy;

    // Siyah Duvar Sınırları
    if (fishPhys.current.x < 50) { fishPhys.current.x = 50; fishPhys.current.vx = 0; }
    if (fishPhys.current.x > WORLD_WIDTH - 50) { fishPhys.current.x = WORLD_WIDTH - 50; fishPhys.current.vx = 0; }
    if (fishPhys.current.y > WORLD_HEIGHT - 50) { fishPhys.current.y = WORLD_HEIGHT - 50; fishPhys.current.vy = 0; }

    // Kamera Takibi
    camera.current.x += (fishPhys.current.x - camera.current.x) * 0.15;
    camera.current.y += (fishPhys.current.y - camera.current.y) * 0.1;
    // Kamera sınırları
    if (camera.current.y < screenH / 2) camera.current.y = screenH / 2;
    if (camera.current.y > WORLD_HEIGHT - screenH / 2) camera.current.y = WORLD_HEIGHT - screenH / 2;
    if (camera.current.x < 0) camera.current.x = 0;
    if (camera.current.x > WORLD_WIDTH) camera.current.x = WORLD_WIDTH;

    // --- TILT HESABI (YUKARI ÇIKTIKÇA DARALMA) ---
    // Balık yüzeye (SEA_LEVEL) ne kadar yakınsa, o kadar çok eğim veriyoruz.
    const distToSurface = Math.max(0, fishPhys.current.y - SEA_LEVEL);
    const maxTiltDist = 800; 
    const surfaceFactor = 1 - Math.min(1, distToSurface / maxTiltDist);
    // Yüzeyde 80 derece yatık (ince çizgi gibi), derinde 0 derece (geniş)
    setSurfaceTilt(surfaceFactor * 80); 

    // Yön ve Dönüş
    if (Math.abs(fishPhys.current.vx) > 0.1) setFaceDirection(fishPhys.current.vx > 0 ? 1 : -1);
    let angleRad = Math.atan2(fishPhys.current.vy, Math.abs(fishPhys.current.vx));
    let angleDeg = angleRad * (180 / Math.PI);
    let targetRotation = angleDeg * faceDirection;
    fishPhys.current.rotation += (targetRotation - fishPhys.current.rotation) * 0.1;
    // Balığın yüzeyden dışarı bakarken çok dönmemesi için (Ters dönmesin)
    if (!inWater && Math.abs(fishPhys.current.rotation) > 60) {
         fishPhys.current.rotation *= 0.9;
    }

    const totalSpeed = Math.sqrt(fishPhys.current.vx**2 + fishPhys.current.vy**2);
    const stretch = Math.min(totalSpeed * 0.02, 0.3); 
    fishPhys.current.scaleX = 1 + stretch; fishPhys.current.scaleY = 1 - stretch * 0.5;

    // Yem Üretimi ve Yeme
    setTargets(prev => {
        if (Math.random() < 0.03) { 
            const spawnX = Math.random() * WORLD_WIDTH;
            return [...prev, { id: Date.now(), x: spawnX, y: Math.random() * (WORLD_HEIGHT - SEA_LEVEL - ZEMIN_YUKSEKLIK - 100) + SEA_LEVEL + 100, color: ['#ef4444', '#22c55e', '#eab308'][Math.floor(Math.random() * 3)], type: 'food' }];
        }
        return prev.filter(t => {
            if (Math.hypot(fishPhys.current.x - t.x, fishPhys.current.y - t.y) < 120) { 
                triggerEatAnimation(); setScore(s => s + 10); confetti({ origin: { x: 0.5, y: 0.5 }, particleCount: 20, spread: 40 }); return false; 
            }
            return true;
        });
    });
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => { if (isPlaying) requestRef.current = requestAnimationFrame(gameLoop); return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); }; }, [isPlaying]);
  const getCurrentImage = () => isEating ? EAT_FRAMES[currentFrameIndex % EAT_FRAMES.length] : SWIM_FRAMES[currentFrameIndex % SWIM_FRAMES.length];

  return (
    <div className="fixed inset-0 bg-black overflow-hidden touch-none select-none flex items-center justify-center">
        {/* ANA OYUN KUTUSU (90 Derece Dönmüş Hali) */}
        <div 
            className="relative overflow-hidden shadow-2xl"
            style={{
                // Telefon dik olsa bile oyunu YATAY zorluyoruz
                width: isPortrait ? '100vh' : '100vw', 
                height: isPortrait ? '100vw' : '100vh',
                position: 'absolute', 
                left: '50%', top: '50%',
                // Ortala ve Döndür
                transform: isPortrait ? 'translate(-50%, -50%) rotate(90deg)' : 'translate(-50%, -50%)',
                zIndex: 10,
                backgroundColor: '#87CEEB',
                perspective: '1200px' // 3D Derinlik Efekti için Şart
            }}
            onMouseMove={handleInput} onTouchMove={handleInput}
        >
            {/* KAMERA HAREKET KATMANI */}
            <div 
                className="absolute w-full top-0 left-0 will-change-transform"
                style={{ 
                    height: WORLD_HEIGHT,
                    // Kamera konumuna göre tüm dünyayı kaydır
                    transform: `translate(${-camera.current.x + (isPortrait ? window.innerHeight : window.innerWidth) / 2}px, ${-camera.current.y + (isPortrait ? window.innerWidth : window.innerHeight) / 2}px)` 
                }}
            >
                {/* 1. SİYAH DUVARLAR (En Altta Kalsın) */}
                <div className="absolute top-0 bottom-0 bg-black" style={{ left: -5000, width: 5000, zIndex: 100 }} />
                <div className="absolute top-0 bottom-0 bg-black" style={{ left: WORLD_WIDTH, width: 5000, zIndex: 100 }} />

                {/* 2. GÖKYÜZÜ (Sabit) */}
                <div style={{ height: SEA_LEVEL + 500 }} className="w-[200%] absolute top-[-500px] -left-1/2 bg-sky-200" />

                {/* 3. DENİZ ALANI (Maviden Siyaha Gradyan) */}
                <div 
                    className="absolute left-0 w-full"
                    style={{
                        top: SEA_LEVEL,
                        height: WORLD_HEIGHT - SEA_LEVEL,
                        // Aşağı doğru koyulaşan renk
                        background: 'linear-gradient(to bottom, #4fc3f7 0%, #01579b 30%, #000000 100%)',
                        zIndex: 0
                    }}
                >
                    {/* 4. SENİN SU YÜZEYİ RESMİN (Tilt Efekti Burada) */}
                    <div 
                        className="absolute w-full top-0 left-0 origin-top"
                        style={{
                            height: 600, // Resmin boyu
                            // surfaceTilt arttıkça görsel X ekseninde arkaya yatar
                            transform: `rotateX(${surfaceTilt}deg)`,
                            zIndex: 35 // Balığın arkası, zeminin önü
                        }}
                    >
                        {/* Su Dokusu (su_doku.png) */}
                        <div 
                            className="w-full h-full opacity-70"
                            style={{
                                backgroundImage: `url(${suDokuImg})`,
                                backgroundRepeat: 'repeat', 
                                backgroundSize: '800px auto', 
                                animation: 'waterFlow 20s linear infinite',
                                mixBlendMode: 'overlay' // Renkle kaynaşsın
                            }}
                        />
                         {/* Parlak Ufuk Çizgisi */}
                         <div className="absolute top-0 w-full h-1 bg-white/80 shadow-[0_0_15px_white]" />
                    </div>

                    {/* 5. KUM ZEMİNLER */}
                    {chunks.map(chunk => (
                        <div key={chunk.id} className="absolute bottom-0 pointer-events-none" style={{ left: chunk.x, width: CHUNK_WIDTH, height: ZEMIN_YUKSEKLIK, zIndex: 10 }}>
                            <div className="absolute bottom-0 left-0 w-full h-full" style={{ backgroundImage: `url(${chunk.base})`, backgroundSize: '100% 100%', filter: 'brightness(0.9)' }} />
                        </div>
                    ))}
                    
                    {/* 6. YEMLER */}
                    {targets.map(t => (
                        <div key={t.id} className="absolute w-12 h-12 rounded-full shadow-lg border-2 border-white/50 flex items-center justify-center animate-pulse" style={{ left: t.x, top: t.y, backgroundColor: t.color, zIndex: 30 }}></div>
                    ))}

                    {/* 7. BALIK (EN ÖNEMLİSİ: Z-Index 50 ile en önde) */}
                    {isPlaying && (
                        <div className="absolute will-change-transform" style={{ left: fishPhys.current.x, top: fishPhys.current.y, width: 160, height: 120, zIndex: 50, transform: (() => { const depthRatio = Math.max(0, (fishPhys.current.y - SEA_LEVEL) / (WORLD_HEIGHT - SEA_LEVEL)); const depthScale = 1 + (depthRatio * 0.6); return `translate(-50%, -50%) rotate(${fishPhys.current.rotation}deg) scale(${faceDirection * fishPhys.current.scaleX * depthScale}, ${fishPhys.current.scaleY * depthScale})`; })() }}>
                            <img src={getCurrentImage()} alt="Karakter" className="w-full h-full object-contain drop-shadow-2xl" />
                        </div>
                    )}

                    {/* 8. YOSUNLAR (Z-Index 55: Balığın da önünde) */}
                    {chunks.map(chunk => chunk.overlay && (
                        <div key={`overlay-${chunk.id}`} className="absolute bottom-0 pointer-events-none" style={{ left: chunk.x, width: CHUNK_WIDTH, height: ZEMIN_YUKSEKLIK, zIndex: 55 }}>
                            <div className="absolute bottom-0 left-0 w-full h-full" style={{ backgroundImage: `url(${chunk.overlay})`, backgroundSize: '100% 100%', transformOrigin: 'bottom center', zIndex: 55, filter: 'drop-shadow(5px 5px 10px rgba(0,0,0,0.5))' }} />
                        </div>
                    ))}
                </div>

            </div>

            {/* UI - Skor vs */}
            <div className="fixed top-5 left-5 bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-xl border-4 border-orange-400 z-[100]"><span className="font-black text-2xl text-orange-600">SKOR: {score}</span></div>
            <button onClick={onClose} className="fixed top-5 right-5 z-[100] bg-white p-2 rounded-full shadow-lg hover:scale-110 transition"><XCircle className="text-red-500 w-8 h-8" /></button>
            {!isPlaying && (
                <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={startGame} className="bg-orange-500 text-white px-12 py-6 rounded-3xl font-black text-4xl shadow-orange-500/50 shadow-2xl flex items-center gap-4 border-b-8 border-orange-700 active:border-b-0 active:translate-y-2 transition-all"><Play size={40} fill="currentColor" /> BAŞLA</motion.button>
                </div>
            )}
            
            <style>{`
                @keyframes waterFlow { 0% { background-position: 0 0; } 100% { background-position: 0 800px; } }
            `}</style>
        </div>
    </div>
  );
                                                                                                      }
                  
