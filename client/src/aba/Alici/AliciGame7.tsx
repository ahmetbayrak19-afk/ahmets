import { useCallback, useEffect, useRef, useState } from 'react';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { ArrowLeft, CheckCircle2, Lock, Search, Sparkles, Trophy } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';

import { db } from '@/firebase';
import onaySes from '@/aba/yonerge/sesgorsel/onay.mp3';

import okulArkaPlan from './dedektif/canta1.png';
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
import cantaOkulKapama from './dedektif/canta-okul-kapama.webp';
import kitapOkulKapama from './dedektif/kitap-okul-kapama.webp';
import defterOkulKapama from './dedektif/defter-okul-kapama.webp';
import kalemOkulKapama from './dedektif/kalem-okul-kapama.webp';
import silgiOkulKapama from './dedektif/silgi-okul-kapama.webp';

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

type Point = readonly [number, number];
type GamePhase = 'intro' | 'target' | 'search' | 'outro';
type Screen = 'menu' | 'game' | 'result';
type GameId = 'school' | 'kitchen' | 'toy-room' | 'park';

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

interface GameConfig {
  id: GameId;
  title: string;
  description: string;
  emoji: string;
  thumbnail?: string;
  available: boolean;
  background?: string;
  introVideo?: string;
  outroVideo?: string;
  introAudio?: string;
  outroAudio?: string;
  sceneAlt?: string;
  trials?: readonly Trial[];
  coverImages?: Readonly<Record<string, string>>;
}

const SCHOOL_TRIALS: readonly Trial[] = [
  { id: 'canta', label: 'Çanta', image: canta, audio: cantaSes, hitArea: [[30, 43.8], [31.4, 36.6], [36.9, 35.7], [38.2, 54.5], [32.2, 56.2], [30.3, 52.6]] },
  { id: 'kitap', label: 'Kitap', image: kitap, audio: kitapSes, hitArea: [[60.6, 76.2], [54.6, 65.7], [61.4, 61], [64.8, 64], [67.1, 68.5], [67.2, 72]] },
  { id: 'defter', label: 'Defter', image: defter, audio: defterSes, hitArea: [[32.7, 81.4], [35.8, 78.6], [40.1, 80.8], [44.4, 86], [44.1, 90], [37.7, 96.2], [28.2, 87]] },
  { id: 'kalem', label: 'Kalem', image: kalem, audio: kalemSes, hitArea: [[7.1, 90.4], [23.4, 78.2], [25.7, 79.7], [26, 85], [9.2, 97], [7.1, 95.2]] },
  { id: 'silgi', label: 'Silgi', image: silgi, audio: silgiSes, hitArea: [[15.6, 70.8], [17.4, 66.6], [23.5, 66.8], [24.3, 69], [23.7, 73.5], [17, 75.3], [15.3, 73.3]] },
];

const KITCHEN_TRIALS: readonly Trial[] = [
  { id: 'un', label: 'Un', image: un, audio: unSes, hitArea: [[91.7, 7.2], [98.5, 6.5], [99.2, 23.8], [92, 24.1]] },
  { id: 'seker', label: 'Şeker', image: seker, audio: sekerSes, hitArea: [[6.1, 61.3], [7.2, 58.2], [12.8, 57.7], [15.3, 62.8], [15.1, 79.7], [7, 81]] },
  { id: 'tereyag', label: 'Tereyağı', image: tereyag, audio: tereyagSes, hitArea: [[88.6, 59.1], [90.2, 57.6], [94.6, 58.6], [95.5, 63.8], [93.5, 66.7], [88.7, 65.5]] },
  { id: 'yumurta', label: 'Yumurta', image: yumurta, audio: yumurtaSes, hitArea: [[7.2, 42.2], [8.1, 39.9], [10.2, 40], [11.3, 43.7], [10.8, 50.2], [7.5, 50.7]] },
  { id: 'sut', label: 'Süt', image: sut, audio: sutSes, hitArea: [[44.3, 29.3], [45.2, 27.7], [46.5, 27.8], [47.6, 31.4], [47.5, 40.2], [44.3, 40.3]] },
];

const KITCHEN_COVERS: Readonly<Record<string, string>> = {
  un: unKapama, seker: sekerKapama, tereyag: tereyagKapama, yumurta: yumurtaKapama, sut: sutKapama,
};

const SCHOOL_COVERS: Readonly<Record<string, string>> = {
  canta: cantaOkulKapama,
  kitap: kitapOkulKapama,
  defter: defterOkulKapama,
  kalem: kalemOkulKapama,
  silgi: silgiOkulKapama,
};

const GAMES: readonly GameConfig[] = [
  {
    id: 'school', title: 'Kayıp Okul Eşyaları', description: 'Çocuğun kaybolan okul eşyalarını bul.', emoji: '🎒', available: true,
    thumbnail: okulArkaPlan, background: okulArkaPlan, introVideo: cocuk1Video, outroVideo: cocuk2Video, introAudio: cocuk1Ses, outroAudio: cocuk2Ses,
    sceneAlt: 'Okul eşyalarının saklandığı karmaşık resim', trials: SCHOOL_TRIALS, coverImages: SCHOOL_COVERS,
  },
  {
    id: 'kitchen', title: 'Mutfak Dedektifi', description: 'Kek yapmak için gereken kayıp malzemeleri bul.', emoji: '🧁', available: true,
    thumbnail: mutfakArkaPlan, background: mutfakArkaPlan, introVideo: kadin1Video, outroVideo: kadin2Video, introAudio: kadin1Ses, outroAudio: kadin2Ses,
    sceneAlt: 'Kek malzemelerinin saklandığı karmaşık mutfak resmi', trials: KITCHEN_TRIALS, coverImages: KITCHEN_COVERS,
  },
  { id: 'toy-room', title: 'Oyuncak Odası Dedektifi', description: 'Dağınık odadaki kayıp oyuncakları bul.', emoji: '🧸', available: false },
  { id: 'park', title: 'Park Dedektifi', description: 'Parkta kaybolan eşyaları bul.', emoji: '🛝', available: false },
];

const lockLandscape = async () => {
  try {
    if ((window as any).AndroidOrientation) (window as any).AndroidOrientation.lockOrientation('landscape');
    else await ScreenOrientation.lock({ orientation: 'landscape' });
  } catch (error) { console.info('Yatay ekran kilidi kullanılamadı:', error); }
};

const unlockOrientation = async () => {
  try {
    if ((window as any).AndroidOrientation) (window as any).AndroidOrientation.lockOrientation('unlock');
    else await ScreenOrientation.unlock();
  } catch (error) { console.info('Ekran yönü serbest bırakılamadı:', error); }
};

const isInsidePolygon = (x: number, y: number, polygon: readonly Point[]) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

export default function AliciGame7({ studentId, onClose, onComplete }: AliciGame7Props) {
  const [screen, setScreen] = useState<Screen>('menu');
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [selectedGameId, setSelectedGameId] = useState<GameId | null>(null);
  const [trialIndex, setTrialIndex] = useState(0);
  const [tapPoint, setTapPoint] = useState<{ x: number; y: number } | null>(null);
  const [foundIds, setFoundIds] = useState<string[]>([]);
  const [completedGames, setCompletedGames] = useState<Partial<Record<GameId, number>>>({});
  const [studentName, setStudentName] = useState('Dedektif');
  const [studentPhoto, setStudentPhoto] = useState<string | null>(null);
  const [savingResult, setSavingResult] = useState(false);

  const sceneRef = useRef<HTMLImageElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioFallbackRef = useRef<number | null>(null);
  const transitionTimeoutRef = useRef<number | null>(null);
  const currentGameScoreRef = useRef(0);
  const trialLockedRef = useRef(false);

  const currentGame = GAMES.find((game) => game.id === selectedGameId) ?? null;
  const currentTrial = currentGame?.trials?.[trialIndex] ?? null;
  const completedCount = Object.keys(completedGames).length;
  const totalCorrect = Object.values(completedGames).reduce<number>((sum, score) => sum + (score ?? 0), 0);
  const assessmentPassed = completedCount >= 2 && totalCorrect >= 8;

  const stopAudio = useCallback(() => {
    if (audioFallbackRef.current !== null) window.clearTimeout(audioFallbackRef.current);
    audioFallbackRef.current = null;
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
      if (audioFallbackRef.current !== null) window.clearTimeout(audioFallbackRef.current);
      audioFallbackRef.current = null;
      onFinished();
    };
    const audio = new Audio(source);
    audio.loop = false;
    audio.preload = 'auto';
    audioRef.current = audio;
    audio.addEventListener('ended', finish, { once: true });
    audio.addEventListener('error', finish, { once: true });
    audioFallbackRef.current = window.setTimeout(finish, fallbackMs);
    audio.play().catch(() => {});
  }, [stopAudio]);

  useEffect(() => {
    lockLandscape();
    const loadStudent = async () => {
      const institutionId = localStorage.getItem('kazanim-takip-institution-id');
      if (!institutionId || !studentId) return;
      try {
        const snapshot = await getDoc(doc(db, 'institutions', institutionId, 'students', studentId));
        if (!snapshot.exists()) return;
        const data = snapshot.data();
        setStudentName(String(data.name || 'Dedektif'));
        setStudentPhoto(data.photoUrl ? String(data.photoUrl) : null);
      } catch (error) { console.error('Öğrenci bilgisi yüklenemedi:', error); }
    };
    loadStudent();
    return () => {
      stopAudio();
      if (transitionTimeoutRef.current !== null) window.clearTimeout(transitionTimeoutRef.current);
      unlockOrientation();
    };
  }, [studentId, stopAudio]);

  const finishCurrentGame = useCallback(() => {
    if (!selectedGameId) return;
    const updated = { ...completedGames, [selectedGameId]: currentGameScoreRef.current };
    setCompletedGames(updated);
    setSelectedGameId(null);
    setFoundIds([]);
    setTapPoint(null);
    setScreen(Object.keys(updated).length >= 2 ? 'result' : 'menu');
  }, [completedGames, selectedGameId]);

  useEffect(() => {
    if (screen !== 'game' || !currentGame || !currentTrial) return;
    if (phase === 'intro') playOnce(currentGame.introAudio!, () => setPhase('target'), 7000);
    else if (phase === 'target') playOnce(currentTrial.audio, () => setPhase('search'), 3000);
    else if (phase === 'outro') {
      playOnce(currentGame.outroAudio!, () => {
        transitionTimeoutRef.current = window.setTimeout(finishCurrentGame, 650);
      }, 7000);
    }
    return () => {
      stopAudio();
      if (transitionTimeoutRef.current !== null) window.clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    };
  }, [currentGame, currentTrial, finishCurrentGame, phase, playOnce, screen, stopAudio]);

  const startGame = (game: GameConfig) => {
    if (!game.available || completedGames[game.id] !== undefined) return;
    currentGameScoreRef.current = 0;
    trialLockedRef.current = false;
    setTrialIndex(0);
    setTapPoint(null);
    setFoundIds([]);
    setSelectedGameId(game.id);
    setPhase('intro');
    setScreen('game');
  };

  const moveToNextTrial = useCallback(() => {
    if (!currentGame?.trials) return;
    setTapPoint(null);
    trialLockedRef.current = false;
    if (trialIndex >= currentGame.trials.length - 1) setPhase('outro');
    else {
      setTrialIndex((previous) => previous + 1);
      setPhase('target');
    }
  }, [currentGame, trialIndex]);

  const resolveTrial = useCallback((correct: boolean) => {
    if (trialLockedRef.current || !currentTrial) return;
    trialLockedRef.current = true;
    if (correct) {
      currentGameScoreRef.current += 1;
      setFoundIds((previous) => previous.includes(currentTrial.id) ? previous : [...previous, currentTrial.id]);
    }
    playOnce(onaySes, moveToNextTrial, 1400);
  }, [currentTrial, moveToNextTrial, playOnce]);

  const handleScenePointer = (event: React.PointerEvent<HTMLImageElement>) => {
    if (phase !== 'search' || trialLockedRef.current || !currentTrial) return;
    const image = sceneRef.current;
    if (!image?.naturalWidth || !image.naturalHeight) return;
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
    setTapPoint({ x: event.clientX, y: event.clientY });
    resolveTrial(isInsidePolygon((localX / renderedWidth) * 100, (localY / renderedHeight) * 100, currentTrial.hitArea));
  };

  const handleClose = async () => {
    stopAudio();
    await unlockOrientation();
    onClose();
  };

  const saveAndClose = async () => {
    if (savingResult) return;
    setSavingResult(true);
    try {
      await onComplete?.(assessmentPassed);
      await unlockOrientation();
      onClose();
    } finally { setSavingResult(false); }
  };

  if (screen === 'menu') {
    return (
      <div className="fixed inset-0 z-[110] overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-3 text-white select-none">
        <button type="button" data-android-back onClick={handleClose} className="fixed left-3 top-3 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-slate-950/75 shadow-xl backdrop-blur-md" aria-label="Değerlendirmeden çık"><ArrowLeft size={24} /></button>
        <div className="mx-auto flex h-full w-full max-w-[1500px] items-center justify-center pt-12">
          <div className="grid w-full grid-cols-[180px_1fr] items-center gap-3 sm:grid-cols-[220px_1fr]">
            <section className="relative mx-auto flex h-[72vh] max-h-[430px] w-full flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border border-amber-300/30 bg-amber-100/10 p-3 shadow-2xl">
              <div className="h-[42vh] max-h-[260px] w-[90%] overflow-hidden rounded-[1.3rem] bg-slate-700 ring-4 ring-amber-200/40">
                {studentPhoto ? <img src={studentPhoto} alt={studentName} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-5xl font-black">{studentName.charAt(0).toLocaleUpperCase('tr-TR')}</div>}
              </div>
              <div className="mt-3 w-full rounded-xl bg-slate-950/80 px-2 py-2 text-center backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Baş Dedektif</p>
                <p className="truncate text-base font-black">{studentName}</p>
              </div>
            </section>
            <section>
              <div className="mb-3 text-center">
                <div className="mb-1 flex items-center justify-center gap-2"><Sparkles className="text-amber-300" size={22} /><h1 className="text-xl font-black sm:text-2xl">Dedektif Görevleri</h1></div>
                <p className="text-xs text-slate-300">İki görevi tamamla · 10 soruda en az 8 doğru</p>
                {completedCount === 1 && <p className="mt-1 text-sm font-bold text-emerald-300">Şimdi ikinci görevi seç!</p>}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {GAMES.map((game) => {
                  const score = completedGames[game.id];
                  const completed = score !== undefined;
                  return (
                    <button key={game.id} type="button" disabled={!game.available || completed} onClick={() => startGame(game)}
                      className={`relative flex h-[48vh] max-h-[300px] min-h-[185px] flex-col items-center justify-center rounded-xl border p-2 text-center shadow-xl transition ${completed ? 'border-emerald-400/20 bg-emerald-950/30 opacity-35' : game.available ? 'border-white/20 bg-white/10 hover:-translate-y-1 hover:border-amber-300/60 hover:bg-white/15 active:scale-[0.98]' : 'border-white/10 bg-slate-900/45 opacity-55'}`}>
                      {game.thumbnail ? (
                        <img src={game.thumbnail} alt="" aria-hidden="true" className="h-[19vh] max-h-[115px] w-full rounded-lg object-cover" />
                      ) : (
                        <span className="text-3xl sm:text-4xl">{game.emoji}</span>
                      )}
                      <h2 className="mt-2 text-xs font-black sm:text-sm">{game.title}</h2>
                      <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-slate-300 sm:text-xs">{game.description}</p>
                      {completed && <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-1 text-[11px] font-black"><CheckCircle2 size={13} /> {score}/5</span>}
                      {!game.available && <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-slate-700 px-2 py-1 text-[11px] font-bold"><Lock size={12} /> Yakında</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'result') {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-5 text-white select-none">
        <div className={`w-full max-w-lg rounded-[2rem] border p-7 text-center shadow-2xl ${assessmentPassed ? 'border-emerald-400/40 bg-emerald-950/40' : 'border-rose-400/40 bg-rose-950/40'}`}>
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/10">{assessmentPassed ? <Trophy size={55} className="text-amber-300" /> : <Search size={52} className="text-rose-200" />}</div>
          <h1 className="text-3xl font-black">{assessmentPassed ? 'Kazanım Başarılı' : 'Kazanım Başarısız'}</h1>
          <p className="mt-3 text-lg font-bold">Toplam sonuç: {totalCorrect} / 10</p>
          <p className="mt-2 text-sm text-slate-300">{assessmentPassed ? 'İki dedektif görevinde en az 8 doğru tepki verdi.' : 'Başarı için iki görevde toplam en az 8 doğru tepki gerekir.'}</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {Object.entries(completedGames).map(([id, score]) => {
              const game = GAMES.find((item) => item.id === id);
              return <div key={id} className="rounded-xl bg-black/20 p-3"><p className="text-xs text-slate-300">{game?.title}</p><p className="text-xl font-black">{score}/5</p></div>;
            })}
          </div>
          <button type="button" onClick={saveAndClose} disabled={savingResult} className={`mt-6 w-full rounded-xl px-5 py-3 font-black shadow-lg disabled:opacity-60 ${assessmentPassed ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-rose-500 hover:bg-rose-400'}`}>{savingResult ? 'Kaydediliyor…' : 'Sonucu kaydet ve çık'}</button>
        </div>
      </div>
    );
  }

  if (!currentGame || !currentTrial) return null;

  return (
    <div className="fixed inset-0 z-[110] overflow-hidden bg-slate-900 text-white select-none">
      <img src={currentGame.background} alt="" aria-hidden="true" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover opacity-70 blur-sm" />
      <img ref={sceneRef} src={currentGame.background} alt={currentGame.sceneAlt} draggable={false} onPointerUp={handleScenePointer} className="absolute inset-0 h-full w-full touch-manipulation object-contain" />
      {foundIds.map((id) => currentGame.coverImages?.[id] ? <img key={id} src={currentGame.coverImages[id]} alt="" aria-hidden="true" draggable={false} className="pointer-events-none absolute inset-0 z-[5] h-full w-full object-contain" /> : null)}
      <button type="button" data-android-back onClick={handleClose} className="absolute left-3 top-3 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-slate-950/75 shadow-xl backdrop-blur-md" aria-label="Değerlendirmeden çık"><ArrowLeft size={24} /></button>
      {(phase === 'target' || phase === 'search') && (
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="absolute right-3 top-3 z-30 flex items-center gap-2 rounded-full border border-white/25 bg-slate-950/75 px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-md sm:text-sm"><Search size={17} className="text-cyan-300" />{trialIndex + 1} / {currentGame.trials!.length}</div>
          {phase === 'target' && (
            <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/35">
              <div className="flex min-w-[210px] items-center justify-center rounded-[2rem] border border-white/60 bg-white/95 px-8 py-5 shadow-2xl sm:min-w-[270px] sm:px-12 sm:py-7">
                <img src={currentTrial.image} alt={currentTrial.label} draggable={false} className="h-[35vh] max-h-52 w-[38vw] max-w-64 object-contain drop-shadow-xl" />
              </div>
            </motion.div>
          )}
          {tapPoint && <span className="fixed z-40 h-12 w-12 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border-4 border-cyan-300 bg-cyan-300/20" style={{ left: tapPoint.x, top: tapPoint.y }} />}
        </div>
      )}
      <AnimatePresence mode="wait">
        {(phase === 'intro' || phase === 'outro') && (
          <motion.div key={`${currentGame.id}-${phase}`} initial={{ y: '110%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '110%', opacity: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} className="pointer-events-none absolute inset-x-0 -bottom-[45vh] z-30 flex h-[145vh] items-end justify-center">
            <video src={phase === 'intro' ? currentGame.introVideo : currentGame.outroVideo} autoPlay muted playsInline preload="auto" className="h-[135vh] max-w-[88vw] object-contain object-bottom drop-shadow-[0_18px_28px_rgba(0,0,0,0.45)]" aria-label={phase === 'intro' ? 'Yardım isteyen kişi' : 'Teşekkür eden kişi'} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
