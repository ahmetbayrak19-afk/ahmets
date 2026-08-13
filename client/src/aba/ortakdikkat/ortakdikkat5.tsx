import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  Gift,
  GraduationCap,
  Hand,
  Image as ImageIcon,
  Loader2,
  MonitorSmartphone,
  MousePointer2,
  PackageOpen,
  Save,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

import { db } from "@/firebase";

const imageModules = import.meta.glob(
  [
    "./ortakdikkatsesgorsel/*.{png,jpg,jpeg,webp}",
    "../yonerge/sesgorsel/*.{png,jpg,jpeg,webp}",
    "../esle/gitar.png",
    "../../fruits/*.{png,jpg,jpeg,webp}",
    "../../icecekler/*.{png,jpg,jpeg,webp}",
    "../../temelgidalar/*.{png,jpg,jpeg,webp}",
    "../../okulmalzemeleri/suluboya.png",
  ],
  { eager: true, import: "default", query: "?url" },
) as Record<string, string>;

const BUILT_IN_IMAGES = new Map(
  Object.entries(imageModules).map(([path, image]) => [`ready:${path}`, image]),
);

const TRIAL_COUNT = 10;
const PASS_COUNT = 8;
const PROGRAM_TARGET_COUNT = 20;
const RESPONSE_WINDOW_SECONDS = 5;

type Stage = "blocked" | "home" | "assessment" | "practice" | "result";
type PresentationMode = "digital" | "real";

interface Reinforcer {
  id: string;
  catalogId?: string | null;
  name: string;
  image?: string | null;
  source?: "built-in" | "community";
  rank: number;
}

interface ReinforcerProfile {
  rankings?: Reinforcer[];
}

interface Trial {
  id: string;
  options: Reinforcer[];
}

interface TrialResult {
  trialId: string;
  optionIds: string[];
  selectedId: string | null;
  selectedName: string | null;
  correct: boolean;
}

interface MasteredItem {
  id: string;
  name: string;
  achievedAt: string;
}

interface SkillProfile {
  masteredItems?: MasteredItem[];
  sessionCount?: number;
}

interface OrtakDikkat5Props {
  studentId: string;
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
  onOpenReinforcers: () => void;
}

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
};

const resolveReinforcers = (items: Reinforcer[]) =>
  [...items]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 6)
    .map((item) => ({
      ...item,
      image: item.source === "built-in"
        ? BUILT_IN_IMAGES.get(item.id) || item.image || null
        : item.image || null,
    }));

/** Altı pekiştireçten her tur üç seçenek üretir. */
const buildTrials = (reinforcers: Reinforcer[]): Trial[] => {
  const combinations: Reinforcer[][] = [];
  for (let first = 0; first < reinforcers.length - 2; first += 1) {
    for (let second = first + 1; second < reinforcers.length - 1; second += 1) {
      for (let third = second + 1; third < reinforcers.length; third += 1) {
        combinations.push([reinforcers[first], reinforcers[second], reinforcers[third]]);
      }
    }
  }

  return shuffle(combinations)
    .slice(0, TRIAL_COUNT)
    .map((options, index) => ({
      id: `trial-${index + 1}`,
      options: shuffle(options),
    }));
};

export default function OrtakDikkat5({
  studentId,
  itemCode = "OD 1.5",
  itemText = "İşaret Parmağı ile İşaret Etme",
  onClose,
  onComplete,
  onOpenReinforcers,
}: OrtakDikkat5Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stage, setStage] = useState<Stage>("blocked");
  const [presentationMode, setPresentationMode] = useState<PresentationMode>("digital");
  const [reinforcers, setReinforcers] = useState<Reinforcer[]>([]);
  const [masteredItems, setMasteredItems] = useState<MasteredItem[]>([]);
  const [sessionCount, setSessionCount] = useState(0);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [trialIndex, setTrialIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESPONSE_WINDOW_SECONDS);
  const [locked, setLocked] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const deadlineRef = useRef(0);

  const clearTimer = () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  };

  useEffect(() => () => clearTimer(), []);

  useEffect(() => {
    const load = async () => {
      const institutionId = localStorage.getItem("kazanim-takip-institution-id");
      if (!institutionId || !studentId) {
        setLoading(false);
        return;
      }

      try {
        const [reinforcerSnapshot, skillSnapshot] = await Promise.all([
          getDoc(doc(
            db,
            "institutions",
            institutionId,
            "students",
            studentId,
            "profiles",
            "abaReinforcers",
          )),
          getDoc(doc(
            db,
            "institutions",
            institutionId,
            "students",
            studentId,
            "profiles",
            "ortakDikkat15",
          )),
        ]);

        const savedReinforcers = reinforcerSnapshot.exists()
          ? resolveReinforcers((reinforcerSnapshot.data() as ReinforcerProfile).rankings || [])
          : [];
        setReinforcers(savedReinforcers);

        if (skillSnapshot.exists()) {
          const skillData = skillSnapshot.data() as SkillProfile;
          setMasteredItems((skillData.masteredItems || []).slice(0, PROGRAM_TARGET_COUNT));
          setSessionCount(skillData.sessionCount || 0);
        }

        setStage(savedReinforcers.length === 6 ? "home" : "blocked");
      } catch (error) {
        console.error(error);
        toast.error("Pekiştireç bilgileri kontrol edilemedi.");
        setStage("blocked");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [studentId]);

  const currentTrial = trials[trialIndex];
  const correctCount = results.filter((result) => result.correct).length;
  const setPassed = results.length === TRIAL_COUNT && correctCount >= PASS_COUNT;

  const masteredIds = useMemo(
    () => new Set(masteredItems.map((item) => item.id)),
    [masteredItems],
  );

  const newlyMastered = useMemo(() => {
    if (!setPassed) return [];
    const seen = new Set(masteredIds);
    return results.flatMap((result) => {
      if (!result.correct || !result.selectedId || !result.selectedName || seen.has(result.selectedId)) return [];
      seen.add(result.selectedId);
      return [{ id: result.selectedId, name: result.selectedName }];
    });
  }, [masteredIds, results, setPassed]);

  const projectedMasteredCount = Math.min(
    PROGRAM_TARGET_COUNT,
    masteredItems.length + newlyMastered.length,
  );
  const programCompleted = projectedMasteredCount >= PROGRAM_TARGET_COUNT;

  const startAssessment = (mode: PresentationMode) => {
    setPresentationMode(mode);
    setTrials(buildTrials(reinforcers));
    setTrialIndex(0);
    setSelectedId(null);
    setResults([]);
    setTimerRunning(false);
    setSecondsLeft(RESPONSE_WINDOW_SECONDS);
    setLocked(false);
    setStage("assessment");
  };

  const finishTrial = (correct: boolean, timedOut = false) => {
    if ((!timerRunning && !timedOut) || locked || !currentTrial) return;
    if (correct && !selectedId) {
      toast.error("Öğrencinin işaret ettiği seçeneği belirtin.");
      return;
    }

    clearTimer();
    setTimerRunning(false);
    setLocked(true);

    const selectedItem = currentTrial.options.find((item) => item.id === selectedId);
    const nextResults: TrialResult[] = [
      ...results,
      {
        trialId: currentTrial.id,
        optionIds: currentTrial.options.map((item) => item.id),
        selectedId: correct ? selectedId : null,
        selectedName: correct ? selectedItem?.name || null : null,
        correct,
      },
    ];
    setResults(nextResults);

    const isLastTrial = trialIndex + 1 >= TRIAL_COUNT;
    window.setTimeout(() => {
      if (isLastTrial) {
        setStage("result");
      } else {
        setTrialIndex((current) => current + 1);
        setSelectedId(null);
        setSecondsLeft(RESPONSE_WINDOW_SECONDS);
        setLocked(false);
      }
    }, isLastTrial ? 700 : 3000);
  };

  const beginResponseWindow = () => {
    if (timerRunning || locked) return;
    setSelectedId(null);
    setSecondsLeft(RESPONSE_WINDOW_SECONDS);
    deadlineRef.current = Date.now() + RESPONSE_WINDOW_SECONDS * 1000;
    setTimerRunning(true);

    intervalRef.current = window.setInterval(() => {
      setSecondsLeft(Math.max(0, (deadlineRef.current - Date.now()) / 1000));
    }, 100);
    timeoutRef.current = window.setTimeout(
      () => finishTrial(false, true),
      RESPONSE_WINDOW_SECONDS * 1000,
    );
  };

  const saveResult = async () => {
    const institutionId = localStorage.getItem("kazanim-takip-institution-id");
    if (!institutionId || !studentId) return;

    setSaving(true);
    try {
      const achievedAt = new Date().toISOString();
      const nextMasteredItems = [
        ...masteredItems,
        ...newlyMastered.map((item) => ({ ...item, achievedAt })),
      ].slice(0, PROGRAM_TARGET_COUNT);

      await setDoc(
        doc(
          db,
          "institutions",
          institutionId,
          "students",
          studentId,
          "profiles",
          "ortakDikkat15",
        ),
        {
          masteredItems: nextMasteredItems,
          sessionCount: sessionCount + 1,
          lastSession: {
            mode: presentationMode,
            results,
            correctCount,
            totalCount: TRIAL_COUNT,
            successRate: correctCount * 10,
            setPassed,
            completedAt: achievedAt,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      const completed = nextMasteredItems.length >= PROGRAM_TARGET_COUNT;
      if (completed) confetti({ particleCount: 220, spread: 90, origin: { y: 0.62 } });
      toast.success("1.5 değerlendirmesi kaydedildi.");
      onComplete(completed);
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

  if (stage === "blocked") {
    return (
      <div className="fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col bg-slate-950 p-4 text-white">
        <header className="mx-auto flex w-full max-w-3xl items-center border-b border-slate-800 py-3">
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400" aria-label="Kapat"><XCircle size={27} /></button>
          <div className="min-w-0 flex-1 px-3 text-center"><h1 className="truncate text-sm font-black sm:text-base">{itemCode} — {itemText}</h1><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">Giriş Engellendi</p></div>
          <div className="w-11" />
        </header>

        <main className="mx-auto flex w-full max-w-xl flex-1 items-center justify-center">
          <section className="w-full rounded-3xl border border-amber-500/35 bg-amber-500/10 p-6 text-center shadow-2xl sm:p-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/15 text-amber-300"><AlertTriangle size={42} /></div>
            <h2 className="mt-5 text-2xl font-black">Pekiştireçler Henüz Belirlenmedi</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">Öğrencinin en güçlü 6 pekiştireci belirlenmeden bu kazanımın değerlendirmesine veya çalışmasına başlanamaz.</p>
            <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950/60 p-4 text-left"><div className="flex gap-3"><Gift className="mt-0.5 shrink-0 text-amber-400" size={21} /><p className="text-sm leading-relaxed text-slate-300">Önce Pekiştireç Belirleme sayfasında 10 aday arasından öğrencinin güncel ilk 6 pekiştirecini kaydedin.</p></div></div>
            <button type="button" onClick={onOpenReinforcers} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 p-4 font-black text-slate-950 active:scale-[0.98]">Beni Yönlendir <ChevronRight size={21} /></button>
          </section>
        </main>
      </div>
    );
  }

  const progressCount = Math.min(masteredItems.length, PROGRAM_TARGET_COUNT);

  return (
    <div className="fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col bg-slate-950 text-white">
      <header className="z-20 flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/95 px-4 py-3 backdrop-blur">
        <button type="button" onClick={requestClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Kapat"><XCircle size={27} /></button>
        <div className="min-w-0 px-2 text-center"><h1 className="truncate text-sm font-black sm:text-base">{itemCode} — {itemText}</h1><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{stage === "assessment" ? `Değerlendirme ${trialIndex + 1}/${TRIAL_COUNT}` : stage === "practice" ? "Çalışma" : stage === "result" ? "Sonuç" : "Hazırlık"}</p></div>
        <div className="w-11" />
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto w-full max-w-3xl">
          {stage === "home" && (
            <section className="space-y-5">
              <div className="rounded-3xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/15 to-slate-900 p-5">
                <div className="flex items-start gap-4"><div className="rounded-2xl bg-cyan-400/15 p-3 text-cyan-300"><MousePointer2 size={30} /></div><div><p className="text-sm font-bold text-cyan-300">Program ilerlemesi</p><p className="mt-1 text-4xl font-black">{progressCount}<span className="text-base font-bold text-slate-400"> / {PROGRAM_TARGET_COUNT} farklı nesne veya resim</span></p></div></div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-cyan-400" style={{ width: `${(progressCount / PROGRAM_TARGET_COUNT) * 100}%` }} /></div>
              </div>

              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4"><div className="flex items-center gap-2"><CheckCircle2 className="text-emerald-400" /><h2 className="font-black">6 pekiştireç hazır</h2></div><div className="mt-3 flex flex-wrap gap-2">{reinforcers.map((item) => <span key={item.id} className="rounded-full border border-emerald-500/20 bg-slate-950/50 px-3 py-1.5 text-xs font-bold text-emerald-100">{item.rank}. {item.name}</span>)}</div></div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><h2 className="font-black">Değerlendirme biçimini seçin</h2><p className="mt-1 text-sm text-slate-400">Her iki yöntemde de öğrencinin işaret parmağını kullanıp kullanmadığını öğretmen değerlendirir.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><button type="button" disabled={reinforcers.some((item) => !item.image)} onClick={() => startAssessment("digital")} className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 text-left disabled:opacity-40"><MonitorSmartphone className="text-blue-400" /><h3 className="mt-3 font-black">Görseller ekranda</h3><p className="mt-1 text-sm text-slate-300">Üç görsel gösterilir; öğrenci istediğini işaret parmağıyla gösterir.</p></button><button type="button" onClick={() => startAssessment("real")} className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-left"><PackageOpen className="text-amber-400" /><h3 className="mt-3 font-black">Gerçek nesnelerle</h3><p className="mt-1 text-sm text-slate-300">Ekrandaki üç isimdeki gerçek pekiştireç öğrencinin önüne konur.</p></button></div></div>

              <button type="button" onClick={() => setStage("practice")} className="flex w-full items-center gap-4 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-5 text-left"><GraduationCap className="shrink-0 text-violet-400" size={31} /><div className="flex-1"><h2 className="font-black">Çalışma Modu</h2><p className="mt-1 text-sm text-slate-300">İpucu ve model kullanarak çalışın. Sonuca eklenmez.</p></div><ChevronRight className="text-violet-400" /></button>
            </section>
          )}

          {stage === "assessment" && currentTrial && (
            <section className="flex min-h-[72vh] flex-col justify-center">
              <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-cyan-400" style={{ width: `${(results.length / TRIAL_COUNT) * 100}%` }} /></div>
              <div className="rounded-[2rem] border border-slate-700 bg-slate-900 p-5 text-center shadow-2xl sm:p-8">
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-cyan-300">Öğrenciye söyleyin</span>
                <h2 className="my-5 text-3xl font-black sm:text-5xl">“Hangisini istiyorsun? Göster.”</h2>
                <p className="mb-5 text-sm leading-relaxed text-slate-400">{presentationMode === "digital" ? "Öğrenci ekrandaki görsellerden istediğini işaret parmağıyla göstersin." : "Aşağıdaki pekiştireçlerin gerçeklerini öğrencinin önüne koyun."}</p>

                <div className="grid grid-cols-3 gap-2 sm:gap-4">{currentTrial.options.map((item) => <button key={item.id} type="button" disabled={!timerRunning || locked} onClick={() => setSelectedId(item.id)} className={twMerge("rounded-2xl border p-2 transition active:scale-95", selectedId === item.id ? "border-cyan-400 bg-cyan-500/20" : "border-slate-700 bg-slate-950")}><div className="flex h-28 items-center justify-center overflow-hidden rounded-xl bg-white sm:h-40">{presentationMode === "digital" && item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-contain p-2" /> : <PackageOpen className="text-slate-400" size={42} />}</div><p className="mt-2 break-words text-xs font-black sm:text-sm">{item.name}</p></button>)}</div>

                {!timerRunning && !locked && <div className="mt-6"><p className="mb-3 text-sm text-slate-400">Seçenekler hazır olduğunda yönergeyi söyleyin ve süreyi başlatın.</p><button type="button" onClick={beginResponseWindow} className="mx-auto flex items-center gap-2 rounded-2xl bg-cyan-500 px-7 py-4 font-black text-slate-950"><Eye /> Yönergeyi Verdim</button></div>}

                {timerRunning && <div className="mt-6 space-y-4"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-cyan-400 bg-cyan-500/10 text-3xl font-black text-cyan-200">{secondsLeft.toFixed(1)}</div><p className="text-sm font-bold text-slate-300">Öğrencinin gösterdiği seçeneği yukarıdan işaretleyin.</p><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => finishTrial(false)} className="flex min-h-20 items-center justify-center gap-2 rounded-2xl border border-red-500/35 bg-red-500/10 p-3 font-black text-red-300"><X size={25} /> Etmedi / Yanlış</button><button type="button" disabled={!selectedId} onClick={() => finishTrial(true)} className="flex min-h-20 items-center justify-center gap-2 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-3 font-black text-emerald-300 disabled:opacity-35"><Check size={25} /> İşaret Parmağıyla Gösterdi</button></div><p className="text-xs leading-relaxed text-slate-500">Tüm elle gösterme, uzanıp alma veya yardımlı tepki yanlış kabul edilir.</p></div>}

                {locked && !timerRunning && trialIndex + 1 < TRIAL_COUNT && <div className="mt-6 flex flex-col items-center gap-3">{results[results.length - 1]?.correct ? <><Gift className="text-amber-400" size={30} /><p className="font-bold text-amber-200">Seçtiği pekiştireci hemen verin.</p></> : <><XCircle className="text-red-400" size={30} /><p className="font-bold text-red-200">Bu denemede pekiştireç vermeyin.</p></>}<p className="text-sm text-slate-400">Sonraki deneme için 3 saniye bekleniyor…</p></div>}
              </div>
            </section>
          )}

          {stage === "practice" && (
            <section className="space-y-5">
              <button type="button" onClick={() => setStage("home")} className="flex items-center gap-2 text-sm font-bold text-slate-400"><ArrowLeft size={18} /> Geri</button>
              <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4"><div className="flex gap-3"><GraduationCap className="shrink-0 text-violet-400" /><div><h2 className="text-xl font-black">Çalışma Modu</h2><p className="mt-1 text-sm leading-relaxed text-slate-300">Bu bölüm değerlendirme puanına ve 20 nesnelik ilerlemeye eklenmez.</p></div></div></div>
              <PracticeStep number="1" title="İki seçenek sunun" text="İstediğini düşündüğünüz pekiştireç ile daha az tercih edeceğini düşündüğünüz başka bir seçeneği gösterin." />
              <PracticeStep number="2" title="Yönergeyi verin" text="“Hangisini istiyorsun? Göster.” deyin ve 3–5 saniye bağımsız tepkiyi bekleyin." />
              <PracticeStep number="3" title="Gerekirse öğretin" text="İşaret etmezse başat elinin işaret parmağından hafifçe yönlendirin ve siz de işaret ederek model olun. Ardından yeniden bağımsız fırsat verin." />
              <PracticeStep number="4" title="Seçtiğini hemen verin" text="Bağımsız veya öğretim sırasında işaret ettiğinde istediği pekiştirece hemen ulaşmasını sağlayın." />
              <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4"><div className="flex gap-3"><Hand className="shrink-0 text-red-400" /><p className="text-sm leading-relaxed text-slate-300"><strong className="text-red-300">Tüm eliyle göstermeyi doğru kabul etmeyin.</strong> Hedef davranış yalnızca işaret parmağıyla göstermedir.</p></div></div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><h3 className="mb-3 flex items-center gap-2 font-black"><Gift className="text-amber-400" size={19} /> Kayıtlı pekiştireçler</h3><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{reinforcers.map((item) => <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-center"><ImageIcon className="mx-auto text-slate-500" size={21} /><p className="mt-2 text-xs font-bold">{item.name}</p></div>)}</div></div>
            </section>
          )}

          {stage === "result" && (
            <section className="space-y-5 text-center">
              <div className={twMerge("rounded-3xl border p-6", setPassed ? "border-emerald-500/30 bg-emerald-500/10" : "border-orange-500/30 bg-orange-500/10")}>
                {programCompleted ? <Trophy className="mx-auto mb-4 text-amber-400" size={64} /> : setPassed ? <CheckCircle2 className="mx-auto mb-4 text-emerald-400" size={58} /> : <XCircle className="mx-auto mb-4 text-orange-400" size={58} />}
                <h2 className="text-2xl font-black">{programCompleted ? "Kazanım Tamamlandı!" : setPassed ? "Set Başarılı" : "Set Tekrarlanmalı"}</h2>
                <p className="mt-3 text-4xl font-black">{correctCount} / {TRIAL_COUNT}</p><p className="mt-1 text-sm text-slate-300">Set geçme ölçütü: en az {PASS_COUNT}/{TRIAL_COUNT}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-left"><div className="flex items-center justify-between"><h3 className="font-black">Program ilerlemesi</h3><span className="font-black text-cyan-300">{projectedMasteredCount}/{PROGRAM_TARGET_COUNT}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-cyan-400" style={{ width: `${(projectedMasteredCount / PROGRAM_TARGET_COUNT) * 100}%` }} /></div><p className="mt-3 text-sm leading-relaxed text-slate-300">{setPassed ? newlyMastered.length > 0 ? `İşaret parmağıyla bağımsız gösterilen ${newlyMastered.length} yeni pekiştireç ilerlemeye eklenecek.` : "Bağımsız gösterilen pekiştireçler daha önce başarılanlar arasında." : "Set %80'in altında kaldığı için bu oturum program ilerlemesine eklenmeyecek."}</p></div>
              <div className="space-y-2 text-left">{results.map((result, index) => <div key={result.trialId} className={twMerge("flex items-center gap-3 rounded-xl border p-3", result.correct ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5")}><span className={twMerge("flex h-8 w-8 items-center justify-center rounded-full", result.correct ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300")}>{result.correct ? <Check size={17} /> : <X size={17} />}</span><span className="flex-1 font-bold">{index + 1}. {result.selectedName || "İşaret etmedi / yanlış tepki"}</span></div>)}</div>
              <button type="button" disabled={saving} onClick={saveResult} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 p-4 font-black text-slate-950 disabled:opacity-50">{saving ? <Loader2 className="animate-spin" /> : <Save />} Kaydet ve Çık</button>
            </section>
          )}
        </div>
      </main>

      {showExitDialog && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"><div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5"><h3 className="font-black">Değerlendirme kaydedilmedi</h3><p className="mt-2 text-sm leading-relaxed text-slate-300">Şimdi çıkarsanız bu oturumdaki işaretlemeler kaybolur.</p><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={() => setShowExitDialog(false)} className="rounded-xl border border-slate-700 p-3 font-bold text-slate-300">Devam Et</button><button type="button" onClick={() => { clearTimer(); onClose(); }} className="rounded-xl bg-red-600 p-3 font-bold">Çık</button></div></div></div>}
    </div>
  );
}

function PracticeStep({ number, title, text }: { number: string; title: string; text: string }) {
  return <div className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/15 font-black text-violet-300">{number}</span><div><h3 className="font-black">{title}</h3><p className="mt-1 text-sm leading-relaxed text-slate-300">{text}</p></div></div>;
}
