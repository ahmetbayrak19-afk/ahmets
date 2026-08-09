import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { XCircle, Check, X, Trophy, RefreshCw } from 'lucide-react';
import { ScreenOrientation } from '@capacitor/screen-orientation';

import onaySes from './sesgorsel/onay.mp3';

const SES47 = import.meta.glob('./sesgorsel/ses/47ses/*.mp3', { eager: true, import: 'default' }) as Record<string, string>;
function ses47(name: string): string {
  return SES47[`./sesgorsel/ses/47ses/${name}.mp3`] || '';
}
/** DIGITAL_POOL sırası: t1–t9 → 1–9, d1–d10 → 10–19 */
const SES47_BY_ID: Record<string, string> = {
  t1: '1', t2: '2', t3: '3', t4: '4', t5: '5', t6: '6', t7: '7', t8: '8', t9: '9',
  d1: '10', d2: '11', d3: '12', d4: '13', d5: '14', d6: '15', d7: '16', d8: '17', d9: '18', d10: '19',
};

import devametNotr from '@/aba/esle/ses/devametnotr.mp3';
import devamet2Notr from '@/aba/esle/ses/devamet2notr.mp3';
import simdisiradakiNotr from '@/aba/esle/ses/simdisiradakinotr.mp3';

import c1 from './sesgorsel/yonerge13/kirmizitshirtkisasacoturgozlukerkek.png';
import c1top from './sesgorsel/yonerge13/kirmizitshirtkisasacoturgozlukerkektop.png';
import c1bayrak from './sesgorsel/yonerge13/kirmizitshirtkisasacoturgozlukerkekbayrak.png';
import c1alkis from './sesgorsel/yonerge13/kirmizitshirtkisasacoturgozlukerkekalkis.mp4';

import c2 from './sesgorsel/yonerge13/yesiltshirtkısasacayaktagozluksuzerkek.png';
import c2top from './sesgorsel/yonerge13/yesiltshirtkısasacayaktagozluksuzerkektop.png';
import c2bayrak from './sesgorsel/yonerge13/yesiltshirtkısasacayaktagozluksuzerkekbayrak.png';
// klasördeki dosya adında yazım: gozlulsuz
import c2alkis from './sesgorsel/yonerge13/yesiltshirtkısasacayaktagozlulsuzerkekalkis.mp4';

import c3 from './sesgorsel/yonerge13/uzunsacsaritshirtayaktagozluksuzerkek.png';
import c3top from './sesgorsel/yonerge13/uzunsacsaritshirtayaktagozluksuzerkektop.png';
import c3bayrak from './sesgorsel/yonerge13/uzunsacsaritshirtayaktagozluksuzerkekbayrak.png';
import c3alkis from './sesgorsel/yonerge13/uzunsacsaritshirtayaktagozluksuzerkekalkis.mp4';

import c4 from './sesgorsel/yonerge13/mortshirtuzunsacoturgozlukerkek.png';
import c4top from './sesgorsel/yonerge13/mortshirtuzunsacoturgozlukerkektop.png';
import c4bayrak from './sesgorsel/yonerge13/mortshirtuzunsacoturgozlukerkekbayrak.png';
import c4alkis from './sesgorsel/yonerge13/mortshirtuzunsacoturgozlukerkekalkis.mp4';

import c5 from './sesgorsel/yonerge13/etekbeyaztshirtuzunsacgozlukkiz.png';
import c5top from './sesgorsel/yonerge13/etekbeyaztshirtuzunsacgozlukkiztop.png';
import c5bayrak from './sesgorsel/yonerge13/etekbeyaztshirtuzunsacgozlukkizbayrak.png';
import c5alkis from './sesgorsel/yonerge13/etekbeyaztshirtuzunsacgozlukkizalkis.mp4';

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
  alkisVideo: string;
  hair: Hair;
  glasses: Glasses;
  pose: Pose;
  gender: Gender;
  label: string;
}

/** 5 karakter — dosya adlarından özellikler */
const CHARACTERS: Character[] = [
  {
    id: 'c1',
    img: c1,
    imgTop: c1top,
    imgBayrak: c1bayrak,
    alkisVideo: c1alkis,
    hair: 'kisa',
    glasses: 'gozluk',
    pose: 'otur',
    gender: 'erkek',
    label: 'Kısa · gözlük · oturan erkek',
  },
  {
    id: 'c2',
    img: c2,
    imgTop: c2top,
    imgBayrak: c2bayrak,
    alkisVideo: c2alkis,
    hair: 'kisa',
    glasses: 'gozluksuz',
    pose: 'ayakta',
    gender: 'erkek',
    label: 'Kısa · gözlüksüz · ayakta erkek',
  },
  {
    id: 'c3',
    img: c3,
    imgTop: c3top,
    imgBayrak: c3bayrak,
    alkisVideo: c3alkis,
    hair: 'uzun',
    glasses: 'gozluksuz',
    pose: 'ayakta',
    gender: 'erkek',
    label: 'Uzun · gözlüksüz · ayakta erkek',
  },
  {
    id: 'c4',
    img: c4,
    imgTop: c4top,
    imgBayrak: c4bayrak,
    alkisVideo: c4alkis,
    hair: 'uzun',
    glasses: 'gozluk',
    pose: 'otur',
    gender: 'erkek',
    label: 'Uzun · gözlük · oturan erkek',
  },
  {
    id: 'c5',
    img: c5,
    imgTop: c5top,
    imgBayrak: c5bayrak,
    alkisVideo: c5alkis,
    hair: 'uzun',
    glasses: 'gozluk',
    pose: 'ayakta',
    gender: 'kiz',
    label: 'Uzun · gözlük · kız',
  },
];

const OBJECTS: { id: ObjectId; img: string; label: string }[] = [
  { id: 'alkis', img: objAlkis, label: 'Alkış' },
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

/**
 * Her yönergede tam 1 doğru kişi.
 * uzun+gözlük → c4 (erkek oturan) veya c5 (kız) — gender ile ayrılır.
 */
const DIGITAL_POOL: DigitalTask[] = [
  // Dokun
  { id: 't1', kind: 'tap', text: 'Kısa saçlı ve gözlüklü kişiye 3 kez dokun', hair: 'kisa', glasses: 'gozluk', tapsNeeded: 3 },
  { id: 't2', kind: 'tap', text: 'Kısa saçlı ve oturan kişiye 2 kez dokun', hair: 'kisa', pose: 'otur', tapsNeeded: 2 },
  { id: 't3', kind: 'tap', text: 'Kısa saçlı ve gözlüksüz kişiye 3 kez dokun', hair: 'kisa', glasses: 'gozluksuz', tapsNeeded: 3 },
  { id: 't4', kind: 'tap', text: 'Uzun saçlı ve gözlüksüz kişiye 2 kez dokun', hair: 'uzun', glasses: 'gozluksuz', tapsNeeded: 2 },
  { id: 't5', kind: 'tap', text: 'Uzun saçlı ve oturan kişiye 3 kez dokun', hair: 'uzun', pose: 'otur', tapsNeeded: 3 },
  { id: 't6', kind: 'tap', text: 'Kısa saçlı ve ayakta olan kişiye 2 kez dokun', hair: 'kisa', pose: 'ayakta', tapsNeeded: 2 },
  { id: 't7', kind: 'tap', text: 'Kız olan ve gözlüklü kişiye 3 kez dokun', gender: 'kiz', glasses: 'gozluk', tapsNeeded: 3 },
  { id: 't8', kind: 'tap', text: 'Uzun saçlı gözlüklü ve oturan kişiye 2 kez dokun', hair: 'uzun', glasses: 'gozluk', pose: 'otur', tapsNeeded: 2 },
  { id: 't9', kind: 'tap', text: 'Kız olan ve uzun saçlı kişiye 3 kez dokun', gender: 'kiz', hair: 'uzun', tapsNeeded: 3 },
  // Sürükle
  { id: 'd1', kind: 'drag', text: 'Kısa saçlı ve gözlüklü kişi alkış yapsın', hair: 'kisa', glasses: 'gozluk', objectId: 'alkis' },
  { id: 'd2', kind: 'drag', text: 'Kısa saçlı ve gözlüksüz kişiye top ver', hair: 'kisa', glasses: 'gozluksuz', objectId: 'top' },
  { id: 'd3', kind: 'drag', text: 'Kısa saçlı ve ayakta olana bayrak ver', hair: 'kisa', pose: 'ayakta', objectId: 'bayrak' },
  { id: 'd4', kind: 'drag', text: 'Uzun saçlı ve oturan kişi alkış yapsın', hair: 'uzun', pose: 'otur', objectId: 'alkis' },
  { id: 'd5', kind: 'drag', text: 'Uzun saçlı ve gözlüksüz kişiye top ver', hair: 'uzun', glasses: 'gozluksuz', objectId: 'top' },
  { id: 'd6', kind: 'drag', text: 'Kısa saçlı ve oturan kişiye bayrak ver', hair: 'kisa', pose: 'otur', objectId: 'bayrak' },
  { id: 'd7', kind: 'drag', text: 'Kız olan ve uzun saçlı kişi alkış yapsın', gender: 'kiz', hair: 'uzun', objectId: 'alkis' },
  { id: 'd8', kind: 'drag', text: 'Kız olan ve gözlüklü kişiye top ver', gender: 'kiz', glasses: 'gozluk', objectId: 'top' },
  { id: 'd9', kind: 'drag', text: 'Uzun saçlı gözlüklü oturan kişiye bayrak ver', hair: 'uzun', glasses: 'gozluk', pose: 'otur', objectId: 'bayrak' },
  { id: 'd10', kind: 'drag', text: 'Kısa saçlı ve gözlüklü kişiye top ver', hair: 'kisa', glasses: 'gozluk', objectId: 'top' },
];

interface TeacherTask {
  id: string;
  text: string;
}

const TEACHER_POOL: TeacherTask[] = [
  { id: 'tr1', text: 'Kız olan ve saçı kısa olan alkışlasın' },
  { id: 'tr2', text: 'Gözlüğü ve saati olan zıplasın' },
  { id: 'tr3', text: 'Gömlek ve tişört giyen "aa" desin' },
  { id: 'tr4', text: 'Kısa saçlı ve gözlüklü olan ayağa kalksın' },
  { id: 'tr5', text: 'Mavi tişört giyen ve oturan alkışlasın' },
  { id: 'tr6', text: 'Uzun saçlı ve ayakta olan bir adım atsın' },
  { id: 'tr7', text: 'Gözlüksüz ve oturan elini kaldırsın' },
  { id: 'tr8', text: 'Kırmızı giyen ve saçı kısa olan zıplasın' },
  { id: 'tr9', text: 'Erkek olan ve gözlüklü olan alkışlasın' },
  { id: 'tr10', text: 'Kız olan ve uzun saçlı olan ayağa kalksın' },
  { id: 'tr11', text: 'Saati olan ve ayakta duran bir tur dönsün' },
  { id: 'tr12', text: 'Gömlek giyen ve kısa saçlı olan otursun' },
];

function playFx(src?: string) {
  if (!src) return;
  try {
    const a = new Audio(src);
    a.volume = 0.9;
    a.play().catch(() => {});
  } catch {
    /* */
  }
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

/** 5 kişiden 4 seç — doğru cevap her zaman dahil */
function pickVisibleFour(correctId: string): Character[] {
  const correct = CHARACTERS.find((c) => c.id === correctId);
  if (!correct) return shuffle(CHARACTERS).slice(0, 4);
  const others = shuffle(CHARACTERS.filter((c) => c.id !== correctId)).slice(0, 3);
  return shuffle([correct, ...others]);
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
type Trial =
  | { mode: 'digital'; task: DigitalTask }
  | { mode: 'teacher'; task: TeacherTask };

export default function Yonerge18({
  itemCode = 'YTB 4.7',
  itemText = 'Karmaşık Koşullu Yönergeleri Takip Etme',
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
  /** Doğru sürüklemede karakterin top/bayrak PNG'si kısa süre gösterilir */
  const [holdObj, setHoldObj] = useState<{ charId: string; objectId: ObjectId } | null>(null);
  /** Alkış videosu oynayan karakter id */
  const [playingAlkisId, setPlayingAlkisId] = useState<string | null>(null);
  const [alkisVideoVisible, setAlkisVideoVisible] = useState(false);
  /** Bu denemede gösterilecek 4 karakter (2x2) */
  const [visibleChars, setVisibleChars] = useState<Character[]>([]);

  const charRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const tapGapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockedRef = useRef(false);

  const [trials, setTrials] = useState<Trial[]>(() => {
    const digital = shuffle(DIGITAL_POOL)
      .slice(0, 4)
      .map((task) => ({ mode: 'digital' as const, task }));
    const teacher = shuffle(TEACHER_POOL)
      .slice(0, 6)
      .map((task) => ({ mode: 'teacher' as const, task }));
    return [...digital, ...teacher];
  });

  const trial = trials[idx];
  const instrAudioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (!trial || trial.mode !== 'digital') return;
    const src = ses47(SES47_BY_ID[trial.task.id] || '');
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
  }, [trial?.mode === 'digital' ? trial.task.id : null]);

  const usedDigitalIds = useMemo(
    () => new Set(trials.filter((t) => t.mode === 'digital').map((t) => t.task.id)),
    [trials],
  );

  const correctId = trial?.mode === 'digital' ? findCorrectId(trial.task) : null;

  const clearTapTimers = useCallback(() => {
    if (tapGapTimer.current) {
      clearTimeout(tapGapTimer.current);
      tapGapTimer.current = null;
    }
    if (confirmTimer.current) {
      clearTimeout(confirmTimer.current);
      confirmTimer.current = null;
    }
  }, []);

  const lockPortrait = useCallback(async () => {
    try {
      if ((window as any).AndroidOrientation)
        (window as any).AndroidOrientation.lockOrientation('portrait');
      else await ScreenOrientation.lock({ orientation: 'portrait' });
    } catch (e) {
      console.log('Portrait lock hatası:', e);
    }
  }, []);
  const unlockOrientation = useCallback(async () => {
    try {
      if ((window as any).AndroidOrientation)
        (window as any).AndroidOrientation.lockOrientation('unlock');
      else await ScreenOrientation.unlock();
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

  // Deneme değişince: timer temizle, 4 kişi seç (doğru dahil), state sıfırla
  useEffect(() => {
    clearTapTimers();
    setTapCount(0);
    setDragObj(null);
    setPointer(null);
    setHoldObj(null);
    setPlayingAlkisId(null); setAlkisVideoVisible(false);
    lockedRef.current = false;

    if (trial?.mode === 'digital' && correctId) {
      setVisibleChars(pickVisibleFour(correctId));
    } else {
      setVisibleChars([]);
    }
  }, [idx, trial && trial.mode === 'digital' ? trial.task.id : '', correctId, clearTapTimers]);

  const finishTrial = useCallback(
    async (correct: boolean) => {
      if (lockedRef.current) return;
      lockedRef.current = true;
      setLocked(true);
      clearTapTimers();
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
      lockedRef.current = false;
    },
    [score, idx, clearTapTimers],
  );

  const swapDigital = () => {
    if (locked || !trial || trial.mode !== 'digital') return;
    const candidates = DIGITAL_POOL.filter((t) => !usedDigitalIds.has(t.id));
    if (candidates.length === 0) return;
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    clearTapTimers();
    setTrials((prev) => {
      const copy = [...prev];
      copy[idx] = { mode: 'digital', task: next };
      return copy;
    });
    setTapCount(0);
    setDragObj(null);
    setHoldObj(null);
    setPlayingAlkisId(null); setAlkisVideoVisible(false);
  };

  /**
   * Dokun kuralları:
   * - Yanlış kişi → hemen yanlış
   * - Gerekenden fazla dokunuş → yanlış
   * - Ara boşluk > 2 sn → yanlış
   * - Tam sayıya ulaşınca 1 sn bekle → doğru
   */
  const onCharTap = (charId: string) => {
    if (lockedRef.current || !trial || trial.mode !== 'digital') return;
    const task = trial.task;

    // Sürükleme görevinde kişiye dokunmak hata
    if (task.kind !== 'tap') {
      finishTrial(false);
      return;
    }

    if (!correctId || charId !== correctId) {
      clearTapTimers();
      finishTrial(false);
      return;
    }

    const need = task.tapsNeeded || 1;
    const next = tapCount + 1;

    // Fazla dokunuş
    if (next > need) {
      clearTapTimers();
      finishTrial(false);
      return;
    }

    setTapCount(next);
    clearTapTimers();

    if (next === need) {
      // Tam sayı → 1 saniye sonra onay
      confirmTimer.current = setTimeout(() => {
        finishTrial(true);
      }, 1000);
    } else {
      // Ara boşluk 2 sn'yi aşarsa yanlış
      tapGapTimer.current = setTimeout(() => {
        finishTrial(false);
      }, 2000);
    }
  };

  const onObjPointerDown = (e: React.PointerEvent, objId: ObjectId) => {
    if (lockedRef.current || !trial || trial.mode !== 'digital') return;

    // Dokun görevinde alt nesneye dokunmak / sürüklemek → yanlış
    if (trial.task.kind === 'tap') {
      clearTapTimers();
      finishTrial(false);
      return;
    }

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
    if (!dragObj || lockedRef.current || !trial || trial.mode !== 'digital') {
      setDragObj(null);
      setPointer(null);
      return;
    }
    const task = trial.task;
    if (task.kind !== 'drag') {
      setDragObj(null);
      setPointer(null);
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    let hitId: string | null = null;
    for (const c of visibleChars) {
      const el = charRefs.current[c.id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        hitId = c.id;
        break;
      }
    }
    const dropped = dragObj;
    setDragObj(null);
    setPointer(null);

    if (!hitId) return;

    const okObj = task.objectId === dropped;
    const okChar = correctId === hitId;

    if (okObj && okChar) {
      if (dropped === 'top' || dropped === 'bayrak') {
        // Karakter görseli ...top.png / ...bayrak.png'ye döner
        setHoldObj({ charId: hitId, objectId: dropped });
        setTimeout(() => finishTrial(true), 900);
      } else if (dropped === 'alkis') {
        // Karakterin alkış videosu oynar
        setAlkisVideoVisible(false); setPlayingAlkisId(hitId);
        // Video bitince finishTrial çağrılır (onEnded)
        // Güvenlik: video yüklenmezse 2.5 sn sonra geç
        setTimeout(() => {
          if (!lockedRef.current) finishTrial(true);
        }, 2500);
      } else {
        finishTrial(true);
      }
    } else {
      finishTrial(false);
    }
  };

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
          <div className="relative flex-1 min-h-0 flex flex-col">
            {trial.mode === 'digital' ? (
              <>
                <div className="shrink-0 px-3 pt-2 pb-1 text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">
                    Dijital · koşullu yönerge
                  </p>
                  {trial.task.kind === 'tap' && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Dokunuş: {tapCount}/{trial.task.tapsNeeded || 1}
                    </p>
                  )}
                  {trial.task.kind === 'drag' && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Altından doğru nesneyi alıp doğru kişiye bırak
                    </p>
                  )}
                </div>

                {/* 2x2 — 5 kişiden 4'ü (doğru cevap her zaman var) */}
                <div className="flex-1 min-h-0 px-2 pb-1 grid grid-cols-2 grid-rows-2 gap-2">
                  {visibleChars.map((c) => (
                    <div
                      key={c.id}
                      ref={(el) => {
                        charRefs.current[c.id] = el;
                      }}
                      onPointerDown={(e) => {
                        if (trial.task.kind === 'tap' && !playingAlkisId) {
                          e.preventDefault();
                          onCharTap(c.id);
                        }
                      }}
                      className="relative rounded-xl overflow-hidden border-2 border-slate-700 bg-black active:scale-[0.98] transition-transform"
                    >
                      {/* Statik görsel her zaman altta — video gelene kadar siyah/play ikonu flaşı olmasın */}
                      <img
                        src={displayImg(c, holdObj)}
                        alt={c.label}
                        className="absolute inset-0 w-full h-full object-contain object-center pointer-events-none bg-black"
                        draggable={false}
                      />
                      {playingAlkisId === c.id && (
                        <video
                          key={'alkis-' + c.id}
                          src={c.alkisVideo}
                          autoPlay
                          playsInline
                          muted
                          controls={false}
                          disablePictureInPicture
                          disableRemotePlayback
                          preload="auto"
                          className={
                            'absolute inset-0 w-full h-full object-contain object-center pointer-events-none bg-black ' +
                            (alkisVideoVisible ? 'opacity-100' : 'opacity-0') +
                            ' [&::-webkit-media-controls]:hidden [&::-webkit-media-controls-enclosure]:hidden' +
                            ' [&::-webkit-media-controls-panel]:hidden [&::-webkit-media-controls-start-playback-button]:hidden' +
                            ' [&::-webkit-media-controls-overlay-play-button]:!hidden [&::-webkit-media-controls-play-button]:hidden'
                          }
                          style={{ backgroundColor: '#000' }}
                          onLoadedData={(e) => {
                            const v = e.currentTarget;
                            v.muted = true;
                            v.play().catch(() => {});
                          }}
                          onPlaying={() => {
                            setAlkisVideoVisible(true);
                            // ses: muted kalmasın
                          }}
                          onPlay={(e) => {
                            // Oynama başlayınca ses aç (play ikonu muted iken basılmaz)
                            try { e.currentTarget.muted = false; } catch { /* */ }
                          }}
                          onEnded={() => {
                            setAlkisVideoVisible(false);
                            if (!lockedRef.current) finishTrial(true);
                          }}
                          onError={() => {
                            setAlkisVideoVisible(false);
                            if (!lockedRef.current) finishTrial(true);
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Nesneler her zaman aktif — dokun görevinde de tıklanırsa yanlış */}
                <div className="shrink-0 px-3 py-2 flex justify-center gap-4 border-t border-slate-800/60 bg-slate-900/50">
                  {OBJECTS.map((o) => (
                    <div
                      key={o.id}
                      onPointerDown={(e) => onObjPointerDown(e, o.id)}
                      onPointerMove={onObjPointerMove}
                      onPointerUp={onObjPointerUp}
                      onPointerCancel={() => {
                        setDragObj(null);
                        setPointer(null);
                      }}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center p-1.5 active:scale-95 ${
                        dragObj === o.id ? 'opacity-30' : ''
                      }`}
                    >
                      <img
                        src={o.img}
                        alt={o.label}
                        className="max-w-full max-h-full object-contain pointer-events-none"
                        draggable={false}
                      />
                    </div>
                  ))}
                </div>

                {dragObj && pointer && (
                  <div
                    className="fixed z-50 w-16 h-16 pointer-events-none opacity-90"
                    style={{
                      left: pointer.x - 32,
                      top: pointer.y - 32,
                    }}
                  >
                    <img
                      src={OBJECTS.find((o) => o.id === dragObj)?.img}
                      alt=""
                      className="w-full h-full object-contain drop-shadow-lg"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 overflow-y-auto">
                <div className="w-full max-w-3xl bg-slate-800/60 border-2 border-slate-700 rounded-[2rem] p-8 md:p-12 flex flex-col items-center shadow-2xl">
                  <span className="text-blue-400 font-bold tracking-widest uppercase mb-3 text-sm">
                    Öğrenciye / gruba söyleyin
                  </span>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-4">
                    Öğretmen · karmaşık koşullu
                  </p>
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-center text-white leading-snug mb-6">
                    "{trial.task.text}"
                  </h1>
                  <p className="text-slate-400 text-sm text-center max-w-md">
                    Uyan öğrenci yapsın, uymayan yapmasın.
                  </p>
                  <p className="text-slate-500 text-xs text-center mt-2">
                    3–5 saniye içinde bağımsız tepki doğru sayılır.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 p-3 pb-5 border-t border-slate-800 bg-slate-900/95 flex gap-3 justify-center items-center">
            {trial.mode === 'digital' && (
              <button
                type="button"
                disabled={locked}
                onClick={swapDigital}
                className="flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl bg-slate-800 border border-slate-600 text-slate-300 disabled:opacity-40 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-xs font-bold">Değiştir</span>
              </button>
            )}
            {trial.mode === 'teacher' && (
              <>
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
              </>
            )}
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
