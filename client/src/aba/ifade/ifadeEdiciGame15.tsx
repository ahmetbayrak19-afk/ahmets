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

// --- SESLER ---
import aferin1 from '../esle/ses/aferin1.mp3';
import bravo from '../esle/ses/bravo.mp3';
import tekrardene1 from '../esle/ses/tekrardene1.mp3';
import aynimi from '../esle/ses/aynimi.mp3'; // <-- dosyanın path'ini gerekirse düzelt

const ITEMS = [
  { id: 'anahtar', src: anahtarImg, label: 'Anahtar' },
  { id: 'araba', src: arabaImg, label: 'Araba' },
  { id: 'kalem', src: kalemImg, label: 'Kalem' },
  { id: 'top', src: topImg, label: 'Top' },
];

const STANDARD_YES = ['evet', 'eved', 'he', 'hıhı', 'doğru', 'tamam', 'evetevet', 'olur', 'aynen'];
const STANDARD_NO = ['hayır', 'yok', 'cık', 'değil', 'olmaz', 'hayı', 'yanlış'];

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

  // --- REFS ---
  const isMountedRef = useRef(true);

  const recognitionRef = useRef<any>(null);
  const recModeRef = useRef<RecMode>('off');

  const phaseRef = useRef<Phase>(phase);
  const feedbackRef = useRef<typeof feedback>(feedback);

  const customYesRef = useRef<string[]>(customYesWords);
  const customNoRef = useRef<string[]>(customNoWords);

  // stale fix: isMatch ref
  const isMatchRef = useRef<boolean>(true);

  // oyunda kontrol
  const answerWindowOpenRef = useRef(false); // true iken evet/hayır kabul
  const answeredRef = useRef(false);         // bu soruda cevap alındı mı?

  // mic gerçekten açık mı olmalı? (soru mp3 bitince true, cevap alınca false)
  const shouldListenRef = useRef(false);

  // spam/çift tetikleme
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

  // --- Audio helper: mp3 bitince callback ---
  const playFx = (src: string, onDone?: () => void) => {
    try {
      const a = new Audio(src);

      const finish = () => {
        try { a.onended = null; } catch {}
        onDone?.();
      };

      // emniyet: bazı cihazlarda onended kaçarsa
      const safety = window.setTimeout(finish, 6000);

      a.onended = () => {
        clearTimeout(safety);
        finish();
      };

      a.play().catch(() => {
        clearTimeout(safety);
        finish();
      });
    } catch {
      onDone?.();
    }
  };

  // --- SpeechRecognition ---
  const createRecognition = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return null;

    const rec = new SR();
    rec.lang = 'tr-TR';
    rec.maxAlternatives = 1;
    rec.interimResults = false;
    rec.continuous = true;

    rec.onstart = () => {
      if (isMountedRef.current) setIsListening(true);
    };

    rec.onerror = () => {
      if (isMountedRef.current) setIsListening(false);
    };

    rec.onend = () => {
      if (isMountedRef.current) setIsListening(false);

      // setup'ta restart yok
      const mode = recModeRef.current;
      if (mode === 'setup_yes' || mode === 'setup_no' || mode === 'off') return;

      // oyun: "dinlemeli miyiz?" true ise yeniden başlat
      if (mode === 'game' && phaseRef.current === 'playing' && shouldListenRef.current && isMountedRef.current) {
        setTimeout(() => {
          if (!isMountedRef.current) return;
          if (recModeRef.current !== 'game') return;
          if (phaseRef.current !== 'playing') return;
          if (!shouldListenRef.current) return;
          try { recognitionRef.current?.start(); } catch {}
        }, 300);
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

      if (mode === 'setup_yes' || mode === 'setup_no') return;

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

  const startRecognition = () => {
    const rec = ensureRecognition();
    if (!rec) return;
    try { rec.start(); } catch {}
  };

  const stopRecognition = () => {
    try { recognitionRef.current?.abort?.(); } catch {}
    if (isMountedRef.current) setIsListening(false);
  };

  const killEverything = () => {
    answerWindowOpenRef.current = false;
    answeredRef.current = false;
    shouldListenRef.current = false;
    lastDetectedRef.current = null;

    try { recognitionRef.current?.abort?.(); } catch {}
    recognitionRef.current = null;
    recModeRef.current = 'off';

    if (isMountedRef.current) setIsListening(false);
  };

  const handleSafeClose = () => {
    killEverything();
    onClose();
  };

  // --- detect yes/no ---
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

    // cevap alındı -> mikrofonu kapat
    answeredRef.current = true;
    answerWindowOpenRef.current = false;
    shouldListenRef.current = false;
    stopRecognition();

    lastTriggerAtRef.current = now;
    lastDetectedRef.current = detected;

    checkAnswer(detected);
  };

  const checkAnswer = (userSays: 'yes' | 'no') => {
    const expected: 'yes' | 'no' = isMatchRef.current ? 'yes' : 'no';
    if (userSays === expected) handleSuccess();
    else handleFail();
  };

  // --- Setup (eski gibi: Söylet/Dur) ---
  const toggleSetupRecord = (type: 'yes' | 'no') => {
    const rec = ensureRecognition();
    if (!rec) return;

    if (isRecordingSetup === type) {
      setIsRecordingSetup(null);
      recModeRef.current = 'off';
      shouldListenRef.current = false;
      stopRecognition();
      return;
    }

    setIsRecordingSetup(type);
    recModeRef.current = type === 'yes' ? 'setup_yes' : 'setup_no';
    shouldListenRef.current = true;
    startRecognition();
  };

  // --- Game flow ---
  const initGame = () => setPhase('setup');

  const startGame = () => {
    setIsRecordingSetup(null);

    recModeRef.current = 'game';
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
    if (phase !== 'playing') {
      shouldListenRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const generateQuestion = () => {
    setFeedback(null);
    setAnimState('hidden');

    // yeni soru reset
    answeredRef.current = false;
    answerWindowOpenRef.current = false;
    shouldListenRef.current = false;
    lastDetectedRef.current = null;

    // yeni soruda mic kapalı; zaten kapatalım
    stopRecognition();

    const target = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    const shouldMatch = Math.random() > 0.5;

    let compare = target;
    if (!shouldMatch) {
      const others = ITEMS.filter(i => i.id !== target.id);
      compare = others[Math.floor(Math.random() * others.length)] || target;
    }

    setTargetItem(target);
    setCompareItem(compare);

    setIsMatch(shouldMatch);
    isMatchRef.current = shouldMatch;

    setTimeout(() => {
      if (!isMountedRef.current) return;
      setAnimState('sliding');

      setTimeout(() => {
        if (!isMountedRef.current) return;
        setAnimState('visible');

        // resimler göründü -> "aynı mı?" mp3 -> bitince dinleme aç
        askAyniMiThenListen();
      }, 900);
    }, 250);
  };

  const askAyniMiThenListen = () => {
    // MP3 çalarken mic kapalı kalsın
    answeredRef.current = false;
    answerWindowOpenRef.current = false;
    shouldListenRef.current = false;
    stopRecognition();

    playFx(aynimi, () => {
      if (!isMountedRef.current) return;

      // MP3 bitti -> şimdi cevap bekle ve mic aç
      answeredRef.current = false;
      answerWindowOpenRef.current = true;
      shouldListenRef.current = true;
      startRecognition();
    });
  };

  const handleSuccess = () => {
    setFeedback('correct');

    const fx = Math.random() > 0.5 ? aferin1 : bravo;

    playFx(fx, () => {
      if (!isMountedRef.current) return;

      const nextQ = questionCount + 1;
      setQuestionCount(nextQ);

      if (nextQ < 10) {
        generateQuestion();
      } else {
        setPhase('success');
        try { confetti(); } catch {}
      }
    });
  };

  const handleFail = () => {
    setFeedback('wrong');

    playFx(tekrardene1, () => {
      if (!isMountedRef.current) return;

      // Yanlışta: aynı soruyu tekrar sor (aynimi.mp3) ve sonra mic aç
      setFeedback(null);
      lastDetectedRef.current = null;
      lastTriggerAtRef.current = Date.now();

      askAyniMiThenListen();
    });
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
                <div className="text-slate-400 text-xs font-bold">
                  {answerWindowOpenRef.current ? "Cevap bekliyorum..." : "Soru soruluyor / bekle..."}
                </div>
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
