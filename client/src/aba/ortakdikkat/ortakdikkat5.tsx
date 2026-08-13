import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  Gift,
  Loader2,
  MousePointer2,
  PackageCheck,
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

const TRIAL_COUNT = 10;
const PASS_COUNT = 8;
const STANDARD_ITEM_COUNT = 6;

type Stage = "blocked" | "preparation" | "assessment" | "result";
type ItemKind = "reinforcer" | "standard";

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
  kind: ItemKind;
  rank?: number;
}

interface StandardCandidate {
  id: string;
  name: string;
  aliases: string[];
}

interface TrialResult {
  trialNumber: number;
  optionIds: string[];
  optionNames: string[];
  selectedId: string | null;
  selectedName: string | null;
  selectedKind: ItemKind | null;
  correct: boolean;
}

interface SkillProfile {
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

const STANDARD_CANDIDATES: StandardCandidate[] = [
  { id: "boya-kalemi", name: "Boya kalemi", aliases: ["boya kalemi", "boya", "kuru boya", "pastel boya"] },
  { id: "oyuncak-araba", name: "Oyuncak araba", aliases: ["oyuncak araba", "araba"] },
  { id: "top", name: "Top", aliases: ["top"] },
  { id: "oyuncak-telefon", name: "Oyuncak telefon", aliases: ["oyuncak telefon", "telefon"] },
  { id: "oyuncak-bebek", name: "Oyuncak bebek", aliases: ["oyuncak bebek", "bebek"] },
  { id: "kopuk-baloncuk", name: "Köpük baloncuk", aliases: ["kopuk baloncuk", "baloncuk", "kopuk"] },
  { id: "lego", name: "LEGO", aliases: ["lego", "blok", "oyuncak blok"] },
  { id: "oyun-hamuru", name: "Oyun hamuru", aliases: ["oyun hamuru", "hamur"] },
  { id: "yapboz", name: "Yapboz", aliases: ["yapboz", "puzzle"] },
  { id: "cikartma", name: "Çıkartma", aliases: ["cikartma", "sticker"] },
  { id: "balon", name: "Balon", aliases: ["balon"] },
  { id: "pop-it", name: "Pop-it", aliases: ["pop it", "popit"] },
  { id: "isikli-oyuncak", name: "Işıklı oyuncak", aliases: ["isikli oyuncak", "isikli top"] },
  { id: "resimli-kitap", name: "Resimli kitap", aliases: ["resimli kitap", "kitap"] },
];

const normalizeName = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const aliasMap = new Map<string, string>();
STANDARD_CANDIDATES.forEach((item) => {
  item.aliases.forEach((alias) => aliasMap.set(normalizeName(alias), item.id));
  aliasMap.set(normalizeName(item.name), item.id);
});

const canonicalize = (value: string) => {
  const normalized = normalizeName(value);
  return aliasMap.get(normalized) || normalized;
};

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
};

const resolveReinforcers = (items: Reinforcer[]) => {
  const seenNames = new Set<string>();
  return [...items]
    .sort((a, b) => a.rank - b.rank)
    .flatMap((item) => {
      const canonicalName = canonicalize(item.name);
      if (!canonicalName || seenNames.has(canonicalName)) return [];
      seenNames.add(canonicalName);
      return [{
        id: `reinforcer:${item.id}`,
        name: item.name.trim(),
        canonicalName,
        kind: "reinforcer" as const,
        rank: item.rank,
      }];
    })
    .slice(0, 6);
};

const buildStandardItems = (reinforcers: ChoiceItem[]) => {
  const usedNames = new Set(reinforcers.map((item) => item.canonicalName));
  return STANDARD_CANDIDATES.flatMap((item) => {
    if (usedNames.has(item.id)) return [];
    usedNames.add(item.id);
    return [{
      id: `standard:${item.id}`,
      name: item.name,
      canonicalName: item.id,
      kind: "standard" as const,
    }];
  }).slice(0, STANDARD_ITEM_COUNT);
};

const optionKey = (items: ChoiceItem[]) =>
  items.map((item) => item.id).sort().join("|");

/** Kalan nesnelerden üçlü üretir ve mümkün oldukça bir pekiştireç içerir. */
const chooseOptions = (remaining: ChoiceItem[], previousOptions: ChoiceItem[] = []) => {
  const previousKey = optionKey(previousOptions);

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const reinforcers = shuffle(remaining.filter((item) => item.kind === "reinforcer"));
    const standards = shuffle(remaining.filter((item) => item.kind === "standard"));
    const selected: ChoiceItem[] = [];

    if (reinforcers.length > 0) selected.push(reinforcers[0]);

    const fillPool = shuffle([
      ...standards,
      ...reinforcers.filter((item) => item.id !== selected[0]?.id),
    ]);

    for (const item of fillPool) {
      if (selected.length >= 3) break;
      if (!selected.some((selectedItem) => selectedItem.id === item.id)) selected.push(item);
    }

    const options = shuffle(selected.slice(0, 3));
    if (options.length === 3 && (optionKey(options) !== previousKey || remaining.length === 3)) {
      return options;
    }
  }

  return shuffle(remaining).slice(0, 3);
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
  const [reinforcers, setReinforcers] = useState<ChoiceItem[]>([]);
  const [sessionCount, setSessionCount] = useState(0);
  const [remainingItems, setRemainingItems] = useState<ChoiceItem[]>([]);
  const [currentOptions, setCurrentOptions] = useState<ChoiceItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [locked, setLocked] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const standardItems = useMemo(() => buildStandardItems(reinforcers), [reinforcers]);
  const preparedPool = useMemo(
    () => [...reinforcers, ...standardItems],
    [reinforcers, standardItems],
  );

  useEffect(() => {
    const load = async () => {
      const institutionId = localStorage.getItem("kazanim-takip-institution-id");
      if (!institutionId || !studentId) {
        setLoading(false);
        return;
      }

      try {
        const [reinforcerSnapshot, skillSnapshot] = await Promise.all([
          getDoc(doc(db, "institutions", institutionId, "students", studentId, "profiles", "abaReinforcers")),
          getDoc(doc(db, "institutions", institutionId, "students", studentId, "profiles", "ortakDikkat15")),
        ]);

        const savedReinforcers = reinforcerSnapshot.exists()
          ? resolveReinforcers((reinforcerSnapshot.data() as ReinforcerProfile).rankings || [])
          : [];

        setReinforcers(savedReinforcers);
        if (skillSnapshot.exists()) {
          setSessionCount((skillSnapshot.data() as SkillProfile).sessionCount || 0);
        }
        setStage(savedReinforcers.length === 6 ? "preparation" : "blocked");
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

  const correctCount = results.filter((result) => result.correct).length;
  const setPassed = results.length === TRIAL_COUNT && correctCount >= PASS_COUNT;
  const lastResult = results[results.length - 1];

  const startAssessment = () => {
    const pool = shuffle(preparedPool);
    setRemainingItems(pool);
    setCurrentOptions(chooseOptions(pool));
    setSelectedId(null);
    setResults([]);
    setLocked(false);
    setStage("assessment");
  };

  const finishTrial = (correct: boolean) => {
    if (locked || currentOptions.length !== 3) return;
    if (correct && !selectedId) {
      toast.error("Öğrencinin işaret ettiği nesneyi seçin.");
      return;
    }

    const selectedItem = currentOptions.find((item) => item.id === selectedId) || null;
    const result: TrialResult = {
      trialNumber: results.length + 1,
      optionIds: currentOptions.map((item) => item.id),
      optionNames: currentOptions.map((item) => item.name),
      selectedId: correct ? selectedItem?.id || null : null,
      selectedName: correct ? selectedItem?.name || null : null,
      selectedKind: correct ? selectedItem?.kind || null : null,
      correct,
    };
    const nextResults = [...results, result];
    const nextRemaining = correct && selectedItem
      ? remainingItems.filter((item) => item.id !== selectedItem.id)
      : remainingItems;

    setResults(nextResults);
    setRemainingItems(nextRemaining);
    setLocked(true);

    const isLastTrial = nextResults.length >= TRIAL_COUNT;
    window.setTimeout(() => {
      if (isLastTrial) {
        const finalCorrectCount = nextResults.filter((item) => item.correct).length;
        if (finalCorrectCount >= PASS_COUNT) {
          confetti({ particleCount: 210, spread: 85, origin: { y: 0.62 } });
        }
        setStage("result");
        setLocked(false);
        return;
      }

      setCurrentOptions(chooseOptions(nextRemaining, currentOptions));
      setSelectedId(null);
      setLocked(false);
    }, 1100);
  };

  const saveResult = async () => {
    const institutionId = localStorage.getItem("kazanim-takip-institution-id");
    if (!institutionId || !studentId) return;

    setSaving(true);
    try {
      const completedAt = new Date().toISOString();
      await setDoc(
        doc(db, "institutions", institutionId, "students", studentId, "profiles", "ortakDikkat15"),
        {
          version: 2,
          sessionCount: sessionCount + 1,
          lastSession: {
            results,
            correctCount,
            totalCount: TRIAL_COUNT,
            distinctSelectedCount: results.filter((result) => result.correct).length,
            successRate: correctCount * 10,
            setPassed,
            reinforcers: reinforcers.map(({ id, name, rank }) => ({ id, name, rank })),
            standardItems: standardItems.map(({ id, name }) => ({ id, name })),
            completedAt,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      toast.success("1.5 değerlendirmesi kaydedildi.");
      onComplete(setPassed);
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
    return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 text-white"><Loader2 className="animate-spin text-cyan-400" size={38} /></div>;
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
            <p className="mt-3 text-sm leading-relaxed text-slate-300">Öğrencinin birbirinden farklı 6 pekiştireci kaydedilmeden bu değerlendirme başlatılamaz.</p>
            <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950/60 p-4 text-left"><div className="flex gap-3"><Gift className="mt-0.5 shrink-0 text-amber-400" size={21} /><p className="text-sm leading-relaxed text-slate-300">Önce Pekiştireç Belirleme sayfasında öğrencinin güncel ilk 6 pekiştirecini kaydedin.</p></div></div>
            <button type="button" onClick={onOpenReinforcers} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 p-4 font-black text-slate-950 active:scale-[0.98]">Beni Yönlendir <ChevronRight size={21} /></button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col bg-slate-950 text-white">
      <header className="z-20 flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/95 px-4 py-3 backdrop-blur">
        <button type="button" onClick={requestClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Kapat"><XCircle size={27} /></button>
        <div className="min-w-0 px-2 text-center"><h1 className="truncate text-sm font-black sm:text-base">{itemCode} — {itemText}</h1><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{stage === "assessment" ? `Değerlendirme ${Math.min(results.length + 1, TRIAL_COUNT)}/${TRIAL_COUNT}` : stage === "result" ? "Sonuç" : "Hazırlık"}</p></div>
        <div className="w-11" />
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto w-full max-w-3xl">
          {stage === "preparation" && (
            <section className="space-y-5">
              <div className="rounded-3xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/15 to-slate-900 p-5">
                <div className="flex gap-4"><div className="rounded-2xl bg-cyan-400/15 p-3 text-cyan-300"><PackageCheck size={30} /></div><div><h2 className="text-xl font-black">12 nesneyi hazır bulundurun</h2><p className="mt-1 text-sm leading-relaxed text-slate-300">Uygulama her denemede bu havuzdan üç nesneyi öğretmene söyleyecek.</p></div></div>
              </div>
              <ItemList title="Öğrencinin 6 pekiştireci" items={reinforcers} color="emerald" />
              <ItemList title="Çakışmayan 6 standart nesne" items={standardItems} color="blue" />
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><h3 className="font-black">Değerlendirme kuralı</h3><p className="mt-2 text-sm leading-relaxed text-slate-300">Çocuğun işaret ettiği nesne sonraki denemelerde tekrar sunulmaz. Göstermediğinde hiçbir nesne havuzdan çıkarılmaz.</p></div>
              <button type="button" onClick={startAssessment} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 p-4 font-black text-slate-950 active:scale-[0.99]"><MousePointer2 size={22} /> Nesneler Hazır, Başlat</button>
            </section>
          )}

          {stage === "assessment" && currentOptions.length === 3 && (
            <section className="flex min-h-[76vh] flex-col justify-center">
              <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-cyan-400 transition-all" style={{ width: `${(results.length / TRIAL_COUNT) * 100}%` }} /></div>
              <div className="rounded-[2rem] border border-slate-700 bg-slate-900 p-5 text-center shadow-2xl sm:p-8">
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-cyan-300">Öğrenciye söyleyin</span>
                <h2 className="my-5 text-3xl font-black sm:text-5xl">“Ne istiyorsun? Göster bakalım.”</h2>
                <div className="mb-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-left"><p className="text-xs font-black uppercase tracking-wider text-amber-300">Öğrencinin önüne koyun</p><p className="mt-2 text-lg font-black text-amber-50">{currentOptions.map((item) => item.name).join(" · ")}</p></div>
                <p className="mb-4 text-sm leading-relaxed text-slate-400">Yönergeyi bir kez söyleyin ve 3–5 saniye bağımsız tepkiyi bekleyin. Gösterdiği nesneye dokunun.</p>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {currentOptions.map((item) => (
                    <button key={item.id} type="button" disabled={locked} onClick={() => setSelectedId(item.id)} className={twMerge("flex min-h-28 flex-col items-center justify-center rounded-2xl border p-3 transition active:scale-95 sm:min-h-36", selectedId === item.id ? "border-cyan-400 bg-cyan-500/20 text-cyan-50 ring-2 ring-cyan-400/20" : "border-slate-700 bg-slate-950 text-slate-200")}>
                      {item.kind === "reinforcer" ? <Gift className="mb-3 text-amber-400" size={28} /> : <PackageOpen className="mb-3 text-blue-400" size={28} />}
                      <span className="break-words text-xs font-black sm:text-base">{item.name}</span>
                    </button>
                  ))}
                </div>
                {!locked && <div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={() => finishTrial(false)} className="flex min-h-20 items-center justify-center gap-2 rounded-2xl border border-red-500/45 bg-red-500/15 p-3 font-black text-red-300 active:scale-[0.98]"><X size={26} /> Göstermedi</button><button type="button" disabled={!selectedId} onClick={() => finishTrial(true)} className="flex min-h-20 items-center justify-center gap-2 rounded-2xl border border-emerald-500/45 bg-emerald-500/15 p-3 font-black text-emerald-300 active:scale-[0.98] disabled:opacity-30"><Check size={26} /> İşaret etti</button></div>}
                {locked && <div className={twMerge("mt-5 rounded-2xl border p-4", lastResult?.correct ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10")}><p className={twMerge("font-black", lastResult?.correct ? "text-emerald-300" : "text-red-300")}>{lastResult?.correct ? `${lastResult.selectedName} kaydedildi ve sonraki denemelerden çıkarıldı.` : "Göstermedi olarak kaydedildi; nesneler havuzda kaldı."}</p></div>}
                <p className="mt-4 text-xs leading-relaxed text-slate-500">Tüm elle gösterme, uzanıp alma veya yardımlı tepki “Göstermedi” olarak kaydedilir.</p>
              </div>
            </section>
          )}

          {stage === "result" && (
            <section className="space-y-5 text-center">
              <div className={twMerge("rounded-3xl border p-6", setPassed ? "border-emerald-500/30 bg-emerald-500/10" : "border-orange-500/30 bg-orange-500/10")}>
                {setPassed ? <Trophy className="mx-auto mb-4 text-amber-400" size={64} /> : <XCircle className="mx-auto mb-4 text-orange-400" size={58} />}
                <h2 className="text-2xl font-black">{setPassed ? "Kazanım Başarılı" : "Kazanım Henüz Başarılı Değil"}</h2>
                <p className="mt-3 text-4xl font-black">{correctCount} / {TRIAL_COUNT}</p><p className="mt-1 text-sm text-slate-300">Başarı ölçütü: en az {PASS_COUNT}/{TRIAL_COUNT}</p>
              </div>
              <div className="space-y-2 text-left">
                {results.map((result) => <div key={result.trialNumber} className={twMerge("rounded-xl border p-3", result.correct ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5")}><div className="flex items-center gap-3"><span className={twMerge("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", result.correct ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300")}>{result.correct ? <Check size={17} /> : <X size={17} />}</span><span className="flex-1 font-bold">{result.trialNumber}. {result.selectedName || "Göstermedi"}</span></div><p className="mt-2 pl-11 text-xs text-slate-500">Sunulanlar: {result.optionNames.join(" · ")}</p></div>)}
              </div>
              <button type="button" disabled={saving} onClick={saveResult} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 p-4 font-black text-slate-950 disabled:opacity-50">{saving ? <Loader2 className="animate-spin" /> : <Save />} Kaydet ve Çık</button>
            </section>
          )}
        </div>
      </main>

      {showExitDialog && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"><div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5"><h3 className="font-black">Değerlendirme kaydedilmedi</h3><p className="mt-2 text-sm leading-relaxed text-slate-300">Şimdi çıkarsanız bu oturumdaki işaretlemeler kaybolur.</p><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={() => setShowExitDialog(false)} className="rounded-xl border border-slate-700 p-3 font-bold text-slate-300">Devam Et</button><button type="button" onClick={onClose} className="rounded-xl bg-red-600 p-3 font-bold">Çık</button></div></div></div>}
    </div>
  );
}

function ItemList({ title, items, color }: { title: string; items: ChoiceItem[]; color: "emerald" | "blue" }) {
  return (
    <div className={twMerge("rounded-2xl border p-4", color === "emerald" ? "border-emerald-500/25 bg-emerald-500/10" : "border-blue-500/25 bg-blue-500/10")}>
      <div className="flex items-center gap-2">{color === "emerald" ? <CheckCircle2 className="text-emerald-400" /> : <PackageOpen className="text-blue-400" />}<h3 className="font-black">{title}</h3></div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{items.map((item, index) => <div key={item.id} className="rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm font-bold"><span className="mr-2 text-slate-500">{index + 1}.</span>{item.name}</div>)}</div>
    </div>
  );
}
