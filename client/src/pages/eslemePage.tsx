import { useState, useEffect } from 'react';
import { db } from '@/firebase'; 
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2, CheckCircle2, XCircle, Trophy, Gamepad2, GraduationCap, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';
import { ABA_MODULES } from '@/shared/abaData';

// --- MEVCUT OYUN DOSYALARI ---
import NesneEslemeGame1 from '@/aba/esle/NesneEslemeGame1';   // EB.1.1
import NesneEslemeGame2 from '@/aba/esle/NesneEslemeGame2';   // EB.1.2
import NesneEslemeGame3 from '@/aba/esle/NesneEslemeGame3';   // EB.1.3
import NesneEslemeGame4 from '@/aba/esle/NesneEslemeGame4';   // EB.1.4
import NesneEslemeGame9 from '@/aba/esle/NesneEslemeGame9';   // EB.2.5 (Renk)
import NesneEslemeGame10 from '@/aba/esle/NesneEslemeGame10'; // EB.3.1 (Şekil)
import NesneEslemeGame11 from '@/aba/esle/NesneEslemeGame11'; // EB.3.2 (Rakam)
import NesneEslemeGame12 from '@/aba/esle/NesneEslemeGame12'; // EB.3.3 (Harf)
import NesneEslemeGame13 from '@/aba/esle/NesneEslemeGame13'; // EB.3.4 (Gölge)
import NesneEslemeGame15 from '@/aba/esle/NesneEslemeGame15'; // EB.4.1 (Kelime-Kelime)
import NesneEslemeGame16 from '@/aba/esle/NesneEslemeGame16'; // EB.4.2 (Klavye/Harf)

// --- ÖYKÜ EŞLEME OYUNU ---
import NesneEslemeGame23 from '@/aba/esle/NesneEslemeGame23'; // EB.4.9 (Öykü)

// --- GEÇİCİ/EK OYUN (EB.2.1 için) ---
import EslemeGame from '@/aba/esle/game/eslemegame'; 

interface EslemePageProps {
  studentId: string;
  onBack: () => void;
}

export default function EslemePage({ studentId, onBack }: EslemePageProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  
  const [activeGameMode, setActiveGameMode] = useState<'assessment' | 'instruction' | null>(null);
  const [activeGameItem, setActiveGameItem] = useState<string | null>(null);

  // Modül Verisi
  const moduleData = ABA_MODULES.find(m => m.name.includes("EŞLEME BECERİLERİ"));
  const items = moduleData ? moduleData.achievements : [];

  useEffect(() => {
    const load = async () => {
      if (!studentId) return;
      try {
        const instId = localStorage.getItem("kazanim-takip-institution-id");
        if (instId) {
            const docSnap = await getDoc(doc(db, "institutions", instId, "students", studentId, "assessments", "aba"));
            if (docSnap.exists()) setFormData(docSnap.data());
        }
      } catch (error) {
        toast.error("Veri yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  const handleSave = async (newData?: Record<string, any>) => {
    try {
      const instId = localStorage.getItem("kazanim-takip-institution-id");
      const dataToSave = newData || formData;
      if (instId) {
          await setDoc(doc(db, "institutions", instId, "students", studentId, "assessments", "aba"), dataToSave, { merge: true });
          if (!newData) toast.success("Değişiklikler kaydedildi.");
      }
    } catch (error) {
      toast.error("Kaydetme hatası.");
    }
  };

  const setStatus = (itemString: string, status: boolean) => {
    setFormData(prev => ({ ...prev, [itemString]: prev[itemString] === status ? null : status }));
  };

  const handleGameComplete = async (success: boolean) => {
    if (success && activeGameMode === 'assessment' && activeGameItem) {
        const updatedData = { ...formData, [activeGameItem]: true };
        setFormData(updatedData);
        await handleSave(updatedData);
        toast.success("Tebrikler! Kazanım tamamlandı. 🎉");
    }
    setActiveGameMode(null);
    setActiveGameItem(null);
  };

  const calculateProgress = () => {
    if (items.length === 0) return 0;
    const completedCount = items.filter(item => formData[item] === true).length;
    return Math.round((completedCount / items.length) * 100);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6 relative">
      
      {/* --- OYUN MODALLARI --- */}
      {activeGameMode && activeGameItem && (
          <>
            {activeGameItem.startsWith("EB.1.1") && <NesneEslemeGame1 mode={activeGameMode} onClose={() => setActiveGameMode(null)} onComplete={handleGameComplete} />}
            {activeGameItem.startsWith("EB.1.2") && <NesneEslemeGame2 mode={activeGameMode} onClose={() => setActiveGameMode(null)} onComplete={handleGameComplete} />}
            {activeGameItem.startsWith("EB.1.3") && <NesneEslemeGame3 mode={activeGameMode} onClose={() => setActiveGameMode(null)} onComplete={handleGameComplete} />}
            {activeGameItem.startsWith("EB.1.4") && <NesneEslemeGame4 mode={activeGameMode} onClose={() => setActiveGameMode(null)} onComplete={handleGameComplete} />}
            {activeGameItem.startsWith("EB.2.1") && <div className="fixed inset-0 z-[100] bg-white"><EslemeGame onClose={() => setActiveGameMode(null)} /></div>}
            {activeGameItem.startsWith("EB.2.5") && <NesneEslemeGame9 mode={activeGameMode} onClose={() => setActiveGameMode(null)} onComplete={handleGameComplete} />}
            {activeGameItem.startsWith("EB.3.1") && <NesneEslemeGame10 mode={activeGameMode} onClose={() => setActiveGameMode(null)} onComplete={handleGameComplete} />}
            {activeGameItem.startsWith("EB.3.2") && <NesneEslemeGame11 mode={activeGameMode} onClose={() => setActiveGameMode(null)} onComplete={handleGameComplete} />}
            {activeGameItem.startsWith("EB.3.3") && <NesneEslemeGame12 mode={activeGameMode} onClose={() => setActiveGameMode(null)} onComplete={handleGameComplete} />}
            {activeGameItem.startsWith("EB.3.4") && <NesneEslemeGame13 mode={activeGameMode} onClose={() => setActiveGameMode(null)} onComplete={handleGameComplete} />}
            
            {/* EB.4.1. Kelime-Kelime */}
            {activeGameItem.startsWith("EB.4.1.") && (
                <NesneEslemeGame15 mode={activeGameMode} onClose={() => setActiveGameMode(null)} onComplete={handleGameComplete} />
            )}
            
            {/* EB.4.2. Klavye */}
            {activeGameItem.startsWith("EB.4.2") && (
                <NesneEslemeGame16 mode={activeGameMode} onClose={() => setActiveGameMode(null)} onComplete={handleGameComplete} />
            )}

            {/* 🔥 DÜZELTİLDİ: EB.4.9 - Öykü Eşleme 🔥 */}
            {activeGameItem.startsWith("EB.4.9") && (
               <div className="fixed inset-0 z-[100] bg-white">
                 <NesneEslemeGame23 onClose={() => setActiveGameMode(null)} />
               </div>
            )}
          </>
      )}

      {/* HEADER */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between sticky top-0 backdrop-blur-md z-10 shadow-lg">
        <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-400 hover:text-white"><ArrowLeft size={20} /></Button>
            <div>
                <h2 className="text-lg font-bold text-white">Eşleme Becerileri</h2>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${calculateProgress()}%` }}></div>
                    </div>
                    <span>%{calculateProgress()} Tamamlandı</span>
                </div>
            </div>
        </div>
        <Button onClick={() => handleSave()} className="bg-green-600 hover:bg-green-700 h-8 text-xs"><Save className="mr-2 h-3.5 w-3.5" /> Kaydet</Button>
      </div>

      {/* LİSTE */}
      <div className="grid gap-3 animate-in slide-in-from-bottom-4 duration-500 pb-20">
        {items.map((item) => {
            const status = formData[item];
            const isCompleted = status === true;
            
            // --- OYUN BUTONU KONTROLÜ ---
            const hasGame = 
                item.startsWith("EB.1.1") || item.startsWith("EB.1.2") || 
                item.startsWith("EB.1.3") || item.startsWith("EB.1.4") ||
                item.startsWith("EB.2.1") || item.startsWith("EB.2.5") ||
                item.startsWith("EB.3.1") || item.startsWith("EB.3.2") ||
                item.startsWith("EB.3.3") || item.startsWith("EB.3.4") ||
                item.startsWith("EB.4.1.") || 
                item.startsWith("EB.4.2") ||
                item.startsWith("EB.4.9"); // 🔥 Düzeltildi: EB.4.9
            
            const firstSpaceIndex = item.indexOf(' ');
            const code = item.substring(0, firstSpaceIndex);
            const desc = item.substring(firstSpaceIndex + 1);
            
            return (
                <div key={item} className={twMerge("group p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4", isCompleted ? "bg-green-950/10 border-green-500/20" : "bg-slate-900/40 border-slate-800 hover:bg-slate-800")}>
                    <div className="flex items-start gap-4 flex-1">
                        <div className={twMerge("min-w-[48px] h-10 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono border", isCompleted ? "bg-green-500/20 border-green-500 text-green-400" : "bg-slate-950 border-slate-700 text-slate-500")}>
                            {isCompleted ? <Trophy size={18} /> : code}
                        </div>
                        <div>
                            <p className={twMerge("font-medium text-sm leading-relaxed", isCompleted ? "text-green-100" : "text-slate-200")}>{desc}</p>
                            {hasGame && <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20"><Gamepad2 size={12} /> İnteraktif</span>}
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                        {hasGame && (
                            <div className="flex items-center gap-1">
                                <button onClick={() => { setActiveGameItem(item); setActiveGameMode('instruction'); }} className="h-8 px-3 rounded-md bg-purple-600/90 text-white text-[10px] font-bold flex items-center gap-1 hover:bg-purple-500 border border-purple-400 shadow-sm transition-transform active:scale-95"><GraduationCap size={14} /> Öğretim</button>
                                <button onClick={() => { setActiveGameItem(item); setActiveGameMode('assessment'); }} className="h-8 px-3 rounded-md bg-blue-600/90 text-white text-[10px] font-bold flex items-center gap-1 hover:bg-blue-500 border border-blue-400 shadow-sm transition-transform active:scale-95"><ClipboardCheck size={14} /> Test</button>
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                             <button onClick={() => setStatus(item, false)} className={twMerge("w-8 h-8 rounded-md border flex items-center justify-center", status === false ? "bg-red-500/20 border-red-500 text-red-400" : "bg-slate-950 border-slate-800 text-slate-500")}><XCircle size={16} /></button>
                             <button onClick={() => setStatus(item, true)} className={twMerge("w-8 h-8 rounded-md border flex items-center justify-center", status === true ? "bg-green-500/20 border-green-500 text-green-400" : "bg-slate-950 border-slate-800 text-slate-500")}><CheckCircle2 size={16} /></button>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
}
