import { useState, useEffect, useRef, useCallback } from 'react';
import { XCircle, Check, X, Trophy } from 'lucide-react';
import { ScreenOrientation } from '@capacitor/screen-orientation';

import onaySes from './sesgorsel/onay.mp3';
import devametNotr from '@/aba/esle/ses/devametnotr.mp3';
import devamet2Notr from '@/aba/esle/ses/devamet2notr.mp3';
import simdisiradakiNotr from '@/aba/esle/ses/simdisiradakinotr.mp3';

// YTB 4.2 assets
import diskipkirlikapali from './sesgorsel/yonerge13/diskipkirlikapaliagiz.png';
import diskipkirli from './sesgorsel/yonerge13/diskipkirli.png';
import diskirli from './sesgorsel/yonerge13/diskirli.png';
import distemiz from './sesgorsel/yonerge13/distemiz.png';
import disfircasi from './sesgorsel/yonerge13/disfircasi.png';
import disfircasikullan from './sesgorsel/yonerge13/disfircasikullan.png';

import sacdapdaginik from './sesgorsel/yonerge13/sacdapdaginik.png';
import sacdaginik from './sesgorsel/yonerge13/sacdaginik.png';
import sacduzgun from './sesgorsel/yonerge13/sacduzgun.png';
import tarakImg from './sesgorsel/yonerge13/tarak.png';
import tarakkullan from './sesgorsel/yonerge13/tarakkullan.png';

import uykuluesne from './sesgorsel/yonerge13/uykuluesne.png';
import uykuluesne2 from './sesgorsel/yonerge13/uykuluesne2.png';
import yatakImg from './sesgorsel/yonerge13/yatak.png';
import yataktauyuyan from './sesgorsel/yonerge13/yataktauyuyan.png';

import esnemeSes from './sesgorsel/yonerge13/esnemeses.mp3';
import fircaSes from './sesgorsel/yonerge13/fircasesi.mp3';
import sacTaramaSes from './sesgorsel/yonerge13/sactaramases.mp3';

const NEUTRAL_SOUNDS = [devametNotr, devamet2Notr, simdisiradakiNotr];

type SceneType = 'candle' | 'teeth' | 'hair' | 'sleep' | 'teacher';

interface Trial {
  id: string;
  type: SceneType;
  text: string;
}

const TRIALS: Trial[] = [
  { id: 't1', type: 'candle', text: 'Yanan eli kurtar! Telefonu salla, mumu söndür' },
  { id: 't2', type: 'teeth', text: 'Çocuğun dişlerini temizle' },
  { id: 't3', type: 'hair', text: 'Çocuğun saçını tara' },
  { id: 't4', type: 'sleep', text: 'Uykusu gelen çocuğu yatağa yatır' },
  { id: 't5', type: 'teacher', text: 'Kalemi alıp yazmayı göster' },
  { id: 't6', type: 'teacher', text: 'Kitabı alıp oku' },
  { id: 't7', type: 'teacher', text: 'Bardağı alıp su iç' },
  { id: 't8', type: 'teacher', text: 'Sabunu alıp ellerini yıka' },
  { id: 't9', type: 'teacher', text: 'Ayakkabısını bağla' },
  { id: 't10', type: 'teacher', text: 'Çantayı aç' },
];

function playFx(src?: string) {
  if (!src) return;
  try {
    const a = new Audio(src);
    a.volume = 0.9;
    a.play().catch(() => {});
  } catch { /* */ }
}

function playNeutralTransition(): Promise<void> {
  return new Promise((resolve) => {
    const src = NEUTRAL_SOUNDS[Math.floor(Math.random() * NEUTRAL_SOUNDS.length)];
    try {
      const a = new Audio(src);
      a.volume = 1;
      const done = () => resolve();
      a.addEventListener('ended', done, { once: true });
      a.addEventListener('error', done, { once: true });
      a.play().catch(done);
    } catch {
      resolve();
    }
  });
}

/* ───────────── Live Candle — exaggerated sway on small shake ───────────── */
function LiveCandle({ onExtinguish, active }: { onExtinguish: () => void; active: boolean }) {
  const flameRef = useRef<HTMLDivElement>(null);
  const totalShake = useRef(0);
  const extinguished = useRef(false);
  const [gone, setGone] = useState(false);
  const [intensity, setIntensity] = useState(0);

  useEffect(() => {
    if (!active || extinguished.current) return;

    let last = 0;
    const handler = (e: DeviceMotionEvent) => {
      if (extinguished.current) return;
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
      const shake = Math.max(0, mag - 9.6);
      const now = Date.now();
      if (shake < 0.4) {
        setIntensity((v) => Math.max(0, v * 0.88));
        return;
      }
      if (now - last < 35) return;
      last = now;

      const amount = Math.min(42, 10 + shake * 8);
      setIntensity(amount);
      totalShake.current += shake * 1.4;

      if (flameRef.current) {
        const rot = (Math.random() - 0.5) * amount * 3.2;
        const tx = (Math.random() - 0.5) * amount * 1.8;
        const ty = -Math.random() * amount * 0.55;
        flameRef.current.animate(
          [{ transform: `translateX(-50%) rotate(${rot}deg) translate(${tx}px, ${ty}px) scale(${1 + amount * 0.012})` }],
          { duration: 70, fill: 'forwards' }
        );
      }

      if (totalShake.current > 28) {
        extinguished.current = true;
        setGone(true);
        setTimeout(() => onExtinguish(), 500);
      }
    };

    const req = async () => {
      try {
        const DOM = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
        if (typeof DOM.requestPermission === 'function') await DOM.requestPermission();
      } catch { /* */ }
      window.addEventListener('devicemotion', handler);
    };
    req();
    return () => window.removeEventListener('devicemotion', handler);
  }, [active, onExtinguish]);

  return (
    <div className="relative flex flex-col items-center justify-end h-64 w-40">
      {!gone && (
        <div ref={flameRef} className="absolute bottom-[118px] left-1/2 origin-bottom" style={{ transform: 'translateX(-50%)' }}>
          <div
            className="w-7 h-12 rounded-[50%_50%_40%_40%] relative"
            style={{
              background: 'radial-gradient(ellipse at 50% 80%, #fff9c4 0%, #ffeb3b 25%, #ff9800 55%, #ff5722 85%, transparent 100%)',
              filter: `blur(${0.4 + intensity * 0.03}px)`,
              boxShadow: `0 0 ${12 + intensity * 0.6}px ${4 + intensity * 0.25}px rgba(255,152,0,0.55)`,
            }}
          >
            <div
              className="absolute left-1/2 -translate-x-1/2 bottom-1 w-3.5 h-6 rounded-[50%_50%_40%_40%]"
              style={{ background: 'radial-gradient(ellipse at 50% 90%, #fffde7 0%, #fff59d 40%, transparent 80%)' }}
            />
          </div>
        </div>
      )}
      {!gone && <div className="absolute bottom-[112px] left-1/2 -translate-x-1/2 w-1 h-3 bg-slate-800 rounded-t-sm z-10" />}
      <div
        className="w-10 h-28 rounded-t-md relative z-0"
        style={{
          background: 'linear-gradient(90deg, #f5e6c8 0%, #fff8e7 40%, #e8d5a3 100%)',
          boxShadow: 'inset -4px 0 8px rgba(0,0,0,0.12)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-amber-100/80 rounded-t-md" />
      </div>
      <div className="w-16 h-3 bg-amber-900/70 rounded-b-md -mt-0.5" />
      {gone && <div className="absolute top-8 text-sm font-bold text-emerald-400 animate-pulse">Söndü!</div>}
    </div>
  );
}

/* ───────────── Teeth Scene — center zone, 3 strokes, brush sound ───────────── */
function TeethScene({ onSuccess, locked }: { onSuccess: () => void; locked: boolean }) {
  const [stage, setStage] = useState(0);
  const [holding, setHolding] = useState(false);
  const [brushPos, setBrushPos] = useState<{ x: number; y: number } | null>(null);
  const lastY = useRef(0);
  const strokes = useRef(0);
  const faceRef = useRef<HTMLDivElement>(null);
  const lastSound = useRef(0);

  const imgs = [diskipkirlikapali, diskipkirli, diskirli, distemiz];
  const brushSrc = holding ? disfircasikullan : disfircasi;

  useEffect(() => {
    if (stage === 0) {
      const t = setTimeout(() => setStage(1), 1200);
      return () => clearTimeout(t);
    }
  }, [stage]);

  const inTeethZone = (cx: number, cy: number) => {
    const el = faceRef.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const nx = (cx - r.left) / r.width;
    const ny = (cy - r.top) / r.height;
    return nx >= 0.25 && nx <= 0.75 && ny >= 0.28 && ny <= 0.72;
  };

  const onBrushMove = (cx: number, cy: number) => {
    if (locked || stage < 1 || stage >= 3) return;
    if (!inTeethZone(cx, cy)) return;

    const dy = Math.abs(cy - lastY.current);
    if (dy > 14) {
      strokes.current += 1;
      lastY.current = cy;

      const now = Date.now();
      if (now - lastSound.current > 280) {
        lastSound.current = now;
        playFx(fircaSes);
      }

      if (strokes.current >= 3 && stage === 1) {
        setStage(2);
        strokes.current = 0;
        playFx(onaySes);
      } else if (strokes.current >= 3 && stage === 2) {
        setStage(3);
        playFx(onaySes);
        setTimeout(() => onSuccess(), 600);
      }
    }
  };

  return (
    <div className="flex flex-col items-center h-full w-full relative">
      <div ref={faceRef} className="flex-1 flex items-center justify-center w-full px-4">
        <img src={imgs[stage]} alt="" className="max-h-[42vh] w-auto object-contain drop-shadow-xl" draggable={false} />
      </div>
      <div className="shrink-0 flex items-center justify-center gap-6 pb-6 pt-2">
        <div
          className={`w-24 h-24 rounded-2xl border-2 flex items-center justify-center touch-none ${
            holding ? 'border-emerald-400 bg-emerald-500/10 opacity-40' : 'border-slate-600 bg-slate-800'
          }`}
          onPointerDown={(e) => {
            if (locked || stage < 1 || stage >= 3) return;
            e.preventDefault();
            (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
            setHolding(true);
            lastY.current = e.clientY;
            setBrushPos({ x: e.clientX, y: e.clientY });
          }}
          onPointerMove={(e) => {
            if (!holding) return;
            setBrushPos({ x: e.clientX, y: e.clientY });
            onBrushMove(e.clientX, e.clientY);
          }}
          onPointerUp={() => { setHolding(false); setBrushPos(null); }}
          onPointerCancel={() => { setHolding(false); setBrushPos(null); }}
        >
          <img src={disfircasi} alt="" className="w-16 h-16 object-contain pointer-events-none" draggable={false} />
        </div>
        <div className="w-20 h-20 rounded-2xl border-2 border-slate-700 bg-slate-800/60 flex items-center justify-center opacity-50">
          <span className="text-3xl">🥄</span>
        </div>
        <div className="w-20 h-20 rounded-2xl border-2 border-slate-700 bg-slate-800/60 flex items-center justify-center opacity-50">
          <span className="text-3xl">🪥</span>
        </div>
      </div>
      {brushPos && (
        <div className="fixed z-[90] pointer-events-none" style={{ left: brushPos.x, top: brushPos.y, transform: 'translate(-50%, -50%)' }}>
          <img src={brushSrc} alt="" className="w-20 h-20 object-contain drop-shadow-2xl" draggable={false} />
        </div>
      )}
    </div>
  );
}

/* ───────────── Hair Scene — upper zone only, 3 strokes, comb sound ───────────── */
function HairScene({ onSuccess, locked }: { onSuccess: () => void; locked: boolean }) {
  const [stage, setStage] = useState(0);
  const [holding, setHolding] = useState(false);
  const [combPos, setCombPos] = useState<{ x: number; y: number } | null>(null);
  const lastX = useRef(0);
  const strokes = useRef(0);
  const headRef = useRef<HTMLDivElement>(null);
  const lastSound = useRef(0);

  const imgs = [sacdapdaginik, sacdaginik, sacduzgun];
  const combSrc = holding ? tarakkullan : tarakImg;

  const inHairZone = (cx: number, cy: number) => {
    const el = headRef.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const nx = (cx - r.left) / r.width;
    const ny = (cy - r.top) / r.height;
    return nx >= 0.1 && nx <= 0.9 && ny >= 0.02 && ny <= 0.55;
  };

  const onCombMove = (cx: number, cy: number) => {
    if (locked || stage >= 2) return;
    if (!inHairZone(cx, cy)) return;

    const dx = Math.abs(cx - lastX.current);
    if (dx > 16) {
      strokes.current += 1;
      lastX.current = cx;

      const now = Date.now();
      if (now - lastSound.current > 300) {
        lastSound.current = now;
        playFx(sacTaramaSes);
      }

      if (strokes.current >= 3 && stage === 0) {
        setStage(1);
        strokes.current = 0;
        playFx(onaySes);
      } else if (strokes.current >= 3 && stage === 1) {
        setStage(2);
        playFx(onaySes);
        setTimeout(() => onSuccess(), 600);
      }
    }
  };

  return (
    <div className="flex flex-col items-center h-full w-full relative">
      <div ref={headRef} className="flex-1 flex items-center justify-center w-full px-4">
        <img src={imgs[stage]} alt="" className="max-h-[42vh] w-auto object-contain drop-shadow-xl" draggable={false} />
      </div>
      <div className="shrink-0 flex items-center justify-center gap-6 pb-6 pt-2">
        <div
          className={`w-24 h-24 rounded-2xl border-2 flex items-center justify-center touch-none ${
            holding ? 'border-emerald-400 bg-emerald-500/10 opacity-40' : 'border-slate-600 bg-slate-800'
          }`}
          onPointerDown={(e) => {
            if (locked || stage >= 2) return;
            e.preventDefault();
            (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
            setHolding(true);
            lastX.current = e.clientX;
            setCombPos({ x: e.clientX, y: e.clientY });
          }}
          onPointerMove={(e) => {
            if (!holding) return;
            setCombPos({ x: e.clientX, y: e.clientY });
            onCombMove(e.clientX, e.clientY);
          }}
          onPointerUp={() => { setHolding(false); setCombPos(null); }}
          onPointerCancel={() => { setHolding(false); setCombPos(null); }}
        >
          <img src={tarakImg} alt="" className="w-16 h-16 object-contain pointer-events-none" draggable={false} />
        </div>
        <div className="w-20 h-20 rounded-2xl border-2 border-slate-700 bg-slate-800/60 flex items-center justify-center opacity-50">
          <span className="text-3xl">🪥</span>
        </div>
        <div className="w-20 h-20 rounded-2xl border-2 border-slate-700 bg-slate-800/60 flex items-center justify-center opacity-50">
          <span className="text-3xl">🥄</span>
        </div>
      </div>
      {combPos && (
        <div className="fixed z-[90] pointer-events-none" style={{ left: combPos.x, top: combPos.y, transform: 'translate(-50%, -50%)' }}>
          <img src={combSrc} alt="" className="w-20 h-20 object-contain drop-shadow-2xl" draggable={false} />
        </div>
      )}
    </div>
  );
}

/* ───────────── Sleep Scene — 4s normal, yawn + sound, back ───────────── */
function SleepScene({ onSuccess, locked }: { onSuccess: () => void; locked: boolean }) {
  const [done, setDone] = useState(false);
  const [yawning, setYawning] = useState(false);
  const [holding, setHolding] = useState(false);
  const [bedPos, setBedPos] = useState<{ x: number; y: number } | null>(null);
  const childRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (done) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const loop = () => {
      timer = setTimeout(() => {
        if (cancelled) return;
        setYawning(true);
        playFx(esnemeSes);
        timer = setTimeout(() => {
          if (cancelled) return;
          setYawning(false);
          loop();
        }, 1200);
      }, 4000);
    };
    loop();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [done]);

  const checkDrop = (cx: number, cy: number) => {
    if (!childRef.current || locked || done) return;
    const r = childRef.current.getBoundingClientRect();
    if (cx >= r.left - 20 && cx <= r.right + 20 && cy >= r.top - 20 && cy <= r.bottom + 20) {
      setDone(true);
      playFx(onaySes);
      setTimeout(() => onSuccess(), 700);
    }
  };

  return (
    <div className="flex flex-col items-center h-full w-full relative">
      <div ref={childRef} className="flex-1 flex items-center justify-center w-full px-4">
        <img
          src={done ? yataktauyuyan : yawning ? uykuluesne : uykuluesne2}
          alt=""
          className="max-h-[42vh] w-auto object-contain drop-shadow-xl transition-opacity duration-200"
          draggable={false}
        />
      </div>
      <div className="shrink-0 flex items-center justify-center gap-6 pb-6 pt-2">
        <div
          className={`w-28 h-24 rounded-2xl border-2 flex items-center justify-center touch-none ${
            holding || done ? 'border-emerald-400 bg-emerald-500/10 opacity-40' : 'border-slate-600 bg-slate-800'
          }`}
          onPointerDown={(e) => {
            if (locked || done) return;
            e.preventDefault();
            (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
            setHolding(true);
            setBedPos({ x: e.clientX, y: e.clientY });
          }}
          onPointerMove={(e) => {
            if (!holding) return;
            setBedPos({ x: e.clientX, y: e.clientY });
          }}
          onPointerUp={(e) => {
            if (holding) checkDrop(e.clientX, e.clientY);
            setHolding(false);
            setBedPos(null);
          }}
          onPointerCancel={() => { setHolding(false); setBedPos(null); }}
        >
          <img src={yatakImg} alt="" className="w-20 h-16 object-contain pointer-events-none" draggable={false} />
        </div>
        <div className="w-20 h-20 rounded-2xl border-2 border-slate-700 bg-slate-800/60 flex items-center justify-center opacity-50">
          <span className="text-3xl">🧸</span>
        </div>
        <div className="w-20 h-20 rounded-2xl border-2 border-slate-700 bg-slate-800/60 flex items-center justify-center opacity-50">
          <span className="text-3xl">🥄</span>
        </div>
      </div>
      {bedPos && (
        <div className="fixed z-[90] pointer-events-none" style={{ left: bedPos.x, top: bedPos.y, transform: 'translate(-50%, -50%)' }}>
          <img src={yatakImg} alt="" className="w-24 h-20 object-contain drop-shadow-2xl" draggable={false} />
        </div>
      )}
    </div>
  );
}

/* ───────────── Main Component ───────────── */
interface Yonerge13Props {
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

type Phase = 'running' | 'result';

export default function Yonerge13({
  itemCode = 'YTB 4.2',
  itemText = 'Mantık Kurarak Yönergeleri Yerine Getirme',
  onClose,
  onComplete,
}: Yonerge13Props) {
  const [phase, setPhase] = useState<Phase>('running');
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);

  const trial = TRIALS[idx];

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

  const finishTrial = useCallback(
    async (correct: boolean) => {
      if (locked) return;
      setLocked(true);
      const newScore = score + (correct ? 1 : 0);
      setScore(newScore);
      if (correct) playFx(onaySes);

      await playNeutralTransition();

      const next = idx + 1;
      if (next >= 10) {
        setPhase('result');
        return;
      }
      setIdx(next);
      setLocked(false);
    },
    [locked, score, idx]
  );

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
          <div className="shrink-0 px-4 pt-3 pb-2 text-center">
            <h1 className="text-base sm:text-xl font-black leading-snug text-white">{trial.text}</h1>
          </div>

          <div className="relative flex-1 min-h-0 flex flex-col">
            {trial.type === 'candle' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <LiveCandle active={!locked} onExtinguish={() => finishTrial(true)} />
                <p className="text-xs text-slate-400 mt-2">Telefonu salla → mum söner</p>
              </div>
            )}

            {trial.type === 'teeth' && <TeethScene locked={locked} onSuccess={() => finishTrial(true)} />}
            {trial.type === 'hair' && <HairScene locked={locked} onSuccess={() => finishTrial(true)} />}
            {trial.type === 'sleep' && <SleepScene locked={locked} onSuccess={() => finishTrial(true)} />}

            {trial.type === 'teacher' && (
              <div className="flex-1 flex items-center justify-center px-6">
                <p className="text-lg text-slate-300 text-center font-medium">
                  Öğretmen ile yapın.<br />
                  <span className="text-sm text-slate-500">Aşağıdaki butonlardan işaretleyin.</span>
                </p>
              </div>
            )}
          </div>

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
