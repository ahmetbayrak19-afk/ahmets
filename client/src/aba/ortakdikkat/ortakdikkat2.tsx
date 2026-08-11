import { useState } from "react";
import { Check, Eye, PlayCircle, Trophy, X, XCircle } from "lucide-react";
import confetti from "canvas-confetti";

type Phase = "intro" | "assessment" | "result";

interface TrialResult {
  id: number;
  correct: boolean;
}

interface OrtakDikkat2Props {
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

const TOTAL_TRIALS = 10;
const PASS_SCORE = 8;

export default function OrtakDikkat2({
  itemCode = "OD 1.2",
  itemText = "Göz Kontağı Kurma",
  onClose,
  onComplete,
}: OrtakDikkat2Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [results, setResults] = useState<TrialResult[]>([]);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const displayItemCode = itemCode.trim() === "OD" ? "OD 1.2" : itemCode;
  const displayItemText = itemText.replace(/^1\.2\.\s*/, "");
  const score = results.filter((result) => result.correct).length;
  const success = results.length === TOTAL_TRIALS && score >= PASS_SCORE;

  const startAssessment = () => {
    setResults([]);
    setLocked(false);
    setFeedback(null);
    setPhase("assessment");
  };

  const handleAssessment = (correct: boolean) => {
    if (locked || results.length >= TOTAL_TRIALS) return;
    setLocked(true);

    const updatedResults = [...results, { id: results.length + 1, correct }];
    const finalScore = updatedResults.filter((result) => result.correct).length;
    const completed = updatedResults.length === TOTAL_TRIALS;

    setResults(updatedResults);
    setFeedback(
      `${correct ? "Göz kontağı kurdu" : "Göz kontağı kurmadı"} kaydedildi`,
    );
    window.setTimeout(() => setFeedback(null), 1400);

    if (completed) {
      window.setTimeout(() => {
        setPhase("result");
        setLocked(false);
        if (finalScore >= PASS_SCORE) {
          confetti({ particleCount: 220, spread: 85, origin: { y: 0.62 } });
        }
      }, 350);
      return;
    }

    window.setTimeout(() => setLocked(false), 350);
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
                Öğrencinin doğal iletişim ve etkileşim sırasında karşısındaki
                kişinin yüzüne bağımsız olarak yönelmesi değerlendirilir. Toplam
                10 doğal fırsat gözlenir.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-300">
                Değerlendirme ölçütü
              </h3>
              <div className="space-y-2 text-sm leading-relaxed text-slate-400">
                <p>
                  • Öğrenci doğal etkileşim sırasında yüzünüze yaklaşık 2 saniye
                  bağımsız yönelirse doğru sayın.
                </p>
                <p>
                  • “Bana bak” demeyin, öğrencinin adını söylemeyin ve bakmasını
                  sağlamak için ayrıca jest veya nesne kullanmayın.
                </p>
                <p>
                  • Yalnızca çevreye bakar, tepki vermez veya yardımdan sonra
                  bakarsa “Kurmadı”yı seçin.
                </p>
                <p>• Başarı ölçütü en az 8/10 doğru tepkidir.</p>
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
          <div className="w-full max-w-2xl space-y-4 animate-in slide-in-from-right-6 duration-300">
            <section className="rounded-3xl border border-slate-700 bg-slate-900/85 p-6 text-center shadow-xl">
              <Eye className="mx-auto mb-3 h-12 w-12 text-cyan-400" />
              <h1 className="text-2xl font-black">Doğal fırsatı gözleyin</h1>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
                Öğrenci etkileşim sırasında yüzünüze yaklaşık 2 saniye bağımsız
                yöneldi mi?
              </p>
              <div className="mx-auto mt-4 max-w-md">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>İlerleme</span>
                  <span>
                    {results.length}/{TOTAL_TRIALS}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-cyan-500 transition-all duration-300"
                    style={{
                      width: `${(results.length / TOTAL_TRIALS) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </section>

            {feedback && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-center text-sm font-semibold text-emerald-300 animate-in fade-in duration-200">
                ✓ {feedback}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleAssessment(false)}
                disabled={locked}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-400 transition-all hover:bg-red-500/20 active:scale-95 disabled:opacity-40"
              >
                <X className="h-8 w-8" />
                <span className="text-sm font-bold uppercase tracking-wider">
                  Kurmadı
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleAssessment(true)}
                disabled={locked}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 p-5 text-green-400 transition-all hover:bg-green-500/20 active:scale-95 disabled:opacity-40"
              >
                <Eye className="h-8 w-8" />
                <span className="text-sm font-bold uppercase tracking-wider">
                  Kurdu
                </span>
              </button>
            </div>
          </div>
        )}

        {phase === "result" && (
          <div className="w-full max-w-xl space-y-5 rounded-3xl border border-slate-700 bg-slate-900/90 p-6 text-center shadow-2xl animate-in zoom-in-95 duration-500 sm:p-8">
            <Trophy
              className={`mx-auto h-16 w-16 ${
                success ? "text-yellow-400" : "text-slate-500"
              }`}
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
    </div>
  );
}
