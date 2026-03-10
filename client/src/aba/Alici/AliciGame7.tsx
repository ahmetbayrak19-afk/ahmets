import { useState, useEffect } from 'react';
import { db } from '../../firebase'; // 🔥 Hata veren yol düzeltildi
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Search, Backpack, Star, Sparkles, User, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';

interface AliciGame7Props {
  studentId: string;
  onClose: () => void;
}

// OYUN KATEGORİLERİ
const GAMES = [
  {
    id: 'dedektif',
    title: 'Kayıp Not Defteri',
    role: 'Dedektif',
    desc: 'İpuçlarını takip et ve gizemi çöz!',
    icon: Search,
    color: 'from-blue-600 to-indigo-900',
    btnColor: 'bg-blue-600 hover:bg-blue-500',
    disabled: false
  },
  {
    id: 'canta',
    title: 'Okul Çantası',
    role: 'Öğrenci',
    desc: 'Okul için gerekli eşyaları topla!',
    icon: Backpack,
    color: 'from-orange-500 to-red-800',
    btnColor: 'bg-orange-600 hover:bg-orange-500',
    disabled: false
  },
  {
    id: 'gizemli_3',
    title: 'Gizli Bölüm 3',
    role: 'Kahraman',
    desc: 'Yeni macera çok yakında burada olacak.',
    icon: Star,
    color: 'from-slate-700 to-slate-900',
    btnColor: 'bg-slate-700',
    disabled: true
  },
  {
    id: 'gizemli_4',
    title: 'Gizli Bölüm 4',
    role: 'Kâşif',
    desc: 'Yeni macera çok yakında burada olacak.',
    icon: Sparkles,
    color: 'from-slate-700 to-slate-900',
    btnColor: 'bg-slate-700',
    disabled: true
  }
];

export default function AliciGame7({ studentId, onClose }: AliciGame7Props) {
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Hangi oyuna tıklandığını tutar (null ise menüdedir)
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  // --- ÖĞRENCİ VERİSİNİ ÇEK ---
  useEffect(() => {
    const instId = localStorage.getItem("kazanim-takip-institution-id");
    
    if (!studentId || !instId) {
        toast.error("Hatalı erişim!");
        onClose();
        return;
    }

    const fetchStudent = async () => {
      try {
        const studentRef = doc(db, "institutions", instId, "students", studentId);
        const docSnap = await getDoc(studentRef);
        
        if (docSnap.exists()) {
          setStudent({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast.error("Öğrenci bulunamadı!");
          onClose();
        }
      } catch (error) {
        console.error("Hata:", error);
        toast.error("Bir hata oluştu.");
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudent();
  }, [studentId, onClose]);

  // Yükleme Ekranı
  if (isLoading) {
    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center text-white">
            <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
            <span className="text-slate-400 font-medium tracking-widest uppercase text-sm animate-pulse">
                Öğrenci Dosyası Açılıyor...
            </span>
        </div>
    );
  }

  // Aktif oyun seçildiyse (İleride buraya oyunun asıl kodlarını koyacaksın)
  if (activeGameId) {
      const activeGame = GAMES.find(g => g.id === activeGameId);
      
      return (
          <div className={twMerge("fixed inset-0 z-[100] flex flex-col bg-gradient-to-br text-white", activeGame?.color)}>
              
              {/* Oyun İçi Üst Bar */}
              <div className="p-4 flex items-center gap-3 bg-black/30 backdrop-blur-md border-b border-white/10">
                  <button onClick={() => setActiveGameId(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                      <ArrowLeft size={24} />
                  </button>
                  <div className="flex-1 flex items-center justify-between">
                      <div>
                          <h1 className="font-bold text-lg">{activeGame?.title}</h1>
                          <p className="text-xs text-white/60">{student?.name} Görevde!</p>
                      </div>
                      
                      {/* Çocuğun mini profil fotoğrafı */}
                      {student?.photoUrl ? (
                          <img src={student.photoUrl} alt="Profil" className="w-10 h-10 rounded-full border-2 border-white/20 object-cover" />
                      ) : (
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20">
                              <User size={16} />
                          </div>
                      )}
                  </div>
              </div>

              {/* Oyun Alanı Yeri */}
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-500">
                  <activeGame.icon size={80} className="mb-6 opacity-80" />
                  <h2 className="text-3xl font-black mb-4">Görev Başlıyor!</h2>
                  <p className="text-lg text-white/80 max-w-md">
                      Burası <strong>{activeGame?.title}</strong> oyununun ana ekranı olacak. 
                      Şu an menü ve öğrenci bağlama mantığı başarıyla kuruldu.
                  </p>
                  
                  {/* Örnek Fotoğraf Kullanımı (Dedektif hissiyatı vb.) */}
                  <div className="mt-8 relative w-48 h-48 rounded-full border-4 border-white/20 overflow-hidden shadow-2xl">
                      <div className="absolute inset-0 bg-black/40 z-10 flex items-end justify-center pb-4">
                          <span className="bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
                              {activeGame?.role} {student?.name.split(' ')[0]}
                          </span>
                      </div>
                      {student?.photoUrl ? (
                          <img src={student.photoUrl} alt="Öğrenci" className="w-full h-full object-cover grayscale-[20%] contrast-125" />
                      ) : (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center"><User size={64} className="opacity-50" /></div>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  // --- ANA MENÜ EKRANI ---
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 text-white font-sans flex flex-col overflow-y-auto">
      
      {/* ÜST BAR */}
      <div className="shrink-0 p-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                <ArrowLeft size={24} />
            </button>
            <div>
                <h1 className="text-lg font-bold">Macera Seçimi</h1>
                <p className="text-xs text-slate-400">Öğrenci: <span className="text-white font-medium">{student?.name}</span></p>
            </div>
        </div>
      </div>

      {/* KATEGORİLER LİSTESİ */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
          
          {/* Öğrenci Karşılama Kartı */}
          <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/20 rounded-3xl p-6 sm:p-8 mb-8 flex items-center gap-6 shadow-2xl">
              {student?.photoUrl ? (
                  <img src={student.photoUrl} alt="Profil" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-blue-500/30 object-cover shadow-lg" />
              ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-800 flex items-center justify-center border-4 border-blue-500/30">
                      <User size={40} className="text-slate-500" />
                  </div>
              )}
              <div>
                  <h2 className="text-2xl sm:text-3xl font-black mb-1">Merhaba, {student?.name.split(' ')[0]}!</h2>
                  <p className="text-blue-200/70 text-sm sm:text-base">Bugün hangi maceraya atılmak istersin? Görevini seç ve başla.</p>
              </div>
          </div>

          <h3 className="text-slate-500 font-bold tracking-widest uppercase text-xs mb-4 px-2">Kullanılabilir Görevler</h3>

          {/* Oyun Kartları Grid'i */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {GAMES.map((game) => (
                  <div 
                      key={game.id} 
                      className={twMerge(
                          "relative overflow-hidden rounded-3xl border transition-all duration-300",
                          game.disabled 
                            ? "bg-slate-900/50 border-slate-800 opacity-60 grayscale" 
                            : "bg-slate-900 border-slate-700 hover:border-slate-500 hover:shadow-2xl hover:-translate-y-1 group cursor-pointer"
                      )}
                      onClick={() => !game.disabled && setActiveGameId(game.id)}
                  >
                      {/* Arka plan renk süsü */}
                      <div className={twMerge("absolute inset-0 bg-gradient-to-br opacity-10 transition-opacity duration-500 group-hover:opacity-20", game.color)}></div>
                      
                      <div className="p-6 sm:p-8 relative z-10 flex flex-col h-full">
                          <div className={twMerge("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg", game.disabled ? "bg-slate-800 text-slate-500" : game.btnColor)}>
                              <game.icon size={28} className={game.disabled ? "opacity-50" : "text-white"} />
                          </div>
                          
                          <h4 className="text-xl font-bold text-white mb-2">{game.title}</h4>
                          <p className="text-sm text-slate-400 leading-relaxed mb-6 flex-1">{game.desc}</p>
                          
                          <Button 
                              disabled={game.disabled}
                              className={twMerge(
                                  "w-full h-12 rounded-xl font-bold uppercase tracking-wider text-xs transition-all",
                                  game.disabled ? "bg-slate-800 text-slate-600" : game.btnColor
                              )}
                          >
                              {game.disabled ? 'Yakında' : <><PlayCircle size={18} className="mr-2" /> OYNA</>}
                          </Button>
                      </div>
                  </div>
              ))}
          </div>

      </div>
    </div>
  );
  }
