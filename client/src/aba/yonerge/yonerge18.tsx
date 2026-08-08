import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { XCircle, Check, X, Trophy, RefreshCw } from 'lucide-react';
import { ScreenOrientation } from '@capacitor/screen-orientation';

import onaySes from './sesgorsel/onay.mp3';
import devametNotr from '@/aba/esle/ses/devametnotr.mp3';
import devamet2Notr from '@/aba/esle/ses/devamet2notr.mp3';
import simdisiradakiNotr from '@/aba/esle/ses/simdisiradakinotr.mp3';

import c1 from './sesgorsel/yonerge13/kirmizitshirtkisasacoturgozlukerkek.png';
import c1top from './sesgorsel/yonerge13/kirmizitshirtkisasacoturgozlukerkektop.png';
import c1bayrak from './sesgorsel/yonerge13/kirmizitshirtkisasacoturgozlukerkekbayrak.png';

import c2 from './sesgorsel/yonerge13/yesiltshirtkısasacayaktagozluksuzerkek.png';
import c2top from './sesgorsel/yonerge13/yesiltshirtkısasacayaktagozluksuzerkektop.png';
import c2bayrak from './sesgorsel/yonerge13/yesiltshirtkısasacayaktagozluksuzerkekbayrak.png';

import c3 from './sesgorsel/yonerge13/uzunsacsaritshirtayaktagozluksuzerkek.png';
import c3top from './sesgorsel/yonerge13/uzunsacsaritshirtayaktagozluksuzerkektop.png';
import c3bayrak from './sesgorsel/yonerge13/uzunsacsaritshirtayaktagozluksuzerkekbayrak.png';

import c4 from './sesgorsel/yonerge13/mortshirtuzunsacoturgozlukerkek.png';
import c4top from './sesgorsel/yonerge13/mortshirtuzunsacoturgozlukerkektop.png';
import c4bayrak from './sesgorsel/yonerge13/mortshirtuzunsacoturgozlukerkekbayrak.png';

import c5 from './sesgorsel/yonerge13/etekbeyaztshirtuzunsacgozlukkiz.png';
import c5top from './sesgorsel/yonerge13/etekbeyaztshirtuzunsacgozlukkiztop.png';
import c5bayrak from './sesgorsel/yonerge13/etekbeyaztshirtuzunsacgozlukkizbayrak.png';

import objAlkis from './sesgorsel/yonerge13/alkis.png';
import objTop from './sesgorsel/yonerge13/top.png';
import objBayrak from './sesgorsel/yonerge13/bayrak.png';

const NEUTRAL_SOUNDS = [devametNotr, devamet2Notr, simdisiradakiNotr];

type Hair = 'kisa' | 'uzun';
type Glasses = 'gozluk' | 'gozluksuz';
type Pose = 'otur' | 'ayakta';
type Gender = 'erkek' | 'kiz';
type ObjectId = 'alkis' | 'top' | 'bayrak';

interface Character {
  id: string;
  img: string;
  imgTop: string;
  imgBayrak: string;
  hair: Hair;
  glasses: Glasses;
  pose: Pose;
  gender: Gender;
  label: string;
}

const CHARACTERS: Character[] = [
  { id: 'c1', img: c1, imgTop: c1top, imgBayrak: c1bayrak, hair: 'kisa', glasses: 'gozluk', pose: 'otur', gender: 'erkek', label: 'Kisa gozluk oturan erkek' },
  { id: 'c2', img: c2, imgTop: c2top, imgBayrak: c2bayrak, hair: 'kisa', glasses: 'gozluksuz', pose: 'ayakta', gender: 'erkek', label: 'Kisa gozluksuz ayakta erkek' },
  { id: 'c3', img: c3, imgTop: c3top, imgBayrak: c3bayrak, hair: 'uzun', glasses: 'gozluksuz', pose: 'ayakta', gender: 'erkek', label: 'Uzun gozluksuz ayakta erkek' },
  { id: 'c4', img: c4, imgTop: c4top, imgBayrak: c4bayrak, hair: 'uzun', glasses: 'gozluk', pose: 'otur', gender: 'erkek', label: 'Uzun gozluk oturan erkek' },
  { id: 'c5', img: c5, imgTop: c5top, imgBayrak: c5bayrak, hair: 'uzun', glasses: 'gozluk', pose: 'ayakta', gender: 'kiz', label: 'Uzun gozluk kiz' },
];

const OBJECTS: { id: ObjectId; img: string; label: string }[] = [
  { id: 'alkis', img: objAlkis, label: 'Alkis' },
  { id: 'top', img: objTop, label: 'Top' },
  { id: 'bayrak', img: objBayrak, label: 'Bayrak' },
];

interface DigitalTask {
  id: string;
  kind: 'tap' | 'drag';
  text: string;
  hair?: Hair;
  glasses?: Glasses;
  pose?: Pose;
  gender?: Gender;
  tapsNeeded?: number;
  objectId?: ObjectId;
}

const DIGITAL_POOL: DigitalTask[] = [
  { id: 't1', kind: 'tap', text: 'Kisa sacli ve gozluklu kisiye 3 kez dokun', hair: 'kisa', glasses: 'gozluk', tapsNeeded: 3 },
  { id: 't2', kind: 'tap', text: 'Kisa sacli ve oturan kisiye 2 kez dokun', hair: 'kisa', pose: 'otur', tapsNeeded: 2 },
  { id: 't3', kind: 'tap', text: 'Kisa sacli ve gozluksuz kisiye 3 kez dokun', hair: 'kisa', glasses: 'gozluksuz', tapsNeeded: 3 },
  { id: 't4', kind: 'tap', text: 'Uzun sacli ve gozluksuz kisiye 2 kez dokun', hair: 'uzun', glasses: 'gozluksuz', tapsNeeded: 2 },
  { id: 't5', kind: 'tap', text: 'Uzun sacli ve oturan kisiye 3 kez dokun', hair: 'uzun', pose: 'otur', tapsNeeded: 3 },
  { id: 't6', kind: 'tap', text: 'Kisa sacli ve ayakta olan kisiye 2 kez dokun', hair: 'kisa', pose: 'ayakta', tapsNeeded: 2 },
  { id: 't7', kind: 'tap', text: 'Kiz olan ve gozluklu kisiye 3 kez dokun', gender: 'kiz', glasses: 'gozluk', tapsNeeded: 3 },
  { id: 't8', kind: 'tap', text: 'Uzun sacli gozluklu ve oturan kisiye 2 kez dokun', hair: 'uzun', glasses: 'gozluk', pose: 'otur', tapsNeeded: 2 },
  { id: 't9', kind: 'tap', text: 'Kiz olan ve uzun sacli kisiye 3 kez dokun', gender: 'kiz', hair: 'uzun', tapsNeeded: 3 },
  { id: 'd1', kind: 'drag', text: 'Kisa sacli ve gozluklu kisi alkis yapsin', hair: 'kisa', glasses: 'gozluk', objectId: 'alkis' },
  { id: 'd2', kind: 'drag', text: 'Kisa sacli ve gozluksuz kisiye top ver', hair: 'kisa', glasses: 'gozluksuz', objectId: 'top' },
  { id: 'd3', kind: 'drag', text: 'Kisa sacli ve ayakta olana bayrak ver', hair: 'kisa', pose: 'ayakta', objectId: 'bayrak' },
  { id: 'd4', kind: 'drag', text: 'Uzun sacli ve oturan kisi alkis yapsin', hair: 'uzun', pose: 'otur', objectId: 'alkis' },
  { id: 'd5', kind: 'drag', text: 'Uzun sacli ve gozluksuz kisiye top ver', hair: 'uzun', glasses: 'gozluksuz', objectId: 'top' },
  { id: 'd6', kind: 'drag', text: 'Kisa sacli ve oturan kisiye bayrak ver', hair: 'kisa', pose: 'otur', objectId: 'bayrak' },
  { id: 'd7', kind: 'drag', text: 'Kiz olan ve uzun sacli kisi alkis yapsin', gender: 'kiz', hair: 'uzun', objectId: 'alkis' },
  { id: 'd8', kind: 'drag', text: 'Kiz olan ve gozluklu kisiye top ver', gender: 'kiz', glasses: 'gozluk', objectId: 'top' },
  { id: 'd9', kind: 'drag', text: 'Uzun sacli gozluklu oturan kisiye bayrak ver', hair: 'uzun', glasses: 'gozluk', pose: 'otur', objectId: 'bayrak' },
  { id: 'd10', kind: 'drag', text: 'Kisa sacli ve gozluklu kisiye top ver', hair: 'kisa', glasses: 'gozluk', objectId: 'top' },
];

interface TeacherTask { id: string; text: string; }

const TEACHER_POOL: TeacherTask[] = [
  { id: 'tr1', text: 'Kiz olan ve saci kisa olan alkislasin' },
  { id: 'tr2', text: 'Gozlugu ve saati olan ziplasin' },
  { id: 'tr3', text: 'Gomlek ve tisort giyen aa desin' },
  { id: 'tr4', text: 'Kisa sacli ve gozluklu olan ayaga kalksin' },
  { id: 'tr5', text: 'Mavi tisort giyen ve oturan alkislasin' },
  { id: 'tr6', text: 'Uzun sacli ve ayakta olan bir adim atsin' },
  { id: 'tr7', text: 'Gozluksuz ve oturan elini kaldirsin' },
  { id: 'tr8', text: 'Kirmizi giyen ve saci kisa olan ziplasin' },
  { id: 'tr9', text: 'Erkek olan ve gozluklu olan alkislasin' },
  { id: 'tr10', text: 'Kiz olan ve uzun sacli olan ayaga kalksin' },
  { id: 'tr11', text: 'Saati olan ve ayakta duran bir tur donsun' },
  { id: 'tr12', text: 'Gomlek giyen ve kisa sacli olan otursun' },
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

function matchCharacter(c: Character, task: DigitalTask): boolean {
  if (task.hair && c.hair !== task.hair) return false;
  if (task.glasses && c.glasses !== task.glasses) return false;
  if (task.pose && c.pose !== task.pose) return false;
  if (task.gender && c.gender !== task.gender) return false;
  return !!(task.hair || task.glasses || task.pose || task.gender);
}

function findCorrectId(task: DigitalTask): string | null {
  const hits = CHARACTERS.filter((c) => matchCharacter(c, task));
  return hits.length === 1 ? hits[0].id : null;
}

function displayImg(c: Character, hold: { charId: string; objectId: ObjectId } | null): string {
  if (!hold || hold.charId !== c.id) return c.img;
  if (hold.objectId === 'top') return c.imgTop;
  if (hold.objectId === 'bayrak') return c.imgBayrak;
  return c.img;
}

interface Yonerge18Props {
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

type Phase = 'running' | 'result';
type Trial = { mode: 'digital'; task: DigitalTask } | { mode: 'teacher'; task: TeacherTask };

export default function Yonerge18({
  itemCode = 'YTB 4.7',
  itemText = 'Karmasik Kosullu Yonergeleri Takip Etme',
  onClose,
  onComplete,
}: Yonerge18Props) {
  const [phase, setPhase] = useState<Phase>('running');
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [dragObj, setDragObj] = useState<ObjectId | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [holdObj, setHoldObj] = useState<{ charId: string; objectId: ObjectId } | null>(null);
  const charRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [trials, setTrials] = useState<Trial[]>(() => {
    const digital = shuffle(DIGITAL_POOL).slice(0, 4).map((task) => ({ mode: 'digital' as const, task }));
    const teacher = shuffle(TEACHER_POOL).slice(0, 6).map((task) => ({ mode: 'teacher' as const, task }));
    return [...digital, ...teacher];
  });

  const trial = trials[idx];
  const usedDigitalIds = useMemo(
    () => new Set(trials.filter((t) => t.mode === 'digital').map((t) => t.task.id)),
    [trials],
  );
  const correctId = trial?.mode === 'digital' ? findCorrectId(trial.task) : null;

  const lockPortrait = useCallback(async () => {
    try {
      if ((window as any).AndroidOrientation) (window as any).AndroidOrientation.lockOrientation('portrait');
      else await ScreenOrientation.lock({ orientation: 'portrait' });
    } catch (e) { console.log('Portrait lock hatasi:', e); }
  }, []);
  const unlockOrientation = useCallback(async () => {
    try {
      if ((window as any).AndroidOrientation) (window as any).AndroidOrientation.lockOrientation('unlock');
      else await ScreenOrientation.unlock();
    } catch (e) { console.log('Unlock hatasi:', e); }
  }, []);

  useEffect(() => {
    lockPortrait();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; unlockOrientation(); };
  }, [lockPortrait, unlockOrientation]);

  useEffect(() => {
    setTapCount(0); setDragObj(null); setPointer(null); setHoldObj(null);
  }, [idx, trial && trial.mode === 'digital' ? trial.task.id : '']);

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
    setTrials((prev) => { const copy = [...prev]; copy[idx] = { mode: 'digital', task: next }; return copy; });
    setTapCount(0); setDragObj(null); setHoldObj(null);
  };

  const onCharTap = (charId: string) => {
    if (locked || !trial || trial.mode !== 'digital') return;
    const task = trial.task;
    if (task.kind !== 'tap') { finishTrial(false); return; }
    if (!correctId || charId !== correctId) { finishTrial(false); return; }
    const need = task.tapsNeeded || 1;
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= need) finishTrial(true);
  };

  const onObjPointerDown = (e: React.PointerEvent, objId: ObjectId) => {
    if (locked || !trial || trial.mode !== 'digital' || trial.task.kind !== 'drag') return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragObj(objId);
    setPointer({ x: e.clientX, y: e.clientY });
  };

  const onObjPointerMove = (e: React.PointerEvent) => {
    if (!dragObj) return;
    setPointer({ x: e.clientX, y: e.clientY });
  };

  const onObjPointerUp = (e: React.PointerEvent) => {
    if (!dragObj || locked || !trial || trial.mode !== 'digital') {
      setDragObj(null); setPointer(null); return;
    }
    const task = trial.task;
    const x = e.clientX, y = e.clientY;
    let hitId: string | null = null;
    for (const c of CHARACTERS) {
      const el = charRefs.current[c.id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) { hitId = c.id; break; }
    }
    const dropped = dragObj;
    setDragObj(null); setPointer(null);
    if (!hitId) return;
    const okObj = task.objectId === dropped;
    const okChar = correctId === hitId;
    if (okObj && okChar) {
      if (dropped === 'top' || dropped === 'bayrak') {
        setHoldObj({ charId: hitId, objectId: dropped });
        setTimeout(() => finishTrial(true), 900);
      } else finishTrial(true);
    } else finishTrial(false);
  };

  return (
    <div className="fixed inset-0 h-[100dvh] w-screen z-[100] flex flex-col bg-slate-950 text-white font-sans select-none overflow-hidden" style={{ touchAction: 'none' }}>
      <div className="shrink-0 px-3 py-2 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90 z-20">
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white"><XCircle className="w-6 h-6" /></button>
        <div className="text-center min-w-0 flex-1 px-2">
          <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">{phase === 'running' ? `${idx + 1}/10` : 'Sonuc'} · {itemCode}</p>
        </div>
        <div className="w-8 text-right text-xs font-bold text-violet-400 tabular-nums">{phase === 'running' ? score : ''}</div>
      </div>

      {phase === 'running' && trial && (
        <>
          <div className="relative flex-1 min-h-0 flex flex-col">
            {trial.mode === 'digital' ? (
              <>
                <div className="shrink-0 px-3 pt-2 pb-1 text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Dijital · kosullu yonerge</p>
                  <h1 className="text-base sm:text-xl font-black leading-snug text-white">{trial.task.text}</h1>
                  {trial.task.kind === 'tap' && (<p className="text-[11px] text-slate-400 mt-1">Dokunus: {tapCount}/{trial.task.tapsNeeded || 1}</p>)}
                  {trial.task.kind === 'drag' && (<p className="text-[11px] text-slate-400 mt-1">Altindan dogru nesneyi alip dogru kisiye birak</p>)}
                </div>

                <div className="flex-1 min-h-0 px-2 pb-1 flex flex-col gap-2">
                  <div className="flex-1 grid grid-cols-3 gap-2 min-h-0">
                    {CHARACTERS.slice(0, 3).map((c) => (
                      <div key={c.id} ref={(el) => { charRefs.current[c.id] = el; }}
                        onPointerDown={(e) => { if (trial.task.kind === 'tap') { e.preventDefault(); onCharTap(c.id); } }}
                        className="relative rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-900 active:scale-[0.98] transition-transform">
                        <img src={displayImg(c, holdObj)} alt={c.label} className="absolute inset-0 w-full h-full object-contain pointer-events-none" draggable={false} />
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-2 min-h-0 max-w-[70%] mx-auto w-full">
                    {CHARACTERS.slice(3, 5).map((c) => (
                      <div key={c.id} ref={(el) => { charRefs.current[c.id] = el; }}
                        onPointerDown={(e) => { if (trial.task.kind === 'tap') { e.preventDefault(); onCharTap(c.id); } }}
                        className="relative rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-900 active:scale-[0.98] transition-transform">
                        <img src={displayImg(c, holdObj)} alt={c.label} className="absolute inset-0 w-full h-full object-contain pointer-events-none" draggable={false} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="shrink-0 px-3 py-2 flex justify-center gap-4 border-t border-slate-800/60 bg-slate-900/50">
                  {OBJECTS.map((o) => (
                    <div key={o.id}
                      onPointerDown={(e) => onObjPointerDown(e, o.id)}
                      onPointerMove={onObjPointerMove}
                      onPointerUp={onObjPointerUp}
                      onPointerCancel={() => { setDragObj(null); setPointer(null); }}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center p-1.5 ${trial.task.kind === 'drag' ? 'active:scale-95' : 'opacity-40'} ${dragObj === o.id ? 'opacity-30' : ''}`}>
                      <img src={o.img} alt={o.label} className="max-w-full max-h-full object-contain pointer-events-none" draggable={false} />
                    </div>
                  ))}
                </div>

                {dragObj && pointer && (
                  <div className="fixed z-50 w-16 h-16 pointer-events-none opacity-90" style={{ left: pointer.x - 32, top: pointer.y - 32 }}>
                    <img src={OBJECTS.find((o) => o.id === dragObj)?.img} alt="" className="w-full h-full object-contain drop-shadow-lg" />
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 overflow-y-auto">
                <div className="w-full max-w-3xl bg-slate-800/60 border-2 border-slate-700 rounded-[2rem] p-8 md:p-12 flex flex-col items-center shadow-2xl">
                  <span className="text-blue-400 font-bold tracking-widest uppercase mb-3 text-sm">Ogrenciye / gruba soyleyin</span>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-4">Ogretmen · karmasik kosullu</p>
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-center text-white leading-snug mb-6">"{trial.task.text}"</h1>
                  <p className="text-slate-400 text-sm text-center max-w-md">Uyan ogrenci yapsin, uymayan yapmasin.</p>
                  <p className="text-slate-500 text-xs text-center mt-2">3–5 saniye icinde bagimsiz tepki dogru sayilir.</p>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 p-3 pb-5 border-t border-slate-800 bg-slate-900/95 flex gap-3 justify-center items-center">
            {trial.mode === 'digital' && (
              <>
                <button type="button" disabled={locked} onClick={swapDigital} className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-slate-800 border border-slate-600 text-slate-300 disabled:opacity-40 active:scale-95">
                  <RefreshCw className="w-4 h-4" /><span className="text-xs font-bold">Degistir</span>
                </button>
                <button type="button" disabled={locked} onClick={() => finishTrial(false)} className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 disabled:opacity-40 active:scale-95">
                  <X className="w-4 h-4" /><span className="text-xs font-bold">Yapamadi</span>
                </button>
              </>
            )}
            {trial.mode === 'teacher' && (
              <>
                <button type="button" disabled={locked} onClick={() => finishTrial(false)} className="flex-1 max-w-[160px] flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 disabled:opacity-40 active:scale-95">
                  <X className="w-5 h-5" /><span className="text-xs font-bold uppercase">Yapamadi</span>
                </button>
                <button type="button" disabled={locked} onClick={() => finishTrial(true)} className="flex-1 max-w-[160px] flex items-center justify-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 disabled:opacity-40 active:scale-95">
                  <Check className="w-5 h-5" /><span className="text-xs font-bold uppercase">Yapti</span>
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
            <h1 className="text-3xl font-black mb-2">Degerlendirme Bitti!</h1>
            <p className="text-slate-400 mb-6 text-lg">Dogru: <span className="text-white font-black text-3xl mx-2">{score}</span> / 10</p>
            {score >= 8 ? (
              <div className="bg-green-500/10 text-green-400 border border-green-500/20 px-6 py-3 rounded-xl mb-8 font-bold">Kazanım basariyla saglandi!</div>
            ) : (
              <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-6 py-3 rounded-xl mb-8 font-bold">Henuz yeterli bagimsizlik duzeyinde degil.</div>
            )}
            <button onClick={() => onComplete(score >= 8)} className="bg-violet-600 hover:bg-violet-500 text-white px-12 py-4 rounded-xl font-bold text-xl active:scale-95 w-full sm:w-auto">KAYDET VE CIK</button>
          </div>
        </div>
      )}
    </div>
  );
}
