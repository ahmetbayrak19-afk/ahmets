import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Box,
  Check,
  EyeOff,
  PackageCheck,
  PlayCircle,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import confetti from "canvas-confetti";

import arabaImg from "./sesgorsel/araba.png";
import kalemImg from "./sesgorsel/kalem.png";
import elmaImg from "./sesgorsel/elma.png";
import topImg from "./sesgorsel/top.png";
import kitapImg from "./sesgorsel/kitap.png";
import bebekImg from "./sesgorsel/bebek.png";

type ObjectId = "araba" | "kalem" | "elma" | "top" | "kitap" | "bebek";

interface RelatedActionTask {
  id: string;
  objectId: ObjectId;
  text: string;
  materials: string[];
}

interface ObjectGroup {
  id: ObjectId;
  label: string;
  image: string;
  tasks: RelatedActionTask[];
}

/**
 * Altı nesne ve toplam 22 doğal yönerge.
 * Öğretmen hazırlık ekranında nesneleri seçer. Seçilen nesnelerin yönerge
 * havuzundan karışık sırayla her değerlendirmede tam 10 yönerge sorulur.
 */
const OBJECT_GROUPS: ObjectGroup[] = [
  {
    id: "araba",
    label: "Oyuncak araba",
    image: arabaImg,
    tasks: [
      {
        id: "araba-sur",
        objectId: "araba",
        text: "Şöyle güzelce sür bakalım",
        materials: ["Oyuncak araba"],
      },
      {
        id: "araba-kapi",
        objectId: "araba",
        text: "Kapısını aç bakalım",
        materials: ["Oyuncak araba"],
      },
      {
        id: "araba-korna",
        objectId: "araba",
        text: "Kornaya bir bas bakalım",
        materials: ["Oyuncak araba"],
      },
      {
        id: "araba-tekerlek",
        objectId: "araba",
        text: "Tekerleğini çevir bakalım",
        materials: ["Oyuncak araba"],
      },
    ],
  },
  {
    id: "kalem",
    label: "Kalem",
    image: kalemImg,
    tasks: [
      {
        id: "kalem-yaz",
        objectId: "kalem",
        text: "Hadi bir şeyler yaz",
        materials: ["Kalem", "Kâğıt"],
      },
      {
        id: "kalem-boya",
        objectId: "kalem",
        text: "Biraz boya bakalım",
        materials: ["Kalem", "Kâğıt"],
      },
      {
        id: "kalem-ev-ciz",
        objectId: "kalem",
        text: "Bir ev çiz bakalım",
        materials: ["Kalem", "Kâğıt"],
      },
      {
        id: "kalem-balik-ciz",
        objectId: "kalem",
        text: "Şimdi bir balık çiz bakalım",
        materials: ["Kalem", "Kâğıt"],
      },
    ],
  },
  {
    id: "elma",
    label: "Elma",
    image: elmaImg,
    tasks: [
      {
        id: "elma-ye",
        objectId: "elma",
        text: "Hadi biraz ye bakalım",
        materials: ["Elma"],
      },
      {
        id: "elma-kes",
        objectId: "elma",
        text: "Ortadan kes bakalım",
        materials: ["Elma", "Güvenli plastik/oyuncak bıçak"],
      },
      {
        id: "elma-soy",
        objectId: "elma",
        text: "Kabuğunu soy bakalım",
        materials: ["Elma"],
      },
    ],
  },
  {
    id: "top",
    label: "Top",
    image: topImg,
    tasks: [
      {
        id: "top-at",
        objectId: "top",
        text: "Hadi bana at",
        materials: ["Top"],
      },
      {
        id: "top-yuvarla",
        objectId: "top",
        text: "Yerde yuvarla bakalım",
        materials: ["Top"],
      },
      {
        id: "top-sektir",
        objectId: "top",
        text: "Biraz sektir bakalım",
        materials: ["Top"],
      },
      {
        id: "top-ayakla-vur",
        objectId: "top",
        text: "Ayağınla bir vur bakalım",
        materials: ["Top"],
      },
    ],
  },
  {
    id: "kitap",
    label: "Kitap",
    image: kitapImg,
    tasks: [
      {
        id: "kitap-ac",
        objectId: "kitap",
        text: "Hadi aç bakalım",
        materials: ["Resimli kitap"],
      },
      {
        id: "kitap-resim",
        objectId: "kitap",
        text: "Hadi resimlerine bir bakalım",
        materials: ["Resimli kitap"],
      },
      {
        id: "kitap-sayfa",
        objectId: "kitap",
        text: "Bir sayfasını çevir bakalım",
        materials: ["Resimli kitap"],
      },
    ],
  },
  {
    id: "bebek",
    label: "Oyuncak bebek",
    image: bebekImg,
    tasks: [
      {
        id: "bebek-uyut",
        objectId: "bebek",
        text: "Hadi uyut bakalım",
        materials: ["Oyuncak bebek"],
      },
      {
        id: "bebek-kucak",
        objectId: "bebek",
        text: "Kucağına al bakalım",
        materials: ["Oyuncak bebek"],
      },
      {
        id: "bebek-op",
        objectId: "bebek",
        text: "Hadi öp bakalım",
        materials: ["Oyuncak bebek"],
      },
      {
        id: "bebek-sac-tara",
        objectId: "bebek",
        text: "Saçını tara bakalım",
        materials: ["Oyuncak bebek", "Tarak"],
      },
    ],
  },
];

const MIN_SELECTED_OBJECTS = 3;
const TRIAL_COUNT = 10;
const PASS_SCORE = 8;

const OBJECT_WARNING_NAMES: Record<ObjectId, string> = {
  araba: "oyuncak arabayı",
  kalem: "kalemi",
  elma: "elmayı",
  top: "topu",
  kitap: "kitabı",
  bebek: "oyuncak bebeği",
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Yönergeleri nesnelere göre dengeli karıştırır. Seçili başka bir nesnenin
 * yönergesi kaldığı sürece aynı nesne art arda sorulmaz.
 */
function createMixedTaskOrder(tasks: RelatedActionTask[]): RelatedActionTask[] {
  const queues = new Map<ObjectId, RelatedActionTask[]>();

  tasks.forEach((task) => {
    const queue = queues.get(task.objectId) || [];
    queue.push(task);
    queues.set(task.objectId, queue);
  });

  queues.forEach((queue, objectId) => {
    queues.set(objectId, shuffle(queue));
  });

  const result: RelatedActionTask[] = [];
  let lastObjectId: ObjectId | null = null;

  while (result.length < tasks.length) {
    const nonEmpty = Array.from(queues.entries()).filter(
      ([, queue]) => queue.length > 0,
    );
    const differentObject = nonEmpty.filter(
      ([objectId]) => objectId !== lastObjectId,
    );
    const candidates = differentObject.length > 0 ? differentObject : nonEmpty;

    if (candidates.length === 0) break;

    const largestQueueSize = Math.max(
      ...candidates.map(([, queue]) => queue.length),
    );
    const largestQueues = candidates.filter(
      ([, queue]) => queue.length === largestQueueSize,
    );
    const [objectId, queue] = shuffle(largestQueues)[0];
    const nextTask = queue.shift();

    if (!nextTask) break;

    result.push(nextTask);
    lastObjectId = objectId;
  }

  return result;
}

interface Yonerge14Props {
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

type Phase = "prep" | "running" | "result";

export default function Yonerge14({
  itemCode = "YTB 4.3",
  itemText = "Belirli Birkaç Hareketi İlişkili Nesne ile Gösterme",
  onClose,
  onComplete,
}: Yonerge14Props) {
  const [selectedObjectIds, setSelectedObjectIds] = useState<ObjectId[]>([]);
  const [sessionTasks, setSessionTasks] = useState<RelatedActionTask[]>([]);
  const [phase, setPhase] = useState<Phase>("prep");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);

  const displayItemCode = itemCode.trim() === "YTB" ? "YTB 4.3" : itemCode;
  const displayItemText = itemText.replace(/^4\.3\.\s*/, "");

  const selectedObjects = useMemo(
    () => OBJECT_GROUPS.filter((group) => selectedObjectIds.includes(group.id)),
    [selectedObjectIds],
  );

  const selectedTasks = useMemo(
    () => selectedObjects.flatMap((group) => group.tasks),
    [selectedObjects],
  );

  const preparedTasks = useMemo(
    () => createMixedTaskOrder(selectedTasks).slice(0, TRIAL_COUNT),
    [selectedTasks],
  );

  const materialsList = useMemo(() => {
    const materials = new Set<string>();
    preparedTasks.forEach((task) =>
      task.materials.forEach((material) => materials.add(material)),
    );
    return Array.from(materials);
  }, [preparedTasks]);

  const canStart = selectedObjectIds.length >= MIN_SELECTED_OBJECTS;

  const toggleObject = (objectId: ObjectId) => {
    setSelectedObjectIds((previous) =>
      previous.includes(objectId)
        ? previous.filter((id) => id !== objectId)
        : [...previous, objectId],
    );
  };

  const startAssessment = () => {
    if (!canStart) return;
    setSessionTasks(preparedTasks);
    setCurrentIndex(0);
    setScore(0);
    setLocked(false);
    setPhase("running");
  };

  const passScore = PASS_SCORE;

  const handleAssess = (correct: boolean) => {
    if (locked) return;
    setLocked(true);

    const nextScore = score + (correct ? 1 : 0);
    const nextIndex = currentIndex + 1;
    setScore(nextScore);

    window.setTimeout(() => {
      if (nextIndex >= sessionTasks.length) {
        setPhase("result");
        if (nextScore >= passScore) {
          confetti({ particleCount: 250, spread: 90, origin: { y: 0.6 } });
        }
        return;
      }

      setCurrentIndex(nextIndex);
      setLocked(false);
    }, 350);
  };

  const currentTask = sessionTasks[currentIndex];
  const currentObjectName = currentTask
    ? OBJECT_WARNING_NAMES[currentTask.objectId]
    : "hedef nesneyi";
  const success = sessionTasks.length > 0 && score >= passScore;
  const successRate =
    sessionTasks.length > 0
      ? Math.round((score / sessionTasks.length) * 100)
      : 0;

  return (
    <div
      className="fixed inset-0 h-[100dvh] w-screen z-[100] flex flex-col bg-slate-950 text-white font-sans select-none"
      style={{ touchAction: "none" }}
    >
      <div className="shrink-0 p-4 landscape:py-2 landscape:px-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur-md relative z-10">
        <button
          type="button"
          onClick={onClose}
          className="p-2 landscape:p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          aria-label="Değerlendirmeyi kapat"
        >
          <XCircle className="w-7 h-7 landscape:w-6 landscape:h-6" />
        </button>

        <div className="text-center flex flex-col items-center px-2 min-w-0">
          <h2 className="text-sm sm:text-lg landscape:text-sm font-bold truncate max-w-[280px] sm:max-w-md text-slate-100">
            {displayItemCode} — {displayItemText}
          </h2>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-1">
            {phase === "prep" && "HAZIRLIK"}
            {phase === "running" &&
              `DEĞERLENDİRME · ${currentIndex + 1} / ${sessionTasks.length}`}
            {phase === "result" && "SONUÇ"}
          </p>
        </div>

        <div className="w-10 landscape:w-8" />
      </div>

      <div
        className="flex-1 relative flex flex-col items-center justify-center p-3 sm:p-4 overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950"
        style={{ touchAction: "none" }}
      >
        {phase === "prep" && (
          <div
            className="w-full max-w-3xl animate-in zoom-in-95 duration-300 pb-6 space-y-5 overflow-y-auto max-h-full"
            style={{ touchAction: "pan-y" }}
          >
            <div className="text-center">
              <PackageCheck
                size={44}
                className="mx-auto text-teal-500 mb-3 drop-shadow-[0_0_12px_rgba(20,184,166,0.4)]"
              />
              <h1 className="text-2xl font-black mb-2">
                Değerlendirilecek Nesneleri Seç
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed px-2">
                En az{" "}
                <span className="text-teal-300 font-semibold">üç nesne</span>{" "}
                seçin ve gerçek nesneleri öğrencinin ulaşabileceği şekilde
                hazırlayın. Uygulama seçilen nesnelerden karışık sırayla 10
                yönerge oluşturur.
              </p>
            </div>

            <div className="rounded-2xl border border-teal-500/25 bg-teal-500/5 p-4">
              <div className="mb-3 flex items-center gap-2 text-teal-200">
                <EyeOff size={19} />
                <h2 className="text-sm font-black uppercase tracking-wider">Öğretmen ipuçları</h2>
              </div>
              <div className="space-y-2 text-sm leading-relaxed text-slate-300">
                <p><span className="font-bold text-white">1.</span> Ekrandaki yönergeyi öğrenciye yalnızca bir kez, doğal bir ses tonuyla söyleyin.</p>
                <p><span className="font-bold text-white">2.</span> Hedef nesneye bakmayın; nesneyi göstermeyin, işaret etmeyin veya öğrencinin elini yönlendirmeyin.</p>
                <p><span className="font-bold text-white">3.</span> Öğrencinin 3–5 saniye içinde doğru nesneyi seçip hareketi bağımsız yapmasını bekleyin.</p>
                <p><span className="font-bold text-white">4.</span> Yardımla yapılan, yanlış nesneyle yapılan veya tepkisiz kalınan denemeyi “Yapamadı” olarak işaretleyin.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {OBJECT_GROUPS.map((group) => {
                const isSelected = selectedObjectIds.includes(group.id);
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => toggleObject(group.id)}
                    aria-pressed={isSelected}
                    className={`relative p-3 rounded-2xl border text-center transition-all active:scale-[0.98] ${
                      isSelected
                        ? "bg-teal-500/15 border-teal-500/70 shadow-[0_0_20px_rgba(20,184,166,0.12)]"
                        : "bg-slate-900/70 border-slate-700 hover:border-slate-500 hover:bg-slate-800/80"
                    }`}
                  >
                    <span
                      className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? "bg-teal-500 border-teal-400 text-slate-950"
                          : "bg-slate-950/80 border-slate-600 text-transparent"
                      }`}
                    >
                      <Check size={17} />
                    </span>
                    <div className="aspect-square w-full rounded-xl border border-slate-700/80 bg-slate-950/70 p-2 overflow-hidden">
                      <img
                        src={group.image}
                        alt={group.label}
                        className="w-full h-full object-contain"
                        draggable={false}
                      />
                    </div>
                    <p className="font-bold text-sm sm:text-base text-slate-100 mt-2">
                      {group.label}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
              <p className="text-sm font-semibold text-slate-200">
                {selectedObjectIds.length} nesne seçildi
                {canStart &&
                  ` · Değerlendirmede ${TRIAL_COUNT} yönerge sorulacak`}
              </p>
              {!canStart && (
                <p className="text-xs text-amber-400 mt-1">
                  Başlamak için en az {MIN_SELECTED_OBJECTS} nesne seçin.
                </p>
              )}
            </div>

            {materialsList.length > 0 && (
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                <div className="flex items-center gap-2 mb-2 text-slate-300">
                  <Box size={16} className="text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Hazır bulundurulacak malzemeler
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {materialsList.map((material) => (
                    <span
                      key={material}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs font-medium"
                    >
                      {material}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={startAssessment}
              disabled={!canStart}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white px-6 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-teal-900/40 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <PlayCircle size={22} /> Değerlendirmeyi Başlat
            </button>
          </div>
        )}

        {phase === "running" && currentTask && (
          <div className="w-full max-w-3xl flex flex-col items-center animate-in slide-in-from-right-6 duration-300">
            <div className="w-full bg-slate-800/60 border-2 border-slate-700 rounded-[2rem] p-5 md:p-10 flex flex-col items-center shadow-2xl mb-4 min-h-[200px] justify-center">
              <span className="text-xs font-bold tracking-widest uppercase mb-3 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Öğrenciye söyleyin
              </span>
              <h1 className="text-3xl md:text-5xl font-black text-center text-white leading-tight">
                “{currentTask.text}.”
              </h1>
              <div className="mt-6 w-full max-w-2xl rounded-2xl border-2 border-amber-500/50 bg-amber-500/10 px-4 py-4 text-center shadow-[0_0_20px_rgba(245,158,11,0.08)]">
                <div className="mb-1 flex items-center justify-center gap-2 text-amber-300">
                  <AlertTriangle size={22} />
                  <span className="text-base font-black uppercase">İpucu vermeyin</span>
                </div>
                <p className="text-base font-bold leading-relaxed text-amber-100 sm:text-lg">
                  Öğrenciye {currentObjectName} göstermeyin veya işaret etmeyin;
                  bakışınızla ya da elinizle yönlendirmeyin.
                </p>
              </div>
              <p className="text-slate-500 text-sm mt-4 text-center max-w-lg">
                Öğrenci 3–5 saniye içinde doğru nesneyi seçip hareketi bağımsız
                yaparsa <span className="text-green-400">Yaptı</span>, yanlış
                nesneyi seçer, tepki vermez veya yardımla yaparsa{" "}
                <span className="text-red-400">Yapamadı</span>.
              </p>
            </div>
          </div>
        )}

        {phase === "result" && (
          <div className="flex flex-col items-center text-center p-8 bg-slate-900/90 rounded-3xl border border-slate-700 shadow-2xl max-w-xl animate-in zoom-in-95 duration-500">
            <Trophy
              size={72}
              className={
                success
                  ? "text-yellow-500 mb-5 animate-bounce drop-shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                  : "text-slate-500 mb-5"
              }
            />
            <h1 className="text-3xl font-black mb-2">Değerlendirme Bitti!</h1>
            <p className="text-slate-400 mb-2 text-lg">
              Doğru:{" "}
              <span className="text-white font-black text-3xl mx-2">
                {score}
              </span>{" "}
              / {sessionTasks.length}
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Başarı: %{successRate} · Geçme ölçütü: {passScore}/
              {sessionTasks.length}
            </p>
            {success ? (
              <div className="bg-green-500/10 text-green-400 border border-green-500/20 px-6 py-3 rounded-xl mb-8 font-bold flex items-center gap-2">
                <Check size={22} /> Kazanım başarıyla sağlandı!
              </div>
            ) : (
              <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-6 py-3 rounded-xl mb-8 font-bold flex items-center gap-2">
                <X size={22} /> Henüz yeterli bağımsızlık düzeyinde değil.
              </div>
            )}
            <button
              type="button"
              onClick={() => onComplete(success)}
              className="bg-teal-600 hover:bg-teal-500 text-white px-12 py-4 rounded-xl font-bold text-xl active:scale-95 shadow-xl shadow-teal-900/50 w-full sm:w-auto"
            >
              KAYDET VE ÇIK
            </button>
          </div>
        )}
      </div>

      {phase === "running" && (
        <div className="shrink-0 p-5 pb-8 landscape:py-3 landscape:pb-4 bg-slate-900 border-t border-slate-800 flex items-stretch justify-center gap-3 relative z-10">
          <button
            type="button"
            onClick={() => handleAssess(false)}
            disabled={locked}
            className="flex-1 max-w-[260px] flex flex-col landscape:flex-row items-center justify-center gap-2 p-4 landscape:p-3 bg-red-500/10 border border-red-500/30 rounded-2xl active:scale-95 transition-all text-red-500 hover:bg-red-500/20 disabled:opacity-40"
          >
            <X className="w-9 h-9 landscape:w-6 landscape:h-6" />
            <span className="text-sm font-bold uppercase tracking-wider">
              Yapamadı
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleAssess(true)}
            disabled={locked}
            className="flex-1 max-w-[260px] flex flex-col landscape:flex-row items-center justify-center gap-2 p-4 landscape:p-3 bg-green-500/10 border border-green-500/30 rounded-2xl active:scale-95 transition-all text-green-500 hover:bg-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)] disabled:opacity-40"
          >
            <Check className="w-9 h-9 landscape:w-6 landscape:h-6" />
            <span className="text-sm font-bold uppercase tracking-wider">
              Yaptı
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
