import { useState, useEffect, useMemo } from 'react';
import { useRoute, useLocation } from 'wouter';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, collection, query, arrayUnion, orderBy } from 'firebase/firestore'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Target, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export default function StudentDashboard() {
  const [match, params] = useRoute('/student/:id');
  const [_, setLocation] = useLocation();
  
  const [student, setStudent] = useState<any>(null);
  const [modulesList, setModulesList] = useState<any[]>([]);
  const [achievementsMap, setAchievementsMap] = useState<Record<string, any[]>>({});
  
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [loading, setLoading] = useState(true);

  const currentTeacherName = localStorage.getItem("kazanim-takip-teacher-name");

  // --- 1. ADIM: ÖĞRENCİ VE MODÜL LİSTESİNİ DİNLE ---
  useEffect(() => {
    const instId = localStorage.getItem("kazanim-takip-institution-id");
    if (!params?.id || !instId) return;

    const studentRef = doc(db, "institutions", instId, "students", params.id);
    const unsubStudent = onSnapshot(studentRef, (docSnap) => {
      if (docSnap.exists()) {
        setStudent({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    });

    const modulesRef = collection(db, "institutions", instId, "modules");
    const q = query(modulesRef, orderBy("order", "asc")); 
    
    const unsubModules = onSnapshot(q, (snapshot) => {
      const mods = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setModulesList(mods);
    });

    return () => {
      unsubStudent();
      unsubModules();
    };
  }, [params?.id]);

  // --- 2. ADIM: KAZANIMLARI DİNLE ---
  useEffect(() => {
    const instId = localStorage.getItem("kazanim-takip-institution-id");
    if (!instId || modulesList.length === 0) return;

    const unsubscribers: (() => void)[] = [];

    modulesList.forEach((mod) => {
      const achRef = collection(db, "institutions", instId, "modules", mod.id, "achievements");
      const q = query(achRef, orderBy("order", "asc"));

      const unsub = onSnapshot(q, (snapshot) => {
        const orderedAchievements = snapshot.docs.map(a => ({ id: a.id, ...a.data() }));
        setAchievementsMap(prev => ({
          ...prev,
          [mod.id]: orderedAchievements
        }));
      });

      unsubscribers.push(unsub);
    });

    return () => {
      unsubscribers.forEach(u => u());
    };
  }, [modulesList]);

  // --- VERİ BİRLEŞTİRME ---
  const activeTargets = useMemo(() => {
    if (!student || modulesList.length === 0) return [];
    
    return modulesList.map(mod => {
      const achievements = achievementsMap[mod.id] || [];
      const monthProgress = student.monthlyProgress?.[selectedMonth] || {};
      
      const todoAchievements = achievements.filter((ach: any) => {
        const status = monthProgress[ach.id];
        return status !== 'success';
      });

      const visibleAchievements = todoAchievements.slice(0, 2);

      return { ...mod, achievements: visibleAchievements };
    })
    .filter(mod => mod.achievements.length > 0);
  }, [student, modulesList, achievementsMap, selectedMonth]);

  const handleUpdateStatus = async (achievementId: string, status: string) => {
    const instId = localStorage.getItem("kazanim-takip-institution-id");
    if (!student || !instId || !currentTeacherName) return;

    try {
      const studentRef = doc(db, "institutions", instId, "students", student.id);
      
      const updatedProgress = { 
        ...(student.monthlyProgress || {}),
        [selectedMonth]: { ...(student.monthlyProgress?.[selectedMonth] || {}), [achievementId]: status }
      };

      await updateDoc(studentRef, { 
        monthlyProgress: updatedProgress,
        associatedTeacherIds: arrayUnion(currentTeacherName) 
      });

      toast.success("Kazanım güncellendi");
    } catch (e) { toast.error("Hata!"); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-white">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
      <span className="italic text-slate-400">Öğrenci dosyası hazırlanıyor...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans pb-20">
      <header className="border-b border-white/10 p-4 flex items-center justify-between sticky top-0 bg-[#020617]/90 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          {/* SORUN 3 ÇÖZÜMÜ: Geri Tuşu */}
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-lg font-bold">{student?.name}</h1>
            <p className="text-xs text-slate-400">{student?.age ? `${student.age} Yaş` : ''} {student?.diagnosis ? `- ${student.diagnosis}` : ''}</p>
          </div>
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[120px] bg-slate-900 border-slate-800"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-white">
            {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-8 mt-4">
        <div className="flex items-center gap-2 mb-6">
          <Target className="text-blue-500 w-6 h-6" />
          <h2 className="text-xl font-bold uppercase tracking-tight">Kazanım Hedefleri</h2>
        </div>

        {activeTargets.map((mod) => (
          <div key={mod.id} className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest pl-1" style={{ color: mod.color || '#60a5fa' }}>
              {mod.name}
            </h3>
            <div className="space-y-2">
            {mod.achievements.map((ach: any) => {
              const status = student.monthlyProgress?.[selectedMonth]?.[ach.id];

              return (
                <Card key={ach.id} className="bg-slate-900 border-slate-800 border-l-4 transition-all" style={{ borderLeftColor: mod.color || '#334155' }}>
                  <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-start gap-3">
                       <span className="font-medium text-sm sm:text-base text-slate-200">
                         {ach.name}
                       </span>
                    </div>
                    
                    <div className="flex w-full sm:w-auto gap-2">
                      <Button size="sm" onClick={() => handleUpdateStatus(ach.id, 'fail')} className={clsx("flex-1 sm:w-24 h-9 border border-white/5", status === 'fail' ? "bg-red-600 hover:bg-red-700" : "bg-slate-800 text-slate-400 hover:bg-slate-700")}>
                        Yapamıyor
                      </Button>
                      <Button size="sm" onClick={() => handleUpdateStatus(ach.id, 'working')} className={clsx("flex-1 sm:w-24 h-9 border border-white/5", status === 'working' ? "bg-orange-600 hover:bg-orange-700" : "bg-slate-800 text-slate-400 hover:bg-slate-700")}>
                        Çalışılıyor
                      </Button>
                      <Button size="sm" onClick={() => handleUpdateStatus(ach.id, 'success')} className="flex-1 sm:w-24 h-9 border border-white/5 bg-slate-800 text-slate-400 hover:bg-green-600 hover:text-white">
                        <CheckCircle2 size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            </div>
          </div>
        ))}

        {!loading && activeTargets.length === 0 && (
          <div className="text-center p-12 bg-green-900/10 border border-green-900/20 rounded-3xl">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <p className="text-green-400 font-bold text-lg">Tebrikler!</p>
            <p className="text-green-500/60 mt-2">Bu ay için tüm hedefler tamamlandı.</p>
          </div>
        )}
      </main>
    </div>
  );
        }
                                                   
