import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, XCircle, Trophy, Mic, MicOff, Play, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { twMerge } from 'tailwind-merge';

// --- RESİMLER ---
import anahtarImg from '../esle/anahtar.png';
import arabaImg from '../esle/araba.png';
import kalemImg from '../esle/kalem.png';
import topImg from '../esle/top.png';

// --- SES DOSYALARI ---
import aferin1 from '../esle/ses/aferin1.mp3';
import bravo from '../esle/ses/bravo.mp3';
import tekrardene1 from '../esle/ses/tekrardene1.mp3';

const ITEMS = [
  { id: 'anahtar', src: anahtarImg },
  { id: 'araba', src: arabaImg },
  { id: 'kalem', src: kalemImg },
  { id: 'top', src: topImg },
];

const STANDARD_YES = ['evet', 'eved', 'he', 'hıhı', 'doğru', 'tamam', 'evetevet'];
const STANDARD_NO = ['hayır', 'yok', 'cık', 'değil', 'olmaz', 'hayı'];

export default function IfadeEdiciGame15({ mode, onClose, onComplete }: any) {
  const [phase, setPhase] = useState<'setup' | 'playing' | 'success'>('setup');
  const [customYesWords, setCustomYesWords] = useState<string[]>([]);
  const [customNoWords, setCustomNoWords] = useState<string[]>([]);
  const [lastHeard, setLastHeard] = useState<string>("");
  const [isRecordingSetup, setIsRecordingSetup] = useState<'yes' | 'no' | null>(null);

  const [targetItem, setTargetItem] = useState(ITEMS[0]);
  const [compareItem, setCompareItem] = useState(ITEMS[0]);
  const [isMatch, setIsMatch] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [animState, setAnimState] = useState<'hidden' | 'sliding' | 'visible'>('hidden');
  
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const recognitionRef = useRef<any>(null);

  // --- SES TANIMA BAŞLATMA ---
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true; // Ara sonuçları yakala (Daha hassas)
      recognition.lang = 'tr-TR';

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        const lowerTranscript = transcript.trim().toLowerCase();
        setLastHeard(lowerTranscript);
        
        if (phase === 'playing' && isListening) {
           handleGameSpeech(lowerTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === 'not-allowed') {
          alert("Lütfen mikrofon izni verin.");
        }
      };

      recognition.onend = () => {
        if (isListening && phase === 'playing') {
            try { recognition.start(); } catch(e) {}
        }
      };

      recognitionRef.current = recognition;
    }
    
    return () => {
      stopListening();
    };
  }, [phase, isListening]);

  const handleGameSpeech = (transcript: string) => {
     const words = transcript.split(" ");
     const YES_POOL = [...STANDARD_YES, ...customYesWords];
     const NO_POOL = [...STANDARD_NO, ...customNoWords];

     let detectedAnswer: 'yes' | 'no' | null = null;
     for (const word of words) {
         if (YES_POOL.some(w => word.includes(w) || w.includes(word))) detectedAnswer = 'yes';
         if (NO_POOL.some(w => word.includes(w) || w.includes(word))) detectedAnswer = 'no';
     }

     if (detectedAnswer) {
         checkAnswer(detectedAnswer);
     }
  };

  const checkAnswer = (userSays: 'yes' | 'no') => {
      stopListening();
      const expected = isMatch ? 'yes' : 'no';
      if (userSays === expected) handleSuccess();
      else handleFail();
  };

  const startGame = () => {
      setPhase('playing');
      generateQuestion();
  };

  const generateQuestion = () => {
      setFeedback(null);
      setAnimState('hidden');
      stopListening();
      
      const target = ITEMS[Math.floor(Math.random() * ITEMS.length)];
      setTargetItem(target);

      const shouldMatch = Math.random() > 0.5;
      setIsMatch(shouldMatch);

      let compare = shouldMatch ? target : ITEMS.filter(i => i.id !== target.id)[Math.floor(Math.random() * (ITEMS.length - 1))];
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
      const utterance = new SpeechSynthesisUtterance("Doğru eşledim mi?");
      utterance.lang = 'tr-TR';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);

      utterance.onend = () => {
          // Konuşma bittikten 500ms sonra dinlemeye başla (Çakışma önleyici)
          setTimeout(() => startListening(), 500);
      };
  };

  const startListening = () => {
      setIsListening(true);
      setLastHeard("");
      try { recognitionRef.current?.start(); } catch(e) {}
  };

  const stopListening = () => {
      setIsListening(false);
      try { recognitionRef.current?.stop(); } catch(e) {}
  };

  const handleSuccess = () => {
      const audio = new Audio(Math.random() > 0.5 ? aferin1 : bravo);
      audio.play();
      setFeedback('correct');
      setScore(prev => prev + 1);
      setTimeout(() => {
          const nextQ = questionCount + 1;
          setQuestionCount(nextQ);
          if (nextQ < 10) generateQuestion();
          else { setPhase('success'); confetti(); }
      }, 2000);
  };

  const handleFail = () => {
      const audio = new Audio(tekrardene1);
      audio.play();
      setFeedback('wrong');
      setTimeout(() => {
          setFeedback(null);
          startListening();
      }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col font-sans select-none overflow-hidden touch-none overscroll-none text-slate-800">
      
      {phase === 'setup' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 max-w-2xl mx-auto w-full overflow-y-auto">
              <div className="text-center">
                  <h1 className="text-2xl font-black mb-1">Ses Kalibrasyonu</h1>
                  <p className="text-slate-500 text-sm">Çocuğun seslerini tanıtın</p>
              </div>

              {/* EVET */}
              <div className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-green-100">
                  <h3 className="font-bold text-green-600 mb-2 flex items-center gap-2"><Check size={18}/> EVET</h3>
                  <div className="flex gap-2">
                      <button 
                        onClick={() => {
                            if(isRecordingSetup === 'yes') { stopListening(); setIsRecordingSetup(null); }
                            else { setIsRecordingSetup('yes'); startListening(); }
                        }}
                        className={twMerge("flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2", isRecordingSetup === 'yes' ? "bg-red-500 text-white animate-pulse" : "bg-white border shadow-sm")}
                      >
                          {isRecordingSetup === 'yes' ? <MicOff size={18}/> : <Mic size={18}/>}
                          {isRecordingSetup === 'yes' ? "Dur" : "Söylet"}
                      </button>
                      <button onClick={() => { setCustomYesWords([...customYesWords, lastHeard]); setLastHeard(""); }} disabled={!lastHeard} className="px-4 bg-green-500 text-white rounded-xl font-bold disabled:opacity-30">Ekle</button>
                  </div>
                  <p className="text-[10px] mt-1 text-slate-400">Duyulan: <span className="text-blue-600 font-bold">{lastHeard}</span></p>
                  <div className="flex flex-wrap gap-1 mt-2">
                      {customYesWords.map((w, i) => <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full">{w}</span>)}
                  </div>
              </div>

              {/* HAYIR */}
              <div className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-red-100">
                  <h3 className="font-bold text-red-600 mb-2 flex items-center gap-2"><XCircle size={18}/> HAYIR</h3>
                  <div className="flex gap-2">
                      <button 
                        onClick={() => {
                            if(isRecordingSetup === 'no') { stopListening(); setIsRecordingSetup(null); }
                            else { setIsRecordingSetup('no'); startListening(); }
                        }}
                        className={twMerge("flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2", isRecordingSetup === 'no' ? "bg-red-500 text-white animate-pulse" : "bg-white border shadow-sm")}
                      >
                          {isRecordingSetup === 'no' ? <MicOff size={18}/> : <Mic size={18}/>}
                          {isRecordingSetup === 'no' ? "Dur" : "Söylet"}
                      </button>
                      <button onClick={() => { setCustomNoWords([...customNoWords, lastHeard]); setLastHeard(""); }} disabled={!lastHeard} className="px-4 bg-red-500 text-white rounded-xl font-bold disabled:opacity-30">Ekle</button>
                  </div>
                  <p className="text-[10px] mt-1 text-slate-400">Duyulan: <span className="text-blue-600 font-bold">{lastHeard}</span></p>
                  <div className="flex flex-wrap gap-1 mt-2">
                      {customNoWords.map((w, i) => <span key={i} className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] rounded-full">{w}</span>)}
                  </div>
              </div>

              <button onClick={startGame} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 mt-4">
                  BAŞLA <ChevronRight/>
              </button>
          </div>
      )}

      {phase === 'playing' && (
          <div className="flex-1 flex flex-col relative bg-slate-50">
              <div className="p-4 flex justify-between items-center z-20">
                  <button onClick={onClose} className="p-2 bg-white border rounded-full shadow-sm"><XCircle className="text-slate-300"/></button>
                  <div className="px-4 py-1 bg-white shadow-sm rounded-full font-bold text-xs border">
                      SORU: {questionCount + 1} / 10
                  </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center gap-12 p-4">
                  <div className="flex items-center gap-4 sm:gap-16">
                      <div className="w-32 h-32 sm:w-56 sm:h-56 bg-white border-4 border-slate-100 rounded-[2.5rem] p-6 shadow-xl">
                          <img src={targetItem.src} className="w-full h-full object-contain" />
                      </div>
                      <motion.div 
                        initial={{ x: 200, opacity: 0 }}
                        animate={animState !== 'hidden' ? { x: 0, opacity: 1 } : { x: 200, opacity: 0 }}
                        className={twMerge(
                            "w-32 h-32 sm:w-56 sm:h-56 bg-white border-4 rounded-[2.5rem] p-6 shadow-xl transition-colors duration-500",
                            feedback === 'correct' ? "border-green-500 bg-green-50" : 
                            feedback === 'wrong' ? "border-red-500 bg-red-50" : "border-slate-100"
                        )}
                      >
                          <img src={compareItem.src} className="w-full h-full object-contain" />
                      </motion.div>
                  </div>

                  <div className="flex flex-col items-center gap-3">
                      {isListening ? (
                          <div className="flex flex-col items-center gap-2">
                              <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-200 animate-bounce">
                                  <Mic size={32} />
                              </div>
                              <span className="text-blue-600 font-black text-xs tracking-tighter animate-pulse">SENİ DİNLİYORUM...</span>
                              {lastHeard && <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold">"{lastHeard}"</span>}
                          </div>
                      ) : feedback ? (
                          <div className={twMerge("text-4xl font-black", feedback === 'correct' ? "text-green-500" : "text-red-500")}>
                              {feedback === 'correct' ? "HARİKA!" : "TEKRAR DENE"}
                          </div>
                      ) : (
                          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      )}
                  </div>
              </div>

              {/* GİZLİ BUTONLAR */}
              <div className="absolute bottom-6 left-6 opacity-10 hover:opacity-100 flex flex-col gap-2">
                  <button onClick={() => checkAnswer('no')} className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-[10px]">HAYIR</button>
              </div>
              <div className="absolute bottom-6 right-6 opacity-10 hover:opacity-100 flex flex-col gap-2">
                  <button onClick={() => checkAnswer('yes')} className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-[10px]">EVET</button>
              </div>
          </div>
      )}

      {phase === 'success' && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center text-center p-8">
           <Trophy size={100} className="text-yellow-500 mb-6" />
           <h1 className="text-3xl font-black mb-2 uppercase">Bitti!</h1>
           <p className="text-slate-500 mb-8 font-medium">Başarıyla tamamladınız.</p>
           <button onClick={() => onComplete(true)} className="bg-green-600 text-white px-12 py-5 rounded-2xl font-bold text-xl shadow-xl">
             KAYDET VE ÇIK
           </button>
        </div>
      )}
    </div>
  );
}
