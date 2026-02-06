import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, XCircle, Trophy, Mic, MicOff, Volume2, ArrowRight } from 'lucide-react';
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
  // --- STATES ---
  const [phase, setPhase] = useState<'init' | 'setup' | 'playing' | 'success'>('init');
  
  // Kelime Listeleri
  const [customYesWords, setCustomYesWords] = useState<string[]>([]);
  const [customNoWords, setCustomNoWords] = useState<string[]>([]);
  
  // Referanslar (Oyun sırasında güncel listeyi okumak için şart)
  const yesWordsRef = useRef<string[]>([]);
  const noWordsRef = useRef<string[]>([]);

  // Setup Ekranı İçin
  const [lastHeard, setLastHeard] = useState<string>("");
  const [isRecordingSetup, setIsRecordingSetup] = useState<'yes' | 'no' | null>(null);

  // Oyun Ekranı İçin
  const [targetItem, setTargetItem] = useState(ITEMS[0]);
  const [compareItem, setCompareItem] = useState(ITEMS[0]);
  const [isMatch, setIsMatch] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [animState, setAnimState] = useState<'hidden' | 'sliding' | 'visible'>('hidden');
  const [questionCount, setQuestionCount] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Teknik Referanslar
  const recognitionRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  // --- STATE GÜNCELLEMELERİNİ REF'E AKTAR ---
  useEffect(() => { yesWordsRef.current = customYesWords; }, [customYesWords]);
  useEffect(() => { noWordsRef.current = customNoWords; }, [customNoWords]);

  // --- GÜVENLİK ---
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
            recognitionRef.current.stop(); // Abort yerine Stop daha nazik
          } catch(e) {}
          recognitionRef.current = null;
      }
      setIsListening(false);
      setIsRecordingSetup(null);
  };

  const handleSafeClose = () => {
      killEverything();
      onClose();
  };

  // --- SES MOTORU (TEK VE GÜÇLÜ) ---
  const startEngine = (mode: 'setup' | 'game') => {
      // Önce varsa eskisini kapat
      if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch(e){}
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      const recognition = new SpeechRecognition();
      recognition.lang = 'tr-TR';
      recognition.interimResults = true; 
      recognition.maxAlternatives = 1;
      
      // Setup'ta sürekli dinle (kelime yakalamak için), Oyunda tek atımlık dinle
      recognition.continuous = (mode === 'setup'); 

      recognition.onstart = () => {
          if (isMountedRef.current) setIsListening(true);
      };

      recognition.onend = () => {
          if (isMountedRef.current) {
              setIsListening(false);
              // Setup modundaysa ve kullanıcı durdurmadıysa, motoru tekrar dürt (Süreklilik için)
              if (mode === 'setup' && (isRecordingSetup === 'yes' || isRecordingSetup === 'no')) {
                   try { recognition.start(); } catch(e){}
              }
          }
      };

      recognition.onresult = (event: any) => {
          if (!isMountedRef.current) return;

          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
              transcript += event.results[i][0].transcript;
          }
          const lower = transcript.trim().toLowerCase();
          
          setLastHeard(lower); // Ekrana yaz

          // EĞER OYUNDAYSAK CEVABI KONTROL ET
          if (mode === 'game') {
              checkGameAnswer(lower, recognition);
          }
      };

      recognitionRef.current = recognition;
      try { recognition.start(); } catch(e) {}
  };

  // --- OYUN MANTIĞI ---
  const checkGameAnswer = (transcript: string, recInstance: any) => {
      const YES_POOL = [...STANDARD_YES, ...yesWordsRef.current];
      const NO_POOL = [...STANDARD_NO, ...noWordsRef.current];

      const words = transcript.split(" ");
      let detected: 'yes' | 'no' | null = null;

      for (const word of words) {
          if (YES_POOL.some(w => word === w || word.includes(w))) detected = 'yes';
          else if (NO_POOL.some(w => word === w || word.includes(w))) detected = 'no';
      }

      if (detected) {
          recInstance.abort(); // Cevabı bulduk, susabilirsin
          handleAnswer(detected);
      }
  };

  const handleAnswer = (userSays: 'yes' | 'no') => {
      if (feedback) return; 

      const expected = isMatch ? 'yes' : 'no';
      if (userSays === expected) handleSuccess();
      else handleFail();
  };

  // --- AKIŞ KONTROLLERİ ---
  
  // 1. SETUP KAYIT BAŞLAT/DURDUR
  const toggleSetupRecord = (type: 'yes' | 'no') => {
      if (isRecordingSetup === type) {
          // Durdur
          setIsRecordingSetup(null);
          if (recognitionRef.current) recognitionRef.current.abort();
      } else {
          // Başlat
          killEverything(); // Temizle
          setIsRecordingSetup(type);
          setTimeout(() => startEngine('setup'), 100);
      }
  };

  // 2. OYUNU BAŞLAT
  const startGame = () => {
      killEverything(); // Setup motorunu öldür
      setPhase('playing');
      setTimeout(generateQuestion, 500); // Biraz nefes alıp soruyu getir
  };

  const generateQuestion = () => {
      setFeedback(null);
      setAnimState('hidden');
      setLastHeard(""); // Ekranı temizle
      
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
      const utterance = new SpeechSynthesisUtterance("Bu ikisi aynı mı?"); // Soru metnini kısalttım, daha anlaşılır olsun
      utterance.lang = 'tr-TR';
      
      utterance.onend = () => {
          if (isMountedRef.current && phase === 'playing') {
              startEngine('game'); // Oyun modunda dinlemeyi başlat
          }
      };
      
      // Hata olursa yine de dinlemeyi başlat
      utterance.onerror = () => {
          if (isMountedRef.current && phase === 'playing') startEngine('game');
      };

      window.speechSynthesis.speak(utterance);
  };

  const handleSuccess = () => {
      try { new Audio(Math.random() > 0.5 ? aferin1 : bravo).play().catch(()=>{}); } catch (e) {}
      setFeedback('correct');
      setTimeout(() => {
          if (!isMountedRef.current) return;
          const nextQ = questionCount + 1;
          setQuestionCount(nextQ);
          if (nextQ < 10) generateQuestion();
          else { setPhase('success'); confetti(); }
      }, 2000);
  };

  const handleFail = () => {
      try { new Audio(tekrardene1).play().catch(()=>{}); } catch (e) {}
      setFeedback('wrong');
      setTimeout(() => {
          if (!isMountedRef.current) return;
          setFeedback(null);
          startEngine('game'); // Tekrar dinle
      }, 2000);
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
              <p className="text-slate-500 mb-8 max-w-xs">Önce sesini tanıyalım, sonra oyuna başlayalım.</p>
              <button onClick={() => setPhase('setup')} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold text-xl shadow-xl active:scale-95 transition-all">
                  BAŞLA
              </button>
          </div>
      )}

      {/* 1. SETUP (KAYIT EKRANI - DÜZELTİLDİ) */}
      {phase === 'setup' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 max-w-2xl mx-auto w-full overflow-y-auto relative bg-slate-50">
              <button onClick={handleSafeClose} className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm"><XCircle className="text-slate-400"/></button>
              
              <div className="text-center">
                <h1 className="text-2xl font-black text-slate-800">Ses Kalibrasyonu</h1>
                <p className="text-xs text-slate-500">Çocuğun söylediği kelimeyi ekle.</p>
              </div>

              {/* EVET KUTUSU */}
              <div className="w-full bg-white p-4 rounded-2xl border-2 border-green-100 shadow-sm">
                  <h3 className="font-bold text-green-600 mb-2 flex items-center gap-2"><Check size={18}/> EVET (Onay)</h3>
                  <div className="flex gap-2">
                      <button 
                        onClick={() => toggleSetupRecord('yes')}
                        className={twMerge("flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors", isRecordingSetup === 'yes' ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 border text-slate-600")}
                      >
                          {isRecordingSetup === 'yes' ? <MicOff size={18}/> : <Mic size={18}/>}
                          {isRecordingSetup === 'yes' ? "Durdur" : "Söyle"}
                      </button>
                      
                      <button 
                        onClick={() => { 
                            if(lastHeard && !customYesWords.includes(lastHeard)) {
                                setCustomYesWords([...customYesWords, lastHeard]); 
                                setLastHeard(""); // Eklendikten sonra temizle
                            }
                        }} 
                        disabled={!lastHeard || isRecordingSetup !== 'yes'} 
                        className="px-6 bg-green-500 text-white rounded-xl font-bold disabled:opacity-30 disabled:bg-slate-300"
                      >
                        Ekle
                      </button>
                  </div>
                  
                  {isRecordingSetup === 'yes' && (
                      <p className="text-center mt-2 text-sm font-bold text-blue-600 h-6">{lastHeard || "Dinliyor..."}</p>
                  )}

                  <div className="flex flex-wrap gap-1 mt-3 min-h-[20px]">
                      {customYesWords.map((w, i) => (
                          <span key={i} className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-md border border-green-200 flex items-center gap-1">
                              {w} <button onClick={() => setCustomYesWords(prev => prev.filter(x => x !== w))}><XCircle size={10}/></button>
                          </span>
                      ))}
                  </div>
              </div>

              {/* HAYIR KUTUSU */}
              <div className="w-full bg-white p-4 rounded-2xl border-2 border-red-100 shadow-sm">
                  <h3 className="font-bold text-red-600 mb-2 flex items-center gap-2"><XCircle size={18}/> HAYIR (Red)</h3>
                  <div className="flex gap-2">
                      <button 
                        onClick={() => toggleSetupRecord('no')}
                        className={twMerge("flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors", isRecordingSetup === 'no' ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 border text-slate-600")}
                      >
                          {isRecordingSetup === 'no' ? <MicOff size={18}/> : <Mic size={18}/>}
                          {isRecordingSetup === 'no' ? "Durdur" : "Söyle"}
                      </button>
                      
                      <button 
                         onClick={() => { 
                            if(lastHeard && !customNoWords.includes(lastHeard)) {
                                setCustomNoWords([...customNoWords, lastHeard]); 
                                setLastHeard("");
                            }
                        }} 
                        disabled={!lastHeard || isRecordingSetup !== 'no'} 
                        className="px-6 bg-red-500 text-white rounded-xl font-bold disabled:opacity-30 disabled:bg-slate-300"
                      >
                        Ekle
                      </button>
                  </div>

                  {isRecordingSetup === 'no' && (
                      <p className="text-center mt-2 text-sm font-bold text-blue-600 h-6">{lastHeard || "Dinliyor..."}</p>
                  )}

                  <div className="flex flex-wrap gap-1 mt-3 min-h-[20px]">
                      {customNoWords.map((w, i) => (
                          <span key={i} className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-md border border-red-200 flex items-center gap-1">
                              {w} <button onClick={() => setCustomNoWords(prev => prev.filter(x => x !== w))}><XCircle size={10}/></button>
                          </span>
                      ))}
                  </div>
              </div>

              <button onClick={startGame} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-lg mt-2 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                  OYUNA GEÇ <ArrowRight/>
              </button>
          </div>
      )}

      {/* 2. OYUN EKRANI */}
      {phase === 'playing' && (
          <div className="flex-1 flex flex-col relative bg-slate-50">
              <div className="p-4 flex justify-between items-center z-20">
                  <button onClick={handleSafeClose} className="p-2 bg-white border rounded-full shadow-sm active:scale-95"><XCircle className="text-slate-400"/></button>
                  <div className="px-4 py-1 bg-white shadow-sm rounded-full font-bold text-xs border border-slate-200 text-slate-500">
                    SORU: <span className="text-blue-600 text-sm">{questionCount + 1}</span> / 10
                  </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-start pt-10 gap-8 p-4">
                  {/* RESİM ALANI */}
                  <div className="flex items-center gap-4 sm:gap-8 w-full justify-center h-48">
                      <div className="w-36 h-36 bg-white border-4 border-slate-200 rounded-[2rem] p-6 flex items-center justify-center shadow-md relative">
                          <img src={targetItem.src} className="w-full h-full object-contain" alt="Hedef" />
                          <div className="absolute -top-3 bg-blue-100 text-blue-600 text-[10px] font-bold px-3 py-1 rounded-full border border-blue-200">HEDEF</div>
                      </div>
                      
                      <motion.div 
                        initial={{ x: 100, opacity: 0 }}
                        animate={animState !== 'hidden' ? { x: 0, opacity: 1 } : { x: 100, opacity: 0 }}
                        className={twMerge(
                            "w-36 h-36 bg-white border-4 rounded-[2rem] p-6 flex items-center justify-center transition-all duration-300 shadow-md",
                            feedback === 'correct' ? "border-green-500 bg-green-50 scale-110 shadow-green-200" : 
                            feedback === 'wrong' ? "border-red-500 bg-red-50 shake" : "border-slate-200"
                        )}
                      >
                          <img src={compareItem.src} className="w-full h-full object-contain" alt="Karşılaştırma" />
                      </motion.div>
                  </div>

                  {/* SORU METNİ */}
                  <div className="bg-white px-6 py-2 rounded-full shadow-sm border border-slate-200">
                      <p className="font-bold text-lg text-slate-700">Bu ikisi aynı mı?</p>
                  </div>

                  {/* MİKROFON DURUMU */}
                  <div className="flex flex-col items-center gap-3 h-32 justify-center w-full mt-4">
                      {isListening ? (
                          <div className="flex flex-col items-center gap-3 animate-in zoom-in duration-300">
                              <div className="w-24 h-24 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-blue-200 animate-pulse relative">
                                  <Mic size={48} />
                                  <span className="absolute -bottom-2 bg-blue-700 text-white text-[9px] px-2 rounded-full">DİNLİYOR</span>
                              </div>
                              <p className="text-slate-400 text-xs font-medium h-4">{lastHeard ? `"${lastHeard}"` : "Cevap bekleniyor..."}</p>
                          </div>
                      ) : feedback ? (
                          <div className={twMerge("text-5xl font-black animate-in zoom-in drop-shadow-sm", feedback === 'correct' ? "text-green-500" : "text-red-500")}>
                              {feedback === 'correct' ? "HARİKA!" : "OLMADI"}
                          </div>
                      ) : (
                          // TIKANMAYI ÖNLEYEN BUTON (Manuel Başlatma)
                          <button 
                            onClick={() => startEngine('game')}
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

              {/* GİZLİ MANUEL BUTONLAR (Test İçin) */}
              <div className="absolute bottom-6 left-6 opacity-20 hover:opacity-100 z-30 transition-opacity">
                  <button onClick={() => handleAnswer('no')} className="w-16 h-16 bg-red-50 text-red-400 border-2 border-red-200 rounded-2xl flex items-center justify-center font-bold text-xs active:scale-95">HAYIR</button>
              </div>
              <div className="absolute bottom-6 right-6 opacity-20 hover:opacity-100 z-30 transition-opacity">
                  <button onClick={() => handleAnswer('yes')} className="w-16 h-16 bg-green-50 text-green-400 border-2 border-green-200 rounded-2xl flex items-center justify-center font-bold text-xs active:scale-95">EVET</button>
              </div>
          </div>
      )}

      {/* 3. SONUÇ EKRANI */}
      {phase === 'success' && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center text-center p-8 animate-in zoom-in">
           <Trophy size={120} className="text-yellow-500 mb-8 animate-bounce drop-shadow-xl" />
           <h1 className="text-4xl font-black mb-4 uppercase text-slate-800">Tebrikler!</h1>
           <p className="text-slate-500 mb-8 font-medium">Bütün soruları cevapladın.</p>
           <button onClick={() => onComplete(true)} className="bg-green-600 text-white px-12 py-5 rounded-2xl font-bold text-xl shadow-xl active:scale-95 transition-transform">
             KAYDET VE BİTİR
           </button>
        </div>
      )}
    </div>
  );
}
