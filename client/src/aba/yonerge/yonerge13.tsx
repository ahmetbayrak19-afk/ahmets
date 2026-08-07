import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { XCircle, Check, X, Trophy } from 'lucide-react';
import { ScreenOrientation } from '@capacitor/screen-orientation';

import onaySes from './sesgorsel/onay.mp3';
import devametNotr from '@/aba/esle/ses/devametnotr.mp3';
import devamet2Notr from '@/aba/esle/ses/devamet2notr.mp3';
import simdisiradakiNotr from '@/aba/esle/ses/simdisiradakinotr.mp3';

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

import yatakImg from './sesgorsel/yonerge13/yatak.png';

import fircaSes from './sesgorsel/yonerge13/fircasesi.mp3';
import sacTaramaSes from './sesgorsel/yonerge13/sactaramases.mp3';

import uykuluesniyorVid from './sesgorsel/yonerge13/uykuluesniyor.mp4';
import uykuluyatagayatanVid from './sesgorsel/yonerge13/uykuluyatagayatan.mp4';
import uykuluesniyorSes from './sesgorsel/yonerge13/uykuluesniyor.mp3';

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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function useMotionSound(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const a = new Audio(src);
    a.loop = true;
    a.volume = 0.85;
    a.preload = 'auto';
    audioRef.current = a;
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      a.pause();
      a.src = '';
      audioRef.current = null;
    };
  }, [src]);

  const start = useCallback(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
  }, []);

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    try { a.currentTime = 0; } catch { /* */ }
  }, []);

  const pulse = useCallback(() => {
    start();
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => stop(), 180);
  }, [start, stop]);

  return { pulse, stop };
}

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
      if (shake < 0.35) {
        setIntensity((v) => Math.max(0, v * 0.9));
        return;
      }
      if (now - last < 30) return;
      last = now;
      const amount = Math.min(58, 14 + shake * 11);
      setIntensity(amount);
      if (flameRef.current) {
        const rot = (Math.random() - 0.5) * amount * 3.8;
        flameRef.current.animate(
          [{ transform: `translateX(-50%) rotate(${rot}deg) scaleY(${1 + amount * 0.006})` }],
          { duration: 65, fill: 'forwards' }
        );
      }
      if (shake > 1.8) totalShake.current += shake * 0.55;
      if (totalShake.current > 95) {
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
        <div ref={flameRef} className="absolute bottom-[118px] left-1/2" style={{ transform: 'translateX(-50%)', transformOrigin: '50% 100%' }}>
          <div className="w-7 h-12 rounded-[50%_50%_40%_40%] relative" style={{
            background: 'radial-gradient(ellipse at 50% 80%, #fff9c4 0%, #ffeb3b 25%, #ff9800 55%, #ff5722 85%, transparent 100%)',
            filter: `blur(${0.4 + intensity * 0.025}px)`,
            boxShadow: `0 0 ${12 + intensity * 0.55}px ${4 + intensity * 0.22}px rgba(255,152,0,0.55)`,
          }}>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-1 w-3.5 h-6 rounded-[50%_50%_40%_40%]" style={{ background: 'radial-gradient(ellipse at 50% 90%, #fffde7 0%, #fff59d 40%, transparent 80%)' }} />
          </div>
        </div>
      )}
      {!gone && <div className="absolute bottom-[112px] left-1/2 -translate-x-1/2 w-1 h-3 bg-slate-800 rounded-t-sm z-10" />}
      <div className="w-10 h-28 rounded-t-md relative z-0" style={{ background: 'linear-gradient(90deg, #f5e6c8 0%, #fff8e7 40%, #e8d5a3 100%)', boxShadow: 'inset -4px 0 8px rgba(0,0,0,0.12)' }}>
        <div className="absolute top-0 left-0 right-0 h-2 bg-amber-100/80 rounded-t-md" />
      </div>
      <div className="w-16 h-3 bg-amber-900/70 rounded-b-md -mt-0.5" />
      {gone && <div className="absolute top-8 text-sm font-bold text-emerald-400 animate-pulse">Söndü!</div>}
    </div>
  );
}

type ToolId = 'brush' | 'comb' | 'bed';

function TeethScene({ onSuccess, onFail, locked }: { onSuccess: () => void; onFail: () => void; locked: boolean }) {
  const [stage, setStage] = useState(0);
  const [holding, setHolding] = useState(false);
  const [brushPos, setBrushPos] = useState<{ x: number; y: number } | null>(null);
  const lastY = useRef(0);
  const strokes = useRef(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const { pulse, stop } = useMotionSound(fircaSes);
  const imgs = [diskipkirlikapali, diskipkirli, diskirli, distemiz];
  const brushSrc = holding ? disfircasikullan : disfircasi;
  const options = useMemo(() => shuffle([
    { id: 'brush' as ToolId, src: disfircasi },
    { id: 'comb' as ToolId, src: tarakImg },
    { id: 'bed' as ToolId, src: yatakImg },
  ]), []);

  useEffect(() => {
    if (stage === 0) {
      const t = setTimeout(() => setStage(1), 1200);
      return () => clearTimeout(t);
    }
  }, [stage]);
  useEffect(() => () => stop(), [stop]);

  const inTeethZone = (cx: number, cy: number) => {
    const el = imgRef.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return false;
    const nx = (cx - r.left) / r.width;
    const ny = (cy - r.top) / r.height;
    return nx >= 0.34 && nx <= 0.66 && ny >= 0.42 && ny <= 0.62;
  };

  const onBrushMove = (cx: number, cy: number) => {
    if (locked || stage < 1 || stage >= 3) return;
    if (!inTeethZone(cx, cy)) { stop(); return; }
    const dy = Math.abs(cy - lastY.current);
    if (dy > 16) {
      strokes.current += 1;
      lastY.current = cy;
      pulse();
      if (strokes.current >= 8 && stage === 1) { setStage(2); strokes.current = 0; stop(); playFx(onaySes); }
      else if (strokes.current >= 8 && stage === 2) { setStage(3); stop(); playFx(onaySes); setTimeout(() => onSuccess(), 600); }
    }
  };

  const endHold = () => { setHolding(false); setBrushPos(null); stop(); };

  return (
    <div className="flex flex-col items-center h-full w-full relative">
      <div className="flex-1 flex items-center justify-center w-full px-4">
        <img ref={imgRef} src={imgs[stage]} alt="" className="max-h-[42vh] w-auto object-contain drop-shadow-xl" draggable={false} />
      </div>
      <div className="shrink-0 flex items-center justify-center gap-4 pb-6 pt-2 px-2">
        {options.map((opt) => {
          const isCorrect = opt.id === 'brush';
          const isHoldingThis = holding && isCorrect;
          return (
            <div key={opt.id} className={`w-24 h-24 rounded-2xl border-2 flex items-center justify-center touch-none ${isHoldingThis ? 'border-emerald-400 bg-emerald-500/10 opacity-40' : 'border-slate-600 bg-slate-800'}`}
              onPointerDown={(e) => {
                if (locked || stage < 1 || stage >= 3) return;
                e.preventDefault();
                if (!isCorrect) { onFail(); return; }
                (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
                setHolding(true); lastY.current = e.clientY; setBrushPos({ x: e.clientX, y: e.clientY });
              }}
              onPointerMove={(e) => { if (!holding || !isCorrect) return; setBrushPos({ x: e.clientX, y: e.clientY }); onBrushMove(e.clientX, e.clientY); }}
              onPointerUp={endHold} onPointerCancel={endHold}>
              <img src={opt.src} alt="" className="w-16 h-16 object-contain pointer-events-none" draggable={false} />
            </div>
          );
        })}
      </div>
      {brushPos && (
        <div className="fixed z-[90] pointer-events-none" style={{ left: brushPos.x, top: brushPos.y, transform: 'translate(-50%, -50%)' }}>
          <img src={brushSrc} alt="" className="w-20 h-20 object-contain drop-shadow-2xl" draggable={false} />
        </div>
      )}
    </div>
  );
}

function HairScene({ onSuccess, onFail, locked }: { onSuccess: () => void; onFail: () => void; locked: boolean }) {
  const [stage, setStage] = useState(0);
  const [holding, setHolding] = useState(false);
  const [combPos, setCombPos] = useState<{ x: number; y: number } | null>(null);
  const lastX = useRef(0);
  const strokes = useRef(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const { pulse, stop } = useMotionSound(sacTaramaSes);
  const imgs = [sacdapdaginik, sacdaginik, sacduzgun];
  const combSrc = holding ? tarakkullan : tarakImg;
  const options = useMemo(() => shuffle([
    { id: 'comb' as ToolId, src: tarakImg },
    { id: 'brush' as ToolId, src: disfircasi },
    { id: 'bed' as ToolId, src: yatakImg },
  ]), []);
  useEffect(() => () => stop(), [stop]);

  const inHairZone = (cx: number, cy: number) => {
    const el = imgRef.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return false;
    const nx = (cx - r.left) / r.width;
    const ny = (cy - r.top) / r.height;
    return nx >= 0.25 && nx <= 0.75 && ny >= 0.0 && ny <= 0.25;
  };

  const onCombMove = (cx: number, cy: number) => {
    if (locked || stage >= 2) return;
    if (!inHairZone(cx, cy)) { stop(); return; }
    const dx = Math.abs(cx - lastX.current);
    if (dx > 36) {
      strokes.current += 1;
      lastX.current = cx;
      pulse();
      if (strokes.current >= 7 && stage === 0) { setStage(1); strokes.current = 0; stop(); playFx(onaySes); }
      else if (strokes.current >= 7 && stage === 1) { setStage(2); stop(); playFx(onaySes); setTimeout(() => onSuccess(), 600); }
    }
  };

  const endHold = () => { setHolding(false); setCombPos(null); stop(); };

  return (
    <div className="flex flex-col items-center h-full w-full relative">
      <div className="flex-1 flex items-center justify-center w-full px-4">
        <img ref={imgRef} src={imgs[stage]} alt="" className="max-h-[42vh] w-auto object-contain drop-shadow-xl" draggable={false} />
      </div>
      <div className="shrink-0 flex items-center justify-center gap-4 pb-6 pt-2 px-2">
        {options.map((opt) => {
          const isCorrect = opt.id === 'comb';
          const isHoldingThis = holding && isCorrect;
          return (
            <div key={opt.id} className={`w-24 h-24 rounded-2xl border-2 flex items-center justify-center touch-none ${isHoldingThis ? 'border-emerald-400 bg-emerald-500/10 opacity-40' : 'border-slate-600 bg-slate-800'}`}
              onPointerDown={(e) => {
                if (locked || stage >= 2) return;
                e.preventDefault();
                if (!isCorrect) { onFail(); return; }
                (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
                setHolding(true); lastX.current = e.clientX; setCombPos({ x: e.clientX, y: e.clientY });
              }}
              onPointerMove={(e) => { if (!holding || !isCorrect) return; setCombPos({ x: e.clientX, y: e.clientY }); onCombMove(e.clientX, e.clientY); }}
              onPointerUp={endHold} onPointerCancel={endHold}>
              <img src={opt.src} alt="" className="w-16 h-16 object-contain pointer-events-none" draggable={false} />
            </div>
          );
        })}
      </div>
      {combPos && (
        <div className="fixed z-[90] pointer-events-none" style={{ left: combPos.x, top: combPos.y, transform: 'translate(-50%, -50%)' }}>
          <img src={combSrc} alt="" className="w-20 h-20 object-contain drop-shadow-2xl" draggable={false} />
        </div>
      )}
    </div>
  );
}

/* Dual video sleep — no src swap, no play-button flash */
function SleepScene({ onSuccess, onFail, locked }: { onSuccess: () => void; onFail: () => void; locked: boolean }) {
  const [done, setDone] = useState(false);
  const [holding, setHolding] = useState(false);
  const [bedPos, setBedPos] = useState<{ x: number; y: number } | null>(null);
  const yawnRef = useRef<HTMLVideoElement>(null);
  const bedRef = useRef<HTMLVideoElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const yawnAudioRef = useRef<HTMLAudioElement | null>(null);
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneRef = useRef(false);

  const options = useMemo(() => shuffle([
    { id: 'bed' as ToolId, src: yatakImg },
    { id: 'brush' as ToolId, src: disfircasi },
    { id: 'comb' as ToolId, src: tarakImg },
  ]), []);

  useEffect(() => {
    const a = new Audio(uykuluesniyorSes);
    a.preload = 'auto';
    a.volume = 1;
    yawnAudioRef.current = a;
    return () => { a.pause(); a.src = ''; yawnAudioRef.current = null; };
  }, []);

  // Preload bed video once — never change its src
  useEffect(() => {
    const b = bedRef.current;
    if (!b) return;
    b.src = uykuluyatagayatanVid;
    b.muted = true;
    b.playsInline = true;
    b.controls = false;
    b.disablePictureInPicture = true;
    b.preload = 'auto';
    b.load();
  }, []);

  useEffect(() => {
    if (done) return;
    const v = yawnRef.current;
    if (!v) return;
    doneRef.current = false;
    v.src = uykuluesniyorVid;
    v.muted = true;
    v.playsInline = true;
    v.controls = false;
    v.disablePictureInPicture = true;
    v.setAttribute('playsinline', 'true');
    v.setAttribute('webkit-playsinline', 'true');
    v.preload = 'auto';

    const clearWait = () => {
      if (waitTimerRef.current) { clearTimeout(waitTimerRef.current); waitTimerRef.current = null; }
    };
    const stopYawnAudio = () => {
      const a = yawnAudioRef.current;
      if (!a) return;
      a.pause();
      try { a.currentTime = 0; } catch { /* */ }
    };
    const playYawn = () => {
      if (doneRef.current) return;
      clearWait();
      try { v.currentTime = 0; } catch { /* */ }
      const a = yawnAudioRef.current;
      if (a) { try { a.currentTime = 0; } catch { /* */ } a.play().catch(() => {}); }
      v.play().catch(() => {});
    };
    const onEnded = () => {
      if (doneRef.current) return;
      v.pause();
      try { v.currentTime = 0; } catch { /* */ }
      stopYawnAudio();
      clearWait();
      waitTimerRef.current = setTimeout(() => { if (!doneRef.current) playYawn(); }, 5000);
    };
    v.addEventListener('ended', onEnded);
    const start = () => playYawn();
    if (v.readyState >= 2) start();
    else v.addEventListener('loadeddata', start, { once: true });
    return () => { clearWait(); v.removeEventListener('ended', onEnded); v.pause(); stopYawnAudio(); };
  }, [done]);

  const checkDrop = (cx: number, cy: number) => {
    if (!dropRef.current || locked || done) return;
    const r = dropRef.current.getBoundingClientRect();
    if (cx < r.left - 20 || cx > r.right + 20 || cy < r.top - 20 || cy > r.bottom + 20) return;

    doneRef.current = true;
    setDone(true);
    if (waitTimerRef.current) { clearTimeout(waitTimerRef.current); waitTimerRef.current = null; }
    const ya = yawnAudioRef.current;
    if (ya) { ya.pause(); try { ya.currentTime = 0; } catch { /* */ } }
    const yv = yawnRef.current;
    if (yv) { yv.pause(); try { yv.currentTime = 0; } catch { /* */ } }

    const bv = bedRef.current;
    if (!bv) { onSuccess(); return; }

    const finish = () => { bv.removeEventListener('ended', finish); onSuccess(); };
    bv.addEventListener('ended', finish);
    const playBed = () => {
      try { bv.currentTime = 0; } catch { /* */ }
      bv.play().catch(() => { setTimeout(finish, 800); });
    };
    if (bv.readyState >= 2) playBed();
    else bv.addEventListener('loadeddata', playBed, { once: true });
  };

  const videoClass =
    'max-h-[42vh] w-auto object-contain drop-shadow-xl rounded-xl bg-black pointer-events-none [&::-webkit-media-controls]:hidden [&::-webkit-media-controls-enclosure]:hidden [&::-webkit-media-controls-panel]:hidden [&::-webkit-media-controls-start-playback-button]:hidden [&::-webkit-media-controls-overlay-play-button]:hidden';

  return (
    <div className="flex flex-col items-center h-full w-full relative">
      <div ref={dropRef} className="flex-1 flex items-center justify-center w-full px-4 relative">
        <video
          ref={yawnRef}
          className={videoClass}
          style={{ display: done ? 'none' : 'block' }}
          playsInline
          muted
          controls={false}
          disablePictureInPicture
          preload="auto"
        />
        <video
          ref={bedRef}
          className={videoClass}
          style={{ display: done ? 'block' : 'none' }}
          playsInline
          muted
          controls={false}
          disablePictureInPicture
          preload="auto"
        />
      </div>
      <div className="shrink-0 flex items-center justify-center gap-4 pb-6 pt-2 px-2">
        {options.map((opt) => {
          const isCorrect = opt.id === 'bed';
          const isHoldingThis = (holding || done) && isCorrect;
          return (
            <div key={opt.id} className={`w-24 h-24 rounded-2xl border-2 flex items-center justify-center touch-none ${isHoldingThis ? 'border-emerald-400 bg-emerald-500/10 opacity-40' : 'border-slate-600 bg-slate-800'}`}
              onPointerDown={(e) => {
                if (locked || done) return;
                e.preventDefault();
                if (!isCorrect) { onFail(); return; }
                (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
                setHolding(true); setBedPos({ x: e.clientX, y: e.clientY });
              }}
              onPointerMove={(e) => { if (!holding || !isCorrect) return; setBedPos({ x: e.clientX, y: e.clientY }); }}
              onPointerUp={(e) => { if (holding && isCorrect) checkDrop(e.clientX, e.clientY); setHolding(false); setBedPos(null); }}
              onPointerCancel={() => { setHolding(false); setBedPos(null); }}>
              <img src={opt.src} alt="" className="w-16 h-16 object-contain pointer-events-none" draggable={false} />
            </div>
          );
        })}
      </div>
      {bedPos && (
        <div className="fixed z-[90] pointer-events-none" style={{ left: bedPos.x, top: bedPos.y, transform: 'translate(-50%, -50%)' }}>
          <img src={yatakImg} alt="" className="w-20 h-16 object-contain drop-shadow-2xl" draggable={false} />
        </div>
      )}
    </div>
  );
}

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
          </div>
          <div className="relative flex-1 min-h-0 flex flex-col">
            {trial.type === 'candle' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <LiveCandle active={!locked} onExtinguish={() => finishTrial(true)} />
                <p className="text-xs text-slate-400 mt-2">Telefonu salla → mum söner</p>
              </div>
            )}
            {trial.type === 'teeth' && <TeethScene locked={locked} onSuccess={() => finishTrial(true)} onFail={() => finishTrial(false)} />}
            {trial.type === 'hair' && <HairScene locked={locked} onSuccess={() => finishTrial(true)} onFail={() => finishTrial(false)} />}
            {trial.type === 'sleep' && <SleepScene locked={locked} onSuccess={() => finishTrial(true)} onFail={() => finishTrial(false)} />}
            {trial.type === 'teacher' && (
              <div className="flex-1 flex items-center justify-center px-6">
                <p className="text-lg text-slate-300 text-center font-medium">Öğretmen ile yapın.<br /><span className="text-sm text-slate-500">Aşağıdaki butonlardan işaretleyin.</span></p>
              </div>
            )}
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
