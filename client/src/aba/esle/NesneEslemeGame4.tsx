import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, XCircle, Trophy, MousePointer2, GraduationCap, ClipboardCheck, RefreshCcw, Volume2, VolumeX, Image as ImageIcon } from 'lucide-react';
import confetti from 'canvas-confetti';
import { twMerge } from 'tailwind-merge';

// --- 1. EN ALT KATMAN (ZEMİN) ---
import besgenBg from './besgen.png';
import daireBg from './daire.png';
import dikdortgenBg from './dikdortgen.png';
import kareBg from './kare.png';
import ucgenBg from './ucgen.png';
import yildizBg from './yildiz.png';
import kalpBg from './kalp.png';

// --- 2. EN ÜST KATMAN (ÇERÇEVE - ORTASI BOŞ) ---
import transBesgen from './transbesgen.png';
import transDaire from './transdaire.png';
import transDikdortgen from './transdikdortgen.png';
import transKare from './transkare.png';
import transUcgen from './transucgen.png';
import transYildiz from './transyildiz.png';
import transKalp from './transkalp.png';

// --- 3. SÜRÜKLENECEK PARÇA (DOLU ŞEKİL) ---
import besgenShape from './besgen1.png';
import daireShape from './daire1.png';
import dikdortgenShape from './dikdortgen1.png';
import kareShape from './kare1.png';
import ucgenShape from './ucgen1.png';
import yildizShape from './yildiz1.png';
import kalpShape from './kalp1.png';

// --- ARKAPLAN GÖRSELLERİ ---
import bgPortrait from './9_16arkaplan.png';  // Dikey (Mobil)
import bgLandscape from './16_9arkaplan.png'; // Yatay (Tablet/PC)

// --- SESLER ---
import arkaplanMusic from './ses/arkaplanmusic.mp3';
import aferin1 from './ses/aferin1.mp3';
import aferin2 from './ses/aferin2.mp3';
import bravo from './ses/bravo.mp3';
import esledinbravo from './ses/esledinbravo.mp3';
import harika1 from './ses/harika1.mp3';
import harika2 from './ses/harika2.mp3';
import tekrardene1 from './ses/tekrardene1.mp3';
import tekrardene2 from './ses/tekrardene2.mp3';

const POSITIVE_SOUNDS = [aferin1, aferin2, bravo, esledinbravo, harika1, harika2];
const NEGATIVE_SOUNDS = [tekrardene1, tekrardene2];

// VERİ YAPISI
const OBJECTS = [
  { id: 'besgen', name: 'Beşgen', src: besgenShape, frameSrc: transBesgen, bgSrc: besgenBg },
  { id: 'daire', name: 'Daire', src: daireShape, frameSrc: transDaire, bgSrc: daireBg },
  { id: 'dikdortgen', name: 'Dikdörtgen', src: dikdortgenShape, frameSrc: transDikdortgen, bgSrc: dikdortgenBg },
  { id: 'kare', name: 'Kare', src: kareShape, frameSrc: transKare, bgSrc: kareBg },
  { id: 'ucgen', name: 'Üçgen', src: ucgenShape, frameSrc: transUcgen, bgSrc: ucgenBg },
  { id: 'yildiz', name: 'Yıldız', src: yildizShape, frameSrc: transYildiz, bgSrc: yildizBg },
  { id: 'kalp', name: 'Kalp', src: kalpShape, frameSrc: transKalp, bgSrc: kalpBg },
];

interface GameProps {
  mode: 'assessment' | 'instruction';
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

export default function NesneEslemeGame4({ mode, onClose, onComplete }: GameProps) {
  const [level, setLevel] = useState(1); 
  const [questionIndex, setQuestionIndex] = useState(0); 
  const [isMuted, setIsMuted] = useState(false);
  
  // ARKAPLAN STATE'LERİ
  const [showBackground, setShowBackground] = useState(false); 
  const [currentBg, setCurrentBg] = useState(bgLandscape);     

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

  // EKRAN YÖNÜNÜ ALGILA
  useEffect(() => {
    const handleResize = () => {
      if (window.innerHeight > window.innerWidth) {
        setCurrentBg(bgPortrait);
      } else {
        setCurrentBg(bgLandscape);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Müzik
  useEffect(() => {
    window.scrollTo(0, 0);
    bgMusicRef.current = new Audio(arkaplanMusic);
    bgMusicRef.current.loop = true; 
    bgMusicRef.current.volume = 0.15; 
    if (!isMuted) bgMusicRef.current.play().catch(() => {});
    return () => { if (bgMusicRef.current) bgMusicRef.current.pause(); };
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
    audio.play().catch(() => {});
  };

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalStyle; };
  }, []);

  const generateQuestion = () => {
    const randomTarget = OBJECTS[Math.floor(Math.random() * OBJECTS.length)];
    let optionCount = 3; 
    if (level === 2) optionCount = 4;
    if (level === 3) optionCount = 6;

    const distractors = OBJECTS.filter(item => item.id !== randomTarget.id)
                             .sort(() => 0.5 - Math.random())
                             .slice(0, optionCount - 1); 

    setTargetItem(randomTarget);
    setOptions([randomTarget, ...distractors].sort(() => 0.5 - Math.random()));
    
    setShowFeedback(null);
    setIsModeling(false);
    setFlashCorrect(false);
    setInstructionMistakeCount(0);
    setIsMatched(false);
  };

  useEffect(() => { generateQuestion(); }, [level]);

  // --- SÜRÜKLEME ---
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

    const isCorrect = droppedItem.id === targetItem.id;

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
    } else {
        setAssessmentScore(prev => prev + 1);
    }

    setTimeout(() => {
      if (mode === 'instruction') {
          const nextQ = questionIndex + 1;
          setQuestionIndex(nextQ);
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
    } else {
        const newMistake = instructionMistakeCount + 1;
        setInstructionMistakeCount(newMistake);
        setShowFeedback('wrong');
        if (newMistake === 1) {
            setTimeout(() => { setShowFeedback(null); }, 1500);
            setTimeout(() => { runModelingDemo(); }, 500);
        } else if (newMistake >= 2) {
            setTimeout(() => setShowFeedback(null), 1000);
            setFlashCorrect(true);
            setTimeout(() => setFlashCorrect(false), 2000);
        }
    }
  };

  const runModelingDemo = () => {
    setIsModeling(true);
    setTimeout(() => { setIsModeling(false); }, 2000); 
  };

  const fireConfetti = () => {
    try {
        confetti({ particleCount: 300, spread: 100, origin: { y: 0.6 } });
    } catch (e) {}
  };

  useEffect(() => {
    if (mode === 'assessment' && assessmentCount === 10) {
      if (assessmentScore >= 9) { setPhase('success'); fireConfetti(); } 
      else { setPhase('fail'); }
    }
  }, [assessmentCount, assessmentScore, mode]);

  return (
    <div 
      style={showBackground ? { backgroundImage: `url(${currentBg})` } : {}}
      className={twMerge(
        // 🔥 DÜZELTME: h-[100dvh] ve w-screen (Tam ekran yerleşimi için)
        "fixed inset-0 h-[100dvh] w-screen z-[100] flex flex-col items-center justify-between p-4 font-sans select-none overflow-hidden touch-none overscroll-none text-slate-800 bg-cover bg-center transition-all duration-500",
        !showBackground ? "bg-slate-50" : ""
    )}>
      
      {/* ÜST BAR (Menü Hizalama Düzeltildi) */}
      <div className="w-full max-w-2xl flex justify-between items-center text-slate-500 mb-2 relative z-10">
        <button onClick={onClose} className="p-2 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-100">
          <XCircle size={24} className="text-slate-300" />
        </button>
        
        <div className="flex items-center gap-3">
            {/* --- ÖĞRETİM MODU ARAÇLARI (DÜZENLENDİ) --- */}
            {mode === 'instruction' && (
                 <div className="flex gap-2 mr-1">
                     {/* Level Butonlarını Grupla */}
                     <div className="flex bg-white/80 backdrop-blur-sm p-1 rounded-full border border-slate-200 items-center">
                         {[1, 2, 3].map((l) => (
                             <button
                                key={l}
                                onClick={() => { setLevel(l); setQuestionIndex(0); }}
                                className={twMerge(
                                    "px-3 py-1 text-xs font-bold rounded-full transition-all",
                                    level === l 
                                        ? "bg-orange-500 text-white shadow-sm" 
                                        : "text-slate-400 hover:text-slate-600"
                                )}
                             >
                                 LVL {l}
                             </button>
                         ))}
                     </div>

                     {/* Arkaplan Tuşu */}
                     <button
                        onClick={() => setShowBackground(!showBackground)}
                        className={twMerge(
                            "p-2 rounded-full border-2 transition-all active:scale-95 shadow-sm flex items-center justify-center",
                            showBackground 
                                ? "bg-indigo-500 text-white border-indigo-600" 
                                : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                        )}
                        title="Arkaplan"
                     >
                        <ImageIcon size={16} />
                     </button>
                 </div>
            )}

            <div className={twMerge("px-4 py-2 rounded-full shadow-sm border flex items-center gap-2 bg-white/90 backdrop-blur-sm", mode === 'assessment' ? "border-blue-100" : "border-purple-100")}>
                {mode === 'assessment' ? <ClipboardCheck size={16} className="text-blue-600"/> : <GraduationCap size={16} className="text-purple-600"/>}
                <span className={twMerge("font-bold text-xs uppercase", mode === 'assessment' ? "text-blue-600" : "text-purple-600")}>
                    {mode === 'assessment' ? `TEST: ${Math.min(assessmentCount + 1, 10)}/10` : "EĞİTİM"}
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
                style={{ perspective: '800px' }} 
                className={twMerge(
                    "w-64 h-64 md:w-72 md:h-72 bg-white rounded-[3rem] flex items-center justify-center relative z-0 transition-all duration-300 overflow-hidden shadow-lg",
                    isMatched ? "border-4 border-dashed border-green-500 shadow-green-100" : "border-4 border-dashed border-slate-300"
                )}
            >
               {/* 3 KATMANLI YAPI */}
               <img key={targetItem.id + '-frame'} src={targetItem.frameSrc} alt="Çerçeve" className="absolute w-48 h-48 md:w-56 md:h-56 object-contain z-20 pointer-events-none" />

               <motion.img 
                  key={targetItem.id + '-fill'}
                  src={targetItem.src} 
                  alt="Dolgu"
                  initial={{ opacity: 0, scale: 1.2, rotateX: 0, y: -50 }}
                  animate={{ 
                      opacity: isMatched ? 1 : 0,
                      scale: isMatched ? 0.9 : 1.2,  
                      rotateX: isMatched ? 50 : 0,
                      y: isMatched ? 10 : -50
                  }}
                  transition={{ duration: 0.5, type: "spring", bounce: 0.2 }} 
                  className="absolute w-48 h-48 md:w-56 md:h-56 object-contain z-10 pointer-events-none origin-bottom"
               />

               <img key={targetItem.id + '-bg'} src={targetItem.bgSrc} alt="Zemin" className="absolute w-48 h-48 md:w-56 md:h-56 object-contain z-0 pointer-events-none opacity-80" />

            </div>
            {!isMatched && <p className="mt-4 text-slate-400 font-bold text-xs tracking-widest uppercase animate-pulse drop-shadow-md">Eşini Kutuya Bırak</p>}
          </div>

          {/* 🔥 DÜZELTME: pb-8 eklenerek alt kısımdaki şekiller yukarı çekildi */}
          <div className={twMerge(
              "grid gap-4 w-full px-1 justify-items-center pb-8",
              level === 2 ? "grid-cols-2" : "grid-cols-3"
          )}>
            {options.map((item) => {
              const isCorrectItem = item.id === targetItem.id;
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
                            y: [0, -320, -320, 0], 
                            scale: [1, 1.2, 1.2, 1],
                            x: 0
                          } 
                        : (flashCorrect && isCorrectItem)
                        ? { x: [0, -5, 5, -5, 0] } 
                        : { scale: 1, opacity: isLocked ? 0.3 : 1 }
                    }
                    transition={
                        (isModeling && isCorrectItem)
                        ? { duration: 2, times: [0, 0.4, 0.7, 1], ease: "easeInOut" }
                        : { duration: 0.3 }
                    }

                    className={twMerge(
                      "w-24 h-24 flex items-center justify-center touch-none relative z-10",
                      canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed"
                    )}
                  >
                    {/* Sadece dolu şekil gösteriliyor, çünkü sürüklenecek parça bu */}
                    <img src={item.src} alt={item.name} className="w-20 h-20 object-contain pointer-events-none drop-shadow-xl" />
                    
                    {isModeling && isCorrectItem && (
                        <motion.div 
                           animate={{ opacity: [0, 1, 1, 0] }}
                           transition={{ times: [0, 0.1, 0.8, 1], duration: 2 }}
                           className="absolute -bottom-2 -right-2 text-blue-600 bg-white rounded-full p-2 shadow-lg border border-blue-100"
                        >
                            <MousePointer2 size={32} fill="currentColor" />
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
