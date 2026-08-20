import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  Gift,
  Loader2,
  MousePointer2,
  PackageOpen,
  RefreshCw,
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
import { associateCurrentTeacherWithStudent } from "@/lib/studentTeacherAssociation";

const imageModules = import.meta.glob(
  [
    "./ortakdikkatsesgorsel/*.{png,jpg,jpeg,webp}",
    "../yonerge/sesgorsel/*.{png,jpg,jpeg,webp}",
    "../esle/gitar.png",
    "../../fruits/*.webp",
    "../../icecekler/*.webp",
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
const STANDARD_OBJECT_COUNT = 6;

type Stage = "blocked" | "home" | "assessment" | "result";

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
  image?: string | null;
  isReinforcer: boolean;
}

interface StandardObject {
  id: string;
  name: string;
}

interface TrialResult {
  trialNumber: number;
  optionIds: string[];
  optionNames: string[];
  selectedId: string | null;
  selectedName: string | null;
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

const STANDARD_OBJECTS: StandardObject[] = [
  { id: "standard:boya-kalemi", name: "Boya kalemi" },
  { id: "standard:oyuncak-araba", name: "Oyuncak araba" },
  { id: "standard:top", name: "Top" },
  { id: "standard:oyuncak-telefon", name: "Oyuncak telefon" },
  { id: "standard:oyuncak-bebek", name: "Oyuncak bebek" },
  { id: "standard:kopuk-baloncuk", name: "Köpük baloncuk" },
  { id: "standard:lego", name: "LEGO" },
  { id: "standard:oyun-hamuru", name: "Oyun hamuru" },
  { id: "standard:yapboz", name: "Yapboz" },
  { id: "standard:cikartma", name: "Çıkartma" },
  { id: "standard:balon", name: "Balon" },
  { id: "standard:pop-it", name: "Pop-it" },
  { id: "standard:isikli-oyuncak", name: "Işıklı oyuncak" },
  { id: "standard:resimli-kitap", name: "Resimli kitap" },
  { id: "standard:pelus-oyuncak", name: "Peluş oyuncak" },
  { id: "standard:oyuncak-tren", name: "Oyuncak tren" },
];

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
};

const normalizeText = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getObjectKey = (value: string) => {
  const text = normalizeText(value);
  if (/kopuk|baloncuk|sabun kopugu/.test(text)) return "kopuk-baloncuk";
  if (/oyun hamuru|oyunhamuru/.test(text)) return "oyun-hamuru";
  if (/lego|blok|yapi blogu/.test(text)) return "lego";
  if (/boya kalemi|pastel boya|keceli kalem|sulu boya|boya/.test(text)) return "boya-kalemi";
  if (/oyuncak araba|araba/.test(text)) return "oyuncak-araba";
  if (/oyuncak telefon|telefon/.test(text)) return "oyuncak-telefon";
  if (/oyuncak bebek|bebek/.test(text)) return "oyuncak-bebek";
  if (/yapboz|puzzle/.test(text)) return "yapboz";
  if (/cikartma|sticker/.test(text)) return "cikartma";
  if (/pop it|popit/.test(text)) return "pop-it";
  if (/isikli oyuncak/.test(text)) return "isikli-oyuncak";
  if (/resimli kitap|kitap/.test(text)) return "resimli-kitap";
  if (/pelus|ayicik/.test(text)) return "pelus-oyuncak";
  if (/oyuncak tren|tren/.test(text)) return "oyuncak-tren";
  if (/balon/.test(text)) return "balon";
  if (/top/.test(text)) return "top";
  return text;
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

const getInitialStandardObjects = (reinforcers: Reinforcer[]) => {
  const reinforcerKeys = new Set(reinforcers.map((item) => getObjectKey(item.name)));
  return STANDARD_OBJECTS
    .filter((item) => !reinforcerKeys.has(getObjectKey(item.name)))
    .slice(0, STANDARD_OBJECT_COUNT);
};

const toChoiceItems = (
  reinforcers: Reinforcer[],
  standardObjects: StandardObject[],
): ChoiceItem[] => [
  ...reinforcers.map((item) => ({
    id: item.id,
    name: item.name,
    image: item.image,
    isReinforcer: true,
  })),
  ...standardObjects.map((item) => ({
    ...item,
    image: null,
    isReinforcer: false,
  })),
];

const makeOptions = (
  availableItems: ChoiceItem[],
  usedSignatures: Set<string>,
) => {
  if (availableItems.length <= 3) return shuffle(availableItems);

  let fallback = shuffle(availableItems).slice(0, 3);
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const remainingReinforcers = availableItems.filter((item) => item.isReinforcer);
    const first = remainingReinforcers.length > 0
      ? shuffle(remainingReinforcers)[0]
      : shuffle(availableItems)[0];
    const others = shuffle(availableItems.filter((item) => item.id !== first.id)).slice(0, 2);
    const candidate = shuffle([first, ...others]);
    fallback = candidate;
    const signature = candidate.map((item) => item.id).sort().join("|");
    if (!usedSignatures.has(signature)) return candidate;
  }
  return fallback;
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
  const [reinforcers, setReinforcers] = useState<Reinforcer[]>([]);
  const [standardObjects, setStandardObjects] = useState<StandardObject[]>([]);
  const [sessionCount, setSessionCount] = useState(0);
  const [availableItems, setAvailableItems] = useState<ChoiceItem[]>([]);
  const [currentOptions, setCurrentOptions] = useState<ChoiceItem[]>([]);
  const [usedSignatures, setUsedSignatures] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<TrialResult[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

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
        setStandardObjects(getInitialStandardObjects(savedReinforcers));

        if (skillSnapshot.exists()) {
          setSessionCount((skillSnapshot.data() as SkillProfile).sessionCount || 0);
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

  const correctCount = results.filter((result) => result.correct).length;
  const setPassed = results.length === TRIAL_COUNT && correctCount >= PASS_COUNT;

  const changeStandardObject = (objectId: string) => {
    const reinforcerKeys = new Set(reinforcers.map((item) => getObjectKey(item.name)));
    const selectedKeys = new Set(
      standardObjects
        .filter((item) => item.id !== objectId)
        .map((item) => getObjectKey(item.name)),
    );
    const alternatives = STANDARD_OBJECTS.filter((item) => (
      item.id !== objectId
      && !reinforcerKeys.has(getObjectKey(item.name))
      && !selectedKeys.has(getObjectKey(item.name))
    ));

    if (alternatives.length === 0) {
      toast.info("Değiştirilebilecek başka nesne kalmadı.");
      return;
    }

    const replacement = alternatives[Math.floor(Math.random() * alternatives.length)];
    setStandardObjects((current) => current.map((item) => (
      item.id === objectId ? replacement : item
    )));
  };

  const startAssessment = () => {
    const pool = toChoiceItems(reinforcers, standardObjects);
    if (pool.length !== 12) {
      toast.error("Değerlendirme için 6 pekiştireç ve 6 nesne hazır olmalı.");
      return;
    }

    const firstOptions = makeOptions(pool, new Set());
    const firstSignature = firstOptions.map((item) => item.id).sort().join("|");
    setAvailableItems(pool);
    setCurrentOptions(firstOptions);
    setUsedSignatures(new Set([firstSignature]));
    setResults([]);
    setSelectedId(null);
    setLocked(false);
    setStage("assessment");
  };

  const finishTrial = (selectedItem: ChoiceItem | null) => {
    if (locked || currentOptions.length !== 3 || results.length >= TRIAL_COUNT) return;
    setLocked(true);
    setSelectedId(selectedItem?.id || "not-shown");

    const nextResult: TrialResult = {
      trialNumber: results.length + 1,
      optionIds: currentOptions.map((item) => item.id),
      optionNames: currentOptions.map((item) => item.name),
      selectedId: selectedItem?.id || null,
      selectedName: selectedItem?.name || null,
      correct: selectedItem !== null,
    };
    const nextResults = [...results, nextResult];
    setResults(nextResults);

    const nextPool = selectedItem
      ? availableItems.filter((item) => item.id !== selectedItem.id)
      : availableItems;
    setAvailableItems(nextPool);

    window.setTimeout(() => {
      if (nextResults.length >= TRIAL_COUNT) {
        setStage("result");
        if (nextResults.filter((result) => result.correct).length >= PASS_COUNT) {
          confetti({ particleCount: 200, spread: 85, origin: { y: 0.62 } });
        }
        return;
      }

      const nextOptions = makeOptions(nextPool, usedSignatures);
      const signature = nextOptions.map((item) => item.id).sort().join("|");
      setUsedSignatures((current) => new Set([...current, signature]));
      setCurrentOptions(nextOptions);
      setSelectedId(null);
      setLocked(false);
    }, selectedItem ? 1100 : 800);
  };

  const saveResult = async () => {
    const institutionId = localStorage.getItem("kazanim-takip-institution-id");
    if (!institutionId || !studentId) return;

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
          "ortakDikkat15",
        ),
        {
          sessionCount: sessionCount + 1,
          lastSession: {
            results,
            correctCount,
            totalCount: TRIAL_COUNT,
            successRate: correctCount * 10,
            setPassed,
            standardObjects: standardObjects.map((item) => item.name),
            completedAt: new Date().toISOString(),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      await associateCurrentTeacherWithStudent(studentId);

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
            <p className="mt-3 text-sm leading-relaxed text-slate-300">Öğrencinin en güçlü 6 pekiştireci belirlenmeden bu değerlendirme başlatılamaz.</p>
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
          {stage === "home" && (
            <section className="space-y-5">
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-2"><CheckCircle2 className="text-emerald-400" /><h2 className="font-black">Pekiştireçler</h2></div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{reinforcers.map((item) => <div key={item.id} className="rounded-xl border border-emerald-500/20 bg-slate-950/45 px-3 py-2.5 text-sm font-bold text-emerald-100"><span className="mr-2 text-emerald-400">{item.rank}.</span>{item.name}</div>)}</div>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                <div className="flex items-start justify-between gap-3"><div><h2 className="font-black">Nesneler</h2><p className="mt-1 text-xs leading-relaxed text-slate-400">Sınıfta bulunmayan bir nesneye dokunarak rastgele değiştirin.</p></div><RefreshCw className="mt-0.5 shrink-0 text-cyan-400" size={21} /></div>
                <div className="mt-4 grid grid-cols-2 gap-3">{standardObjects.map((item) => <button key={item.id} type="button" onClick={() => changeStandardObject(item.id)} className="flex min-h-16 items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-950 p-3 text-left transition hover:border-cyan-500/50 hover:bg-slate-800 active:scale-[0.98]"><span className="text-sm font-bold text-slate-100">{item.name}</span><RefreshCw className="shrink-0 text-cyan-400" size={18} /></button>)}</div>
              </div>

              <button type="button" onClick={startAssessment} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 p-4 font-black text-slate-950 active:scale-[0.99]"><MousePointer2 size={22} /> Nesneler Hazır, Başlat</button>
            </section>
          )}

          {stage === "assessment" && currentOptions.length === 3 && (
            <section className="flex min-h-[76vh] flex-col justify-center">
              <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-cyan-400 transition-all" style={{ width: `${(results.length / TRIAL_COUNT) * 100}%` }} /></div>
              <div className="rounded-[2rem] border border-slate-700 bg-slate-900 p-5 text-center shadow-2xl sm:p-8">
                <p className="text-sm font-bold text-slate-400">Bu üç nesneyi öğrencinin önüne koyun.</p>
                <h2 className="my-5 text-3xl font-black sm:text-5xl">“Ne istiyorsun? Göster bakalım.”</h2>
                <p className="mb-5 text-xs text-slate-500">Öğretmen, öğrencinin işaret parmağıyla gösterdiği nesneye dokunur.</p>

                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {currentOptions.map((item) => {
                    const isSelected = selectedId === item.id;
                    const shouldDim = locked && selectedId !== null && !isSelected;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={locked}
                        onClick={() => finishTrial(item)}
                        className={twMerge(
                          "rounded-2xl border p-2 transition-all active:scale-95 sm:p-3",
                          !locked && "border-slate-700 bg-slate-950 hover:border-cyan-400",
                          isSelected && "border-emerald-400 bg-emerald-500/20 ring-2 ring-emerald-400/30",
                          shouldDim && "border-slate-800 bg-slate-950 opacity-25",
                        )}
                      >
                        <div className={twMerge("flex h-24 items-center justify-center overflow-hidden rounded-xl sm:h-36", item.image ? "bg-white" : item.isReinforcer ? "bg-amber-500/10" : "bg-cyan-500/10")}>
                          {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-contain p-2" /> : item.isReinforcer ? <Gift className="text-amber-400" size={38} /> : <PackageOpen className="text-cyan-400" size={38} />}
                        </div>
                        <p className="mt-2 break-words text-xs font-black sm:text-sm">{item.name}</p>
                        {isSelected && <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-300"><Check size={14} /> İşaret etti</span>}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-7 flex justify-center">
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => finishTrial(null)}
                    className={twMerge(
                      "flex min-h-14 min-w-52 items-center justify-center gap-2 rounded-2xl border px-7 py-3 font-black transition active:scale-95",
                      selectedId === "not-shown"
                        ? "border-red-400 bg-red-500/30 text-red-100"
                        : "border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20",
                    )}
                  >
                    <X size={22} /> Göstermedi
                  </button>
                </div>
              </div>
            </section>
          )}

          {stage === "result" && (
            <section className="space-y-5 text-center">
              <div className={twMerge("rounded-3xl border p-6", setPassed ? "border-emerald-500/30 bg-emerald-500/10" : "border-orange-500/30 bg-orange-500/10")}>
                {setPassed ? <Trophy className="mx-auto mb-4 text-amber-400" size={64} /> : <XCircle className="mx-auto mb-4 text-orange-400" size={58} />}
                <h2 className="text-2xl font-black">{setPassed ? "Kazanım Başarılı" : "Kazanım Henüz Başarılmadı"}</h2>
                <p className="mt-3 text-4xl font-black">{correctCount} / {TRIAL_COUNT}</p>
                <p className="mt-1 text-sm text-slate-300">Başarı ölçütü: en az {PASS_COUNT}/{TRIAL_COUNT}</p>
              </div>

              <div className="space-y-2 text-left">
                {results.map((result) => <div key={result.trialNumber} className={twMerge("flex items-center gap-3 rounded-xl border p-3", result.correct ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5")}><span className={twMerge("flex h-8 w-8 items-center justify-center rounded-full", result.correct ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300")}>{result.correct ? <Check size={17} /> : <X size={17} />}</span><div className="min-w-0 flex-1"><p className="font-bold">{result.trialNumber}. {result.selectedName || "Göstermedi"}</p><p className="mt-0.5 truncate text-[11px] text-slate-500">Sunulanlar: {result.optionNames.join(" · ")}</p></div></div>)}
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
