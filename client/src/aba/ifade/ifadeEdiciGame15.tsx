import { useEffect, useRef, useState } from 'react';
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
const STANDARD_NO  = ['hayır', 'yok', 'cık', 'değil', 'olmaz', 'hayı', 'yanlış'];

type Phase = 'init' | 'setup' | 'playing' | 'success';
type RecMode = 'off' | 'setup_yes' | 'setup_no' | 'game';

export default function IfadeEdiciGame15({ onClose, onComplete }: any) {
  const [phase, setPhase] = useState<Phase>('init');

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

  // --- refs ---
  const isMountedRef = useRef(true);

  const recognitionRef = useRef<any>(null);
  const recModeRef = useRef<RecMode>('off');
  const engineWantedRef = useRef(false); // playing boyunca true -> mic kapanırsa yeniden aç

  const phaseRef = useRef<Phase>(phase);
  const feedbackRef = useRef<typeof feedback>(feedback);

  const customYesRef = useRef<string[]>(customYesWords);
  const customNoRef = useRef<string[]>(customNoWords);

  // >>> KRİTİK: isMatch’i ref’ten okuyacağız (stale fix)
  const isMatchRef = useRef<boolean>(true);

  // Oyun: sadece bu true iken evet/hayır kabul et
  const answerWindowOpenRef = useRef(false);

  // Oyun: bu soruda cevap yakalandı mı?
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

  // --- güvenli TTS ---
  const safeCancelTTS = () => {
    try {
      const synth = (window as any)?.speechSynthesis;
      synth?.cancel?.();
    } catch {}
  };

  const safeSpeak = (text: string, onEnd?: () => void) => {
    try {
      const synth = (window as any)?.speechSynthesis;
      const Utter = (window as any)?.SpeechSynthesisUtterance;
      if (!synth || !Utter) { onEnd?.(); return; }

      const u = new Utter(text);
      u.lang = 'tr-TR';
      u.rate = 1.0;
      u.onend = () => onEnd?.();

      synth.cancel?.();
      synth.speak?.(u);
    } catch {
      onEnd?.();
    }
  };

  // --- SpeechRecognition ---
  const createRecognition = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return null;

    const rec = new SR();
    rec.lang = 'tr-TR';
    rec.maxAlternatives = 1;

    // Setup daha stabil olsun
    rec.interimResults = false;
    rec.continuous = true;

    rec.onstart = () => {
      if (isMountedRef.current) setIsListening(true);
    };

    rec.onerror = () => {
      if (isMountedRef.current) setIsListening(false);
      // restart yok (no-speech döngüsünü tetiklemesin)
    };

    rec.onend = () => {
      if (isMountedRef.current) setIsListening(false);

      // Setup’ta asla kendini aç/kapa yapma
      const mode = recModeRef.current;
      if (mode === 'setup_yes' || mode === 'setup_no' || mode === 'off') return;

      // >>> KRİTİK FIX: Game modunda playing boyunca mic kapanırsa DAİMA geri aç
      if (mode === 'game' && engineWantedRef.current && phaseRef.current === 'playing' && isMountedRef.current) {
        setTimeout(() => {
          if (!isMountedRef.current) return;
          if (recModeRef.current !== 'game') return;
          if (!engineWantedRef.current) return;
          if (phaseRef.current !== 'playing') return;
          try { recognitionRef.current?.start(); } catch {}
        }, 350);
      }
    };

    rec.onresult = (event: any) => {
      if (!isMountedRef.current) return;

      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      const lower = transcript.trim().toLowerCase();
      setLastHeard(lower);

      const mode = recModeRef.current;

      if (mode === 'setup_yes' || mode === 'setup_no') {
        return; // setup’ta sadece gösteriyoruz
      }

      if (mode === 'game' && phaseRef.current === 'playing') {
        checkTranscriptForGame(lower);
      }
    };

    return rec;
  };

  const ensureRecognition = () => {
    if (!recognitionRef.current) recognitionRef.current = createRecognition();
    return recognitionRef.current;
  };

  const stopRecognition = () => {
    try { recognitionRef.current?.abort?.(); } catch {}
    recModeRef.current = 'off';
    if (isMountedRef.current) setIsListening(false);
  };

  const killEverything = () => {
    safeCancelTTS();

    answerWindowOpenRef.current = false;
    answeredRef.current = false;
    lastDetectedRef.current = null;
    engineWantedRef.current = false;

    try { recognitionRef.current?.abort?.(); } catch {}
    recognitionRef.current = null;
    recModeRef.current = 'off';

    if (isMountedRef.current) setIsListening(false);
  };

  const handleSafeClose = () => {
    killEverything();
    onClose();
  };

  // --- detect ---
  const detectYesNo = (transcript: string): 'yes' | 'no' | null => {
    const words = transcript.split(/\s+/).filter(Boolean);
    const YES_POOL = [...STANDARD_YES, ...customYesRef.current];
    const NO_POOL  = [...STANDARD_NO, ...customNoRef.current];

    let detected: 'yes' | 'no' | null = null;
    for (const word of words) {
      if (YES_POOL.some(w => word === w || word.includes(w))) detected = 'yes';
      else if (NO_POOL.some(w => word === w || word.includes(w))) detected = 'no';
    }
    return detected;
  };

  const checkTranscriptForGame = (transcript: string) => {
    if (!answerWindowOpenRef.current) return;
    if (answeredRef.current) return;
    if (feedbackRef.current) return;

    const now = Date.now();
    if (now - lastTriggerAtRef.current < 450) return;

    const detected = detectYesNo(transcript);
    if (!detected) return;

    if (lastDetectedRef.current === detected && now - lastTriggerAtRef.current < 1000) return;

    // >>> kelime yakalandı => bu soru cevaplandı (kilit)
    answeredRef.current = true;
    answerWindowOpenRef.current = false;

    lastTriggerAtRef.current = now;
    lastDetectedRef.current = detected;

    checkAnswer(detected);
  };

  const playFx = (src: string) => {
    try { new Audio(src).play().catch(() => {}); } catch {}
  };

  // >>> KRİTİK FIX: expected artık isMatchRef’ten okunur (stale yok)
  const checkAnswer = (userSays: 'yes' | 'no') => {
    if (feedbackRef.current) return;

    const expected: 'yes' | 'no' = isMatchRef.current ? 'yes' : 'no';
    if (userSays === expected) handleSuccess();
    else handleFail();
  };

  // --- akış ---
  const initGame = () => setPhase('setup');

  // Setup: eski mantık Söylet/Dur
  const toggleSetupRecord = (type: 'yes' | 'no') => {
    const rec = ensureRecognition();
    if (!rec) return;

    if (isRecordingSetup === type) {
      setIsRecordingSetup(null);
      recModeRef.current = 'off';
      stopRecognition();
      return;
    }

    setIsRecordingSetup(type);
    recModeRef.current = type === 'yes' ? 'setup_yes' : 'setup_no';
    try { rec.start(); } catch {}
  };

  const startGame = () => {
    setIsRecordingSetup(null);

    const rec = ensureRecognition();
    if (rec) {
      recModeRef.current = 'game';
      engineWantedRef.current = true; // playing boyunca mic’i ayakta tut
      try { rec.start(); } catch {}
    }

    startedPlayingOnceRef.current = false;
    setFeedback(null);
    setQuestionCount(0);
    setPhase('playing');
  };

  useEffect(() => {
    if (phase === 'playing' && !startedPlayingOnceRef.current) {
      startedPlayingOnceRef.current = true;
      generateQuestion();
    }

    // playing dışına çıkınca mic’i zorlamayı kapat
    if (phase !== 'playing') {
      engineWantedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const generateQuestion = () => {
    setFeedback(null);
    setAnimState('hidden');

    answeredRef.current = false;
    answerWindowOpenRef.current = false;
    lastDetectedRef.current = null;

    safeCancelTTS();

    const target = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    const shouldMatch = Math.random() > 0.5;

    let compare = target;
    if (!shouldMatch) {
      const others = ITEMS.filter(i => i.id !== target.id);
      compare = others[Math.floor(Math.random() * others.length)] || target;
    }

    setTargetItem(target);
    setCompareItem(compare);

    // >>> KRİTİK: hem state hem ref güncelle
    setIsMatch(shouldMatch);
    isMatchRef.current = shouldMatch;

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
    safeCancelTTS();

    answeredRef.current = false;
    answerWindowOpenRef.current = false;
    lastDetectedRef.current = null;

    safeSpeak('Doğru eşledim mi?', () => {
      if (!isMountedRef.current) return;
      setTimeout(() => {
        answerWindowOpenRef.current = true; // şimdi evet/hayır bekle
      }, 250);
    });
  };

  const handleSuccess = () => {
    answerWindowOpenRef.current = false;
    answeredRef.current = true;

    playFx(Math.random() > 0.5 ? aferin1 : bravo);
    setFeedback('correct');

    setTimeout(() => {
      if (!isMountedRef.current) return;

      const nextQ = questionCount + 1;
      setQuestionCount(nextQ);

      if (nextQ < 10) generateQuestion();
      else {
        setPhase('success');
        try { confetti(); } catch {}
      }
    }, 2200);
  };

  const handleFail = () => {
    answerWindowOpenRef.current = false;
    answeredRef.current = true;

    playFx(tekrardene1);
    setFeedback('wrong');

    // yanlışta: aynı soruda cevap penceresini tekrar aç
    setTimeout(() => {
      if (!isMountedRef.current) return;

      setFeedback(null);

      lastDetectedRef.current = null;
      lastTriggerAtRef.current = Date.now();

      answeredRef.current = false;
      answerWindowOpenRef.current = true;
    }, 1800);
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
              <div className="w-32 h-32 bg-white border-4 border-slate-200 rounded-[2rem] p-4 flex items-center justify-center relative">
                <img src={targetItem.src} className="w-full h-full object-contain" />
              </div>

              <motion.div
                initial={{ x: 260, opacity: 0 }}
                animate={animState === 'hidden' ? { x: 260, opacity: 0 } : { x: 0, opacity: 1 }}
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
                <div className="text-slate-400 text-xs font-bold">Mikrofon kapalı (izin/destek)</div>
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
