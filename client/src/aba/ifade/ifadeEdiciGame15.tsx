import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, XCircle, Trophy, Mic, MicOff, Play, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { twMerge } from 'tailwind-merge';

// --- RESİMLER ---
import anahtarImg from '../esle/anahtar.png';
import arabaImg from '../esle/araba.png';
import kalemImg from '../esle/kalem.png';
import topImg from '../esle/top.png';

// --- SES EFEKTLERİ ---
import aferin1 from '../esle/ses/aferin1.mp3';
import bravo from '../esle/ses/bravo.mp3';
import tekrardene1 from '../esle/ses/tekrardene1.mp3';

const ITEMS = [
  { id: 'anahtar', src: anahtarImg, label: 'Anahtar' },
  { id: 'araba', src: arabaImg, label: 'Araba' },
  { id: 'kalem', src: kalemImg, label: 'Kalem' },
  { id: 'top', src: topImg, label: 'Top' },
];

const STANDARD_YES = ['evet', 'eved', 'he', 'hıhı', 'doğru', 'tamam', 'evetevet', 'olur', 'aynen'];
const STANDARD_NO = ['hayır', 'yok', 'cık', 'değil', 'olmaz', 'hayı', 'yanlış'];

export default function IfadeEdiciGame15({ onClose, onComplete }: any) {
  const [phase, setPhase] = useState<'init' | 'setup' | 'playing' | 'success'>('init');
  
  const [customYesWords, setCustomYesWords] = useState<string[]>([]);
  const [customNoWords, setCustomNoWords] = useState<string[]>([]);
  const [lastHeard, setLastHeard] = useState<string>("");
  const [isRecordingSetup, setIsRecordingSetup] = useState<'yes' | 'no' | null>(null);

  const [targetItem, setTargetItem] = useState(ITEMS[0]);
  const [compareItem, setCompareItem] = useState(ITEMS[0]);
  const [isMatch, setIsMatch] = useState(true);
  
  // UI Durumları
  const [isListening, setIsListening] = useState(false);
  const [animState, setAnimState] = useState<'hidden' | 'sliding' | 'visible'>('hidden');
  
  const [questionCount, setQuestionCount] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const recognitionRef = useRef<any>(null);

  // --- 1. SES MOTORU AYARLARI ---
  useEffect(() => {
    if (phase === 'init') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        
        // Setup ekranında sürekli dinle, Oyun ekranında tek seferlik (Android için daha stabil)
        recognition.continuous = phase === 'setup'; 
        recognition.interimResults = true; 
        recognition.lang = 'tr-TR';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            let transcript = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                transcript += event.results[i][0].transcript;
            }
            const lowerTranscript = transcript.trim().toLowerCase();
            setLastHeard(lowerTranscript);

            // OYUN MODUNDA KRİTİK DEĞİŞİKLİK:
            // State'i bekleme, direkt burada kontrol et ve yakalarsan ABORT et.
            if (phase === 'playing') {
                const YES_POOL = [...STANDARD_YES, ...customYesWords];
                const NO_POOL = [...STANDARD_NO, ...customNoWords];
                
                const words = lowerTranscript.split(" ");
                let foundAnswer: 'yes' | 'no' | null = null;

                for (const word of words) {
                    if (YES_POOL.some(w => word.includes(w) || w.includes(word))) foundAnswer = 'yes';
                    if (NO_POOL.some(w => word.includes(w) || w.includes(word))) foundAnswer = 'no';
                }

                if (foundAnswer) {
                    // CEVABI YAKALADIK!
                    // 2. Click sesini beklemeden hemen motoru durduruyoruz.
                    recognition.abort(); 
                    checkAnswer(foundAnswer);
                }
            }
        };

        recognition.onend = () => {
            setIsListening(false);
            
            // Eğer oyun oynanıyorsa, henüz cevap verilmediyse (feedback yoksa)
            // ve motor kendiliğinden kapandıysa (sessizlik vs.) -> TEKRAR AÇ
            if (phase === 'playing' && !feedback) {
                // Döngüye girmemesi için ufak bir bekleme
                setTimeout(() => {
                    // Eğer hala cevap verilmediyse tekrar başlat
                    // Not: React state güncellemeleri asenkron olduğu için ref kontrolü yapabiliriz ama
                    // burada basitçe tekrar deniyoruz.
                     try { recognition.start(); } catch(e) {}
                }, 300);
            }
        };

        recognitionRef.current = recognition;
    }

    return () => {
        if(recognitionRef.current) recognitionRef.current.abort();
    };
  }, [phase, feedback, customYesWords, customNoWords]); // Havuz değişirse de güncelle

  // --- OYUN MANTIĞI ---
  // Not: Artık handleGameSpeech'i onresult içinde direkt yapıyoruz.

  const checkAnswer = (userSays: 'yes' | 'no') => {
      // Çift tetiklemeyi önlemek için
      if (feedback) return;

      const expected = isMatch ? 'yes' : 'no';
      if (userSays === expected) handleSuccess();
      else handleFail();
  };

  const initGame = () => setPhase('setup');
  const startGame = () => { setPhase('playing'); generateQuestion(); };

  const generateQuestion = () => {
      setFeedback(null);
      setAnimState('hidden');
      if(recognitionRef.current) recognitionRef.current.abort(); 
      
      const target = ITEMS[Math.floor(Math.random() * ITEMS.length)];
      setTargetItem(target);

      const shouldMatch = Math.random() > 0.5;
      setIsMatch(shouldMatch);

      let compare = shouldMatch ? target : ITEMS.filter(i => i.id !== target.id)[Math.floor(Math.random() * (ITEMS.length - 1))] || target;
      setCompareItem(compare);

      setTimeout(() => {
          setAnimState('sliding');
          setTimeout(() => {
              setAnimState('visible');
              askQuestion();
          }, 1000);
      }, 500);
  };

  const askQuestion = () => {
      try {
          const utterance = new SpeechSynthesisUtterance("Doğru eşledim mi?");
          utterance.lang = 'tr-TR';
          utterance.rate = 1.0;
          window.speechSynthesis.speak(utterance);

          utterance.onend = () => {
              setTimeout(() => startListening(), 600); 
          };
      } catch (e) {
          startListening();
      }
  };

  const startListening = () => {
      setLastHeard("");
      try { recognitionRef.current?.start(); } catch(e) {}
  };

  const stopListening = () => {
      try { recognitionRef.current?.abort(); } catch(e) {}
  };

  const handleSuccess = () => {
      try {
          const audio = new Audio(Math.random() > 0.5 ? aferin1 : bravo);
          audio.play().catch(()=>{});
      } catch (e) {}

      setFeedback('correct');
      setTimeout(() => {
          const nextQ = questionCount + 1;
          setQuestionCount(nextQ);
          if (nextQ < 10) generateQuestion();
          else { setPhase('success'); confetti(); }
      }, 2500);
  };

  const handleFail = () => {
      try {
          const audio = new Audio(tekrardene1);
          audio.play().catch(()=>{});
      } catch (e) {}

      setFeedback('wrong');
      setTimeout(() => {
          setFeedback(null);
          startListening(); 
      }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col font-sans select-none overflow-hidden touch-none overscroll-none text-slate-800 min-h-screen">
      
      {/* 0. AŞAMA: GÜVENLİ BAŞLANGIÇ */}
      {phase === 'init' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                  <Mic size={48} className="text-blue-600" />
              </div>
              <h1 className="text-2xl font-black mb-4">Hazır mısın?</h1>
              <p className="text-slate-500 mb-8 max-w-xs mx-auto">
                  Oyuna başlamak için tıkla.
              </p>
              <button onClick={initGame} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold text-xl shadow-xl active:scale-95 transition-all">
                  BAŞLA
              </button>
          </div>
      )}

      {/* 1. AŞAMA: SES KALİBRASYONU */}
      {phase === 'setup' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 max-w-2xl mx-auto w-full overflow-y-auto">
              <div className="text-center">
                  <h1 className="text-2xl font-black mb-1">Ses Kalibrasyonu</h1>
                  <p className="text-slate-500 text-sm">Çocuğun "Evet/Hayır" seslerini tanıtın</p>
              </div>

              {/* EVET */}
              <div className="w-full bg-white p-4 rounded-2xl border-2 border-green-100 shadow-sm">
                  <h3 className="font-bold text-green-600 mb-2 flex items-center gap-2"><Check size={18}/> EVET</h3>
                  <div className="flex gap-2">
                      <button 
                        onClick={() => {
                            if(isRecordingSetup === 'yes') { stopListening(); setIsRecordingSetup(null); }
                            else { setIsRecordingSetup('yes'); startListening(); }
                        }}
                        className={twMerge("flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all", isRecordingSetup === 'yes' ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 border")}
                      >
                          {isRecordingSetup === 'yes' ? <MicOff size={18}/> : <Mic size={18}/>}
                          {isRecordingSetup === 'yes' ? "Dur" : "Söylet"}
                      </button>
                      <button onClick={() => { setCustomYesWords([...customYesWords, lastHeard]); setLastHeard(""); }} disabled={!lastHeard} className="px-4 bg-green-500 text-white rounded-xl font-bold disabled:opacity-30">Ekle</button>
                  </div>
                  <p className="text-[10px] mt-2 text-slate-400">Algılanan: <span className="text-blue-600 font-bold text-sm">"{lastHeard}"</span></p>
                  <div className="flex flex-wrap gap-1 mt-2">
                      {customYesWords.map((w, i) => <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full">{w}</span>)}
                  </div>
              </div>

              {/* HAYIR */}
              <div className="w-full bg-white p-4 rounded-2xl border-2 border-red-100 shadow-sm">
                  <h3 className="font-bold text-red-600 mb-2 flex items-center gap-2"><XCircle size={18}/> HAYIR</h3>
                  <div className="flex gap-2">
                      <button 
                        onClick={() => {
                            if(isRecordingSetup === 'no') { stopListening(); setIsRecordingSetup(null); }
                            else { setIsRecordingSetup('no'); startListening(); }
                        }}
                        className={twMerge("flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all", isRecordingSetup === 'no' ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 border")}
                      >
                          {isRecordingSetup === 'no' ? <MicOff size={18}/> : <Mic size={18}/>}
                          {isRecordingSetup === 'no' ? "Dur" : "Söylet"}
                      </button>
                      <button onClick={() => { setCustomNoWords([...customNoWords, lastHeard]); setLastHeard(""); }} disabled={!lastHeard} className="px-4 bg-red-500 text-white rounded-xl font-bold disabled:opacity-30">Ekle</button>
                  </div>
                  <p className="text-[10px] mt-2 text-slate-400">Algılanan: <span className="text-blue-600 font-bold text-sm">"{lastHeard}"</span></p>
                  <div className="flex flex-wrap gap-1 mt-2">
                      {customNoWords.map((w, i) => <span key={i} className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] rounded-full">{w}</span>)}
                  </div>
              </div>

              <button onClick={startGame} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 mt-4">
                  OYUNA GEÇ <Play fill="currentColor" size={20}/>
              </button>
          </div>
      )}

      {/* --- PHASE 2: OYUN --- */}
      {phase === 'playing' && (
          <div className="flex-1 flex flex-col relative bg-slate-50">
              <div className="p-4 flex justify-between items-center z-20">
                  <button onClick={onClose} className="p-2 bg-white border rounded-full shadow-sm"><XCircle className="text-slate-300"/></button>
                  <div className="px-4 py-1 bg-white shadow-sm rounded-full font-bold text-xs border">
                      SORU: {questionCount + 1} / 10
                  </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center gap-8 p-4">
                  
                  {/* GÖRSEL ALANI */}
                  <div className="flex items-center gap-4 sm:gap-12 w-full justify-center h-56">
                      <div className="w-32 h-32 sm:w-48 sm:h-48 bg-white border-4 border-slate-200 rounded-[2rem] p-4 shadow-xl flex items-center justify-center relative">
                          <img src={targetItem.src} className="w-full h-full object-contain" alt={targetItem.label} />
                      </div>
                      
                      <motion.div 
                        initial={{ x: 200, opacity: 0 }}
                        animate={animState !== 'hidden' ? { x: 0, opacity: 1 } : { x: 200, opacity: 0 }}
                        className={twMerge(
                            "w-32 h-32 sm:w-48 sm:h-48 bg-white border-4 rounded-[2rem] p-4 shadow-xl flex items-center justify-center transition-colors duration-500",
                            feedback === 'correct' ? "border-green-500 bg-green-50" : 
                            feedback === 'wrong' ? "border-red-500 bg-red-50" : "border-slate-200"
                        )}
                      >
                          <img src={compareItem.src} className="w-full h-full object-contain" alt={compareItem.label} />
                      </motion.div>
                  </div>

                  {/* DURUM / MİKROFON */}
                  <div className="flex flex-col items-center gap-3 h-24 justify-center w-full">
                      {isListening ? (
                          <div className="flex flex-col items-center gap-2">
                              <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-200 animate-bounce">
                                  <Mic size={32} />
                              </div>
                              <span className="text-blue-600 font-black text-xs tracking-tighter animate-pulse">DİNLİYORUM...</span>
                              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold h-6">{lastHeard}</span>
                          </div>
                      ) : feedback ? (
                          <div className={twMerge("text-4xl font-black animate-in zoom-in", feedback === 'correct' ? "text-green-500" : "text-red-500")}>
                              {feedback === 'correct' ? "DOĞRU!" : "YANLIŞ"}
                          </div>
                      ) : (
                          <div className="flex flex-col items-center text-slate-400">
                             <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-2"></div>
                             <span className="text-xs font-bold">Hazırlanıyor...</span>
                          </div>
                      )}
                  </div>
              </div>

              {/* GİZLİ BUTONLAR */}
              <div className="absolute bottom-6 left-6 opacity-20 hover:opacity-100 transition-opacity z-30">
                  <button onClick={() => checkAnswer('no')} className="w-14 h-14 bg-red-100 text-red-600 border-2 border-red-200 rounded-2xl flex items-center justify-center font-bold text-[10px]">HAYIR</button>
              </div>
              <div className="absolute bottom-6 right-6 opacity-20 hover:opacity-100 transition-opacity z-30">
                  <button onClick={() => checkAnswer('yes')} className="w-14 h-14 bg-green-100 text-green-600 border-2 border-green-200 rounded-2xl flex items-center justify-center font-bold text-[10px]">EVET</button>
              </div>
          </div>
      )}

      {/* --- PHASE 3: SONUÇ --- */}
      {phase === 'success' && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center text-center p-8">
           <Trophy size={100} className="text-yellow-500 mb-6 animate-bounce" />
           <h1 className="text-3xl font-black mb-2 uppercase text-slate-800">Tebrikler!</h1>
           <p className="text-slate-500 mb-8 font-medium">Bütün soruları tamamladın.</p>
           <button onClick={() => onComplete(true)} className="bg-green-600 text-white px-12 py-5 rounded-2xl font-bold text-xl shadow-xl active:scale-95 transition-transform">
             KAYDET VE ÇIK
           </button>
        </div>
      )}
    </div>
  );
}
