import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2, CheckCircle2, XCircle, Trophy, Gamepad2, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';
import { ABA_MODULES } from '@/shared/abaData';
import Talk from './talk';
import { associateCurrentTeacherWithStudent } from '@/lib/studentTeacherAssociation';
import SozelTaklit1 from '@/aba/sozeltaklit/sozeltaklit1';
import SozelTaklit2 from '@/aba/sozeltaklit/sozeltaklit2';
import SozelTaklit3 from '@/aba/sozeltaklit/sozeltaklit3';
import type { AssessmentCompletionDetails } from '@/aba/sozeltaklit/SozelTaklitAssessment';

const WORD_PROGRESS_FIELD = 'sozeltaklit_st21_progress';

interface WordProgress {
  masteredWords: string[];
  lastScore?: number;
  lastSetPassed?: boolean;
  updatedAt?: string;
}

const normalizeWord = (value: string) => value
  .toLocaleLowerCase('tr-TR')
  .replace(/[ç]/g, 'c')
  .replace(/[ğ]/g, 'g')
  .replace(/[ıİi]/g, 'i')
  .replace(/[ö]/g, 'o')
  .replace(/[ş]/g, 's')
  .replace(/[ü]/g, 'u')
  .replace(/[^a-z0-9]/g, '');

const getWordProgress = (data: Record<string, any>): WordProgress => {
  const progress = data[WORD_PROGRESS_FIELD];
  if (!progress || !Array.isArray(progress.masteredWords)) return { masteredWords: [] };
  return {
    ...progress,
    masteredWords: progress.masteredWords.filter((word: unknown): word is string => typeof word === 'string'),
  };
};

const mergeUniqueWords = (words: string[]) => Array.from(
  new Map(words.map(word => [normalizeWord(word), word])).values(),
);

interface SozelTaklitPageProps {
  studentId: string;
  onBack: () => void;
}

export default function SozelTaklitPage({ studentId, onBack }: SozelTaklitPageProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [showTolkido, setShowTolkido] = useState(false);
  const [activeAssessmentItem, setActiveAssessmentItem] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState<'ok' | 'err' | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  
  // BURASI DÜZELTİLDİ: Artık "SÖZEL TAKLİT" modülünü arıyor.
  const moduleData = ABA_MODULES.find(m => m.name.includes("SÖZEL TAKLİT"));
  const items = moduleData ? moduleData.achievements : [];

  useEffect(() => {
    const load = async () => {
      if (!studentId) return;
      try {
        const instId = localStorage.getItem("kazanim-takip-institution-id");
        // Veritabanı yolu diğerleriyle aynı standartta
        const docSnap = await getDoc(doc(db, "institutions", instId!, "students", studentId, "assessments", "aba"));
        if (docSnap.exists()) setFormData(docSnap.data());
        setDirty(false);
      } catch (error) {
        toast.error("Veri yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [dirty]);

  const handleSave = async (newData?: Record<string, any>, showMessage = true) => {
    setIsSaving(true);
    setSaveBanner(null);
    try {
      const instId = localStorage.getItem("kazanim-takip-institution-id");
      if (!instId) throw new Error("Kurum bilgisi bulunamadı.");
      const dataToSave = newData || formData;
      await setDoc(doc(db, "institutions", instId, "students", studentId, "assessments", "aba"), dataToSave, { merge: true });
      await associateCurrentTeacherWithStudent(studentId);
      setDirty(false);
      setSaveBanner('ok');
      window.setTimeout(() => setSaveBanner(null), 1500);
      if (showMessage) toast.success("Değişiklikler kaydedildi.");
      return true;
    } catch (error) {
      console.error("Sözel taklit kaydetme hatası:", error);
      setSaveBanner('err');
      window.setTimeout(() => setSaveBanner(null), 2500);
      toast.error("Kaydetme hatası.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const setStatus = (itemString: string, status: boolean) => {
    // Varsa sil (null yap), yoksa yeni durumu ata (toggle mantığı)
    setFormData(prev => ({ ...prev, [itemString]: prev[itemString] === status ? null : status }));
    setDirty(true);
    setSaveBanner(null);
  };

  const handleAssessmentComplete = async (
    success: boolean,
    details?: AssessmentCompletionDetails,
  ) => {
    if (!activeAssessmentItem) return;
    let updatedData = { ...formData, [activeAssessmentItem]: success };

    if (activeAssessmentItem.startsWith('ST 2.1.') && details?.kind === 'word') {
      const currentProgress = getWordProgress(formData);
      const masteredWords = details.setPassed
        ? mergeUniqueWords([...currentProgress.masteredWords, ...details.correctLabels])
        : currentProgress.masteredWords;
      const completed = masteredWords.length >= 30;

      updatedData = {
        ...formData,
        [activeAssessmentItem]: completed,
        [WORD_PROGRESS_FIELD]: {
          masteredWords,
          lastScore: details.score,
          lastSetPassed: details.setPassed,
          updatedAt: new Date().toISOString(),
        } satisfies WordProgress,
      };
    }

    setFormData(updatedData);
    setDirty(true);
    setSaveBanner(null);

    const saved = await handleSave(updatedData, false);
    if (saved) {
      toast.success("Değerlendirme sonucu kaydedildi.");
      setActiveAssessmentItem(null);
    }
  };

  const calculateProgress = () => {
    if (items.length === 0) return 0;
    const completedCount = items.filter(item => formData[item] === true).length;
    return Math.round((completedCount / items.length) * 100);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;

  if (activeAssessmentItem?.startsWith('ST 1.1.')) {
    return (
      <SozelTaklit1
        onClose={() => setActiveAssessmentItem(null)}
        onComplete={handleAssessmentComplete}
      />
    );
  }

  if (activeAssessmentItem?.startsWith('ST 1.2.')) {
    return (
      <SozelTaklit2
        onClose={() => setActiveAssessmentItem(null)}
        onComplete={handleAssessmentComplete}
      />
    );
  }

  if (activeAssessmentItem?.startsWith('ST 2.1.')) {
    return (
      <SozelTaklit3
        masteredWords={getWordProgress(formData).masteredWords}
        onClose={() => setActiveAssessmentItem(null)}
        onComplete={handleAssessmentComplete}
      />
    );
  }

  // TOLKİDO MODU
  if (showTolkido) {
    return (
      <Talk
        onBack={() => setShowTolkido(false)}
        studentId={studentId}
      />
    );
  }

  return (
    <div className="space-y-6 relative">
      
      {/* HEADER */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between sticky top-0 backdrop-blur-md z-10 shadow-lg">
        <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (dirty) setShowLeaveDialog(true);
                else onBack();
              }}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
                <h2 className="text-lg font-bold text-white">Sözel Taklit Becerileri</h2>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${calculateProgress()}%` }}></div>
                    </div>
                    <span>%{calculateProgress()} Tamamlandı</span>
                </div>
            </div>
        </div>
        <div className="flex min-w-[7.5rem] flex-col items-end gap-1">
          <Button onClick={() => handleSave()} disabled={isSaving} className="bg-green-600 hover:bg-green-700 h-8 text-xs disabled:opacity-60">
            {isSaving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
            {isSaving ? 'Kaydediliyor…' : 'Kaydet'}
          </Button>
          {saveBanner === 'ok' && <span className="text-[11px] font-semibold text-emerald-400">✓ Kaydedildi</span>}
          {saveBanner === 'err' && <span className="text-[11px] font-semibold text-red-400">✕ Kaydedilemedi</span>}
          {dirty && !saveBanner && !isSaving && <span className="text-[10px] text-amber-400/90">Kaydedilmedi</span>}
        </div>
      </div>

      {showLeaveDialog && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white">Kaydedilmemiş değişiklikler</h3>
            <p className="text-sm leading-relaxed text-slate-300">Yaptığınız değişiklikler kaydedilmedi. Çıkarsanız bu işaretlemeler kaybolur.</p>
            <div className="flex gap-2 pt-1">
              <Button data-android-back variant="ghost" className="flex-1 text-slate-300 hover:text-white" onClick={() => setShowLeaveDialog(false)}>Hayır, kal</Button>
              <Button className="flex-1 bg-red-600 text-white hover:bg-red-500" onClick={() => { setShowLeaveDialog(false); setDirty(false); onBack(); }}>Evet, çık</Button>
            </div>
            <Button
              className="w-full bg-green-600 text-white hover:bg-green-500"
              disabled={isSaving}
              onClick={async () => {
                const saved = await handleSave();
                if (saved) {
                  setShowLeaveDialog(false);
                  onBack();
                }
              }}
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSaving ? 'Kaydediliyor…' : 'Kaydet ve çık'}
            </Button>
          </div>
        </div>
      )}

      {/* LİSTE */}
      <div className="grid gap-3 animate-in slide-in-from-bottom-4 duration-500 pb-20">
        {items.map((item) => {
            const status = formData[item];
            const isPassed = status === true;
            const isFailed = status === false;
            
            // "ST 1.1. " kısmını ayıklama
            const firstSpaceIndex = item.indexOf(' ');
            const secondSpaceIndex = item.indexOf(' ', firstSpaceIndex + 1);
            // ST 1.1. formatı olduğu için 2. boşluğa kadar alabiliriz veya basitçe ilk boşluktan sonrasını metin sayabiliriz.
            // Senin formatında: "ST 1.1. Ses Taklidi" -> Kod: "ST 1.1.", Metin: "Ses Taklidi"
            
            // Kod kısmı (ST 1.1.)
            const codePart = item.substring(0, secondSpaceIndex > -1 ? secondSpaceIndex : firstSpaceIndex);
            // Metin kısmı
            const textPart = item.substring(secondSpaceIndex > -1 ? secondSpaceIndex + 1 : firstSpaceIndex + 1);

            const isTolkidoItem = item.includes("TOLKİDO");
            const isWordImitation = item.startsWith('ST 2.1.');
            const wordProgress = isWordImitation ? getWordProgress(formData) : null;
            const hasAssessment = item.startsWith('ST 1.1.') || item.startsWith('ST 1.2.') || isWordImitation;
            
            return (
                <div key={item} className={twMerge(
                    "group p-4 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                    isPassed && "bg-green-950/15 border-green-500/15 opacity-45 hover:opacity-80",
                    isFailed && "bg-red-950/30 border-red-500/50 shadow-[0_0_0_1px_rgba(239,68,68,0.15)] hover:border-red-400/70 hover:bg-red-950/40",
                    !isPassed && !isFailed && "bg-slate-900/40 border-slate-800 hover:bg-slate-800 hover:border-slate-700"
                )}>
                    <div className="flex items-start gap-4 flex-1">
                        <div className={twMerge(
                            "min-w-[60px] h-10 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono border shrink-0",
                            isPassed && "bg-green-500/15 border-green-500/40 text-green-400/80",
                            isFailed && "bg-red-500/25 border-red-500 text-red-300",
                            !isPassed && !isFailed && "bg-slate-950 border-slate-700 text-slate-500"
                        )}>
                            {isPassed ? <Trophy size={18} /> : isFailed ? <XCircle size={18} /> : codePart}
                        </div>
                        <div>
                            <p className={twMerge(
                                "font-medium text-sm leading-relaxed",
                                isPassed && "text-green-100/70",
                                isFailed && "text-red-100",
                                !isPassed && !isFailed && "text-slate-200"
                            )}>
                                {textPart || item} {/* Eğer parse edemezse düz item'ı bas */}
                            </p>
                            {isPassed && <span className="block text-[10px] text-green-500/60 font-semibold uppercase tracking-wider">Geçti · tekrar değerlendirilebilir</span>}
                            {isFailed && <span className="block text-[10px] text-red-400/90 font-semibold uppercase tracking-wider">Geçemedi · öncelikli</span>}
                            {wordProgress && (
                              <span className="mt-1 block text-[11px] font-bold text-blue-300">
                                {Math.min(wordProgress.masteredWords.length, 30)}/30 farklı sözcük
                              </span>
                            )}
                            {hasAssessment && <span className="mt-2 inline-flex items-center gap-1 rounded border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400"><Gamepad2 size={12} /> İnteraktif</span>}
                        </div>
                    </div>
                    
                    {/* BUTON GRUBU */}
                    <div className="flex items-center gap-1">
                         {hasAssessment && (
                           <button
                             onClick={() => setActiveAssessmentItem(item)}
                             className="mr-1 flex h-8 items-center justify-center gap-1 rounded-md border border-blue-400 bg-blue-600/90 px-3 text-[10px] font-bold text-white shadow-sm transition-transform active:scale-95"
                           >
                             <ClipboardCheck size={14} /> Değerlendir
                           </button>
                         )}
                         {/* TOLKİDO ÖZEL BUTONU */}
                         {isTolkidoItem && (
                           <button
                             onClick={() => setShowTolkido(true)}
                             className="flex items-center justify-center w-8 h-8 rounded-md border bg-orange-500/20 border-orange-500 text-orange-400 hover:bg-orange-500/40 transition-all mr-1"
                             title="Tolkido"
                           >
                             <Gamepad2 size={16} />
                           </button>
                         )}
                         <button onClick={() => setStatus(item, false)} className={twMerge("w-8 h-8 rounded-md border flex items-center justify-center transition-all", status === false ? "bg-red-500/20 border-red-500 text-red-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:border-red-500/50")}><XCircle size={16} /></button>
                         <button onClick={() => setStatus(item, true)} className={twMerge("w-8 h-8 rounded-md border flex items-center justify-center transition-all", status === true ? "bg-green-500/20 border-green-500 text-green-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:border-green-500/50")}><CheckCircle2 size={16} /></button>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
}
