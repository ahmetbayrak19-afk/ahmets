import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, PenTool, Lock, CheckCircle2, 
  ClipboardList, Layers, Trophy, Play
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';

// AŞAMALAR (HEPSİ ARTIK AÇIK - ACTIVE)
const STAGES = [
  {
    id: 'assessment',
    title: "Değerlendirme",
    subtitle: "Hazırbulunuşluk ve Seviye Tespiti",
    description: "Öğrencinin ses, hece ve harf bilgisini ölçerek uygun seviyeyi belirler.",
    icon: ClipboardList,
    status: 'active', // AÇIK
    color: 'text-pink-400',
    borderColor: 'border-pink-500',
    bgGlow: 'bg-pink-500/20'
  },
  {
    id: 'level-1',
    title: "1. Seviye",
    subtitle: "Sesli Harfler ve Temel Heceler",
    description: "A, E, I, İ... ve Ba, Sa, Ra, Ma, Ka grubu çalışmaları.",
    icon: Layers,
    status: 'active', // AÇIK
    color: 'text-blue-400',
    borderColor: 'border-blue-500',
    bgGlow: 'bg-blue-500/20'
  },
  {
    id: 'level-2',
    title: "2. Seviye",
    subtitle: "İleri Heceler ve Birleştirme",
    description: "Ça, Ta, Na... grupları ve hece birleştirme çalışmaları.",
    icon: Layers,
    status: 'active', // AÇIK
    color: 'text-purple-400',
    borderColor: 'border-purple-500',
    bgGlow: 'bg-purple-500/20'
  },
  {
    id: 'level-3',
    title: "3. Seviye",
    subtitle: "Kelime, Cümle ve Metin",
    description: "Akıcı okuma ve yazma çalışmaları.",
    icon: Trophy,
    status: 'active', // AÇIK
    color: 'text-yellow-400',
    borderColor: 'border-yellow-500',
    bgGlow: 'bg-yellow-500/20'
  }
];

export default function OkumayazmaAssessmentPage() {
  const [match, params] = useRoute('/okuma-yazma-assessment/:id');
  const studentId = params?.id;
  const [_, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);

  // URL'den metod bilgisini çek
  const urlParams = new URLSearchParams(window.location.search);
  const method = urlParams.get('method') || 'hece';

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    if (studentId) {
      setLocation(`/assessment/${studentId}`);
    } else {
      setLocation('/home');
    }
  };

  // TIKLAMA YÖNETİMİ (GÜNCELLENDİ)
  const handleStageClick = (stageId: string) => {
    if (!studentId) return;

    // İlgili sayfalara yönlendirme yapıyoruz
    if (stageId === 'assessment') {
        setLocation(`/okuyaz/degerlendirme/${studentId}`);
    } 
    else if (stageId === 'level-1') {
        setLocation(`/okuyaz/seviye1/${studentId}`);
    } 
    else if (stageId === 'level-2') {
        setLocation(`/okuyaz/seviye2/${studentId}`);
    } 
    else if (stageId === 'level-3') {
        setLocation(`/okuyaz/seviye3/${studentId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 font-sans flex flex-col">
      
      {/* HEADER */}
      <div className="max-w-3xl mx-auto w-full mb-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between sticky top-0 backdrop-blur-md z-10 shadow-lg">
            <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBack} 
                  className="text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <PenTool className="text-pink-400 w-5 h-5" />
                      Okuma Yazma Süreci
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-pink-300 border border-pink-500/20 uppercase font-bold tracking-wider text-[10px]">
                          {method === 'hece' ? 'Hece Yöntemi' : 'Ses Yöntemi'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* AŞAMA LİSTESİ */}
      <div className="max-w-3xl mx-auto w-full space-y-4 pb-20">
        
        {STAGES.map((stage, index) => (
            <div 
                key={stage.id}
                onClick={() => handleStageClick(stage.id)}
                className={twMerge(
                    "relative group p-1 rounded-2xl border transition-all duration-300 cursor-pointer hover:scale-[1.01]",
                    `bg-slate-900 ${stage.borderColor} shadow-[0_0_20px_rgba(0,0,0,0.1)] hover:shadow-[0_0_30px_rgba(0,0,0,0.2)]`
                )}
            >
                {/* Glow Efekti */}
                <div className={`absolute inset-0 ${stage.bgGlow} blur-xl rounded-2xl -z-10 opacity-30 group-hover:opacity-60 transition-opacity`}></div>

                <div className="flex items-center p-5 gap-5">
                    
                    {/* İkon Kutusu */}
                    <div className={twMerge(
                        "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner transition-colors",
                        `${stage.bgGlow} ${stage.color} ${stage.borderColor}`
                    )}>
                        <stage.icon size={24} />
                    </div>

                    {/* Metinler */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={twMerge(
                                "text-xs font-bold px-2 py-0.5 rounded border uppercase tracking-wider bg-white text-black border-white"
                            )}>
                                {index + 1}. Adım
                            </span>
                        </div>
                        <h4 className="text-lg font-bold text-white">
                            {stage.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 group-hover:text-slate-200 transition-colors">
                            {stage.description}
                        </p>
                    </div>

                    {/* Sağ Buton (Play) */}
                    <div>
                        <div className={twMerge(
                            "h-10 w-10 rounded-full flex items-center justify-center transition-all bg-white text-black shadow-lg group-hover:bg-pink-50"
                        )}>
                            <Play size={18} fill="currentColor" className="ml-0.5" />
                        </div>
                    </div>
                </div>
            </div>
        ))}

      </div>
    </div>
  );
}
