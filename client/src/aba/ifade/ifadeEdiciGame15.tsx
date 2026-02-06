import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, XCircle, Trophy, Mic, MicOff, Play, Volume2, ArrowRight } from 'lucide-react';
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

const STANDARD_YES = ['evet', 'eved', 'he', 'hıhı', 'doğru', 'tamam', 'evetevet', 'olur', 'aynen', 'yes'];
const STANDARD_NO = ['hayır', 'yok', 'cık', 'değil', 'olmaz', 'hayı', 'yanlış', 'no'];

export default function IfadeEdiciGame15({ onClose, onComplete }: any) {
  const [phase, setPhase] = useState<'init' | 'setup' | 'playing' | 'success'>('init');
  
  // State'ler (Setup Ekranı İçin)
  const [customYesWords, setCustomYesWords] = useState<string[]>([]);
  const [customNoWords, setCustomNoWords] = useState<string[]>([]);
  
  // 🔥 REF'LER (OYUN EKRANI İÇİN - DONMAYI ÖNLER) 🔥
  // Ses motoru state'i anlık okuyamaz, bu yüzden Ref kullanıyoruz.
  const yesWordsRef = useRef<string[]>([]);
  const noWordsRef = useRef<string[]>([]);

  const [lastHeard, setLastHeard] = useState<string>("");
  const [isRecordingSetup, setIsRecordingSetup] = useState<'yes' | 'no' | null>(null);

  const [targetItem, setTargetItem] = useState(ITEMS[0]);
  const [compareItem, setCompareItem] = useState(ITEMS[0]);
  const [isMatch, setIsMatch] = useState(true);
  
  const [isListening, setIsListening] = useState(false);
  const [animState, setAnimState] = useState<'hidden' | 'sliding' | 'visible'>('hidden');
  
  const [questionCount, setQuestionCount] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // REFERANSLAR
  const recognitionRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  // --- STATE GÜNCELLEYİNCE REF'İ DE GÜNCELLE ---
  useEffect(() => { yesWordsRef.current = customYesWords; }, [customYesWords]);
  useEffect(() => { noWordsRef.current = customNoWords; }, [customNoWords]);

  // --- 1. GÜVENLİ BAŞLATMA VE KAPATMA ---
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
        isMountedRef.current = false;
        killEverything();
    };
  }, []);

  const killEverything = () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) {
          try {
            recognitionRef.current.onend = null;
            recognitionRef.current.onresult = null;
            recognitionRef.current.stop(); 
          } catch(e) {}
          recognitionRef.current = null;
      }
      setIsListening(false);
  };

  const handleSafeClose = () => {
      killEverything();
      onClose(); 
  };

  // --- SES MOTORU BAŞLATICI ---
  const initSpeechEngine = (continuousMode: boolean) => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return null;

      const recognition = new SpeechRecognition();
      recognition.lang = 'tr-TR';
      recognition.interimResults = true; 
      recognition.maxAlternatives = 1;
      recognition.continuous = continuousMode; // Setup'ta false olabilir ama oyunda true olmalı

      recognition.onstart = () => {
          if (isMountedRef.current) setIsListening(true);
      };

      recognition.onend = () => {
          if (!isMountedRef.current) return;
          setIsListening(false);
          
          // OYUN MODUNDA OTOMATİK TEKRAR BAŞLATMA
          // Sürekli dinlemesi için burası kritik
          if (phase === 'playing' && !feedback) {
              // Motor kapandıysa hemen geri aç
              setTimeout(() => {
                  if (isMountedRef.current && phase === 'playing' && !feedback) {
                       startListening(); 
                  }
              }, 200);
          }
      };

      recognition.onerror = (event: any) => {
          if (isMountedRef.current) setIsListening(false);
      };

      recognition.onresult = (event: any) => {
          if (!isMountedRef.current) return;

          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
              transcript += event.results[i][0].transcript;
          }
          const lower = transcript.trim().toLowerCase();
          setLastHeard(lower);

          // OYUN MODU KONTROLÜ
          if (phase === 'playing') {
              checkTranscriptForGame(lower, recognition);
          }
      };

      return recognition;
  };

  // --- OYUN KELİME KONTROLÜ (REF KULLANARAK) ---
  const checkTranscriptForGame = (transcript: string, recognitionInstance: any) => {
      const words = transcript.split(" ");
      
      // 🔥 BURASI DEĞİŞTİ: State yerine Ref kullandık ki güncel listeyi görsün
      const YES_POOL = [...STANDARD_YES, ...yesWordsRef.current];
      const NO_POOL = [...STANDARD_NO, ...noWordsRef.current];

      let detected: 'yes' | 'no' | null = null;
      for (const word of words) {
          if (YES_POOL.some(w => word === w || word.includes(w))) detected = 'yes';
          else if (NO_POOL.some(w => word === w || word.includes(w))) detected = 'no';
      }

      if (detected) {
          // Cevabı bulduk, motoru hemen durdur
          recognitionInstance.abort();
          checkAnswer(detected);
      }
  };

  const checkAnswer = (userSays: 'yes' | 'no') => {
      if (feedback) return; 

      const expected = isMatch ? 'yes' : 'no';
      if (userSays === expected) handleSuccess();
      else handleFail();
  };

  // Oyun modu için dinlemeyi başlat (Continuous: true yaptık)
  const startListening = () => {
      if (!isMountedRef.current) return;
      
      if (recognitionRef.current) {
         try { recognitionRef.current.abort(); } catch(e){}
      }

      // Oyunda sürekli dinlesin ki kapanmasın
      recognitionRef.current = initSpeechEngine(true); 
      
      try {
          recognitionRef.current.start();
      } catch (e) {}
  };

  // --- AKIŞ KONTROLLERİ ---
  const initGame = () => setPhase('setup');
  
  const startGame = () => {
      // 1. Önce her şeyi temizle (Setup mikrofonunu kapat)
      killEverything();
      setPhase('playing');
      
      // 2. DONMAYI ÖNLEMEK İÇİN GECİKME
      // React ekranı çizmeden ağır işleme girmesin
      setTimeout(() => {
          generateQuestion();
      }, 100);
  };

  const generateQuestion = () => {
      setFeedback(null);
      setAnimState('hidden');
      setLastHeard(""); // Ekranı temizle
      killEverything(); 
      
      const target = ITEMS[Math.floor(Math.random() * ITEMS.length)];
      setTargetItem(target);

      const shouldMatch = Math.random() > 0.5;
      setIsMatch(shouldMatch);

      let compare = shouldMatch ? target : ITEMS.filter(i => i.id !== target.id)[Math.floor(Math.random() * (ITEMS.length - 1))] || target;
      setCompareItem(compare);

      setTimeout(() => {
          if(!isMountedRef.current) return;
          setAnimState('sliding');
          setTimeout(() => {
              if(!isMountedRef.current) return;
              setAnimState('visible');
              askQuestion();
          }, 600);
      }, 300);
  };

  const askQuestion = () => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance("Doğru eşledim mi?");
      utterance.lang = 'tr-TR';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);

      utterance.onend = () => {
          if (isMountedRef.current && phase === 'playing') {
              startListening(); // Soru bitince dinlemeye başla
          }
      };
      
      // Hata olursa yine de dinlemeyi başlat (Bazı telefonlar konuşmaz)
      utterance.onerror = () => {
          if (isMountedRef.current && phase === 'playing') startListening();
      }
  };

  const handleSuccess = () => {
      try {
          const audio = new Audio(Math.random() > 0.5 ? aferin1 : bravo);
          audio.play().catch(()=>{});
      } catch (e) {}

      setFeedback('correct');
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
          startListening(); // Yanlışta tekrar dinle
      }, 2000);
  };

  // --- SETUP EKRANI KAYIT (SENİN KODUN AYNI KALDI) ---
  const toggleSetupRecord = (type: 'yes' | 'no') => {
      if (isRecordingSetup === type) {
          setIsRecordingSetup(null);
          if (recognitionRef.current) recognitionRef.current.abort();
      } else {
          setIsRecordingSetup(type);
          if (recognitionRef.current) recognitionRef.current.abort();
          
          recognitionRef.current = initSpeechEngine(true); // Setup için sürekli dinle
          setTimeout(() => {
              try { recognitionRef.current?.start(); } catch(e) {}
          }, 200);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col font-sans select-none overflow-hidden touch-none overscroll-none text-slate-800 min-h-screen">
      
      {/* 0. GİRİŞ */}
      {phase === 'init' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white animate-in zoom-in">
              <button onClick={handleSafeClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full"><XCircle className="text-slate-400"/></button>
              
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                  <Mic size={48} className="text-blue-600" />
              </div>
              <h1 className="text-2xl font-black mb-4">Hazır mısın?</h1>
              <button onClick={initGame} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold text-xl shadow-xl active:scale-95 transition-all">
                  BAŞLA
              </button>
          </div>
      )}

      {/* 1. SETUP */}
      {phase === 'setup' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 max-w-2xl mx-auto w-full overflow-y-auto relative bg-slate-50">
              <button onClick={handleSafeClose} className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm"><XCircle className="text-slate-400"/></button>
              
              <div className="text-center">
                 <h1 className="text-2xl font-black text-slate-800">Ses Kalibrasyonu</h1>
                 <p className="text-xs text-slate-500">Çocuğun söylediği kelimeyi ekle.</p>
              </div>

              {/* EVET */}
              <div className="w-full bg-white p-4 rounded-2xl border-2 border-green-100 shadow-sm">
                  <h3 className="font-bold text-green-600 mb-2 flex items-center gap-2"><Check size={18}/> EVET</h3>
                  <div className="flex gap-2">
                      <button 
                        onClick={() => toggleSetupRecord('yes')}
                        className={twMerge("flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2", isRecordingSetup === 'yes' ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 border")}
                      >
                          {isRecordingSetup === 'yes' ? <MicOff size={18}/> : <Mic size={18}/>}
                          {isRecordingSetup === 'yes' ? "Dur" : "Söyle"}
                      </button>
                      <button onClick={() => { setCustomYesWords([...customYesWords, lastHeard]); setLastHeard(""); }} disabled={!lastHeard} className="px-4 bg-green-500 text-white rounded-xl font-bold disabled:opacity-30">Ekle</button>
                  </div>
                  <p className="text-[10px] mt-2 text-slate-400 h-4">Algılanan: <span className="text-blue-600 font-bold text-sm">{lastHeard}</span></p>
                  <div className="flex flex-wrap gap-1 mt-2">
                      {customYesWords.map((w, i) => <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full">{w}</span>)}
                  </div>
              </div>

              {/* HAYIR */}
              <div className="w-full bg-white p-4 rounded-2xl border-2 border-red-100 shadow-sm">
                  <h3 className="font-bold text-red-600 mb-2 flex items-center gap-2"><XCircle size={18}/> HAYIR</h3>
                  <div className="flex gap-2">
                      <button 
                        onClick={() => toggleSetupRecord('no')}
                        className={twMerge("flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2", isRecordingSetup === 'no' ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 border")}
                      >
                          {isRecordingSetup === 'no' ? <MicOff size={18}/> : <Mic size={18}/>}
                          {isRecordingSetup === 'no' ? "Dur" : "Söyle"}
                      </button>
                      <button onClick={() => { setCustomNoWords([...customNoWords, lastHeard]); setLastHeard(""); }} disabled={!lastHeard} className="px-4 bg-red-500 text-white rounded-xl font-bold disabled:opacity-30">Ekle</button>
                  </div>
                  <p className="text-[10px] mt-2 text-slate-400 h-4">Algılanan: <span className="text-blue-600 font-bold text-sm">{lastHeard}</span></p>
                  <div className="flex flex-wrap gap-1 mt-2">
                      {customNoWords.map((w, i) => <span key={i} className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] rounded-full">{w}</span>)}
                  </div>
              </div>

              <button onClick={startGame} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-lg mt-4 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                  OYUNA GEÇ <ArrowRight/>
              </button>
          </div>
      )}

      {/* 2. OYUN */}
      {phase === 'playing' && (
          <div className="flex-1 flex flex-col relative bg-slate-50">
              <div className="p-4 flex justify-between items-center z-20">
                  <button onClick={handleSafeClose} className="p-2 bg-white border rounded-full shadow-sm"><XCircle className="text-slate-300"/></button>
                  <div className="px-4 py-1 bg-white shadow-sm rounded-full font-bold text-xs border">SORU: {questionCount + 1} / 10</div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center gap-8 p-4">
                  <div className="flex items-center gap-4 sm:gap-12 w-full justify-center h-56">
                      <div className="w-32 h-32 bg-white border-4 border-slate-200 rounded-[2rem] p-4 flex items-center justify-center relative shadow-sm">
                          <img src={targetItem.src} className="w-full h-full object-contain" />
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-100 text-blue-600 text-[10px] px-2 rounded-full border border-blue-200 font-bold">HEDEF</div>
                      </div>
                      
                      <motion.div 
                        initial={{ x: 200, opacity: 0 }}
                        animate={animState !== 'hidden' ? { x: 0, opacity: 1 } : { x: 200, opacity: 0 }}
                        className={twMerge(
                            "w-32 h-32 bg-white border-4 rounded-[2rem] p-4 flex items-center justify-center transition-colors duration-500 shadow-sm",
                            feedback === 'correct' ? "border-green-500 bg-green-50 scale-110" : 
                            feedback === 'wrong' ? "border-red-500 bg-red-50 shake" : "border-slate-200"
                        )}
                      >
                          <img src={compareItem.src} className="w-full h-full object-contain" />
                      </motion.div>
                  </div>

                  {/* SORU METNİ */}
                  <div className="bg-white px-6 py-2 rounded-full shadow-sm border border-slate-200 -mt-4">
                      <p className="font-bold text-lg text-slate-700">Bu ikisi aynı mı?</p>
                  </div>

                  {/* MİKROFON BUTONU */}
                  <div className="flex flex-col items-center gap-3 h-32 justify-center w-full">
                      {isListening ? (
                          <div className="flex flex-col items-center gap-3 animate-in zoom-in">
                              <div className="w-20 h-20 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-200 animate-pulse relative">
                                  <Mic size={40} />
                                  <span className="absolute -bottom-2 bg-blue-700 text-white text-[9px] px-2 rounded-full">DİNLİYOR</span>
                              </div>
                              <p className="text-slate-400 text-xs font-medium h-4">{lastHeard ? `"${lastHeard}"` : "Cevap bekleniyor..."}</p>
                          </div>
                      ) : feedback ? (
                          <div className={twMerge("text-4xl font-black animate-in zoom-in", feedback === 'correct' ? "text-green-500" : "text-red-500")}>
                              {feedback === 'correct' ? "DOĞRU!" : "YANLIŞ"}
                          </div>
                      ) : (
                          <button 
                            onClick={startListening}
                            className="flex flex-col items-center gap-2 group animate-in fade-in"
                          >
                             <div className="w-20 h-20 bg-white border-4 border-slate-200 text-slate-400 rounded-full flex items-center justify-center group-hover:border-blue-400 group-hover:text-blue-500 transition-all shadow-sm">
                                  <MicOff size={32} />
                             </div>
                             <span className="text-slate-400 text-xs font-bold group-hover:text-blue-500">DOKUN VE KONUŞ</span>
                          </button>
                      )}
                  </div>
              </div>

              {/* GİZLİ BUTONLAR (Test için) */}
              <div className="absolute bottom-6 left-6 opacity-20 hover:opacity-100 z-30">
                  <button onClick={() => checkAnswer('no')} className="w-16 h-16 bg-red-50 text-red-400 border-2 border-red-200 rounded-2xl flex items-center justify-center font-bold text-xs active:scale-95">HAYIR</button>
              </div>
              <div className="absolute bottom-6 right-6 opacity-20 hover:opacity-100 z-30">
                  <button onClick={() => checkAnswer('yes')} className="w-16 h-16 bg-green-50 text-green-400 border-2 border-green-200 rounded-2xl flex items-center justify-center font-bold text-xs active:scale-95">EVET</button>
              </div>
          </div>
      )}

      {/* 3. SONUÇ */}
      {phase === 'success' && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center text-center p-8 animate-in zoom-in">
           <Trophy size={120} className="text-yellow-500 mb-6 animate-bounce" />
           <h1 className="text-3xl font-black mb-2 uppercase text-slate-800">Tebrikler!</h1>
           <p className="text-slate-500 mb-8">Bütün soruları cevapladın.</p>
           <button onClick={() => onComplete(true)} className="bg-green-600 text-white px-12 py-5 rounded-2xl font-bold text-xl shadow-xl active:scale-95">
             KAYDET VE ÇIK
           </button>
        </div>
      )}
    </div>
  );
}
