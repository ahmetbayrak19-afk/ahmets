import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  AlertTriangle,
  Check,
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
import etkinlikleMesgulGorsel from "./ortakdikkatsesgorsel/etkinliklemesgul.jpg";
import materyalsizGorsel from "./ortakdikkatsesgorsel/materyalsiz.jpg";
import materyalVeResimGorsel from "./ortakdikkatsesgorsel/materyalveresim.jpg";

type ConditionId = "materyalsiz" | "materyalli" | "mesgul";
type Phase = "intro" | "assessment" | "result";

interface TrialResult {
  id: number;
  conditionId: ConditionId;
  looked: boolean;
  timestamp: number;
}

interface ConditionCard {
  id: ConditionId;
  title: string;
  description: string;
  instruction: string;
  image: string;
  icon: typeof PackageOpen;
  color: string;
}

interface OrtakDikkat1Props {
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

const CONDITIONS: ConditionCard[] = [
  {
    id: "materyalsiz",
    title: "Materyalsiz",
    description:
      "Öğrencinin önünde dikkatini çeken herhangi bir nesne bulunmaz.",
    instruction:
      "Önünde nesne yokken doğal bir anda yalnızca bir kez “Bana bak” deyin.",
    image: materyalsizGorsel,
    icon: PackageOpen,
    color: "border-sky-500/35 bg-sky-500/10 text-sky-300",
  },
  {
    id: "materyalli",
    title: "Nesne veya resim varken",
    description:
      "Öğrencinin önünde dikkatini çekebilecek bir nesne ya da resim bulunur.",
    instruction:
      "Önüne bir nesne ya da resim koyup uygun anda yalnızca bir kez “Bana bak” deyin.",
    image: materyalVeResimGorsel,
    icon: ImageIcon,
    color: "border-violet-500/35 bg-violet-500/10 text-violet-300",
  },
  {
    id: "mesgul",
    title: "Etkinlikle meşgulken",
    description:
      "Öğrenci sevdiği bir oyun veya etkinlikle ilgilenirken değerlendirilir.",
    instruction:
      "Sevdiği etkinlikle uğraşırken doğal bir anda yalnızca bir kez “Bana bak” deyin.",
    image: etkinlikleMesgulGorsel,
    icon: Puzzle,
    color: "border-amber-500/35 bg-amber-500/10 text-amber-300",
  },
];

const INTRO_SLIDE_DURATION_MS = 2500;
const INTRO_SWIPE_THRESHOLD_PX = 40;
const TRIALS_PER_CONDITION = 4;
const TOTAL_TRIALS = 12;
const PASS_SCORE = 10;
const SHORT_INTERVAL_MS = 2 * 60 * 1000;

export default function OrtakDikkat1({
  itemCode = "OD 1.1",
  itemText = "“Bana Bak” Yönergesine Tepkide Bulunma",
  onClose,
  onComplete,
}: OrtakDikkat1Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [results, setResults] = useState<TrialResult[]>([]);
  const [lastMarkedAt, setLastMarkedAt] = useState<number | null>(null);
  const [warningOpen, setWarningOpen] = useState(false);
  const [showResultAfterWarning, setShowResultAfterWarning] = useState(false);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [introSlide, setIntroSlide] = useState(0);
  const [introAutoPlay, setIntroAutoPlay] = useState(true);
  const [introDragOffset, setIntroDragOffset] = useState(0);
  const introDragStartX = useRef<number | null>(null);
  const introDragCurrentX = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== "intro" || !introAutoPlay) return;

    const timer = window.setTimeout(() => {
      setIntroSlide((current) => (current + 1) % CONDITIONS.length);
    }, INTRO_SLIDE_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [phase, introSlide, introAutoPlay]);

  const displayItemCode = itemCode.trim() === "OD" ? "OD 1.1" : itemCode;
  const displayItemText = itemText.replace(/^1\.1\.\s*/, "");

  const counts = useMemo(
    () =>
      CONDITIONS.reduce(
        (accumulator, condition) => {
          accumulator[condition.id] = results.filter(
            (result) => result.conditionId === condition.id,
          ).length;
          return accumulator;
        },
        {} as Record<ConditionId, number>,
      ),
    [results],
  );

  const correctCounts = useMemo(
    () =>
      CONDITIONS.reduce(
        (accumulator, condition) => {
          accumulator[condition.id] = results.filter(
            (result) => result.conditionId === condition.id && result.looked,
          ).length;
          return accumulator;
        },
        {} as Record<ConditionId, number>,
      ),
    [results],
  );

  const score = results.filter((result) => result.looked).length;
  const success = results.length === TOTAL_TRIALS && score >= PASS_SCORE;

  const startAssessment = () => {
    setResults([]);
    setLastMarkedAt(null);
    setWarningOpen(false);
    setShowResultAfterWarning(false);
    setLocked(false);
    setFeedback(null);
    setPhase("assessment");
  };

  const finishAssessment = (finalScore: number) => {
    setPhase("result");
    setLocked(false);
    if (finalScore >= PASS_SCORE) {
      confetti({ particleCount: 220, spread: 85, origin: { y: 0.62 } });
    }
  };

  const handleAssessment = (conditionId: ConditionId, looked: boolean) => {
    if (locked || counts[conditionId] >= TRIALS_PER_CONDITION) return;
    setLocked(true);

    const now = Date.now();
    const isShortInterval =
      lastMarkedAt !== null && now - lastMarkedAt < SHORT_INTERVAL_MS;
    const updatedResults = [
      ...results,
      {
        id: results.length + 1,
        conditionId,
        looked,
        timestamp: now,
      },
    ];
    const finalScore = updatedResults.filter((result) => result.looked).length;
    const completed = updatedResults.length === TOTAL_TRIALS;
    const conditionTitle = CONDITIONS.find(
      (condition) => condition.id === conditionId,
    )!.title;

    setResults(updatedResults);
    setLastMarkedAt(now);
    setFeedback(
      `${conditionTitle} · ${looked ? "Baktı" : "Bakmadı"} kaydedildi`,
    );
    window.setTimeout(() => setFeedback(null), 1600);

    if (isShortInterval) {
      setShowResultAfterWarning(completed);
      setWarningOpen(true);
      return;
    }

    if (completed) {
      finishAssessment(finalScore);
      return;
    }

    window.setTimeout(() => setLocked(false), 400);
  };

  const acknowledgeWarning = () => {
    setWarningOpen(false);
    if (showResultAfterWarning) {
      finishAssessment(score);
      setShowResultAfterWarning(false);
      return;
    }
    setLocked(false);
  };

  const selectIntroSlide = (index: number) => {
    setIntroAutoPlay(false);
    setIntroSlide(index);
    setIntroDragOffset(0);
  };

  const handleIntroPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    introDragStartX.current = event.clientX;
    introDragCurrentX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleIntroPointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (introDragStartX.current === null) return;
    introDragCurrentX.current = event.clientX;
    setIntroDragOffset(event.clientX - introDragStartX.current);
  };

  const finishIntroSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (introDragStartX.current === null) return;

    const currentX = introDragCurrentX.current ?? event.clientX;
    const difference = currentX - introDragStartX.current;

    if (Math.abs(difference) >= INTRO_SWIPE_THRESHOLD_PX) {
      setIntroAutoPlay(false);
      setIntroSlide((current) =>
        difference < 0
          ? (current + 1) % CONDITIONS.length
          : (current - 1 + CONDITIONS.length) % CONDITIONS.length,
      );
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    introDragStartX.current = null;
    introDragCurrentX.current = null;
    setIntroDragOffset(0);
  };

  const cancelIntroSwipe = () => {
    introDragStartX.current = null;
    introDragCurrentX.current = null;
    setIntroDragOffset(0);
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
            {phase === "assessment" &&
              `DEĞERLENDİRME · ${results.length} / ${TOTAL_TRIALS}`}
            {phase === "result" && "SONUÇ"}
          </p>
        </div>

        <div className="w-10 landscape:w-8" />
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950 p-3 sm:p-4">
        {phase === "intro" && (
          <div className="max-h-full w-full max-w-3xl space-y-4 overflow-y-auto pb-5 animate-in zoom-in-95 duration-300">
            <div className="text-center">
              <Eye className="mx-auto mb-2 h-11 w-11 text-cyan-400" />
              <h1 className="mb-2 text-2xl font-black">
                “Bana Bak” Değerlendirmesi
              </h1>
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-400">
                Üç farklı durumda dörder olmak üzere toplam 12 doğal fırsatı
                değerlendirin.
              </p>
            </div>

            <div>
              <div
                className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-900/80 shadow-2xl shadow-black/20"
                style={{ touchAction: "pan-y" }}
                onPointerDown={handleIntroPointerDown}
                onPointerMove={handleIntroPointerMove}
                onPointerUp={finishIntroSwipe}
                onPointerCancel={cancelIntroSwipe}
              >
                <div
                  className={`flex ${introDragOffset === 0 ? "transition-transform duration-500 ease-out" : ""}`}
                  style={{
                    transform: `translateX(calc(-${introSlide * 100}% + ${introDragOffset}px))`,
                  }}
                >
                  {CONDITIONS.map((condition) => {
                    const Icon = condition.icon;
                    return (
                      <article
                        key={condition.id}
                        className="w-full shrink-0"
                        aria-hidden={CONDITIONS[introSlide].id !== condition.id}
                      >
                        <div className="flex h-52 items-center justify-center bg-slate-950/55 p-2 sm:h-72">
                          <img
                            src={condition.image}
                            alt={condition.title}
                            className="h-full w-full rounded-2xl object-contain"
                            draggable={false}
                          />
                        </div>
                        <div className="flex items-start gap-3 border-t border-slate-700/70 px-4 py-3 sm:px-5">
                          <span
                            className={`mt-0.5 shrink-0 rounded-xl border p-2 ${condition.color}`}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-100">
                              {condition.title}
                            </h3>
                            <p className="mt-0.5 text-xs leading-relaxed text-slate-400 sm:text-sm">
                              {condition.description}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div
                className="mt-3 flex items-center justify-center gap-2"
                aria-label="Hazırlık görselleri"
              >
                {CONDITIONS.map((condition, index) => (
                  <button
                    key={condition.id}
                    type="button"
                    onClick={() => selectIntroSlide(index)}
                    className={`h-2.5 rounded-full transition-all ${
                      introSlide === index
                        ? "w-8 bg-cyan-400"
                        : "w-2.5 bg-slate-600 hover:bg-slate-500"
                    }`}
                    aria-label={`${condition.title} görselini göster`}
                    aria-current={introSlide === index ? "true" : undefined}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                Öğretmen ne yapacak?
              </h3>
              <div className="space-y-2 text-sm leading-relaxed text-slate-400">
                <p>
                  • Uygun doğal anı seçip yalnızca bir kez “Bana bak” deyin.
                </p>
                <p>
                  • Öğrenci 3–5 saniye içinde bağımsız bakarsa “Baktı”yı seçin.
                </p>
                <p>
                  • Bakmazsa, tekrar veya yardımla bakarsa “Bakmadı”yı seçin.
                </p>
                <p>• Üç durumu sırayla yapmak zorunda değilsiniz.</p>
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

        {phase === "assessment" && (
          <div className="max-h-full w-full max-w-5xl space-y-4 overflow-y-auto pb-4 animate-in slide-in-from-right-6 duration-300">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 text-center">
              <h1 className="text-xl font-black">Doğal fırsatı işaretleyin</h1>
              <p className="mx-auto mt-1 max-w-2xl text-sm text-slate-400">
                Hangisi denk gelirse ilgili karttan “Baktı” veya “Bakmadı”yı
                seçin.
              </p>
            </div>

            {feedback && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-center text-sm font-semibold text-emerald-300 animate-in fade-in duration-200">
                ✓ {feedback}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              {CONDITIONS.map((condition) => {
                const Icon = condition.icon;
                const count = counts[condition.id];
                const completed = count >= TRIALS_PER_CONDITION;

                return (
                  <section
                    key={condition.id}
                    className={`rounded-3xl border p-5 shadow-xl transition-all ${
                      completed
                        ? "border-green-500/20 bg-green-950/15 opacity-45"
                        : "border-slate-700 bg-slate-900/85"
                    }`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span
                          className={`rounded-xl border p-2.5 ${condition.color}`}
                        >
                          <Icon className="h-6 w-6" />
                        </span>
                        <div>
                          <h2 className="font-black text-slate-100">
                            {condition.title}
                          </h2>
                          <p className="mt-1 text-xs leading-relaxed text-slate-400">
                            {condition.instruction}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                          completed
                            ? "bg-green-500/15 text-green-300"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {count}/{TRIALS_PER_CONDITION}
                      </span>
                    </div>

                    {completed ? (
                      <div className="flex items-center justify-center gap-2 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 font-bold text-green-400">
                        <Check size={21} /> Bu bölüm tamamlandı
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => handleAssessment(condition.id, false)}
                          disabled={locked}
                          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 transition-all hover:bg-red-500/20 active:scale-95 disabled:opacity-40"
                        >
                          <X className="h-7 w-7" />
                          <span className="text-xs font-bold uppercase tracking-wider">
                            Bakmadı
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAssessment(condition.id, true)}
                          disabled={locked}
                          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-400 transition-all hover:bg-green-500/20 active:scale-95 disabled:opacity-40"
                        >
                          <Eye className="h-7 w-7" />
                          <span className="text-xs font-bold uppercase tracking-wider">
                            Baktı
                          </span>
                        </button>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
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
              {CONDITIONS.map((condition) => {
                const Icon = condition.icon;
                return (
                  <div
                    key={condition.id}
                    className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4 text-left"
                  >
                    <Icon className="mb-3 h-6 w-6 text-cyan-400" />
                    <p className="text-xs font-bold text-slate-300">
                      {condition.title}
                    </p>
                    <p className="mt-1 text-xl font-black text-white">
                      {correctCounts[condition.id]}/{TRIALS_PER_CONDITION}
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

      {warningOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border-2 border-red-500/60 bg-red-950 p-6 text-center shadow-[0_0_45px_rgba(239,68,68,0.25)] animate-in zoom-in-95 duration-200">
            <AlertTriangle className="mx-auto mb-4 h-14 w-14 text-red-400" />
            <h2 className="text-2xl font-black text-white">
              Denemeler arası süre çok kısa
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-red-100/85">
              “Bana bak” yönergesini doğal oyun ve etkileşim anlarına
              serpiştirin. Çok sık tekrarlamak yönergenin sıradanlaşmasına ve
              öğrencinin gerçek tepkisinin etkilenmesine neden olabilir.
            </p>
            <button
              type="button"
              onClick={acknowledgeWarning}
              className="mt-6 w-full rounded-2xl bg-red-500 px-6 py-4 font-bold text-white transition-all hover:bg-red-400 active:scale-95"
            >
              Dikkate aldım
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

