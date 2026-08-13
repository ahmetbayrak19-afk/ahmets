import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Gift,
  Hand,
  Loader2,
  PackageCheck,
  RefreshCw,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

import { db } from "@/firebase";

const TRIAL_COUNT = 10;
const PASS_COUNT = 8;
const REQUIRED_REINFORCERS = 6;

type Stage = "blocked" | "preparation" | "assessment" | "result";

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

interface ChoiceItem {
  id: string;
  name: string;
  canonicalName: string;
  rank: number;
}

interface TrialSlot {
  id: string;
  objectId: string;
  objectName: string;
  prompt: string;
}

interface TrialResult {
  trialNumber: number;
  objectId: string;
  objectName: string;
  prompt: string;
  showed: boolean;
  timestamp: number;
}

interface OrtakDikkat8Props {
  studentId: string;
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
  onOpenReinforcers: () => void;
}

const PROMPT_TEMPLATES = [
  (name: string) => `Elindekini göster.`,
  (name: string) => `Elindeki ne?`,
  (name: string) => `${name}'ı göster.`,
  (name: string) => `${name}'yi göster.`,
];

function canonicalize(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ");
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function resolveReinforcers(items: Reinforcer[]): ChoiceItem[] {
  const seen = new Set<string>();
  return [...items]
    .sort((a, b) => a.rank - b.rank)
    .flatMap((item) => {
      const canonicalName = canonicalize(item.name);
      if (!canonicalName || seen.has(canonicalName)) return [];
      seen.add(canonicalName);
      return [
        {
          id: `reinforcer:${item.id}`,
          name: item.name.trim(),
          canonicalName,
          rank: item.rank,
        },
      ];
    })
    .slice(0, REQUIRED_REINFORCERS);
}

function pickPrompt(name: string, index: number) {
  const tpl = PROMPT_TEMPLATES[index % PROMPT_TEMPLATES.length];
  // 'ı / 'yi basit seçim
  if (tpl === PROMPT_TEMPLATES[2] || tpl === PROMPT_TEMPLATES[3]) {
    const last = name.trim().slice(-1).toLocaleLowerCase("tr-TR");
    if ("aeıioöuü".includes(last)) return `${name}'yi göster.`;
    return `${name}'ı göster.`;
  }
  return tpl(name);
}

function buildTrials(objects: ChoiceItem[]): TrialSlot[] {
  if (!objects.length) return [];
  const rotated = shuffle(objects);
  const slots: TrialSlot[] = [];
  for (let i = 0; i < TRIAL_COUNT; i++) {
    const obj = rotated[i % rotated.length];
    slots.push({
      id: `t${i + 1}-${obj.id}`,
      objectId: obj.id,
      objectName: obj.name,
      prompt: pickPrompt(obj.name, i),
    });
  }
  return shuffle(slots);
}

export default function OrtakDikkat8({
  studentId,
  itemCode = "OD 2.2",
  itemText = "Yönerge Verildiğinde İlgisinin Olduğu Nesneyi Gösterme",
  onClose,
  onComplete,
  onOpenReinforcers,
}: OrtakDikkat8Props) {
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage>("blocked");
  const [reinforcers, setReinforcers] = useState<ChoiceItem[]>([]);
  const [trials, setTrials] = useState<TrialSlot[]>([]);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState<"ok" | "fail" | null>(null);

  useEffect(() => {
    const load = async () => {
      const institutionId = localStorage.getItem("kazanim-takip-institution-id");
      if (!institutionId || !studentId) {
        setLoading(false);
        setStage("blocked");
        return;
      }
      try {
        const snap = await getDoc(
          doc(db, "institutions", institutionId, "students", studentId, "profiles", "abaReinforcers"),
        );
        const saved = snap.exists()
          ? resolveReinforcers((snap.data() as ReinforcerProfile).rankings || [])
          : [];
        setReinforcers(saved);
        if (saved.length === REQUIRED_REINFORCERS) {
          setTrials(buildTrials(saved));
          setStage("preparation");
        } else {
          setStage("blocked");
        }
      } catch (e) {
        console.error(e);
        toast.error("Pekiştireç bilgileri kontrol edilemedi.");
        setStage("blocked");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  const trialIndex = results.length;
  const current = trials[trialIndex];
  const score = results.filter((r) => r.showed).length;
  const success = score >= PASS_COUNT;

  
  const changeOne = (trialIdx: number) => {
    setTrials((prev) => {
      const current = prev[trialIdx];
      if (!current || !reinforcers.length) return prev;
      const others = reinforcers.filter((r) => r.id !== current.objectId);
      const pool = others.length ? others : reinforcers;
      const obj = pool[Math.floor(Math.random() * pool.length)];
      return prev.map((slot, i) =>
        i === trialIdx
          ? {
              ...slot,
              objectId: obj.id,
              objectName: obj.name,
              prompt: pickPrompt(obj.name, i),
            }
          : slot,
      );
    });
  };

  const startAssessment = () => {
    setResults([]);
    setFeedback(null);
    setLocked(false);
    setStage("assessment");
  };

  const recordTrial = (showed: boolean) => {
    if (locked || stage !== "assessment" || !current) return;
    setLocked(true);
    setFeedback(showed ? "ok" : "fail");

    const entry: TrialResult = {
      trialNumber: trialIndex + 1,
      objectId: current.objectId,
      objectName: current.objectName,
      prompt: current.prompt,
      showed,
      timestamp: Date.now(),
    };
    const next = [...results, entry];
    setResults(next);

    window.setTimeout(() => {
      setFeedback(null);
      if (next.length >= TRIAL_COUNT) {
        setStage("result");
        if (next.filter((r) => r.showed).length >= PASS_COUNT) {
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.65 } });
        }
      } else {
        setLocked(false);
      }
    }, 650);
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
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400" aria-label="Kapat">
            <XCircle size={27} />
          </button>
          <div className="min-w-0 flex-1 px-3 text-center">
            <h1 className="truncate text-sm font-black sm:text-base">
              {itemCode} — {itemText}
            </h1>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Giriş Engellendi
            </p>
          </div>
          <div className="w-11" />
        </header>
        <main className="mx-auto flex w-full max-w-xl flex-1 items-center justify-center">
          <section className="w-full rounded-3xl border border-amber-500/35 bg-amber-500/10 p-6 text-center shadow-2xl sm:p-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/15 text-amber-300">
              <AlertTriangle size={42} />
            </div>
            <h2 className="mt-5 text-2xl font-black">Pekiştireçler Henüz Belirlenmedi</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Öğrencinin birbirinden farklı {REQUIRED_REINFORCERS} pekiştireci kaydedilmeden bu
              değerlendirme başlatılamaz. Nesneler çocuğun ilgisindeki pekiştireçlerden seçilir.
            </p>
            <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950/60 p-4 text-left">
              <div className="flex gap-3">
                <Gift className="mt-0.5 shrink-0 text-amber-400" size={21} />
                <p className="text-sm leading-relaxed text-slate-300">
                  Önce Pekiştireç Belirleme sayfasında öğrencinin güncel ilk 6 pekiştirecini kaydedin.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenReinforcers}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 p-4 font-black text-slate-950 active:scale-[0.98]"
            >
              Beni Yönlendir <ChevronRight size={21} />
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col bg-slate-950 font-sans text-white select-none">
      <header className="z-10 flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/90 p-3 backdrop-blur-md sm:p-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label="Kapat"
        >
          <XCircle className="h-7 w-7" />
        </button>
        <div className="min-w-0 px-2 text-center">
          <h2 className="truncate text-sm font-bold text-slate-100 sm:text-base">
            {itemCode} — {itemText}
          </h2>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-slate-400">
            {stage === "preparation" && "HAZIRLIK"}
            {stage === "assessment" && `DEĞERLENDİRME · ${trialIndex + 1} / ${TRIAL_COUNT}`}
            {stage === "result" && "SONUÇ"}
          </p>
        </div>
        <div className="w-10 text-right text-xs font-bold tabular-nums text-cyan-400">
          {stage === "assessment" || stage === "result" ? score : ""}
        </div>
      </header>

      <main className="relative flex flex-1 flex-col items-center overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950 p-3 sm:p-4">
        {stage === "preparation" && (
          <div className="max-h-full w-full max-w-lg space-y-4 overflow-y-auto pb-4 animate-in zoom-in-95 duration-300">
            <div className="rounded-3xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/15 to-slate-900 p-5">
              <div className="flex gap-4">
                <div className="rounded-2xl bg-cyan-400/15 p-3 text-cyan-300">
                  <PackageCheck size={30} />
                </div>
                <div>
                  <h2 className="text-xl font-black">10 nesneyi hazırlayın</h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">
                    Nesneler çocuğun pekiştireçlerinden seçildi. Sağdaki ikonla tek tek
                    değiştirebilirsiniz. Yönergeyi verin; çocuk nesneyi{" "}
                    <span className="font-semibold text-white">uzatarak göstersin</span>.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
              <h3 className="font-black text-sm flex items-center gap-2">
                <Hand className="h-4 w-4 text-emerald-400" /> Öğretmen yönergesi
              </h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-400">
                <li>Çocuk nesneyle ilgilenirken veya elindeyken yönergeyi verin.</li>
                <li>
                  Örnek: <span className="text-slate-200">“Elindekini göster.”</span>,{" "}
                  <span className="text-slate-200">“Elindeki ne?”</span>
                </li>
                <li>3–5 saniye içinde nesneyi size uzatırsa doğru.</li>
                <li>Değerlendirmede ipucu / fiziksel yardım kullanmayın.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                Bu set — {TRIAL_COUNT} nesne
              </p>
              <div className="space-y-1.5">
                {trials.map((slot, idx) => (
                  <div
                    key={slot.id}
                    className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5"
                  >
                    <span className="w-6 shrink-0 text-sm font-bold text-cyan-500">{idx + 1}.</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                      {slot.objectName}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeOne(idx)}
                      className="shrink-0 rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 transition-all hover:border-cyan-500/50 hover:text-cyan-300 active:scale-95"
                      title="Nesneyi değiştir"
                      aria-label="Nesneyi değiştir"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={startAssessment}
              className="w-full rounded-2xl bg-cyan-600 py-3.5 text-base font-bold text-white shadow-lg shadow-cyan-900/40 transition-all hover:bg-cyan-500 active:scale-[0.98]"
            >
              Nesneler hazır — Değerlendirmeyi başlat
            </button>
          </div>
        )}

        {stage === "assessment" && current && (
          <div className="flex h-full w-full max-w-lg flex-col animate-in fade-in duration-200">
            <div className="flex flex-1 flex-col items-center justify-center px-3 text-center">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-cyan-400/90">
                Deneme {trialIndex + 1} / {TRIAL_COUNT}
              </p>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                İlgi nesnesi
              </p>
              <h1 className="mt-1 text-3xl font-black text-white sm:text-4xl">{current.objectName}</h1>
              <div className="mt-5 max-w-sm rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/80">
                  Öğretmen yönergesi
                </p>
                <p className="mt-1 text-xl font-black text-cyan-50 sm:text-2xl">“{current.prompt}”</p>
              </div>
              <p className="mt-4 text-sm text-slate-400">
                3–5 sn içinde nesneyi size uzatarak gösterdi mi?
              </p>
              {feedback && (
                <div
                  className={`mt-4 rounded-xl px-4 py-2 text-sm font-bold ${
                    feedback === "ok" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {feedback === "ok" ? "Gösterdi kaydedildi" : "Göstermedi kaydedildi"}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-slate-800 bg-slate-900/95 p-3 pb-5">
              <div className="mx-auto flex max-w-md gap-3">
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => recordTrial(false)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-red-400 transition-all active:scale-95 disabled:opacity-40"
                >
                  <X className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase">Göstermedi</span>
                </button>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => recordTrial(true)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 p-3.5 text-green-400 transition-all active:scale-95 disabled:opacity-40"
                >
                  <Check className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase">Gösterdi</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {stage === "result" && (
          <div className="w-full max-w-md space-y-5 text-center animate-in zoom-in-95 duration-300">
            <Trophy className={`mx-auto h-14 w-14 ${success ? "text-yellow-400" : "text-slate-500"}`} />
            <div>
              <p className="text-sm text-slate-400">Doğru gösterme</p>
              <p className="text-4xl font-black text-white">
                {score}
                <span className="text-xl text-slate-500"> / {TRIAL_COUNT}</span>
              </p>
            </div>
            {success ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-5 py-3 font-bold text-green-400">
                <Check size={22} /> Set başarıyla geçildi (≥{PASS_COUNT}/{TRIAL_COUNT})
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 px-5 py-3 font-bold text-orange-400">
                <X size={22} /> Henüz yeterli bağımsızlık düzeyinde değil
              </div>
            )}
            <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-left text-xs">
              {results.map((r) => (
                <div
                  key={r.trialNumber}
                  className="flex items-center justify-between gap-2 border-b border-slate-800/80 px-2 py-1.5 last:border-0"
                >
                  <span className="truncate text-slate-300">
                    {r.trialNumber}. {r.objectName} — {r.prompt}
                  </span>
                  <span className={r.showed ? "font-bold text-green-400" : "font-bold text-red-400"}>
                    {r.showed ? "Gösterdi" : "Göstermedi"}
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onComplete(success)}
              className="w-full rounded-xl bg-cyan-600 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-cyan-900/40 transition-all hover:bg-cyan-500 active:scale-95"
            >
              KAYDET VE ÇIK
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
