import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, XCircle, Trophy, GraduationCap, ClipboardCheck, RefreshCcw, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';
import { twMerge } from 'tailwind-merge';
import { Button } from '@/components/ui/button';

// --- RESİMLER (Hem 1. hem 2. setten karışık) ---
import anahtarImg from './anahtar.png';
import anahtar1Img from './anahtar1.png';
import arabaImg from './araba.png';
import araba1Img from './araba1.png';
import cicekImg from './cicek.png';
import cicek1Img from './cicek1.png';
import elmaImg from './elma.png';
import elma1Img from './elma1.png';
import gitarImg from './gitar.png';
import gitar1Img from './gitar1.png';
import kalemImg from './kalem.png';
import kalem1Img from './kalem1.png';
import kitapImg from './kitap.png';
import kitap1Img from './kitap1.png';
import saatImg from './saat.png';
import saat1Img from './saat1.png';
import tavukImg from './tavuk.png';
import tavuk1Img from './tavuk1.png';
import topImg from './top.png';
import top1Img from './top1.png';

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

// --- HEDEF NESNELER (Resmi Olanlar) ---
const TARGET_OBJECTS = [
  { id: 'anahtar', name: 'Anahtar', src: anahtarImg },
  { id: 'anahtar1', name: 'Anahtar', src: anahtar1Img },
  { id: 'araba', name: 'Araba', src: arabaImg },
  { id: 'araba1', name: 'Araba', src: araba1Img },
  { id: 'cicek', name: 'Çiçek', src: cicekImg },
  { id: 'cicek1', name: 'Çiçek', src: cicek1Img },
  { id: 'elma', name: 'Elma', src: elmaImg },
  { id: 'elma1', name: 'Elma', src: elma1Img },
  { id: 'gitar', name: 'Gitar', src: gitarImg },
  { id: 'gitar1', name: 'Gitar', src: gitar1Img },
  { id: 'kalem', name: 'Kalem', src: kalemImg },
  { id: 'kalem1', name: 'Kalem', src: kalem1Img },
  { id: 'kitap', name: 'Kitap', src: kitapImg },
  { id: 'kitap1', name: 'Kitap', src: kitap1Img },
  { id: 'saat', name: 'Saat', src: saatImg },
  { id: 'saat1', name: 'Saat', src: saat1Img },
  { id: 'tavuk', name: 'Tavuk', src: tavukImg },
  { id: 'tavuk1', name: 'Tavuk', src: tavuk1Img },
  { id: 'top', name: 'Top', src: topImg },
  { id: 'top1', name: 'Top', src: top1Img },
];

// --- EKSTRA KELİMELER (Sadece Yazı - Çeldirici) ---
const EXTRA_WORDS = [
    "Masa", "Sandalye", "Bardak", "Tabak", "Kaşık", 
    "Çatal", "Yatak", "Dolap", "Kapı", "Pencere"
];

interface GameProps {
  mode: 'assessment' | 'instruction';
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

export default function NesneEslemeGame17({ mode, onClose, onComplete }: GameProps) {
  // GAME STATES
  const [level, setLevel] = useState(1); 
  const [isMuted, setIsMuted] = useState(false);

  const [phase, setPhase] = useState<'playing' | 'success' | 'fail'>('playing');
  const [targetItem, setTargetItem] = useState(TARGET_OBJECTS[0]);
  const [options, setOptions] = useState<string[]>([]); // Sadece kelimeler string dizisi
  
  const [assessmentCount, setAssessmentCount] = useState(0); 
  const [assessmentScore, setAssessmentScore] = useState(0); 
  
  const [instructionMistakeCount, setInstructionMistakeCount] = useState(0);
  const [wrongSelection, setWrongSelection] = useState<string | null>(null);
  
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // Arkaplan Müziği
  useEffect(() => {
    window.scrollTo(0, 0);
    bgMusicRef.current = new Audio(arkaplanMusic);
    bgMusicRef.current.loop = true; 
    bgMusicRef.current.volume = 0.15; 
    
    if (!isMuted) {
        bgMusicRef.current.play().catch(() => {});
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
    audio.play().catch(() => {});
  };

  // --- SORU ÜRETME ---
  const generateQuestion = () => {
    // 1. Rastgele bir hedef görsel seç
    const randomTarget = TARGET_OBJECTS[Math.floor(Math.random() * TARGET_OBJECTS.length)];
    const correctWord = randomTarget.name;

    // 2. Tüm kelime havuzunu oluştur (Mevcut nesne isimleri + Ekstra kelimeler)
    // Set kullanarak tekrar edenleri (örn: 2 tane 'Anahtar' resmi var) temizle
    const objectNames = Array.from(new Set(TARGET_OBJECTS.map(o => o.name)));
    const allWords = [...objectNames, ...EXTRA_WORDS];

    // 3. Doğru cevabı havuzdan çıkar
    const availableDistractors = allWords.filter(w => w !== correctWord);

    // 4. Seviyeye göre seçenek sayısı
    let optionCount = 3; 
    if (level === 2) optionCount = 4;
    if (level === 3) optionCount = 6;
    
    // 5. Çeldiricileri seç ve karıştır
    const selectedDistractors = availableDistractors
        .sort(() => 0.5 - Math.random())
        .slice(0, optionCount - 1);

    setTargetItem(randomTarget);
    setOptions([correctWord, ...selectedDistractors].sort(() => 0.5 - Math.random()));
    
    // Sıfırlamalar
    setShowFeedback(null);
    setWrongSelection(null);
    setInstructionMistakeCount(0);
  };

  useEffect(() => { generateQuestion(); }, [level]);

  // --- CEVAP KONTROLÜ ---
  const handleOptionClick = (selectedWord: string) => {
    if (showFeedback === 'correct') return; // Zaten doğru bilindiyse bekle

    if (selectedWord === targetItem.name) {
        // DOĞRU
        playSoundEffect('success');
        if (mode === 'instruction') setShowFeedback('correct');
        if (mode === 'assessment') setAssessmentScore(prev => prev + 1);

        setTimeout(() => {
            if (mode === 'instruction') {
                generateQuestion();
            } else {
                const nextCount = assessmentCount + 1;
                setAssessmentCount(nextCount);
                if (nextCount < 10) generateQuestion();
            }
        }, 1500);
    } else {
        // YANLIŞ
        playSoundEffect('fail');
        setWrongSelection(selectedWord);
        
        if (mode === 'assessment') {
            setTimeout(() => {
                const nextCount = assessmentCount + 1;
                setAssessmentCount(nextCount);
                if (nextCount < 10) generateQuestion();
            }, 800);
        } else {
            setInstructionMistakeCount(prev => prev + 1);
            setShowFeedback('wrong');
            setTimeout(() => {
                 setShowFeedback(null);
                 setWrongSelection(null);
            }, 1000);
        }
    }
  };

  const fireConfetti = () => {
    confetti({ particleCount: 300, spread: 100, origin: { y: 0.6 } });
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
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-50 font-sans select-none overflow-hidden">
      
      {/* Üst Bar */}
      <div className="p-4 flex justify-between items-center relative z-10">
        <button onClick={onClose} className="p-2 bg-white border border-slate-200 rounded-full shadow-sm">
          <XCircle size={24} className="text-slate-400" />
        </button>
        
        <div className="flex items-center gap-3">
             {mode === 'instruction' && (
                 <div className="flex bg-slate-200 p-1 rounded-full items-center">
                     {[1, 2, 3].map(l => (
                         <button 
                            key={l}
                            onClick={() => setLevel(l)} 
                            className={twMerge(
                                "px-4 py-1.5 text-xs font-bold rounded-full transition-all",
                                level === l ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
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
                    {mode === 'assessment' ? `${assessmentCount + 1}/10` : "ÖĞRETİM"}
                </span>
            </div>
            
            <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-white border rounded-full shadow-sm">
                 {isMuted ? <VolumeX size={20} className="text-slate-400"/> : <Volume2 size={20} className="text-blue-500"/>}
            </button>
        </div>
      </div>

      {/* --- OYUN ALANI --- */}
      {phase === 'playing' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 p-4">
          
          {/* HEDEF GÖRSEL */}
          <div className="w-64 h-64 bg-white rounded-3xl border-4 border-slate-200 flex items-center justify-center shadow-xl p-6">
               <img 
                 src={targetItem.src} 
                 alt="Hedef" 
                 className="w-full h-full object-contain drop-shadow-md" 
               />
          </div>

          <h2 className="text-slate-400 font-bold text-sm tracking-widest animate-pulse">BU NESNENİN İSMİ NEDİR?</h2>

          {/* SEÇENEKLER (GRID) */}
          <div className={twMerge(
              "grid gap-4 w-full max-w-2xl px-4",
              level === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2" // 3. seviyede 3 kolon olabilir
          )}>
            {options.map((word, idx) => {
              const isCorrect = word === targetItem.name;
              // Eğer öğretim modundaysak ve 2 kere yanlış yapıldıysa sadece doğruyu göster
              const isWrongAndHidden = mode === 'instruction' && instructionMistakeCount >= 2 && !isCorrect;
              
              if (isWrongAndHidden) return <div key={idx} className="h-16"></div>; // Boş yer tutucu

              return (
                <motion.button
                    key={idx}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleOptionClick(word)}
                    animate={
                        (showFeedback === 'correct' && isCorrect) 
                        ? { scale: [1, 1.1, 1], backgroundColor: "#22c55e", color: "#fff", borderColor: "#16a34a" } 
                        : (wrongSelection === word)
                        ? { x: [-10, 10, -10, 10, 0], backgroundColor: "#ef4444", color: "#fff", borderColor: "#dc2626" }
                        : {}
                    }
                    className="h-20 bg-white border-b-4 border-slate-200 rounded-2xl font-black text-xl text-slate-700 hover:bg-slate-50 hover:border-blue-200 hover:text-blue-600 transition-colors shadow-sm uppercase tracking-wide"
                >
                    {word}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* SONUÇ EKRANLARI */}
      {phase === 'success' && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center text-center p-8 animate-in zoom-in duration-300">
           <Trophy size={100} className="text-yellow-500 mb-6 animate-bounce" />
           <h1 className="text-3xl font-black text-slate-800 mb-2 uppercase">Harikasın!</h1>
           <p className="text-slate-500 mb-8 font-medium text-lg">Skor: {assessmentScore * 10}</p>
           <button onClick={() => onComplete(true)} className="bg-green-600 text-white px-12 py-5 rounded-2xl font-bold text-xl shadow-xl active:scale-95 transition-all">
             KAYDET VE BİTİR
           </button>
        </div>
      )}

      {phase === 'fail' && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center text-center p-8 animate-in zoom-in duration-300">
           <div className="text-8xl mb-6 italic font-black text-slate-200">!</div>
           <h1 className="text-2xl font-black text-slate-800 mb-2 uppercase">Tekrar Deneyelim</h1>
           <p className="text-slate-500 mb-10 font-medium">Skor: {assessmentScore} / 10</p>
           <div className="flex gap-4">
             <button onClick={onClose} className="bg-slate-100 text-slate-600 px-8 py-4 rounded-xl font-bold text-lg">KAPAT</button>
             <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg flex items-center gap-2">
               <RefreshCcw size={20}/> TEKRAR
             </button>
           </div>
        </div>
      )}

      {/* FEEDBACK OVERLAY */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[110] flex flex-col items-center justify-center pointer-events-none bg-black/10 backdrop-blur-[2px]"
          >
            <div className={`
                p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in duration-200
                ${showFeedback === 'correct' ? 'bg-green-500' : 'bg-red-500'}
            `}>
                {showFeedback === 'correct' ? (
                    <Check size={64} className="text-white"/> 
                ) : (
                    <XCircle size={64} className="text-white"/>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
  }
        
