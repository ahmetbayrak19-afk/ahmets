import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Eye,
  Loader2,
  Save,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

import { db } from "@/firebase";

const PASS_COUNT = 8;

interface TargetItem {
  id: string;
  name: string;
  instruction: string;
}

interface TrialResult {
  targetId: string;
  targetName: string;
  instruction: string;
  looked: boolean;
}

interface OrtakDikkat4Props {
  studentId: string;
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

const TARGETS: TargetItem[] = [
  { id: "kalem", name: "Kalem", instruction: "Kaleme bak." },
  { id: "kitap", name: "Kitap", instruction: "Kitaba bak." },
  { id: "tahta", name: "Tahta", instruction: "Tahtaya bak." },
  { id: "kapi", name: "Kapı", instruction: "Kapıya bak." },
  { id: "pencere", name: "Pencere", instruction: "Pencereye bak." },
  { id: "saat", name: "Saat", instruction: "Saate bak." },
  { id: "canta", name: "Çanta", instruction: "Çantaya bak." },
  { id: "masa", name: "Masa", instruction: "Masaya bak." },
  { id: "sandalye", name: "Sandalye", instruction: "Sandalyeye bak." },
  { id: "dolap", name: "Dolap", instruction: "Dolaba bak." },
];

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
};

export default function OrtakDikkat4({
  studentId,
  itemCode = "OD 1.4",
  itemText = '“…..’ya bak.” Yönergesine Uygun Tepkide Bulunma',
  onClose,
  onComplete,
}: OrtakDikkat4Props) {
  const [targets] = useState(() => shuffle(TARGETS));
  const [results, setResults] = useState<TrialResult[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const currentTarget = targets[results.length];
  const correctCount = results.filter((result) => result.looked).length;
  const passed = results.length === TARGETS.length && correctCount >= PASS_COUNT;

  const recordResponse = (looked: boolean) => {
    if (locked || !currentTarget) return;
    setLocked(true);

    const nextResults = [
      ...results,
      {
        targetId: currentTarget.id,
        targetName: currentTarget.name,
        instruction: currentTarget.instruction,
        looked,
      },
    ];
    setResults(nextResults);

    window.setTimeout(() => {
      if (nextResults.length === TARGETS.length) {
        const finalCorrectCount = nextResults.filter((result) => result.looked).length;
        if (finalCorrectCount >= PASS_COUNT) {
          confetti({ particleCount: 200, spread: 85, origin: { y: 0.62 } });
        }
        setShowResult(true);
      }
      setLocked(false);
    }, 300);
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
          "ortakDikkat14",
        ),
        {
          version: 2,
          lastSession: {
            results,
            correctCount,
            totalCount: TARGETS.length,
            successRate: correctCount * 10,
            passed,
            completedAt: new Date().toISOString(),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      toast.success("1.4 değerlendirmesi kaydedildi.");
      onComplete(passed);
    } catch (error) {
      console.error(error);
      toast.error("Değerlendirme kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const requestClose = () => {
    if (results.length > 0) setShowExitDialog(true);
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col bg-slate-950 text-white">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/95 px-4 py-3">
        <button
          type="button"
          onClick={requestClose}
          className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label="Kapat"
        >
          <XCircle size={27} />
        </button>

        <div className="min-w-0 px-2 text-center">
          <h1 className="truncate text-sm font-black sm:text-base">
            {itemCode} — {itemText}
          </h1>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            {showResult ? "Sonuç" : `Değerlendirme ${Math.min(results.length + 1, TARGETS.length)}/${TARGETS.length}`}
          </p>
        </div>

        <div className="w-11" />
      </header>

      <main className="flex flex-1 items-center justify-center overflow-y-auto p-4 sm:p-6">
        <div className="w-full max-w-2xl">
          {!showResult && currentTarget && (
            <section>
              <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-cyan-400 transition-all"
                  style={{ width: `${(results.length / TARGETS.length) * 100}%` }}
                />
              </div>

              <div className="rounded-[2rem] border border-slate-700 bg-slate-900 p-6 text-center shadow-2xl sm:p-10">
                <Eye className="mx-auto text-cyan-400" size={48} />
                <p className="mt-5 text-xs font-black uppercase tracking-wider text-cyan-300">
                  Öğrenciye söyleyin
                </p>
                <h2 className="my-7 text-4xl font-black sm:text-6xl">
                  “{currentTarget.instruction}”
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => recordResponse(false)}
                    className="flex min-h-24 items-center justify-center gap-2 rounded-2xl border border-red-500/45 bg-red-500/15 p-4 text-lg font-black text-red-300 active:scale-[0.98] disabled:opacity-50"
                  >
                    <X size={28} /> Bakmadı
                  </button>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => recordResponse(true)}
                    className="flex min-h-24 items-center justify-center gap-2 rounded-2xl border border-emerald-500/45 bg-emerald-500/15 p-4 text-lg font-black text-emerald-300 active:scale-[0.98] disabled:opacity-50"
                  >
                    <Check size={28} /> Baktı
                  </button>
                </div>
              </div>
            </section>
          )}

          {showResult && (
            <section className="space-y-5 text-center">
              <div
                className={twMerge(
                  "rounded-3xl border p-7",
                  passed
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-orange-500/30 bg-orange-500/10",
                )}
              >
                {passed ? (
                  <Trophy className="mx-auto mb-4 text-amber-400" size={64} />
                ) : (
                  <XCircle className="mx-auto mb-4 text-orange-400" size={58} />
                )}
                <h2 className="text-2xl font-black">
                  {passed ? "Kazanım Başarılı" : "Kazanım Henüz Başarılı Değil"}
                </h2>
                <p className="mt-3 text-5xl font-black">{correctCount} / {TARGETS.length}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left sm:grid-cols-5">
                {results.map((result) => (
                  <div
                    key={result.targetId}
                    className={twMerge(
                      "rounded-xl border p-3 text-center text-sm font-bold",
                      result.looked
                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                        : "border-red-500/25 bg-red-500/10 text-red-200",
                    )}
                  >
                    {result.looked ? (
                      <CheckCircle2 className="mx-auto mb-2" size={19} />
                    ) : (
                      <XCircle className="mx-auto mb-2" size={19} />
                    )}
                    {result.targetName}
                  </div>
                ))}
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={saveResult}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 p-4 font-black text-slate-950 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" /> : <Save />}
                Kaydet ve Çık
              </button>
            </section>
          )}
        </div>
      </main>

      {showExitDialog && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <h3 className="font-black">Değerlendirme kaydedilmedi</h3>
            <p className="mt-2 text-sm text-slate-300">
              Şimdi çıkarsanız bu değerlendirme kaybolur.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowExitDialog(false)}
                className="rounded-xl border border-slate-700 p-3 font-bold text-slate-300"
              >
                Devam Et
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-red-600 p-3 font-bold"
              >
                Çık
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
