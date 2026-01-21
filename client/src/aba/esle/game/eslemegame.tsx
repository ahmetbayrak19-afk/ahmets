import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- GÖRSELLERİ İÇERİ AKTAR ---
// Dosyalar aynı klasörde olduğu için direkt çağırıyoruz
import balikNormalImg from './balik.png';
import balikYemeImg from './balik_yeme.png';
import suYuzeyiImg from './su_yuzeyi.png';
import zeminImg from './zemin.png';

export default function EslemeGame({ onClose }: { onClose: () => void }) {
  // --- OYUN AYARLARI ---
  const WORLD_HEIGHT = 3000; // Denizin derinliği (Piksel cinsinden)
  const SEA_LEVEL = 400;     // Su yüzeyinin başladığı Y koordinatı
  const GRAVITY = 0.5;       // Havadaki yerçekimi
  const WATER_DRAG = 0.08;   // Suyun sürtünmesi (Akışkanlık hissi)
  const SCROLL_SPEED = 4;    // Yanal akış hızı

  // --- STATE'LER ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  
  // Balık Görsel Durumu
  const [isEating, setIsEating] = useState(false); // Ağzı açık mı?
  const [faceDirection, setFaceDirection] = useState(1); // 1: Sağa, -1: Sola

  // Fiziksel Referanslar (React render'ını yormamak için ref kullanıyoruz)
  const fishPhys = useRef({ x: 200, y: 500, vx: 0, vy: 0, rotation: 0, scaleY: 1, scaleX: 1 });
  const mousePos = useRef({ x: 200, y: 500 });
  const cameraY = useRef(0);
  const backgroundX = useRef(0);
  const requestRef = useRef<number>();

  // Hedefler (Şimdilik renkli daireler, sonra resim eklenebilir)
  const [targets, setTargets] = useState<{id: number, x: number, y: number, color: string, type: 'food'|'enemy'}[]>([]);

  // --- MOUSE / DOKUNMATİK TAKİBİ ---
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
    // Mouse pozisyonunu kaydet (Ekran koordinatı)
    mousePos.current = { x: clientX, y: clientY };
  };

  // --- OYUNU BAŞLAT ---
  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    fishPhys.current = { x: window.innerWidth / 2, y: 500, vx: 0, vy: 0, rotation: 0, scaleY: 1, scaleX: 1 };
    setTargets([]);
  };

  // --- YEMEK YEME EFEKTİ ---
  const triggerEatAnimation = () => {
    setIsEating(true);
    // 0.2 saniye sonra ağzını kapat
    setTimeout(() => setIsEating(false), 200);
  };

  // --- ANA OYUN DÖNGÜSÜ (60 FPS) ---
  const gameLoop = () => {
    if (gameOver) return;

    // 1. Balık Hangi Ortamda?
    // Balığın Y pozisyonu SEA_LEVEL'dan büyükse sudadır.
    const inWater = fishPhys.current.y > SEA_LEVEL;

    // 2. Hareket Mantığı
    if (inWater) {
      // --- SU FİZİĞİ ---
      // Hedefe doğru yumuşakça git (Lerp)
      // Kamera kaydığı için mouse pozisyonuna kamerayı eklememiz lazım
      const targetWorldY = mousePos.current.y + cameraY.current; 
      
      const dx = mousePos.current.x - fishPhys.current.x; // X ekseninde sadece ekran genişliğinde hareket
      const dy = targetWorldY - fishPhys.current.y;

      fishPhys.current.vx += dx * 0.05;
      fishPhys.current.vy += dy * 0.05;
      
      // Sürtünme (Hızı yavaşlatır)
      fishPhys.current.vx *= (1 - WATER_DRAG);
      fishPhys.current.vy *= (1 - WATER_DRAG);

      // Yön Bulma (Sağa mı sola mı bakıyor?)
      if (Math.abs(fishPhys.current.vx) > 1) {
          setFaceDirection(fishPhys.current.vx > 0 ? 1 : -1);
      }

    } else {
      // --- HAVA FİZİĞİ ---
      fishPhys.current.vy += GRAVITY; // Yerçekimi uygula
      fishPhys.current.vx *= 0.99; // Havada hafif sürtünme
    }

    // Pozisyonu Güncelle
    fishPhys.current.x += fishPhys.current.vx;
    fishPhys.current.y += fishPhys.current.vy;

    // Sınırlar (Dibe Çarpma)
    if (fishPhys.current.y > WORLD_HEIGHT - 100) {
        fishPhys.current.y = WORLD_HEIGHT - 100;
        fishPhys.current.vy = 0;
    }

    // 3. JELİBON EFEKTİ (Squash & Stretch)
    // Hıza göre balığı esnet
    const speed = Math.sqrt(fishPhys.current.vx**2 + fishPhys.current.vy**2);
    const stretch = Math.min(speed * 0.02, 0.3); // Maksimum %30 esneme
    
    // Hareket yönüne göre dönme açısı
    let angle = Math.atan2(fishPhys.current.vy, fishPhys.current.vx) * (180 / Math.PI);
    // Sola bakıyorsa açıyı düzelt
    if (faceDirection === -1) { 
        angle = angle - 180; 
        angle = angle * -1; // Ters dönmemesi için
    }

    fishPhys.current.rotation = angle * 0.5; // Açıyı yumuşat
    fishPhys.current.scaleX = 1 + stretch; // Hızlanınca uzasın
    fishPhys.current.scaleY = 1 - stretch * 0.5; // İncelin

    // 4. KAMERA SİSTEMİ (Deep Sea Camera)
    // Kamera balığı dikeyde ortalamaya çalışsın
    const targetCamY = fishPhys.current.y - window.innerHeight / 2;
    // Kamera sınırları (Dünyanın dışına çıkmasın)
    cameraY.current += (targetCamY - cameraY.current) * 0.1; // Yumuşak takip
    if (cameraY.current < 0) cameraY.current = 0;
    if (cameraY.current > WORLD_HEIGHT - window.innerHeight) cameraY.current = WORLD_HEIGHT - window.innerHeight;

    // 5. SONSUZ DÜNYA AKIŞI
    backgroundX.current -= SCROLL_SPEED;

    // 6. HEDEF YÖNETİMİ (Basit çarpışma)
    setTargets(prev => {
        // Yeni hedef ekleme şansı
        if (Math.random() < 0.02) {
            return [...prev, {
                id: Date.now(),
                x: window.innerWidth + 100, // Sağdan girsin
                y: Math.random() * (WORLD_HEIGHT - SEA_LEVEL) + SEA_LEVEL + 100, // Suda doğsun
                color: ['#ef4444', '#22c55e', '#eab308'][Math.floor(Math.random() * 3)],
                type: 'food'
            }];
        }
        
        // Hareket ve Temizlik
        return prev
            .map(t => ({...t, x: t.x - SCROLL_SPEED}))
            .filter(t => {
                // Çarpışma Kontrolü (Basit mesafe)
                // Balığın ekran X'i ile Hedefin ekran X'ini karşılaştır
                const dist = Math.hypot(fishPhys.current.x - t.x, fishPhys.current.y - t.y);
                
                if (dist < 60) {
                    // YENDİ!
                    triggerEatAnimation();
                    setScore(s => s + 10);
                    confetti({
                         origin: { x: mousePos.current.x / window.innerWidth, y: 0.5 },
                         particleCount: 20,
                         spread: 30
                    });
                    return false; // Listeden sil
                }
                return t.x > -100; // Ekrandan çıkmadıysa kalsın
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
        className="fixed inset-0 overflow-hidden bg-sky-200 font-sans select-none"
        onMouseMove={handleInput}
        onTouchMove={handleInput}
    >
        {/* === KAMERA KATMANI (Dünyayı yukarı/aşağı kaydırır) === */}
        <div 
            className="absolute w-full top-0 left-0 will-change-transform"
            style={{ 
                height: WORLD_HEIGHT,
                transform: `translateY(${-cameraY.current}px)` 
            }}
        >
            {/* 1. GÖKYÜZÜ (En Üst) */}
            <div style={{ height: SEA_LEVEL }} className="w-full bg-gradient-to-b from-sky-300 to-sky-100 relative">
                <h1 className="text-center text-white/50 font-black text-6xl pt-20">GÖKYÜZÜ</h1>
            </div>

            {/* 2. DENİZ SUYU (Gradient - Resim Yok) */}
            <div 
                className="w-full relative"
                style={{ 
                    top: -2, // Çizgi oluşmasın diye hafif yukarı
                    height: WORLD_HEIGHT - SEA_LEVEL,
                    background: 'linear-gradient(to bottom, #60a5fa 0%, #1e3a8a 100%)' // Derinleştikçe koyulaşan mavi
                }}
            >
                {/* SU YÜZEYİ ŞERİDİ (Repeat-X) */}
                <div 
                    className="absolute top-0 left-0 w-[200%] h-16 pointer-events-none"
                    style={{ 
                        backgroundImage: `url(${suYuzeyiImg})`,
                        backgroundRepeat: 'repeat-x',
                        backgroundSize: 'auto 100%',
                        transform: `translateX(${backgroundX.current % window.innerWidth}px) translateY(-50%)`
                    }}
                />

                {/* ZEMİN ŞERİDİ (En Alt - Repeat-X) */}
                <div 
                    className="absolute bottom-0 left-0 w-[200%] h-32 pointer-events-none"
                    style={{ 
                        backgroundImage: `url(${zeminImg})`,
                        backgroundRepeat: 'repeat-x',
                        backgroundSize: 'auto 100%',
                        transform: `translateX(${backgroundX.current % window.innerWidth}px)`
                    }}
                />
            </div>

            {/* 3. HEDEFLER (Yiyecekler) */}
            {targets.map(t => (
                <div 
                    key={t.id}
                    className="absolute w-10 h-10 rounded-full shadow-lg border-2 border-white/50 flex items-center justify-center animate-pulse"
                    style={{ 
                        left: t.x, 
                        top: t.y,
                        backgroundColor: t.color 
                    }}
                >
                    {/* İleride buraya <img src={t.type === 'red' ? kirmiziBalik : ...} /> koyabilirsin */}
                    <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
                </div>
            ))}

            {/* 4. OYUNCU BALIĞI (Render) */}
            {isPlaying && (
                <div 
                    className="absolute z-50 will-change-transform"
                    style={{
                        left: fishPhys.current.x,
                        top: fishPhys.current.y,
                        width: 80, 
                        height: 60,
                        // Tüm büyü: Buradaki Transform'da!
                        transform: `translate(-50%, -50%) 
                                    rotate(${fishPhys.current.rotation}deg) 
                                    scale(${faceDirection * fishPhys.current.scaleX}, ${fishPhys.current.scaleY})` 
                    }}
                >
                    {/* Duruma göre resim değiştirme */}
                    <img 
                        src={isEating ? balikYemeImg : balikNormalImg} 
                        alt="Karakter" 
                        className="w-full h-full object-contain drop-shadow-2xl"
                    />
                </div>
            )}
        </div>

        {/* === ARAYÜZ (UI) - Ekrana Sabit === */}
        <div className="fixed top-5 left-5 bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-xl border-4 border-orange-400 z-[100]">
            <span className="font-black text-2xl text-orange-600">SKOR: {score}</span>
        </div>

        <button onClick={onClose} className="fixed top-5 right-5 z-[100] bg-white p-2 rounded-full shadow-lg hover:scale-110 transition">
            <XCircle className="text-red-500 w-8 h-8" />
        </button>

        {/* BAŞLANGIÇ EKRANI */}
        {!isPlaying && (
            <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={startGame}
                    className="bg-orange-500 text-white px-12 py-6 rounded-3xl font-black text-4xl shadow-orange-500/50 shadow-2xl flex items-center gap-4 border-b-8 border-orange-700 active:border-b-0 active:translate-y-2 transition-all"
                >
                    <Play size={40} fill="currentColor" /> BAŞLA
                </motion.button>
                <p className="text-white mt-6 text-xl opacity-80 font-medium">Parmağınla balığı yüzdür, yemleri kap!</p>
            </div>
        )}
    </div>
  );
    }
                  
