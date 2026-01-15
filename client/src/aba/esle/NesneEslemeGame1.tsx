import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, XCircle, Trophy, MousePointer2, GraduationCap, ClipboardCheck, RefreshCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { twMerge } from 'tailwind-merge';

// --- 1. SET RESİMLER (2. Varyasyonlar) ---
// Önceki dosyada 1 vardı, bunda 2 ile başlıyoruz
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

// --- 2. SET RESİMLER (3. Varyasyonlar) ---
// Önceki dosyada 1 vardı, bunda 3 ile devam ediyoruz
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

const OBJECTS = [
  // 1. Grup (Dosya isimleri 2 olanlar)
  { id: 'anahtar2', name: 'Anahtar', src: anahtar2Img },
  { id: 'araba2', name: 'Araba', src: araba2Img },
  { id: 'cicek2', name: 'Çiçek', src: cicek2Img },
  { id: 'elma2', name: 'Elma', src: elma2Img },
  { id: 'gitar2', name: 'Gitar', src: gitar2Img },
  { id: 'kalem2', name: 'Kalem', src: kalem2Img },
  { id: 'kitap2', name: 'Kitap', src: kitap2Img },
  { id: 'saat2', name: 'Saat', src: saat2Img },
  { id: 'tavuk2', name: 'Tavuk', src: tavuk2Img },
  { id: 'top2', name: 'Top', src: top2Img },
  
  // 2. Grup (Dosya isimleri 3 olanlar)
  { id: 'anahtar3', name: 'Anahtar', src: anahtar3Img },
  { id: 'araba3', name: 'Araba', src: araba3Img },
  { id: 'cicek3', name: 'Çiçek', src: cicek3Img },
  { id: 'elma3', name: 'Elma', src: elma3Img },
  { id: 'gitar3', name: 'Gitar', src: gitar3Img },
  { id: 'kalem3', name: 'Kalem', src: kalem3Img },
  { id: 'kitap3', name: 'Kitap', src: kitap3Img },
  { id: 'saat3', name: 'Saat', src: saat3Img },
  { id: 'tavuk3', name: 'Tavuk', src: tavuk3Img },
  { id: 'top3', name: 'Top', src: top3Img },
];

interface GameProps {
  mode: 'assessment' | 'instruction';
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

export default function NesneEslemeGame({ mode, onClose, onComplete }: GameProps) {
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

  // Scroll kilitleme
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalStyle; };
  }, []);

  const generateQuestion = () => {
    const randomTarget = OBJECTS[Math.floor(Math.random() * OBJECTS.length)];
    // Hedefle aynı ID'ye sahip olmayanları filtrele
    const distractors = OBJECTS.filter(item => item.id !== randomTarget.id)
                             .sort(() => 0.5 - Math.random())
                             .slice(0, 2); 

    setTargetItem(randomTarget);
    setOptions([randomTarget, ...distractors].sort(() => 0.5 - Math.random()));
    
    setShowFeedback(null);
    setIsModeling(false);
    setFlashCorrect(false);
    setInstructionMistakeCount(0);
    setIsMatched(false);
  };

  useEffect(() => { generateQuestion(); }, []);

  const handleDragEnd = (event: any, info: any, droppedItem: typeof OBJECTS[0]) => {
    if (isModeling || isMatched) return;

    const dropZone = dropZoneRef.current;
    if (!dropZone) return;
    const dropRect = dropZone.getBoundingClientRect();
    const dropX = info.point.x;
    const dropY = info.point.y;

    const isInside = 
        dropX >= dropRect.left - 40 && 
        dropX <= dropRect.right + 40 &&
        dropY >= dropRect.top - 40 && 
        dropY <= dropRect.bottom + 40;

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

    if (mode === 'instruction') {
        setShowFeedback('correct');
    }
    
    if (mode === 'assessment') {
        setAssessmentScore(prev => prev + 1);
    }

    setTimeout(() => {
      if (mode === 'assessment') {
        const nextCount = assessmentCount + 1;
        setAssessmentCount(nextCount);
        if (nextCount < 10) generateQuestion();
      } else {
        generateQuestion();
      }
    }, 1500);
  };

  const handleMistake = () => {
    if (mode === 'assessment') {
        // Değerlendirmede sessiz geçiş
        setTimeout(() => {
            const nextCount = assessmentCount + 1;
            setAssessmentCount(nextCount);
            if (nextCount < 10) generateQuestion();
        }, 800);
    } 
    else {
        // Öğretimde modelleme
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
    // Hız ayarı: 2 saniye (Diğer dosya ile aynı)
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

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col items-center justify-between p-4 font-sans select-none overflow-hidden touch-none overscroll-none text-slate-800">
      
      {/* Üst Bar */}
      <div className="w-full max-w-2xl flex justify-between items-center text-slate-500 mb-2 relative z-10">
        <button onClick={onClose} className="p-2 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-100">
          <XCircle size={24} className="text-slate-300" />
        </button>
        
        <div className="flex items-center gap-3">
            <div className={twMerge(
                "px-4 py-2 rounded-full shadow-sm border flex items-center gap-2",
                mode === 'assessment' ? "bg-blue-50 border-blue-100" : "bg-purple-50 border-purple-100"
            )}>
                {mode === 'assessment' ? <ClipboardCheck size={16} className="text-blue-600"/> : <GraduationCap size={16} className="text-purple-600"/>}
                <span className={twMerge("font-bold text-xs uppercase", mode === 'assessment' ? "text-blue-600" : "text-purple-600")}>
                    {mode === 'assessment' ? `TEST: ${Math.min(assessmentCount + 1, 10)}/10` : "ÖĞRETİM"}
                </span>
            </div>
            {mode === 'assessment' && (
                <div className="bg-green-50 px-4 py-2 rounded-full shadow-sm border border-green-100 font-black text-green-600 text-xs">
                    PUAN: {assessmentScore}
                </div>
            )}
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
                    "object-contain transition-all duration-500",
                    isMatched ? "w-56 h-56 opacity-100 scale-110 drop-shadow-2xl" : "w-48 h-48 opacity-90"
                 )} 
               />
            </div>
            {!isMatched && <p className="mt-4 text-slate-400 font-bold text-xs tracking-widest uppercase animate-pulse">Eşini Üzerine Bırak</p>}
          </div>

          <div className="grid grid-cols-3 gap-2 w-full px-1">
            {options.map((item) => {
              const isCorrectItem = item.id === targetItem.id;
              const isLocked = mode === 'instruction' && instructionMistakeCount >= 2 && !isCorrectItem;
              const isHidden = isMatched && isCorrectItem;
              const canDrag = !isModeling && !isLocked && !isMatched;

              return (
                <div key={item.id} className="relative flex justify-center items-center h-36">
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
                        // Hız ayarı: 2 saniye
                        ? { duration: 2, times: [0, 0.4, 0.7, 1], ease: "easeInOut" }
                        : { duration: 0.3 }
                    }

                    className={twMerge(
                      "w-32 h-32 bg-white rounded-3xl shadow-[0_8px_0_0_#e2e8f0] flex items-center justify-center border-2 touch-none relative z-10",
                      canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed",
                      (isModeling && isCorrectItem) ? "border-blue-400 shadow-blue-100 shadow-xl" : 
                      (flashCorrect && isCorrectItem) ? "border-green-500 shadow-green-100" : "border-slate-100"
                    )}
                  >
                    <img src={item.src} alt={item.name} className="w-24 h-24 object-contain pointer-events-none" />
                    
                    {isModeling && isCorrectItem && (
                        <motion.div 
                           animate={{ opacity: [0, 1, 1, 0] }}
                           // Hız ayarı: 2 saniye
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
