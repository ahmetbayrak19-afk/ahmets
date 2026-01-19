import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, XCircle, Trophy, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';
import { twMerge } from 'tailwind-merge';

// --- RENKLİ RESİMLER ---
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

// --- GÖLGE RESİMLER (Zaten Siyah) ---
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

// SES HAVUZLARI
const POSITIVE_SOUNDS = [aferin1, aferin2, bravo, esledinbravo, harika1, harika2];
const NEGATIVE_SOUNDS = [tekrardene1, tekrardene2];

// VERİ YAPISI
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

export default function NesneEslemeGame12({ onClose, onComplete }: any) {
  // OYUN DURUMLARI
  const [level, setLevel] = useState(1);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'success'>('playing');
  
  // NESNELER
  const [targetItem, setTargetItem] = useState(OBJECTS[0]); // HEDEF (GÖLGE)
  const [options, setOptions] = useState<typeof OBJECTS>([]); // SEÇENEKLER (RENKLİ)
  
  const [isMatched, setIsMatched] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // REF'LER
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // MÜZİK
  useEffect(() => {
    bgMusicRef.current = new Audio(arkaplanMusic);
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = 0.1;
    if (!isMuted) {
        bgMusicRef.current.play().catch(() => console.log("Otomatik oynatma engellendi"));
    }
    return () => {
        if (bgMusicRef.current) {
            bgMusicRef.current.pause();
            bgMusicRef.current = null;
        }
    };
  }, []);

  useEffect(() => {
    if (bgMusicRef.current) {
        if (isMuted) bgMusicRef.current.pause();
        else bgMusicRef.current.play().catch(()=>{});
    }
  }, [isMuted]);

  // SCROLL KİLİTLEME
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalStyle; };
  }, []);

  // SORU OLUŞTURMA
  const generateQuestion = () => {
    setIsMatched(false);
    setFeedback(null);

    const randomTarget = OBJECTS[Math.floor(Math.random() * OBJECTS.length)];
    setTargetItem(randomTarget);

    let optionCount = 3;
    if (level === 2) optionCount = 4;
    if (level === 3) optionCount = 6;

    const distractors = OBJECTS.filter(item => item.id !== randomTarget.id)
                             .sort(() => 0.5 - Math.random())
                             .slice(0, optionCount - 1);

    const allOptions = [randomTarget, ...distractors].sort(() => 0.5 - Math.random());
    setOptions(allOptions);
  };

  useEffect(() => {
    generateQuestion();
  }, [level]);

  // --- SÜRÜKLE BIRAK MANTIĞI (GÜNCELLENMİŞ) ---
  const handleDragEnd = (event: any, info: any, droppedItem: typeof OBJECTS[0]) => {
    if (isMatched) return;

    const dropZone = dropZoneRef.current;
    if (!dropZone) return;

    // 1. Hedef kutunun (kesik çizgili alan) koordinatlarını al
    const dropRect = dropZone.getBoundingClientRect();
    
    // 2. Parmağın kaldırıldığı nokta
    const dropX = info.point.x;
    const dropY = info.point.y;

    // 3. KONTROL: Nokta kutu sınırları içinde mi? (20px tolerans ile)
    const isInside = 
        dropX >= dropRect.left - 20 && 
        dropX <= dropRect.right + 20 &&
        dropY >= dropRect.top - 20 && 
        dropY <= dropRect.bottom + 20;

    if (isInside) {
        if (droppedItem.id === targetItem.id) {
            handleSuccess();
        } else {
            handleMistake();
        }
    }
    // Değilse framer-motion otomatik geri götürür
  };

  const handleSuccess = () => {
    setIsMatched(true);
    setFeedback('correct');

    const randomSound = POSITIVE_SOUNDS[Math.floor(Math.random() * POSITIVE_SOUNDS.length)];
    const audio = new Audio(randomSound);
    audio.play().catch(()=>{});

    setTimeout(() => {
        const nextQ = questionIndex + 1;
        setQuestionIndex(nextQ);

        if (nextQ === 3) setLevel(2);
        else if (nextQ === 6) setLevel(3);
        else if (nextQ === 10) {
             setPhase('success');
             confetti();
             return;
        }
        
        generateQuestion();
    }, 2000); 
  };

  const handleMistake = () => {
    setFeedback('wrong');
    const randomSound = NEGATIVE_SOUNDS[Math.floor(Math.random() * NEGATIVE_SOUNDS.length)];
    const audio = new Audio(randomSound);
    audio.play().catch(()=>{});
    setTimeout(() => setFeedback(null), 1000);
  };

  return (
    <div className={twMerge(
        "fixed inset-0 z-[100] flex flex-col font-sans select-none overflow-hidden touch-none overscroll-none text-slate-800 transition-colors duration-1000",
        level === 3 
            ? "bg-slate-100 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" 
            : "bg-slate-50"
    )}>
      
      {/* ÜST BAR */}
      <div className="p-4 flex justify-between items-center z-10 w-full max-w-4xl mx-auto">
        <button onClick={onClose} className="p-2 bg-white border rounded-full shadow-sm"><XCircle className="text-slate-300"/></button>
        
        <div className="flex items-center gap-4">
             <div className="flex gap-1">
                 {[1, 2, 3].map(l => (
                     <div key={l} className={twMerge("w-3 h-3 rounded-full transition-colors", level >= l ? "bg-orange-500" : "bg-slate-200")}></div>
                 ))}
             </div>
             <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-white border rounded-full shadow-sm active:scale-95">
                 {isMuted ? <VolumeX size={20} className="text-slate-400"/> : <Volume2 size={20} className="text-blue-500"/>}
             </button>
        </div>
      </div>

      {phase === 'playing' && (
          <div className="flex-1 flex flex-col items-center justify-between py-4 w-full max-w-lg mx-auto h-full">
              
              {/* --- YUKARI: HEDEF (GÖLGE) --- */}
              <div className="flex-1 flex flex-col items-center justify-center w-full relative">
                  <div 
                    ref={dropZoneRef}
                    className={twMerge(
                        "relative flex items-center justify-center transition-all duration-500 bg-white rounded-[2rem] shadow-lg",
                        "w-60 h-60 border-4",
                        isMatched ? "border-green-500 scale-110 shadow-green-100" : "border-dashed border-slate-300"
                    )}
                  >
                      {/* SİYAH GÖLGE (Altta sabit duruyor) */}
                      <img 
                        src={targetItem.shadowSrc} 
                        // pointer-events-none ÇOK ÖNEMLİ: Sürüklemeyi engellememesi için
                        className="w-48 h-48 object-contain absolute opacity-60 pointer-events-none" 
                        alt="Gölge"
                      />

                      {/* RENKLİ HALİ (Doğru bilinince üstüne gelir) */}
                      <motion.img 
                        src={targetItem.colorSrc}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isMatched ? 1 : 0 }}
                        transition={{ duration: 0.8 }} 
                        // pointer-events-none ÇOK ÖNEMLİ
                        className="w-48 h-48 object-contain absolute z-10 pointer-events-none"
                        alt="Renkli"
                      />
                  </div>
                  
                  {!isMatched && (
                      <div className="mt-4 text-slate-400 font-bold text-xs tracking-[0.2em] uppercase animate-pulse">
                          Gölgeyi Bul
                      </div>
                  )}
              </div>

              {/* --- AŞAĞI: SEÇENEKLER (RENKLİ) --- */}
              <div className="w-full px-2 mb-6">
                  <div className={twMerge(
                      "grid gap-3 w-full justify-items-center",
                      level === 3 ? "grid-cols-3" : "grid-cols-3 sm:grid-cols-4"
                  )}>
                      {options.map((item) => {
                          const isCorrect = item.id === targetItem.id;
                          const isHidden = isMatched && isCorrect;

                          return (
                              <div key={item.id} className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center z-20">
                                  <motion.div
                                    // SÜRÜKLEME AYARLARI (HIZLI VE AKICI)
                                    drag={!isMatched} 
                                    dragConstraints={false} // Serbest sürükleme
                                    dragMomentum={false}    // Momentum yok (daha kontrollü)
                                    dragSnapToOrigin={true} // Bırakınca geri dönme
                                    dragElastic={0.1}
                                    
                                    whileDrag={{ scale: 1.2, zIndex: 100, cursor: 'grabbing' }}
                                    onDragEnd={(e, info) => handleDragEnd(e, info, item)}
                                    
                                    animate={isHidden ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
                                    
                                    className="w-full h-full bg-white rounded-2xl shadow-[0_4px_0_0_#e2e8f0] border-2 border-slate-100 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
                                  >
                                      <img src={item.colorSrc} className="w-20 h-20 object-contain pointer-events-none"/>
                                  </motion.div>
                              </div>
                          )
                      })}
                  </div>
              </div>
          </div>
      )}

      {/* SONUÇ EKRANI */}
      {phase === 'success' && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center text-center p-8 animate-in fade-in">
           <Trophy size={100} className="text-yellow-500 mb-6 animate-bounce" />
           <h1 className="text-3xl font-black text-slate-800 mb-2 uppercase">Harikasın!</h1>
           <p className="text-slate-500 mb-8 font-medium">Bütün eşleşmeleri tamamladın.</p>
           <button onClick={() => onComplete(true)} className="bg-green-600 text-white px-12 py-5 rounded-2xl font-bold text-xl shadow-xl active:scale-95 transition-transform">
             KAYDET VE ÇIK
           </button>
        </div>
      )}

      {/* FEEDBACK (YANLIŞ/DOĞRU İKONLARI) */}
      <AnimatePresence>
        {feedback === 'wrong' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-red-500 text-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-2 pointer-events-none"
          >
            <XCircle size={48} />
          </motion.div>
        )}
        {feedback === 'correct' && (
             <motion.div 
             initial={{ opacity: 0, scale: 0.5 }} 
             animate={{ opacity: 1, scale: 1 }} 
             exit={{ opacity: 0 }}
             className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-green-500 text-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-2 pointer-events-none"
           >
             <Check size={48} />
           </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
  }
          
