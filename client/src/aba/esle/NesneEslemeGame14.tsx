import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCcw, Smartphone } from 'lucide-react';

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
import sndGiris from './sesesleme/sesgiris.mp3';    
import sndKilit from './sesesleme/kilit.mp3';       
import sndSandikAc from './sesesleme/sandikac.mp3'; 

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
  const [screenSize, setScreenSize] = useState({ w: window.innerWidth, h: window.innerHeight });

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
      setScreenSize({ w: window.innerWidth, h: window.innerHeight });
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    initRound(); 
    
    const introAudio = new Audio(sndGiris);
    introAudio.play().catch((e) => {
        console.log("Ses otomatik başlatılamadı:", e);
    });
    
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
        window.removeEventListener('resize', handleResize);
        document.body.style.overflow = ''; 
        document.body.style.touchAction = '';
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
      setSuccessMatch({ visualType: box.visualType });
      
      setTimeout(() => {
          const nextStage = chestStage + 1;
          
          if (nextStage >= 4) {
            // FİNAL
            setChestStage(4); 
            new Audio(sndKilit).play().catch(()=>{}); 
            startFinaleSequence();
          } else {
            // NORMAL
            setChestStage(nextStage);
            new Audio(sndKilit).play().catch(()=>{}); 
            initRound(nextStage);
          }
      }, 1000); 

    } else {
      const failAudio = new Audio(SOUNDS[box.soundId] || ""); 
      failAudio.play().catch(()=>{});
    }
  };

  const startFinaleSequence = () => {
      setTimeout(() => {
          setChestStage(5); // Sandık 6
          new Audio(sndKilit).play().catch(()=>{}); 
          
          setTimeout(() => {
              setChestStage(6); // Sandık 7
              new Audio(sndSandikAc).play().catch(()=>{}); 
              setTimeout(() => setIsGameWon(true), 2500);
          }, 1500);

      }, 1500);
  };

  const getBoxImage = (type: 'left' | 'mid' | 'right') => {
    if (type === 'left') return imgKutuSol;
    if (type === 'right') return imgKutuSag;
    return imgKutuOrta;
  };

  // 🔥 EKRAN DİK Mİ? KONTROLÜ
  const isPortrait = screenSize.h > screenSize.w;

  // EĞER DİK İSE -> UYARI GÖSTER
  if (isPortrait) {
    return (
      <div className="fixed inset-0 bg-black z-[999] flex flex-col items-center justify-center text-white p-6 text-center">
         <div className="animate-spin duration-1000 mb-6">
            <Smartphone size={64} className="text-yellow-400" />
         </div>
         <h2 className="text-2xl font-bold mb-2">Lütfen Telefonu Yan Çevirin</h2>
         <p className="text-gray-400">Oyunu oynamak için cihazınızı yatay konuma getirin.</p>
         
         <button onClick={onClose} className="mt-12 p-3 bg-slate-800 rounded-full border border-slate-600 text-white">
            <ArrowLeft size={24} />
         </button>
      </div>
    );
  }

  // EĞER YAN İSE (Landscape) -> OYUNU GÖSTER
  return (
    <>
      <div className="fixed inset-0 bg-black z-[150] touch-none overscroll-none" />

      {/* Ana Konteyner - Dikey eksende 3 bölüme ayrıldı */}
      <div className="fixed inset-0 bg-black z-[200] text-white font-sans select-none touch-none overflow-hidden flex flex-col"
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

        {/* =========================================================================
            BÖLÜM 1: ÜST KISIM - SANDIK (%35 Yükseklik)
            Sandık artık en tepede ve ortada.
           ========================================================================= */}
        <div className="relative w-full h-[35%] flex items-end justify-center z-10">
             <img 
               src={CHEST_IMAGES[chestStage]} 
               alt="Sandık" 
               className="h-full object-contain drop-shadow-[0_0_20px_rgba(255,200,0,0.3)] transition-all duration-500 scale-90 origin-bottom"
             />
        </div>

        {/* 🔥 OYUN ALANI (Sadece Sandık 5'ten önce) */}
        {chestStage < 4 && (
            <>
              {/* =========================================================================
                  BÖLÜM 2: ORTA KISIM - DİNLE ve EŞLE ÇERÇEVELERİ (%40 Yükseklik)
                  Burada 'justify-between' ve 'px-8' ile kutuları EN SOLA ve EN SAĞA itiyoruz.
                  Böylece ortadaki sandığın önü kapanmıyor.
                 ========================================================================= */}
              <div className="relative w-full h-[40%] flex justify-between items-center px-6 md:px-16 z-20">
                  
                  {/* SOL TARAF: DİNLE KUTUSU */}
                  <div className="relative w-28 h-28 md:w-40 md:h-40 bg-black/20 rounded-xl p-2">
                      <img src={imgDinleKutucuk} className="absolute inset-0 w-full h-full object-contain opacity-90" alt="Dinle Çerçeve" />
                      
                      {/* Tıklanabilir Alan */}
                      <div 
                          className="absolute inset-0 flex items-center justify-center cursor-pointer active:scale-95 transition-transform z-20 pointer-events-auto"
                          onPointerDown={(e) => handlePointerDown(e, 'ref-box', targetSoundId)} 
                      >
                          <img 
                            src={imgKutuOrta} 
                            className={`w-[60%] h-[60%] object-contain ${activeBoxId === 'ref-box' || successMatch ? 'shake-box' : ''} ${successMatch ? 'drop-shadow-[0_0_20px_rgba(250,204,21,1)]' : ''}`} 
                            alt="Referans" 
                          />
                      </div>
                  </div>

                  {/* SAĞ TARAF: EŞLE (DROP ZONE) */}
                  <div ref={dropZoneRef} className="relative w-28 h-28 md:w-40 md:h-40 bg-black/20 rounded-xl p-2">
                      <img src={imgEsleKutucuk} className="absolute inset-0 w-full h-full object-contain opacity-90" alt="Hedef Çerçeve" />
                      
                      {successMatch && (
                          <div className="absolute inset-0 flex items-center justify-center z-30">
                              <img 
                                src={getBoxImage(successMatch.visualType)} 
                                className="w-[60%] h-[60%] object-contain shake-box drop-shadow-[0_0_20px_rgba(250,204,21,1)] translate-y-2" 
                                alt="Matched Box" 
                              />
                          </div>
                      )}
                  </div>

              </div>

              {/* =========================================================================
                  BÖLÜM 3: ALT KISIM - SEÇENEKLER (%25 Yükseklik)
                  Alt kutular artık ekranın en altında, rahat bir alanda duruyor.
                 ========================================================================= */}
              <div className="relative w-full h-[25%] flex gap-4 md:gap-12 items-center justify-center z-30">
                 {bottomBoxes.map((box) => {
                   const isDragging = draggedBoxId === box.id && isDraggingRef.current;
                   const isShaking = activeBoxId === box.id && !isDraggingRef.current;
                   const isHidden = isDragging || (successMatch && box.visualType === successMatch.visualType);

                   return (
                     <div 
                       key={box.id} 
                       className={`relative w-20 h-20 md:w-24 md:h-24 transition-opacity ${isHidden ? 'opacity-0' : 'opacity-100'}`}
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
            </>
        )}

        {/* HAYALET KUTU (Sürüklenen) */}
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
