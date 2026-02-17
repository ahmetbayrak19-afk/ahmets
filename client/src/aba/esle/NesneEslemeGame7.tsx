import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, XCircle, Trophy, MousePointer2, GraduationCap, ClipboardCheck, RefreshCcw, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';
import { twMerge } from 'tailwind-merge';

// --- EYLEM VİDEOLARI (IMPORT) ---
import disfircalaVid from './eylemesle/disfircala.mp4';
import disfircala1Vid from './eylemesle/disfircala1.mp4';
import elmayeVid from './eylemesle/elmaye.mp4';
import elmaye1Vid from './eylemesle/elmaye1.mp4';
import elyikaVid from './eylemesle/elyika.mp4';
import elyika1Vid from './eylemesle/elyika1.mp4';
import gitarcalVid from './eylemesle/gitarcal.mp4';
import gitarcal1Vid from './eylemesle/gitarcal1.mp4';
import kitapokuVid from './eylemesle/kitapoku.mp4';
import kitapoku1Vid from './eylemesle/kitapoku1.mp4';
import kosVid from './eylemesle/kos.mp4';
import kos1Vid from './eylemesle/kos1.mp4';
import resimyapVid from './eylemesle/resimyap.mp4';
import resimyap1Vid from './eylemesle/resimyap1.mp4';
import sallanVid from './eylemesle/salincaksallan.mp4';
import sallan1Vid from './eylemesle/salincaksallan1.mp4';
import suicVid from './eylemesle/suic.mp4';
import suic1Vid from './eylemesle/suic1.mp4';
import topoynaVid from './eylemesle/topoyna.mp4';
import topoyna1Vid from './eylemesle/topoyna1.mp4';

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

// --- VİDEO VERİ YAPISI ---
const OBJECTS = [
  { id: 'disfircala', groupId: 'disfircala', name: 'Diş Fırçala', src: disfircalaVid },
  { id: 'disfircala1', groupId: 'disfircala', name: 'Diş Fırçala', src: disfircala1Vid },
  
  { id: 'elmaye', groupId: 'elmaye', name: 'Elma Ye', src: elmayeVid },
  { id: 'elmaye1', groupId: 'elmaye', name: 'Elma Ye', src: elmaye1Vid },
  
  { id: 'elyika', groupId: 'elyika', name: 'El Yıka', src: elyikaVid },
  { id: 'elyika1', groupId: 'elyika', name: 'El Yıka', src: elyika1Vid },
  
  { id: 'gitarcal', groupId: 'gitarcal', name: 'Gitar Çal', src: gitarcalVid },
  { id: 'gitarcal1', groupId: 'gitarcal', name: 'Gitar Çal', src: gitarcal1Vid },
  
  { id: 'kitapoku', groupId: 'kitapoku', name: 'Kitap Oku', src: kitapokuVid },
  { id: 'kitapoku1', groupId: 'kitapoku', name: 'Kitap Oku', src: kitapoku1Vid },
  
  { id: 'kos', groupId: 'kos', name: 'Koş', src: kosVid },
  { id: 'kos1', groupId: 'kos', name: 'Koş', src: kos1Vid },
  
  { id: 'resimyap', groupId: 'resimyap', name: 'Resim Yap', src: resimyapVid },
  { id: 'resimyap1', groupId: 'resimyap', name: 'Resim Yap', src: resimyap1Vid },
  
  { id: 'sallan', groupId: 'sallan', name: 'Sallan', src: sallanVid },
  { id: 'sallan1', groupId: 'sallan', name: 'Sallan', src: sallan1Vid },
  
  { id: 'suic', groupId: 'suic', name: 'Su İç', src: suicVid },
  { id: 'suic1', groupId: 'suic', name: 'Su İç', src: suic1Vid },
  
  { id: 'topoyna', groupId: 'topoyna', name: 'Top Oyna', src: topoynaVid },
  { id: 'topoyna1', groupId: 'topoyna', name: 'Top Oyna', src: topoyna1Vid },
];

interface GameProps {
  mode: 'assessment' | 'instruction';
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

export default function NesneEslemeGame7({ mode, onClose, onComplete }: GameProps) {
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

  // --- SORU ÜRETME MANTIĞI ---
  const generateQuestion = () => {
    const randomTarget = OBJECTS[Math.floor(Math.random() * OBJECTS.length)];
    const targetGroupId = randomTarget.groupId;

    // Doğru cevap: Aynı grup, farklı ID
    const correctAnswer = OBJECTS.find(item => item.groupId === targetGroupId && item.id !== randomTarget.id);

    if (!correctAnswer) {
        generateQuestion();
        return;
    }
    
    let optionCount = 3; 
    if (level === 2) optionCount = 4;
    if (level === 3) optionCount = 6;
    const distractorCount = optionCount - 1;

    const allGroupIds = Array.from(new Set(OBJECTS.map(item => item.groupId)));
    const availableGroups = allGroupIds.filter(id => id !== targetGroupId);

    const selectedDistractorGroups = availableGroups
        .sort(() => 0.5 - Math.random())
        .slice(0, distractorCount);

    const distractors = selectedDistractorGroups.map(groupId => {
        const videosInGroup = OBJECTS.filter(item => item.groupId === groupId);
        return videosInGroup[Math.floor(Math.random() * videosInGroup.length)];
    });

    setTargetItem(randomTarget);
    setOptions([correctAnswer, ...distractors].sort(() => 0.5 - Math.random()));
    
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

    const isCorrect = droppedItem.groupId === targetItem.groupId;

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

  const getGridClass = () => {
      if (level === 1) return "grid-cols-3";
      if (level === 2) return "grid-cols-2 max-w-[300px]"; 
      if (level === 3) return "grid-cols-3";
      return "grid-cols-3";
  };

  return (
    <div className={twMerge(
        // 🔥 DÜZELTME: h-[100dvh] ve w-screen (Tam Ekran ve Alt Çubuk Çözümü)
        "fixed inset-0 h-[100dvh] w-screen z-[100] flex flex-col items-center justify-between p-4 font-sans select-none overflow-hidden touch-none overscroll-none text-slate-800 transition-colors duration-1000",
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
                                level === l ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
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
                    "w-72 h-56 bg-black rounded-[2rem] border-4 border-dashed flex items-center justify-center shadow-inner relative z-0 transition-all duration-300 overflow-hidden",
                    isMatched ? "border-green-500 border-solid" : "border-slate-300"
                )}
            >
               <video 
                 src={targetItem.src} 
                 autoPlay loop muted playsInline
                 className={twMerge(
                    "w-full h-full object-cover pointer-events-none transition-all duration-500",
                    isMatched ? "opacity-100 scale-100" : "opacity-90"
                 )} 
               />
            </div>
            {!isMatched && <p className="mt-4 text-slate-400 font-bold text-xs tracking-widest uppercase animate-pulse">Aynısını Üzerine Bırak (Farklı Kişi)</p>}
          </div>

          <div className={twMerge(
              // 🔥 DÜZELTME: pb-8 eklenerek en alttaki videolar yukarı kaydırıldı
              "grid gap-3 w-full px-1 justify-items-center mx-auto pb-8",
              getGridClass() 
          )}>
            {options.map((item) => {
              const isCorrectItem = item.groupId === targetItem.groupId;
              const isLocked = mode === 'instruction' && instructionMistakeCount >= 2 && !isCorrectItem;
              const isHidden = isMatched && isCorrectItem;
              const canDrag = !isModeling && !isLocked && !isMatched;

              return (
                <div key={item.id} className="relative flex justify-center items-center h-32 w-full">
                  <motion.div
                    drag={canDrag}
                    dragConstraints={false}
                    dragSnapToOrigin={true} 
                    dragElastic={0.1}
                    dragMomentum={false}
                    onDragEnd={(e, info) => handleDragEnd(e, info, item)}
                    whileDrag={{ scale: 1.1, zIndex: 100 }}
                    animate={
                        isHidden ? { opacity: 0, scale: 0 }
                        : (isModeling && isCorrectItem) ? { y: [0, -320, -320, 0], scale: [1, 1.2, 1.2, 1], x: 0 } 
                        : (flashCorrect && isCorrectItem) ? { scale: [1, 1.1, 1], borderColor: ["#e2e8f0", "#22c55e", "#e2e8f0"], borderWidth: [2, 4, 2] }
                        : { scale: 1, opacity: isLocked ? 0.3 : 1 }
                    }
                    transition={(isModeling && isCorrectItem) ? { duration: 2, times: [0, 0.4, 0.7, 1], ease: "easeInOut" } : { duration: 0.3 }}
                    className={twMerge(
                      "w-28 h-24 bg-black rounded-xl shadow-[0_4px_0_0_#334155] flex items-center justify-center border-2 touch-none relative z-10 overflow-hidden",
                      canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed",
                      (isModeling && isCorrectItem) ? "border-blue-400 shadow-blue-100 shadow-xl" : 
                      (flashCorrect && isCorrectItem) ? "border-green-500 shadow-green-100" : "border-slate-800"
                    )}
                  >
                    <video src={item.src} autoPlay loop muted playsInline className="w-full h-full object-cover pointer-events-none" />
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
