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

// --- GÖLGE RESİMLER ---
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

// --- SES DOSYALARI (HEPSİ EKLENDİ) ---
import arkaplanMusic from '../esle/ses/arkaplanmusic.mp3';
// Pozitif Sesler
import aferin1 from '../esle/ses/aferin1.mp3';
import aferin2 from '../esle/ses/aferin2.mp3';
import bravo from '../esle/ses/bravo.mp3';
import esledinbravo from '../esle/ses/esledinbravo.mp3';
import harika1 from '../esle/ses/harika1.mp3';
import harika2 from '../esle/ses/harika2.mp3';
// Negatif Sesler
import tekrardene1 from '../esle/ses/tekrardene1.mp3';
import tekrardene2 from '../esle/ses/tekrardene2.mp3';

// --- SES HAVUZLARI ---
const POSITIVE_SOUNDS = [aferin1, aferin2, bravo, esledinbravo, harika1, harika2];
const NEGATIVE_SOUNDS = [tekrardene1, tekrardene2];

// VERİ YAPISI
const OBJECTS = [
  { id: 'anahtar', colorSrc: anahtarImg, shadowSrc: golgeAnahtarImg },
  { id: 'araba', colorSrc: arabaImg, shadowSrc: golgeArabaImg },
  { id: 'cicek', colorSrc: cicekImg, shadowSrc: golgeCicekImg },
  { id: 'elma', colorSrc: elmaImg, shadowSrc: golgeElmaImg },
  { id: 'gitar', colorSrc: gitarImg, shadowSrc: golgeGitarImg },
  { id: 'kalem', colorSrc: kalemImg, shadowSrc: golgeKalemImg },
  { id: 'kitap', colorSrc: kitapImg, shadowSrc: golgeKitapImg },
  { id: 'saat', colorSrc: saatImg, shadowSrc: golgeSaatImg },
  { id: 'tavuk', colorSrc: tavukImg, shadowSrc: golgeTavukImg },
  { id: 'top', colorSrc: topImg, shadowSrc: golgeTopImg },
];

export default function NesneEslemeGame12({ onClose, onComplete }: any) {
  // OYUN DURUMLARI
  const [level, setLevel] = useState(1); // 1, 2, 3
  const [questionIndex, setQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'success'>('playing');
  
  // EKRANDAKİ NESNELER
  const [targetItem, setTargetItem] = useState(OBJECTS[0]); // Yukarıdaki Hedef (Gölge)
  const [options, setOptions] = useState<typeof OBJECTS>([]); // Aşağıdaki Seçenekler (Renkli)
  
  // GÖRSEL EFEKTLER
  const [isMatched, setIsMatched] = useState(false); // Doğru eşleşme oldu mu?
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // REF'LER
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // MÜZİK AYARLARI
  useEffect(() => {
    bgMusicRef.current = new Audio(arkaplanMusic);
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = 0.1; // Hafif arka plan müziği
    
    if (!isMuted) {
        bgMusicRef.current.play().catch(() => console.log("Otomatik müzik engellendi"));
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

  // SORU OLUŞTURUCU
  const generateQuestion = () => {
    setIsMatched(false);
    setFeedback(null);

    // Rastgele hedef seç
    const randomTarget = OBJECTS[Math.floor(Math.random() * OBJECTS.length)];
    setTargetItem(randomTarget);

    // Seviyeye göre seçenek sayısı belirle
    let optionCount = 3; // Level 1
    if (level === 2) optionCount = 4;
    if (level === 3) optionCount = 6;

    // Hedef dışındakileri karıştır ve al
    const distractors = OBJECTS.filter(item => item.id !== randomTarget.id)
                             .sort(() => 0.5 - Math.random())
                             .slice(0, optionCount - 1);

    // Hedefi de ekleyip hepsini karıştır
    const allOptions = [randomTarget, ...distractors].sort(() => 0.5 - Math.random());
    setOptions(allOptions);
  };

  // İLK YÜKLEME
  useEffect(() => {
    generateQuestion();
  }, [level]);

  // SÜRÜKLE BIRAK MANTIĞI
  const handleDragEnd = (event: any, info: any, droppedItem: typeof OBJECTS[0]) => {
    if (isMatched) return;

    const dropZone = dropZoneRef.current;
    if (!dropZone) return;

    const dropRect = dropZone.getBoundingClientRect();
    const { x, y } = info.point;

    // Bırakılan yer kutunun içinde mi?
    const isInside = 
        x >= dropRect.left - 20 && 
        x <= dropRect.right + 20 &&
        y >= dropRect.top - 20 && 
        y <= dropRect.bottom + 20;

    if (isInside) {
        if (droppedItem.id === targetItem.id) {
            handleSuccess();
        } else {
            handleMistake();
        }
    }
  };

  const handleSuccess = () => {
    setIsMatched(true);
    setFeedback('correct');

    // --- RASTGELE POZİTİF SES SEÇİMİ ---
    const randomSound = POSITIVE_SOUNDS[Math.floor(Math.random() * POSITIVE_SOUNDS.length)];
    const audio = new Audio(randomSound);
    audio.play().catch(()=>{});

    setTimeout(() => {
        const nextQ = questionIndex + 1;
        setQuestionIndex(nextQ);

        // Her 3 soruda bir seviye atla
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
    
    // --- RASTGELE NEGATİF SES SEÇİMİ ---
    const randomSound = NEGATIVE_SOUNDS[Math.floor(Math.random() * NEGATIVE_SOUNDS.length)];
    const audio = new Audio(randomSound);
    audio.play().catch(()=>{});

    setTimeout(() => setFeedback(null), 1000);
  };

  // --- RENDER ---
  return (
    <div className={twMerge(
        "fixed inset-0 z-[100] flex flex-col font-sans select-none overflow-hidden touch-none overscroll-none text-slate-800 transition-colors duration-1000",
        // LEVEL 3'TE KARMAŞIK ARKAPLAN
        level === 3 
            ? "bg-slate-100 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" 
            : "bg-slate-50"
    )}>
      
      {/* ÜST BAR */}
      <div className="p-4 flex justify-between items-center z-10">
        <button onClick={onClose} className="p-2 bg-white border rounded-full shadow-sm"><XCircle className="text-slate-300"/></button>
        
        <div className="flex items-center gap-4">
             {/* LEVEL GÖSTERGESİ */}
             <div className="flex gap-1">
                 {[1, 2, 3].map(l => (
                     <div key={l} className={twMerge("w-3 h-3 rounded-full transition-colors", level >= l ? "bg-orange-500" : "bg-slate-200")}></div>
                 ))}
             </div>
             
             {/* SES BUTONU */}
             <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-white border rounded-full shadow-sm active:scale-95">
                 {isMuted ? <VolumeX size={20} className="text-slate-400"/> : <Volume2 size={20} className="text-blue-500"/>}
             </button>
        </div>
      </div>

      {phase === 'playing' && (
          <div className="flex-1 flex flex-col items-center justify-between py-8">
              
              {/* --- YUKARI: HEDEF (GÖLGE) --- */}
              <div className="flex-1 flex items-center justify-center w-full relative">
                  <div 
                    ref={dropZoneRef}
                    className={twMerge(
                        "relative flex items-center justify-center transition-all duration-500 bg-white rounded-3xl shadow-xl",
                        "w-64 h-64 border-4",
                        isMatched ? "border-green-500 scale-110" : "border-dashed border-slate-300"
                    )}
                  >
                      {/* SİYAH GÖLGE (Altta) */}
                      <img 
                        src={targetItem.shadowSrc} 
                        className="w-48 h-48 object-contain absolute opacity-40 grayscale"
                        alt="Gölge"
                      />

                      {/* RENKLİ HALİ (Üstte - Animasyonla Beliriyor) */}
                      <motion.img 
                        src={targetItem.colorSrc}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isMatched ? 1 : 0 }}
                        transition={{ duration: 0.8 }} 
                        className="w-48 h-48 object-contain absolute z-10"
                        alt="Renkli"
                      />
                  </div>
                  
                  {!isMatched && (
                      <div className="absolute -bottom-8 text-slate-400 font-bold text-xs tracking-[0.2em] animate-pulse">
                          EŞİNİ BUL
                      </div>
                  )}
              </div>

              {/* --- AŞAĞI: SEÇENEKLER (RENKLİ) --- */}
              <div className="w-full max-w-4xl px-4 mb-4">
                  <div className={twMerge(
                      "grid gap-4 w-full justify-items-center",
                      level === 3 ? "grid-cols-3" : "grid-cols-3 sm:grid-cols-4"
                  )}>
                      {options.map((item) => {
                          const isCorrect = item.id === targetItem.id;
                          const isHidden = isMatched && isCorrect;

                          return (
                              <div key={item.id} className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                                  <motion.div
                                    drag={!isMatched} 
                                    dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }} 
                                    dragElastic={0.1}
                                    dragSnapToOrigin={true}
                                    onDragEnd={(e, info) => handleDragEnd(e, info, item)}
                                    whileDrag={{ scale: 1.2, zIndex: 50 }}
                                    
                                    animate={isHidden ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
                                    
                                    className="w-full h-full bg-white rounded-2xl shadow-md border-2 border-slate-100 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
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
           <p className="text-slate-500 mb-8 font-medium">Bütün gölgeleri buldun.</p>
           <button onClick={() => onComplete(true)} className="bg-green-600 text-white px-12 py-5 rounded-2xl font-bold text-xl shadow-xl active:scale-95 transition-transform">
             KAYDET VE ÇIK
           </button>
        </div>
      )}

      {/* FEEDBACK (YANLIŞ CEVAP) */}
      <AnimatePresence>
        {feedback === 'wrong' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-red-500 text-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-2"
          >
            <XCircle size={48} />
            <span className="font-bold text-lg">Tekrar Dene</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
