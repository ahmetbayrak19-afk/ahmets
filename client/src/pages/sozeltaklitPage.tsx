import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2, CheckCircle2, XCircle, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';
import { ABA_MODULES } from '@/shared/abaData';

interface SozelTaklitPageProps {
  studentId: string;
  onBack: () => void;
}

export default function SozelTaklitPage({ studentId, onBack }: SozelTaklitPageProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  
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
      } catch (error) {
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
      await setDoc(doc(db, "institutions", instId!, "students", studentId, "assessments", "aba"), formData, { merge: true });
      toast.success("Değişiklikler kaydedildi.");
    } catch (error) {
      toast.error("Kaydetme hatası.");
    }
  };

  const setStatus = (itemString: string, status: boolean) => {
    // Varsa sil (null yap), yoksa yeni durumu ata (toggle mantığı)
    setFormData(prev => ({ ...prev, [itemString]: prev[itemString] === status ? null : status }));
  };

  const calculateProgress = () => {
    if (items.length === 0) return 0;
    const completedCount = items.filter(item => formData[item] === true).length;
    return Math.round((completedCount / items.length) * 100);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6 relative">
      
      {/* HEADER */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between sticky top-0 backdrop-blur-md z-10 shadow-lg">
        <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-400 hover:text-white"><ArrowLeft size={20} /></Button>
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
        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 h-8 text-xs"><Save className="mr-2 h-3.5 w-3.5" /> Kaydet</Button>
      </div>

      {/* LİSTE */}
      <div className="grid gap-3 animate-in slide-in-from-bottom-4 duration-500 pb-20">
        {items.map((item) => {
            const status = formData[item];
            const isCompleted = status === true;
            
            // "ST 1.1. " kısmını ayıklama
            const firstSpaceIndex = item.indexOf(' ');
            const secondSpaceIndex = item.indexOf(' ', firstSpaceIndex + 1);
            // ST 1.1. formatı olduğu için 2. boşluğa kadar alabiliriz veya basitçe ilk boşluktan sonrasını metin sayabiliriz.
            // Senin formatında: "ST 1.1. Ses Taklidi" -> Kod: "ST 1.1.", Metin: "Ses Taklidi"
            
            // Kod kısmı (ST 1.1.)
            const codePart = item.substring(0, secondSpaceIndex > -1 ? secondSpaceIndex : firstSpaceIndex);
            // Metin kısmı
            const textPart = item.substring(secondSpaceIndex > -1 ? secondSpaceIndex + 1 : firstSpaceIndex + 1);
            
            return (
                <div key={item} className={twMerge("group p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4", isCompleted ? "bg-green-950/10 border-green-500/20" : "bg-slate-900/40 border-slate-800 hover:bg-slate-800")}>
                    <div className="flex items-start gap-4 flex-1">
                        <div className={twMerge("min-w-[60px] h-10 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono border", isCompleted ? "bg-green-500/20 border-green-500 text-green-400" : "bg-slate-950 border-slate-700 text-slate-500")}>
                            {isCompleted ? <Trophy size={18} /> : codePart}
                        </div>
                        <div>
                            <p className={twMerge("font-medium text-sm leading-relaxed", isCompleted ? "text-green-100" : "text-slate-200")}>
                                {textPart || item} {/* Eğer parse edemezse düz item'ı bas */}
                            </p>
                        </div>
                    </div>
                    
                    {/* BUTON GRUBU */}
                    <div className="flex items-center gap-1">
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
