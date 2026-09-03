import { useState, useEffect } from 'react';
import { formatStudentName } from '@/lib/studentName';
import { useLocation, useRoute } from 'wouter';
import { useStudentData } from '@/hooks/useStudentData';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, ClipboardList, LayoutGrid, Construction, Gift, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { ABA_MODULES } from '@/shared/abaData';

// --- SAYFA IMPORTLARI ---
import EslemePage from './eslemePage';
import AliciDilPage from './alicidilPage';
import YonergeTakipPage from './yonergetakipPage';
import TaklitPage from './taklitPage';
import SozelTaklitPage from './sozeltaklitPage';
import IfadeEdiciDilPage from './ifadeedicidilPage';
import OrtakDikkatPage from './ortakdikkatPage';
import Pekistirec from '@/aba/ortakdikkat/pekistirec';
import LogoLoader from '@/components/LogoLoader';

interface ReinforcerProfile {
  rankings?: Array<{
    id: string;
    name: string;
    rank: number;
  }>;
}

export default function AbaAssessmentPage() {
  const [match, params] = useRoute('/aba-assessment/:id');
  const studentId = params?.id;
  const [_, setLocation] = useLocation();
  const { students } = useStudentData();
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [reinforcerProfile, setReinforcerProfile] = useState<ReinforcerProfile | null>(null);
  const [showReinforcerPage, setShowReinforcerPage] = useState(false);
  
  const [activeModuleIndex, setActiveModuleIndex] = useState<number | null>(null);

  const student = students.find(s => s.id === studentId);

  useEffect(() => {
    const load = async () => {
      if (!studentId) return;
      const instId = localStorage.getItem("kazanim-takip-institution-id");
      if (!instId) {
        setLoading(false);
        return;
      }

      try {
        const [assessmentSnap, reinforcerSnap] = await Promise.all([
          getDoc(doc(db, "institutions", instId, "students", studentId, "assessments", "aba")),
          getDoc(doc(db, "institutions", instId, "students", studentId, "profiles", "abaReinforcers")),
        ]);

        if (assessmentSnap.exists()) setFormData(assessmentSnap.data());
        setReinforcerProfile(reinforcerSnap.exists() ? reinforcerSnap.data() as ReinforcerProfile : null);
      } catch (error) {
        console.error("ABA verileri yüklenemedi:", error);
        toast.error("ABA verileri yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  const handleReinforcerBack = async () => {
    setShowReinforcerPage(false);

    const instId = localStorage.getItem("kazanim-takip-institution-id");
    if (!instId || !studentId) return;

    try {
      const reinforcerSnap = await getDoc(
        doc(db, "institutions", instId, "students", studentId, "profiles", "abaReinforcers")
      );
      setReinforcerProfile(reinforcerSnap.exists() ? reinforcerSnap.data() as ReinforcerProfile : null);
    } catch (error) {
      console.error("Pekiştireç profili yenilenemedi:", error);
    }

    void refreshAssessmentData();
  };

  const refreshAssessmentData = async () => {
    const instId = localStorage.getItem("kazanim-takip-institution-id");
    if (!instId || !studentId) return;

    try {
      const assessmentSnap = await getDoc(
        doc(db, "institutions", instId, "students", studentId, "assessments", "aba")
      );
      setFormData(assessmentSnap.exists() ? assessmentSnap.data() : {});
    } catch (error) {
      console.error("ABA ilerleme bilgisi yenilenemedi:", error);
      toast.error("Modül ilerlemesi yenilenemedi.");
    }
  };

  const handleModuleBack = () => {
    setActiveModuleIndex(null);
    void refreshAssessmentData();
  };

  if (loading) return <LogoLoader fullScreen />;

  const reinforcerRankings = [...(reinforcerProfile?.rankings || [])]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 6);
  const reinforcersDetermined = reinforcerRankings.length === 6;

  // --- 1. MENÜ ---
  const renderModuleMenu = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {ABA_MODULES.map((module, index) => {
        const totalCount = module.achievements.length;
        const passedCount = module.achievements.filter((item) => formData[item] === true).length;
        const assessedCount = module.achievements.filter(
          (item) => formData[item] === true || formData[item] === false
        ).length;
        const percentage = totalCount === 0 ? 0 : Math.round((passedCount / totalCount) * 100);
        const isCompleted = totalCount > 0 && passedCount === totalCount;

        const tone = assessedCount === 0
          ? {
              card: 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/70',
              icon: 'border-slate-800 bg-slate-950 text-blue-400',
              value: 'text-slate-400',
            }
          : percentage >= 80
            ? {
                card: 'border-emerald-500/25 bg-emerald-950/10 hover:border-emerald-500/40 hover:bg-emerald-950/15',
                icon: 'border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-400',
                value: 'text-emerald-400',
              }
            : percentage >= 50
              ? {
                  card: 'border-amber-500/25 bg-amber-950/10 hover:border-amber-500/40 hover:bg-amber-950/15',
                  icon: 'border-amber-500/25 bg-amber-500/[0.08] text-amber-400',
                  value: 'text-amber-400',
                }
              : {
                  card: 'border-red-500/25 bg-red-950/10 hover:border-red-500/40 hover:bg-red-950/15',
                  icon: 'border-red-500/25 bg-red-500/[0.08] text-red-400',
                  value: 'text-red-400',
                };

        return (
          <div
            key={module.name}
            onClick={() => setActiveModuleIndex(index)}
            className={`group relative cursor-pointer rounded-2xl border p-6 transition-all duration-300 active:scale-[0.98] flex items-center gap-4 min-h-[120px] ${tone.card}`}
          >
            <div className={`rounded-xl border p-4 transition-colors ${tone.icon}`}>
              <ClipboardList size={28} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-slate-100 text-lg leading-snug">
                {module.name}
              </h3>
              <p className={`mt-1 text-sm font-bold ${tone.value}`}>
                Toplam %{percentage}
              </p>
              {isCompleted && (
                <p className="mt-1 text-xs font-semibold text-emerald-300/80">
                  Modül tamamlandı
                </p>
              )}
            </div>
            <ChevronRight size={21} className={`shrink-0 opacity-70 transition-transform group-hover:translate-x-1 ${tone.value}`} />
          </div>
        );
      })}
    </div>
  );

  // --- 2. İÇERİK YÖNLENDİRİCİSİ ---
  const renderActiveModuleContent = () => {
    if (activeModuleIndex === null || !studentId) return null;
    
    const module = ABA_MODULES[activeModuleIndex];
    const moduleName = module.name; // Tam adını alıyoruz (örn: "SÖZEL TAKLİT BECERİLERİ (ST)")

    let content;

    // ÖNEMLİ DÜZELTME: Sıralama ve Kontrol
    // Sözel Taklit kontrolü, normal Taklit kontrolünden ÖNCE olmalı.
    
    if (moduleName.includes("EŞLEME BECERİLERİ")) {
        content = <EslemePage studentId={studentId} onBack={handleModuleBack} />;
    } 
    else if (moduleName.includes("ALICI DİL BECERİLERİ")) {
        content = <AliciDilPage studentId={studentId} onBack={handleModuleBack} />;
    }
    else if (moduleName.includes("YÖNERGE TAKİP BECERİLERİ")) {
        content = <YonergeTakipPage studentId={studentId} onBack={handleModuleBack} />;
    }
    // DİKKAT: Sözel Taklit önce kontrol ediliyor!
    else if (moduleName.includes("SÖZEL TAKLİT BECERİLERİ")) {
         content = <SozelTaklitPage studentId={studentId} onBack={handleModuleBack} />;
    }
    // Sonra Motor Taklit (Normal Taklit) kontrol ediliyor
    else if (moduleName.includes("TAKLİT BECERİLERİ")) {
         content = <TaklitPage studentId={studentId} onBack={handleModuleBack} />;
    }
    else if (moduleName.includes("İFADE EDİCİ DİL BECERİLERİ")) {
         content = <IfadeEdiciDilPage studentId={studentId} onBack={handleModuleBack} />;
    }
    else if (moduleName.includes("ORTAK DİKKAT BECERİLERİ")) {
         content = (
           <OrtakDikkatPage
             studentId={studentId}
             onBack={handleModuleBack}
             onOpenReinforcers={() => {
               setActiveModuleIndex(null);
               setShowReinforcerPage(true);
             }}
           />
         );
    }
    else {
        // Eşleşme olmazsa burası çalışır
        content = (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                <Construction size={48} className="mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-slate-300">{moduleName}</h3>
                <p className="mt-2 text-sm">Bu modül sayfası yapım aşamasında.</p>
                <Button variant="outline" onClick={() => setActiveModuleIndex(null)} className="mt-6 border-slate-700">
                    Geri Dön
                </Button>
            </div>
        );
    }

    return (
        <div className="animate-in slide-in-from-right-8 duration-300">
            {content}
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 font-sans pb-20">
      
      {/* ANA HEADER */}
      {activeModuleIndex === null && !showReinforcerPage && (
        <header className="flex items-center justify-between mb-6 sticky top-0 bg-[#020617]/95 backdrop-blur z-20 py-3 border-b border-white/5">
            <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation(`/assessment/${studentId}`)} className="text-slate-400 hover:bg-slate-800 hover:text-white">
                <ArrowLeft />
            </Button>
            <div>
                <h1 className="text-lg font-bold tracking-tight">ABA Değerlendirme</h1>
                <p className="text-xs text-slate-400 font-medium">{formatStudentName(student?.name)}</p>
            </div>
            </div>
        </header>
      )}

      {/* İÇERİK ALANI */}
      <main className="max-w-4xl mx-auto">
        {showReinforcerPage && studentId ? (
            <Pekistirec
              studentId={studentId}
              studentName={student?.name}
              onBack={handleReinforcerBack}
            />
        ) : activeModuleIndex === null ? (
            <>
                <section
                  className={`mb-6 overflow-hidden rounded-3xl border transition-all ${
                    reinforcersDetermined
                      ? 'border-emerald-500/35 bg-emerald-500/10'
                      : 'border-amber-500/40 bg-amber-500/10'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setShowReinforcerPage(true)}
                    className="group w-full p-5 text-left active:scale-[0.995]"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`rounded-2xl border p-3 ${
                        reinforcersDetermined
                          ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                          : 'border-amber-500/30 bg-amber-500/15 text-amber-300'
                      }`}>
                        <Gift size={27} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-black text-white">Pekiştireç Belirleme</h2>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black ${
                            reinforcersDetermined
                              ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                              : 'border-amber-500/30 bg-amber-500/15 text-amber-300'
                          }`}>
                            {reinforcersDetermined ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                            {reinforcersDetermined ? 'BELİRLENDİ' : 'BELİRLENMEDİ'}
                          </span>
                        </div>

                        <p className="mt-1 text-sm leading-relaxed text-slate-300">
                          {reinforcersDetermined
                            ? 'Öğrencinin güncel 6 pekiştireci kayıtlı. Görüntülemek veya yeniden belirlemek için açın.'
                            : 'ABA çalışmalarına başlamadan önce öğrencinin en güçlü 6 pekiştirecini belirleyin.'}
                        </p>

                        {reinforcersDetermined && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {reinforcerRankings.map((item, index) => (
                              <span
                                key={`${item.id}-${index}`}
                                className="rounded-full border border-emerald-500/20 bg-slate-950/45 px-3 py-1.5 text-xs font-semibold text-emerald-100"
                              >
                                {index + 1}. {item.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <ChevronRight className={`mt-2 shrink-0 transition-transform group-hover:translate-x-1 ${
                        reinforcersDetermined ? 'text-emerald-400' : 'text-amber-400'
                      }`} />
                    </div>
                  </button>
                </section>

                <div className="flex items-center gap-2 mb-4 text-slate-400 text-sm font-medium px-1">
                    <LayoutGrid size={16} />
                    <span>Çalışma Modülleri</span>
                </div>
                {renderModuleMenu()}
            </>
        ) : (
            renderActiveModuleContent()
        )}
      </main>
    </div>
  );
}
