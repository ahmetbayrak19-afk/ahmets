import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { XCircle, SkipForward, Hand } from 'lucide-react';

import marakasImg from './sesgorsel/Marakas.png';
import topImg from './sesgorsel/top.png';
import sepetImg from './sesgorsel/sepet.png';
import sepetTopImg from './sesgorsel/Sepeticindetop.png';
import elmaImg from './sesgorsel/elma.png';
import yumurta1 from './sesgorsel/yumurta1.png';
import yumurta2 from './sesgorsel/yumurta2.png';
import yumurta3 from './sesgorsel/yumurta3.png';
import yumurta4 from './sesgorsel/yumurta4.png';

import s_nesneyisalla from './sesgorsel/nesneyisalla.mp3';
import s_nesneyisurukle from './sesgorsel/nesneyisurukle.mp3';
import s_nesneyedokun from './sesgorsel/nesneyedokun.mp3';
import marakasSes from './sesgorsel/marakas.mp3';
import topsepetSes from './sesgorsel/topsepet.mp3';
import yumurtacatlama1 from './sesgorsel/yumurtacatlama1.mp3';
import yumurtacatlama2 from './sesgorsel/yumurtacatlama2.mp3';
import yumurtacatlama3 from './sesgorsel/yumurtacatlama3.mp3';

const YUMURTA_STAGES = [yumurta1, yumurta2, yumurta3, yumurta4];
const YUMURTA_SOUNDS = [yumurtacatlama1, yumurtacatlama2, yumurtacatlama3];

type TutKind = 'shake' | 'drag' | 'tap' | 'multi';
interface TutStep {
  kind: TutKind;
  sound: string;
  targetId: string;
  dropId?: string;
  stages?: string[];
  stageSounds?: string[];
  mergeImg?: string;
  successSound?: string;
  label: string;
  hint: string;
  imgs: Record<string, string>;
}

const STEPS: TutStep[] = [
  {
    kind: 'shake',
    sound: s_nesneyisalla,
    targetId: 'marakas',
    label: 'Salla',
    hint: 'Marakası salla (en az 1.5 saniye)',
    imgs: { marakas: marakasImg },
  },
  {
    kind: 'drag',
    sound: s_nesneyisurukle,
    targetId: 'top',
    dropId: 'sepet',
    mergeImg: sepetTopImg,
    successSound: topsepetSes,
    label: 'Sürükle',
    hint: 'Topu sepete sürükle',
    imgs: { top: topImg, sepet: sepetImg },
  },
  {
    kind: 'tap',
    sound: s_nesneyedokun,
    targetId: 'elma',
    label: 'Dokun',
    hint: 'Elmaya bir kez dokun',
    imgs: { elma: elmaImg },
  },
  {
    kind: 'multi',
    sound: s_nesneyedokun,
    targetId: 'yumurta',
    stages: YUMURTA_STAGES,
    stageSounds: YUMURTA_SOUNDS,
    label: 'Birkaç kez dokun',
    hint: 'Yumurtaya 3 kez dokun (kır)',
    imgs: { yumurta: yumurta1 },
  },
];

const SHAKE_MIN_MS = 1500;
const SHAKE_THRESHOLD = 6;
const MOVE_FOR_DRAG = 8;
const TAP_MAX_MOVE = 18;

function playFx(src?: string) {
  if (!src) return;
  const a = new Audio(src);
  a.volume = 1;
  a.play().catch(() => {});
}

interface Props {
  onDone: () => void;
  onClose: () => void;
}

export default function Yonerge8Tutorial({ onDone, onClose }: Props) {
  const [idx, setIdx] = useState(0);
  const [multiCount, setMultiCount] = useState(0);
  const [mergeMap, setMergeMap] = useState<Record<string, string>>({});
  const [consumed, setConsumed] = useState<string[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [shakeActiveId, setShakeActiveId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const ghostRef = useRef<HTMLImageElement | null>(null);
  const dragPosRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const marakasAudioRef = useRef<HTMLAudioElement | null>(null);
  const multiFinishingRef = useRef(false);
  const lockedRef = useRef(false);
  const idxRef = useRef(0);
  const multiCountRef = useRef(0);
  const completeRef = useRef<() => void>(() => {});

  const ptr = useRef<{
    id: string; pointerId: number; startX: number; startY: number;
    lastX: number; lastY: number; moved: boolean;
    shakeAccumMs: number; lastShakeMoveAt: number; shakeStarted: boolean;
    isShakeTarget: boolean;
  } | null>(null);

  useEffect(() => { lockedRef.current = locked; }, [locked]);
  useEffect(() => { idxRef.current = idx; }, [idx]);
  useEffect(() => { multiCountRef.current = multiCount; }, [multiCount]);

  const step = STEPS[idx];

  useEffect(() => {
    const a = new Audio(step.sound);
    a.volume = 1;
    a.play().catch(() => {});
    return () => { a.pause(); a.currentTime = 0; };
  }, [idx]); // eslint-disable-line

  const startMarakasSound = () => {
    if (marakasAudioRef.current) return;
    const a = new Audio(marakasSes);
    a.volume = 1; a.loop = true;
    marakasAudioRef.current = a;
    a.play().catch(() => {});
  };
  const stopMarakasSound = () => {
    if (marakasAudioRef.current) {
      marakasAudioRef.current.pause();
      marakasAudioRef.current.currentTime = 0;
      marakasAudioRef.current = null;
    }
  };

  const applyGhostDom = (id: string | null, x: number, y: number, angle = 0) => {
    const el = ghostRef.current;
    if (!el) return;
    if (id && step.imgs[id]) {
      const src = step.imgs[id];
      if (el.getAttribute('src') !== src) el.setAttribute('src', src);
    }
    el.style.left = `${x - 56}px`;
    el.style.top = `${y - 56}px`;
    el.style.transform = `rotate(${angle}deg)`;
    el.style.display = id ? 'block' : 'none';
    el.style.opacity = id ? '0.95' : '0';
  };

  const updateGhostPos = (x: number, y: number, angle = 0) => {
    dragPosRef.current = { x, y };
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const id = ptr.current?.id ?? null;
      applyGhostDom(id, dragPosRef.current.x, dragPosRef.current.y, angle);
    });
  };

  const hideGhost = () => {
    if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setDragId(null);
    applyGhostDom(null, 0, 0, 0);
  };

  useLayoutEffect(() => {
    if (!dragId) return;
    applyGhostDom(dragId, dragPosRef.current.x, dragPosRef.current.y, 0);
  }, [dragId]); // eslint-disable-line

  const advance = useCallback(() => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setLocked(true);
    stopMarakasSound();
    hideGhost();
    setShakeActiveId(null);
    ptr.current = null;
    multiFinishingRef.current = false;
    setTimeout(() => {
      const next = idxRef.current + 1;
      if (next >= STEPS.length) {
        onDone();
        return;
      }
      idxRef.current = next;
      setIdx(next);
      setMultiCount(0); multiCountRef.current = 0;
      setMergeMap({}); setConsumed([]);
      setLocked(false); lockedRef.current = false;
    }, 400);
  }, [onDone]); // eslint-disable-line

  useEffect(() => { completeRef.current = advance; }, [advance]);

  const skip = () => {
    stopMarakasSound();
    hideGhost();
    setShakeActiveId(null);
    ptr.current = null;
    multiFinishingRef.current = false;
    const next = idxRef.current + 1;
    if (next >= STEPS.length) {
      onDone();
      return;
    }
    idxRef.current = next;
    setIdx(next);
    setMultiCount(0); multiCountRef.current = 0;
    setMergeMap({}); setConsumed([]);
    setLocked(false); lockedRef.current = false;
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const p = ptr.current;
      if (!p || lockedRef.current || e.pointerId !== p.pointerId) return;
      const dx = e.clientX - p.startX;
      const dy = e.clientY - p.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > MOVE_FOR_DRAG) p.moved = true;

      if (p.isShakeTarget || p.moved) {
        const angle = p.isShakeTarget
          ? Math.max(-28, Math.min(28, dx * 0.35 + Math.sin(Date.now() / 60) * 8))
          : 0;
        applyGhostDom(p.id, e.clientX, e.clientY, angle);
        setDragId((prev) => (prev === p.id ? prev : p.id));
        updateGhostPos(e.clientX, e.clientY, angle);
      }

      const sdx = e.clientX - p.lastX;
      const sdy = e.clientY - p.lastY;
      const stepDist = Math.sqrt(sdx * sdx + sdy * sdy);
      if (p.isShakeTarget && stepDist > SHAKE_THRESHOLD) {
        const now = Date.now();
        if (!p.shakeStarted) {
          p.shakeStarted = true;
          p.lastShakeMoveAt = now;
          p.shakeAccumMs = 0;
          startMarakasSound();
        } else {
          const gap = now - p.lastShakeMoveAt;
          if (gap < 400) p.shakeAccumMs += gap;
          p.lastShakeMoveAt = now;
        }
        p.lastX = e.clientX; p.lastY = e.clientY;
        const s = STEPS[idxRef.current];
        if (s?.kind === 'shake' && s.targetId === p.id && p.shakeAccumMs >= SHAKE_MIN_MS) {
          stopMarakasSound();
          setShakeActiveId(null); hideGhost(); ptr.current = null;
          completeRef.current();
        }
      }
    };

    const onUp = (e: PointerEvent) => {
      const p = ptr.current;
      if (!p || e.pointerId !== p.pointerId) return;
      stopMarakasSound(); setShakeActiveId(null);
      if (lockedRef.current) { ptr.current = null; hideGhost(); return; }
      if (multiFinishingRef.current) { ptr.current = null; hideGhost(); return; }

      const s = STEPS[idxRef.current];
      const totalMove = Math.sqrt((e.clientX - p.startX) ** 2 + (e.clientY - p.startY) ** 2);
      const wasTap = !p.moved && totalMove < TAP_MAX_MOVE;

      if (p.moved && s) {
        applyGhostDom(null, 0, 0, 0);
        const dropEl = document.elementFromPoint(e.clientX, e.clientY);
        const dropId =
          dropEl?.closest?.('[data-obj-id]')?.getAttribute('data-obj-id') ||
          (dropEl as HTMLElement | null)?.getAttribute?.('data-obj-id');

        if (s.kind === 'drag') {
          if (p.id === s.targetId && dropId === s.dropId) {
            if (s.mergeImg) setMergeMap((m) => ({ ...m, [s.dropId!]: s.mergeImg! }));
            setConsumed((c) => (c.includes(s.targetId) ? c : [...c, s.targetId]));
            playFx(s.successSound);
            hideGhost(); ptr.current = null; completeRef.current(); return;
          }
          hideGhost(); ptr.current = null; return;
        }
        if (s.kind === 'shake' && p.id === s.targetId) {
          hideGhost(); ptr.current = null; return;
        }
      }

      if (wasTap && s) {
        if (s.kind === 'multi') {
          if (p.id === s.targetId) {
            if (multiCountRef.current < 3) {
              const next = multiCountRef.current + 1;
              const soundIdx = Math.min(multiCountRef.current, (s.stageSounds?.length || 1) - 1);
              playFx(s.stageSounds?.[soundIdx]);
              multiCountRef.current = next; setMultiCount(next);
              if (next === 3) {
                multiFinishingRef.current = true;
                setTimeout(() => {
                  multiFinishingRef.current = false;
                  completeRef.current();
                }, 700);
              }
            }
          }
        } else if (s.kind === 'tap') {
          if (p.id === s.targetId) completeRef.current();
        }
      }

      ptr.current = null; hideGhost();
    };

    document.addEventListener('pointermove', onMove, { passive: false });
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
    };
  }, []); // eslint-disable-line

  const onItemPointerDown = (e: React.PointerEvent, id: string) => {
    if (lockedRef.current) return;
    if (multiFinishingRef.current) return;
    if (consumed.includes(id)) return;
    e.preventDefault(); e.stopPropagation();
    try { (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); } catch { /* */ }

    const s = STEPS[idxRef.current];
    const isShakeTarget = !!(s?.kind === 'shake' && s.targetId === id);

    ptr.current = {
      id, pointerId: e.pointerId,
      startX: e.clientX, startY: e.clientY,
      lastX: e.clientX, lastY: e.clientY,
      moved: false,
      shakeAccumMs: 0, lastShakeMoveAt: 0, shakeStarted: false,
      isShakeTarget,
    };

    if (isShakeTarget) {
      setShakeActiveId(id);
      applyGhostDom(id, e.clientX, e.clientY, 0);
      dragPosRef.current = { x: e.clientX, y: e.clientY };
      setDragId(id);
    }
  };

  useEffect(() => () => { stopMarakasSound(); }, []);

  const displayImg = (id: string): string | undefined => {
    if (mergeMap[id]) return mergeMap[id];
    if (step.kind === 'multi' && step.targetId === id && step.stages) {
      return step.stages[Math.min(multiCount, step.stages.length - 1)];
    }
    return step.imgs[id];
  };

  const objectIds = Object.keys(step.imgs);

  return (
    <div className="fixed inset-0 h-[100dvh] w-screen z-[100] flex flex-col bg-slate-950 text-white font-sans select-none" style={{ touchAction: 'none' }}>
      <div className="shrink-0 p-4 landscape:py-2 landscape:px-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur-md relative z-10">
        <button onClick={() => { stopMarakasSound(); onClose(); }}
          className="p-2 landscape:p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
          <XCircle className="w-7 h-7 landscape:w-6 landscape:h-6" />
        </button>
        <div className="text-center flex flex-col items-center px-2">
          <h2 className="text-sm sm:text-lg landscape:text-sm font-bold text-slate-100">Etkileşim Denemesi</h2>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-1">
            {idx + 1} / {STEPS.length} · {step.label}
          </p>
        </div>
        <button onClick={skip}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-600 text-slate-300 text-xs font-bold hover:bg-slate-700 active:scale-95">
          <SkipForward size={14} /> Atla
        </button>
      </div>

      <div className="flex-1 relative flex flex-col items-center justify-center p-4 overflow-hidden" style={{ touchAction: 'none' }}>
        <div className="w-full max-w-md flex flex-col items-center mb-6">
          <div className="flex items-center gap-2 mb-2 text-cyan-400">
            <Hand size={20} />
            <span className="text-xs font-bold tracking-widest uppercase">Çocuğa göster / dene</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-center text-white mb-1">{step.hint}</h1>
          {step.kind === 'multi' && multiCount > 0 && (
            <p className="text-slate-400 text-sm">{Math.min(multiCount, 3)} / 3</p>
          )}
        </div>

        <div
          className={`flex items-center justify-center gap-6 w-full max-w-lg ${objectIds.length === 1 ? '' : 'flex-wrap'}`}
          style={{ touchAction: 'none' }}
        >
          {objectIds.map((id) => {
            const isConsumed = consumed.includes(id);
            const img = displayImg(id);
            const hiding = dragId === id || isConsumed;
            const shaking = shakeActiveId === id;
            return (
              <div key={id} data-obj-id={id} className="relative" style={{ touchAction: 'none' }}>
                <div
                  role="button"
                  tabIndex={0}
                  data-obj-id={id}
                  onPointerDown={(e) => onItemPointerDown(e, id)}
                  className={
                    `relative flex items-center justify-center rounded-3xl border-2 bg-slate-800/80 overflow-hidden p-4 transition-colors duration-150 ` +
                    (shaking ? 'border-amber-400 ring-2 ring-amber-500/40 ' : 'border-slate-600 ') +
                    (locked || isConsumed ? 'pointer-events-none ' : 'cursor-grab active:cursor-grabbing ')
                  }
                  style={{
                    touchAction: 'none',
                    visibility: hiding ? 'hidden' : 'visible',
                    width: objectIds.length === 1 ? 200 : 140,
                    height: objectIds.length === 1 ? 200 : 140,
                  }}
                >
                  {img && (
                    <img src={img} alt="" className="w-full h-full object-contain pointer-events-none" draggable={false} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <img
        ref={ghostRef}
        alt=""
        className="fixed pointer-events-none z-[200] w-28 h-28 object-contain drop-shadow-2xl"
        style={{ display: 'none', left: 0, top: 0, transformOrigin: 'center center', opacity: 0 }}
        draggable={false}
      />
    </div>
  );
}
