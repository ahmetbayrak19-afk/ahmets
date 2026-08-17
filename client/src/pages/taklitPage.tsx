import { useState, useEffect } from 'react';
import { db } from '../firebase'; // Firebase yolun proje yapına göre değişebilir, sendeki gibi bıraktım
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2, CheckCircle2, XCircle, Trophy, GraduationCap, ClipboardCheck, Video } from 'lucide-react';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';
import { ABA_MODULES } from '@/shared/abaData';

// 🔥 DİKKAT: YOL GÜNCELLENDİ (Yeni yerine göre)
import TaklitSession from '@/aba/taklit/TaklitSession';

interface TaklitPageProps {
  studentId: string;
  onBack: () => void;
}

export default function TaklitPage({ studentId, onBack }: TaklitPageProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState<'ok' | 'err' | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'assessment' | 'instruction' | null>(null);

  const moduleData = ABA_MODULES.find(m => m.name.includes("TAKLİT BECERİLERİ"));
  const items = moduleData ? moduleData.achievements : [];

  useEffect(() => {
    const load = async () => {
      if (!studentId) return;
      try {
        const instId = localStorage.getItem("kazanim-takip-institution-id");
        if(instId) {
            const docSnap = await getDoc(doc(db, "institutions", instId, "students", studentId, "assessments", "aba"));
            if (docSnap.exists()) setFormData(docSnap.data());
            setDirty(false);
        }
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
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
      setDirty(false);
      setSaveBanner('ok');
      window.setTimeout(() => setSaveBanner(null), 1500);
      if (showMessage) toast.success("Taklit becerileri kaydedildi!");
      return true;
    } catch (error) {
      console.error("Taklit kaydetme hatası:", error);
      setSaveBanner('err');
      window.setTimeout(() => setSaveBanner(null), 2500);
      toast.error("Kaydetme hatası oluştu.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const setStatus = (itemCode: string, status: boolean) => {
    setFormData(prev => ({ ...prev, [itemCode]: prev[itemCode] === status ? null : status }));
    setDirty(true);
    setSaveBanner(null);
  };

  const handleSessionSave = async (success: boolean) => {
    if (success && activeMode === 'assessment' && activeItem) {
        const updatedData = { ...formData, [activeItem]: true };
        setFormData(updatedData);
        setDirty(true);
        const saved = await handleSave(updatedData, false);
        if (saved) toast.success("Tebrikler! Taklit seti başarıyla tamamlandı. 🎉");
    }
    setActiveItem(null);
    setActiveMode(null);
  };

  const calculateProgress = () => {
    if (items.length === 0) return 0;
    const completedCount = items.filter(item => formData[item] === true).length;
    return Math.round((completedCount / items.length) * 100);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;

  if (activeItem && activeMode) {
    const firstSpaceIndex = activeItem.indexOf(' ');
    const textOnly = activeItem.substring(firstSpaceIndex + 1);
    
    return (
      <TaklitSession 
        mode={activeMode}
        itemCode={activeItem}
        itemText={textOnly}
        onClose={() => { setActiveItem(null); setActiveMode(null); }}
        onSaveStatus={handleSessionSave}
      />
    );
  }

  return (
    <div className="space-y-6 relative">
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
                <h2 className="text-lg font-bold text-white">Taklit Becerileri</h2>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${calculateProgress()}%` }}></div>
                    </div>
                    <span>%{calculateProgress()} Tamamlandı</span>
                </div>
            </div>
        </div>
        <div className="flex min-w-[7.5rem] flex-col items-end gap-1">
          <Button onClick={() => handleSave()} disabled={isSaving} className="bg-green-600 hover:bg-green-500 h-8 text-xs disabled:opacity-60">
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

      <div className="grid gap-3 animate-in slide-in-from-bottom-4 pb-20">
        {items.map((item) => {
            const status = formData[item];
            const firstSpaceIndex = item.indexOf(' ');
            const code = item.substring(0, firstSpaceIndex);
            const text = item.substring(firstSpaceIndex + 1);
            const isPassed = status === true;
            const isFailed = status === false;

            return (
                <div key={item} className={twMerge(
                    "group p-4 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                    isPassed && "bg-green-950/15 border-green-500/15 opacity-45 hover:opacity-80",
                    isFailed && "bg-red-950/30 border-red-500/50 shadow-[0_0_0_1px_rgba(239,68,68,0.15)] hover:border-red-400/70 hover:bg-red-950/40",
                    !isPassed && !isFailed && "bg-slate-900/40 border-slate-800 hover:bg-slate-800 hover:border-slate-700"
                )}>
                    <div className="flex items-start gap-4 flex-1">
                        <div className={twMerge(
                            "min-w-[48px] h-10 rounded-lg flex items-center justify-center text-[10px] font-bold border mt-0.5 font-mono shrink-0",
                            isPassed && "bg-green-500/15 border-green-500/40 text-green-400/80",
                            isFailed && "bg-red-500/25 border-red-500 text-red-300",
                            !isPassed && !isFailed && "bg-slate-950 border-slate-700 text-slate-500"
                        )}>
                            {isPassed ? <Trophy size={18} /> : isFailed ? <XCircle size={18} /> : code}
                        </div>
                        <div>
                            <p className={twMerge(
                                "font-medium text-sm leading-relaxed",
                                isPassed && "text-green-100/70",
                                isFailed && "text-red-100",
                                !isPassed && !isFailed && "text-slate-200"
                            )}>{text}</p>
                            {isPassed && <span className="block text-[10px] text-green-500/60 font-semibold uppercase tracking-wider">Geçti · tekrar değerlendirilebilir</span>}
                            {isFailed && <span className="block text-[10px] text-red-400/90 font-semibold uppercase tracking-wider">Geçemedi · öncelikli</span>}
                            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              <Video size={12} /> Video Seti
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                        
                        <div className="flex items-center gap-1">
                            <button 
                              onClick={() => { setActiveItem(item); setActiveMode('instruction'); }} 
                              className="h-8 px-3 rounded-md bg-purple-600/90 text-white text-[10px] font-bold flex items-center gap-1 hover:bg-purple-500 border border-purple-400 shadow-sm transition-transform active:scale-95"
                            >
                              <GraduationCap size={14} /> Öğretim
                            </button>
                            <button 
                              onClick={() => { setActiveItem(item); setActiveMode('assessment'); }} 
                              className="h-8 px-3 rounded-md bg-blue-600/90 text-white text-[10px] font-bold flex items-center gap-1 hover:bg-blue-500 border border-blue-400 shadow-sm transition-transform active:scale-95"
                            >
                              <ClipboardCheck size={14} /> Test
                            </button>
                        </div>

                        <div className="flex items-center gap-1 ml-2">
                            <button 
                                onClick={() => setStatus(item, false)} 
                                className={twMerge("w-8 h-8 rounded-md border flex items-center justify-center transition-all active:scale-95", status === false ? "bg-red-500/20 border-red-500 text-red-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:text-red-400")}
                            >
                                <XCircle size={16} />
                            </button>
                            <button 
                                onClick={() => setStatus(item, true)} 
                                className={twMerge("w-8 h-8 rounded-md border flex items-center justify-center transition-all active:scale-95", status === true ? "bg-green-500/20 border-green-500 text-green-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:text-green-400")}
                            >
                                <CheckCircle2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
}
