import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Volume2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';

type AssessmentKind = 'sound' | 'syllable' | 'word' | 'environmental';
type TrialSource = 'digital' | 'teacher';

export interface AssessmentCompletionDetails {
  kind: AssessmentKind;
  score: number;
  setPassed: boolean;
  correctLabels: string[];
  totalMastered: number;
}

interface GameProps {
  kind: AssessmentKind;
  title: string;
  onClose: () => void;
  onComplete: (success: boolean, details?: AssessmentCompletionDetails) => void | Promise<void>;
  masteredLabels?: string[];
  completionTarget?: number;
}

interface DigitalAsset {
  id: string;
  label: string;
  audioUrl: string;
  videoUrl: string;
}

interface Trial {
  id: string;
  label: string;
  source: TrialSource;
  audioUrl?: string;
  videoUrl?: string;
}

const EMPTY_LABELS: string[] = [];

const SOUND_VIDEO_MODULES = import.meta.glob('./videoses/1-1/*.{mp4,webm}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const SOUND_AUDIO_MODULES = import.meta.glob('./videoses/1-1/*.{mp3,wav,m4a,ogg}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const SYLLABLE_VIDEO_MODULES = import.meta.glob('./videoses/1-2/*.{mp4,webm}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const SYLLABLE_AUDIO_MODULES = import.meta.glob('./videoses/1-2/*.{mp3,wav,m4a,ogg}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const WORD_VIDEO_MODULES = import.meta.glob('./videoses/1-3/*.{mp4,webm}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const WORD_AUDIO_MODULES = import.meta.glob('./videoses/1-3/*.{mp3,wav,m4a,ogg}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const ENVIRONMENTAL_VIDEO_MODULES = import.meta.glob('./videoses/1-4/*.{mp4,webm}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const ENVIRONMENTAL_AUDIO_MODULES = import.meta.glob('./videoses/1-4/*.{mp3,wav,m4a,ogg}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const SOUND_TEACHER_POOL = [
  'ı', 'ö', 'ü',
  'aaa', 'eee', 'ııı', 'iii', 'ooo', 'ööö', 'uuu', 'üüü',
  'mmm', 'nnn', 'fff', 'sss', 'zzz', 'vvv',
  'bbb', 'ppp', 'ttt', 'ddd', 'lll',
];

const SYLLABLE_TEACHER_POOL = [
  'ba', 'ma', 'pa', 'da', 'ta', 'ka', 'ga', 'sa', 'za', 'şa', 'ça', 'la', 'na', 'ra', 'ya', 'ha',
  'be', 'me', 'pe', 'de', 'te', 'ke', 'ge', 'se', 'ze', 'şe', 'çe', 'le', 'ne', 're', 'ye', 'he',
  'bi', 'mi', 'pi', 'di', 'ti', 'ki', 'gi', 'si', 'zi', 'şi', 'çi', 'li', 'ni', 'ri', 'yi', 'hi',
  'bo', 'mo', 'po', 'do', 'to', 'ko', 'go', 'so', 'zo', 'şo', 'ço', 'lo', 'no', 'ro', 'yo', 'ho',
  'bu', 'mu', 'pu', 'du', 'tu', 'ku', 'gu', 'su', 'zu', 'şu', 'çu', 'lu', 'nu', 'ru', 'yu', 'hu',
  'at', 'et', 'it', 'ot', 'ut', 'al', 'el', 'il', 'ol', 'ul', 'aç', 'iç', 'ip', 'un', 'üs',
  'bak', 'tak', 'kap', 'kat', 'top', 'set', 'pil', 'bal', 'dal', 'tel', 'kol', 'kum',
];

const WORD_TEACHER_POOL = [
  'Top', 'At', 'Su', 'Kuş', 'Taş', 'Bal', 'Süt', 'Muz', 'İp', 'Çay',
  'Kapı', 'Vazo', 'Çorap', 'Kitap', 'Çiçek', 'Bardak', 'Tabak', 'Kaşık', 'Çatal', 'Ekmek',
  'Pasta', 'Balon', 'Yatak', 'Koltuk', 'Oyuncak', 'Telefon', 'Bisiklet', 'Dondurma', 'Bisküvi', 'Meyve',
  'Elma', 'Armut', 'Mandalina', 'Portakal', 'Kiraz', 'Üzüm', 'Havuç', 'Domates', 'Kavun', 'Pilav',
  'Ayran', 'Limon', 'Ceket', 'Mont', 'Terlik', 'Ayakkabı', 'Şapka', 'Eldiven', 'Gömlek', 'Pantolon',
  'Güneş', 'Yağmur', 'Bulut', 'Yıldız', 'Deniz', 'Park', 'Okul', 'Bahçe', 'Sokak', 'Ev',
  'Abla', 'Abi', 'Teyze', 'Amca', 'Nine', 'Dost', 'Çocuk', 'Öğretmen', 'Arkadaş', 'Komşu',
];

const ENVIRONMENTAL_TEACHER_POOL = [
  'Vak vak', 'Vız vız', 'Tıs tıs', 'Vırak vırak', 'Hu hu',
  'Düt düt', 'Brum brum', 'Vuu vuu', 'Şıp şıp', 'Güm güm',
  'Ding dong', 'Çın çın', 'Tık tık', 'Fıs fıs', 'Çıngır çıngır',
  'Hapşu', 'Öhö öhö', 'Hor hor', 'Lıkır lıkır', 'Fokur fokur',
  'Şakır şakır', 'Küt', 'Bam', 'Pof', 'Çat',
];

const WORD_LABELS: Record<string, string> = {
  anne: 'Anne',
  araba: 'Araba',
  aslan: 'Aslan',
  baba: 'Baba',
  bebek: 'Bebek',
  canta: 'Çanta',
  cilek: 'Çilek',
  corba: 'Çorba',
  dede: 'Dede',
  dolap: 'Dolap',
  kalem: 'Kalem',
  karpuz: 'Karpuz',
  kedi: 'Kedi',
  kopek: 'Köpek',
  masa: 'Masa',
  patates: 'Patates',
  peynir: 'Peynir',
  salincak: 'Salıncak',
  seker: 'Şeker',
  yumurta: 'Yumurta',
  zeytin: 'Zeytin',
};

const ENVIRONMENTAL_LABELS: Record<string, string> = {
  cik: 'Cik cik',
  cirt: 'Cırt',
  cuf: 'Çuf çuf',
  gitgidak: 'Gıt gıdak',
  hav: 'Hav hav',
  kirt: 'Kırt kırt',
  me: 'Mee',
  miyav: 'Miyav',
  mo: 'Mö',
  pat: 'Pat',
  sirr: 'Şırr',
  tak: 'Tak',
  tiktak: 'Tik tak',
  uuruu: 'Ü-ürü-üü',
  vinn: 'Vınn',
};

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
};

const withoutExtension = (path: string) => path.replace(/\.[^/.]+$/, '');

const simpleText = (value: string) => value
  .toLocaleLowerCase('tr-TR')
  .replace(/[ç]/g, 'c')
  .replace(/[ğ]/g, 'g')
  .replace(/[ıİi]/g, 'i')
  .replace(/[ö]/g, 'o')
  .replace(/[ş]/g, 's')
  .replace(/[ü]/g, 'u')
  .replace(/[^a-z0-9]/g, '');

const labelFromPath = (path: string) => {
  const fileName = withoutExtension(path).split('/').pop() || '';
  if (fileName.toLocaleLowerCase('tr-TR') === 's2') return 'Ş';
  const environmentalLabel = ENVIRONMENTAL_LABELS[simpleText(fileName)];
  if (environmentalLabel) return environmentalLabel;
  const wordLabel = WORD_LABELS[simpleText(fileName)];
  if (wordLabel) return wordLabel;
  return fileName.replace(/[_-]+/g, ' ').trim() || fileName;
};

const buildDigitalAssets = (
  videoModules: Record<string, string>,
  audioModules: Record<string, string>,
) => {
  const videosByKey = new Map(
    Object.entries(videoModules).map(([path, url]) => [withoutExtension(path), { path, url }]),
  );
  const audiosByKey = new Map(
    Object.entries(audioModules).map(([path, url]) => [withoutExtension(path), { path, url }]),
  );

  const pairedAssets: Array<DigitalAsset & { path: string }> = [];
  videosByKey.forEach((video, key) => {
    const audio = audiosByKey.get(key);
    if (!audio) return;
    pairedAssets.push({
      id: key,
      label: labelFromPath(video.path),
      audioUrl: audio.url,
      videoUrl: video.url,
      path: video.path,
    });
  });

  pairedAssets.sort((first, second) => first.path.localeCompare(second.path, 'tr', { numeric: true }));
  return pairedAssets.map(asset => ({
    id: asset.id,
    label: asset.label,
    audioUrl: asset.audioUrl,
    videoUrl: asset.videoUrl,
  }));
};

const DIGITAL_ASSETS = {
  soundAssets: buildDigitalAssets(SOUND_VIDEO_MODULES, SOUND_AUDIO_MODULES),
  syllableAssets: buildDigitalAssets(SYLLABLE_VIDEO_MODULES, SYLLABLE_AUDIO_MODULES),
  wordAssets: buildDigitalAssets(WORD_VIDEO_MODULES, WORD_AUDIO_MODULES),
  environmentalAssets: buildDigitalAssets(ENVIRONMENTAL_VIDEO_MODULES, ENVIRONMENTAL_AUDIO_MODULES),
};

const createTeacherTrials = (
  kind: AssessmentKind,
  digitalLabels: string[],
  excludedLabels: string[] = [],
) => {
  const excludedKeys = new Set([...digitalLabels, ...excludedLabels].map(simpleText));
  const usedKeys = new Set<string>();
  const pool = kind === 'sound'
    ? SOUND_TEACHER_POOL
    : kind === 'syllable'
      ? SYLLABLE_TEACHER_POOL
      : kind === 'word'
        ? WORD_TEACHER_POOL
        : ENVIRONMENTAL_TEACHER_POOL;
  return shuffle(pool)
    .filter(label => {
      const key = simpleText(label);
      if (excludedKeys.has(key) || usedKeys.has(key)) return false;
      usedKeys.add(key);
      return true;
    })
    .map(label => ({
      id: `teacher-${kind}-${simpleText(label)}`,
      label,
      source: 'teacher' as const,
    }));
};

export default function SozelTaklitAssessment({
  kind,
  title,
  onClose,
  onComplete,
  masteredLabels = EMPTY_LABELS,
  completionTarget,
}: GameProps) {
  const digitalPool = kind === 'sound'
    ? DIGITAL_ASSETS.soundAssets
    : kind === 'syllable'
      ? DIGITAL_ASSETS.syllableAssets
      : kind === 'word'
        ? DIGITAL_ASSETS.wordAssets
        : DIGITAL_ASSETS.environmentalAssets;
  const masteredKeys = useMemo(
    () => new Set(masteredLabels.map(simpleText)),
    [masteredLabels],
  );

  const session = useMemo(() => {
    const tracksMastery = kind === 'word' || kind === 'environmental';
    const availableDigital = tracksMastery
      ? digitalPool.filter(asset => !masteredKeys.has(simpleText(asset.label)))
      : digitalPool;
    const shuffledDigital = shuffle(availableDigital);
    const digitalCount = tracksMastery ? Math.min(6, shuffledDigital.length) : 6;
    const teacherCount = 10 - digitalCount;
    const selectedDigital = shuffledDigital.slice(0, digitalCount).map(asset => ({
      ...asset,
      source: 'digital' as const,
    }));
    const teacherPool = createTeacherTrials(kind, digitalPool.map(item => item.label), masteredLabels);
    const selectedTeacher = teacherPool.slice(0, teacherCount);

    return {
      trials: shuffle<Trial>([...selectedDigital, ...selectedTeacher]),
      digitalReserve: shuffledDigital.slice(digitalCount).map(asset => ({
        ...asset,
        source: 'digital' as const,
      })),
      teacherReserve: teacherPool.slice(teacherCount),
      digitalCount,
      teacherCount,
    };
  }, [kind, digitalPool, masteredKeys, masteredLabels]);

  const [trials, setTrials] = useState<Trial[]>(session.trials);
  const [digitalReserve, setDigitalReserve] = useState<Trial[]>(session.digitalReserve);
  const [teacherReserve, setTeacherReserve] = useState<Trial[]>(session.teacherReserve);
  const [trialIndex, setTrialIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [playCount, setPlayCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [finished, setFinished] = useState(false);
  const [correctLabels, setCorrectLabels] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrial = trials[trialIndex];
  const setName = kind === 'sound'
    ? 'ses'
    : kind === 'syllable'
      ? 'hece'
      : kind === 'word'
        ? 'sözcük'
        : 'hayvan ve çevre sesi';
  const hasEnoughDigitalAssets = kind === 'word' ? digitalPool.length > 0 : digitalPool.length >= 6;
  const hasEnoughTrials = session.trials.length === 10;
  const canChange = currentTrial?.source === 'digital'
    ? digitalReserve.length > 0
    : teacherReserve.length > 0;

  const stopMedia = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  useEffect(() => () => {
    videoRef.current?.pause();
    audioRef.current?.pause();
  }, []);

  const playDigitalTrial = async () => {
    if (!currentTrial || currentTrial.source !== 'digital' || playCount >= 2 || isPlaying) return;
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;

    video.pause();
    audio.pause();
    video.currentTime = 0;
    audio.currentTime = 0;
    video.muted = true;
    setIsPlaying(true);

    try {
      await Promise.all([video.play(), audio.play()]);
      setPlayCount(previous => previous + 1);
    } catch (error) {
      console.error('Sözel taklit medya oynatma hatası:', error);
      video.pause();
      audio.pause();
      setIsPlaying(false);
      toast.error('Ses oynatılamadı. Lütfen tekrar deneyin.');
    }
  };

  const changeTrial = () => {
    if (!currentTrial || !canChange) return;
    stopMedia();
    setPlayCount(0);

    if (currentTrial.source === 'digital') {
      const [replacement, ...rest] = shuffle(digitalReserve);
      setTrials(previous => previous.map((trial, index) => (index === trialIndex ? replacement : trial)));
      setDigitalReserve(rest);
    } else {
      const [replacement, ...rest] = shuffle(teacherReserve);
      setTrials(previous => previous.map((trial, index) => (index === trialIndex ? replacement : trial)));
      setTeacherReserve(rest);
    }
  };

  const recordResponse = (wasCorrect: boolean) => {
    if (!currentTrial || finished) return;
    if (currentTrial.source === 'digital' && playCount === 0) {
      toast.info('Önce sesi oynatın.');
      return;
    }

    stopMedia();
    const nextCorrectCount = correctCount + (wasCorrect ? 1 : 0);
    const nextAnsweredCount = answeredCount + 1;
    setCorrectCount(nextCorrectCount);
    setAnsweredCount(nextAnsweredCount);
    if (wasCorrect) {
      setCorrectLabels(previous => [...previous, currentTrial.label]);
    }

    if (nextAnsweredCount >= 10) {
      setFinished(true);
      return;
    }

    setTrialIndex(previous => previous + 1);
    setPlayCount(0);
  };

  const saveAndExit = async () => {
    setIsSaving(true);
    try {
      const setPassed = correctCount >= 8;
      const resultingLabels = setPassed
        ? [...masteredLabels, ...correctLabels]
        : masteredLabels;
      const uniqueMastered = Array.from(
        new Map(resultingLabels.map(label => [simpleText(label), label])).values(),
      );
      const totalMastered = uniqueMastered.length;
      const success = completionTarget ? totalMastered >= completionTarget : setPassed;
      await onComplete(success, {
        kind,
        score: correctCount,
        setPassed,
        correctLabels,
        totalMastered,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!hasEnoughDigitalAssets || !hasEnoughTrials) {
    return (
      <div className="fixed inset-0 z-[700] flex min-h-[100dvh] items-center justify-center bg-slate-950 p-5 text-white">
        <div className="w-full max-w-md rounded-3xl border border-amber-500/30 bg-slate-900 p-6 text-center shadow-2xl">
          <Volume2 className="mx-auto mb-4 text-amber-400" size={48} />
          <h2 className="mb-2 text-xl font-black">Dijital dosyalar eksik</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            {title} için yeterli sayıda eşleşen MP4–MP3 çifti ve öğretmen hedefi bulunmalıdır. Şu anda {digitalPool.length} eşleşen çift algılandı.
          </p>
          <button onClick={onClose} className="mt-6 w-full rounded-xl bg-slate-700 px-5 py-3 font-bold text-white">
            GERİ DÖN
          </button>
        </div>
      </div>
    );
  }

  if (!currentTrial) return null;

  const scoreButtonsDisabled = currentTrial.source === 'digital' && playCount === 0;

  return (
    <div className="fixed inset-0 z-[700] flex min-h-[100dvh] flex-col overflow-hidden bg-slate-950 text-white">
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-3 py-3 shadow-lg">
        <button onClick={() => { stopMedia(); onClose(); }} className="rounded-full border border-slate-700 bg-slate-800 p-2.5 text-slate-300">
          <ArrowLeft size={21} />
        </button>
        <div className="min-w-0 px-3 text-center">
          <h1 className="truncate text-sm font-black sm:text-base">{title}</h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Deneme {Math.min(answeredCount + 1, 10)}/10 · {session.digitalCount} dijital + {session.teacherCount} öğretmen
          </p>
        </div>
        <div className="flex h-10 min-w-10 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-xs font-black text-blue-300">
          {correctCount}
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-y-auto p-4">
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4">
          <div className={twMerge(
            'rounded-2xl border px-4 py-3 text-center',
            currentTrial.source === 'digital'
              ? 'border-blue-500/25 bg-blue-500/10 text-blue-200'
              : 'border-purple-500/25 bg-purple-500/10 text-purple-200',
          )}>
            <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider">
              {currentTrial.source === 'digital' ? <Volume2 size={16} /> : <ClipboardCheck size={16} />}
              {currentTrial.source === 'digital' ? 'Dijital sunum' : 'Öğretmen sunumu'}
            </div>
          </div>

          {currentTrial.source === 'digital' ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl">
              <button
                type="button"
                onClick={playDigitalTrial}
                disabled={isPlaying || playCount >= 2}
                aria-label={playCount === 0 ? 'Videoyu oynat' : 'Videoyu bir kez daha oynat'}
                className="relative aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-slate-700 bg-black text-left shadow-lg disabled:cursor-default"
              >
                <video
                  key={currentTrial.videoUrl}
                  ref={videoRef}
                  src={currentTrial.videoUrl}
                  muted
                  playsInline
                  preload="auto"
                  onLoadedData={(event) => {
                    if (event.currentTarget.currentTime === 0 && event.currentTarget.duration > 0.05) {
                      event.currentTarget.currentTime = 0.01;
                    }
                  }}
                  className="pointer-events-none h-full w-full object-cover"
                />
                <audio
                  key={currentTrial.audioUrl}
                  ref={audioRef}
                  src={currentTrial.audioUrl}
                  preload="auto"
                  onEnded={() => {
                    if (videoRef.current) {
                      videoRef.current.pause();
                      videoRef.current.currentTime = 0.01;
                    }
                    setIsPlaying(false);
                  }}
                />
              </button>
              <button
                type="button"
                onClick={playDigitalTrial}
                disabled={isPlaying || playCount >= 2}
                className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-blue-400/30 bg-blue-500/10 px-5 py-2 text-sm font-bold text-blue-200 transition hover:bg-blue-500/20 active:scale-95 disabled:cursor-default disabled:border-slate-700 disabled:bg-slate-800/60 disabled:text-slate-500"
              >
                {isPlaying ? (
                  <><Loader2 className="animate-spin" size={17} /> Oynatılıyor</>
                ) : playCount === 0 ? (
                  <><Play size={17} /> Oynat</>
                ) : playCount === 1 ? (
                  <><RotateCcw size={16} /> Bir kez daha oynat</>
                ) : (
                  <><CheckCircle2 size={16} /> Tekrar kullanıldı</>
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-purple-500/20 bg-slate-900/70 p-6 text-center shadow-xl">
              <p className="mb-3 text-sm font-semibold text-slate-400">Öğrencinin dikkatini çekin ve model olun:</p>
              <div className="rounded-2xl border-2 border-purple-400 bg-white px-8 py-6 text-slate-900 shadow-lg">
                <span className="block text-sm font-bold text-purple-700">SÖYLE</span>
                <span className="mt-1 block text-5xl font-black tracking-wide">{currentTrial.label}</span>
              </div>
            </div>
          )}

          <p className="text-center text-xs font-medium text-slate-400">Modelden sonra 3–5 saniye bekleyin.</p>

          <button
            onClick={changeTrial}
            disabled={!canChange}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm font-bold text-amber-300 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
          >
            <RefreshCw size={17} /> DEĞİŞTİR · PUANA ETKİ ETMEZ
          </button>

          <div className="grid grid-cols-2 gap-3 pb-2">
            <button
              onClick={() => recordResponse(false)}
              disabled={scoreButtonsDisabled}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-red-600 px-3 py-3 font-black shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
            >
              <XCircle size={22} /> SÖYLEMEDİ
            </button>
            <button
              onClick={() => recordResponse(true)}
              disabled={scoreButtonsDisabled}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 py-3 font-black shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
            >
              <CheckCircle2 size={22} /> SÖYLEDİ
            </button>
          </div>
        </div>
      </main>

      {finished && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-5">
          <div className="w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-900 p-6 text-center shadow-2xl">
            <ClipboardCheck className="mx-auto mb-4 text-blue-400" size={52} />
            <h2 className="text-2xl font-black">Değerlendirme tamamlandı</h2>
            <p className="mt-3 text-lg font-bold text-slate-300">{correctCount}/10 · %{correctCount * 10}</p>
            <p className="mt-1 text-sm text-slate-400">
              {correctCount >= 8 ? `Bu ${setName} seti geçildi.` : `Bu ${setName} seti henüz geçilemedi.`}
            </p>
            {completionTarget && (
              <div className="mt-4 rounded-2xl border border-blue-500/25 bg-blue-500/10 px-4 py-3">
                <p className="text-xs font-semibold text-blue-200">Kazanım ilerlemesi</p>
                <p className="mt-1 text-xl font-black text-white">
                  {Math.min(
                    completionTarget,
                    new Set([
                      ...masteredLabels.map(simpleText),
                      ...(correctCount >= 8 ? correctLabels.map(simpleText) : []),
                    ]).size,
                  )}/{completionTarget} {kind === 'word' ? 'sözcük' : 'farklı ses'}
                </p>
              </div>
            )}
            <button
              onClick={saveAndExit}
              disabled={isSaving}
              className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-black shadow-lg disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
              {isSaving ? 'KAYDEDİLİYOR' : 'KAYDET VE ÇIK'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
