import { useCallback, useEffect, useRef, useState } from 'react';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { ArrowLeft, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import cantaArkaPlan from './dedektif/canta1.png';
import cocuk1Video from './dedektif/cocuk1.webm';
import cocuk2Video from './dedektif/cocuk2.webm';
import cocuk1Ses from './dedektif/cocuk1ses.mp3';
import cocuk2Ses from './dedektif/cocuk2ses.mp3';

import canta from './dedektif/canta.webp';
import kitap from './dedektif/kitap.webp';
import defter from './dedektif/defter.webp';
import kalem from './dedektif/kalem.webp';
import silgi from './dedektif/silgi.webp';
import cantaSes from './dedektif/cantayibul.mp3';
import kitapSes from './dedektif/kitabibul.mp3';
import defterSes from './dedektif/defteribul.mp3';
import kalemSes from './dedektif/kalemibul.mp3';
import silgiSes from './dedektif/silgibul.mp3';
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

// canta1.png üzerindeki nesnelerin yüzdelik çokgenleri.
// Kalem ve silgi küçük olduğu için dokunma alanları biraz geniş tutuldu.
const TRIALS: readonly Trial[] = [
  {
    id: 'canta',
    label: 'Çanta',
    image: canta,
    audio: cantaSes,
    hitArea: [[30, 43.8], [31.4, 36.6], [36.9, 35.7], [38.2, 54.5], [32.2, 56.2], [30.3, 52.6]],
  },
  {
    id: 'kitap',
    label: 'Kitap',
    image: kitap,
    audio: kitapSes,
    hitArea: [[60.6, 76.2], [54.6, 65.7], [61.4, 61], [64.8, 64], [67.1, 68.5], [67.2, 72]],
  },
  {
    id: 'defter',
    label: 'Defter',
    image: defter,
    audio: defterSes,
    hitArea: [[32.7, 81.4], [35.8, 78.6], [40.1, 80.8], [44.4, 86], [44.1, 90], [37.7, 96.2], [28.2, 87]],
  },
  {
    id: 'kalem',
    label: 'Kalem',
    image: kalem,
    audio: kalemSes,
    hitArea: [[7.1, 90.4], [23.4, 78.2], [25.7, 79.7], [26, 85], [9.2, 97], [7.1, 95.2]],
  },
  {
    id: 'silgi',
    label: 'Silgi',
    image: silgi,
    audio: silgiSes,
    hitArea: [[15.6, 70.8], [17.4, 66.6], [23.5, 66.8], [24.3, 69], [23.7, 73.5], [17, 75.3], [15.3, 73.3]],
  },
];

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

    if (correct) correctCountRef.current += 1;
    playOnce(onaySes, moveToNextTrial, 1400);
  }, [moveToNextTrial, playOnce]);

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
      playOnce(cocuk1Ses, () => setPhase('target'), 7000);
    } else if (phase === 'target') {
      // Nesne, "... bul" yönergesi boyunca görünür ve ses bitince kaybolur.
      playOnce(currentTrial.audio, () => setPhase('search'), 3000);
    } else if (phase === 'outro') {
      playOnce(cocuk2Ses, () => setPhase('complete'), 7000);
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
        src={cantaArkaPlan}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover opacity-70 blur-sm"
      />

      <img
        ref={sceneRef}
        src={cantaArkaPlan}
        alt="Okul eşyalarının saklandığı karmaşık resim"
        draggable={false}
        onPointerUp={handleScenePointer}
        className="absolute inset-0 h-full w-full touch-manipulation object-contain"
      />

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
              src={phase === 'intro' ? cocuk1Video : cocuk2Video}
              autoPlay
              muted
              playsInline
              preload="auto"
              className="h-[88vh] max-w-[72vw] object-contain object-bottom drop-shadow-[0_18px_28px_rgba(0,0,0,0.45)]"
              aria-label={phase === 'intro' ? 'Yardım isteyen çocuk' : 'Teşekkür eden çocuk'}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
