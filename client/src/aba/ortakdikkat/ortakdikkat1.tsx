import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  Image as ImageIcon,
  PackageOpen,
  PlayCircle,
  Puzzle,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import confetti from "canvas-confetti";

type ConditionId = "materyalsiz" | "gorselli" | "mesgul";
type Phase = "intro" | "condition" | "trial" | "wait" | "result";

interface Condition {
  id: ConditionId;
  title: string;
  shortTitle: string;
  description: string;
  preparation: string[];
  material: string;
  color: string;
  icon: typeof PackageOpen;
}

interface Trial {
  id: number;
  conditionId: ConditionId;
  conditionTrial: number;
}

interface TrialResult extends Trial {
  looked: boolean;
}

interface OrtakDikkat1Props {
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

const CONDITIONS: Condition[] = [
  {
    id: "materyalsiz",
    title: "Materyalsiz ortam",
    shortTitle: "Materyalsiz",
    description:
      "Öğrencinin önünde dikkatini yönelteceği bir nesne, resim veya etkinlik materyali bulunmaz.",
    preparation: [
      "Masa ve öğrencinin görüş alanını mümkün olduğunca sade tutun.",
      "Öğrencinin yanında veya hafif çaprazında konumlanın.",
      "Doğal bir anda yalnızca bir kez “Bana bak” deyin.",
    ],
    material: "Malzeme gerekmiyor",
    color: "text-sky-300 border-sky-500/30 bg-sky-500/10",
    icon: PackageOpen,
  },
  {
    id: "gorselli",
    title: "Nesne veya resim varken",
    shortTitle: "Nesne/resim",
    description:
      "Öğrencinin önünde dikkatini çekebilecek bir nesne ya da resim bulunur.",
    preparation: [
      "Öğrencinin önüne tek bir nesne veya resim yerleştirin.",
      "Nesneyi kaldırmadan ve işaret etmeden uygun anı bekleyin.",
      "Doğal bir ses tonuyla yalnızca bir kez “Bana bak” deyin.",
    ],
    material: "Bir nesne veya resim",
    color: "text-violet-300 border-violet-500/30 bg-violet-500/10",
    icon: ImageIcon,
  },
  {
    id: "mesgul",
    title: "Etkinlikle meşgulken",
    shortTitle: "Meşgulken",
    description:
      "Öğrenci sevdiği basit bir etkinlikle doğal biçimde meşgul olur.",
    preparation: [
      "Öğrenciyi sevdiği kısa ve basit bir etkinlikle meşgul edin.",
      "Etkinliği aniden kesmeden doğal bir an yakalayın.",
      "Yalnızca bir kez “Bana bak” deyip bağımsız tepkisini gözleyin.",
    ],
    material: "Sevdiği bir etkinlik materyali",
    color: "text-amber-300 border-amber-500/30 bg-amber-500/10",
    icon: Puzzle,
  },
];

const TRIALS_PER_CONDITION = 4;
const TOTAL_TRIALS = CONDITIONS.length * TRIALS_PER_CONDITION;
const PASS_SCORE = 10;
const WAIT_SECONDS = 120;

const TRIALS: Trial[] = CONDITIONS.flatMap((condition) =>
  Array.from({ length: TRIALS_PER_CONDITION }, (_, index) => ({
    id:
      CONDITIONS.findIndex((item) => item.id === condition.id) *
        TRIALS_PER_CONDITION +
      index +
      1,
    conditionId: condition.id,
    conditionTrial: index + 1,
  })),
);

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export default function OrtakDikkat1({
  itemCode = "OD 1.1",
  itemText = "“Bana Bak” Yönergesine Tepkide Bulunma",
  onClose,
  onComplete,
}: OrtakDikkat1Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [locked, setLocked] = useState(false);
  const [waitRemaining, setWaitRemaining] = useState(WAIT_SECONDS);
  const [waitEndsAt, setWaitEndsAt] = useState<number | null>(null);

  const displayItemCode = itemCode.trim() === "OD" ? "OD 1.1" : itemCode;
  const displayItemText = itemText.replace(/^1\.1\.\s*/, "");
  const currentTrial = TRIALS[currentIndex];
  const currentCondition = CONDITIONS.find(
    (condition) => condition.id === currentTrial?.conditionId,
  )!;
  const nextTrial = TRIALS[currentIndex + 1];
  const nextCondition = nextTrial
    ? CONDITIONS.find((condition) => condition.id === nextTrial.conditionId)
    : null;

  useEffect(() => {
    if (phase !== "wait" || waitEndsAt === null) return;

    const updateRemaining = () => {
      const remaining = Math.max(
        0,
        Math.ceil((waitEndsAt - Date.now()) / 1000),
      );
      setWaitRemaining(remaining);
    };

    updateRemaining();
    const timer = window.setInterval(updateRemaining, 250);
    return () => window.clearInterval(timer);
  }, [phase, waitEndsAt]);

  const score = results.filter((result) => result.looked).length;
  const success = results.length === TOTAL_TRIALS && score >= PASS_SCORE;

  const conditionScores = useMemo(
    () =>
      CONDITIONS.map((condition) => ({
        ...condition,
        correct: results.filter(
          (result) => result.conditionId === condition.id && result.looked,
        ).length,
      })),
    [results],
  );

  const startAssessment = () => {
    setResults([]);
    setCurrentIndex(0);
    setLocked(false);
    setPhase("condition");
  };

  const handleAssessment = (looked: boolean) => {
    if (locked || !currentTrial) return;
    setLocked(true);

    const updatedResults = [...results, { ...currentTrial, looked }];
    setResults(updatedResults);

    if (currentIndex === TOTAL_TRIALS - 1) {
      const finalScore = updatedResults.filter(
        (result) => result.looked,
      ).length;
      setPhase("result");
      if (finalScore >= PASS_SCORE) {
        confetti({ particleCount: 220, spread: 85, origin: { y: 0.62 } });
      }
      setLocked(false);
      return;
    }

    const endsAt = Date.now() + WAIT_SECONDS * 1000;
    setWaitEndsAt(endsAt);
    setWaitRemaining(WAIT_SECONDS);
    setPhase("wait");
    setLocked(false);
  };

  const continueAfterWait = () => {
    if (waitRemaining > 0 || !nextTrial) return;

    const conditionChanged = nextTrial.conditionId !== currentTrial.conditionId;
    setCurrentIndex((index) => index + 1);
    setWaitEndsAt(null);
    setWaitRemaining(WAIT_SECONDS);
    setPhase(conditionChanged ? "condition" : "trial");
  };

  return (
    <div className="fixed inset-0 z-[100] flex h-[100dvh] w-screen select-none flex-col bg-slate-950 font-sans text-white">
      <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md landscape:px-4 landscape:py-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white landscape:p-1.5"
          aria-label="Değerlendirmeyi kapat"
        >
          <XCircle className="h-7 w-7 landscape:h-6 landscape:w-6" />
        </button>

        <div className="flex min-w-0 flex-col items-center px-2 text-center">
          <h2 className="max-w-[280px] truncate text-sm font-bold text-slate-100 sm:max-w-md sm:text-lg landscape:text-sm">
            {displayItemCode} — {displayItemText}
          </h2>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-widest text-slate-400">
            {phase === "intro" && "HAZIRLIK"}
            {phase === "condition" &&
              `${currentCondition.shortTitle} · BİLGİLENDİRME`}
            {phase === "trial" &&
              `DENEME ${currentIndex + 1} / ${TOTAL_TRIALS}`}
            {phase === "wait" && "BEKLEME SÜRESİ"}
            {phase === "result" && "SONUÇ"}
          </p>
        </div>

        <div className="w-10 landscape:w-8" />
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950 p-3 sm:p-4">
        {phase === "intro" && (
          <div className="max-h-full w-full max-w-3xl space-y-5 overflow-y-auto pb-6 animate-in zoom-in-95 duration-300">
            <div className="text-center">
              <Eye className="mx-auto mb-3 h-12 w-12 text-cyan-400 drop-shadow-[0_0_14px_rgba(34,211,238,0.35)]" />
              <h1 className="mb-2 text-2xl font-black">
                “Bana Bak” Değerlendirmesi
              </h1>
              <p className="mx-auto max-w-2xl px-2 text-sm leading-relaxed text-slate-400">
                Üç farklı koşulda dörder olmak üzere toplam 12 deneme yapılır.
                Öğrenci 3–5 saniye içinde bağımsız olarak öğretmenin yüzüne
                yönelirse{" "}
                <span className="font-semibold text-green-400">Baktı</span>{" "}
                olarak işaretlenir.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {CONDITIONS.map((condition, index) => {
                const Icon = condition.icon;
                return (
                  <div
                    key={condition.id}
                    className={`rounded-2xl border p-4 ${condition.color}`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <Icon className="h-7 w-7" />
                      <span className="text-xs font-black">
                        {index + 1}. KOŞUL
                      </span>
                    </div>
                    <h3 className="mb-1 font-bold text-slate-100">
                      {condition.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-slate-400">
                      {condition.description}
                    </p>
                    <p className="mt-3 text-[11px] font-semibold text-slate-300">
                      4 deneme
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                Değerlendirme ölçütü
              </h3>
              <div className="space-y-2 text-sm leading-relaxed text-slate-400">
                <p>• Yönergeyi doğal bir ses tonuyla yalnızca bir kez verin.</p>
                <p>
                  • Tekrar, işaret veya fiziksel yardımla bakarsa “Bakmadı”
                  olarak işaretleyin.
                </p>
                <p>• Öğrencinin yüzünü tutarak kendinize çevirmeyin.</p>
                <p>• Başarı ölçütü en az 10/12 doğru tepkidir.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={startAssessment}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-6 py-4 text-base font-bold text-white shadow-xl shadow-cyan-900/40 transition-all hover:bg-cyan-500 active:scale-95"
            >
              <PlayCircle size={22} /> Değerlendirmeyi Başlat
            </button>
          </div>
        )}

        {phase === "condition" && currentCondition && (
          <div className="max-h-full w-full max-w-2xl space-y-5 overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900/85 p-5 shadow-2xl animate-in slide-in-from-right-6 duration-300 sm:p-7">
            {(() => {
              const Icon = currentCondition.icon;
              return (
                <div className="text-center">
                  <Icon className="mx-auto mb-3 h-12 w-12 text-cyan-400" />
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest text-cyan-300">
                    {CONDITIONS.findIndex(
                      (item) => item.id === currentCondition.id,
                    ) + 1}
                    . koşul
                  </p>
                  <h1 className="text-2xl font-black">
                    {currentCondition.title}
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {currentCondition.description}
                  </p>
                </div>
              );
            })()}

            <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-300">
                Ortamı hazırlayın
              </h3>
              <div className="space-y-3">
                {currentCondition.preparation.map((step, index) => (
                  <div
                    key={step}
                    className="flex items-start gap-3 text-sm text-slate-300"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-bold text-cyan-300">
                      {index + 1}
                    </span>
                    <p className="pt-0.5 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
              <PackageOpen className="h-5 w-5 shrink-0" />
              <span>{currentCondition.material}</span>
            </div>

            <button
              type="button"
              onClick={() => setPhase("trial")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-6 py-4 font-bold text-white transition-all hover:bg-cyan-500 active:scale-95"
            >
              <CheckCircle2 size={21} /> Ortam Hazır, Başla
            </button>
          </div>
        )}

        {phase === "trial" && currentTrial && currentCondition && (
          <div className="flex w-full max-w-3xl flex-col items-center animate-in slide-in-from-right-6 duration-300">
            <div className="mb-4 flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  {currentCondition.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Bu koşulda {currentTrial.conditionTrial}/
                  {TRIALS_PER_CONDITION}. deneme
                </p>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
                {currentIndex + 1}/{TOTAL_TRIALS}
              </span>
            </div>

            <div className="mb-4 flex min-h-[230px] w-full flex-col items-center justify-center rounded-[2rem] border-2 border-slate-700 bg-slate-800/60 p-6 shadow-2xl md:p-10">
              <span className="mb-4 rounded-full border border-cyan-500/30 bg-cyan-500/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-cyan-300">
                Öğrenciye bir kez söyleyin
              </span>
              <h1 className="text-center text-4xl font-black leading-tight text-white md:text-6xl">
                “Bana bak.”
              </h1>
              <p className="mt-5 max-w-lg text-center text-sm leading-relaxed text-slate-400">
                3–5 saniye içinde bağımsız olarak yüzünüze yönelmesini bekleyin,
                ardından gözleminizi işaretleyin.
              </p>
            </div>
          </div>
        )}

        {phase === "wait" && (
          <div className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900/90 p-6 text-center shadow-2xl animate-in zoom-in-95 duration-300 sm:p-8">
            <Clock3 className="mx-auto mb-4 h-14 w-14 text-amber-400" />
            <h1 className="text-2xl font-black">
              Bir sonraki denemeyi bekleyin
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">
              Bu süre içinde tekrar “Bana bak” yönergesi vermeyin. Yönergenin
              sıradanlaşmaması için en az 2 dakika bekleyin.
            </p>

            <div
              className="mx-auto my-6 flex h-40 w-40 items-center justify-center rounded-full p-2"
              style={{
                background: `conic-gradient(rgb(34 211 238) ${(waitRemaining / WAIT_SECONDS) * 360}deg, rgb(30 41 59) 0deg)`,
              }}
            >
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-slate-950">
                <span className="font-mono text-4xl font-black text-white">
                  {formatTime(waitRemaining)}
                </span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  kalan süre
                </span>
              </div>
            </div>

            {waitRemaining > 0 ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm font-semibold text-amber-300">
                Sayaç tamamlanınca sonraki denemeye geçebilirsiniz.
              </div>
            ) : (
              <button
                type="button"
                onClick={continueAfterWait}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-6 py-4 font-bold text-white transition-all hover:bg-cyan-500 active:scale-95"
              >
                <PlayCircle size={21} />
                {nextCondition?.id !== currentCondition.id
                  ? "Sonraki Koşulu Hazırla"
                  : "Sonraki Denemeye Geç"}
              </button>
            )}
          </div>
        )}

        {phase === "result" && (
          <div className="max-h-full w-full max-w-2xl space-y-5 overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900/90 p-6 text-center shadow-2xl animate-in zoom-in-95 duration-500 sm:p-8">
            <Trophy
              className={`mx-auto h-16 w-16 ${success ? "text-yellow-400" : "text-slate-500"}`}
            />
            <div>
              <h1 className="text-3xl font-black">Değerlendirme Bitti</h1>
              <p className="mt-2 text-slate-400">
                Doğru tepki:{" "}
                <span className="text-3xl font-black text-white">{score}</span>/
                {TOTAL_TRIALS}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Geçme ölçütü: {PASS_SCORE}/{TOTAL_TRIALS}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {conditionScores.map((condition) => {
                const Icon = condition.icon;
                return (
                  <div
                    key={condition.id}
                    className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4 text-left"
                  >
                    <Icon className="mb-3 h-6 w-6 text-cyan-400" />
                    <p className="text-xs font-bold text-slate-300">
                      {condition.shortTitle}
                    </p>
                    <p className="mt-1 text-xl font-black text-white">
                      {condition.correct}/{TRIALS_PER_CONDITION}
                    </p>
                  </div>
                );
              })}
            </div>

            {success ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-5 py-3 font-bold text-green-400">
                <Check size={22} /> Kazanım başarıyla sağlandı!
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 px-5 py-3 font-bold text-orange-400">
                <X size={22} /> Henüz yeterli bağımsızlık düzeyinde değil.
              </div>
            )}

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

      {phase === "trial" && (
        <footer className="relative z-10 flex shrink-0 items-stretch justify-center gap-3 border-t border-slate-800 bg-slate-900 p-5 pb-8 landscape:py-3 landscape:pb-4">
          <button
            type="button"
            onClick={() => handleAssessment(false)}
            disabled={locked}
            className="flex flex-1 max-w-[280px] flex-col items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-500 transition-all hover:bg-red-500/20 active:scale-95 disabled:opacity-40 landscape:flex-row landscape:p-3"
          >
            <X className="h-9 w-9 landscape:h-6 landscape:w-6" />
            <span className="text-sm font-bold uppercase tracking-wider">
              Bakmadı
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleAssessment(true)}
            disabled={locked}
            className="flex flex-1 max-w-[280px] flex-col items-center justify-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.1)] transition-all hover:bg-green-500/20 active:scale-95 disabled:opacity-40 landscape:flex-row landscape:p-3"
          >
            <Eye className="h-9 w-9 landscape:h-6 landscape:w-6" />
            <span className="text-sm font-bold uppercase tracking-wider">
              Baktı
            </span>
          </button>
        </footer>
      )}
    </div>
  );
}
