import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, XCircle, Trophy, GraduationCap, ClipboardCheck, RefreshCcw, Volume2, VolumeX, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';
import { twMerge } from 'tailwind-merge';

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

// --- DATA HAVUZLARI ---
const LETTERS = ['E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ğ', 'Ü', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ', 'Z', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç'];

const SYLLABLES = [
    "AL", "EL", "İL", "OL", "AK", "EK", "İK", "OK", "AT", "ET", 
    "OT", "UN", "OM", "MA", "ME", "LA", "LE", "KA", "KE", "BA", 
    "BE", "DE", "DA", "FA", "FE", "YE", "YA", "SU", "BU", "ŞU"
];

const WORDS = [
    "ALİ", "ELA", "ATA", "TOP", "MUZ", "KUŞ", "AYI", "EVE", "BAK", "GEL", 
    "KOŞ", "SÜT", "ÇAY", "KEK", "BAL", "GÖZ", "EL", "EV", "AT", "SU"
];

// --- KLAVYE DÜZENİ ---
const ROW_1 = ['E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ğ', 'Ü'];
const ROW_2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ'];
const ROW_3 = ['Z', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç'];

interface GameProps {
  mode: 'assessment' | 'instruction';
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

export default function NesneEslemeGame15({ mode, onClose, onComplete }: GameProps) {
  const [phase, setPhase] = useState<'playing' | 'success' | 'fail'>('playing');
  
  // Ayarlar
  const [isMuted, setIsMuted] = useState(false);
  const [level, setLevel] = useState<1 | 2 | 3>(1);

  // Oyun Durumu
  const [targetString, setTargetString] = useState('A'); // Hedef Kelime/Harf
  const [currentIndex, setCurrentIndex] = useState(0); // Kelimenin kaçıncı harfindeyiz?
  
  const [mistakeCount, setMistakeCount] = useState(0); 
  const [disabledKeys, setDisabledKeys] = useState<string[]>([]); 
  const [isShake, setIsShake] = useState(false); 
  const [isSuccessAnim, setIsSuccessAnim] = useState(false);

  // Puanlama
  const [assessmentCount, setAssessmentCount] = useState(0); 
  const [assessmentScore, setAssessmentScore] = useState(0); 

  // Referanslar
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // --- MÜZİK KONTROLÜ ---
  useEffect(() => {
    bgMusicRef.current = new Audio(arkaplanMusic);
    bgMusicRef.current.loop = true; 
    bgMusicRef.current.volume = 0.10; 
    
    // Mute durumuna göre başlat/durdur
    if (!isMuted) {
        const playPromise = bgMusicRef.current.play();
        if (playPromise !== undefined) playPromise.catch(() => {});
    }

    return () => {
        if (bgMusicRef.current) {
            bgMusicRef.current.pause();
            bgMusicRef.current.currentTime = 0;
        }
    };
  }, []);

  // Mute butonu tetiklendiğinde
  useEffect(() => {
      if (bgMusicRef.current) {
          bgMusicRef.current.muted = isMuted;
          if (!isMuted) bgMusicRef.current.play().catch(() => {});
      }
  }, [isMuted]);

  // Scroll Kilitleme
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  // --- SORU OLUŞTURMA ---
  const generateQuestion = () => {
    let newTarget = "";

    if (level === 1) {
        newTarget = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    } else if (level === 2) {
        newTarget = SYLLABLES[Math.floor(Math.random() * SYLLABLES.length)];
    } else {
        newTarget = WORDS[Math.floor(Math.random() * WORDS.length)];
    }

    setTargetString(newTarget);
    setCurrentIndex(0); // Başa sar
    
    // Durumları TAMAMEN sıfırla
    setMistakeCount(0);
    setDisabledKeys([]);
    setIsShake(false);
    setIsSuccessAnim(false);
  };

  // Seviye değişince yeni soru sor
  useEffect(() => {
      generateQuestion();
      setAssessmentCount(0);
      setAssessmentScore(0);
  }, [level]);

  // --- SES EFEKTLERİ ---
  const playSoundEffect = (type: 'success' | 'fail' | 'click') => {
    if (type === 'click') {
        // Ara ses (harf doğru ama kelime bitmedi) - Şimdilik boş geçebiliriz veya kısa bip sesi ekleyebiliriz
        return;
    }

    let soundSrc;
    if (type === 'success') {
        soundSrc = POSITIVE_SOUNDS[Math.floor(Math.random() * POSITIVE_SOUNDS.length)];
    } else {
        soundSrc = NEGATIVE_SOUNDS[Math.floor(Math.random() * NEGATIVE_SOUNDS.length)];
    }
    const audio = new Audio(soundSrc);
    audio.volume = 1.0; 
    audio.play().catch(() => {});
  };

  // --- TUŞA BASINCA ---
  const handleKeyPress = (letter: string) => {
    if (phase !== 'playing' || disabledKeys.includes(letter) || isSuccessAnim) return;

    const expectedChar = targetString[currentIndex];

    if (letter === expectedChar) {
        // DOĞRU HARF
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        
        // Hata sayısını ve ipuçlarını sıfırla (Sıradaki harf için temiz sayfa)
        setMistakeCount(0);
        setDisabledKeys([]);

        // Kelime bitti mi?
        if (nextIndex === targetString.length) {
            handleSuccess();
        } else {
            playSoundEffect('click'); // Ara ses opsiyonel
        }

    } else {
        // YANLIŞ HARF
        handleMistake();
    }
  };

  const handleSuccess = () => {
    setIsSuccessAnim(true);
    playSoundEffect('success');
    
    if (mode === 'assessment') {
        // Test modunda hiç hata yapmadan bitirdiyse puan ver (Basit mantık)
        // Not: Kelime modunda her harf hatası mistakeCount'u artırır.
        setAssessmentScore(prev => prev + 1);
    }

    setTimeout(() => {
        if (mode === 'assessment') {
            const nextCount = assessmentCount + 1;
            setAssessmentCount(nextCount);
            if (nextCount < 10) {
                generateQuestion();
            }
        } else {
            generateQuestion();
        }
    }, 1500);
  };

  const handleMistake = () => {
    playSoundEffect('fail');
    setIsShake(true);
    setTimeout(() => setIsShake(false), 500);

    const newMistakeCount = mistakeCount + 1;
    setMistakeCount(newMistakeCount);

    if (mode === 'instruction') {
        // --- İPUCU SİSTEMİ (Sıradaki beklenen harf için) ---
        const expectedChar = targetString[currentIndex];

        // 2. Yanlış: Harflerin yarısını kapat
        if (newMistakeCount === 2) {
            const wrongKeys = LETTERS.filter(l => l !== expectedChar);
            const keysToDisable = wrongKeys.sort(() => 0.5 - Math.random()).slice(0, Math.floor(wrongKeys.length / 2));
            setDisabledKeys(keysToDisable);
        }

        // 3. Yanlış: Sadece doğru harf kalsın
        if (newMistakeCount >= 3) {
            const allWrongKeys = LETTERS.filter(l => l !== expectedChar);
            setDisabledKeys(allWrongKeys);
        }
    }
  };

  // --- OYUN SONU KONTROLÜ ---
  useEffect(() => {
    if (mode === 'assessment' && assessmentCount === 10) {
      if (assessmentScore >= 7) { 
        setPhase('success');
        confetti({ particleCount: 300, spread: 100, origin: { y: 0.6 } });
      } else {
        setPhase('fail');
      }
    }
  }, [assessmentCount, assessmentScore, mode]);

  // --- TUŞ RENDER ---
  const renderKey = (letter: string) => {
    const isDisabled = disabledKeys.includes(letter);
    const expectedChar = targetString[currentIndex];
    const isTarget = letter === expectedChar && !isSuccessAnim; // Sadece sıradaki harf hedef
    
    // İpucu mantığı: Eğer hata yapıldıysa ve bu tuş doğru tuşsa yanıp sön
    const shouldFlash = mode === 'instruction' && mistakeCount > 0 && isTarget;

    return (
        <motion.button
            key={letter}
            whileTap={!isDisabled ? { scale: 0.9 } : {}}
            onClick={() => handleKeyPress(letter)}
            animate={shouldFlash ? { 
                scale: [1, 1.15, 1], 
                backgroundColor: ["#ffffff", "#bfdbfe", "#ffffff"],
                borderColor: ["#cbd5e1", "#3b82f6", "#cbd5e1"]
            } : {}}
            transition={shouldFlash ? { duration: 0.5, repeat: Infinity } : {}}
            className={twMerge(
                // RESPONSIVE AYARLAR: width ve height vw (viewport width) cinsinden
                "relative rounded-md sm:rounded-xl font-bold text-lg sm:text-2xl md:text-3xl shadow-[0_2px_0_0_#cbd5e1] sm:shadow-[0_4px_0_0_#cbd5e1] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center select-none border-b-2 sm:border-b-4 border-slate-300",
                // Genişlik ayarı: Mobilde çok daha küçük, tablet/pc'de normal
                "w-[8vw] h-[10vw] sm:w-14 sm:h-16 max-w-[50px] max-h-[60px]", 
                isDisabled ? "opacity-20 bg-slate-200 text-slate-300 pointer-events-none shadow-none border-none" : "bg-white text-slate-700 hover:bg-slate-50 active:bg-blue-50"
            )}
        >
            {letter}
        </motion.button>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col font-sans select-none overflow-hidden touch-none overscroll-none text-slate-800">
      
      {/* ÜST BAR */}
      <div className="w-full flex justify-between items-center p-2 sm:p-4 z-10 bg-white/50 backdrop-blur-sm border-b border-slate-200 shadow-sm h-16 shrink-0">
        <button onClick={onClose} className="p-2 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-100">
          <XCircle size={24} className="text-slate-300" />
        </button>
        
        {/* ORTA KISIM - SEVİYE VE BİLGİ */}
        <div className="flex items-center gap-2 sm:gap-4">
            
            {/* SEVİYE SEÇİCİ */}
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                {[1, 2, 3].map((lvl) => (
                    <button
                        key={lvl}
                        onClick={() => setLevel(lvl as 1|2|3)}
                        className={twMerge(
                            "px-3 py-1 text-xs font-bold rounded-md transition-all",
                            level === lvl ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        LVL {lvl}
                    </button>
                ))}
            </div>

            <div className={twMerge(
                "hidden sm:flex px-3 py-1 rounded-full shadow-sm border items-center gap-2",
                mode === 'assessment' ? "bg-blue-50 border-blue-100" : "bg-purple-50 border-purple-100"
            )}>
                {mode === 'assessment' ? <ClipboardCheck size={14} className="text-blue-600"/> : <GraduationCap size={14} className="text-purple-600"/>}
                <span className={twMerge("font-bold text-[10px] uppercase", mode === 'assessment' ? "text-blue-600" : "text-purple-600")}>
                    {mode === 'assessment' ? `${Math.min(assessmentCount + 1, 10)}/10` : "EĞİTİM"}
                </span>
            </div>
        </div>

        {/* SAĞ KISIM - MUTE BUTONU */}
        <button 
            onClick={() => setIsMuted(!isMuted)} 
            className="p-2 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-100 transition-colors"
        >
            {isMuted ? <VolumeX size={20} className="text-red-400" /> : <Volume2 size={20} className="text-blue-500" />}
        </button>
      </div>

      {/* --- OYUN ALANI (Esnek ve Ortalı) --- */}
      {phase === 'playing' && (
        <div className="flex-1 flex flex-col items-center justify-between w-full max-w-4xl mx-auto py-4 sm:py-8 overflow-y-auto">
          
          {/* HEDEF KELİME KUTUSU */}
          <div className="flex-1 flex flex-col items-center justify-center gap-4 w-full px-4">
              <span className="text-slate-400 text-xs sm:text-sm font-bold tracking-widest uppercase">
                  {level === 1 ? "Harfi Bul" : "Yaz"}
              </span>
              
              <motion.div 
                animate={isShake ? { x: [-10, 10, -10, 10, 0], color: "#ef4444" } : { x: 0, color: isSuccessAnim ? "#22c55e" : "#334155" }}
                transition={{ duration: 0.4 }}
                className={twMerge(
                    "flex items-center justify-center gap-1 sm:gap-2 px-6 py-4 sm:px-10 sm:py-6 bg-white rounded-2xl sm:rounded-3xl border-4 shadow-xl transition-all",
                    isSuccessAnim ? "border-green-500 bg-green-50 scale-105" : "border-slate-200",
                    isShake ? "border-red-400 bg-red-50" : ""
                )}
              >
                  {/* Harfleri tek tek render et - Yazılanlar yeşil olsun */}
                  {targetString.split('').map((char, index) => (
                      <span key={index} className={twMerge(
                          "text-4xl sm:text-6xl md:text-7xl font-black transition-colors",
                          index < currentIndex ? "text-green-500" : // Yazılmış olanlar
                          index === currentIndex && !isSuccessAnim && !isShake ? "text-slate-800 underline decoration-4 decoration-blue-300 underline-offset-8" : // Sıradaki
                          "text-slate-300" // Henüz yazılmayanlar
                      )}>
                          {char}
                      </span>
                  ))}
              </motion.div>
          </div>

          {/* KLAVYE ALANI - Fixed Bottom'dan ziyade Flex ile aşağı itildi */}
          <div className="w-full bg-slate-200/80 backdrop-blur-md p-2 sm:p-6 rounded-t-3xl border-t border-white/50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex flex-col items-center gap-2 sm:gap-3 pb-8 sm:pb-8 shrink-0">
             {/* 1. SATIR */}
             <div className="flex justify-center gap-[1vw] sm:gap-2 w-full">
                 {ROW_1.map(renderKey)}
             </div>
             {/* 2. SATIR */}
             <div className="flex justify-center gap-[1vw] sm:gap-2 w-full">
                 {ROW_2.map(renderKey)}
             </div>
             {/* 3. SATIR */}
             <div className="flex justify-center gap-[1vw] sm:gap-2 w-full">
                 {ROW_3.map(renderKey)}
             </div>
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

    </div>
  );
}
