import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  RefreshCw,
  RotateCcw,
  Volume2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';

type AssessmentKind = 'sound' | 'syllable';
type TrialSource = 'digital' | 'teacher';

interface GameProps {
  kind: AssessmentKind;
  title: string;
  onClose: () => void;
  onComplete: (success: boolean) => void | Promise<void>;
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

const SOUND_TEACHER_POOL = [
  'A', 'E', 'I', 'İ', 'O', 'Ö', 'U', 'Ü',
  'M', 'P', 'B', 'F', 'V', 'S', 'Z', 'Ş', 'J', 'L', 'R', 'N', 'K', 'G', 'T', 'D', 'Ç', 'C', 'H', 'Y',
  'aaa', 'eee', 'iii', 'ooo', 'uuu', 'mmm', 'sss', 'zzz', 'şşş', 'fff', 'vvv', 'rrr', 'nnn',
  'a-a-a', 'o-o-o', 'u-u-u', 'm-m-m', 'p-p-p', 'b-b-b',
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
};

const createTeacherTrials = (kind: AssessmentKind, digitalLabels: string[]) => {
  const digitalKeys = new Set(digitalLabels.map(simpleText));
  const usedKeys = new Set<string>();
  const pool = kind === 'sound' ? SOUND_TEACHER_POOL : SYLLABLE_TEACHER_POOL;
  return shuffle(pool)
    .filter(label => {
      const key = simpleText(label);
      if (digitalKeys.has(key) || usedKeys.has(key)) return false;
      usedKeys.add(key);
      return true;
    })
    .map(label => ({
      id: `teacher-${kind}-${simpleText(label)}`,
      label,
      source: 'teacher' as const,
    }));
};

export default function SozelTaklitAssessment({ kind, title, onClose, onComplete }: GameProps) {
  const digitalPool = kind === 'sound' ? DIGITAL_ASSETS.soundAssets : DIGITAL_ASSETS.syllableAssets;
  const requiredDigitalCount = 6;

  const session = useMemo(() => {
    const shuffledDigital = shuffle(digitalPool);
    const selectedDigital = shuffledDigital.slice(0, requiredDigitalCount).map(asset => ({
      ...asset,
      source: 'digital' as const,
    }));
    const teacherPool = createTeacherTrials(kind, digitalPool.map(item => item.label));
    const selectedTeacher = teacherPool.slice(0, 4);

    return {
      trials: shuffle<Trial>([...selectedDigital, ...selectedTeacher]),
      digitalReserve: shuffledDigital.slice(requiredDigitalCount).map(asset => ({
        ...asset,
        source: 'digital' as const,
      })),
      teacherReserve: teacherPool.slice(4),
    };
  }, [kind, digitalPool]);

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

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrial = trials[trialIndex];
  const hasEnoughDigitalAssets = digitalPool.length >= requiredDigitalCount;
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
      await onComplete(correctCount >= 8);
    } finally {
      setIsSaving(false);
    }
  };

  if (!hasEnoughDigitalAssets) {
    return (
      <div className="fixed inset-0 z-[700] flex min-h-[100dvh] items-center justify-center bg-slate-950 p-5 text-white">
        <div className="w-full max-w-md rounded-3xl border border-amber-500/30 bg-slate-900 p-6 text-center shadow-2xl">
          <Volume2 className="mx-auto mb-4 text-amber-400" size={48} />
          <h2 className="mb-2 text-xl font-black">Dijital dosyalar eksik</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            {title} için en az 6 eşleşen MP4 ve MP3 dosyası bulunmalıdır. Şu anda {digitalPool.length} eşleşen çift algılandı.
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
          <p className="mt-0.5 text-xs text-slate-400">Deneme {Math.min(answeredCount + 1, 10)}/10 · 6 dijital + 4 öğretmen</p>
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
              <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-black">
                <video
                  key={currentTrial.videoUrl}
                  ref={videoRef}
                  src={currentTrial.videoUrl}
                  muted
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
                <audio
                  key={currentTrial.audioUrl}
                  ref={audioRef}
                  src={currentTrial.audioUrl}
                  preload="auto"
                  onEnded={() => {
                    if (videoRef.current) videoRef.current.pause();
                    setIsPlaying(false);
                  }}
                />
              </div>

              <button
                onClick={playDigitalTrial}
                disabled={isPlaying || playCount >= 2}
                className="mt-5 flex min-h-14 w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-black shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                {isPlaying ? (
                  <><Loader2 className="animate-spin" size={20} /> OYNATILIYOR</>
                ) : playCount === 0 ? (
                  <><Volume2 size={20} /> OYNAT</>
                ) : playCount === 1 ? (
                  <><RotateCcw size={20} /> TEKRAR OYNAT · 1 KEZ</>
                ) : (
                  <><RotateCcw size={20} /> TEKRAR KULLANILDI</>
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
            <p className="mt-1 text-sm text-slate-400">Geçme ölçütü: en az 8 doğru</p>
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
