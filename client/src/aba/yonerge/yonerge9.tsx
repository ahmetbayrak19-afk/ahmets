import { useState, useEffect, useRef } from 'react';
import {
  XCircle, Check, X, Trophy, PlayCircle, RefreshCw, Users, Box,
} from 'lucide-react';
import confetti from 'canvas-confetti';

import girisSes from './sesgorsel/yonerge34.mp3';

interface GroupTask {
  id: string;
  text: string;
  materials: string[];
}

/**
 * Basit grup yönergeleri — çoğul emir kipiyle (bakın, kalkın…).
 * "Hepiniz / herkes" gibi grup vurgusu YOK; öğretmen gruba seslenir.
 */
const TASK_POOL: GroupTask[] = [
  { id: 'g01', text: 'Bana bakın', materials: [] },
  { id: 'g02', text: 'Kalkın', materials: ['Sandalye'] },
  { id: 'g03', text: 'Oturun', materials: ['Sandalye'] },
  { id: 'g04', text: 'Ellerinizi çırpın', materials: [] },
  { id: 'g05', text: 'Zıplayın', materials: [] },
  { id: 'g06', text: 'Yere oturun', materials: [] },
  { id: 'g07', text: 'Ayağa kalkın', materials: [] },
  { id: 'g08', text: 'Ellerinizi kaldırın', materials: [] },
  { id: 'g09', text: 'Ellerinizi indirin', materials: [] },
  { id: 'g10', text: 'Sıraya girin', materials: [] },
  { id: 'g11', text: 'Durun', materials: [] },
  { id: 'g12', text: 'Yürüyün', materials: [] },
  { id: 'g13', text: 'El sallayın', materials: [] },
  { id: 'g14', text: 'Omuzlarınızı silkin', materials: [] },
  { id: 'g15', text: 'Dizlerinizi bükün', materials: [] },
  { id: 'g16', text: 'Başınızı sallayın', materials: [] },
  { id: 'g17', text: 'Gözlerinizi kapatın', materials: [] },
  { id: 'g18', text: 'Ağzınızı açın', materials: [] },
  { id: 'g19', text: 'Burnunuza dokunun', materials: [] },
  { id: 'g20', text: 'Kulağınıza dokunun', materials: [] },
  { id: 'g21', text: 'Ellerinizi bağlayın', materials: [] },
  { id: 'g22', text: 'Ayaklarınızı yere vurun', materials: [] },
  { id: 'g23', text: 'Kollarınızı açın', materials: [] },
  { id: 'g24', text: 'Kollarınızı indirin', materials: [] },
  { id: 'g25', text: 'Sessiz olun', materials: [] },
  { id: 'g26', text: 'Başınızı sağa sola çevirin', materials: [] },
  { id: 'g27', text: 'Öne eğilin', materials: [] },
  { id: 'g28', text: 'Geriye yaslanın', materials: ['Sandalye'] },
  { id: 'g29', text: 'Ellerinizi belinize koyun', materials: [] },
  { id: 'g30', text: 'Parmaklarınızı açın', materials: [] },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Yonerge9Props {
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

type Phase = 'prep' | 'running' | 'result';

export default function Yonerge9({
  itemCode = 'YTB 3.4',
  itemText = 'Basit Grup Yönergelerini Takip Etme',
  onClose,
  onComplete,
}: Yonerge9Props) {
  const [selected, setSelected] = useState<GroupTask[]>(() => shuffle(TASK_POOL).slice(0, 10));
  const [phase, setPhase] = useState<Phase>('prep');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);

  const introRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (phase !== 'prep') return;
    const a = new Audio(girisSes);
    introRef.current = a;
    a.volume = 1;
    a.play().catch(() => {});
    return () => {
      a.pause();
      a.currentTime = 0;
    };
  }, [phase]);

  const stopIntro = () => {
    if (introRef.current) {
      introRef.current.pause();
      introRef.current.currentTime = 0;
    }
  };

  const materialsList = (() => {
    const set = new Set<string>();
    selected.forEach((t) => t.materials.forEach((m) => set.add(m)));
    return Array.from(set).sort();
  })();

  const replaceTask = (index: number) => {
    const used = new Set(selected.map((t) => t.id));
    const alts = TASK_POOL.filter((t) => !used.has(t.id));
    if (alts.length === 0) return;
    const next = alts[Math.floor(Math.random() * alts.length)];
    setSelected((prev) => {
      const copy = [...prev];
      copy[index] = next;
      return copy;
    });
  };

  const startAssessment = () => {
    stopIntro();
    setCurrentIndex(0);
    setScore(0);
    setLocked(false);
    setPhase('running');
  };

  const handleAssess = (correct: boolean) => {
    if (locked) return;
    setLocked(true);
    const newScore = score + (correct ? 1 : 0);
    setScore(newScore);
    const next = currentIndex + 1;
    setTimeout(() => {
      if (next >= 10) {
        setPhase('result');
        if (newScore >= 8) {
          confetti({ particleCount: 250, spread: 90, origin: { y: 0.6 } });
        }
        return;
      }
      setCurrentIndex(next);
      setLocked(false);
    }, 350);
  };

  const currentTask = selected[currentIndex];

  return (
    <div
      className="fixed inset-0 h-[100dvh] w-screen z-[100] flex flex-col bg-slate-950 text-white font-sans select-none"
      style={{ touchAction: 'none' }}
    >
      <div className="shrink-0 p-4 landscape:py-2 landscape:px-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur-md relative z-10">
        <button
          onClick={() => {
            stopIntro();
            onClose();
          }}
          className="p-2 landscape:p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
        >
          <XCircle className="w-7 h-7 landscape:w-6 landscape:h-6" />
        </button>
        <div className="text-center flex flex-col items-center px-2">
          <h2 className="text-sm sm:text-lg landscape:text-sm font-bold truncate max-w-[280px] sm:max-w-md text-slate-100">
            {itemCode} — {itemText}
          </h2>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-1">
            {phase === 'prep' && 'HAZIRLIK'}
            {phase === 'running' && `DEĞERLENDİRME · ${currentIndex + 1} / 10`}
            {phase === 'result' && 'SONUÇ'}
          </p>
        </div>
        <div className="w-10 landscape:w-8" />
      </div>

      <div
        className="flex-1 relative flex flex-col items-center justify-center p-3 sm:p-4 overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950"
        style={{ touchAction: 'none' }}
      >
        {phase === 'prep' && (
          <div
            className="w-full max-w-2xl animate-in zoom-in-95 duration-300 pb-6 space-y-5 overflow-y-auto max-h-full"
            style={{ touchAction: 'pan-y' }}
          >
            <div className="text-center">
              <Users
                size={44}
                className="mx-auto text-violet-500 mb-3 drop-shadow-[0_0_12px_rgba(139,92,246,0.4)]"
              />
              <h1 className="text-2xl font-black mb-2">Grup Yönergesi Hazırlığı</h1>
              <p className="text-slate-400 text-sm leading-relaxed px-2">
                Bu oturumda <span className="text-violet-300 font-semibold">10 basit grup yönergesi</span>{' '}
                sorulacak. Yönergeler çoğul emir kipiyle verilir (ör.{' '}
                <span className="text-white font-medium">"Kalkın"</span>,{' '}
                <span className="text-white font-medium">"Bana bakın"</span>).{' '}
                <span className="text-slate-500">"Hepiniz / herkes" demeye gerek yoktur.</span>{' '}
                İstemediğin yönergeye dokunarak değiştirebilirsin. Giriş sesini dinleyebilir veya atlayabilirsin.
              </p>
            </div>

            <div className="space-y-2 max-h-[42dvh] overflow-y-auto pr-1">
              {selected.map((task, i) => (
                <button
                  key={`${task.id}-${i}`}
                  type="button"
                  onClick={() => replaceTask(i)}
                  className="w-full flex items-start gap-3 p-3 rounded-xl border border-slate-700 bg-slate-900/70 hover:border-violet-500/50 hover:bg-slate-800/80 text-left transition-all group"
                >
                  <span className="min-w-[28px] h-7 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-400">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100 leading-snug">{task.text}</p>
                    {task.materials.length > 0 && (
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {task.materials.join(', ')}
                      </span>
                    )}
                  </div>
                  <RefreshCw
                    size={14}
                    className="text-slate-600 group-hover:text-violet-400 shrink-0 mt-1"
                  />
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
              <div className="flex items-center gap-2 mb-2 text-slate-300">
                <Box size={16} className="text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Hazır bulundurulacak malzemeler
                </span>
              </div>
              {materialsList.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Ekstra malzeme gerekmiyor (beden hareketleri / grup düzeni).
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {materialsList.map((m) => (
                    <span
                      key={m}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs font-medium"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={startAssessment}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white px-6 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-violet-900/40 active:scale-95 transition-all"
            >
              <PlayCircle size={22} /> Değerlendirmeyi Başlat
            </button>
          </div>
        )}

        {phase === 'running' && currentTask && (
          <div className="w-full max-w-3xl flex flex-col items-center animate-in slide-in-from-right-6 duration-300">
            <div className="w-full bg-slate-800/60 border-2 border-slate-700 rounded-[2rem] p-5 md:p-10 flex flex-col items-center shadow-2xl mb-4 min-h-[200px] justify-center">
              <span className="text-xs font-bold tracking-widest uppercase mb-3 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Gruba söyleyin
              </span>
              <h1 className="text-3xl md:text-5xl font-black text-center text-white leading-tight">
                "{currentTask.text}"
              </h1>
              <p className="text-slate-500 text-sm mt-4 text-center max-w-md">
                Öğrenciler gruba verilen yönergeyi yerine getirirse{' '}
                <span className="text-green-400">Yaptı</span>, aksi halde{' '}
                <span className="text-red-400">Yapamadı</span>.
              </p>
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div className="flex flex-col items-center text-center p-8 bg-slate-900/90 rounded-3xl border border-slate-700 shadow-2xl max-w-xl animate-in zoom-in-95 duration-500">
            <Trophy
              size={72}
              className={
                score >= 8
                  ? 'text-yellow-500 mb-5 animate-bounce drop-shadow-[0_0_20px_rgba(234,179,8,0.4)]'
                  : 'text-slate-500 mb-5'
              }
            />
            <h1 className="text-3xl font-black mb-2">Değerlendirme Bitti!</h1>
            <p className="text-slate-400 mb-6 text-lg">
              Doğru: <span className="text-white font-black text-3xl mx-2">{score}</span> / 10
            </p>
            {score >= 8 ? (
              <div className="bg-green-500/10 text-green-400 border border-green-500/20 px-6 py-3 rounded-xl mb-8 font-bold flex items-center gap-2">
                <Check size={22} /> Kazanım başarıyla sağlandı!
              </div>
            ) : (
              <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-6 py-3 rounded-xl mb-8 font-bold flex items-center gap-2">
                <X size={22} /> Henüz yeterli bağımsızlık düzeyinde değil.
              </div>
            )}
            <button
              onClick={() => onComplete(score >= 8)}
              className="bg-violet-600 hover:bg-violet-500 text-white px-12 py-4 rounded-xl font-bold text-xl active:scale-95 shadow-xl shadow-violet-900/50 w-full sm:w-auto"
            >
              KAYDET VE ÇIK
            </button>
          </div>
        )}
      </div>

      {phase === 'running' && (
        <div className="shrink-0 p-5 pb-8 landscape:py-3 landscape:pb-4 bg-slate-900 border-t border-slate-800 flex items-stretch justify-center gap-3 relative z-10">
          <button
            onClick={() => handleAssess(false)}
            disabled={locked}
            className="flex-1 max-w-[260px] flex flex-col landscape:flex-row items-center justify-center gap-2 p-4 landscape:p-3 bg-red-500/10 border border-red-500/30 rounded-2xl active:scale-95 transition-all text-red-500 hover:bg-red-500/20 disabled:opacity-40"
          >
            <X className="w-9 h-9 landscape:w-6 landscape:h-6" />
            <span className="text-sm font-bold uppercase tracking-wider">Yapamadı</span>
          </button>
          <button
            onClick={() => handleAssess(true)}
            disabled={locked}
            className="flex-1 max-w-[260px] flex flex-col landscape:flex-row items-center justify-center gap-2 p-4 landscape:p-3 bg-green-500/10 border border-green-500/30 rounded-2xl active:scale-95 transition-all text-green-500 hover:bg-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)] disabled:opacity-40"
          >
            <Check className="w-9 h-9 landscape:w-6 landscape:h-6" />
            <span className="text-sm font-bold uppercase tracking-wider">Yaptı</span>
          </button>
        </div>
      )}
    </div>
  );
}
