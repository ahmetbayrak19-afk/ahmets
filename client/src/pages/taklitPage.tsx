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
        }
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    load();
  }, [studentId]);

  const handleSave = async (newData?: Record<string, any>) => {
    try {
      const instId = localStorage.getItem("kazanim-takip-institution-id");
      const dataToSave = newData || formData;
      if (instId) {
          await setDoc(doc(db, "institutions", instId, "students", studentId, "assessments", "aba"), dataToSave, { merge: true });
          if (!newData) toast.success("Taklit becerileri kaydedildi!");
      }
    } catch (error) { toast.error("Hata oluştu."); }
  };

  const setStatus = (itemCode: string, status: boolean) => {
    setFormData(prev => ({ ...prev, [itemCode]: prev[itemCode] === status ? null : status }));
  };

  const handleSessionSave = async (success: boolean) => {
    if (success && activeMode === 'assessment' && activeItem) {
        const updatedData = { ...formData, [activeItem]: true };
        setFormData(updatedData);
        await handleSave(updatedData);
        toast.success("Tebrikler! Taklit seti başarıyla tamamlandı. 🎉");
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
            <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-400 hover:text-white">
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
        <Button onClick={() => handleSave()} className="bg-green-600 hover:bg-green-500 h-8 text-xs">
          <Save className="mr-2 h-3.5 w-3.5" /> Kaydet
        </Button>
      </div>

      <div className="grid gap-3 animate-in slide-in-from-bottom-4 pb-20">
        {items.map((item) => {
            const status = formData[item];
            const firstSpaceIndex = item.indexOf(' ');
            const code = item.substring(0, firstSpaceIndex);
            const text = item.substring(firstSpaceIndex + 1);
            const isCompleted = status === true;

            return (
                <div key={item} className={twMerge("group p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4", isCompleted ? "bg-green-950/10 border-green-500/20" : "bg-slate-900/40 border-slate-800 hover:bg-slate-800")}>
                    <div className="flex items-start gap-4 flex-1">
                        <div className={twMerge("min-w-[48px] h-10 rounded-lg flex items-center justify-center text-[10px] font-bold border mt-0.5 font-mono", isCompleted ? "bg-green-500/20 border-green-500 text-green-400" : "bg-slate-950 border-slate-700 text-slate-500")}>
                            {isCompleted ? <Trophy size={18} /> : code}
                        </div>
                        <div>
                            <p className={twMerge("font-medium text-sm leading-relaxed", isCompleted ? "text-green-100" : "text-slate-200")}>{text}</p>
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
