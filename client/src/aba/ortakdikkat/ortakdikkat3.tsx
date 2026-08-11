import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  Images,
  PackageOpen,
  PlayCircle,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import confetti from "canvas-confetti";

import basla1 from "./ortakdikkatsesgorsel/1_3basla1.jpg";
import basla2 from "./ortakdikkatsesgorsel/1_3basla2.jpg";
import basla3 from "./ortakdikkatsesgorsel/1_3basla3.jpg";
import basla4 from "./ortakdikkatsesgorsel/1_3basla4.jpg";
import basla5 from "./ortakdikkatsesgorsel/1_3basla5.jpg";

type TargetSide = "sol" | "sag";
type Phase = "intro" | "assessment" | "result";

interface TrialResult {
  id: number;
  targetSide: TargetSide;
  followed: boolean;
}

interface TargetCard {
  id: TargetSide;
  title: string;
  instruction: string;
  icon: typeof ArrowLeft;
  color: string;
}

interface GuideStep {
  image: string;
  title: string;
  description: string;
}

interface OrtakDikkat3Props {
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    image: basla1,
    title: "Hedef nesneye bakın",
    description:
      "Öğretmen konuşmadan topa bakar; çocuk öğretmenin yüzünü izler.",
  },
  {
    image: basla2,
    title: "Avucunuzu doğal biçimde uzatın",
    description:
      "Öğretmen topa bakmayı sürdürürken açık avucunu çocuğa doğru uzatır.",
  },
  {
    image: basla3,
    title: "Bakışı takip etmesini bekleyin",
    description: "Çocuk öğretmenin bakışını takip ederek topa yönelir.",
  },
  {
    image: basla4,
    title: "Etkileşimin devam etmesine izin verin",
    description: "Çocuk isterse topa uzanır; bu hareket için yardım verilmez.",
  },
  {
    image: basla5,
    title: "Doğal etkileşimi tamamlayın",
    description:
      "Çocuk topu öğretmenin avucuna koyar ve öğretmenin yüzüne yeniden bakar.",
  },
];

const TARGETS: TargetCard[] = [
  {
    id: "sol",
    title: "Soldaki hedef",
    instruction:
      "Çocuk yüzünüze bakarken açık avucunuzu uzatın ve soldaki nesneye doğal biçimde bakın.",
    icon: ArrowLeft,
    color: "border-sky-500/35 bg-sky-500/10 text-sky-300",
  },
  {
    id: "sag",
    title: "Sağdaki hedef",
    instruction:
      "Çocuk yüzünüze bakarken açık avucunuzu uzatın ve sağdaki nesneye doğal biçimde bakın.",
    icon: ArrowRight,
    color: "border-violet-500/35 bg-violet-500/10 text-violet-300",
  },
];

const GUIDE_INTERVAL_MS = 1000;
const TRIALS_PER_TARGET = 5;
const TOTAL_TRIALS = 10;
const PASS_SCORE = 8;

export default function OrtakDikkat3({
  itemCode = "OD 1.3",
  itemText = "İletişim Ortağının Bakışlarını Takip Etme",
  onClose,
  onComplete,
}: OrtakDikkat3Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [results, setResults] = useState<TrialResult[]>([]);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [guideStepIndex, setGuideStepIndex] = useState(0);

  const displayItemCode = itemCode.trim() === "OD" ? "OD 1.3" : itemCode;
  const displayItemText = itemText.replace(/^1\.3\.\s*/, "");

  useEffect(() => {
    if (phase !== "intro") return;

    const intervalId = window.setInterval(() => {
      setGuideStepIndex((current) => (current + 1) % GUIDE_STEPS.length);
    }, GUIDE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [phase]);

  const guideStep = GUIDE_STEPS[guideStepIndex];

  const counts = useMemo(
    () => ({
      sol: results.filter((result) => result.targetSide === "sol").length,
      sag: results.filter((result) => result.targetSide === "sag").length,
    }),
    [results],
  );

  const correctCounts = useMemo(
    () => ({
      sol: results.filter(
        (result) => result.targetSide === "sol" && result.followed,
      ).length,
      sag: results.filter(
        (result) => result.targetSide === "sag" && result.followed,
      ).length,
    }),
    [results],
  );

  const score = results.filter((result) => result.followed).length;
  const success = results.length === TOTAL_TRIALS && score >= PASS_SCORE;

  const startAssessment = () => {
    setResults([]);
    setLocked(false);
    setFeedback(null);
    setPhase("assessment");
  };

  const handleAssessment = (targetSide: TargetSide, followed: boolean) => {
    if (locked || counts[targetSide] >= TRIALS_PER_TARGET) return;
    setLocked(true);

    const updatedResults = [
      ...results,
      {
        id: results.length + 1,
        targetSide,
        followed,
      },
    ];
    const finalScore = updatedResults.filter(
      (result) => result.followed,
    ).length;
    const completed = updatedResults.length === TOTAL_TRIALS;

    setResults(updatedResults);
    setFeedback(
      `${targetSide === "sol" ? "Sol" : "Sağ"} hedef · ${
        followed ? "Takip etti" : "Takip etmedi"
      } kaydedildi`,
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
                İletişim Ortağının Bakışını Takip Etme
              </h1>
              <p className="mx-auto max-w-2xl px-2 text-sm leading-relaxed text-slate-400">
                Öğrencinin, öğretmenin baktığı nesneyi herhangi bir sözel veya
                işaret etme yardımı olmadan bulması değerlendirilir.
              </p>
            </div>

            <section className="overflow-hidden rounded-3xl border border-cyan-500/25 bg-slate-900/80 shadow-xl shadow-cyan-950/20">
              <div className="flex items-center justify-between border-b border-slate-700/80 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Images className="h-6 w-6 text-cyan-400" />
                  <div>
                    <h2 className="font-black text-slate-100">
                      Öğretmen nasıl uygulayacak?
                    </h2>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Görseller birer saniye arayla ilerler
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-300">
                  {guideStepIndex + 1}/{GUIDE_STEPS.length}
                </span>
              </div>

              <div className="bg-slate-950/70 p-2 sm:p-3">
                <div className="aspect-[3/2] w-full overflow-hidden rounded-2xl border border-slate-700 bg-black">
                  <img
                    key={guideStep.image}
                    src={guideStep.image}
                    alt={`${guideStepIndex + 1}. adım: ${guideStep.title}`}
                    className="h-full w-full object-contain animate-in fade-in duration-300"
                    draggable={false}
                  />
                </div>
              </div>

              <div className="px-4 pb-4 pt-3 text-center">
                <h3 className="font-black text-cyan-300">{guideStep.title}</h3>
                <p className="mx-auto mt-1 max-w-2xl text-sm leading-relaxed text-slate-300">
                  {guideStep.description}
                </p>
                <div className="mt-3 flex justify-center gap-2">
                  {GUIDE_STEPS.map((step, index) => (
                    <button
                      key={step.image}
                      type="button"
                      onClick={() => setGuideStepIndex(index)}
                      aria-label={`${index + 1}. adımı göster`}
                      className={`h-2.5 rounded-full transition-all ${
                        index === guideStepIndex
                          ? "w-7 bg-cyan-400"
                          : "w-2.5 bg-slate-600 hover:bg-slate-500"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </section>

            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm leading-relaxed text-emerald-100">
              <strong className="text-emerald-300">Temel ölçüt:</strong> Çocuk
              3–5 saniye içinde öğretmenin baktığı doğru nesneye yönelirse
              başarılı sayılır. Nesneye uzanması veya nesneyi vermesi zorunlu
              değildir.
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {TARGETS.map((target) => {
                const Icon = target.icon;
                return (
                  <div
                    key={target.id}
                    className={`rounded-2xl border p-4 ${target.color}`}
                  >
                    <Icon className="mb-3 h-7 w-7" />
                    <h3 className="font-bold text-slate-100">{target.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      {target.instruction}
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
                Değerlendirme kuralları
              </h3>
              <div className="space-y-2 text-sm leading-relaxed text-slate-400">
                <p>
                  • İki nesneyi masanın sağına ve soluna eşit uzaklıkta koyun.
                </p>
                <p>• Denemeye çocuk yüzünüze bakarken başlayın.</p>
                <p>
                  • Hedefe doğal biçimde bakıp açık avucunuzu uzatın;
                  konuşmayın, nesnenin adını söylemeyin ve işaret etmeyin.
                </p>
                <p>
                  • Doğru nesneye bağımsız bakarsa “Takip etti”, yanlış nesneye
                  bakar veya tepki vermezse “Takip etmedi”yi seçin.
                </p>
                <p>• Sol ve sağ hedefleri karışık sırada değerlendirin.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
              <PackageOpen className="h-5 w-5 shrink-0" />
              <span>
                Masa ve birbirinden kolay ayırt edilen iki basit nesne.
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
                Bakış denemesini işaretleyin
              </h1>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                Sol ve sağ hedefleri karışık kullanın. Çocuk baktığınız doğru
                nesneye 3–5 saniye içinde yönelirse “Takip etti”yi seçin.
              </p>
            </div>

            {feedback && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-center text-sm font-semibold text-emerald-300 animate-in fade-in duration-200">
                ✓ {feedback}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {TARGETS.map((target) => {
                const Icon = target.icon;
                const count = counts[target.id];
                const completed = count >= TRIALS_PER_TARGET;

                return (
                  <section
                    key={target.id}
                    className={`rounded-3xl border p-5 shadow-xl transition-all ${
                      completed
                        ? "border-green-500/20 bg-green-950/15 opacity-45"
                        : "border-slate-700 bg-slate-900/85"
                    }`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span
                          className={`rounded-xl border p-2.5 ${target.color}`}
                        >
                          <Icon className="h-6 w-6" />
                        </span>
                        <div>
                          <h2 className="font-black text-slate-100">
                            {target.title}
                          </h2>
                          <p className="mt-1 text-xs leading-relaxed text-slate-400">
                            {target.instruction}
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
                        {count}/{TRIALS_PER_TARGET}
                      </span>
                    </div>

                    {completed ? (
                      <div className="flex items-center justify-center gap-2 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 font-bold text-green-400">
                        <Check size={21} /> Bu hedef tamamlandı
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => handleAssessment(target.id, false)}
                          disabled={locked}
                          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 transition-all hover:bg-red-500/20 active:scale-95 disabled:opacity-40"
                        >
                          <X className="h-7 w-7" />
                          <span className="text-xs font-bold uppercase tracking-wider">
                            Takip etmedi
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAssessment(target.id, true)}
                          disabled={locked}
                          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-400 transition-all hover:bg-green-500/20 active:scale-95 disabled:opacity-40"
                        >
                          <Eye className="h-7 w-7" />
                          <span className="text-xs font-bold uppercase tracking-wider">
                            Takip etti
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
              className={`mx-auto h-16 w-16 ${
                success ? "text-yellow-400" : "text-slate-500"
              }`}
            />
            <div>
              <h1 className="text-3xl font-black">Değerlendirme Bitti</h1>
              <p className="mt-2 text-slate-400">
                Doğru takip:{" "}
                <span className="text-3xl font-black text-white">{score}</span>/
                {TOTAL_TRIALS}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Geçme ölçütü: {PASS_SCORE}/{TOTAL_TRIALS}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {TARGETS.map((target) => {
                const Icon = target.icon;
                return (
                  <div
                    key={target.id}
                    className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4 text-left"
                  >
                    <Icon className="mb-3 h-6 w-6 text-cyan-400" />
                    <p className="text-xs font-bold text-slate-300">
                      {target.title}
                    </p>
                    <p className="mt-1 text-xl font-black text-white">
                      {correctCounts[target.id]}/{TRIALS_PER_TARGET}
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
    </div>
  );
}
