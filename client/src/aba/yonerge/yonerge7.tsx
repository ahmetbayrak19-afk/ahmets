import { useState, useEffect, useRef, useCallback } from 'react';
import { XCircle, Check, X, Trophy, Package, PlayCircle, MonitorSmartphone, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- GÖRSELLER (eşleme + dedektif + kıyafet) ---
import topImg from '@/aba/esle/top.png';
import kalemImg from '@/aba/esle/kalem.png';
import kitapImg from '@/aba/esle/kitap.png';
import anahtarImg from '@/aba/esle/anahtar.png';
import arabaImg from '@/aba/esle/araba.png';
import elmaImg from '@/aba/esle/elma.png';
import cicekImg from '@/aba/esle/cicek.png';
import saatImg from '@/aba/esle/saat.png';
import silgiImg from '@/aba/Alici/dedektif/silgi.png';
import defterImg from '@/aba/Alici/dedektif/defter.png';
import cantaImg from '@/aba/Alici/dedektif/canta.png';
import tarakImg from '@/aba/esle/grup/evesya/tarak.png';
import corapImg from '@/clothes/corap.jpg';

// --- GİRİŞ SESİ ---
import girisSes from './sesgorsel/yonerge31giris.mp3';

// --- DİJİTAL YÖNERGE SESLERİ ("X'i göster") — hepsi mevcut ---
import topugoster from './sesgorsel/topugoster.mp3';
import kalemigoster from './sesgorsel/kalemigoster.mp3';
import kitabıgoster from './sesgorsel/kitabıgoster.mp3';
import anahtarigoster from './sesgorsel/anahtarigoster.mp3';
import arabayigoster from './sesgorsel/arabayigoster.mp3';
import elmayigoster from './sesgorsel/elmayigoster.mp3';
import cicegigoster from './sesgorsel/cicegigoster.mp3';
import corabigoster from './sesgorsel/corabigoster.mp3';
import saatigoster from './sesgorsel/saatigoster.mp3';
import silgiyigoster from './sesgorsel/silgiyigoster.mp3';
import defterigoster from './sesgorsel/defterigoster.mp3';
import cantayigoster from './sesgorsel/cantayigoster.mp3';
import taragigoster from './sesgorsel/taragigoster.mp3';
import bebegigoster from './sesgorsel/bebegigoster.mp3';
import bardagigoster from './sesgorsel/bardagigoster.mp3';
import kasigigoster from './sesgorsel/kasigigoster.mp3';
import makasigoster from './sesgorsel/makasigoster.mp3';
import cetveligoster from './sesgorsel/cetveligoster.mp3';
import boyayigoster from './sesgorsel/boyayigoster.mp3';
import fircayigoster from './sesgorsel/fircayigoster.mp3';
import kalemtrasigoster from './sesgorsel/kalemtrasigoster.mp3';
import mendiligoster from './sesgorsel/mendiligoster.mp3';
import sungerigoster from './sesgorsel/sungerigoster.mp3';
import yapistiriciyigoster from './sesgorsel/yapistiriciyigoster.mp3';
import ziligoster from './sesgorsel/ziligoster.mp3';

/** Nesne id → dijital "göster" sesi (havuzdaki her nesnenin sesi var) */
const INSTRUCTION_SOUNDS: Record<string, string> = {
  top: topugoster,
  kalem: kalemigoster,
  kitap: kitabıgoster,
  anahtar: anahtarigoster,
  araba: arabayigoster,
  elma: elmayigoster,
  cicek: cicegigoster,
  corap: corabigoster,
  saat: saatigoster,
  silgi: silgiyigoster,
  defter: defterigoster,
  canta: cantayigoster,
  tarak: taragigoster,
  bebek: bebegigoster,
  bardak: bardagigoster,
  kasik: kasigigoster,
  makas: makasigoster,
  cetvel: cetveligoster,
  boya: boyayigoster,
  firca: fircayigoster,
  kalemtras: kalemtrasigoster,
  mendil: mendiligoster,
  sunger: sungerigoster,
  yapistirici: yapistiriciyigoster,
  zil: ziligoster,
};

// --- ÇALIŞMA MODU SESLERİ (esle/ses) — değerlendirmede ÇALINMAZ ---
import aferin1 from '@/aba/esle/ses/aferin1.mp3';
import aferin2 from '@/aba/esle/ses/aferin2.mp3';
import bravo from '@/aba/esle/ses/bravo.mp3';
import esledinbravo from '@/aba/esle/ses/esledinbravo.mp3';
import harika1 from '@/aba/esle/ses/harika1.mp3';
import harika2 from '@/aba/esle/ses/harika2.mp3';
import tekrardene1 from '@/aba/esle/ses/tekrardene1.mp3';
import tekrardene2 from '@/aba/esle/ses/tekrardene2.mp3';

const POSITIVE_SOUNDS = [aferin1, aferin2, bravo, esledinbravo, harika1, harika2];
const NEGATIVE_SOUNDS = [tekrardene1, tekrardene2];

// --- DEĞERLENDİRME NÖTR GEÇİŞ SESLERİ (arada bir, rastgele) ---
import devametNotr from '@/aba/esle/ses/devamet notr.mp3';
import devamet2Notr from '@/aba/esle/ses/devamet2 notr.mp3';
import simdisiradakiNotr from '@/aba/esle/ses/simdisiradaki notr.mp3';

const NEUTRAL_SOUNDS = [devametNotr, devamet2Notr, simdisiradakiNotr];

/** Nötr ses çalma olasılığı (~%30) */
const NEUTRAL_CHANCE = 0.3;

export interface NesneDef {
  id: string;
  name: string;
  img?: string;
  emoji?: string;
}

/**
 * 25 nesne — hepsinin "göster" sesi var.
 * Sesi olmayan nesneler havuza alınmaz (metinde de geçmez).
 * Görseli olmayanlar emoji ile gösterilir; dijitalde yine bu 25 arasından sorulur.
 */
const OBJECT_POOL: NesneDef[] = [
  { id: 'top', name: 'Top', img: topImg },
  { id: 'kalem', name: 'Kalem', img: kalemImg },
  { id: 'kitap', name: 'Kitap', img: kitapImg },
  { id: 'anahtar', name: 'Anahtar', img: anahtarImg },
  { id: 'araba', name: 'Araba', img: arabaImg },
  { id: 'elma', name: 'Elma', img: elmaImg },
  { id: 'cicek', name: 'Çiçek', img: cicekImg },
  { id: 'corap', name: 'Çorap', img: corapImg },
  { id: 'saat', name: 'Saat', img: saatImg },
  { id: 'silgi', name: 'Silgi', img: silgiImg },
  { id: 'defter', name: 'Defter', img: defterImg },
  { id: 'canta', name: 'Çanta', img: cantaImg },
  { id: 'tarak', name: 'Tarak', img: tarakImg },
  { id: 'bebek', name: 'Bebek', emoji: '🧸' },
  { id: 'bardak', name: 'Bardak', emoji: '🥛' },
  { id: 'kasik', name: 'Kaşık', emoji: '🥄' },
  { id: 'makas', name: 'Makas', emoji: '✂️' },
  { id: 'cetvel', name: 'Cetvel', emoji: '📏' },
  { id: 'boya', name: 'Boya', emoji: '🎨' },
  { id: 'firca', name: 'Fırça', emoji: '🖌️' },
  { id: 'kalemtras', name: 'Kalemtraş', emoji: '✏️' },
  { id: 'mendil', name: 'Mendil', emoji: '🧻' },
  { id: 'sunger', name: 'Sünger', emoji: '🧽' },
  { id: 'yapistirici', name: 'Yapıştırıcı', emoji: '🧴' },
  { id: 'zil', name: 'Zil', emoji: '🔔' },
];

interface Yonerge7Props {
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

type Phase = 'prep' | 'teacher' | 'digital' | 'result';

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => 0.5 - Math.random());
}

/** Öğretmen: "Elma ver" | Dijital: "Top göster" */
function instructionText(name: string, action: 'ver' | 'göster') {
  return `${name} ${action}`;
}

/** Çalışma modu için (değerlendirmede kullanılmaz) */
function playPracticeFeedback(correct: boolean) {
  const pool = correct ? POSITIVE_SOUNDS : NEGATIVE_SOUNDS;
  const src = pool[Math.floor(Math.random() * pool.length)];
  const a = new Audio(src);
  a.volume = 1;
  a.play().catch(() => {});
}

/** Değerlendirme: ~%30 nötr ses, aksi halde sessiz. Aferin/tekrar dene YOK. */
function playAssessmentTransition() {
  if (Math.random() > NEUTRAL_CHANCE) return;
  const src = NEUTRAL_SOUNDS[Math.floor(Math.random() * NEUTRAL_SOUNDS.length)];
  const a = new Audio(src);
  a.volume = 1;
  a.play().catch(() => {});
}

function NesneCard({
  item,
  onClick,
  selected,
  large,
  feedback,
}: {
  item: NesneDef;
  onClick?: () => void;
  selected?: boolean;
  large?: boolean;
  feedback?: 'correct' | 'wrong' | null;
}) {
  let borderCls = selected
    ? 'border-blue-400 ring-2 ring-blue-500/40 '
    : 'border-slate-700 hover:border-slate-500 ';
  if (feedback === 'correct') borderCls = 'border-green-400 ring-2 ring-green-500/50 bg-green-900/30 ';
  if (feedback === 'wrong') borderCls = 'border-red-400 ring-2 ring-red-500/50 bg-red-900/30 ';

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        `flex flex-col items-center justify-center rounded-2xl border-2 bg-slate-800/80 transition-all active:scale-95 overflow-hidden ` +
        borderCls +
        (large ? 'p-3 min-h-[110px]' : 'p-2 min-h-[90px]') +
        (onClick ? 'cursor-pointer' : 'cursor-default')
      }
    >
      {item.img ? (
        <img
          src={item.img}
          alt={item.name}
          className={large ? 'w-16 h-16 object-contain mb-1' : 'w-12 h-12 object-contain mb-1'}
          draggable={false}
        />
      ) : (
        <span className={large ? 'text-4xl mb-1' : 'text-3xl mb-1'}>{item.emoji || '📦'}</span>
      )}
      <span className="text-[11px] font-bold text-slate-200 text-center leading-tight">{item.name}</span>
    </button>
  );
}

export default function Yonerge7({
  itemCode = 'YTB 3.1',
  itemText = 'Altı veya Daha Fazla Nesne Arasından Söyleneni Verme',
  onClose,
  onComplete,
}: Yonerge7Props) {
  const [selected, setSelected] = useState<NesneDef[]>(() => shuffle(OBJECT_POOL).slice(0, 10));
  const [trialTargets, setTrialTargets] = useState<NesneDef[]>([]);
  const [phase, setPhase] = useState<Phase>('prep');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [digitalOptions, setDigitalOptions] = useState<NesneDef[]>([]);
  const [locked, setLocked] = useState(false);
  const [tapFeedback, setTapFeedback] = useState<{ id: string; type: 'correct' | 'wrong' } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const instructionAudioRef = useRef<HTMLAudioElement | null>(null);

  // Giriş sesi (hazırlık)
  useEffect(() => {
    if (phase !== 'prep') return;
    const a = new Audio(girisSes);
    audioRef.current = a;
    a.volume = 1;
    a.play().catch(() => {});
    return () => {
      a.pause();
      a.currentTime = 0;
    };
  }, [phase]);

  // Dijital: her hedefte yönerge sesi (havuzdaki her id için ses garantili)
  useEffect(() => {
    if (phase !== 'digital') return;
    const target = trialTargets[currentIndex];
    if (!target) return;

    if (instructionAudioRef.current) {
      instructionAudioRef.current.pause();
      instructionAudioRef.current.currentTime = 0;
    }

    const src = INSTRUCTION_SOUNDS[target.id];
    if (!src) return;

    const a = new Audio(src);
    instructionAudioRef.current = a;
    a.volume = 1;
    a.play().catch(() => {});

    return () => {
      a.pause();
      a.currentTime = 0;
    };
  }, [phase, currentIndex, trialTargets]);

  const stopIntro = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const stopInstruction = () => {
    if (instructionAudioRef.current) {
      instructionAudioRef.current.pause();
      instructionAudioRef.current.currentTime = 0;
    }
  };

  const replaceObject = (index: number) => {
    const currentIds = new Set(selected.map((s) => s.id));
    const alternatives = OBJECT_POOL.filter((o) => !currentIds.has(o.id));
    if (alternatives.length === 0) return;
    const next = alternatives[Math.floor(Math.random() * alternatives.length)];
    setSelected((prev) => {
      const copy = [...prev];
      copy[index] = next;
      return copy;
    });
  };

  const prepareDigitalOptions = (target: NesneDef, pool: NesneDef[]) => {
    const distractors = shuffle(pool.filter((o) => o.id !== target.id)).slice(0, 5);
    setDigitalOptions(shuffle([target, ...distractors]));
  };

  const startSession = (mode: 'teacher' | 'digital') => {
    stopIntro();
    const trials = shuffle(selected);
    setTrialTargets(trials);
    setCurrentIndex(0);
    setScore(0);
    setLocked(false);
    setTapFeedback(null);
    if (mode === 'digital') {
      prepareDigitalOptions(trials[0], trials);
    }
    setPhase(mode);
  };

  const finishIfNeeded = useCallback((newScore: number, newIndex: number) => {
    if (newIndex >= 10) {
      setPhase('result');
      if (newScore >= 8) {
        confetti({ particleCount: 250, spread: 90, origin: { y: 0.6 } });
      }
      return true;
    }
    return false;
  }, []);

  const handleAssess = (correct: boolean) => {
    if (locked) return;
    const newScore = score + (correct ? 1 : 0);
    const next = currentIndex + 1;
    setScore(newScore);
    playAssessmentTransition();
    if (finishIfNeeded(newScore, next)) return;
    setCurrentIndex(next);
  };

  const handleDigitalTap = (item: NesneDef) => {
    if (locked || phase !== 'digital') return;
    setLocked(true);
    stopInstruction();
    const target = trialTargets[currentIndex];
    const correct = item.id === target.id;
    const newScore = score + (correct ? 1 : 0);
    const next = currentIndex + 1;
    setScore(newScore);

    setTapFeedback({ id: item.id, type: correct ? 'correct' : 'wrong' });
    playAssessmentTransition();

    setTimeout(() => {
      setTapFeedback(null);
      if (finishIfNeeded(newScore, next)) return;
      setCurrentIndex(next);
      prepareDigitalOptions(trialTargets[next], trialTargets);
      setLocked(false);
    }, 700);
  };

  const currentTarget = trialTargets[currentIndex];

  return (
    <div className="fixed inset-0 h-[100dvh] w-screen z-[100] flex flex-col bg-slate-950 text-white font-sans select-none">
      <div className="shrink-0 p-4 landscape:py-2 landscape:px-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur-md relative z-10">
        <button
          onClick={() => {
            stopIntro();
            stopInstruction();
            onClose();
          }}
          className="p-2 landscape:p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
        >
          <XCircle className="w-7 h-7 landscape:w-6 landscape:h-6" />
        </button>
        <div className="text-center flex flex-col items-center px-2">
          <h2 className="text-sm sm:text-lg landscape:text-sm font-bold truncate max-w-[260px] sm:max-w-md text-slate-100">
            {itemCode} — {itemText}
          </h2>
          <p className="text-[10px] landscape:text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-1">
            {phase === 'prep' && 'HAZIRLIK'}
            {phase === 'teacher' && `ÖĞRETMEN · ${currentIndex + 1} / 10`}
            {phase === 'digital' && `DİJİTAL · ${currentIndex + 1} / 10`}
            {phase === 'result' && 'SONUÇ'}
          </p>
        </div>
        <div className="w-10 landscape:w-8" />
      </div>

      <div className="flex-1 relative flex flex-col items-center justify-center p-3 sm:p-4 overflow-y-auto bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
        {phase === 'prep' && (
          <div className="w-full max-w-2xl animate-in zoom-in-95 duration-300 pb-6">
            <div className="text-center mb-4">
              <Package size={48} className="mx-auto text-blue-500 mb-3 drop-shadow-[0_0_12px_rgba(59,130,246,0.45)]" />
              <h1 className="text-2xl font-black mb-2">Nesne Hazırlığı</h1>
              <p className="text-slate-400 text-sm leading-relaxed px-2">
                Aşağıdaki <span className="text-blue-300 font-semibold">10 nesne</span> bu oturumda sorulacak.
                Masaya hepsini koymanız gerekmez; <span className="text-white font-semibold">6 nesne yeterlidir</span>.
                İstediğiniz gibi dizebilirsiniz — önemli olan bu 10 nesneden sorulacağını bilmenizdir.
              </p>
              <p className="text-slate-500 text-xs mt-2">
                Elinizde olmayan bir nesneye dokunun; listede olmayan başka bir nesne gelir.
              </p>
            </div>

            <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-6">
              {selected.map((item, i) => (
                <div key={`${item.id}-${i}`} className="relative">
                  <NesneCard item={item} onClick={() => replaceObject(i)} />
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-700 border border-slate-500 text-[9px] flex items-center justify-center text-slate-300">
                    <RefreshCw size={10} />
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => startSession('teacher')}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-blue-900/40 active:scale-95 transition-all"
              >
                <PlayCircle size={22} /> Nesnelerim hazır — Başla
              </button>
              <button
                onClick={() => startSession('digital')}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 border border-slate-600 active:scale-95 transition-all"
              >
                <MonitorSmartphone size={22} /> Dijital yardımcı moda geç
              </button>
            </div>
          </div>
        )}

        {/* Öğretmen: sadece yazı — öğretmen soruyu söyler */}
        {phase === 'teacher' && currentTarget && (
          <div className="w-full max-w-3xl flex flex-col items-center animate-in slide-in-from-right-8 duration-300">
            <div className="w-full bg-slate-800/60 border-2 border-slate-700 rounded-[2rem] p-8 md:p-12 flex flex-col items-center shadow-2xl min-h-[220px]">
              <span className="text-blue-400 font-bold tracking-widest uppercase mb-4 text-sm">
                Öğrenciye söyleyin
              </span>
              <h1 className="text-3xl md:text-5xl font-black text-center text-white mb-6">
                "{instructionText(currentTarget.name, 'ver')}"
              </h1>
              <div className="w-28 h-28 rounded-2xl bg-slate-900/80 border border-slate-600 flex items-center justify-center">
                {currentTarget.img ? (
                  <img src={currentTarget.img} alt={currentTarget.name} className="w-20 h-20 object-contain" />
                ) : (
                  <span className="text-5xl">{currentTarget.emoji}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dijital: ses + yazı; seçenekler yine bu 25 arasından */}
        {phase === 'digital' && currentTarget && (
          <div className="w-full max-w-lg flex flex-col items-center animate-in fade-in duration-300">
            <p className="text-blue-300 font-bold text-lg mb-4 text-center">
              {instructionText(currentTarget.name, 'göster')}
            </p>
            <div className="grid grid-cols-3 gap-3 w-full">
              {digitalOptions.map((item) => (
                <NesneCard
                  key={item.id}
                  item={item}
                  large
                  feedback={tapFeedback?.id === item.id ? tapFeedback.type : null}
                  onClick={() => handleDigitalTap(item)}
                />
              ))}
            </div>
            <p className="text-slate-500 text-xs mt-4 text-center">
              Değerlendirme — övgü sesi yok. Doğru nesneye dokunun.
            </p>
          </div>
        )}

        {phase === 'result' && (
          <div className="flex flex-col items-center text-center p-8 bg-slate-900/90 rounded-3xl border border-slate-700 shadow-2xl max-w-xl animate-in zoom-in-95 duration-500">
            <Trophy
              size={72}
              className={
                score >= 8
                  ? 'text-yellow-500 mb-5 animate-bounce drop-shadow-[0_0_20px_rgba(234,179,8,0.4)]'
                  : 'text-slate-500 mb-5'
              }
            />
            <h1 className="text-3xl font-black mb-2">Değerlendirme Bitti!</h1>
            <p className="text-slate-400 mb-6 text-lg">
              Doğru: <span className="text-white font-black text-3xl mx-2">{score}</span> / 10
            </p>
            {score >= 8 ? (
              <div className="bg-green-500/10 text-green-400 border border-green-500/20 px-6 py-3 rounded-xl mb-8 font-bold flex items-center gap-2">
                <Check size={22} /> Kazanım başarıyla sağlandı!
              </div>
            ) : (
              <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-6 py-3 rounded-xl mb-8 font-bold flex items-center gap-2">
                <X size={22} /> Henüz yeterli bağımsızlık düzeyinde değil.
              </div>
            )}
            <button
              onClick={() => onComplete(score >= 8)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-4 rounded-xl font-bold text-xl active:scale-95 shadow-xl shadow-blue-900/50 w-full sm:w-auto"
            >
              KAYDET VE ÇIK
            </button>
          </div>
        )}
      </div>

      {phase === 'teacher' && (
        <div className="shrink-0 p-5 pb-8 landscape:py-3 landscape:pb-4 bg-slate-900 border-t border-slate-800 flex items-stretch justify-center gap-3 relative z-10">
          <button
            onClick={() => handleAssess(false)}
            className="flex-1 max-w-[260px] flex flex-col landscape:flex-row items-center justify-center gap-2 p-4 landscape:p-3 bg-red-500/10 border border-red-500/30 rounded-2xl active:scale-95 transition-all text-red-500 hover:bg-red-500/20"
          >
            <X className="w-9 h-9 landscape:w-6 landscape:h-6" />
            <span className="text-sm font-bold uppercase tracking-wider">Yapamadı</span>
          </button>
          <button
            onClick={() => handleAssess(true)}
            className="flex-1 max-w-[260px] flex flex-col landscape:flex-row items-center justify-center gap-2 p-4 landscape:p-3 bg-green-500/10 border border-green-500/30 rounded-2xl active:scale-95 transition-all text-green-500 hover:bg-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]"
          >
            <Check className="w-9 h-9 landscape:w-6 landscape:h-6" />
            <span className="text-sm font-bold uppercase tracking-wider">Yaptı</span>
          </button>
        </div>
      )}
    </div>
  );
}
