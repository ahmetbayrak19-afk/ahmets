import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCcw } from 'lucide-react';

// ---------------------------------------------------------------------------
// 🔥 VARLIKLAR (Assets)
// ---------------------------------------------------------------------------

// GÖRSELLER
import bgImage from './sesesleme/sesarkaplan.jpeg'; 
import imgCerceve from './sesesleme/eslekutucuk.png'; // Çerçeve

// Sandık Aşamaları
import sandik1 from './sesesleme/sandik1.png'; // Kapalı
import sandik2 from './sesesleme/sandik2.png'; // 1 Işık
import sandik3 from './sesesleme/sandik3.png'; // 2 Işık
import sandik4 from './sesesleme/sandik4.png'; // 3 Işık
import sandik5 from './sesesleme/sandik5.png'; // 4 Işık (Hepsi Sarı)
import sandik6 from './sesesleme/sandik6.png'; // 4 Işık (Yeşil - Onay)
import sandik7 from './sesesleme/sandik7.png'; // Açık Sandık (Ödül)

// Kutular
import imgKutuSol from './sesesleme/kutusol.png';
import imgKutuOrta from './sesesleme/kutuorta.png';
import imgKutuSag from './sesesleme/kutusag.png';

// SESLER (1-7)
import snd1 from './sesesleme/1siseici.mp3';
import snd2 from './sesesleme/2siseici.mp3';
import snd3 from './sesesleme/3siseici.mp3';
import snd4 from './sesesleme/4siseici.mp3';
import snd5 from './sesesleme/5siseici.mp3';
import snd6 from './sesesleme/6siseici.mp3';
import snd7 from './sesesleme/7siseici.mp3';

// Ses Dizisi (Index 0 boş)
const SOUNDS = [null, snd1, snd2, snd3, snd4, snd5, snd6, snd7];
const CHEST_IMAGES = [sandik1, sandik2, sandik3, sandik4, sandik5, sandik6, sandik7];

// ---------------------------------------------------------------------------
// TİPLER
// ---------------------------------------------------------------------------
interface DraggableBox {
  id: string;
  soundId: number;
  visualType: 'left' | 'mid' | 'right';
  x: number; 
  y: number; 
}

interface GameProps {
  onClose: () => void;
}

export default function NesneEslemeGame14({ onClose }: GameProps) {
  // --- EKRAN YÖNÜ ---
  const [isPortrait, setIsPortrait] = useState(false);
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  // --- OYUN STATE ---
  const [chestStage, setChestStage] = useState(0); // 0..6 arası
  const [targetSoundId, setTargetSoundId] = useState<number>(1); // Soldaki kutunun sesi
  const [bottomBoxes, setBottomBoxes] = useState<DraggableBox[]>([]);
  const [isGameWon, setIsGameWon] = useState(false);
  
  // Sürükleme ve Sallanma State'i
  const [draggedBoxId, setDraggedBoxId] = useState<string | null>(null);
  const [shakingBoxId, setShakingBoxId] = useState<string | null>(null); // Sallanan kutu ID'si
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 }); 
  const dragStartPos = useRef({ x: 0, y: 0 }); // Sürükleme başlangıç pozisyonu
  const isDraggingRef = useRef(false); // Sürükleniyor mu kontrolü
  
  // Referanslar
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- İLK AÇILIŞ VE RESIZE ---
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ w: window.innerWidth, h: window.innerHeight });
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    initRound(); // Oyunu Başlat
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- SES ÇALMA ---
  const playSound = (id: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const src = SOUNDS[id];
    if (src) {
      const audio = new Audio(src);
      audioRef.current = audio;
      audio.play().catch(() => {});
    }
  };

  // --- TUR HAZIRLAMA ---
  const initRound = (nextStage = 0) => {
    const target = Math.floor(Math.random() * 7) + 1;
    setTargetSoundId(target);

    const distractors: number[] = [];
    while (distractors.length < 2) {
      const r = Math.floor(Math.random() * 7) + 1;
      if (r !== target && !distractors.includes(r)) distractors.push(r);
    }

    let boxesData: DraggableBox[] = [
      { id: 'correct', soundId: target, visualType: 'mid', x: 0, y: 0 },
      { id: 'wrong1', soundId: distractors[0], visualType: 'left', x: 0, y: 0 },
      { id: 'wrong2', soundId: distractors[1], visualType: 'right', x: 0, y: 0 },
    ];

    boxesData = boxesData.sort(() => Math.random() - 0.5);

    const visualOrder: ('left' | 'mid' | 'right')[] = ['left', 'mid', 'right'];
    boxesData = boxesData.map((box, idx) => ({
      ...box,
      visualType: visualOrder[idx],
    }));

    setBottomBoxes(boxesData);
    if (nextStage === 0) setChestStage(0); 
  };

  // --- POINTER EVENTS (SÜRÜKLEME VE SALLANMA) ---
  const handlePointerDown = (e: React.PointerEvent, boxId: string) => {
    e.preventDefault();
    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    
    setDraggedBoxId(boxId);
    setShakingBoxId(boxId); // Sallanmayı başlat
    setDragPosition({ x: e.clientX, y: e.clientY });
    dragStartPos.current = { x: e.clientX, y: e.clientY }; // Başlangıç pozisyonunu kaydet
    isDraggingRef.current = false; // Henüz sürüklenmiyor
    
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggedBoxId) return;
    e.preventDefault();

    // Ne kadar hareket etti?
    const moveX = Math.abs(e.clientX - dragStartPos.current.x);
    const moveY = Math.abs(e.clientY - dragStartPos.current.y);

    // Eğer 5px'den fazla hareket ettiyse, sürükleme başlamıştır.
    if (moveX > 5 || moveY > 5) {
        isDraggingRef.current = true;
        setShakingBoxId(null); // Sallanmayı durdur
    }

    setDragPosition({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggedBoxId) return;

    setShakingBoxId(null); // Sallanmayı durdur

    // Eğer sürükleme OLMADIYSA (sadece tıklandıysa) sesi çal
    if (!isDraggingRef.current) {
        const box = bottomBoxes.find(b => b.id === draggedBoxId);
        if (box) playSound(box.soundId);
    }
    
    // --- SÜRÜKLEME BİTTİ, DROP KONTROLÜ ---
    const dropZone = dropZoneRef.current;
    if (dropZone && isDraggingRef.current) {
      const dropRect = dropZone.getBoundingClientRect();
      const pointerX = e.clientX;
      const pointerY = e.clientY;

      const isInside = 
        pointerX >= dropRect.left && 
        pointerX <= dropRect.right && 
        pointerY >= dropRect.top && 
        pointerY <= dropRect.bottom;

      if (isInside) {
        checkAnswer(draggedBoxId);
      }
    }

    setDraggedBoxId(null);
    isDraggingRef.current = false;
  };

  // --- CEVAP KONTROLÜ ---
  const checkAnswer = (boxId: string) => {
    const box = bottomBoxes.find(b => b.id === boxId);
    if (!box) return;

    if (box.soundId === targetSoundId) {
      // ✅ DOĞRU
      const nextStage = chestStage + 1;
      setChestStage(nextStage);

      if (nextStage >= 4) {
        handleWin();
      } else {
        setTimeout(() => {
          initRound(nextStage);
        }, 500);
      }
    } else {
      // ❌ YANLIŞ
      const failAudio = new Audio(SOUNDS[box.soundId] || ""); 
      failAudio.play().catch(()=>{});
    }
  };

  const handleWin = () => {
    setTimeout(() => setChestStage(5), 500); // Yeşil Işık
    setTimeout(() => setChestStage(6), 1500); // Sandık Açıl
    setTimeout(() => setIsGameWon(true), 2500); // Tebrikler
  };

  const getBoxImage = (type: 'left' | 'mid' | 'right') => {
    if (type === 'left') return imgKutuSol;
    if (type === 'right') return imgKutuSag;
    return imgKutuOrta;
  };

  // --- ZORLA YATAY STİLİ ---
  const containerStyle: React.CSSProperties = isPortrait
    ? {
        position: 'fixed', top: '50%', left: '50%',
        width: `${windowSize.h}px`, height: `${windowSize.w}px`,
        transform: 'translate(-50%, -50%) rotate(90deg)',
        zIndex: 100, backgroundColor: '#000',
      }
    : { position: 'fixed', inset: 0, zIndex: 100, backgroundColor: '#000' };

  return (
    <div style={containerStyle} 
         className="text-white font-sans select-none overflow-hidden touch-none"
         onPointerMove={handlePointerMove}
         onPointerUp={handlePointerUp}
    >
      {/* CSS Shake Animasyonu */}
      <style>{`
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(3px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        .shake-box {
            animation: shake 0.5s;
            animation-iteration-count: infinite;
        }
      `}</style>

      {/* ARKAPLAN */}
      <div className="absolute inset-0 w-full h-full">
        <img src={bgImage} className="w-full h-full object-cover opacity-80" alt="Background" />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* --- OYUN ALANI --- */}
      <div className="relative w-full h-full flex flex-col items-center justify-between py-6">
        
        {/* 1. ÜST: SANDIK (PUAN) - BÜYÜTÜLDÜ VE AŞAĞI İNDİRİLDİ */}
        <div className="relative z-10 animate-in zoom-in duration-500 translate-y-1/4">
           <img 
             src={CHEST_IMAGES[chestStage]} 
             alt="Sandık" 
             // scale-300 ile 3 kat büyütüldü
             className="h-32 md:h-48 object-contain drop-shadow-[0_0_20px_rgba(255,200,0,0.3)] transition-all duration-500 scale-300"
           />
        </div>

        {/* 2. ORTA: GÖREV ALANI - YAZILAR KALDIRILDI, ÇERÇEVELER BÜYÜTÜLDÜ */}
        <div className="flex w-full justify-center gap-16 md:gap-32 items-center z-10">
            
            {/* SOL: REFERANS KUTUSU */}
            {/* YAZI KALDIRILDI */}
            <div 
                // w-36 h-36 ile büyütüldü
                className="relative w-36 h-36 cursor-pointer active:scale-95 transition-transform"
                onPointerDown={() => playSound(targetSoundId)} 
            >
                <img src={imgCerceve} className="absolute inset-0 w-full h-full object-contain" alt="Çerçeve" />
                <div className="absolute inset-0 flex items-center justify-center p-4">
                    {/* Kutu aşağı kaydırıldı (translate-y-4) ve sallanma efekti eklendi */}
                    <img src={imgKutuOrta} className="w-full h-full object-contain translate-y-4 shake-box" alt="Referans" />
                </div>
            </div>

            {/* SAĞ: DROP ZONE */}
            {/* YAZI KALDIRILDI */}
            {/* w-36 h-36 ile büyütüldü */}
            <div ref={dropZoneRef} className="relative w-36 h-36">
                <img src={imgCerceve} className="w-full h-full object-contain opacity-80" alt="Hedef" />
                <div className="absolute inset-0 bg-yellow-500/10 rounded-lg animate-pulse border-2 border-dashed border-yellow-500/30"></div>
            </div>

        </div>

        {/* 3. ALT: SEÇENEKLER - YUKARI KAYDIRILDI */}
        {/* -mb-16 ile yukarı kaydırıldı */}
        <div className="flex gap-4 md:gap-8 items-end justify-center pb-4 z-20 h-32 -mb-16">
           {bottomBoxes.map((box) => {
             const isDragging = draggedBoxId === box.id;
             const isShaking = shakingBoxId === box.id;
             
             return (
               <div 
                 key={box.id} 
                 className={`relative w-24 h-24 transition-opacity ${isDragging ? 'opacity-0' : 'opacity-100'}`}
               >
                  <div 
                    className={`w-full h-full cursor-grab active:cursor-grabbing hover:-translate-y-2 transition-transform ${isShaking ? 'shake-box' : ''}`}
                    onPointerDown={(e) => handlePointerDown(e, box.id)}
                  >
                      <img 
                        src={getBoxImage(box.visualType)} 
                        alt="Kutu" 
                        className="w-full h-full object-contain drop-shadow-xl"
                        style={{ pointerEvents: 'none' }} 
                      />
                  </div>
               </div>
             );
           })}
        </div>

        {/* --- SÜRÜKLENEN HAYALET KUTU --- */}
        {draggedBoxId && isDraggingRef.current && (
            <div 
              className="fixed z-50 pointer-events-none w-24 h-24 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
              style={{
                left: dragPosition.x - dragOffset.current.x,
                top: dragPosition.y - dragOffset.current.y,
              }}
            >
               <img 
                 src={getBoxImage(bottomBoxes.find(b=>b.id === draggedBoxId)?.visualType || 'mid')} 
                 className="w-full h-full object-contain"
                 alt="Dragged"
               />
            </div>
        )}

      </div>

      {/* --- GERİ DÖN BUTONU --- */}
      <button onClick={onClose} className="absolute top-4 left-4 z-50 p-3 bg-slate-900/80 rounded-full border border-slate-600 text-white hover:bg-slate-700">
         <ArrowLeft size={24} />
      </button>

      {/* --- KAZANMA EKRANI --- */}
      {isGameWon && (
        <div className="absolute inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center animate-in fade-in duration-500">
            <h2 className="text-4xl md:text-6xl font-black text-yellow-400 mb-8 drop-shadow-lg animate-bounce">
                HARİKA! 🎉
            </h2>
            <img src={sandik7} className="w-64 md:w-96 object-contain mb-8 animate-pulse" alt="Açık Sandık" />
            <button 
              onClick={() => {
                  setChestStage(0); 
                  setIsGameWon(false); 
                  initRound(0);
              }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-full text-xl font-bold transition shadow-lg hover:scale-105"
            >
                <RefreshCcw size={24} />
                TEKRAR OYNA
            </button>
        </div>
      )}

    </div>
  );
}
