import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, PenTool, Construction } from 'lucide-react';

export default function OkumayazmaAssessmentPage() {
  // AssessmentPage'den gelen link yapısına göre route'u karşılıyoruz
  // Eğer önceki sayfada ID'yi 'okuma-yazma' yaptıysak route url'i muhtemelen şöyle gelecektir:
  const [match, params] = useRoute('/okuma-yazma-assessment/:id');
  const studentId = params?.id;
  const [_, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);

  // Sahte yükleme efekti (Sayfa geçişi yumuşak olsun diye)
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Geri Dönme Fonksiyonu
  const handleBack = () => {
    // Öğrencinin ana değerlendirme menüsüne döner
    if (studentId) {
      setLocation(`/assessment/${studentId}`);
    } else {
      setLocation('/home');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="animate-spin text-pink-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 font-sans flex flex-col">
      
      {/* HEADER (SABİT ÜST KISIM) */}
      <div className="max-w-3xl mx-auto w-full">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between sticky top-0 backdrop-blur-md z-10 shadow-lg mb-8">
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
                      Okuma Yazma Becerileri
                    </h2>
                    <p className="text-xs text-slate-400">
                        Değerlendirme Modülü
                    </p>
                </div>
            </div>
            
            {/* Sağ tarafta boşluk veya ileride eklenecek buton için yer tutucu */}
            <div className="w-8"></div> 
        </div>

        {/* BOŞ İÇERİK ALANI (PLACEHOLDER) */}
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center space-y-6 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
            
            <div className="relative group cursor-default">
              {/* Arkadaki parlama efekti */}
              <div className="absolute inset-0 bg-pink-500 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 rounded-full"></div>
              
              <div className="relative bg-slate-900 border border-slate-700 p-6 rounded-full shadow-2xl">
                <Construction className="w-12 h-12 text-pink-400 animate-pulse" />
              </div>
            </div>

            <div className="max-w-sm space-y-3">
              <h3 className="text-xl font-bold text-white">Hazırlık Aşamasında</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Bu modül için <strong>Hece Yöntemi (Ba-Sa-Ra)</strong> ve <strong>Ses Temelli Cümle Yöntemi</strong> altyapısı hazırlanmaktadır.
              </p>
            </div>

            {/* İleride eklenecek butonlar için silik yer tutucular */}
            <div className="flex gap-3 mt-4 opacity-30 grayscale pointer-events-none select-none">
               <div className="h-9 w-28 bg-slate-700/50 rounded-lg"></div>
               <div className="h-9 w-28 bg-slate-700/50 rounded-lg"></div>
            </div>

        </div>
      </div>
    </div>
  );
}
