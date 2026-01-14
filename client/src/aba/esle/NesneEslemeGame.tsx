import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, XCircle, Trophy, MousePointer2, GraduationCap, ClipboardCheck, RefreshCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { twMerge } from 'tailwind-merge';

// --- GÖRSELLERİ IMPORT ---
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

// GÖLGELER
import golgeanahtar from './golgeanahtar.png'; import golgearaba from './golgearaba.png'; import golgecicek from './golgecicek.png';
import golgeelma from './golgeelma.png'; import golgegitar from './golgegitar.png'; import golgekalem from './golgekalem.png';
import golgekitap from './golgekitap.png'; import golgesaat from './golgesaat.png'; import golgetavuk from './golgetavuk.png'; import golgetop from './golgetop.png';

// ŞEKİLLER
import besgen from './besgen.png'; import besgen1 from './besgen1.png';
import daire from './daire.png'; import daire1 from './daire1.png';
import dikdortgen from './dikdortgen.png'; import dikdortgen1 from './dikdortgen1.png';
import kalp from './kalp.png'; import kalp1 from './kalp1.png';
import kare from './kare.png'; import kare1 from './kare1.png';
import ucgen from './ucgen.png'; import ucgen1 from './ucgen1.png';
import yildiz from './yildiz.png'; import yildiz1 from './yildiz1.png';

// SAYILAR
import bir from './bir.png'; import iki from './iki.png'; import uc from './uc.png'; import dort from './dort.png';
import bes from './bes.png'; import yedi from './yedi.png'; import sekiz from './sekiz.png'; import dokuz from './dokuz.png'; import sifir from './sifir.png';

// --- VERİ YAPILARI (Garanti olması için boş array kontrolü yapıldı) ---
const OBJECT_DATA = [
  { id: 'anahtar', name: 'Anahtar', real: [anahtar, anahtar1], drawing: [anahtar2, anahtar3], shadow: golgeanahtar },
  { id: 'araba', name: 'Araba', real: [araba, araba1], drawing: [araba2, araba3], shadow: golgearaba },
  { id: 'cicek', name: 'Çiçek', real: [cicek, cicek1], drawing: [cicek2, cicek3], shadow: golgecicek },
  { id: 'elma', name: 'Elma', real: [elma, elma1], drawing: [elma2, elma3], shadow: golgeelma },
  { id: 'gitar', name: 'Gitar', real: [gitar, gitar1], drawing: [gitar2, gitar3], shadow: golgegitar },
  { id: 'kalem', name: 'Kalem', real: [kalem, kalem1], drawing: [kalem2, kalem3], shadow: golgekalem },
  { id: 'kitap', name: 'Kitap', real: [kitap, kitap1], drawing: [kitap2, kitap3], shadow: golgekitap },
  { id: 'saat', name: 'Saat', real: [saat, saat1], drawing: [saat2, saat3], shadow: golgesaat },
  { id: 'tavuk', name: 'Tavuk', real: [tavuk, tavuk1], drawing: [tavuk2, tavuk3], shadow: golgetavuk },
  { id: 'top', name: 'Top', real: [top, top1], drawing: [top2, top3], shadow: golgetop },
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

const SHAPE_DATA = [
    { id: 'besgen', name: 'Beşgen', box: besgen, shape: besgen1 },
    { id: 'daire', name: 'Daire', box: daire, shape: daire1 },
    { id: 'dikdortgen', name: 'Dikdörtgen', box: dikdortgen, shape: dikdortgen1 },
    { id: 'kalp', name: 'Kalp', box: kalp, shape: kalp1 },
    { id: 'kare', name: 'Kare', box: kare, shape: kare1 },
    { id: 'ucgen', name: 'Üçgen', box: ucgen, shape: ucgen1 },
    { id: 'yildiz', name: 'Yıldız', box: yildiz, shape: yildiz1 },
];

const NUMBER_DATA = [
    { id: 'bir', name: '1', src: bir }, { id: 'iki', name: '2', src: iki }, { id: 'uc', name: '3', src: uc },
    { id: 'dort', name: '4', src: dort }, { id: 'bes', name: '5', src: bes }, { id: 'yedi', name: '7', src: yedi },
    { id: 'sekiz', name: '8', src: sekiz }, { id: 'dokuz', name: '9', src: dokuz }, { id: 'sifir', name: '0', src: sifir },
];

export type GameType = 
    | 'nesne-nesne-ayni' | 'nesne-resim-ayni' | 'eylem-ayni' | 'sekil-kutu'
    | 'nesne-nesne-farkli' | 'nesne-resim-farkli' | 'eylem-farkli' | 'resim-nesne'
    | 'golge' | 'sayi';

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
  const [assessmentCount, setAssessmentCount] = useState(0); 
  const [assessmentScore, setAssessmentScore] = useState(0); 
  const [instructionMistakeCount, setInstructionMistakeCount] = useState(0);
  const [isModeling, setIsModeling] = useState(false);
  const [flashCorrect, setFlashCorrect] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);

  const generateQuestion = () => {
    let target: GameItem | null = null;
    let correctOption: GameItem | null = null;
    let distractors: GameItem[] = [];

    // Veri güvenliği için rastgele seçim yardımcı fonksiyonu
    const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
    const getOthers = (arr: any[], currentId: string) => arr.filter(i => i.id !== currentId).sort(() => 0.5 - Math.random()).slice(0, 2);

    switch (gameType) {
        // --- 1. GRUP: AYNI OLANLAR ---
        case 'nesne-nesne-ayni': {
            const concept = getRandom(OBJECT_DATA);
            const img = concept.real[0]; // Sadece ilk resmi kullan ki karışmasın
            target = { id: concept.id, name: concept.name, src: img };
            correctOption = { id: concept.id, name: concept.name, src: img };
            distractors = getOthers(OBJECT_DATA, concept.id).map(o => ({ id: o.id, name: o.name, src: o.real[0] }));
            break;
        }
        case 'nesne-resim-ayni': {
            const concept = getRandom(OBJECT_DATA);
            const img = concept.drawing[0];
            target = { id: concept.id, name: concept.name, src: img };
            correctOption = { id: concept.id, name: concept.name, src: img };
            distractors = getOthers(OBJECT_DATA, concept.id).map(o => ({ id: o.id, name: o.name, src: o.drawing[0] }));
            break;
        }
        case 'eylem-ayni': {
            const concept = getRandom(ACTION_DATA);
            const img = concept.variants[0];
            target = { id: concept.id, name: concept.name, src: img };
            correctOption = { id: concept.id, name: concept.name, src: img };
            distractors = getOthers(ACTION_DATA, concept.id).map(o => ({ id: o.id, name: o.name, src: o.variants[0] }));
            break;
        }

        // --- 2. GRUP: ŞEKİL KUTUSU (Kutu -> Şekil) ---
        case 'sekil-kutu': {
            const concept = getRandom(SHAPE_DATA);
            target = { id: concept.id, name: concept.name, src: concept.box };
            correctOption = { id: concept.id, name: concept.name, src: concept.shape };
            distractors = getOthers(SHAPE_DATA, concept.id).map(o => ({ id: o.id, name: o.name, src: o.shape }));
            break;
        }

        // --- 3. GRUP: FARKLI OLANLAR (Kritik Nokta: Döngüsel Seçim) ---
        case 'nesne-nesne-farkli': {
            const concept = getRandom(OBJECT_DATA);
            // Eğer 2. resim yoksa patlamaması için modülo (%) kullanıyoruz
            const targetIdx = 0;
            const correctIdx = (targetIdx + 1) % concept.real.length; 
            
            target = { id: concept.id, name: concept.name, src: concept.real[targetIdx] };
            correctOption = { id: concept.id, name: concept.name, src: concept.real[correctIdx] };
            distractors = getOthers(OBJECT_DATA, concept.id).map(o => ({ id: o.id, name: o.name, src: o.real[0] }));
            break;
        }
        case 'nesne-resim-farkli': {
            const concept = getRandom(OBJECT_DATA);
            const targetIdx = 0;
            const correctIdx = (targetIdx + 1) % concept.drawing.length;

            target = { id: concept.id, name: concept.name, src: concept.drawing[targetIdx] };
            correctOption = { id: concept.id, name: concept.name, src: concept.drawing[correctIdx] };
            distractors = getOthers(OBJECT_DATA, concept.id).map(o => ({ id: o.id, name: o.name, src: o.drawing[0] }));
            break;
        }
        case 'eylem-farkli': {
            const concept = getRandom(ACTION_DATA);
            const targetIdx = 0;
            const correctIdx = (targetIdx + 1) % concept.variants.length;

            target = { id: concept.id, name: concept.name, src: concept.variants[targetIdx] };
            correctOption = { id: concept.id, name: concept.name, src: concept.variants[correctIdx] };
            distractors = getOthers(ACTION_DATA, concept.id).map(o => ({ id: o.id, name: o.name, src: o.variants[0] }));
            break;
        }

        // --- 4. GRUP: RESİM-NESNE (Gerçek -> Çizim) ---
        case 'resim-nesne': {
            const concept = getRandom(OBJECT_DATA);
            // Hedef: Çizim (Kutuda)
            target = { id: concept.id, name: concept.name, src: concept.drawing[0] };
            // Cevap: Gerçek (Seçenekte)
            correctOption = { id: concept.id, name: concept.name, src: concept.real[0] };
            distractors = getOthers(OBJECT_DATA, concept.id).map(o => ({ id: o.id, name: o.name, src: o.real[0] }));
            break;
        }

        // --- 5. GRUP: ÖZEL DURUMLAR ---
        case 'golge': {
            const concept = getRandom(OBJECT_DATA);
            target = { id: concept.id, name: concept.name, src: concept.shadow };
            correctOption = { id: concept.id, name: concept.name, src: concept.real[0] };
            distractors = getOthers(OBJECT_DATA, concept.id).map(o => ({ id: o.id, name: o.name, src: o.real[0] }));
            break;
        }
        case 'sayi': {
            const concept = getRandom(NUMBER_DATA);
            target = { id: concept.id, name: concept.name, src: concept.src };
            correctOption = { id: concept.id, name: concept.name, src: concept.src };
            distractors = getOthers(NUMBER_DATA, concept.id).map(o => ({ id: o.id, name: o.name, src: o.src }));
            break;
        }
        default:
            console.error("Bilinmeyen oyun türü:", gameType);
            break;
    }

    if (target && correctOption) {
        setTargetItem(target);
        setOptions([correctOption, ...distractors].sort(() => 0.5 - Math.random()));
        
        // State Sıfırlama
        setShowFeedback(null); setIsModeling(false); setFlashCorrect(false); setInstructionMistakeCount(0); setIsMatched(false);
    }
  };

  useEffect(() => { generateQuestion(); }, [gameType]);

  // --- SÜRÜKLE BIRAK (MANYETİK ALAN) ---
  const handleDragEnd = (event: any, info: any, droppedItem: GameItem) => {
    if (isModeling || isMatched || !targetItem) return;
    const dropZone = dropZoneRef.current; if (!dropZone) return;
    
    const rect = dropZone.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dropX = info.point.x;
    const dropY = info.point.y;

    // 170px tolerans (Dokunmatik ekran dostu)
    const distance = Math.sqrt(Math.pow(dropX - centerX, 2) + Math.pow(dropY - centerY, 2));

    if (distance < 170) {
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
        const nextCount = assessmentCount + 1; setAssessmentCount(nextCount);
        if (nextCount < 10) generateQuestion();
      } else generateQuestion();
    }, 1500);
  };

  const handleMistake = () => {
    if (mode === 'assessment') {
        setTimeout(() => { const nextCount = assessmentCount + 1; setAssessmentCount(nextCount); if (nextCount < 10) generateQuestion(); }, 800);
    } else {
        const newMistake = instructionMistakeCount + 1; setInstructionMistakeCount(newMistake);
        setShowFeedback('wrong');
        if (newMistake === 1) { setTimeout(() => { setShowFeedback(null); }, 1500); setTimeout(() => { runModelingDemo(); }, 500); } 
        else if (newMistake >= 2) { setTimeout(() => setShowFeedback(null), 1000); setFlashCorrect(true); setTimeout(() => setFlashCorrect(false), 2000); }
    }
  };

  const runModelingDemo = () => { setIsModeling(true); setTimeout(() => setIsModeling(false), 4000); };
  const fireConfetti = () => { try { confetti({ particleCount: 300, spread: 100, origin: { y: 0.6 } }); } catch (e) {} };

  useEffect(() => { if (mode === 'assessment' && assessmentCount === 10) { if (assessmentScore >= 9) { setPhase('success'); fireConfetti(); } else { setPhase('fail'); } } }, [assessmentCount, assessmentScore]);

  if (!targetItem) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col items-center justify-between p-4 font-sans select-none overflow-hidden touch-none overscroll-none text-slate-800">
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
          <div className="flex flex-col items-center">
            <div ref={dropZoneRef} className={twMerge("w-72 h-72 bg-white rounded-[3rem] border-4 border-dashed flex items-center justify-center shadow-inner relative z-0 transition-all duration-300", isMatched ? "border-green-500 bg-green-50 border-solid" : "border-slate-300")}>
               <img src={targetItem.src} alt={targetItem.name} className={twMerge("object-contain transition-all duration-500", isMatched ? "w-56 h-56 opacity-100 scale-110 drop-shadow-2xl" : "w-48 h-48 opacity-90")} />
            </div>
            {!isMatched && <p className="mt-4 text-slate-400 font-bold text-xs tracking-widest uppercase animate-pulse">Eşini Üzerine Bırak</p>}
          </div>
          <div className="grid grid-cols-3 gap-2 w-full px-1">
            {options.map((item) => {
              const isCorrectItem = item.id === targetItem?.id;
              const isLocked = mode === 'instruction' && instructionMistakeCount >= 2 && !isCorrectItem;
              const isHidden = isMatched && isCorrectItem;
              const canDrag = !isModeling && !isLocked && !isMatched;
              return (
                <div key={item.id + item.src} className="relative flex justify-center items-center h-36">
                  <motion.div drag={canDrag} dragConstraints={false} dragSnapToOrigin={true} dragElastic={0.1} dragMomentum={false} onDragEnd={(e, info) => handleDragEnd(e, info, item)} whileDrag={{ scale: 1.1, zIndex: 100 }} animate={isHidden ? { opacity: 0, scale: 0 } : (isModeling && isCorrectItem) ? { y: [0, -380, -380, 0], scale: [1, 1.2, 1.2, 1], x: 0 } : (flashCorrect && isCorrectItem) ? { scale: [1, 1.1, 1], borderColor: ["#e2e8f0", "#22c55e", "#e2e8f0"], borderWidth: [2, 4, 2] } : { scale: 1, opacity: isLocked ? 0.3 : 1 }} transition={(isModeling && isCorrectItem) ? { duration: 4, times: [0, 0.4, 0.7, 1], ease: "easeInOut" } : { duration: 0.3 }} className={twMerge("w-32 h-32 bg-white rounded-3xl shadow-[0_8px_0_0_#e2e8f0] flex items-center justify-center border-2 touch-none relative z-10", canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed", (isModeling && isCorrectItem) ? "border-blue-400 shadow-blue-100 shadow-xl" : (flashCorrect && isCorrectItem) ? "border-green-500 shadow-green-100" : "border-slate-100")}>
                    <img src={item.src} alt={item.name} className="w-24 h-24 object-contain pointer-events-none" />
                    {isModeling && isCorrectItem && <motion.div animate={{ opacity: [0, 1, 1, 0] }} transition={{ times: [0, 0.1, 0.8, 1], duration: 4 }} className="absolute -bottom-2 -right-2 text-blue-600 bg-white rounded-full p-2 shadow-lg border border-blue-100"><MousePointer2 size={32} fill="currentColor" /></motion.div>}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {phase === 'success' && (<div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center text-center p-8"><Trophy size={100} className="text-yellow-500 mb-6 animate-bounce" /><h1 className="text-3xl font-black text-slate-800 mb-2 uppercase">Tamamlandı!</h1><p className="text-slate-500 mb-8 font-medium text-lg">Başarı Oranı: {assessmentScore * 10}%</p><button onClick={() => onComplete(true)} className="bg-green-600 text-white px-12 py-5 rounded-2xl font-bold text-xl shadow-xl active:scale-95 transition-all">KAYDET VE ÇIK</button></div>)}
      {phase === 'fail' && (<div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center text-center p-8"><div className="text-8xl mb-6 italic font-black text-slate-200">!</div><h1 className="text-2xl font-black text-slate-800 mb-2 uppercase">Tekrar Deneyelim</h1><p className="text-slate-500 mb-10 font-medium">Skor: {assessmentScore} / 10</p><div className="flex gap-4"><button onClick={onClose} className="bg-slate-100 text-slate-600 px-8 py-4 rounded-xl font-bold text-lg">KAPAT</button><button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg flex items-center gap-2"><RefreshCcw size={20}/> YENİDEN BAŞLA</button></div></div>)}
      <AnimatePresence>{showFeedback && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[110] flex flex-col items-center justify-start pt-32 pointer-events-none"><div className={`px-10 py-5 rounded-full shadow-2xl flex items-center gap-4 ${showFeedback === 'correct' ? 'bg-green-500' : 'bg-red-500'}`}>{showFeedback === 'correct' ? (<Check size={48} className="text-white"/>) : (<><XCircle size={36} className="text-white"/><span className="text-white text-3xl font-black tracking-widest">HAYIR</span></>)}</div></motion.div>)}</AnimatePresence>
    </div>
  );
}
