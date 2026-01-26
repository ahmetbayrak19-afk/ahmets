import { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useStudentData } from '@/hooks/useStudentData';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, BookOpen, Activity, ClipboardList, 
  BrainCircuit, MessageSquare, CheckCircle, ChevronRight, PenTool, X, Sparkles, Mic
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';

// Renk ve stil tanımları
const ASSESSMENT_TYPES = [
  { id: 'kavram', title: 'Kavram', subtitle: 'Değerlendirme', icon: BookOpen, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5', activeBorder: 'border-blue-500', activeBg: 'bg-blue-500/20' },
  { id: 'aba', title: 'ABA', subtitle: 'Değerlendirme', icon: Activity, color: 'text-green-400', border: 'border-green-500/20', bg: 'bg-green-500/5', activeBorder: 'border-green-500', activeBg: 'bg-green-500/20' },
  { id: 'ema', title: 'EMA', subtitle: 'Değerlendirme', icon: ClipboardList, color: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/5', activeBorder: 'border-orange-500', activeBg: 'bg-orange-500/20' },
  { id: 'dil', title: 'Dil', subtitle: 'Becerileri', icon: MessageSquare, color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/5', activeBorder: 'border-purple-500', activeBg: 'bg-purple-500/20' },
  // Okuma Yazma (Pembe Tema)
  { id: 'okuma-yazma', title: 'Okuma Yazma', subtitle: 'Becerileri', icon: PenTool, color: 'text-pink-400', border: 'border-pink-500/20', bg: 'bg-pink-500/5', activeBorder: 'border-pink-500', activeBg: 'bg-pink-500/20' },
  { id: 'bilissel', title: 'Bilişsel', subtitle: 'Beceriler', icon: BrainCircuit, color: 'text-yellow-400', border: 'border-yellow-500/20', bg: 'bg-yellow-500/5', activeBorder: 'border-yellow-500', activeBg: 'bg-yellow-500/20' },
];

export default function AssessmentPage() {
  const [match, params] = useRoute('/assessment/:id');
  const studentId = params?.id;
  const [_, setLocation] = useLocation();
  const { students } = useStudentData();
  const student = students.find(s => s.id === studentId);

  // STATE
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [step, setStep] = useState<'select' | 'start'>('select');
  
  // POPUP STATE
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'hece' | 'ses' | null>(null);

  if (!student) return null;

  // Seçim Mantığı
  const toggleSelection = (id: string) => {
    // Eğer tıklanan "Okuma Yazma" ise ve henüz seçili değilse -> MODAL AÇ
    if (id === 'okuma-yazma' && !selectedIds.includes('okuma-yazma')) {
      setShowMethodModal(true);
      return;
    }

    // Diğer kartlar veya seçim kaldırma işlemi
    setSelectedIds(prev => {
      // Eğer seçim kaldırılıyorsa ve bu 'okuma-yazma' ise, alt yöntemi de sıfırla
      if (prev.includes(id) && id === 'okuma-yazma') {
        setSelectedMethod(null);
      }
      return prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
    });
  };

  // Modaldan Seçim Yapılınca
  const confirmMethodSelection = (method: 'hece' | 'ses') => {
    setSelectedMethod(method);
    setSelectedIds(prev => [...prev, 'okuma-yazma']); // Kartı seçili hale getir
    setShowMethodModal(false); // Modalı kapat
  };

  // İleri Mantığı
  const handleNext = () => {
    if (selectedIds.length === 0) return;
    
    // Tek seçim varsa direkt git
    if (selectedIds.length === 1) {
      const selectedId = selectedIds[0];
      
      if (selectedId === 'okuma-yazma') {
        // Metodu da URL'e ekleyerek gönderiyoruz
        setLocation(`/${selectedId}-assessment/${studentId}?method=${selectedMethod || 'hece'}`);
      } else {
        setLocation(`/${selectedId}-assessment/${studentId}`);
      }
    } else {
      // Çoklu seçimde liste ekranına geç
      setStep('start');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 font-sans flex flex-col relative">
      
      {/* HEADER */}
      <header className="flex items-center gap-4 mb-6 max-w-lg mx-auto w-full pt-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => step === 'start' ? setStep('select') : setLocation('/home')} 
          className="text-slate-400 hover:bg-slate-800 h-8 w-8"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-xl font-bold leading-tight">
            {step === 'select' ? 'Program Seçimi' : 'Başlangıç'}
          </h1>
          <p className="text-xs text-slate-400">
            {step === 'select' ? student.name : 'Hangisiyle başlamak istersin?'}
          </p>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-lg mx-auto w-full flex-1 pb-20">
        
        {/* AŞAMA 1: KART SEÇİMİ (2 SÜTUNLU GRİD) */}
        {step === 'select' && (
          <div className="grid grid-cols-2 gap-3 animate-in fade-in zoom-in duration-300">
            {ASSESSMENT_TYPES.map((type) => {
              const isSelected = selectedIds.includes(type.id);
              return (
                <button 
                  key={type.id} 
                  onClick={() => toggleSelection(type.id)}
                  className={twMerge(
                    "relative group flex flex-col items-center text-center justify-center p-4 rounded-xl border transition-all duration-200 h-32",
                    isSelected 
                      ? `${type.activeBorder} ${type.activeBg} shadow-[0_0_15px_rgba(0,0,0,0.3)] scale-[1.02] z-10` 
                      : `${type.border} ${type.bg} opacity-80 hover:opacity-100 hover:bg-opacity-20`
                  )}
                >
                  {/* Seçildi İşareti */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-0.5 animate-in zoom-in spin-in-90 duration-300">
                      <CheckCircle size={14} fill="white" className="text-green-600" />
                    </div>
                  )}

                  {/* Eğer Okuma Yazma seçildiyse hangi yöntem olduğunu göster */}
                  {isSelected && type.id === 'okuma-yazma' && selectedMethod && (
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-pink-500/20 border border-pink-500/50 rounded text-[9px] text-pink-300 uppercase font-bold tracking-tighter">
                      {selectedMethod}
                    </div>
                  )}

                  {/* İkon */}
                  <div className={twMerge(
                    "p-2.5 rounded-full bg-slate-900 border mb-2 transition-transform duration-200",
                    isSelected ? "border-white/20 scale-110" : "border-white/5 group-hover:-translate-y-1"
                  )}>
                    <type.icon className={`w-6 h-6 ${type.color}`} />
                  </div>

                  {/* Yazılar */}
                  <h3 className={twMerge("text-sm font-bold leading-none mb-1", isSelected ? "text-white" : "text-slate-200")}>
                    {type.title}
                  </h3>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                    {type.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* AŞAMA 2: BAŞLANGIÇ PROGRAMI SEÇİMİ (LİSTE GÖRÜNÜMÜ) */}
        {step === 'start' && (
          <div className="space-y-3 animate-in slide-in-from-right duration-300">
             {ASSESSMENT_TYPES.filter(t => selectedIds.includes(t.id)).map((type) => (
               <button
                key={type.id}
                onClick={() => {
                   if (type.id === 'okuma-yazma') {
                       setLocation(`/${type.id}-assessment/${studentId}?method=${selectedMethod || 'hece'}`);
                   } else {
                       setLocation(`/${type.id}-assessment/${studentId}`);
                   }
                }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border ${type.border} ${type.bg} hover:bg-opacity-20 hover:pl-5 transition-all group text-left`}
               >
                 <div className="p-2 rounded-full bg-slate-950 border border-white/10">
                    <type.icon className={`w-5 h-5 ${type.color}`} />
                 </div>
                 <div className="flex-1">
                   <span className="text-sm font-bold text-white block">
                     {type.title} {type.subtitle}
                     {/* Okuma Yazma için ek bilgi */}
                     {type.id === 'okuma-yazma' && selectedMethod && (
                       <span className="ml-2 text-[10px] font-normal text-pink-300 bg-pink-500/10 px-1.5 py-0.5 rounded border border-pink-500/20">
                         {selectedMethod === 'hece' ? 'Hece Yöntemi' : 'Ses Yöntemi'}
                       </span>
                     )}
                   </span>
                   <span className="text-[10px] text-slate-400">Başlamak için dokun</span>
                 </div>
                 <ChevronRight size={18} className="text-slate-500 group-hover:text-white" />
               </button>
             ))}
             
             <button 
               onClick={() => setStep('select')}
               className="w-full text-center text-xs text-slate-500 mt-6 hover:text-slate-300 transition-colors"
             >
               Program seçimini değiştir
             </button>
          </div>
        )}

      </main>

      {/* ALT BUTON */}
      {step === 'select' && (
        <div className="fixed bottom-6 left-0 right-0 px-6 z-40 pointer-events-none">
          <div className="max-w-lg mx-auto pointer-events-auto">
            <Button 
              onClick={handleNext} 
              disabled={selectedIds.length === 0}
              className={twMerge(
                "w-full h-12 rounded-2xl shadow-xl text-sm font-bold transition-all duration-300",
                selectedIds.length > 0 
                  ? "bg-blue-600 hover:bg-blue-500 text-white translate-y-0 opacity-100" 
                  : "bg-slate-800 text-slate-500 translate-y-2 opacity-0"
              )}
            >
              Devam Et ({selectedIds.length}) <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* --- YÖNTEM SEÇİM MODALI (POPUP) --- */}
      {showMethodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
          {/* Arka Plan Karartma */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowMethodModal(false)}
          ></div>
          
          {/* Modal İçeriği */}
          <div className="bg-slate-900 border border-pink-500/30 w-full max-w-sm rounded-2xl p-6 relative shadow-2xl shadow-pink-900/20 animate-in zoom-in-95 duration-200">
            
            {/* Kapat Butonu */}
            <button 
              onClick={() => setShowMethodModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X size={20} />
            </button>

            {/* Başlık */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-pink-500/20">
                <PenTool className="text-pink-400 w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Öğretim Yöntemi</h3>
              <p className="text-xs text-slate-400 px-4">
                Öğrenciniz için hangi okuma yazma öğretim yöntemini kullanmak istersiniz?
              </p>
            </div>

            {/* Seçenekler */}
            <div className="space-y-3">
              <button
                onClick={() => confirmMethodSelection('hece')}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-pink-500/10 hover:border-pink-500/50 transition-all group text-left"
              >
                 <div className="p-2.5 rounded-full bg-slate-950 border border-slate-800 group-hover:border-pink-500/30">
                    <Sparkles className="w-5 h-5 text-pink-400" />
                 </div>
                 <div>
                   <span className="text-sm font-bold text-white block group-hover:text-pink-300 transition-colors">Hece Yöntemi</span>
                   <span className="text-[10px] text-slate-400">Ba-Sa-Ra sistemi ile öğretim</span>
                 </div>
                 <ChevronRight className="ml-auto text-slate-600 group-hover:text-pink-400" size={16} />
              </button>

              <button
                onClick={() => confirmMethodSelection('ses')}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all group text-left"
              >
                 <div className="p-2.5 rounded-full bg-slate-950 border border-slate-800 group-hover:border-blue-500/30">
                    <Mic className="w-5 h-5 text-blue-400" />
                 </div>
                 <div>
                   <span className="text-sm font-bold text-white block group-hover:text-blue-300 transition-colors">Ses Yöntemi</span>
                   <span className="text-[10px] text-slate-400">Ses temelli klasik öğretim</span>
                 </div>
                 <ChevronRight className="ml-auto text-slate-600 group-hover:text-blue-400" size={16} />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
   }
                   
