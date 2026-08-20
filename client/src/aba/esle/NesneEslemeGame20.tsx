import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Loader2,
  RotateCcw,
  Speaker,
  Trophy,
  Volume2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';
import { db } from '@/firebase';
import { associateCurrentTeacherWithStudent } from '@/lib/studentTeacherAssociation';
import { playNeutralAssessmentFeedback } from './neutralAssessmentFeedback';

import instructionAudio from './grup/kategoriesle.mp3';
import animalsAudio from './grup/hayvanlar.mp3';
import vehiclesAudio from './grup/tasitlar.mp3';
import fruitsAudio from './grup/meyveler.mp3';
import clothesAudio from './grup/kiyafetler.mp3';
import jobsAudio from './grup/meslekler.mp3';
import drinksAudio from './grup/icecekler.mp3';
import householdAudio from './grup/evesyalari.mp3';
import vegetablesAudio from './grup/sebzeler.mp3';
import schoolAudio from './grup/okulmalzemeleri.mp3';
import placesAudio from './grup/mekanlar.mp3';
import foodAudio from './grup/yiyecekler.mp3';

import animalBasketEmpty from './grup/sepet/hayvanbos.png';
import animalBasketFull from './grup/sepet/hayvandolu.png';
import vehicleBasketEmpty from './grup/sepet/tasitbos.png';
import vehicleBasketFull from './grup/sepet/tasitdolu.png';
import fruitBasketEmpty from './grup/sepet/meyvebos.png';
import fruitBasketFull from './grup/sepet/meyvedolu.png';
import clothesBasketEmpty from './grup/sepet/kiyafetbos.png';
import clothesBasketFull from './grup/sepet/kiyafetdolu.png';
import jobsBasketEmpty from './grup/sepet/meslekbos.png';
import jobsBasketFull from './grup/sepet/meslekdolu.png';
import drinksBasketEmpty from './grup/sepet/icecekbos.png';
import drinksBasketFull from './grup/sepet/icecekdolu.png';
import householdBasketEmpty from './grup/sepet/evesyabos.png';
import householdBasketFull from './grup/sepet/evesyadolu.png';
import vegetablesBasketEmpty from './grup/sepet/sebzelerbos.png';
import vegetablesBasketFull from './grup/sepet/sebzedolu.png';
import schoolBasketEmpty from './grup/sepet/okulbos.png';
import schoolBasketFull from './grup/sepet/okuldolu.png';
import placesBasketEmpty from './grup/sepet/mekanbos.png';
import placesBasketFull from './grup/sepet/mekandolu.png';
import foodBasketEmpty from './grup/sepet/yiyecekbos.png';
import foodBasketFull from './grup/sepet/yiyecekdolu.png';

const animalModules = import.meta.glob('./grup/hayvan/*.webp', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;
const vehicleModules = import.meta.glob('./grup/tasit/*.webp', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;
const jobModules = import.meta.glob('./grup/meslek/*.webp', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;
const fruitModules = import.meta.glob('../../fruits/*.webp', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;
const clothesModules = import.meta.glob('../../clothes/*.jpg', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;
const vegetableModules = import.meta.glob('../../vegetables/*.jpg', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;
const drinkModules = import.meta.glob('../../icecekler/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;
const householdModules = import.meta.glob('../../evesyalari/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;
const schoolModules = import.meta.glob('../../okulmalzemeleri/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;
const placeModules = import.meta.glob('../../mekanlar/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;
const foodModules = import.meta.glob('../../temelgidalar/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

type CategoryId =
  | 'animals'
  | 'vehicles'
  | 'fruits'
  | 'clothes'
  | 'jobs'
  | 'drinks'
  | 'household'
  | 'vegetables'
  | 'school'
  | 'places'
  | 'food';

type CategoryItem = {
  id: string;
  name: string;
  src: string;
};

type Category = {
  id: CategoryId;
  label: string;
  audio: string;
  emptyBasket: string;
  fullBasket: string;
  items: CategoryItem[];
};

type SetDefinition = {
  id: string;
  left: CategoryId;
  right: CategoryId;
};

type Trial = CategoryItem & {
  categoryId: CategoryId;
};

type CategoryProgress = {
  passed: boolean;
  bestScore: number;
  attempts: number;
  updatedAt: number;
};

type ProgressRecord = Partial<Record<CategoryId, CategoryProgress>>;

interface GameProps {
  studentId: string;
  mode: 'assessment' | 'instruction';
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

const PROGRESS_KEY = 'EB46CategoryProgress';

const DISPLAY_NAMES: Record<string, string> = {
  asci: 'Aşçı',
  ciftci: 'Çiftçi',
  disci: 'Dişçi',
  firinci: 'Fırıncı',
  hemsire: 'Hemşire',
  itfaiyeci: 'İtfaiyeci',
  ogretmen: 'Öğretmen',
  sofor: 'Şoför',
  tamirci: 'Tamirci',
  kaplumbağa: 'Kaplumbağa',
  kopek: 'Köpek',
  koyun: 'Koyun',
  kus: 'Kuş',
  tavsan: 'Tavşan',
  zurafa: 'Zürafa',
  helikopter: 'Helikopter',
  itfaiye: 'İtfaiye aracı',
  kayik: 'Kayık',
  motosiklet: 'Motosiklet',
  otobus: 'Otobüs',
  polisarabası: 'Polis arabası',
  traktor: 'Traktör',
  ucak: 'Uçak',
  camasirmakinesi: 'Çamaşır makinesi',
  fırn: 'Fırın',
  supurge: 'Süpürge',
  tostmakinesi: 'Tost makinesi',
  kuruyemis: 'Kuruyemiş',
  yogurt: 'Yoğurt',
  okulcantasi: 'Okul çantası',
  okuldefteri: 'Okul defteri',
  okulkiyafeti: 'Okul kıyafeti',
  sinifsirasi: 'Sınıf sırası',
  siniftahtasi: 'Sınıf tahtası',
  suluboya: 'Sulu boya',
  meyvesuyu: 'Meyve suyu',
  tursusuyu: 'Turşu suyu',
  havalimani: 'Havalimanı',
};

const titleCase = (value: string) => {
  if (DISPLAY_NAMES[value]) return DISPLAY_NAMES[value];
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, character => character.toLocaleUpperCase('tr-TR'));
};

const modulesToItems = (modules: Record<string, string>): CategoryItem[] =>
  Object.entries(modules)
    .map(([path, src]) => {
      const filename = path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? path;
      return {
        id: filename,
        name: titleCase(filename),
        src,
      };
    })
    .sort((first, second) => first.name.localeCompare(second.name, 'tr'));

const CATEGORY_LIST: Category[] = [
  { id: 'animals', label: 'Hayvanlar', audio: animalsAudio, emptyBasket: animalBasketEmpty, fullBasket: animalBasketFull, items: modulesToItems(animalModules) },
  { id: 'vehicles', label: 'Taşıtlar', audio: vehiclesAudio, emptyBasket: vehicleBasketEmpty, fullBasket: vehicleBasketFull, items: modulesToItems(vehicleModules) },
  { id: 'fruits', label: 'Meyveler', audio: fruitsAudio, emptyBasket: fruitBasketEmpty, fullBasket: fruitBasketFull, items: modulesToItems(fruitModules) },
  { id: 'clothes', label: 'Kıyafetler', audio: clothesAudio, emptyBasket: clothesBasketEmpty, fullBasket: clothesBasketFull, items: modulesToItems(clothesModules) },
  { id: 'jobs', label: 'Meslekler', audio: jobsAudio, emptyBasket: jobsBasketEmpty, fullBasket: jobsBasketFull, items: modulesToItems(jobModules) },
  { id: 'drinks', label: 'İçecekler', audio: drinksAudio, emptyBasket: drinksBasketEmpty, fullBasket: drinksBasketFull, items: modulesToItems(drinkModules) },
  { id: 'household', label: 'Ev eşyaları', audio: householdAudio, emptyBasket: householdBasketEmpty, fullBasket: householdBasketFull, items: modulesToItems(householdModules) },
  { id: 'vegetables', label: 'Sebzeler', audio: vegetablesAudio, emptyBasket: vegetablesBasketEmpty, fullBasket: vegetablesBasketFull, items: modulesToItems(vegetableModules) },
  { id: 'school', label: 'Okul malzemeleri', audio: schoolAudio, emptyBasket: schoolBasketEmpty, fullBasket: schoolBasketFull, items: modulesToItems(schoolModules) },
  { id: 'places', label: 'Yerler', audio: placesAudio, emptyBasket: placesBasketEmpty, fullBasket: placesBasketFull, items: modulesToItems(placeModules) },
  { id: 'food', label: 'Yiyecekler', audio: foodAudio, emptyBasket: foodBasketEmpty, fullBasket: foodBasketFull, items: modulesToItems(foodModules) },
];

const CATEGORY_MAP = Object.fromEntries(
  CATEGORY_LIST.map(category => [category.id, category]),
) as Record<CategoryId, Category>;

const SETS: SetDefinition[] = [
  { id: 'set-1', left: 'animals', right: 'vehicles' },
  { id: 'set-2', left: 'fruits', right: 'clothes' },
  { id: 'set-3', left: 'jobs', right: 'drinks' },
  { id: 'set-4', left: 'household', right: 'vegetables' },
  { id: 'set-5', left: 'school', right: 'places' },
  { id: 'set-6', left: 'food', right: 'vehicles' },
];

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
};

const shuffleWithoutThreeInARow = (trials: Trial[]) => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const candidate = shuffle(trials);
    const hasThreeInARow = candidate.some(
      (trial, index) =>
        index >= 2 &&
        trial.categoryId === candidate[index - 1].categoryId &&
        trial.categoryId === candidate[index - 2].categoryId,
    );
    if (!hasThreeInARow) return candidate;
  }
  return shuffle(trials);
};

const playAudio = (source: string) => {
  const audio = new Audio(source);
  audio.volume = 1;
  audio.play().catch(() => {});
  return audio;
};

export default function NesneEslemeGame20({
  studentId,
  mode,
  onClose,
  onComplete,
}: GameProps) {
  const [phase, setPhase] = useState<'setup' | 'intro' | 'playing' | 'full' | 'result'>('setup');
  const [selectedSet, setSelectedSet] = useState<SetDefinition | null>(null);
  const [progress, setProgress] = useState<ProgressRecord>({});
  const [loadingProgress, setLoadingProgress] = useState(mode === 'assessment');
  const [savingProgress, setSavingProgress] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [trialIndex, setTrialIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [categoryScores, setCategoryScores] = useState<Partial<Record<CategoryId, number>>>({});
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [locked, setLocked] = useState(false);
  const [resultProgress, setResultProgress] = useState<ProgressRecord>({});
  const [resultScores, setResultScores] = useState<Partial<Record<CategoryId, number>>>({});
  const [resultTotal, setResultTotal] = useState(0);

  const boxRefs = useRef<Partial<Record<CategoryId, HTMLDivElement | null>>>({});

  const currentTrial = trials[trialIndex];
  const completedCategoryCount = CATEGORY_LIST.filter(category => progress[category.id]?.passed).length;
  const evaluatedCategoryCount = CATEGORY_LIST.filter(category => (progress[category.id]?.attempts ?? 0) > 0).length;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    if ((window as any).AndroidOrientation) {
      (window as any).AndroidOrientation.lockOrientation('portrait');
    } else {
      ScreenOrientation.lock({ orientation: 'portrait' }).catch(() => {});
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
    if (mode !== 'assessment') {
      setLoadingProgress(false);
      return;
    }

    const loadProgress = async () => {
      try {
        const institutionId = localStorage.getItem('kazanim-takip-institution-id');
        if (!institutionId) throw new Error('Kurum bilgisi bulunamadı.');
        const snapshot = await getDoc(
          doc(db, 'institutions', institutionId, 'students', studentId, 'assessments', 'aba'),
        );
        const savedProgress = snapshot.exists()
          ? (snapshot.data()[PROGRESS_KEY] as ProgressRecord | undefined)
          : undefined;
        if (savedProgress) setProgress(savedProgress);
      } catch (error) {
        console.error('EB 4.6 ilerleme yükleme hatası:', error);
        toast.error('Kategori ilerlemesi yüklenemedi.');
      } finally {
        setLoadingProgress(false);
      }
    };

    loadProgress();
  }, [mode, studentId]);

  useEffect(() => {
    if (phase !== 'full') return;
    const timeout = window.setTimeout(() => setPhase('result'), 1000);
    return () => window.clearTimeout(timeout);
  }, [phase]);

  const activeCategories = useMemo(() => {
    if (!selectedSet) return [];
    return [CATEGORY_MAP[selectedSet.left], CATEGORY_MAP[selectedSet.right]];
  }, [selectedSet]);

  const prepareSet = (setDefinition: SetDefinition) => {
    const leftCategory = CATEGORY_MAP[setDefinition.left];
    const rightCategory = CATEGORY_MAP[setDefinition.right];
    const leftItems = shuffle(leftCategory.items);
    const rightItems = shuffle(rightCategory.items);

    if (leftItems.length < 5 || rightItems.length < 5) {
      toast.error('Bu kategori için yeterli resim bulunamadı.');
      return;
    }

    const nextTrials: Trial[] = [
      ...leftItems.slice(0, 5).map(item => ({ ...item, categoryId: leftCategory.id })),
      ...rightItems.slice(0, 5).map(item => ({ ...item, categoryId: rightCategory.id })),
    ];

    setSelectedSet(setDefinition);
    setTrials(shuffleWithoutThreeInARow(nextTrials));
    setTrialIndex(0);
    setScore(0);
    setCategoryScores({ [leftCategory.id]: 0, [rightCategory.id]: 0 });
    setSelectedCategory(null);
    setLocked(false);
    setSaveFailed(false);
    setPhase('intro');

    const audio = playAudio(instructionAudio);
    const startPlaying = () => setPhase('playing');
    audio.addEventListener('ended', startPlaying, { once: true });
    window.setTimeout(() => {
      if (!audio.ended) startPlaying();
    }, 4500);
  };

  const saveAssessmentProgress = async (
    nextCategoryScores: Partial<Record<CategoryId, number>>,
  ) => {
    if (!selectedSet) return progress;

    const now = Date.now();
    const nextProgress: ProgressRecord = { ...progress };
    [selectedSet.left, selectedSet.right].forEach(categoryId => {
      const categoryScore = nextCategoryScores[categoryId] ?? 0;
      const previous = nextProgress[categoryId];
      nextProgress[categoryId] = {
        passed: Boolean(previous?.passed || categoryScore >= 4),
        bestScore: Math.max(previous?.bestScore ?? 0, categoryScore),
        attempts: (previous?.attempts ?? 0) + 1,
        updatedAt: now,
      };
    });

    setSavingProgress(true);
    setSaveFailed(false);
    try {
      const institutionId = localStorage.getItem('kazanim-takip-institution-id');
      if (!institutionId) throw new Error('Kurum bilgisi bulunamadı.');
      await setDoc(
        doc(db, 'institutions', institutionId, 'students', studentId, 'assessments', 'aba'),
        { [PROGRESS_KEY]: nextProgress },
        { merge: true },
      );
      await associateCurrentTeacherWithStudent(studentId);
      setProgress(nextProgress);
      setResultProgress(nextProgress);
      return nextProgress;
    } catch (error) {
      console.error('EB 4.6 ilerleme kaydetme hatası:', error);
      setSaveFailed(true);
      toast.error('Kategori sonucu kaydedilemedi.');
      return progress;
    } finally {
      setSavingProgress(false);
    }
  };

  const finishSet = async (
    finalScore: number,
    finalCategoryScores: Partial<Record<CategoryId, number>>,
  ) => {
    setResultTotal(finalScore);
    setResultScores(finalCategoryScores);
    setPhase('full');

    if (mode === 'assessment') {
      const nextProgress = await saveAssessmentProgress(finalCategoryScores);
      const allPassed = CATEGORY_LIST.every(category => nextProgress[category.id]?.passed);
      if (allPassed) {
        confetti({ particleCount: 220, spread: 90, origin: { y: 0.65 } });
      }
    } else {
      setResultProgress(progress);
    }
  };

  const advanceTrial = (
    nextScore: number,
    nextCategoryScores: Partial<Record<CategoryId, number>>,
  ) => {
    const isLastTrial = trialIndex >= trials.length - 1;
    if (isLastTrial) {
      finishSet(nextScore, nextCategoryScores);
      return;
    }

    setTrialIndex(previous => previous + 1);
    setSelectedCategory(null);
    setLocked(false);
  };

  const recordAnswer = (categoryId: CategoryId) => {
    if (!currentTrial || locked) return;

    const isCorrect = categoryId === currentTrial.categoryId;
    setSelectedCategory(categoryId);
    setLocked(true);

    if (mode === 'assessment') playNeutralAssessmentFeedback();

    if (mode === 'instruction' && !isCorrect) {
      window.setTimeout(() => {
        setSelectedCategory(null);
        setLocked(false);
      }, 900);
      return;
    }

    const nextScore = score + (isCorrect ? 1 : 0);
    const nextCategoryScores = {
      ...categoryScores,
      [currentTrial.categoryId]:
        (categoryScores[currentTrial.categoryId] ?? 0) + (isCorrect ? 1 : 0),
    };
    setScore(nextScore);
    setCategoryScores(nextCategoryScores);

    window.setTimeout(
      () => advanceTrial(nextScore, nextCategoryScores),
      mode === 'assessment' ? 850 : 1100,
    );
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: { point: { x: number; y: number } }) => {
    if (locked || !selectedSet) return;

    const changedTouch = 'changedTouches' in event ? event.changedTouches.item(0) : null;
    const pointerX = changedTouch?.clientX
      ?? ('clientX' in event ? event.clientX : info.point.x - window.scrollX);
    const pointerY = changedTouch?.clientY
      ?? ('clientY' in event ? event.clientY : info.point.y - window.scrollY);

    const droppedCategory = [selectedSet.left, selectedSet.right].find(categoryId => {
      const element = boxRefs.current[categoryId];
      if (!element) return false;
      const rectangle = element.getBoundingClientRect();
      return (
        pointerX >= rectangle.left &&
        pointerX <= rectangle.right &&
        pointerY >= rectangle.top &&
        pointerY <= rectangle.bottom
      );
    });

    if (droppedCategory) recordAnswer(droppedCategory);
  };

  const categoryBorderClass = (categoryId: CategoryId) => {
    if (selectedCategory !== categoryId) return 'border-slate-300';
    return 'border-yellow-400';
  };

  const exitFromResult = () => {
    if (mode !== 'assessment') {
      onClose();
      return;
    }

    const effectiveProgress = Object.keys(resultProgress).length ? resultProgress : progress;
    const allPassed = CATEGORY_LIST.every(category => effectiveProgress[category.id]?.passed);
    const allEvaluated = CATEGORY_LIST.every(
      category => (effectiveProgress[category.id]?.attempts ?? 0) > 0,
    );

    if (allPassed) onComplete(true);
    else if (allEvaluated) onComplete(false);
    else onClose();
  };

  if (loadingProgress) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50">
        <Loader2 className="h-9 w-9 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex h-[100dvh] w-screen select-none flex-col overflow-hidden bg-slate-50 font-sans text-slate-800 overscroll-none">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <button
          type="button"
          onClick={phase === 'setup' ? onClose : () => setPhase('setup')}
          className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm active:scale-95"
          aria-label="Geri"
        >
          <ArrowLeft size={21} />
        </button>

        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-black text-slate-800">Kategorilerine Göre Eşleme</p>
          <p className="text-[11px] font-semibold text-slate-400">EB 4.6</p>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-700">
          {mode === 'assessment' ? <ClipboardCheck size={14} /> : <GraduationCap size={14} />}
          <span>{mode === 'assessment' ? 'Değerlendirme' : 'Öğretim'}</span>
        </div>
      </header>

      {phase === 'setup' && (
        <main className="flex-1 overflow-y-auto px-4 py-5">
          <div className="mx-auto w-full max-w-xl space-y-4">
            {mode === 'assessment' && (
              <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">Kategori ilerlemesi</span>
                  <span className="text-sm font-black text-blue-700">{completedCategoryCount}/11</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${(completedCategoryCount / 11) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Her sette iki kategori ve toplam 10 resim değerlendirilir.
                </p>
              </div>
            )}

            <div className="space-y-2">
              {SETS.map((setDefinition, index) => {
                const leftCategory = CATEGORY_MAP[setDefinition.left];
                const rightCategory = CATEGORY_MAP[setDefinition.right];
                const leftPassed = Boolean(progress[leftCategory.id]?.passed);
                const rightPassed = Boolean(progress[rightCategory.id]?.passed);
                const setCompleted = leftPassed && rightPassed;

                return (
                  <button
                    type="button"
                    key={setDefinition.id}
                    onClick={() => prepareSet(setDefinition)}
                    className={twMerge(
                      'flex w-full items-center justify-between gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm transition active:scale-[0.99]',
                      setCompleted ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 hover:border-blue-300',
                    )}
                  >
                    <div className="min-w-0">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {index + 1}. set
                      </p>
                      <p className="text-sm font-black text-slate-800">
                        {leftCategory.label} · {rightCategory.label}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className={twMerge('h-2.5 w-2.5 rounded-full', leftPassed ? 'bg-emerald-500' : 'bg-slate-200')} />
                      <span className={twMerge('h-2.5 w-2.5 rounded-full', rightPassed ? 'bg-emerald-500' : 'bg-slate-200')} />
                      {setCompleted && <CheckCircle2 className="ml-1 text-emerald-600" size={19} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </main>
      )}

      {phase === 'intro' && (
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600">
            <Volume2 size={34} />
          </div>
          <p className="text-lg font-black text-slate-800">Yönerge dinleniyor</p>
          <p className="text-sm text-slate-500">Şimdi resimleri kategorilerine göre eşle.</p>
        </main>
      )}

      {phase === 'playing' && currentTrial && selectedSet && (
        <main className="flex min-h-0 flex-1 flex-col px-2.5 pb-3 pt-2.5">
          <div className="mx-auto mb-2 flex w-full max-w-xl items-center gap-3 px-1 text-xs font-bold text-slate-500">
            <span className="shrink-0">{trialIndex + 1}/10</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-200"
                style={{ width: `${((trialIndex + 1) / 10) * 100}%` }}
              />
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-xl grid-cols-2 gap-2 sm:gap-3">
            {activeCategories.map(category => (
              <motion.div
                key={category.id}
                ref={element => {
                  boxRefs.current[category.id] = element;
                }}
                role="button"
                tabIndex={0}
                aria-label={`${category.label} sepeti. Seslendirmek için dokunun.`}
                onClick={() => playAudio(category.audio)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') playAudio(category.audio);
                }}
                animate={selectedCategory === category.id ? { scale: [1, 1.07, 1] } : { scale: 1 }}
                transition={{ duration: 0.38, ease: 'easeOut' }}
                className={twMerge(
                  'relative aspect-square min-w-0 cursor-pointer overflow-hidden rounded-[1.5rem] border-[3px] bg-white shadow-md transition-colors',
                  categoryBorderClass(category.id),
                )}
              >
                <img
                  src={category.emptyBasket}
                  alt={`${category.label} boş sepeti`}
                  className="h-full w-full object-contain p-0.5"
                  draggable={false}
                />
                <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-white/95 text-blue-600 shadow-sm">
                  <Speaker size={15} />
                </span>
                <span className="absolute inset-x-2 bottom-2 truncate rounded-full border border-slate-200 bg-white/95 px-2 py-1 text-center text-[10px] font-black text-slate-700 shadow-sm sm:text-xs">
                  {category.label}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-2.5">
            <p className="mb-1.5 text-xs font-bold text-slate-400">Resmi uygun sepetin içine sürükle</p>
            <motion.div
              key={`${currentTrial.categoryId}-${currentTrial.id}-${trialIndex}`}
              drag={!locked}
              dragConstraints={false}
              dragSnapToOrigin
              dragElastic={0.08}
              dragMomentum={false}
              onDragEnd={handleDragEnd}
              whileDrag={{ scale: 1.07, zIndex: 80 }}
              className="flex h-32 w-32 touch-none items-center justify-center"
            >
              <img
                src={currentTrial.src}
                alt="Eşlenecek resim"
                className="pointer-events-none max-h-32 max-w-32 object-contain drop-shadow-md"
                draggable={false}
              />
            </motion.div>
          </div>
        </main>
      )}

      {phase === 'full' && selectedSet && (
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-3 py-5">
          <p className="text-base font-black text-slate-700">Eşleme tamamlandı</p>
          <div className="grid w-full max-w-xl grid-cols-2 gap-3">
            {activeCategories.map(category => (
              <motion.div
                key={category.id}
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative aspect-square overflow-hidden rounded-[1.6rem] border-[3px] border-yellow-400 bg-white shadow-lg"
              >
                <img
                  src={category.fullBasket}
                  alt={`${category.label} dolu sepeti`}
                  className="h-full w-full object-contain p-0.5"
                  draggable={false}
                />
                <span className="absolute inset-x-2 bottom-2 truncate rounded-full border border-slate-200 bg-white/95 px-2 py-1 text-center text-xs font-black text-slate-700 shadow-sm">
                  {category.label}
                </span>
              </motion.div>
            ))}
          </div>
        </main>
      )}

      {phase === 'result' && selectedSet && (
        <main className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-6">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-xl">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              {mode === 'assessment' ? <ClipboardCheck size={30} /> : <GraduationCap size={30} />}
            </div>
            <h2 className="text-xl font-black text-slate-800">
              {mode === 'assessment' ? 'Set tamamlandı' : 'Çalışma tamamlandı'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Toplam sonuç: {resultTotal}/10</p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[selectedSet.left, selectedSet.right].map(categoryId => {
                const category = CATEGORY_MAP[categoryId];
                const categoryScore = resultScores[categoryId] ?? 0;
                const passed = categoryScore >= 4;
                return (
                  <div key={categoryId} className="rounded-2xl border border-slate-200 p-3">
                    <p className="truncate text-xs font-bold text-slate-500">{category.label}</p>
                    <p className={twMerge('mt-1 text-2xl font-black', passed ? 'text-emerald-600' : 'text-red-600')}>
                      {categoryScore}/5
                    </p>
                  </div>
                );
              })}
            </div>

            {mode === 'assessment' && (
              <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500">Tamamlanan kategori</p>
                <p className="mt-0.5 text-lg font-black text-slate-800">
                  {CATEGORY_LIST.filter(category => (resultProgress[category.id] ?? progress[category.id])?.passed).length}/11
                </p>
              </div>
            )}

            {saveFailed && (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                Sonuç kaydedilemedi. İnternet bağlantısını kontrol edip seti yeniden değerlendirin.
              </p>
            )}

            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={() => setPhase('setup')}
                disabled={savingProgress}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 disabled:opacity-50"
              >
                <RotateCcw size={17} /> Başka set seç
              </button>
              <button
                type="button"
                onClick={exitFromResult}
                disabled={savingProgress || saveFailed}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-md disabled:opacity-50"
              >
                {savingProgress ? <Loader2 className="animate-spin" size={17} /> : <Trophy size={17} />}
                {savingProgress ? 'Kaydediliyor…' : mode === 'assessment' ? 'Kaydet ve çık' : 'Çık'}
              </button>
            </div>

            {mode === 'assessment' && evaluatedCategoryCount < 11 && (
              <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
                Kazanım, 11 kategorinin tamamı değerlendirildiğinde sonuçlanır.
              </p>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
