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

// YENİ EKLENEN SU DOKUSU (Senin gönderdiğin mavi resim)
import suDokuImg from './su_doku.png'; // 1000095257.png dosyasının adı bu olsun

import altzemin1 from './altzemin1.png'; import altzemin2 from './altzemin2.png';
import ustzemin1 from './ustzemin1.png'; import ustzemin2 from './ustzemin2.png';
import ustzemin3 from './ustzemin3.png';

const SWIM_FRAMES = [d1, d2, d3, d4, d3, d2, d1, d5, d6, d7, d8, d7, d6, d5];
const EAT_FRAMES = [balikye1, balikye2, balikye3, balikye4];

export default function EslemeGame({ onClose }: { onClose: () => void }) {
  // --- AYARLAR ---
  const WORLD_HEIGHT = 4000; // Dünyayı biraz daha derinleştirdik
  const SEA_LEVEL = 500;     
  const ZEMIN_YUKSEKLIK = 350;
  const CHUNK_WIDTH = 2000; 

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

  // 3D TILT EFEKTİ İÇİN STATE
  const [viewTilt, setViewTilt] = useState(0); // 0 (Düz) - 45 (Yatık) arası

  const fishPhys = useRef({ x: 0, y: 600, vx: 0, vy: 0, rotation: 0, scaleY: 1, scaleX: 1 });
  const mousePos = useRef({ x: 0, y: 600 });
  const camera = useRef({ x: 0, y: 0 });
  const animTimerRef = useRef(0);
  const requestRef = useRef<number>();
  const [targets, setTargets] = useState<{id: number, x: number, y: number, color: string, type: 'food'}[]>([]);
  const wasInWater = useRef(true);

  useEffect(() => {
    const checkOrientation = () => setIsPortrait(window.innerHeight > window.innerWidth);
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const generateChunk = (xPos: number) => {
    const baseImg = Math.random() > 0.5 ? altzemin1 : altzemin2;
    let overlayImg = null;
    const rand = Math.random();
    if (rand > 0.75) overlayImg = ustzemin1;
    else if (rand > 0.50) overlayImg = ustzemin2;
    else if (rand > 0.25) overlayImg = ustzemin3;
    return { id: Date.now() + Math.random(), x: xPos, base: baseImg, overlay: overlayImg };
  };

  const handleInput = (e: any) => {
    if (!isPlaying) return;
    let rawX, rawY;
    if (e.touches && e.touches.length > 0) {
      rawX = e.touches[0].clientX; rawY = e.touches[0].clientY;
    } else {
      rawX = e.clientX; rawY = e.clientY;
    }
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
    mousePos.current = { x: camera.current.x + screenMouseX, y: camera.current.y + screenMouseY };
  };

  const startGame = () => {
    setIsPlaying(true); setScore(0);
    fishPhys.current = { x: 0, y: 800, vx: 0, vy: 0, rotation: 0, scaleY: 1, scaleX: 1 };
    camera.current = { x: 0, y: 800 }; mousePos.current = { x: 0, y: 800 };
    animTimerRef.current = 0; setTargets([]);
    setChunks([generateChunk(-CHUNK_WIDTH), generateChunk(0), generateChunk(CHUNK_WIDTH)]);
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

    // --- KAMERA ---
    camera.current.x += (fishPhys.current.x - camera.current.x) * 0.15;
    camera.current.y += (fishPhys.current.y - camera.current.y) * 0.1;
    
    // Kamera Sınırları
    if (camera.current.y < screenH / 2) camera.current.y = screenH / 2;
    if (camera.current.y > WORLD_HEIGHT - screenH / 2) camera.current.y = WORLD_HEIGHT - screenH / 2;

    // --- 3D TILT HESAPLAMA (KRİTİK BÖLÜM) ---
    // Balık su yüzeyine (SEA_LEVEL) yaklaştıkça Tilt açısı artar.
    // Derinlik 1500px'den fazlaysa tilt 0 olur.
    // Yüzeye geldiğinde tilt 60 dereceye kadar çıkar.
    const distanceToSurface = Math.max(0, fishPhys.current.y - SEA_LEVEL);
    const maxTiltDepth = 1200; // Bu derinlikten sonra düzleşir
    
    // Yüzeye ne kadar yakınız? (0 = çok derin, 1 = yüzeyde)
    const surfaceProximity = 1 - Math.min(1, distanceToSurface / maxTiltDepth);
    
    // Tilt açısını ayarla (0 ile 60 derece arası)
    // Easing ekledik (kareköklü geçiş) daha doğal durur
    const targetTilt = Math.pow(surfaceProximity, 1.5) * 60; 
    setViewTilt(targetTilt);


    setChunks(prevChunks => {
        const currentRightEdge = camera.current.x + screenW / 2;
        const lastChunk = prevChunks[prevChunks.length - 1];
        if (lastChunk && lastChunk.x < currentRightEdge + CHUNK_WIDTH) return [...prevChunks, generateChunk(lastChunk.x + CHUNK_WIDTH)];
        const currentLeftEdge = camera.current.x - screenW / 2;
        if (prevChunks[0].x < currentLeftEdge - CHUNK_WIDTH * 2) return prevChunks.slice(1);
        return prevChunks;
    });

    if (Math.abs(fishPhys.current.vx) > 0.1) setFaceDirection(fishPhys.current.vx > 0 ? 1 : -1);
    let angleRad = Math.atan2(fishPhys.current.vy, Math.abs(fishPhys.current.vx));
    let angleDeg = angleRad * (180 / Math.PI);
    let targetRotation = angleDeg * faceDirection;
    fishPhys.current.rotation += (targetRotation - fishPhys.current.rotation) * 0.1;

    const totalSpeed = Math.sqrt(fishPhys.current.vx**2 + fishPhys.current.vy**2);
    const stretch = Math.min(totalSpeed * 0.02, 0.3); 
    fishPhys.current.scaleX = 1 + stretch; fishPhys.current.scaleY = 1 - stretch * 0.5;

    if (fishPhys.current.y > WORLD_HEIGHT - 10) { fishPhys.current.y = WORLD_HEIGHT - 10; fishPhys.current.vy = 0; }

    setTargets(prev => {
        if (Math.random() < 0.015) { 
            const spawnRight = Math.random() > 0.5; 
            const spawnX = camera.current.x + (spawnRight ? screenW/2 + 200 : -screenW/2 - 200);
            return [...prev, { id: Date.now(), x: spawnX, y: Math.random() * (WORLD_HEIGHT - SEA_LEVEL - ZEMIN_YUKSEKLIK - 100) + SEA_LEVEL + 100, color: ['#ef4444', '#22c55e', '#eab308'][Math.floor(Math.random() * 3)], type: 'food' }];
        }
        return prev.filter(t => {
            if (Math.hypot(fishPhys.current.x - t.x, fishPhys.current.y - t.y) < 100) { 
                triggerEatAnimation(); setScore(s => s + 10); confetti({ origin: { x: 0.5, y: 0.5 }, particleCount: 20, spread: 40 }); return false; 
            }
            return Math.abs(t.x - camera.current.x) < screenW + 1000;
        });
    });
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => { if (isPlaying) requestRef.current = requestAnimationFrame(gameLoop); return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); }; }, [isPlaying]);
  const getCurrentImage = () => isEating ? EAT_FRAMES[currentFrameIndex % EAT_FRAMES.length] : SWIM_FRAMES[currentFrameIndex % SWIM_FRAMES.length];

  return (
    <div className="fixed inset-0 bg-black overflow-hidden touch-none select-none flex items-center justify-center">
        <div 
            className="relative overflow-hidden shadow-2xl"
            style={{
                width: isPortrait ? '100vh' : '100vw', height: isPortrait ? '100vw' : '100vh',
                position: 'absolute', left: '50%', top: '50%',
                transform: isPortrait ? 'translate(-50%, -50%) rotate(90deg)' : 'translate(-50%, -50%)',
                zIndex: 10,
                backgroundColor: '#87CEEB', // Gökyüzü rengi
                // 3D Perspektif için konteyner ayarı
                perspective: '1000px', // Derinlik hissini veren değer
                perspectiveOrigin: 'center center'
            }}
            onMouseMove={handleInput} onTouchMove={handleInput}
        >
            <style>{`
                @keyframes waterShimmer { 0% { transform: translateX(0); } 100% { transform: translateX(-50px); } }
                @keyframes yosunSallan { 0% { transform: skewX(0deg); } 50% { transform: skewX(4deg); } 100% { transform: skewX(0deg); } }
            `}</style>

            {/* KAMERA HAREKETİ (X ve Y) */}
            <div 
                className="absolute w-full top-0 left-0 will-change-transform"
                style={{ 
                    height: WORLD_HEIGHT,
                    transform: `translate(${-camera.current.x + (isPortrait ? window.innerHeight : window.innerWidth) / 2}px, ${-camera.current.y + (isPortrait ? window.innerWidth : window.innerHeight) / 2}px)` 
                }}
            >
                {/* --- KATMAN 1: GÖKYÜZÜ (SABİT) --- */}
                <div style={{ height: SEA_LEVEL + 800 }} className="w-[200%] absolute top-[-500px] -left-1/2">
                    <div className="w-full h-full bg-gradient-to-b from-[#2ebbf5] via-[#a3dff7] to-[#e0f7fa]" />
                </div>

                {/* --- KATMAN 2: DENİZ ARKAPLANI (PERSPEKTİF UYGULANACAK) --- */}
                {/* İşte büyü burada: Sadece Deniz katmanını eğiyoruz! */}
                <div 
                    className="w-full absolute left-0 origin-top will-change-transform"
                    style={{ 
                        top: SEA_LEVEL,
                        height: WORLD_HEIGHT - SEA_LEVEL,
                        // Balık yüzeye yaklaştıkça bu katman arkaya doğru yatar (rotateX)
                        transform: `rotateX(${viewTilt}deg)`,
                        transformStyle: 'preserve-3d',
                        // Senin gönderdiğin resmin renginden (açık mavi) dibe doğru (koyu lacivert) geçiş
                        background: 'linear-gradient(to bottom, #1ca3ec 0%, #006994 30%, #001e36 90%)'
                    }}
                >
                    {/* SU DOKUSU (Senin PNG'n) */}
                    <div 
                        className="absolute top-0 left-0 w-[200%] h-[1500px] pointer-events-none opacity-40 mix-blend-overlay"
                        style={{ 
                            backgroundImage: `url(${suDokuImg})`, 
                            backgroundRepeat: 'repeat', 
                            backgroundSize: '800px auto',
                            // Doku hafifçe kaysın
                            animation: 'waterShimmer 2s linear infinite'
                        }}
                    />

                    {/* ZEMİN (KUM) */}
                    {chunks.map(chunk => (
                        <div key={`base-${chunk.id}`} className="absolute bottom-0 pointer-events-none" style={{ left: 0, width: CHUNK_WIDTH, height: ZEMIN_YUKSEKLIK, transform: `translateX(${chunk.x}px)`, zIndex: 10 }}>
                            <div className="absolute bottom-0 left-0 w-full h-full" style={{ backgroundImage: `url(${chunk.base})`, backgroundSize: '100% 100%', filter: 'brightness(0.7)' }} />
                        </div>
                    ))}
                </div>

                {/* --- KATMAN 3: BALIK VE YEMLER (EĞİLMEYEN KATMAN) --- */}
                {/* Balık eğilmez, hep kameraya bakar (Billboard etkisi) */}
                
                {/* HEDEFLER */}
                {targets.map(t => (
                    <div key={t.id} className="absolute w-12 h-12 rounded-full shadow-lg border-2 border-white/50 flex items-center justify-center animate-pulse" style={{ left: t.x, top: t.y, backgroundColor: t.color, zIndex: 30 }}>
                        <div className="w-4 h-4 bg-white/40 rounded-full blur-sm"></div>
                    </div>
                ))}

                {/* BALIK (Z-INDEX 35: Suyun ve Arkaplanın önünde) */}
                {isPlaying && (
                    <div className="absolute will-change-transform" style={{ left: fishPhys.current.x, top: fishPhys.current.y, width: 160, height: 120, zIndex: 35, transform: (() => { const depthRatio = Math.max(0, (fishPhys.current.y - SEA_LEVEL) / (WORLD_HEIGHT - SEA_LEVEL)); const depthScale = 1 + (depthRatio * 0.6); return `translate(-50%, -50%) rotate(${fishPhys.current.rotation}deg) scale(${faceDirection * fishPhys.current.scaleX * depthScale}, ${fishPhys.current.scaleY * depthScale})`; })() }}>
                        <img src={getCurrentImage()} alt="Karakter" className="w-full h-full object-contain drop-shadow-2xl" />
                    </div>
                )}

                {/* --- KATMAN 4: SU YÜZEYİ ÇİZGİSİ (KESKİN AYRIM) --- */}
                {/* Su ile havanın birleştiği o beyazımsı çizgi */}
                <div 
                    className="absolute left-0 w-full h-2 bg-white/50 blur-sm pointer-events-none"
                    style={{ top: SEA_LEVEL, zIndex: 25, transform: 'translateY(-50%)' }}
                />

                {/* --- KATMAN 5: OTLAR (EN ÖN) --- */}
                {/* Balığı örtsün diye en üste koyduk, ama suyun içinde kalması için top değerine dikkat */}
                {/* NOT: Otları da perspektife sokmak istersek Deniz Arkaplanı div'inin içine almalıyız. 
                    Ama balığın önüne geçmesini istediğimiz için burada tutuyoruz. 
                    Hafif bir opaklık verelim ki balık tamamen kaybolmasın. */}
                <div 
                     className="w-full absolute left-0 pointer-events-none"
                     style={{ top: SEA_LEVEL, height: WORLD_HEIGHT - SEA_LEVEL }}
                >
                    {chunks.map(chunk => chunk.overlay && (
                        <div key={`overlay-${chunk.id}`} className="absolute bottom-0" style={{ left: 0, width: CHUNK_WIDTH, height: ZEMIN_YUKSEKLIK, transform: `translateX(${chunk.x}px)`, zIndex: 40 }}>
                            <div className="absolute bottom-0 left-0 w-full h-full" style={{ backgroundImage: `url(${chunk.overlay})`, backgroundSize: '100% 100%', transformOrigin: 'bottom center', animation: 'yosunSallan 5s infinite ease-in-out', filter: 'drop-shadow(5px 10px 10px rgba(0,0,0,0.8)) brightness(0.7)' }} />
                        </div>
                    ))}
                </div>

            </div>

            {/* UI */}
            <div className="fixed top-5 left-5 bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-xl border-4 border-orange-400 z-[100]"><span className="font-black text-2xl text-orange-600">SKOR: {score}</span></div>
            <button onClick={onClose} className="fixed top-5 right-5 z-[100] bg-white p-2 rounded-full shadow-lg hover:scale-110 transition"><XCircle className="text-red-500 w-8 h-8" /></button>
            {!isPlaying && (
                <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={startGame} className="bg-orange-500 text-white px-12 py-6 rounded-3xl font-black text-4xl shadow-orange-500/50 shadow-2xl flex items-center gap-4 border-b-8 border-orange-700 active:border-b-0 active:translate-y-2 transition-all"><Play size={40} fill="currentColor" /> BAŞLA</motion.button>
                </div>
            )}
        </div>
    </div>
  );
      }
                                                              
