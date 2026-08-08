import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { XCircle, Check, X, Trophy } from 'lucide-react';
import { ScreenOrientation } from '@capacitor/screen-orientation';

import onaySes from './sesgorsel/onay.mp3';
import devametNotr from '@/aba/esle/ses/devametnotr.mp3';
import devamet2Notr from '@/aba/esle/ses/devamet2notr.mp3';
import simdisiradakiNotr from '@/aba/esle/ses/simdisiradakinotr.mp3';

const NEUTRAL_SOUNDS = [devametNotr, devamet2Notr, simdisiradakiNotr];

type SceneType = 'candle' | 'teeth' | 'hair' | 'sleep' | 'teacher';
interface Trial { id: string; type: SceneType; text: string; }

const TRIALS: Trial[] = [
  { id: 't1', type: 'candle', text: 'Yanan eli kurtar!' },
  { id: 't2', type: 'teeth', text: 'Çocuğun dişlerini temizle' },
  { id: 't3', type: 'hair', text: 'Çocuğun saçını tara' },
  { id: 't4', type: 'sleep', text: 'Uykusu gelen çocuğu uyut' },
  { id: 't5', type: 'teacher', text: 'Elleri kirli, yıka' },
  { id: 't6', type: 'teacher', text: 'Ayakkabı bağları açık, bağla' },
  { id: 't7', type: 'teacher', text: 'Oda karanlık, ışığı aç' },
  { id: 't8', type: 'teacher', text: 'Kapı açık kalmış, kapat' },
  { id: 't9', type: 'teacher', text: 'Masa dağınık, topla' },
  { id: 't10', type: 'teacher', text: 'Pencere açık ve üşüyor, kapat' },
];

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

interface Yonerge13Props { itemCode?: string; itemText?: string; onClose: () => void; onComplete: (success: boolean) => void; }
type Phase = 'running' | 'result';

export default function Yonerge13({ itemCode = 'YTB 4.2', itemText = 'Mantık Kurarak Yönergeleri Yerine Getirme', onClose, onComplete }: Yonerge13Props) {
  const [phase, setPhase] = useState<Phase>('running');
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const trial = TRIALS[idx];

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
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
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
    setIdx(next); setLocked(false);
  }, [locked, score, idx]);

  return (
    <div className="fixed inset-0 h-[100dvh] w-screen z-[100] flex flex-col bg-slate-950 text-white font-sans select-none overflow-hidden" style={{ touchAction: 'none' }}>
      <div className="shrink-0 px-3 py-2 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90 z-20">
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white"><XCircle className="w-6 h-6" /></button>
        <div className="text-center min-w-0 flex-1 px-2">
          <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">{phase === 'running' ? `${idx + 1}/10` : 'Sonuç'} · {itemCode}</p>
        </div>
        <div className="w-8 text-right text-xs font-bold text-violet-400 tabular-nums">{phase === 'running' ? score : ''}</div>
      </div>
      {phase === 'running' && trial && (
        <>
          <div className="shrink-0 px-4 pt-3 pb-2 text-center">
            <h1 className="text-base sm:text-xl font-black leading-snug text-white">{trial.text}</h1>
            {trial.type !== 'teacher' && (
              <p className="text-xs text-amber-400 mt-2">Dijital sahneler geçici olarak kapalı — tam sürüm yükleniyor</p>
            )}
          </div>
          <div className="relative flex-1 min-h-0 flex flex-col items-center justify-center px-6">
            <p className="text-lg text-slate-300 text-center font-medium">
              {trial.type === 'teacher' ? 'Öğretmen ile yapın.' : 'Bu deneme için Yapamadı / Yaptı kullanın.'}
              <br /><span className="text-sm text-slate-500">Aşağıdaki butonlardan işaretleyin.</span>
            </p>
          </div>
          <div className="shrink-0 p-3 pb-5 border-t border-slate-800 bg-slate-900/95 flex gap-3 justify-center">
            <button type="button" disabled={locked} onClick={() => finishTrial(false)} className="flex-1 max-w-[160px] flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 disabled:opacity-40 active:scale-95">
              <X className="w-5 h-5" /><span className="text-xs font-bold uppercase">Yapamadı</span>
            </button>
            <button type="button" disabled={locked} onClick={() => finishTrial(true)} className="flex-1 max-w-[160px] flex items-center justify-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 disabled:opacity-40 active:scale-95">
              <Check className="w-5 h-5" /><span className="text-xs font-bold uppercase">Yaptı</span>
            </button>
          </div>
        </>
      )}
      {phase === 'result' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center text-center p-8 bg-slate-900/90 rounded-3xl border border-slate-700 max-w-xl w-full">
            <Trophy size={72} className={score >= 8 ? 'text-yellow-500 mb-5 animate-bounce' : 'text-slate-500 mb-5'} />
            <h1 className="text-3xl font-black mb-2">Değerlendirme Bitti!</h1>
            <p className="text-slate-400 mb-6 text-lg">Doğru: <span className="text-white font-black text-3xl mx-2">{score}</span> / 10</p>
            {score >= 8 ? (
              <div className="bg-green-500/10 text-green-400 border border-green-500/20 px-6 py-3 rounded-xl mb-8 font-bold">Kazanım başarıyla sağlandı!</div>
            ) : (
              <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-6 py-3 rounded-xl mb-8 font-bold">Henüz yeterli bağımsızlık düzeyinde değil.</div>
            )}
            <button onClick={() => onComplete(score >= 8)} className="bg-violet-600 hover:bg-violet-500 text-white px-12 py-4 rounded-xl font-bold text-xl active:scale-95 w-full sm:w-auto">KAYDET VE ÇIK</button>
          </div>
        </div>
      )}
    </div>
  );
}
