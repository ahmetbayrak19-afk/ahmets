import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc, collection, doc, endAt, getDoc, getDocs, limit, orderBy,
  query, serverTimestamp, setDoc, startAt,
} from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import {
  ArrowDown, ArrowLeft, ArrowUp, Camera, Check, CheckCircle2, ChevronRight,
  Gift, ImagePlus, Loader2, MonitorSmartphone, PencilLine, Plus, RefreshCw,
  Save, Search, Trash2, X,
} from "lucide-react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { db, storage } from "@/firebase";
import { associateCurrentTeacherWithStudent } from "@/lib/studentTeacherAssociation";

const imageModules = import.meta.glob(
  [
    "./ortakdikkatsesgorsel/*.{png,jpg,jpeg,webp}",
    "../yonerge/sesgorsel/*.{png,jpg,jpeg,webp}",
    "../esle/gitar.png",
    "../../fruits/*.webp",
    "../../icecekler/*.{png,jpg,jpeg,webp}",
    "../../temelgidalar/*.{png,jpg,jpeg,webp}",
    "../../okulmalzemeleri/suluboya.png",
  ],
  { eager: true, import: "default", query: "?url" },
) as Record<string, string>;

type Method = "digital" | "teacher";
type Step = "summary" | "select" | "method" | "digital" | "teacher" | "result";
type Source = "built-in" | "community";

interface Reinforcer {
  id: string;
  name: string;
  image: string;
  source: Source;
  catalogId?: string;
}

interface RankedReinforcer extends Reinforcer {
  rank: number;
  selectedCount?: number;
  shownCount?: number;
  score?: number;
}

interface SavedProfile {
  rankings?: RankedReinforcer[];
  method?: Method;
  updatedAt?: { toDate?: () => Date } | Date | string | null;
}

interface Props {
  studentId: string;
  studentName?: string;
  onBack?: () => void;
}

const normalize = (value: string) => value
  .trim().toLocaleLowerCase("tr-TR").normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").replace(/\s+/g, " ");

const EXCLUDED_NAMES = new Set(["balik", "yag"]);

const DISPLAY_NAMES: Record<string, string> = {
  biskuvi: "Bisküvi", cikolata: "Çikolata", cips: "Cips", dondurma: "Dondurma",
  kaydirak: "Kaydırak", oyunhamuru: "Oyun hamuru", salincak: "Salıncak", seker: "Şeker",
  tablet: "Tablet", trombolin: "Trambolin", yapboz: "Yapboz", top: "Top",
  araba: "Oyuncak araba", bebek: "Oyuncak bebek", kirmizibalon: "Balon", kitap: "Kitap",
  gitar: "Gitar", suluboya: "Sulu boya", ananas: "Ananas", armut: "Armut", cilek: "Çilek",
  elma: "Elma", erik: "Erik", karpuz: "Karpuz", kavun: "Kavun", kiraz: "Kiraz",
  kivi: "Kivi", limon: "Limon", muz: "Muz", nar: "Nar", portakal: "Portakal",
  seftali: "Şeftali", uzum: "Üzüm", ayran: "Ayran", cay: "Çay", kahva: "Kahve",
  kola: "Kola", limonata: "Limonata", meyvesuyu: "Meyve suyu", soda: "Soda", su: "Su",
  sut: "Süt", tursusuyu: "Turşu suyu", bal: "Bal", corba: "Çorba",
  ekmek: "Ekmek", et: "Et", kuruyemis: "Kuru yemiş", makarna: "Makarna",
  peynir: "Peynir", pilav: "Pilav", recel: "Reçel", tavuk: "Tavuk",
  yogurt: "Yoğurt", yumurta: "Yumurta", zeytin: "Zeytin",
};

const OD_FILES = new Set([
  "biskuvi", "cikolata", "cips", "dondurma", "kaydirak", "oyunhamuru",
  "salincak", "seker", "tablet", "trombolin", "yapboz",
]);
const YONERGE_FILES = new Set(["top", "araba", "bebek", "kirmizibalon", "kitap"]);

const READY_ITEMS: Reinforcer[] = Object.entries(imageModules)
  .filter(([path]) => {
    const file = path.split("/").pop()?.replace(/\.(png|jpe?g|webp)$/i, "") || "";
    if (EXCLUDED_NAMES.has(normalize(file))) return false;
    if (path.includes("/ortakdikkatsesgorsel/")) return OD_FILES.has(file);
    if (path.includes("/yonerge/sesgorsel/")) return YONERGE_FILES.has(file);
    return true;
  })
  .map(([path, image]) => {
    const file = path.split("/").pop()?.replace(/\.(png|jpe?g|webp)$/i, "") || path;
    return {
      id: `ready:${path}`,
      name: DISPLAY_NAMES[file] || file,
      image,
      source: "built-in" as const,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name, "tr"));

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/** Tam 20 farklı üçlü üretir; 10 adayın her biri tam 6 kez görünür. */
const buildTwentyTrials = (tenItems: Reinforcer[]) => {
  const items = shuffle(tenItems);
  const trials: Reinforcer[][] = [];
  for (let i = 0; i < 10; i += 1) {
    trials.push(shuffle([items[i], items[(i + 1) % 10], items[(i + 3) % 10]]));
    trials.push(shuffle([items[i], items[(i + 4) % 10], items[(i + 7) % 10]]));
  }
  return shuffle(trials);
};

/** Yüklenen fotoğrafı depolama öncesinde optimize eder. */
const resizeImage = async (file: File): Promise<Blob> => {
  const bitmap = await createImageBitmap(file);
  const size = 384;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Görsel işlenemedi.");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, size, size);
  const scale = Math.min(size / bitmap.width, size / bitmap.height);
  const width = bitmap.width * scale;
  const height = bitmap.height * scale;
  context.drawImage(bitmap, (size - width) / 2, (size - height) / 2, width, height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error("Görsel küçültülemedi.")),
    "image/webp", 0.76,
  ));
};

const formatDate = (value: SavedProfile["updatedAt"]) => {
  if (!value) return "";
  try {
    const date = typeof value === "object" && "toDate" in value && typeof value.toDate === "function"
      ? value.toDate() : new Date(value as string | Date);
    return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(date);
  } catch { return ""; }
};

function Picture({ item, large = false }: { item: Reinforcer; large?: boolean }) {
  return <div className={twMerge("overflow-hidden rounded-xl bg-white", large ? "h-36 sm:h-52" : "h-28 sm:h-36")}>
    <img src={item.image} alt={item.name} className="h-full w-full object-contain p-2" />
  </div>;
}

export default function Pekistirec({ studentId, studentName, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<Step>("select");
  const [savedProfile, setSavedProfile] = useState<SavedProfile | null>(null);
  const [selected, setSelected] = useState<Reinforcer[]>([]);
  const [searchText, setSearchText] = useState("");
  const [communityResults, setCommunityResults] = useState<Reinforcer[]>([]);
  const [duplicateResults, setDuplicateResults] = useState<Reinforcer[]>([]);
  const [searching, setSearching] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [adding, setAdding] = useState(false);
  const [method, setMethod] = useState<Method>("digital");
  const [trials, setTrials] = useState<Reinforcer[][]>([]);
  const [trialIndex, setTrialIndex] = useState(0);
  const [choiceCounts, setChoiceCounts] = useState<Record<string, number>>({});
  const [roundChoice, setRoundChoice] = useState<string | null>(null);
  const [ranking, setRanking] = useState<RankedReinforcer[]>([]);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const institutionId = localStorage.getItem("kazanim-takip-institution-id");
      if (!institutionId || !studentId) return setLoading(false);
      try {
        const snapshot = await getDoc(doc(
          db, "institutions", institutionId, "students", studentId, "profiles", "abaReinforcers",
        ));
        if (snapshot.exists()) {
          setSavedProfile(snapshot.data() as SavedProfile);
          setStep("summary");
        }
      } catch (error) {
        console.error(error);
        toast.error("Pekiştireç bilgileri yüklenemedi.");
      } finally { setLoading(false); }
    };
    load();
  }, [studentId]);

  useEffect(() => {
    const term = normalize(searchText);
    if (term.length < 2) { setCommunityResults([]); return; }
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const snapshot = await getDocs(query(
          collection(db, "reinforcerCatalog"), orderBy("normalizedName"),
          startAt(term), endAt(`${term}\uf8ff`), limit(12),
        ));
        setCommunityResults(snapshot.docs.map((catalogDoc) => {
          const data = catalogDoc.data();
          return {
            id: `community:${catalogDoc.id}`, catalogId: catalogDoc.id,
            name: String(data.name || "Pekiştireç"), image: String(data.imageUrl || ""),
            source: "community" as const,
          };
        }).filter((item) => Boolean(item.image) && !EXCLUDED_NAMES.has(normalize(item.name))));
      } catch (error) {
        console.error(error);
        setCommunityResults([]);
      } finally { setSearching(false); }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    const term = normalize(newName);
    if (!showAddForm || term.length < 2) { setDuplicateResults([]); return; }
    const timer = window.setTimeout(async () => {
      setCheckingDuplicates(true);
      try {
        const snapshot = await getDocs(query(
          collection(db, "reinforcerCatalog"), orderBy("normalizedName"),
          startAt(term), endAt(`${term}\uf8ff`), limit(8),
        ));
        const sharedItems = snapshot.docs.map((catalogDoc) => {
          const data = catalogDoc.data();
          return {
            id: `community:${catalogDoc.id}`, catalogId: catalogDoc.id,
            name: String(data.name || "Pekiştireç"), image: String(data.imageUrl || ""),
            source: "community" as const,
          };
        }).filter((item) => Boolean(item.image) && !EXCLUDED_NAMES.has(normalize(item.name)));
        const builtInItems = READY_ITEMS.filter((item) => normalize(item.name).includes(term));
        const seen = new Set<string>();
        setDuplicateResults([...builtInItems, ...sharedItems].filter((item) => {
          const key = `${normalize(item.name)}:${item.image}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).slice(0, 8));
      } catch (error) {
        console.error(error);
        setDuplicateResults(READY_ITEMS.filter((item) => normalize(item.name).includes(term)).slice(0, 8));
      } finally { setCheckingDuplicates(false); }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [newName, showAddForm]);

  const visibleItems = useMemo(() => {
    const term = normalize(searchText);
    return [
      ...READY_ITEMS.filter((item) => !term || normalize(item.name).includes(term)),
      ...communityResults,
    ];
  }, [communityResults, searchText]);

  const selectedIds = useMemo(() => new Set(selected.map((item) => item.id)), [selected]);
  const savedRanking = useMemo(() => [...(savedProfile?.rankings || [])].map((item) => ({
    ...item,
    image: item.source === "built-in"
      ? READY_ITEMS.find((ready) => ready.id === item.id)?.image || item.image
      : item.image,
  })).sort((a, b) => a.rank - b.rank).slice(0, 6), [savedProfile]);

  const toggleItem = (item: Reinforcer) => {
    if (selectedIds.has(item.id)) {
      setSelected((current) => current.filter((candidate) => candidate.id !== item.id));
    } else if (selected.length >= 10) {
      toast.error("En fazla 10 aday seçebilirsiniz.");
    } else {
      setSelected((current) => [...current, item]);
    }
  };

  const addNewItem = async () => {
    const institutionId = localStorage.getItem("kazanim-takip-institution-id");
    const teacherName = localStorage.getItem("kazanim-takip-teacher-name") || "";
    if (!newName.trim() || !newImage || !institutionId) {
      toast.error("Nesnenin adını yazın ve bir fotoğraf seçin."); return;
    }
    if (selected.length >= 10) { toast.error("Önce seçili adaylardan birini çıkarın."); return; }
    setAdding(true);
    try {
      const smallImage = await resizeImage(newImage);
      const imageReference = storageRef(storage, `reinforcer_catalog/${crypto.randomUUID()}.webp`);
      await uploadBytes(imageReference, smallImage, { contentType: "image/webp" });
      const imageUrl = await getDownloadURL(imageReference);
      const catalogDocument = await addDoc(collection(db, "reinforcerCatalog"), {
        name: newName.trim(), normalizedName: normalize(newName), imageUrl,
        createdByInstitutionId: institutionId, createdByTeacher: teacherName,
        createdAt: serverTimestamp(), status: "active",
      });
      const item: Reinforcer = {
        id: `community:${catalogDocument.id}`, catalogId: catalogDocument.id,
        name: newName.trim(), image: imageUrl, source: "community",
      };
      setSelected((current) => [...current, item]);
      setCommunityResults((current) => [item, ...current]);
      setSearchText(""); setNewName(""); setNewImage(null); setShowAddForm(false);
      toast.success("Pekiştireç eklendi.");
    } catch (error) {
      console.error(error); toast.error("Nesne eklenemedi.");
    } finally { setAdding(false); }
  };

  const startDigital = () => {
    setMethod("digital"); setTrials(buildTwentyTrials(selected)); setTrialIndex(0);
    setChoiceCounts(Object.fromEntries(selected.map((item) => [item.id, 0])));
    setRoundChoice(null); setStep("digital");
  };

  const finishDigital = (counts: Record<string, number>) => {
    setRanking(selected.map((item) => ({
      ...item, rank: 0, selectedCount: counts[item.id] || 0,
      shownCount: 6, score: (counts[item.id] || 0) / 6,
    })).sort((a, b) => (b.selectedCount || 0) - (a.selectedCount || 0)
      || a.name.localeCompare(b.name, "tr"))
      .slice(0, 6).map((item, index) => ({ ...item, rank: index + 1 })));
    setStep("result");
  };

  const chooseDigital = (itemId: string) => {
    if (roundChoice) return;
    const next = { ...choiceCounts, [itemId]: (choiceCounts[itemId] || 0) + 1 };
    setChoiceCounts(next); setRoundChoice(itemId);
    window.setTimeout(() => {
      if (trialIndex === 19) finishDigital(next);
      else { setTrialIndex((current) => current + 1); setRoundChoice(null); }
    }, 550);
  };

  const startTeacher = () => { setMethod("teacher"); setRanking([]); setStep("teacher"); };
  const addTeacherChoice = (item: Reinforcer) => {
    if (ranking.length < 6 && !ranking.some((ranked) => ranked.id === item.id)) {
      setRanking((current) => [...current, { ...item, rank: current.length + 1 }]);
    }
  };
  const reindex = (items: RankedReinforcer[]) => items.map((item, index) => ({ ...item, rank: index + 1 }));
  const removeRanked = (id: string) => setRanking((current) => reindex(current.filter((item) => item.id !== id)));
  const moveRanked = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= ranking.length) return;
    const next = [...ranking]; [next[index], next[target]] = [next[target], next[index]];
    setRanking(reindex(next));
  };

  const saveRanking = async () => {
    if (ranking.length !== 6) { toast.error("Önce 6 pekiştireci sıralayın."); return; }
    const institutionId = localStorage.getItem("kazanim-takip-institution-id");
    const teacherName = localStorage.getItem("kazanim-takip-teacher-name") || "";
    if (!institutionId || !studentId) return;
    setSaving(true);
    try {
      const toSave = ranking.map((item, index) => ({
        id: item.id, catalogId: item.catalogId || null, name: item.name,
        image: item.source === "community" ? item.image : null, source: item.source,
        rank: index + 1, selectedCount: item.selectedCount ?? null,
        shownCount: item.shownCount ?? null, score: item.score ?? null,
      }));
      await setDoc(doc(
        db, "institutions", institutionId, "students", studentId, "profiles", "abaReinforcers",
      ), { version: 2, rankings: toSave, method, updatedBy: teacherName, updatedAt: serverTimestamp() }, { merge: true });
      await associateCurrentTeacherWithStudent(studentId);
      setSavedProfile({ rankings: ranking, method, updatedAt: new Date() });
      setStep("summary"); toast.success("Pekiştireç sıralaması kaydedildi.");
    } catch (error) {
      console.error(error); toast.error("Sıralama kaydedilemedi.");
    } finally { setSaving(false); }
  };

  const restart = () => {
    setSelected([]); setSearchText(""); setRanking([]); setTrials([]);
    setTrialIndex(0); setChoiceCounts({}); setRoundChoice(null); setStep("select");
  };

  const openAddForm = () => {
    if (selected.length >= 10) { toast.error("Önce seçili adaylardan birini çıkarın."); return; }
    setNewName(""); setNewImage(null); setDuplicateResults([]); setShowAddForm(true);
  };

  const closeAddForm = () => {
    setShowAddForm(false); setNewName(""); setNewImage(null); setDuplicateResults([]);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const selectExistingItem = (item: Reinforcer) => {
    if (!selectedIds.has(item.id)) toggleItem(item);
    closeAddForm();
  };

  const handleImageSelection = (file: File | undefined, input: HTMLInputElement) => {
    setNewImage(file || null);
    input.value = "";
  };

  if (loading) return <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="animate-spin text-cyan-400" size={36} /></div>;

  return <div className="min-h-screen bg-[#020617] px-4 py-4 pb-24 text-slate-100">
    <div className="mx-auto max-w-4xl">
      <header className="sticky top-0 z-30 mb-5 flex items-center gap-3 border-b border-white/10 bg-[#020617]/95 py-3 backdrop-blur">
        {onBack && <button type="button" onClick={onBack} className="rounded-full border border-slate-700 bg-slate-900 p-2 text-slate-400"><ArrowLeft size={20} /></button>}
        <div className="min-w-0 flex-1"><h1 className="truncate text-lg font-black">Pekiştireç Belirleme</h1><p className="truncate text-xs text-slate-400">{studentName || "Öğrenciye özel"}</p></div>
        <Gift className="text-amber-400" />
      </header>

      {step === "summary" && <section className="space-y-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-center gap-3"><CheckCircle2 className="text-emerald-400" /><div><h2 className="font-black">Pekiştireçler belirlendi</h2><p className="text-sm text-slate-300">Tercihler değiştiğinde yeniden belirleyebilirsiniz.</p>{formatDate(savedProfile?.updatedAt) && <p className="mt-1 text-xs text-emerald-300">Son güncelleme: {formatDate(savedProfile?.updatedAt)}</p>}</div></div>
        </div>
        <div className="space-y-2">{savedRanking.map((item, index) => <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 font-black text-slate-950">{index + 1}</div><div className="h-14 w-14 overflow-hidden rounded-xl bg-white"><img src={item.image} alt="" className="h-full w-full object-contain p-1" /></div><span className="font-bold">{item.name}</span></div>)}</div>
        <button type="button" onClick={restart} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 font-bold text-amber-300"><RefreshCw size={18} /> Yeniden Belirle</button>
      </section>}

      {step === "select" && <section className="space-y-4">
        <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/10 p-4"><h2 className="text-xl font-black">10 aday seçin</h2><p className="mt-1 text-sm text-slate-300">Ailenin söylediği veya öğretmenin sevdiğini bildiği seçeneklerden tam 10 tane seçin.</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-cyan-400" style={{ width: `${selected.length * 10}%` }} /></div><p className="mt-2 text-right font-black text-cyan-300">{selected.length}/10</p></div>
        {selected.length > 0 && <div className="flex gap-2 overflow-x-auto pb-1">{selected.map((item, index) => <button key={item.id} type="button" onClick={() => toggleItem(item)} className="flex shrink-0 items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 py-2 pl-3 pr-2 text-xs font-bold">{index + 1}. {item.name}<X size={14} /></button>)}</div>}
        <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} /><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Listede ara…" className="w-full rounded-2xl border border-slate-700 bg-slate-900 py-4 pl-11 pr-10 outline-none focus:border-cyan-500" />{searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-cyan-400" size={18} />}</div>
        {!showAddForm && <button type="button" onClick={openAddForm} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-400/50 bg-violet-500/10 p-4 font-black text-violet-200"><Plus size={20} /> Pekiştireç Ekle</button>}
        {showAddForm && <div className="rounded-2xl border border-violet-500/30 bg-slate-900 p-4">
          <div className="flex items-center justify-between"><h3 className="font-black">Pekiştireç Ekle</h3><button type="button" onClick={closeAddForm}><X /></button></div>
          <input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Nesnenin adı" className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" />
          {checkingDuplicates && <div className="mt-3 flex items-center gap-2 text-xs text-slate-400"><Loader2 className="animate-spin" size={14} /> Listede kontrol ediliyor…</div>}
          {duplicateResults.length > 0 && <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3">
            <p className="text-sm font-bold text-amber-200">Listede buna benzer pekiştireçler var</p>
            <p className="mt-1 text-xs text-slate-300">İsterseniz var olan görseli seçin veya kendi fotoğrafınızı ekleyin.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{duplicateResults.map((item) => <button key={item.id} type="button" onClick={() => selectExistingItem(item)} className="rounded-xl border border-slate-700 bg-slate-950 p-2 text-left"><div className="h-20 overflow-hidden rounded-lg bg-white"><img src={item.image} alt={item.name} className="h-full w-full object-contain p-1" /></div><p className="mt-2 truncate text-xs font-bold">{item.name}</p></button>)}</div>
          </div>}
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} onChange={(event) => handleImageSelection(event.target.files?.[0], event.currentTarget)} />
          <input ref={galleryInputRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(event) => handleImageSelection(event.target.files?.[0], event.currentTarget)} />
          <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => cameraInputRef.current?.click()} className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm font-bold"><Camera className="text-violet-400" size={18} /> Kamera</button><button type="button" onClick={() => galleryInputRef.current?.click()} className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm font-bold"><ImagePlus className="text-violet-400" size={18} /> Galeri</button></div>
          {newImage && <p className="mt-2 truncate text-xs text-emerald-300">Seçildi: {newImage.name}</p>}
          <button type="button" disabled={adding || !newName.trim() || !newImage} onClick={addNewItem} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 p-3 font-black disabled:opacity-40">{adding ? <Loader2 className="animate-spin" /> : <Save size={18} />} Ekle ve Seç</button>
        </div>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{visibleItems.map((item) => { const checked = selectedIds.has(item.id); return <button key={item.id} type="button" onClick={() => toggleItem(item)} className={twMerge("rounded-2xl border p-2 text-left active:scale-[0.98]", checked ? "border-cyan-400 bg-cyan-500/15" : "border-slate-800 bg-slate-900")}><Picture item={item} /><div className="flex items-center justify-between gap-2 px-2 py-3"><span className="truncate text-sm font-bold">{item.name}</span><span className={twMerge("flex h-6 w-6 items-center justify-center rounded-full border", checked ? "border-cyan-300 bg-cyan-400 text-slate-950" : "border-slate-600")}>{checked && <Check size={14} />}</span></div></button>; })}</div>
        <button type="button" disabled={selected.length !== 10} onClick={() => setStep("method")} className="sticky bottom-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 p-4 font-black text-slate-950 shadow-2xl disabled:bg-slate-800 disabled:text-slate-500">Devam Et <ChevronRight /></button>
      </section>}

      {step === "method" && <section className="space-y-4"><button type="button" onClick={() => setStep("select")} className="flex items-center gap-2 text-sm text-slate-400"><ArrowLeft size={17} /> Adaylara dön</button><h2 className="text-xl font-black">Nasıl belirlenecek?</h2><button type="button" onClick={startDigital} className="w-full rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 text-left"><MonitorSmartphone className="mb-3 text-blue-400" /><h3 className="font-black">Çocuk ekrandan seçsin</h3><p className="mt-1 text-sm text-slate-300">20 tur boyunca üçer görsel çıkar. Uygulama en çok seçilen 6 taneyi sıralar.</p></button><button type="button" onClick={startTeacher} className="w-full rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-left"><PencilLine className="mb-3 text-amber-400" /><h3 className="font-black">Öğretmen kendisi sıralasın</h3><p className="mt-1 text-sm text-slate-300">Gerçek nesneleri çocuğun önüne koyup dener ve en sevdiği 6 taneyi seçer.</p></button></section>}

      {step === "digital" && trials[trialIndex] && <section className="space-y-5"><div className="flex items-center justify-between text-sm"><span className="font-black text-cyan-300">Seçim {trialIndex + 1}/20</span><span className="text-slate-500">Birine dokun</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-cyan-400" style={{ width: `${(trialIndex + 1) * 5}%` }} /></div><h2 className="text-center text-xl font-black">Hangisini istiyorsun?</h2><div className="grid grid-cols-3 gap-2 sm:gap-4">{trials[trialIndex].map((item) => <button key={item.id} type="button" disabled={Boolean(roundChoice)} onClick={() => chooseDigital(item.id)} className={twMerge("rounded-2xl border p-2 active:scale-95", roundChoice === item.id ? "border-emerald-400 bg-emerald-500/20" : "border-slate-700 bg-slate-900")}><Picture item={item} large /><p className="mt-3 break-words text-center text-xs font-black sm:text-base">{item.name}</p></button>)}</div></section>}

      {step === "teacher" && <section className="space-y-4"><div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4"><h2 className="font-black">En sevdiğinden başlayarak 6 tanesini seçin</h2><p className="mt-1 text-sm text-slate-300">Gerçek nesneleri deneyerek çocuğun tercih sırasını belirleyin.</p></div><RankingList ranking={ranking} move={moveRanked} remove={removeRanked} />{ranking.length < 6 && <CandidateButtons items={selected} ranking={ranking} add={addTeacherChoice} />}<button type="button" disabled={ranking.length !== 6} onClick={() => setStep("result")} className="w-full rounded-2xl bg-amber-400 p-4 font-black text-slate-950 disabled:bg-slate-800 disabled:text-slate-500">Sıralamayı Onayla</button></section>}

      {step === "result" && <section className="space-y-4"><div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4"><h2 className="text-xl font-black">İlk 6 pekiştireç</h2><p className="mt-1 text-sm text-slate-300">Gerekirse sıralamayı değiştirip kaydedin.</p></div><RankingList ranking={ranking} move={moveRanked} remove={removeRanked} showScores={method === "digital"} />{ranking.length < 6 && <CandidateButtons items={selected} ranking={ranking} add={addTeacherChoice} />}<button type="button" disabled={saving || ranking.length !== 6} onClick={saveRanking} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 p-4 font-black text-slate-950 disabled:opacity-40">{saving ? <Loader2 className="animate-spin" /> : <Save />} Kaydet</button></section>}
    </div>
  </div>;
}

function CandidateButtons({ items, ranking, add }: { items: Reinforcer[]; ranking: RankedReinforcer[]; add: (item: Reinforcer) => void }) {
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{items.filter((item) => !ranking.some((ranked) => ranked.id === item.id)).map((item) => <button key={item.id} type="button" onClick={() => add(item)} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 p-3 text-left"><Plus className="shrink-0 text-amber-400" size={17} /><span className="truncate text-sm font-bold">{item.name}</span></button>)}</div>;
}

function RankingList({ ranking, move, remove, showScores = false }: { ranking: RankedReinforcer[]; move: (index: number, direction: -1 | 1) => void; remove: (id: string) => void; showScores?: boolean }) {
  return <div className="space-y-2">{ranking.map((item, index) => <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 font-black text-slate-950">{index + 1}</div><div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white"><img src={item.image} alt="" className="h-full w-full object-contain p-1" /></div><div className="min-w-0 flex-1"><p className="truncate font-bold">{item.name}</p>{showScores && <p className="text-xs text-slate-500">6 gösterim · {item.selectedCount || 0} seçim</p>}</div><div className="flex gap-1"><button type="button" disabled={index === 0} onClick={() => move(index, -1)} className="rounded-lg border border-slate-700 p-2 text-slate-400 disabled:opacity-20"><ArrowUp size={15} /></button><button type="button" disabled={index === ranking.length - 1} onClick={() => move(index, 1)} className="rounded-lg border border-slate-700 p-2 text-slate-400 disabled:opacity-20"><ArrowDown size={15} /></button><button type="button" onClick={() => remove(item.id)} className="rounded-lg border border-red-500/20 p-2 text-red-400"><Trash2 size={15} /></button></div></div>)}{Array.from({ length: Math.max(0, 6 - ranking.length) }).map((_, index) => <div key={`empty-${index}`} className="flex h-16 items-center justify-center rounded-2xl border border-dashed border-slate-700 text-sm text-slate-500">{ranking.length + index + 1}. sıra boş</div>)}</div>;
}
