import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { XCircle, Check, X, Trophy, RefreshCw, Eraser } from 'lucide-react';
import { ScreenOrientation } from '@capacitor/screen-orientation';

import onaySes from './sesgorsel/onay.mp3';
import devametNotr from '@/aba/esle/ses/devametnotr.mp3';
import devamet2Notr from '@/aba/esle/ses/devamet2notr.mp3';
import simdisiradakiNotr from '@/aba/esle/ses/simdisiradakinotr.mp3';

const NEUTRAL_SOUNDS = [devametNotr, devamet2Notr, simdisiradakiNotr];

type Pt = { x: number; y: number };
type DigitalKind = 'connect' | 'path' | 'sequence' | 'shape';

interface DigitalTask {
  id: string;
  kind: DigitalKind;
  text: string;
  points?: Pt[];
  path?: Pt[];
  colors?: string[];
  labels?: string[];
  shape?: 'square' | 'triangle' | 'circle';
}

interface TeacherTask {
  id: string;
  text: string;
}

const DIGITAL_POOL: DigitalTask[] = [
  { id: 'd1', kind: 'connect', text: 'Mavi noktayı kırmızı noktaya birleştir', points: [{ x: 0.18, y: 0.5 }, { x: 0.82, y: 0.5 }], colors: ['#3b82f6', '#ef4444'], labels: ['Mavi', 'Kırmızı'] },
  { id: 'd2', kind: 'connect', text: 'Yeşil noktayı sarı noktaya birleştir', points: [{ x: 0.2, y: 0.22 }, { x: 0.8, y: 0.78 }], colors: ['#22c55e', '#eab308'], labels: ['Yeşil', 'Sarı'] },
  { id: 'd3', kind: 'connect', text: 'Mor noktayı turuncu noktaya birleştir', points: [{ x: 0.75, y: 0.2 }, { x: 0.25, y: 0.8 }], colors: ['#a855f7', '#f97316'], labels: ['Mor', 'Turuncu'] },
  { id: 'd4', kind: 'path', text: 'Yolu çizerek baştan sona git', path: [{ x: 0.12, y: 0.55 }, { x: 0.28, y: 0.35 }, { x: 0.45, y: 0.55 }, { x: 0.62, y: 0.35 }, { x: 0.78, y: 0.55 }, { x: 0.9, y: 0.4 }] },
  { id: 'd5', kind: 'path', text: 'Kavisli yolu takip et', path: [{ x: 0.1, y: 0.7 }, { x: 0.25, y: 0.3 }, { x: 0.45, y: 0.65 }, { x: 0.65, y: 0.28 }, { x: 0.88, y: 0.55 }] },
  { id: 'd6', kind: 'sequence', text: 'Noktaları sırayla birleştir: 1 → 2 → 3', points: [{ x: 0.2, y: 0.7 }, { x: 0.5, y: 0.25 }, { x: 0.8, y: 0.7 }], colors: ['#38bdf8', '#38bdf8', '#38bdf8'], labels: ['1', '2', '3'] },
  { id: 'd7', kind: 'sequence', text: 'Noktaları sırayla birleştir: 1 → 2 → 3 → 4', points: [{ x: 0.2, y: 0.25 }, { x: 0.8, y: 0.25 }, { x: 0.8, y: 0.75 }, { x: 0.2, y: 0.75 }], colors: ['#38bdf8', '#38bdf8', '#38bdf8', '#38bdf8'], labels: ['1', '2', '3', '4'] },
  { id: 'd8', kind: 'shape', text: 'Kare çiz (köşeleri birleştir)', shape: 'square', points: [{ x: 0.28, y: 0.22 }, { x: 0.72, y: 0.22 }, { x: 0.72, y: 0.72 }, { x: 0.28, y: 0.72 }] },
  { id: 'd9', kind: 'shape', text: 'Üçgen çiz (köşeleri birleştir)', shape: 'triangle', points: [{ x: 0.5, y: 0.2 }, { x: 0.8, y: 0.75 }, { x: 0.2, y: 0.75 }] },
  { id: 'd10', kind: 'connect', text: 'Üstteki noktayı alttaki noktaya birleştir', points: [{ x: 0.5, y: 0.18 }, { x: 0.5, y: 0.82 }], colors: ['#f472b6', '#2dd4bf'], labels: ['Üst', 'Alt'] },
  { id: 'd11', kind: 'path', text: 'Z şeklinde yolu çiz', path: [{ x: 0.15, y: 0.22 }, { x: 0.85, y: 0.22 }, { x: 0.15, y: 0.78 }, { x: 0.85, y: 0.78 }] },
  { id: 'd12', kind: 'sequence', text: 'Noktaları sırayla birleştir: A → B → C', points: [{ x: 0.18, y: 0.35 }, { x: 0.5, y: 0.7 }, { x: 0.82, y: 0.35 }], colors: ['#fb7185', '#fb7185', '#fb7185'], labels: ['A', 'B', 'C'] },
];

const TEACHER_TASKS: TeacherTask[] = [
  { id: 't1', text: 'Kağıda bir daire çiz' },
  { id: 't2', text: 'Kağıda bir çizgi çiz' },
  { id: 't3', text: 'Kağıda bir kare çiz' },
  { id: 't4', text: 'İsminin ilk harfini yaz' },
  { id: 't5', text: 'Kağıda bir X işareti çiz' },
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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dist(a: Pt, b: Pt) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function toPx(p: Pt, w: number, h: number): Pt {
  return { x: p.x * w, y: p.y * h };
}

function evaluateStroke(stroke: Pt[], task: DigitalTask, w: number, h: number): boolean {
  if (stroke.length < 10) return false;
  const minSide = Math.min(w, h);
  const tol = minSide * 0.09;

  if (task.kind === 'connect' && task.points && task.points.length >= 2) {
    const start = toPx(task.points[0], w, h);
    const end = toPx(task.points[task.points.length - 1], w, h);
    const first = stroke[0];
    const last = stroke[stroke.length - 1];
    if (dist(first, start) > tol * 1.15 || dist(last, end) > tol * 1.15) return false;
    let len = 0;
    for (let i = 1; i < stroke.length; i++) len += dist(stroke[i - 1], stroke[i]);
    if (len < dist(start, end) * 0.55) return false;
    let err = 0;
    let samples = 0;
    const vx = end.x - start.x;
    const vy = end.y - start.y;
    const denom = vx * vx + vy * vy + 1e-6;
    for (let i = 0; i < stroke.length; i += 2) {
      const p = stroke[i];
      const t = Math.max(0, Math.min(1, ((p.x - start.x) * vx + (p.y - start.y) * vy) / denom));
      err += Math.hypot(p.x - (start.x + t * vx), p.y - (start.y + t * vy));
      samples++;
    }
    return err / Math.max(1, samples) <= tol * 1.35;
  }

  if (task.kind === 'path' && task.path && task.path.length >= 2) {
    const pathPx = task.path.map((p) => toPx(p, w, h));
    if (dist(stroke[0], pathPx[0]) > tol * 1.3) return false;
    if (dist(stroke[stroke.length - 1], pathPx[pathPx.length - 1]) > tol * 1.3) return false;
    let err = 0;
    let n = 0;
    for (let i = 0; i < stroke.length; i += 2) {
      const p = stroke[i];
      let best = Infinity;
      for (let j = 0; j < pathPx.length - 1; j++) {
        const a = pathPx[j];
        const b = pathPx[j + 1];
        const vx = b.x - a.x;
        const vy = b.y - a.y;
        const t = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / (vx * vx + vy * vy + 1e-6)));
        best = Math.min(best, Math.hypot(p.x - (a.x + t * vx), p.y - (a.y + t * vy)));
      }
      err += best;
      n++;
    }
    if (err / Math.max(1, n) > tol * 1.25) return false;
    let covered = 0;
    for (const q of pathPx) {
      let near = false;
      for (let i = 0; i < stroke.length; i += 3) {
        if (dist(stroke[i], q) <= tol * 1.4) { near = true; break; }
      }
      if (near) covered++;
    }
    return covered >= Math.ceil(pathPx.length * 0.7);
  }

  if ((task.kind === 'sequence' || task.kind === 'shape') && task.points && task.points.length >= 2) {
    const pts = task.points.map((p) => toPx(p, w, h));
    let idx = 0;
    for (const p of stroke) {
      if (idx < pts.length && dist(p, pts[idx]) <= tol * 1.2) idx++;
    }
    if (task.kind === 'shape') {
      const last = stroke[stroke.length - 1];
      const closeToStart = dist(last, pts[0]) <= tol * 1.3;
      const closeToLast = dist(last, pts[pts.length - 1]) <= tol * 1.3;
      return idx >= pts.length - 1 && (closeToStart || closeToLast);
    }
    return idx >= pts.length;
  }

  return false;
}

function DrawCanvas({ task, locked, onSuccess, onFail }: { task: DigitalTask; locked: boolean; onSuccess: () => void; onFail: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokeRef = useRef<Pt[]>([]);
  const drawingRef = useRef(false);
  const [hasStroke, setHasStroke] = useState(false);
  const evaluatedRef = useRef(false);

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const w = c.getBoundingClientRect().width;
    const h = c.getBoundingClientRect().height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(51,65,85,0.35)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    if (task.path) {
      const pathPx = task.path.map((p) => toPx(p, w, h));
      ctx.strokeStyle = 'rgba(148,163,184,0.45)';
      ctx.lineWidth = Math.max(10, Math.min(w, h) * 0.04);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      pathPx.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath(); ctx.arc(pathPx[0].x, pathPx[0].y, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(pathPx[pathPx.length - 1].x, pathPx[pathPx.length - 1].y, 12, 0, Math.PI * 2); ctx.fill();
    }

    if (task.points) {
      const pts = task.points.map((p) => toPx(p, w, h));
      if (task.kind === 'shape') {
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = 'rgba(148,163,184,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (task.kind === 'sequence') {
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = 'rgba(56,189,248,0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.stroke();
        ctx.setLineDash([]);
      }
      pts.forEach((p, i) => {
        const color = task.colors?.[i] || '#38bdf8';
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        const label = task.labels?.[i];
        if (label) {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, p.x, p.y);
        }
      });
    }

    const stroke = strokeRef.current;
    if (stroke.length > 1) {
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      stroke.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
    }
  }, [task]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const parent = c.parentElement;
    const resize = () => {
      if (!parent) return;
      const r = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = Math.max(200, r.width);
      const cssH = Math.max(220, r.height);
      c.width = Math.floor(cssW * dpr);
      c.height = Math.floor(cssH * dpr);
      c.style.width = `${cssW}px`;
      c.style.height = `${cssH}px`;
      redraw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (parent) ro.observe(parent);
    return () => ro.disconnect();
  }, [redraw, task.id]);

  useEffect(() => {
    strokeRef.current = [];
    setHasStroke(false);
    evaluatedRef.current = false;
    redraw();
  }, [task.id, redraw]);

  const getPos = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onDown = (e: React.PointerEvent) => {
    if (locked || evaluatedRef.current) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    drawingRef.current = true;
    strokeRef.current = [getPos(e)];
    setHasStroke(true);
    redraw();
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drawingRef.current || locked) return;
    strokeRef.current.push(getPos(e));
    redraw();
  };

  const onUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const c = canvasRef.current;
    if (!c || evaluatedRef.current || locked) return;
    const cssW = c.getBoundingClientRect().width;
    const cssH = c.getBoundingClientRect().height;
    const ok = evaluateStroke(strokeRef.current, task, cssW, cssH);
    if (ok) {
      evaluatedRef.current = true;
      playFx(onaySes);
      setTimeout(() => onSuccess(), 450);
    }
  };

  const clear = () => {
    if (locked || evaluatedRef.current) return;
    strokeRef.current = [];
    setHasStroke(false);
    redraw();
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full">
      <div className="flex-1 min-h-[240px] relative rounded-xl overflow-hidden border border-slate-700 mx-3">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
      </div>
      <div className="shrink-0 flex items-center justify-center gap-3 py-2 px-3">
        <button type="button" disabled={locked || !hasStroke} onClick={clear} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-300 text-xs font-bold disabled:opacity-40">
          <Eraser className="w-4 h-4" /> Temizle
        </button>
        <button type="button" disabled={locked} onClick={onFail} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold disabled:opacity-40">
          <X className="w-4 h-4" /> Yapamadı
        </button>
      </div>
    </div>
  );
}

interface Yonerge16Props {
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

type Phase = 'running' | 'result';
type Trial = { mode: 'digital'; task: DigitalTask } | { mode: 'teacher'; task: TeacherTask };

export default function Yonerge16({
  itemCode = 'YTB 4.5',
  itemText = 'Kağıt Kalem Kullanmayı Gerektiren Yönergeleri Takip Etme',
  onClose,
  onComplete,
}: Yonerge16Props) {
  const [phase, setPhase] = useState<Phase>('running');
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [trials, setTrials] = useState<Trial[]>(() => {
    const digital = shuffle(DIGITAL_POOL).slice(0, 5).map((task) => ({ mode: 'digital' as const, task }));
    const teacher = TEACHER_TASKS.map((task) => ({ mode: 'teacher' as const, task }));
    return [...digital, ...teacher];
  });

  const trial = trials[idx];
  const usedDigitalIds = useMemo(
    () => new Set(trials.filter((t) => t.mode === 'digital').map((t) => t.task.id)),
    [trials],
  );

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

  const swapDigital = () => {
    if (locked || !trial || trial.mode !== 'digital') return;
    const candidates = DIGITAL_POOL.filter((t) => !usedDigitalIds.has(t.id));
    if (candidates.length === 0) return;
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    setTrials((prev) => {
      const copy = [...prev];
      copy[idx] = { mode: 'digital', task: next };
      return copy;
    });
  };

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
          <div className="relative flex-1 min-h-0 flex flex-col">
            {trial.mode === 'digital' ? (
              <>
                <div className="shrink-0 px-4 pt-2 pb-1 text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Dijital çizim</p>
                  <h1 className="text-lg sm:text-2xl font-black leading-snug text-white">{trial.task.text}</h1>
                </div>
                <DrawCanvas key={trial.task.id} task={trial.task} locked={locked} onSuccess={() => finishTrial(true)} onFail={() => finishTrial(false)} />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 overflow-y-auto">
                <div className="w-full max-w-3xl bg-slate-800/60 border-2 border-slate-700 rounded-[2rem] p-8 md:p-12 flex flex-col items-center shadow-2xl">
                  <span className="text-blue-400 font-bold tracking-widest uppercase mb-3 text-sm">Öğrenciye söyleyin</span>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-4">Öğretmen · kağıt-kalem</p>
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-center text-white leading-snug mb-6">"{trial.task.text}"</h1>
                  <p className="text-slate-400 text-sm text-center max-w-md">Öğrenci kağıt-kalem ile yapsın.</p>
                  <p className="text-slate-500 text-xs text-center mt-2">Aşağıdan işaretleyin.</p>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 p-3 pb-5 border-t border-slate-800 bg-slate-900/95 flex gap-3 justify-center items-center">
            {trial.mode === 'digital' && (
              <button type="button" disabled={locked} onClick={swapDigital} className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-slate-800 border border-slate-600 text-slate-300 disabled:opacity-40 active:scale-95">
                <RefreshCw className="w-4 h-4" /><span className="text-xs font-bold">Değiştir</span>
              </button>
            )}
            {trial.mode === 'teacher' && (
              <>
                <button type="button" disabled={locked} onClick={() => finishTrial(false)} className="flex-1 max-w-[160px] flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 disabled:opacity-40 active:scale-95">
                  <X className="w-5 h-5" /><span className="text-xs font-bold uppercase">Yapamadı</span>
                </button>
                <button type="button" disabled={locked} onClick={() => finishTrial(true)} className="flex-1 max-w-[160px] flex items-center justify-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 disabled:opacity-40 active:scale-95">
                  <Check className="w-5 h-5" /><span className="text-xs font-bold uppercase">Yaptı</span>
                </button>
              </>
            )}
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
