import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2, CheckCircle2, XCircle, Trophy, Gamepad2, Play } from 'lucide-react';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';
import { ABA_MODULES } from '@/shared/abaData';

// --- OYUN IMPORTLARI ---
import AliciGame4 from '@/aba/Alici/AliciGame4';   // ADB 2.1 - İnsan Tanıma
import AliciGame15 from '@/aba/Alici/AliciGame15'; // ADB 4.2 - Tüm Vücut Bölümlerini Tanıma (YENİ)

interface AliciDilPageProps {
  studentId: string;
  onBack: () => void;
}

export default function AliciDilPage({ studentId, onBack }: AliciDilPageProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
   
  // Hangi oyunun açık olduğunu tutan state
  const [activeGameItem, setActiveGameItem] = useState<string | null>(null);

  // Modülü bul
  const moduleData = ABA_MODULES.find(m => m.name.includes("ALICI DİL BECERİLERİ"));
  const items = moduleData ? moduleData.achievements : [];

  useEffect(() => {
    const load = async () => {
      if (!studentId) return;
      try {
        const instId = localStorage.getItem("kazanim-takip-institution-id");
        if (instId) {
            const docSnap = await getDoc(doc(db, "institutions", instId, "students", studentId, "assessments", "aba"));
            if (docSnap.exists()) {
                setFormData(docSnap.data());
            }
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

  const handleSave = async () => {
    try {
      const instId = localStorage.getItem("kazanim-takip-institution-id");
      if (instId) {
          await setDoc(doc(db, "institutions", instId, "students", studentId, "assessments", "aba"), formData, { merge: true });
          toast.success("Alıcı Dil becerileri kaydedildi!");
      }
    } catch (error) {
      toast.error("Kaydetme hatası oluştu.");
    }
  };

  const setStatus = (itemCode: string, status: boolean) => {
    setFormData(prev => ({ 
        ...prev, 
        [itemCode]: prev[itemCode] === status ? null : status 
    }));
  };

  const calculateProgress = () => {
    if (items.length === 0) return 0;
    const completedCount = items.filter(item => formData[item] === true).length;
    return Math.round((completedCount / items.length) * 100);
  };

  const progress = calculateProgress();

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6 relative">
      
      {/* --- OYUN GÖSTERİM ALANI (MODAL) --- */}
      {activeGameItem && (
          <div className="fixed inset-0 z-[100] bg-white">
             
             {/* OYUN 1: ADB 2.1 İnsan Tanıma */}
             {(activeGameItem.includes("2.1") || activeGameItem.includes("İnsan Tanıma")) && (
                 <AliciGame4 onClose={() => setActiveGameItem(null)} />
             )}

             {/* OYUN 2: ADB 4.2 Tüm Vücut Bölümlerini Tanıma (YENİ EKLENDİ) */}
             {(activeGameItem.includes("4.2") || activeGameItem.includes("Tüm Vücut")) && (
                 <AliciGame15 onClose={() => setActiveGameItem(null)} />
             )}

          </div>
      )}

      {/* HEADER */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between sticky top-0 backdrop-blur-md z-10 shadow-lg">
        <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-400 hover:text-white">
                <ArrowLeft size={20} />
            </Button>
            <div>
                <h2 className="text-lg font-bold text-white">Alıcı Dil Becerileri</h2>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span>%{progress} Tamamlandı</span>
                </div>
            </div>
        </div>
        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 h-8 text-xs shadow-lg shadow-green-900/20">
            <Save className="mr-2 h-3.5 w-3.5" /> Kaydet
        </Button>
      </div>

      {/* LISTE */}
      <div className="grid gap-3 animate-in slide-in-from-bottom-4 duration-500 pb-20">
        {items.map((item) => {
            const status = formData[item];
            
            // Kod ve Metni güvenli ayırma
            const firstSpaceIndex = item.indexOf(' ');
            const code = item.substring(0, firstSpaceIndex); 
            const text = item.substring(firstSpaceIndex + 1);

            const isCompleted = status === true;

            // --- OYUN KONTROLÜ (GÜNCELLENDİ) ---
            // Hem 2.1 hem de 4.2 için oyun butonu aktif olacak
            const hasGame = 
                (item.includes("2.1") || item.includes("İnsan Tanıma")) ||
                (item.includes("4.2") || item.includes("Tüm Vücut"));

            return (
                <div 
                    key={item} 
                    className={twMerge(
                        "group p-4 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                        isCompleted 
                            ? "bg-green-950/10 border-green-500/20" 
                            : "bg-slate-900/40 border-slate-800 hover:bg-slate-800 hover:border-slate-700"
                    )}
                >
                    <div className="flex items-start gap-4 flex-1">
                        <div className={twMerge(
                            "min-w-[48px] h-10 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono border mt-0.5 px-1 text-center",
                            isCompleted ? "bg-green-500/20 border-green-500 text-green-400" : "bg-slate-950 border-slate-700 text-slate-500"
                        )}>
                            {isCompleted ? <Trophy size={18} /> : code}
                        </div>
                        <div>
                            <p className={twMerge("font-medium text-sm leading-relaxed", isCompleted ? "text-green-100" : "text-slate-200")}>
                                {text}
                            </p>
                            {/* İnteraktif Rozeti */}
                            {hasGame && (
                                <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    <Gamepad2 size={12} /> İnteraktif
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                        
                        {/* OYUN BUTONU */}
                        {hasGame && (
                            <button 
                                onClick={() => setActiveGameItem(item)}
                                className="h-9 px-4 rounded-lg bg-purple-600/90 text-white text-[10px] font-bold flex items-center gap-2 hover:bg-purple-500 border border-purple-400 shadow-sm transition-transform active:scale-95"
                            >
                                <Play size={14} fill="currentColor" /> OYUNA GİT
                            </button>
                        )}

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setStatus(item, false)}
                                className={twMerge(
                                    "flex items-center justify-center w-9 h-9 rounded-lg border transition-all active:scale-95",
                                    status === false 
                                        ? "bg-red-500/20 border-red-500 text-red-400" 
                                        : "bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-red-400"
                                )}
                                title="Yapamıyor"
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
                                title="Bağımsız Yapıyor"
                            >
                                <CheckCircle2 size={18} />
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
