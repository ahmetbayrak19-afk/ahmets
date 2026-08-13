import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronRight,
  Lightbulb,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Speaker,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

import { db } from "@/firebase";
import girisSes from "./ortakdikkatsesgorsel/od2_1girisses.mp3";

const TRIAL_COUNT = 10;
const PASS_COUNT = 8;

const EXAMPLE_IDEAS = [
  "Köpük baloncuk çıkarma",
  "Işıklı oyuncağın ışığını yakma",
  "Kurmalı oyuncağı yürütme",
  "Sesli arabanın sirenini çalıştırma",
  "Sürpriz kutudan oyuncak çıkarma",
  "Oyuncak telefonun çalması",
  "Balonu şişirip bırakma",
  "Oyuncak kulesinin devrilmesi",
  "Topu rampadan veya tünelden geçirme",
  "Topacı döndürme",
  "Kuklaya komik bir hareket yaptırma",
  "El feneriyle duvarda şekil oluşturma",
  "Örtünün altından oyuncak çıkarma",
  "Mıknatıslı parçaları birbirine yapıştırma",
  "Düğmeli oyuncağı çalıştırma",
];

type Stage = "intro" | "planning" | "assessment" | "result";
type EntryMode = "add" | "replace" | "spontaneous" | null;

interface TrialResult {
  trialNumber: number;
  opportunity: string;
  correct: boolean;
  source: "planned" | "spontaneous";
}

interface SkillProfile {
  sessionCount?: number;
}

interface OrtakDikkat7Props {
  studentId: string;
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

const normalize = (value: string) =>
  value.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");

export default function OrtakDikkat7({
  studentId,
  itemCode = "OD 2.1",
  itemText = "Başkalarının Dikkatini Bir Nesneye Yönlendirme",
  onClose,
  onComplete,
}: OrtakDikkat7Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [stage, setStage] = useState<Stage>("intro");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [opportunities, setOpportunities] = useState<string[]>([]);
  const [entryText, setEntryText] = useState("");
  const [entryMode, setEntryMode] = useState<EntryMode>(null);
  const [showIdeas, setShowIdeas] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [notInterested, setNotInterested] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "missed" | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    const audio = new Audio(girisSes);
    audioRef.current = audio;
    audio.play().catch(() => {});

    return () => {
      audio.pause();
      audio.currentTime = 0;
      if (audioRef.current === audio) audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      const institutionId = localStorage.getItem("kazanim-takip-institution-id");
      if (!institutionId || !studentId) {
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDoc(doc(
          db,
          "institutions",
          institutionId,
          "students",
          studentId,
          "profiles",
          "ortakDikkat21",
        ));
        if (snapshot.exists()) {
          setSessionCount((snapshot.data() as SkillProfile).sessionCount || 0);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [studentId]);

  const correctCount = results.filter((result) => result.correct).length;
  const passed = results.length === TRIAL_COUNT && correctCount >= PASS_COUNT;
  const currentOpportunity = opportunities[currentIndex] || "Yeni bir fırsat oluşturun";
  const usedNames = useMemo(
    () => new Set(results.map((result) => normalize(result.opportunity))),
    [results],
  );

  const playIntro = () => {
    if (!audioRef.current) audioRef.current = new Audio(girisSes);
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => toast.info("Ses cihaz tarafından başlatılamadı."));
  };

  const stopIntro = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  };

  const isDuplicate = (value: string, ignoredIndex?: number) => {
    const key = normalize(value);
    return opportunities.some((item, index) => (
      index !== ignoredIndex && normalize(item) === key
    ));
  };

  const addOpportunity = (value = entryText) => {
    const clean = value.trim();
    if (!clean) return;
    if (isDuplicate(clean)) {
      toast.info("Bu fırsat listede zaten bulunuyor.");
      return;
    }
    setOpportunities((current) => [...current, clean]);
    setEntryText("");
  };

  const chooseIdea = (idea: string) => {
    if (entryMode === "replace") {
      if (isDuplicate(idea, currentIndex) || usedNames.has(normalize(idea))) {
        toast.info("Bu fırsat daha önce kullanıldı veya listede bulunuyor.");
        return;
      }
      setOpportunities((current) => current.map((item, index) => (
        index === currentIndex ? idea : item
      )));
      setEntryMode(null);
      setShowIdeas(false);
      return;
    }

    if (entryMode === "spontaneous") {
      setEntryText(idea);
      setShowIdeas(false);
      return;
    }

    addOpportunity(idea);
  };

  const submitEntry = () => {
    const clean = entryText.trim();
    if (!clean) {
      toast.info("Nesne veya durumun adını yazın.");
      return;
    }

    if (entryMode === "replace") {
      if (isDuplicate(clean, currentIndex) || usedNames.has(normalize(clean))) {
        toast.info("Bu fırsat daha önce kullanıldı veya listede bulunuyor.");
        return;
      }
      setOpportunities((current) => current.map((item, index) => (
        index === currentIndex ? clean : item
      )));
      setEntryText("");
      setEntryMode(null);
      return;
    }

    if (entryMode === "spontaneous") {
      if (usedNames.has(normalize(clean))) {
        toast.info("Aynı nesne ikinci kez deneme olarak sayılamaz.");
        return;
      }
      recordTrial(true, clean, "spontaneous");
      setEntryText("");
      setEntryMode(null);
      return;
    }

    addOpportunity(clean);
  };

  const startAssessment = () => {
    if (opportunities.length < TRIAL_COUNT) {
      toast.info("Başlamak için en az 10 farklı fırsat planlayın.");
      return;
    }
    stopIntro();
    setCurrentIndex(0);
    setResults([]);
    setNotInterested([]);
    setFeedback(null);
    setStage("assessment");
  };

  const recordTrial = (
    correct: boolean,
    opportunity = currentOpportunity,
    source: TrialResult["source"] = "planned",
  ) => {
    if (feedback || results.length >= TRIAL_COUNT) return;

    const nextResults: TrialResult[] = [
      ...results,
      {
        trialNumber: results.length + 1,
        opportunity,
        correct,
        source,
      },
    ];
    setResults(nextResults);
    setFeedback(correct ? "correct" : "missed");

    window.setTimeout(() => {
      if (nextResults.length >= TRIAL_COUNT) {
        const nextCorrectCount = nextResults.filter((result) => result.correct).length;
        setStage("result");
        setFeedback(null);
        if (nextCorrectCount >= PASS_COUNT) {
          confetti({ particleCount: 180, spread: 85, origin: { y: 0.64 } });
        }
        return;
      }
      setCurrentIndex((index) => index + 1);
      setFeedback(null);
    }, 700);
  };

  const markNotInterested = () => {
    if (feedback) return;
    setNotInterested((current) => [...current, currentOpportunity]);
    setEntryText("");
    setEntryMode("replace");
  };

  const saveResult = async () => {
    const institutionId = localStorage.getItem("kazanim-takip-institution-id");
    if (!institutionId || !studentId) {
      toast.error("Öğrenci veya kurum bilgisi bulunamadı.");
      return;
    }

    setSaving(true);
    try {
      await setDoc(
        doc(
          db,
          "institutions",
          institutionId,
          "students",
          studentId,
          "profiles",
          "ortakDikkat21",
        ),
        {
          sessionCount: sessionCount + 1,
          lastSession: {
            results,
            plannedOpportunities: opportunities,
            notInterested,
            correctCount,
            totalCount: TRIAL_COUNT,
            successRate: correctCount * 10,
            passed,
            completedAt: new Date().toISOString(),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      toast.success("OD 2.1 değerlendirmesi kaydedildi.");
      onComplete(passed);
    } catch (error) {
      console.error(error);
      toast.error("Değerlendirme kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const requestClose = () => {
    if (stage === "assessment" || stage === "result") setShowExitDialog(true);
    else onClose();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="animate-spin text-cyan-400" size={38} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col bg-slate-950 text-white">
      <header className="z-20 flex shrink-0 items-center border-b border-slate-800 bg-slate-900/95 px-4 py-3 backdrop-blur">
        <button type="button" onClick={requestClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Kapat">
          <XCircle size={27} />
        </button>
        <div className="min-w-0 flex-1 px-3 text-center">
          <h1 className="truncate text-sm font-black sm:text-base">{itemCode} — {itemText}</h1>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            {stage === "intro" ? "Bilgilendirme" : stage === "planning" ? "Hazırlık" : stage === "assessment" ? `Değerlendirme ${Math.min(results.length + 1, TRIAL_COUNT)}/${TRIAL_COUNT}` : "Sonuç"}
          </p>
        </div>
        <div className="w-11" />
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto w-full max-w-2xl">
          {stage === "intro" && (
            <section className="flex min-h-[78vh] flex-col justify-center">
              <div className="rounded-3xl border border-cyan-500/25 bg-slate-900 p-6 text-center shadow-2xl sm:p-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
                  <Sparkles size={34} />
                </div>
                <h2 className="mt-5 text-2xl font-black">Nasıl Değerlendirilir?</h2>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  Öğrenciyi yönlendirmeden bekleyin. Planlanan ya da ortamdaki başka bir nesneyi kendiliğinden size gösterir ve siz bakana kadar tutarsa başarılı kabul edin. Nesne ilgisini çekmezse değiştirin ve denemeye dahil etmeyin.
                </p>
                <button type="button" onClick={playIntro} className="mx-auto mt-5 flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-bold text-slate-300 hover:border-cyan-500/40">
                  <Speaker size={18} /> Açıklamayı Dinle
                </button>
                <button type="button" onClick={() => { stopIntro(); setStage("planning"); }} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 p-4 font-black text-slate-950 active:scale-[0.99]">
                  Hazırlığa Geç <ChevronRight size={21} />
                </button>
              </div>
            </section>
          )}

          {stage === "planning" && (
            <section className="space-y-4">
              <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                <h2 className="text-lg font-black">Fırsatlarını Planla</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">Öğrencinin ilgisini çekebilecek en az 10 farklı nesne, oyun veya durum ekleyin.</p>

                <div className="mt-4 flex gap-2">
                  <input
                    value={entryText}
                    onChange={(event) => setEntryText(event.target.value)}
                    onKeyDown={(event) => { if (event.key === "Enter") addOpportunity(); }}
                    placeholder="Örneğin: Komik ses çıkaran oyuncak"
                    className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-cyan-500"
                  />
                  <button type="button" onClick={() => addOpportunity()} className="flex w-12 items-center justify-center rounded-xl bg-cyan-500 text-slate-950" aria-label="Fırsat ekle">
                    <Plus size={22} />
                  </button>
                </div>

                <button type="button" onClick={() => { setEntryMode("add"); setShowIdeas(true); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 p-3 text-sm font-black text-amber-300">
                  <Lightbulb size={19} /> Örnek Fikirleri Gör
                </button>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black">Planlanan Fırsatlar</h3>
                  <span className={twMerge("rounded-full px-3 py-1 text-xs font-black", opportunities.length >= TRIAL_COUNT ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-800 text-slate-400")}>{opportunities.length}/10</span>
                </div>
                {opportunities.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">Henüz fırsat eklenmedi.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {opportunities.map((item, index) => (
                      <div key={`${item}-${index}`} className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 p-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-black text-cyan-300">{index + 1}</span>
                        <span className="min-w-0 flex-1 text-sm font-bold">{item}</span>
                        <button type="button" onClick={() => setOpportunities((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-300" aria-label={`${item} fırsatını kaldır`}><X size={17} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="button" disabled={opportunities.length < TRIAL_COUNT} onClick={startAssessment} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 p-4 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-35">
                Değerlendirmeyi Başlat <ChevronRight size={21} />
              </button>
            </section>
          )}

          {stage === "assessment" && (
            <section className="flex min-h-[78vh] flex-col justify-center">
              <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full bg-cyan-400 transition-all" style={{ width: `${(results.length / TRIAL_COUNT) * 100}%` }} />
              </div>

              <div className="rounded-3xl border border-slate-700 bg-slate-900 p-5 text-center shadow-2xl sm:p-7">
                <p className="text-xs font-black uppercase tracking-wider text-cyan-400">Şimdiki fırsat</p>
                <h2 className="mt-3 text-2xl font-black sm:text-3xl">{currentOpportunity}</h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-400">İlgi çekici olayı oluşturun. Yönerge veya ipucu vermeden bekleyin.</p>

                <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-left">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">Doğru tepki</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">Nesneyi size gösterir ve siz nesneye bakana kadar göstermeyi sürdürür.</p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button type="button" disabled={Boolean(feedback)} onClick={() => recordTrial(true)} className={twMerge("flex min-h-16 items-center justify-center gap-2 rounded-2xl border p-3 font-black transition active:scale-[0.98]", feedback === "correct" ? "border-emerald-400 bg-emerald-500/30 text-emerald-100" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20")}>
                    <Check size={23} /> Bağımsız yönlendirdi
                  </button>
                  <button type="button" disabled={Boolean(feedback)} onClick={() => recordTrial(false)} className={twMerge("flex min-h-16 items-center justify-center gap-2 rounded-2xl border p-3 font-black transition active:scale-[0.98]", feedback === "missed" ? "border-red-400 bg-red-500/30 text-red-100" : "border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20")}>
                    <X size={23} /> Bu fırsatta yönlendirmedi
                  </button>
                </div>

                <button type="button" disabled={Boolean(feedback)} onClick={markNotInterested} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm font-bold text-amber-300 hover:bg-amber-500/20">
                  <RefreshCw size={18} /> İlgisini çekmedi · değiştir
                </button>
                <button type="button" disabled={Boolean(feedback)} onClick={() => { setEntryText(""); setEntryMode("spontaneous"); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm font-bold text-cyan-300 hover:bg-cyan-500/20">
                  <Sparkles size={18} /> Başka bir nesneyi kendiliğinden gösterdi
                </button>
              </div>
            </section>
          )}

          {stage === "result" && (
            <section className="space-y-5 text-center">
              <div className={twMerge("rounded-3xl border p-6", passed ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10")}>
                {passed ? <Trophy className="mx-auto mb-4 text-amber-400" size={62} /> : <XCircle className="mx-auto mb-4 text-red-400" size={58} />}
                <h2 className="text-2xl font-black">{passed ? "Kazanımı Yapabiliyor" : "Kazanımı Henüz Yapamıyor"}</h2>
                <p className="mt-3 text-4xl font-black">{correctCount} / {TRIAL_COUNT}</p>
                <p className="mt-2 text-sm text-slate-300">Başarılı kabul edilmesi için en az {PASS_COUNT} bağımsız tepki gerekir.</p>
              </div>

              <div className="space-y-2 text-left">
                {results.map((result) => (
                  <div key={result.trialNumber} className={twMerge("flex items-center gap-3 rounded-xl border p-3", result.correct ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5")}>
                    <span className={twMerge("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", result.correct ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300")}>{result.correct ? <Check size={17} /> : <X size={17} />}</span>
                    <div className="min-w-0 flex-1"><p className="font-bold">{result.trialNumber}. {result.opportunity}</p>{result.source === "spontaneous" && <p className="mt-0.5 text-[11px] text-cyan-400">Kendiliğinden farklı nesne gösterdi</p>}</div>
                  </div>
                ))}
              </div>

              <button type="button" disabled={saving} onClick={saveResult} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 p-4 font-black text-slate-950 disabled:opacity-50">
                {saving ? <Loader2 className="animate-spin" /> : <Save />} Kaydet ve Çık
              </button>
            </section>
          )}
        </div>
      </main>

      {showIdeas && (
        <div className="fixed inset-0 z-[130] flex items-end justify-center bg-black/70 p-3 sm:items-center">
          <div className="max-h-[82vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-4 shadow-2xl">
            <div className="flex items-center justify-between"><div><h3 className="font-black">Örnek Fikirler</h3><p className="mt-1 text-xs text-slate-400">Kullanmak istediğiniz fikre dokunun.</p></div><button type="button" onClick={() => setShowIdeas(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-800"><X size={21} /></button></div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {EXAMPLE_IDEAS.map((idea) => {
                const unavailable = entryMode !== "replace" && opportunities.some((item) => normalize(item) === normalize(idea));
                return <button key={idea} type="button" disabled={unavailable} onClick={() => chooseIdea(idea)} className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-left text-sm font-bold transition hover:border-amber-500/50 disabled:opacity-25">{idea}</button>;
              })}
            </div>
          </div>
        </div>
      )}

      {entryMode && entryMode !== "add" && !showIdeas && (
        <div className="fixed inset-0 z-[125] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-5">
            <h3 className="text-lg font-black">{entryMode === "replace" ? "Yeni Fırsat Yazın" : "Gösterdiği Nesneyi Yazın"}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{entryMode === "replace" ? "Bu fırsat sayılmadı. Aynı deneme için farklı bir nesne veya durum belirleyin." : "Bu nesne bağımsız doğru tepki olarak kaydedilecektir."}</p>
            <input autoFocus value={entryText} onChange={(event) => setEntryText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitEntry(); }} placeholder="Nesne veya durum" className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-cyan-500" />
            {entryMode === "replace" && <button type="button" onClick={() => setShowIdeas(true)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm font-bold text-amber-300"><Lightbulb size={18} /> Örnek Fikirleri Gör</button>}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { setEntryMode(null); setEntryText(""); }} className="rounded-xl border border-slate-700 p-3 font-bold text-slate-300">Vazgeç</button>
              <button type="button" onClick={submitEntry} className="rounded-xl bg-cyan-500 p-3 font-black text-slate-950">Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {showExitDialog && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <h3 className="font-black">Değerlendirme kaydedilmedi</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">Şimdi çıkarsanız bu oturumdaki kayıtlar kaybolur.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setShowExitDialog(false)} className="rounded-xl border border-slate-700 p-3 font-bold text-slate-300">Devam Et</button>
              <button type="button" onClick={onClose} className="rounded-xl bg-red-600 p-3 font-bold">Çık</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
