import { useState, useEffect, useRef, useCallback } from 'react';
import {
  XCircle, Check, X, Trophy, Sparkles, Bell, Star, Trash2,
  Circle, Square, Heart, Zap, Lock, Key, Hand,
} from 'lucide-react';
import confetti from 'canvas-confetti';

/* ───────────────── types ───────────────── */

type StepKind =
  | 'tap'
  | 'drag'
  | 'shake'
  | 'hold'
  | 'swipe'
  | 'slider'
  | 'multiTap'
  | 'toggle'
  | 'draw'
  | 'cover';

interface StepDef {
  kind: StepKind;
  label: string; // short UI hint
  // kind-specific
  emoji?: string;
  targetEmoji?: string;
  color?: string;
  count?: number;
  holdMs?: number;
}

interface TripleTask {
  id: string;
  text: string; // natural teacher instruction
  steps: [StepDef, StepDef, StepDef];
}

/* ───────────────── task pool — varied & independent ───────────────── */

const TASK_POOL: TripleTask[] = [
  {
    id: 't01',
    text: 'Yıldıza dokun, topu sepete koy, telefonu salla',
    steps: [
      { kind: 'tap', label: 'Yıldıza dokun', emoji: '⭐', color: '#fbbf24' },
      { kind: 'drag', label: 'Topu sepete koy', emoji: '🪄', targetEmoji: '🧺', color: '#38bdf8' },
      { kind: 'shake', label: 'Telefonu salla' },
    ],
  },
  {
    id: 't02',
    text: 'Kırmızı kalbe basılı tut, kartı kaydır, anahtarı çevir',
    steps: [
      { kind: 'hold', label: 'Kalbe basılı tut', emoji: '❤️', holdMs: 900, color: '#f43f5e' },
      { kind: 'swipe', label: 'Kartı yana kaydır', emoji: '🃏' },
      { kind: 'toggle', label: 'Anahtarı çevir', emoji: '🔑' },
    ],
  },
  {
    id: 't03',
    text: 'Üç kez zile bas, çubugu sağa çek, ekranı kapat',
    steps: [
      { kind: 'multiTap', label: 'Üç kez zile bas', emoji: '🔔', count: 3, color: '#a78bfa' },
      { kind: 'slider', label: 'Çubuğu sağa çek' },
      { kind: 'tap', label: 'X’e bas', emoji: '✖️', color: '#94a3b8' },
    ],
  },
  {
    id: 't04',
    text: 'Yuvarlak çiz, yıldızı çöpe at, telefonu salla',
    steps: [
      { kind: 'draw', label: 'Yuvarlak çiz' },
      { kind: 'drag', label: 'Yıldızı çöpe at', emoji: '⭐', targetEmoji: '🗑️', color: '#fbbf24' },
      { kind: 'shake', label: 'Telefonu salla' },
    ],
  },
  {
    id: 't05',
    text: 'Ekranı avuçla kapat, yeşil düğmeye bas, ışığı aç',
    steps: [
      { kind: 'cover', label: 'Ekranı avuçla kapat' },
      { kind: 'tap', label: 'Yeşil düğmeye bas', emoji: '🟢', color: '#22c55e' },
      { kind: 'toggle', label: 'İşığı aç', emoji: '💡' },
    ],
  },
  {
    id: 't06',
    text: 'Balonu patlat, kaydırıcıyı sona getir, kalbi basılı tut',
    steps: [
      { kind: 'tap', label: 'Balonu patlat', emoji: '🪇', color: '#fb7185' },
      { kind: 'slider', label: 'Sona çek' },
      { kind: 'hold', label: 'Kalbi basılı tut', emoji: '🧡', holdMs: 800, color: '#f43f5e' },
    ],
  },
  {
    id: 't07',
    text: 'Kilit aç, çöpü süpür gibi kaydır, iki kez yıldıza dokun',
    steps: [
      { kind: 'toggle', label: 'Kilidi aç', emoji: '🔒' },
      { kind: 'swipe', label: 'Süpür gibi kaydır', emoji: '🧹' },
      { kind: 'multiTap', label: 'İki kez yıldıza dokun', emoji: '⭐', count: 2, color: '#fbbf24' },
    ],
  },
  {
    id: 't08',
    text: 'Topu kutuya koy, telefonu salla, onay işaretine bas',
    steps: [
      { kind: 'drag', label: 'Topu kutuya koy', emoji: '⚽', targetEmoji: '📦', color: '#94a3b8' },
      { kind: 'shake', label: 'Telefonu salla' },
      { kind: 'tap', label: 'Onaya bas', emoji: '✅', color: '#22c55e' },
    ],
  },
  {
    id: 't09',
    text: 'Çizgi çiz, düğmeyi basılı tut, kartı fırlat',
    steps: [
      { kind: 'draw', label: 'Çizgi çiz' },
      { kind: 'hold', label: 'Düğmeyi basılı tut', emoji: '🔵', holdMs: 1000, color: '#3b82f6' },
      { kind: 'swipe', label: 'Kartı fırlat', emoji: '📝' },
    ],
  },
  {
    id: 't10',
    text: 'Ekranı kapat gibi kapat, zili çal, çubuğu sağa sürükle',
    steps: [
      { kind: 'cover', label: 'Ekranı kapat' },
      { kind: 'tap', label: 'Zili çal', emoji: '🔔', color: '#c084fc' },
      { kind: 'slider', label: 'Çubuğu sağa sürükle' },
    ],
  },
  {
    id: 't11',
    text: 'Yıldızı sepete at, üç kez bas, telefonu salla',
    steps: [
      { kind: 'drag', label: 'Yıldızı sepete at', emoji: '⭐', targetEmoji: '🧺', color: '#fbbf24' },
      { kind: 'multiTap', label: 'Üç kez bas', emoji: '👆', count: 3, color: '#38bdf8' },
      { kind: 'shake', label: 'Telefonu salla' },
    ],
  },
  {
    id: 't12',
    text: 'Işığı aç, daire çiz, kırmızıya dokun',
    steps: [
      { kind: 'toggle', label: 'Işığı aç', emoji: '💡' },
      { kind: 'draw', label: 'Daire çiz' },
      { kind: 'tap', label: 'Kırmızıya dokun', emoji: '🔴', color: '#ef4444' },
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

/* ───────────────── step UIs ───────────────── */

function TapStep({
  step,
  onDone,
}: {
  step: StepDef;
  onDone: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onDone}
      className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl flex flex-col items-center justify-center gap-2 border-2 border-slate-600 bg-slate-800/80 active:scale-95 transition-transform shadow-xl"
      style={{ boxShadow: step.color ? `0 0 40px ${step.color}33` : undefined }}
    >
      <span className="text-6xl leading-none">{step.emoji || '👆'}</span>
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide px-2 text-center">
        Dokun
      </span>
    </button>
  );
}

function DragStep({
  step,
  onDone,
}: {
  step: StepDef;
  onDone: () => void;
}) {
  const [pos, setPos] = useState({ x: 40, y: 80 });
  const [dragging, setDragging] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !areaRef.current) return;
    const rect = areaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 36;
    const y = e.clientY - rect.top - 36;
    setPos({
      x: Math.max(0, Math.min(rect.width - 72, x)),
      y: Math.max(0, Math.min(rect.height - 72, y)),
    });
  };
  const onPointerUp = () => {
    setDragging(false);
    if (doneRef.current || !areaRef.current) return;
    const rect = areaRef.current.getBoundingClientRect();
    // target zone bottom-right
    const tx = rect.width - 90;
    const ty = rect.height - 90;
    const cx = pos.x + 36;
    const cy = pos.y + 36;
    if (Math.hypot(cx - (tx + 36), cy - (ty + 36)) < 70) {
      doneRef.current = true;
      onDone();
    }
  };

  return (
    <div
      ref={areaRef}
      className="relative w-full max-w-sm h-52 sm:h-60 rounded-2xl border border-slate-700 bg-slate-900/80 overflow-hidden touch-none"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="absolute bottom-3 right-3 w-[72px] h-[72px] rounded-2xl border-2 border-dashed border-slate-500 flex items-center justify-center text-4xl bg-slate-800/50">
        {step.targetEmoji || '🧺'}
      </div>
      <div
        className="absolute w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-4xl bg-slate-700 border border-slate-500 shadow-lg cursor-grab active:cursor-grabbing"
        style={{ left: pos.x, top: pos.y, touchAction: 'none' }}
        onPointerDown={onPointerDown}
      >
        {step.emoji || '⚽'}
      </div>
      <p className="absolute top-2 left-0 right-0 text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
        Sürükle → hedef
      </p>
    </div>
  );
}

function ShakeStep({ onDone }: { onDone: () => void }) {
  const doneRef = useRef(false);
  const lastRef = useRef(0);

  useEffect(() => {
    const threshold = 18;
    const handler = (e: DeviceMotionEvent) => {
      if (doneRef.current) return;
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
      const now = Date.now();
      if (mag > threshold && now - lastRef.current > 400) {
        lastRef.current = now;
        // require a second peak shortly after
        setTimeout(() => {
          if (doneRef.current) return;
          doneRef.current = true;
          onDone();
        }, 180);
      }
    };

    const request = async () => {
      try {
        const DOM = DeviceMotionEvent as unknown as {
          requestPermission?: () => Promise<string>;
        };
        if (typeof DOM.requestPermission === 'function') {
          await DOM.requestPermission();
        }
      } catch {
        /* ignore */
      }
      window.addEventListener('devicemotion', handler);
    };
    request();
    return () => window.removeEventListener('devicemotion', handler);
  }, [onDone]);

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="w-36 h-36 rounded-full border-4 border-violet-500/40 bg-violet-500/10 flex items-center justify-center animate-pulse">
        <span className="text-6xl">📱</span>
      </div>
      <p className="text-violet-300 font-bold text-lg animate-bounce">Salla!</p>
      <p className="text-xs text-slate-500 text-center max-w-[220px]">
        Telefonu iki elinle tutup güçlüce salla
      </p>
    </div>
  );
}

function HoldStep({
  step,
  onDone,
}: {
  step: StepDef;
  onDone: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const need = step.holdMs || 900;

  const clear = () => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    timerRef.current = null;
    setProgress(0);
  };

  const tick = () => {
    const p = Math.min(1, (Date.now() - startRef.current) / need);
    setProgress(p);
    if (p >= 1) {
      onDone();
      return;
    }
    timerRef.current = requestAnimationFrame(tick);
  };

  const down = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    startRef.current = Date.now();
    tick();
  };
  const up = () => clear();

  useEffect(() => () => clear(), []);

  return (
    <button
      type="button"
      onPointerDown={down}
      onPointerUp={up}
      onPointerLeave={up}
      onPointerCancel={up}
      className="relative w-40 h-40 rounded-full flex flex-col items-center justify-center border-4 border-slate-600 bg-slate-800 overflow-hidden active:scale-95"
    >
      <div
        className="absolute bottom-0 left-0 right-0 bg-rose-500/40 transition-all"
        style={{ height: `${progress * 100}%` }}
      />
      <span className="text-5xl relative z-10">{step.emoji || '❤️'}</span>
      <span className="text-[10px] font-bold text-slate-400 uppercase relative z-10 mt-1">
        Basılı tut
      </span>
    </button>
  );
}

function SwipeStep({
  step,
  onDone,
}: {
  step: StepDef;
  onDone: () => void;
}) {
  const startX = useRef(0);
  const [dx, setDx] = useState(0);
  const done = useRef(false);

  return (
    <div
      className="w-full max-w-xs h-36 relative touch-none"
      onPointerDown={(e) => {
        startX.current = e.clientX;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (done.current) return;
        setDx(e.clientX - startX.current);
      }}
      onPointerUp={() => {
        if (done.current) return;
        if (Math.abs(dx) > 90) {
          done.current = true;
          onDone();
        } else setDx(0);
      }}
    >
      <div
        className="absolute inset-x-4 top-4 bottom-4 rounded-2xl bg-slate-800 border border-slate-600 flex items-center justify-center text-5xl shadow-xl transition-transform"
        style={{ transform: `translateX(${dx}px) rotate(${dx * 0.05}deg)` }}
      >
        {step.emoji || '🃏'}
      </div>
      <p className="absolute -bottom-1 left-0 right-0 text-center text-[10px] text-slate-500 font-bold uppercase">
        Sola veya sağa kaydır
      </p>
    </div>
  );
}

function SliderStep({ onDone }: { onDone: () => void }) {
  const [val, setVal] = useState(0);
  const done = useRef(false);
  return (
    <div className="w-full max-w-xs space-y-3 px-2">
      <input
        type="range"
        min={0}
        max={100}
        value={val}
        onChange={(e) => {
          const v = Number(e.target.value);
          setVal(v);
          if (!done.current && v >= 92) {
            done.current = true;
            onDone();
          }
        }}
        className="w-full h-4 accent-sky-500 cursor-pointer"
      />
      <p className="text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
        Çubuğu sona çek · %{val}
      </p>
    </div>
  );
}

function MultiTapStep({
  step,
  onDone,
}: {
  step: StepDef;
  onDone: () => void;
}) {
  const need = step.count || 3;
  const [n, setN] = useState(0);
  return (
    <button
      type="button"
      onClick={() => {
        const next = n + 1;
        setN(next);
        if (next >= need) onDone();
      }}
      className="w-40 h-40 rounded-3xl border-2 border-violet-500/50 bg-violet-500/10 flex flex-col items-center justify-center gap-2 active:scale-95"
    >
      <span className="text-5xl">{step.emoji || '🔔'}</span>
      <span className="text-sm font-black text-violet-300">
        {n} / {need}
      </span>
    </button>
  );
}

function ToggleStep({
  step,
  onDone,
}: {
  step: StepDef;
  onDone: () => void;
}) {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        if (on) return;
        setOn(true);
        setTimeout(onDone, 280);
      }}
      className={`w-48 h-20 rounded-full border-2 flex items-center px-2 transition-all ${
        on ? 'bg-emerald-500/30 border-emerald-400' : 'bg-slate-800 border-slate-600'
      }`}
    >
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg transition-transform ${
          on ? 'translate-x-[5.5rem] bg-emerald-400' : 'translate-x-0 bg-slate-600'
        }`}
      >
        {step.emoji || '🔑'}
      </div>
    </button>
  );
}

function DrawStep({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const points = useRef<{ x: number; y: number }[]>([]);
  const done = useRef(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const parent = c.parentElement!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    c.width = w * dpr;
    c.height = h * dpr;
    c.style.width = `${w}px`;
    c.style.height = `${h}px`;
    const ctx = c.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#38bdf8';
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const checkEnough = () => {
    if (done.current) return;
    if (points.current.length < 18) return;
    let len = 0;
    for (let i = 1; i < points.current.length; i++) {
      const a = points.current[i - 1];
      const b = points.current[i];
      len += Math.hypot(a.x - b.x, a.y - b.y);
    }
    if (len > 100) {
      done.current = true;
      onDone();
    }
  };

  return (
    <div className="w-full max-w-xs h-44 rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden touch-none relative">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onPointerDown={(e) => {
          drawing.current = true;
          points.current = [pos(e)];
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const p = pos(e);
          points.current.push(p);
          const ctx = canvasRef.current!.getContext('2d')!;
          const pts = points.current;
          if (pts.length < 2) return;
          ctx.beginPath();
          ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }}
        onPointerUp={() => {
          drawing.current = false;
          checkEnough();
        }}
      />
      <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-slate-500 font-bold pointer-events-none">
        Parmakla çiz
      </p>
    </div>
  );
}

function CoverStep({ onDone }: { onDone: () => void }) {
  const [covering, setCovering] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const done = useRef(false);

  const start = () => {
    setCovering(true);
    timer.current = setTimeout(() => {
      if (!done.current) {
        done.current = true;
        onDone();
      }
    }, 700);
  };
  const stop = () => {
    setCovering(false);
    if (timer.current) clearTimeout(timer.current);
  };

  return (
    <div
      className={`w-full max-w-xs h-48 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors touch-none ${
        covering ? 'bg-slate-700 border-sky-400' : 'bg-slate-900 border-slate-600'
      }`}
      onPointerDown={(e) => {
        e.preventDefault();
        start();
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
    >
      <Hand size={48} className={covering ? 'text-sky-300' : 'text-slate-500'} />
      <p className="text-sm font-bold text-slate-400 text-center px-4">
        {covering ? 'Tutmaya devam…' : 'Avucunla ekranı kapat'}
      </p>
    </div>
  );
}

function StepPlayer({
  step,
  onDone,
}: {
  step: StepDef;
  onDone: () => void;
}) {
  switch (step.kind) {
    case 'tap':
      return <TapStep step={step} onDone={onDone} />;
    case 'drag':
      return <DragStep step={step} onDone={onDone} />;
    case 'shake':
      return <ShakeStep onDone={onDone} />;
    case 'hold':
      return <HoldStep step={step} onDone={onDone} />;
    case 'swipe':
      return <SwipeStep step={step} onDone={onDone} />;
    case 'slider':
      return <SliderStep onDone={onDone} />;
    case 'multiTap':
      return <MultiTapStep step={step} onDone={onDone} />;
    case 'toggle':
      return <ToggleStep step={step} onDone={onDone} />;
    case 'draw':
      return <DrawStep onDone={onDone} />;
    case 'cover':
      return <CoverStep onDone={onDone} />;
    default:
      return null;
  }
}

/* ───────────────── main component ───────────────── */

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
  const [stepIdx, setStepIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [stepDone, setStepDone] = useState([false, false, false]);

  const task = tasks[idx];
  const currentStep = task?.steps[stepIdx];

  const finishTrial = (correct: boolean) => {
    if (locked) return;
    setLocked(true);
    const newScore = score + (correct ? 1 : 0);
    setScore(newScore);
    if (correct) confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
    setTimeout(() => {
      const next = idx + 1;
      if (next >= 10) {
        setPhase('result');
        if (newScore >= 8) confetti({ particleCount: 220, spread: 90, origin: { y: 0.55 } });
        return;
      }
      setIdx(next);
      setStepIdx(0);
      setStepDone([false, false, false]);
      setLocked(false);
    }, 600);
  };

  const onStepComplete = useCallback(() => {
    setStepDone((prev) => {
      const copy = [...prev] as [boolean, boolean, boolean];
      copy[stepIdx] = true;
      return copy;
    });
    if (stepIdx >= 2) {
      // all three done
      setTimeout(() => finishTrial(true), 350);
    } else {
      setTimeout(() => setStepIdx((s) => s + 1), 320);
    }
  }, [stepIdx, locked, score, idx]);

  // reset step player when step changes by key
  const stepKey = `${task?.id}-${stepIdx}`;

  return (
    <div
      className="fixed inset-0 h-[100dvh] w-screen z-[100] flex flex-col bg-slate-950 text-white font-sans select-none"
      style={{ touchAction: 'none' }}
    >
      {/* header */}
      <div className="shrink-0 p-3 sm:p-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/90 backdrop-blur-md z-10">
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"
        >
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
            {/* instruction */}
            <div className="shrink-0 px-4 pt-3 pb-2 text-center space-y-2">
              <span className="inline-block text-[10px] font-bold tracking-widest uppercase text-violet-300 bg-violet-500/15 border border-violet-500/30 px-2.5 py-0.5 rounded-full">
                Üç bağımsız yönerge
              </span>
              <h1 className="text-lg sm:text-2xl font-black leading-snug text-white">
                {task.text}
              </h1>
              {/* progress pills */}
              <div className="flex items-center justify-center gap-2 pt-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`h-2 w-10 rounded-full transition-colors ${
                      stepDone[i]
                        ? 'bg-emerald-400'
                        : i === stepIdx
                          ? 'bg-violet-400'
                          : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Adım {stepIdx + 1}/3 · {currentStep?.label}
              </p>
            </div>

            {/* interactive area */}
            <div className="flex-1 min-h-0 flex items-center justify-center px-4 pb-2">
              {!locked && currentStep && (
                <div key={stepKey} className="w-full flex justify-center animate-in fade-in zoom-in-95 duration-300">
                  <StepPlayer step={currentStep} onDone={onStepComplete} />
                </div>
              )}
              {locked && (
                <div className="text-emerald-400 flex flex-col items-center gap-2">
                  <Check size={48} />
                  <span className="font-bold">Tamam!</span>
                </div>
              )}
            </div>

            {/* teacher override */}
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
                Üç adım da biterse otomatik doğru. Şüphede öğretmen butonları.
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
