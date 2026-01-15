import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, XCircle, Trophy, MousePointer2, GraduationCap, ClipboardCheck, RefreshCcw, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { twMerge } from 'tailwind-merge';

// --- GÖRSELLER ---
import anahtar from './anahtar.png'; import anahtar1 from './anahtar1.png'; import anahtar2 from './anahtar2.png'; import anahtar3 from './anahtar3.png';
import araba from './araba.png'; import araba1 from './araba1.png'; import araba2 from './araba2.png'; import araba3 from './araba3.png';
import cicek from './cicek.png'; import cicek1 from './cicek1.png'; import cicek2 from './cicek2.png'; import cicek3 from './cicek3.png';
import elma from './elma.png'; import elma1 from './elma1.png'; import elma2 from './elma2.png'; import elma3 from './elma3.png';
import gitar from './gitar.png'; import gitar1 from './gitar1.png'; import gitar2 from './gitar2.png'; import gitar3 from './gitar3.png';
import kalem from './kalem.png'; import kalem1 from './kalem1.png'; import kalem2 from './kalem2.png'; import kalem3 from './kalem3.png';
import kitap from './kitap.png'; import kitap1 from './kitap1.png'; import kitap2 from './kitap2.png'; import kitap3 from './kitap3.png';
import saat from './saat.png'; import saat1 from './saat1.png'; import saat2 from './saat2.png'; import saat3 from './saat3.png';
import tavuk from './tavuk.png'; import tavuk1 from './tavuk1.png'; import tavuk2 from './tavuk2.png'; import tavuk3 from './tavuk3.png';
import top from './top.png'; import top1 from './top1.png'; import top2 from './top2.png'; import top3 from './top3.png';

// EYLEMLER
import disfircala from './disfircala.png'; import disfircala1 from './disfircala1.png';
import elmaye from './elmaye.png'; import elmaye1 from './elmaye1.png';
import elyika from './elyika.png'; import elyika1 from './elyika1.png';
import kitapoku from './kitapoku.png'; import kitapoku1 from './kitapoku1.png';
import kos from './kos.png'; import kos1 from './kos1.png';
import resimyap from './resimyap.png'; import resimyap1 from './resimyap1.png';
import sallan from './sallan.png'; import sallan1 from './sallan1.png';
import suic from './suic.png'; import suic1 from './suic1.png';
import topoyna from './topoyna.png'; import topoyna1 from './topoyna1.png';
import uyu from './uyu.png'; import uyu1 from './uyu1.png';

// --- VERİ HAVUZU ---
const OBJECT_DATA = [
  { id: 'anahtar', name: 'Anahtar', real: [anahtar, anahtar1], drawing: [anahtar2, anahtar3] },
  { id: 'araba', name: 'Araba', real: [araba, araba1], drawing: [araba2, araba3] },
  { id: 'cicek', name: 'Çiçek', real: [cicek, cicek1], drawing: [cicek2, cicek3] },
  { id: 'elma', name: 'Elma', real: [elma, elma1], drawing: [elma2, elma3] },
  { id: 'gitar', name: 'Gitar', real: [gitar, gitar1], drawing: [gitar2, gitar3] },
  { id: 'kalem', name: 'Kalem', real: [kalem, kalem1], drawing: [kalem2, kalem3] },
  { id: 'kitap', name: 'Kitap', real: [kitap, kitap1], drawing: [kitap2, kitap3] },
  { id: 'saat', name: 'Saat', real: [saat, saat1], drawing: [saat2, saat3] },
  { id: 'tavuk', name: 'Tavuk', real: [tavuk, tavuk1], drawing: [tavuk2, tavuk3] },
  { id: 'top', name: 'Top', real: [top, top1], drawing: [top2, top3] },
];

const ACTION_DATA = [
  { id: 'disfircala', name: 'Diş Fırçalama', variants: [disfircala, disfircala1] },
  { id: 'elmaye', name: 'Elma Yeme', variants: [elmaye, elmaye1] },
  { id: 'elyika', name: 'El Yıkama', variants: [elyika, elyika1] },
  { id: 'kitapoku', name: 'Kitap Okuma', variants: [kitapoku, kitapoku1] },
  { id: 'kos', name: 'Koşma', variants: [kos, kos1] },
  { id: 'resimyap', name: 'Resim Yapma', variants: [resimyap, resimyap1] },
  { id: 'sallan', name: 'Sallanma', variants: [sallan, sallan1] },
  { id: 'suic', name: 'Su İçme', variants: [suic, suic1] },
  { id: 'topoyna', name: 'Top Oynama', variants: [topoyna, topoyna1] },
  { id: 'uyu', name: 'Uyuma', variants: [uyu, uyu1] },
];

export type GameType = 
    | 'nesne-nesne-ayni' 
    | 'nesne-resim-ayni' 
    | 'eylem-ayni';

interface GameProps {
  mode: 'assessment' | 'instruction';
  gameType: GameType;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

interface GameItem { id: string; name: string; src: string; }

export default function NesneEslemeGame({ mode, gameType, onClose, onComplete }: GameProps) {
  const [phase, setPhase] = useState<'playing' | 'success' | 'fail'>('playing');
  const [targetItem, setTargetItem] = useState<GameItem | null>(null);
  const [options, setOptions] = useState<GameItem[]>([]);
  
  const [assessmentScore, setAssessmentScore] = useState(0); 
  const [assessmentCount, setAssessmentCount] = useState(0); 
  
  const [instructionMistakeCount, setInstructionMistakeCount] = useState(0);
  const [isModeling, setIsModeling] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    document.body.style.overflow = 'hidden'; 
    return () => { document.body.style.overflow = ''; }; 
  }, []);

  const generateQuestion = () => {
    try {
        let concept, others, selectedImg, distractors = [];
        const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
        const getOthers = (arr: any[], id: string) => arr.filter(i => i.id !== id).sort(() => 0.5 - Math.random()).slice(0, 2);

        // Havuzu belirle
        const DATA = gameType.includes('eylem') ? ACTION_DATA : OBJECT_DATA;
        concept = getRandom(DATA);
        others = getOthers(DATA, concept.id);

        // Resim tipine göre seç
        if (gameType === 'nesne-nesne-ayni') {
            selectedImg = concept.real[Math.floor(Math.random() * concept.real.length)];
            distractors = others.map(o => o.real[Math.floor(Math.random() * o.real.length)]);
        } else if (gameType === 'nesne-resim-ayni') {
            selectedImg = concept.drawing[Math.floor(Math.random() * concept.drawing.length)];
            distractors = others.map(o => o.drawing[Math.floor(Math.random() * o.drawing.length)]);
        } else {
            selectedImg = concept.variants[Math.floor(Math.random() * concept.variants.length)];
            distractors = others.map(o => o.variants[Math.floor(Math.random() * o.variants.length)]);
        }

        setTargetItem({ id: concept.id, name: concept.name, src: selectedImg });
        const correctOpt = { id: concept.id, name: concept.name, src: selectedImg };
        const wrongOpts = others.map((o, i) => ({ id: o.id, name: o.name, src: distractors[i] }));
        
        setOptions([correctOpt, ...wrongOpts].sort(() => 0.5 - Math.random()));
        
        setIsMatched(false); 
        setShowFeedback(null); 
        setIsModeling(false); 
        setInstructionMistakeCount(0);
    } catch (e) {
        console.error("Hata:", e);
    }
  };

  useEffect(() => { generateQuestion(); }, [gameType]);

  // --- MODELLEME (HIZLANDIRILDI: 2.5 Saniye) ---
  const runModelingDemo = () => {
    setIsModeling(true);
    setTimeout(() => { setIsModeling(false); }, 2500); 
  };

  const handleMistake = () => {
    if (mode === 'assessment') {
        setTimeout(() => { 
            const next = assessmentCount + 1; setAssessmentCount(next); 
            if(next < 10) generateQuestion(); else setPhase('fail');
        }, 800);
    } 
    else {
        const newCount = instructionMistakeCount + 1;
        setInstructionMistakeCount(newCount);
        setShowFeedback('wrong');

        setTimeout(() => { 
            setShowFeedback(null); 
            if (newCount === 1) {
                runModelingDemo();
            }
        }, 1000);
    }
  };

  const handleSuccess = () => {
    setIsMatched(true);
    if (mode === 'instruction') setShowFeedback('correct');
    if (mode === 'assessment') setAssessmentScore(prev => prev + 1);
    
    setTimeout(() => {
      if (mode === 'assessment') {
        const next = assessmentCount + 1; setAssessmentCount(next);
        if (next < 10) generateQuestion(); else { setPhase(assessmentScore >= 8 ? 'success' : 'fail'); if(assessmentScore>=8) confetti(); }
      } else generateQuestion();
    }, 1500);
  };

  const handleDragEnd = (e: any, info: any, item: GameItem) => {
    if (isModeling || isMatched || !targetItem) return;
    
    const dropZone = dropZoneRef.current; if(!dropZone) return;
    const rect = dropZone.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dist = Math.sqrt(Math.pow(info.point.x - centerX, 2) + Math.pow(info.point.y - centerY, 2));

    if (dist < 170) {
        if (item.id === targetItem.id) handleSuccess();
        else handleMistake();
    }
  };

  // SİYAH EKRAN ÖNLEYİCİ: Veri gelmediyse Loading göster
  if(!targetItem) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-500 w-10 h-10"/></div>;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col items-center justify-between p-4 font-sans select-none overflow-hidden touch-none overscroll-none text-slate-800">
      
      {/* ÜST BAR */}
      <div className="w-full max-w-2xl flex justify-between items-center text-slate-500 mb-2 relative z-10">
        <button onClick={onClose} className="p-2 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-100"><XCircle size={24} className="text-slate-300" /></button>
        <div className="flex items-center gap-3">
            <div className={twMerge("px-4 py-2 rounded-full shadow-sm border flex items-center gap-2", mode === 'assessment' ? "bg-blue-50 border-blue-100" : "bg-purple-50 border-purple-100")}>
                {mode === 'assessment' ? <ClipboardCheck size={16} className="text-blue-600"/> : <GraduationCap size={16} className="text-purple-600"/>}
                <span className={twMerge("font-bold text-xs uppercase", mode === 'assessment' ? "text-blue-600" : "text-purple-600")}>{mode === 'assessment' ? `TEST: ${Math.min(assessmentCount + 1, 10)}/10` : "ÖĞRETİM"}</span>
            </div>
            {mode === 'assessment' && <div className="bg-green-50 px-4 py-2 rounded-full shadow-sm border border-green-100 font-black text-green-600 text-xs">PUAN: {assessmentScore}</div>}
        </div>
      </div>

      {phase === 'playing' && (
        <div className="flex-1 flex flex-col justify-around w-full max-w-md h-full">
          
          {/* HEDEF */}
          <div className="flex justify-center">
            <div ref={dropZoneRef} className={twMerge("w-72 h-72 bg-white rounded-[3rem] border-4 border-dashed flex items-center justify-center transition-all duration-300", isMatched ? "border-green-500 bg-green-50 border-solid scale-105" : "border-slate-300")}>
               <img src={targetItem.src} className="w-48 h-48 object-contain" />
            </div>
          </div>

          {/* SEÇENEKLER */}
          <div className="grid grid-cols-3 gap-3 w-full px-2">
            {options.map((item, index) => {
              const isCorrectItem = item.id === targetItem.id;
              // KİLİTLEME: 2. Yanlışta yanlış şıklar kilitlenir
              const isLocked = mode === 'instruction' && instructionMistakeCount >= 2 && !isCorrectItem;
              const canDrag = !isModeling && !isMatched && !isLocked;

              return (
                <div key={index} className="relative flex justify-center items-center h-32">
                  <motion.div
                    drag={canDrag} 
                    dragConstraints={false} 
                    dragSnapToOrigin 
                    onDragEnd={(e, info) => handleDragEnd(e, info, item)}
                    whileDrag={{ scale: 1.1, zIndex: 100 }}
                    
                    // --- ANİMASYON (SÜRE 2.5 sn) ---
                    animate={
                        (isModeling && isCorrectItem) 
                        ? { y: [0, -320, -320, 0], scale: [1, 1.2, 1.2, 1], x: 0 } 
                        : { scale: 1, opacity: isLocked ? 0.3 : 1 }
                    }
                    transition={
                        (isModeling && isCorrectItem)
                        ? { duration: 2.5, times: [0, 0.4, 0.7, 1], ease: "easeInOut" }
                        : { duration: 0.3 }
                    }

                    className={twMerge(
                        "w-28 h-28 bg-white rounded-2xl shadow-lg flex items-center justify-center border-2 touch-none relative z-10", 
                        canDrag ? "cursor-grab active:cursor-grabbing border-slate-100" : "cursor-not-allowed border-slate-200 bg-slate-50",
                        (isModeling && isCorrectItem) ? "border-blue-500 shadow-blue-200 z-50 ring-4 ring-blue-100" : ""
                    )}
                  >
                    <img src={item.src} className="w-20 h-20 object-contain pointer-events-none" />
                    
                    {/* Parmak İkonu */}
                    {isModeling && isCorrectItem && (
                        <motion.div 
                           animate={{ opacity: [0, 1, 1, 0] }}
                           transition={{ times: [0, 0.1, 0.9, 1], duration: 2.5 }}
                           className="absolute -bottom-4 -right-4 bg-white p-2 rounded-full shadow-xl border z-50"
                        >
                            <MousePointer2 className="text-blue-500 w-6 h-6 fill-current" />
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
      {phase === 'success' && (<div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center text-center"><Trophy size={100} className="text-yellow-500 mb-6 animate-bounce" /><h1 className="text-3xl font-bold mb-2">Harika!</h1><button onClick={() => onComplete(true)} className="bg-green-600 text-white px-10 py-4 rounded-2xl font-bold text-xl shadow-xl">Kaydet</button></div>)}
      {phase === 'fail' && (<div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center text-center"><h1 className="text-3xl font-bold mb-4">Tekrar Dene</h1><button onClick={onClose} className="bg-slate-200 text-slate-700 px-10 py-4 rounded-2xl font-bold text-xl">Kapat</button><button onClick={() => window.location.reload()} className="mt-4 flex items-center gap-2 text-blue-600 font-bold"><RefreshCcw size={20}/> Yeniden Başla</button></div>)}
      
      {/* GERİ BİLDİRİM */}
      <AnimatePresence>
        {showFeedback && (
            <motion.div initial={{ opacity: 0, scale: 0.5, y: -50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.5 }} className="absolute top-[20%] left-0 right-0 flex justify-center pointer-events-none z-[110]">
                <div className={twMerge("p-8 rounded-full shadow-2xl border-4 bg-white", showFeedback === 'correct' ? "border-green-500" : "border-red-500")}>
                    {showFeedback === 'correct' ? <Check size={80} className="text-green-600" /> : <XCircle size={80} className="text-red-600" />}
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
