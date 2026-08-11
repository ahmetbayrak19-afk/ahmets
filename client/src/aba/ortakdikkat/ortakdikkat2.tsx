import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  PackageOpen,
  PlayCircle,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import confetti from "canvas-confetti";

type ExchangeType = "alirken" | "verirken";
type Phase = "intro" | "assessment" | "result";

interface TrialResult {
  id: number;
  type: ExchangeType;
  correct: boolean;
  timestamp: number;
}

interface OrtakDikkat2Props {
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

interface ExchangeCard {
  id: ExchangeType;
  title: string;
  description: string;
  instruction: string;
  icon: typeof ArrowDown;
  color: string;
}

const EXCHANGES: ExchangeCard[] = [
  {
    id: "alirken",
    title: "Nesne alırken",
    description:
      "Öğrenci kendisine uzatılan nesneyi alırken öğretmenin yüzüne bağımsız olarak yönelir.",
    instruction:
      "Sevdiği nesneyi doğal biçimde uzatın. “İster misin?” diyebilirsiniz; “Bana bak” demeyin.",
    icon: ArrowDown,
    color: "border-sky-500/35 bg-sky-500/10 text-sky-300",
  },
  {
    id: "verirken",
    title: "Nesne verirken",
    description:
      "Öğrenci nesneyi karşısındaki kişiye verirken öğretmenin yüzüne bağımsız olarak yönelir.",
    instruction:
      "Elinizi uzatıp “Bana verir misin?” deyin. Göz kontağı kurmasını ayrıca istemeyin.",
    icon: ArrowUp,
    color: "border-violet-500/35 bg-violet-500/10 text-violet-300",
  },
];

const TRIALS_PER_EXCHANGE = 5;
const TOTAL_TRIALS = 10;
const PASS_SCORE = 8;
const SHORT_INTERVAL_MS = 2 * 60 * 1000;

export default function OrtakDikkat2({
  itemCode = "OD 1.2",
  itemText = "Göz Kontağı Kurma",
  onClose,
  onComplete,
}: OrtakDikkat2Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [results, setResults] = useState<TrialResult[]>([]);
  const [lastMarkedAt, setLastMarkedAt] = useState<number | null>(null);
  const [warningOpen, setWarningOpen] = useState(false);
  const [showResultAfterWarning, setShowResultAfterWarning] = useState(false);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const displayItemCode = itemCode.trim() === "OD" ? "OD 1.2" : itemCode;
  const displayItemText = itemText.replace(/^1\.2\.\s*/, "");

  const counts = useMemo(
    () => ({
      alirken: results.filter((result) => result.type === "alirken").length,
      verirken: results.filter((result) => result.type === "verirken").length,
    }),
    [results],
  );

  const correctCounts = useMemo(
    () => ({
      alirken: results.filter(
        (result) => result.type === "alirken" && result.correct,
      ).length,
      verirken: results.filter(
        (result) => result.type === "verirken" && result.correct,
      ).length,
    }),
    [results],
  );

  const score = results.filter((result) => result.correct).length;
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

  const handleAssessment = (type: ExchangeType, correct: boolean) => {
    if (locked || counts[type] >= TRIALS_PER_EXCHANGE) return;
    setLocked(true);

    const now = Date.now();
    const isShortInterval =
      lastMarkedAt !== null && now - lastMarkedAt < SHORT_INTERVAL_MS;
    const updatedResults = [
      ...results,
      {
        id: results.length + 1,
        type,
        correct,
        timestamp: now,
      },
    ];
    const finalScore = updatedResults.filter((result) => result.correct).length;
    const completed = updatedResults.length === TOTAL_TRIALS;

    setResults(updatedResults);
    setLastMarkedAt(now);
    setFeedback(
      `${type === "alirken" ? "Nesne alırken" : "Nesne verirken"} · ${
        correct ? "Göz kontağı kurdu" : "Kurmadı"
      } kaydedildi`,
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
          <div className="max-h-full w-full max-w-3xl space-y-5 overflow-y-auto pb-6 animate-in zoom-in-95 duration-300">
            <div className="text-center">
              <Eye className="mx-auto mb-3 h-12 w-12 text-cyan-400 drop-shadow-[0_0_14px_rgba(34,211,238,0.35)]" />
              <h1 className="mb-2 text-2xl font-black">
                Göz Kontağı Değerlendirmesi
              </h1>
              <p className="mx-auto max-w-2xl px-2 text-sm leading-relaxed text-slate-400">
                Öğrenci nesne alırken veya verirken öğretmenin yüzüne bağımsız
                olarak yaklaşık 2 saniye yönelir. Her durumdan 5 olmak üzere
                toplam 10 doğal fırsat değerlendirilir.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {EXCHANGES.map((exchange) => {
                const Icon = exchange.icon;
                return (
                  <div
                    key={exchange.id}
                    className={`rounded-2xl border p-4 ${exchange.color}`}
                  >
                    <Icon className="mb-3 h-7 w-7" />
                    <h3 className="mb-1 font-bold text-slate-100">
                      {exchange.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-slate-400">
                      {exchange.description}
                    </p>
                    <p className="mt-3 text-[11px] font-semibold text-slate-300">
                      5 deneme
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
                <p>• Nesneyi doğal el veya göğüs hizasında tutun.</p>
                <p>
                  • Öğrenci nesneyi almadan önce, alırken ya da hemen sonrasında
                  yüzünüze yaklaşık 2 saniye bağımsız yönelirse doğru sayın.
                </p>
                <p>
                  • Yalnızca nesneye bakarsa veya “Bana bak”, ismini söyleme ya
                  da başka bir ipucundan sonra bakarsa “Kurmadı” olarak
                  işaretleyin.
                </p>
                <p>• Başarı ölçütü en az 8/10 doğru tepkidir.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
              <PackageOpen className="h-5 w-5 shrink-0" />
              <span>
                Öğrencinin sevdiği 2–3 basit nesneyi hazır bulundurun.
              </span>
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
          <div className="max-h-full w-full max-w-4xl space-y-4 overflow-y-auto pb-4 animate-in slide-in-from-right-6 duration-300">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 text-center">
              <h1 className="text-xl font-black">
                Doğal fırsatı değerlendirin
              </h1>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                Oyun içinde hangisi doğal olarak gerçekleşirse ilgili karttan
                işaretleyin. Önce bütün “alırken” denemelerini yapmanız
                gerekmez.
              </p>
            </div>

            {feedback && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-center text-sm font-semibold text-emerald-300 animate-in fade-in duration-200">
                ✓ {feedback}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {EXCHANGES.map((exchange) => {
                const Icon = exchange.icon;
                const count = counts[exchange.id];
                const completed = count >= TRIALS_PER_EXCHANGE;

                return (
                  <section
                    key={exchange.id}
                    className={`rounded-3xl border p-5 shadow-xl transition-all ${
                      completed
                        ? "border-green-500/20 bg-green-950/15 opacity-45"
                        : "border-slate-700 bg-slate-900/85"
                    }`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span
                          className={`rounded-xl border p-2.5 ${exchange.color}`}
                        >
                          <Icon className="h-6 w-6" />
                        </span>
                        <div>
                          <h2 className="font-black text-slate-100">
                            {exchange.title}
                          </h2>
                          <p className="mt-1 text-xs leading-relaxed text-slate-400">
                            {exchange.instruction}
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
                        {count}/{TRIALS_PER_EXCHANGE}
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
                          onClick={() => handleAssessment(exchange.id, false)}
                          disabled={locked}
                          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 transition-all hover:bg-red-500/20 active:scale-95 disabled:opacity-40"
                        >
                          <X className="h-7 w-7" />
                          <span className="text-xs font-bold uppercase tracking-wider">
                            Kurmadı
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAssessment(exchange.id, true)}
                          disabled={locked}
                          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-400 transition-all hover:bg-green-500/20 active:scale-95 disabled:opacity-40"
                        >
                          <Eye className="h-7 w-7" />
                          <span className="text-xs font-bold uppercase tracking-wider">
                            Kurdu
                          </span>
                        </button>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>

            <p className="text-center text-xs leading-relaxed text-slate-500">
              Denemeleri öğrencinin doğal oyun ve etkileşim anlarına
              serpiştirin.
            </p>
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

            <div className="grid grid-cols-2 gap-3">
              {EXCHANGES.map((exchange) => {
                const Icon = exchange.icon;
                return (
                  <div
                    key={exchange.id}
                    className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4 text-left"
                  >
                    <Icon className="mb-3 h-6 w-6 text-cyan-400" />
                    <p className="text-xs font-bold text-slate-300">
                      {exchange.title}
                    </p>
                    <p className="mt-1 text-xl font-black text-white">
                      {correctCounts[exchange.id]}/{TRIALS_PER_EXCHANGE}
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

            <p className="rounded-xl border border-slate-700 bg-slate-950/40 p-3 text-xs leading-relaxed text-slate-400">
              Kişiler arası genelleme için değerlendirmeyi daha sonra farklı bir
              yetişkinle doğal etkileşim içinde tekrarlayın.
            </p>

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
              Göz kontağını doğal oyun ve etkileşim sırasında oluşan nesne
              alışverişlerinde değerlendirin. Denemeleri çok sık tekrarlamak
              öğrencinin durumu önceden tahmin etmesine ve verdiği tepkinin
              doğallığının azalmasına neden olabilir.
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
