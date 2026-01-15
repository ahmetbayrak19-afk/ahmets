import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, XCircle, Trophy, MousePointer2, GraduationCap, ClipboardCheck, RefreshCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { twMerge } from 'tailwind-merge';

// --- RESİMLERİN HEPSİNİ IMPORT ET ---
import anahtar from './anahtar.png'; import anahtar1 from './anahtar1.png';
import araba from './araba.png'; import araba1 from './araba1.png';
import cicek from './cicek.png'; import cicek1 from './cicek1.png';
import elma from './elma.png'; import elma1 from './elma1.png';
import gitar from './gitar.png'; import gitar1 from './gitar1.png';
import kalem from './kalem.png'; import kalem1 from './kalem1.png';
import kitap from './kitap.png'; import kitap1 from './kitap1.png';
import saat from './saat.png'; import saat1 from './saat1.png';
import tavuk from './tavuk.png'; import tavuk1 from './tavuk1.png';
import top from './top.png'; import top1 from './top1.png';

// --- VERİ HAVUZU (Varyasyonlu) ---
const OBJECTS = [
  { id: 'anahtar', name: 'Anahtar', variants: [anahtar, anahtar1] },
  { id: 'araba', name: 'Araba', variants: [araba, araba1] },
  { id: 'cicek', name: 'Çiçek', variants: [cicek, cicek1] },
  { id: 'elma', name: 'Elma', variants: [elma, elma1] },
  { id: 'gitar', name: 'Gitar', variants: [gitar, gitar1] },
  { id: 'kalem', name: 'Kalem', variants: [kalem, kalem1] },
  { id: 'kitap', name: 'Kitap', variants: [kitap, kitap1] },
  { id: 'saat', name: 'Saat', variants: [saat, saat1] },
  { id: 'tavuk', name: 'Tavuk', variants: [tavuk, tavuk1] },
  { id: 'top', name: 'Top', variants: [top, top1] },
];

interface GameProps {
  mode: 'assessment' | 'instruction';
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

export default function NesneEslemeGame({ mode, onClose, onComplete }: GameProps) {
  const [phase, setPhase] = useState<'playing' | 'success' | 'fail'>('playing');
  const [targetItem, setTargetItem] = useState<{id: string, name: string, src: string} | null>(null);
  const [options, setOptions] = useState<{id: string, name: string, src: string}[]>([]);
  
  const [assessmentCount, setAssessmentCount] = useState(0); 
  const [assessmentScore, setAssessmentScore] = useState(0); 
  
  const [instructionMistakeCount, setInstructionMistakeCount] = useState(0);
  const [isModeling, setIsModeling] = useState(false);
  const [flashCorrect, setFlashCorrect] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalStyle; };
  }, []);

  const generateQuestion = () => {
    // 1. Rastgele Nesne Seç
    const randomObj = OBJECTS[Math.floor(Math.random() * OBJECTS.length)];
    
    // 2. Bu nesnenin rastgele bir varyasyonunu seç (anahtar mı, anahtar1 mi?)
    const randomVariant = randomObj.variants[Math.floor(Math.random() * randomObj.variants.length)];

    // 3. Yanıltıcıları seç (Diğer nesnelerin rastgele varyasyonları)
    const distractors = OBJECTS
        .filter(item => item.id !== randomObj.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 2)
        .map(obj => ({
            id: obj.id,
            name: obj.name,
            src: obj.variants[Math.floor(Math.random() * obj.variants.length)]
        }));

    // 4. Hedef ve Seçenekleri Ayarla
    const target = { id: randomObj.id, name: randomObj.name, src: randomVariant };
    const correctOption = { id: randomObj.id, name: randomObj.name, src: randomVariant }; // Birebir aynı

    setTargetItem(target);
    setOptions([correctOption, ...distractors].sort(() => 0.5 - Math.random()));
    
    // State Sıfırla
    setShowFeedback(null);
    setIsModeling(false);
    setFlashCorrect(false);
    setInstructionMistakeCount(0);
    setIsMatched(false);
  };

  useEffect(() => { generateQuestion(); }, []);

  const handleDragEnd = (event: any, info: any, droppedItem: {id: string}) => {
    if (isModeling || isMatched || !targetItem) return;

    const dropZone = dropZoneRef.current;
    if (!dropZone) return;
    const dropRect = dropZone.getBoundingClientRect();
    const dropX = info.point.x;
    const dropY = info.point.y;

    // Manyetik Alan (Hassasiyet)
    const centerX = dropRect.left + dropRect.width / 2;
    const centerY = dropRect.top + dropRect.height / 2;
    const dist = Math.sqrt(Math.pow(dropX - centerX, 2) + Math.pow(dropY - centerY, 2));

    // 150px yarıçap içine bırakırsa kabul et
    if (dist < 150) {
        if (droppedItem.id === targetItem.id) {
            handleSuccess();
        } else {
            handleMistake();
        }
    }
  };

  const handleSuccess = () => {
    setIsMatched(true); 

    if (mode === 'instruction') setShowFeedback('correct');
    if (mode === 'assessment') setAssessmentScore(prev => prev + 1);

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
        setTimeout(() => {
            const nextCount = assessmentCount + 1;
            setAssessmentCount(nextCount);
            if (nextCount < 10) generateQuestion();
        }, 800);
    } 
    else {
        // Öğretim Modu Mantığı
        const newMistake = instructionMistakeCount + 1;
        setInstructionMistakeCount(newMistake);
        setShowFeedback('wrong');

        setTimeout(() => { setShowFeedback(null); }, 1000);

        if (newMistake === 1) {
            setTimeout(() => { runModelingDemo(); }, 1000);
        } else if (newMistake >= 2) {
            setFlashCorrect(true); // Yanlışları kilitleme/silikleştirme render kısmında
        }
    }
  };

  const runModelingDemo = () => {
    setIsModeling(true);
    setTimeout(() => { setIsModeling(false); }, 4000); 
  };

  const fireConfetti = () => {
    try { confetti({ particleCount: 300, spread: 100, origin: { y: 0.6 } }); } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (mode === 'assessment' && assessmentCount === 10) {
      if (assessmentScore >= 9) { setPhase('success'); fireConfetti(); } else { setPhase('fail'); }
    }
  }, [assessmentCount, assessmentScore, mode]);

  if (!targetItem) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col items-center justify-between p-4 font-sans select-none overflow-hidden touch-none overscroll-none text-slate-800">
      
      {/* Üst Bar */}
      <div className="w-full max-w-2xl flex justify-between items-center text-slate-500 mb-2 relative z-10">
        <button onClick={onClose} className="p-2 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-100">
          <XCircle size={24} className="text-slate-300" />
        </button>
        <div className="flex items-center gap-3">
            <div className={twMerge("px-4 py-2 rounded-full shadow-sm border flex items-center gap-2", mode === 'assessment' ? "bg-blue-50 border-blue-100" : "bg-purple-50 border-purple-100")}>
                {mode === 'assessment' ? <ClipboardCheck size={16} className="text-blue-600"/> : <GraduationCap size={16} className="text-purple-600"/>}
                <span className={twMerge("font-bold text-xs uppercase", mode === 'assessment' ? "text-blue-600" : "text-purple-600")}>
                    {mode === 'assessment' ? `TEST: ${Math.min(assessmentCount + 1, 10)}/10` : "ÖĞRETİM"}
                </span>
            </div>
            {mode === 'assessment' && <div className="bg-green-50 px-4 py-2 rounded-full shadow-sm border border-green-100 font-black text-green-600 text-xs">PUAN: {assessmentScore}</div>}
        </div>
      </div>

      {/* OYUN ALANI */}
      {phase === 'playing' && (
        <div className="flex-1 flex flex-col justify-around w-full max-w-md h-full">
          
          <div className="flex flex-col items-center">
            {/* HEDEF KUTU */}
            <div ref={dropZoneRef} className={twMerge("w-72 h-72 bg-white rounded-[3rem] border-4 border-dashed flex items-center justify-center shadow-inner relative z-0 transition-all duration-300", isMatched ? "border-green-500 bg-green-50 border-solid" : "border-slate-300")}>
               <img src={targetItem.src} alt={targetItem.name} className={twMerge("object-contain transition-all duration-500", isMatched ? "w-56 h-56 opacity-100 scale-110 drop-shadow-2xl" : "w-48 h-48 opacity-90")} />
            </div>
            {!isMatched && <p className="mt-4 text-slate-400 font-bold text-xs tracking-widest uppercase animate-pulse">Eşini Üzerine Bırak</p>}
          </div>

          <div className="grid grid-cols-3 gap-2 w-full px-1">
            {options.map((item, index) => {
              const isCorrectItem = item.id === targetItem.id;
              // 2. Yanlışta kilitleme mantığı
              const isLocked = mode === 'instruction' && instructionMistakeCount >= 2 && !isCorrectItem;
              const isHidden = isMatched && isCorrectItem;
              const canDrag = !isModeling && !isLocked && !isMatched;

              return (
                <div key={index} className="relative flex justify-center items-center h-36">
                  <motion.div
                    drag={canDrag}
                    dragConstraints={false}
                    dragSnapToOrigin={true} 
                    onDragEnd={(e, info) => handleDragEnd(e, info, item)}
                    whileDrag={{ scale: 1.1, zIndex: 100 }}
                    
                    animate={
                        isHidden ? { opacity: 0, scale: 0 } :
                        (isModeling && isCorrectItem) ? { y: [0, -350, -350, 0], scale: [1, 1.2, 1.2, 1], x: 0 } : 
                        { scale: 1, opacity: isLocked ? 0.3 : 1 }
                    }
                    transition={(isModeling && isCorrectItem) ? { duration: 4, times: [0, 0.4, 0.7, 1], ease: "easeInOut" } : { duration: 0.3 }}

                    className={twMerge(
                      "w-32 h-32 bg-white rounded-3xl shadow-lg flex items-center justify-center border-2 touch-none relative z-10",
                      canDrag ? "cursor-grab active:cursor-grabbing border-slate-100" : "cursor-not-allowed border-slate-200 bg-slate-50",
                      (isModeling && isCorrectItem) ? "border-blue-400 shadow-blue-100 shadow-xl" : ""
                    )}
                  >
                    <img src={item.src} alt={item.name} className="w-24 h-24 object-contain pointer-events-none" />
                    {isModeling && isCorrectItem && <motion.div animate={{ opacity: [0, 1, 1, 0] }} transition={{ times: [0, 0.1, 0.8, 1], duration: 4 }} className="absolute -bottom-2 -right-2 text-blue-600 bg-white rounded-full p-2 shadow-lg border border-blue-100"><MousePointer2 size={32} fill="currentColor" /></motion.div>}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SONUÇ EKRANLARI */}
      {phase === 'success' && (<div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center text-center p-8"><Trophy size={100} className="text-yellow-500 mb-6 animate-bounce" /><h1 className="text-3xl font-black text-slate-800 mb-2 uppercase">Tamamlandı!</h1><p className="text-slate-500 mb-8 font-medium text-lg">Başarı Oranı: {assessmentScore * 10}%</p><button onClick={() => onComplete(true)} className="bg-green-600 text-white px-12 py-5 rounded-2xl font-bold text-xl shadow-xl active:scale-95 transition-all">KAYDET VE ÇIK</button></div>)}
      {phase === 'fail' && (<div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center text-center p-8"><div className="text-8xl mb-6 italic font-black text-slate-200">!</div><h1 className="text-2xl font-black text-slate-800 mb-2 uppercase">Tekrar Deneyelim</h1><p className="text-slate-500 mb-10 font-medium">Skor: {assessmentScore} / 10</p><div className="flex gap-4"><button onClick={onClose} className="bg-slate-100 text-slate-600 px-8 py-4 rounded-xl font-bold text-lg">KAPAT</button><button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg flex items-center gap-2"><RefreshCcw size={20}/> YENİDEN BAŞLA</button></div></div>)}

      {/* FEEDBACK - YUKARIDA KIRMIZI ÇARPI */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-24 left-0 right-0 z-[110] flex justify-center pointer-events-none">
            <div className={`p-6 rounded-full shadow-2xl border-4 bg-white ${showFeedback === 'correct' ? 'border-green-500' : 'border-red-500'}`}>
                {showFeedback === 'correct' ? <Check size={64} className="text-green-600"/> : <XCircle size={64} className="text-red-600"/>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
