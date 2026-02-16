import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCcw, Smartphone, Star } from 'lucide-react';

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

  // OYUN DURUMLARI
  const [gameLevel, setGameLevel] = useState(1); // 1, 2, 3
  const [chestStage, setChestStage] = useState(0); 
  const [targetSoundId, setTargetSoundId] = useState<number>(1); 
  const [bottomBoxes, setBottomBoxes] = useState<DraggableBox[]>([]);
  const [isGameWon, setIsGameWon] = useState(false);
  
  // SÜRÜKLEME VE ETKİLEŞİM
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
    
    // İlk başlangıç
    initRound(0, 1); 
    
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

  // --- TUR HAZIRLAMA (SEVİYEYE GÖRE) ---
  const initRound = (nextStage = 0, level = gameLevel) => {
    const target = Math.floor(Math.random() * 7) + 1;
    setTargetSoundId(target);
    setSuccessMatch(null);

    // Seviyeye göre kutu sayısı belirleme
    // Seviye 1: 1 Doğru + 2 Yanlış = 3 Kutu
    // Seviye 2: 1 Doğru + 3 Yanlış = 4 Kutu
    // Seviye 3: 1 Doğru + 4 Yanlış = 5 Kutu
    let distractorCount = 2;
    if (level === 2) distractorCount = 3;
    if (level === 3) distractorCount = 4;

    const distractors: number[] = [];
    while (distractors.length < distractorCount) {
      const r = Math.floor(Math.random() * 7) + 1;
      if (r !== target && !distractors.includes(r)) distractors.push(r);
    }

    let boxesData: DraggableBox[] = [
      { id: 'correct', soundId: target, visualType: 'mid', x: 0, y: 0 },
    ];

    // Yanlış kutuları ekle
    distractors.forEach((dId, index) => {
        // Görsel tipleri rastgele dağıtmak yerine basit bir sıra veya random atayabiliriz
        const types: ('left'|'mid'|'right')[] = ['left', 'right', 'mid', 'left', 'right'];
        boxesData.push({ 
            id: `wrong${index}`, 
            soundId: dId, 
            visualType: types[index % 3], 
            x: 0, 
            y: 0 
        });
    });

    // Kutuları karıştır
    boxesData = boxesData.sort(() => Math.random() - 0.5);

    // Görsel tipleri dengelemek için (opsiyonel, hepsi aynı tip de olabilir ama çeşitlilik iyidir)
    // Basitçe: 3 tip var, sırayla ata
    boxesData = boxesData.map((box, idx) => {
        const visualOrder: ('left' | 'mid' | 'right')[] = ['left', 'mid', 'right'];
        return { ...box, visualType: visualOrder[idx % 3] };
    });

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

    // 🔥 HASSASİYET AYARI: 5px yerine 20px yaptık.
    // Parmağın hafif kaymasına izin veriyoruz, böylece ses hemen kesilmiyor.
    if (moveX > 20 || moveY > 20) {
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
          
          // Sandık 5'e gelince Final başlar
          if (nextStage >= 4) {
            setChestStage(4); 
            new Audio(sndKilit).play().catch(()=>{}); 
            startFinaleSequence();
          } else {
            setChestStage(nextStage);
            new Audio(sndKilit).play().catch(()=>{}); 
            initRound(nextStage, gameLevel);
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

  // Bir sonraki seviyeye geçiş
  const handleNextLevel = () => {
      let nextLvl = gameLevel + 1;
      if (nextLvl > 3) nextLvl = 1; // 3'ten sonra başa dön
      setGameLevel(nextLvl);
      setChestStage(0);
      setIsGameWon(false);
      initRound(0, nextLvl);
  };

  const getBoxImage = (type: 'left' | 'mid' | 'right') => {
    if (type === 'left') return imgKutuSol;
    if (type === 'right') return imgKutuSag;
    return imgKutuOrta;
  };

  // 🔥 EKRAN DİK Mİ? KONTROLÜ
  const isPortrait = screenSize.h > screenSize.w;

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

  // OYUN ALANI
  return (
    <>
      <div className="fixed inset-0 bg-black z-[150] touch-none overscroll-none" />

      {/* Ana Konteyner */}
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

        {/* SEVİYE GÖSTERGESİ (SAĞ ÜST) */}
        <div className="absolute top-4 right-4 z-50 flex gap-2 pointer-events-auto">
            {[1, 2, 3].map((lvl) => (
                <div 
                    key={lvl}
                    onClick={() => {
                        setGameLevel(lvl);
                        setChestStage(0);
                        setIsGameWon(false);
                        initRound(0, lvl);
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 cursor-pointer transition-all ${
                        gameLevel === lvl 
                        ? 'bg-yellow-500 border-white text-black scale-110 shadow-[0_0_15px_rgba(250,204,21,0.8)]' 
                        : 'bg-black/50 border-gray-500 text-gray-400 hover:bg-black/70'
                    }`}
                >
                    {lvl}
                </div>
            ))}
        </div>

        {/* =========================================================================
            BÖLÜM 1: ÜST KISIM - SANDIK (%45 Yükseklik)
            Genişletildi ve Sandık daha büyük.
           ========================================================================= */}
        <div className="relative w-full h-[45%] flex items-end justify-center z-10 pb-2">
             <img 
               src={CHEST_IMAGES[chestStage]} 
               alt="Sandık" 
               // Sandığı büyüttük (h-[120%]) ve bottom-0 ile aşağı sabitledik
               className="h-[120%] object-contain drop-shadow-[0_0_20px_rgba(255,200,0,0.3)] transition-all duration-500 origin-bottom translate-y-4"
             />
        </div>

        {/* 🔥 OYUN ALANI */}
        {chestStage < 4 && (
            <>
              {/* =========================================================================
                  BÖLÜM 2: ORTA KISIM - DİNLE ve EŞLE (%30 Yükseklik)
                  Çerçeveler yukarı alındı.
                 ========================================================================= */}
              <div className="relative w-full h-[30%] flex justify-between items-start px-6 md:px-24 z-20 pt-2">
                  
                  {/* SOL TARAF: DİNLE KUTUSU */}
                  <div className="relative w-28 h-28 md:w-36 md:h-36 bg-black/20 rounded-xl p-1">
                      <img src={imgDinleKutucuk} className="absolute inset-0 w-full h-full object-contain opacity-90" alt="Dinle Çerçeve" />
                      
                      {/* İçerik: Flex ile tam ortalıyoruz */}
                      <div 
                          className="absolute inset-0 flex items-center justify-center cursor-pointer active:scale-95 transition-transform z-20 pointer-events-auto"
                          onPointerDown={(e) => handlePointerDown(e, 'ref-box', targetSoundId)} 
                      >
                          {/* İç kutuyu biraz aşağı aldık: translate-y-1 */}
                          <img 
                            src={imgKutuOrta} 
                            className={`w-[55%] h-[55%] object-contain translate-y-1 ${activeBoxId === 'ref-box' || successMatch ? 'shake-box' : ''} ${successMatch ? 'drop-shadow-[0_0_20px_rgba(250,204,21,1)]' : ''}`} 
                            alt="Referans" 
                          />
                      </div>
                  </div>

                  {/* SAĞ TARAF: EŞLE (DROP ZONE) */}
                  <div ref={dropZoneRef} className="relative w-28 h-28 md:w-36 md:h-36 bg-black/20 rounded-xl p-1">
                      <img src={imgEsleKutucuk} className="absolute inset-0 w-full h-full object-contain opacity-90" alt="Hedef Çerçeve" />
                      
                      {successMatch && (
                          <div className="absolute inset-0 flex items-center justify-center z-30">
                              <img 
                                src={getBoxImage(successMatch.visualType)} 
                                className="w-[55%] h-[55%] object-contain shake-box drop-shadow-[0_0_20px_rgba(250,204,21,1)] translate-y-3" 
                                alt="Matched Box" 
                              />
                          </div>
                      )}
                  </div>

              </div>

              {/* =========================================================================
                  BÖLÜM 3: ALT KISIM - SEÇENEKLER (%25 Yükseklik)
                  Seviyeye göre kutular sığsın diye gap azaltılabilir.
                 ========================================================================= */}
              <div className="relative w-full h-[25%] flex gap-2 md:gap-6 items-center justify-center z-30 px-4">
                 {bottomBoxes.map((box) => {
                   const isDragging = draggedBoxId === box.id && isDraggingRef.current;
                   const isShaking = activeBoxId === box.id && !isDraggingRef.current;
                   const isHidden = isDragging || (successMatch && box.visualType === successMatch.visualType);
                   
                   // Kutuların boyutu seviye arttıkça (kutu sayısı artınca) hafif küçülebilir
                   const boxSizeClass = gameLevel === 3 ? "w-16 h-16 md:w-20 md:h-20" : "w-20 h-20 md:w-24 md:h-24";

                   return (
                     <div 
                       key={box.id} 
                       className={`relative ${boxSizeClass} transition-opacity ${isHidden ? 'opacity-0' : 'opacity-100'}`}
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

        <button onClick={onClose} className="absolute top-4 left-4 z-50 p-3 bg-slate-900/80 rounded-full border border-slate-600 text-white hover:bg-slate-700 pointer-events-auto">
           <ArrowLeft size={24} />
        </button>

        {/* KAZANMA EKRANI - DÜZENLENDİ */}
        {isGameWon && (
          <div className="absolute inset-0 z-[60] bg-black/85 flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
              <h2 className="text-4xl md:text-5xl font-black text-yellow-400 mb-4 drop-shadow-lg animate-bounce text-center">
                  HARİKA! 🎉
              </h2>
              
              {/* Sandık görselini sınırlandırarak butonların ekrana sığmasını sağla */}
              <div className="flex-grow-0 flex-shrink flex items-center justify-center mb-6">
                <img src={sandik7} className="max-h-48 md:max-h-64 w-auto object-contain animate-pulse" alt="Açık Sandık" />
              </div>

              <div className="flex gap-4">
                  <button 
                    onClick={() => {
                        setChestStage(0); 
                        setIsGameWon(false); 
                        initRound(0, gameLevel); // Aynı seviyeyi tekrarla
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full text-lg font-bold transition shadow-lg hover:scale-105 pointer-events-auto"
                  >
                      <RefreshCcw size={20} />
                      TEKRAR
                  </button>

                  <button 
                    onClick={handleNextLevel}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-full text-lg font-bold transition shadow-lg hover:scale-105 pointer-events-auto"
                  >
                      <Star size={20} fill="white" />
                      SONRAKİ SEVİYE
                  </button>
              </div>
          </div>
        )}
      </div>
    </>
  );
}
