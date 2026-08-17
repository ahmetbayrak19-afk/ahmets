import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2, CheckCircle2, XCircle, Trophy, Gamepad2, GraduationCap, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';
import { ABA_MODULES } from '@/shared/abaData';
import Talk from './talk';

// --- OYUN IMPORT ---
import IfadeEdiciGame15 from '@/aba/ifade/ifadeEdiciGame15';
import IfadeEdiciGame14 from '@/aba/ifade/ifadeEdiciGame14'; // ✅ 1. OYUN EKLENDİ
import IfadeEdiciGame13 from '@/aba/ifade/ifadeEdiciGame13';

interface IfadeEdiciDilPageProps {
  studentId: string;
  onBack: () => void;
}

export default function IfadeEdiciDilPage({ studentId, onBack }: IfadeEdiciDilPageProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState<'ok' | 'err' | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  // Talk sayfasını kontrol eden state
  const [showTolkido, setShowTolkido] = useState(false);

  // Oyun Durumları
  const [activeGameMode, setActiveGameMode] = useState<'assessment' | 'instruction' | null>(null);
  const [activeGameItem, setActiveGameItem] = useState<string | null>(null);

  // Modül ve Kazanım verilerini çekme
  const moduleData = ABA_MODULES.find(m => m.name.includes("İFADE EDİCİ DİL"));
  const items = moduleData ? moduleData.achievements : [];

  useEffect(() => {
    const load = async () => {
      if (!studentId) {
        setLoading(false);
        return;
      }

      try {
        const instId = localStorage.getItem("kazanim-takip-institution-id");
        if (instId) {
          const docSnap = await getDoc(doc(db, "institutions", instId, "students", studentId, "assessments", "aba"));
          if (docSnap.exists()) {
            setFormData(docSnap.data());
          }
          setDirty(false);
        }
      } catch (error) {
        console.error("Veri çekme hatası:", error);
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
      await setDoc(
        doc(db, "institutions", instId, "students", studentId, "assessments", "aba"),
        dataToSave,
        { merge: true }
      );
      setDirty(false);
      setSaveBanner('ok');
      window.setTimeout(() => setSaveBanner(null), 1500);
      if (showMessage) toast.success("İfade Edici Dil becerileri kaydedildi!");
      return true;
    } catch (error) {
      console.error("İfade edici dil kaydetme hatası:", error);
      setSaveBanner('err');
      window.setTimeout(() => setSaveBanner(null), 2500);
      toast.error("Kaydetme hatası oluştu.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const setStatus = (itemCode: string, status: boolean) => {
    setFormData(prev => ({
      ...prev,
      [itemCode]: prev[itemCode] === status ? null : status
    }));
    setDirty(true);
    setSaveBanner(null);
  };

  // Oyun Tamamlandığında Çalışacak Fonksiyon
  const handleGameComplete = async (success: boolean) => {
    if (success && activeGameMode === 'assessment' && activeGameItem) {
      const updatedData = { ...formData, [activeGameItem]: true };
      setFormData(updatedData);
      setDirty(true);
      const saved = await handleSave(updatedData, false);
      if (saved) toast.success("Tebrikler! Kazanım tamamlandı. 🎉");
    }
    setActiveGameMode(null);
    setActiveGameItem(null);
  };

  const calculateProgress = () => {
    if (items.length === 0) return 0;
    const completedCount = items.filter(item => formData[item] === true).length;
    return Math.round((completedCount / items.length) * 100);
  };

  const progress = calculateProgress();

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;

  // 1. TOLKİDO MODU KONTROLÜ
  if (showTolkido) {
    return (
      <Talk
        onBack={() => setShowTolkido(false)}
        studentId={studentId}
      />
    );
  }

  // 2. OYUN MODU KONTROLÜ (İEDB 3.5 / 3.6 / 3.7)
  if (activeGameMode && activeGameItem) {
    if (activeGameItem.startsWith("İEDB 3.5")) {
      return (
        <IfadeEdiciGame13
          studentId={studentId}
          mode={activeGameMode}
          onClose={() => { setActiveGameMode(null); setActiveGameItem(null); }}
          onComplete={handleGameComplete}
        />
      );
    }

    // ✅ 2. YENİ OYUNUN YÖNLENDİRMESİ EKLENDİ (Kodu kendi listene göre düzenle)
    if (activeGameItem.startsWith("İEDB 3.6")) { 
      return (
        <IfadeEdiciGame14
          studentId={studentId}
          mode={activeGameMode}
          onClose={() => { setActiveGameMode(null); setActiveGameItem(null); }}
          onComplete={handleGameComplete}
        />
      );
    }

    if (activeGameItem.startsWith("İEDB 3.7")) {
      return (
        <IfadeEdiciGame15
          studentId={studentId}
          mode={activeGameMode}
          onClose={() => { setActiveGameMode(null); setActiveGameItem(null); }}
          onComplete={handleGameComplete}
        />
      );
    }
  }

  // 3. ANA LİSTE GÖRÜNÜMÜ
  return (
    <div className="space-y-6">
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
            <h2 className="text-lg font-bold text-white">İfade Edici Dil Becerileri</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
              <span>%{progress} Tamamlandı</span>
            </div>
          </div>
        </div>
        <div className="flex min-w-[7.5rem] flex-col items-end gap-1">
          <Button onClick={() => handleSave()} disabled={isSaving} className="bg-green-600 hover:bg-green-700 h-8 text-xs shadow-lg shadow-green-900/20 disabled:opacity-60">
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

      {/* LISTE */}
      <div className="grid gap-3 animate-in slide-in-from-bottom-4 duration-500 pb-20">
        {items.map((item) => {
          const status = formData[item];
          const firstSpaceIndex = item.indexOf(' ');
          const code = item.substring(0, firstSpaceIndex);
          const text = item.substring(firstSpaceIndex + 1);
          const isCompleted = status === true;

          const isTolkidoItem = item.includes("TOLKİDO");
          
          // ✅ 3. BUTONLARIN GÖRÜNMESİ İÇİN 3.6 BURAYA DA EKLENDİ
          const hasGame = item.startsWith("İEDB 3.5") || item.startsWith("İEDB 3.6") || item.startsWith("İEDB 3.7");

          return (
            <div
              key={item}
              className={twMerge(
                "group p-4 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                isCompleted
                  ? "bg-green-950/10 border-green-500/20"
                  : "bg-slate-950 border-slate-800 hover:bg-slate-800 hover:border-slate-700"
              )}
            >
              <div className="flex items-start gap-4 flex-1">
                <div
                  className={twMerge(
                    "min-w-[48px] h-10 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono border mt-0.5 px-1 text-center",
                    isCompleted ? "bg-green-500/20 border-green-500 text-green-400" : "bg-slate-950 border-slate-700 text-slate-500"
                  )}
                >
                  {isCompleted ? <Trophy size={18} /> : code}
                </div>
                <div>
                  <p className={twMerge("font-medium text-sm leading-relaxed", isCompleted ? "text-green-100" : "text-slate-200")}>
                    {text}
                  </p>
                  {hasGame && (
                    <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Gamepad2 size={12} /> İnteraktif
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {/* OYUN BUTONLARI */}
                {hasGame && (
                  <div className="flex items-center gap-1 mr-2">
                    <button
                      onClick={() => { setActiveGameItem(item); setActiveGameMode('instruction'); }}
                      className="h-8 px-3 rounded-md bg-purple-600/20 text-purple-400 text-[10px] font-bold flex items-center gap-1 hover:bg-purple-600/40 border border-purple-500/50 transition-all"
                    >
                      <GraduationCap size={14} /> Öğretim
                    </button>
                    <button
                      onClick={() => { setActiveGameItem(item); setActiveGameMode('assessment'); }}
                      className="h-8 px-3 rounded-md bg-blue-600/20 text-blue-400 text-[10px] font-bold flex items-center gap-1 hover:bg-blue-600/40 border border-blue-500/50 transition-all"
                    >
                      <ClipboardCheck size={14} /> Test
                    </button>
                  </div>
                )}

                {/* TOLKİDO ÖZEL BUTONU */}
                {isTolkidoItem && (
                  <button
                    onClick={() => setShowTolkido(true)}
                    className="flex items-center justify-center w-9 h-9 rounded-lg border bg-orange-500/20 border-orange-500 text-orange-400 hover:bg-orange-500/40 transition-all mr-1"
                  >
                    <Gamepad2 size={18} />
                  </button>
                )}

                <button
                  onClick={() => setStatus(item, false)}
                  className={twMerge(
                    "flex items-center justify-center w-9 h-9 rounded-lg border transition-all active:scale-95",
                    status === false
                      ? "bg-red-500/20 border-red-500 text-red-400"
                      : "bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-red-400"
                  )}
                >
                  <XCircle size={18} />
                </button>

                <button
                  onClick={() => setStatus(item, true)}
                  className={twMerge(
                    "flex items-center justify-center w-9 h-9 rounded-lg border transition-all active:scale-95",
                    status === true
                      ? "bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                      : "bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-green-400 hover:border-green-500/50"
                  )}
                >
                  <CheckCircle2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
