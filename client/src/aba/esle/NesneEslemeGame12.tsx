import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, XCircle, Trophy, MousePointer2, GraduationCap, ClipboardCheck, RefreshCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { twMerge } from 'tailwind-merge';

// --- 1. RENKLİ RESİMLER (SÜRÜKLENECEK OLANLAR) ---
import anahtarImg from '../esle/anahtar.png';
import arabaImg from '../esle/araba.png';
import cicekImg from '../esle/cicek.png';
import elmaImg from '../esle/elma.png';
import gitarImg from '../esle/gitar.png';
import kalemImg from '../esle/kalem.png';
import kitapImg from '../esle/kitap.png';
import saatImg from '../esle/saat.png';
import tavukImg from '../esle/tavuk.png';
import topImg from '../esle/top.png';

// --- 2. GÖLGE RESİMLER (HEDEF KUTUDA DURACAK OLANLAR) ---
import golgeAnahtarImg from '../esle/golgeanahtar.png';
import golgeArabaImg from '../esle/golgearaba.png';
import golgeCicekImg from '../esle/golgecicek.png';
import golgeElmaImg from '../esle/golgeelma.png';
import golgeGitarImg from '../esle/golgegitar.png';
import golgeKalemImg from '../esle/golgekalem.png';
import golgeKitapImg from '../esle/golgekitap.png';
import golgeSaatImg from '../esle/golgesaat.png';
import golgeTavukImg from '../esle/golgetavuk.png';
import golgeTopImg from '../esle/golgetop.png';

// --- SES DOSYALARI ---
import arkaplanMusic from '../esle/ses/arkaplanmusic.mp3';
import aferin1 from '../esle/ses/aferin1.mp3';
import aferin2 from '../esle/ses/aferin2.mp3';
import bravo from '../esle/ses/bravo.mp3';
import esledinbravo from '../esle/ses/esledinbravo.mp3';
import harika1 from '../esle/ses/harika1.mp3';
import harika2 from '../esle/ses/harika2.mp3';
import tekrardene1 from '../esle/ses/tekrardene1.mp3';
import tekrardene2 from '../esle/ses/tekrardene2.mp3';

// --- SES HAVUZLARI ---
const POSITIVE_SOUNDS = [aferin1, aferin2, bravo, esledinbravo, harika1, harika2];
const NEGATIVE_SOUNDS = [tekrardene1, tekrardene2];

// NESNE LİSTESİ (Hem Renkli Hem Gölge Verisini Tutar)
const OBJECTS = [
  { id: 'anahtar', name: 'Anahtar', colorSrc: anahtarImg, shadowSrc: golgeAnahtarImg },
  { id: 'araba', name: 'Araba', colorSrc: arabaImg, shadowSrc: golgeArabaImg },
  { id: 'cicek', name: 'Çiçek', colorSrc: cicekImg, shadowSrc: golgeCicekImg },
  { id: 'elma', name: 'Elma', colorSrc: elmaImg, shadowSrc: golgeElmaImg },
  { id: 'gitar', name: 'Gitar', colorSrc: gitarImg, shadowSrc: golgeGitarImg },
  { id: 'kalem', name: 'Kalem', colorSrc: kalemImg, shadowSrc: golgeKalemImg },
  { id: 'kitap', name: 'Kitap', colorSrc: kitapImg, shadowSrc: golgeKitapImg },
  { id: 'saat', name: 'Saat', colorSrc: saatImg, shadowSrc: golgeSaatImg },
  { id: 'tavuk', name: 'Tavuk', colorSrc: tavukImg, shadowSrc: golgeTavukImg },
  { id: 'top', name: 'Top', colorSrc: topImg, shadowSrc: golgeTopImg },
];

interface GameProps {
  mode?: 'assessment' | 'instruction'; // Opsiyonel yaptım hata vermesin diye
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

export default function NesneEslemeGame12({ mode = 'instruction', onClose, onComplete }: GameProps) {
  const [phase, setPhase] = useState<'playing' | 'success' | 'fail'>('playing');
  const [targetItem, setTargetItem] = useState(OBJECTS[0]);
  const [options, setOptions] = useState<typeof OBJECTS>([]);
  
  const [assessmentCount, setAssessmentCount] = useState(0); 
  const [assessmentScore, setAssessmentScore] = useState(0); 
  
  const [instructionMistakeCount, setInstructionMistakeCount] = useState(0);
  const [isModeling, setIsModeling] = useState(false);
  const [flashCorrect, setFlashCorrect] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // Ses referansı
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // Arkaplan Müziği
  useEffect(() => {
    bgMusicRef.current = new Audio(arkaplanMusic);
    bgMusicRef.current.loop = true; 
    bgMusicRef.current.volume = 0.15; 
    
    const playPromise = bgMusicRef.current.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
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

  // Efekt Sesi Çalma
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

  // Scroll kilitleme
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalStyle; };
  }, []);

  // Soru Oluşturma
  const generateQuestion = () => {
    const randomTarget = OBJECTS[Math.floor(Math.random() * OBJECTS.length)];
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

  // --- SÜRÜKLE BIRAK MANTIĞI (SENİN KODUNUN AYNISI) ---
  const handleDragEnd = (event: any, info: any, droppedItem: typeof OBJECTS[0]) => {
    if (isModeling || isMatched) return;

    const dropZone = dropZoneRef.current;
    if (!dropZone) return;
    
    // Kutu sınırlarını al
    const dropRect = dropZone.getBoundingClientRect();
    const dropX = info.point.x;
    const dropY = info.point.y;

    // İçine bırakıldı mı kontrolü
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
    playSoundEffect('success'); 

    if (mode === 'instruction') {
        setShowFeedback('correct');
    }
    
    if (mode === 'assessment') {
        setAssessmentScore(prev => prev + 1);
    }

    // Bekleme süresi (Animasyon izlensin diye)
    setTimeout(() => {
      if (mode === 'assessment') {
        const nextCount = assessmentCount + 1;
        setAssessmentCount(nextCount);
        if (nextCount < 10) generateQuestion();
      } else {
        generateQuestion();
      }
    }, 2000); // 2 saniye bekletiyoruz ki gölge renklenmesini görsün
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
            {/* --- HEDEF KUTU (GÖLGE) --- */}
            <div 
                ref={dropZoneRef}
                className={twMerge(
                    "w-72 h-72 bg-white rounded-[3rem] border-4 flex items-center justify-center shadow-inner relative z-0 transition-all duration-300 overflow-hidden",
                    // Eşleşince yeşil sınır yap
                    isMatched ? "border-green-500 bg-green-50 border-solid" : "border-dashed border-slate-300"
                )}
            >
               {/* 1. KATMAN: SİYAH GÖLGE (Her zaman altta) */}
               <img 
                 src={targetItem.shadowSrc} 
                 alt="Gölge" 
                 // Opacity biraz düşük olsun ki gölge olduğu belli olsun
                 className="absolute w-56 h-56 object-contain opacity-60 pointer-events-none"
               />

               {/* 2. KATMAN: RENKLİ RESİM (Eşleşince animasyonla belirir) */}
               <motion.img 
                  src={targetItem.colorSrc}
                  alt="Renkli"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                      opacity: isMatched ? 1 : 0,
                      scale: isMatched ? 1.1 : 0.8 
                  }}
                  transition={{ duration: 0.8 }} // Yavaşça renklenmesi için
                  className="absolute w-56 h-56 object-contain z-10 drop-shadow-2xl pointer-events-none"
               />

            </div>
            {!isMatched && <p className="mt-4 text-slate-400 font-bold text-xs tracking-widest uppercase animate-pulse">Gölgeyi Eşle</p>}
          </div>

          {/* --- SEÇENEKLER (RENKLİ RESİMLER) --- */}
          <div className="grid grid-cols-3 gap-2 w-full px-1">
            {options.map((item) => {
              const isCorrectItem = item.id === targetItem.id;
              const isLocked = mode === 'instruction' && instructionMistakeCount >= 2 && !isCorrectItem;
              
              // Eşleşme olduğunda doğru parçayı GİZLİYORUZ (Çünkü yukarıda belirdi)
              const isHidden = isMatched && isCorrectItem;
              
              const canDrag = !isModeling && !isLocked && !isMatched;

              return (
                <div key={item.id} className="relative flex justify-center items-center h-36">
                  <motion.div
                    // DRAG AYARLARI (Senin kodunla aynı)
                    drag={canDrag}
                    dragConstraints={false}
                    dragSnapToOrigin={true} 
                    dragElastic={0.1}
                    dragMomentum={false}
                    onDragEnd={(e, info) => handleDragEnd(e, info, item)}
                    whileDrag={{ scale: 1.1, zIndex: 100 }}
                    
                    animate={
                        isHidden
                        ? { opacity: 0, scale: 0 } // Doğru bilince aşağıdan kaybol
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
                      "w-32 h-32 bg-white rounded-3xl shadow-[0_8px_0_0_#e2e8f0] flex items-center justify-center border-2 touch-none relative z-10",
                      canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed",
                      (isModeling && isCorrectItem) ? "border-blue-400 shadow-blue-100 shadow-xl" : 
                      (flashCorrect && isCorrectItem) ? "border-green-500 shadow-green-100" : "border-slate-100"
                    )}
                  >
                    {/* BURADA RENKLİ RESİM KULLANIYORUZ */}
                    <img src={item.colorSrc} alt={item.name} className="w-24 h-24 object-contain pointer-events-none" />
                    
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
        
