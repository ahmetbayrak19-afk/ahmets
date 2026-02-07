import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { Check, XCircle, Trophy, Mic, MicOff, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";
import { twMerge } from "tailwind-merge";

// --- GÖRSELLER ---
import anahtarImg from "../esle/anahtar.png";
import arabaImg from "../esle/araba.png";
import kalemImg from "../esle/kalem.png";
import topImg from "../esle/top.png";

// --- GERİBİLDİRİM SESLERİ ---
import aferin1 from "../esle/ses/aferin1.mp3";
import bravo from "../esle/ses/bravo.mp3";
import tekrardene1 from "../esle/ses/tekrardene1.mp3";

// --- “Aynı mı?” soru sesi ---
import aynimi from "../esle/ses/aynimi.mp3";

// --- Nesne tanıma soru sesleri (client/src/aba/ifade) ---
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

type Phase = "init" | "setup" | "menu" | "playing" | "success";
type ModeKey = "object" | "compare" | "feature" | "category";

const STANDARD_YES = ["evet", "eved", "he", "hıhı", "doğru", "tamam", "evetevet", "olur", "aynen"];
const STANDARD_NO = ["hayır", "yok", "cık", "değil", "olmaz", "hayı", "yanlış"];

const VISUAL_ITEMS = [
  { id: "anahtar", label: "Anahtar", img: anahtarImg },
  { id: "araba", label: "Araba", img: arabaImg },
  { id: "kalem", label: "Kalem", img: kalemImg },
  { id: "top", label: "Top", img: topImg },
] as const;

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
  const phaseRef = useRef<Phase>("init");
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // ✅ sadece yeni soruda artar
  const [questionUid, setQuestionUid] = useState(0);

  // ✅ Animasyon kontrolü (RE-RENDER’DA TEKRAR OYNAMAZ)
  const objectAnim = useAnimation();
  const compareRightAnim = useAnimation();

  // Sadece questionUid değişince animasyonu bir kez oynat
  useEffect(() => {
    // object kutusu için
    objectAnim.set({ x: 260, opacity: 0 });
    objectAnim.start({ x: 0, opacity: 1, transition: { duration: 0.55, ease: "easeOut" } });

    // compare sağ kutu için
    compareRightAnim.set({ x: 260, opacity: 0 });
    compareRightAnim.start({ x: 0, opacity: 1, transition: { duration: 0.55, ease: "easeOut" } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionUid]);

  // --- Kalibrasyon
  const [customYesWords, setCustomYesWords] = useState<string[]>([]);
  const [customNoWords, setCustomNoWords] = useState<string[]>([]);
  const customYesRef = useRef<string[]>([]);
  const customNoRef = useRef<string[]>([]);
  useEffect(() => {
    customYesRef.current = customYesWords;
  }, [customYesWords]);
  useEffect(() => {
    customNoRef.current = customNoWords;
  }, [customNoWords]);

  const [lastHeard, setLastHeard] = useState("");
  const [isRecordingSetup, setIsRecordingSetup] = useState<"yes" | "no" | null>(null);

  // --- Menü
  const [selectedModes, setSelectedModes] = useState<Record<ModeKey, boolean>>({
    object: true,
    compare: true,
    feature: false,
    category: false,
  });

  // --- Oyun
  const [questionCount, setQuestionCount] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const feedbackRef = useRef<typeof feedback>(null);
  useEffect(() => {
    feedbackRef.current = feedback;
  }, [feedback]);

  const [isListening, setIsListening] = useState(false);

  const [currentMode, setCurrentMode] = useState<ModeKey>("object");
  const currentModeRef = useRef<ModeKey>("object");
  useEffect(() => {
    currentModeRef.current = currentMode;
  }, [currentMode]);

  // --- Object mode
  const [visualItem, setVisualItem] = useState(VISUAL_ITEMS[0]);
  const [askedKey, setAskedKey] = useState<string>("kalem");
  const askedKeyRef = useRef("kalem");
  useEffect(() => {
    askedKeyRef.current = askedKey;
  }, [askedKey]);

  const [isMatch, setIsMatch] = useState(true);
  const isMatchRef = useRef(true);
  useEffect(() => {
    isMatchRef.current = isMatch;
  }, [isMatch]);

  // --- Compare mode
  const [targetItem, setTargetItem] = useState(VISUAL_ITEMS[0]);
  const [compareItem, setCompareItem] = useState(VISUAL_ITEMS[0]);
  const [compareIsMatch, setCompareIsMatch] = useState(true);
  const compareIsMatchRef = useRef(true);
  useEffect(() => {
    compareIsMatchRef.current = compareIsMatch;
  }, [compareIsMatch]);

  // --- Recognition refs
  const isMountedRef = useRef(true);
  const recognitionRef = useRef<any>(null);

  const answerWindowOpenRef = useRef(false);
  const shouldListenRef = useRef(false);
  const answeredRef = useRef(false);

  const lastTriggerAtRef = useRef(0);
  const lastDetectedRef = useRef<"yes" | "no" | null>(null);

  const promptKeys = useMemo(() => Object.keys(PROMPT_AUDIO), []);

  // --- Audio helper
  const playAudio = (src: string, onDone?: () => void) => {
    try {
      const a = new Audio(src);

      const finish = () => {
        try {
          a.onended = null;
        } catch {}
        onDone?.();
      };

      const safety = window.setTimeout(finish, 9000);

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

    rec.onstart = () => {
      if (isMountedRef.current) setIsListening(true);
    };
    rec.onerror = () => {
      if (isMountedRef.current) setIsListening(false);
    };

    rec.onend = () => {
      if (isMountedRef.current) setIsListening(false);

      if (!isMountedRef.current) return;
      if (phaseRef.current !== "playing") return;
      if (!shouldListenRef.current) return;

      setTimeout(() => {
        if (!isMountedRef.current) return;
        if (phaseRef.current !== "playing") return;
        if (!shouldListenRef.current) return;
        try {
          recognitionRef.current?.start();
        } catch {}
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

      if (phaseRef.current === "setup") return;
      if (phaseRef.current === "playing") checkTranscriptForGame(lower);
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
    try {
      rec.start();
    } catch {}
  };

  const stopRecognition = () => {
    try {
      recognitionRef.current?.abort?.();
    } catch {}
    if (isMountedRef.current) setIsListening(false);
  };

  const killEverything = () => {
    answerWindowOpenRef.current = false;
    shouldListenRef.current = false;
    answeredRef.current = false;
    lastDetectedRef.current = null;

    stopRecognition();
    recognitionRef.current = null;
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      killEverything();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSafeClose = () => {
    killEverything();
    onClose();
  };

  const detectYesNo = (transcript: string): "yes" | "no" | null => {
    const words = transcript.split(/\s+/).filter(Boolean);
    const YES_POOL = [...STANDARD_YES, ...customYesRef.current];
    const NO_POOL = [...STANDARD_NO, ...customNoRef.current];

    let detected: "yes" | "no" | null = null;
    for (const word of words) {
      if (YES_POOL.some((w) => word === w || word.includes(w))) detected = "yes";
      else if (NO_POOL.some((w) => word === w || word.includes(w))) detected = "no";
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

    answeredRef.current = true;
    answerWindowOpenRef.current = false;
    shouldListenRef.current = false;
    stopRecognition();

    lastTriggerAtRef.current = now;
    lastDetectedRef.current = detected;

    checkAnswer(detected);
  };

  const checkAnswer = (userSays: "yes" | "no") => {
    const mode = currentModeRef.current;

    let expected: "yes" | "no" = "yes";
    if (mode === "object") expected = isMatchRef.current ? "yes" : "no";
    if (mode === "compare") expected = compareIsMatchRef.current ? "yes" : "no";

    if (userSays === expected) handleSuccess();
    else handleFail();
  };

  const playCorrectFxThen = (cb: () => void) => {
    const src = Math.random() > 0.5 ? aferin1 : bravo;
    playAudio(src, () => {
      if (isMountedRef.current) cb();
    });
  };

  const playWrongFxThen = (cb: () => void) => {
    playAudio(tekrardene1, () => {
      if (isMountedRef.current) cb();
    });
  };

  // ✅ aynı soruyu tekrar sor: görsel/animasyon TEKRARLAMAZ
  const askCurrentQuestionThenListen = () => {
    answeredRef.current = false;
    answerWindowOpenRef.current = false;
    shouldListenRef.current = false;
    stopRecognition();

    const mode = currentModeRef.current;

    if (mode === "object") {
      const key = askedKeyRef.current;
      const prompt = PROMPT_AUDIO[key];
      playAudio(prompt.src, () => {
        if (!isMountedRef.current) return;
        answerWindowOpenRef.current = true;
        shouldListenRef.current = true;
        startRecognition();
      });
      return;
    }

    playAudio(aynimi, () => {
      if (!isMountedRef.current) return;
      answerWindowOpenRef.current = true;
      shouldListenRef.current = true;
      startRecognition();
    });
  };

  const generateObjectQuestion = () => {
    const v = pickRandom(VISUAL_ITEMS);
    setVisualItem(v);

    const shouldMatch = Math.random() > 0.5;
    setIsMatch(shouldMatch);
    isMatchRef.current = shouldMatch;

    let key = v.id;
    if (!shouldMatch) {
      const others = promptKeys.filter((k) => k !== v.id);
      key = pickRandom(others);
    }
    setAskedKey(key);
    askedKeyRef.current = key;

    setFeedback(null);
    setTimeout(() => askCurrentQuestionThenListen(), 120);
  };

  const generateCompareQuestion = () => {
    const target = pickRandom(VISUAL_ITEMS);
    const shouldMatch = Math.random() > 0.5;

    let comp = target;
    if (!shouldMatch) {
      const others = VISUAL_ITEMS.filter((i) => i.id !== target.id);
      comp = pickRandom(others);
    }

    setTargetItem(target);
    setCompareItem(comp);

    setCompareIsMatch(shouldMatch);
    compareIsMatchRef.current = shouldMatch;

    setFeedback(null);
    setTimeout(() => askCurrentQuestionThenListen(), 120);
  };

  // ✅ YENİ soru: UID artar -> useEffect ile animasyon 1 kere oynar
  const nextQuestion = () => {
    setQuestionUid((v) => v + 1);

    const active: ModeKey[] = [];
    if (selectedModes.object) active.push("object");
    if (selectedModes.compare) active.push("compare");

    const mode = pickRandom(active);
    setCurrentMode(mode);
    currentModeRef.current = mode;

    setFeedback(null);
    answeredRef.current = false;
    answerWindowOpenRef.current = false;
    shouldListenRef.current = false;
    lastDetectedRef.current = null;
    stopRecognition();

    if (mode === "object") generateObjectQuestion();
    else generateCompareQuestion();
  };

  const handleSuccess = () => {
    setFeedback("correct");
    playCorrectFxThen(() => {
      const next = questionCount + 1;
      setQuestionCount(next);

      if (next < 10) nextQuestion();
      else {
        setPhase("success");
        try {
          confetti();
        } catch {}
      }
    });
  };

  const handleFail = () => {
    setFeedback("wrong");
    playWrongFxThen(() => {
      setFeedback(null);
      lastDetectedRef.current = null;
      lastTriggerAtRef.current = Date.now();
      askCurrentQuestionThenListen();
    });
  };

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

  const toggleMode = (key: ModeKey) => {
    if (key === "feature" || key === "category") return;
    setSelectedModes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const canStart = selectedModes.object || selectedModes.compare;

  const startFromMenu = () => {
    if (!canStart) return;
    setFeedback(null);
    setQuestionCount(0);
    setPhase("playing");
    setTimeout(() => nextQuestion(), 80);
  };

  const Screen = ({ children }: { children: any }) => (
    <div className="fixed inset-0 z-[100] bg-[#0b0f19] text-slate-100 flex flex-col font-sans select-none overflow-hidden touch-none overscroll-none min-h-screen">
      {children}
    </div>
  );

  const TopBar = ({ title }: { title?: string }) => (
    <div className="p-4 flex justify-between items-center">
      <button onClick={handleSafeClose} className="p-2 bg-white/5 border border-white/10 rounded-full">
        <XCircle className="text-white/60" />
      </button>
      {title ? <div className="text-xs font-bold text-white/70">{title}</div> : <div />}
    </div>
  );

  return (
    <Screen>
      {/* INIT */}
      {phase === "init" && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <button onClick={handleSafeClose} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full border border-white/10">
            <XCircle className="text-white/50" />
          </button>

          <div className="w-24 h-24 bg-blue-500/15 rounded-full flex items-center justify-center mb-6 animate-bounce border border-blue-500/25">
            <Mic size={48} className="text-blue-300" />
          </div>

          <h1 className="text-2xl font-black mb-4">Hazır mısın?</h1>

          <button
            onClick={() => setPhase("setup")}
            className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all"
          >
            BAŞLA
          </button>
        </div>
      )}

      {/* SETUP */}
      {phase === "setup" && (
        <div className="flex-1 flex flex-col p-6 gap-4 max-w-2xl mx-auto w-full overflow-y-auto relative">
          <TopBar title="Ses Kalibrasyonu" />

          <div className="text-center">
            <div className="text-xl font-black">Ses Kalibrasyonu</div>
            <div className="text-xs text-white/60 mt-1">Çocuğun “evet/hayır” söyleyişlerini ekleyin.</div>
          </div>

          {/* EVET */}
          <div className="w-full bg-white/5 p-4 rounded-2xl border border-green-400/20">
            <h3 className="font-black text-green-300 mb-2 flex items-center gap-2">
              <Check size={18} /> EVET
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => toggleSetupRecord("yes")}
                className={twMerge(
                  "flex-1 py-3 rounded-xl font-black flex items-center justify-center gap-2 border",
                  isRecordingSetup === "yes"
                    ? "bg-red-600 text-white border-red-400/30 animate-pulse"
                    : "bg-white/5 border-white/10 text-white/80"
                )}
              >
                {isRecordingSetup === "yes" ? <MicOff size={18} /> : <Mic size={18} />}
                {isRecordingSetup === "yes" ? "Dur" : "Söylet"}
              </button>

              <button
                onClick={() => {
                  setCustomYesWords([...customYesWords, lastHeard]);
                  setLastHeard("");
                }}
                disabled={!lastHeard}
                className="px-4 bg-green-500 text-black rounded-xl font-black disabled:opacity-30"
              >
                Ekle
              </button>
            </div>

            <p className="text-[10px] mt-2 text-white/50 h-4">
              Algılanan: <span className="text-blue-300 font-black text-sm">{lastHeard}</span>
            </p>
          </div>

          {/* HAYIR */}
          <div className="w-full bg-white/5 p-4 rounded-2xl border border-red-400/20">
            <h3 className="font-black text-red-300 mb-2 flex items-center gap-2">
              <XCircle size={18} /> HAYIR
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => toggleSetupRecord("no")}
                className={twMerge(
                  "flex-1 py-3 rounded-xl font-black flex items-center justify-center gap-2 border",
                  isRecordingSetup === "no"
                    ? "bg-red-600 text-white border-red-400/30 animate-pulse"
                    : "bg-white/5 border-white/10 text-white/80"
                )}
              >
                {isRecordingSetup === "no" ? <MicOff size={18} /> : <Mic size={18} />}
                {isRecordingSetup === "no" ? "Dur" : "Söylet"}
              </button>

              <button
                onClick={() => {
                  setCustomNoWords([...customNoWords, lastHeard]);
                  setLastHeard("");
                }}
                disabled={!lastHeard}
                className="px-4 bg-red-500 text-black rounded-xl font-black disabled:opacity-30"
              >
                Ekle
              </button>
            </div>

            <p className="text-[10px] mt-2 text-white/50 h-4">
              Algılanan: <span className="text-blue-300 font-black text-sm">{lastHeard}</span>
            </p>
          </div>

          <button
            onClick={() => {
              stopRecognition();
              setIsRecordingSetup(null);
              setPhase("menu");
            }}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-lg mt-2 flex items-center justify-center gap-2"
          >
            MENÜYE GEÇ <ArrowRight />
          </button>
        </div>
      )}

      {/* MENU (2x2 estetik koyu kare) */}
      {phase === "menu" && (
        <div className="flex-1 flex flex-col p-6 gap-4 max-w-2xl mx-auto w-full relative">
          <TopBar title="Kazanım Seçimi" />

          <div className="text-center">
            <div className="text-2xl font-black">Kazanım Seçimi</div>
            <div className="text-xs text-white/60 mt-1">Öğretmen bir veya birkaçını seçebilir.</div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <button
              onClick={() => toggleMode("object")}
              className={twMerge(
                "rounded-3xl border p-5 text-left min-h-[150px] flex flex-col justify-between shadow-lg",
                selectedModes.object
                  ? "bg-gradient-to-br from-blue-600/25 to-blue-400/10 border-blue-400/40"
                  : "bg-white/5 border-white/10"
              )}
            >
              <div>
                <div className="font-black text-lg">Nesne Tanıma</div>
                <div className="text-[11px] text-white/60 mt-1">“Bu araba mı?”</div>
              </div>
              <div className="flex items-center justify-between">
                <div
                  className={twMerge(
                    "text-[11px] font-black px-3 py-1 rounded-full w-fit",
                    selectedModes.object ? "bg-blue-500 text-white" : "bg-white/10 text-white/70"
                  )}
                >
                  {selectedModes.object ? "Seçili" : "Seç"}
                </div>
                <div className={twMerge("w-3 h-3 rounded-full", selectedModes.object ? "bg-blue-400" : "bg-white/20")} />
              </div>
            </button>

            <button
              onClick={() => toggleMode("compare")}
              className={twMerge(
                "rounded-3xl border p-5 text-left min-h-[150px] flex flex-col justify-between shadow-lg",
                selectedModes.compare
                  ? "bg-gradient-to-br from-indigo-600/25 to-indigo-400/10 border-indigo-400/40"
                  : "bg-white/5 border-white/10"
              )}
            >
              <div>
                <div className="font-black text-lg">Karşılaştırma</div>
                <div className="text-[11px] text-white/60 mt-1">“Bu resimler aynı mı?”</div>
              </div>
              <div className="flex items-center justify-between">
                <div
                  className={twMerge(
                    "text-[11px] font-black px-3 py-1 rounded-full w-fit",
                    selectedModes.compare ? "bg-indigo-500 text-white" : "bg-white/10 text-white/70"
                  )}
                >
                  {selectedModes.compare ? "Seçili" : "Seç"}
                </div>
                <div className={twMerge("w-3 h-3 rounded-full", selectedModes.compare ? "bg-indigo-400" : "bg-white/20")} />
              </div>
            </button>

            <div className="rounded-3xl border p-5 text-left min-h-[150px] flex flex-col justify-between bg-white/5 border-white/10 opacity-50">
              <div>
                <div className="font-black text-lg">Özellik & Fonksiyon</div>
                <div className="text-[11px] text-white/60 mt-1">yakında</div>
              </div>
              <div className="text-[11px] font-black px-3 py-1 rounded-full w-fit bg-white/10 text-white/60">Kapalı</div>
            </div>

            <div className="rounded-3xl border p-5 text-left min-h-[150px] flex flex-col justify-between bg-white/5 border-white/10 opacity-50">
              <div>
                <div className="font-black text-lg">Kategorilendirme</div>
                <div className="text-[11px] text-white/60 mt-1">yakında</div>
              </div>
              <div className="text-[11px] font-black px-3 py-1 rounded-full w-fit bg-white/10 text-white/60">Kapalı</div>
            </div>
          </div>

          <button
            onClick={startFromMenu}
            disabled={!canStart}
            className="w-full py-4 bg-green-500 text-black rounded-2xl font-black text-xl shadow-lg mt-2 disabled:opacity-30"
          >
            BAŞLAT
          </button>
        </div>
      )}

      {/* PLAYING */}
      {phase === "playing" && (
        <div className="flex-1 flex flex-col">
          <TopBar title={`SORU: ${questionCount + 1} / 10`} />

          <div className="flex-1 flex flex-col items-center justify-center gap-8 p-4">
            {currentMode === "object" ? (
              <motion.div
                // ✅ initial kapalı: re-render’da asla tekrar kaymaz
                initial={false}
                animate={objectAnim}
                className={twMerge(
                  "w-44 h-44 bg-white/5 border-4 rounded-[2rem] p-4 flex items-center justify-center",
                  feedback === "correct"
                    ? "border-green-400/70 bg-green-500/10"
                    : feedback === "wrong"
                      ? "border-red-400/70 bg-red-500/10"
                      : "border-white/10"
                )}
              >
                <img src={visualItem.img} className="w-full h-full object-contain" />
              </motion.div>
            ) : (
              <div className="flex items-center gap-6">
                <div className="w-36 h-36 bg-white/5 border-4 border-white/10 rounded-[2rem] p-4 flex items-center justify-center">
                  <img src={targetItem.img} className="w-full h-full object-contain" />
                </div>

                <motion.div
                  initial={false}
                  animate={compareRightAnim}
                  className={twMerge(
                    "w-36 h-36 bg-white/5 border-4 rounded-[2rem] p-4 flex items-center justify-center",
                    feedback === "correct"
                      ? "border-green-400/70 bg-green-500/10"
                      : feedback === "wrong"
                        ? "border-red-400/70 bg-red-500/10"
                        : "border-white/10"
                  )}
                >
                  <img src={compareItem.img} className="w-full h-full object-contain" />
                </motion.div>
              </div>
            )}

            <div className="flex flex-col items-center gap-2 h-32 justify-center w-full">
              {isListening ? (
                <>
                  <div className="w-20 h-20 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20 animate-pulse">
                    <Mic size={40} />
                  </div>
                  <span className="text-blue-200 font-black text-xs">DİNLİYORUM...</span>
                  <span className="bg-white/10 text-white/80 px-3 py-1 rounded-full text-[10px] font-black h-6 min-w-[80px] text-center border border-white/10">
                    {lastHeard}
                  </span>
                </>
              ) : feedback ? (
                <div className={twMerge("text-4xl font-black animate-in zoom-in", feedback === "correct" ? "text-green-300" : "text-red-300")}>
                  {feedback === "correct" ? "DOĞRU!" : "YANLIŞ"}
                </div>
              ) : (
                <div className="text-white/60 text-xs font-black">
                  {answerWindowOpenRef.current ? "Cevap bekliyorum..." : "Soru soruluyor / bekle..."}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS */}
      {phase === "success" && (
        <div className="absolute inset-0 bg-[#0b0f19] z-50 flex flex-col items-center justify-center text-center p-8">
          <Trophy size={100} className="text-yellow-400 mb-6 animate-bounce" />
          <h1 className="text-3xl font-black mb-2 uppercase text-white">Tebrikler!</h1>
          <button onClick={() => onComplete(true)} className="bg-green-500 text-black px-12 py-5 rounded-2xl font-black text-xl shadow-xl">
            KAYDET VE ÇIK
          </button>
        </div>
      )}
    </Screen>
  );
                }
