import { useState, useRef, useEffect, useCallback } from 'react';
import {
  XCircle, Check, X, Trophy, Eraser, Sparkles, Pencil,
} from 'lucide-react';
import confetti from 'canvas-confetti';

type ShapeKind =
  | 'plus'
  | 'minus'
  | 'cross'
  | 'vline'
  | 'hline'
  | 'circle'
  | 'square'
  | 'triangle'
  | 'dot'
  | 'wave'
  | 'l'
  | 't'
  | 'v';

interface ShapeTask {
  id: string;
  kind: ShapeKind;
  text: string;
  hint: string;
}

const TASK_POOL: ShapeTask[] = [
  { id: 's01', kind: 'plus', text: 'Artı çiz', hint: '+' },
  { id: 's02', kind: 'minus', text: 'Eksi çiz', hint: '−' },
  { id: 's03', kind: 'cross', text: 'Çarpı çiz', hint: '×' },
  { id: 's04', kind: 'vline', text: 'Dikey çizgi çiz', hint: '|' },
  { id: 's05', kind: 'hline', text: 'Yatay çizgi çiz', hint: '—' },
  { id: 's06', kind: 'circle', text: 'Çember çiz', hint: '○' },
  { id: 's07', kind: 'square', text: 'Kare çiz', hint: '□' },
  { id: 's08', kind: 'triangle', text: 'Üçgen çiz', hint: '△' },
  { id: 's09', kind: 'dot', text: 'Nokta koy', hint: '•' },
  { id: 's10', kind: 'wave', text: 'Dalga çiz', hint: '〜' },
  { id: 's11', kind: 'l', text: 'L çiz', hint: 'L' },
  { id: 's12', kind: 't', text: 'T çiz', hint: 'T' },
  { id: 's13', kind: 'v', text: 'V çiz', hint: 'V' },
  { id: 's14', kind: 'plus', text: 'Artı işareti yap', hint: '+' },
  { id: 's15', kind: 'cross', text: 'Çarpı işareti yap', hint: '×' },
  { id: 's16', kind: 'circle', text: 'Yuvarlak çiz', hint: '○' },
  { id: 's17', kind: 'hline', text: 'Çizgi çiz', hint: '—' },
  { id: 's18', kind: 'vline', text: 'Dik çizgi çiz', hint: '|' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Pt = { x: number; y: number };
type Stroke = Pt[];

function dist(a: Pt, b: Pt) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function strokeLength(s: Stroke) {
  let len = 0;
  for (let i = 1; i < s.length; i++) len += dist(s[i - 1], s[i]);
  return len;
}

function strokeAngleDeg(s: Stroke): number {
  if (s.length < 2) return 0;
  const a = s[0];
  const b = s[s.length - 1];
  const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  return ang;
}

/** Normalize angle to [0, 180) for undirected lines */
function undirectedAngle(deg: number) {
  let a = ((deg % 180) + 180) % 180;
  return a;
}

function isHoriz(deg: number, tol = 28) {
  const a = undirectedAngle(deg);
  return a <= tol || a >= 180 - tol;
}

function isVert(deg: number, tol = 28) {
  const a = undirectedAngle(deg);
  return Math.abs(a - 90) <= tol;
}

function isDiag(deg: number, tol = 28) {
  const a = undirectedAngle(deg);
  return Math.abs(a - 45) <= tol || Math.abs(a - 135) <= tol;
}

function bbox(s: Stroke) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of s) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w: maxX - minX, h: maxY - minY };
}

function boxesOverlap(a: ReturnType<typeof bbox>, b: ReturnType<typeof bbox>, pad = 40) {
  return !(
    a.maxX + pad < b.minX ||
    b.maxX + pad < a.minX ||
    a.maxY + pad < b.minY ||
    b.maxY + pad < a.minY
  );
}

function midpointsClose(a: ReturnType<typeof bbox>, b: ReturnType<typeof bbox>, maxD = 90) {
  return dist({ x: a.cx, y: a.cy }, { x: b.cx, y: b.cy }) <= maxD;
}

function allPoints(strokes: Stroke[]): Pt[] {
  return strokes.flat();
}

function totalInk(strokes: Stroke[]) {
  return strokes.reduce((sum, s) => sum + strokeLength(s), 0);
}

/** Split long stroke into direction-change segments for single-stroke plus/cross */
function splitByDirection(s: Stroke, minSegLen = 25): Stroke[] {
  if (s.length < 4) return s.length >= 2 ? [s] : [];
  const segs: Stroke[] = [];
  let start = 0;
  let prevAng = strokeAngleDeg(s.slice(0, Math.min(4, s.length)));
  for (let i = 3; i < s.length; i++) {
    const window = s.slice(Math.max(0, i - 3), i + 1);
    const ang = strokeAngleDeg(window);
    let diff = Math.abs(undirectedAngle(ang) - undirectedAngle(prevAng));
    if (diff > 90) diff = 180 - diff;
    if (diff > 40) {
      const seg = s.slice(start, i);
      if (strokeLength(seg) >= minSegLen) segs.push(seg);
      start = i - 1;
      prevAng = ang;
    }
  }
  const last = s.slice(start);
  if (strokeLength(last) >= minSegLen) segs.push(last);
  return segs.length ? segs : [s];
}

function effectiveStrokes(strokes: Stroke[]): Stroke[] {
  const out: Stroke[] = [];
  for (const s of strokes) {
    if (s.length < 2) continue;
    if (strokeLength(s) < 12) continue;
    const parts = splitByDirection(s);
    out.push(...parts);
  }
  return out;
}

function checkPlus(strokes: Stroke[]): boolean {
  const segs = effectiveStrokes(strokes);
  if (segs.length < 2) return false;
  let h: Stroke | null = null;
  let v: Stroke | null = null;
  for (const s of segs) {
    const a = strokeAngleDeg(s);
    if (!h && isHoriz(a) && strokeLength(s) >= 30) h = s;
    else if (!v && isVert(a) && strokeLength(s) >= 30) v = s;
  }
  if (!h || !v) return false;
  const bh = bbox(h);
  const bv = bbox(v);
  return boxesOverlap(bh, bv, 50) || midpointsClose(bh, bv, 100);
}

function checkMinus(strokes: Stroke[]): boolean {
  const segs = effectiveStrokes(strokes);
  if (segs.length === 0) return false;
  // Prefer single dominant horizontal; allow slight multi-stroke
  const horiz = segs.filter((s) => isHoriz(strokeAngleDeg(s)) && strokeLength(s) >= 40);
  if (horiz.length === 0) return false;
  // Reject if strong vertical present (would be plus)
  const strongVert = segs.some((s) => isVert(strokeAngleDeg(s)) && strokeLength(s) >= 40);
  if (strongVert) return false;
  return true;
}

function checkCross(strokes: Stroke[]): boolean {
  const segs = effectiveStrokes(strokes);
  if (segs.length < 2) return false;
  const diags = segs.filter((s) => isDiag(strokeAngleDeg(s)) && strokeLength(s) >= 30);
  if (diags.length >= 2) {
    const b0 = bbox(diags[0]);
    const b1 = bbox(diags[1]);
    return boxesOverlap(b0, b1, 55) || midpointsClose(b0, b1, 110);
  }
  // Two strokes of opposite-ish diagonal angles
  let d1: Stroke | null = null;
  let d2: Stroke | null = null;
  for (const s of segs) {
    if (strokeLength(s) < 30) continue;
    const a = undirectedAngle(strokeAngleDeg(s));
    if (!d1 && a > 20 && a < 70) d1 = s;
    else if (!d2 && a > 110 && a < 160) d2 = s;
  }
  if (d1 && d2) {
    return boxesOverlap(bbox(d1), bbox(d2), 55) || midpointsClose(bbox(d1), bbox(d2), 110);
  }
  return false;
}

function checkVLine(strokes: Stroke[]): boolean {
  const segs = effectiveStrokes(strokes);
  const verts = segs.filter((s) => isVert(strokeAngleDeg(s)) && strokeLength(s) >= 40);
  if (verts.length === 0) return false;
  const strongHoriz = segs.some((s) => isHoriz(strokeAngleDeg(s)) && strokeLength(s) >= 45);
  if (strongHoriz) return false;
  return true;
}

function checkHLine(strokes: Stroke[]): boolean {
  return checkMinus(strokes);
}

function checkCircle(strokes: Stroke[]): boolean {
  const pts = allPoints(strokes);
  if (pts.length < 12) return false;
  if (totalInk(strokes) < 80) return false;
  let sx = 0, sy = 0;
  for (const p of pts) {
    sx += p.x;
    sy += p.y;
  }
  const cx = sx / pts.length;
  const cy = sy / pts.length;
  const radii = pts.map((p) => dist(p, { x: cx, y: cy }));
  const mean = radii.reduce((a, b) => a + b, 0) / radii.length;
  if (mean < 18) return false;
  const variance =
    radii.reduce((sum, r) => sum + (r - mean) ** 2, 0) / radii.length;
  const std = Math.sqrt(variance);
  // Tolerant: std relative to radius
  if (std / mean > 0.45) return false;
  // Rough closure: first and last of overall path reasonably close
  const first = pts[0];
  const last = pts[pts.length - 1];
  const close = dist(first, last) < mean * 0.85;
  // Or multiple strokes that cover circle-ish
  return close || strokes.length >= 1;
}

function checkSquare(strokes: Stroke[]): boolean {
  const segs = effectiveStrokes(strokes);
  const hs = segs.filter((s) => isHoriz(strokeAngleDeg(s)) && strokeLength(s) >= 25);
  const vs = segs.filter((s) => isVert(strokeAngleDeg(s)) && strokeLength(s) >= 25);
  if (hs.length >= 2 && vs.length >= 2) return true;
  // Single continuous square path: check bbox aspect + enough ink
  const pts = allPoints(strokes);
  if (pts.length < 16) return false;
  const b = bbox(pts);
  if (b.w < 30 || b.h < 30) return false;
  const ratio = b.w / b.h;
  if (ratio < 0.55 || ratio > 1.8) return false;
  return totalInk(strokes) > (b.w + b.h) * 1.2;
}

function checkTriangle(strokes: Stroke[]): boolean {
  const segs = effectiveStrokes(strokes);
  // Three edges of decent length
  const edges = segs.filter((s) => strokeLength(s) >= 28);
  if (edges.length >= 3) return true;
  // Continuous triangle-ish: enough path + not circle
  const pts = allPoints(strokes);
  if (pts.length < 12) return false;
  if (totalInk(strokes) < 90) return false;
  // Reject if too circular
  if (checkCircle(strokes) && edges.length < 2) return false;
  const b = bbox(pts);
  return b.w >= 35 && b.h >= 35;
}

function checkDot(strokes: Stroke[]): boolean {
  const pts = allPoints(strokes);
  if (pts.length === 0) return false;
  const b = bbox(pts);
  const ink = totalInk(strokes);
  // Small blob
  return b.w <= 55 && b.h <= 55 && ink < 120 && pts.length >= 1;
}

function checkWave(strokes: Stroke[]): boolean {
  const segs = effectiveStrokes(strokes);
  const main = segs.sort((a, b) => strokeLength(b) - strokeLength(a))[0];
  if (!main || strokeLength(main) < 50) return false;
  // Count direction changes in y relative to overall horizontal
  if (!isHoriz(strokeAngleDeg(main), 40) && segs.length === 1) {
    // still allow wavy with overall horizontal extent
  }
  const b = bbox(main);
  if (b.w < 40) return false;
  // Sample y variance along x — wave has multiple peaks
  let peaks = 0;
  for (let i = 2; i < main.length - 2; i++) {
    const y0 = main[i - 1].y;
    const y1 = main[i].y;
    const y2 = main[i + 1].y;
    if ((y1 < y0 && y1 < y2) || (y1 > y0 && y1 > y2)) peaks++;
  }
  return peaks >= 2 || b.h >= 20;
}

function checkL(strokes: Stroke[]): boolean {
  const segs = effectiveStrokes(strokes);
  let h: Stroke | null = null;
  let v: Stroke | null = null;
  for (const s of segs) {
    if (strokeLength(s) < 28) continue;
    const a = strokeAngleDeg(s);
    if (!h && isHoriz(a)) h = s;
    else if (!v && isVert(a)) v = s;
  }
  if (!h || !v) {
    // single stroke L: split should yield 2
    return false;
  }
  const bh = bbox(h);
  const bv = bbox(v);
  // Endpoints near each other (corner)
  const ends = [
    h[0],
    h[h.length - 1],
    v[0],
    v[v.length - 1],
  ];
  let corner = false;
  for (let i = 0; i < 2; i++) {
    for (let j = 2; j < 4; j++) {
      if (dist(ends[i], ends[j]) < 70) corner = true;
    }
  }
  return corner || boxesOverlap(bh, bv, 40);
}

function checkT(strokes: Stroke[]): boolean {
  const segs = effectiveStrokes(strokes);
  let h: Stroke | null = null;
  let v: Stroke | null = null;
  for (const s of segs) {
    if (strokeLength(s) < 28) continue;
    const a = strokeAngleDeg(s);
    if (!h && isHoriz(a)) h = s;
    else if (!v && isVert(a)) v = s;
  }
  if (!h || !v) return false;
  const bh = bbox(h);
  const bv = bbox(v);
  // Vertical should meet near middle of horizontal top
  const nearTop =
    Math.abs(bv.minY - bh.cy) < 55 ||
    Math.abs(bv.minY - bh.minY) < 50 ||
    Math.abs(bv.maxY - bh.cy) < 55;
  return (boxesOverlap(bh, bv, 45) || midpointsClose(bh, bv, 90)) && nearTop;
}

function checkV(strokes: Stroke[]): boolean {
  const segs = effectiveStrokes(strokes);
  if (segs.length >= 2) {
    const long = segs.filter((s) => strokeLength(s) >= 28);
    if (long.length >= 2) {
      // Two diagonals meeting at bottom-ish
      const b0 = bbox(long[0]);
      const b1 = bbox(long[1]);
      const ends = [
        long[0][0],
        long[0][long[0].length - 1],
        long[1][0],
        long[1][long[1].length - 1],
      ];
      let meet = false;
      for (let i = 0; i < 2; i++) {
        for (let j = 2; j < 4; j++) {
          if (dist(ends[i], ends[j]) < 75) meet = true;
        }
      }
      return meet || boxesOverlap(b0, b1, 50);
    }
  }
  // Single stroke V: direction change
  const parts = segs;
  if (parts.length >= 2) {
    return checkV(parts);
  }
  const pts = allPoints(strokes);
  if (pts.length < 10) return false;
  const b = bbox(pts);
  return b.w >= 30 && b.h >= 30 && totalInk(strokes) >= 60;
}

function recognize(kind: ShapeKind, strokes: Stroke[]): boolean {
  if (strokes.length === 0) return false;
  switch (kind) {
    case 'plus':
      return checkPlus(strokes);
    case 'minus':
      return checkMinus(strokes);
    case 'cross':
      return checkCross(strokes);
    case 'vline':
      return checkVLine(strokes);
    case 'hline':
      return checkHLine(strokes);
    case 'circle':
      return checkCircle(strokes);
    case 'square':
      return checkSquare(strokes);
    case 'triangle':
      return checkTriangle(strokes);
    case 'dot':
      return checkDot(strokes);
    case 'wave':
      return checkWave(strokes);
    case 'l':
      return checkL(strokes);
    case 't':
      return checkT(strokes);
    case 'v':
      return checkV(strokes);
    default:
      return false;
  }
}

interface Yonerge11Props {
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

type Phase = 'running' | 'result';

export default function Yonerge11({
  itemCode = 'YTB 3.6',
  itemText = 'Yönerge Takip Etme: Yazmaya Hazırlık',
  onClose,
  onComplete,
}: Yonerge11Props) {
  const [tasks] = useState<ShapeTask[]>(() => shuffle(TASK_POOL).slice(0, 10));
  const [phase, setPhase] = useState<Phase>('running');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState<'idle' | 'ok' | 'fail'>('idle');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke>([]);
  const drawingRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  const current = tasks[currentIndex];

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 8;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // subtle guide grid
    ctx.strokeStyle = 'rgba(148,163,184,0.08)';
    ctx.lineWidth = 1;
    for (let x = 40; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 40; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 8;
    const all = [...strokesRef.current];
    if (currentStrokeRef.current.length) all.push(currentStrokeRef.current);
    for (const s of all) {
      if (s.length < 2) {
        if (s.length === 1) {
          ctx.beginPath();
          ctx.arc(s[0].x, s[0].y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
        }
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(s[0].x, s[0].y);
      for (let i = 1; i < s.length; i++) ctx.lineTo(s[i].x, s[i].y);
      ctx.stroke();
    }
  }, []);

  useEffect(() => {
    setupCanvas();
    redraw();
    const onResize = () => {
      setupCanvas();
      redraw();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [setupCanvas, redraw, currentIndex]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>): Pt => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (locked || phase !== 'running') return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drawingRef.current = true;
    currentStrokeRef.current = [getPos(e)];
    setFeedback('idle');
    redraw();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || locked) return;
    e.preventDefault();
    currentStrokeRef.current.push(getPos(e));
    redraw();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (currentStrokeRef.current.length) {
      strokesRef.current.push(currentStrokeRef.current);
      currentStrokeRef.current = [];
      setHasInk(true);
    }
    redraw();
  };

  const clearCanvas = () => {
    if (locked) return;
    strokesRef.current = [];
    currentStrokeRef.current = [];
    setHasInk(false);
    setFeedback('idle');
    redraw();
  };

  const advance = (correct: boolean) => {
    setLocked(true);
    const newScore = score + (correct ? 1 : 0);
    setScore(newScore);
    setFeedback(correct ? 'ok' : 'fail');
    if (correct) {
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 } });
    }
    setTimeout(() => {
      const next = currentIndex + 1;
      if (next >= 10) {
        setPhase('result');
        if (newScore >= 8) {
          confetti({ particleCount: 220, spread: 90, origin: { y: 0.55 } });
        }
        return;
      }
      strokesRef.current = [];
      currentStrokeRef.current = [];
      setHasInk(false);
      setFeedback('idle');
      setCurrentIndex(next);
      setLocked(false);
    }, correct ? 700 : 550);
  };

  const handleCheck = () => {
    if (locked || !hasInk) return;
    const ok = recognize(current.kind, strokesRef.current);
    advance(ok);
  };

  const handleTeacher = (correct: boolean) => {
    if (locked) return;
    advance(correct);
  };

  return (
    <div
      className="fixed inset-0 h-[100dvh] w-screen z-[100] flex flex-col bg-slate-950 text-white font-sans select-none"
      style={{ touchAction: 'none' }}
    >
      {/* Header */}
      <div className="shrink-0 p-3 sm:p-4 landscape:py-2 flex items-center justify-between border-b border-slate-800 bg-slate-900/90 backdrop-blur-md z-10">
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
        >
          <XCircle className="w-7 h-7" />
        </button>
        <div className="text-center px-2 min-w-0">
          <h2 className="text-sm sm:text-base font-bold truncate text-slate-100">
            {itemCode} — {itemText}
          </h2>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">
            {phase === 'running' && `DEĞERLENDİRME · ${currentIndex + 1} / 10`}
            {phase === 'result' && 'SONUÇ'}
          </p>
        </div>
        <div className="w-10 text-right text-xs font-bold text-sky-400 tabular-nums">
          {phase === 'running' ? `${score}` : ''}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 relative flex flex-col min-h-0 overflow-hidden">
        {phase === 'running' && current && (
          <>
            {/* Instruction */}
            <div className="shrink-0 px-4 pt-3 pb-2 flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold tracking-widest uppercase text-sky-400/90 bg-sky-500/10 border border-sky-500/25 px-2.5 py-0.5 rounded-full">
                Öğrenciye söyleyin · çizsin
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-center text-white leading-tight">
                {current.text}
              </h1>
              <span className="text-4xl text-slate-600 font-light select-none" aria-hidden>
                {current.hint}
              </span>
            </div>

            {/* Canvas area */}
            <div className="flex-1 min-h-0 px-3 sm:px-6 pb-2 flex items-center justify-center">
              <div
                className={`relative w-full max-w-lg aspect-square max-h-[min(52dvh,420px)] rounded-3xl border-2 overflow-hidden shadow-2xl transition-colors ${
                  feedback === 'ok'
                    ? 'border-green-500 shadow-green-900/40'
                    : feedback === 'fail'
                      ? 'border-red-500/70 shadow-red-900/30'
                      : 'border-slate-700'
                }`}
              >
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                />
                {feedback === 'ok' && (
                  <div className="absolute inset-0 bg-green-500/15 flex items-center justify-center pointer-events-none">
                    <div className="bg-green-500 text-white p-4 rounded-full shadow-lg">
                      <Check size={40} strokeWidth={3} />
                    </div>
                  </div>
                )}
                {feedback === 'fail' && (
                  <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center pointer-events-none">
                    <div className="bg-red-500/90 text-white p-4 rounded-full shadow-lg">
                      <X size={36} strokeWidth={3} />
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={clearCanvas}
                  disabled={locked || !hasInk}
                  className="absolute top-3 right-3 z-10 bg-slate-900/90 text-slate-300 p-2.5 rounded-xl border border-slate-600 hover:text-white hover:border-slate-400 disabled:opacity-30 transition-all"
                  title="Sil"
                >
                  <Eraser size={20} />
                </button>
                {!hasInk && feedback === 'idle' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-600">
                    <Pencil size={36} className="mb-2 opacity-40" />
                    <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                      Parmağınla çiz
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="shrink-0 p-4 pb-6 landscape:py-3 landscape:pb-4 bg-slate-900/95 border-t border-slate-800 space-y-3 z-10">
              <button
                type="button"
                onClick={handleCheck}
                disabled={locked || !hasInk}
                className="w-full max-w-md mx-auto flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white py-3.5 rounded-2xl font-bold text-base shadow-lg shadow-sky-900/40 active:scale-[0.98] transition-all"
              >
                <Sparkles size={20} />
                Kontrol Et
              </button>
              <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => handleTeacher(false)}
                  disabled={locked}
                  className="flex-1 flex items-center justify-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-500/20 disabled:opacity-40 active:scale-95 transition-all"
                >
                  <X className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase">Yapamadı</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTeacher(true)}
                  disabled={locked}
                  className="flex-1 flex items-center justify-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 hover:bg-green-500/20 disabled:opacity-40 active:scale-95 transition-all"
                >
                  <Check className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase">Yaptı</span>
                </button>
              </div>
              <p className="text-[10px] text-center text-slate-500 max-w-sm mx-auto leading-relaxed">
                Sistem titrek / hafif yamuk çizimleri kabul eder. Şüphede öğretmen butonlarını kullanın.
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
                className="bg-sky-600 hover:bg-sky-500 text-white px-12 py-4 rounded-xl font-bold text-xl active:scale-95 shadow-xl shadow-sky-900/50 w-full sm:w-auto"
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
