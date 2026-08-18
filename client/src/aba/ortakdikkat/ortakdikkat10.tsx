import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  Loader2,
  MessageCircle,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Speaker,
  UserRound,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { db } from '@/firebase';
import { associateCurrentTeacherWithStudent } from '@/lib/studentTeacherAssociation';
import girisSes from './ortakdikkatsesgorsel/2-4girisses.mp3';

const TRIAL_COUNT = 10;
const PASS_COUNT = 8;
const PEOPLE_GOAL = 3;

const INITIATIONS = [
  'Merhaba, seni gördüğüme sevindim.',
  'Günaydın, bugün nasılsın?',
  'Aa, top masanın altına kaçtı!',
  'Bu araba ne kadar hızlı gidiyor!',
  'Eyvah, yaptığımız kule devrildi!',
  'Sana da biraz vereyim mi?',
  'Bu oyuncağın sesi çok komikmiş.',
  'Aa, dışarıda yağmur başlamış!',
  'Ben mavi olanı çok beğendim.',
  'Eyvah, kalemim yere düştü.',
  'Yaptığın resim çok güzel olmuş.',
  'Bu baloncuk kocaman oldu!',
  'Aa, ışık yandı!',
  'Ben artık gidiyorum.',
  'Görüşürüz, yine birlikte oynarız.',
];

type Stage = 'intro' | 'planning' | 'assessment' | 'result';
type ResponseType = 'looked' | 'spoke' | 'both' | 'no-response';

interface AssessmentTrial {
  initiation: string;
  partnerName: string;
}

interface TrialResult extends AssessmentTrial {
  response: ResponseType;
  correct: boolean;
}

interface StoredPerson {
  id: string;
  name: string;
}

interface SkillProfile {
  sessionCount?: number;
  independentlyRespondedPeople?: StoredPerson[];
}

interface OrtakDikkat10Props {
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

const RESPONSE_LABELS: Record<ResponseType, string> = {
  looked: 'Baktı',
  spoke: 'Konuştu / iletişim aracı kullandı',
  both: 'Baktı ve konuştu',
  'no-response': 'Tepki vermedi veya ipucu aldı',
};

export default function OrtakDikkat10({
  studentId,
  itemCode = 'OD 2.4',
  itemText = 'Başkalarının Sosyal Etkileşim Girişimine Bakarak ve/veya Konuşarak Tepki Verme',
  onClose,
  onComplete,
}: OrtakDikkat10Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [stage, setStage] = useState<Stage>('intro');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [previousPeople, setPreviousPeople] = useState<StoredPerson[]>([]);
  const [partnerInput, setPartnerInput] = useState('');
  const [partners, setPartners] = useState<string[]>([]);
  const [trials, setTrials] = useState<AssessmentTrial[]>([]);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    const audio = new Audio(girisSes);
    audioRef.current = audio;
    audio.play().catch(() => {});

    return () => {
      audio.pause();
      audio.currentTime = 0;
      if (audioRef.current === audio) audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      const institutionId = localStorage.getItem('kazanim-takip-institution-id');
      if (!institutionId || !studentId) {
        setLoading(false);
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
          'ortakDikkat24',
        ));
        if (snapshot.exists()) {
          const data = snapshot.data() as SkillProfile;
          setSessionCount(data.sessionCount || 0);
          setPreviousPeople(data.independentlyRespondedPeople || []);
        }
      } catch (error) {
        console.error('OD 2.4 profili yüklenemedi:', error);
        toast.error('Önceki değerlendirme bilgileri yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [studentId]);

  const correctCount = results.filter((result) => result.correct).length;
  const passed = results.length === TRIAL_COUNT && correctCount >= PASS_COUNT;
  const currentTrial = trials[currentIndex];
  const programCompleted = passed && previousPeople.length >= PEOPLE_GOAL;

  const successfulPeopleThisSet = useMemo(() => {
    const people = new Map<string, StoredPerson>();
    results
      .filter((result) => result.correct)
      .forEach((result) => {
        const id = normalize(result.partnerName);
        people.set(id, { id, name: result.partnerName });
      });
    return Array.from(people.values());
  }, [results]);

  const playIntro = () => {
    if (!audioRef.current) audioRef.current = new Audio(girisSes);
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => toast.info('Ses cihaz tarafından başlatılamadı.'));
  };

  const stopIntro = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  };

  const addPartner = () => {
    const cleanName = partnerInput.trim();
    if (!cleanName) {
      toast.info('Etkileşimi başlatacak kişinin adını yazın.');
      return;
    }
    if (partners.some((name) => normalize(name) === normalize(cleanName))) {
      toast.info('Bu kişi listede zaten bulunuyor.');
      return;
    }
    if (partners.length >= PEOPLE_GOAL) {
      toast.info(`Bir sette en fazla ${PEOPLE_GOAL} kişi kullanılabilir.`);
      return;
    }
    setPartners((current) => [...current, cleanName]);
    setPartnerInput('');
  };

  const removePartner = (name: string) => {
    setPartners((current) => current.filter((item) => item !== name));
  };

  const startAssessment = () => {
    if (partners.length !== PEOPLE_GOAL) {
      toast.info(`Değerlendirmeye başlamak için ${PEOPLE_GOAL} farklı kişi ekleyin.`);
      return;
    }

    const selectedInitiations = shuffle(INITIATIONS).slice(0, TRIAL_COUNT);
    const partnerOrder = shuffle(partners);
    setTrials(selectedInitiations.map((initiation, index) => ({
      initiation,
      partnerName: partnerOrder[index % partnerOrder.length],
    })));
    setResults([]);
    setCurrentIndex(0);
    setSaved(false);
    stopIntro();
    setStage('assessment');
  };

  const replaceCurrentInitiation = () => {
    const used = new Set(trials.map((trial) => trial.initiation));
    const alternatives = INITIATIONS.filter((initiation) => !used.has(initiation));
    if (alternatives.length === 0) {
      toast.info('Kullanılabilecek başka cümle kalmadı.');
      return;
    }
    const replacement = alternatives[Math.floor(Math.random() * alternatives.length)];
    setTrials((current) => current.map((trial, index) => (
      index === currentIndex ? { ...trial, initiation: replacement } : trial
    )));
  };

  const mergeSuccessfulPeople = (finalResults: TrialResult[]) => {
    const merged = new Map(previousPeople.map((person) => [person.id, person]));
    finalResults
      .filter((result) => result.correct)
      .forEach((result) => {
        const id = normalize(result.partnerName);
        merged.set(id, { id, name: result.partnerName });
      });
    return Array.from(merged.values());
  };

  const persistResults = async (finalResults: TrialResult[]) => {
    const institutionId = localStorage.getItem('kazanim-takip-institution-id');
    if (!institutionId || !studentId) {
      toast.error('Sonuç kaydedilemedi: öğrenci veya kurum bilgisi bulunamadı.');
      return false;
    }

    const finalCorrectCount = finalResults.filter((result) => result.correct).length;
    const finalPassed = finalCorrectCount >= PASS_COUNT;
    const nextPeople = mergeSuccessfulPeople(finalResults);

    setSaving(true);
    try {
      await setDoc(doc(
        db,
        'institutions',
        institutionId,
        'students',
        studentId,
        'profiles',
        'ortakDikkat24',
      ), {
        sessionCount: sessionCount + 1,
        lastSession: {
          partners,
          results: finalResults,
          correctCount: finalCorrectCount,
          totalCount: TRIAL_COUNT,
          successRate: finalCorrectCount * 10,
          passed: finalPassed,
          completedAt: new Date().toISOString(),
        },
        independentlyRespondedPeople: nextPeople,
        programCompleted: finalPassed && nextPeople.length >= PEOPLE_GOAL,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      await associateCurrentTeacherWithStudent(studentId);

      setSessionCount((count) => count + 1);
      setPreviousPeople(nextPeople);
      setSaved(true);
      toast.success('OD 2.4 değerlendirmesi kaydedildi.');
      return true;
    } catch (error) {
      console.error('OD 2.4 sonucu kaydedilemedi:', error);
      toast.error('Değerlendirme kaydedilemedi.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const recordResponse = (response: ResponseType) => {
    if (!currentTrial || saving) return;

    const nextResults: TrialResult[] = [
      ...results,
      {
        ...currentTrial,
        response,
        correct: response !== 'no-response',
      },
    ];

    setResults(nextResults);

    if (currentIndex + 1 >= TRIAL_COUNT) {
      setStage('result');
      const finalCorrectCount = nextResults.filter((result) => result.correct).length;
      if (finalCorrectCount >= PASS_COUNT) {
        confetti({ particleCount: 160, spread: 80, origin: { y: 0.66 } });
      }
      void persistResults(nextResults);
      return;
    }

    setCurrentIndex((index) => index + 1);
  };

  const restart = () => {
    setTrials([]);
    setResults([]);
    setCurrentIndex(0);
    setSaved(false);
    setStage('planning');
  };

  const finishAndClose = async () => {
    if (!saved) {
      const success = await persistResults(results);
      if (!success) return;
    }
    onComplete(programCompleted);
  };

  const requestClose = () => {
    if (stage === 'assessment' || (stage === 'result' && !saved)) {
      setShowExitDialog(true);
      return;
    }
    onClose();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="animate-spin text-cyan-400" size={38} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[500] flex h-[100dvh] flex-col overflow-hidden bg-slate-950 text-slate-100">
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-900/95 p-3">
        <button
          type="button"
          onClick={requestClose}
          className="rounded-full bg-slate-800 p-2 text-slate-300 active:scale-95"
          aria-label="Kapat"
        >
          <XCircle size={23} />
        </button>
        <div className="min-w-0">
          <p className="text-xs font-black tracking-widest text-cyan-400">{itemCode}</p>
          <h1 className="truncate text-sm font-bold sm:text-base">{itemText}</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-xl">
          {stage === 'intro' && (
            <div className="flex min-h-[76vh] flex-col justify-center gap-5">
              <div className="mx-auto rounded-3xl border border-cyan-500/25 bg-cyan-500/10 p-5 text-cyan-300">
                <MessageCircle size={50} />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-black">Sosyal etkileşime tepki</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Farklı kişiler ekrandaki cümleyi doğal biçimde söyler. Öğrencinin bakarak, konuşarak veya iletişim aracıyla verdiği bağımsız tepki kaydedilir.
                </p>
              </div>

              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-center text-sm text-amber-100">
                Öğrenciye yönlendirme veya ipucu vermeyin.
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="text-violet-300" size={25} />
                    <div>
                      <p className="text-xs text-slate-400">Bağımsız tepki verdiği</p>
                      <p className="font-black">{Math.min(previousPeople.length, PEOPLE_GOAL)} / {PEOPLE_GOAL} farklı kişi</p>
                    </div>
                  </div>
                  <button type="button" onClick={playIntro} className="rounded-xl border border-slate-700 bg-slate-800 p-3 text-cyan-300" aria-label="Giriş sesini dinle">
                    <Speaker size={20} />
                  </button>
                </div>
              </div>

              <Button type="button" onClick={() => setStage('planning')} className="h-14 w-full bg-cyan-600 text-base font-black hover:bg-cyan-500">
                <Play size={20} className="mr-2" /> HAZIRLIĞA GEÇ
              </Button>
            </div>
          )}

          {stage === 'planning' && (
            <div className="space-y-5 pb-8">
              <div className="pt-2 text-center">
                <UserRound className="mx-auto text-cyan-300" size={40} />
                <h2 className="mt-3 text-xl font-black">Etkileşimi başlatacak kişiler</h2>
                <p className="mt-1 text-xs leading-5 text-slate-400">10 denemeyi uygulayacak {PEOPLE_GOAL} farklı kişinin adını yazın.</p>
              </div>

              <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex gap-2">
                  <input
                    value={partnerInput}
                    onChange={(event) => setPartnerInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') addPartner();
                    }}
                    placeholder="Örn. Ayşe öğretmen"
                    className="h-11 min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm outline-none focus:border-cyan-500"
                  />
                  <Button type="button" onClick={addPartner} className="h-11 bg-cyan-600 px-4 hover:bg-cyan-500" aria-label="Kişi ekle">
                    <Plus size={20} />
                  </Button>
                </div>

                <div className="mt-4 space-y-2">
                  {partners.map((name, index) => (
                    <div key={name} className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5">
                      <span className="text-sm font-bold"><span className="mr-2 text-slate-600">{index + 1}.</span>{name}</span>
                      <button type="button" onClick={() => removePartner(name)} className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400" aria-label={`${name} kişisini kaldır`}>
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                  {partners.length === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-700 py-6 text-center text-xs text-slate-500">Henüz kişi eklenmedi.</p>
                  )}
                </div>
              </section>

              <div className="rounded-2xl border border-blue-500/25 bg-blue-500/10 p-4 text-center text-xs leading-5 text-blue-100/80">
                {partners.length} / {PEOPLE_GOAL} kişi hazır. Uygulama 10 denemeyi bu {PEOPLE_GOAL} kişiye dağıtacak.
              </div>

              <Button type="button" onClick={startAssessment} disabled={partners.length !== PEOPLE_GOAL} className="h-14 w-full bg-emerald-600 text-base font-black hover:bg-emerald-500 disabled:opacity-40">
                <Play size={20} className="mr-2" /> DEĞERLENDİRMEYİ BAŞLAT
              </Button>
            </div>
          )}

          {stage === 'assessment' && currentTrial && (
            <div className="flex min-h-[76vh] flex-col justify-center gap-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>{currentIndex + 1} / {TRIAL_COUNT}</span>
                <span>{correctCount} bağımsız tepki</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full bg-cyan-500 transition-all" style={{ width: `${((currentIndex + 1) / TRIAL_COUNT) * 100}%` }} />
              </div>

              <section className="rounded-3xl border border-cyan-500/25 bg-slate-900 p-5 text-center shadow-2xl">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Cümleyi söyleyecek kişi</p>
                <h2 className="mt-1 text-xl font-black text-cyan-300">{currentTrial.partnerName}</h2>

                <div className="my-5 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-6">
                  <p className="text-xl font-black leading-8 text-white">“{currentTrial.initiation}”</p>
                </div>

                <p className="text-xs text-slate-400">Cümleyi doğal biçimde söyleyin ve öğrencinin tepkisini kaydedin.</p>
                <button type="button" onClick={replaceCurrentInitiation} className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white">
                  <RefreshCw size={15} /> Bu cümleyi değiştir
                </button>
              </section>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button type="button" disabled={saving} onClick={() => recordResponse('looked')} className="h-14 rounded-2xl border border-emerald-500/35 bg-emerald-500/15 font-black text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-35">
                  <Eye size={20} className="mr-2" /> BAKTI
                </Button>
                <Button type="button" disabled={saving} onClick={() => recordResponse('spoke')} className="h-14 rounded-2xl border border-emerald-500/35 bg-emerald-500/15 font-black text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-35">
                  <MessageCircle size={20} className="mr-2" /> KONUŞTU / AAC
                </Button>
                <Button type="button" disabled={saving} onClick={() => recordResponse('both')} className="h-14 rounded-2xl border border-emerald-500/35 bg-emerald-500/15 font-black text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-35 sm:col-span-2">
                  <CheckCircle2 size={20} className="mr-2" /> BAKTI VE KONUŞTU
                </Button>
                <Button type="button" disabled={saving} onClick={() => recordResponse('no-response')} className="h-14 rounded-2xl border border-red-500/35 bg-red-500/15 font-black text-red-200 hover:bg-red-500/25 disabled:opacity-35 sm:col-span-2">
                  <XCircle size={20} className="mr-2" /> TEPKİ VERMEDİ / İPUCU ALDI
                </Button>
              </div>
            </div>
          )}

          {stage === 'result' && (
            <div className="flex min-h-[76vh] flex-col justify-center gap-5 py-6">
              <div className={`mx-auto rounded-full p-5 ${passed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                {passed ? <CheckCircle2 size={54} /> : <XCircle size={54} />}
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-black">{programCompleted ? 'Kazanım tamamlandı' : passed ? 'Set başarılı' : 'Set tekrarlanmalı'}</h2>
                <p className="mt-2 text-xl font-bold text-slate-300">{correctCount} / {TRIAL_COUNT} bağımsız tepki</p>
                <p className="mt-1 text-xs text-slate-500">Set ölçütü en az 8/10</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-300">Farklı kişilerde bağımsız tepki</p>
                    {successfulPeopleThisSet.length > 0 && <p className="mt-1 text-xs text-slate-500">Bu sette {successfulPeopleThisSet.length} kişi</p>}
                  </div>
                  <span className="text-lg font-black text-cyan-300">{Math.min(previousPeople.length, PEOPLE_GOAL)} / {PEOPLE_GOAL}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full bg-cyan-500" style={{ width: `${Math.min(100, (previousPeople.length / PEOPLE_GOAL) * 100)}%` }} />
                </div>
              </div>

              <div className="space-y-2">
                {results.map((result, index) => (
                  <div key={`${result.partnerName}-${index}`} className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-bold"><span className="mr-2 text-slate-600">{index + 1}.</span>{result.partnerName}</p>
                      {result.correct ? <CheckCircle2 size={19} className="shrink-0 text-emerald-400" /> : <XCircle size={19} className="shrink-0 text-red-400" />}
                    </div>
                    <p className="mt-1 pl-5 text-xs text-slate-500">{RESPONSE_LABELS[result.response]}</p>
                  </div>
                ))}
              </div>

              <Button type="button" onClick={finishAndClose} disabled={saving} className="h-14 w-full bg-cyan-600 font-black hover:bg-cyan-500">
                {saving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={19} className="mr-2" /> KAYDET VE ÇIK</>}
              </Button>
              <Button type="button" variant="outline" onClick={restart} disabled={saving} className="h-12 w-full border-slate-700 bg-slate-900 text-slate-300">
                <RotateCcw size={18} className="mr-2" /> YENİ SET
              </Button>
            </div>
          )}
        </div>
      </main>

      {showExitDialog && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <h3 className="font-black text-white">Değerlendirmeden çıkılsın mı?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">Tamamlanmayan veya kaydedilmeyen denemeler silinecek.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button type="button" data-android-back variant="outline" onClick={() => setShowExitDialog(false)} className="border-slate-700 bg-slate-950 text-slate-300">KAL</Button>
              <Button type="button" onClick={onClose} className="bg-red-600 font-bold hover:bg-red-500">ÇIK</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
