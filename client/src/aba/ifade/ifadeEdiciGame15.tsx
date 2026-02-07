import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, XCircle, Mic, MicOff, ArrowRight, Trophy } from "lucide-react";
import confetti from "canvas-confetti";
import { twMerge } from "tailwind-merge";

// --- GÖRSELLER (şimdilik projede kesin olanlar) ---
import anahtarImg from "../esle/anahtar.png";
import arabaImg from "../esle/araba.png";
import kalemImg from "../esle/kalem.png";
import topImg from "../esle/top.png";

// --- GERİBİLDİRİM SESLERİ (mevcut projenden) ---
import aferin1 from "../esle/ses/aferin1.mp3";
import bravo from "../esle/ses/bravo.mp3";
import tekrardene1 from "../esle/ses/tekrardene1.mp3";

// --- SORU SESLERİ (client/src/aba/ifade) ---
import anahtarmi from "./anahtarmi.mp3";
import arabami from "./arabami.mp3";
import cicekmi from "./cicekmi.mp3";
import dolapmi from "./dolapmi.mp3";
import elmami from "./elmami.mp3";
import gitarmi from "./gitarmi.mp3";
import havucmu from "./havucmu.mp3";
import kalemmi from "./kalemmi.mp3";
import kamyonmu from "./kamyonmu.mp3";
import kapimi from "./kapimi.mp3";
import kopekmi from "./kopekmi.mp3";
import masami from "./masami.mp3";
import sekermi from "./sekermi.mp3";
import tavsanmi from "./tavsanmi.mp3";
import tavukmu from "./tavukmu.mp3";
import telefonmu from "./telefonmu.mp3";
import topmu from "./topmu.mp3";
import yumurtami from "./yumurtami.mp3";

type Phase = "init" | "setup" | "menu" | "playing_object" | "success";
type ModeKey = "object" | "compare" | "feature" | "category";

const STANDARD_YES = ["evet", "eved", "he", "hıhı", "doğru", "tamam", "evetevet", "olur", "aynen"];
const STANDARD_NO = ["hayır", "yok", "cık", "değil", "olmaz", "hayı", "yanlış"];

// Nesne Tanıma: ekranda gösterilecek görseller (şimdilik 4 adet)
const VISUAL_ITEMS = [
  { id: "anahtar", label: "Anahtar", img: anahtarImg },
  { id: "araba", label: "Araba", img: arabaImg },
  { id: "kalem", label: "Kalem", img: kalemImg },
  { id: "top", label: "Top", img: topImg },
] as const;

// Soru ses havuzu (bu sesler üzerinden “Bu X mi?” sorulacak)
const PROMPT_AUDIO: Record<string, { label: string; src: string }> = {
  anahtar: { label: "Anahtar", src: anahtarmi },
  araba: { label: "Araba", src: arabami },
  cicek: { label: "Çiçek", src: cicekmi },
  dolap: { label: "Dolap", src: dolapmi },
  elma: { label: "Elma", src: elmami },
  gitar: { label: "Gitar", src: gitarmi },
  havuc: { label: "Havuç", src: havucmu },
  kalem: { label: "Kalem", src: kalemmi },
  kamyon: { label: "Kamyon", src: kamyonmu },
  kapi: { label: "Kapı", src: kapimi },
  kopek: { label: "Köpek", src: kopekmi },
  masa: { label: "Masa", src: masami },
  seker: { label: "Şeker", src: sekermi },
  tavsan: { label: "Tavşan", src: tavsanmi },
  tavuk: { label: "Tavuk", src: tavukmu },
  telefon: { label: "Telefon", src: telefonmu },
  top: { label: "Top", src: topmu },
  yumurta: { label: "Yumurta", src: yumurtami },
};

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function IfadeEdiciGame15({ onClose, onComplete }: any) {
  const [phase, setPhase] = useState<Phase>("init");

  // --- Kalibrasyon
  const [customYesWords, setCustomYesWords] = useState<string[]>([]);
  const [customNoWords, setCustomNoWords] = useState<string[]>([]);
  const [lastHeard, setLastHeard] = useState<string>("");
  const [isRecordingSetup, setIsRecordingSetup] = useState<"yes" | "no" | null>(null);

  // --- Menü (çoklu seçim)
  const [selectedModes, setSelectedModes] = useState<Record<ModeKey, boolean>>({
    object: true,
    compare: false,
    feature: false,
    category: false,
  });

  // --- Oyun
  const [questionCount, setQuestionCount] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const [visualItem, setVisualItem] = useState(VISUAL_ITEMS[0]); // gösterilen resim
  const [askedKey, setAskedKey] = useState<string>("anahtar"); // sorulan “...mi” key (PROMPT_AUDIO key)
  const [isMatch, setIsMatch] = useState<boolean>(true); // sorulan doğru mu?

  const [animState, setAnimState] = useState<"hidden" | "sliding" | "visible">("hidden");
  const [isListening, setIsListening] = useState(false);

  // --- Refs (zamanlama/kararlılık)
  const isMountedRef = useRef(true);
  const recognitionRef = useRef<any>(null);

  const answerWindowOpenRef = useRef(false); // sadece true iken evet/hayır kabul
  const shouldListenRef = useRef(false); // mikrofon açık olmalı mı?
  const answeredRef = useRef(false); // bu soruda cevap alındı mı?

  const customYesRef = useRef<string[]>(customYesWords);
  const customNoRef = useRef<string[]>(customNoWords);
  const isMatchRef = useRef<boolean>(true);
  const askedKeyRef = useRef<string>(askedKey);

  const lastTriggerAtRef = useRef(0);
  const lastDetectedRef = useRef<"yes" | "no" | null>(null);

  useEffect(() => { customYesRef.current = customYesWords; }, [customYesWords]);
  useEffect(() => { customNoRef.current = customNoWords; }, [customNoWords]);
  useEffect(() => { isMatchRef.current = isMatch; }, [isMatch]);
  useEffect(() => { askedKeyRef.current = askedKey; }, [askedKey]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      killEverything();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Audio helper (mp3 bitince callback)
  const playAudio = (src: string, onDone?: () => void) => {
    try {
      const a = new Audio(src);
      const finish = () => {
        try { a.onended = null; } catch {}
        onDone?.();
      };
      const safety = window.setTimeout(finish, 7000);
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

  // --- SpeechRecognition
  const createRecognition = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return null;

    const rec = new SR();
    rec.lang = "tr-TR";
    rec.maxAlternatives = 1;
    rec.interimResults = false;
    rec.continuous = true;

    rec.onstart = () => { if (isMountedRef.current) setIsListening(true); };
    rec.onerror = () => { if (isMountedRef.current) setIsListening(false); };

    rec.onend = () => {
      if (isMountedRef.current) setIsListening(false);
      // sadece “dinlemeli” durumdaysak geri aç
      if (!isMountedRef.current) return;
      if (phase !== "playing_object") return;
      if (!shouldListenRef.current) return;

      setTimeout(() => {
        if (!isMountedRef.current) return;
        if (phase !== "playing_object") return;
        if (!shouldListenRef.current) return;
        try { recognitionRef.current?.start(); } catch {}
      }, 300);
    };

    rec.onresult = (event: any) => {
      if (!isMountedRef.current) return;

      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      const lower = transcript.trim().toLowerCase();
      setLastHeard(lower);

      // Setup’ta sadece gösteriyoruz
      if (phase === "setup") return;

      // Oyun: sadece cevap penceresi açıkken yakala
      if (phase === "playing_object") {
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
    // audio tarafını “hard stop” edemiyoruz (Audio handle saklamıyoruz) ama mic’i kapatıyoruz
    answerWindowOpenRef.current = false;
    shouldListenRef.current = false;
    answeredRef.current = false;
    lastDetectedRef.current = null;

    stopRecognition();
    recognitionRef.current = null;
  };

  const handleSafeClose = () => {
    killEverything();
    onClose();
  };

  // --- Detect yes/no
  const detectYesNo = (transcript: string): "yes" | "no" | null => {
    const words = transcript.split(/\s+/).filter(Boolean);
    const YES_POOL = [...STANDARD_YES, ...customYesRef.current];
    const NO_POOL = [...STANDARD_NO, ...customNoRef.current];

    let detected: "yes" | "no" | null = null;
    for (const word of words) {
      if (YES_POOL.some(w => word === w || word.includes(w))) detected = "yes";
      else if (NO_POOL.some(w => word === w || word.includes(w))) detected = "no";
    }
    return detected;
  };

  const checkTranscriptForGame = (transcript: string) => {
    if (!answerWindowOpenRef.current) return;
    if (answeredRef.current) return;
    if (feedback) return;

    const now = Date.now();
    if (now - lastTriggerAtRef.current < 450) return;

    const detected = detectYesNo(transcript);
    if (!detected) return;

    if (lastDetectedRef.current === detected && now - lastTriggerAtRef.current < 1000) return;

    // Cevap alındı: mic kapat
    answeredRef.current = true;
    answerWindowOpenRef.current = false;
    shouldListenRef.current = false;
    stopRecognition();

    lastTriggerAtRef.current = now;
    lastDetectedRef.current = detected;

    checkAnswer(detected);
  };

  const checkAnswer = (userSays: "yes" | "no") => {
    const expected: "yes" | "no" = isMatchRef.current ? "yes" : "no";
    if (userSays === expected) handleSuccess();
    else handleFail();
  };

  // --- Setup kontrolü (Söylet/Dur)
  const toggleSetupRecord = (type: "yes" | "no") => {
    ensureRecognition();

    if (isRecordingSetup === type) {
      setIsRecordingSetup(null);
      shouldListenRef.current = false;
      stopRecognition();
      return;
    }

    setIsRecordingSetup(type);
    shouldListenRef.current = true;
    startRecognition();
  };

  // --- Menü
  const toggleMode = (key: ModeKey) => {
    setSelectedModes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const canStartFromMenu = useMemo(() => {
    // Şimdilik sadece nesne tanıma çalışıyor
    return selectedModes.object;
  }, [selectedModes.object]);

  const startFromMenu = () => {
    // şimdilik object seçiliyse başla
    if (!selectedModes.object) return;

    setFeedback(null);
    setQuestionCount(0);
    setPhase("playing_object");
    setTimeout(() => generateObjectQuestion(), 50);
  };

  // --- Nesne Tanıma: soru üretimi
  const allPromptKeys = useMemo(() => Object.keys(PROMPT_AUDIO), []);

  const generateObjectQuestion = () => {
    setFeedback(null);
    setAnimState("hidden");

    answeredRef.current = false;
    answerWindowOpenRef.current = false;
    shouldListenRef.current = false;
    lastDetectedRef.current = null;

    stopRecognition(); // soru sorulmadan mic kapalı

    // 1) görsel seç (şimdilik 4)
    const v = pickRandom(VISUAL_ITEMS);
    setVisualItem(v);

    // 2) soru doğru mu yanlış mı?
    const shouldMatch = Math.random() > 0.5;
    setIsMatch(shouldMatch);
    isMatchRef.current = shouldMatch;

    // 3) sorulacak key
    let key = v.id; // doğru soruda resmin kendi adı
    if (!shouldMatch) {
      const others = allPromptKeys.filter(k => k !== v.id);
      key = pickRandom(others);
    }
    setAskedKey(key);
    askedKeyRef.current = key;

    // animasyon -> soru sesi -> dinleme
    setTimeout(() => {
      if (!isMountedRef.current) return;
      setAnimState("sliding");
      setTimeout(() => {
        if (!isMountedRef.current) return;
        setAnimState("visible");
        askObjectQuestionThenListen();
      }, 650);
    }, 200);
  };

  const askObjectQuestionThenListen = () => {
    // soru sesini çal, bitince mic aç
    answeredRef.current = false;
    answerWindowOpenRef.current = false;
    shouldListenRef.current = false;
    stopRecognition();

    const key = askedKeyRef.current;
    const prompt = PROMPT_AUDIO[key];

    playAudio(prompt.src, () => {
      if (!isMountedRef.current) return;

      answeredRef.current = false;
      answerWindowOpenRef.current = true;
      shouldListenRef.current = true;
      startRecognition();
    });
  };

  const playFeedbackThen = (correct: boolean, cb: () => void) => {
    const src = correct ? (Math.random() > 0.5 ? aferin1 : bravo) : tekrardene1;
    playAudio(src, () => {
      if (!isMountedRef.current) return;
      cb();
    });
  };

  const handleSuccess = () => {
    setFeedback("correct");

    playFeedbackThen(true, () => {
      const next = questionCount + 1;
      setQuestionCount(next);

      if (next < 10) {
        generateObjectQuestion();
      } else {
        setPhase("success");
        try { confetti(); } catch {}
      }
    });
  };

  const handleFail = () => {
    setFeedback("wrong");

    // Yanlışta: “tekrar dene” bitince aynı soruyu tekrar sor (aynı mp3) ve mic aç
    playFeedbackThen(false, () => {
      setFeedback(null);
      lastDetectedRef.current = null;
      lastTriggerAtRef.current = Date.now();
      askObjectQuestionThenListen();
    });
  };

  // --- ekranlar
  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col font-sans select-none overflow-hidden touch-none overscroll-none text-slate-800 min-h-screen">
      {/* INIT */}
      {phase === "init" && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
          <button onClick={handleSafeClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full">
            <XCircle className="text-slate-400" />
          </button>

          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <Mic size={48} className="text-blue-600" />
          </div>

          <h1 className="text-2xl font-black mb-4">Hazır mısın?</h1>

          <button
            onClick={() => setPhase("setup")}
            className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold text-xl shadow-xl active:scale-95 transition-all"
          >
            BAŞLA
          </button>
        </div>
      )}

      {/* SETUP */}
      {phase === "setup" && (
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
                onClick={() => toggleSetupRecord("yes")}
                className={twMerge(
                  "flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2",
                  isRecordingSetup === "yes" ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 border"
                )}
              >
                {isRecordingSetup === "yes" ? <MicOff size={18} /> : <Mic size={18} />}
                {isRecordingSetup === "yes" ? "Dur" : "Söylet"}
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
                onClick={() => toggleSetupRecord("no")}
                className={twMerge(
                  "flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2",
                  isRecordingSetup === "no" ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 border"
                )}
              >
                {isRecordingSetup === "no" ? <MicOff size={18} /> : <Mic size={18} />}
                {isRecordingSetup === "no" ? "Dur" : "Söylet"}
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
            onClick={() => { stopRecognition(); setIsRecordingSetup(null); setPhase("menu"); }}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-lg mt-2 flex items-center justify-center gap-2"
          >
            MENÜYE GEÇ <ArrowRight />
          </button>
        </div>
      )}

      {/* MENU */}
      {phase === "menu" && (
        <div className="flex-1 flex flex-col p-6 gap-4 max-w-2xl mx-auto w-full relative">
          <button onClick={handleSafeClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full">
            <XCircle className="text-slate-400" />
          </button>

          <h1 className="text-2xl font-black mt-6">Kazanım Seçimi</h1>
          <p className="text-sm text-slate-500">Öğretmen bir veya birkaçını seçebilir.</p>

          <div className="grid gap-3 mt-2">
            <button
              onClick={() => toggleMode("object")}
              className={twMerge(
                "w-full text-left p-4 rounded-2xl border-2 flex items-center justify-between",
                selectedModes.object ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"
              )}
            >
              <div>
                <div className="font-black">Nesne Tanıma</div>
                <div className="text-xs text-slate-500">“Bu masa mı?” (evet/hayır)</div>
              </div>
              <div className={twMerge("text-xs font-bold px-3 py-1 rounded-full", selectedModes.object ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500")}>
                {selectedModes.object ? "Seçili" : "Seç"}
              </div>
            </button>

            <div className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white opacity-60">
              <div className="font-black">Karşılaştırma</div>
              <div className="text-xs text-slate-500">“Bu resimler aynı mı?” (yakında)</div>
            </div>

            <div className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white opacity-60">
              <div className="font-black">Özellik ve Fonksiyon</div>
              <div className="text-xs text-slate-500">Renk/şekil/kullanım soruları (yakında)</div>
            </div>

            <div className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white opacity-60">
              <div className="font-black">Kategorilendirme</div>
              <div className="text-xs text-slate-500">“Bu bir meyve mi?” (yakında)</div>
            </div>
          </div>

          <button
            onClick={startFromMenu}
            disabled={!canStartFromMenu}
            className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-xl shadow-lg mt-3 disabled:opacity-40"
          >
            BAŞLAT
          </button>
        </div>
      )}

      {/* PLAYING: OBJECT RECOGNITION */}
      {phase === "playing_object" && (
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
            {/* Tek görsel */}
            <div className="w-full flex justify-center">
              <motion.div
                initial={{ x: 260, opacity: 0 }}
                animate={animState === "hidden" ? { x: 260, opacity: 0 } : { x: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={twMerge(
                  "w-40 h-40 bg-white border-4 rounded-[2rem] p-4 flex items-center justify-center transition-colors duration-300",
                  feedback === "correct" ? "border-green-500 bg-green-50" :
                  feedback === "wrong" ? "border-red-500 bg-red-50" :
                  "border-slate-200"
                )}
              >
                <img src={visualItem.img} className="w-full h-full object-contain" />
              </motion.div>
            </div>

            {/* Mic durum */}
            <div className="flex flex-col items-center gap-2 h-28 justify-center w-full">
              {isListening ? (
                <>
                  <div className="w-20 h-20 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-200 animate-pulse">
                    <Mic size={40} />
                  </div>
                  <span className="text-blue-600 font-black text-xs">DİNLİYORUM...</span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold h-6 min-w-[80px] text-center">
                    {lastHeard}
                  </span>
                </>
              ) : feedback ? (
                <div className={twMerge("text-4xl font-black animate-in zoom-in", feedback === "correct" ? "text-green-500" : "text-red-500")}>
                  {feedback === "correct" ? "DOĞRU!" : "YANLIŞ"}
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

      {/* SUCCESS */}
      {phase === "success" && (
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
