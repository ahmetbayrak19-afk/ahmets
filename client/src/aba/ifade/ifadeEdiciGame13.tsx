// client/src/aba/ifade/ifadeEdiciGame13.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { Trophy, Mic, MicOff, Save, Trash2, X as XIcon, XCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { twMerge } from "tailwind-merge";

// ✅ Firebase (client/src/firebase.ts)
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// ✅ Öğrenci hook'u (varsa)
import { useStudentData } from "@/hooks/useStudentData";

// --- GERİBİLDİRİM SESLERİ ---
import aferin1 from "../esle/ses/aferin1.mp3";
import bravo from "../esle/ses/bravo.mp3";
import tekrardene1 from "../esle/ses/tekrardene1.mp3";

// --- SORU SESLERİ (client/src/aba/ifade) ---
import kisineyapiyor from "./kisineyapiyor.mp3";
import hayvanneyapiyor from "./hayvanneyapiyor.mp3";

// --- VİDEOLAR (client/src/aba/esle/eylemesle) ---
import disfircala from "../esle/eylemesle/disfircala.mp4";
import disfircala1 from "../esle/eylemesle/disfircala1.mp4";
import elmaye from "../esle/eylemesle/elmaye.mp4";
import elmaye1 from "../esle/eylemesle/elmaye1.mp4";
import elyika from "../esle/eylemesle/elyika.mp4";
import elyika1 from "../esle/eylemesle/elyika1.mp4";
import gitarcal from "../esle/eylemesle/gitarcal.mp4";
import gitarcal1 from "../esle/eylemesle/gitarcal1.mp4";
import kitapoku from "../esle/eylemesle/kitapoku.mp4";
import kitapoku1 from "../esle/eylemesle/kitapoku1.mp4";
import kos from "../esle/eylemesle/kos.mp4";
import kos1 from "../esle/eylemesle/kos1.mp4";
import resimyap from "../esle/eylemesle/resimyap.mp4";
import resimyap1 from "../esle/eylemesle/resimyap1.mp4";
import salincaksallan from "../esle/eylemesle/salincaksallan.mp4";
import salincaksallan1 from "../esle/eylemesle/salincaksallan1.mp4";
import suic from "../esle/eylemesle/suic.mp4";
import suic1 from "../esle/eylemesle/suic1.mp4";
import topoyna from "../esle/eylemesle/topoyna.mp4";
import topoyna1 from "../esle/eylemesle/topoyna1.mp4";

type Phase = "init" | "setup" | "playing" | "success";

type Q = {
  id: string;
  label: string;
  variants: { src: string; isAnimal: boolean }[];
  keywords: string[];
};

const QUESTIONS: Q[] = [
  {
    id: "disfircala",
    label: "Diş fırçala",
    variants: [
      { src: disfircala, isAnimal: false },
      { src: disfircala1, isAnimal: false },
    ],
    keywords: ["diş fırçala", "diş fırçalıyor", "dişini fırçalıyor", "disfircala", "dişfırçala"],
  },
  {
    id: "elmaye",
    label: "Elma ye",
    variants: [
      { src: elmaye, isAnimal: false },
      { src: elmaye1, isAnimal: true },
    ],
    keywords: ["elma ye", "elma yiyor", "yiyor", "elmaye", "elma"],
  },
  {
    id: "elyika",
    label: "El yıka",
    variants: [
      { src: elyika, isAnimal: false },
      { src: elyika1, isAnimal: false },
    ],
    keywords: ["el yıka", "el yıkıyor", "ellerini yıkıyor", "elyika"],
  },
  {
    id: "gitarcal",
    label: "Gitar çal",
    variants: [
      { src: gitarcal, isAnimal: false },
      { src: gitarcal1, isAnimal: false },
    ],
    keywords: ["gitar çal", "gitar çalıyor", "çalıyor", "gitarcal"],
  },
  {
    id: "kitapoku",
    label: "Kitap oku",
    variants: [
      { src: kitapoku, isAnimal: false },
      { src: kitapoku1, isAnimal: false },
    ],
    keywords: ["kitap oku", "kitap okuyor", "okuyor", "kitapoku"],
  },
  {
    id: "kos",
    label: "Koş",
    variants: [
      { src: kos, isAnimal: false },
      { src: kos1, isAnimal: false },
    ],
    keywords: ["koş", "koşuyor", "kos"],
  },
  {
    id: "resimyap",
    label: "Resim yap",
    variants: [
      { src: resimyap, isAnimal: false },
      { src: resimyap1, isAnimal: false },
    ],
    keywords: ["resim yap", "resim yapıyor", "çiziyor", "resimyap"],
  },
  {
    id: "salincaksallan",
    label: "Salıncakta sallan",
    variants: [
      { src: salincaksallan, isAnimal: false },
      { src: salincaksallan1, isAnimal: true },
    ],
    keywords: ["sallan", "sallanıyor", "salıncakta sallanıyor", "salincaksallan"],
  },
  {
    id: "suic",
    label: "Su iç",
    variants: [
      { src: suic, isAnimal: false },
      { src: suic1, isAnimal: true },
    ],
    keywords: ["su iç", "su içiyor", "içiyor", "suic"],
  },
  {
    id: "topoyna",
    label: "Top oyna",
    variants: [
      { src: topoyna, isAnimal: false },
      { src: topoyna1, isAnimal: false },
    ],
    keywords: ["top oyna", "top oynuyor", "oynuyor", "topoyna"],
  },
];

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function normalizeTR(s: string) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replaceAll("ı", "i")
    .replaceAll("İ", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ş", "s")
    .replaceAll("ü", "u")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

export default function IfadeEdiciGame13({ onClose, onComplete, mode, studentId: studentIdProp }: any) {
  void mode;

  const { selectedStudent } = useStudentData();
  const studentId = studentIdProp || selectedStudent?.id || selectedStudent?.uid || null;

  const [phase, setPhase] = useState<Phase>("init");
  const phaseRef = useRef<Phase>("init");
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // --- Kalibrasyon map: { actionId: string[] }
  const [savedMap, setSavedMap] = useState<Record<string, string[]>>({});
  const savedMapRef = useRef<Record<string, string[]>>({});
  useEffect(() => {
    savedMapRef.current = savedMap;
  }, [savedMap]);

  const [setupActionId, setSetupActionId] = useState<string>(QUESTIONS[0].id);
  const setupAction = useMemo(
    () => QUESTIONS.find((q) => q.id === setupActionId) || QUESTIONS[0],
    [setupActionId]
  );

  const [lastHeard, setLastHeard] = useState("");
  const [isRecordingSetup, setIsRecordingSetup] = useState(false);

  // --- Oyun
  const [questionCount, setQuestionCount] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const feedbackRef = useRef<typeof feedback>(null);
  useEffect(() => {
    feedbackRef.current = feedback;
  }, [feedback]);

  const [isListening, setIsListening] = useState(false);

  const [qAction, setQAction] = useState<Q>(QUESTIONS[0]);
  const qActionRef = useRef<Q>(QUESTIONS[0]);
  useEffect(() => {
    qActionRef.current = qAction;
  }, [qAction]);

  const [qVariant, setQVariant] = useState<{ src: string; isAnimal: boolean }>(QUESTIONS[0].variants[0]);
  const qVariantRef = useRef(qVariant);
  useEffect(() => {
    qVariantRef.current = qVariant;
  }, [qVariant]);

  // --- refs
  const isMountedRef = useRef(true);
  const recognitionRef = useRef<any>(null);

  const answerWindowOpenRef = useRef(false);
  const shouldListenRef = useRef(false);
  const answeredRef = useRef(false);
  const lastTriggerAtRef = useRef(0);

  // video
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // ---- Audio helper (mp3 bitmeden devam ETME)
  const playAudio = (src: string, onDone?: () => void) => {
    try {
      const a = new Audio(src);

      const finish = () => {
        try {
          a.onended = null;
        } catch {}
        onDone?.();
      };

      const safety = window.setTimeout(finish, 12000);

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

  const playCorrectFxThen = (cb: () => void) => {
    playAudio(Math.random() > 0.5 ? aferin1 : bravo, () => isMountedRef.current && cb());
  };

  const playWrongFxThen = (cb: () => void) => {
    playAudio(tekrardene1, () => isMountedRef.current && cb());
  };

  const playQuestionPromptThenListen = () => {
    answeredRef.current = false;
    answerWindowOpenRef.current = false;
    shouldListenRef.current = false;
    stopRecognition();

    const prompt = qVariantRef.current.isAnimal ? hayvanneyapiyor : kisineyapiyor;

    playAudio(prompt, () => {
      if (!isMountedRef.current) return;
      answerWindowOpenRef.current = true;
      shouldListenRef.current = true;
      startRecognition();
    });
  };

  // ---- SpeechRecognition
  const createRecognition = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return null;

    const rec = new SR();
    rec.lang = "tr-TR";
    rec.maxAlternatives = 1;
    rec.interimResults = false;
    rec.continuous = true;

    rec.onstart = () => isMountedRef.current && setIsListening(true);
    rec.onerror = () => isMountedRef.current && setIsListening(false);

    rec.onend = () => {
      if (isMountedRef.current) setIsListening(false);

      if (!isMountedRef.current) return;
      if (phaseRef.current !== "playing" && phaseRef.current !== "setup") return;
      if (!shouldListenRef.current) return;

      setTimeout(() => {
        if (!isMountedRef.current) return;
        if (!shouldListenRef.current) return;
        try {
          recognitionRef.current?.start();
        } catch {}
      }, 250);
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
    isMountedRef.current && setIsListening(false);
  };

  const killEverything = () => {
    answerWindowOpenRef.current = false;
    shouldListenRef.current = false;
    answeredRef.current = false;

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
    onClose?.();
  };

  // ---- Cevap kontrol (kalibrasyon + keywords)
  const getAcceptPhrasesForAction = (actionId: string) => {
    const base = QUESTIONS.find((q) => q.id === actionId)?.keywords || [];
    const custom = savedMapRef.current[actionId] || [];
    return [...base, ...custom].map((x) => normalizeTR(x)).filter(Boolean);
  };

  const matchesAction = (transcript: string, actionId: string) => {
    const t = normalizeTR(transcript);
    if (!t) return false;

    const accept = getAcceptPhrasesForAction(actionId);
    return accept.some((a) => t === a || t.includes(a) || a.includes(t));
  };

  const checkTranscriptForGame = (transcript: string) => {
    if (!answerWindowOpenRef.current) return;
    if (answeredRef.current) return;
    if (feedbackRef.current) return;

    const now = Date.now();
    if (now - lastTriggerAtRef.current < 450) return;

    const ok = matchesAction(transcript, qActionRef.current.id);

    answeredRef.current = true;
    answerWindowOpenRef.current = false;
    shouldListenRef.current = false;
    stopRecognition();

    lastTriggerAtRef.current = now;

    if (ok) handleSuccess();
    else handleFail();
  };

  // ---- Soru üretimi
  const nextQuestion = () => {
    const action = pickRandom(QUESTIONS);
    const variant = pickRandom(action.variants);

    setQAction(action);
    qActionRef.current = action;

    setQVariant(variant);
    qVariantRef.current = variant;

    setFeedback(null);
    answeredRef.current = false;
    answerWindowOpenRef.current = false;
    shouldListenRef.current = false;
    stopRecognition();

    setTimeout(() => {
      const v = videoRef.current;
      if (!v) return;
      try {
        v.pause();
        v.currentTime = 0;
        v.muted = true;
        v.volume = 0;
        v.play().catch(() => {});
      } catch {}
    }, 60);

    setTimeout(() => playQuestionPromptThenListen(), 200);
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
      playQuestionPromptThenListen();
    });
  };

  // ✅ Firebase load/save
  const calibDocPath = useMemo(() => {
    const instId = localStorage.getItem("kazanim-takip-institution-id");
    if (!instId || !studentId) return null;
    return doc(db, "institutions", instId, "students", String(studentId), "ifade", "eylem_kalibrasyon");
  }, [studentId]);

  const loadCalibration = async () => {
    if (!calibDocPath) {
      setPhase("setup");
      return;
    }
    try {
      const snap = await getDoc(calibDocPath);
      if (snap.exists()) {
        const data = snap.data() as any;
        const map = (data?.map || {}) as Record<string, string[]>;
        setSavedMap(map);
        setPhase("init");
      } else {
        setPhase("setup");
      }
    } catch {
      setPhase("setup");
    }
  };

  useEffect(() => {
    void loadCalibration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const saveCalibration = async () => {
    if (!calibDocPath) {
      setPhase("init");
      return;
    }
    try {
      await setDoc(calibDocPath, { map: savedMapRef.current, updatedAt: Date.now() }, { merge: true });
    } catch {}
    setPhase("init");
  };

  // Setup dinleme
  const toggleSetupRecord = () => {
    ensureRecognition();

    if (isRecordingSetup) {
      setIsRecordingSetup(false);
      shouldListenRef.current = false;
      stopRecognition();
      return;
    }
    setIsRecordingSetup(true);
    shouldListenRef.current = true;
    startRecognition();
  };

  const addSetupPhrase = () => {
    const phrase = lastHeard.trim();
    if (!phrase) return;

    setSavedMap((prev) => {
      const next = { ...prev };
      const arr = next[setupActionId] ? [...next[setupActionId]] : [];

      const norm = normalizeTR(phrase);
      const already = arr.some((x) => normalizeTR(x) === norm);
      if (!already) arr.push(phrase);

      next[setupActionId] = arr;
      return next;
    });

    setLastHeard("");
  };

  const removeSetupPhrase = (idx: number) => {
    setSavedMap((prev) => {
      const next = { ...prev };
      const arr = next[setupActionId] ? [...next[setupActionId]] : [];
      arr.splice(idx, 1);
      next[setupActionId] = arr;
      return next;
    });
  };

  const clearSetupPhrases = () => {
    setSavedMap((prev) => ({ ...prev, [setupActionId]: [] }));
  };

  const Screen = ({ children }: { children: any }) => (
    <div className="fixed inset-0 z-[100] bg-[#0b0f19] text-slate-100 flex flex-col font-sans select-none overflow-hidden touch-none overscroll-none min-h-screen">
      {children}
    </div>
  );

  const TopBar = ({ title }: { title?: string }) => (
    <div className="p-4 flex justify-between items-center z-20">
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

          <h1 className="text-2xl font-black mb-2">Eylem Adlandırma</h1>
          <p className="text-xs text-white/60 mb-6">Video izletilir, “ne yapıyor?” sorusuna eylem söylenir.</p>

          <div className="flex flex-col gap-3 w-full max-w-sm">
            <button
              onClick={() => {
                setPhase("playing");
                setQuestionCount(0);
                setTimeout(() => nextQuestion(), 60);
              }}
              className="px-10 py-4 bg-green-500 text-black rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all"
            >
              OYUNA BAŞLA
            </button>

            <button
              onClick={() => setPhase("setup")}
              className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all"
            >
              KALİBRASYON
            </button>
          </div>
        </div>
      )}

      {/* SETUP */}
      {phase === "setup" && (
        <div className="flex-1 flex flex-col p-6 gap-4 max-w-3xl mx-auto w-full overflow-y-auto relative">
          <TopBar title="Kalibrasyon (Eylem Söyleyişleri)" />

          <div className="text-center">
            <div className="text-xl font-black">Kalibrasyon</div>
            <div className="text-xs text-white/60 mt-1">Her eylem için söyleyiş ekle / sil. Sonra Kaydet.</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="font-black mb-2">Eylem Seç</div>
              <select
                value={setupActionId}
                onChange={(e) => setSetupActionId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 font-bold"
              >
                {QUESTIONS.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.label}
                  </option>
                ))}
              </select>

              <div className="mt-3 text-xs text-white/60">
                Kayıtlı varyasyon: <span className="font-black">{(savedMap[setupActionId] || []).length}</span>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={toggleSetupRecord}
                  className={twMerge(
                    "flex-1 py-3 rounded-xl font-black flex items-center justify-center gap-2 border",
                    isRecordingSetup
                      ? "bg-red-600 text-white border-red-400/30 animate-pulse"
                      : "bg-white/5 border-white/10 text-white/80"
                  )}
                >
                  {isRecordingSetup ? <MicOff size={18} /> : <Mic size={18} />}
                  {isRecordingSetup ? "Dur" : "Dinle"}
                </button>

                <button
                  onClick={addSetupPhrase}
                  disabled={!lastHeard}
                  className="px-4 bg-green-500 text-black rounded-xl font-black disabled:opacity-30"
                >
                  Ekle
                </button>
              </div>

              <div className="mt-2 text-[11px] text-white/60">
                Algılanan: <span className="text-blue-300 font-black">{lastHeard}</span>
              </div>

              <button
                onClick={clearSetupPhrases}
                className="mt-4 w-full py-3 rounded-xl font-black flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white/80"
              >
                <Trash2 size={18} /> Seçileni Temizle
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="font-black mb-2 flex items-center justify-between">
                <span>Kayıtlı Söyleyişler</span>
                <span className="text-[11px] text-white/50">({setupAction.label})</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {(savedMap[setupActionId] || []).map((w, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[11px] font-black"
                  >
                    {w}
                    <button
                      onClick={() => removeSetupPhrase(i)}
                      className="w-5 h-5 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20"
                      aria-label="Sil"
                      title="Sil"
                    >
                      <XIcon size={12} className="text-white/70" />
                    </button>
                  </span>
                ))}
              </div>

              {(savedMap[setupActionId] || []).length === 0 && (
                <div className="text-xs text-white/50">Henüz eklenmedi.</div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <button
              onClick={saveCalibration}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-lg flex items-center justify-center gap-2"
            >
              <Save /> KAYDET
            </button>

            <button
              onClick={() => setPhase("init")}
              className="w-full py-4 bg-white/5 text-white rounded-2xl font-black text-xl shadow-lg border border-white/10"
            >
              GERİ DÖN
            </button>
          </div>
        </div>
      )}

      {/* PLAYING */}
      {phase === "playing" && (
        <div className="flex-1 flex flex-col">
          <TopBar title={`SORU: ${questionCount + 1} / 10`} />

          {/* ✅ Video: 1 kere sabit, animasyon yok, en telefona sığar, oran bozulmaz */}
          <div className="flex-1 flex items-start justify-center px-0 pb-2">
            <div
              style={{ width: "min(100vw, calc(100vh - 220px))" }}
              className={twMerge(
                "aspect-square bg-black overflow-hidden border-4 rounded-2xl",
                feedback === "correct"
                  ? "border-green-400/70"
                  : feedback === "wrong"
                    ? "border-red-400/70"
                    : "border-white/10"
              )}
            >
              <video
                ref={videoRef}
                src={qVariant.src}
                className="w-full h-full object-contain"
                muted
                playsInline
                preload="auto"
                controls={false}
                onLoadedMetadata={() => {
                  const v = videoRef.current;
                  if (!v) return;
                  try {
                    v.muted = true;
                    v.volume = 0;
                    v.currentTime = 0;
                    v.play().catch(() => {});
                  } catch {}
                }}
                onEnded={() => {
                  const v = videoRef.current;
                  if (!v) return;
                  try {
                    v.currentTime = 0;
                    v.play().catch(() => {});
                  } catch {}
                }}
              />
            </div>
          </div>

          <div className="pb-6 flex flex-col items-center gap-2">
            {isListening ? (
              <>
                <div className="w-20 h-20 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20 animate-pulse">
                  <Mic size={40} />
                </div>
                <span className="text-blue-200 font-black text-xs">DİNLİYORUM...</span>
                <span className="bg-white/10 text-white/80 px-3 py-1 rounded-full text-[10px] font-black h-6 min-w-[120px] text-center border border-white/10">
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
      )}

      {/* SUCCESS */}
      {phase === "success" && (
        <div className="absolute inset-0 bg-[#0b0f19] z-50 flex flex-col items-center justify-center text-center p-8">
          <Trophy size={100} className="text-yellow-400 mb-6 animate-bounce" />
          <h1 className="text-3xl font-black mb-2 uppercase text-white">Tebrikler!</h1>
          <p className="text-xs text-white/60 mb-6">10 soruyu tamamladı.</p>
          <button
            onClick={() => onComplete?.(true)}
            className="bg-green-500 text-black px-12 py-5 rounded-2xl font-black text-xl shadow-xl"
          >
            KAYDET VE ÇIK
          </button>
        </div>
      )}
    </Screen>
  );
}
