import { useState, useEffect, useRef, useCallback } from 'react';
import { XCircle, Check, X, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

type ActKind = 'tap' | 'hold' | 'drag' | 'shake' | 'swipe' | 'toggle';

interface SceneItem {
  id: string;
  kind: ActKind;
  emoji: string;
  label: string;
  dropTarget?: string;
}

interface TripleTask {
  id: string;
  text: string;
  sequence: [string, string, string];
  items: SceneItem[];
}

const TASK_POOL: TripleTask[] = [
  {
    id: 't01',
    text: 'Yıldıza dokun, topu sepete koy, zile bas',
    sequence: ['star', 'ball', 'bell'],
    items: [
      { id: 'star', kind: 'tap', emoji: '⭐', label: 'Yıldız' },
      { id: 'ball', kind: 'drag', emoji: '⚽', label: 'Top', dropTarget: 'basket' },
      { id: 'basket', kind: 'tap', emoji: '🧺', label: 'Sepet' },
      { id: 'bell', kind: 'tap', emoji: '🔔', label: 'Zil' },
      { id: 'trash', kind: 'tap', emoji: '🗑️', label: 'Çöp' },
    ],
  },
  {
    id: 't02',
    text: 'Kalbe basılı tut, kartı kaydır, anahtarı çevir',
    sequence: ['heart', 'card', 'key'],
    items: [
      { id: 'heart', kind: 'hold', emoji: '❤️', label: 'Kalp' },
      { id: 'card', kind: 'swipe', emoji: '🃏', label: 'Kart' },
      { id: 'key', kind: 'toggle', emoji: '🔑', label: 'Anahtar' },
      { id: 'star', kind: 'tap', emoji: '⭐', label: 'Yıldız' },
      { id: 'bell', kind: 'tap', emoji: '🔔', label: 'Zil' },
    ],
  },
  {
    id: 't03',
    text: 'Zile bas, yıldızı çöpe at, telefonu salla',
    sequence: ['bell', 'star', 'shake'],
    items: [
      { id: 'bell', kind: 'tap', emoji: '🔔', label: 'Zil' },
      { id: 'star', kind: 'drag', emoji: '⭐', label: 'Yıldız', dropTarget: 'trash' },
      { id: 'trash', kind: 'tap', emoji: '🗑️', label: 'Çöp' },
      { id: 'shake', kind: 'shake', emoji: '📱', label: 'Telefon' },
      { id: 'heart', kind: 'tap', emoji: '🧡', label: 'Kalp' },
    ],
  },
  {
    id: 't04',
    text: 'Yeşil düğmeye bas, topu kutuya koy, ışığı aç',
    sequence: ['green', 'ball', 'light'],
    items: [
      { id: 'green', kind: 'tap', emoji: '🟢', label: 'Yeşil' },
      { id: 'ball', kind: 'drag', emoji: '⚽', label: 'Top', dropTarget: 'box' },
      { id: 'box', kind: 'tap', emoji: '📦', label: 'Kutu' },
      { id: 'light', kind: 'toggle', emoji: '💡', label: 'Işık' },
      { id: 'red', kind: 'tap', emoji: '🔴', label: 'Kırmızı' },
    ],
  },
  {
    id: 't05',
    text: 'Balonu patlat, kartı kaydır, kalbi basılı tut',
    sequence: ['balloon', 'card', 'heart'],
    items: [
      { id: 'balloon', kind: 'tap', emoji: '🪇', label: 'Balon' },
      { id: 'card', kind: 'swipe', emoji: '📝', label: 'Kart' },
      { id: 'heart', kind: 'hold', emoji: '❤️', label: 'Kalp' },
      { id: 'star', kind: 'tap', emoji: '⭐', label: 'Yıldız' },
      { id: 'bell', kind: 'tap', emoji: '🔔', label: 'Zil' },
    ],
  },
  {
    id: 't06',
    text: 'Kilidi aç, yıldıza dokun, telefonu salla',
    sequence: ['lock', 'star', 'shake'],
    items: [
      { id: 'lock', kind: 'toggle', emoji: '🔒', label: 'Kilit' },
      { id: 'star', kind: 'tap', emoji: '⭐', label: 'Yıldız' },
      { id: 'shake', kind: 'shake', emoji: '📱', label: 'Telefon' },
      { id: 'heart', kind: 'tap', emoji: '🧡', label: 'Kalp' },
      { id: 'trash', kind: 'tap', emoji: '🗑️', label: 'Çöp' },
    ],
  },
  {
    id: 't07',
    text: 'Topu sepete koy, zile bas, kartı kaydır',
    sequence: ['ball', 'bell', 'card'],
    items: [
      { id: 'ball', kind: 'drag', emoji: '🏀', label: 'Top', dropTarget: 'basket' },
      { id: 'basket', kind: 'tap', emoji: '🧺', label: 'Sepet' },
      { id: 'bell', kind: 'tap', emoji: '🔔', label: 'Zil' },
      { id: 'card', kind: 'swipe', emoji: '🃏', label: 'Kart' },
      { id: 'star', kind: 'tap', emoji: '⭐', label: 'Yıldız' },
    ],
  },
  {
    id: 't08',
    text: 'Onaya bas, kalbi basılı tut, ışığı aç',
    sequence: ['ok', 'heart', 'light'],
    items: [
      { id: 'ok', kind: 'tap', emoji: '✅', label: 'Onay' },
      { id: 'heart', kind: 'hold', emoji: '🧡', label: 'Kalp' },
      { id: 'light', kind: 'toggle', emoji: '💡', label: 'Işık' },
      { id: 'bell', kind: 'tap', emoji: '🔔', label: 'Zil' },
      { id: 'red', kind: 'tap', emoji: '❌', label: 'Hayır' },
    ],
  },
  {
    id: 't09',
    text: 'Yıldızı çöpe at, yeşile bas, telefonu salla',
    sequence: ['star', 'green', 'shake'],
    items: [
      { id: 'star', kind: 'drag', emoji: '⭐', label: 'Yıldız', dropTarget: 'trash' },
      { id: 'trash', kind: 'tap', emoji: '🗑️', label: 'Çöp' },
      { id: 'green', kind: 'tap', emoji: '🟢', label: 'Yeşil' },
      { id: 'shake', kind: 'shake', emoji: '📱', label: 'Telefon' },
      { id: 'heart', kind: 'tap', emoji: '❤️', label: 'Kalp' },
    ],
  },
  {
    id: 't10',
    text: 'Kartı kaydır, zile bas, topu kutuya koy',
    sequence: ['card', 'bell', 'ball'],
    items: [
      { id: 'card', kind: 'swipe', emoji: '📝', label: 'Kart' },
      { id: 'bell', kind: 'tap', emoji: '🔔', label: 'Zil' },
      { id: 'ball', kind: 'drag', emoji: '⚽', label: 'Top', dropTarget: 'box' },
      { id: 'box', kind: 'tap', emoji: '📦', label: 'Kutu' },
      { id: 'star', kind: 'tap', emoji: '⭐', label: 'Yıldız' },
    ],
  },
  {
    id: 't11',
    text: 'Anahtarı çevir, yıldıza dokun, kalbi basılı tut',
    sequence: ['key', 'star', 'heart'],
    items: [
      { id: 'key', kind: 'toggle', emoji: '🔑', label: 'Anahtar' },
      { id: 'star', kind: 'tap', emoji: '⭐', label: 'Yıldız' },
      { id: 'heart', kind: 'hold', emoji: '❤️', label: 'Kalp' },
      { id: 'bell', kind: 'tap', emoji: '🔔', label: 'Zil' },
      { id: 'trash', kind: 'tap', emoji: '🗑️', label: 'Çöp' },
    ],
  },
  {
    id: 't12',
    text: 'Telefonu salla, onaya bas, kartı kaydır',
    sequence: ['shake', 'ok', 'card'],
    items: [
      { id: 'shake', kind: 'shake', emoji: '📱', label: 'Telefon' },
      { id: 'ok', kind: 'tap', emoji: '✅', label: 'Onay' },
      { id: 'card', kind: 'swipe', emoji: '🃏', label: 'Kart' },
      { id: 'star', kind: 'tap', emoji: '⭐', label: 'Yıldız' },
      { id: 'heart', kind: 'tap', emoji: '🧡', label: 'Kalp' },
    ],
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ItemTile({
  item,
  disabled,
  done,
  isDropHighlight,
  onAction,
}: {
  item: SceneItem;
  disabled: boolean;
  done: boolean;
  isDropHighlight?: boolean;
  onAction: (itemId: string, meta?: { dropOn?: string }) => void;
}) {
  const holdTimer = useRef<number | null>(null);
  const holdStart = useRef(0);
  const [holdP, setHoldP] = useState(0);
  const swipeStart = useRef(0);
  const [swipeDx, setSwipeDx] = useState(0);
  const [toggled, setToggled] = useState(false);
  const dragging = useRef(false);
  const [dragStyle, setDragStyle] = useState<{ left: number; top: number } | null>(null);
  const doneShake = useRef(false);

  useEffect(() => {
    if (item.kind !== 'shake' || done || disabled) return;
    doneShake.current = false;
    const handler = (e: DeviceMotionEvent) => {
      if (doneShake.current) return;
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
      if (mag > 18) {
        doneShake.current = true;
        onAction(item.id);
      }
    };
    const req = async () => {
      try {
        const DOM = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
        if (typeof DOM.requestPermission === 'function') await DOM.requestPermission();
      } catch {
        /* ignore */
      }
      window.addEventListener('devicemotion', handler);
    };
    req();
    return () => window.removeEventListener('devicemotion', handler);
  }, [item.kind, item.id, done, disabled, onAction]);

  const clearHold = () => {
    if (holdTimer.current) cancelAnimationFrame(holdTimer.current);
    holdTimer.current = null;
    setHoldP(0);
  };

  const baseCls = `relative w-[4.75rem] h-[4.75rem] sm:w-24 sm:h-24 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all select-none touch-none ${
    done
      ? 'opacity-35 border-emerald-500/40 bg-emerald-500/10'
      : isDropHighlight
        ? 'border-sky-400 bg-sky-500/20 scale-105'
        : 'border-slate-600 bg-slate-800/90'
  } ${disabled && !done ? 'opacity-60' : ''}`;

  if (item.kind === 'tap') {
    return (
      <button
        type="button"
        disabled={disabled || done}
        onClick={() => onAction(item.id)}
        className={baseCls + ' active:scale-95'}
      >
        <span className="text-3xl sm:text-4xl leading-none">{item.emoji}</span>
        <span className="text-[9px] font-bold text-slate-400 uppercase">{item.label}</span>
      </button>
    );
  }

  if (item.kind === 'hold') {
    const tick = () => {
      const p = Math.min(1, (Date.now() - holdStart.current) / 850);
      setHoldP(p);
      if (p >= 1) {
        onAction(item.id);
        return;
      }
      holdTimer.current = requestAnimationFrame(tick);
    };
    return (
      <button
        type="button"
        disabled={disabled || done}
        onPointerDown={(e) => {
          e.preventDefault();
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          holdStart.current = Date.now();
          tick();
        }}
        onPointerUp={clearHold}
        onPointerLeave={clearHold}
        onPointerCancel={clearHold}
        className={baseCls + ' overflow-hidden'}
      >
        <div className="absolute bottom-0 left-0 right-0 bg-rose-500/35" style={{ height: `${holdP * 100}%` }} />
        <span className="text-3xl sm:text-4xl leading-none relative z-10">{item.emoji}</span>
        <span className="text-[9px] font-bold text-slate-400 uppercase relative z-10">Tut</span>
      </button>
    );
  }

  if (item.kind === 'toggle') {
    return (
      <button
        type="button"
        disabled={disabled || done}
        onClick={() => {
          if (toggled) return;
          setToggled(true);
          onAction(item.id);
        }}
        className={baseCls + (toggled ? ' bg-emerald-500/25 border-emerald-400' : '')}
      >
        <span className="text-3xl sm:text-4xl leading-none">{item.emoji}</span>
        <span className="text-[9px] font-bold text-slate-400 uppercase">Çevir</span>
      </button>
    );
  }

  if (item.kind === 'swipe') {
    return (
      <div
        className={baseCls}
        style={{ transform: `translateX(${Math.max(-40, Math.min(40, swipeDx))}px)` }}
        onPointerDown={(e) => {
          if (disabled || done) return;
          swipeStart.current = e.clientX;
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (disabled || done) return;
          setSwipeDx(e.clientX - swipeStart.current);
        }}
        onPointerUp={() => {
          if (Math.abs(swipeDx) > 45) onAction(item.id);
          setSwipeDx(0);
        }}
        onPointerCancel={() => setSwipeDx(0)}
      >
        <span className="text-3xl sm:text-4xl leading-none">{item.emoji}</span>
        <span className="text-[9px] font-bold text-slate-400 uppercase">Kaydır</span>
      </div>
    );
  }

  if (item.kind === 'shake') {
    return (
      <div className={baseCls + (!done && !disabled ? ' animate-pulse border-violet-400/60' : '')}>
        <span className="text-3xl sm:text-4xl leading-none">{item.emoji}</span>
        <span className="text-[9px] font-bold text-violet-300 uppercase">Salla</span>
      </div>
    );
  }

  if (item.kind === 'drag') {
    return (
      <div
        className={baseCls + ' cursor-grab active:cursor-grabbing'}
        style={
          dragStyle
            ? { position: 'fixed', left: dragStyle.left, top: dragStyle.top, zIndex: 80, pointerEvents: 'none' }
            : undefined
        }
        onPointerDown={(e) => {
          if (disabled || done) return;
          e.preventDefault();
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          dragging.current = true;
          setDragStyle({ left: e.clientX - 40, top: e.clientY - 40 });
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          setDragStyle({ left: e.clientX - 40, top: e.clientY - 40 });
        }}
        onPointerUp={(e) => {
          if (!dragging.current) return;
          dragging.current = false;
          setDragStyle(null);
          const els = document.elementsFromPoint(e.clientX, e.clientY);
          const dropEl = els.find((el) => el.getAttribute('data-drop-id'));
          const dropId = dropEl?.getAttribute('data-drop-id') || undefined;
          onAction(item.id, { dropOn: dropId });
        }}
        onPointerCancel={() => {
          dragging.current = false;
          setDragStyle(null);
        }}
      >
        <span className="text-3xl sm:text-4xl leading-none">{item.emoji}</span>
        <span className="text-[9px] font-bold text-slate-400 uppercase">Sürükle</span>
      </div>
    );
  }

  return null;
}

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
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [layoutItems, setLayoutItems] = useState<SceneItem[]>([]);

  const task = tasks[idx];
  const nextNeeded = task?.sequence[seqPos];

  useEffect(() => {
    if (!task) return;
    setLayoutItems(shuffle(task.items));
  }, [task?.id]);

  const finishTrial = useCallback(
    (correct: boolean) => {
      if (locked) return;
      setLocked(true);
      setFlash(correct ? 'ok' : 'bad');
      const newScore = score + (correct ? 1 : 0);
      setScore(newScore);
      if (correct) confetti({ particleCount: 45, spread: 50, origin: { y: 0.7 } });
      setTimeout(() => {
        const next = idx + 1;
        if (next >= 10) {
          setPhase('result');
          if (newScore >= 8) confetti({ particleCount: 220, spread: 90, origin: { y: 0.55 } });
          return;
        }
        setIdx(next);
        setSeqPos(0);
        setDoneIds(new Set());
        setFlash(null);
        setLocked(false);
      }, 750);
    },
    [locked, score, idx]
  );

  const onAction = useCallback(
    (itemId: string, meta?: { dropOn?: string }) => {
      if (locked || !task) return;
      const expected = task.sequence[seqPos];
      const item = task.items.find((i) => i.id === itemId);
      if (!item) return;

      // Drop targets are only valid as drop destinations, not as tap actions when not expected
      if (item.kind === 'drag') {
        if (!meta?.dropOn || meta.dropOn !== item.dropTarget) {
          if (itemId !== expected) finishTrial(false);
          return;
        }
      }

      if (itemId === expected) {
        setDoneIds((prev) => new Set(prev).add(itemId));
        const nextPos = seqPos + 1;
        if (nextPos >= 3) {
          setSeqPos(3);
          setTimeout(() => finishTrial(true), 300);
        } else {
          setSeqPos(nextPos);
        }
        return;
      }

      // Wrong item or out of order
      finishTrial(false);
    },
    [locked, task, seqPos, finishTrial]
  );

  return (
    <div
      className="fixed inset-0 h-[100dvh] w-screen z-[100] flex flex-col bg-slate-950 text-white font-sans select-none"
      style={{ touchAction: 'none' }}
    >
      <div className="shrink-0 p-3 sm:p-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/90 backdrop-blur-md z-10">
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white">
          <XCircle className="w-7 h-7" />
        </button>
        <div className="text-center px-2 min-w-0">
          <h2 className="text-sm sm:text-base font-bold truncate text-slate-100">
            {itemCode} — {itemText}
          </h2>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">
            {phase === 'running' && `DEĞERLENDİRME · ${idx + 1} / 10`}
            {phase === 'result' && 'SONUÇ'}
          </p>
        </div>
        <div className="w-10 text-right text-xs font-bold text-violet-400 tabular-nums">
          {phase === 'running' ? score : ''}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {phase === 'running' && task && (
          <>
            <div className="shrink-0 px-4 pt-3 pb-2 text-center space-y-2">
              <span className="inline-block text-[10px] font-bold tracking-widest uppercase text-violet-300 bg-violet-500/15 border border-violet-500/30 px-2.5 py-0.5 rounded-full">
                Üç yönergeyi sırayla hatırla ve yap
              </span>
              <h1 className="text-base sm:text-xl font-black leading-snug text-white max-w-lg mx-auto">
                {task.text}
              </h1>
              <div className="flex items-center justify-center gap-2 pt-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`h-2 w-10 rounded-full transition-colors ${
                      i < seqPos ? 'bg-emerald-400' : i === seqPos ? 'bg-violet-400' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-slate-500">
                Önünde 5 seçenek var · doğru üçünü söylenen sırada yap
              </p>
            </div>

            <div
              className={`flex-1 min-h-0 flex items-center justify-center px-3 pb-2 relative ${
                flash === 'ok' ? 'bg-emerald-500/5' : flash === 'bad' ? 'bg-red-500/10' : ''
              }`}
            >
              <div className="grid grid-cols-3 gap-3 sm:gap-4 place-items-center content-center max-w-md w-full">
                {layoutItems.map((it) => {
                  const isDone = doneIds.has(it.id);
                  const isDropSurface =
                    it.id === 'basket' || it.id === 'box' || it.id === 'trash' ||
                    task.items.some((x) => x.dropTarget === it.id);
                  return (
                    <div
                      key={it.id}
                      data-drop-id={isDropSurface ? it.id : undefined}
                      className="flex items-center justify-center"
                    >
                      <ItemTile
                        item={it}
                        disabled={locked}
                        done={isDone}
                        isDropHighlight={
                          !!nextNeeded &&
                          task.items.find((x) => x.id === nextNeeded)?.dropTarget === it.id
                        }
                        onAction={onAction}
                      />
                    </div>
                  );
                })}
              </div>

              {flash === 'ok' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-emerald-500 text-white p-3 rounded-full shadow-lg">
                    <Check size={36} strokeWidth={3} />
                  </div>
                </div>
              )}
              {flash === 'bad' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-red-500 text-white p-3 rounded-full shadow-lg">
                    <X size={36} strokeWidth={3} />
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 p-4 pb-6 border-t border-slate-800 bg-slate-900/95 space-y-2">
              <div className="flex gap-3 max-w-md mx-auto">
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => finishTrial(false)}
                  className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 disabled:opacity-40 active:scale-95"
                >
                  <X className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase">Yapamadı</span>
                </button>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => finishTrial(true)}
                  className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 disabled:opacity-40 active:scale-95"
                >
                  <Check className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase">Yaptı</span>
                </button>
              </div>
              <p className="text-[10px] text-center text-slate-500">
                Yanlış seçenek veya yanlış sıra = başarısız. Öğretmen butonları açık.
              </p>
            </div>
          </>
        )}

        {phase === 'result' && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="flex flex-col items-center text-center p-8 bg-slate-900/90 rounded-3xl border border-slate-700 shadow-2xl max-w-xl w-full animate-in zoom-in-95 duration-500">
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
          </div>
        )}
      </div>
    </div>
  );
}
