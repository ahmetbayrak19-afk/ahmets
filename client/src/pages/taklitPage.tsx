import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2, CheckCircle2, XCircle, Trophy, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';
import { ABA_MODULES } from '@/shared/abaData';
import TaklitSession from '@/components/TaklitSession';

// --- VİDEO LİNKLERİ (Örnekler) ---
const VIDEOS = {
    NESNELI: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
    NESNESIZ: "https://www.w3schools.com/html/mov_bbb.mp4",
    AYNA: "https://media.w3.org/2010/05/sintel/trailer_hd.mp4",
    DEFAULT: "https://www.w3schools.com/html/mov_bbb.mp4"
};

interface TaklitPageProps {
  studentId: string;
  onBack: () => void;
}

export default function TaklitPage({ studentId, onBack }: TaklitPageProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  
  // Hangi kazanım değerlendiriliyor? (Null ise liste görünür)
  const [activeItem, setActiveItem] = useState<string | null>(null);

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

  const handleSave = async () => {
    try {
      const instId = localStorage.getItem("kazanim-takip-institution-id");
      await setDoc(doc(db, "institutions", instId!, "students", studentId, "assessments", "aba"), formData, { merge: true });
      toast.success("Taklit becerileri kaydedildi!");
    } catch (error) { toast.error("Hata oluştu."); }
  };

  const setStatus = (itemCode: string, status: boolean) => {
    setFormData(prev => ({ ...prev, [itemCode]: prev[itemCode] === status ? null : status }));
  };

  // Session ekranından gelen sonucu kaydet
  const handleSessionSave = (status: boolean) => {
    if (activeItem) setStatus(activeItem, status);
  };

  // Video Seçici
  const getVideoUrl = (itemString: string) => {
    const upper = itemString.toUpperCase();
    if (upper.includes("NESNELİ")) return VIDEOS.NESNELI;
    if (upper.includes("NESNESİZ")) return VIDEOS.NESNESIZ;
    if (upper.includes("AYNA")) return VIDEOS.AYNA;
    return VIDEOS.DEFAULT;
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;

  // --- 1. DEĞERLENDİRME MODU (KAMERA AÇIK) ---
  if (activeItem) {
    const firstSpaceIndex = activeItem.indexOf(' ');
    const textOnly = activeItem.substring(firstSpaceIndex + 1);
    
    return (
      <TaklitSession 
        itemCode={activeItem}
        itemText={textOnly}
        videoUrl={getVideoUrl(activeItem)}
        currentStatus={formData[activeItem]}
        onClose={() => setActiveItem(null)}
        onSaveStatus={handleSessionSave}
      />
    );
  }

  // --- 2. LİSTE MODU ---
  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between sticky top-0 backdrop-blur-md z-10 shadow-lg">
        <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-400 hover:text-white">
                <ArrowLeft size={20} />
            </Button>
            <h2 className="text-lg font-bold text-white">Taklit Becerileri</h2>
        </div>
        <Button onClick={handleSave} className="bg-green-600 h-8 text-xs"><Save className="mr-2 h-3.5 w-3.5" /> Kaydet</Button>
      </div>

      <div className="grid gap-3 animate-in slide-in-from-bottom-4 pb-20">
        {items.map((item) => {
            const status = formData[item];
            const firstSpaceIndex = item.indexOf(' ');
            const code = item.substring(0, firstSpaceIndex);
            const text = item.substring(firstSpaceIndex + 1);
            const isCompleted = status === true;

            // İlk 3 madde için Değerlendir butonu görünsün (İstersen filtreyi kaldırıp hepsine açabilirsin)
            // Şu an hepsinde açık bıraktım ki test edebilesin.
            const showEvaluateButton = true; 

            return (
                <div key={item} className={twMerge("group p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4", isCompleted ? "bg-green-950/10 border-green-500/20" : "bg-slate-900/40 border-slate-800")}>
                    <div className="flex items-start gap-4">
                        <div className={twMerge("min-w-[48px] h-10 rounded-lg flex items-center justify-center text-[10px] font-bold border mt-0.5", isCompleted ? "bg-green-500/20 border-green-500 text-green-400" : "bg-slate-950 border-slate-700 text-slate-500")}>
                            {isCompleted ? <Trophy size={18} /> : code}
                        </div>
                        <p className={twMerge("font-medium text-sm", isCompleted ? "text-green-100" : "text-slate-200")}>{text}</p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                        
                        {/* --- 🔥 YENİ DEĞERLENDİR BUTONU 🔥 --- */}
                        {showEvaluateButton && (
                            <Button 
                                onClick={() => setActiveItem(item)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white h-9 px-3 rounded-lg mr-2 shadow-lg shadow-indigo-500/20 flex items-center gap-2 active:scale-95 transition-all"
                            >
                                <Camera size={16} />
                                <span className="text-[10px] font-bold tracking-wider hidden sm:inline">DEĞERLENDİR</span>
                                {/* Mobilde sadece ikon, tablette yazı da görünür */}
                            </Button>
                        )}
                        {/* ------------------------------------------- */}

                        <button 
                            onClick={() => setStatus(item, false)} 
                            className={twMerge("w-9 h-9 rounded-lg border flex items-center justify-center transition-all active:scale-95", status === false ? "bg-red-500/20 border-red-500 text-red-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:text-red-400")}
                        >
                            <XCircle size={18} />
                        </button>
                        
                        <button 
                            onClick={() => setStatus(item, true)} 
                            className={twMerge("w-9 h-9 rounded-lg border flex items-center justify-center transition-all active:scale-95", status === true ? "bg-green-500/20 border-green-500 text-green-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:text-green-400")}
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
