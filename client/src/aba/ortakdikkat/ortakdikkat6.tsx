import { useMemo, useState } from "react";
import {
  Check,
  Eye,
  Pencil,
  RefreshCw,
  Sparkles,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import confetti from "canvas-confetti";

type Phase = "intro" | "assessment" | "result";
type SituationSource = "pool" | "custom";

interface Situation {
  id: string;
  text: string;
  hint: string;
  source: SituationSource;
}

interface TrialResult {
  id: number;
  situationId: string;
  situationText: string;
  source: SituationSource;
  looked: boolean;
  timestamp: number;
}

interface OrtakDikkat6Props {
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

/** Hazır durum havuzu — öğretmen tek tek değiştirebilir veya özel yazabilir */
const SITUATION_POOL: Omit<Situation, "source">[] = [
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

function initialSituations(): Situation[] {
  return shuffle(SITUATION_POOL)
    .slice(0, TRIAL_COUNT)
    .map((s) => ({ ...s, source: "pool" as const }));
}

export default function OrtakDikkat6({
  itemCode = "OD 1.6",
  itemText = "Gösterilen İlginç Nesne/Durumlara Bakma",
  onClose,
  onComplete,
}: OrtakDikkat6Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [situations, setSituations] = useState<Situation[]>(initialSituations);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState<"looked" | "not" | null>(null);

  /** Özel yazı paneli: hangi satır düzenleniyor */
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editError, setEditError] = useState(false);

  const trialIndex = results.length;
  const current = situations[trialIndex];
  const score = results.filter((r) => r.looked).length;
  const success = score >= PASS_SCORE;

  /** Havuzdan bu satıra farklı bir durum koy */
  const changeFromPool = (index: number) => {
    const usedIds = new Set(situations.map((s) => s.id));
    const currentId = situations[index]?.id;
    let candidates = SITUATION_POOL.filter((s) => s.id !== currentId && !usedIds.has(s.id));
    if (!candidates.length) {
      candidates = SITUATION_POOL.filter((s) => s.id !== currentId);
    }
    if (!candidates.length) candidates = [...SITUATION_POOL];
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    setSituations((prev) =>
      prev.map((s, i) =>
        i === index ? { ...pick, source: "pool" as const } : s,
      ),
    );
  };

  const openCustomEditor = (index: number) => {
    const s = situations[index];
    setEditIndex(index);
    setEditDraft(s.source === "custom" ? s.text : "");
    setEditError(false);
  };

  const saveCustom = () => {
    if (editIndex === null) return;
    const text = editDraft.trim();
    if (!text) {
      setEditError(true);
      return;
    }
    setSituations((prev) =>
      prev.map((s, i) =>
        i === editIndex
          ? {
              id: `custom-${editIndex}-${Date.now()}`,
              text,
              hint: "Kendi uyguladığınız durumu kaydettiniz.",
              source: "custom" as const,
            }
          : s,
      ),
    );
    setEditIndex(null);
    setEditDraft("");
    setEditError(false);
  };

  const startAssessment = () => {
    setResults([]);
    setFeedback(null);
    setLocked(false);
    setEditIndex(null);
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
      source: current.source,
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
                <li>10 durum · en az 8 doğru (yetişkine bakış)</li>
                <li>Sözlü yönerge yok · tepki kendiliğinden olmalı</li>
                <li>
                  Listedeki metin <span className="text-slate-200">öneridir</span>; kendi
                  durumunuzu da yazabilirsiniz
                </li>
                <li>Her denemede durum metni kayda geçer (veri için)</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                Bu set ({TRIAL_COUNT} durum) — satır satır değiştirin
              </p>
              <ol className="space-y-1.5">
                {situations.map((s, i) => (
                  <li
                    key={`${s.id}-${i}`}
                    className="flex items-center gap-2 rounded-lg border border-slate-800/80 bg-slate-900/60 px-2 py-1.5"
                  >
                    <span className="w-5 shrink-0 text-sm font-bold text-cyan-500/90">
                      {i + 1}.
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-100">{s.text}</p>
                      {s.source === "custom" && (
                        <p className="text-[10px] font-medium text-amber-400/90">Özel durum</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => changeFromPool(i)}
                      className="shrink-0 rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 active:scale-95"
                      title="Havuzdan değiştir"
                      aria-label="Havuzdan değiştir"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openCustomEditor(i)}
                      className="shrink-0 rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:border-amber-500/50 hover:text-amber-300 active:scale-95"
                      title="Özel durum yaz"
                      aria-label="Özel durum yaz"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
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
              {current.source === "custom" && (
                <span className="mb-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                  Özel durum
                </span>
              )}
              <h1 className="text-2xl font-black leading-snug text-white sm:text-3xl">
                {current.text}
              </h1>
              {current.source === "pool" && current.hint && (
                <p className="mt-3 max-w-sm text-sm text-slate-400">{current.hint}</p>
              )}
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

            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-left text-xs">
              {results.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start justify-between gap-2 border-b border-slate-800/80 px-2 py-1.5 last:border-0"
                >
                  <span className="min-w-0 text-slate-300">
                    <span className="font-bold text-slate-500">{r.id}.</span> {r.situationText}
                    {r.source === "custom" && (
                      <span className="ml-1 text-[10px] text-amber-400/80">(özel)</span>
                    )}
                  </span>
                  <span
                    className={`shrink-0 font-bold ${r.looked ? "text-green-400" : "text-red-400"}`}
                  >
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

      {/* Özel durum yazı paneli */}
      {editIndex !== null && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/65"
            aria-label="Kapat"
            onClick={() => {
              setEditIndex(null);
              setEditDraft("");
              setEditError(false);
            }}
          />
          <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl space-y-3 animate-in slide-in-from-bottom-4 duration-200">
            <h3 className="text-lg font-black text-white">Özel durum yazın</h3>
            <p className="text-xs text-slate-400">
              Ne yaptığınızı kısaca yazın. Bu metin deneme kaydına işlenir (öğrencinin neye
              bakıp bakmadığı için).
            </p>
            <input
              type="text"
              value={editDraft}
              onChange={(e) => {
                setEditDraft(e.target.value);
                if (e.target.value.trim()) setEditError(false);
              }}
              placeholder="Örn: Kapıyı çaldım ve içeri girdim"
              className={`w-full rounded-xl border bg-slate-950 px-3 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-cyan-500/40 ${
                editError ? "border-red-500" : "border-slate-700"
              }`}
              // touchAction pan for keyboard
              style={{ touchAction: "manipulation" }}
              autoFocus
            />
            {editError && (
              <p className="text-xs font-semibold text-red-400">Durum metni boş olamaz.</p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setEditIndex(null);
                  setEditDraft("");
                  setEditError(false);
                }}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-3 text-sm font-bold text-slate-300"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={saveCustom}
                className="flex-1 rounded-xl bg-cyan-600 py-3 text-sm font-bold text-white"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
