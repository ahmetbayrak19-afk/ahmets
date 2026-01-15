import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, XCircle, Trophy, GraduationCap, ClipboardCheck, RefreshCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { twMerge } from 'tailwind-merge';

// --- SES DOSYALARI (Mevcut dizinden) ---
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

// --- KLAVYE DÜZENİ (TÜRKÇE Q) ---
const ROW_1 = ['E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ğ', 'Ü'];
const ROW_2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ'];
const ROW_3 = ['Z', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç'];

// Tüm harflerin düz listesi (Soru seçimi için)
const ALL_LETTERS = [...ROW_1, ...ROW_2, ...ROW_3];

interface GameProps {
  mode: 'assessment' | 'instruction';
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

export default function NesneEslemeGame15({ mode, onClose, onComplete }: GameProps) {
  const [phase, setPhase] = useState<'playing' | 'success' | 'fail'>('playing');
  
  // Oyun Durumu
  const [targetLetter, setTargetLetter] = useState('A');
  const [mistakeCount, setMistakeCount] = useState(0); // O anki soru için hata sayısı
  const [disabledKeys, setDisabledKeys] = useState<string[]>([]); // Pasifleşen tuşlar
  const [isShake, setIsShake] = useState(false); // Hedef harfi titretmek için
  const [isSuccessAnim, setIsSuccessAnim] = useState(false); // Doğru bilinince yeşil yapma

  // Puanlama ve İlerleme
  const [assessmentCount, setAssessmentCount] = useState(0); 
  const [assessmentScore, setAssessmentScore] = useState(0); 

  // Ses Referansı
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // --- MÜZİK VE BAŞLANGIÇ ---
  useEffect(() => {
    bgMusicRef.current = new Audio(arkaplanMusic);
    bgMusicRef.current.loop = true; 
    bgMusicRef.current.volume = 0.10; // Müzik sesi kısık
    
    const playPromise = bgMusicRef.current.play();
    if (playPromise !== undefined) {
        playPromise.catch(() => console.log("Otomatik oynatma engellendi."));
    }
    
    generateQuestion();

    return () => {
        if (bgMusicRef.current) {
            bgMusicRef.current.pause();
            bgMusicRef.current.currentTime = 0;
        }
    };
  }, []);

  // Scroll Kilitleme
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  // --- SORU OLUŞTURMA ---
  const generateQuestion = () => {
    // Rastgele bir harf seç
    const randomLetter = ALL_LETTERS[Math.floor(Math.random() * ALL_LETTERS.length)];
    setTargetLetter(randomLetter);
    
    // Durumları sıfırla
    setMistakeCount(0);
    setDisabledKeys([]);
    setIsShake(false);
    setIsSuccessAnim(false);
  };

  // --- SES EFEKTLERİ ---
  const playSoundEffect = (type: 'success' | 'fail') => {
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
    // Eğer oyun bittiyse, tuş pasifse veya başarı animasyonu varsa işlem yapma
    if (phase !== 'playing' || disabledKeys.includes(letter) || isSuccessAnim) return;

    if (letter === targetLetter) {
        handleSuccess();
    } else {
        handleMistake();
    }
  };

  const handleSuccess = () => {
    setIsSuccessAnim(true);
    playSoundEffect('success');
    
    if (mode === 'assessment') {
        // Test modunda ipucu almadan (0 hata) bildiyse puan ver
        if (mistakeCount === 0) setAssessmentScore(prev => prev + 1);
    }

    // Biraz bekle sonra diğer soruya geç
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
    setTimeout(() => setIsShake(false), 500); // Titreme animasyonu süresi

    const newMistakeCount = mistakeCount + 1;
    setMistakeCount(newMistakeCount);

    if (mode === 'instruction') {
        // --- İPUCU SİSTEMİ (Sadece Öğretim Modunda) ---
        
        // 1. Yanlış: Hiçbir tuşu kapatma, sadece doğru tuş yanıp sönmeye başlayacak (Render kısmında hallediliyor)

        // 2. Yanlış: Tuşların yarısını kapat
        if (newMistakeCount === 2) {
            const wrongKeys = ALL_LETTERS.filter(l => l !== targetLetter);
            // Rastgele karıştır ve yarısını al
            const keysToDisable = wrongKeys.sort(() => 0.5 - Math.random()).slice(0, Math.floor(wrongKeys.length / 2));
            setDisabledKeys(keysToDisable);
        }

        // 3. Yanlış: Doğru tuş hariç HEPSİNİ kapat
        if (newMistakeCount >= 3) {
            const allWrongKeys = ALL_LETTERS.filter(l => l !== targetLetter);
            setDisabledKeys(allWrongKeys);
        }
    } else {
        // Değerlendirme modunda ipucu yok, sadece sonraki soruya geçiş var
        setTimeout(() => {
             const nextCount = assessmentCount + 1;
             setAssessmentCount(nextCount);
             if (nextCount < 10) generateQuestion();
        }, 1000);
    }
  };

  // --- OYUN SONU KONTROLÜ ---
  useEffect(() => {
    if (mode === 'assessment' && assessmentCount === 10) {
      if (assessmentScore >= 7) { // 10 sorudan 7'si doğruysa başarılı sayalım
        setPhase('success');
        confetti({ particleCount: 300, spread: 100, origin: { y: 0.6 } });
      } else {
        setPhase('fail');
      }
    }
  }, [assessmentCount, assessmentScore, mode]);

  // --- TUŞ RENDER FONKSİYONU ---
  const renderKey = (letter: string) => {
    const isDisabled = disabledKeys.includes(letter);
    const isTarget = letter === targetLetter;
    
    // Doğru tuşun yanıp sönme hızı (Hata arttıkça hızlanır)
    const flashDuration = mistakeCount >= 2 ? 0.5 : 1; 
    
    // Doğru tuş parlasın mı? (1. hatadan sonra)
    const shouldFlash = mode === 'instruction' && mistakeCount > 0 && isTarget;

    return (
        <motion.button
            key={letter}
            whileTap={!isDisabled ? { scale: 0.9 } : {}}
            onClick={() => handleKeyPress(letter)}
            animate={shouldFlash ? { 
                scale: [1, 1.15, 1], 
                backgroundColor: ["#ffffff", "#bfdbfe", "#ffffff"],
                boxShadow: ["0px 4px 0px #cbd5e1", "0px 4px 10px #3b82f6", "0px 4px 0px #cbd5e1"]
            } : {}}
            transition={shouldFlash ? { duration: flashDuration, repeat: Infinity } : {}}
            className={twMerge(
                "relative w-10 h-12 sm:w-14 sm:h-16 md:w-20 md:h-20 rounded-xl font-black text-xl sm:text-3xl md:text-4xl shadow-[0_4px_0_0_#cbd5e1] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center select-none",
                isDisabled ? "opacity-10 bg-slate-200 text-slate-300 pointer-events-none shadow-none" : "bg-white text-slate-700 hover:bg-slate-50",
                isSuccessAnim && isTarget ? "bg-green-500 text-white shadow-[0_4px_0_0_#15803d]" : ""
            )}
        >
            {letter}
        </motion.button>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col p-4 font-sans select-none overflow-hidden touch-none overscroll-none text-slate-800">
      
      {/* ÜST BAR */}
      <div className="w-full flex justify-between items-center mb-4 z-10">
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
        <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full max-w-4xl mx-auto">
          
          {/* HEDEF HARF KUTUSU */}
          <div className="flex flex-col items-center gap-4">
              <span className="text-slate-400 text-sm font-bold tracking-widest uppercase">Bu Harfi Bul</span>
              <motion.div 
                animate={isShake ? { x: [-10, 10, -10, 10, 0], color: "#ef4444" } : { x: 0, color: isSuccessAnim ? "#22c55e" : "#334155" }}
                transition={{ duration: 0.4 }}
                className={twMerge(
                    "w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-3xl border-4 flex items-center justify-center shadow-lg text-7xl sm:text-8xl font-black",
                    isSuccessAnim ? "border-green-500 bg-green-50 scale-110" : "border-slate-200",
                    isShake ? "border-red-400 bg-red-50" : ""
                )}
              >
                  {targetLetter}
              </motion.div>
          </div>

          {/* KLAVYE ALANI */}
          <div className="w-full bg-slate-200/50 p-4 sm:p-8 rounded-[2rem] border border-slate-300 shadow-inner flex flex-col items-center gap-2 sm:gap-4">
             {/* 1. SATIR */}
             <div className="flex gap-1 sm:gap-2 md:gap-3">
                 {ROW_1.map(renderKey)}
             </div>
             {/* 2. SATIR */}
             <div className="flex gap-1 sm:gap-2 md:gap-3 pl-4 sm:pl-8">
                 {ROW_2.map(renderKey)}
             </div>
             {/* 3. SATIR */}
             <div className="flex gap-1 sm:gap-2 md:gap-3 pl-8 sm:pl-16">
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
