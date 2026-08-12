import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useStudentData } from '@/hooks/useStudentData';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2, ClipboardList, LayoutGrid, Construction, Gift, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
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
  };

  const handleSave = async () => {
    const instId = localStorage.getItem("kazanim-takip-institution-id");
    await setDoc(doc(db, "institutions", instId!, "students", studentId!, "assessments", "aba"), formData);
    toast.success("Genel ilerleme kaydedildi!");
  };

  if (loading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-blue-500"><Loader2 className="animate-spin" size={40}/></div>;

  const reinforcerRankings = [...(reinforcerProfile?.rankings || [])]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 6);
  const reinforcersDetermined = reinforcerRankings.length === 6;

  // --- 1. MENÜ ---
  const renderModuleMenu = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {ABA_MODULES.map((module, index) => (
        <div 
          key={module.name}
          onClick={() => setActiveModuleIndex(index)}
          className="group relative bg-slate-900/40 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/30 rounded-2xl p-6 cursor-pointer transition-all duration-300 active:scale-[0.98] flex items-center gap-4 min-h-[120px]"
        >
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 group-hover:border-blue-500/50 transition-colors">
            <ClipboardList size={28} className="text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-lg group-hover:text-blue-400 transition-colors">
              {module.name}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {module.achievements.length} Kazanım
            </p>
          </div>
          <div className="absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500">
              ➔
          </div>
        </div>
      ))}
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
        content = <EslemePage studentId={studentId} onBack={() => setActiveModuleIndex(null)} />;
    } 
    else if (moduleName.includes("ALICI DİL BECERİLERİ")) {
        content = <AliciDilPage studentId={studentId} onBack={() => setActiveModuleIndex(null)} />;
    }
    else if (moduleName.includes("YÖNERGE TAKİP BECERİLERİ")) {
        content = <YonergeTakipPage studentId={studentId} onBack={() => setActiveModuleIndex(null)} />;
    }
    // DİKKAT: Sözel Taklit önce kontrol ediliyor!
    else if (moduleName.includes("SÖZEL TAKLİT BECERİLERİ")) {
         content = <SozelTaklitPage studentId={studentId} onBack={() => setActiveModuleIndex(null)} />;
    }
    // Sonra Motor Taklit (Normal Taklit) kontrol ediliyor
    else if (moduleName.includes("TAKLİT BECERİLERİ")) {
         content = <TaklitPage studentId={studentId} onBack={() => setActiveModuleIndex(null)} />;
    }
    else if (moduleName.includes("İFADE EDİCİ DİL BECERİLERİ")) {
         content = <IfadeEdiciDilPage studentId={studentId} onBack={() => setActiveModuleIndex(null)} />;
    }
    else if (moduleName.includes("ORTAK DİKKAT BECERİLERİ")) {
         content = <OrtakDikkatPage studentId={studentId} onBack={() => setActiveModuleIndex(null)} />;
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
                <p className="text-xs text-slate-400 font-medium">{student?.name}</p>
            </div>
            </div>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 h-9 px-4 text-xs shadow-lg shadow-green-900/20 transition-all active:scale-95">
                <Save className="mr-2 h-4 w-4" /> Kaydet
            </Button>
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
