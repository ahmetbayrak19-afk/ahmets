import { useState, useEffect, useRef, useCallback } from 'react';
import { XCircle, Check, X, Trophy } from 'lucide-react';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import sepetTopImg from './sesgorsel/Sepeticindetop.png';
import onaySes from './sesgorsel/onay.mp3';
import { TASK_POOL, SES41_BY_ID, ses41, type SceneItem } from './yonerge12Data';
import {
  shuffle, playFx, playNeutralTransition,
  DrawOverlay, FloatingBalloon, DragItem, TileShell, ItemVisual,
  MarakasTile, BellTile, HoldTile, SwipeTile,
} from './yonerge12Helpers';

interface Yonerge12Props {
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

type Phase = 'running' | 'result';

export default function Yonerge12({
  itemCode = 'YTB 4.1',
  itemText = 'Birbirinden Bağımsız Üç Yönergeyi Yerine Getirme',
  onClose,
  onComplete,
}: Yonerge12Props) {
  const [tasks] = useState(() => shuffle(TASK_POOL).slice(0, 10));
  const [phase, setPhase] = useState<Phase>('running');
  const [idx, setIdx] = useState(0);
  const [seqPos, setSeqPos] = useState(0);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [mergedIds, setMergedIds] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [layoutItems, setLayoutItems] = useState<SceneItem[]>([]);
  const [drawingId, setDrawingId] = useState<string | null>(null);
  const [balloonKey, setBalloonKey] = useState(0);
  const trialFailedRef = useRef(false);

  const task = tasks[idx];
  const instrAudioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (!task) return;
    const src = ses41(SES41_BY_ID[task.id] || '');
    if (!src) return;
    try {
      if (instrAudioRef.current) { instrAudioRef.current.pause(); instrAudioRef.current = null; }
      const a = new Audio(src);
      a.volume = 1;
      instrAudioRef.current = a;
      a.play().catch(() => {});
    } catch { /* */ }
    return () => {
      if (instrAudioRef.current) { instrAudioRef.current.pause(); instrAudioRef.current = null; }
    };
  }, [task?.id]);

  const expected = task?.sequence[seqPos];
  const expectedKind = task?.items.find((i) => i.id === expected)?.kind;
  const pencilOpensDraw = expected === 'pencil' && task?.sequence[seqPos + 1] === 'draw';

  const lockPortrait = useCallback(async () => {
    try {
      if ((window as any).AndroidOrientation) {
        (window as any).AndroidOrientation.lockOrientation('portrait');
      } else {
        await ScreenOrientation.lock({ orientation: 'portrait' });
      }
    } catch (e) {
      console.log('Portrait lock hatası:', e);
    }
  }, []);

  const unlockOrientation = useCallback(async () => {
    try {
      if ((window as any).AndroidOrientation) {
        (window as any).AndroidOrientation.lockOrientation('unlock');
      } else {
        await ScreenOrientation.unlock();
      }
    } catch (e) {
      console.log('Unlock hatası:', e);
    }
  }, []);

  useEffect(() => {
    lockPortrait();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
      unlockOrientation();
    };
  }, [lockPortrait, unlockOrientation]);

  useEffect(() => {
    if (!task) return;
    setLayoutItems(shuffle(task.items.filter((i) => i.kind !== 'balloon' && i.kind !== 'draw')));
    setBalloonKey((k) => k + 1);
    setMergedIds(new Set());
    trialFailedRef.current = false;
  }, [task?.id]);

  const finishTrial = useCallback(
    async (correct: boolean) => {
      if (locked) return;
      setLocked(true);
      setDrawingId(null);
      const newScore = score + (correct ? 1 : 0);
      setScore(newScore);
      await playNeutralTransition();
      const next = idx + 1;
      if (next >= 10) {
        setPhase('result');
        return;
      }
      setIdx(next);
      setSeqPos(0);
      setDoneIds(new Set());
      trialFailedRef.current = false;
      setLocked(false);
    },
    [locked, score, idx]
  );

  // NOTE: resolveStep and UI are incomplete in this push - full helpers needed
  return (
    <div className="fixed inset-0 h-[100dvh] w-screen z-[100] flex flex-col bg-slate-950 text-white font-sans select-none overflow-hidden" style={{ touchAction: 'none' }}>
      <div className="shrink-0 px-3 py-2 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90 z-20">
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white"><XCircle className="w-6 h-6" /></button>
        <div className="text-center min-w-0 flex-1 px-2">
          <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">{phase === 'running' ? `${idx + 1}/10` : 'Sonuç'} · {itemCode}</p>
        </div>
        <div className="w-8 text-right text-xs font-bold text-violet-400 tabular-nums">{phase === 'running' ? score : ''}</div>
      </div>
      {phase === 'running' && task && (
        <>
          <div className="shrink-0 px-4 pt-3 pb-1 text-center">
            <div className="flex items-center justify-center gap-2 mt-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className={'h-1.5 w-8 rounded-full ' + (i < seqPos ? 'bg-emerald-400' : i === seqPos ? 'bg-violet-400' : 'bg-slate-700')} />
              ))}
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center px-6">
            <p className="text-slate-400 text-sm text-center">Yönerge sesi çalıyor — tam UI yükleniyor. Yaptı/Yapamadı kullanın.</p>
          </div>
          <div className="shrink-0 p-3 pb-5 border-t border-slate-800 bg-slate-900/95 flex gap-3 justify-center">
            <button type="button" disabled={locked} onClick={() => finishTrial(false)} className="flex-1 max-w-[160px] flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 disabled:opacity-40"><X className="w-5 h-5" /><span className="text-xs font-bold uppercase">Yapamadı</span></button>
            <button type="button" disabled={locked} onClick={() => finishTrial(true)} className="flex-1 max-w-[160px] flex items-center justify-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 disabled:opacity-40"><Check className="w-5 h-5" /><span className="text-xs font-bold uppercase">Yaptı</span></button>
          </div>
        </>
      )}
      {phase === 'result' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center text-center p-8 bg-slate-900/90 rounded-3xl border border-slate-700 max-w-xl w-full">
            <Trophy size={72} className={score >= 8 ? 'text-yellow-500 mb-5 animate-bounce' : 'text-slate-500 mb-5'} />
            <h1 className="text-3xl font-black mb-2">Değerlendirme Bitti!</h1>
            <p className="text-slate-400 mb-6 text-lg">Doğru: <span className="text-white font-black text-3xl mx-2">{score}</span> / 10</p>
            <button onClick={() => onComplete(score >= 8)} className="bg-violet-600 hover:bg-violet-500 text-white px-12 py-4 rounded-xl font-bold text-xl">KAYDET VE ÇIK</button>
          </div>
        </div>
      )}
    </div>
  );
}
