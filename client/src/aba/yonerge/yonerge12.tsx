import { useState, useEffect, useRef, useCallback } from 'react';
import { XCircle, Check, X, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ScreenOrientation } from '@capacitor/screen-orientation';

import kirmiziBalon from './sesgorsel/kirmizibalon.png';
import maviBalon from './sesgorsel/mavibalon.png';

/* ═══════════════════════════════════════════════════════════
   YTB 4.1 — Üç bağımsız yönerge
   - 4–5 büyük nesne aynı anda (yazı yok)
   - Sırayla doğru eylem; yanlış hareket / yanlış sıra = başarısız
   - Eylem tipleri gerçekten farklı: tap, hold, drag, swipe, draw, shake, rotate, balloon
   ═══════════════════════════════════════════════════════════ */

type ActKind =
  | 'tap'
  | 'hold'
  | 'drag'
  | 'swipe'
  | 'draw'
  | 'shake'
  | 'rotate'
  | 'balloon' // süzülen balon — yalnızca sırası gelince patlat
  | 'target'; // sadece bırakma hedefi (sepet/kutu/çöp)

interface SceneItem {
  id: string;
  kind: ActKind;
  emoji: string;
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
      { id: 'star', kind: 'tap', emoji: '⭐' },
      { id: 'ball', kind: 'drag', emoji: '⚽', dropTarget: 'basket' },
      { id: 'basket', kind: 'target', emoji: '🧺' },
      { id: 'bell', kind: 'tap', emoji: '🔔' },
      { id: 'trash', kind: 'target', emoji: '🗑️' },
    ],
  },
  {
    id: 't02',
    text: 'Kalbe basılı tut, daire çiz, telefonu salla',
    sequence: ['heart', 'draw', 'shake'],
    items: [
      { id: 'heart', kind: 'hold', emoji: '❤️' },
      { id: 'draw', kind: 'draw', emoji: '✏️' },
      { id: 'shake', kind: 'shake', emoji: '📱' },
      { id: 'star', kind: 'tap', emoji: '⭐' },
      { id: 'bell', kind: 'tap', emoji: '🔔' },
    ],
  },
  {
    id: 't03',
    text: 'Zile bas, yıldızı çöpe at, balonu patlat',
    sequence: ['bell', 'star', 'balloon'],
    items: [
      { id: 'bell', kind: 'tap', emoji: '🔔' },
      { id: 'star', kind: 'drag', emoji: '⭐', dropTarget: 'trash' },
      { id: 'trash', kind: 'target', emoji: '🗑️' },
      { id: 'balloon', kind: 'balloon', emoji: '🎈' },
      { id: 'heart', kind: 'tap', emoji: '🧡' },
    ],
  },
  {
    id: 't04',
    text: 'Kartı kaydır, topu kutuya koy, telefonu çevir',
    sequence: ['card', 'ball', 'rotate'],
    items: [
      { id: 'card', kind: 'swipe', emoji: '🃏' },
      { id: 'ball', kind: 'drag', emoji: '⚽', dropTarget: 'box' },
      { id: 'box', kind: 'target', emoji: '📦' },
      { id: 'rotate', kind: 'rotate', emoji: '📳' },
      { id: 'star', kind: 'tap', emoji: '⭐' },
    ],
  },
  {
    id: 't05',
    text: 'Balonu patlat, kalbe basılı tut, çizgi çiz',
    sequence: ['balloon', 'heart', 'draw'],
    items: [
      { id: 'balloon', kind: 'balloon', emoji: '🎈' },
      { id: 'heart', kind: 'hold', emoji: '❤️' },
      { id: 'draw', kind: 'draw', emoji: '✏️' },
      { id: 'bell', kind: 'tap', emoji: '🔔' },
      { id: 'star', kind: 'tap', emoji: '⭐' },
    ],
  },
  {
    id: 't06',
    text: 'Yıldıza dokun, telefonu salla, kartı kaydır',
    sequence: ['star', 'shake', 'card'],
    items: [
      { id: 'star', kind: 'tap', emoji: '⭐' },
      { id: 'shake', kind: 'shake', emoji: '📱' },
      { id: 'card', kind: 'swipe', emoji: '🃏' },
      { id: 'heart', kind: 'hold', emoji: '🧡' },
      { id: 'bell', kind: 'tap', emoji: '🔔' },
    ],
  },
  {
    id: 't07',
    text: 'Topu sepete koy, balonu patlat, zile bas',
    sequence: ['ball', 'balloon', 'bell'],
    items: [
      { id: 'ball', kind: 'drag', emoji: '🏀', dropTarget: 'basket' },
      { id: 'basket', kind: 'target', emoji: '🧺' },
      { id: 'balloon', kind: 'balloon', emoji: '🎈' },
      { id: 'bell', kind: 'tap', emoji: '🔔' },
      { id: 'star', kind: 'tap', emoji: '⭐' },
    ],
  },
  {
    id: 't08',
    text: 'Daire çiz, yıldıza basılı tut, telefonu çevir',
    sequence: ['draw', 'star', 'rotate'],
    items: [
      { id: 'draw', kind: 'draw', emoji: '✏️' },
      { id: 'star', kind: 'hold', emoji: '⭐' },
      { id: 'rotate', kind: 'rotate', emoji: '📳' },
      { id: 'bell', kind: 'tap', emoji: '🔔' },
      { id: 'heart', kind: 'tap', emoji: '❤️' },
    ],
  },
  {
    id: 't09',
    text: 'Yıldızı çöpe at, telefonu salla, onaya bas',
    sequence: ['star', 'shake', 'ok'],
    items: [
      { id: 'star', kind: 'drag', emoji: '⭐', dropTarget: 'trash' },
      { id: 'trash', kind: 'target', emoji: '🗑️' },
      { id: 'shake', kind: 'shake', emoji: '📱' },
      { id: 'ok', kind: 'tap', emoji: '✅' },
      { id: 'heart', kind: 'tap', emoji: '🧡' },
    ],
  },
  {
    id: 't10',
    text: 'Kartı kaydır, balonu patlat, kalbe basılı tut',
    sequence: ['card', 'balloon', 'heart'],
    items: [
      { id: 'card', kind: 'swipe', emoji: '🃏' },
      { id: 'balloon', kind: 'balloon', emoji: '🎈' },
      { id: 'heart', kind: 'hold', emoji: '❤️' },
      { id: 'star', kind: 'tap', emoji: '⭐' },
      { id: 'bell', kind: 'tap', emoji: '🔔' },
    ],
  },
  {
    id: 't11',
    text: 'Zile bas, çizgi çiz, topu kutuya koy',
    sequence: ['bell', 'draw', 'ball'],
    items: [
      { id: 'bell', kind: 'tap', emoji: '🔔' },
      { id: 'draw', kind: 'draw', emoji: '✏️' },
      { id: 'ball', kind: 'drag', emoji: '⚽', dropTarget: 'box' },
      { id: 'box', kind: 'target', emoji: '📦' },
      { id: 'star', kind: 'tap', emoji: '⭐' },
    ],
  },
  {
    id: 't12',
    text: 'Telefonu çevir, yıldıza dokun, balonu patlat',
    sequence: ['rotate', 'star', 'balloon'],
    items: [
      { id: 'rotate', kind: 'rotate', emoji: '📳' },
      { id: 'star', kind: 'tap', emoji: '⭐' },
      { id: 'balloon', kind: 'balloon', emoji: '🎈' },
      { id: 'heart', kind: 'hold', emoji: '❤️' },
      { id: 'bell', kind: 'tap', emoji: '🔔' },
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

/* ───────── Draw overlay ───────── */
function DrawOverlay({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const points = useRef<{ x: number; y: number }[]>([]);
  const finished = useRef(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const parent = c.parentElement!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    c.width = Math.floor(w * dpr);
    c.height = Math.floor(h * dpr);
    c.style.width = `${w}px`;
    c.style.height = `${h}px`;
    const ctx = c.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#38bdf8';
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const check = () => {
    if (finished.current || points.current.length < 12) return;
    let len = 0;
    for (let i = 1; i < points.current.length; i++) {
      const a = points.current[i - 1];
      const b = points.current[i];
      len += Math.hypot(a.x - b.x, a.y - b.y);
    }
    if (len > 90) {
      finished.current = true;
      onDone();
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-slate-950/95">
      <div className="shrink-0 flex items-center justify-between px-4 py-2">
        <span className="text-sm font-bold text-sky-300">Çiz</span>
        <button type="button" onClick={onCancel} className="text-xs text-slate-400 px-3 py-1 rounded-lg border border-slate-700">
          Vazgeç
        </button>
      </div>
      <div className="flex-1 relative mx-3 mb-3 rounded-2xl overflow-hidden border border-slate-700 touch-none">
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
            const pts = points.current;
            pts.push(p);
            const ctx = canvasRef.current!.getContext('2d')!;
            if (pts.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }}
          onPointerUp={() => {
            drawing.current = false;
            check();
          }}
        />
      </div>
    </div>
  );
}

/* ───────── Floating balloon (görsel + confetti + sürekli yeniden doğuş) ───────── */
function FloatingBalloon({
  active,
  onPop,
  onWrongPop,
}: {
  active: boolean;
  onPop: () => void;
  onWrongPop: () => void;
}) {
  const [y, setY] = useState(110);
  const [x, setX] = useState(() => 18 + Math.random() * 64);
  const [img, setImg] = useState(() => (Math.random() > 0.5 ? kirmiziBalon : maviBalon));
  const [visible, setVisible] = useState(true);
  const [scale, setScale] = useState(1);
  const [burst, setBurst] = useState(false);
  const popped = useRef(false);
  const cycle = useRef(0);

  const startRise = useCallback(() => {
    setY(110);
    setX(18 + Math.random() * 64);
    setImg(Math.random() > 0.5 ? kirmiziBalon : maviBalon);
    setVisible(true);
    setScale(1);
    setBurst(false);
    popped.current = false;
    cycle.current += 1;
    const thisCycle = cycle.current;
    let raf = 0;
    let start: number | null = null;
    const dur = 8500 + Math.random() * 1500;
    const tick = (t: number) => {
      if (cycle.current !== thisCycle) return;
      if (start == null) start = t;
      const p = Math.min(1, (t - start) / dur);
      setY(110 - p * 130);
      if (p < 1 && !popped.current) {
        raf = requestAnimationFrame(tick);
      } else if (p >= 1 && !popped.current) {
        // Ekranın üstünden çıktı → kısa bekle, yeni balon gelsin
        setVisible(false);
        setTimeout(() => {
          if (cycle.current === thisCycle) startRise();
        }, 600);
      }
    };
    raf = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    startRise();
    return () => {
      cycle.current += 1; // iptal
    };
  }, [startRise]);

  const handlePop = (e: React.MouseEvent | React.PointerEvent) => {
    if (popped.current || burst) return;
    popped.current = true;
    setBurst(true);
    setScale(1.35);

    // Dokunulan noktada confetti
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const ox = (rect.left + rect.width / 2) / window.innerWidth;
    const oy = (rect.top + rect.height / 2) / window.innerHeight;
    confetti({
      particleCount: 90,
      spread: 70,
      startVelocity: 28,
      origin: { x: ox, y: oy },
      colors: ['#ef4444', '#3b82f6', '#fbbf24', '#f472b6', '#a78bfa'],
    });

    setTimeout(() => {
      setVisible(false);
      if (active) {
        onPop();
      } else {
        onWrongPop();
        // Yanlış patlatmada da yeni balon gelsin (deneme devam ediyorsa)
        setTimeout(() => startRise(), 400);
      }
    }, 220);
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      className="absolute z-30 leading-none active:scale-90 transition-transform duration-150"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        width: '5.8rem',
        height: '7.2rem',
      }}
      onClick={handlePop}
    >
      <img
        src={img}
        alt=""
        draggable={false}
        className={`w-full h-full object-contain drop-shadow-lg pointer-events-none select-none ${
          burst ? 'opacity-0 transition-opacity duration-150' : ''
        }`}
      />
    </button>
  );
}

/* ───────── Free drag layer ───────── */
function DragItem({
  emoji,
  disabled,
  done,
  onDrop,
}: {
  emoji: string;
  disabled: boolean;
  done: boolean;
  onDrop: (clientX: number, clientY: number) => void;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const tileRef = useRef<HTMLDivElement>(null);

  if (done) {
    return (
      <div className="w-[5.5rem] h-[5.5rem] sm:w-28 sm:h-28 rounded-3xl border-2 border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center opacity-30">
        <span className="text-5xl sm:text-6xl leading-none">{emoji}</span>
      </div>
    );
  }

  return (
    <div
      ref={tileRef}
      className={`w-[5.5rem] h-[5.5rem] sm:w-28 sm:h-28 rounded-3xl border-2 border-slate-600 bg-slate-800 flex items-center justify-center touch-none ${
        dragging.current || pos ? 'opacity-0' : ''
      } ${disabled ? 'opacity-50' : ''}`}
      onPointerDown={(e) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        dragging.current = true;
        origin.current = { x: e.clientX, y: e.clientY };
        setPos({ x: e.clientX, y: e.clientY });
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        setPos({ x: e.clientX, y: e.clientY });
      }}
      onPointerUp={(e) => {
        if (!dragging.current) return;
        dragging.current = false;
        setPos(null);
        onDrop(e.clientX, e.clientY);
      }}
      onPointerCancel={() => {
        dragging.current = false;
        setPos(null);
      }}
    >
      <span className="text-5xl sm:text-6xl leading-none pointer-events-none">{emoji}</span>
      {pos && (
        <div
          className="fixed z-[90] w-[5.5rem] h-[5.5rem] sm:w-28 sm:h-28 rounded-3xl border-2 border-sky-400 bg-slate-800 flex items-center justify-center shadow-2xl pointer-events-none"
          style={{ left: pos.x - 44, top: pos.y - 44 }}
        >
          <span className="text-5xl sm:text-6xl leading-none">{emoji}</span>
        </div>
      )}
    </div>
  );
}

/* ───────── Generic tile ───────── */
function TileShell({
  done,
  children,
  className = '',
}: {
  done?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-[5.5rem] h-[5.5rem] sm:w-28 sm:h-28 rounded-3xl border-2 flex items-center justify-center ${
        done
          ? 'opacity-30 border-emerald-500/30 bg-emerald-500/10'
          : 'border-slate-600 bg-slate-800'
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ───────── Main ───────── */

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
  const [drawingId, setDrawingId] = useState<string | null>(null);
  const [balloonKey, setBalloonKey] = useState(0);

  const task = tasks[idx];
  const expected = task?.sequence[seqPos];
  const expectedKind = task?.items.find((i) => i.id === expected)?.kind;

  // Portrait kilit — kavram isimlendirme ile aynı yöntem
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
    setLayoutItems(shuffle(task.items.filter((i) => i.kind !== 'balloon')));
    setBalloonKey((k) => k + 1);
  }, [task?.id]);

  const finishTrial = useCallback(
    (correct: boolean) => {
      if (locked) return;
      setLocked(true);
      setDrawingId(null);
      setFlash(correct ? 'ok' : 'bad');
      const newScore = score + (correct ? 1 : 0);
      setScore(newScore);
      if (correct) confetti({ particleCount: 50, spread: 55, origin: { y: 0.65 } });
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
      }, 700);
    },
    [locked, score, idx]
  );

  const advance = useCallback(
    (itemId: string) => {
      if (locked || !task) return;
      if (itemId !== expected) {
        finishTrial(false);
        return;
      }
      setDoneIds((prev) => new Set(prev).add(itemId));
      const nextPos = seqPos + 1;
      if (nextPos >= 3) {
        setSeqPos(3);
        setTimeout(() => finishTrial(true), 280);
      } else {
        setSeqPos(nextPos);
      }
    },
    [locked, task, expected, seqPos, finishTrial]
  );

  // Global shake
  useEffect(() => {
    if (phase !== 'running' || locked) return;
    let last = 0;
    const handler = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
      const now = Date.now();
      if (mag > 17 && now - last > 600) {
        last = now;
        if (expectedKind === 'shake') advance(expected!);
        else finishTrial(false);
      }
    };
    const req = async () => {
      try {
        const DOM = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
        if (typeof DOM.requestPermission === 'function') await DOM.requestPermission();
      } catch {
        /* */
      }
      window.addEventListener('devicemotion', handler);
    };
    req();
    return () => window.removeEventListener('devicemotion', handler);
  }, [phase, locked, expectedKind, expected, advance, finishTrial]);

  // Global rotate
  useEffect(() => {
    if (phase !== 'running' || locked) return;
    let baseBeta: number | null = null;
    let baseGamma: number | null = null;
    let fired = false;
    const handler = (e: DeviceOrientationEvent) => {
      if (fired) return;
      const beta = e.beta ?? 0;
      const gamma = e.gamma ?? 0;
      if (baseBeta == null) {
        baseBeta = beta;
        baseGamma = gamma;
        return;
      }
      const dB = Math.abs(beta - baseBeta);
      const dG = Math.abs(gamma - (baseGamma || 0));
      if (dB > 55 || dG > 55) {
        fired = true;
        if (expectedKind === 'rotate') advance(expected!);
        else finishTrial(false);
      }
    };
    const req = async () => {
      try {
        const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
        if (typeof DOE.requestPermission === 'function') await DOE.requestPermission();
      } catch {
        /* */
      }
      window.addEventListener('deviceorientation', handler);
    };
    req();
    return () => window.removeEventListener('deviceorientation', handler);
  }, [phase, locked, expectedKind, expected, advance, finishTrial, seqPos, idx]);

  const hasBalloon = task?.items.some((i) => i.kind === 'balloon');

  return (
    <div
      className="fixed inset-0 h-[100dvh] w-screen z-[100] flex flex-col bg-slate-950 text-white font-sans select-none overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* Header — compact */}
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

      {phase === 'running' && task && (
        <>
          {/* Instruction only */}
          <div className="shrink-0 px-4 pt-3 pb-1 text-center">
            <h1 className="text-lg sm:text-2xl font-black leading-snug text-white">{task.text}</h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 w-8 rounded-full ${
                    i < seqPos ? 'bg-emerald-400' : i === seqPos ? 'bg-violet-400' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Playfield */}
          <div
            className={`relative flex-1 min-h-0 flex items-center justify-center px-2 ${
              flash === 'ok' ? 'bg-emerald-500/5' : flash === 'bad' ? 'bg-red-500/10' : ''
            }`}
          >
            <div className="grid grid-cols-3 gap-4 sm:gap-5 place-items-center content-center w-full max-w-md">
              {layoutItems.map((it) => {
                const isDone = doneIds.has(it.id);

                if (it.kind === 'drag') {
                  return (
                    <DragItem
                      key={it.id}
                      emoji={it.emoji}
                      disabled={locked}
                      done={isDone}
                      onDrop={(cx, cy) => {
                        if (locked) return;
                        const els = document.elementsFromPoint(cx, cy);
                        const dropEl = els.find((el) => el.getAttribute('data-drop-id'));
                        const dropId = dropEl?.getAttribute('data-drop-id');
                        if (it.id === expected && dropId === it.dropTarget) {
                          advance(it.id);
                        } else if (it.id === expected) {
                          // doğru nesne, yanlış yer — soft
                        } else {
                          finishTrial(false);
                        }
                      }}
                    />
                  );
                }

                if (it.kind === 'target') {
                  return (
                    <div key={it.id} data-drop-id={it.id}>
                      <TileShell done={false}>
                        <span className="text-5xl sm:text-6xl leading-none pointer-events-none">{it.emoji}</span>
                      </TileShell>
                    </div>
                  );
                }

                if (it.kind === 'hold') {
                  return (
                    <HoldTile
                      key={it.id}
                      emoji={it.emoji}
                      done={isDone}
                      disabled={locked}
                      onHold={() => advance(it.id)}
                      onWrong={() => finishTrial(false)}
                      isExpected={expected === it.id}
                    />
                  );
                }

                if (it.kind === 'swipe') {
                  return (
                    <SwipeTile
                      key={it.id}
                      emoji={it.emoji}
                      done={isDone}
                      disabled={locked}
                      onSwipe={() => advance(it.id)}
                      onWrong={() => finishTrial(false)}
                      isExpected={expected === it.id}
                    />
                  );
                }

                if (it.kind === 'draw') {
                  return (
                    <button
                      key={it.id}
                      type="button"
                      disabled={locked || isDone}
                      onClick={() => {
                        if (expected === it.id) setDrawingId(it.id);
                        else finishTrial(false);
                      }}
                    >
                      <TileShell done={isDone}>
                        <span className="text-5xl sm:text-6xl leading-none">{it.emoji}</span>
                      </TileShell>
                    </button>
                  );
                }

                if (it.kind === 'shake' || it.kind === 'rotate') {
                  return (
                    <TileShell key={it.id} done={isDone} className={!isDone ? 'border-violet-500/30' : ''}>
                      <span className="text-5xl sm:text-6xl leading-none">{it.emoji}</span>
                    </TileShell>
                  );
                }

                // tap
                return (
                  <button
                    key={it.id}
                    type="button"
                    disabled={locked || isDone}
                    onClick={() => {
                      if (expected === it.id) advance(it.id);
                      else finishTrial(false);
                    }}
                    className="active:scale-95"
                  >
                    <TileShell done={isDone}>
                      <span className="text-5xl sm:text-6xl leading-none">{it.emoji}</span>
                    </TileShell>
                  </button>
                );
              })}
            </div>

            {/* Rising balloon — sürekli yeniden doğar */}
            {hasBalloon && !locked && (
              <FloatingBalloon
                key={`${task.id}-${balloonKey}`}
                active={expectedKind === 'balloon'}
                onPop={() => advance('balloon')}
                onWrongPop={() => finishTrial(false)}
              />
            )}

            {drawingId && (
              <DrawOverlay
                onDone={() => {
                  setDrawingId(null);
                  advance(drawingId);
                }}
                onCancel={() => setDrawingId(null)}
              />
            )}

            {flash === 'ok' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                <div className="bg-emerald-500 text-white p-3 rounded-full">
                  <Check size={36} strokeWidth={3} />
                </div>
              </div>
            )}
            {flash === 'bad' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                <div className="bg-red-500 text-white p-3 rounded-full">
                  <X size={36} strokeWidth={3} />
                </div>
              </div>
            )}
          </div>

          {/* Teacher */}
          <div className="shrink-0 p-3 pb-5 border-t border-slate-800 bg-slate-900/95 flex gap-3 justify-center">
            <button
              type="button"
              disabled={locked}
              onClick={() => finishTrial(false)}
              className="flex-1 max-w-[160px] flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 disabled:opacity-40 active:scale-95"
            >
              <X className="w-5 h-5" />
              <span className="text-xs font-bold uppercase">Yapamadı</span>
            </button>
            <button
              type="button"
              disabled={locked}
              onClick={() => finishTrial(true)}
              className="flex-1 max-w-[160px] flex items-center justify-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 disabled:opacity-40 active:scale-95"
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
            <Trophy
              size={72}
              className={score >= 8 ? 'text-yellow-500 mb-5 animate-bounce' : 'text-slate-500 mb-5'}
            />
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

/* ───────── Hold tile ───────── */
function HoldTile({
  emoji,
  done,
  disabled,
  onHold,
  onWrong,
  isExpected,
}: {
  emoji: string;
  done: boolean;
  disabled: boolean;
  onHold: () => void;
  onWrong: () => void;
  isExpected: boolean;
}) {
  const [p, setP] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef(0);
  const clear = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    setP(0);
  };
  const tick = () => {
    const v = Math.min(1, (Date.now() - start.current) / 850);
    setP(v);
    if (v >= 1) {
      if (isExpected) onHold();
      else onWrong();
      return;
    }
    raf.current = requestAnimationFrame(tick);
  };
  return (
    <button
      type="button"
      disabled={disabled || done}
      className="relative overflow-hidden active:scale-95"
      onPointerDown={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        start.current = Date.now();
        tick();
      }}
      onPointerUp={clear}
      onPointerLeave={clear}
      onPointerCancel={clear}
    >
      <TileShell done={done}>
        <div className="absolute bottom-0 left-0 right-0 bg-rose-500/40" style={{ height: `${p * 100}%` }} />
        <span className="text-5xl sm:text-6xl leading-none relative z-10">{emoji}</span>
      </TileShell>
    </button>
  );
}

/* ───────── Swipe tile ───────── */
function SwipeTile({
  emoji,
  done,
  disabled,
  onSwipe,
  onWrong,
  isExpected,
}: {
  emoji: string;
  done: boolean;
  disabled: boolean;
  onSwipe: () => void;
  onWrong: () => void;
  isExpected: boolean;
}) {
  const sx = useRef(0);
  const [dx, setDx] = useState(0);
  return (
    <div
      className="touch-none"
      style={{ transform: `translateX(${Math.max(-36, Math.min(36, dx))}px)` }}
      onPointerDown={(e) => {
        if (disabled || done) return;
        sx.current = e.clientX;
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (disabled || done) return;
        setDx(e.clientX - sx.current);
      }}
      onPointerUp={() => {
        if (Math.abs(dx) > 42) {
          if (isExpected) onSwipe();
          else onWrong();
        }
        setDx(0);
      }}
      onPointerCancel={() => setDx(0)}
    >
      <TileShell done={done}>
        <span className="text-5xl sm:text-6xl leading-none">{emoji}</span>
      </TileShell>
    </div>
  );
}
