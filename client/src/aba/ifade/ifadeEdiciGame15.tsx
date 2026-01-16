import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, XCircle, Trophy, Mic, MicOff, Settings2, Play, ChevronRight, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { twMerge } from 'tailwind-merge';

// --- RESİMLER (Esle klasöründen çekiyoruz) ---
import anahtarImg from '../esle/anahtar.png';
import arabaImg from '../esle/araba.png';
import kalemImg from '../esle/kalem.png';
import topImg from '../esle/top.png';

// --- SES DOSYALARI ---
import arkaplanMusic from '../esle/ses/arkaplanmusic.mp3';
import aferin1 from '../esle/ses/aferin1.mp3';
import bravo from '../esle/ses/bravo.mp3';
import harika1 from '../esle/ses/harika1.mp3';
import tekrardene1 from '../esle/ses/tekrardene1.mp3';

// --- NESNE LİSTESİ ---
const ITEMS = [
  { id: 'anahtar', src: anahtarImg },
  { id: 'araba', src: arabaImg },
  { id: 'kalem', src: kalemImg },
  { id: 'top', src: topImg },
];

// --- STANDART KELİME HAVUZLARI ---
const STANDARD_YES = ['evet', 'eved', 'he', 'hıhı', 'doğru', 'olur', 'aynen'];
const STANDARD_NO = ['hayır', 'yok', 'cık', 'değil', 'yanlış', 'olmaz', 'hayi'];

// --- WEB SPEECH API TYPE DEFINITION ---
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface GameProps {
  mode: 'assessment' | 'instruction';
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

export default function IfadeEdiciGame15({ mode, onClose, onComplete }: GameProps) {
  // --- STATE YÖNETİMİ ---
  const [phase, setPhase] = useState<'setup' | 'playing' | 'success'>('setup');
  
  // Kalibrasyon (Ses Tanıtma)
  const [customYesWords, setCustomYesWords] = useState<string[]>([]);
  const [customNoWords, setCustomNoWords] = useState<string[]>([]);
  const [lastHeard, setLastHeard] = useState<string>("");
  const [isRecordingSetup, setIsRecordingSetup] = useState<'yes' | 'no' | null>(null);

  // Oyun Durumu
  const [targetItem, setTargetItem] = useState(ITEMS[0]);
  const [compareItem, setCompareItem] = useState(ITEMS[0]);
  const [isMatch, setIsMatch] = useState(true); // Eşleşiyor mu?
  const [isListening, setIsListening] = useState(false);
  const [animState, setAnimState] = useState<'hidden' | 'sliding' | 'visible'>('hidden');
  
  // Puanlama
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Referanslar
  const recognitionRef = useRef<any>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // --- MÜZİK BAŞLATMA ---
  useEffect(() => {
    bgMusicRef.current = new Audio(arkaplanMusic);
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = 0.05; // Çok kısık fon müziği
    // Not: Tarayıcı politikası gereği müzik genelde ilk tıklama (Start Game) ile başlar.
  }, []);

  // --- SES TANIMA MOTORU BAŞLATMA ---
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Sürekli dinle
      recognition.interimResults = false;
      recognition.lang = 'tr-TR';

      recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        console.log("Algılanan Ses:", transcript);
        setLastHeard(transcript);
        
        // Hangi aşamadayız?
        if (phase === 'setup') {
           // Setup aşamasında sadece ekrana yazıyoruz, kayıt butonuna basınca listeye eklenecek
        } else if (phase === 'playing') {
           handleGameSpeech(transcript);
        }
      };

      recognition.onend = () => {
        // Eğer oyun devam ediyorsa ve dinleme modundaysak tekrar başlat
        if (isListening && phase === 'playing') {
            try { recognition.start(); } catch(e) {}
        }
      };

      recognitionRef.current = recognition;
    } else {
      alert("Tarayıcınız ses tanıma özelliğini desteklemiyor. (Chrome kullanın)");
    }
  }, [phase, isListening]); // Phase veya listening değişince güncelle

  // --- OYUN İÇİ SES ANALİZİ ---
  const handleGameSpeech = (transcript: string) => {
     // Gürültü Filtreleme: Cümlenin içindeki kelimelere bak
     const words = transcript.split(" ");
     
     // Havuzları Birleştir
     const YES_POOL = [...STANDARD_YES, ...customYesWords];
     const NO_POOL = [...STANDARD_NO, ...customNoWords];

     let detectedAnswer: 'yes' | 'no' | null = null;

     // Kelimeleri Tara
     for (const word of words) {
         if (YES_POOL.includes(word)) detectedAnswer = 'yes';
         if (NO_POOL.includes(word)) detectedAnswer = 'no';
     }

     if (detectedAnswer) {
         checkAnswer(detectedAnswer);
     }
  };

  // --- CEVAP KONTROLÜ ---
  const checkAnswer = (userSays: 'yes' | 'no') => {
      // Mikrofonu geçici durdur (Cevap işleniyor)
      stopListening();

      const expected = isMatch ? 'yes' : 'no';
      
      if (userSays === expected) {
          handleSuccess();
      } else {
          handleFail();
      }
  };

  // --- OYUN AKIŞI ---
  const startGame = () => {
      setPhase('playing');
      setScore(0);
      setQuestionCount(0);
      // Müziği başlat
      if (bgMusicRef.current) bgMusicRef.current.play().catch(()=>{});
      generateQuestion();
  };

  const generateQuestion = () => {
      setFeedback(null);
      setAnimState('hidden');
      stopListening(); // Önceki dinlemeyi durdur
      
      // 1. Hedef Resim Seç
      const target = ITEMS[Math.floor(Math.random() * ITEMS.length)];
      setTargetItem(target);

      // 2. Karşılaştırma Resmi Seç ( %50 şansla aynı, %50 farklı)
      const shouldMatch = Math.random() > 0.5;
      setIsMatch(shouldMatch);

      let compare;
      if (shouldMatch) {
          compare = target;
      } else {
          // Farklı bir resim bul
          const others = ITEMS.filter(i => i.id !== target.id);
          compare = others[Math.floor(Math.random() * others.length)];
      }
      setCompareItem(compare);

      // 3. Animasyonu Başlat
      setTimeout(() => {
          setAnimState('sliding'); // Kayarak gelme başlar
          
          // Kayma bitince (1sn sonra) soru sor
          setTimeout(() => {
              setAnimState('visible');
              askQuestion();
          }, 1000);

      }, 500);
  };

  const askQuestion = () => {
      // Tarayıcının konuşma motoru ile soru sor
      const utterance = new SpeechSynthesisUtterance("Doğru eşledim mi?");
      utterance.lang = 'tr-TR';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);

      // Konuşma bitince dinlemeye başla
      utterance.onend = () => {
          startListening();
      };
  };

  const startListening = () => {
      setIsListening(true);
      try { recognitionRef.current?.start(); } catch(e) {}
  };

  const stopListening = () => {
      setIsListening(false);
      try { recognitionRef.current?.stop(); } catch(e) {}
  };

  // --- SONUÇLAR ---
  const handleSuccess = () => {
      const audio = new Audio(Math.random() > 0.5 ? aferin1 : bravo);
      audio.play();
      setFeedback('correct');
      setScore(prev => prev + 1);

      setTimeout(() => {
          const nextQ = questionCount + 1;
          setQuestionCount(nextQ);
          if (nextQ < 10) {
              generateQuestion();
          } else {
              setPhase('success');
              confetti();
          }
      }, 2000);
  };

  const handleFail = () => {
      const audio = new Audio(tekrardene1);
      audio.play();
      setFeedback('wrong');
      
      // Yanlışta biraz bekle sonra tekrar dinlemeye başla (Fırsat ver)
      setTimeout(() => {
          setFeedback(null);
          startListening();
      }, 1500);
  };

  // --- RENDER HELPERS ---
  const addWordToPool = (type: 'yes' | 'no') => {
      if (!lastHeard) return;
      if (type === 'yes') setCustomYesWords([...customYesWords, lastHeard]);
      else setCustomNoWords([...customNoWords, lastHeard]);
      setLastHeard("");
  };

  // Setup Aşamasında Kayıt Başlat/Durdur
  const toggleSetupRecord = (type: 'yes' | 'no') => {
      if (isRecordingSetup === type) {
          // Durdur
          setIsRecordingSetup(null);
          try { recognitionRef.current?.stop(); } catch(e) {}
      } else {
          // Başlat
          setIsRecordingSetup(type);
          setLastHeard(""); // Ekranı temizle
          try { recognitionRef.current?.start(); } catch(e) {}
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col font-sans select-none overflow-hidden touch-none overscroll-none text-slate-800">
      
      {/* --- PHASE 1: SETUP (KALİBRASYON) --- */}
      {phase === 'setup' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8 max-w-2xl mx-auto w-full">
              <div className="text-center">
                  <h1 className="text-2xl font-black text-slate-800 mb-2">Ses Tanıma Ayarı</h1>
                  <p className="text-slate-500">Çocuğun "Evet" ve "Hayır" deyiş biçimlerini sisteme öğretebilirsiniz.</p>
              </div>

              {/* EVET AYARI */}
              <div className="w-full bg-white p-4 rounded-2xl shadow-sm border border-green-100">
                  <h3 className="font-bold text-green-600 mb-2 flex items-center gap-2">
                      <Check size={20}/> EVET Kelimesi
                  </h3>
                  <div className="flex gap-2 mb-2">
                      <button 
                        onClick={() => toggleSetupRecord('yes')}
                        className={twMerge("flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all", isRecordingSetup === 'yes' ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 text-slate-600")}
                      >
                          {isRecordingSetup === 'yes' ? <><MicOff/> Dinliyor...</> : <><Mic/> Kayıt (Söylet)</>}
                      </button>
                      <button onClick={() => addWordToPool('yes')} disabled={!lastHeard || isRecordingSetup === 'yes'} className="px-4 bg-green-500 text-white rounded-xl font-bold disabled:opacity-50">Ekle</button>
                  </div>
                  <div className="text-xs text-slate-400 min-h-[20px]">
                      Algılanan: <span className="font-mono text-slate-800 font-bold">{isRecordingSetup === 'yes' ? lastHeard || "..." : lastHeard}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                      {customYesWords.map((w, i) => <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-200">{w}</span>)}
                  </div>
              </div>

              {/* HAYIR AYARI */}
              <div className="w-full bg-white p-4 rounded-2xl shadow-sm border border-red-100">
                  <h3 className="font-bold text-red-600 mb-2 flex items-center gap-2">
                      <XCircle size={20}/> HAYIR Kelimesi
                  </h3>
                  <div className="flex gap-2 mb-2">
                      <button 
                        onClick={() => toggleSetupRecord('no')}
                        className={twMerge("flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all", isRecordingSetup === 'no' ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 text-slate-600")}
                      >
                          {isRecordingSetup === 'no' ? <><MicOff/> Dinliyor...</> : <><Mic/> Kayıt (Söylet)</>}
                      </button>
                      <button onClick={() => addWordToPool('no')} disabled={!lastHeard || isRecordingSetup === 'no'} className="px-4 bg-red-500 text-white rounded-xl font-bold disabled:opacity-50">Ekle</button>
                  </div>
                  <div className="text-xs text-slate-400 min-h-[20px]">
                      Algılanan: <span className="font-mono text-slate-800 font-bold">{isRecordingSetup === 'no' ? lastHeard || "..." : lastHeard}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                      {customNoWords.map((w, i) => <span key={i} className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded border border-red-200">{w}</span>)}
                  </div>
              </div>

              <button onClick={startGame} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                  <Play fill="currentColor"/> OYUNA BAŞLA
              </button>
          </div>
      )}

      {/* --- PHASE 2: PLAYING (OYUN) --- */}
      {phase === 'playing' && (
          <div className="flex-1 flex flex-col relative">
              {/* Üst Bar */}
              <div className="p-4 flex justify-between items-center bg-white/50 backdrop-blur-sm z-20">
                  <button onClick={onClose} className="p-2 bg-white border rounded-full"><XCircle className="text-slate-300"/></button>
                  <div className="px-4 py-1 bg-blue-50 text-blue-600 rounded-full font-bold text-sm border border-blue-100">
                      SORU: {questionCount + 1} / 10
                  </div>
              </div>

              {/* Oyun Alanı */}
              <div className="flex-1 flex flex-col items-center justify-center gap-8 p-4">
                  
                  {/* Resimler Sahnesi */}
                  <div className="flex items-center gap-4 sm:gap-12 h-64">
                      
                      {/* Hedef Resim (Sabit) */}
                      <div className="w-32 h-32 sm:w-48 sm:h-48 bg-white border-4 border-slate-200 rounded-3xl p-4 shadow-xl relative z-10">
                          <img src={targetItem.src} className="w-full h-full object-contain" />
                      </div>

                      {/* Kıyaslanan Resim (Animasyonlu) */}
                      <motion.div 
                        initial={{ x: 300, opacity: 0 }}
                        animate={
                            animState === 'sliding' ? { x: 0, opacity: 1 } : 
                            animState === 'visible' ? { x: 0, opacity: 1 } : 
                            { x: 300, opacity: 0 }
                        }
                        transition={{ type: "spring", bounce: 0.2, duration: 1 }}
                        className={twMerge(
                            "w-32 h-32 sm:w-48 sm:h-48 bg-white border-4 rounded-3xl p-4 shadow-xl z-10 transition-colors duration-500",
                            feedback === 'correct' ? "border-green-500 bg-green-50" : 
                            feedback === 'wrong' ? "border-red-500 bg-red-50" : "border-slate-200"
                        )}
                      >
                          <img src={compareItem.src} className="w-full h-full object-contain" />
                      </motion.div>

                  </div>

                  {/* Mikrofon / Durum Göstergesi */}
                  <div className="flex flex-col items-center gap-4 min-h-[100px]">
                      {isListening ? (
                          <div className="flex flex-col items-center animate-pulse">
                              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                                  <Mic size={40} className="text-blue-600" />
                              </div>
                              <span className="text-blue-500 font-bold text-sm tracking-widest uppercase">Dinliyorum...</span>
                          </div>
                      ) : feedback ? (
                          <div className={twMerge("text-4xl font-black uppercase", feedback === 'correct' ? "text-green-500" : "text-red-500")}>
                              {feedback === 'correct' ? "DOĞRU!" : "TEKRAR DENE"}
                          </div>
                      ) : (
                          <div className="text-slate-400 font-medium">Soru hazırlanıyor...</div>
                      )}
                  </div>

              </div>

              {/* GİZLİ MANUEL KONTROLLER (Öğretmen İçin) */}
              <div className="absolute bottom-4 left-4 z-30 opacity-30 hover:opacity-100 transition-opacity">
                  <button onClick={() => checkAnswer('no')} className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center border-2 border-red-200 font-black text-xs">MANUEL<br/>HAYIR</button>
              </div>
              <div className="absolute bottom-4 right-4 z-30 opacity-30 hover:opacity-100 transition-opacity">
                  <button onClick={() => checkAnswer('yes')} className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center border-2 border-green-200 font-black text-xs">MANUEL<br/>EVET</button>
              </div>
          </div>
      )}

      {/* --- PHASE 3: SUCCESS (BİTİŞ) --- */}
      {phase === 'success' && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center text-center p-8">
           <Trophy size={100} className="text-yellow-500 mb-6 animate-bounce" />
           <h1 className="text-3xl font-black text-slate-800 mb-2 uppercase">Harika İş!</h1>
           <p className="text-slate-500 mb-8 font-medium text-lg">Puan: {score} / 10</p>
           <button onClick={() => onComplete(true)} className="bg-green-600 text-white px-12 py-5 rounded-2xl font-bold text-xl shadow-xl active:scale-95 transition-all">
             KAYDET VE ÇIK
           </button>
        </div>
      )}

    </div>
  );
}
