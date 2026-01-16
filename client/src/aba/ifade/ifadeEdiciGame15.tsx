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

// Standart kelime havuzu
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
  
  const [isListening, setIsListening] = useState(false);
  const [animState, setAnimState] = useState<'hidden' | 'sliding' | 'visible'>('hidden');
  
  const [questionCount, setQuestionCount] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // REFERANSLAR (Kritik: State yerine Ref kullanıyoruz ki anlık değişsin)
  const recognitionRef = useRef<any>(null);
  const isMountedRef = useRef(true); // Sayfa açık mı kontrolü

  // --- SAYFA GİRİŞ/ÇIKIŞ KONTROLÜ (ZOMBİ MİKROFON ENGELLEYİCİ) ---
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
        // SAYFADAN ÇIKILDIĞINDA ÇALIŞIR
        isMountedRef.current = false;
        if (recognitionRef.current) {
            recognitionRef.current.onend = null; // Döngüyü kır
            recognitionRef.current.abort(); // Mikrofonu öldür
            recognitionRef.current = null;
        }
        window.speechSynthesis.cancel(); // Konuşmayı sustur
    };
  }, []);

  // --- SES MOTORU ---
  const initSpeechEngine = (mode: 'setup' | 'game') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.interimResults = true; // Anlık sonuç
    recognition.maxAlternatives = 1;
    
    // Android için en stabil ayar: Setup'ta sürekli, Oyunda tekli
    recognition.continuous = mode === 'setup'; 

    recognition.onstart = () => {
        if (isMountedRef.current) setIsListening(true);
    };

    recognition.onresult = (event: any) => {
        if (!isMountedRef.current) return;

        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
        }
        const lowerTranscript = transcript.trim().toLowerCase();
        
        // Sadece ekrana yaz, hemen işlem yapma (Debounce mantığı)
        setLastHeard(lowerTranscript);

        if (mode === 'game') {
            checkTranscriptForGame(lowerTranscript, recognition);
        }
    };

    recognition.onerror = (event: any) => {
        console.log("Mic Error:", event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setIsListening(false);
        }
    };

    recognition.onend = () => {
        if (!isMountedRef.current) return;
        setIsListening(false);

        // OYUN MODUNDA DÖNGÜ:
        // Eğer oyun devam ediyorsa, cevap verilmediyse ve sayfa hala açıksa TEKRAR BAŞLAT
        if (mode === 'game' && phase === 'playing' && !feedback && isMountedRef.current) {
            // Hemen başlama, 1 saniye nefes al (Click-Click sesini azaltır)
            setTimeout(() => {
                if (isMountedRef.current && phase === 'playing' && !feedback) {
                     try { recognition.start(); } catch(e) {}
                }
            }, 1000);
        }
    };

    return recognition;
  };

  // --- OYUN İÇİ KELİME KONTROLÜ ---
  const checkTranscriptForGame = (transcript: string, recognitionInstance: any) => {
      const words = transcript.split(" ");
      const YES_POOL = [...STANDARD_YES, ...customYesWords];
      const NO_POOL = [...STANDARD_NO, ...customNoWords];

      let detected: 'yes' | 'no' | null = null;

      for (const word of words) {
          if (YES_POOL.some(w => word === w || word.includes(w))) detected = 'yes';
          else if (NO_POOL.some(w => word === w || word.includes(w))) detected = 'no';
      }

      if (detected) {
          // Kelimeyi bulduk! Ama hemen atlama.
          // Motoru durdur ve cevabı işle.
          if(recognitionInstance) recognitionInstance.abort();
          checkAnswer(detected);
      }
  };

  const checkAnswer = (userSays: 'yes' | 'no') => {
      if (feedback) return; // Zaten cevap verildiyse çık

      const expected = isMatch ? 'yes' : 'no';
      if (userSays === expected) handleSuccess();
      else handleFail();
  };

  // --- OYUN AKIŞI ---
  const initGame = () => setPhase('setup');
  
  const startGame = () => { 
      setPhase('playing');
      // Setup motorunu temizle
      if(recognitionRef.current) {
          recognitionRef.current.abort();
          recognitionRef.current = null;
      }
      generateQuestion(); 
  };

  const generateQuestion = () => {
      setFeedback(null);
      setAnimState('hidden');
      
      // Mikrofonu sustur (Soru sorarken dinlemesin)
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
      // TTS
      window.speechSynthesis.cancel(); // Öncekini sustur
      const utterance = new SpeechSynthesisUtterance("Doğru eşledim mi?");
      utterance.lang = 'tr-TR';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);

      utterance.onend = () => {
          if (isMountedRef.current) {
              setTimeout(() => startListeningForGame(), 500);
          }
      };
  };

  const startListeningForGame = () => {
      if (!isMountedRef.current) return;
      
      // Eğer motor yoksa oluştur
      if (!recognitionRef.current) {
          recognitionRef.current = initSpeechEngine('game');
      }

      setLastHeard("");
      try { recognitionRef.current?.start(); } catch(e) {}
  };

  // SETUP İÇİN DİNLEME
  const toggleSetupRecord = (type: 'yes' | 'no') => {
      if (isRecordingSetup === type) {
          // Durdur
          setIsRecordingSetup(null);
          if (recognitionRef.current) recognitionRef.current.abort();
      } else {
          // Başlat
          setIsRecordingSetup(type);
          if (recognitionRef.current) recognitionRef.current.abort(); // Öncekini kapat
          
          recognitionRef.current = initSpeechEngine('setup');
          setTimeout(() => {
              try { recognitionRef.current?.start(); } catch(e) {}
          }, 200);
      }
  };

  const handleSuccess = () => {
      try {
          const audio = new Audio(Math.random() > 0.5 ? aferin1 : bravo);
          audio.play().catch(()=>{});
      } catch (e) {}

      setFeedback('correct');
      // Sonraki soruya geç
      setTimeout(() => {
          if (!isMountedRef.current) return;
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
          if (!isMountedRef.current) return;
          setFeedback(null);
          startListeningForGame(); // Tekrar dinle
      }, 2000);
  };

  // --- UI RENDER ---
  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col font-sans select-none overflow-hidden touch-none overscroll-none text-slate-800 min-h-screen">
      
      {/* 0. AŞAMA: GİRİŞ */}
      {phase === 'init' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                  <Mic size={48} className="text-blue-600" />
              </div>
              <h1 className="text-2xl font-black mb-4">Hazır mısın?</h1>
              <button onClick={initGame} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold text-xl shadow-xl active:scale-95">
                  BAŞLA
              </button>
          </div>
      )}

      {/* 1. AŞAMA: SETUP */}
      {phase === 'setup' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 max-w-2xl mx-auto w-full overflow-y-auto">
              <h1 className="text-2xl font-black">Ses Kalibrasyonu</h1>

              {/* EVET */}
              <div className="w-full bg-white p-4 rounded-2xl border-2 border-green-100">
                  <h3 className="font-bold text-green-600 mb-2 flex items-center gap-2"><Check size={18}/> EVET</h3>
                  <div className="flex gap-2">
                      <button 
                        onClick={() => toggleSetupRecord('yes')}
                        className={twMerge("flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2", isRecordingSetup === 'yes' ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 border")}
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
              <div className="w-full bg-white p-4 rounded-2xl border-2 border-red-100">
                  <h3 className="font-bold text-red-600 mb-2 flex items-center gap-2"><XCircle size={18}/> HAYIR</h3>
                  <div className="flex gap-2">
                      <button 
                        onClick={() => toggleSetupRecord('no')}
                        className={twMerge("flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2", isRecordingSetup === 'no' ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 border")}
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

              <button onClick={startGame} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-lg mt-4">
                  OYUNA GEÇ <Play fill="currentColor" size={20} className="inline ml-2"/>
              </button>
          </div>
      )}

      {/* 2. AŞAMA: OYUN */}
      {phase === 'playing' && (
          <div className="flex-1 flex flex-col relative bg-slate-50">
              <div className="p-4 flex justify-between items-center z-20">
                  <button onClick={onClose} className="p-2 bg-white border rounded-full"><XCircle className="text-slate-300"/></button>
                  <div className="px-4 py-1 bg-white shadow-sm rounded-full font-bold text-xs border">SORU: {questionCount + 1} / 10</div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center gap-8 p-4">
                  <div className="flex items-center gap-4 sm:gap-12 w-full justify-center h-56">
                      <div className="w-32 h-32 bg-white border-4 border-slate-200 rounded-[2rem] p-4 flex items-center justify-center relative">
                          <img src={targetItem.src} className="w-full h-full object-contain" />
                      </div>
                      
                      <motion.div 
                        initial={{ x: 200, opacity: 0 }}
                        animate={animState !== 'hidden' ? { x: 0, opacity: 1 } : { x: 200, opacity: 0 }}
                        className={twMerge(
                            "w-32 h-32 bg-white border-4 rounded-[2rem] p-4 flex items-center justify-center transition-colors duration-500",
                            feedback === 'correct' ? "border-green-500 bg-green-50" : 
                            feedback === 'wrong' ? "border-red-500 bg-red-50" : "border-slate-200"
                        )}
                      >
                          <img src={compareItem.src} className="w-full h-full object-contain" />
                      </motion.div>
                  </div>

                  <div className="flex flex-col items-center gap-3 h-24 justify-center w-full">
                      {isListening ? (
                          <div className="flex flex-col items-center gap-2">
                              <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                  <Mic size={32} />
                              </div>
                              <span className="text-blue-600 font-black text-xs animate-pulse">DİNLİYORUM...</span>
                              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold h-6">{lastHeard}</span>
                          </div>
                      ) : feedback ? (
                          <div className={twMerge("text-4xl font-black", feedback === 'correct' ? "text-green-500" : "text-red-500")}>
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
              <div className="absolute bottom-6 left-6 opacity-20 hover:opacity-100 z-30">
                  <button onClick={() => checkAnswer('no')} className="w-14 h-14 bg-red-100 text-red-600 border-2 border-red-200 rounded-2xl flex items-center justify-center font-bold text-[10px]">HAYIR</button>
              </div>
              <div className="absolute bottom-6 right-6 opacity-20 hover:opacity-100 z-30">
                  <button onClick={() => checkAnswer('yes')} className="w-14 h-14 bg-green-100 text-green-600 border-2 border-green-200 rounded-2xl flex items-center justify-center font-bold text-[10px]">EVET</button>
              </div>
          </div>
      )}

      {/* 3. AŞAMA: SONUÇ */}
      {phase === 'success' && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center text-center p-8">
           <Trophy size={100} className="text-yellow-500 mb-6" />
           <h1 className="text-3xl font-black mb-2 uppercase text-slate-800">Tebrikler!</h1>
           <button onClick={() => onComplete(true)} className="bg-green-600 text-white px-12 py-5 rounded-2xl font-bold text-xl shadow-xl">
             KAYDET VE ÇIK
           </button>
        </div>
      )}
    </div>
  );
}
