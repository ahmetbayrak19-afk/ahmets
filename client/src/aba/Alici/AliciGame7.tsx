import { useCallback, useEffect, useRef, useState } from 'react';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { ArrowLeft, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import mutfakArkaPlan from './dedektif/mutfak.png';
import kadin1Video from './dedektif/kadin1.webm';
import kadin2Video from './dedektif/kadin2.webm';
import kadin1Ses from './dedektif/kadin1ses.mp3';
import kadin2Ses from './dedektif/kadin2ses.mp3';

import un from './dedektif/un.webp';
import seker from './dedektif/seker.webp';
import tereyag from './dedektif/tereyag.webp';
import yumurta from './dedektif/yumurta.webp';
import sut from './dedektif/sut.webp';
import unSes from './dedektif/unubul.mp3';
import sekerSes from './dedektif/sekeribul.mp3';
import tereyagSes from './dedektif/tereyagibul.mp3';
import yumurtaSes from './dedektif/yumurtayibul.mp3';
import sutSes from './dedektif/sutubul.mp3';
import unKapama from './dedektif/un-kapama.webp';
import sekerKapama from './dedektif/seker-kapama.webp';
import tereyagKapama from './dedektif/tereyag-kapama.webp';
import yumurtaKapama from './dedektif/yumurta-kapama.webp';
import sutKapama from './dedektif/sut-kapama.webp';
import onaySes from '@/aba/yonerge/sesgorsel/onay.mp3';

type Point = readonly [number, number];
type Phase = 'intro' | 'target' | 'search' | 'outro' | 'complete';

interface AliciGame7Props {
  studentId: string;
  onClose: () => void;
  onComplete?: (success: boolean) => void | Promise<void>;
}

interface Trial {
  id: string;
  label: string;
  image: string;
  audio: string;
  hitArea: readonly Point[];
}

// mutfak.png üzerindeki beş kayıp malzemenin yüzdelik çokgenleri.
// Küçük nesnelerin dokunma alanları çocukların daha rahat seçebilmesi için
// görsel sınırlarının biraz dışına taşırıldı.
const TRIALS: readonly Trial[] = [
  {
    id: 'un',
    label: 'Un',
    image: un,
    audio: unSes,
    hitArea: [[91.7, 7.2], [98.5, 6.5], [99.2, 23.8], [92, 24.1]],
  },
  {
    id: 'seker',
    label: 'Şeker',
    image: seker,
    audio: sekerSes,
    hitArea: [[6.1, 61.3], [7.2, 58.2], [12.8, 57.7], [15.3, 62.8], [15.1, 79.7], [7, 81]],
  },
  {
    id: 'tereyag',
    label: 'Tereyağı',
    image: tereyag,
    audio: tereyagSes,
    hitArea: [[88.6, 59.1], [90.2, 57.6], [94.6, 58.6], [95.5, 63.8], [93.5, 66.7], [88.7, 65.5]],
  },
  {
    id: 'yumurta',
    label: 'Yumurta',
    image: yumurta,
    audio: yumurtaSes,
    hitArea: [[7.2, 42.2], [8.1, 39.9], [10.2, 40], [11.3, 43.7], [10.8, 50.2], [7.5, 50.7]],
  },
  {
    id: 'sut',
    label: 'Süt',
    image: sut,
    audio: sutSes,
    hitArea: [[44.3, 29.3], [45.2, 27.7], [46.5, 27.8], [47.6, 31.4], [47.5, 40.2], [44.3, 40.3]],
  },
];

const COVER_IMAGES: Readonly<Record<string, string>> = {
  un: unKapama,
  seker: sekerKapama,
  tereyag: tereyagKapama,
  yumurta: yumurtaKapama,
  sut: sutKapama,
};

const lockLandscape = async () => {
  try {
    if ((window as any).AndroidOrientation) {
      (window as any).AndroidOrientation.lockOrientation('landscape');
    } else {
      await ScreenOrientation.lock({ orientation: 'landscape' });
    }
  } catch (error) {
    console.info('Yatay ekran kilidi kullanılamadı:', error);
  }
};

const unlockOrientation = async () => {
  try {
    if ((window as any).AndroidOrientation) {
      (window as any).AndroidOrientation.lockOrientation('unlock');
    } else {
      await ScreenOrientation.unlock();
    }
  } catch (error) {
    console.info('Ekran yönü serbest bırakılamadı:', error);
  }
};

const isInsidePolygon = (x: number, y: number, polygon: readonly Point[]) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const crosses = yi > y !== yj > y
      && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
};

export default function AliciGame7({ onClose, onComplete }: AliciGame7Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [trialIndex, setTrialIndex] = useState(0);
  const [tapPoint, setTapPoint] = useState<{ x: number; y: number } | null>(null);
  const [foundIds, setFoundIds] = useState<string[]>([]);

  const sceneRef = useRef<HTMLImageElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioFallbackRef = useRef<number | null>(null);
  const finishTimeoutRef = useRef<number | null>(null);
  const correctCountRef = useRef(0);
  const trialLockedRef = useRef(false);
  const completedRef = useRef(false);

  const currentTrial = TRIALS[trialIndex];

  const stopAudio = useCallback(() => {
    if (audioFallbackRef.current !== null) {
      window.clearTimeout(audioFallbackRef.current);
      audioFallbackRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, []);

  const playOnce = useCallback((source: string, onFinished: () => void, fallbackMs: number) => {
    stopAudio();
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      if (audioFallbackRef.current !== null) {
        window.clearTimeout(audioFallbackRef.current);
        audioFallbackRef.current = null;
      }
      onFinished();
    };

    const audio = new Audio(source);
    audio.loop = false;
    audio.preload = 'auto';
    audioRef.current = audio;
    audio.addEventListener('ended', finish, { once: true });
    audio.addEventListener('error', finish, { once: true });
    audioFallbackRef.current = window.setTimeout(finish, fallbackMs);
    audio.play().catch(() => {
      // Otomatik ses engellenirse görsel akış yedek süreyle devam eder.
    });
  }, [stopAudio]);

  const finishAssessment = useCallback(async () => {
    if (completedRef.current) return;
    completedRef.current = true;
    await onComplete?.(correctCountRef.current >= 4);
    await unlockOrientation();
    onClose();
  }, [onClose, onComplete]);

  const moveToNextTrial = useCallback(() => {
    setTapPoint(null);
    trialLockedRef.current = false;
    if (trialIndex >= TRIALS.length - 1) {
      setPhase('outro');
      return;
    }
    setTrialIndex((previous) => previous + 1);
    setPhase('target');
  }, [trialIndex]);

  const resolveTrial = useCallback((correct: boolean) => {
    if (trialLockedRef.current) return;
    trialLockedRef.current = true;

    if (correct) {
      correctCountRef.current += 1;
      setFoundIds((previous) => previous.includes(currentTrial.id)
        ? previous
        : [...previous, currentTrial.id]);
    }
    playOnce(onaySes, moveToNextTrial, 1400);
  }, [currentTrial.id, moveToNextTrial, playOnce]);

  useEffect(() => {
    lockLandscape();
    return () => {
      stopAudio();
      if (finishTimeoutRef.current !== null) window.clearTimeout(finishTimeoutRef.current);
      unlockOrientation();
    };
  }, [stopAudio]);

  useEffect(() => {
    if (phase === 'intro') {
      playOnce(kadin1Ses, () => setPhase('target'), 7000);
    } else if (phase === 'target') {
      // Nesne, "... bul" yönergesi boyunca görünür ve ses bitince kaybolur.
      playOnce(currentTrial.audio, () => setPhase('search'), 3000);
    } else if (phase === 'outro') {
      playOnce(kadin2Ses, () => setPhase('complete'), 7000);
    } else if (phase === 'complete') {
      // Çıkış karakterinin aşağı kayma animasyonu tamamlandıktan sonra kapat.
      finishTimeoutRef.current = window.setTimeout(finishAssessment, 650);
    }
    return () => {
      stopAudio();
      if (finishTimeoutRef.current !== null) {
        window.clearTimeout(finishTimeoutRef.current);
        finishTimeoutRef.current = null;
      }
    };
  }, [currentTrial.audio, finishAssessment, phase, playOnce, stopAudio]);

  const handleScenePointer = (event: React.PointerEvent<HTMLImageElement>) => {
    if (phase !== 'search' || trialLockedRef.current) return;
    const image = sceneRef.current;
    if (!image || !image.naturalWidth || !image.naturalHeight) return;

    const rect = image.getBoundingClientRect();
    const naturalRatio = image.naturalWidth / image.naturalHeight;
    const boxRatio = rect.width / rect.height;
    const renderedWidth = boxRatio > naturalRatio ? rect.height * naturalRatio : rect.width;
    const renderedHeight = boxRatio > naturalRatio ? rect.height : rect.width / naturalRatio;
    const offsetX = (rect.width - renderedWidth) / 2;
    const offsetY = (rect.height - renderedHeight) / 2;
    const localX = event.clientX - rect.left - offsetX;
    const localY = event.clientY - rect.top - offsetY;

    if (localX < 0 || localY < 0 || localX > renderedWidth || localY > renderedHeight) return;
    const xPercent = (localX / renderedWidth) * 100;
    const yPercent = (localY / renderedHeight) * 100;
    setTapPoint({ x: event.clientX, y: event.clientY });
    resolveTrial(isInsidePolygon(xPercent, yPercent, currentTrial.hitArea));
  };

  const handleClose = async () => {
    stopAudio();
    await unlockOrientation();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] overflow-hidden bg-slate-900 text-white select-none">
      <img
        src={mutfakArkaPlan}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover opacity-70 blur-sm"
      />

      <img
        ref={sceneRef}
        src={mutfakArkaPlan}
        alt="Kek malzemelerinin saklandığı karmaşık mutfak resmi"
        draggable={false}
        onPointerUp={handleScenePointer}
        className="absolute inset-0 h-full w-full touch-manipulation object-contain"
      />

      {foundIds.map((id) => (
        <img
          key={id}
          src={COVER_IMAGES[id]}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none absolute inset-0 z-[5] h-full w-full object-contain"
        />
      ))}

      <button
        type="button"
        data-android-back
        onClick={handleClose}
        className="absolute left-3 top-3 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-slate-950/75 shadow-xl backdrop-blur-md active:scale-95"
        aria-label="Değerlendirmeden çık"
      >
        <ArrowLeft size={24} />
      </button>

      {(phase === 'target' || phase === 'search') && (
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="pointer-events-none absolute right-3 top-3 z-30 flex items-center gap-2 rounded-full border border-white/25 bg-slate-950/75 px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-md sm:text-sm">
            <Search size={17} className="text-cyan-300" />
            {trialIndex + 1} / {TRIALS.length}
          </div>

          {phase === 'target' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-slate-950/35"
            >
              <div className="flex min-w-[210px] items-center justify-center rounded-[2rem] border border-white/60 bg-white/95 px-8 py-5 shadow-2xl sm:min-w-[270px] sm:px-12 sm:py-7">
                <img
                  src={currentTrial.image}
                  alt={currentTrial.label}
                  draggable={false}
                  className="h-[35vh] max-h-52 w-[38vw] max-w-64 object-contain drop-shadow-xl"
                />
              </div>
            </motion.div>
          )}

          {tapPoint && (
            <span
              className="pointer-events-none fixed z-40 h-12 w-12 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border-4 border-cyan-300 bg-cyan-300/20"
              style={{ left: tapPoint.x, top: tapPoint.y }}
            />
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {(phase === 'intro' || phase === 'outro') && (
          <motion.div
            key={phase}
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '110%', opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex h-full items-end justify-center"
          >
            <video
              src={phase === 'intro' ? kadin1Video : kadin2Video}
              autoPlay
              muted
              playsInline
              preload="auto"
              className="h-[88vh] max-w-[72vw] object-contain object-bottom drop-shadow-[0_18px_28px_rgba(0,0,0,0.45)]"
              aria-label={phase === 'intro' ? 'Kek malzemelerini bulmak için yardım isteyen kadın' : 'Teşekkür eden kadın'}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
