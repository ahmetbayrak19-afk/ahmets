import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  GraduationCap,
  Loader2,
  PlayCircle,
  Plus,
  Save,
  Target,
  Trash2,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { toast } from "sonner";

import { db } from "@/firebase";
import { associateCurrentTeacherWithStudent } from "@/lib/studentTeacherAssociation";

const PROGRAM_TARGET_COUNT = 20;
const PASS_RATE = 80;
const MAX_TARGETS_PER_SET = 20;
const RESPONSE_WINDOW_SECONDS = 5;

type Stage = "home" | "setup" | "assessment" | "result" | "practice";

interface MasteredTarget {
  name: string;
  normalizedName: string;
  achievedAt: string;
}

interface TrialResult {
  name: string;
  normalizedName: string;
  correct: boolean;
}

interface StoredProfile {
  masteredTargets?: MasteredTarget[];
  knownTargets?: string[];
  sessionCount?: number;
  updatedAt?: unknown;
}

interface OrtakDikkat4Props {
  studentId: string;
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

const normalizeName = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ");

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
};

const DATIVE_EXCEPTIONS: Record<string, string> = {
  top: "topa",
  kitap: "kitaba",
  bebek: "bebeğe",
  çiçek: "çiçeğe",
  ağaç: "ağaca",
  bardak: "bardağa",
  oyuncak: "oyuncağa",
  köpek: "köpeğe",
  kulak: "kulağa",
};

const toDative = (target: string) => {
  const trimmed = target.trim();
  if (!trimmed) return "";
  const words = trimmed.split(/\s+/);
  const finalWord = words[words.length - 1];
  const lowerFinalWord = finalWord.toLocaleLowerCase("tr-TR");
  const exception = DATIVE_EXCEPTIONS[lowerFinalWord];
  if (exception) {
    words[words.length - 1] = finalWord[0] === finalWord[0]?.toLocaleUpperCase("tr-TR")
      ? exception[0].toLocaleUpperCase("tr-TR") + exception.slice(1)
      : exception;
    return words.join(" ");
  }

  const vowels = Array.from(lowerFinalWord).filter((letter) => "aeıioöuü".includes(letter));
  const finalVowel = vowels[vowels.length - 1] || "a";
  const suffix = "eéiöü".includes(finalVowel) ? "e" : "a";
  const buffer = "aeıioöuü".includes(lowerFinalWord.at(-1) || "") ? "y" : "";
  words[words.length - 1] = `${finalWord}${buffer}${suffix}`;
  return words.join(" ");
};

const makeInstruction = (target: string) => `“${toDative(target)} bak.”`;

export default function OrtakDikkat4({
  studentId,
  itemCode = "OD 1.4",
  itemText = '"…..\'ya bak." Yönergesine Uygun Tepkide Bulunma',
  onClose,
  onComplete,
}: OrtakDikkat4Props) {
  const [stage, setStage] = useState<Stage>("home");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const [masteredTargets, setMasteredTargets] = useState<MasteredTarget[]>([]);
  const [knownTargets, setKnownTargets] = useState<string[]>([]);
  const [sessionCount, setSessionCount] = useState(0);

  const [targetInput, setTargetInput] = useState("");
  const [sessionTargets, setSessionTargets] = useState<string[]>([]);
  const [orderedTargets, setOrderedTargets] = useState<string[]>([]);
  const [trialIndex, setTrialIndex] = useState(0);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESPONSE_WINDOW_SECONDS);
  const [locked, setLocked] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);

  const [practiceTarget, setPracticeTarget] = useState("");

  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const deadlineRef = useRef(0);

  const displayText = itemText.replace(/^1\.4\.\s*/, "");

  useEffect(() => {
    const loadProfile = async () => {
      const institutionId = localStorage.getItem("kazanim-takip-institution-id");
      if (!institutionId || !studentId) {
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDoc(
          doc(
            db,
            "institutions",
            institutionId,
            "students",
            studentId,
            "profiles",
            "ortakDikkat14",
          ),
        );
        if (snapshot.exists()) {
          const data = snapshot.data() as StoredProfile;
          setMasteredTargets((data.masteredTargets || []).slice(0, PROGRAM_TARGET_COUNT));
          setKnownTargets(data.knownTargets || []);
          setSessionCount(data.sessionCount || 0);
        }
      } catch (error) {
        console.error(error);
        toast.error("1.4 ilerleme bilgileri yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [studentId]);

  const clearTimer = () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  };

  useEffect(() => () => clearTimer(), []);

  const masteredNames = useMemo(
    () => new Set(masteredTargets.map((target) => target.normalizedName)),
    [masteredTargets],
  );

  const selectedNames = useMemo(
    () => new Set(sessionTargets.map(normalizeName)),
    [sessionTargets],
  );

  const targetSuggestions = useMemo(
    () => knownTargets.filter((name) => !selectedNames.has(normalizeName(name))).slice(0, 12),
    [knownTargets, selectedNames],
  );

  const correctCount = results.filter((result) => result.correct).length;
  const resultRate = results.length > 0
    ? Math.round((correctCount / results.length) * 100)
    : 0;
  const setPassed = results.length > 0 && resultRate >= PASS_RATE;

  const newMasteredResults = useMemo(() => {
    if (!setPassed) return [];
    return results.filter(
      (result) => result.correct && !masteredNames.has(result.normalizedName),
    );
  }, [masteredNames, results, setPassed]);

  const projectedMasteredCount = Math.min(
    PROGRAM_TARGET_COUNT,
    masteredTargets.length + newMasteredResults.length,
  );
  const programCompleted = projectedMasteredCount >= PROGRAM_TARGET_COUNT;

  const addTarget = (rawName = targetInput) => {
    const name = rawName.trim();
    const normalizedName = normalizeName(name);
    if (!name) return;
    if (sessionTargets.length >= MAX_TARGETS_PER_SET) {
      toast.error(`Bir sette en fazla ${MAX_TARGETS_PER_SET} nesne değerlendirebilirsiniz.`);
      return;
    }
    if (selectedNames.has(normalizedName)) {
      toast.info("Bu nesne sete zaten eklendi.");
      return;
    }
    setSessionTargets((current) => [...current, name]);
    setTargetInput("");
  };

  const removeTarget = (name: string) => {
    const normalizedName = normalizeName(name);
    setSessionTargets((current) =>
      current.filter((target) => normalizeName(target) !== normalizedName),
    );
  };

  const startAssessment = () => {
    if (sessionTargets.length === 0) {
      toast.error("Değerlendirmek için en az bir nesne ekleyin.");
      return;
    }
    clearTimer();
    setOrderedTargets(shuffle(sessionTargets));
    setTrialIndex(0);
    setResults([]);
    setTimerRunning(false);
    setSecondsLeft(RESPONSE_WINDOW_SECONDS);
    setLocked(false);
    setSessionSaved(false);
    setStage("assessment");
  };

  const finishTrial = (correct: boolean, timedOut = false) => {
    if ((!timerRunning && !timedOut) || locked) return;
    clearTimer();
    setLocked(true);
    setTimerRunning(false);

    const currentTarget = orderedTargets[trialIndex];
    const nextResults = [
      ...results,
      {
        name: currentTarget,
        normalizedName: normalizeName(currentTarget),
        correct,
      },
    ];
    setResults(nextResults);

    const isLastTrial = trialIndex + 1 >= orderedTargets.length;
    window.setTimeout(() => {
      if (isLastTrial) {
        setStage("result");
      } else {
        setTrialIndex((current) => current + 1);
        setSecondsLeft(RESPONSE_WINDOW_SECONDS);
        setLocked(false);
      }
    }, isLastTrial ? 450 : 3000);
  };

  const beginResponseWindow = () => {
    if (timerRunning || locked) return;
    deadlineRef.current = Date.now() + RESPONSE_WINDOW_SECONDS * 1000;
    setSecondsLeft(RESPONSE_WINDOW_SECONDS);
    setTimerRunning(true);

    intervalRef.current = window.setInterval(() => {
      const remaining = Math.max(0, (deadlineRef.current - Date.now()) / 1000);
      setSecondsLeft(remaining);
    }, 100);
    timeoutRef.current = window.setTimeout(
      () => finishTrial(false, true),
      RESPONSE_WINDOW_SECONDS * 1000,
    );
  };

  const mergedMasteredTargets = () => {
    if (!setPassed) return masteredTargets;
    const now = new Date().toISOString();
    const merged = [...masteredTargets];
    newMasteredResults.forEach((result) => {
      if (!merged.some((target) => target.normalizedName === result.normalizedName)) {
        merged.push({
          name: result.name,
          normalizedName: result.normalizedName,
          achievedAt: now,
        });
      }
    });
    return merged.slice(0, PROGRAM_TARGET_COUNT);
  };

  const saveSession = async (exitAfterSave: boolean) => {
    if (sessionSaved && exitAfterSave) {
      onComplete(masteredTargets.length >= PROGRAM_TARGET_COUNT);
      return;
    }

    const institutionId = localStorage.getItem("kazanim-takip-institution-id");
    if (!institutionId || !studentId) {
      toast.error("Öğrenci veya kurum bilgisi bulunamadı.");
      return;
    }

    setSaving(true);
    try {
      const nextMasteredTargets = mergedMasteredTargets();
      const nextKnownTargets = Array.from(
        new Map(
          [...knownTargets, ...sessionTargets].map((name) => [normalizeName(name), name]),
        ).values(),
      );

      await setDoc(
        doc(
          db,
          "institutions",
          institutionId,
          "students",
          studentId,
          "profiles",
          "ortakDikkat14",
        ),
        {
          masteredTargets: nextMasteredTargets,
          knownTargets: nextKnownTargets,
          sessionCount: sessionCount + 1,
          lastSession: {
            targets: sessionTargets,
            results,
            correctCount,
            totalCount: results.length,
            successRate: resultRate,
            setPassed,
            completedAt: new Date().toISOString(),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      await associateCurrentTeacherWithStudent(studentId);

      setMasteredTargets(nextMasteredTargets);
      setKnownTargets(nextKnownTargets);
      setSessionCount((current) => current + 1);
      setSessionSaved(true);
      toast.success("Değerlendirme kaydedildi.");

      const completed = nextMasteredTargets.length >= PROGRAM_TARGET_COUNT;
      if (completed) {
        confetti({ particleCount: 220, spread: 90, origin: { y: 0.62 } });
      }

      if (exitAfterSave) {
        onComplete(completed);
      } else {
        setSessionTargets([]);
        setTargetInput("");
        setResults([]);
        setOrderedTargets([]);
        setSessionSaved(false);
        setStage("setup");
      }
    } catch (error) {
      console.error(error);
      toast.error("Değerlendirme kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const requestClose = () => {
    const hasUnfinishedWork =
      stage === "assessment"
      || (stage === "result" && !sessionSaved)
      || (stage === "setup" && sessionTargets.length > 0);
    if (hasUnfinishedWork) setShowExitDialog(true);
    else onClose();
  };

  const resetToHome = () => {
    clearTimer();
    setSessionTargets([]);
    setTargetInput("");
    setOrderedTargets([]);
    setResults([]);
    setTimerRunning(false);
    setLocked(false);
    setStage("home");
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="animate-spin text-cyan-400" size={38} />
      </div>
    );
  }

  const currentTarget = orderedTargets[trialIndex];
  const progressPercent = Math.min(
    100,
    Math.round((masteredTargets.length / PROGRAM_TARGET_COUNT) * 100),
  );

  return (
    <div className="fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col bg-slate-950 text-white">
      <header className="z-20 flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={requestClose}
          className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          aria-label="Kapat"
        >
          <XCircle size={27} />
        </button>
        <div className="min-w-0 px-2 text-center">
          <h1 className="truncate text-sm font-black sm:text-base">
            {itemCode} — {displayText}
          </h1>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            {stage === "assessment" ? `Değerlendirme ${trialIndex + 1}/${orderedTargets.length}` : stage === "practice" ? "Çalışma" : stage === "result" ? "Sonuç" : "Hazırlık"}
          </p>
        </div>
        <div className="w-11" />
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto w-full max-w-3xl">
          {stage === "home" && (
            <section className="space-y-5">
              <div className="rounded-3xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/15 to-slate-900 p-5 shadow-2xl">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-cyan-400/15 p-3 text-cyan-300"><Target size={30} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-cyan-300">Program ilerlemesi</p>
                    <div className="mt-1 flex items-end gap-2">
                      <span className="text-4xl font-black">{masteredTargets.length}</span>
                      <span className="pb-1 text-slate-400">/ {PROGRAM_TARGET_COUNT} farklı nesne</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  Kazanımın tamamlanması için öğrenci, geçen değerlendirme setlerinde toplam 20 farklı nesneye bağımsız olarak bakmalıdır.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStage("setup")}
                className="flex w-full items-center gap-4 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-5 text-left transition active:scale-[0.99]"
              >
                <ClipboardCheck className="shrink-0 text-emerald-400" size={32} />
                <div className="flex-1"><h2 className="text-lg font-black">Değerlendirmeye Başla</h2><p className="mt-1 text-sm text-slate-300">Bu oturumda kullanacağınız nesneleri yazın ve bağımsız tepkileri kaydedin.</p></div>
                <PlayCircle className="text-emerald-400" />
              </button>

              <button
                type="button"
                onClick={() => setStage("practice")}
                className="flex w-full items-center gap-4 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-5 text-left transition active:scale-[0.99]"
              >
                <GraduationCap className="shrink-0 text-violet-400" size={32} />
                <div className="flex-1"><h2 className="text-lg font-black">Çalışma Modu</h2><p className="mt-1 text-sm text-slate-300">Öğretim basamaklarını uygulayın. Bu bölüm değerlendirme sonucuna eklenmez.</p></div>
                <BookOpenCheck className="text-violet-400" />
              </button>

              {masteredTargets.length > 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-200"><CheckCircle2 className="text-emerald-400" size={18} /> Başarılan nesneler</h3>
                  <div className="flex flex-wrap gap-2">
                    {masteredTargets.map((target, index) => (
                      <span key={target.normalizedName} className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-200">{index + 1}. {target.name}</span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {stage === "setup" && (
            <section className="space-y-5">
              <button type="button" onClick={resetToHome} className="flex items-center gap-2 text-sm font-bold text-slate-400"><ArrowLeft size={18} /> Geri</button>
              <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/10 p-4">
                <h2 className="text-xl font-black">Bu setteki nesneleri yazın</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">20 nesnenin tamamını şimdi yazmanız gerekmez. Bu oturumda değerlendireceğiniz nesneleri ekleyin.</p>
              </div>

              <div className="flex gap-2">
                <input
                  value={targetInput}
                  onChange={(event) => setTargetInput(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") addTarget(); }}
                  placeholder="Örn. top, bardak, pencere"
                  maxLength={50}
                  className="min-w-0 flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
                />
                <button type="button" onClick={() => addTarget()} className="rounded-2xl bg-cyan-500 px-4 font-black text-slate-950"><Plus /></button>
              </div>

              {targetSuggestions.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Daha önce kullanılanlar</p>
                  <div className="flex flex-wrap gap-2">{targetSuggestions.map((name) => <button key={normalizeName(name)} type="button" onClick={() => addTarget(name)} className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300"><Plus className="mr-1 inline" size={13} />{name}</button>)}</div>
                </div>
              )}

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="mb-3 flex items-center justify-between"><h3 className="font-black">Değerlendirme seti</h3><span className="text-sm font-bold text-cyan-300">{sessionTargets.length}/{MAX_TARGETS_PER_SET}</span></div>
                {sessionTargets.length === 0 ? <p className="rounded-xl border border-dashed border-slate-700 p-5 text-center text-sm text-slate-500">Henüz nesne eklenmedi.</p> : <div className="space-y-2">{sessionTargets.map((name, index) => <div key={normalizeName(name)} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-black text-cyan-300">{index + 1}</span><span className="flex-1 font-bold">{name}</span>{masteredNames.has(normalizeName(name)) && <span className="text-[10px] font-bold text-emerald-400">DAHA ÖNCE BAŞARILDI</span>}<button type="button" onClick={() => removeTarget(name)} className="rounded-lg p-2 text-red-400"><Trash2 size={17} /></button></div>)}</div>}
              </div>

              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-relaxed text-slate-300">
                Öğrenci yönergeden sonra <strong className="text-amber-200">3–5 saniye içinde</strong> gösterilen nesneye yardımsız bakarsa doğru sayın. Yanlış nesneye bakma, tepkisizlik veya ipucuyla bakma yanlış kabul edilir.
              </div>

              <button type="button" disabled={sessionTargets.length === 0} onClick={startAssessment} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 p-4 font-black text-slate-950 disabled:bg-slate-800 disabled:text-slate-500"><PlayCircle /> Değerlendirmeyi Başlat</button>
            </section>
          )}

          {stage === "assessment" && currentTarget && (
            <section className="flex min-h-[70vh] flex-col justify-center">
              <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-cyan-400" style={{ width: `${((trialIndex + (results.length > trialIndex ? 1 : 0)) / orderedTargets.length) * 100}%` }} /></div>
              <div className="rounded-[2rem] border border-slate-700 bg-slate-900 p-6 text-center shadow-2xl sm:p-10">
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-cyan-300">Öğrenciye söyleyin</span>
                <h2 className="my-7 text-4xl font-black leading-tight sm:text-6xl">{makeInstruction(currentTarget)}</h2>

                {!timerRunning && !locked && (
                  <div>
                    <p className="mb-4 text-sm text-slate-400">Nesneyi gösterin. Yönergeyi söylediğiniz anda aşağıdaki düğmeye basın.</p>
                    <button type="button" onClick={beginResponseWindow} className="mx-auto flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-7 py-4 font-black text-slate-950"><Eye size={23} /> Yönergeyi Verdim</button>
                  </div>
                )}

                {timerRunning && (
                  <div className="space-y-5">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-cyan-400 bg-cyan-500/10 text-4xl font-black text-cyan-200">{secondsLeft.toFixed(1)}</div>
                    <p className="text-sm font-bold text-slate-300">Bağımsız tepkiyi işaretleyin</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => finishTrial(false)} className="flex min-h-20 items-center justify-center gap-2 rounded-2xl border border-red-500/35 bg-red-500/10 p-3 font-black text-red-300"><X size={25} /> Bakmadı<br className="sm:hidden" /> / Yanlış</button>
                      <button type="button" onClick={() => finishTrial(true)} className="flex min-h-20 items-center justify-center gap-2 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-3 font-black text-emerald-300"><Check size={25} /> Bağımsız Baktı</button>
                    </div>
                  </div>
                )}

                {locked && !timerRunning && trialIndex + 1 < orderedTargets.length && (
                  <div className="flex flex-col items-center gap-3 text-slate-300">
                    <Loader2 className="animate-spin text-cyan-400" size={30} />
                    <p className="font-bold">Sonraki yönerge için 3 saniye bekleniyor…</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {stage === "result" && (
            <section className="space-y-5 text-center">
              <div className={`rounded-3xl border p-6 ${setPassed ? "border-emerald-500/30 bg-emerald-500/10" : "border-orange-500/30 bg-orange-500/10"}`}>
                {programCompleted ? <Trophy className="mx-auto mb-4 text-amber-400" size={64} /> : setPassed ? <CheckCircle2 className="mx-auto mb-4 text-emerald-400" size={58} /> : <XCircle className="mx-auto mb-4 text-orange-400" size={58} />}
                <h2 className="text-2xl font-black">{programCompleted ? "Kazanım Tamamlandı!" : setPassed ? "Set Başarılı" : "Set Tekrarlanmalı"}</h2>
                <p className="mt-3 text-4xl font-black">{correctCount} / {results.length}</p>
                <p className="mt-1 text-sm text-slate-300">Başarı %{resultRate} · Set geçme ölçütü en az %{PASS_RATE}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-left">
                <div className="flex items-center justify-between"><h3 className="font-black">Program ilerlemesi</h3><span className="font-black text-cyan-300">{projectedMasteredCount}/{PROGRAM_TARGET_COUNT}</span></div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-cyan-400" style={{ width: `${(projectedMasteredCount / PROGRAM_TARGET_COUNT) * 100}%` }} /></div>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{setPassed ? newMasteredResults.length > 0 ? `Bu sette bağımsız bakılan ${newMasteredResults.length} yeni nesne ilerlemeye eklenecek.` : "Bu setteki doğru nesneler daha önce başarılanlar arasında bulunuyor." : "Set %80'in altında kaldığı için bu oturumdaki nesneler program ilerlemesine eklenmeyecek."}</p>
              </div>

              <div className="space-y-2 text-left">{results.map((result, index) => <div key={`${result.normalizedName}-${index}`} className={`flex items-center gap-3 rounded-xl border p-3 ${result.correct ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}><span className={`flex h-8 w-8 items-center justify-center rounded-full ${result.correct ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>{result.correct ? <Check size={17} /> : <X size={17} />}</span><span className="flex-1 font-bold">{result.name}</span><span className={`text-xs font-black ${result.correct ? "text-emerald-400" : "text-red-400"}`}>{result.correct ? "BAĞIMSIZ" : "YANLIŞ"}</span></div>)}</div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" disabled={saving} onClick={() => saveSession(false)} className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/35 bg-cyan-500/10 p-4 font-black text-cyan-200 disabled:opacity-50">{saving ? <Loader2 className="animate-spin" /> : <Plus />} Kaydet ve Yeni Set</button>
                <button type="button" disabled={saving} onClick={() => saveSession(true)} className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 p-4 font-black text-slate-950 disabled:opacity-50">{saving ? <Loader2 className="animate-spin" /> : <Save />} Kaydet ve Çık</button>
              </div>
            </section>
          )}

          {stage === "practice" && (
            <section className="space-y-5">
              <button type="button" onClick={() => setStage("home")} className="flex items-center gap-2 text-sm font-bold text-slate-400"><ArrowLeft size={18} /> Geri</button>
              <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4">
                <div className="flex items-start gap-3"><GraduationCap className="shrink-0 text-violet-400" /><div><h2 className="text-xl font-black">Çalışma Modu</h2><p className="mt-1 text-sm leading-relaxed text-slate-300">Buradaki çalışmalar değerlendirme puanına veya 20 nesnelik ilerlemeye eklenmez.</p></div></div>
              </div>

              <input value={practiceTarget} onChange={(event) => setPracticeTarget(event.target.value)} placeholder="Çalışacağınız nesneyi yazın" maxLength={50} className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-4 outline-none focus:border-violet-400" />
              {practiceTarget.trim() && <div className="rounded-3xl border border-violet-500/25 bg-slate-900 p-6 text-center"><p className="text-xs font-black uppercase tracking-wider text-violet-300">Kullanılacak yönerge</p><h3 className="mt-4 text-4xl font-black">{makeInstruction(practiceTarget)}</h3></div>}

              <div className="space-y-3">
                <PracticeStep number="1" title="Dikkatini çekin" text="Öğrencinin yanında veya çaprazında durun. Nesneyi göstererek dikkatini çekin ve yönergeyi verin." />
                <PracticeStep number="2" title="3–5 saniye bekleyin" text="Bağımsız bakarsa hemen pekiştirin ve etkileşimi doğal biçimde sürdürün." />
                <PracticeStep number="3" title="Gerekirse ipucu verin" text="Tepki yoksa omzundan hafifçe yönlendirin. Yüzünden tutmayın. “Baktın” deyip ardından yeniden bağımsız tepki fırsatı sunun." />
                <PracticeStep number="4" title="Günlük yaşama yayın" text="Aynı yönergeyi oyun, şarkı ve günlük etkinliklerin içinde farklı nesnelerle çalışın." />
              </div>
            </section>
          )}
        </div>
      </main>

      {showExitDialog && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-lg font-black">Değerlendirme tamamlanmadı</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">Şimdi çıkarsanız bu oturumdaki tamamlanmamış işaretlemeler kaydedilmez.</p>
            <div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={() => setShowExitDialog(false)} className="rounded-xl border border-slate-700 p-3 font-bold text-slate-300">Devam Et</button><button type="button" onClick={() => { clearTimer(); setShowExitDialog(false); onClose(); }} className="rounded-xl bg-red-600 p-3 font-bold">Çık</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function PracticeStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/15 font-black text-violet-300">{number}</span>
      <div><h3 className="font-black">{title}</h3><p className="mt-1 text-sm leading-relaxed text-slate-300">{text}</p></div>
    </div>
  );
}
