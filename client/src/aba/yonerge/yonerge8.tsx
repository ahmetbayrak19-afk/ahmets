import { useState, useEffect, useCallback } from 'react';
import {
  XCircle, Check, X, Trophy, Package, PlayCircle,
  RefreshCw, ListOrdered, Box
} from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Mevcut görseller ---
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

export interface NesneDef {
  id: string;
  name: string;
  img?: string;
  emoji?: string;
}

const OBJECTS: Record<string, NesneDef> = {
  top: { id: 'top', name: 'Top', img: topImg },
  kalem: { id: 'kalem', name: 'Kalem', img: kalemImg },
  kitap: { id: 'kitap', name: 'Kitap', img: kitapImg },
  anahtar: { id: 'anahtar', name: 'Anahtar', img: anahtarImg },
  araba: { id: 'araba', name: 'Araba', img: arabaImg },
  elma: { id: 'elma', name: 'Elma', img: elmaImg },
  cicek: { id: 'cicek', name: 'Çiçek', img: cicekImg },
  corap: { id: 'corap', name: 'Çorap', img: corapImg },
  saat: { id: 'saat', name: 'Saat', img: saatImg },
  silgi: { id: 'silgi', name: 'Silgi', img: silgiImg },
  defter: { id: 'defter', name: 'Defter', img: defterImg },
  canta: { id: 'canta', name: 'Çanta', img: cantaImg },
  tarak: { id: 'tarak', name: 'Tarak', img: tarakImg },
  bebek: { id: 'bebek', name: 'Bebek', emoji: '🧸' },
  bardak: { id: 'bardak', name: 'Bardak', emoji: '🥛' },
  kasik: { id: 'kasik', name: 'Kaşık', emoji: '🥄' },
  makas: { id: 'makas', name: 'Makas', emoji: '✂️' },
  cetvel: { id: 'cetvel', name: 'Cetvel', emoji: '📏' },
  boya: { id: 'boya', name: 'Boya', emoji: '🎨' },
  firca: { id: 'firca', name: 'Fırça', emoji: '🖌️' },
  mendil: { id: 'mendil', name: 'Mendil', emoji: '🧻' },
  sunger: { id: 'sunger', name: 'Sünger', emoji: '🧽' },
  zil: { id: 'zil', name: 'Zil', emoji: '🔔' },
  marakas: { id: 'marakas', name: 'Marakas', emoji: '🪇' },
  top_futbol: { id: 'top_futbol', name: 'Futbol topu', emoji: '⚽' },
};

export type TaskType = 'physical' | 'digital';

export interface SequentialTask {
  id: string;
  text: string;           // Öğretmenin söylediği / ekranda görünen yönerge
  type: TaskType;
  materials: string[];    // Malzeme listesi için
  /** Dijital: sırayla dokunulması gereken nesne id'leri */
  sequence?: string[];
  /** Dijital: grid'de gösterilecek ekstra distraktör id'leri (otomatik de doldurulur) */
  distractors?: string[];
}

/**
 * ≥30 bağımsız sıralı görev.
 * Kurallar:
 * - Her adım kendi içinde tamamlanmış / bağımsız
 * - "Al sonra tak" gibi zorunlu bağımlılık yok
 * - Dijital olanlarda sıra + ayırt etme (distraktör) var
 */
const TASK_POOL: SequentialTask[] = [
  // ——— FİZİKSEL (öğretmen gözlemler) ———
  { id: 'p01', text: 'Zıpla, sonra ellerini çırp', type: 'physical', materials: [] },
  { id: 'p02', text: 'Ellerini çırp, sonra zıpla', type: 'physical', materials: [] },
  { id: 'p03', text: 'Ayağa kalk, sonra otur', type: 'physical', materials: ['Sandalye'] },
  { id: 'p04', text: 'Otur, sonra ayağa kalk', type: 'physical', materials: ['Sandalye'] },
  { id: 'p05', text: 'Başını öne eğ, sonra doğrul', type: 'physical', materials: [] },
  { id: 'p06', text: 'Ellerini yukarı kaldır, sonra indir', type: 'physical', materials: [] },
  { id: 'p07', text: 'Gözlerini kapat, sonra aç', type: 'physical', materials: [] },
  { id: 'p08', text: 'Omuzlarını silk, sonra ellerini çırp', type: 'physical', materials: [] },
  { id: 'p09', text: 'Marakası salla', type: 'physical', materials: ['Marakas'] },
  { id: 'p10', text: 'Topa ayağınla vur', type: 'physical', materials: ['Top'] },
  { id: 'p11', text: 'Zıpla, sonra topa ayağınla vur', type: 'physical', materials: ['Top'] },
  { id: 'p12', text: 'Ellerini çırp, sonra marakası salla', type: 'physical', materials: ['Marakas'] },
  { id: 'p13', text: 'Sandalyeye otur, sandalyeyi öne çek', type: 'physical', materials: ['Sandalye'] },
  { id: 'p14', text: 'Ayakkabına dokun, sonra çorabına dokun', type: 'physical', materials: ['Ayakkabı', 'Çorap'] },
  { id: 'p15', text: 'Kapıyı aç, sonra kapat', type: 'physical', materials: ['Kapı'] },
  { id: 'p16', text: 'Burnuna dokun, sonra kulağına dokun', type: 'physical', materials: [] },
  { id: 'p17', text: 'Ellerini bağla, sonra çöz', type: 'physical', materials: [] },
  { id: 'p18', text: 'Yere otur, sonra ayağa kalk', type: 'physical', materials: [] },

  // ——— DİJİTAL (ekranda sıra + distraktör) ———
  {
    id: 'd01',
    text: 'Önce topa dokun, sonra kaleme dokun',
    type: 'digital',
    materials: [],
    sequence: ['top', 'kalem'],
  },
  {
    id: 'd02',
    text: 'Önce kaleme dokun, sonra topa dokun',
    type: 'digital',
    materials: [],
    sequence: ['kalem', 'top'],
  },
  {
    id: 'd03',
    text: 'Önce elmaya dokun, sonra kitaba dokun',
    type: 'digital',
    materials: [],
    sequence: ['elma', 'kitap'],
  },
  {
    id: 'd04',
    text: 'Önce anahtara dokun, sonra saate dokun',
    type: 'digital',
    materials: [],
    sequence: ['anahtar', 'saat'],
  },
  {
    id: 'd05',
    text: 'Önce çiçeğe dokun, sonra arabaya dokun',
    type: 'digital',
    materials: [],
    sequence: ['cicek', 'araba'],
  },
  {
    id: 'd06',
    text: 'Önce silgiye dokun, sonra deftere dokun',
    type: 'digital',
    materials: [],
    sequence: ['silgi', 'defter'],
  },
  {
    id: 'd07',
    text: 'Önce çantaya dokun, sonra tarağa dokun',
    type: 'digital',
    materials: [],
    sequence: ['canta', 'tarak'],
  },
  {
    id: 'd08',
    text: 'Önce bebeğe dokun, sonra topa dokun',
    type: 'digital',
    materials: [],
    sequence: ['bebek', 'top'],
  },
  {
    id: 'd09',
    text: 'Önce bardağa dokun, sonra kaşığa dokun',
    type: 'digital',
    materials: [],
    sequence: ['bardak', 'kasik'],
  },
  {
    id: 'd10',
    text: 'Önce makasa dokun, sonra cetvele dokun',
    type: 'digital',
    materials: [],
    sequence: ['makas', 'cetvel'],
  },
  {
    id: 'd11',
    text: 'Önce boyaya dokun, sonra fırçaya dokun',
    type: 'digital',
    materials: [],
    sequence: ['boya', 'firca'],
  },
  {
    id: 'd12',
    text: 'Önce çoraba dokun, sonra anahtara dokun',
    type: 'digital',
    materials: [],
    sequence: ['corap', 'anahtar'],
  },
  {
    id: 'd13',
    text: 'Önce zile dokun, sonra mendile dokun',
    type: 'digital',
    materials: [],
    sequence: ['zil', 'mendil'],
  },
  {
    id: 'd14',
    text: 'Önce süngere dokun, sonra elmaya dokun',
    type: 'digital',
    materials: [],
    sequence: ['sunger', 'elma'],
  },
  {
    id: 'd15',
    text: 'Önce kitaba dokun, sonra kaleme dokun, sonra topa dokun',
    type: 'digital',
    materials: [],
    sequence: ['kitap', 'kalem', 'top'],
  },
  {
    id: 'd16',
    text: 'Önce arabaya dokun, sonra saate dokun, sonra çiçeğe dokun',
    type: 'digital',
    materials: [],
    sequence: ['araba', 'saat', 'cicek'],
  },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => 0.5 - Math.random());
}

interface Yonerge8Props {
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

type Phase = 'prep' | 'running' | 'result';

function NesneCard({
  item,
  onClick,
  highlight,
  done,
  dimmed,
  disabled,
  stepNum,
}: {
  item: NesneDef;
  onClick?: () => void;
  highlight?: boolean;
  done?: boolean;
  dimmed?: boolean;
  disabled?: boolean;
  stepNum?: number;
}) {
  let border =
    'border-slate-700 hover:border-slate-500 ';
  if (highlight) border = 'border-yellow-400 ring-2 ring-yellow-500/50 bg-yellow-900/20 ';
  if (done) border = 'border-green-400 ring-2 ring-green-500/40 bg-green-900/25 ';

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={item.name}
      className={
        `relative flex flex-col items-center justify-center rounded-2xl border-2 bg-slate-800/80 overflow-hidden w-full h-full p-2 ` +
        border +
        (disabled || dimmed ? 'cursor-not-allowed opacity-40 ' : 'cursor-pointer active:scale-95 ') +
        'transition-all duration-200'
      }
    >
      {stepNum != null && done && (
        <span className="absolute top-1 left-1 w-6 h-6 rounded-full bg-green-500 text-white text-xs font-black flex items-center justify-center">
          {stepNum}
        </span>
      )}
      {item.img ? (
        <img src={item.img} alt="" className="w-[80%] h-[80%] max-w-[120px] max-h-[120px] object-contain" draggable={false} />
      ) : (
        <span className="text-5xl sm:text-6xl">{item.emoji || '📦'}</span>
      )}
    </button>
  );
}

export default function Yonerge8({
  itemCode = 'YTB 3.3',
  itemText = 'Verilen Yönergeleri İstenen Sıra ile Yerine Getirme',
  onClose,
  onComplete,
}: Yonerge8Props) {
  const [selected, setSelected] = useState<SequentialTask[]>(() => shuffle(TASK_POOL).slice(0, 10));
  const [phase, setPhase] = useState<Phase>('prep');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);

  // Dijital sıra takibi
  const [seqProgress, setSeqProgress] = useState(0); // kaçıncı adım tamamlandı
  const [gridItems, setGridItems] = useState<NesneDef[]>([]);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);

  const currentTask = selected[currentIndex];

  const materialsList = (() => {
    const set = new Set<string>();
    selected.forEach((t) => t.materials.forEach((m) => set.add(m)));
    return Array.from(set).sort();
  })();

  const replaceTask = (index: number) => {
    const used = new Set(selected.map((t) => t.id));
    const alts = TASK_POOL.filter((t) => !used.has(t.id));
    if (alts.length === 0) return;
    const next = alts[Math.floor(Math.random() * alts.length)];
    setSelected((prev) => {
      const copy = [...prev];
      copy[index] = next;
      return copy;
    });
  };

  const prepareDigitalGrid = useCallback((task: SequentialTask) => {
    if (task.type !== 'digital' || !task.sequence) return;
    const needed = task.sequence.map((id) => OBJECTS[id]).filter(Boolean);
    const allIds = Object.keys(OBJECTS);
    const extra = shuffle(allIds.filter((id) => !task.sequence!.includes(id)))
      .slice(0, Math.max(4, 6 - needed.length))
      .map((id) => OBJECTS[id]);
    setGridItems(shuffle([...needed, ...extra]));
    setSeqProgress(0);
    setDoneIds([]);
    setWrongFlash(null);
  }, []);

  const startAssessment = () => {
    setCurrentIndex(0);
    setScore(0);
    setLocked(false);
    setPhase('running');
    const first = selected[0];
    if (first?.type === 'digital') prepareDigitalGrid(first);
  };

  const goNext = (correct: boolean) => {
    const newScore = score + (correct ? 1 : 0);
    const next = currentIndex + 1;
    setScore(newScore);

    if (next >= 10) {
      setPhase('result');
      if (newScore >= 8) confetti({ particleCount: 250, spread: 90, origin: { y: 0.6 } });
      return;
    }

    setCurrentIndex(next);
    setLocked(false);
    const nextTask = selected[next];
    if (nextTask?.type === 'digital') prepareDigitalGrid(nextTask);
  };

  const handlePhysical = (correct: boolean) => {
    if (locked) return;
    setLocked(true);
    goNext(correct);
  };

  const handleDigitalTap = (item: NesneDef) => {
    if (locked || currentTask?.type !== 'digital' || !currentTask.sequence) return;

    const expectedId = currentTask.sequence[seqProgress];
    if (item.id === expectedId) {
      // Doğru adım
      const newDone = [...doneIds, item.id];
      setDoneIds(newDone);
      const nextStep = seqProgress + 1;
      setSeqProgress(nextStep);

      if (nextStep >= currentTask.sequence.length) {
        // Tüm sıra doğru
        setLocked(true);
        setTimeout(() => goNext(true), 600);
      }
    } else {
      // Yanlış — deneme başarısız
      setWrongFlash(item.id);
      setLocked(true);
      setTimeout(() => {
        setWrongFlash(null);
        goNext(false);
      }, 700);
    }
  };

  // currentTask değişince dijital grid hazırla
  useEffect(() => {
    if (phase === 'running' && currentTask?.type === 'digital') {
      prepareDigitalGrid(currentTask);
    }
  }, [phase, currentIndex]); // eslint-disable-line

  return (
    <div className="fixed inset-0 h-[100dvh] w-screen z-[100] flex flex-col bg-slate-950 text-white font-sans select-none">
      {/* HEADER */}
      <div className="shrink-0 p-4 landscape:py-2 landscape:px-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur-md relative z-10">
        <button
          onClick={onClose}
          className="p-2 landscape:p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
        >
          <XCircle className="w-7 h-7 landscape:w-6 landscape:h-6" />
        </button>
        <div className="text-center flex flex-col items-center px-2">
          <h2 className="text-sm sm:text-lg landscape:text-sm font-bold truncate max-w-[280px] sm:max-w-md text-slate-100">
            {itemCode} — {itemText}
          </h2>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-1">
            {phase === 'prep' && 'HAZIRLIK'}
            {phase === 'running' && `DEĞERLENDİRME · ${currentIndex + 1} / 10`}
            {phase === 'result' && 'SONUÇ'}
          </p>
        </div>
        <div className="w-10 landscape:w-8" />
      </div>

      <div className="flex-1 relative flex flex-col items-center justify-center p-3 sm:p-4 overflow-y-auto bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">

        {/* ========== PREP ========== */}
        {phase === 'prep' && (
          <div className="w-full max-w-2xl animate-in zoom-in-95 duration-300 pb-6 space-y-5">
            <div className="text-center">
              <ListOrdered size={44} className="mx-auto text-blue-500 mb-3 drop-shadow-[0_0_12px_rgba(59,130,246,0.4)]" />
              <h1 className="text-2xl font-black mb-2">Sıralı Görev Hazırlığı</h1>
              <p className="text-slate-400 text-sm leading-relaxed px-2">
                Bu oturumda <span className="text-blue-300 font-semibold">10 sıralı yönerge</span> sorulacak.
                İstemediğin göreve dokunarak değiştirebilirsin.
              </p>
            </div>

            {/* Görev listesi */}
            <div className="space-y-2 max-h-[42dvh] overflow-y-auto pr-1">
              {selected.map((task, i) => (
                <button
                  key={`${task.id}-${i}`}
                  type="button"
                  onClick={() => replaceTask(i)}
                  className="w-full flex items-start gap-3 p-3 rounded-xl border border-slate-700 bg-slate-900/70 hover:border-blue-500/50 hover:bg-slate-800/80 text-left transition-all group"
                >
                  <span className="min-w-[28px] h-7 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-400">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100 leading-snug">{task.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={
                          'text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ' +
                          (task.type === 'physical'
                            ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                            : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30')
                        }
                      >
                        {task.type === 'physical' ? 'Fiziksel' : 'Dijital'}
                      </span>
                      {task.materials.length > 0 && (
                        <span className="text-[10px] text-slate-500 truncate">
                          {task.materials.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <RefreshCw size={14} className="text-slate-600 group-hover:text-blue-400 shrink-0 mt-1" />
                </button>
              ))}
            </div>

            {/* Malzeme listesi */}
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
              <div className="flex items-center gap-2 mb-2 text-slate-300">
                <Box size={16} className="text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Hazır bulundurulacak malzemeler</span>
              </div>
              {materialsList.length === 0 ? (
                <p className="text-sm text-slate-500">Ekstra malzeme gerekmiyor (sadece beden hareketleri).</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {materialsList.map((m) => (
                    <span
                      key={m}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs font-medium"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={startAssessment}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-blue-900/40 active:scale-95 transition-all"
            >
              <PlayCircle size={22} /> Değerlendirmeyi Başlat
            </button>
          </div>
        )}

        {/* ========== RUNNING ========== */}
        {phase === 'running' && currentTask && (
          <div className="w-full max-w-3xl flex flex-col items-center animate-in slide-in-from-right-6 duration-300">
            {/* Tip rozeti + yönerge metni */}
            <div className="w-full bg-slate-800/60 border-2 border-slate-700 rounded-[2rem] p-6 md:p-10 flex flex-col items-center shadow-2xl mb-4">
              <span
                className={
                  'text-xs font-bold tracking-widest uppercase mb-3 px-3 py-1 rounded-full ' +
                  (currentTask.type === 'physical'
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30')
                }
              >
                {currentTask.type === 'physical' ? 'Fiziksel — Öğrenciye söyleyin' : 'Dijital — Sırayla dokunsun'}
              </span>
              <h1 className="text-2xl md:text-4xl font-black text-center text-white leading-tight">
                "{currentTask.text}"
              </h1>
              {currentTask.type === 'digital' && currentTask.sequence && (
                <p className="text-slate-400 text-xs mt-3">
                  Adım {Math.min(seqProgress + 1, currentTask.sequence.length)} / {currentTask.sequence.length}
                </p>
              )}
            </div>

            {/* Dijital grid */}
            {currentTask.type === 'digital' && (
              <div className="grid grid-cols-2 landscape:grid-cols-3 gap-3 landscape:gap-4 w-full max-w-md landscape:max-w-2xl">
                {gridItems.map((item) => {
                  const doneIdx = doneIds.indexOf(item.id);
                  const isDone = doneIdx >= 0;
                  return (
                    <div key={item.id} className="min-h-[120px] landscape:min-h-[100px]">
                      <NesneCard
                        item={item}
                        done={isDone}
                        stepNum={isDone ? doneIdx + 1 : undefined}
                        highlight={wrongFlash === item.id}
                        disabled={locked || isDone}
                        dimmed={isDone}
                        onClick={() => handleDigitalTap(item)}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {currentTask.type === 'physical' && (
              <p className="text-slate-500 text-sm text-center max-w-md">
                Öğrenci 3–5 saniye içinde istenen sırada yaparsa <span className="text-green-400">Yaptı</span>,
                aksi halde <span className="text-red-400">Yapamadı</span>.
              </p>
            )}
          </div>
        )}

        {/* ========== RESULT ========== */}
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

      {/* Fiziksel alt butonlar */}
      {phase === 'running' && currentTask?.type === 'physical' && (
        <div className="shrink-0 p-5 pb-8 landscape:py-3 landscape:pb-4 bg-slate-900 border-t border-slate-800 flex items-stretch justify-center gap-3 relative z-10">
          <button
            onClick={() => handlePhysical(false)}
            disabled={locked}
            className="flex-1 max-w-[260px] flex flex-col landscape:flex-row items-center justify-center gap-2 p-4 landscape:p-3 bg-red-500/10 border border-red-500/30 rounded-2xl active:scale-95 transition-all text-red-500 hover:bg-red-500/20 disabled:opacity-40"
          >
            <X className="w-9 h-9 landscape:w-6 landscape:h-6" />
            <span className="text-sm font-bold uppercase tracking-wider">Yapamadı</span>
          </button>
          <button
            onClick={() => handlePhysical(true)}
            disabled={locked}
            className="flex-1 max-w-[260px] flex flex-col landscape:flex-row items-center justify-center gap-2 p-4 landscape:p-3 bg-green-500/10 border border-green-500/30 rounded-2xl active:scale-95 transition-all text-green-500 hover:bg-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)] disabled:opacity-40"
          >
            <Check className="w-9 h-9 landscape:w-6 landscape:h-6" />
            <span className="text-sm font-bold uppercase tracking-wider">Yaptı</span>
          </button>
        </div>
      )}
    </div>
  );
}
