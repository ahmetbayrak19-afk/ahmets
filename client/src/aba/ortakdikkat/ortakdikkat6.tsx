import { useMemo, useState } from "react";
import {
  Check,
  Eye,
  RefreshCw,
  Sparkles,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import confetti from "canvas-confetti";

type Phase = "intro" | "assessment" | "result";

interface Situation {
  id: string;
  text: string;
  hint: string;
}

interface TrialResult {
  id: number;
  situationId: string;
  situationText: string;
  looked: boolean;
  timestamp: number;
}

interface OrtakDikkat6Props {
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

/** Öğretmen sınıfta kendi güvenli versiyonunu uygular */
const SITUATION_POOL: Situation[] = [
  {
    id: "s01",
    text: "Baloncuk çıkarma",
    hint: "Baloncuk makinesi veya pipetle baloncuk yapın.",
  },
  {
    id: "s02",
    text: "Işıklı oyuncağı çalıştırma",
    hint: "Işık/ses çıkan bir oyuncağı aniden çalıştırın.",
  },
  {
    id: "s03",
    text: "Kutudan sürpriz oyuncak çıkarma",
    hint: "Kutunun içinden beklenmedik bir oyuncak çıkarın.",
  },
  {
    id: "s04",
    text: "Kuklanın birden görünmesi",
    hint: "Kuklayı perdenin/arkanın arkasından aniden gösterin.",
  },
  {
    id: "s05",
    text: "Komik veya tiz ses çıkarma",
    hint: "Abartılı, komik veya çok tiz bir ses kullanın.",
  },
  {
    id: "s06",
    text: "Oyuncağın masadan düşmesi",
    hint: "Oyuncağı kontrollü ve güvenli biçimde düşürün.",
  },
  {
    id: "s07",
    text: "İç içe kutudan başka nesne çıkması",
    hint: "Matruşka veya iç içe kutulardan sürpriz nesne çıkarın.",
  },
  {
    id: "s08",
    text: "Oyuncak telefonun çalması",
    hint: "Oyuncak telefonu çaldırın veya titreşim/ses verin.",
  },
  {
    id: "s09",
    text: "Komik bir şapka takma",
    hint: "Aniden komik bir şapka veya aksesuar takın.",
  },
  {
    id: "s10",
    text: "Balonu şişirme veya havaya bırakma",
    hint: "Balonu şişirin ya da güvenli biçimde havaya bırakın.",
  },
  {
    id: "s11",
    text: "Açılır-kapanır oyuncağın çalışması",
    hint: "Açılıp kapanan / fırlayan bir oyuncağı çalıştırın.",
  },
  {
    id: "s12",
    text: "Abartılı hapşırma",
    hint: "Komik ve abartılı şekilde hapşırın.",
  },
  {
    id: "s13",
    text: "Öğretmenin hafifçe düşer gibi yapması",
    hint: "Güvenli, abartılı ve kısa bir ‘düşer gibi’ hareket yapın.",
  },
  {
    id: "s14",
    text: "Resmin arkasından başka resim çıkması",
    hint: "Bir kartın/resmin altından başka bir görsel çıkarın.",
  },
  {
    id: "s15",
    text: "Oyuncak bebeğin beklenmedik ses çıkarması",
    hint: "Bebeği/oyuncağı ses çıkaracak şekilde çalıştırın.",
  },
];

const TRIAL_COUNT = 10;
const PASS_SCORE = 8;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function OrtakDikkat6({
  itemCode = "OD 1.6",
  itemText = "Gösterilen İlginç Nesne/Durumlara Bakma",
  onClose,
  onComplete,
}: OrtakDikkat6Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [situations, setSituations] = useState<Situation[]>(() =>
    shuffle(SITUATION_POOL).slice(0, TRIAL_COUNT),
  );
  const [results, setResults] = useState<TrialResult[]>([]);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState<"looked" | "not" | null>(null);

  const trialIndex = results.length;
  const current = situations[trialIndex];
  const score = results.filter((r) => r.looked).length;
  const success = score >= PASS_SCORE;

  const reshuffle = () => {
    setSituations(shuffle(SITUATION_POOL).slice(0, TRIAL_COUNT));
    setResults([]);
    setFeedback(null);
    setLocked(false);
  };

  const startAssessment = () => {
    setResults([]);
    setFeedback(null);
    setLocked(false);
    setPhase("assessment");
  };

  const recordTrial = (looked: boolean) => {
    if (locked || phase !== "assessment" || !current) return;
    setLocked(true);
    setFeedback(looked ? "looked" : "not");

    const entry: TrialResult = {
      id: trialIndex + 1,
      situationId: current.id,
      situationText: current.text,
      looked,
      timestamp: Date.now(),
    };
    const nextResults = [...results, entry];
    setResults(nextResults);

    window.setTimeout(() => {
      setFeedback(null);
      if (nextResults.length >= TRIAL_COUNT) {
        setPhase("result");
        if (nextResults.filter((r) => r.looked).length >= PASS_SCORE) {
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.65 } });
        }
      } else {
        setLocked(false);
      }
    }, 700);
  };

  const progressLabel = useMemo(() => {
    if (phase === "intro") return "HAZIRLIK";
    if (phase === "assessment") return `DEĞERLENDİRME · ${trialIndex + 1} / ${TRIAL_COUNT}`;
    return "SONUÇ";
  }, [phase, trialIndex]);

  return (
    <div
      className="fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col bg-slate-950 font-sans text-white select-none"
      style={{ touchAction: "none" }}
    >
      <header className="z-10 flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/90 p-3 backdrop-blur-md sm:p-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          aria-label="Kapat"
        >
          <XCircle className="h-7 w-7" />
        </button>
        <div className="min-w-0 px-2 text-center">
          <h2 className="truncate text-sm font-bold text-slate-100 sm:text-base">
            {itemCode} — {itemText}
          </h2>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-slate-400">
            {progressLabel}
          </p>
        </div>
        <div className="w-10 text-right text-xs font-bold tabular-nums text-cyan-400">
          {phase === "assessment" || phase === "result" ? score : ""}
        </div>
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950 p-3 sm:p-4">
        {phase === "intro" && (
          <div className="max-h-full w-full max-w-lg space-y-4 overflow-y-auto pb-4 animate-in zoom-in-95 duration-300">
            <div className="text-center">
              <Eye className="mx-auto mb-2 h-12 w-12 text-cyan-400" />
              <h1 className="mb-2 text-2xl font-black">İlginç Duruma Bakma</h1>
              <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-400">
                İlginç bir durum oluşturun.{" "}
                <span className="font-semibold text-slate-200">
                  “Bak” demeyin, işaret etmeyin.
                </span>{" "}
                Çocuk 3–5 saniye içinde{" "}
                <span className="font-semibold text-cyan-300">size (yetişkine) bakarsa</span>{" "}
                doğru sayın.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-300 space-y-2">
              <p className="font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" /> Değerlendirme kuralları
              </p>
              <ul className="list-disc space-y-1 pl-5 text-slate-400">
                <li>10 farklı durum · en az 8 doğru (yetişkine bakış)</li>
                <li>Sözlü yönerge yok · tepki kendiliğinden olmalı</li>
                <li>Durumları sınıfta güvenli ve basit uygulayın</li>
                <li>Öğretimde ipucu kullanılabilir; burada kullanılmaz</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Bu set ({TRIAL_COUNT} durum)
                </p>
                <button
                  type="button"
                  onClick={reshuffle}
                  className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-300 active:scale-95"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Değiştir
                </button>
              </div>
              <ol className="space-y-1.5">
                {situations.map((s, i) => (
                  <li
                    key={s.id}
                    className="flex gap-2 rounded-lg border border-slate-800/80 bg-slate-900/60 px-2.5 py-1.5 text-sm"
                  >
                    <span className="w-5 shrink-0 font-bold text-cyan-500/90">{i + 1}.</span>
                    <span className="text-slate-200">{s.text}</span>
                  </li>
                ))}
              </ol>
            </div>

            <button
              type="button"
              onClick={startAssessment}
              className="w-full rounded-2xl bg-cyan-600 py-3.5 text-base font-bold text-white shadow-lg shadow-cyan-900/40 transition-all hover:bg-cyan-500 active:scale-[0.98]"
            >
              DEĞERLENDİRMEYİ BAŞLAT
            </button>
          </div>
        )}

        {phase === "assessment" && current && (
          <div className="flex h-full w-full max-w-lg flex-col animate-in fade-in duration-200">
            <div className="flex flex-1 flex-col items-center justify-center px-2 text-center">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-cyan-400/90">
                Durum {trialIndex + 1} / {TRIAL_COUNT}
              </p>
              <h1 className="text-2xl font-black leading-snug text-white sm:text-3xl">
                {current.text}
              </h1>
              <p className="mt-3 max-w-sm text-sm text-slate-400">{current.hint}</p>
              <p className="mt-4 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-400">
                3–5 sn · kendiliğinden yetişkine baktı mı?
              </p>

              {feedback && (
                <div
                  className={`mt-4 rounded-xl px-4 py-2 text-sm font-bold ${
                    feedback === "looked"
                      ? "bg-green-500/15 text-green-400"
                      : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {feedback === "looked" ? "Baktı kaydedildi" : "Bakmadı kaydedildi"}
                </div>
              )}
            </div>

            <div className="shrink-0 space-y-3 border-t border-slate-800 bg-slate-900/95 p-3 pb-5">
              <div className="mx-auto flex max-w-md gap-3">
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => recordTrial(false)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-red-400 transition-all active:scale-95 disabled:opacity-40"
                >
                  <X className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase">Bakmadı</span>
                </button>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => recordTrial(true)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 p-3.5 text-green-400 transition-all active:scale-95 disabled:opacity-40"
                >
                  <Check className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase">Baktı</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === "result" && (
          <div className="w-full max-w-md space-y-5 text-center animate-in zoom-in-95 duration-300">
            <Trophy
              className={`mx-auto h-14 w-14 ${success ? "text-yellow-400" : "text-slate-500"}`}
            />
            <div>
              <p className="text-sm text-slate-400">Doğru bakış</p>
              <p className="text-4xl font-black text-white">
                {score}
                <span className="text-xl text-slate-500"> / {TRIAL_COUNT}</span>
              </p>
            </div>

            {success ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-5 py-3 font-bold text-green-400">
                <Check size={22} /> Set başarıyla geçildi (≥{PASS_SCORE}/{TRIAL_COUNT})
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 px-5 py-3 font-bold text-orange-400">
                <X size={22} /> Henüz yeterli bağımsızlık düzeyinde değil
              </div>
            )}

            <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-left text-xs">
              {results.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-2 border-b border-slate-800/80 px-2 py-1.5 last:border-0"
                >
                  <span className="truncate text-slate-300">
                    {r.id}. {r.situationText}
                  </span>
                  <span className={r.looked ? "font-bold text-green-400" : "font-bold text-red-400"}>
                    {r.looked ? "Baktı" : "Bakmadı"}
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
