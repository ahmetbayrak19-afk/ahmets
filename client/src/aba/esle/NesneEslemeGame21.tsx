import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type PointerEventHandler,
} from 'react';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Hand,
  Loader2,
  Move,
  PackageCheck,
  RotateCcw,
  Trophy,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';
import { playNeutralAssessmentFeedback } from './neutralAssessmentFeedback';

import topImage from './top.png';
import carImage from './grup/tasit/araba.webp';
import catImage from './grup/hayvan/kedi.webp';
import appleImage from '../../fruits/elma.webp';
import bananaImage from '../../fruits/muz.webp';
import orangeImage from '../../fruits/portakal.webp';
import sockImage from '../../clothes/corap.webp';
import hatImage from '../../clothes/sapka.webp';
import notebookImage from '../../okulmalzemeleri/defter.webp';
import pencilImage from '../../okulmalzemeleri/kalem.webp';
import bookImage from '../../okulmalzemeleri/kitap.webp';
import eraserImage from '../../okulmalzemeleri/silgi.webp';

type GameMode = 'assessment' | 'instruction';
type Stage = 'intro' | 'trial' | 'result';
type TrialKind = 'digital' | 'teacher';

type PatternItem = {
  id: string;
  name: string;
  src: string;
};

type PatternTrial = {
  id: string;
  kind: TrialKind;
  pattern: PatternItem[];
};

type PatternToken = {
  tokenId: string;
  item: PatternItem;
};

type DragSource = 'available' | 'placed';

type DragState = {
  token: PatternToken;
  source: DragSource;
  sourceIndex?: number;
  pointerId: number;
  x: number;
  y: number;
};

type TrialResult = {
  trialId: string;
  kind: TrialKind;
  correct: boolean;
  startedInTime: boolean;
};

interface GameProps {
  mode: GameMode;
  onClose: () => void;
  onComplete: (success: boolean) => void | Promise<void>;
}

const PASS_SCORE = 8;
const RESPONSE_WINDOW_MS = 5000;

const ITEMS = {
  top: { id: 'top', name: 'Top', src: topImage },
  araba: { id: 'araba', name: 'Araba', src: carImage },
  kedi: { id: 'kedi', name: 'Kedi', src: catImage },
  elma: { id: 'elma', name: 'Elma', src: appleImage },
  muz: { id: 'muz', name: 'Muz', src: bananaImage },
  portakal: { id: 'portakal', name: 'Portakal', src: orangeImage },
  corap: { id: 'corap', name: 'Çorap', src: sockImage },
  sapka: { id: 'sapka', name: 'Şapka', src: hatImage },
  defter: { id: 'defter', name: 'Defter', src: notebookImage },
  kalem: { id: 'kalem', name: 'Kalem', src: pencilImage },
  kitap: { id: 'kitap', name: 'Kitap', src: bookImage },
  silgi: { id: 'silgi', name: 'Silgi', src: eraserImage },
} satisfies Record<string, PatternItem>;

const TRIALS: PatternTrial[] = [
  {
    id: 'digital-1',
    kind: 'digital',
    pattern: [ITEMS.elma, ITEMS.top, ITEMS.elma],
  },
  {
    id: 'digital-2',
    kind: 'digital',
    pattern: [ITEMS.kalem, ITEMS.kitap, ITEMS.kalem, ITEMS.kitap],
  },
  {
    id: 'digital-3',
    kind: 'digital',
    pattern: [ITEMS.kedi, ITEMS.araba, ITEMS.kedi, ITEMS.araba, ITEMS.kedi],
  },
  {
    id: 'digital-4',
    kind: 'digital',
    pattern: [ITEMS.muz, ITEMS.corap, ITEMS.muz, ITEMS.corap, ITEMS.muz, ITEMS.corap],
  },
  {
    id: 'digital-5',
    kind: 'digital',
    pattern: [ITEMS.silgi, ITEMS.sapka, ITEMS.kitap, ITEMS.silgi, ITEMS.sapka, ITEMS.kitap, ITEMS.silgi],
  },
  {
    id: 'digital-6',
    kind: 'digital',
    pattern: [ITEMS.portakal, ITEMS.araba, ITEMS.kalem, ITEMS.kedi, ITEMS.portakal, ITEMS.araba, ITEMS.kalem, ITEMS.kedi],
  },
  {
    id: 'teacher-1',
    kind: 'teacher',
    pattern: [ITEMS.kalem, ITEMS.silgi, ITEMS.kalem],
  },
  {
    id: 'teacher-2',
    kind: 'teacher',
    pattern: [ITEMS.kitap, ITEMS.kalem, ITEMS.kitap, ITEMS.kalem],
  },
  {
    id: 'teacher-3',
    kind: 'teacher',
    pattern: [ITEMS.kalem, ITEMS.silgi, ITEMS.kitap, ITEMS.kalem, ITEMS.silgi],
  },
  {
    id: 'teacher-4',
    kind: 'teacher',
    pattern: [ITEMS.defter, ITEMS.kalem, ITEMS.kitap, ITEMS.silgi, ITEMS.defter, ITEMS.kalem],
  },
];

const TEACHER_MATERIALS = [
  { name: 'Kalem', count: 2 },
  { name: 'Silgi', count: 2 },
  { name: 'Kitap', count: 2 },
  { name: 'Defter', count: 2 },
];

const shuffle = <T,>(items: T[]) => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

const createTokens = (trial: PatternTrial) => {
  const tokens = trial.pattern.map((item, index) => ({
    tokenId: `${trial.id}-${item.id}-${index}`,
    item,
  }));
  let mixed = shuffle(tokens);

  if (mixed.every((token, index) => token.item.id === trial.pattern[index].id)) {
    mixed = [...mixed.slice(1), mixed[0]];
  }

  return mixed;
};

const countItems = (pattern: PatternItem[]) => {
  const counts = new Map<string, { item: PatternItem; count: number }>();
  pattern.forEach((item) => {
    const current = counts.get(item.id);
    counts.set(item.id, { item, count: (current?.count ?? 0) + 1 });
  });
  return Array.from(counts.values());
};

function ImageCard({
  item,
  compact = false,
  muted = false,
  highlighted = false,
  draggable = false,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  item: PatternItem;
  compact?: boolean;
  muted?: boolean;
  highlighted?: boolean;
  draggable?: boolean;
  onPointerDown?: PointerEventHandler<HTMLButtonElement>;
  onPointerMove?: PointerEventHandler<HTMLButtonElement>;
  onPointerUp?: PointerEventHandler<HTMLButtonElement>;
  onPointerCancel?: PointerEventHandler<HTMLButtonElement>;
}) {
  const className = twMerge(
    'flex shrink-0 flex-col items-stretch justify-between overflow-hidden rounded-xl border bg-white shadow-sm transition-all',
    compact
      ? 'h-[clamp(58px,19vh,82px)] w-[clamp(58px,9vw,82px)] p-0.5'
      : 'h-[clamp(62px,20vh,92px)] w-[clamp(62px,10vw,92px)] p-0.5',
    draggable && 'cursor-grab touch-none active:cursor-grabbing active:scale-95',
    highlighted ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-slate-300',
    muted && 'scale-95 opacity-25',
  );
  const content = (
    <img
      src={item.src}
      alt={item.name}
      draggable={false}
      className="h-full w-full scale-110 select-none object-contain"
    />
  );

  if (draggable) {
    return (
      <button
        type="button"
        aria-label={`${item.name} nesnesini sürükle`}
        className={className}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

export default function NesneEslemeGame21({ mode, onClose, onComplete }: GameProps) {
  const [stage, setStage] = useState<Stage>('intro');
  const [trialIndex, setTrialIndex] = useState(0);
  const [available, setAvailable] = useState<PatternToken[]>([]);
  const [placed, setPlaced] = useState<Array<PatternToken | null>>([]);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [trialResults, setTrialResults] = useState<TrialResult[]>([]);
  const [locked, setLocked] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [canMarkNoResponse, setCanMarkNoResponse] = useState(false);
  const [saving, setSaving] = useState(false);

  const firstActionInTimeRef = useRef<boolean | null>(null);
  const trialStartedAtRef = useRef(0);
  const dragStateRef = useRef<DragState | null>(null);
  const noResponseTimerRef = useRef<number | null>(null);
  const advanceTimerRef = useRef<number | null>(null);
  const lockedRef = useRef(false);

  const currentTrial = TRIALS[trialIndex];
  const score = trialResults.filter((result) => result.correct).length;
  const passed = score >= PASS_SCORE;
  const currentMaterials = useMemo(
    () => (currentTrial ? countItems(currentTrial.pattern) : []),
    [currentTrial],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    if ((window as any).AndroidOrientation) {
      (window as any).AndroidOrientation.lockOrientation('landscape');
    } else {
      ScreenOrientation.lock({ orientation: 'landscape' }).catch(() => {});
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
      if ((window as any).AndroidOrientation) {
        (window as any).AndroidOrientation.lockOrientation('unlock');
      } else {
        ScreenOrientation.unlock().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (stage !== 'trial' || !currentTrial) return;

    if (noResponseTimerRef.current !== null) window.clearTimeout(noResponseTimerRef.current);
    if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);

    setAvailable(createTokens(currentTrial));
    setPlaced(Array.from({ length: currentTrial.pattern.length }, () => null));
    dragStateRef.current = null;
    setDragState(null);
    setLocked(false);
    setRecorded(false);
    setCanMarkNoResponse(false);
    lockedRef.current = false;
    firstActionInTimeRef.current = null;
    trialStartedAtRef.current = performance.now();

    if (currentTrial.kind === 'digital') {
      noResponseTimerRef.current = window.setTimeout(() => {
        if (firstActionInTimeRef.current === null) setCanMarkNoResponse(true);
      }, RESPONSE_WINDOW_MS);
    }

    return () => {
      if (noResponseTimerRef.current !== null) window.clearTimeout(noResponseTimerRef.current);
      if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);
    };
  }, [currentTrial, stage]);

  const finishTrial = (correct: boolean, startedInTime: boolean) => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setLocked(true);
    setRecorded(true);

    if (mode === 'assessment') playNeutralAssessmentFeedback();

    const result: TrialResult = {
      trialId: currentTrial.id,
      kind: currentTrial.kind,
      correct,
      startedInTime,
    };
    const nextResults = [...trialResults, result];
    setTrialResults(nextResults);

    advanceTimerRef.current = window.setTimeout(() => {
      if (trialIndex === TRIALS.length - 1) {
        setStage('result');
      } else {
        setTrialIndex((index) => index + 1);
      }
    }, 700);
  };

  const markFirstAction = () => {
    if (firstActionInTimeRef.current === null) {
      firstActionInTimeRef.current = performance.now() - trialStartedAtRef.current <= RESPONSE_WINDOW_MS;
      setCanMarkNoResponse(false);
      if (noResponseTimerRef.current !== null) window.clearTimeout(noResponseTimerRef.current);
    }
  };

  const completeDigitalTrialIfReady = (nextPlaced: Array<PatternToken | null>) => {
    if (!nextPlaced.every((token): token is PatternToken => token !== null)) return;

    const correctOrder = nextPlaced.every(
      (placedToken, index) => placedToken.item.id === currentTrial.pattern[index].id,
    );
    finishTrial(correctOrder && firstActionInTimeRef.current === true, firstActionInTimeRef.current === true);
  };

  const placeDraggedToken = (drag: DragState, targetIndex: number) => {
    if (lockedRef.current || targetIndex < 0 || targetIndex >= currentTrial.pattern.length) return;

    const nextPlaced = [...placed];
    const displacedToken = nextPlaced[targetIndex];
    nextPlaced[targetIndex] = drag.token;

    if (drag.source === 'available') {
      setAvailable((items) => {
        const remaining = items.filter((item) => item.tokenId !== drag.token.tokenId);
        return displacedToken ? [...remaining, displacedToken] : remaining;
      });
    } else if (drag.sourceIndex !== undefined && drag.sourceIndex !== targetIndex) {
      nextPlaced[drag.sourceIndex] = displacedToken ?? null;
    }

    setPlaced(nextPlaced);
    completeDigitalTrialIfReady(nextPlaced);
  };

  const returnDraggedTokenToPool = (drag: DragState) => {
    if (drag.source !== 'placed' || drag.sourceIndex === undefined || lockedRef.current) return;
    const nextPlaced = [...placed];
    nextPlaced[drag.sourceIndex] = null;
    setPlaced(nextPlaced);
    setAvailable((items) => items.some((item) => item.tokenId === drag.token.tokenId)
      ? items
      : [...items, drag.token]);
  };

  const beginDrag = (
    event: ReactPointerEvent<HTMLButtonElement>,
    token: PatternToken,
    source: DragSource,
    sourceIndex?: number,
  ) => {
    if (lockedRef.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    if (source === 'available') markFirstAction();
    const nextDrag = { token, source, sourceIndex, pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    dragStateRef.current = nextDrag;
    setDragState(nextDrag);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = dragStateRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const nextDrag = { ...current, x: event.clientX, y: event.clientY };
    dragStateRef.current = nextDrag;
    setDragState(nextDrag);
  };

  const endDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const activeDrag = dragStateRef.current;
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;
    event.preventDefault();

    const target = document.elementFromPoint(event.clientX, event.clientY);
    const slot = target?.closest('[data-pattern-drop-index]') as HTMLElement | null;
    const pool = target?.closest('[data-pattern-pool]');

    if (slot) {
      placeDraggedToken(activeDrag, Number(slot.dataset.patternDropIndex));
    } else if (pool) {
      returnDraggedTokenToPool(activeDrag);
    }
    dragStateRef.current = null;
    setDragState(null);
  };

  const cancelDrag = () => {
    dragStateRef.current = null;
    setDragState(null);
  };

  const handleNoResponse = () => {
    if (!canMarkNoResponse || lockedRef.current) return;
    finishTrial(false, false);
  };

  const startAgain = () => {
    setTrialIndex(0);
    setTrialResults([]);
    setStage('trial');
  };

  const handleSaveAndExit = async () => {
    setSaving(true);
    try {
      // Sonucun kalıcı kaydı üst sayfadaki ortak değerlendirme kaydetme akışında yapılır.
      await onComplete(passed);
    } catch (error) {
      console.error('EB 4.7 sonucu kaydedilemedi:', error);
      toast.error('Sonuç kaydedilemedi. Lütfen tekrar deneyin.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] overflow-hidden bg-[#07111f] text-white">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1280px] flex-col px-2 py-1 sm:px-4">
        <header className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-slate-700/70">
          <div className="flex min-w-0 items-center gap-2">
            <button
              data-android-back
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-slate-200 active:scale-95"
              aria-label="Geri"
            >
              <ArrowLeft size={19} />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-xs font-bold sm:text-base">Görsel Örüntüye Göre Eşleme</h1>
              <p className="text-[9px] leading-none text-slate-400 sm:text-[10px]">EB 4.7</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className={twMerge(
              'hidden items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold sm:flex',
              mode === 'assessment'
                ? 'border-blue-400/40 bg-blue-500/10 text-blue-200'
                : 'border-violet-400/40 bg-violet-500/10 text-violet-200',
            )}>
              {mode === 'assessment' ? <ClipboardCheck size={13} /> : <GraduationCap size={13} />}
              {mode === 'assessment' ? 'Değerlendirme' : 'Öğretim'}
            </span>
            {stage === 'trial' && (
              <span className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-bold text-slate-200">
                {trialIndex + 1} / {TRIALS.length}
              </span>
            )}
          </div>
        </header>

        {stage === 'intro' && (
          <main className="flex min-h-0 flex-1 items-center justify-center py-1.5">
            <section className="w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-900/75 p-3 shadow-2xl sm:p-4">
              <div className="mb-2 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
                  <Hand size={24} />
                </div>
                <div>
                  <h2 className="text-base font-bold sm:text-lg">Uygulama nasıl yapılacak?</h2>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-300 sm:text-sm">
                    Öğrenci, gösterilen görsel modeli aynı sırayla oluşturur. İlk 6 deneme ekranda,
                    son 4 deneme öğretmenin hazırladığı gerçek nesnelerle yapılır.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-slate-700 bg-slate-950/55 p-2">
                  <p className="text-xs font-bold text-blue-300">Yönerge</p>
                  <p className="mt-1 text-sm text-slate-200">“Modele göre düzenle.”</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-950/55 p-2">
                  <p className="text-xs font-bold text-blue-300">Başlama süresi</p>
                  <p className="mt-1 text-sm text-slate-200">5 saniye içinde bağımsız başlamalıdır.</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-950/55 p-2">
                  <p className="text-xs font-bold text-blue-300">Başarı ölçütü</p>
                  <p className="mt-1 text-sm text-slate-200">10 denemenin en az 8’i doğru olmalıdır.</p>
                </div>
              </div>

              <div className="mt-2 rounded-xl border border-amber-400/30 bg-amber-500/5 p-2">
                <div className="flex items-center gap-2 text-amber-200">
                  <PackageCheck size={16} />
                  <p className="text-xs font-bold">Öğretmen denemeleri için malzeme önerisi</p>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {TEACHER_MATERIALS.map((material) => (
                    <span key={material.name} className="rounded-lg border border-amber-300/20 bg-slate-950/55 px-2 py-1 text-[10px] font-semibold text-amber-100">
                      {material.count} {material.name.toLocaleLowerCase('tr-TR')}
                    </span>
                  ))}
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                  Bu liste zorunlu değildir; aynı sıra yapısını koruyarak elinizdeki başka nesneleri de kullanabilirsiniz.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStage('trial')}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-950/40 transition active:scale-[0.99] sm:text-sm"
              >
                <ClipboardCheck size={18} />
                {mode === 'assessment' ? 'Değerlendirmeyi Başlat' : 'Çalışmayı Başlat'}
              </button>
            </section>
          </main>
        )}

        {stage === 'trial' && currentTrial.kind === 'digital' && (
          <main className="flex min-h-0 flex-1 flex-col justify-center gap-1 py-1">
            <section className="flex min-h-0 flex-1 flex-col">
              <div className="flex h-4 shrink-0 items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300 sm:text-xs">Model</p>
                <p className="flex items-center gap-1 text-[9px] text-slate-400 sm:text-[10px]"><Move size={11} /> Görselleri boş alanlara sürükleyin.</p>
              </div>
              <div className="flex min-h-0 flex-1 items-center justify-center gap-[clamp(2px,0.55vw,7px)] rounded-xl border border-blue-400/30 bg-blue-950/20 px-1 py-0.5">
                {currentTrial.pattern.map((item, index) => (
                  <ImageCard key={`model-${currentTrial.id}-${index}`} item={item} />
                ))}
              </div>
            </section>

            <section className="flex min-h-0 flex-1 flex-col">
              <p className="flex h-4 shrink-0 items-center text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300 sm:text-xs">Öğrencinin sırası</p>
              <div className={twMerge(
                'flex min-h-0 flex-1 items-center justify-center gap-[clamp(2px,0.55vw,7px)] rounded-xl border bg-emerald-950/15 px-1 py-0.5 transition-colors',
                recorded ? 'border-amber-400' : 'border-emerald-400/30',
              )}>
                {currentTrial.pattern.map((_, index) => {
                  const token = placed[index];
                  return (
                    <div
                      key={`slot-${currentTrial.id}-${index}`}
                      data-pattern-drop-index={index}
                      className={twMerge(
                        'flex h-[clamp(62px,20vh,92px)] w-[clamp(62px,10vw,92px)] shrink-0 items-center justify-center rounded-xl border-2 border-dashed transition-colors',
                        dragState ? 'border-cyan-300/70 bg-cyan-500/10' : 'border-slate-600 bg-slate-900/70',
                      )}
                    >
                      {token && (
                        <ImageCard
                          item={token.item}
                          highlighted={recorded}
                          draggable={!locked}
                          muted={dragState?.token.tokenId === token.tokenId}
                          onPointerDown={(event) => beginDrag(event, token, 'placed', index)}
                          onPointerMove={moveDrag}
                          onPointerUp={endDrag}
                          onPointerCancel={cancelDrag}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="flex min-h-0 flex-1 flex-col">
              <div className="flex h-5 shrink-0 items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300 sm:text-xs">Görseller</p>
                <button
                  type="button"
                  disabled={!canMarkNoResponse || locked}
                  onClick={handleNoResponse}
                  className="rounded-md border border-red-400/40 bg-red-500/10 px-2 py-0.5 text-[9px] font-bold text-red-200 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800/40 disabled:text-slate-600"
                >
                  Yanıt vermedi
                </button>
              </div>
              <div data-pattern-pool className="flex min-h-0 flex-1 items-center justify-center gap-[clamp(3px,0.7vw,9px)] rounded-xl border border-slate-700 bg-slate-900/80 px-1 py-0.5">
                {available.map((token) => (
                  <ImageCard
                    key={token.tokenId}
                    item={token.item}
                    compact
                    muted={locked}
                    draggable={!locked}
                    onPointerDown={(event) => beginDrag(event, token, 'available')}
                    onPointerMove={moveDrag}
                    onPointerUp={endDrag}
                    onPointerCancel={cancelDrag}
                  />
                ))}
                {available.length === 0 && (
                  <p className="text-xs font-semibold text-amber-300">Yanıt kaydedildi</p>
                )}
              </div>
            </section>
          </main>
        )}

        {dragState && (
          <div
            className="pointer-events-none fixed z-[300] w-[74px] -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-cyan-300 bg-white p-1 shadow-2xl shadow-cyan-950/60"
            style={{ left: dragState.x, top: dragState.y }}
          >
            <img src={dragState.token.item.src} alt="" className="h-16 w-full object-contain" />
          </div>
        )}

        {stage === 'trial' && currentTrial.kind === 'teacher' && (
          <main className="flex min-h-0 flex-1 items-center justify-center py-1">
            <section className="w-full max-w-5xl rounded-2xl border border-violet-400/25 bg-slate-900/75 p-2.5 shadow-xl">
              <div className="mb-1.5 flex items-start justify-between gap-3">
                <div>
                  <div className="mb-1 flex items-center gap-2 text-violet-300">
                    <GraduationCap size={18} />
                    <p className="text-xs font-bold uppercase tracking-[0.16em]">Öğretmen uygulaması</p>
                  </div>
                  <p className="text-xs text-slate-300 sm:text-sm">
                    Modeli oluşturun, aynı nesneleri karışık koyun ve “Modele göre düzenle.” deyin.
                  </p>
                </div>
                <p className="shrink-0 rounded-lg border border-slate-700 bg-slate-950/50 px-2 py-1 text-[10px] text-slate-300">
                  5 saniye içinde bağımsız başlamalıdır.
                </p>
              </div>

              <div className="rounded-xl border border-blue-400/30 bg-blue-950/20 p-1.5">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300">Hazırlanacak model</p>
                <div className="flex items-center justify-center gap-[clamp(3px,0.8vw,9px)]">
                  {currentTrial.pattern.map((item, index) => (
                    <ImageCard key={`teacher-model-${currentTrial.id}-${index}`} item={item} />
                  ))}
                </div>
              </div>

              <div className="mt-1.5 flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto rounded-xl border border-slate-700 bg-slate-950/45 p-1.5">
                  <span className="shrink-0 text-[10px] font-bold text-slate-400">Önerilen nesneler:</span>
                  {currentMaterials.map(({ item, count }) => (
                    <div key={item.id} className="flex shrink-0 items-center gap-1 rounded-lg bg-slate-800 px-1.5 py-0.5">
                      <img src={item.src} alt="" className="h-6 w-6 object-contain" />
                      <span className="text-[10px] font-semibold text-slate-200">{count} {item.name}</span>
                    </div>
                  ))}
                  <span className="shrink-0 text-[9px] text-amber-200">Zorunlu değil; aynı sırayla başka nesneler kullanılabilir.</span>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => finishTrial(false, false)}
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-red-400/50 bg-red-500/15 px-3 text-[10px] font-bold text-red-100 active:scale-95 disabled:opacity-40"
                  >
                    <XCircle size={17} /> Yapamadı
                  </button>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => finishTrial(true, true)}
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-emerald-400/50 bg-emerald-500/20 px-3 text-[10px] font-bold text-emerald-100 active:scale-95 disabled:opacity-40"
                  >
                    <CheckCircle2 size={17} /> Doğru yaptı
                  </button>
                </div>
              </div>

              {recorded && <p className="mt-2 text-center text-xs font-semibold text-amber-300">Yanıt kaydedildi</p>}
            </section>
          </main>
        )}

        {stage === 'result' && (
          <main className="flex flex-1 items-center justify-center py-4">
            <section className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900/80 p-6 text-center shadow-2xl">
              <div className={twMerge(
                'mx-auto flex h-16 w-16 items-center justify-center rounded-full',
                passed ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300',
              )}>
                {passed ? <Trophy size={34} /> : <XCircle size={34} />}
              </div>
              <h2 className="mt-3 text-xl font-bold">{passed ? 'Kazanım başarılı' : 'Kazanım henüz tamamlanmadı'}</h2>
              <p className="mt-1 text-sm text-slate-400">10 denemede {score} doğru yanıt</p>

              <div className="mx-auto mt-4 grid max-w-sm grid-cols-10 gap-1.5">
                {trialResults.map((result, index) => (
                  <div
                    key={result.trialId}
                    title={`${index + 1}. deneme`}
                    className={twMerge(
                      'flex aspect-square items-center justify-center rounded-lg border text-[10px] font-bold',
                      result.correct
                        ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
                        : 'border-red-400/50 bg-red-500/15 text-red-200',
                    )}
                  >
                    {index + 1}
                  </div>
                ))}
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={startAgain}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-bold text-slate-200 active:scale-[0.99] disabled:opacity-50"
                >
                  <RotateCcw size={17} /> Yeniden değerlendir
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndExit}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white active:scale-[0.99] disabled:opacity-60"
                >
                  {saving ? <Loader2 className="animate-spin" size={17} /> : <ClipboardCheck size={17} />}
                  {saving ? 'Kaydediliyor…' : mode === 'assessment' ? 'Kaydet ve çık' : 'Çık'}
                </button>
              </div>
            </section>
          </main>
        )}
      </div>
    </div>
  );
}
