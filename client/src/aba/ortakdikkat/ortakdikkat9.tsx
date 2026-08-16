import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  Loader2,
  Pencil,
  Play,
  RefreshCw,
  RotateCcw,
  Save,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';

import KnownPeopleManager, {
  KnownPersonProfile,
  useKnownPeople,
} from '@/aba/shared/KnownPeopleManager';
import { Button } from '@/components/ui/button';
import { db } from '@/firebase';

const TRIAL_COUNT = 10;
const PASS_COUNT = 8;

const OBJECT_POOL = [
  'Top',
  'Araba',
  'Kalem',
  'Kitap',
  'Oyuncak bebek',
  'Oyuncak telefon',
  'Yapboz',
  'Bardak',
  'Çanta',
  'Ayakkabı',
  'Balon',
  'Boya kalemi',
  'LEGO',
  'Köpük baloncuk',
  'Pelüş oyuncak',
];

type Stage = 'intro' | 'people' | 'planning' | 'assessment' | 'result';
type TargetType = 'person' | 'object';

interface AssessmentTarget {
  id: string;
  name: string;
  type: TargetType;
  imageUrl?: string;
}

interface TrialResult {
  targetId: string;
  targetName: string;
  targetType: TargetType;
  correct: boolean;
}

interface StoredTarget {
  id: string;
  name: string;
  type: TargetType;
}

interface SkillProfile {
  sessionCount?: number;
  independentlyCorrectTargets?: StoredTarget[];
}

interface OrtakDikkat9Props {
  studentId: string;
  itemCode?: string;
  itemText?: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

const normalize = (value: string) =>
  value.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, '-');

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
};

export default function OrtakDikkat9({
  studentId,
  itemCode = 'OD 2.3',
  itemText = 'İşaret Edilen Nesne/Kişiye Bakma',
  onClose,
  onComplete,
}: OrtakDikkat9Props) {
  const { profiles, loading: peopleLoading } = useKnownPeople(studentId);
  const selectionInitialized = useRef(false);
  const [stage, setStage] = useState<Stage>('intro');
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [previousCorrectTargets, setPreviousCorrectTargets] = useState<StoredTarget[]>([]);
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);
  const [objectNames, setObjectNames] = useState<string[]>([]);
  const [targets, setTargets] = useState<AssessmentTarget[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<TrialResult[]>([]);

  useEffect(() => {
    const loadProfile = async () => {
      const institutionId = localStorage.getItem('kazanim-takip-institution-id');
      if (!institutionId || !studentId) {
        setProfileLoading(false);
        return;
      }

      try {
        const snapshot = await getDoc(doc(
          db,
          'institutions',
          institutionId,
          'students',
          studentId,
          'profiles',
          'ortakDikkat23',
        ));
        if (snapshot.exists()) {
          const data = snapshot.data() as SkillProfile;
          setSessionCount(data.sessionCount || 0);
          setPreviousCorrectTargets(data.independentlyCorrectTargets || []);
        }
      } catch (error) {
        console.error('OD 2.3 profili yüklenemedi:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [studentId]);

  useEffect(() => {
    if (peopleLoading || selectionInitialized.current || profiles.length === 0) return;
    setSelectedPersonIds(profiles.slice(0, TRIAL_COUNT).map((profile) => profile.id));
    selectionInitialized.current = true;
  }, [peopleLoading, profiles]);

  const selectedPeople = useMemo(
    () => profiles.filter((profile) => selectedPersonIds.includes(profile.id)).slice(0, TRIAL_COUNT),
    [profiles, selectedPersonIds],
  );
  const requiredObjectCount = Math.max(0, TRIAL_COUNT - selectedPeople.length);

  useEffect(() => {
    setObjectNames((current) => {
      const next = current.slice(0, requiredObjectCount);
      const used = new Set(next.map(normalize));
      for (const suggestion of OBJECT_POOL) {
        if (next.length >= requiredObjectCount) break;
        if (!used.has(normalize(suggestion))) {
          next.push(suggestion);
          used.add(normalize(suggestion));
        }
      }
      return next;
    });
  }, [requiredObjectCount]);

  const togglePerson = (person: KnownPersonProfile) => {
    setSelectedPersonIds((current) => {
      if (current.includes(person.id)) return current.filter((id) => id !== person.id);
      if (current.length >= TRIAL_COUNT) {
        toast.info('Bir değerlendirmede en fazla 10 kişi kullanılabilir.');
        return current;
      }
      return [...current, person.id];
    });
  };

  const updateObjectName = (index: number, value: string) => {
    setObjectNames((current) => current.map((name, itemIndex) => itemIndex === index ? value : name));
  };

  const replaceObject = (index: number) => {
    const used = new Set(objectNames.filter((_, itemIndex) => itemIndex !== index).map(normalize));
    const alternatives = OBJECT_POOL.filter((name) => !used.has(normalize(name)));
    if (alternatives.length === 0) return;
    const currentName = objectNames[index];
    const currentAlternativeIndex = alternatives.findIndex((name) => normalize(name) === normalize(currentName));
    const nextName = alternatives[(currentAlternativeIndex + 1 + alternatives.length) % alternatives.length];
    updateObjectName(index, nextName);
  };

  const startAssessment = () => {
    if (profiles.length === 0) {
      setStage('people');
      return;
    }

    const cleanObjects = objectNames.map((name) => name.trim());
    if (selectedPeople.length + cleanObjects.length !== TRIAL_COUNT || cleanObjects.some((name) => !name)) {
      toast.info('Değerlendirme için 10 hedefin adı tamamlanmalıdır.');
      return;
    }
    if (new Set(cleanObjects.map(normalize)).size !== cleanObjects.length) {
      toast.info('Aynı nesne iki kez kullanılamaz.');
      return;
    }

    const personTargets: AssessmentTarget[] = selectedPeople.map((person) => ({
      id: `person:${person.id}`,
      name: person.name,
      type: 'person',
      imageUrl: person.imageUrl,
    }));
    const objectTargets: AssessmentTarget[] = cleanObjects.map((name) => ({
      id: `object:${normalize(name)}`,
      name,
      type: 'object',
    }));

    setTargets(shuffle([...personTargets, ...objectTargets]));
    setResults([]);
    setCurrentIndex(0);
    setStage('assessment');
  };

  const saveResult = async (finalResults: TrialResult[]) => {
    const institutionId = localStorage.getItem('kazanim-takip-institution-id');
    const correctCount = finalResults.filter((result) => result.correct).length;
    const passed = correctCount >= PASS_COUNT;
    const correctMap = new Map(previousCorrectTargets.map((target) => [target.id, target]));
    if (passed) {
      finalResults
        .filter((result) => result.correct)
        .forEach((result) => correctMap.set(result.targetId, {
          id: result.targetId,
          name: result.targetName,
          type: result.targetType,
        }));
    }
    const nextCorrectTargets = Array.from(correctMap.values());

    setResults(finalResults);
    setStage('result');

    if (!institutionId || !studentId) {
      toast.error('Sonuç kaydedilemedi: öğrenci veya kurum bilgisi bulunamadı.');
      return;
    }

    setSaving(true);
    try {
      await setDoc(doc(
        db,
        'institutions',
        institutionId,
        'students',
        studentId,
        'profiles',
        'ortakDikkat23',
      ), {
        sessionCount: sessionCount + 1,
        lastScore: correctCount,
        lastPassed: passed,
        lastResults: finalResults,
        independentlyCorrectTargets: nextCorrectTargets,
        programCompleted: nextCorrectTargets.length >= 20,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setSessionCount((count) => count + 1);
      setPreviousCorrectTargets(nextCorrectTargets);
      toast.success('Değerlendirme kaydedildi.');
    } catch (error) {
      console.error('OD 2.3 sonucu kaydedilemedi:', error);
      toast.error('Değerlendirme kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const recordAnswer = (correct: boolean) => {
    const target = targets[currentIndex];
    if (!target) return;

    const nextResults = [...results, {
      targetId: target.id,
      targetName: target.name,
      targetType: target.type,
      correct,
    }];

    if (currentIndex + 1 >= TRIAL_COUNT) {
      saveResult(nextResults);
      return;
    }

    setResults(nextResults);
    setCurrentIndex((index) => index + 1);
  };

  const restart = () => {
    setResults([]);
    setTargets([]);
    setCurrentIndex(0);
    setStage('planning');
  };

  const requestClose = () => {
    if (stage === 'assessment' && results.length > 0) {
      const shouldClose = window.confirm('Tamamlanmayan değerlendirme kaydedilmeyecek. Çıkmak istiyor musunuz?');
      if (!shouldClose) return;
    }
    onClose();
  };

  if (peopleLoading || profileLoading) {
    return (
      <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={38} className="animate-spin text-blue-400" />
          <p className="text-sm font-bold">Bilgiler hazırlanıyor…</p>
        </div>
      </div>
    );
  }

  if (stage === 'people') {
    return (
      <div className="fixed inset-0 z-[500] flex bg-slate-950">
        <KnownPeopleManager
          studentId={studentId}
          profiles={profiles}
          loading={peopleLoading}
          showBackButton
          onBack={() => setStage('intro')}
          title="Kişi Ekleme"
          returnLabel="OD 2.3 değerlendirmesine dön"
          onReturn={() => setStage('planning')}
        />
      </div>
    );
  }

  const correctCount = results.filter((result) => result.correct).length;
  const passed = results.length === TRIAL_COUNT && correctCount >= PASS_COUNT;
  const programCompleted = previousCorrectTargets.length >= 20;
  const currentTarget = targets[currentIndex];

  return (
    <div className="fixed inset-0 z-[500] flex flex-col overflow-hidden bg-slate-950 text-slate-100">
      <header className="flex items-center gap-3 border-b border-slate-800 bg-slate-900 p-3">
        <button type="button" onClick={requestClose} className="rounded-full bg-slate-800 p-2 text-slate-300" aria-label="Kapat">
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0">
          <p className="text-xs font-black tracking-widest text-blue-400">{itemCode}</p>
          <h1 className="truncate text-base font-bold">{itemText}</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl">
          {stage === 'intro' && (
            <div className="flex min-h-[75vh] flex-col justify-center gap-5">
              <div className="mx-auto rounded-3xl border border-blue-500/25 bg-blue-500/10 p-5 text-blue-300">
                <Eye size={48} />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-black">İşaret edilen hedefe bakma</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Öğretmen uzaktaki nesne veya kişiyi işaret ederek “Bak” der. Öğrencinin 3–5 saniye içinde doğru hedefe bağımsız bakması değerlendirilir.
                </p>
              </div>

              {profiles.length === 0 ? (
                <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4 text-center">
                  <Users className="mx-auto text-amber-300" size={30} />
                  <p className="mt-2 font-bold text-amber-100">Henüz kişi eklenmemiş</p>
                  <p className="mt-1 text-xs leading-5 text-amber-100/70">Değerlendirmeye başlamadan önce en az bir kişinin adını ve fotoğrafını ekleyin.</p>
                  <Button type="button" onClick={() => setStage('people')} className="mt-4 w-full bg-amber-500 font-bold text-slate-950 hover:bg-amber-400">
                    <UserPlus size={18} className="mr-2" /> KİŞİ EKLE
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-center text-sm text-emerald-100">
                    <CheckCircle2 className="mx-auto mb-2 text-emerald-400" size={28} />
                    {profiles.length} kayıtlı kişi hazır. Kalan denemeler sınıftaki nesnelerle tamamlanacak.
                  </div>
                  <Button type="button" onClick={() => setStage('planning')} className="w-full bg-blue-600 py-6 text-base font-bold hover:bg-blue-500">
                    <Play size={20} className="mr-2" /> HAZIRLIĞA GEÇ
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setStage('people')} className="w-full border-slate-700 bg-slate-900 text-slate-300">
                    <Pencil size={17} className="mr-2" /> KİŞİLERİ DÜZENLE
                  </Button>
                </div>
              )}
            </div>
          )}

          {stage === 'planning' && (
            <div className="space-y-5 pb-8">
              <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold">Kişiler</h2>
                    <p className="text-xs text-slate-400">Değerlendirme ortamında bulunan kişileri seçin.</p>
                  </div>
                  <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-300">{selectedPeople.length} seçili</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {profiles.map((person) => {
                    const selected = selectedPersonIds.includes(person.id);
                    return (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => togglePerson(person)}
                        className={`relative overflow-hidden rounded-xl border p-1.5 transition-all ${
                          selected ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-950 opacity-50'
                        }`}
                      >
                        <img src={person.imageUrl} alt={person.name} className="aspect-square w-full rounded-lg object-cover" />
                        <p className="mt-1 truncate text-[11px] font-bold">{person.name}</p>
                        {selected && <Check className="absolute right-2 top-2 rounded-full bg-emerald-500 p-0.5 text-white" size={18} />}
                      </button>
                    );
                  })}
                </div>
                <Button type="button" variant="ghost" onClick={() => setStage('people')} className="mt-3 w-full text-blue-300">
                  <UserPlus size={16} className="mr-2" /> Kişi ekle veya düzenle
                </Button>
              </section>

              <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold">Nesneler</h2>
                    <p className="text-xs text-slate-400">Önerilen nesneleri hazırlayın veya adını değiştirin.</p>
                  </div>
                  <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-bold text-violet-300">{requiredObjectCount} nesne</span>
                </div>
                <div className="mt-4 space-y-2">
                  {objectNames.map((name, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-xs font-black text-slate-500">
                        {index + 1}
                      </span>
                      <input
                        value={name}
                        onChange={(event) => updateObjectName(index, event.target.value)}
                        className="h-10 min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm outline-none focus:border-violet-500"
                        aria-label={`${index + 1}. nesne`}
                      />
                      <button
                        type="button"
                        onClick={() => replaceObject(index)}
                        className="rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-violet-300 active:scale-95"
                        aria-label={`${name} nesnesini değiştir`}
                      >
                        <RefreshCw size={17} />
                      </button>
                    </div>
                  ))}
                  {requiredObjectCount === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-700 py-5 text-center text-xs text-slate-500">10 kişi seçildiği için nesne gerekmiyor.</p>
                  )}
                </div>
              </section>

              <div className="rounded-2xl border border-blue-500/25 bg-blue-500/10 p-4 text-center">
                <p className="text-lg font-black text-blue-100">{selectedPeople.length} kişi + {requiredObjectCount} nesne = 10 deneme</p>
                <p className="mt-1 text-xs text-blue-100/70">Kişiler ve nesneler değerlendirmede karışık sırada gösterilir.</p>
              </div>

              <Button type="button" onClick={startAssessment} className="w-full bg-emerald-600 py-6 text-base font-bold hover:bg-emerald-500">
                <Play size={20} className="mr-2" /> DEĞERLENDİRMEYİ BAŞLAT
              </Button>
            </div>
          )}

          {stage === 'assessment' && currentTarget && (
            <div className="flex min-h-[75vh] flex-col justify-center gap-5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>{currentIndex + 1} / {TRIAL_COUNT}</span>
                <span>{currentTarget.type === 'person' ? 'KİŞİ' : 'NESNE'}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full bg-blue-500 transition-all" style={{ width: `${((currentIndex + 1) / TRIAL_COUNT) * 100}%` }} />
              </div>

              <section className="rounded-3xl border border-blue-500/30 bg-slate-900 p-6 text-center shadow-2xl">
                {currentTarget.imageUrl ? (
                  <img src={currentTarget.imageUrl} alt={currentTarget.name} className="mx-auto mb-4 h-28 w-28 rounded-2xl border-2 border-slate-700 object-cover" />
                ) : (
                  <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl border border-violet-500/25 bg-violet-500/10">
                    <Eye size={42} className="text-violet-300" />
                  </div>
                )}
                <p className="text-sm text-slate-400">Öğretmene gösterilecek hedef</p>
                <h2 className="mt-2 text-3xl font-black text-white">{currentTarget.name}</h2>
                <p className="mt-5 rounded-2xl bg-blue-500/10 px-4 py-3 text-base font-bold text-blue-100">
                  {currentTarget.name} hedefini işaret edin ve “Bak” deyin.
                </p>
                <p className="mt-3 text-xs text-slate-500">Yanıt için 3–5 saniye bekleyin.</p>
              </section>

              <div className="grid grid-cols-2 gap-3">
                <Button type="button" onClick={() => recordAnswer(false)} className="h-16 rounded-2xl border border-red-500/40 bg-red-500/15 text-base font-black text-red-300 hover:bg-red-500/25">
                  <X size={24} className="mr-2" /> BAKMADI
                </Button>
                <Button type="button" onClick={() => recordAnswer(true)} className="h-16 rounded-2xl border border-emerald-500/40 bg-emerald-500/20 text-base font-black text-emerald-200 hover:bg-emerald-500/30">
                  <Check size={24} className="mr-2" /> BAKTI
                </Button>
              </div>
            </div>
          )}

          {stage === 'result' && (
            <div className="flex min-h-[75vh] flex-col justify-center gap-5">
              <div className={`mx-auto rounded-full p-5 ${passed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                {passed ? <CheckCircle2 size={54} /> : <XCircle size={54} />}
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-black">{programCompleted ? 'Kazanım tamamlandı' : passed ? 'Set başarılı' : 'Set tekrarlanmalı'}</h2>
                <p className="mt-2 text-xl font-bold text-slate-300">{correctCount} / {TRIAL_COUNT} doğru tepki</p>
                <p className="mt-1 text-xs text-slate-500">Set geçme ölçütü en az 8/10</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-300">Farklı hedeflerde bağımsız doğru</span>
                  <span className="text-lg font-black text-blue-300">{Math.min(previousCorrectTargets.length, 20)} / 20</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (previousCorrectTargets.length / 20) * 100)}%` }} />
                </div>
              </div>

              <div className="grid gap-2">
                {results.map((result, index) => (
                  <div key={`${result.targetId}-${index}`} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5">
                    <span className="text-sm"><span className="mr-2 text-slate-600">{index + 1}.</span>{result.targetName}</span>
                    {result.correct ? <CheckCircle2 size={19} className="text-emerald-400" /> : <XCircle size={19} className="text-red-400" />}
                  </div>
                ))}
              </div>

              <Button type="button" onClick={() => onComplete(programCompleted)} disabled={saving} className="w-full bg-blue-600 py-6 font-bold hover:bg-blue-500">
                {saving ? <Loader2 className="animate-spin" size={19} /> : <><Save size={19} className="mr-2" /> KAYDET VE ÇIK</>}
              </Button>
              <Button type="button" variant="outline" onClick={restart} disabled={saving} className="w-full border-slate-700 bg-slate-900 text-slate-300">
                <RotateCcw size={18} className="mr-2" /> YENİ SET
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
