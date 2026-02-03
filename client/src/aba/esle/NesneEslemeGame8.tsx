import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, XCircle, Trophy, MousePointer2, GraduationCap, ClipboardCheck, RefreshCcw, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';
import { twMerge } from 'tailwind-merge';

// --- GRUP 1: GERÇEK NESNELER (Fotoğraflar) ---
import anahtarImg from './anahtar.png';
import arabaImg from './araba.png';
import cicekImg from './cicek.png';
import elmaImg from './elma.png';
import gitarImg from './gitar.png';
import kalemImg from './kalem.png';
import kitapImg from './kitap.png';
import saatImg from './saat.png';
import tavukImg from './tavuk.png';
import topImg from './top.png';

import anahtar1Img from './anahtar1.png';
import araba1Img from './araba1.png';
import cicek1Img from './cicek1.png';
import elma1Img from './elma1.png';
import gitar1Img from './gitar1.png';
import kalem1Img from './kalem1.png';
import kitap1Img from './kitap1.png';
import saat1Img from './saat1.png';
import tavuk1Img from './tavuk1.png';
import top1Img from './top1.png';

// --- GRUP 2: ÇİZİM/FARKLI NESNELER (Resimler) ---
import anahtar2Img from './anahtar2.png';
import araba2Img from './araba2.png';
import cicek2Img from './cicek2.png';
import elma2Img from './elma2.png';
import gitar2Img from './gitar2.png';
import kalem2Img from './kalem2.png';
import kitap2Img from './kitap2.png';
import saat2Img from './saat2.png';
import tavuk2Img from './tavuk2.png';
import top2Img from './top2.png';

import anahtar3Img from './anahtar3.png';
import araba3Img from './araba3.png';
import cicek3Img from './cicek3.png';
import elma3Img from './elma3.png';
import gitar3Img from './gitar3.png';
import kalem3Img from './kalem3.png';
import kitap3Img from './kitap3.png';
import saat3Img from './saat3.png';
import tavuk3Img from './tavuk3.png';
import top3Img from './top3.png';

// --- SES DOSYALARI ---
import arkaplanMusic from './ses/arkaplanmusic.mp3';
import aferin1 from './ses/aferin1.mp3';
import aferin2 from './ses/aferin2.mp3';
import bravo from './ses/bravo.mp3';
import esledinbravo from './ses/esledinbravo.mp3';
import harika1 from './ses/harika1.mp3';
import harika2 from './ses/harika2.mp3';
import tekrardene1 from './ses/tekrardene1.mp3';
import tekrardene2 from './ses/tekrardene2.mp3';

// --- SES HAVUZLARI ---
const POSITIVE_SOUNDS = [aferin1, aferin2, bravo, esledinbravo, harika1, harika2];
const NEGATIVE_SOUNDS = [tekrardene1, tekrardene2];

// --- VERİ HAVUZU ---
const OBJECTS = [
  // GRUP 1 (Gerçek/Foto) - ID sonu rakamsız veya 1
  { id: 'anahtar', name: 'Anahtar', type: 'real', src: anahtarImg },
  { id: 'anahtar1', name: 'Anahtar', type: 'real', src: anahtar1Img },
  { id: 'araba', name: 'Araba', type: 'real', src: arabaImg },
  { id: 'araba1', name: 'Araba', type: 'real', src: araba1Img },
  { id: 'cicek', name: 'Çiçek', type: 'real', src: cicekImg },
  { id: 'cicek1', name: 'Çiçek', type: 'real', src: cicek1Img },
  { id: 'elma', name: 'Elma', type: 'real', src: elmaImg },
  { id: 'elma1', name: 'Elma', type: 'real', src: elma1Img },
  { id: 'gitar', name: 'Gitar', type: 'real', src: gitarImg },
  { id: 'gitar1', name: 'Gitar', type: 'real', src: gitar1Img },
  { id: 'kalem', name: 'Kalem', type: 'real', src: kalemImg },
  { id: 'kalem1', name: 'Kalem', type: 'real', src: kalem1Img },
  { id: 'kitap', name: 'Kitap', type: 'real', src: kitapImg },
  { id: 'kitap1', name: 'Kitap', type: 'real', src: kitap1Img },
  { id: 'saat', name: 'Saat', type: 'real', src: saatImg },
  { id: 'saat1', name: 'Saat', type: 'real', src: saat1Img },
  { id: 'tavuk', name: 'Tavuk', type: 'real', src: tavukImg },
  { id: 'tavuk1', name: 'Tavuk', type: 'real', src: tavuk1Img },
  { id: 'top', name: 'Top', type: 'real', src: topImg },
  { id: 'top1', name: 'Top', type: 'real', src: top1Img },

  // GRUP 2 (Çizim/Resim) - ID sonu 2 veya 3
  { id: 'anahtar2', name: 'Anahtar', type: 'drawing', src: anahtar2Img },
  { id: 'anahtar3', name: 'Anahtar', type: 'drawing', src: anahtar3Img },
  { id: 'araba2', name: 'Araba', type: 'drawing', src: araba2Img },
  { id: 'araba3', name: 'Araba', type: 'drawing', src: araba3Img },
  { id: 'cicek2', name: 'Çiçek', type: 'drawing', src: cicek2Img },
  { id: 'cicek3', name: 'Çiçek', type: 'drawing', src: cicek3Img },
  { id: 'elma2', name: 'Elma', type: 'drawing', src: elma2Img },
  { id: 'elma3', name: 'Elma', type: 'drawing', src: elma3Img },
  { id: 'gitar2', name: 'Gitar', type: 'drawing', src: gitar2Img },
  { id: 'gitar3', name: 'Gitar', type: 'drawing', src: gitar3Img },
  { id: 'kalem2', name: 'Kalem', type: 'drawing', src: kalem2Img },
  { id: 'kalem3', name: 'Kalem', type: 'drawing', src: kalem3Img },
  { id: 'kitap2', name: 'Kitap', type: 'drawing', src: kitap2Img },
  { id: 'kitap3', name: 'Kitap', type: 'drawing', src: kitap3Img },
  { id: 'saat2', name: 'Saat', type: 'drawing', src: saat2Img },
  { id: 'saat3', name: 'Saat', type: 'drawing', src: saat3Img },
  { id: 'tavuk2', name: 'Tavuk', type: 'drawing', src: tavuk2Img },
  { id: 'tavuk3', name: 'Tavuk', type: 'drawing', src: tavuk3Img },
  { id: 'top2', name: 'Top', type: 'drawing', src: top2Img },
  { id: 'top3', name: 'Top', type: 'drawing', src: top3Img },
];

interface GameProps {
  mode: 'assessment' | 'instruction';
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

export default function NesneEslemeGame8({ mode, onClose, onComplete }: GameProps) {
  // GAME STATES
  const [level, setLevel] = useState(1); 
  const [questionIndex, setQuestionIndex] = useState(0); 
  const [isMuted, setIsMuted] = useState(false);

  const [phase, setPhase] = useState<'playing' | 'success' | 'fail'>('playing');
  const [targetItem, setTargetItem] = useState(OBJECTS[0]);
  const [options, setOptions] = useState<typeof OBJECTS[]>([]);
  
  const [assessmentCount, setAssessmentCount] = useState(0); 
  const [assessmentScore, setAssessmentScore] = useState(0); 
  
  const [instructionMistakeCount, setInstructionMistakeCount] = useState(0);
  const [isModeling, setIsModeling] = useState(false);
  const [flashCorrect, setFlashCorrect] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // Arkaplan Müziği
  useEffect(() => {
    window.scrollTo(0, 0);

    bgMusicRef.current = new Audio(arkaplanMusic);
    bgMusicRef.current.loop = true; 
    bgMusicRef.current.volume = 0.15; 
    
    if (!isMuted) {
        bgMusicRef.current.play().catch(error => console.log("Otomatik oynatma engellendi.", error));
    }

    return () => {
        if (bgMusicRef.current) {
            bgMusicRef.current.pause();
            bgMusicRef.current.currentTime = 0;
        }
    };
  }, []);

  useEffect(() => {
    if (bgMusicRef.current) {
        if (isMuted) bgMusicRef.current.pause();
        else bgMusicRef.current.play().catch(()=>{});
    }
  }, [isMuted]);

  const playSoundEffect = (type: 'success' | 'fail') => {
    let soundSrc;
    if (type === 'success') {
        const randomIndex = Math.floor(Math.random() * POSITIVE_SOUNDS.length);
        soundSrc = POSITIVE_SOUNDS[randomIndex];
    } else {
        const randomIndex = Math.floor(Math.random() * NEGATIVE_SOUNDS.length);
        soundSrc = NEGATIVE_SOUNDS[randomIndex];
    }
    const audio = new Audio(soundSrc);
    audio.volume = 1.0; 
    audio.play().catch(e => console.log("Ses oynatılamadı", e));
  };

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalStyle; };
  }, []);

  // --- YARDIMCI: ID'den Base Name Alma (anahtar2 -> anahtar) ---
  const getBaseId = (id: string) => {
    return id.replace(/[0-9]/g, ''); 
  };

  // --- SORU ÜRETME MANTIĞI (RESİM-NESNE) ---
  const generateQuestion = () => {
    // 1. Hedef: Rastgele bir GERÇEK nesne seç (Grup 1'den)
    const realObjects = OBJECTS.filter(o => o.type === 'real');
    const randomTarget = realObjects[Math.floor(Math.random() * realObjects.length)];
    const targetBase = getBaseId(randomTarget.id);

    // 2. Doğru Cevap: Hedefin ÇİZİM versiyonunu bul (Grup 2'den)
    const drawingObjects = OBJECTS.filter(o => o.type === 'drawing');
    // Aynı isme sahip (baseId) ama türü drawing olanlardan rastgele birini seç
    const possibleCorrectAnswers = drawingObjects.filter(o => getBaseId(o.id) === targetBase);
    
    if (possibleCorrectAnswers.length === 0) {
        generateQuestion(); // Güvenlik
        return;
    }
    const correctAnswer = possibleCorrectAnswers[Math.floor(Math.random() * possibleCorrectAnswers.length)];

    // 3. Seçenek Sayısını Belirle
    let optionCount = 3; 
    if (level === 2) optionCount = 4;
    if (level === 3) optionCount = 6;
    const distractorCount = optionCount - 1;

    // 4. Çeldiricileri Belirle (KRİTİK BÖLÜM)
    // - Çeldiriciler "Drawing" grubundan olmalı (Görsel bütünlük için)
    // - Hedefin isminde OLMAMALI (Yani 'anahtar' soruluyorsa şıklarda başka anahtar olmamalı)
    const distractors = drawingObjects.filter(item => {
        return getBaseId(item.id) !== targetBase;
    })
    .sort(() => 0.5 - Math.random())
    .slice(0, distractorCount);

    setTargetItem(randomTarget);
    // Doğru cevap ve çeldiricileri karıştır
    setOptions([correctAnswer, ...distractors].sort(() => 0.5 - Math.random()));
    
    // Sıfırlamalar
    setShowFeedback(null);
    setIsModeling(false);
    setFlashCorrect(false);
    setInstructionMistakeCount(0);
    setIsMatched(false);
  };

  useEffect(() => { generateQuestion(); }, [level]);

  const handleDragEnd = (event: any, info: any, droppedItem: typeof OBJECTS[0]) => {
    if (isModeling || isMatched) return;

    const dropZone = dropZoneRef.current;
    if (!dropZone) return;
    
    const dropRect = dropZone.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;

    if (event.changedTouches && event.changedTouches.length > 0) {
        clientX = event.changedTouches[0].clientX;
        clientY = event.changedTouches[0].clientY;
    } else if (event.clientX) {
        clientX = event.clientX;
        clientY = event.clientY;
    } else {
        clientX = info.point.x;
        clientY = info.point.y;
    }

    const isInside = 
        clientX >= dropRect.left - 40 && 
        clientX <= dropRect.right + 40 &&
        clientY >= dropRect.top - 40 && 
        clientY <= dropRect.bottom + 40;

    if (!isInside) return;

    // KONTROL: İsimleri (Base Name) aynı mı?
    const isCorrect = getBaseId(droppedItem.id) === getBaseId(targetItem.id);

    if (isCorrect) {
      handleSuccess();
    } else {
      handleMistake();
    }
  };

  const handleSuccess = () => {
    setIsMatched(true); 
    playSoundEffect('success'); 

    if (mode === 'instruction') {
        setShowFeedback('correct');
    }
    
    if (mode === 'assessment') {
        setAssessmentScore(prev => prev + 1);
    }

    setTimeout(() => {
      if (mode === 'instruction') {
          setQuestionIndex(prev => prev + 1);
          generateQuestion();
      } else {
        const nextCount = assessmentCount + 1;
        setAssessmentCount(nextCount);
        if (nextCount < 10) generateQuestion();
      }
    }, 1500);
  };

  const handleMistake = () => {
    playSoundEffect('fail');

    if (mode === 'assessment') {
        setTimeout(() => {
            const nextCount = assessmentCount + 1;
            setAssessmentCount(nextCount);
            if (nextCount < 10) generateQuestion();
        }, 800);
    } 
    else {
        const newMistake = instructionMistakeCount + 1;
        setInstructionMistakeCount(newMistake);
        setShowFeedback('wrong');

        if (newMistake === 1) {
            setTimeout(() => { setShowFeedback(null); }, 1500);
            setTimeout(() => { runModelingDemo(); }, 500);
        } 
        else if (newMistake >= 2) {
            setTimeout(() => setShowFeedback(null), 1000);
            setFlashCorrect(true);
            setTimeout(() => setFlashCorrect(false), 2000);
        }
    }
  };

  const runModelingDemo = () => {
    setIsModeling(true);
    setTimeout(() => {
        setIsModeling(false);
    }, 2000); 
  };

  const fireConfetti = () => {
    try {
        confetti({ particleCount: 300, spread: 100, origin: { y: 0.6 } });
    } catch (e) {
        console.error("Confetti hatası:", e);
    }
  };

  useEffect(() => {
    if (mode === 'assessment' && assessmentCount === 10) {
      if (assessmentScore >= 9) {
        setPhase('success');
        fireConfetti();
      } else {
        setPhase('fail');
      }
    }
  }, [assessmentCount, assessmentScore, mode]);

  const getGridClass = () => {
      if (level === 1) return "grid-cols-3";
      if (level === 2) return "grid-cols-2 max-w-[300px]"; 
      if (level === 3) return "grid-cols-3";
      return "grid-cols-3";
  };

  return (
    <div className={twMerge(
        "fixed inset-0 z-[100] flex flex-col items-center justify-between p-4 font-sans select-none overflow-hidden touch-none overscroll-none text-slate-800 transition-colors duration-1000",
        (level === 3 && mode === 'instruction') 
            ? "bg-slate-100 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" 
            : "bg-slate-50"
    )}>
      
      {/* Üst Bar */}
      <div className="w-full max-w-2xl flex justify-between items-center text-slate-500 mb-2 relative z-10">
        <button onClick={onClose} className="p-2 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-100">
          <XCircle size={24} className="text-slate-300" />
        </button>
        
        <div className="flex items-center gap-3">
             
             {mode === 'instruction' && (
                 <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200 items-center">
                     {[1, 2, 3].map(l => (
                         <button 
                            key={l}
                            onClick={() => setLevel(l)} 
                            className={twMerge(
                                "px-4 py-1.5 text-xs font-bold rounded-full transition-all",
                                level === l 
                                    ? "bg-white text-blue-600 shadow-sm" 
                                    : "text-slate-400 hover:text-slate-600"
                            )}
                         >
                            LVL {l}
                         </button>
                     ))}
                 </div>
            )}

            <div className={twMerge(
                "px-4 py-2 rounded-full shadow-sm border flex items-center gap-2",
                mode === 'assessment' ? "bg-blue-50 border-blue-100" : "bg-purple-50 border-purple-100"
            )}>
                {mode === 'assessment' ? <ClipboardCheck size={16} className="text-blue-600"/> : <GraduationCap size={16} className="text-purple-600"/>}
                <span className={twMerge("font-bold text-xs uppercase", mode === 'assessment' ? "text-blue-600" : "text-purple-600")}>
                    {mode === 'assessment' ? `TEST: ${Math.min(assessmentCount + 1, 10)}/10` : "ÖĞRETİM"}
                </span>
            </div>
            
            <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-white border rounded-full shadow-sm active:scale-95">
                 {isMuted ? <VolumeX size={20} className="text-slate-400"/> : <Volume2 size={20} className="text-blue-500"/>}
            </button>
        </div>
      </div>

      {/* --- OYUN ALANI --- */}
      {phase === 'playing' && (
        <div className="flex-1 flex flex-col justify-around w-full max-w-md h-full">
          
          <div className="flex flex-col items-center">
            {/* HEDEF KUTU */}
            <div 
                ref={dropZoneRef}
                className={twMerge(
                    "w-72 h-72 bg-white rounded-[3rem] border-4 border-dashed flex items-center justify-center shadow-inner relative z-0 transition-all duration-300",
                    isMatched ? "border-green-500 bg-green-50 border-solid" : "border-slate-300"
                )}
            >
               <img 
                 src={targetItem.src} 
                 alt={targetItem.name} 
                 className={twMerge(
                    "object-contain transition-all duration-500 pointer-events-none",
                    isMatched ? "w-56 h-56 opacity-100 scale-110 drop-shadow-2xl" : "w-48 h-48 opacity-90"
                 )} 
               />
            </div>
            {!isMatched && <p className="mt-4 text-slate-400 font-bold text-xs tracking-widest uppercase animate-pulse">Resmini Üzerine Bırak (Resim-Nesne)</p>}
          </div>

          <div className={twMerge(
              "grid gap-3 w-full px-1 justify-items-center mx-auto",
              getGridClass() 
          )}>
            {options.map((item) => {
              // KONTROL: Base Name Eşleşmesi
              const isCorrectItem = getBaseId(item.id) === getBaseId(targetItem.id);
              
              const isLocked = mode === 'instruction' && instructionMistakeCount >= 2 && !isCorrectItem;
              const isHidden = isMatched && isCorrectItem;
              const canDrag = !isModeling && !isLocked && !isMatched;

              return (
                <div key={item.id} className="relative flex justify-center items-center h-28 w-full">
                  <motion.div
                    drag={canDrag}
                    dragConstraints={false}
                    dragSnapToOrigin={true} 
                    dragElastic={0.1}
                    dragMomentum={false}
                    onDragEnd={(e, info) => handleDragEnd(e, info, item)}
                    whileDrag={{ scale: 1.1, zIndex: 100 }}
                    
                    animate={
                        isHidden
                        ? { opacity: 0, scale: 0 }
                        : (isModeling && isCorrectItem) 
                        ? { 
                            y: [0, -380, -380, 0], 
                            scale: [1, 1.2, 1.2, 1],
                            x: 0
                          } 
                        : (flashCorrect && isCorrectItem)
                        ? { scale: [1, 1.1, 1], borderColor: ["#e2e8f0", "#22c55e", "#e2e8f0"], borderWidth: [2, 4, 2] }
                        : { scale: 1, opacity: isLocked ? 0.3 : 1 }
                    }
                    transition={
                        (isModeling && isCorrectItem)
                        ? { duration: 2, times: [0, 0.4, 0.7, 1], ease: "easeInOut" }
                        : { duration: 0.3 }
                    }

                    className={twMerge(
                      "w-24 h-24 bg-white rounded-2xl shadow-[0_6px_0_0_#e2e8f0] flex items-center justify-center border-2 touch-none relative z-10",
                      canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed",
                      (isModeling && isCorrectItem) ? "border-blue-400 shadow-blue-100 shadow-xl" : 
                      (flashCorrect && isCorrectItem) ? "border-green-500 shadow-green-100" : "border-slate-100"
                    )}
                  >
                    <img src={item.src} alt={item.name} className="w-16 h-16 object-contain pointer-events-none" />
                    
                    {isModeling && isCorrectItem && (
                        <motion.div 
                           animate={{ opacity: [0, 1, 1, 0] }}
                           transition={{ times: [0, 0.1, 0.8, 1], duration: 2 }}
                           className="absolute -bottom-2 -right-2 text-blue-600 bg-white rounded-full p-2 shadow-lg border border-blue-100"
                        >
                            <MousePointer2 size={24} fill="currentColor" />
                        </motion.div>
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SONUÇ EKRANLARI */}
      {phase === 'success' && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center text-center p-8">
           <Trophy size={100} className="text-yellow-500 mb-6 animate-bounce" />
           <h1 className="text-3xl font-black text-slate-800 mb-2 uppercase">Tamamlandı!</h1>
           <p className="text-slate-500 mb-8 font-medium text-lg">Başarı Oranı: {assessmentScore * 10}%</p>
           <button onClick={() => onComplete(true)} className="bg-green-600 text-white px-12 py-5 rounded-2xl font-bold text-xl shadow-xl active:scale-95 transition-all">
             KAYDET VE ÇIK
           </button>
        </div>
      )}

      {phase === 'fail' && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center text-center p-8">
           <div className="text-8xl mb-6 italic font-black text-slate-200">!</div>
           <h1 className="text-2xl font-black text-slate-800 mb-2 uppercase">Tekrar Deneyelim</h1>
           <p className="text-slate-500 mb-10 font-medium">Skor: {assessmentScore} / 10</p>
           <div className="flex gap-4">
             <button onClick={onClose} className="bg-slate-100 text-slate-600 px-8 py-4 rounded-xl font-bold text-lg">KAPAT</button>
             <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg flex items-center gap-2">
               <RefreshCcw size={20}/> YENİDEN BAŞLA
             </button>
           </div>
        </div>
      )}

      {/* FEEDBACK OVERLAY */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[110] flex flex-col items-center justify-start pt-32 pointer-events-none"
          >
            <div className={`
                px-10 py-5 rounded-full shadow-2xl flex items-center gap-4
                ${showFeedback === 'correct' ? 'bg-green-500' : 'bg-red-500'}
            `}>
                {showFeedback === 'correct' ? (
                    <Check size={48} className="text-white"/> 
                ) : (
                    <>
                        <XCircle size={36} className="text-white"/>
                        <span className="text-white text-3xl font-black tracking-widest">HAYIR</span>
                    </>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
