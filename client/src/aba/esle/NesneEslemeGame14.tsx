import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCcw } from 'lucide-react';

// ---------------------------------------------------------------------------
// 🔥 VARLIKLAR (Assets)
// ---------------------------------------------------------------------------

import bgImage from './sesesleme/sesarkaplan.jpeg'; 
import imgDinleKutucuk from './sesesleme/dinlekutucuk.png'; 
import imgEsleKutucuk from './sesesleme/eslekutucuk.png';   

import sandik1 from './sesesleme/sandik1.png'; 
import sandik2 from './sesesleme/sandik2.png'; 
import sandik3 from './sesesleme/sandik3.png'; 
import sandik4 from './sesesleme/sandik4.png'; 
import sandik5 from './sesesleme/sandik5.png'; 
import sandik6 from './sesesleme/sandik6.png'; 
import sandik7 from './sesesleme/sandik7.png'; 

import imgKutuSol from './sesesleme/kutusol.png';
import imgKutuOrta from './sesesleme/kutuorta.png';
import imgKutuSag from './sesesleme/kutusag.png';

// 🔥 SES DOSYALARI
import sndGiris from './sesesleme/sesgiris.mp3';    // Oyun başı
import sndKilit from './sesesleme/kilit.mp3';       // Ara geçişler (Sandık 1->6 arası)
import sndSandikAc from './sesesleme/sandikac.mp3'; // Final (Sandık 7)

import snd1 from './sesesleme/1siseici.mp3';
import snd2 from './sesesleme/2siseici.mp3';
import snd3 from './sesesleme/3siseici.mp3';
import snd4 from './sesesleme/4siseici.mp3';
import snd5 from './sesesleme/5siseici.mp3';
import snd6 from './sesesleme/6siseici.mp3';
import snd7 from './sesesleme/7siseici.mp3';

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
  const [isPortrait, setIsPortrait] = useState(false);
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  const [chestStage, setChestStage] = useState(0); 
  const [targetSoundId, setTargetSoundId] = useState<number>(1); 
  const [bottomBoxes, setBottomBoxes] = useState<DraggableBox[]>([]);
  const [isGameWon, setIsGameWon] = useState(false);
  
  const [draggedBoxId, setDraggedBoxId] = useState<string | null>(null);
  const [activeBoxId, setActiveBoxId] = useState<string | null>(null);

  const [successMatch, setSuccessMatch] = useState<{ visualType: 'left' | 'mid' | 'right' } | null>(null);

  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 }); 
  const dragStartPos = useRef({ x: 0, y: 0 }); 
  const isDraggingRef = useRef(false); 
  
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ w: window.innerWidth, h: window.innerHeight });
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    
    initRound(); 
    
    // 🔥 OYUN BAŞLANGICINDA GİRİŞ SESİ
    const introAudio = new Audio(sndGiris);
    introAudio.play().catch((e) => {
        console.log("Ses otomatik başlatılamadı:", e);
    });
    
    document.body.style.overflow = 'hidden';

    return () => {
        window.removeEventListener('resize', handleResize);
        document.body.style.overflow = ''; 
        introAudio.pause();
        introAudio.currentTime = 0;
    };
  }, []);

  // --- SES YÖNETİMİ ---
  const startSound = (id: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const src = SOUNDS[id];
    if (src) {
      const audio = new Audio(src);
      audio.loop = true; 
      audioRef.current = audio;
      audio.play().catch(() => {});
    }
  };

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }

  // --- TUR HAZIRLAMA ---
  const initRound = (nextStage = 0) => {
    // Eğer oyun bittiyse yeni tur hazırlama
    if (nextStage >= 6 && isGameWon) return;

    const target = Math.floor(Math.random() * 7) + 1;
    setTargetSoundId(target);
    setSuccessMatch(null);

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
    // Sandık aşamasını güncellemiyoruz burada, checkAnswer içinde güncelliyoruz.
  };

  // --- POINTER EVENTS ---
  const handlePointerDown = (e: React.PointerEvent, boxId: string, soundId: number) => {
    if (successMatch) return;

    e.preventDefault();
    e.stopPropagation();

    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    
    setActiveBoxId(boxId); 
    startSound(soundId);    

    setDraggedBoxId(boxId);
    setDragPosition({ x: e.clientX, y: e.clientY });
    dragStartPos.current = { x: e.clientX, y: e.clientY }; 
    isDraggingRef.current = false; 
    
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggedBoxId) return;
    e.preventDefault();

    if (draggedBoxId === 'ref-box') return;

    const moveX = Math.abs(e.clientX - dragStartPos.current.x);
    const moveY = Math.abs(e.clientY - dragStartPos.current.y);

    if (moveX > 5 || moveY > 5) {
        if (!isDraggingRef.current) {
            isDraggingRef.current = true;
            setActiveBoxId(null); 
            stopSound();          
        }
    }

    setDragPosition({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setActiveBoxId(null); 
    stopSound();          

    if (!draggedBoxId) return;

    const dropZone = dropZoneRef.current;
    if (dropZone && isDraggingRef.current && draggedBoxId !== 'ref-box') {
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

  const checkAnswer = (boxId: string) => {
    const box = bottomBoxes.find(b => b.id === boxId);
    if (!box) return;

    if (box.soundId === targetSoundId) {
      // Doğru eşleşme
      setSuccessMatch({ visualType: box.visualType });
      
      setTimeout(() => {
          const nextStage = chestStage + 1;

          // CHEST_IMAGES dizisi 0-6 arası (toplam 7 eleman).
          // 0: sandik1, 1: sandik2, ..., 5: sandik6, 6: sandik7 (AÇIK)
          
          if (nextStage >= 6) {
            // 🔥 FİNAL AŞAMASI (Sandık 7 - Açık)
            setChestStage(6); // sandik7.png
            const finalAudio = new Audio(sndSandikAc);
            finalAudio.play().catch(()=>{});
            
            setTimeout(() => setIsGameWon(true), 2000); // 2 sn sonra kazanma ekranı
          } else {
            // 🔥 ARA AŞAMALAR (Sandık 2, 3, 4, 5, 6)
            // Kilit açılma sesi
            setChestStage(nextStage);
            const kilitAudio = new Audio(sndKilit);
            kilitAudio.play().catch(()=>{});
            
            // Yeni tura başla
            initRound(nextStage);
          }
      }, 1000); // 1 saniye bekle (görsel efekt için)

    } else {
      // Yanlış eşleşme
      const failAudio = new Audio(SOUNDS[box.soundId] || ""); 
      failAudio.play().catch(()=>{});
    }
  };

  const getBoxImage = (type: 'left' | 'mid' | 'right') => {
    if (type === 'left') return imgKutuSol;
    if (type === 'right') return imgKutuSag;
    return imgKutuOrta;
  };

  const containerStyle: React.CSSProperties = isPortrait
    ? {
        position: 'fixed', top: '50%', left: '50%',
        width: `${windowSize.h}px`, height: `${windowSize.w}px`,
        transform: 'translate(-50%, -50%) rotate(90deg)',
        zIndex: 200, 
        backgroundColor: '#000',
      }
    : { position: 'fixed', inset: 0, zIndex: 200, backgroundColor: '#000' };

  return (
    <>
      <div className="fixed inset-0 bg-black z-[150] touch-none overscroll-none" />

      <div style={containerStyle} 
           className="text-white font-sans select-none overflow-hidden touch-none"
           onPointerMove={handlePointerMove}
           onPointerUp={handlePointerUp}
      >
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
          img {
              -webkit-user-drag: none;
              user-select: none;
              -webkit-user-select: none;
              pointer-events: none;
          }
        `}</style>

        {/* ARKAPLAN */}
        <div className="absolute inset-0 w-full h-full">
          <img src={bgImage} className="w-full h-full object-cover opacity-80" alt="Background" />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <div className="relative w-full h-full flex flex-col items-center justify-between py-6">
          
          {/* 1. SANDIK */}
          <div className="relative z-10 animate-in zoom-in duration-500 mt-12">
             <img 
               src={CHEST_IMAGES[chestStage]} 
               alt="Sandık" 
               className="h-32 md:h-48 object-contain drop-shadow-[0_0_20px_rgba(255,200,0,0.3)] transition-all duration-500 scale-300"
             />
          </div>

          {/* 2. ÇERÇEVELER */}
          <div className="flex w-full justify-center gap-96 items-center z-10 -mt-24">
              
              {/* SOL: DİNLE KUTUSU */}
              <div className="relative w-36 h-36 translate-x-3 translate-y-3">
                  <img src={imgDinleKutucuk} className="absolute inset-0 w-full h-full object-contain" alt="Dinle Çerçeve" />
                  
                  <div 
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 w-24 h-24 flex items-center justify-center cursor-pointer active:scale-95 transition-transform z-20 pointer-events-auto"
                      onPointerDown={(e) => handlePointerDown(e, 'ref-box', targetSoundId)} 
                  >
                      <img 
                        src={imgKutuOrta} 
                        className={`w-full h-full object-contain ${activeBoxId === 'ref-box' || successMatch ? 'shake-box' : ''} ${successMatch ? 'drop-shadow-[0_0_20px_rgba(250,204,21,1)]' : ''}`} 
                        alt="Referans" 
                      />
                  </div>
              </div>

              {/* SAĞ: DROP ZONE */}
              <div ref={dropZoneRef} className="relative w-36 h-36 translate-y-3">
                  <img src={imgEsleKutucuk} className="w-full h-full object-contain opacity-80" alt="Hedef Çerçeve" />
                  
                  {successMatch && (
                      <div className="absolute inset-0 flex items-center justify-center">
                          {/* 🔥 GÜNCELLEME: translate-y-2 ile kutuyu 2 birim aşağı aldık */}
                          <img 
                            src={getBoxImage(successMatch.visualType)} 
                            className="w-24 h-24 object-contain shake-box drop-shadow-[0_0_20px_rgba(250,204,21,1)] translate-y-2" 
                            alt="Matched Box" 
                          />
                      </div>
                  )}
              </div>

          </div>

          {/* 3. ALT SEÇENEKLER */}
          <div className="flex gap-4 md:gap-8 items-end justify-center pb-12 z-20 h-32 w-full">
             {bottomBoxes.map((box) => {
               const isDragging = draggedBoxId === box.id && isDraggingRef.current;
               const isShaking = activeBoxId === box.id && !isDraggingRef.current;
               const isHidden = isDragging || (successMatch && box.visualType === successMatch.visualType);

               return (
                 <div 
                   key={box.id} 
                   className={`relative w-24 h-24 transition-opacity ${isHidden ? 'opacity-0' : 'opacity-100'}`}
                 >
                    <div 
                      className={`w-full h-full cursor-grab active:cursor-grabbing hover:-translate-y-2 transition-transform ${isShaking ? 'shake-box' : ''} pointer-events-auto`}
                      onPointerDown={(e) => handlePointerDown(e, box.id, box.soundId)}
                    >
                        <img 
                          src={getBoxImage(box.visualType)} 
                          alt="Kutu" 
                          className="w-full h-full object-contain drop-shadow-xl"
                        />
                    </div>
                 </div>
               );
             })}
          </div>

          {/* HAYALET KUTU */}
          {draggedBoxId && isDraggingRef.current && draggedBoxId !== 'ref-box' && (
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

        <button onClick={onClose} className="absolute top-4 left-4 z-50 p-3 bg-slate-900/80 rounded-full border border-slate-600 text-white hover:bg-slate-700 pointer-events-auto">
           <ArrowLeft size={24} />
        </button>

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
                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-full text-xl font-bold transition shadow-lg hover:scale-105 pointer-events-auto"
              >
                  <RefreshCcw size={24} />
                  TEKRAR OYNA
              </button>
          </div>
        )}
      </div>
    </>
  );
}
