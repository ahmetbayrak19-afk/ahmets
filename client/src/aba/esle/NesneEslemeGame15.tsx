import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, XCircle, Trophy, MousePointer2, GraduationCap, ClipboardCheck, RefreshCcw, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';
import { twMerge } from 'tailwind-merge';

// --- SES DOSYALARI ---
// (Yolunu kontrol et: aynı klasörde 'ses' klasörü varsa ./ses/... yoksa ../ses/...)
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

// --- KELİME HAVUZLARI (Seviyelere Göre) ---

// Seviye 1: Kısa Kelimeler (2-3 Harf)
const WORDS_LVL1 = [
  { id: 'al', text: 'AL' },
  { id: 'at', text: 'AT' },
  { id: 'ev', text: 'EV' },
  { id: 'top', text: 'TOP' },
  { id: 'muz', text: 'MUZ' },
  { id: 'kuş', text: 'KUŞ' },
  { id: 'ayı', text: 'AYI' },
  { id: 'kek', text: 'KEK' },
  { id: 'süt', text: 'SÜT' },
  { id: 'çay', text: 'ÇAY' }
];

// Seviye 2: Orta Kelimeler (4-5 Harf)
const WORDS_LVL2 = [
  { id: 'elma', text: 'ELMA' },
  { id: 'kedi', text: 'KEDİ' },
  { id: 'kapı', text: 'KAPI' },
  { id: 'masa', text: 'MASA' },
  { id: 'okul', text: 'OKUL' },
  { id: 'fare', text: 'FARE' },
  { id: 'soba', text: 'SOBA' },
  { id: 'çatı', text: 'ÇATI' },
  { id: 'kutu', text: 'KUTU' },
  { id: 'uçak', text: 'UÇAK' }
];

// Seviye 3: Uzun Kelimeler (6+ Harf)
const WORDS_LVL3 = [
  { id: 'telefon', text: 'TELEFON' },
  { id: 'otobüs', text: 'OTOBÜS' },
  { id: 'bardak', text: 'BARDAK' },
  { id: 'gözlük', text: 'GÖZLÜK' },
  { id: 'tavşan', text: 'TAVŞAN' },
  { id: 'karpuz', text: 'KARPUZ' },
  { id: 'balon', text: 'BALON' },
  { id: 'kelebek', text: 'KELEBEK' }
];

interface GameProps {
  mode: 'assessment' | 'instruction';
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

export default function NesneEslemeGame16({ mode, onClose, onComplete }: GameProps) {
  // GAME STATES
  const [level, setLevel] = useState(1); 
  const [questionIndex, setQuestionIndex] = useState(0); 
  const [isMuted, setIsMuted] = useState(false);

  const [phase, setPhase] = useState<'playing' | 'success' | 'fail'>('playing');
  
  // İlk başta boş bir obje ile başlatıyoruz, useEffect içinde dolacak
  const [targetItem, setTargetItem] = useState(WORDS_LVL1[0]);
  const [options, setOptions] = useState<typeof WORDS_LVL1>([]);
  
  const [assessmentCount, setAssessmentCount] = useState(0); 
  const [assessmentScore, setAssessmentScore] = useState(0); 
  
  const [instructionMistakeCount, setInstructionMistakeCount] = useState(0);
  const [isModeling, setIsModeling] = useState(false);
  const [flashCorrect, setFlashCorrect] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // Arkaplan Müziği ve Scroll Reset
  useEffect(() => {
    window.scrollTo(0, 0);

    bgMusicRef.current = new Audio(arkaplanMusic);
    bgMusicRef.current.loop = true; 
    bgMusicRef.current.volume = 0.15; 
    
    if (!isMuted) {
        bgMusicRef.current.play().catch(error => {
            console.log("Otomatik oynatma engellendi.", error);
        });
    }

    return () => {
        if (bgMusicRef.current) {
            bgMusicRef.current.pause();
            bgMusicRef.current.currentTime = 0;
        }
    };
  }, []);

  // Mute kontrolü
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

  // --- SORU ÜRETME ---
  const generateQuestion = () => {
    // 1. Hangi havuzu kullanacağız?
    let currentPool = WORDS_LVL1;
    let optionCount = 3; 

    if (level === 2) {
        currentPool = WORDS_LVL2;
        optionCount = 4;
    } else if (level === 3) {
        currentPool = WORDS_LVL3;
        optionCount = 4; // Kelimeler uzun olduğu için 6 yerine 4 seçenek daha iyi sığar
    }

    // 2. Rastgele hedef seç
    const randomTarget = currentPool[Math.floor(Math.random() * currentPool.length)];
    
    // 3. Çeldiricileri seç (Hedef hariç diğerleri)
    const distractors = currentPool.filter(item => item.id !== randomTarget.id)
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

  // Level değişince soru üret
  useEffect(() => { generateQuestion(); }, [level]);

  // --- SÜRÜKLE BIRAK MANTIĞI ---
  const handleDragEnd = (event: any, info: any, droppedItem: typeof WORDS_LVL1[0]) => {
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

    // Kelime eşleme olduğu için ID'ler (veya textler) aynı olmalı
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
    }
    
    if (mode === 'assessment') {
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

  // Grid Stili (Kelimeler uzun olduğu için 2 sütun daha iyi olabilir)
  const getGridClass = () => {
      // Level 1 (Kısa): 3 yan yana
      if (level === 1) return "grid-cols-3";
      // Level 2 (Orta): 2x2
      if (level === 2) return "grid-cols-2 max-w-[320px]"; 
      // Level 3 (Uzun): 2x2 (daha geniş sığsın)
      if (level === 3) return "grid-cols-2 max-w-[350px]";
      return "grid-cols-3";
  };

  // Okul Fontu (Comic Sans veya benzeri)
  const fontStyle = {
      fontFamily: '"Comic Sans MS", "Chalkboard SE", "Comic Neue", sans-serif'
  };

  return (
    <div className={twMerge(
        "fixed inset-0 z-[100] flex flex-col items-center justify-between p-4 select-none overflow-hidden touch-none overscroll-none text-slate-800 transition-colors duration-1000",
        (level === 3 && mode === 'instruction') 
            ? "bg-slate-100 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" 
            : "bg-slate-50"
    )}>
      
      {/* Üst Bar */}
      <div className="w-full max-w-2xl flex justify-between items-center text-slate-500 mb-2 relative z-10 font-sans">
        <button onClick={onClose} className="p-2 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-100">
          <XCircle size={24} className="text-slate-300" />
        </button>
        
        <div className="flex items-center gap-3">
             
             {/* LEVEL BUTONLARI (Kapsül) */}
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
            {/* HEDEF KELİME KUTUSU */}
            <div 
                ref={dropZoneRef}
                className={twMerge(
                    "w-72 h-32 bg-white rounded-[2rem] border-4 border-dashed flex items-center justify-center shadow-inner relative z-0 transition-all duration-300 px-4",
                    isMatched ? "border-green-500 bg-green-50 border-solid" : "border-slate-300"
                )}
            >
               <span 
                 style={fontStyle}
                 className={twMerge(
                    "font-bold text-slate-700 transition-all duration-500 pointer-events-none select-none tracking-wider",
                    // Uzun kelimelerde fontu küçült
                    targetItem.text.length > 5 ? "text-4xl" : "text-6xl",
                    isMatched ? "scale-110 text-green-600 drop-shadow-lg" : "opacity-90"
                 )}
               >
                 {targetItem.text}
               </span>
            </div>
            {!isMatched && <p className="mt-4 text-slate-400 font-bold text-xs tracking-widest uppercase animate-pulse font-sans">Eşini Üzerine Bırak</p>}
          </div>

          <div className={twMerge(
              "grid gap-3 w-full px-1 justify-items-center mx-auto",
              getGridClass() 
          )}>
            {options.map((item) => {
              const isCorrectItem = item.id === targetItem.id;
              const isLocked = mode === 'instruction' && instructionMistakeCount >= 2 && !isCorrectItem;
              const isHidden = isMatched && isCorrectItem;
              const canDrag = !isModeling && !isLocked && !isMatched;

              return (
                // Kutuların boyutu kelimeye göre değişebilir veya sabit kalabilir.
                // Kelimeler için h-16 (daha yatay) kullanıyoruz.
                <div key={item.id} className="relative flex justify-center items-center w-full h-20">
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
                            y: [0, -320, -320, 0], // Hedefe gitme mesafesini biraz kısalttım (kutular daha yakın)
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
                      "w-full h-16 bg-white rounded-xl shadow-[0_4px_0_0_#e2e8f0] flex items-center justify-center border-2 touch-none relative z-10 px-2",
                      canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed",
                      (isModeling && isCorrectItem) ? "border-blue-400 shadow-blue-100 shadow-xl" : 
                      (flashCorrect && isCorrectItem) ? "border-green-500 shadow-green-100" : "border-slate-100"
                    )}
                  >
                    <span 
                        style={fontStyle}
                        className={twMerge(
                            "font-bold text-slate-700 pointer-events-none select-none",
                            item.text.length > 6 ? "text-lg" : "text-2xl"
                        )}
                    >
                        {item.text}
                    </span>
                    
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
        <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center text-center p-8 font-sans">
           <Trophy size={100} className="text-yellow-500 mb-6 animate-bounce" />
           <h1 className="text-3xl font-black text-slate-800 mb-2 uppercase">Tamamlandı!</h1>
           <p className="text-slate-500 mb-8 font-medium text-lg">Başarı Oranı: {assessmentScore * 10}%</p>
           <button onClick={() => onComplete(true)} className="bg-green-600 text-white px-12 py-5 rounded-2xl font-bold text-xl shadow-xl active:scale-95 transition-all">
             KAYDET VE ÇIK
           </button>
        </div>
      )}

      {phase === 'fail' && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center text-center p-8 font-sans">
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
                        <span className="text-white text-3xl font-black tracking-widest font-sans">HAYIR</span>
                    </>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
     
