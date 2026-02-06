import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, XCircle, Trophy, Mic, MicOff, ArrowRight } from 'lucide-react';
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
  const [lastHeard, setLastHeard] = useState<string>('');
  const [isRecordingSetup, setIsRecordingSetup] = useState<'yes' | 'no' | null>(null);

  const [targetItem, setTargetItem] = useState(ITEMS[0]);
  const [compareItem, setCompareItem] = useState(ITEMS[0]);
  const [isMatch, setIsMatch] = useState(true);

  const [isListening, setIsListening] = useState(false);
  const [animState, setAnimState] = useState<'hidden' | 'sliding' | 'visible'>('hidden');

  const [questionCount, setQuestionCount] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // --- REFS ---
  const recognitionRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  const phaseRef = useRef(phase);
  const feedbackRef = useRef<typeof feedback>(feedback);
  const customYesRef = useRef<string[]>(customYesWords);
  const customNoRef = useRef<string[]>(customNoWords);

  // Cevap kabul penceresi (true iken evet/hayır yakala)
  const answerWindowOpenRef = useRef(false);

  // Bu soruda cevap verildi mi? (yakalanır yakalanmaz true olur)
  const answeredRef = useRef(false);

  // spam/çift tetikleme önleme
  const lastTriggerAtRef = useRef(0);
  const lastDetectedRef = useRef<'yes' | 'no' | null>(null);

  const startedPlayingOnceRef = useRef(false);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { feedbackRef.current = feedback; }, [feedback]);
  useEffect(() => { customYesRef.current = customYesWords; }, [customYesWords]);
  useEffect(() => { customNoRef.current = customNoWords; }, [customNoWords]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      killEverything();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const killEverything = () => {
    window.speechSynthesis.cancel();

    answerWindowOpenRef.current = false;
    answeredRef.current = false;
    lastDetectedRef.current = null;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onstart = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    if (isMountedRef.current) setIsListening(false);
  };

  const handleSafeClose = () => {
    killEverything();
    onClose();
  };

  // --- SpeechRecognition (continuous: true) ---
  const initSpeechEngine = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    recognition.onstart = () => {
      if (isMountedRef.current) setIsListening(true);
    };

    recognition.onend = () => {
      if (isMountedRef.current) setIsListening(false);

      // Setup/Playing modunda kapanırsa geri aç
      const p = phaseRef.current;
      if (!isMountedRef.current) return;
      if ((p === 'setup' || p === 'playing') && recognitionRef.current) {
        setTimeout(() => {
          try { recognitionRef.current?.start(); } catch {}
        }, 250);
      }
    };

    recognition.onerror = () => {
      if (isMountedRef.current) setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      if (!isMountedRef.current) return;

      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      const lower = transcript.trim().toLowerCase();
      setLastHeard(lower);

      const p = phaseRef.current;
      if (p === 'setup') return;

      if (p === 'playing') {
        checkTranscriptForGame(lower);
      }
    };

    return recognition;
  };

  const ensureEngine = () => {
    if (!recognitionRef.current) recognitionRef.current = initSpeechEngine();
    return recognitionRef.current;
  };

  const startEngineUserGesture = () => {
    if (!isMountedRef.current) return;
    const rec = ensureEngine();
    if (!rec) return;
    try { rec.start(); } catch {}
  };

  // --- Detect ---
  const detectYesNo = (transcript: string): 'yes' | 'no' | null => {
    const words = transcript.split(/\s+/).filter(Boolean);
    const YES_POOL = [...STANDARD_YES, ...customYesRef.current];
    const NO_POOL = [...STANDARD_NO, ...customNoRef.current];

    let detected: 'yes' | 'no' | null = null;
    for (const word of words) {
      if (YES_POOL.some(w => word === w || word.includes(w))) detected = 'yes';
      else if (NO_POOL.some(w => word === w || word.includes(w))) detected = 'no';
    }
    return detected;
  };

  const checkTranscriptForGame = (transcript: string) => {
    // cevap beklemiyorsak gereksiz konuşmayı yok say
    if (!answerWindowOpenRef.current) return;

    // bu soruda zaten cevap yakalandıysa tekrar tetikleme yapma
    if (answeredRef.current) return;

    // feedback varken tetikleme yapma
    if (feedbackRef.current) return;

    // spam
    const now = Date.now();
    if (now - lastTriggerAtRef.current < 700) return;

    const detected = detectYesNo(transcript);
    if (!detected) return;

    if (lastDetectedRef.current === detected && now - lastTriggerAtRef.current < 1200) return;

    // >>> KRİTİK: kelime yakalandı => bu soru cevaplandı (tek sefer)
    answeredRef.current = true;
    answerWindowOpenRef.current = false;

    lastTriggerAtRef.current = now;
    lastDetectedRef.current = detected;

    checkAnswer(detected);
  };

  const checkAnswer = (userSays: 'yes' | 'no') => {
    if (feedbackRef.current) return;

    const expected = isMatch ? 'yes' : 'no';
    if (userSays === expected) handleSuccess();
    else handleFail();
  };

  // --- Akış ---
  const initGame = () => setPhase('setup');

  const startGame = () => {
    // kullanıcı jestiyle engine başlat
    startEngineUserGesture();

    startedPlayingOnceRef.current = false;
    setFeedback(null);
    setQuestionCount(0);
    setPhase('playing');
  };

  // Playing'e girince ilk soruyu üret
  useEffect(() => {
    if (phase === 'playing' && !startedPlayingOnceRef.current) {
      startedPlayingOnceRef.current = true;
      generateQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const generateQuestion = () => {
    setFeedback(null);
    setAnimState('hidden');

    // yeni soru resetleri
    answeredRef.current = false;
    answerWindowOpenRef.current = false;
    lastDetectedRef.current = null;

    window.speechSynthesis.cancel();

    const target = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    const shouldMatch = Math.random() > 0.5;

    let compare = target;
    if (!shouldMatch) {
      const others = ITEMS.filter(i => i.id !== target.id);
      compare = others[Math.floor(Math.random() * others.length)] || target;
    }

    setTargetItem(target);
    setIsMatch(shouldMatch);
    setCompareItem(compare);

    // sağdan kayma animasyonu
    setTimeout(() => {
      if (!isMountedRef.current) return;
      setAnimState('sliding');

      setTimeout(() => {
        if (!isMountedRef.current) return;
        setAnimState('visible');
        askQuestion();
      }, 900);
    }, 250);
  };

  const askQuestion = () => {
    window.speechSynthesis.cancel();

    // soru sorulurken cevap penceresi kapalı
    answerWindowOpenRef.current = false;
    answeredRef.current = false;
    lastDetectedRef.current = null;

    const utterance = new SpeechSynthesisUtterance('Doğru eşledim mi?');
    utterance.lang = 'tr-TR';
    utterance.rate = 1.0;

    utterance.onend = () => {
      if (!isMountedRef.current) return;
      setTimeout(() => {
        // artık cevap bekle
        answerWindowOpenRef.current = true;
      }, 250);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleSuccess = () => {
    // doğruysa: aferin -> sonra yeni soruya geç
    answerWindowOpenRef.current = false;
    answeredRef.current = true;

    try {
      const audio = new Audio(Math.random() > 0.5 ? aferin1 : bravo);
      audio.play().catch(() => {});
    } catch {}

    setFeedback('correct');

    setTimeout(() => {
      if (!isMountedRef.current) return;

      const nextQ = questionCount + 1;
      setQuestionCount(nextQ);

      if (nextQ < 10) generateQuestion();
      else {
        setPhase('success');
        confetti();
      }
    }, 2200);
  };

  const handleFail = () => {
    // yanlışsa: tekrar dene -> sonra aynı soruda dinlemeyi tekrar aç
    answerWindowOpenRef.current = false;
    answeredRef.current = true;

    try {
      const audio = new Audio(tekrardene1);
      audio.play().catch(() => {});
    } catch {}

    setFeedback('wrong');

    setTimeout(() => {
      if (!isMountedRef.current) return;

      // geri bildirimi kaldır, aynı eşleme kalsın, yeniden cevap al
      setFeedback(null);

      lastDetectedRef.current = null;
      lastTriggerAtRef.current = Date.now();

      answeredRef.current = false;        // çocuk tekrar cevap verebilsin
      answerWindowOpenRef.current = true; // dinleme penceresini yeniden aç
    }, 1800);
  };

  // Setup UI
  const toggleSetupRecord = (type: 'yes' | 'no') => {
    startEngineUserGesture();
    setIsRecordingSetup(prev => (prev === type ? null : type));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col font-sans select-none overflow-hidden touch-none overscroll-none text-slate-800 min-h-screen">
      {/* 0. GİRİŞ */}
      {phase === 'init' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
          <button onClick={handleSafeClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full">
            <XCircle className="text-slate-400" />
          </button>

          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <Mic size={48} className="text-blue-600" />
          </div>

          <h1 className="text-2xl font-black mb-4">Hazır mısın?</h1>

          <button
            onClick={initGame}
            className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold text-xl shadow-xl active:scale-95 transition-all"
          >
            BAŞLA
          </button>
        </div>
      )}

      {/* 1. SETUP */}
      {phase === 'setup' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 max-w-2xl mx-auto w-full overflow-y-auto relative">
          <button onClick={handleSafeClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full">
            <XCircle className="text-slate-400" />
          </button>

          <h1 className="text-2xl font-black">Ses Kalibrasyonu</h1>

          {/* EVET */}
          <div className="w-full bg-white p-4 rounded-2xl border-2 border-green-100">
            <h3 className="font-bold text-green-600 mb-2 flex items-center gap-2">
              <Check size={18} /> EVET
            </h3>

            <div className="flex gap-2">
              <button
                onClick={() => toggleSetupRecord('yes')}
                className={twMerge(
                  "flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2",
                  isRecordingSetup === 'yes' ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 border"
                )}
              >
                {isRecordingSetup === 'yes' ? <MicOff size={18} /> : <Mic size={18} />}
                {isRecordingSetup === 'yes' ? "Dur" : "Söylet"}
              </button>

              <button
                onClick={() => { setCustomYesWords([...customYesWords, lastHeard]); setLastHeard(""); }}
                disabled={!lastHeard}
                className="px-4 bg-green-500 text-white rounded-xl font-bold disabled:opacity-30"
              >
                Ekle
              </button>
            </div>

            <p className="text-[10px] mt-2 text-slate-400 h-4">
              Algılanan: <span className="text-blue-600 font-bold text-sm">{lastHeard}</span>
            </p>

            <div className="flex flex-wrap gap-1 mt-2">
              {customYesWords.map((w, i) => (
                <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full">{w}</span>
              ))}
            </div>
          </div>

          {/* HAYIR */}
          <div className="w-full bg-white p-4 rounded-2xl border-2 border-red-100">
            <h3 className="font-bold text-red-600 mb-2 flex items-center gap-2">
              <XCircle size={18} /> HAYIR
            </h3>

            <div className="flex gap-2">
              <button
                onClick={() => toggleSetupRecord('no')}
                className={twMerge(
                  "flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2",
                  isRecordingSetup === 'no' ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 border"
                )}
              >
                {isRecordingSetup === 'no' ? <MicOff size={18} /> : <Mic size={18} />}
                {isRecordingSetup === 'no' ? "Dur" : "Söylet"}
              </button>

              <button
                onClick={() => { setCustomNoWords([...customNoWords, lastHeard]); setLastHeard(""); }}
                disabled={!lastHeard}
                className="px-4 bg-red-500 text-white rounded-xl font-bold disabled:opacity-30"
              >
                Ekle
              </button>
            </div>

            <p className="text-[10px] mt-2 text-slate-400 h-4">
              Algılanan: <span className="text-blue-600 font-bold text-sm">{lastHeard}</span>
            </p>

            <div className="flex flex-wrap gap-1 mt-2">
              {customNoWords.map((w, i) => (
                <span key={i} className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] rounded-full">{w}</span>
              ))}
            </div>
          </div>

          <button
            onClick={startGame}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-lg mt-4 flex items-center justify-center gap-2"
          >
            OYUNA GEÇ <ArrowRight />
          </button>
        </div>
      )}

      {/* 2. OYUN */}
      {phase === 'playing' && (
        <div className="flex-1 flex flex-col relative bg-slate-50">
          <div className="p-4 flex justify-between items-center z-20">
            <button onClick={handleSafeClose} className="p-2 bg-white border rounded-full shadow-sm">
              <XCircle className="text-slate-300" />
            </button>

            <div className="px-4 py-1 bg-white shadow-sm rounded-full font-bold text-xs border">
              SORU: {questionCount + 1} / 10
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-8 p-4">
            <div className="flex items-center gap-4 sm:gap-12 w-full justify-center h-56">
              {/* SOL: HEDEF */}
              <div className="w-32 h-32 bg-white border-4 border-slate-200 rounded-[2rem] p-4 flex items-center justify-center relative">
                <img src={targetItem.src} className="w-full h-full object-contain" />
              </div>

              {/* SAĞ: EŞLEME (SAĞDAN KAYAR) */}
              <motion.div
                initial={{ x: 260, opacity: 0 }}
                animate={
                  animState === 'hidden'
                    ? { x: 260, opacity: 0 }
                    : { x: 0, opacity: 1 }
                }
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={twMerge(
                  "w-32 h-32 bg-white border-4 rounded-[2rem] p-4 flex items-center justify-center transition-colors duration-300",
                  feedback === 'correct' ? "border-green-500 bg-green-50" :
                  feedback === 'wrong' ? "border-red-500 bg-red-50" :
                  "border-slate-200"
                )}
              >
                <img src={compareItem.src} className="w-full h-full object-contain" />
              </motion.div>
            </div>

            {/* MİKROFON DURUMU */}
            <div className="flex flex-col items-center gap-3 h-32 justify-center w-full">
              {isListening ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-200 animate-pulse">
                    <Mic size={40} />
                  </div>
                  <span className="text-blue-600 font-black text-xs">DİNLİYORUM...</span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold h-6 min-w-[50px] text-center">
                    {lastHeard}
                  </span>
                </div>
              ) : feedback ? (
                <div className={twMerge("text-4xl font-black animate-in zoom-in", feedback === 'correct' ? "text-green-500" : "text-red-500")}>
                  {feedback === 'correct' ? "DOĞRU!" : "YANLIŞ"}
                </div>
              ) : (
                <button onClick={startEngineUserGesture} className="flex flex-col items-center gap-2 group">
                  <div className="w-20 h-20 bg-white border-4 border-slate-200 text-slate-400 rounded-full flex items-center justify-center group-hover:border-blue-400 group-hover:text-blue-500 transition-all shadow-sm">
                    <MicOff size={32} />
                  </div>
                  <span className="text-slate-400 text-xs font-bold group-hover:text-blue-500">MİKROFONU AÇ</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. SONUÇ */}
      {phase === 'success' && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center text-center p-8">
          <Trophy size={100} className="text-yellow-500 mb-6 animate-bounce" />
          <h1 className="text-3xl font-black mb-2 uppercase text-slate-800">Tebrikler!</h1>
          <button onClick={() => onComplete(true)} className="bg-green-600 text-white px-12 py-5 rounded-2xl font-bold text-xl shadow-xl">
            KAYDET VE ÇIK
          </button>
        </div>
      )}
    </div>
  );
}
