import { useState } from 'react';
import { ArrowLeft, GraduationCap, Heart, Users, User, Settings, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

// --- KATEGORİLER (SABİT) ---
const CATEGORIES = [
  { id: 'ogretmen', label: 'Öğretmenlerim', icon: GraduationCap, color: 'bg-blue-100 text-blue-600 border-blue-200' },
  { id: 'aile', label: 'Ailem', icon: Heart, color: 'bg-red-100 text-red-600 border-red-200' },
  { id: 'arkadas', label: 'Arkadaşlarım', icon: Users, color: 'bg-green-100 text-green-600 border-green-200' },
  { id: 'tanidik', label: 'Tanıdıklarım', icon: User, color: 'bg-orange-100 text-orange-600 border-orange-200' },
];

interface GameProps {
  onClose: () => void;
}

export default function AliciGame4({ onClose }: GameProps) {
  // Sadece Menü Görüntüleme State'i
  const [view, setView] = useState<'menu'>('menu');

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col font-sans overflow-hidden">
      
      {/* ÜST BAR */}
      <div className="bg-white border-b p-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                <ArrowLeft size={20} className="text-slate-600"/>
            </button>
            <h1 className="text-xl font-bold text-slate-800">
                İnsan Tanıma (TEST MODU)
            </h1>
        </div>
        <div className="px-4 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold border border-yellow-200">
            BAĞLANTI KONTROL
        </div>
      </div>

      {/* --- MENÜ --- */}
      <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {CATEGORIES.map(cat => (
                  <div key={cat.id} className={`p-6 rounded-2xl border-2 ${cat.color} bg-white shadow-sm hover:shadow-md transition-all flex flex-col gap-4`}>
                      <div className="flex justify-between items-start">
                          <div className={`p-3 rounded-xl ${cat.color.split(' ')[0]}`}>
                              <cat.icon size={32} />
                          </div>
                          <span className="text-2xl font-black">0</span>
                      </div>
                      <div>
                          <h3 className="text-lg font-bold">{cat.label}</h3>
                          <p className="text-xs opacity-70 mb-4">Sistem Test Ediliyor...</p>
                          <div className="flex gap-2">
                              <Button variant="outline" className="flex-1 bg-white">
                                  <Settings size={16} className="mr-2"/> Düzenle
                              </Button>
                              <Button className="flex-1">
                                  <Play size={16} className="mr-2"/> Oyna
                              </Button>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
          
          <div className="mt-10 p-4 bg-green-100 text-green-800 rounded-xl text-center border border-green-200 font-bold">
              Eğer bu ekranı görüyorsan kod çalışıyor demektir.
          </div>
      </div>
    </div>
  );
}
