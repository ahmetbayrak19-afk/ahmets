import { useState, useEffect, useCallback, useMemo } from 'react';
import { XCircle, Check, X, Trophy, RefreshCw } from 'lucide-react';
import { ScreenOrientation } from '@capacitor/screen-orientation';

import onaySes from './sesgorsel/onay.mp3';
import devametNotr from '@/aba/esle/ses/devametnotr.mp3';
import devamet2Notr from '@/aba/esle/ses/devamet2notr.mp3';
import simdisiradakiNotr from '@/aba/esle/ses/simdisiradakinotr.mp3';

const NEUTRAL_SOUNDS = [devametNotr, devamet2Notr, simdisiradakiNotr];

interface Task {
  id: string;
  text: string;
  set: 1 | 2 | 3 | 4;
}

/** 15 yönerge havuzu — kurum ortamı (lavabo, sınıf, dolap, koridor…) */
const POOL: Task[] = [
  { id: 'p1', set: 1, text: 'Kalemi al, dolaba koy' },
  { id: 'p2', set: 1, text: 'Kitabı al, öğretmen masasına götür' },
  { id: 'p3', set: 1, text: 'Topu al, oyun alanına bırak' },
  { id: 'p4', set: 1, text: 'Makası al, dolaba koy' },
  { id: 'p5', set: 2, text: 'Lavabodan sabunu getir' },
  { id: 'p6', set: 2, text: 'Yan sınıftan tahta silgisini getir' },
  { id: 'p7', set: 2, text: 'Dolaptan kalemi getir' },
  { id: 'p8', set: 2, text: 'Koridordaki sandalyeyi getir' },
  { id: 'p9', set: 3, text: 'Koridordaki ağaç resmini getir' },
  { id: 'p10', set: 3, text: 'Dolaptaki hayvan resmini getir' },
  { id: 'p11', set: 3, text: 'Panodaki sınıf listesini getir' },
  { id: 'p12', set: 4, text: 'Lavaboya git, ellerini yıka' },
  { id: 'p13', set: 4, text: 'Sınıfa git, kapıyı kapat' },
  { id: 'p14', set: 4, text: 'Koridora git, ışığı aç' },
  { id: 'p15', set: 4, text: 'Dolaba git, kapağı kapat' },
];

const SET_LABEL: Record<number, string> = {
  1: 'Nesneyi alana götür',
  2: 'Alandan nesne getir',
  3: 'Alandan resim getir',
  4: 'Alanda görev yap',
};

function playFx(src?: string) {
  if (!src) return;
  try { const a = new Audio(src); a.volume = 0.9; a.play().catch(() => {}); } catch { /* */ }
}

function playNeutralTransition(): Promise<void> {
  return new Promise((resolve) => {
    const src = NEUTRAL_SOUNDS[Math.floor(Math.random() * NEUTRAL_SOUNDS.length)];
    try {
      const a = new Audio(src); a.volume = 1;
      const done = () => resolve();
      a.addEventListener('ended', done, { once: true });
      a.addEventListener('error', done, { once: true });
      a.play().catch(done);
    } catch { resolve(); }
  });
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Yonerge15Props {
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

type Phase = 'running' | 'result';

export default function Yonerge15({
  itemCode = 'YTB 4.4',
  itemText = 'Söylenen Alana Gidip Verilen Yönergeyi Yerine Getirme',
  onClose,
  onComplete,
}: Yonerge15Props) {
  const [phase, setPhase] = useState<Phase>('running');
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [trials, setTrials] = useState<Task[]>(() => shuffle(POOL).slice(0, 10));

  const trial = trials[idx];
  const usedIds = useMemo(() => new Set(trials.map((t) => t.id)), [trials]);

  const lockPortrait = useCallback(async () => {
    try {
      if ((window as any).AndroidOrientation) (window as any).AndroidOrientation.lockOrientation('portrait');
      else await ScreenOrientation.lock({ orientation: 'portrait' });
    } catch (e) { console.log('Portrait lock hatası:', e); }
  }, []);
  const unlockOrientation = useCallback(async () => {
    try {
      if ((window as any).AndroidOrientation) (window as any).AndroidOrientation.lockOrientation('unlock');
      else await ScreenOrientation.unlock();
    } catch (e) { console.log('Unlock hatası:', e); }
  }, []);

  useEffect(() => {
    lockPortrait();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; unlockOrientation(); };
  }, [lockPortrait, unlockOrientation]);

  const finishTrial = useCallback(async (correct: boolean) => {
    if (locked) return;
    setLocked(true);
    const newScore = score + (correct ? 1 : 0);
    setScore(newScore);
    if (correct) playFx(onaySes);
    await playNeutralTransition();
    const next = idx + 1;
    if (next >= 10) { setPhase('result'); return; }
    setIdx(next);
    setLocked(false);
  }, [locked, score, idx]);

  const swapTrial = () => {
    if (locked || !trial) return;
    const candidates = POOL.filter((t) => !usedIds.has(t.id));
    if (candidates.length === 0) return;
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    setTrials((prev) => {
      const copy = [...prev];
      copy[idx] = next;
      return copy;
    });
  };

  return (
    <div
      className="fixed inset-0 h-[100dvh] w-screen z-[100] flex flex-col bg-slate-950 text-white font-sans select-none overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      <div className="shrink-0 px-3 py-2 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90 z-20">
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white">
          <XCircle className="w-6 h-6" />
        </button>
        <div className="text-center min-w-0 flex-1 px-2">
          <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
            {phase === 'running' ? `${idx + 1}/10` : 'Sonuç'} · {itemCode}
          </p>
        </div>
        <div className="w-8 text-right text-xs font-bold text-violet-400 tabular-nums">
          {phase === 'running' ? score : ''}
        </div>
      </div>

      {phase === 'running' && trial && (
        <>
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 overflow-y-auto">
            <div className="w-full max-w-3xl bg-slate-800/60 border-2 border-slate-700 rounded-[2rem] p-8 md:p-12 flex flex-col items-center shadow-2xl">
              <span className="text-blue-400 font-bold tracking-widest uppercase mb-3 text-sm">
                Öğrenciye söyleyin
              </span>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-4">
                {SET_LABEL[trial.set]}
              </p>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-center text-white leading-snug mb-6">
                "{trial.text}"
              </h1>
              <p className="text-slate-400 text-sm text-center max-w-md">
                Öğrenci söylenen alana gidip yönergeyi yerine getirsin.
              </p>
              <p className="text-slate-500 text-xs text-center mt-2">
                5–10 saniye içinde bağımsız yaparsa doğru sayılır.
              </p>
            </div>
          </div>

          <div className="shrink-0 p-3 pb-5 border-t border-slate-800 bg-slate-900/95 flex gap-3 justify-center items-center">
            <button
              type="button"
              disabled={locked}
              onClick={swapTrial}
              className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-slate-800 border border-slate-600 text-slate-300 disabled:opacity-40 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-xs font-bold">Değiştir</span>
            </button>
            <button
              type="button"
              disabled={locked}
              onClick={() => finishTrial(false)}
              className="flex-1 max-w-[140px] flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 disabled:opacity-40 active:scale-95"
            >
              <X className="w-5 h-5" />
              <span className="text-xs font-bold uppercase">Yapamadı</span>
            </button>
            <button
              type="button"
              disabled={locked}
              onClick={() => finishTrial(true)}
              className="flex-1 max-w-[140px] flex items-center justify-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 disabled:opacity-40 active:scale-95"
            >
              <Check className="w-5 h-5" />
              <span className="text-xs font-bold uppercase">Yaptı</span>
            </button>
          </div>
        </>
      )}

      {phase === 'result' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center text-center p-8 bg-slate-900/90 rounded-3xl border border-slate-700 max-w-xl w-full">
            <Trophy size={72} className={score >= 8 ? 'text-yellow-500 mb-5 animate-bounce' : 'text-slate-500 mb-5'} />
            <h1 className="text-3xl font-black mb-2">Değerlendirme Bitti!</h1>
            <p className="text-slate-400 mb-6 text-lg">
              Doğru: <span className="text-white font-black text-3xl mx-2">{score}</span> / 10
            </p>
            {score >= 8 ? (
              <div className="bg-green-500/10 text-green-400 border border-green-500/20 px-6 py-3 rounded-xl mb-8 font-bold">
                Kazanım başarıyla sağlandı!
              </div>
            ) : (
              <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-6 py-3 rounded-xl mb-8 font-bold">
                Henüz yeterli bağımsızlık düzeyinde değil.
              </div>
            )}
            <button
              onClick={() => onComplete(score >= 8)}
              className="bg-violet-600 hover:bg-violet-500 text-white px-12 py-4 rounded-xl font-bold text-xl active:scale-95 w-full sm:w-auto"
            >
              KAYDET VE ÇIK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
