import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  endAt,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAt,
} from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Camera,
  Check,
  CirclePlus,
  Gift,
  ImagePlus,
  Loader2,
  MonitorSmartphone,
  PackageOpen,
  PencilLine,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { db, storage } from "@/firebase";

const assetModules = import.meta.glob(
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

type CategoryId = "oyun" | "meyve" | "icecek" | "temel-gida" | "ozel";
type SourceType = "built-in" | "community";
type MethodType = "digital" | "physical" | "teacher";
type StepType = "summary" | "intro" | "candidates" | "method" | "assessment" | "review";

interface ReinforcerItem {
  id: string;
  catalogId?: string;
  name: string;
  image?: string;
  category: CategoryId;
  source: SourceType;
  physicalOnly?: boolean;
}

interface RankedItem extends ReinforcerItem {
  rank: number;
  score?: number;
  shownCount?: number;
  selectedCount?: number;
}

interface ItemStat {
  shown: number;
  selected: number;
}

type AssessmentStats = Record<string, ItemStat>;

interface SavedProfile {
  rankings: RankedItem[];
  method: MethodType;
  teacherAdjusted?: boolean;
  updatedAt?: { toDate?: () => Date } | Date | string | null;
}

interface ReinforcerPageProps {
  studentId: string;
  studentName?: string;
  onBack?: () => void;
}

const CATEGORIES: Array<{ id: "all" | CategoryId; label: string }> = [
  { id: "all", label: "Tümü" },
  { id: "oyun", label: "Oyun ve etkinlik" },
  { id: "meyve", label: "Meyveler" },
  { id: "icecek", label: "İçecekler" },
  { id: "temel-gida", label: "Temel gıdalar" },
  { id: "ozel", label: "Öğretmenlerin ekledikleri" },
];

const pathImage = (path: string) => assetModules[path];

const makeItems = (
  category: CategoryId,
  directory: string,
  entries: Array<[string, string, string]>,
): ReinforcerItem[] =>
  entries.map(([id, name, file]) => ({
    id: `ready:${id}`,
    name,
    image: pathImage(`${directory}/${file}`),
    category,
    source: "built-in",
  }));

const BUILT_IN_ITEMS: ReinforcerItem[] = [
  ...makeItems("oyun", "./ortakdikkatsesgorsel", [
    ["biskuvi", "Bisküvi", "biskuvi.png"],
    ["cikolata", "Çikolata", "cikolata.png"],
    ["cips", "Cips", "cips.png"],
    ["dondurma", "Dondurma", "dondurma.png"],
    ["kaydirak", "Kaydırak", "kaydirak.png"],
    ["oyun-hamuru", "Oyun hamuru", "oyunhamuru.png"],
    ["salincak", "Salıncak", "salincak.png"],
    ["seker", "Şeker", "seker.png"],
    ["tablet", "Tablet", "tablet.png"],
    ["trambolin", "Trambolin", "trombolin.png"],
    ["yapboz", "Yapboz", "yapboz.png"],
  ]),
  ...makeItems("oyun", "../yonerge/sesgorsel", [
    ["top", "Top", "top.png"],
    ["oyuncak-araba", "Oyuncak araba", "araba.png"],
    ["oyuncak-bebek", "Oyuncak bebek", "bebek.png"],
    ["balon", "Balon", "kirmizibalon.png"],
    ["kitap", "Kitap", "kitap.png"],
  ]),
  ...makeItems("oyun", "../esle", [["gitar", "Gitar", "gitar.png"]]),
  ...makeItems("oyun", "../../okulmalzemeleri", [["sulu-boya", "Sulu boya", "suluboya.png"]]),
  ...makeItems("meyve", "../../fruits", [
    ["ananas", "Ananas", "ananas.jpg"],
    ["armut", "Armut", "armut.jpg"],
    ["cilek", "Çilek", "cilek.jpg"],
    ["elma", "Elma", "elma.jpg"],
    ["erik", "Erik", "erik.png"],
    ["karpuz", "Karpuz", "karpuz.jpg"],
    ["kavun", "Kavun", "kavun.png"],
    ["kiraz", "Kiraz", "kiraz.jpg"],
    ["kivi", "Kivi", "kivi.png"],
    ["limon", "Limon", "limon.png"],
    ["muz", "Muz", "muz.jpg"],
    ["nar", "Nar", "nar.jpg"],
    ["portakal", "Portakal", "portakal.jpg"],
    ["seftali", "Şeftali", "seftali.png"],
    ["uzum", "Üzüm", "uzum.jpg"],
  ]),
  ...makeItems("icecek", "../../icecekler", [
    ["ayran", "Ayran", "ayran.png"],
    ["cay", "Çay", "cay.png"],
    ["kahve", "Kahve", "kahva.png"],
    ["kola", "Kola", "kola.png"],
    ["limonata", "Limonata", "limonata.png"],
    ["meyve-suyu", "Meyve suyu", "meyvesuyu.png"],
    ["soda", "Soda", "soda.png"],
    ["su", "Su", "su.png"],
    ["sut", "Süt", "sut.png"],
    ["tursu-suyu", "Turşu suyu", "tursusuyu.png"],
  ]),
  ...makeItems("temel-gida", "../../temelgidalar", [
    ["bal", "Bal", "bal.png"],
    ["balik", "Balık", "balik.png"],
    ["corba", "Çorba", "corba.png"],
    ["ekmek", "Ekmek", "ekmek.png"],
    ["et", "Et", "et.png"],
    ["kuruyemis", "Kuru yemiş", "kuruyemis.png"],
    ["makarna", "Makarna", "makarna.png"],
    ["peynir", "Peynir", "peynir.png"],
    ["pilav", "Pilav", "pilav.png"],
    ["recel", "Reçel", "recel.png"],
    ["tavuk", "Tavuk", "tavuk.png"],
    ["yag", "Yağ", "yag.png"],
    ["yogurt", "Yoğurt", "yogurt.png"],
    ["yumurta", "Yumurta", "yumurta.png"],
    ["zeytin", "Zeytin", "zeytin.png"],
  ]),
];

const normalizeName = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ");

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const buildBalancedTrials = (items: ReinforcerItem[]): ReinforcerItem[][] => {
  const exposure = Object.fromEntries(items.map((item) => [item.id, 0])) as Record<string, number>;
  const trials: ReinforcerItem[][] = [];

  while (Math.min(...Object.values(exposure)) < 3) {
    const group = shuffle(items)
      .sort((a, b) => exposure[a.id] - exposure[b.id])
      .slice(0, 3);

    group.forEach((item) => {
      exposure[item.id] += 1;
    });
    trials.push(shuffle(group));
  }

  return trials;
};

const resizeToWebp = async (file: File): Promise<Blob> => {
  const bitmap = await createImageBitmap(file);
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Görsel işlenemedi.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  const scale = Math.min(size / bitmap.width, size / bitmap.height);
  const width = bitmap.width * scale;
  const height = bitmap.height * scale;
  ctx.drawImage(bitmap, (size - width) / 2, (size - height) / 2, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Görsel dönüştürülemedi."))),
      "image/webp",
      0.82,
    );
  });
};

const formatUpdatedAt = (value: SavedProfile["updatedAt"]) => {
  if (!value) return "";
  try {
    const date =
      typeof value === "object" && "toDate" in value && typeof value.toDate === "function"
        ? value.toDate()
        : new Date(value as string | Date);
    return new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short" }).format(date);
  } catch {
    return "";
  }
};

function ItemVisual({ item, large = false }: { item: ReinforcerItem; large?: boolean }) {
  return (
    <div
      className={twMerge(
        "relative overflow-hidden rounded-2xl bg-white flex items-center justify-center",
        large ? "h-44 sm:h-56" : "h-28 sm:h-36",
      )}
    >
      {item.image ? (
        <img src={item.image} alt={item.name} className="h-full w-full object-contain p-2" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-100 px-3 text-center text-slate-600">
          <PackageOpen size={large ? 44 : 30} />
          <span className="text-xs font-semibold">Gerçek nesne/etkinlik</span>
        </div>
      )}
    </div>
  );
}

export default function Pekistirec({ studentId, studentName, onBack }: ReinforcerPageProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<StepType>("intro");
  const [savedProfile, setSavedProfile] = useState<SavedProfile | null>(null);

  const [selected, setSelected] = useState<ReinforcerItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<"all" | CategoryId>("all");
  const [searchText, setSearchText] = useState("");
  const [communityItems, setCommunityItems] = useState<ReinforcerItem[]>([]);
  const [searchingCommunity, setSearchingCommunity] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customImage, setCustomImage] = useState<File | null>(null);
  const [addingCustom, setAddingCustom] = useState(false);

  const [method, setMethod] = useState<MethodType>("teacher");
  const [trials, setTrials] = useState<ReinforcerItem[][]>([]);
  const [trialIndex, setTrialIndex] = useState(0);
  const [stats, setStats] = useState<AssessmentStats>({});
  const [positionSelections, setPositionSelections] = useState([0, 0, 0]);
  const [recordedChoice, setRecordedChoice] = useState<{
    choiceId: string | null;
    nextStats: AssessmentStats;
    nextPositions: number[];
  } | null>(null);
  const [ranking, setRanking] = useState<RankedItem[]>([]);
  const [teacherAdjusted, setTeacherAdjusted] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const institutionId = localStorage.getItem("kazanim-takip-institution-id");
      if (!institutionId || !studentId) {
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDoc(
          doc(db, "institutions", institutionId, "students", studentId, "profiles", "abaReinforcers"),
        );
        if (snapshot.exists()) {
          const profile = snapshot.data() as SavedProfile;
          setSavedProfile(profile);
          setStep("summary");
        }
      } catch (error) {
        console.error(error);
        toast.error("Pekiştireç profili yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [studentId]);

  useEffect(() => {
    const normalized = normalizeName(searchText);
    if (normalized.length < 2) {
      setCommunityItems([]);
      setSearchingCommunity(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearchingCommunity(true);
      try {
        const snapshot = await getDocs(
          query(
            collection(db, "reinforcerCatalog"),
            orderBy("normalizedName"),
            startAt(normalized),
            endAt(`${normalized}\uf8ff`),
            limit(24),
          ),
        );
        setCommunityItems(
          snapshot.docs.map((catalogDoc) => {
            const data = catalogDoc.data();
            return {
              id: `community:${catalogDoc.id}`,
              catalogId: catalogDoc.id,
              name: String(data.name || "Adsız pekiştireç"),
              image: data.imageUrl ? String(data.imageUrl) : undefined,
              category: "ozel" as const,
              source: "community" as const,
              physicalOnly: !data.imageUrl,
            };
          }),
        );
      } catch (error) {
        console.error(error);
        setCommunityItems([]);
      } finally {
        setSearchingCommunity(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchText]);

  const allVisibleItems = useMemo(() => {
    const normalized = normalizeName(searchText);
    const ready = BUILT_IN_ITEMS.filter((item) => {
      const categoryMatches = activeCategory === "all" || item.category === activeCategory;
      const searchMatches = !normalized || normalizeName(item.name).includes(normalized);
      return categoryMatches && searchMatches;
    });

    const community = communityItems.filter(
      (item) => activeCategory === "all" || activeCategory === "ozel",
    );
    return [...ready, ...community];
  }, [activeCategory, communityItems, searchText]);

  const selectedIds = useMemo(() => new Set(selected.map((item) => item.id)), [selected]);

  const resetDraft = () => {
    setSelected([]);
    setRanking([]);
    setSearchText("");
    setActiveCategory("all");
    setTrials([]);
    setTrialIndex(0);
    setStats({});
    setPositionSelections([0, 0, 0]);
    setRecordedChoice(null);
    setTeacherAdjusted(false);
    setStep("intro");
  };

  const toggleCandidate = (item: ReinforcerItem) => {
    setSelected((current) =>
      current.some((candidate) => candidate.id === item.id)
        ? current.filter((candidate) => candidate.id !== item.id)
        : [...current, item],
    );
  };

  const addCustomReinforcer = async () => {
    const name = customName.trim();
    const institutionId = localStorage.getItem("kazanim-takip-institution-id");
    const teacherName = localStorage.getItem("kazanim-takip-teacher-name") || "";
    if (!name || !institutionId) {
      toast.error("Pekiştirecin adını yazın.");
      return;
    }

    setAddingCustom(true);
    try {
      let imageUrl: string | undefined;
      if (customImage) {
        const blob = await resizeToWebp(customImage);
        const uniqueId = crypto.randomUUID();
        const imageRef = storageRef(storage, `reinforcer_catalog/${uniqueId}.webp`);
        await uploadBytes(imageRef, blob, { contentType: "image/webp" });
        imageUrl = await getDownloadURL(imageRef);
      }

      const newDocument = await addDoc(collection(db, "reinforcerCatalog"), {
        name,
        normalizedName: normalizeName(name),
        imageUrl: imageUrl || null,
        physicalOnly: !imageUrl,
        createdByInstitutionId: institutionId,
        createdByTeacher: teacherName,
        createdAt: serverTimestamp(),
        status: "active",
      });

      const newItem: ReinforcerItem = {
        id: `community:${newDocument.id}`,
        catalogId: newDocument.id,
        name,
        image: imageUrl,
        category: "ozel",
        source: "community",
        physicalOnly: !imageUrl,
      };
      setCommunityItems((current) => [newItem, ...current]);
      setSelected((current) => [...current, newItem]);
      setCustomName("");
      setCustomImage(null);
      setShowCustomForm(false);
      toast.success("Yeni pekiştireç ortak kataloğa eklendi.");
    } catch (error) {
      console.error(error);
      toast.error("Pekiştireç eklenemedi.");
    } finally {
      setAddingCustom(false);
    }
  };

  const beginAutomaticAssessment = (selectedMethod: "digital" | "physical") => {
    const usable =
      selectedMethod === "digital" ? selected.filter((item) => Boolean(item.image)) : selected;

    if (usable.length < 6) {
      toast.error(
        selectedMethod === "digital"
          ? "Ekrandan değerlendirme için en az 6 görselli aday seçin."
          : "Değerlendirme için en az 6 aday seçin.",
      );
      return;
    }

    const nextTrials = buildBalancedTrials(usable);
    setMethod(selectedMethod);
    setTrials(nextTrials);
    setTrialIndex(0);
    setStats(Object.fromEntries(usable.map((item) => [item.id, { shown: 0, selected: 0 }])));
    setPositionSelections([0, 0, 0]);
    setRecordedChoice(null);
    setStep("assessment");
  };

  const beginTeacherRanking = () => {
    setMethod("teacher");
    setRanking([]);
    setTeacherAdjusted(false);
    setStep("review");
  };

  const rankFromStats = (finalStats: AssessmentStats) => {
    const evaluatedItems = trials.flat();
    const uniqueItems = Array.from(new Map(evaluatedItems.map((item) => [item.id, item])).values());

    const calculated = uniqueItems
      .map((item) => {
        const itemStats = finalStats[item.id] || { shown: 0, selected: 0 };
        const score = itemStats.shown ? itemStats.selected / itemStats.shown : 0;
        return {
          ...item,
          rank: 0,
          score,
          shownCount: itemStats.shown,
          selectedCount: itemStats.selected,
        };
      })
      .sort(
        (a, b) =>
          (b.score || 0) - (a.score || 0) ||
          (b.selectedCount || 0) - (a.selectedCount || 0) ||
          a.name.localeCompare(b.name, "tr"),
      )
      .slice(0, 6)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    setRanking(calculated);
    setTeacherAdjusted(false);
    setStep("review");
  };

  const recordChoice = (choiceId: string | null, position?: number) => {
    if (recordedChoice) return;
    const currentTrial = trials[trialIndex];
    const nextStats: AssessmentStats = Object.fromEntries(
      Object.entries(stats).map(([id, itemStats]) => [id, { ...itemStats }]),
    );

    currentTrial.forEach((item) => {
      nextStats[item.id] = nextStats[item.id] || { shown: 0, selected: 0 };
      nextStats[item.id].shown += 1;
    });
    if (choiceId) nextStats[choiceId].selected += 1;

    const nextPositions = [...positionSelections];
    if (typeof position === "number") nextPositions[position] += 1;

    setStats(nextStats);
    setPositionSelections(nextPositions);
    setRecordedChoice({ choiceId, nextStats, nextPositions });
  };

  const advanceTrial = () => {
    if (!recordedChoice) return;
    if (trialIndex === trials.length - 1) {
      rankFromStats(recordedChoice.nextStats);
      setRecordedChoice(null);
      return;
    }
    setTrialIndex((current) => current + 1);
    setRecordedChoice(null);
  };

  const reindexRanking = (items: RankedItem[]) => items.map((item, index) => ({ ...item, rank: index + 1 }));

  const moveRankedItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= ranking.length) return;
    const next = [...ranking];
    [next[index], next[target]] = [next[target], next[index]];
    setRanking(reindexRanking(next));
    setTeacherAdjusted(true);
  };

  const removeRankedItem = (id: string) => {
    setRanking((current) => reindexRanking(current.filter((item) => item.id !== id)));
    setTeacherAdjusted(true);
  };

  const addToRanking = (item: ReinforcerItem) => {
    if (ranking.length >= 6 || ranking.some((ranked) => ranked.id === item.id)) return;
    setRanking((current) => [...current, { ...item, rank: current.length + 1 }]);
    setTeacherAdjusted(true);
  };

  const saveProfile = async () => {
    if (ranking.length !== 6) {
      toast.error("Kaydetmek için 6 pekiştireci sıraya yerleştirin.");
      return;
    }
    const institutionId = localStorage.getItem("kazanim-takip-institution-id");
    const teacherName = localStorage.getItem("kazanim-takip-teacher-name") || "";
    if (!institutionId || !studentId) return;

    setSaving(true);
    try {
      const cleanedRanking = ranking.map((item, index) => ({
        id: item.id,
        catalogId: item.catalogId || null,
        name: item.name,
        image: item.source === "community" ? item.image || null : null,
        category: item.category,
        source: item.source,
        physicalOnly: Boolean(item.physicalOnly),
        rank: index + 1,
        score: typeof item.score === "number" ? item.score : null,
        shownCount: item.shownCount ?? null,
        selectedCount: item.selectedCount ?? null,
      }));

      await setDoc(
        doc(db, "institutions", institutionId, "students", studentId, "profiles", "abaReinforcers"),
        {
          version: 1,
          rankings: cleanedRanking,
          method,
          teacherAdjusted: method !== "teacher" && teacherAdjusted,
          updatedBy: teacherName,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      const localProfile: SavedProfile = {
        rankings: cleanedRanking.map((item) => ({
          ...item,
          catalogId: item.catalogId || undefined,
          image:
            item.source === "built-in"
              ? BUILT_IN_ITEMS.find((ready) => ready.id === item.id)?.image
              : item.image || undefined,
          score: item.score ?? undefined,
          shownCount: item.shownCount ?? undefined,
          selectedCount: item.selectedCount ?? undefined,
        })),
        method,
        teacherAdjusted: method !== "teacher" && teacherAdjusted,
        updatedAt: new Date(),
      };
      setSavedProfile(localProfile);
      setStep("summary");
      toast.success("Pekiştireç sıralaması kaydedildi.");
    } catch (error) {
      console.error(error);
      toast.error("Pekiştireç sıralaması kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const resolvedSavedRanking = useMemo(() => {
    if (!savedProfile) return [];
    return savedProfile.rankings
      .map((item) => ({
        ...item,
        image:
          item.source === "built-in"
            ? BUILT_IN_ITEMS.find((ready) => ready.id === item.id)?.image
            : item.image,
      }))
      .sort((a, b) => a.rank - b.rank);
  }, [savedProfile]);

  const chosenCount = positionSelections.reduce((sum, count) => sum + count, 0);
  const hasPositionBias = chosenCount >= 5 && Math.max(...positionSelections) / chosenCount >= 0.7;
  const digitalCandidateCount = selected.filter((item) => Boolean(item.image)).length;

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-3xl bg-[#020617] text-cyan-400">
        <Loader2 className="animate-spin" size={38} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] px-4 py-5 pb-24 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <header className="sticky top-0 z-30 mb-5 flex items-center justify-between border-b border-white/10 bg-[#020617]/95 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="rounded-full border border-slate-700 bg-slate-900 p-2 text-slate-400 active:scale-95"
                aria-label="Geri dön"
              >
                <ArrowLeft size={21} />
              </button>
            )}
            <div>
              <h1 className="text-lg font-black sm:text-xl">Pekiştireç Belirleme</h1>
              <p className="text-xs text-slate-400">{studentName || "Öğrenciye özel ABA tercih profili"}</p>
            </div>
          </div>
          <Gift className="text-amber-400" />
        </header>

        {step === "summary" && savedProfile && (
          <section className="space-y-5">
            <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/10 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-emerald-500/20 p-3 text-emerald-300"><Check /></div>
                <div>
                  <h2 className="text-xl font-black">Güncel pekiştireç sıralaması</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    Tercihler değişebilir. Sıralamayı ihtiyaç duyduğunuz her zaman yeniden belirleyebilirsiniz.
                  </p>
                  {formatUpdatedAt(savedProfile.updatedAt) && (
                    <p className="mt-2 text-xs text-emerald-300/80">
                      Son güncelleme: {formatUpdatedAt(savedProfile.updatedAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {resolvedSavedRanking.map((item, index) => (
                <div key={item.id} className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-400 text-lg font-black text-slate-950">
                    {index + 1}
                  </div>
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white">
                    {item.image ? (
                      <img src={item.image} alt="" className="h-full w-full object-contain p-1" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-500"><PackageOpen /></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{item.name}</p>
                    <p className="text-xs text-slate-500">{index === 0 ? "En güçlü pekiştireç" : `${index + 1}. tercih`}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={resetDraft}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-5 py-4 font-bold text-amber-300 active:scale-[0.99]"
            >
              <RefreshCw size={19} /> Yeniden Belirle
            </button>
          </section>
        )}

        {step === "intro" && (
          <section className="space-y-5">
            <div className="rounded-3xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/15 to-blue-500/5 p-6">
              <Sparkles className="mb-4 text-cyan-300" size={32} />
              <h2 className="text-2xl font-black">Önce olası pekiştireçleri belirleyin</h2>
              <p className="mt-3 leading-relaxed text-slate-300">
                Aileden bilgi alın, öğrenciyi serbest zamanda gözlemleyin ve elde etmek için çaba gösterdiği yiyecek, nesne veya etkinlikleri aday listeye ekleyin.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <MonitorSmartphone className="mb-3 text-blue-400" />
                <h3 className="font-bold">Ekrandan seçebilir</h3>
                <p className="mt-1 text-sm text-slate-400">Öğrenci üçlü görseller arasından dokunarak seçer.</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <PackageOpen className="mb-3 text-violet-400" />
                <h3 className="font-bold">Gerçek nesneyi alabilir</h3>
                <p className="mt-1 text-sm text-slate-400">Öğretmen çocuğun aldığı/yediği seçeneği uygulamaya işler.</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <PencilLine className="mb-3 text-amber-400" />
                <h3 className="font-bold">Öğretmen sıralayabilir</h3>
                <p className="mt-1 text-sm text-slate-400">Bilinen tercihler doğrudan en güçlüden en aza sıralanır.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-relaxed text-amber-100">
              Yiyecekleri küçük miktarlarda, etkinlikleri kısa süreli sunun. Seçilen pekiştireci mümkün olduğunca hemen verin.
            </div>

            <button
              type="button"
              onClick={() => setStep("candidates")}
              className="w-full rounded-2xl bg-cyan-500 px-5 py-4 font-black text-slate-950 active:scale-[0.99]"
            >
              Aday Pekiştireçleri Seç
            </button>
          </section>
        )}

        {step === "candidates" && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <h2 className="font-black">Öğrencinin sevdiği düşünülenleri seçin</h2>
              <p className="mt-1 text-sm text-slate-400">Değerlendirme için en az 6 aday gerekir. İstediğiniz kadar aday ekleyebilirsiniz.</p>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-950 px-4 py-3">
                <span className="text-sm text-slate-400">Seçilen aday</span>
                <span className="text-lg font-black text-cyan-300">{selected.length}</span>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={19} />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Pekiştireç ara veya yenisini yaz…"
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 py-4 pl-12 pr-4 outline-none focus:border-cyan-500"
              />
              {searchingCommunity && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-cyan-400" size={18} />}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={twMerge(
                    "shrink-0 rounded-full border px-4 py-2 text-xs font-bold",
                    activeCategory === category.id
                      ? "border-cyan-400 bg-cyan-400/15 text-cyan-300"
                      : "border-slate-800 bg-slate-900 text-slate-400",
                  )}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {searchText.trim().length >= 2 && (
              <button
                type="button"
                onClick={() => {
                  setCustomName(searchText.trim());
                  setShowCustomForm(true);
                }}
                className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-violet-400/50 bg-violet-500/10 p-4 text-left text-violet-200"
              >
                <CirclePlus />
                <span className="font-bold">“{searchText.trim()}” adıyla yeni bir seçenek ekle</span>
              </button>
            )}

            {showCustomForm && (
              <div className="rounded-3xl border border-violet-500/30 bg-slate-900 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-black">Yeni pekiştireç ekle</h3>
                  <button type="button" onClick={() => setShowCustomForm(false)} className="text-sm text-slate-400">Vazgeç</button>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  Aynı isimde sonuç bulunsa bile kendi fotoğrafınızı ekleyebilirsiniz. Çocuk yüzü veya kişisel bilgi içeren fotoğraf yüklemeyin.
                </p>
                <input
                  value={customName}
                  onChange={(event) => setCustomName(event.target.value)}
                  placeholder="Pekiştirecin adı"
                  className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                />
                <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-700 bg-slate-950 p-4 text-sm text-slate-300">
                  {customImage ? <Camera className="text-emerald-400" /> : <ImagePlus className="text-violet-400" />}
                  <span>{customImage ? customImage.name : "Fotoğraf çek veya galeriden seç (isteğe bağlı)"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(event) => setCustomImage(event.target.files?.[0] || null)}
                  />
                </label>
                {!customImage && (
                  <p className="mt-2 text-xs text-amber-300">Fotoğrafsız eklenirse gerçek nesneyle veya öğretmen sıralamasıyla kullanılabilir.</p>
                )}
                <button
                  type="button"
                  disabled={addingCustom || !customName.trim()}
                  onClick={addCustomReinforcer}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 font-bold disabled:opacity-40"
                >
                  {addingCustom ? <Loader2 className="animate-spin" /> : <CirclePlus />} Ortak Kataloğa Ekle
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {allVisibleItems.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleCandidate(item)}
                    className={twMerge(
                      "relative rounded-2xl border p-2 text-left transition active:scale-[0.98]",
                      isSelected
                        ? "border-cyan-400 bg-cyan-500/15 ring-2 ring-cyan-400/20"
                        : "border-slate-800 bg-slate-900/70",
                    )}
                  >
                    <ItemVisual item={item} />
                    <div className="flex items-center justify-between gap-2 px-2 py-3">
                      <span className="truncate text-sm font-bold">{item.name}</span>
                      <span className={twMerge("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border", isSelected ? "border-cyan-300 bg-cyan-400 text-slate-950" : "border-slate-600")}>{isSelected && <Check size={15} />}</span>
                    </div>
                    {item.source === "community" && <span className="absolute left-3 top-3 rounded-full bg-violet-600 px-2 py-1 text-[10px] font-bold">Topluluk</span>}
                  </button>
                );
              })}
            </div>

            <div className="sticky bottom-3 rounded-2xl border border-slate-700 bg-slate-950/95 p-3 shadow-2xl backdrop-blur">
              <button
                type="button"
                disabled={selected.length < 6}
                onClick={() => setStep("method")}
                className="w-full rounded-xl bg-cyan-500 px-4 py-4 font-black text-slate-950 disabled:bg-slate-800 disabled:text-slate-500"
              >
                Yöntemi Seç ({selected.length} aday)
              </button>
            </div>
          </section>
        )}

        {step === "method" && (
          <section className="space-y-4">
            <button type="button" onClick={() => setStep("candidates")} className="flex items-center gap-2 text-sm text-slate-400"><ArrowLeft size={17} /> Adaylara dön</button>
            <div>
              <h2 className="text-2xl font-black">Belirleme yöntemini seçin</h2>
              <p className="mt-1 text-sm text-slate-400">Üç yöntem de aynı öğrenci profilinde 6 sıralı pekiştireç oluşturur.</p>
            </div>

            <button
              type="button"
              disabled={digitalCandidateCount < 6}
              onClick={() => beginAutomaticAssessment("digital")}
              className="w-full rounded-3xl border border-blue-500/30 bg-blue-500/10 p-5 text-left disabled:opacity-40"
            >
              <MonitorSmartphone className="mb-3 text-blue-400" size={30} />
              <h3 className="text-lg font-black">Öğrenci ekrandan seçsin</h3>
              <p className="mt-1 text-sm text-slate-300">Her denemede üç görsel çıkar. Öğrenci doğrudan istediğine dokunur.</p>
              <p className="mt-3 text-xs text-blue-300">{digitalCandidateCount} görselli aday kullanılabilir</p>
            </button>

            <button
              type="button"
              onClick={() => beginAutomaticAssessment("physical")}
              className="w-full rounded-3xl border border-violet-500/30 bg-violet-500/10 p-5 text-left"
            >
              <PackageOpen className="mb-3 text-violet-400" size={30} />
              <h3 className="text-lg font-black">Gerçek nesnelerle seçsin</h3>
              <p className="mt-1 text-sm text-slate-300">Uygulama üç nesneyi söyler; öğretmen öğrencinin aldığı/yediği seçeneği işaretler.</p>
            </button>

            <button
              type="button"
              onClick={beginTeacherRanking}
              className="w-full rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 text-left"
            >
              <PencilLine className="mb-3 text-amber-400" size={30} />
              <h3 className="text-lg font-black">Öğretmen doğrudan sıralasın</h3>
              <p className="mt-1 text-sm text-slate-300">Aile bilgisi ve gözleme göre 6 seçenek en güçlüden en aza sıralanır.</p>
            </button>
          </section>
        )}

        {step === "assessment" && trials[trialIndex] && (
          <section className="space-y-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-cyan-300">Deneme {trialIndex + 1}/{trials.length}</span>
              <span className="text-slate-500">Her aday en az 3 kez gösterilir</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full bg-cyan-400 transition-all" style={{ width: `${((trialIndex + 1) / trials.length) * 100}%` }} />
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center">
              <h2 className="text-xl font-black">Hangisini istiyorsun?</h2>
              <p className="mt-1 text-sm text-slate-400">
                {method === "digital"
                  ? "Tableti öğrencinin önüne koyun ve seçmesine izin verin."
                  : "Bu üç gerçek seçeneği öğrencinin önüne yerleştirin; aldığını aşağıdan kaydedin."}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {trials[trialIndex].map((item, position) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={Boolean(recordedChoice)}
                  onClick={() => recordChoice(item.id, position)}
                  className={twMerge(
                    "rounded-2xl border p-2 transition active:scale-95 disabled:cursor-default",
                    recordedChoice?.choiceId === item.id
                      ? "border-emerald-400 bg-emerald-500/20 ring-2 ring-emerald-400/30"
                      : "border-slate-700 bg-slate-900",
                  )}
                >
                  <ItemVisual item={item} large />
                  <p className="mt-3 break-words text-center text-xs font-black sm:text-base">{item.name}</p>
                </button>
              ))}
            </div>

            {!recordedChoice ? (
              <button
                type="button"
                onClick={() => recordChoice(null)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-400"
              >
                Seçim yapmadı
              </button>
            ) : (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                <p className="font-bold text-emerald-200">
                  {recordedChoice.choiceId
                    ? `${trials[trialIndex].find((item) => item.id === recordedChoice.choiceId)?.name} seçildi.`
                    : "Seçim yapılmadı olarak kaydedildi."}
                </p>
                {recordedChoice.choiceId && method === "digital" && (
                  <p className="mt-1 text-sm text-slate-300">Seçtiği pekiştireci kısa süreli sunun.</p>
                )}
                <button type="button" onClick={advanceTrial} className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-3 font-black text-slate-950">
                  {trialIndex === trials.length - 1 ? "Sonucu Hesapla" : "Sonraki Üçlü"}
                </button>
              </div>
            )}
          </section>
        )}

        {step === "review" && (
          <section className="space-y-5">
            <div className="rounded-3xl border border-amber-500/25 bg-amber-500/10 p-5">
              <h2 className="text-xl font-black">İlk 6 pekiştireci onaylayın</h2>
              <p className="mt-1 text-sm text-slate-300">
                {method === "teacher"
                  ? "Aşağıdaki adaylardan 6 tanesini sıraya ekleyin."
                  : "Uygulama seçilme/gösterilme oranına göre sıraladı. Gerekirse öğretmen değiştirebilir."}
              </p>
              {hasPositionBias && method !== "teacher" && (
                <p className="mt-3 rounded-xl bg-red-500/15 p-3 text-sm font-bold text-red-300">
                  Konum tercihi olabilir: seçimlerin çoğu aynı konumdan yapıldı. Sonucu gözleminizle birlikte değerlendirin.
                </p>
              )}
            </div>

            <div className="space-y-3">
              {ranking.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400 font-black text-slate-950">{index + 1}</div>
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white">
                    {item.image ? <img src={item.image} alt="" className="h-full w-full object-contain p-1" /> : <div className="flex h-full items-center justify-center text-slate-500"><PackageOpen /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{item.name}</p>
                    {typeof item.score === "number" && (
                      <p className="text-xs text-slate-500">{item.selectedCount}/{item.shownCount} seçim · %{Math.round(item.score * 100)}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <button type="button" onClick={() => moveRankedItem(index, -1)} disabled={index === 0} className="rounded-lg border border-slate-700 p-2 text-slate-400 disabled:opacity-20"><ArrowUp size={16} /></button>
                    <button type="button" onClick={() => moveRankedItem(index, 1)} disabled={index === ranking.length - 1} className="rounded-lg border border-slate-700 p-2 text-slate-400 disabled:opacity-20"><ArrowDown size={16} /></button>
                    <button type="button" onClick={() => removeRankedItem(item.id)} className="col-span-2 rounded-lg border border-red-500/20 p-2 text-red-400"><Trash2 size={16} className="mx-auto" /></button>
                  </div>
                </div>
              ))}
              {Array.from({ length: Math.max(0, 6 - ranking.length) }).map((_, index) => (
                <div key={`empty-${index}`} className="flex h-20 items-center justify-center rounded-2xl border border-dashed border-slate-700 text-sm text-slate-500">{ranking.length + index + 1}. sıra boş</div>
              ))}
            </div>

            {ranking.length < 6 && (
              <div>
                <h3 className="mb-3 font-bold text-slate-300">Sıraya eklenebilecek adaylar</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {selected
                    .filter((item) => !ranking.some((ranked) => ranked.id === item.id))
                    .map((item) => (
                      <button key={item.id} type="button" onClick={() => addToRanking(item)} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 p-3 text-left">
                        <CirclePlus className="shrink-0 text-cyan-400" size={18} />
                        <span className="truncate text-sm font-bold">{item.name}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={saving || ranking.length !== 6}
              onClick={saveProfile}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 font-black text-slate-950 disabled:bg-slate-800 disabled:text-slate-500"
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save />} Sıralamayı Kaydet
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
