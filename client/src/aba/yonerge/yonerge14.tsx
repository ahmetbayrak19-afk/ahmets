import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Check,
  PackageCheck,
  PlayCircle,
  Trophy,
  X,
  XCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

import girisSes from './sesgorsel/girisses.mp3';

type ObjectId = 'araba' | 'kalem' | 'elma' | 'top' | 'kitap' | 'bebek';

interface RelatedActionTask {
  id: string;
  objectId: ObjectId;
  text: string;
}

interface ObjectGroup {
  id: ObjectId;
  label: string;
  tasks: RelatedActionTask[];
  materials: string[];
}

/**
 * Altı nesne ve toplam 22 doğal yönerge.
 * Öğretmen hazırlık ekranında nesneleri seçer; seçilen nesnelerin bütün
 * yönergeleri değerlendirmeye alınır ve yönerge havuzu değiştirilmez.
 */
const OBJECT_GROUPS: ObjectGroup[] = [
  {
    id: 'araba',
    label: 'Oyuncak araba',
    tasks: [
      { id: 'araba-sur', objectId: 'araba', text: 'Şöyle güzelce sür bakalım' },
      { id: 'araba-kapi', objectId: 'araba', text: 'Kapısını aç bakalım' },
      { id: 'araba-korna', objectId: 'araba', text: 'Kornaya bir bas bakalım' },
      { id: 'araba-tekerlek', objectId: 'araba', text: 'Tekerleğini çevir bakalım' },
    ],
    materials: ['Kapısı açılabilen, tekerleği dönen ve kornalı oyuncak araba'],
  },
  {
    id: 'kalem',
    label: 'Kalem',
    tasks: [
      { id: 'kalem-yaz', objectId: 'kalem', text: 'Hadi bir şeyler yaz' },
      { id: 'kalem-boya', objectId: 'kalem', text: 'Biraz boya bakalım' },
      { id: 'kalem-ev-ciz', objectId: 'kalem', text: 'Bir ev çiz bakalım' },
      { id: 'kalem-balik-ciz', objectId: 'kalem', text: 'Şimdi bir balık çiz bakalım' },
    ],
    materials: ['Kalem veya boya kalemi', 'Kâğıt', 'Boyama kâğıdı'],
  },
  {
    id: 'elma',
    label: 'Elma',
    tasks: [
      { id: 'elma-ye', objectId: 'elma', text: 'Hadi biraz ye bakalım' },
      { id: 'elma-kes', objectId: 'elma', text: 'Ortadan kes bakalım' },
      { id: 'elma-soy', objectId: 'elma', text: 'Kabuğunu soy bakalım' },
    ],
    materials: ['Elma', 'Güvenli plastik/oyuncak bıçak', 'Soyma için uygun veya soyulabilir oyuncak elma'],
  },
  {
    id: 'top',
    label: 'Top',
    tasks: [
      { id: 'top-at', objectId: 'top', text: 'Hadi bana at' },
      { id: 'top-yuvarla', objectId: 'top', text: 'Yerde yuvarla bakalım' },
      { id: 'top-sektir', objectId: 'top', text: 'Biraz sektir bakalım' },
      { id: 'top-ayakla-vur', objectId: 'top', text: 'Ayağınla bir vur bakalım' },
    ],
    materials: ['Sektirilebilir top', 'Topun kullanılabileceği güvenli boş alan'],
  },
  {
    id: 'kitap',
    label: 'Kitap',
    tasks: [
      { id: 'kitap-ac', objectId: 'kitap', text: 'Hadi aç bakalım' },
      { id: 'kitap-resim', objectId: 'kitap', text: 'Hadi resimlerine bir bakalım' },
      { id: 'kitap-sayfa', objectId: 'kitap', text: 'Bir sayfasını çevir bakalım' },
    ],
    materials: ['Öğrencinin düzeyine uygun kitap'],
  },
  {
    id: 'bebek',
    label: 'Oyuncak bebek',
    tasks: [
      { id: 'bebek-uyut', objectId: 'bebek', text: 'Hadi uyut bakalım' },
      { id: 'bebek-kucak', objectId: 'bebek', text: 'Kucağına al bakalım' },
      { id: 'bebek-op', objectId: 'bebek', text: 'Hadi öp bakalım' },
      { id: 'bebek-sac-tara', objectId: 'bebek', text: 'Saçını tara bakalım' },
    ],
    materials: ['Oyuncak bebek', 'Bebeği uyutmak için küçük örtü', 'Tarak'],
  },
];

const MIN_SELECTED_OBJECTS = 3;
const PASS_RATE = 0.8;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Yönergeleri nesnelere göre dengeli karıştırır. Seçili başka bir nesnenin
 * yönergesi kaldığı sürece aynı nesne art arda sorulmaz.
 */
function createMixedTaskOrder(tasks: RelatedActionTask[]): RelatedActionTask[] {
  const queues = new Map<ObjectId, RelatedActionTask[]>();

  tasks.forEach((task) => {
    const queue = queues.get(task.objectId) || [];
    queue.push(task);
    queues.set(task.objectId, queue);
  });

  queues.forEach((queue, objectId) => {
    queues.set(objectId, shuffle(queue));
  });

  const result: RelatedActionTask[] = [];
  let lastObjectId: ObjectId | null = null;

  while (result.length < tasks.length) {
    const nonEmpty = Array.from(queues.entries()).filter(([, queue]) => queue.length > 0);
    const differentObject = nonEmpty.filter(([objectId]) => objectId !== lastObjectId);
    const candidates = differentObject.length > 0 ? differentObject : nonEmpty;

    if (candidates.length === 0) break;

    const largestQueueSize = Math.max(...candidates.map(([, queue]) => queue.length));
    const largestQueues = candidates.filter(([, queue]) => queue.length === largestQueueSize);
    const [objectId, queue] = shuffle(largestQueues)[0];
    const nextTask = queue.shift();

    if (!nextTask) break;

    result.push(nextTask);
    lastObjectId = objectId;
  }

  return result;
}

interface Yonerge14Props {
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

type Phase = 'prep' | 'running' | 'result';

export default function Yonerge14({
  itemCode = 'YTB 4.3',
  itemText = 'Belirli Birkaç Hareketi İlişkili Nesne ile Gösterme',
  onClose,
  onComplete,
}: Yonerge14Props) {
  const [selectedObjectIds, setSelectedObjectIds] = useState<ObjectId[]>([]);
  const [sessionTasks, setSessionTasks] = useState<RelatedActionTask[]>([]);
  const [phase, setPhase] = useState<Phase>('prep');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);

  const introRef = useRef<HTMLAudioElement | null>(null);

  const displayItemCode = itemCode.trim() === 'YTB' ? 'YTB 4.3' : itemCode;
  const displayItemText = itemText.replace(/^4\.3\.\s*/, '');

  useEffect(() => {
    if (phase !== 'prep') return;

    const audio = new Audio(girisSes);
    introRef.current = audio;
    audio.volume = 1;
    audio.play().catch(() => {});

    return () => {
      audio.pause();
      audio.currentTime = 0;
      if (introRef.current === audio) introRef.current = null;
    };
  }, [phase]);

  const stopIntro = () => {
    if (!introRef.current) return;
    introRef.current.pause();
    introRef.current.currentTime = 0;
    introRef.current = null;
  };

  const selectedObjects = useMemo(
    () => OBJECT_GROUPS.filter((group) => selectedObjectIds.includes(group.id)),
    [selectedObjectIds],
  );

  const selectedTasks = useMemo(
    () => selectedObjects.flatMap((group) => group.tasks),
    [selectedObjects],
  );

  const materialsList = useMemo(() => {
    const materials = new Set<string>();
    selectedObjects.forEach((group) =>
      group.materials.forEach((material) => materials.add(material)),
    );
    return Array.from(materials);
  }, [selectedObjects]);

  const canStart = selectedObjectIds.length >= MIN_SELECTED_OBJECTS;

  const toggleObject = (objectId: ObjectId) => {
    setSelectedObjectIds((previous) =>
      previous.includes(objectId)
        ? previous.filter((id) => id !== objectId)
        : [...previous, objectId],
    );
  };

  const startAssessment = () => {
    if (!canStart) return;
    stopIntro();
    setSessionTasks(createMixedTaskOrder(selectedTasks));
    setCurrentIndex(0);
    setScore(0);
    setLocked(false);
    setPhase('running');
  };

  const passScore = Math.ceil(sessionTasks.length * PASS_RATE);

  const handleAssess = (correct: boolean) => {
    if (locked) return;
    setLocked(true);

    const nextScore = score + (correct ? 1 : 0);
    const nextIndex = currentIndex + 1;
    setScore(nextScore);

    window.setTimeout(() => {
      if (nextIndex >= sessionTasks.length) {
        setPhase('result');
        if (nextScore >= passScore) {
          confetti({ particleCount: 250, spread: 90, origin: { y: 0.6 } });
        }
        return;
      }

      setCurrentIndex(nextIndex);
      setLocked(false);
    }, 350);
  };

  const currentTask = sessionTasks[currentIndex];
  const success = sessionTasks.length > 0 && score >= passScore;
  const successRate = sessionTasks.length > 0
    ? Math.round((score / sessionTasks.length) * 100)
    : 0;

  return (
    <div
      className="fixed inset-0 h-[100dvh] w-screen z-[100] flex flex-col bg-slate-950 text-white font-sans select-none"
      style={{ touchAction: 'none' }}
    >
      <div className="shrink-0 p-4 landscape:py-2 landscape:px-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur-md relative z-10">
        <button
          type="button"
          onClick={() => {
            stopIntro();
            onClose();
          }}
          className="p-2 landscape:p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          aria-label="Değerlendirmeyi kapat"
        >
          <XCircle className="w-7 h-7 landscape:w-6 landscape:h-6" />
        </button>

        <div className="text-center flex flex-col items-center px-2 min-w-0">
          <h2 className="text-sm sm:text-lg landscape:text-sm font-bold truncate max-w-[280px] sm:max-w-md text-slate-100">
            {displayItemCode} — {displayItemText}
          </h2>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-1">
            {phase === 'prep' && 'HAZIRLIK'}
            {phase === 'running' && `DEĞERLENDİRME · ${currentIndex + 1} / ${sessionTasks.length}`}
            {phase === 'result' && 'SONUÇ'}
          </p>
        </div>

        <div className="w-10 landscape:w-8" />
      </div>

      <div
        className="flex-1 relative flex flex-col items-center justify-center p-3 sm:p-4 overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950"
        style={{ touchAction: 'none' }}
      >
        {phase === 'prep' && (
          <div
            className="w-full max-w-3xl animate-in zoom-in-95 duration-300 pb-6 space-y-5 overflow-y-auto max-h-full"
            style={{ touchAction: 'pan-y' }}
          >
            <div className="text-center">
              <PackageCheck
                size={44}
                className="mx-auto text-teal-500 mb-3 drop-shadow-[0_0_12px_rgba(20,184,166,0.4)]"
              />
              <h1 className="text-2xl font-black mb-2">Değerlendirilecek Nesneleri Seç</h1>
              <p className="text-slate-400 text-sm leading-relaxed px-2">
                En az <span className="text-teal-300 font-semibold">üç nesne</span> seçin. Seçtiğiniz
                nesnelerin bütün yönergeleri değerlendirmeye alınır; yönergeler değişmez. Öğrenci
                3–5 saniye içinde doğru nesneyi seçip istenen hareketi bağımsız yaparsa doğru sayılır.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {OBJECT_GROUPS.map((group) => {
                const isSelected = selectedObjectIds.includes(group.id);
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => toggleObject(group.id)}
                    aria-pressed={isSelected}
                    className={`p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                      isSelected
                        ? 'bg-teal-500/15 border-teal-500/70 shadow-[0_0_20px_rgba(20,184,166,0.12)]'
                        : 'bg-slate-900/70 border-slate-700 hover:border-slate-500 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div>
                        <p className="font-bold text-slate-100">{group.label}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                          {group.tasks.length} yönerge
                        </p>
                      </div>
                      <span
                        className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-teal-500 border-teal-400 text-slate-950'
                            : 'bg-slate-950 border-slate-600 text-transparent'
                        }`}
                      >
                        <Check size={17} />
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {group.tasks.map((task) => task.text).join(' · ')}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
              <p className="text-sm font-semibold text-slate-200">
                {selectedObjectIds.length} nesne seçildi · {selectedTasks.length} yönerge
              </p>
              {!canStart && (
                <p className="text-xs text-amber-400 mt-1">
                  Başlamak için en az {MIN_SELECTED_OBJECTS} nesne seçin.
                </p>
              )}
            </div>

            {selectedObjects.length > 0 && (
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-slate-300">
                  <Check size={16} className="text-teal-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Değerlendirilecek yönergeler
                  </span>
                </div>
                {selectedObjects.map((group) => (
                  <div key={group.id} className="border-t border-slate-800 pt-3 first:border-0 first:pt-0">
                    <p className="text-xs font-bold text-teal-300 mb-2">{group.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {group.tasks.map((task) => (
                        <span
                          key={task.id}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
                        >
                          {task.text}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {materialsList.length > 0 && (
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                <div className="flex items-center gap-2 mb-2 text-slate-300">
                  <Box size={16} className="text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Hazır bulundurulacak malzemeler
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {materialsList.map((material) => (
                    <span
                      key={material}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs font-medium"
                    >
                      {material}
                    </span>
                  ))}
                </div>
                {selectedObjectIds.includes('elma') && (
                  <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
                    Kesme ve soyma denemelerinde yalnızca güvenli, yetişkin gözetimine uygun materyal
                    kullanın.
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={startAssessment}
              disabled={!canStart}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white px-6 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-teal-900/40 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <PlayCircle size={22} /> Değerlendirmeyi Başlat
            </button>
          </div>
        )}

        {phase === 'running' && currentTask && (
          <div className="w-full max-w-3xl flex flex-col items-center animate-in slide-in-from-right-6 duration-300">
            <div className="w-full bg-slate-800/60 border-2 border-slate-700 rounded-[2rem] p-5 md:p-10 flex flex-col items-center shadow-2xl mb-4 min-h-[200px] justify-center">
              <span className="text-xs font-bold tracking-widest uppercase mb-3 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Öğrenciye söyleyin
              </span>
              <h1 className="text-3xl md:text-5xl font-black text-center text-white leading-tight">
                “{currentTask.text}.”
              </h1>
              <p className="text-slate-500 text-sm mt-4 text-center max-w-lg">
                Öğrenci 3–5 saniye içinde doğru nesneyi seçip hareketi bağımsız yaparsa{' '}
                <span className="text-green-400">Yaptı</span>, yanlış nesneyi seçer, tepki vermez
                veya yardımla yaparsa <span className="text-red-400">Yapamadı</span>.
              </p>
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div className="flex flex-col items-center text-center p-8 bg-slate-900/90 rounded-3xl border border-slate-700 shadow-2xl max-w-xl animate-in zoom-in-95 duration-500">
            <Trophy
              size={72}
              className={
                success
                  ? 'text-yellow-500 mb-5 animate-bounce drop-shadow-[0_0_20px_rgba(234,179,8,0.4)]'
                  : 'text-slate-500 mb-5'
              }
            />
            <h1 className="text-3xl font-black mb-2">Değerlendirme Bitti!</h1>
            <p className="text-slate-400 mb-2 text-lg">
              Doğru: <span className="text-white font-black text-3xl mx-2">{score}</span> /{' '}
              {sessionTasks.length}
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Başarı: %{successRate} · Geçme ölçütü: {passScore}/{sessionTasks.length}
            </p>
            {success ? (
              <div className="bg-green-500/10 text-green-400 border border-green-500/20 px-6 py-3 rounded-xl mb-8 font-bold flex items-center gap-2">
                <Check size={22} /> Kazanım başarıyla sağlandı!
              </div>
            ) : (
              <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-6 py-3 rounded-xl mb-8 font-bold flex items-center gap-2">
                <X size={22} /> Henüz yeterli bağımsızlık düzeyinde değil.
              </div>
            )}
            <button
              type="button"
              onClick={() => onComplete(success)}
              className="bg-teal-600 hover:bg-teal-500 text-white px-12 py-4 rounded-xl font-bold text-xl active:scale-95 shadow-xl shadow-teal-900/50 w-full sm:w-auto"
            >
              KAYDET VE ÇIK
            </button>
          </div>
        )}
      </div>

      {phase === 'running' && (
        <div className="shrink-0 p-5 pb-8 landscape:py-3 landscape:pb-4 bg-slate-900 border-t border-slate-800 flex items-stretch justify-center gap-3 relative z-10">
          <button
            type="button"
            onClick={() => handleAssess(false)}
            disabled={locked}
            className="flex-1 max-w-[260px] flex flex-col landscape:flex-row items-center justify-center gap-2 p-4 landscape:p-3 bg-red-500/10 border border-red-500/30 rounded-2xl active:scale-95 transition-all text-red-500 hover:bg-red-500/20 disabled:opacity-40"
          >
            <X className="w-9 h-9 landscape:w-6 landscape:h-6" />
            <span className="text-sm font-bold uppercase tracking-wider">Yapamadı</span>
          </button>
          <button
            type="button"
            onClick={() => handleAssess(true)}
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
